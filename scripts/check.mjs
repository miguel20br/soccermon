#!/usr/bin/env node
// npm run check:rapido   tsc incremental + Biome e `vitest related` só nos arquivos mudados vs origin/main (segundos)
// npm run check:completo lint, tsc, vitest inteiro e vite build (o mesmo do CI); fora do CI entra na fila pesada
// Qual usar: scripts/trilha.mjs (regra 4 do CLAUDE.md, docs/planos/esteira.md).
import { spawnSync } from 'node:child_process';
import { changedFiles, trilha } from './trilha.mjs';

const mode = process.argv[2];
if (mode !== 'rapido' && mode !== 'completo') {
    console.error('uso: node scripts/check.mjs rapido|completo');
    process.exit(2);
}
const CI = !!process.env.CI;
// completo é pesado: na máquina do Miguel espera a vez no cadeado (scripts/pesado.sh), uma verificação por vez
if (mode === 'completo' && !CI && !process.env.SOCCERMON_PESADO) {
    const r = spawnSync('scripts/pesado.sh', [process.execPath, ...process.argv.slice(1)], { stdio: 'inherit' });
    process.exit(r.status ?? 1);
}

const times = [];
const run = (label, cmd, args) => {
    const t0 = Date.now();
    console.log(`\n> ${cmd} ${args.join(' ')}`);
    const r = spawnSync(cmd, args, { stdio: 'inherit' });
    times.push(`${label}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    if (r.status !== 0) {
        console.error(`\n✗ ${label} falhou\n${times.join('\n')}`);
        process.exit(r.status ?? 1);
    }
};
const workers = CI ? [] : ['--maxWorkers=2'];

if (mode === 'rapido') {
    const files = changedFiles();
    const { trilha: t, why } = trilha(files);
    const code = files.filter((f) => /^(src|scripts)\/.+\.(ts|tsx|js|mjs|cjs|json|css)$/.test(f));
    console.log(`${files.length} arquivo(s) mudado(s) vs origin/main; trilha ${t}`);
    run('tsc', 'npx', ['tsc', '--noEmit', '-p', '.']);
    if (code.length)
        run('biome', 'npx', ['biome', 'check', '--no-errors-on-unmatched', '--files-ignore-unknown=true', ...code]);
    const src = code.filter((f) => /\.(ts|tsx)$/.test(f));
    if (src.length)
        run('vitest related', 'npx', ['vitest', 'related', '--run', '--passWithNoTests', ...workers, ...src]);
    if (t === 'completa')
        console.log(
            `\n! Trilha completa (${why.join(', ')}): rode \`npm run check:completo\` ou espere o CI da branch antes de entregar.`,
        );
} else {
    run('lint', 'npm', ['run', 'lint']);
    run('tsc', 'npx', ['tsc', '--noEmit', '-p', '.']);
    run('vitest', 'npx', ['vitest', 'run', ...workers]);
    run('build', 'npm', ['run', 'build:vite']);
}
console.log(`\n✓ check:${mode}\n${times.join('\n')}`);
