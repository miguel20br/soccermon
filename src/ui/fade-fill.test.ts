import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// animação de opacidade com fill "both" deixa o elemento como contexto de empilhamento pra sempre (Chrome): um modal
// "fixed" dentro dele (a ficha da Pokédex, 10/11/2026) ficava embaixo da barra de cima. O screen-in só tem o "from":
// "backwards" dá o mesmo fade e solta o elemento no fim
const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
    );

describe('fade de entrada (screen-in)', () => {
    it('nunca com fill both nem forwards', () => {
        const bad = files('src').flatMap((f) =>
            [...readFileSync(f, 'utf8').matchAll(/animation:\s*screen-in[^;]*\b(both|forwards)\b[^;]*;/g)].map(
                (m) => `${f}: ${m[0]}`,
            ),
        );
        expect(bad).toEqual([]);
    });
});
