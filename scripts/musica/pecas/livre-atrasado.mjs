// Vestiário do Pallet FC, EP 1 "O atrasado" (roteiro em trailer/curtas/vestiario-atrasado/ROTEIRO.md). Molde da
// livre-ditto: funk em Fá, 100 BPM, 4/4, compasso = 2,4 s. v3 (08/11/2026): 25 compassos (60 s), com as três
// tentativas do time (o calendário do Magikarp, a mímica do Pikachu, o espelho do Ditto) e a tag "uma semana depois".
// A piada da música é a do episódio: o motivo do Slowpoke na tuba responde SEMPRE um tempo atrasado (a banda chama no
// 1, ele entra no 2: F2 A2 C3 Eb3, um bocejo que sobe). Os passos dele são o bloco de madeira a mil em semicolcheias
// (corre parado). A vinheta é de sitcom anos 90 (piano elétrico, metais, clap 808, "ta-dá"). Breque no apito, o
// "zum" da lousa girando e o acorde do placar; a música para quando a ficha não cai (a tuba tenta a primeira nota e
// desiste); a luz apaga (clique) e só sobra o grilo. O "!" é um golpe da banda (o grito dele em meia velocidade é o
// som de assinatura, na cena); o congelamento tem o "tan-tan-TAAN" de sitcom e a vinheta volta com o aplauso. No
// fim, SOC-CER-MON; a banda fecha e a tuba ainda responde, sozinha, atrasada.
// v3: os quatro "bonks" da mímica do Pikachu caem nos tempos; o Slowpoke conta 1, 2, 3, 4 nas notas atrasadas da tuba;
// o choquinho é um zap que sobe; o Ditto vira Slowpoke no BOING (`mola`) e, no espelho, o kazoo dele toca o motivo
// do Slowpoke junto com a tuba (copia até o atraso). A tag tem passarinho de manhã (pícolo) e termina no grilo.
// Plateia e grilo: gravações CC0 do Freesound (créditos no ROTEIRO), em scripts/musica/amostras/.

import { kazoo, mola, splash } from '../curtas.mjs';
import { amostra, bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { deslize, ronco } from './livre-ginasio.mjs';

export const meta = { titulo: 'O atrasado', tela: 'Vestiário do Pallet FC (EP 1)' };

/** O motivo do Slowpoke (um compasso, Fá): entra um tempo atrasado e sobe bocejando até a sétima. */
export const MOTIVO = 'r:4 F2:3 r:1 A2:2 C3:2 Eb3:3 r:1';

export default function atrasado() {
    const S = new Song({ bpm: 100, bars: 25, swing: 0.12, tail: 3 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.75, rev: 0.12 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1.1, rev: 0.2 });
    const bs = S.part('baixo', I.slap, { gain: 0.5, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const spl = S.part('plof', splash, { pan: -0.2, gain: 1.1, rev: 0.2 });
    const zz = S.part('ronco', ronco, { drum: true, pan: -0.3, gain: 0.5, rev: 0.15 });
    const zum = S.part('zum', deslize(260, 1500, 0.22), { drum: true, gain: 0.5, rev: 0.25 });
    const bl = S.part('passos', I.block, { drum: true, pan: 0.25, gain: 0.8 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: -0.25, gain: 0.8 });
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
    const risoC = S.part('risoCurto', amostra('plateia-riso-curto.wav'), { drum: true, gain: 0.9 });
    const risoG = S.part('risoGrande', amostra('plateia-riso-grande.wav'), { drum: true, gain: 1 });
    const risoM = S.part('risoMedio', amostra('plateia-riso-medio.wav'), { drum: true, gain: 0.9 });
    const aplauso = S.part('aplauso', amostra('plateia-aplauso.wav'), { drum: true, gain: 0.9 });
    const kz = S.part('kazoo', kazoo, { pan: -0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const bo = S.part('boing', mola(), { pan: 0.25, gain: 1.2, rev: 0.2 });
    const zap = S.part('zap', deslize(900, 2800, 0.07), { drum: true, pan: 0.2, gain: 0.6, rev: 0.1 });
    const grilo = S.part('grilo', amostra('grilo.wav'), { drum: true, pan: 0.2, gain: 0.45, rev: 0.3 });

    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    const groove = (b, c, { leve = false } = {}) => {
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    /** Os passos dele: o bloco de madeira a mil (duas alturas), o shaker e o motivo atrasado por cima. */
    const corre = (b) => {
        drum(bl, b, 1, 'x.x.x.x.x.x.x.x.', { pitch: 0 });
        drum(bl, b, 1, '.x.x.x.x.x.x.x.x', { pitch: 5, vel: 0.8 });
        drum(sk, b, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.7 });
        drum(kk, b, 1, 'X.......X.......', { vel: 0.7 });
        mel(tuba, b, [MOTIVO], { vel: 0.8 });
    };
    /** A vinheta de sitcom: F · Dm7 · Bb · C7, o tema nos metais, clap 808 no 2 e no 4, "ta-dá" no fim. */
    const vinheta = (b, { aplaude = false } = {}) => {
        drum(cr, b, 1, 'X...............');
        drum(kk, b, 1, 'X...x...X...x.X.');
        drum(cl, b, 1, '....X.......X...', { vel: 0.9 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.8 });
        mel(met, b, ['C5:2 F5:2 A5:3 G5:1 F5:2 D5:2 C5:2 F5:2']);
        mel(met2, b, ['A4:2 C5:2 F5:3 E5:1 D5:2 Bb4:2 Bb4:2 C5:2'], { vel: 0.8 });
        mel(bs, b, ['F2:2 F3:2 D2:2 D3:2 Bb1:2 Bb2:2 C2:2 F2:2']);
        stabs(ep, b, 'F', [0, 2], { low: 57, n: 4 });
        stabs(ep, b, 'Dm7', [4, 6], { low: 57, n: 4 });
        stabs(ep, b, 'Bb', [8, 10], { low: 58, n: 4 });
        stabs(ep, b, 'C7', [12], { low: 55, n: 4 });
        stabs(ep, b, 'F', [14], { low: 57, n: 4, len: 2 });
        if (aplaude) aplauso.note(b * 16, 0, 0, 1);
    };

    // 0 · gancho: ele corre parado (passos a mil); o motivo dele já no 1º compasso, atrasado
    corre(0);
    // 1 · vinheta anos 90: VESTIÁRIO DO PALLET FC (e o nome do episódio, O ATRASADO, na linha 8)
    vinheta(1);
    // 2 · o "ta-dá" segura o título meio compasso; na linha 8 volta: ele ainda está correndo, a plateia ri
    drum(cr, 2, 1, 'X...............');
    drum(tp, 2, 1, 'X.x.x.x.........', { vel: 0.8 });
    stabs(met, 2, 'F', [0], { low: 57, n: 4, len: 6 });
    stabs(ep, 2, 'F', [0], { low: 57, n: 4, len: 6 });
    mel(bs, 2, ['F2:6 r:10']);
    drum(bl, 2, 1, '........x.x.x.x.', { pitch: 0 });
    drum(bl, 2, 1, '.........x.x.x.x', { pitch: 5, vel: 0.8 });
    drum(sk, 2, 1, '........xxxxxxxx', { vel: 0.7 });
    mel(tuba, 2, ['r:12 F2:3 r:1'], { vel: 0.8 });
    risoC.note(2 * 16 + 9, 0, 0, 1);
    // 3 · ele chega: o funk entra (a banda chama no 1, a tuba responde no 2)
    drum(cr, 3, 1, 'X...............');
    groove(3, 'F7');
    stabs(met, 3, 'F7', [0], { low: 57, n: 4, len: 2 });
    mel(tuba, 3, [MOTIVO]);
    // 4 · CHEGUEI PRA ESTREIA! (o grito dele na cena, no 1): groove leve, os metais respondem no fim
    groove(4, 'Bb9', { leve: true });
    mel(tuba, 4, [MOTIVO], { shift: 5, vel: 0.85 });
    mel(met2, 4, ['r:12 D4+F4:1 r:1 D4+Ab4:2'], { vel: 0.7 });
    // 5 · o time se olha: o "?" do Magikarp (plof), o do Pikachu (pícolo subindo), o Snorlax ronca
    groove(5, 'F7', { leve: true });
    mel(spl, 5, ['C5:1 r:1 G5:2 r:12'], { vel: 0.8 });
    mel(pc, 5, ['r:5 C6:1 r:1 G6:3 r:6'], { vel: 0.8 });
    zz.note(5 * 16 + 9, -3, 0, 0.7);
    // 6 · tentativa 1: o apito (na cena, no 1) e o breque; o calendário desenrola (zum, linha 2) e o SÁB é riscado
    // (tímpano, linha 4); ele olha… demora (a tuba sobe devagar, atrasada)
    drum(kk, 6, 1, 'X...x...........');
    stabs(met, 6, 'F7', [0], { low: 57, n: 4, len: 1 });
    stabs(gt, 6, 'F7', [0], { low: 60, n: 3 });
    zum.note(6 * 16 + 2, 0, 0, 1);
    drum(tp, 6, 1, '....X...........');
    drum(cr, 6, 1, '....x...........', { vel: 0.7 });
    drum(hh, 6, 1, '........x...x...', { vel: 0.5 });
    mel(tuba, 6, ['r:6 F2:3 r:3 A2:4'], { vel: 0.8 });
    // 7 · SÁBADO! (o grito na cena, no 1) e o joinha: o "ta-da" dos metais, a plateia; o Magikarp cai (plof)
    drum(cr, 7, 1, 'X...............');
    groove(7, 'F7', { leve: true });
    stabs(met, 7, 'F', [0], { low: 60, n: 4, len: 3 });
    stabs(met2, 7, 'F', [0], { low: 53, n: 3, len: 3 });
    risoC.note(7 * 16 + 5, 0, 0, 1);
    mel(spl, 7, ['r:10 G4:2 r:4'], { vel: 0.9 });
    // 8 · tentativa 2, a mímica: o chute nos tempos, a bola volta na cara (bonk) no "e" de cada tempo, quatro vezes
    drum(kk, 8, 1, 'X...X...X...X...');
    drum(bl, 8, 1, '..X...X...X...X.', { pitch: -9, vel: 1.1 });
    drum(tp, 8, 1, '..x...x...x...x.', { vel: 0.6 });
    drum(hh, 8, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    mel(pc, 8, ['C6:1 G6:1 r:2 C6:1 G6:1 r:2 C6:1 G6:1 r:2 C6:1 G6:1 r:2'], { vel: 0.6 });
    bass(bs, 8, 'F7', '0:2 r:2 0:2 r:2 0:2 r:2 5:2 r:2', { vel: 0.8 });
    risoC.note(8 * 16 + 11, 0, 0, 0.8);
    // 9 · os 4 dedos (pícolo); ele conta 1, 2, 3, 4: uma nota atrasada da tuba por número
    drum(hh, 9, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(pc, 9, ['C6:1 F6:1 r:14'], { vel: 0.6 });
    mel(tuba, 9, ['r:2 F2:2 r:2 G2:2 r:2 A2:2 r:2 C3:2']);
    // 10 · 4 × 0! (o grito na cena, no 1): a fanfarra da comemoração; o choquinho do Pikachu (zaps, linha 10)
    drum(cr, 10, 1, 'X...............');
    drum(kk, 10, 1, 'X.....x...X.....');
    mel(met, 10, ['C5:2 F5:2 A5:4 r:8']);
    mel(met2, 10, ['A4:2 C5:2 F5:4 r:8'], { vel: 0.8 });
    mel(bs, 10, ['F2:2 F3:2 F2:4 r:8']);
    drum(zap, 10, 1, '..........xxx.x.', { vel: 1 });
    drum(sn, 10, 1, '..........X..X..');
    // 11 · tentativa 3: o Ditto se concentra (o pícolo sobe) e vira Slowpoke no BOING (linha 8); o kazoo dele "ta-dá"
    mel(pc, 11, ['C6:1 D6:1 E6:1 F6:1 G6:1 A6:1 Bb6:1 C7:1 r:8'], { vel: 0.7 });
    drum(tp, 11, 1, 'x.x.x.x.........', { vel: 0.5 });
    bo.note(11 * 16 + 8, -2, 0, 1.1);
    drum(cr, 11, 1, '........x.......', { vel: 0.6 });
    mel(kz, 11, ['r:11 F4:1 r:1 F5:3']);
    // 12 · ele encena o sábado: larga a camisa e sai; o banco vazio com a camisa 79 (a tuba "uá-uá-uá")
    groove(12, 'F7', { leve: true });
    mel(tuba, 12, ['r:4 C3:3 r:1 B2:3 r:1 Bb2:4']);
    risoC.note(12 * 16 + 12, 0, 0, 0.7);
    // 13 · ele volta: o kazoo copia o motivo do Slowpoke (atrasado igual)
    groove(13, 'Bb9', { leve: true });
    mel(kz, 13, [MOTIVO], { shift: 24, vel: 0.9 });
    // 14 · o espelho: a tuba e o kazoo juntos, o motivo inteiro; a plateia explode quando os dois ajeitam a faixa
    groove(14, 'F7');
    mel(tuba, 14, [MOTIVO]);
    mel(kz, 14, [MOTIVO], { shift: 24 });
    risoG.note(14 * 16 + 8, 0, 0, 1);
    // 15 · a virada: o apito longo (na cena, no 1) e o breque; a lousa gira (o zum na linha 7, o placar na 8)
    drum(kk, 15, 1, 'X.......X.......');
    stabs(met, 15, 'F7', [0], { low: 57, n: 4, len: 1 });
    stabs(gt, 15, 'F7', [0], { low: 60, n: 3 });
    mel(bs, 15, ['F2:1 r:7 F1:4 r:4']);
    zum.note(15 * 16 + 7, 0, 0, 1);
    drum(cr, 15, 1, '........X.......');
    drum(tp, 15, 1, '........X.......');
    stabs(met, 15, 'Bb7', [8], { low: 56, n: 4, len: 4 });
    stabs(met2, 15, 'Bb7', [8], { low: 50, n: 3, len: 4 });
    risoG.note(15 * 16 + 10, 0, 0, 1);
    // 16 · nada: a música para; a tuba tenta a primeira nota e desiste; o Snorlax ronca
    mel(tuba, 16, ['r:4 F2:2 r:10'], { vel: 0.6 });
    zz.note(16 * 16 + 8, -3, 0, 0.6);
    // 17 · "...": silêncio; o Pikachu ri (o grito na cena, linha 8) e a plateia junto
    risoM.note(17 * 16 + 8, 0, 0, 0.9);
    // 18 · a luz apaga (clique no 1) e só sobra o grilo; a ficha cai na linha 8: o golpe da banda (com o grito dele em
    // meia velocidade, na cena)
    drum(bl, 18, 1, 'X...............', { pitch: 14, vel: 1.2 });
    drum(bl, 18, 1, '.x..............', { pitch: 7, vel: 0.6 });
    grilo.note(18 * 16 + 2, 0, 0, 0.8);
    drum(cr, 18, 1, '........X.......');
    drum(tp, 18, 1, '........X.......');
    drum(kk, 18, 1, '........X.......');
    stabs(met, 18, 'Db7', [8], { low: 56, n: 4, len: 2 });
    mel(bs, 18, ['r:8 Db2:2 r:6']);
    // 19 · congela no 1: o "tan-tan-TAAN" de sitcom e o aplauso
    drum(cr, 19, 1, '....X...........');
    drum(tp, 19, 1, 'x.x.X...........');
    drum(kk, 19, 1, 'X.X.X...........');
    mel(bs, 19, ['C2:1 r:1 C2:1 r:1 F1:6 r:6']);
    mel(met, 19, ['C5:1 r:1 C5:1 r:1 F5:6 r:6']);
    mel(met2, 19, ['G4:1 r:1 G4:1 r:1 A4:6 r:6']);
    stabs(ep, 19, 'F', [4], { low: 57, n: 4, len: 6 });
    aplauso.note(19 * 16 + 5, 0, 0, 1);
    // 20 · UMA SEMANA DEPOIS: a vinheta de sitcom inteira debaixo do letreiro
    vinheta(20);
    // 21 · a tag, de manhã: passarinho (pícolo); ele chega correndo (passos até a linha 10) e para
    mel(pc, 21, ['G6:1 E6:1 r:2 G6:1 E6:1 r:10'], { vel: 0.5 });
    drum(bl, 21, 1, 'x.x.x.x.x.......', { pitch: 0 });
    drum(bl, 21, 1, '.x.x.x.x.x......', { pitch: 5, vel: 0.8 });
    drum(sk, 21, 1, 'xxxxxxxxxx......', { vel: 0.7 });
    drum(kk, 21, 1, 'X.......X.X.....', { vel: 0.7 });
    mel(tuba, 21, ['r:4 F2:3 r:9'], { vel: 0.7 });
    // 22 · ele lê LIGA EM 63 DIAS (a tuba, atrasada) e sobe no banco (linha 8); CHEGUEI CEDO (o grito na cena, linha 12)
    mel(tuba, 22, ['r:2 F2:2 r:2 A2:2 r:8'], { vel: 0.8 });
    drum(bl, 22, 1, '........X.......', { pitch: 12 });
    mel(met2, 22, ['r:12 F4+A4:2 r:2'], { vel: 0.6 });
    mel(pc, 22, ['r:8 G6:1 E6:1 r:6'], { vel: 0.4 });
    // 23 · espera: o grilo, e a plateia ri baixinho no fim
    grilo.note(23 * 16 + 1, 0, 0, 1);
    risoC.note(23 * 16 + 10, 0, 0, 0.7);
    // 24 · tela final: SOC-CER-MON em Fá com as palmas; a banda fecha na linha 8... e a tuba responde sozinha, atrasada
    drum(cr, 24, 1, 'X...............');
    drum(kk, 24, 1, 'X...x...X.......');
    drum(hh, 24, 1, 'x.x.x.x.x.......', { vel: 0.8 });
    mel(bs, 24, ['F2:2 F3:2 C2:2 C3:2 F2:4 r:4']);
    stabs(gt, 24, 'F', [2, 6], { low: 60, n: 3 });
    mel(met, 24, [GANCHO.em({ tom: 5, oitava: -1 })]);
    mel(pc, 24, [GANCHO.em({ tom: 5 })], { vel: 0.7 });
    drum(cl, 24, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(ep, 24, 'F', 12, { low: 57, n: 4, vel: 0.5 });
    mel(tuba, 24, ['r:12 F2:1 r:1 F1:2'], { vel: 1 });
    return S;
}
