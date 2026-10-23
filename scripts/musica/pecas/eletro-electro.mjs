// Placar eletrônico (amostra de electro e breakbeat, 23/10/2026, "só pra ver": não está no jogo).
// Electro de 127 BPM (o Miami bass e o electro-funk dos anos 80 são os avós do funk carioca) que vira breakbeat.
// O placar do estádio liga sozinho: choques (zap) e o arpejo robótico de 16 avos subindo com o filtro. Batida de
// electro com cowbell do 808, baixo de serra saltando oitava e o lead robô. No breque o placar "bate" o break sozinho
// e a música volta quebrada (breakbeat, caixa com fantasmas), com o placar respondendo "GÔL" numa voz de robô. No
// fim as duas batidas juntas, o arpejo uma oitava acima, e o placar desliga.
// Sol menor, 127 BPM. Forma: liga (2) | electro (8) | breque (2) | breakbeat (10) | as duas (2) | desliga (2).
import { abre, boom, cowbell, curva, voz } from '../eletro.mjs';
import { arp, bass, drum, I, mel, padChord, Song } from '../synth.mjs';
import { desliga, PLACAR, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Placar eletrônico', tela: 'Amostra (electro e breakbeat), fora do jogo' };

const CIFRA = ['Gm7', 'Gm7', 'Ebmaj7', 'D7'];
const ROBO = [
    'G5:2 r:2 G5:2 Bb5:2 r:2 A5:2 G5:2 F5:2',
    'G5:4 D5:4 r:8',
    'G5:2 r:2 G5:2 Bb5:2 r:2 C6:2 Bb5:2 G5:2',
    'F#5:4 A5:4 D6:4 r:4',
];

export default function electro() {
    const S = new Song({ bpm: 127, bars: 26, swing: 0.07, tail: 3 });
    const bum = S.part('bumbo', boom({ f0: 140, f1: 48, dec: 0.35, drive: 1.4 }), { drum: true, gain: 0.35 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.55 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.2 }), { drum: true, gain: 0.45 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.9 });
    const oh = S.part('chimbal-ab', I.ohat, { drum: true, pan: -0.3, gain: 0.6 });
    const cb = S.part('cowbell', cowbell, { pan: -0.35, gain: 0.25 });
    const sl = S.part('baixo', I.slap, { gain: 0.32, corte: 2400 });
    const ap = S.part('arpejo', I.thin, { pan: 0.35, gain: 0.5, echo: { rows: 3, fb: 0.3, mix: 0.25 } });
    const ld = S.part('robo', PLACAR, { pan: -0.1, gain: 1.1, corte: 3600, rev: 0.12 });
    const pd = S.part('pad', I.pad, { gain: 0.6, rev: 0.3 });
    const zp = S.part('zap', zap, { drum: true, pan: 0.5, gain: 0.35, rev: 0.2 });
    const g1 = S.part('gol-1', voz({ vogal: 'O', cons: 'm', dur: 0.32 }), {
        pan: -0.15,
        gain: 0.9,
        rev: 0.2,
        echo: { rows: 3, fb: 0.4, mix: 0.3 },
    });
    const g2 = S.part('gol-2', voz({ vogal: 'O', cons: 'm', dur: 0.32 }), { pan: 0.15, gain: 0.7, rev: 0.2 });
    const ds = S.part('desliga', desliga, { drum: true, gain: 0.5, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });

    const electroBeat = (b) => {
        drum(bum, b, 1, 'X......X..X.....');
        drum(cl, b, 1, '....X.......X...');
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.6 });
        for (const r of [2, 5, 10, 13]) cb.note(b * 16 + r, 74, 0, r % 2 ? 0.7 : 1);
    };
    const breakBeat = (b) => {
        drum(bum, b, 1, 'X.X.......X..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(cl, b, 1, '....x.......x...', { vel: 0.7 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x...', { vel: 0.6 });
        drum(oh, b, 1, '..............x.');
    };
    const baixo = (b, c) => bass(sl, b, c, '0:2 0:1 8:1 0:2 0:2 5:2 0:1 8:1 s:2 0:2');
    const harmonia = (b, c, oit = 0) => {
        arp(ap, b, c, { low: 67 + 12 * oit, step: 1, vel: 0.8 });
        if (b % 2 === 0) padChord(pd, b, c, 32, { low: 55, n: 3, vel: 0.7 });
    };
    // o placar fala "GÔL" (Sol e Ré, voz de robô)
    const gol = (b) => {
        g1.note(b * 16 + 12, 43, 0, 1);
        g2.note(b * 16 + 12, 50, 0, 0.9);
    };

    // liga: choques e o arpejo subindo com o filtro
    for (const [b, r, p] of [
        [0, 0, 0],
        [0, 6, 3],
        [0, 12, -2],
        [1, 4, 5],
        [1, 8, 7],
        [1, 12, 12],
    ])
        zp.note(b * 16 + r, p, 0, 0.9);
    harmonia(0, 'Gm7');
    harmonia(1, 'Gm7');

    // electro
    for (let i = 0; i < 8; i++) {
        const b = 2 + i;
        const c = CIFRA[i % 4];
        electroBeat(b);
        baixo(b, c);
        harmonia(b, c);
        if (i >= 4) mel(ld, b, [ROBO[i % 4]]);
    }
    cr.note(2 * 16, 0, 0, 0.8);

    // breque: o break sozinho, os choques respondendo
    breakBeat(10);
    breakBeat(11);
    zp.note(10 * 16 + 14, 7, 0, 0.8);
    zp.note(11 * 16 + 6, 3, 0, 0.8);
    zp.note(11 * 16 + 14, 12, 0, 1);
    gol(11);

    // breakbeat: tudo volta quebrado; o placar diz "GÔL" no fim de cada 2 compassos
    for (let i = 0; i < 10; i++) {
        const b = 12 + i;
        const c = CIFRA[i % 4];
        breakBeat(b);
        baixo(b, c);
        harmonia(b, c);
        mel(ld, b, [ROBO[i % 4]], { shift: i >= 4 ? 12 : 0 });
        if (i % 2) gol(b);
        if (i % 4 === 3) zp.note(b * 16 + 8, 5, 0, 0.7);
    }
    cr.note(12 * 16, 0, 0, 1);

    // as duas batidas juntas, arpejo uma oitava acima
    for (let i = 0; i < 2; i++) {
        const b = 22 + i;
        const c = CIFRA[2 + i];
        electroBeat(b);
        drum(sn, b, 1, '....X..o.o..X..o');
        baixo(b, c);
        harmonia(b, c, 1);
        mel(ld, b, [ROBO[2 + i]], { shift: 12 });
    }
    gol(23);

    // desliga
    bum.note(24 * 16, 0, 0, 1);
    cr.note(24 * 16, 0, 0, 1);
    padChord(pd, 24, 'Gm7', 32, { low: 55, n: 3 });
    bass(sl, 24, 'Gm7', '0:16');
    mel(ld, 24, ['G5:3 D5:3 G6:10']);
    ds.note(24 * 16 + 14, 0, 0, 1);
    zp.note(25 * 16 + 4, -5, 0, 0.7);

    abre(
        ap,
        curva(S, [
            [0, 400],
            [2, 6000],
            [22, 6000],
            [24, 14000],
        ]),
    );
    return S;
}
