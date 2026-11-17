// Faixa 10, "Ladeira acima", rodada 3 (17/11/2026). Retorno do Miguel na rodada 2: não curtiu o rock de garagem,
// "parece batendo num cabo de aço" e não combina com o resto; quer no nível das outras. Gostou do BREAK (a ponte em
// que a banda some e o trombone canta sozinho), que fica igual.
// O cabo de aço era a guitarra de corda com drive (Karplus-Strong) e o chimbal e o prato do ZzFX abertos: medido, a
// faixa tinha a banda acima de 4 kHz a −13,7 dB do total (a "Quem manda aqui" fica em −24, "Barco e gaivota" em −28).
// Agora é SOUL-FUNK DE SUBIDA, gospel no jeito de modular: órgão de rodas, Rhodes, naipe de trompete e trombone, baixo
// de dedo e cordas, tudo com passa-baixa; nenhuma guitarra e nenhuma palma. Groove de funk com swing leve (caixa com
// fantasmas, bumbo antecipado) no lugar da batida reta de rock. A melodia é a da Estrada (Mi menor) e a ideia também:
// a ladeira sobe um tom a cada volta (Mi → Fá# → Sol#), como o coral de igreja que sobe no último refrão.
// A história: O SINO DO TOPO. Ele toca lá longe na introdução (a meta, o Sol#), e de novo no fim de cada refrão, cada
// vez mais perto (mais alto, menos sala); no topo ele toca em cima do Sol# maior.
// Forma: introdução (4): o órgão abre, o sino longe, o baixo entra com o riff | A Mi (8) | B (8) | A Fá# (8) | B (8) |
// break (8): Lá maior, meio-tempo, a banda some e o trombone canta em cima do clichê cromático (Lá, Sol#, Sol, Fá#) e
// do Ré menor com sexta (o iv menor emprestado) | solo de trompete em Fá# menor (8) | subida (4): Ré, Mi, Fá#, Ré#7,
// surdo em 3-3-2 e caixa crescendo | A Sol# (8) | B (8) | topo (4): Mi–Fá#–Sol# MAIOR (♭VI–♭VII–I, a terça de
// Picardia) e o sino. ~2:35.
import { k12, som } from '../pecas/livre-ginasio.mjs';
import { bass, drum, hz, I, MINOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { BATERIA, baixoDedo, bombeio, bumbo, caixa, orgao, rhodes, surdo, trombone, trompete } from './kit.mjs';

export const meta = { titulo: 'Ladeira acima', faixa: 10 };

const TAU = Math.PI * 2;

/** O sino do topo: sino tubular por FM (parcial inarmônico de 2,76 caindo rápido) e o zumbido grave; `p` = semitons
 * a partir do Sol#4. Passa-baixa a 4,5 kHz: sino quente, sem o brilho de prato. */
const sino = som(
    4.5,
    (p) => {
        const f = hz(68) * k12(p);
        return (t) =>
            Math.sin(TAU * f * t + 1.3 * Math.exp(-t / 0.5) * Math.sin(TAU * 2.76 * f * t)) * Math.exp(-t / 1.7) +
            0.4 * Math.sin(TAU * 0.5 * f * t) * Math.exp(-t / 2.6) +
            0.25 * Math.sin(TAU * 2.0 * f * t) * Math.exp(-t / 0.9);
    },
    { pk: 0.5, corte: 4500 },
);

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
    'C2:3 C3:1 r:2 C2:2 G2:2 C2:2 E2:2 G2:2',
    'D2:3 D3:1 r:2 D2:2 A2:2 F#2:2 E2:2 D2:2',
    'G2:3 G2:1 r:2 G2:2 D3:2 B2:2 A2:2 G2:2',
    'E2:3 E3:1 r:2 E2:2 B2:2 D3:2 E3:2 F#2:2',
    'C2:3 C3:1 r:2 C2:2 G2:2 C2:2 E2:2 G2:2',
    'D2:3 D3:1 r:2 D2:2 A2:2 B2:2 C3:2 C#3:2',
    'B1:3 B2:1 r:2 B1:2 E2:2 F#2:2 A2:2 B2:2',
    'B1:3 B2:1 r:2 B1:2 D#2:2 F#2:2 A2:2 A#1:2',
];
// o baixo do A: funk, tônica, oitava curta, a quinta e a sétima chegando
const A_BAIXO = '0:3 8:1 r:2 0:2 5:2 r:1 0:1 s:2 8:2';
// o órgão no contratempo (o "chop" do gospel) e o Rhodes segurando
const ORG_A = [2, 6, [10, 2], 14];
const RH_A = [
    [0, 6],
    [8, 6],
];

export default function ladeiraAcima() {
    const S = new Song({ bpm: 120, bars: 76, swing: 0.08, tail: 6, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.95 });
    const duck = bombeio(S, k, { prof: 0.25 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.6, rev: 0.12 });
    const tm = S.part('tom', I.tom, { drum: true, bus: 'bateria', gain: 0.7, corte: 5000 });
    const su = S.part('surdo', surdo, { drum: true, bus: 'bateria', gain: 0.8, rev: 0.15 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.1, corte: 8500 });
    const oh = S.part('aberto', I.ohat, { drum: true, pan: 0.3, gain: 0.9, corte: 7500 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.5, corte: 6000 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.22, rev: 0.2 });
    const tp = trompete(S, 'trompete', { pan: -0.1, gain: 0.95, rev: 0.2, corte: 4200 });
    const tb2 = trombone(S, 'trombone2', { pan: 0.3, gain: 0.5, rev: 0.2, corte: 3500 });
    const tb = trombone(S, 'trombone', { pan: 0, gain: 0.95, rev: 0.3, corte: 3500 });
    const solo = trompete(S, 'solo', {
        pan: 0.1,
        gain: 0.95,
        rev: 0.25,
        corte: 3800,
        echo: { rows: 3, fb: 0.2, mix: 0.15 },
    });
    const og = orgao(S, 'orgao', { pan: 0.25, gain: 0.55, rev: 0.25, gainAt: duck });
    const rh = rhodes(S, 'rhodes', { pan: -0.3, gain: 0.5, rev: 0.2, gainAt: duck });
    const bs = baixoDedo(S, 'baixo', { gain: 0.38, gainAt: duck });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.3, corte: 3200, gainAt: duck });
    const si = S.part('sino', sino, { drum: true, pan: 0.15, gain: 0.8, rev: 0.6 });

    const funk = (b, n, { cheio = true } = {}) => {
        drum(k, b, n, cheio ? 'X.....x...X..x..' : 'X.......X.......');
        drum(sn, b, n, cheio ? '....X..o.o..X..o' : '....X.......X...');
        drum(hh, b, n, cheio ? 'x.xox.xox.xox.xo' : 'x.x.x.x.x.x.x.x.', { vel: cheio ? 0.8 : 0.6 });
    };
    const virada = (b) => {
        drum(sn, b, 1, '........xxxxXXXX', { vel: 0.85 });
        drum(tm, b, 1, '........x.x.x.x.', { pitch: 3 });
        drum(ti, b, 1, '........X...X.X.', { pitch: -9 });
    };
    /** O sino do topo; `perto` de 0 (lá longe) a 1 (aqui). */
    const toca = (b, row, perto) => si.note(b * 16 + row, 0, 0, 0.35 + 0.65 * perto);

    // ---------- introdução (0-3): o órgão abre no Mi menor, o sino lá longe, o baixo e o bumbo chegando ----------
    ['Em', 'Em', 'C', 'B7'].forEach((c, i) => {
        padChord(og, i, c, 16, { low: 52, n: 4, vel: 0.45 + 0.1 * i });
        padChord(str, i, c, 16, { low: 55, n: 3, vel: 0.3 + 0.1 * i });
    });
    toca(0, 0, 0);
    mel(bs, 1, ['E2:3 E3:1 r:2 E2:2 B2:2 r:1 E2:1 D3:2 E3:2', 'C2:3 C3:1 r:2 C2:2 G2:2 r:1 C2:1 B2:2 C3:2']);
    mel(bs, 3, ['B1:3 B2:1 r:2 B1:2 F#2:2 A2:2 B2:4']);
    drum(k, 2, 1, 'X.......X.......');
    drum(hh, 2, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    drum(su, 3, 1, 'X..X..X.........');
    drum(sn, 3, 1, '..........xxXXXX', { vel: 0.8 });
    mel(tp, 3, ['r:12 B4:2 D#5:2'], { vel: 0.7 });

    const blocoA = (b0, s) => {
        mel(tp, b0, M, { shift: s });
        // a 1ª volta: o trombone uma oitava abaixo (quente); depois, terças
        if (s) mel(tb2, b0, M, { shift: s, harm: thirdBelow(MINOR((4 + s) % 12)) });
        else mel(tb2, b0, M, { shift: -12, vel: 0.7 });
        CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            bass(bs, b0 + i, c, A_BAIXO);
            stabs(og, b0 + i, c, ORG_A, { low: 55, n: 4, vel: 0.7 });
            stabs(rh, b0 + i, c, RH_A, { low: 52, n: 4, vel: 0.55 });
        });
        funk(b0, 7);
        funk(b0 + 7, 1, { cheio: false });
        virada(b0 + 7);
        drum(cr, b0, 1, 'X...............');
    };
    const blocoB = (b0, s, perto) => {
        mel(tp, b0, B_MEL, { shift: s - 12 });
        mel(tb2, b0, B_MEL, { shift: s - 12, harm: thirdBelow(MINOR((4 + s) % 12)) });
        mel(bs, b0, B_BAIXO, { shift: s });
        B_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            if (i < 7) padChord(og, b0 + i, c, 16, { low: 52, n: 4, vel: 0.6 });
            padChord(str, b0 + i, c, 16, { low: 55, n: 4, vel: 0.7 });
            if (i < 7) stabs(rh, b0 + i, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.4 });
        });
        drum(k, b0, 7, 'X.....x...X...x.');
        drum(sn, b0, 7, '....X..o.o..X..o');
        drum(oh, b0, 7, '..x...x...x...x.', { vel: 0.6 });
        drum(hh, b0, 7, 'x...x...x...x...', { vel: 0.5 });
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 4, 1, 'X...............');
        // o fim do refrão: a banda bate junto nas colcheias e para; o Si7 fica no órgão, o sino responde e a virada chama
        const c7 = transpose('B7', s);
        stabs(og, b0 + 7, c7, [0, 2, 4, [6, 10]], { low: 52, n: 4, vel: 0.8 });
        drum(k, b0 + 7, 1, 'X.X.X.X.........');
        drum(sn, b0 + 7, 1, 'X.X.X.X...xxXXXX');
        drum(cr, b0 + 7, 1, 'X...............');
        toca(b0 + 7, 7, perto);
    };

    blocoA(4, 0);
    blocoB(12, 0, 0.2);
    blocoA(20, 2);
    blocoB(28, 2, 0.45);

    // ---------- break (36-43): no meio da subida, a vista. Lá maior, meio-tempo, o trombone sozinho ----------
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
        padChord(og, b, c, 16, { low: 52, n: 4, vel: 0.3 });
        drum(k, b, 1, i < 4 ? 'X...............' : 'X.......x.......', { vel: 0.7 });
        if (i >= 4) drum(sn, b, 1, '........x.......', { vel: 0.6 });
        drum(hh, b, 1, 'x...x...x...x...', { vel: 0.5 });
    });
    mel(bs, 36, P_BAIXO, { vel: 0.9 });
    mel(tb, 36, P_TB);
    mel(tp, 40, ['r:16', 'r:8 A4:4 G#4:4', 'r:16', 'r:8 C#5:4 B4:4'], { vel: 0.6 });
    drum(ti, 43, 1, '........X.X.XXXX', { pitch: -9, vel: 0.7 });

    // ---------- solo (44-51): o trompete em Fá# menor, pentatônica, a banda inteira de volta ----------
    const SOLO_CH = ['F#m', 'D', 'E', 'C#7', 'F#m', 'D', 'Bm', 'C#7'];
    const SOLO = [
        'F#4:2 A4:2 B4:1 C#5:1 B4:2 A4:2 F#4:2 E4:2 F#4:2',
        'r:2 A4:1 B4:1 C#5:2 E5:4 C#5:2 B4:2 A4:2',
        'B4:3 G#4:3 E4:2 r:2 E5:2 D#5:1 E5:1 B4:2',
        'C#5:6 B4:1 C#5:1 E#4:4 G#4:4',
        'F#5:2 E5:2 C#5:2 E5:2 F#5:2 A5:4 F#5:2',
        'A5:3 F#5:3 D5:2 A4:2 B4:2 C#5:2 D5:2',
        'D5:2 C#5:2 B4:2 F#4:2 B4:2 D5:2 F#5:2 B5:2',
        'C#6:8 B5:2 G#5:2 E#5:2 C#5:2',
    ];
    mel(solo, 44, SOLO);
    SOLO_CH.forEach((c, i) => {
        bass(bs, 44 + i, c, A_BAIXO);
        stabs(og, 44 + i, c, ORG_A, { low: 55, n: 4, vel: 0.7 });
        if (i % 4 === 3)
            stabs(
                tb2,
                44 + i,
                c,
                [
                    [12, 1],
                    [14, 2],
                ],
                { low: 55, n: 3 },
            );
    });
    funk(44, 8);
    drum(oh, 48, 4, '..x...x...x...x.', { vel: 0.5 });
    drum(cr, 44, 1, 'X...............');
    drum(cr, 48, 1, 'X...............');

    // ---------- subida (52-55): Ré, Mi, Fá#, Ré#7; o surdo em 3-3-2 e a caixa em semicolcheias crescendo ----------
    ['D', 'E', 'F#', 'D#7'].forEach((c, i) => {
        const b = 52 + i;
        padChord(og, b, c, 16, { low: 52, n: 4, vel: 0.5 + 0.1 * i });
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.5 + 0.1 * i });
        bass(bs, b, c, '0:2 0:2 0:2 0:2 0:2 0:2 0:2 0:2', { vel: 0.8 + 0.05 * i });
        drum(su, b, 1, 'X..X..X...X..X..', { vel: 0.7 + 0.1 * i });
        drum(k, b, 1, 'X...X...X...X...', { vel: 0.8 });
        drum(sn, b, 1, i < 2 ? '....x.......x...' : i === 2 ? 'x.x.x.x.x.x.x.x.' : 'xxxxxxxxXXXXXXXX', {
            vel: 0.5 + 0.12 * i,
        });
    });
    mel(tp, 52, ['A4:16', 'B4:16', 'C#5:16', 'D#5:8 F#5:8'], { vel: 0.8 });
    mel(tb2, 52, ['F#4:16', 'G#4:16', 'A#4:16', 'A4:8 C5:8'], { vel: 0.8 });

    blocoA(56, 4);
    blocoB(64, 4, 0.75);

    // ---------- o topo (72-75): Mi – Fá# – Sol# MAIOR (♭VI – ♭VII – I) e o sino ----------
    const TOPO = [
        ['E', 'G#5:8 B5:8', 'E5:8 G#5:8', 'E2:16'],
        ['F#', 'A#5:8 C#6:8', 'F#5:8 A#5:8', 'F#2:16'],
    ];
    TOPO.forEach(([c, a, h, bx], i) => {
        const b = 72 + i;
        mel(tp, b, [a]);
        mel(tb2, b, [h]);
        mel(bs, b, [bx]);
        stabs(og, b, c, [0, 2, [4, 4], 10, [12, 4]], { low: 52, n: 4 });
        padChord(str, b, c, 16, { low: 56, n: 4 });
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(sn, b, 1, '....X.......X...');
        drum(cr, b, 1, 'X...............');
        drum(su, b, 1, 'X..X..X.........');
    });
    drum(sn, 73, 1, '........xxxxXXXX');
    drum(ti, 73, 1, '........X.X.XXXX', { pitch: -9 });
    // Sol# maior: a terça (Si#) lá em cima é a luz, e o sino chega
    for (const [P, n] of [
        [tp, 'B#5'],
        [tb2, 'G#4'],
        [tb, 'D#4'],
        [bs, 'G#1'],
    ])
        P.note(74 * 16, midi(n), 32, 1);
    padChord(og, 74, 'G#', 32, { low: 52, n: 4 });
    padChord(str, 74, 'G#', 32, { low: 56, n: 4 });
    padChord(rh, 74, 'G#', 32, { low: 56, n: 4, vel: 0.7 });
    mel(solo, 74, ['G#5:2 B#5:2 D#6:2 G#6:10', 'r:16']);
    toca(74, 0, 1);
    toca(74, 8, 0.7);
    toca(75, 0, 0.5);
    drum(cr, 74, 1, 'X...............');
    drum(k, 74, 1, 'X...............');
    drum(su, 74, 1, 'X...............');
    drum(ti, 74, 1, 'XxXxXxXxXxXxXxXx', { pitch: -8, vel: 0.5 });
    drum(ti, 75, 1, 'X...............', { pitch: -8 });
    drum(sn, 75, 1, 'X...............');
    drum(cr, 75, 1, 'X...............');
    return S;
}
