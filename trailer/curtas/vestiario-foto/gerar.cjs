// A foto do time: img/cabeca.js, onde está a cabeça do Squirtle em cada quadro (o canto esquerdo da 1ª linha opaca, em
// px do quadro), pros óculos escuros seguirem o sprite quadro a quadro (no PMD a cabeça dele é a mesma em todo quadro,
// só anda). Serve pro Squirtle e pro Ditto virado Squirtle (idêntico, a mesma folha).
//   node trailer/curtas/vestiario-foto/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs) → img/cabeca.js
const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
mkdirSync(join(AQUI, 'img'), { recursive: true });

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
