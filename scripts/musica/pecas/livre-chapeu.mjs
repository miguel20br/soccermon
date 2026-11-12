// Lance da semana nº 1: o chapéu do Mew que vira gol (clipe de 9,5 s, no molde da livre-ditto: funk animado, o motivo
// do protagonista e um som de assinatura). Começa no lance, sem abertura. O motivo do Mew é uma pergunta que sobe
// ("mew?") na voz flutuante; a assinatura é o apito de êmbolo subindo com a bola por cima do Ponyta e o BOING dela
// caindo do outro lado; o "hã?" do Ponyta. O chute, a virada de caixa e o GOL no 1 do compasso 2, meio tom acima
// (Sol → Lá♭), com a torcida. Na tela final o SOC-CER-MON com as palmas e o fim no BOING pequeno.
// Tempos do vídeo (s): bola sobe 0,75 · cai 1,25 · chute 2,75 · gol 4,0 · corte pro Mew comemorando 5,33 ·
// tela final 7,0 · fim 9,5. 120 BPM, 4/4, compasso = 2 s (linha = 0,125 s), 5 compassos.
import { flutua, kazoo, mola, sobe } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'O chapéu chegou', tela: 'Lance da semana nº 1 (clipe)' };

/** O motivo do Mew: a pergunta que sobe e para lá em cima. */
const MOTIVO = 'D5:1 G5:1 B5:1 D6:3 r:10';

export default function chapeu() {
    const S = new Song({ bpm: 120, bars: 5, swing: 0.1, tail: 1.5 });
    const fl = S.part('flutua', flutua, { pan: -0.05, gain: 1, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const kz = S.part('kazoo', kazoo, { pan: 0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const sb = S.part('sobe', sobe(0.5), { drum: true, pan: -0.1, gain: 1.4, rev: 0.2 });
    const bo = S.part('boing', mola(), { pan: 0.1, gain: 1.2, rev: 0.2 });
    const boP = S.part('boingPequeno', mola({ seg: 0.35, balanco: 18 }), { pan: 0.2, gain: 1.5, rev: 0.2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.8, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.32, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.8, rev: 0.3 });
    const festa = S.part('festa', torcida(3.5, 0.08, 2), { drum: true, gain: 0.6, rev: 0.3 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.32 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });

    /** O funk da casa (`s` = semitons acima). */
    const groove = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x');
        bass(bs, b, c, '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2');
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };

    // 0 · já no lance: o groove no 1º quadro e o Mew pergunta; a bola sobe por cima do Ponyta (o apito subindo), cai do
    // outro lado (BOING) e o Ponyta fica "hã?" (kazoo subindo)
    drum(cr, 0, 1, 'x...............', { vel: 0.6 });
    groove(0, 'G7');
    mel(fl, 0, [MOTIVO]);
    sb.note(6, 0, 0, 1);
    bo.note(10, 4, 0, 1.1);
    mel(kz, 0, ['r:12 D5:1 F5:3'], { vel: 0.8 });
    // 1 · o Mew sai na frente: os metais respondem o motivo; o chute na linha 6 (2,75 s) e a virada até o gol
    groove(1, 'C9');
    mel(met2, 1, ['D5:1 G5:1 B5:1 D6:2 r:11'], { harm: thirdBelow(MAJOR(7)), vel: 0.7 });
    ch.note(16 + 6, 0, 0, 1.1);
    drum(sn, 1, 1, '........x.x.xxxx', { vel: 0.6 });
    drum(tp, 1, 1, '........x...x.xX', { vel: 0.7 });
    padChord(cor, 1, 'D7', 8, { low: 55, n: 4, vel: 0.5, at: 8 });

    // 2 · GOL no 1 (4,0 s): prato, rede, torcida e tudo meio tom acima (Lá♭); o motivo inteiro nos metais. O corte pro
    // Mew comemorando (5,33 s) ganha o BOING pequeno
    const ab = MAJOR(8);
    drum(cr, 2, 1, 'X...............');
    rd.note(32, 0, 0, 1);
    festa.note(32, 0, 0, 1);
    groove(2, 'G7', 1);
    stabs(met, 2, 'Ab', [0], { low: 56, n: 4, len: 3 });
    mel(fl, 2, ['r:4 D5:1 G5:1 B5:1 D6:3 B5:1 D6:5'], { shift: 1 });
    mel(met, 2, ['r:4 D5:1 G5:1 B5:1 D6:3 B5:1 D6:5'], { shift: 1 - 12, harm: thirdBelow(ab), vel: 0.6 });
    boP.note(32 + 11, 13, 0, 0.9);
    padChord(cor, 2, 'Ab', 16, { low: 56, n: 4, vel: 0.55 });
    drum(cl, 2, 1, '....X.......X...', { vel: 0.7 });
    // 3 · a comemoração; na tela final (linha 8, 7,0 s) o SOC-CER-MON em Lá♭ com as palmas
    groove(3, 'C9', 1);
    mel(fl, 3, [`r:8 ${GANCHO.em({ tom: 1, ritmo: [3, 3, 2, 0] })}`]);
    mel(met, 3, [`r:8 ${GANCHO.em({ tom: 1, oitava: -1, ritmo: [3, 3, 2, 0] })}`], {
        harm: thirdBelow(ab),
        vel: 0.7,
    });
    drum(cl, 3, 1, '........X..X..X.', { vel: 0.9 });
    padChord(cor, 3, 'Db', 16, { low: 56, n: 4, vel: 0.5 });
    // 4 · o acorde final (8,0 s) e o fim no BOING pequeno
    stabs(met, 4, 'Ab', [0], { low: 56, n: 4, len: 4 });
    mel(bs, 4, ['Ab2:2 r:6 Ab1:4 r:4']);
    drum(kk, 4, 1, 'X.......X.......');
    drum(cr, 4, 1, 'x...............', { vel: 0.6 });
    boP.note(64 + 8, 13, 0, 1);
    return S;
}
