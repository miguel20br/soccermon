#!/usr/bin/env node
// Celular deitado pequeno: na recompensa os botões de escolher e, no intervalo, os botões do painel têm que estar
// dentro da tela (sem rolar). Uso: node scripts/deitado.mjs <base, ex. http://localhost:8099>  (dev ou prévia, tem ?demo=)

const NPX = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX));
const base = process.argv[2] ?? 'http://localhost:8099';
const bad = [];
const b = await pw.chromium.launch({ headless: true });
for (const [w, h] of [
    [568, 320],
    [667, 375],
    [740, 360],
]) {
    for (const tela of ['recompensa', 'intervalo']) {
        const p = await (
            await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })
        ).newPage();
        await p.goto(`${base}/?demo=${tela === 'recompensa' ? 'mt' : 'vestiario&vel=8'}`);
        let sel;
        if (tela === 'recompensa') {
            await p.locator('.cpack-btn').click({ timeout: 15000 });
            await p.waitForTimeout(5000);
            await p.evaluate(() => scrollTo(0, 0));
            sel = '.reward-grid .fut-action';
        } else {
            await p
                .getByRole('button', { name: /back to the match|voltar à partida|voltar pra partida/i })
                .first()
                .click({ timeout: 30000 });
            await p.waitForSelector('.ht-panel', { timeout: 60000 });
            await p.waitForTimeout(1000);
            sel = '.ht-actions .btn';
        }
        const boxes = await p.$$eval(sel, (els) =>
            els.map((e) => e.getBoundingClientRect()).map((r) => [r.top, r.bottom, r.left, r.right]),
        );
        // a barra de baixo (~62 px) cobre o pé da tela
        const ok = boxes.length > 0 && boxes.every(([t, bt, l, r]) => t >= 0 && bt <= h - 62 && l >= 0 && r <= w);
        console.log(
            `${w}x${h} ${tela}: ${ok ? 'ok' : 'FORA DA TELA'}`,
            JSON.stringify(boxes.map((x) => x.map(Math.round))),
        );
        if (!ok) bad.push(`${w}x${h} ${tela}`);
        await p.context().close();
    }
}
await b.close();
if (bad.length) {
    console.error('falhou:', bad.join(', '));
    process.exit(1);
}
