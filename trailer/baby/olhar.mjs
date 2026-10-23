import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'], env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' } });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 960 });
p.on('pageerror', e => console.log('[pg]', e.message)); p.on('console', m => console.log('[c]', m.text().slice(0,200)));
await p.goto(process.argv[2], { waitUntil: 'networkidle0', timeout: 300000 });
await new Promise(r => setTimeout(r, 3000));
console.log(await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).join(' | ')));
await p.screenshot({ path: process.argv[3] });
await b.close();
