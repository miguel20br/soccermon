// Cópia de trailer/curtas/comum.js (branch curtas, 22/10/2026) pro curta "O rival evoluiu".
// Curtas promocionais (22/10/2026): o que as duas cenas usam. Carrega depois do GSAP, de midia/sprites.js (SPR) e de
// midia/som/<curta>.js (MUSICA). Tudo é desenhado a partir do jogo: folhas PMD da quadra, a quadra de futsal com as
// medidas e cores de src/game/court.ts e court-themes.ts (girada: o gol fica em cima), a bola do ensureBallTexture e a
// tela final com a piscada do logo do trailer v3 (trailer/v2-abertura).
(() => {
    const M = window.MUSICA;
    const SPR = window.SPR;

    /** Segundo da linha `row` (16 por compasso) do compasso `bar` do curta, com o swing da peça nas linhas ímpares. */
    const T = (bar, row = 0) => {
        const b0 = M.inicios[bar];
        const sw = Number.isInteger(row) && row % 2 === 1 ? M.swing : 0;
        return b0 + ((row + sw) * (M.inicios[bar + 1] - b0)) / 16;
    };

    const css = `
@font-face { font-family: "Galmuri11"; src: url("midia/Galmuri11-Bold.woff2") format("woff2"); font-weight: 700; }
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; }
#root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Galmuri11", monospace; background: #070a18; }
.clip { position: absolute; inset: 0; width: 1080px; height: 1920px; overflow: hidden; }
.camada { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
.ator { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.ator .corpo { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.spr { position: absolute; background-repeat: no-repeat; image-rendering: pixelated; }
.sombra { position: absolute; border-radius: 50%; background: rgb(0 0 0 / 28%); }
.bola { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.bola svg { position: absolute; overflow: visible; }
.flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 80; pointer-events: none; }
.legenda { position: absolute; left: 160px; width: 760px; top: 190px; height: 300px; display: flex; align-items: center; justify-content: center;
  text-align: center; z-index: 40; font-size: 74px; line-height: 1.2; letter-spacing: 2px; color: #fff;
  -webkit-text-stroke: 14px #0e1430; paint-order: stroke fill; text-shadow: 0 8px 0 #0e1430; }
.legenda b { color: #ffcb05; font-weight: 700; }
.palco { background: radial-gradient(circle at 50% 45%, #2a3a7a, #070a18 72%); }
.raios { position: absolute; left: 50%; top: 45%; width: 3400px; height: 3400px; margin: -1700px 0 0 -1700px;
  background: repeating-conic-gradient(rgb(255 255 255 / 7%) 0 6deg, transparent 6deg 13deg); }
.fx { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 30; pointer-events: none; }
.fx .estrela, .fx .anel { position: absolute; opacity: 0; }
.fx .estrela { background: #ffcb05; }
.fx .anel { box-sizing: border-box; border-radius: 50%; border: 10px solid #fff; }
/* caixa de fala do PMD: retrato à esquerda */
.fala { position: absolute; left: 90px; width: 900px; top: 200px; height: 230px; box-sizing: border-box; z-index: 45; display: flex; align-items: center; gap: 34px;
  padding: 0 40px; background: #10183d; border: 8px solid #f8f8f0; border-radius: 18px; box-shadow: 0 0 0 6px #0e1430, 0 14px 0 rgb(0 0 0 / 35%);
  color: #fff; font-size: 96px; letter-spacing: 4px; opacity: 0; }
.fala img { width: 160px; height: 160px; image-rendering: pixelated; border: 6px solid #f8f8f0; border-radius: 10px; background: #2a3a7a; }
/* tela final (a do trailer 2 v3) */
#logo { position: absolute; left: 140px; top: 520px; width: 800px; opacity: 0; isolation: isolate; }
#logo img { display: block; width: 100%; image-rendering: auto; }
#logo .base { position: relative; z-index: 1; filter: drop-shadow(0 16px 30px rgb(0 0 0 / 55%)); }
#logo .pop { position: absolute; inset: 0; z-index: 2; opacity: 0; }
#logo .pop img { position: absolute; left: 0; top: 0; }
#logo .pop .branco { filter: brightness(0) invert(1); }
#logo .estrela, #logo .anel { position: absolute; top: 50%; width: 38%; aspect-ratio: 1; z-index: 0; opacity: 0; }
#logo .estrela { width: 46%; background: #ffcb05; }
#logo .anel { box-sizing: border-box; border: 12px solid #fff; border-radius: 50%; }
.tag { position: absolute; left: 110px; width: 860px; top: 750px; text-align: center; font-size: 66px; letter-spacing: 3px; color: #ffcb05; text-shadow: 7px 8px 0 #0e1430; white-space: nowrap; opacity: 0; }
.site { position: absolute; left: 110px; width: 860px; top: 890px; text-align: center; font-size: 62px; letter-spacing: 2px; color: #fff; opacity: 0; }
.selo { position: absolute; left: 110px; width: 860px; top: 1000px; display: flex; justify-content: center; opacity: 0; }
.selo span { padding: 18px 30px; border-radius: 14px; background: #e8423f; color: #fff; font-size: 38px; line-height: 1.3; letter-spacing: 2px; box-shadow: 0 7px 0 #8c1d1b; text-align: center; }
.credito { position: absolute; left: 110px; width: 860px; top: 1560px; text-align: center; font-size: 34px; color: #9aa6d8; letter-spacing: 1px; opacity: 0; }
`;
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

    const div = (pai, cls, style = '') => {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        if (style) d.style.cssText = style;
        pai.appendChild(d);
        return d;
    };

    // ===== quadra (src/game/court.ts girada: x da tela = largura da quadra, y = comprimento a partir do gol) =====
    const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
    const TEMAS = {
        // quadra de madeira de sempre (WOOD)
        madeira: { surround: 0x7a4a2a, rim: 0xc98a4f, floor: { kind: 'stripes', size: 24, tones: [0xcf9358, 0xc68649] }, area: 0x3a7bd5, areaAlpha: 0.55 },
        // ginásio da Sabrina (a quadra da partida do trailer 2)
        sabrina: { surround: 0x4a2440, rim: 0xb87aa3, floor: { kind: 'checker', size: 33, tones: [0xd79bbf, 0xcc8fb4] }, area: 0x8a3fc8, areaAlpha: 0.45, aneis: true },
    };
    const PPM = 22;
    /**
     * A quadra num <svg> do tamanho da tela. `K` px por metro; `gy` = y da linha do gol; o centro da largura fica em
     * x 540. Devolve `P(X, Y)` (metros → px da tela).
     */
    function quadra(pai, nome, { K = 90, gy = 640 } = {}) {
        const t = TEMAS[nome];
        const m = (px) => px / PPM; // px do jogo → metros
        const W = 20;
        const Lc = 40;
        const ox = 540 - (W / 2) * K;
        const P = (X, Y) => ({ x: ox + X * K, y: gy + Y * K });
        const lw = m(2);
        const o = [];
        o.push(`<rect x="-30" y="-30" width="${W + 60}" height="${Lc + 60}" fill="${hex(t.surround)}"/>`);
        const r = m(14);
        o.push(`<rect x="${-r}" y="${-r}" width="${W + 2 * r}" height="${Lc + 2 * r}" fill="${hex(t.rim)}"/>`);
        const f = t.floor;
        const s = m(f.size);
        if (f.kind === 'stripes')
            // as tábuas correm ao longo do comprimento no jogo; girada, viram faixas na horizontal
            for (let i = 0; i * s < Lc; i++) o.push(`<rect x="0" y="${i * s}" width="${W}" height="${Math.min(s, Lc - i * s)}" fill="${hex(f.tones[i % 2])}"/>`);
        else
            for (let j = 0; j * s < Lc; j++)
                for (let i = 0; i * s < W; i++)
                    o.push(`<rect x="${i * s}" y="${j * s}" width="${Math.min(s, W - i * s)}" height="${Math.min(s, Lc - j * s)}" fill="${hex(f.tones[(i + j) % 2])}"/>`);
        if (t.aneis)
            for (let y = 1.6; y < Lc; y += m(70))
                for (const x of [-1, W + 1])
                    for (let k = 3; k >= 1; k--) o.push(`<circle cx="${x}" cy="${y}" r="${m(4 * k)}" fill="none" stroke="#f2a6d6" stroke-opacity="${0.18 + 0.16 * k}" stroke-width="${m(1.5)}"/>`);
        // área: dois quartos de círculo de 6 m a partir das traves
        const a = `M ${W / 2 - 1.5 - 6} 0 A 6 6 0 0 0 ${W / 2 - 1.5} 6 L ${W / 2 + 1.5} 6 A 6 6 0 0 0 ${W / 2 + 1.5 + 6} 0`;
        o.push(`<path d="${a} Z" fill="${hex(t.area)}" fill-opacity="${t.areaAlpha}"/>`);
        o.push(`<g fill="none" stroke="#fff" stroke-opacity="0.95" stroke-width="${lw}"><rect x="0" y="0" width="${W}" height="${Lc}"/><line x1="0" y1="20" x2="${W}" y2="20"/><circle cx="${W / 2}" cy="20" r="3"/><path d="${a}"/></g>`);
        for (const y of [6, 10]) o.push(`<circle cx="${W / 2}" cy="${y}" r="${m(2.5)}" fill="#fff"/>`);
        // gol: 3 m de boca, 1 m de fundo, rede em 6 faixas (a rede é um grupo próprio: ela estufa no gol)
        const g0 = W / 2 - 1.5;
        let rede = `<rect x="${g0}" y="-1" width="3" height="1" fill="#fff" fill-opacity="0.25"/>`;
        for (let i = 1; i < 6; i++) rede += `<line x1="${g0 + i * 0.5}" y1="-1" x2="${g0 + i * 0.5}" y2="0" stroke="#fff" stroke-opacity="0.5" stroke-width="${m(1)}"/>`;
        for (let j = 1; j < 3; j++) rede += `<line x1="${g0}" y1="${-j / 3}" x2="${g0 + 3}" y2="${-j / 3}" stroke="#fff" stroke-opacity="0.35" stroke-width="${m(1)}"/>`;
        const svg = `<svg class="camada" viewBox="0 0 1080 1920" style="overflow:visible"><g transform="translate(${ox} ${gy}) scale(${K})">${o.join('')}
<g id="rede" style="transform-box:fill-box;transform-origin:50% 100%">${rede}</g>
<rect id="trave-e" x="${g0 - m(1.5)}" y="-1" width="${m(3)}" height="1" fill="#fff"/><rect id="trave-d" x="${g0 + 3 - m(1.5)}" y="-1" width="${m(3)}" height="1" fill="#fff"/>
<rect x="${g0}" y="-1" width="3" height="1" fill="none" stroke="#fff" stroke-width="${m(3)}"/></g></svg>`;
        pai.insertAdjacentHTML('beforeend', svg);
        return P;
    }

    // ===== sprites PMD =====
    /**
     * Um Pokémon: `el` fica no pé (mova com x/y do GSAP; escala pelo pé), `corpo` dentro (pulos e balanço sem brigar com
     * o caminho), `spr` é o quadro. `escala` = px da tela por px da folha.
     */
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

    /**
     * Toca a animação `nome` na direção `dir` (0 = de frente, 2 = direita, 4 = de costas, 6 = esquerda) de t0 a t1,
     * trocando o quadro pelas durações do AnimData (1/60 s). `vel` acelera; `de` = quadro inicial; sem `loop` para no
     * último; `id` troca a folha (o Sleep do Snorlax mora no atlas extra, '143x'); `flip` espelha.
     * A animação que começou por último manda: ela apaga as trocas de quadro que uma anterior ainda tinha agendado
     * de t0 em diante e para onde começa uma posterior. Sem isso o Walk que terminava depois do Shoot começar punha o
     * quadro do Walk no retângulo do Shoot (maior) e aparecia um pedaço dos quadros vizinhos: o Pikachu em dobro em 13,6 s.
     */
    function anim(tl, a, nome, dir, t0, t1, { vel = 1, loop = true, de = 0, id = a.id, flip = false } = {}) {
        a.inicios ??= [];
        for (const tw of tl.getTweensOf(a.spr)) if (tw.data <= t0 + 1e-6 && tw.startTime() >= t0 - 1e-6) tw.kill();
        t1 = Math.min(t1, ...a.inicios.filter((u) => u > t0 + 1e-6));
        a.inicios.push(t0);
        const S = SPR[id];
        const A = S.anims[nome];
        const rects = A.rects[A.rects.length === 1 ? 0 : dir];
        const s = a.escala;
        const pos = (i) => `${-rects[i][0] * s}px ${-rects[i][1] * s}px`;
        tl.set(
            a.spr,
            {
                width: A.w * s,
                height: A.h * s,
                left: (-A.w * s) / 2,
                top: -A.pe * A.h * s,
                backgroundImage: `url(${S.folha})`,
                backgroundSize: `${S.tam[0] * s}px ${S.tam[1] * s}px`,
                backgroundPosition: pos(de),
                scaleX: flip ? -1 : 1,
                transformOrigin: '50% 50%',
                data: t0,
            },
            t0,
        );
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
            tl.set(a.spr, { backgroundPosition: pos(i), data: t0 }, t);
        }
    }
    /** Um quadro parado. */
    const quadro = (tl, a, nome, dir, i, t, op = {}) => anim(tl, a, nome, dir, t, t, { ...op, de: i, loop: false });
    /** Passos marcados: o quadro da animação avança um a cada instante de `ts` (a ponta do pé no pizzicato). */
    function passos(tl, a, nome, dir, ts, op = {}) {
        const A = SPR[op.id ?? a.id].anims[nome];
        ts.forEach((t, k) => quadro(tl, a, nome, dir, k % A.rects[0].length, t, op));
    }
    /** Mostra/esconde no tempo. */
    const ver = (tl, a, t, on = true) => tl.set(a.el ?? a, { opacity: on ? 1 : 0 }, t);

    // ===== bola (a textura do jogo: branca, pentágono e gomos pretos, contorno escuro) =====
    function bola(pai, { d = 76, z = 20, x = 0, y = 0 } = {}) {
        const el = div(pai, 'bola', `z-index:${z}`);
        const sh = div(el, 'sombra', `width:${d}px;height:${d * 0.4}px;left:${-d / 2}px;top:${-d * 0.2}px`);
        const corpo = div(el, 'corpo');
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
        return { el, corpo, sh, gira: corpo.querySelector('.gira') };
    }

    // ===== efeitos =====
    const ESTRELA = Array.from({ length: 24 }, (_, k) => {
        const a = (k * Math.PI) / 12;
        const r = k % 2 ? 30 : 50;
        return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
    }).join(',');
    /** Estrela dourada chapada + anel branco que estouram em (x, y): o mesmo estouro da piscada do logo. */
    function estouro(tl, pai, x, y, t, { tam = 220, cor = '#ffcb05', anel = true, dur = 0.32 } = {}) {
        const fx = div(pai, 'fx');
        gsap.set(fx, { x, y });
        const e = div(fx, 'estrela', `width:${tam}px;height:${tam}px;left:${-tam / 2}px;top:${-tam / 2}px;background:${cor};clip-path:polygon(${ESTRELA})`);
        tl.fromTo(e, { scale: 0.3, rotation: 0, opacity: 1 }, { scale: 1.4, rotation: 25, duration: dur, ease: 'power2.out', immediateRender: false }, t);
        tl.to(e, { opacity: 0, duration: dur, ease: 'power2.in' }, t);
        if (anel) {
            const r = div(fx, 'anel', `width:${tam * 0.8}px;height:${tam * 0.8}px;left:${-tam * 0.4}px;top:${-tam * 0.4}px`);
            tl.fromTo(r, { scale: 0.4, opacity: 1 }, { scale: 2, duration: dur, ease: 'power2.out', immediateRender: false }, t);
            tl.to(r, { opacity: 0, duration: dur, ease: 'power2.in' }, t);
        }
        return fx;
    }
    /** Poeira: bolinhas que abrem dos pés pros lados. */
    function poeira(tl, pai, x, y, t, { n = 6, r = 120, tam = 40, cor = '#f3e3c3' } = {}) {
        for (let i = 0; i < n; i++) {
            const a = Math.PI + (i / (n - 1)) * Math.PI;
            const p = div(pai, 'fx');
            const b = div(p, '', `position:absolute;width:${tam}px;height:${tam}px;left:${-tam / 2}px;top:${-tam / 2}px;border-radius:50%;background:${cor};opacity:0`);
            gsap.set(p, { x, y });
            tl.fromTo(b, { x: 0, y: 0, scale: 0.6, opacity: 0.9 }, { x: Math.cos(a) * r * (i % 2 ? 1 : 1.3), y: Math.sin(a) * r * 0.35, scale: 1.4, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);
        }
    }
    /** Tremida da tela (num elemento de fora: o de dentro pode ter o zoom da câmera). */
    const treme = (tl, alvo, t, f = 1, dur = 0.3) =>
        tl.to(alvo, { keyframes: { x: [22 * f, -18 * f, 13 * f, -8 * f, 4 * f, 0], y: [-10 * f, 9 * f, -6 * f, 4 * f, -2 * f, 0] }, duration: dur, ease: 'none' }, t);
    const flash = (tl, t, o = 0.9, d = 0.3) => tl.fromTo('#flash', { opacity: o }, { opacity: 0, duration: d, ease: 'power2.out', immediateRender: false }, t);

    // ===== torcida: uma fileira de Pokémon de costas na beira de baixo (a câmera está atrás deles) =====
    function torcida(pai, { y = 1985, escala = 9, z = 50, ids = window.TORCIDA } = {}) {
        const n = ids.length;
        return ids.map((id, i) => {
            const linha = i % 2;
            const x = -20 + ((i + 0.5) * 1120) / n + (linha ? 18 : -18);
            const a = ator(pai, id, { escala, z: z + linha, sombra: false, x, y: y + (linha ? 0 : -70) });
            return a;
        });
    }
    /** A torcida pula junto (o Hop do PMD sobe demais pra quem está cortado na beira), cada um com um atraso. */
    function torcidaPulo(tl, fila, t, { h = 45, d = 0.3, atraso = 0.03 } = {}) {
        fila.forEach((a, i) => tl.to(a.corpo, { keyframes: { y: [-h, 0] }, duration: d, ease: 'power1.inOut' }, t + ((i * 7) % 5) * atraso));
    }
    /** A torcida numa animação, cada um num quadro diferente pra não sair em bloco (todos desenhados desde o t0). */
    function torcidaAnim(tl, fila, nome, t0, t1, { dir = 4, vel = 1 } = {}) {
        fila.forEach((a, i) => anim(tl, a, nome, dir, t0, t1, { vel, de: i % SPR[a.id].anims[nome].rects[0].length }));
    }

    // ===== caixa de fala do PMD =====
    function fala(pai, retrato, texto, id) {
        const f = div(pai, 'fala');
        if (id) f.id = id;
        f.innerHTML = `<img src="${retrato}" alt="" /><span>${texto}</span>`;
        return f;
    }

    // ===== tela final do trailer 2 v3: logo com a piscada SOC-CER-MON, tag, site, selo e crédito =====
    function telaFinal(pai) {
        pai.insertAdjacentHTML(
            'beforeend',
            `<div id="logo"><img class="base" src="midia/logo-horizontal.svg" alt="" /></div>
<div class="tag" id="tag">Temos que chutar!</div><div class="site" id="site">soccermon.com</div>
<div class="selo" id="selo"><span>grátis no navegador<br>fan game sem fins lucrativos</span></div>
<div class="credito" id="credito">Música original: Soccermon</div>`,
        );
        const logo = document.getElementById('logo');
        const SIL = [
            [0, 34.7],
            [34.7, 67.7],
            [67.7, 100],
        ];
        SIL.forEach(([a, z], i) => {
            const c = (a + z) / 2;
            const corte = `clip-path:inset(0 ${(100 - z).toFixed(1)}% 0 ${a}%)`;
            const src = 'midia/logo-horizontal.svg';
            logo.insertAdjacentHTML('afterbegin', `<div class="estrela" id="est${i}" style="left:${c}%;clip-path:polygon(${ESTRELA})"></div><div class="anel" id="anel${i}" style="left:${c}%"></div>`);
            logo.insertAdjacentHTML('beforeend', `<div class="pop" id="pop${i}" style="transform-origin:${c}% 50%"><img src="${src}" style="${corte}" alt="" /><img class="branco" id="branco${i}" src="${src}" style="${corte}" alt="" /></div>`);
        });
        gsap.set('#logo .estrela, #logo .anel', { xPercent: -50, yPercent: -50 });
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

    window.C = { T, div, quadra, ator, anim, quadro, passos, ver, bola, estouro, poeira, treme, flash, torcida, torcidaAnim, torcidaPulo, fala, telaFinal, piscada };
})();
