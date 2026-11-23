// Faixa nova do álbum, "O túnel" (EN "The Tunnel"). A PESADA, na linha de "Quem manda aqui".
// Rodada 3 (17/11/2026): 80 BPM em meio-tempo, Mi frígio → Fá menor, 50 compassos. O Miguel: "ficou interessante, só
// que tá muuuito leeenta e chaaata". Rodada 3b (17/11): o mesmo clima (a noite da final no túnel, as travas no
// concreto, a torcida abafada cantando o 3-3-2, o portão abrindo, o frígio, órgão/trombone/tuba, clap molhado), com
// energia. "Quem manda aqui" mede 96 BPM em meio-tempo (o analisar.mjs dá ~185, o dobro); a régua é passar dela.
// Duas versões, ele escolhe:
//   A (default, 100 BPM, groove INTEIRO): o clap molhado no 2 e no 4 (duas vezes por compasso, não uma), chimbal em
//     16 avos. Riff de 16 avos no baixo e na tuba: Mi, Mi, Mi da oitava, Fá (o ♭2 do frígio), e desce Sol, Fá, Mi,
//     Ré, Si; o riff acompanha a harmonia (frígio no menor, maior no Fá e no Dó, Si7 com o Dó do ♭9).
//   B (`:B`, 108 BPM, MEIO-TEMPO como "Quem manda aqui", percussão em dobro): o clap molhado pesado no 3, mas chimbal
//     e travas em 16 avos (7 batidas por segundo, contra 2,7 da rodada 3). Outro riff, nos metais graves: o 3-3-2 do
//     SOC-CER-MON no escuro (Mi, Mi, Si, e o Fá que cai no Mi).
// A história: os passos no túnel (2 compassos, não 4), o riff chega ainda no escuro; o rival fala nos trombones e o
// órgão responde de 2 em 2 compassos; a torcida lá em cima canta o 3-3-2 abafada. O olhar virou 4 compassos que andam
// (a escada do túnel, 2 acordes por compasso, a banda batendo no 1 e no 3 e os passos acelerando). Solo de órgão e
// trombone em 16 avos, de 2 em 2 e juntos no fim. O riff na banda inteira. A subida: a banda bate o 3-3-2 e para, os
// passos correm no silêncio, rufo e tímpano, Dó7 → Fá menor. A' em Fá menor: o nosso time responde com o SOC-CER-MON.
// Final: o portão abre, o riff em Ré♭, o 3-3-2 no Dó7(♭9), o Fá menor e o corte, um clap molhado, três passos.
// Forma: túnel 4 | riff 4 | A 8 | A2 8 | o olhar 4 | solo 8 | riff na banda 4 | subida 2 | A' Fá menor 8 | final 4
// = 54 compassos (A ~2:13, B ~2:03).
// Rodada 5 (23/11/2026): "muito boa, meio ameaçadora, mas ainda inofensiva": mais dentes. A forma e as notas ficam;
// o que muda é a mordida:
// - o ROSNADO: um baixo de dente de serra com a sub-oitava, saturado e com passa-baixa, dobra o riff o tempo todo
//   (antes o riff era só baixo de dedo e tuba, redondos demais);
// - o rival ROSNA: a partir do A2, um trombone com growl (a garganta vibrando a 28 Hz, saturado) dobra a fala dele;
// - as FACADAS: no Si7(♭9) de cada A, o naipe que rosna bate o cluster (Si, Dó, Ré#, Lá) no trio;
// - no riff da banda inteira, o rosnado sobe uma oitava junto, e os toms graves pisam o 3-3-2 (o time descendo a
//   escada); na subida e no final, o 3-3-2 também rosna.
import { deslize, torcida } from '../pecas/livre-ginasio.mjs';
import {
    bass,
    chord,
    drum,
    GANCHO,
    I,
    MINOR,
    mel,
    midi,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';
import { BATERIA, baixoDedo, bombeio, bumbo, caixa, clapMolhado, orgao, trombone, trompete, tuba } from './kit.mjs';
import { rosnado, trava, tromboneRosna } from './kit-novas.mjs';

export const meta = { titulo: 'O túnel', faixa: '12b' };

const A_CH = ['Em', 'Fmaj7', 'Em', 'B7', 'Am', 'C', 'Fmaj7', 'B7b9'];
const RIFF_CH = ['Em', 'Em', 'Fmaj7', 'Em'];
// o rival: sobe pelo Mi menor e despenca no Fá (o ♭II do frígio)
const TB = [
    'E3:3 E3:1 G3:2 B3:4 C4:2 B3:2 G3:2',
    'A3:3 G3:1 F3:2 E3:6 C3:4',
    'r:16',
    'r:16',
    'A3:3 A3:1 C4:2 E4:4 F4:2 E4:2 C4:2',
    'E4:3 D4:1 C4:2 G3:6 E3:4',
    'r:16',
    'B3:2 C4:2 D#4:2 F#4:2 A4:4 G4:2 F#4:2',
];
// o órgão responde (e no último compasso vai junto)
const ORG = [
    'r:16',
    'r:16',
    'r:2 B4:1 B4:1 E5:4 F5:2 E5:2 D#5:4',
    'D#5:3 F#5:1 A5:4 G5:2 F#5:2 D#5:4',
    'r:16',
    'r:16',
    'r:2 A4:1 A4:1 C5:4 E5:2 F5:2 A5:4',
    'B4:2 C5:2 D#5:2 F#5:2 A5:4 G5:2 F#5:2',
];
const A2_CORDAS = ['B4:16', 'A4:8 G4:8', 'G4:16', 'F#4:8 A4:8', 'E4:16', 'E4:8 G4:8', 'A4:16', 'F#4:8 D#4:8'];
// o olhar: a escada do túnel, meio tom por meio compasso, e o trompete abafado descendo junto
const B_CH = [
    ['Cmaj7', 'B7'],
    ['Bbmaj7', 'A7'],
    ['Abmaj7', 'G7'],
    ['F#7', 'B7b9'],
];
const B_TP = [
    'E5:3 D5:1 B4:4 D#5:3 C5:1 A4:4',
    'D5:3 C5:1 A4:4 C#5:3 Bb4:1 G4:4',
    'C5:3 Bb4:1 G4:4 B4:3 Ab4:1 F4:4',
    'A#4:2 C#5:2 E5:2 G5:2 F#5:2 D#5:2 C5:2 A4:2',
];
// solo: órgão e trombone de 2 em 2, em 16 avos (Mi menor com a 5ª diminuta, Si7 com o ♭9), juntos nos 2 últimos
const SOLO_ORG = [
    'E5:1 G5:1 A5:1 Bb5:1 B5:2 D6:1 E6:1 r:1 E6:1 D6:1 B5:1 Bb5:1 A5:1 G5:1 E5:1',
    'F5:1 A5:1 C6:1 E6:1 F6:3 E6:1 C6:1 A5:1 G5:1 F5:1 E5:2 C5:2',
    'r:16',
    'r:16',
    'A5:1 C6:1 E6:1 A6:1 G6:1 E6:1 C6:1 A5:1 Bb5:2 A5:1 G5:1 E5:2 A5:2',
    'G5:1 C6:1 E6:1 G6:1 E6:1 C6:1 G5:1 E5:1 G6:3 F6:1 E6:2 C6:2',
    'A5:1 C6:1 E6:1 F6:1 A6:4 G6:1 F6:1 E6:1 C6:1 A5:4',
    'B5:1 C6:1 D#6:1 F#6:1 A6:2 G6:1 F#6:1 D#6:1 C6:1 B5:1 A5:1 F#5:2 D#5:2',
];
const SOLO_TB = [
    'r:16',
    'r:16',
    'E3:1 E3:1 G3:1 E3:1 B3:2 Bb3:1 A3:1 G3:2 E4:3 D4:1 B3:2',
    'D#4:1 E4:1 F#4:2 A4:2 G4:1 F#4:1 E4:1 D#4:1 C4:2 B3:4',
    'r:16',
    'r:16',
    'F3:1 A3:1 C4:1 E4:1 F4:4 E4:1 D4:1 C4:1 A3:1 F3:4',
    'B3:2 D#4:2 F#4:2 A4:2 C5:4 B4:4',
];
const TRIO = [
    [8, 1],
    [10, 1],
    [12, 2],
];

/**
 * Os riffs: `ritmo` = [linha, duração]; `iv` = semitons da tônica do acorde, por qualidade (m = frígio, M = maior,
 * 7 = dominante com ♭9); `virada` = o compasso que fecha a frase do riff (sobe e volta pro Mi).
 */
const RIFFS = {
    A: {
        ritmo: [
            [0, 2],
            [2, 1],
            [3, 1],
            [5, 1],
            [6, 2],
            [10, 1],
            [11, 1],
            [12, 2],
            [14, 1],
            [15, 1],
        ],
        iv: {
            m: [0, 0, 12, 0, 1, 3, 1, 0, -2, -5],
            M: [0, 0, 12, 0, 2, 4, 2, 0, -1, -5],
            7: [0, 0, 12, 0, 1, 4, 1, 0, -2, -5],
        },
        virada: {
            ritmo: [
                [0, 2],
                [2, 1],
                [3, 1],
                [5, 1],
                [6, 2],
                [8, 1],
                [9, 1],
                [10, 1],
                [11, 1],
                [12, 1],
                [13, 1],
                [14, 1],
                [15, 1],
            ],
            iv: [0, 0, 12, 0, 1, 3, 5, 6, 7, 10, 8, 7, 5],
        },
    },
    // o 3-3-2 no escuro: Mi, Mi, Si (a quinta, onde o gancho salta), e o Fá que cai no Mi
    B: {
        ritmo: [
            [0, 2],
            [3, 2],
            [6, 2],
            [10, 2],
            [13, 3],
        ],
        iv: { m: [0, 0, 7, 1, 0], M: [0, 0, 7, 2, 0], 7: [0, 0, 7, 1, 0] },
        virada: {
            ritmo: [
                [0, 2],
                [3, 2],
                [6, 2],
                [8, 1],
                [9, 1],
                [10, 1],
                [11, 1],
                [12, 1],
                [13, 1],
                [14, 2],
            ],
            iv: [0, 0, 7, 8, 7, 6, 5, 3, 1, -1],
        },
    },
};

function tunel(v) {
    const B = v === 'B';
    const S = new Song({
        bpm: B ? 108 : 100,
        bars: 54,
        swing: B ? 0.04 : 0.07,
        tail: 6,
        barramentos: { bateria: BATERIA },
    });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 1.05 });
    const duck = bombeio(S, k, { prof: 0.3, solta: 0.15 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.6, rev: 0.12 });
    const cl = S.part('claps', clapMolhado, { drum: true, gain: B ? 1.4 : 1.2, rev: 0.3, pan: 0.05 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.95 });
    const oh = S.part('chimbalAberto', I.ohat, { drum: true, pan: 0.3, gain: 0.35 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.55, pan: -0.2 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.25, rev: 0.25 });
    const pe = S.part('travas', trava, { drum: true, gain: 1.5, rev: 0.3, pan: -0.25 });
    const ronco = S.part('arquibancada', torcida(9, 2, 1), { drum: true, gain: 0.5 });
    const gc = S.part('canto', torcida(0.3, 0.02, 0.18), { drum: true, gain: 0.9, rev: 0.4 });
    const gl = S.part('cantoLongo', torcida(0.7, 0.02, 0.45), { drum: true, gain: 0.9, rev: 0.4 });
    const rugido = S.part('rugido', torcida(6, 0.3, 3.5), { drum: true, gain: 0.55, rev: 0.3 });
    const sobe = S.part('subida', deslize(90, 720, 2.2), { drum: true, gain: 0.16, rev: 0.3 });
    const tb = trombone(S, 'trombones', { pan: -0.1, gain: 0.95, rev: 0.2 });
    const tb2 = trombone(S, 'terças', { pan: 0.3, gain: 0.6, rev: 0.2 });
    const tu = tuba(S, 'tuba', { gain: 0.5, rev: 0.1 });
    const tp = trompete(S, 'trompete', { pan: -0.2, gain: 0.75, rev: 0.3, corte: 2300 });
    const tpA = trompete(S, 'trompeteAberto', { pan: 0.15, gain: 0.85, rev: 0.25 });
    const og = orgao(S, 'orgao', { pan: 0.2, gain: 0.85, rev: 0.25, gainAt: duck });
    const ogS = orgao(S, 'orgaoSolo', { pan: -0.15, gain: 2, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.3 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.42, gainAt: duck });
    const bsx = rosnado(S, 'rosnado', { gain: 0.3, corte: 1300, gainAt: duck });
    const gr = tromboneRosna(S, 'rosna', { pan: 0.15, gain: 0.5, rev: 0.15, corte: 3200 });
    const tg = S.part('tomGrave', I.tom, { drum: true, bus: 'bateria', gain: 0.55, rev: 0.15 });

    const R = RIFFS[v];
    /** Tônica do acorde no registro do baixo (Si1 a Lá#2). */
    const raiz = (c) => {
        const r = 40 + ((chord(c).root + 8) % 12);
        return r > 46 ? r - 12 : r;
    };
    const qual = (c) => {
        const t = chord(c).tones;
        return t.includes(3) ? 'm' : t.includes(10) ? 7 : 'M';
    };
    /** Um compasso do riff em `P`, `oit` oitavas acima do baixo; `virada` = o compasso que fecha a frase. */
    const riff = (P, b, c, { oit = 0, vel = 1, virada = false } = {}) => {
        const { ritmo, iv } = virada ? R.virada : { ritmo: R.ritmo, iv: R.iv[qual(c)] };
        ritmo.forEach(([r, l], i) => {
            P.note(b * 16 + r, raiz(c) + 12 * oit + iv[i], l, vel * (r % 4 ? 0.8 : 1));
        });
    };
    /** O riff no baixo e na tuba (e na banda inteira com `banda`). */
    const riffBar = (b, c, { virada = false, banda = false, vel = 1 } = {}) => {
        riff(bs, b, c, { virada, vel });
        riff(tu, b, c, { virada, vel: vel * 0.8 });
        riff(bsx, b, c, { virada, vel: vel * 0.9 });
        if (banda) {
            riff(tb, b, c, { virada, oit: 1, vel: 1.1 });
            riff(og, b, c, { virada, oit: 2, vel: 0.9 });
            riff(bsx, b, c, { virada, oit: 1, vel: 0.7 });
            riff(gr, b, c, { virada, oit: 1, vel: 0.8 });
            drum(tg, b, 1, 'X..X..X.........', { pitch: -6 });
        }
    };
    /** A torcida lá em cima: o SOC-CER-MON no 3-3-2. `p` grave = abafada pela parede. */
    const canto = (b, p = -20, vel = 1) => {
        gc.note(b * 16, p, 0, vel);
        gc.note(b * 16 + 3, p, 0, vel);
        gl.note(b * 16 + 6, p + 2, 0, vel);
    };
    /** As travas no concreto: pé esquerdo e direito alternando. */
    const passos = (b, pat, vel = 0.5) => {
        let n = 0;
        for (let i = 0; i < 16; i++) if (pat[i] !== '.') pe.note(b * 16 + i, n++ % 2 ? -2 : 0, 0, vel);
    };
    const P8 = 'x.x.x.x.x.x.x.x.';
    const P16 = 'xxxxxxxxxxxxxxxx';
    /** A levada. A: groove inteiro, clap no 2 e no 4. B: meio-tempo, clap no 3, chimbal e travas em 16 avos. */
    const groove = (b0, n, nivel = 1) => {
        for (let b = b0; b < b0 + n; b++) {
            const fim = b === b0 + n - 1 && n > 1;
            if (B) {
                drum(k, b, 1, 'X.........X..x..');
                drum(k, b, 1, '.......x........', { vel: 0.55 });
                drum(cl, b, 1, '........X.......');
                drum(sn, b, 1, fim ? '...o....X.ooxxXX' : '...o....X..o..o.', { vel: 0.7 });
                drum(hh, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.6 });
                if (nivel > 1) drum(oh, b, 1, '..............x.', { vel: 0.7 });
                passos(b, nivel > 1 ? P16 : P8, nivel > 1 ? 0.32 : 0.4);
            } else {
                drum(k, b, 1, 'X.....x...X..x..');
                drum(cl, b, 1, '....X.......X...');
                drum(sn, b, 1, fim ? '..o.X..o.o..XxXX' : '..o.X..o.o..X.o.', { vel: 0.7 });
                drum(hh, b, 1, nivel > 1 ? 'x.xox.xox.xox.xo' : 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
                if (nivel > 1) drum(oh, b, 1, '......x.......x.', { vel: 0.6 });
                if (nivel > 1) passos(b, P8, 0.35);
            }
        }
    };
    /** O A: o rival nos trombones, o órgão responde; `s` sobe; `nosso` = o time responde com o SOC-CER-MON. */
    const blocoA = (b0, s, { dois = false, nosso = false } = {}) => {
        mel(tb, b0, TB, { shift: s });
        if (dois) mel(tb2, b0, TB, { shift: s, harm: thirdBelow(MINOR((4 + s) % 12)) });
        if (dois || nosso) mel(gr, b0, TB, { shift: s, vel: 0.75 });
        // a facada no Si7(♭9): o cluster (Si, Dó, Ré#, Lá) rosnando no trio
        for (const [r, l] of TRIO) for (const m of [47, 48, 51, 57]) gr.note((b0 + 7) * 16 + r, m + s, l, 0.5);
        if (nosso) {
            const g = GANCHO.em({ menor: true, tom: 4 + s, oitava: -1 });
            for (const i of [2, 6]) {
                mel(tpA, b0 + i, [g], { shift: i === 6 ? 12 : 0 });
                mel(tb2, b0 + i, [g], { shift: -12 });
                drum(cl, b0 + i, 1, '............X.X.', { vel: 1.1 });
            }
            mel(og, b0 + 3, [ORG[3]], { shift: s });
            mel(og, b0 + 7, [ORG[7]], { shift: s });
        } else mel(og, b0, ORG, { shift: s });
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            riffBar(b, c, { vel: 0.9 });
            if (i === 3 || i === 7) stabs(og, b, c, TRIO, { low: 59, n: 4, vel: 0.7 });
            else padChord(str, b, c, 16, { low: 52, n: 3, vel: dois ? 0.35 : 0.45 });
        });
        if (dois) mel(str, b0, A2_CORDAS, { shift: s, vel: 0.7 });
        groove(b0, 8, dois || s > 0 ? 2 : 1);
        if (!nosso) for (const i of [2, 6]) canto(b0 + i, -20, 0.8);
        drum(cr, b0, 1, 'X...............');
    };
    /** 4 compassos de riff: Mi, Mi, Fá, e a virada. */
    const blocoRiff = (b0, { banda = false } = {}) => {
        RIFF_CH.forEach((c, i) => {
            riffBar(b0 + i, c, { virada: i === 3, banda });
            if (!banda)
                stabs(
                    og,
                    b0 + i,
                    c,
                    B
                        ? [[8, 2]]
                        : [
                              [8, 2],
                              [13, 1],
                          ],
                    { low: 55, n: 4, vel: 0.65 },
                );
        });
        if (!banda)
            stabs(
                tb,
                b0 + 2,
                'Fmaj7',
                [
                    [0, 2],
                    [6, 2],
                ],
                { low: 48, n: 3, vel: 0.8 },
            );
        groove(b0, 4, banda ? 2 : 1);
        drum(cr, b0, 1, 'X...............');
    };

    // ---------- o túnel (0-3): os passos, o coração, a torcida lá em cima; o riff chega ainda no escuro ----------
    ronco.note(0, -24, 0, 1);
    for (const n of ['E2', 'B2']) og.note(0, midi(n), 64, 0.55);
    passos(0, 'x...x...x...x...', 0.8);
    passos(1, 'x.x.x.x.x.x.x.x.', 0.75);
    for (const b of [0, 1]) drum(k, b, 1, 'X..x....X..x....', { pitch: -4, vel: 0.5 });
    canto(0, -22, 0.8);
    canto(1, -20, 0.9);
    riff(bs, 2, 'Em', { vel: 0.8 });
    riff(tu, 2, 'Em', { vel: 0.7 });
    riff(bs, 3, 'Em', { virada: true, vel: 0.9 });
    riff(tu, 3, 'Em', { virada: true, vel: 0.75 });
    passos(2, P16, 0.45);
    passos(3, P16, 0.55);
    drum(k, 2, 2, 'X..x....X..x....', { pitch: -4, vel: 0.6 });
    drum(cl, 3, 1, B ? '........X.......' : '....X.......X...', { vel: 1.1 });
    drum(sn, 3, 1, '..........xxXXXX', { vel: 0.8 });
    drum(ti, 3, 1, '........x.x.xxXX', { pitch: -9, vel: 0.7 });

    // ---------- o riff (4-7), A (8-15), A2 (16-23) ----------
    blocoRiff(4);
    canto(5, -20, 0.8);
    canto(7, -20, 0.8);
    blocoA(8, 0);
    blocoA(16, 0, { dois: true });

    // ---------- o olhar (24-27): a escada do túnel; a banda bate no 1 e no 3, os passos aceleram ----------
    mel(tp, 24, B_TP);
    B_CH.forEach(([c1, c2], i) => {
        const b = 24 + i;
        for (const [r, c] of [
            [0, c1],
            [8, c2],
        ]) {
            stabs(tb, b, c, [[r, 3]], { low: 47, n: 3, vel: 0.7 });
            stabs(og, b, c, [[r, 6]], { low: 55, n: 4, vel: 0.6 });
            padChord(str, b, c, 8, { low: 54, n: 4, vel: 0.35, at: r });
            bs.note(b * 16 + r, raiz(c), 3, 0.95);
            bs.note(b * 16 + r + 6, raiz(c), 1, 0.6);
            tu.note(b * 16 + r, raiz(c) - 12, 3, 0.8);
        }
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(cl, b, 1, B ? '........X.......' : '....X.......X...', { vel: 0.8 });
        drum(hh, b, 1, B ? 'xoxoxoxoxoxoxoxo' : 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
        passos(b, i < 2 ? P8 : P16, 0.3 + 0.08 * i);
        if (i % 2 === 0) canto(b, -18, 0.75);
    });
    drum(cr, 24, 1, 'X...............');
    drum(ti, 27, 1, '........x.x.xxXX', { pitch: -9, vel: 0.7 });
    drum(sn, 27, 1, '........xxXxXXXX', { vel: 0.8 });

    // ---------- solo (28-35): órgão e trombone de 2 em 2, juntos no fim ----------
    mel(ogS, 28, SOLO_ORG);
    mel(tb, 28, SOLO_TB);
    mel(tpA, 34, SOLO_ORG.slice(6), { shift: -12, vel: 0.8 });
    A_CH.forEach((c, i) => {
        const b = 28 + i;
        riffBar(b, c, { vel: 0.85 });
        padChord(str, b, c, 16, { low: 52, n: 3, vel: 0.35 });
        // quem não sola marca o trio
        if (i === 2 || i === 3) stabs(og, b, c, TRIO, { low: 59, n: 4, vel: 0.55 });
        if (i === 0 || i === 1 || i === 4 || i === 5) stabs(tb2, b, c, TRIO, { low: 50, n: 3, vel: 0.7 });
    });
    groove(28, 8, 2);
    drum(cr, 28, 1, 'X...............');
    drum(cr, 32, 1, 'X...............');
    canto(31, -18, 0.8);

    // ---------- o riff na banda inteira (36-39): a torcida chega mais perto ----------
    blocoRiff(36, { banda: true });
    canto(37, -15, 0.9);
    canto(39, -13, 1);

    // ---------- a subida (40-41): a banda bate o 3-3-2 e para, os passos correm; rufo, Dó7 pro Fá menor ----------
    for (const [P, o] of [
        [tb, { low: 47, n: 3 }],
        [og, { low: 55, n: 4 }],
    ])
        stabs(P, 40, 'Am', [0, 3, [6, 2]], o);
    stabs(gr, 40, 'Am', [0, 3, [6, 2]], { low: 45, n: 3 });
    bass(bs, 40, 'Am', '0:3 0:3 0:2 r:8');
    tu.note(40 * 16, midi('A1'), 3, 1);
    tu.note(40 * 16 + 3, midi('A1'), 3, 1);
    tu.note(40 * 16 + 6, midi('A1'), 2, 1);
    drum(k, 40, 1, 'X..X..X.........');
    drum(cl, 40, 1, 'X..X..X.........', { vel: 1.1 });
    drum(cr, 40, 1, 'X...............');
    passos(40, '........xxxxxxxx', 0.7);
    canto(40, -10, 1);
    sobe.note(41 * 16, 0, 0, 1);
    bass(bs, 41, 'C7', '0:2 0:2 0:2 0:2 s:2 5:2 3:2 c:2');
    stabs(og, 41, 'C7', [[0, 16]], { low: 55, n: 4, vel: 0.6 });
    padChord(str, 41, 'C7', 16, { low: 55, n: 4, vel: 0.55 });
    mel(tb, 41, ['C3:1 E3:1 G3:1 Bb3:1 C4:1 E4:1 G4:1 Bb4:1 C5:4 B4:2 C5:2']);
    mel(tu, 41, ['C2:4 C2:4 C2:2 E2:2 G2:2 B1:2']);
    drum(k, 41, 1, 'X...X...X...X.XX');
    drum(sn, 41, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.85 });
    drum(ti, 41, 1, '........xxxxXXXX', { pitch: -8, vel: 0.65 });
    passos(41, P16, 0.6);
    canto(41, -9, 1);

    // ---------- A' em Fá menor (42-49): o rival fala, e o nosso time responde ----------
    blocoA(42, 1, { dois: true, nosso: true });

    // ---------- final (50-53): o portão abre; o riff em Ré♭, o 3-3-2 no Dó7(♭9), o Fá menor e o corte ----------
    rugido.note(50 * 16, 0, 0, 1);
    drum(cr, 50, 1, 'X...............');
    drum(ti, 50, 1, 'X...............', { pitch: -7 });
    padChord(str, 50, 'Dbmaj7', 16, { low: 53, n: 4, vel: 0.7 });
    riffBar(50, 'Dbmaj7', { banda: true });
    groove(50, 1, 2);
    for (const [P, o] of [
        [tb, { low: 48, n: 3 }],
        [og, { low: 55, n: 4 }],
    ])
        stabs(P, 51, 'C7b9', [0, 3, [6, 2]], o);
    stabs(gr, 51, 'C7b9', [0, 3, [6, 2]], { low: 46, n: 4 });
    mel(tpA, 51, [GANCHO.em({ menor: true, tom: 5, oitava: -1 })]);
    bass(bs, 51, 'C7b9', '0:3 0:3 0:2 r:8');
    tu.note(51 * 16, midi('C2'), 3, 1);
    tu.note(51 * 16 + 3, midi('C2'), 3, 1);
    tu.note(51 * 16 + 6, midi('C2'), 2, 1);
    drum(k, 51, 1, 'X..X..X.........');
    drum(cl, 51, 1, '............X.X.', { vel: 1.1 });
    drum(sn, 51, 1, '........xxXxXXXX');
    // Fá menor, a banda corta, um último clap molhado sozinho
    for (const n of ['F3', 'Ab3', 'C4', 'G4']) og.note(52 * 16, midi(n), 3, 1);
    for (const [P, n] of [
        [tb, 'F2'],
        [tu, 'F1'],
        [bs, 'F1'],
        [tpA, 'C5'],
        [gr, 'F2'],
        [bsx, 'F1'],
    ])
        P.note(52 * 16, midi(n), 3, 1);
    drum(k, 52, 1, 'X...............');
    drum(cr, 52, 1, 'X...............');
    drum(ti, 52, 1, 'X...............', { pitch: -7 });
    drum(cl, 52, 1, '........X.......', { vel: 1.2 });
    // três passos, agora no gramado
    passos(53, 'x...x...x.......', 0.35);
    return S;
}

/** B (escolhida pelo Miguel em 17/11): 108 BPM, meio-tempo com percussão em dobro e o riff do 3-3-2. */
export default () => tunel('B');
/** A: 100 BPM, groove inteiro (`node scripts/musica/album.mjs 12b-o-tunel:A`). */
export const A = () => tunel('A');
