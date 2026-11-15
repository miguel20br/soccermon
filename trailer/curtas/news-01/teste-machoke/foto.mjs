// Foto parada da dupla Raichu e Machoke (News #1, 15/11), sem render de vídeo: abre a cena montada (montar.mjs) num
// Chromium headless e tira o print da bancada com o Machoke de frente e em 3/4, em cada cor de terno (uma coluna por
// cor). Embaixo, a tira com os 8 quadros do Idle do Machoke vestido (frente e 3/4) em zoom 2x (26 px por pixel).
//   node trailer/curtas/news-01/teste-machoke/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-machoke/foto.mjs <png>
import { createRequire } from 'node:module';
import { ANIM, CORES, DIRS } from './terno.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [SAIDA] = process.argv.slice(2);
const R = new URL('../render/teste-machoke/', import.meta.url).pathname;
const cores = Object.keys(CORES);

const CORTE = { x: 0, y: 360, width: 1080, height: 890 }; // do telão às tarjas
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const fotos = {};
for (const cor of cores)
  for (const dir of DIRS) {
    await page.goto(`file://${R}index.html?cor=${cor}&dir=${dir}`);
    await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await page.evaluate(() => { window.__timelines.root.seek(0.5, false); }); // sem as chaves o evaluate tenta serializar a timeline e trava
    await page.waitForTimeout(300);
    fotos[`${cor}/${dir}`] = await page.screenshot({ clip: CORTE });
  }
await browser.close();

const txt = (t, w, h, tam, cor = '#ffcb05') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h - 16}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="${cor}" text-anchor="middle">${t}</text></svg>`);
const NOME = { azul: 'CINZA-AZULADO', grafite: 'GRAFITE' };
const E = 26, GAP = 24, CROP = [3, 1, 26, 28]; // col, lin, larg, alt do quadro que entra na tira
const TW = CROP[2] * E, TH = CROP[3] * E;
const W = 4 * TW + 5 * GAP;
const camadas = [];
let y = 0;
// em cima, a dupla de frente; no meio, o Machoke em 3/4 (uma coluna por cor)
const x0 = (W - (2 * CORTE.width + 40)) / 2;
for (const [k, cor] of cores.entries()) camadas.push({ input: txt(`TERNO ${NOME[cor]}`, CORTE.width, 80, 54), left: x0 + k * (CORTE.width + 40), top: y });
y += 80;
for (const [dir, rot] of [[0, 'de frente'], [7, 'Machoke em 3/4']]) {
  for (const [k, cor] of cores.entries()) camadas.push({ input: fotos[`${cor}/${dir}`], left: x0 + k * (CORTE.width + 40), top: y });
  camadas.push({ input: txt(rot, W, 50, 30, '#c3c8d8'), left: 0, top: y + CORTE.height });
  y += CORTE.height + 60;
}
// embaixo, a tira: por cor, os 4 quadros do Idle de frente e os 4 em 3/4
for (const cor of cores)
  for (const dir of DIRS) {
    camadas.push({ input: txt(`${NOME[cor]} · Idle ${dir === 0 ? 'de frente' : 'em 3/4'} · quadros 0 a 3 (0 parado 40 ticks; 1–3 a flexão, 4 ticks cada)`, W, 64, 34), left: 0, top: y });
    y += 70;
    for (let q = 0; q < 4; q++) {
      const [fx, fy] = ANIM.rects[dir][q];
      const img = await sharp(`${R}midia/sp/67-${cor}.png`).extract({ left: fx + CROP[0], top: fy + CROP[1], width: CROP[2], height: CROP[3] }).resize(TW, TH, { kernel: 'nearest' }).png().toBuffer();
      const x = GAP + q * (TW + GAP);
      camadas.push({ input: await sharp({ create: { width: TW, height: TH, channels: 4, background: '#5a1c26' } }).png().toBuffer(), left: x, top: y });
      camadas.push({ input: img, left: x, top: y });
    }
    y += TH + 40;
  }
await sharp({ create: { width: W, height: y, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
