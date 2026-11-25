// v3 (Miguel, 26/11: "o gorro não tá mexendo junto da cabeça"): mede a cabeça quadro a quadro, como o
// scripts/build-gorro-quadros.ts da v010 faz pro jogo. Pega o pedaço do quadro Idle 0 em volta da aba (a âncora CABECA,
// medida à mão) e procura onde ele casa melhor em cada quadro do Idle e da Pose, em cada direção com âncora.
//   node trailer/curtas/news-especial/gorro-quadros.mjs   → midia/gorro-quadros.js (window.GORRO_Q)
// Saída: { id: { anim: { dir: [[hx, hy], ...] } } }, hx = coluna do meio da aba e hy = linha da base, em px do quadro.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const D = new URL('./midia/', import.meta.url).pathname;
const SPR = new Function('window', `${readFileSync(`${D}sprites.js`, 'utf8')}; return window.SPR;`)({});
/** A âncora no quadro Idle 0, por direção (a mesma tabela do index.html). */
export const CABECA = { 26: { 0: [19, 12], 1: [17, 12], 7: [22, 12] }, 52: { 0: [15, 6], 1: [14, 5], 7: [16, 5] }, 67: { 0: [15, 9], 1: [17, 9], 7: [13, 9] } };
const FOLHA = { 26: 'sp/26-terno.png', 67: 'sp/67-terno.png', 52: 'sp/52.png' };

const out = {};
for (const [id, cab] of Object.entries(CABECA)) {
    const { data, info } = await sharp(`${D}${FOLHA[id]}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const S = SPR[id];
    const px = (A, d, f, x, y) => {
        if (x < 0 || y < 0 || x >= A.w || y >= A.h) return 0;
        const [rx, ry] = A.rects[A.rects.length === 1 ? 0 : d][f];
        const i = ((ry + y) * info.width + rx + x) * 4;
        return data[i + 3] > 20 ? (data[i] << 16) | (data[i + 1] << 8) | data[i + 2] : 0;
    };
    const I = S.anims.Idle;
    out[id] = {};
    for (const nome of ['Idle', 'Pose']) {
        const A = S.anims[nome];
        if (!A) continue;
        out[id][nome] = {};
        for (const [d, [hx, hy]] of Object.entries(cab)) {
            // o mesmo ponto do corpo: meio do quadro e linha do pé
            const bx = Math.round(A.w / 2 - I.w / 2);
            const by = Math.round(A.pe * A.h - I.pe * I.h);
            const R = nome === 'Idle' ? 6 : 10;
            const lista = [];
            for (let f = 0; f < A.rects[0].length; f++) {
                let best = [0, 0];
                let bestErr = Infinity;
                for (let dy = -R; dy <= R; dy++)
                    for (let dx = -R; dx <= R; dx++) {
                        let err = 0;
                        for (let y = hy - 5; y <= hy + 7; y++)
                            for (let x = hx - 9; x <= hx + 9; x++) {
                                const u = px(I, +d, 0, x, y);
                                const v = px(A, +d, f, x + bx + dx, y + by + dy);
                                if (!u !== !v) err += 2; // forma pesa mais que cor
                                else if (u !== v) err += 1;
                            }
                        const e = err + (Math.abs(dx) + Math.abs(dy)) * 0.01;
                        if (e < bestErr) [bestErr, best] = [e, [dx, dy]];
                    }
                lista.push([hx + bx + best[0], hy + by + best[1]]);
            }
            out[id][nome][d] = lista;
        }
    }
}
writeFileSync(`${D}gorro-quadros.js`, `window.GORRO_Q = ${JSON.stringify(out)};\n`);
for (const [id, v] of Object.entries(out)) for (const [n, ds] of Object.entries(v)) console.log(id, n, JSON.stringify(ds));
