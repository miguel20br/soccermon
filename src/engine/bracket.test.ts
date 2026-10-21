import { describe, expect, it } from 'vitest';
import { relampagoBracket } from './bracket';
import { buildCupOpponents } from './cup';

const you = { name: 'Pallet FC', color: 0xe8423f };

describe('chave da Copa Relâmpago', () => {
    it('16 clubes sem repetir; a mesma seed dá a mesma chave', () => {
        const opps = buildCupOpponents('chave-1');
        const b = relampagoBracket('chave-1', you, opps, []);
        expect(b.map((r) => r.length)).toEqual([8, 4, 2, 1]);
        const names = b[0].flatMap((m) => [m.a.name, m.b.name]);
        expect(new Set(names).size).toBe(16);
        expect(relampagoBracket('chave-1', you, opps, [])).toEqual(b);
    });

    it('você cruza com os seus rivais da copa, fase a fase, e o seu placar é o de verdade', () => {
        const opps = buildCupOpponents('chave-2');
        const results = [
            { score: [3, 1] as [number, number], won: true },
            { score: [2, 1] as [number, number], won: true },
            { score: [4, 2] as [number, number], won: true },
        ];
        const b = relampagoBracket('chave-2', you, opps, results);
        for (let r = 0; r < 4; r++) {
            const mine = b[r].find((m) => m.a.you)!;
            expect(mine.b.name).toBe(opps[r].name);
            if (results[r]) expect(mine.score).toEqual(results[r].score);
            else expect(mine.score).toBeUndefined();
        }
    });

    it('perdeu: quem te eliminou segue na chave', () => {
        const opps = buildCupOpponents('chave-3');
        const b = relampagoBracket('chave-3', you, opps, [{ score: [1, 3], won: false }]);
        expect(b[1].some((m) => m.a.name === opps[0].name || m.b.name === opps[0].name)).toBe(true);
        expect(b[1].some((m) => m.a.you || m.b.you)).toBe(false);
    });
});
