// Terno da dupla do News #1 (15/11): pinta o terno no tronco de cada quadro do Idle (de frente e o 3/4 da escuta) numa
// cópia da folha do jogo. A máscara sai de cada quadro: parte da barriga (Raichu) ou de logo abaixo do bico (Golduck) e
// se espalha pelos pixels de cor sem atravessar o contorno preto, as bochechas, o bico nem as garras, só da altura do
// peito pra baixo. Cabeça, braços, orelhas, rabo e contorno ficam como estão. As cores do sprite viram 3 tons de
// azul-marinho pelo brilho (a luz continua do mesmo lado); a barriga do Raichu vira a camisa, e a borda do terno que
// encosta na camisa vira a lapela (o tom mais claro). A gravata-borboleta continua por cima, na cena.js.
//   import { vestir } from './terno2.mjs'; await vestir(26, folhaDoJogo, folhaDeTerno)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)('sharp');
const D = new URL('../../', import.meta.url).pathname;
const s = readFileSync(`${D}midia/sprites.js`, 'utf8');
const SPR = JSON.parse(s.slice(s.indexOf('{'), s.indexOf(';\n')));

const hex = (h) => [Number.parseInt(h.slice(1, 3), 16), Number.parseInt(h.slice(3, 5), 16), Number.parseInt(h.slice(5, 7), 16), 255];
const T = { s0: hex('#6a78ad'), s1: hex('#46548a'), s2: hex('#333f6e'), s3: hex('#232b52'), c0: hex('#f4f4ec'), c1: hex('#c3c8d8') };

// por Pokémon: as direções do Idle que a cena usa, a cor da âncora, o que a mancha não atravessa, de que linha (contada
// da âncora) o terno começa, e o tom de terno de cada cor do sprite
const CFG = {
  26: {
    dirs: [0, 1],
    ancora: ['#ffffff', '#fff79f', '#d7bf67', '#b78727'], // a barriga
    barreira: ['#dfb700', '#fff700'], // bochechas e rabo
    topo: () => -2, // o peito começa 2 linhas acima da barriga (logo abaixo do queixo)
    tom: { '#ffaf47': 's1', '#df871f': 's2', '#a75f1f': 's3', '#773f00': 's3' },
    camisa: { '#ffffff': 'c0', '#fff79f': 'c0', '#d7bf67': 'c1', '#b78727': 'c1' },
  },
  55: {
    dirs: [0, 7],
    ancora: ['#ffe79f', '#dfaf67', '#bf7727'], // o bico (a âncora fica de fora; o terno começa embaixo e dos lados)
    barreira: ['#ffe79f', '#dfaf67', '#bf7727', '#ffffff', '#ff875f'], // bico, garras e olhos
    topo: (dir) => (dir === 0 ? -3 : 0), // de frente: as tiras ao lado do bico viram gola; no 3/4 o braço encosta ali
    tom: { '#8fdfff': 's0', '#1f9fe7': 's1', '#0067b7': 's2' },
  },
};
const LINHA = { 26: 28, 55: 22 }; // a linha da folha no tampo da mesa (o terno vai até 2 linhas abaixo, por causa do pulinho)

const cor = (b, o) => (b[o + 3] ? `#${[0, 1, 2].map((k) => b[o + k].toString(16).padStart(2, '0')).join('')}` : null);

/** Pinta o terno num quadro (fx, fy, w, h) do buffer `b` (largura `W`). Devolve a máscara, pra conferência. */
function quadro(id, dir, b, W, fx, fy, w, h) {
  const C = CFG[id];
  const px = (i, j) => cor(b, ((fy + j) * W + fx + i) * 4);
  // a âncora: o maior pedaço contínuo das cores da âncora (o olho branco do Raichu é pequeno e fica de fora)
  const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const visto = new Set();
  let ancora = [];
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      if (visto.has(j * w + i) || !C.ancora.includes(px(i, j))) continue;
      const comp = [];
      const fila = [[i, j]];
      visto.add(j * w + i);
      while (fila.length) {
        const [a, c] = fila.pop();
        comp.push([a, c]);
        for (const [di, dj] of viz) {
          const [x, y] = [a + di, c + dj];
          if (x < 0 || y < 0 || x >= w || y >= h || visto.has(y * w + x) || !C.ancora.includes(px(x, y))) continue;
          visto.add(y * w + x);
          fila.push([x, y]);
        }
      }
      if (comp.length > ancora.length) ancora = comp;
    }
  const js = ancora.map(([, j]) => j);
  const topo = (id === 26 ? Math.min(...js) : Math.max(...js)) + C.topo(dir); // Raichu: topo da barriga; Golduck: pé do bico
  const fundo = LINHA[id] + 2;
  const pode = (i, j) => {
    const c = px(i, j);
    return c && c !== '#000000' && !C.barreira.includes(c) && j >= topo && j <= fundo;
  };
  // as sementes: a barriga inteira (Raichu) ou os pixels de cor logo abaixo do bico (Golduck)
  let sementes;
  if (id === 26) sementes = ancora.filter(([i, j]) => j >= topo);
  else {
    // de frente: as 2 linhas embaixo da ponta do bico; no 3/4 (o bico pra esquerda), também à direita da ponta
    const fim = Math.max(...js);
    const is = ancora.filter(([, j]) => j >= fim - 1).map(([i]) => i);
    const [j0, i1] = dir === 0 ? [fim + 1, Math.max(...is) + 2] : [topo, Math.max(...is) + 3];
    sementes = [];
    for (let j = j0; j <= fim + 2; j++) for (let i = Math.min(...is) - 2; i <= i1; i++) if (pode(i, j)) sementes.push([i, j]);
  }
  const area = new Set(sementes.map(([i, j]) => j * w + i));
  const fila = [...sementes];
  while (fila.length) {
    const [a, c] = fila.pop();
    for (const [di, dj] of viz) {
      const [x, y] = [a + di, c + dj];
      if (x < 0 || y < 0 || x >= w || y >= h || area.has(y * w + x) || !pode(x, y)) continue;
      area.add(y * w + x);
      fila.push([x, y]);
    }
  }
  // pinta: camisa onde era barriga, terno no resto; a borda do terno que encosta na camisa é a lapela
  const camisa = (i, j) => area.has(j * w + i) && C.camisa?.[px(i, j)];
  const novo = new Map();
  for (const k of area) {
    const [i, j] = [k % w, Math.floor(k / w)];
    const c = px(i, j);
    if (camisa(i, j)) novo.set(k, T[C.camisa[c]]);
    else if (viz.some(([di, dj]) => camisa(i + di, j + dj))) novo.set(k, T.s0);
    else novo.set(k, T[C.tom[c] ?? 's2']);
  }
  for (const [k, v] of novo) b.set(v, ((fy + Math.floor(k / w)) * W + fx + (k % w)) * 4);
  return { area, topo, n: area.size };
}

/** Lê a folha do jogo de `id`, pinta o terno nos quadros do Idle das direções da cena e grava em `saida`. */
export async function vestir(id, entrada, saida) {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const A = SPR[id].anims.Idle;
  const log = [];
  for (const dir of CFG[id].dirs)
    A.rects[dir].forEach(([fx, fy], q) => {
      const r = quadro(id, dir, data, info.width, fx, fy, A.w, A.h);
      log.push(`${dir}/${q}: topo ${r.topo}, ${r.n} px`);
    });
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(saida);
  return log;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [id, entrada, saida] = process.argv.slice(2);
  console.log((await vestir(Number(id), entrada, saida)).join('\n'));
}
