// Faixa nova do álbum (rodada 3, 17/11/2026), "O túnel" (EN "The Tunnel"). A PESADA, pedida na linha de "Quem manda
// aqui" (o Miguel: "é isso que você precisa buscar"): groove lento e ameaçador, clap 808 molhado no 3, metais graves,
// órgão de rodas e solo. Mi menor (com o Fá do frígio) → Fá menor, 80 BPM, meio-tempo.
// A história: a noite da final, os dois times no túnel, antes de entrar em campo. O TÚNEL (4): escuro, o órgão no
// grave, o ronco da arquibancada lá em cima, as travas da chuteira no concreto (os passos, no tempo), o coração, e a
// torcida cantando o SOC-CER-MON abafada pelas paredes. Os passos param: o rival chega (a tuba sozinha, o motivo dele)
// e o primeiro clap molhado. A (8): o rival fala nos trombones (sobe pelo Mi menor e despenca no Fá, o ♭II); o órgão
// responde, e lá em cima a torcida canta de novo. A2 (8): o baixo desce em contraponto com as cordas; os passos viram
// chimbal. O OLHAR (8): os dois capitães se encarando; a banda só bate no 1 e na antecipação e some, e no silêncio
// sobram o coração e a torcida abafada; a harmonia desce um degrau por compasso (Dó, Si, Si♭, Lá, Lá♭, Sol: a escada
// do túnel) e o trompete abafado desce junto. SOLO (8): órgão e trombone trocando de 2 em 2, como dois capitães
// medindo forças. A SUBIDA (2): os passos aceleram, a torcida fica mais perto, e o Dó7 leva meio tom acima. A' em Fá
// menor (8): o rival fala de novo, mas agora o NOSSO time responde, com o SOC-CER-MON no trompete aberto e as palmas
// molhadas. FINAL (4): o portão abre (a torcida sem parede, de verdade), o Ré♭maj7, o 3-3-2 da banda no Dó7(♭9), o
// Fá menor e a banda corta, um último clap molhado sozinho, e três passos no gramado.
// Assinatura: as travas no concreto (passos no tempo, que param, viram chimbal e aceleram) e a torcida abafada pelas
// paredes cantando o 3-3-2, que no fim aparece sem parede.
// Forma: túnel 4 | A 8 | A2 8 | o olhar 8 | solo 8 | subida 2 | A' Fá menor 8 | final 4 = 50 compassos (~2:30).
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
import { trava } from './kit-novas.mjs';

export const meta = { titulo: 'O túnel', faixa: '12b' };

const A_CH = ['Em', 'Fmaj7', 'Em', 'B7', 'Am', 'C', 'Fmaj7', 'B7b9'];
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
const A2_BAIXO = [
    'E2:3 E2:1 r:2 D2:2 C2:2 r:2 B1:2 A1:2',
    'F1:3 F1:1 r:2 A1:2 C2:2 r:2 E2:2 F2:2',
    'E2:3 E2:1 r:2 G2:2 B1:2 r:2 E2:2 D2:2',
    'B1:3 B1:1 r:2 D#2:2 F#2:2 r:2 A2:2 B1:2',
    'A1:3 A1:1 r:2 C2:2 E2:2 r:2 A1:2 G1:2',
    'C2:3 C2:1 r:2 E2:2 G2:2 r:2 C2:2 B1:2',
    'F1:3 F1:1 r:2 A1:2 C2:2 E2:2 F2:2 F#2:2',
    'B1:3 B1:1 C2:2 B1:2 A1:2 G1:2 F#1:2 F1:2',
];
const A2_CORDAS = ['B4:16', 'A4:8 G4:8', 'G4:16', 'F#4:8 A4:8', 'E4:16', 'E4:8 G4:8', 'A4:16', 'F#4:8 D#4:8'];
// o olhar: a escada do túnel, um semitom por compasso, e o trompete abafado descendo junto
const B_CH = ['Cmaj7', 'B7', 'Bbmaj7', 'A7', 'Abmaj7', 'G7', 'F#7', 'B7b9'];
const B_TP = [
    'E5:6 D5:2 B4:8',
    'D#5:6 C5:2 A4:8',
    'D5:6 C5:2 A4:8',
    'C#5:6 Bb4:2 G4:8',
    'C5:6 Bb4:2 G4:8',
    'B4:6 Ab4:2 F4:8',
    'A#4:4 C#5:4 E5:4 G5:4',
    'F#5:4 D#5:4 C5:4 A4:4',
];
// solo: órgão e trombone trocando de 2 em 2, juntos no último
const SOLO_ORG = [
    'r:2 B4:1 D5:1 E5:2 G5:2 F#5:1 G5:1 E5:2 D5:2 B4:2',
    'A5:1 B5:1 C6:2 E6:1 F6:3 E6:2 C6:2 A5:4',
    'r:16',
    'r:16',
    'r:2 C5:1 E5:1 A5:2 C6:2 B5:1 C6:1 A5:2 G5:2 E5:2',
    'G5:1 A5:1 C6:2 E6:1 G6:3 F#6:1 F6:1 E6:2 D6:2 C6:2',
    'r:16',
    'B4:2 D#5:2 F#5:2 A5:2 C6:4 B5:4',
];
const SOLO_TB = [
    'r:16',
    'r:16',
    'r:2 E3:1 G3:1 B3:2 D4:2 E4:3 D4:1 B3:2 G3:2',
    'F#3:2 A3:2 C4:1 B3:3 A3:2 F#3:2 D#3:4',
    'r:16',
    'r:16',
    'A3:3 C4:3 F4:2 E4:2 C4:2 A3:4',
    'B3:2 D#4:2 F#4:2 A4:2 C5:4 B4:4',
];
const BAIXO = '0:3 0:1 r:4 0:2 5:2 8:2 s:2';

export default function oTunel() {
    const S = new Song({ bpm: 80, bars: 50, swing: 0.06, tail: 6, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 1.05 });
    const duck = bombeio(S, k, { prof: 0.3, solta: 0.2 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.6, rev: 0.12 });
    const cl = S.part('claps', clapMolhado, { drum: true, gain: 1.4, rev: 0.3, pan: 0.05 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.55, pan: -0.2 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.25, rev: 0.25 });
    const pe = S.part('travas', trava, { drum: true, gain: 1.2, rev: 0.35, echo: { rows: 3, fb: 0.3, mix: 0.25 } });
    const ronco = S.part('arquibancada', torcida(13, 2, 1), { drum: true, gain: 0.5 });
    const gc = S.part('canto', torcida(0.35, 0.02, 0.2), { drum: true, gain: 0.9, rev: 0.4 });
    const gl = S.part('cantoLongo', torcida(0.8, 0.02, 0.5), { drum: true, gain: 0.9, rev: 0.4 });
    const rugido = S.part('rugido', torcida(7, 0.35, 4), { drum: true, gain: 0.55, rev: 0.3 });
    const sobe = S.part('subida', deslize(90, 720, 5.5), { drum: true, gain: 0.18, rev: 0.3 });
    const tb = trombone(S, 'trombones', { pan: -0.1, gain: 0.95, rev: 0.22 });
    const tb2 = trombone(S, 'terças', { pan: 0.3, gain: 0.6, rev: 0.22 });
    const tu = tuba(S, 'tuba', { gain: 0.7, rev: 0.12 });
    const tp = trompete(S, 'trompete', { pan: -0.2, gain: 0.75, rev: 0.3, corte: 2300 });
    const tpA = trompete(S, 'trompeteAberto', { pan: 0.15, gain: 0.85, rev: 0.25 });
    const og = orgao(S, 'orgao', { pan: 0.2, gain: 0.9, rev: 0.3, gainAt: duck });
    const ogS = orgao(S, 'orgaoSolo', { pan: -0.15, gain: 1.6, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.45, gainAt: duck });

    /** A torcida lá em cima: o SOC-CER-MON no 3-3-2. `p` grave = abafada pela parede. */
    const canto = (b, p = -20, vel = 1) => {
        gc.note(b * 16, p, 0, vel);
        gc.note(b * 16 + 3, p, 0, vel);
        gl.note(b * 16 + 6, p + 2, 0, vel);
    };
    /** Os passos: travas no concreto, pé esquerdo e direito. */
    const passos = (b, pat = 'x...x...x...x...', vel = 0.8) => {
        const p = pat.replace(/\s/g, '');
        for (let i = 0; i < 16; i++) if (p[i] !== '.') pe.note(b * 16 + i, i % 8 < 4 ? 0 : -2, 0, vel);
    };
    const meioTempo = (b, n, cheio = true) => {
        drum(k, b, n, cheio ? 'X......x..X.....' : 'X.........X.....');
        drum(cl, b, n, '........X.......');
        drum(sn, b, n, cheio ? '...o....X..o..o.' : '........x.......', { vel: 0.7 });
        drum(hh, b, n, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    };
    /** O A: o rival nos trombones, o órgão responde; `s` sobe; `nosso` = o time responde com o SOC-CER-MON. */
    const blocoA = (b0, s, { dois = false, nosso = false } = {}) => {
        mel(tb, b0, TB, { shift: s });
        mel(tu, b0, TB, { shift: s - 12, vel: 0.75 });
        if (dois) mel(tb2, b0, TB, { shift: s, harm: thirdBelow(MINOR((4 + s) % 12)) });
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
            if (dois) mel(bs, b, [A2_BAIXO[i]], { shift: s });
            else bass(bs, b, c, BAIXO);
            if (i === 3 || i === 7)
                stabs(
                    og,
                    b,
                    c,
                    [
                        [8, 1],
                        [10, 1],
                        [12, 2],
                    ],
                    { low: 59, n: 4, vel: 0.7 },
                );
            else padChord(str, b, c, 16, { low: 52, n: 3, vel: dois ? 0.4 : 0.55 });
            if (dois) passos(b, 'x.x.x.x.x.x.x.x.', 0.45);
            else passos(b, 'x...x...x...x...', 0.4);
        });
        if (dois) mel(str, b0, A2_CORDAS, { shift: s, vel: 0.8 });
        meioTempo(b0, 8, dois || s > 0);
        if (!nosso) for (const i of [2, 6]) canto(b0 + i, -20, 0.8);
        drum(cr, b0, 1, 'X...............');
    };

    // ---------- o túnel (0-3): o escuro, os passos, o coração, a torcida lá em cima ----------
    ronco.note(0, -24, 0, 1);
    for (const n of ['E2', 'B2']) og.note(0, midi(n), 48, 0.6);
    for (const b of [0, 1, 2]) {
        passos(b);
        drum(k, b, 1, 'X..x............', { pitch: -4, vel: 0.55 });
    }
    canto(1);
    canto(2);
    padChord(str, 2, 'Em', 32, { low: 52, n: 3, vel: 0.45 });
    passos(3, 'x...x...........');
    mel(tu, 3, [TB[0]], { shift: -12, vel: 0.9 });
    drum(cl, 3, 1, '........X.......', { vel: 1.1 });
    drum(ti, 3, 1, '............x.xx', { pitch: -9, vel: 0.7 });

    // ---------- A (4-11), A2 (12-19) ----------
    blocoA(4, 0);
    blocoA(12, 0, { dois: true });
    drum(sn, 19, 1, '........xxXxXXXX', { vel: 0.8 });

    // ---------- o olhar (20-27): a banda só bate no 1 e na antecipação; no silêncio, o coração e a torcida ----------
    mel(tp, 20, B_TP);
    B_CH.forEach((c, i) => {
        const b = 20 + i;
        stabs(
            tb,
            b,
            c,
            [
                [0, 2],
                [10, 2],
            ],
            { low: 47, n: 3, vel: 0.9 },
        );
        stabs(
            og,
            b,
            c,
            [
                [0, 2],
                [10, 4],
            ],
            { low: 55, n: 4, vel: 0.7 },
        );
        bass(bs, b, c, '0:2 r:8 0:2 r:4', { vel: 0.9 });
        tu.note(b * 16, midi('E1') + ((chord(c).root - 4 + 12) % 12), 2, 0.8);
        drum(k, b, 1, 'X.........X.....');
        drum(k, b, 1, '....X..x........', { pitch: -4, vel: 0.4 });
        drum(cl, b, 1, '........X.......', { vel: i % 2 ? 0.9 : 0.6 });
        if (i % 2 === 0) canto(b, -18, 0.7);
    });
    padChord(str, 24, 'Abmaj7', 32, { low: 55, n: 4, vel: 0.35 });
    padChord(str, 26, 'F#7', 16, { low: 54, n: 4, vel: 0.45 });
    padChord(str, 27, 'B7b9', 16, { low: 54, n: 4, vel: 0.55 });
    drum(cr, 20, 1, 'X...............');
    drum(cr, 24, 1, 'X...............');
    drum(ti, 27, 1, '........x.x.xxXX', { pitch: -9, vel: 0.7 });

    // ---------- solo (28-35): órgão e trombone, de 2 em 2 ----------
    mel(ogS, 28, SOLO_ORG);
    mel(tb, 28, SOLO_TB);
    mel(tu, 28, SOLO_TB, { shift: -12, vel: 0.6 });
    A_CH.forEach((c, i) => {
        const b = 28 + i;
        bass(bs, b, c, BAIXO);
        padChord(str, b, c, 16, { low: 52, n: 3, vel: 0.45 });
        if (i % 2 === 1)
            stabs(
                og,
                b,
                c,
                [
                    [8, 1],
                    [10, 1],
                    [12, 2],
                ],
                { low: 59, n: 4, vel: 0.6 },
            );
        passos(b, 'x.x.x.x.x.x.x.x.', 0.4);
    });
    meioTempo(28, 8);
    drum(cr, 28, 1, 'X...............');
    drum(cr, 32, 1, 'X...............');

    // ---------- a subida (36-37): os passos aceleram, a torcida chega mais perto, Dó7 pro Fá menor ----------
    sobe.note(36 * 16, 0, 0, 1);
    for (const [b, c] of [
        [36, 'Am'],
        [37, 'C7'],
    ]) {
        bass(bs, b, c, b === 36 ? BAIXO : '0:2 0:2 0:2 0:2 s:2 5:2 3:2 c:2');
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.6 });
        stabs(
            og,
            b,
            c,
            [
                [0, 6],
                [8, 6],
            ],
            { low: 55, n: 4, vel: 0.6 },
        );
    }
    passos(36, 'x.x.x.x.x.x.x.x.', 0.6);
    passos(37, 'xxxxxxxxxxxxxxxx', 0.6);
    canto(36, -12, 0.9);
    canto(37, -10, 1);
    meioTempo(36, 1);
    drum(k, 37, 1, 'X...X...X...X...');
    drum(sn, 37, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    drum(ti, 37, 1, '........xxxxXXXX', { pitch: -8, vel: 0.6 });
    mel(tb, 37, ['r:8 E3:2 G3:2 Bb3:2 C4:2']);

    // ---------- A' em Fá menor (38-45): o rival fala, e o nosso time responde ----------
    blocoA(38, 1, { dois: true, nosso: true });

    // ---------- final (46-49): o portão abre; Ré♭maj7, o 3-3-2 no Dó7(♭9), o Fá menor e o corte ----------
    rugido.note(46 * 16, 0, 0, 1);
    drum(cr, 46, 1, 'X...............');
    drum(ti, 46, 1, 'X...............', { pitch: -7 });
    padChord(str, 46, 'Dbmaj7', 16, { low: 53, n: 4, vel: 0.8 });
    padChord(og, 46, 'Dbmaj7', 14, { low: 53, n: 4, vel: 0.8 });
    mel(tb, 46, [TB[0]], { shift: 1 });
    mel(tu, 46, [TB[0]], { shift: -11 });
    bass(bs, 46, 'Dbmaj7', BAIXO);
    meioTempo(46, 1);
    // o 3-3-2 da banda inteira, e o gancho no trompete aberto por cima
    for (const [P, o] of [
        [tb, { low: 48, n: 3 }],
        [og, { low: 55, n: 4 }],
    ])
        stabs(P, 47, 'C7b9', [0, 3, [6, 2]], o);
    mel(tpA, 47, [GANCHO.em({ menor: true, tom: 5, oitava: -1 })]);
    bass(bs, 47, 'C7b9', '0:3 0:3 0:2 r:8');
    drum(k, 47, 1, 'X..X..X.........');
    drum(cl, 47, 1, '............X.X.', { vel: 1.1 });
    drum(sn, 47, 1, '........xxXxXXXX');
    // Fá menor, a banda corta, um último clap molhado sozinho
    for (const n of ['F3', 'Ab3', 'C4', 'G4']) og.note(48 * 16, midi(n), 3, 1);
    for (const [P, n] of [
        [tb, 'F2'],
        [tu, 'F1'],
        [bs, 'F1'],
        [tpA, 'C5'],
    ])
        P.note(48 * 16, midi(n), 3, 1);
    drum(k, 48, 1, 'X...............');
    drum(cr, 48, 1, 'X...............');
    drum(ti, 48, 1, 'X...............', { pitch: -7 });
    drum(cl, 48, 1, '........X.......', { vel: 1.2 });
    // três passos, agora no gramado (sem o eco do túnel: mais baixos)
    passos(49, 'x...x...x.......', 0.35);
    return S;
}
