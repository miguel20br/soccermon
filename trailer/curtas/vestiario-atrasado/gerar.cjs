// EP 1 v3 (08/11/2026): o Ditto disfarçado de Slowpoke (a 3ª tentativa), tirado por código da folha do jogo, no molde do
// trailer/curtas/ditto/gerar.cjs: cada pixel opaco ganha a cor da paleta do Ditto (preto + 4 roxos) pela luz dele na
// faixa do quadro 0 do Idle; nos quadros do Idle de frente (o único em que a cara aparece) uma mancha clara apaga os
// olhos e o focinho do Slowpoke e entram os dois olhinhos e a boca de risco do Ditto, na altura de cada quadro.
//   node trailer/curtas/vestiario-atrasado/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs) → img/79-ditto.png
const { execFileSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
const S = window.SPR['79'];
const [W, H] = S.tam;
const ent = join(AQUI, '../midia/sp/79.png');
const d = execFileSync('ffmpeg', ['-v', 'error', '-i', ent, '-vf', 'format=rgba', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
const orig = Buffer.from(d);
const PAL = [[0, 0, 0], [135, 63, 135], [175, 119, 175], [207, 159, 199], [223, 175, 215]];
const lum = (a, i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];
const op = (i) => orig[i + 3] > 200;
const A = S.anims.Idle;
const at = (fx, fy, X, Y) => ((fy + Y) * W + fx + X) * 4;

// faixa de luz do quadro 0 do Idle de frente
let mn = 1e9;
let mx = -1e9;
{
    const [fx, fy] = A.rects[0][0];
    for (let Y = 0; Y < A.h; Y++)
        for (let X = 0; X < A.w; X++) {
            const i = at(fx, fy, X, Y);
            if (op(i)) {
                mn = Math.min(mn, lum(orig, i));
                mx = Math.max(mx, lum(orig, i));
            }
        }
}
for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 200) {
        const t = (lum(orig, i) - mn) / (mx - mn);
        d.set(PAL[Math.max(0, Math.min(4, Math.floor(t * 5)))], i);
        d[i + 3] = 255;
    }

// a cara: o topo dos olhos = 1ª linha com branco entre as colunas 6 e 17 (os pés também têm branco, nas pontas)
const pos = A.rects[0].map(([fx, fy]) => {
    let topo = -1;
    achou: for (let Y = 10; Y < A.h; Y++)
        for (let X = 6; X <= 17; X++) {
            const i = at(fx, fy, X, Y);
            if (op(i) && orig[i] > 225 && orig[i + 1] > 225 && orig[i + 2] > 225) {
                topo = Y;
                break achou;
            }
        }
    if (topo < 0) throw new Error(`sem olhos no quadro ${fx},${fy}`);
    const o = topo + 1; // linha das pupilas
    const P = (X, Y, cor) => d.set([...cor, 255], at(fx, fy, X, Y));
    for (let Y = o - 2; Y <= o + 3; Y++) for (let X = 8; X <= 15; X++) if (op(at(fx, fy, X, Y))) P(X, Y, PAL[4]);
    for (let X = 9; X <= 14; X++) if (op(at(fx, fy, X, o + 4))) P(X, o + 4, PAL[4]);
    const e = 9; // olho esquerdo (o centro do Slowpoke de frente é 11,5)
    P(e, o, PAL[0]);
    P(e + 5, o, PAL[0]);
    for (let X = e - 1; X <= e + 4; X++) P(X, o + 2, PAL[0]);
    for (let X = e + 4; X <= e + 6; X++) P(X, o + 3, PAL[0]);
    return o;
});
mkdirSync(join(AQUI, 'img'), { recursive: true });
const sai = join(AQUI, 'img/79-ditto.png');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', sai], { input: d });
console.log('79-ditto: linha dos olhos por quadro do Idle de frente', JSON.stringify(pos));
