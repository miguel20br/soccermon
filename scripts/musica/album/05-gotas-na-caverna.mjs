// Faixa 5, "Gotas na caverna" (Mt. Moon v2, `extra-mt-moon`). Introdução, duas voltas (a 2ª termina no A' meio tom
// acima, Mi♭ menor, sem a virada) e o fim como a introdução ao contrário: a banda pousa no Mi♭ menor, depois só as
// gotas e o eco sumindo, e o sininho de Clefairy responde uma última vez. Faixa calma: −16 LUFS.
import mtMoon from '../pecas/extra-mt-moon.mjs';
import { bass, drum, I, mel, padChord } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Gotas na caverna', faixa: 5, lufs: -16 };

export default function gotasNaCaverna() {
    const { S, P, n } = estender(
        mtMoon,
        [
            [0, 27],
            [2, 26],
        ],
        { fim: 4, tail: 5 },
    );
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.4 });
    // n · a banda pousa: Mi♭ menor, flauta longa, o baixo insistente diminuindo
    bass(P('baixo'), n, 'Ebm', '0:2 0:2 8:2 0:2 0:2 5:2 r:4', { vel: 0.8 });
    mel(P('flauta'), n, ['Eb5:12 r:4']);
    mel(P('terças'), n, ['Bb4:12 r:4']);
    drum(P('bumbo'), n, 1, 'X...............');
    drum(P('tom'), n, 1, '........x.x.....', { pitch: 3 });
    padChord(pad, n, 'Ebm', 32, { low: 51 });
    // n+1 a n+3 · só as gotas, cada vez mais longe, e o sininho responde
    drum(P('gotas'), n + 1, 1, 'x.........x.....', { pitch: 15, vel: 0.9 });
    drum(P('gotas'), n + 2, 1, '......x.........', { pitch: 18, vel: 0.7 });
    mel(P('clefairy'), n + 2, ['r:10 Eb6:2 Gb6:2 Bb6:2'], { vel: 0.5 });
    drum(P('gotas'), n + 3, 1, 'x...............', { pitch: 15, vel: 0.5 });
    bass(P('baixo'), n + 3, 'Ebm', '0:16', { vel: 0.5 });
    return S;
}
