import { describe, expect, it } from 'vitest';
import { blinkSchedule, evolutionView } from './evolution-view';

describe('evolução na quadra', () => {
    it('o rival ganha animação própria, no duelo pelo lado de quem vê', () => {
        expect(evolutionView(0, 0, false, true)).toBe('mine');
        expect(evolutionView(1, 0, false, true)).toBe('rival');
        // convidado do duelo: o time 1 é o dele, o 0 é o rival
        expect(evolutionView(1, 1, false, true)).toBe('mine');
        expect(evolutionView(0, 1, false, true)).toBe('rival');
    });

    it('sem a forma nova carregada, o rival ainda aparece (antes sumia sem nada na tela)', () => {
        expect(evolutionView(1, 0, false, false)).toBe('rival');
        expect(evolutionView(0, 0, false, false)).toBe('skip');
        expect(evolutionView(1, 0, true, true)).toBe('skip');
    });

    it('as piscadas aceleram e cabem no tempo', () => {
        for (const total of [1500, 6900]) {
            const b = blinkSchedule(total);
            expect(b.length).toBeGreaterThan(5);
            expect(b.reduce((a, x) => a + x, 0)).toBeLessThanOrEqual(total);
            expect(b[b.length - 1]).toBeLessThan(b[0]);
        }
    });
});
