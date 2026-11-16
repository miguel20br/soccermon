// Faixa 4, "Pé na estrada" (Rota 1 v3, `extra-rota-1`). Introdução, duas voltas (a 2ª sem a virada de volta: termina
// no A' meio tom acima, Ré menor) e o final nesse tom: o galope, o SOC-CER-MON na flauta com o clap respondendo, a
// cadência Si♭ → Lá7 com o tímpano, e o Ré menor com nona parado no prato e na sala.
import rota1 from '../pecas/extra-rota-1.mjs';
import { arp, bass, drum, GANCHO, I, mel, padChord, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Pé na estrada', faixa: 4 };

export default function peNaEstrada() {
    const { S, P, n } = estender(rota1, [
        [0, 35],
        [2, 34],
    ]);
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35, pan: 0.2 });
    const GALOPE = '0:2 0:1 0:1 0:2 0:1 0:1 5:2 5:1 5:1 8:2 5:2';
    // n · o galope em Ré menor e o último SOC-CER-MON
    bass(P('baixo'), n, 'Dm', GALOPE);
    arp(P('pizz'), n, 'Dm', { low: 62, step: 2 });
    mel(P('flauta'), n, [GANCHO.em({ menor: true, tom: 2 })]);
    mel(P('terças'), n, [GANCHO.em({ menor: true, tom: -2 })]);
    drum(P('clap'), n, 1, GANCHO.palmas);
    drum(P('bumbo'), n, 1, 'x.......x.......');
    drum(P('shaker'), n, 1, 'xoxoxoxoxoxoxoxo');
    drum(P('aro'), n, 1, '....x.......x...');
    padChord(P('cordas'), n, 'Dm', 16, { low: 57, n: 3 });
    // n+1 · Si♭ → Lá7, o galope freia e o tímpano rola
    bass(P('baixo'), n + 1, 'Bb', '0:2 0:1 0:1 0:2 0:1 0:1 r:8');
    bass(P('baixo'), n + 1, 'A7', 'r:8 0:2 0:1 0:1 5:2 3:2');
    stabs(P('piano'), n + 1, 'Bbmaj7', [[0, 6]], { low: 57, n: 4, vel: 0.8 });
    stabs(P('piano'), n + 1, 'A7', [[8, 6]], { low: 57, n: 4, vel: 0.8 });
    mel(P('flauta'), n + 1, ['F5:3 D5:3 Bb4:2 C#5:4 E5:4']);
    mel(P('resposta'), n + 1, ['r:8 A5:2 G5:2 E5:4']);
    drum(P('tímpano'), n + 1, 1, '........x.x.xxxx');
    drum(P('shaker'), n + 1, 1, 'xoxoxoxo........');
    padChord(P('cordas'), n + 1, 'Bb', 8, { low: 57, n: 3 });
    padChord(P('cordas'), n + 1, 'A7', 8, { low: 57, n: 3, at: 8 });
    // n+2 · pouso em Ré menor (nona): flauta longa, prato, tímpano, e a sala
    bass(P('baixo'), n + 2, 'Dm', '0:16');
    mel(P('flauta'), n + 2, ['D5:16']);
    mel(P('terças'), n + 2, ['A4:16']);
    stabs(P('piano'), n + 2, 'Dm9', [[0, 16]], { low: 50, n: 5, vel: 0.8 });
    padChord(P('cordas'), n + 2, 'Dm', 16, { low: 50, n: 4 });
    drum(P('tímpano'), n + 2, 1, 'X...............');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    drum(cr, n + 2, 1, 'X...............');
    return S;
}
