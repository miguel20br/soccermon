import { describe, expect, it } from 'vitest';
import { countValue } from './CountUp';

describe('CountUp', () => {
    it('antes do começo mostra o valor de partida (nada de placar negativo num quadro com carimbo atrasado)', () => {
        expect(countValue(0, 3, -16, 600)).toBeCloseTo(0, 9);
        expect(countValue(0, 3, 0, 600)).toBeCloseTo(0, 9);
        expect(countValue(0, 3, 600, 600)).toBe(3);
        expect(countValue(0, 3, 9999, 600)).toBe(3);
    });
});
