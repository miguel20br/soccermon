// Mercado no balanço: reggae acelerado (rocksteady/ska), na direção da "Mall" (Komiku) que o Miguel curtiu, só que
// mais rápido. Sol maior, 112 BPM: guitarra no contratempo, órgão "bubble", bateria one drop, baixo melódico.
import { bass, drum, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Mercado no balanço (ska)', tela: 'Mercado' };

export default function mercadoSka() {
    const S = new Song({ bpm: 112, bars: 16, swing: 0.12, tail: 3, loopFrom: 0 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, echo: { rows: 6, fb: 0.35, mix: 0.3 } });
    const harm = S.part('harm', I.counter, { pan: 0.3, gain: 0.6 });
    const skank = S.part('skank', I.chank, { pan: 0.35, gain: 4 });
    const org = S.part('organ', I.organ, { pan: -0.35 });
    const bs = S.part('bass', I.bass, { gain: 0.75 });
    const k = S.part('kick', I.kick, { drum: true });
    const rim = S.part('rim', I.block, { drum: true, gain: 3 });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.3 });
    const tm = S.part('tom', I.tom, { drum: true });

    const M = [
        'B4:2 D5:2 G5:4 r:2 F#5:2 G5:2 A5:2',
        'G5:4 E5:4 r:4 C5:2 D5:2',
        'E5:2 F#5:2 A5:4 G5:2 F#5:2 E5:2 D5:2',
        'D5:8 r:4 B4:2 D5:2',
        'E5:2 G5:2 B5:4 r:2 A5:2 G5:2 E5:2',
        'G5:4 E5:2 C5:2 r:4 E5:2 G5:2',
        'F#5:4 A5:2 F#5:2 E5:2 D5:2 E5:2 F#5:2',
        'A5:6 r:2 C6:2 B5:2 A5:2 F#5:2',
    ];
    const END = [...M.slice(0, 7), 'G5:4 D5:4 B4:4 r:4'];
    const CH = ['G', 'C', 'D', 'G', 'Em7', 'C', 'D', 'D7', 'G', 'C', 'D', 'G', 'Em7', 'C', 'D7', 'G'];
    mel(lead, 0, [...M, ...END]);
    mel(harm, 8, END, { harm: thirdBelow(MAJOR(7)) });
    CH.forEach((c, b) => {
        stabs(skank, b, c, [4, 12], { low: 62, n: 3 });
        stabs(
            skank,
            b,
            c,
            [
                [6, 1],
                [14, 1],
            ],
            { low: 62, n: 3, vel: 0.5 },
        );
        stabs(org, b, c, [3, 7, 11, 15], { low: 55, n: 3, vel: 0.7 });
        bass(bs, b, c, '0:3 0:1 r:2 5:2 8:2 r:2 5:2 3:2');
    });
    drum(k, 0, 16, '........X.......');
    drum(rim, 0, 16, '........x.....o.', { pitch: -8 });
    drum(hh, 0, 16, 'x.x.x.x.x.x.x.x.');
    drum(tm, 7, 1, '..........x.x.x.', { pitch: 4 });
    drum(tm, 15, 1, '..........x.x.x.', { pitch: 4 });
    return S;
}
