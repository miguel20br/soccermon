// Vestiário do Pallet FC, "A foto do time": trilha PROVISÓRIA do episódio 1 (3ª versão, 27 compassos, 54 s; roteiro em
// trailer/curtas/vestiario-foto/ROTEIRO.md). Os mesmos timbres e a mesma vinheta do EP "O atrasado" (funk em Fá) a
// 120 BPM: compasso = 2 s, um plano por compasso. A história é um dominó (cada coisa acontece por causa da anterior):
// aplauso em cada entrada, o clique e a risada em cada foto. O clique e a plateia (riso, aplauso, "awww") são gravações
// CC0 em scripts/musica/amostras/ (créditos no ROTEIRO); os gritos são clipes na cena.
//   0–1 abertura (as letras quicam, o Snorlax cai na placa, o Magikarp pula por cima) | 2 o Snorlax dorme | 3 FOTO DO
//   TIME! | 4 o Magikarp na frente da lente | 5 foto 1 | 6 o Psyduck segura a cabeça | 7 o Pikachu pula no Magikarp e o
//   choquinho acerta a câmera | 8 foto 2 (queimada) | 9 o Squirtle apaga a câmera e encharca o Pikachu | 10 foto 3 |
//   11 a pose do Squirtle | 12 EU TAMBÉM! (POOF) | 13 a briga | 14 foto 4 | 15 CALMA, GENTE… | 16 a canção de ninar |
//   17 o bigode | 18 foto 5 | 19 o timer (3, 2) | 20 NÃO TÁ FALTANDO NINGUÉM, NÉ? | 21 todos se olham, NÃO!, o 1 |
//   22–23½ a FOTO FINAL | 23½–27 a tela final: SOC-CER-MON, silêncio, o grilo, …JÁ TIRARAM? e a risada

import { aparece, kazoo, mola, splash } from '../curtas.mjs';
import { amostra, bass, drum, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { apito, barriga, bzzt, deslize, ronco } from './livre-ginasio.mjs';

export const meta = { titulo: 'A foto do time', tela: 'Vestiário do Pallet FC' };

export default function foto() {
    const S = new Song({ bpm: 120, bars: 27, swing: 0.12, tail: 2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1.1, rev: 0.2 });
    const sino = S.part('sino', I.bell, { pan: 0.15, gain: 0.5, rev: 0.3 });
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
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.2, gain: 0.5 });
    const bo = S.part('boing', mola(), { pan: 0.25, gain: 1.1, rev: 0.2 });
    const zap = S.part('zap', deslize(900, 2800, 0.07), { drum: true, pan: 0.2, gain: 0.6, rev: 0.1 });
    const choque = S.part('choque', bzzt, { drum: true, gain: 0.5 });
    const sobe = S.part('sobe', deslize(300, 1400, 0.3), { drum: true, gain: 0.45, rev: 0.2 });
    const desce = S.part('desce', deslize(1200, 300, 0.9), { drum: true, gain: 0.35, rev: 0.25 });
    const passo = S.part('passo', barriga, { drum: true, gain: 0.55 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.6, rev: 0.15 });
    const agua = S.part('agua', splash, { pan: 0.15, gain: 1, rev: 0.2 });
    const apt = S.part('apito', apito(0.25), { drum: true, gain: 0.35, rev: 0.2 });
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
    /** A vinheta de sitcom do Vestiário (a mesma do EP "O atrasado"): F · Dm7 · Bb · C7. */
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
    /** Quem fala: a fanfarrinha (o grito é clipe na cena, no 1). */
    const fala = (b, c, frase, frase2) => {
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
    /** O gancho SOC-CER-MON (o G-E-C do GANCHO levado pra Fá) a partir da linha absoluta `t`. */
    const gancho = (p, t, base, vel = 1) => {
        for (const [dt, iv, len] of [
            [0, 7, 3],
            [3, 4, 3],
            [6, 12, 6],
        ])
            p.note(t + dt, base + iv, len, vel);
    };

    // 0 · abertura: a vinheta; cada letra que quica é uma nota do pícolo (linhas 2 a 10, a bola no BOING da 8) e o
    //     Snorlax cai em cima da placa na linha 12 (a barriga e o tímpano)
    vinheta(0);
    mel(pc, 0, ['r:2 C6:1 D6:1 E6:1 F6:1 G6:1 A6:1 r:1 Bb6:1 C7:1 r:5'], { vel: 0.55 });
    bo.note(8, 0, 0, 0.8);
    drum(passo, 0, 1, '............x...', { pitch: -5 });
    drum(tp, 0, 1, '............X...');
    // 1 · EPISÓDIO 1 (o prato e o "ta" no 1), as orelhas do Pikachu (o pícolo, linha 4), o Magikarp pula por cima da
    //     placa (sobe na 6, as letras fazem a ola, o "ta-dá" na 12)
    drum(cr, 1, 1, 'X...........X...');
    drum(kk, 1, 1, 'X...x...x...X...');
    drum(cl, 1, 1, '....X.......X...', { vel: 0.8 });
    drum(hh, 1, 1, 'x.x.x.x.x.x.....', { vel: 0.7 });
    stabs(ep, 1, 'Bb', [0, 2], { low: 58, n: 4 });
    stabs(ep, 1, 'C7', [4, 6, 8], { low: 55, n: 4 });
    stabs(ep, 1, 'F', [12], { low: 57, n: 4, len: 4 });
    mel(met, 1, ['D5:2 F5:2 r:8 C5:1 r:1 F5:2']);
    mel(met2, 1, ['Bb4:2 D5:2 r:8 G4:1 r:1 A4:2'], { vel: 0.8 });
    mel(bs, 1, ['Bb1:2 Bb2:2 C2:2 C3:2 C2:4 F2:4']);
    mel(pc, 1, ['r:4 A6:1 r:1 A6:1 r:9'], { vel: 0.5 });
    sobe.note(16 + 6, 0, 0, 1);
    mel(pc, 1, ['r:7 C6:1 D6:1 E6:1 F6:1 G6:1 r:4'], { vel: 0.4 });
    // 2 · o vestiário: o Snorlax já dorme no banco (aplauso de abertura, o ronco, riso) e o Psyduck mexe no tripé
    entra(2, 'F7', { leve: true });
    zz.note(2 * 16 + 4, 0, 0, 1);
    risoC.note(2 * 16 + 7, 0, 0, 0.8);
    zz.note(2 * 16 + 12, 0, 0, 0.8);
    // 3 · FOTO DO TIME! (o grito do Psyduck no 1)
    fala(3, 'F7', 'C5:2 F5:2 A5:4 r:8', 'A4:2 C5:2 F5:4 r:8');
    // 4 · o Magikarp pula na frente da lente (aplauso; o pícolo sobe, BOING no pouso na 6), estufa a medalha (8), apita e
    //     brilha (10)
    entra(4, 'F7');
    mel(pc, 4, ['C6:1 D6:1 E6:1 F6:1 r:12'], { vel: 0.7 });
    bo.note(4 * 16 + 6, 0, 0, 1);
    sobe.note(4 * 16 + 8, 0, 0, 1);
    apt.note(4 * 16 + 10, 0, 0, 1);
    mel(sino, 4, ['r:10 C7:2 F7:4'], { vel: 0.6 });
    // 5 · foto 1: só a medalha
    foto(5, 'Bb7', risoC, 6);
    // 6 · o Psyduck segura a cabeça (a tuba desce meio tom por vez)
    drum(hh, 6, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(tuba, 6, ['F2:4 E2:4 Eb2:4 D2:4'], { vel: 0.7 });
    desce.note(6 * 16, 0, 0, 0.8);
    risoM.note(6 * 16 + 5, 0, 0, 1);
    // 7 · o Pikachu (aplauso) pula em cima do Magikarp (BOING na 6) e, na empolgação, o choquinho (zaps 10 e 11) acerta a
    //     câmera (o bzzt e o tímpano na 12)
    entra(7, 'F7');
    sobe.note(7 * 16, 0, 0, 1);
    bo.note(7 * 16 + 6, 0, 0, 1);
    drum(zap, 7, 1, '..........xx....', { vel: 1 });
    choque.note(7 * 16 + 12, 0, 0, 1);
    drum(tp, 7, 1, '............X...');
    drum(cr, 7, 1, '............X...', { vel: 0.6 });
    // 8 · foto 2: queimada
    foto(8, 'Db7', risoM);
    drum(zap, 8, 1, '..x.....x.......', { vel: 0.5, pitch: -7 });
    // 9 · o Squirtle entra devagar (aplauso, o baixo arrastado) e apaga a câmera com o jato (linha 7), que encharca o
    //     Pikachu; a fumaça some num chiado (9)
    drum(cr, 9, 1, 'X...............', { vel: 0.6 });
    aplauso.note(9 * 16, 0, 0, 0.8);
    drum(kk, 9, 1, 'X.......X.......');
    drum(sn, 9, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 9, 1, 'x...x...x...x...', { vel: 0.6 });
    mel(bs, 9, ['F2:4 r:3 Eb2:4 r:3 C2:2']);
    stabs(gt, 9, 'F7', [4, 12], { low: 60, n: 3, vel: 0.7 });
    mel(agua, 9, ['r:7 C5:2 G4:2 E4:2 C4:3']);
    desce.note(9 * 16 + 10, 0, 0, 0.6);
    risoC.note(9 * 16 + 12, 0, 0, 0.9);
    // 10 · foto 3: o Pikachu encharcado, o Squirtle tranquilo
    foto(10, 'Bb7', risoG, 2);
    // 11 · a pose de descolado: os óculos descem (o metal escorrega meio tom por vez) e o Ditto, no banco, se encanta
    //      (o sino na 12)
    drum(hh, 11, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(met2, 11, ['F4:4 E4:4 Eb4:4 D4:4'], { vel: 0.6 });
    mel(bs, 11, ['F2:4 E2:4 Eb2:4 D2:4'], { vel: 0.8 });
    mel(sino, 11, ['r:12 A6:1 C7:1 F7:2'], { vel: 0.6 });
    // 12 · EU TAMBÉM! (o grito no 1; o kazoo copia a fanfarrinha), POOF (6): um Squirtle idêntico, de óculos abaixados
    fala(12, 'F7', null, null);
    mel(kz, 12, ['C5:2 F5:2 A5:4 r:8']);
    poof.note(12 * 16 + 6, 0, 0, 1);
    stabs(met, 12, 'F', [6], { low: 60, n: 3, vel: 0.8 });
    risoC.note(12 * 16 + 10, 0, 0, 0.9);
    // 13 · a briga: os dois Squirtles discutem (o funk inteiro, o tímpano a cada empurrão), o Pikachu e o Magikarp entram
    //      e vira a nuvem de poeira (o prato na 10)
    groove(13, 'F7');
    drum(tp, 13, 1, '..X...X...X.X...');
    drum(cr, 13, 1, '..........X.....', { vel: 0.7 });
    drum(sn, 13, 1, '..........xxxxXX', { vel: 0.6 });
    risoM.note(13 * 16 + 11, 0, 0, 1);
    // 14 · foto 4: dois Squirtles se encarando
    foto(14, 'Db7', risoG);
    // 15 · CALMA, GENTE… (o aplauso de entrada, o grito na 5, o piano todo doce); a briga ainda bate lá atrás
    drum(cr, 15, 1, 'X...............', { vel: 0.6 });
    aplauso.note(15 * 16, 0, 0, 0.8);
    drum(tp, 15, 1, 'x...x...........', { vel: 0.6 });
    drum(hh, 15, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
    mel(bs, 15, ['F2:4 r:4 C2:4 r:4'], { vel: 0.7 });
    stabs(ep, 15, 'F', [6], { low: 60, n: 4, len: 4 });
    stabs(ep, 15, 'Bb', [10], { low: 60, n: 4, len: 6 });
    mel(pc, 15, ['r:8 A6:1 C7:1 F7:2 r:4'], { vel: 0.5 });
    // 16 · a canção: o funk para, sobra a canção de ninar (pícolo e piano); cada um cai no sono (o ronco nas linhas 3 e
    //      6, o escorregão na 7); na linha 10 ele percebe: o tímpano e o metal bravo
    mel(pc, 16, ['C6:3 A5:1 F5:2 A5:2 G5:2 r:6'], { vel: 0.9 });
    stabs(ep, 16, 'F', [0], { low: 57, n: 4, len: 4, vel: 0.6 });
    stabs(ep, 16, 'C7', [4], { low: 55, n: 4, len: 4, vel: 0.6 });
    mel(bs, 16, ['F2:4 C2:4 r:8'], { vel: 0.6 });
    zz.note(16 * 16 + 3, 0, 0, 0.8);
    zz.note(16 * 16 + 6, 0, 0, 0.8);
    desce.note(16 * 16 + 7, 0, 0, 0.8);
    drum(tp, 16, 1, '..........X.X...');
    stabs(met, 16, 'Db7', [10], { low: 55, n: 4, len: 3 });
    stabs(met2, 16, 'Db7', [12], { low: 52, n: 4, len: 3, vel: 0.8 });
    risoC.note(16 * 16 + 12, 0, 0, 0.9);
    // 17 · o bigode: a caneta risca (linhas 2 a 12), o ronco por baixo; risada grande no fim
    zz.note(17 * 16, 0, 0, 0.8);
    mel(bs, 17, ['F1:6 r:2 C2:6 r:2'], { vel: 0.7 });
    drum(risca, 17, 1, '..x.x.x.x.x.x...');
    drum(sn, 17, 1, '............X...', { vel: 0.6 });
    risoG.note(17 * 16 + 13, 0, 0, 1);
    // 18 · foto 5: todo mundo dormindo, o Snorlax de bigode
    foto(18, 'Db7', risoM);
    zz.note(18 * 16 + 8, 0, 0, 0.7);
    // 19 · o timer: o Psyduck aperta (o bip na 2) e corre; os bips do 3 (4) e do 2 (8) acordam todo mundo (o prato e o
    //      metal na 8), que corre pro lugar da foto (a caixa sobe)
    desce.note(19 * 16, 0, 0, 0.6);
    mel(bip, 19, ['r:2 C6:1 r:1 C6:2 r:2 C6:2 r:6']);
    drum(hh, 19, 1, '....x.x.x.x.x.x.', { vel: 0.8 });
    drum(kk, 19, 1, '....X...X...X...', { vel: 0.9 });
    drum(sn, 19, 1, '........x.x.xxxx', { vel: 0.8 });
    drum(cr, 19, 1, '........X.......', { vel: 0.8 });
    stabs(met, 19, 'F', [8], { low: 60, n: 3, len: 2 });
    mel(bs, 19, ['F2:2 r:2 F2:2 r:2 F2:1 F3:1 C3:1 A2:1 F2:1 C2:1 r:2']);
    sobe.note(19 * 16 + 9, 0, 0, 1);
    risoC.note(19 * 16 + 11, 0, 0, 0.7);
    // 20 · NÃO TÁ FALTANDO NINGUÉM, NÉ? (o grito do capitão no 1): o suspense, o tímpano rufando baixinho
    drum(tp, 20, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
    mel(bs, 20, ['C2:16'], { vel: 0.6 });
    padChord(ep, 20, 'C7', 16, { low: 55, n: 4, vel: 0.35 });
    // 21 · todos se olham (o bloco, tique-taque, linhas 0 a 7), NÃO! (todos juntos, o prato na 8) e o bip do 1 (12)
    drum(bl, 21, 1, 'x.x.x.x.........', { vel: 0.8 });
    drum(cr, 21, 1, '........X.......');
    drum(kk, 21, 1, '........X.......');
    stabs(met, 21, 'F', [8], { low: 60, n: 4, len: 2 });
    stabs(met2, 21, 'F', [8], { low: 53, n: 4, len: 2, vel: 0.8 });
    mel(bs, 21, ['r:8 F2:2 r:6']);
    risoC.note(21 * 16 + 9, 0, 0, 0.8);
    mel(bip, 21, ['r:12 F6:2 r:2']);
    drum(sn, 21, 1, '............xxXX', { vel: 0.8 });
    // 22–23½ · a FOTO FINAL: o clique (no 1) e o "tan-tan-TAAN"; "awww" (linha 6) e o aplauso (linha 12)
    clique.note(22 * 16, 0, 0, 1);
    drum(tp, 22, 1, 'x.x.X...........');
    drum(kk, 22, 1, 'X.X.X...........');
    drum(cr, 22, 1, '....X...........');
    mel(bs, 22, ['C2:1 r:1 C2:1 r:1 F1:8 r:4']);
    mel(met, 22, ['C5:1 r:1 C5:1 r:1 F5:8 r:4']);
    mel(met2, 22, ['G4:1 r:1 G4:1 r:1 A4:8 r:4']);
    stabs(ep, 22, 'F', [4], { low: 57, n: 4, len: 12 });
    aww.note(22 * 16 + 6, 0, 0, 1);
    aplauso.note(22 * 16 + 12, 0, 0, 1);
    padChord(ep, 23, 'F', 8, { low: 57, n: 4, vel: 0.4 });
    // 23½–24½ · a tela final: SOC-CER-MON em Fá com as palmas (a piscada do logo nas linhas 8, 11 e 14 do 23)
    drum(cr, 23, 1, '........X.......');
    drum(kk, 23, 1, '........X...x...');
    drum(kk, 24, 1, 'X...x...........');
    drum(hh, 23, 1, '........x.x.x.x.', { vel: 0.8 });
    drum(hh, 24, 1, 'x.x.x...........', { vel: 0.8 });
    mel(bs, 23, ['r:8 F2:2 F3:2 C2:2 C3:2']);
    mel(bs, 24, ['F2:4 r:12']);
    stabs(gt, 23, 'F', [10, 14], { low: 60, n: 3 });
    gancho(met, 23 * 16 + 8, 65);
    gancho(pc, 23 * 16 + 8, 77, 0.7);
    drum(cl, 24, 1, '....x.x.........', { vel: 0.9 });
    padChord(ep, 24, 'F', 8, { low: 57, n: 4, vel: 0.45 });
    // 24½–26 · com a tela no ar, o Slowpoke entra DEVAGAR pelo lado (a tuba arrastada) e para no meio (25, linha 8):
    //          silêncio, só o grilo
    mel(tuba, 24, ['r:8 F1:3 r:1 C1:3 r:1']);
    mel(tuba, 25, ['F1:3 r:1 C1:3 r:9'], { vel: 0.8 });
    grilo.note(25 * 16 + 8, 0, 0, 0.8);
    // 26 · …JÁ TIRARAM? (o grito lento na linha 2); a plateia explode (linha 5) e a tuba responde atrasada; o vídeo
    //      acaba na tela final, no meio da risada
    risoG.note(26 * 16 + 5, 0, 0, 1);
    mel(tuba, 26, ['r:11 F2:1 r:1 F1:3'], { vel: 0.9 });
    return S;
}
