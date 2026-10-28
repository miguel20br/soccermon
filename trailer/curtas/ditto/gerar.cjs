// EP 3 (28/10/2026): as folhas do Ditto disfarçado, tiradas por código das folhas do jogo (img/):
//   143-ditto.png  o Snorlax roxo com a cara do Ditto (tentativas 1 e 2)
//   143-cara.png   o Snorlax perfeito, nas cores dele, com a cara do Ditto (a cara volta sozinha; o estádio)
//   95-ditto.png   o Onix roxo com a cara do Ditto (tentativa 2)
// (v2 do roteiro: ninguém além do Ditto tem a cara dele, então o Pikachu imitando saiu)
// Roxo: cada pixel opaco ganha a cor da paleta do Ditto (preto + 4 roxos, ordenada pela luz) conforme a luz dele na
// faixa do quadro 0. Cara: nos quadros do Idle de frente (o único que os disfarces usam), uma mancha da cor da cara
// apaga olhos e boca e entram os dois olhinhos e a boca de risco do Ditto, na posição de cada quadro.
//   node trailer/curtas/ditto/gerar.cjs     (precisa de trailer/curtas/midia: preparar.mjs)
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT ?? '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const AQUI = __dirname;
global.window = {};
require(join(AQUI, '../midia/sprites.js'));
const VARIANTES = [
    { saida: '143-ditto', id: '143', roxo: true },
    { saida: '143-cara', id: '143', roxo: false },
    { saida: '95-ditto', id: '95', roxo: true },
];

(async () => {
    const b = await chromium.launch({ headless: true });
    const p = await b.newPage();
    for (const v of VARIANTES) {
        const A = window.SPR[v.id].anims.Idle;
        const png = readFileSync(join(AQUI, `../midia/sp/${v.id}.png`)).toString('base64');
        const r = await p.evaluate(
            async ({ png, v, rects, w, h }) => {
                const img = new Image();
                img.src = `data:image/png;base64,${png}`;
                await img.decode();
                const c = new OffscreenCanvas(img.width, img.height);
                const x = c.getContext('2d');
                x.drawImage(img, 0, 0);
                const D = x.getImageData(0, 0, img.width, img.height);
                const d = D.data;
                const W = img.width;
                const orig = new Uint8ClampedArray(d);
                const PAL = [[0, 0, 0], [135, 63, 135], [175, 119, 175], [207, 159, 199], [223, 175, 215]];
                const lum = (a, i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];
                const at = (fx, fy, X, Y) => ((fy + Y) * W + fx + X) * 4;
                const op = (i) => orig[i + 3] > 200;
                if (v.roxo) {
                    // faixa de luz do quadro 0 do Idle (a da prova aprovada)
                    let mn = 1e9;
                    let mx = -1e9;
                    const [fx, fy] = rects[0];
                    for (let Y = 0; Y < h; Y++)
                        for (let X = 0; X < w; X++) {
                            const i = at(fx, fy, X, Y);
                            if (op(i)) {
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
                }
                const moda = (fx, fy, x0, x1, y0, y1, ok) => {
                    const n = new Map();
                    for (let Y = y0; Y <= y1; Y++)
                        for (let X = x0; X <= x1; X++) {
                            const i = at(fx, fy, X, Y);
                            if (d[i + 3] > 200 && ok(i)) {
                                const k = `${d[i]},${d[i + 1]},${d[i + 2]}`;
                                n.set(k, (n.get(k) ?? 0) + 1);
                            }
                        }
                    return [...n.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
                };
                const pos = [];
                rects.forEach(([fx, fy], k) => {
                    const P = (X, Y, cor) => d.set([...cor, 255], at(fx, fy, X, Y));
                    // onde fica a cara (cx = entre os olhos, o = linha dos olhos) e o tamanho da mancha
                    let cx;
                    let o;
                    let mancha;
                    if (v.id === '143') {
                        // o topo da cabeça (1ª linha preta no meio do quadro): no quadro 0 a cara fica 9 linhas abaixo; nos
                        // outros (braços pra cima, bocejando), 3
                        let t = 0;
                        achou: for (let Y = 0; Y < h; Y++)
                            for (let X = 10; X <= 22; X++) {
                                const i = at(fx, fy, X, Y);
                                if (op(i) && orig[i] + orig[i + 1] + orig[i + 2] < 30) {
                                    t = Y;
                                    break achou;
                                }
                            }
                        o = k === 0 ? t + 9 : t + 3;
                        cx = 15.5;
                        mancha = k === 0 ? [11, 20, o - 1, o + 3] : [12, 19, o - 1, o + 6];
                    } else if (v.id === '95') {
                        // os brancos dos olhos do Onix
                        let x0 = 1e9;
                        let x1 = -1;
                        let y0 = 1e9;
                        let y1 = -1;
                        for (let Y = 0; Y < h; Y++)
                            for (let X = 0; X < w; X++) {
                                const i = at(fx, fy, X, Y);
                                if (op(i) && orig[i] > 225 && orig[i + 1] > 225 && orig[i + 2] > 225) {
                                    x0 = Math.min(x0, X);
                                    x1 = Math.max(x1, X);
                                    y0 = Math.min(y0, Y);
                                    y1 = Math.max(y1, Y);
                                }
                            }
                        cx = (x0 + x1) / 2;
                        o = Math.round((y0 + y1) / 2);
                        mancha = [Math.round(cx - 6), Math.round(cx + 6), o - 2, o + 5];
                    }
                    const [mx0, mx1, my0, my1] = mancha;
                    // a cor da mancha: a mais comum ali que não é contorno nem boca (a cara do Snorlax)
                    const cor = v.roxo && v.id === '143' ? PAL[4] : moda(fx, fy, mx0 - 2, mx1 + 2, my0, my1, (i) => lum(d, i) > 90 && !(d[i] > 190 && d[i + 1] < 110));
                    for (let Y = my0; Y <= my1; Y++) for (let X = mx0; X <= mx1; X++) if (d[at(fx, fy, X, Y) + 3] > 200) P(X, Y, cor);
                    const e = Math.round(cx - 2.5);
                    P(e, o, PAL[0]);
                    P(e + 5, o, PAL[0]);
                    for (let X = e - 1; X <= e + 4; X++) P(X, o + 2, PAL[0]);
                    for (let X = e + 4; X <= e + 6; X++) P(X, o + 3, PAL[0]);
                    pos.push([Math.round(cx * 10) / 10, o]);
                });
                x.putImageData(D, 0, 0);
                const blob = await c.convertToBlob({ type: 'image/png' });
                const buf = new Uint8Array(await blob.arrayBuffer());
                let s = '';
                for (const q of buf) s += String.fromCharCode(q);
                return { png: btoa(s), pos };
            },
            { png, v, rects: A.rects[0], w: A.w, h: A.h },
        );
        writeFileSync(join(AQUI, `img/${v.saida}.png`), Buffer.from(r.png, 'base64'));
        console.log(v.saida, 'cara (centro, linha dos olhos) por quadro do Idle de frente:', JSON.stringify(r.pos));
    }
    await b.close();
})();
