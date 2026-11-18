// Trailer v2 do Time Ultimate ("Do zero ao time", roteiro-v2.md): grava as telas do modo quadro a quadro, headless, com
// o relógio da página parado (page.clock) e as animações CSS avançadas à mão (o mesmo jeito do ../capturar.mjs da v1).
// O save novo ganha o sal `utv2cyv`: o 1º Pacote Mini sai Onix 70, Dratini 48 (bronze, o herói) e Grimer 64; o 2º,
// Kabuto, Voltorb e Dragonair 67 (química de Dragão com o Dratini); o 3º e o 4º (Abrir todos) trazem o Dragonite 89
// com walkout. Precisa do servidor de dev do UT polido (worktree ut-polish, porta 8092).
//   BASE_URL=http://localhost:8092 node trailer/curtas/ut-trailer/v2/capturar.mjs <pasta-de-saida> [pacote] [clube]
import { mkdirSync, writeFileSync } from 'node:fs';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8092';
const [OUT = 'midia-v2', ...so] = process.argv.slice(2);
const SALT = process.env.SALT ?? 'utv2cyv';
const FPS = 30;
const DT = 1000 / FPS;
const want = (n) => !so.length || so.includes(n);
const browser = await chromium.launch({ headless: true });
const btn = (page, re) => page.locator('button').filter({ hasText: re });

/** Save novo com o sal do trailer, já na Loja (Meus pacotes). Relógio falso desde o começo. */
async function novoSave() {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('erro na página:', e.message));
    await page.clock.install();
    await page.goto(`${BASE}/?lab=ultimate&utnow=2026-11-28`, { timeout: 120000 });
    await page.getByText(/Time Ultimate/i).first().click({ timeout: 60000 });
    await page.getByRole('button', { name: /^JOGAR$/ }).click();
    await page.getByText('Meus pacotes').first().waitFor({ timeout: 30000 });
    await page.evaluate(async (s) => {
        const m = await import('/src/store/game-store.ts');
        m.useGame.setState((st) => ({ ultimate: { ...st.ultimate, salt: s } }));
    }, SALT);
    await page.locator('.es-play').click();
    await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().waitFor();
    return { ctx, page };
}

/** Para o relógio e devolve `anda(ms)`: timers do React e animações CSS andam juntos, quadro a quadro. */
async function congela(page) {
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 20);
    // animação CSS nova nasce parada (a linha do tempo da página não anda sozinha entre um print e outro)
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    return async (ms) => {
        await page.clock.runFor(ms);
        await page.evaluate((d) => {
            for (const an of document.getAnimations()) {
                if (an.__vt === undefined) an.__vt = Number(an.currentTime ?? 0);
                an.__vt += d;
                an.currentTime = an.__vt;
            }
        }, ms);
    };
}

/** O dedo: um anel branco que aparece no toque e abre (anda com as animações da página). */
const dedo = (page, x, y) =>
    page.evaluate(
        ([x, y]) => {
            const d = document.createElement('div');
            d.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;
              border:3px solid #fff;background:rgba(255,255,255,.35);box-shadow:0 0 0 2px rgba(7,10,24,.6);z-index:99999;pointer-events:none`;
            document.body.append(d);
            d.animate(
                [
                    { transform: 'scale(.5)', opacity: 1 },
                    { transform: 'scale(1)', opacity: 1, offset: 0.35 },
                    { transform: 'scale(1.5)', opacity: 0 },
                ],
                { duration: 450, fill: 'forwards' },
            );
            return true;
        },
        [x, y],
    );

/** `passo(i)`: quanto o quadro i anda (ms); menos que DT = câmera lenta de verdade (quadros novos, não repetidos). */
const grava = async (page, anda, dir, n, acao, passo = () => DT) => {
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
        await acao?.(i);
        await page.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.png` });
        await anda(passo(i));
    }
};

if (want('pacote')) {
    // 1º pacote: o dedo rasga a tampa logo no quadro 2 (o 1º segundo já se mexe), o leque abre e as cartas viram
    const { ctx, page } = await novoSave();
    await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().click();
    await page.locator('.cpack-btn').waitFor();
    await page.waitForTimeout(1200);
    const anda = await congela(page);
    const box = await page.locator('.cpack-btn').boundingBox();
    const y = box.y + box.height * 0.45;
    const x = (f) => box.x + box.width * f;
    // a carta do Dratini gira entre os quadros ~35 e ~46: ali o relógio anda 1/3 (câmera lenta de verdade)
    await grava(
        page,
        anda,
        `${OUT}/pacote`,
        170,
        async (i) => {
            if (i === 1) {
                await page.mouse.move(x(0.12), y);
                await page.mouse.down();
            }
            if (i > 1 && i <= 9) await page.mouse.move(x(0.12 + (0.76 * (i - 1)) / 8), y);
            if (i === 10) await page.mouse.up();
        },
        (i) => (i >= 34 && i < 70 ? DT / 3 : DT),
    );
    await ctx.close();
}

if (want('clube')) {
    // os 2 pacotes abertos (o time se escala sozinho) e o Clube; o dedo toca no Dratini: losangos e "Química dela"
    const { ctx, page } = await novoSave();
    for (let p = 0; p < 2; p++) {
        await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().click();
        await page.locator('.cpack-btn').click();
        await page.waitForTimeout(4000);
        await btn(page, /^Guardar/).first().click();
        await page.waitForTimeout(800);
    }
    await btn(page, /^clube$/i).last().click();
    await page.waitForTimeout(2500);
    // o toque rola a quadra pro topo com scroll suave (tempo real, fora do relógio): já deixa ela lá
    await page.evaluate(() => document.querySelector('.ut-panel .vt-board')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(500);
    const anda = await congela(page);
    const alvo = btn(page, /Dratini/).first();
    const b = await alvo.boundingBox();
    const [tx, ty] = [b.x + b.width / 2, b.y + b.height * 0.45];
    await grava(page, anda, `${OUT}/clube`, 120, async (i) => {
        if (i === 12) {
            await dedo(page, tx, ty);
            await page.mouse.click(tx, ty);
        }
    });
    await ctx.close();
}
await browser.close();
