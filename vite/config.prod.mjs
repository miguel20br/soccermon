import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

export default defineConfig({
    base: './',
    plugins: [react()],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    logLevel: 'warning',
    worker: { format: 'es' },
    build: { chunkSizeWarningLimit: 2000 },
});
