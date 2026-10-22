// Cerulean v2 (rodada 8, extra): a Cerulean em 6/8 que o Miguel achou ÓTIMA (Ré lídio, 99 BPM, barco balançando),
// levada pra régua da rodada 6. O A fica igual; entram pergunta e resposta (a flauta pergunta, a "gaivota", um
// pícolo com eco, responde nas notas longas), uma ponte em Si menor com o Dó# lídio no Sol maior, o SOC-CER-MON em
// 6/8 com as BOLHAS respondendo "hey hey" no lugar das palmas, e a volta final meio tom acima (Mi♭ lídio).
// Forma: intro (2): ondas e bolhas | A (8) | A2 (8): terças e gaivota | B (8): a ponte | A' (8) meio tom acima |
// virada (1): Lá7, de volta pro Ré. Loop do compasso 2 ao fim (~60 s). Proposta de tela: região Cerulean no mapa.
import { arp, bass, drum, GANCHO, I, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Cerulean v2', tela: 'Mapa: Cerulean' };

const LIDIO = (t) => [2, 4, 6, 8, 9, 11, 1].map((x) => (x + t) % 12);

export default function ceruleanV2() {
    const S = new Song({ bpm: 99, bars: 35, barLen: 12, tail: 4, loopFrom: 2 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.1,
        echo: { rows: 4, fb: 0.35, mix: 0.25 },
        rev: 0.35,
    });
    const harm = S.part('terças', I.pulse, { pan: 0.35, gain: 0.4, rev: 0.3 });
    const gav = S.part('gaivota', I.piccolo, { pan: 0.5, gain: 0.8, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const ar = S.part('ondas', I.bell, { pan: 0.4, gain: 0.9, rev: 0.4 });
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.5 });
    const bub = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.35, rev: 0.4 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const blk = S.part('bloco', I.block, { drum: true, gain: 0.4, pan: -0.2 });

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
    const bar = (b, c, cheio) => {
        arp(ar, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.8 });
        bass(bs, b, c, '0:6 5:6');
        drum(sh, b, 1, 'x.o.o.x.o.o.');
        drum(k, b, 1, 'x.....x.....');
        if (cheio) drum(blk, b, 1, '......x.....');
    };
    // intro: ondas e bolhas
    for (const [b, c] of [
        [0, 'Dmaj7'],
        [1, 'A'],
    ]) {
        arp(ar, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.6 });
        bub.note(b * 12 + 9, 12, 0, 0.8);
    }
    for (const [b0, s, pass2] of [
        [2, 0, false],
        [10, 0, true],
        [26, 1, true],
    ]) {
        mel(lead, b0, M, { shift: s });
        if (pass2) mel(harm, b0, M, { shift: s, harm: thirdBelow(LIDIO(s)) });
        if (pass2) mel(gav, b0, GAV, { shift: s });
        CH.forEach((c, i) => {
            bar(b0 + i, transpose(c, s), b0 > 2);
            if (i % 2 === 0) bub.note((b0 + i) * 12 + 9, 12 + s, 0, 0.8);
        });
    }
    // B: a ponte, e o SOC-CER-MON em 6/8 com as bolhas respondendo
    mel(lead, 18, B);
    mel(harm, 22, B.slice(4, 7), { harm: thirdBelow(LIDIO(0)) });
    B_CH.forEach((c, i) => {
        bar(18 + i, c, true);
    });
    bub.note(25 * 12 + 9, 14, 0, 1);
    bub.note(25 * 12 + 11, 17, 0, 1);
    // virada: Lá7, de volta pro Ré
    bar(34, 'A7', true);
    mel(lead, 34, ['r:6 C#5:3 E5:3']);
    bub.note(34 * 12 + 9, 12, 0, 0.8);
    return S;
}
