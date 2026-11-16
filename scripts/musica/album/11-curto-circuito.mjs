// Faixa 11, "Curto-circuito" (`livre-lt-surge`). A corneta, duas voltas com as latas e o blecaute (a 2ª termina no A'
// em Sol menor, no SOC-CER-MON, sem a virada) e o fim: a força volta subindo, a corneta toca o toque em Sol menor, o
// último choque e o acorde. Emenda sem pausa no medley dos rivais.
import surge from '../pecas/livre-lt-surge.mjs';
import { arp, bass, drum, mel, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Curto-circuito', faixa: 11, emenda: true };

export default function curtoCircuito() {
    const { S, P, n } = estender(
        surge,
        [
            [0, 27],
            [2, 26],
        ],
        { fim: 3, tail: 2.5 },
    );
    // n · a força volta subindo e a corneta abre
    P('forcaVolta').note(n * 16, 0, 0, 1);
    mel(P('metais'), n, ['r:8 D5:2 D5:1 D5:1 G5:4']);
    drum(P('caixa'), n, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    arp(P('arpejo'), n, 'Gm', { low: 67, pattern: [0, 1, 2, 4, 2, 1, 0, 1], vel: 0.6 });
    // n+1 · o toque inteiro, com a banda
    mel(P('metais'), n + 1, ['D5:2 G5:2 Bb5:4 D6:6 Bb5:2']);
    mel(P('lead'), n + 1, ['D5:2 G5:2 Bb5:4 D6:6 Bb5:2'], { shift: 12, vel: 0.6 });
    bass(P('baixo'), n + 1, 'Gm', '0:2 8:1~ r:1 0:2 r:2 5:2 0:2 s:2 8:2');
    stabs(P('acordes'), n + 1, 'Gm', [2, 6, 10, 14], { low: 60, n: 3 });
    drum(P('bumbo'), n + 1, 1, 'X.....x.X..x....');
    drum(P('caixa'), n + 1, 1, '..o.X..o.oo.X.o.');
    drum(P('prato'), n + 1, 1, 'X...............');
    P('choque').note((n + 1) * 16 + 14, 2, 0, 1);
    // n+2 · Sol menor: corneta longa, prato, o último estalo
    mel(P('metais'), n + 2, ['G5:12 r:4']);
    mel(P('sino'), n + 2, ['G6:8 r:8']);
    stabs(P('acordes'), n + 2, 'Gm', [[0, 10]], { low: 55, n: 4 });
    bass(P('baixo'), n + 2, 'Gm', '0:10 r:6');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    drum(P('prato'), n + 2, 1, 'X...............');
    P('choque').note((n + 2) * 16 + 12, -5, 0, 0.6);
    return S;
}
