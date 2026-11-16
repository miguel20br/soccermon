// Faixa 8, "O plano infalível" (`tema-rocket`, a régua do Miguel), versão estendida. 1ª volta inteira (introdução,
// A, o B do "plano" em Lá♭, o A' meio tom acima e a virada). Na 2ª volta, depois do B, um B2 NOVO de 8 compassos em
// que o plano dá errado no meio:
//   1-2 · o plano segue confiante (Ré♭maj7 → Dó7): o lead lá em cima, o órgão confirma embaixo.
//   3-4 · Fá menor: o órgão sobe na ponta do pé pelo cromático, staccato, só o baixo e o bloco... e TROPEÇA: o apito
//         descendo, o "bonk" no tom, e um tempo de silêncio (como o B da "Na ponta do pé").
//   5   · pânico: o órgão despenca pelo cromático em semicolcheias, o trio atropelado, a caixa rufando.
//   6   · os três vilões fogem: o trio uma vez cada, cada um mais longe (mais baixo e mais pro lado).
//   7-8 · se recompõem: o motivo cochichado no baixo, e o Sol#7 com o trio leva ao A' em Dó# menor.
// Depois o A' e o fim: o baixo na ponta do pé saindo de fininho, o trio cada vez mais baixo, e uma última palma 808
// molhada (um semitom abaixo, como na peça).
import rocket, { MOTIVO } from '../pecas/tema-rocket.mjs';
import { bass, drum, I, mel, padChord, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'O plano infalível', faixa: 8 };

export default function oPlanoInfalivel() {
    const { S, P, n, inicio } = estender(rocket, [[0, 27], [2, 18], 8, [18, 26]], { fim: 3, tail: 4 });
    const b2 = inicio[2];
    const desce = S.part('apitoDesce', I.whistleDown, { drum: true, gain: 2.5, pan: 0.3 });
    const bonk = S.part('bonk', I.tom, { drum: true, gain: 0.9 });
    const BASS = '0:1 r:1 8:1 r:1 3:1 r:1 4:1 5:2 r:1 s:1 5:1 4:1 3:1 r:2';
    const TRIO = [
        [8, 1],
        [10, 1],
        [12, 2],
    ];
    const groove = (b, cheio) => {
        drum(P('bumbo'), b, 1, cheio ? 'X..x....X.x...x.' : 'X.....x.X.......');
        drum(P('caixa'), b, 1, '....X..o.o..X..o');
        drum(P('chimbal'), b, 1, cheio ? 'xxXxxxXxxxXxxxXx' : 'x.x.x.x.x.x.x.x.');
        drum(P('bloco'), b, 1, 'x..x..x...x..x..');
    };
    const base = (b, c, cheio = true) => {
        groove(b, cheio);
        bass(P('baixo'), b, c, BASS);
        stabs(P('guitarra'), b, c, [2, 6, 9, 14], { low: 60, n: 3 });
    };

    // B2 · 1-2: o plano segue confiante
    base(b2, 'Dbmaj7');
    base(b2 + 1, 'C7');
    mel(P('lead'), b2, ['F5:3 Ab5:3 Db6:2 F6:4 Eb6:2 Db6:2', 'C6:6 E5:2 G5:2 Bb5:2 C6:4']);
    mel(P('orgao'), b2 + 1, ['r:8 E5:2 G5:2 Bb5:2 C6:2']);
    padChord(P('cordas'), b2, 'Dbmaj7', 16, { low: 56, n: 4, vel: 0.8 });
    padChord(P('cordas'), b2 + 1, 'C7', 16, { low: 55, n: 4, vel: 0.8 });
    drum(P('crash'), b2, 1, 'X...............');
    stabs(P('trio'), b2 + 1, 'C7', TRIO, { low: 59, n: 4 });
    // 3-4: na ponta do pé pelo cromático... e o tropeço
    for (const b of [b2 + 2, b2 + 3]) {
        bass(P('baixo'), b, 'Fm7', '0:1 r:3 5:1 r:3 0:1 r:3 5:1 r:3');
        drum(P('bloco'), b, 1, '..x...x...x...x.');
    }
    mel(P('orgao'), b2 + 2, ['C5:1 r:1 C#5:1 r:1 D5:1 r:1 D#5:1 r:1 E5:1 r:1 F5:1 r:1 F#5:1 r:1 G5:1 r:1']);
    mel(P('orgao'), b2 + 3, ['G#5:1 r:1 A5:1 r:1 A#5:1 r:1 B5:1 r:1 C6:1 r:7']);
    desce.note((b2 + 3) * 16 + 9, 0, 0, 1);
    bonk.note((b2 + 3) * 16 + 11, -4, 0, 1);
    // 5: pânico
    mel(P('orgao'), b2 + 4, ['C6:1 B5:1 Bb5:1 A5:1 Ab5:1 G5:1 F#5:1 F5:1 E5:1 Eb5:1 D5:1 Db5:1 C5:1 B4:1 Bb4:1 A4:1']);
    stabs(P('trio'), b2 + 4, 'Bdim', [0, 2, 3, 5, 6, 9, 11, 12], { low: 59, n: 3, vel: 0.9 });
    bass(P('baixo'), b2 + 4, 'G7b9', '0:1 0:1 0:1 0:1 s:1 s:1 s:1 s:1 5:1 5:1 5:1 5:1 3:1 3:1 3:1 3:1');
    drum(P('caixa'), b2 + 4, 1, 'xxXxxxXxxxXxXXXX', { vel: 0.8 });
    drum(P('bumbo'), b2 + 4, 1, 'X...X...X...X...');
    drum(P('crash'), b2 + 4, 1, 'X...............');
    // 6: os três vilões fogem, cada um mais longe
    for (const [i, r] of [0, 4, 8].entries())
        stabs(P('trio'), b2 + 5, 'G7b9', [[r, 1]], { low: 59, n: 4, vel: 1 - 0.3 * i });
    drum(P('bloco'), b2 + 5, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
    mel(P('metais'), b2 + 5, ['r:12 G3:1 r:1 G3:1 r:1'], { vel: 0.6 });
    // 7-8: se recompõem e voltam pro A' (Sol#7 → Dó# menor)
    mel(P('baixo'), b2 + 6, [MOTIVO.mel[0]], { shift: -12, vel: 0.9 });
    drum(P('bloco'), b2 + 6, 1, 'x..x..x...x..x..');
    drum(P('chimbal'), b2 + 6, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    base(b2 + 7, 'G#7');
    mel(P('orgao'), b2 + 7, ['G#5:2 B#5:2 D#6:2 F#6:2 G#6:8']);
    stabs(P('trio'), b2 + 7, 'G#7', TRIO, { low: 59, n: 4 });
    drum(P('caixa'), b2 + 7, 1, '........xxXxXXXX');

    // fim · o trio sai de fininho (Dó# menor), na ponta do pé, e a última palma molhada
    bass(P('baixo'), n, 'C#m7', BASS, { vel: 0.8 });
    drum(P('bloco'), n, 1, 'x..x..x...x..x..', { vel: 0.8 });
    stabs(P('trio'), n, 'G#7b9', [[8, 1]], { low: 59, n: 4, vel: 0.7 });
    stabs(P('trio'), n, 'G#7b9', [[10, 1]], { low: 59, n: 4, vel: 0.45 });
    stabs(P('trio'), n, 'G#7b9', [[12, 2]], { low: 59, n: 4, vel: 0.25 });
    bass(P('baixo'), n + 1, 'C#m7', '0:1 r:3 5:1 r:3 0:1 r:7', { vel: 0.6 });
    drum(P('bloco'), n + 1, 1, 'x.....x.........', { vel: 0.5 });
    mel(P('orgao'), n + 1, ['r:8 C#5:1 r:7'], { vel: 0.7 });
    drum(P('palmas'), n + 1, 1, '............X...', { vel: 1.1 });
    return S;
}
