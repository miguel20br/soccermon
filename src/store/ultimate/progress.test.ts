import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '../../engine/config';
import { FORMATIONS } from '../../engine/formations';
import { createInstance, type PokemonInstance, slotRating, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { PlayerSummary } from '../../engine/runners/batch-runner';
import { metalOf } from '../../ui/rarity';
import { chemistry } from './chemistry';
import { evoPaths, evoPreview, evoReady } from './evolutions';
import { countObjectives, newObjectives, nextReset, type ObjectiveMatch, objectivesAt } from './objectives';
import {
    CUP_BRIDGE_DAY_MAX,
    EVO_STEP,
    FICHAS_PACK_PRICE,
    OBJECTIVES,
    PICK_PRICE,
    STARTERS,
    TEAM_SIZE,
    TRAIN_STEPS,
} from './rules';
import {
    bridgePays,
    buyCard,
    buyPack,
    cupBridge,
    evolveCard,
    fillTeam,
    finishMatch,
    homeTeam,
    isKeeperSpecies,
    metalPools,
    newUltimate,
    openPack,
    packsReady,
    redeem,
    startEvo,
    type UltimateSave,
    ultimateRival,
} from './ultimate';

// segunda, 02/11/2026, meio-dia em Brasília
const MON = Date.UTC(2026, 10, 2, 15);
const DAY = 24 * 60 * 60 * 1000;

const card = (id: number, uid = `c${id}`): PokemonInstance => ({
    ...createInstance(id, new Rng('t', uid)),
    uid,
    shiny: false,
});
const keeper = (c: PokemonInstance) => viewInstance(c).positions.includes('GK');

describe('time inicial por posição', () => {
    it('o gol fica com quem joga no gol, e cada carta vai pra vaga em que rende mais', () => {
        const gk = SPECIES_GK();
        // três de linha (ninguém joga no gol)
        const field = [25, 6, 65, 26, 130, 68, 59]
            .filter((id) => !isKeeperSpecies(id))
            .slice(0, 3)
            .map((id) => card(id));
        expect(field).toHaveLength(3);
        const empty = newUltimate('pos', MON).team;
        // o goleiro chega por último e mesmo assim vai pro gol
        const t = fillTeam(empty, [...field, card(gk)]);
        expect(t.order[0]).toBe(`c${gk}`);
        expect(t.order).toHaveLength(4);
        // a distribuição é a melhor: trocar quaisquer duas de linha de vaga não soma mais nota
        const slots = FORMATIONS[empty.formation].slots;
        const by = new Map(field.map((c) => [c.uid, c]));
        const r = (i: number, uid: string) => slotRating(by.get(uid)!, slots[i]);
        for (let i = 1; i < 4; i++)
            for (let j = i + 1; j < 4; j++)
                expect(r(i, t.order[i]) + r(j, t.order[j])).toBeGreaterThanOrEqual(r(i, t.order[j]) + r(j, t.order[i]));
    });

    it('nunca tira quem já está no time: só enche as vagas vazias', () => {
        const team = { ...newUltimate('pos', MON).team, order: ['a', 'b', 'c', 'd', 'e', 'f'] };
        const t = fillTeam(team, [card(1), card(2)]);
        expect(t.order.slice(0, 6)).toEqual(team.order);
        expect(t.order).toHaveLength(TEAM_SIZE);
        expect(fillTeam({ ...team, order: [...team.order, 'g'] }, [card(3)]).order).toHaveLength(TEAM_SIZE);
    });

    it('o 1º pacote sempre traz um goleiro, e ele nasce no gol', () => {
        for (const salt of 'abcdefghijklmnop') {
            let u = openPack(newUltimate(salt, MON), MON)!.u;
            const byUid = new Map(u.cards.map((c) => [c.uid, c]));
            expect(keeper(byUid.get(u.team.order[0])!)).toBe(true);
            u = openPack(u, MON)!.u;
            expect(u.team.order).toHaveLength(2 * 3);
            expect(keeper(u.cards.find((c) => c.uid === u.team.order[0])!)).toBe(true);
        }
    });
});

/** Um goleiro de verdade da Gen 1 (pra não depender de número fixo). */
function SPECIES_GK() {
    return [...metalPools().bronze, ...metalPools().prata].find(isKeeperSpecies)!;
}

describe('objetivos diários e semanais (relógio injetado)', () => {
    const win: ObjectiveMatch = { outcome: 'win', level: 'normal', goals: 1, noGold: false };

    it('completa uma vez só por período; o dia novo zera os diários e mantém os semanais', () => {
        let g = newObjectives(MON);
        const r1 = countObjectives(g, win, MON);
        expect(r1.completed.map((o) => o.id)).toContain('d-win');
        g = r1.g;
        // de novo no mesmo dia: o d-win já pagou
        expect(countObjectives(g, win, MON + 1000).completed.map((o) => o.id)).not.toContain('d-win');
        // terça: os diários voltam do zero, o semanal segue contando
        const tue = objectivesAt(g, MON + DAY);
        expect(tue.done).not.toContain('d-win');
        expect(tue.prog['d-win']).toBeUndefined();
        expect(tue.prog['w-win']).toBe(1);
        expect(countObjectives(g, win, MON + DAY).completed.map((o) => o.id)).toContain('d-win');
        // domingo ainda é a mesma semana; a segunda seguinte zera os semanais
        expect(objectivesAt(g, MON + 6 * DAY).prog['w-win']).toBe(1);
        expect(objectivesAt(g, MON + 7 * DAY).prog['w-win']).toBeUndefined();
    });

    it('a contagem pro próximo: meia-noite de Brasília e a segunda seguinte', () => {
        expect(nextReset(MON, 'day')).toBe(Date.UTC(2026, 10, 3, 3));
        expect(nextReset(MON + 3 * DAY, 'week')).toBe(Date.UTC(2026, 10, 9, 3));
        expect(objectivesAt(newObjectives(MON), nextReset(MON, 'day')).day).toBe('2026-11-03');
    });

    it('a virada é à meia-noite de Brasília, não à do UTC', () => {
        const g = countObjectives(newObjectives(MON), win, MON).g;
        // 23h30 de segunda em Brasília = 02h30 de terça no UTC: ainda segunda
        expect(objectivesAt(g, Date.UTC(2026, 10, 3, 2, 30)).done).toContain('d-win');
        expect(objectivesAt(g, Date.UTC(2026, 10, 3, 3, 30)).done).not.toContain('d-win');
    });

    it('a restrição conta só quando vale: Difícil ou Mestre, titulares sem Ouro', () => {
        const g = newObjectives(MON);
        const at = (m: Partial<ObjectiveMatch>) => countObjectives(g, { ...win, ...m }, MON).g.prog;
        expect(at({ level: 'normal' })['w-hard']).toBe(0);
        expect(at({ level: 'mestre' })['w-hard']).toBe(1);
        expect(at({ level: 'mestre', outcome: 'draw' })['w-hard']).toBe(0);
        expect(at({ noGold: false })['w-nogold']).toBe(0);
        expect(at({ noGold: true })['w-nogold']).toBe(1);
        expect(at({ goals: 9 })['d-goals']).toBe(OBJECTIVES.find((o) => o.id === 'd-goals')!.goal);
    });

    it('a partida paga o prêmio do objetivo: Fichas e pacote', () => {
        const u = live(ready());
        const goals = OBJECTIVES.find((o) => o.id === 'd-goals')!;
        const out = finishMatch(u, { score: [goals.goal, 0], shootout: null }, MON);
        expect(out.last?.objectives).toEqual(expect.arrayContaining(['d-win', 'd-goals']));
        // o prêmio espera nos Pendentes até o Resgatar
        expect(out.extraPacks).toBe(u.extraPacks);
        expect(out.pending).toContainEqual(
            expect.objectContaining({ kind: 'prize', ref: 'd-goals', packs: goals.packs }),
        );
        const got = redeem(out);
        expect(got.extraPacks).toBe(u.extraPacks + goals.packs);
        expect(packsReady(got, MON)).toBe(packsReady(u, MON) + goals.packs);
        expect(got.pending.filter((p) => p.kind === 'prize')).toEqual([]);
    });
});

/** Time pronto (2 pacotes de boas-vindas). */
function ready(salt = 'p'): UltimateSave {
    let u = newUltimate(salt, MON);
    u = openPack(u, MON)!.u;
    return openPack(u, MON)!.u;
}
function live(u: UltimateSave): UltimateSave {
    return {
        ...u,
        live: {
            n: 0,
            level: 'normal',
            home: homeTeam(u, 'Eu', 0),
            rival: ultimateRival(u.salt, 0, 'normal', 60),
            orders: [],
            tick: 0,
            engine: ENGINE_VERSION,
        },
    };
}

describe('loja: pontos de pacote e Fichas', () => {
    it('pontos compram a carta Normal escolhida, pelo preço do metal; sem pontos ou repetida, não', () => {
        const u = ready();
        const id = metalPools().ouro.find((x) => !u.cards.some((c) => c.speciesId === x))!;
        expect(buyCard({ ...u, packPoints: PICK_PRICE.ouro - 1 }, id)).toBeNull();
        const r = buyCard({ ...u, packPoints: PICK_PRICE.ouro + 3 }, id)!;
        expect(r.u.packPoints).toBe(3);
        expect(r.card).toMatchObject({ speciesId: id, shiny: false });
        expect(r.card.special).toBeUndefined();
        expect(metalOf(viewInstance(r.card).overall)).toBe('ouro');
        expect(r.u.cards.at(-1)).toEqual(r.card);
        // a mesma de novo: você já tem
        expect(buyCard({ ...r.u, packPoints: 999 }, id)).toBeNull();
        // bronze custa menos que prata, que custa menos que ouro
        expect(PICK_PRICE.bronze).toBeLessThan(PICK_PRICE.prata);
        expect(PICK_PRICE.prata).toBeLessThan(PICK_PRICE.ouro);
    });

    it('Fichas compram Pacote Mini extra, que abre mesmo sem pacote grátis', () => {
        let u = ready();
        expect(packsReady(u, MON)).toBe(0);
        expect(buyPack({ ...u, fichas: FICHAS_PACK_PRICE - 1 })).toBeNull();
        u = buyPack({ ...u, fichas: FICHAS_PACK_PRICE + 1 })!;
        expect(u).toMatchObject({ fichas: 1, extraPacks: 1 });
        const o = openPack(u, MON)!;
        expect(o.u.extraPacks).toBe(0);
        expect(openPack(o.u, MON)).toBeNull();
    });
});

describe('ponte da Copa', () => {
    it(`título = 1 Pacote Mini, até ${CUP_BRIDGE_DAY_MAX} por dia; o dia novo libera de novo`, () => {
        let u = ready();
        for (let i = 0; i < CUP_BRIDGE_DAY_MAX; i++) {
            // o aviso no resultado da Copa: só quando o título paga de verdade
            expect(bridgePays(u, MON + i * 1000)).toBe(true);
            u = cupBridge(u, MON + i * 1000);
        }
        expect(bridgePays(u, MON + 5000)).toBe(false);
        for (let i = 0; i < 2; i++) u = cupBridge(u, MON + i * 1000);
        expect(u.extraPacks).toBe(CUP_BRIDGE_DAY_MAX);
        u = cupBridge(u, MON + DAY);
        expect(u.extraPacks).toBe(CUP_BRIDGE_DAY_MAX + 1);
    });
});

/** A linha da partida de um jogador do seu time. */
const line = (uid: string, s: Partial<PlayerSummary['stats']> = {}): PlayerSummary => ({
    idx: 0,
    team: 0,
    uid,
    speciesId: 1,
    name: '',
    role: 'ALA',
    shiny: false,
    captain: false,
    item: null,
    energy: 1,
    stats: {
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passesCompleted: 0,
        tackles: 0,
        tacklesWon: 0,
        interceptions: 0,
        saves: 0,
        movesUsed: 0,
        ...s,
    },
});

/** Joga partidas até o passo da Evolução de `uid` ficar pronto e evolui; repete até acabar. */
function runEvo(u: UltimateSave, uid: string): UltimateSave {
    for (let guard = 0; guard < 20 && u.evos.some((e) => e.uid === uid); guard++) {
        const e = u.evos.find((x) => x.uid === uid)!;
        if (evoReady(e)) {
            u = evolveCard(u, uid)!.u;
            continue;
        }
        const stats = e.role === 'GK' ? { saves: EVO_STEP.saves } : { goals: EVO_STEP.goals };
        u = finishMatch(live(u), { score: [1, 0], shootout: null, finalRoster: [line(uid, stats)] }, MON);
    }
    return u;
}

describe('Evoluções com prévia', () => {
    const withCard = (c: PokemonInstance) => {
        const u = ready();
        // a carta entra no lugar do 1º titular de linha (mesma vaga do começo ao fim)
        const order = [...u.team.order];
        order[1] = c.uid;
        return { ...u, cards: [...u.cards, c], team: { ...u.team, order } };
    };

    it('Charmander chega na forma da prévia (Charizard), com a mesma carta, edição e vaga', () => {
        const c = { ...card(4, 'char'), shiny: true };
        expect(evoPaths(c)).toEqual([[5, 6]]);
        let u = withCard(c);
        u = startEvo(u, c.uid, [5, 6])!;
        const preview = evoPreview(c, u.evos[0]);
        expect(preview.speciesId).toBe(6);
        // um passo não fica pronto só jogando: precisa dos gols e do craque
        u = finishMatch(live(u), { score: [0, 0], shootout: null, finalRoster: [line('char')] }, MON);
        expect(evoReady(u.evos[0])).toBe(false);
        u = runEvo(u, c.uid);
        const done = u.cards.find((x) => x.uid === 'char')!;
        expect(done).toEqual(preview);
        expect(viewInstance(done).overall).toBe(viewInstance(preview).overall);
        expect(done.shiny).toBe(true);
        expect(u.team.order[1]).toBe('char');
        expect(u.evos).toEqual([]);
        // acabou: não começa outra
        expect(startEvo(u, 'char', [])).toBeNull();
    });

    it('Eevee escolhe o caminho, e a prévia mostra a forma escolhida', () => {
        const c = card(133, 'eevee');
        expect(evoPaths(c)).toEqual([[134], [135], [136]]);
        let u = withCard(c);
        expect(startEvo(u, c.uid, [5])).toBeNull();
        u = startEvo(u, c.uid, [135])!;
        const preview = evoPreview(c, u.evos[0]);
        u = runEvo(u, c.uid);
        expect(u.cards.find((x) => x.uid === 'eevee')).toEqual(preview);
        expect(preview.speciesId).toBe(135);
    });

    it(`quem não evolui faz Treino: ${TRAIN_STEPS} subidas, a espécie não muda e a nota sobe`, () => {
        const c = card(128, 'tauros');
        expect(evoPaths(c)).toEqual([[]]);
        let u = startEvo(withCard(c), c.uid, [])!;
        const preview = evoPreview(c, u.evos[0]);
        expect(preview.evolved).toBe(TRAIN_STEPS);
        u = runEvo(u, c.uid);
        const done = u.cards.find((x) => x.uid === 'tauros')!;
        expect(done).toEqual(preview);
        expect(done.speciesId).toBe(128);
        expect(viewInstance(done).overall).toBeGreaterThan(viewInstance(c).overall);
    });
});

describe('química (a regra única de bônus)', () => {
    it('mostra a sinergia ativa e o que falta: os iniciais com 2 de 3 pedem o terceiro', () => {
        const lineup = [card(1), card(4), card(25), card(68), card(143)];
        const roles = FORMATIONS['1-2-1'].slots;
        const ch = chemistry(lineup, roles, [card(7)]);
        const near = ch.nearLinks.find((l) => l.def.id === 'iniciais')!;
        expect(near.missing).toEqual([7]);
        expect(near.owned.map((c) => c.speciesId)).toEqual([7]);
        // com o Squirtle no lugar do Pikachu, a sinergia liga e o bônus aparece na química de quem participa
        const full = chemistry([card(1), card(4), card(7), card(68), card(143)], roles);
        expect(full.links.some((l) => l.def.id === 'iniciais')).toBe(true);
        expect(full.players[0].chem).toBeGreaterThan(1);
        expect(full.avg).toBeGreaterThan(ch.avg);
        expect(ch.players).toHaveLength(STARTERS);
    });

    it('o banco conta pro monotipo, como na partida (carta = campo)', () => {
        const lineup = [card(8), card(138), card(61), card(117), card(119)];
        const roles = FORMATIONS['1-2-1'].slots;
        expect(chemistry(lineup, roles).players[0].chem).toBeCloseTo(1.12);
        expect(chemistry(lineup, roles, [], [card(7), card(60)]).players[0].chem).toBeCloseTo(1.22);
    });
});
