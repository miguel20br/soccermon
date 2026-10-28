import { describe, expect, it } from 'vitest';
import { followOffset, HUD_ZOOM_DAMP } from './court-follow';
import { hudOn } from './hud-lab';

describe('?lab=hud', () => {
    it('é o padrão (0.9.24); hud-off desliga e fica na aba', () => {
        expect(hudOn('', null)).toBe(true);
        expect(hudOn('?lab=hud', '0')).toBe(true);
        expect(hudOn('?lab=hud-off', '1')).toBe(false);
        expect(hudOn('', '0')).toBe(false);
    });
    it('a quadra segue a bola sem mostrar além das bordas', () => {
        // janela de 390 numa quadra de 900: bola no meio centra, nas pontas encosta na borda
        expect(followOffset(450, 390, 900)).toBe(-255);
        expect(followOffset(20, 390, 900)).toBe(0);
        expect(followOffset(880, 390, 900)).toBe(-510);
    });
    it('o zoom dos lances por cima da quadra grande ainda mostra uns 40% da quadra (390x844)', () => {
        // canvas de ~856 px de largura (altura da quadra na tela), quadra = 880 dos 968 px do mundo
        const shown = (zoom: number) => (390 / 856 / (1 + (zoom - 1) * HUD_ZOOM_DAMP)) * (968 / 880);
        expect(shown(1)).toBeGreaterThan(0.48);
        // Transformar (1.5) e o golpe N3 (1.35): antes fechava em ~33% (2 ou 3 Pokémon e o gol)
        expect(shown(1.5)).toBeGreaterThan(0.4);
        expect(shown(1.35)).toBeGreaterThan(0.43);
    });
});
