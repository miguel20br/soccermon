// Tema do Giovanni (líderes de Kanto): o último ginásio, Viridian, fechado o jogo inteiro; o líder é o chefe da
// Equipe Rocket. Fá# menor, 100 BPM, meio-tempo pesado (caixa no 3), metais graves, tuba, órgão de igreja e cordas.
// Sério, não trapalhão: o Tema da Rocket é a turma; este é o chefe.
// MOTIVO (2 compassos, F#m | C#7): marcha pontuada que sobe uma quinta e desce o acorde da dominante (com o Lá, a
// 13ª menor). O órgão responde com o motivo e um escorregão cromático (Dó#, Dó, Si, Lá): as mesmas notas que descem
// no motivo da Rocket, disfarçadas. Quem conhece a Rocket desconfia. No fim de cada resposta, o TREMOR (ele é do tipo
// terra): tímpano rolando e o chão roncando.
// B, a história do ginásio: o chão de SETAS que gira e empurra (o "ziiip", a assinatura). A melodia dá dois passos e
// é jogada pra cima, para (tum), dá mais dois e é jogada pra baixo, depois rodopia... e para na frente dele. Silêncio.
// A cadeira gira (rangido). A REVELAÇÃO: o órgão toca o motivo da Rocket na metade da velocidade, em Fá# menor, com o
// trio de acordes da Rocket e o clap molhado dela. É ele.
// A' meio tom acima (Sol menor): o motivo do Giovanni nos metais e o da Rocket no órgão AO MESMO TEMPO, o chefe e a
// turma juntos (a recompensa), terças, e o SOC-CER-MON nos metais graves com o clap da Rocket ainda mais grave.
// Forma: intro (2): a porta que ficou fechada o jogo todo | A (8) | B: as setas e a revelação (8) | A' (8) meio tom
// acima | virada (1): Dó#7(♭9) com o trio. Loop do compasso 2 ao fim (~60 s). MOTIVO pra uma futura Partida.
import { bass, drum, GANCHO, I, MINOR, mel, padChord, Song, SR, stabs, thirdBelow, transpose } from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';
import { MOTIVO as ROCKET } from './tema-rocket.mjs';

export const meta = { titulo: 'Tema do Giovanni', tela: 'Líder de ginásio: Giovanni (Viridian)' };

export const MOTIVO = {
    mel: ['F#4:3 F#4:1 C#5:6 B4:2 A4:2 G#4:2', 'A4:3 G#4:1 E#4:4 C#4:8'],
    acordes: ['F#m', 'C#7'],
};

const TAU = Math.PI * 2;
/** O piso de setas girando: "ziiip" que sobe com a catraca (assinatura do Giovanni). */
export const seta = som(
    0.6,
    (p, r) => {
        let ph = 0;
        return (t) => {
            const x = Math.min(1, t / 0.5);
            ph += (TAU * k12(p) * (300 + 900 * x)) / SR;
            const tri = 1 - 4 * Math.abs(Math.round(ph / TAU) - ph / TAU);
            const catraca = Math.sin(TAU * (25 + 60 * x) * t) > 0.9 ? r() * 2 - 1 : 0;
            return (
                (0.6 * tri + 0.5 * catraca) * Math.min(1, t / 0.01) * (t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.1))
            );
        };
    },
    { pk: 0.4, corte: 5000 },
);
/** O chão roncando (tipo terra): ruído bem grave que vem e vai. */
export const tremor = som(
    1.6,
    (_p, r) => {
        let a = 0;
        return (t) => {
            a += 0.008 * (r() * 2 - 1 - a);
            return a * Math.min(1, t / 0.3) * Math.min(1, (1.6 - t) / 0.6) * (0.6 + 0.4 * Math.sin(TAU * 9 * t));
        };
    },
    { pk: 0.5 },
);
/** Rangido: a porta velha (e a cadeira do chefe girando). */
export const rangido = som(
    1.4,
    (p) => {
        let ph = 0;
        return (t) => {
            const f = (95 + 40 * Math.sin(TAU * 0.6 * t) + 12 * Math.sin(TAU * 7.3 * t)) * k12(p);
            ph += (TAU * f) / SR;
            const serra = ((ph / TAU) % 1) * 2 - 1;
            return serra * Math.min(1, t / 0.1) * Math.min(1, (1.4 - t) / 0.2) * (0.6 + 0.4 * Math.sin(TAU * 17 * t));
        };
    },
    { pk: 0.3, corte: 1800 },
);

export default function temaGiovanni() {
    const S = new Song({ bpm: 100, bars: 27, swing: 0.04, tail: 4, loopFrom: 2 });
    const tb = S.part('metais', I.brass, { pan: -0.1, gain: 1.2, rev: 0.2, corte: 2800 });
    const harm = S.part('terças', I.brass, { pan: 0.3, gain: 0.55, rev: 0.2, corte: 2500 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.45, rev: 0.1 });
    const org = S.part('orgao', I.organ, { pan: 0.2, gain: 1.1, rev: 0.35 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const trio = S.part('trio', I.stab, { pan: 0.1, gain: 1.2, rev: 0.2, corte: 3000 });
    const bs = S.part('baixo', I.bass, { gain: 0.5 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.9 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8, rev: 0.2 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const timp = S.part('timpano', I.timp, { drum: true, gain: 0.18, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.5 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.55, tom: -2 }), {
        drum: true,
        gain: 1.3,
        rev: 0.25,
    });
    const st = S.part('setas', seta, { drum: true, pan: 0.3, gain: 0.6, rev: 0.2 });
    const tr = S.part('tremor', tremor, { drum: true, gain: 0.9 });
    const rg = S.part('rangido', rangido, { drum: true, pan: -0.3, gain: 0.6, rev: 0.3 });

    const TRIO = [
        [8, 1],
        [10, 1],
        [12, 2],
    ];
    const pesado = (b, c, cheio = true) => {
        bass(bs, b, c, '0:3 0:1 r:4 0:2 r:2 l:2 c:2');
        padChord(str, b, c, 16, { low: 54, n: 4, vel: 0.7 });
        drum(k, b, 1, cheio ? 'X..x....X.x.....' : 'X.........x.....');
        drum(sn, b, 1, '........X.......');
        drum(hh, b, 1, cheio ? 'x.xxx.xxx.xxx.xx' : 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        drum(timp, b, 1, 'X...............', { pitch: -9 });
    };
    const terremoto = (b, row = 8) => {
        tr.note(b * 16 + row, 0, 0, 1);
        drum(timp, b, 1, `${'.'.repeat(row)}${'XxXxXxXX'.slice(0, 16 - row)}`, { pitch: -9, vel: 0.8 });
    };

    // intro: a porta que ficou fechada o jogo todo range e bate; passos pesados até o centro
    rg.note(0, 0, 0, 1);
    padChord(org, 0, 'F#m', 16, { low: 54, n: 4, vel: 0.7 });
    drum(k, 0, 1, '............X...');
    drum(timp, 0, 1, '............X...', { pitch: -9 });
    drum(k, 1, 1, 'X...X...X...X...', { vel: 0.8 });
    bass(tuba, 1, 'C#7', '0:4 0:4 0:4 0:4');
    stabs(trio, 1, 'C#7b9', TRIO, { low: 59, n: 4 });

    const CH = ['F#m', 'C#7', 'F#m', 'Bm', 'D', 'Bm', 'G', 'C#7b9'];
    const TB = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'D5:3 D5:1 A5:6 G5:2 F#5:2 E5:2',
        'D5:3 C#5:1 B4:4 F#4:8',
        'r:16',
        'G#4:3 B4:1 D5:4 E#5:4 C#5:4',
    ];
    // o órgão responde com o motivo e escorrega cromático (Dó#, Dó, Si, Lá): a pista da Rocket
    const ORG = [
        'r:16',
        'r:16',
        'r:2 F#5:1 F#5:1 C#6:4 C6:2 B5:2 A5:4',
        'B5:3 A5:1 F#5:4 D5:8',
        'r:16',
        'r:16',
        'r:2 B5:1 B5:1 D6:4 C#6:2 C6:2 B5:4',
        'r:16',
    ];
    const blocoA = (b0, s) => {
        mel(tb, b0, s ? TB.slice(0, 7) : TB, { shift: s });
        mel(tuba, b0, s ? TB.slice(0, 7) : TB, { shift: s - 12, vel: 0.7 });
        if (s) {
            // o chefe e a turma: o motivo da Rocket no órgão por cima do motivo dele
            mel(org, b0, ROCKET.mel, { shift: 6 + s });
            mel(org, b0 + 2, ORG.slice(2, 7), { shift: s });
            mel(harm, b0, TB.slice(0, 7), { shift: s, harm: thirdBelow(MINOR(6 + s)) });
            // SOC-CER-MON nos metais graves, o clap da Rocket responde
            mel(tb, b0 + 7, [GANCHO.em({ menor: true, tom: 7, oitava: -1 })]);
            mel(tuba, b0 + 7, [GANCHO.em({ menor: true, tom: 7, oitava: -2 })]);
            drum(cl, b0 + 7, 1, GANCHO.palmas, { vel: 1.2 });
        } else mel(org, b0, ORG);
        CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'Gm' : s && i === 1 ? 'D7b9' : transpose(c0, s);
            pesado(b0 + i, c, s > 0 || i >= 4);
            if (i === 3 || i === 7) stabs(trio, b0 + i, c, TRIO, { low: 59, n: 4, vel: 0.8 });
        });
        terremoto(b0 + 3);
        if (!s) terremoto(b0 + 7, 10);
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: o chão de setas. Dois passos, ZIIIP pra cima; tum. Dois passos, ZIIIP pra baixo; tum. Rodopia...
    const passo = (b, c) => {
        bass(bs, b, c, '0:4 r:12', { vel: 0.8 });
        padChord(str, b, c, 16, { low: 54, n: 4, vel: 0.5 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
    };
    passo(10, 'Bm');
    drum(k, 10, 1, 'X...X...........');
    mel(tb, 10, ['B3:2 r:2 D4:2 r:10']);
    st.note(10 * 16 + 8, 0, 0, 1);
    mel(org, 10, ['r:8 B4:1 D5:1 F#5:1 B5:1 D6:1 F#6:1 B6:1 D7:1']);
    passo(11, 'C#7');
    drum(k, 11, 1, 'X...X...........');
    drum(timp, 11, 1, 'X...............', { pitch: -9 });
    mel(tb, 11, ['r:2 C#4:2 r:2 E#4:2 r:8']);
    st.note(11 * 16 + 8, -3, 0, 1);
    mel(org, 11, ['r:8 B6:1 G#6:1 E#6:1 C#6:1 B5:1 G#5:1 E#5:1 C#5:1']);
    passo(12, 'D');
    drum(k, 12, 1, 'X...............');
    drum(timp, 12, 1, 'X...............', { pitch: -9 });
    mel(tb, 12, ['r:2 D4:2 r:12']);
    st.note(12 * 16 + 4, 3, 0, 1);
    st.note(12 * 16 + 10, 5, 0, 1);
    mel(org, 12, ['r:4 A4:1 D5:1 F#5:1 A5:1 D6:1 F#6:1 r:2 F#6:1 D6:1 A5:1 F#5:1']);
    // para na frente dele. Silêncio. A cadeira gira
    drum(k, 13, 1, 'X...............');
    drum(timp, 13, 1, 'X...............', { pitch: -9 });
    bass(bs, 13, 'F#m', '0:2 r:14');
    rg.note(13 * 16 + 6, 3, 0, 0.9);

    // A REVELAÇÃO: o motivo da Rocket na metade da velocidade, em Fá# menor, com o trio e o clap da Rocket
    const REVELA = [
        ['F#m', 'C#5:2 r:2 F#5:2 r:2 A5:4 C6:2 C#6:2'],
        ['F#m', 'C#6:4 r:4 C6:2 B5:2 A5:4'],
        ['C#7b9', 'F#5:4 A5:2 D6:6 C#6:4'],
        ['D7b9', 'r:4 F#5:4 A5:4 C6:4'],
    ];
    REVELA.forEach(([c, m], i) => {
        const b = 14 + i;
        mel(org, b, [m]);
        padChord(str, b, c, 16, { low: 54, n: 4, vel: 0.8 });
        bass(tuba, b, c, '0:16', { vel: 0.8 });
        bass(bs, b, c, '0:8 0:4 l:4');
        drum(k, b, 1, 'X.........x.....');
        drum(cl, b, 1, '........X.......');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
        if (i % 2) stabs(trio, b, c, TRIO, { low: 59, n: 4 });
    });
    drum(cr, 14, 1, 'X...............');
    drum(timp, 14, 1, 'X...............', { pitch: -9 });
    drum(sn, 17, 1, '........xxXxXXXX', { vel: 0.8 });

    // A' meio tom acima (Sol menor): o chefe e a turma juntos; fecha no SOC-CER-MON
    blocoA(18, 1);
    // virada: Dó#7(♭9) com o trio, de volta pro Fá# menor
    mel(tb, 26, [TB[7]]);
    pesado(26, 'C#7b9');
    stabs(trio, 26, 'C#7b9', [[0, 1], [2, 1], [4, 2], ...TRIO], { low: 59, n: 4 });
    drum(sn, 26, 1, '........xxXxXXXX');
    terremoto(26, 10);
    return S;
}
