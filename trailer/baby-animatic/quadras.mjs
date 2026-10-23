// Tira as quadras dos ginásios do jogo (?lab=quadras, o mesmo drawCourt da partida) pra midia/quadra-<n>.png.
//   BASE_URL=http://localhost:8137 node trailer/baby-animatic/quadras.mjs   (precisa do dev server)
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const OUT = new URL('midia/', import.meta.url).pathname;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.goto(`${process.env.BASE_URL ?? 'http://localhost:8137'}/?lab=quadras`, { waitUntil: 'networkidle0', timeout: 300000 });
await p.waitForSelector('.court-card-img img', { timeout: 120000 });
const imgs = await p.$$eval('.court-card', (cs) => cs.map((c) => ({ nome: c.querySelector('header b')?.textContent, quem: c.querySelector('header small')?.textContent, src: c.querySelector('.court-card-img img')?.src })));
imgs.forEach((x, i) => {
    if (!x.src?.startsWith('data:')) return;
    writeFileSync(`${OUT}quadra-${i}.png`, Buffer.from(x.src.split(',')[1], 'base64'));
    console.log(i, x.nome, '·', x.quem);
});
await b.close();
