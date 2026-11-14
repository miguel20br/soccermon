// Lance da semana nº 2 v4, música B: "o Machop desafia" (outra ideia pro mesmo vídeo; a livre-dribles foi reprovada).
// Pergunta e resposta, compasso a compasso. A pergunta é do Machop: um metal grave de músculo se exibindo ("pom, pom,
// POM!": o som de assinatura) quando a bola chega. A resposta é da jogada: o riff do time, que é o protagonista e cresce
// com quem dribla (Mew no pícolo; Gengar põe o órgão; Pikachu o pulso fino do chip; Charizard os metais). A pergunta do
// Machop murcha a cada drible: desafina, balança, perde nota; no chapéu ela nem termina e, na queda, escorrega uma oitava
// pra baixo. O Charizard dispara: o riff sobe em sequência com tudo junto, o chute, silêncio, e o GOL vira o tom pra Fá
// maior (o relativo maior: a jogada venceu) com o riff no tutti, a torcida e o clap 808. Tela final: SOC-CER-MON em Fá
// com as palmas e, no fim, a pergunta do Machop numa caixinha de música, torta (ele sentado, tonto).
// 96 BPM, 4/4, compasso = 2,5 s, 18,5 s. Ré menor (dórico) → Fá maior (C5). O mesmo mapa da música A: C0 Mew, C1 Gengar,
// C2 Pikachu, C3–C4 Charizard (chapéu C3 l12, queda C4 l3, chute C4 l11), GOL C5 l0 (12,5 s), tela final C6 (15,0 s).
import { musculo } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Lance #2: o Machop desafia (B)', tela: 'Lance da semana nº 2 (TikTok)' };

const BAR = 2.5;
const FIM = 18.5;
/** A pergunta do Machop (linhas 0–5: a bola chegando). */
export const DESAFIO = 'D3:1 r:1 D3:1 F3:1 A3:2 r:10';
/** O riff da jogada (linhas 6–15: o drible e o passe saindo). */
export const RIFF = 'r:6 A5:1 C6:1 D6:2 r:1 F6:1 E6:1 D6:1 C6:1 A5:1';

export default function desafio() {
    const masterAt = (t) => {
        const a = 4 * BAR + (12 * BAR) / 16;
        if (t > a - 0.02 && t < 5 * BAR) return Math.max(0, (a - t) / 0.02);
        // (e cresce: os dribles, o Charizard, o GOL)
        const base = t < 3 * BAR ? 0.82 : t < 5 * BAR ? 0.9 : 1;
        return base * (t > FIM - 0.35 ? Math.max(0, (FIM - t) / 0.35) : 1);
    };
    const S = new Song({ bpm: 96, bars: 8, swing: 0.12, tail: 2, masterAt });
    const mach = S.part('machop', musculo(), { pan: -0.15, gain: 2, rev: 0.12 });
    const mach2 = S.part('machopTorto', musculo({ torto: 0.5 }), { pan: -0.15, gain: 2, rev: 0.12 });
    const mach3 = S.part('machopTonto', musculo({ torto: 1 }), { pan: -0.15, gain: 2, rev: 0.15 });
    const machCai = S.part('machopCai', musculo({ torto: 0.6, cai: 12 }), { pan: -0.15, gain: 2.2, rev: 0.2 });
    const pic = S.part('picolo', I.piccolo, { pan: 0.15, gain: 1.5, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.12 } });
    const org = S.part('orgao', I.organ, { pan: -0.25, gain: 1.4, echo: { rows: 3, fb: 0.2, mix: 0.12 } });
    const chip = S.part('chip', I.thin, { pan: 0.3, gain: 0.9, echo: { rows: 2, fb: 0.25, mix: 0.15 } });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.6, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.9, rev: 0.35 });
    const caixinha = S.part('caixinha', I.bell, {
        pan: 0.1,
        gain: 1.6,
        rev: 0.4,
        echo: { rows: 4, fb: 0.3, mix: 0.3 },
    });
    const bs = S.part('baixo', I.slap, { gain: 0.6, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.45, corte: 2600 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.3 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.6 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.3, gain: 0.7 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.42 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.6, rev: 0.3 });
    const festa = S.part('torcida', torcida(3.2, 0.06, 1.6), { drum: true, gain: 0.5, rev: 0.3 });

    /** O funk de Ré dórico: bumbo antecipado, caixa com fantasmas, chimbal partido-alto, bloco; `lento` = câmera lenta. */
    const groove = (b, [c1, c2], { lento = null } = {}) => {
        drum(kk, b, 1, 'X.....x...X..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        const hat = [...'x.xx.x.xx.xx.x.x'].map((c, i) =>
            lento && i >= lento[0] && i <= lento[1] ? (i % 4 ? '.' : 'x') : c,
        );
        drum(hh, b, 1, hat.join(''));
        drum(bl, b, 1, '..x...x...x..x..');
        bass(bs, b, c1, '0:2 8:1~ r:1 5:2 r:2 r:8');
        bass(bs, b, c2, 'r:8 0:1 r:1 s:2 5:2 3:2');
        stabs(gt, b, c1, [2, 6], { low: 60, n: 3 });
        stabs(gt, b, c2, [10, 14], { low: 60, n: 3 });
        stabs(cv, b, c1, [3, 7], { low: 62, n: 3, vel: 0.7 });
        stabs(cv, b, c2, [11], { low: 62, n: 3, vel: 0.7 });
    };
    const D = MAJOR(0); // Ré dórico = as notas de Dó maior
    const F = MAJOR(5);

    // C0 · Mew: o Machop se exibe; o pícolo responde com o riff
    groove(0, ['Dm7', 'G9'], { lento: [5, 9] });
    mel(mach, 0, [DESAFIO]);
    mel(mach, 0, [DESAFIO], { shift: -12, vel: 0.6 });
    mel(pic, 0, [RIFF]);
    // C1 · Gengar: a pergunta já sai meio torta; o riff ganha o órgão
    groove(1, ['Dm7', 'G9'], { lento: [5, 10] });
    mel(mach2, 1, [DESAFIO]);
    mel(mach2, 1, [DESAFIO], { shift: -12, vel: 0.6 });
    mel(pic, 1, [RIFF]);
    mel(org, 1, [RIFF], { shift: -12, vel: 0.9 });
    // C2 · Pikachu: a pergunta balança e perde a última nota; o riff ganha o chip (o choquinho) uma terça acima
    groove(2, ['Dm7', 'G9'], { lento: [5, 10] });
    mel(mach3, 2, ['D3:1 r:1 D3:1 F3:1 r:12']);
    mel(mach3, 2, ['D3:1 r:1 D3:1 F3:1 r:12'], { shift: -12, vel: 0.6 });
    mel(pic, 2, [RIFF]);
    mel(org, 2, [RIFF], { shift: -12, vel: 0.9 });
    mel(chip, 2, [RIFF], { harm: (m) => thirdBelow(D)(m) + 12, vel: 0.8 });
    // C3 · Charizard: o Machop tenta de novo e não termina ("pom… pom?"); o riff nos metais, e no chapéu (l12) ele salta
    // pro Ré lá em cima e fica com a bola no ar
    groove(3, ['Bbmaj7', 'A7sus4']);
    mel(mach3, 3, ['D3:1 r:3 D3:2 r:10'], { vel: 0.9 });
    mel(pic, 3, ['r:6 A5:1 C6:1 D6:2 r:2 D7:4']);
    mel(org, 3, ['r:6 A4:1 C5:1 D5:2 r:2 D6:4'], { vel: 0.9 });
    mel(met, 3, ['r:6 F4+A4:1 A4+C5:1 Bb4+D5:2 r:2 A4+D5+E5:4'], { vel: 0.75 });
    padChord(cor, 3, 'A7sus4', 4, { low: 55, n: 4, vel: 0.6, at: 12 });
    drum(cr, 3, 1, '............x...', { vel: 0.5 });
    // C4 · a bola no ar; o Machop cai (l3): a pergunta dele escorrega uma oitava; o Charizard dispara: o riff sobe em
    // sequência com todos juntos, o chute (l11) e o silêncio (masterAt)
    mel(pic, 4, ['D7:3 r:3 A5:1 C6:1 D6:1 F6:1 A6:1 r:5']);
    mel(org, 4, ['D6:3 r:3 A4:1 C5:1 D5:1 F5:1 A5:1 r:5'], { vel: 0.9 });
    mel(chip, 4, ['r:6 C6:1 E6:1 F6:1 A6:1 C7:1 r:5'], { vel: 0.8 });
    mel(machCai, 4, ['r:3 A3:4 r:9']);
    mel(machCai, 4, ['r:3 A2:4 r:9'], { vel: 0.6 });
    drum(kk, 4, 1, 'X.....X.X.X.X...');
    drum(sn, 4, 1, '...X..x.x.xxxX..', { vel: 0.9 });
    drum(hh, 4, 1, 'x.xx..x.x.x.x...');
    mel(bs, 4, ['A1:2 r:1 A1:1 r:2 A1:1 Bb1:1 B1:1 C2:1 C#2:1 C2:1 r:4']);
    stabs(met, 4, 'C7', [11], { low: 55, n: 4, len: 1 });
    stabs(met2, 4, 'C7', [6, 8, 10], { low: 52, n: 3, len: 1, vel: 0.6 });
    drum(tp, 4, 1, '......x.x.xxX...', { vel: 0.7 });

    // C5 · GOL (12,5 s): Fá maior, prato, tímpano, a rede, a torcida; o riff no tutti (pícolo, órgão, chip, metais em
    // terças) e o clap 808 no 2 e no 4
    drum(cr, 5, 1, 'X...............');
    drum(tp, 5, 1, 'X...............');
    rd.note(5 * 16, 0, 0, 1);
    festa.note(5 * 16, 0, 0, 1);
    groove(5, ['Fmaj7', 'Bb9']);
    const VIVA = 'C6:1 r:1 F6:1 G6:1 A6:2 r:1 C7:1 Bb6:1 A6:1 G6:1 F6:1 r:4';
    mel(pic, 5, [VIVA]);
    mel(org, 5, [VIVA], { shift: -12, vel: 0.9 });
    mel(chip, 5, [VIVA], { shift: -12, harm: thirdBelow(F), vel: 0.7 });
    mel(met, 5, [VIVA], { shift: -24, harm: thirdBelow(F), vel: 0.75 });
    mel(met2, 5, [VIVA], { shift: -24, vel: 0.5 });
    padChord(cor, 5, 'Fmaj7', 8, { low: 55, n: 4, vel: 0.6 });
    padChord(cor, 5, 'Bb9', 8, { low: 55, n: 4, vel: 0.6, at: 8 });
    drum(cl, 5, 1, '....X.......X...', { vel: 0.9 });
    // C6 · tela final (15,0 s): SOC-CER-MON em Fá com as palmas respondendo
    groove(6, ['Fmaj7', 'C7']);
    mel(pic, 6, [GANCHO.em({ tom: 5, oitava: -1 })]);
    mel(met, 6, [GANCHO.em({ tom: 5, oitava: -2 })], { harm: thirdBelow(F), vel: 0.7 });
    mel(met2, 6, [GANCHO.em({ tom: 5, oitava: -2 })], { vel: 0.6 });
    drum(cl, 6, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 6, 'Fmaj7', 16, { low: 55, n: 4, vel: 0.6 });
    // C7 · o acorde de Fá e a pergunta do Machop na caixinha de música, torta (ele sentado embaixo do logo)
    stabs(met, 7, 'Fmaj7', [0], { low: 53, n: 4, len: 6 });
    stabs(gt, 7, 'F', [0], { low: 60, n: 3 });
    mel(bs, 7, ['F1:6 r:10']);
    drum(kk, 7, 1, 'X...............');
    drum(cr, 7, 1, 'x...............', { vel: 0.7 });
    mel(caixinha, 7, ['r:1 D5:1 D5:1 F5:1 A5:2 r:10'], { shift: -0.4, vel: 0.9 });
    return S;
}
