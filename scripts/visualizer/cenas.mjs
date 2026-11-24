// Cenas dos clipes (pixel 480x270). Cada cena: (P, c) => desenha um quadro. c = contexto de áudio/tempo (ver clipe.mjs).
// Humanos genéricos de futsal, bola, quadra, objetos. Sem nada de franquia.
import { Pix, clamp, ease, hex, humano, mix, rnd, sprite } from './pix.mjs';

const C = { ink: hex('#0e1430'), line: hex('#4b5a9a'), yellow: hex('#ffcb05'), red: hex('#e8423f'), blue: hex('#3a7bd5'), green: hex('#58c26b'), text: hex('#f4f1e6'), warm: hex('#ffe38a') };
/** Carta de costas (o verso do jogo: azul-noite, borda colorida, bola no meio) com perninhas e bracinhos; 32x56, pés em 16,55. */
export function carta(o = {}) {
    const S = sprite(32, 56), cx = 16, borda = o.borda ?? C.red, ink = C.ink, luva = hex('#dbe2f2');
    for (const d of [-1, 1]) { const off = Math.round(d * (o.legs ?? 0) * 2), t = o.toe ? 2 : 0; S.rect(cx + d * 4 - 1 + off, 45, 2, 7 - t, luva); S.rect(cx + d * 4 - 2 + off, 52 - t, 4, 3, ink); }
    const x = cx - 11, y = 12, w = 22, h = 33;
    S.rect(x - 1, y - 1, w + 2, h + 2, ink); S.rect(x, y, w, h, borda);
    if (o.front) {
        S.rect(x + 2, y + 2, w - 4, h - 4, hex('#bfe9ff'));
        for (let i = 0; i < 14; i++) S.line(x + 2, y + 2 + i * 3, x + w - 3, y - 3 + i * 3, hex(i % 2 ? '#ffd6f0' : '#d6ffd0'), 1, 0.7);
        const ex = o.look ?? 0;
        for (const dx of [-5, 3]) { S.rect(cx + dx, y + 9, 4, 6, [255, 255, 255]); S.rect(cx + dx + 1 + (ex > 0 ? 1 : 0) - (ex < 0 ? 1 : 0), y + 11, 2, 3, ink); }
        if (o.mouth) S.rect(cx - 2, y + 20, 4, 4, ink); else S.rect(cx - 2, y + 21, 5, 1, ink);
        S.rect(cx - 8, y + 17, 2, 2, hex('#ff9ab0')); S.rect(cx + 6, y + 17, 2, 2, hex('#ff9ab0'));
    } else {
        S.rect(x + 2, y + 2, w - 4, h - 4, hex('#0b0726'));
        S.rect(x + 2, y + 2, w - 4, 1, mix(borda, [0, 0, 0], 0.4)); S.circle(cx, y + 16, 6, hex('#dbe2f2')); S.circle(cx, y + 16, 5, [255, 255, 255]);
        S.circle(cx, y + 16, 2, ink); for (const [dx, dy] of [[0, -5], [5, -1], [3, 4], [-3, 4], [-5, -1]]) S.rect(cx + dx, y + 16 + dy, 1, 1, ink); S.px(cx, y + 16, C.yellow);
        S.rect(x + 3, y + 3, 2, 2, borda); S.rect(x + w - 5, y + h - 5, 2, 2, borda);
    }
    for (const d of [-1, 1]) {
        const ang = (d < 0 ? o.armL : o.armR) ?? 0.2, ax = cx + d * 11, ex2 = ax + d * Math.sin(ang) * 9, ey = 24 + Math.cos(ang) * 9;
        S.line(ax, 24, ex2, ey, ink, 3); S.line(ax, 24, ex2, ey, luva, 1); S.rect(Math.round(ex2) - 1, Math.round(ey) - 1, 3, 3, luva);
    }
    if (o.cap) { S.rect(x + 1, y - 4, w - 2, 5, o.cap); S.rect(x + w - 4, y - 1, 8, 2, o.cap); S.rect(x + 1, y - 4, w - 2, 1, [255, 255, 255]); }
    return S;
}
/** Bola de futsal com olhinhos (r em px). look: -1..1 pra onde olha; fecha: 0..1 (piscar). */
export function bolaOlhuda(P, x, y, r, { look = 0, fecha = 0, susto = 0, rot = 0 } = {}) {
    P.circle(x, y, r, hex('#dbe2f2')); P.circle(x - 1, y - 1, r - 1, [255, 255, 255]);
    for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2 + rot; P.circle(Math.round(x + Math.cos(t) * r * 0.78), Math.round(y + Math.sin(t) * r * 0.78), Math.max(1, Math.round(r * 0.22)), C.ink); }
    const ew = Math.max(3, Math.round(r * 0.5)), eh = Math.max(2, Math.round(r * (0.55 + susto * 0.25) * (1 - fecha)));
    for (const dx of [-0.38, 0.38]) { const ex = Math.round(x + dx * r * 1.1 - ew / 2); P.rect(ex, y - Math.round(r * 0.15), ew, eh, C.ink, 1); P.rect(ex + (look > 0 ? 1 : 0), y - Math.round(r * 0.15), Math.max(1, ew - 1), Math.max(1, eh - 1), [255, 255, 255]); if (eh > 2) P.rect(ex + 1 + Math.round(look), y - Math.round(r * 0.15) + 1, Math.max(1, ew - 2), Math.max(1, eh - 2), C.ink); }
    if (susto > 0.3) P.rect(x - 1, y + Math.round(r * 0.55), 3, 3, C.ink); else P.rect(x - 2, y + Math.round(r * 0.55), 5, 1, C.ink);
}
/** Câmera: reamostra o quadro com zoom z em torno de (cx, cy) (nearest, fica pixelado). */
export function camera(P, z, cx = 240, cy = 135) {
    if (z <= 1.001 && cx === 240 && cy === 135) return;
    const snap = Buffer.from(P.b), W = P.w, H = P.h;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const sx = Math.min(W - 1, Math.max(0, Math.floor(cx + (x - W / 2) / z))), sy = Math.min(H - 1, Math.max(0, Math.floor(cy + (y - H / 2) / z)));
        const i = (y * W + x) * 3, j = (sy * W + sx) * 3; P.b[i] = snap[j]; P.b[i + 1] = snap[j + 1]; P.b[i + 2] = snap[j + 2];
    }
}
const nivel = (l) => (l > 0.85 ? C.red : l > 0.55 ? C.yellow : l > 0.25 ? C.green : C.blue);

// ---------------------------------------------------------------- SALA DO CHEFE (96 BPM, Fá# menor, funk noir)
const alt = (() => { const r = rnd(7); return Array.from({ length: 40 }, () => 22 + Math.floor(r() * 50)); })();
function cadeira(frente, vazio) {
    const S = sprite(80, 150), cx = 40;
    const couro = hex('#1a1226'), borda = hex('#4a3a6a');
    S.rect(cx - 3, 128, 6, 14, hex('#0a0a14')); // pé
    for (const d of [-1, 1]) { S.line(cx, 142, cx + d * 22, 147, hex('#0a0a14'), 2); S.rect(cx + d * 22 - 2, 147, 4, 3, hex('#0a0a14')); }
    if (frente) { // o verso do jogo, preto com ouro, sentado na cadeira
        S.rect(cx - 28, 4, 56, 118, couro); S.rect(cx - 28, 4, 56, 2, borda);
        if (!vazio) {
        S.rect(cx - 17, 28, 34, 56, hex('#05030a'));
        S.rect(cx - 17, 28, 34, 2, C.yellow); S.rect(cx - 17, 82, 34, 2, C.yellow); S.rect(cx - 17, 28, 2, 56, C.yellow); S.rect(cx + 15, 28, 2, 56, C.yellow);
        S.circle(cx, 56, 11, C.yellow); S.circle(cx, 56, 9, hex('#05030a')); S.circle(cx, 56, 7, hex('#f4e08a'));
        S.circle(cx, 56, 3, hex('#05030a')); for (const [dx, dy] of [[0, -7], [7, -2], [4, 6], [-4, 6], [-7, -2]]) S.rect(cx + dx - 1, 56 + dy - 1, 2, 2, hex('#05030a'));
        S.rect(cx - 14, 31, 3, 3, C.yellow); S.rect(cx + 11, 77, 3, 3, C.yellow);
        } else S.rect(cx - 36, 118, 72, 12, hex('#120c1c'));
    } else {
        const corpo = [[cx - 18, 0], [cx + 18, 0], [cx + 24, 8], [cx + 28, 118], [cx - 28, 118], [cx - 24, 8]];
        S.poly(corpo, couro); S.line(cx - 18, 0, cx + 18, 0, borda, 1); S.line(cx - 24, 8, cx - 28, 118, borda, 1); S.line(cx - 15, 6, cx - 18, 112, hex('#2a1e3e'), 2);
        S.line(cx + 24, 8, cx + 28, 118, hex('#0c0814'), 2);
        for (const sy of [38, 76]) { S.line(cx - 26, sy, cx + 26, sy, hex('#0c0814'), 1); for (let k = -3; k <= 3; k++) S.px(cx + k * 8, sy + 18, hex('#2a1e3e')); }
        S.rect(cx - 36, 118, 72, 12, hex('#120c1c')); S.rect(cx - 36, 118, 72, 1, borda);
        for (const d of [-1, 1]) { S.rect(cx + d * 36 - 5, 96, 10, 5, hex('#120c1c')); S.rect(cx + d * 36 - 2, 100, 4, 18, hex('#0a0a14')); }
    }
    return S;
}
export const CAD = [cadeira(false), cadeira(true), cadeira(true, true)];

function janela(P, c, x0, x1, yb) {
    const h = yb - 24;
    P.grad(24, yb, hex('#0a1030'), hex('#3a4a8a'));
    P.circle(x1 - 24, 46, 6, hex('#e8e4c8')); P.circle(x1 - 21, 44, 5, hex('#9aa6d0'), 0.0);
    const w = (x1 - x0) / 40;
    for (let k = 0; k < 40; k++) {
        const bx = Math.round(x0 + k * w), bw = Math.ceil(w), bh = Math.min(h - 6, alt[k] * 1.5 + 24);
        P.rect(bx, yb - bh, bw, bh, hex(k % 3 ? '#0c1226' : '#101834'));
        const rows = Math.floor(bh / 4), lvl = c.bandas[k] ?? 0;
        for (let r = 0; r < rows - 1; r++) {
            const f = r / rows;
            if (f < lvl * 1.05 + 0.05) for (const wx of [1, bw - 3]) P.rect(bx + wx, yb - 5 - r * 4, 2, 2, f > 0.7 ? C.red : f > 0.4 ? C.yellow : C.warm);
        }
    }
}

export function salaDoChefe(P, c, modo = 'A') {
    const { tt, beatN, q } = c;
    const clap = c.clapPulse, shake = Math.round(clap * 1.2 * Math.sin(q * 5));
    P.fill(hex('#070a16'));
    if (tt < 10) { porta(P, c, modo); return; }
    // parede com painéis
    P.grad(0, 200, hex('#0b0f22'), hex('#080b19'));
    for (let x = 0; x < 480; x += 16) P.rect(x, 0, 1, 200, hex('#0e1430'));
    const x0 = 120, x1 = 360, yb = 150;
    janela(P, c, x0, x1, yb);
    P.rect(x0 - 4, 20, x1 - x0 + 8, 5, hex('#141a33')); P.rect(x0 - 4, yb, x1 - x0 + 8, 5, hex('#141a33')); P.rect(x0 - 4, 20, 4, yb - 15, hex('#141a33')); P.rect(x1, 20, 4, yb - 15, hex('#141a33'));
    P.rect(238, 24, 4, yb - 24, hex('#141a33')); P.rect(x0, 86, x1 - x0, 3, hex('#141a33'));
    // estantes de troféus
    const brilho = 0.35 + 0.5 * c.vol;
    for (const sx of [24, 396]) {
        P.rect(sx - 4, 58, 64, 116, hex('#0a0d1c')); for (const sy of [96, 134, 172]) P.rect(sx - 4, sy, 64, 3, hex('#1c2447'));
        for (const [sy, n] of [[96, 3], [134, 3], [172, 3]]) for (let i = 0; i < n; i++) {
            const tx = sx + 4 + i * 20, ty = sy - 14, col = mix(hex('#3a2c08'), C.yellow, brilho);
            P.rect(tx, ty, 10, 6, col); P.rect(tx + 3, ty + 6, 4, 4, col); P.rect(tx + 1, ty + 10, 8, 3, col); P.rect(tx - 2, ty + 1, 2, 3, col); P.rect(tx + 10, ty + 1, 2, 3, col);
            if ((Math.floor(beatN * 0.5) + i + sx) % 5 === 0) P.px(tx + 2, ty + 1, C.text);
        }
    }
    // chão e reflexo da janela
    P.grad(200, 270, hex('#0a0c1a'), hex('#05060d'));
    for (let i = -6; i <= 6; i++) P.line(240 + i * 12, 200, 240 + i * 70, 270, hex('#0e1430'));
    P.rect(150, 200, 180, 70, hex('#3a4a8a'), 0.05 + 0.12 * c.vol);
    // mesa
    P.rect(90, 172, 300, 6, hex('#2a1f38')); P.rect(90, 178, 300, 34, hex('#140e1e')); P.rect(90, 172, 300, 1, hex('#4a3a6a'));
    P.rect(330, 160, 4, 12, hex('#0a0a14')); P.poly([[322, 160], [342, 160], [336, 152], [328, 152]], hex('#1c2447'));
    const lamp = clamp((tt - 50) / 1.5) * (tt < 82 ? 1 : 0);
    if (lamp > 0) { P.poly([[324, 160], [340, 160], [366, 214], [298, 214]], C.warm, 0.12 * lamp); P.rect(322, 158, 20, 2, C.warm, lamp); }
    // cadeira (gira no fim)
    const T0 = c.dur - 4.5, phi = clamp((tt - T0) / 3.0) * Math.PI, wv = Math.max(0.07, Math.abs(Math.cos(phi)));
    const cj = shake;
    if (tt > c.dur - 6.5) {
        // o time entra no 3º trecho? não: aqui só a cadeira
    }
    P.blit(CAD[phi > Math.PI / 2 ? (modo === 'A' ? 1 : 2) : 0], 240 + cj, 188, { sx: 1.2 * wv, sy: 1.2 });
    // time responde (SOC-CER-MON): entra pela esquerda, braços pro alto na batida
    if (modo === 'A') {
        // bola com olhinhos na mesa, de olho na cadeira
        const ts = clamp((tt - T0) / 3.0), fecha = (Math.floor(beatN * 0.5) % 7 === 0 && (beatN * 0.5) % 1 < 0.15) ? 1 : 0;
        P.rect(112, 190, 18, 2, [0, 0, 0], 0.35); bolaOlhuda(P, 121, 166 + Math.round(Math.abs(Math.sin(beatN * Math.PI * 0.5)) * 1.5 * 0), 9, { look: 1, fecha, susto: ts > 0.1 ? 1 : 0, rot: tt * 0.1 });
    }
    if (tt > 119.5 && tt < 131) {
        if (modo === 'A') {
            const cores = [C.red, C.yellow, C.green];
            for (let i = 0; i < 3; i++) {
                const alvo = 70 + i * 44, ent = clamp((tt - 120 - i * 0.9) / 3.2), x = -30 + (alvo + 30) * ease(ent);
                const andando = ent < 1, pulo = andando ? Math.abs(Math.sin(beatN * Math.PI + i)) * 3 : Math.max(0, c.kickPulse) * 3;
                const up = !andando && c.kickPulse > 0.35 ? 2.7 : 0.4;
                P.blit(carta({ borda: cores[i], legs: andando ? Math.sin(beatN * Math.PI * 2 + i) : 0, armL: up, armR: up }), x, 262 - pulo, { px: 16, py: 55, sx: 1.7, sy: 1.7 });
            }
        } else { // C: só luz, dois feixes varrem a sala no ritmo e os troféus piscam no kick
            const sw = Math.sin(beatN * Math.PI * 0.25);
            for (const [bx, d] of [[60, 1], [420, -1]]) P.poly([[bx - 3, 0], [bx + 3, 0], [bx + d * (130 * sw + 90) + 50, 230], [bx + d * (130 * sw + 90) - 50, 230]], C.warm, 0.1 + 0.1 * c.kickPulse);
        }
        P.rect(0, 0, 480, 270, C.ink, 0.18);
    }
    // viradas de seção: tom
    if (tt > 50 && tt < 70) P.rect(0, 0, 480, 270, hex('#c8761a'), 0.07);
    if (tt > 100 && tt < 120) P.rect(0, 0, 480, 270, C.red, 0.06);
    // claps lentos: anel que cresce e clarão vermelho
    if (c.clapAge < 1.2) { const r = 6 + c.clapAge * 150, a = 0.7 * (1 - c.clapAge / 1.2); P.ring(240, 188, r, C.red, a); P.ring(240, 188, r + 2, C.red, a * 0.6); }
    if (clap > 0.02) P.rect(0, 0, 480, 270, C.red, 0.2 * clap);
    if (phi > Math.PI / 2) { // revelação: A = carta preta com halo dourado; C = cadeira vazia sob um refletor
        const r0 = clamp((tt - (T0 + 1.6)) / 1.4), pulso = 0.5 + 0.5 * Math.sin(tt * 5);
        if (modo === 'A') {
            for (let k = 4; k >= 1; k--) P.circle(240, 186, Math.round(24 + k * 11 * r0 + pulso * 3), C.yellow, 0.05 * r0 * k * 0.5);
            const rr = rnd(5); for (let k = 0; k < 14; k++) { const a = rr() * 6.28 + tt * 0.6, d = 36 + rr() * 50 * r0, x = 240 + Math.cos(a) * d, y = 178 + Math.sin(a) * d * 0.8, on = Math.sin(tt * 6 + k * 2) > 0.3; if (on) { P.rect(x - 2, y, 5, 1, C.warm); P.rect(x, y - 2, 1, 5, C.warm); } }
        } else { P.poly([[236, 0], [244, 0], [300, 215], [180, 215]], C.warm, 0.1 * r0); }
    }
    // vinheta
    for (let i = 0; i < 6; i++) P.rect(0, i * 3, 480, 3, [0, 0, 0], 0.5 - i * 0.08);
}

function porta(P, c, modo) {
    const { tt, beatN } = c;
    const th = Math.min(0.92, ((Math.floor(beatN) + ease((beatN % 1) * 3)) / 16) * 0.92) * ease(clamp(tt / 1.0, 0, 1)) ;
    const abre = th, wv = 100 * Math.cos(abre * 1.3), f = 1 - 0.2 * Math.sin(abre * 1.3), jit = ((beatN % 1) < 0.2 ? Math.round(Math.sin(c.q * 9)) : 0);
    P.grad(0, 270, hex('#05070f'), hex('#02030a'));
    // sala lá dentro, vista pela abertura
    P.rect(190, 64, 104, 172, hex('#120c22'));
    P.gradR(190, 104, 70, 150, hex('#0a1030'), hex('#2a3a7a'));
    P.rect(190, 64, 104, 6, hex('#0a0a14'));
    P.rect(190, 150, 104, 86, hex('#0a0c1a'));
    for (let k = 0; k < 14; k++) { const lv = c.bandas[k * 2] ?? 0, bx = 200 + k * 7; P.rect(bx, 150 - 8 - alt[k], 6, 8 + alt[k] - 0, hex('#0c1226')); for (let r = 0; r < 4; r++) if (r / 4 < lv) P.px(bx + 2, 140 - r * 4, C.warm); }
    P.blit(CAD[0], 240, 205, { sx: 0.5, sy: 0.5 });
    if (modo === 'A') { const fe = Math.floor(beatN * 0.5) % 6 === 0 ? 1 : 0; bolaOlhuda(P, 266, 232, 5, { look: -1, fecha: fe }); } // bola olhuda espiando no chão, sob a luz
    P.rect(160, 62, 30, 178, hex('#1a1226')); P.rect(294, 62, 30, 178, hex('#1a1226')); P.rect(160, 56, 164, 8, hex('#1a1226'));
    // luz no chão
    const sp = 20 + 90 * abre, l = clamp(abre * 1.4);
    P.poly([[190 + wv, 236], [294, 236], [294 + sp, 270], [190 + wv - sp * 0.4, 270]], C.warm, 0.22 * l);
    P.poly([[190 + wv, 236], [294, 236], [294 + sp * 0.5, 270], [190 + wv, 270]], C.warm, 0.12 * l);
    // folha da porta
    P.poly([[190 + jit, 64], [190 + wv + jit, 150 - 86 * f], [190 + wv + jit, 150 + 86 * f], [190 + jit, 236]], hex('#3a2418'));
    P.poly([[190 + wv * 0.15 + jit, 90], [190 + wv * 0.85 + jit, 150 - 62 * f], [190 + wv * 0.85 + jit, 150 + 62 * f], [190 + wv * 0.15 + jit, 210]], hex('#2a1810'));
    P.circle(Math.round(190 + wv * 0.9 + jit), 154, 2, C.yellow);
    // poeira no feixe
    const r = rnd(3);
    for (let i = 0; i < 18; i++) { const px = 200 + r() * 90 + Math.sin(c.t * 0.5 + i) * 6, py = 150 + ((r() * 100 + c.t * (4 + i % 3 * 3)) % 110); if (l > 0.1) P.px(px, py, C.warm, 0.5 * l); }
    if (c.kickPulse > 0.4) P.rect(0, 0, 480, 270, C.warm, 0.03 * l);
    for (let i = 0; i < 6; i++) P.rect(0, i * 3, 480, 3, [0, 0, 0], 0.5 - i * 0.08);
}

// ---------------------------------------------------------------- O PLANO INFALÍVEL (112 BPM, três trapalhões)
const K = 1.45;
const TIPOS = [
    { x: 140, borda: C.red, sx: 0.85 * K, sy: 1.2 * K }, // alta e magra
    { x: 240, borda: C.yellow, sx: 1.4 * K, sy: 0.95 * K }, // baixinha e redonda
    { x: 340, borda: C.green, sx: 1.0 * K, sy: 1.0 * K, cap: hex('#3a7bd5') }, // de boné
];
const tracos = [ // plano no quadro, em coordenadas do quadro (300x130): [x0,y0,x1,y1] por traço
    [[20, 100, 20, 50]], [[20, 50, 70, 50]], [[70, 50, 70, 100]], [[20, 100, 70, 100]], [[34, 100, 34, 80], [34, 80, 56, 80], [56, 80, 56, 100]],
    [[90, 75, 130, 75]], [[130, 75, 122, 69]], [[130, 75, 122, 81]], [[150, 90, 190, 60]], [[190, 60, 230, 90]], [[230, 90, 262, 62]],
    [[250, 50, 274, 74]], [[274, 50, 250, 74]], [[200, 105, 210, 105]], [[216, 105, 226, 105]], [[232, 105, 242, 105]],
].flat();
function quadro(prog) {
    const S = sprite(300, 130);
    S.rect(0, 0, 300, 130, hex('#6b4a2a')); S.rect(6, 6, 288, 118, hex('#1d3b33'));
    const n = Math.floor(prog * tracos.length), parc = prog * tracos.length - n;
    tracos.forEach((t, i) => { if (i < n) S.line(t[0] + 6, t[1] + 4, t[2] + 6, t[3] + 4, hex('#e8e4d0'), 2); else if (i === n) S.line(t[0] + 6, t[1] + 4, t[0] + 6 + (t[2] - t[0]) * parc, t[1] + 4 + (t[3] - t[1]) * parc, hex('#e8e4d0'), 2); });
    if (prog > 0.95) { S.circle(266, 110, 6, C.yellow); S.rect(262, 115, 8, 3, C.yellow); } // a taça
    S.rect(8, 118, 40, 3, hex('#e8e4d0'), 1); // giz
    return S;
}
const baldeS = (() => { const S = sprite(16, 16); S.poly([[2, 2], [14, 2], [12, 15], [4, 15]], hex('#8a93b8')); S.rect(2, 2, 12, 2, hex('#b8c0e0')); return S; })();

export function plano(P, c) {
    const { tt, beatN, q } = c, bat = Math.abs(Math.sin(beatN * Math.PI)), kk = c.kickPulse;
    // ----- eventos (tempo da faixa, conferidos no volume do WAV)
    const TIPTOE = 42.9, TRIP = 46.45, PANIC = 47.2, FLEE = 49.4, BACK = 53.6;
    const shake = tt > PANIC && tt < FLEE ? Math.round(Math.sin(q * 3.1) * 2 * (0.3 + kk)) : Math.round(kk * Math.sin(q * 4));
    P.fill(hex('#1c1638'));
    P.grad(0, 190, hex('#2b2350'), hex('#1a1536'));
    for (let y = 8; y < 190; y += 8) { P.rect(0, y, 480, 1, hex('#161133')); for (let x = (y / 8) % 2 ? 0 : 12; x < 480; x += 24) P.rect(x, y - 8, 1, 8, hex('#161133')); }
    P.grad(190, 270, hex('#3a2d52'), hex('#241c3a'));
    for (let x = 0; x < 480; x += 40) P.line(x, 190, x - 20 + (x - 240) * 0.3, 270, hex('#2a2044'));
    // lâmpadas = espectro
    for (let k = 0; k < 40; k++) {
        const u = k / 39, x = 6 + k * 12, y = 12 + 14 * 4 * u * (1 - u), lv = c.bandas[k] ?? 0;
        P.rect(x, y - 3, 1, 3, hex('#0a0a14')); P.circle(x + 1, y + 3, 3, lv > 0.05 ? nivel(lv) : hex('#3a3a55'));
        if (lv > 0.1) { P.circle(x + 1, y + 10 + lv * 6, 6 + lv * 10, nivel(lv), 0.07 + 0.08 * lv); }
    }
    for (let k = 0; k < 39; k++) { const u = k / 39, u2 = (k + 1) / 39; P.line(6 + k * 12, 12 + 56 * u * (1 - u) - 0, 6 + (k + 1) * 12, 12 + 56 * u2 * (1 - u2), hex('#0a0a14')); }
    // quadro: progresso do plano + cai quando o pânico bate
    const prog = tt < 36 ? clamp(tt / 8.4) * 0.55 + (tt > 4 ? 0 : 0) : 1;
    let qx = 90 + shake, qy = 36, qrot = 0;
    const cai = clamp((tt - 47.45) / 0.7);
    if (tt >= 47.45) { qrot = -ease(cai) * 1.35; qy = 36 + ease(cai * cai) * 96; qx = 90 - ease(cai) * 0; }
    P.blit(quadro(prog), qx, qy, { px: 0, py: 0, rot: qrot });
    if (tt < 47.45) { P.line(qx + 30, 30, qx + 30, qy + 2, hex('#0a0a14'), 1); P.line(qx + 270, 30, qx + 270, qy + 2, hex('#0a0a14'), 1); }
    // balde
    const bxx = 410, baldeVoa = tt > TRIP ? clamp((tt - TRIP) / 1.2) : 0;
    P.blit(baldeS, bxx + baldeVoa * 30, 238 - Math.sin(baldeVoa * Math.PI) * 50, { px: 8, py: 15, rot: baldeVoa * 9 });
    // ----- personagens
    const figs = TIPOS.map((tp, i) => {
        let x = tp.x, y = 240, rot = 0, o = { legs: 0, armL: 0.2, armR: 0.2, mouth: false, toe: false, mask: true }, vis = true, flip = false, sx = tp.sx, sy = tp.sy;
        const b = bat;
        if (tt < 3.6 + i * 0.5 && tt < 30) { // chegam andando
            const e = clamp((tt - i * 0.6) / 2.6); x = -30 + (tp.x + 30) * ease(e); o.legs = e < 1 ? Math.sin(beatN * Math.PI * 2 + i) : 0; y -= e < 1 ? Math.abs(Math.sin(beatN * Math.PI * 2 + i)) * 2 : 0;
        } else if (tt < TIPTOE) { // planejam
            const alto = tt > 38.6;
            if (alto) { const up = Math.floor(beatN) % 2 === 0; o.armL = up ? 2.8 : 1.0; o.armR = up ? 2.8 : 1.0; o.mouth = up; y -= b * 3; }
            else if (i === 0) { o.armR = 2.3 + Math.sin(beatN * Math.PI * 2) * 0.35; x = 150; o.mouth = true; }
            else if (i === 1) { o.armL = 1.6; y -= b * 2.5; }
            else { o.armR = 1.1; o.armL = 0.6 + b * 0.5; y -= b * 2; }
        } else if (tt < TRIP) { // na ponta do pé, rumo ao balde
            const e = (tt - TIPTOE) / (TRIP - TIPTOE), passo = Math.floor(beatN * 1) % 2 ? 1 : -1;
            x = tp.x + e * (i === 2 ? 70 : i === 1 ? 62 : 54) + (i * 6); o.toe = true; o.legs = passo * 0.8; o.armR = 2.5; o.armL = 0.3; y -= 0; o.mouth = false;
        } else if (tt < PANIC) { // tropeço em cadeia: caem e ficam atordoados no silêncio
            const e = clamp((tt - TRIP - i * 0.22) / 0.5), end = [38, 30, 42][i];
            x = tp.x + (i === 2 ? 70 : i === 1 ? 62 : 54) + i * 6 + e * 18; rot = ease(e) * 1.45; y = 240 + e * 6; o.armL = 2.6; o.armR = 2.6; o.legs = -0.6; o.mouth = e > 0.4; void end; o.armL = 2.2; o.armR = 2.2;
        } else if (tt < FLEE) { // pânico: correm em círculos
            const w = tt * 9 + i * 2.1; x = 240 + Math.cos(w) * (60 + i * 36) * 0.9; y = 240 + Math.sin(w * 2) * 6; flip = Math.sin(w) > 0;
            o.legs = Math.sin(beatN * Math.PI * 4 + i); o.armL = 2.7 + Math.sin(beatN * 9 + i) * 0.4; o.armR = 2.7 - Math.sin(beatN * 9 + i) * 0.4; o.mouth = true; y -= Math.abs(Math.sin(beatN * Math.PI * 2 + i)) * 4;
        } else if (tt < BACK) { // fuga: cada um mais longe
            const t0 = FLEE + [0, 1.5, 3.0][i], e = clamp((tt - t0) / 1.3), dir = [-1, 1, -1][i], run = Math.sin(beatN * Math.PI * 4 + i);
            const from = [240 - 120, 240 + 120, 240][i];
            x = from + dir * ease(e) * 340; y = 240 - ease(e) * [14, 40, 70][i]; sx *= 1 - ease(e) * [0.15, 0.3, 0.45][i]; sy *= 1 - ease(e) * [0.15, 0.3, 0.45][i];
            o.legs = e > 0 && e < 1 ? run : 0; o.armL = 2.4; o.armR = 2.4; o.mouth = true; flip = dir > 0;
            if (e <= 0) { x = from; y = 240; o.mouth = true; o.armL = 2.7; o.armR = 2.7; }
            if (e >= 1) vis = false;
        } else { // voltam de fininho e levantam o quadro caído
            const t0 = BACK + i * 0.65, e = clamp((tt - t0) / 1.0), from = [-50, 530, 240][i], to = [120, 360, 240][i];
            x = from + (to - from) * ease(e); y = i === 2 ? 240 + (1 - ease(e)) * 60 : 240; o.legs = e > 0 && e < 1 ? Math.sin(beatN * Math.PI * 2 + i) : 0; o.toe = e < 1;
            o.armL = 0.3 + b * 0.3; o.armR = 0.3 + b * 0.3; o.mouth = e >= 1 && Math.floor(beatN) % 4 === 0; y -= e >= 1 ? b * 2 : 0; if (e <= 0) vis = false;
        }
        const off = [0, 1.5, 3.0][i];
        let fa = 0;
        if (tt >= TRIP && tt < FLEE + off - 0.3) fa = ease((tt - TRIP - i * 0.22) / 0.3);
        else if (tt >= FLEE + off - 0.3 && tt < BACK) fa = 1 - ease((tt - (FLEE + off - 0.3)) / 0.3);
        else if (tt >= BACK) fa = ease((tt - (BACK + i * 0.65 + 1.4)) / 0.3);
        return { tp, x, y, rot, o, vis, flip, sx, sy, i, fa };
    });
    for (const f of figs.sort((p, q2) => p.y - q2.y)) {
        if (!f.vis) continue;
        P.rect(f.x - 14 * f.sx, 241, 28 * f.sx, 3, [0, 0, 0], 0.3); // sombra
        const fa = f.fa, sq = Math.max(0.12, Math.abs(Math.cos(fa * Math.PI)));
        P.blit(carta({ ...f.o, borda: f.tp.borda, cap: f.tp.cap, front: fa > 0.5, look: Math.sign(Math.sin(tt * 3 + f.i)) }), f.x + shake, f.y, { px: 16, py: 55, sx: f.sx * sq, sy: f.sy, rot: f.rot * (f.flip ? -1 : 1), flip: f.flip });
        if (tt > TRIP && tt < PANIC) for (let s = 0; s < 3; s++) { const a = tt * 6 + s * 2.1 + f.i; P.px(f.x + Math.cos(a) * 14, f.y - 46 * f.sy + Math.sin(a) * 4, C.yellow); P.px(f.x + Math.cos(a) * 14 + 1, f.y - 46 * f.sy + Math.sin(a) * 4, C.yellow); }
        if (tt > PANIC && tt < FLEE && f.o.mouth) { P.rect(f.x + 12, f.y - 54 * f.sy, 2, 6, C.red); P.rect(f.x + 12, f.y - 46 * f.sy, 2, 2, C.red); }
    }
    // poeira do giz quando o quadro cai
    if (tt > 47.45 && tt < 49.2) { const r = rnd(9); for (let i = 0; i < 30; i++) P.circle(140 + r() * 200, 200 + r() * 40 - (tt - 47.45) * 10, 2 + Math.floor(r() * 4), hex('#e8e4d0'), 0.12); }
    if (tt >= FLEE && tt < BACK) P.rect(0, 0, 480, 270, C.ink, 0.28); // luz baixa na fuga
    for (let i = 0; i < 5; i++) P.rect(0, i * 3, 480, 3, [0, 0, 0], 0.4 - i * 0.08);
}

// ---------------------------------------------------------------- C: só cenário e luz
function chefeC(P, c) {
    salaDoChefe(P, c, 'C');
    const { tt } = c;
    if (tt < 10) { camera(P, 1 + 0.06 * (tt / 10), 240, 150); return; }
    const fim = ease((tt - (c.dur - 4.5)) / 4.0), z = 1.05 + 0.04 * Math.sin(tt * 0.3) + 0.55 * fim;
    camera(P, z, 240 + Math.sin(tt * 0.17) * 40 * (1 - fim), 140 + 20 * fim);
}
const FASES = [[0, 1.2], [42.9, 0.5], [46.45, 0], [47.2, 3.5], [49.4, 1.0], [53.6, 0]];
function fase(tt) { let p = 0; for (let i = 0; i < FASES.length; i++) { const [a, v] = FASES[i], b = FASES[i + 1]?.[0] ?? Infinity; if (tt > a) p += v * (Math.min(tt, b) - a); } return p; }
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111' };
const digito = (P, d, x, y, s, col) => { const g = DIG[d]; for (let i = 0; i < 15; i++) if (g[i] === '1') P.rect(x + (i % 3) * s, y + Math.floor(i / 3) * s, s, s, col); };

function tunel(P, c) {
    const { tt, q } = c, ph = fase(tt), fr = ph - Math.floor(ph), id0 = Math.floor(ph);
    const dim = tt >= 49.4 && tt < 53.6 ? 0.45 : 1;
    const shake = tt > 47.2 && tt < 49.4 ? Math.round(Math.sin(q * 3.7) * 2) : 0, cx = 240 + shake, cy = 130;
    P.fill(hex('#04060e'));
    const N = 34;
    for (let i = 0; i <= N; i++) { // da mais perto pra mais longe (as menores cobrem o miolo)
        const d = i + (1 - fr), hw = 6 + 250 / (0.25 + d * 0.3), hh = hw * 0.65, id = id0 - i, lv = (c.bandas[((id % 40) + 40) % 40] ?? 0) * dim;
        const sombra = clamp(d / 30);
        P.rect(cx - hw, cy - hh, hw * 2, hh * 2, mix(id % 2 ? hex('#2a3878') : hex('#141a44'), hex('#02030a'), sombra * 0.85));
        const t = Math.max(2, Math.round(hw * 0.05)), col = lv > 0.06 ? nivel(lv) : mix(hex('#4b5a9a'), hex('#02030a'), sombra);
        const a = lv > 0.06 ? 1 : 0.8;
        P.rect(cx - hw, cy - hh, t, hh * 2, col, a); P.rect(cx + hw - t, cy - hh, t, hh * 2, col, a); P.rect(cx - hw, cy - hh, hw * 2, t, col, a);
        P.rect(cx - hw, cy + hh * 0.55, hw * 2, Math.max(1, hh * 0.45), mix(hex('#1c2447'), hex('#02030a'), sombra), 0.6); // piso
        if (lv > 0.3) P.rect(cx - hw + t, cy - hh + t, hw * 2 - t * 2, hh * 2 - t * 2, col, 0.04 * lv);
    }
    // luz no fim do túnel: o ginásio
    const luz = clamp(1 - Math.abs(tt - 52) / 40, 0.15, 1) * dim;
    P.rect(cx - 14, cy - 8, 28, 16, C.warm, 0.35 * luz); P.rect(cx - 8, cy - 5, 16, 10, [255, 255, 255], 0.5 * luz);
    // tropeço: clarão; silêncio: apagado; pânico: estrobo no kick
    if (tt >= 46.45 && tt < 46.6) P.rect(0, 0, 480, 270, [255, 255, 255], 0.5 * (1 - (tt - 46.45) / 0.15));
    if (tt > 47.2 && tt < 49.4) P.rect(0, 0, 480, 270, C.red, 0.28 * c.kickPulse);
    if (tt >= 46.7 && tt < 47.15) P.rect(0, 0, 480, 270, [0, 0, 0], 0.7);
    for (let i = 0; i < 6; i++) P.rect(0, i * 3, 480, 3, [0, 0, 0], 0.5 - i * 0.08);
    const z = 1 + 0.12 * clamp((tt - 42.9) / 3.5) * (tt < 46.45 ? 1 : 0.0);
    camera(P, z, 240, 130);
}

function ginasio(P, c) {
    const { tt, beatN, q } = c;
    P.grad(0, 270, hex('#060818'), hex('#0e1430'));
    const bx = clamp((tt - 53.6) / 0.25);
    // placar
    P.rect(170, 14, 140, 44, hex('#0a0d1c')); P.rect(170, 14, 140, 2, C.line); P.rect(170, 56, 140, 2, C.line); P.rect(170, 14, 2, 44, C.line); P.rect(308, 14, 2, 44, C.line);
    digito(P, 0, 196, 24, 5, C.red); digito(P, 0, 270, 24, 5, C.blue); if (Math.floor(beatN * 2) % 2 === 0) { P.rect(238, 30, 4, 4, C.yellow); P.rect(238, 40, 4, 4, C.yellow); }
    for (const sx of [180, 300]) P.rect(sx, 6, 4, 8, hex('#141a33'));
    // arquibancada: cada coluna é uma banda do espectro (a torcida pulsa)
    const hz = 168;
    for (let row = 0; row < 12; row++) for (let k = 0; k < 40; k++) {
        const lv = c.bandas[k] ?? 0, y = 76 + row * 7, on = (row / 12) < lv * 1.1 + 0.1, col = [C.red, C.yellow, C.blue, C.green][(k + row) % 4];
        P.rect(k * 12 + 1, y, 10, 5, on ? col : hex('#161b3a'), on ? 1 : 1); if (on) P.rect(k * 12 + 4, y - 2, 4, 2, hex('#e8b48a'));
    }
    P.rect(0, hz - 4, 480, 4, hex('#141a33'));
    P.grad(hz, 270, hex('#1b3a86'), hex('#2f5fc0'));
    for (let i = 0; i < 8; i++) P.rect(0, Math.round(hz + Math.pow(i / 8, 1.7) * 100), 480, 1, hex('#1a3478'));
    P.line(240, hz, 240, 270, [244, 241, 230], 2, 0.8); for (let a = 0; a < 360; a += 2) P.px(240 + 90 * Math.cos((a * Math.PI) / 180), 222 + 26 * Math.sin((a * Math.PI) / 180), [244, 241, 230], 0.9);
    // refletores que varrem
    const sw = Math.sin(beatN * Math.PI * 0.25);
    for (const [x0, d] of [[40, 1], [440, -1]]) P.poly([[x0 - 4, 0], [x0 + 4, 0], [x0 + d * (80 + 90 * sw) + 60, hz + 60], [x0 + d * (80 + 90 * sw) - 60, hz + 60]], C.warm, 0.1 + 0.08 * c.kickPulse);
    P.rect(0, 0, 480, 270, [255, 255, 255], 0.8 * (1 - bx));
    for (let i = 0; i < 5; i++) P.rect(0, i * 3, 480, 3, [0, 0, 0], 0.4 - i * 0.08);
    void q;
    const z = 1 + 0.1 * clamp((tt - 53.6) / 4);
    camera(P, z, 240 + Math.sin(tt * 0.5) * 20, 120);
}
function planoC(P, c) { if (c.tt >= 53.6) ginasio(P, c); else tunel(P, c); }
export const CENAS = { 'A-chefe': (P, c) => salaDoChefe(P, c, 'A'), 'A-plano': plano, 'C-chefe': chefeC, 'C-plano': planoC };
