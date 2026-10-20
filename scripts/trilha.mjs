#!/usr/bin/env node
// Trilhas de verificação (regra 4 do CLAUDE.md, docs/planos/esteira.md). Lista única: o CI, `npm run check:*` e os
// agentes usam esta. Mexeu em alguma pasta abaixo = trilha completa; o resto (tela, texto, i18n, CSS, docs) = rápida.
//   node scripts/trilha.mjs [base]   → imprime "rapida" ou "completa" e os arquivos que decidiram (base: origin/main)
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const COMPLETA = [
    'src/engine/', // motor: resultado das partidas, ENGINE_VERSION
    'src/league/', // Liga (o motor empacotado vai pra Edge Function)
    'src/net/', // Duelo: protocolo e sessão
    'src/ui/duel/', // telas do Duelo
    'src/store/', // save: formato, migração, missões
    'supabase/', // banco e Edge Functions
    // ferramentas: mudou, tudo pode mudar
    'package.json',
    'package-lock.json',
    'vite/',
    'tsconfig.json',
    'vitest.config.ts',
    '.github/',
];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const lines = (s) => s.split('\n').filter(Boolean);

/** Arquivos que esta branch mudou desde a base (commits + o que ainda não foi commitado), sem os apagados. */
export function changedFiles(base = process.env.TRILHA_BASE ?? 'origin/main') {
    const from = git('merge-base', base, 'HEAD');
    const files = new Set([
        ...lines(git('diff', '--name-only', '--diff-filter=d', from)),
        ...lines(git('ls-files', '--others', '--exclude-standard')),
    ]);
    return [...files].sort();
}

export function trilha(files) {
    const why = files.filter((f) => COMPLETA.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p)));
    return { trilha: why.length ? 'completa' : 'rapida', why };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const files = changedFiles(process.argv[2]);
    const { trilha: t, why } = trilha(files);
    console.log(t);
    console.error(`${files.length} arquivo(s) mudado(s)${why.length ? `; completa por: ${why.join(', ')}` : ''}`);
}
