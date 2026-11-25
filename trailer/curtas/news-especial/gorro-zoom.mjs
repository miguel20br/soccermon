// v3: a prova do gorro quadro a quadro: 6 quadros seguidos da animação (cada troca de quadro do Idle) do Raichu na
// bancada e do Meowth na Loja, recortados em volta da cabeça e ampliados 4x (pixel duro), numa folha só.
//   scripts/pesado.sh node trailer/curtas/news-especial/gorro-zoom.mjs <saída.png>
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const OUT = process.argv[2] ?? 'gorro-zoom.png';
const HTML = new URL('./index.html', import.meta.url).pathname;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`file://${HTML}`);
await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
/** O estado do ator `sel` em t: o quadro da folha e a caixa do gorro na tela. */
const em = (sel, t) => page.evaluate(([sel, t]) => {
  window.__timelines.root.seek(t, false);
  const a = document.querySelector(sel);
  const g = a.querySelector('.gorro').getBoundingClientRect();
  return { bp: getComputedStyle(a.querySelector('.spr')).backgroundPosition, g: [g.x, g.y, g.width, g.height] };
}, [sel, t]);
const ATORES = [
  ['Raichu (bancada, f1)', '#cam .ator:has(.spr[style*="26-terno"])', 6.0, 9.6, [-0.2, -0.25, 1.4, 1.9]],
  ['Meowth (Loja, f9)', '#rota-cam .ator', 31.45, 33.4, [-0.15, -0.25, 1.3, 1.8]],
];
const linhas = [];
for (const [nome, sel, de, ate, [fx, fy, fw, fh]] of ATORES) {
  // as trocas de quadro: o 1º instante de cada quadro novo, a partir de uma troca
  const trocas = [];
  let ant = null;
  for (let t = de; t < ate && trocas.length < 6; t = +(t + 1 / 30).toFixed(4)) {
    const s = await em(sel, t);
    if (ant && s.bp !== ant) trocas.push(t);
    ant = s.bp;
  }
  const fotos = [];
  // o recorte fica parado (o do 1º quadro): o gorro e a cabeça se mexem juntos dentro dele
  const { g } = await em(sel, trocas[0]);
  const [x, y, w, h] = [g[0] + fx * g[2], g[1] + fy * g[3], fw * g[2], fh * g[3]].map(Math.round);
  for (const t of trocas) {
    await em(sel, t);
    await page.waitForTimeout(60);
    const png = await page.screenshot({ clip: { x, y, width: w, height: h } });
    fotos.push([t, await sharp(png).resize(w * 4, h * 4, { kernel: 'nearest' }).png().toBuffer(), w * 4, h * 4]);
  }
  linhas.push([nome, fotos]);
  console.log(nome, trocas.join(' '));
}
await browser.close();
const G = 24;
const W = Math.max(...linhas.map(([, f]) => f.reduce((s, x) => s + x[2] + G, G)));
const H = linhas.reduce((s, [, f]) => s + Math.max(...f.map((x) => x[3])) + 120, G);
const camadas = [];
let y = G;
for (const [nome, fotos] of linhas) {
  camadas.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="60"><text x="${G}" y="46" font-family="DejaVu Sans" font-weight="bold" font-size="44" fill="#ffcb05">${nome}: 6 quadros seguidos do Idle, 4x</text></svg>`), left: 0, top: y });
  let x = G;
  for (const [t, img, w, h] of fotos) {
    camadas.push({ input: img, left: x, top: y + 64 });
    camadas.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="40"><text x="12" y="32" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#fff" stroke="#000" stroke-width="5" paint-order="stroke">${t.toFixed(2)} s</text></svg>`), left: x, top: y + 70 });
    x += w + G;
  }
  y += Math.max(...fotos.map((f) => f[3])) + 120;
}
await sharp({ create: { width: W, height: H, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(OUT);
console.log('ok:', OUT);
