import { describe, expect, it } from 'vitest';
import { fieldSheet, menuLayout } from './FieldSprite';

describe('fieldSheet', () => {
    it('shiny usa a folha shiny; espécie sem shiny no PMDCollab fica na normal', () => {
        expect(fieldSheet(4, true)).toBe('assets/field/shiny/4.png');
        expect(fieldSheet(4)).toBe('assets/field/4.png');
        expect(fieldSheet(16, true)).toBe('assets/field/16.png');
    });
});

describe('menuLayout', () => {
    it('folha do menu: só Walk/Idle/Hop/Pose (nessa ordem), uma fileira por direção, quadros lado a lado', () => {
        const f = (x: number, y: number, w: number, h: number) => ({ frame: { x, y, w, h } });
        const atlas = {
            frames: {
                'Idle/0/0': f(0, 0, 24, 56),
                'Idle/0/1': f(24, 0, 24, 56),
                'Walk/2/0': f(0, 448, 32, 40),
                'Shoot/0/0': f(0, 1408, 40, 56),
            },
            meta: { size: { w: 1520, h: 3392 } },
        };
        const m = menuLayout(atlas);
        expect(Object.keys(m.atlas.frames).sort()).toEqual(['Idle/0/0', 'Idle/0/1', 'Walk/2/0']);
        expect(m.atlas.frames['Walk/2/0'].frame).toEqual({ x: 0, y: 0, w: 32, h: 40 });
        expect(m.atlas.frames['Idle/0/1'].frame).toEqual({ x: 24, y: 40, w: 24, h: 56 });
        expect(m.atlas.meta.size).toEqual({ w: 48, h: 96 });
        expect(m.copies).toHaveLength(3);
    });
});
