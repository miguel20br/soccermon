// Peças desenhadas do trailer v4: as manchetes (PNG só do texto, transparente, 3x) e os quadros do fecho (fecho4.html).
//   node trailer/curtas/ut-trailer/v4/cartelas4.mjs <pasta-da-midia-v4>
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [dir] = process.argv.slice(2);
const url = (f) => pathToFileURL(new URL(f, import.meta.url).pathname).href;
// os textos do roteiro-v4.md, um por slam (a palavra-chave em amarelo)
export const LEGENDAS = {
    classico: 'No Clássico, <b>acaba.</b>',
    ultimate: 'No Ultimate, <b>é seu.</b>',
    pacotes: 'Abra <b>pacotes</b>',
    rasgue: '<b>Rasgue</b>',
    craque: 'Escolha seu <b>craque</b>',
    quimica: '<b>Química</b>',
    dificuldade: 'Escolha a <b>dificuldade</b>',
    batalhas: 'Batalhas de <b>treinador</b>',
    ginasios: '8 <b>ginásios</b>',
    metas: '<b>Metas</b>',
    passe: 'Passe da <b>temporada</b>',
    eventos: '<b>Eventos</b> toda semana',
    shiny: '<b>Shiny.</b>',
    icone: '<b>Ícone.</b>',
    evento: '<b>Evento.</b>',
    time: 'Monte seu <b>time</b>',
    mais: 'E vai ter <b>mais</b>',
    capa: 'Time Ultimate · <b>27/11</b>',
};
const browser = await chromium.launch({ headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
mkdirSync(`${dir}/leg`, { recursive: true });
for (const [f, t] of Object.entries(LEGENDAS)) {
    await page.goto(`${url('cartelas4.html')}?t=${encodeURIComponent(t)}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    await page.locator('.leg').screenshot({ path: `${dir}/leg/${f}.png`, omitBackground: true });
}
// o fecho: 84 quadros (27,2 a 30,0 s)
mkdirSync(`${dir}/fecho`, { recursive: true });
await page.goto(url('fecho4.html'));
for (let i = 0; i < 84; i++) {
    await page.evaluate((t) => window.quadro(t), (i * 1000) / 30);
    await page.screenshot({ path: `${dir}/fecho/${String(i).padStart(4, '0')}.png` });
}
await browser.close();
console.log(`${Object.keys(LEGENDAS).length} manchetes e 84 quadros do fecho em ${dir}`);
