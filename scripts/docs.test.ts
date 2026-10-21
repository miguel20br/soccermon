import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import pkg from '../package.json';

// O CLAUDE.md, as skills e docs/memoria são o que o Claude lê em todo aparelho: este teste pega quando saem de sincronia.
const claude = readFileSync('CLAUDE.md', 'utf8');

describe('contexto do Claude', () => {
    it('CLAUDE.md enxuto (histórico vai pra docs/planos/historico.md)', () => {
        expect(Buffer.byteLength(claude)).toBeLessThan(16_000);
    });

    it('"Estado atual" na versão do package.json', () => {
        const v = (pkg as { displayVersion?: string }).displayVersion ?? pkg.version;
        expect(claude).toMatch(new RegExp(`## Estado atual \\([^)]*v${v.replaceAll('.', '\\.')}\\)`));
    });

    it('toda skill do projeto está na tabela do CLAUDE.md e vice-versa', () => {
        const skills = readdirSync('.claude/skills').filter((d) => existsSync(`.claude/skills/${d}/SKILL.md`));
        const listed = [...claude.matchAll(/^\| `([\w-]+)` \|/gm)].map((m) => m[1]);
        expect(listed.sort()).toEqual(skills.sort());
    });

    it('docs/memoria: índice bate com os arquivos e nenhum e-mail além do noreply', () => {
        const index = readFileSync('docs/memoria/MEMORY.md', 'utf8');
        const linked = [...index.matchAll(/\]\(([\w-]+\.md)\)/g)].map((m) => m[1]);
        const files = readdirSync('docs/memoria').filter((f) => f !== 'MEMORY.md');
        expect(linked.sort(), 'rode scripts/memoria.sh').toEqual(files.sort());
        for (const f of files) {
            const emails = readFileSync(`docs/memoria/${f}`, 'utf8').match(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/g) ?? [];
            expect(
                emails.filter((e) => !e.endsWith('users.noreply.github.com')),
                f,
            ).toEqual([]);
        }
    });

    it('todo .md de docs/planos e docs/adr tem description no frontmatter (alimenta scripts/indice.mjs)', () => {
        const walk = (d: string): string[] =>
            readdirSync(d, { withFileTypes: true }).flatMap((e) =>
                e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.md') ? [join(d, e.name)] : [],
            );
        const sem = [...walk('docs/planos'), ...walk('docs/adr')].filter(
            (f) => !/^---\n(?:[\s\S]*?\n)?description: \S/.test(readFileSync(f, 'utf8')),
        );
        expect(sem).toEqual([]);
    });
});
