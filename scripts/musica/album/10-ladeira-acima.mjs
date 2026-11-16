// Faixa 10, "Ladeira acima", rodada 2 (16/11/2026). Retorno do Miguel: "seriamente prejudicada por esses claps,
// precisa de um retrabalho". A peça do jogo (`estrada-da-vitoria`) tinha a palma pesada e o aro no contratempo do 2 e
// do 4 durante a faixa inteira. Aqui não tem palma nenhuma: virou ROCK DE GARAGEM COM METAIS (guitarra de corda com
// drive, abafada na mão nos versos e aberta no refrão, bateria de rock com corpo e o baixo de dedo). A melodia dos
// metais é a da Estrada (Mi menor, 132 BPM) e a ideia também: a ladeira sobe um tom a cada volta (Mi → Fá# → Sol#).
// O que entrou: um REFRÃO novo (B) no relativo (Dó Ré Sol Mi menor, com o Si7sus4 → Si7 voltando), a PONTE do meio
// da subida, em que o clima muda (Lá maior, meio-tempo, a banda some, o trombone sozinho canta por cima do clichê
// cromático no baixo: Lá, Sol#, Sol, Fá#, e o Ré menor com sexta, o iv menor emprestado), um SOLO de guitarra em Fá#
// menor (pentatônica), a SUBIDA (Ré, Mi, Fá#, Ré#7: o baixo e o taiko em 3-3-2 empurrando pro Sol# menor) e o final
// lá no topo: a escuridão do menor vira luz, Mi–Fá#–Sol# MAIOR (♭VI–♭VII–I, a terça de Picardia).
// Forma: riff (4) | A Mi (8) | B (8) | A Fá# (8) | B (8) | ponte (8) | solo (8) | subida (4) | A Sol# (8) | B (8) |
// topo (4). ~2:20.
import { bass, chord, drum, I, MINOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { BATERIA, baixoDedo, bombeio, bumbo, caixa, guitarra, trombone, trompete } from './kit.mjs';

export const meta = { titulo: 'Ladeira acima', faixa: 10 };

const M = [
    'E5:4 B4:2 E5:2 G5:4 F#5:2 E5:2',
    'G5:6 A5:2 G5:4 E5:4',
    'F#5:4 D5:2 F#5:2 A5:4 G5:2 F#5:2',
    'D#5:8 F#5:4 B5:4',
    'B5:4 A5:2 G5:2 E5:4 G5:4',
    'C6:6 B5:2 A5:4 G5:4',
    'A5:4 C6:4 E6:4 D6:2 C6:2',
    'B5:8 A5:2 G5:2 F#5:2 D#5:2',
];
const CH = ['Em', 'C', 'D', 'B7', 'Em', 'C', 'Am', 'B7'];
// o refrão: no relativo, sobe até o Sol e volta pelo Si7sus4 → Si7
const B_MEL = [
    'E5:4 G5:4 C6:6 B5:2',
    'A5:4 F#5:4 D5:8',
    'B5:4 D6:4 G6:6 F#6:2',
    'E6:6 D6:2 B5:8',
    'C6:4 E6:4 G6:4 E6:4',
    'F#6:6 E6:2 D6:4 A5:4',
    'E6:8 E6:4 F#6:4',
    'D#6:12 r:4',
];
const B_CH = ['C', 'D', 'G', 'Em', 'C', 'D', 'B7sus4', 'B7'];
// o baixo no refrão: anda e responde nas notas longas
const B_BAIXO = [
    'C2:2 C2:2 C3:2 C2:2 G2:2 C2:2 E2:2 G2:2',
    'D2:2 D2:2 D3:2 D2:2 A2:2 F#2:2 E2:2 D2:2',
    'G2:2 G2:2 G2:2 G2:2 D3:2 B2:2 A2:2 G2:2',
    'E2:2 E2:2 E3:2 E2:2 B2:2 D3:2 E3:2 F#2:2',
    'C2:2 C2:2 C3:2 C2:2 G2:2 C2:2 E2:2 G2:2',
    'D2:2 D2:2 D3:2 D2:2 A2:2 B2:2 C3:2 C#3:2',
    'B1:2 B1:2 B2:2 B1:2 E2:2 F#2:2 A2:2 B2:2',
    'B1:2 B1:2 B2:2 B1:2 D#2:2 F#2:2 A2:2 A#1:2',
];

export default function ladeiraAcima() {
    const S = new Song({ bpm: 132, bars: 76, tail: 5, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria' });
    const duck = bombeio(S, k, { prof: 0.25 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.9, rev: 0.1 });
    const tm = S.part('tom', I.tom, { drum: true, bus: 'bateria', gain: 0.9 });
    const taiko = S.part('taiko', I.timp, { drum: true, bus: 'bateria', gain: 0.22, rev: 0.2 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.8 });
    const oh = S.part('aberto', I.ohat, { drum: true, pan: 0.35, gain: 0.7 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.8 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.25, rev: 0.2 });
    const tp = trompete(S, 'metais', { pan: -0.1, gain: 0.95, rev: 0.18 });
    const tb2 = trombone(S, 'metais2', { pan: 0.3, gain: 0.7, rev: 0.18 });
    const tb = trombone(S, 'trombone', { pan: 0, gain: 0.95, rev: 0.3 });
    const rit = guitarra(S, 'ritmo', { pan: -0.45, gain: 0.55, gainAt: duck }, { sujo: 0.75, abafa: 1 });
    const ab = guitarra(S, 'aberta', { pan: 0.45, gain: 0.45, rev: 0.12, gainAt: duck }, { sujo: 0.6 });
    const solo = guitarra(
        S,
        'solo',
        { pan: 0.1, gain: 1, rev: 0.22, echo: { rows: 3, fb: 0.25, mix: 0.18 } },
        { sujo: 0.85 },
    );
    const bs = baixoDedo(S, 'baixo', { gain: 0.45, gainAt: duck });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3, gainAt: duck });

    /** Power chord (tônica, quinta, oitava) na guitarra, nas linhas do padrão. */
    const power = (P, b, c, pat, { vel = 1, len = 2 } = {}) => {
        const r = 40 + ((chord(c).root - 4 + 12) % 12);
        [...pat].forEach((x, i) => {
            if (x === '.') return;
            const v = vel * (x === 'X' ? 1.1 : 0.8);
            for (const m of [r, r + 7, r + 12]) P.note(b * 16 + i, m, len, v);
        });
    };
    const RIFF = 'X.x.x.xxX.x.x.x.';
    const rock = (b, n, { cheio = true } = {}) => {
        drum(k, b, n, cheio ? 'X.....x.X.x.....' : 'X.......X.......');
        drum(sn, b, n, '....X.......X...');
        drum(hh, b, n, 'x.x.x.x.x.x.x.x.', { vel: cheio ? 1 : 0.7 });
    };
    const virada = (b) => {
        drum(sn, b, 1, '........xxxxXXXX');
        drum(tm, b, 1, '........x.x.x.x.', { pitch: 3 });
        drum(ti, b, 1, '........X...X.X.', { pitch: -9 });
    };

    // ---------- riff (0-3): a guitarra sozinha, abafada; o bumbo entra no 3º e o taiko no 4º ----------
    for (let b = 0; b < 4; b++) {
        power(rit, b, b % 2 ? 'C' : 'Em', b === 3 ? 'X.x.x.xxX.x.....' : RIFF);
        if (b === 3) power(rit, b, 'B', '..........X.X.X.');
    }
    drum(k, 2, 2, 'X...X...X...X...');
    drum(taiko, 3, 1, 'X..X..X...X..X..', { pitch: -9 });
    drum(sn, 3, 1, '..........xxXXXX');

    const blocoA = (b0, s) => {
        mel(tp, b0, M, { shift: s });
        if (s) mel(tb2, b0, M, { shift: s, harm: thirdBelow(MINOR((4 + s) % 12)) });
        CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            power(rit, b0 + i, c, RIFF);
            bass(bs, b0 + i, c, '0:2 0:2 0:2 8:2 0:2 0:2 5:2 8:2');
        });
        rock(b0, 7);
        rock(b0 + 7, 1);
        virada(b0 + 7);
        drum(cr, b0, 1, 'X...............');
    };
    const blocoB = (b0, s) => {
        mel(tp, b0, B_MEL, { shift: s - 12 });
        mel(tb2, b0, B_MEL, { shift: s - 12, harm: thirdBelow(MINOR((4 + s) % 12)) });
        mel(bs, b0, B_BAIXO, { shift: s });
        B_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            power(ab, b0 + i, c, 'X.......x.....x.', { len: 8 });
            power(rit, b0 + i, c, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
            padChord(str, b0 + i, c, 16, { low: 55, n: 4, vel: 0.7 });
        });
        drum(k, b0, 7, 'X.....x.X.x...x.');
        drum(sn, b0, 7, '....X.......X...');
        drum(oh, b0, 7, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 4, 1, 'X...............');
        // o fim do refrão: a banda bate junto nas colcheias e para, o Si7 fica e a virada chama
        drum(k, b0 + 7, 1, 'X.X.X.X.........');
        drum(sn, b0 + 7, 1, 'X.X.X.X...xxXXXX');
        drum(cr, b0 + 7, 1, 'X...............');
    };

    blocoA(4, 0);
    blocoB(12, 0);
    blocoA(20, 2);
    blocoB(28, 2);

    // ---------- ponte (36-43): no meio da subida, a vista. Lá maior, meio-tempo, o trombone sozinho ----------
    const P_CH = ['Amaj7', 'Amaj7', 'A7', 'D', 'Dmaj7', 'Dm6', 'A', 'C#7'];
    const P_BAIXO = ['A2:16', 'G#2:16', 'G2:16', 'F#2:16', 'D2:16', 'D2:16', 'C#2:8 E2:8', 'C#2:16'];
    const P_TB = [
        'C#4:6 B3:2 A3:8',
        'G#3:4 A3:4 B3:4 C#4:4',
        'E4:8 D4:4 C#4:4',
        'D4:12 r:4',
        'F#4:6 E4:2 D4:8',
        'F4:6 E4:2 D4:8',
        'C#4:4 E4:4 A4:8',
        'G#4:8 E#4:8',
    ];
    P_CH.forEach((c, i) => {
        const b = 36 + i;
        padChord(str, b, c, 16, { low: 57, n: 4, vel: 0.5 });
        power(ab, b, c, 'x...............', { len: 16, vel: 0.3 });
        drum(k, b, 1, i < 4 ? 'X...............' : 'X.......x.......', { vel: 0.7 });
        if (i >= 4) drum(sn, b, 1, '........x.......', { vel: 0.6 });
        drum(hh, b, 1, 'x...x...x...x...', { vel: 0.5 });
    });
    mel(bs, 36, P_BAIXO, { vel: 0.9 });
    mel(tb, 36, P_TB);
    mel(tp, 40, ['r:16', 'r:8 A4:4 G#4:4', 'r:16', 'r:8 C#5:4 B4:4'], { vel: 0.6 });
    drum(ti, 43, 1, '........X.X.XXXX', { pitch: -9, vel: 0.7 });

    // ---------- solo (44-51): a guitarra em Fá# menor, pentatônica, a banda inteira de volta ----------
    const SOLO_CH = ['F#m', 'D', 'E', 'C#7', 'F#m', 'D', 'Bm', 'C#7'];
    const SOLO = [
        'F#5:2 A5:2 B5:1 C#6:1 B5:2 A5:2 F#5:2 E5:2 F#5:2',
        'r:2 A5:1 B5:1 C#6:2 E6:4 C#6:2 B5:2 A5:2',
        'B5:3 G#5:3 E5:2 r:2 E6:2 D#6:1 E6:1 B5:2',
        'C#6:6 B5:1 C#6:1 E#5:4 G#5:4',
        'F#6:2 E6:2 C#6:2 E6:2 F#6:2 A6:4 F#6:2',
        'A6:3 F#6:3 D6:2 A5:2 B5:2 C#6:2 D6:2',
        'D6:2 C#6:2 B5:2 F#5:2 B5:2 D6:2 F#6:2 B6:2',
        'C#7:8 B6:2 G#6:2 E#6:2 C#6:2',
    ];
    mel(solo, 44, SOLO);
    SOLO_CH.forEach((c, i) => {
        power(rit, 44 + i, c, RIFF, { vel: 0.8 });
        bass(bs, 44 + i, c, '0:2 0:2 0:2 8:2 0:2 0:2 5:2 8:2');
        if (i % 4 === 3)
            stabs(
                tp,
                44 + i,
                c,
                [
                    [12, 1],
                    [14, 2],
                ],
                { low: 60, n: 3 },
            );
    });
    rock(44, 8);
    drum(cr, 44, 1, 'X...............');
    drum(cr, 48, 1, 'X...............');

    // ---------- subida (52-55): Ré, Mi, Fá#, Ré#7; o taiko em 3-3-2 e a caixa em semicolcheias crescendo ----------
    ['D', 'E', 'F#', 'D#7'].forEach((c, i) => {
        const b = 52 + i;
        power(rit, b, c, 'x.x.x.x.x.x.x.x.', { vel: 0.7 + 0.1 * i });
        power(ab, b, c, 'X...............', { len: 16 });
        bass(bs, b, c, '0:2 0:2 0:2 0:2 0:2 0:2 0:2 0:2');
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.5 + 0.1 * i });
        drum(taiko, b, 1, 'X..X..X...X..X..', { pitch: -9, vel: 0.7 + 0.1 * i });
        drum(k, b, 1, 'X...X...X...X...');
        drum(sn, b, 1, i < 2 ? '....x.......x...' : i === 2 ? 'x.x.x.x.x.x.x.x.' : 'xxxxxxxxXXXXXXXX', {
            vel: 0.5 + 0.15 * i,
        });
    });
    mel(tp, 52, ['A4:16', 'B4:16', 'C#5:16', 'D#5:8 F#5:8'], { vel: 0.8 });
    mel(tb2, 52, ['F#4:16', 'G#4:16', 'A#4:16', 'A4:8 C5:8'], { vel: 0.8 });

    blocoA(56, 4);
    blocoB(64, 4);

    // ---------- o topo (72-75): Mi – Fá# – Sol# MAIOR (♭VI – ♭VII – I) ----------
    const TOPO = [
        ['E', 'G#5:8 B5:8', 'E5:8 G#5:8', 'E2:16'],
        ['F#', 'A#5:8 C#6:8', 'F#5:8 A#5:8', 'F#2:16'],
    ];
    TOPO.forEach(([c, a, h, bx], i) => {
        const b = 72 + i;
        mel(tp, b, [a]);
        mel(tb2, b, [h]);
        mel(bs, b, [bx]);
        power(ab, b, c, 'X.......X.......', { len: 8 });
        power(rit, b, c, 'x.x.x.x.x.x.x.x.');
        padChord(str, b, c, 16, { low: 56, n: 4 });
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(sn, b, 1, '....X.......X...');
        drum(cr, b, 1, 'X...............');
        drum(taiko, b, 1, 'X..X..X.........', { pitch: -9 });
    });
    drum(sn, 73, 1, '........xxxxXXXX');
    drum(ti, 73, 1, '........X.X.XXXX', { pitch: -9 });
    // Sol# maior: a terça (Si#) lá em cima é a luz
    for (const [P, n] of [
        [tp, 'B#5'],
        [tb2, 'G#5'],
        [tb, 'D#4'],
        [bs, 'G#1'],
    ])
        P.note(74 * 16, midi(n), 32, 1);
    power(ab, 74, 'G#', 'X...............', { len: 32 });
    padChord(str, 74, 'G#', 32, { low: 56, n: 4 });
    mel(solo, 74, ['G#6:2 B#6:2 D#7:2 G#7:10', 'r:16']);
    drum(cr, 74, 1, 'X...............');
    drum(k, 74, 1, 'X...............');
    drum(taiko, 74, 1, 'X...............', { pitch: -8 });
    drum(ti, 74, 1, 'XxXxXxXxXxXxXxXx', { pitch: -8, vel: 0.6 });
    drum(ti, 75, 1, 'X...............', { pitch: -8 });
    drum(sn, 75, 1, 'X...............');
    drum(cr, 75, 1, 'X...............');
    return S;
}
