// Foto parada do uniforme da dupla do News #1 (15/11): o Raichu e o Machoke no mesmo pano. Uma coluna por opção
// (OPCOES: o nome da cor de CORES no terno.mjs, que veste os dois): a bancada de frente, a bancada com o Machoke em 3/4
// e os dois troncos lado a lado em zoom 2x (26 px por pixel, o dobro do Raichu na cena).
//   node trailer/curtas/news-01/teste-machoke/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-machoke/uniforme.mjs <png>
import { createRequire } from 'node:module';
import { recorte as recorteRaichu } from '../teste-gravata/gravata.mjs';
import { recorte } from './terno.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [SAIDA] = process.argv.slice(2);
const R = new URL('../render/teste-machoke/', import.meta.url).pathname;
const OPCOES = [
  ['marinho', 'OPÇÃO 1: OS DOIS NO AZUL DO MACHOKE'],
  ['raichu', 'OPÇÃO 2: OS DOIS NO AZUL DO RAICHU'],
];

const CORTE = { x: 0, y: 360, width: 1080, height: 890 }; // do telão às tarjas
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const fotos = {};
for (const [cor] of OPCOES)
  for (const dir of [0, 7]) {
    await page.goto(`file://${R}index.html?cor=${cor}&rcor=${cor}&dir=${dir}`);
    await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await page.evaluate(() => { window.__timelines.root.seek(0.5, false); });
    await page.waitForTimeout(300);
    fotos[`${cor}/${dir}`] = await page.screenshot({ clip: CORTE });
  }
await browser.close();

const txt = (t, w, h, tam, cor = '#ffcb05') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h - 16}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="${cor}" text-anchor="middle">${t}</text></svg>`);
// os troncos (col, lin, larg, alt no quadro 0 de frente), do ombro ao tampo da mesa
const E = 26, GAP = 24, TR = [11, 19, 18, 11], TM = [4, 8, 25, 15];
const tronco = async (buf, [ci, cj, cw, ch]) => {
  const fundo = await sharp({ create: { width: cw * E, height: ch * E, channels: 4, background: '#5a1c26' } }).png().toBuffer();
  const img = await sharp(buf).extract({ left: ci * E, top: cj * E, width: cw * E, height: ch * E }).toBuffer();
  return sharp(fundo).composite([{ input: img }]).png().toBuffer();
};
const ZW = (TR[2] + TM[2]) * E + GAP, ZH = Math.max(TR[3], TM[3]) * E;
const CW = Math.max(CORTE.width, ZW), M = 40;
const W = OPCOES.length * CW + (OPCOES.length + 1) * M;
const camadas = [];
let y = 0;
for (const [k, [cor, titulo]] of OPCOES.entries()) {
  const x0 = M + k * (CW + M);
  y = 0;
  camadas.push({ input: txt(titulo, CW, 90, 46), left: x0, top: y });
  y += 100;
  for (const [dir, rot] of [[0, 'bancada de frente'], [7, 'bancada com o Machoke em 3/4']]) {
    camadas.push({ input: txt(rot, CW, 50, 28, '#c3c8d8'), left: x0, top: y });
    y += 56;
    camadas.push({ input: fotos[`${cor}/${dir}`], left: x0 + (CW - CORTE.width) / 2, top: y });
    y += CORTE.height + 30;
  }
  camadas.push({ input: txt('os troncos lado a lado, 2x', CW, 50, 28, '#c3c8d8'), left: x0, top: y });
  y += 56;
  const xr = x0 + (CW - ZW) / 2;
  const r = await tronco(await recorteRaichu(26, `${R}midia/sp/26-${cor}.png`, 0, 0, E), TR);
  const m = await tronco(await recorte(`${R}midia/sp/67-${cor}.png`, 0, 0, E), TM);
  camadas.push({ input: r, left: xr, top: y + ZH - TR[3] * E }, { input: m, left: xr + TR[2] * E + GAP, top: y + ZH - TM[3] * E });
  y += ZH + 50;
}
await sharp({ create: { width: W, height: y, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
