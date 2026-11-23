/**
 * Capa 3000x3000 e miniatura 1280x720 v2: uma cena de pixel art (ginásio de futsal lotado, bola no ar) + logo e placa.
 *   node scripts/visualizer/arte2.mjs [pasta de saída]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { Pix, hex, humano, mix, rnd, sprite } from './pix.mjs';
import { RAIZ } from './render.mjs';

const out = (process.argv[2] ?? `${homedir()}/Vídeos/soccermon-album/arte-v2`).replace(/^~/, homedir());
mkdirSync(out, { recursive: true });
const COR = [hex('#e8423f'), hex('#ffcb05'), hex('#3a7bd5'), hex('#58c26b')];
const PELE = [hex('#e8b48a'), hex('#c89a78'), hex('#8a5a3a'), hex('#f2c9a0')];

function cena(w, h) {
    const P = new Pix(w, h), r = rnd(11), hz = Math.round(h * 0.6);
    P.grad(0, hz, hex('#050712'), hex('#2a3a7a'));
    // refletores: cones de luz do teto
    for (const [x, d] of [[0.12, 1], [0.88, -1], [0.5, 0]]) {
        const cx = w * x, spread = w * 0.22;
        P.poly([[cx - 2, 0], [cx + 2, 0], [cx + d * w * 0.1 + spread, hz], [cx + d * w * 0.1 - spread, hz]], hex('#dbe2f2'), 0.10);
        P.circle(Math.round(cx), 3, 4, hex('#f4f1e6'));
    }
    // arquibancada: fileiras de torcedores (camisas nas 4 cores, braços pro alto)
    const rows = Math.round(h * 0.052), y0 = Math.round(h * 0.26), pitch = Math.round((hz - y0) / rows * 1.0);
    for (let row = 0; row < rows; row++) {
        const y = y0 + row * pitch, sc = 0.7 + row / rows * 0.6, step = Math.round(w / (20 + row * 1.2));
        P.rect(0, y + pitch - 1, w, 2, hex('#0a0d1c'));
        for (let x = (row % 2) * (step >> 1); x < w; x += step) {
            const cor = COR[Math.floor(r() * 4)], pele = PELE[Math.floor(r() * 4)], up = r() < 0.42;
            const bw = Math.max(3, Math.round(step * 0.7));
            P.rect(x, y + 3, bw, pitch - 2, mix(cor, [0, 0, 0], 0.15 + (1 - sc) * 0.3));
            P.circle(x + (bw >> 1), y + 1, 1, pele);
            if (up) { P.rect(x - 1, y - 3, 1, 5, pele); P.rect(x + bw, y - 3, 1, 5, pele); }
        }
    }
    P.rect(0, hz - 4, w, 4, hex('#141a33')); P.rect(0, hz - 5, w, 1, hex('#4b5a9a'));
    // quadra azul em perspectiva
    P.grad(hz, h, hex('#1b3a86'), hex('#2f5fc0'));
    for (let i = 0; i < 9; i++) { const y = hz + Math.pow(i / 9, 1.8) * (h - hz); P.rect(0, Math.round(y), w, 1, hex('#1a3478'), 0.7); }
    const cx = w / 2, cy = hz + (h - hz) * 0.58, rx = w * 0.28, ry = (h - hz) * 0.22, L = hex('#f4f1e6');
    for (let a = 0; a < 720; a++) { const t = (a / 720) * Math.PI * 2; P.px(cx + rx * Math.cos(t), cy + ry * Math.sin(t), L, 0.9); }
    P.line(cx, hz + 2, cx, h, L, 1, 0.85);
    P.poly([[w * 0.06, h], [w * 0.2, hz + 2], [w * 0.8, hz + 2], [w * 0.94, h]], L, 0); // contorno só abaixo
    P.line(w * 0.2, hz + 2, w * 0.06, h, L, 1, 0.85); P.line(w * 0.8, hz + 2, w * 0.94, h, L, 1, 0.85);
    // bola no ar com sombra e riscos de movimento
    const br = Math.round(w * 0.085), bx = Math.round(cx), by = Math.round(h * 0.47);
    P.circle(bx, Math.round(cy + ry * 0.2), Math.round(br * 0.9), [0, 0, 0], 0.0);
    for (let k = -br; k <= br; k++) P.px(bx + k, Math.round(cy + ry * 0.35 + Math.abs(k) * 0.0), [0, 0, 0], 0.0);
    for (let y = -3; y <= 3; y++) for (let x = -br; x <= br; x++) if ((x * x) / (br * br) + (y * y) / 9 <= 1) P.px(bx + x, Math.round(cy + ry * 0.45) + y, hex('#0e1430'), 0.35);
    for (let i = 0; i < 5; i++) P.line(bx - br - 6 - i * 4, by - br + i * 6 + 6, bx - br - 14 - i * 5, by - br + i * 6 + 6, hex('#dbe2f2'), 1, 0.6 - i * 0.1);
    P.circle(bx, by, br, hex('#dbe2f2')); P.circle(bx - 1, by - 1, br - 1, [255, 255, 255]);
    const ink = hex('#0e1430');
    P.circle(bx, by, Math.round(br * 0.34), ink);
    for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2 - 1.2; P.line(bx + Math.cos(t) * br * 0.34, by + Math.sin(t) * br * 0.34, bx + Math.cos(t) * br * 0.9, by + Math.sin(t) * br * 0.9, ink, 1); P.circle(Math.round(bx + Math.cos(t + 0.63) * br * 0.9), Math.round(by + Math.sin(t + 0.63) * br * 0.9), Math.max(2, Math.round(br * 0.2)), ink); }
    P.circle(bx, by, Math.max(1, Math.round(br * 0.14)), hex('#ffcb05'));
    // dois jogadores comemorando (humanos genéricos), em primeiro plano
    const esc = h / 200;
    for (const [px, jer, str, dir] of [[w * 0.09, COR[0], [244, 241, 230], 1], [w * 0.91, COR[1], hex('#0e1430'), -1]]) {
        P.rect(Math.round(px - 12 * esc), Math.round(h * 0.93), Math.round(24 * esc), 2, [0, 0, 0], 0.3);
        P.blit(humano({ jersey: jer, stripe: str, shorts: hex('#232d57'), hair: hex('#3a2418'), armL: 2.9, armR: 2.9, mouth: true, legs: dir * 0.6 }), Math.round(px), Math.round(h * 0.94), { px: 24, py: 60, sx: esc, sy: esc, flip: dir < 0 });
    }
    // confete
    for (let i = 0; i < Math.round(w * 0.5); i++) P.rect(Math.floor(r() * w), Math.floor(r() * hz), 1 + (r() < 0.3 ? 1 : 0), 1, COR[Math.floor(r() * 4)], 0.9);
    for (let i = 0; i < 5; i++) P.rect(0, i * 2, w, 2, [0, 0, 0], 0.5 - i * 0.1);
    return P;
}
function png(P, W, H, arq) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${P.w}x${P.h}`, '-i', '-', '-vf', `scale=${W}:${H}:flags=neighbor`, arq], { input: P.b });
}
const fonte = `<style>@font-face{font-family:G14;src:url(file://${RAIZ}public/fonts/Galmuri14.woff2)}@font-face{font-family:G11;font-weight:700;src:url(file://${RAIZ}public/fonts/Galmuri11-Bold.woff2)}*{box-sizing:border-box}html,body{margin:0;overflow:hidden;color:#f4f1e6}</style>`;
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
async function monta(nome, W, H, s, fundo, html) {
    writeFileSync(`${out}/.${nome}.html`, `<meta charset=utf-8>${fonte}<style>html,body{width:${W / s}px;height:${H / s}px}</style><div style="position:relative;width:${W / s}px;height:${H / s}px;background:url(file://${fundo}) 0 0/100% 100%;image-rendering:pixelated">${html}</div>`);
    const p = await b.newPage(); await p.setViewport({ width: W / s, height: H / s, deviceScaleFactor: s });
    await p.goto(`file://${out}/.${nome}.html`, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/${nome}` });
}
png(cena(250, 250), 3000, 3000, `${out}/.fundo-capa.png`);
await monta('capa-3000.png', 3000, 3000, 3, `${out}/.fundo-capa.png`, `
<img src="file://${RAIZ}public/assets/ui/logo.svg" style="position:absolute;left:100px;top:70px;width:800px">
<div style="position:absolute;left:50%;bottom:110px;white-space:nowrap;font:700 60px G11;letter-spacing:10px;color:#141a33;background:#ffcb05;padding:10px 34px;border-radius:12px;box-shadow:8px 8px 0 #0e1430;transform:translateX(-50%) rotate(-2deg)">SONGS VOL. 1</div>`);
png(cena(320, 180), 1280, 720, `${out}/.fundo-mini.png`);
await monta('miniatura-1280x720.png', 1280, 720, 1, `${out}/.fundo-mini.png`, `
<img src="file://${RAIZ}public/assets/ui/logo.svg" style="position:absolute;left:50px;top:36px;width:640px">
<div style="position:absolute;left:56px;top:176px;font:700 56px G11;letter-spacing:8px;color:#141a33;background:#ffcb05;padding:8px 28px;border-radius:10px;box-shadow:7px 7px 0 #0e1430">SONGS VOL. 1</div>
<div style="position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;bottom:34px;font:700 34px G11;letter-spacing:5px;color:#f4f1e6;text-shadow:4px 4px 0 #0e1430">ÁLBUM COMPLETO</div>`);
await b.close();
console.log(`ok: ${out}`);
