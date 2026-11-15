    // Teste do terno da dupla do News #1 (15/11): Raichu e Golduck na bancada, com o terno pintado no tronco de cada
    // quadro do Idle (terno2.mjs, nas cópias das folhas; a mesa esconde da cintura pra baixo), uma gravata-borboleta de
    // pixel art como item separado no peito (vermelha no Raichu, dourada no Golduck), uma caneca de cada um e o retrato PMD de quem fala colado à esquerda da caixa (a expressão troca por fala, corte seco + 1 quadro de
    // pulinho). Entra no lugar do <script> da linha do tempo de uma cópia do news-01/index.html (montar.mjs).
    const { div } = C;
    const FIM = window.FIM;
    const MESA = 1080; // a linha do tampo da bancada
    const tl = gsap.timeline({ paused: true });
    const $ = (id) => document.getElementById(id);
    tl.set(['#banc', '#bug', '#manchete'], { autoAlpha: 1 }, 0);
    tl.set(['#vin', '#rota', '#sonora', '#esc', '#banco-c', '#fundo', '#fim'], { autoAlpha: 0 }, 0);
    tl.set('#t-marca', { opacity: 1 }, 0);
    gsap.set('#varre', { autoAlpha: 0 });
    const CAM = $('cam');
    gsap.set(CAM, { transformOrigin: '0px 0px' });
    tl.fromTo(CAM, { scale: 1, x: 0, y: 0 }, { scale: 1.02, x: 540 - 1.02 * 540, y: 950 - 1.02 * 950, duration: FIM, ease: 'sine.inOut', immediateRender: false }, 0);
    tl.fromTo('#raios-tel', { rotation: 0 }, { rotation: 12, duration: FIM, ease: 'none', immediateRender: false }, 0);

    // pixel art em SVG (1 unidade = 1 pixel da folha; `e` = px da tela por pixel)
    const pix = (linhas, pal, e) => {
        let r = '';
        linhas.forEach((l, j) => [...l].forEach((c, i) => { if (c !== '.') r += `<rect x="${i}" y="${j}" width="1" height="1" fill="${pal[c]}"/>`; }));
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${linhas[0].length * e}" height="${linhas.length * e}" viewBox="0 0 ${linhas[0].length} ${linhas.length}" shape-rendering="crispEdges" style="display:block">${r}</svg>`;
    };

    // a bancada de dois: mais larga, uma cadeira atrás de cada um, vinho escuro (a vermelha aparecia entre os braços do
    // Golduck; azul-escura some atrás do terno)
    document.head.insertAdjacentHTML('beforeend', `<style>
.cadeira .encosto, .cadeira .assento { background: #5a1c26; box-shadow: inset 0 -16px 0 #3e121a; }
</style>`);
    document.querySelector('#banc .mesa-n').style.cssText = 'left:40px;--w:1000px';
    const RX = 262, GX = 720; // o meio do Raichu e o do Golduck
    const cad = $('cadeira');
    cad.style.transform = `translate(${GX}px,1215px) scale(1.1)`;
    const cad2 = cad.cloneNode(true);
    cad2.id = 'cadeira-r';
    cad2.style.transform = `translate(${RX}px,1200px)`;
    cad.after(cad2);

    // a gravata-borboleta: 9 x 5 pixels (as abas afinam até o nó), na mesma grade de pixels do sprite. A do Raichu é
    // vermelha (no terno escuro ela fica no peito, longe da boca), a do Golduck, dourada (o amarelo do jogo)
    const GRAVATA = ['oo.....oo', 'oLLo.oDDo', 'oLRRKRRDo', 'oLLo.oDDo', 'oo.....oo'];
    const COR_G = {
        26: { o: '#0e1430', L: '#ff8a7e', R: '#e8423f', D: '#9c1f1f', K: '#7a1414' },
        55: { o: '#0e1430', L: '#fff3a0', R: '#ffcb05', D: '#c98a00', K: '#8a5a00' },
    };
    // onde vai o nó em cada quadro do Idle (coluna do meio, linha de cima), por direção: 0 de frente, 1 olhando pra
    // direita (o Raichu pro Golduck), 7 pra esquerda (o Golduck pro Raichu). Medido na folha, quadro a quadro; a do
    // Golduck sobe 1 linha, colada na ponta do bico.
    const NO = {
        26: { 0: [[19, 23], [19, 21], [19, 20], [19, 19], [19, 20], [19, 21]], 1: [[22, 22], [22, 20], [22, 19], [22, 18], [22, 19], [22, 20]] },
        55: { 0: [[15, 16], [15, 17], [15, 16], [15, 17]], 7: [[14, 15], [14, 16], [14, 15], [14, 16]] },
    };
    /** Um apresentador: o sprite do jogo com a linha `linha` da folha no tampo da mesa, e a gravata por cima. */
    const apresentador = (id, x, e, linha) => {
        const el = div(CAM, 'ator', 'z-index:20');
        gsap.set(el, { x, y: MESA });
        const corpo = div(el, 'corpo');
        gsap.set(corpo, { transformOrigin: '0px 0px' });
        const A = SPR[id].anims.Idle;
        const spr = div(corpo, 'spr', `width:${A.w * e}px;height:${A.h * e}px;left:${(-A.w * e) / 2}px;top:${-linha * e}px;background-image:url(${SPR[id].folha});background-size:${SPR[id].tam[0] * e}px ${SPR[id].tam[1] * e}px`);
        const g = div(corpo, '', 'position:absolute;left:0;top:0');
        g.innerHTML = pix(GRAVATA, COR_G[id], e);
        return { id, e, linha, A, corpo, spr, g };
    };
    /** O Idle do jogo na direção `dir` de t0 a t1 (as durações do AnimData), com a gravata acompanhando o peito. */
    const idle = (a, dir, t0, t1) => {
        const { A, e } = a;
        const quadro = (i, t) => {
            const [fx, fy] = A.rects[dir][i];
            const [cx, cy] = NO[a.id][dir][i];
            tl.set(a.spr, { backgroundPosition: `${-fx * e}px ${-fy * e}px` }, t);
            tl.set(a.g, { x: (cx - 4 - A.w / 2) * e, y: (cy - a.linha) * e }, t);
        };
        for (let t = t0, i = 0; t < t1 - 1e-4; t += A.dur[i] / 60, i = (i + 1) % A.dur.length) quadro(i, t);
    };
    // um pouco menores que no teste-golduck (14 e 15), pra não tampar a carta do telão; o Golduck senta 1 linha mais
    // baixo (a mesa esconde o vão entre as pernas)
    const R = apresentador(26, RX, 12, 28);
    const G = apresentador(55, GX, 13, 22);
    const ATOR = { raichu: R, golduck: G };

    // as canecas na bancada: amarela do Raichu, azul do Golduck, com o vapor subindo em 3 fiapos de pixel
    const CANECA = ['######..', '#kkkk#..', '#NMMM###', '#NMMM#.#', '#NMMM###', '#OMMO#..', '.####...'];
    for (const [x, M, N, O, fase, E] of [[RX + 150, '#ffcb05', '#fff3a0', '#d99a00', 0, R.e], [GX + 140, '#3a7bd5', '#a8cbff', '#2a4ea0', 0.7, G.e]]) {
        // E: a mesma grade do sprite do dono
        const el = div(CAM, '', `position:absolute;left:${x - 4 * E}px;top:${MESA + 22 - 7 * E}px;z-index:32`);
        el.innerHTML = pix(CANECA, { '#': '#0e1430', k: '#5a3418', M, N, O }, E);
        for (let k = 0; k < 3; k++) {
            const v = div(el, '', `position:absolute;left:${(1 + 1.5 * k) * E}px;top:${-E}px;width:${E}px;height:${E}px;background:#dde3f2`);
            for (let t = -fase - k * 0.55; t < FIM; t += 1.65)
                tl.fromTo(v, { y: 0, x: 0, opacity: 0 }, { keyframes: { y: [0, -E, -E * 2, -E * 3], x: [0, E, 0, E], opacity: [0, 0.4, 0.25, 0] }, duration: 1.6, ease: 'none', immediateRender: false }, Math.max(0, t));
        }
    }

    // a caixa de fala do PMD: o retrato numa moldura própria à esquerda, a caixa do texto do lado (termina em 940, fora
    // da faixa dos botões), o nome em cima da caixa
    document.head.insertAdjacentHTML('beforeend', `<style>
#caixa { left: 266px; width: 680px; }
#retrato { position: absolute; left: 28px; top: 1300px; width: 230px; height: 230px; box-sizing: border-box; z-index: 85; opacity: 0; overflow: hidden;
  background: #f8f8f0; border: 10px solid #0e1430; border-radius: 24px; box-shadow: inset 0 0 0 7px #f8f8f0, inset 0 0 0 13px #4a6ac8, 0 14px 0 rgb(0 0 0 / 45%); }
#retrato img { position: absolute; left: 25px; top: 25px; width: 160px; height: 160px; image-rendering: pixelated; border-radius: 6px; opacity: 0; }
</style>`);
    const RET = div($('root'), '');
    RET.id = 'retrato';
    const ROSTO = {};
    for (const f of FALAS) if (!ROSTO[f.rosto]) {
        const img = document.createElement('img');
        img.src = `midia/${f.rosto}.png`;
        RET.appendChild(img);
        ROSTO[f.rosto] = img;
    }
    const CAIXA = $('caixa');
    tl.set([CAIXA, RET], { opacity: 0 }, 0);
    tl.fromTo([RET, CAIXA], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out', stagger: 0.04, immediateRender: false }, FALAS[0].t0 - 0.3);
    FALAS.forEach((f, k) => {
        const A = ATOR[f.quem];
        const prox = FALAS[k + 1];
        const ate = prox ? prox.t0 - 0.1 : FIM;
        // o retrato: corte seco pra expressão nova e 1 quadro de pulinho
        tl.set(Object.values(ROSTO), { opacity: 0 }, f.t0 - 0.1);
        tl.set(ROSTO[f.rosto], { opacity: 1 }, f.t0 - 0.1);
        tl.set(ROSTO[f.rosto], { y: -8 }, f.t0 - 0.1);
        tl.set(ROSTO[f.rosto], { y: 0 }, f.t0 - 0.1 + 1 / 30);
        tl.set('#nome', { textContent: f.quem.toUpperCase() }, f.t0 - 0.1);
        // o texto letra por letra e a setinha piscando quando completa
        const tx = div(CAIXA, 'txt');
        tx.innerHTML = f.texto.split(' ').map((p) => `<b>${Array.from(p).map((c) => `<s>${c}</s>`).join('')}</b>`).join(' ');
        tl.set(tx, { opacity: 1 }, f.t0 - 0.1);
        if (prox) tl.set(tx, { opacity: 0 }, ate);
        [...tx.querySelectorAll('s')].forEach((l, i) => tl.set(l, { visibility: 'visible' }, f.chars[i]));
        for (let t = f.fim + 0.1, n = 0; t < ate; t += 0.3, n++) tl.set('#seta', { opacity: n % 2 ? 0 : 1 }, t);
        tl.set('#seta', { opacity: 0 }, ate);
        // quem fala: um pulinho no começo e um balanço leve em cada palavra
        tl.to(A.corpo, { keyframes: { y: [0, -16, 0] }, duration: 0.28, ease: 'sine.inOut' }, f.t0 - 0.05);
        let ult = f.t0 + 0.1;
        Array.from(f.texto).forEach((c, i, cs) => {
            if (cs[i - 1] !== ' ' || f.chars[i] < ult + 0.2) return;
            ult = f.chars[i];
            tl.to(A.corpo, { keyframes: { y: [0, -5, 0] }, duration: 0.14, ease: 'sine.inOut' }, ult);
        });
    });

    // o Idle o tempo todo; quem escuta vira pro parceiro (os quadros de 3/4 do próprio Idle) e volta antes de falar
    const OLHA = { raichu: 1, golduck: 7 };
    const virar = { raichu: [], golduck: [] };
    FALAS.forEach((f, k) => {
        const ouvinte = f.quem === 'raichu' ? 'golduck' : 'raichu';
        const fimFala = FALAS[k + 1] ? FALAS[k + 1].t0 - 0.35 : FIM;
        virar[ouvinte].push([f.t0 + 0.7, fimFala]);
    });
    for (const [quem, trechos] of Object.entries(virar)) {
        const a = ATOR[quem];
        let t = 0;
        for (const [de, ate] of trechos) {
            idle(a, 0, t, de);
            idle(a, OLHA[quem], de, ate);
            // um aceno de cabeça no meio da escuta (o corpo inclina e volta)
            tl.to(a.corpo, { keyframes: { rotation: [0, quem === 'raichu' ? 3 : -3, 0] }, duration: 0.5, ease: 'sine.inOut' }, de + 0.9);
            t = ate;
        }
        idle(a, 0, t, FIM);
    }

    // manchete, selo e tarjas (a do Raichu pela esquerda, a do Golduck pela direita, na 1ª fala de cada um)
    const sp = div($('barra'), '', 'position:absolute;inset:0');
    sp.innerHTML = '<span>SOCCERMON NEWS #1</span>';
    tl.fromTo('#manchete', { x: 1100 }, { x: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, 0.04);
    for (let t = 0, k = 0; t < FIM; t += 0.5, k++) tl.set(['#ponto', '#dois'], { opacity: k % 2 ? 0.25 : 1 }, t);
    const gc = (nome, x, t0, t1, lado) => {
        const g = div($('root'), 'gc', `left:${x}px;top:1110px`);
        g.innerHTML = `<div class="n">${nome}</div><div class="c">APRESENTADOR</div>`;
        tl.set(g, { opacity: 1 }, t0);
        tl.fromTo(g, { x: lado * 1000 }, { x: 0, duration: 0.32, ease: 'power3.out', immediateRender: false }, t0);
        tl.fromTo(g.querySelector('.c'), { x: lado * 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, t0 + 0.12);
        tl.to(g, { x: lado * 1100, duration: 0.25, ease: 'power2.in' }, t1);
    };
    gc('RAICHU', 28, FALAS[0].t0 + 0.1, FALAS[1].t0 - 0.4, -1);
    gc('GOLDUCK', 560, FALAS[1].t0 + 0.1, FALAS[2].t0 - 0.4, 1);
    C.flash(tl, 0, 0.6, 0.25);
    tl.set({}, {}, FIM);
    window.__timelines = { root: tl };
