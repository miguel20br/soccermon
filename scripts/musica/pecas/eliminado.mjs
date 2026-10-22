// Eliminado v4: a v3 que o Miguel achou perfeita, ~3 s mais longa. Entra uma segunda frase (desce por Fá e Mi)
// antes do Lá maior de consolo. Pulso em terças, baixo triangular, nada de pad nem eco longo.
import { arp, bass, I, MINOR, mel, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Eliminado v4', tela: 'Eliminado', lufs: -15 };

export default function eliminado() {
    const S = new Song({ bpm: 132, bars: 3, tail: 1.4 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, echo: { rows: 2, fb: 0.2, mix: 0.15 } });
    const harm = S.part('harm', I.thin, { pan: 0.3, gain: 0.6 });
    const bs = S.part('bass', I.counter, { gain: 1 });
    const ar = S.part('arp', I.arp, { pan: 0.4, gain: 1.2 });

    const M = ['E5:2 D5:2 C5:2 A4:4 B4:2 G#4:4', 'C5:2 B4:2 A4:2 F4:4 E4:2 G#4:4', 'A4:8 r:8'];
    mel(lead, 0, M);
    mel(harm, 0, [M[0], M[1], 'r:16'], { harm: thirdBelow(MINOR(9)) });
    bass(bs, 0, 'Am', '8:4 r:2 l:6 r:4', { oct: 12 });
    mel(bs, 1, ['F3:6 r:2 E3:6 r:2']);
    mel(bs, 2, ['A3:6 r:10']);
    arp(ar, 2, 'A', { low: 69, step: 1, rows: 5 });
    return S;
}
