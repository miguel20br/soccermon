import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

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
    server: { port: 8080 },
});
