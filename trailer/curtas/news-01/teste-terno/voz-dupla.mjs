// O roteiro e o som do teste da dupla (Raichu e Machamp, 15/11). Uma fonte só pros dois lados: daqui saem o falas.js
// (a hora de cada letra, cada forma de boca e cada sílaba, que a cena-dupla.js lê) e o voz.wav (a voz de cada um em
// cada sílaba e o blip de cada letra, no mesmo tempo).
//   node trailer/curtas/news-01/teste-terno/voz-dupla.mjs <pasta>
// A boca segue o texto letra por letra: abre no "a" e no "e", meio aberta no "i" e nas consoantes, "o" no "o" e no
// "u", fecha no m/b/p, nos espaços e na pontuação. A caixa digita uma letra a cada 55 ms (não os 0,3 s da fala
// inteira do vídeo: com boca, a fala precisa do ritmo de sílaba) e segura 0,2 s depois de "!", "," e "…".
import { writeFileSync } from 'node:fs';
import { blip, machamp, raichu } from '../../../../scripts/musica/curtas.mjs';
import { Song, writeWav } from '../../../../scripts/musica/synth.mjs';

const OUT = `${process.argv[2] ?? '.'}/`;
const DT = 0.055;
const PAUSA = 0.2;
export const ROTEIRO = [
  { quem: 'raichu', t0: 0.45, texto: 'Boa noite! Eu sou o Raichu…' },
  { quem: 'machamp', t0: 2.75, texto: '…e eu sou o Machamp.' },
  { quem: 'raichu', t0: 4.65, texto: 'Este é o Soccermon News.' },
];
const sem = (c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const VOGAL = /[aeiou]/;
/** 0 fechada, 1 meia, 2 aberta, 3 "o" */
const boca = (c) => {
  const x = sem(c);
  if (/[ae]/.test(x)) return 2;
  if (x === 'i') return 1;
  if (/[ou]/.test(x)) return 3;
  if (/[mbp]/.test(x)) return 0;
  return /[a-z]/.test(x) ? 1 : 0;
};
const FALAS = ROTEIRO.map(({ quem, t0, texto }) => {
  const chars = [];
  const bocas = [];
  const silabas = [];
  let t = t0;
  const cs = Array.from(texto);
  cs.forEach((c, i) => {
    chars.push(+t.toFixed(3));
    const b = boca(c);
    if (bocas.at(-1)?.[1] !== b) bocas.push([+t.toFixed(3), b]);
    if (VOGAL.test(sem(c)) && !VOGAL.test(sem(cs[i - 1] ?? ' '))) silabas.push(+t.toFixed(3));
    t += DT + (/[!,…]/.test(c) && i > 0 && i < cs.length - 1 ? PAUSA : 0);
  });
  bocas.push([+t.toFixed(3), 0]);
  return { quem, t0, texto, chars, bocas, silabas, fim: +t.toFixed(3) };
});
writeFileSync(`${OUT}falas.js`, `window.FALAS = ${JSON.stringify(FALAS)};\n`);

// o som: 120 BPM só pra grade (1 linha = 1/8 s); a voz em cada sílaba, o blip em cada letra
const S = new Song({ bpm: 120, bars: 4, tail: 1 });
const VOZ = {
  raichu: { p: S.part('raichu', raichu, { pan: -0.15, gain: 0.85, rev: 0.12 }), base: 67, blip: -3 },
  machamp: { p: S.part('machamp', machamp, { pan: 0.15, gain: 1.0, rev: 0.12, corte: 6000 }), base: 45, blip: -15 },
};
const bl = S.part('blip', blip, { drum: true, gain: 0.26, rev: 0.05 });
const DESENHO = [0, 2, 4, 2, 5, 3, 0, 1, 3, 5, 2, 0];
FALAS.forEach(({ quem, texto, chars, silabas }) => {
  const v = VOZ[quem];
  const cs = Array.from(texto);
  cs.forEach((c, i) => { if (/\S/.test(c)) bl.note(chars[i] * 8, v.blip + DESENHO[i % DESENHO.length], 0, i % 2 ? 0.6 : 0.75); });
  silabas.forEach((s, k) => {
    // a última sílaba antes da pontuação: "!" sobe, "." e "…" descem
    const i = chars.indexOf(s);
    const resto = cs.slice(i).join('');
    const fimFrase = /^[^ ]*[^\p{L} ]/u.test(resto) || k === silabas.length - 1;
    const sobe = /^[^ ]*!/.test(resto);
    const m = v.base + (fimFrase ? (sobe ? 5 : -2) : DESENHO[k % DESENHO.length]);
    const prox = silabas[k + 1] ?? s + 0.2;
    const dur = Math.min(0.16, Math.max(0.07, prox - s - 0.015));
    v.p.note(s * 8, m, dur * 8, 0.9);
  });
});
const [L, R] = S.render();
writeWav(`${OUT}voz.wav`, [L, R]);
console.log(FALAS.map((f) => `${f.quem} ${f.t0}–${f.fim} (${f.silabas.length} sílabas)`).join('\n'));
