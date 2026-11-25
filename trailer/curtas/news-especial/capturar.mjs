// Soccermon News: edição especial Time Ultimate (25/11, a partir do capturar do News #2): grava as telas do Time Ultimate
// quadro a quadro, headless, com o relógio da página parado (page.clock do Playwright) e as animações CSS avançadas à mão.
// Precisa do servidor de dev da v010 (npx vite --config vite/config.dev.mjs --port <p> --strictPort).
//   BASE_URL=http://localhost:<p> node trailer/curtas/news-especial/capturar.mjs <pasta-de-saida> [tomada ...]
// Tomadas: pacote (a Loja, o Pacote Mini rasgando no arrasto e o leque), clube (o Clube com as cartas, PNG), insignias
// (as 8 insígnias apagadas e acesas, PNG), titulo (o adesivo TIME ULTIMATE, PNG), brock (o VERSUS e a partida contra o
// Pewter do Brock), cartas (Articuno Evento de gelo, Magikarp bronze e Machoke, PNG da galeria ?cards=1).
// O walkout dourado sai do scripts/walkout-capture.mjs da v010 (--ed ouro85).
import { mkdirSync } from 'node:fs';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const [OUT = 'trailer/curtas/news-especial/midia/news', ...so] = process.argv.slice(2);
const FPS = 30;
const DT = 1000 / FPS;
// sem os balões e anéis de dica por cima (o vídeo explica com a cartela), sem o controle do laboratório do menu
const LIMPA = '.sl-ring,.sl-ring-target,.sl-cue-row,.coach,.coach-bubble,.mm-lab-ctl,[class*="lab-switch"],.help-fab{display:none!important}';
const TELA = { x: 0, y: 0, w: 405, h: 720 };
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

/** Abre `url` com o relógio parado, roda `prep` e grava `seg` segundos do recorte `alvo`; `cada(i, page)` roda antes de cada quadro. */
async function tomada(nome, { url, dpr = 2.6667, prep, alvo = TELA, seg, cada }) {
    if (so.length && !so.includes(nome)) return;
    const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: dpr, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${nome}] erro na página:`, e.message));
    // v4: os sprites do VERSUS e das cartas são GIFs, e GIF anda no relógio real do Chromium (nem o page.clock nem o
    // getAnimations() pegam): cada quadro da gravação (33 ms) leva ~0,5 s de verdade, então o idle saía ~15x mais
    // rápido que no jogo (o VERSUS do v3: o Golem trocava de quadro em todo quadro do vídeo; no jogo, 9 por segundo). Aqui cada GIF é decodificado e troca de quadro no relógio da gravação (`__gifTick(ms)`, chamado em `anda`),
    // na duração de cada quadro do GIF; a mesma ideia do scripts/walkout-capture.mjs e do scripts/trailer-capture.mjs.
    await page.addInitScript(() => {
        const gifs = new Map();
        const carrega = (src) => {
            if (!gifs.has(src))
                gifs.set(src, (async () => {
                    const dec = new ImageDecoder({ data: await (await fetch(src)).arrayBuffer(), type: 'image/gif' });
                    await dec.tracks.ready;
                    const c = document.createElement('canvas');
                    const urls = [];
                    const durs = [];
                    for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
                        const { image } = await dec.decode({ frameIndex: i });
                        c.width = image.displayWidth;
                        c.height = image.displayHeight;
                        const cx = c.getContext('2d');
                        cx.clearRect(0, 0, c.width, c.height);
                        cx.drawImage(image, 0, 0);
                        urls.push(c.toDataURL());
                        durs.push(Math.max(20, (image.duration ?? 100000) / 1000));
                        image.close();
                    }
                    return { urls, durs, total: durs.reduce((a, b) => a + b, 0) };
                })());
            return gifs.get(src);
        };
        let agora = 0;
        window.__gifTick = (ms) => {
            agora += ms;
            return Promise.all([...document.querySelectorAll('img')].map(async (im) => {
                const attr = im.getAttribute('src') || '';
                if (!attr.startsWith('data:') && attr !== im.dataset.gifSrc) {
                    if (!/\.gif(\?|$)/.test(attr)) return;
                    im.dataset.gifSrc = attr;
                    im.dataset.gifT0 = String(agora);
                }
                if (!im.dataset.gifSrc) return;
                const g = await carrega(new URL(im.dataset.gifSrc, location.href).href);
                let t = (agora - Number(im.dataset.gifT0)) % g.total;
                let i = 0;
                while (i < g.durs.length - 1 && t >= g.durs[i]) t -= g.durs[i++];
                if (im.dataset.gifFrame !== String(i)) {
                    im.dataset.gifFrame = String(i);
                    im.src = g.urls[i];
                    await im.decode().catch(() => {});
                }
            }));
        };
    });
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
            return window.__gifTick(d);
        }, ms);
    };
    await prep({ page, anda });
    if (seg) {
        await page.clock.pauseAt(Math.max(await page.evaluate(() => Date.now()), Date.now()) + 2000);
        const dir = `${OUT}/${nome}`;
        mkdirSync(dir, { recursive: true });
        const n = Math.round(seg * FPS);
        const t0 = Date.now();
        for (let i = 0; i < n; i++) {
            if (cada) await cada(i, page);
            await page.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png`, clip: { x: alvo.x, y: alvo.y, width: alvo.w, height: alvo.h } });
            await anda(DT);
        }
        console.log(`${nome}: ${n} quadros → ${dir} (${((Date.now() - t0) / n).toFixed(0)} ms de verdade por quadro de ${DT.toFixed(1)} ms)`);
    }
    await ctx.close();
}

/** Entra no Time Ultimate pelo menu de modos (a bandeira ?lab=ultimate liga o modo antes de 27/11). */
const entraUT = async (page) => {
    await page.locator('.mm-s-ultimate').click();
    await page.waitForTimeout(700);
    await page.locator('.mm-play').click();
    await page.locator('.ut-tab').first().waitFor();
    await page.waitForTimeout(900);
};
const aba = async (page, nome) => {
    await page.locator('.ut-tab', { hasText: nome }).click();
    await page.waitForTimeout(1200);
};

// o Pacote Mini da Loja: 0,6 s parado, o dedo arrasta de lado (rasga) e o leque abre
let pacote = null;
await tomada('pacote', {
    url: '?lab=ultimate',
    seg: Number(process.env.SEG ?? 4),
    prep: async ({ page }) => {
        await entraUT(page);
        // v4: o salt fixo dá o mesmo pacote dos v1–v3 (Jigglypuff, o shiny do walkout no meio e Mankey); sem ele o
        // sorteio muda a cada gravação
        await page.evaluate(async () => {
            const { useGame } = await import('/src/store/game-store.ts');
            useGame.setState((s) => ({ ultimate: { ...s.ultimate, salt: 'amg' } }));
        });
        await aba(page, 'Loja');
        await page.locator('.ut-shop button, button', { hasText: /^Abrir$/ }).first().click();
        await page.locator('.ut-tear').waitFor();
        await page.waitForTimeout(1500);
        const b = await page.locator('.ut-tear').boundingBox();
        pacote = { x0: b.x + b.width * 0.22, x1: b.x + b.width * 0.9, y: b.y + b.height * 0.3 };
    },
    cada: async (i, page) => {
        const p = pacote;
        if (i === 18) {
            await page.mouse.move(p.x0, p.y);
            await page.mouse.down();
        }
        if (i > 18 && i <= 30) await page.mouse.move(p.x0 + ((p.x1 - p.x0) * (i - 18)) / 12, p.y);
        if (i === 31) await page.mouse.up();
    },
});

// o Clube depois de abrir os pacotes (o 1º craque e os 2 Mini): a aba Cartas
await tomada('clube', {
    url: '?lab=ultimate',
    dpr: 3,
    prep: async ({ page }) => {
        await entraUT(page);
        await aba(page, 'Loja');
        const abre = async (rot) => {
            await page.locator('button', { hasText: rot }).first().click();
            await page.waitForTimeout(800);
            // rasga com um toque, espera o leque (e o walkout, se vier) e guarda
            await page.locator('.cpack-btn').first().click().catch(() => {});
            for (let k = 0; k < 40; k++) {
                const ok = page.locator('.ut-pack-keep');
                if (await ok.count()) {
                    await ok.first().click();
                    await page.waitForTimeout(600);
                    if (!(await page.locator('.ut-pack-keep').count())) return;
                    await page.locator('.cpack-btn').first().click().catch(() => {});
                }
                await page.mouse.click(200, 360);
                await page.waitForTimeout(500);
            }
        };
        await abre(/^Abrir$/);
        await aba(page, 'Clube');
        await page.locator('button', { hasText: /^Cartas/ }).first().click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${OUT}/clube.png` });
        await page.locator('button', { hasText: /^Elenco/ }).first().click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${OUT}/elenco.png`, fullPage: true });
        await page.screenshot({ path: `${OUT}/clube-inteiro.png`, fullPage: true });
        console.log(`clube → ${OUT}/clube.png`);
    },
});

// as 8 insígnias dos líderes (aba Jogar): apagadas como vêm e acesas tirando o .off
await tomada('insignias', {
    url: '?lab=ultimate',
    dpr: 6,
    prep: async ({ page }) => {
        await entraUT(page);
        await aba(page, 'Jogar');
        const bs = page.locator('.ut-b-badges svg');
        const n = await bs.count();
        for (let k = 0; k < n; k++) await bs.nth(k).screenshot({ path: `${OUT}/insignia-${k}-off.png`, omitBackground: true });
        await page.evaluate(() => document.querySelectorAll('.ut-b-badges svg').forEach((s) => s.classList.remove('off')));
        await page.waitForTimeout(300);
        for (let k = 0; k < n; k++) await bs.nth(k).screenshot({ path: `${OUT}/insignia-${k}-on.png`, omitBackground: true });
        await page.locator('.ut-hub h1, .ut-hub .mh-title, .ut-hub [class*="title"]').first().screenshot({ path: `${OUT}/ut-titulo.png`, omitBackground: true });
        console.log(`insignias: ${n} → ${OUT}/insignia-*.png e ut-titulo.png`);
    },
});

// o VERSUS e o começo da partida contra o Pewter (o clube do Brock)
await tomada('brock', {
    url: '?demo=lider&clube=brock',
    seg: Number(process.env.SEG ?? 9),
    prep: async ({ page }) => {
        await page.locator('button', { hasText: /^Jogar/ }).first().waitFor({ timeout: 60000 });
        await page.waitForTimeout(1500);
        await page.locator('button', { hasText: /^Jogar/ }).first().click();
        await page.waitForTimeout(150);
    },
});

// as cartas da galeria (?cards=1): o Articuno Evento de gelo, o Magikarp e o Machoke da amostra
await tomada('cartas', {
    url: '?cards=1',
    dpr: 4,
    prep: async ({ page }) => {
        await page.locator('#evento-tipos').waitFor({ timeout: 60000 });
        await page.waitForTimeout(2500);
        await page.evaluate(() => document.querySelectorAll('.pc2-offscreen').forEach((e) => e.classList.remove('pc2-offscreen')));
        const art = page.locator('#evento-tipos .pc2.pr-ev-ice').first();
        await art.evaluate((e) => e.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(800);
        const ba = await art.boundingBox();
        await page.screenshot({ path: `${OUT}/carta-articuno-evento.png`, clip: { x: ba.x, y: ba.y, width: ba.width, height: ba.height } });
        for (const [nome, arq] of [['Magikarp', 'magikarp'], ['Machoke', 'machoke']]) {
            await page.fill('#cg-search', nome);
            await page.waitForTimeout(1500);
            const c = page.locator('.cg-stage .pc2').first();
            await c.evaluate((e) => e.scrollIntoView({ block: 'center' }));
            await page.waitForTimeout(600);
            console.log(arq, await c.getAttribute('class'), (await c.textContent()).slice(0, 60));
            const bb = await c.boundingBox();
            await page.screenshot({ path: `${OUT}/carta-${arq}.png`, clip: { x: bb.x, y: bb.y, width: bb.width, height: bb.height } });
        }
        console.log(`cartas → ${OUT}/carta-*.png`);
    },
});
await browser.close();
