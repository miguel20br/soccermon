#!/usr/bin/env node
// Índice dos docs: "caminho — description" (frontmatter) de docs/planos, docs/marca, docs/adr e docs/memoria.
// Doc sem description aparece como "(sem description)": o scripts/docs.test.ts cobra planos e ADRs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) =>
    readdirSync(d)
        .sort()
        .flatMap((n) => {
            const p = join(d, n);
            return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
        });

for (const dir of ['docs/adr', 'docs/planos', 'docs/marca', 'docs/memoria']) {
    for (const f of walk(dir)) {
        const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
        const d = fm.match(/^description:\s*(.+)$/m)?.[1];
        if (f !== 'docs/memoria/MEMORY.md') console.log(`${f} — ${d ?? '(sem description)'}`);
    }
}
