// Terno do Machoke, parceiro do Raichu na bancada do News #1 (15/11): veste todos os quadros do Idle de frente (dir 0)
// e em 3/4 olhando pro Raichu (dir 7). Mesma técnica do gravata.mjs: o terno troca as cores do próprio sprite pelo
// brilho (os 4 tons do Machoke viram os 4 tons do terno, então ombro e músculo continuam com volume), e camisa,
// lapela e gravata são pixels pintados na mesma grade. Corpo, cabeça e braços não são redesenhados; crista, olhos,
// boca, mãos, pés, cueca e cinto ficam como no sprite.
// O Idle do Machoke tem 2 poses: o quadro 0 (parado, 40 ticks) e os quadros 1–3 (a flexão, 4 ticks cada, a mesma pose
// subindo e descendo 1 px). Cada pose tem um molde; cada quadro acha a âncora (o canto da crista) e o molde anda junto.
//   import { vestir, ANIM, CORES } from './terno.mjs'; await vestir(folhaDoJogo, folhaNova, 'preto')
//   node trailer/curtas/news-01/teste-machoke/terno.mjs <pasta>   (folhas das cores + prévia 10x, e confere as poses)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { PANO } from '../teste-gravata/gravata.mjs';

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
// 3º teste (15/11): terno de telejornal ("é repórter"), azul-marinho ou preto, os dois bem mais escuros que a pele lilás
// (o cinza-azulado sumia nela). Terno: L lapela, S luz, s meio, z sombra, Z sombra funda, R luz de 1 px na borda (só no
// preto, um tom acima do S e puxado pro azul: o cinza claro do 2º teste deixava a borda felpuda). Gravata dourada nos
// dois (vermelha embaixo da boca vermelha parecia língua): K nó, G frente, D sombra.
const OURO = { K: '#b07c00', H: '#fff3a0', G: '#ffcb05', D: '#b07c00' };
export const CORES = {
  marinho: { L: '#5a6cb8', S: '#34488f', s: '#273874', z: '#1b2856', Z: '#111a3a', ...OURO },
  // o pano do Raichu (gravata.mjs, PANO) nos 5 tons do Machoke: L, S, s e z iguais, Z um degrau abaixo do z
  raichu: { ...PANO, Z: '#10142a', ...OURO },
  preto: { L: '#4a4f62', S: '#33353f', s: '#25262e', z: '#1a1b21', Z: '#111115', R: '#3d4358', ...OURO },
};
const FIXAS = { '#': '#000000', W: '#f4f4ec', w: '#c3c8d8' };
const CRISTA = ['#fff700', '#dfb700', '#a76f00'];
const lum = (h) => 0.3 * Number.parseInt(h.slice(1, 3), 16) + 0.59 * Number.parseInt(h.slice(3, 5), 16) + 0.11 * Number.parseInt(h.slice(5, 7), 16);
// os tons do Machoke: #d7c7ef (208) → S, #a797c7 e o rosa #ff875f (161, 166) → s, #7f6f97 e o vermelho #d73f00 (120, 102) → z, #5f4777 (84) → Z
const tom = (c) => { const l = lum(c); return l > 185 ? 'S' : l > 140 ? 's' : l > 95 ? 'z' : 'Z'; };

// Moldes, nas coordenadas do quadro de referência de cada pose: linha → pedaços "<letra><col>" ou "<letra><col>-<col>"
// (o de depois vale). 'x' vira terno pelo brilho (contorno preto, crista e cinto nunca); as outras letras são pintadas.
// A gravata segue o eixo do tronco do quadro: nó de 3 px no pé do V (abaixo do queixo, nunca colado na boca), lâmina
// de 2 px (G no eixo, D de sombra à direita) e a ponta de 1 px no cinto; a camisa é um V de lapelas simétricas.
const MOLDES = {
  // de frente, parado: eixo na coluna 15 (crista, queixo, fivela); boca na linha 15, queixo 16, cinto 20–21
  '0/0': {
    10: 'x8-11 x19-22', 11: 'x7-9 x21-23', 12: 'x6-9 x21-24', 13: 'x6-9 x21-24',
    14: 'x5-9 L10 L20 x21-25', 15: 'x5-9 L10 L20 x21-25',
    16: 'x4-10 L11 L19 x20-26',
    17: 'x4-10 L11 W12-13 K14-16 W17-18 L19 x20-26',
    18: 'x4-11 L12 W13-14 G15 D16 W17 L18 x19-26',
    19: 'x4-12 L13 W14 G15 D16 L17 x18-26',
    20: 'x4-7 D15 x23-26',
    22: 'x11 x19', 23: 'x10-13 x17-20', 24: 'x10-13 x17-20', 25: 'x10-12 x18-20', 26: 'x10-12 x18-20',
  },
  // de frente, flexionando: o corpo sobe 3 linhas; o braço cruza o peito e só sobra um vão entre o queixo e o braço,
  // com o eixo do tronco na coluna 13 (o nó encosta no braço, a lâmina desce até a linha do cinto)
  '0/1': {
    6: 'x11', 7: 'x10-11', 8: 'x9-10 x20-22', 9: 'x9-10 x21-23', 10: 'x9-10 x21-24', 11: 'x8-10 x20-24',
    12: 'x8-9 L11 x20-24',
    13: 'x7-9 L11 W12 x22-24',
    14: 'x6-9 W11 K12-14 x16-24',
    15: 'W12 G13 D14 W15 x17-24',
    16: 'D13 x16 x20-23',
    17: 'x11-12 x19', 18: 'x10-13', 19: 'x10-14 x20', 20: 'x10-13 x18-20', 21: 'x9 x11-12 x18-21',
    22: 'x18-21', 23: 'x18-21',
  },
  // 3/4 olhando pro Raichu: eixo na coluna 13 (risco do peito, fivela); o lado de cá do V aparece inteiro, o de lá
  // encolhe na curva do peito
  '7/0': {
    8: 'x9', 9: 'x9 x18', 10: 'x8 x18-20', 11: 'x8 x19-22', 12: 'x7-8 x18-23', 13: 'x7 x18-24', 14: 'x7 x18-24',
    15: 'x7-8 L18 x19-24',
    16: 'x6-9 W16 L17 x18-25',
    17: 'x6-9 L10 W11 K12-14 W15-16 L17 x18-25',
    18: 'x5-8 x10 L11 W12 G13 D14 W15-16 L17 x18-25',
    19: 'x5 x7-8 x11 L12 G13 D14 W15 L16 x17-24',
    20: 'D13 x15-18 x21-24',
    22: 'x11', 23: 'x10-12', 24: 'x10-12 x16-17', 25: 'x11-12 x18-19', 26: 'x10-12 x18-20',
  },
  // 3/4 flexionando: os braços cruzam na frente do peito; da camisa só sobra a gola ao lado do queixo
  '7/1': {
    8: 'x20', 9: 'x19-22', 10: 'x19-23', 11: 'x18-23', 12: 'W17 L18 x20-23', 13: 'x11-16 x19-23', 14: 'x13-23',
    15: 'x11 x14-22', 16: 'x11 x13 x16-22', 17: 'x15 x18-20', 18: 'x10-12', 19: 'x10-13', 20: 'x10-11 x13',
    21: 'x10-12 x19', 22: 'x10-12 x17-18', 23: 'x16-19', 24: 'x17-19', 25: 'x18-20',
  },
};
/** "x4-10 L11 W12-13" → as 32 colunas da linha. */
const linha = (spec) => {
  const r = Array(32).fill('.');
  for (const t of spec.split(' ')) {
    const [a, b = a] = t.slice(1).split('-').map(Number);
    for (let i = a; i <= b; i++) r[i] = t[0];
  }
  return r;
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
      const terno = [];
      for (const [j0, spec] of Object.entries(MOLDES[pose])) linha(spec).forEach((c, i0) => {
        if (c === '.') return;
        const [i, j] = [i0 + di, Number(j0) + dj];
        const atual = px(i, j);
        if (i < 0 || j < 0 || i >= w || j >= h) return;
        if (c === 'x') {
          if (!atual || atual === '#000000' || CRISTA.includes(atual) || atual === '#ffffff') return;
          b.set(hex(P[tom(atual)]), at(i, j));
          terno.push([i, j]);
        } else b.set(hex(P[c]), at(i, j));
      });
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
