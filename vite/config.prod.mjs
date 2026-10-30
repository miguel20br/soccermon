import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

/**
 * Lista no index.html os arquivos do pedaço da partida (PhaserCanvas e o que ele importa), pra Home baixá-los com
 * `<link rel="modulepreload">` (src/PhaserGame.tsx): baixa e compila sem rodar o módulo. O `import()` rodava o Phaser
 * inteiro (~360 ms de tarefa longa no celular) no meio da Home.
 */
const phaserFiles = {
    name: 'soccermon-phaser-files',
    transformIndexHtml: {
        order: 'post',
        handler(_html, ctx) {
            const chunks = Object.values(ctx.bundle ?? {}).filter((c) => c.type === 'chunk');
            const root = chunks.find((c) => c.facadeModuleId?.endsWith('/src/game/PhaserCanvas.tsx'));
            if (!root) return [];
            const files = new Set();
            const walk = (c) => {
                if (!c || files.has(c.fileName)) return;
                files.add(c.fileName);
                for (const css of c.viteMetadata?.importedCss ?? []) files.add(css);
                for (const f of c.imports) walk(ctx.bundle[f]);
            };
            walk(root);
            const content = [...files].map((f) => `/${f}`).join(' ');
            return [{ tag: 'meta', attrs: { name: 'soccermon-phaser', content }, injectTo: 'head' }];
        },
    },
};

export default defineConfig({
    // raiz do site (soccermon.com): com './' as URLs absolutas do CSS viravam assets/assets/...
    base: '/',
    plugins: [react(), phaserFiles],
    // NEXT_PUBLIC_*: variáveis públicas que a integração Supabase da Vercel cria (URL e chave publicável)
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    // build: o Duelo só junta telas do mesmo deploy (versões 0.8.8 seguidas mudam o jogo sem trocar o número)
    define: {
        // displayVersion: número das Novidades com 4 partes (0.8.8.3); o npm só aceita semver em "version"
        __APP_VERSION__: JSON.stringify(pkg.displayVersion ?? pkg.version),
        __APP_BUILD__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'),
        // modo fumaça (?demo=, ?cards=1, ?vel=N): só nas prévias da Vercel e no CI, nunca em produção
        __SMOKE__: JSON.stringify(process.env.VERCEL_ENV === 'preview' || process.env.SOCCERMON_SMOKE === '1'),
    },
    logLevel: 'warning',
    worker: { format: 'es' },
    build: {
        chunkSizeWarningLimit: 2000,
        // pedaços com hash numa pasta só deles (public/assets tem sprites e sons sem hash): o vercel.json dá cache de
        // 1 ano (immutable) só pra /bundle
        assetsDir: 'bundle',
    },
});
