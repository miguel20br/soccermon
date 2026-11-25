import { describe, expect, it } from 'vitest';
import { speciesSynergies } from './species-synergies';

describe('speciesSynergies', () => {
    it('Snorlax: Monte Prateado e Flauta Pokémon só aparecem depois de descobertas', () => {
        const none = speciesSynergies(143, new Set());
        expect(none.shown.map((s) => s.id)).not.toContain('montePrateado');
        expect(none.hidden).toBeGreaterThanOrEqual(2);
        const all = speciesSynergies(143, new Set(['montePrateado', 'flauta']));
        expect(all.shown.map((s) => s.id)).toEqual(expect.arrayContaining(['montePrateado', 'flauta']));
        expect(all.shown.find((s) => s.id === 'flauta')?.bonus).toBe(5);
    });
    it('secreta não descoberta não vaza id nem parceiros', () => {
        const r = speciesSynergies(25, new Set());
        expect(r.shown.some((s) => s.secret)).toBe(false);
        expect(r.hidden).toBeGreaterThan(0);
        expect(JSON.stringify(r)).not.toMatch(/montePrateado|vermilion|turma/);
    });
    it('rivalidade descoberta fica sem bônus; história sempre aparece', () => {
        const r = speciesSynergies(25, new Set(['vermilion']));
        expect(r.shown.find((s) => s.id === 'vermilion')?.bonus).toBeNull();
        expect(speciesSynergies(150, new Set()).shown.map((s) => s.id)).toContain('genese');
    });
});
