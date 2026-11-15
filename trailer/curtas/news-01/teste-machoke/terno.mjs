// Terno do Machoke, parceiro do Raichu na bancada do News #1 (15/11): veste todos os quadros do Idle de frente (dir 0)
// e em 3/4 olhando pro Raichu (dir 7). Mesma técnica do gravata.mjs: o terno troca as cores do próprio sprite pelo
// brilho (os 4 tons do Machoke viram os 4 tons do terno, então ombro e músculo continuam com volume), e camisa,
// lapela e gravata são pixels pintados na mesma grade. Corpo, cabeça e braços não são redesenhados; crista, olhos,
// boca, mãos, pés, cueca e cinto ficam como no sprite.
// O Idle do Machoke tem 2 poses: o quadro 0 (parado, 40 ticks) e os quadros 1–3 (a flexão, 4 ticks cada, a mesma pose
// subindo e descendo 1 px). Cada pose tem um molde; cada quadro acha a âncora (o canto da crista) e o molde anda junto.
//   import { vestir, ANIM, CORES } from './terno.mjs'; await vestir(folhaDoJogo, folhaNova, 'preto')
//   node trailer/curtas/news-01/teste-machoke/terno.mjs <pasta>   (folhas das 3 cores + prévia 10x, e confere as poses)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const sharp = createRequire(import.meta.url)('sharp');
const RAIZ = new URL('../../../../', import.meta.url).pathname;
export const FOLHA = `${RAIZ}public/assets/field/67.png`;
const JSON67 = JSON.parse(readFileSync(`${RAIZ}public/assets/field/67.json`, 'utf8'));
const PMD = JSON.parse(readFileSync(`${RAIZ}src/data/pmd-anims.json`, 'utf8'))[67].anims.Idle;
/** O Idle no formato do sprites.js das curtas (o 67 não está lá). */
export const ANIM = {
  w: PMD.frameWidth,
  h: PMD.frameHeight,
  dur: PMD.durations,
  rects: Array.from({ length: PMD.rows }, (_, d) => Array.from({ length: PMD.frames }, (_, q) => {
    const f = JSON67.frames[`Idle/${d}/${q}`].frame;
    return [f.x, f.y];
  })),
};
export const TAM = [JSON67.meta.size.w, JSON67.meta.size.h];
export const LINHA = 22; // a linha do quadro no tampo da mesa (1 abaixo do cinto: a gravata desce até a ponta)
export const DIRS = [0, 7];

const hex = (h) => [Number.parseInt(h.slice(1, 3), 16), Number.parseInt(h.slice(3, 5), 16), Number.parseInt(h.slice(5, 7), 16), 255];
// 2º teste (15/11): o cinza-azulado e o grafite sumiam na pele lilás do Machoke ("tá da cor da pele dele"); agora só
// cores longe do lilás. Terno: L lapela, S luz, s meio, z sombra, Z sombra funda, R brilho de 1 px na borda (só no preto,
// pra não virar bloco). Gravata: K nó, H luz, G meio, D sombra.
const OURO = { K: '#b07c00', H: '#fff3a0', G: '#ffcb05', D: '#b07c00' };
export const CORES = {
  preto: { L: '#5c5c70', S: '#45454f', s: '#2f2f38', z: '#212128', Z: '#141418', R: '#868a96', ...OURO },
  vinho: { L: '#c4566a', S: '#a63a50', s: '#82263b', z: '#5f192b', Z: '#40101d', ...OURO },
  caramelo: { L: '#f3d9a6', S: '#e0b475', s: '#c08f50', z: '#956736', Z: '#6b4522', K: '#16204a', H: '#4f66a8', G: '#2a3b7c', D: '#16204a' },
};
const FIXAS = { '#': '#000000', W: '#f4f4ec', w: '#c3c8d8' };
const CRISTA = ['#fff700', '#dfb700', '#a76f00'];
const lum = (h) => 0.3 * Number.parseInt(h.slice(1, 3), 16) + 0.59 * Number.parseInt(h.slice(3, 5), 16) + 0.11 * Number.parseInt(h.slice(5, 7), 16);
// os tons do Machoke: #d7c7ef (208) → S, #a797c7 e o rosa #ff875f (161, 166) → s, #7f6f97 e o vermelho #d73f00 (120, 102) → z, #5f4777 (84) → Z
const tom = (c) => { const l = lum(c); return l > 185 ? 'S' : l > 140 ? 's' : l > 95 ? 'z' : 'Z'; };

// Moldes nas coordenadas do quadro de referência de cada pose (32 colunas, a partir da linha `de`):
//   '.' fica, 'x' vira terno pelo brilho (contorno preto, crista e cinto nunca), as letras são pintadas por cima.
const MOLDES = {
  // de frente, parado: o paletó aberto, camisa em V do queixo à mesa, gravata de 3 px no meio do peito
  '0/0': { de: 10, m: [
    '........xxxx.......xxxx.........',
    '.......xxx...........xxx........',
    '......xxxx...........xxxx.......',
    '......xxxx...........xxxx.......',
    '.....xxxxxL.........Lxxxxx......',
    '.....xxxxxL.........Lxxxxx......',
    '....xxxxxxxLW.......WLxxxxxx....',
    '....xxxxx.xxLWW...WWLxx.xxxx....',
    '....xxxx..xxxLWKKKWLxxx..xxx....',
    '.....xxx...xxLWHGDWLxx...xxx....',
    '.....xxx....zsLWGWLsz..xxx......',
    '.............ssLDLss............',
    '...........x.......x............',
    '..........xxxx...xxxx...........',
    '..........xxxx...xxxx...........',
    '..........xxx.....xxx...........',
    '..........xxx.....xxx...........',
  ] },
  // de frente, flexionando: o braço cruza o peito; a camisa e o nó aparecem no vão entre o queixo e o braço
  '0/1': { de: 6, m: [
    '...........x....................',
    '..........xx....................',
    '.........xx.........xxx.........',
    '.........xx..........xxx........',
    '.........xx..........xxxx.......',
    '........xxx.........xxxxx.......',
    '........xx.x........xxxxx.......',
    '.......xxx.WW.........xxx.......',
    '......xxxx.LWKK.xxxxxxxxx.......',
    '............LHDx.xxxxxxxx.......',
    '................x...xxxx........',
    '...........xx......x............',
    '..........xxxx..................',
    '..........xxxxx.....x...........',
    '..........xxxx....xxx...........',
    '.........x.xx.....xxxx..........',
    '..................xxxx..........',
    '..................xxxx..........',
  ] },
  // 3/4 olhando pro Raichu: o lado de cá do V aparece inteiro, o de lá some na curva do peito
  '7/0': { de: 8, m: [
    '.........x......................',
    '.........x........x.............',
    '........x.........xxx...........',
    '........x..........xxxx.........',
    '.......xx.........xxxxxx........',
    '.......x..........xxxxxxx.......',
    '.......x..........xxxxxxx.......',
    '.......xx.........Lxxxxxx.......',
    '......xxxx......WLxxxxxxxx......',
    '......xxxxLW...WWLxx.xx.xx......',
    '.....xxxx.LWKKWWLxxx..xxxx......',
    '.....x.xx..LHDWLxxx..xxxx.......',
    '.............GLzxxx..xxxx.......',
    '.............Dss................',
    '...........x....................',
    '..........xxx...................',
    '..........xxx...xx..............',
    '...........xx....xx.............',
    '..........xxx....xxx............',
  ] },
  // 3/4 flexionando: os braços cruzam na frente do peito; da camisa só sobra a gola no pescoço
  '7/1': { de: 8, m: [
    '....................x...........',
    '...................xxxx.........',
    '...................xxxxx........',
    '..................xxxxxx........',
    '.................WL.xxxx........',
    '...........xxxxxx..xxxxx........',
    '.............xxxxxxxxxxx........',
    '...........x..xxxxxxxxx.........',
    '...........x.x..xxxxxxx.........',
    '...............x..xxx...........',
    '..........xxx...................',
    '..........xxxx..................',
    '..........xx.x..................',
    '..........xxx......x............',
    '..........xxx....xx.............',
    '................xxxx............',
    '.................xxx............',
    '..................xxx...........',
  ] },
};

const cor = (b, o) => (b[o + 3] ? `#${[0, 1, 2].map((k) => b[o + k].toString(16).padStart(2, '0')).join('')}` : null);

/** Canto de cima à esquerda da crista (o maior pedaço contínuo das cores dela) no quadro. */
function ancora(px, w, h) {
  const visto = new Set();
  let melhor = [];
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      if (visto.has(j * w + i) || !CRISTA.includes(px(i, j))) continue;
      const comp = [];
      const fila = [[i, j]];
      visto.add(j * w + i);
      while (fila.length) {
        const [a, c] = fila.pop();
        comp.push([a, c]);
        for (const [x, y] of [[a + 1, c], [a - 1, c], [a, c + 1], [a, c - 1]]) {
          if (x < 0 || y < 0 || x >= w || y >= h || visto.has(y * w + x) || !CRISTA.includes(px(x, y))) continue;
          visto.add(y * w + x);
          fila.push([x, y]);
        }
      }
      if (comp.length > melhor.length) melhor = comp;
    }
  return [Math.min(...melhor.map(([i]) => i)), Math.min(...melhor.map(([, j]) => j))];
}

/** Veste a folha `entrada` (a do jogo) na cor `nome` e grava em `saida`. Devolve a âncora de cada quadro. */
export async function vestir(entrada, saida, nome = 'preto') {
  const { data: b, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const orig = Buffer.from(b); // o molde lê o quadro original, pinta na cópia
  const P = { ...FIXAS, ...CORES[nome] };
  const { w, h } = ANIM;
  const log = [];
  for (const dir of DIRS) {
    const quadro = (q) => {
      const [fx, fy] = ANIM.rects[dir][q];
      return { px: (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? null : cor(orig, ((fy + j) * info.width + fx + i) * 4)), at: (i, j) => ((fy + j) * info.width + fx + i) * 4 };
    };
    for (let q = 0; q < ANIM.rects[dir].length; q++) {
      const pose = `${dir}/${q ? 1 : 0}`;
      const ref = quadro(q ? 1 : 0);
      const { px, at } = quadro(q);
      const [ai, aj] = ancora(px, w, h);
      const [ri, rj] = ancora(ref.px, w, h);
      const [di, dj] = [ai - ri, aj - rj];
      // o molde só serve se o quadro for a pose de referência deslocada
      let dif = 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (px(i, j) !== ref.px(i - di, j - dj)) dif++;
      if (dif) throw new Error(`Idle ${dir}/${q}: ${dif} pixels diferentes da pose ${pose} deslocada (${di}, ${dj})`);
      const { de, m } = MOLDES[pose];
      const terno = [];
      m.forEach((linha, k) => [...linha].forEach((c, i0) => {
        if (c === '.') return;
        const [i, j] = [i0 + di, de + k + dj];
        const atual = px(i, j);
        if (i < 0 || j < 0 || i >= w || j >= h) return;
        if (c === 'x') {
          if (!atual || atual === '#000000' || CRISTA.includes(atual) || atual === '#ffffff') return;
          b.set(hex(P[tom(atual)]), at(i, j));
          terno.push([i, j]);
        } else b.set(hex(P[c]), at(i, j));
      }));
      // R: o pixel do terno colado no contorno de fora (preto com o vazio do lado), em cima ou dos lados, acende como luz
      // de recorte nos ombros e braços; embaixo não (a luz vem de cima), e da mesa pra baixo não precisa
      const fora = (i, j) => px(i, j) === '#000000' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => !px(i + a, j + c));
      if (P.R) for (const [i, j] of terno) if (j < LINHA + dj && [[1, 0], [-1, 0], [0, -1]].some(([a, c]) => fora(i + a, j + c))) b.set(hex(P.R), at(i, j));
      log.push(`${dir}/${q}: (${ai}, ${aj})`);
    }
  }
  await sharp(b, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(saida);
  return log;
}

/** Um quadro do Idle de `folha`, ampliado `e` vezes, como buffer PNG. */
export async function recorte(folha, dir, q, e) {
  const [fx, fy] = ANIM.rects[dir][q];
  return sharp(folha).extract({ left: fx, top: fy, width: ANIM.w, height: ANIM.h }).resize(ANIM.w * e, ANIM.h * e, { kernel: 'nearest' }).png().toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = `${process.argv[2] ?? '.'}/`;
  for (const nome of Object.keys(CORES)) {
    const f = `${OUT}67-${nome}.png`;
    console.log(nome, (await vestir(FOLHA, f, nome)).join(' | '));
    const { w, h } = ANIM;
    const tiles = [];
    for (const [k, dir] of DIRS.entries())
      for (let q = 0; q < 4; q++) {
        tiles.push({ input: await recorte(FOLHA, dir, q, 10), left: q * (w * 10 + 8), top: k * 2 * (h * 10 + 8) });
        tiles.push({ input: await recorte(f, dir, q, 10), left: q * (w * 10 + 8), top: (k * 2 + 1) * (h * 10 + 8) });
      }
    await sharp({ create: { width: 4 * (w * 10 + 8), height: 4 * (h * 10 + 8), channels: 4, background: '#7a5a8a' } }).composite(tiles).png().toFile(`${OUT}prev-67-${nome}.png`);
  }
}
