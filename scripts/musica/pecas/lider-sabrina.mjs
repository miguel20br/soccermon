// Tema da Sabrina (líderes de Kanto): a psíquica de Saffron. Calma estranha: Si♭ lídio (o Mi natural é o
// arrepio), 104 BPM em meio-tempo, o clap 808 no 3 bem molhado e com eco. O TEREMIM (feito à mão: seno com vibrato)
// pergunta e a CELESTA responde com a mesma frase espelhada (ela lê a sua mente e devolve ao contrário).
// B, a história do ginásio dela: o labirinto de TELETRANSPORTES. A cada piso ("vwiip", a assinatura) a frase reaparece
// em outro tom, subindo em terças maiores (Si♭ → Ré → Fá#): a sala muda e a música junto. O terceiro piso é o errado
// (o "vwiip" desce) e joga de volta pro começo: a frase volta em Si♭, pela metade, e a COLHER entorta (a nota dobra
// pra baixo, Kadabra). Tenta o trítono (Mi), e no compasso seguinte quatro teletransportes seguidos, um por tempo,
// em tons inteiros (Dó, Ré, Mi, Fá#): tontura. Chega na sala dela: silêncio, um Si♭ grave e a colher dobrando de novo,
// devagar. A harpa sobe em tons inteiros, último piso, e o A volta meio tom acima (Si lídio) com terças e o
// SOC-CER-MON na celesta e no teremim. No fim da virada, um teletransporte leva de volta pro começo (o loop).
// Forma: intro (2): o teremim parado no Mi, a colher | A (8) | B: o labirinto (8) | A' (8) meio tom acima |
// virada (1): Fá7sus4. Loop do compasso 2 ao fim (~58 s). MOTIVO (2 compassos, B♭maj7 | C) pra uma futura Partida.
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, SR, stabs, thirdBelow, transpose } from '../synth.mjs';
import { voz } from './lider-koga.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tema da Sabrina', tela: 'Líder de ginásio: Sabrina (Saffron)' };

export const MOTIVO = {
    mel: ['D5:2 F5:2 A5:4 E6:6 r:2', 'r:2 D6:2 C6:2 G5:2 E5:8'],
    acordes: ['Bbmaj7', 'C'],
};

const TAU = Math.PI * 2;
/** Teremim: seno com um pouco de 3º harmônico e vibrato desde o começo. */
export const teremim = (f) => {
    let ph = 0;
    return (t) => {
        const vib = 1 + 0.009 * Math.sin(TAU * 6 * t) * Math.min(1, t / 0.25);
        ph += (TAU * f * vib) / SR;
        return (Math.sin(ph) + 0.12 * Math.sin(3 * ph)) * Math.min(1, t / 0.08);
    };
};
/** O piso de teletransporte: "vwiip" (sobe 2 oitavas e meia) com brilho; `sobe` falso = o piso errado (desce). */
const teleporte = (sobe) =>
    som(
        0.45,
        (p) => {
            let ph = 0;
            return (t) => {
                const x = Math.min(1, t / 0.28);
                ph += (TAU * 220 * k12(p) * 2 ** (2.5 * (sobe ? x : 1 - x))) / SR;
                const am = 0.6 + 0.4 * Math.sin(TAU * 28 * t);
                const fim = Math.max(0, 1 - Math.max(0, t - 0.28) / 0.15);
                return (Math.sin(ph) + 0.3 * Math.sin(2.01 * ph)) * am * Math.min(1, t / 0.01) * fim;
            };
        },
        { pk: 0.4, corte: 6000 },
    );
export const warp = teleporte(true);
export const warpErrado = teleporte(false);
/** A colher entortando: o "tink" da colher e uma nota que dobra uma terça menor pra baixo, com vibrato. */
export const colher = som(
    1.9,
    (p) => {
        let ph = 0;
        return (t) => {
            const dobra = 2 ** ((-3 / 12) * Math.min(1, Math.max(0, t - 0.15) / 1.3));
            const vib = 1 + 0.012 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.6);
            ph += (TAU * 659.25 * k12(p) * dobra * vib) / SR;
            const tink = Math.sin(TAU * 2637 * k12(p) * t) * Math.exp(-t / 0.03) * 0.4;
            return Math.sin(ph) * Math.min(1, t / 0.06) * Math.min(1, (1.9 - t) / 0.4) + tink;
        };
    },
    { pk: 0.4 },
);

export default function temaSabrina() {
    const S = new Song({ bpm: 104, bars: 27, swing: 0.04, tail: 4, loopFrom: 2 });
    const th = voz(
        S,
        'teremim',
        teremim,
        { pan: -0.1, gain: 1.15, rev: 0.35, echo: { rows: 6, fb: 0.3, mix: 0.25 } },
        { solta: 0.25 },
    );
    const cel = S.part('celesta', I.bell, { pan: 0.25, gain: 3.5, rev: 0.4, echo: { rows: 3, fb: 0.3, mix: 0.25 } });
    const harm = voz(S, 'terças', teremim, { pan: 0.35, gain: 0.45, rev: 0.3 }, { solta: 0.25 });
    const hp = S.part('harpa', I.pizz, { pan: 0.4, gain: 0.5, echo: { rows: 2, fb: 0.3, mix: 0.3 } });
    const ep = S.part('piano', I.epiano, { pan: -0.3, gain: 0.5, corte: 2800 });
    const pad = S.part('pad', I.pad, { gain: 1.0, rev: 0.4 });
    const bs = S.part('baixo', I.bass, { gain: 0.55 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.6 }), {
        drum: true,
        gain: 0.85,
        rev: 0.3,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
    });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.6 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.4, gain: 0.7 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35 });
    const wp = S.part('teleporte', warp, { drum: true, pan: 0.2, gain: 0.7, rev: 0.35 });
    const we = S.part('pisoErrado', warpErrado, { drum: true, pan: -0.2, gain: 0.7, rev: 0.35 });
    const co = S.part('colher', colher, { drum: true, pan: -0.1, gain: 0.8, rev: 0.4 });

    const calma = (b, c, cheio = true) => {
        bass(bs, b, c, '0:8 5:4 8:4');
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.8 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 3],
            ],
            { low: 57, n: 4 },
        );
        arp(hp, b, c, { low: 62, step: 2, vel: 0.6 });
        drum(k, b, 1, cheio ? 'X.........x..x..' : 'X.........x.....');
        drum(cl, b, 1, '........X.......', { vel: 0.8 });
        drum(hh, b, 1, cheio ? 'x.xxx.xxx.xxx.xx' : 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
        drum(sh, b, 1, '..x...x...x...x.', { vel: 0.6 });
    };

    // intro: o teremim parado no Mi (a 4ª aumentada), e a colher entorta
    padChord(pad, 0, 'Bbmaj7', 16, { low: 55, n: 4, vel: 0.8 });
    bass(bs, 0, 'Bbmaj7', '0:16', { vel: 0.7 });
    mel(th, 0, ['r:4 E6:12']);
    co.note(16, 0, 0, 1);
    padChord(pad, 1, 'F7sus4', 16, { low: 55, n: 4, vel: 0.8 });
    mel(hp, 1, ['r:8 Bb5:1 Ab5:1 F#5:1 E5:1 D5:1 C5:1 Bb4:1 r:1']);
    mel(cel, 1, ['r:12 C6:2 Eb6:2']);

    const CH = ['Bbmaj7', 'C', 'Bbmaj7', 'C', 'Gm7', 'Am7', 'Ebmaj7', 'F7sus4'];
    const TH = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'Bb5:2 D6:2 F6:4 E6:4 D6:4',
        'C6:3 A5:3 E5:2 G5:8',
        'r:16',
        'C6:4 Bb5:2 G5:2 F5:4 Eb5:4',
    ];
    // a celesta devolve a frase espelhada (desce onde o teremim subiu)
    const CEL = [
        'r:16',
        'r:16',
        'F6:2 D6:2 Bb5:4 E5:6 r:2',
        'r:2 G5:2 A5:2 C6:2 E6:8',
        'r:16',
        'r:16',
        'G6:2 Eb6:2 Bb5:4 D6:6 r:2',
        'r:16',
    ];
    const blocoA = (b0, s) => {
        mel(th, b0, s ? TH.slice(0, 7) : TH, { shift: s });
        mel(cel, b0, CEL, { shift: s });
        if (s) {
            mel(harm, b0, TH.slice(0, 7), { shift: s, harm: thirdBelow(MAJOR(5 + s)) });
            // SOC-CER-MON em Si maior: celesta e teremim, e o clap molhado responde
            mel(cel, b0 + 7, [GANCHO.em({ tom: -1 })]);
            mel(th, b0 + 7, [GANCHO.em({ tom: -1, oitava: -1 })]);
            drum(cl, b0 + 7, 1, GANCHO.palmas, { vel: 1.2 });
        }
        CH.forEach((c0, i) => {
            calma(b0 + i, s && i === 7 ? 'Bmaj7' : transpose(c0, s), s > 0 || i >= 4);
        });
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: o labirinto. Cada piso, um tom (terças maiores); o 3º é o errado e volta pro começo
    const sala = (b, c) => {
        bass(bs, b, c, '0:8 5:8', { vel: 0.8 });
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.8 });
        arp(hp, b, c, { low: 62, step: 2, vel: 0.5 });
        drum(k, b, 1, 'X...............');
        drum(cl, b, 1, '........X.......', { vel: 0.6 });
        drum(sh, b, 1, '..x...x...x...x.', { vel: 0.5 });
    };
    const SALA = MOTIVO.mel[0];
    for (const [b, c, s] of [
        [10, 'Bbmaj7', 0],
        [11, 'Dmaj7', 4],
        [12, 'F#maj7', -4],
    ]) {
        sala(b, c);
        mel(th, b, [SALA], { shift: s });
        if (b < 12) wp.note(b * 16 + 14, s + 4, 0, 1);
    }
    we.note(12 * 16 + 14, 0, 0, 1);
    // de volta pro começo: a frase pela metade, e a colher entorta
    sala(13, 'Bbmaj7');
    mel(th, 13, ['D5:2 F5:2 A5:4 r:8']);
    co.note(13 * 16 + 8, 0, 0, 0.9);
    wp.note(13 * 16 + 14, 6, 0, 1);
    // o trítono (Mi), e então quatro pisos seguidos, em tons inteiros
    sala(14, 'Emaj7');
    mel(th, 14, [SALA], { shift: 6 });
    mel(th, 15, ['E5:1 G5:1 B5:2 F#5:1 A5:1 C#6:2 G#5:1 B5:1 D#6:2 A#5:1 C#6:1 F6:2']);
    ['C', 'D', 'E', 'F#'].forEach((c, i) => {
        stabs(ep, 15, c, [[i * 4, 3]], { low: 57, n: 3 });
        wp.note(15 * 16 + i * 4, 2 + 2 * i, 0, 0.8);
    });
    mel(bs, 15, ['C2:4 D2:4 E2:4 F#2:4']);
    drum(sh, 15, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.5 });
    // a sala dela: silêncio, Si♭ grave, a colher dobrando devagar
    bass(bs, 16, 'Bbmaj7', '0:16', { vel: 0.8 });
    padChord(pad, 16, 'Bbmaj7', 16, { low: 55, n: 4, vel: 0.6 });
    co.note(16 * 16 + 2, 5, 0, 1);
    mel(cel, 16, ['r:10 A6:2 E6:4'], { vel: 0.7 });
    // a harpa sobe em tons inteiros, o último piso, e o A' meio tom acima
    calma(17, 'F#7sus4');
    mel(hp, 17, ['C5:1 D5:1 E5:1 F#5:1 G#5:1 A#5:1 C6:1 D6:1 E6:1 F#6:1 G#6:1 A#6:1 r:4']);
    wp.note(17 * 16 + 12, 7, 0, 1);

    // A' meio tom acima (Si lídio), com terças; fecha no SOC-CER-MON
    blocoA(18, 1);
    // virada: Fá7sus4, e um teletransporte de volta pro começo
    mel(th, 26, ['C6:4 Bb5:2 G5:2 F5:4 Eb5:4']);
    calma(26, 'F7sus4');
    wp.note(26 * 16 + 13, 2, 0, 1);
    return S;
}
