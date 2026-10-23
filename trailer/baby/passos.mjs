// Explora telas do jogo headless: node trailer/baby/passos.mjs <url> <pasta> "clique:Texto" "espera:ms" "print:nome" "sel:.seletor:nome" ...
import puppeteer from 'puppeteer-core';
const [url, out, ...passos] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'], env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' } });
const p = await b.newPage();
await p.setViewport({ width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 900), deviceScaleFactor: Number(process.env.DSF ?? 1) });
p.on('pageerror', (e) => console.log('[pg]', e.message));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await p.goto(url, { waitUntil: 'networkidle0', timeout: 300000 });
await wait(2500);
for (const s of passos) {
  const [k, ...r] = s.split(':'); const v = r.join(':');
  if (k === 'clique') console.log('clique', v, await p.evaluate((t) => { const el = [...document.querySelectorAll('button,a,[role=button]')].find((e) => e.innerText.trim().startsWith(t) && !e.disabled && e.getBoundingClientRect().width > 0); el?.click(); return !!el; }, v));
  else if (k === 'css') await p.addStyleTag({ content: v });
  else if (k === 'js') console.log('js', await p.evaluate(v));
  else if (k === 'espera') await wait(Number(v));
  else if (k === 'print') await p.screenshot({ path: `${out}/${v}.png` });
  else if (k === 'botoes') console.log(await p.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 40)).join(' | ')));
  else if (k === 'sel') { const [sel, nome, pad = '0'] = v.split('|'); const el = await p.$(sel); if (!el) { console.log('sem', sel); continue; } const bb = await el.boundingBox(); const q = Number(pad);
    await p.screenshot({ path: `${out}/${nome}.png`, clip: { x: bb.x - q, y: bb.y - q, width: bb.width + 2 * q, height: bb.height + 2 * q }, omitBackground: true }); console.log('sel', nome, Math.round(bb.width), Math.round(bb.height)); }
}
await b.close();
