// A quadra em perspectiva (o plano 3D do animatic) vira PNG chapado: com o plano 3D na cena, o Chrome do render deixava
// de pintar o que estava por cima dele (sprites, o Blue, a placa e a bola sumiam, embora estivessem lá). Um PNG por
// combinação usada (quadra, y do topo, inclinação), com fundo transparente, em midia/plano-<quadra>-<topo>-<rx>.png.
//   node trailer/video-0916/planos.mjs   (chamado pelo preparar.mjs)
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

export const PLANOS = [
    [0, 1120, 66],
    [0, 1180, 70],
    [0, 900, 62],
    [0, 640, 58],
    [1, 640, 58],
    [9, 640, 58],
    [9, 520, 62],
];
const DIR = new URL('.', import.meta.url).pathname;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
for (const [q, top, rx] of PLANOS) {
    writeFileSync(
        `${DIR}midia/plano.html`,
        `<html><body style="margin:0;background:transparent"><div id="c" style="position:relative;width:1080px;height:${1920 - top}px;overflow:hidden">` +
            `<div style="position:absolute;left:-660px;top:0;width:2400px;height:4000px;transform-origin:50% 0;transform:perspective(1100px) rotateX(${rx}deg);` +
            `background:url(quadra-${q}-v.png) center top/100% 100% no-repeat;image-rendering:pixelated"></div></div></body></html>`,
    );
    await p.goto(`file://${DIR}midia/plano.html`, { waitUntil: 'load' });
    const el = await p.$('#c');
    await el.screenshot({ path: `${DIR}midia/plano-${q}-${top}-${rx}.png`, omitBackground: true });
}
await b.close();
console.log('planos prontos:', PLANOS.length);
