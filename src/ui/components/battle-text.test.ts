import { describe, expect, it } from 'vitest';
import { battleWorthy } from './BattleText';

describe('caixa do golpe (partida nova)', () => {
    it('no 1x e no 2x entra tudo menos o miúdo', () => {
        expect(battleWorthy('normal', 1)).toBe(true);
        expect(battleWorthy('big', 2)).toBe(true);
        expect(battleWorthy('minor', 1)).toBe(false);
    });
    it('no 4x, 8x e Lances só gol, golpe forte e apito', () => {
        for (const sp of [4, 8, 'highlights'] as const) {
            expect(battleWorthy('goal', sp)).toBe(true);
            expect(battleWorthy('big', sp)).toBe(true);
            expect(battleWorthy('whistle', sp)).toBe(true);
            expect(battleWorthy('normal', sp)).toBe(false);
        }
    });
});
