/**
 * Clipe de uma faixa: WAV -> MP4 1920x1080, 30 fps, cena em pixel art animada no tempo da música (v2).
 *   scripts/pesado.sh node scripts/visualizer/clipe.mjs <wav> --cena chefe|plano --bpm 96 --titulo "Sala do chefe" --n 12
 *        [--trechos 0-12.5,118.1-135.8]   (amostra: pedaços da faixa, na ordem; sem isso, a faixa inteira)
 *        [--saida x.mp4]
 * Espectro vira parte da cena (janelas da cidade, lâmpadas). Batida: BPM dado; kick: fluxo dos graves do WAV.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CENAS } from './cenas.mjs';
import { carregar } from './pmd.mjs';
import { RES as RES_CHEFE4, chefe4 } from './chefe4.mjs';
import { plano4 } from './plano4.mjs';
import { curto5 } from './curto5.mjs';
import { ultima5 } from './ultima5.mjs';
CENAS['D-chefe'] = { res: RES_CHEFE4, fn: chefe4, pmd: [53, 52, 23, 109] };
CENAS['D-curto'] = { res: RES_CHEFE4, fn: curto5, pmd: [25, 81, 100, 39, 54, 66, 7, 1] };
CENAS['D-ultima'] = { res: RES_CHEFE4, fn: ultima5, pmd: [59, 58, 74, 66, 25, 7, 4] };
CENAS['D-plano'] = { res: RES_CHEFE4, fn: plano4, pmd: [52, 23, 109, 100] };
import { Pix } from './pix.mjs';
import { RAIZ, analisar } from './render.mjs';

const W = 480, H = 270, FPS = 30;

/** Placas de texto (PNG transparente 1920x1080): abertura (grande) e etiqueta fixa. */
async function placas(titulo, n, dir) {
    const fonte = `file://${RAIZ}public/fonts/`, T = titulo.toUpperCase().replace(/&/g, '&amp;');
    const tam = 48;
    const css = `<style>@font-face{font-family:G14;src:url(${fonte}Galmuri14.woff2)}@font-face{font-family:G11;font-weight:700;src:url(${fonte}Galmuri11-Bold.woff2)}
html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden;color:#f4f1e6;font-family:G11}
.logo{position:absolute;left:60px;top:44px;width:400px}
.chip{position:absolute;left:60px;top:136px;font:700 28px G11;letter-spacing:4px;color:#141a33;background:#ffcb05;padding:6px 18px;border-radius:6px;box-shadow:5px 5px 0 #0e1430}
.tag{position:absolute;right:60px;top:60px;font:700 26px G11;letter-spacing:3px;color:#a6aed6;text-shadow:3px 3px 0 #0e1430}.tag b{color:#ffcb05}
.placa{position:absolute;left:50%;transform:translateX(-50%);top:150px;padding:14px 30px;background:#141a33;border:5px solid #4b5a9a;border-radius:10px;box-shadow:8px 8px 0 #0e1430;display:flex;align-items:center;gap:24px;white-space:nowrap}
.faixa{font:700 22px G11;letter-spacing:4px;color:#141a33;background:#ffcb05;padding:6px 22px;border-radius:6px}.tit{font:${tam}px G14;text-shadow:6px 6px 0 #0e1430;white-space:nowrap}</style>`;
    const A = `${css}<div class=placa><div class=faixa>FAIXA ${String(n).padStart(2, '0')}</div><div class=tit>${T}</div></div><div class=tag>SOCCERMON SONGS <b>VOL. 1</b></div>`;
    const B = `${css}<img class=logo src="file://${RAIZ}public/assets/ui/logo.svg"><div class=chip>${String(n).padStart(2, '0')} · ${T}</div>`;
    const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
    for (const [nome, html] of [['abertura', A], ['etiqueta', B]]) {
        const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
        writeFileSync(`${dir}/${nome}.html`, `<meta charset=utf-8>${html}`);
        await p.goto(`file://${dir}/${nome}.html`, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready);
        await p.screenshot({ path: `${dir}/${nome}.png`, omitBackground: true });
    }
    await b.close();
}

export async function renderClipe({ wav, cena, bpm, titulo, n, saida, trechos }) {
    const cc = CENAS[cena], cenaFn = typeof cc === 'function' ? cc : cc.fn, [CW, CH] = cc.res ?? [W, H];
    if (cc.pmd) await carregar(...cc.pmd);
    const tmp = mkdtempSync(`${tmpdir()}/clipe-`);
    const segs = (trechos ?? '').split(',').filter(Boolean).map((s) => s.split('-').map(Number));
    let src = wav;
    if (segs.length) { // amostra: emenda os pedaços (fade de 20 ms nas pontas)
        src = `${tmp}/amostra.wav`;
        const f = segs.map(([a, b], i) => `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(b - a - 0.02).toFixed(3)}:d=0.02[s${i}]`).join(';');
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-filter_complex', `${f};${segs.map((_, i) => `[s${i}]`).join('')}concat=n=${segs.length}:v=0:a=1[o]`, '-map', '[o]', src]);
    }
    const full = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString());
    const an = analisar(src, 0, 0);
    const tmap = (t) => { let r = t; for (const [a, b] of segs) { if (r < b - a) return a + r; r -= b - a; } return segs.length ? segs.at(-1)[1] : t; };
    // kick: fluxo positivo dos graves, normalizado
    const grave = an.bandas.map((r) => r.slice(0, 9).reduce((s, v) => s + v, 0));
    const flux = grave.map((v, i) => Math.max(0, v - (grave[i - 1] ?? v)));
    const ordenado = [...flux].sort((p, q) => p - q), norma = ordenado[Math.floor(ordenado.length * 0.95)] || 1;
    await placas(titulo, n, tmp);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${CW}x${CH}`, '-framerate', String(FPS), '-i', '-',
        '-loop', '1', '-framerate', String(FPS), '-i', `${tmp}/abertura.png`, '-loop', '1', '-framerate', String(FPS), '-i', `${tmp}/etiqueta.png`, '-i', src,
        '-filter_complex', `[0:v]scale=1920:1080:flags=neighbor,fade=t=in:st=0:d=0.5,fade=t=out:st=${(an.dur - 0.9).toFixed(2)}:d=0.8[a];[1:v]format=rgba,fade=t=in:st=0.4:d=0.4:alpha=1,fade=t=out:st=3.4:d=0.6:alpha=1[i];[2:v]format=rgba,fade=t=in:st=3.8:d=0.6:alpha=1[e];[a][i]overlay[b];[b][e]overlay,format=yuv420p[v]`,
        '-map', '[v]', '-map', '3:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), '-c:a', 'aac', '-b:a', '256k', '-t', String(an.dur), '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => { ff.on('close', (c) => (c ? rej(new Error(`ffmpeg ${c}`)) : res())); ff.stdin.on('error', () => {}); });
    const P = new Pix(CW, CH), beatDur = 60 / bpm;
    let kickPulse = 0;
    for (let q = 0; q < an.n; q++) {
        const t = q / FPS, tt = tmap(t), beatN = tt / beatDur;
        kickPulse = Math.max(Math.min(1, flux[q] / norma), kickPulse * 0.82);
        const clapB = Math.floor(beatN / 4) * 4 + 2, clapAt = (beatN >= clapB ? clapB : clapB - 4) * beatDur, clapAge = tt - clapAt;
        const c = { t, tt, q, dur: full, bandas: an.bandas[q], vol: an.vol[q], beatN, kickPulse, clapAge, clapPulse: Math.exp(-clapAge * 6) * (clapAge >= 0 ? 1 : 0) };
        cenaFn(P, c);
        P.rect(0, CH - 4, Math.round((q / an.n) * CW), 4, [255, 203, 5]);
        if (!ff.stdin.write(P.b)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;
    rmSync(tmp, { recursive: true, force: true });
    return an.dur;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [wav, ...r] = process.argv.slice(2);
    const o = (k, d) => { const i = r.indexOf(`--${k}`); return i < 0 ? d : r[i + 1]; };
    const d = await renderClipe({ wav, cena: o('cena', 'plano'), bpm: Number(o('bpm', 100)), titulo: o('titulo', 'Sem título'), n: Number(o('n', 1)), saida: o('saida', 'clipe.mp4'), trechos: o('trechos', '') });
    console.log(`ok ${d.toFixed(1)} s`);
}
