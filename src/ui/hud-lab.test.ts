import { describe, expect, it } from 'vitest';
import { followOffset } from './court-follow';
import { hudOn } from './hud-lab';

describe('?lab=hud', () => {
    it('liga pela URL, fica na aba e desliga com hud-off', () => {
        expect(hudOn('?lab=hud', null)).toBe(true);
        expect(hudOn('', '1')).toBe(true);
        expect(hudOn('?lab=hud-off', '1')).toBe(false);
        expect(hudOn('', null)).toBe(false);
    });
    it('a quadra segue a bola sem mostrar além das bordas', () => {
        // janela de 390 numa quadra de 900: bola no meio centra, nas pontas encosta na borda
        expect(followOffset(450, 390, 900)).toBe(-255);
        expect(followOffset(20, 390, 900)).toBe(0);
        expect(followOffset(880, 390, 900)).toBe(-510);
    });
});
