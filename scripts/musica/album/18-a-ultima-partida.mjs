// Faixa 18, "A última partida", rodada 6 (23/11/2026). Era a peça dos Créditos (`livre-ultima-partida`) como estava;
// o Miguel: "pode ser AINDA MAIS EMOCIONANTE E DOLOROSA", e a "Quadra vazia" sozinha "não faz tanto sentido": ela vira
// a CODA desta. A história e o tema ficam (o veterano entra em quadra pela última vez); a peça do jogo não muda.
// O que mudou, e por quê:
// - os timbres de chip viraram os do álbum (Rhodes no lugar do piano de chip, celesta na caixinha, trombones, cordas
//   com passa-baixa) e entrou um VIOLONCELO, que canta o tema no último tempo e na homenagem: a voz dele;
// - O APITO CORTA A FRASE: no último tempo o violoncelo ainda está no meio da frase quando o juiz apita (curto,
//   curto, longo) e a banda para ali, sem chegar na cadência. O fim chegou antes de ele estar pronto;
// - A HOMENAGEM não resolve direto: o Si♭7sus4 cai no DÓ MENOR (a cadência de engano, o vi), as palmas param e o
//   violoncelo toca o SOC-CER-MON em menor, devagar, sozinho; depois o Lá♭ menor com sexta (o iv menor, a última
//   lágrima) e só então o Mi♭, baixinho, com as palmas lá longe e a bola quicando;
// - CODA, a "Quadra vazia" (`livre-ginasio`) em Mi♭ (o tom em que ele se despediu): a quadra à noite, a luz acende,
//   a bola cai e quica, um moleque dribla e assovia, o apito responde (o começo de outra história), e a luz apaga
//   banco por banco.
// Ré♭ → Lá♭ (lembrança) → Ré♭ → Mi♭. 72 / 100 / 76 BPM; coda a 104. Calma: −16 LUFS. ~2:30.
import ginasio, { ASSOVIO, apito, quique, torcida } from '../pecas/livre-ginasio.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';
import { estender } from './estender.mjs';
import { baixoDedo, celesta, rhodes, trombone } from './kit.mjs';
import { emendar, notas, rms, violoncelo } from './kit-novas.mjs';

export const meta = { titulo: 'A última partida', faixa: 18, lufs: -16 };

const T = [
    'Ab4:4 F5:6 Eb5:2 Db5:4',
    'C5:4 Eb5:4 Ab4:8',
    'Bb4:4 Db5:4 Gb5:6 F5:2',
    'F5:4 Eb5:4 Db5:4 Eb5:4',
    'Ab4:4 F5:6 Eb5:2 Db5:4',
    'C5:4 Ab5:6 G5:2 F5:4',
    'Gb5:4 F5:2 Eb5:2 Db5:4 Bb4:4',
    'Db5:6 C5:2 Eb5:8',
];
const TCH = ['Db', 'Ab', 'Bbm7', 'Gbmaj7', 'Db', 'Fm7', 'Gbmaj7', 'Ab7sus4'];
const CONTRA = [
    'F4:8 Ab4:8',
    'Eb4:8 C4:8',
    'Db4:8 F4:8',
    'Bb3:8 Db4:8',
    'F4:16',
    'Eb4:8 C4:8',
    'Db4:8 Bb3:8',
    'Gb4:8 Eb4:8',
];

export function ultima() {
    const S = new Song({ bpm: 72, bars: 37, tail: 7, bpmAt: (b) => (b < 8 ? 72 : b < 15 ? 100 : 76) });
    const ep = rhodes(S, 'piano', { pan: -0.1, gain: 0.8, rev: 0.4 });
    const cx = celesta(S, 'caixinha', { pan: 0.15, gain: 0.9, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.35 });
    const asv = S.part('assovio', ASSOVIO, { pan: 0.35, gain: 1.1, rev: 0.35 });
    const pz = S.part('pizzicato', I.pizz, { pan: -0.3, gain: 1, rev: 0.2, corte: 3500 });
    const vc = violoncelo(S, 'violoncelo', { pan: -0.05, gain: 1.2, rev: 0.4 });
    const str = S.part('cordas', I.strings, { gain: 1.8, rev: 0.4, corte: 3500 });
    const pad = S.part('pad', I.strings, { gain: 0.8, rev: 0.4, corte: 3000 });
    const met = trombone(S, 'metais', { pan: 0.2, gain: 0.7, rev: 0.35, corte: 2600 });
    const fl = S.part('flauta', I.counter, { pan: -0.25, gain: 0.6, rev: 0.35, corte: 3500 });
    const fl2 = S.part('flauta2', I.counter, { pan: 0.35, gain: 0.5, rev: 0.35, corte: 3500 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.32, corte: 900 });
    const tique = S.part('relogio', I.block, { drum: true, pan: -0.45, gain: 0.6, rev: 0.2, corte: 4000 });
    const cor = S.part('coracao', I.kick, { drum: true, gain: 0.35 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 0.7 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.4 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.22, rev: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4, rev: 0.3, corte: 6000 });
    const tcLonga = S.part('torcida', torcida(22, 18, 2), { drum: true, gain: 0.5, rev: 0.3 });
    const tcGrande = S.part('ovacao', torcida(14, 0.8), { drum: true, gain: 0.55, rev: 0.4 });
    const apC = S.part('apito', apito(0.16), { drum: true, gain: 0.6, rev: 0.45 });
    const apL = S.part('apitoLongo', apito(1.3), { drum: true, gain: 0.55, rev: 0.45 });
    const memoria = S.part('palmasMemoria', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.6 }), {
        drum: true,
        gain: 0.9,
        rev: 0.45,
    });
    const pa1 = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.5 }), {
        drum: true,
        pan: -0.25,
        gain: 1,
        rev: 0.4,
    });
    const pa2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.6, atraso: 0.015, tom: -1 }), {
        drum: true,
        pan: 0.3,
        gain: 0.9,
        rev: 0.4,
    });
    const qq = S.part('bola', quique, { drum: true, pan: 0.2, gain: 0.6, rev: 0.45 });

    // ---------- vestiário (0-7): o relógio e o piano sozinhos ----------
    mel(ep, 0, T);
    TCH.forEach((c, b) => {
        padChord(ep, b, c, 8, { low: 49, n: 3, vel: 0.4 });
        padChord(ep, b, c, 8, { low: 49, n: 3, vel: 0.3, at: 8 });
        drum(tique, b, 1, 'x...x...x...x...');
        if (b >= 4) {
            bass(bs, b, c, '0:8 5:8', { vel: 0.8 });
            padChord(pad, b, c, 16, { low: 53, n: 4, vel: 0.5 });
        }
    });

    // ---------- lembrança (8-15): a primeira partida, em Lá♭ ----------
    mel(cx, 8, T.slice(0, 6), { shift: 7 });
    mel(asv, 9, ['r:8 Bb5:2 C6:2 Eb6:4']);
    mel(asv, 11, ['r:12 Ab5:2 Bb5:2']);
    TCH.slice(0, 6).forEach((c0, i) => {
        const c = transpose(c0, 7);
        const b = 8 + i;
        bass(pz, b, c, '0:4 r:4 5:4 r:4', { oct: 12, vel: 0.9 });
        padChord(pz, b, c, 1, { low: 60, n: 3, vel: 0.5, at: 4 });
        padChord(pz, b, c, 1, { low: 60, n: 3, vel: 0.5, at: 12 });
        drum(sh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        drum(k, b, 1, 'x.......x.......');
    });
    mel(asv, 14, [GANCHO.em({ tom: 8, oitava: -1 })]);
    mel(cx, 14, [GANCHO.em({ tom: 8, oitava: -1 })]);
    bass(pz, 14, 'Ab', '0:4 r:4 5:4 r:4', { oct: 12, vel: 0.9 });
    drum(memoria, 14, 1, GANCHO.palmas);
    drum(sh, 14, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    mel(cx, 15, ['Eb6:4 C6:4 Ab5:8'], { vel: 0.6 });
    padChord(pad, 15, 'Ab', 16, { low: 56, n: 4, vel: 0.5 });

    // ---------- o último tempo (16-23): o violoncelo canta, e o apito corta a frase ----------
    mel(vc, 16, [...T.slice(0, 7), 'Db5:6 C5:2 Eb5:2 r:6'], { shift: -12 });
    mel(str, 16, CONTRA.slice(0, 7), { shift: 12, vel: 0.8 });
    mel(met, 16, CONTRA.slice(0, 7), { shift: -12, vel: 0.8 });
    mel(fl, 20, T.slice(4, 7), { shift: 12, vel: 0.55 });
    tcLonga.note(16 * 16, 0, 0, 1);
    TCH.slice(0, 7).forEach((c, i) => {
        const b = 16 + i;
        bass(bs, b, c, '0:6 0:2 5:8');
        padChord(pad, b, c, 16, { low: 53, n: 4, vel: 0.6 });
        drum(cor, b, 1, 'X..x............', { pitch: -4 });
        if (i >= 4) drum(tp, b, 1, 'x...............');
    });
    // 23: o Lá♭7sus4 começa... e no meio o apito: curto, curto, longo; a banda para ali
    bass(bs, 23, 'Ab7sus4', '0:8 r:8');
    padChord(pad, 23, 'Ab7sus4', 10, { low: 53, n: 4, vel: 0.6 });
    drum(cor, 23, 1, 'X..x............', { pitch: -4 });
    apC.note(23 * 16 + 8, 0, 0, 1);
    apC.note(23 * 16 + 11, 0, 0, 1);
    apL.note(23 * 16 + 14, 0, 0, 1);
    tcGrande.note(24 * 16 + 8, 0, 0, 1);

    // ---------- a homenagem (25-32): palmas no 3-3-2 devagar, o tema um tom acima com tudo ----------
    const PALMA = 'x.....x.....x...';
    for (let b = 25; b <= 32; b++) {
        drum(pa1, b, 1, PALMA, { vel: b < 27 ? 1 : 0.6 });
        drum(pa2, b, 1, PALMA, { vel: b < 27 ? 0.9 : 0.5 });
    }
    padChord(pad, 25, 'Eb', 32, { low: 51, n: 4, vel: 0.6 });
    bass(bs, 25, 'Eb', '0:16', { vel: 0.7 });
    bass(bs, 26, 'Eb', '0:16', { vel: 0.7 });
    drum(tp, 25, 1, 'x.....x.....x...', { vel: 0.6 });
    drum(tp, 26, 1, 'x.....x.....xxxx', { vel: 0.8 });
    mel(met, 26, [GANCHO.em({ tom: 3, oitava: -1, ritmo: [6, 6, 4, 0] })], { vel: 1.1 });
    const T2 = T.slice(0, 6);
    mel(str, 27, T2, { shift: 2 });
    mel(vc, 27, T2, { shift: -10 });
    mel(met, 27, T2, { shift: -10, vel: 0.6 });
    mel(fl, 27, T2, { shift: 14 });
    mel(fl2, 27, T2, { shift: 14, harm: thirdBelow(MAJOR(3)) });
    TCH.slice(0, 6).forEach((c0, i) => {
        const c = transpose(c0, 2);
        const b = 27 + i;
        bass(bs, b, c, '0:6 0:2 5:8');
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.7 });
        drum(tp, b, 1, 'x.......x.......', { vel: 0.7 });
    });
    drum(cr, 27, 1, 'X...............');
    // cadência: Lá♭maj7, Si♭7sus4...
    mel(str, 31, [T[6]], { shift: 2 });
    mel(str, 32, ['Eb5:6 D5:2 F5:8']);
    mel(vc, 31, ['Ab3:4 G3:2 F3:2 Eb3:4 C3:4', 'Bb2:8 Ab3:8']);
    mel(fl, 31, ['Ab6:4 G6:2 F6:2 Eb6:4 C6:4', 'Eb6:6 D6:2 F6:8']);
    for (const [b, c] of [
        [31, 'Abmaj7'],
        [32, 'Bb7sus4'],
    ]) {
        bass(bs, b, c, '0:8 5:8');
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.75 });
        drum(tp, b, 1, 'x.......x.......', { vel: 0.8 });
    }
    drum(tp, 32, 1, '............xxxx', { vel: 0.9 });
    // 33: ...e cai no DÓ MENOR. As palmas param; o violoncelo toca o SOC-CER-MON em menor, sozinho
    mel(vc, 33, ['G3:6 Eb3:6 C4:4']);
    notas(pad, 33 * 16, ['C3', 'G3', 'Bb3', 'Eb4'], 16, 0.55);
    bass(bs, 33, 'Cm', '0:16', { vel: 0.6 });
    mel(str, 33, ['G5:16'], { vel: 0.5 });
    // 34: o Lá♭ menor com sexta, a última lágrima
    mel(vc, 34, ['F3:8 Eb3:8']);
    notas(pad, 34 * 16, ['Ab2', 'Eb3', 'F3', 'B3'], 16, 0.6);
    notas(str, 34 * 16, ['B4'], 16, 0.55);
    bass(bs, 34, 'Ab', '0:16', { vel: 0.6 });
    // 35: só então o Mi♭, baixinho; o piano lembra o começo do tema, as palmas lá longe
    mel(ep, 35, ['Bb4:4 G5:6 F5:2 Eb5:4']);
    mel(vc, 35, ['Eb3:16'], { vel: 0.7 });
    padChord(pad, 35, 'Eb', 16, { low: 51, n: 4, vel: 0.5 });
    bass(bs, 35, 'Eb', '0:16', { vel: 0.5 });
    drum(pa1, 35, 1, 'x.....x.....x...', { vel: 0.35 });
    drum(pa2, 35, 1, 'x.....x.....x...', { vel: 0.3 });
    // 36: o acorde segura, a bola quica, o relógio dá dois tiques e para
    padChord(str, 36, 'Eb', 16, { low: 51, n: 4, vel: 0.45 });
    padChord(pad, 36, 'Eb', 16, { low: 51, n: 4, vel: 0.45 });
    cx.note(36 * 16, 87, 16, 0.5);
    bass(bs, 36, 'Eb', '0:16', { vel: 0.5 });
    qq.note(36 * 16 + 5, 0, 0, 0.7);
    drum(tique, 36, 1, '..........x...x.');
    return S;
}

/** A coda: a "Quadra vazia" em Mi♭ (introdução, o 1º A e o fim da peça). */
function quadraVazia() {
    return estender(
        ginasio,
        [
            [0, 12, 1],
            [29, 32, 1],
        ],
        { fim: 0, tail: 4 },
    ).S;
}

export default function aUltimaPartida() {
    const u = ultima();
    const a = u.render();
    const b = quadraVazia().render();
    // a coda entra depois de um respiro, um tico mais baixa
    return emendar([
        { som: a, em: 0 },
        { som: b, em: u.timeOfBar(37) + 2.5, ganho: (0.75 * rms(a)) / rms(b) },
    ]);
}
