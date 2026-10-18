// Caracteres que o jogo pode desenhar com a Galmuri: blocos latinos inteiros (acentos PT/EN, nome digitado pelo
// jogador) + tudo o que aparece nos textos do repositório (i18n, Novidades, dados de Pokémon/golpes, Phaser, CSS).
// Usado por scripts/build-fonts.ts (gera o subset) e scripts/fonts.test.ts (falha se faltar glifo).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;

/** Básico + Latin-1 + Latin Extended-A + pontuação geral (U+2000–206F) + símbolo do euro. */
export const FONT_RANGES = 'U+0020-007E,U+00A0-017F,U+2000-206F,U+20AC';

const SOURCES = ['src', 'public/data', 'index.html', 'CREDITS.md'];
const EXT = new Set(['.ts', '.tsx', '.css', '.json', '.html', '.md']);

function walk(path: string, out: string[]) {
    if (statSync(path).isDirectory()) {
        for (const f of readdirSync(path)) walk(join(path, f), out);
    } else if (EXT.has(extname(path))) out.push(path);
}

/** Todos os caracteres fora dos blocos latinos que aparecem nas fontes do jogo, em ordem. */
export function usedChars(): string[] {
    const files: string[] = [];
    for (const s of SOURCES) walk(join(ROOT, s), files);
    const set = new Set<string>();
    for (const f of files) {
        for (const ch of readFileSync(f, 'utf8')) {
            const cp = ch.codePointAt(0)!;
            if (cp >= 0x20 && !inRanges(cp)) set.add(ch);
        }
    }
    return [...set].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
}

export function inRanges(cp: number): boolean {
    return FONT_RANGES.split(',').some((r) => {
        const [a, b = a] = r.replace(/U\+/g, '').split('-');
        return cp >= Number.parseInt(a, 16) && cp <= Number.parseInt(b, 16);
    });
}
