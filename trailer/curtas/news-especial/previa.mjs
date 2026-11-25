// Prévia em quadros parados da edição especial Time Ultimate, sem render de vídeo: abre a cena num Chromium headless,
// pausa a linha do tempo em cada instante e monta as folhas com o tempo escrito embaixo de cada quadro.
//   scripts/pesado.sh node trailer/curtas/news-especial/previa.mjs <pasta de saída>
//   → <pasta>/news-especial-v5-previa.png, news-especial-v5-safezones.png e news-especial-v5-capa.png (CAPA_MS no Buffer)
import { createRequire } from 'node:module';
import { BEATS, CARTELAS, FALAS, M } from './linha.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const SAIDA = process.argv[2] ?? '.';
const HTML = new URL('./index.html', import.meta.url).pathname;
const F = Object.fromEntries(FALAS.map((f) => [f.id, f]));
const meio = (f) => +(f.paginas.at(-1).fim + 0.4).toFixed(2); // a fala inteira na caixa
const beat = (n, d = 0.55) => {
  const b = BEATS.find((x) => x.nome === n);
  return [`BEAT · ${n}`, +(b.s + Math.min(d, b.z - b.s - 0.1)).toFixed(2)];
};
/** O quadro da capa (s do vídeo): o gancho com a carta dourada do walkout (o 89 já contado), antes da vinheta. */
export const CAPA_S = 1.97;

const QUADROS = [
  ['gancho pacote', 0.35], ['gancho walkout', 1.5], ['gancho (capa)', CAPA_S], ['vinheta', M.vinheta + 1.95], ['abertura f1 p1', F.f1.paginas[0].fim + 0.3], ['f1 UT no telão', meio(F.f1)],
  ['escalada 1', CARTELAS[0] + 0.6], ['escalada 2', CARTELAS[1] + 0.6], ['escalada 3', CARTELAS[2] + 0.6], ['escalada 4', CARTELAS[3] + 0.6],
  ['PLANTÃO f4 close', M.clube - 0.1], ['f4 VT Clube', meio(F.f4)], ['f5 Machoke', meio(F.f5)], ['f6 Não volta', meio(F.f6)], beat('bChoro', 0.9), beat('bRua', 0.6),
  ['AO VIVO f8', meio(F.f8)], ['f9 clipe', meio(F.f9)], beat('bKarp1', 0.2), beat('bKarp1', 0.8), ['f10 Magikarp', meio(F.f10)], beat('bKarp2', 0.9),
  ['f11 Fichas', M.fichas + 0.3], ['f11 fim', meio(F.f11)], ['LÍDERES f12', M.insig[3]], ['f12 fim', meio(F.f12)], ['VEM AÍ f13 p1', F.f13.paginas[0].fim + 0.3], ['f13 cartas', meio(F.f13)], beat('bNeve', 0.3),
  ['f14 boa noite', meio(F.f14)], ['tela final 0,6', M.final + 0.6], ['tela final 2,2', M.final + 2.2],
];
// as safe zones (1080 x 1920, valores conservadores de TikTok, Reels e Shorts): a faixa de cima (abas e busca), a de
// baixo (legenda, nome e música) e a coluna da direita (curtir, comentar, compartilhar, perfil) da altura dela pra baixo
export const ZONAS = { cima: 120, baixo: 320, direita: 130, direitaDe: 640 };
const SAFE = [
  ['f1 bancada', meio(F.f1)], ['f5 close + quadro', meio(F.f5)], ['Loja f9', meio(F.f9)],
  ['Magikarp f10', meio(F.f10)], ['líderes f12', meio(F.f12)], ['tela final', M.final + 1.5],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
const abre = async (q = '') => {
  await page.goto(`file://${HTML}${q}`);
  await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  // v3: os clipes do jogo carregados antes do 1º seek (sem isso o gancho e a capa saíam no quadro 0 do clipe)
  await page.evaluate(() => Promise.all([...document.querySelectorAll('video')].map((v) => (v.readyState >= 2 ? 0 : new Promise((r) => {
    v.preload = 'auto';
    v.addEventListener('loadeddata', r, { once: true });
    setTimeout(r, 8000);
    v.load();
  })))));
};
const foto = async (t) => {
  await page.evaluate((t) => { window.__timelines.root.seek(t, false); }, t); // as chaves: sem elas o evaluate serializa a timeline
  // os clipes do jogo: fora do HyperFrames ninguém posiciona o <video>; aqui ele vai pro quadro certo do arquivo
  await page.evaluate(async (t) => {
    for (const v of document.querySelectorAll('video')) {
      const { start, duration, mediaStart } = v.dataset;
      const dentro = t >= +start && t < +start + +duration;
      v.style.visibility = dentro ? 'visible' : 'hidden';
      if (!dentro) continue;
      v.currentTime = t - +start + +mediaStart;
      await new Promise((r) => { v.onseeked = r; setTimeout(r, 1500); });
      // v3: e o quadro novo pintado (sem isso a folha saía com o quadro do seek anterior)
      await new Promise((r) => { v.requestVideoFrameCallback?.(() => r()); setTimeout(r, 400); });
    }
  }, t);
  await page.waitForTimeout(120);
  return page.screenshot();
};
const pequena = (b, w = 360) => sharp(b).resize(w, Math.round((w * 16) / 9)).png().toBuffer();

await abre();
const fotos = [];
for (const [rot, t] of QUADROS) fotos.push([`${t.toFixed(2)} s · ${rot}`, await pequena(await foto(t))]);
const safe = [];
for (const [rot, t] of SAFE) safe.push([`${t.toFixed(2)} s · ${rot}`, await foto(t)]);
await abre('?capa=1');
const capa = await foto(CAPA_S);
await browser.close();
if (erros.length) console.log('erros na página:', erros);

const txt = (t, w, tam = 22) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44"><text x="${w / 2}" y="30" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${tam}" fill="#ffcb05" text-anchor="middle">${t.replace(/&/g, '&amp;')}</text></svg>`);
const folha = async (lista, cols, arq, W = 360, H = 640) => {
  const G = 16, R = H + 44;
  const linhas = Math.ceil(lista.length / cols);
  const camadas = lista.flatMap(([rot, img], k) => {
    const x = G + (k % cols) * (W + G);
    const y = G + Math.floor(k / cols) * (R + G);
    return [{ input: img, left: x, top: y }, { input: txt(rot, W), left: x, top: y + H }];
  });
  await sharp({ create: { width: G + cols * (W + G), height: G + linhas * (R + G), channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(arq);
  console.log(`ok: ${arq}`);
};
await folha(fotos, 8, `${SAIDA}/news-especial-v5-previa.png`);

// as safe zones desenhadas por cima de cada quadro (em 1080 x 1920 e reduzido pra 540 x 960)
const Z = ZONAS;
const zonas = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  <g fill="rgb(255 40 40 / 32%)" stroke="#ff2a2a" stroke-width="5" stroke-dasharray="18 10">
    <rect x="0" y="0" width="1080" height="${Z.cima}"/><rect x="0" y="${1920 - Z.baixo}" width="1080" height="${Z.baixo}"/>
    <rect x="${1080 - Z.direita}" y="${Z.direitaDe}" width="${Z.direita}" height="${1920 - Z.baixo - Z.direitaDe}"/></g>
  <g font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="34" fill="#fff" stroke="#000" stroke-width="7" paint-order="stroke">
    <text x="20" y="80">${Z.cima} px: abas e busca</text><text x="20" y="${1920 - Z.baixo + 60}">${Z.baixo} px: legenda, @ e música</text>
    <text x="${1080 - Z.direita + 12}" y="${Z.direitaDe + 50}" font-size="28">${Z.direita} px</text><text x="${1080 - Z.direita + 12}" y="${Z.direitaDe + 86}" font-size="24">botões</text></g></svg>`);
const safeImgs = [];
for (const [rot, b] of safe) safeImgs.push([rot, await sharp(await sharp(b).composite([{ input: zonas }]).png().toBuffer()).resize(540, 960).png().toBuffer()]);
await folha(safeImgs, 3, `${SAIDA}/news-especial-v5-safezones.png`, 540, 960);

await sharp(capa).png().toFile(`${SAIDA}/news-especial-v5-capa.png`);
console.log(`ok: ${SAIDA}/news-especial-v5-capa.png (CAPA_MS=${Math.round(CAPA_S * 1000)})`);
