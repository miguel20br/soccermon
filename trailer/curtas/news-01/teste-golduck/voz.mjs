// O roteiro e o som do teste da dupla Raichu e Golduck (News #1, 15/11). Daqui saem o falas.js (a hora de cada letra,
// que a cena.js lê) e o voz.wav (um blip baixinho por letra, no mesmo tempo; sem voz nem "HA").
//   node trailer/curtas/news-01/teste-golduck/voz.mjs <pasta>
// A caixa digita uma letra a cada 50 ms, segura 0,2 s depois de "!", "," e "…" no meio da frase, e cada fala fica
// inteira no mínimo 2,7 s antes da próxima (a regra de leitura do News).
import { writeFileSync } from 'node:fs';
import { blipGolduck, blipRaichu } from '../../../../scripts/musica/curtas.mjs';
import { SR, Song } from '../../../../scripts/musica/synth.mjs';

const OUT = `${process.argv[2] ?? '.'}/`;
const DT = 0.05;
const PAUSA = 0.2;
const CHEIA = 2.7;
const ROTEIRO = [
    { quem: 'raichu', rosto: '26-happy', texto: 'Boa noite! Eu sou o Raichu…' },
    { quem: 'golduck', rosto: '55-determined', texto: '…e eu sou o Golduck.' },
    { quem: 'raichu', rosto: '26-joyous', texto: 'Este é o Soccermon News.' },
];
let t = 0.5;
const FALAS = ROTEIRO.map((f) => {
    const t0 = t;
    const cs = Array.from(f.texto);
    const chars = cs.map((c, i) => {
        const at = +t.toFixed(3);
        t += DT + (/[!,…]/.test(c) && i > 0 && i < cs.length - 1 ? PAUSA : 0);
        return at;
    });
    const fim = +t.toFixed(3);
    t = fim + CHEIA + 0.1; // a próxima entra 0,1 s depois (a caixa troca o texto em t0 - 0,1)
    return { ...f, t0, chars, fim };
});
export const FIM = +(FALAS.at(-1).fim + CHEIA).toFixed(2);
writeFileSync(`${OUT}falas.js`, `window.FALAS = ${JSON.stringify(FALAS)};\nwindow.FIM = ${FIM};\n`);

// 120 BPM só pra grade (1 linha = 1/8 s). Um blip por letra (não nos espaços), num desenho de 3 alturas pra não ficar
// metralhadora; baixinho, bem abaixo da trilha.
const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2), tail: 1 });
const BLIP = {
    raichu: S.part('raichu', blipRaichu, { drum: true, gain: 0.32, pan: -0.1 }),
    golduck: S.part('golduck', blipGolduck, { drum: true, gain: 0.4, pan: 0.1 }),
};
const DESENHO = [0, 2, 0, -1, 2, 0, -2];
for (const { quem, texto, chars } of FALAS)
    Array.from(texto).forEach((c, i) => {
        if (/[\p{L}\p{N}]/u.test(c)) BLIP[quem].note(chars[i] * 8, DESENHO[i % DESENHO.length], 0, i % 2 ? 0.85 : 1);
    });
// o WAV linear, sem normalizar: o writeWav do synth leva ao pico e passa num tanh (saturação), e o blip tem que
// sair limpo e no volume que está aqui
const [L, R] = S.render();
const wav = Buffer.alloc(44 + L.length * 4);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + L.length * 4, 4);
wav.write('WAVEfmt ', 8);
for (const [v, o, b] of [[16, 16, 4], [1, 20, 2], [2, 22, 2], [SR, 24, 4], [SR * 4, 28, 4], [4, 32, 2], [16, 34, 2]]) b === 4 ? wav.writeUInt32LE(v, o) : wav.writeUInt16LE(v, o);
wav.write('data', 36);
wav.writeUInt32LE(L.length * 4, 40);
const q = (x) => Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
for (let i = 0; i < L.length; i++) {
    wav.writeInt16LE(q(L[i]), 44 + i * 4);
    wav.writeInt16LE(q(R[i]), 46 + i * 4);
}
writeFileSync(`${OUT}voz.wav`, wav);
console.log(FALAS.map((f) => `${f.quem} ${f.t0}–${f.fim}`).join('\n'), `\nfim ${FIM}`);
