// Tira o PNG de cada quadro do animatic (quadros.html, 1080x1920) headless: node trailer/baby-b/fotografar.mjs <pasta>
import puppeteer from 'puppeteer-core';
const out = process.argv[2];
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
p.on('pageerror', (e) => console.log('[pg]', e.message));
p.on('requestfailed', (r) => console.log('[falhou]', r.url()));
await p.goto(new URL('quadros.html', import.meta.url).href, { waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);
for (const el of await p.$$('section.q')) {
  const id = await el.evaluate((e) => e.id);
  await el.screenshot({ path: `${out}/${id}.png` });
}
await b.close();
console.log('ok');
