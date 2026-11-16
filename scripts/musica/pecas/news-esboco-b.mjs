// Soccermon News #1, esboço B: "marcha de plantão com balanço" (15/11/2026; o pedido no topo do esboço A).
// A ideia: a notícia chega pelo telégrafo e a banda da praça anuncia. O telégrafo bipa ("bi-bi-bi-biiip", a pergunta)
// e a fanfarra responde com o tema: trompetes em terças, trombones, tuba, tímpano e caixa de marcha, mas com swing de
// 0,14 (marchinha, não desfile). Si♭ maior, 120 BPM. O tema: sobe do Fá ao Si♭, repete, salta a terça até o Ré e cai
// pelo Dó até o Si♭. Na fala: tuba em "um-pa" com antecipação, os trombones abafados no "pa" e a caixa de leve; o
// flautim pergunta e os trombones respondem nos vãos. A troca pro VESTIÁRIO conta a piada: os metais tocam o
// SOC-CER-MON, mas no lugar das palmas o telégrafo dispara nervoso e o pavio do Voltorb chia... e só faz "pff". Um
// tempo de silêncio e a marcha volta na ponta do pé, em Si♭ menor: pizzicato com o tema, o relógio do vestiário, o
// fagote descendo pelo cromático ("virou reserva"), e os metais tentam o SOC-CER-MON de novo e o MON murcha.
// Mapa (s): 0–2,5 vinheta · 2,5–10,5 fundo de fala · 10,5–12,5 virada · 12,5–18,5 VESTIÁRIO · 18,5 fim.
import { plim, svf } from '../curtas.mjs';
import { bass, drum, GANCHO, I, ins, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'News #1, esboço B: marcha de plantão', tela: 'Soccermon News #1 (vídeo)' };

/** O bipe do telégrafo (seno puro, ataque curto). */
const telegrafo = ins({ vol: 0.3, a: 0.002, r: 0.015, shape: 0, sv: 1, d: 0 });
/** O pavio do Voltorb chiando: ruído agudo com estalinhos. */
export const pavio = (dur) =>
    som(
        dur,
        (p, r) => {
            const fl = svf(0.7);
            let estalo = 0;
            return (t) => {
                if (r() < 0.0009) estalo = 1;
                estalo *= 0.995;
                const n = r() * 2 - 1;
                const env = Math.min(1, t / 0.05) * Math.min(1, (dur - t) / 0.06);
                return (0.5 * fl(n, 5000 * k12(p)) + 0.8 * n * estalo) * env;
            };
        },
        { pk: 0.4, corte: 9000 },
    );
/** O "pff" do pavio apagando: ruído que cai de 3 kHz pra 300 Hz em 0,3 s. */
export const pff = som(
    0.35,
    (p, r) => {
        const fl = svf(0.9);
        return (t) => {
            const x = Math.min(1, t / 0.3);
            const env = Math.min(1, t / 0.01) * (1 - x) ** 1.5;
            return fl(r() * 2 - 1, (3000 - 2700 * x ** 0.6) * k12(p)) * env;
        };
    },
    { pk: 0.4 },
);

/** O tema (12 linhas, Si♭ maior). */
export const TEMA = 'F5:1 Bb5:1 r:1 Bb5:1 A5:1 Bb5:1 D6:3! C6:1 Bb5:2';

export default function esbocoB() {
    const S = new Song({ bpm: 120, bars: 10, swing: 0.14, tail: 2.5 });
    const tp = S.part('trompete', I.brass, { pan: 0.2, gain: 0.6, corte: 3400, rev: 0.18 });
    const tp2 = S.part('trompete2', I.brass, { pan: -0.2, gain: 0.5, corte: 3000, rev: 0.18 });
    const tbn = S.part('trombone', I.brass, { pan: -0.1, gain: 0.55, corte: 1800, rev: 0.15 });
    const fl = S.part('flautim', I.piccolo, { pan: 0.3, gain: 1.1, corte: 4500, rev: 0.2 });
    const lira = S.part('lira', I.bell, { pan: 0.25, gain: 1.0, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.28 });
    const pz = S.part('pizz', I.pizz, { pan: 0.15, gain: 0.9, rev: 0.15 });
    const fg = S.part('fagote', I.bassoon, { pan: -0.15, gain: 0.8, corte: 1800, rev: 0.12 });
    const tg = S.part('telegrafo', telegrafo, { pan: 0.25, gain: 0.7, rev: 0.1 });
    const tcl = S.part('chave', I.block, { pan: 0.25, gain: 0.4 });
    const pv = S.part('pavio', pavio(0.65), { drum: true, pan: 0.1, gain: 0.5 });
    const pf = S.part('pff', pff, { drum: true, gain: 0.6 });
    const pl = S.part('plim', plim, { drum: true, pan: 0.2, gain: 0.5, rev: 0.2 });
    const rel = S.part('relogio', I.block, { drum: true, pan: -0.25, gain: 1.0 });
    const tim = S.part('timpano', I.timp, { drum: true, gain: 0.15 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
    const pr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const bb = thirdBelow(MAJOR(10));
    /** Um bipe do telégrafo com o clique da chave. */
    const bip = (t, l, vel = 0.9, nota = 77) => {
        tg.note(t, nota, l, vel);
        tcl.note(t, 96, 0.3, vel * 0.6);
    };

    // ===== VINHETA (0–2,5 s): o telégrafo chega com a notícia sobre o rufo do tímpano; a fanfarra responde com o tema
    // em terças; o acorde no logo e os trombones fechando
    for (const [t, l] of [
        [0, 0.6],
        [1, 0.6],
        [2, 0.6],
        [3, 1.6],
    ])
        bip(t, l);
    drum(tim, 0, 1, 'oxxx............', { vel: 0.5 });
    mel(tp, 0, [`r:4 ${TEMA}`], { vel: 0.9 });
    mel(tp2, 0, [`r:4 ${TEMA}`], { harm: bb, vel: 0.75 });
    mel(lira, 0, [`r:4 ${TEMA}`], { shift: 12, vel: 0.35 });
    drum(kk, 0, 1, '....x..x..x.....', { vel: 0.8 });
    drum(tim, 0, 1, '....x.....x.....', { vel: 0.8 });
    drum(sn, 0, 1, '....x.o.o.x.xxxx', { vel: 0.5 });
    mel(tuba, 0, ['r:4 Bb1:2 r:1 F2:1 r:2 Bb1:2 r:2 F2:2'], { vel: 0.8 });
    pr.note(16, 0, 0, 1);
    kk.note(16, 0, 0, 1);
    tim.note(16, 0, 0, 1);
    stabs(tp, 1, 'Bb6', [[0, 3]], { low: 62, n: 4, vel: 0.85 });
    mel(tbn, 1, ['D4:1 C4:1 Bb3:2! r:12'], { vel: 0.9 });
    tuba.note(16, 34, 3, 0.9);

    // ===== FUNDO DE FALA (2,5–10,5 s): "um-pa" da tuba com antecipação, os trombones abafados no "pa", a caixa de
    // leve; o flautim pergunta e os trombones respondem no último tempo
    const F0 = 1.25;
    ['Bb6', 'Gm7', 'Cm7', 'F7'].forEach((c, i) => {
        const b = F0 + i;
        bass(tuba, b, c, '0:2 r:4 5:2 8:2 r:4 5:2', { vel: 0.7 });
        stabs(
            tbn,
            b,
            c,
            [
                [4, 2],
                [12, 2],
            ],
            { low: 53, n: 3, vel: 0.35 },
        );
        drum(kk, b, 1, 'X.......X.......', { vel: 0.5 });
        drum(sn, b, 1, 'x.o.x..ox.o.x.oo', { vel: 0.35 });
    });
    mel(fl, F0 + 1, ['r:11 G5:1 A5:1 Bb5:1 D6:2'], { vel: 0.6 });
    mel(tbn, F0 + 2, ['r:12 Eb4:1 D4:1 C4:2'], { vel: 0.6 });
    mel(fl, F0 + 3, ['r:12 A5:1 C6:1 Eb6:2'], { vel: 0.6 });

    // ===== VIRADA (10,5–12,5 s): o SOC-CER-MON nos metais com o tímpano; no lugar das palmas o telégrafo dispara e o
    // pavio chia... "pff", e um tempo de silêncio
    const V = 5.25;
    const gancho = GANCHO.em({ tom: -2 });
    mel(tp, V, [gancho], { vel: 0.9 });
    mel(tp2, V, [gancho], { harm: bb, vel: 0.75 });
    mel(tbn, V, [gancho], { shift: -12, vel: 0.7 });
    for (const o of [0, 3, 6]) {
        tim.note(V * 16 + o, 0, 0, 0.9);
        kk.note(V * 16 + o, 0, 0, 0.8);
    }
    pr.note(V * 16, 0, 0, 0.7);
    mel(tuba, V, ['Bb1:3 Bb1:3 Eb2:6 r:4'], { vel: 0.8 });
    stabs(tbn, V, 'Eb', [[6, 5]], { low: 55, n: 3, vel: 0.5 });
    pv.note(V * 16 + 11, 0, 0, 0.9);
    for (const [k, d] of [0, 0.75, 1.4, 1.9, 2.3, 2.6, 2.85, 3.05, 3.2].entries())
        bip(V * 16 + 12 + d, 0.35, 0.5 + 0.05 * k, 77 + (k > 5 ? 1 : 0));
    pf.note(V * 16 + 16, 0, 0, 0.9);

    // ===== VESTIÁRIO (13–18,5 s): na ponta do pé, Si♭ menor. O relógio do vestiário, o pizzicato com o tema, o fagote
    // descendo pelo cromático ("virou reserva"); os metais tentam o SOC-CER-MON e o MON murcha
    const VE = 6.5;
    drum(rel, VE, 3, 'x...x...x...x...', { vel: 0.6 });
    for (const [k, t] of [0, 8, 16, 24].entries()) tuba.note(VE * 16 + t, k % 2 ? 41 : 34, 2, 0.55);
    mel(pz, VE, ['F4:1 r:1 Bb4:1 r:1 Bb4:1 A4:1 Bb4:1 r:1 Db5:2 C5:1 r:1 Bb4:1 r:3'], { vel: 0.9 });
    stabs(pz, VE, 'Bbm', [4, 12], { low: 53, n: 3, vel: 0.35 });
    mel(fg, VE + 1, ['r:2 F3:1 r:1 E3:1 r:1 Eb3:1 r:1 Db3:4 r:4'], { vel: 0.9 });
    stabs(pz, VE + 1, 'Gbmaj7', [4, 12], { low: 53, n: 3, vel: 0.35 });
    mel(tp, VE + 2, ['F5:3 Db5:3 E4:6~ r:4'], { vel: 0.6 });
    mel(tp2, VE + 2, ['Db5:3 Bb4:3 r:10'], { vel: 0.5 });
    tuba.note((VE + 2) * 16 + 6, 40, 5, 0.9);
    pl.note((VE + 2) * 16 + 12, -2, 0, 0.7);
    return S;
}
