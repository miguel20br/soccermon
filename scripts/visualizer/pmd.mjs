// Sprites PMD do jogo (public/assets/field/<id>.png + .json, quadros "Anim/dir/n") como Pix com cor KEY transparente.
// dir 0..7 (0 = de frente pra câmera). Pé = última linha opaca do quadro; x central.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { KEY, sprite } from './pix.mjs';
import { RAIZ } from './render.mjs';

const folhas = new Map(), cache = new Map();
export async function carregar(...ids) {
    for (const id of ids) {
        if (folhas.has(id)) continue;
        const json = JSON.parse(readFileSync(`${RAIZ}public/assets/field/${id}.json`, 'utf8'));
        const { data, info } = await sharp(`${RAIZ}public/assets/field/${id}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        folhas.set(id, { frames: json.frames, data, w: info.width });
    }
}
/** Quadro n da animação `anim` na direção `dir` (n é cíclico). Devolve { s: sprite, px, py } ou null. */
export function quadro(id, anim, dir, n) {
    const f = folhas.get(id);
    let total = 0;
    while (f.frames[`${anim}/${dir}/${total}`]) total++;
    if (!total) return null;
    const key = `${id}/${anim}/${dir}/${((n % total) + total) % total}`;
    if (cache.has(key)) return cache.get(key);
    const r = f.frames[`${anim}/${dir}/${((n % total) + total) % total}`].frame, S = sprite(r.w, r.h);
    let pe = 0;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
        const i = ((r.y + y) * f.w + r.x + x) * 4;
        if (f.data[i + 3] > 128) { const j = (y * r.w + x) * 3; S.b[j] = f.data[i]; S.b[j + 1] = f.data[i + 1]; S.b[j + 2] = f.data[i + 2]; pe = Math.max(pe, y); }
    }
    const o = { s: S, px: r.w / 2, py: pe + 1, total };
    cache.set(key, o);
    return o;
}
/** Desenha o PMD em (x, y = pés) com escala inteira; t em quadros do jogo a 60/s não é preciso: n vem do chamador. */
const tints = new Map();
/** dim escurece (1 = igual), gray mistura com cinza (0..1), cor = [r,g,b] opcional multiplicando (luz colorida). */
function tintado(q, key, dim, gray, cor) {
    const k = `${key}|${dim}|${gray}|${cor}`;
    if (tints.has(k)) return tints.get(k);
    const S = sprite(q.s.w, q.s.h);
    for (let i = 0; i < q.s.w * q.s.h; i++) {
        const r = q.s.b[i * 3], g = q.s.b[i * 3 + 1], b = q.s.b[i * 3 + 2];
        if (r === 255 && g === 0 && b === 255) { S.b[i * 3] = 255; S.b[i * 3 + 2] = 255; continue; }
        const l = (r + g + b) / 3;
        S.b[i * 3] = Math.min(254, (r + (l - r) * gray) * dim * (cor ? cor[0] / 255 : 1)); S.b[i * 3 + 1] = Math.min(254, (g + (l - g) * gray) * dim * (cor ? cor[1] / 255 : 1)); S.b[i * 3 + 2] = Math.min(253, (b + (l - b) * gray) * dim * (cor ? cor[2] / 255 : 1));
    }
    const o = { ...q, s: S };
    tints.set(k, o);
    return o;
}
export function pmd(P, id, anim, dir, n, x, y, { sc = 2, flip = false, rot = 0, a = 1, sy = 1, sx = 1, dim = 1, gray = 0, cor = null } = {}) {
    let q = quadro(id, anim, dir, n) ?? quadro(id, 'Idle', dir, 0);
    if (dim !== 1 || gray || cor) q = tintado(q, `${id}/${anim}/${dir}/${((n % q.total) + q.total) % q.total}`, dim, gray, cor);
    P.blit(q.s, x, y, { px: q.px, py: q.py, sx: sc * sx, sy: sc * sy, flip, rot, a });
}
export { KEY };
