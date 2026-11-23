// Kit da rodada 2 do álbum (16/11/2026): o "punch" e os timbres novos que as faixas de álbum dividem. O Miguel achou
// as faixas "inofensivas": aqui moram a bateria com corpo (bumbo com a nota caindo e o estalo, caixa com corpo e
// esteira), o barramento comprimido da bateria (`BATERIA`, pro `barramentos` do Song), o bombeio (o baixo e os
// acordes abaixam um tico a cada bumbo, pro bumbo passar) e as vozes que respeitam a duração (feitas com o `voz` do
// Koga): trombone e trompete com o brilho que abre no ataque, Rhodes, órgão de rodas, baixo de dedo, guitarra de
// corda (Karplus-Strong com drive) e as palmas no lugar certo (o clap 808 da receita 7b, macio).
import { voz } from '../pecas/lider-koga.mjs';
import { k12, som } from '../pecas/livre-ginasio.mjs';
import { I, SR } from '../synth.mjs';

const TAU = Math.PI * 2;

/** Barramento da bateria: compressão paralela, ataque que deixa o estalo passar e soltura no tempo do groove. */
export const BATERIA = { limiar: -20, razao: 4, ataque: 0.012, solta: 0.11, ganho: 5, paralelo: 0.6 };

/** Bumbo com corpo: a nota cai de ~150 Hz pra ~50 Hz (`p` em semitons), o estalo do batedor e um tico de drive. */
export const bumbo = som(
    0.55,
    (p, r) => {
        let ph = 0;
        return (t) => {
            const f = (48 + 110 * Math.exp(-t / 0.028)) * k12(p);
            ph += (TAU * f) / SR;
            const corpo = Math.tanh(1.6 * Math.sin(ph)) * Math.exp(-t / 0.22);
            const estalo = (r() * 2 - 1) * Math.exp(-t / 0.0025) * 0.5;
            return corpo + estalo;
        };
    },
    { pk: 0.6 },
);

/** Caixa com corpo: dois tons do casco (~190 e ~330 Hz) e a esteira (ruído clareado) mais longa. */
export const caixa = som(
    0.4,
    (p, r) => {
        let a = 0;
        return (t) => {
            const kp = k12(p);
            const casco =
                Math.sin(TAU * 185 * kp * t) * Math.exp(-t / 0.07) +
                0.5 * Math.sin(TAU * 330 * kp * t) * Math.exp(-t / 0.04);
            const n = r() * 2 - 1;
            const claro = n - a; // passa-alta simples: a esteira chia
            a += 0.35 * (n - a);
            const esteira = claro * (0.25 * Math.exp(-t / 0.004) + 0.75 * Math.exp(-t / 0.13));
            return 0.75 * casco * Math.min(1, t / 0.001) + 0.9 * esteira;
        };
    },
    { pk: 0.55, corte: 9000 },
);

/** Aro (cross-stick): o estalo de madeira no aro da caixa, pros versos e as baladas. */
export const aro = som(
    0.12,
    (p, r) => (t) =>
        Math.sin(TAU * 1750 * k12(p) * t) * Math.exp(-t / 0.012) +
        0.6 * Math.sin(TAU * 520 * k12(p) * t) * Math.exp(-t / 0.02) +
        0.4 * (r() * 2 - 1) * Math.exp(-t / 0.003),
    { pk: 0.5, corte: 7000 },
);

/** Surdo de escola de samba: grave, longo, a pele batendo. */
export const surdo = som(
    0.9,
    (p, r) => {
        let ph = 0;
        return (t) => {
            ph += (TAU * (62 + 25 * Math.exp(-t / 0.04)) * k12(p)) / SR;
            return Math.sin(ph) * Math.exp(-t / 0.35) + 0.25 * (r() * 2 - 1) * Math.exp(-t / 0.004);
        };
    },
    { pk: 0.6 },
);

/** Tamborim: agudo, seco, com a baqueta. */
export const tamborim = som(
    0.1,
    (p, r) => (t) =>
        Math.sin(TAU * 820 * k12(p) * t) * Math.exp(-t / 0.018) + 0.5 * (r() * 2 - 1) * Math.exp(-t / 0.006),
    { pk: 0.45, corte: 8000 },
);

/** O clap 808 da casa, macio (receita 7b): −6 dB, passa-baixa a 6,5 kHz, sala curta. `molhado` = o da Rocket. */
export const clapMacio = I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 });
export const clapMolhado = I.clap808.com({ ganho: 0.5, corte: 6200, sala: 0.6, tom: -2 });

/**
 * Bombeio (sidechain): devolve um `gainAt` que abaixa `prof` (0 a 1) a cada nota do bumbo e volta em `solta` s.
 * Chame ANTES de escrever as notas do bumbo (ele anota os tempos), ou numa faixa que grava as notas (`estender`).
 */
export function bombeio(S, P, { prof = 0.3, solta = 0.14 } = {}) {
    const t = [];
    // faixa que já grava as notas (as do `estender`): os tempos saem dali; senão, anota as que vierem
    if (!P.rec) {
        const note = P.note;
        P.note = (row, m, len, vel) => {
            if (vel > 0.5) t.push(S.sec(row));
            note(row, m, len, vel);
        };
    }
    let ord = null;
    return (s) => {
        if (!ord) ord = Float64Array.from(P.rec ? P.rec.filter((x) => x[3] > 0.5).map((x) => S.sec(x[0])) : t).sort();
        let lo = 0;
        let hi = ord.length - 1;
        if (hi < 0 || s < ord[0]) return 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (ord[mid] <= s) lo = mid;
            else hi = mid - 1;
        }
        const d = s - ord[lo];
        const ataque = Math.min(1, d / 0.004);
        return 1 - prof * ataque * Math.exp(-d / solta);
    };
}

/** Junta dois `gainAt` (camada × bombeio). */
export const vezes = (a, b) => (a && b ? (t) => a(t) * b(t) : a || b);

// ---------- vozes (melódicas, respeitam a duração da nota) ----------

/** Naipe de metal: dente de serra somada à mão com o brilho que abre no ataque ("blat") e vibrato que chega tarde. */
const metal =
    ({ brilho = 0.6, abre = 0.05, vib = 0.006, harm = 14 } = {}) =>
    (f, seg) => {
        let ph = 0;
        const nh = Math.max(1, Math.min(harm, Math.floor(16000 / f)));
        return (t) => {
            const v = 1 + vib * Math.sin(TAU * 5.3 * t) * Math.min(1, Math.max(0, (t - 0.3) / 0.3));
            ph += (TAU * f * v) / SR;
            // o brilho sobe no ataque, assenta, e fecha um pouco no fim das notas longas
            const b = brilho * (0.55 + 0.45 * Math.exp(-t / 0.12)) * (seg > 0.6 ? 1 - 0.25 * Math.min(1, t / seg) : 1);
            let y = 0;
            for (let k = 1; k <= nh; k++) y += (Math.sin(k * ph) / k) * Math.exp(-(k - 1) * (1 - b) * 0.55);
            return 0.7 * y * Math.min(1, t / abre);
        };
    };

export const trombone = (S, nome, o = {}) =>
    voz(S, nome, metal({ brilho: 0.5, abre: 0.045, harm: 12 }), o, { pk: 0.5, solta: 0.09 });
export const trompete = (S, nome, o = {}) =>
    voz(S, nome, metal({ brilho: 0.72, abre: 0.025, vib: 0.008, harm: 16 }), o, { pk: 0.42, solta: 0.07 });
export const tuba = (S, nome, o = {}) =>
    voz(S, nome, metal({ brilho: 0.3, abre: 0.05, harm: 8 }), o, { pk: 0.6, solta: 0.1 });

/** Rhodes: FM com o índice caindo (o "tine" no ataque), trêmolo leve. */
export const rhodes = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            let ph = 0;
            return (t) => {
                ph += (TAU * f) / SR;
                const idx = 1.4 * Math.exp(-t / 0.35) + 0.25;
                const tine = 0.12 * Math.sin(14 * ph) * Math.exp(-t / 0.03);
                const am = 1 + 0.12 * Math.sin(TAU * 4.8 * t);
                return (Math.sin(ph + idx * Math.sin(ph)) * Math.exp(-t / 1.8) + tine) * am * Math.min(1, t / 0.002);
            };
        },
        o,
        { pk: 0.45, solta: 0.18 },
    );

/** Órgão de rodas (16', 8', 5⅓', 4', 2') com o Leslie lento e o clique da tecla. */
export const orgao = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f, _s, r) => {
            let ph = 0;
            return (t) => {
                const les = 1 + 0.004 * Math.sin(TAU * 6.4 * t);
                ph += (TAU * f * les) / SR;
                const y =
                    0.6 * Math.sin(0.5 * ph) +
                    Math.sin(ph) +
                    0.6 * Math.sin(1.5 * ph) +
                    0.5 * Math.sin(2 * ph) +
                    0.25 * Math.sin(4 * ph);
                const clique = (r() * 2 - 1) * Math.exp(-t / 0.002) * 0.3;
                return (0.32 * y * (1 + 0.1 * Math.sin(TAU * 6.4 * t + 1)) + clique) * Math.min(1, t / 0.004);
            };
        },
        o,
        { pk: 0.4, solta: 0.05 },
    );

/** Baixo de dedo: fundamental gorda e o brilho do dedo que fecha; um tico de drive pra ficar presente no celular. */
export const baixoDedo = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            let ph = 0;
            return (t) => {
                ph += (TAU * f) / SR;
                const b = Math.exp(-t / 0.09);
                const y =
                    Math.sin(ph) +
                    (0.45 + 0.35 * b) * Math.sin(2 * ph) +
                    (0.18 + 0.4 * b) * Math.sin(3 * ph) +
                    0.3 * b * Math.sin(4 * ph) +
                    0.15 * b * Math.sin(5 * ph);
                return Math.tanh(1.3 * y) * (0.75 + 0.25 * Math.exp(-t / 0.5)) * Math.min(1, t / 0.003);
            };
        },
        o,
        { pk: 0.55, solta: 0.05 },
    );

/** Guitarra: corda de Karplus-Strong com palheta e drive (`sujo` 0 a 1); `abafa` encurta (palm mute). */
export const guitarra = (S, nome, o = {}, { sujo = 0.6, abafa = 0 } = {}) =>
    voz(
        S,
        nome,
        (f, _s, r) => {
            const n = Math.max(2, Math.round(SR / f));
            const buf = Float32Array.from({ length: n }, () => r() * 2 - 1);
            let i = 0;
            let prev = 0;
            const perda = abafa ? 0.94 : 0.996;
            return () => {
                const x = buf[i];
                const y = perda * 0.5 * (x + prev);
                prev = x;
                buf[i] = y;
                i = (i + 1) % n;
                return Math.tanh((1 + 6 * sujo) * x) / Math.tanh(1 + 6 * sujo);
            };
        },
        o,
        { pk: 0.35, solta: 0.06 },
    );

/** Celesta / caixinha: sino curto e doce. */
export const celesta = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => (t) =>
            (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 4 * f * t) * Math.exp(-t / 0.08)) *
            Math.exp(-t / 0.9) *
            Math.min(1, t / 0.002),
        o,
        { pk: 0.4, solta: 0.3 },
    );

/**
 * As opções do `estender` pra dar punch numa peça do jogo sem reescrever: o bumbo e a caixa do kit no barramento
 * comprimido, e a palma (qualquer uma) trocada pelo clap 808 macio. `{ bumbo: 'kick', caixa: 'snare', palmas: 'palmas' }`
 * = os nomes das faixas na peça; `g*` = ganho de cada uma.
 */
export function soco({ bumbo: kb, caixa: cx, palmas: pl, gBumbo = 0.85, gCaixa = 0.7, gPalmas = 1 } = {}) {
    const bus = {};
    const troca = {};
    if (kb) {
        bus[kb] = 'bateria';
        troca[kb] = { inst: bumbo, gain: gBumbo };
    }
    if (cx) {
        bus[cx] = 'bateria';
        troca[cx] = { inst: caixa, gain: gCaixa };
    }
    if (pl) troca[pl] = { inst: clapMacio, gain: gPalmas };
    return { barramentos: { bateria: BATERIA }, bus, troca };
}
