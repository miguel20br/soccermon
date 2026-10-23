// A festa atrás da porta (amostra de house, 23/10/2026, "só pra ver": não está no jogo).
// House de 124 BPM contado pelo filtro: a festa do vestiário (o time ganhou) começa abafada, ouvida do corredor, só o
// bumbo e o grave passando pela parede. Alguém gira a maçaneta, a porta abre e o filtro escancara: piano de house no
// contratempo, tudo bombeando no bumbo, e o lead pergunta enquanto a voz picotada responde ("ah! ê! ah!"). No
// meio, a pausa (sem bumbo, cordas), a subida, a volta meio tom acima; no fim a porta fecha de novo e o clique da
// maçaneta encerra.
// Lá menor → Si♭ menor, 124 BPM. Forma: corredor (8) | porta aberta (8) | pausa (4) | subida (2) | +½ tom (8) | porta fecha (2).
import { abre, bombeia, boom, curva, ruido, voz } from '../eletro.mjs';
import { bass, drum, I, layer, MINOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'A festa atrás da porta', tela: 'Amostra (house), fora do jogo' };

const CIFRA = ['Am9', 'Fmaj7', 'Cmaj7', 'G6'];
const HOOK = [
    'r:2 E5:2 r:2 E5:1 D5:1 E5:2 G5:2 E5:2 D5:2',
    'C5:6 A4:2 r:8',
    'r:2 E5:2 r:2 E5:1 D5:1 E5:2 G5:2 B5:2 A5:2',
    'G5:6 E5:2 r:8',
];

export default function house() {
    const S = new Song({ bpm: 124, bars: 32, swing: 0.06, tail: 3 });
    const semBumbo = (t) => {
        const b = S.barAt(t);
        return b >= 16 && b < 20;
    };
    const pump = bombeia(124, 0.4, 0.6);
    const bombeado = (t) => (semBumbo(t) ? 1 : pump(t));

    const bum = S.part('bumbo', boom({ f0: 125, f1: 48, queda: 0.03, dec: 0.17, drive: 1.3 }), {
        drum: true,
        gain: 0.55,
    });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 7000, sala: 0.3 }), {
        drum: true,
        gain: 0.45,
        rev: 0.1,
    });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const oh = S.part('chimbal-ab', I.ohat, { drum: true, pan: -0.25, gain: 0.7 });
    const gr = S.part('grave', I.bass, { gain: 0.35, gainAt: bombeado });
    const pn = S.part('piano', I.epiano, { pan: -0.15, gain: 0.55, rev: 0.15, gainAt: bombeado });
    const pd = S.part('pad', I.pad, { pan: 0.1, gain: 0.8, rev: 0.3, gainAt: bombeado });
    const cd = S.part('cordas', I.strings, { pan: 0.25, gain: 0.7, rev: 0.3, gainAt: layer(S, 16, 30) });
    const ld = S.part('lead', I.pulse, {
        pan: 0.15,
        gain: 0.75,
        corte: 3400,
        echo: { rows: 3, fb: 0.35, mix: 0.3 },
        rev: 0.15,
    });
    const ld2 = S.part('lead-2', I.counter, { pan: -0.3, gain: 0.55, rev: 0.15 });
    const ah = S.part('voz-ah', voz({ vogal: 'a', dur: 0.14 }), {
        pan: -0.2,
        gain: 0.7,
        rev: 0.25,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
    });
    const ee = S.part('voz-e', voz({ vogal: 'e', dur: 0.14 }), {
        pan: 0.2,
        gain: 0.7,
        rev: 0.25,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
    });
    const tc = S.part('festa', torcida(2.5, 0.05, 2), { drum: true, gain: 0.3 });
    const rs = S.part('subida', ruido(3.9), { drum: true, gain: 0.25 });
    const mc = S.part('macaneta', I.block, { drum: true, pan: 0.5, gain: 0.8 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });

    const kick = (b) => drum(bum, b, 1, 'X...x...x...x...');
    const piano = (b, c, vel = 1) =>
        stabs(
            pn,
            b,
            c,
            [
                [2, 2],
                [6, 1],
                [8, 2],
                [11, 2],
                [14, 2],
            ],
            { low: 55, n: 4, vel },
        );
    const grave = (b, c) => bass(gr, b, c, 'r:2 0:2 r:2 0:2 r:2 8:2 r:2 5:2');
    const chimbal = (b) => {
        drum(hh, b, 1, 'x.xox.xox.xox.xo', { vel: 0.6 });
        drum(oh, b, 1, '..x...x...x...x.');
    };
    // a voz picotada responde nos compassos 2 e 4 do gancho
    const responde = (b, tom, alto) => {
        const k = alto ? 7 : 0;
        ah.note(b * 16 + 10, 64 + tom + k, 0, 0.9);
        ee.note(b * 16 + 12, 62 + tom + k, 0, 0.8);
        ah.note(b * 16 + 14, 60 + tom + k, 0, 0.9);
    };
    const groove = (b0, n, tom, { hook = true, hats = true, chops = true } = {}) => {
        for (let i = 0; i < n; i++) {
            const b = b0 + i;
            const c = transpose(CIFRA[i % 4], tom);
            kick(b);
            drum(cl, b, 1, '....x.......x...');
            grave(b, c);
            piano(b, c);
            if (hats) chimbal(b);
            if (hook) mel(ld, b, [HOOK[i % 4]], { shift: tom });
            if (chops && i % 2) responde(b, tom, i % 4 === 3);
        }
    };

    // corredor: a festa abafada (o filtro faz a parede)
    groove(0, 4, 0, { hook: false, hats: false, chops: false });
    groove(4, 4, 0, { chops: false });
    // a maçaneta gira e a porta abre
    mc.note(7 * 16 + 8, -14, 0, 1);
    mc.note(7 * 16 + 9, -10, 0, 0.8);
    tc.note(7 * 16 + 12, 0, 0, 0.8);
    // porta aberta
    groove(8, 8, 0);
    cr.note(8 * 16, 0, 0, 1);

    // pausa: sem bumbo, o pad e as cordas seguram, o piano canta o gancho
    for (let i = 0; i < 4; i++) {
        const b = 16 + i;
        const c = CIFRA[i];
        padChord(pd, b, c, 16, { low: 52, n: 4, vel: 0.9 });
        padChord(cd, b, c, 16, { low: 64, n: 3, vel: 0.8 });
        bass(gr, b, c, '0:16', { vel: 0.7 });
        mel(ld2, b, [HOOK[i]]);
        if (i % 2) responde(b, 0, i === 3);
    }
    // subida: palmas que apertam, ruído abrindo, o gancho pegando impulso
    padChord(pd, 20, 'Fmaj7', 32, { low: 52, n: 4 });
    drum(cl, 20, 1, 'x...x...x...x...', { vel: 0.7 });
    drum(cl, 21, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    bass(gr, 20, 'F', '0:16', { vel: 0.7 });
    bass(gr, 21, 'G', '0:4 0:4 0:4 0:2 0:2');
    rs.note(20 * 16, 0, 0, 1);
    mel(ld, 21, ['r:8 E5:2 F5:2 F#5:2 G5:2']);

    // +½ tom: tudo, cordas e a segunda voz em terças
    groove(22, 8, 1);
    for (let i = 0; i < 8; i++) {
        padChord(cd, 22 + i, transpose(CIFRA[i % 4], 1), 16, { low: 65, n: 3, vel: 0.7 });
        mel(ld2, 22 + i, [HOOK[i % 4]], { shift: 1, harm: thirdBelow(MINOR(10)), vel: 0.8 });
    }
    cr.note(22 * 16, 0, 0, 1);

    // a porta fecha: o groove continua do outro lado, cada vez mais longe, e a maçaneta clica
    groove(30, 2, 1, { chops: false });
    mc.note(31 * 16 + 12, -14, 0, 1);

    const porta = curva(S, [
        [0, 380],
        [7.5, 700],
        [8, 19000],
        [30, 19000],
        [31.75, 260],
    ]);
    for (const P of [bum, cl, hh, oh, gr, pn, pd, cd, ld, ld2, ah, ee]) abre(P, porta);
    abre(
        rs,
        curva(S, [
            [20, 300],
            [22, 12000],
        ]),
    );
    return S;
}
