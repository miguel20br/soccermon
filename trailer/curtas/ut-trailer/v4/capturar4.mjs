// Trailer v4 do Time Ultimate (roteiro-v4.md, o frenético): as telas novas, headless e quadro a quadro, do mesmo jeito do
// ../v2/capturar2.mjs (relógio da página parado; animações CSS paradas pelo CDP e andadas à mão; o dedo é um anel branco
// desenhado por cima). Tudo é o jogo de verdade, encenado pelo save (sal utv2cyv: Onix, Dratini 48, Grimer; Kabuto,
// Voltorb, Dragonair; o Pick "Seu primeiro craque" com 5 cartas viradas).
// Tomadas:
//   classico: ?demo=campeao (uma copa inteira do Modo Clássico): o título, o dedo em "Nova copa" e a copa nova do zero
//   pick:     Loja › Seu primeiro craque: rasga, as 5 cartas viradas e o dedo vira uma
//   nivel:    Jogar › o chip do nível: a folha com Fácil, Normal, Difícil e Mestre tocados um por um (as Fichas sobem)
//   insignias: Jogar › Líderes 0/8: as 8 insígnias de Kanto acendendo uma por uma (o estojo de verdade, pelo save)
//   passe:    Metas › Passe da temporada (marco 1 pago, 260 pontos): a trilha dos 40 marcos rolando de lado
//   temporada: Metas no dia 20/12 (?utnow): a faixa da Temporada 1 (Kanto clássico, Evento: Natal) e o grupo do Evento
//   cartas:   ?cards=1: as edições Shiny, Ícone e Evento (com o brilho andando)
//   embreve:  Jogar › os 4 modos "Em breve" (Rivais, Elite dos Quatro, Draft, Desafios de Montagem)
//   BASE_URL=http://localhost:8114 node trailer/curtas/ut-trailer/v4/capturar4.mjs <pasta> [tomada ...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8114';
const [OUT = 'midia-v4', ...so] = process.argv.slice(2);
const SALT = process.env.SALT ?? 'utv2cyv';
const FPS = 30;
const DT = 1000 / FPS;
const want = (n) => !so.length || so.includes(n);
const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars'] });

async function novaPagina(dpr, h = 640) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: h }, deviceScaleFactor: dpr, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('erro na página:', e.message));
    await page.clock.install();
    return { ctx, page };
}
/** Save novo do UT com o sal do trailer e os 2 pacotes do começo abertos (o time se escala sozinho). */
async function novoSave(dpr, { utnow = '2026-11-28', h = 640 } = {}) {
    const { ctx, page } = await novaPagina(dpr, h);
    await page.goto(`${BASE}/?lab=ultimate&utnow=${utnow}`, { timeout: 120000 });
    await page.getByText(/Time Ultimate/i).first().click({ timeout: 60000 });
    await page.getByRole('button', { name: /^JOGAR$/ }).click();
    await page.getByText('Meus pacotes').first().waitFor({ timeout: 30000 });
    await store(page, (m, U, s) => m.useGame.setState((st) => ({ ultimate: { ...st.ultimate, salt: s } })), SALT);
    await page.locator('.es-play').click();
    await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().waitFor();
    for (let p = 0; p < 2; p++) {
        await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().click();
        await page.locator('.cpack-btn').click();
        await page.waitForTimeout(4000);
        await btn(page, /^Guardar/).first().click();
        await page.waitForTimeout(800);
    }
    return { ctx, page };
}
const btn = (page, re) => page.locator('button').filter({ hasText: re });
const aba = (page, re) => page.locator('.ut-tabs button, nav button, button').filter({ hasText: re }).last();
/** Roda `fn(storeModule, ultimateModule, arg, rulesModule)` na página. */
const store = (page, fn, arg) =>
    page.evaluate(
        async ([src, a]) => {
            const m = await import('/src/store/game-store.ts');
            const U = await import('/src/store/ultimate/ultimate.ts');
            const R = await import('/src/store/ultimate/rules.ts');
            // biome-ignore lint/security/noGlobalEval: a função vem deste script
            return (0, eval)(src)(m, U, a, R);
        },
        [fn.toString(), arg],
    );

async function congela(page) {
    for (const extra of [20, 300, 1000, 3000]) {
        try {
            await page.clock.pauseAt((await page.evaluate(() => Date.now())) + extra);
            break;
        } catch (e) {
            if (extra === 3000) throw e;
        }
    }
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
        },
        [x, y],
    );
/** Toca no meio do elemento com o anel do dedo. Devolve o ponto (CSS). */
const toca = async (page, loc) => {
    const b = await loc.boundingBox();
    const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
    await dedo(page, x, y);
    await page.mouse.click(x, y);
    return { x, y };
};
/** Grava `n` quadros em `dir`; `acao(i)` antes de cada um; `clip` = recorte em px de CSS. */
async function grava(page, anda, dir, n, acao, clip) {
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
        await acao?.(i);
        await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`), ...(clip ? { clip } : {}) });
        await anda(DT);
    }
}
const marca = (dir, obj) => writeFileSync(join(dir, 'marcas.json'), JSON.stringify(obj, null, 1));
/** Caixa de vários elementos juntos, com folga (px de CSS). */
async function caixa(page, sel, folga = 6) {
    return page.evaluate(
        ([sel, f]) => {
            const rs = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());
            const x = Math.min(...rs.map((r) => r.left)) - f;
            const y = Math.min(...rs.map((r) => r.top)) - f;
            const x2 = Math.max(...rs.map((r) => r.right)) + f;
            const y2 = Math.max(...rs.map((r) => r.bottom)) + f;
            return { x: Math.max(0, x), y: Math.max(0, y), width: x2 - Math.max(0, x), height: y2 - Math.max(0, y) };
        },
        [sel, folga],
    );
}

if (want('classico')) {
    // uma copa inteira com um time forte (o demo para no título); pula o desfile e grava: o dedo em "Nova copa" e a
    // copa nova começando do zero (a quadra sem ninguém)
    const { ctx, page } = await novaPagina(3);
    await page.goto(`${BASE}/?demo=campeao`, { timeout: 120000 });
    const nova = btn(page, /^Nova copa/).first();
    await nova.waitFor({ timeout: 240000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 20 && (await page.locator('.hall-parade').count()); i++) {
        await page.locator('.hall-parade').click().catch(() => {});
        await page.waitForTimeout(700);
    }
    await page.waitForTimeout(2500);
    const anda = await congela(page);
    const dir = `${OUT}/classico`;
    let ponto = null;
    await grava(page, anda, dir, 60, async (i) => {
        if (i === 14) ponto = await toca(page, nova);
    });
    marca(dir, { toque: 14, ponto });
    await ctx.close();
}

if (want('pick')) {
    const { ctx, page } = await novoSave(3);
    await btn(page, /^Escolher$/).first().click();
    await page.locator('.ut-tear').waitFor();
    await page.waitForTimeout(1200);
    await page.locator('.ut-tear').click();
    await page.waitForTimeout(3000);
    const anda = await congela(page);
    const dir = `${OUT}/pick`;
    const alvo = page.locator('.ut-pick-back').nth(2);
    await grava(page, anda, dir, 45, async (i) => {
        if (i === 8) await toca(page, alvo);
    });
    marca(dir, { toque: 8 });
    await ctx.close();
}

if (want('nivel')) {
    const { ctx, page } = await novoSave(4);
    await aba(page, /^\d*\s*jogar$/i).click();
    await page.waitForTimeout(1200);
    await page.locator('.ut-level-chip').first().click();
    await page.waitForTimeout(1200);
    const anda = await congela(page);
    const seg = page.locator('.ut-level .bc-seg button');
    const clip = await caixa(page, '.ut-level .bc-seg, .ut-level .ut-prizes', 10);
    const dir = `${OUT}/nivel`;
    // Fácil, Normal, Difícil e Mestre, um a cada 6 quadros (0,2 s): a linha acesa desce e as Fichas sobem
    const toques = { 2: 0, 8: 1, 14: 2, 20: 3 };
    await grava(
        page,
        anda,
        dir,
        36,
        async (i) => {
            if (toques[i] !== undefined) await toca(page, seg.nth(toques[i]));
        },
        clip,
    );
    marca(dir, { toques, clip });
    await ctx.close();
}

if (want('insignias')) {
    const { ctx, page } = await novoSave(5);
    await aba(page, /^\d*\s*jogar$/i).click();
    await page.waitForTimeout(1500);
    const anda = await congela(page);
    const clip = await caixa(page, '.ut-mode-gyms', 4);
    const dir = `${OUT}/insignias`;
    const ids = await store(page, (m, U, a, R) => R.GYMS.map((g) => g.id));
    // uma insígnia a cada 3 quadros (uma semicolcheia a 150 BPM), do Brock ao Giovanni
    await grava(
        page,
        anda,
        dir,
        36,
        async (i) => {
            if (i >= 3 && i % 3 === 0 && i / 3 <= ids.length)
                await store(
                    page,
                    (m, U, g) => m.useGame.setState((s) => ({ ultimate: { ...s.ultimate, gyms: g } })),
                    ids.slice(0, i / 3),
                );
        },
        clip,
    );
    marca(dir, { clip, ids });
    await ctx.close();
}

if (want('passe')) {
    const { ctx, page } = await novoSave(4, { h: 900 });
    // o passe da v3: marco 1 pago (a carta de abertura) e 260 pontos
    await store(page, (m, U) => {
        let u = m.useGame.getState().ultimate;
        u = U.payPass({ ...u, pass: { day: '', today: 0, pts: 150, marks: 0 } });
        m.useGame.setState({ ultimate: { ...u, pass: { ...u.pass, pts: 260 } } });
    });
    await aba(page, /^\d*\s*metas$/i).click();
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('.ut-pass')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);
    await page.evaluate(() => {
        const ol = document.querySelector('.ut-trail');
        ol.style.scrollBehavior = 'auto';
        ol.style.scrollSnapType = 'none';
        ol.scrollLeft = 0;
    });
    const anda = await congela(page);
    const clip = await caixa(page, '.ut-pass', 2);
    const dir = `${OUT}/passe`;
    const max = await page.evaluate(() => {
        const ol = document.querySelector('.ut-trail');
        return ol.scrollWidth - ol.clientWidth;
    });
    // a trilha rola de lado, rápido no meio (ease in-out), até uns 2/3 dos 40 marcos
    const N = 36;
    await grava(
        page,
        anda,
        dir,
        N,
        async (i) => {
            const k = Math.min(1, i / (N - 6));
            const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
            await page.evaluate((x) => {
                document.querySelector('.ut-trail').scrollLeft = x;
            }, e * max * 0.7);
        },
        clip,
    );
    marca(dir, { clip, max });
    await ctx.close();
}

if (want('temporada')) {
    // a faixa da temporada com o evento no ar (20/12: Natal) e o grupo do Evento nas Metas
    const { ctx, page } = await novoSave(5, { utnow: '2026-12-20', h: 1500 });
    await aba(page, /^\d*\s*metas$/i).click();
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const anda = await congela(page);
    const dir = `${OUT}/temporada`;
    await grava(page, anda, `${dir}/faixa`, 15, null, await caixa(page, '.ut-season', 3));
    await grava(page, anda, `${dir}/evento`, 15, null, await caixa(page, '.ut-goals.ut-event', 3));
    await ctx.close();
}

if (want('cartas')) {
    const { ctx, page } = await novaPagina(5, 1400);
    await page.goto(`${BASE}/?cards=1`, { timeout: 120000 });
    await page.waitForTimeout(5000);
    const painel = page.locator('.panel').filter({ has: page.locator('h2', { hasText: /^Edições especiais/ }) }).first();
    const anda = await congela(page);
    for (const [nome, n] of [
        ['shiny', 0],
        ['icone', 4],
        ['evento', 6],
    ]) {
        const el = painel.locator('.pc2').nth(n);
        await el.scrollIntoViewIfNeeded();
        await anda(200);
        const b = await el.boundingBox();
        const clip = { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 };
        await grava(page, anda, `${OUT}/cartas/${nome}`, 12, null, clip);
    }
    await ctx.close();
}

if (want('embreve')) {
    const { ctx, page } = await novoSave(5, { h: 1500 });
    await aba(page, /^\d*\s*jogar$/i).click();
    await page.waitForTimeout(1500);
    const dir = `${OUT}/embreve`;
    mkdirSync(dir, { recursive: true });
    const ids = ['rivals', 'elite', 'draft', 'sbc'];
    for (const id of ids) {
        const el = page.locator(`.ut-mode.is-locked.is-${id}`).first();
        await el.screenshot({ path: join(dir, `${id}.png`), animations: 'disabled' });
    }
    // os quatro juntos, como estão na aba
    await page.screenshot({ path: join(dir, 'grade.png'), clip: await caixa(page, '.ut-mode.is-locked', 6) });
    await ctx.close();
}
await browser.close();
