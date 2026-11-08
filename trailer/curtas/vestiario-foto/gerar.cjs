// A foto do time: (1) o Ditto "meio Pikachu" da foto final, tirado por código da folha do jogo, no molde do
// vestiario-atrasado/gerar.cjs: cada pixel opaco da folha do Pikachu ganha a cor da paleta do Ditto (preto + 4 roxos)
// pela luz dele; no quadro 1 do Pose de frente (o da foto) a cara do Pikachu vira a do Ditto (dois olhinhos e a boca
// de risco), mas as bochechas vermelhas ficam: ele ainda está no meio do caminho.
// (2) img/cabeca.js: onde está a cabeça do Squirtle em cada quadro (o canto esquerdo da 1ª linha opaca, em px do quadro),
// pros óculos escuros seguirem o sprite quadro a quadro (no PMD a cabeça dele é a mesma em todo quadro, só anda).
//   node trailer/curtas/vestiario-foto/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs) → img/25-ditto.png, img/cabeca.js
const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
const S = window.SPR['25'];
const [W, H] = S.tam;
const ent = join(AQUI, '../midia/sp/25.png');
const d = execFileSync('ffmpeg', ['-v', 'error', '-i', ent, '-vf', 'format=rgba', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
const orig = Buffer.from(d);
const PAL = [[0, 0, 0], [135, 63, 135], [175, 119, 175], [207, 159, 199], [223, 175, 215]];
const lum = (a, i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];
const [fx, fy] = S.anims.Pose.rects[0][1];
const at = (X, Y) => ((fy + Y) * W + fx + X) * 4;

// faixa de luz do quadro da foto
let mn = 1e9;
let mx = -1e9;
for (let Y = 0; Y < S.anims.Pose.h; Y++)
    for (let X = 0; X < S.anims.Pose.w; X++) {
        const i = at(X, Y);
        if (orig[i + 3] > 200) {
            mn = Math.min(mn, lum(orig, i));
            mx = Math.max(mx, lum(orig, i));
        }
    }
for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 200) {
        const t = (lum(orig, i) - mn) / (mx - mn);
        d.set(PAL[Math.max(0, Math.min(4, Math.floor(t * 5)))], i);
        d[i + 3] = 255;
    }

// a cara (coordenadas do quadro 1 do Pose de frente, 32x40): olhos em (13–14, 9–10) e (20–21, 9–10), nariz (17, 10),
// boca (16–18, 12–13); bochechas vermelhas em (12, 11–12), (13, 12), (22, 11–12), (21, 12)
const P = (X, Y, cor) => d.set([...cor, 255], at(X, Y));
for (let Y = 9; Y <= 13; Y++) for (let X = 13; X <= 21; X++) P(X, Y, PAL[4]);
const BOCHECHA = [232, 72, 88];
for (const [X, Y] of [[12, 11], [12, 12], [13, 12], [22, 11], [22, 12], [21, 12]]) P(X, Y, BOCHECHA);
P(15, 10, PAL[0]);
P(19, 10, PAL[0]);
for (let X = 15; X <= 19; X++) P(X, 12, PAL[0]);
P(14, 11, PAL[0]);
P(20, 11, PAL[0]);

mkdirSync(join(AQUI, 'img'), { recursive: true });
const sai = join(AQUI, 'img/25-ditto.png');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', sai], { input: d });
console.log('25-ditto: pronto');

// (2) a cabeça do Squirtle quadro a quadro
{
    const S7 = window.SPR['7'];
    const [W7] = S7.tam;
    const px = execFileSync('ffmpeg', ['-v', 'error', '-i', join(AQUI, '../midia/sp/7.png'), '-vf', 'format=rgba', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
    const CAB = {};
    for (const nome of ['Idle', 'Walk', 'Shoot']) {
        const A = S7.anims[nome];
        A.rects.forEach((dir, d) => {
            CAB[`${nome}/${d}`] = dir.map(([fx7, fy7]) => {
                for (let Y = 0; Y < A.h; Y++)
                    for (let X = 0; X < A.w; X++) if (px[((fy7 + Y) * W7 + fx7 + X) * 4 + 3] > 128) return [X, Y];
                return null;
            });
        });
    }
    writeFileSync(join(AQUI, 'img/cabeca.js'), `window.CABECA = ${JSON.stringify(CAB)};\n`);
    console.log('cabeca: pronto');
}

// (3) img/7-ditto.png: o Ditto virado Squirtle (o EP inteiro, 08/11). A folha do Squirtle nas cores dele, mas nos quadros
// do Idle de frente (o único que o disfarce usa) a cara vira a do Ditto: apaga os olhões e a boca (a mancha azul-clara
// entre o contorno) e entram os dois olhinhos e a boca de risco, presos ao canto da cabeça de cada quadro (o mesmo da (2)).
{
    const S7 = window.SPR['7'];
    const [W7, H7] = S7.tam;
    const px = execFileSync('ffmpeg', ['-v', 'error', '-i', join(AQUI, '../midia/sp/7.png'), '-vf', 'format=rgba', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
    const A = S7.anims.Idle;
    const PRETO = [0, 0, 0];
    const CLARO = [127, 207, 255];
    for (const [fx, fy] of A.rects[0]) {
        const at7 = (X, Y) => ((fy + Y) * W7 + fx + X) * 4;
        let cx = 0;
        let cy = 0;
        achou: for (let Y = 0; Y < A.h; Y++)
            for (let X = 0; X < A.w; X++)
                if (px[at7(X, Y) + 3] > 128) {
                    [cx, cy] = [X, Y];
                    break achou;
                }
        // a mancha: tudo que não é contorno nas linhas da cara (olhos e boca), entre as colunas do contorno da cabeça
        for (let Y = cy + 4; Y <= cy + 9; Y++)
            for (let X = cx - 1; X <= cx + 9; X++) {
                const i = at7(X, Y);
                if (px[i + 3] > 128 && px[i] + px[i + 1] + px[i + 2] > 0) px.set(CLARO, i);
            }
        const P = (X, Y) => px.set(PRETO, at7(X, Y));
        P(cx + 2, cy + 6);
        P(cx + 6, cy + 6);
        for (let X = cx + 1; X <= cx + 7; X++) P(X, cy + 8);
    }
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W7}x${H7}`, '-i', '-', '-frames:v', '1', join(AQUI, 'img/7-ditto.png')], { input: px });
    console.log('7-ditto: pronto');
}
