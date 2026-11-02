import { describe, expect, it } from 'vitest';
import { GAME_H, GAME_W, GW, L, n3ShotFrame, toPx, W } from './court';

/** O que a câmera mostra (px do mundo) centrada em (x, y) com o zoom, presa na quadra como o `setBounds`. */
function view(f: { x: number; y: number; zoom: number }) {
    const w = GAME_W / f.zoom;
    const h = GAME_H / f.zoom;
    const x0 = Math.min(Math.max(f.x - w / 2, 0), GAME_W - w);
    const y0 = Math.min(Math.max(f.y - h / 2, 0), GAME_H - h);
    return { x0, x1: x0 + w, y0, y1: y0 + h };
}

describe('câmera do chute N3 (Miguel, 01/11: "a câmera do golpe N3 tá cortando o gol")', () => {
    it('quadra inteira: o gol atacado inteiro e quem chuta no quadro, de perto ou de longe, dos dois lados', () => {
        for (const team of [0, 1] as const)
            for (const [mx, my] of [
                [30, 10],
                [33, 4],
                [20, 15],
                [2, 10],
            ]) {
                const sx = team === 0 ? mx : L - mx;
                const s = toPx(sx, my);
                const v = view(n3ShotFrame(s.x, s.y, team, false));
                const goalX = toPx(team === 0 ? L : 0, 0).x;
                const posts = [toPx(0, W / 2 - GW / 2).y, toPx(0, W / 2 + GW / 2).y];
                expect(goalX >= v.x0 && goalX <= v.x1).toBe(true);
                expect(posts.every((y) => y >= v.y0 && y <= v.y1)).toBe(true);
                expect(s.x >= v.x0 && s.x <= v.x1 && s.y >= v.y0 && s.y <= v.y1).toBe(true);
            }
    });

    it('quadra grande do celular: o foco fica na frente do gol atacado', () => {
        const f = n3ShotFrame(toPx(25, 10).x, toPx(25, 10).y, 0, true);
        expect(f.x).toBeGreaterThan(toPx(L - 10, 0).x);
        expect(f.x).toBeLessThan(toPx(L, 0).x);
    });
});
