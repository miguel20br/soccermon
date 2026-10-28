import { describe, expect, it } from 'vitest';
import { CONNECT_GIVEUP_MS, roomLooksClosed } from './link';

describe('roomLooksClosed', () => {
    it('espera o anfitrião até o limite e só então oferece a saída', () => {
        expect(roomLooksClosed('connecting', 0)).toBe(false);
        expect(roomLooksClosed('connecting', CONNECT_GIVEUP_MS - 1)).toBe(false);
        expect(roomLooksClosed('connecting', CONNECT_GIVEUP_MS)).toBe(true);
    });
    it('sem canal (left) a saída aparece na hora', () => {
        expect(roomLooksClosed('left', 0)).toBe(true);
    });
});
