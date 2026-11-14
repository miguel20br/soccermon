// Escalação (rodada 8): a tela onde o jogador monta o time antes do jogo. Parte do Vestiário (disco tenso, aprovado
// na rodada 4) e sobe pra régua do Tema da Rocket: mesma melodia e mesmo tique de relógio, agora com pergunta e
// resposta, SOC-CER-MON, clap 808, subida de meio tom e um loop mais longo que não cansa.
// Mi menor, 116 BPM, disco (bumbo em todo tempo, chimbal aberto no contratempo, baixo de oitava).
// Assinatura: a PRANCHETA. Cinco peças magnéticas (o 5 do futsal) batendo na prancheta em 3-3-2-ish, da esquerda pra
// direita, no fim das frases. O tique de relógio fica de fundo (mais baixo que no Vestiário).
// Pergunta e resposta: o lead pergunta nos compassos pares, os metais respondem uma oitava abaixo nos ímpares.
// Forma: intro (2) | A (8) | B (8): o refrão, cordas embaixo, termina no SOC-CER-MON em Mi menor nos metais |
// C (8): a prancheta, sem lead (clavinete, cordas, baixo) | A' (8) meio tom acima (Fá menor), lead em terças |
// virada (1): Si7b9, de volta pro Mi menor. Loop do compasso 2 ao fim (~72 s).
// Rodada 8b: "meio metálica demais". Metais, lead, terças e clavinete com ataque mais lento, onda mais cheia (o pulso
// de 12,5% e o clavinete de 7,5% eram os mais finos) e passa-baixa suave sem ressonância (`corte` da faixa: o
// `filter` do ZzFX ressoa e piorava); chimbal e crash mais baixos. Melodia e prancheta iguais.
import { bass, drum, GANCHO, I, ins, MINOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Escalação (prancheta)', tela: 'Escalação' };

// peça magnética na prancheta: "tok" grave de madeira com um estalo
export const PECA = ins({ vol: 0.4, freq: 520, a: 0.001, r: 0.05, shape: 1, slide: -3, sv: 0.15, d: 0.012 });
const PECAS = [0, 3, 6, 10, 12];
// timbres mais quentes (8b): ataque mais lento e onda mais cheia que os de I; o abafado vem do `corte` da faixa
const METAIS = ins({ vol: 0.38, a: 0.06, r: 0.16, shape: 2, curve: 0.8, sv: 0.8, d: 0.1, filter: -3200 });
const PULSO = ins({ vol: 0.34, a: 0.012, r: 0.1, shape: 5, curve: 0.5, sv: 0.6, d: 0.05 });
const CLAV = ins({ vol: 0.22, a: 0.004, r: 0.05, shape: 5, curve: 0.4, sv: 0.3, d: 0.06, filter: -3000 });

export default function escalacao() {
    const S = new Song({ bpm: 116, bars: 35, swing: 0.04, tail: 3, loopFrom: 2 });
    const lead = S.part('lead', PULSO, {
        pan: -0.1,
        gain: 1.1,
        corte: 2600,
        echo: { rows: 3, fb: 0.3, mix: 0.22 },
        rev: 0.15,
    });
    const harm = S.part('terças', PULSO, { pan: 0.35, gain: 0.45, corte: 2200 });
    const met = S.part('metais', METAIS, { pan: 0.25, gain: 0.9, corte: 1800, rev: 0.15 });
    const clav = S.part('clav', CLAV, { pan: 0.4, gain: 0.6, corte: 1800 });
    const str = S.part('cordas', I.strings, { gain: 1, rev: 0.25 });
    const bs = S.part('baixo', I.slap, { gain: 0.5 });
    const pecas = PECAS.map((_, i) =>
        S.part(`peça${i + 1}`, PECA, { drum: true, pan: -0.6 + 0.3 * i, gain: 1.4, rev: 0.12 }),
    );
    const tick = S.part('relógio', I.block, { drum: true, pan: -0.25, gain: 1.2 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.9 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 }), { drum: true, gain: 1 });
    const oh = S.part('chimbal', I.ohat, { drum: true, pan: 0.3, gain: 0.6 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.4 });
    const tm = S.part('tom', I.tom, { drum: true });
    const cr = S.part('crash', I.crash, { drum: true, gain: 0.6 });

    /** As cinco peças na prancheta (uma por jogador). */
    const prancheta = (b, vel = 1) =>
        PECAS.forEach((r, i) => {
            drum(pecas[i], b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`, { pitch: [0, 2, 3, 5, 7][i], vel });
        });
    const groove = (b, cheio) => {
        drum(k, b, 1, 'x...x...x...x...');
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo');
        drum(tick, b, 1, 'x.x.x.x.x.x.x.x.', { vel: cheio ? 0.5 : 0.9 });
        if (!cheio) return;
        drum(cl, b, 1, '....x.......x...');
        drum(oh, b, 1, '..x...x...x...x.');
    };
    const BASS = '0:2 8:2 0:2 8:2 0:2 8:2 0:1 8:1 s:2';

    const A_CH = ['Em7', 'Cmaj7', 'Am7', 'B7b9', 'Em7', 'Cmaj7', 'Am7', 'B7b9'];
    const B_CH = ['Cmaj7', 'B7b9', 'Em7', 'Em7', 'Am7', 'B7sus4', 'B7b9', 'Em7'];
    const C_CH = ['Am7', 'B7sus4', 'Cmaj7', 'B7b9', 'Am7', 'B7sus4', 'Cmaj7', 'C7'];
    // a melodia do Vestiário: os compassos pares perguntam (lead), os ímpares respondem (metais, oitava abaixo)
    const A = [
        'r:4 B4:2 E5:2 G5:3 F#5:1 E5:2 D5:2',
        'E5:6 r:2 G5:2 F#5:2 E5:2 B4:2',
        'C5:3 E5:3 A5:2 G5:2 E5:2 C5:2 A4:2',
        'B4:4 C5:2 D#5:2 F#5:4 A5:4',
        'r:4 B4:2 E5:2 G5:3 F#5:1 E5:2 D5:2',
        'E5:6 r:2 B5:2 A5:2 G5:2 E5:2',
        'A5:3 G5:3 E5:2 C5:2 D5:2 E5:2 F#5:2',
        'D#5:4 r:2 C5:2 B4:8',
    ];
    const pares = A.map((x, i) => (i % 2 ? 'r:16' : x));
    const impares = A.map((x, i) => (i % 2 ? x : 'r:16'));
    const B = [
        'G5:2 G5:2 E5:2 G5:2 B5:4 A5:2 G5:2',
        'F#5:2 F#5:2 D#5:2 F#5:2 A5:4 G5:2 F#5:2',
        'G5:4 E5:4 B4:4 E5:4',
        'F#5:2 G5:2 A5:2 B5:2 D6:4 B5:4',
        'C6:3 B5:3 A5:2 G5:2 E5:2 C5:2 E5:2',
        'E5:4 F#5:4 A5:4 B5:4',
        'C6:4 B5:2 A5:2 F#5:4 D#5:4',
        'r:16',
    ];
    const B_STR = ['E5:16', 'D#5:16', 'B4:16', 'D5:16', 'E5:16', 'E5:8 D#5:8', 'A4:8 B4:8', 'r:16'];

    // intro: relógio, baixo e a prancheta
    for (const [b, c] of [
        [0, 'Em7'],
        [1, 'B7b9'],
    ]) {
        bass(bs, b, c, BASS, { vel: 0.7 });
        drum(tick, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 1.1 });
        drum(sh, b, 1, 'x.x.x.x.x.x.x.x.');
    }
    stabs(clav, 1, 'B7b9', [3, 6, 11, 14], { low: 64, n: 3 });
    prancheta(1);

    // A e A'
    for (const [b0, s] of [
        [2, 0],
        [26, 1],
    ]) {
        mel(lead, b0, pares, { shift: s });
        mel(met, b0, impares, { shift: s - 12 });
        if (s) mel(harm, b0, A, { shift: s, harm: thirdBelow(MINOR(4 + s)) });
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            groove(b0 + i, true);
            bass(bs, b0 + i, c, BASS);
            stabs(clav, b0 + i, c, [3, 6, 11, 14], { low: 64, n: 3 });
            if (s || i >= 4) padChord(str, b0 + i, c, 16, { low: 55, n: 4, vel: 0.8 });
        });
        drum(cr, b0, 1, 'X...............');
        prancheta(b0 + 7, 0.8);
    }
    // B: o refrão, cordas embaixo, fecha com o SOC-CER-MON em Mi menor nos metais e o clap respondendo
    mel(lead, 10, B);
    mel(str, 10, B_STR);
    mel(met, 17, [GANCHO.em({ menor: true, tom: 4, oitava: -1 })], { vel: 1.2 });
    drum(cl, 17, 1, GANCHO.palmas, { vel: 1.3 });
    B_CH.forEach((c, i) => {
        groove(10 + i, true);
        bass(bs, 10 + i, c, BASS);
        stabs(clav, 10 + i, c, [3, 6, 11, 14], { low: 64, n: 3 });
    });
    drum(cr, 10, 1, 'X...............');
    drum(tm, 17, 1, 'x.x.............', { pitch: 5 });
    // C: a prancheta (sem lead), cordas e um eco da pergunta no meio
    mel(met, 22, ['r:4 B3:2 E4:2 G4:3 F#4:1 E4:2 D4:2']);
    C_CH.forEach((c, i) => {
        const b = 18 + i;
        groove(b, false);
        bass(bs, b, c, i % 2 ? BASS : '0:4 8:2 0:2 r:4 8:2 s:2');
        stabs(clav, b, c, [3, 6, 11, 14], { low: 64, n: 3, vel: 0.8 });
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.9 });
        if (i % 2) prancheta(b, 0.9);
    });
    drum(tm, 25, 1, '........x.x.xxxx', { pitch: 5 });
    // virada: Si7b9, de volta pro Mi menor
    groove(34, true);
    bass(bs, 34, 'B7b9', BASS);
    stabs(clav, 34, 'B7b9', [3, 6, 11, 14], { low: 64, n: 3 });
    prancheta(34);
    drum(tm, 34, 1, '........x.x.xxxx', { pitch: 5 });
    mel(lead, 34, ['r:8 D#5:2 F#5:2 A5:2 B4:2']);
    return S;
}
