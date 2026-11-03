/**
 * Grava o walkout React (?lab=walkout&motor=react) quadro a quadro em 1080x1920, com o áudio montado a partir dos sons
 * que o walkout pediu (cada um na hora certa). Precisa do servidor de dev (BASE_URL, padrão http://localhost:8181).
 *
 *   node scripts/walkout-capture.mjs --ed icone --id 150 --up 0 --out /tmp/x.mp4 [--quadros 400,900] [--fps 30]
 *   node scripts/walkout-capture.mjs --ed icone --id 150 --medir     (FPS em tempo real, sem gravar)
 *
 * O relógio do walkout para (window.__wkManual) e cada quadro chama __wkSeek(ms); as animações CSS e WAAPI (o
 * MomentWipe, o brilho da carta) andam junto pelo document.getAnimations(). --quadros grava também PNGs nesses ms.
 * CHROME_PATH aponta o Chromium (padrão /usr/bin/chromium). Rode dentro do `flock /tmp/soccermon-browser.lock`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ed = arg('--ed', 'icone');
const id = arg('--id', '150');
const up = arg('--up', '');
const out = arg('--out', `/tmp/walkout-${ed}-${id}.mp4`);
const fps = Number(arg('--fps', 30));
const keys = (arg('--quadros', '') || '').split(',').filter(Boolean).map(Number);
const measure = args.includes('--medir');
const base = process.env.BASE_URL ?? 'http://localhost:8181';
const url = `${base}/?lab=walkout&motor=react&ed=${ed}&id=${id}${up ? `&up=${up}` : ''}&auto=1${arg('--extra', '') ? `&${arg('--extra', '')}` : ''}`;

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
    protocolTimeout: 600000,
    env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[página]', e.message));

if (measure) {
    // tempo real: conta os quadros do requestAnimationFrame do começo ao fim do walkout
    const vp = arg('--tela', '390x844x2').split('x').map(Number);
    await page.setViewport({ width: vp[0], height: vp[1], deviceScaleFactor: vp[2] });
    await page.evaluateOnNewDocument(() => {
        const ts = [];
        window.__wkFrames = ts;
        const tick = (n) => {
            if (document.querySelector('.wk')) ts.push(n);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForFunction(() => window.__wkPlan, { timeout: 30000 });
    const end = await page.evaluate(() => window.__wkPlan.end);
    await new Promise((r) => setTimeout(r, end + 600));
    const ts = await page.evaluate(() => window.__wkFrames.slice());
    const span = ts.filter((t) => t - ts[0] <= end);
    const dts = span.slice(1).map((t, i) => t - span[i]);
    const sorted = [...dts].sort((a, b) => a - b);
    const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    console.log(
        JSON.stringify({
            tela: vp.join('x'),
            ms: Math.round(span.at(-1) - span[0]),
            fps: +(dts.length / ((span.at(-1) - span[0]) / 1000)).toFixed(1),
            p50: +p(0.5).toFixed(1),
            p95: +p(0.95).toFixed(1),
            max: +sorted.at(-1).toFixed(1),
            acima33: dts.filter((d) => d > 33.4).length,
            quadros: dts.length,
        }),
    );
    await browser.close();
    process.exit(0);
}

await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
await page.evaluateOnNewDocument(() => {
    window.__wkManual = true;
    window.__wkSounds = [];
});
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__wkStart, { timeout: 30000 });
await page.evaluate(async () => {
    await document.fonts.ready;
    // as animações CSS/WAAPI ficam paradas e andam pelo relógio do quadro
    window.__step = (dt) => {
        for (const an of document.getAnimations()) {
            if (an.__vt === undefined) {
                an.pause();
                an.__vt = Number(an.currentTime ?? 0);
                continue;
            }
            an.__vt += dt;
            const t = an.effect?.getComputedTiming?.();
            if (t && Number.isFinite(t.endTime) && an.__vt >= t.endTime) {
                an.finish();
                continue;
            }
            an.currentTime = an.__vt;
        }
    };
    window.__wkStart();
});
await page.waitForFunction(() => window.__wkSeek && window.__wkPlan, { timeout: 30000 });
await page.evaluate(() => window.__step(0));
const plan = await page.evaluate(() => window.__wkPlan);
const tail = plan.end + 1200;
const n = Math.ceil((tail / 1000) * fps);
const dir = join(dirname(out), `.frames-${ed}-${id}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const cdp = await page.createCDPSession();
// espera o que ainda carrega (folha do sprite, arte da carta) antes de fotografar
const settle = () =>
    page.evaluate(async () => {
        for (let i = 0; i < 60; i++) {
            const mon = document.querySelector('.wk-mon');
            const imgs = [...document.querySelectorAll('.wk img')];
            const ok = (!mon || mon.querySelector('.fs-sprite')) && imgs.every((im) => im.complete);
            if (ok) return;
            await new Promise((r) => setTimeout(r, 50));
        }
    });
if (args.includes('--so')) {
    // só os quadros-chave (conferir rápido): anda até cada um em passos de 1/fps
    let at = 0;
    for (const k of keys) {
        for (; at < k; at += 1000 / fps)
            await page.evaluate(
                (m, dt) => {
                    window.__wkSeek(m);
                    window.__step(dt);
                },
                at,
                1000 / fps,
            );
        await page.evaluate((m) => window.__wkSeek(m), k);
        await settle();
        await page.screenshot({ path: out.replace(/\.mp4$/, `-q${k}.png`) });
    }
    await browser.close();
    process.exit(0);
}
const keySet = new Set(keys);
const keyFrames = keys.map((k) => Math.round((k / 1000) * fps));
for (let i = 0; i < n; i++) {
    const ms = (i * 1000) / fps;
    await page.evaluate(
        (m, dt) => {
            window.__wkSeek(m);
            window.__step(dt);
        },
        ms,
        1000 / fps,
    );
    await settle();
    const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        optimizeForSpeed: true,
        clip: { x: 0, y: 0, width: 360, height: 640, scale: 3 },
    });
    writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.from(shot.data, 'base64'));
    if (keyFrames.includes(i) || keySet.has(ms))
        writeFileSync(out.replace(/\.mp4$/, `-q${Math.round(ms)}.png`), Buffer.from(shot.data, 'base64'));
    if (i % 60 === 0) console.log(`quadro ${i}/${n}`);
}

// áudio: cada som vira um arquivo (ZzFX renderizado na página; os outros são os do jogo) com atraso e volume
const sounds = await page.evaluate(() =>
    window.__wkSounds.map((x) => ({ t: x.t, s: x.s, pcm: window.__wkRender(x.s) })),
);
await browser.close();
const pub = join(process.cwd(), 'public');
const wav = (pcm, file) => {
    const b = Buffer.alloc(44 + pcm.length * 2);
    b.write('RIFF', 0);
    b.writeUInt32LE(36 + pcm.length * 2, 4);
    b.write('WAVEfmt ', 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(1, 22);
    b.writeUInt32LE(44100, 24);
    b.writeUInt32LE(88200, 28);
    b.writeUInt16LE(2, 32);
    b.writeUInt16LE(16, 34);
    b.write('data', 36);
    b.writeUInt32LE(pcm.length * 2, 40);
    for (let j = 0; j < pcm.length; j++)
        b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm[j] * 32767))), 44 + j * 2);
    writeFileSync(file, b);
};
const inputs = [];
sounds.forEach((x, j) => {
    let file;
    let vol = 1;
    if (x.pcm) {
        file = join(dir, `s${j}.wav`);
        wav(x.pcm, file);
        vol = 0.5;
    } else if (x.s.k === 'max') {
        file = join(pub, 'sfx', `max-${x.s.name}.mp3`);
        vol = 0.6;
    } else if (x.s.k === 'crowd') {
        file = join(pub, 'assets', 'sfx', `torcida-${x.s.call}-${1 + (j % 2)}.mp3`);
        vol = 0.9 * x.s.gain;
    } else if (x.s.k === 'cry') {
        file = join(pub, 'assets', 'cries', 'latest', `${id}.ogg`);
        vol = 0.7 * x.s.gain;
    }
    if (file) inputs.push({ file, t: x.t, vol });
});
const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(dir, '%04d.png')];
for (const s of inputs) ff.push('-i', s.file);
const chains = inputs.map(
    (s, j) =>
        `[${j + 1}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${s.vol},adelay=${Math.round(s.t)}:all=1[a${j}]`,
);
const mix = `${inputs.map((_, j) => `[a${j}]`).join('')}amix=inputs=${inputs.length}:normalize=0:duration=longest,atrim=0:${(n / fps).toFixed(3)},loudnorm=I=-14:TP=-1.5[aout]`;
ff.push(
    '-filter_complex',
    [...chains, mix].join(';'),
    '-map',
    '0:v',
    '-map',
    '[aout]',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '17',
    '-preset',
    'medium',
    '-r',
    String(fps),
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    out,
);
execFileSync('flock', ['/tmp/soccermon-heavy.lock', 'ffmpeg', ...ff], { stdio: ['ignore', 'ignore', 'inherit'] });
rmSync(dir, { recursive: true, force: true });
console.log(`pronto: ${out} (${n} quadros, ${inputs.length} sons, fim ${plan.end} ms)`);
