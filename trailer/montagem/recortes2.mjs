/**
 * Mais recortes pro trailer (montagem rápida dos menus): edições de carta, campeão, caminho do título, elenco,
 * estatísticas, sinergias, chaveamento e substituição. Precisa do npm run dev.  → midia/m-*.png
 */
import puppeteer from 'puppeteer-core';

const OUT = new URL('midia/', import.meta.url).pathname;
const b = await puppeteer.launch({ executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'], protocolTimeout: 600000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = (p, t) =>
    p.evaluate((t) => {
        const el = [...document.querySelectorAll('button')].find((e) => e.textContent.trim().startsWith(t) && !e.disabled);
        el?.click();
        return !!el;
    }, t);
const recorte = async (p, sel, nome, pad = 8, ate = null) => {
    const el = await p.$(sel);
    if (!el) return console.log('não achei', sel);
    await el.scrollIntoView();
    await wait(300);
    // clip em coordenadas do documento (boundingBox é da janela; a página rolou)
    const sy = await p.evaluate(() => window.scrollY);
    const bb = await el.boundingBox();
    const r = { ...bb, y: bb.y + sy };
    let h = r.height;
    if (ate) {
        const f = await p.$(ate);
        if (f) { const rf = await f.boundingBox(); h = rf.y + sy + rf.height - r.y; }
    }
    await p.screenshot({ path: `${OUT}m-${nome}.png`, clip: { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: h + 2 * pad }, captureBeyondViewport: true });
    console.log('ok', nome, Math.round(r.width), Math.round(h));
};
const nova = async (w = 1280, h = 720) => {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 3 });
    return p;
};
const semAnim = (p) => p.addStyleTag({ content: '*{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}' });

// edições de carta (galeria de dev)
{
    const p = await nova();
    await p.goto('http://localhost:8080/?cards=1', { waitUntil: 'networkidle0', timeout: 300000 });
    await wait(1500);
    await recorte(p, '.cg-v06 .cg-row', 'metais', 10);
    for (const ed of ['Shiny', 'Destaque', 'Ícone', 'Evento']) {
        await clickText(p, ed);
        await wait(900);
        await recorte(p, '.cg-stage', `ed-${ed.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()}`, 0);
    }
    await p.close();
}
// campeão (copa jogada inteira pelo atalho de dev)
{
    const p = await nova(1280, 900);
    await p.goto('http://localhost:8080/?demo=campeao', { waitUntil: 'networkidle0', timeout: 300000 });
    for (let i = 0; i < 120; i++) { if (await p.$('.champ')) break; await wait(1000); }
    await wait(2500);
    await semAnim(p);
    await wait(500);
    await recorte(p, '.champ', 'campeao', 0, '.champ-totals');
    await recorte(p, '.champ-path', 'caminho', 10);
    await recorte(p, '.champ-squad', 'elenco', 10);
    await recorte(p, '.st-leaders', 'lideres', 10);
    await p.close();
}
// escalação: chaveamento, sinergias; partida: substituição
{
    const p = await nova();
    await p.goto('http://localhost:8080/?demo=trailer&cena=ditto&seed=trailer315', { waitUntil: 'networkidle0', timeout: 300000 });
    await wait(2000);
    await recorte(p, '.cup-path', 'chave', 8);
    await recorte(p, '.tactics', 'sinergias', 14, '.lineup-grid .side-stack .panel:nth-child(2) .row');
    await recorte(p, '.side-stack > .panel:first-child', 'adversario', 0);
    await clickText(p, 'Jogar');
    for (let i = 0; i < 60; i++) { if (await clickText(p, 'Começar')) break; await wait(1000); }
    await wait(6000);
    await clickText(p, 'Substituir');
    await wait(800);
    await recorte(p, '.sub-panel', 'sub-sai', 6);
    await p.evaluate(() => document.querySelector('.sub-pick')?.click());
    await wait(800);
    await recorte(p, '.sub-panel', 'sub-entra', 6);
    await p.close();
}
await b.close();
console.log('FIM');
