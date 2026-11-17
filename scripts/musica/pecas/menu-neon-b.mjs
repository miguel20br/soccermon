// Menu neon B: Conversível (17/11/2026, esboço). O pedido: música do menu só da Semana Fora da Lei (tema neon,
// 16 a 22/11), no lugar do `menu-balanco` enquanto o tema estiver ligado. Clima de synthwave anos 80 com o carro
// conversível na avenida da praia; inspirado no clima, sem melodia nem progressão de música existente.
// Esta é a outrun com funk (a casa): Sol dórico a 108 BPM, baixo em oitavas de semicolcheia, caixa com reverb gated
// e clap 808 (receita 7b) no 2 e no 4, lead quadrado curto e metais de sintetizador respondendo, pad largo.
// Som de assinatura: a buzina do conversível, que toca o ritmo do SOC-CER-MON (bi-bi-BIII, 3-3-2): ela pergunta na
// intro e o lead responde com o gancho; no refrão é o contrário (o lead canta o gancho, a buzina responde),
// sempre afinada no acorde. O gancho também volta em Mi♭ no fim de cada frase (o lead "estaciona" nele).
// Forma: intro (2: buzina, depois o gancho) | A1 (8): groove, lead e metais em pergunta e resposta | A2 (8): gancho
// com a buzina, refrão | B (8): ponte em meio tempo (Dó menor → Mi♭7, que leva a Lá♭) | A3 (8) meio tom acima, com
// terças; o último é Ré7(b9), que cai de volta no Sol. Loop do compasso 2 ao fim: 32 compassos, 71,1 s.
import { buzina, caixaGated } from '../neon-sons.mjs';
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu neon B: Conversível (outrun com funk)', tela: 'Home (Semana Fora da Lei)' };

/** Pulso com média fora do zero: passa-alta do ZzFX em ~80 Hz (como no menu-balanco). */
const semDC = (inst) => [...inst.slice(0, -1), 40];

export default function menuNeonB() {
    const S = new Song({ bpm: 108, bars: 34, swing: 0.06, tail: 3, loopFrom: 2 });
    const lead = S.part('lead', semDC(I.lead), {
        pan: -0.05,
        gain: 0.9,
        echo: { rows: 3, fb: 0.25, mix: 0.25 },
        rev: 0.2,
        corte: 2500,
    });
    const harm = S.part('terças', semDC(I.pulse), { pan: 0.3, gain: 0.5, rev: 0.2, corte: 2300 });
    const met = S.part('metais', I.brass, { pan: 0.3, gain: 0.9, rev: 0.25, corte: 2800 });
    const st = S.part('stabs', I.stab, { pan: -0.3, gain: 0.9, rev: 0.15, corte: 2600 });
    const ar = S.part('arpejo', I.arp, {
        pan: 0.45,
        gain: 0.7,
        echo: { rows: 3, fb: 0.35, mix: 0.35 },
        rev: 0.2,
        corte: 2400,
    });
    const padE = S.part('pad esq', I.pad, { pan: -0.6, gain: 0.5, rev: 0.4, corte: 2000 });
    const padD = S.part('pad dir', I.strings, { pan: 0.6, gain: 0.5, rev: 0.4, corte: 2400 });
    const bs = S.part('baixo', I.bass, { gain: 0.3, corte: 1100 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa gated', caixaGated({ gate: 0.2 }), { drum: true, gain: 0.45 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.38 });
    const oh = S.part('chimbal aberto', I.ohat, { drum: true, pan: 0.3, gain: 0.25 });
    const tm = S.part('tons', I.tom, { drum: true, pan: -0.2, gain: 0.4, rev: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, pan: 0.2, gain: 0.22 });
    const bz = S.part('buzina', buzina(), { drum: true, pan: -0.35, gain: 0.5, rev: 0.2 });
    const bzl = S.part('buzina longa', buzina({ dur: 0.42 }), { drum: true, pan: -0.35, gain: 0.5, rev: 0.2 });

    const OCT16 = '0:1 0:1 8:1 0:1 r:1 0:1 8:1 0:1 0:1 8:1 0:1 r:1 5:1 8:1 s:1 8:1';
    const HATS = 'x.xx.x.xx.xx.x.x'.replace(/\./g, 'o');
    const groove = (b, c, { leve = false } = {}) => {
        bass(bs, b, c, OCT16);
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.7 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.6 });
        stabs(st, b, c, [2, 6, 10, 14], { low: 62, n: 3, vel: leve ? 0.6 : 0.85 });
        drum(k, b, 1, 'X.....x...X.....');
        drum(sn, b, 1, '....X.......X...');
        drum(cl, b, 1, '....x.......x...', { vel: leve ? 0.4 : 0.6 });
        drum(hh, b, 1, HATS, { vel: leve ? 0.7 : 1 });
        drum(oh, b, 1, '..............x.', { vel: 0.7 });
        if (!leve) arp(ar, b, c, { low: 67, vel: 0.75 });
    };
    const virada = (b) => {
        drum(tm, b, 1, '............x...', { pitch: 7 });
        drum(tm, b, 1, '.............x..', { pitch: 4 });
        drum(tm, b, 1, '..............x.', { pitch: 0 });
        drum(tm, b, 1, '...............x', { pitch: -3 });
    };
    // bi-bi-BIII no ritmo do gancho (3-3-2), afinada no acorde por `pitch`
    const bibi = (b, pitch = 0, vel = 1) => {
        drum(bz, b, 1, 'x..x............', { pitch, vel });
        drum(bzl, b, 1, '......x.........', { pitch, vel });
    };
    const gancho = (b, s = 0, tom = -2) => {
        mel(lead, b, [GANCHO.em({ tom: tom + s })]);
        drum(cl, b, 1, GANCHO.palmas, { vel: 0.9 });
    };

    // intro: a buzina chama sobre o baixo; o lead responde com o gancho
    bibi(0);
    bass(bs, 0, 'Gm9', '0:1 r:15', { vel: 0.8 });
    bass(bs, 1, 'Gm9', OCT16, { vel: 0.8 });
    padChord(padE, 0, 'Gm9', 32, { low: 57, n: 4, vel: 0.5 });
    drum(k, 1, 1, 'X.....x...X.....');
    drum(hh, 1, 1, HATS, { vel: 0.6 });
    gancho(1);
    virada(1);

    const A_CH = ['Gm9', 'C9', 'Gm9', 'C9', 'Gm9', 'C9', 'Ebmaj7', 'D7'];
    // A1 (2-9): o groove; o lead pergunta, os metais respondem; o lead estaciona no gancho em Mi♭
    A_CH.forEach((c, i) => {
        groove(2 + i, c, { leve: i < 4 });
    });
    drum(cr, 2, 1, 'X...............');
    mel(lead, 4, ['D5:1 r:1 F5:1 G5:2 r:1 Bb5:2 A5:1 G5:1 F5:2 D5:2 r:2']);
    mel(met, 5, ['r:4 G5:1 r:1 A5:1 r:1 Bb5:2 A5:2 G5:4']);
    mel(lead, 6, ['D5:1 r:1 F5:1 G5:2 r:1 Bb5:2 C6:1 D6:1 C6:2 Bb5:2 r:2']);
    mel(met, 7, ['r:4 E5:1 r:1 G5:1 r:1 Bb5:2 D6:2 C6:4']);
    gancho(8, 0, 3);
    mel(met, 9, ['r:4 F#5:2 A5:2 C6:2 A5:2 F#5:4']);
    virada(9);

    // A2 (10-17) e A3 (26-33, meio tom acima): gancho e a buzina responde, refrão, metais nos vãos
    const LEAD = [
        null,
        'r:16',
        'Bb5:2 A5:1 G5:1 F5:2 G5:2 r:2 D6:3 C6:3',
        'r:16',
        'Bb5:2 A5:1 G5:1 F5:2 G5:2 r:2 F6:3 D6:3',
        'r:16',
        null,
        'r:16',
    ];
    const MET = [
        'r:16',
        'r:10 E5:2 G5:2 Bb5:2',
        'r:16',
        'r:4 Bb5:2 A5:2 G5:2 E5:2 F5:4',
        'r:16',
        'r:4 E6:2 D6:2 C6:2 Bb5:2 G5:4',
        'r:16',
        'r:10 F#5:2 A5:2 C6:2',
    ];
    for (const [b0, s] of [
        [10, 0],
        [26, 1],
    ]) {
        A_CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'D7b9' : transpose(c0, s);
            groove(b0 + i, c);
        });
        drum(cr, b0, 1, 'X...............');
        gancho(b0, s);
        bibi(b0 + 1, 2 + s); // no Dó9: Mi e Sol
        gancho(b0 + 6, s, 3);
        const tercas = s ? thirdBelow(MAJOR(5 + s)) : null;
        LEAD.forEach((x, i) => {
            if (!x) return;
            mel(lead, b0 + i, [x], { shift: s });
            if (tercas && x !== 'r:16') mel(harm, b0 + i, [x], { shift: s, harm: tercas });
        });
        mel(met, b0, MET.slice(0, 7), { shift: s });
        if (!s) {
            mel(met, b0 + 7, MET.slice(7));
            bibi(b0 + 7, -5, 0.8); // no Ré7: Lá e Dó
            virada(b0 + 7);
        }
    }
    // a volta: Ré7(b9); os metais sobem pela nona menor e a buzina chama o Sol de novo
    mel(met, 33, ['r:10 F#5:2 A5:2 Eb6:2']);
    bibi(33, -5, 0.8);

    // ponte (18-25): meio tempo, Dó menor; o gancho em Mi♭ abre, lead em notas longas, metais respondem; Mi♭7 leva ao Lá♭
    const B_CH = ['Cm9', 'F9', 'Bbmaj7', 'Ebmaj7', 'Cm9', 'F9', 'Bbm7', 'Eb7'];
    B_CH.forEach((c, i) => {
        const b = 18 + i;
        bass(bs, b, c, i === 7 ? '0:2 0:2 5:2 5:2 8:2 8:2 s:2 s:2' : '0:2 8:2 0:2 8:2 0:2 8:2 0:2 8:2');
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.85 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.75 });
        arp(ar, b, c, { low: 67, step: 2, vel: 0.7 });
        drum(k, b, 1, 'X.........x.....');
        drum(sn, b, 1, i === 7 ? '....x.x.xxxxXXXX' : '........X.......', { vel: i === 7 ? 0.7 : 1 });
        drum(hh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.7 });
    });
    gancho(18, 0, 3);
    mel(met, 19, ['r:4 A5:2 C6:2 Eb6:4 C6:4']);
    mel(lead, 20, ['D6:6 C6:2 Bb5:4 F5:4']);
    mel(met, 21, ['r:4 G5:2 Bb5:2 D6:8']);
    mel(lead, 22, ['Eb6:6 D6:2 C6:4 G5:4']);
    mel(met, 23, ['r:4 A5:2 C6:2 Eb6:8']);
    mel(lead, 24, ['Db6:4 C6:4 Bb5:4 F5:4']);
    mel(lead, 25, ['G5:2 Bb5:2 Db6:2 Eb6:2 r:8']);
    // a buzina longe, no meio da ponte, e chamando a volta
    bibi(21, 5, 0.6); // no Mi♭maj7: Sol e Si♭
    drum(bzl, 25, 1, '..............x.', { pitch: -4, vel: 0.8 }); // no Mi♭7: Si♭ e Ré♭
    return S;
}
