// Rasterizador mínimo pra pixel art (buffer RGB). Cores são [r,g,b]; KEY é a cor transparente dos sprites.
export const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const KEY = [255, 0, 255];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Pix {
    constructor(w, h, fill) { this.w = w; this.h = h; this.b = Buffer.alloc(w * h * 3); if (fill) this.fill(fill); }
    fill(c) { for (let i = 0; i < this.w * this.h; i++) { this.b[i * 3] = c[0]; this.b[i * 3 + 1] = c[1]; this.b[i * 3 + 2] = c[2]; } }
    px(x, y, c, a = 1) {
        x = Math.floor(x); y = Math.floor(y);
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
        const i = (y * this.w + x) * 3, b = this.b;
        if (a >= 1) { b[i] = c[0]; b[i + 1] = c[1]; b[i + 2] = c[2]; } else { b[i] += (c[0] - b[i]) * a; b[i + 1] += (c[1] - b[i + 1]) * a; b[i + 2] += (c[2] - b[i + 2]) * a; }
    }
    rect(x, y, w, h, c, a = 1) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a); }
    grad(y0, y1, c0, c1) { for (let y = y0; y < y1; y++) this.rect(0, y, this.w, 1, mix(c0, c1, (y - y0) / Math.max(1, y1 - y0 - 1))); }
    gradR(x, w, y0, y1, c0, c1) { for (let y = y0; y < y1; y++) this.rect(x, y, w, 1, mix(c0, c1, (y - y0) / Math.max(1, y1 - y0 - 1))); }
    circle(cx, cy, r, c, a = 1) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.px(cx + x, cy + y, c, a); }
    ring(cx, cy, r, c, a = 1) { const n = Math.max(16, Math.ceil(r * 7)); for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; this.px(cx + r * Math.cos(t), cy + r * Math.sin(t), c, a); } }
    line(x0, y0, x1, y1, c, th = 1, a = 1) {
        const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1;
        for (let i = 0; i <= n; i++) { const t = i / n; this.rect(x0 + (x1 - x0) * t - (th >> 1), y0 + (y1 - y0) * t - (th >> 1), th, th, c, a); }
    }
    poly(pts, c, a = 1) {
        const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
        for (let y = y0; y <= y1; y++) {
            const xs = [];
            for (let i = 0; i < pts.length; i++) {
                const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
                if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
            }
            xs.sort((p, q) => p - q);
            for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c, a);
        }
    }
    /** Cola um sprite (cor KEY = transparente), girando/escalando em torno do pivô (px, py) do sprite, posto em (x, y). */
    blit(s, x, y, { rot = 0, sx = 1, sy = 1, px = s.w / 2, py = s.h / 2, flip = false, a = 1 } = {}) {
        const r = Math.hypot(s.w, s.h) * Math.max(Math.abs(sx), Math.abs(sy)), cs = Math.cos(rot), sn = Math.sin(rot);
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const ux = (dx * cs + dy * sn) / sx, uy = (-dx * sn + dy * cs) / sy;
            let ix = Math.floor(px + (flip ? -ux : ux)), iy = Math.floor(py + uy);
            if (ix < 0 || iy < 0 || ix >= s.w || iy >= s.h) continue;
            const i = (iy * s.w + ix) * 3, b = s.b;
            if (b[i] === 255 && b[i + 1] === 0 && b[i + 2] === 255) continue;
            this.px(Math.round(x + dx), Math.round(y + dy), [b[i], b[i + 1], b[i + 2]], a);
        }
    }
}
export const sprite = (w, h) => new Pix(w, h, KEY);

/** Jogador de futsal genérico em pixel (48x64, pés em 24,60). Sem nada de franquia. */
export function humano(o = {}) {
    const S = sprite(48, 64), cx = 24, ink = hex('#0e1430'), skin = o.skin ?? hex('#e8b48a'), jer = o.jersey ?? hex('#e8423f'), sh = o.shorts ?? hex('#232d57');
    const stride = o.legs ?? 0, toe = o.toe ? 3 : 0, side = o.side ? 1 : 0;
    for (const [d, lx] of [[-1, cx - 5], [1, cx + 1]]) {
        const off = Math.round(d * stride * 3);
        S.rect(lx + off, 46, 4, 11 - toe, skin); S.rect(lx + off - (side ? 0 : 0), 57 - toe, 5, 3, ink); if (o.sock) S.rect(lx + off, 52 - toe, 4, 3, o.sock);
    }
    S.rect(cx - 6, 38, 12, 9, sh); S.rect(cx - 6, 24, 12, 15, jer);
    if (o.stripe) S.rect(cx - 6, 30, 12, 3, o.stripe);
    for (const [d, ax] of [[-1, cx - 6], [1, cx + 5]]) {
        const ang = (d < 0 ? o.armL : o.armR) ?? 0.15, L = 12, ex = ax + 1 + d * Math.sin(ang) * L, ey = 26 + Math.cos(ang) * L;
        S.line(ax + 1, 26, ex, ey, skin, 3); S.rect(ax - 0, 25, 3, 4, jer);
    }
    S.circle(cx, 17, 6, skin);
    if (o.cap) { S.rect(cx - 7, 9, 14, 5, o.cap); S.rect(cx + 3, 13, 8, 2, o.cap); } else S.rect(cx - 6, 10, 12, 4, o.hair ?? hex('#3a2418'));
    if (o.back) S.rect(cx - 6, 13, 12, 3, o.hair ?? hex('#3a2418'));
    else if (o.mask) { S.rect(cx - 6, 16, 12, 3, ink); S.px(cx - 3, 17, [255, 255, 255]); S.px(cx + 2, 17, [255, 255, 255]); }
    else { S.px(cx - 3, 17, ink); S.px(cx + 2, 17, ink); }
    if (!o.back) { if (o.mouth) S.rect(cx - 1, 21, 3, 2, ink); else S.rect(cx - 1, 21, 3, 1, mix(skin, ink, 0.5)); }
    return S;
}
