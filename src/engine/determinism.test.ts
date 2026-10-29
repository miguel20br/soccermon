import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { determinismHashes } from './determinism';
import { datan2, dcos, dexp, dln, dpow, dsin } from './dmath';
import { Rng } from './rng';

/**
 * Golden master: mudou de propósito o resultado das partidas? Atualize os hashes aqui e suba `ENGINE_VERSION`
 * no mesmo commit. `npm run determinismo` confere os mesmos hashes no Chromium, Firefox e WebKit.
 */
const EXPECTED_HASHES = [
    'df10813c',
    '94093615',
    '1b2ef9e5',
    '45ed92f6',
    '650fe49f',
    '3cd48072',
    // daqui até as assinaturas, as partidas com golpe máximo pedido (motor 15: defesa máxima vale o lance e a zona do
    // pivô foi pra 18 m; as partidas sem ordem de golpe máximo acima não mudaram)
    'de25e2b6',
    'f9d64578',
    '5e710dc3',
    '38fc98e0',
    // assinaturas do golpe máximo (motor 13): Mew, Dragonite e Ditto
    '7dd4045b',
    '7b1af0ed',
    '27f55d5f',
    'ca2f6bf9',
];

describe('determinismo entre navegadores', () => {
    it('partidas fixas dão sempre o mesmo hash', () => {
        expect(determinismHashes()).toEqual(EXPECTED_HASHES);
    });

    it('o motor não usa Math que varia entre navegadores', () => {
        // sqrt, abs, min, max, floor, ceil, round, trunc, imul são exatos pelo IEEE 754; o resto vai pelo dmath.ts
        const banned = [
            /\bMath\.(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log1p|log2|log10|pow|hypot|cbrt|random)\b/,
            /\*\*/, // ** é Math.pow
            /localeCompare|toLocale\w*|Intl\./, // dependem do idioma do aparelho
            /Date\.now|new Date\(\)|performance\.now/,
        ];
        const files = (readdirSync('src/engine', { recursive: true }) as string[]).filter(
            (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
        );
        const hits: string[] = [];
        for (const f of files) {
            // tira comentários (/** … */ e // …) antes de procurar
            const code = readFileSync(join('src/engine', f), 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\/\/.*$/gm, '');
            code.split('\n').forEach((line, i) => {
                for (const re of banned) if (re.test(line)) hits.push(`${f}:${i + 1}: ${line.trim()}`);
            });
        }
        expect(hits).toEqual([]);
    });

    it('dmath fica a ~1 ulp do Math nativo', () => {
        const rng = new Rng('dmath');
        const close = (a: number, b: number) => Math.abs(a - b) <= 4 * Number.EPSILON * Math.max(1, Math.abs(b));
        for (let i = 0; i < 20000; i++) {
            const x = rng.range(-20, 20);
            const y = rng.range(-20, 20);
            const p = rng.range(1e-9, 1000);
            expect(close(dsin(x), Math.sin(x)), `sin ${x}`).toBe(true);
            expect(close(dcos(x), Math.cos(x)), `cos ${x}`).toBe(true);
            expect(close(datan2(y, x), Math.atan2(y, x)), `atan2 ${y} ${x}`).toBe(true);
            expect(close(dexp(x), Math.exp(x)), `exp ${x}`).toBe(true);
            expect(close(dln(p), Math.log(p)), `ln ${p}`).toBe(true);
            // pow = exp(e·ln b): o erro cresce com |e·ln b|; no jogo a base é o multiplicador de tipo (0 a 4)
            const b = p / 250;
            expect(close(dpow(b, 1.3), b ** 1.3), `pow ${b}`).toBe(true);
        }
        expect([dsin(0), dcos(0), dexp(0), dln(1), datan2(0, 1), dpow(0.85, 0)]).toEqual([0, 1, 1, 0, 0, 1]);
        expect(datan2(1, 0)).toBe(Math.PI / 2);
        expect(datan2(0, -1)).toBe(Math.PI);
        expect(dln(0)).toBe(Number.NEGATIVE_INFINITY);
        expect(dpow(4, 1.2)).toBeCloseTo(4 ** 1.2, 14);
    });
});
