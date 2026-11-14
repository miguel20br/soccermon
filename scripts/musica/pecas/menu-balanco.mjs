// Menu: Só o balanço (30/10/2026). O pedido: uma variação calma da música do menu ("a do soccermon mesmo é meio...
// demais"). Aqui o funk da casa fica só no groove: vamp Lá dórico (Am9–D9) a 100 BPM, baixo slap abafado, guitarra
// no contratempo, clavinete e órgão com passa-baixa (timbre quente), percussão baixinha. O SOC-CER-MON volta só a
// cada 8 compassos, no começo de cada frase, com o clap 808 respondendo "hey hey" de leve; entre um e outro, o synth
// pergunta e o vibrafone responde. Som de assinatura: a bola quicando no gramado (três toques que aceleram) antes
// de cada gancho. Ponte no Fá (bVI) com metade do tempo e Fá#7 levando à volta final 1 tom acima (Si dórico);
// o último compasso é Mi7(b9), que cai de volta no Lá.
// Forma: intro (2, o gancho uma vez) | G1 (8): só o groove, depois pergunta e resposta | G2 (8): gancho, melodia |
// B (8): ponte | G3 (8) em Si. Loop do compasso 2 ao fim: 32 compassos, 76,8 s.
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu: Só o balanço (groove)', tela: 'Home' };

/** Pulso e órgão têm média fora do zero (a 1ª versão saiu com DC de −0,2): passa-alta do ZzFX em ~80 Hz no lugar do
 * `filter` (o `corte` da faixa faz o passa-baixa). */
const semDC = (inst) => [...inst.slice(0, -1), 40];

export default function menuBalanco() {
    const S = new Song({ bpm: 100, bars: 34, swing: 0.1, tail: 3, loopFrom: 2 });
    const lead = S.part('synth', semDC(I.pulse), {
        pan: -0.1,
        gain: 1.3,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.2,
        corte: 2600,
    });
    const harm = S.part('terças', semDC(I.pulse), { pan: 0.3, gain: 0.5, rev: 0.2, corte: 2400 });
    const vib = S.part('vibrafone', I.bell, { pan: 0.35, gain: 2.6, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.3 });
    const clav = S.part('clavinete', semDC(I.clav), { pan: 0.3, gain: 0.8, corte: 2200 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 0.9 });
    const org = S.part('órgão', semDC(I.organ), { gain: 0.4, corte: 1800, rev: 0.2 });
    const bs = S.part('baixo', I.slap, { gain: 0.4, corte: 1100 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.45 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 }), { drum: true, gain: 0.8 });
    const bola = S.part('bola', I.tom, { drum: true, pan: -0.2, gain: 0.45 });

    const HATS = 'x.xx.x.xx.xx.x.x'.replace(/\./g, 'o');
    const SLAP = '0:2 8:1~ r:1 0:2 r:2 5:2 s:2 8:2 5:2';
    const groove = (b, c, { clap = false, leve = false } = {}) => {
        bass(bs, b, c, SLAP);
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        stabs(
            clav,
            b,
            c,
            [
                [3, 1],
                [7, 1],
                [11, 2],
            ],
            { low: 60, n: 3, vel: 0.7 },
        );
        drum(k, b, 1, 'X.....x...x.....');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o....X.o.');
        drum(hh, b, 1, HATS, { vel: leve ? 0.7 : 1 });
        if (clap) drum(cl, b, 1, '............x...');
    };
    // o gancho de cada frase: synth (com terças no G3), órgão segura, o clap responde "hey hey"
    const gancho = (b, call, { tercas = null } = {}) => {
        mel(lead, b, [call]);
        if (tercas) mel(harm, b, [call], { harm: tercas });
        drum(cl, b, 1, GANCHO.palmas, { vel: 0.9 });
    };
    // a bola quicando no gramado: três toques que aceleram, no fim do compasso antes do gancho
    const quica = (b) => drum(bola, b, 1, '......X....x..xo', { pitch: 9 });

    // intro: baixo e chimbal; o gancho uma vez (o logo pisca ao entrar na Home)
    bass(bs, 0, 'Am9', SLAP, { vel: 0.8 });
    bass(bs, 1, 'D9', SLAP, { vel: 0.8 });
    drum(hh, 0, 2, HATS, { vel: 0.6 });
    drum(k, 1, 1, 'X.....x...x.....');
    gancho(0, GANCHO.em({ grau: -2 }));
    quica(1);

    // G1 (2-9): só o groove; depois o synth pergunta e o vibrafone responde
    for (let i = 0; i < 8; i++) groove(2 + i, i % 2 ? 'D9' : 'Am9', { leve: i < 4 });
    mel(lead, 6, ['r:2 E5:2 G5:2 A5:3 G5:1 E5:2 D5:4']);
    mel(vib, 7, ['r:4 C6:2 A5:2 G5:2 E5:2 D5:4']);
    mel(lead, 8, ['r:2 E5:2 G5:2 A5:3 C6:1 B5:2 A5:4']);
    mel(vib, 9, ['r:4 G5:2 E5:2 D5:2 C5:2 A4:4']);
    quica(9);

    // G2 (10-17) e G3 (26-33, 1 tom acima): gancho no 1º compasso, órgão, melodia em pergunta e resposta
    const G_SYN = [
        null,
        'r:16',
        'A5:3 G5:2 E5:3 r:2 D5:2 E5:2 G5:2',
        'r:16',
        'C6:3 B5:2 A5:3 r:2 G5:2 A5:2 B5:2',
        'r:16',
        'E6:4 D6:2 C6:2 A5:8',
        'r:16',
    ];
    const G_VIB = [
        'r:16',
        'r:4 F#5:2 A5:2 C6:4 A5:4',
        'r:16',
        'r:6 F#5:2 E5:2 D5:2 C5:4',
        'r:16',
        'r:4 A5:2 B5:2 C6:2 D6:2 E6:4',
        'r:16',
        'r:8 F#5:2 E5:2 D5:4',
    ];
    for (const [b0, s] of [
        [10, 0],
        [26, 2],
    ]) {
        for (let i = 0; i < 8; i++) {
            // o último do G3 é Mi7(b9): volta pro Lá
            const c = s && i === 7 ? 'E7b9' : transpose(i % 2 ? 'D9' : 'Am9', s);
            groove(b0 + i, c, { clap: i % 2 === 1 && i !== 7 });
            padChord(org, b0 + i, c, 16, { low: 55, n: 4, vel: 0.6 });
        }
        const tercas = s ? thirdBelow(MAJOR(7 + s)) : null;
        gancho(b0, GANCHO.em({ grau: -2, tom: s }), { tercas });
        G_SYN.forEach((x, i) => {
            if (!x) return;
            mel(lead, b0 + i, [x], { shift: s });
            if (tercas && x !== 'r:16') mel(harm, b0 + i, [x], { shift: s, harm: tercas });
        });
        mel(vib, b0, G_VIB.slice(0, 7), { shift: s });
        if (!s) {
            mel(vib, b0 + 7, G_VIB.slice(7));
            quica(b0 + 7);
        }
    }
    // a volta: Mi7(b9) com a terça e a nona menor no vibrafone, a bola quica e o gancho da volta abre o G1
    mel(vib, 33, ['r:8 G#5:2 F5:2 E5:4']);
    quica(33);

    // ponte (18-25): Fá maior emprestado, meio tempo; o gancho abre no Fá, Fá#7 leva ao Si
    const B_CH = ['Fmaj7', 'Em7', 'Dm9', 'Cmaj7', 'Fmaj7', 'Em7', 'Dm9', 'F#7'];
    B_CH.forEach((c, i) => {
        const b = 18 + i;
        bass(bs, b, c, i === 7 ? '0:2 0:2 5:2 5:2 8:2 8:2 s:2 s:2' : '0:6 5:2 8:4 5:4');
        padChord(org, b, c, 16, { low: 55, n: 4, vel: 0.75 });
        stabs(gt, b, c, [6, 14], { low: 60, n: 3, vel: 0.8 });
        drum(k, b, 1, 'X.........x.....');
        drum(sn, b, 1, i === 7 ? '....x.x.xxxxXXXX' : '........x.......');
        drum(hh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.8 });
    });
    gancho(18, GANCHO.em({ grau: 3 }));
    mel(vib, 19, ['r:4 G5:2 B5:2 D6:4 B5:4']);
    mel(lead, 20, ['F5:6 E5:2 D5:4 A5:4']);
    mel(vib, 21, ['r:4 E5:2 G5:2 B5:8']);
    mel(lead, 22, ['A5:6 G5:2 F5:4 C6:4']);
    mel(vib, 23, ['r:4 B5:2 G5:2 E5:8']);
    mel(lead, 24, ['F5:4 A5:4 C6:4 E6:4']);
    mel(lead, 25, ['F#5:2 A#5:2 C#6:2 E6:2 r:8']);
    quica(25);
    return S;
}
