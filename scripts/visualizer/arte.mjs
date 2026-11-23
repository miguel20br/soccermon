/**
 * Capa 3000x3000 e miniatura 1280x720 do álbum (mesma linguagem do visualizer).
 *   node scripts/visualizer/arte.mjs [pasta de saída]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { RAIZ } from './render.mjs';

const out = (process.argv[2] ?? `${homedir()}/Vídeos/soccermon-album/arte`).replace(/^~/, homedir());
mkdirSync(out, { recursive: true });
const base = (w, h) => `<style>
@font-face{font-family:G14;src:url(file://${RAIZ}public/fonts/Galmuri14.woff2)}@font-face{font-family:G11;font-weight:700;src:url(file://${RAIZ}public/fonts/Galmuri11-Bold.woff2)}
*{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;color:#f4f1e6}
.f{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#2a3a7a,#070a18 75%)}
.f:before{content:"";position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(58,123,213,.18) 0 12deg,transparent 12deg 24deg)}
.q{position:absolute;border:4px solid rgba(75,90,154,.55)}.q.c{border-radius:50%}
.bars{position:absolute;display:flex;gap:10px;align-items:flex-end}
.bars i{display:block;width:30px;background:repeating-linear-gradient(to top,var(--c) 0 10px,transparent 10px 13px)}
.tag{position:absolute;font:700 1px G11}
</style>`;
// barras determinísticas: 3 ondas somadas, cor por altura como no vídeo
const barras = (n, hmax, w) => Array.from({ length: n }, (_, k) => { const v = 0.35 + 0.35 * Math.sin(k * 0.55) + 0.3 * Math.sin(k * 1.3 + 1); const h = Math.round(Math.max(0.12, Math.min(1, v)) * hmax / 13) * 13; return `<i style="height:${h}px;width:${w}px;--c:${h > hmax * 0.75 ? '#e8423f' : h > hmax * 0.5 ? '#ffcb05' : h > hmax * 0.25 ? '#58c26b' : '#3a7bd5'}"></i>`; }).join('');
const capa = `${base(1000, 1000)}<div class=f>
<div class="q" style="left:40px;top:40px;right:40px;bottom:40px"></div><div class="q" style="left:498px;top:40px;height:920px;border-width:0 0 0 4px"></div>
<div class="q c" style="left:330px;top:280px;width:340px;height:340px"></div>
<img src="file://${RAIZ}public/assets/ui/logo.svg" style="position:absolute;left:100px;top:110px;width:800px">
<div style="position:absolute;left:0;right:0;top:330px;text-align:center;font:150px/1 G14;text-shadow:10px 10px 0 #0e1430">SONGS</div>
<div style="position:absolute;left:0;right:0;top:500px;text-align:center"><span style="font:700 70px G11;letter-spacing:10px;color:#141a33;background:#ffcb05;padding:8px 40px;border-radius:12px;display:inline-block;box-shadow:8px 8px 0 #0e1430">VOL. 1</span></div>
<div style="position:absolute;left:0;right:0;top:700px;text-align:center;font:700 34px G11;letter-spacing:8px;color:#a6aed6">TRILHA ORIGINAL</div>
<div class=bars style="left:90px;right:90px;bottom:70px;height:170px;justify-content:center;gap:8px">${barras(30, 170, 24)}</div></div>`;
const mini = `${base(1280, 720)}<div class=f>
<div class="q" style="left:24px;top:24px;right:24px;bottom:24px"></div><div class="q c" style="left:480px;top:210px;width:320px;height:320px"></div>
<img src="file://${RAIZ}public/assets/ui/logo.svg" style="position:absolute;left:60px;top:60px;width:700px">
<div style="position:absolute;left:60px;top:230px;font:170px/1 G14;text-shadow:10px 10px 0 #0e1430">SONGS</div>
<div style="position:absolute;left:60px;top:430px"><span style="font:700 64px G11;letter-spacing:8px;color:#141a33;background:#ffcb05;padding:8px 32px;border-radius:10px;display:inline-block;box-shadow:8px 8px 0 #0e1430">VOL. 1</span><span style="font:700 36px G11;letter-spacing:6px;color:#f4f1e6;margin-left:36px">ÁLBUM COMPLETO</span></div>
<div class=bars style="right:60px;bottom:60px;height:220px;gap:6px">${barras(14, 220, 20)}</div></div>`;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
for (const [nome, html, w, h, s] of [['capa-3000.png', capa, 1000, 1000, 3], ['miniatura-1280x720.png', mini, 1280, 720, 1]]) {
    const hf = `${out}/.${nome}.html`;
    writeFileSync(hf, `<meta charset=utf-8>${html}`);
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: s });
    await p.goto(`file://${hf}`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/${nome}` });
}
await b.close();
console.log(`ok: ${out}`);
