// Soccermon News #1: grava as telas do jogo (menus, a barrinha de N) quadro a quadro, headless, com o relógio da página
// parado (page.clock do Playwright: Date, performance.now, setTimeout e requestAnimationFrame só andam quando a gente
// manda) e as animações CSS avançadas à mão. Assim cada quadro sai no tempo certo, a 30 fps, sem depender da máquina.
// Precisa do servidor de dev (npx vite --config vite/config.dev.mjs --port <p> --strictPort).
//   node trailer/curtas/news-01/capturar.mjs <pasta-de-saida> [tomada ...]     BASE_URL=http://localhost:<p>
// Tomadas: gomos (a barrinha de N enchendo até o N3), duelos (Arena → Seus duelos), patrocinio (o 1 de 3 com o
// Patrocínio), rota (vitória num Jogo da Rota, o ₽ subindo), ultimate (a fatia do Time Ultimate no menu de modos).
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
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 20);
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

// a barrinha de N (Gomos) do botão do capitão, de N0 a N3 (?carga=sobe: 4 passos por nível, só na tela), numa partida
// rodando (?demo=dribles abre na escalação: "Voltar pra partida" e o resume)
await tomada('gomos', {
    url: '?demo=dribles&carga=sobe',
    dpr: 6,
    alvo: '.bc-maxthumb',
    seg: 3.6,
    // a carga de mentira (?carga=sobe) recomeça quando a URL muda, e sobe 3,47x mais rápido (um nível a cada 0,75 s,
    // um gomo por tempo da música): só ela lê o performance.now acelerado; o pop do CSS anda no tempo normal
    parado: () => {
        const [d0, p0] = [Date.now(), performance.now()];
        performance.now = () => p0 + (Date.now() - d0) * (650 / 187.5);
        history.replaceState(null, '', `${location.search}&r=1`);
    },
    prep: async ({ page, ate, anda }) => {
        await ate(() => [...document.querySelectorAll('button')].some((b) => /Voltar pra partida/.test(b.textContent)));
        await page.getByText('Voltar pra partida').click();
        await anda(1500);
        await page.evaluate(() => window.__soccermonBus.emit('match:resume'));
        await ate(() => !!document.querySelector('.bc-maxthumb'));
    },
});
// Arena → Seus duelos (o placar contra cada amigo): toca no tile e grava a gaveta subindo
await tomada('duelos', {
    url: '?demo=duelos',
    dpr: 2.6667,
    alvo: { x: 0, y: 0, w: 405, h: 720 },
    seg: 3,
    antes: 800,
    prep: async ({ ate }) =>
        ate(() => [...document.querySelectorAll('button')].some((b) => /Seus duelos/.test(b.textContent))),
    acao: [15, (page) => page.getByRole('button', { name: /Seus duelos/ }).click()],
});
// o 1 de 3 com o Patrocínio
await tomada('patrocinio', {
    url: '?demo=patrocinio',
    dpr: 2.6667,
    alvo: { x: 0, y: 0, w: 405, h: 720 },
    seg: 2.4,
    prep: async ({ ate }) => ate(() => !!document.querySelector('.reward-card, [class*="reward"]')),
});
// vitória num Jogo da Rota: o ₽ do topo sobe e o +₽ do resultado conta
await tomada('rota', {
    url: '?demo=rota-vitoria',
    dpr: 2.6667,
    alvo: { x: 0, y: 0, w: 405, h: 720 },
    seg: 3,
    prep: async ({ ate }) => ate(() => /VITÓRIA/i.test(document.body.innerText)),
});
// a fatia do Time Ultimate no menu de modos (EM BREVE 27/11)
await tomada('ultimate', {
    url: '?lab=menu-modos',
    dpr: 2.6667,
    alvo: { x: 0, y: 0, w: 405, h: 720 },
    seg: 1,
    antes: 3000,
    prep: async ({ ate }) => ate(() => /EM BREVE/i.test(document.body.innerText)),
});
await browser.close();
