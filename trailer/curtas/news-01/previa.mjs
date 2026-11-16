// Prévia em quadros parados do News #1 (v11), sem render de vídeo: abre a cena num Chromium headless, pausa a linha do
// tempo em cada instante e monta as folhas com o tempo escrito embaixo de cada quadro.
//   scripts/pesado.sh node trailer/curtas/news-01/previa.mjs <pasta de saída>
//   → <pasta>/news-v11-previa.png    (um quadro de cada bloco, de cada beat sem texto, dos planos novos e dos papéis)
//     <pasta>/news-v11-safezones.png (6 quadros típicos com as safe zones de TikTok, Reels e Shorts por cima)
//     <pasta>/news-v11-voltorb.png   (o colete novo: no tamanho do celular e de perto, nas 4 aparições)
//     <pasta>/news-v11-estudio.png   (o cenário novo inteiro e o plano aberto)
//     <pasta>/news-01-v11-capa.png   (a capa: o gancho com a manchete grande; CAPA_MS no Buffer = o mesmo quadro)
import { createRequire } from 'node:module';
import { BEATS, FALAS, M } from './linha.mjs';

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
  ['gancho', 1.0], ['gancho (capa)', CAPA_S], ['vinheta C', M.vinheta + 1.9], ['abertura · f1 (aberto)', meio(F.f1)], ['f2', meio(F.f2)],
  ['f3 · close + quadro', meio(F.f3)], beat('bDupla'), ['faixas 1', M.escalada - 0.04], ['escalada', M.escalada + 2.7], beat('bCartas', 0.7),
  ['PLANTÃO · f4 close', M.vt1 - 0.1], ['f4 VT', meio(F.f4)], ['f5', meio(F.f5)], ['f6', meio(F.f6)], beat('bRua', 0.75),
  ['AO VIVO · f8 close', meio(F.f8)], ['f9 (Rota)', meio(F.f9)], ['f11 Pay Day', M.payday + 0.3], beat('payFim', 0.7), ['VESTIÁRIO · f12', M.kaboom + 0.3],
  ['reação', M.reacao + 0.5], ['f13 (convidado)', meio(F.f13)], ['f14', meio(F.f14)], beat('bVoltorb', 0.65), beat('bVoltorb', 1.0),
  ['faixas 2', M.vemai - 0.04], ['VEM AÍ · f15', meio(F.f15)], ['f16', meio(F.f16)], ['f17', meio(F.f17)], beat('bRola', 0.9),
  ['PRA FECHAR · f18 close', meio(F.f18)], beat('bRisada', 0.45), ['f19', F.f19.paginas[0].fim + 0.1], ['papéis na mesa', M.papeis[0] - 0.06],
  ['f20 (os quatro)', meio(F.f20)], ['tela final', M.final + 2],
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
// o Voltorb: o gancho inteiro (tamanho do celular) e de perto nas 4 aparições: gancho, banco, telão rolando, quadro gráfico
const vGancho = await foto(CAPA_S);
const vBanco = await foto(M.gag.olha[0] + 0.1);
const vTelao = await foto(M.bRola + 1.1);
const vOts = await foto(M.voltorbReage[2] + 1.3);
// o estúdio: o plano aberto (no beat, sem caixa) e o cenário inteiro (a câmera bem afastada, sem manchete nem selo)
const estAberto = await foto(M.bDupla + 0.6);
await page.evaluate(() => {
  for (const id of ['manchete', 'bug']) document.getElementById(id).style.visibility = 'hidden';
  gsap.set('#cam', { scale: 0.5, x: 540 - 0.5 * 440, y: 960 - 0.5 * 760 });
});
await page.waitForTimeout(120);
const estInteiro = await page.screenshot();
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
await folha(fotos, 9, `${SAIDA}/news-v11-previa.png`);

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
await folha(safeImgs, 3, `${SAIDA}/news-v11-safezones.png`, 540, 960);

// o Voltorb: à esquerda o gancho no tamanho do celular (~405 x 720), à direita os 4 recortes de perto
const recorte = async (b, [x, y, w, h], rot) => {
  const img = await sharp(b).extract({ left: x, top: y, width: w, height: h }).resize(340, 340, { kernel: 'nearest' }).png().toBuffer();
  return [rot, img];
};
const perto = [
  await recorte(vGancho, [330, 860, 420, 420], 'gancho (perto)'),
  await recorte(vBanco, [320, 840, 460, 460], 'banco, no beat'),
  await recorte(vTelao, [330, 300, 420, 420], 'telão, rolando'),
  await recorte(vOts, [130, 700, 380, 380], 'quadro gráfico, f18'),
];
{
  const G = 16;
  const cel = await sharp(vGancho).resize(405, 720).png().toBuffer();
  const camadas = [{ input: cel, left: G, top: G }, { input: txt('no tamanho do celular', 405), left: G, top: G + 720 }];
  perto.forEach(([rot, img], k) => {
    const x = G + 405 + G + (k % 2) * (340 + G);
    const y = G + Math.floor(k / 2) * (340 + 44 + G);
    camadas.push({ input: img, left: x, top: y }, { input: txt(rot, 340), left: x, top: y + 340 });
  });
  await sharp({ create: { width: G * 4 + 405 + 680, height: G * 2 + 764, channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(`${SAIDA}/news-v11-voltorb.png`);
  console.log(`ok: ${SAIDA}/news-v11-voltorb.png`);
}
await folha([['o estúdio inteiro (a câmera afastada)', await pequena(estInteiro, 540)], ['o plano aberto (beat bDupla)', await pequena(estAberto, 540)]], 2, `${SAIDA}/news-v11-estudio.png`, 540, 960);
await sharp(capa).png().toFile(`${SAIDA}/news-01-v11-capa.png`);
console.log(`ok: ${SAIDA}/news-01-v11-capa.png (CAPA_MS=${Math.round(CAPA_S * 1000)})`);
