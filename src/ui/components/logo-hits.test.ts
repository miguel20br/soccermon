import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Arquivos .tsx de `dir` (recursivo). */
const tsx = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? tsx(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : [],
    );

describe('logo do jogo', () => {
    // regra do Miguel (30/10/2026): logo na tela com música tocando pisca o SOC-CER-MON; o logo do Estádio e o do menu
    // de modos eram <img> solto e não piscavam
    it('todo logo em HTML passa pelo Logo/LogoHits (as sílabas piscam no gancho)', () => {
        const loose = tsx('src')
            .filter((f) => !f.endsWith('LogoHits.tsx'))
            .filter((f) => {
                const s = readFileSync(f, 'utf8');
                return s.includes('assets/ui/logo.svg') && !s.includes('<LogoHits');
            });
        expect(loose).toEqual([]);
    });
});
