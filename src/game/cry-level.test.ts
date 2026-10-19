import { describe, expect, it } from 'vitest';
import { CRY_MAX_MS, cryGain, cryPlayMs } from './cry-level';

describe('volume dos gritos', () => {
    it('grito baixo sobe e grito alto desce até a mediana do estilo', () => {
        // Pikachu no estilo Novo era dos mais baixos; Charizard, dos estourados
        expect(cryGain(25, 'latest')).toBeGreaterThan(1.5);
        expect(cryGain(6, 'latest')).toBeLessThan(1);
    });
    it('todo ganho fica dentro de ±8 dB (ninguém some nem estoura pela conta)', () => {
        for (const style of ['legacy', 'latest'] as const)
            for (let id = 1; id <= 151; id++) {
                const g = cryGain(id, style);
                expect(g).toBeGreaterThanOrEqual(10 ** (-8 / 20));
                expect(g).toBeLessThanOrEqual(10 ** (8 / 20));
            }
    });
    it('grito longo é cortado (com fade) e o tom mais agudo encurta', () => {
        // Jynx no Gen 1 tem 2,2 s
        expect(cryPlayMs(124, 'legacy')).toBe(CRY_MAX_MS);
        expect(cryPlayMs(16, 'legacy')).toBeLessThan(300);
        expect(cryPlayMs(16, 'legacy', 1.15)).toBeLessThan(cryPlayMs(16, 'legacy'));
    });
});
