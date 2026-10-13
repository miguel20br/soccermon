import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    plugins: [react()],
    logLevel: 'warning',
    worker: { format: 'es' },
    build: { chunkSizeWarningLimit: 2000 },
});
