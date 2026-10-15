// Renderiza SVGs desta pasta pelo servidor de dev (fontes em /fonts carregam). Uso: node render-svg.mjs a.svg b.svg
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
for (const f of process.argv.slice(2)) {
    await p.goto(`http://localhost:8080/trailer/arte/logo/${f}`, { waitUntil: 'networkidle0', timeout: 120000 });
    const [w, h] = await p.evaluate(() => { const v = document.documentElement.viewBox.baseVal; return [v.width, v.height]; });
    await p.setViewport({ width: Math.round(w), height: Math.round(h) });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `renders/${f.replace('.svg', '.png')}`, omitBackground: false });
    console.log('ok', f);
}
await b.close();
