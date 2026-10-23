import fs from 'node:fs';
const pw = await import('/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs');
const [base, out, size, url, mode] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const b = await pw.chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, locale: 'pt-BR' });
await ctx.addInitScript(() => { setInterval(() => document.querySelector('.coach-skip')?.click(), 300); localStorage.setItem('soccermon-packs-opened','10'); });
const p = await ctx.newPage();
await p.goto(`${base}/${url}`, { waitUntil: 'load' });
await p.waitForTimeout(1500);
for (let k=0;k<4 && await p.locator('.ob-skip').first().isVisible().catch(()=>false);k++){await p.locator('.ob-skip').first().click();await p.waitForTimeout(400);}
if (mode === 'copa') {
  // draft rápido não: usa demo
}
await p.locator('.btn.primary.wide').first().click({timeout:20000});
await p.locator('button.vs-start:not([disabled])').waitFor({ timeout: 40000 });
await p.locator('button.vs-start:not([disabled])').click();
await p.locator('.phaser-container canvas').waitFor({ timeout: 30000 });
await p.locator('.vs-overlay').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
await p.waitForTimeout(2500);
const samples = [];
const pairs=(L,th)=>{let n=0;for(let a=0;a<L.length;a++)for(let c=a+1;c<L.length;c++){const A=L[a],B=L[c];if(A.a>th&&B.a>th&&A.x0<B.x1&&A.x1>B.x0&&A.y0<B.y1&&A.y1>B.y0)n++;}return n;};
let shots = 0;
for (let i = 0; i < 400; i++) {
  const s = await p.evaluate(() => {
    const g = window.__soccermonGame; const sc = g?.scene.getScene('Match');
    if (!sc?.players) return null;
    const L = sc.players.filter(v => v.label.visible && v.team !== undefined).map(v => {
      const bd = v.label.getBounds(); return { x0: bd.x, x1: bd.right, y0: bd.y, y1: bd.bottom, a: v.label.alpha, t: v.team, sx: v.sprite.x, sy: v.sprite.y, vis: v.sprite.visible };
    });
    return { L, compact: sc.scale.displaySize.width, ball: { x: sc.ball?.x, y: sc.ball?.y }, ev: sc.playTick };
  });
  if (s) { samples.push(s);
    const raw = pairs(s.L, 0); if (raw >= 3 && shots < 3 && i % 5 === 0) { shots++; await p.screenshot({ path: out.replace('.json', `-bolo${shots}.png`), clip: { x: 0, y: 120, width: W, height: Math.min(300, H-120) } }); } }
  if (!s) { if (i>20 && samples.length) break; }
  await p.waitForTimeout(150);
}
fs.writeFileSync(out, JSON.stringify(samples));
await p.screenshot({ path: out.replace('.json','.png') });
await b.close();
