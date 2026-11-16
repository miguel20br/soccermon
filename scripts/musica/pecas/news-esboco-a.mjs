// Soccermon News #1, esboço A: "funk de redação" (15/11/2026). O Miguel achou a trilha v9 "bem paia" e pediu pra
// rever a sério: três esboços de ~20 s (vinheta, fundo de fala, a troca pra um bloco) pra ele escolher o clima.
// A ideia: a redação é a banda. A máquina de escrever digita a melodia junto com o lead (cada nota é uma tecla), a
// campainha do fim da linha fecha a frase e o carro voltando ("zzzip-tunc") é a virada. Funk em Fá dórico (o Ré
// natural, a 6ª maior, é a cor do tema), 120 BPM, swing 0,12. Pergunta e resposta: o lead pergunta e para no Lá♭, no
// ar; os metais respondem na tônica. Na fala a máquina some (não briga com os blips do texto): ficam o baixo, o
// clavinete abafado e o piano. A troca pro AO VIVO: a máquina digita o SOC-CER-MON com os metais, as palmas
// respondem, o carro volta e tudo sobe um tom (Sol dórico) pra rua: samba-funk com agogô e cuíca, o assovio do
// Meowth com o tema e as moedas do Pay Day respondendo no 3-3-2; fecha com a cascata de moedas e a campainha.
// Mapa (s): 0–2,5 vinheta · 2,5–10,5 fundo de fala · 10,5–12,5 virada · 12,5–18,5 AO VIVO · 18,5 fim.
import { cuica, svf } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, Song, SR, stabs, thirdBelow } from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'News #1, esboço A: funk de redação', tela: 'Soccermon News #1 (vídeo)' };

const TAU = Math.PI * 2;

/** A tecla da máquina de escrever: o estalo do tipo no papel, o "toc" do corpo e o mecanismo voltando. */
export const tecla = som(
    0.08,
    (p, r) => {
        const fl = svf(0.7);
        let ph = 0;
        return (t) => {
            ph += (TAU * 180 * k12(p)) / SR;
            const n = r() * 2 - 1;
            const estalo = fl(n, 3400 * k12(p)) * Math.exp(-t / 0.0035);
            const corpo = 0.45 * Math.sin(ph) * Math.exp(-t / 0.014);
            const volta = t > 0.022 ? 0.18 * n * Math.exp(-(t - 0.022) / 0.004) : 0;
            return estalo + corpo + volta;
        };
    },
    { pk: 0.5, corte: 7500 },
);
/** O carro voltando: a catraca correndo ("zzzip", 0,3 s) e o "tunc" do batente em 0,33 s. */
export const carro = som(
    0.5,
    (p, r) => {
        const fl = svf(0.8);
        let prox = 0;
        let tc = -1;
        let a = 0;
        let ph = 0;
        return (t) => {
            if (t >= prox && t < 0.3) {
                tc = t;
                a = 0.5 + 0.5 * r();
                prox = t + 0.012 + 0.008 * r() + 0.02 * t;
            }
            const n = r() * 2 - 1;
            const f = fl(n, 2600 * k12(p) * (1 + t));
            let y = tc >= 0 ? f * a * Math.exp(-(t - tc) / 0.0025) : 0;
            y += 0.06 * f * (t < 0.3 ? Math.sin((Math.PI * t) / 0.3) : 0);
            if (t >= 0.33) {
                ph += (TAU * 95 * k12(p)) / SR;
                const u = t - 0.33;
                y += 0.9 * Math.sin(ph) * Math.exp(-u / 0.03) + 0.4 * n * Math.exp(-u / 0.004);
            }
            return y;
        };
    },
    { pk: 0.5, corte: 8000 },
);
/** Linhas até o "tunc" do carro. */
const TUNC = 0.33 / 0.125;

/** O tema (um compasso, Fá dórico): três teclas no Fá, sobe, salta a 6ª maior até o Ré e para no Lá♭ (pergunta). */
export const TEMA = 'F5:1 F5:1 F5:1 Ab5:2 F5:1 D6:3! C6:1 Bb5:1 Ab5:1 r:4';
const inicios = (s) => {
    let t = 0;
    const o = [];
    for (const tok of s.split(' ')) {
        const [n, l] = tok.split(':');
        if (n !== 'r') o.push(t);
        t += Number.parseInt(l, 10);
    }
    return o;
};

export default function esbocoA() {
    const S = new Song({ bpm: 120, bars: 10, swing: 0.12, tail: 2.5 });
    const lead = S.part('lead', I.pulse, {
        pan: 0.1,
        gain: 0.9,
        corte: 2800,
        echo: { rows: 3, fb: 0.2, mix: 0.15 },
        rev: 0.1,
    });
    const lead2 = S.part('lead2', I.counter, { pan: -0.1, gain: 0.8, rev: 0.1 });
    const met = S.part('metais', I.brass, { pan: 0.25, gain: 0.55, corte: 3000, rev: 0.15 });
    const met2 = S.part('metais2', I.brass, { pan: -0.25, gain: 0.45, corte: 2400, rev: 0.15 });
    const clav = S.part('clav', I.clav, { pan: -0.3, gain: 0.8, corte: 2600 });
    const ep = S.part('piano', I.epiano, { pan: 0.2, gain: 0.5, rev: 0.25 });
    const bs = S.part('baixo', I.slap, { gain: 0.4, corte: 2400 });
    const gt = S.part('guitarra', I.chank, { pan: 0.35, gain: 1.4 });
    const asso = S.part('assovio', I.piccolo, {
        pan: 0.15,
        gain: 1.0,
        corte: 4000,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.2,
    });
    const cui = S.part('cuica', cuica({ sobe: 6 }), { pan: -0.25, gain: 0.45, rev: 0.15 });
    const tc = S.part('tecla', tecla, { drum: true, pan: 0.15, gain: 1.0, rev: 0.08 });
    const car = S.part('carro', carro, { drum: true, pan: -0.2, gain: 0.9, rev: 0.1 });
    const ding = S.part('campainha', I.bell, { pan: 0.3, gain: 1.3, rev: 0.25 });
    const moeda = S.part('moedas', I.coin, { drum: true, pan: 0.2, gain: 0.7, rev: 0.15 });
    const ago = S.part('agogo', I.agogo, { drum: true, pan: -0.3, gain: 0.8 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.2 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: -0.2, gain: 1.4 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.7,
        rev: 0.15,
    });
    const pr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const fa = thirdBelow(MAJOR(3)); // Fá dórico = as notas de Mi♭ maior
    const sol = thirdBelow(MAJOR(5)); // Sol dórico = as de Fá maior

    // ===== VINHETA (0–2,5 s): o tema com a máquina digitando cada nota; os metais e o bumbo em stop-time; no fim da
    // linha a campainha, o carro volta e o "tunc" cai no logo, onde os metais respondem na tônica
    mel(lead, 0, [TEMA], { vel: 0.9 });
    mel(lead2, 0, [TEMA], { vel: 0.7 });
    for (const [k, o] of inicios(TEMA).entries()) tc.note(o, k % 3 ? 0 : 2, 0, 0.9);
    pr.note(0, 0, 0, 0.8);
    kk.note(0, 0, 0, 1);
    kk.note(6, 0, 0, 0.8);
    bass(bs, 0, 'Fm9', '0:2 r:4 0:1 8:1 r:8', { vel: 0.9 });
    stabs(
        met,
        0,
        'Fm9',
        [
            [0, 2],
            [6, 1],
        ],
        { low: 60, n: 4, vel: 0.7 },
    );
    ding.note(12, 101, 2, 0.8);
    car.note(16 - TUNC, 0, 0, 0.9);
    pr.note(16, 0, 0, 1);
    kk.note(16, 0, 0, 1);
    mel(met, 1, ['C6:1 Ab5:1 F5:2! r:12'], { vel: 0.9 });
    mel(met2, 1, ['C6:1 Ab5:1 F5:2! r:12'], { harm: fa, vel: 0.75 });
    stabs(ep, 1, 'Fm9', [[0, 4]], { low: 53, n: 4, vel: 0.5 });
    bass(bs, 1, 'Fm9', '0:3 r:13', { vel: 0.9 });

    // ===== FUNDO DE FALA (2,5–10,5 s): o groove sem lead, a máquina calada; pergunta e resposta só no último tempo
    // de cada compasso (o vão entre uma página e outra)
    const F0 = 1.25;
    ['Fm9', 'Bb9', 'Fm9', 'Bb9'].forEach((c, i) => {
        const b = F0 + i;
        drum(kk, b, 1, 'X.....x...x.....', { vel: 0.6 });
        drum(sn, b, 1, '....x..o....x..o', { vel: 0.5 });
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.35 });
        bass(bs, b, c, '0:2 r:1 8:1 r:2 5:1 s:1 r:2 0:1 r:1 3:2 4:2', { vel: 0.7 });
        stabs(clav, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.5 });
        stabs(ep, b, c, [[0, 6]], { low: 53, n: 4, vel: 0.35 });
    });
    mel(lead2, F0, ['r:12 D6:1 C6:1 Ab5:2'], { vel: 0.55 });
    mel(met, F0 + 1, ['r:12 C5:1 Eb5:1 F5:2'], { vel: 0.5 });
    ding.note((F0 + 2) * 16 + 14, 101, 2, 0.35);

    // ===== VIRADA (10,5–12,5 s): a máquina digita o SOC-CER-MON com os metais (Fá menor), as palmas respondem, a
    // campainha, o baixo puxa pro Sol e o carro volta no 1 do AO VIVO
    const V = 5.25;
    const gancho = GANCHO.em({ menor: true, tom: 5 });
    mel(met, V, [gancho], { vel: 0.9 });
    mel(met2, V, [gancho], { shift: -12, harm: fa, vel: 0.75 });
    mel(lead, V, [gancho], { shift: -12, vel: 0.6 });
    for (const o of [0, 3, 6]) {
        tc.note(V * 16 + o, 2, 0, 1);
        kk.note(V * 16 + o, 0, 0, 0.9);
    }
    stabs(
        ep,
        V,
        'Fm9',
        [
            [0, 2],
            [3, 2],
        ],
        { low: 55, n: 4, vel: 0.5 },
    );
    stabs(ep, V, 'Dbmaj7', [[6, 5]], { low: 55, n: 4, vel: 0.5 });
    bass(bs, V, 'Fm9', '0:3 0:3 r:10', { vel: 0.85 });
    mel(bs, V, ['r:6 Db2:5 r:1 D2:2 F#2:2'], { vel: 0.85 });
    pr.note(V * 16, 0, 0, 0.7);
    drum(cl, V, 1, GANCHO.palmas, { vel: 0.9 });
    ding.note(V * 16 + 13, 101, 2, 0.6);
    drum(sn, V, 1, '............xxXX', { vel: 0.45 });

    // ===== AO VIVO (12,5–18,5 s): a rua, um tom acima (Sol dórico). O assovio do Meowth pergunta com o tema, as moedas
    // respondem no 3-3-2 e a cuíca ri; na volta o assovio fecha na tônica e os metais confirmam
    const AV = 6.25;
    car.note(AV * 16 - TUNC, 2, 0, 0.9);
    pr.note(AV * 16, 0, 0, 0.9);
    ['Gm9', 'C9', 'Gm9'].forEach((c, i) => {
        const b = AV + i;
        drum(kk, b, 1, 'X..x....X..x..x.', { vel: 0.65 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.4 });
        drum(sk, b, 1, 'xxXxxxXxxxXxxxXx', { vel: 0.45 });
        drum(ago, b, 1, 'x....x....x.....', { vel: 0.7 });
        drum(ago, b, 1, '..x....x....x.x.', { vel: 0.6, pitch: -5 });
        bass(bs, b, c, '0:1 r:1 8:1 r:1 0:1 5:1 r:1 s:1 8:1 r:1 5:1 3:1 r:1 0:1 4:1 5:1', { vel: 0.75 });
        stabs(gt, b, c, [2, 6, 9, 14], { low: 60, n: 3, vel: 0.6 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 4],
                [10, 2],
            ],
            { low: 55, n: 4, vel: 0.3 },
        );
    });
    mel(asso, AV, [TEMA], { shift: 2, vel: 0.9 });
    for (const [k, o] of [12, 13, 14].entries()) moeda.note(AV * 16 + o, 7 + 2 * k, 0, 0.5);
    for (const [k, o] of [0, 3, 6].entries()) moeda.note((AV + 1) * 16 + o, [7, 4, 12][k], 0, 0.75);
    cui.note((AV + 1) * 16 + 10, 79, 2, 0.8);
    cui.note((AV + 1) * 16 + 14, 74, 2, 0.7);
    mel(asso, AV + 2, ['G5:1 G5:1 G5:1 Bb5:2 G5:1 E6:3 D6:1 C6:1 Bb5:1 A5:1 G5:1 r:2'], { vel: 0.9 });
    mel(met, AV + 2, ['r:12 D5:1 F5:1 G5:2!'], { vel: 0.7 });
    mel(met2, AV + 2, ['r:12 D5:1 F5:1 G5:2!'], { harm: sol, vel: 0.6 });

    // ===== FIM (18,5 s): o acorde, a cascata de moedas do Pay Day e a campainha
    const FIM = 9.25 * 16;
    pr.note(FIM, 0, 0, 1);
    kk.note(FIM, 0, 0, 1);
    stabs(met, 0, 'Gm9', [[FIM, 6]], { low: 62, n: 4, vel: 0.7 });
    stabs(ep, 0, 'Gm9', [[FIM, 8]], { low: 55, n: 4, vel: 0.5 });
    bs.note(FIM, 43, 4, 0.9);
    for (let k = 0; k < 8; k++) moeda.note(FIM + 1 + k * 0.6, 14 - 2 * k, 0, 0.6 - 0.04 * k);
    ding.note(FIM + 6, 103, 4, 0.7);
    return S;
}
