// Rota 1 v2 (rodada 4): no clima de "Champ de tournesol" e "Fouler l'horizon" (Komiku), que o Miguel ama: a análise
// deu ~106 a 126 BPM, tom menor (Dó# menor na "Fouler") e timbre bem mais escuro que o nosso (~450 cruzamentos/s
// contra ~1300). Então: Dó# menor que sobe (aventura, não alegria), 120 BPM, timbres quentes (triangular, piano
// elétrico, cordas, pizzicato), baixo a galope, percussão leve.
import { arp, bass, drum, I, MINOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Rota 1 v2', tela: 'Rota: Rota 1' };

export default function rota1() {
    const S = new Song({ bpm: 120, bars: 16, swing: 0.04, tail: 3, loopFrom: 0 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.2,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.25,
    });
    const harm = S.part('segunda', I.counter, { pan: 0.35, gain: 0.55, rev: 0.25 });
    const ep = S.part('epiano', I.epiano, { pan: 0.25, gain: 0.8, rev: 0.2 });
    const pz = S.part('pizz', I.pizz, { pan: -0.3, gain: 0.9 });
    const str = S.part('cordas', I.strings, { gain: 1, rev: 0.3 });
    const bs = S.part('bass', I.bass, { gain: 0.5 });
    const k = S.part('kick', I.kick, { drum: true, gain: 0.7 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 1.3 });
    const rim = S.part('aro', I.block, { drum: true, pan: -0.2, gain: 1.2 });
    const ti = S.part('timp', I.timp, { drum: true, gain: 0.5 });

    const M = [
        'G#4:4 C#5:4 E5:6 D#5:2',
        'C#5:6 B4:2 A4:8',
        'B4:4 E5:4 G#5:6 F#5:2',
        'F#5:12 D#5:4',
        'E5:4 G#5:4 C#6:6 B5:2',
        'A5:4 G#5:2 F#5:2 E5:8',
        'F#5:4 A5:4 C#6:4 B5:2 A5:2',
        'G#5:8 F#5:4 D#5:4',
        'C#6:6 B5:2 A5:4 E5:4',
        'D#6:6 C#6:2 B5:4 F#5:4',
        'B5:4 G#5:4 D#5:4 G#5:4',
        'C#6:8 B5:4 G#5:4',
        'A5:4 C#6:4 E6:4 C#6:2 A5:2',
        'B5:4 D#6:4 F#6:4 D#6:2 B5:2',
        'G#5:6 F#5:2 E5:4 B4:4',
        'G#5:4 F#5:4 D#5:4 C5:4',
    ];
    const CH = ['C#m', 'A', 'E', 'B', 'C#m', 'A', 'F#m', 'G#7', 'A', 'B', 'G#m', 'C#m', 'A', 'B', 'E', 'G#7'];
    mel(lead, 0, M);
    mel(harm, 8, M.slice(8), { harm: thirdBelow(MINOR(1)) });
    CH.forEach((c, b) => {
        bass(bs, b, c, '0:2 0:1 0:1 0:2 0:1 0:1 5:2 5:1 5:1 8:2 5:2');
        arp(pz, b, c, { low: 61, step: 2 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 4],
            ],
            { low: 56, n: 3, vel: 0.7 },
        );
        if (b >= 8) padChord(str, b, c, 16, { low: 56, n: 3 });
    });
    drum(k, 0, 16, 'x.......x.......');
    drum(sh, 0, 16, 'xoxoxoxoxoxoxoxo');
    drum(rim, 0, 16, '....x.......x...');
    drum(ti, 7, 1, '........x.x.xxxx');
    drum(ti, 15, 1, '........x.x.xxxx');
    return S;
}
