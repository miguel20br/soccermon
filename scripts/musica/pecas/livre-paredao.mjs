// Confessionário, EP 1 "Paredão" (14 compassos, 28 s; roteiro em trailer/curtas/confessionario-paredao/ROTEIRO.md).
// No molde da livre-ditto: funk animado, cada som uma piada que se vê. A série é paródia de reality: o TUM-TUM de
// eliminação (tímpano e bumbo graves, dois golpes) abre e fecha o episódio, o pulso tenso em Ré menor embaixo do
// paredão, e o funk da casa nas cabines. Cada candidato tem o seu som: o plof e o apito do Magikarp (o sino quando a
// medalha enche a lente), os cliques e zaps do Pikachu (o último estoura: chiado de TV), o Snorlax só com o ronco. Na
// virada o rufo cresce, breque, o grilo e o "psy?" do Psyduck de verdade; o BOING do Ditto (EP 3) desfaz o disfarce e o
// TUM-TUM manda ele pro banco. Tela final: o motivo do Ditto no kazoo, SOC-CER-MON na piscada e o fim num BOING
// pequeno (ele vira um Snorlax pequenininho pra dormir junto).
// 120 BPM, 4/4, swing 0,12, compasso = 2 s. Ré menor (0–10) → Sol (11–13).
import { aparece, kazoo, mola, sobe as chiado, splash } from '../curtas.mjs';
import { amostra, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { MOTIVO } from './livre-ditto.mjs';
import { bzzt, ronco, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Paredão', tela: 'Confessionário (EP 1)' };

export default function paredao() {
    const S = new Song({ bpm: 120, bars: 14, swing: 0.12, tail: 2 });
    const kz = S.part('kazoo', kazoo, { pan: -0.05, gain: 1, corte: 3200, rev: 0.18, echo: { rows: 3, fb: 0.2, mix: 0.12 } });
    const bo = S.part('boing', mola(), { pan: 0.1, gain: 1.2, rev: 0.2 });
    const boP = S.part('boingPequeno', mola({ seg: 0.35, balanco: 18 }), { pan: 0.2, gain: 1.5, rev: 0.2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1.1, rev: 0.2 });
    const sino = S.part('sino', I.bell, { pan: 0.15, gain: 1.8, echo: { rows: 4, fb: 0.35, mix: 0.35 }, rev: 0.45 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.9, rev: 0.35 });
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.4 });
    const bs = S.part('baixo', I.slap, { gain: 0.5, corte: 2500 });
    const pulso = S.part('pulso', I.bass, { gain: 0.55 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6 });
    const fag = S.part('fagote', I.bassoon, { gain: 0.6, rev: 0.2 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const spl = S.part('plof', splash, { pan: 0.25, gain: 1.1, rev: 0.2 });
    const ap = S.part('apito', I.whistle, { pan: 0.2, gain: 0.9 });
    const pop = S.part('pop', aparece, { drum: true, pan: 0.1, gain: 0.8 });
    const zz = S.part('ronco', ronco, { drum: true, pan: 0.05, gain: 0.6, rev: 0.15 });
    const zp = S.part('zap', zap, { drum: true, pan: 0.2, gain: 0.7 });
    const bz = S.part('bzzt', bzzt, { drum: true, pan: -0.1, gain: 0.8 });
    const tv = S.part('chiado', chiado(0.6), { drum: true, gain: 0.5 });
    const clique = S.part('clique', amostra('foto-clique.wav'), { drum: true, gain: 0.9, rev: 0.1 });
    const grilo = S.part('grilo', amostra('grilo.wav'), { drum: true, pan: 0.2, gain: 0.45, rev: 0.3 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 0.8, rev: 0.15 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.32 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.35 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });

    /** O TUM-TUM do reality (dois golpes graves). */
    const tumtum = (b, r1, r2) => {
        for (const r of [r1, r2]) {
            tp.note(b * 16 + r, -5, 0, 1.2);
            kk.note(b * 16 + r, -4, 0, 1.1);
        }
    };
    /** O pulso tenso (Ré menor): colcheias no grave e as cordas segurando. */
    const tenso = (b, acorde = 'Dm', { vel = 1 } = {}) => {
        mel(pulso, b, ['D2:1 r:1 D2:1 r:1 D2:1 r:1 D2:1 r:1 D2:1 r:1 D2:1 r:1 F2:1 r:1 E2:1 r:1'], { vel: 0.8 * vel });
        padChord(cor, b, acorde, 16, { low: 50, n: 4, vel: 0.5 * vel });
        drum(hh, b, 1, '..x...x...x...x.', { vel: 0.5 * vel });
    };
    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    /** O funk da casa em Ré. */
    const groove = (b, c, { leve = false } = {}) => {
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };

    // 0 · ABERTURA: a luz acende e a placa CONFESSIONÁRIO carimba (TUM, 0); a fita DIA 1 (4); EPISÓDIO 1 · PAREDÃO (8, TUM)
    tumtum(0, 0, 8);
    drum(cr, 0, 1, 'X.......x.......', { vel: 0.7 });
    padChord(pad, 0, 'Dm', 16, { low: 50, n: 4, vel: 0.6 });
    sino.note(4, 74, 2, 0.6);
    mel(met, 0, ['r:8 D4+F4+A4:4! r:4'], { vel: 0.8 });
    // 1 · O PAREDÃO: as três cartas caem (0, 4, 8: tum), o "Psyduck" aparece (10, pop) e pergunta
    tenso(1);
    for (const r of [0, 4, 8]) tp.note(16 + r, -5 + r / 4, 0, 1);
    pop.note(16 + 10, 4, 0, 0.8);
    mel(kz, 1, ['r:10 D5:1 r:1 D6:2 C6:1 A5:1'], { vel: 0.6 });
    // 2 · CABINE · MAGIKARP: o funk entra; ele pula na poltrona (0, plof) e fala (4)
    groove(2, 'Dm7');
    drum(cr, 2, 1, 'X...............', { vel: 0.6 });
    mel(spl, 2, ['D6:1 r:1 A5:1 r:13'], { vel: 0.8 });
    mel(met2, 2, ['r:4 A4:2 D5:2 r:8'], { vel: 0.7 });
    // 3 · a medalha enche a lente: os metais sobem (0–7), o sino no brilho (8), o apito (12)
    groove(3, 'G9');
    mel(met, 3, ['D4:1 E4:1 F4:1 G4:1 A4:1 Bb4:1 B4:1 C5:1 D5:4! r:4'], { vel: 0.8 });
    sino.note(3 * 16 + 8, 86, 4, 0.9);
    ap.note(3 * 16 + 12, 84, 2, 0.9);
    ap.note(3 * 16 + 14, 84, 2, 0.9);
    // 4 · CABINE · PIKACHU: uma pose por tempo (0, 4, 8, 12): clique e o zapzinho; o pícolo responde
    groove(4, 'Dm7');
    for (const r of [0, 4, 8, 12]) {
        clique.note(4 * 16 + r, 0, 0, 0.9);
        zp.note(4 * 16 + r + 1, r / 2, 0, 0.5);
    }
    mel(pc, 4, ['r:2 A5:1 r:3 C6:1 r:3 D6:1 r:3 F6:1 r:1'], { vel: 0.7 });
    // 5 · mais rápido (0, 2, 4, 6), o choque estoura a câmera (8: bzzt, prato, chiado de TV até 12), a tuba desce
    groove(5, 'G9', { leve: true });
    for (const r of [0, 2, 4, 6]) clique.note(5 * 16 + r, 2, 0, 0.9);
    bz.note(5 * 16 + 8, 0, 0, 1);
    drum(cr, 5, 1, '........X.......');
    tv.note(5 * 16 + 9, 0, 0, 1);
    mel(tuba, 5, ['r:12 F2:2 D2:2']);
    // 6 · CABINE · SNORLAX: a banda some; só o ronco e o pad
    padChord(pad, 6, 'Dm9', 32, { low: 50, n: 4, vel: 0.5 });
    zz.note(6 * 16 + 1, -3, 0, 0.8);
    zz.note(6 * 16 + 10, -3, 0, 0.8);
    // 7 · a frase dormindo (4): o fagote, sonolento
    mel(fag, 7, ['r:4 A2:4 F2:4 D2:4'], { vel: 0.7 });
    zz.note(7 * 16 + 12, -4, 0, 0.7);
    // 8 · A ELIMINAÇÃO: o rufo cresce, as cartas piscam, QUEM SAI É… (8)
    tenso(8, 'Dm', { vel: 1.1 });
    drum(sn, 8, 1, 'x...x...x.x.xxxx', { vel: 0.7 });
    drum(sn, 8, 1, '........xxxxxxxx', { vel: 0.6 });
    drum(tp, 8, 1, 'x.......x...xxXX', { vel: 0.6 });
    mel(met2, 8, ['r:8 A3:8'], { vel: 0.6 });
    // 9 · breque: a porta, o grilo; o Psyduck de verdade entra (o grito no 8, clipe na cena); a cara do Ditto (10): o
    // kazoo pergunta baixinho
    drum(cr, 9, 1, 'x...............', { vel: 0.4 });
    grilo.note(9 * 16 + 2, 0, 0, 1);
    mel(kz, 9, ['r:11 D5:1 Db5:1 C5:3'], { vel: 0.7 });
    // 10 · BOING: o disfarce derrete (0); a carta do Ditto (6) e o carimbo PRO BANCO no TUM-TUM (8, 11)
    bo.note(10 * 16, 0, 0, 1.3);
    pop.note(10 * 16 + 6, 7, 0, 0.8);
    tumtum(10, 8, 11);
    drum(cr, 10, 1, '........X.......');
    mel(met, 10, ['r:8 D4+F4+Ab4:3! r:5'], { vel: 0.9 });
    // 11–13 · TELA FINAL em Sol: o motivo do Ditto no kazoo (11), SOC-CER-MON na piscada (12) com as palmas; o
    // BOING pequeno (13, 2) e o ronco dos dois
    groove(11, 'G7', { leve: true });
    mel(kz, 11, [MOTIVO]);
    padChord(cor, 11, 'G', 16, { low: 55, n: 4, vel: 0.5 });
    groove(12, 'G');
    mel(kz, 12, [GANCHO.em({ tom: -5 })]);
    mel(met, 12, [GANCHO.em({ tom: -5, oitava: -1 })], { harm: thirdBelow(MAJOR(7)), vel: 0.7 });
    drum(cl, 12, 1, GANCHO.palmas, { vel: 0.9 });
    boP.note(13 * 16 + 2, 12, 0, 1.1);
    stabs(met, 13, 'G', [0], { low: 55, n: 4, len: 2 });
    mel(bs, 13, ['G2:2 r:14']);
    zz.note(13 * 16 + 6, -3, 0, 0.7);
    zz.note(13 * 16 + 7, 2, 0, 0.4);
    return S;
}
