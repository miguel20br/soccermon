// Curta "POV: você segurou o golpe até o nível 3": abre o ?demo=maximo no dev server e controla a partida quadro a
// quadro (o loop do Phaser parado e game.step por quadro, como scripts/trailer-capture.mjs). Usado por varrer.mjs
// (acha a partida) e gravar.mjs (grava os quadros).
import puppeteer from 'puppeteer-core';

export const BASE = process.env.BASE_URL ?? 'http://localhost:8095';
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function abrir({ capitao, k = 0, fps = 30, largura = 1280, alto = 960, dsf = 1, vel = 1 }) {
    const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
        headless: true,
        args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
        protocolTimeout: 600000,
        env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' },
    });
    const page = await browser.newPage();
    await page.setViewport({ width: largura, height: alto, deviceScaleFactor: dsf });
    page.on('pageerror', (e) => console.log('[página]', e.message));
    page.on('console', (m) => /\[demo\]/.test(m.text()) && console.log(m.text()));
    const click = (sel, re = '.') =>
        page.evaluate(
            (sel, src) => {
                const b = [...document.querySelectorAll(sel)].find(
                    (x) => new RegExp(src, 'i').test(x.innerText.trim()) && !x.disabled && x.getBoundingClientRect().width > 0,
                );
                b?.click();
                return !!b;
            },
            sel,
            re,
        );
    await page.goto(`${BASE}/?demo=maximo&nivel=1&desde=0&capitao=${capitao}&k=${k}&vel=${vel}`, { waitUntil: 'networkidle0', timeout: 300000 });
    await wait(2500);
    if (!(await click('button', '^(Jogar|Voltar para a partida)'))) throw new Error('não achei Jogar/Voltar para a partida');
    for (let i = 0; i < 90; i++) {
        const pronto = await page.evaluate(
            () => !!window.__soccermonGame && [...document.querySelectorAll('button')].some((b) => /^Começar/.test(b.innerText.trim()) && !b.disabled),
        );
        if (pronto) break;
        await wait(1000);
    }
    await page.evaluate((sf) => {
        window.__semFaixa = sf;
        window.__tick = 0;
        window.__fim = false;
        window.__ev = [];
        window.__soccermonBus.on('match:tick', (t) => {
            window.__tick = t.tick;
        });
        window.__soccermonBus.on('match:ended', () => {
            window.__fim = true;
        });
        window.__trocas = 0;
        window.__soccermonBus.on('match:replace', () => {
            window.__trocas++;
        });
        window.__soccermonBus.on('match:event', (e) => {
            if (e && (e.type === 'goal' || e.type === 'shot' || e.type === 'save' || /max/.test(e.type)))
                window.__ev.push({ type: e.type, team: e.team, tick: e.tick, level: e.level });
        });
        const g = window.__soccermonGame;
        const sc = g.scene.getScene('Match');
        // fora do vídeo: a faixa da torcida ("Vai, Demo FC!", profundidade -998/-999) e a caixa de narração
        for (const o of sc.children.list) if (o.depth === -998 || o.depth === -999) o.willRender = () => false;
        if (sc.battleBox?.container) sc.battleBox.container.willRender = () => false;
        // SEM_FAIXA: a faixa do especial vem da montagem, grande (a do jogo cabe no canvas de 968 px e lê pequena)
        if (window.__semFaixa) sc.cine.superBanner = () => {};
        const cam = sc.cameras.main;
        cam.setBounds(0, 0, cam.width, cam.height);
        g.loop.sleep();
        window.__t = g.loop.now || performance.now();
        // relógio falso pro HTML (setTimeout e animações CSS andam com o jogo)
        let vnow = performance.now();
        let seq = 1e7;
        const timers = new Map();
        window.setTimeout = (fn, ms = 0, ...a) => {
            const id = seq++;
            timers.set(id, { at: vnow + Number(ms || 0), fn: () => fn(...a) });
            return id;
        };
        window.clearTimeout = (id) => timers.delete(id);
        window.__vadvance = (dt) => {
            const alvo = vnow + dt;
            for (;;) {
                let prox = null;
                for (const [id, t] of timers) if (t.at <= alvo && (!prox || t.at < prox[1].at)) prox = [id, t];
                if (!prox) break;
                vnow = prox[1].at;
                timers.delete(prox[0]);
                try {
                    prox[1].fn();
                } catch (e) {
                    console.error(e);
                }
            }
            vnow = alvo;
            for (const an of document.getAnimations()) {
                if (an.__vt === undefined) {
                    an.pause();
                    an.__vt = Number(an.currentTime ?? 0);
                } else {
                    an.__vt += dt;
                    an.currentTime = an.__vt;
                }
            }
        };
    }, !!process.env.SEM_FAIXA);
    await click('button', '^Começar');
    await wait(300);
    await click('button', '^Pular$');
    const DT = 1000 / fps;
    // um quadro: avança o jogo e devolve o estado (e o canvas, se grab)
    const step = (grab = false, mult = 1) =>
        page.evaluate(
            async (d, grab) => {
                window.__t += d;
                const sc = window.__soccermonGame.scene.getScene('Match');
                for (const v of sc.players) v.label?.setAlpha(0);
                window.__soccermonGame.step(window.__t, d);
                window.__vadvance(d);
                const cue = document.querySelector('.sl-cue-row .sl-cue.lv3');
                const cam = sc.cameras.main;
                const w = cam.worldView;
                const cap = sc.players.find((v) => v.captain && v.team === 0) ?? null;
                return {
                    tick: window.__tick,
                    fim: window.__fim,
                    hold: sc.holdReal > sc.time.now,
                    cue: cue ? cue.innerText.replace(/\s+/g, ' ').trim() : null,
                    ev: window.__ev.splice(0),
                    cam: { x: w.x, y: w.y, w: w.width, h: w.height, zoom: cam.zoom },
                    ball: { x: sc.ball.x, y: sc.ball.y },
                    cap: cap ? { x: cap.sprite.x, y: cap.sprite.y } : null,
                    png: grab ? document.querySelector('.pitch-wrap canvas').toDataURL('image/png') : null,
                };
            },
            DT * mult,
            grab,
        );
    const speed = (v) => page.evaluate((v) => window.__soccermonBus.emit('match:set-speed', v), v);
    return { browser, page, step, speed, click };
}
