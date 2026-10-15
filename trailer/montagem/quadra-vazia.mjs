/**
 * Abertura do trailer: dois quadros da MESMA câmera na saída de bola (ditto/trailer315, tick 0): a quadra com os
 * times e a quadra vazia só com a bola. No zoom out da composição, os jogadores "aparecem" por cima.
 *   node trailer/montagem/quadra-vazia.mjs   (precisa do npm run dev)  → midia/saida.png e midia/saida-vazia.png
 */
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const OUT = new URL('midia/', import.meta.url).pathname;
const browser = await puppeteer.launch({
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1936, height: 1452 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (re) =>
    page.evaluate((src) => {
        const b = [...document.querySelectorAll('button')].find((x) => new RegExp(src).test(x.innerText.trim()) && !x.disabled);
        b?.click();
        return !!b;
    }, re);
await page.goto('http://localhost:8080/?demo=trailer&cena=ditto&seed=trailer315', { waitUntil: 'networkidle0', timeout: 300000 });
await wait(2000);
await click('^Jogar ');
await page.addStyleTag({
    content: '.app{max-width:none!important;padding:0!important}.match-layout{grid-template-columns:1fr!important}.scoreboard,.controls,.team-panel,.feed,.topbar{display:none!important}',
});
for (let i = 0; i < 90; i++) {
    const ok = await page.evaluate(() => !!window.__soccermonGame && [...document.querySelectorAll('button')].some((b) => /^Começar/.test(b.innerText.trim()) && !b.disabled));
    if (ok) break;
    await wait(1000);
}
await page.evaluate(() => {
    const g = window.__soccermonGame;
    const sc = g.scene.getScene('Match');
    sc.battleBox?.container?.setVisible(false);
    g.loop.sleep();
    window.__t = g.loop.now || performance.now();
});
await click('^Começar');
const step = () =>
    page.evaluate(() => {
        window.__t += 1000 / 30;
        for (const v of window.__soccermonGame.scene.getScene('Match').players) v.label?.setAlpha(0);
        window.__soccermonGame.step(window.__t, 1000 / 30);
    });
for (let i = 0; i < 2; i++) await step();
const shot = async (nome) => {
    const url = await page.evaluate(() => document.querySelector('.pitch-wrap canvas').toDataURL('image/png'));
    writeFileSync(`${OUT}${nome}`, Buffer.from(url.split(',')[1], 'base64'));
};
await shot('saida.png');
// some com tudo que é de jogador (sprite, sombra, anel, setinha, nome): sobra a quadra e a bola
await page.evaluate(() => {
    const sc = window.__soccermonGame.scene.getScene('Match');
    for (const v of sc.players)
        for (const o of Object.values(v)) if (o && typeof o.setAlpha === 'function') o.setAlpha(0);
    // o sprite animado do Pokémon fica direto na cena: some com todo Sprite (a quadra é desenho, a bola é Image)
    // (o jogo reajusta alpha/visible dos sprites a cada quadro: desliga o desenho deles direto)
    for (const o of sc.children.list) if (o.type === 'Sprite') o.willRender = () => false;
    window.__t += 1;
    window.__soccermonGame.step(window.__t, 1);
});
await shot('saida-vazia.png');
const sc_tipos = await page.evaluate(() => { const m = {}; for (const o of window.__soccermonGame.scene.getScene('Match').children.list) m[o.type] = (m[o.type] ?? 0) + 1; return JSON.stringify(m); });
console.log(sc_tipos);
console.log('FIM');
await browser.close();
