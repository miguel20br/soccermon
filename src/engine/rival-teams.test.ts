import { describe, expect, it } from 'vitest';
import { buildCupOpponents } from './cup';
import { species } from './data';

// Times dos líderes (Miguel, 04/11/2026): temáticos, capitão do tipo, sem contra-tipo nem lendário solto
describe('times dos líderes de ginásio', () => {
    const teams = Array.from({ length: 60 }, (_, i) => buildCupOpponents(`lider-${i}`)).flat();
    const byName = (name: string) => teams.filter((t) => t.name === name);
    const typesOf = (id: number) => species(id).types;

    it('a Misty não leva Fogo e ninguém leva lendário fora do tipo', () => {
        for (const t of byName('Cerulean Cascata'))
            for (const p of [...t.lineup, ...t.bench]) expect(typesOf(p.speciesId)).not.toContain('Fire');
        for (const t of byName('Celadon Arco-Íris'))
            for (const p of [...t.lineup, ...t.bench]) expect(typesOf(p.speciesId)).not.toContain('Fire');
        for (const t of byName('Cerulean Cascata'))
            for (const p of [...t.lineup, ...t.bench])
                if (species(p.speciesId).tier === 'legendary') expect(typesOf(p.speciesId)).toContain('Water');
    });

    it('o capitão é do tipo do líder e a Misty tem 4+ titulares Água', () => {
        for (const t of byName('Cerulean Cascata')) {
            const cap = t.lineup.find((p) => p.uid === t.captainUid)!;
            expect(typesOf(cap.speciesId)).toContain('Water');
            expect(t.lineup.filter((p) => typesOf(p.speciesId).includes('Water')).length).toBeGreaterThanOrEqual(4);
        }
    });
});
