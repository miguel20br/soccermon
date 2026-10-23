// Contra-ataque a 174 (amostra de drum and bass, 23/10/2026, "só pra ver": não está no jogo).
// A jogada inteira em 55 s. Defesa: meio-tempo, pad e sino, o time esperando. Roubou a bola: o chute, a caixa
// apertando e a subida. Contra-ataque: o two-step de 174 com o baixo "reese" (duas serras desafinadas) e a tabela
// (notas curtas que pulam da esquerda pra direita: os passes). A finalização: tudo para, a bola sobe (um deslize) e
// a rede. Gol: sobe um tom (Ré menor → Mi menor) e o lead canta o SOC-CER-MON (Si-Sol-Mi) com as palmas
// respondendo. Comemoração: a bateria sai, o pad e os sinos fecham.
// Ré menor → Mi menor, 174 BPM. Forma: defesa (8) | roubou (2) | contra-ataque (16) | chute (2) | gol (8) | festa (4).
import { abre, boom, curva, ruido, satura } from '../eletro.mjs';
import { bass, drum, I, ins, MINOR, mel, padChord, Song, thirdBelow, transpose, voicing } from '../synth.mjs';
import { chute, deslize, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Contra-ataque a 174', tela: 'Amostra (drum and bass), fora do jogo' };

const CIFRA = ['Dm9', 'Dm9', 'Bbmaj7', 'Bbmaj7', 'Gm7', 'Gm7', 'A7', 'A7'];
const LEAD = [
    'D5:2 F5:2 A5:3 G5:1 r:2 F5:2 E5:2 D5:2',
    'E5:3 F5:3 A5:6 r:4',
    'D5:2 F5:2 A5:3 G5:1 r:2 F5:2 D6:2 C6:2',
    'A5:8 r:8',
    'Bb5:2 A5:2 G5:3 F5:1 r:2 G5:2 A5:2 Bb5:2',
    'D6:6 C6:2 Bb5:4 r:4',
    'A5:2 C#6:2 E6:3 D6:1 r:2 C#6:2 Bb5:2 A5:2',
    'A5:4 G5:2 F5:2 E5:4 r:4',
];
const SERRA = ins({ vol: 0.3, a: 0.01, r: 0.1, shape: 2, sv: 0.9, d: 0.1 });

export default function dnb() {
    const S = new Song({ bpm: 174, bars: 40, swing: 0, tail: 3 });
    const bum = S.part('bumbo', boom({ f0: 180, f1: 55, queda: 0.025, dec: 0.15, drive: 1.6 }), {
        drum: true,
        gain: 0.5,
    });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7, rev: 0.1 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 7000, sala: 0.25 }), { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.3, gain: 0.6 });
    const r1 = S.part('reese-1', SERRA, { pan: -0.35, gain: 0.35, corte: 1100 });
    const r2 = S.part('reese-2', SERRA, { pan: 0.35, gain: 0.35, corte: 1100 });
    const sub = S.part('sub', I.counter, { gain: 0.35 });
    const pd = S.part('pad', I.pad, { gain: 0.7, rev: 0.35 });
    const sn2 = S.part('sino', I.bell, { pan: 0.2, gain: 1.6, rev: 0.4, echo: { rows: 3, fb: 0.35, mix: 0.3 } });
    const tbE = S.part('tabela-esq', I.pizz, { pan: -0.8, gain: 0.8, rev: 0.15 });
    const tbD = S.part('tabela-dir', I.pizz, { pan: 0.8, gain: 0.8, rev: 0.15 });
    const ld = S.part('lead', I.pulse, {
        pan: 0.1,
        gain: 0.85,
        corte: 4000,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
        rev: 0.1,
    });
    const ld2 = S.part('lead-2', I.counter, { pan: -0.25, gain: 0.6, rev: 0.1 });
    const pl = S.part('palmas', I.palmas, { drum: true, gain: 0.45, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.7 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.6, rev: 0.2 });
    const bl = S.part('bola-no-ar', deslize(300, 1200, 1.2), { drum: true, gain: 0.35, rev: 0.3 });
    const tc = S.part('torcida', torcida(5, 0.3, 2.5), { drum: true, gain: 0.45, rev: 0.25 });
    const rs = S.part('subida', ruido(2.7), { drum: true, gain: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35 });

    const twoStep = (b, cheio = true) => {
        drum(bum, b, 1, 'X.........X.....');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(cl, b, 1, '....x.......x...');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.xx', { vel: 0.6 });
        if (cheio) drum(sh, b, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.5 });
    };
    const reese = (b, c) => {
        // o reese: as duas serras 0,12 semitom fora uma da outra, pra baixo e pra cima (o batimento é o som)
        bass(r1, b, c, '0:6 0:2 r:2 8:2 0:4', { oct: 11.88 });
        bass(r2, b, c, '0:6 0:2 r:2 8:2 0:4', { oct: 12.12 });
        bass(sub, b, c, '0:6 0:2 r:2 0:2 0:4');
    };
    // os passes: notas curtas do acorde, uma de cada lado
    const tabela = (b, c, vel = 1) => {
        const v = voicing(c, 62, 4);
        [0, 2, 1, 3, 2, 0, 3, 1].forEach((k, i) => {
            (i % 2 ? tbD : tbE).note(b * 16 + i * 2, v[k], 1, vel * (i % 2 ? 0.85 : 1));
        });
    };

    // defesa: meio-tempo, pad e sino
    for (let i = 0; i < 8; i++) {
        const b = i;
        const c = CIFRA[i];
        drum(bum, b, 1, 'X.........x.....', { vel: 0.8 });
        drum(sn, b, 1, '........x.......', { vel: 0.6 });
        if (i >= 4) drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
        if (i % 2 === 0) padChord(pd, b, c, 32, { low: 53, n: 4 });
        bass(sub, b, c, '0:16', { vel: 0.8 });
    }
    mel(sn2, 0, ['A5:4 F5:2 E5:2 D5:8', 'r:16', 'F5:4 D5:2 C5:2 A4:8', 'r:16']);
    mel(sn2, 4, ['G5:4 F5:2 D5:2 Bb4:8', 'r:16', 'E5:4 G5:2 Bb5:2 A5:8', 'r:16']);

    // roubou a bola: chute, caixa apertando, subida
    ch.note(8 * 16, 0, 0, 1);
    cr.note(8 * 16, 0, 0, 0.7);
    drum(sn, 8, 1, 'x...x...x...x...', { vel: 0.6 });
    drum(sn, 9, 1, 'x.x.x.x.xxxxXXX.', { vel: 0.8 });
    rs.note(8 * 16 + 4, 0, 0, 1);
    padChord(pd, 8, 'A7', 32, { low: 53, n: 4 });
    bass(sub, 8, 'A7', '0:16');
    bass(sub, 9, 'A7', '0:14 r:2');

    // contra-ataque: duas voltas de 8; na 2ª o lead ganha a terça e a tabela fica mais forte
    for (let k = 0; k < 2; k++)
        for (let i = 0; i < 8; i++) {
            const b = 10 + 8 * k + i;
            const c = CIFRA[i];
            twoStep(b, k === 1 || i >= 4);
            reese(b, c);
            tabela(b, c, k ? 1 : 0.7);
            if (i % 2 === 0) padChord(pd, b, c, 32, { low: 53, n: 4, vel: 0.6 });
            mel(ld, b, [LEAD[i]]);
            if (k) mel(ld2, b, [LEAD[i]], { harm: thirdBelow(MINOR(2)), vel: 0.8 });
        }
    cr.note(10 * 16, 0, 0, 1);
    cr.note(18 * 16, 0, 0, 0.8);

    // o chute: tudo para, só a tabela desacelerando e a subida; a bola sobe, silêncio, rede
    tbE.note(26 * 16, 62, 2, 1);
    tbD.note(26 * 16 + 4, 65, 2, 0.9);
    tbE.note(26 * 16 + 10, 69, 2, 0.8);
    const rs2 = S.part('subida-2', ruido(2.6), { drum: true, gain: 0.3 });
    rs2.note(26 * 16, 0, 0, 1);
    padChord(pd, 26, 'A7', 16, { low: 53, n: 4 });
    ch.note(27 * 16, 0, 0, 1.2);
    bl.note(27 * 16 + 1, 0, 0, 1);

    // gol! um tom acima; o lead canta o SOC-CER-MON e as palmas respondem
    rd.note(28 * 16, 0, 0, 1);
    cr.note(28 * 16, 0, 0, 1);
    tc.note(28 * 16, 0, 0, 1);
    for (let i = 0; i < 8; i++) {
        const b = 28 + i;
        const c = transpose(CIFRA[i], 2);
        twoStep(b);
        reese(b, c);
        tabela(b, c, 0.8);
        if (i % 2 === 0) {
            padChord(pd, b, c, 32, { low: 55, n: 4, vel: 0.7 });
            mel(ld, b, ['B5:3 G5:3 E6:6 r:4']);
            mel(ld2, b, ['G5:3 E5:3 B5:6 r:4']);
            drum(pl, b, 1, '............x.x.');
        } else mel(ld, b, [i === 7 ? 'B5:4 A5:2 G5:2 F#5:4 r:4' : 'r:4 D6:2 E6:2 G6:4 E6:4']);
    }

    // festa: a bateria sai, pad e sinos fecham com o gancho devagar
    padChord(pd, 36, 'Em9', 64, { low: 52, n: 5 });
    bass(sub, 36, 'Em9', '0:16');
    bass(sub, 37, 'Em9', '0:16', { vel: 0.7 });
    mel(sn2, 36, ['B5:6 G5:6 r:4', 'E6:16', 'r:16', 'r:16']);
    tc.note(36 * 16, 2, 0, 0.7);
    cr.note(36 * 16, 0, 0, 0.6);

    abre(
        rs,
        curva(S, [
            [8.25, 300],
            [10, 11000],
        ]),
    );
    abre(
        rs2,
        curva(S, [
            [26, 400],
            [27, 9000],
        ]),
    );
    satura(r1, 1.5);
    satura(r2, 1.5);
    return S;
}
