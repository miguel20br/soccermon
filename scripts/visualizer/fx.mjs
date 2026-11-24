// Acabamento "de cinema" pro pixel: bloom, câmera com rotação, reflexo no piso, feixes com poeira, transições.
import { clamp, hex, mix, rnd } from './pix.mjs';

/** Brilho: pega o que passa de `thr`, borra em 1/4 de resolução e soma. */
export function bloom(P, thr = 150, k = 0.9) {
    const sw = P.w >> 2, sh = P.h >> 2, a = new Float32Array(sw * sh * 3), b = new Float32Array(sw * sh * 3);
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
        const i = (y * P.w + x) * 3, j = ((y >> 2) * sw + (x >> 2)) * 3;
        for (let c = 0; c < 3; c++) { const v = P.b[i + c] - thr; if (v > 0) a[j + c] += v / 16; }
    }
    for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) for (let c = 0; c < 3; c++) { let s = 0, n = 0; for (let d = -2; d <= 2; d++) { const xx = x + d; if (xx >= 0 && xx < sw) { s += a[(y * sw + xx) * 3 + c]; n++; } } b[(y * sw + x) * 3 + c] = s / 4; }
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) for (let c = 0; c < 3; c++) { let s = 0, n = 0; for (let d = -2; d <= 2; d++) { const yy = y + d; if (yy >= 0 && yy < sh) { s += b[(yy * sw + x) * 3 + c]; n++; } } a[(y * sw + x) * 3 + c] = s / 4; }
    }
    for (let y = 0; y < P.h; y++) {
        const fy = (y + 0.5) / 4 - 0.5, iy = Math.max(0, Math.min(sh - 2, Math.floor(fy))), ty = clamp(fy - iy);
        for (let x = 0; x < P.w; x++) {
            const fx = (x + 0.5) / 4 - 0.5, ix = Math.max(0, Math.min(sw - 2, Math.floor(fx))), tx = clamp(fx - ix), i = (y * P.w + x) * 3;
            for (let c = 0; c < 3; c++) {
                const v = (a[(iy * sw + ix) * 3 + c] * (1 - tx) + a[(iy * sw + ix + 1) * 3 + c] * tx) * (1 - ty) + (a[((iy + 1) * sw + ix) * 3 + c] * (1 - tx) + a[((iy + 1) * sw + ix + 1) * 3 + c] * tx) * ty;
                P.b[i + c] = Math.min(255, P.b[i + c] + v * k * 2.2);
            }
        }
    }
}
let VIG;
/** Vinheta + linhas de varredura leves (as linhas pares escurecem 5%). */
export function acabamento(P, vig = 0.55) {
    if (!VIG || VIG.length !== P.w * P.h) { VIG = new Float32Array(P.w * P.h); for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const dx = (x / P.w - 0.5) * 2, dy = (y / P.h - 0.5) * 2; VIG[y * P.w + x] = 1 - Math.pow(Math.min(1, Math.hypot(dx * 0.8, dy * 0.85)), 2.4) * vig; } }
    for (let y = 0; y < P.h; y++) { const s = y & 1 ? 0.95 : 1; for (let x = 0; x < P.w; x++) { const i = (y * P.w + x) * 3, m = VIG[y * P.w + x] * s; P.b[i] *= m; P.b[i + 1] *= m; P.b[i + 2] *= m; } }
}
/** Câmera: zoom z em torno de (cx, cy), giro rot (rad) e tremida; nearest (mantém o pixel). */
export function camera(P, { z = 1, cx = P.w / 2, cy = P.h / 2, rot = 0, dx = 0, dy = 0 } = {}) {
    if (z === 1 && !rot && !dx && !dy && cx === P.w / 2 && cy === P.h / 2) return;
    const snap = Buffer.from(P.b), W = P.w, H = P.h, cs = Math.cos(rot), sn = Math.sin(rot);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = (x - W / 2 - dx) / z, v = (y - H / 2 - dy) / z, rx = u * cs + v * sn, ry = -u * sn + v * cs;
        const sx = Math.max(0, Math.min(W - 1, Math.floor(cx + rx))), sy = Math.max(0, Math.min(H - 1, Math.floor(cy + ry))), i = (y * W + x) * 3, j = (sy * W + sx) * 3;
        P.b[i] = snap[j]; P.b[i + 1] = snap[j + 1]; P.b[i + 2] = snap[j + 2];
    }
}
/** Reflexo de piso: espelha as linhas acima de yh dentro do piso, com fade. */
export function reflexo(P, yh, prof, alpha) {
    for (let y = yh; y < Math.min(P.h, yh + prof); y++) {
        const t = (y - yh) / prof, sy = yh - 2 - Math.round((y - yh) * 1.1), a = alpha * (1 - t) * (1 - t);
        if (sy < 0) break;
        const wob = (y & 3) === 0 ? 1 : 0;
        for (let x = 0; x < P.w; x++) { const xs = Math.min(P.w - 1, Math.max(0, x + wob)), i = (y * P.w + x) * 3, j = (sy * P.w + xs) * 3; for (let c = 0; c < 3; c++) P.b[i + c] += (P.b[j + c] - P.b[i + c]) * a; }
    }
}
/** Cone de luz suave (3 camadas) saindo de (x0,y0) com ângulo ang (rad, 0 = pra baixo), comprimento len e larguras w0/w1. */
export function cone(P, x0, y0, ang, len, w0, w1, col, a) {
    const dx = Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx, x1 = x0 + dx * len, y1 = y0 + dy * len;
    for (const [f, al] of [[1, 0.35], [0.66, 0.35], [0.33, 0.3]]) P.poly([[x0 - nx * w0 * f / 2, y0 - ny * w0 * f / 2], [x0 + nx * w0 * f / 2, y0 + ny * w0 * f / 2], [x1 + nx * w1 * f / 2, y1 + ny * w1 * f / 2], [x1 - nx * w1 * f / 2, y1 - ny * w1 * f / 2]], col, a * al);
    return { x0, y0, dx, dy, nx, ny, len, w0, w1 };
}
/** Poeira dentro do cone: partículas que sobem devagar e piscam. */
export function poeira(P, cn, t, n, col = [255, 240, 200], seed = 1, vel = 6) {
    const r = rnd(seed);
    for (let i = 0; i < n; i++) {
        const u = (r() + t * vel * 0.002 * (0.5 + r())) % 1, side = r() * 2 - 1, wob = Math.sin(t * (0.5 + r()) + i) * 3;
        const w = cn.w0 + (cn.w1 - cn.w0) * u, x = cn.x0 + cn.dx * cn.len * u + cn.nx * (side * w * 0.45 + wob), y = cn.y0 + cn.dy * cn.len * u + cn.ny * (side * w * 0.45);
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
        P.px(x, y, col, 0.35 + 0.55 * tw); if (i % 5 === 0) P.px(x + 1, y, col, 0.4 * tw);
    }
}
/** Dissolve em blocos pro preto (p 0..1): transição no tempo da batida. */
export function bloco(P, p, seed = 3, tam = 16, col = [0, 0, 0]) {
    if (p <= 0) return;
    for (let by = 0; by < Math.ceil(P.h / tam); by++) for (let bx = 0; bx < Math.ceil(P.w / tam); bx++) {
        const h = (Math.sin(bx * 12.9898 + by * 78.233 + seed) * 43758.5453) % 1, v = Math.abs(h);
        if (v < p) P.rect(bx * tam, by * tam, tam, tam, col);
    }
}
/** Rastro horizontal (whip pan): média de 3 cópias deslocadas. */
export function esmear(P, amt) {
    if (amt < 1) return;
    const snap = Buffer.from(P.b);
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const i = (y * P.w + x) * 3; for (let c = 0; c < 3; c++) { const a = snap[(y * P.w + Math.max(0, x - amt)) * 3 + c], b = snap[(y * P.w + Math.min(P.w - 1, x + amt)) * 3 + c]; P.b[i + c] = (P.b[i + c] + a + b) / 3; } }
}
export const banda = (bs, a, b) => { let s = 0; for (let k = a; k < b; k++) s += bs[k] ?? 0; return s / (b - a); };
export { hex, mix };
