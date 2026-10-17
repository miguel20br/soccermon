/**
 * Matemática determinística do motor: o mesmo bit em Chrome, Firefox, Safari e Node.
 *
 * O padrão do JS só garante `+ - * /`, `Math.sqrt`, `abs/min/max/floor/ceil/round/trunc` e `imul`; `sin`, `cos`,
 * `atan2`, `exp`, `log`, `pow` (`**`) e `hypot` mudam de motor pra motor (cada um usa o seu libm). Aqui ficam
 * versões em JS puro portadas do fdlibm pela versão do musl (MIT), só com operações exatas do IEEE 754. As
 * constantes estão escritas com o menor decimal que dá o mesmo double do fdlibm.
 * O teste `determinism.test.ts` impede `Math.sin` & cia. de voltarem pro motor.
 *
 * Por que não `@stdlib/math-base-special-*`: as 6 funções puxam 167 pacotes e somam ~60 KB minificados
 * (16 KB gzip) no bundle; isto aqui é o mesmo algoritmo (fdlibm) em ~4 KB minificados (2 KB gzip).
 *
 * fdlibm: Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved. Developed at SunPro, a Sun
 * Microsystems, Inc. business. Permission to use, copy, modify, and distribute this software is freely granted,
 * provided that this notice is preserved.
 */

const dv = new DataView(new ArrayBuffer(8));

/** Palavra alta (sinal, expoente e 20 bits da mantissa) como uint32. */
function highWord(x: number): number {
    dv.setFloat64(0, x);
    return dv.getUint32(0);
}

function lowWord(x: number): number {
    dv.setFloat64(0, x);
    return dv.getUint32(4);
}

/** 2^k exato, para -1022 ≤ k ≤ 1023. */
function pow2(k: number): number {
    dv.setUint32(0, (k + 1023) * 0x100000);
    dv.setUint32(4, 0);
    return dv.getFloat64(0);
}

/** y·2^k sem arredondamento duplo (musl scalbn). */
function scalbn(y: number, k: number): number {
    if (k > 1023) {
        y *= pow2(1023);
        k -= 1023;
        if (k > 1023) return y * pow2(1023);
    } else if (k < -1022) {
        const s = pow2(-1022) * pow2(53);
        y *= s;
        k += 1022 - 53;
        if (k < -1022) return y * s;
    }
    return y * pow2(k);
}

// --- sin / cos ------------------------------------------------------------------------------------------------

const INV_PIO2 = 0.6366197723675814;
const PIO2_1 = 1.5707963267341256;
const PIO2_1T = 6.077100506506192e-11;
const PIO2_2 = 6.077100506303966e-11;
const PIO2_2T = 2.0222662487959506e-21;
const PIO2_3 = 2.0222662487111665e-21;
const PIO2_3T = 8.4784276603689e-32;

/**
 * Redução de Cody–Waite (musl __rem_pio2, caminho "medium"): x = n·π/2 + (y0 + y1).
 * ponytail: só o caminho médio, preciso até |x| ≈ 1,6 milhão (π/2·2^20); acima disso continua determinístico mas
 * perde precisão. Os ângulos do motor ficam abaixo de 2π.
 */
function remPio2(x: number): [number, number, number] {
    const fn = Math.round(x * INV_PIO2);
    let r = x - fn * PIO2_1;
    let w = fn * PIO2_1T;
    let y0 = r - w;
    const ex = (highWord(x) >>> 20) & 0x7ff;
    if (ex - ((highWord(y0) >>> 20) & 0x7ff) > 16) {
        let t = r;
        w = fn * PIO2_2;
        r = t - w;
        w = fn * PIO2_2T - (t - r - w);
        y0 = r - w;
        if (ex - ((highWord(y0) >>> 20) & 0x7ff) > 49) {
            t = r;
            w = fn * PIO2_3;
            r = t - w;
            w = fn * PIO2_3T - (t - r - w);
            y0 = r - w;
        }
    }
    return [fn, y0, r - y0 - w];
}

function kernelSin(x: number, y: number): number {
    const z = x * x;
    const w = z * z;
    const r = 0.00833333333332249 + z * (-0.0001984126982985795 + z * 0.0000027557313707070068);
    const r2 = r + z * w * (-2.5050760253406863e-8 + z * 1.58969099521155e-10);
    const v = z * x;
    return x - (z * (0.5 * y - v * r2) - y - v * -0.16666666666666632);
}

function kernelCos(x: number, y: number): number {
    const z = x * x;
    const w = z * z;
    const r =
        z * (0.0416666666666666 + z * (-0.001388888888887411 + z * 0.00002480158728947673)) +
        w * w * (-2.7557314351390663e-7 + z * (2.087572321298175e-9 + z * -1.1359647557788195e-11));
    const hz = 0.5 * z;
    const w1 = 1 - hz;
    return w1 + (1 - w1 - hz + (z * r - x * y));
}

export function dsin(x: number): number {
    if (!Number.isFinite(x)) return Number.NaN;
    const [n, y0, y1] = remPio2(x);
    switch (n & 3) {
        case 0:
            return kernelSin(y0, y1);
        case 1:
            return kernelCos(y0, y1);
        case 2:
            return -kernelSin(y0, y1);
        default:
            return -kernelCos(y0, y1);
    }
}

export function dcos(x: number): number {
    if (!Number.isFinite(x)) return Number.NaN;
    const [n, y0, y1] = remPio2(x);
    switch (n & 3) {
        case 0:
            return kernelCos(y0, y1);
        case 1:
            return -kernelSin(y0, y1);
        case 2:
            return -kernelCos(y0, y1);
        default:
            return kernelSin(y0, y1);
    }
}

// --- atan / atan2 ---------------------------------------------------------------------------------------------

const ATAN_HI = [0.4636476090008061, 0.7853981633974483, 0.982793723247329, Math.PI / 2];
const ATAN_LO = [2.2698777452961687e-17, 3.061616997868383e-17, 1.3903311031230998e-17, 6.123233995736766e-17];
const AT = [
    0.3333333333333293, -0.19999999999876483, 0.14285714272503466, -0.11111110405462356, 0.09090887133436507,
    -0.0769187620504483, 0.06661073137387531, -0.058335701337905735, 0.049768779946159324, -0.036531572744216916,
    0.016285820115365782,
];

function datan(x: number): number {
    const hx = highWord(x);
    const neg = hx >>> 31 === 1;
    const ix = hx & 0x7fffffff;
    let id: number;
    if (ix >= 0x44100000) {
        if (Number.isNaN(x)) return x;
        return neg ? -(ATAN_HI[3] + ATAN_LO[3]) : ATAN_HI[3] + ATAN_LO[3];
    }
    if (ix < 0x3fdc0000) {
        if (ix < 0x3e400000) return x;
        id = -1;
    } else {
        x = Math.abs(x);
        if (ix < 0x3ff30000) {
            if (ix < 0x3fe60000) {
                id = 0;
                x = (2 * x - 1) / (2 + x);
            } else {
                id = 1;
                x = (x - 1) / (x + 1);
            }
        } else if (ix < 0x40038000) {
            id = 2;
            x = (x - 1.5) / (1 + 1.5 * x);
        } else {
            id = 3;
            x = -1 / x;
        }
    }
    const z = x * x;
    const w = z * z;
    const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
    const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
    if (id < 0) return x - x * (s1 + s2);
    const r = ATAN_HI[id] - (x * (s1 + s2) - ATAN_LO[id] - x);
    return neg ? -r : r;
}

const PI = Math.PI;
const PI_LO = 1.2246467991473532e-16;

export function datan2(y: number, x: number): number {
    if (Number.isNaN(x) || Number.isNaN(y)) return Number.NaN;
    if (x === 1) return datan(y);
    const hx = highWord(x);
    const hy = highWord(y);
    const m = (hy >>> 31) | ((hx >>> 30) & 2); // 2·sinal(x) + sinal(y)
    const ix = hx & 0x7fffffff;
    const iy = hy & 0x7fffffff;
    if (y === 0) return m < 2 ? y : m === 2 ? PI : -PI;
    if (x === 0) return m & 1 ? -PI / 2 : PI / 2;
    if (ix === 0x7ff00000) {
        if (iy === 0x7ff00000) return [PI / 4, -PI / 4, (3 * PI) / 4, (-3 * PI) / 4][m];
        return [0, -0, PI, -PI][m];
    }
    if (ix + 0x4000000 < iy || iy === 0x7ff00000) return m & 1 ? -PI / 2 : PI / 2;
    const z = m & 2 && iy + 0x4000000 < ix ? 0 : datan(Math.abs(y / x));
    switch (m) {
        case 0:
            return z;
        case 1:
            return -z;
        case 2:
            return PI - (z - PI_LO);
        default:
            return z - PI_LO - PI;
    }
}

// --- exp / ln / pow -------------------------------------------------------------------------------------------

const LN2_HI = 0.6931471803691238;
const LN2_LO = 1.9082149292705877e-10;

export function dexp(x: number): number {
    const hx = highWord(x);
    const sign = hx >>> 31;
    const ax = hx & 0x7fffffff;
    if (ax >= 0x4086232b) {
        if (Number.isNaN(x)) return x;
        if (x > 709.782712893384) return Number.POSITIVE_INFINITY;
        if (x < -745.1332191019411) return 0;
    }
    let k: number;
    let hi: number;
    let lo: number;
    if (ax > 0x3fd62e42) {
        k = ax >= 0x3ff0a2b2 ? Math.trunc(Math.LOG2E * x + (sign ? -0.5 : 0.5)) : 1 - 2 * sign;
        hi = x - k * LN2_HI;
        lo = k * LN2_LO;
        x = hi - lo;
    } else if (ax > 0x3e300000) {
        k = 0;
        hi = x;
        lo = 0;
    } else {
        return 1 + x;
    }
    const xx = x * x;
    const c =
        x -
        xx *
            (0.16666666666666602 +
                xx *
                    (-0.0027777777777015593 +
                        xx * (0.00006613756321437934 + xx * (-0.0000016533902205465252 + xx * 4.1381367970572385e-8))));
    const y = 1 + ((x * c) / (2 - c) - lo + hi);
    return k === 0 ? y : scalbn(y, k);
}

/** Logaritmo natural (musl log). */
export function dln(x: number): number {
    let hx = highWord(x);
    let k = 0;
    if (hx < 0x00100000 || hx >>> 31) {
        if (x === 0) return Number.NEGATIVE_INFINITY;
        if (hx >>> 31) return Number.NaN;
        k -= 54;
        x *= 18014398509481984; // 2^54: subnormal vira normal
        hx = highWord(x);
    } else if (hx >= 0x7ff00000) {
        return x;
    } else if (x === 1) {
        return 0;
    }
    // reduz x para [√2/2, √2]
    hx += 0x3ff00000 - 0x3fe6a09e;
    k += (hx >>> 20) - 0x3ff;
    hx = (hx & 0x000fffff) + 0x3fe6a09e;
    const low = lowWord(x);
    dv.setUint32(0, hx);
    dv.setUint32(4, low);
    x = dv.getFloat64(0);

    const f = x - 1;
    const hfsq = 0.5 * f * f;
    const s = f / (2 + f);
    const z = s * s;
    const w = z * z;
    const t1 = w * (0.3999999999940942 + w * (0.22222198432149784 + w * 0.15313837699209373));
    const t2 = z * (0.6666666666666735 + w * (0.2857142874366239 + w * (0.1818357216161805 + w * 0.14798198605116586)));
    const R = t2 + t1;
    return s * (hfsq + R) + k * LN2_LO - hfsq + f + k * LN2_HI;
}

/** b^e no lugar de `**`. Expoente inteiro pequeno vira multiplicação; o resto, exp(e·ln b). */
export function dpow(b: number, e: number): number {
    if (e === 1) return b;
    if (Number.isInteger(e) && Math.abs(e) <= 64) {
        let r = 1;
        for (let i = Math.abs(e); i > 0; i--) r *= b;
        return e < 0 ? 1 / r : r;
    }
    if (b === 0) return e > 0 ? 0 : Number.POSITIVE_INFINITY;
    if (b < 0) return Number.NaN;
    return dexp(e * dln(b));
}
