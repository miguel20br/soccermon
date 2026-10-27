// Escalaram um Magikarp no gol (série "Escalaram um ___ no gol", EP 2; o EP 1 é o livre-snorlax). A história está no
// motivo, como no "O grande dia do Magikarp" (curta-magikarp, aprovado em 22/10): o PLOF é o 3-3-2 do SOC-CER-MON
// tocado no espirro d'água, mas CAINDO (Sol-Mi-Dó grave: o gancho que não decola). Toda vez que ele falha, o plof cai.
// No aquecimento a marchinha (o tema do EP 1, oom-pah de tuba e fagote) conversa com os plofs; gol, gol, gol com o
// trombone triste; a torcida ri NO TEMPO; o Pikachu imita (o motivo no pícolo, debochado). O cartaz: o motivo no sino,
// em menor, devagar. O choro. Os holofotes desligam. Os passos do Snorlax do EP 1 e o BUUM. A montagem de treino a 104
// BPM, o tema nos metais e o tom subindo a cada dia (Fá, Fá, Sol, Lá). GRANDE FINAL: fanfarra em Lá. A final em Ré
// menor; o Mewtwo é o teremim. O apito, o rufo e a força psíquica juntando (ruído que sobe). O chute em câmera lenta
// (60 BPM): o coração batendo, o pulso psíquico crescendo ao contrário, e o plof finalmente SUBINDO (Dó-Mi-Sol) no
// mergulho dele. A defesa: BOING, prato e o SOC-CER-MON inteiro, de verdade, nos metais. Campeão um tom acima.
// Forma: roleta | EP 2 | chega | trio | gol | gols | risada | cartaz | choro | noite | Snorlax | conversa | treino ×4 |
// GRANDE FINAL | estádio | Mewtwo | apito e força | o chute (lento) | a defesa | campeão | as pazes | fim.
import { flutua, risada, sobe, splash, teremim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { barriga, chute, desliga, quique, rede, ronco, torcida, trave } from './livre-ginasio.mjs';

export const meta = { titulo: 'Escalaram um Magikarp no gol', tela: 'Curta da série (EP 2)' };

const UA = ins({ vol: 0.38, a: 0.03, r: 0.12, shape: 2, curve: 0.8, sv: 0.85, d: 0.06, slide: -0.3, rep: 0.12, trem: 0.35 });
/** Compassos da montagem de treino (104 BPM) e o do chute em câmera lenta (60 BPM). */
export const TREINO = [12, 13, 14, 15];
export const LENTO = 20;

export default function magikarp() {
    const bpmAt = (b) => (TREINO.includes(b) ? 104 : b === LENTO ? 60 : 88);
    const S = new Song({ bpm: 88, bars: 25, swing: 0.15, tail: 3, loopFrom: 2, bpmAt });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.1, corte: 2800, rev: 0.15 });
    const spl = S.part('plof', splash, { pan: 0.15, gain: 1.1, rev: 0.2 });
    const fag = S.part('fagote', I.bassoon, { pan: -0.1, gain: 1.4, rev: 0.15 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55 });
    const pah = S.part('pah', I.stab, { pan: 0.25, gain: 1, corte: 2500 });
    const met = S.part('metais', I.brass, { pan: 0.1, gain: 0.9, corte: 3000, rev: 0.25 });
    const met2 = S.part('metais2', I.brass, { pan: -0.15, gain: 0.75, corte: 2600, rev: 0.25 });
    const cor = S.part('cordas', I.strings, { pan: -0.15, gain: 1.1, rev: 0.4 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 0.85, rev: 0.2 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.8, corte: 2200, rev: 0.25 });
    const cx = S.part('sino', I.bell, { pan: 0.2, gain: 2, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.35 });
    const ter = S.part('teremim', teremim, { pan: 0.1, gain: 0.9, rev: 0.45 });
    const psi = S.part('psi', flutua, { pan: -0.1, gain: 0.8, rev: 0.5 });
    const bl = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.6 });
    const bar = S.part('barriga', barriga, { drum: true, gain: 1.2, rev: 0.2 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.7, rev: 0.15 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.85 });
    const qq = S.part('quique', quique, { drum: true, pan: -0.2, gain: 0.5, rev: 0.2 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.75, rev: 0.3 });
    const tv = S.part('trave', trave, { drum: true, gain: 0.8, rev: 0.4 });
    const lz = S.part('luz', desliga, { drum: true, gain: 0.7, rev: 0.4 });
    const ri = S.part('risada', risada(1.9, (88 / 60) * 2), { drum: true, gain: 0.9, rev: 0.3 });
    const forca = S.part('forca', sobe(2.4), { drum: true, gain: 0.5, rev: 0.4 });
    const oh = S.part('torcidaOh', torcida(1.6, 0.15, 1), { drum: true, gain: 0.45, rev: 0.3 });
    const festa = S.part('festa', torcida(4, 0.1, 2), { drum: true, gain: 0.7, rev: 0.3 });
    const fundo = S.part('estadio', torcida(5, 0.8, 1.2), { drum: true, gain: 0.3, rev: 0.4 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.85, rev: 0.2 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.75 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.5 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.4 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });

    const oompah = (b, c, cheio = true, vel = 1) => {
        bass(tuba, b, c, '0:4 r:4 5:4 r:4', { vel });
        stabs(pah, b, c, [4, 12], { low: 57, n: 3, len: 2, vel });
        if (cheio) {
            drum(sn, b, 1, '....x.......x...', { vel: 0.6 * vel });
            drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 * vel });
        }
    };
    const treino = (b, c) => {
        drum(kk, b, 1, 'x...x...x...x...');
        drum(sn, b, 1, '....x.......x...', { vel: 0.9 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.8 });
        bass(tuba, b, c, '0:2 0:2 r:2 0:2 5:2 r:2 5:2 r:2');
        stabs(pah, b, c, [2, 6, 10, 14], { low: 57, n: 3, len: 1, vel: 0.8 });
    };
    // o motivo dele: o SOC-CER-MON caindo (Sol-Mi-Dó grave) no espirro d'água
    const PLOF = (r, oit = 5) => `${r ? `r:${r} ` : ''}G${oit}:3 E${oit}:3 C${oit}:${16 - r - 6}`;
    const TEMA = ['C4:4 F4:4 A4:6 G4:2', 'Bb4:4 G4:4 E4:8', 'A4:4 C5:4 F5:6 E5:2', 'D5:4 C5:2 Bb4:2 A4:4 G4:4'];

    // 0 · roleta: o bloco já gira no 1º quadro e freia; o sino trava no Magikarp (linha 10)
    drum(bl, 0, 1, 'xxxxxxxxxx.x..x.', { pitch: 12, vel: 0.8 });
    mel(cx, 0, ['r:10 C6:6']);
    drum(cr, 0, 1, '..........x.....', { vel: 0.6 });
    mel(tuba, 0, ['r:10 F2:6']);
    // 1 · EP 2: o selo bate com os metais
    drum(tp, 1, 1, 'xxxx............', { vel: 0.7 });
    drum(cr, 1, 1, '....X...........');
    mel(met, 1, ['r:4 C5:2 F5:6 r:4']);
    stabs(pah, 1, 'F', [4], { low: 57, n: 3, len: 6 });
    drum(cl, 1, 1, '............x.x.', { vel: 0.7 });

    // 2 · ele chega se debatendo: o lead pergunta, o plof responde (caindo)
    mel(lead, 2, ['C5:2 F5:2 A5:4 r:8']);
    mel(spl, 2, [PLOF(8)], { vel: 1.2 });
    oompah(2, 'F');
    // 3 · o trio entra quicando a bola; o tema no fagote
    mel(fag, 3, [TEMA[1]]);
    oompah(3, 'C7');
    drum(qq, 3, 1, '...x...x........', { vel: 0.5 });
    // 4 · gol 1: chute, rede, trombone; o "?" dele é o plof caindo baixinho
    ch.note(4 * 16 + 4, 0, 0, 1);
    rd.note(4 * 16 + 6, 0, 0, 0.9);
    mel(ua, 4, ['r:7 C4:3 B3:6']);
    mel(spl, 4, [PLOF(9, 4)], { vel: 0.8 });
    oompah(4, 'F', false, 0.8);
    // 5 · gols 2 e 3; o trombone desce mais
    for (const r of [0, 8]) {
        ch.note(5 * 16 + r, 0, 0, 1);
        rd.note(5 * 16 + r + 2, 0, 0, 0.9);
    }
    mel(ua, 5, ['r:3 Bb3:2 A3:2 r:4 Ab3:2 G3:3']);
    oompah(5, 'C7', false, 0.8);
    // 6 · a torcida ri no tempo; o Pikachu imita: o motivo no pícolo, debochado
    ri.note(6 * 16, 0, 0, 1);
    mel(pc, 6, ['r:8 G6:1 r:2 E6:1 r:2 C6:2'], { vel: 0.8 });
    oompah(6, 'F', false, 0.6);
    // 7 · o cartaz: o motivo no sino, em menor e devagar
    padChord(ep, 7, 'Fm', 16, { low: 53, n: 3, vel: 0.45 });
    mel(cx, 7, ['G5:4 Eb5:4 C5:8'], { vel: 0.7 });
    // 8 · ele chora
    padChord(ep, 8, 'Dm', 16, { low: 53, n: 3, vel: 0.55 });
    mel(ua, 8, ['A3:8 Ab3:8']);
    // 9 · o sol se põe; os holofotes desligam um a um
    padChord(ep, 9, 'Bb', 8, { low: 53, n: 3, vel: 0.4 });
    padChord(ep, 9, 'Gm', 8, { low: 50, n: 3, vel: 0.35, at: 8 });
    for (const r of [4, 8, 12]) lz.note(9 * 16 + r, 0, 0, 0.9);

    // 10 · os passos do Snorlax do EP 1, o BUUM, e o ronco dele fazendo o baixo
    mel(tuba, 10, ['F2:4 C2:4 F2:4 r:4']);
    drum(tp, 10, 1, 'x...x...x.......', { pitch: -7 });
    bar.note(10 * 16 + 12, -12, 0, 1.2);
    // 11 · a conversa; o "!" dele é o motivo SUBINDO no sino (pela primeira vez); a virada pra montagem
    padChord(ep, 11, 'F', 16, { low: 53, n: 3, vel: 0.35 });
    zz.note(11 * 16, 0, 0, 0.6);
    mel(cx, 11, ['r:8 C6:2 E6:2 G6:4'], { vel: 0.7 });
    drum(sn, 11, 1, '............xxXX', { vel: 0.9 });
    drum(tp, 11, 1, '............x.XX', { vel: 0.7 });

    // 12–15 · a montagem de treino (104 BPM): o tema nos metais e o tom subindo a cada dia
    mel(met, 12, [TEMA[0], TEMA[1]]);
    mel(met, 14, [TEMA[2]], { shift: 2 });
    mel(met, 15, [TEMA[3]], { shift: 4 });
    mel(met2, 14, [TEMA[2]], { shift: -10, vel: 0.6 });
    mel(met2, 15, [TEMA[3]], { shift: -8, vel: 0.6 });
    mel(cor, 12, ['F4:16', 'G4:8 E4:8'], { vel: 0.5 });
    mel(cor, 14, ['B4:16', 'F#5:8 E5:8'], { vel: 0.55 });
    treino(12, 'F');
    treino(13, 'C7');
    treino(14, 'G');
    treino(15, 'A');
    drum(cr, 12, 1, 'X...............');
    drum(cr, 14, 1, 'X...............');
    // dia 1: o plof cai e a bola passa
    mel(spl, 12, [PLOF(4)], { vel: 0.9 });
    ch.note(12 * 16 + 8, 0, 0, 0.9);
    rd.note(12 * 16 + 10, 0, 0, 0.7);
    // dia 4: a barriga (BOING); ele tenta e cai (o plof cai mais)
    bar.note(13 * 16 + 4, 0, 0, 1.1);
    mel(spl, 13, [PLOF(9, 4)], { vel: 0.9 });
    drum(tp, 13, 1, '............xxxx', { pitch: -3, vel: 0.6 });
    // dia 9: o Pikachu chuta; ele defende a primeira: o plof sobe até a metade
    ch.note(14 * 16 + 6, 0, 0, 0.9);
    mel(spl, 14, ['r:8 C5:2 E5:6']);
    bar.note(14 * 16 + 10, 7, 0, 0.7);
    drum(cl, 14, 1, '............x.x.', { vel: 0.6 });
    // dia 30: o plof sobe inteiro e a bola bate na trave; prato
    mel(spl, 15, ['r:2 C5:2 E5:2 G5:10']);
    tv.note(15 * 16 + 8, 0, 0, 1);
    drum(cr, 15, 1, '........X...X...');
    drum(tp, 15, 1, '............xxXX', { vel: 0.8 });

    // 16 · GRANDE FINAL: fanfarra em Lá
    drum(tp, 16, 1, 'xxxx............', { vel: 0.8 });
    drum(cr, 16, 1, '....X...........');
    mel(met, 16, ['r:4 A4:2 C#5:2 E5:2 A5:6']);
    stabs(pah, 16, 'A', [4, 8], { low: 57, n: 3, len: 4 });
    drum(sn, 16, 1, '....x...x...xxXX', { vel: 0.9 });

    // 17 · o estádio: a torcida ao fundo e a fanfarra em Ré menor
    fundo.note(17 * 16, 0, 0, 1);
    padChord(cor, 17, 'Dm', 16, { low: 50, n: 3, vel: 0.5 });
    mel(met, 17, ['r:4 D4:2 F4:2 A4:8'], { vel: 0.9 });
    drum(tp, 17, 1, 'x.......x.......', { pitch: -5 });
    // 18 · o Mewtwo: o teremim
    padChord(cor, 18, 'Dm', 16, { low: 50, n: 3, vel: 0.45 });
    mel(ter, 18, ['D5:4 F5:4 C#5:8'], { vel: 0.9 });
    // 19 · o apito (sample na cena) na linha 0, o rufo e a força psíquica juntando
    drum(sn, 19, 1, '..oooxxxxxXXXX..', { vel: 0.8 });
    padChord(cor, 19, 'A7', 14, { low: 50, n: 3, vel: 0.6 });
    forca.note(19 * 16 + 2, 0, 0, 1);
    mel(ter, 19, ['r:4 A4:6 Bb4:6'], { vel: 0.7 });

    // 20 · o chute em câmera lenta (60 BPM): o coração, o pulso psíquico crescendo ao contrário até o contato, e o plof
    // SUBINDO no mergulho dele
    ch.note(20 * 16, -5, 0, 1.3);
    drum(tp, 20, 1, 'X...............', { pitch: -5 });
    drum(kk, 20, 1, 'x..x......x..x..', { vel: 0.7 });
    mel(psi, 20, ['D4+A4+D5:16'], { vel: 0.9 });
    mel(ter, 20, ['A4:8 D5:8'], { vel: 0.6 });
    mel(spl, 20, ['r:6 C5:3 E5:3 G5:4'], { vel: 1.1 });
    // 21 · a defesa: BOING, prato, e o SOC-CER-MON inteiro, subindo, nos metais
    bar.note(21 * 16, 5, 0, 1.4);
    drum(cr, 21, 1, 'X...............');
    drum(tp, 21, 1, 'X...............', { pitch: -5 });
    mel(met, 21, [`r:4 ${GANCHO.em({ tom: 2, ritmo: [2, 2, 8, 0] })}`]);
    mel(met2, 21, [`r:4 ${GANCHO.em({ tom: -10, ritmo: [2, 2, 8, 0] })}`], { vel: 0.7 });
    festa.note(21 * 16 + 4, 0, 0, 1.2);
    drum(cl, 21, 1, '........x.x.X...', { vel: 0.8 });

    // 22 · campeão: o tema um tom acima (Sol), SOC-CER-MON no pícolo, palmas
    mel(fag, 22, [TEMA[2]], { shift: 2 });
    mel(met, 22, [TEMA[2]], { shift: 2, vel: 0.7 });
    mel(pc, 22, [GANCHO.em({ tom: 7 })], { vel: 0.9 });
    drum(cl, 22, 1, GANCHO.palmas, { vel: 0.8 });
    oompah(22, 'G');
    drum(cr, 22, 1, 'X...............');
    mel(spl, 22, ['C5:2 E5:2 G5:4 C5:2 E5:2 G5:4'], { vel: 0.9 });
    // 23 · as pazes: o tema mais macio e o "toca aqui" (palmas e prato na linha 12)
    mel(fag, 23, [TEMA[3]], { shift: 2, vel: 0.8 });
    padChord(ep, 23, 'C', 8, { low: 53, n: 3, vel: 0.4 });
    padChord(ep, 23, 'D7', 8, { low: 52, n: 3, vel: 0.4, at: 8 });
    bass(tuba, 23, 'C', '0:4 r:4 5:4 r:4', { vel: 0.7 });
    drum(cl, 23, 1, '............X...');
    drum(cr, 23, 1, '............x...', { vel: 0.5 });

    // 24 · tela final: o tema em Sol, e a roleta girando de novo sem parar (EP 3?)
    mel(fag, 24, [TEMA[0]], { shift: 2 });
    oompah(24, 'G');
    mel(spl, 24, ['C5:2 E5:2 G5:4 r:8'], { vel: 0.8 });
    drum(bl, 24, 1, '........xxxxxxxx', { pitch: 12, vel: 0.6 });
    return S;
}
