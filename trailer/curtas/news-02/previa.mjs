// Prévia em quadros parados do News #1 (v11), sem render de vídeo: abre a cena num Chromium headless, pausa a linha do
// tempo em cada instante e monta as folhas com o tempo escrito embaixo de cada quadro.
//   scripts/pesado.sh node trailer/curtas/news-01/previa.mjs <pasta de saída>
//   → <pasta>/news2-v1-previa.png    (um quadro de cada bloco, de cada beat sem texto, dos planos novos e dos papéis)
//     <pasta>/news2-v1-safezones.png (6 quadros típicos com as safe zones de TikTok, Reels e Shorts por cima)
//     <pasta>/news-v11-voltorb2.png   (o colete na metade de baixo, com o 12: no tamanho do celular e de perto, nas 4 aparições)
//     <pasta>/news-v11-estudio.png   (o cenário novo inteiro e o plano aberto)
//     <pasta>/news-01-v11-capa.png   (a capa: o gancho com a manchete grande; CAPA_MS no Buffer = o mesmo quadro)
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
/** O quadro da capa (ms do vídeo): o gancho com o Voltorb já calmo, antes da vinheta. */
export const CAPA_S = 2.3;

const QUADROS = [
  ['gancho', 1.0], ['gancho (capa)', CAPA_S], ['vinheta C', M.vinheta + 1.9], ['abertura · f1', meio(F.f1)], ['f2', meio(F.f2)],
  ['f3 · close + 0.9.53', meio(F.f3)], beat('bDupla'), ['escalada 1', CARTELAS[0] + 0.6], ['escalada 2', CARTELAS[1] + 0.6], ['escalada 3', CARTELAS[2] + 0.6], ['escalada 4', CARTELAS[3] + 0.6], beat('bCartas', 0.7),
  ['PLANTÃO · f4 close', M.vt1 - 0.1], ['f4 VT Eviolite', meio(F.f4)], ['f5 barras +30%', meio(F.f5)], ['f6 nota/bronze', meio(F.f6)], ['f6b Machoke', meio(F.f6b)], ['f6c Eu não', meio(F.f6c)], beat('bRua', 0.75),
  ['AO VIVO · f8 close', meio(F.f8)], ['f9 clipe', meio(F.f9)], ['f10 titular', M.titular + 0.4], ['f11 capitão', M.payday + 0.3], beat('payFim', 0.7),
  ['VESTIÁRIO · f12', M.kaboom - 0.5], ['f12 C muda', M.kaboom + 0.6], ['reação (Psyduck)', M.reacao + 0.5], ['f14', meio(F.f14)], beat('bVoltorb', 0.3), beat('bVoltorb', 1.0),
  ['VEM AÍ · f15', meio(F.f15)], ['f16 pacote', meio(F.f16)], beat('bRola', 0.9), ['PRA FECHAR · f18', meio(F.f18)], beat('bRisada', 0.45),
  ['f19', F.f19.paginas[0].fim + 0.1], ['f20', meio(F.f20)], ['tela final', M.final + 2],
];
// as safe zones (1080 x 1920, valores conservadores de TikTok, Reels e Shorts): a faixa de cima (abas e busca), a de
// baixo (legenda, nome e música) e a coluna da direita (curtir, comentar, compartilhar, perfil) da altura dela pra baixo
export const ZONAS = { cima: 120, baixo: 320, direita: 130, direitaDe: 640 };
const SAFE = [
  ['bancada (aberto) · f2', meio(F.f2)], ['close + quadro · f3', meio(F.f3)], ['close Machoke · f18', meio(F.f18)],
  ['Rota · f9', meio(F.f9)], ['vestiário · f12', M.kaboom + 0.3], ['os quatro · f20', meio(F.f20)],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
const abre = async (q = '') => {
  await page.goto(`file://${HTML}${q}`);
  await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
};
const foto = async (t) => {
  await page.evaluate((t) => { window.__timelines.root.seek(t, false); }, t); // as chaves: sem elas o evaluate serializa a timeline
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
await folha(fotos, 9, `${SAIDA}/news2-v1-previa.png`);

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
await folha(safeImgs, 3, `${SAIDA}/news2-v1-safezones.png`, 540, 960);

await sharp(capa).png().toFile(`${SAIDA}/news-02-v1-capa.png`);
console.log(`ok: ${SAIDA}/news-02-v1-capa.png (CAPA_MS=${Math.round(CAPA_S * 1000)})`);
