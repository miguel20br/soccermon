// Renderiza os SVG do cartas.py em PNG (Chromium headless, file://). Uso: node render.mjs  (lê saida/pedidos.json)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = join(dirname(fileURLToPath(import.meta.url)), 'saida');
const puppeteer = createRequire(join(aqui, '../../../../../package.json'))('puppeteer-core');
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
for (const [svg, png, w, h] of JSON.parse(readFileSync(join(aqui, 'pedidos.json'), 'utf8'))) {
    await p.setViewport({ width: w, height: h });
    const src = readFileSync(join(aqui, svg), 'utf8').replace('<svg ', `<svg width="${w}" height="${h}" `);
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${src}`);
    await p.screenshot({ path: join(aqui, png), omitBackground: true });
}
await b.close();
console.log('ok render');
