/**
 * Gravação quadro a quadro de um lance pro trailer (docs/planos/trailer-plano.md). Precisa do `npm run dev`.
 *
 * O loop do Phaser fica parado e cada quadro avança o jogo com `game.step(t, 1000/fps)` (window.__soccermonGame,
 * só no dev). Assim
 * o vídeo sai liso e exato mesmo em máquina lenta. Grava PNGs do canvas da quadra em --out.
 *
 *   node scripts/trailer-capture.mjs --cena golpe --seed trailer26 --de 126 --ate 134 --out trailer/clips/golpe
 *
 * --de/--ate: segundos de partida (os da caça). --vel: velocidade de reprodução (1 = normal). --largura: px.
 * CHROME_PATH aponta o Chromium/Chrome; BASE_URL o servidor de dev (padrão http://localhost:8080).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const cena = arg('--cena');
const seed = arg('--seed');
const from = Number(arg('--de', 0));
const to = Number(arg('--ate', from + 6));
const fps = Number(arg('--fps', 30));
const speed = Number(arg('--vel', 1));
const width = Number(arg('--largura', 1920));
const out = arg('--out', `trailer/clips/${cena}-${seed}`);
if (!cena || !seed) throw new Error('use --cena e --seed (veja scripts/trailer-hunt.ts)');

const TICK_RATE = 20; // FUTSAL_5.tickRate
const DT = 1000 / fps;
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser',
    headless: true,
    args: [
        '--no-sandbox',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--autoplay-policy=no-user-gesture-required',
    ],
    protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.setViewport({ width, height: Math.round(width * 0.75) });
page.on('pageerror', (e) => console.log('[página]', e.message));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (re) =>
    page.evaluate((src) => {
        const b = [...document.querySelectorAll('button')].find(
            (x) => new RegExp(src).test(x.innerText.trim()) && !x.disabled && x.getBoundingClientRect().width > 0,
        );
        b?.click();
        return !!b;
    }, re);

await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/?demo=trailer&cena=${cena}&seed=${seed}`, {
    waitUntil: 'networkidle0',
    timeout: 300000,
});
await wait(2000);
if (!(await click('^Jogar '))) throw new Error('não achei o botão Jogar (o atalho ?demo=trailer abriu?)');
// quadra ocupando a largura toda (sem barra lateral), pra gravar na resolução pedida
await page.addStyleTag({
    content:
        '.app{max-width:none!important;padding:0!important}.match-layout{grid-template-columns:1fr!important}.scoreboard,.controls,.team-panel,.feed,.topbar{display:none!important}',
});
for (let i = 0; i < 90 && !(await click('^Começar')); i++) await wait(1000);
await wait(1000);

// tick atual da partida (eventos do Phaser) e controles do jogo
await page.evaluate(() => {
    window.__tick = 0;
    window.__soccermonBus.on('match:tick', (t) => {
        window.__tick = t.tick;
    });
});
const tick = () => page.evaluate(() => window.__tick);
await page.evaluate(() => {
    const g = window.__soccermonGame;
    g.loop.sleep();
    window.__t = g.loop.now || performance.now();
});
const step = (dt) =>
    page.evaluate((d) => {
        window.__t += d;
        window.__soccermonGame.step(window.__t, d);
    }, dt);

// 1) avança rápido até o começo do lance (8x, sem gravar)
await page.evaluate(() => window.__soccermonBus.emit('match:set-speed', 8));
const t0 = Date.now();
while ((await tick()) < from * TICK_RATE) await step(DT);
console.log(`no ponto: tick ${(await tick()).toFixed(0)} (${((Date.now() - t0) / 1000).toFixed(0)} s pra chegar)`);

// 2) grava quadro a quadro na velocidade pedida, direto do canvas do Phaser (resolução nativa do jogo; o print da
// página trava com o tempo parado). As faixas em HTML (gol, evolução) ficam de fora: no trailer o texto é da composição.
await page.evaluate((v) => window.__soccermonBus.emit('match:set-speed', v), speed);
let n = 0;
const t1 = Date.now();
while ((await tick()) < to * TICK_RATE) {
    await step(DT);
    const url = await page.evaluate(() => document.querySelector('.pitch-wrap canvas').toDataURL('image/png'));
    writeFileSync(`${out}/${String(++n).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
console.log(`${n} quadros (${(n / fps).toFixed(1)} s de vídeo) em ${((Date.now() - t1) / 1000).toFixed(0)} s → ${out}`);
console.log(
    `juntar (2x, pixel nítido): ffmpeg -framerate ${fps} -i ${out}/%05d.png -vf scale=iw*2:ih*2:flags=neighbor -c:v libx264 -crf 14 -pix_fmt yuv420p ${out}.mp4`,
);
await browser.close();
