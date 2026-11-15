// Candidatos a parceiro do Raichu na bancada do News #1 (15/11), numa foto parada: cada um de terno e gravata comprida,
// com a técnica do terno do Raichu (teste-gravata/gravata.mjs): o tronco troca de cor pelo brilho do próprio sprite (a
// luz continua do mesmo lado), e camisa, lapela e gravata são um carimbo de pixel na mesma grade. Corpo não é redesenhado.
// Descartados antes de vestir (peito escondido ou agachado): Kangaskhan, Hypno, Nidoking e Electabuzz.
// Monta news-01/render/teste-parceiros (fora do git): o estúdio do index.html, sem vídeo nem som, e a cena.js no lugar
// da linha do tempo; o candidato sai do ?p=<id>.
//   node trailer/curtas/news-01/teste-parceiros/montar.mjs && scripts/pesado.sh node trailer/curtas/news-01/teste-parceiros/foto.mjs <png>
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { vestir as vestirRaichu } from '../teste-gravata/gravata.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const D = new URL('./', import.meta.url).pathname;
const RAIZ = new URL('../../../../', import.meta.url).pathname;
const CAMPO = `${RAIZ}public/assets/field/`;

const hex = (h) => [Number.parseInt(h.slice(1, 3), 16), Number.parseInt(h.slice(3, 5), 16), Number.parseInt(h.slice(5, 7), 16), 255];
// a paleta do terno do Raichu (gravata.mjs) e as gravatas
const NAVY = { L: '#56628f', S: '#3a4570', s: '#2a3358', z: '#1b2140' };
const GRAFITE = { L: '#6e6e7a', S: '#4a4a55', s: '#36363f', z: '#222229' }; // pro Blastoise, que já é azul
const CAMISA = { '#': '#000000', W: '#f4f4ec', w: '#c3c8d8' };
const VERMELHA = { H: '#ff6b5c', G: '#d42a33', D: '#86131c', K: '#86131c' };
const DOURADA = { H: '#fff3a0', G: '#ffcb05', D: '#b07c00', K: '#b07c00' };
const AZUL = { H: '#8fc0ff', G: '#3a7bd5', D: '#1f4796', K: '#1f4796' };

// Por candidato, tudo no quadro 0 do Idle de frente (coordenadas da folha do quadro):
//   linha: a linha do quadro no tampo da mesa; zonas: [col, lin, topo] sementes do tronco (o terno enche a partir delas,
//   pelo que não é contorno preto nem `barreira`, da linha `topo` até a mesa); fora: [i0, i1, j0, j1] que o terno não
//   pinta (a cabeça); claro/medio: o brilho que vira S (luz), s (meio) e z (sombra); carimbo: camisa, lapela e gravata
//   a partir de `o`. Gravata de 2 px quando o meio do peito cai entre 2 colunas, de 3 px quando cai numa.
export const CANDIDATOS = {
  149: {
    nome: 'DRAGONITE', linha: 27, terno: NAVY, gravata: VERMELHA, zonas: [[16, 21, 19]],
    barreira: ['#278700', '#5fb727', '#7fdf57', '#ffffff'], claro: 170, medio: 125,
    o: [15, 19],
    carimbo: [
      '..wKKKw..',
      '.LWHGDWL.',
      'LWWHGDWWL',
      'LWWHGDWWL',
      'LWWHGDWWL',
      '.LWHGDWL.',
      '.LWHGDWL.',
      '..LHGDL..',
      '...HGD...',
    ],
  },
  9: {
    nome: 'BLASTOISE', linha: 22, terno: GRAFITE, gravata: VERMELHA, zonas: [[10, 17, 14], [29, 17, 14]],
    barreira: ['#b7bfc7', '#ffffff', '#dfaf67', '#ffe79f', '#af671f', '#773f00'], claro: 120, medio: 85,
    // o plastrão inteiro vira a frente do paletó (lapela e camisa no meio), o contorno de baixo do queixo fica
    o: [14, 16],
    carimbo: [
      '.sLW#KK#WLs.',
      '.sLWWGGWWLs.',
      'ssLWWGDWWLss',
      '.ssLWGGWLss.',
      '..sLWGDWLs..',
      '...sLGGLs...',
    ],
  },
  36: {
    nome: 'CLEFABLE', linha: 27, terno: NAVY, gravata: AZUL, zonas: [[7, 19, 19], [24, 19, 19], [10, 23, 22]],
    barreira: ['#ffffff'], claro: 230, medio: 200,
    o: [12, 22],
    carimbo: [
      '.wWKKWw.',
      'LWWGGWWL',
      'LWWGDWWL',
      '.LWGGWL.',
      '.LWGDWL.',
      '...GG...',
    ],
  },
  67: {
    nome: 'MACHOKE', linha: 20, terno: NAVY, gravata: DOURADA, zonas: [[10, 18, 10], [20, 18, 10]],
    fora: [11, 19, 0, 15], barreira: ['#fff700', '#dfb700', '#a76f00', '#ffffff'], claro: 200, medio: 140,
    o: [11, 16],
    carimbo: [
      '..wKKKw..',
      'LWWHGDWWL',
      '.LWHGDWL.',
      '..LHGDL..',
      '...HGD...',
      '...HGD...',
    ],
  },
};

const cor = (b, o) => (b[o + 3] ? `#${[0, 1, 2].map((k) => b[o + k].toString(16).padStart(2, '0')).join('')}` : null);
const lum = (h) => 0.3 * Number.parseInt(h.slice(1, 3), 16) + 0.59 * Number.parseInt(h.slice(3, 5), 16) + 0.11 * Number.parseInt(h.slice(5, 7), 16);

/** Veste o quadro 0 do Idle de frente do candidato `id` (folha `entrada` → `saida`). Devolve o retângulo do quadro. */
// ponytail: só o quadro parado da foto; pro vídeo, o escolhido ganha âncora por quadro como o Raichu no gravata.mjs
export async function vestir(id, entrada, saida) {
  const C = CANDIDATOS[id];
  const json = JSON.parse(readFileSync(`${CAMPO}${id}.json`, 'utf8'));
  const { x: fx, y: fy, w, h } = json.frames['Idle/0/0'].frame;
  const { data: b, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (i, j) => ((fy + j) * info.width + fx + i) * 4;
  const px = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? null : cor(b, at(i, j)));
  const put = (i, j, c) => b.set(hex(c), at(i, j));
  const fora = (i, j) => C.fora && i >= C.fora[0] && i <= C.fora[1] && j >= C.fora[2] && j <= C.fora[3];
  const fundo = C.linha + 2;
  // o terno: enche a partir das sementes (antes de pintar, pra luz sair das cores do jogo)
  const terno = new Set();
  for (const [si, sj, topo] of C.zonas) {
    const fila = [[si, sj]];
    while (fila.length) {
      const [i, j] = fila.pop();
      const c = px(i, j);
      if (j < topo || j > fundo || terno.has(j * w + i) || !c || c === '#000000' || C.barreira.includes(c) || fora(i, j)) continue;
      terno.add(j * w + i);
      fila.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
    }
  }
  for (const k of terno) {
    const [i, j] = [k % w, Math.floor(k / w)];
    const l = lum(px(i, j));
    put(i, j, C.terno[l > C.claro ? 'S' : l > C.medio ? 's' : 'z']);
  }
  const P = { ...CAMISA, ...C.terno, ...C.gravata };
  C.carimbo.forEach((ln, dj) => [...ln].forEach((k, di) => { if (k !== '.') put(C.o[0] + di, C.o[1] + dj, P[k]); }));
  await sharp(b, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(saida);
  return { fx, fy, w, h, tam: [json.meta.size.w, json.meta.size.h] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = `${D}../render/teste-parceiros/`;
  const M = `${D}../../midia/`;
  rmSync(OUT, { recursive: true, force: true });
  for (const f of ['sprites.js', 'som/news.js', 'sp/26.png', 'logo-simbolo.svg', 'Galmuri11-Bold.woff2', 'news/recompensa.png', 'news/ultimate-fatia.png', 'news/cartas/95.png']) {
    mkdirSync(dirname(`${OUT}midia/${f}`), { recursive: true });
    copyFileSync(M + f, `${OUT}midia/${f}`);
  }
  copyFileSync(`${D}../../comum.js`, `${OUT}comum.js`);
  await vestirRaichu(26, '-', `${M}sp/26.png`, `${OUT}midia/sp/26.png`);
  // os candidatos não estão no sprites.js das curtas: o quadro parado vai num PARC à parte
  const PARC = {};
  for (const id of Object.keys(CANDIDATOS)) {
    const q = await vestir(id, `${CAMPO}${id}.png`, `${OUT}midia/sp/${id}.png`);
    PARC[id] = { ...q, folha: `midia/sp/${id}.png`, linha: CANDIDATOS[id].linha, nome: CANDIDATOS[id].nome };
    copyFileSync(`${RAIZ}public/assets/portraits/${id}-happy.png`, `${OUT}midia/${id}-happy.png`);
  }
  let h = readFileSync(`${D}../index.html`, 'utf8');
  h = h.replace(/\n\s*<video [^\n]*<\/video>/g, '').replace(/\n\s*<audio [^\n]*<\/audio>/g, '');
  const ini = h.indexOf('<script>\n    const { T, div, ator');
  const fim = h.indexOf('</script>', ini);
  if (ini < 0 || fim < 0) throw new Error('não achei a linha do tempo no index.html');
  h = `${h.slice(0, ini)}<script>window.PARC = ${JSON.stringify(PARC)};</script>\n  <script>\n${readFileSync(`${D}cena.js`, 'utf8')}  ${h.slice(fim)}`;
  writeFileSync(`${OUT}index.html`, h);
  console.log(`ok: ${OUT}`);
}
