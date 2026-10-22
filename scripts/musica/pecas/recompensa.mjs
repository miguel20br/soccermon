// Recompensa (rodada 8): escolher o prêmio depois da partida. Loop curto e animado, primo do Draft: a mesma melodia
// do A e as três cartas, agora a 124 BPM, com pulso no lead, sino respondendo e groove funk cheio.
// No B, o SOC-CER-MON sobe em sequência (Fá, Sol, Lá, como na Abertura com gancho) com o clap 808 respondendo.
// Fá maior. Forma: intro (1): o baralho embaralha e as três cartas | A (8) | B (8). Loop do compasso 1 ao fim (~31 s).
import { bass, drum, GANCHO, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';
import { FLIP } from './draft.mjs';

export const meta = { titulo: 'Recompensa', tela: 'Recompensa' };

export default function recompensa() {
    const S = new Song({ bpm: 124, bars: 17, swing: 0.1, tail: 3, loopFrom: 1 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.1, echo: { rows: 3, fb: 0.25, mix: 0.2 }, rev: 0.12 });
    const harm = S.part('terças', I.thin, { pan: 0.35, gain: 0.5 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 2.6, rev: 0.25 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.15 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const ch = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.8 });
    const cartas = [-0.6, 0, 0.6].map((pan, i) => [
        S.part(`carta${i + 1}`, I.bell, { pan, gain: 2, rev: 0.3 }),
        S.part(`flip${i + 1}`, FLIP, { drum: true, pan, gain: 1.6 }),
    ]);
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.85 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 }), { drum: true, gain: 1.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.2 });
    const sl = S.part('brilho', I.sleigh, { drum: true, pan: -0.4, gain: 2.5 });
    const cr = S.part('crash', I.crash, { drum: true });

    const virar = (b, notas) =>
        notas.forEach((n, i) => {
            const r = [8, 11, 14][i];
            mel(cartas[i][0], b, [`r:${r} ${n}:2 r:${14 - r}`]);
            drum(cartas[i][1], b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    const BASS = '0:1 r:1 8:1 r:1 0:2 5:1 r:1 0:1 r:1 s:1 8:1 r:2 5:1 3:1';
    const A_CH = ['Fmaj7', 'Am7', 'Bbmaj7', 'C7sus4', 'Fmaj7', 'Am7', 'Gm7', 'C7sus4'];
    const B_CH = ['Dm7', 'Bbmaj7', 'Gm7', 'C7sus4', 'Fmaj7', 'Gm7', 'Am7', 'C7sus4'];
    const A = [
        'A5:3 G5:3 E5:2 r:8',
        'r:16',
        'D6:3 C6:3 A5:2 r:4 F5:2 G5:2',
        'A5:6 G5:2 r:8',
        'A5:3 G5:3 E5:2 r:4 C5:2 E5:2',
        'G5:8 r:8',
        'Bb5:3 A5:3 F5:2 D5:2 F5:2 G5:2 A5:2',
        'G5:12 r:4',
    ];
    const A_SINO = [
        'r:16',
        'r:2 E6:2 G6:2 C7:4 B6:2 A6:4',
        'r:16',
        'r:8 Bb5:2 C6:2 F6:4',
        'r:16',
        'r:8 E6:2 G6:2 C7:4',
    ];
    const gancho = [0, 1, 2].map((grau) => GANCHO.em({ tom: 5, oitava: -1, grau }));
    const B = ['F5:4 A5:4 C6:6 r:2', 'D6:4 C6:4 A5:8', 'Bb5:4 D6:4 F6:6 r:2', 'G5:4 Bb5:4 C6:8', ...gancho, 'r:16'];

    // intro: embaralha e vira as três cartas
    drum(cartas[1][1], 0, 1, 'x.x.x.x.........');
    drum(sl, 0, 1, 'x.x.x.x.xxxxxxxx');
    virar(0, ['C6', 'D6', 'F6']);
    stabs(ep, 0, 'C7sus4', [[8, 8]], { low: 57, n: 4, vel: 0.7 });

    mel(lead, 1, [...A, ...B]);
    mel(sino, 1, A_SINO);
    mel(harm, 13, gancho, { harm: thirdBelow(MAJOR(5)) });
    [...A_CH, ...B_CH].forEach((c, i) => {
        const b = 1 + i;
        drum(k, b, 1, 'X.....x.X.x.....');
        drum(cl, b, 1, i >= 12 && i < 15 ? '....x.......x.x.' : '....x.......x...');
        drum(hh, b, 1, 'xoxoxoxoxoxoxoxo');
        drum(sl, b, 1, '..x...x...x...x.');
        bass(bs, b, c, BASS);
        stabs(ch, b, c, [2, 6, 9, 14], { low: 60, n: 3 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 4],
            ],
            { low: 57, n: 4, vel: 0.7 },
        );
    });
    virar(8, ['C6', 'D6', 'F6']);
    virar(16, ['C6', 'D6', 'F6']);
    drum(cr, 1, 1, 'X...............');
    drum(cr, 9, 1, 'X...............');
    return S;
}
