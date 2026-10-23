// Tamborzão do apito (amostra de eletrofunk, 23/10/2026, "só pra ver": não está no jogo).
// Funk carioca de 130 BPM no tamborzão: bumbo 808, atabaque grave e agudo, palma no contratempo. A ideia: o 3-3-2
// do tamborzão é o mesmo ritmo do SOC-CER-MON. O juiz apita o gancho (Si-Sol-Mi, 3-3-2) e o baile começa; o stab de
// orquestra (o "pá!" do Miami bass, avô do funk) bate no 3-3-2 e responde o lead. No breque só o apito e a torcida;
// a queda vem em Mi menor harmônico (B7), sobe meio tom pra Fá menor e termina no SOC-CER-MON com o apito longo.
// Mi menor → Fá menor, 130 BPM. Forma: apito (2) | A (8) | breque (2) | queda (8) | virada (2) | queda +1 (8) | fim (2).

import { abre, atabaque, boom, curva, oito, orquestra, ruido } from '../eletro.mjs';
import { bass, chord, drum, I, ins, MINOR, mel, Song, thirdBelow, transpose } from '../synth.mjs';
import { apito, fi, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tamborzão do apito', tela: 'Amostra (eletrofunk), fora do jogo' };

const SERRA = ins({ vol: 0.3, a: 0.004, r: 0.07, shape: 2, sv: 0.7, d: 0.08 });

export default function tamborzao() {
    const S = new Song({ bpm: 130, bars: 32, swing: 0.05, tail: 2.5 });
    const bum = S.part('bumbo', boom({ f0: 140, f1: 50, dec: 0.28, drive: 1.8 }), { drum: true, gain: 0.5 });
    const atG = S.part('atabaque-gr', atabaque(150, 0.13), { drum: true, pan: -0.3, gain: 0.5 });
    const atA = S.part('atabaque-ag', atabaque(240, 0.08), { drum: true, pan: 0.3, gain: 0.4 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.25 }), { drum: true, gain: 0.55 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.4, gain: 0.5 });
    const gr = S.part('808', oito({ dec: 0.32, drive: 1.6 }), { gain: 0.36 });
    const oq = S.part('orquestra', orquestra, { pan: -0.1, gain: 0.8, rev: 0.18 });
    const ld = S.part('lead', SERRA, { pan: 0.1, gain: 1.1, corte: 3800, echo: { rows: 3, fb: 0.3, mix: 0.2 } });
    const ld2 = S.part('lead-2', SERRA, { pan: -0.35, gain: 0.5, corte: 3200 });
    const ap = S.part('apito', apito(0.11), { drum: true, pan: 0.2, gain: 0.4, rev: 0.25 });
    const apL = S.part('apito-longo', apito(0.42), { drum: true, pan: 0.2, gain: 0.4, rev: 0.3 });
    const pl = S.part('palmas', I.palmas, { drum: true, gain: 0.45, rev: 0.2 });
    const tc = S.part('torcida', torcida(3.6, 1.2, 1), { drum: true, gain: 0.35, rev: 0.2 });
    const rs = S.part('subida', ruido(3.6), { drum: true, gain: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.4, rev: 0.2 });

    // o tamborzão: bumbo e grave no 3-3-2, atabaques conversando, palma no 2 e no 4
    const tambor = (b, c, { cheio = true } = {}) => {
        drum(bum, b, 1, 'X..x..x.....x...');
        bass(gr, b, c, '0:3 0:3 8:6 5:4');
        drum(atG, b, 1, '..x.....x.x..x..');
        drum(atA, b, 1, '....x..x..x...xo');
        if (cheio) {
            drum(cl, b, 1, '....x.......x...');
            drum(sh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.7 });
        }
    };
    // o stab no 3-3-2 (pergunta) ou respondendo no fim do compasso
    const pa = (b, c, rows, vel = 1) => {
        for (const r of rows) oq.note(b * 16 + r, 52 + ((chord(c).root + 8) % 12), 1, vel);
    };

    // apito: o juiz chama o gancho (Si-Sol-Mi em 3-3-2); na 2ª vez a torcida responde
    fi(ap, 0, [
        [0, 'B6'],
        [3, 'G6'],
    ]);
    fi(apL, 0, [[6, 'E7']]);
    fi(ap, 1, [
        [0, 'B6'],
        [3, 'G6'],
    ]);
    fi(apL, 1, [[6, 'E7']]);
    drum(pl, 1, 1, '............x.x.');
    drum(atG, 1, 1, '........x.x.xxxx', { vel: 0.8 });

    // A: o baile, o stab no 3-3-2; o lead entra no 6 e o stab responde
    const A = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'D'];
    A.forEach((c, i) => {
        tambor(2 + i, c, { cheio: i > 0 });
        if (i < 4) pa(2 + i, c, [0, 3, 6], 0.9);
    });
    cr.note(2 * 16, 0, 0, 0.8);
    mel(ld, 6, [
        'E5:2 r:1 E5:1 G5:2 B5:2 r:2 A5:1 G5:1 F#5:2 E5:2',
        'r:16',
        'E5:2 r:1 E5:1 G5:2 C6:2 r:2 B5:1 A5:1 G5:2 E5:2',
        'r:10 D5:2 E5:2 F#5:2',
    ]);
    pa(7, 'Em', [0, 3, 6, 10, 12]);
    pa(9, 'D', [0, 3, 6]);
    fi(ap, 9, [
        [12, 'B6'],
        [14, 'B6'],
    ]);

    // breque: só o apito e a torcida; a subida e o atabaque enchem
    fi(ap, 10, [
        [0, 'B6'],
        [3, 'G6'],
    ]);
    fi(apL, 10, [[6, 'E7']]);
    drum(pl, 10, 1, '............X.X.');
    tc.note(10 * 16, 0, 0, 1);
    fi(ap, 11, [
        [0, 'B6'],
        [2, 'B6'],
        [4, 'G6'],
        [6, 'G6'],
        [8, 'E7'],
        [10, 'E7'],
        [12, 'E7'],
        [13, 'E7'],
        [14, 'E7'],
        [15, 'E7'],
    ]);
    rs.note(10 * 16, 0, 0, 1);
    drum(atG, 11, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.9 });

    // a queda: lead em 3-3-2, o stab dobra no compasso par e responde no ímpar; harmônico no B7
    const QUEDA = [
        'B5:3 B5:3 E6:2 r:2 D6:2 B5:2 G5:2',
        'A5:2 G5:2 F#5:2 G5:2 E5:4 r:4',
        'C6:3 C6:3 E6:2 r:2 D6:2 C6:2 B5:2',
        'A5:2 B5:2 C6:2 B5:2 G5:4 r:4',
        'A5:3 A5:3 C6:2 r:2 E6:2 D6:2 C6:2',
        'B5:2 C6:2 B5:2 A5:2 G5:4 r:4',
        'D#6:3 D#6:3 F#6:2 r:2 E6:2 D#6:2 B5:2',
        'C6:2 B5:2 A5:2 F#5:2 D#5:4 r:4',
    ];
    const Q = ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'B7', 'B7'];
    const queda = (b0, tom) => {
        mel(ld, b0, QUEDA, { shift: tom });
        mel(ld2, b0, QUEDA, { shift: tom, harm: thirdBelow(MINOR(4 + tom)), vel: tom ? 1 : 0.6 });
        Q.forEach((c, i) => {
            const cc = transpose(c, tom);
            tambor(b0 + i, cc);
            pa(b0 + i, cc, i % 2 ? [12, 14] : [0, 3, 6], i % 2 ? 0.8 : 1);
            if (i % 2) fi(ap, b0 + i, [[14, 'B6', 0.6]]);
        });
        cr.note(b0 * 16, 0, 0, 1);
    };
    queda(12, 0);

    // virada: B7 empurra, depois Dó (o V de Fá menor) com o atabaque rufando e o apito trinando
    tambor(20, 'B7');
    pa(20, 'B7', [0, 3, 6, 10, 13]);
    pa(21, 'C', [0, 3, 6, 8, 10, 12, 13, 14, 15], 0.85);
    drum(atG, 21, 1, 'x.x.x.x.xxxxXXXX');
    drum(atA, 21, 1, '.x.x.x.x.x.x.x.x', { vel: 0.7 });
    fi(ap, 21, [
        [12, 'C7'],
        [13, 'C7'],
        [14, 'C7'],
        [15, 'C7'],
    ]);
    const rs2 = S.part('subida-2', ruido(1.85), { drum: true, gain: 0.3 });
    rs2.note(21 * 16, 0, 0, 1);

    queda(22, 1);
    tc.note(28 * 16, 0, 0, 0.8);

    // fim: o SOC-CER-MON em Fá menor (Dó-Láb-Fá) no lead, no stab e no apito; a torcida responde; rede e apito longo
    mel(ld, 30, ['C6:3 Ab5:3 F6:10', 'r:16']);
    mel(ld2, 30, ['Ab5:3 F5:3 C6:10', 'r:16']);
    pa(30, 'Fm', [0, 3, 6]);
    fi(ap, 30, [
        [0, 'C7'],
        [3, 'Ab6'],
    ]);
    fi(apL, 30, [[6, 'F7']]);
    drum(bum, 30, 1, 'X..x..x.........');
    drum(atG, 30, 1, '..x.....x.x.xxxx');
    drum(pl, 30, 1, '............X.X.');
    pa(31, 'Fm', [0], 1.1);
    drum(bum, 31, 1, 'X...............');
    cr.note(31 * 16, 0, 0, 1);
    rd.note(31 * 16, 0, 0, 0.8);
    fi(apL, 31, [[2, 'F7', 0.8]]);

    abre(
        rs,
        curva(S, [
            [10, 300],
            [12, 9000],
        ]),
    );
    abre(
        rs2,
        curva(S, [
            [21, 500],
            [22, 12000],
        ]),
    );
    return S;
}
