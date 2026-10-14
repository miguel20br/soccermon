import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

export default defineConfig({
    base: './',
    plugins: [react()],
    // NEXT_PUBLIC_*: variáveis públicas que a integração Supabase da Vercel cria (URL e chave publicável)
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    logLevel: 'warning',
    worker: { format: 'es' },
    build: { chunkSizeWarningLimit: 2000 },
});
