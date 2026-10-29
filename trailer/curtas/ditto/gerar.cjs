// EP 3 (28/10/2026): as folhas do Ditto disfarçado, tiradas por código das folhas do jogo (img/):
//   143-ditto.png  o Snorlax roxo com a cara do Ditto (tentativas 1 e 2)
//   143-cara.png   o Snorlax perfeito, nas cores dele, com a cara do Ditto (a cara volta sozinha; o estádio)
//   95-ditto.png   o Onix roxo com a cara do Ditto (tentativa 2)
//   143-dorme.png  o Snorlax roxo com a cara do Ditto de olhos fechados (a gag do fim: ele copia o Snorlax dormindo)
//   95-buraco.png  (v3) o Onix roxo amolecendo e abrindo um buraco de gelatina no gomo de baixo, NB quadros a partir
//                  do quadro 0 do Idle: o pé espalha pros lados, a abertura cresce com a borda mole (contorno, lábio
//                  claro embaixo, parede escura em cima) e três fios de gelatina escorrem da borda de cima
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
    { saida: '143-dorme', id: '143', roxo: true, dorme: true },
];
const NB = 12;

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
                    if (v.dorme) {
                        // olhos fechados: risquinho de 2 px no lugar do ponto
                        P(e - 1, o, PAL[0]);
                        P(e + 6, o, PAL[0]);
                    }
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
    // ---------- o buraco do Onix (v3): a gelatina abre de verdade, nada desenhado por cima ----------
    const O = window.SPR['95'].anims.Idle;
    const png = readFileSync(join(AQUI, 'img/95-ditto.png')).toString('base64');
    const r = await p.evaluate(
        async ({ png, NB, w, h, f0 }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${png}`;
            await img.decode();
            const c0 = new OffscreenCanvas(w, h);
            const x0 = c0.getContext('2d');
            x0.drawImage(img, -f0[0], -f0[1]);
            const S = x0.getImageData(0, 0, w, h).data;
            const c = new OffscreenCanvas(w * NB, h);
            const x = c.getContext('2d');
            const D = x.createImageData(w * NB, h);
            const d = D.data;
            const PAL = [[0, 0, 0], [135, 63, 135], [175, 119, 175], [207, 159, 199], [223, 175, 215]];
            const CX = 49; // meio do gomo de baixo
            const PE = 57; // linha do pé
            const at = (X, Y) => (Y * NB * w + k0 * w + X) * 4;
            let k0 = 0;
            const put = (X, Y, cor) => d.set([...cor, 255], at(X, Y));
            for (let k = 0; k < NB; k++) {
                k0 = k;
                // 0–3: os gomos de baixo derretem numa bola de gelatina; 4–(NB-1): o buraco abre no meio dela
                const mole = Math.min(1, k / 3);
                const ab = k < 4 ? 0 : ((k - 3) / (NB - 4)) ** 0.75;
                for (let Y = 0; Y < h; Y++)
                    for (let X = 0; X < w; X++) {
                        const i = (Y * w + X) * 4;
                        if (S[i + 3] > 200) put(X, Y, [S[i], S[i + 1], S[i + 2]]);
                    }
                if (mole <= 0) continue;
                // a bola de gelatina: larga (até 14 px de raio), assentada no pé, borda ondulando
                const bx = 7 + 7 * mole;
                const by = 7 + 2.5 * mole;
                const cy = PE - by;
                const onda = (th, a1, a2) => 1 + a1 * Math.sin(3 * th + k * 1.3) + a2 * Math.sin(5 * th - k * 0.9);
                const ry = 4.7 * ab;
                const rx = 5.8 * ab;
                const hy = cy + 0.5; // o buraco, no meio da bola
                for (let Y = Math.floor(cy - by - 1); Y <= PE; Y++)
                    for (let X = Math.floor(CX - bx - 2); X <= CX + bx + 2; X++) {
                        const u = (X + 0.5 - CX) / bx;
                        const v = (Y + 0.5 - cy) / by;
                        const q = Math.sqrt(u * u + v * v) / onda(Math.atan2(v, u), 0.05, 0.03);
                        if (q > 1) continue;
                        const borda = (1 - q) * Math.min(bx, by);
                        let cor;
                        if (borda < 1) cor = PAL[0];
                        else {
                            const l = -0.45 * u - 0.75 * v + (1 - q) * 0.5;
                            cor = l > 0.55 ? PAL[4] : l > 0.1 ? PAL[3] : l > -0.45 ? PAL[2] : PAL[1];
                        }
                        // o buraco: contorno escuro, parede de cima na sombra, lábio claro embaixo
                        if (ab > 0) {
                            const dx = X + 0.5 - CX;
                            const dy = Y + 0.5 - hy;
                            const wob = onda(Math.atan2(dy, dx), 0.1, 0.05);
                            const qh = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2) / wob;
                            const px = (qh - 1) * Math.min(rx, ry) * wob;
                            if (qh < 1) {
                                d[at(X, Y) + 3] = 0;
                                continue;
                            }
                            if (px < 1) cor = PAL[0];
                            else if (px < 2.6) cor = dy < -0.5 ? PAL[1] : dy < 2 ? PAL[2] : PAL[4];
                        }
                        put(X, Y, cor);
                    }
                // fios de gelatina pendurados na borda de cima do buraco, crescendo
                if (ab > 0)
                    for (const [ox, L] of [[-3, 3.5], [1, 5], [4, 2.5]]) {
                        const len = Math.round(L * ab);
                        const X = Math.round(CX + ox);
                        let top = -1;
                        for (let Y = Math.floor(hy); Y > hy - 12; Y--)
                            if (d[at(X, Y) + 3] > 200) {
                                top = Y;
                                break;
                            }
                        if (top < 0) continue;
                        for (let s = 1; s <= len; s++) {
                            put(X, top + s, s === len ? PAL[0] : PAL[2]);
                            if (s < len - 1) put(X + 1, top + s, PAL[3]);
                        }
                    }
            }
            x.putImageData(D, 0, 0);
            const blob = await c.convertToBlob({ type: 'image/png' });
            const buf = new Uint8Array(await blob.arrayBuffer());
            let s = '';
            for (const q of buf) s += String.fromCharCode(q);
            return btoa(s);
        },
        { png, NB, w: O.w, h: O.h, f0: O.rects[0][0] },
    );
    writeFileSync(join(AQUI, 'img/95-buraco.png'), Buffer.from(r, 'base64'));
    console.log('95-buraco', NB, 'quadros de', O.w, 'x', O.h);
    await b.close();
})();
