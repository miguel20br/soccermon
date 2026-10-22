// Curtas 2 (22/10/2026): o que as duas cenas usam ("Ginásio vazio" e "Acendam as luzes"). Carrega depois do GSAP, de
// midia/sprites.js (SPR) e de midia/som/<peça>.js (EV: cada nota da partitura com o segundo dela). Sprites, bola,
// estouro, tela final e a piscada do logo vêm de trailer/curtas/comum.js (curtas 1, que veio do trailer v3); aqui
// entra o ginásio visto de lado (teto com os bancos de luz, placar, arquibancada, porta, piso de madeira e o gol).
(() => {
    const EV = window.EV;
    const SPR = window.SPR;

    /** Segundo da linha `row` (16 por compasso) do compasso `bar`, com o swing da peça nas linhas ímpares. */
    const T = (bar, row = 0) => {
        const b0 = EV.compassos[bar];
        const sw = Number.isInteger(row) && row % 2 === 1 ? EV.swing : 0;
        return b0 + ((row + sw) * (EV.compassos[bar + 1] - b0)) / 16;
    };
    /** Notas de uma faixa: [{ t, m, len, v }], opcionalmente só entre t0 e t1. */
    const notas = (parte, t0 = -1, t1 = 1e9) =>
        EV.notas.filter((n) => n[0] === parte && n[1] >= t0 && n[1] < t1).map(([, t, m, len, v]) => ({ t, m, len, v }));
    /** Instantes únicos (acorde = um instante só). */
    const instantes = (ns) => [...new Set(ns.map((n) => n.t))];

    const css = `
@font-face { font-family: "Galmuri11"; src: url("midia/Galmuri11-Bold.woff2") format("woff2"); font-weight: 700; }
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; }
#root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Galmuri11", monospace; background: #050814; }
.clip { position: absolute; inset: 0; width: 1080px; height: 1920px; overflow: hidden; }
.camada { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
.ator { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.ator .corpo { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.spr { position: absolute; background-repeat: no-repeat; image-rendering: pixelated; }
.sombra { position: absolute; border-radius: 50%; background: rgb(0 0 0 / 30%); }
.bola { position: absolute; left: 0; top: 0; width: 0; height: 0; }
.bola svg { position: absolute; overflow: visible; }
.flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 90; pointer-events: none; }
.legenda { position: absolute; left: 110px; width: 860px; top: 600px; height: 200px; display: flex; align-items: center; justify-content: center;
  text-align: center; z-index: 70; font-size: 72px; line-height: 1.2; letter-spacing: 2px; color: #fff; opacity: 0;
  -webkit-text-stroke: 14px #0e1430; paint-order: stroke fill; text-shadow: 0 8px 0 #0e1430; }
.legenda b { color: #ffcb05; font-weight: 700; }
.palco { background: radial-gradient(circle at 50% 45%, #2a3a7a, #070a18 72%); }
.raios { position: absolute; left: 50%; top: 45%; width: 3400px; height: 3400px; margin: -1700px 0 0 -1700px;
  background: repeating-conic-gradient(rgb(255 255 255 / 7%) 0 6deg, transparent 6deg 13deg); }
.fx { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 60; pointer-events: none; }
.fx .estrela, .fx .anel { position: absolute; opacity: 0; }
.fx .anel { box-sizing: border-box; border-radius: 50%; border: 10px solid #fff; }
.nota { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 62; opacity: 0; }
.nota svg { position: absolute; left: -22px; top: -76px; overflow: visible; }
.etq { position: absolute; left: 0; top: 0; z-index: 75; opacity: 0; }
.etq span { position: absolute; transform: translate(-50%, -100%); white-space: nowrap; padding: 10px 22px 8px; border-radius: 10px; background: #ffcb05; color: #0e1430;
  font-size: 44px; letter-spacing: 3px; box-shadow: 0 0 0 5px #0e1430, 0 9px 0 #0e1430; }
.etq i { position: absolute; left: -3px; width: 6px; background: #ffcb05; box-shadow: 0 0 0 4px #0e1430; }
/* ginásio */
.luzcone { position: absolute; top: 175px; height: 1400px; opacity: 0; z-index: 41; mix-blend-mode: screen; pointer-events: none;
  background: linear-gradient(180deg, rgb(255 242 200 / 34%), rgb(255 236 190 / 9%) 70%, rgb(255 236 190 / 0%));
  clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%); }
.banco { position: absolute; top: 120px; width: 240px; height: 56px; margin-left: -120px; z-index: 42; border-radius: 6px; background: #0e1430; box-shadow: 0 0 0 5px #1b2350, 0 10px 0 #000; }
.banco .aceso { position: absolute; inset: 0; opacity: 0; border-radius: 6px; }
.banco .aceso b { position: absolute; top: 14px; width: 40px; height: 28px; border-radius: 4px; background: #fff7d6; box-shadow: 0 0 26px 10px rgb(255 240 190 / 70%); }
#noite { position: absolute; inset: 0; background: #03050f; opacity: 1; z-index: 40; pointer-events: none; }
.placar { position: absolute; left: 300px; top: 300px; width: 480px; height: 230px; z-index: 5; box-sizing: border-box; border-radius: 14px;
  background: #0e1430; border: 8px solid #1b2350; box-shadow: 0 12px 0 #000; }
.placar .lamp { position: absolute; top: 14px; width: 26px; height: 26px; border-radius: 50%; background: #2a2f4a; }
.placar .lamp.on { background: #ffcb05; box-shadow: 0 0 22px 6px rgb(255 203 5 / 75%); opacity: 0; }
.placar .dig { position: absolute; top: 62px; width: 120px; height: 130px; border-radius: 8px; background: #070a18; color: #3a2a12; font-size: 112px; line-height: 132px; text-align: center; }
.placar .dig.on { color: #ff8a1c; text-shadow: 0 0 18px rgb(255 138 28 / 70%); background: transparent; opacity: 0; }
.placar .rel { position: absolute; left: 170px; top: 92px; width: 124px; height: 70px; border-radius: 6px; background: #070a18; color: #2a3a2a; font-size: 50px; line-height: 72px; text-align: center; }
.placar .rel.on { color: #58c26b; text-shadow: 0 0 14px rgb(88 194 107 / 70%); background: transparent; opacity: 0; }
.porta-luz { position: absolute; z-index: 43; opacity: 0; mix-blend-mode: screen; pointer-events: none; }
`;
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

    const div = (pai, cls, style = '') => {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        if (style) d.style.cssText = style;
        pai.appendChild(d);
        return d;
    };

    // ===== o ginásio visto de lado =====
    const PISO = 1150; // y onde a parede encontra o piso
    const BANCOS = [200, 540, 880];
    const PORTA = { x: 40, w: 170, top: 880 };
    const GOL = { x: 800, topo: 1070, pe: 1360 };
    /** Desenha o ginásio em `pai` e devolve os elementos que a cena anima. `bancos`: x de cada banco de luz; `cone` e
     * `larg`: largura do facho e da luminária. */
    function ginasio(pai, { bancos = BANCOS, cone = 720, larg = 240 } = {}) {
        const o = [];
        // teto e parede
        o.push('<rect x="0" y="0" width="1080" height="260" fill="#0b1030"/>');
        for (let x = -40; x < 1120; x += 120) o.push(`<path d="M${x} 0 L${x + 60} 90 L${x + 120} 0" fill="none" stroke="#1b2350" stroke-width="10"/>`);
        o.push('<rect x="0" y="90" width="1080" height="10" fill="#1b2350"/>');
        o.push(`<rect x="0" y="260" width="1080" height="${PISO - 260}" fill="#2c3868"/>`);
        o.push('<rect x="0" y="260" width="1080" height="18" fill="#3a4a86"/>');
        // faixa da parede (azul e dourado, as cores do jogo)
        o.push('<rect x="0" y="600" width="1080" height="26" fill="#2a4ea0"/><rect x="0" y="626" width="1080" height="8" fill="#ffcb05"/>');
        // arquibancada: 4 degraus
        for (let i = 0; i < 4; i++) {
            const y = 760 + i * 98;
            o.push(`<rect x="250" y="${y}" width="830" height="98" fill="${i % 2 ? '#232d57' : '#1c2447'}"/>`);
            o.push(`<rect x="250" y="${y}" width="830" height="10" fill="#4b5a9a"/>`);
        }
        o.push('<rect x="236" y="740" width="14" height="410" fill="#4b5a9a"/>');
        // porta (fechada: a luz de dentro entra quando ela abre)
        o.push(`<rect x="${PORTA.x - 14}" y="${PORTA.top - 14}" width="${PORTA.w + 28}" height="${PISO - PORTA.top + 14}" fill="#4b5a9a"/>`);
        o.push(`<rect id="porta-vao" x="${PORTA.x}" y="${PORTA.top}" width="${PORTA.w}" height="${PISO - PORTA.top}" fill="#10173a"/>`);
        // caixa dos interruptores do lado da porta
        o.push('<rect x="222" y="1020" width="40" height="70" rx="5" fill="#0e1430" stroke="#4b5a9a" stroke-width="5"/>');
        // piso: tábuas em perspectiva (mais largas perto da câmera)
        let y = PISO;
        for (let i = 0; y < 1920; i++) {
            const h = 34 + i * 7;
            o.push(`<rect x="0" y="${y}" width="1080" height="${h}" fill="${i % 2 ? '#c68649' : '#cf9358'}"/>`);
            y += h;
        }
        o.push(`<rect x="0" y="${PISO}" width="1080" height="14" fill="#7a4a2a"/>`);
        // linhas da quadra: lateral do fundo, meio (de lado) e a lateral da frente
        o.push('<rect x="0" y="1230" width="1080" height="8" fill="#fff" fill-opacity="0.9"/>');
        o.push('<rect x="0" y="1800" width="1080" height="14" fill="#fff" fill-opacity="0.9"/>');
        o.push('<path d="M 300 1238 L 250 1800" stroke="#fff" stroke-opacity="0.9" stroke-width="10"/>');
        o.push(`<path d="M ${GOL.x - 80} 1238 L ${GOL.x - 80} 1800" stroke="#3a7bd5" stroke-opacity="0.35" stroke-width="160"/>`);
        pai.insertAdjacentHTML('beforeend', `<svg class="camada" viewBox="0 0 1080 1920">${o.join('')}</svg>`);

        // gol de lado (boca pra esquerda): rede num grupo próprio (estufa na caixa), traves na frente
        let rede = '';
        for (let i = 0; i <= 8; i++) rede += `<line x1="${GOL.x + i * 22}" y1="${GOL.topo + i * 4}" x2="${GOL.x + i * 22}" y2="${GOL.pe}" stroke="#fff" stroke-opacity="0.55" stroke-width="4"/>`;
        for (let j = 0; j <= 7; j++) {
            const yy = GOL.topo + j * ((GOL.pe - GOL.topo) / 7);
            rede += `<line x1="${GOL.x}" y1="${yy}" x2="${GOL.x + 176}" y2="${yy + (1 - j / 7) * 32}" stroke="#fff" stroke-opacity="0.45" stroke-width="4"/>`;
        }
        pai.insertAdjacentHTML(
            'beforeend',
            `<svg class="camada" viewBox="0 0 1080 1920" style="z-index:18;overflow:visible">
<g id="rede" style="transform-box:fill-box;transform-origin:0% 60%"><path d="M${GOL.x} ${GOL.topo} L${GOL.x + 176} ${GOL.topo + 32} L${GOL.x + 176} ${GOL.pe} L${GOL.x} ${GOL.pe} Z" fill="#fff" fill-opacity="0.12"/>${rede}</g>
<rect id="trave" x="${GOL.x - 12}" y="${GOL.topo - 12}" width="24" height="${GOL.pe - GOL.topo + 12}" fill="#f4f1e6" stroke="#0e1430" stroke-width="5"/>
<rect x="${GOL.x - 12}" y="${GOL.topo - 12}" width="200" height="22" fill="#f4f1e6" stroke="#0e1430" stroke-width="5"/>
<ellipse cx="${GOL.x + 90}" cy="${GOL.pe + 6}" rx="120" ry="16" fill="#000" fill-opacity="0.18"/></svg>`,
        );

        // placar: lâmpadas em cima (acendem nos metais), dois números e o relógio
        const pl = div(pai, 'placar');
        const lamps = [];
        for (let i = 0; i < 9; i++) {
            div(pl, 'lamp', `left:${26 + i * 50}px`);
            lamps.push(div(pl, 'lamp on', `left:${26 + i * 50}px`));
        }
        const digs = [];
        for (const [x, v] of [
            [30, '0'],
            [314, '0'],
        ]) {
            div(pl, 'dig', `left:${x}px`).textContent = '8';
            const d = div(pl, 'dig on', `left:${x}px`);
            d.textContent = v;
            digs.push(d);
        }
        div(pl, 'rel').textContent = '8:88';
        const rel = div(pl, 'rel on');
        rel.textContent = '0:00';

        // noite por cima de tudo; os cones de luz e a luz da porta passam por cima dela
        const noite = div(pai, '', '');
        noite.id = 'noite';
        const cones = [];
        const tubos = [];
        for (const x of bancos) {
            cones.push(div(pai, 'luzcone', `left:${x - cone / 2}px;width:${cone}px`));
            const b = div(pai, 'banco', `left:${x}px;width:${larg}px;margin-left:${-larg / 2}px`);
            const n = Math.round((larg - 12) / 44);
            const p = (larg - n * 44 + 4) / 2;
            for (let i = 0; i < n; i++) div(b, '', `position:absolute;top:14px;left:${p + i * 44}px;width:40px;height:28px;border-radius:4px;background:#3a4470`);
            const ac = div(b, 'aceso');
            for (let i = 0; i < n; i++) {
                const t = document.createElement('b');
                t.style.left = `${p + i * 44}px`;
                ac.appendChild(t);
            }
            tubos.push(ac);
        }
        const portaLuz = div(
            pai,
            'porta-luz',
            `left:${PORTA.x}px;top:${PORTA.top}px;width:${PORTA.w + 520}px;height:${1920 - PORTA.top}px;background:linear-gradient(180deg, rgb(255 214 140 / 55%), rgb(255 214 140 / 25%));clip-path:polygon(0 0, ${PORTA.w}px 0, ${PORTA.w}px ${PISO - PORTA.top}px, 100% 100%, 0 100%)`,
        );
        return { pl, lamps, digs, rel, noite, cones, tubos, portaLuz };
    }

    /** Acende (ou apaga) o banco `i`: tubos com tremida de lâmpada fria, cone, e a noite clareia até `noite`. */
    function luz(tl, G, i, t, { on = true, noite = null } = {}) {
        if (on) {
            tl.fromTo(G.tubos[i], { opacity: 0 }, { keyframes: { opacity: [1, 0.3, 1, 0.6, 1] }, duration: 0.18, ease: 'none', immediateRender: false }, t);
            tl.fromTo(G.cones[i], { opacity: 0 }, { keyframes: { opacity: [0.9, 0.3, 1, 0.7, 1] }, duration: 0.25, ease: 'none', immediateRender: false }, t);
        } else {
            tl.to(G.tubos[i], { opacity: 0, duration: 0.05 }, t);
            tl.to(G.cones[i], { opacity: 0, duration: 0.12 }, t);
        }
        if (noite != null) tl.to(G.noite, { opacity: noite, duration: on ? 0.2 : 0.12 }, t);
    }

    // ===== sprites PMD (de trailer/curtas/comum.js) =====
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
    /** Toca a animação `nome` na direção `dir` (0 frente, 2 direita, 4 costas, 6 esquerda) de t0 a t1. */
    function anim(tl, a, nome, dir, t0, t1, { vel = 1, loop = true, de = 0, flip = false } = {}) {
        const S = SPR[a.id];
        const A = S.anims[nome];
        const rects = A.rects[A.rects.length === 1 ? 0 : dir];
        const s = a.escala;
        const pos = (i) => `${-rects[i][0] * s}px ${-rects[i][1] * s}px`;
        tl.set(
            a.spr,
            { width: A.w * s, height: A.h * s, left: (-A.w * s) / 2, top: -A.pe * A.h * s, backgroundPosition: pos(de), scaleX: flip ? -1 : 1, transformOrigin: '50% 50%' },
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
            tl.set(a.spr, { backgroundPosition: pos(i) }, t);
        }
    }
    const quadro = (tl, a, nome, dir, i, t, op = {}) => anim(tl, a, nome, dir, t, t, { ...op, de: i, loop: false });

    // ===== bola (a textura do jogo) =====
    function bola(pai, { d = 70, z = 20, x = 0, y = 0 } = {}) {
        const el = div(pai, 'bola', `z-index:${z}`);
        const sh = div(el, 'sombra', `width:${d}px;height:${d * 0.34}px;left:${-d / 2}px;top:${-d * 0.17}px`);
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
    /**
     * A bola passa por cada toque `{ t, x, y }` exatamente no instante dele, em arcos de parábola (mais tempo entre
     * toques = arco mais alto, até `teto`). `ate` = o pé na altura do chão (toque no chão ou no pé). Gira na direção
     * do movimento.
     */
    function trajeto(tl, B, toques, { g = 2600, teto = 560 } = {}) {
        for (let k = 0; k + 1 < toques.length; k++) {
            const a = toques[k];
            const b = toques[k + 1];
            const d = b.t - a.t;
            if (d <= 0) continue;
            tl.to(B.el, { x: b.x, y: b.y, duration: d, ease: 'none' }, a.t);
            const h = b.alto ?? Math.min(teto, (g * d * d) / 8);
            if (h > 4) {
                tl.to(B.corpo, { y: -h, duration: d / 2, ease: 'quad.out' }, a.t);
                tl.to(B.corpo, { y: 0, duration: d / 2, ease: 'quad.in' }, a.t + d / 2);
                tl.to(B.sh, { scale: Math.max(0.35, 1 - h / 700), opacity: 0.6, duration: d / 2, ease: 'quad.out' }, a.t);
                tl.to(B.sh, { scale: 1, opacity: 1, duration: d / 2, ease: 'quad.in' }, a.t + d / 2);
            }
            tl.to(B.gira, { rotation: `+=${(b.x - a.x) * 1.6 + 40}`, duration: d, ease: 'none' }, a.t);
        }
    }

    // ===== efeitos =====
    const ESTRELA = Array.from({ length: 24 }, (_, k) => {
        const a = (k * Math.PI) / 12;
        const r = k % 2 ? 30 : 50;
        return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
    }).join(',');
    /** Estrela dourada chapada + anel branco que estouram em (x, y): o mesmo estouro da piscada do logo. */
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
    /** Anel achatado no piso (o quique): abre e some. */
    function anelPiso(tl, pai, x, y, t, { w = 120, cor = '#ff8a1c', borda = 8, dur = 0.35, z = 15 } = {}) {
        const fx = div(pai, 'fx', `z-index:${z}`);
        gsap.set(fx, { x, y });
        const r = div(fx, '', `position:absolute;box-sizing:border-box;width:${w}px;height:${w * 0.3}px;left:${-w / 2}px;top:${-w * 0.15}px;border-radius:50%;border:${borda}px solid ${cor};opacity:0`);
        tl.fromTo(r, { scale: 0.4, opacity: 1 }, { scale: 1.8, opacity: 0, duration: dur, ease: 'power2.out', immediateRender: false }, t);
    }
    /** Notinha (colcheia) que nasce em (x, y), sobe `sobe` px e some. Cor por instrumento. */
    function nota(tl, pai, x, y, t, { cor = '#fff', sobe = 120, dx = 0, dur = 0.9, tam = 1, haste = true } = {}) {
        const n = div(pai, 'nota');
        n.innerHTML = haste
            ? `<svg width="${50 * tam}" height="${80 * tam}" viewBox="0 0 50 80"><path d="M30 6 V58" stroke="#0e1430" stroke-width="12" stroke-linecap="round"/><path d="M30 6 C 44 14, 48 24, 42 36" fill="none" stroke="#0e1430" stroke-width="12" stroke-linecap="round"/><ellipse cx="18" cy="62" rx="16" ry="12" transform="rotate(-20 18 62)" fill="#0e1430"/><path d="M30 6 V58" stroke="${cor}" stroke-width="6" stroke-linecap="round"/><path d="M30 6 C 44 14, 48 24, 42 36" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round"/><ellipse cx="18" cy="62" rx="12" ry="8.5" transform="rotate(-20 18 62)" fill="${cor}"/></svg>`
            : `<svg width="${50 * tam}" height="${80 * tam}" viewBox="0 0 50 80"><ellipse cx="18" cy="62" rx="16" ry="12" transform="rotate(-20 18 62)" fill="#0e1430"/><ellipse cx="18" cy="62" rx="12" ry="8.5" transform="rotate(-20 18 62)" fill="${cor}"/></svg>`;
        gsap.set(n, { x, y });
        tl.fromTo(n, { opacity: 1, scale: 0.4 }, { scale: 1, duration: 0.12, ease: 'back.out(3)', immediateRender: false }, t);
        tl.to(n, { x: x + dx, y: y - sobe, duration: dur, ease: 'power1.out' }, t);
        tl.to(n, { opacity: 0, duration: dur * 0.45, ease: 'power1.in' }, t + dur * 0.55);
        return n;
    }
    /** Etiqueta dourada com uma haste apontando pro (x, y) da fonte do som; aparece em t e some em t + dur. */
    function etiqueta(tl, pai, texto, x, y, t, { dur = 1.3, haste = 70 } = {}) {
        const e = div(pai, 'etq');
        e.innerHTML = `<i style="top:${-haste}px;height:${haste}px"></i><span style="top:${-haste}px">${texto}</span>`;
        gsap.set(e, { x, y });
        tl.set(e, { opacity: 1 }, t);
        tl.fromTo(e, { scale: 0.5 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, t);
        tl.to(e, { opacity: 0, duration: 0.2 }, t + dur);
        return e;
    }
    /** Riscos de rangido (o tênis no piso): três traços curtos que abrem do pé. */
    function rangido(tl, pai, x, y, t, { cor = '#fff', lado = 1 } = {}) {
        const fx = div(pai, 'fx', 'z-index:30');
        gsap.set(fx, { x, y });
        [-35, 0, 35].forEach((ang) => {
            const r = div(fx, '', `position:absolute;left:0;top:-4px;width:34px;height:8px;border-radius:4px;background:${cor};box-shadow:0 0 0 3px #0e1430;transform-origin:-18px 4px;opacity:0`);
            gsap.set(r, { rotation: (lado > 0 ? 180 : 0) + ang * (lado > 0 ? -1 : 1) });
            tl.fromTo(r, { opacity: 1, x: 0 }, { opacity: 0, x: 14 * -lado, duration: 0.22, ease: 'power1.out', immediateRender: false }, t);
        });
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
    const treme = (tl, alvo, t, f = 1, dur = 0.3) =>
        tl.to(alvo, { keyframes: { x: [22 * f, -18 * f, 13 * f, -8 * f, 4 * f, 0], y: [-10 * f, 9 * f, -6 * f, 4 * f, -2 * f, 0] }, duration: dur, ease: 'none' }, t);
    const flash = (tl, t, o = 0.9, d = 0.3) => tl.fromTo('#flash', { opacity: o }, { opacity: 0, duration: d, ease: 'power2.out', immediateRender: false }, t);

    // ===== tela final do trailer 2 v3: logo com a piscada SOC-CER-MON, tag, site, selo e crédito =====
    function telaFinal(pai, { top = 520 } = {}) {
        pai.insertAdjacentHTML(
            'beforeend',
            `<style>
#logo { position: absolute; left: 140px; top: ${top}px; width: 800px; opacity: 0; isolation: isolate; z-index: 5; }
#logo img { display: block; width: 100%; image-rendering: auto; }
#logo .base { position: relative; z-index: 1; filter: drop-shadow(0 16px 30px rgb(0 0 0 / 55%)); }
#logo .pop { position: absolute; inset: 0; z-index: 2; opacity: 0; }
#logo .pop img { position: absolute; left: 0; top: 0; }
#logo .pop .branco { filter: brightness(0) invert(1); }
#logo .estrela, #logo .anel { position: absolute; top: 50%; width: 38%; aspect-ratio: 1; z-index: 0; opacity: 0; }
#logo .estrela { width: 46%; background: #ffcb05; }
#logo .anel { box-sizing: border-box; border: 12px solid #fff; border-radius: 50%; }
.tag { position: absolute; left: 110px; width: 860px; top: ${top + 230}px; text-align: center; font-size: 66px; letter-spacing: 3px; color: #ffcb05; text-shadow: 7px 8px 0 #0e1430; white-space: nowrap; opacity: 0; z-index: 5; }
.site { position: absolute; left: 110px; width: 860px; top: ${top + 370}px; text-align: center; font-size: 62px; letter-spacing: 2px; color: #fff; opacity: 0; z-index: 5; }
.selo { position: absolute; left: 110px; width: 860px; top: ${top + 480}px; display: flex; justify-content: center; opacity: 0; z-index: 5; }
.selo span { padding: 18px 30px; border-radius: 14px; background: #e8423f; color: #fff; font-size: 38px; line-height: 1.3; letter-spacing: 2px; box-shadow: 0 7px 0 #8c1d1b; text-align: center; }
.credito { position: absolute; left: 110px; width: 860px; top: 1560px; text-align: center; font-size: 34px; color: #9aa6d8; letter-spacing: 1px; opacity: 0; z-index: 5; }
</style>
<div id="logo"><img class="base" src="midia/logo-horizontal.svg" alt="" /></div>
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

    window.C = { T, notas, instantes, div, PISO, BANCOS, PORTA, GOL, ginasio, luz, ator, anim, quadro, bola, trajeto, estouro, anelPiso, nota, etiqueta, rangido, poeira, treme, flash, telaFinal, piscada };
})();
