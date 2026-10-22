// Rota 1 v3 (rodada 8, extra): a Rota 1 v2 (Dó# menor que sobe, 120 BPM, timbre quente no clima do Komiku, baixo a
// galope) levada pra régua da rodada 6. A melodia fica; entram pergunta e resposta (a flauta pergunta, o piano
// elétrico responde nas notas longas), uma ponte no relativo maior (Mi) que termina no SOC-CER-MON com o clap 808
// macio, e a volta final meio tom acima (Ré menor), com terças.
// Forma: intro (2): pizzicato e galope | A (8) | A2 (8): terças e cordas | C (8): a ponte em Mi | A' (8) meio tom
// acima | virada (1): Sol#7. Loop do compasso 2 ao fim (~70 s). Proposta de tela: região Rota 1 no mapa (o começo).
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    MAJOR,
    MINOR,
    mel,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';

export const meta = { titulo: 'Rota 1 v3', tela: 'Mapa: Rota 1' };

export default function rota1V3() {
    const S = new Song({ bpm: 120, bars: 35, swing: 0.04, tail: 3, loopFrom: 2 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.2,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.25,
    });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.55, rev: 0.25 });
    const ep = S.part('piano', I.epiano, { pan: 0.25, gain: 0.8, rev: 0.2 });
    const resp = S.part('resposta', I.epiano, { pan: 0.3, gain: 1.1, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.2 });
    const pz = S.part('pizz', I.pizz, { pan: -0.3, gain: 0.9 });
    const str = S.part('cordas', I.strings, { gain: 1, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.5 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.7 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 1.2 });
    const rim = S.part('aro', I.block, { drum: true, pan: -0.2, gain: 1 });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.3 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6000, sala: 0.3 }), {
        drum: true,
        gain: 1.1,
        rev: 0.1,
    });

    const A = [
        'G#4:4 C#5:4 E5:6 D#5:2',
        'C#5:6 B4:2 A4:8',
        'B4:4 E5:4 G#5:6 F#5:2',
        'F#5:12 D#5:4',
        'E5:4 G#5:4 C#6:6 B5:2',
        'A5:4 G#5:2 F#5:2 E5:8',
        'F#5:4 A5:4 C#6:4 B5:2 A5:2',
        'G#5:8 F#5:4 D#5:4',
    ];
    const A2 = [
        'C#6:6 B5:2 A5:4 E5:4',
        'D#6:6 C#6:2 B5:4 F#5:4',
        'B5:4 G#5:4 D#5:4 G#5:4',
        'C#6:8 B5:4 G#5:4',
        'A5:4 C#6:4 E6:4 C#6:2 A5:2',
        'B5:4 D#6:4 F#6:4 D#6:2 B5:2',
        'G#5:6 F#5:2 E5:4 B4:4',
        'G#5:4 F#5:4 D#5:4 C5:4',
    ];
    const RESP = ['r:16', 'r:8 E5:2 F#5:2 G#5:4', 'r:16', 'r:16', 'r:16', 'r:8 C#6:2 B5:2 A5:4', 'r:16', 'r:16'];
    const A_CH = ['C#m', 'A', 'E', 'B', 'C#m', 'A', 'F#m', 'G#7'];
    const A2_CH = ['A', 'B', 'G#m', 'C#m', 'A', 'B', 'E', 'G#7'];
    const C_CH = ['Emaj7', 'F#m7', 'G#m7', 'Amaj7', 'Emaj7', 'F#m7', 'Amaj7', 'B7sus4'];
    const C_EP = [
        'B4:4 E5:4 G#5:4 B5:4',
        'A5:6 G#5:2 F#5:8',
        'D#5:4 F#5:4 B5:4 D#6:4',
        'C#6:6 B5:2 G#5:8',
        'B4:4 E5:4 G#5:4 B5:4',
        'C#6:4 E6:4 A5:8',
        'C#6:6 B5:2 A5:4 G#5:4',
        GANCHO.em({ tom: 4 }),
    ];
    const C_FL = ['G#4:16', 'A4:16', 'B4:16', 'C#5:16', 'G#4:16', 'A4:16', 'E5:16', 'r:16'];
    const GALOPE = '0:2 0:1 0:1 0:2 0:1 0:1 5:2 5:1 5:1 8:2 5:2';
    const bar = (b, c, cordas) => {
        bass(bs, b, c, GALOPE);
        arp(pz, b, c, { low: 61, step: 2 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 4],
            ],
            { low: 56, n: 3, vel: 0.7 },
        );
        if (cordas) padChord(str, b, c, 16, { low: 56, n: 3 });
        drum(k, b, 1, 'x.......x.......');
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo');
        drum(rim, b, 1, '....x.......x...');
    };
    // intro: pizzicato e galope
    for (const [b, c] of [
        [0, 'C#m'],
        [1, 'G#7'],
    ]) {
        bass(bs, b, c, GALOPE, { vel: 0.8 });
        arp(pz, b, c, { low: 61, step: 2 });
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo');
    }
    // A e A' (meio tom acima, com terças)
    for (const [b0, s] of [
        [2, 0],
        [26, 1],
    ]) {
        mel(lead, b0, A, { shift: s });
        mel(resp, b0, RESP, { shift: s });
        if (s) mel(harm, b0, A, { shift: s, harm: thirdBelow(MINOR(1 + s)) });
        A_CH.forEach((c, i) => {
            bar(b0 + i, transpose(c, s), s > 0);
        });
        drum(ti, b0 + 7, 1, '........x.x.xxxx');
    }
    // A2: a segunda metade da v2, com terças e cordas
    mel(lead, 10, A2);
    mel(harm, 10, A2, { harm: thirdBelow(MINOR(1)) });
    A2_CH.forEach((c, i) => {
        bar(10 + i, c, true);
    });
    drum(ti, 17, 1, '........x.x.xxxx');
    // C: a ponte em Mi maior, o piano canta, a flauta segura embaixo, SOC-CER-MON com o clap
    mel(resp, 18, C_EP);
    mel(lead, 18, C_FL);
    mel(harm, 22, C_EP.slice(0, 3), { harm: thirdBelow(MAJOR(4)) });
    C_CH.forEach((c, i) => {
        bar(18 + i, c, true);
    });
    drum(cl, 25, 1, GANCHO.palmas);
    // virada: Sol#7, de volta pro Dó# menor
    bar(34, 'G#7', false);
    mel(lead, 34, ['G#5:4 F#5:4 D#5:4 C5:4']);
    drum(ti, 34, 1, '........x.x.xxxx');
    return S;
}
