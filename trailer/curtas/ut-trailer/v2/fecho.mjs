// Fecho do trailer v2: tira o print de cada quadro do fecho.html (30 fps, 1080x1920).
//   node trailer/curtas/ut-trailer/v2/fecho.mjs <pasta> [ms=3530]
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [dir, ms = '3530'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
await page.goto(pathToFileURL(new URL('fecho.html', import.meta.url).pathname).href);
const n = Math.round((Number(ms) / 1000) * 30);
for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.quadro(t), (i * 1000) / 30);
    await page.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png` });
}
await browser.close();
console.log(`${n} quadros em ${dir}`);
