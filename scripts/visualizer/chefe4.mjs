// "Sala do chefe" v4 (estilo C caprichado + Pokémon do jogo): corredor, porta com luz, sala com parallax, refletores,
// claps no piso, a cadeira gira e revela o Persian. 640x360. Tempos em segundos da faixa (96 BPM; final em 120-135,8).
import { CAD } from './cenas.mjs';
import { acabamento, banda, bloco, bloom, camera, cone, esmear, poeira, reflexo } from './fx.mjs';
import { clamp, ease, hex, mix, rnd } from './pix.mjs';
import { pmd, quadro } from './pmd.mjs';
import { tracos } from './plano4.mjs';

export const RES = [640, 360];
const W = 640, H = 360, HZ = 270;
const Y = hex('#ffcb05'), RED = hex('#e8423f'), WARM = hex('#ffe38a'), COLD = hex('#8aa0e0');
const alt = (() => { const r = rnd(7); return Array.from({ length: 80 }, () => 30 + Math.floor(r() * 90)); })();
const lerp = (a, b, t) => a + (b - a) * t;
const nivel = (l) => (l > 0.85 ? RED : l > 0.55 ? Y : WARM);

function elipse(P, cx, cy, rx, ry, col, a) { const n = Math.ceil(rx * 5); for (let i = 0; i < n; i++) { const t = (i / n) * 6.2832; P.px(cx + rx * Math.cos(t), cy + ry * Math.sin(t), col, a); } }

function corredor(P, c) {
    const { tt, beatN } = c, op = Math.min(0.95, ((Math.floor(beatN) + ease((beatN % 1) * 3)) / 8) * 0.95), cx = 320, cy = 168;
    const D = 15 - tt * 1.6, ph = tt * 1.1, fr = ph - Math.floor(ph), id0 = Math.floor(ph);
    const hw = (d) => 6 + 300 / (0.25 + d * 0.3);
    P.fill(hex('#04060e'));
    for (let i = 0; i < 40; i++) {
        const d = i + (1 - fr); if (d >= D) break;
        const w = hw(d), h = w * 0.78, id = id0 - i, lv = Math.pow(banda(c.bandas, ((id * 3) % 36 + 36) % 36, ((id * 3) % 36 + 36) % 36 + 3), 2.2), sh = clamp(d / 26);
        P.rect(cx - w, cy - h, w * 2, h * 2, mix(id % 2 ? hex('#1e2760') : hex('#121a46'), hex('#02030a'), sh * 0.85));
        const t = Math.max(2, Math.round(w * 0.04)), col = lv > 0.2 ? nivel(lv) : mix(hex('#4b5a9a'), hex('#02030a'), sh);
        P.rect(cx - w, cy - h, t, h * 2, col, 0.9); P.rect(cx + w - t, cy - h, t, h * 2, col, 0.9); P.rect(cx - w, cy - h, w * 2, t, col, 0.9);
        P.rect(cx - w, cy + h * 0.5, w * 2, h * 0.5, mix(hex('#0c1030'), hex('#02030a'), sh), 0.9);
    }
    // porta ao fundo: vão iluminado + folha abrindo em degraus (range na batida)
    const w = hw(D), h = w * 0.78, dw = w * 0.5, dh = h * 0.8, jit = (beatN % 1) < 0.18 ? Math.round(Math.sin(c.q * 9) * 1.5) : 0;
    P.rect(cx - dw, cy - dh + 6, dw * 2, dh * 1.7, mix(hex('#120c22'), hex('#4a5a9a'), op * 0.5));
    P.rect(cx - dw, cy - dh + 6, dw * 2, dh * 0.8, hex('#2a3a7a'), op * 0.7);
    const wl = dw * 2 * Math.cos(op * 1.3), f = 1 - 0.2 * Math.sin(op * 1.3);
    P.poly([[cx - dw + jit, cy - dh], [cx - dw + wl + jit, cy - dh * f + 6], [cx - dw + wl + jit, cy + dh * 0.9 * f], [cx - dw + jit, cy + dh * 0.9]], hex('#3a2418'));
    P.poly([[cx - dw + wl * 0.15 + jit, cy - dh * 0.7], [cx - dw + wl * 0.85 + jit, cy - dh * 0.6 * f], [cx - dw + wl * 0.85 + jit, cy + dh * 0.5 * f], [cx - dw + wl * 0.15 + jit, cy + dh * 0.6]], hex('#2a1810'));
    // luz da porta: raios, cone pro chão, reflexo no piso molhado e poeira no feixe
    for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.4; P.poly([[cx, cy + 20], [cx + Math.sin(a - 0.07) * 700, cy + 20 + Math.cos(a - 0.07) * 700], [cx + Math.sin(a + 0.07) * 700, cy + 20 + Math.cos(a + 0.07) * 700]], WARM, 0.05 * op * (0.6 + 0.4 * Math.sin(tt * 2 + k)) ); }
    const cn = cone(P, cx, cy + dh * 0.7, 0, 200, dw * 1.6 * op, dw * 6 * op + 20, WARM, 0.22 * op);
    P.poly([[cx - dw * 1.4 * op, cy + dh * 0.9], [cx + dw * 1.4 * op, cy + dh * 0.9], [cx + dw * 4 * op + 30, H], [cx - dw * 4 * op - 30, H]], WARM, 0.2 * op);
    poeira(P, cn, tt, 60, [255, 235, 190], 4);
    P.circle(cx + dw - 6, cy + 6, 3, Y);
    if (tt > 1.3 && tt < 2.4) { const u = (tt - 1.3) / 1.1, tx = cx - dw * 0.9 + u * dw * 1.8; P.poly([[tx - 3, cy + dh * 0.6], [tx + 6, cy + dh * 0.6], [tx + 22, cy - dh * 0.1 + Math.sin(u * 6) * 8], [tx + 16, cy - dh * 0.3 + Math.sin(u * 6) * 8], [tx + 2, cy + dh * 0.2]], [0, 0, 0], 0.95); }
    reflexo(P, Math.round(cy + h * 0.5), 150, 0.3);
}

function sombraCadeira(P, x, y, sc, ox, oy, esc, a, wv = 1, orelhas = false) { // silhueta da cadeira projetada na parede
    P.poly([[x + ox - 28 * sc * esc * wv, y + oy - 105 * sc * esc], [x + ox + 28 * sc * esc * wv, y + oy - 105 * sc * esc], [x + ox + 30 * sc * esc * wv, y + oy + 20 * sc * esc], [x + ox - 30 * sc * esc * wv, y + oy + 20 * sc * esc]], [0, 0, 0], a);
    P.circle(Math.round(x + ox), Math.round(y + oy - 105 * sc * esc), Math.round(22 * sc * esc * Math.max(0.3, wv)), [0, 0, 0], a);
    if (orelhas) for (const d of [-1, 1]) P.poly([[x + ox + d * 6 * sc * esc, y + oy - 118 * sc * esc], [x + ox + d * 20 * sc * esc, y + oy - 118 * sc * esc], [x + ox + d * 15 * sc * esc, y + oy - 150 * sc * esc]], [0, 0, 0], a);
}

function sala(P, c, o) {
    const { tt, beatN, q } = c, cam = o.cam, ox = (d) => -cam * d;
    const gv = banda(c.bandas, 0, 6), mt = banda(c.bandas, 10, 24), ag = banda(c.bandas, 28, 40), clap = c.clapPulse;
    P.grad(0, HZ, hex('#0e1334'), hex('#080b1e'));
    for (let x = -200; x < W + 200; x += 24) P.rect(x + ox(0.5), 0, 2, HZ, hex('#0b0f2a'));
    // janela (parallax .35): céu, estrelas, lua, skyline em duas camadas com janelinhas = espectro
    const wx = 190 + ox(0.35), wy = 36, ww = 260, wb = 214;
    P.gradR(Math.round(wx), ww, wy, wb, hex('#050a22'), hex('#3a4a8a'));
    const rs = rnd(21); for (let i = 0; i < 40; i++) { const sx = wx + rs() * ww, sy = wy + rs() * 100, tw = Math.sin(tt * 2 + i) * 0.5 + 0.5; P.px(sx, sy, [255, 255, 255], 0.25 + 0.6 * tw * (0.4 + ag)); }
    P.circle(Math.round(wx + 215), 70, 9, hex('#e8e4c8')); P.circle(Math.round(wx + 218), 68, 8, hex('#0c1030'), 0.0);
    for (let k = 0; k < 40; k++) { const bw = 7, bx = Math.round(wx + k * (ww / 40) + ox(0.1)), bh = 30 + alt[k + 40] * 0.5; if (bx > wx - 8 && bx < wx + ww) P.rect(bx, wb - bh, bw, bh, hex('#101a44')); }
    for (let k = 0; k < 52; k++) {
        const bw = 5, bx = Math.round(wx + k * (ww / 52)), bh = 36 + alt[k] * 0.9, lvl = c.bandas[Math.floor(k * 40 / 52)] ?? 0;
        if (bx < wx || bx + bw > wx + ww) continue;
        P.rect(bx, wb - bh, bw, bh, hex(k % 3 ? '#0a1030' : '#0e1638'));
        const rows = Math.floor(bh / 5);
        for (let r = 0; r < rows - 1; r++) { const f = r / rows; if (f < lvl * 1.05 + 0.05) { const col = f > 0.7 ? RED : f > 0.4 ? Y : WARM; P.rect(bx + 1, wb - 6 - r * 5, 2, 2, col); P.rect(bx + 3, wb - 6 - r * 5 + (r & 1), 1, 2, col, 0.8); } }
    }
    if (tt > 70 && tt < 84) { const pr = clamp((tt - 70) / 9) * (tt < 80 ? 1 : 1 - (tt - 80) / 4), n = Math.floor(pr * tracos.length * 1); const mx = (x) => wx + 10 + (x / 350) * 240, my = (y) => 60 + ((y - 55) / 75) * 100; tracos.forEach((t, i) => { if (i < n) P.line(mx(t[0]), my(t[1]), mx(t[2]), my(t[3]), [230, 244, 255], 2, 0.85 * (0.6 + 0.4 * Math.sin(tt * 4))); }); }
    if (Math.floor(beatN) % 2 === 0 && beatN % 1 < 0.35) P.circle(Math.round(wx + 6 * (ww / 52) * 10), wb - 36 - alt[10] * 0.9, 1, RED);
    for (const [x, y, w, h] of [[wx - 5, wy - 6, ww + 10, 7], [wx - 5, wb, ww + 10, 7], [wx - 5, wy - 6, 6, wb - wy + 13], [wx + ww - 1, wy - 6, 6, wb - wy + 13], [wx + ww / 2 - 2, wy, 4, wb - wy], [wx, 125, ww, 4]]) P.rect(Math.round(x), y, Math.round(w), h, hex('#151b3c'));
    // estantes (parallax .6) com troféus: o naipe de metais acende o dourado
    for (const sx of [14, 508]) {
        const x0 = sx + ox(0.6);
        P.rect(x0, 70, 116, 200, hex('#090c1c')); for (const sy of [118, 168, 218, 268]) P.rect(x0, sy, 116, 4, hex('#1c2447'));
        for (const sy of [118, 168, 218]) for (let i = 0; i < 3; i++) {
            const tx = x0 + 10 + i * 36, ty = sy - 24, col = mix(hex('#3a2c08'), Y, clamp(0.25 + mt * 1.1 + c.kickPulse * 0.2));
            P.rect(tx, ty, 18, 10, col); P.rect(tx + 5, ty + 10, 8, 7, col); P.rect(tx + 1, ty + 17, 16, 5, col); P.rect(tx - 3, ty + 2, 3, 5, col); P.rect(tx + 18, ty + 2, 3, 5, col);
            if (Math.sin(tt * 4 + i * 2 + sy + sx) > 0.93 - mt * 0.25) { P.rect(tx + 3, ty - 1, 8, 1, [255, 255, 255]); P.rect(tx + 6, ty - 4, 1, 8, [255, 255, 255]); }
        }
    }
    // piso brilhante: reflete a parede; manchas de luz da janela (cruz) pulsam nos graves
    P.grad(HZ, H, hex('#0b0e22'), hex('#04050c'));
    for (let i = -8; i <= 8; i++) P.line(320 + i * 20, HZ, 320 + i * 120, H, hex('#10163a'), 1, 0.7);
    for (let i = 0; i < 6; i++) P.rect(0, Math.round(HZ + Math.pow(i / 6, 1.7) * 90), W, 1, hex('#10163a'), 0.7);
    reflexo(P, HZ, 90, 0.28 + gv * 0.15);
    for (const [xa, xb] of [[190, 318], [322, 450]]) { const sk = (u) => 320 + (u - 320) * 1.0; P.poly([[sk(xa) + ox(0.8), HZ], [sk(xb) + ox(0.8), HZ], [xb + (xb - 320) * 0.95 + ox(0.8), 316], [xa + (xa - 320) * 0.95 + ox(0.8), 316]], COLD, 0.05 + 0.1 * gv); P.poly([[xa + (xa - 320) * 1.05 + ox(0.8), 322], [xb + (xb - 320) * 1.05 + ox(0.8), 322], [xb + (xb - 320) * 1.5 + ox(0.8), H], [xa + (xa - 320) * 1.5 + ox(0.8), H]], COLD, 0.04 + 0.08 * gv); }
    // mesa e luminária (acende na proposta)
    const dx = 120 + ox(0.9);
    P.rect(dx, 246, 400, 8, hex('#2a1f38')); P.rect(dx, 254, 400, 40, hex('#140e1e')); P.rect(dx, 246, 400, 1, hex('#4a3a6a')); P.rect(dx + 40, 254, 6, 40, hex('#0a0a14'));
    P.rect(dx + 346, 222, 4, 24, hex('#0a0a14')); P.poly([[dx + 336, 222], [dx + 360, 222], [dx + 354, 210], [dx + 342, 210]], hex('#1c2447'));
    if (o.lamp > 0) { cone(P, dx + 348, 214, 0.5, 90, 14, 120, WARM, 0.14 * o.lamp); P.rect(dx + 336, 220, 24, 2, WARM, o.lamp); }
    // luz da porta (S2): cunha pelo chão e sombra da cadeira crescendo na parede
    if (o.porta > 0) {
        const th = o.porta;
        P.poly([[0, 70], [40 + 60 * th, 120], [W * 0.75 * th + 120, 360], [0, 360]], WARM, 0.10 + 0.14 * th);
        P.poly([[0, 90], [30, 130], [W * 0.55 * th + 80, 300], [0, 320]], WARM, 0.07);
        sombraCadeira(P, 320, 200, 1.5, 70 + 220 * th, 30 - 40 * th, 0.9 + 1.0 * th, 0.42);
        const cn = { x0: 0, y0: 90, dx: 0.85, dy: 0.5, nx: -0.5, ny: 0.85, len: 330 + 200 * th, w0: 60, w1: 160 * th + 60 };
        poeira(P, cn, tt, 70, [255, 235, 190], 9);
        const lw = 70 * Math.cos(th * 1.2);
        P.poly([[0, 20], [lw, 54 + th * 18], [lw, 330 - th * 14], [0, 350]], hex('#2a1810')); P.poly([[0, 20], [lw * 0.12, 24], [lw * 0.12, 346], [0, 350]], hex('#4a3020'));
    }
    // cadeira: sombra no piso (luz da janela atrás), corpo (gira) e Persian
    const TL = c.dur - 4.5, antic = clamp((tt - TL) / 0.7), gira = clamp((tt - (TL + 0.7)) / 2.7);
    const c1 = 1.70158, c2 = c1 * 1.525, eio = gira < 0.5 ? (Math.pow(2 * gira, 2) * ((c2 + 1) * 2 * gira - c2)) / 2 : (Math.pow(2 * gira - 2, 2) * ((c2 + 1) * (2 * gira - 2) + c2) + 2) / 2;
    const phi = Math.PI * eio, wv = Math.max(0.07, Math.abs(Math.cos(phi))), front = phi > Math.PI / 2;
    const balanco = tt > TL && gira <= 0 ? Math.sin(antic * Math.PI * 3) * 0.035 * (1 - antic * 0.3) : 0;
    const cxx = 320 + ox(1.0) + (clap > 0.05 ? Math.round(Math.sin(q * 5) * clap * 1.5) : 0);
    // sombra da cadeira na parede (a luz entra pela esquerda) e no piso (janela atrás): gira junto, com as orelhas quando vira
    if (tt > TL - 0.3 || false) sombraCadeira(P, 320, 205, 1.5, 150 + ox(0.9), 8, 1.1, 0.38, wv, front);
    P.poly([[cxx - 42 * wv - 4, 322], [cxx + 42 * wv + 4, 322], [cxx + 140 * wv + 30, H], [cxx - 140 * wv - 30, H]], [0, 0, 0], 0.5);
    P.blit(CAD[front ? 2 : 0], cxx, 215, { sx: 1.5 * wv, sy: 1.5, rot: balanco });
    if (front) {
        const r0 = clamp((tt - (TL + 3.0)) / 1.0), hop = tt > TL + 3.7 && tt < TL + 4.1 ? Math.sin(((tt - TL - 3.7) / 0.4) * Math.PI) * 10 : 0;
        pmd(P, 53, 'Idle', 0, Math.floor(tt * 3), cxx, 281 - hop, { sc: 3.0, sx: wv, dim: 0.74 });
        const cn = cone(P, cxx, 0, 0, 300, 50, 230, WARM, 0.1 * r0); poeira(P, cn, tt, 60, [255, 240, 200], 13);
        const g = clamp((tt - (TL + 3.4)) / 0.1) * clamp(1 - (tt - (TL + 3.5)) / 0.35);
        if (g > 0) for (const dx of [-10, 10]) { P.rect(cxx + dx - 7, 192, 15, 2, [255, 255, 255], g); P.rect(cxx + dx - 1, 186, 3, 14, [255, 255, 255], g); }
        for (let k = 0; k < 10; k++) { const a2 = k * 1.3 + tt * 0.7, d = 60 + 60 * r0 * (0.5 + 0.5 * Math.sin(k)), x = cxx + Math.cos(a2) * d, y = 210 + Math.sin(a2) * d * 0.6; if (Math.sin(tt * 6 + k * 2) > 0.3) { P.rect(x - 2, y, 5, 1, WARM); P.rect(x, y - 2, 1, 5, WARM); } }
    }
    // o trio (Meowth, Ekans, Koffing) entra e grita o SOC-CER-MON em pulinhos; reage quando a cadeira vira
    if (tt > 119.6) {
        const reac = clamp((tt - (TL + 3.4)) / 0.4);
        [52, 23, 109].forEach((id, i) => {
            const alvo = 150 + i * 62, ent = clamp((tt - 120 - i * 0.9) / 3.2), parado = tt > 130.4, andando = ent < 1;
            let x = lerp(-80, alvo, ease(ent)) - 26 * ease(reac), y = 338 - (id === 109 ? 16 : 0), anim = 'Walk', n = Math.floor(tt * 8), dir = 2;
            if (!andando && !parado) { const u = beatN % 1; anim = 'Hop'; n = Math.floor(u * 10); y -= Math.sin(u * Math.PI) * 12; }
            else if (parado && reac <= 0) { anim = 'Idle'; n = Math.floor(tt * 2); }
            if (reac > 0) { anim = 'Hurt'; n = Math.floor(tt * 3); }
            pmd(P, id, anim, dir, n, x + ox(1.4), y, { sc: 2.4, dim: 0.85 });
            if (reac > 0.3 && tt < TL + 5.2) { P.rect(x + ox(1.4) + 20, y - 96, 4, 14, RED); P.rect(x + ox(1.4) + 20, y - 78, 4, 4, RED); }
        });
    }
    // pilar em primeiro plano (parallax 1.8), em silhueta
    P.rect(-30 + ox(1.8), 0, 56, H, hex('#05060f')); P.rect(26 + ox(1.8), 0, 2, H, hex('#1c2447'));
    P.rect(W - 26 + ox(2.1), 0, 70, H, hex('#05060f')); P.rect(W - 28 + ox(2.1), 0, 2, H, hex('#1c2447'));
    // refletores que varrem (naipe de metais: a luz cresce com eles)
    for (const [bx, d] of o.feixes ?? []) { const ang = d * (0.35 + 0.25 * Math.sin(beatN * Math.PI * 0.25 + d)), cn = cone(P, bx + ox(0.9), 0, ang, 420, 14, 120 + 90 * mt, WARM, 0.12 + 0.22 * mt + 0.1 * c.kickPulse); poeira(P, cn, tt, 40, [255, 240, 210], 17 + bx); }
    // clap lento: anéis no piso, clarão e poeira subindo
    if (c.clapAge >= 0 && c.clapAge < 1.4) { const k = c.clapAge, a = 0.7 * (1 - k / 1.4); for (let j = 0; j < 3; j++) elipse(P, cxx, 322, 20 + k * 260 + j * 5, 5 + k * 62 + j, RED, a); const rr = rnd(77); for (let i = 0; i < 24; i++) P.px(cxx + (rr() - 0.5) * 220 * (0.3 + k), 318 - k * 90 * (0.4 + rr()), WARM, a * 0.9); }
    if (clap > 0.02) P.rect(0, 0, W, H, RED, 0.18 * clap);
    if (o.tinta) P.rect(0, 0, W, H, o.tinta[0], o.tinta[1]);
}

export function chefe4(P, c) {
    const { tt, q } = c, TL = c.dur - 4.5;
    const S = tt < 5 ? 1 : tt < 10 ? 2 : tt < 118 ? 3 : tt < TL - 0.9 ? 4 : 5;
    const clap = c.clapPulse, sh = Math.round(Math.sin(q * 5) * clap * 2);
    let cam = {}, o = { cam: 0, lamp: 0, porta: 0, feixes: [] };
    const cortes = [[5, 'whip'], [10, 'bloco'], [118.2, 'bloco']];
    for (let t = 20; t < 118; t += 10) cortes.push([t, (t / 10) % 2 ? 'whip' : 'bloco']);
    if (S === 1) { corredor(P, c); camera(P, { z: 1 + 0.05 * (tt / 5), cy: 170 - tt, dx: sh, rot: 0.01 * Math.sin(tt * 0.9) }); }
    else {
        if (S === 2) { const u = (tt - 5) / 5; o = { cam: -50 + 70 * u, lamp: 0, porta: ease(u), feixes: [] }; cam = { z: 1.05 + 0.1 * u, cx: 330, cy: 190, rot: 0.02 - 0.03 * u }; }
        else if (S === 3) {
            const k = Math.floor((tt - 10) / 10), u = ((tt - 10) % 10) / 10;
            const pre = [() => ({ cam: lerp(-70, 70, u), z: 1.1, cx: 320, cy: 190, rot: 0 }), () => ({ cam: 0, z: lerp(1.1, 1.6, ease(u)), cx: 320, cy: lerp(190, 235, u), rot: lerp(0, -0.03, u) }), () => ({ cam: lerp(60, -60, u), z: 1.25, cx: lerp(250, 200, u), cy: 120, rot: 0.03 }), () => ({ cam: lerp(-40, 40, u), z: 1.7, cx: lerp(100, 150, u), cy: 150, rot: 0 }), () => ({ cam: 0, z: lerp(1.5, 1.1, ease(u)), cx: 320, cy: lerp(120, 190, u), rot: lerp(0.05, 0, u) }), () => ({ cam: lerp(80, -80, u), z: 1.15, cx: 320, cy: 200, rot: lerp(-0.02, 0.02, u) })][((k % 6) + 6) % 6]();
            o = { cam: pre.cam, lamp: tt > 50 && tt < 82 ? 1 : 0, porta: 0, feixes: tt > 100 ? [[130, 1], [510, -1]] : [], tinta: tt > 100 ? [RED, 0.05] : tt > 50 && tt < 70 ? [hex('#c8761a'), 0.07] : null };
            cam = { z: pre.z, cx: pre.cx, cy: pre.cy, rot: pre.rot };
        }
        else if (S === 4) { const u = clamp((tt - 118.1) / 12.3); o = { cam: lerp(-90, 90, u), lamp: 0, porta: 0, feixes: [[130, 1], [510, -1]], tinta: [RED, 0.05] }; cam = { z: 1.16, cx: 320 + lerp(-20, 20, u), cy: 195, rot: lerp(-0.02, 0.02, u) }; }
        else { // final: a banda corta, empurra a câmera, balanço, giro com peso, segura no Persian
            const u = ease(clamp((tt - (TL - 0.9)) / 3.4)), v = ease(clamp((tt - (TL + 3.0)) / 1.6));
            o = { cam: lerp(90, 0, u), lamp: 0, porta: 0, feixes: [] };
            cam = { z: 1.1 + 0.5 * u + 0.25 * v, cx: lerp(320, 300, u), cy: lerp(195, 205, u) + 12 * v, rot: 0.05 * Math.sin(u * 3.14) - 0.02 * v };
        }
        sala(P, c, o);
        const tremor = tt > TL + 3.4 && tt < TL + 3.9 ? Math.round(Math.sin(q * 9) * 3) : 0;
        camera(P, { ...cam, dx: sh + tremor, dy: Math.round(banda(c.bandas, 0, 5) * 2) });
    }
    for (const [ct, tp] of cortes) { const d = Math.abs(tt - ct); if (d < 0.25) { const p = 1 - d / 0.25; if (tp === 'whip') esmear(P, Math.round(p * 28)); else bloco(P, p * 0.9, ct); if (tt >= ct - 0.04 && tt < ct + 0.1) P.rect(0, 0, W, H, [255, 255, 255], 0.25); } }
    bloom(P, 205, 0.6); acabamento(P, 0.6);
    if (tt > c.dur - 1.2) bloco(P, clamp((tt - (c.dur - 1.2)) / 1.1), 5);
}
