// Soccermon News #2 v4 (cópia do capturar do News #1, com as tomadas da 0.9.53.1): grava a partida quadro a quadro, headless, com o relógio da página
// parado (page.clock do Playwright: Date, performance.now, setTimeout e requestAnimationFrame só andam quando a gente
// manda) e as animações CSS avançadas à mão. Assim cada quadro sai no tempo certo, a 30 fps, sem depender da máquina.
// Precisa do servidor de dev (npx vite --config vite/config.dev.mjs --port <p> --strictPort).
//   node trailer/curtas/news-01/capturar.mjs <pasta-de-saida> [tomada ...]     BASE_URL=http://localhost:<p>
// Tomadas: pika, karp, snorlax, psyduck, gengar (comemorações), combo (cut-in de dupla), drible (roleta em 8x).
import { mkdirSync } from 'node:fs';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const [OUT = 'trailer/curtas/midia/news', ...so] = process.argv.slice(2);
const FPS = 30;
const DT = 1000 / FPS;
// sem os balões e anéis de dica por cima (o vídeo explica com a cartela), sem o controle do laboratório do menu
const LIMPA = '.sl-ring,.sl-ring-target,.sl-cue-row,.coach,.coach-bubble,.mm-lab-ctl,[class*="lab-switch"]{display:none!important}';

const browser = await chromium.launch({ headless: true });

/** Abre `url` com o relógio parado, roda `prep` e grava `seg` segundos do recorte `alvo` (seletor ou {x,y,w,h} em px CSS). */
async function tomada(nome, { url, dpr = 3, prep, alvo, seg, antes = 0, acao, parado }) {
    if (so.length && !so.includes(nome)) return;
    const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: dpr, locale: 'pt-BR' });
    await ctx.addInitScript(() => localStorage.setItem('soccermon-packs-opened', '10'));
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${nome}] erro na página:`, e.message));
    await page.clock.install();
    await page.goto(`${BASE}/${url}`);
    await page.addStyleTag({ content: LIMPA });
    const anda = async (ms) => {
        await page.clock.runFor(ms);
        await page.evaluate((d) => {
            for (const an of document.getAnimations()) {
                if (an.__vt === undefined) {
                    an.pause();
                    an.__vt = Number(an.currentTime ?? 0);
                }
                an.__vt += d;
                an.currentTime = an.__vt;
            }
        }, ms);
    };
    /** Anda o relógio até `ok()` dar verdade (a rede e os módulos chegam no tempo real). */
    const ate = async (ok, max = 60000) => {
        for (let t = 0; t < max; t += 100) {
            if (await page.evaluate(ok).catch(() => false)) return;
            await anda(100);
            await page.waitForTimeout(30);
        }
        throw new Error(`[${nome}] não chegou: ${ok}`);
    };
    await prep({ page, anda, ate });
    // daqui em diante o relógio só anda com o `anda` (até aqui ele corria no tempo real, pra página carregar)
    // o relógio de mentira pode estar à frente do Date.now da página (o anda do prep): pausa um pouco depois dos dois
    await page.clock.pauseAt(Math.max(await page.evaluate(() => Date.now()), Date.now()) + 2000);
    if (parado) await page.evaluate(parado);
    if (antes) for (let t = 0; t < antes; t += DT) await anda(DT);
    const dir = `${OUT}/${nome}`;
    mkdirSync(dir, { recursive: true });
    const n = Math.round(seg * FPS);
    for (let i = 0; i < n; i++) {
        // `acao`: [quadro, fn] (o toque no meio da tomada)
        if (acao && i === acao[0]) await acao[1](page);
        const clip = typeof alvo === 'string' ? await page.locator(alvo).first().boundingBox() : alvo;
        await page.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png`, clip: { x: clip.x, y: clip.y, width: clip.w ?? clip.width, height: clip.h ?? clip.height } });
        await anda(DT);
    }
    console.log(`${nome}: ${n} quadros → ${dir}`);
    await ctx.close();
}

/** Partida de um demo que abre na escalação: "Voltar pra partida" e o resume (como os gomos do News #1). */
const volta = async ({ page, ate, anda }) => {
    await ate(() => [...document.querySelectorAll('button')].some((b) => /Voltar pra partida/.test(b.textContent)));
    await page.getByText('Voltar pra partida').first().click();
    await anda(1500);
    await page.evaluate(() => window.__soccermonBus.emit('match:resume'));
    await ate(() => !!document.querySelector('canvas'));
};
const TELA = { x: 0, y: 0, w: 405, h: 720 };
for (const [nome, sp] of [['pika', 25], ['karp', 129], ['snorlax', 143], ['psyduck', 54], ['gengar', 94]])
    await tomada(nome, { url: `?demo=comemoracao&sp=${sp}`, dpr: 2.6667, alvo: TELA, seg: Number(process.env.SEG ?? 9), prep: volta });
await tomada('combo', { url: '?demo=combo', dpr: 2.6667, alvo: TELA, seg: Number(process.env.SEG ?? 7), prep: volta });
await tomada('drible', {
    url: '?demo=dribles&tipo=roleta',
    dpr: 2.6667,
    alvo: TELA,
    seg: Number(process.env.SEG ?? 9),
    prep: async (o) => {
        await volta(o);
        await o.page.getByRole('button', { name: /^8x$/ }).first().click();
    },
});
await browser.close();
