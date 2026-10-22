// Abertura (Home). Aprovada pelo Miguel em 21/10: "MUITO boa, esse refrão é bem legal". Não mexer sem ele pedir.
// Dó maior, 136 BPM, samba-funk: intro, A, A com contracanto, ponte com acordes emprestados, refrão em terças, A final.
import { arp, bass, drum, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Abertura', tela: 'Home', estado: 'aprovada' };

export default function abertura() {
    const S = new Song({ bpm: 136, bars: 44, swing: 0.12, tail: 2 });
    const lead = S.part('lead', I.lead, { pan: -0.1, gain: 1, echo: { rows: 3, fb: 0.3, mix: 0.22 } });
    const harm = S.part('harm', I.pulse, { pan: 0.25, gain: 0.7 });
    const counter = S.part('counter', I.counter, { pan: -0.35, gain: 0.8 });
    const bs = S.part('bass', I.bass, { gain: 0.85 });
    const st = S.part('stab', I.stab, { pan: 0.3, gain: 0.9 });
    const ar = S.part('arp', I.arp, { pan: 0.55, gain: 0.8, echo: { rows: 2, fb: 0.25, mix: 0.3 } });
    const pad = S.part('pad', I.pad, { gain: 0.8 });
    const k = S.part('kick', I.kick, { drum: true });
    const sn = S.part('snare', I.snare, { drum: true, gain: 0.9 });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.35 });
    const oh = S.part('ohat', I.ohat, { drum: true, pan: 0.35 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.45 });
    const ag = S.part('agogo', I.agogo, { drum: true, pan: -0.25 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });
    const tm = S.part('tom', I.tom, { drum: true });

    const KICK = 'X.....x.X..x....';
    const SNARE = '....X..o.o..X..o';
    const HATS = 'x.xx.x.xx.xx.x.x'.replace(/\./g, 'o');
    const AGOGO_HI = 'x...x.x.........';
    const AGOGO_LO = '..x.....x.x.x...';
    const GROOVE = '0:3 8:1 r:2 5:2 0:1 r:1 8:2 s:2 5:2';
    const STAB = [3, 6, [10, 2], 14];
    const groove = (bar, n, { full = true, agogo = true } = {}) => {
        drum(k, bar, n, KICK);
        drum(sn, bar, n, SNARE);
        drum(hh, bar, n, HATS);
        drum(sh, bar, n, 'xoxoxoxoxoxoxoxo', { vel: full ? 1 : 0.7 });
        if (agogo) {
            drum(ag, bar, n, AGOGO_HI);
            drum(ag, bar, n, AGOGO_LO, { pitch: -5 });
        }
    };
    const fill = (bar) => {
        drum(sn, bar, 1, '....X..o..xxXxXX');
        drum(tm, bar, 1, '..........x.x...', { pitch: 5 });
        drum(tm, bar, 1, '..............x.', { pitch: -2 });
    };

    // intro (0-3): agogô, shaker e acordes
    const INTRO = ['Am7', 'Dm7', 'Fmaj7', 'G7'];
    INTRO.forEach((c, i) => {
        stabs(st, i, c, STAB, { vel: 0.8 });
        padChord(pad, i, c, 16, { vel: 0.7 });
    });
    drum(sh, 0, 4, 'xoxoxoxoxoxoxoxo');
    drum(ag, 0, 4, AGOGO_HI);
    drum(ag, 0, 4, AGOGO_LO, { pitch: -5 });
    drum(k, 2, 2, 'X.......X.......');
    fill(3);
    mel(lead, 3, ['r:8 G4:2 A4:2 B4:2 D5:2']);

    // A (4-11), A' (12-19)
    const A_CH = ['C', 'Am7', 'Fmaj7', 'G7', 'C', 'Am7', 'Dm7', 'G7'];
    const A_MEL = [
        'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
        'E5:3 C5:3 A4:2 r:2 C5:2 E5:2 G5:2',
        'A5:3 G5:3 F5:2 E5:2 C5:2 A4:2 C5:2',
        'D5:6 r:2 B4:2 C5:2 D5:2 F5:2',
        'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
        'E5:3 G5:3 A5:2 r:2 G5:2 E5:2 C5:2',
        'D5:3 F5:3 A5:2 G5:2 F5:2 E5:2 D5:2',
        'B4:2 C5:2 D5:2 G5:6 r:4',
    ];
    const A_COUNTER = [
        'G4:6 E4:2 G4:8',
        'A4:6 G4:2 E4:8',
        'F4:6 A4:2 C5:8',
        'B4:8 G4:4 F4:4',
        'E4:6 G4:2 C5:8',
        'C5:6 A4:2 E4:8',
        'F4:6 A4:2 C5:8',
        'F4:8 G4:8',
    ];
    for (const [b0, withCounter] of [
        [4, false],
        [12, true],
    ]) {
        A_CH.forEach((c, i) => {
            bass(bs, b0 + i, c, GROOVE);
            stabs(st, b0 + i, c, STAB);
            if (withCounter) arp(ar, b0 + i, c, { low: 64, step: 1 });
        });
        groove(b0, 8, { agogo: withCounter });
        mel(lead, b0, A_MEL);
        if (withCounter) mel(counter, b0, A_COUNTER);
        drum(cr, b0, 1, 'X...............');
        drum(oh, b0, 8, '..............x.');
        fill(b0 + 7);
    }

    // ponte (20-27): acordes emprestados, meio-tempo e depois volta
    const B_CH = ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Bbmaj7', 'Am7', 'Abmaj7', 'G7'];
    const B_MEL = [
        'A5:6 G5:2 E5:8',
        'G5:6 F5:2 D5:8',
        'F5:6 E5:2 C5:8',
        'E5:4 D5:4 B4:8',
        'D5:6 F5:2 A5:8',
        'G5:4 E5:4 C5:4 E5:4',
        'Eb5:6 G5:2 C6:8',
        'B5:4 A5:2 G5:2 F5:2 E5:2 D5:2 B4:2',
    ];
    B_CH.forEach((c, i) => {
        const b = 20 + i;
        bass(bs, b, c, i < 4 ? '0:8 5:4 8:4' : '0:3 8:1 r:2 5:2 0:1 r:1 8:2 s:2 5:2');
        padChord(pad, b, c, 16);
        if (i >= 4) arp(ar, b, c, { low: 62, step: 2 });
        stabs(
            st,
            b,
            c,
            i < 4
                ? [
                      [0, 6],
                      [8, 6],
                  ]
                : STAB,
            { vel: i < 4 ? 0.6 : 1 },
        );
    });
    mel(lead, 20, B_MEL);
    mel(counter, 20, ['C5:16', 'B4:16', 'A4:16', 'G4:16', 'F4:16', 'E4:16', 'Eb4:16', 'D4:8 F4:8']);
    drum(k, 20, 4, 'X.......x.......');
    drum(sn, 20, 4, '........X.......');
    drum(sh, 20, 4, 'x.o.x.o.x.o.x.o.');
    groove(24, 3);
    drum(sn, 27, 1, 'x.x.x.x.xxxxXXXX');
    drum(k, 27, 1, 'X...X...X...X...');
    drum(hh, 27, 1, 'xoxoxoxoxoxoxoxo');

    // refrão (28-35): alto, segunda voz em terças
    const C_CH = ['F', 'G', 'Em7', 'Am7', 'Dm7', 'G7', 'C', 'C'];
    const C_MEL = [
        'C6:2 C6:2 A5:2 C6:4 A5:2 G5:2 F5:2',
        'D6:2 D6:2 B5:2 D6:4 B5:2 A5:2 G5:2',
        'E6:3 D6:3 B5:2 G5:4 E5:4',
        'A5:3 G5:3 E5:2 C5:2 E5:2 G5:2 A5:2',
        'F5:2 F5:2 A5:2 C6:4 A5:2 F5:2 A5:2',
        'G5:2 G5:2 B5:2 D6:4 C6:2 B5:2 G5:2',
        'C6:8 G5:4 E5:4',
        'C5:4 r:4 G4:2 A4:2 B4:2 D5:2',
    ];
    C_CH.forEach((c, i) => {
        bass(bs, 28 + i, c, GROOVE);
        stabs(st, 28 + i, c, STAB);
        arp(ar, 28 + i, c, { low: 67, step: 1 });
        padChord(pad, 28 + i, c, 16, { vel: 0.6 });
    });
    groove(28, 8);
    drum(oh, 28, 8, '......x.......x.');
    drum(cr, 28, 1, 'X...............');
    drum(cr, 32, 1, 'X...............');
    mel(lead, 28, C_MEL);
    mel(harm, 28, C_MEL.slice(0, 7).concat(['r:16']), { harm: thirdBelow(MAJOR(0)) });

    // A final (36-43) com tudo e a melodia uma oitava acima no fim
    A_CH.forEach((c, i) => {
        bass(bs, 36 + i, c, GROOVE);
        stabs(st, 36 + i, c, STAB);
        arp(ar, 36 + i, c, { low: 64, step: 1 });
    });
    groove(36, 8);
    drum(cr, 36, 1, 'X...............');
    mel(lead, 36, A_MEL.slice(0, 4).concat(A_MEL.slice(4).map((s) => s)), {});
    mel(harm, 40, A_MEL.slice(4), { shift: 12, vel: 0.6 });
    mel(counter, 36, A_COUNTER);
    fill(43);
    return S;
}
