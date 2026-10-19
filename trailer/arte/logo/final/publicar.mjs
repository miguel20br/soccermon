// Leva o logo final pro site: SVGs em public/assets/ui, PNGs do ícone (192, 512, apple-touch 180), favicon.ico
// (16 à mão + 32 e 48 do ícone pequeno) e o logo/ícone das artes de marketing. Uso:
//   python3 trailer/arte/logo/final/logo.py && node trailer/arte/logo/final/publicar.mjs
// Depois: node docs/marketing/arte/render.mjs (refaz a prévia do link, public/og-image.jpg).
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '../../../..');
const ui = join(raiz, 'public/assets/ui');
const arte = join(raiz, 'docs/marketing/arte/src');

const copias = [
    ['logo-horizontal.svg', join(ui, 'logo.svg')],
    ['logo-icone.svg', join(ui, 'icone.svg')],
    ['logo-icone-pequeno.svg', join(ui, 'favicon.svg')],
    ['logo-simbolo.svg', join(ui, 'simbolo.svg')],
    ['logo-horizontal.svg', join(arte, 'logo.svg')],
    ['logo-icone.svg', join(arte, 'icone.svg')],
];
for (const [de, para] of copias) copyFileSync(join(aqui, de), para);

const puppeteer = createRequire(join(raiz, 'package.json'))('puppeteer-core');
const b = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
});
const p = await b.newPage();
async function png(svg, w, { quadrado = false } = {}) {
    let src = readFileSync(join(aqui, svg), 'utf8');
    // apple-touch: o iOS arredonda sozinho; canto transparente vira preto
    if (quadrado) src = src.replace(/rx="48"/g, 'rx="0"');
    await p.setViewport({ width: w, height: w });
    await p.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${src.replace('<svg ', `<svg width="${w}" height="${w}" `)}`,
    );
    return p.screenshot({ omitBackground: true, type: 'png' });
}
writeFileSync(join(ui, 'icon-192.png'), await png('logo-icone.svg', 192));
writeFileSync(join(ui, 'icon-512.png'), await png('logo-icone.svg', 512));
writeFileSync(join(ui, 'apple-touch-icon.png'), await png('logo-icone.svg', 180, { quadrado: true }));

// .ico com PNG dentro (aceito por todo navegador desde o Vista): cabeçalho + diretório + as imagens
const imgs = [
    [16, await png('logo-icone-16.svg', 16)],
    [32, await png('logo-icone-pequeno.svg', 32)],
    [48, await png('logo-icone-pequeno.svg', 48)],
];
const cab = Buffer.alloc(6 + 16 * imgs.length);
cab.writeUInt16LE(1, 2);
cab.writeUInt16LE(imgs.length, 4);
let off = cab.length;
imgs.forEach(([t, dado], i) => {
    const e = 6 + 16 * i;
    cab.writeUInt8(t, e);
    cab.writeUInt8(t, e + 1);
    cab.writeUInt16LE(1, e + 4);
    cab.writeUInt16LE(32, e + 6);
    cab.writeUInt32LE(dado.length, e + 8);
    cab.writeUInt32LE(off, e + 12);
    off += dado.length;
});
writeFileSync(join(raiz, 'public/favicon.ico'), Buffer.concat([cab, ...imgs.map(([, d]) => d)]));
await b.close();
console.log('ok publicar');
