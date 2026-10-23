// Curtas 2 (22/10/2026): o que as duas cenas usam ("Ginásio vazio" e "Acendam as luzes"). Carrega depois do GSAP, de
// midia/sprites.js (SPR) e de midia/som/<peça>.js (EV: cada nota da partitura com o segundo dela). Sprites, bola,
// estouro, tela final e a piscada do logo vêm de trailer/curtas/comum.js (curtas 1, que veio do trailer v3); aqui
// entra o ginásio visto de lado (teto com os bancos de luz, placar, arquibancada, porta, piso de madeira e o gol).
// v3: o gol de futsal em 3/4 com a rede que afunda e devolve a bola, e a física da bola por toques (`percurso`): ela só
// muda de rumo num contato e faz parábola entre um e outro; o desenho por quadro sai só do tempo (`porQuadro`).
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
    // v3: o gol de futsal em 3/4 (boca pra esquerda). O piso tem profundidade: y é a linha no chão (perto = maior) e
    // quem vai pro fundo anda `lean` px pra direita por px de y. u: 0 boca → 1 fundo · s: 0 trave de perto → 1 trave
    // de longe · v: 0 chão → 1 travessão. A bola mora numa linha só de profundidade (y), com a altura h por cima.
    const GOL = { x0: 800, yN: 1570, yF: 1330, lean: 0.34, H: 320, fundoB: 165, fundoT: 115, topoT: 0.9 };
    GOL.s = (y) => (GOL.yN - y) / (GOL.yN - GOL.yF);
    /** Ponto do gol na tela (u, s, v), com `dx` de estufada. */
    GOL.P = (u, s, v, dx = 0, dy = 0) => {
        const yf = GOL.yN - s * (GOL.yN - GOL.yF);
        const x = GOL.x0 + GOL.lean * (GOL.yN - yf) + u * (GOL.fundoB - (GOL.fundoB - GOL.fundoT) * v) + dx;
        return [x, yf - v * GOL.H * (1 - (1 - GOL.topoT) * u) + dy];
    };
    /** x da boca e do fundo da rede na profundidade y (a bola de altura h encosta no fundo em fundo(y, h) − raio). */
    GOL.boca = (y) => GOL.x0 + GOL.lean * (GOL.yN - y);
    GOL.fundo = (y, h) => GOL.boca(y) + GOL.fundoB - ((GOL.fundoB - GOL.fundoT) * h) / (GOL.H * GOL.topoT);
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
        // meio da quadra e linha do gol no mesmo ângulo de profundidade do gol; a área (meia elipse) na frente dele
        const lx = (x, y) => x + GOL.lean * (1800 - y);
        o.push(`<path d="M ${lx(170, 1238)} 1238 L ${lx(170, 1800)} 1800" stroke="#fff" stroke-opacity="0.9" stroke-width="10"/>`);
        const cy = 1450;
        const cx = GOL.boca(cy);
        let area = '';
        for (let k = 0; k <= 24; k++) {
            const a = -Math.PI / 2 - (k / 24) * Math.PI;
            const yy = cy + Math.sin(a) * 205;
            area += `${k ? 'L' : 'M'} ${(GOL.boca(yy) + Math.cos(a) * 330).toFixed(1)} ${yy.toFixed(1)} `;
        }
        o.push(`<path d="${area}Z" fill="#3a7bd5" fill-opacity="0.3" stroke="#fff" stroke-opacity="0.9" stroke-width="8"/>`);
        o.push(`<path d="M ${GOL.boca(1238)} 1238 L ${GOL.boca(1800)} 1800" stroke="#fff" stroke-opacity="0.9" stroke-width="9"/>`);
        pai.insertAdjacentHTML('beforeend', `<svg class="camada" viewBox="0 0 1080 1920">${o.join('')}</svg>`);
        const rede = golDesenha(pai);

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
        // a sirene do placar (os metais): uma corneta em cima dele, que solta um anel em cada acorde
        pl.insertAdjacentHTML(
            'beforeend',
            '<svg style="position:absolute;left:186px;top:-92px;overflow:visible" width="92" height="70" viewBox="0 0 92 70"><path d="M8 26 H30 L74 4 V66 L30 44 H8 Z" fill="#ffcb05" stroke="#0e1430" stroke-width="6" stroke-linejoin="round"/><rect x="34" y="62" width="24" height="18" fill="#1b2350"/></svg>',
        );
        return { pl, lamps, digs, rel, noite, cones, tubos, portaLuz, rede };
    }

    /**
     * O gol de futsal (traves brancas com faixas vermelhas, travessão, rede com fundo, teto e laterais). A rede de trás
     * e a lateral de longe ficam atrás da bola (z 17); a trave de perto, o travessão e a lateral de perto na frente
     * (z 26). Devolve `{ bate(t, h, forca), pinta(t) }`: cada bola na rede estufa o fundo no ponto em que bateu e
     * balança até parar (função só do tempo, pra o render pular pra qualquer quadro).
     */
    function golDesenha(pai) {
        const linha = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`;
        const amostra = (f, n = 10) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
        const trave = (a, b, w = 18) =>
            `<path d="${linha([a, b])}" stroke="#0e1430" stroke-width="${w + 10}" stroke-linecap="round"/><path d="${linha([a, b])}" stroke="#f4f1e6" stroke-width="${w}" stroke-linecap="round"/>`;
        const faixas = (a, b, w = 18) => {
            let s = '';
            for (const f of [0.12, 0.42, 0.72]) {
                const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
                const q = [a[0] + (b[0] - a[0]) * (f + 0.13), a[1] + (b[1] - a[1]) * (f + 0.13)];
                s += `<path d="${linha([p, q])}" stroke="#e8423f" stroke-width="${w}"/>`;
            }
            return s;
        };
        const P = GOL.P;
        const atras = `<svg class="camada" viewBox="0 0 1080 1920" style="z-index:17;overflow:visible">
<ellipse cx="${(P(0.5, 0.5, 0)[0]).toFixed(0)}" cy="${P(0.5, 0.5, 0)[1].toFixed(0)}" rx="150" ry="120" fill="#000" fill-opacity="0.18"/>
<path id="rede-tras" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="3.5" stroke-linejoin="round"/>
<path id="rede-fundo" fill="#fff" fill-opacity="0.07"/>
${trave(P(1, 1, 0), P(1, 0, 0), 9)}${trave(P(1, 1, 1), P(1, 0, 1), 9)}${trave(P(0, 1, 0), P(1, 1, 0), 9)}${trave(P(0, 1, 1), P(1, 1, 1), 9)}${trave(P(1, 1, 0), P(1, 1, 1), 9)}
${trave(P(0, 1, 0), P(0, 1, 1))}${faixas(P(0, 1, 0), P(0, 1, 1))}</svg>`;
        const frente = `<svg class="camada" viewBox="0 0 1080 1920" style="z-index:26;overflow:visible">
<path id="rede-frente" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="3.5"/>
${trave(P(0, 0, 0), P(1, 0, 0), 9)}${trave(P(0, 0, 1), P(1, 0, 1), 9)}${trave(P(1, 0, 0), P(1, 0, 1), 9)}
${trave(P(0, 1, 1), P(0, 0, 1))}${faixas(P(0, 1, 1), P(0, 0, 1))}${trave(P(0, 0, 0), P(0, 0, 1))}${faixas(P(0, 0, 0), P(0, 0, 1))}</svg>`;
        pai.insertAdjacentHTML('beforeend', atras + frente);
        const elTras = pai.querySelector('#rede-tras');
        const elFundo = pai.querySelector('#rede-fundo');
        const elFrente = pai.querySelector('#rede-frente');
        const batidas = [];
        // resposta da rede a uma bola: afunda junto com ela em 0,07 s e balança amortecida
        const AF = 0.07;
        const resp = (tau) => (tau < 0 ? 0 : tau < AF ? tau / AF : Math.exp(-(tau - AF) / 0.22) * Math.cos((2 * Math.PI * (tau - AF)) / 0.34));
        const desloca = (t, s, v) => {
            let d = 0;
            for (const b of batidas) {
                const r = resp(t - b.t);
                if (!r) continue;
                const env = Math.sin(Math.PI * s) ** 0.6 * Math.sin(Math.PI * Math.min(1, v)) ** 0.6;
                d += r * b.forca * env * Math.exp(-((s - b.s) ** 2) / 0.16 - (v - b.v) ** 2 / 0.22);
            }
            return d;
        };
        const ESTUFA = 72; // px que a rede cede numa bola de força 1
        let ultimo = null;
        function pinta(t) {
            const ativo = batidas.some((b) => t >= b.t && t < b.t + 2.2);
            const chave = ativo ? t.toFixed(3) : 'parado';
            if (chave === ultimo) return;
            ultimo = chave;
            const Q = (u, s, v) => {
                const d = u >= 1 ? desloca(t, s, v) : u > 0.4 ? desloca(t, s, v) * ((u - 0.4) / 0.6) ** 2 : 0;
                return P(u, s, v, d * ESTUFA, d * 14);
            };
            const tras = [];
            // fundo: linhas verticais (s fixo) e horizontais (v fixo)
            for (let i = 0; i <= 7; i++) tras.push(linha(amostra((v) => Q(1, i / 7, v), 12)));
            for (let j = 0; j <= 6; j++) tras.push(linha(amostra((s) => Q(1, s, j / 6), 14)));
            // teto (v = 1) e lateral de longe (s = 1)
            for (let i = 0; i <= 7; i++) tras.push(linha(amostra((u) => Q(u, i / 7, 1), 4)));
            for (let k = 1; k <= 3; k++) tras.push(linha(amostra((s) => Q(k / 4, s, 1), 6)));
            for (let k = 1; k <= 3; k++) tras.push(linha(amostra((v) => Q(k / 4, 1, v), 6)));
            for (let j = 1; j <= 5; j++) tras.push(linha(amostra((u) => Q(u, 1, j / 6), 4)));
            elTras.setAttribute('d', tras.join(' '));
            elFundo.setAttribute('d', `${linha([...amostra((s) => Q(1, s, 0), 14), ...amostra((v) => Q(1, 1, v), 12), ...amostra((s) => Q(1, 1 - s, 1), 14)])} Z`);
            // lateral de perto (s = 0)
            const fr = [];
            for (let k = 1; k <= 3; k++) fr.push(linha(amostra((v) => Q(k / 4, 0, v), 6)));
            for (let j = 1; j <= 5; j++) fr.push(linha(amostra((u) => Q(u, 0, j / 6), 4)));
            elFrente.setAttribute('d', fr.join(' '));
        }
        /** A bola (fundo dela na altura h, na profundidade y) bate na rede em t. */
        function bate(t, h, { forca = 1, y = 1450, r = 38 } = {}) {
            batidas.push({ t, forca, s: GOL.s(y), v: Math.min(0.95, (h + r) / (GOL.H * GOL.topoT)) });
            return { x: GOL.fundo(y, h + r) - r, xMax: GOL.fundo(y, h + r) - r + ESTUFA * forca * 0.85, t1: t + AF };
        }
        pinta(0);
        return { bate, pinta };
    }

    /**
     * A física da bola. `contatos`: [{ t, x, y, h, por, g, freia }] (por: pe, chute, joelho, cabeca, peito, calcanhar,
     * chao, rede, cipo, fora...). Entre dois contatos x e y andam em linha reta e a altura é uma parábola com gravidade
     * `g` (a do contato de saída; 0 = rolando no chão), então a bola só muda de rumo num toque. `freia`: o rolar perde
     * velocidade até o próximo (atrito). x faltando num quique (`chao`) sai da reta entre os vizinhos: a velocidade
     * horizontal não muda no quique. Devolve `em(t)` e a lista pronta; os avisos de física vão pra `window.__avisos`.
     */
    function percurso(contatos, { g = 2600, nome = 'bola' } = {}) {
        const C = contatos.map((c) => ({ y: 1450, h: 0, ...c })).sort((a, b) => a.t - b.t);
        // x dos quiques sem x: reta entre os vizinhos que têm x
        for (let k = 0; k < C.length; k++) {
            if (C[k].x != null) continue;
            let a = k - 1;
            while (a >= 0 && C[a].x == null) a--;
            let b = k + 1;
            while (b < C.length && C[b].x == null) b++;
            const A = C[a];
            const B = C[b];
            const f = (C[k].t - A.t) / (B.t - A.t);
            C[k].x = A.x + (B.x - A.x) * f;
            if (C[k].yAuto !== false) C[k].y = A.y + (B.y - A.y) * f;
        }
        const seg = [];
        for (let k = 0; k + 1 < C.length; k++) {
            const a = C[k];
            const b = C[k + 1];
            const d = b.t - a.t;
            if (d <= 1e-6) continue;
            const gg = a.g ?? g;
            seg.push({ a, b, d, gg, v0: (b.h - a.h) / d + (gg * d) / 2 });
        }
        const em = (t) => {
            if (t <= C[0].t) return { x: C[0].x, y: C[0].y, h: C[0].h };
            const s = seg.find((q) => t < q.b.t) ?? seg.at(-1);
            const tau = Math.min(s.d, Math.max(0, t - s.a.t));
            let f = tau / s.d;
            if (s.a.freia) f = 1 - (1 - f) ** 2;
            return { x: s.a.x + (s.b.x - s.a.x) * f, y: s.a.y + (s.b.y - s.a.y) * f, h: Math.max(0, s.a.h + s.v0 * tau - (s.gg * tau * tau) / 2), s };
        };
        // avisos: rumo trocado num quique, quique que ganha altura, bola que passa por cima do travessão
        const av = (window.__avisos ??= []);
        for (let k = 1; k < seg.length; k++) {
            const A = seg[k - 1];
            const B = seg[k];
            if (B.a.por !== 'chao') continue;
            const va = (A.b.x - A.a.x) / A.d;
            const vb = (B.b.x - B.a.x) / B.d;
            if (Math.abs(va) > 40 && Math.abs(vb) > 40 && Math.sign(va) !== Math.sign(vb)) av.push(`${nome} ${B.a.t.toFixed(2)}: quique troca o rumo (${va.toFixed(0)} → ${vb.toFixed(0)} px/s)`);
            if (Math.abs(vb) > Math.abs(va) * 1.35 + 60) av.push(`${nome} ${B.a.t.toFixed(2)}: quique acelera (${va.toFixed(0)} → ${vb.toFixed(0)} px/s)`);
            const topo = (q) => (q.v0 > 0 ? q.a.h + (q.v0 * q.v0) / (2 * q.gg) : q.a.h);
            if (A.gg > 0 && B.gg > 0 && topo(B) > topo(A) * 1.05 + 8) av.push(`${nome} ${B.a.t.toFixed(2)}: quique sobe mais (${topo(A).toFixed(0)} → ${topo(B).toFixed(0)})`);
        }
        for (const q of seg) {
            const xb = GOL.boca(q.a.y);
            if ((q.a.x - xb) * (q.b.x - xb) < 0) {
                const f = (xb - q.a.x) / (q.b.x - q.a.x);
                const tau = f * q.d;
                const h = q.a.h + q.v0 * tau - (q.gg * tau * tau) / 2;
                if (h + 76 > GOL.H - 4 && Math.abs(q.a.y - 1450) < 200) av.push(`${nome} ${q.a.t.toFixed(2)}: passa pela boca alto demais (h ${h.toFixed(0)})`);
            }
        }
        return { C, seg, em };
    }

    /** Pinta a bola no instante t: posição, altura, giro (rola: o giro sai do x), sombra e o amasso no quique. */
    function pintaBola(B, P, t, { d = 76 } = {}) {
        const p = P.em(t);
        const giro = ((p.x + (p.y - 1450) * 0.6) / (d / 2)) * 57.3;
        let sx = 1;
        let sy = 1;
        for (const c of P.C) {
            if (c.por !== 'chao' && c.por !== 'rede') continue;
            const dt = Math.abs(t - c.t);
            if (dt < 0.05) {
                const k = 1 - dt / 0.05;
                if (c.por === 'chao') {
                    sx = 1 + 0.18 * k;
                    sy = 1 - 0.2 * k;
                } else {
                    sx = 1 - 0.18 * k;
                    sy = 1 + 0.12 * k;
                }
            }
        }
        gsap.set(B.el, { x: p.x, y: p.y });
        gsap.set(B.corpo, { y: -p.h, scaleX: sx, scaleY: sy, transformOrigin: '0px 0px' });
        gsap.set(B.gira, { rotation: giro });
        const sh = Math.max(0.35, 1 - p.h / 700);
        // parada num degrau (fora do piso): sem sombra no chão
        const semSombra = p.s ? p.s.a.semSombra : P.C[0].semSombra;
        gsap.set(B.sh, { scale: sh, opacity: semSombra ? 0 : p.h ? 0.45 + 0.55 * sh : 1 });
        return p;
    }

    /**
     * Liga o desenho por quadro. Um tween da própria linha do tempo leva um "relógio" com setter: o GSAP escreve o tempo
     * nele a cada render, inclusive no seek com eventos suprimidos (o QA de quadros e o render), então o desenho sai
     * sempre do tempo certo. O `hf-seek` do HyperFrames também chama.
     */
    function porQuadro(tl, fn, fim = tl.duration()) {
        let ultimo = -1;
        const roda = (t) => {
            if (t === ultimo) return;
            ultimo = t;
            fn(t);
        };
        const relogio = {
            get t() {
                return ultimo;
            },
            set t(v) {
                roda(v);
            },
        };
        tl.fromTo(relogio, { t: 0 }, { t: fim, duration: fim, ease: 'none', immediateRender: false }, 0);
        window.addEventListener('hf-seek', (e) => roda(e.detail.time));
        roda(0);
    }

    /** Quadro (nome, dir, i) de um ator, desenhado direto (sem GSAP), só quando muda. */
    function pinta(a, nome, dir, i, { flip = false } = {}) {
        const k = `${nome}/${dir}/${i}/${flip}`;
        if (a._k === k) return;
        a._k = k;
        const A = SPR[a.id].anims[nome];
        const rects = A.rects[A.rects.length === 1 ? 0 : dir];
        const s = a.escala;
        const [rx, ry] = rects[Math.min(i, rects.length - 1)];
        const st = a.spr.style;
        st.width = `${A.w * s}px`;
        st.height = `${A.h * s}px`;
        st.left = `${(-A.w * s) / 2}px`;
        st.top = `${-A.pe * A.h * s}px`;
        st.backgroundPosition = `${-rx * s}px ${-ry * s}px`;
        st.transform = flip ? 'scaleX(-1)' : '';
    }

    /** Interpolação suave (cúbica monótona) de chaves [[t, v], ...]: sem tranco nem passar do ponto. */
    function suave(chaves) {
        const K = chaves.slice().sort((a, b) => a[0] - b[0]);
        const n = K.length;
        const m = new Array(n).fill(0);
        const dl = [];
        for (let i = 0; i + 1 < n; i++) dl.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0] || 1e-6));
        for (let i = 1; i + 1 < n; i++) {
            m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2;
            const lim = 3 * Math.min(Math.abs(dl[i - 1]), Math.abs(dl[i]));
            if (Math.abs(m[i]) > lim) m[i] = Math.sign(m[i]) * lim;
        }
        return (t) => {
            if (t <= K[0][0]) return K[0][1];
            if (t >= K[n - 1][0]) return K[n - 1][1];
            let i = 0;
            while (t > K[i + 1][0]) i++;
            const [t0, v0] = K[i];
            const [t1, v1] = K[i + 1];
            const h = t1 - t0;
            const s = (t - t0) / h;
            const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
            const h10 = s ** 3 - 2 * s ** 2 + s;
            const h01 = -2 * s ** 3 + 3 * s ** 2;
            const h11 = s ** 3 - s ** 2;
            return h00 * v0 + h10 * h * m[i] + h01 * v1 + h11 * h * m[i + 1];
        };
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
    // A animação que começou por último manda (o conserto do QA de quadros do curtas, 45a72115): apaga as trocas de
    // quadro que uma anterior ainda tinha agendado de t0 em diante e para onde começa uma posterior.
    function anim(tl, a, nome, dir, t0, t1, { vel = 1, loop = true, de = 0, flip = false } = {}) {
        a.inicios ??= [];
        for (const tw of tl.getTweensOf(a.spr)) if (tw.data <= t0 + 1e-6 && tw.startTime() >= t0 - 1e-6) tw.kill();
        t1 = Math.min(t1, ...a.inicios.filter((u) => u > t0 + 1e-6));
        a.inicios.push(t0);
        const S = SPR[a.id];
        const A = S.anims[nome];
        const rects = A.rects[A.rects.length === 1 ? 0 : dir];
        const s = a.escala;
        // cada quadro leva o tamanho junto: duas animações no mesmo ator (um Idle em loop e um quadro de Attack por
        // cima) nunca deixam um recorte de um tamanho mostrando a folha de outro (os vizinhos vazavam na v2)
        const geo = { width: A.w * s, height: A.h * s, left: (-A.w * s) / 2, top: -A.pe * A.h * s, scaleX: flip ? -1 : 1, transformOrigin: '50% 50%' };
        const pos = (i) => ({ ...geo, backgroundPosition: `${-rects[i][0] * s}px ${-rects[i][1] * s}px`, data: t0 });
        tl.set(a.spr, pos(de), t0);
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
            tl.set(a.spr, pos(i), t);
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
.credito { position: absolute; left: 110px; width: 860px; top: 1560px; text-align: center; font-size: 34px; color: #dfe4ff; letter-spacing: 1px; -webkit-text-stroke: 8px #0e1430; paint-order: stroke fill; opacity: 0; z-index: 5; }
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

    window.C = { T, notas, instantes, div, PISO, BANCOS, PORTA, GOL, ginasio, luz, ator, anim, quadro, pinta, suave, bola, percurso, pintaBola, porQuadro, estouro, anelPiso, nota, rangido, poeira, treme, flash, telaFinal, piscada };
})();
