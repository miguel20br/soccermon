// Paredão (EP 1 do Confessionário): img/54-ditto.png, a folha do Psyduck com a cara do Ditto nos quadros do Idle de
// frente (o disfarce do Ditto: "vira qualquer um, sempre com a própria cara"). Os olhões do Psyduck somem numa mancha
// amarela e entram os dois olhinhos de ponto do Ditto e a boca de risco no bico.
//   node trailer/curtas/confessionario-paredao/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs)
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
const S = window.SPR['54'];
const [W, H] = S.tam;
const src = join(AQUI, '../midia/sp/54.png');
const px = execFileSync('ffmpeg', ['-v', 'error', '-i', src, '-vf', 'format=rgba', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
const A = S.anims.Idle;
const at = (fx, fy, X, Y) => ((fy + Y) * W + fx + X) * 4;
const branco = (i) => px[i + 3] > 128 && px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200;
const laranja = (i) => px[i] > 180 && px[i + 1] > 130 && px[i + 1] < 180 && px[i + 2] < 120;
for (const [fx, fy] of A.rects[0]) {
    // os dois olhos: os brancos à esquerda e à direita do meio
    const olhos = [[], []];
    for (let Y = 6; Y < 20; Y++) for (let X = 0; X < A.w; X++) if (branco(at(fx, fy, X, Y))) olhos[X < 12 ? 0 : 1].push([X, Y]);
    const amarelo = px.subarray(at(fx, fy, 11, 9), at(fx, fy, 11, 9) + 4);
    const cor = [amarelo[0], amarelo[1], amarelo[2]];
    const centros = olhos.map((o) => {
        const xs = o.map((p) => p[0]);
        const ys = o.map((p) => p[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 1];
        for (let Y = y0; Y <= y1; Y++)
            for (let X = x0; X <= x1; X++) {
                const i = at(fx, fy, X, Y);
                if (px[i + 3] > 128 && !laranja(i)) px.set([...cor, 255], i);
            }
        return [Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)];
    });
    for (const [cx, cy] of centros) px.set([16, 16, 24, 255], at(fx, fy, cx, cy));
    // a boca de risco do Ditto, no bico
    const yb = Math.max(...centros.map((c) => c[1])) + 3;
    for (let X = centros[0][0] + 1; X <= centros[1][0] - 1; X++) px.set([16, 16, 24, 255], at(fx, fy, X, yb));
    px.set([16, 16, 24, 255], at(fx, fy, centros[1][0], yb - 1));
    console.log('quadro', fx, fy, 'olhos', JSON.stringify(centros));
}
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', join(AQUI, 'img/54-ditto.png')], { input: px });
console.log('54-ditto: pronto');
