// Vestiário do Pallet FC, "A foto do time": trilha PROVISÓRIA do rascunho de 18 s (roteiro em
// trailer/curtas/vestiario-foto/ROTEIRO.md). Os mesmos timbres e a mesma vinheta do EP "O atrasado" (funk em Fá), só
// que a 120 BPM: compasso = 2 s, um plano por compasso no formato multicâmera (corte seco a cada fala). O clique da
// câmera e a plateia (riso, aplauso, "awww") são gravações CC0 em scripts/musica/amostras/ (créditos no ROTEIRO).

import { mola } from '../curtas.mjs';
import { amostra, bass, drum, I, mel, Song, stabs } from '../synth.mjs';
import { deslize } from './livre-ginasio.mjs';

export const meta = { titulo: 'A foto (rascunho)', tela: 'Vestiário do Pallet FC' };

export default function foto() {
    const S = new Song({ bpm: 120, bars: 9, swing: 0.12, tail: 2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1.1, rev: 0.2 });
    const bs = S.part('baixo', I.slap, { gain: 0.5, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.32 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });
    const bo = S.part('boing', mola(), { pan: 0.25, gain: 1.1, rev: 0.2 });
    const zap = S.part('zap', deslize(900, 2800, 0.07), { drum: true, pan: 0.2, gain: 0.6, rev: 0.1 });
    const sobe = S.part('sobe', deslize(300, 1400, 0.3), { drum: true, gain: 0.45, rev: 0.2 });
    const clique = S.part('clique', amostra('foto-clique.wav'), { drum: true, gain: 1.2, rev: 0.1 });
    const risoC = S.part('risoCurto', amostra('plateia-riso-curto.wav'), { drum: true, gain: 0.9 });
    const risoM = S.part('risoMedio', amostra('plateia-riso-medio.wav'), { drum: true, gain: 0.95 });
    const aplauso = S.part('aplauso', amostra('plateia-aplauso.wav'), { drum: true, gain: 0.8 });
    const aww = S.part('aww', amostra('plateia-aww.wav'), { drum: true, gain: 1 });

    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    const groove = (b, c, { leve = false } = {}) => {
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    /** A vinheta de sitcom do Vestiário (a mesma do EP "O atrasado"): F · Dm7 · Bb · C7, "ta-dá" no fim. */
    const vinheta = (b, { vel = 1 } = {}) => {
        drum(cr, b, 1, 'X...............', { vel });
        drum(kk, b, 1, 'X...x...X...x.X.', { vel });
        drum(cl, b, 1, '....X.......X...', { vel: 0.9 * vel });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.8 * vel });
        mel(met, b, ['C5:2 F5:2 A5:3 G5:1 F5:2 D5:2 C5:2 F5:2'], { vel });
        mel(met2, b, ['A4:2 C5:2 F5:3 E5:1 D5:2 Bb4:2 Bb4:2 C5:2'], { vel: 0.8 * vel });
        mel(bs, b, ['F2:2 F3:2 D2:2 D3:2 Bb1:2 Bb2:2 C2:2 F2:2'], { vel });
        stabs(ep, b, 'F', [0, 2], { low: 57, n: 4, vel });
        stabs(ep, b, 'Dm7', [4, 6], { low: 57, n: 4, vel });
        stabs(ep, b, 'Bb', [8, 10], { low: 58, n: 4, vel });
        stabs(ep, b, 'C7', [12], { low: 55, n: 4, vel });
        stabs(ep, b, 'F', [14], { low: 57, n: 4, len: 2, vel });
    };

    // 0 · gancho: o clique (no 1) e o flash; a foto 1 cai na mesa (linha 2): só a medalha. A plateia ri (linha 6)
    clique.note(0, 0, 0, 1);
    drum(cr, 0, 1, '..X.............');
    drum(tp, 0, 1, '..X.............');
    stabs(met, 0, 'Bb7', [2], { low: 56, n: 4, len: 3 });
    stabs(met2, 0, 'Bb7', [2], { low: 50, n: 3, len: 3 });
    mel(bs, 0, ['r:2 Bb1:4 r:10']);
    risoC.note(6, 0, 0, 1);
    // 1 · vinheta anos 90: VESTIÁRIO DO PALLET FC · A FOTO
    vinheta(1);
    // 2 · plano aberto: o time posando, o Psyduck atrás do tripé. O funk entra; aplauso de entrada
    drum(cr, 2, 1, 'X...............');
    groove(2, 'F7');
    stabs(met, 2, 'F7', [0], { low: 57, n: 4, len: 2 });
    aplauso.note(2 * 16, 0, 0, 0.8);
    // 3 · close do Psyduck: TODO MUNDO SORRINDO! (o grito na cena, no 1); os metais respondem no fim
    groove(3, 'Bb9', { leve: true });
    mel(met2, 3, ['r:12 D4+F4:1 r:1 D4+Ab4:2'], { vel: 0.7 });
    // 4 · aberto: o Pikachu pula na frente da câmera (o pícolo sobe e o BOING no pouso, linha 8)
    groove(4, 'F7', { leve: true });
    sobe.note(4 * 16 + 4, 0, 0, 1);
    mel(pc, 4, ['r:4 C6:1 D6:1 E6:1 F6:1 r:8'], { vel: 0.7 });
    bo.note(4 * 16 + 8, 0, 0, 1);
    drum(cr, 4, 1, '........x.......', { vel: 0.6 });
    // 5 · close do Pikachu: OLHA EU! (o grito na cena, no 1), a fanfarra; o choquinho de empolgação (zaps, linha 8)
    drum(cr, 5, 1, 'X...............');
    drum(kk, 5, 1, 'X.....x...X.....');
    mel(met, 5, ['C5:2 F5:2 A5:4 r:8']);
    mel(met2, 5, ['A4:2 C5:2 F5:4 r:8'], { vel: 0.8 });
    mel(bs, 5, ['F2:2 F3:2 F2:4 r:8']);
    drum(zap, 5, 1, '........xxx.xxxx', { vel: 1 });
    drum(sn, 5, 1, '........X..X..XX');
    // 6 · o clique (no 1): a foto 2 sai queimada. Breque, e a plateia ri (linha 4)
    clique.note(6 * 16, 0, 0, 1);
    drum(kk, 6, 1, 'X...............');
    drum(cr, 6, 1, 'X...............');
    stabs(met, 6, 'Db7', [0], { low: 56, n: 4, len: 2 });
    mel(bs, 6, ['Db2:2 r:14']);
    drum(zap, 6, 1, '..x.....x.......', { vel: 0.5, pitch: -7 });
    risoM.note(6 * 16 + 4, 0, 0, 1);
    // 7–8 · a FOTO FINAL: o clique (no 1) e o "tan-tan-TAAN"; "awww" (linha 6) e o aplauso; a vinheta fecha embaixo
    clique.note(7 * 16, 0, 0, 1);
    drum(tp, 7, 1, 'x.x.X...........');
    drum(kk, 7, 1, 'X.X.X...........');
    drum(cr, 7, 1, '....X...........');
    mel(bs, 7, ['C2:1 r:1 C2:1 r:1 F1:8 r:4']);
    mel(met, 7, ['C5:1 r:1 C5:1 r:1 F5:8 r:4']);
    mel(met2, 7, ['G4:1 r:1 G4:1 r:1 A4:8 r:4']);
    stabs(ep, 7, 'F', [4], { low: 57, n: 4, len: 8 });
    aww.note(7 * 16 + 6, 0, 0, 1);
    aplauso.note(7 * 16 + 14, 0, 0, 1);
    vinheta(8, { vel: 0.6 });
    return S;
}
