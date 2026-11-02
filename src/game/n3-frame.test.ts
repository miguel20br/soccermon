import { describe, expect, it } from 'vitest';
import { keepTarget } from '../ui/court-follow';
import { GAME_W, L, toPx } from './court';

describe('câmera do golpe máximo (Miguel, 01/11: "o golpe máximo ainda tá cortando o gol")', () => {
    it('quadra grande do celular: a janela que anda segura o gol atacado inteiro (keepTarget)', () => {
        // janela de 26 m (canvas 650 px pra 968 do mundo: k = 0,67) com o alvo no meio da quadra: anda até o gol caber
        const k = 650 / GAME_W;
        const view = 390;
        const keep = { x0: toPx(L - 3, 0).x * k, x1: toPx(L + 1.3, 0).x * k };
        for (const t0 of [100, 325, 500, 640]) {
            const t = keepTarget(t0, keep, view);
            expect(keep.x0 >= t - view / 2 && keep.x1 <= t + view / 2).toBe(true);
        }
        // já cabendo, não mexe
        expect(keepTarget(500, keep, view)).toBe(500);
        expect(keepTarget(300, null, view)).toBe(300);
    });
});
