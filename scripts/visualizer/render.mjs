/**
 * Visualizer de uma faixa: WAV -> MP4 1920x1080 30 fps (YouTube).
 *   node scripts/visualizer/render.mjs <wav> --titulo "Fiado, só amanhã" --n 7 [--saida x.mp4] [--inicio 20 --dur 30]
 * Pixel art em 480x270 (nearest x4) + placa de texto em PNG (Chromium, Galmuri). Sem Pokémon.
 * Pesado: rode por scripts/pesado.sh.
 */
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const W = 480, H = 270, FPS = 30, NB = 40, SR = 44100, NFFT = 2048;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const COR = { blue: hex('#3a7bd5'), green: hex('#58c26b'), yellow: hex('#ffcb05'), red: hex('#e8423f'), text: hex('#f4f1e6'),
    ink: hex('#0e1430'), panel: hex('#232d57'), line: hex('#4b5a9a') };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Espectro (NB bandas 0..1) e volume (0..1) por quadro. */
export function analisar(wav, inicio, dur) {
    const args = ['-v', 'error', ...(inicio ? ['-ss', String(inicio)] : []), ...(dur ? ['-t', String(dur)] : []), '-i', wav, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'];
    const b = execFileSync('ffmpeg', args, { maxBuffer: 1 << 30 });
    const x = new Float32Array(b.buffer, b.byteOffset, b.length >> 2);
    const nq = Math.floor((x.length / SR) * FPS);
    const edges = Array.from({ length: NB + 1 }, (_, i) => 40 * (16000 / 40) ** (i / NB));
    const df = SR / NFFT;
    const hann = Float32Array.from({ length: NFFT }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NFFT));
    const re = new Float32Array(NFFT), im = new Float32Array(NFFT);
    const db = [], rms = [];
    for (let q = 0; q < nq; q++) {
        const c = Math.floor(((q + 0.5) / FPS) * SR) - NFFT / 2;
        let s2 = 0;
        for (let i = 0; i < NFFT; i++) { const v = x[c + i] ?? 0; re[i] = v * hann[i]; im[i] = 0; if (i < 1470) s2 += v * v; }
        rms.push(Math.sqrt(s2 / 1470));
        fft(re, im);
        const row = new Float32Array(NB);
        for (let k = 0; k < NB; k++) {
            const a = Math.floor(edges[k] / df), z = Math.max(Math.ceil(edges[k + 1] / df), a + 1);
            let m = 0;
            for (let i = a; i <= z; i++) m = Math.max(m, Math.hypot(re[i], im[i]) / NFFT);
            row[k] = 20 * Math.log10(m + 1e-9) + k * 0.35; // inclinação: realça agudos
        }
        db.push(row);
    }
    const todos = db.flatMap((r) => [...r]).sort((p, q) => p - q);
    const topo = todos[Math.floor(todos.length * 0.98)], piso = topo - 40;
    const rs = [...rms].sort((p, q) => p - q), rtopo = rs[Math.floor(rs.length * 0.95)] || 1;
    return { n: nq, dur: x.length / SR, bandas: db.map((r) => r.map((v) => Math.min(1, Math.max(0, (v - piso) / (topo - piso))) ** 1.8)), vol: rms.map((v) => Math.min(1, v / rtopo)) };
}

function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const a = i + k, b = a + len / 2;
                const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
                re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
                const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
            }
        }
    }
}

/** Placa de texto (PNG transparente 1920x1080) com Galmuri, logo e título. */
async function placa(titulo, n, png) {
    const fonte = `file://${RAIZ}public/fonts/`;
    const t = titulo.toUpperCase();
    const tam = Math.min(104, Math.floor(1440 / (t.length * 0.95)));
    const html = `<style>
@font-face{font-family:G14;src:url(${fonte}Galmuri14.woff2)}@font-face{font-family:G11;font-weight:700;src:url(${fonte}Galmuri11-Bold.woff2)}
html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden;color:#f4f1e6;font-family:G11}
.logo{position:absolute;left:60px;top:44px;width:520px}
.tag{position:absolute;right:60px;top:60px;font:700 30px G11;letter-spacing:3px;color:#a6aed6;text-align:right}
.tag b{color:#ffcb05;font-weight:700}
.placa{position:absolute;left:180px;right:180px;top:250px;height:290px;background:#141a33;border:6px solid #4b5a9a;border-radius:10px;box-shadow:10px 10px 0 #0e1430;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:28px}
.faixa{font:700 30px G11;letter-spacing:6px;color:#141a33;background:#ffcb05;padding:6px 22px;border-radius:6px}
.tit{font:${tam}px G14;text-shadow:6px 6px 0 #0e1430;white-space:nowrap}
.fim{position:absolute;left:60px;top:1040px;font:700 24px G11;letter-spacing:3px;color:#a6aed6}
</style><img class=logo src="file://${RAIZ}public/assets/ui/logo.svg">
<div class=tag>SOCCERMON SONGS <b>VOL. 1</b></div>
<div class=placa><div class=faixa>FAIXA ${String(n).padStart(2, '0')}</div><div class=tit>${t.replace(/&/g, '&amp;')}</div></div>`;
    const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
    const p = await b.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    const hf = `${png}.html`;
    writeFileSync(hf, `<meta charset=utf-8>${html}`);
    await p.goto(`file://${hf}`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: png, omitBackground: true });
    await b.close();
}

export async function renderFaixa({ wav, titulo, n, saida, inicio = 0, dur = 0 }) {
    const an = analisar(wav, inicio, dur);
    const tmp = mkdtempSync(`${tmpdir()}/viz-`);
    const png = `${tmp}/placa.png`;
    await placa(titulo, n, png);
    // pré-computa ângulo e distância do fundo
    const cx = W / 2, cy = 120, ang = new Float32Array(W * H), dist = new Float32Array(W * H), dmax = Math.hypot(cx, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ang[y * W + x] = Math.atan2(y - cy, x - cx); dist[y * W + x] = Math.hypot(x - cx, (y - cy) * 1.2) / dmax; }
    const NIV = 12, pal = Array.from({ length: NIV * 2 }, (_, i) => mix(mix(hex('#2a3a7a'), hex('#070a18'), Math.min(1, (i % NIV) / (NIV - 1))), COR.blue, i >= NIV ? 0.18 : 0));
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(FPS), '-i', '-',
        '-loop', '1', '-framerate', String(FPS), '-i', png, ...(inicio ? ['-ss', String(inicio)] : []), '-t', String(an.dur), '-i', wav,
        '-filter_complex', '[0:v]scale=1920:1080:flags=neighbor[a];[a][1:v]overlay,format=yuv420p[v]', '-map', '[v]', '-map', '2:a',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => { ff.on('close', (c) => (c ? rej(new Error(`ffmpeg ${c}`)) : res())); ff.stdin.on('error', () => {}); });
    const buf = Buffer.alloc(W * H * 3);
    const set = (x, y, c, a = 1) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; for (let k = 0; k < 3; k++) buf[i + k] = buf[i + k] * (1 - a) + c[k] * a; };
    const rect = (x, y, w, h, c, a = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c, a); };
    const sm = new Float32Array(NB), pico = new Float32Array(NB);
    let bola = 0;
    for (let q = 0; q < an.n; q++) {
        const t = q / FPS, vol = an.vol[q], bs = an.bandas[q];
        bola = Math.max(vol, bola * 0.9);
        const rot = t * 0.12, raios = 14, brilho = 0.04 + 0.1 * bola;
        for (let i = 0; i < W * H; i++) {
            const r = Math.floor(((ang[i] + rot + Math.PI) / (2 * Math.PI)) * raios) & 1;
            const lv = Math.min(NIV - 1, Math.floor(dist[i] * NIV * 1.1));
            const c = pal[lv + (r && dist[i] > 0.08 ? NIV : 0)];
            const k = i * 3, f = r ? 1 + brilho : 1;
            buf[k] = Math.min(255, c[0] * f); buf[k + 1] = Math.min(255, c[1] * f); buf[k + 2] = Math.min(255, c[2] * f);
        }
        // quadra: contorno, linha do meio e círculo central que pulsa
        const L = COR.line, rr = 38 + Math.round(bola * 6);
        rect(24, 14, 432, 2, L, 0.5); rect(24, 254, 432, 2, L, 0.5); rect(24, 14, 2, 242, L, 0.5); rect(454, 14, 2, 242, L, 0.5); rect(239, 14, 2, 242, L, 0.5);
        for (let a = 0; a < 360; a += 2) set(Math.round(240 + rr * Math.cos((a * Math.PI) / 180)), Math.round(135 + rr * Math.sin((a * Math.PI) / 180)), L, 0.55);
        // painel das barras
        rect(30, 150, 420, 96, COR.ink, 0.88); rect(30, 150, 420, 2, COR.line); rect(30, 244, 420, 2, COR.line); rect(30, 150, 2, 96, COR.line); rect(448, 150, 2, 96, COR.line);
        for (let k = 0; k < NB; k++) {
            sm[k] += (bs[k] - sm[k]) * (bs[k] > sm[k] ? 0.7 : 0.2);
            pico[k] = Math.max(pico[k] - 0.012, sm[k]);
            const rows = Math.round(sm[k] * 20), x = 40 + k * 10;
            for (let r = 0; r < rows; r++) rect(x, 240 - r * 4 - 3, 8, 3, r < 5 ? COR.blue : r < 10 ? COR.green : r < 15 ? COR.yellow : COR.red);
            const pr = Math.round(pico[k] * 20);
            if (pr > rows) rect(x, 240 - pr * 4 - 3, 8, 2, COR.text);
        }
        // progresso
        const p = Math.round((q / an.n) * 396);
        rect(40, 252 - 0, 400, 12, COR.ink); rect(40, 252, 400, 2, COR.line); rect(40, 262, 400, 2, COR.line); rect(40, 252, 2, 12, COR.line); rect(438, 252, 2, 12, COR.line);
        rect(42, 254, p, 8, COR.yellow);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;
    rmSync(tmp, { recursive: true, force: true });
    return an.dur;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [wav, ...r] = process.argv.slice(2);
    const o = (k, d) => { const i = r.indexOf(`--${k}`); return i < 0 ? d : r[i + 1]; };
    const dur = await renderFaixa({ wav, titulo: o('titulo', 'Sem título'), n: Number(o('n', 1)), saida: o('saida', 'faixa.mp4'), inicio: Number(o('inicio', 0)), dur: Number(o('dur', 0)) });
    console.log(`ok ${dur.toFixed(1)} s`);
}
