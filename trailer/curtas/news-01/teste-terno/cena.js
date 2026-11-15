// O roteiro da cena de teste (4,5 s, só a bancada): entra no lugar do <script> da linha do tempo de uma cópia do
// news-01/index.html (sem os vídeos nem a música), com window.TESTE = 'raichu' | 'machamp' e as folhas <id>-terno.png
// do terno.mjs ao lado. Quadros: 0,75 s (plano normal) e 2 s (com a tarja); render: npx hyperframes render . -c <html>.
    // Teste de apresentador de terno (News #1, 15/11): só a bancada, 4,5 s. window.TESTE = 'raichu' | 'machamp'
    const { div, flash } = C;
    const FIM = 4.5;
    const tl = gsap.timeline({ paused: true });
    const $ = (id) => document.getElementById(id);
    const Q = {
      raichu: { nome: 'RAICHU', png: '26-terno.png', w: 40, h: 56, pe: 0.607, e: 18, x: 290, y: 1165 },
      machamp: { nome: 'MACHAMP', png: '68-terno.png', w: 40, h: 48, pe: 0.625, e: 15, x: 250, y: 1135 },
    }[window.TESTE];
    const texto = `Boa noite! Eu sou o ${Q.nome[0] + Q.nome.slice(1).toLowerCase()}, seu apresentador desta noite.`;
    tl.set(['#banc', '#bug', '#manchete', '#caixa'], { autoAlpha: 1 }, 0);
    tl.set(['#vin', '#rota', '#sonora', '#esc', '#banco-c', '#fundo', '#fim'], { autoAlpha: 0 }, 0);
    tl.set('#t-marca', { opacity: 1 }, 0);
    gsap.set('#varre', { autoAlpha: 0 });
    const CAM = $('cam');
    gsap.set(CAM, { transformOrigin: '0px 0px' });
    tl.fromTo(CAM, { scale: 1, x: 0, y: 0 }, { scale: 1.04, x: 100 - 1.04 * 100, y: 900 - 1.04 * 900, duration: 3, ease: 'sine.out', immediateRender: false }, 0);
    tl.fromTo('#raios-tel', { rotation: 0 }, { rotation: 10, duration: FIM, ease: 'none', immediateRender: false }, 0);
    // o apresentador: a folha pintada (base, fala, pisca) no lugar do Idle do PMD
    const el = div(CAM, 'ator', 'z-index:20');
    gsap.set(el, { x: Q.x, y: Q.y });
    const corpo = div(el, 'corpo');
    gsap.set(corpo, { transformOrigin: '0px 0px' });
    const spr = div(corpo, 'spr', `width:${Q.w * Q.e}px;height:${Q.h * Q.e}px;left:${(-Q.w * Q.e) / 2}px;top:${-Q.pe * Q.h * Q.e}px;background-image:url(${Q.png});background-size:${3 * Q.w * Q.e}px ${Q.h * Q.e}px`);
    const q = (k, t) => tl.set(spr, { backgroundPosition: `${-k * Q.w * Q.e}px 0px` }, t);
    q(0, 0);
    // fala: a boca abre e fecha enquanto o texto entra e um pouco depois; pisca duas vezes
    for (let t = 0.3, k = 0; t < 2.3; t += 0.13, k++) q(k % 2 ? 0 : 1, t);
    q(0, 2.3);
    for (const t of [2.75, 4.0]) { q(2, t); q(0, t + 0.12); }
    tl.to(corpo, { keyframes: { y: [-18, 0], rotation: [-3, 0] }, duration: 0.36, ease: 'sine.inOut' }, 0.3);
    tl.to(corpo, { keyframes: { scaleY: [1, 1.025, 1] }, duration: 1.2, ease: 'sine.inOut', repeat: 2 }, 0.8);
    // manchete, selo e a caixa
    const sp = div($('barra'), '', 'position:absolute;inset:0');
    sp.innerHTML = '<span>SOCCERMON NEWS #1</span>';
    tl.fromTo('#manchete', { x: 1100 }, { x: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, 0.04);
    for (let t = 0, k = 0; t < FIM; t += 0.5, k++) tl.set(['#ponto', '#dois'], { opacity: k % 2 ? 0.25 : 1 }, t);
    const CAIXA = $('caixa');
    tl.set(CAIXA, { opacity: 0 }, 0);
    tl.set(CAIXA, { opacity: 1 }, 0.3);
    tl.set('#nome', { textContent: Q.nome }, 0.3);
    const tx = div(CAIXA, 'txt');
    tx.innerHTML = texto.split(' ').map((p) => `<b>${Array.from(p).map((c) => `<s>${c}</s>`).join('')}</b>`).join(' ');
    tl.set(tx, { opacity: 1 }, 0.3);
    const ls = [...tx.querySelectorAll('s')];
    ls.forEach((l, i) => tl.set(l, { visibility: 'visible' }, 0.3 + (0.3 * i) / ls.length));
    for (let t = 0.7, k = 0; t < FIM; t += 0.3, k++) tl.set('#seta', { opacity: k % 2 ? 0 : 1 }, t);
    // a tarja de nome
    const g = div($('root'), 'gc', 'left:28px;top:1098px');
    g.innerHTML = `<div class="n">${Q.nome}</div><div class="c">APRESENTADOR</div>`;
    tl.set(g, { opacity: 1 }, 0.9);
    tl.fromTo(g, { x: -1000 }, { x: 0, duration: 0.32, ease: 'power3.out', immediateRender: false }, 0.9);
    tl.fromTo(g.querySelector('.c'), { x: -420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, 1.02);
    tl.to(g, { x: -1100, duration: 0.25, ease: 'power2.in' }, 3.9);
    flash(tl, 0, 0.6, 0.25);
    tl.set({}, {}, FIM);
    window.__timelines = { root: tl };
