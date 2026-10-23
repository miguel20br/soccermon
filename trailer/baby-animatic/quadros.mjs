// Tira print de cada quadro (<section class="q" id="...">) de a.html ou c.html: quadros/<pagina>/<id>.png, 1080x1920.
//   node trailer/baby-animatic/quadros.mjs a [c]   (headless; pela fila pesada)
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const DIR = new URL('.', import.meta.url).pathname;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
for (const pg of process.argv.slice(2)) {
    const p = await b.newPage();
    await p.setViewport({ width: 1080, height: 1920 });
    p.on('pageerror', (e) => console.log('[erro]', e.message));
    await p.goto(`file://${DIR}${pg}.html`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.pronto?.());
    mkdirSync(`${DIR}quadros/${pg}`, { recursive: true });
    for (const s of await p.$$('section.q')) {
        const id = await s.evaluate((e) => e.id);
        await s.screenshot({ path: `${DIR}quadros/${pg}/${id}.png` });
    }
    console.log(pg, 'ok');
    await p.close();
}
await b.close();
