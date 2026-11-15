    // Foto parada da dupla do News #1 (15/11): o Raichu de terno à esquerda (de frente, quadro 0 do Idle) e o Machoke de
    // terno à direita, de frente (?dir=0) ou em 3/4 olhando pro Raichu (?dir=7), na cor ?cor=; os dois na escala E, com
    // as canecas e as tarjas. Entra no lugar do <script> da linha do tempo de uma cópia do news-01/index.html (montar.mjs).
    const { div } = C;
    const q = new URLSearchParams(location.search);
    const MESA = 1080, E = 13, EM = 15; // o Machoke um pouco maior que o Raichu (é o grandão da dupla)
    const $ = (id) => document.getElementById(id);
    const tl = gsap.timeline({ paused: true });
    tl.set(['#banc', '#bug', '#manchete'], { autoAlpha: 1 }, 0);
    tl.set(['#vin', '#rota', '#sonora', '#esc', '#banco-c', '#fundo', '#fim'], { autoAlpha: 0 }, 0);
    gsap.set('#varre', { autoAlpha: 0 });
    tl.set('#t-marca', { opacity: 1 }, 0);
    document.head.insertAdjacentHTML('beforeend', `<style>
.cadeira .encosto, .cadeira .assento { background: #5a1c26; box-shadow: inset 0 -16px 0 #3e121a; }
</style>`);
    document.querySelector('#banc .mesa-n').style.cssText = 'left:40px;--w:1000px';
    const RX = 262, GX = 750;
    const cad = $('cadeira');
    cad.style.transform = `translate(${GX - 10}px,1215px) scale(1.1)`;
    const cad2 = cad.cloneNode(true);
    cad2.id = 'cadeira-r';
    cad2.style.transform = `translate(${RX}px,1200px)`;
    cad.after(cad2);

    /** Um quadro parado da folha `folha` (tam), com a linha `linha` do quadro no tampo da mesa. */
    const apresentador = (x, folha, tam, fx, fy, w, h, linha, e = E) =>
      div($('cam'), 'spr', `z-index:20;left:${x - (w * e) / 2}px;top:${MESA - linha * e}px;width:${w * e}px;height:${h * e}px;background-image:url(${folha});background-size:${tam[0] * e}px ${tam[1] * e}px;background-position:${-fx * e}px ${-fy * e}px;image-rendering:pixelated`);
    const A = SPR[26].anims.Idle;
    apresentador(RX, MACH.raichu[q.get('rcor')] ?? SPR[26].folha, SPR[26].tam, ...A.rects[0][0], A.w, A.h, 28);
    const dir = Number(q.get('dir') ?? 0);
    apresentador(GX, MACH.folhas[q.get('cor') ?? 'preto'], MACH.tam, ...MACH.rects[dir][0], MACH.w, MACH.h, MACH.linha, EM);

    // as canecas (a do Machoke azul)
    const CANECA = ['######..', '#kkkk#..', '#NMMM###', '#NMMM#.#', '#NMMM###', '#OMMO#..', '.####...'];
    for (const [x, M, N, O] of [[RX + 150, '#ffcb05', '#fff3a0', '#d99a00'], [GX + 160, '#3a7bd5', '#a8cbff', '#2a4ea0']]) {
      let r = '';
      CANECA.forEach((l, j) => [...l].forEach((c, i) => { if (c !== '.') r += `<rect x="${i}" y="${j}" width="1" height="1" fill="${{ '#': '#0e1430', k: '#5a3418', M, N, O }[c]}"/>`; }));
      div($('cam'), '', `position:absolute;left:${x - 4 * E}px;top:${MESA + 22 - 7 * E}px;z-index:32`).innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${8 * E}" height="${7 * E}" viewBox="0 0 8 7" shape-rendering="crispEdges" style="display:block">${r}</svg>`;
    }

    const sp = div($('barra'), '', 'position:absolute;inset:0');
    sp.innerHTML = '<span>SOCCERMON NEWS #1</span>';
    for (const [nome, x] of [['RAICHU', 28], ['MACHOKE', 560]]) {
      const g = div($('root'), 'gc', `left:${x}px;top:1110px;opacity:1`);
      g.innerHTML = `<div class="n">${nome}</div><div class="c">APRESENTADOR</div>`;
    }
    tl.set({}, {}, 1);
    window.__timelines = { root: tl };
