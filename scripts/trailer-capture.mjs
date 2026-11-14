/**
 * Gravação quadro a quadro de um lance pro trailer (docs/planos/trailer-plano.md). Precisa do `npm run dev`.
 *
 * O loop do Phaser fica parado e cada quadro avança o jogo com `game.step(t, 1000/fps)` (window.__soccermonGame,
 * só no dev). Assim
 * o vídeo sai liso e exato mesmo em máquina lenta. Grava PNGs do canvas da quadra em --out.
 *
 *   node scripts/trailer-capture.mjs --cena golpe --seed trailer26 --de 126 --ate 134 --out trailer/clips/golpe
 *
 * --demo "dribles&tipo=chapeu&gol=1": em vez da cena, um atalho ?demo= que já abre na escalação (o "Lance da semana");
 * aí --ate +N grava N s de partida a partir de onde ela abre.
 * --vertical <altura>: câmera fechada pro 9:16, um recorte de <altura> px do canvas seguindo a bola (528 = metade dos
 * ~1047 do canvas de 1920 de largura, o zoom do Lance da semana), ampliado pra 1080x1920 (pixel nítido); sem os
 * nomes, o marcador vai junto.
 * --de/--ate: segundos de partida (os da caça). --vel: velocidade de reprodução (1 = normal; 0.25 = câmera lenta
 * lisa). --largura: px. --modo canvas|pagina. --nomes / --textos: mantêm os nomes em cima dos Pokémon e os
 * textos do jogo (padrão: sem os dois). --faixa: sem os textos, mas com a faixa do drible com nome (no --vertical ela
 * entra no recorte, como no clipe do jogo). --faixa-y <0..1>: a faixa sempre nessa altura do recorte (a mesma em todos os
 * lances, pra casar com o que a edição põe do lado); --faixa-atraso <ms>: a faixa entra esse tanto depois (no chapéu, depois
 * que a bola passou por cima de onde ela fica).
 * --lento "a:b:f[:r],...": câmera lenta de verdade (o jogo inteiro anda f do passo, sprites e tweens juntos) entre os
 * segundos de partida a e b (os mesmos do --de/--ate; tick/20), com rampa suave de r s (padrão 0,3) de cada lado.
 * CHROME_PATH aponta o Chromium/Chrome; BASE_URL o servidor de dev (padrão http://localhost:8080).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const cena = arg('--cena');
const seed = arg('--seed');
const demo = arg('--demo');
const from = Number(arg('--de', 0));
const ateArg = arg('--ate', String(from + 6));
let to = Number(ateArg.replace('+', ''));
const fps = Number(arg('--fps', 30));
const speed = Number(arg('--vel', 1));
const width = Number(arg('--largura', 1920));
const out = arg('--out', demo ? 'trailer/clips/demo' : `trailer/clips/${cena}-${seed}`);
// canvas: só o jogo, resolução nativa (rápido). pagina: a área da quadra com o HTML por cima (tela de evolução).
const modo = arg('--modo', 'canvas');
// trailer sem os nomes em cima dos Pokémon (quadra mais limpa); --nomes mantém
const semNomes = !args.includes('--nomes');
// sem os textos do jogo (letreiros de golpe, GOOOOL, caixa de narração): o zoom do trailer cortaria; o texto do
// trailer vem da composição. --textos mantém
const semTextos = !args.includes('--textos');
const comFaixa = args.includes('--faixa');
const vertical = Number(arg('--vertical', 0));
const faixaY = arg('--faixa-y') === undefined ? null : Number(arg('--faixa-y'));
const faixaAtraso = Number(arg('--faixa-atraso', 0));
const lentos = (arg('--lento') ?? '')
    .split(',')
    .filter(Boolean)
    .map((x) => {
        const [a, b, f, r = 0.3] = x.split(':').map(Number);
        return { a, b, f, r };
    });
/** Fator da câmera lenta no segundo `t` do lance (1 = normal), com rampa em S. */
const lentoEm = (t) => {
    let k = 1;
    for (const { a, b, f, r } of lentos) {
        const fora = t < a ? (a - t) / r : t > b ? (t - b) / r : 0;
        const s = Math.min(1, fora);
        k = Math.min(k, f + (1 - f) * s * s * (3 - 2 * s));
    }
    return k;
};
if (!demo && (!cena || !seed)) throw new Error('use --cena e --seed (veja scripts/trailer-hunt.ts) ou --demo');

const TICK_RATE = 20; // FUTSAL_5.tickRate
const DT = 1000 / fps;
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser',
    headless: true,
    args: [
        '--no-sandbox',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--autoplay-policy=no-user-gesture-required',
    ],
    protocolTimeout: 600000,
    // jogo em português: os botões que o script procura (Jogar, Começar) são os de PT (o --lang não vale no headless)
    env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR' },
});
const page = await browser.newPage();
await page.setViewport(
    modo === 'pagina'
        ? { width: 1280, height: 960, deviceScaleFactor: width / 1280 }
        : { width, height: Math.round(width * 0.75) },
);
page.on('pageerror', (e) => console.log('[página]', e.message));
page.on('console', (m) => m.text().startsWith('[demo]') && console.log(m.text()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (re) =>
    page.evaluate((src) => {
        const b = [...document.querySelectorAll('button')].find(
            (x) => new RegExp(src).test(x.innerText.trim()) && !x.disabled && x.getBoundingClientRect().width > 0,
        );
        b?.click();
        return !!b;
    }, re);

const query = demo ?? `trailer&cena=${cena}&seed=${seed}`;
await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/?demo=${query}`, {
    waitUntil: 'networkidle0',
    timeout: 300000,
});
await wait(2000);
if (!demo && !(await click('^Jogar '))) throw new Error('não achei o botão Jogar (o atalho ?demo=trailer abriu?)');
// o ?demo= abre na escalação com a partida salva: "Voltar pra partida" abre ela parada (a busca da seed pode demorar)
if (demo) for (let i = 0; i < 600 && !(await click('^Voltar pra partida')); i++) await wait(1000);
// quadra ocupando a largura toda (sem barra lateral), pra gravar na resolução pedida
await page.addStyleTag({
    content:
        '.app{max-width:none!important;padding:0!important}.bc{display:block!important;padding:0!important}.bc-head,.bc-coach,.bc-thumb,.bc-deskbar,.bc-ticker,.topbar{display:none!important}',
});
// pausa o jogo ANTES do "Começar!" (o Ditto se transforma no tick 0)
for (let i = 0; i < 90; i++) {
    const pronto = await page.evaluate(
        (demo) =>
            demo
                ? !!window.__soccermonGame?.scene.getScene('Match')?.snaps?.length
                : !!window.__soccermonGame &&
                  [...document.querySelectorAll('button')].some(
                      (b) => /^Começar/.test(b.innerText.trim()) && !b.disabled,
                  ),
        !!demo,
    );
    if (pronto) break;
    await wait(1000);
}

// tick atual da partida (eventos do Phaser) e controles do jogo
await page.evaluate(() => {
    window.__tick = 0;
    window.__fim = false;
    window.__soccermonBus.on('match:tick', (t) => {
        window.__tick = t.tick;
    });
    window.__soccermonBus.on('match:ended', () => {
        window.__fim = true;
    });
});
const ended = () => page.evaluate(() => window.__fim);
const tick = () => page.evaluate(() => window.__tick);
await page.evaluate(
    (semTextos, comFaixa) => {
        const g = window.__soccermonGame;
        if (semTextos) {
            // tudo que for texto (ou contêiner com texto) já nasce invisível; a caixa de narração some
            const sc = g.scene.getScene('Match');
            const temTexto = (o) => o?.type === 'Text' || (Array.isArray(o?.list) && o.list.some(temTexto));
            const addText = sc.add.text.bind(sc.add);
            sc.add.text = (...a) => addText(...a).setVisible(false);
            const addContainer = sc.add.container.bind(sc.add);
            sc.add.container = (...a) => {
                const c = addContainer(...a);
                if (temTexto(c)) c.setVisible(false);
                return c;
            };
            sc.battleBox?.container?.setVisible(false);
            // --faixa: a faixa grande (drible com nome, golpe) nasce com os textos visíveis
            if (comFaixa) {
                const banner = sc.cine.superBanner.bind(sc.cine);
                const agora = (...a) => {
                    const [t, c] = [sc.add.text, sc.add.container];
                    Object.assign(sc.add, { text: addText, container: addContainer });
                    try {
                        return banner(...a);
                    } finally {
                        Object.assign(sc.add, { text: t, container: c });
                    }
                };
                // (o setTimeout aqui já é o do relógio falso: anda com o jogo, inclusive na câmera lenta)
                sc.cine.superBanner = (...a) =>
                    window.__faixaAtraso ? window.setTimeout(() => agora(...a), window.__faixaAtraso) : agora(...a);
            }
        }
        // a câmera do jogo vai até o gol no GOOOOL e passa da borda da quadra (aparece o fundo de fora): prende ela
        // dentro do mundo do jogo; ela segue indo atrás do lance, só que para na borda
        {
            const cam = g.scene.getScene('Match').cameras.main;
            cam.setBounds(0, 0, cam.width, cam.height);
        }
        g.loop.sleep();
        // os tweens (faixas, letreiros) andam pelo Date.now(), não pelo passo do jogo: gravando a ~3 quadros/s eles corriam
        // 10x (a faixa do drible sumia em 5 quadros). Aqui andam o mesmo `d` de cada quadro gravado
        const tw = g.scene.getScene('Match').tweens;
        tw.getDelta = () => window.__tweenDt ?? 0;
        window.__t = g.loop.now || performance.now();
        // relógio falso pra parte em HTML (tela de evolução, faixas): setTimeout e animações CSS andam com o jogo
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
            window.__vnow = vnow;
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
        // GIFs animados (sprites na tela de evolução, VERSUS) andam no relógio real: decodifica os quadros e troca no
        // compasso do relógio falso, respeitando a duração de cada quadro
        const gifs = new Map();
        const loadGif = (src) => {
            if (!gifs.has(src))
                gifs.set(
                    src,
                    (async () => {
                        const dec = new ImageDecoder({
                            data: await (await fetch(src)).arrayBuffer(),
                            type: 'image/gif',
                        });
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
        window.__gifTick = async () => {
            const imgs = [...document.querySelectorAll('img')].filter((im) =>
                /\.gif(\?|$)/.test(im.dataset.gifSrc || im.getAttribute('src') || ''),
            );
            await Promise.all(
                imgs.map(async (im) => {
                    const attr = im.getAttribute('src') || '';
                    if (!attr.startsWith('data:') && attr !== im.dataset.gifSrc) {
                        im.dataset.gifSrc = attr;
                        im.dataset.gifT0 = String(window.__vnow ?? 0);
                    }
                    const g = await loadGif(new URL(im.dataset.gifSrc, location.href).href);
                    let t = ((window.__vnow ?? 0) - Number(im.dataset.gifT0)) % g.total;
                    let i = 0;
                    while (i < g.durs.length - 1 && t >= g.durs[i]) t -= g.durs[i++];
                    if (im.dataset.gifFrame !== String(i)) {
                        im.dataset.gifFrame = String(i);
                        im.src = g.urls[i];
                        await im.decode().catch(() => {});
                    }
                }),
            );
        };
    },
    semTextos,
    comFaixa,
);
await page.evaluate(
    (y, ms) => {
        window.__faixaY = y;
        window.__faixaAtraso = ms;
    },
    faixaY,
    faixaAtraso,
);
// câmera fechada (--vertical): um recorte 9:16 do canvas seguindo a bola (mola amortecida), ampliado inteiro com o
// vizinho mais próximo e depois reduzido suave pra 1080x1920 (pixel quadrado sem borrar)
await page.evaluate(() => {
    const W = 1080;
    const H = 1920;
    const outC = Object.assign(document.createElement('canvas'), { width: W, height: H });
    const big = document.createElement('canvas');
    let cam = null;
    let corte = null;
    window.__vframe = (src, alto) => {
        const sc = window.__soccermonGame.scene.getScene('Match');
        const kx = src.width / (sc.scale.width || src.width);
        const h = Math.min(alto, src.height);
        const w = Math.round((h * 9) / 16);
        // quem segue: o meio entre a bola e quem dribla até o chute, a bola no chute, e quem fez o gol na comemoração
        let b = sc.ballOnScreen();
        const t = sc.playTick;
        const naTela = (i) => sc.onScreen(sc.players[i].sprite.x, sc.players[i].sprite.y);
        // (a rede balança 0,6 s; aí um corte seco pra quem fez o gol, sem a câmera atravessar a quadra)
        const gol = sc.goalsBy?.filter((g) => t - g.tick > 12 && t - g.tick < 160).pop();
        if (gol && gol !== corte) {
            corte = gol;
            cam = null;
        }
        const drible = sc.named?.find((x) => Math.abs(x.tick - t) < 160);
        const chute = drible && sc.matchEvents.find((e) => e.type === 'shot' && e.tick > drible.tick);
        if (gol) b = naTela(gol.by);
        else if (drible && (!chute || t < chute.tick)) {
            const q = naTela(drible.by);
            // no próprio drible, mais perto de quem dribla: com o meio, a bola no alto (lambreta, chapéu) puxava a câmera
            // pra cima e o Pokémon ia pra beira de baixo do quadro (embaixo da legenda do app); só nele, a bola saía por cima
            const k = Math.abs(t - drible.tick) < 24 ? 0.3 : 0.5;
            b = { x: q.x + (b.x - q.x) * k, y: q.y + (b.y - q.y) * k };
        }
        const alvo = {
            x: Math.max(0, Math.min(src.width - w, b.x * kx - w / 2)),
            y: Math.max(0, Math.min(src.height - h, b.y * kx - h * 0.55)),
        };
        cam = cam ? { x: cam.x + (alvo.x - cam.x) * 0.14, y: cam.y + (alvo.y - cam.y) * 0.14 } : alvo;
        // os textos presos (a faixa) vão pra dentro do recorte, como no clipe do jogo (vale do próximo quadro em diante)
        // (o recorte é só um pedaço da altura do canvas: a altura de cada texto preso vai pra mesma fração do recorte)
        sc.setClipView(cam.x / kx, w / kx);
        const altura = src.height / kx;
        // e encolhem na mesma conta (o clipe do jogo pega a altura toda; este, só `h` px dela), com folga de 20% pros
        // botões do app na direita
        for (const pin of sc.cine.pins.values()) {
            pin.fy ??= window.__faixaY ?? pin.sy / altura;
            pin.k0 ??= pin.scale;
            pin.sy = (cam.y + pin.fy * h) / kx;
            pin.scale = (0.8 * pin.k0 * h) / src.height;
        }
        const k = Math.ceil(H / h);
        big.width = w * k;
        big.height = h * k;
        const g = big.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(src, cam.x, cam.y, w, h, 0, 0, w * k, h * k);
        const o = outC.getContext('2d');
        o.imageSmoothingEnabled = true;
        o.imageSmoothingQuality = 'high';
        o.drawImage(big, 0, 0, W, H);
        return outC.toDataURL('image/png');
    };
});
if (demo) await page.evaluate(() => window.__soccermonBus.emit('match:resume'));
else await click('^Começar');
// grab: lê o canvas na mesma chamada do step (WebGL sem preserveDrawingBuffer: lido depois, às vezes sai preto)
const step = (dt, grab = false) =>
    page.evaluate(
        async (d, gif, semNomes, grab, vertical) => {
            window.__t += d;
            // nomes transparentes ANTES de desenhar (o jogo religa o setVisible a cada quadro; o alpha ele não mexe)
            if (semNomes)
                for (const v of window.__soccermonGame.scene.getScene('Match').players) {
                    v.label?.setAlpha(0);
                    v.badge?.setAlpha(0);
                    if (v.arrow) v.arrow.willRender = () => false;
                }
            window.__tweenDt = d;
            window.__soccermonGame.step(window.__t, d);
            window.__tweenDt = 0;
            window.__vadvance(d);
            if (gif) await window.__gifTick();
            if (!grab) return null;
            const src = document.querySelector('.pitch-wrap canvas');
            return vertical ? window.__vframe(src, vertical) : src.toDataURL('image/png');
        },
        dt,
        modo === 'pagina',
        semNomes,
        grab,
        vertical,
    );

// 1) avança rápido até o começo do lance (8x, sem gravar)
await page.evaluate(() => window.__soccermonBus.emit('match:set-speed', 8));
const t0 = Date.now();
while ((await tick()) < from * TICK_RATE) await step(DT);
if (ateArg.startsWith('+')) {
    // a partida do ?demo= não começa no tick 0: espera o 1º tick dela
    while ((await tick()) === 0) await step(DT);
    to += (await tick()) / TICK_RATE;
}
console.log(`no ponto: tick ${(await tick()).toFixed(0)} (${((Date.now() - t0) / 1000).toFixed(0)} s pra chegar)`);

// 2) grava quadro a quadro na velocidade pedida, direto do canvas do Phaser (resolução nativa do jogo; o print da
// página trava com o tempo parado). As faixas em HTML (gol, evolução) ficam de fora: no trailer o texto é da composição.
await page.evaluate((v) => window.__soccermonBus.emit('match:set-speed', v), speed);
const cdp = await page.createCDPSession();
const box = await page.evaluate(() => {
    const r = document.querySelector('.pitch-wrap').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 };
});
let n = 0;
const t1 = Date.now();
// por quadro: tick da partida e bola na imagem (0..1), pra emendar câmera lenta e mirar o zoom (trailer-uau.mjs)
const meta = [];
// trava: para no fim da partida, ou se o relógio não andar por 30 s de vídeo (cada evolução para a partida ~10 s; podem vir duas seguidas)
let parado = 0;
let ultimo = -1;
while ((await tick()) < to * TICK_RATE) {
    const agora = await tick();
    parado = agora === ultimo ? parado + 1 : 0;
    ultimo = agora;
    if ((await ended()) && parado > fps) {
        console.log('a partida terminou antes de --ate; parando');
        break;
    }
    if (parado > fps * 30 && !(await ended())) {
        console.log(`o relógio parou no tick ${agora.toFixed(0)}; parando`);
        break;
    }
    const url = await step(DT * lentoEm(agora / TICK_RATE), modo !== 'pagina');
    let b64;
    if (modo === 'pagina') {
        ({ data: b64 } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: box }));
    } else {
        b64 = url.split(',')[1];
    }
    writeFileSync(`${out}/${String(++n).padStart(5, '0')}.png`, Buffer.from(b64, 'base64'));
    meta.push(
        await page.evaluate(() => {
            const sc = window.__soccermonGame.scene.getScene('Match');
            const cam = sc.cameras.main;
            const v = cam.worldView;
            return {
                tick: window.__tick,
                bx: (sc.ball.x - v.x) / v.width,
                by: (sc.ball.y - v.y) / v.height,
                zoom: cam.zoom,
            };
        }),
    );
}
writeFileSync(`${out}/quadros.json`, JSON.stringify({ fps, speed, meta }));
console.log(`${n} quadros (${(n / fps).toFixed(1)} s de vídeo) em ${((Date.now() - t1) / 1000).toFixed(0)} s → ${out}`);
console.log(
    `juntar (2x, pixel nítido): ffmpeg -framerate ${fps} -i ${out}/%05d.png -vf scale=iw*2:ih*2:flags=neighbor -c:v libx264 -crf 14 -pix_fmt yuv420p ${out}.mp4`,
);
await browser.close();
