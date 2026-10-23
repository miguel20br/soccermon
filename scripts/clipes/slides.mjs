/**
 * Quadros estáticos 1080x1920 dos clipes 11 e 12 da pauta (série "Simulei" e "O mais escolhido de Kanto").
 * Precisa do dev server (BASE_URL, padrão http://localhost:8091) só para as cartas e retratos; o resto é HTML local.
 *   CHROME_PATH=/usr/bin/chromium node scripts/clipes/slides.mjs <pasta de saída>
 * Saída: 11-base.png 11-final.png 12-<rank>.png 12-1-url.png 12-capa.png 11-capa.png
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const out = process.argv[2];
if (!out) throw new Error('use: node scripts/clipes/slides.mjs <pasta>');
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE_URL ?? 'http://localhost:8091';

// top 10 de escolhas nos últimos 7 dias (npm run stats -- --dias 7, 23/10/2026 01h12)
const TOP = [
    [1, 'ARCANINE', 59, 196],
    [2, 'DRAGONITE', 149, 175],
    [3, 'CHARIZARD', 6, 173],
    [4, 'DRAGONAIR', 148, 137],
    [5, 'BLASTOISE', 9, 127],
    [6, 'DITTO', 132, 108],
    [7, 'MEW', 151, 107],
    [8, 'MEWTWO', 150, 104],
    [9, 'SNORLAX', 143, 101],
    [10, 'GYARADOS', 130, 92],
];
// 5 Snorlax x 5 Pikachu, 200 partidas (scripts/simulei.ts)
const SIM = { sn: 103, pk: 97, mediaSn: '1,65', mediaPk: '2,06' };

const css = `
@font-face{font-family:G;font-weight:700;src:url(${BASE}/fonts/Galmuri11-Bold.woff2)}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;font-family:G,monospace;font-weight:700;color:#f4f1e6;text-align:center;
 background:repeating-conic-gradient(from 0deg at 50% 42%,rgba(255,255,255,.07) 0 6deg,transparent 6deg 18deg),radial-gradient(circle at 50% 42%,#2a3a7a,#070a18 78%);position:relative}
.y{color:#ffcb05;text-shadow:0 5px 0 #2a4ea0,0 0 0 #0e1430,3px 3px 0 #0e1430,-3px 3px 0 #0e1430}
.w{text-shadow:0 4px 0 #0e1430}
.abs{position:absolute;left:0;right:0}
.m{color:#a6aed6}
`;
const page_ = (body, extra = '') =>
    `<!doctype html><meta charset=utf-8><style>${css}${extra}</style><body>${body}</body>`;

const titulo11 = (top, size) =>
    `<div class="abs y" style="top:${top}px;font-size:${size}px;line-height:1.08">5 SNORLAX<br><span class="w" style="font-size:${size * 0.6}px;color:#f4f1e6">×</span><br>5 PIKACHU</div>`;
const base11 = page_(
    `${titulo11(140, 112)}<div class="abs w" style="top:1420px;font-size:54px">SIMULEI 200 PARTIDAS</div>`,
);
const final11 = page_(
    `<div class="abs y" style="top:150px;font-size:60px">200 PARTIDAS</div>
<div class="abs" style="top:290px;display:flex;justify-content:center;gap:90px">
 ${[
     ['143', 'SNORLAX', SIM.sn, '#e8423f'],
     ['25', 'PIKACHU', SIM.pk, '#ffcb05'],
 ]
     .map(
         ([id, n, v, c]) =>
             `<div style="width:380px"><img src="${BASE}/assets/portraits/${id}-determined.png" style="width:380px;height:380px;image-rendering:pixelated;object-fit:contain"><div class="w" style="font-size:52px;margin-top:10px">${n}</div><div style="font-size:150px;color:${c};text-shadow:0 6px 0 #0e1430;line-height:1.1">${v}</div><div class="m" style="font-size:40px">VITÓRIAS</div></div>`,
     )
     .join('')}
</div>
<div class="abs" style="top:1010px;padding:0 90px"><div style="display:flex;height:46px;border:4px solid #0e1430;background:#0e1430"><div style="width:${(SIM.sn / 2).toFixed(1)}%;background:#e8423f"></div><div style="flex:1;background:#ffcb05"></div></div></div>
<div class="abs w" style="top:1120px;font-size:50px">PLACAR MÉDIO</div>
<div class="abs w" style="top:1190px;font-size:96px">${SIM.mediaSn} × ${SIM.mediaPk}</div>
<div class="abs y" style="top:1440px;font-size:84px">soccermon.com</div>`,
);

const card12 = (rank, name, id, n, url, shot) => {
    const num = rank === 10 ? 10 : rank;
    return page_(
        `<div class="abs w" style="top:105px;font-size:44px">O MAIS ESCOLHIDO DE KANTO</div>
<div class="abs y" style="top:170px;font-size:230px;line-height:1">${num}</div>
<img src="${shot}" style="position:absolute;left:250px;top:400px;width:580px;image-rendering:auto;filter:drop-shadow(0 14px 0 rgba(7,10,24,.6))">
<div class="abs w" style="top:1250px;font-size:80px">${name}</div>
<div class="abs" style="top:1360px;font-size:52px;color:#ffcb05;text-shadow:0 4px 0 #0e1430">${n} ESCOLHAS</div>
<div class="abs m" style="top:1445px;font-size:36px">${url ? '' : 'ÚLTIMOS 7 DIAS'}</div>
${url ? '<div class="abs y" style="top:1445px;font-size:84px">soccermon.com</div>' : ''}`,
    );
};

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files'],
});
const pg = await browser.newPage();
const snap = async (html, file, w = 1080, h = 1920) => {
    await pg.setViewport({ width: w, height: h });
    writeFileSync(`${out}/_t.html`, html);
    await pg.goto(`file://${out}/_t.html`, { waitUntil: 'networkidle0' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: `${out}/${file}` });
};

// cartas: uma por vez na galeria do dev, screenshot do elemento a 3x
const cp = await browser.newPage();
await cp.setViewport({ width: 900, height: 900, deviceScaleFactor: 3 });
await cp.goto(`${BASE}/?cards=1&mons=${TOP.map((t) => t[2]).join(',')}`, {
    waitUntil: 'networkidle0',
    timeout: 120000,
});
await new Promise((r) => setTimeout(r, 2500));
for (const [, , id] of TOP) {
    const el = await cp.$(`[data-mon="${id}"]`);
    if (!el) throw new Error(`sem carta ${id}`);
    await el.screenshot({ path: `${out}/carta-${id}.png`, omitBackground: true });
}
await snap(base11, '11-base.png');
await snap(final11, '11-final.png');
for (const [rank, name, id, n] of TOP) {
    await snap(card12(rank, name, id, n, false, `file://${out}/carta-${id}.png`), `12-${rank}.png`);
}
await snap(card12(1, 'ARCANINE', 59, 196, true, `file://${out}/carta-59.png`), '12-1-url.png');
await browser.close();
console.log('ok', out);
