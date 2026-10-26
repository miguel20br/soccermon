// Escalaram um Magikarp no gol (série "Escalaram um ___ no gol", EP 2; o EP 1 é o livre-snorlax). O tema preguiçoso de
// oom-pah do EP 1 (tuba, fagote, Fá, 88 BPM com swing) é a assinatura da série. A roleta gira já no 1º quadro e trava
// no Magikarp (sino); o EP 2 bate com metais. Aquecimento: ele chega se debatendo, o trio entra quicando as bolas,
// gol (e o "?" dele olhando a rede), gol, gol, a torcida ri (pícolo "rá-rá"), o Pikachu imita o Splash e ele chora.
// O sol se põe e os holofotes desligam um a um. Os passos do Snorlax do EP 1 e o BUUM dele sentando; a conversa, e uma
// virada de caixa leva a montagem de treino a 104 BPM (o tema nos metais: dia 1, dia 4 com o BOING da barriga, dia 9
// com o Pikachu ajudando, dia 30 com a bola na trave). A final volta a 88: estádio, fanfarra em Ré menor, o Mewtwo, o
// apito (sample na cena), o rufo e o silêncio. O pênalti: chute, o Splash subindo nas cordas, BOING e prato no
// contato. Campeão: SOC-CER-MON no pícolo. As pazes com o Pikachu (palmas no "toca aqui"). Fim: o tema e a roleta
// girando de novo, sem parar (EP 3?).
import { bass, drum, GANCHO, I, ins, mel, midi, padChord, Song, stabs } from '../synth.mjs';
import { barriga, chute, desliga, quique, rede, torcida, trave } from './livre-ginasio.mjs';

export const meta = { titulo: 'Escalaram um Magikarp no gol', tela: 'Curta da série (EP 2)' };

const UA = ins({ vol: 0.38, a: 0.03, r: 0.12, shape: 2, curve: 0.8, sv: 0.85, d: 0.06, slide: -0.3, rep: 0.12, trem: 0.35 });
/** Compassos da montagem de treino (104 BPM). */
export const TREINO = [11, 12, 13, 14];

export default function magikarp() {
    const S = new Song({ bpm: 88, bars: 22, swing: 0.15, tail: 3, loopFrom: 2, bpmAt: (b) => (TREINO.includes(b) ? 104 : 88) });
    const fag = S.part('fagote', I.bassoon, { pan: -0.1, gain: 1.5, rev: 0.15 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6 });
    const pah = S.part('pah', I.stab, { pan: 0.25, gain: 1.1, corte: 2500 });
    const met = S.part('metais', I.brass, { pan: 0.1, gain: 0.9, rev: 0.25 });
    const cor = S.part('cordas', I.strings, { pan: -0.15, gain: 0.8, rev: 0.4 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 0.9, rev: 0.2 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.8, corte: 2200, rev: 0.25 });
    const cx = S.part('sino', I.bell, { pan: 0.2, gain: 2.4, echo: { rows: 3, fb: 0.25, mix: 0.25 }, rev: 0.4 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.35 });
    const pz = S.part('pizzicato', I.pizz, { pan: -0.2, gain: 1.6, rev: 0.15 });
    const bl = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.6 });
    const bar = S.part('barriga', barriga, { drum: true, gain: 1.2, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.8 });
    const qq = S.part('quique', quique, { drum: true, pan: -0.2, gain: 0.55, rev: 0.25 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const tv = S.part('trave', trave, { drum: true, gain: 0.8, rev: 0.3 });
    const lz = S.part('luz', desliga, { drum: true, gain: 0.7, rev: 0.4 });
    const oh = S.part('torcida', torcida(1.8, 0.15, 1.2), { drum: true, gain: 0.5, rev: 0.3 });
    const festa = S.part('festa', torcida(3, 0.1, 1.6), { drum: true, gain: 0.75, rev: 0.3 });
    const fundo = S.part('estadio', torcida(5, 0.8, 1.2), { drum: true, gain: 0.3, rev: 0.4 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.9, rev: 0.2 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.5 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.4 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });

    const oompah = (b, c, cheio = true) => {
        bass(tuba, b, c, '0:4 r:4 5:4 r:4');
        stabs(pah, b, c, [4, 12], { low: 57, n: 3, len: 2 });
        if (cheio) {
            drum(sn, b, 1, '....x.......x...', { vel: 0.7 });
            drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        }
    };
    // a batida da montagem: bumbo no tempo, caixa no 2 e no 4, chimbal em colcheias, metais no contratempo
    const treino = (b, c) => {
        drum(kk, b, 1, 'x...x...x...x...');
        drum(sn, b, 1, '....x.......x...', { vel: 0.9 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.8 });
        bass(tuba, b, c, '0:2 0:2 r:2 0:2 5:2 r:2 5:2 r:2');
        stabs(pah, b, c, [2, 6, 10, 14], { low: 57, n: 3, len: 1, vel: 0.8 });
    };
    // Splash: o quique agudo e uma nota curta na linha
    const splash = (b, rows, nota = 'F5') => {
        for (const r of rows) {
            qq.note(b * 16 + r, 7, 0, 0.7);
            pz.note(b * 16 + r, midi(nota), 1, 0.5);
        }
    };
    const TEMA = ['C4:4 F4:4 A4:6 G4:2', 'Bb4:4 G4:4 E4:8', 'A4:4 C5:4 F5:6 E5:2', 'D5:4 C5:2 Bb4:2 A4:4 G4:4'];

    // 0 · a roleta: o bloco já gira no 1º quadro e freia; o sino trava no Magikarp (linha 10)
    drum(bl, 0, 1, 'xxxxxxxxxx.x..x.', { pitch: 12, vel: 0.8 });
    mel(cx, 0, ['r:10 C6:6']);
    drum(cr, 0, 1, '..........x.....', { vel: 0.6 });
    mel(tuba, 0, ['r:10 F2:6']);
    // 1 · EP 2: rufo curto e o acorde dos metais quando o selo bate
    drum(tp, 1, 1, 'xxxx............', { vel: 0.7 });
    drum(cr, 1, 1, '....X...........');
    mel(met, 1, ['r:4 C5:2 F5:6 r:4']);
    stabs(pah, 1, 'F', [4], { low: 57, n: 3, len: 6 });
    drum(cl, 1, 1, '............x.x.', { vel: 0.7 });

    // 2 · ele chega se debatendo; o tema
    mel(fag, 2, [TEMA[0]]);
    oompah(2, 'F');
    splash(2, [0, 4, 8, 12]);
    // 3 · o trio entra quicando as bolas
    mel(fag, 3, [TEMA[1]]);
    oompah(3, 'C7');
    drum(qq, 3, 1, '..x...x...x...x.', { vel: 0.5 });
    // 4 · gol 1, e o "?" dele olhando a rede
    ch.note(4 * 16 + 4, 0, 0, 1);
    rd.note(4 * 16 + 6, 0, 0, 0.9);
    mel(ua, 4, ['r:8 C4:4 B3:4']);
    mel(pz, 4, ['r:12 C6:1 r:1 G6:2']);
    oompah(4, 'F', false);
    // 5 · gols 2 e 3
    for (const r of [0, 8]) {
        ch.note(5 * 16 + r, 0, 0, 1);
        rd.note(5 * 16 + r + 2, 0, 0, 0.9);
    }
    mel(ua, 5, ['r:3 Bb3:2 A3:2 r:4 Ab3:2 G3:3']);
    oompah(5, 'C7', false);
    // 6 · a torcida ri; o Pikachu imita o Splash (o pizzicato debochado)
    oh.note(6 * 16, 2, 0, 1.1);
    mel(pc, 6, ['C6:1 r:1 A5:1 r:1 C6:1 r:1 A5:1 r:9'], { vel: 0.8 });
    mel(pz, 6, ['r:8 F4:1 r:2 F4:1 r:4']);
    oompah(6, 'F', false);
    // 7 · ele chora
    padChord(ep, 7, 'Dm', 16, { low: 53, n: 3, vel: 0.55 });
    mel(ua, 7, ['A3:8 Ab3:8']);
    // 8 · o sol se põe; os holofotes desligam um a um
    padChord(ep, 8, 'Bb', 8, { low: 53, n: 3, vel: 0.4 });
    padChord(ep, 8, 'Gm', 8, { low: 50, n: 3, vel: 0.35, at: 8 });
    for (const r of [4, 8, 12]) lz.note(8 * 16 + r, 0, 0, 0.9);

    // 9 · os passos do Snorlax do EP 1 e o BUUM
    mel(tuba, 9, ['F2:4 C2:4 F2:4 r:4']);
    drum(tp, 9, 1, 'x...x...x.......', { pitch: -7 });
    bar.note(9 * 16 + 12, -12, 0, 1.2);
    // 10 · a conversa; o "!" dele no sino; a virada pra montagem
    padChord(ep, 10, 'F', 16, { low: 53, n: 3, vel: 0.35 });
    mel(cx, 10, ['r:8 A5:2 C6:2 F6:4'], { vel: 0.7 });
    drum(sn, 10, 1, '............xxXX', { vel: 0.9 });
    drum(tp, 10, 1, '............x.XX', { vel: 0.7 });

    // 11–14 · a montagem de treino (104 BPM): o tema nos metais
    mel(met, 11, [TEMA[0], TEMA[1], TEMA[2], TEMA[3]]);
    mel(cor, 11, ['F4:16', 'G4:8 E4:8', 'A4:16', 'D5:8 C5:8'], { vel: 0.5 });
    treino(11, 'F');
    treino(12, 'C7');
    treino(13, 'F');
    treino(14, 'Bb');
    drum(cr, 11, 1, 'X...............');
    // dia 1: ele pula baixinho e a bola passa
    splash(11, [4]);
    ch.note(11 * 16 + 8, 0, 0, 0.9);
    rd.note(11 * 16 + 10, 0, 0, 0.7);
    // dia 4: a barriga (BOING); ele tenta e cai
    bar.note(12 * 16 + 4, 0, 0, 1.1);
    splash(12, [10]);
    drum(tp, 12, 1, '............xxxx', { pitch: -3, vel: 0.6 });
    // dia 9: o Pikachu chuta; ele defende a primeira
    ch.note(13 * 16 + 6, 0, 0, 0.9);
    splash(13, [8], 'A5');
    bar.note(13 * 16 + 10, 7, 0, 0.7);
    drum(cl, 13, 1, '............x.x.', { vel: 0.6 });
    // dia 30: a bola na trave; prato
    drum(cr, 14, 1, 'X...........X...');
    splash(14, [6], 'C6');
    tv.note(14 * 16 + 8, 0, 0, 1);
    drum(tp, 14, 1, '............xxXX', { vel: 0.8 });

    // 15 · a final (88 BPM): estádio cheio e a fanfarra em Ré menor
    fundo.note(15 * 16, 0, 0, 1);
    padChord(cor, 15, 'Dm', 16, { low: 50, n: 3, vel: 0.55 });
    mel(met, 15, ['r:4 D4:2 F4:2 A4:8'], { vel: 0.9 });
    drum(tp, 15, 1, 'x.......x.......', { pitch: -5 });
    // 16 · o Mewtwo
    padChord(cor, 16, 'Dm', 16, { low: 50, n: 3, vel: 0.5 });
    mel(met, 16, ['r:8 D3:4 C#3:4'], { vel: 0.9 });
    // 17 · o apito (sample) na linha 0, o rufo crescendo e o silêncio nas 4 últimas linhas
    drum(sn, 17, 1, '..oooxxxxxXX....', { vel: 0.9 });
    drum(tp, 17, 1, '..x.xxxxxxXX....', { pitch: -5, vel: 0.8 });
    padChord(cor, 17, 'A7', 12, { low: 50, n: 3, vel: 0.65 });
    // 18 · o pênalti: chute, o Splash subindo nas cordas, BOING e prato no contato (linha 8), a festa na 12
    ch.note(18 * 16, 0, 0, 1.3);
    mel(cor, 18, ['D4:1 F4:1 A4:1 D5:1 F5:1 A5:1 D6:2 r:8'], { vel: 0.8 });
    splash(18, [2], 'D6');
    bar.note(18 * 16 + 8, 5, 0, 1.4);
    drum(cr, 18, 1, '........X.......');
    drum(tp, 18, 1, '........X.......', { pitch: -5 });
    festa.note(18 * 16 + 12, 0, 0, 1.2);

    // 19 · campeão: SOC-CER-MON no pícolo, palmas, o tema cheio
    mel(fag, 19, [TEMA[2]]);
    mel(met, 19, [TEMA[2]], { vel: 0.7 });
    mel(pc, 19, [GANCHO.em({ tom: 5 })], { vel: 0.9 });
    drum(cl, 19, 1, GANCHO.palmas, { vel: 0.8 });
    oompah(19, 'F');
    drum(cr, 19, 1, 'X...............');
    splash(19, [2, 6, 10, 14], 'A5');
    // 20 · as pazes: o tema mais macio e o "toca aqui" (palmas e prato na linha 12)
    mel(fag, 20, [TEMA[3]], { vel: 0.8 });
    padChord(ep, 20, 'Bb', 8, { low: 53, n: 3, vel: 0.4 });
    padChord(ep, 20, 'C7', 8, { low: 52, n: 3, vel: 0.4, at: 8 });
    bass(tuba, 20, 'Bb', '0:4 r:4 5:4 r:4', { vel: 0.7 });
    drum(cl, 20, 1, '............X...');
    drum(cr, 20, 1, '............x...', { vel: 0.5 });

    // 21 · tela final: o tema, e a roleta girando de novo sem parar (EP 3?)
    mel(fag, 21, [TEMA[0]]);
    oompah(21, 'F');
    splash(21, [0, 4]);
    drum(bl, 21, 1, '........xxxxxxxx', { pitch: 12, vel: 0.6 });
    return S;
}
