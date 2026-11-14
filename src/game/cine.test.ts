import { describe, expect, it, vi } from 'vitest';
import { TYPE_COLOR } from '../ui/type-colors';
import { fitShot, rayToPoly, screenToWorld, shotMid, TYPE_FX, worldToScreen } from './cine';

// a conta do kit é pura; o Phaser só entra quando há cena (no Node ele nem carrega)
vi.mock('phaser', () => ({ default: {} }));

describe('kit de cinema (cine.ts)', () => {
    it('o plano põe o ponto do mundo no ponto da tela pedido, com zoom e giro', () => {
        const shot = { px: 120, py: 300, sx: 200, sy: 150, zoom: 3.2, rot: 0.21 };
        const mid = shotMid(shot, 968, 528);
        const p = worldToScreen(mid, shot.zoom, shot.rot, 968, 528, shot.px, shot.py);
        expect(p.x).toBeCloseTo(shot.sx, 6);
        expect(p.y).toBeCloseTo(shot.sy, 6);
        // e o caminho de volta
        const w = screenToWorld(mid, shot.zoom, shot.rot, 968, 528, shot.sx, shot.sy);
        expect(w.x).toBeCloseTo(shot.px, 6);
        expect(w.y).toBeCloseTo(shot.py, 6);
    });

    it('enquadra as caixas dentro da área útil, no zoom que cabe', () => {
        const safe = { x: 194, y: 0, w: 580, h: 528 };
        const shot = fitShot([{ x: 40, y: 220, w: 40, h: 40 }], safe, { min: 1.8, max: 4.6, fill: 0.5 });
        expect(shot.zoom).toBeCloseTo(4.6);
        expect(shot.sx).toBeCloseTo(safe.x + safe.w / 2);
        const two = fitShot(
            [
                { x: 40, y: 220, w: 40, h: 40 },
                { x: 200, y: 220, w: 40, h: 40 },
            ],
            safe,
            { min: 1.2, max: 4.6, fill: 0.9 },
        );
        // os dois lado a lado (200 px do mundo) cabem em 90% da largura
        expect(two.zoom * 200).toBeLessThanOrEqual(0.9 * safe.w + 1e-6);
    });

    it('as partículas cobrem os tipos da Gen 1, Fada, Sombrio e Aço', () => {
        for (const type of Object.keys(TYPE_COLOR)) expect(TYPE_FX[type], type).toBeDefined();
    });

    it('o raio das linhas do painel para na borda dele', () => {
        const poly = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 },
        ];
        expect(rayToPoly(50, 25, 1, 0, poly)).toEqual({ x: 100, y: 25 });
        expect(rayToPoly(50, 25, 0, -1, poly)?.y).toBeCloseTo(0);
    });
});
