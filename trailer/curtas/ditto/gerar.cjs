// EP 3 (28/10/2026): a folha do Snorlax que o Ditto vira, roxa e com a cara do Ditto (img/143-ditto.png).
// Cada pixel opaco do Snorlax ganha a cor da paleta do Ditto pela luz (preto, 4 roxos); nos quadros do Idle de frente
// a cara do Snorlax é apagada e entram os dois olhinhos e a boca de risco, na posição de cada quadro (no Idle ele estica os braços:
// a cara sai do topo da cabeça de cada quadro).
//   node trailer/curtas/ditto/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs)
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT ?? '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
const IDLE = window.SPR['143'].anims.Idle.rects[0];
const png = readFileSync(join(AQUI, '../midia/sp/143.png')).toString('base64');

(async () => {
    const b = await chromium.launch({ headless: true });
    const p = await b.newPage();
    const url = await p.evaluate(
        async ({ png, IDLE }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${png}`;
            await img.decode();
            const c = new OffscreenCanvas(img.width, img.height);
            const x = c.getContext('2d');
            x.drawImage(img, 0, 0);
            const D = x.getImageData(0, 0, img.width, img.height);
            const d = D.data;
            const W = img.width;
            const PAL = [[0, 0, 0], [135, 63, 135], [175, 119, 175], [207, 159, 199], [223, 175, 215]];
            const lum = (i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
            // faixa de luz do quadro 0 do Idle (a da prova aprovada)
            let mn = 1e9;
            let mx = -1e9;
            for (let y = 0; y < 64; y++)
                for (let X = 0; X < 32; X++) {
                    const i = (y * W + X) * 4;
                    if (d[i + 3] > 200) {
                        mn = Math.min(mn, lum(i));
                        mx = Math.max(mx, lum(i));
                    }
                }
            // a cabeça original de cada quadro, antes de pintar (pra achar o deslocamento)
            const orig = new Uint8ClampedArray(d);
            for (let i = 0; i < d.length; i += 4)
                if (d[i + 3] > 200) {
                    const t = (lum(i) - mn) / (mx - mn);
                    d.set(PAL[Math.max(0, Math.min(4, Math.floor(t * 5)))], i);
                    d[i + 3] = 255;
                }
            const set = (X, Y, cor) => d.set([...cor, 255], (Y * W + X) * 4);
            // o topo da cabeça (1ª linha com contorno preto no meio do quadro) acha a cara em cada pose: no quadro 0 a
            // cara do Snorlax fica 9 linhas abaixo dele; nos outros (braços pra cima, bocejando) fica 3 abaixo
            const topo = (fx, fy) => {
                for (let Y = 0; Y < 64; Y++)
                    for (let X = 10; X <= 22; X++) {
                        const i = ((fy + Y) * W + fx + X) * 4;
                        if (orig[i + 3] > 200 && orig[i] + orig[i + 1] + orig[i + 2] < 30) return Y;
                    }
                return 0;
            };
            const desl = [];
            IDLE.forEach(([fx, fy], k) => {
                const P = (X, Y, cor) => set(fx + X, fy + Y, cor);
                const t = topo(fx, fy);
                const o = k === 0 ? t + 9 : t + 3; // linha dos olhos
                desl.push([t, o]);
                if (k === 0) for (let X = 11; X <= 20; X++) for (let Y = o - 1; Y <= o + 3; Y++) P(X, Y, PAL[4]);
                else for (let X = 12; X <= 19; X++) for (let Y = o - 1; Y <= o + 6; Y++) P(X, Y, PAL[4]);
                P(13, o, PAL[0]);
                P(18, o, PAL[0]);
                for (let X = 12; X <= 17; X++) P(X, o + 2, PAL[0]);
                for (let X = 17; X <= 19; X++) P(X, o + 3, PAL[0]);
            });
            console.log(JSON.stringify(desl));
            x.putImageData(D, 0, 0);
            const blob = await c.convertToBlob({ type: 'image/png' });
            const buf = new Uint8Array(await blob.arrayBuffer());
            let s = '';
            for (const v of buf) s += String.fromCharCode(v);
            return { png: btoa(s), desl };
        },
        { png, IDLE },
    );
    writeFileSync(join(AQUI, 'img/143-ditto.png'), Buffer.from(url.png, 'base64'));
    console.log('topo da cabeça e linha dos olhos por quadro do Idle:', JSON.stringify(url.desl));
    await b.close();
})();
