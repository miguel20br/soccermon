// Vestiário do Pallet FC, EP 1 "O atrasado" (roteiro em trailer/curtas/vestiario-atrasado/ROTEIRO.md). Molde da
// livre-ditto: funk em Fá, 100 BPM, 4/4, compasso = 2,4 s, 15 compassos (36 s).
// A piada da música é a do episódio: o motivo do Slowpoke na tuba responde SEMPRE um tempo atrasado (a banda chama no
// 1, ele entra no 2: F2 A2 C3 Eb3, um bocejo que sobe). Os passos dele são o bloco de madeira a mil em semicolcheias
// (corre parado). A vinheta é de sitcom anos 90 (piano elétrico, metais, clap 808, "ta-dá"). Breque no apito, o
// "zum" da lousa girando e o acorde do placar; a música para quando a ficha não cai (a tuba tenta a primeira nota e
// desiste); a luz apaga (clique) e só sobra o grilo. O "!" é um golpe da banda (o grito dele em meia velocidade é o
// som de assinatura, na cena); o congelamento tem o "tan-tan-TAAN" de sitcom e a vinheta volta com o aplauso. No
// fim, SOC-CER-MON; a banda fecha e a tuba ainda responde, sozinha, atrasada.
// Plateia e grilo: gravações CC0 do Freesound (créditos no ROTEIRO), em scripts/musica/amostras/.

import { splash } from '../curtas.mjs';
import { amostra, bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { deslize, ronco } from './livre-ginasio.mjs';

export const meta = { titulo: 'O atrasado', tela: 'Vestiário do Pallet FC (EP 1)' };

/** O motivo do Slowpoke (um compasso, Fá): entra um tempo atrasado e sobe bocejando até a sétima. */
export const MOTIVO = 'r:4 F2:3 r:1 A2:2 C3:2 Eb3:3 r:1';

export default function atrasado() {
    const S = new Song({ bpm: 100, bars: 15, swing: 0.12, tail: 3 });
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
    // 1 · vinheta anos 90: VESTIÁRIO DO PALLET FC
    vinheta(1);
    // 2 · volta: ainda correndo no mesmo lugar; a plateia ri
    corre(2);
    risoC.note(2 * 16 + 2, 0, 0, 1);
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
    // 6 · o apito (na cena, no 1): breque; a lousa gira (o zum na linha 8) e o acorde do placar; a plateia explode
    drum(kk, 6, 1, 'X.......X.......');
    stabs(met, 6, 'F7', [0], { low: 57, n: 4, len: 1 });
    stabs(gt, 6, 'F7', [0], { low: 60, n: 3 });
    mel(bs, 6, ['F2:1 r:7 F1:4 r:4']);
    zum.note(6 * 16 + 7, 0, 0, 1);
    drum(cr, 6, 1, '........X.......');
    drum(tp, 6, 1, '........X.......');
    stabs(met, 6, 'Bb7', [8], { low: 56, n: 4, len: 4 });
    stabs(met2, 6, 'Bb7', [8], { low: 50, n: 3, len: 4 });
    risoG.note(6 * 16 + 10, 0, 0, 1);
    // 7–8 · a lousa: groove leve debaixo da risada; ele lê (a tuba cada vez mais lenta)
    groove(7, 'F7', { leve: true });
    mel(tuba, 7, [MOTIVO], { vel: 0.7 });
    groove(8, 'Bb9', { leve: true });
    mel(tuba, 8, ['r:8 Bb1:4 D2:4'], { vel: 0.7 });
    // 9 · nada: a música para; a tuba tenta a primeira nota e desiste; o Snorlax ronca
    mel(tuba, 9, ['r:4 F2:2 r:10'], { vel: 0.6 });
    zz.note(9 * 16 + 8, -3, 0, 0.6);
    // 10 · "...": silêncio; o Pikachu ri (o grito na cena, linha 8) e a plateia junto
    risoM.note(10 * 16 + 8, 0, 0, 0.9);
    // 11 · a luz apaga (clique no 1) e só sobra o grilo
    drum(bl, 11, 1, 'X...............', { pitch: 14, vel: 1.2 });
    drum(bl, 11, 1, '.x..............', { pitch: 7, vel: 0.6 });
    grilo.note(11 * 16 + 3, 0, 0, 1);
    // 12 · a ficha cai: o golpe da banda no 1 (com o grito dele em meia velocidade, na cena); congela na linha 8 com o
    // "tan-tan-TAAN" de sitcom
    drum(cr, 12, 1, 'X...........X...');
    drum(tp, 12, 1, 'X.......x.x.X...');
    drum(kk, 12, 1, 'X.......X.X.X...');
    stabs(met, 12, 'Db7', [0], { low: 56, n: 4, len: 2 });
    mel(bs, 12, ['Db2:2 r:6 C2:1 r:1 C2:1 r:1 F1:4']);
    mel(met, 12, ['r:8 C5:1 r:1 C5:1 r:1 F5:4']);
    mel(met2, 12, ['r:8 G4:1 r:1 G4:1 r:1 A4:4']);
    stabs(ep, 12, 'F', [12], { low: 57, n: 4, len: 4 });
    // 13 · congelado (EP 1 · O ATRASADO): a vinheta volta, com o aplauso
    vinheta(13, { aplaude: true });
    // 14 · tela final: SOC-CER-MON em Fá com as palmas; a banda fecha na linha 8... e a tuba responde sozinha, atrasada
    drum(cr, 14, 1, 'X...............');
    drum(kk, 14, 1, 'X...x...X.......');
    drum(hh, 14, 1, 'x.x.x.x.x.......', { vel: 0.8 });
    mel(bs, 14, ['F2:2 F3:2 C2:2 C3:2 F2:4 r:4']);
    stabs(gt, 14, 'F', [2, 6], { low: 60, n: 3 });
    mel(met, 14, [GANCHO.em({ tom: 5, oitava: -1 })]);
    mel(pc, 14, [GANCHO.em({ tom: 5 })], { vel: 0.7 });
    drum(cl, 14, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(ep, 14, 'F', 12, { low: 57, n: 4, vel: 0.5 });
    mel(tuba, 14, ['r:12 F2:1 r:1 F1:2'], { vel: 1 });
    return S;
}
