// Animatic C, "Álbum da turma" (vídeo do modo novo Rota de baby, 23/10/2026). Esboço de 20 s, cortado na batida.
// A história: fotos polaroid do time bebê no começo da Rota; cada foto vira e mostra a evolução; a última é a foto da
// turma evoluída com o troféu. Uma caixinha de música toca o tema sozinha e, a cada foto que vira, a banda ganha um
// naipe, até a valsa inteira. A caixinha nunca sai: ela é o álbum.
// Fá maior → Sol maior (turma evoluída) → Lá♭ maior (tela final), valsa 3/4 a 120 BPM (1 compasso = 1,5 s); o
// último compasso desacelera pra 90 BPM (a corda da caixinha acabando).
// c.0–2 caixinha sozinha, um clique de polaroid por foto (o motor cuspindo a foto no c.0) e o Magikarp "flop flop"
// no c.2 | c.3 a 1ª foto vira (Charizard): virada de carta, tímpano e entra a tuba com o "pá-pá" | c.4 a 2ª vira
// (Gyarados): entra a bateria, Ré7 leva pro Sol | c.5–6 a turma evoluída: clique, prato, sobe 1 tom, os metais
// tocam o tema e o SOC-CER-MON em valsa com palmas | c.7–10 explicação: a caixinha lidera, a banda embaixo; Mi♭7
// leva pro Lá♭ | c.11 tela final: SOC-CER-MON com tudo e o último clique | c.12 Lá♭ final, a caixinha desacelerando.
// Assinatura: o clique e o motor de uma Polaroid 1200i de verdade ("WWS Polaroid1200iTakingapicture", Work With
// Sounds / Wikimedia Commons, CC BY 4.0; amostras polaroid-clique.wav e polaroid-saida.wav) e a virada de carta do
// Draft (FLIP).
import { amostra, drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { FLIP } from './draft.mjs';
import { quique } from './livre-ginasio.mjs';

export const meta = { titulo: 'Animatic C: Álbum da turma', tela: 'Vídeo da Rota de baby (conceito C)', lufs: -14 };

// caixinha de música: senoide com ataque seco e rabo longo, e a lâmina (2 oitavas acima, um pouco desafinada)
const CAIXINHA = ins({ vol: 0.26, a: 0.001, r: 0.8, shape: 0, sv: 0.12, d: 0.06 });
const LAMINA = ins({ vol: 0.06, a: 0.001, r: 0.25, shape: 0, sv: 0.04, d: 0.03 });

export default function album() {
    const BAR = 1.5;
    const S = new Song({
        bpm: 120,
        bars: 13,
        barLen: 12,
        tail: 2.5,
        bpmAt: (b) => (b >= 12 ? 90 : 120),
        // caixinha sozinha no começo é baixinha: sobe o geral; a explicação fica embaixo do texto
        masterAt: (t) => {
            const b = t / BAR;
            if (b < 3) return 1.05;
            if (b >= 7 && b < 11) return 0.95;
            return 1;
        },
    });
    const cx = S.part('caixinha', CAIXINHA, { pan: 0.1, gain: 2.4, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.3 });
    const lam = S.part('lamina', LAMINA, { pan: 0.1, gain: 1.6, rev: 0.3 });
    const cxE = S.part('caixinha-esq', CAIXINHA, { pan: -0.15, gain: 1.2, rev: 0.3 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.5 });
    const pah = S.part('pah', I.stab, { pan: 0.25, gain: 0.9, corte: 2500 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.35 });
    const metais = S.part('metais', I.brass, { pan: 0.2, gain: 0.6, rev: 0.25 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.5 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.6 });
    const pal = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.4 }), { drum: true, gain: 0.9 });
    const clique = S.part('clique', amostra('polaroid-clique.wav'), { drum: true, pan: -0.1, gain: 1.3, rev: 0.1 });
    const motor = S.part('motor', amostra('polaroid-saida.wav'), { drum: true, pan: -0.1, gain: 1.4 });
    const vira = S.part('vira', FLIP, { drum: true, pan: 0.2, gain: 1.8 });
    const flop = S.part('flop', quique, { drum: true, pan: 0.3, gain: 0.6, rev: 0.2 });

    const caixinha = (b, s, o = {}) => {
        mel(cx, b, s, o);
        mel(lam, b, s, { ...o, shift: (o.shift ?? 0) + 24.1, vel: (o.vel ?? 1) * 0.8 });
    };
    // valsa da caixinha: baixo no 1, terça e quinta no 2 e no 3
    const valsaCx = (b, baixo, par) => mel(cxE, b, [`${baixo}:4 ${par}:4 ${par}:4`]);
    // valsa da banda: tuba no 1, "pá-pá" no 2 e no 3
    const valsaBanda = (b, sym, raiz) => {
        mel(tuba, b, [`${raiz}:4 r:8`]);
        stabs(pah, b, sym, [4, 8], { low: 55, n: 3, len: 2 });
    };

    // c.0–2 a caixinha sozinha; um clique por foto (o motor cospe a primeira)
    const TEMA = ['A5:4 C6:2 F6:4 E6:2', 'D6:4 C6:2 A5:6', 'Bb5:4 D6:2 G6:4 F6:2', 'E6:4 D6:2 C6:6'];
    caixinha(0, TEMA.slice(0, 3));
    valsaCx(0, 'F4', 'A4+C5');
    valsaCx(1, 'D4', 'F4+A4');
    valsaCx(2, 'Bb3', 'D4+F4');
    for (const b of [0, 1, 2]) clique.note(b * 12, 0, 0, b ? 0.8 : 1);
    motor.note(1, 0, 0, 1);
    // o Magikarp na foto: flop, flop
    flop.note(2 * 12 + 6, 14, 0, 0.6);
    flop.note(2 * 12 + 9, 12, 0, 0.45);

    // c.3 a foto do Charmander vira (Charizard): virada, tímpano, entra a tuba
    caixinha(3, [TEMA[3]]);
    valsaCx(3, 'C4', 'Bb4+E5');
    vira.note(3 * 12, 0, 0, 1);
    vira.note(3 * 12 + 1, 4, 0, 0.7);
    tp.note(3 * 12, 0, 0, 1);
    valsaBanda(3, 'C7', 'C2');

    // c.4 a do Magikarp vira (Gyarados): entra a bateria; Ré7 no 3º tempo leva pro Sol
    caixinha(4, ['A5:4 C6:2 F6:4 F#6:2']);
    mel(cxE, 4, ['F4:4 A4+C5:4 F#4+C5:4']);
    vira.note(4 * 12, 0, 0, 1);
    vira.note(4 * 12 + 1, 4, 0, 0.7);
    mel(tuba, 4, ['F2:4 r:4 D2:4']);
    stabs(pah, 4, 'F', [4], { low: 55, n: 3, len: 2 });
    stabs(pah, 4, 'D7', [8], { low: 54, n: 3, len: 2 });
    drum(k, 4, 1, 'X...........');
    drum(hh, 4, 1, '....x...x...');
    drum(sn, 4, 1, '........xxXX');
    tp.note(4 * 12, -5, 0, 0.8);

    // c.5–6 a turma evoluída com o troféu: clique, prato, Sol maior; os metais tocam o tema e o SOC-CER-MON em valsa
    clique.note(5 * 12, 0, 0, 1);
    drum(cr, 5, 1, 'X...........');
    const TEMA_G = ['B5:4 D6:2 G6:4 F#6:2', GANCHO.em({ tom: 7, ritmo: [3, 3, 6, 0] })];
    caixinha(5, TEMA_G);
    mel(metais, 5, TEMA_G, { shift: -12 });
    valsaBanda(5, 'G', 'G2');
    valsaBanda(6, 'G', 'G2');
    padChord(str, 5, 'G', 12, { low: 59, n: 4 });
    padChord(str, 6, 'C', 6, { low: 60, n: 4 });
    padChord(str, 6, 'G', 6, { low: 59, n: 4, at: 6 });
    drum(k, 5, 2, 'X...........');
    drum(hh, 5, 2, '....x...x...');
    drum(pal, 6, 1, '........x.x.');
    drum(cr, 6, 1, 'X...........', { vel: 0.5 });

    // c.7–10 explicação: a caixinha lidera o tema em Sol, a banda embaixo; Mi♭7 no fim leva pro Lá♭
    const EXP = [
        ['G', 'G2', 'B5:4 D6:2 G6:4 F#6:2', 'G4', 'B4+D5'],
        ['Em', 'E2', 'E6:4 D6:2 B5:6', 'E4', 'G4+B4'],
        ['C', 'C2', 'C6:4 E6:2 A6:4 G6:2', 'C4', 'E4+G4'],
        ['D7', 'D2', 'F#6:4 E6:2 D6:4 Eb6:2', 'D4', 'C5+F#4'],
    ];
    EXP.forEach(([sym, raiz, m, bx, par], i) => {
        const b = 7 + i;
        caixinha(b, [m]);
        valsaCx(b, bx, par);
        valsaBanda(b, sym, raiz);
        padChord(str, b, sym, 12, { low: 57, n: 4, vel: 0.75 });
        drum(k, b, 1, 'X...........');
        drum(hh, b, 1, '....x...x...');
    });
    stabs(metais, 10, 'Eb7', [8], { low: 55, n: 4, len: 4 });
    drum(sn, 10, 1, '........xxXX');

    // c.11 tela final: Lá♭, SOC-CER-MON com tudo, palmas e o último clique
    const gAb = GANCHO.em({ tom: 8, ritmo: [3, 3, 6, 0] });
    caixinha(11, [gAb]);
    mel(metais, 11, [gAb], { shift: -12 });
    clique.note(11 * 12, 0, 0, 1);
    drum(cr, 11, 1, 'X...........');
    valsaBanda(11, 'Ab', 'Ab2');
    padChord(str, 11, 'Ab', 12, { low: 60, n: 4 });
    drum(k, 11, 1, 'X...........');
    drum(pal, 11, 1, '........x.x.');

    // c.12 Lá♭ final; a caixinha sobe o arpejo devagar (a corda acabando)
    caixinha(12, ['Ab5:3 C6:3 Eb6:3 Ab6:3']);
    stabs(metais, 12, 'Ab', [0], { low: 56, n: 4, len: 12, vel: 0.7 });
    padChord(str, 12, 'Ab', 12, { low: 56, n: 4 });
    mel(tuba, 12, ['Ab1:12'], { vel: 0.6 });
    tp.note(12 * 12, -4, 0, 0.7);
    return S;
}
