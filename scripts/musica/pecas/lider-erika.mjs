// Tema da Erika (líderes de Kanto): a líder de Celadon, das plantas, que cochila no meio do jardim. Bossa nova
// animada em Ré mixolídio (o Dó natural é o perfume), 112 BPM com balanço leve. A FLAUTA pergunta, a MARIMBA
// responde; o BORRIFO de perfume (a loja de Celadon) é a assinatura, no fim das respostas, e as PÉTALAS caem nos
// sininhos.
// A história: a arvorezinha na porta do ginásio (o Corte: tchic, tchic, ela cai) e o jardim. No B ela cochila: o
// andamento afrouxa (112 → 80), a flauta boceja, a caixinha de música canta o tema na metade da velocidade, uma
// pétala desce devagar e cai no nariz dela... a... a... ATCHIM! Silêncio. Acorda ("eu cochilei?"), a marimba ri, e o A
// volta um tom acima (Mi) com terças e o SOC-CER-MON na flauta e na marimba, com o clap 808 macio.
// Forma: intro (2): o perfume e o Corte | A (8) | B: o cochilo (8) | A' (8) um tom acima | virada (1): Lá7.
// Loop do compasso 2 ao fim (~57 s). MOTIVO (2 compassos, D6 | C: o ♭VII mixolídio volta pra tônica) pra uma futura
// Partida: Erika.
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, SR, stabs, thirdBelow, transpose } from '../synth.mjs';
import { deslize, k12, luva, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tema da Erika', tela: 'Líder de ginásio: Erika (Celadon)' };

export const MOTIVO = {
    mel: ['D5:1 F#5:1 A5:2 B5:4 r:2 A5:1 B5:1 D6:4', 'C6:3 B5:3 G5:2 E5:4 r:4'],
    acordes: ['D6', 'C'],
};

const TAU = Math.PI * 2;
/** Borrifo de perfume: o clique da bombinha e o "psss" macio (assinatura da Erika). */
export const borrifo = som(
    0.4,
    (_p, r) => {
        let a = 0;
        let b = 0;
        return (t) => {
            const n = r() * 2 - 1;
            a += 0.7 * (n - a);
            b += 0.25 * (a - b);
            return (a - b) * Math.min(1, t / 0.012) * Math.exp(-t / 0.11) + (t < 0.004 ? 0.4 * n : 0);
        };
    },
    { pk: 0.35, corte: 8000 },
);
/** Espirro: puxa o ar ("a... a...") e solta o "TCHIM" uns 0,45 s depois. */
export const atchim = som(
    0.9,
    (p, r) => {
        let a = 0;
        let b = 0;
        let ph = 0;
        return (t) => {
            a += 0.35 * (r() * 2 - 1 - a);
            b += 0.06 * (a - b);
            const puxa = t < 0.45 ? (a - b) * 0.25 * (t / 0.45) : 0;
            const u = t - 0.45;
            if (u < 0) return puxa;
            ph += (TAU * (900 * Math.exp(-u / 0.15) + 250) * k12(p)) / SR;
            return ((a - b) * 1.2 + 0.5 * Math.sin(ph)) * Math.exp(-u / 0.09) * Math.min(1, u / 0.003);
        };
    },
    { pk: 0.45, corte: 6000 },
);
/** A tesoura do Corte: "tchic". */
export const tesoura = som(
    0.08,
    (p, r) => {
        let a = 0;
        return (t) => {
            a += 0.6 * (r() * 2 - 1 - a);
            return (a + 0.5 * Math.sin(TAU * 3200 * k12(p) * t)) * Math.exp(-t / 0.012);
        };
    },
    { pk: 0.35, corte: 7000 },
);

export default function temaErika() {
    // o cochilo: o andamento afrouxa no B e volta de uma vez quando ela acorda
    const LENTO = { 10: 104, 11: 96, 12: 88, 13: 80, 14: 80, 15: 80 };
    const S = new Song({ bpm: 112, bars: 27, swing: 0.06, tail: 3, loopFrom: 2, bpmAt: (b) => LENTO[b] ?? 112 });
    const fl = S.part('flauta', I.counter, {
        pan: -0.15,
        gain: 1.3,
        rev: 0.25,
        corte: 4000,
        echo: { rows: 3, fb: 0.15, mix: 0.12 },
    });
    const harm = S.part('terças', I.counter, { pan: 0.3, gain: 0.5, rev: 0.2, corte: 3500 });
    const mar = S.part('marimba', I.pizz, { pan: 0.3, gain: 2.4, echo: { rows: 2, fb: 0.2, mix: 0.15 } });
    const pn = S.part('piano', I.epiano, { pan: -0.3, gain: 0.5, corte: 3000 });
    const cx = S.part('caixinha', I.bell, { pan: 0.2, gain: 2.0, rev: 0.4 });
    const bs = S.part('baixo', I.bass, { gain: 0.55 });
    const str = S.part('cordas', I.strings, { gain: 0.6, rev: 0.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.4 });
    const aro = S.part('aro', I.block, { drum: true, pan: -0.2, gain: 0.7 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.4, gain: 0.9 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.45 }), { drum: true, gain: 0.9 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35 });
    const bo = S.part('borrifo', borrifo, { drum: true, pan: 0.45, gain: 0.8, rev: 0.2 });
    const at = S.part('atchim', atchim, { drum: true, gain: 0.85, rev: 0.15 });
    const boc = S.part('bocejo', deslize(740, 330, 1.2), { drum: true, pan: -0.15, gain: 0.45, rev: 0.3 });
    const te = S.part('tesoura', tesoura, { drum: true, pan: 0.2, gain: 0.6 });
    const arv = S.part('arvore', luva, { drum: true, gain: 0.7, rev: 0.2 });

    const COMP = [
        [
            [0, 2],
            [3, 2],
            [6, 3],
            [10, 2],
            [13, 2],
        ],
        [
            [2, 2],
            [6, 2],
            [9, 2],
            [12, 3],
        ],
    ];
    const bossa = (b, c, cheio = true) => {
        bass(bs, b, c, '0:6 5:2 5:8');
        stabs(pn, b, c, COMP[b % 2], { low: 57, n: 4 });
        drum(aro, b, 1, b % 2 ? '..x..x...x..x...' : 'x..x..x...x..x..', { pitch: -10 });
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.8 });
        if (cheio) drum(cl, b, 1, '....x.......x...', { vel: 0.6 });
    };

    // intro: dois borrifos e as pétalas; o Corte: tchic, tchic, e a arvorezinha cai
    padChord(str, 0, 'D6', 16, { low: 57, n: 4, vel: 0.8 });
    bo.note(0, 0, 0, 1);
    bo.note(6, 0, 0, 0.8);
    mel(cx, 0, ['r:8 D7:1 B6:1 A6:1 F#6:1 E6:1 D6:1 B5:2']);
    drum(te, 1, 1, 'x..x............');
    arv.note(16 + 8, 0, 0, 1);
    bass(bs, 1, 'A7', 'r:8 0:4 5:4');
    stabs(
        pn,
        1,
        'A7',
        [
            [8, 2],
            [12, 3],
        ],
        { low: 57, n: 4 },
    );
    drum(aro, 1, 1, '........x.x.xxxx', { pitch: -10, vel: 0.8 });

    const CH = ['D6', 'C', 'D6', 'Am7', 'Gmaj7', 'Gm6', 'Em7', 'A7'];
    const FL = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'B5:2 D6:2 r:1 F#6:3 E6:2 D6:2 B5:4',
        'Bb5:3 A5:3 G5:2 E5:4 r:4',
        'r:16',
        'A5:3 G5:3 E5:2 C#5:2 D5:2 E5:4',
    ];
    const MAR = [
        'r:16',
        'r:16',
        'r:2 A4:1 B4:1 D5:4 r:2 B4:1 D5:1 F#5:4',
        'E5:3 C5:3 A4:2 G4:4 r:4',
        'r:16',
        'r:16',
        'r:2 G4:1 B4:1 D5:4 r:2 E5:1 F#5:1 G5:4',
        'r:16',
    ];
    const blocoA = (b0, s) => {
        mel(fl, b0, s ? FL.slice(0, 7) : FL, { shift: s });
        mel(mar, b0, MAR, { shift: s });
        if (s) {
            mel(harm, b0, FL.slice(0, 7), { shift: s, harm: thirdBelow(MAJOR(7 + s)) });
            // SOC-CER-MON em Mi maior: flauta em cima, marimba embaixo, e o clap responde
            mel(fl, b0 + 7, [GANCHO.em({ tom: 4 })]);
            mel(mar, b0 + 7, [GANCHO.em({ tom: 4, oitava: -1 })]);
            drum(cl, b0 + 7, 1, GANCHO.palmas, { vel: 1.3 });
        }
        // pétalas no fim das frases da flauta, borrifo no fim das respostas da marimba
        mel(cx, b0 + 1, ['r:12 G6:1 E6:1 D6:1 B5:1'], { shift: s });
        mel(cx, b0 + 5, ['r:12 G6:1 E6:1 D6:1 Bb5:1'], { shift: s });
        bo.note((b0 + 3) * 16 + 12, 0, 0, 1);
        bo.note((b0 + 6) * 16 + 13, 0, 0, 0.9);
        CH.forEach((c0, i) => {
            bossa(b0 + i, s && i === 7 ? 'E6' : transpose(c0, s), s > 0 || i >= 4);
        });
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: o cochilo. A tarde no jardim, a flauta preguiçosa, a bossa vai sumindo
    const sono = (b, c, vel) => {
        bass(bs, b, c, '0:8 5:8', { vel });
        padChord(str, b, c, 16, { low: 57, n: 4, vel });
    };
    bossa(10, 'Gmaj7', false);
    mel(fl, 10, ['B5:6 A5:2 G5:8']);
    sono(11, 'F#m7', 0.8);
    drum(aro, 11, 1, 'x..x..x.........', { pitch: -10, vel: 0.6 });
    drum(sh, 11, 1, 'xoxoxoxo........', { vel: 0.5 });
    mel(fl, 11, ['A5:6 F#5:2 r:8']);
    boc.note(11 * 16 + 8, 0, 0, 1);
    // dormiu: a caixinha canta o tema na metade da velocidade, o shaker respira
    sono(12, 'Em7', 0.6);
    mel(cx, 12, ['D6:2 F#6:2 A6:4 B6:8']);
    drum(sh, 12, 2, 'x.......x.......', { vel: 0.4 });
    sono(13, 'Am7', 0.6);
    mel(cx, 13, ['C7:6 B6:6 G6:4']);
    // a pétala desce devagar...
    sono(14, 'D6', 0.5);
    mel(cx, 14, ['F#6:8 E6:2 D6:2 B5:2 A5:2'], { vel: 0.8 });
    drum(sh, 14, 1, 'x.......x.......', { vel: 0.4 });
    // ...e cai no nariz: a... a... a... ATCHIM! (e silêncio)
    bass(bs, 15, 'D6', '0:4 r:12', { vel: 0.5 });
    mel(fl, 15, ['A5:2 B5:2 C#6:2 r:10'], { vel: 0.8 });
    at.note(15 * 16 + 5, 0, 0, 1);
    cr.note(15 * 16 + 8, 0, 0, 0.6);
    // acorda: "eu cochilei?", a marimba ri, a bossa volta de uma vez
    bossa(16, 'Gmaj7');
    mel(fl, 16, ['r:2 D6:1 E6:1 F#6:4 r:8']);
    mel(mar, 16, ['r:8 B5:1 r:1 B5:1 r:1 G5:4']);
    bossa(17, 'B7');
    mel(mar, 17, ['B4:1 C#5:1 D#5:1 F#5:1 A5:2 B5:2 r:8']);
    mel(fl, 17, ['r:8 F#5:2 A5:2 B5:2 D#6:2']);
    bo.note(17 * 16 + 8, 0, 0, 1);
    drum(aro, 17, 1, '............xxxx', { pitch: -10 });

    // A' um tom acima (Mi mixolídio), com terças; fecha no SOC-CER-MON
    blocoA(18, 2);
    // virada: Lá7, a flauta desce até o Dó# que leva ao Ré do começo
    mel(fl, 26, ['E6:2 C#6:2 A5:2 G5:2 E5:2 C#5:2 A4:2 C#5:2']);
    bossa(26, 'A7');
    bo.note(26 * 16 + 14, 0, 0, 0.9);
    return S;
}
