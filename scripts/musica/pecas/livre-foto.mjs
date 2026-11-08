// Vestiário do Pallet FC, "A foto do time": trilha PROVISÓRIA do episódio inteiro (30 compassos, 60 s; roteiro em
// trailer/curtas/vestiario-foto/ROTEIRO.md). Os mesmos timbres e a mesma vinheta do EP "O atrasado" (funk em Fá) a
// 120 BPM: compasso = 2 s, um plano por compasso. Estrutura de entradas que acumulam: cada um entra (aplauso), fala no
// close e sai uma foto (clique, plateia ri). O clique e a plateia (riso, aplauso, "awww") são gravações CC0 em
// scripts/musica/amostras/ (créditos no ROTEIRO); o apito e os gritos são clipes na cena.
//   0 título | 1–3 Magikarp (aberto, close, foto) | 4–6 Snorlax | 7–9 Pikachu | 10–13 Squirtle (aberto, close dos
//   óculos, o jato, foto) | 14–16 Ditto (vira Squirtle no POOF, close, foto) | 17–21 Jigglypuff (entra, close, a canção
//   e todo mundo dorme, o bigode no Snorlax, foto) | 22–23 o timer do Psyduck (3, 2, 1) | 24–25 a FOTO FINAL |
//   26–28 a tag: silêncio, o grilo, "…JÁ TIRARAM?" | 29 tela final (SOC-CER-MON)

import { aparece, kazoo, mola, splash } from '../curtas.mjs';
import { amostra, bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { barriga, deslize, ronco } from './livre-ginasio.mjs';

export const meta = { titulo: 'A foto do time', tela: 'Vestiário do Pallet FC' };

export default function foto() {
    const S = new Song({ bpm: 120, bars: 30, swing: 0.12, tail: 2 });
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

    // 0 · título: a vinheta inteira (o cartão carimba no 1, as bolinhas nas colcheias)
    vinheta(0);
    // 1 · Magikarp sozinho, estufa a medalha pra lente
    entra(1, 'F7');
    sobe.note(16 + 8, 0, 0, 1);
    // 2 · close: CAPITÃO FALANDO! (o grito no 1, o apito na linha 8)
    close(2, 'F7', 'C5:2 F5:2 A5:4 r:8', 'A4:2 C5:2 F5:4 r:8');
    // 3 · foto 1: só a medalha
    foto(3, 'Bb7', risoC, 6);
    // 4 · o Snorlax entra (passos pesados até a linha 8), senta e dorme
    entra(4, 'F7', { leve: true });
    drum(passo, 4, 1, 'x...x...x.......', { pitch: -5 });
    zz.note(4 * 16 + 10, 0, 0, 1);
    // 5 · close do Snorlax: ZZZ… (o ronco); o apito do Magikarp (clipe, linha 6) e nada
    drum(kk, 5, 1, 'X.......X.......', { vel: 0.7 });
    mel(bs, 5, ['F1:6 r:2 C2:6 r:2']);
    mel(ep, 5, ['r:8 F4+A4+C5:2 r:6'], { vel: 0.6 });
    zz.note(5 * 16, 0, 0, 1);
    risoC.note(5 * 16 + 12, 0, 0, 0.9);
    // 6 · foto 2: o Snorlax enorme e o Magikarp pulando
    foto(6, 'Db7', risoM);
    // 7 · o Pikachu pula na frente da câmera (o pícolo sobe, BOING no pouso, linha 8)
    entra(7, 'F7');
    sobe.note(7 * 16 + 4, 0, 0, 1);
    mel(pc, 7, ['r:4 C6:1 D6:1 E6:1 F6:1 r:8'], { vel: 0.7 });
    bo.note(7 * 16 + 8, 0, 0, 1);
    // 8 · close do Pikachu: OLHA EU! e o choquinho (zaps, linha 8)
    drum(cr, 8, 1, 'X...............');
    drum(kk, 8, 1, 'X.....x...X.....');
    mel(met, 8, ['C5:2 F5:2 A5:4 r:8']);
    mel(met2, 8, ['A4:2 C5:2 F5:4 r:8'], { vel: 0.8 });
    mel(bs, 8, ['F2:2 F3:2 F2:4 r:8']);
    drum(zap, 8, 1, '........xxx.xxxx', { vel: 1 });
    drum(sn, 8, 1, '........X..X..XX');
    // 9 · foto 3: queimada
    foto(9, 'Db7', risoM);
    drum(zap, 9, 1, '..x.....x.......', { vel: 0.5, pitch: -7 });
    // 10 · o Squirtle entra devagar (o funk pela metade, o baixo arrastado)
    drum(cr, 10, 1, 'X...............', { vel: 0.6 });
    aplauso.note(10 * 16, 0, 0, 0.8);
    drum(kk, 10, 1, 'X.......X.......');
    drum(sn, 10, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 10, 1, 'x...x...x...x...', { vel: 0.6 });
    mel(bs, 10, ['F2:4 r:4 Eb2:4 r:2 C2:2']);
    stabs(gt, 10, 'F7', [4, 12], { low: 60, n: 3, vel: 0.7 });
    // 11 · close: os óculos descem devagar (o metal escorrega meio tom por vez) e o brilho no fim
    drum(hh, 11, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(met2, 11, ['F4:4 E4:4 Eb4:4 D4:4'], { vel: 0.6 });
    mel(bs, 11, ['F2:4 E2:4 Eb2:4 D2:4'], { vel: 0.8 });
    desce.note(11 * 16 + 2, 0, 0, 1);
    // 12 · o Pikachu posa de novo; o Squirtle dá o jato (linha 6)
    groove(12, 'F7', { leve: true });
    mel(pc, 12, ['C6:1 r:1 C6:1 r:1 r:12'], { vel: 0.6 });
    mel(agua, 12, ['r:6 C5:2 G4:2 E4:2 C4:4']);
    // 13 · foto 4: o Pikachu encharcado, o Squirtle tranquilo
    foto(13, 'Bb7', risoG, 2);
    // 14 · o Ditto entra quicando (BOING no banco, linha 6) e vira Squirtle no POOF (linha 10); a plateia ri
    entra(14, 'F7');
    mel(pc, 14, ['C6:1 D6:1 E6:1 F6:1 r:12'], { vel: 0.6 });
    bo.note(14 * 16 + 6, 0, 0, 1);
    poof.note(14 * 16 + 10, 0, 0, 1);
    stabs(met, 14, 'F', [10], { low: 60, n: 3, vel: 0.8 });
    risoC.note(14 * 16 + 12, 0, 0, 0.9);
    // 15 · close do Ditto: EU TAMBÉM! (o grito no 1); o kazoo copia a fanfarrinha do capitão
    close(15, 'F7', null, null);
    mel(kz, 15, ['C5:2 F5:2 A5:4 r:8']);
    risoC.note(15 * 16 + 9, 0, 0, 0.9);
    // 16 · foto 5: dois Squirtles
    foto(16, 'Bb7', risoM);
    // 17 · o Jigglypuff entra (aplauso) e cai no banco (linha 8)
    entra(17, 'F7');
    sobe.note(17 * 16 + 2, 0, 0, 1);
    mel(pc, 17, ['r:4 F6:1 E6:1 D6:1 C6:1 r:8'], { vel: 0.6 });
    bo.note(17 * 16 + 8, 0, 0, 0.9);
    // 18 · close do Jigglypuff: DEIXA QUE EU ANIMO (o grito no 1), o piano todo doce
    drum(kk, 18, 1, 'X.......X.......', { vel: 0.7 });
    drum(hh, 18, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    mel(bs, 18, ['F2:4 r:4 C2:4 r:4'], { vel: 0.8 });
    stabs(ep, 18, 'F', [0], { low: 60, n: 4, len: 6 });
    stabs(ep, 18, 'Bb', [8], { low: 60, n: 4, len: 6 });
    mel(pc, 18, ['r:8 A6:1 C7:1 F7:2 r:4'], { vel: 0.5 });
    // 19 · a canção: o funk para, sobra a canção de ninar (pícolo e piano); cada um cai no sono (o ronco nas linhas 3 e
    //      6, o escorregão na 7); na linha 10 ele percebe: o tímpano e o metal bravo
    mel(pc, 19, ['C6:3 A5:1 F5:2 A5:2 G5:2 r:6'], { vel: 0.9 });
    stabs(ep, 19, 'F', [0], { low: 57, n: 4, len: 4, vel: 0.6 });
    stabs(ep, 19, 'C7', [4], { low: 55, n: 4, len: 4, vel: 0.6 });
    mel(bs, 19, ['F2:4 C2:4 r:8'], { vel: 0.6 });
    zz.note(19 * 16 + 3, 0, 0, 0.8);
    zz.note(19 * 16 + 6, 0, 0, 0.8);
    desce.note(19 * 16 + 7, 0, 0, 0.8);
    drum(tp, 19, 1, '..........X.X...');
    stabs(met, 19, 'Db7', [10], { low: 55, n: 4, len: 3 });
    stabs(met2, 19, 'Db7', [12], { low: 52, n: 4, len: 3, vel: 0.8 });
    risoC.note(19 * 16 + 12, 0, 0, 0.9);
    // 20 · o bigode: a caneta risca (linhas 2 a 12), o ronco por baixo; risada grande no fim
    zz.note(20 * 16, 0, 0, 0.8);
    mel(bs, 20, ['F1:6 r:2 C2:6 r:2'], { vel: 0.7 });
    drum(risca, 20, 1, '..x.x.x.x.x.x...');
    drum(sn, 20, 1, '............X...', { vel: 0.6 });
    risoG.note(20 * 16 + 13, 0, 0, 1);
    // 21 · foto 6: todo mundo dormindo
    foto(21, 'Db7', risoM);
    zz.note(21 * 16 + 8, 0, 0, 0.7);
    // 22 · o Psyduck desiste: segura a cabeça (o fagote que desce), liga o timer (o bip, linha 5) e corre; o 3 na linha 8
    desce.note(22 * 16, 0, 0, 0.8);
    mel(tuba, 22, ['F2:2 E2:2 Eb2:2 D2:2 r:8'], { vel: 0.6 });
    mel(bip, 22, ['r:5 C6:1 r:2 C6:2 r:6']);
    drum(hh, 22, 1, '........x.x.x.x.', { vel: 0.8 });
    drum(sn, 22, 1, '........x...x.xx', { vel: 0.6 });
    drum(kk, 22, 1, '........X...X...', { vel: 0.8 });
    // 23 · 2 (no 1), todo mundo acorda (linha 4: o prato e o metal), 1 (linha 8); a caixa sobe até o clique
    mel(bip, 23, ['C6:2 r:6 C6:2 r:6']);
    drum(cr, 23, 1, '....X...........', { vel: 0.8 });
    stabs(met, 23, 'F', [4], { low: 60, n: 3, len: 2 });
    drum(sn, 23, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    drum(kk, 23, 1, 'X...X...X...X...');
    sobe.note(23 * 16 + 8, 0, 0, 1);
    risoC.note(23 * 16 + 5, 0, 0, 0.7);
    // 24–25 · a FOTO FINAL: o clique (no 1) e o "tan-tan-TAAN"; "awww" (linha 6) e o aplauso; a vinheta fecha
    clique.note(24 * 16, 0, 0, 1);
    drum(tp, 24, 1, 'x.x.X...........');
    drum(kk, 24, 1, 'X.X.X...........');
    drum(cr, 24, 1, '....X...........');
    mel(bs, 24, ['C2:1 r:1 C2:1 r:1 F1:8 r:4']);
    mel(met, 24, ['C5:1 r:1 C5:1 r:1 F5:8 r:4']);
    mel(met2, 24, ['G4:1 r:1 G4:1 r:1 A4:8 r:4']);
    stabs(ep, 24, 'F', [4], { low: 57, n: 4, len: 8 });
    aww.note(24 * 16 + 6, 0, 0, 1);
    aplauso.note(24 * 16 + 14, 0, 0, 1);
    vinheta(25, { vel: 0.6 });
    // 26–27 · a tag: silêncio. O Slowpoke entra devagar (a tuba arrastada, até a linha 8) e para; só o grilo
    mel(tuba, 26, ['F1:3 r:1 C1:3 r:9'], { vel: 0.5 });
    grilo.note(26 * 16 + 10, 0, 0, 0.8);
    grilo.note(27 * 16 + 6, 0, 0, 0.8);
    // 28 · …JÁ TIRARAM? (o grito lento no 1); a plateia explode (linha 4) e a tuba responde atrasada
    risoG.note(28 * 16 + 4, 0, 0, 1);
    mel(tuba, 28, ['r:10 F2:1 r:1 F1:2 r:2'], { vel: 0.9 });
    // 29 · tela final: SOC-CER-MON em Fá com as palmas (a piscada do logo nas linhas 0, 3 e 6)
    drum(cr, 29, 1, 'X...............');
    drum(kk, 29, 1, 'X...x...X.......');
    drum(hh, 29, 1, 'x.x.x.x.x.......', { vel: 0.8 });
    mel(bs, 29, ['F2:2 F3:2 C2:2 C3:2 F2:4 r:4']);
    stabs(gt, 29, 'F', [2, 6], { low: 60, n: 3 });
    mel(met, 29, [GANCHO.em({ tom: 5, oitava: -1 })]);
    mel(pc, 29, [GANCHO.em({ tom: 5 })], { vel: 0.7 });
    drum(cl, 29, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(ep, 29, 'F', 12, { low: 57, n: 4, vel: 0.5 });
    return S;
}
