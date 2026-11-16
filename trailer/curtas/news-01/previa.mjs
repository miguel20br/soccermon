// Prévia em quadros parados do News #1 (v10), sem render de vídeo: abre a cena num Chromium headless, pausa a linha do
// tempo em cada instante e monta uma folha com o tempo escrito embaixo de cada quadro.
//   scripts/pesado.sh node trailer/curtas/news-01/previa.mjs <pasta de saída>
//   → <pasta>/news-v10-previa.png (um quadro de cada bloco e de cada beat sem texto)
//     <pasta>/news-v10-vinhetas.png (as 3 vinhetas, começo, meio e logo montado)
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

const QUADROS = [
  ['gancho', 1.0], ['vinheta (A)', 3.9], ['abertura · f1', meio(F.f1)], ['f2', meio(F.f2)], ['f3', meio(F.f3)], beat('bDupla'),
  ['escalada', 17.7], beat('bCartas', 0.7), ['PLANTÃO · f4', meio(F.f4)], ['f5', meio(F.f5)], ['f6', meio(F.f6)], beat('bRua', 0.75),
  ['AO VIVO · f8', meio(F.f8)], ['f9 (Rota)', meio(F.f9)], ['f11 Pay Day', M.payday + 0.3], beat('payFim', 0.7), ['VESTIÁRIO · f12', M.kaboom + 0.3], ['reação', M.reacao + 0.5],
  ['f13 (bancada)', meio(F.f13)], ['f14', meio(F.f14)], beat('bVoltorb', 0.65), beat('bVoltorb', 1.0), ['VEM AÍ · f15', meio(F.f15)], ['f16', meio(F.f16)],
  ['f17', meio(F.f17)], beat('bRola', 0.9), ['PRA FECHAR · f18', meio(F.f18)], beat('bRisada', 0.45), ['f19', meio(F.f19)], ['f20', meio(F.f20)],
  ['tela final', M.final + 2],
];
const VINHETAS = ['a', 'b', 'c'].flatMap((v) => [['começo', 0.35], ['meio', 1.05], ['logo montado', 2.4]].map(([n, d]) => [v, `${v.toUpperCase()} · ${n}`, +(M.vinheta + d).toFixed(2)]));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
const abre = async (v) => {
  await page.goto(`file://${HTML}?vinheta=${v}`);
  await page.waitForFunction(() => window.__timelines?.root && document.fonts.status === 'loaded');
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
};
const foto = async (t) => {
  await page.evaluate((t) => { window.__timelines.root.seek(t, false); }, t); // as chaves: sem elas o evaluate serializa a timeline
  await page.waitForTimeout(120);
  return sharp(await page.screenshot()).resize(360, 640).png().toBuffer();
};
await abre('a');
const fotos = [];
for (const [rot, t] of QUADROS) fotos.push([`${t.toFixed(2)} s · ${rot}`, await foto(t)]);
const fotosV = [];
for (const [v, rot, t] of VINHETAS) {
  if (!fotosV.length || VINHETAS[fotosV.length - 1][0] !== v) await abre(v);
  fotosV.push([`${rot} (${t.toFixed(2)} s)`, await foto(t)]);
}
await browser.close();
if (erros.length) console.log('erros na página:', erros);

const txt = (t, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44"><text x="${w / 2}" y="30" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="22" fill="#ffcb05" text-anchor="middle">${t.replace(/&/g, '&amp;')}</text></svg>`);
const folha = async (lista, cols, arq) => {
  const W = 360, H = 640, G = 16, R = H + 44;
  const linhas = Math.ceil(lista.length / cols);
  const camadas = lista.flatMap(([rot, img], k) => {
    const x = G + (k % cols) * (W + G);
    const y = G + Math.floor(k / cols) * (R + G);
    return [{ input: img, left: x, top: y }, { input: txt(rot, W), left: x, top: y + H }];
  });
  await sharp({ create: { width: G + cols * (W + G), height: G + linhas * (R + G), channels: 4, background: '#0e1430' } }).composite(camadas).png().toFile(arq);
  console.log(`ok: ${arq}`);
};
await folha(fotos, 8, `${SAIDA}/news-v10-previa.png`);
await folha(fotosV, 3, `${SAIDA}/news-v10-vinhetas.png`);
