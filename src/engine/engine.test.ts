import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeAttributes } from './attributes';
import { FUTSAL_5, withConfig } from './config';
import { HumanController } from './controllers/human-controller';
import { effectiveness, MOVES, SPECIES, species } from './data';
import { aiDraftTeam, DRAFT_ROUNDS, draftOptions, playerDraftOptions, SILVER } from './draft';
import { evolvedRating } from './evolution';
import { createInstance, slotRating, viewInstance } from './instance';
import { applyPendingSubs, createMatch } from './match';
import { matchDigest, playerLines, possessionByPeriod, shotMap } from './match-stats';
import { applyModifiers, attributeModifiers } from './modifiers';
import { defaultMoveset, moveProfile } from './moves';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import { SIGNATURE } from './signature-moves';
import { EVENT_TYPES, mvpOpen, rollSpecial, SPECIAL_BONUS, specialBonus, weeklyEventType } from './specials';
import { SNAP_STRIDE, type TeamSetup } from './state';
import { dir8, v } from './vec';

function team(seed: string, name: string): TeamSetup {
    const rng = new Rng(seed, 'team');
    return { name, ...aiDraftTeam(rng, 0), tactic: 'balanced', color: 0 };
}

describe('dados', () => {
    it('tem os 151 com tipos, stats e golpes', () => {
        expect(SPECIES).toHaveLength(151);
        for (const sp of SPECIES) {
            expect(sp.types.length).toBeGreaterThan(0);
            expect(defaultMoveset(sp).length).toBeGreaterThanOrEqual(1);
        }
    });

    it('tem sprites de card, atlas de campo e gritos para todos', () => {
        for (const sp of SPECIES) {
            expect(existsSync(`public/assets/cards/${sp.id}.gif`)).toBe(true);
            expect(existsSync(`public/assets/field/${sp.id}.json`)).toBe(true);
            expect(existsSync(`public/assets/cries/legacy/${sp.id}.ogg`)).toBe(true);
            expect(existsSync(`public/assets/cries/latest/${sp.id}.ogg`)).toBe(true);
        }
    });

    it('tem retrato (rostinho) de todos para a faixa de gol/defesa', () => {
        for (const sp of SPECIES) expect(existsSync(`public/assets/portraits/${sp.id}.png`)).toBe(true);
    });

    it('tem os ícones oficiais de todos os tipos dos Pokémon', () => {
        for (const t of new Set(SPECIES.flatMap((sp) => sp.types))) {
            expect(existsSync(`public/assets/types/${t.toLowerCase()}.png`)).toBe(true);
        }
    });

    it('tabela de tipos bate com casos conhecidos', () => {
        expect(effectiveness('Fire', ['Grass'])).toBe(2);
        expect(effectiveness('Water', ['Fire', 'Rock'])).toBe(4);
        expect(effectiveness('Electric', ['Ground'])).toBe(0);
        expect(effectiveness('Normal', ['Ghost'])).toBe(0);
        expect(effectiveness('Grass', ['Fire', 'Flying'])).toBe(0.25);
    });

    it('movesets têm a cara da espécie', () => {
        expect(defaultMoveset(species(25))).toContain('thunderbolt');
        expect(defaultMoveset(species(25))).toContain('thunderwave');
        expect(defaultMoveset(species(129))).toContain('splash');
    });
});

describe('atributos', () => {
    it('ficam entre 1 e 99', () => {
        for (const sp of SPECIES) {
            for (const val of Object.values(computeAttributes(sp, 50))) {
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(99);
            }
        }
    });

    it('fazem sentido: Jolteon é mais rápido que Snorlax; Snorlax mais forte', () => {
        const jolteon = computeAttributes(species(135), 50);
        const snorlax = computeAttributes(species(143), 50);
        expect(jolteon.pace).toBeGreaterThan(snorlax.pace);
        expect(snorlax.strength).toBeGreaterThan(jolteon.strength);
    });

    it('nível maior dá atributos maiores (carreira)', () => {
        const low = computeAttributes(species(4), 20);
        const high = computeAttributes(species(4), 80);
        expect(high.shooting).toBeGreaterThan(low.shooting);
    });
});

describe('vetores', () => {
    it('dir8 segue a ordem das linhas PMD', () => {
        expect(dir8(v(0, 1))).toBe(0); // baixo
        expect(dir8(v(1, 0))).toBe(2); // direita
        expect(dir8(v(0, -1))).toBe(4); // cima
        expect(dir8(v(-1, 0))).toBe(6); // esquerda
        expect(dir8(v(1, 1))).toBe(1);
        expect(dir8(v(-1, 1))).toBe(7);
    });
});

describe('draft', () => {
    it('gera 3 opções distintas e não repete espécies já escolhidas', () => {
        const rng = new Rng('draft-test');
        const taken = new Set<number>();
        for (let round = 0; round < DRAFT_ROUNDS.length; round++) {
            const opts = draftOptions(rng, round, taken);
            expect(opts).toHaveLength(3);
            const ids = opts.map((o) => o.speciesId);
            expect(new Set(ids).size).toBe(3);
            for (const id of ids) expect(taken.has(id)).toBe(false);
            taken.add(ids[0]);
        }
    });

    it('é determinístico pela seed', () => {
        const a = draftOptions(new Rng('x'), 0, new Set()).map((o) => o.speciesId);
        const b = draftOptions(new Rng('x'), 0, new Set()).map((o) => o.speciesId);
        expect(a).toEqual(b);
    });

    it('draft do jogador: toda rodada tem pelo menos uma prata na vaga, sem repetir espécie', () => {
        for (const need of ['GK', 'FIXO', 'ALA', 'PIVO', 'ANY'] as const) {
            for (let i = 0; i < 150; i++) {
                const taken = new Set([25, 6]);
                const opts = playerDraftOptions(new Rng(`piso-${i}`, need), i % 7, taken, need);
                expect(opts).toHaveLength(3);
                expect(Math.max(...opts.map((o) => slotRating(o, need)))).toBeGreaterThanOrEqual(SILVER);
                expect(new Set(opts.map((o) => o.speciesId)).size).toBe(3);
                for (const o of opts) {
                    expect(taken.has(o.speciesId)).toBe(false);
                    if (need !== 'ANY') expect(viewInstance(o).positions).toContain(need);
                }
            }
        }
    });

    it('selo de evolução: nota da forma nova na mesma vaga; quem não evolui não tem selo', () => {
        const charmander = createInstance(4, new Rng('evo'));
        const evo = evolvedRating(charmander, 'ALA');
        expect(evo?.into).toBe(5);
        expect(evo?.rating).toBe(slotRating({ ...charmander, speciesId: 5, evolved: 1 }, 'ALA'));
        expect(evolvedRating(createInstance(6, new Rng('evo')), 'ALA')).toBeNull();
        expect(evolvedRating(createInstance(132, new Rng('evo')), 'ALA')).toBeNull();
    });
});

describe('partida', () => {
    const home = team('h', 'Casa');
    const away = team('a', 'Fora');

    it('mesma seed → mesmo log de eventos', () => {
        const r1 = runMatch(FUTSAL_5, home, away, 42, { snapshots: false });
        const r2 = runMatch(FUTSAL_5, home, away, 42, { snapshots: false });
        expect(r1.events).toEqual(r2.events);
        expect(r1.score).toEqual(r2.score);
    });

    it('placar bate com os eventos de gol e sempre há vencedor no mata-mata', () => {
        for (const seed of [1, 2, 3]) {
            const r = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
            const goals = r.events.filter((e) => e.type === 'goal');
            expect(goals.filter((g) => g.type === 'goal' && g.team === 0)).toHaveLength(r.score[0]);
            expect(goals.filter((g) => g.type === 'goal' && g.team === 1)).toHaveLength(r.score[1]);
            expect(r.winner).not.toBeNull();
            expect(r.events.at(-1)?.type).toBe('end');
        }
    });

    it('snapshots cobrem a partida inteira', () => {
        const r = runMatch(FUTSAL_5, home, away, 7);
        expect(r.snapshots.length).toBeGreaterThan(1000);
        expect(r.snapshots[0].p).toHaveLength(10 * SNAP_STRIDE);
    });

    it('BatchRunner e LiveRunner produzem o mesmo resultado', () => {
        const batch = runMatch(FUTSAL_5, home, away, 99, { snapshots: false });
        const live = new LiveRunner(FUTSAL_5, home, away, 99);
        while (!live.finished) live.step();
        expect(live.state.events).toEqual(batch.events);
    });

    it('obedece um controller humano roteirizado (modo jogável futuro)', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 5);
        const s = live.state;
        const human = new HumanController();
        // o ala da casa (slot 2) corre para a direita sem parar
        live.setController(2, human);
        human.hold({ type: 'move', dir: v(1, 0), sprint: true });
        const startX = s.players[2].pos.x;
        for (let i = 0; i < 60; i++) live.step();
        expect(s.players[2].pos.x).toBeGreaterThan(startX + 8);

        // com a bola: chutar
        s.ball.owner = 2;
        s.players[2].kickCooldown = 0;
        human.press({ type: 'shoot', target: v(40, 10), power: 1 });
        live.step();
        expect(s.ball.owner).toBeNull();
        expect(s.events.some((e) => e.type === 'shot' && e.by === 2)).toBe(true);
    });

    it('instâncias têm golpes e habilidade válidos', () => {
        const rng = new Rng('inst');
        for (const sp of SPECIES) {
            const inst = createInstance(sp.id, rng);
            expect(sp.abilities).toContain(inst.ability);
            expect(inst.moves.every((m) => sp.learnset.includes(m))).toBe(true);
        }
    });
});

describe('v0.6: cartas especiais', () => {
    it('rollSpecial: determinístico, só Ícones da lista, chance perto de 1 em 80', () => {
        const rng = new Rng('esp');
        let icons = 0;
        const n = 40_000;
        for (let i = 0; i < n; i++) {
            const inst = createInstance(25, rng);
            const a = rollSpecial(inst, null);
            expect(rollSpecial(inst, null)).toEqual(a);
            if (a.special?.kind === 'icone') icons++;
        }
        expect(icons / n).toBeGreaterThan(0.009);
        expect(icons / n).toBeLessThan(0.016);
        for (let i = 0; i < 2000; i++) expect(rollSpecial(createInstance(16, rng), null).special).toBeFalsy();
    });

    it('evento: só cartas do tipo da semana', () => {
        const rng = new Rng('evt');
        let fire = 0;
        for (let i = 0; i < 3000; i++) {
            if (rollSpecial(createInstance(4, rng), 'Fire').special?.kind === 'evento') fire++;
            expect(rollSpecial(createInstance(7, rng), 'Fire').special?.kind).not.toBe('evento');
        }
        expect(fire).toBeGreaterThan(250);
    });

    it('edição dá +2 em tudo; shiny por cima de outra edição soma +1', () => {
        const base = createInstance(1, new Rng('b'));
        const plain = viewInstance({ ...base, shiny: false, special: null }).attributes;
        const shiny = viewInstance({ ...base, shiny: true, special: null }).attributes;
        const both = viewInstance({ ...base, shiny: true, special: { kind: 'destaque' } }).attributes;
        expect(shiny.pace - plain.pace).toBe(SPECIAL_BONUS);
        expect(both.pace - plain.pace).toBe(SPECIAL_BONUS + 1);
        expect(both.shooting - plain.shooting).toBe(SPECIAL_BONUS + 1);
    });

    it('evento da semana gira entre tipos com Pokémon e é estável dentro da semana', () => {
        const seg = weeklyEventType(new Date(2026, 9, 12));
        expect(weeklyEventType(new Date(2026, 9, 18))).toBe(seg);
        expect(weeklyEventType(new Date(2026, 9, 19))).not.toBe(seg);
        const seen = new Set<string>();
        for (let w = 0; w < 60; w++) seen.add(weeklyEventType(new Date(2026, 0, 1 + w * 7)));
        expect([...seen].every((t) => EVENT_TYPES.includes(t))).toBe(true);
        expect(EVENT_TYPES).not.toContain('Dark');
    });
});

describe('disputa de pênaltis', () => {
    const SHORT = withConfig({ halfSeconds: 4 });
    it('para assim que um time não pode mais ser alcançado', () => {
        let shootouts = 0;
        for (let i = 0; i < 60 && shootouts < 30; i++) {
            // partida curtinha: quase sempre empata e vai para os pênaltis
            const r = runMatch(SHORT, team(`pk-a${i}`, 'A'), team(`pk-b${i}`, 'B'), `pk-${i}`, {
                snapshots: false,
            });
            const pens = r.events.filter((e) => e.type === 'penalty');
            if (!pens.length) continue;
            shootouts++;
            const taken = [0, 0];
            const score = [0, 0];
            const kicks = FUTSAL_5.penaltyKicks;
            for (const e of pens) {
                if (e.type !== 'penalty') continue;
                if (taken[0] < kicks || taken[1] < kicks) {
                    const rem = [kicks - taken[0], kicks - taken[1]].map((n) => Math.max(0, n));
                    const decided = score[0] > score[1] + rem[1] || score[1] > score[0] + rem[0];
                    expect(decided).toBe(false);
                }
                const t = r.roster[e.by].team;
                taken[t]++;
                if (e.scored) score[t]++;
            }
        }
        expect(shootouts).toBeGreaterThan(10);
    });
});

describe('golpes', () => {
    it('golpe-assinatura de cada Pokémon é um golpe que ele aprende e abre o moveset', () => {
        const bad = Object.entries(SIGNATURE).filter(([id, m]) => !species(Number(id)).learnset.includes(m));
        expect(bad).toEqual([]);
        for (const [id, m] of Object.entries(SIGNATURE)) expect(defaultMoveset(species(Number(id)))[0]).toBe(m);
    });

    it('nenhum golpe fica sem efeito', () => {
        const flavor = Object.keys(MOVES).filter((m) => moveProfile(m).kind === 'flavor');
        expect(flavor).toEqual([]);
    });

    it('movesets variados: muitos golpes diferentes e no máximo 4 por Pokémon', () => {
        const used = new Set(SPECIES.flatMap((sp) => defaultMoveset(sp)));
        expect(used.size).toBeGreaterThan(100);
        for (const sp of SPECIES) expect(defaultMoveset(sp).length).toBeLessThanOrEqual(4);
    });
});

describe('bônus e penalidades (carta = campo)', () => {
    it('os atributos do jogador em campo são exatamente os da regra de modificadores', () => {
        const home = team('mods-a', 'A');
        const s = createMatch(FUTSAL_5, home, team('mods-b', 'B'), 'mods');
        const captain = home.lineup.find((p) => p.uid === home.captainUid) ?? null;
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            const expected = applyModifiers(
                computeAttributes(species(p.inst.speciesId), p.inst.level),
                attributeModifiers(p.inst, { lineup: home.lineup, captain, role: p.role }),
                p.role,
            );
            if (p.inst.ability === 'imposter') continue;
            expect(p.attr).toEqual(expected);
        }
    });

    it('substituição recalcula o time: quem entra fecha a dupla de história e o parceiro ganha o bônus', () => {
        const rng = new Rng('troca-bonus', 'x');
        // Mew em campo; Mewtwo no banco (dupla Gênese só vale com os dois escalados)
        const lineup = [143, 68, 151, 142, 25].map((id) => createInstance(id, rng));
        const bench = [150, 4].map((id) => createInstance(id, rng));
        const home: TeamSetup = {
            name: 'A',
            lineup,
            bench,
            tactic: 'balanced',
            color: 0,
            formation: '1-2-1',
            captainUid: lineup[0].uid,
            manualSubs: true,
        };
        const s = createMatch(FUTSAL_5, home, team('troca-b', 'B'), 'troca');
        const mew = () => s.players.find((p) => p.inst.speciesId === 151)!;
        const before = { ...mew().attr };
        s.pendingSubs.push({ tick: 0, team: 0, kind: 'sub', outUid: lineup[4].uid, inUid: bench[0].uid });
        applyPendingSubs(s);
        expect(s.teams[0].lineup[4].uid).toBe(bench[0].uid);
        expect(mew().attr.passing).toBeGreaterThan(before.passing);
        // e todo o time bate com a regra dos modificadores aplicada à escalação de agora
        const now = s.teams[0].lineup;
        const captain = now.find((p) => p.uid === home.captainUid) ?? null;
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            const expected = applyModifiers(
                computeAttributes(species(p.inst.speciesId), p.inst.level),
                attributeModifiers(p.inst, { lineup: now, captain, role: p.role }),
                p.role,
            );
            expect(p.attr).toEqual(expected);
        }
    });
});

describe('estatísticas da partida', () => {
    it('resumo da partida: um gol anotado por gol do placar, com autor e minuto', () => {
        const r = runMatch(FUTSAL_5, team('dg-a', 'A'), team('dg-b', 'B'), 'dg');
        const d = matchDigest(r);
        expect(d.goals.filter((g) => g.team === 0)).toHaveLength(r.score[0]);
        expect(d.goals.filter((g) => g.team === 1)).toHaveLength(r.score[1]);
        for (const g of d.goals) {
            expect(g.uid).toBeTruthy();
            expect(g.minute).toBeGreaterThanOrEqual(0);
            expect(g.minute).toBeLessThanOrEqual(40);
        }
        expect(d.half).not.toBeNull();
    });

    it('notas entre 3 e 10, todo mundo correu, cada chute tem desfecho e a posse por período soma 100%', () => {
        const r = runMatch(FUTSAL_5, team('st-a', 'A'), team('st-b', 'B'), 'st');
        const lines = playerLines(r);
        expect(lines.length).toBeGreaterThanOrEqual(10);
        for (const l of lines) {
            expect(l.rating).toBeGreaterThanOrEqual(3);
            expect(l.rating).toBeLessThanOrEqual(10);
            expect(l.distance).toBeGreaterThan(0);
        }
        const shots = shotMap(r, () => '');
        expect(shots.length).toBe(r.events.filter((e) => e.type === 'shot').length);
        expect(shots.filter((s) => s.outcome === 'gol').length).toBeLessThanOrEqual(r.score[0] + r.score[1]);
        for (const p of possessionByPeriod(r)) expect(p.home + p.away).toBeCloseTo(1, 5);
    });
});

describe('golpes especiais', () => {
    it('Counter devolve o golpe, Haze limpa status, Teleport move, Leech Seed suga e Dream Eater sai', () => {
        const rng = new Rng('esp-golpes', 'x');
        const mk = (id: number, moves: string[]) => ({ ...createInstance(id, rng), moves });
        const home: TeamSetup = {
            name: 'A',
            lineup: [
                mk(143, ['bodyslam']),
                mk(94, ['dreameater', 'hypnosis']),
                mk(1, ['leechseed']),
                mk(68, ['counter', 'haze']),
                mk(64, ['teleport', 'counter']),
            ],
            bench: [],
            tactic: 'balanced',
            color: 0,
        };
        let counters = 0;
        let hazes = 0;
        let teleports = 0;
        let seeds = 0;
        let dreams = 0;
        for (let i = 0; i < 12; i++) {
            const r = runMatch(FUTSAL_5, home, team(`esp-b${i}`, 'B'), `esp-${i}`, { snapshots: false });
            for (const e of r.events) {
                if (e.type === 'move' && e.moveId === 'counter' && e.hit) counters++;
                if (e.type === 'haze') hazes++;
                if (e.type === 'teleport') teleports++;
                if (e.type === 'status' && e.status === 'seed') seeds++;
            }
            dreams += r.events.filter((e) => e.type === 'move' && e.moveId === 'dreameater').length;
        }
        expect({ counters: counters > 0, hazes: hazes > 0, teleports: teleports > 0, seeds: seeds > 0 }).toEqual({
            counters: true,
            hazes: true,
            teleports: true,
            seeds: true,
        });
        // antes do Bloco 3 só saía com rival dormindo (0 usos em 6.639 jogos)
        expect(dreams).toBeGreaterThan(0);
    });
});

describe('Edições em camadas (MVP e shiny)', () => {
    const base = { ...createInstance(25, new Rng('icone', 'mvp')), shiny: false };
    it('Ícone e Evento continuam e ganham +1 por selo de MVP, até 3', () => {
        const icon = (level?: number) => ({ ...base, special: { kind: 'icone' as const, ...(level && { level }) } });
        const evt = (level?: number) => ({
            ...base,
            special: { kind: 'evento' as const, type: 'Electric', ...(level && { level }) },
        });
        expect(specialBonus(icon())).toBe(SPECIAL_BONUS);
        expect([1, 2, 3].map((n) => specialBonus(icon(n)))).toEqual([3, 4, 5]);
        expect([0, 1, 2, 3].map((n) => specialBonus(evt(n)))).toEqual([2, 3, 4, 5]);
        expect(mvpOpen(icon(2))).toBe(true);
        expect(mvpOpen(icon(3))).toBe(false);
        expect(mvpOpen(evt(2))).toBe(true);
        expect(mvpOpen({ ...base, special: { kind: 'destaque' } })).toBe(false);
    });
    it('shiny +1 junto de outra edição, Destaque 1–3; sem teto além do 99', () => {
        const dest = (level: number, shiny = false) => ({
            ...base,
            shiny,
            special: { kind: 'destaque' as const, level },
        });
        expect([1, 2, 3].map((n) => specialBonus(dest(n)))).toEqual([2, 3, 4]);
        expect([1, 2, 3].map((n) => specialBonus(dest(n, true)))).toEqual([3, 4, 5]);
        const top = { ...base, shiny: true, special: { kind: 'icone' as const, level: 3 } };
        expect(specialBonus(top)).toBe(6);
        // atributo trava em 99: o bônus que sobra só sobe quem ainda está abaixo
        const v = viewInstance({ ...createInstance(150, new Rng('teto')), shiny: true, special: top.special });
        expect(Math.max(...Object.values(v.attributes))).toBeLessThanOrEqual(99);
    });
});
