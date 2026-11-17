// Faixa nova do álbum (rodada 3, 17/11/2026), "Volta olímpica" (EN "Lap of Honor"). A EMOCIONANTE, pedida na linha de
// "Quem manda aqui": groove lento, clap 808 molhado, metais graves, órgão e solo. Aqui o mesmo material vira soul
// gospel: o órgão de igreja, o trompete cantando, os trombones respondendo, e o acorde menor emprestado (o iv menor,
// Sol♭ menor com sexta) que dá o nó na garganta no fim de cada frase. Ré♭ maior → Ré maior, 72 BPM.
// A história: depois do título, a volta olímpica com a taça, o estádio ainda cantando, a temporada inteira passando
// pela cabeça. INTRO (4): o órgão sozinho, a torcida longe, as cordas cantando o SOC-CER-MON devagar, como hino, e os
// flashes dos fotógrafos (o estalo e o "fiiii" do flash recarregando). A (8): o trompete canta o tema, o órgão
// responde, os trombones fecham; o Sol♭m6 no fim (o nó na garganta). A2 (8): as cordas em contracanto, os trombones
// em terças. A LEMBRANÇA (8): Si♭ menor, a temporada passando: o motivo d'"O plano infalível" no Rhodes, baixinho, e o
// do chefe ("Quem manda aqui") nos trombones, os dois agora mansos (até os vilões aplaudem); o trompete fecha no
// Sol♭m6. SOLO (8): trompete 4 compassos, órgão 4 (de 4 em 4, como o jazz da Sala). O RESPIRO (2): a banda some e
// sobra a torcida batendo o 3-3-2, os flashes, o órgão subindo, e o Lá7 leva meio tom acima. A' em Ré maior (8): tudo,
// as cordas no agudo como coro e a torcida respondendo com o "hey hey". FINAL (4): o SOC-CER-MON em câmera lenta no
// trompete (no Sol maior7), o Sol menor com sexta (a última lágrima), o "amém" em Ré maior com prato e tímpano, e um
// último clap molhado com o último flash.
// Assinatura: os flashes dos fotógrafos, tocados no tempo (no contratempo das pausas), e o hino da torcida.
// Forma: intro 4 | A 8 | A2 8 | lembrança 8 | solo 8 | respiro 2 | A' Ré maior 8 | final 4 = 50 compassos (~2:47).
import { MOTIVO as GIOVANNI } from '../pecas/lider-giovanni.mjs';
import { torcida } from '../pecas/livre-ginasio.mjs';
import { MOTIVO as ROCKET } from '../pecas/tema-rocket.mjs';
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    MAJOR,
    mel,
    midi,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';
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
import { flash } from './kit-novas.mjs';

export const meta = { titulo: 'Volta olímpica', faixa: '16b' };

const A_CH = ['Dbmaj7', 'Fm7', 'Bbm7', 'Gbmaj7', 'Ebm7', 'Ab7sus4', 'Dbmaj7', 'Gbm6'];
// o tema: o trompete canta (1-2, 5-6), o órgão responde (3-4), os trombones fecham (7), o nó na garganta (8)
const TP = [
    'Ab4:3 Db5:3 F5:6 Eb5:2 Db5:2',
    'C5:6 Eb5:2 Ab5:8',
    'r:16',
    'r:16',
    'Gb4:3 Bb4:3 Db5:6 C5:2 Bb4:2',
    'Db5:6 Eb5:2 Gb5:8',
    'r:16',
    'Eb5:4 Db5:4 A4:8',
];
const ORG = [
    'r:16',
    'r:16',
    'r:4 F5:2 Ab5:2 Db6:3 C6:1 Bb5:2 Ab5:2',
    'Bb5:6 Ab5:2 F5:4 Db5:4',
    'r:16',
    'r:16',
    'r:16',
    'r:16',
];
const TB = ['r:16', 'r:16', 'r:16', 'r:16', 'r:16', 'r:16', 'F3:3 Ab3:3 C4:6 Db4:4', 'r:16'];
const A2_CORDAS = ['F4:8 C5:8', 'Eb5:16', 'Db5:16', 'Bb4:8 F4:8', 'Gb4:16', 'Gb4:8 F4:8', 'F4:16', 'A4:8 Eb4:8'];
// a lembrança: Si♭ menor; os motivos dos vilões, mansos (Rocket em Dó menor e o chefe em Fá# menor, no tom daqui)
const B_CH = ['Bbm7', 'F7b9', 'Bbm7', 'F7', 'Gbmaj7', 'Ab7', 'Fm7', 'Gbm6'];
const B_TP = [
    'r:16',
    'r:16',
    'r:16',
    'r:16',
    'Bb4:4 Db5:4 F5:8',
    'Eb5:4 C5:4 Gb5:8',
    'Ab5:6 G5:2 F5:4 Eb5:4',
    'Eb5:4 Db5:4 A4:6 Ab4:2',
];
// solo de 4 em 4: o trompete e depois o órgão
const SOLO_TP = [
    'r:2 Ab4:1 Bb4:1 C5:2 Db5:2 F5:3 Eb5:1 Db5:2 C5:2',
    'Ab5:6 G5:1 Ab5:1 F5:4 C5:4',
    'Db5:2 F5:2 Ab5:2 Bb5:2 Db6:6 C6:2',
    'Bb5:3 Ab5:1 F5:2 Db5:2 Eb5:8',
];
const SOLO_ORG = [
    'r:2 Gb5:1 Bb5:1 Db6:2 Eb6:2 Gb6:3 F6:1 Eb6:2 Db6:2',
    'Eb6:1 Db6:1 Bb5:2 Ab5:2 Gb5:2 Eb5:4 Db5:4',
    'C6:2 Db6:2 F6:4 Ab6:4 F6:2 Eb6:2',
    'Eb6:2 Db6:2 A5:4 Gb5:4 Eb5:4',
];
const BAIXO = '0:6 5:2 8:4 3:2 5:2';
const COMP = [
    [0, 6],
    [7, 1],
    [10, 6],
];

export default function voltaOlimpica() {
    const S = new Song({ bpm: 72, bars: 50, swing: 0.1, tail: 7, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.95 });
    const duck = bombeio(S, k, { prof: 0.2, solta: 0.25 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.8, rev: 0.15 });
    const cl = S.part('claps', clapMolhado, { drum: true, gain: 1.3, rev: 0.35, pan: 0.05 });
    const pl = S.part('torcidaPalmas', I.palmas, { drum: true, gain: 1.1, rev: 0.4, pan: -0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.5, pan: -0.2 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.3, rev: 0.3 });
    const fl = S.part('flash', flash, { drum: true, gain: 0.9, rev: 0.35 });
    const longe = S.part('estadio', torcida(16, 3, 4), { drum: true, gain: 0.35, rev: 0.4 });
    const tp = trompete(S, 'trompete', { pan: -0.1, gain: 0.9, rev: 0.32, corte: 2800 });
    const tb = trombone(S, 'trombones', { pan: 0.2, gain: 0.85, rev: 0.25 });
    const tb2 = trombone(S, 'terças', { pan: 0.35, gain: 0.5, rev: 0.25 });
    const tu = tuba(S, 'tuba', { gain: 0.55, rev: 0.15 });
    const og = orgao(S, 'orgao', { pan: 0.2, gain: 0.8, rev: 0.35, gainAt: duck });
    const ogS = orgao(S, 'orgaoSolo', { pan: -0.2, gain: 1.4, rev: 0.25, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const rh = rhodes(S, 'rhodes', { pan: -0.25, gain: 0.42, rev: 0.25, gainAt: duck });
    const str = S.part('cordas', I.strings, { gain: 0.85, rev: 0.4 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.3, gainAt: duck });

    const groove = (b, n = 1, cheio = true) => {
        drum(k, b, n, cheio ? 'X......x..X.....' : 'X.........X.....');
        drum(cl, b, n, '....X.......X...');
        drum(sn, b, n, cheio ? '..o....o..o...o.' : '................', { vel: 0.6 });
        drum(hh, b, n, 'x.x.x.x.x.x.x.x.', { vel: 0.45 });
    };
    /** O A (ou A2, ou A' com `s` semitons). */
    const blocoA = (b0, s, { dois = false } = {}) => {
        mel(tp, b0, TP, { shift: s });
        mel(og, b0, ORG, { shift: s });
        mel(tb, b0, TB, { shift: s });
        mel(tu, b0, TB, { shift: s - 12, vel: 0.7 });
        if (dois) {
            mel(tb2, b0, TP, { shift: s - 12, harm: thirdBelow(MAJOR((1 + s) % 12)) });
            mel(str, b0, A2_CORDAS, { shift: s + (s ? 12 : 0), vel: 0.8 });
        }
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            bass(bs, b, c, BAIXO);
            stabs(rh, b, c, COMP, { low: 56, n: 4, vel: 0.55 });
            if (i !== 2 && i !== 3) padChord(og, b, c, 16, { low: 53, n: 4, vel: 0.45 });
            if (!dois) padChord(str, b, c, 16, { low: 53, n: 3, vel: 0.4 });
        });
        groove(b0, 8, dois || s > 0);
        drum(cr, b0, 1, 'X...............');
        // os flashes nas pausas do tema
        drum(fl, b0 + 1, 1, '.............x..', { pitch: 0 });
        drum(fl, b0 + 5, 1, '.........x......', { pitch: 3 });
        if (dois) drum(fl, b0 + 7, 1, '...........x....', { pitch: -2 });
    };

    // ---------- intro (0-3): o órgão, a torcida longe, o hino nas cordas, os flashes ----------
    longe.note(0, -6, 0, 1);
    for (const [b, c] of [
        [0, 'Dbmaj7'],
        [1, 'Gbmaj7'],
        [2, 'Bbm7'],
        [3, 'Ab7sus4'],
    ])
        padChord(og, b, c, 16, { low: 53, n: 4, vel: 0.6 });
    mel(str, 1, [GANCHO.em({ tom: 1, oitava: -1, ritmo: [6, 6, 4, 0] })], { vel: 0.9 });
    mel(str, 2, ['F4:16'], { vel: 0.6 });
    stabs(rh, 2, 'Bbm7', COMP, { low: 56, n: 4, vel: 0.45 });
    arp(rh, 3, 'Ab7sus4', { low: 56, step: 2, vel: 0.45 });
    drum(fl, 0, 1, '......x.........');
    drum(fl, 1, 1, '..x........x....', { pitch: 2 });
    drum(fl, 2, 1, '........x.......', { pitch: -3 });
    bass(bs, 3, 'Ab7sus4', '0:12 5:2 8:2', { vel: 0.7 });
    drum(k, 3, 1, '............X...', { vel: 0.7 });
    drum(cl, 3, 1, '............X...');

    // ---------- A (4-11), A2 (12-19) ----------
    blocoA(4, 0);
    blocoA(12, 0, { dois: true });

    // ---------- a lembrança (20-27): Si♭ menor, os motivos dos vilões, mansos ----------
    mel(rh, 20, ROCKET.mel, { shift: -2, vel: 0.65 });
    mel(tb, 22, GIOVANNI.mel, { shift: -8, vel: 0.7 });
    mel(tu, 22, GIOVANNI.mel, { shift: -20, vel: 0.45 });
    mel(tp, 20, B_TP);
    mel(tb2, 24, B_TP.slice(4), { shift: -12, harm: thirdBelow(MAJOR(1)), vel: 0.8 });
    B_CH.forEach((c, i) => {
        const b = 20 + i;
        bass(bs, b, c, i < 4 ? '0:8 5:4 8:4' : BAIXO, { vel: 0.85 });
        padChord(str, b, c, 16, { low: 53, n: 4, vel: 0.5 });
        padChord(og, b, c, 16, { low: 53, n: 4, vel: i < 4 ? 0.35 : 0.5 });
        if (i >= 4) stabs(rh, b, c, COMP, { low: 56, n: 4, vel: 0.5 });
    });
    groove(20, 4, false);
    groove(24, 4, true);
    drum(cr, 24, 1, 'X...............');
    drum(fl, 21, 1, '...........x....', { pitch: 1 });
    drum(fl, 23, 1, '.....x..........', { pitch: -1 });

    // ---------- solo (28-35): trompete 4, órgão 4 ----------
    mel(tp, 28, SOLO_TP);
    mel(ogS, 32, SOLO_ORG);
    A_CH.forEach((c, i) => {
        const b = 28 + i;
        bass(bs, b, c, BAIXO);
        stabs(rh, b, c, COMP, { low: 56, n: 4, vel: 0.5 });
        padChord(str, b, c, 16, { low: 53, n: 3, vel: 0.4 });
        if (i < 4) padChord(og, b, c, 16, { low: 53, n: 4, vel: 0.4 });
        else
            stabs(
                tb,
                b,
                c,
                [
                    [8, 1],
                    [10, 1],
                    [12, 2],
                ],
                { low: 50, n: 3, vel: 0.6 },
            );
    });
    groove(28, 8);
    drum(cr, 28, 1, 'X...............');
    drum(cr, 32, 1, 'X...............');

    // ---------- o respiro (36-37): só a torcida no 3-3-2, os flashes, o órgão subindo; Lá7 pro Ré ----------
    padChord(og, 36, 'Gbmaj7', 16, { low: 53, n: 4, vel: 0.6 });
    padChord(og, 37, 'A7', 16, { low: 55, n: 4, vel: 0.75 });
    padChord(str, 36, 'Gbmaj7', 16, { low: 58, n: 4, vel: 0.45 });
    padChord(str, 37, 'A7', 16, { low: 61, n: 4, vel: 0.6 });
    for (const b of [36, 37]) {
        drum(pl, b, 1, 'X..X..X.....x.x.');
        drum(k, b, 1, 'X..X..X.........', { vel: 0.6 });
    }
    drum(fl, 36, 1, '.....x.....x....', { pitch: 2 });
    drum(fl, 37, 1, '........x.......', { pitch: -2 });
    bs.note(36 * 16, midi('Gb1'), 16, 0.8);
    bs.note(37 * 16, midi('A1'), 12, 0.9);
    mel(tb, 37, ['r:8 E3:4 G3:4']);
    drum(ti, 37, 1, '........x.x.xxXX', { pitch: -6, vel: 0.6 });

    // ---------- A' em Ré maior (38-45): tudo, o coro nas cordas e a torcida respondendo ----------
    blocoA(38, 1, { dois: true });
    for (const i of [1, 5]) drum(pl, 38 + i, 1, '............X.X.', { vel: 0.9 });

    // ---------- final (46-49): o SOC-CER-MON em câmera lenta, a última lágrima, o amém ----------
    const g = GANCHO.em({ tom: 2, oitava: -1, ritmo: [6, 6, 4, 0] });
    mel(tp, 46, [g]);
    mel(tb, 46, [g], { shift: -12 });
    mel(tu, 46, [g], { shift: -24, vel: 0.6 });
    padChord(og, 46, 'Gmaj7', 16, { low: 55, n: 4, vel: 0.6 });
    padChord(str, 46, 'Gmaj7', 16, { low: 55, n: 4, vel: 0.6 });
    bass(bs, 46, 'Gmaj7', BAIXO);
    groove(46);
    drum(pl, 46, 1, '............X.X.', { vel: 0.9 });
    // Sol menor com sexta: a última lágrima
    mel(tp, 47, ['Bb4:8 A4:8']);
    padChord(og, 47, 'Gm6', 16, { low: 55, n: 4, vel: 0.65 });
    padChord(str, 47, 'Gm6', 16, { low: 55, n: 4, vel: 0.6 });
    mel(bs, 47, ['G1:12 A1:4'], { vel: 0.9 });
    drum(k, 47, 1, 'X...............', { vel: 0.7 });
    drum(cl, 47, 1, '....X.......X...', { vel: 0.8 });
    drum(ti, 47, 1, '............x.xX', { pitch: -7, vel: 0.6 });
    // o amém: Ré maior (com sétima maior e nona), tudo junto, e o rabo de sala
    mel(tp, 48, ['F#5:16']);
    for (const n of ['D3', 'A3', 'F#4']) tb.note(48 * 16, midi(n), 14, 0.9);
    for (const n of ['D3', 'F#3', 'A3', 'C#4', 'E4']) og.note(48 * 16, midi(n), 16, 0.8);
    padChord(str, 48, 'Dmaj7', 16, { low: 50, n: 5, vel: 0.75 });
    padChord(rh, 48, 'Dmaj7', 12, { low: 57, n: 4, vel: 0.6 });
    tu.note(48 * 16, midi('D2'), 14, 0.8);
    bs.note(48 * 16, midi('D1'), 14, 1);
    drum(k, 48, 1, 'X...............');
    drum(cr, 48, 1, 'X...............');
    drum(ti, 48, 1, 'X...............', { pitch: -4 });
    drum(pl, 48, 1, 'X...............', { vel: 0.8 });
    // o último clap molhado, o último flash e o Rhodes lá em cima
    drum(cl, 49, 1, '....X...........', { vel: 1.1 });
    drum(fl, 49, 1, '..........x.....');
    rh.note(49 * 16 + 8, midi('D6'), 8, 0.5);
    return S;
}
