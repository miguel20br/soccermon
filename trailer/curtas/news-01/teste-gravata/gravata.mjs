// Gravata comprida da dupla do News #1 (15/11): veste o Raichu com o terno do 1º teste (teste-terno/terno.mjs: lapela,
// camisa branca e gravata comprida vermelha) em todos os quadros do Idle de frente e no 3/4, e o Golduck em 3 variações:
//   A: terno (lapela + camisa + gravata), B: só camisa e gravata, C: só a gravata.
// Cada quadro acha a âncora (a barriga do Raichu, o bico do Golduck) e carimba o desenho a partir dela, então o terno
// acompanha o respiro do Idle. O terno sai do brilho do sprite (a luz continua do mesmo lado); camisa e gravata são
// carimbos de pixel na mesma grade, com contorno preto de 1 px onde a peça passa por cima do vazio.
//   import { vestir } from './gravata.mjs'; await vestir(55, 'B', folhaDoJogo, folhaNova)
//   node trailer/curtas/news-01/teste-gravata/gravata.mjs <pasta>   (prévias 10x de cada quadro, pra conferir)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)('sharp');
const D = new URL('../../', import.meta.url).pathname;
const s = readFileSync(`${D}midia/sprites.js`, 'utf8');
const SPR = JSON.parse(s.slice(s.indexOf('{'), s.indexOf(';\n')));

const hex = (h) => [Number.parseInt(h.slice(1, 3), 16), Number.parseInt(h.slice(3, 5), 16), Number.parseInt(h.slice(5, 7), 16), 255];
// a paleta do 1º teste (a que o Miguel aprovou)
const P = {
  '#': hex('#000000'),
  L: hex('#56628f'), // lapela (luz)
  S: hex('#3a4570'), // terno
  s: hex('#2a3358'),
  z: hex('#1b2140'), // sombra do terno
  W: hex('#f4f4ec'), // camisa
  w: hex('#c3c8d8'),
};
/** O pano do terno (L lapela, S luz, s meio, z sombra): o do 1º teste, ou outro passado ao vestir (igualar com o Machoke). */
export const PANO = { L: '#56628f', S: '#3a4570', s: '#2a3358', z: '#1b2140' };
const pano = (p) => Object.fromEntries(['L', 'S', 's', 'z', 'Z'].filter((k) => p[k]).map((k) => [k, hex(p[k])]));
// gravata: H luz, G meio, D sombra, K nó
export const GRAVATA = {
  26: { H: hex('#ff7a6a'), G: hex('#e8423f'), D: hex('#9c1f1f'), K: hex('#9c1f1f') },
  55: { H: hex('#ff6b5c'), G: hex('#d42a33'), D: hex('#86131c'), K: hex('#86131c') },
};
const LINHA = { 26: 28, 55: 22 }; // a linha da folha no tampo da mesa

// Carimbos: '.' mantém o pixel, as letras são cores de P/GRAVATA. Origem = [col, linha] relativa à âncora.
const RAICHU = {
  // de frente: a origem é (gravata - 3, barriga - 2); é o desenho do terno.mjs, coluna por coluna
  0: [
    '.wWKKWw.',
    'LWWGGWWL',
    'LWWGDWWL',
    '.LWGGWL.',
    '.LWGDWL.',
    '...GG...',
    '..wD....',
  ],
  // 3/4 olhando pro Golduck: o lado de lá do V some atrás da curva do peito
  1: [
    '.wWKKw..',
    'LWWGGW..',
    'LWWGDW..',
    '.LWGGW..',
    '.LWGDW..',
    '...GG...',
    '..wD....',
  ],
};
// A divisão entre a cara e o terno (15/11: o laranja passava direto pro azul). Origem = (a do RAICHU - 4, a linha do
// queixo, 1 acima da gola). 'o' põe na sombra o pixel da cara que tem o terno ou a camisa logo embaixo (o laranja e o
// amarelo viram os tons escuros do próprio sprite): a linha do queixo. Escurecer o terno embaixo do queixo não
// aparecia (o marinho já é escuro), então a sombra fica do lado da cara.
//   A: as pontas da gola subindo 1 px dos lados do nó, encostando no queixo
//   B: 1 px de sombra no queixo, encostado na gola
//   C: A + B
export const GOLA = {
  A: { 0: ['......W..W....'], 1: ['......W..w....'] },
  B: { 0: ['oooooooooooooo'], 1: ['oooooooooooooo'] },
  C: { 0: ['oooooo.oo.oooo'], 1: ['oooooo.oo.oooo'] }, // a sombra antes, as pontas por cima (aplicar() roda A depois)
};
const SOMBRA = { '#ffaf47': '#a75f1f', '#df871f': '#a75f1f', '#fff700': '#b78727', '#dfb700': '#b78727' }; // cara: tom -> sombra

// Golduck de frente: origem = (centro do bico - 4, ponta do bico). O nó fica no contorno de baixo do bico (o peito
// dele é só 1 linha, o bico tampa o resto) e a gravata desce pelo vão entre as pernas até a mesa. Em 3/4: origem =
// (ponta de baixo do bico + 4, mesma linha); o peito aparece à direita do bico e a gravata desce por ele.
const GOLDUCK = {
  A: {
    0: [
      '.W.....W.',
      'LWWKKKWWL',
      'LwWHGDWwL',
      '#LWHGDWS#',
      '#LWHGDWS#',
      '#LWHGDWS#',
      '#LWHGDWS#',
      '#LWWDWWS#',
    ],
    7: [
      '.......',
      '#WKK#..',
      '#WHD#L.',
      '#WHD#S.',
      '#WHD#S.',
      '#WHD#S.',
      '#WHD#S.',
      '.#D#...',
    ],
  },
  B: {
    0: [
      '#W.....W#',
      '#WWKKKWW#',
      '#wWHGDWw#',
      '##WHGDw##',
      '.#WHGDw#.',
      '.#WHGDw#.',
      '.#WHGDw#.',
      '.#WWDWw#.',
    ],
    7: [
      '.##....',
      '#WKK#..',
      '#WHD#..',
      '#WHD#..',
      '#WHD#..',
      '#WHD#..',
      '#WHD#..',
      '.#D#...',
    ],
  },
  C: {
    0: [
      '.........',
      '..#KKK#..',
      '..#HGD#..',
      '..#HGD#..',
      '..#HGD#..',
      '..#HGD#..',
      '...#D#...',
    ],
    7: [
      '.......',
      '.#KK#..',
      '.#HD#..',
      '.#HD#..',
      '.#HD#..',
      '.#HD#..',
      '.#HD#..',
      '..##...',
    ],
  },
};

const cor = (b, o) => (b[o + 3] ? `#${[0, 1, 2].map((k) => b[o + k].toString(16).padStart(2, '0')).join('')}` : null);
const lum = (h) => 0.3 * Number.parseInt(h.slice(1, 3), 16) + 0.59 * Number.parseInt(h.slice(3, 5), 16) + 0.11 * Number.parseInt(h.slice(5, 7), 16);

/** O maior pedaço contínuo (4-vizinhos) das cores `cores` num quadro. */
function maior(px, w, h, cores) {
  const visto = new Set();
  let melhor = [];
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      if (visto.has(j * w + i) || !cores.includes(px(i, j))) continue;
      const comp = [];
      const fila = [[i, j]];
      visto.add(j * w + i);
      while (fila.length) {
        const [a, c] = fila.pop();
        comp.push([a, c]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const [x, y] = [a + di, c + dj];
          if (x < 0 || y < 0 || x >= w || y >= h || visto.has(y * w + x) || !cores.includes(px(x, y))) continue;
          visto.add(y * w + x);
          fila.push([x, y]);
        }
      }
      if (comp.length > melhor.length) melhor = comp;
    }
  return melhor;
}

/** Veste um quadro (fx, fy, w, h) do buffer `b` (largura `W`). Devolve a âncora, pra conferência. */
function quadro(id, variante, dir, b, W, fx, fy, w, h, tecido, gola, desce) {
  const px = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? null : cor(b, ((fy + j) * W + fx + i) * 4));
  const put = (i, j, c) => { if (i >= 0 && j >= 0 && i < w && j < h) b.set(c, ((fy + j) * W + fx + i) * 4); };
  const G = { ...P, ...tecido, ...GRAVATA[id] };
  const fundo = LINHA[id] + 2;
  let ox, oy, carimbo, terno;
  if (id === 26) {
    const bar = maior(px, w, h, ['#ffffff', '#fff79f', '#d7bf67', '#b78727']);
    const is = bar.map(([i]) => i);
    const bt = Math.min(...bar.map(([, j]) => j));
    const [i0, i1] = [Math.min(...is), Math.max(...is)];
    const L = dir === 0 ? Math.floor((i0 + i1) / 2) : i1 - 3;
    [ox, oy, carimbo] = [L - 3, bt - 2 + desce, RAICHU[dir]];
    // o terno: o tronco e os braços (o rabo e as bochechas de fora), pelo brilho de antes; `desce` baixa a gola
    terno = { top: oy, i0: L - 7, i1: L + (dir === 0 ? 7 : 6), barreira: ['#dfb700', '#fff700'], claro: 225, medio: 170 };
    // v9: em 3/4 o paletó cobre também as costas e o quadril (o pelo à esquerda de L - 7 aparecia: "a bunda"). O pano
    // se espalha a partir do terno pelo pelo ligado a ele, sem atravessar o contorno preto (o rabo fica de fora)
    if (dir === 1) terno.costas = L - 13;
  } else {
    const bico = maior(px, w, h, ['#ffe79f', '#dfaf67', '#bf7727']);
    const bb = Math.max(...bico.map(([, j]) => j));
    const pe = bico.filter(([, j]) => j === bb).map(([i]) => i);
    if (dir === 0) [ox, oy] = [Math.round((Math.min(...pe) + Math.max(...pe)) / 2) - 4, bb];
    else [ox, oy] = [Math.min(...pe) + 4, bb];
    carimbo = GOLDUCK[variante][dir];
    // A: o terno no tronco e nas pernas (os braços, o bico, as garras e os olhos ficam como estão)
    if (variante === 'A')
      terno = dir === 0
        ? { top: oy - 1, i0: ox - 3, i1: ox + 11, barreira: ['#ffe79f', '#dfaf67', '#bf7727', '#ffffff', '#ff875f'], claro: 150, medio: 90 }
        : { top: oy - 1, i0: ox - 4, i1: ox + 5, barreira: ['#ffe79f', '#dfaf67', '#bf7727', '#ffffff', '#ff875f'], claro: 150, medio: 90 };
  }
  if (terno) {
    const veste = [];
    const pode = (i, j) => { const c = px(i, j); return c && c !== '#000000' && !terno.barreira.includes(c); };
    for (let j = terno.top; j <= fundo; j++) for (let i = terno.i0; i <= terno.i1; i++) if (pode(i, j)) veste.push([i, j, px(i, j)]);
    if (terno.costas !== undefined) {
      const visto = new Set(veste.map(([i, j]) => j * w + i));
      for (let k = 0; k < veste.length; k++)
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const [i, j] = [veste[k][0] + di, veste[k][1] + dj];
          if (i < terno.costas || i > terno.i1 || j < terno.top || j > fundo || visto.has(j * w + i) || !pode(i, j)) continue;
          visto.add(j * w + i);
          veste.push([i, j, px(i, j)]);
        }
    }
    for (const [i, j, c] of veste) {
      const l = lum(c);
      put(i, j, l > terno.claro ? G.S : l > terno.medio ? G.s : G.z);
    }
  }
  carimbo.forEach((linha, dj) => [...linha].forEach((k, di) => { if (k !== '.') put(ox + di, oy + dj, G[k]); }));
  if (id === 26 && gola) {
    const roupa = [G.L, G.S, G.s, G.z, G.W, G.w, G.K].map((c) => cor(c, 0));
    for (const g of gola === 'C' ? ['C', 'A'] : [gola])
      GOLA[g][dir].forEach((linha, dj) => [...linha].forEach((k, di) => {
        const [i, j] = [ox - 4 + di, oy - 1 + dj];
        if (k === 'o') { if (SOMBRA[px(i, j)] && roupa.includes(px(i, j + 1))) put(i, j, hex(SOMBRA[px(i, j)])); }
        else if (k !== '.') put(i, j, G[k]);
      }));
  }
  return [ox, oy];
}

const DIRS = { 26: [0, 1], 55: [0, 7] };
/** Lê a folha do jogo de `id`, veste os quadros do Idle das direções da cena e grava em `saida`; `cores` troca o pano
 * do terno (L, S, s, z e o Z, a sombra funda; o resto da paleta é ignorado) e `gola` (A, B ou C de GOLA) marca a
 * divisão entre a cara e o terno do Raichu; `desce` baixa o começo do terno do Raichu (gola, lapela e V) em N linhas,
 * deixando o pescoço e o peito de cima no pelo do sprite. */
export async function vestir(id, variante, entrada, saida, cores = PANO, gola = null, desce = 0) {
  const tecido = pano(cores);
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const A = SPR[id].anims.Idle;
  const log = [];
  for (const dir of DIRS[id])
    A.rects[dir].forEach(([fx, fy], q) => log.push(`${dir}/${q}: ${quadro(id, variante, dir, data, info.width, fx, fy, A.w, A.h, tecido, gola, desce)}`));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(saida);
  return log;
}

/** Um quadro do Idle (já vestido) de `folha`, recortado e ampliado `e` vezes, como buffer PNG. */
export async function recorte(id, folha, dir, q, e, crop) {
  const A = SPR[id].anims.Idle;
  const [fx, fy] = A.rects[dir][q];
  const [ci, cj, cw, ch] = crop ?? [0, 0, A.w, A.h];
  return sharp(folha).extract({ left: fx + ci, top: fy + cj, width: cw, height: ch }).resize(cw * e, ch * e, { kernel: 'nearest' }).png().toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = `${process.argv[2] ?? '.'}/`;
  for (const [id, v] of [[26, '-'], [55, 'A'], [55, 'B'], [55, 'C']]) {
    const f = `${OUT}${id}${v}.png`;
    console.log(id, v, (await vestir(id, v, `${D}midia/sp/${id}.png`, f)).join(' | '));
    const A = SPR[id].anims.Idle;
    const tiles = [];
    for (const [k, dir] of DIRS[id].entries())
      for (let q = 0; q < A.rects[dir].length; q++) tiles.push({ input: await recorte(id, f, dir, q, 8), left: q * (A.w * 8 + 8), top: k * (A.h * 8 + 8) });
    await sharp({ create: { width: 6 * (A.w * 8 + 8), height: 2 * (A.h * 8 + 8), channels: 4, background: '#7a5a8a' } }).composite(tiles).png().toFile(`${OUT}prev-${id}${v}.png`);
  }
}
