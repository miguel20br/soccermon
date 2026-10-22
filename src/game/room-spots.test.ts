import { describe, expect, it } from 'vitest';
import { bodyHeight } from './animation-manager';
import { clampToFloor, FLOOR_PROPS, fitScale, MI, monScale, ROOM_FLOOR } from './room-spots';

const SPECIES = Array.from({ length: 151 }, (_, i) => i + 1);

describe('sala de troféus', () => {
    it('o Pokémon que passeia tem escala inteira (pixel art sem deformar) e cabe no quarto', () => {
        for (const id of SPECIES) {
            const s = monScale(bodyHeight(id));
            expect(Number.isInteger(s), `#${id}`).toBe(true);
            expect(bodyHeight(id) * s, `#${id}`).toBeLessThanOrEqual(72);
        }
        expect(monScale(bodyHeight(25))).toBe(2);
        expect(monScale(bodyHeight(95))).toBe(1);
    });

    it('a foto da carta cabe na caixa sem esticar', () => {
        const s = fitScale(90, 69, 12);
        expect(90 * s).toBe(12);
        expect(69 * s).toBeLessThan(12);
    });

    it('nenhum móvel na frente do chão onde ele anda (não passa por baixo nem entra no móvel)', () => {
        const tallest = 72;
        for (const [k, [x, bottom]] of Object.entries(FLOOR_PROPS)) {
            const [, , w, h] = MI[k];
            const overlaps =
                x < ROOM_FLOOR.x + ROOM_FLOOR.w &&
                x + w > ROOM_FLOOR.x &&
                bottom - h < ROOM_FLOOR.y + ROOM_FLOOR.h &&
                bottom > ROOM_FLOOR.y - tallest;
            // se encosta na área do corpo, tem que ficar atrás dos pés (base acima do chão livre)
            if (overlaps) expect(bottom, k).toBeLessThanOrEqual(ROOM_FLOOR.y);
        }
    });

    it('o passeio e o "ir olhar" ficam dentro do chão livre, com o corpo inteiro', () => {
        for (const [x, y] of [
            [0, 0],
            [416, 256],
            [60, 236],
            [369, 134],
        ]) {
            const p = clampToFloor(x, y, 28);
            expect(p.x - 28).toBeGreaterThanOrEqual(ROOM_FLOOR.x);
            expect(p.x + 28).toBeLessThanOrEqual(ROOM_FLOOR.x + ROOM_FLOOR.w);
            expect(p.y).toBeGreaterThanOrEqual(ROOM_FLOOR.y);
            expect(p.y).toBeLessThanOrEqual(ROOM_FLOOR.y + ROOM_FLOOR.h);
        }
    });
});
