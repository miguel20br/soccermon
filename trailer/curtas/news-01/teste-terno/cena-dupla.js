// O roteiro da cena de teste da dupla (7,2 s, só a bancada): entra no lugar do <script> da linha do tempo de uma cópia do
// news-01/index.html (sem os vídeos nem a música; root e #cena com data-duration="7.2"), com <script src="falas.js">
// antes dele, <audio class="clip" src="voz.wav" data-start="0" data-duration="7.2"> e, ao lado, as folhas do
// dupla.mjs e o falas.js/voz.wav do voz-dupla.mjs. Quadros: 0,3 s (plano normal) e 3,5 s (as duas tarjas).
    // Teste da dupla de apresentadores (News #1, 15/11): Raichu e Machamp de terno, cada um na sua cadeira
    const { div, flash } = C;
    const FIM = 7.2;
    const MESA = 1080; // a linha do tampo da bancada
    const tl = gsap.timeline({ paused: true });
    const $ = (id) => document.getElementById(id);
    tl.set(['#banc', '#bug', '#manchete', '#caixa'], { autoAlpha: 1 }, 0);
    tl.set(['#vin', '#rota', '#sonora', '#esc', '#banco-c', '#fundo', '#fim'], { autoAlpha: 0 }, 0);
    tl.set('#t-marca', { opacity: 1 }, 0);
    gsap.set('#varre', { autoAlpha: 0 });
    const CAM = $('cam');
    gsap.set(CAM, { transformOrigin: '0px 0px' });
    // a câmera empurra 2% devagar, no meio da dupla (pouco: o Machamp fica longe da faixa dos botões)
    tl.fromTo(CAM, { scale: 1, x: 0, y: 0 }, { scale: 1.02, x: 540 - 1.02 * 540, y: 950 - 1.02 * 950, duration: FIM, ease: 'sine.inOut', immediateRender: false }, 0);
    tl.fromTo('#raios-tel', { rotation: 0 }, { rotation: 12, duration: FIM, ease: 'none', immediateRender: false }, 0);

    // a bancada vira de dois: mais larga, e uma cadeira vermelha atrás de cada um (a do convidado vira a do Machamp)
    const mesa = document.querySelector('#banc .mesa-n');
    mesa.style.cssText = 'left:40px;--w:1000px';
    const RX = 262, MX = 700; // o meio do Raichu e o do Machamp
    const cad = $('cadeira');
    cad.style.transform = `translate(${MX}px,1215px) scale(1.15)`;
    const cad2 = cad.cloneNode(true);
    cad2.id = 'cadeira-r';
    cad2.style.transform = `translate(${RX}px,1200px)`;
    cad.after(cad2);

    /** Uma camada de pixel art: a folha `png` em grade de quadros w x h (escala e), com a coluna `cx` e a linha `ly`
     * da grade no ponto (0, 0) do pai. Devolve o elemento e o `q(coluna, linha, t)` que troca o quadro. */
    const camada = (pai, png, w, h, nc, nl, e, cx, ly) => {
      const el = div(pai, 'spr', `width:${w * e}px;height:${h * e}px;left:${-cx * e}px;top:${-ly * e}px;background-image:url(${png});background-size:${nc * w * e}px ${nl * h * e}px`);
      return { el, q: (c, l, t) => tl.set(el, { backgroundPosition: `${-c * w * e}px ${-l * h * e}px` }, t) };
    };
    const ator = (x, z) => {
      const el = div(CAM, 'ator', `z-index:${z}`);
      gsap.set(el, { x, y: MESA });
      const corpo = div(el, 'corpo');
      return { el, corpo };
    };
    // Raichu (e 14): a linha 22 do quadro (28 da folha) no tampo; o rosto em grade 4 bocas x 3 olhos
    const R = ator(RX, 20);
    const rRosto = camada(R.corpo, '26-rosto.png', 40, 26, 4, 3, 14, 19.5, 22);
    // Machamp (e 12): a linha 24 no tampo; o rosto em grade 4 bocas x 6 (3 olhos x puxão da gravata), o gesto (3) e,
    // na frente da bancada, os braços de baixo com a folha
    const M = ator(MX, 20);
    const mRosto = camada(M.corpo, '68-rosto.png', 40, 30, 4, 6, 12, 19.5, 24);
    const mGesto = camada(M.corpo, '68-gesto.png', 44, 30, 3, 1, 12, 23.5, 24);
    const MF = ator(MX, 31);
    camada(MF.corpo, '68-frente.png', 40, 30, 1, 1, 12, 19.5, 24);
    gsap.set([R.corpo, M.corpo], { transformOrigin: '0px 0px' });

    /** Junta as mudanças de boca, olho e gravata de um ator e põe o quadro certo em cada hora. */
    const estado = (rosto, base, linha) => {
      const ev = [];
      const add = (campo, lista) => { for (const [t, v] of lista) ev.push([t, campo, v]); };
      const s = { ...base };
      return {
        add,
        aplica: () => {
          ev.sort((a, b) => a[0] - b[0]);
          rosto.q(s.boca, linha(s), 0);
          for (const [t, campo, v] of ev) { s[campo] = v; rosto.q(s.boca, linha(s), t); }
        },
      };
    };
    const rE = estado(rRosto, { boca: 0, olho: 0 }, (s) => s.olho);
    const mE = estado(mRosto, { boca: 0, olho: 0, puxa: 0 }, (s) => s.puxa * 3 + s.olho);
    const ATOR = { raichu: [R, rE], machamp: [M, mE] };

    // as falas (window.FALAS, do voz-dupla.mjs): a boca letra por letra, um pulinho em cada sílaba, a caixa e a seta
    const CAIXA = $('caixa');
    tl.set(CAIXA, { opacity: 0 }, 0);
    tl.set(CAIXA, { opacity: 1 }, FALAS[0].t0 - 0.1);
    FALAS.forEach((f, k) => {
      const [A, E] = ATOR[f.quem];
      E.add('boca', f.bocas);
      for (const s of f.silabas) tl.to(A.corpo, { keyframes: { y: [0, -5, 0] }, duration: 0.12, ease: 'sine.inOut' }, s);
      tl.set('#nome', { textContent: f.quem.toUpperCase() }, f.t0 - 0.1);
      const tx = div(CAIXA, 'txt');
      tx.innerHTML = f.texto.split(' ').map((p) => `<b>${Array.from(p).map((c) => `<s>${c}</s>`).join('')}</b>`).join(' ');
      tl.set(tx, { opacity: 1 }, f.t0 - 0.1);
      const prox = FALAS[k + 1];
      if (prox) tl.set(tx, { opacity: 0 }, prox.t0 - 0.1);
      [...tx.querySelectorAll('s')].forEach((l, i) => tl.set(l, { visibility: 'visible' }, f.chars[i]));
      const ate = prox ? prox.t0 - 0.1 : FIM;
      for (let t = f.fim + 0.1, n = 0; t < ate; t += 0.3, n++) tl.set('#seta', { opacity: n % 2 ? 0 : 1 }, t);
      tl.set('#seta', { opacity: 0 }, ate);
    });
    // o Raichu balança a cabeça enquanto fala (inclina pros lados, preso na cintura)
    for (const k of [0, 2]) {
      const f = FALAS[k];
      tl.to(R.corpo, { keyframes: { rotation: [0, -1.6, 1.3, -1.1, 0.8, 0] }, duration: f.fim - f.t0 + 0.15, ease: 'none' }, f.t0);
    }
    // o Machamp fala firme: o tronco sobe um tiquinho no começo da fala
    tl.to(M.corpo, { keyframes: { scaleY: [1, 1.02, 1] }, duration: 0.5, ease: 'sine.inOut' }, FALAS[1].t0);

    // quem não fala reage: pisca, olha pro parceiro (o rosto vira um pouco pro lado dele), e o Machamp mexe na gravata
    rE.add('olho', [[0.2, 1], [0.3, 0], [2.6, 2], [3.5, 1], [3.6, 2], [4.35, 0], [6.55, 1], [6.65, 0]]);
    tl.to(R.corpo, { rotation: 2, x: 3, duration: 0.25, ease: 'power2.out' }, 2.6);
    tl.to(R.corpo, { rotation: 0, x: 0, duration: 0.25, ease: 'power2.inOut' }, 4.35);
    mE.add('olho', [[0.8, 2], [1.9, 1], [2.0, 2], [2.55, 0], [4.55, 2], [5.3, 1], [5.4, 2], [6.3, 0], [6.95, 1], [7.05, 0]]);
    mE.add('puxa', [[0.25, 1], [0.37, 0], [0.5, 1], [0.62, 0], [3.95, 1], [4.07, 0], [6.5, 1], [6.62, 0], [6.75, 1], [6.87, 0]]);
    for (const [a, b] of [[0.8, 2.55], [4.55, 6.3]]) {
      tl.to(M.corpo, { x: -5, duration: 0.25, ease: 'power2.out' }, a);
      tl.to(M.corpo, { x: 0, duration: 0.25, ease: 'power2.inOut' }, b);
    }
    rE.aplica();
    mE.aplica();
    // o braço que gesticula: dedo pra cima (0), mão aberta pro parceiro (1), mão no alto (2)
    for (const [t, g] of [[0, 0], [0.9, 1], [2.75, 2], [3.3, 0], [5.25, 2], [6.5, 0]]) {
      mGesto.q(g, 0, t);
      if (t) tl.fromTo(mGesto.el, { y: g === 1 ? 3 : -4 }, { y: 0, duration: 0.12, ease: 'back.out(3)', immediateRender: false }, t);
    }

    // as canecas na bancada, uma na frente de cada um, com o vapor (4 quadros, fora de fase)
    const CAN = [[RX + 120, 0, 0], [MX + 180, 1, 2]];
    for (const [x, cor, fase] of CAN) {
      const el = div(CAM, 'ator', 'z-index:32');
      gsap.set(el, { x, y: MESA + 15 });
      const c = camada(el, 'caneca.png', 11, 14, 4, 2, 10, 4.5, 14);
      for (let t = 0, n = fase; t < FIM; t += 0.16, n++) c.q(n % 4, cor, t);
    }

    // manchete, selo, tarjas (a do Raichu pela esquerda, a do Machamp pela direita, embaixo de cada um)
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
    gc('RAICHU', 28, 0.6, 4.4, -1);
    gc('MACHAMP', 560, 2.8, 6.6, 1);
    flash(tl, 0, 0.6, 0.25);
    tl.set({}, {}, FIM);
    window.__timelines = { root: tl };
