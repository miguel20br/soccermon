// Foto parada da dupla do News #1 (15/11): o Raichu (terno do gravata.mjs) e o Machoke (terno.mjs) na bancada.
// Monta news-01/render/teste-machoke (fora do git): o estúdio do index.html, sem vídeo nem som, e a cena.js no lugar da
// linha do tempo; a cor do terno e a direção do Machoke saem do ?cor=<marinho|raichu|preto>&dir=<0|7>, e o pano do
// Raichu do ?rcor= (o mesmo nome, marinho-A/B/C com a gola do GOLA, ou marinho-d1/d2/d3 com a gola N linhas mais
// baixa; sem ele, o do 1º teste).
//   node trailer/curtas/news-01/teste-machoke/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-machoke/foto.mjs <png>
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { vestir as vestirRaichu } from '../teste-gravata/gravata.mjs';
import { ANIM, CORES, FOLHA, LINHA, TAM, vestir } from './terno.mjs';

const D = new URL('./', import.meta.url).pathname;
const OUT = `${D}../render/teste-machoke/`;
const M = `${D}../../midia/`;
rmSync(OUT, { recursive: true, force: true });
for (const f of ['sprites.js', 'som/news.js', 'sp/26.png', 'logo-simbolo.svg', 'Galmuri11-Bold.woff2', 'news/recompensa.png', 'news/ultimate-fatia.png', 'news/cartas/95.png']) {
  mkdirSync(dirname(`${OUT}midia/${f}`), { recursive: true });
  copyFileSync(M + f, `${OUT}midia/${f}`);
}
copyFileSync(`${D}../../comum.js`, `${OUT}comum.js`);
await vestirRaichu(26, '-', `${M}sp/26.png`, `${OUT}midia/sp/26.png`);
const folhas = {};
const raichu = {}; // o Raichu no pano de cada cor do Machoke (?rcor=; sem ele, o pano do 1º teste)
for (const cor of Object.keys(CORES)) {
  folhas[cor] = `midia/sp/67-${cor}.png`;
  await vestir(FOLHA, `${OUT}${folhas[cor]}`, cor);
  raichu[cor] = `midia/sp/26-${cor}.png`;
  await vestirRaichu(26, '-', `${M}sp/26.png`, `${OUT}${raichu[cor]}`, CORES[cor]);
}
for (const g of ['A', 'B', 'C']) { // a divisão cara/terno do Raichu (GOLA no gravata.mjs), no marinho: ?rcor=marinho-A
  raichu[`marinho-${g}`] = `midia/sp/26-marinho-${g}.png`;
  await vestirRaichu(26, '-', `${M}sp/26.png`, `${OUT}${raichu[`marinho-${g}`]}`, CORES.marinho, g);
}
for (const n of [1, 2, 3]) { // a gola do Raichu N linhas mais baixa (pescoço no pelo do sprite), no marinho: ?rcor=marinho-d2
  raichu[`marinho-d${n}`] = `midia/sp/26-marinho-d${n}.png`;
  await vestirRaichu(26, '-', `${M}sp/26.png`, `${OUT}${raichu[`marinho-d${n}`]}`, CORES.marinho, null, n);
}
let h = readFileSync(`${D}../index.html`, 'utf8');
h = h.replace(/\n\s*<video [^\n]*<\/video>/g, '').replace(/\n\s*<audio [^\n]*<\/audio>/g, '');
const ini = h.indexOf('<script>\n    const { T, div, ator');
const fim = h.indexOf('</script>', ini);
if (ini < 0 || fim < 0) throw new Error('não achei a linha do tempo no index.html');
const MACH = { ...ANIM, tam: TAM, linha: LINHA, folhas, raichu };
h = `${h.slice(0, ini)}<script>window.MACH = ${JSON.stringify(MACH)};</script>\n  <script>\n${readFileSync(`${D}cena.js`, 'utf8')}  ${h.slice(fim)}`;
writeFileSync(`${OUT}index.html`, h);
console.log(`ok: ${OUT}`);
