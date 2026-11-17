// Tira o PNG 1080x1920 de cada cartela do cartelas.html (headless). Mídia (cartas, clube.png) e saída na mesma pasta.
//   node trailer/curtas/ut-trailer/cartelas.mjs <pasta-da-midia>
import { pathToFileURL } from 'node:url';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [dir] = process.argv.slice(2);
const html = pathToFileURL(new URL('cartelas.html', import.meta.url).pathname).href;
const m = pathToFileURL(dir).href;
export const LEGENDAS = { 'leg-pacote': 'Seu primeiro <b>pacote</b>', 'leg-shiny': 'Shiny · <b>1 em 64</b>' };
const pecas = [
    ...Object.entries(LEGENDAS).map(([f, t]) => [f, `c=legenda&y=46&t=${encodeURIComponent(t)}`, true]),
    ...[1, 2, 3].map((n) => [`metais-${n}`, `c=metais&n=${n}`]),
    ...[1, 2, 3, 4].map((n) => [`edicoes-${n}`, `c=edicoes&n=${n}`]),
    ['clube', 'c=clube'],
    ...[1, 2, 3].map((n) => [`final-${n}`, `c=final&n=${n}`]),
];
const browser = await chromium.launch({ headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
for (const [f, qs, transp] of pecas) {
    await page.goto(`${html}?${qs}&m=${encodeURIComponent(m)}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${dir}/cartela-${f}.png`, omitBackground: !!transp });
}
await browser.close();
console.log(`${pecas.length} cartelas em ${dir}`);
