#!/usr/bin/env node
// Fumaça headless (CI em toda branch, docs/planos/esteira.md). Contra um build servido (vite preview do dist):
//   node scripts/smoke/fumaca.mjs copa    <base> <pasta> <LxA>             copa curta: draft, 1ª partida, resultado
//   node scripts/smoke/fumaca.mjs paginas <base> <pasta> <LxA> <url>...    print de cada página (url|seletor;seletor
//                                                                          clica antes do print)
// Falha (código 1) com erro de página/console, HTTP >= 400, texto quebrado (undefined, NaN, chave de i18n) ou rolagem
// lateral. Resultado em <pasta>/res-<copa|paginas>-<LxA>.json. Playwright: o pacote `playwright` se estiver instalado
// (CI), senão o do cache do npx (env PLAYWRIGHT muda o caminho). PW_CHANNEL=chrome usa o Chrome do sistema (CI).
import fs from 'node:fs';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [cmd, base, dir, size, ...urls] = process.argv.slice(2);
if (!['copa', 'paginas'].includes(cmd) || !size) {
    console.error('uso: fumaca.mjs copa|paginas <base> <pasta> <LxA> [url...]');
    process.exit(2);
}
const [W, H] = size.split('x').map(Number);
fs.mkdirSync(dir, { recursive: true });
const T0 = Date.now();
const log = (...a) => console.log(`[${cmd} ${size} ${((Date.now() - T0) / 1000).toFixed(0)}s]`, ...a);
const oks = [];
const fails = [];
const errors = new Set();

const browser = await pw.chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || undefined });
const mobile = W < 1000;
const newPage = async () => {
    const ctx = await browser.newContext({
        viewport: { width: W, height: H },
        locale: 'pt-BR',
        hasTouch: mobile,
        isMobile: mobile,
    });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.add(`pageerror: ${e.message}`));
    p.on('console', (m) => {
        // 404 do /_vercel (analytics) não existe fora da Vercel
        if (m.type() === 'error' && !/_vercel/.test(`${m.text()} ${m.location()?.url}`))
            errors.add(`console.error: ${m.text().slice(0, 300)}`);
    });
    p.on('response', (r) => {
        if (r.status() >= 400 && !r.url().includes('/_vercel/')) errors.add(`HTTP ${r.status()} ${r.url()}`);
    });
    return p;
};
const shot = async (p, name, fullPage = false) => {
    await p
        .screenshot({ path: `${dir}/${size}-${name}.png`, fullPage })
        .catch((e) => log('print falhou', name, e.message));
    const bad = await p
        .evaluate(() => {
            const t = document.body.innerText;
            const out = [];
            const key =
                /\b(?:common|home|team|match|result|reward|profile|settings|duel|stats|help|account|title|battle|shop)\.[a-z][\w.]+/g;
            for (const re of [/\bundefined\b/g, /\bNaN\b/g, /\{\w+\}/g, key]) {
                out.push(...(t.match(re) ?? []).slice(0, 3));
            }
            return out;
        })
        .catch(() => []);
    if (bad.length) fails.push(`texto suspeito em "${name}": ${[...new Set(bad)].join(' | ')}`);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth).catch(() => 0);
    if (ov > 0) fails.push(`rolagem lateral em "${name}": +${ov}px`);
};
const vis = (p, sel) =>
    p
        .locator(sel)
        .first()
        .isVisible()
        .catch(() => false);
const step = async (p, name, fn) => {
    try {
        await fn();
        oks.push(name);
    } catch (e) {
        fails.push(`${name}: ${String(e).split('\n')[0]}`);
        await shot(p, `FALHA-${name.replace(/\W+/g, '_')}`);
        throw e;
    }
};
const skipOnboarding = async (p) => {
    for (let k = 0; k < 4 && (await vis(p, '.ob-skip')); k++) {
        await p.locator('.ob-skip').first().click();
        await p.waitForTimeout(400);
    }
};

async function copa() {
    const p = await newPage();
    const btn = (re) => p.locator('button:visible', { hasText: re }).first();
    // ?vel=16: modo fumaça (só em dev, prévia e CI) acelera a quadra
    await step(p, 'home', async () => {
        await p.goto(`${base}/?vel=16`, { waitUntil: 'load' });
        await p
            .getByRole('button', { name: /Nova copa/ })
            .first()
            .waitFor({ timeout: 30000 });
        await skipOnboarding(p);
        await p.waitForTimeout(600);
        await shot(p, '01-home', true);
    });
    await step(p, 'nova copa e formação', async () => {
        await p
            .getByRole('button', { name: /Nova copa/ })
            .first()
            .click();
        await p.locator('.formation-option').first().waitFor({ timeout: 15000 });
        await shot(p, '02-formacao');
        await p.locator('.formation-option').nth(1).click();
    });
    await step(p, 'draft', async () => {
        for (let round = 0; round < 30; round++) {
            await p.waitForTimeout(500);
            if ((await vis(p, '.btn.primary.wide')) && !(await vis(p, '.draft-grid'))) break;
            for (let k = 0; k < 8 && (await vis(p, '.cpack-btn')); k++) {
                await p.locator('.cpack-btn').first().click();
                await p.waitForTimeout(400);
            }
            if (round === 1) await shot(p, '03-draft');
            await p
                .locator('.fut-action:visible')
                .first()
                .click({ timeout: 5000 })
                .catch(() => {});
            await p.waitForTimeout(300);
            if (await p.locator('.slot.target').count())
                await p
                    .locator('.slot.target')
                    .first()
                    .click()
                    .catch(() => {});
        }
        await p.locator('.btn.primary.wide').waitFor({ timeout: 15000 });
        await shot(p, '04-escalacao', true);
    });
    await step(p, '1ª partida', async () => {
        await p.locator('.btn.primary.wide').click();
        await p.locator('button.vs-start:not([disabled])').waitFor({ timeout: 40000 });
        await shot(p, '05-versus');
        await p.locator('button.vs-start:not([disabled])').click();
        await p.locator('.phaser-container canvas').waitFor({ timeout: 30000 });
        await p
            .locator('.vs-overlay')
            .first()
            .waitFor({ state: 'detached', timeout: 15000 })
            .catch(() => {});
        await p.waitForTimeout(3000);
        await shot(p, '06-partida');
        await p.locator('.bc-skip:not([disabled])').click({ timeout: 15000 });
        for (let i = 0; i < 240 && !(await btn(/^Ver resultado/).isVisible()); i++) {
            if (await vis(p, '.ht-panel'))
                await p
                    .getByRole('button', { name: /2º tempo/ })
                    .click()
                    .catch(() => {});
            await p.waitForTimeout(500);
        }
        await shot(p, '07-fim');
    });
    await step(p, 'resultado', async () => {
        await btn(/^Ver resultado/).click({ timeout: 10000 });
        await p.waitForTimeout(1500);
        await shot(p, '08-resultado', true);
        const reward = btn(/Escolher recompensa/);
        if (await reward.isVisible().catch(() => false)) {
            await reward.click();
            await p.waitForTimeout(1500);
            await shot(p, '09-recompensa');
            // ganhou: depois da recompensa vem o Mercado (0.9.0); compra o que der e segue pra escalação
            await btn(/^Pular/).click({ timeout: 10000 });
            await p.locator('.shop-grid').first().waitFor({ timeout: 15000 });
            await p.waitForTimeout(800);
            await shot(p, '10-mercado', true);
            const buy = p.locator('.shop-offer:has(.sp-card) .shop-buy:not([disabled])');
            if (await buy.count()) await buy.first().click();
            await p.waitForTimeout(600);
            await btn(/^Seguir/).click({ timeout: 10000 });
            await p.locator('.btn.primary.wide').waitFor({ timeout: 15000 });
            await shot(p, '11-escalacao-2', true);
        }
    });
}

async function paginas() {
    for (const [i, u] of urls.entries()) {
        const [path, clicks] = u.split('|');
        const p = await newPage();
        await step(p, `página ${path}`, async () => {
            await p.goto(base + path, { waitUntil: 'load' });
            await p.waitForTimeout(3000);
            await skipOnboarding(p);
            for (const sel of clicks ? clicks.split(';') : []) {
                await p.locator(sel).first().click({ timeout: 8000 });
                await p.waitForTimeout(1200);
            }
            await p.waitForTimeout(800);
            await shot(p, `p${i}-${path.replace(/\W+/g, '_').slice(0, 40)}`, true);
        }).catch(() => {});
        await p.context().close();
    }
}

let code = 0;
await (cmd === 'copa' ? copa() : paginas()).catch(() => {});
if (errors.size) fails.push(...errors);
if (fails.length) code = 1;
fs.writeFileSync(`${dir}/res-${cmd}-${size}.json`, JSON.stringify({ size, oks, fails }, null, 2));
log('OK:', oks.join(' | '));
log(fails.length ? `FALHAS:\n- ${fails.join('\n- ')}` : 'sem falhas');
await browser.close();
process.exit(code);
