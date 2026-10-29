import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {}, playCry: () => {} }));

import { cutTo, daysUntil, ULTIMATE_AT } from './ModeMenu';

describe('menu de modos', () => {
    it('conta os dias até o Ultimate pra cima e para no zero', () => {
        expect(daysUntil(ULTIMATE_AT, new Date('2026-10-29T12:00:00-03:00'))).toBe(29);
        expect(daysUntil(ULTIMATE_AT, new Date('2026-11-26T23:00:00-03:00'))).toBe(1);
        expect(daysUntil(ULTIMATE_AT, new Date('2026-12-01T00:00:00-03:00'))).toBe(0);
    });

    it('o corte do JOGAR leva o centro da quadra pro centro da tela, cobrindo tudo', () => {
        const r = (left: number, top: number, width: number, height: number) => ({ left, top, width, height });
        const view = r(0, 0, 390, 844);
        const scene = r(20, 80, 350, 280);
        const c = cutTo(scene, view, r(0, -100, 390, 1000)); // conteúdo rolado 100 px pra cima
        expect(c.s).toBeCloseTo(844 / 280);
        // o centro da quadra (195, 220 na tela = 195, 320 no conteúdo) cai no centro da tela
        expect(0 + 195 * c.s + c.x).toBeCloseTo(195);
        expect(-100 + 320 * c.s + c.y).toBeCloseTo(422);
    });
});
