// Renderiza os quadros parados de trailer/arte/quadros.html (título e abertura) em PNG 1920x1080.
// Precisa do npm run dev. Uso: node trailer/arte/render.mjs <pasta de saída> [ids...]
import puppeteer from 'puppeteer-core';
const ids = process.argv.length > 3 ? process.argv.slice(3) : ['titulo1', 'titulo2', 'titulo3', 'abertura1', 'abertura2', 'abertura3'];
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
for (const id of ids) {
  await p.goto(`http://localhost:8080/trailer/arte/quadros.html?q=${id}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: `${process.argv[2]}/${id}.png` });
  console.log(id);
}
await b.close();
