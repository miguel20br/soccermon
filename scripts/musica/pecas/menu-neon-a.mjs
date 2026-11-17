// Menu neon A: Avenida Neon (17/11/2026, esboço). O pedido: música do menu só da Semana Fora da Lei (tema neon,
// 16 a 22/11), no lugar do `menu-balanco` enquanto o tema estiver ligado. Clima de synthwave anos 80, praia à
// noite, carro conversível, cidade de neon; inspirado no clima, sem melodia nem progressão de música existente.
// Esta é a clássica: Fá# menor a 104 BPM, baixo em oitavas de colcheia, caixa com reverb gated (e o clap 808 da
// receita 7b dobrando no refrão), pad largo (dois sintetizadores, um de cada lado), arpejo de semicolcheia com eco e
// lead em serra com eco pontuado. Pergunta e resposta: o lead pergunta, o piano elétrico (o DX dos anos 80)
// responde. Som de assinatura: o rádio do carro. Na intro ele sintoniza e a música "pega"; antes da volta final ele
// gira o dial e a música sobe meio tom (outra estação); no último compasso ele gira de volta pro Fá#. Na ponte, uma
// sirene passa ao longe.
// Forma: intro (2: rádio, depois o gancho) | A1 (8): groove, depois pergunta e resposta | A2 (8): gancho, refrão |
// B (8): ponte em meio tempo, Ré maior, sirene; Ré7 leva a Sol menor | A3 (8) em Sol menor, com terças; o último é
// Dó#7(b9), que cai de volta no Fá#. Loop do compasso 2 ao fim: 32 compassos, 73,8 s.
import { caixaGated, radio, sirene } from '../neon-sons.mjs';
import { arp, bass, drum, GANCHO, I, ins, MINOR, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu neon A: Avenida Neon (synthwave clássica)', tela: 'Home (Semana Fora da Lei)' };

const serra = ins({ vol: 0.3, a: 0.012, r: 0.18, shape: 2, sv: 0.85, d: 0.08, filter: 40 });

export default function menuNeonA() {
    const S = new Song({ bpm: 104, bars: 34, tail: 3, loopFrom: 2 });
    const lead = S.part('lead', serra, {
        pan: -0.05,
        gain: 1.25,
        echo: { rows: 3, fb: 0.3, mix: 0.3 },
        rev: 0.25,
        corte: 2600,
    });
    const harm = S.part('terças', serra, {
        pan: 0.25,
        gain: 0.45,
        echo: { rows: 3, fb: 0.25, mix: 0.25 },
        rev: 0.25,
        corte: 2200,
    });
    const ep = S.part('piano DX', I.epiano, { pan: 0.3, gain: 1.4, echo: { rows: 6, fb: 0.25, mix: 0.25 }, rev: 0.35 });
    const ar = S.part('arpejo', I.arp, {
        pan: 0.4,
        gain: 0.8,
        echo: { rows: 3, fb: 0.35, mix: 0.35 },
        rev: 0.2,
        corte: 2400,
    });
    const padE = S.part('pad esq', I.pad, { pan: -0.6, gain: 0.6, rev: 0.4, corte: 2000 });
    const padD = S.part('pad dir', I.strings, { pan: 0.6, gain: 0.6, rev: 0.4, corte: 2400 });
    const bs = S.part('baixo', I.bass, { gain: 0.26, corte: 1000 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa gated', caixaGated(), { drum: true, gain: 0.5 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.35 }), { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.35 });
    const tm = S.part('tons', I.tom, { drum: true, pan: -0.2, gain: 0.4, rev: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, pan: 0.2, gain: 0.22 });
    const rd = S.part('rádio', radio(), { drum: true, gain: 0.55, rev: 0.1 });
    const rdc = S.part('rádio dial', radio({ dur: 1.1 }), { drum: true, pan: 0.15, gain: 0.45 });
    const sr = S.part('sirene', sirene, { drum: true, pan: 0.7, gain: 0.3, rev: 0.5 });

    const OCT = '0:2 8:2 0:2 8:2 0:2 8:2 0:2 8:2';
    const groove = (b, c, { cheio = false, arpejo = false } = {}) => {
        bass(bs, b, c, OCT);
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.7 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.6 });
        drum(k, b, 1, 'X.......X.....x.');
        drum(sn, b, 1, '....X.......X...');
        drum(hh, b, 1, cheio ? 'x.xox.xox.xox.xo' : 'x.o.x.o.x.o.x.o.', { vel: cheio ? 1 : 0.8 });
        if (cheio) drum(cl, b, 1, '....x.......x...', { vel: 0.6 });
        if (arpejo) arp(ar, b, c, { low: 66, vel: 0.8 });
    };
    // virada de tons (Simmons) no fim da frase
    const virada = (b) => {
        drum(tm, b, 1, '............x...', { pitch: 7 });
        drum(tm, b, 1, '.............x..', { pitch: 4 });
        drum(tm, b, 1, '..............x.', { pitch: 0 });
        drum(tm, b, 1, '...............x', { pitch: -3 });
    };
    const gancho = (b, s = 0) => {
        mel(lead, b, [GANCHO.em({ tom: 9 + s, oitava: -1 })]);
        drum(cl, b, 1, GANCHO.palmas, { vel: 0.9 });
    };

    // intro: o rádio sintoniza sobre o pad; no 2º compasso a música pega, com o gancho
    rd.note(0, 0, 0, 1);
    padChord(padE, 0, 'F#m9', 16, { low: 57, n: 4, vel: 0.4 });
    bass(bs, 1, 'F#m9', OCT, { vel: 0.8 });
    padChord(padE, 1, 'F#m9', 16, { low: 57, n: 4, vel: 0.7 });
    padChord(padD, 1, 'F#m9', 16, { low: 64, n: 3, vel: 0.6 });
    drum(k, 1, 1, 'X.......X.......');
    drum(hh, 1, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.6 });
    gancho(1);
    virada(1);

    const A_CH = ['F#m9', 'Dmaj7', 'Bm9', 'C#7sus4', 'F#m9', 'Dmaj7', 'Bm9', 'C#7'];
    // A1 (2-9): só o groove; o arpejo entra no 6 e o lead pergunta, o piano responde
    A_CH.forEach((c, i) => {
        groove(2 + i, c, { arpejo: i >= 4 });
    });
    drum(cr, 2, 1, 'X...............');
    mel(lead, 6, ['r:2 C#5:2 E5:2 F#5:4 E5:2 C#5:2 B4:2']);
    mel(ep, 7, ['r:4 A5:2 F#5:2 E5:2 D5:2 C#5:4']);
    mel(lead, 8, ['r:2 D5:2 F#5:2 A5:4 G#5:2 F#5:2 E5:2']);
    mel(ep, 9, ['r:4 G#5:2 F5:2 C#5:2 B4:2 G#4:4']);
    virada(9);

    // A2 (10-17) e A3 (26-33, meio tom acima): gancho, refrão do lead, o piano responde nos vãos
    const LEAD = [
        null,
        'r:16',
        'B5:3 A5:3 F#5:4 r:2 E5:2 F#5:2',
        'r:16',
        'C#6:3 B5:3 A5:4 r:2 G#5:2 A5:2',
        'r:16',
        'D6:4 C#6:2 B5:2 F#5:8',
        'r:16',
    ];
    const EP = [
        'r:16',
        'r:4 F#5:2 A5:2 C#6:4 A5:4',
        'r:16',
        'r:4 F#5:2 G#5:2 B5:4 G#5:4',
        'r:16',
        'r:4 A5:2 C#6:2 E6:4 C#6:4',
        'r:16',
        'r:8 F5:2 G#5:2 B5:4',
    ];
    for (const [b0, s] of [
        [10, 0],
        [26, 1],
    ]) {
        A_CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'C#7b9' : transpose(c0, s);
            groove(b0 + i, c, { cheio: true, arpejo: true });
        });
        drum(cr, b0, 1, 'X...............');
        gancho(b0, s);
        const tercas = s ? thirdBelow(MINOR(6 + s)) : null;
        LEAD.forEach((x, i) => {
            if (!x) return;
            mel(lead, b0 + i, [x], { shift: s });
            if (tercas && x !== 'r:16') mel(harm, b0 + i, [x], { shift: s, harm: tercas });
        });
        mel(ep, b0, EP.slice(0, 7), { shift: s });
        if (!s) {
            mel(ep, b0 + 7, EP.slice(7));
            virada(b0 + 7);
        }
    }
    // a volta: Dó#7(b9), o piano canta a nona menor e o rádio gira de volta pro Fá#
    mel(ep, 33, ['r:8 F5:2 G#5:2 D6:4']);
    rdc.note(33 * 16 + 8, 0, 0, 0.8);

    // ponte (18-25): Ré maior, meio tempo, o lead em notas longas; a sirene passa ao longe; Ré7 leva ao Sol menor
    const B_CH = ['Dmaj7', 'E6', 'C#m7', 'F#m9', 'Bm9', 'E9', 'Amaj7', 'D7'];
    B_CH.forEach((c, i) => {
        const b = 18 + i;
        bass(bs, b, c, i === 7 ? '0:2 0:2 5:2 5:2 8:2 8:2 s:2 s:2' : '0:8 8:4 0:4');
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.85 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.75 });
        arp(ar, b, c, { low: 66, step: 2, vel: 0.7 });
        drum(k, b, 1, 'X.........x.....');
        drum(sn, b, 1, i === 7 ? '....x.x.xxxxXXXX' : '........X.......', { vel: i === 7 ? 0.7 : 1 });
        drum(hh, b, 1, 'x...x...x...x...', { vel: 0.7 });
    });
    mel(lead, 18, [GANCHO.em({ tom: 2 })]);
    drum(cl, 18, 1, GANCHO.palmas, { vel: 0.8 });
    mel(ep, 19, ['r:4 G#5:2 B5:2 C#6:4 B5:4']);
    mel(lead, 20, ['E5:6 F#5:2 G#5:4 B5:4']);
    mel(ep, 21, ['r:4 A5:2 C#6:2 E6:8']);
    mel(lead, 22, ['D6:6 C#6:2 B5:4 F#5:4']);
    mel(ep, 23, ['r:4 G#5:2 B5:2 D6:8']);
    mel(lead, 24, ['A5:4 C#6:4 E6:4 G#6:4']);
    mel(lead, 25, ['F#5:2 A5:2 C6:2 D6:2 r:8']);
    sr.note(20 * 16, 0, 0, 1);
    // o rádio gira o dial: a próxima volta é em outra estação (meio tom acima)
    rdc.note(25 * 16 + 4, 0, 0, 0.6);
    return S;
}
