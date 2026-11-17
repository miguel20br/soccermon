// Sons da Semana Fora da Lei (menu neon, 17/11/2026): caixa com reverb gated dos anos 80, sirene distante, ondas do
// mar, rádio sintonizando e buzina de conversível. Cada um é um instrumento de bateria do `synth.mjs` (função
// `pitch → amostras`, como as palmas; `pitch` em semitons), sintetizado aqui (sem amostra de terceiros).
// Fica fora de `pecas/` porque não é peça (o render.mjs roda tudo que está lá).
import { SR } from './synth.mjs';

function rng(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}
const ruido = (n, seed) => {
    const r = rng(seed);
    return Float32Array.from({ length: n }, () => r() * 2 - 1);
};
/** Passa-baixa de um polo; `f` pode ser função do tempo (corte que anda). */
function lp(x, f) {
    const y = new Float32Array(x.length);
    let v = 0;
    let a = typeof f === 'number' ? 1 - Math.exp((-2 * Math.PI * f) / SR) : 0;
    for (let i = 0; i < x.length; i++) {
        if (typeof f !== 'number') a = 1 - Math.exp((-2 * Math.PI * f(i / SR)) / SR);
        v += a * (x[i] - v);
        y[i] = v;
    }
    return y;
}
const lp2 = (x, f) => lp(lp(x, f), f);
const hp = (x, f) => {
    const b = lp(x, f);
    return x.map((v, i) => v - b[i]);
};
function norm(y, pk = 0.55) {
    let m = 1e-9;
    for (const v of y) m = Math.max(m, Math.abs(v));
    for (let i = 0; i < y.length; i++) y[i] *= pk / m;
    return y;
}
const memo = (gen) => {
    const c = new Map();
    return (pitch = 0) => {
        if (!c.has(pitch)) c.set(pitch, gen(pitch));
        return c.get(pitch);
    };
};

/**
 * Caixa com reverb gated (o som dos anos 80): corpo de ~185 Hz, estalo de ruído e uma sala densa que fica quase reta
 * e fecha seca no fim do `gate` (segundos). `sala` = volume da sala em relação ao estalo; `corte` esquenta o ruído.
 */
export const caixaGated = ({ gate = 0.24, sala = 0.55, corte = 6000 } = {}) =>
    memo((pitch) => {
        const k = 2 ** (pitch / 12);
        const n = Math.round((gate + 0.03) * SR);
        const estalo = hp(lp2(ruido(n, 808), corte), 250);
        const cauda = hp(lp2(ruido(n, 909), corte * 0.6), 300);
        const y = new Float32Array(n);
        let ph = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            ph += (2 * Math.PI * 185 * k * (1 + 0.6 * Math.exp(-t / 0.012))) / SR;
            const g =
                t < 0.012
                    ? t / 0.012
                    : t < gate
                      ? 1 - (0.35 * (t - 0.012)) / gate
                      : Math.max(0, 1 - (t - gate) / 0.015) * 0.65;
            y[i] = Math.sin(ph) * Math.exp(-t / 0.05) + 0.8 * estalo[i] * Math.exp(-t / 0.05) + sala * cauda[i] * g;
        }
        return norm(y);
    });

/** Sirene de polícia ao longe (4,5 s): o "uiu" lento, abafado pela distância, que aparece e some. */
export const sirene = memo((pitch) => {
    const dur = 4.5;
    const n = Math.round(dur * SR);
    const k = 2 ** (pitch / 12);
    const y = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        ph += (2 * Math.PI * k * (700 + 220 * Math.sin(2 * Math.PI * 0.5 * t - Math.PI / 2))) / SR;
        const env = Math.min(1, t / 1.4) * Math.min(1, (dur - t) / 1.6);
        y[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * env;
    }
    return norm(hp(lp2(y, 1300), 250));
});

/** Uma onda quebrando na areia (5,5 s): ruído que cresce abrindo o filtro, estoura e recua em espuma. */
export const ondas = memo((pitch) => {
    const dur = 5.5;
    const n = Math.round(dur * SR);
    const k = 2 ** (pitch / 12);
    const env = (t) => (t < 2.2 ? (t / 2.2) ** 1.6 : Math.exp(-(t - 2.2) / 1.1));
    const corpo = lp2(ruido(n, 31), (t) => k * (250 + 1600 * env(t)));
    const espuma = hp(lp(ruido(n, 47), 5000), 2500);
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SR;
        const fim = Math.min(1, (dur - t) / 0.4);
        y[i] = (corpo[i] * env(t) + 0.25 * espuma[i] * (t > 2 ? env(t) ** 0.6 : 0)) * fim;
    }
    return norm(y);
});

/**
 * Rádio do carro sintonizando (`dur` segundos): chiado, o assobio da portadora descendo enquanto o dial gira, uns
 * estalos, e no fim o sinal "pega" (o chiado some).
 */
export const radio = ({ dur = 2.2 } = {}) =>
    memo((pitch) => {
        const n = Math.round(dur * SR);
        const k = 2 ** (pitch / 12);
        const r = rng(1984);
        const chiado = hp(lp2(ruido(n, 77), 3500), 400);
        const y = new Float32Array(n);
        let ph = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const x = t / dur;
            // o dial passa por duas estações: o assobio desce, volta um pouco e desce de novo até sumir no tom certo
            const f = k * (2600 * Math.exp(-3.2 * x) + 120 + 300 * Math.max(0, Math.sin(Math.PI * x * 3)) ** 2);
            ph += (2 * Math.PI * f) / SR;
            const ch = (0.55 + 0.45 * Math.sin(2 * Math.PI * 7 * t)) * (1 - x ** 3);
            const estalo = r() < 0.0009 ? (r() * 2 - 1) * 3 : 0;
            const fade = Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.08);
            y[i] = (0.7 * chiado[i] * ch + 0.35 * Math.sin(ph) * (1 - x ** 2) + estalo) * fade;
        }
        return norm(lp(y, 4500));
    });

/**
 * Buzina de conversível (`dur` segundos): duas notas em quadrada saturada (`nota` e `nota + intervalo`, midi), que
 * afinam no ataque. `pitch` transpõe a dupla pra caber no acorde.
 */
export const buzina = ({ dur = 0.16, nota = 74, intervalo = 3 } = {}) =>
    memo((pitch) => {
        const n = Math.round((dur + 0.05) * SR);
        const f1 = 440 * 2 ** ((nota + pitch - 69) / 12);
        const f2 = f1 * 2 ** (intervalo / 12);
        const y = new Float32Array(n);
        let [p1, p2] = [0, 0];
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const af = 1 - 0.03 * Math.exp(-t / 0.02);
            p1 += (2 * Math.PI * f1 * af) / SR;
            p2 += (2 * Math.PI * f2 * af) / SR;
            const env = Math.min(1, t / 0.006) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.04));
            y[i] = Math.tanh(2.5 * (Math.sin(p1) + 0.9 * Math.sin(p2))) * env;
        }
        return norm(hp(lp2(y, 2600), 180));
    });
