import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

export default defineConfig({
    // raiz do site (soccermon.com): com './' as URLs absolutas do CSS viravam assets/assets/...
    base: '/',
    plugins: [react()],
    // NEXT_PUBLIC_*: variáveis públicas que a integração Supabase da Vercel cria (URL e chave publicável)
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    logLevel: 'warning',
    worker: { format: 'es' },
    build: {
        chunkSizeWarningLimit: 2000,
        // pedaços com hash numa pasta só deles (public/assets tem sprites e sons sem hash): o vercel.json dá cache de
        // 1 ano (immutable) só pra /bundle
        assetsDir: 'bundle',
    },
});
