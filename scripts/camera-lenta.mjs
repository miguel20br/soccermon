#!/usr/bin/env node
// Câmera lenta do golpe máximo, medida no navegador sem janela (Miguel, 08/11/2026: "o golpe especial do inimigo também
// tem que ficar em câmera lenta"). Precisa do dev server (só no dev o jogo fica em window.__soccermonGame). O loop do
// Phaser fica parado e cada quadro anda 1/60 s (`game.step`, como o trailer-capture.mjs), então os números não dependem
// da máquina; só o bullet time do botão (relógio real) varia um pouco.
//   node scripts/camera-lenta.mjs <base> <rival|nosso> [vel] [n] [pasta-de-prints]
//   ex.: node scripts/camera-lenta.mjs http://localhost:8137 rival 8 1
// rival: pula até o n-ésimo golpe máximo do rival na partida do ?demo=maximo&k=2 (n=0 N3, n=1 N2) e mede.
// nosso: joga até o botão acender e aperta M, como o jogador. Saída por golpe (ms de tela): `chegada` (os 12 ticks
// antes do chute), `carga` (quadra parada no pé dele) e `voo` (os 20 ticks depois do chute, sem a carga).
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const pw = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const { mkdirSync, writeFileSync } = await import('node:fs');
const [base = 'http://localhost:8080', alvo = 'rival', vel = '8', nth = '0', out] = process.argv.slice(2);
const DT = 1000 / 60;

const browser = await pw.chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'pt-BR' });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${base}/?demo=maximo&k=2`, { waitUntil: 'load' });
await page.getByRole('button', { name: /Voltar pra partida/ }).click({ timeout: 120000 });
await page.waitForFunction(
    () => {
        const sc = window.__soccermonGame?.scene.getScene('Match');
        return sc?.sys.isActive() && sc.snaps?.length > 0;
    },
    null,
    { timeout: 60000 },
);
await page.waitForTimeout(1500);
const hitsNow = () =>
    page.evaluate(() => {
        const sc = window.__soccermonGame.scene.getScene('Match');
        const hits = sc.matchEvents
            .filter((e) => e.type === 'max' && e.phase === 'hit')
            .map((e) => ({ tick: e.tick, rival: sc.players[e.by].team !== sc.mine, level: e.level }));
        return { tick: sc.playTick, hits };
    });
const start = await hitsNow();
await page.evaluate((v) => {
    const g = window.__soccermonGame;
    window.__soccermonBus.emit('match:set-speed', v);
    g.loop.sleep();
    window.__t = g.loop.now || performance.now();
}, Number(vel));
if (alvo === 'rival') {
    const h = start.hits.filter((x) => x.tick > start.tick && x.rival)[Number(nth)];
    if (!h) throw new Error('sem golpe máximo do rival à frente');
    await page.evaluate((t) => window.__soccermonGame.scene.getScene('Match').seekTo(t), h.tick - 60);
}
if (out) mkdirSync(out, { recursive: true });
const frames = [];
let hit = null;
let shots = 0;
for (let i = 0; i < 60 * 150; i++) {
    const near = hit && hit.tick - frames.at(-1).tick < 25;
    const f = await page.evaluate(
        ({ d, grab }) => {
            const g = window.__soccermonGame;
            const sc = g.scene.getScene('Match');
            window.__t += d;
            g.step(window.__t, d);
            return {
                tick: sc.playTick,
                hold: sc.maxHold,
                img: grab ? document.querySelector('canvas').toDataURL('image/png') : null,
            };
        },
        { d: DT, grab: !!out && near && i % 4 === 0 },
    );
    if (f.img)
        writeFileSync(`${out}/${String(++shots).padStart(4, '0')}.png`, Buffer.from(f.img.split(',')[1], 'base64'));
    frames.push({ ms: i * DT, tick: f.tick, hold: f.hold });
    // o botão aceso: aperta M como o jogador
    if (alvo === 'nosso' && !hit && i % 3 === 0) {
        const lit = await page.evaluate(
            () => !!document.querySelector('[aria-keyshortcuts="M"][aria-disabled="false"]'),
        );
        if (lit) await page.keyboard.press('m');
    }
    if (!hit && i % 10 === 0)
        hit = (await hitsNow()).hits.find((x) => x.tick >= frames[0].tick && x.rival === (alvo === 'rival')) ?? null;
    if (hit && f.tick > hit.tick + 20) break;
}
await browser.close();
if (!hit) throw new Error('o golpe máximo não saiu');
const at = (tick) => frames.find((f) => f.tick >= tick).ms;
const t0 = at(hit.tick);
const t20 = at(hit.tick + 20);
const carga = frames.filter((f) => f.ms >= t0 && f.ms <= t20 && f.hold).length * DT;
console.log(
    JSON.stringify({
        alvo,
        vel: Number(vel),
        nivel: hit.level,
        tick: hit.tick,
        chegada_ms: Math.round(t0 - at(hit.tick - 12)),
        carga_ms: Math.round(carga),
        voo_ms: Math.round(t20 - t0 - carga),
    }),
);
