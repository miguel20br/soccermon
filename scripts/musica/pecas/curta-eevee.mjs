// Eevee escolhe (trilha pra curta com votação, 22/10/2026). Eevee dribla com o motivo dele (Sol-Si-Ré-Mi-Ré-Si-Lá,
// uma pergunta que termina no ar), três zagueiros fecham a passagem e, no banco, as três pedras acendem: cada uma toca
// o começo do motivo no seu timbre (Água: sino e bolhas; Trovão: pulso fino e choque; Fogo: metais e estalo). Depois
// o motivo passa de pedra em pedra, uma nota cada (a câmera pulando), e para no branco: o vídeo pode parar aqui pra
// votação. Três finais, um arquivo cada (o tronco é idêntico), todos um tom acima (Sol → Lá, a evolução) e com o
// SOC-CER-MON no gol, subindo mais um tom:
// - Vaporeon: Lá lídio, cascata de sinos, ela derrete em água e escorre por baixo dos zagueiros; Jato d'Água.
// - Jolteon: acelera pra 132 BPM, arpejo de 16 avos, cada choque um zigue-zague; o placar entra em curto no fim.
// - Flareon: mambo (120 BPM): metais, montuno, cowbell e clave; a rede pega fogo; o goleiro assopra as luvas.
// Tronco: Sol maior, funk leve, 112 BPM, 8 compassos (~17 s). Finais: 7 compassos. ~30 a 32 s cada, sem loop.
import { bolhas, fogo, roteiro, sobe, splash } from '../curtas.mjs';
import { arp, bass, drum, GANCHO, I, mel, midi, padChord, Song, stabs } from '../synth.mjs';
import { bzzt, chute, deslize, rede, torcida, zap } from './livre-ginasio.mjs';
import { UA } from './livre-snorlax.mjs';

export const meta = {
    titulo: 'Eevee escolhe',
    tela: 'Curta (vídeo) com votação: Vaporeon, Jolteon ou Flareon',
    premissa:
        'Eevee dá de cara com a parede de zagueiros e tem que escolher uma pedra: o vídeo para, quem assiste vota, e cada final (Vaporeon, Jolteon, Flareon) tem a sua música.',
};

const MOT = 'G5:2 B5:2 D6:2 E6:1 D6:1 B5:2 A5:6';
const NOTAS = ['G5', 'B5', 'D6', 'E6', 'D6', 'B5', 'A5'];

function tronco(bpmFinal) {
    const S = new Song({ bpm: 112, bars: 15, swing: 0.08, tail: 4, bpmAt: (b) => (b < 8 ? 112 : bpmFinal) });
    const { cena, ev } = roteiro(S);
    // a evolução cresce: o tronco a 80%, o final no volume inteiro
    S.masterAt = (t) => (S.barAt(t) < 8 ? 0.8 : 1);
    const P = {
        lead: S.part('lead', I.counter, { pan: -0.1, gain: 1.3, rev: 0.2 }),
        mar: S.part('marimba', I.pizz, { pan: 0.25, gain: 1.2, rev: 0.2 }),
        sino: S.part('sino', I.bell, { pan: 0.3, gain: 1.6, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 }),
        pul: S.part('pulso', I.thin, { pan: -0.3, gain: 0.75, corte: 3200, rev: 0.15 }),
        met: S.part('metais', I.brass, { pan: 0.1, gain: 0.7, corte: 3000, rev: 0.2 }),
        pad: S.part('pad', I.pad, { gain: 0.8, rev: 0.4 }),
        bs: S.part('baixo', I.slap, { gain: 0.6 }),
        stab: S.part('acordes', I.stab, { pan: -0.2, gain: 1, corte: 2800 }),
        k: S.part('bumbo', I.kick, { drum: true, gain: 0.5 }),
        cl: S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.85 }),
        hh: S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.1 }),
        sn: S.part('caixa', I.snare, { drum: true, gain: 0.35 }),
        cr: S.part('prato', I.crash, { drum: true, gain: 0.45 }),
        bo: S.part('bolhas', bolhas, { drum: true, pan: 0.3, gain: 0.55, rev: 0.3 }),
        zp: S.part('choque', zap, { drum: true, pan: -0.3, gain: 0.6, echo: { rows: 3, fb: 0.3, mix: 0.3 } }),
        fg: S.part('fogo', fogo(0.8), { drum: true, pan: 0.1, gain: 0.6, rev: 0.2 }),
        luz: S.part('luz', sobe(0.85), { drum: true, gain: 0.45, rev: 0.4 }),
        ch: S.part('chute', chute, { drum: true, gain: 0.9 }),
        rd: S.part('rede', rede, { drum: true, gain: 0.8, rev: 0.3 }),
        tc: S.part('torcida', torcida(6, 0.08, 2.5), { drum: true, gain: 0.5, rev: 0.3 }),
    };
    P.funk = (b, c, { leve = false } = {}) => {
        bass(P.bs, b, c, '0:2 r:1 0:1 8:1~ r:1 5:2 r:2 s:2 8:1~ r:1 5:2');
        drum(P.k, b, 1, leve ? 'x.........x.....' : 'X.....x...x.....', { vel: 0.8 });
        drum(P.cl, b, 1, '....x.......x...', { vel: 0.65 });
        drum(P.hh, b, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.5 });
    };

    // o motivo: uma pergunta
    cena(0, 'Eevee');
    mel(P.lead, 0, [MOT]);
    stabs(P.mar, 0, 'G', [0, 3, 6], { low: 55, n: 3 });
    stabs(P.mar, 0, 'D7', [8, 11, 14], { low: 54, n: 3 });
    mel(P.bs, 0, ['G2:6 r:2 D2:6 r:2']);
    ev(0, 0, 'o motivo do Eevee (termina no ar, uma pergunta)', 'Eevee no campo com a bola, olha pra câmera');

    // dribla: o lead pergunta, a marimba responde
    cena(1, 'o drible');
    mel(P.lead, 1, [
        'G5:2 B5:2 D6:2 E6:1 D6:1 B5:2 r:6',
        'E5:2 G5:2 B5:2 C6:1 B5:1 G5:2 r:6',
        'C6:2 E6:2 G6:2 A6:1 G6:1 E6:2 r:6',
        'F#6:2 E6:2 D6:2 C6:2 A5:4 r:4',
    ]);
    mel(P.mar, 1, ['r:10 D6:1 B5:1 G5:2 r:2', 'r:10 B5:1 G5:1 E5:2 r:2', 'r:10 G5:1 E5:1 C5:2 r:2', 'r:16']);
    for (const [i, c] of ['G', 'Em7', 'Cmaj7', 'D7'].entries()) P.funk(1 + i, c);
    stabs(P.stab, 4, 'D7', [12, 14], { low: 54, n: 4, vel: 1.1 });
    drum(P.k, 4, 1, '............X.X.');
    ev(1, 0, 'funk leve; o motivo pergunta', 'Eevee dribla, saltitante');
    ev(1, 10, 'a marimba responde', 'passa pelo 1º rival');
    ev(3, 10, 'a marimba responde', 'passa pelo 2º');
    ev(4, 12, 'dois acordes secos', 'três zagueiros fecham a passagem: parede');

    // as três pedras acendem: cada uma toca o começo do motivo
    cena(5, 'as pedras');
    mel(P.sino, 5, ['G5:1 B5:1 D6:3 r:11']);
    mel(P.pul, 5, ['r:5 G5:1 B5:1 D6:3 r:6']);
    mel(P.met, 5, ['r:10 G5:1 B5:1 D6:4']);
    P.bo.note(5 * 16, 0, 0, 1);
    P.zp.note(5 * 16 + 5, 0, 0, 1);
    P.fg.note(5 * 16 + 10, 0, 0, 1);
    padChord(P.pad, 5, 'Cmaj7', 16, { low: 52, n: 4, vel: 0.6 });
    mel(P.bs, 5, ['C2:16'], { vel: 0.7 });
    ev(5, 0, 'Pedra Água: sino e bolhas', 'no banco, a Pedra Água acende');
    ev(5, 5, 'Pedra Trovão: pulso e choque', 'a Pedra Trovão acende');
    ev(5, 10, 'Pedra Fogo: metais e estalo', 'a Pedra Fogo acende. Na tela: VOTE 1, 2 ou 3');

    // o motivo passa de pedra em pedra, uma nota cada
    const vozes = [P.sino, P.pul, P.met];
    const sons = [P.bo, P.zp, P.fg];
    NOTAS.forEach((n, i) => {
        vozes[i % 3].note(6 * 16 + 2 * i, midi(n), 2, 0.9);
        sons[i % 3].note(6 * 16 + 2 * i, 0, 0, 0.35);
    });
    padChord(P.pad, 6, 'D7sus4', 16, { low: 50, n: 4, vel: 0.6 });
    mel(P.bs, 6, ['D2:16'], { vel: 0.7 });
    drum(P.hh, 6, 1, 'x.x.x.x.x.x.x...', { vel: 0.5 });
    ev(
        6,
        0,
        'o motivo passa de pedra em pedra, uma nota cada',
        'a câmera pula de pedra em pedra, cada vez mais rápido',
    );

    // o motivo sozinho, a luz, e o branco (pausa pra votação)
    cena(7, 'a escolha');
    mel(P.lead, 7, ['G5:2 B5:2 D6:2 E6:2 r:8'], { vel: 0.6 });
    mel(P.sino, 7, ['r:8 D6:1 G6:1 B6:1 D7:1 G7:2 r:2']);
    P.luz.note(7 * 16 + 8, 0, 0, 1);
    padChord(P.pad, 7, 'D7', 14, { low: 50, n: 4, vel: 0.5 });
    ev(7, 0, 'o motivo sozinho, baixinho', 'Eevee olha as três pedras, pensando');
    ev(7, 8, 'sinos e ruído subindo', 'encosta numa pedra: brilho branco');
    ev(7, 14, 'silêncio', 'branco total (aqui o vídeo pode parar pra votação)');
    return { S, P, cena, ev };
}

// o motivo um tom acima (Lá maior), a evolução
const MOT_A = ['A5:2 C#6:2 E6:2 F#6:1 E6:1 C#6:2 r:6', 'B5:2 D#6:2 F#6:2 G#6:1 F#6:1 D#6:2 r:6'];
const gancho = (T, P, voz, { palmas = true } = {}) => {
    mel(voz, 12, [GANCHO.em({ tom: 9 }), GANCHO.em({ tom: 11 })]);
    if (palmas) drum(P.cl, 12, 2, GANCHO.palmas, { vel: 1 });
    P.cr.note(12 * 16, 0, 0, 1);
    P.cr.note(13 * 16, 0, 0, 0.8);
    P.tc.note(12 * 16, 0, 0, 1);
    T.ev(12, 0, 'SOC-CER-MON em Lá, torcida', 'GOL! a torcida canta');
    T.ev(13, 0, 'SOC-CER-MON um tom acima (Si)', 'a evolução comemora');
};

function vaporeon() {
    const T = tronco(112);
    const { S, P, cena, ev } = T;
    const spl = S.part('agua', splash, { pan: -0.1, gain: 1, rev: 0.35 });
    const sb = S.part('jato', sobe(1.5), { drum: true, gain: 0.45, rev: 0.4 });
    cena(8, 'Vaporeon');
    spl.note(8 * 16, midi('A4'), 1, 1.2);
    P.bo.note(8 * 16 + 1, 0, 0, 1);
    P.cr.note(8 * 16, 0, 0, 0.6);
    mel(P.sino, 8, ['E7:1 D#7:1 C#7:1 B6:1 A6:1 G#6:1 F#6:1 E6:1 D#6:1 C#6:1 B5:1 A5:1 r:4']);
    padChord(P.pad, 8, 'Amaj7', 16, { low: 57, n: 4, vel: 0.7 });
    mel(P.bs, 8, ['A1:16'], { vel: 0.7 });
    ev(8, 0, 'ESPIRRO + cascata de sinos (Lá lídio)', 'VAPOREON surge de uma onda');
    cena(9, 'escorre');
    mel(P.lead, 9, MOT_A);
    arp(P.sino, 9, 'Amaj7', { low: 69, vel: 0.5 });
    arp(P.sino, 10, 'B', { low: 71, vel: 0.5 });
    P.funk(9, 'Amaj7', { leve: true });
    P.funk(10, 'B', { leve: true });
    P.bo.note(9 * 16 + 12, 0, 0, 1);
    P.bo.note(10 * 16 + 12, 3, 0, 1);
    ev(9, 0, 'o motivo em Lá, fluindo (arpejo nos sinos)', 'Vaporeon corre em direção à parede de zagueiros');
    ev(9, 12, 'bolhas', 'derrete em água e escorre por baixo do 1º zagueiro');
    ev(10, 12, 'bolhas', '...e do 2º, que escorrega');
    cena(11, 'Jato d’Água');
    mel(P.lead, 11, ['A5:1 B5:1 C#6:1 D#6:1 E6:1 F#6:1 G#6:1 A6:1 B6:1 C#7:1 D#7:1 E7:1 r:4']);
    sb.note(11 * 16, 0, 0, 1);
    padChord(P.pad, 11, 'E', 12, { low: 52, n: 4, vel: 0.7 });
    drum(P.sn, 11, 1, '....oooxxxxX....', { vel: 0.8 });
    P.ch.note(11 * 16 + 12, 0, 0, 1);
    spl.note(11 * 16 + 13, midi('E5'), 1, 1);
    ev(11, 0, 'escala lídia subindo, ruído', 'ela se forma de novo na frente do gol e arma o Jato d’Água');
    ev(11, 12, 'chute + espirro', 'dispara');
    cena(12, 'gol');
    P.rd.note(12 * 16, 0, 0, 1);
    spl.note(12 * 16 + 1, midi('A4'), 1, 1);
    gancho(T, P, P.sino);
    mel(P.lead, 12, [GANCHO.em({ tom: 9, oitava: -1 }), GANCHO.em({ tom: 11, oitava: -1 })], { vel: 0.8 });
    P.funk(12, 'A');
    P.funk(13, 'B');
    ev(12, 0, 'rede + espirro', 'a rede vira cachoeira');
    cena(14, 'final');
    padChord(P.pad, 14, 'Bmaj7', 12, { low: 59, n: 4, vel: 0.7 });
    mel(P.sino, 14, ['B5:1 D#6:1 F#6:1 A#6:1 B6:4 r:8']);
    mel(P.bs, 14, ['B1:8 r:8']);
    P.bo.note(14 * 16 + 8, -3, 0, 1);
    spl.note(14 * 16 + 9, midi('B4'), 1, 0.5);
    ev(14, 0, 'acorde final (Si maior com sétima)', 'Vaporeon posa');
    ev(14, 8, 'bolhas + plof', '...e derrete de preguiça numa poça');
    return S;
}

function jolteon() {
    const T = tronco(132);
    const { S, P, cena, ev } = T;
    const lead = S.part('leadJolteon', I.pulse, {
        pan: 0.1,
        gain: 1.1,
        corte: 3500,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
    });
    const bz = S.part('curto', bzzt, { drum: true, gain: 0.6 });
    const cai = S.part('apaga', deslize(420, 35, 1.4), { drum: true, gain: 0.6 });
    const carga = S.part('carga', sobe(1.2), { drum: true, gain: 0.45, rev: 0.3 });
    const rapido = (b, c) => {
        bass(P.bs, b, c, '0:2 0:2 8:2 0:2 0:2 8:2 5:2 0:2');
        drum(P.k, b, 1, 'X...x...X...x...');
        drum(P.cl, b, 1, '....x.......x...', { vel: 0.7 });
        drum(P.hh, b, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.45 });
    };
    cena(8, 'Jolteon');
    P.zp.note(8 * 16, 5, 0, 1.3);
    P.cr.note(8 * 16, 0, 0, 1);
    arp(P.pul, 8, 'A', { low: 69 });
    rapido(8, 'A');
    ev(8, 0, 'CHOQUE + prato; acelera pra 132', 'JOLTEON, com o pelo em pé');
    cena(9, 'zigue-zague');
    mel(lead, 9, ['A5:2 C#6:2 E6:2 F#6:1 E6:1 C#6:2 B5:6', 'D6:2 F#6:2 A6:2 B6:1 A6:1 F#6:2 E6:6']);
    arp(P.pul, 9, 'A', { low: 69, vel: 0.6 });
    arp(P.pul, 10, 'D', { low: 66, vel: 0.6 });
    rapido(9, 'A');
    rapido(10, 'D');
    drum(P.zp, 9, 1, 'x...x...x...x...', { pitch: 3, vel: 0.7 });
    drum(P.zp, 10, 1, 'x..x..x.x..x..x.', { pitch: 3, vel: 0.7 });
    ev(9, 0, 'o motivo no pulso; um choque por batida', 'zigue-zague em raio: cada choque, uma virada');
    ev(10, 0, 'choques no 3-3-2', 'passa pelos três zagueiros, que ficam girando');
    cena(11, 'Trovão');
    mel(P.pul, 11, ['E6:1 E6:1 E6:1 E6:1 F#6:1 F#6:1 F#6:1 F#6:1 G#6:1 G#6:1 G#6:1 G#6:1 r:4']);
    carga.note(11 * 16, 0, 0, 1);
    drum(P.sn, 11, 1, 'xxxxxxxxXXXX....', { vel: 0.7 });
    mel(P.bs, 11, ['E2:12 r:4']);
    P.ch.note(11 * 16 + 12, 0, 0, 1);
    P.zp.note(11 * 16 + 12, 7, 0, 1.3);
    ev(11, 0, 'carga: semicolcheias subindo, rufo', 'para, carrega: faíscas no corpo todo');
    ev(11, 12, 'chute + CHOQUE', 'chuta um raio');
    cena(12, 'gol');
    P.rd.note(12 * 16, 0, 0, 1);
    gancho(T, P, lead);
    mel(P.met, 12, [GANCHO.em({ tom: 9, oitava: -1 }), GANCHO.em({ tom: 11, oitava: -1 })], { vel: 0.8 });
    drum(P.zp, 12, 2, GANCHO.palmas, { pitch: 5, vel: 0.6 });
    rapido(12, 'A');
    rapido(13, 'B');
    ev(12, 0, 'rede', 'a rede fica eletrificada');
    ev(12, 12, 'palmas e choques "hey hey"', 'a torcida bate palma; faísca a cada palma');
    cena(14, 'final');
    stabs(P.met, 14, 'B', [[0, 3]], { low: 59, n: 4 });
    mel(P.bs, 14, ['B1:3 r:13']);
    bz.note(14 * 16 + 4, 0, 0, 1);
    cai.note(14 * 16 + 5, 0, 0, 1);
    P.zp.note(14 * 16 + 13, 9, 0, 0.5);
    ev(14, 0, 'acorde curto', 'Jolteon comemora encostado no placar');
    ev(14, 4, 'zumbido de curto + tudo descendo', 'o placar eletrônico entra em curto e apaga');
    ev(14, 13, 'choquinho', 'no escuro, só o pelo dele faísca');
    return S;
}

function flareon() {
    const T = tronco(120);
    const { S, P, cena, ev } = T;
    const ep = S.part('montuno', I.epiano, { pan: -0.25, gain: 1.4, rev: 0.2 });
    P.met.gain = 1.15; // no mambo os metais são o lead
    const cow = S.part('cowbell', I.agogo, { drum: true, pan: 0.35, gain: 0.6 });
    const cla = S.part('clave', I.block, { drum: true, pan: -0.35, gain: 0.6 });
    const tb = S.part('timbal', I.tom, { drum: true, pan: 0.2, gain: 0.35 });
    const fgG = S.part('labareda', fogo(1.6), { drum: true, gain: 0.75, rev: 0.25 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.8, corte: 2200, rev: 0.25 });
    const sb = S.part('lanca', sobe(1.5), { drum: true, gain: 0.4, rev: 0.3 });
    const MONTUNO = 'A4+C#5:1 r:1 E5:1 A4+C#5:1 r:1 G5:1 A4+C#5:1 r:1 E5:1 r:1 A4+C#5:1 r:1 G5:1 E5:1 r:2';
    const mambo = (b, c, s) => {
        mel(ep, b, [MONTUNO], { shift: s, vel: 0.8 });
        bass(P.bs, b, c, 'r:6 5:6 0:4');
        drum(cow, b, 1, 'x...x.x.x...x.x.', { pitch: -5, vel: 0.8 });
        drum(cla, b, 1, 'x..x..x...x.x...', { vel: 0.8 });
        drum(P.k, b, 1, 'x.....x.........', { vel: 0.7 });
        drum(tb, b, 1, '..............xx', { vel: 0.6 });
    };
    cena(8, 'Flareon');
    fgG.note(8 * 16, 0, 0, 1);
    stabs(P.met, 8, 'A7', [[0, 6]], { low: 55, n: 4, vel: 1.1 });
    P.cr.note(8 * 16, 0, 0, 1);
    drum(tb, 8, 1, '........xxxxXXXX', { vel: 0.7 });
    mel(P.bs, 8, ['A1:4 r:12']);
    drum(cow, 8, 1, '........x.x.x.xx', { pitch: -5, vel: 0.8 });
    ev(8, 0, 'LABAREDA + metais (Lá7) + prato; mambo a 120', 'FLAREON surge numa labareda');
    ev(8, 8, 'timbal rufando', 'sacode o pelo, que solta faísca');
    cena(9, 'mambo');
    mel(P.met, 9, [
        'A5:2 C#6:2 E6:2 F#6:1 E6:1 C#6:2 r:2 A5:1 r:1 A5:2',
        'D6:2 F#6:2 A6:2 B6:1 A6:1 F#6:2 r:2 D6:1 r:1 D6:2',
    ]);
    mambo(9, 'A7', 0);
    mambo(10, 'D7', 5);
    P.fg.note(9 * 16 + 12, 0, 0, 1);
    P.fg.note(10 * 16 + 12, 2, 0, 1);
    ev(9, 0, 'mambo: o motivo nos metais, montuno, cowbell e clave', 'Flareon avança dançando');
    ev(9, 12, 'estalo de fogo', 'o 1º zagueiro pula: queimou o pé');
    ev(10, 12, 'estalo de fogo', 'o 2º sai correndo, com a bunda fumegando');
    cena(11, 'Lança-chamas');
    mel(P.met, 11, ['E5:2 G#5:2 B5:2 D6:2 E6:2 G#6:2 r:4']);
    mambo(11, 'E7', 7);
    sb.note(11 * 16, 0, 0, 1);
    drum(tb, 11, 1, '........xxxxXXXX', { vel: 0.8 });
    P.ch.note(11 * 16 + 12, 0, 0, 1);
    fgG.note(11 * 16 + 12, 3, 0, 0.9);
    ev(11, 0, 'metais subindo, timbal', 'arma o chute: a bola pega fogo');
    ev(11, 12, 'chute + labareda', 'Lança-chamas no gol');
    cena(12, 'gol');
    P.rd.note(12 * 16, 0, 0, 1);
    P.fg.note(12 * 16 + 1, -2, 0, 1);
    gancho(T, P, P.met);
    mambo(12, 'A', 0);
    mambo(13, 'B', 2);
    ev(12, 0, 'rede + estalo', 'a rede pega fogo');
    cena(14, 'final');
    stabs(P.met, 14, 'B7', [[0, 3]], { low: 59, n: 4 });
    mel(P.bs, 14, ['B1:3 r:13']);
    P.fg.note(14 * 16 + 6, -4, 0, 0.6);
    mel(ua, 14, ['r:8 F#4:3 F4:3 E4:2']);
    ev(14, 0, 'acorde curto', 'Flareon posa');
    ev(14, 6, 'estalinho', 'o goleiro olha as luvas: estão fumegando');
    ev(14, 8, 'trombone "uá-uá-uá"', 'ele assopra as luvas');
    return S;
}

export default function eevee() {
    return { vaporeon: vaporeon(), jolteon: jolteon(), flareon: flareon() };
}
