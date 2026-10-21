// Abertura simples: a melodia da v1 (rodada 1) remixada no estilo da Abertura, mais leve. Pra momentos simples
// (menus secundários, tutorial, telas de espera). Dó maior, 120 BPM, funk leve.
import { arp, bass, drum, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Abertura simples', tela: 'Momentos simples' };

export default function aberturaSimples() {
    const S = new Song({ bpm: 120, bars: 18, swing: 0.14, tail: 2, loopFrom: 2 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('harm', I.counter, { pan: 0.3, gain: 0.6 });
    const bs = S.part('slap', I.slap, { gain: 0.9 });
    const ch = S.part('chank', I.chank, { gain: 2.2, pan: 0.35 });
    const st = S.part('stab', I.stab, { pan: -0.3, gain: 1.6 });
    const ar = S.part('arp', I.arp, { pan: 0.5, echo: { rows: 2, fb: 0.25, mix: 0.3 } });
    const k = S.part('kick', I.kick, { drum: true, gain: 0.8 });
    const cl = S.part('clap', I.clap, { drum: true });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.35 });
    const ag = S.part('agogo', I.agogo, { drum: true, pan: -0.25 });
    const tm = S.part('tom', I.tom, { drum: true });

    const A = [
        'E5:2 E5:2 G5:4 E5:2 D5:2 C5:4',
        'A4:2 C5:2 E5:4 D5:2 C5:2 A4:2 C5:2',
        'F5:2 E5:2 D5:2 C5:2 A4:4 C5:2 D5:2',
        'D5:4 B4:2 C5:2 D5:2 E5:2 F5:2 G5:2',
    ];
    const B = [
        'A5:4 G5:2 F5:2 E5:4 C5:4',
        'D5:2 D5:2 B4:2 D5:2 G5:4 F5:2 E5:2',
        'E5:4 B4:2 E5:2 G5:4 E5:4',
        'A5:4 G5:2 E5:2 C5:2 D5:2 E5:4',
    ];
    const E = [
        'A5:4 G5:2 F5:2 E5:4 C5:4',
        'D5:2 D5:2 B4:2 D5:2 G5:4 F5:2 E5:2',
        'G5:4 E5:4 C5:4 D5:2 E5:2',
        'C5:8 r:4 G4:2 B4:2',
    ];
    const CH = ['C', 'C', ...'C Am7 F G7 C Am7 F G7 F G Em7 Am7 F G7 C C'.split(' ')];

    mel(lead, 2, [...A, ...A, ...B, ...E]);
    mel(harm, 6, A, { harm: thirdBelow(MAJOR(0)) });
    mel(harm, 10, B, { harm: thirdBelow(MAJOR(0)) });
    CH.forEach((c, b) => {
        stabs(ch, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        if (b >= 2) {
            bass(bs, b, c, '0:2 8:1~ r:1 0:2 5:2 r:2 0:1 8:1 s:2 5:2');
            stabs(
                st,
                b,
                c,
                [
                    [3, 1],
                    [11, 2],
                ],
                { low: 64, n: 3 },
            );
        }
        if (b >= 10) arp(ar, b, c, { low: 67, step: 2 });
    });
    drum(hh, 0, 18, 'xoxoxoxoxoxoxoxo');
    drum(cl, 0, 18, '....x.......x...');
    drum(k, 2, 16, 'X.....x...X.....');
    drum(ag, 10, 8, 'x..x..x...x.x...');
    drum(tm, 9, 1, '..........x.x.x.', { pitch: 4 });
    drum(tm, 17, 1, '..........x.x.x.', { pitch: 4 });
    return S;
}
