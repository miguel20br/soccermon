import { describe, expect, it } from 'vitest';
import { entryOf, homeOf, walkTier } from './walkout-plan';

describe('plano do walkout', () => {
    it('nível pela edição e pela nota (ut-walkout.md, decidido em 02/11)', () => {
        expect(walkTier('icone', 60)).toBe('especial');
        expect(walkTier('destaque', 70)).toBe('especial');
        expect(walkTier('shiny', 60)).toBe('muitoraro');
        expect(walkTier('evento', 60)).toBe('muitoraro');
        expect(walkTier(null, 85)).toBe('muitoraro');
        expect(walkTier(null, 84)).toBe('raro');
        expect(walkTier(null, 75)).toBe('raro');
        expect(walkTier(null, 74)).toBeNull();
    });

    it('jeito de entrar pela forma', () => {
        expect(entryOf(94)).toBe('aparece'); // Gengar
        expect(entryOf(149)).toBe('voa'); // Dragonite (Voador)
        expect(entryOf(100)).toBe('quica'); // Voltorb
        expect(entryOf(150)).toBe('corre'); // Mewtwo
        expect(entryOf(143)).toBe('anda'); // Snorlax
    });

    it('onde vive: a forma de antes quando só vem de evolução, Kanto quando não tem lugar', () => {
        expect(homeOf(150)).toBe('Cerulean Cave');
        expect(homeOf(149)).toMatch(/Safari|Rota|Celadon/); // Dragonite → Dragonair/Dratini
        expect(homeOf(16)).toMatch(/^Rota \d+$/); // Pidgey
        expect(homeOf(16, false)).toMatch(/^Route \d+$/);
        expect(homeOf(151)).toBe('Kanto');
    });
});
