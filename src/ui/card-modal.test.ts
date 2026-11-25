import { describe, expect, it } from 'vitest';
import { canPickMoves } from './card-modal';

describe('canPickMoves (botão "Golpes" da ficha curta)', () => {
    it('só na escalação, com o time destravado e fora da ficha de espécie', () => {
        expect(canPickMoves({ status: 'lineup' })).toBe(true);
        expect(canPickMoves({ status: 'lineup', lockedTeam: [] })).toBe(false);
        expect(canPickMoves({ status: 'playing' })).toBe(false);
        expect(canPickMoves({ status: 'lineup' }, true)).toBe(false);
        expect(canPickMoves(null)).toBe(false);
    });
});
