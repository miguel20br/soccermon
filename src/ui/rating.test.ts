import { describe, expect, it } from 'vitest';
import { createInstance, slotRating, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { lineupAverage } from './rating';

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
