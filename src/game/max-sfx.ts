/**
 * Sons do golpe máximo (29/10/2026, pacote "só tela"): o toque por nota e o golpe por nível, no lugar do `move` de
 * golpe comum. Perfeito = sino subindo + clap 808 (`public/music/clap-808.wav`) + moeda, tudo na batida; bom = só o
 * sino; fora = o baque seco. Módulo puro como a `virada.ts`: quem chama passa o `buildSamples` do ZzFX e o clap
 * (o jogo em `audio.ts`, o `scripts/golpe-sons.ts` que renderiza os .wav pra ouvir).
 */
import type { MaxGrade } from '../engine/state';

/** Parâmetros do ZzFX (`undefined` = padrão). Sem aleatório: o mesmo som sempre (e o .wav igual ao do jogo). */
type P = (number | undefined)[];
const u = undefined;
/** Uma camada: parâmetros do ZzFX (ou o clap 808) em `at` segundos, com `gain`. */
export interface Layer {
    p: P | 'clap';
    at: number;
    gain: number;
}

/** Sino: seno com o parcial de sino (2,76×) por cima, ataque seco e cauda longa. */
const bell = (hz: number, at: number, gain: number): Layer[] => [
    { p: [1, 0, hz, 0.002, 0.03, 0.55, 0, 1, u, u, u, u, u, u, u, u, u, 0.6, 0.06], at, gain },
    { p: [1, 0, hz * 2.76, 0.002, 0.01, 0.25, 0, 1], at, gain: gain * 0.22 },
];
/** A moeda clássica (pickup do ZzFX: quadrada que pula a quarta). */
const COIN: P = [1, 0, 1675, u, 0.06, 0.24, 1, 1.82, u, u, 837, 0.06];
/** O baque seco (`SFX.thud` do `audio.ts`). */
const THUD: P = [0.9, 0, 110, 0, 0.04, 0.22, 3, 1.8, -4, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6, 0.05];
/** Grave que cai (o "bum" do impacto) e o chiado do ar (ruído com passa-alta). */
const boom = (hz: number, len: number): P => [1, 0, hz, 0.004, 0.02, len, 0, 1.6, -0.6];
const whoosh = (len: number, hz = 900): P => [
    1,
    0,
    hz,
    0.03,
    0.02,
    len,
    4,
    1,
    3,
    u,
    u,
    u,
    u,
    0.6,
    u,
    u,
    u,
    0.8,
    u,
    u,
    400,
];
/** Sobe de tom (o "carregou" antes do impacto): serra com glissando. */
const rise = (hz: number, len: number): P => [1, 0, hz, 0.01, len, 0.08, 2, 1.2, 9, u, u, u, u, u, u, 0.1];
/** Prato da virada (`CRASH` do `virada.ts`). */
const CRASH: P = [0.32, 0, 2600, u, 0.05, 1.3, 3, 2, u, u, 800, 0.02, u, 8, u, 0.01, 0.1];

/** Toque por nota (C maior: dó, mi, sol, dó subindo em 40 ms; o clap e a moeda no 1). */
export const MAX_TAP: Record<MaxGrade, Layer[]> = {
    2: [
        { p: 'clap', at: 0, gain: 0.9 },
        { p: COIN, at: 0, gain: 0.35 },
        ...bell(1047, 0, 0.42),
        ...bell(1319, 0.04, 0.38),
        ...bell(1568, 0.08, 0.36),
        ...bell(2093, 0.12, 0.34),
    ],
    1: [...bell(784, 0, 0.45), ...bell(1047, 0.05, 0.4)],
    0: [{ p: THUD, at: 0, gain: 0.9 }],
};

/** O golpe por nível: N1 curto e seco, N2 com o "carregou" e mais grave, N3 grave e longo com o prato. */
export const MAX_MOVE: Record<1 | 2 | 3, Layer[]> = {
    1: [
        { p: rise(420, 0.05), at: 0, gain: 0.25 },
        { p: boom(140, 0.18), at: 0.06, gain: 0.9 },
        { p: whoosh(0.12), at: 0.06, gain: 0.25 },
    ],
    2: [
        { p: rise(300, 0.12), at: 0, gain: 0.3 },
        { p: boom(95, 0.35), at: 0.14, gain: 1 },
        { p: whoosh(0.25, 700), at: 0.14, gain: 0.35 },
        { p: 'clap', at: 0.14, gain: 0.5 },
    ],
    3: [
        { p: rise(200, 0.22), at: 0, gain: 0.35 },
        { p: boom(62, 0.8), at: 0.24, gain: 1.15 },
        { p: boom(124, 0.3), at: 0.24, gain: 0.45 },
        { p: whoosh(0.5, 500), at: 0.24, gain: 0.4 },
        { p: CRASH, at: 0.24, gain: 1.6 },
        { p: 'clap', at: 0.24, gain: 0.6 },
    ],
};

/** Pico de cada som mixado (o `move` do ZzFX chega perto de 0,7; o golpe passa um pouco, o toque fica junto). */
export const MAX_PEAK = { tap: 0.8, move: 1 };

export type BuildSamples = (...p: (number | undefined)[]) => ArrayLike<number>;

/** Mistura as camadas (mono, `sr` Hz) e leva o pico a `peak`. Sem o clap, a camada dele fica muda. */
export function mixMax(
    layers: readonly Layer[],
    build: BuildSamples,
    clap: ArrayLike<number> | null,
    peak: number,
    sr = 44100,
): Float32Array<ArrayBuffer> {
    const parts = layers.map((l) => ({
        s: l.p === 'clap' ? (clap ?? []) : build(...l.p),
        i0: Math.round(l.at * sr),
        g: l.gain,
    }));
    const out = new Float32Array(Math.max(1, ...parts.map((x) => x.i0 + x.s.length)));
    for (const { s, i0, g } of parts) for (let i = 0; i < s.length; i++) out[i0 + i] += s[i] * g;
    let pk = 1e-9;
    for (const x of out) pk = Math.max(pk, Math.abs(x));
    for (let i = 0; i < out.length; i++) out[i] *= peak / pk;
    return out;
}
