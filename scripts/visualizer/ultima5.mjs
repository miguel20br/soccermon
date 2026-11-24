// "A última partida" (variável 72/100/76/104 BPM, Ré♭ → Mi♭): o veterano entra em quadra pela última vez.
// Pokémon (Gen 1): Arcanine 59 (veterano), Growlithe 58 (lembrança e coda), Geodude 74, Machop 66, Pikachu 25, Squirtle 7, Charmander 4.
// Tempos medidos no volume do master (rodada 6): lembrança 26,7-43,5; apito 70,5; homenagem 75-82; final 82-101; coda 113-152.
import { acabamento, bloco, bloom, camera, cone, esmear, poeira } from './fx.mjs';
import { W, H, quadra } from './quadra.mjs';
import { clamp, ease, hex, rnd } from './pix.mjs';
import { pmd } from './pmd.mjs';

export const RES = [640, 360];
const Y = hex('#ffcb05'), WARM = hex('#ffe38a'), FEET = 316;
const lerp = (a, b, t) => a + (b - a) * t;
const LEMB = [26.7, 43.5], APITO = 70.5, HOME = 75, FINAL = 82, SAIDA = 101, CODA = 113;

function luz(tt) {
    if (tt < 6) return 0.1;
    if (tt < LEMB[0]) return lerp(0.18, 0.5, (tt - 6) / 20.7);
    if (tt < LEMB[1]) return 1;
    if (tt < 47) return 0.14;
    if (tt < APITO) return 0.72;
    if (tt < HOME) return 0.12;
    if (tt < FINAL) return lerp(0.25, 0.5, (tt - HOME) / 7);
    if (tt < SAIDA) return 1.1;
    if (tt < CODA) return Math.max(0.06, lerp(0.8, 0.06, (tt - SAIDA) / 12));
    if (tt < 118) return 0.12;
    if (tt < 143) return 0.2;
    return Math.max(0, 0.2 * (1 - (tt - 143) / 8));
}
function bola(P, x, y, r, rot = 0) { P.rect(x - r, y + r - 1, r * 2, 3, [0, 0, 0], 0.3); P.circle(Math.round(x), Math.round(y), r, hex('#dbe2f2')); P.circle(Math.round(x - 1), Math.round(y - 1), r - 1, [255, 255, 255]); for (let k = 0; k < 5; k++) { const t = (k / 5) * 6.283 + rot; P.circle(Math.round(x + Math.cos(t) * r * 0.62), Math.round(y + Math.sin(t) * r * 0.62), Math.max(1, Math.round(r * 0.28)), hex('#0e1430')); } }
function apito(P, x, y, age, col = [255, 255, 255]) { if (age < 0 || age > 1.2) return; for (let j = 0; j < 3; j++) P.ring(Math.round(x), Math.round(y), 8 + age * 90 + j * 6, col, 0.8 * (1 - age / 1.2)); }

function mundo(P, c) {
    const { tt, beatN, q } = c, cam = c.cam, ox = (d) => -cam * d, L = luz(tt), lem = tt >= LEMB[0] && tt < LEMB[1];
    const cel = tt < 6 ? 0 : tt < LEMB[0] ? lerp(0.03, 0.4, (tt - 6) / 20) : tt >= HOME && tt < FINAL ? lerp(0.4, 0.95, (tt - HOME) / 7) : tt >= FINAL && tt < SAIDA ? 0.5 : tt > 124 && tt < 143 ? 0.04 : 0.1;
    quadra(P, c, { luz: L, cam, placar: tt < 118 ? [tt < LEMB[0] ? 0 : lem ? 3 : 2, tt < LEMB[0] ? 0 : lem ? 2 : 2] : null, cel, lamps: tt < 6 ? [[320, 0.5]] : L > 0.3 ? [[160, 0.16], [320, 0.2], [480, 0.16]] : [[320, 0.35]], tinta: lem ? [hex('#a06a2a'), 0.22] : null });
    // chuva fina na volta do presente
    if (tt >= 43.5 && tt < 70) { const r = rnd(8); for (let i = 0; i < 80; i++) { const x = r() * W, y = (r() * H + tt * 220 * (0.6 + r())) % H; P.line(x, y, x - 3, y + 9, [180, 200, 255], 1, 0.28); } }
    const ball = { x: 320, y: FEET - 8, rot: 0 };
    let acts = [];
    const arc = (id, anim, dir, n, x, y, o = {}) => acts.push({ id, anim, dir, n, x, y, o });
    const VET = { sc: 2.4, gray: 0.5, dim: 0.9 };
    if (tt < 6) { const u = clamp((tt - 0.8) / 3.8); ball.x = lerp(-30, 330, ease(u)); ball.y = FEET - 8 - (u < 1 ? Math.abs(Math.sin(u * 14)) * 8 * (1 - u) : 0); ball.rot = u * 12; }
    else if (tt < LEMB[0]) { const u = clamp((tt - 6) / 18); arc(59, u < 1 ? 'Walk' : 'Idle', u < 1 ? 2 : 0, Math.floor(tt * 4), lerp(-90, 290, ease(u)), FEET, VET); }
    else if (lem) { // lembrança: Growlithe, cortes a cada 1,2 s
        const s = Math.floor((tt - LEMB[0]) / 1.2) % 5, u = ((tt - LEMB[0]) % 1.2) / 1.2;
        if (s === 0) { arc(58, 'Walk', 2, Math.floor(tt * 12), lerp(80, 300, u), FEET, { sc: 2.4 }); ball.x = lerp(110, 330, u); }
        else if (s === 1) { arc(58, 'Walk', 2, Math.floor(tt * 12), lerp(200, 440, u), FEET, { sc: 2.4 }); arc(74, 'Hop', 6, Math.floor(u * 10), 400, FEET, { sc: 2.2 }); ball.x = lerp(230, 470, u); }
        else if (s === 2) { arc(58, 'Shoot', 2, Math.floor(u * 10), 480, FEET, { sc: 2.4 }); ball.x = lerp(500, 600, u); ball.y = FEET - 8 - Math.sin(u * Math.PI) * 50; }
        else if (s === 3) { arc(58, 'Hop', 0, Math.floor(u * 10), 320, FEET - Math.sin(u * Math.PI) * 14, { sc: 2.6 }); arc(25, 'Hop', 0, Math.floor(u * 10), 230, FEET, { sc: 2.2 }); arc(7, 'Hop', 0, Math.floor(u * 10), 410, FEET, { sc: 2.2 }); ball.x = 600; ball.y = FEET - 14; }
        else { arc(58, 'Idle', 0, Math.floor(tt * 3), 320, FEET, { sc: 3.0 }); const r = rnd(7); for (let i = 0; i < 50; i++) P.rect(r() * W, (r() * H + (tt - LEMB[0]) * 80) % H, 3, 3, [Y, [232, 66, 63], [58, 123, 213], [88, 194, 107]][i % 4]); ball.x = -50; }
        if (tt > LEMB[1] - 0.25) P.rect(0, 0, W, H, [255, 255, 255], 0.9 * (tt - (LEMB[1] - 0.25)) / 0.25);
    }
    else if (tt < 47) { arc(59, 'Idle', 0, Math.floor(tt * 2), 300, FEET, VET); ball.x = 340; }
    else if (tt < APITO) { // a última partida em câmera lenta: dribla Geodude e Machop
        const u = (tt - 47) / (APITO - 47), x = 120 + 360 * ((u * 2.6) % 1) * (Math.floor(u * 2.6) % 2 ? -1 : 1) + (Math.floor(u * 2.6) % 2 ? 480 : 0);
        const dirv = Math.floor(u * 2.6) % 2 ? 6 : 2;
        arc(59, 'Walk', dirv, Math.floor(tt * 7), x, FEET, VET); ball.x = x + (dirv === 2 ? 34 : -34); ball.y = FEET - 8 - Math.abs(Math.sin(tt * 9)) * 6; ball.rot = tt * 8;
        arc(74, 'Hop', 0, Math.floor(tt * 3), 330, FEET - 6, { sc: 2.2, dim: 0.8 }); arc(66, 'Idle', 0, Math.floor(tt * 3), 520, FEET - 10, { sc: 2.2, dim: 0.8 });
        if (u > 0.93) { arc(59, 'Shoot', 2, Math.floor((u - 0.93) * 120), 380, FEET, VET); acts.shift(); }
    }
    else if (tt < HOME) { const a = tt - APITO; arc(59, 'Hurt', 2, 0, 380, FEET, VET); ball.x = 380 + 30 + Math.min(1, a * 0.3) * 100; ball.y = FEET - 8 - Math.max(0, Math.sin(Math.min(1, a / 1.5) * Math.PI)) * 30; ball.rot = a * 4;
        for (const [t0, g] of [[0, 0.3], [0.5, 0.3], [1.0, 1.1]]) apito(P, 330, 40, a - t0, [255, 255, 255]), void g;
        if (a < 0.2) P.rect(0, 0, W, H, [255, 255, 255], 0.6 * (1 - a / 0.2)); }
    else if (tt < FINAL) { const u = (tt - HOME) / 7; arc(59, u < 1 ? 'Walk' : 'Idle', u < 1 ? 2 : 0, Math.floor(tt * 3), lerp(380, 320, ease(u)), FEET, VET); ball.x = 360; }
    else if (tt < SAIDA) { arc(59, 'Idle', 0, Math.floor(tt * 3), 320, FEET, { ...VET, sc: 2.6 }); [[25, 220], [7, 150], [4, 420], [66, 490]].forEach(([id, x], i) => { const e = clamp((tt - FINAL - i * 0.8) / 3); arc(id, e < 1 ? 'Walk' : 'Idle', e < 1 ? (x < 320 ? 2 : 6) : 0, Math.floor(tt * 5), x < 320 ? lerp(-60, x, ease(e)) : lerp(700, x, ease(e)), FEET, { sc: 2.3 }); }); ball.x = 360;
        const r = rnd(5); for (let i = 0; i < 50; i++) P.rect(r() * W, (r() * H + (tt - FINAL) * 38 * (0.5 + r())) % H, 2, 2, [Y, WARM, [255, 255, 255]][i % 3], 0.8); }
    else if (tt < CODA) { const e = clamp((tt - SAIDA) / 9); arc(59, 'Walk', 6, Math.floor(tt * 4), lerp(320, -70, ease(e)), FEET - ease(e) * 18, { ...VET, sc: 2.4 * (1 - ease(e) * 0.35) }); ball.x = 360; [[25, 220], [7, 150], [4, 420], [66, 490]].forEach(([id, x]) => arc(id, 'Hop', 0, Math.floor((beatN % 1) * 10), x, FEET - Math.abs(Math.sin(beatN * Math.PI)) * 8, { sc: 2.3, dim: 1 - 0.4 * ease((tt - SAIDA) / 12) })); }
    else if (tt < 124) { const a = tt - 118; ball.x = 320; ball.y = a < 0 ? -40 : FEET - 8 - Math.abs(Math.sin((a * 3.2) ** 1)) * Math.max(0, 150 * Math.exp(-a * 1.3)); if (a < 0) ball.y = -40; ball.rot = a * 3; }
    else if (tt < 143) { const a = tt - 124, e = clamp(a / 5);
        const g = a < 5 ? lerp(700, 380, ease(e)) : 380 + Math.sin(a * 1.2) * 50; arc(58, a < 5 ? 'Walk' : (a > 9 && a < 13 ? 'Idle' : 'Walk'), a < 5 ? 6 : Math.cos(a * 1.2) > 0 ? 2 : 6, Math.floor(tt * 8), g, FEET, { sc: 2.2 });
        ball.x = a < 5 ? g - 30 : g + 30 * Math.sign(Math.cos(a * 1.2)); ball.y = FEET - 8 - Math.abs(Math.sin(tt * 7)) * 6; ball.rot = tt * 6;
        if (a > 9 && a < 13) { arc(58, 'Idle', 6, Math.floor(tt * 3), 380, FEET, { sc: 2.2 }); acts.shift(); ball.x = 350; ball.y = FEET - 8; }
        apito(P, 380, FEET - 90, (a - 9.5) % 4 < 1.2 && a > 9.5 && a < 11 ? (a - 9.5) % 4 : -1);
        apito(P, 40, 150, a > 11.5 && a < 13 ? a - 11.5 : -1, [255, 244, 200]);
        if (a > 13 && a < 19) { arc(58, 'Hop', 6, Math.floor(((a - 13) * 5) % 10), 380, FEET - Math.abs(Math.sin((a - 13) * 5)) * 6, { sc: 2.2 }); acts.shift(); ball.x = 350; ball.y = FEET - 8; } }
    else { arc(58, 'Idle', 6, Math.floor(tt * 3), 380, FEET, { sc: 2.2, dim: Math.max(0.3, c.dur - tt > 4 ? 1 : (c.dur - tt) / 4) }); ball.x = 350; ball.y = FEET - 8; }
    if (!(tt >= 43.5 && tt < 47)) bola(P, ball.x + ox(1), ball.y, 7, ball.rot);
    for (const a of acts) { P.rect(a.x + ox(1) - 16, FEET + 2, 32, 3, [0, 0, 0], 0.35); pmd(P, a.id, a.anim, a.dir, a.n, a.x + ox(1), a.y, { ...a.o, dim: (a.o.dim ?? 1) * (0.55 + 0.6 * Math.min(1, L + 0.3)) }); }
    // refletor dourado na homenagem e no veterano
    if (tt >= HOME && tt < SAIDA) { const cn = cone(P, 320, 0, 0, 330, 30, 160, WARM, 0.14 + 0.1 * (tt > FINAL ? 1 : 0)); poeira(P, cn, tt, 40, [255, 240, 210], 14); }
    void q; void beatN;
}

export function ultima5(P, c) {
    const { tt, q } = c;
    let cam = 0, k = { z: 1 };
    if (tt < 6) { const u = tt / 6; k = { z: lerp(1.8, 1.1, ease(u)), cx: lerp(80, 320, ease(u)), cy: 270, rot: 0 }; }
    else if (tt < LEMB[0]) { const u = (tt - 6) / 20.7; cam = lerp(-60, 30, u); k = { z: 1.15 + 0.1 * Math.sin(u * 3), cx: lerp(200, 320, u), cy: 255, rot: 0.01 }; }
    else if (tt < LEMB[1]) { const s = Math.floor((tt - LEMB[0]) / 1.2), u = ((tt - LEMB[0]) % 1.2) / 1.2; k = { z: 1.3 + 0.1 * (s % 3), cx: 200 + 120 * ((s * 0.37) % 1) + u * 40, cy: 260, rot: ((s % 2) ? 0.02 : -0.02) }; }
    else if (tt < 47) { k = { z: 1.5, cx: 300, cy: 250, rot: 0 }; }
    else if (tt < APITO) { cam = 20 * Math.sin(tt * 0.4); k = { z: 1.2, cx: 320 + 60 * Math.sin(tt * 0.5), cy: 255, rot: 0.015 * Math.sin(tt * 0.3) }; }
    else if (tt < HOME) { const a = tt - APITO; k = { z: lerp(1.4, 2.2, ease(a / 2)), cx: 380, cy: 250, rot: 0.04 * Math.sin(a * 12) * Math.exp(-a) }; }
    else if (tt < FINAL) { const u = (tt - HOME) / 7; k = { z: lerp(1.3, 1.9, ease(u)), cx: 320, cy: 250, rot: 0 }; }
    else if (tt < SAIDA) { const u = (tt - FINAL) / 19; k = { z: lerp(1.9, 1.05, ease(u)), cx: 320, cy: lerp(250, 190, ease(u)), rot: lerp(-0.02, 0.02, u) }; }
    else if (tt < CODA) { const u = (tt - SAIDA) / 12; cam = lerp(0, -50, u); k = { z: lerp(1.1, 1.4, u), cx: lerp(320, 220, u), cy: 220, rot: 0 }; }
    else if (tt < 124) { k = { z: 1.5, cx: 320, cy: 230, rot: 0 }; }
    else if (tt < 143) { const u = (tt - 124) / 19; k = { z: lerp(1.2, 1.7, ease(u)), cx: lerp(380, 360, u), cy: 250, rot: 0.01 * Math.sin(tt) }; }
    else { const u = ease((tt - 143) / 9); k = { z: lerp(1.7, 2.3, u), cx: 370, cy: 260, rot: 0 }; }
    mundo(P, { ...c, cam });
    camera(P, { ...k, dx: 0, dy: 0 });
    if (tt >= LEMB[0] && tt < LEMB[1]) { const r = rnd(Math.floor(tt * 24)); for (let i = 0; i < 140; i++) P.px(r() * W, r() * H, [255, 240, 200], 0.14); }
    for (const ct of [6, 26.7, 47, 75, 82, 101, 113, 124]) { const d = Math.abs(tt - ct); if (d < 0.3) { const p = 1 - d / 0.3; if (ct === 75 || ct === 101) esmear(P, Math.round(p * 20)); else bloco(P, p * 0.9, ct); } }
    bloom(P, 205, 0.7); acabamento(P, tt >= LEMB[0] && tt < LEMB[1] ? 0.85 : 0.6);
    if (tt > c.dur - 1.2) bloco(P, clamp((tt - (c.dur - 1.2)) / 1.1), 9);
    void q; void cone;
}
