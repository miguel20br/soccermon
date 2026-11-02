import { describe, expect, it } from 'vitest';
import { createInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { beatsAt, beatTimes, CASCADE_MAX_MS, stepIndex, walkoutIndex } from './beats';

describe('cascata', () => {
    it('soma os intervalos e encolhe pra caber no teto', () => {
        expect(beatTimes([0, 400, 600])).toEqual([0, 400, 1000]);
        const long = beatTimes([0, 2000, 2000, 2000]);
        expect(long.at(-1)).toBe(CASCADE_MAX_MS);
        expect(long[1]).toBeLessThan(long[2]);
    });
    it('conta as batidas que já bateram (pular = tudo)', () => {
        const t = beatTimes([0, 400, 600]);
        expect(beatsAt(t, 0)).toBe(1);
        expect(beatsAt(t, 999)).toBe(2);
        expect(beatsAt(t, Number.POSITIVE_INFINITY)).toBe(3);
    });
});

describe('walkout', () => {
    const rng = new Rng('walk', 'test');
    const mk = (id: number) => ({ ...createInstance(id, rng), shiny: false });
    it('só ouro (75+) ou edição ganha walkout, e só o melhor', () => {
        const weak = [mk(10), mk(13), mk(16)];
        expect(weak.every((c) => viewInstance(c).overall < 75)).toBe(true);
        expect(walkoutIndex(weak)).toBe(-1);
        const gold = mk(149);
        expect(viewInstance(gold).overall).toBeGreaterThanOrEqual(75);
        expect(walkoutIndex([weak[0], gold, weak[1]])).toBe(1);
        // edição especial passa na frente da nota
        const shiny = { ...mk(19), shiny: true };
        expect(walkoutIndex([gold, weak[0], shiny])).toBe(2);
    });
});

describe('seletor ‹ ›', () => {
    it('para nas pontas (volume) ou dá a volta (formações)', () => {
        expect(stepIndex(0, -1, 5, false)).toBe(0);
        expect(stepIndex(4, 1, 5, false)).toBe(4);
        expect(stepIndex(0, -1, 5, true)).toBe(4);
        expect(stepIndex(4, 1, 5, true)).toBe(0);
        expect(stepIndex(2, 1, 5, false)).toBe(3);
    });
});
