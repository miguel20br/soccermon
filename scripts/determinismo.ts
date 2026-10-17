/**
 * Mesma partida em todo navegador: roda as partidas fixas de `src/engine/determinism.ts` no Node e no Chromium,
 * Firefox e WebKit (Playwright headless) e compara os hashes. Sai com erro se algum for diferente.
 *
 * Uso: npm run determinismo [-- chromium firefox]
 * Playwright: o pacote `playwright` se estiver instalado, senão o do cache do npx (env PLAYWRIGHT muda o caminho).
 * Navegadores: `npx playwright install chromium firefox webkit`.
 */
import { build } from 'vite';
import { determinismHashes } from '../src/engine/determinism';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.js';
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const browsers = wanted.length ? wanted : ['chromium', 'firefox', 'webkit'];

// tipos mínimos (o pacote playwright não é dependência do projeto)
interface Page {
    addScriptTag(o: { content: string }): Promise<unknown>;
    evaluate<T>(fn: () => T): Promise<T>;
}
interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
}
type Pw = Record<string, { launch(o: { headless: boolean }): Promise<Browser> }>;
async function loadPlaywright(): Promise<Pw> {
    const from = process.env.PLAYWRIGHT;
    if (from) return (await import(from)).default;
    try {
        return (await import('playwright' as string)).default;
    } catch {
        return (await import(NPX_PLAYWRIGHT)).default;
    }
}

// o motor num script só (IIFE), sem servidor: a página em branco recebe o código e roda as partidas
const out = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
        write: false,
        minify: false,
        lib: { entry: 'src/engine/determinism.ts', formats: ['iife'], name: 'Determinism' },
    },
});
const code = (Array.isArray(out) ? out[0] : out).output[0].code as string;

const node = determinismHashes().join(' ');
console.log(`${'node'.padEnd(9)} ${node}`);
const pw = await loadPlaywright();
let ok = true;
for (const name of browsers) {
    const browser = await pw[name].launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.addScriptTag({ content: code });
        const t0 = Date.now();
        const got: string = await page.evaluate(() =>
            (
                globalThis as unknown as { Determinism: { determinismHashes(): string[] } }
            ).Determinism.determinismHashes().join(' '),
        );
        const same = got === node;
        ok &&= same;
        console.log(`${name.padEnd(9)} ${got}  ${same ? 'igual' : 'DIFERENTE'} (${Date.now() - t0} ms)`);
    } finally {
        await browser.close();
    }
}
if (!ok) {
    console.error('Hash diferente entre navegadores: alguma conta do motor não é determinística.');
    process.exit(1);
}
