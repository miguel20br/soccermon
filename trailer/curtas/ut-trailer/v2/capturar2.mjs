// Trailer v2 do Time Ultimate, 2ª rodada de captura (roteiro-v2.md, planos 2 a 6), headless e quadro a quadro, no mesmo
// jeito do capturar.mjs (relógio da página parado; animações CSS paradas pelo CDP e andadas à mão).
//   clube: o toque no Dratini a 5x (1800x3200), pra dar zoom nos losangos sem perder nitidez.
//   fluxo: um save só, em ordem: o pós-jogo da vitória (4 a 1), as Metas (o marco 2 e o Pegar), a Loja com "Abrir
//          todos (2)" até o walkout do Dragonite (a cena do Phaser andada por game.step, como o
//          scripts/walkout-capture.mjs, com os sons que ela pediu) e o Início com o time andando.
// Encenação do save (o resto é o jogo): sal utv2cyv; o passe chega com o marco 1 pago (a carta do Pikachu) e 260 pontos,
// a 1 vitória do marco 2; a vitória é a 1ª partida de verdade (Fácil, 4 a 1), terminada direto pelo ultimateFinish
// (a mesma ação do apito final); depois, 12 h de relógio pro pacote grátis (o Abrir todos abre ele e o do marco 2).
// O Dragonite entra no lugar do Voltorb pelo setMember (o Trocar do Clube).
//   BASE_URL=http://localhost:8092 node trailer/curtas/ut-trailer/v2/capturar2.mjs <pasta> [clube] [fluxo]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8092';
const [OUT = 'midia-v2', ...so] = process.argv.slice(2);
const SALT = process.env.SALT ?? 'utv2cyv';
const FPS = 30;
const DT = 1000 / FPS;
const want = (n) => !so.length || so.includes(n);
// GPU de verdade pro walkout (o SwiftShader perde triângulos dos telões; scripts/walkout-capture.mjs)
const browser = await chromium.launch({
    headless: true,
    executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`,
    args: ['--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});

async function novoSave(dpr, manual = true) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: dpr, locale: 'pt-BR' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('erro na página:', e.message));
    // o walkout espera a gravação (sem o Pular, e a cena só anda pelo game.step) e anota os sons que pediu
    if (manual)
        await page.addInitScript(() => {
            window.__wkManual = true;
            window.__wkHold = true;
            window.__wkSounds = [];
        });
    await page.clock.install();
    await page.goto(`${BASE}/?lab=ultimate&utnow=2026-11-28`, { timeout: 120000 });
    await page.getByText(/Time Ultimate/i).first().click({ timeout: 60000 });
    await page.getByRole('button', { name: /^JOGAR$/ }).click();
    await page.getByText('Meus pacotes').first().waitFor({ timeout: 30000 });
    await store(page, (m, U, s) => m.useGame.setState((st) => ({ ultimate: { ...st.ultimate, salt: s } })), SALT);
    await page.locator('.es-play').click();
    await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().waitFor();
    // os 2 pacotes do começo (gravados no capturar.mjs): o time se escala sozinho
    for (let p = 0; p < 2; p++) {
        await page.getByRole('button', { name: /^Abrir( 1)?$/ }).first().click();
        await page.locator('.cpack-btn').click();
        await page.waitForTimeout(4000);
        await btn(page, /^Guardar/).first().click();
        await page.waitForTimeout(800);
    }
    return { ctx, page };
}
const btn = (page, re) => page.locator('button').filter({ hasText: re });
const aba = (page, re) => page.locator('.ut-tabs button, nav button, button').filter({ hasText: re }).last();
/** Roda `fn(storeModule, ultimateModule, arg)` na página. */
const store = (page, fn, arg) =>
    page.evaluate(
        async ([src, a]) => {
            const m = await import('/src/store/game-store.ts');
            const U = await import('/src/store/ultimate/ultimate.ts');
            // biome-ignore lint/security/noGlobalEval: a função vem deste script
            return (0, eval)(src)(m, U, a);
        },
        [fn.toString(), arg],
    );

async function congela(page) {
    // com a página ocupada (a quadra do Phaser), o relógio anda entre ler a hora e pausar: tenta mais pra frente
    for (const extra of [20, 300, 1000, 3000]) {
        try {
            await page.clock.pauseAt((await page.evaluate(() => Date.now())) + extra);
            break;
        } catch (e) {
            if (extra === 3000) throw e;
        }
    }
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    return async (ms) => {
        await page.clock.runFor(ms);
        await page.evaluate((d) => {
            for (const an of document.getAnimations()) {
                if (an.__vt === undefined) an.__vt = Number(an.currentTime ?? 0);
                an.__vt += d;
                an.currentTime = an.__vt;
            }
        }, ms);
    };
}

const dedo = (page, x, y) =>
    page.evaluate(
        ([x, y]) => {
            const d = document.createElement('div');
            d.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;
              border:3px solid #fff;background:rgba(255,255,255,.35);box-shadow:0 0 0 2px rgba(7,10,24,.6);z-index:99999;pointer-events:none`;
            document.body.append(d);
            d.animate(
                [
                    { transform: 'scale(.5)', opacity: 1 },
                    { transform: 'scale(1)', opacity: 1, offset: 0.35 },
                    { transform: 'scale(1.5)', opacity: 0 },
                ],
                { duration: 450, fill: 'forwards' },
            );
        },
        [x, y],
    );
/** Toca no meio do elemento com o anel do dedo. */
const toca = async (page, loc) => {
    const b = await loc.boundingBox();
    const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
    await dedo(page, x, y);
    await page.mouse.click(x, y);
};

/** Grava `n` quadros em `dir` a partir de `from`; `acao(i)` antes de cada um. Devolve o próximo número. */
async function grava(page, anda, dir, n, acao, from = 0) {
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
        await acao?.(i);
        await page.screenshot({ path: join(dir, `${String(from + i).padStart(4, '0')}.png`) });
        await anda(DT);
    }
    return from + n;
}

if (want('clube')) {
    const { ctx, page } = await novoSave(5);
    await aba(page, /^\d*\s*clube$/i).click();
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelector('.ut-panel .vt-board')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(500);
    const anda = await congela(page);
    const alvo = btn(page, /Dratini/).first();
    await grava(page, anda, `${OUT}/clube5`, 84, async (i) => {
        if (i === 12) await toca(page, alvo);
    });
    const b = await alvo.boundingBox();
    writeFileSync(`${OUT}/clube5/marcas.json`, JSON.stringify({ toque: 12, dratini: b }));
    await ctx.close();
}

if (want('fluxo')) {
    const { ctx, page } = await novoSave(3);
    // o passe: marco 1 pago (a carta de abertura) e 260 pontos
    await store(page, (m, U) => {
        let u = m.useGame.getState().ultimate;
        u = U.payPass({ ...u, pass: { day: '', today: 0, pts: 150, marks: 0 } });
        m.useGame.setState({ ultimate: { ...u, pass: { ...u.pass, pts: 260 } } });
    });
    await aba(page, /^\d*\s*jogar$/i).click();
    await page.waitForTimeout(1200);
    await page.locator('.ut-level-chip').first().click();
    await page.waitForTimeout(600);
    await btn(page, /^Fácil$/).first().click();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^JOGAR$/ }).first().click();
    await page.getByRole('button', { name: /^Começar/ }).waitFor({ timeout: 60000 });
    // daqui em diante o relógio fica parado: espera = andar o relógio (e as animações) sem gravar
    const anda = await congela(page);
    const espera = async (ms) => {
        for (let t = 0; t < ms; t += 100) await anda(100);
    };
    const clica = async (loc) => {
        for (let i = 0; i < 100 && !(await loc.count()); i++) await anda(100);
        const b = await loc.boundingBox();
        await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    };
    const placar = await store(page, (m) => {
        const s = m.useGame.getState();
        const score = s.match.score;
        s.ultimateFinish(s.match);
        m.useGame.getState().go('ultimate');
        return score;
    });
    console.log('placar', placar);
    const marcas = {};
    const dir = `${OUT}/fluxo`;
    let n = 0;
    // pós-jogo: VITÓRIA, 4 x 1 e a cascata (≤ 3 s)
    marcas.posjogo = n;
    n = await grava(page, anda, dir, 100, null, n);
    await clica(btn(page, /^Continuar$/).first());
    await espera(800);
    // Metas: o passe na tela, o Pegar no marco 2 e o "+1 em Meus pacotes"
    await clica(aba(page, /^\d*\s*metas$/i));
    await espera(1500);
    await page.evaluate(() => document.querySelector('.ut-pass')?.scrollIntoView({ block: 'center' }));
    await espera(800);
    marcas.metas = n;
    const pegar = page.locator('.ut-pass button').filter({ hasText: /^Pegar$/ }).first();
    marcas.pegarBox = await pegar.boundingBox();
    marcas.pegar = n + 15;
    n = await grava(page, anda, dir, 75, async (i) => i === 15 && (await toca(page, pegar)), n);
    // 12 h depois: o pacote grátis voltou (Meus pacotes: o do marco 2 e o grátis)
    await store(page, (m) =>
        m.useGame.setState((s) => ({ ultimate: { ...s.ultimate, packAt: s.ultimate.packAt - 12 * 3600 * 1000 } })),
    );
    await clica(aba(page, /^\d*\s*loja$/i));
    await espera(1500);
    marcas.loja = n;
    const todos = btn(page, /^Abrir todos/).first();
    marcas.abrirTodos = n + 10;
    n = await grava(page, anda, dir, 30, async (i) => i === 10 && (await toca(page, todos)), n);
    // 1º pacote: o dedo rasga; o leque; Continuar
    for (let i = 0; i < 100 && !(await page.locator('.cpack-btn').count()); i++) await anda(100);
    const box = await page.locator('.cpack-btn').boundingBox();
    const y = box.y + box.height * 0.45;
    const x = (f) => box.x + box.width * f;
    marcas.pacote1 = n;
    n = await grava(
        page,
        anda,
        dir,
        80,
        async (i) => {
            if (i === 1) {
                await page.mouse.move(x(0.12), y);
                await page.mouse.down();
            }
            if (i > 1 && i <= 9) await page.mouse.move(x(0.12 + (0.76 * (i - 1)) / 8), y);
            if (i === 10) await page.mouse.up();
        },
        n,
    );
    const cont = btn(page, /^Continuar$/).first();
    marcas.continuar = n + 4;
    n = await grava(page, anda, dir, 8, async (i) => i === 4 && (await toca(page, cont)), n);
    // 2º pacote: rasga sozinho; o leque com a carta do walkout guardada, até o walkout montar
    marcas.pacote2 = n;
    for (let i = 0; i < 240 && !(await page.locator('.wk-ph').count()); i++) n = await grava(page, anda, dir, 1, null, n);
    marcas.walkoutMonta = n;
    // o Phaser sobe no relógio falso (rAF), sem gravar
    for (let i = 0; i < 1500; i++) {
        const ok = await page.evaluate(
            () => window.__walkoutGame?.scene.getScene('walkout')?.sys.settings.status === 5,
        );
        if (ok) break;
        await page.clock.runFor(16);
    }
    await page.evaluate(async () => {
        await document.fonts.ready;
        const g = window.__walkoutGame;
        g.loop.sleep();
        window.__wkHold = false;
        window.__t = performance.now();
        // o GIF da carta no relógio da cena (o mesmo do walkout-capture.mjs)
        const gifs = new Map();
        const loadGif = (src) => {
            if (!gifs.has(src))
                gifs.set(
                    src,
                    (async () => {
                        const dec = new ImageDecoder({ data: await (await fetch(src)).arrayBuffer(), type: 'image/gif' });
                        await dec.tracks.ready;
                        const c = document.createElement('canvas');
                        const urls = [];
                        const durs = [];
                        for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
                            const { image } = await dec.decode({ frameIndex: i });
                            c.width = image.displayWidth;
                            c.height = image.displayHeight;
                            const ctx = c.getContext('2d');
                            ctx.clearRect(0, 0, c.width, c.height);
                            ctx.drawImage(image, 0, 0);
                            urls.push(c.toDataURL());
                            durs.push(Math.max(20, (image.duration ?? 100000) / 1000));
                            image.close();
                        }
                        return { urls, durs, total: durs.reduce((a, b) => a + b, 0) };
                    })(),
                );
            return gifs.get(src);
        };
        let vnow = 0;
        window.__wkFrame = async (dt) => {
            window.__t += dt;
            vnow += dt;
            g.step(window.__t, dt);
            await Promise.all(
                [...document.querySelectorAll('.wk-ph img')].map(async (im) => {
                    const attr = im.getAttribute('src') || '';
                    if (!attr.startsWith('data:') && attr !== im.dataset.gifSrc) {
                        if (!/\.gif(\?|$)/.test(attr)) return;
                        im.dataset.gifSrc = attr;
                        im.dataset.gifT0 = String(vnow);
                    }
                    if (!im.dataset.gifSrc) return;
                    const gif = await loadGif(new URL(im.dataset.gifSrc, location.href).href);
                    let t = (vnow - Number(im.dataset.gifT0)) % gif.total;
                    let i = 0;
                    while (i < gif.durs.length - 1 && t >= gif.durs[i]) t -= gif.durs[i++];
                    if (im.dataset.gifFrame !== String(i)) {
                        im.dataset.gifFrame = String(i);
                        im.src = gif.urls[i];
                        await im.decode().catch(() => {});
                    }
                }),
            );
            return g.scene.getScene('walkout').clock;
        };
    });
    // o Pular é botão de quem joga, não do lance: fora do quadro
    await page.addStyleTag({ content: '.wk-ph-skip{visibility:hidden!important}' });
    const plan = await page.evaluate(() => window.__wkPlan);
    marcas.walkout = n;
    marcas.plano = plan;
    for (let clock = 0, i = 0; clock < plan.end + 1200 && i < 900; i++) {
        clock = await page.evaluate((d) => window.__wkFrame(d), DT);
        await anda(DT);
        await page.evaluate(
            () =>
                new Promise((r) => {
                    const ims = [...document.querySelectorAll('.wk-ph img')];
                    if (ims.every((im) => im.complete)) r();
                    else setTimeout(r, 0);
                }),
        );
        await page.screenshot({ path: join(dir, `${String(n++).padStart(4, '0')}.png`) });
    }
    marcas.walkoutFim = n;
    // os sons do walkout (hora no relógio da cena): ZzFX vira PCM na página, o resto é arquivo do jogo
    const sons = await page.evaluate(() =>
        window.__wkSounds.map((x) => ({ t: x.t, s: x.s, pcm: window.__wkRender?.(x.s) ?? null })),
    );
    const sdir = `${OUT}/walkout-sons`;
    mkdirSync(sdir, { recursive: true });
    const lista = sons.map((x, j) => {
        if (!x.pcm) return { t: x.t, s: x.s };
        const b = Buffer.alloc(44 + x.pcm.length * 2);
        b.write('RIFF', 0);
        b.writeUInt32LE(36 + x.pcm.length * 2, 4);
        b.write('WAVEfmt ', 8);
        b.writeUInt32LE(16, 16);
        b.writeUInt16LE(1, 20);
        b.writeUInt16LE(1, 22);
        b.writeUInt32LE(44100, 24);
        b.writeUInt32LE(88200, 28);
        b.writeUInt16LE(2, 32);
        b.writeUInt16LE(16, 34);
        b.write('data', 36);
        b.writeUInt32LE(x.pcm.length * 2, 40);
        for (let k = 0; k < x.pcm.length; k++)
            b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x.pcm[k] * 32767))), 44 + k * 2);
        writeFileSync(`${sdir}/s${j}.wav`, b);
        return { t: x.t, s: x.s, file: `s${j}.wav` };
    });
    writeFileSync(`${sdir}/sons.json`, JSON.stringify(lista, null, 1));
    // o Continuar do walkout, a carta na mesa (k-pop) e Guardar
    const go = page.locator('.wk-ph-go').first();
    marcas.walkoutContinuar = n + 6;
    n = await grava(page, anda, dir, 8, async (i) => i === 6 && (await go.count()) && (await toca(page, go)), n);
    n = await grava(page, anda, dir, 45, null, n);
    await clica(btn(page, /^Guardar/).first());
    await espera(800);
    // o Dragonite no lugar do Voltorb (o Trocar do Clube) e o Início com o time andando
    const time = await store(page, (m, U) => {
        const u = m.useGame.getState().ultimate;
        const dg = u.cards.find((c) => c.speciesId === 149);
        const byUid = new Map(u.cards.map((c) => [c.uid, c]));
        const i = u.team.order.findIndex((uid) => byUid.get(uid)?.speciesId === 100);
        m.useGame.setState({ ultimate: { ...u, team: U.setMember(u.team, i, dg.uid) } });
        return m.useGame.getState().ultimate.team.order.slice(0, 5).map((uid) => byUid.get(uid)?.speciesId);
    });
    console.log('titulares', time);
    await clica(aba(page, /^\d*\s*início$/i));
    await espera(2500);
    marcas.inicio = n;
    n = await grava(page, anda, dir, 150, async (i) => {
        if (i !== 60) return;
        const d = page.locator('.ut-court .wild-mon[style*="menu/147.png"]').first();
        if (await d.count()) {
            marcas.toqueDratini = n + i;
            await toca(page, d);
        }
    }, n);
    marcas.fim = n;
    writeFileSync(`${dir}/marcas.json`, JSON.stringify(marcas, null, 1));
    console.log(marcas);
    await ctx.close();
}
if (want('inicio')) {
    // o Início de perto (v3): o mesmo save (passe, vitória, marco 2, Abrir todos com o walkout pulado, o Dragonite no
    // lugar do Voltorb), gravado a 6x só no recorte: 180 x 250 px de CSS = 1080 x 1500, nítido, seguindo o meio entre o
    // Dratini e o Dragonite (mola), preso dentro da quadra
    const { ctx, page } = await novoSave(6, false);
    await store(page, (m, U) => {
        let u = m.useGame.getState().ultimate;
        u = U.payPass({ ...u, pass: { day: '', today: 0, pts: 150, marks: 0 } });
        m.useGame.setState({ ultimate: { ...u, pass: { ...u.pass, pts: 260 } } });
    });
    await aba(page, /^\d*\s*jogar$/i).click();
    await page.waitForTimeout(1200);
    await page.locator('.ut-level-chip').first().click();
    await page.waitForTimeout(600);
    await btn(page, /^Fácil$/).first().click();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^JOGAR$/ }).first().click();
    await page.getByRole('button', { name: /^Começar/ }).waitFor({ timeout: 60000 });
    await store(page, (m, U) => {
        const s = m.useGame.getState();
        s.ultimateFinish(s.match);
        s.ultimateRedeem(`pass-${m.useGame.getState().ultimate.season}-2`);
        m.useGame.getState().ultimateSeen();
        m.useGame.setState((x) => ({ ultimate: { ...x.ultimate, packAt: x.ultimate.packAt - 12 * 3600 * 1000 } }));
        m.useGame.getState().go('ultimate');
    });
    await page.waitForTimeout(1500);
    await aba(page, /^\d*\s*loja$/i).click();
    await page.waitForTimeout(1200);
    await btn(page, /^Abrir todos/).first().click();
    await page.waitForTimeout(1000);
    await page.locator('.cpack-btn').click();
    await page.waitForTimeout(3500);
    await btn(page, /^Continuar$/).first().click();
    await page.waitForTimeout(5000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2500);
    const go = page.locator('.wk-ph-go');
    if (await go.count()) await go.first().click();
    await page.waitForTimeout(1500);
    await btn(page, /^Guardar/).first().click();
    await page.waitForTimeout(800);
    const time = await store(page, (m, U) => {
        const u = m.useGame.getState().ultimate;
        const dg = u.cards.find((c) => c.speciesId === 149);
        const byUid = new Map(u.cards.map((c) => [c.uid, c]));
        const i = u.team.order.findIndex((uid) => byUid.get(uid)?.speciesId === 100);
        m.useGame.setState({ ultimate: { ...u, team: U.setMember(u.team, i, dg.uid) } });
        return m.useGame.getState().ultimate.team.order.slice(0, 5).map((uid) => byUid.get(uid)?.speciesId);
    });
    console.log('titulares', time);
    await aba(page, /^\d*\s*início$/i).click();
    await page.waitForTimeout(2500);
    const anda = await congela(page);
    const quadra = await page.locator('.es-court').first().boundingBox();
    console.log('quadra', quadra);
    const W = 180;
    const H = 250;
    const y = Math.round(Math.max(0, quadra.y + quadra.height - H + 6));
    const pos = (id) =>
        page.evaluate((id) => {
            const e = document.querySelector(`.ut-court .wild-mon[style*="menu/${id}.png"]`);
            if (!e) return null;
            const r = e.getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }, id);
    const dir = `${OUT}/inicio6`;
    mkdirSync(dir, { recursive: true });
    let cam = null;
    const marcas = { quadra, y, W, H };
    for (let i = 0; i < 130; i++) {
        const a = await pos(147);
        const b = await pos(149);
        const mid = a && b ? (a.x + b.x) / 2 : (a ?? b)?.x ?? quadra.x + quadra.width / 2;
        const alvo = Math.max(quadra.x, Math.min(quadra.x + quadra.width - W, mid - W / 2));
        cam = cam === null ? alvo : cam + (alvo - cam) * 0.08;
        if (i === 55 && a) {
            marcas.toque = i;
            await dedo(page, a.x, a.y);
            await page.mouse.click(a.x, a.y);
        }
        await page.screenshot({
            path: join(dir, `${String(i).padStart(4, '0')}.png`),
            clip: { x: cam, y, width: W, height: H },
        });
        await anda(DT);
    }
    writeFileSync(`${dir}/marcas.json`, JSON.stringify(marcas, null, 1));
    await ctx.close();
}
await browser.close();
