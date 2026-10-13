import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeAttributes, eligiblePositions, positionFactor } from './attributes';
import { FUTSAL_5 } from './config';
import { HumanController } from './controllers/human-controller';
import { effectiveness, SPECIES, species } from './data';
import { aiDraftTeam, DRAFT_ROUNDS, draftOptions } from './draft';
import { FORMATIONS } from './formations';
import { createInstance, viewInstance } from './instance';
import { captainFactor, createMatch } from './match';
import { defaultMoveset } from './moves';
import { rewardOptions } from './rewards';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
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

describe('iteração 3: posições, formações, capitão, itens, tática ao vivo', () => {
    const home = team('h3', 'Casa');
    const away = team('a3', 'Fora');

    it('Snorlax é goleiro de posição principal', () => {
        const pos = eligiblePositions(computeAttributes(species(143), 50), 143);
        expect(pos[0]).toBe('GK');
    });

    it('positionFactor: principal 1, secundária 0.98, fora penaliza', () => {
        expect(positionFactor(['FIXO', 'GK'], 'FIXO')).toBe(1);
        expect(positionFactor(['FIXO', 'GK'], 'GK')).toBe(0.98);
        expect(positionFactor(['FIXO', 'GK'], 'ALA')).toBe(0.93);
        expect(positionFactor(['ALA'], 'GK')).toBe(0.75);
    });

    it('opções do draft para uma posição sempre jogam nela', () => {
        const rng = new Rng('elig');
        for (const need of ['GK', 'FIXO', 'ALA', 'PIVO'] as const) {
            for (let i = 0; i < 10; i++) {
                for (const o of draftOptions(rng, i % 7, new Set(), 3, [], need)) {
                    expect(viewInstance(o).positions).toContain(need);
                }
            }
        }
    });

    it('formações têm 5 vagas, pivô no slot 4 e coordenadas dentro da quadra', () => {
        for (const f of Object.values(FORMATIONS)) {
            expect(f.slots).toHaveLength(5);
            expect(f.slots[0]).toBe('GK');
            expect(f.slots[4]).toBe('PIVO');
            for (const [x, y] of [...f.attack, ...f.defend, ...f.kickoff]) {
                expect(x).toBeGreaterThanOrEqual(0);
                expect(x).toBeLessThanOrEqual(40);
                expect(y).toBeGreaterThanOrEqual(0);
                expect(y).toBeLessThanOrEqual(20);
            }
            const r = runMatch(FUTSAL_5, { ...home, formation: f.id }, away, 3, { snapshots: false });
            expect(r.winner).not.toBeNull();
        }
    });

    it('capitão dá +6% a quem divide tipo e +3% ao resto', () => {
        const cap = createInstance(25, new Rng('cap')); // Pikachu (Elétrico)
        expect(captainFactor(cap, ['Electric'])).toBe(1.06);
        expect(captainFactor(cap, ['Water'])).toBe(1.03);
        expect(captainFactor(null, ['Water'])).toBe(1);
        const s = createMatch(FUTSAL_5, { ...home, captainUid: home.lineup[2].uid }, away, 1);
        expect(s.players[2].captain).toBe(true);
    });

    it('Choice Band trava os outros golpes; Focus Sash e Lum Berry disparam no máximo uma vez', () => {
        const withItems = (t: TeamSetup, item: string): TeamSetup => ({
            ...t,
            lineup: t.lineup.map((p) => ({ ...p, item })),
        });
        const s = createMatch(FUTSAL_5, withItems(home, 'choiceband'), away, 1);
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            expect(p.moveUses.slice(1).every((u) => u === 0)).toBe(true);
        }
        let saves = 0;
        let cures = 0;
        for (const seed of [1, 2, 3, 4]) {
            const r = runMatch(FUTSAL_5, home, withItems(away, seed % 2 ? 'focussash' : 'lumberry'), seed, {
                snapshots: false,
            });
            const items = r.events.filter((e) => e.type === 'item');
            const perPlayer = new Map<number, number>();
            for (const e of items) if (e.type === 'item') perPlayer.set(e.by, (perPlayer.get(e.by) ?? 0) + 1);
            expect([...perPlayer.values()].every((n) => n === 1)).toBe(true);
            saves += items.filter((e) => e.type === 'item' && e.effect === 'save').length;
            cures += items.filter((e) => e.type === 'item' && e.effect === 'cure').length;
        }
        expect(saves).toBeGreaterThan(0);
        expect(cures).toBeGreaterThan(0);
    });

    it('mudança de tática no tick T mantém tudo igual antes de T', () => {
        const base = runMatch(FUTSAL_5, home, away, 77, { snapshots: false });
        const T = 2000;
        const changed = runMatch(FUTSAL_5, home, away, 77, {
            snapshots: false,
            tacticChanges: [{ tick: T, team: 0, tactic: 'defensive' }],
        });
        const prefix = (r: typeof base) => r.events.filter((e) => e.tick < T);
        expect(prefix(changed)).toEqual(prefix(base));
        expect(changed.events.some((e) => e.type === 'tactic' && e.tick === T && e.team === 0)).toBe(true);
    });

    it('estatísticas de quem saiu no intervalo entram no resultado (gols batem com o placar)', () => {
        // intervalo sem recuperação de fôlego: garante substituições, qualquer que seja o elenco sorteado
        const tired: TeamSetup = { ...home, tactic: 'offensive' };
        const cfg = { ...FUTSAL_5, halftimeRecovery: -0.3 };
        let checked = 0;
        for (let seed = 1; seed <= 60 && checked < 2; seed++) {
            const r = runMatch(cfg, tired, { ...away, tactic: 'offensive' }, seed, { snapshots: false });
            const everyone = [...r.finalRoster, ...r.subbedOut];
            for (const team of [0, 1] as const) {
                const ownGoals = r.events.filter((e) => e.type === 'goal' && e.team === team && e.ownGoal).length;
                const scored = everyone.filter((p) => p.team === team).reduce((s, p) => s + p.stats.goals, 0);
                expect(scored + ownGoals).toBe(r.score[team]);
            }
            checked += r.subbedOut.length;
        }
        expect(checked).toBeGreaterThan(0);
    }, 30_000);

    it('quem conduz a bola nunca sai da quadra', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 21);
        while (!live.finished) {
            live.step();
            const s = live.state;
            if (s.ball.owner !== null && s.phase === 'play') {
                const x = s.players[s.ball.owner].pos.x;
                expect(x).toBeGreaterThanOrEqual(0.39);
                expect(x).toBeLessThanOrEqual(40 - 0.39);
            }
        }
    });

    it('recompensas são determinísticas pela seed e trazem 1 reforço + 2 itens', () => {
        const a = rewardOptions('seed', 0, 0, home.lineup);
        const b = rewardOptions('seed', 0, 0, home.lineup);
        expect(a).toEqual(b);
        expect(a.filter((r) => r.kind === 'pokemon')).toHaveLength(1);
        expect(a.filter((r) => r.kind === 'item')).toHaveLength(2);
        expect(rewardOptions('seed', 0, 1, home.lineup)).not.toEqual(a);
        // contratar do adversário: o Pokémon vem do time derrotado, sem item e com uid novo
        const defeated = { name: 'Fora', players: away.lineup };
        const c = rewardOptions('seed', 0, 0, home.lineup, defeated);
        const signed = c.find((r) => r.kind === 'pokemon');
        expect(signed && signed.kind === 'pokemon' && signed.from).toBe('Fora');
        if (signed?.kind === 'pokemon') {
            expect(away.lineup.some((p) => p.speciesId === signed.inst.speciesId)).toBe(true);
            expect(away.lineup.some((p) => p.uid === signed.inst.uid)).toBe(false);
            expect(signed.inst.item).toBeNull();
        }
    });
});
