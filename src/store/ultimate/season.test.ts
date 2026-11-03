import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '../../engine/config';
import { CLUBS } from '../../engine/cup';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { PlayerSummary } from '../../engine/runners/batch-runner';
import { metalOf } from '../../ui/rarity';
import { countObjectives, eventAt, newObjectives, objectivesAt } from './objectives';
import {
    BIG_FLOOR_N,
    BIG_PACK_SIZE,
    EVENTS,
    FICHAS,
    GYM_FICHAS_MULT,
    GYM_FIRST_BIG,
    GYMS,
    OBJECTIVES,
    PACK_MAX,
    PASS_CARD,
    PASS_DAY_MAX,
    PASS_GYM_MULT,
    PASS_MARKS,
    PASS_POINTS,
    PASS_STEP,
    SEASONS,
} from './rules';
import { gymOk, newPass, passGain, seasonN } from './season';
import {
    cupBridge,
    finishMatch,
    homeTeam,
    mergeUltimate,
    newUltimate,
    openPack,
    packMetals,
    passCardUid,
    payPass,
    redeem,
    rollPack,
    rollSeason,
    type UltimateSave,
    ultimateOf,
    ultimateRival,
} from './ultimate';

const DAY = 24 * 60 * 60 * 1000;
const T1 = SEASONS[0];
const T2 = SEASONS[1];
const NATAL = EVENTS[0];
// segunda, 02/11/2026, meio-dia em Brasília (prévia, antes da T1 e do Natal)
const NOV = Date.UTC(2026, 10, 2, 15);
const IN_T1 = T1.start + 10 * DAY;

const ready = (salt = 'temp', now = IN_T1) => {
    let u = newUltimate(salt, now);
    u = openPack(u, now)!.u;
    return openPack(u, now)!.u;
};
const line = (uid: string, goals = 0): PlayerSummary => ({
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
        goals,
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
    },
});
/** Abre a partida (do nível, ou o desafio do líder `gym`). */
const live = (u: UltimateSave, gym?: string): UltimateSave => ({
    ...u,
    live: {
        n: u.played,
        level: gym ? 'dificil' : 'normal',
        home: homeTeam(u, 'Eu', 0),
        rival: ultimateRival(u.salt, u.played, 'normal', 60, gym),
        orders: [],
        tick: 0,
        engine: ENGINE_VERSION,
        ...(gym && { gym }),
    },
});
const play = (u: UltimateSave, now: number, score: [number, number] = [2, 0], players?: PlayerSummary[]) =>
    finishMatch(live(u), { score, shootout: null, finalRoster: players }, now);

describe('temporadas (semestrais)', () => {
    it('T1 de 27/11/2026 ao fim de maio de 2027 (meia-noite de Brasília); antes é a prévia', () => {
        expect(T1.start).toBe(Date.UTC(2026, 10, 27, 3));
        expect(T1.end).toBe(Date.UTC(2027, 5, 1, 3));
        expect(T2.start).toBe(T1.end);
        expect(T1.theme).toBe('kanto');
        expect(seasonN(NOV)).toBe(0);
        expect(seasonN(T1.start - 1)).toBe(0);
        expect(seasonN(T1.start)).toBe(1);
        expect(seasonN(T1.end - 1)).toBe(1);
        expect(seasonN(T1.end)).toBe(2);
    });

    it('a virada zera o modo e guarda medalha, marcos, título e a Lenda (a carta que mais jogou)', () => {
        let u = { ...ready(), season: 1 };
        const star = u.team.order[1];
        // a carta `star` joga 3 partidas, as outras 1
        u = play(u, IN_T1, [1, 0], [line(star, 1), line(u.team.order[2])]);
        u = play(u, IN_T1 + DAY, [0, 1], [line(star)]);
        u = play(u, IN_T1 + 2 * DAY, [2, 2], [line(star)]);
        u = { ...u, fichas: 999, packPoints: 77, bigPacks: 3, extraPacks: 4, gyms: ['brock'] };
        u = { ...u, pass: { ...u.pass, pts: PASS_MARKS * PASS_STEP, marks: PASS_MARKS } };
        u = { ...u, legacy: { ...u.legacy, ornaments: ['natal-2026'] } };
        // ainda na T1: nada muda
        expect(rollSeason(u, T1.end - 1).u).toBe(u);
        const r = rollSeason(u, T1.end);
        expect(r.record).toMatchObject({ season: 1, played: 3, wins: 1, marks: PASS_MARKS, champion: true });
        expect(r.record?.legend?.uid).toBe(star);
        const v = r.u;
        // zera: time, cartas, Fichas, pontos de pacote, passe, insígnias, pacotes ganhos, partidas
        expect(v).toMatchObject({
            season: 2,
            cards: [],
            fichas: 0,
            packPoints: 0,
            bigPacks: 0,
            extraPacks: 0,
            played: 0,
            gyms: [],
            plays: {},
            pass: newPass(),
            packs: PACK_MAX,
        });
        expect(v.team.order).toEqual([]);
        // fica: o legado (com a temporada nova no fim) e os enfeites
        expect(v.legacy.seasons).toEqual([r.record]);
        expect(v.legacy.ornaments).toEqual(['natal-2026']);
        // os pacotes da temporada nova não repetem os da anterior (semente nova)
        expect(rollPack(v).map((c) => c.speciesId)).not.toEqual(rollPack({ ...u, opened: 0 }).map((c) => c.speciesId));
        // campeão só com o passe completo
        const half = rollSeason({ ...u, pass: { ...u.pass, marks: PASS_MARKS - 1 } }, T1.end);
        expect(half.record?.champion).toBe(false);
    });

    it('a prévia vira T1 sem legado; quem não jogou na temporada não ganha medalha; partida aberta espera', () => {
        const prev = ready('prev', NOV);
        expect(prev.season).toBe(0);
        const r = rollSeason(play(prev, NOV), T1.start);
        expect(r.u.season).toBe(1);
        expect(r.u.cards).toEqual([]);
        expect(r.record).toBeNull();
        expect(r.u.legacy.seasons).toEqual([]);
        // T1 sem partida: zera, mas sem medalha
        expect(rollSeason({ ...ready(), season: 1 }, T2.start).record).toBeNull();
        // partida aberta: a virada espera o apito final
        const open = live({ ...ready(), season: 1 });
        expect(rollSeason(open, T2.start).u).toBe(open);
        // relógio que voltou no tempo não volta a temporada
        const t2 = { ...ready(), season: 2 };
        expect(rollSeason(t2, IN_T1).u).toBe(t2);
    });
});

describe('ponte da Copa na virada', () => {
    it('o título da Copa no dia da temporada nova paga na temporada nova (a virada não apaga o pacote)', () => {
        const u = { ...ready(), season: 1 };
        const now = T2.start + DAY;
        const v = cupBridge(u, now);
        // entrar no modo depois faz a virada: o pacote tem que continuar lá
        const after = rollSeason(v, now + 1000).u;
        expect(after.season).toBe(2);
        expect(after.extraPacks).toBe(1);
    });
});

describe('passe grátis da temporada', () => {
    it('pontos por resultado, líder vale o dobro, teto por dia (Brasília)', () => {
        let p = newPass();
        let total = 0;
        for (let i = 0; i < 10; i++) {
            const r = passGain(p, 'win', false, IN_T1 + i * 1000);
            p = r.pass;
            total += r.gained;
        }
        expect(total).toBe(PASS_DAY_MAX);
        expect(p.today).toBe(PASS_DAY_MAX);
        // dia seguinte: volta a contar
        expect(passGain(p, 'loss', false, IN_T1 + DAY).gained).toBe(PASS_POINTS.loss);
        expect(passGain(newPass(), 'draw', true, IN_T1).gained).toBe(
            Math.min(PASS_DAY_MAX, PASS_POINTS.draw * PASS_GYM_MULT),
        );
        expect(PASS_POINTS.win).toBeGreaterThan(PASS_POINTS.draw);
        expect(PASS_POINTS.loss).toBeGreaterThan(0);
    });

    it('marco 1 dá a carta de abertura; ela cresce +2 em tudo a cada marco de crescer; cada marco paga 1 vez', () => {
        const u = { ...ready(), season: 1 };
        const one = payPass({ ...u, pass: { ...u.pass, pts: PASS_STEP } });
        const card = one.cards.find((c) => c.uid === passCardUid(1));
        expect(card?.speciesId).toBe(PASS_CARD);
        expect(card?.evolved ?? 0).toBe(0);
        expect(one.pass.marks).toBe(1);
        // pagar de novo sem pontos novos não muda nada
        expect(payPass(one)).toEqual(one);
        const all = payPass({ ...one, pass: { ...one.pass, pts: PASS_MARKS * PASS_STEP * 2 } });
        expect(all.pass.marks).toBe(PASS_MARKS);
        const grown = all.cards.find((c) => c.uid === passCardUid(1))!;
        expect(grown.evolved).toBe(PASS_MARKS / 5);
        expect(viewInstance(grown).overall).toBeGreaterThan(viewInstance(card!).overall);
        // Fichas e pacotes dos marcos esperam o Resgatar; a carta entra na hora
        expect(all.fichas).toBe(one.fichas);
        const got = redeem(all);
        expect(got.fichas).toBeGreaterThan(one.fichas);
        expect(got.extraPacks).toBeGreaterThan(one.extraPacks);
        expect(got.bigPacks).toBeGreaterThan(one.bigPacks);
        expect(all.cards.filter((c) => c.speciesId === PASS_CARD && c.uid === passCardUid(1))).toHaveLength(1);
    });

    it('o apito final soma os pontos e paga os marcos que alcançou', () => {
        let u = { ...ready(), season: 1 };
        u = { ...u, pass: { ...u.pass, pts: PASS_STEP - PASS_POINTS.win } };
        u = play(u, IN_T1);
        expect(u.last?.pass).toBe(PASS_POINTS.win);
        expect(u.last?.marks).toEqual([1]);
        expect(u.cards.some((c) => c.uid === passCardUid(1))).toBe(true);
    });
});

describe('desafios dos líderes', () => {
    const mk = (id: number, uid: string, shiny = false): PokemonInstance => ({
        ...createInstance(id, new Rng('g', uid)),
        uid,
        shiny,
    });

    it('cada líder é um clube que já existe e a regra confere o time titular', () => {
        for (const g of GYMS) expect(CLUBS.some((c) => c.name === g.club)).toBe(true);
        const misty = GYMS.find((g) => g.id === 'misty')!;
        const water = [7, 8, 9, 54, 55].map((id) => mk(id, `w${id}`));
        expect(water.every((p) => species(p.speciesId).types.includes('Water'))).toBe(true);
        expect(gymOk(misty.rule, water)).toBe(true);
        expect(gymOk(misty.rule, [...water.slice(0, 4), mk(25, 'pika')])).toBe(false);
        const sabrina = GYMS.find((g) => g.id === 'sabrina')!;
        const silver = water.filter((p) => metalOf(viewInstance(p).overall) === 'prata');
        expect(gymOk(sabrina.rule, silver)).toBe(silver.length >= 5);
    });

    it('rival é o clube do líder; paga o dobro das Fichas do Difícil; 1ª vitória dá insígnia e Pacote Grande', () => {
        const u = { ...ready(), season: 1 };
        for (const g of GYMS) expect(ultimateRival(u.salt, 0, 'dificil', 60, g.id).name).toBe(g.club);
        const won = play(u, IN_T1, [3, 1]);
        const gym = finishMatch(live(u, 'brock'), { score: [3, 1], shootout: null }, IN_T1);
        expect(gym.last?.fichas).toBe(FICHAS.dificil.win * GYM_FICHAS_MULT);
        expect(gym.gyms).toEqual(['brock']);
        expect(gym.last).toMatchObject({ gym: 'brock', badge: true });
        expect(redeem(gym).bigPacks - redeem(won).bigPacks).toBe(GYM_FIRST_BIG);
        // de novo: Fichas sim, insígnia e pacote não
        const again = finishMatch(live(gym, 'brock'), { score: [1, 0], shootout: null }, IN_T1 + DAY);
        expect(again.gyms).toEqual(['brock']);
        expect(again.last?.badge).toBe(false);
        // derrota contra o líder: paga, sem insígnia
        const lost = finishMatch(live(u, 'misty'), { score: [0, 2], shootout: null }, IN_T1);
        expect(lost.last?.fichas).toBe(FICHAS.dificil.loss * GYM_FICHAS_MULT);
        expect(lost.gyms).toEqual([]);
    });
});

describe('Pacote Grande', () => {
    it('5 cartas e pelo menos 2 Prata ou melhor; o Mini segue com 3 e 1', () => {
        for (let i = 0; i < 300; i++) {
            const big = packMetals(new Rng('big', String(i)), 'big');
            expect(big).toHaveLength(BIG_PACK_SIZE);
            expect(big.filter((m) => m !== 'bronze').length).toBeGreaterThanOrEqual(BIG_FLOOR_N);
            const mini = packMetals(new Rng('big', String(i)));
            expect(mini).toHaveLength(3);
            expect(mini.some((m) => m !== 'bronze')).toBe(true);
        }
    });

    it('abre só com Pacote Grande guardado e não mexe no relógio do grátis', () => {
        const u = newUltimate('g', IN_T1);
        expect(openPack(u, IN_T1, 'big')).toBeNull();
        const r = openPack({ ...u, bigPacks: 1 }, IN_T1, 'big')!;
        expect(r.pack.cards).toHaveLength(BIG_PACK_SIZE);
        expect(r.u).toMatchObject({ bigPacks: 0, packs: PACK_MAX, extraPacks: 0, opened: 1 });
    });

    it('os objetivos da semana pagam Pacote Grande no lugar do Mini', () => {
        const week = OBJECTIVES.filter((o) => o.period === 'week');
        expect(week.every((o) => o.packs === 0)).toBe(true);
        expect(week.reduce((s, o) => s + o.big, 0)).toBeGreaterThan(0);
        // 12 partidas na semana: o w-play paga o Grande (no Resgatar)
        let u = { ...ready(), season: 1 };
        for (let i = 0; i < 12; i++) u = play(u, IN_T1 + Math.floor(i / 4) * DAY, [0, 1]);
        expect(u.objectives.done).toContain('w-play');
        expect(redeem(u).bigPacks).toBeGreaterThanOrEqual(OBJECTIVES.find((o) => o.id === 'w-play')!.big);
    });
});

describe('evento de Natal (1º evento da T1, desligado por data)', () => {
    const inNatal = NATAL.start + 2 * DAY;

    it('não liga antes de dezembro nem depois do fim', () => {
        expect(new Date(NATAL.start).getUTCMonth()).toBe(11);
        expect(NATAL.start).toBeGreaterThan(T1.start);
        expect(NATAL.end).toBeLessThan(T1.end);
        expect(eventAt(NOV)).toBeNull();
        expect(eventAt(T1.start)).toBeNull();
        expect(eventAt(NATAL.start - 1)).toBeNull();
        expect(eventAt(NATAL.start)?.id).toBe('natal-2026');
        expect(eventAt(NATAL.end)).toBeNull();
    });

    it('cartas Evento só durante o evento; fora dele o pacote é o mesmo de antes', () => {
        let during = 0;
        for (let i = 0; i < 80; i++) {
            const u = { salt: `ev${i}`, opened: 9, cards: [] };
            const plain = rollPack(u);
            expect(rollPack(u, 'mini', NOV)).toEqual(plain);
            expect(plain.some((c) => c.special?.kind === 'evento')).toBe(false);
            const ev = rollPack(u, 'mini', inNatal);
            for (const c of ev)
                if (c.special?.kind === 'evento') {
                    during++;
                    expect(c.special.type).toBe(NATAL.type);
                }
        }
        expect(during).toBeGreaterThan(0);
    });

    it('objetivos do evento só contam no evento; completos, dão o enfeite (que fica)', () => {
        const before = countObjectives(
            newObjectives(NOV),
            { outcome: 'win', level: 'normal', goals: 9, noGold: false },
            NOV,
        );
        expect(Object.keys(before.g.prog).some((id) => id.startsWith('e-'))).toBe(false);
        let u = { ...ready(), season: 1, objectives: newObjectives(inNatal) };
        const goal = Math.max(...NATAL.objectives.map((o) => o.goal));
        for (let i = 0; i < goal && !u.legacy.ornaments.length; i++) u = play(u, inNatal + i * 1000, [5, 0]);
        expect(NATAL.objectives.every((o) => u.objectives.done.includes(o.id))).toBe(true);
        expect(u.legacy.ornaments).toEqual(['natal-2026']);
        // acabou o evento: os objetivos dele somem, o enfeite fica (e sobrevive à virada da temporada)
        expect(objectivesAt(u.objectives, NATAL.end).done.some((id) => id.startsWith('e-'))).toBe(false);
        expect(rollSeason(u, T2.start).u.legacy.ornaments).toEqual(['natal-2026']);
    });
});

describe('save da 0.9.33', () => {
    it('save da 0.9.32 (sem os campos novos) abre com o padrão', () => {
        const u = ready();
        const { bigPacks: _b, pass: _p, plays: _pl, gyms: _g, legacy: _l, ...old } = u;
        const back = ultimateOf(JSON.parse(JSON.stringify(old)));
        expect(back).toMatchObject({
            bigPacks: 0,
            pass: newPass(),
            plays: {},
            gyms: [],
            legacy: { seasons: [], ornaments: [] },
        });
        expect(back.cards).toEqual(u.cards);
    });

    it('volta igual do JSON, com legado, passe e partida de líder', () => {
        let u = { ...ready(), season: 1 };
        u = play(u, IN_T1, [2, 0], [line(u.team.order[0])]);
        u = rollSeason(u, T2.start).u;
        u = live(ready('x', T2.start + DAY), 'koga');
        const full = {
            ...u,
            legacy: {
                seasons: [{ season: 1, played: 1, wins: 1, marks: 0, champion: false, legend: null }],
                ornaments: ['natal-2026'],
            },
        };
        expect(ultimateOf(JSON.parse(JSON.stringify(full)))).toEqual(full);
        // lixo no legado e no passe volta pro padrão sem derrubar o resto
        const bad = ultimateOf({
            ...full,
            legacy: { seasons: [null, { season: 'x' }], ornaments: [3] },
            pass: 9,
            gyms: ['ninguem'],
        });
        expect(bad.legacy).toEqual({ seasons: [], ornaments: [] });
        expect(bad.pass).toEqual(newPass());
        expect(bad.gyms).toEqual([]);
        expect(bad.cards).toEqual(full.cards);
    });

    it('nuvem x aparelho: a temporada mais nova vence e o legado dos dois lados fica', () => {
        const rec = { season: 1, played: 3, wins: 2, marks: 4, champion: false, legend: null };
        const oldSide = { ...ready('a'), season: 1, opened: 50, legacy: { seasons: [], ornaments: ['natal-2026'] } };
        const newSide = { ...newUltimate('b', T2.start), season: 2, legacy: { seasons: [rec], ornaments: [] } };
        for (const [k, o] of [
            [oldSide, newSide],
            [newSide, oldSide],
        ]) {
            const m = mergeUltimate(k, o);
            expect(m.season).toBe(2);
            expect(m.legacy).toEqual({ seasons: [rec], ornaments: ['natal-2026'] });
        }
    });

    it('nuvem x aparelho: a temporada que o lado velho jogou (e não virou) entra no legado em vez de sumir', () => {
        // o aparelho A jogou a T1 e completou o passe; o B virou pra T2 antes de sincronizar
        let a = { ...ready('a'), season: 1 };
        const star = a.team.order[0];
        a = play(a, IN_T1, [2, 0], [line(star)]);
        a = play(a, IN_T1 + DAY, [1, 0], [line(star)]);
        a = { ...a, pass: { ...a.pass, pts: PASS_MARKS * PASS_STEP, marks: PASS_MARKS } };
        // B jogou 1 partida na T1 (legado pequeno); C é um aparelho novo que virou da prévia (sem legado)
        const small = { season: 1, played: 1, wins: 0, marks: 0, champion: false, legend: null };
        const b = { ...newUltimate('b', T2.start), season: 2, legacy: { seasons: [small], ornaments: [] } };
        const c = { ...newUltimate('c', T2.start), season: 2 };
        for (const side of [b, c])
            for (const [k, o] of [
                [a, side],
                [side, a],
            ]) {
                const m = mergeUltimate(k, o);
                expect(m.season).toBe(2);
                expect(m.legacy.seasons).toHaveLength(1);
                expect(m.legacy.seasons[0]).toMatchObject({ season: 1, played: 2, wins: 2, champion: true });
                expect(m.legacy.seasons[0].legend?.uid).toBe(star);
            }
    });
});
