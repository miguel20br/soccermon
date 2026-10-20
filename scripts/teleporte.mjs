#!/usr/bin/env node
// Conferência do "nada teleporta" (docs/planos/nada-teleporta.md), como o `pnpm teleporte` do Tutti. Headless: abre
// as telas, toca em cada aba, seletor e botão de abrir, e acusa o que APARECE, SOME ou PULA sem animação.
//   node scripts/teleporte.mjs <base> [LxA]        (npm run teleporte -- http://localhost:8080)
// Heurística (pode dar falso positivo): conta como animado o que tem animação/transição rodando nele ou num pai, ou
// uma View Transition na tela. Sai com 1 se achou algo; a lista vai pro console. Ainda não roda no CI.
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const [base = 'http://localhost:8080', size = '390x844'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);

// telas (url) e o que tocar nelas (seletores; cada elemento achado é tocado uma vez, Esc depois)
const PAGES = [
    ['/?demo=colecao&motion=1', ['[role=tab]', '.pf-public']],
    ['/?demo=sala&motion=1', ['.tr-summary .btn']],
    ['/?demo=album&motion=1', ['[role=tab]']],
    ['/?demo=amigos&motion=1', ['.fr-open', '.fr-more']],
    ['/?demo=dia&motion=1', ['.bc-seg button']],
];

/** Roda dentro da página: vigia o que aparece, some e pula. */
function watch() {
    const events = [];
    const name = (el) =>
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList]
            .slice(0, 3)
            .map((c) => `.${c}`)
            .join('')}`;
    const vt = () =>
        document.getAnimations().some((a) => String(a.effect?.pseudoElement ?? '').startsWith('::view-transition'));
    const moving = (el) => {
        for (let e = el; e; e = e.parentElement)
            if (e.getAnimations().some((a) => a.playState === 'running')) return true;
        return vt();
    };
    const big = (r) => r.width > 24 && r.height > 16;
    new MutationObserver((list) => {
        for (const m of list) {
            for (const n of m.addedNodes) {
                if (!(n instanceof HTMLElement) || n.classList.contains('is-leaving')) continue;
                requestAnimationFrame(() => {
                    if (n.isConnected && big(n.getBoundingClientRect()) && !moving(n))
                        events.push({ kind: 'aparece', el: name(n) });
                });
            }
            for (const n of m.removedNodes) {
                if (!(n instanceof HTMLElement) || n.classList.contains('is-leaving')) continue;
                const ghost = [...m.addedNodes, ...m.target.children].some((c) => c.classList?.contains('is-leaving'));
                // a aba nova entra com fade no lugar da velha (decidido): troca de conteúdo de aba não conta
                const tab = m.target.closest?.('[role=tabpanel]');
                if (!ghost && !tab && n.matches('.modal-backdrop, [role=dialog], section, li, .panel') && !vt())
                    events.push({ kind: 'some', el: name(n) });
            }
        }
    }).observe(document.body, { childList: true, subtree: true });
    // pulo: o mesmo elemento muda de lugar de um quadro pro outro sem nada animando (nem ele, nem algo da página que
    // mexe no layout, como uma linha abrindo a altura; laço infinito de enfeite não conta)
    const pos = new WeakMap();
    const layoutMoving = () =>
        document
            .getAnimations()
            .some(
                (a) =>
                    a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY,
            );
    const tick = () => {
        const busy = layoutMoving();
        for (const el of document.querySelectorAll('button, .panel, li, h1, h2, .slot, .tr-obj')) {
            const r = el.getBoundingClientRect();
            const p = [r.left + scrollX, r.top + scrollY];
            const old = pos.get(el);
            if (old && !busy && Math.hypot(p[0] - old[0], p[1] - old[1]) > 6 && big(r) && !moving(el))
                events.push({ kind: 'pula', el: name(el) });
            pos.set(el, p);
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__teleporte = events;
}

const browser = await pw.chromium.launch({ headless: true });
const found = [];
for (const [url, sels] of PAGES) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, locale: 'pt-BR' });
    await page.addInitScript(() => localStorage.setItem('soccermon-onboarded', '1'));
    await page.goto(base + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.evaluate(watch);
    for (const sel of sels) {
        const n = await page.locator(sel).count();
        for (let i = 0; i < n; i++) {
            const el = page.locator(sel).nth(i);
            if (!(await el.isVisible().catch(() => false))) continue;
            const label = `${url} ${sel}[${i}]`;
            await page.evaluate(() => {
                window.__teleporte.length = 0;
            });
            await el.click({ timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(450);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(350);
            const ev = await page.evaluate(() => window.__teleporte.splice(0));
            const uniq = [...new Set(ev.map((e) => `${e.kind} ${e.el}`))];
            for (const u of uniq) found.push(`${label}: ${u}`);
        }
    }
    await page.close();
}
await browser.close();
if (found.length) {
    console.log(`${found.length} teleporte(s):\n${found.join('\n')}`);
    process.exit(1);
}
console.log('ok: nada teleporta');
