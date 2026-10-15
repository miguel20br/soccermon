/**
 * Recortes dos menus pro trailer: cada componente sozinho (print do elemento, 3x), pra mostrar com corte seco
 * sobre um fundo limpo, sem a tela inteira vazando. Precisa do npm run dev.
 *   node trailer/montagem/recortes.mjs  → midia/r-*.png
 */
import puppeteer from 'puppeteer-core';

const OUT = new URL('midia/', import.meta.url).pathname;
const b = await puppeteer.launch({ executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = (p, t) =>
    p.evaluate((t) => {
        const el = [...document.querySelectorAll('button')].find((e) => e.textContent.trim().startsWith(t) && !e.disabled);
        el?.click();
        return !!el;
    }, t);
const recorte = async (p, sel, nome, pad = 0) => {
    const el = await p.$(sel);
    if (!el) return console.log('não achei', sel);
    const r = await el.boundingBox();
    await p.screenshot({ path: `${OUT}r-${nome}.png`, clip: { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad }, omitBackground: true });
    console.log('ok', nome, Math.round(r.width), Math.round(r.height));
};
const nova = async () => {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 3 });
    // sem animação de entrada atrapalhando o print
    p.on('load', () => p.addStyleTag({ content: '*{animation-duration:0s!important;transition:none!important}' }).catch(() => {}));
    return p;
};

// draft: formação → 3 candidatos a capitão → uma carta → a carta aberta
{
    const p = await nova();
    await p.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 300000 });
    await wait(1500);
    await clickText(p, 'Nova copa');
    await wait(600);
    await clickText(p, 'Sim, começar outra');
    await wait(1200);
    await recorte(p, '.formation-picker', 'formacoes', 8);
    await p.evaluate(() => document.querySelector('.formation-option')?.click());
    await wait(2000);
    await recorte(p, '.options', 'capitaes', 8);
    await recorte(p, '.option', 'carta', 6);
    await p.evaluate(() => document.querySelector('.option button, .option [role=button], .option .card')?.click());
    await wait(1200);
    await recorte(p, '.card-modal', 'carta-aberta', 0);
    await p.close();
}
// técnico: escalação (quadra), troca de formação, tática
{
    const p = await nova();
    await p.goto('http://localhost:8080/?demo=trailer&cena=ditto&seed=trailer315', { waitUntil: 'networkidle0', timeout: 300000 });
    await wait(2000);
    await recorte(p, '.formation-board', 'quadra-a', 6);
    await recorte(p, '.tactics', 'tatica-a', 10);
    await clickText(p, 'Quadrado');
    await wait(800);
    await recorte(p, '.formation-board', 'quadra-b', 6);
    await clickText(p, 'Ofensivo');
    await wait(600);
    await recorte(p, '.tactics', 'tatica-b', 10);
    await p.close();
}
await b.close();
console.log('FIM');
