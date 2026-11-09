// Vestiário do Pallet FC, "A foto do time": trilha PROVISÓRIA do episódio 1 inteiro (26 compassos, 52 s; roteiro em
// trailer/curtas/vestiario-foto/ROTEIRO.md). Os mesmos timbres e a mesma vinheta do EP "O atrasado" (funk em Fá) a
// 120 BPM: compasso = 2 s, um plano por compasso. Estrutura de entradas que acumulam: cada um entra (aplauso), fala no
// close e sai uma foto (clique, plateia ri). O clique e a plateia (riso, aplauso, "awww") são gravações CC0 em
// scripts/musica/amostras/ (créditos no ROTEIRO); os gritos são clipes na cena.
//   0 abertura (a vinheta) | 1–3 Magikarp (aberto, close, foto) | 4–5 Snorlax (entra e dorme, foto) | 6–8 Pikachu |
//   9–12 Squirtle (aberto, close dos óculos, o jato, foto) | 13–15 Ditto (vira um Squirtle idêntico, os dois abaixam os
//   óculos; close; foto) | 16–19 Jigglypuff (close com o aplauso de entrada, a canção e todo mundo dorme, o bigode,
//   foto) | 20 o timer do Psyduck (3, 2, 1) | 21–22½ a FOTO FINAL | 22½–24 os créditos (SOC-CER-MON) |
//   24–25 o pós-créditos: o silêncio com o grilo, "…JÁ TIRARAM?", a risada e o corte seco

import { aparece, kazoo, mola, splash } from '../curtas.mjs';
import { amostra, bass, drum, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { barriga, deslize, ronco } from './livre-ginasio.mjs';

export const meta = { titulo: 'A foto do time', tela: 'Vestiário do Pallet FC' };

export default function foto() {
    const S = new Song({ bpm: 120, bars: 26, swing: 0.12, tail: 2 });
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
    const desce = S.part('desce', deslize(1200, 300, 0.9), { drum: true, gain: 0.35, rev: 0.25 });
    const passo = S.part('passo', barriga, { drum: true, gain: 0.55 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.6, rev: 0.15 });
    const agua = S.part('agua', splash, { pan: 0.15, gain: 1, rev: 0.2 });
    const clique = S.part('clique', amostra('foto-clique.wav'), { drum: true, gain: 1.2, rev: 0.1 });
    const risoC = S.part('risoCurto', amostra('plateia-riso-curto.wav'), { drum: true, gain: 0.9 });
    const risoM = S.part('risoMedio', amostra('plateia-riso-medio.wav'), { drum: true, gain: 0.95 });
    const risoG = S.part('risoGrande', amostra('plateia-riso-grande.wav'), { drum: true, gain: 0.85 });
    const aplauso = S.part('aplauso', amostra('plateia-aplauso.wav'), { drum: true, gain: 0.8 });
    const aww = S.part('aww', amostra('plateia-aww.wav'), { drum: true, gain: 1 });
    const grilo = S.part('grilo', amostra('grilo.wav'), { drum: true, pan: 0.2, gain: 0.45, rev: 0.3 });
    const poof = S.part('poof', aparece, { drum: true, gain: 0.9, rev: 0.15 });
    const kz = S.part('kazoo', kazoo, { pan: -0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.75, rev: 0.12 });
    const bip = S.part('bip', I.pulse, { pan: 0.25, gain: 0.35, corte: 4000, rev: 0.1 });
    const risca = S.part('risca', deslize(2400, 1500, 0.09), { drum: true, pan: -0.2, gain: 0.5 });

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
    /** Entrada: o aplauso da plateia (no 1) e o groove. */
    const entra = (b, c, op) => {
        drum(cr, b, 1, 'X...............', { vel: 0.7 });
        groove(b, c, op);
        aplauso.note(b * 16, 0, 0, 0.8);
    };
    /** O close: a fanfarrinha de quem fala (o grito é clipe na cena, no 1). */
    const close = (b, c, frase, frase2) => {
        drum(kk, b, 1, 'X.....x...X.....');
        drum(sn, b, 1, '....x.......x...', { vel: 0.7 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        bass(bs, b, c, '0:3 r:3 5:2 0:2 r:2 s:2 5:2', { vel: 0.8 });
        if (frase) mel(met, b, [frase]);
        if (frase2) mel(met2, b, [frase2], { vel: 0.8 });
    };
    /** O clique (no 1), breque, e a plateia ri. */
    const foto = (b, acorde, riso, linha = 4) => {
        clique.note(b * 16, 0, 0, 1);
        drum(kk, b, 1, 'X...............');
        drum(cr, b, 1, 'X...............');
        stabs(met, b, acorde, [0], { low: 56, n: 4, len: 2 });
        mel(bs, b, [`${acorde.replace(/7$/, '')}2:2 r:14`]);
        riso.note(b * 16 + linha, 0, 0, 1);
    };

    /** O gancho SOC-CER-MON (o G-E-C do GANCHO levado pra Fá) a partir da linha absoluta `t`, fora da grade do compasso. */
    const gancho = (p, t, base, vel = 1) => {
        for (const [dt, iv, len] of [
            [0, 7, 3],
            [3, 4, 3],
            [6, 12, 6],
        ])
            p.note(t + dt, base + iv, len, vel);
    };

    // 0 · abertura: a vinheta inteira (a logo carimba no 1, as bolinhas nas semicolcheias)
    vinheta(0);
    // 1 · Magikarp sozinho, estufa a medalha pra lente
    entra(1, 'F7');
    sobe.note(16 + 8, 0, 0, 1);
    // 2 · close: CAPITÃO FALANDO! (o grito no 1)
    close(2, 'F7', 'C5:2 F5:2 A5:4 r:8', 'A4:2 C5:2 F5:4 r:8');
    // 3 · foto 1: só a medalha
    foto(3, 'Bb7', risoC, 6);
    // 4 · o Snorlax entra (passos pesados até a linha 8), senta e dorme; o Magikarp leva um susto
    entra(4, 'F7', { leve: true });
    drum(passo, 4, 1, 'x...x...x.......', { pitch: -5 });
    zz.note(4 * 16 + 10, 0, 0, 1);
    risoC.note(4 * 16 + 12, 0, 0, 0.8);
    // 5 · foto 2: o Snorlax enorme e o Magikarp no ar
    foto(5, 'Db7', risoM);
    // 6 · o Pikachu pula na frente da câmera (o pícolo sobe, BOING no pouso, linha 8)
    entra(6, 'F7');
    sobe.note(6 * 16 + 4, 0, 0, 1);
    mel(pc, 6, ['r:4 C6:1 D6:1 E6:1 F6:1 r:8'], { vel: 0.7 });
    bo.note(6 * 16 + 8, 0, 0, 1);
    // 7 · close do Pikachu: OLHA EU! e o choquinho (zaps, linha 8)
    drum(cr, 7, 1, 'X...............');
    drum(kk, 7, 1, 'X.....x...X.....');
    mel(met, 7, ['C5:2 F5:2 A5:4 r:8']);
    mel(met2, 7, ['A4:2 C5:2 F5:4 r:8'], { vel: 0.8 });
    mel(bs, 7, ['F2:2 F3:2 F2:4 r:8']);
    drum(zap, 7, 1, '........xxx.xxxx', { vel: 1 });
    drum(sn, 7, 1, '........X..X..XX');
    // 8 · foto 3: queimada
    foto(8, 'Db7', risoM);
    drum(zap, 8, 1, '..x.....x.......', { vel: 0.5, pitch: -7 });
    // 9 · o Squirtle entra devagar (o funk pela metade, o baixo arrastado)
    drum(cr, 9, 1, 'X...............', { vel: 0.6 });
    aplauso.note(9 * 16, 0, 0, 0.8);
    drum(kk, 9, 1, 'X.......X.......');
    drum(sn, 9, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 9, 1, 'x...x...x...x...', { vel: 0.6 });
    mel(bs, 9, ['F2:4 r:4 Eb2:4 r:2 C2:2']);
    stabs(gt, 9, 'F7', [4, 12], { low: 60, n: 3, vel: 0.7 });
    // 10 · close: os óculos descem devagar (o metal escorrega meio tom por vez)
    drum(hh, 10, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(met2, 10, ['F4:4 E4:4 Eb4:4 D4:4'], { vel: 0.6 });
    mel(bs, 10, ['F2:4 E2:4 Eb2:4 D2:4'], { vel: 0.8 });
    desce.note(10 * 16 + 2, 0, 0, 1);
    // 11 · o Pikachu posa de novo; o Squirtle dá o jato (linha 6)
    groove(11, 'F7', { leve: true });
    mel(pc, 11, ['C6:1 r:1 C6:1 r:1 r:12'], { vel: 0.6 });
    mel(agua, 11, ['r:6 C5:2 G4:2 E4:2 C4:4']);
    // 12 · foto 4: o Pikachu encharcado, o Squirtle tranquilo
    foto(12, 'Bb7', risoG, 2);
    // 13 · o Ditto entra quicando (BOING no banco, linha 4) e vira um Squirtle idêntico no POOF (linha 6); os dois
    //      abaixam os óculos juntos (o metal escorrega, linhas 10 a 12) e o de verdade vira, bravo (o tímpano, 13)
    entra(13, 'F7', { leve: true });
    mel(pc, 13, ['C6:1 D6:1 E6:1 F6:1 r:12'], { vel: 0.6 });
    bo.note(13 * 16 + 4, 0, 0, 1);
    poof.note(13 * 16 + 6, 0, 0, 1);
    stabs(met, 13, 'F', [6], { low: 60, n: 3, vel: 0.8 });
    mel(met2, 13, ['r:10 F4:1 E4:1 Eb4:1 r:3'], { vel: 0.8 });
    drum(tp, 13, 1, '.............X..');
    risoC.note(13 * 16 + 14, 0, 0, 0.9);
    // 14 · close do Ditto (de Squirtle): EU TAMBÉM! (o grito no 1); o kazoo copia a fanfarrinha do capitão
    close(14, 'F7', null, null);
    mel(kz, 14, ['C5:2 F5:2 A5:4 r:8']);
    risoC.note(14 * 16 + 9, 0, 0, 0.9);
    // 15 · foto 5: dois Squirtles iguais
    foto(15, 'Bb7', risoM);
    // 16 · close do Jigglypuff: DEIXA QUE EU ANIMO (o aplauso de entrada e o grito no 1), o piano todo doce
    drum(cr, 16, 1, 'X...............', { vel: 0.7 });
    aplauso.note(16 * 16, 0, 0, 0.8);
    drum(kk, 16, 1, 'X.......X.......', { vel: 0.7 });
    drum(hh, 16, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    mel(bs, 16, ['F2:4 r:4 C2:4 r:4'], { vel: 0.8 });
    stabs(ep, 16, 'F', [0], { low: 60, n: 4, len: 6 });
    stabs(ep, 16, 'Bb', [8], { low: 60, n: 4, len: 6 });
    mel(pc, 16, ['r:8 A6:1 C7:1 F7:2 r:4'], { vel: 0.5 });
    // 17 · a canção: o funk para, sobra a canção de ninar (pícolo e piano); cada um cai no sono (o ronco nas linhas 3 e
    //      6, o escorregão na 7); na linha 10 ele percebe: o tímpano e o metal bravo
    mel(pc, 17, ['C6:3 A5:1 F5:2 A5:2 G5:2 r:6'], { vel: 0.9 });
    stabs(ep, 17, 'F', [0], { low: 57, n: 4, len: 4, vel: 0.6 });
    stabs(ep, 17, 'C7', [4], { low: 55, n: 4, len: 4, vel: 0.6 });
    mel(bs, 17, ['F2:4 C2:4 r:8'], { vel: 0.6 });
    zz.note(17 * 16 + 3, 0, 0, 0.8);
    zz.note(17 * 16 + 6, 0, 0, 0.8);
    desce.note(17 * 16 + 7, 0, 0, 0.8);
    drum(tp, 17, 1, '..........X.X...');
    stabs(met, 17, 'Db7', [10], { low: 55, n: 4, len: 3 });
    stabs(met2, 17, 'Db7', [12], { low: 52, n: 4, len: 3, vel: 0.8 });
    risoC.note(17 * 16 + 12, 0, 0, 0.9);
    // 18 · o bigode: a caneta risca (linhas 2 a 12), o ronco por baixo; risada grande no fim
    zz.note(18 * 16, 0, 0, 0.8);
    mel(bs, 18, ['F1:6 r:2 C2:6 r:2'], { vel: 0.7 });
    drum(risca, 18, 1, '..x.x.x.x.x.x...');
    drum(sn, 18, 1, '............X...', { vel: 0.6 });
    risoG.note(18 * 16 + 13, 0, 0, 1);
    // 19 · foto 6: todo mundo dormindo
    foto(19, 'Db7', risoM);
    zz.note(19 * 16 + 8, 0, 0, 0.7);
    // 20 · o timer: o Psyduck segura a cabeça (a tuba que desce), aperta (o bip, linha 2) e os bips do 3, 2, 1 (linhas
    //      4, 8 e 12); no 2 todo mundo acorda (o prato e o metal) e o Ditto quica (BOING); a caixa sobe até o clique
    desce.note(20 * 16, 0, 0, 0.8);
    mel(tuba, 20, ['F2:1 E2:1 r:14'], { vel: 0.6 });
    mel(bip, 20, ['r:2 C6:1 r:1 C6:2 r:2 C6:2 r:2 F6:2 r:2']);
    drum(hh, 20, 1, '....x.x.x.x.x.x.', { vel: 0.8 });
    drum(kk, 20, 1, '....X...X...X...', { vel: 0.9 });
    drum(sn, 20, 1, '....x...x.x.xxXX', { vel: 0.8 });
    drum(cr, 20, 1, '........X.......', { vel: 0.8 });
    stabs(met, 20, 'F', [8], { low: 60, n: 3, len: 2 });
    bo.note(20 * 16 + 9, 0, 0, 0.9);
    sobe.note(20 * 16 + 12, 0, 0, 1);
    risoC.note(20 * 16 + 10, 0, 0, 0.7);
    // 21–22½ · a FOTO FINAL: o clique (no 1) e o "tan-tan-TAAN"; "awww" (linha 6) e o aplauso (linha 12)
    clique.note(21 * 16, 0, 0, 1);
    drum(tp, 21, 1, 'x.x.X...........');
    drum(kk, 21, 1, 'X.X.X...........');
    drum(cr, 21, 1, '....X...........');
    mel(bs, 21, ['C2:1 r:1 C2:1 r:1 F1:8 r:4']);
    mel(met, 21, ['C5:1 r:1 C5:1 r:1 F5:8 r:4']);
    mel(met2, 21, ['G4:1 r:1 G4:1 r:1 A4:8 r:4']);
    stabs(ep, 21, 'F', [4], { low: 57, n: 4, len: 12 });
    aww.note(21 * 16 + 6, 0, 0, 1);
    aplauso.note(21 * 16 + 12, 0, 0, 1);
    padChord(ep, 22, 'F', 8, { low: 57, n: 4, vel: 0.4 });
    // 22½–24 · os créditos: SOC-CER-MON em Fá com as palmas (a piscada do logo nas linhas 8, 11 e 14 do 22)
    drum(cr, 22, 1, '........X.......');
    drum(kk, 22, 1, '........X...x...');
    drum(kk, 23, 1, 'X...x...........');
    drum(hh, 22, 1, '........x.x.x.x.', { vel: 0.8 });
    drum(hh, 23, 1, 'x.x.x...........', { vel: 0.8 });
    mel(bs, 22, ['r:8 F2:2 F3:2 C2:2 C3:2']);
    mel(bs, 23, ['F2:4 r:12']);
    stabs(gt, 22, 'F', [10, 14], { low: 60, n: 3 });
    gancho(met, 22 * 16 + 8, 65);
    gancho(pc, 22 * 16 + 8, 77, 0.7);
    drum(cl, 23, 1, '....x.x.........', { vel: 0.9 });
    padChord(ep, 23, 'F', 16, { low: 57, n: 4, vel: 0.5 });
    // 24 · pós-créditos: silêncio. O Slowpoke entra devagar (a tuba arrastada) e para; só o grilo
    mel(tuba, 24, ['F1:3 r:1 C1:3 r:9'], { vel: 0.5 });
    grilo.note(24 * 16 + 9, 0, 0, 0.8);
    // 25 · …JÁ TIRARAM? (o grito lento na linha 2); a plateia explode (linha 6), a tuba responde atrasada e o vídeo
    //      corta seco no fim do compasso, no meio da risada
    risoG.note(25 * 16 + 6, 0, 0, 1);
    mel(tuba, 25, ['r:11 F2:1 r:1 F1:3'], { vel: 0.9 });
    return S;
}
