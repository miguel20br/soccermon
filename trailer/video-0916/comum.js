// Vídeo da 0.9.16 (Charmander de capitão): as peças da cena. Carrega depois do GSAP, de midia/sprites.js (SPR, TORCIDA,
// FAS) e de midia/som/eventos.js (EV: cada nota da partitura com o segundo dela). Sprites PMD animados, bola, estouro,
// tremida e a piscada do logo vêm dos curtas (trailer/curtas-2/comum.js, branch curtas-2, que veio do trailer 2 v3);
// a quadra em perspectiva, o selo, os retratos, as cartas, a taça e a Polaroid vêm do animatic A/C
// (trailer/baby-animatic/comum.js); a torcida de retratos, o placar e a placa do Blue vêm do animatic B
// (trailer/baby-b/quadros.html). Tudo centrado em x 540; texto entre y 130 e 1632 (fora dos 15% de baixo).
(() => {
    const EV = window.EV;
    const SPR = window.SPR;

    /** Segundo da linha `row` (16 por compasso) do compasso `bar`, com o swing da peça nas linhas ímpares. */
    const T = (bar, row = 0) => {
        const b0 = EV.compassos[bar];
        const sw = Number.isInteger(row) && row % 2 === 1 ? EV.swing : 0;
        return b0 + ((row + sw) * (EV.compassos[bar + 1] - b0)) / 16;
    };
    /** Instantes das notas de uma faixa entre t0 e t1 (acorde = um instante só). */
    const notas = (parte, t0 = -1, t1 = 1e9) => [...new Set(EV.notas.filter((n) => n[0] === parte && n[1] >= t0 - 1e-4 && n[1] < t1 - 1e-4).map((n) => n[1]))];
    const noCompasso = (parte, b) => notas(parte, EV.compassos[b], EV.compassos[b + 1]);

    const css = `
@font-face { font-family: "Galmuri11"; src: url("midia/Galmuri11-Bold.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Galmuri14"; src: url("midia/Galmuri14.woff2") format("woff2"); }
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; }
#root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Galmuri11", monospace; background: #050814; color: #fff; }
.clip { position: absolute; inset: 0; width: 1080px; height: 1920px; overflow: hidden; }
.camada { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
.clip div, .clip img { position: absolute; }
.clip span { position: relative; }
.ator { left: 0; top: 0; width: 0; height: 0; }
.ator .corpo { left: 0; top: 0; width: 0; height: 0; }
.spr { background-repeat: no-repeat; image-rendering: pixelated; }
.sombra { border-radius: 50%; background: rgb(0 0 0 / 30%); }
.bola { left: 0; top: 0; width: 0; height: 0; }
.bola svg { position: absolute; overflow: visible; }
.flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 90; pointer-events: none; }
.fx { left: 0; top: 0; width: 0; height: 0; z-index: 60; pointer-events: none; }
.fx .estrela, .fx .anel { opacity: 0; }
.fx .anel { box-sizing: border-box; border-radius: 50%; border: 10px solid #fff; }
.nota { left: 0; top: 0; width: 0; height: 0; z-index: 62; opacity: 0; }
.nota svg { position: absolute; left: -22px; top: -76px; overflow: visible; }
.branco { filter: brightness(0) invert(1) drop-shadow(0 0 30px rgb(190 220 255 / 90%)); }
.palco { inset: 0; background: radial-gradient(circle at 50% 45%, #2a3a7a, #070a18 72%); overflow: hidden; }
.raios { left: 50%; top: 45%; width: 3400px; height: 3400px; margin: -1700px 0 0 -1700px; background: repeating-conic-gradient(rgb(255 255 255 / 7%) 0 6deg, transparent 6deg 13deg); }
.raios.forte { background: repeating-conic-gradient(rgb(255 255 255 / 14%) 0 7deg, transparent 7deg 18deg); }
.txt { left: 70px; width: 940px; text-align: center; line-height: 1.18; -webkit-text-stroke: 14px #0e1430; paint-order: stroke fill; text-shadow: 0 8px 0 #0e1430; letter-spacing: 1px; color: #fff; }
.txt b { color: #ffcb05; font-weight: 700; }
.selo { left: 0; width: 1080px; top: 150px; display: flex; justify-content: center; font-size: 40px; letter-spacing: 2px; white-space: nowrap; }
.selo span { padding: 14px 24px 12px; background: #0e1430; border: 5px solid #2a4ea0; box-shadow: 0 8px 0 rgb(0 0 0 / 45%); }
.selo span:first-child { background: #ffcb05; color: #0e1430; border-color: #ffcb05; }
.retrato { width: 200px; height: 200px; border: 8px solid #fff; box-shadow: 0 0 0 8px #0e1430, 0 14px 0 8px rgb(0 0 0 / 40%); background: #20305f; opacity: 0; }
.retrato img { position: static; width: 200px; height: 200px; image-rendering: pixelated; display: block; }
.cap { width: 64px; height: 64px; border-radius: 50%; background: #ffcb05; border: 5px solid #0e1430; color: #0e1430; font-size: 40px; line-height: 64px; text-align: center; box-shadow: 0 4px 0 rgb(0 0 0 / 40%); }
/* arquibancada de retratos (animatic B) */
.fas { left: 0; top: 0; width: 1080px; height: 470px; background: linear-gradient(#0b1026, #1c2447); overflow: hidden; }
.fila { left: 0; width: 1080px; height: 130px; }
.fila::after { content: ''; position: absolute; left: 0; right: 0; bottom: -8px; height: 14px; background: #0e1430; }
.fan { width: 112px; height: 112px; border: 4px solid #0e1430; border-radius: 6px; box-shadow: 0 4px 0 rgb(0 0 0 / 40%); image-rendering: pixelated; background: #2a3a7a; }
/* placar do kit da transmissão */
.tag { left: 70px; top: 482px; background: #ffcb05; color: #0e1430; font-size: 28px; letter-spacing: 2px; padding: 6px 16px 4px; border-radius: 4px; z-index: 8; }
.placar { left: 70px; width: 940px; top: 520px; height: 100px; background: #0e1430; border-radius: 6px; box-shadow: 0 4px 0 #000; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; box-sizing: border-box; color: #f4f1e6; font-size: 38px; letter-spacing: 1px; z-index: 8; }
.placar .n { font-family: "Galmuri14"; font-size: 62px; color: #0e1430; background: #f4f1e6; padding: 2px 18px 0; border-radius: 4px; display: inline-block; }
.placar .x { color: #a6aed6; font-size: 34px; margin: 0 10px; }
.gols { left: 70px; top: 624px; background: #0e1430; color: #ffcb05; font-size: 30px; letter-spacing: 1px; padding: 8px 18px 4px; border-radius: 0 0 6px 6px; z-index: 8; }
/* o Blue e a placa */
.blue { image-rendering: pixelated; filter: drop-shadow(-8px 8px 0 rgb(0 0 0 / 35%)); }
.placa { z-index: 30; }
.placa .por { left: 0; top: 0; width: 100%; height: 100%; box-sizing: border-box; background: #f4f1e6; border: 6px solid #0e1430; border-radius: 8px; box-shadow: 8px 8px 0 rgb(0 0 0 / 45%); }
.placa .fala { left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #0e1430; line-height: 1.12; opacity: 0; }
.placa .fala > span { display: block; white-space: pre; }
.placa i { font-style: normal; color: #e8423f; }
.placa .s { opacity: 0; }
.pilula { left: 0; width: 1080px; display: flex; justify-content: center; }
.pilula span { background: #ffcb05; color: #0e1430; border: 5px solid #0e1430; border-radius: 8px; box-shadow: 0 6px 0 #2a4ea0; font-size: 64px; letter-spacing: 3px; padding: 14px 34px 8px; white-space: nowrap; }
.carta { box-shadow: 0 18px 0 rgb(0 0 0 / 45%), 0 0 0 6px #0e1430; border-radius: 22px; }
`;
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

    const div = (pai, cls, style = '', html = '') => {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        if (style) d.style.cssText = style;
        if (html) d.innerHTML = html;
        pai.appendChild(d);
        return d;
    };
    const img = (pai, src, style = '', cls = '') => {
        const i = document.createElement('img');
        i.src = src;
        if (cls) i.className = cls;
        i.style.cssText = style;
        pai.appendChild(i);
        return i;
    };

    // ===== sprites PMD animados (dos curtas) =====
    function ator(pai, id, { escala = 8, z = 10, sombra = true, x = 0, y = 0, opacity = 1 } = {}) {
        const S = SPR[id];
        const el = div(pai, 'ator', `z-index:${z}`);
        let sh = null;
        if (sombra) {
            const w = (12 + 8 * (S.sombra ?? 1)) * escala;
            sh = div(el, 'sombra', `width:${w}px;height:${w * 0.36}px;left:${-w / 2}px;top:${-w * 0.18}px`);
        }
        const corpo = div(el, 'corpo');
        const spr = div(corpo, 'spr', `background-image:url(${S.folha});background-size:${S.tam[0] * escala}px ${S.tam[1] * escala}px`);
        gsap.set(el, { x, y, opacity, transformOrigin: '0px 0px' });
        gsap.set(corpo, { transformOrigin: '0px 0px' });
        return { id, el, corpo, spr, sh, escala };
    }
    /** Toca a animação `nome` na direção `dir` (0 frente, 2 direita, 4 costas, 6 esquerda) de t0 a t1. A que começou por
     * último manda (o conserto do QA de quadros dos curtas). `hit`: alinha o quadro de contato do AnimData em t0. */
    function anim(tl, a, nome, dir, t0, t1, { vel = 1, loop = true, de = 0, flip = false, hit = false } = {}) {
        const S = SPR[a.id];
        const A = S.anims[nome];
        if (hit) {
            for (let i = 0; i < A.hit; i++) t0 -= A.dur[i] / 60 / vel;
        }
        a.inicios ??= [];
        for (const tw of tl.getTweensOf(a.spr)) if (tw.data <= t0 + 1e-6 && tw.startTime() >= t0 - 1e-6) tw.kill();
        t1 = Math.min(t1, ...a.inicios.filter((u) => u > t0 + 1e-6));
        a.inicios.push(t0);
        const rects = A.rects[A.rects.length === 1 ? 0 : dir];
        const s = a.escala;
        const geo = { width: A.w * s, height: A.h * s, left: (-A.w * s) / 2, top: -A.pe * A.h * s, scaleX: flip ? -1 : 1, transformOrigin: '50% 50%' };
        const pos = (i) => ({ ...geo, backgroundPosition: `${-rects[i][0] * s}px ${-rects[i][1] * s}px`, data: t0 });
        tl.set(a.spr, pos(de), Math.max(0, t0));
        let t = t0;
        let i = de;
        for (let n = 0; n < 2000; n++) {
            t += A.dur[i] / 60 / vel;
            if (t >= t1 - 1e-4) break;
            i++;
            if (i >= rects.length) {
                if (!loop) break;
                i = 0;
            }
            tl.set(a.spr, pos(i), Math.max(0, t));
        }
    }
    const quadro = (tl, a, nome, dir, i, t, op = {}) => anim(tl, a, nome, dir, t, t, { ...op, de: i, loop: false });
    /** Sprite parado (um quadro só), pra torcida pequena e a foto. dir: 0 frente, 2 direita, 4 costas, 6 esquerda. */
    function fixo(pai, id, nome, dir, i, esc, x, y, { sombra = true, z = 2, flip = false } = {}) {
        const S = SPR[id];
        const A = S.anims[nome] ?? S.anims.Idle;
        const [fx, fy] = A.rects[dir % A.rects.length][i % A.rects[0].length];
        const w = A.w * esc;
        const h = A.h * esc;
        if (sombra) div(pai, 'sombra', `left:${x - w * 0.22}px;top:${y - w * 0.06}px;width:${w * 0.44}px;height:${w * 0.12}px;z-index:${z}`);
        return div(pai, 'spr', `left:${x - w / 2}px;top:${y - A.pe * h}px;width:${w}px;height:${h}px;z-index:${z + 1};background-image:url(${S.folha});background-size:${S.tam[0] * esc}px ${S.tam[1] * esc}px;background-position:${-fx * esc}px ${-fy * esc}px;${flip ? 'transform:scaleX(-1);' : ''}`);
    }
    /** A braçadeira de capitão (C) presa no ator. */
    /** A braçadeira de capitão (C) presa no ator, no ombro (pela altura do quadro Idle). */
    const capitao = (a, tam = 1) => {
        const A = SPR[a.id].anims.Idle;
        const h = A.h * a.escala * A.pe;
        return div(a.corpo, 'cap', `left:${A.w * a.escala * 0.18 - 32}px;top:${-h * 0.62 - 32}px;z-index:3;transform:scale(${tam})`, 'C');
    };

    // ===== bola (a textura do jogo, dos curtas) =====
    function bola(pai, { d = 70, z = 20, x = 0, y = 0 } = {}) {
        const el = div(pai, 'bola', `z-index:${z}`);
        const sh = div(el, 'sombra', `width:${d}px;height:${d * 0.34}px;left:${-d / 2}px;top:${-d * 0.17}px`);
        const corpo = div(el, 'corpo', 'left:0;top:0');
        let gomos = '';
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5;
            gomos += `<circle cx="${9 + Math.cos(a) * 7.2}" cy="${9 + Math.sin(a) * 7.2}" r="1.8" fill="#1d1d1d"/>`;
        }
        const pent = Array.from({ length: 5 }, (_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            return `${9 + Math.cos(a) * 3.2},${9 + Math.sin(a) * 3.2}`;
        }).join(' ');
        corpo.innerHTML = `<svg viewBox="0 0 18 18" width="${d}" height="${d}" style="left:${-d / 2}px;top:${-d}px"><g class="gira" style="transform-origin:9px 9px"><circle cx="9" cy="9" r="8" fill="#fff"/><polygon points="${pent}" fill="#1d1d1d"/>${gomos}<circle cx="9" cy="9" r="8" fill="none" stroke="#222" stroke-width="1.5"/></g></svg>`;
        gsap.set(el, { x, y });
        return { el, corpo, sh, gira: corpo.querySelector('.gira'), d };
    }
    /** A bola quica nos instantes `ts` (o 1º é o chute), andando de x0 a x1 e perdendo altura; para no último. */
    function quica(tl, B, ts, x0, x1, h0) {
        const n = ts.length - 1;
        for (let i = 0; i < n; i++) {
            const a = ts[i];
            const b = ts[i + 1];
            const xa = x0 + ((x1 - x0) * (1 - 0.55 ** i)) / (1 - 0.55 ** n);
            const xb = x0 + ((x1 - x0) * (1 - 0.55 ** (i + 1))) / (1 - 0.55 ** n);
            const h = h0 * 0.5 ** i;
            tl.fromTo(B.el, { x: xa }, { x: xb, duration: b - a, ease: 'none', immediateRender: false }, a);
            tl.fromTo(B.corpo, { y: 0 }, { keyframes: { y: [-h, 0], ease: 'sine.inOut' }, duration: b - a, ease: 'none', immediateRender: false }, a);
            tl.fromTo(B.gira, { rotation: i * 40 }, { rotation: (i + 1) * 40, duration: b - a, ease: 'none', immediateRender: false }, a);
            tl.fromTo(B.corpo, { scaleY: 0.82, scaleX: 1.12 }, { scaleY: 1, scaleX: 1, duration: 0.08, immediateRender: false }, a);
        }
    }

    // ===== efeitos (dos curtas) =====
    const ESTRELA = Array.from({ length: 24 }, (_, k) => {
        const a = (k * Math.PI) / 12;
        const r = k % 2 ? 30 : 50;
        return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
    }).join(',');
    function estouro(tl, pai, x, y, t, { tam = 220, cor = '#ffcb05', anel = true, estrela = true, dur = 0.32, z = 60, borda = 10 } = {}) {
        const fx = div(pai, 'fx', `z-index:${z}`);
        gsap.set(fx, { x, y });
        if (estrela) {
            const e = div(fx, 'estrela', `width:${tam}px;height:${tam}px;left:${-tam / 2}px;top:${-tam / 2}px;background:${cor};clip-path:polygon(${ESTRELA})`);
            tl.fromTo(e, { scale: 0.3, rotation: 0, opacity: 1 }, { scale: 1.4, rotation: 25, duration: dur, ease: 'power2.out', immediateRender: false }, t);
            tl.to(e, { opacity: 0, duration: dur, ease: 'power2.in' }, t);
        }
        if (anel) {
            const r = div(fx, 'anel', `width:${tam * 0.8}px;height:${tam * 0.8}px;left:${-tam * 0.4}px;top:${-tam * 0.4}px;border-width:${borda}px`);
            tl.fromTo(r, { scale: 0.4, opacity: 1 }, { scale: 2, duration: dur, ease: 'power2.out', immediateRender: false }, t);
            tl.to(r, { opacity: 0, duration: dur, ease: 'power2.in' }, t);
        }
        return fx;
    }
    /** Notinha (colcheia) que nasce em (x, y), sobe e some. */
    function nota(tl, pai, x, y, t, { cor = '#fff', sobe = 110, dx = 0, dur = 0.8, tam = 1 } = {}) {
        const n = div(pai, 'nota');
        n.innerHTML = `<svg width="${50 * tam}" height="${80 * tam}" viewBox="0 0 50 80"><path d="M30 6 V58" stroke="#0e1430" stroke-width="12" stroke-linecap="round"/><path d="M30 6 C 44 14, 48 24, 42 36" fill="none" stroke="#0e1430" stroke-width="12" stroke-linecap="round"/><ellipse cx="18" cy="62" rx="16" ry="12" transform="rotate(-20 18 62)" fill="#0e1430"/><path d="M30 6 V58" stroke="${cor}" stroke-width="6" stroke-linecap="round"/><path d="M30 6 C 44 14, 48 24, 42 36" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round"/><ellipse cx="18" cy="62" rx="12" ry="8.5" transform="rotate(-20 18 62)" fill="${cor}"/></svg>`;
        gsap.set(n, { x, y });
        tl.fromTo(n, { opacity: 1, scale: 0.4 }, { scale: 1, duration: 0.12, ease: 'back.out(3)', immediateRender: false }, t);
        tl.to(n, { x: x + dx, y: y - sobe, duration: dur, ease: 'power1.out' }, t);
        tl.to(n, { opacity: 0, duration: dur * 0.45, ease: 'power1.in' }, t + dur * 0.55);
        return n;
    }
    function poeira(tl, pai, x, y, t, { n = 6, r = 120, tam = 40, cor = '#f3e3c3' } = {}) {
        for (let i = 0; i < n; i++) {
            const a = Math.PI + (i / (n - 1)) * Math.PI;
            const p = div(pai, 'fx');
            const b = div(p, '', `width:${tam}px;height:${tam}px;left:${-tam / 2}px;top:${-tam / 2}px;border-radius:50%;background:${cor};opacity:0`);
            gsap.set(p, { x, y });
            tl.fromTo(b, { x: 0, y: 0, scale: 0.6, opacity: 0.9 }, { x: Math.cos(a) * r * (i % 2 ? 1 : 1.3), y: Math.sin(a) * r * 0.35, scale: 1.4, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);
        }
    }
    const treme = (tl, alvo, t, f = 1, dur = 0.3) =>
        tl.to(alvo, { keyframes: { x: [22 * f, -18 * f, 13 * f, -8 * f, 4 * f, 0], y: [-10 * f, 9 * f, -6 * f, 4 * f, -2 * f, 0] }, duration: dur, ease: 'none' }, t);
    const flash = (tl, t, o = 0.9, d = 0.3) => tl.fromTo('#flash', { opacity: o }, { opacity: 0, duration: d, ease: 'power2.out', immediateRender: false }, t);
    /** Quadro invertido (o impacto do gol e da evolução): 2 quadros de negativo. */
    const inverte = (tl, alvo, t) => {
        tl.set(alvo, { filter: 'invert(1)' }, t);
        tl.set(alvo, { filter: 'none' }, t + 2 / 30);
    };
    /** Pulinho no corpo (passo, risada, susto). */
    const pula = (tl, a, t, h = 12, d = 0.18) => tl.fromTo(a.corpo, { y: 0 }, { keyframes: { y: [-h, 0], ease: 'sine.out' }, duration: d, ease: 'none', immediateRender: false }, t);
    /** Retrato PMD que entra com pulo (e sai em t1, se tiver). */
    function retrato(tl, pai, arq, x, y, rot, t, t1 = null, { tam = 1, z = 40 } = {}) {
        const r = div(pai, 'retrato', `left:${x - 108}px;top:${y - 108}px;z-index:${z}`, `<img src="midia/r/${arq}.png">`);
        gsap.set(r, { rotation: rot, scale: tam });
        tl.fromTo(r, { opacity: 1, scale: tam * 0.3 }, { scale: tam, duration: 0.25, ease: 'back.out(2.5)', immediateRender: false }, t);
        if (t1 != null) tl.to(r, { opacity: 0, duration: 0.08 }, t1);
        return r;
    }

    // ===== cenário =====
    function palco(pai, forte = false) {
        const p = div(pai, 'palco');
        div(p, `raios${forte ? ' forte' : ''}`);
        return p;
    }
    /** Ginásio visto do chão (animatic A): teto com luzes, arquibancada com a torcida pequena (`cheia` de 0 a 1) e a
     * quadra do jogo em perspectiva, numa caixa própria (o plano 3D não passa por cima de sombra e bola). */
    function ginasio(pai, { quadra = 0, cheia = 0, hz = 820, alto = 440, rx = 62, esc = 1, luzes = 60 } = {}) {
        div(pai, '', `inset:0;background:linear-gradient(180deg,#03050f 0,#0b1030 ${hz - alto}px,#141b40 ${hz}px)`);
        for (let i = 0; i < 5; i++) div(pai, '', `left:${90 + i * 225 - 70}px;top:${luzes}px;width:140px;height:26px;border-radius:5px;background:#fff7d6;box-shadow:0 0 50px 22px rgb(255 240 190 / 45%)`);
        const n = 5;
        const dh = alto / n;
        for (let i = 0; i < n; i++) div(pai, '', `left:0;top:${hz - alto + i * dh}px;width:1080px;height:${dh}px;background:${i % 2 ? '#232d57' : '#1c2447'};border-top:6px solid #4b5a9a`);
        div(pai, '', `left:0;top:${hz - 40}px;width:1080px;height:40px;background:#2a4ea0;border-top:8px solid #ffcb05`);
        const lugares = [];
        for (let i = 0; i < n - 1; i++) for (let j = 0; j < 9; j++) lugares.push([i, j]);
        const ordem = lugares.map((l, k) => [l, (k * 37) % lugares.length]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
        ordem.slice(0, Math.round(cheia * lugares.length)).forEach(([i, j], k) => {
            const id = window.TORCIDA[(i * 9 + j * 5) % window.TORCIDA.length];
            fixo(pai, id, 'Idle', 0, k, 2.6 * esc, 60 + j * 120 + (i % 2) * 50, hz - alto + (i + 1) * dh - 6, { sombra: false, z: 2 + i });
        });
        return quadraPlano(pai, quadra, hz, rx);
    }
    /** A quadra em perspectiva, chapada num PNG (planos.mjs: o plano 3D no DOM sumia com o que estava por cima). */
    function quadraPlano(pai, quadra, top, rx) {
        return img(pai, `midia/plano-${quadra}-${top}-${rx}.png`, `left:0;top:${top}px;width:1080px;height:${1920 - top}px;z-index:1;image-rendering:pixelated`);
    }
    function selo(pai, a, b, top = 150) {
        return div(pai, 'selo', `top:${top}px;z-index:50`, `<span>${a}</span><span>${b}</span>`);
    }
    function texto(pai, html, top, px, extra = '') {
        return div(pai, 'txt', `top:${top}px;font-size:${px}px;z-index:60;${extra}`, html);
    }
    /** Carta real do jogo (570x798), centro em (x, y). */
    function carta(pai, id, x, y, w, rot = 0, z = 10) {
        const i = img(pai, `midia/c-${id}.png`, `left:${x - w / 2}px;top:${y - (w * 798) / 570 / 2}px;width:${w}px;z-index:${z}`, 'carta');
        gsap.set(i, { rotation: rot });
        return i;
    }
    /** O troféu do jogo (PixelTrophy, arte `taca`), em pixel, com a base em (x, y). */
    function taca(pai, x, y, px = 14, z = 30) {
        const ART = ['..hhhhhhhhhhhh..', '.s.hoooooooos.s.', 's..hoooooooos..s', 's..hoooooooos..s', '.s.hoooooooos.s.', '...shooooooos...', '....shooooos....', '.....shooos.....', '......hoos......', '......hoos......', '.....hoooos.....', '....bbbbbbbb....', '...bbbbbbbbbb...', '...bbbbbbbbbb...'];
        const C = { o: '#ffcb05', h: '#fff3a0', s: '#ff8a1c', b: '#6b3e1e' };
        const w = ART[0].length * px;
        const box = div(pai, '', `left:${x - w / 2}px;top:${y - ART.length * px}px;width:${w}px;height:${ART.length * px}px;z-index:${z};filter:drop-shadow(0 0 4px #0e1430) drop-shadow(0 0 3px #0e1430)`);
        ART.forEach((row, r) => {
            [...row].forEach((c, k) => {
                if (C[c]) div(box, '', `left:${k * px}px;top:${r * px}px;width:${px}px;height:${px}px;background:${C[c]}`);
            });
        });
        return box;
    }
    /** Polaroid (animatic C): moldura, foto quadrada (cena de 1080x1080 reduzida pra `lado`) e a legenda. */
    function polaroid(pai, x, y, lado, rot, legenda, desenha, z = 20) {
        const m = 0.05 * lado;
        const f = div(pai, '', `left:${x - lado / 2 - m}px;top:${y - lado / 2 - m}px;width:${lado}px;height:${lado}px;padding:${m}px ${m}px ${lado * 0.2}px;background:#f7f3ea;z-index:${z};box-shadow:0 ${lado * 0.03}px 0 rgb(0 0 0 / 40%),0 0 0 4px #0e1430`);
        gsap.set(f, { rotation: rot });
        const foto = div(f, '', `left:${m}px;top:${m}px;width:${lado}px;height:${lado}px;overflow:hidden;background:#000`);
        const cena = div(foto, '', `left:0;top:0;width:1080px;height:1080px;overflow:hidden;transform-origin:0 0;transform:scale(${lado / 1080})`);
        desenha(cena);
        const leg = div(f, '', `left:0;width:100%;top:${lado + m * 1.6}px;text-align:center;color:#0e1430;font-size:${lado * 0.065}px;letter-spacing:1px`, legenda);
        return { f, foto, leg };
    }
    /** Página do álbum: azul da marca com papel quadriculado leve. */
    function pagina(pai) {
        return div(pai, '', 'inset:0;background:repeating-linear-gradient(0deg,rgb(255 255 255 / 4%) 0 2px,transparent 2px 60px),repeating-linear-gradient(90deg,rgb(255 255 255 / 4%) 0 2px,transparent 2px 60px),radial-gradient(circle at 50% 40%,#2a3a7a,#121a44 75%)');
    }
    /** A foto da turma campeã no Planalto, com o troféu (animatic C). */
    function turmaCampea(c) {
        ginasio(c, { quadra: 9, cheia: 1, hz: 520, alto: 420, luzes: 40, esc: 0.8 });
        [
            [68, 170, 760],
            [65, 330, 720],
            [6, 540, 760],
            [9, 750, 720],
            [130, 920, 780],
        ].forEach(([id, x, y]) => fixo(c, id, 'Idle', 0, 0, id === 130 ? 4 : 5.5, x, y, { z: 10 }));
        taca(c, 540, 1010, 12, 30);
        div(c, 'cap', 'left:600px;top:440px;z-index:20', 'C');
    }

    // ===== a arquibancada de retratos, o placar e a placa (animatic B) =====
    const HUMOR = {
        riso: ['joyous', 'joyous', 'happy', 'joyous'],
        gargalhada: ['joyous'],
        tedio: ['sigh', 'sigh', 'happy', 'sigh'],
        susto: ['surprised', 'surprised', 'surprised', 'sigh'],
        tensao: ['shouting', 'surprised', 'determined', 'shouting'],
        festa: ['inspired', 'joyous', 'shouting', 'inspired'],
    };
    /** 3 fileiras de 8 retratos; devolve as fileiras e as caras (pra trocar o humor no tempo). */
    function arquibancada(pai, humor, { top = 0 } = {}) {
        const box = div(pai, 'fas', `top:${top}px;z-index:4`);
        const filas = [];
        const caras = [];
        for (let r = 0; r < 3; r++) {
            const f = div(box, 'fila', `top:${22 + r * 148}px`);
            filas.push(f);
            window.FAS.slice(r * 8, r * 8 + 8).forEach((id, i) => {
                const c = img(f, `midia/r/${id}-${HUMOR[humor][(i + r) % HUMOR[humor].length]}.png`, `left:${34 + i * 128}px;top:0`, 'fan');
                c.dataset.id = id;
                c.dataset.k = String(i + r);
                caras.push(c);
            });
        }
        return { box, filas, caras };
    }
    /** Troca o humor da torcida em t. */
    const humor = (tl, A, h, t) => {
        for (const c of A.caras) tl.set(c, { attr: { src: `midia/r/${c.dataset.id}-${HUMOR[h][Number(c.dataset.k) % HUMOR[h].length]}.png` } }, t);
    };
    /** A torcida pula nas batidas `ts` (fileiras alternadas); `forte` pula mais e balança. */
    const torcidaPula = (tl, A, ts, { h = 14, gira = 0 } = {}) =>
        ts.forEach((t, k) =>
            A.filas.forEach((f, r) => {
                if ((k + r) % 2 && !gira) return;
                tl.fromTo(f, { y: 0, rotation: 0 }, { keyframes: { y: [-h, 0], rotation: gira ? [(k % 2 ? 1 : -1) * gira, 0] : [0, 0], ease: 'sine.out' }, duration: 0.2, ease: 'none', immediateRender: false }, t);
            }),
        );
    /** O placar do kit da transmissão + a tag de cima e a linha de gols. */
    function placar(pai, { tag, casa = 'PALLET', fora, gc, gf, gols = '' }) {
        div(pai, 'tag', '', tag);
        const p = div(pai, 'placar', '', `<span>${casa}</span><span><span class="n" id="">${gc}</span><span class="x">x</span><span class="n">${gf}</span></span><span>${fora}</span>`);
        const g = gols ? div(pai, 'gols', '', gols) : null;
        const [nc, nf] = p.querySelectorAll('.n');
        return { p, nc, nf, g };
    }
    /** Muda um número do placar em t (pula e troca). */
    const marca = (tl, el, v, t) => {
        tl.set(el, { textContent: String(v) }, t);
        tl.fromTo(el, { scale: 1.6 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, t);
    };
    /** O Blue (técnico rival) virado pra direita, com o pé em (x, y). */
    function blue(pai, x, y, w = 360, z = 28) {
        const b = img(pai, 'midia/blue.png', `left:${x - w / 2}px;top:${y - w}px;width:${w}px;height:${w}px;z-index:${z}`, 'blue');
        gsap.set(b, { scaleX: -1, transformOrigin: '50% 100%' });
        return b;
    }
    /** A placa: cada fala é uma camada; as sílabas aparecem nas notas do trompete. */
    function placa(pai, { x, y, w, h, rot = -3, fs = 74 }) {
        const el = div(pai, 'placa', `left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
        gsap.set(el, { rotation: rot, transformOrigin: '50% 100%' });
        const por = div(el, 'por');
        return { el, por, fs };
    }
    /** Fala `silabas` (HTML de cada uma, '|' quebra a linha) da placa P nos instantes `ts`; aparece em t0 e some em t1. */
    function fala(tl, P, silabas, ts, t0, t1 = null) {
        let html = '<span>';
        silabas.forEach((s, i) => {
            if (s === '|') html += '</span><span>';
            else html += `<span class="s" data-i="${i}">${s}</span>`;
        });
        html += '</span>';
        const f = div(P.el, 'fala', `font-size:${P.fs}px`, html);
        tl.set(f, { opacity: 1 }, t0);
        if (t1 != null) tl.set(f, { opacity: 0 }, t1);
        tl.fromTo(P.el, { scaleY: 0.15 }, { scaleY: 1, duration: 0.16, ease: 'back.out(2.5)', immediateRender: false }, t0);
        const ss = [...f.querySelectorAll('.s')];
        ss.forEach((s, k) => {
            const t = ts[Math.min(k, ts.length - 1)];
            tl.set(s, { opacity: 1 }, t);
            tl.fromTo(s, { scale: 1.5 }, { scale: 1, duration: 0.14, ease: 'back.out(3)', immediateRender: false }, t);
        });
        return f;
    }

    // ===== tela final do trailer 2 v3: a piscada SOC-CER-MON (dos curtas) =====
    function logoPisca(pai, { top = 230, w = 860 } = {}) {
        pai.insertAdjacentHTML(
            'beforeend',
            `<style>
#logo { left: ${540 - w / 2}px; top: ${top}px; width: ${w}px; opacity: 0; isolation: isolate; z-index: 5; }
#logo img { position: relative; display: block; width: 100%; image-rendering: auto; }
#logo .base { z-index: 1; filter: drop-shadow(0 16px 30px rgb(0 0 0 / 55%)); }
#logo .pop { inset: 0; z-index: 2; opacity: 0; }
#logo .pop img { position: absolute; left: 0; top: 0; }
#logo .pop .branco { filter: brightness(0) invert(1); }
#logo .estrela, #logo .anel { top: 50%; width: 38%; aspect-ratio: 1; z-index: 0; opacity: 0; }
#logo .estrela { width: 46%; background: #ffcb05; }
#logo .anel { box-sizing: border-box; border: 12px solid #fff; border-radius: 50%; }
</style>
<div id="logo"><img class="base" src="midia/logo-horizontal.svg" alt="" /></div>`,
        );
        const logo = document.getElementById('logo');
        [
            [0, 34.7],
            [34.7, 67.7],
            [67.7, 100],
        ].forEach(([a, z], i) => {
            const c = (a + z) / 2;
            const corte = `clip-path:inset(0 ${(100 - z).toFixed(1)}% 0 ${a}%)`;
            const src = 'midia/logo-horizontal.svg';
            logo.insertAdjacentHTML('afterbegin', `<div class="estrela" id="est${i}" style="left:${c}%;clip-path:polygon(${ESTRELA})"></div><div class="anel" id="anel${i}" style="left:${c}%"></div>`);
            logo.insertAdjacentHTML('beforeend', `<div class="pop" id="pop${i}" style="transform-origin:${c}% 50%"><img src="${src}" style="${corte}" alt="" /><img class="branco" id="branco${i}" src="${src}" style="${corte}" alt="" /></div>`);
        });
        gsap.set('#logo .estrela, #logo .anel', { xPercent: -50, yPercent: -50 });
        return logo;
    }
    /** As 3 sílabas piscam nos instantes `ts` (SOC, CER, MON): pulo, branco, estrela e anel; no MON `treme` a cena. */
    function piscada(tl, ts, tremer) {
        ts.forEach((t, i) => {
            tl.set(`#pop${i}`, { opacity: 1 }, t);
            tl.fromTo(`#pop${i}`, { scale: 1 }, { keyframes: [{ scale: 1.25, duration: 0.06, ease: 'power2.out' }, { scale: 1, duration: 0.12, ease: 'power2.in' }], immediateRender: false }, t);
            tl.set(`#pop${i}`, { opacity: 0 }, t + 0.18);
            tl.fromTo(`#branco${i}`, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: 'power1.in', immediateRender: false }, t);
            tl.fromTo(`#est${i}`, { scale: 0.4, rotation: 0 }, { scale: 1.5, rotation: 20, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
            tl.fromTo(`#anel${i}`, { scale: 0.5 }, { scale: 2, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
            tl.fromTo([`#est${i}`, `#anel${i}`], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power2.in', immediateRender: false }, t);
            if (i === 2 && tremer)
                tl.to(tremer, { keyframes: { x: [16, -13, 9, -5, 2, 0], y: [-8, 7, -4, 3, -1, 0], scale: [1.03, 1.03, 1.03, 1.02, 1.01, 1] }, duration: 0.25, ease: 'none' }, t);
        });
    }

    window.C = {
        T, notas, noCompasso, div, img, ator, anim, quadro, fixo, capitao, bola, quica, estouro, nota, poeira, treme, flash, inverte, pula, retrato,
        palco, ginasio, quadraPlano, selo, texto, carta, taca, polaroid, pagina, turmaCampea,
        arquibancada, humor, torcidaPula, placar, marca, blue, placa, fala, logoPisca, piscada,
    };
})();
