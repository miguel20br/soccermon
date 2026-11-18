// Legendas (PNG transparente 1080x1920) e o fundo de marca do trailer v2, a partir do ../cartelas.html da v1.
//   node trailer/curtas/ut-trailer/v2/cartelas.mjs <pasta-da-midia>
import { pathToFileURL } from 'node:url';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [dir] = process.argv.slice(2);
const html = pathToFileURL(new URL('../cartelas.html', import.meta.url).pathname).href;
// uma manchete por vez, 2 a 4 palavras (roteiro-v2.md)
const LEGENDAS = {
    'leg-pacote': 'Seu primeiro <b>pacote</b>',
    'leg-quimica': 'Química entre <b>parceiros</b>',
};
const pecas = [
    ...Object.entries(LEGENDAS).map(([f, t]) => [f, `c=legenda&y=46&t=${encodeURIComponent(t)}`, true]),
    ['fundo', 'c=fundo'],
];
const browser = await chromium.launch({ headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
for (const [f, qs, transp] of pecas) {
    await page.goto(`${html}?${qs}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${dir}/${f}.png`, omitBackground: !!transp });
}
await browser.close();
console.log(`${pecas.length} cartelas em ${dir}`);
