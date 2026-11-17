// Trailer do Time Ultimate (rascunho): grava o 1º pacote de um save novo quadro a quadro, headless, com o relógio da
// página parado (page.clock do Playwright) e as animações CSS avançadas à mão (mesmo jeito do news-01/capturar.mjs).
// O save novo ganha o sal `ut5f`: o 1º Pacote Mini dele sai Rhyhorn, Scyther (ouro) e um Magikarp Shiny, que leva o
// walkout. O walkout em si sai do scripts/walkout-capture.mjs (--ed shiny --id 129), com o áudio.
// Precisa do servidor de dev (npx vite --config vite/config.dev.mjs --port <p> --strictPort).
//   BASE_URL=http://localhost:<p> node trailer/curtas/ut-trailer/capturar.mjs <pasta-de-saida> [tomada ...]
// Tomadas: pacote (rasga, leque, para no walkout; depois Pular e a carta na mesa), clube (o time depois do 2º pacote),
// cartas (as cartas da galeria ?cards=1 em PNG transparente).
import { mkdirSync, writeFileSync } from 'node:fs';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const [OUT = 'trailer/curtas/midia/ut', ...so] = process.argv.slice(2);
const SALT = process.env.SALT ?? 'ut5f';
const FPS = 30;
const DT = 1000 / FPS;
// depois da estreia (some o selo PRÉVIA)
const URL_UT = '?lab=ultimate&utnow=2026-11-28';
const want = (n) => !so.length || so.includes(n);
const browser = await chromium.launch({ headless: true });
const newPage = async (dpr = 3, height = 640) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height }, deviceScaleFactor: dpr, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('erro na página:', e.message));
    return { ctx, page };
};

/** Abre o Time Ultimate com save novo e o sal do trailer, e vai pra Loja. */
async function lojaComSal(page) {
    // relógio falso desde o começo (anda no tempo real até o pauseAt da gravação)
    await page.clock.install();
    await page.goto(`${BASE}/${URL_UT}`, { timeout: 120000 });
    await page.getByText(/Time Ultimate/i).first().click({ timeout: 60000 });
    await page.getByRole('button', { name: /^JOGAR$/ }).click();
    await page.getByText('Meus pacotes').first().waitFor({ timeout: 30000 });
    const salt = await page.evaluate(async (s) => {
        const m = await import('/src/store/game-store.ts');
        m.useGame.setState((st) => ({ ultimate: { ...st.ultimate, salt: s } }));
        return m.useGame.getState().ultimate.salt;
    }, SALT);
    console.log('sal', salt);
    await page.locator('button').filter({ hasText: /^\d*Loja$/ }).last().click();
    await page.getByRole('button', { name: /^Abrir( 1)?$/ }).waitFor();
}

if (want('pacote') || want('clube')) {
    // só o clube: tela mais alta, pra quadra inteira caber acima da barra de abas
    const { ctx, page } = await newPage(3, want('pacote') ? 640 : 820);
    await lojaComSal(page);
    if (want('pacote')) {
        await page.getByRole('button', { name: /^Abrir( 1)?$/ }).click();
        await page.locator('.cpack-btn').waitFor();
        await page.waitForTimeout(1500);
        await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 20);
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
        const dir = `${OUT}/pacote`;
        mkdirSync(dir, { recursive: true });
        const box = await page.locator('.cpack-btn').boundingBox();
        const y = box.y + box.height * 0.45;
        const marcas = {};
        let walk = -1;
        let fim = Infinity;
        for (let i = 0; i < 30 * 30 && i < fim; i++) {
            // o dedo rasga a tampa da esquerda pra direita (quadros 10 a 22)
            if (i === 10) {
                await page.mouse.move(box.x + box.width * 0.15, y);
                await page.mouse.down();
            }
            if (i > 10 && i <= 22) await page.mouse.move(box.x + box.width * (0.15 + (0.7 * (i - 10)) / 12), y);
            if (i === 23) await page.mouse.up();
            if (walk < 0 && (await page.locator('.wk-ph').count())) {
                walk = i;
                marcas.walkout = i;
                console.log('walkout no quadro', i);
            }
            // 1,2 s depois de o walkout abrir: Pular (Esc) e, se tiver, Continuar; grava mais 3 s da mesa
            if (walk >= 0 && i === walk + 36) {
                await page.keyboard.press('Escape');
                marcas.pular = i;
            }
            if (marcas.pular && i > marcas.pular && !marcas.mesa) {
                const cont = page.getByRole('button', { name: /Continuar/ });
                if (await cont.count()) await cont.first().click();
                if (!(await page.locator('.wk-ph').count())) {
                    marcas.mesa = i;
                    fim = i + 90;
                }
            }
            await page.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png` });
            await anda(DT);
        }
        writeFileSync(`${dir}/marcas.json`, JSON.stringify(marcas));
        console.log('pacote:', marcas);
        await page.clock.resume();
    }
    if (want('clube')) {
        // o 2º pacote completa o time; o Clube com as 5 cartas
        const guardar = page.getByRole('button', { name: /^Guardar/ });
        if (await guardar.count()) await guardar.click();
        else {
            await page.getByRole('button', { name: /^Abrir( 1)?$/ }).click();
            await page.locator('.cpack-btn').click();
            await page.waitForTimeout(6000);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1500);
            await page.getByRole('button', { name: /Continuar/ }).click().catch(() => {});
            await page.getByRole('button', { name: /^Guardar/ }).click();
        }
        await page.waitForTimeout(800);
        await page.getByRole('button', { name: /^Abrir( 1)?$/ }).click();
        await page.locator('.cpack-btn').click();
        await page.waitForTimeout(6000);
        if (await page.locator('.wk-ph').count()) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1500);
            await page.getByRole('button', { name: /Continuar/ }).click().catch(() => {});
        }
        await page.getByRole('button', { name: /^Guardar/ }).click();
        await page.waitForTimeout(800);
        await page.locator('button').filter({ hasText: /^Clube$/ }).last().click();
        await page.waitForTimeout(2500);
        mkdirSync(OUT, { recursive: true });
        await page.screenshot({ path: `${OUT}/clube.png` });
        console.log('clube.png');
    }
    await ctx.close();
}

if (want('cartas')) {
    const { ctx, page } = await newPage(4);
    await page.goto(`${BASE}/?cards=1`, { timeout: 120000 });
    await page.waitForTimeout(5000);
    const painel = (re) => page.locator('.panel').filter({ has: page.locator(':scope > *:first-child', { hasText: re }) }).first();
    const cartas = [
        ['bronze', /^Bronze, prata e ouro/, 0],
        ['prata', /^Bronze, prata e ouro/, 2],
        ['ouro', /^Bronze, prata e ouro/, 5],
        ['shiny', /^Edições especiais/, 0],
        ['destaque', /^Edições especiais/, 1],
        ['icone', /^Edições especiais/, 4],
        ['evento', /^Edições especiais/, 6],
    ];
    mkdirSync(OUT, { recursive: true });
    for (const [nome, re, n] of cartas) {
        const el = painel(re).locator('.pc2').nth(n);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await el.screenshot({ path: `${OUT}/carta-${nome}.png`, omitBackground: true, animations: 'disabled' });
    }
    console.log('cartas ok');
    await ctx.close();
}
await browser.close();
