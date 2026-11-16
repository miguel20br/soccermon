// Faixa 6, "Barco e gaivota" (Cerulean v2, `extra-cerulean`, 6/8). Introdução, duas voltas (a 2ª termina no A' meio
// tom acima, sem a virada) e o fim em Mi♭ lídio: a flauta sobe até o Lá natural (o brilho do lídio), a gaivota
// responde de longe, as bolhas sobem e o barco para no Mi♭maj7.
import cerulean from '../pecas/extra-cerulean.mjs';
import { arp, bass, drum, I, mel, padChord } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Barco e gaivota', faixa: 6 };

export default function barcoEGaivota() {
    const { S, P, n } = estender(
        cerulean,
        [
            [0, 35],
            [2, 34],
        ],
        { fim: 3, tail: 5 },
    );
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.25, pan: 0.2 });
    const onda = (b, c, vel = 1) => {
        arp(P('ondas'), b, c, { low: 63, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel });
        padChord(P('pad'), b, c, 12, { low: 55, n: 3, vel: 0.8 * vel });
    };
    // n · Mi♭maj7: a flauta pergunta, a gaivota responde
    onda(n, 'Ebmaj7');
    bass(P('baixo'), n, 'Ebmaj7', '0:6 5:6');
    mel(P('flauta'), n, ['Eb5:2 G5:2 Bb5:2 D6:6']);
    mel(P('terças'), n, ['Bb4:2 Eb5:2 G5:2 Bb5:6']);
    mel(P('gaivota'), n, ['r:6 D6:2 F6:2 Bb6:2']);
    drum(P('shaker'), n, 1, 'x.o.o.x.o.o.');
    drum(P('bumbo'), n, 1, 'x.....x.....');
    P('bolhas').note(n * 12 + 9, 13, 0, 0.8);
    // n+1 · Fá sobre Mi♭ (o lídio): a flauta pousa no Lá natural e desce pro Sol
    onda(n + 1, 'F', 0.8);
    bass(P('baixo'), n + 1, 'Eb', '0:12');
    mel(P('flauta'), n + 1, ['C6:2 A5:4 G5:6']);
    mel(P('gaivota'), n + 1, ['r:8 A6:2 C7:2'], { vel: 0.7 });
    P('bolhas').note((n + 1) * 12 + 6, 15, 0, 0.7);
    P('bolhas').note((n + 1) * 12 + 9, 18, 0, 0.6);
    // n+2 · o barco para: Mi♭maj7 longo, as bolhas subindo e o prato bem baixo
    padChord(P('pad'), n + 2, 'Ebmaj7', 12, { low: 51, n: 4 });
    bass(P('baixo'), n + 2, 'Eb', '0:12');
    mel(P('flauta'), n + 2, ['Bb5:12']);
    mel(P('terças'), n + 2, ['G5:12'], { vel: 0.7 });
    arp(P('ondas'), n + 2, 'Ebmaj7', { low: 63, step: 2, rows: 6, pattern: [0, 1, 2, 3], vel: 0.6 });
    drum(cr, n + 2, 1, 'x...........');
    drum(P('bumbo'), n + 2, 1, 'x...........');
    for (const [r, p] of [
        [4, 13],
        [6, 16],
        [8, 20],
    ])
        P('bolhas').note((n + 2) * 12 + r, p, 0, 0.5);
    return S;
}
