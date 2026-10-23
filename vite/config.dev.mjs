import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

const CLAUDE_DIR = fileURLToPath(new URL('../.claude/', import.meta.url));

export default defineConfig({
    base: './',
    plugins: [react()],
    // NEXT_PUBLIC_*: variáveis públicas que a integração Supabase da Vercel cria (URL e chave publicável)
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    // build: o Duelo só junta telas do mesmo deploy (versões 0.8.8 seguidas mudam o jogo sem trocar o número)
    define: {
        // displayVersion: número das Novidades com 4 partes (0.8.8.3); o npm só aceita semver em "version"
        __APP_VERSION__: JSON.stringify(pkg.displayVersion ?? pkg.version),
        __APP_BUILD__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'),
        __SMOKE__: 'true',
    },
    worker: { format: 'es' },
    // worktrees de outros agentes (.claude/worktrees) escrevendo arquivo não recarregam a página (estragava medição e
    // teste). Só a .claude da raiz deste checkout: o glob '**/.claude/**' ignorava também o src/ de quem roda o dev
    // num worktree (o caminho dele passa por .claude/worktrees) e o dev parava de recarregar.
    server: { port: 8080, watch: { ignored: [(p) => `${p}/`.startsWith(CLAUDE_DIR)] } },
});
