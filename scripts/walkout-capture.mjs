/**
 * Grava o walkout final (?lab=walkout) quadro a quadro em 1080x1920, com o áudio montado a partir dos sons que o
 * walkout pediu (cada um na hora certa do relógio da cena). Precisa do servidor de dev (BASE_URL, padrão
 * http://localhost:8183). Rode dentro do `flock /tmp/soccermon-browser.lock`.
 *
 *   node scripts/walkout-capture.mjs --ed icone --id 150 --out /tmp/x.mp4 [--extra up=0] [--de 0 --ate 14000]
 *                                    [--quadros 400,900] (PNGs também nesses ms) [--so] (só os PNGs)
 *   node scripts/walkout-capture.mjs --ed icone --id 150 --medir --tela 390x844   (FPS em tempo real, sem gravar)
 *
 * O loop do Phaser dorme e cada quadro chama game.step (a cena e os tweens andam no relógio dela); as animações CSS
 * (a carta) andam junto pelo document.getAnimations(). CHROME_PATH aponta o Chromium (padrão /usr/bin/chromium).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ed = arg('--ed', 'icone');
const id = arg('--id', '150');
const out = arg('--out', `/tmp/walkout-${ed}-${id}.mp4`);
const fps = Number(arg('--fps', 30));
const keys = (arg('--quadros', '') || '').split(',').filter(Boolean).map(Number);
const measure = args.includes('--medir');
const base = process.env.BASE_URL ?? 'http://localhost:8183';
const extra = arg('--extra', '');
const url = `${base}/?lab=walkout&ed=${ed}&id=${id}&auto=1${extra ? `&${extra}` : ''}`;

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
    headless: true,
    args: [
        '--no-sandbox',
        '--hide-scrollbars',
        ...(process.env.GPU
            ? ['--enable-gpu', '--ignore-gpu-blocklist']
            : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    ],
    protocolTimeout: 900000,
    env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[página]', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
const ready = () =>
    page.waitForFunction(() => window.__walkoutGame?.scene.getScene('walkout')?.sys.settings.status === 5, {
        timeout: 60000,
    });

if (measure) {
    // tempo real: quadros do loop do Phaser do começo ao fim do walkout
    const vp = arg('--tela', '390x844').split('x').map(Number);
    await page.setViewport({ width: vp[0], height: vp[1], deviceScaleFactor: vp[2] ?? 2 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    await ready();
    const r = await page.evaluate(
        () =>
            new Promise((res) => {
                const g = window.__walkoutGame;
                const s = g.scene.getScene('walkout');
                const end = window.__wkPlan.end;
                const ts = [];
                const on = () => ts.push(performance.now());
                g.events.on('poststep', on);
                const chk = () => {
                    if (s.clock < end) return setTimeout(chk, 50);
                    g.events.off('poststep', on);
                    const dts = ts.slice(1).map((t, i) => t - ts[i]);
                    const sorted = [...dts].sort((a, b) => a - b);
                    const q = (x) => sorted[Math.min(sorted.length - 1, Math.floor(x * sorted.length))];
                    res({
                        ms: Math.round(ts.at(-1) - ts[0]),
                        fps: +(dts.length / ((ts.at(-1) - ts[0]) / 1000)).toFixed(1),
                        p50: +q(0.5).toFixed(1),
                        p95: +q(0.95).toFixed(1),
                        max: +sorted.at(-1).toFixed(1),
                        acima33: dts.filter((d) => d > 33.4).length,
                        quadros: dts.length,
                    });
                };
                chk();
            }),
    );
    console.log(JSON.stringify({ tela: vp.join('x'), ...r }));
    await browser.close();
    process.exit(0);
}

// --tela LxAxD só pros PNGs (--so); o vídeo é sempre 360x640 a 3x = 1080x1920
const [vw, vh, vd] = arg('--tela', '360x640x3').split('x').map(Number);
await page.setViewport({ width: vw, height: vh, deviceScaleFactor: vd ?? 1 });
await page.evaluateOnNewDocument(() => {
    window.__wkManual = true;
    window.__wkHold = true;
    window.__wkSounds = [];
});
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__wkStart, { timeout: 30000 });
await page.evaluate(() => window.__wkStart());
await ready();
await page.evaluate(async () => {
    await document.fonts.ready;
    const g = window.__walkoutGame;
    g.loop.sleep();
    window.__wkHold = false;
    window.__t = performance.now();
    // as animações CSS/WAAPI ficam paradas e andam pelo relógio do quadro
    window.__stepCss = (dt) => {
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
    window.__frame = (dt) => {
        window.__t += dt;
        g.step(window.__t, dt);
        window.__stepCss(dt);
        return g.scene.getScene('walkout').clock;
    };
});
const plan = await page.evaluate(() => window.__wkPlan);
const from = Number(arg('--de', 0));
const to = Number(arg('--ate', plan.end + 1200));
const dt = 1000 / fps;
const dir = join(dirname(out), `.frames-${ed}-${id}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const cdp = await page.createCDPSession();
// espera o que ainda carrega (arte da carta) antes de fotografar
const settle = () =>
    page.evaluate(async () => {
        for (let i = 0; i < 60; i++) {
            if ([...document.querySelectorAll('.wk-ph img')].every((im) => im.complete)) return;
            await new Promise((r) => setTimeout(r, 50));
        }
    });
const shot = async () =>
    Buffer.from(
        (
            await cdp.send('Page.captureScreenshot', {
                format: 'png',
                optimizeForSpeed: true,
                clip: { x: 0, y: 0, width: vw, height: vh, scale: vd ?? 1 },
            })
        ).data,
        'base64',
    );
let clock = 0;
let n = 0;
const left = [...keys];
while (clock < to) {
    clock = await page.evaluate((d) => window.__frame(d), dt);
    if (clock < from) continue;
    const k = left.find((x) => x <= clock);
    if (args.includes('--so')) {
        if (k === undefined) continue;
        await settle();
        writeFileSync(out.replace(/\.mp4$/, `-q${k}.png`), await shot());
        left.splice(left.indexOf(k), 1);
        if (!left.length) break;
        continue;
    }
    await settle();
    const png = await shot();
    writeFileSync(join(dir, `${String(n++).padStart(4, '0')}.png`), png);
    if (k !== undefined) {
        writeFileSync(out.replace(/\.mp4$/, `-q${k}.png`), png);
        left.splice(left.indexOf(k), 1);
    }
    if (n % 60 === 0) console.log(`quadro ${n} (${Math.round(clock)} ms)`);
}
if (args.includes('--so')) {
    await browser.close();
    process.exit(0);
}

// áudio: cada som vira um arquivo (ZzFX renderizado na página; os outros são os do jogo) com atraso e volume
const sounds = await page.evaluate(() =>
    window.__wkSounds.map((x) => ({ t: x.t, s: x.s, pcm: window.__wkRender?.(x.s) ?? null })),
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
    if (x.t < from) return;
    let file;
    let vol = 1;
    if (x.pcm) {
        file = join(dir, `s${j}.wav`);
        wav(x.pcm, file);
        vol = 0.45;
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
    if (file) inputs.push({ file, t: x.t - from, vol });
});
const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(dir, '%04d.png')];
for (const s of inputs) ff.push('-i', s.file);
const chains = inputs.map(
    (s, j) =>
        `[${j + 1}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${s.vol},adelay=${Math.max(0, Math.round(s.t))}:all=1[a${j}]`,
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
    '18',
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
