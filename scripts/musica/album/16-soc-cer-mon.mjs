// Faixa 16 do álbum, "Soc-cer-MON!" (a faixa-título). Rodada 4 (23/11/2026), refeita do zero. Retorno do Miguel:
// "ótima ideia, mas executado meio errado". A ideia fica: a faixa é o grito SOC-CER-MON (o GANCHO, 3-3-2). O que
// estava errado era a execução: um desfile de nove rivais em timbre de chip (que já é a "Sete rivais"), o gancho
// carimbado igual toda vez, tudo brilhante (−18 dB acima de 4 kHz) e no mesmo volume do começo ao fim.
// Agora a faixa é sobre o grito: de onde ele vem, o que dá pra fazer com três notas, e como ele vira hino. Funk de
// estádio a 100 BPM com banda de metais graves (trombones e tuba), o CORO da arquibancada (a vogal "ó" com formantes,
// três vozes), Rhodes, baixo de dedo, guitarra abafada, clap 808 macio. O 3-3-2 está em tudo: no bumbo, no baixo, nos
// cortes da banda.
// A história:
//   UM SÓ (0-3): uma pessoa sozinha na arquibancada bate o 3-3-2. Outra entra. A torcida cresce, o baixo pega o
//     ritmo numa nota só, o apito.
//   O GRITO (4-11, Dó): o gancho é a cabeça da melodia nos trombones e o Rhodes responde. A harmonia sai do lugar
//     comum: o ♭VII (Si♭maj7), o iv menor (Fá menor com sexta), o ♭VI7 (Lá♭7) e a dominante com 9ª menor.
//   A ARQUIBANCADA (12-19): o coro canta a melodia, os trombones respondem em terças.
//   FORA DO COMPASSO (20-27, Lá menor): o grito em ciclos de 3 semicolcheias por cima do 4 da bateria (três
//     compassos girando fora do lugar) e no 4º compasso ele cai no tempo, com a banda inteira e um Mi7(♯9). Na 2ª
//     volta o Si♭maj7 é o ♭II napolitano.
//   O MESMO GRITO, SEIS CHÃOS (28-35): a bateria sai e a torcida canta as mesmas três notas (Sol, Mi, Dó) seis vezes;
//     a banda troca o acorde por baixo: Dó, Lá menor 9, Fá maj9, Ré menor 9, Lá♭maj7(♯5) e Mi7(♯9, ♭13). A mesma nota
//     muda de cor (rearmonização). Depois a banda some e sobra só a torcida, e os cortes da banda no 3-3-2 em Lá♭7.
//   FUGATO (36-39, Ré♭, meio tom acima): o grito entra em cânone, cada voz uma terça acima (tuba, trombone,
//     trombone, coro), e as quatro se juntam em uníssono com a bateria batendo junto.
//   O HINO (40-47, Ré♭) e, depois da virada em Lá7, O HINO MEIO TOM ACIMA (49-56, Ré) com tudo e as cordas.
//   FINAL ESCRITO (57-61): o grito em câmera lenta (Ré, depois o ♭VI Si♭), "SOC"… "CER"… a pausa… "MON!" no
//     Ré com nona, o "hey hey" da torcida e o apito final do juiz (curto, curto, longo).
// Forma: 4 | 8 | 8 | 8 | 8 | 4 + 8 | 1 + 8 | 5. ~2:35.
import { apito, torcida } from '../pecas/livre-ginasio.mjs';
import { bass, drum, I, mel, padChord, Song, stabs, transpose } from '../synth.mjs';
import {
    BATERIA,
    baixoDedo,
    bombeio,
    bumbo,
    caixa,
    clapMacio,
    guitarra,
    orgao,
    rhodes,
    trombone,
    tuba,
} from './kit.mjs';
import { coro, frase, notas } from './kit-novas.mjs';

export const meta = { titulo: 'Soc-cer-MON!', faixa: 16 };

// A melodia do hino (registro do trombone, em Dó); o gancho é a cabeça das frases.
const HINO = [
    ['C', 'G3:3 E3:3 C4:2 r:8'],
    ['Dm7', 'A3:3 F3:3 D4:2 r:8'],
    ['Bbmaj7', 'D4:3 C4:3 Bb3:2 A3:2 F3:2 D3:4'],
    ['Fm6', 'Ab3:3 G3:3 F3:2 D3:6 r:2'],
    ['C', 'G3:3 E3:3 C4:2 r:8'],
    ['Dm7', 'A3:3 F3:3 D4:2 E4:2 F4:2 G4:4'],
    ['Ab7', 'Eb4:3 C4:3 Ab4:2 Gb4:4 Eb4:4'],
    ['G7b9', 'F4:3 F4:3 D4:2 B3:4 Ab3:2 G3:2'],
];
// a 2ª voz (terças e sextas escritas à mão: o terça-abaixo automático erra nos acordes emprestados)
const HINO2 = [
    'E3:3 C3:3 G3:2 r:8',
    'F3:3 D3:3 A3:2 r:8',
    'Bb3:3 A3:3 F3:2 F3:2 D3:2 Bb2:4',
    'F3:3 D3:3 C3:2 Ab2:6 r:2',
    'E3:3 C3:3 G3:2 r:8',
    'F3:3 D3:3 A3:2 C4:2 D4:2 E4:4',
    'C4:3 Ab3:3 Eb4:2 Eb4:4 C4:4',
    'D4:3 D4:3 B3:2 Ab3:4 F3:2 F3:2',
];
// o Rhodes responde no espaço do gancho
const RESPOSTA = [
    'r:8 E4:1 G4:1 A4:2 G4:2 E4:1 C4:1',
    'r:8 F4:1 A4:1 C5:2 A4:2 F4:1 D4:1',
    null,
    'r:10 C5:1 Ab4:1 F4:2 D4:2',
    'r:8 G4:1 C5:1 D5:2 E5:2 C5:1 G4:1',
    null,
    null,
    'r:12 D5:1 B4:1 Ab4:1 F4:1',
];
// as cordas no hino final: notas longas que descem por baixo da melodia
const CORDAS = ['E5:16', 'F5:16', 'D5:16', 'C5:8 Ab4:8', 'G4:16', 'A4:16', 'C5:8 Bb4:8', 'B4:16'];

export default function socCerMon() {
    const S = new Song({ bpm: 100, bars: 62, swing: 0.08, tail: 6, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 1 });
    const duck = bombeio(S, k, { prof: 0.3, solta: 0.18 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.55, rev: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.9, corte: 7000 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.45, corte: 6000 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const tm = S.part('toms', I.tom, { drum: true, gain: 0.55, rev: 0.1 });
    const um = S.part('umSo', I.clap808.com({ ganho: 0.5, corte: 6000, sala: 0.12 }), { drum: true, pan: -0.35 });
    const cl = S.part('palmas', clapMacio, { drum: true, pan: -0.3, gain: 0.9, rev: 0.15 });
    const cl2 = S.part('palmas2', clapMacio.com({ atraso: 0.011, tom: 0.4 }), {
        drum: true,
        pan: 0.3,
        gain: 0.9,
        rev: 0.15,
    });
    const tc = S.part('torcida', torcida(3, 0.6, 1.4), { drum: true, gain: 0.5, rev: 0.3 });
    const tcL = S.part('torcidaLonga', torcida(9, 3, 3), { drum: true, gain: 0.5, rev: 0.3 });
    const ap = S.part('apito', apito(0.25), { drum: true, pan: 0.2, gain: 0.7, rev: 0.25 });
    const apL = S.part('apitoLongo', apito(0.9), { drum: true, pan: 0.2, gain: 0.7, rev: 0.25 });
    const tb = trombone(S, 'trombones', { pan: -0.15, gain: 1, rev: 0.2 });
    const tb2 = trombone(S, 'terças', { pan: 0.25, gain: 0.65, rev: 0.2 });
    const tu = tuba(S, 'tuba', { gain: 0.65, rev: 0.1 });
    const co = coro(S, 'coro', { pan: -0.05, gain: 0.95, rev: 0.35 });
    const co2 = coro(S, 'coro2', { pan: 0.3, gain: 0.55, rev: 0.35 });
    const rh = rhodes(S, 'rhodes', { pan: 0.25, gain: 0.5, rev: 0.2, gainAt: duck });
    const gt = guitarra(S, 'guitarra', { pan: -0.35, gain: 0.8, corte: 3500 }, { sujo: 0.3, abafa: 1 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.4, gainAt: duck });
    const og = orgao(S, 'orgao', { pan: 0.15, gain: 0.6, rev: 0.3, gainAt: duck });
    const str = S.part('cordas', I.strings, { gain: 1.4, rev: 0.3, corte: 3500 });

    const heyHey = (b, vel = 1) => {
        drum(cl, b, 1, '............x.x.', { vel });
        drum(cl2, b, 1, '............x.x.', { vel });
    };
    /** O groove: o bumbo no 3-3-2, a caixa no 2 e no 4 com fantasmas, chimbal de colcheia. */
    const groove = (b, { leve = false } = {}) => {
        drum(k, b, 1, leve ? 'X.....x.........' : 'X..x..x...x.....');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o....X.o.', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: leve ? 0.5 : 0.7 });
    };
    /** Um compasso do hino: baixo no 3-3-2, guitarra abafada, Rhodes nos contratempos. */
    const banda = (b, c, { rhodesVel = 0.7 } = {}) => {
        bass(bs, b, c, '0:3 0:3 8:2 r:2 5:2 s:2 0:2');
        stabs(gt, b, c, [2, 3, 10, 11], { low: 55, n: 3, vel: 0.8 });
        stabs(
            rh,
            b,
            c,
            [
                [6, 2],
                [14, 2],
            ],
            { low: 57, n: 4, vel: rhodesVel },
        );
    };
    /** O hino inteiro (8 compassos) a partir de `b0`, `s` semitons acima. */
    const hino = (b0, s, { coroLeva = false, cordas = false } = {}) => {
        HINO.forEach(([c, m], i) => {
            const b = b0 + i;
            const ch = transpose(c, s);
            banda(b, ch);
            groove(b);
            if (coroLeva) {
                // o coro canta, os trombones respondem em terças embaixo, a tuba dobra o gancho
                mel(co, b, [m], { shift: s + 12 });
                mel(co2, b, [HINO2[i]], { shift: s + 12, vel: 0.8 });
                mel(tb, b, [m], { shift: s, vel: 0.85 });
            } else mel(tb, b, [m], { shift: s });
            mel(tb2, b, [HINO2[i]], { shift: s, vel: 0.8 });
            if (i % 4 < 2) mel(tu, b, [m], { shift: s - 12, vel: 0.8 });
            else bass(tu, b, ch, '0:6 r:2 5:4 r:4', { vel: 0.6 });
            if (RESPOSTA[i]) mel(rh, b, [RESPOSTA[i]], { shift: s, vel: 0.9 });
            if (i === 0 || i === 4) heyHey(b, 0.9);
            if (cordas) mel(str, b, [CORDAS[i]], { shift: s - 12, vel: 0.7 });
        });
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 4, 1, 'X...............', { vel: 0.7 });
    };

    // ---------- UM SÓ (0-3) ----------
    drum(um, 0, 1, 'X..X..X.........');
    drum(um, 1, 1, 'X..X..X.........');
    drum(cl, 1, 1, 'x..x..x.........', { vel: 0.6 });
    drum(cl2, 1, 1, '............o.o.', { vel: 0.8 });
    tcL.note(2 * 16, 0, 0, 0.9);
    drum(cl, 2, 2, 'X..X..X.....x.x.', { vel: 0.85 });
    drum(cl2, 2, 2, 'X..X..X.....x.x.', { vel: 0.85 });
    drum(k, 2, 2, 'X..X..X.........', { vel: 0.8 });
    mel(bs, 2, ['C2:3 C2:3 C3:2 r:8', 'C2:3 C2:3 C3:2 r:2 G1:2 A1:2 B1:2'], { vel: 0.9 });
    apL.note(3 * 16, 0, 0, 0.8);
    drum(sn, 3, 1, '........ooxxXxXX', { vel: 0.8 });
    drum(tm, 3, 1, '........x.x.x.x.', { pitch: 0 });
    mel(tb, 3, ['r:10 G2:2 A2:2 B2:2'], { vel: 0.8 });
    mel(tu, 3, ['r:10 G1:2 A1:2 B1:2'], { vel: 0.8 });

    // ---------- O GRITO (4-11) e A ARQUIBANCADA (12-19), em Dó ----------
    hino(4, 0);
    tc.note(12 * 16, 0, 0, 0.8);
    hino(12, 0, { coroLeva: true });
    // o fim da arquibancada: a banda para no meio do último compasso e só o gancho dos trombones fica
    drum(sn, 19, 1, '............xXXX', { vel: 0.8 });

    // ---------- FORA DO COMPASSO (20-27), Lá menor ----------
    // o grito (Mi, Dó, Lá) em ciclos de 3 semicolcheias: 16 notas em 3 compassos, e no 4º ele cai no tempo
    const CICLO = [52, 48, 57]; // E3 C3 A3
    const fora = (b0, acordes) => {
        for (let i = 0; i < 16; i++) {
            const row = b0 * 16 + i * 3;
            const m = CICLO[i % 3];
            const v = i % 3 === 0 ? 1 : 0.8;
            tb.note(row, m, 2.5, v);
            tu.note(row, m - 12, 2.5, v * 0.8);
            gt.note(row, m + 12, 1, 0.6);
        }
        acordes.forEach((c, j) => {
            const b = b0 + j;
            // o baixo também anda de 3 em 3 (tônica, tônica, oitava), mas volta pro 1 a cada compasso
            bass(bs, b, c, '0:3 0:3 8:3 0:3 0:2 8:2', { vel: 0.9 });
            padChord(rh, b, c, 16, { low: 57, n: 4, vel: 0.5 });
            padChord(str, b, c, 16, { low: 60, n: 3, vel: 0.5 });
            drum(k, b, 1, 'X...X...X...X...');
            drum(sn, b, 1, '....X.......X...', { vel: 0.9 });
            drum(hh, b, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.45 });
        });
    };
    /** O grito cai no tempo: a banda inteira no 3-3-2 num acorde tenso, prato, e o "hey hey". */
    const noTempo = (b, ns, baixo) => {
        mel(tb, b, ['E3:3 C3:3 A3:2 r:8']);
        mel(tb2, b, ['C3:3 A2:3 E3:2 r:8'], { vel: 0.8 });
        mel(tu, b, ['E2:3 C2:3 A2:2 r:8']);
        mel(co, b, ['E4:3 C4:3 A4:2 r:8']);
        for (const r of [0, 3, 6]) notas(og, b * 16 + r, ns, 2, 0.8);
        notas(og, b * 16 + 8, ns, 8, 0.6);
        mel(bs, b, [`${baixo}:3 ${baixo}:3 ${baixo}:2 r:8`]);
        drum(k, b, 1, 'X..X..X.........');
        drum(sn, b, 1, 'X..X..X.....oxXX', { vel: 0.9 });
        drum(cr, b, 1, 'X...............');
        heyHey(b);
    };
    fora(20, ['Am', 'F', 'Dm7']);
    noTempo(23, ['E3', 'G#3', 'D4', 'G4'], 'E1');
    fora(24, ['Am', 'F', 'Bbmaj7']);
    noTempo(27, ['E3', 'G#3', 'D4', 'F4'], 'E1');

    // ---------- O MESMO GRITO, SEIS CHÃOS (28-35) ----------
    const CHAOS = [
        ['C2', ['C3', 'G3', 'E4']],
        ['A1', ['A2', 'E3', 'G3', 'B3']],
        ['F1', ['F2', 'C3', 'A3', 'E4']],
        ['D2', ['D3', 'F3', 'A3']],
        ['Ab1', ['Ab2', 'C3', 'G3']],
        ['E1', ['E2', 'G#3', 'D4']],
    ];
    CHAOS.forEach(([baixo, ns], i) => {
        const b = 28 + i;
        mel(co, b, ['G4:3 E4:3 C5:2 r:8']);
        mel(co2, b, ['G3:3 E3:3 C4:2 r:8'], { vel: 0.7 });
        heyHey(b, 0.85);
        notas(og, b * 16, ns, 16, 0.75);
        notas(str, b * 16, ns.slice(1), 16, 0.55);
        mel(bs, b, [`${baixo}:12 r:4`], { vel: 0.8 });
        mel(tu, b, [`${baixo}:12 r:4`], { shift: 12, vel: 0.45 });
        drum(k, b, 1, 'X...............', { vel: 0.7 });
        if (i === 4) drum(ti, b, 1, 'X...............', { pitch: -4 });
    });
    tcL.note(28 * 16, 0, 0, 0.7);
    // 34: a banda some; só a torcida e as palmas
    mel(co, 34, ['G4:3 E4:3 C5:2 r:8']);
    mel(co2, 34, ['G3:3 E3:3 C4:2 r:8'], { vel: 0.8 });
    drum(cl, 34, 1, 'X..X..X.....X.X.');
    drum(cl2, 34, 1, 'X..X..X.....X.X.');
    tc.note(34 * 16, 0, 0, 1);
    // 35: a banda volta nos cortes do 3-3-2 em Lá♭7 (o V de Ré♭), a caixa rufa, o apito
    for (const r of [0, 3, 6]) {
        notas(og, 35 * 16 + r, ['Ab2', 'C3', 'Eb3', 'Gb3'], 2);
        notas(tb, 35 * 16 + r, ['Ab2', 'Gb3'], 2);
        notas(tb2, 35 * 16 + r, ['C3'], 2, 0.8);
        notas(tu, 35 * 16 + r, ['Ab1'], 2);
        notas(bs, 35 * 16 + r, ['Ab1'], 2);
    }
    drum(k, 35, 1, 'X..X..X.........');
    drum(sn, 35, 1, 'X..X..X.oxxxXXXX', { vel: 0.9 });
    drum(tm, 35, 1, '........x.x.x.x.', { pitch: 3 });
    ap.note(35 * 16 + 10, 0, 0, 0.8);

    // ---------- FUGATO (36-39), Ré♭ ----------
    // o gancho em Ré♭ por graus da escala (cada entrada uma terça acima): Lá♭ Fá Ré♭ / Dó Lá♭ Fá / Mi♭ Dó Lá♭ / ...
    const DB = (notas3) => notas3.map((n, i) => `${n}:${[3, 3, 2][i]}`).join(' ');
    const entradas = [
        [tu, 36 * 16, ['Ab1', 'F1', 'Db2']],
        [tb2, 36 * 16 + 8, ['C3', 'Ab2', 'F3']],
        [tb, 37 * 16, ['Eb3', 'C3', 'Ab3']],
        [co, 37 * 16 + 8, ['Ab4', 'F4', 'Db5']],
    ];
    for (const [P, row, ns] of entradas) frase(P, row, [DB(ns)]);
    // cada voz segura a última nota até o uníssono (o acorde se empilha)
    tu.note(36 * 16 + 8, 37, 24, 0.6);
    tb2.note(37 * 16, 53, 16, 0.55);
    tb.note(37 * 16 + 8, 56, 8, 0.55);
    for (const b of [36, 37]) {
        bass(bs, b, 'Db', '0:3 0:3 8:2 0:3 0:3 8:2', { vel: 0.85 });
        drum(k, b, 1, 'X..x..x.X..x..x.', { vel: 0.85 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        drum(sn, b, 1, '....x.......x...', { vel: 0.7 });
    }
    padChord(rh, 36, 'Db', 16, { low: 56, n: 3, vel: 0.5 });
    padChord(rh, 37, 'Bbm7', 16, { low: 56, n: 4, vel: 0.5 });
    // 38: as quatro vozes juntas, em uníssono, e a bateria bate nas notas
    const UNI = 'Ab3:3 F3:3 Db4:2 Ab3:3 F3:3 Db4:2';
    mel(tb, 38, [UNI]);
    mel(tb2, 38, [UNI], { shift: -12, vel: 0.85 });
    mel(tu, 38, [UNI], { shift: -24 });
    mel(co, 38, [UNI], { shift: 12 });
    mel(co2, 38, [UNI], { vel: 0.8 });
    mel(rh, 38, [UNI], { shift: 12, vel: 0.7 });
    mel(bs, 38, [UNI], { shift: -24 });
    drum(k, 38, 1, 'X..X..X.X..X..X.');
    drum(sn, 38, 1, 'X..X..X.X..X..X.', { vel: 0.9 });
    drum(cr, 38, 1, 'X...............');
    drum(ti, 38, 1, 'X..X..X.X..X..X.', { pitch: 3, vel: 0.7 });
    // 39: a banda para no meio, sobra o "hey hey", e o hino entra
    notas(og, 39 * 16, ['Ab2', 'Db3', 'Gb3', 'Bb3'], 6, 0.8);
    mel(tb, 39, ['Gb3:6 r:10']);
    mel(tu, 39, ['Ab1:6 r:10']);
    mel(bs, 39, ['Ab1:6 r:10']);
    drum(k, 39, 1, 'X...............');
    drum(cl, 39, 1, '........X...X.X.');
    drum(cl2, 39, 1, '........X...X.X.');
    tc.note(39 * 16 + 8, 1, 0, 1);

    // ---------- O HINO em Ré♭ (40-47) ----------
    hino(40, 1, { coroLeva: true });

    // ---------- virada (48): Lá7, o V de Ré ----------
    for (const r of [0, 3, 6]) {
        notas(og, 48 * 16 + r, ['A2', 'C#3', 'E3', 'G3'], 2);
        notas(tb, 48 * 16 + r, ['A2', 'G3'], 2);
        notas(tu, 48 * 16 + r, ['A1'], 2);
        notas(bs, 48 * 16 + r, ['A1'], 2);
    }
    mel(tb2, 48, ['r:8 A3:2 B3:2 C#4:2 E4:2']);
    drum(k, 48, 1, 'X..X..X.X.X.X.X.');
    drum(sn, 48, 1, 'X..X..X.xxXxXXXX', { vel: 0.95 });
    drum(tm, 48, 1, '........x.x.x.x.', { pitch: 5 });
    ap.note(48 * 16 + 12, 2, 0, 0.8);

    // ---------- O HINO meio tom acima (49-56), Ré, com as cordas ----------
    tcL.note(49 * 16, 2, 0, 0.8);
    hino(49, 2, { coroLeva: true, cordas: true });
    mel(tu, 56, ['r:8 A1:2 B1:2 C#2:2 D2:2']);

    // ---------- FINAL ESCRITO (57-61) ----------
    // 57-58: o grito em câmera lenta, Ré e o ♭VI (Si♭)
    for (const [b, frase2, ch, baixo] of [
        [57, 'A3:6 F#3:6 D4:4', ['D3', 'F#3', 'A3', 'E4'], 'D2'],
        [58, 'Bb3:6 F3:6 D4:4', ['Bb2', 'D3', 'F3', 'A3'], 'Bb1'],
    ]) {
        mel(tb, b, [frase2]);
        mel(tb2, b, [frase2], { shift: -12, vel: 0.8 });
        mel(tu, b, [frase2], { shift: -24, vel: 0.9 });
        mel(co, b, [frase2], { shift: 12 });
        mel(co2, b, [frase2], { vel: 0.8 });
        notas(og, b * 16, ch, 16, 0.7);
        notas(str, b * 16, ch, 16, 0.6);
        mel(bs, b, [`${baixo}:6 ${baixo}:6 ${baixo}:4`]);
        drum(k, b, 1, 'X.....X.....X...');
        drum(sn, b, 1, '............X...', { vel: 0.9 });
        drum(ti, b, 1, 'X.....X.........', { pitch: b === 57 ? 0 : -4 });
    }
    drum(cr, 57, 1, 'X...............');
    // 59: "SOC"… "CER"… e a pausa (a torcida prende o fôlego)
    for (const r of [0, 6]) {
        notas(og, 59 * 16 + r, ['A2', 'D3', 'E3', 'A3'], 2);
        notas(tb, 59 * 16 + r, [r ? 'F#3' : 'A3'], 3);
        notas(tu, 59 * 16 + r, ['A1'], 3);
        notas(co, 59 * 16 + r, [r ? 'F#4' : 'A4'], 3);
        notas(bs, 59 * 16 + r, ['A1'], 3);
    }
    drum(k, 59, 1, 'X.....X.........');
    drum(sn, 59, 1, 'X.....X.........');
    // 60: "MON!" no Ré com nona, prato, tímpano, o "hey hey"
    const MON = ['D2', 'A2', 'D3', 'F#3', 'A3', 'E4'];
    notas(og, 60 * 16, MON, 8, 1);
    notas(str, 60 * 16, MON.slice(2), 10, 0.8);
    notas(tb, 60 * 16, ['D4'], 8);
    notas(tb2, 60 * 16, ['F#3', 'A3'], 8, 0.85);
    notas(tu, 60 * 16, ['D2'], 8);
    notas(co, 60 * 16, ['D5'], 8);
    notas(co2, 60 * 16, ['A4'], 8, 0.85);
    notas(bs, 60 * 16, ['D1'], 8);
    notas(rh, 60 * 16, ['F#4', 'A4', 'E5'], 8, 0.7);
    drum(k, 60, 1, 'X...............');
    drum(cr, 60, 1, 'X...............');
    drum(ti, 60, 1, 'X...............', { pitch: 2 });
    heyHey(60, 1.1);
    tc.note(60 * 16, 2, 0, 1.2);
    // 61: o apito final do juiz, curto, curto, longo
    ap.note(61 * 16, 0, 0, 0.8);
    ap.note(61 * 16 + 3, 0, 0, 0.8);
    apL.note(61 * 16 + 6, 0, 0, 0.9);
    return S;
}
