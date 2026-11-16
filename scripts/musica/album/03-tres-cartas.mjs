// Faixa 3, "Três cartas" (`draft`, jazz-funk leve com vibrafone). Rodada 2 (16/11/2026): o Miguel pediu mais
// variedade e desenvolvimento (antes eram duas voltas iguais). Agora a 2ª metade conta outra coisa.
// Forma: a 1ª volta inteira (intro, A em Fá, B em Ré menor com o vibrafone, C no respiro dos emprestados Ré♭ e Mi♭,
// A' meio tom acima em Fá#) | A MESA (8, nova): o vibrafone e a flauta trocam de 2 em 2 compassos (pergunta e
// resposta de jazz) num ii–V de Fá# com o Ré#7 (dominante secundária do ii) e fecham no Si7, o V de Mi menor, enquanto
// o baralho embaralha | o B de novo, um tom acima (Mi menor) | o A' em SOL (a 3ª tonalidade: Fá → Fá# → Sol, cada
// subida com a sua virada) | final em Sol: o SOC-CER-MON na flauta com o clap, as três cartas viram uma última vez, o
// baralho fecha e o Solmaj7 fica no vibrafone.
// Punch: bumbo e caixa do kit num barramento comprimido (o clap do jogo já é o 808 macio).
import draft from '../pecas/draft.mjs';
import { bass, drum, GANCHO, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, bumbo } from './kit.mjs';

export const meta = { titulo: 'Três cartas', faixa: 3 };

const MESA = [
    ['F#maj7', 'vibrafone', 'A#5:2 C#6:2 E#6:4 r:2 D#6:2 C#6:2 A#5:2'],
    ['D#m7', 'vibrafone', 'C#6:3 A#5:3 F#5:2 r:4 G#5:2 A#5:2'],
    ['G#m7', 'flauta', 'r:2 B5:2 D#6:2 F#6:4 D#6:2 C#6:2 B5:2'],
    ['C#7', 'flauta', 'A#5:3 G#5:3 E#5:2 B4:4 C#5:4'],
    ['F#maj7', 'vibrafone', 'F#6:2 E#6:2 C#6:2 A#5:2 G#5:2 A#5:2 C#6:4'],
    ['D#7', 'vibrafone', 'C#6:3 A#5:3 G5:2 D#5:8'],
    ['G#m7', 'flauta', 'B5:4 G#5:4 E#5:4 C#5:4'],
    ['B7', 'flauta', 'D#5:2 F#5:2 A5:2 B5:2 D#6:8'],
];

export default function tresCartas() {
    const { S, P, n, inicio } = estender(draft, [[0, 34], 8, [10, 18, 2], [26, 34, 1]], {
        fim: 3,
        tail: 4,
        barramentos: { bateria: BATERIA },
        bus: { bumbo: 'bateria', clap: 'bateria' },
        troca: { bumbo: { inst: bumbo, gain: 0.75 } },
    });
    const virar = (b, notas) => {
        notas.forEach((x, i) => {
            const r = [8, 11, 14][i];
            mel(P(`carta${i + 1}`), b, [`r:${r} ${x}:2 r:${14 - r}`]);
            drum(P(`flip${i + 1}`), b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    };
    const comp = (
        b,
        c,
        rows = [
            [0, 3],
            [6, 2],
            [10, 4],
        ],
    ) => stabs(P('piano'), b, c, rows, { low: 58, n: 4, vel: 0.8 });
    const groove = (b) => {
        drum(P('bumbo'), b, 1, 'X.......X.x.....');
        drum(P('clap'), b, 1, '....x.......x...');
        drum(P('chimbal'), b, 1, 'x.xxx.x.x.xxx.x.');
        drum(P('shaker'), b, 1, 'xoxoxoxoxoxoxoxo');
    };

    // ---------- a mesa: vibrafone e flauta de 2 em 2, o baralho embaralha no fim ----------
    const m0 = inicio[1];
    MESA.forEach(([c, quem, m], i) => {
        const b = m0 + i;
        mel(P(quem), b, [m]);
        if (i === 6) {
            comp(b, 'G#m7', [
                [0, 3],
                [6, 2],
            ]);
            comp(b, 'C#7', [[10, 4]]);
            bass(P('baixo'), b, 'G#m7', '0:3 0:1 r:2 5:2 r:8');
            bass(P('baixo'), b, 'C#7', 'r:8 0:2 8:1 r:1 s:2 5:2');
        } else {
            comp(b, c);
            bass(P('baixo'), b, c, '0:3 0:1 r:2 5:2 r:2 8:1 r:1 s:2 5:2');
        }
        groove(b);
        if (i === 6) {
            padChord(P('cordas'), b, 'G#m7', 8, { low: 55, n: 4, vel: 0.45 });
            padChord(P('cordas'), b, 'C#7', 8, { low: 55, n: 4, vel: 0.45, at: 8 });
        } else padChord(P('cordas'), b, c, 16, { low: 55, n: 4, vel: 0.45 });
    });
    // quem não está solando comenta em notas longas
    mel(P('flauta'), m0, ['r:8 C#5:8', 'A#4:16'], { vel: 0.5 });
    mel(P('vibrafone'), m0 + 2, ['r:8 F#5:8', 'E#5:16'], { vel: 0.5 });
    virar(m0 + 3, ['C#6', 'D#6', 'G#6']);
    for (const i of [1, 2, 3]) drum(P(`flip${i}`), m0 + 7, 1, i === 2 ? 'x.x.x.x.xxxxXXXX' : '....x.x.x.xxXXXX');

    // ---------- final em Sol: o SOC-CER-MON, as cartas viram, o baralho fecha ----------
    const call = GANCHO.em({ tom: 7, oitava: -1 });
    mel(P('flauta'), n, [call]);
    mel(P('terças'), n, [call], { harm: thirdBelow(MAJOR(7)) });
    drum(P('clap'), n, 1, GANCHO.palmas, { vel: 1.2 });
    bass(P('baixo'), n, 'Gmaj7', '0:3 0:1 r:2 5:2 r:2 8:1 r:1 s:2 5:2');
    comp(n, 'Gmaj7');
    padChord(P('cordas'), n, 'Gmaj7', 16, { low: 55, n: 4, vel: 0.7 });
    drum(P('bumbo'), n, 1, 'X.......X.x.....');
    drum(P('shaker'), n, 1, 'xoxoxoxoxoxoxoxo');
    virar(n, ['D6', 'E6', 'G6']);
    bass(P('baixo'), n + 1, 'D7', '0:4 5:4 s:4 r:4');
    comp(n + 1, 'D7');
    for (const i of [1, 2, 3]) drum(P(`flip${i}`), n + 1, 1, i === 2 ? 'x.x.x.x.xxxx....' : '....x.x.x.xx....');
    drum(P('bloco'), n + 1, 1, '............X...', { pitch: -12 });
    drum(P('bumbo'), n + 1, 1, 'X.......X...X...');
    mel(P('flauta'), n + 1, ['r:8 F#5:2 A5:2 C6:2 r:2']);
    mel(P('vibrafone'), n + 2, ['B5:16']);
    mel(P('flauta'), n + 2, ['G5:16']);
    padChord(P('cordas'), n + 2, 'Gmaj7', 16, { low: 55, n: 4 });
    stabs(P('piano'), n + 2, 'Gmaj7', [[0, 16]], { low: 55, n: 4, vel: 0.8 });
    bass(P('baixo'), n + 2, 'G', '0:16');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    for (const [i, x] of ['G6', 'B6', 'D7'].entries())
        mel(P(`carta${i + 1}`), n + 2, [`r:${i * 2} ${x}:4 r:${12 - i * 2}`], { vel: 0.5 });
    return S;
}
