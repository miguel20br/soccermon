import { describe, expect, it } from 'vitest';
import data from '../src/data/kanto-encounters.json';
import { idsOf } from './lib/download';

// Base do "Draft do lugar" (Modo história) e do evento "Mato alto" da Rota: scripts/fetch-encounters.ts.
const WILD = new Set(['walk', 'surf', 'old-rod', 'good-rod', 'super-rod', 'static', 'pokeflute']);
type Row = [number, string, number, number, number, string];
const areas = data.areas as Record<string, { name: string; mons: Row[] }>;
const notWild = data.notWild as Record<string, string>;

describe('encontros de Red/Blue/Yellow', () => {
    const wild = new Set(Object.values(areas).flatMap((a) => a.mons.filter((m) => WILD.has(m[1])).map((m) => m[0])));

    it('todo Pokémon da Gen 1 aparece na natureza ou tem o motivo de não aparecer', () => {
        expect(idsOf(1).filter((id) => wild.has(id) === !!notWild[id])).toEqual([]);
    });

    it('cada linha tem chance, níveis e versões válidos', () => {
        for (const [slug, a] of Object.entries(areas)) {
            expect(a.name, slug).toBeTruthy();
            for (const [id, , chance, lo, hi, versions] of a.mons) {
                expect(id >= 1 && id <= 151, `${slug} #${id}`).toBe(true);
                expect(chance > 0 && chance <= 100 && lo <= hi, `${slug} #${id}`).toBe(true);
                expect(versions, `${slug} #${id}`).toMatch(/^r?b?y?$/);
            }
        }
    });

    it('os de sempre estão onde a gente lembra', () => {
        const where = (id: number) => Object.keys(areas).filter((k) => areas[k].mons.some((m) => m[0] === id));
        expect(where(25)).toContain('viridian-forest-area');
        expect(notWild[1]).toBe('presente');
        expect(notWild[138]).toBe('fossil');
    });

    it('habitat, cor e forma dos 151', () => {
        const species = data.species as Record<string, { habitat: string | null; color: string; shape: string }>;
        expect(idsOf(1).filter((id) => !species[id]?.habitat || !species[id].color || !species[id].shape)).toEqual([]);
    });
});
