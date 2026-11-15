// Teste da dupla de apresentadores do News (15/11): Raichu e Machamp de terno, sentados lado a lado na bancada.
// Tudo pintado pixel a pixel na grade da folha PMD (o quadro 0 do Idle, de frente), em camadas que a cena empilha:
//   26-rosto.png   Raichu: grade 4 bocas (fechada, meia, aberta, "o") x 3 olhos (normal, pisca, olha pro parceiro)
//   68-rosto.png   Machamp: o mesmo, com o braço de cima da direita ajeitando a gravata (linhas 4 a 6: o puxão)
//   68-gesto.png   o braço de cima da esquerda: 3 quadros (dedo pra cima, mão aberta pro parceiro, mão no alto)
//   68-frente.png  os dois braços de baixo apoiados na mesa segurando a folha (na frente da bancada)
//   caneca.png     2 canecas (amarela, vermelha) x 4 quadros do vapor
// Uso: node trailer/curtas/news-01/teste-terno/dupla.mjs <pasta>   (precisa do midia/sprites.js com o 26 e o 68)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)('sharp');
const OUT = `${process.argv[2] ?? '.'}/`;
const D = new URL('../', import.meta.url).pathname;
const s = readFileSync(`${D}midia/sprites.js`, 'utf8');
const S = JSON.parse(s.slice(s.indexOf('{'), s.indexOf(';\n')));
const hex = (h) => [Number.parseInt(h.slice(1, 3), 16), Number.parseInt(h.slice(3, 5), 16), Number.parseInt(h.slice(5, 7), 16), 255];
const NADA = [0, 0, 0, 0];
// a paleta dos desenhos (letra → cor); as letras minúsculas são as de cada Pokémon (abaixo)
const BASE = {
  '#': '#000000',
  S: '#56628f', T: '#3a4570', U: '#2a3358', V: '#1b2140', // terno: luz, meio, sombra, sombra funda
  W: '#f4f4ec', X: '#c3c8d8', // camisa
  R: '#e8423f', Q: '#9c1f1f', // gravata
  L: '#8a94b8', // as linhas do roteiro na folha
  r: '#b0202a', t: '#ff7a7a', // boca por dentro, língua
};

async function quadro(id, y0, H) {
  const A = S[id].anims.Idle;
  const [fx, fy] = A.rects[0][0];
  const { data, info } = await sharp(D + S[id].folha).extract({ left: fx, top: fy + y0, width: A.w, height: H }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let j = 0; j < info.height; j++) {
    px.push([]);
    for (let i = 0; i < info.width; i++) { const o = (j * info.width + i) * 4; px[j].push([data[o], data[o + 1], data[o + 2], data[o + 3]]); }
  }
  return { W: info.width, H: info.height, px };
}
const copia = (q) => ({ W: q.W, H: q.H, px: q.px.map((r) => r.map((c) => [...c])) });
const vazio = (W, H) => ({ W, H, px: Array.from({ length: H }, () => Array.from({ length: W }, () => [...NADA])) });
/** Carimba um desenho em texto (uma string por linha) com o canto em (x0, y0); '.' não mexe, ' ' apaga. */
function carimba(q, linhas, x0, y0, pal) {
  linhas.forEach((l, j) => [...l].forEach((ch, i) => {
    const x = x0 + i, y = y0 + j;
    if (ch === '.' || y < 0 || y >= q.H || x < 0 || x >= q.W) return;
    if (ch === ' ') { q.px[y][x] = [...NADA]; return; }
    const h = pal[ch] ?? BASE[ch];
    if (!h) throw new Error(`cor sem nome: ${ch}`);
    q.px[y][x] = hex(h);
  }));
}
/** Uma grade de quadros (linhas x colunas) num PNG só. */
async function salva(grade, out) {
  const W = grade[0][0].W, H = grade[0][0].H, nc = grade[0].length, nl = grade.length;
  const buf = Buffer.alloc(W * nc * H * nl * 4);
  grade.forEach((linha, l) => linha.forEach((q, k) => {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) buf.set(q.px[j][i], ((l * H + j) * W * nc + k * W + i) * 4);
  }));
  await sharp(buf, { raw: { width: W * nc, height: H * nl, channels: 4 } }).png().toFile(out);
}
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
const preto = (c) => c[3] && c[0] < 30 && c[1] < 30 && c[2] < 30;

// ===================================== RAICHU (26) =====================================
// O quadro vai da linha 6 à 31 da folha (26 linhas; a mesa cobre da 28 pra baixo). O terno começa na linha 24 (no
// teste anterior, 22): as linhas 20 a 23 ficam pra boca, e o colarinho branco separa a boca da gravata.
{
  const Y = 6;
  const q = await quadro(26, Y, 26);
  const pal = { a: '#a75f1f', b: '#773f00', c: '#dfb700', d: '#fff700', e: '#df871f', f: '#ffaf47', g: '#ffffff' };
  for (let j = 24; j <= 31; j++) for (let i = 12; i <= 26; i++) {
    const c = q.px[j - Y]?.[i];
    if (!c || !c[3] || preto(c)) continue;
    const l = lum(c);
    q.px[j - Y][i] = hex(l > 225 ? BASE.T : l > 170 ? BASE.U : BASE.V);
  }
  // o colarinho, o nó, a gravata (2 pixels), a camisa em V e as lapelas (colunas 16 a 23)
  carimba(q, [
    '.XWQQWX.', // 24
    'SWWRRWWS',
    'SWWRQWWS',
    '.SWRRWS.',
    '.SWRQWS.',
    '..TRRT..',
    '..XQ....', // 30
  ], 16, 24 - Y, pal);
  // a boca: 4 formas nas colunas 17 a 21, linhas 20 a 23 (o nariz é o (19, 20))
  const BOCAS = [
    ['ff#ff', 'fffff', 'f###f', 'fffff'], // fechada
    ['ff#ff', 'f###f', 'f#r#f', 'ff#ff'], // meia
    ['f###f', '#rrr#', '#rtr#', 'f###f'], // aberta
    ['ff#ff', 'f#r#f', 'f#t#f', 'ff#ff'], // "o"
  ];
  // os olhos (colunas 15 a 24, linhas 18 e 19): pisca e olha pra direita (o Machamp), 1 pixel
  const OLHOS = [null, ['ff.....ff', '##.....##'], ['f#g....fg#', 'fb#....f#b']];
  const grade = OLHOS.map((olho) => BOCAS.map((b) => {
    const k = copia(q);
    carimba(k, b, 17, 20 - Y, pal);
    if (olho) carimba(k, olho, 15, 18 - Y, pal);
    return k;
  }));
  await salva(grade, `${OUT}26-rosto.png`);
}

// ===================================== MACHAMP (68) =====================================
// O quadro inteiro (40 x 30). A cabeça é a do sprite (linhas 3 a 15); o resto é desenho novo: os ombros largos de
// terno, a cintura mais estreita (o vão entre ela e os braços de baixo deixa cada braço se ler), o braço de cima da
// direita dobrado até o nó da gravata, os de baixo na mesa (camada da frente) e o de cima da esquerda gesticulando
// (camada própria). Os braços são de terno mais claro que o tronco. A mesa cobre da linha 24 pra baixo.
{
  const orig = await quadro(68, 0, 30);
  const pal = { a: '#d7e7df', b: '#8fafb7', c: '#47876f', d: '#d7a700', e: '#ffe79f', f: '#a75f1f', g: '#ffffff', h: '#ff570f', i: '#9f0000', j: '#fff700' };
  const q = vazio(40, 30);
  // o tronco (só os preenchimentos; o contorno sai sozinho)
  carimba(q, [
    '..........TTTT...........TTTT...........', // 10
    '........TTTTTTTT.......TTTTTTTT.........',
    '.......SSSTTTTTTTTTTTTTTTTTTTTTU........',
    '.......SSTTTTTTTTTTTTTTTTTTTTTTU........',
    '.......STTTTTTUUWUUUUUWUUTTTTTUU........',
    '.......TTTTTTUUSWWUUUWWSUUTTTUUU........', // 15
    '........TTTTTUUSWWQRQWWSUUTTUUU.........',
    '..........UUUUUUSWRRQWSUUUUUU...........',
    '..........UUUUUUUSRRQSUUUUUUU...........',
    '..........UUUUUUUSRRQSUUUUUUU...........',
    '..........UUUUUUUUSRSUUUUUUUU...........', // 20
    '..........UUUUUUUUUQUUUUUUUUU...........',
    '..........VVUUUUUUUUUUUUUUUVV...........',
    '..........VVUUUUUUUUUUUUUUUVV...........',
    '..........VVUUUUUUUUUUUUUUUVV...........',
    '..........VVUUUUUUUUUUUUUUUVV...........', // 25
    '..........VVUUUUUUUUUUUUUUUVV...........',
  ], 0, 10, pal);
  contorno(q);
  // a cabeça do sprite por cima (por linha, só a cabeça: os ombros do sprite eram dos braços levantados)
  const CAB = { 3: [17, 21], 4: [15, 23], 5: [15, 23], 6: [15, 23], 7: [15, 23], 8: [14, 24], 9: [14, 24], 10: [14, 24], 11: [15, 23], 12: [15, 23], 13: [16, 22], 14: [17, 21], 15: [18, 20] };
  for (const [j, [i0, i1]] of Object.entries(CAB)) for (let i = i0; i <= i1; i++) if (orig.px[j][i][3]) q.px[j][i] = [...orig.px[j][i]];
  // o braço de cima da direita: o ombro sai pro lado, o cotovelo aberto e o antebraço volta pelo peito até o nó
  // (carimbo na coluna 20; o puxão é o mesmo braço 1 pixel pra esquerda, a mão em cima do nó)
  const GRAVATA = [
    '...........TT#...', // 12
    '...........TTT#..',
    '.###.######STTU#.',
    '#aab#WSSSSSSSTTU#', // 15
    '#abb#XTTTTTTTTUU#',
    '.#cc#XUUUUUUUUU#.',
    '..##.#########...',
  ];
  const BOCAS = [ // colunas 16 a 22, linhas 11 a 14
    ['deeeeed', 'fe###ed', '#eeeee#', '.#eee#.'], // fechada
    ['deeeeed', 'fi###id', '#eiiie#', '.#eee#.'], // meia
    ['de###ed', 'f#hhh#d', '#ihhhi#', '.#iii#.'], // aberta
    ['deeeeed', 'fe###ed', '#e#h#e#', '.#e#e#.'], // "o"
  ];
  const OLHOS = [null, ['dd...dd', '##...##'], ['.......', '#g...#g']]; // colunas 16 a 22, linhas 8 e 9 (pisca, olha pra esquerda)
  const grade = [];
  for (const x of [20, 19]) for (const olho of OLHOS) grade.push(BOCAS.map((b) => {
    const k = copia(q);
    carimba(k, b, 16, 11, pal);
    if (olho) carimba(k, olho, 16, 8, pal);
    carimba(k, GRAVATA, x, 12, pal);
    return k;
  }));
  // as linhas: 0-2 = a mão parada no nó (olho normal, pisca, olha); 3-5 = o puxão
  await salva(grade, `${OUT}68-rosto.png`);

  // o braço de cima da esquerda gesticulando, numa folha mais larga (4 colunas a mais à esquerda: x0 = -4)
  const G = (desenho) => { const k = vazio(44, 30); carimba(k, desenho, 0, 0, pal); return k; };
  const GESTOS = [
    [ // dedo pra cima, do lado da cabeça
      '', '',
      '.......#........', // 2
      '......#a#.......',
      '......#a##......',
      '.....#aabb#.....', // 5
      '.....#abbc#.....',
      '.....#bbcc#.....',
      '......#XW#......',
      '.....#STTU#.....',
      '.....#STTU#.....', // 10
      '.....#STTU####..',
      '.....#STTSSSSTTT',
      '.....#TTTTTTTTTT',
      '......#UUUTTTTTT',
      '.......###UUUUU#', // 15
      '..........#####.',
    ],
    [ // a mão aberta pro lado do parceiro (a palma pra cima), o braço esticado
      '', '', '', '', '', '', '', '', '',
      '..........######', // 9
      '##.......#STTTTT', // 10
      '#a#.####SSSSTTTT',
      '#ab#XTTTTTTTTTTT',
      '#abbWTTTTTTTTTTT',
      '.#bcXUUUUTTTTTTT',
      '..##########UUU#', // 15
      '............###.',
    ],
    [ // a mão no alto, aberta (o "olha só"), o antebraço inclinado
      '', '',
      '..#.#.#.........', // 2
      '..#a#a#.........',
      '.#aaaaa#........',
      '.#abbbc#........', // 5
      '..#bbc#.........',
      '...#XW#.........',
      '...#STU#........',
      '....#STU#.......',
      '....#STTU#......', // 10
      '.....#STTU####..',
      '.....#STTSSSSTTT',
      '.....#TTTTTTTTTT',
      '......#UUUTTTTTT',
      '.......###UUUUU#', // 15
      '..........#####.',
    ],
  ];
  await salva([GESTOS.map(G)], `${OUT}68-gesto.png`);

  // a frente: a folha e os dois braços de baixo descendo pelos lados e apoiados na mesa (o da direita é o espelho do
  // da esquerda), as mãos segurando a folha pelas bordas
  const f = vazio(40, 30);
  carimba(f, [
    '###########', // 19 (colunas 14 a 24)
    '#WWWWWWWWW#',
    '#WLLLLLLLW#',
    '#WWWWWWWWW#',
    '#WLLLLLLWW#',
    '#WWWWWWWWW#',
    '#WLLLLLWWW#', // 25
    '#WWWWWWWWW#',
    '###########',
  ], 14, 19, pal);
  carimba(f, [
    '..#####........', // 16
    '.#STTTU#.......',
    '.#STTTU#.......',
    '.#STTTU#.......',
    '.#STTTU#.......', // 20
    '.#STTTU######..',
    '.#STTTTSSSSXa#.',
    '.#TTTTTTTTTWaa#',
    '.#UTTTTTTTTXbb#',
    '..#UUUUUUUUXcc#', // 25
    '...########.##.',
  ], 0, 16, pal);
  for (let j = 16; j <= 26; j++) for (let i = 0; i <= 14; i++) if (f.px[j][i][3]) f.px[j][38 - i] = [...f.px[j][i]];
  await salva([[f]], `${OUT}68-frente.png`);
}

// ===================================== CANECAS =====================================
{
  const CAN = [
    '', '', '', '', '', '',
    '.#######...', // 6
    '.#kkkkk#...',
    '.#MMMMM###.',
    '.#MNNNM#.#.',
    '.#MNNNM#.#.', // 10
    '.#MMMMM###.',
    '.#OMMMO#...',
    '..#####....',
  ];
  // o vapor: dois fiapos ondulando pra cima (a onda anda 1 linha por quadro), mais transparentes no alto; 4 quadros
  const ONDA = [0, 1, 1, 0, -1, -1];
  const linhas = [['#ffcb05', '#fff3a0', '#d99a00'], ['#e8423f', '#f4f4ec', '#b02a2a']].map(([M, N, O]) => [0, 1, 2, 3].map((fq) => {
    const k = vazio(11, 14);
    carimba(k, CAN, 0, 0, { k: '#5a3418', M, N, O });
    for (const [w, bx] of [[0, 2], [1, 6]]) for (let y = 0; y <= 5; y++) {
      const x = bx + ONDA[(y + 2 * fq + w) % 6];
      k.px[y][x] = [221, 227, 242, Math.round(255 * (0.2 + 0.6 * (y / 5)))];
    }
    return k;
  }));
  await salva(linhas, `${OUT}caneca.png`);
}

/** O contorno de 1 pixel em volta do que foi pintado (só nos vazios vizinhos, nas 4 direções). */
function contorno(q) {
  const marca = [];
  for (let j = 0; j < q.H; j++) for (let i = 0; i < q.W; i++) {
    if (q.px[j][i][3]) continue;
    const viz = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].some(([x, y]) => q.px[y]?.[x]?.[3] && !preto(q.px[y][x]));
    if (viz) marca.push([i, j]);
  }
  for (const [i, j] of marca) q.px[j][i] = hex('#000000');
}
console.log('ok');
