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
export function pmd(P, id, anim, dir, n, x, y, { sc = 2, flip = false, rot = 0, a = 1, sy = 1 } = {}) {
    const q = quadro(id, anim, dir, n) ?? quadro(id, 'Idle', dir, 0);
    P.blit(q.s, x, y, { px: q.px, py: q.py, sx: sc, sy: sc * sy, flip, rot, a });
}
export { KEY };
