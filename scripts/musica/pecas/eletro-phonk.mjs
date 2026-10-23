// Drible drift (amostra de phonk brasileiro, 23/10/2026, "só pra ver": não está no jogo).
// Phonk de 140 BPM com cowbell do 808 fazendo a melodia, grave 808 estourado e o coral escuro de Memphis por baixo.
// A história é um drible: o atacante encara (cowbell sozinho, abafado), a batida entra, e na finta a melodia
// começa, para no meio e volta de trás pra frente, a chuteira "derrapa" (skrrt) e o 808 escorrega uma oitava pra
// baixo (o drift). O zagueiro cai: tudo para, um 808 despenca duas oitavas e a torcida faz "óóó". Volta tudo com o
// cowbell dobrado em oitava, chute, rede, e o SOC-CER-MON no cowbell (Dó-Láb-Fá).
// Fá menor (frígio dominante no Dó), 140 BPM. Forma: encara (2) | A (8) | finta (4) | cai (2) | volta (10) | gol (2).
import { abre, boom, cowbell, curva, oito, satura, skrrt } from '../eletro.mjs';
import { bass, drum, I, mel, padChord, Song } from '../synth.mjs';
import { chute, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Drible drift', tela: 'Amostra (phonk), fora do jogo' };

const CIFRA = ['Fm', 'Db', 'Bbm', 'C'];
const SINO = [
    'F5:1 F5:1 r:1 F5:1 Ab5:1 r:1 F5:1 r:1 C6:1 r:1 Bb5:1 Ab5:1 r:1 Gb5:1 F5:2',
    'F5:1 F5:1 r:1 F5:1 Ab5:1 r:1 F5:1 r:1 Db6:1 r:1 C6:1 Bb5:1 r:1 Ab5:1 F5:2',
    'Bb5:1 Bb5:1 r:1 Bb5:1 Db6:1 r:1 Bb5:1 r:1 F6:1 r:1 Eb6:1 Db6:1 r:1 C6:1 Bb5:2',
    'C6:1 C6:1 r:1 C6:1 E6:1 r:1 C6:1 r:1 G6:1 r:1 F6:1 E6:1 r:1 Db6:1 C6:2',
];
// a finta: vai, para no meio, e volta de trás pra frente
const FINTA = 'F5:1 F5:1 r:1 F5:1 Ab5:1 r:1 F5:1 r:1 r:4 F5:1 Ab5:1 F5:1 F5:1';

export default function phonk() {
    const S = new Song({ bpm: 140, bars: 28, swing: 0.03, tail: 3 });
    const cb = S.part('cowbell', cowbell, { pan: 0.1, gain: 0.75, rev: 0.12 });
    const cb2 = S.part('cowbell-8va', cowbell, { pan: -0.3, gain: 0.35, rev: 0.15 });
    const bum = S.part('bumbo', boom({ f0: 160, f1: 45, dec: 0.25, drive: 2.2 }), { drum: true, gain: 0.45 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.2 }), { drum: true, gain: 0.5 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.7 });
    const gr = S.part('808', oito({ dec: 0.55, drive: 2.5 }), { gain: 0.2 });
    const dz = S.part('derrapa', oito({ dec: 0.7, drive: 2.5, cai: 12, tempoCai: 0.45 }), { gain: 0.32 });
    const dz2 = S.part('despenca', oito({ dec: 1.6, drive: 2, cai: 24, tempoCai: 1.6 }), { gain: 0.4, rev: 0.2 });
    const pd = S.part('coral', I.pad, { gain: 0.9, corte: 1400, rev: 0.35 });
    const sk = S.part('skrrt', skrrt, { drum: true, pan: 0.4, gain: 0.45, rev: 0.15 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.6 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.5, rev: 0.2 });
    const tc = S.part('torcida', torcida(3, 0.3, 2), { drum: true, gain: 0.4, rev: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });

    const batida = (b, c, { dobra = false } = {}) => {
        drum(bum, b, 1, 'X.....x...x.....');
        drum(sn, b, 1, '....x.......x...', { vel: 0.8 });
        drum(cl, b, 1, '....x.......x...');
        drum(hh, b, 1, dobra ? 'xxxxxxxxxxxxxxxx' : 'x.x.x.x.x.x.xxxx', { vel: 0.6 });
        bass(gr, b, c, '0:6 0:4 8:6');
    };

    // encara: o cowbell sozinho, abafado, e o coral
    mel(cb, 0, SINO.slice(0, 2));
    padChord(pd, 0, 'Fm', 16, { low: 53, n: 3 });
    padChord(pd, 1, 'Db', 16, { low: 53, n: 3 });

    // A: a batida entra
    for (let i = 0; i < 8; i++) {
        const b = 2 + i;
        batida(b, CIFRA[i % 4]);
        mel(cb, b, [SINO[i % 4]]);
        padChord(pd, b, CIFRA[i % 4], 16, { low: 53, n: 3, vel: 0.8 });
    }
    cr.note(2 * 16, 0, 0, 0.8);

    // a finta: a melodia vai, para e volta; skrrt no meio e o 808 escorrega
    for (let i = 0; i < 4; i++) {
        const b = 10 + i;
        drum(bum, b, 1, 'X.....x.........');
        drum(cl, b, 1, '....x.......x...');
        drum(hh, b, 1, 'x.x.x.x.....x.x.', { vel: 0.6 });
        mel(cb, b, [FINTA], { shift: i === 2 ? 5 : i === 3 ? 7 : 0 });
        sk.note(b * 16 + 8, i, 0, 0.9);
        bass(gr, b, CIFRA[i], '0:6 r:10');
        dz.note(b * 16 + 12, 41 + [0, 0, 5, 7][i], 0, 1);
    }

    // o zagueiro cai: silêncio, o 808 despenca duas oitavas, a torcida "óóó"
    sk.note(14 * 16, -3, 0, 1.2);
    dz2.note(14 * 16 + 1, 48, 0, 1);
    tc.note(14 * 16 + 4, -2, 0, 1);
    mel(cb, 15, ['r:12 C6:1 r:1 C6:1 r:1']);
    drum(bum, 15, 1, '............x.x.');

    // volta: tudo, o cowbell dobrado em oitava, chimbal dobrado
    for (let i = 0; i < 10; i++) {
        const b = 16 + i;
        const c = CIFRA[i % 4];
        batida(b, c, { dobra: i >= 4 });
        mel(cb, b, [SINO[i % 4]]);
        mel(cb2, b, [SINO[i % 4]], { shift: 12 });
        padChord(pd, b, c, 16, { low: 53, n: 3, vel: 0.8 });
        if (i % 4 === 3) sk.note(b * 16 + 14, 2, 0, 0.6);
    }
    cr.note(16 * 16, 0, 0, 1);

    // gol: chute, rede, prato; o cowbell canta o SOC-CER-MON (Dó-Láb-Fá) e o 808 derrapa pro fim
    ch.note(26 * 16, 0, 0, 1);
    rd.note(26 * 16 + 2, 0, 0, 1);
    cr.note(26 * 16 + 2, 0, 0, 1);
    tc.note(26 * 16 + 2, 3, 0, 1);
    mel(cb, 26, ['r:4 C6:3 Ab5:3 F6:6']);
    mel(cb2, 26, ['r:4 C6:3 Ab5:3 F6:6'], { shift: 12 });
    drum(bum, 26, 1, '....X..x..x.....');
    drum(cl, 26, 1, '............X...');
    padChord(pd, 26, 'Fm', 28, { low: 53, n: 3 });
    dz.note(27 * 16, 41, 0, 1);

    abre(
        cb,
        curva(S, [
            [0, 900],
            [1.9, 2500],
            [2, 20000],
        ]),
    );
    satura(gr, 2.5);
    satura(dz, 2.5);
    return S;
}
