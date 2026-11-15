// Testes de apresentador do News: o quadro 0 do Idle (de frente) do Raichu e do Machamp com terno escuro e gravata
// pintados pixel a pixel na grade da folha (a mesma paleta do contorno), e as variações boca aberta e piscando.
// Saída: <id>-terno.png = 3 quadros lado a lado (base, fala, pisca), 1x, na pasta passada (padrão: a atual).
//   node trailer/curtas/news-01/teste-terno/terno.mjs <pasta>   (precisa do midia/sprites.js com o 26: preparar.mjs)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)('sharp');
const OUT = (process.argv[2] ?? '.') + '/';
const D = new URL('../../', import.meta.url).pathname;
const s = readFileSync(D + 'midia/sprites.js', 'utf8');
const S = JSON.parse(s.slice(s.indexOf('{'), s.indexOf(';\n')));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const NADA = [0, 0, 0, 0];
const P = {
  A: hex('#000000'),
  s0: hex('#56628f'), // lapela (luz)
  s1: hex('#3a4570'), // terno
  s2: hex('#2a3358'),
  s3: hex('#1b2140'), // sombra do terno
  c0: hex('#f4f4ec'), // camisa
  c1: hex('#c3c8d8'),
  g0: hex('#e8423f'), // gravata
  g1: hex('#9c1f1f'),
};
async function quadro(id, an = 'Idle', dir = 0, fr = 0) {
  const A = S[id].anims[an];
  const [fx, fy] = A.rects[dir][fr];
  const { data, info } = await sharp(D + S[id].folha).extract({ left: fx, top: fy, width: A.w, height: A.h }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const px = [];
  for (let j = 0; j < H; j++) { px.push([]); for (let i = 0; i < W; i++) { const o = (j * W + i) * 4; px[j].push([data[o], data[o + 1], data[o + 2], data[o + 3]]); } }
  return { W, H, px };
}
const lum = ([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b;
const preto = (c) => c[3] && c[0] < 30 && c[1] < 30 && c[2] < 30;
/** Pinta o terno: os pixels de cor (não o contorno) dentro de `area(i, j)` viram terno pelo brilho de antes. */
function terno(q, area, claro = 200, medio = 150) {
  for (let j = 0; j < q.H; j++) for (let i = 0; i < q.W; i++) {
    const c = q.px[j][i];
    if (!c[3] || preto(c) || !area(i, j)) continue;
    const l = lum(c);
    q.px[j][i] = l > claro ? P.s1 : l > medio ? P.s2 : P.s3;
  }
}
const pinta = (q, pts, cor) => { for (const [i, j] of pts) if (j >= 0 && j < q.H && i >= 0 && i < q.W) q.px[j][i] = cor; };
const so = (q, pts, cor) => { for (const [i, j] of pts) if (q.px[j]?.[i] && !q.px[j][i][3]) q.px[j][i] = cor; }; // só no vazio (atrás)
const copia = (q) => ({ W: q.W, H: q.H, px: q.px.map((r) => r.map((c) => [...c])) });
async function salva(qs, out) {
  const W = qs[0].W, H = qs[0].H;
  const buf = Buffer.alloc(W * qs.length * H * 4);
  qs.forEach((q, k) => { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const o = (j * W * qs.length + k * W + i) * 4; buf.set(q.px[j][i], o); } });
  await sharp(buf, { raw: { width: W * qs.length, height: H, channels: 4 } }).png().toFile(out);
}
const linha = (i0, i1, j) => Array.from({ length: i1 - i0 + 1 }, (_, k) => [i0 + k, j]);

// ===== RAICHU (26): o tronco (linhas 22 a 29), os braços dentro; a barriga branca vira a camisa e a gravata no meio
{
  const q = await quadro(26);
  terno(q, (i, j) => j >= 22 && j <= 29 && i >= 12 && i <= 26, 225, 170);
  // a camisa: o V aberto (linhas 22 a 27) e a gravata nas colunas 19 e 20
  const V = [[18, 22], [21, 22], [17, 23], [18, 23], [21, 23], [22, 23], [17, 24], [18, 24], [21, 24], [22, 24], [18, 25], [21, 25], [18, 26], [21, 26]];
  pinta(q, V, P.c0);
  pinta(q, [[17, 22], [22, 22]], P.c1); // a ponta do colarinho
  pinta(q, [[19, 22], [20, 22]], P.g1); // o nó
  pinta(q, [[19, 23], [20, 23], [19, 24], [20, 24], [19, 25], [20, 25], [19, 26], [20, 26]], P.g0);
  pinta(q, [[20, 24], [20, 26]], P.g1);
  pinta(q, [[19, 27], [20, 27]], P.g0);
  pinta(q, [[19, 28]], P.g1);
  // as lapelas: a luz do terno ao lado do V
  pinta(q, [[16, 23], [16, 24], [17, 25], [17, 26], [23, 23], [23, 24], [22, 25], [22, 26]], P.s0);
  // o botão
  pinta(q, [[18, 28]], P.c1);
  const fala = copia(q);
  pinta(fala, [[19, 20], [20, 20], [21, 20]], P.A);
  pinta(fala, [[20, 21]], hex('#9f0000'));
  const pisca = copia(q);
  // os olhos (linha 18: pupila e brilho) viram uma linha fechada
  for (const i of [15, 16, 22, 23]) pisca.px[18][i] = hex('#ffaf47');
  pinta(pisca, [[15, 18], [16, 18], [22, 18], [23, 18]], hex('#773f00'));
  await salva([q, fala, pisca], OUT + '26-terno.png');
}

// ===== MACHAMP (68): terno no tronco e nas mangas dos 4 braços (os punhos ficam de fora). Os de cima continuam
// levantados: o da esquerda segura a folha do roteiro, o da direita aponta pro alto (o telão); o de baixo da esquerda
// cruza o peito e ajeita a gravata; o de baixo da direita segura a caneca
{
  const q = await quadro(68);
  const K = { k: hex('#d7e7df'), m: hex('#8fafb7'), d: hex('#47876f') };
  /** retângulo só no vazio: o miolo de uma cor e a borda preta (fica atrás do que já existe) */
  const ret = (i0, j0, i1, j1, cor) => {
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const borda = i === i0 || i === i1 || j === j0 || j === j1;
      so(q, [[i, j]], borda ? P.A : cor);
    }
  };
  // apaga o antebraço de baixo da esquerda (ele vai cruzar o peito)
  for (let j = 16; j <= 23; j++) for (let i = 3; i <= 11; i++) q.px[j][i] = NADA;
  // terno: tronco e pernas, as mangas de cima (abaixo dos punhos) e a de baixo da direita
  terno(q, (i, j) => (j >= 15 && j <= 29 && i >= 12 && i <= 27) || (j >= 5 && j <= 15 && (i <= 12 || i >= 27)) || (j >= 11 && j <= 18 && i >= 26), 200, 150);
  // a folha, atrás do punho de cima da esquerda, e as linhas do roteiro
  ret(0, 0, 6, 10, P.c0);
  for (const j of [2, 4, 6, 8]) for (let i = 1; i <= 4; i++) if (q.px[j][i][0] === 244) q.px[j][i] = hex('#8a94b8');
  // a camisa e a gravata no meio do peito (abaixo do queixo, linha 15)
  pinta(q, [[17, 16], [18, 16], [21, 16], [22, 16], [18, 17], [21, 17], [18, 18], [21, 18], [21, 19]], P.c0);
  pinta(q, [[16, 16], [23, 16]], P.c1);
  pinta(q, [[19, 16], [20, 16]], P.g1);
  pinta(q, [[19, 17], [20, 17], [19, 18], [20, 18], [19, 19], [20, 19], [19, 20], [20, 20], [19, 21], [20, 21]], P.g0);
  pinta(q, [[20, 18], [20, 20], [19, 22]], P.g1);
  pinta(q, [[22, 17], [22, 18], [23, 17], [22, 19]], P.s0);
  // o antebraço novo: do cotovelo (5, 16) cruzando o peito até a gravata, a manga, o punho da camisa e o punho
  pinta(q, [[5, 16], [5, 17], [5, 18], [6, 19]], P.A);
  pinta(q, [[6, 16], [7, 16], [8, 16]], P.s2);
  pinta(q, linha(9, 15, 16), P.A);
  pinta(q, linha(6, 14, 17), P.s1);
  pinta(q, [[7, 17], [10, 17]], P.s0);
  pinta(q, linha(6, 14, 18), P.s3);
  pinta(q, linha(7, 15, 19), P.A);
  pinta(q, [[15, 17], [15, 18]], P.c0);
  pinta(q, [[16, 16], [17, 16], [18, 16], [16, 20], [17, 20], [18, 20], [19, 17], [19, 18], [19, 19]], P.A);
  pinta(q, [[16, 17], [17, 17], [18, 17]], K.k);
  pinta(q, [[16, 18], [17, 18], [18, 18]], K.m);
  pinta(q, [[16, 19], [17, 19], [18, 19]], K.d);
  pinta(q, [[17, 18]], P.A); // a dobra dos dedos
  // o dedo apontando pro alto, pro telão (sai do punho de cima da direita)
  pinta(q, [[31, 1], [33, 1], [31, 0], [33, 0]], P.A);
  pinta(q, [[32, 0], [32, 1]], K.k);
  // a caneca, à direita da mão de baixo da direita: vermelha, a faixa branca, a alça e o vapor
  ret(32, 17, 37, 23, P.g0);
  so(q, [[38, 18], [38, 19], [38, 20], [38, 21], [39, 19], [39, 20]], P.A);
  for (let i = 33; i <= 36; i++) if (q.px[20][i][0] === 232) q.px[20][i] = P.c0;
  for (const j of [18, 19, 21, 22]) if (q.px[j][34][0] === 232) q.px[j][34] = hex('#ff8a7a');
  so(q, [[35, 15], [34, 14], [35, 13]], P.c1);
  const fala = copia(q);
  pinta(fala, [[18, 12], [19, 12], [20, 12]], P.A);
  pinta(fala, [[18, 13], [19, 13], [20, 13]], hex('#9f0000'));
  const pisca = copia(q);
  for (const i of [16, 17, 21, 22]) pisca.px[9][i] = hex('#d7a700');
  pinta(pisca, [[16, 9], [17, 9], [21, 9], [22, 9]], P.A);
  await salva([q, fala, pisca], OUT + '68-terno.png');
}
console.log('ok');
