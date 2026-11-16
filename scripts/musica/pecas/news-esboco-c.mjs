// Soccermon News #1, esboço C: "bancada jazz-fusion" (15/11/2026; o pedido no topo do esboço A).
// A ideia: o telefone da redação toca (a pergunta) e a bancada atende com o tema (a resposta). Jazz-fusion no jeito do
// Sonic Mania: acordes com 7ª e 9ª, baixo slap que anda como melodia, piano elétrico, lead de metal de sintetizador
// (filtrado, quente) dobrado por um pulso baixinho. Mi♭ maior, 120 BPM, swing leve (0,06). O tema: arpejo subindo pelo
// Lá♭maj7 (a 9ª e a 7ª), bordadura, salto até o Mi♭ agudo e a volta, terminando no Mi♭ do logo. Na fala: I–vi–IV–V com
// extensões, o baixo e o piano em contratempo, sem lead; o telefone toca uma vez num vão e o lead atende ("alô?") no
// outro. A troca pro VEM AÍ cria expectativa: o telefone não para, o baixo sobe pelo cromático, a caixa rufa e o
// riser leva tudo um tom acima (Fá maior); no bumbo reto o tema volta com segunda voz, os metais respondem, o
// SOC-CER-MON com as palmas, e o fim fica suspenso num Dó7sus4 com o telefone tocando (continua na sexta que vem).
// Mapa (s): 0–2,5 vinheta · 2,5–10,5 fundo de fala · 10,5–12,5 virada · 12,5–18,5 VEM AÍ · 18,5 fim.
import { sobe } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, SR, stabs, thirdBelow } from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'News #1, esboço C: bancada jazz-fusion', tela: 'Soccermon News #1 (vídeo)' };

const TAU = Math.PI * 2;

/** O telefone antigo da redação ("trrrim", 0,45 s): o martelo batendo em dois sinos, 22 vezes por segundo. */
export const telefone = som(
    0.55,
    (p, r) => {
        const f1 = 1180 * k12(p);
        const f2 = f1 * 1.19;
        const cai = Math.exp(-1 / (0.035 * SR));
        let [ea, eb, prox, k] = [0, 0, 0, 0];
        let [a1, a2, b1, b2] = [0, 0, 0, 0];
        return (t) => {
            let clic = 0;
            if (t >= prox && t < 0.42) {
                if (k % 2) eb = 1;
                else ea = 1;
                clic = (r() * 2 - 1) * 0.3;
                k++;
                prox = t + 1 / 22;
            }
            ea *= cai;
            eb *= cai;
            a1 += (TAU * f1) / SR;
            a2 += (TAU * f1 * 2.76) / SR;
            b1 += (TAU * f2) / SR;
            b2 += (TAU * f2 * 2.76) / SR;
            return ea * (Math.sin(a1) + 0.35 * Math.sin(a2)) + eb * (Math.sin(b1) + 0.35 * Math.sin(b2)) + clic;
        };
    },
    { pk: 0.45, corte: 6000 },
);

/** O tema (um compasso, Mi♭ maior). */
export const TEMA = 'Eb5:1 G5:1 Bb5:1 C6:2 Bb5:1 G5:1 Ab5:1 Bb5:2 r:1 Eb6:1 D6:1 Bb5:1 F5:1 G5:1';

export default function esbocoC() {
    const S = new Song({ bpm: 120, bars: 10, swing: 0.06, tail: 2.5 });
    const lead = S.part('lead', I.brass, {
        pan: 0.1,
        gain: 0.75,
        corte: 3600,
        echo: { rows: 3, fb: 0.22, mix: 0.18 },
        rev: 0.12,
    });
    const leadP = S.part('lead-pulso', I.pulse, { pan: -0.1, gain: 0.3, corte: 3000 });
    const met = S.part('metais', I.brass, { pan: -0.25, gain: 0.45, corte: 3000, rev: 0.15 });
    const ep = S.part('piano', I.epiano, { pan: -0.2, gain: 0.7, rev: 0.3 });
    const bs = S.part('baixo', I.slap, { gain: 0.45, corte: 2600 });
    const cor = S.part('cordas', I.strings, { pan: 0.15, gain: 0.5, rev: 0.35 });
    const tel = S.part('telefone', telefone, { drum: true, pan: 0.3, gain: 0.6, rev: 0.15 });
    const ris = S.part('riser', sobe(2), { drum: true, gain: 0.35 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.55 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.0 });
    const oh = S.part('chimbal-aberto', I.ohat, { drum: true, pan: 0.3, gain: 1.0 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: -0.2, gain: 1.3 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.4 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.7,
        rev: 0.15,
    });
    const pr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const fa = thirdBelow(MAJOR(5));

    // ===== VINHETA (0–2,5 s): o telefone toca sozinho; a bancada atende com o tema em stop-time (Lá♭maj7 → Si♭7sus4)
    // e o Mi♭ agudo cai no logo, com o prato e o acorde
    tel.note(0, 0, 0, 1);
    mel(lead, 0, ['r:4 Eb5:1 G5:1 Bb5:1 C6:2 Bb5:1 G5:1 Ab5:1 Bb5:2 r:1 Eb6:1', 'D6:1 Bb5:1 F5:1 G5:1 Eb6:4! r:8']);
    mel(leadP, 0, ['r:4 Eb5:1 G5:1 Bb5:1 C6:2 Bb5:1 G5:1 Ab5:1 Bb5:2 r:1 Eb6:1', 'D6:1 Bb5:1 F5:1 G5:1 Eb6:4! r:8']);
    stabs(
        ep,
        0,
        'Abmaj7',
        [
            [4, 3],
            [10, 2],
        ],
        { low: 55, n: 4, vel: 0.6 },
    );
    stabs(ep, 0, 'Bb7sus4', [[12, 4]], { low: 55, n: 4, vel: 0.6 });
    mel(bs, 0, ['r:4 Ab2:2 r:1 Ab2:1 Eb2:2 r:2 Bb2:2 r:1 Bb2:1', 'Bb2:1 C3:1 D3:1 r:13'], { vel: 0.85 });
    drum(kk, 0, 1, '....X.....x.....', { vel: 0.8 });
    drum(sn, 0, 1, '........x...x.xx', { vel: 0.5 });
    drum(hh, 0, 1, '....x.x.x.x.x.x.', { vel: 0.4 });
    pr.note(20, 0, 0, 1);
    kk.note(20, 0, 0, 1);
    padChord(cor, 0, 'Ebmaj7', 8, { low: 58, n: 4, vel: 0.5, at: 20 });

    // ===== FUNDO DE FALA (2,5–10,5 s): I–vi–IV–V com extensões, o slap andando, o piano em contratempo, sem lead; o
    // telefone toca num vão e o lead atende no outro
    const F0 = 1.25;
    ['Ebmaj7', 'Cm9', 'Abmaj7', 'Bb7sus4'].forEach((c, i) => {
        const b = F0 + i;
        drum(kk, b, 1, 'X.....x...X.....', { vel: 0.55 });
        drum(sn, b, 1, '....x.......x..o', { vel: 0.45 });
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.28 });
        bass(bs, b, c, '0:1 r:1 8:1 0:1 r:1 5:1 s:1 8:1 r:1 0:1 3:1 5:1 r:1 s:1 8:1 5:1', { vel: 0.6 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [11, 3],
            ],
            { low: 55, n: 4, vel: 0.35 },
        );
    });
    padChord(cor, F0 + 2, 'Abmaj7', 16, { low: 60, n: 3, vel: 0.25 });
    padChord(cor, F0 + 3, 'Bb7sus4', 16, { low: 60, n: 3, vel: 0.25 });
    tel.note((F0 + 1) * 16 + 12, 0, 0, 0.45);
    mel(lead, F0 + 2, ['r:12 F5:1 G5:1 Bb5:2'], { vel: 0.6 });

    // ===== VIRADA (10,5–12,5 s): o telefone não para, o baixo sobe pelo cromático, a caixa rufa, o riser e os toms
    const V = 5.25;
    tel.note(V * 16, 2, 0, 0.75);
    tel.note(V * 16 + 5, 2, 0, 0.75);
    mel(bs, V, ['Bb2:2 B2:2 C3:2 Db3:2 D3:2 Eb3:2 E3:2 r:2'], { vel: 0.8 });
    stabs(ep, V, 'C7sus4', [0, 4, 8, 12], { low: 55, n: 4, vel: 0.45 });
    padChord(cor, V, 'C7sus4', 16, { low: 58, n: 4, vel: 0.4 });
    drum(kk, V, 1, 'X...X...X...X...', { vel: 0.6 });
    for (let i = 8; i < 16; i++) sn.note(V * 16 + i, 0, 0, 0.25 + 0.06 * (i - 8));
    ris.note(V * 16, 0, 0, 0.8);
    for (const [k, p] of [7, 4, 2, 0].entries()) tm.note(V * 16 + 12 + k, p, 0, 0.6);

    // ===== VEM AÍ (12,5–18,5 s): um tom acima (Fá maior), bumbo reto; o tema com segunda voz, os metais respondem, o
    // SOC-CER-MON com as palmas, e o fim suspenso com o telefone tocando
    const VA = 6.25;
    pr.note(VA * 16, 0, 0, 1);
    ['Bbmaj7', 'C7sus4', 'Dm7'].forEach((c, i) => {
        const b = VA + i;
        drum(kk, b, 1, 'X...X...X...X...', { vel: 0.65 });
        drum(oh, b, 1, '..x...x...x...x.', { vel: 0.4 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.45 });
        drum(sk, b, 1, 'xxXxxxXxxxXxxxXx', { vel: 0.4 });
        bass(bs, b, c, '0:2 8:1 0:1 r:2 5:2 0:2 8:1 0:1 r:2 s:2', { vel: 0.7 });
        stabs(
            ep,
            b,
            c,
            [
                [2, 2],
                [6, 2],
                [10, 2],
                [14, 2],
            ],
            { low: 55, n: 4, vel: 0.35 },
        );
        padChord(cor, b, c, 16, { low: 58, n: 4, vel: 0.3 + 0.08 * i });
    });
    mel(lead, VA, [TEMA], { shift: 2, vel: 0.95 });
    mel(leadP, VA, [TEMA], { shift: 2, vel: 0.9 });
    mel(met, VA, [TEMA], { shift: 2, harm: fa, vel: 0.6 });
    mel(met, VA + 1, ['r:2 C6:1 D6:1 F6:3 E6:1 D6:2 C6:2 A5:2 G5:2'], { vel: 0.8 });
    const gancho = GANCHO.em({ tom: 5 });
    mel(lead, VA + 2, [gancho], { vel: 1 });
    mel(leadP, VA + 2, [gancho], { vel: 0.9 });
    mel(met, VA + 2, [gancho], { harm: fa, vel: 0.75 });
    drum(cl, VA + 2, 1, GANCHO.palmas, { vel: 0.9 });
    const FIM = 9.25 * 16;
    pr.note(FIM, 0, 0, 1);
    kk.note(FIM, 0, 0, 1);
    stabs(met, 0, 'C7sus4', [[FIM, 8]], { low: 60, n: 4, vel: 0.7 });
    stabs(ep, 0, 'C7sus4', [[FIM, 8]], { low: 55, n: 4, vel: 0.5 });
    padChord(cor, 0, 'C7sus4', 12, { low: 58, n: 4, vel: 0.5, at: FIM });
    bs.note(FIM, 36, 6, 0.9);
    tel.note(FIM + 4, 5, 0, 0.8);
    return S;
}
