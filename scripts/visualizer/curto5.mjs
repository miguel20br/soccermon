// "Curto-circuito" (144 BPM): Pikachu corre na roda e dá luz ao ginásio; blecautes; a força volta; o chute final de trovão.
// Pokémon (Gen 1): Pikachu 25, Magnemite 81, Voltorb 100, torcida de costas: Jigglypuff 39, Psyduck 54, Machop 66, Squirtle 7, Bulbasaur 1.
import { acabamento, bloco, bloom, camera, esmear } from './fx.mjs';
import { W, H, quadra } from './quadra.mjs';
import { banda } from './fx.mjs';
import { clamp, ease, hex, rnd } from './pix.mjs';
import { pmd } from './pmd.mjs';

export const RES = [640, 360];
const Y = hex('#ffcb05'), RED = hex('#e8423f'), WARM = hex('#fff0a0'), CY = hex('#9ad8ff'), PINK = hex('#ff5aa8');
const lerp = (a, b, t) => a + (b - a) * t;
const FEET = 318;
const FIM = 85, CHUTE = 85.0, GOL = 86.3;

function forca(tt, vol) { // 0..1,2: quanto de energia o ginásio tem
    if (tt < 3.5) return 0.15 + 0.25 * clamp(tt / 3.5);
    if (tt < 17) return 0.8 + 0.2 * vol;
    if (tt < 24) return Math.max(0, 0.8 * (1 - (tt - 17) / 7)) * (Math.sin(tt * 14) > -0.3 ? 1 : 0.3);
    if (tt < 27) return 0;
    if (tt < 30) return lerp(0.1, 0.8, ease((tt - 27) / 3));
    if (tt < 59) return 1 + 0.2 * vol;
    if (tt < 68) return 0.04 + 0.05 * vol;
    if (tt < 72) return lerp(0.1, 1, ease((tt - 68) / 4));
    return 1.1 + 0.2 * vol;
}
function raio(P, x0, y0, x1, y1, col, a, seed) { const r = rnd(seed), n = 9; let px = x0, py = y0; for (let i = 1; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t) + (i < n ? (r() - 0.5) * 22 : 0), y = lerp(y0, y1, t) + (i < n ? (r() - 0.5) * 14 : 0); P.line(px, py, x, y, col, 2, a); P.line(px, py, x, y, [255, 255, 255], 1, a); px = x; py = y; } }
function roda(P, x, y, r, ang, col, glow) { for (let k = 0; k < 8; k++) { const a = ang + (k * Math.PI) / 4; P.line(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, col, 2, 0.85); } for (let t = 0; t < 120; t++) { const a = (t / 120) * 6.283; P.rect(x + Math.cos(a) * r - 1, y + Math.sin(a) * r - 1, 3, 3, col); } if (glow > 0.1) P.circle(Math.round(x), Math.round(y), Math.round(r * 0.2), WARM, 0.6 * glow); }

function mundo(P, c) {
    const { tt, beatN, q, bandas } = c, cam = c.cam, ox = (d) => -cam * d, pw = forca(tt, c.vol), kick = c.kickPulse;
    const lap2 = tt >= 30 && tt < 59 || tt >= 72, pico = tt >= 72;
    const apaga = pw < 0.12;
    quadra(P, c, { luz: Math.min(1, pw), cam, placar: tt > GOL ? [1, 0] : [0, 0], cel: tt >= 59 && tt < 70 ? 0.35 : 0, lamps: [[160, 0.2], [320, 0.24], [480, 0.2]], tinta: lap2 ? [PINK, pico ? 0.07 : 0.045] : null });
    // roda do Pikachu (esquerda) e quem a roda
    const wx = 150 + ox(1.0), wy = 262, rp = 64, ang = tt * (0.5 + pw * 7) * (pw < 0.12 ? 0 : 1) + (tt < 59 ? 0 : 0);
    roda(P, wx, wy, rp, ang, hex(pw > 0.2 ? '#aab4d8' : '#4a5278'), pw);
    P.rect(wx - rp - 8, FEET + 2, rp * 2 + 16, 4, hex('#1c2447'));
    // Magnemites: refletores vivos
    for (const [i, mx] of [160, 320, 480].entries()) {
        const x = mx + ox(0.7), y = 64 + Math.sin(tt * 2 + i) * 4;
        pmd(P, 81, 'Idle', 0, Math.floor(tt * 4 + i), x, y + 28, { sc: 2, dim: 0.35 + 0.65 * Math.min(1, pw + (tt < 3.5 ? clamp((tt - i * 1.0) / 0.4) * 0.7 : 0)) });
        if (apaga && Math.sin(tt * 9 + i) > 0.6) { P.px(x - 5, y + 10, CY); P.px(x + 4, y + 10, CY); }
    }
    // raios entre eles no pico de energia
    if (pw > 0.9 && kick > 0.45) { raio(P, 160 + ox(0.7), 70, 320 + ox(0.7), 70, CY, 0.9, Math.floor(tt * 20)); raio(P, 320 + ox(0.7), 70, 480 + ox(0.7), 70, CY, 0.9, Math.floor(tt * 20) + 5); }
    if (tt < 3.5) { const arc = Math.floor(tt * 2) % 2; raio(P, 160 + ox(0.7), 70, 320 + ox(0.7), 70, CY, tt > 1 ? 0.8 * (Math.sin(tt * 30) > 0 ? 1 : 0.3) : 0.0, 3 + arc); }
    // Voltorb rola devagar na quadra; no fim vira a bola do chute
    let vx = 360 + Math.sin(tt * 0.5) * 120, vy = FEET - 4, vrot = tt * 2, van = 'Walk';
    if (tt >= 72 && tt < CHUTE) { vx = 340; vrot = 0; van = 'Idle'; }
    if (tt >= CHUTE) { const u = clamp((tt - CHUTE - 0.1) / 1.2); vx = lerp(340, 596, u); vy = FEET - 4 - Math.sin(u * Math.PI) * 90; vrot = u * 18; van = u >= 1 ? 'Hurt' : 'Walk'; }
    if (tt > 3.5 && !(tt >= 24 && tt < 26.5)) { pmd(P, 100, van, 2, Math.floor(tt * 8), vx + ox(1.0), vy, { sc: 2, rot: vrot, dim: 0.5 + 0.5 * Math.min(1, pw + 0.3) }); P.rect(vx + ox(1.0) - 16, FEET + 1, 32, 3, [0, 0, 0], 0.35); }
    if (tt >= GOL && tt < GOL + 4) { const r = rnd(4); for (let i = 0; i < 40; i++) { const a = r() * 6.283, d = (tt - GOL) * 90 * (0.4 + r()); P.rect(596 + Math.cos(a) * d, 270 + Math.sin(a) * d + (tt - GOL) * 20, 3, 3, [Y, RED, CY, PINK][i % 4], 1 - (tt - GOL) / 4); } for (let i = 0; i < 6; i++) P.circle(596 + i * 4, 270 - (tt - GOL) * 28 - i * 10, 5 + i, hex('#111'), 0.28); }
    // Pikachu: corre na roda; apaga e cai; volta; chuta
    let px = wx, py = FEET, anim = 'Walk', dir = 2, n = Math.floor(tt * 10), sc = 2.3, rot = 0;
    if (tt < 3.5) { py = FEET - 4; anim = 'Idle'; n = 0; sc = 2.3; }
    else if (pw >= 0.12 && tt < 83.4) { n = Math.floor(tt * (6 + pw * 10)); px = wx + Math.sin(tt * 2) * 3; }
    else if (tt < 83.4) { anim = tt > 24 && tt < 27 ? 'Idle' : 'Hurt'; dir = 0; n = Math.floor(tt * 3); if (tt > 20 && tt < 27) { rot = tt > 22 ? 1.4 : 0; px = wx + 30; } }
    else { const u = clamp((tt - 83.4) / 1.5); px = lerp(wx, 290, ease(u)) ; anim = tt >= CHUTE ? 'Shoot' : 'Walk'; n = tt >= CHUTE ? Math.floor((tt - CHUTE) * 12) : Math.floor(tt * 14); if (tt >= CHUTE) px = 290; }
    if (tt >= 60 && tt < 68) { pmd(P, 25, 'Walk', 2, Math.floor(tt * 6), wx, FEET, { sc: 2.3, dim: 1 }); } // sozinho no escuro, só as bochechas dele iluminam
    else pmd(P, 25, anim, dir, n, px, py, { sc, rot, dim: apaga ? 0.4 : 1 });
    if (tt >= 60 && tt < 68) { for (let i = 0; i < 6; i++) { P.px(wx + 2 + Math.sin(tt * 9 + i * 2) * 26, FEET - 26 + Math.cos(tt * 7 + i) * 14, Y, 0.8); } P.circle(Math.round(wx), FEET - 18, 40, Y, 0.06); }
    if (tt >= 83.4 && tt < CHUTE + 0.15) P.rect(0, 0, W, H, WARM, 0.12 * (tt - 83.4) / 1.6);
    // torcida de costas em primeiro plano (Gen 1)
    [39, 54, 66, 7, 1].forEach((id, i) => { const x = 60 + i * 130 + ox(1.5), u = beatN % 1, alto = pw > 0.5 && (kick > 0.2 || (lap2 && tt % 0.8 < 0.3)); pmd(P, id, 'Idle', 4, Math.floor(tt * 3 + i), x, 372 - (alto ? Math.sin(u * Math.PI) * 10 : 0), { sc: 2.6, dim: 0.28 + 0.4 * Math.min(1, pw) }); });
    // raio do chute e clarão
    if (tt >= CHUTE && tt < CHUTE + 0.6) { raio(P, 300 + ox(1), 280, 340 + ox(1), 284, WARM, 1, 40 + Math.floor(tt * 40)); P.rect(0, 0, W, H, [255, 255, 255], 0.5 * (1 - (tt - CHUTE) / 0.6)); }
    if (tt >= GOL && tt < GOL + 0.3) P.rect(0, 0, W, H, Y, 0.45 * (1 - (tt - GOL) / 0.3));
    if (tt >= 17 && tt < 18) P.rect(0, 0, W, H, [0, 0, 0], 0.4 * Math.sin((tt - 17) * 3));
    void banda; void bandas; void q; void RED;
}

export function curto5(P, c) {
    const { tt, q } = c;
    let cam = 0, k = { z: 1 };
    const sh = { dx: Math.round(c.kickPulse * Math.sin(q * 4) * (tt >= 30 ? 2 : 1)), dy: 0 };
    if (tt < 3.5) { const u = tt / 3.5; k = { z: lerp(2.2, 1.05, ease(u)), cx: lerp(320, 320, u), cy: lerp(80, 190, ease(u)), rot: lerp(-0.05, 0, u) }; }
    else if (tt < 17) { const u = (tt - 3.5) / 13.5; cam = lerp(-60, 60, u); k = { z: 1.1, cx: 320, cy: 195, rot: 0.01 * Math.sin(tt) }; }
    else if (tt < 27) { const u = (tt - 17) / 10; cam = -20; k = { z: lerp(1.2, 2.0, ease(u)), cx: lerp(300, 170, u), cy: lerp(200, 270, u), rot: 0.03 * Math.sin(tt * 0.7) }; }
    else if (tt < 30) { const u = (tt - 27) / 3; k = { z: lerp(2.0, 1.1, ease(u)), cx: lerp(170, 320, u), cy: lerp(270, 190, u), rot: lerp(0.05, 0, u) }; }
    else if (tt < 59) { const e = Math.floor((tt - 30) / 6.67), u = ((tt - 30) % 6.67) / 6.67; const pre = [{ cam: lerp(60, -60, u), z: 1.1, cx: 320, cy: 195, rot: 0 }, { cam: 0, z: lerp(1.3, 1.9, ease(u)), cx: lerp(380, 340, u), cy: 270, rot: -0.04 }, { cam: lerp(-40, 40, u), z: 1.25, cx: 320, cy: 130, rot: 0.03 }, { cam: 0, z: lerp(1.9, 1.2, ease(u)), cx: 170, cy: lerp(270, 220, u), rot: 0.02 }][e % 4]; cam = pre.cam; k = pre; }
    else if (tt < 68) { const u = (tt - 59) / 9; k = { z: lerp(1.5, 2.1, ease(u)), cx: 150, cy: 270, rot: 0.02 * Math.sin(tt) }; }
    else if (tt < 72) { const u = (tt - 68) / 4; k = { z: lerp(2.0, 1.1, ease(u)), cx: lerp(160, 320, u), cy: lerp(260, 190, u), rot: 0 }; }
    else if (tt < 83.4) { const u = (tt - 72) / 11.4; cam = lerp(80, -80, u); k = { z: 1.15, cx: 320, cy: 195, rot: 0.04 * Math.sin(u * 12.5) }; }
    else if (tt < GOL + 0.2) { const u = clamp((tt - 83.4) / 3); k = { z: lerp(1.3, 1.6, u), cx: lerp(250, 560, ease(u)), cy: 260, rot: lerp(0, -0.03, u) }; }
    else { const u = ease(clamp((tt - GOL) / 4)); k = { z: lerp(1.6, 1.0, u), cx: lerp(560, 320, u), cy: lerp(260, 160, u), rot: 0 }; }
    mundo(P, { ...c, cam });
    camera(P, { ...k, ...sh });
    for (const ct of [3.5, 17, 27, 30, 36.67, 43.3, 50, 56.7, 59, 68, 72, FIM - 1.6]) { const d = Math.abs(tt - ct); if (d < 0.25) { const p = 1 - d / 0.25; if (ct % 2 > 1) esmear(P, Math.round(p * 28)); else bloco(P, p * 0.9, ct); } }
    bloom(P, 200, 0.7); acabamento(P, 0.6);
    if (tt > c.dur - 1.0) bloco(P, clamp((tt - (c.dur - 1.0)) / 0.9), 3);
}
