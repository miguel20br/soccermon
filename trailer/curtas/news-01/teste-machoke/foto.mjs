// Foto parada da dupla Raichu e Machoke (News #1, 15/11), sem render de vídeo: abre a cena montada (montar.mjs) num
// Chromium headless e tira o print da bancada com o Machoke de frente e em 3/4, em cada cor de terno (uma coluna por
// cor). Embaixo de cada bancada, o quadro 0 (parado) e o 1 (a flexão) do Machoke vestido em zoom 2x (26 px por pixel).
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
const NOME = { preto: 'PRETO COM BRILHO NA BORDA', vinho: 'VINHO', caramelo: 'CARAMELO, GRAVATA AZUL' };
const E = 26, GAP = 24, CROP = [3, 1, 26, 28]; // col, lin, larg, alt do quadro ampliado (26 px por pixel: 2x o Raichu)
const TW = CROP[2] * E, TH = CROP[3] * E;
const CW = Math.max(CORTE.width, 2 * TW + GAP), M = 40; // uma coluna por cor
const W = cores.length * CW + (cores.length + 1) * M;
const camadas = [];
const quadro = async (cor, dir, q) => {
  const [fx, fy] = ANIM.rects[dir][q];
  return sharp(`${R}midia/sp/67-${cor}.png`).extract({ left: fx + CROP[0], top: fy + CROP[1], width: CROP[2], height: CROP[3] }).resize(TW, TH, { kernel: 'nearest' }).png().toBuffer();
};
const fundo = await sharp({ create: { width: TW, height: TH, channels: 4, background: '#5a1c26' } }).png().toBuffer();
let y = 0;
for (const [k, cor] of cores.entries()) {
  const x0 = M + k * (CW + M);
  y = 0;
  camadas.push({ input: txt(`TERNO ${NOME[cor]}`, CW, 80, 50), left: x0, top: y });
  y += 80;
  // por direção: a bancada e, embaixo, o quadro 0 (parado) e o 1 (a flexão) ampliados
  for (const [dir, rot] of [[0, 'de frente'], [7, 'em 3/4']]) {
    camadas.push({ input: fotos[`${cor}/${dir}`], left: x0 + (CW - CORTE.width) / 2, top: y });
    y += CORTE.height;
    camadas.push({ input: txt(`bancada ${rot} · embaixo: quadro 0 (parado) e 1 (flexão), 2x`, CW, 50, 28, '#c3c8d8'), left: x0, top: y });
    y += 60;
    for (const q of [0, 1]) {
      const x = x0 + (CW - 2 * TW - GAP) / 2 + q * (TW + GAP);
      camadas.push({ input: fundo, left: x, top: y }, { input: await quadro(cor, dir, q), left: x, top: y });
    }
    y += TH + 50;
  }
}
await sharp({ create: { width: W, height: y, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
