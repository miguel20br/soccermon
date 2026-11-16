// Faixa 3, "Três cartas" (`draft`). Introdução e duas voltas (a 2ª termina no A' meio tom acima, Fá# maior, sem a
// virada do baralho) e o fim nesse tom: o SOC-CER-MON na flauta com o clap, as três cartas viram uma última vez
// (esquerda, meio, direita), o baralho embaralha e fecha (um "plac" do bloco), e o Fá#maj7 fica no vibrafone.
import draft from '../pecas/draft.mjs';
import { bass, drum, GANCHO, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Três cartas', faixa: 3 };

export default function tresCartas() {
    const { S, P, n } = estender(
        draft,
        [
            [0, 35],
            [2, 34],
        ],
        { fim: 3, tail: 4 },
    );
    const virar = (b, notas) =>
        notas.forEach((x, i) => {
            const r = [8, 11, 14][i];
            mel(P(`carta${i + 1}`), b, [`r:${r} ${x}:2 r:${14 - r}`]);
            drum(P(`flip${i + 1}`), b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    const comp = (b, c) =>
        stabs(
            P('piano'),
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 4],
            ],
            { low: 58, n: 4, vel: 0.8 },
        );
    // n · o SOC-CER-MON na flauta (com terças) e as três cartas viram
    const call = GANCHO.em({ tom: 6, oitava: -1 });
    mel(P('flauta'), n, [call]);
    mel(P('terças'), n, [call], { harm: thirdBelow(MAJOR(6)) });
    drum(P('clap'), n, 1, GANCHO.palmas, { vel: 1.2 });
    bass(P('baixo'), n, 'F#maj7', '0:3 0:1 r:2 5:2 r:2 8:1 r:1 s:2 5:2');
    comp(n, 'F#maj7');
    padChord(P('cordas'), n, 'F#maj7', 16, { low: 54, n: 4, vel: 0.7 });
    drum(P('bumbo'), n, 1, 'X.......X.x.....');
    drum(P('shaker'), n, 1, 'xoxoxoxoxoxoxoxo');
    virar(n, ['C#6', 'D#6', 'F#6']);
    // n+1 · o baralho embaralha (C#7) e fecha no 4
    bass(P('baixo'), n + 1, 'C#7', '0:4 5:4 s:4 r:4');
    comp(n + 1, 'C#7');
    for (const i of [1, 2, 3]) drum(P(`flip${i}`), n + 1, 1, i === 2 ? 'x.x.x.x.xxxx....' : '....x.x.x.xx....');
    drum(P('bloco'), n + 1, 1, '............X...', { pitch: -12 });
    drum(P('bumbo'), n + 1, 1, 'X.......X...X...');
    mel(P('flauta'), n + 1, ['r:8 F5:2 G#5:2 B5:2 r:2']);
    // n+2 · Fá#maj7 no vibrafone, as cartas na mesa
    mel(P('vibrafone'), n + 2, ['A#5:16']);
    mel(P('flauta'), n + 2, ['F#5:16']);
    padChord(P('cordas'), n + 2, 'F#maj7', 16, { low: 54, n: 4 });
    stabs(P('piano'), n + 2, 'F#maj7', [[0, 16]], { low: 54, n: 4, vel: 0.8 });
    bass(P('baixo'), n + 2, 'F#', '0:16');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    for (const [i, x] of ['F#6', 'A#6', 'C#7'].entries())
        mel(P(`carta${i + 1}`), n + 2, [`r:${i * 2} ${x}:4 r:${12 - i * 2}`], { vel: 0.5 });
    return S;
}
