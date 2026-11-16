// Faixa nova (Ato 3, depois de "Sete rivais"), "Sala do chefe", rodada 2 (16/11/2026). Retorno do Miguel sobre o
// tema do Giovanni no medley: "simplesmente sublime, merecia música própria"; "aqueles claps lentos com o tema são
// amedrontadores na medida certa e super groovy". Então a faixa é feita em cima disso: o clap 808 molhado e grave no
// 3 de um meio-tempo pesado, e o motivo do chefe nos metais graves. Gênero: FUNK NOIR (meio-tempo de trip-hop, órgão
// de rodas, naipe grave de trombones e tuba, cordas). Fá# menor, 96 BPM.
// O motivo é o do `lider-giovanni` (F#m | C#7: marcha pontuada que sobe uma quinta e desce o acorde da dominante); a
// peça do jogo não muda.
// A história: a porta range, ninguém na sala, só a cadeira de costas (o clichê cromático no órgão: Fá#m, Fá#m(maj7),
// Fá#m7, Fá#m6, a voz do meio descendo Fá#, Fá, Mi, Ré#, e os claps lentos sozinhos). Ele fala (A: o motivo nos
// trombones, o órgão responde escorregando cromático; o Sol maior é o ♭II napolitano, a sombra). A2: o baixo e as
// cordas descem em contraponto. A PROPOSTA (B, o clima muda): o chefe é charmoso, lounge em Ré maior7 (o ♭VI), Rhodes
// e trompete abafado, cheio de sétimas, e volta pelo Dó#7(♭9). A REVELAÇÃO (4): só o bumbo, os claps e o baixo, e o
// órgão toca, lento, o motivo do "Plano infalível": ele é o chefe daqueles três. O órgão sola por cima do groove. A'
// meio tom acima (Sol menor): o motivo do chefe nos trombones e o da turma no órgão AO MESMO TEMPO. Final: o time
// responde com o SOC-CER-MON nos metais graves (o desafio aceito), o clichê cromático de novo, agora em Sol menor, a
// banda corta, e sobra um último clap molhado e a cadeira girando.
// Forma: porta (4) | A (8) | A2 (8) | proposta (8) | revelação (4) | solo de órgão (8) | A' Sol menor (8) | final (6).
// ~2:20.
import { MOTIVO as GIOVANNI, rangido, tremor } from '../pecas/lider-giovanni.mjs';
import { MOTIVO as ROCKET } from '../pecas/tema-rocket.mjs';
import { bass, drum, GANCHO, I, MINOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import {
    BATERIA,
    baixoDedo,
    bombeio,
    bumbo,
    caixa,
    clapMolhado,
    orgao,
    rhodes,
    trombone,
    trompete,
    tuba,
} from './kit.mjs';

export const meta = { titulo: 'Sala do chefe', faixa: 13 };

const CH = ['F#m', 'C#7', 'F#m', 'Bm', 'D', 'Bm', 'G', 'C#7b9'];
const TB = [
    ...GIOVANNI.mel,
    'r:16',
    'r:16',
    'D5:3 D5:1 A5:6 G5:2 F#5:2 E5:2',
    'D5:3 C#5:1 B4:4 F#4:8',
    'r:16',
    'G#4:3 B4:1 D5:4 E#5:4 C#5:4',
];
// o órgão responde e escorrega cromático (Dó#, Dó, Si, Lá): a pista da turma
const ORG = [
    'r:16',
    'r:16',
    'r:2 F#5:1 F#5:1 C#6:4 C6:2 B5:2 A5:4',
    'B5:3 A5:1 F#5:4 D5:8',
    'r:16',
    'r:16',
    'r:2 B5:1 B5:1 D6:4 C#6:2 C6:2 B5:4',
    'r:16',
];
// o baixo do A2: desce em contraponto com as cordas
const A2_BAIXO = [
    'F#1:3 F#1:1 r:2 A1:2 F#1:2 r:2 C#2:2 C2:2',
    'C#2:3 C#2:1 r:2 G#1:2 E#1:2 r:2 C#2:2 B1:2',
    'A1:3 A1:1 r:2 F#1:2 A1:2 C#2:2 E2:2 F#2:2',
    'B1:3 B1:1 r:2 F#1:2 D2:2 r:2 B1:2 A#1:2',
    'A1:3 A1:1 r:2 F#1:2 D2:2 E2:2 F#2:2 A2:2',
    'B1:3 B1:1 r:2 D2:2 F#2:2 E2:2 D2:2 Ab1:2',
    'G1:3 G1:1 r:2 D2:2 B1:2 r:2 G1:2 D2:2',
    'C#2:3 C#2:1 D2:2 C#2:2 B1:2 A1:2 G#1:2 G1:2',
];
const CORDAS_A2 = ['A4:16', 'G#4:8 E#4:8', 'F#4:16', 'F#4:8 D4:8', 'F#4:16', 'D4:8 C#4:8', 'D4:16', 'E#4:8 D4:8'];
// a proposta: Ré maior7 (♭VI), lounge, trompete abafado
const B_CH = ['Dmaj7', 'C#m7', 'Bm7', 'E7', 'Amaj7', 'F#m7', 'Bm7', 'C#7b9'];
const B_TP = [
    'F#5:6 E5:2 C#5:8',
    'E5:6 D#5:2 B4:8',
    'D5:4 F#5:4 A5:6 G#5:2',
    'G#5:12 r:4',
    'C#6:6 B5:2 G#5:8',
    'A5:4 C#6:4 E6:8',
    'D6:6 C#6:2 B5:4 A5:4',
    'G#5:4 E#5:4 D5:4 C#5:4',
];
const SOLO_CH = ['F#m7', 'F#m7', 'Bm7', 'Bm7', 'D7', 'C#7b9', 'F#m7', 'C#7b9'];
const SOLO = [
    'r:2 C#5:1 E5:1 F#5:2 A5:2 G#5:1 A5:1 F#5:2 E5:2 C#5:2',
    'F#5:1 G#5:1 A5:2 C6:1 C#6:3 B5:2 A5:2 F#5:4',
    'r:2 D5:1 F#5:1 A5:2 B5:2 C#6:1 D6:1 B5:2 A5:2 F#5:2',
    'B5:6 A5:1 G#5:1 A5:4 F#5:4',
    'A5:2 C6:2 D6:2 F#6:4 E6:2 D6:2 C6:2',
    'B5:2 G#5:2 E#5:2 D5:2 C#5:2 E#5:2 G#5:2 B5:2',
    'C#6:3 A5:3 F#5:2 C6:3 A5:3 F#5:2',
    'E#5:4 G#5:4 B5:4 D6:4',
];
const TRIO = [
    [8, 1],
    [10, 1],
    [12, 2],
];

export default function salaDoChefe() {
    const S = new Song({ bpm: 96, bars: 54, swing: 0.06, tail: 6, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 1.05 });
    const duck = bombeio(S, k, { prof: 0.3, solta: 0.2 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.6, rev: 0.12 });
    const cl = S.part('claps', clapMolhado, { drum: true, gain: 1.4, rev: 0.25, pan: 0.05 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.55, pan: -0.2 });
    const timp = S.part('timpano', I.timp, { drum: true, gain: 0.2, rev: 0.25 });
    const tr = S.part('tremor', tremor, { drum: true, gain: 0.8 });
    const rg = S.part('rangido', rangido, { drum: true, pan: -0.3, gain: 0.55, rev: 0.35 });
    const tb = trombone(S, 'trombones', { pan: -0.1, gain: 1.05, rev: 0.22 });
    const tb2 = trombone(S, 'terças', { pan: 0.3, gain: 0.6, rev: 0.22 });
    const tu = tuba(S, 'tuba', { gain: 0.7, rev: 0.12 });
    const og = orgao(S, 'orgao', { pan: 0.2, gain: 0.9, rev: 0.3, gainAt: duck });
    const ogS = orgao(S, 'orgaoSolo', { pan: -0.15, gain: 1.4, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const rh = rhodes(S, 'rhodes', { pan: 0.25, gain: 0.7, rev: 0.25, gainAt: duck });
    const tp = trompete(S, 'trompete', { pan: -0.2, gain: 0.7, rev: 0.3, corte: 2400 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.45, gainAt: duck });

    const BAIXO = 'F#1:3 F#1:1 r:2 A1:2 F#1:2 r:2 C#2:2 C2:2';
    const meioTempo = (b, n, { cheio = true, claps = true } = {}) => {
        drum(k, b, n, cheio ? 'X.........x.....' : 'X...............');
        if (cheio) drum(k, b, n, '.......x........', { vel: 0.55 });
        if (claps) drum(cl, b, n, '........X.......');
        drum(sn, b, n, cheio ? '...o....X..o..o.' : '........x.......', { vel: claps ? 0.7 : 1 });
        drum(hh, b, n, cheio ? 'x.xox.xox.xox.xo' : 'x...x...x...x...', { vel: 0.6 });
    };
    const terremoto = (b, row = 8) => {
        tr.note(b * 16 + row, 0, 0, 1);
        drum(timp, b, 1, `${'.'.repeat(row)}${'XxXxXxXX'.slice(0, 16 - row)}`, { pitch: -9, vel: 0.8 });
    };
    /** O clichê cromático: a voz do meio desce Fá#, Fá (Mi#), Mi, Ré# por cima do Fá# do baixo. */
    const cliche = (b0, s, vel = 1, n = 4) => {
        ['F#5', 'E#5', 'E5', 'D#5'].slice(0, n).forEach((v, i) => {
            const b = b0 + i;
            for (const n of ['F#4', 'A4', 'C#5', v]) og.note(b * 16, midi(n) + s, 16, vel * 0.8);
            str.note(b * 16, midi(v) - 12 + s, 16, vel * 0.7);
            bs.note(b * 16, midi('F#1') + s, 3, vel);
            bs.note(b * 16 + 3, midi('F#1') + s, 1, vel * 0.7);
            bs.note(b * 16 + 10, midi('C#2') + s, 2, vel * 0.8);
        });
    };

    // ---------- a porta (0-3): range, a cadeira de costas, o clichê; os claps lentos entram sozinhos ----------
    rg.note(0, 0, 0, 1);
    cliche(0, 0, 0.75);
    drum(k, 0, 1, '............X...');
    drum(k, 1, 1, 'X...............');
    drum(cl, 2, 2, '........X.......');
    drum(k, 2, 2, 'X.........x.....');
    terremoto(3, 12);

    // ---------- A (4-11) e A2 (12-19): o chefe fala nos trombones, o órgão responde ----------
    const blocoA = (b0, s, dois) => {
        const tom = s ? TB.slice(0, 7) : TB;
        mel(tb, b0, tom, { shift: s - 12 });
        mel(tu, b0, tom, { shift: s - 24, vel: 0.75 });
        if (dois || s) mel(tb2, b0, tom, { shift: s - 12, harm: thirdBelow(MINOR((6 + s) % 12)) });
        if (s) {
            // o chefe e a turma: o motivo da turma no órgão por cima do motivo dele
            mel(og, b0, ROCKET.mel, { shift: 6 + s });
            mel(og, b0 + 2, ORG.slice(2, 7), { shift: s });
        } else mel(og, b0, ORG);
        CH.forEach((c0, i) => {
            const c = s && i === 7 ? transpose('C#7b9', s) : s && i === 1 ? 'D7b9' : transpose(c0, s);
            if (dois) mel(bs, b0 + i, [A2_BAIXO[i]], { shift: s });
            else bass(bs, b0 + i, c, '0:3 0:1 r:2 3:2 0:2 r:2 5:2 c:2');
            if (i === 3 || i === 7) stabs(og, b0 + i, c, TRIO, { low: 59, n: 4, vel: 0.8 });
            else padChord(str, b0 + i, c, 16, { low: 54, n: 3, vel: dois ? 0.45 : 0.6 });
        });
        if (dois) mel(str, b0, CORDAS_A2, { shift: s, vel: 0.8 });
        meioTempo(b0, 8, { cheio: dois || s > 0 });
        terremoto(b0 + 3);
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(4, 0, false);
    blocoA(12, 0, true);
    drum(sn, 19, 1, '........xxXxXXXX', { vel: 0.8 });

    // ---------- a proposta (20-27): o chefe é charmoso. Ré maior7, lounge, Rhodes e trompete abafado ----------
    B_CH.forEach((c, i) => {
        const b = 20 + i;
        padChord(rh, b, c, 6, { low: 54, n: 4, vel: 0.7 });
        padChord(rh, b, c, 10, { low: 54, n: 4, vel: 0.5, at: 6 });
        bass(bs, b, c, '0:6 5:2 8:4 5:2 c:2', { vel: 0.8 });
        drum(k, b, 1, 'X.......x.......', { vel: 0.6 });
        drum(cl, b, 1, '........x.......', { vel: 0.45 });
        drum(hh, b, 1, 'x.ox.ox.x.ox.ox.', { vel: 0.4 });
    });
    mel(tp, 20, B_TP);
    mel(tb, 24, ['r:16', 'r:8 A3:4 C#4:4', 'D4:16', 'E#4:8 G#4:8'], { vel: 0.6 });
    mel(str, 20, ['A4:16', 'G#4:16', 'F#4:16', 'G#4:16', 'G#4:16', 'A4:16', 'A4:16', 'G#4:16'], { vel: 0.6 });

    // ---------- a revelação (28-31): o órgão toca, lento, o motivo do Plano infalível ----------
    const REVELA = [
        ['F#m', 'C#5:2 r:2 F#5:2 r:2 A5:4 C6:2 C#6:2'],
        ['F#m', 'C#6:4 r:4 C6:2 B5:2 A5:4'],
        ['C#7b9', 'F#5:4 A5:2 D6:6 C#6:4'],
        ['D7b9', 'r:4 F#5:4 A5:4 C6:4'],
    ];
    REVELA.forEach(([c, m], i) => {
        const b = 28 + i;
        mel(og, b, [m]);
        padChord(str, b, c, 16, { low: 54, n: 4, vel: 0.5 + 0.1 * i });
        mel(bs, b, [BAIXO], { vel: 0.9 });
        drum(k, b, 1, 'X.........x.....');
        drum(cl, b, 1, '........X.......', { vel: 1.1 });
        drum(hh, b, 1, 'x...x...x...x...', { vel: 0.35 });
    });
    rg.note(28 * 16, 3, 0, 0.8);
    drum(timp, 28, 1, 'X...............', { pitch: -9 });
    terremoto(31, 8);
    drum(sn, 31, 1, '........xxXxXXXX', { vel: 0.8 });

    // ---------- solo de órgão (32-39) por cima do groove, os trombones marcando o trio ----------
    mel(ogS, 32, SOLO);
    SOLO_CH.forEach((c, i) => {
        const b = 32 + i;
        bass(bs, b, c, '0:3 0:1 r:2 3:2 0:2 r:2 5:2 c:2');
        padChord(str, b, c, 16, { low: 54, n: 3, vel: 0.45 });
        if (i % 2 === 1) stabs(tb, b, c, TRIO, { low: 50, n: 3, vel: 0.7 });
    });
    meioTempo(32, 8);
    drum(cr, 32, 1, 'X...............');
    drum(sn, 39, 1, '........xxXxXXXX');

    // ---------- A' em Sol menor (40-47): o chefe e a turma juntos ----------
    blocoA(40, 1, true);

    // ---------- final (48-53): o time responde com o SOC-CER-MON; o clichê em Sol menor; corte; um clap ----------
    mel(tb, 48, [GANCHO.em({ menor: true, tom: 7, oitava: -1 })]);
    mel(tb2, 48, [GANCHO.em({ menor: true, tom: 7, oitava: -1 })], { harm: thirdBelow(MINOR(7)) });
    mel(tu, 48, [GANCHO.em({ menor: true, tom: 7, oitava: -2 })]);
    drum(cl, 48, 1, '............X.X.', { vel: 1.1 });
    bass(bs, 48, 'Gm', '0:3 0:3 8:6 r:4');
    drum(k, 48, 1, 'X..X..X.........');
    drum(cr, 48, 1, 'X...............');
    padChord(str, 48, 'Gm', 16, { low: 55, n: 4 });
    cliche(49, 1, 1, 3);
    meioTempo(49, 3);
    mel(tb, 49, ['G3:3 G3:1 D4:6 C4:2 Bb3:2 A3:2', 'Bb3:3 A3:1 F#3:4 D3:8'], { vel: 0.9 });
    mel(tu, 49, ['G2:3 G2:1 D3:6 C3:2 Bb2:2 A2:2', 'Bb2:3 A2:1 F#2:4 D2:8'], { vel: 0.7 });
    // 52: a banda corta no 1 do Sol menor (com a sexta: o último degrau do clichê)
    for (const n of ['G3', 'Bb3', 'D4', 'E4']) og.note(52 * 16, midi(n), 2, 1);
    for (const [P, n] of [
        [tb, 'G2'],
        [tu, 'G1'],
        [bs, 'G1'],
    ])
        P.note(52 * 16, midi(n), 2, 1);
    drum(k, 52, 1, 'X...............');
    drum(cr, 52, 1, 'X...............');
    drum(timp, 52, 1, 'X...............', { pitch: -8 });
    // o último clap molhado sozinho, e a cadeira gira
    drum(cl, 52, 1, '........X.......', { vel: 1.2 });
    rg.note(53 * 16, 2, 0, 0.8);
    return S;
}
