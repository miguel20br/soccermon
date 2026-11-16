// Faixa 20 (bônus), "Só o balanço" (`menu-balanco`, a Home de hoje). Introdução, duas voltas (a 2ª termina no G3, um
// tom acima, em Si dórico, sem o Mi7 de volta) e o final no Si dórico: a bola quica, o último SOC-CER-MON com o clap
// de leve, o vibrafone responde, e o Si menor com nona fica soando no órgão.
// Rodada 2: bumbo e caixa com corpo num barramento comprimido.
import balanco from '../pecas/menu-balanco.mjs';
import { bass, drum, GANCHO, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';
import { soco } from './kit.mjs';

export const meta = { titulo: 'Só o balanço', faixa: 20 };

export default function soOBalanco() {
    const { S, P, n } = estender(
        balanco,
        [
            [0, 34],
            [2, 33],
        ],
        { fim: 3, tail: 4, ...soco({ bumbo: 'bumbo', caixa: 'caixa' }) },
    );
    const SLAP = '0:2 8:1~ r:1 0:2 r:2 5:2 s:2 8:2 5:2';
    drum(P('bola'), n - 1, 1, '......X....x..xo', { pitch: 9 });
    // n · o gancho em Si, com terças, e o clap responde
    const call = GANCHO.em({ grau: -2, tom: 2 });
    mel(P('synth'), n, [call]);
    mel(P('terças'), n, [call], { harm: thirdBelow(MAJOR(9)) });
    drum(P('clap'), n, 1, GANCHO.palmas, { vel: 0.9 });
    bass(P('baixo'), n, 'Bm9', SLAP);
    stabs(P('guitarra'), n, 'Bm9', [2, 6, 10, 14], { low: 60, n: 3 });
    padChord(P('órgão'), n, 'Bm9', 16, { low: 54, n: 4, vel: 0.75 });
    drum(P('bumbo'), n, 1, 'X.....x...x.....');
    drum(P('caixa'), n, 1, '....x.......x...');
    drum(P('chimbal'), n, 1, 'xoxxoxoxxoxxoxox', { vel: 0.7 });
    // n+1 · E9 e o vibrafone responde; a banda vai saindo
    mel(P('vibrafone'), n + 1, ['r:4 F#5:2 A5:2 C#6:4 B5:4']);
    bass(P('baixo'), n + 1, 'E9', '0:6 5:2 8:4 r:4', { vel: 0.8 });
    padChord(P('órgão'), n + 1, 'E9', 16, { low: 54, n: 4, vel: 0.7 });
    drum(P('bumbo'), n + 1, 1, 'X.........x.....');
    drum(P('chimbal'), n + 1, 1, 'x.o.x.o.x.o.....', { vel: 0.6 });
    // n+2 · Si menor com nona, longo; a bola dá o último quique
    padChord(P('órgão'), n + 2, 'Bm9', 16, { low: 54, n: 5, vel: 0.8 });
    stabs(P('clavinete'), n + 2, 'Bm9', [[0, 4]], { low: 62, n: 4, vel: 0.7 });
    mel(P('vibrafone'), n + 2, ['B5:2 C#6:14'], { vel: 0.7 });
    bass(P('baixo'), n + 2, 'Bm', '0:8 r:8', { vel: 0.8 });
    drum(P('bola'), n + 2, 1, '........x.......', { pitch: 9, vel: 0.6 });
    return S;
}
