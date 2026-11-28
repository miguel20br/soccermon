#!/usr/bin/env node
// Escalação (Lineup, ?demo=vestiario): as vagas da quadra não podem se sobrepor em 320x568, 390x844 e 844x390.
// Uso: node scripts/prancheta-vagas.mjs <base, ex. http://localhost:8099> [pasta-de-prints prefixo]
const NPX = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX));
const base = process.argv[2] ?? 'http://localhost:8099';
const shot = process.argv[3]; // ex. ".../12-prancheta-antes" -> "...-320x568.png"
const bad = [];
const b = await pw.chromium.launch({ headless: true });
for (const [w, h] of [
    [320, 568],
    [390, 844],
    [844, 390],
]) {
    const p = await (
        await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })
    ).newPage();
    await p.goto(`${base}/?demo=vestiario&vel=8`);
    await p.waitForSelector('.court .slot', { timeout: 30000 });
    await p.waitForTimeout(1500);
    if (shot) await p.screenshot({ path: `${shot}-${w}x${h}.png` });
    const boxes = await p.$$eval('.court .slot', (els) =>
        els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.top, r.right, r.bottom]),
    );
    const hits = [];
    for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
            const [a, c] = [boxes[i], boxes[j]];
            if (a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3]) hits.push(`${i}x${j}`);
        }
    console.log(`${w}x${h}: ${hits.length ? `SOBREPÕE ${hits}` : 'ok'} (${boxes.length} vagas)`);
    if (hits.length) bad.push(`${w}x${h}`);
    await p.context().close();
}
await b.close();
if (bad.length) {
    console.error('falhou:', bad.join(', '));
    process.exit(1);
}
