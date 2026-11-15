// Grade dos candidatos a parceiro do Raichu (News #1, 15/11), sem render de vídeo: abre a cena montada (montar.mjs) num
// Chromium headless uma vez por candidato (?p=<id>), tira o print da bancada e põe embaixo o retrato PMD "happy".
//   node trailer/curtas/news-01/teste-parceiros/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-parceiros/foto.mjs <png>
import { createRequire } from 'node:module';
import { CANDIDATOS } from './montar.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [SAIDA] = process.argv.slice(2);
const R = new URL('../render/teste-parceiros/', import.meta.url).pathname;
const ids = Object.keys(CANDIDATOS);

const CORTE = { x: 0, y: 360, width: 1080, height: 890 }; // do telão às tarjas
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const fotos = [];
for (const id of ids) {
  await page.goto(`file://${R}index.html?p=${id}`);
  await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.evaluate(() => { window.__timelines.root.seek(0.5, false); }); // sem as chaves o evaluate tenta serializar a timeline e trava
  await page.waitForTimeout(300);
  fotos.push(await page.screenshot({ clip: CORTE }));
}
await browser.close();

const txt = (t, w, h, tam, cor) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h - 16}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="${cor}" text-anchor="middle">${t}</text></svg>`);
const COL = 2, GAP = 40, PW = CORTE.width, RET = 240;
const PH = 80 + CORTE.height + 20 + RET + 50;
const camadas = [];
for (const [k, id] of ids.entries()) {
  const x = (k % COL) * (PW + GAP), y = Math.floor(k / COL) * (PH + GAP);
  camadas.push({ input: txt(`RAICHU + ${CANDIDATOS[id].nome}`, PW, 80, 54, '#ffcb05'), left: x, top: y });
  camadas.push({ input: fotos[k], left: x, top: y + 80 });
  const ry = y + 80 + CORTE.height + 20;
  camadas.push({ input: await sharp({ create: { width: RET + 20, height: RET + 20, channels: 4, background: '#f8f8f0' } }).png().toBuffer(), left: x + (PW - RET) / 2 - 10, top: ry - 10 });
  camadas.push({ input: await sharp(new URL(`../render/teste-parceiros/midia/${id}-happy.png`, import.meta.url).pathname).resize(RET, RET, { kernel: 'nearest' }).png().toBuffer(), left: x + (PW - RET) / 2, top: ry });
  camadas.push({ input: txt(`${CANDIDATOS[id].nome} · happy`, PW, 50, 30, '#c3c8d8'), left: x, top: ry + RET + 10 });
}
const linhas = Math.ceil(ids.length / COL);
await sharp({ create: { width: COL * PW + (COL - 1) * GAP, height: linhas * PH + (linhas - 1) * GAP, channels: 4, background: '#0e1430' } })
  .composite(camadas).png().toFile(SAIDA);
console.log(`ok: ${SAIDA}`);
