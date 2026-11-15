// Foto parada da gola do Raichu (News #1, 15/11), os dois no marinho: uma coluna por altura (a atual e a gola 1, 2 e 3
// linhas mais baixa, o `desce` do gravata.mjs; as A/B/C do GOLA o Miguel recusou: "a gola tá muito alta"), com a
// bancada de frente e o peito do Raichu em zoom 2x (26 px por pixel), de frente e em 3/4.
//   node trailer/curtas/news-01/teste-machoke/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-machoke/gola.mjs <png>
import { createRequire } from 'node:module';
import { recorte } from '../teste-gravata/gravata.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [SAIDA] = process.argv.slice(2);
const R = new URL('../render/teste-machoke/', import.meta.url).pathname;
const OPCOES = [
  ['marinho', 'ATUAL'],
  ['marinho-d1', 'GOLA −1'],
  ['marinho-d2', 'GOLA −2'],
  ['marinho-d3', 'GOLA −3'],
];

const CORTE = { x: 0, y: 360, width: 1080, height: 890 }; // do telão às tarjas
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const fotos = {};
for (const [rcor] of OPCOES) {
  await page.goto(`file://${R}index.html?cor=marinho&rcor=${rcor}&dir=0`);
  await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.evaluate(() => { window.__timelines.root.seek(0.5, false); });
  await page.waitForTimeout(300);
  fotos[rcor] = await page.screenshot({ clip: CORTE });
}
await browser.close();

const txt = (t, w, h, tam, cor = '#ffcb05') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h - 16}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="${cor}" text-anchor="middle">${t}</text></svg>`);
const E = 26, GAP = 24, PEITO = [10, 14, 20, 14]; // do olho ao tampo da mesa, no quadro 0 (frente e 3/4)
const peito = async (folha, dir) => {
  const [cw, ch] = [PEITO[2] * E, PEITO[3] * E];
  const fundo = await sharp({ create: { width: cw, height: ch, channels: 4, background: '#5a1c26' } }).png().toBuffer();
  return sharp(fundo).composite([{ input: await recorte(26, folha, dir, 0, E, PEITO) }]).png().toBuffer();
};
const ZW = 2 * PEITO[2] * E + GAP, ZH = PEITO[3] * E;
const CW = Math.max(CORTE.width, ZW), M = 40;
const W = OPCOES.length * CW + (OPCOES.length + 1) * M;
const camadas = [];
let y = 0;
for (const [k, [rcor, titulo]] of OPCOES.entries()) {
  const x0 = M + k * (CW + M);
  y = 0;
  camadas.push({ input: txt(titulo, CW, 90, 46), left: x0, top: y });
  y += 100;
  camadas.push({ input: txt('bancada de frente', CW, 50, 28, '#c3c8d8'), left: x0, top: y });
  y += 56;
  camadas.push({ input: fotos[rcor], left: x0 + (CW - CORTE.width) / 2, top: y });
  y += CORTE.height + 30;
  camadas.push({ input: txt('o peito do Raichu, 2x: de frente e em 3/4', CW, 50, 28, '#c3c8d8'), left: x0, top: y });
  y += 56;
  const xr = x0 + (CW - ZW) / 2;
  for (const dir of [0, 1]) camadas.push({ input: await peito(`${R}midia/sp/26-${rcor}.png`, dir), left: xr + dir * (PEITO[2] * E + GAP), top: y });
  y += ZH + 50;
}
await sharp({ create: { width: W, height: y, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
