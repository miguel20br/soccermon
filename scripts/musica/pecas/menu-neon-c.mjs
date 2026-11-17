// Menu neon C: Praia à noite (17/11/2026, esboço). O pedido: música do menu só da Semana Fora da Lei (tema neon,
// 16 a 22/11), no lugar do `menu-balanco` enquanto o tema estiver ligado. Clima de synthwave anos 80 na praia de
// madrugada, o letreiro de neon refletido na água; inspirado no clima, sem melodia nem progressão de música existente.
// Esta é a mais calma: Ré maior a 100 BPM (o andamento do menu-balanco) em meio tempo (caixa gated grande só no 3,
// com o clap 808 molhado dobrando no refrão), baixo em oitavas de colcheia bem abafado, pad largo, lead triangular
// (timbre quente) com eco longo e o piano elétrico respondendo; sininhos esparsos como luzes da orla. O Sol menor
// com sexta (iv emprestado) no 4º compasso de cada frase é o "uau". Som de assinatura: as ondas do mar, uma
// quebrando de cada lado a cada 4 compassos; na virada pra volta final, a onda grande.
// Forma: intro (2: ondas e pad, depois o gancho) | A1 (8): groove e ondas, pergunta e resposta | A2 (8): gancho,
// refrão | B (8): ponte com acordes emprestados (Si♭ e Dó), Fá menor7–Si♭7 leva a Mi♭ | A3 (8) meio tom acima, com
// terças; o último é Lá7(b9), que cai de volta no Ré. Loop do compasso 2 ao fim: 32 compassos, 76,8 s.
import { caixaGated, ondas } from '../neon-sons.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu neon C: Praia à noite (synthwave lenta)', tela: 'Home (Semana Fora da Lei)' };

export default function menuNeonC() {
    const S = new Song({ bpm: 100, bars: 34, swing: 0.04, tail: 4, loopFrom: 2 });
    const lead = S.part('lead', I.counter, {
        pan: -0.05,
        gain: 1,
        echo: { rows: 6, fb: 0.3, mix: 0.3 },
        rev: 0.35,
        corte: 2400,
    });
    const harm = S.part('terças', I.counter, {
        pan: 0.3,
        gain: 0.4,
        echo: { rows: 6, fb: 0.25, mix: 0.25 },
        rev: 0.35,
        corte: 2000,
    });
    const ep = S.part('piano DX', I.epiano, { pan: 0.3, gain: 1.3, echo: { rows: 6, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const sino = S.part('sininhos', I.bell, { pan: 0.55, gain: 1.4, echo: { rows: 3, fb: 0.4, mix: 0.4 }, rev: 0.5 });
    const padE = S.part('pad esq', I.pad, { pan: -0.65, gain: 0.6, rev: 0.5, corte: 1800 });
    const padD = S.part('pad dir', I.strings, { pan: 0.65, gain: 0.55, rev: 0.5, corte: 2000 });
    const bs = S.part('baixo', I.bass, { gain: 0.28, corte: 750 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa gated', caixaGated({ gate: 0.32, sala: 0.7, corte: 5000 }), { drum: true, gain: 0.5 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.45 }), { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.3 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: -0.3, gain: 0.35 });
    const tm = S.part('tons', I.tom, { drum: true, pan: -0.2, gain: 0.35, rev: 0.35 });
    const ondaE = S.part('onda esq', ondas, { drum: true, pan: -0.55, gain: 0.45, rev: 0.2 });
    const ondaD = S.part('onda dir', ondas, { drum: true, pan: 0.55, gain: 0.45, rev: 0.2 });

    const OCT = '0:2 8:2 0:2 8:2 0:2 8:2 0:2 8:2';
    const groove = (b, c, { cheio = false } = {}) => {
        bass(bs, b, c, cheio ? OCT : '0:4 8:2 0:2 r:2 0:2 8:4');
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.7 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.6 });
        drum(k, b, 1, 'X.........x.....');
        drum(sn, b, 1, '........X.......');
        drum(hh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.7 });
        if (cheio) {
            drum(sk, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.6 });
            drum(cl, b, 1, '........x.......', { vel: 0.6 });
        }
    };
    // uma onda de cada lado a cada 4 compassos (a da direita 2 compassos depois)
    const mar = (b) => {
        if (b % 4 === 2) ondaE.note(b * 16, 0, 0, 1);
        if (b % 4 === 0) ondaD.note(b * 16, -2, 0, 0.9);
    };
    // luzes da orla: sininhos esparsos, as notas do acorde lá em cima
    const luzes = (b, notas, shift = 0) => mel(sino, b, notas, { shift });
    const gancho = (b, tom) => {
        mel(lead, b, [GANCHO.em({ tom })]);
        drum(cl, b, 1, GANCHO.palmas, { vel: 0.8 });
    };

    // intro: o mar e o pad; o gancho entra no 2º compasso, o piano já responde
    ondaE.note(0, 0, 0, 1);
    padChord(padE, 0, 'Dmaj7', 32, { low: 57, n: 4, vel: 0.5 });
    padChord(padD, 1, 'Dmaj7', 16, { low: 64, n: 3, vel: 0.5 });
    bass(bs, 1, 'Dmaj7', '0:8 8:8', { vel: 0.7 });
    gancho(1, 2);
    drum(tm, 1, 1, '............x.x.', { pitch: 3 });

    const A_CH = ['Dmaj7', 'F#m7', 'Gmaj7', 'Gm6', 'Dmaj7', 'Bm7', 'Em7', 'A7sus4'];
    // A1 (2-9): o groove leve e as ondas; o lead pergunta, o piano responde
    A_CH.forEach((c, i) => {
        groove(2 + i, c);
        mar(2 + i);
    });
    luzes(3, ['r:8 A6:2 F#6:2 C#7:4']);
    luzes(5, ['r:8 Bb6:2 G6:2 D7:4']);
    mel(lead, 6, ['r:2 F#5:2 A5:2 C#6:6 B5:2 A5:2']);
    mel(ep, 7, ['r:4 D6:2 B5:2 F#5:4 A5:4']);
    mel(lead, 8, ['r:2 G5:2 B5:2 D6:6 C#6:2 B5:2']);
    mel(ep, 9, ['r:4 E6:2 D6:2 A5:4 G5:4']);
    drum(tm, 9, 1, '............x.x.', { pitch: 3 });

    // A2 (10-17) e A3 (26-33, meio tom acima): gancho, refrão do lead, o piano responde nos vãos
    const LEAD = [
        null,
        'r:16',
        'B5:3 A5:3 F#5:4 r:2 D5:2 E5:2',
        'r:16',
        'A5:3 B5:3 C#6:4 r:2 D6:2 E6:2',
        'r:16',
        'G6:4 F#6:2 E6:2 B5:8',
        'r:16',
    ];
    const EP = [
        'r:16',
        'r:4 A5:2 C#6:2 E6:4 C#6:4',
        'r:16',
        'r:4 Bb5:2 G5:2 E5:4 D5:4',
        'r:16',
        'r:4 F#6:2 D6:2 B5:4 A5:4',
        'r:16',
        'r:8 G5:2 E5:2 A5:4',
    ];
    for (const [b0, s] of [
        [10, 0],
        [26, 1],
    ]) {
        A_CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'A7b9' : transpose(c0, s);
            groove(b0 + i, c, { cheio: true });
            mar(b0 + i);
        });
        gancho(b0, 2 + s);
        const tercas = s ? thirdBelow(MAJOR(2 + s)) : null;
        LEAD.forEach((x, i) => {
            if (!x) return;
            mel(lead, b0 + i, [x], { shift: s });
            if (tercas && x !== 'r:16') mel(harm, b0 + i, [x], { shift: s, harm: tercas });
        });
        mel(ep, b0, EP.slice(0, 7), { shift: s });
        luzes(b0 + 1, ['r:8 C#7:2 A6:2 E6:4'], s);
        luzes(b0 + 5, ['r:8 D7:2 B6:2 F#6:4'], s);
        if (!s) {
            mel(ep, b0 + 7, EP.slice(7));
            drum(tm, b0 + 7, 1, '............x.x.', { pitch: 3 });
        }
    }
    // a volta: Lá7(b9), o piano canta a nona menor e desce pro Ré
    mel(ep, 33, ['r:8 G5:2 Bb5:2 C#6:4']);

    // ponte (18-25): acordes emprestados, o gancho abre em Si♭; Fá menor7–Si♭7 leva ao Mi♭ com a onda grande
    const B_CH = ['Bbmaj7', 'Cadd9', 'Dmaj7', 'Bm7', 'Gmaj7', 'Gm6', 'Fm7', 'Bb7'];
    B_CH.forEach((c, i) => {
        const b = 18 + i;
        bass(bs, b, c, i === 7 ? '0:2 0:2 5:2 5:2 8:2 8:2 s:2 s:2' : '0:8 5:4 8:4');
        padChord(padE, b, c, 16, { low: 57, n: 4, vel: 0.85 });
        padChord(padD, b, c, 16, { low: 64, n: 3, vel: 0.75 });
        drum(k, b, 1, 'X...............');
        drum(sn, b, 1, i === 7 ? '........x.x.xxXX' : '........X.......', { vel: i === 7 ? 0.7 : 0.9 });
        drum(sk, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.5 });
        if (i < 6) mar(b);
    });
    gancho(18, -2);
    mel(ep, 19, ['r:4 G5:2 D6:2 E6:4 D6:4']);
    mel(lead, 20, ['F#5:6 E5:2 D5:4 A5:4']);
    mel(ep, 21, ['r:4 D6:2 F#6:2 B5:8']);
    mel(lead, 22, ['B5:6 A5:2 G5:4 D6:4']);
    mel(ep, 23, ['r:4 Bb5:2 D6:2 E6:8']);
    mel(lead, 24, ['Ab5:4 C6:4 Eb6:4 F6:4']);
    mel(lead, 25, ['D5:2 F5:2 Ab5:2 Bb5:2 r:8']);
    luzes(21, ['r:8 F#6:2 D6:2 B6:4']);
    // a onda grande: dos dois lados juntos, quebrando em cima da subida de tom
    ondaE.note(24 * 16 + 8, -3, 0, 1.2);
    ondaD.note(24 * 16 + 8, -4, 0, 1.2);
    return S;
}
