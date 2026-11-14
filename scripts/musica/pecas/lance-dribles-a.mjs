// Lance da semana nº 2 v4, música A: "a jogada que sobe" (a livre-dribles foi reprovada: nada dela aqui).
// A história está num motivo só, o da jogada, no assovio: chega subindo (a bola chegando), segura (o drible na câmera
// lenta), um buraco (o Machop sem entender) e a frase que sai subindo (o passe pro próximo). A cada drible o motivo volta
// um grau acima, com uma camada a mais (Mew sozinho; Gengar com o piano; Pikachu com os metais em terças). O Machop
// responde no buraco com a cuíca (o som de assinatura: a torcida rindo dele), cada vez mais torta. No chapéu o motivo
// chega lá em cima e fica com a bola no ar; o Machop cai e a nota cai junto, pelo cromático, com a cuíca escorregando.
// O Charizard dispara: o baixo anda até a dominante, o chute, silêncio, e o GOL entra um tom acima (Sol) com o motivo
// inteiro, metais, torcida e o clap 808. Tela final: SOC-CER-MON com as palmas, o acorde e um "uí" da cuíca (o Machop
// tonto). O groove não para: na câmera lenta só o chimbal respira.
// 96 BPM, 4/4, compasso = 2,5 s, 18,5 s. Fá → Sol (C5). Mapa do vídeo: C0 Mew, C1 Gengar, C2 Pikachu, C3–C4 Charizard
// (chapéu C3 l12, queda C4 l3, chute C4 l11), GOL C5 l0 (12,5 s), festa, tela final C6 (15,0 s).
import { cuica } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { ASSOVIO, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Lance #2: a jogada que sobe (A)', tela: 'Lance da semana nº 2 (TikTok)' };

const BAR = 2.5;
const FIM = 18.5;
/** O motivo da jogada (um compasso, Fá): chega, segura, buraco, sai. */
export const MOTIVO = 'C5:1 r:1 F5:1 G5:1 A5:4 r:4 G5:1 A5:1 C6:2';
const F = MAJOR(5);
const G = MAJOR(7);
/** A nota `g` graus acima na escala de Fá (a sequência que sobe), mais `o` semitons. */
const PASSOS = [0, 2, 4, 5, 7, 9, 11];
const grau =
    (g, o = 0) =>
    (m) => {
        const i = F.indexOf(m % 12);
        const j = i + g;
        return m - PASSOS[i] + PASSOS[j % 7] + 12 * Math.floor(j / 7) + o;
    };

export default function jogada() {
    // o silêncio antes do GOL (C4, linhas 12–15: a bola voando pra rede) e a saída no fim do vídeo
    const masterAt = (t) => {
        const a = 4 * BAR + (12 * BAR) / 16;
        if (t > a - 0.02 && t < 5 * BAR) return Math.max(0, (a - t) / 0.02);
        // (e cresce: os dribles, o Charizard, o GOL)
        const base = t < 3 * BAR ? 0.82 : t < 5 * BAR ? 0.9 : 1;
        return base * (t > FIM - 0.35 ? Math.max(0, (FIM - t) / 0.35) : 1);
    };
    const S = new Song({ bpm: 96, bars: 8, swing: 0.1, tail: 2, masterAt });
    const lead = S.part('assovio', ASSOVIO, { gain: 1.6, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.12 } });
    const corpo = S.part('corpo', I.counter, { gain: 0.55, corte: 2400 });
    const piano = S.part('piano', I.epiano, { pan: -0.3, gain: 0.8, rev: 0.25 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.55, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.45, corte: 2600, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.9, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.8, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.45, corte: 2600 });
    const cu = S.part('cuica', cuica(), { pan: 0.25, gain: 1, rev: 0.15 });
    const cuT = S.part('cuicaTorta', cuica({ torto: 0.6 }), { pan: 0.25, gain: 1, rev: 0.15 });
    const cuQ = S.part('cuicaQueda', cuica({ forma: 'cai', sobe: 14, torto: 0.4 }), {
        pan: 0.15,
        gain: 0.8,
        rev: 0.25,
    });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.3 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.6 });
    const ag = S.part('agogo', I.agogo, { drum: true, pan: -0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.42 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.6, rev: 0.3 });
    const festa = S.part('torcida', torcida(3.2, 0.06, 1.6), { drum: true, gain: 0.5, rev: 0.3 });

    /** O funk em 16 avos, meio compasso em cada acorde; `lento` = linhas da câmera lenta (o chimbal só nas semínimas). */
    const groove = (b, [c1, c2], { lento = null } = {}) => {
        drum(kk, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        const hat = [...'x.xx.x.xx.xx.x.x'].map((c, i) =>
            lento && i >= lento[0] && i <= lento[1] ? (i % 4 ? '.' : 'x') : c,
        );
        drum(hh, b, 1, hat.join(''));
        drum(ag, b, 1, 'x..x..x...x.x...');
        bass(bs, b, c1, '0:2 8:1~ r:1 5:2 r:2 r:8');
        bass(bs, b, c2, 'r:8 0:1 r:1 s:2 5:2 3:2');
        stabs(gt, b, c1, [2, 6], { low: 60, n: 3 });
        stabs(gt, b, c2, [10, 14], { low: 60, n: 3 });
        stabs(cv, b, c1, [3, 7], { low: 62, n: 3, vel: 0.7 });
        stabs(cv, b, c2, [11], { low: 62, n: 3, vel: 0.7 });
    };

    // C0 · Mew: o motivo sozinho no assovio; a cuíca responde uma vez ("uí?")
    groove(0, ['F6', 'Bb9'], { lento: [5, 9] });
    mel(lead, 0, [MOTIVO]);
    mel(corpo, 0, [MOTIVO], { shift: -12, vel: 0.8 });
    mel(cu, 0, ['r:9 C5:2 r:5']);
    // C1 · Gengar: um grau acima (Sol menor), o piano por baixo; a cuíca duas vezes, já torta
    groove(1, ['Gm7', 'C9'], { lento: [5, 10] });
    mel(lead, 1, [MOTIVO], { harm: grau(1) });
    mel(corpo, 1, [MOTIVO], { harm: grau(1, -12), vel: 0.8 });
    mel(piano, 1, ['Bb3+D4+F4:4 r:4 E4+G4+Bb4:4 r:4'], { vel: 0.6 });
    mel(cuT, 1, ['r:9 D5:1 r:1 Bb4:2 r:3']);
    // C2 · Pikachu: mais um grau (Lá menor), os metais em terças embaixo; a cuíca três vezes, bem torta
    groove(2, ['Am7', 'D7'], { lento: [5, 10] });
    mel(lead, 2, [MOTIVO], { harm: grau(2) });
    mel(corpo, 2, [MOTIVO], { harm: grau(2, -12), vel: 0.8 });
    mel(met, 2, [MOTIVO], { harm: (m) => thirdBelow(F)(grau(2, -12)(m)), vel: 0.6 });
    mel(piano, 2, ['C4+E4+G4:4 r:4 F#4+A4+C5:4 r:4'], { vel: 0.6 });
    mel(cuT, 2, ['r:8 E5:1 r:1 C5:1 r:1 E5:2 r:2'], { vel: 1.1 });
    // C3 · Charizard: a bola chega (l6), ele domina subindo, e no chapéu (l12) o motivo chega no alto e fica lá
    groove(3, ['Bbmaj7', 'C7sus4']);
    mel(lead, 3, ['r:6 F5:1 Bb5:1 C6:1 D6:3 F6:4']);
    mel(corpo, 3, ['r:6 F4:1 Bb4:1 C5:1 D5:3 F5:4'], { vel: 0.8 });
    mel(met, 3, ['r:12 A4+C5+F5:4'], { vel: 0.7 });
    padChord(cor, 3, 'C7sus4', 4, { low: 55, n: 4, vel: 0.6, at: 12 });
    drum(cr, 3, 1, '............x...', { vel: 0.5 });
    // C4 · a bola no ar até a linha 3; o Machop cai e a nota cai junto, pelo cromático (a cuíca escorrega); o Charizard
    // dispara: o baixo anda de Ré até Sol (a dominante do tom novo), a caixa enche; o chute (l11) e o silêncio (masterAt)
    mel(lead, 4, ['F6:3 E6:1 Eb6:1 D6:1 Db6:1 C6:3 r:6']);
    mel(corpo, 4, ['F5:3 r:13'], { vel: 0.8 });
    padChord(cor, 4, 'C7sus4', 3, { low: 55, n: 4, vel: 0.6 });
    mel(cuQ, 4, ['r:3 C6:5 r:8']);
    drum(kk, 4, 1, 'X.....X.X.X.X...');
    drum(sn, 4, 1, '...X..x.x.xxxX..', { vel: 0.9 });
    drum(hh, 4, 1, 'x.xx..x.x.x.x...');
    mel(bs, 4, ['C2:2 r:1 C2:1 r:2 D2:1 Eb2:1 E2:1 F2:1 F#2:1 G2:1 r:4']);
    stabs(met, 4, 'D7', [11], { low: 57, n: 4, len: 1 });
    stabs(met2, 4, 'D7', [6, 8, 10], { low: 54, n: 3, len: 1, vel: 0.6 });
    drum(tp, 4, 1, '......x.x.xxX...', { vel: 0.7 });

    // C5 · GOL (12,5 s): um tom acima (Sol), prato, tímpano, a rede, a torcida; o motivo inteiro com os metais em terças
    // e as cordas; o clap 808 no 2 e no 4
    drum(cr, 5, 1, 'X...............');
    drum(tp, 5, 1, 'X...............');
    rd.note(5 * 16, 0, 0, 1);
    festa.note(5 * 16, 0, 0, 1);
    groove(5, ['G6', 'C9']);
    mel(lead, 5, [MOTIVO], { shift: 2 });
    mel(corpo, 5, [MOTIVO], { shift: 2 - 12, vel: 0.8 });
    mel(met, 5, [MOTIVO], { shift: 2 - 12, harm: thirdBelow(G), vel: 0.75 });
    mel(met2, 5, [MOTIVO], { shift: 2 - 12, vel: 0.5 });
    padChord(cor, 5, 'G6', 8, { low: 55, n: 4, vel: 0.6 });
    padChord(cor, 5, 'C9', 8, { low: 55, n: 4, vel: 0.6, at: 8 });
    drum(cl, 5, 1, '....X.......X...', { vel: 0.9 });
    // C6 · tela final (15,0 s): SOC-CER-MON em Sol com as palmas respondendo (as sílabas do logo piscam junto)
    groove(6, ['G6', 'D7']);
    mel(lead, 6, [GANCHO.em({ tom: -5 })]);
    mel(met, 6, [GANCHO.em({ tom: -5, oitava: -1 })], { harm: thirdBelow(G), vel: 0.7 });
    mel(met2, 6, [GANCHO.em({ tom: -5, oitava: -1 })], { vel: 0.6 });
    drum(cl, 6, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 6, 'G6', 16, { low: 55, n: 4, vel: 0.6 });
    // C7 · o acorde final e o "uí" da cuíca (o Machop tonto embaixo do logo)
    stabs(met, 7, 'G6', [0], { low: 55, n: 4, len: 6 });
    stabs(gt, 7, 'G6', [0], { low: 60, n: 3 });
    mel(bs, 7, ['G1:6 r:10']);
    drum(kk, 7, 1, 'X...............');
    drum(cr, 7, 1, 'x...............', { vel: 0.7 });
    mel(lead, 7, ['G5:6 r:10'], { vel: 0.8 });
    mel(cuT, 7, ['r:3 D5:2 r:11'], { vel: 0.9 });
    return S;
}
