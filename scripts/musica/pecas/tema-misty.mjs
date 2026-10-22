// Tema da Misty (rodada 6): o tema próprio da líder de Cerulean, pra tela dela; a Partida: Misty cita o motivo.
// Água e moleca: brilhante, que balança, não melosa. Si menor em 12/8 (cada linha é uma colcheia), com o Sol#
// dórico que brilha; ~84 colcheias pontuadas por minuto. Flauta, sinos, harpa, bolhas, sino bembé.
// MOTIVO (2 compassos, Bm | F#7): uma onda que sobe até o Ré, cai no Sol# e volta subindo pelo Lá#.
// Forma: intro (2) | A (8): a flauta pergunta, os sinos respondem | B (8): Ré lídio (Mi maior emprestado), a flauta e
// os sinos trocando de compasso em compasso, SOC-CER-MON nos sinos com palmas | A' (8) um tom acima (Dó# menor) |
// virada (1) em Fá#7. Loop do compasso 2 ao fim.
import { arp, bass, drum, GANCHO, I, MINOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Tema da Misty', tela: 'Misty (ginásio de Cerulean)' };

export const MOTIVO = {
    mel: ['F#5:1 A5:1 B5:1 D6:3 C#6:2 B5:1 G#5:3', 'A5:2 F#5:1 E5:3 F#5:2 A#5:1 C#6:3'],
    acordes: ['Bm', 'F#7'],
};

export default function temaMisty() {
    const S = new Song({ bpm: 84, bars: 27, barLen: 12, tail: 4, loopFrom: 2 });
    const fl = S.part('flauta', I.counter, { pan: -0.15, gain: 1.2, rev: 0.25, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const sino = S.part('sinos', I.bell, { pan: 0.3, gain: 2.4, rev: 0.35 });
    const harm = S.part('terças', I.pulse, { pan: 0.35, gain: 0.45 });
    const harpa = S.part('harpa', I.pizz, { pan: 0.45, gain: 0.6, echo: { rows: 2, fb: 0.25, mix: 0.25 } });
    const ep = S.part('piano', I.epiano, { pan: -0.3, gain: 0.7 });
    const bs = S.part('baixo', I.bass, { gain: 0.55 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.35 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const aro = S.part('aro', I.block, { drum: true, pan: 0.2, gain: 2 });
    const bembe = S.part('bembe', I.agogo, { drum: true, pan: -0.3, gain: 0.9 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.4 });
    const bolhas = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.55, rev: 0.4 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 1.8, rev: 0.2 });
    const cr = S.part('crash', I.crash, { drum: true, gain: 0.7 });

    const groove = (b, cheio) => {
        drum(k, b, 1, cheio ? 'X..x..X..x..' : 'X.....X.....');
        drum(aro, b, 1, '...x.....x..', { pitch: -5 });
        drum(bembe, b, 1, 'x.x.xx.x.x.x');
        drum(sh, b, 1, cheio ? 'xxxxxxxxxxxx' : 'x.xx.xx.xx.x');
    };
    // intro: harpa e bolhas
    for (const [b, c] of [
        [0, 'Bm'],
        [1, 'F#7'],
    ]) {
        arp(harpa, b, c, { low: 59, step: 1, rows: 12 });
        padChord(str, b, c, 12, { low: 59, vel: 0.6 });
    }
    drum(bolhas, 0, 2, '...x....x..x', { pitch: 12 });
    drum(bembe, 1, 1, 'x.x.xx.x.x.x');

    const A_CH = ['Bm', 'F#7', 'Bm', 'E', 'G', 'A', 'Em7', 'F#7'];
    const A_FL = [
        ...MOTIVO.mel,
        'r:12',
        'r:12',
        'B5:3 D6:3 G6:3 F#6:3',
        'E6:3 C#6:3 A5:6',
        'G5:3 B5:3 E6:3 D6:3',
        'C#6:6 A#5:3 F#5:3',
    ];
    const A_SINO = [
        'r:12',
        'r:12',
        'F#5:1 A5:1 B5:1 D6:3 E6:2 D6:1 B5:3',
        'G#5:3 B5:3 E6:6',
        'r:12',
        'r:12',
        'G5:3 B5:3 E6:3 D6:3',
        'C#6:6 A#5:3 F#5:3',
    ];
    const B_CH = ['Dmaj7', 'E', 'Dmaj7', 'E', 'Bm7', 'C#m7', 'D', 'G#7'];
    // B: pergunta (flauta) e resposta (sinos) a cada compasso
    const B_FL = [
        'F#6:6 E6:3 C#6:3',
        'r:12',
        'A5:3 C#6:3 F#6:3 E6:3',
        'r:12',
        'D6:3 C#6:3 B5:3 F#5:3',
        'r:12',
        'r:12',
        'B#5:3 D#6:3 F#6:3 G#6:3',
    ];
    const B_SINO = [
        'r:12',
        'B5:6 G#5:6',
        'r:12',
        'E6:6 B5:6',
        'r:12',
        'E6:3 C#6:3 G#5:6',
        GANCHO.em({ tom: 2, ritmo: [3, 3, 4, 2] }),
        'r:12',
    ];
    const parts = [
        [2, A_CH, A_FL, A_SINO, 0],
        [10, B_CH, B_FL, B_SINO, 0],
        [18, A_CH, A_FL, A_SINO, 2],
    ];
    for (const [b0, CH, F, SI, s] of parts) {
        mel(fl, b0, F, { shift: s });
        mel(sino, b0, SI, { shift: s });
        if (s) mel(harm, b0, F, { shift: s, harm: thirdBelow(MINOR(11 + s)) });
        CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            groove(b, s > 0 || b0 === 10);
            bass(bs, b, c, '0:3 5:2 8:1 0:3 5:2 3:1');
            stabs(ep, b, c, [1, 4, 7, 10], { low: 57, n: 3, vel: 0.8 });
            arp(harpa, b, c, { low: 62, step: s || b0 === 10 ? 1 : 2, rows: 12 });
            if (b0 === 10 || s) padChord(str, b, c, 12, { low: 59, n: 4 });
            if (i % 2) drum(bolhas, b, 1, '.........x.x', { pitch: 12 + (i % 3) * 2 });
        });
        drum(cr, b0, 1, 'X...........');
    }
    drum(gang, 16, 1, '..........xx', { vel: 1.2 }); // a torcida responde o SOC-CER-MON dos sinos
    // virada: Fá#7 com as bolhas subindo, de volta pro Si menor
    mel(fl, 26, ['A#5:3 C#6:3 E6:3 F#6:3']);
    bass(bs, 26, 'F#7', '0:3 5:2 8:1 s:3 5:3');
    stabs(ep, 26, 'F#7', [1, 4, 7, 10], { low: 57, n: 3 });
    arp(harpa, 26, 'F#7', { low: 62, step: 1, rows: 12 });
    groove(26, true);
    drum(bolhas, 26, 1, '......x.x.xx', { pitch: 12 });
    return S;
}
