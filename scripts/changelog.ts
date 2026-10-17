// Gera o CHANGELOG.md a partir de src/ui/patch-notes.ts (as Novidades do jogo). Uso: npm run changelog
import { writeFileSync } from 'node:fs';
import { PATCH_NOTES } from '../src/ui/patch-notes';

const out = ['# Novidades', ''];
for (const n of PATCH_NOTES) {
    out.push(`## ${n.version} · ${n.title}`, '');
    for (const s of n.sections) out.push(`### ${s.title}`, ...s.lines.map((l) => `- ${l}`), '');
}
writeFileSync('CHANGELOG.md', `${out.join('\n').trimEnd()}\n`);
