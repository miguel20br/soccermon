// Ginásio de futsal à noite (quadra, não gramado): arquibancada que acende com o espectro, placar, refletores, piso com reflexo.
import { banda, cone, poeira, reflexo } from './fx.mjs';
import { clamp, hex, mix, rnd } from './pix.mjs';

export const W = 640, H = 360, PISO = 214;
const COR = [hex('#e8423f'), hex('#ffcb05'), hex('#3a7bd5'), hex('#58c26b')];
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
export const digito = (P, d, x, y, s, col) => { const g = DIG[d]; for (let i = 0; i < 15; i++) if (g[i] === '1') P.rect(x + (i % 3) * s, y + Math.floor(i / 3) * s, s, s, col); };
const crowd = (() => { const r = rnd(5); return Array.from({ length: 14 * 44 }, () => ({ c: Math.floor(r() * 4), up: r() < 0.3, h: r() })); })();

/** o: { luz 0..1, cam (parallax), placar [a,b]|null, cel (luzinhas de celular 0..1), tinta [cor, a], lamps [[x, alfa]...] } */
export function quadra(P, c, o) {
    const { tt, beatN } = c, ox = (d) => -(o.cam ?? 0) * d, luz = o.luz;
    P.grad(0, 70, hex('#04050e'), hex('#0a0f26'));
    for (let x = -40; x < W + 40; x += 64) P.rect(x + ox(0.2), 24, 3, 46, hex('#121830'));
    P.rect(0, 22, W, 4, hex('#121830')); P.rect(0, 66, W, 3, hex('#0c1230'));
    // arquibancada: cada coluna = uma banda do espectro; acende de baixo pra cima
    P.rect(0, 69, W, PISO - 69, hex('#080b1e'));
    for (let row = 0; row < 13; row++) {
        const y = 74 + row * 10, sc = 0.8 + row * 0.03;
        for (let col = -2; col < 44; col++) {
            const x = col * 16 + ox(0.5 + row * 0.02) + ((row & 1) ? 8 : 0), p = crowd[(row * 44 + ((col + 44) % 44)) % crowd.length], k = Math.max(0, Math.min(39, col));
            const lv = (c.bandas[k] ?? 0) * luz, on = (12 - row) / 13 < lv * 1.1 + luz * 0.25;
            const base = on ? mix(hex('#161c3c'), COR[p.c], clamp(0.35 + 0.65 * lv + luz * 0.2)) : hex('#0e1230');
            P.rect(x, y + 3, 12, 8, base); P.rect(x + 3, y, 6, 4, on ? hex('#c89a78') : hex('#161a38'));
            if (p.up && on && ((Math.floor(beatN) + col) & 1)) { P.rect(x - 1, y - 4, 2, 6, hex('#c89a78')); P.rect(x + 11, y - 4, 2, 6, hex('#c89a78')); }
            if (o.cel && p.h < o.cel && Math.sin(tt * 3 + p.h * 40) > -0.3) P.rect(x + 5, y - 3, 2, 2, [255, 255, 255], 0.9);
        }
    }
    // placas de publicidade e a grade
    for (let i = 0; i < 20; i++) P.rect(i * 32 + ox(0.8), PISO - 14, 30, 12, mix(hex('#0c1030'), COR[i % 4], 0.15 + 0.6 * luz));
    P.rect(0, PISO - 2, W, 2, hex('#1c2447'));
    // quadra azul em perspectiva
    P.grad(PISO, H, hex('#1a3880'), hex('#2f60c0'));
    for (let i = 0; i < 9; i++) P.rect(0, Math.round(PISO + Math.pow(i / 9, 1.7) * (H - PISO)), W, 1, hex('#17317a'));
    const L = [244, 241, 230], a = 0.55 + 0.4 * luz;
    P.line(320 + ox(0.9), PISO + 2, 320 + ox(0.9), H, L, 2, a);
    for (let t = 0; t < 360; t += 2) P.px(320 + ox(0.9) + 100 * Math.cos((t * Math.PI) / 180), 290 + 26 * Math.sin((t * Math.PI) / 180), L, a);
    P.line(60 + ox(0.9), PISO + 2, 20 + ox(0.9), H, L, 2, a); P.line(580 + ox(0.9), PISO + 2, 620 + ox(0.9), H, L, 2, a);
    for (const gx of [34, 584]) { const x0 = gx + ox(0.9); P.rect(x0, PISO - 26, 4, 28, [230, 230, 240], 0.8); P.rect(x0 + 22, PISO - 26, 4, 28, [230, 230, 240], 0.8); P.rect(x0, PISO - 26, 26, 3, [230, 230, 240], 0.8); for (let k = 0; k < 6; k++) P.rect(x0 + 4 + k * 3, PISO - 22, 1, 22, [200, 200, 220], 0.3); }
    P.rect(0, PISO, W, H - PISO, [3, 5, 16], clamp(0.82 - luz * 0.9, 0, 0.82));
    reflexo(P, PISO, 120, 0.22 + 0.15 * luz);
    // placar
    if (o.placar) { const x0 = 250 + ox(0.3); P.rect(x0, 4, 140, 44, hex('#07091a')); P.rect(x0, 4, 140, 2, hex('#4b5a9a')); P.rect(x0, 46, 140, 2, hex('#4b5a9a')); const ac = luz > 0.15; digito(P, o.placar[0], x0 + 30, 12, 5, ac ? COR[0] : hex('#2a1010')); digito(P, o.placar[1], x0 + 96, 12, 5, ac ? COR[2] : hex('#101a2a')); if (ac && (beatN | 0) % 2 === 0) { P.rect(x0 + 68, 20, 4, 4, COR[1]); P.rect(x0 + 68, 32, 4, 4, COR[1]); } }
    // refletores
    for (const [lx, al] of o.lamps ?? []) { const cn = cone(P, lx + ox(0.3), 28, 0, 210, 24, 190, [255, 244, 220], al * luz); if (luz > 0.3) poeira(P, cn, tt, 22, [255, 244, 220], lx); }
    if (o.tinta) P.rect(0, 0, W, H, o.tinta[0], o.tinta[1]);
    void banda;
}
