// Faixa nova do álbum (rodada 3, 17/11/2026), "Altinha" (EN "Keep-Ups on the Sand"). Pedido do Miguel: mais faixas
// animadas e divertidas como "O plano infalível", e um DANCEHALL pra experimentar. Dancehall de verdade: o dembow (bumbo
// reto e o aro no 3-3-2 que puxa), o sub de 808 bombeando, o skank no contratempo, steel pan e metais graves. O
// detalhe que fecha: o ritmo do dancehall é o tresillo, 3-3-2, o mesmo do SOC-CER-MON; o refrão inteiro sai dele.
// Sol menor → Lá♭ menor, 96 BPM.
// A história: fim de tarde na praia, a roda de altinha (manter a bola no alto, sem deixar cair). INTRO (4): as ondas,
// alguém começa sozinho (a bola quicando no pé, cada toque uma nota), e o steel pan. A (8): a roda fecha; o steel pan
// pergunta, os trombones respondem, e a bola fecha cada frase com três toques. REFRÃO (8): o SOC-CER-MON no steel pan,
// o "hey hey" nas palmas e os trombones no grave. A2 (8): o trompete abafado entra de contracanto. A PONTE (8): a
// sequência não para de crescer: a bola sobe uma nota a cada tempo (a contagem: 1, 2, 3...), cada compasso mais alto,
// o trompete segurando notas longas e o steel pan arpejando. A QUEDA (4): o toque mais alto de todos; o apito subindo
// (a bola no céu), um compasso em suspenso, o apito descendo... e alguém salva de bicicleta (o toque grave, prato) e o
// Mi♭7 leva meio tom acima. A' e REFRÃO' em Lá♭ menor, com tudo. FINAL (4): o último SOC-CER-MON, a bola sobe de novo,
// todo mundo olha... e cai no MAR (o mergulho), o "ihhh" da roda, o 3-3-2 da banda no Fá♭maj7 e no Mi♭7, e o Lá♭ menor
// com a onda quebrando.
// Assinatura: a bola de altinha como instrumento afinado (os toques contam e sobem) e o mergulho no mar no fim.
// Forma: intro 4 | A 8 | refrão 8 | A2 8 | ponte 8 | queda 4 | A' 8 | refrão' 8 | final 4 = 60 compassos (~2:30).
import { bola, torcida } from '../pecas/livre-ginasio.mjs';
import {
    arp,
    bass,
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
    voicing,
} from '../synth.mjs';
import { aro, BATERIA, bombeio, bumbo, caixa, clapMacio, rhodes, trombone, trompete, tuba } from './kit.mjs';
import { mergulho, onda, steelPan, sub808 } from './kit-novas.mjs';

export const meta = { titulo: 'Altinha', faixa: '06b' };

const A_CH = ['Gm', 'Eb', 'Bb', 'F', 'Gm', 'Eb', 'Bb', 'F'];
const A_PAN = [
    'D5:2 r:1 D5:1 G5:2 Bb5:2 A5:1 G5:1 r:2 F5:2 G5:2',
    'Bb5:3 G5:3 Eb5:2 r:2 F5:1 G5:1 Bb5:2 G5:2',
    'r:16',
    'r:16',
    'G5:2 r:1 G5:1 Bb5:2 D6:2 C6:1 Bb5:1 r:2 A5:2 Bb5:2',
    'G5:3 Eb5:3 C5:2 r:2 D5:1 Eb5:1 F5:2 D5:2',
    'r:16',
    'C5:2 D5:2 Eb5:2 F5:2 A4:4 r:4',
];
// a roda responde: trombones no grave
const A_TB = [
    'r:16',
    'r:16',
    'r:2 F3:1 F3:1 Bb3:2 D4:2 C4:1 Bb3:1 r:2 A3:2 Bb3:2',
    'C4:3 A3:3 F3:2 r:4 C4:2 D4:2',
    'r:16',
    'r:16',
    'r:2 D4:1 D4:1 F4:2 Bb3:2 C4:1 D4:1 r:2 Eb4:2 D4:2',
    'C4:2 D4:2 Eb4:2 F4:2 A3:4 r:4',
];
// o refrão: o SOC-CER-MON é o tresillo do dancehall
const H_CH = ['Gm', 'Eb', 'Cm', 'D7', 'Gm', 'Eb', 'Cm', 'D7'];
const GANCHO_GM = GANCHO.em({ menor: true, tom: 7, oitava: -1 });
const H_PAN = [
    GANCHO_GM,
    'Bb5:3 G5:3 Eb5:2 F5:2 G5:2 r:4',
    'G5:3 Eb5:3 C6:6 r:4',
    'F#5:3 D5:3 A5:2 C6:2 Bb5:2 A5:2 F#5:2',
    GANCHO_GM,
    'Bb5:3 G5:3 Eb5:2 F5:2 G5:2 r:4',
    'G5:3 Eb5:3 C6:6 r:4',
    'A5:2 F#5:2 D5:2 C5:2 A4:4 r:4',
];
// contracanto do trompete no A2: notas longas, guia de terças
const A2_TP = ['Bb4:16', 'G4:8 Bb4:8', 'D5:16', 'C5:8 A4:8', 'Bb4:16', 'G4:8 C5:8', 'D5:16', 'Eb5:8 C5:8'];
const P_CH = ['Ebmaj7', 'F', 'Dm7', 'Gm', 'Cm7', 'F7', 'Bbmaj7', 'D7b9'];
const P_TP = ['G5:16', 'A5:16', 'F5:16', 'Bb5:16', 'Eb6:8 D6:8', 'C6:16', 'D6:16', 'F#5:16'];
// a contagem da altinha: uma nota por tempo, subindo pela escala de Sol menor, depois em colcheias
const ESCALA = ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5'];
const SUB = '0:3 0:3 0:4 r:2 5:2 8:2';

export default function altinha() {
    const S = new Song({ bpm: 96, bars: 60, swing: 0.05, tail: 5, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.85 });
    const duck = bombeio(S, k, { prof: 0.35, solta: 0.16 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', gain: 0.75, pan: 0.1, rev: 0.12 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.5, rev: 0.12 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.35, gain: 1.3 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: -0.3, gain: 1.4 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.5 });
    const cl = S.part('palmas', clapMacio, { drum: true, gain: 1.1, rev: 0.2 });
    const sub = sub808(S, 'sub', { gain: 0.3, gainAt: duck });
    const pan = steelPan(S, 'steel', { pan: 0.15, gain: 1, rev: 0.2, echo: { rows: 3, fb: 0.25, mix: 0.18 } });
    const pan2 = steelPan(S, 'steel2', { pan: -0.3, gain: 0.45, rev: 0.2 });
    const tb = trombone(S, 'trombones', { pan: -0.15, gain: 0.75, rev: 0.18 });
    const tu = tuba(S, 'tuba', { gain: 0.5, rev: 0.1 });
    const tp = trompete(S, 'trompete', { pan: 0.3, gain: 0.55, rev: 0.3, corte: 2600 });
    const sk = rhodes(S, 'skank', { pan: -0.25, gain: 0.5, gainAt: duck, corte: 3500 });
    const str = S.part('cordas', I.strings, { gain: 0.6, rev: 0.3, gainAt: duck });
    const bl = S.part('bola', bola, { pan: 0.25, gain: 0.9, rev: 0.15 });
    const on = S.part('onda', onda, { drum: true, gain: 0.8, rev: 0.3 });
    const mg = S.part('mergulho', mergulho, { drum: true, gain: 0.9, pan: 0.2, rev: 0.35 });
    const sobe = S.part('sobe', I.whistle, { drum: true, gain: 1.2, pan: 0.3, rev: 0.3 });
    const desce = S.part('desce', I.whistleDown, { drum: true, gain: 1.2, pan: -0.3, rev: 0.3 });
    const ih = S.part('roda', torcida(1.6, 0.05, 1.2), { drum: true, gain: 0.45, rev: 0.3 });

    const dembow = (b, { cheio = true } = {}) => {
        drum(k, b, 1, 'X...X...X...X...');
        drum(ar, b, 1, '...x..x....x..x.');
        drum(sh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.6 });
        if (cheio) {
            drum(sn, b, 1, '......x.......x.', { vel: 0.6 });
            drum(hh, b, 1, '..x...x...x...x.', { vel: 0.5 });
        }
    };
    const harmonia = (b, c, { skank = true, cordas = false } = {}) => {
        bass(sub, b, c, SUB);
        if (skank) stabs(sk, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.7 });
        if (cordas) padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.5 });
    };
    /** Três toques da bola no fim da frase (as notas do acorde, subindo, de Sol3 pra cima). */
    const toques = (b, c, s = 0, rows = [10, 12, 14]) => {
        const notas = voicing(transpose(c, s), 55, 3);
        for (const [i, r] of rows.entries()) bl.note(b * 16 + r, notas[i], 1, 0.8 + 0.1 * i);
    };
    const blocoA = (b0, s, { dois = false } = {}) => {
        mel(pan, b0, A_PAN, { shift: s });
        mel(tb, b0, A_TB, { shift: s });
        mel(tu, b0, A_TB, { shift: s - 12, vel: 0.7 });
        if (dois) {
            mel(tp, b0, A2_TP, { shift: s });
            mel(pan2, b0, A_PAN, { shift: s, harm: thirdBelow(MINOR((7 + s) % 12)) });
        }
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            harmonia(b0 + i, c, { cordas: dois });
            dembow(b0 + i, { cheio: dois || i >= 4 });
        });
        toques(b0 + 3, A_CH[3], s);
        toques(b0 + 7, A_CH[7], s, [12, 13, 14]);
        drum(cr, b0, 1, 'X...............');
    };
    const refrao = (b0, s) => {
        mel(pan, b0, H_PAN, { shift: s });
        mel(pan2, b0, H_PAN, { shift: s - 12, vel: 0.8 });
        H_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            harmonia(b0 + i, c, { cordas: true });
            dembow(b0 + i);
            if (i % 2 === 0) {
                // o "hey hey" e os trombones dobrando o gancho embaixo
                drum(cl, b0 + i, 1, '............X.X.', { vel: 1.1 });
                mel(tb, b0 + i, [H_PAN[i]], { shift: s - 12, vel: 0.8 });
            } else stabs(tb, b0 + i, c, [0, 3, [6, 2]], { low: 50, n: 3, vel: 0.7 });
        });
        drum(cr, b0, 1, 'X...............');
        drum(sn, b0 + 7, 1, '........x.xxXxXX', { vel: 0.8 });
    };

    // ---------- intro (0-3): as ondas, a bola sozinha, o steel pan ----------
    on.note(0, 0, 0, 1);
    on.note(32, 0, 0, 0.8);
    [
        [4, 'G3'],
        [12, 'D4'],
        [20, 'G3'],
        [26, 'Bb3'],
        [28, 'D4'],
        [36, 'G3'],
        [40, 'A3'],
        [44, 'Bb3'],
        [46, 'C4'],
    ].forEach(([r, n]) => {
        bl.note(r, midi(n), 1, 0.8);
    });
    padChord(pan, 1, 'Gm', 16, { low: 62, n: 3, vel: 0.6 });
    arp(pan2, 2, 'Eb', { low: 63, step: 2, vel: 0.6 });
    drum(sh, 2, 2, 'x.xxx.xxx.xxx.xx', { vel: 0.5 });
    bass(sub, 3, 'F', '0:3 0:3 0:2 r:8');
    drum(k, 3, 1, 'X..X..X.........');
    drum(ar, 3, 1, '........x.xxx.xx', { vel: 0.8 });
    mel(tb, 3, ['C4:3 A3:3 F3:2 r:8']);

    // ---------- A (4-11), refrão (12-19), A2 (20-27) ----------
    blocoA(4, 0);
    refrao(12, 0);
    blocoA(20, 0, { dois: true });

    // ---------- a ponte (28-35): a contagem da altinha, cada toque mais alto ----------
    P_CH.forEach((c, i) => {
        const b = 28 + i;
        harmonia(b, c, { cordas: true });
        dembow(b, { cheio: i >= 4 });
        arp(pan2, b, c, { low: 62, step: 2, vel: 0.6 });
        const passo = i < 4 ? 4 : 2;
        for (let r = 0; r < 16; r += passo) {
            const n = i < 4 ? i * 4 + r / 4 : 16 + (i - 4) * 8 + r / 2;
            if (n < ESCALA.length) bl.note(b * 16 + r, midi(ESCALA[n]), 1, 0.75);
            else bl.note(b * 16 + r, midi(ESCALA[ESCALA.length - 1]) + ((n - 15) % 3), 1, 0.75);
        }
    });
    mel(tp, 28, P_TP, { vel: 0.9 });
    mel(tb, 32, ['r:16', 'r:8 A3:4 C4:4', 'D4:16', 'F#3:8 A3:8'], { vel: 0.7 });
    drum(cr, 32, 1, 'X...............');
    drum(sn, 35, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });

    // ---------- a queda (36-39): a bola no céu, o suspense, o salvamento de bicicleta ----------
    bl.note(36 * 16, midi('G5') + 2, 1, 1);
    sobe.note(36 * 16 + 1, 0, 0, 1);
    padChord(str, 36, 'D7b9', 32, { low: 54, n: 4, vel: 0.45 });
    on.note(36 * 16 + 4, 0, 0, 0.7);
    drum(sh, 37, 1, 'x...x...x...x...', { vel: 0.4 });
    desce.note(38 * 16, 0, 0, 1);
    desce.note(38 * 16 + 8, -3, 0, 0.9);
    drum(ar, 38, 1, '........x.x.xxxx', { vel: 0.7 });
    // salvou! o toque grave, o prato, e o Mi♭7 com o 3-3-2 dos metais
    bl.note(39 * 16, midi('G2'), 1, 1);
    drum(cr, 39, 1, 'X...............');
    drum(k, 39, 1, 'X..X..X.........');
    stabs(tb, 39, 'Eb7', [0, 3, [6, 2]], { low: 51, n: 3 });
    stabs(tu, 39, 'Eb7', [0, 3, [6, 2]], { low: 39, n: 1 });
    bass(sub, 39, 'Eb7', '0:3 0:3 0:2 r:8');
    drum(sn, 39, 1, '........xxXxXXXX');
    ih.note(39 * 16, 3, 0, 0.7);

    // ---------- A' (40-47) e refrão' (48-55) em Lá♭ menor ----------
    blocoA(40, 1, { dois: true });
    refrao(48, 1);

    // ---------- final (56-59): o último gancho, a bola sobe... e cai no mar ----------
    const GANCHO_ABM = GANCHO.em({ menor: true, tom: 8, oitava: -1 });
    mel(pan, 56, [GANCHO_ABM]);
    mel(pan2, 56, [GANCHO_ABM], { shift: -12 });
    mel(tb, 56, [GANCHO_ABM], { shift: -12 });
    mel(tu, 56, [GANCHO_ABM], { shift: -24, vel: 0.7 });
    harmonia(56, 'Abm', { cordas: true });
    dembow(56);
    drum(cl, 56, 1, '............X.X.', { vel: 1.1 });
    drum(cr, 56, 1, 'X...............');
    // a bola sobe (três toques e o apito), a banda espera
    for (const [i, r] of [0, 4, 8].entries()) bl.note(57 * 16 + r, midi('Ab3') + 4 * i, 1, 0.9);
    sobe.note(57 * 16 + 10, 1, 0, 1);
    padChord(str, 57, 'Eb7', 16, { low: 55, n: 4, vel: 0.5 });
    drum(sh, 57, 1, 'x.xxx.xxx.......', { vel: 0.5 });
    // TCHIBUM: a bola no mar, o "ihhh", e o 3-3-2 da banda (Fá♭maj7 e Mi♭7)
    mg.note(58 * 16, 0, 0, 1);
    ih.note(58 * 16 + 2, 0, 0, 1);
    stabs(tb, 58, 'Emaj7', [0, 3], { low: 52, n: 3 });
    stabs(tb, 58, 'Eb7', [[6, 2]], { low: 51, n: 3 });
    stabs(sk, 58, 'Emaj7', [0, 3], { low: 60, n: 4 });
    stabs(sk, 58, 'Eb7', [[6, 2]], { low: 60, n: 4 });
    mel(sub, 58, ['E2:3 E2:3 Eb2:2 r:8']);
    drum(k, 58, 1, 'X..X..X.........');
    drum(ar, 58, 1, '........x.x.xxxx', { vel: 0.7 });
    // o Lá♭ menor (com nona) e a onda quebrando
    padChord(pan, 59, 'Abm', 16, { low: 63, n: 3 });
    arp(pan2, 59, 'Abm', { low: 68, step: 1, vel: 0.5, rows: 6 });
    stabs(tb, 59, 'Abm', [[0, 12]], { low: 51, n: 3, vel: 0.9 });
    tu.note(59 * 16, midi('Ab1'), 12, 0.8);
    sub.note(59 * 16, midi('Ab1'), 12, 1);
    padChord(str, 59, 'Abm', 16, { low: 56, n: 4, vel: 0.6 });
    tp.note(59 * 16, midi('Bb5'), 12, 0.6);
    drum(k, 59, 1, 'X...............');
    drum(cr, 59, 1, 'X...............');
    drum(cl, 59, 1, '........X.......', { vel: 0.9 });
    on.note(59 * 16 + 2, 0, 0, 1);
    return S;
}
