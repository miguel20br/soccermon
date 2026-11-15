// Foto parada do teste da gravata (News #1, 15/11), sem render de vídeo: abre a cena montada (montar.mjs) num Chromium
// headless, para a linha do tempo em 2 momentos (o Raichu falando de frente e o Golduck escutando em 3/4; o Golduck
// falando de frente e o Raichu em 3/4) e tira o print do estúdio. Embaixo, o zoom 2x do peito (26 px por pixel da folha)
// do Raichu (frente e 3/4) e das 3 variações do Golduck (A terno, B camisa, C só gravata), de frente e em 3/4.
//   node trailer/curtas/news-01/teste-gravata/montar.mjs A && ... B && ... C
//   scripts/pesado.sh node trailer/curtas/news-01/teste-gravata/foto.mjs <png> [variação do alto, padrão C]
import { createRequire } from 'node:module';
import { recorte } from './gravata.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [SAIDA, V = 'C'] = process.argv.slice(2);
const R = new URL('../render/', import.meta.url).pathname;

// 1) o estúdio, nos 2 momentos (o texto da fala já completo)
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`file://${R}teste-gravata-${V}/index.html`);
await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
const CORTE = { x: 0, y: 330, width: 1080, height: 1260 }; // do telão até a caixa de fala
const fotos = [];
for (const k of [0, 1]) {
  await page.evaluate((k) => { const f = window.FALAS[k]; window.__timelines.root.seek(f.fim + 0.6, false); }, k);
  await page.waitForTimeout(300);
  fotos.push(await page.screenshot({ clip: CORTE }));
}
await browser.close();

// 2) o zoom: só o que fica acima da mesa (linha 28 do Raichu, 22 do Golduck), quadro 0 do Idle
const E = 26;
const txt = (t, w, h, tam = 44, cor = '#ffcb05') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h - 14}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="${cor}" text-anchor="middle">${t}</text></svg>`);
const pecas = [
  { nome: 'RAICHU frente', id: 26, f: `${R}teste-gravata-${V}/midia/sp/26.png`, dir: 0, crop: [9, 14, 22, 14] },
  { nome: 'RAICHU 3/4', id: 26, f: `${R}teste-gravata-${V}/midia/sp/26.png`, dir: 1, crop: [10, 14, 22, 14] },
];
for (const [dir, lado] of [[0, 'frente'], [7, '3/4']])
  for (const v of ['A', 'B', 'C'])
    pecas.push({ nome: `${v}  ${lado}`, id: 55, f: `${R}teste-gravata-${v}/midia/sp/55.png`, dir, crop: [1, 7, 26, 15] });
const W = 2 * 1080 + 40;
const COL = 3;
const CW = W / COL;
const camadas = [
  { input: fotos[0], left: 0, top: 0 },
  { input: fotos[1], left: 1080 + 40, top: 0 },
];
let y = CORTE.height + 30;
camadas.push({ input: txt(`no alto: Golduck na variação ${V}, Raichu a 13 px por pixel. Embaixo: zoom 2x (26 px por pixel)`, W, 60, 34, '#c3c8d8'), left: 0, top: y });
y += 70;
// a linha do Raichu (frente e 3/4), depois o Golduck: A, B e C de frente, e A, B e C em 3/4
const linhas = [pecas.slice(0, 2), [pecas[2], pecas[3], pecas[4]], [pecas[5], pecas[6], pecas[7]]];
for (const ln of linhas) {
  let alt = 0;
  for (const [k, p] of ln.entries()) {
    const img = await recorte(p.id, p.f, p.dir, 0, E, p.crop);
    const { width, height } = await sharp(img).metadata();
    const x = Math.round(k * CW + (CW - width) / 2);
    camadas.push({ input: await sharp({ create: { width: width + 16, height: height + 16, channels: 4, background: '#5a1c26' } }).png().toBuffer(), left: x - 8, top: y + 70 - 8 });
    camadas.push({ input: img, left: x, top: y + 70 });
    camadas.push({ input: txt(p.nome, Math.round(CW), 64), left: Math.round(k * CW), top: y });
    alt = Math.max(alt, height + 70 + 40);
  }
  y += alt;
}
await sharp({ create: { width: W, height: y + 20, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
