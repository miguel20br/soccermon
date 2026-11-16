// Faixa 6, "Barco e gaivota", rodada 2 (16/11/2026). Retorno do Miguel: "super legal, gênero diferente, agrega
// demais"; dar mais destaque pros metais graves, "uma track linda, talvez um solo". O gênero fica (barcarola em 6/8, Ré
// lídio, 99 BPM, o barco balançando: a Cerulean v2 do jogo, `extra-cerulean`, que não muda) e entra a BANDA DO CAIS:
// trombones e tuba de verdade (o naipe grave do kit, com o brilho que abre no ataque).
// O que mudou: no A2 o trombone segura as notas-guia (sétimas e terças) por baixo da flauta, e a tuba assume o baixo
// em "um-pá" (tônica no 1, quinta no 4). Depois da ponte, o CORAL DOS METAIS: o tema inteiro nos trombones em terças,
// a flauta e a gaivota respondendo em cima (pergunta e resposta invertida). Depois, o SOLO de trombone, dois coros
// (8 compassos nos acordes do A, 8 nos da ponte, com o Sol# lídio e a 13ª no Mi menor), a banda leve por baixo. A volta
// meio tom acima (Mi♭ lídio) entra pelo Si♭7 (o V do tom novo), com tudo, e a ponte também em Mi♭, com o
// SOC-CER-MON em 6/8 nas bolhas e nos metais graves. Fim: a flauta sobe até o Lá natural (o brilho do lídio), a gaivota
// responde e os metais graves fecham o Mi♭maj7 com as bolhas subindo.
// Forma: intro (2) | A (8) | A2 (8) | ponte (8) | coral dos metais (8) | solo (16) | virada (1) | A' Mi♭ (8) |
// ponte em Mi♭ (8) | fim (3). ~2:10.
import { arp, bass, drum, GANCHO, I, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';
import { aro, BATERIA, bumbo, trombone, tuba } from './kit.mjs';

export const meta = { titulo: 'Barco e gaivota', faixa: 6 };

const LIDIO = (t) => [2, 4, 6, 8, 9, 11, 1].map((x) => (x + t) % 12);
const M = [
    'F#5:6 A5:2 G#5:2 F#5:2',
    'E5:6 B4:6',
    'F#5:2 A5:2 C#6:2 B5:4 A5:2',
    'G#5:6 E5:6',
    'D5:2 F#5:2 A5:2 F#5:6',
    'B5:6 A5:2 F#5:2 D5:2',
    'E5:2 G5:2 B5:2 D6:4 C#6:2',
    'A5:12',
];
const GAV = [
    'r:12',
    'r:6 G#5:2 F#5:2 E5:2',
    'r:12',
    'r:6 B5:2 G#5:2 E5:2',
    'r:12',
    'r:12',
    'r:12',
    'r:6 C#6:2 E6:2 A6:2',
];
const CH = ['Dmaj7', 'E', 'Dmaj7', 'E', 'Bm7', 'Gmaj7', 'Em7', 'A'];
const B = [
    'D5:2 F#5:2 A5:2 B5:6',
    'A5:3 F#5:3 C#6:6',
    'B5:2 G5:2 E5:2 D5:6',
    'C#5:6 A#4:6',
    'D5:2 F#5:2 A5:2 D6:6',
    'C#6:3 B5:3 F#5:6',
    'G5:2 B5:2 E6:2 D6:6',
    GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0] }),
];
const B_CH = ['Bm7', 'Gmaj7', 'Em7', 'F#7', 'Bm7', 'Gmaj7', 'Em7', 'A7'];
// o trombone por baixo do A2: as notas-guia
const GUIA = ['C#4:12', 'B3:12', 'C#4:12', 'B3:6 G#3:6', 'D4:12', 'F#3:12', 'G3:6 B3:6', 'C#4:6 E4:6'];
const SOLO = [
    'A3:2 D4:2 F#4:2 A4:4 G#4:2',
    'B4:6 G#4:3 E4:3',
    'F#4:1 G#4:1 A4:2 C#5:2 E5:4 C#5:2',
    'D5:3 B4:3 G#4:2 E4:2 F#4:2',
    'D4:2 F#4:2 A4:2 B4:3 A4:3',
    'F#4:6 D4:2 B3:2 G3:2',
    'E4:2 G4:2 B4:2 D5:4 C#5:2',
    'C#5:9 r:3',
    'F#4:2 A4:2 D5:2 F#5:4 E5:2',
    'D5:3 B4:3 A4:2 F#4:4',
    'G4:2 B4:2 E5:2 G5:4 F#5:2',
    'E5:2 C#5:2 A#4:2 F#4:3 E4:3',
    'D4:1 E4:1 F#4:2 B4:2 D5:4 C#5:2',
    'B4:3 A4:3 F#4:3 D4:3',
    'E4:2 F#4:2 G4:2 B4:3 D5:3',
    'C#5:3 E5:3 G5:6',
];

export default function barcoEGaivota() {
    const S = new Song({ bpm: 99, bars: 70, barLen: 12, tail: 6, barramentos: { bateria: BATERIA } });
    const lead = S.part('flauta', I.counter, { pan: -0.1, gain: 1, echo: { rows: 4, fb: 0.35, mix: 0.25 }, rev: 0.35 });
    const harm = S.part('terças', I.pulse, { pan: 0.35, gain: 0.35, rev: 0.3 });
    const gav = S.part('gaivota', I.piccolo, { pan: 0.5, gain: 0.75, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const ondas = S.part('ondas', I.bell, { pan: 0.4, gain: 0.8, rev: 0.4 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.5 });
    const tb = trombone(S, 'trombone', { pan: -0.25, gain: 1, rev: 0.28 });
    const tb2 = trombone(S, 'trombone2', { pan: 0.25, gain: 0.75, rev: 0.28 });
    const tbS = trombone(S, 'solo', { pan: 0.05, gain: 1.15, rev: 0.32, echo: { rows: 6, fb: 0.2, mix: 0.12 } });
    const tu = tuba(S, 'tuba', { gain: 0.5, rev: 0.12 });
    const bub = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.35, rev: 0.4 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3 });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.6 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', gain: 0.4, pan: -0.15 });
    const blk = S.part('bloco', I.block, { drum: true, gain: 0.35, pan: -0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3, pan: 0.2 });

    /** Um compasso da barcarola; `tubaBaixo` = a tuba faz o "um-pá" no lugar do baixo. */
    const barco = (b, c, { cheio = true, tubaBaixo = false, ondasVel = 1 } = {}) => {
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel: ondasVel });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.7 });
        if (tubaBaixo) bass(tu, b, c, '0:5 r:1 5:5 r:1');
        else bass(bs, b, c, '0:6 5:6');
        drum(sh, b, 1, 'x.o.o.x.o.o.');
        drum(k, b, 1, 'x.....x.....');
        if (cheio) drum(blk, b, 1, '......x.....');
    };
    const bolha = (b, p = 12, v = 0.8) => bub.note(b * 12 + 9, p, 0, v);

    // ---------- intro (0-1): ondas e bolhas ----------
    for (const [b, c] of [
        [0, 'Dmaj7'],
        [1, 'A'],
    ]) {
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.5 });
        bolha(b);
    }
    // a tuba avisa que o barco tem banda: duas notas graves no fim da intro
    mel(tu, 1, ['r:6 A1:3 C#2:3']);

    // ---------- A (2-9) e A2 (10-17) ----------
    mel(lead, 2, M);
    mel(lead, 10, M);
    mel(harm, 10, M, { harm: thirdBelow(LIDIO(0)) });
    mel(gav, 10, GAV);
    mel(tb, 10, GUIA);
    CH.forEach((c, i) => {
        barco(2 + i, c, { cheio: false });
        barco(10 + i, c, { tubaBaixo: true });
        if (i % 2 === 0) {
            bolha(2 + i);
            bolha(10 + i);
        }
    });

    // ---------- ponte (18-25): Si menor, os trombones em terças respondem a flauta nas notas longas ----------
    const ponte = (b0, s) => {
        mel(lead, b0, B, { shift: s });
        mel(harm, b0 + 4, B.slice(4, 7), { shift: s, harm: thirdBelow(LIDIO(s)) });
        for (const [i, c] of B_CH.entries()) barco(b0 + i, transpose(c, s), { tubaBaixo: true });
        for (const [i, m] of [
            [0, 'r:6 F#4:3 D4:3'],
            [1, 'r:6 D4:6'],
            [2, 'r:6 G4:3 B4:3'],
            [3, 'r:6 A#3:6'],
            [4, 'r:6 F#4:3 A4:3'],
            [5, 'r:6 D4:6'],
            [6, 'r:6 B4:3 G4:3'],
        ]) {
            mel(tb, b0 + i, [m], { shift: s });
            mel(tb2, b0 + i, [m], { shift: s, harm: thirdBelow(LIDIO(s)) });
        }
        // o SOC-CER-MON: os metais graves cantam junto e as bolhas respondem "hey hey"
        mel(tb, b0 + 7, [GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0], oitava: -1 })], { shift: s });
        mel(tu, b0 + 7, [GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0], oitava: -3 })], { shift: s });
        bub.note((b0 + 7) * 12 + 9, 14 + s, 0, 1);
        bub.note((b0 + 7) * 12 + 11, 17 + s, 0, 1);
    };
    ponte(18, 0);

    // ---------- coral dos metais (26-33): o tema nos trombones, a flauta e a gaivota respondem ----------
    mel(tb, 26, M, { shift: -12 });
    mel(tb2, 26, M, { shift: -12, harm: thirdBelow(LIDIO(0)) });
    mel(lead, 26, GAV);
    mel(gav, 26, GAV, { shift: 12, vel: 0.6 });
    CH.forEach((c, i) => {
        barco(26 + i, c, { tubaBaixo: true, ondasVel: 0.7 });
        drum(ar, 26 + i, 1, '......x.....');
    });
    drum(cr, 26, 1, 'x...........');

    // ---------- solo de trombone (34-49): dois coros, a banda leve por baixo ----------
    mel(tbS, 34, SOLO);
    [...CH, ...B_CH].forEach((c, i) => {
        const b = 34 + i;
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 2, 1, 3, 2, 1], vel: 0.55 });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.55 });
        bass(tu, b, c, i < 8 ? '0:5 r:1 5:5 r:1' : '0:3 5:3 8:3 5:3', { vel: 0.85 });
        drum(sh, b, 1, 'x.o.o.x.o.o.', { vel: 0.8 });
        drum(k, b, 1, 'x.....x.....', { vel: 0.8 });
        if (i >= 8) drum(ar, b, 1, '......x.....', { vel: 0.8 });
        if (i % 4 === 3) bolha(b, 12, 0.6);
    });
    // a flauta comenta no fim de cada frase do solo
    for (const b of [37, 41, 45]) mel(lead, b, ['r:9 E6:1 F#6:1 A6:1'], { vel: 0.6 });

    // ---------- virada (50): Si♭7, o V do tom novo ----------
    barco(50, 'Bb7', { tubaBaixo: true });
    mel(lead, 50, ['r:6 D5:3 F5:3']);
    mel(tb, 50, ['Bb3:3 D4:3 F4:3 Ab4:3']);
    drum(blk, 50, 1, '......x.x.x.');
    bolha(50, 13, 1);

    // ---------- A' em Mi♭ lídio (51-58) com tudo, e a ponte em Mi♭ (59-66) ----------
    mel(lead, 51, M, { shift: 1 });
    mel(harm, 51, M, { shift: 1, harm: thirdBelow(LIDIO(1)) });
    mel(gav, 51, GAV, { shift: 1 });
    mel(tb, 51, GUIA, { shift: 1 });
    mel(tb2, 51, M, { shift: -11, vel: 0.55 });
    CH.forEach((c, i) => {
        barco(51 + i, transpose(c, 1), { tubaBaixo: true });
        if (i % 2 === 0) bolha(51 + i, 13);
    });
    drum(cr, 51, 1, 'x...........');
    ponte(59, 1);

    // ---------- fim (67-69): a flauta pergunta, a gaivota responde, os metais graves fecham o Mi♭maj7 ----------
    const n = 67;
    arp(ondas, n, 'Ebmaj7', { low: 63, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
    padChord(pad, n, 'Ebmaj7', 12, { low: 55, n: 3, vel: 0.8 });
    bass(tu, n, 'Ebmaj7', '0:6 5:6');
    mel(lead, n, ['Eb5:2 G5:2 Bb5:2 D6:6']);
    mel(harm, n, ['Bb4:2 Eb5:2 G5:2 Bb5:6']);
    mel(gav, n, ['r:6 D6:2 F6:2 Bb6:2']);
    drum(sh, n, 1, 'x.o.o.x.o.o.');
    drum(k, n, 1, 'x.....x.....');
    bub.note(n * 12 + 9, 13, 0, 0.8);
    // Fá sobre Mi♭ (o lídio): a flauta pousa no Lá natural
    arp(ondas, n + 1, 'F', { low: 63, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel: 0.8 });
    padChord(pad, n + 1, 'F', 12, { low: 55, n: 3, vel: 0.6 });
    mel(tu, n + 1, ['Eb2:12']);
    mel(lead, n + 1, ['C6:2 A5:4 G5:6']);
    mel(gav, n + 1, ['r:8 A6:2 C7:2'], { vel: 0.7 });
    mel(tb, n + 1, ['r:6 A3:6']);
    mel(tb2, n + 1, ['r:6 F3:6']);
    bub.note((n + 1) * 12 + 6, 15, 0, 0.7);
    bub.note((n + 1) * 12 + 9, 18, 0, 0.6);
    // o barco para: Mi♭maj7, os metais graves, as bolhas subindo
    padChord(pad, n + 2, 'Ebmaj7', 12, { low: 51, n: 4 });
    mel(tu, n + 2, ['Eb2:12']);
    mel(tb, n + 2, ['G3:12']);
    mel(tb2, n + 2, ['D3:12']);
    mel(lead, n + 2, ['Bb5:12']);
    mel(harm, n + 2, ['G5:12'], { vel: 0.7 });
    arp(ondas, n + 2, 'Ebmaj7', { low: 63, step: 2, rows: 6, pattern: [0, 1, 2, 3], vel: 0.6 });
    drum(cr, n + 2, 1, 'x...........');
    drum(k, n + 2, 1, 'x...........');
    for (const [r, p] of [
        [4, 13],
        [6, 16],
        [8, 20],
    ])
        bub.note((n + 2) * 12 + r, p, 0, 0.5);
    return S;
}
