// Confere os SVG do logo final em PNG (Chromium headless). Uso: node render.mjs  (lê pedidos.json; saída em png/)
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(aqui, 'png'), { recursive: true });
const puppeteer = createRequire(join(aqui, '../../../../package.json'))('puppeteer-core');
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
for (const [svg, png, w] of JSON.parse(readFileSync(join(aqui, 'pedidos.json'), 'utf8'))) {
    const src = readFileSync(join(aqui, svg), 'utf8');
    const [, , vw, vh] = src.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    const h = Math.round((w * vh) / vw);
    await p.setViewport({ width: w, height: h });
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${src.replace('<svg ', `<svg width="${w}" height="${h}" `)}`);
    await p.screenshot({ path: join(aqui, png), omitBackground: true });
}
await b.close();
console.log('ok render');
