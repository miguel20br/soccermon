import { describe, expect, it } from 'vitest';
import { ehMaratona, ehVersaoAntiga, versoesRecentes } from './funil-criterio';

describe('critério do funil do stats', () => {
    it('maratona é mais de 20 copas', () => {
        expect(ehMaratona(20)).toBe(false);
        expect(ehMaratona(21)).toBe(true);
    });
    it('versão antiga = fora das 3 mais novas (compara número, não texto)', () => {
        const r = versoesRecentes(['0.9.9', '0.9.13', '0.9.18', '0.9.19', '0.9.18']);
        expect([...r].sort()).toEqual(['0.9.13', '0.9.18', '0.9.19']);
        expect(ehVersaoAntiga('0.9.9', r)).toBe(true);
        expect(ehVersaoAntiga('0.9.19', r)).toBe(false);
        expect(ehVersaoAntiga(undefined, r)).toBe(false);
    });
});
