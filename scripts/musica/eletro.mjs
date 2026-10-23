// Sons e efeitos das amostras de eletrônica e eletrofunk (23/10/2026, "só pra ver": nada disso está no jogo).
// Fica fora de pecas/ porque não é peça. Instrumentos no formato de `som` (livre-ginasio): (pitch ou midi) => amostras.
import { k12, som } from './pecas/livre-ginasio.mjs';
import { bandpass, hz, SR } from './synth.mjs';

const TAU = Math.PI * 2;

/** Bumbo 808 (bateria): seno que despenca de `f0` a `f1` Hz e soa `dec` s; `drive` satura o começo (funk, phonk). */
export const boom = ({ f0 = 150, f1 = 48, queda = 0.035, dec = 0.3, drive = 1, pk = 0.55 } = {}) =>
    som(
        dec * 5,
        (p) => {
            let ph = 0;
            return (t) => {
                ph += (TAU * k12(p) * (f1 + (f0 - f1) * Math.exp(-t / queda))) / SR;
                const e = Math.min(1, t / 0.0008) * Math.exp(-t / dec);
                return Math.tanh(drive * Math.sin(ph) * e) / Math.tanh(drive);
            };
        },
        { pk },
    );

/** Grave 808 afinado (melódico): o mesmo bumbo na nota, com o "tum" do ataque; `cai` = semitons que escorrega. */
export const oito = ({ dec = 0.45, drive = 1.4, cai = 0, tempoCai = 0.4 } = {}) =>
    som(dec * 5, (m) => {
        let ph = 0;
        const f = hz(m);
        return (t) => {
            const desce = cai ? k12(-cai * Math.min(1, t / tempoCai)) : 1;
            ph += (TAU * f * desce * (1 + 1.2 * Math.exp(-t / 0.012))) / SR;
            const e = Math.min(1, t / 0.001) * Math.exp(-t / dec);
            return Math.tanh(drive * (Math.sin(ph) + 0.15 * Math.sin(2 * ph)) * e) / Math.tanh(drive);
        };
    });

/** Atabaque do tamborzão: couro afinado (`f` Hz) que cai um pouco, com o tapa da mão. */
export const atabaque = (f = 180, dec = 0.12) =>
    som(
        dec * 5,
        (p, r) => {
            let ph = 0;
            let v = 0;
            return (t) => {
                ph += (TAU * f * k12(p) * (1 + 0.5 * Math.exp(-t / 0.01))) / SR;
                v += 0.45 * (r() * 2 - 1 - v);
                return Math.sin(ph) * Math.exp(-t / dec) + 0.45 * v * Math.exp(-t / 0.006);
            };
        },
        { corte: 7000 },
    );

/** Cowbell do 808 afinado (melódico, o lead do phonk): duas quadradas na razão 540:800, sujas. */
export const cowbell = som(
    0.7,
    (m) => {
        const f = hz(m);
        let a = 0;
        let b = 0;
        return (t) => {
            a += f / SR;
            b += (f * 1.4815) / SR;
            const q = (a % 1 < 0.5 ? 1 : -1) + (b % 1 < 0.5 ? 0.8 : -0.8);
            const e = Math.min(1, t / 0.0005) * (0.65 * Math.exp(-t / 0.018) + 0.35 * Math.exp(-t / 0.2));
            return Math.tanh(1.8 * q * e);
        };
    },
    { corte: 5200, pk: 0.5 },
);

/** Stab de orquestra (o "pá!" do Miami bass e do funk dos anos 90): quinta e oitavas em serra, com estalo de prato. */
export const orquestra = som(
    0.6,
    (m, r) => {
        const fs = [-12, 0, 7, 12, 19].map((d) => hz(m + d));
        const ph = fs.map(() => r());
        let v = 0;
        return (t) => {
            let s = 0;
            fs.forEach((f, i) => {
                ph[i] += (f * (1 + 0.004 * (i - 2))) / SR;
                s += (2 * (ph[i] % 1) - 1) * (i === 0 ? 1.3 : 1);
            });
            v += 0.6 * (r() * 2 - 1 - v);
            const e = Math.min(1, t / 0.002) * Math.exp(-t / 0.13);
            return (s / 4) * e + 0.5 * v * Math.exp(-t / 0.03);
        };
    },
    { corte: 4200 },
);

/** Ruído pra subida (riser) e ventania: `seg` de ruído branco que cresce; abra o filtro com `abre`. */
export const ruido = (seg = 2) =>
    som(seg, (_p, r) => (t) => (r() * 2 - 1) * Math.min(1, (t / seg) ** 2) * (t > seg - 0.02 ? (seg - t) / 0.02 : 1));

/** "Skrrt": o pneu (ou a chuteira) derrapando, faixa estreita que cai de tom e treme. */
export const skrrt = som(
    0.45,
    (p, r) => {
        let v1 = 0;
        let v2 = 0;
        let ph = 0;
        return (t) => {
            const f = 2600 * k12(p) * (1 - 0.35 * (t / 0.45));
            ph += (TAU * f) / SR;
            const n = r() * 2 - 1;
            v1 += 0.5 * (n - v1);
            v2 += 0.5 * (v1 - v2);
            const e = Math.min(1, t / 0.01) * (t < 0.35 ? 1 : (0.45 - t) / 0.1) * (0.6 + 0.4 * Math.sin(TAU * 38 * t));
            return (Math.sin(ph) * 0.7 + 0.5 * (n - v2)) * e;
        };
    },
    { pk: 0.4, corte: 6000 },
);

// formantes (Hz, ganho) das vogais, voz masculina média
const VOGAIS = {
    o: [
        [570, 1],
        [840, 0.55],
        [2410, 0.18],
    ],
    e: [
        [400, 1],
        [2000, 0.4],
        [2600, 0.2],
    ],
    O: [
        [450, 1],
        [800, 0.45],
        [2830, 0.14],
    ],
    a: [
        [730, 1],
        [1090, 0.6],
        [2440, 0.2],
    ],
};

/**
 * Voz picotada (o "vocal chop" da montagem e do house): uma sílaba cantada na nota, por síntese de formantes (serra
 * com vibrato passando por 3 filtros de vogal). `cons` = 's' (sibilante antes) ou 'm' (boca fechada antes);
 * `dur` em segundos. Soa robótica de propósito, como voz de sampler picotada.
 */
export const voz = ({ vogal = 'o', cons = null, dur = 0.18 } = {}) => {
    const cache = new Map();
    return (m) => {
        if (cache.has(m)) return cache.get(m);
        const pre = cons ? 0.05 : 0;
        const n = Math.round((pre + dur + 0.06) * SR);
        const f = hz(m);
        const src = new Float32Array(n);
        let ph = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            ph += (f * (1 + 0.006 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.15))) / SR;
            src[i] = 2 * (ph % 1) - 1;
        }
        const y = new Float32Array(n);
        for (const [F, g] of VOGAIS[vogal]) {
            const b = bandpass(src, F, F / 90);
            for (let i = 0; i < n; i++) y[i] += b[i] * g;
        }
        const hum = cons === 'm' ? bandpass(src, 260, 1.2) : null;
        let s = 4242;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const tv = t - pre;
            const env = tv < 0 ? 0 : Math.min(1, tv / 0.012) * (tv < dur ? 1 : Math.max(0, 1 - (tv - dur) / 0.05));
            y[i] *= env;
            if (cons === 's' && t < pre + 0.01) {
                s = (s * 16807) % 2147483647;
                y[i] += 0.35 * ((s / 2147483647) * 2 - 1) * Math.min(1, t / 0.02);
            }
            if (hum && tv < 0.02) y[i] += 0.8 * hum[i] * Math.min(1, t / 0.01) * (tv < 0 ? 1 : 1 - tv / 0.02);
        }
        if (cons === 's') {
            const hi = bandpass(y.slice(0, Math.round((pre + 0.01) * SR)), 6500, 0.9);
            for (let i = 0; i < hi.length; i++) y[i] = y[i] * 0.2 + hi[i];
        }
        let pk = 1e-9;
        for (const v of y) pk = Math.max(pk, Math.abs(v));
        for (let i = 0; i < n; i++) y[i] *= 0.5 / pk;
        cache.set(m, y);
        return y;
    };
};

/**
 * Filtro que abre e fecha no tempo: passa-baixa de 12 dB/oitava com corte `fAt(seg)` em Hz, aplicado às notas já
 * escritas na faixa (chame depois do `mel`/`drum`). É a "porta" do house e a subida do riser.
 */
export function abre(P, fAt) {
    P.song.secoes.forEach((x, k) => {
        const b = P.bufs[k];
        let v1 = 0;
        let v2 = 0;
        for (let i = 0; i < b.length; i++) {
            const a = 1 - Math.exp((-TAU * Math.min(20000, fAt(x.t0 + i / SR))) / SR);
            v1 += a * (b[i] - v1);
            v2 += a * (v1 - v2);
            b[i] = v2;
        }
    });
}

/** Saturação (tanh) da faixa inteira, relativa ao pico dela (o pico fica onde estava): o 808 sujo do phonk e o synth
 * do automotivo. Chame depois das notas. */
export function satura(P, drive) {
    for (const b of P.bufs) {
        let pk = 1e-9;
        for (const v of b) pk = Math.max(pk, Math.abs(v));
        for (let i = 0; i < b.length; i++) b[i] = (Math.tanh((drive * b[i]) / pk) * pk) / Math.tanh(drive);
    }
}

/** Bombeio de sidechain: o volume afunda pra `fundo` em cada batida e volta em `volta` da batida. */
export const bombeia =
    (bpm, fundo = 0.35, volta = 0.55) =>
    (seg) => {
        const ph = ((seg * bpm) / 60) % 1;
        return 1 - (1 - fundo) * Math.max(0, 1 - ph / volta) ** 2;
    };

/** Curva por compasso: `pontos` = [[compasso, valor], ...], interpolada (exponencial se `exp`). */
export const curva = (S, pontos, { exp = true } = {}) => {
    return (seg) => {
        const b = S.barAt(seg);
        let k = 0;
        while (k + 1 < pontos.length && pontos[k + 1][0] <= b) k++;
        const [b0, v0] = pontos[k];
        const [b1, v1] = pontos[k + 1] ?? pontos[k];
        const x = b1 > b0 ? Math.min(1, Math.max(0, (b - b0) / (b1 - b0))) : 0;
        return exp ? v0 * (v1 / v0) ** x : v0 + (v1 - v0) * x;
    };
};
