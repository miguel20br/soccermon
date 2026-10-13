import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeAttributes } from './attributes';
import { FUTSAL_5 } from './config';
import { HumanController } from './controllers/human-controller';
import { effectiveness, SPECIES, species } from './data';
import { aiDraftTeam, DRAFT_ROUNDS, draftOptions } from './draft';
import { createInstance } from './instance';
import { defaultMoveset } from './moves';
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
