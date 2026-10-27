import { describe, expect, it } from 'vitest';
import { createInstance, slotRating, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { lineupAverage, subSummary } from './rating';

describe('lineupAverage', () => {
    const rng = new Rng(7, 'rating-test');
    const pikachu = createInstance(25, rng);

    it('conta a nota na vaga: atacante no gol puxa a média pra baixo (VERSUS = draft)', () => {
        // 1-2-1: a vaga 0 é o goleiro
        expect(viewInstance(pikachu).positions[0]).not.toBe('GK');
        const noGol = lineupAverage([pikachu], '1-2-1');
        expect(noGol).toBe(slotRating(pikachu, 'GK'));
        expect(noGol).toBeLessThan(viewInstance(pikachu).overall);
    });

    it('ignora vaga vazia e usa a vaga certa de cada índice', () => {
        expect(lineupAverage([null, pikachu], '1-2-1')).toBe(slotRating(pikachu, 'FIXO'));
        expect(lineupAverage([], '1-2-1')).toBe(0);
    });
});

describe('subSummary', () => {
    it('compara os dois na mesma vaga e da a diferenca', () => {
        const rng = new Rng(7, 'sub-test');
        const a = createInstance(25, rng);
        const b = createInstance(16, rng);
        const s = subSummary(a, b, 'GK');
        expect(s.out.rating).toBe(slotRating(a, 'GK'));
        expect(s.in.rating).toBe(slotRating(b, 'GK'));
        expect(s.diff).toBe(s.in.rating - s.out.rating);
    });
});
