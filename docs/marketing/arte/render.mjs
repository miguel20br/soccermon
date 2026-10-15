/**
 * Renderiza as peças de arte.html em PNG (e a prévia do link em public/og-image.jpg).
 *   node docs/marketing/arte/render.mjs
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const aqui = new URL('.', import.meta.url);
const out = fileURLToPath(new URL('../', aqui));
const b = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files'],
});
const p = await b.newPage();
await p.setViewport({ width: 2000, height: 1200 });
for (const lang of ['pt', 'en']) {
    await p.goto(`${new URL('arte.html', aqui).href}?lang=${lang}`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    const L = lang.toUpperCase();
    const pecas = [
        ['capa16', `capa-${L}-16x9.png`],
        ['capa9', `capa-${L}-9x16.png`],
        ['og', `og-${L}.png`],
        ...(lang === 'pt' ? [['avatar', 'avatar.png'], ['banner', 'banner-x.png']] : []),
    ];
    for (const [id, nome] of pecas) {
        const el = await p.$(`#${id}`);
        await el.screenshot({ path: `${out}${nome}` });
        console.log('ok', nome);
    }
}
await b.close();
// prévia do link do site (og:image, 1200x630): a versão PT em JPG
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${out}og-PT.png`, '-q:v', '3', fileURLToPath(new URL('../../../public/og-image.jpg', aqui))]);
console.log('ok public/og-image.jpg');
