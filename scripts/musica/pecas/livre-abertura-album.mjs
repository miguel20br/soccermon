// Acendam as luzes (categoria livre): a faixa 1 do álbum da trilha. O ginásio escuro acorda: quatro bancos de luz
// acendem um por um e o zumbido de cada um é uma nota (Dó, Mi, Sol, Dó: o acorde se monta sozinho), uma bola
// esquecida quica, a sirene do placar testa, o juiz apita. O SOC-CER-MON entra devagar nos metais com as palmas
// respondendo, sobe um grau, e o funk da casa arranca: o lead pergunta, os metais respondem. Virada, sobe um tom (Ré)
// pro SOC-CER-MON inteiro com a torcida, acorde final... e a última bola rola embora quicando.
// Dó maior → Ré maior. 90 BPM na abertura, 118 no funk. Jingle de ~50 s, sem loop.
// Forma: luzes (2) | placar e apito (2) | gancho lento (2) | funk (8): pergunta e resposta | gancho em Ré (2) |
// acorde e a bola (2).
import { bass, drum, GANCHO, I, mel, midi, padChord, Song, stabs } from '../synth.mjs';
import { apito, fi, luz, PLACAR, quicaAteParar, quique, tenis, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Acendam as luzes', tela: 'Álbum: faixa de abertura', lufs: -15 };

export default function acendamAsLuzes() {
    const BPM = [90, 90, 90, 90, 90, 100];
    const S = new Song({ bpm: 90, bars: 18, swing: 0.1, tail: 4, bpmAt: (b) => BPM[b] ?? 118 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.3, corte: 3800, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.6 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.9, corte: 3000, rev: 0.25 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 1.6, rev: 0.45 });
    const str = S.part('cordas', I.strings, { gain: 1, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const ch = S.part('guitarra', I.chank, { pan: -0.35, gain: 2.2 });
    const pl = S.part('placar', PLACAR, { pan: -0.2, gain: 0.8, corte: 1600, rev: 0.3 });
    const lz = S.part('luz', luz, { drum: true, gain: 1.1, rev: 0.4 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.35, gain: 0.7, rev: 0.4 });
    const tn = S.part('tenis', tenis, { drum: true, pan: -0.4, gain: 0.5, rev: 0.3 });
    const ap = S.part('apito', apito(1.1), { drum: true, gain: 0.7, rev: 0.4 });
    const apC = S.part('apitoCurto', apito(0.08), { drum: true, gain: 0.8, rev: 0.3 });
    const tc = S.part('torcida', torcida(5, 1.5), { drum: true, gain: 0.5, rev: 0.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.4 }), {
        drum: true,
        gain: 1.2,
        rev: 0.3,
    });
    const cl2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.5, atraso: 0.012, tom: -1 }), {
        drum: true,
        pan: 0.4,
        gain: 1,
        rev: 0.3,
    });
    const cr = S.part('crash', I.crash, { drum: true, gain: 0.7 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.35 });

    // luzes: quatro bancos acendem, cada zumbido uma nota do acorde de Dó; o sino marca e as cordas seguram
    const BANCOS = [
        [0, 0, 3, 'C5', 'C3'],
        [0, 8, 7, 'E5', 'E3'],
        [1, 0, 10, 'G5', 'G3'],
        [1, 8, 15, 'C6', 'C4'],
    ];
    for (const [b, r, p, n, c] of BANCOS) {
        lz.note(b * 16 + r, p, 0, 1);
        mel(sino, b, [`${r ? `r:${r} ` : ''}${n}:${16 - r}`], { vel: 0.8 });
        str.note(b * 16 + r, midi(c), 64 - (b * 16 + r), 0.7);
    }
    quicaAteParar(qq, 4, { primeiro: 6, n: 7, vel: 0.5 });
    // a sirene do placar testa duas vezes, os tênis no aquecimento, e o apito
    stabs(
        pl,
        2,
        'C',
        [
            [0, 3],
            [6, 6],
        ],
        { low: 55, n: 4, vel: 0.9 },
    );
    drum(tn, 2, 1, '.........x..x.x.', { vel: 0.7 });
    drum(tn, 2, 1, '..........x....x', { pitch: 4, vel: 0.6 });
    ap.note(3 * 16, 0, 0, 1);
    // gancho lento nos metais, palmas respondem; depois um grau acima, com a caixa chamando
    mel(met, 4, [GANCHO.em({ oitava: -1 })]);
    drum(cl, 4, 1, GANCHO.palmas);
    padChord(str, 4, 'C', 16, { low: 52, n: 4, vel: 0.8 });
    mel(met, 5, [GANCHO.em({ oitava: -1, grau: 1 })]);
    drum(cl, 5, 1, GANCHO.palmas);
    padChord(str, 5, 'Dm7', 16, { low: 52, n: 4, vel: 0.8 });
    drum(sn, 5, 1, '........xxxxXXXX', { vel: 0.8 });
    tc.note(4 * 16 + 8, 0, 0, 1);
    tp.note(5 * 16 + 12, 0, 0, 0.6);

    // o funk da casa: o lead pergunta, os metais respondem
    const CH = ['C', 'Am7', 'Fmaj7', 'G7', 'C', 'Am7', 'Dm7', 'G7'];
    const LEAD = [
        'G5:3 E5:3 C6:2 r:2 B5:2 C6:2 D6:2',
        'E6:4 r:12',
        'A5:3 F5:3 C6:2 r:2 B5:2 A5:2 G5:2',
        'D6:4 r:12',
        'G5:3 E5:3 C6:2 r:2 E6:2 F6:2 G6:2',
        'A6:6 G6:2 E6:4 C6:4',
        'D6:3 F6:3 A6:2 r:2 G6:2 F6:2 E6:2',
        'D6:4 B5:4 G5:4 r:4',
    ];
    const MET = [
        'r:16',
        'r:4 A4:2 C5:2 E5:2 G5:4 r:2',
        'r:16',
        'r:4 G4:2 B4:2 D5:2 F5:4 r:2',
        'r:16',
        'r:16',
        'r:16',
        'r:12 G4:1 A4:1 B4:2',
    ];
    mel(lead, 6, LEAD);
    mel(harm, 10, LEAD.slice(4), { shift: -12, vel: 0.8 });
    mel(met, 6, MET);
    CH.forEach((c, i) => {
        const b = 6 + i;
        bass(bs, b, c, '0:2 8:1~ r:1 5:2 0:2 r:2 s:2 8:2 5:2');
        stabs(ch, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        drum(k, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x');
        if (i >= 4) padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.7 });
    });
    drum(cr, 6, 1, 'X...............');
    drum(sn, 13, 1, '........xxXxXXXX', { vel: 0.9 });

    // sobe um tom: o SOC-CER-MON inteiro em Ré, com a torcida e as palmas dobradas; acorde final
    mel(lead, 14, [GANCHO.em({ tom: 2 }), 'G6:4 F#6:4 E6:4 A6:4']);
    mel(met, 14, [GANCHO.em({ tom: 2, oitava: -1 }), 'B4:4 A4:4 G4:4 C#5:4']);
    drum(cl, 14, 1, GANCHO.palmas);
    drum(cl2, 14, 1, GANCHO.palmas);
    tc.note(14 * 16, 0, 0, 1.2);
    for (const [b, c] of [
        [14, 'D'],
        [15, 'A7'],
    ]) {
        bass(bs, b, c, '0:2 8:1~ r:1 5:2 0:2 r:2 s:2 8:2 5:2');
        drum(k, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x');
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.8 });
    }
    drum(cr, 14, 1, 'X...............');
    drum(sn, 15, 1, '............xxXX');
    mel(lead, 16, ['D6:16']);
    mel(harm, 16, ['F#5:16']);
    mel(met, 16, ['A4+D5+F#5:16']);
    padChord(str, 16, 'D', 32, { low: 50, n: 5, vel: 0.9 });
    bass(bs, 16, 'D', '0:16');
    drum(cr, 16, 1, 'X...............');
    drum(tp, 16, 1, 'X...............');
    sino.note(16 * 16, 86, 16, 0.9);
    fi(apC, 16, [
        [10, 'D7', 0.6],
        [12, 'D7', 0.6],
    ]);
    // e a última bola rola embora
    quicaAteParar(qq, 17 * 16, { primeiro: 4, n: 9, vel: 0.6, encolhe: 0.8 });
    return S;
}
