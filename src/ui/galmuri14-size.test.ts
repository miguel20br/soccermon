import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A Galmuri14 é pixel: em 17, 18, 22, 28 e 40 px o navegador quebra o desenho do 9 (e do 6 no 40): sai torto
// (revisão de 10/11/2026: o contador de taças da Sede). Os vizinhos (16, 19, 21, 23, 27, 29, 39, 41) saem certos.
const BAD = new Set([17, 18, 22, 28, 40]);
// carta só muda pela galeria ?cards=1 (com o ok do Miguel)
const SKIP = /(^|\W)\.(pc2|m-ovr|dp-chip|diorama-card|bc-sig)/;
const SKIP_FILES = ['room-lab.css'];

const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
    );
const rules = files('src')
    .filter((f) => !SKIP_FILES.some((s) => f.endsWith(s)))
    .flatMap((f) =>
        [
            ...readFileSync(f, 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .matchAll(/([^{}]+)\{([^{}]*)\}/g),
        ].map((m) => ({
            f,
            sels: m[1]
                .trim()
                .split(',')
                .map((s) => s.trim()),
            body: m[2],
        })),
    );
/** As classes do último pedaço de cada seletor (o elemento que recebe a regra). */
const lastClasses = (sel: string) => (sel.split(/[\s>+~]+/).pop() ?? '').match(/\.[\w-]+/g) ?? [];
const g14 = new Set(
    rules.filter((r) => /font-family:[^;]*Galmuri14/.test(r.body)).flatMap((r) => r.sels.flatMap(lastClasses)),
);

describe('Galmuri14', () => {
    it('nunca num tamanho que quebra o desenho dos números', () => {
        const bad = rules.flatMap((r) => {
            const size = Number(r.body.match(/font-size:\s*(\d+)px\s*;/)?.[1]);
            if (!BAD.has(size)) return [];
            const own = /font-family:[^;]*Galmuri14/.test(r.body);
            return r.sels
                .filter((s) => !SKIP.test(s) && (own || lastClasses(s).some((c) => g14.has(c))))
                .map((s) => `${r.f}: ${s} (${size}px)`);
        });
        expect(bad).toEqual([]);
    });
});
