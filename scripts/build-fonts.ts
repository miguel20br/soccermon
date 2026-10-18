// Gera public/fonts/*.woff2 só com os caracteres que o jogo usa (a Galmuri inteira tem milhares de glifos coreanos:
// ~1,2 MB no primeiro acesso). Fonte original: pacote npm `galmuri` (node_modules/galmuri/dist, OFL 1.1, o subset
// mantém a tabela de nomes com copyright e licença). Precisa do uv (https://docs.astral.sh/uv): roda o pyftsubset
// do fonttools sem instalar nada no projeto. Uso: npm run fonts
// Depois de rodar, scripts/fonts.test.ts confere que nenhum caractere usado ficou sem glifo.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FONT_RANGES, usedChars } from './lib/font-chars';

const ROOT = new URL('..', import.meta.url).pathname;
const FONTS = ['Galmuri11.woff2', 'Galmuri11-Bold.woff2', 'Galmuri14.woff2'];
const FONTTOOLS = ['--from', 'fonttools[woff]==4.67.0'];

/** Code points que a fonte tem (tabela cmap, lida pelo ttx do fonttools). */
function cmap(file: string): Set<number> {
    const xml = execFileSync('uvx', [...FONTTOOLS, 'fonttools', 'ttx', '-q', '-t', 'cmap', '-o', '-', file], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
    return new Set([...xml.matchAll(/<map code="0x([0-9a-f]+)"/g)].map((m) => Number.parseInt(m[1], 16)));
}

const chars = usedChars();
const textFile = join(mkdtempSync(join(tmpdir(), 'soccermon-fonts-')), 'chars.txt');
writeFileSync(textFile, chars.join(''));

const coverage: Record<string, { covered: string; missing: string }> = {};
for (const name of FONTS) {
    const src = join(ROOT, 'node_modules/galmuri/dist', name);
    const out = join(ROOT, 'public/fonts', name);
    execFileSync('uvx', [
        ...FONTTOOLS,
        '--with',
        'brotli',
        'pyftsubset',
        src,
        `--unicodes=${FONT_RANGES}`,
        `--text-file=${textFile}`,
        '--layout-features=*',
        '--name-IDs=*',
        '--flavor=woff2',
        `--output-file=${out}`,
    ]);
    const have = cmap(out);
    const original = cmap(src);
    // caractere que nem a fonte inteira tinha (emoji do Compartilhar, ⚽…): o navegador já usava outra fonte
    const missing = chars.filter((c) => !original.has(c.codePointAt(0)!));
    const lost = chars.filter((c) => original.has(c.codePointAt(0)!) && !have.has(c.codePointAt(0)!));
    if (lost.length) throw new Error(`${name}: o subset perdeu ${lost.join(' ')}`);
    coverage[name] = {
        covered: [...have]
            .sort((a, b) => a - b)
            .map((cp) => String.fromCodePoint(cp))
            .join(''),
        missing: missing.join(''),
    };
    console.log(`${name}: ${have.size} glifos${missing.length ? ` (a Galmuri não tem: ${missing.join(' ')})` : ''}`);
}
writeFileSync(join(ROOT, 'scripts/fonts-coverage.json'), `${JSON.stringify(coverage, null, 4)}\n`);
