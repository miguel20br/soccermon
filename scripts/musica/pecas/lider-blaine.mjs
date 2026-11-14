// Tema do Blaine (líderes de Kanto): o quizmaster do fogo, ginásio de Cinnabar. Mambo em Dó menor, 116 BPM: clave
// 3-2, cencerro, congas, piano em montuno, baixo tumbao (antecipa o acorde seguinte). O lead pergunta e o naipe de
// METAIS responde; um FOGO ("fwoosh") no fim das respostas. A assinatura é a MÁQUINA DO QUIZ: o vibrafone faz a
// pergunta, o relógio pensa, e vem o DING (certo) ou o BZZT (errado).
// A história: a Chave Secreta abre a porta (clique, clique), a máquina liga e o Blaine grita "HAH!" (metais e fogo).
// No B, o quiz do ginásio: pergunta 1, o relógio, DING-DING, a porta abre (metais "ta-dá" e a plateia bate palma).
// Pergunta 2, o relógio mais nervoso... BZZT! Errou: um treinador pula na frente (fogo, os metais despencam
// cromático, timbales). Pergunta 3: DING! Ta-dá, palmas, e o VULCÃO ronca subindo. "HAH!", e o A volta um tom acima
// (Ré menor) com terças e o SOC-CER-MON nos metais, com o clap 808 dobrado como plateia de programa de auditório.
// Forma: intro (2): a chave e o "HAH!" | A (8) | B: o quiz (8) | A' (8) um tom acima | virada (1): Sol7(♭9).
// Loop do compasso 2 ao fim (~52 s). MOTIVO (2 compassos, Cm | G7) pra uma futura Partida: Blaine.
import { bass, drum, GANCHO, I, MINOR, mel, Song, SR, stabs, thirdBelow, transpose, voicing } from '../synth.mjs';
import { bzzt, k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tema do Blaine', tela: 'Líder de ginásio: Blaine (Cinnabar)' };

export const MOTIVO = {
    mel: ['G5:2 r:1 G5:1 r:2 C6:2 Bb5:1 C6:1 r:2 G5:2 Eb5:2', 'F5:3 D5:3 B4:2 r:2 D5:1 F5:1 G5:4'],
    acordes: ['Cm', 'G7'],
};

const TAU = Math.PI * 2;
/** Labareda: "fwoosh" de ruído que abre e fecha. */
export const fogo = som(
    0.7,
    (p, r) => {
        let a = 0;
        let b = 0;
        return (t) => {
            const fc = (400 + 2600 * Math.sin(Math.PI * Math.min(1, t / 0.7))) * k12(p);
            a += (1 - Math.exp((-TAU * fc) / SR)) * (r() * 2 - 1 - a);
            b += 0.02 * (a - b);
            return (a - b) * Math.min(1, t / 0.08) * Math.exp(-t / 0.3) * (0.8 + 0.2 * Math.sin(TAU * 13 * t));
        };
    },
    { pk: 0.4 },
);
/** O vulcão roncando: ruído grave que cresce em 2 s. */
export const vulcao = som(
    2.4,
    (_p, r) => {
        let a = 0;
        return (t) => {
            a += 0.012 * (r() * 2 - 1 - a);
            return a * Math.min(1, t / 1.8) * Math.min(1, (2.4 - t) / 0.2) * (0.7 + 0.3 * Math.sin(TAU * 7 * t));
        };
    },
    { pk: 0.5 },
);

export default function temaBlaine() {
    const S = new Song({ bpm: 116, bars: 27, swing: 0.04, tail: 3, loopFrom: 2 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.3, corte: 3400, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.55 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.9, corte: 3000, rev: 0.15 });
    const pn = S.part('montuno', I.epiano, { pan: -0.3, gain: 0.55, corte: 3200 });
    const vib = S.part('quiz', I.bell, { pan: 0.25, gain: 1.6, rev: 0.25 });
    const ding = S.part('ding', I.bell, { pan: 0.1, gain: 2, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.6 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.4 });
    const cow = S.part('cencerro', I.agogo, { drum: true, pan: 0.35, gain: 0.45 });
    const clave = S.part('clave', I.block, { drum: true, pan: -0.35, gain: 0.6 });
    const conga = S.part('conga', I.tom, { drum: true, pan: 0.25, gain: 0.22 });
    const timbal = S.part('timbal', I.tom, { drum: true, pan: -0.2, gain: 0.35 });
    const tic = S.part('relogio', I.block, { drum: true, pan: 0.3, gain: 0.6 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 0.9 });
    const cl2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.3, tom: -1, atraso: 0.014 }), {
        drum: true,
        pan: 0.3,
        gain: 0.9,
    });
    const plateia = S.part('plateia', I.palmas, { drum: true, gain: 1.2, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });
    const fg = S.part('fogo', fogo, { drum: true, pan: 0.3, gain: 0.6, rev: 0.15 });
    const vu = S.part('vulcao', vulcao, { drum: true, gain: 0.9 });
    const bz = S.part('bzzt', bzzt, { drum: true, gain: 0.7 });

    const MONT = [
        [0, 0],
        [2, 1],
        [3, 0],
        [5, 1],
        [6, 0],
        [8, 1],
        [10, 0],
        [11, 1],
        [13, 0],
        [14, 1],
    ];
    const montuno = (b, c) => {
        const v = voicing(c, 60, 4);
        for (const [r, i] of MONT) for (const m of [v[i], v[i + 2]]) pn.note(b * 16 + r, m, 1, r % 4 ? 0.8 : 1);
    };
    const palmas = (b, pat, vel = 1) => {
        drum(cl, b, 1, pat, { vel });
        drum(cl2, b, 1, pat, { vel });
    };
    const mambo = (b, c, prox, cheio = true) => {
        bass(bs, b, c, 'r:6 5:6 r:4');
        bass(bs, b, prox, 'r:12 0:4');
        montuno(b, c);
        drum(clave, b, 1, b % 2 ? '....x...x.......' : 'x.....x.....x...', { pitch: 4 });
        drum(cow, b, 1, 'X.x.X.x.X.x.X.x.', { pitch: -6, vel: 0.8 });
        drum(conga, b, 1, 'o.o.x..xo.o.x.xx', { pitch: 7 });
        drum(k, b, 1, 'x.....x.........');
        if (cheio) palmas(b, '....x.......x...', 0.6);
    };
    const aplauso = (b, de, ate) => {
        for (let r = de; r < ate; r++) plateia.note(b * 16 + r, 0, 0, 0.9 - (0.5 * (r - de)) / (ate - de));
    };
    const taDa = (b, c) => {
        stabs(
            met,
            b,
            c,
            [
                [0, 1],
                [2, 6],
            ],
            { low: 60, n: 3, vel: 0.7 },
        );
        aplauso(b, 2, 12);
        cr.note(b * 16, 0, 0, 0.7);
    };
    // a máquina pergunta (sobe e fica no ar), o relógio pensa
    const PERGUNTA = 'Eb6:2 F6:2 G6:2 C7:2 r:8';
    const pergunta = (b, c, ticks) => {
        bass(bs, b, c, '0:4 r:4 0:4 r:4', { vel: 0.7 });
        stabs(pn, b, c, [[0, 6]], { low: 60, n: 4 });
        drum(clave, b, 1, 'x.....x.....x...', { pitch: 4, vel: 0.6 });
        mel(vib, b, [PERGUNTA]);
        drum(tic, b, 1, ticks, { pitch: 12 });
    };

    // intro: a Chave Secreta (clique, clique), a máquina liga, "HAH!"
    drum(tic, 0, 1, 'x.x.............', { pitch: 5 });
    bass(bs, 0, 'Cm', '0:8 r:8', { vel: 0.5 }); // a máquina zumbindo ao ligar
    mel(vib, 0, ['r:4 C6:1 E6:1 G6:1 C7:1 r:8']);
    stabs(met, 0, 'Cm', [[8, 6]], { low: 60, n: 3, vel: 0.75 });
    cr.note(8, 0, 0, 1);
    fg.note(9, 0, 0, 1);
    mel(met, 1, ['r:8 G4:2 B4:2 D5:2 F5:2']);
    bass(bs, 1, 'Cm', 'r:12 0:4');
    drum(timbal, 1, 1, '........x.x.xxXX', { pitch: 12 });

    const CH = ['Cm', 'G7', 'Cm', 'Fm', 'Ab', 'Fm', 'Dm7b5', 'G7b9'];
    const LEAD = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'C6:2 r:1 C6:1 r:2 Eb6:2 Db6:1 C6:1 r:2 Ab5:2 F5:2',
        'Ab5:3 F5:3 C5:2 r:2 F5:1 Ab5:1 C6:4',
        'r:16',
        'B5:2 Ab5:2 G5:2 F5:2 D5:2 B4:2 G4:4',
    ];
    const MET = [
        'r:16',
        'r:16',
        'r:2 G4:1 C5:1 r:2 Eb5:2 r:1 D5:1 C5:2 G4:4',
        'Ab4:3 F4:3 C4:2 r:8',
        'r:16',
        'r:16',
        'r:2 Ab4:1 D5:1 r:2 F5:2 r:1 Eb5:1 D5:2 Ab4:4',
        'r:16',
    ];
    const blocoA = (b0, s) => {
        mel(lead, b0, s ? LEAD.slice(0, 7) : LEAD, { shift: s });
        mel(met, b0, MET, { shift: s });
        if (s) {
            mel(harm, b0, LEAD.slice(0, 7), { shift: s, harm: thirdBelow(MINOR(s)) });
            // SOC-CER-MON em Ré menor nos metais e no lead, a plateia dobrada responde
            mel(met, b0 + 7, [GANCHO.em({ menor: true, tom: 2, oitava: -1 })]);
            mel(lead, b0 + 7, [GANCHO.em({ menor: true, tom: 2 })]);
            palmas(b0 + 7, GANCHO.palmas, 1.3);
        }
        fg.note((b0 + 3) * 16 + 10, 0, 0, 1);
        fg.note((b0 + 6) * 16 + 13, 0, 0, 0.9);
        CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'Dm' : transpose(c0, s);
            // o tumbao antecipa o acorde seguinte (depois do A vem a 1ª pergunta; depois do A', a virada)
            const prox = i < 7 ? transpose(CH[i + 1], s) : s ? 'G7b9' : 'Fm7';
            mambo(b0 + i, c, prox, s > 0 || i >= 4);
        });
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: o quiz
    pergunta(10, 'Fm7', 'x...x...x...x...');
    mambo(11, 'G7', 'Ab', false);
    drum(tic, 11, 1, 'x...x...x.......', { pitch: 12 });
    mel(ding, 11, ['r:12 G6:1 C7:3']);
    mambo(12, 'Ab', 'Fm7');
    taDa(12, 'Ab');
    mel(lead, 12, ['r:8 C6:1 Eb6:1 Ab6:2 G6:2 Eb6:2']);
    // pergunta 2: o relógio acelera... BZZT
    pergunta(13, 'Fm7', '........x.x.x.x.');
    bz.note(13 * 16 + 12, -5, 0, 1);
    // errou: o treinador pula na frente, fogo, os metais despencam, timbales
    fg.note(14 * 16, 0, 0, 1);
    mambo(14, 'Db7', 'Fm7');
    mel(met, 14, ['C6:1 B5:1 Bb5:1 A5:1 Ab5:1 G5:1 Gb5:1 F5:1 E5:8']);
    drum(timbal, 14, 1, '........x.xxXxXX', { pitch: 12 });
    // pergunta 3: DING
    pergunta(15, 'Fm7', 'x...x...x.......');
    mel(ding, 15, ['r:12 G6:1 C7:3']);
    mambo(16, 'Ab', 'A7');
    taDa(16, 'Ab');
    // o vulcão ronca e sobe, "HAH!" em Lá7
    vu.note(16 * 16 + 6, 0, 0, 1);
    drum(timbal, 16, 1, '............X.X.', { pitch: 5 });
    mambo(17, 'A7', 'Dm');
    stabs(met, 17, 'A7', [[0, 4]], { low: 61, n: 3, vel: 0.75 });
    mel(lead, 17, ['r:8 C#6:2 E6:2 G6:2 A6:2']);
    drum(timbal, 17, 1, '........x.x.xxXX', { pitch: 12 });
    fg.note(17 * 16 + 12, 2, 0, 1);

    // A' um tom acima (Ré menor), com terças; fecha no SOC-CER-MON
    blocoA(18, 2);
    // virada: Sol7(♭9), de volta pro Dó menor
    mel(lead, 26, [LEAD[7]]);
    mambo(26, 'G7b9', 'Cm');
    drum(timbal, 26, 1, '........x.xxXxXX', { pitch: 12 });
    fg.note(26 * 16 + 14, 0, 0, 0.9);
    return S;
}
