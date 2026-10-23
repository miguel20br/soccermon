// Animatic da Rota de baby: o que os quadros de A (a.html) e C (c.html) usam. Cada <section class="q"> é um quadro
// parado de 1080x1920; o montar.mjs tira print de cada um e corta na batida da música. Carrega depois de
// midia/sprites.js (SPR, TORCIDA). Tudo centrado em x 540; texto entre y 130 e 1632 (fora dos 15% de baixo).
(() => {
    const SPR = window.SPR;
    const css = `
@font-face { font-family: "Galmuri11"; src: url("midia/Galmuri11-Bold.woff2") format("woff2"); font-weight: 700; }
html, body { margin: 0; background: #000; }
.q { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Galmuri11", monospace; background: #070a18; color: #fff; }
.q div, .q img, .q canvas { position: absolute; }
.spr { position: absolute; image-rendering: pixelated; }
.sombra { position: absolute; border-radius: 50%; background: rgb(0 0 0 / 32%); }
.pix { image-rendering: pixelated; }
.palco { inset: 0; background: radial-gradient(circle at 50% 45%, #2a3a7a, #070a18 72%); overflow: hidden; }
.raios { left: 50%; top: 45%; width: 3400px; height: 3400px; margin: -1700px 0 0 -1700px;
  background: repeating-conic-gradient(rgb(255 255 255 / 7%) 0 6deg, transparent 6deg 13deg); }
.txt { left: 70px; width: 940px; text-align: center; line-height: 1.18; -webkit-text-stroke: 14px #0e1430; paint-order: stroke fill;
  text-shadow: 0 8px 0 #0e1430; letter-spacing: 1px; }
.txt b { color: #ffcb05; font-weight: 700; }
.selo { left: 50%; transform: translateX(-50%); top: 150px; display: flex; align-items: stretch; font-size: 40px; letter-spacing: 2px;
  box-shadow: 0 8px 0 rgb(0 0 0 / 45%); white-space: nowrap; }
.selo span { padding: 14px 24px 12px; background: #0e1430; border: 5px solid #2a4ea0; }
.selo span:first-child { background: #ffcb05; color: #0e1430; border-color: #ffcb05; }
.retrato { width: 200px; height: 200px; border: 8px solid #fff; box-shadow: 0 0 0 8px #0e1430, 0 14px 0 8px rgb(0 0 0 / 40%); background: #20305f; }
.retrato img { width: 200px; height: 200px; image-rendering: pixelated; display: block; }
.carta { box-shadow: 0 18px 0 rgb(0 0 0 / 45%), 0 0 0 6px #0e1430; border-radius: 22px; }
.bola { image-rendering: auto; }
/* camada própria: sem isso o Chrome achata a bola e as sombras dentro do plano 3D da quadra e elas somem */
.q .sombra, .q img, .q .txt, .q > div { will-change: transform; }
`;
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

    const el = (pai, tag, cls = '', style = '', html = '') => {
        const d = document.createElement(tag);
        if (cls) d.className = cls;
        if (style) d.style.cssText = style;
        if (html) d.innerHTML = html;
        pai.appendChild(d);
        return d;
    };

    /** Sprite PMD com o pé em (x, y). dir: 0 frente, 2 direita, 4 costas, 6 esquerda. */
    function sp(pai, id, anim, dir, quadro, esc, x, y, { sombra = true, z = 0, espelho = false } = {}) {
        const s = SPR[id];
        const a = s.anims[anim] ?? s.anims.Idle;
        const [fx, fy] = a.rects[dir % a.rects.length][quadro % a.rects[0].length];
        const w = a.w * esc;
        const h = a.h * esc;
        const top = y - a.pe * h;
        if (sombra) el(pai, 'div', 'sombra', `left:${x - w * 0.28}px;top:${y - w * 0.07}px;width:${w * 0.56}px;height:${w * 0.14}px;z-index:${z}`);
        // quadro recortado num canvas (a folha inteira ampliada passa do limite de textura do Chrome)
        const c = el(pai, 'canvas', 'spr', `left:${x - w / 2}px;top:${top}px;width:${w}px;height:${h}px;z-index:${z + 1};` + (espelho ? 'transform:scaleX(-1);' : ''));
        c.width = a.w;
        c.height = a.h;
        pendentes.push(folha(s.folha).then((img) => c.getContext('2d').drawImage(img, fx, fy, a.w, a.h, 0, 0, a.w, a.h)));
        return c;
    }
    const folhas = new Map();
    const pendentes = [];
    const folha = (src) => {
        if (!folhas.has(src))
            folhas.set(src, new Promise((ok, erro) => {
                const i = new Image();
                i.onload = () => ok(i);
                i.onerror = erro;
                i.src = src;
            }));
        return folhas.get(src);
    };
    window.pronto = () => Promise.all(pendentes);

    /** Fundo de marca: azul-noite radial com os raios. */
    function palco(pai) {
        const p = el(pai, 'div', 'palco');
        el(p, 'div', 'raios');
        return p;
    }

    /**
     * Ginásio visto do chão: teto com luzes, arquibancada com a torcida (`cheia` de 0 a 1) e a quadra do jogo em
     * perspectiva (o comprimento indo pro fundo). `hz`: y do horizonte (onde a quadra encontra a arquibancada).
     */
    function ginasio(pai, { quadra = 0, cheia = 0, hz = 820, alto = 440, rx = 62, esc = 1, luzes = 60, alturaTotal = 1920 } = {}) {
        el(pai, 'div', '', `inset:0;background:linear-gradient(180deg,#03050f 0,#0b1030 ${hz - alto}px,#141b40 ${hz}px)`);
        // luzes do teto (no alto, acima de tudo)
        for (let i = 0; i < 5; i++) {
            const x = 90 + i * 225;
            el(pai, 'div', '', `left:${x - 70}px;top:${luzes}px;width:140px;height:26px;border-radius:5px;background:#fff7d6;box-shadow:0 0 50px 22px rgb(255 240 190 / 45%)`);
        }
        // arquibancada: degraus
        const n = 5;
        const dh = alto / n;
        for (let i = 0; i < n; i++)
            el(pai, 'div', '', `left:0;top:${hz - alto + i * dh}px;width:1080px;height:${dh}px;background:${i % 2 ? '#232d57' : '#1c2447'};border-top:6px solid #4b5a9a`);
        el(pai, 'div', '', `left:0;top:${hz - 40}px;width:1080px;height:40px;background:#2a4ea0;border-top:8px solid #ffcb05`);
        // torcida: cada degrau uma fileira, quem entra sai de uma ordem fixa (cheia = fração dos lugares)
        const lugares = [];
        for (let i = 0; i < n - 1; i++) for (let j = 0; j < 9; j++) lugares.push([i, j]);
        const ordem = lugares.map((l, k) => [l, (k * 37) % lugares.length]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
        const ate = Math.round(cheia * lugares.length);
        ordem.slice(0, ate).forEach(([i, j], k) => {
            const id = window.TORCIDA[(i * 9 + j * 5) % window.TORCIDA.length];
            const x = 60 + j * 120 + (i % 2) * 50;
            sp(pai, id, 'Idle', 0, k, 2.6 * esc, x, hz - alto + (i + 1) * dh - 6, { sombra: false, z: 2 + i });
        });
        // a quadra do jogo, de pé (gol de cá embaixo, o de lá no horizonte), deitada em perspectiva
        // a quadra do jogo, de pé (gol de cá embaixo, o de lá no horizonte), deitada em perspectiva; numa caixa própria
        // (sem ela, o plano 3D passava por cima das sombras e da bola)
        const caixa = el(pai, 'div', '', `left:0;top:${hz}px;width:1080px;height:${alturaTotal - hz}px;overflow:hidden;z-index:1`);
        const q = el(
            caixa,
            'div',
            '',
            `position:absolute;left:-660px;top:0;width:2400px;height:4000px;transform-origin:50% 0;transform:perspective(1100px) rotateX(${rx}deg);` +
                `background:url(midia/quadra-${quadra}-v.png) center top/100% 100% no-repeat;image-rendering:pixelated`,
        );
        return q;
    }

    function selo(pai, a, b) {
        return el(pai, 'div', 'selo', 'z-index:50', `<span>${a}</span><span>${b}</span>`);
    }
    function retrato(pai, arq, x, y, rot = 0) {
        return el(pai, 'div', 'retrato', `left:${x - 100}px;top:${y - 100}px;transform:rotate(${rot}deg);z-index:40`, `<img src="midia/retrato-${arq}.png">`);
    }
    function bola(pai, x, y, d, z = 5) {
        el(pai, 'div', 'sombra', `left:${x - d * 0.42}px;top:${y + d * 0.42}px;width:${d * 0.84}px;height:${d * 0.18}px;z-index:${z}`);
        return el(pai, 'img', 'bola', `left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;z-index:${z + 1}`).setAttribute('src', 'midia/ball.svg');
    }
    function carta(pai, id, x, y, w, rot = 0, z = 10) {
        const i = el(pai, 'img', 'carta', `left:${x - w / 2}px;top:${y - (w * 798) / 570 / 2}px;width:${w}px;transform:rotate(${rot}deg);z-index:${z}`);
        i.src = `midia/c-${id}.png`;
        return i;
    }
    function texto(pai, html, top, px, extra = '') {
        return el(pai, 'div', 'txt', `top:${top}px;font-size:${px}px;z-index:60;${extra}`, html);
    }
    function logo(pai, top, w = 860) {
        const i = el(pai, 'img', '', `left:${540 - w / 2}px;top:${top}px;width:${w}px;z-index:60`);
        i.src = 'midia/logo.svg';
        return i;
    }
    /** O troféu do jogo (PixelTrophy, arte `taca`), em pixel. */
    function taca(pai, x, y, px = 14, z = 30) {
        const ART = ['..hhhhhhhhhhhh..', '.s.hoooooooos.s.', 's..hoooooooos..s', 's..hoooooooos..s', '.s.hoooooooos.s.', '...shooooooos...',
            '....shooooos....', '.....shooos.....', '......hoos......', '......hoos......', '.....hoooos.....', '....bbbbbbbb....',
            '...bbbbbbbbbb...', '...bbbbbbbbbb...'];
        const C = { o: '#ffcb05', h: '#fff3a0', s: '#ff8a1c', b: '#6b3e1e' };
        const w = ART[0].length * px;
        const box = el(pai, 'div', '', `left:${x - w / 2}px;top:${y - ART.length * px}px;width:${w}px;height:${ART.length * px}px;z-index:${z};filter:drop-shadow(0 0 4px #0e1430) drop-shadow(0 0 3px #0e1430)`);
        ART.forEach((row, r) => [...row].forEach((c, k) => {
            if (C[c]) el(box, 'div', '', `left:${k * px}px;top:${r * px}px;width:${px}px;height:${px}px;background:${C[c]};position:absolute`);
        }));
        return box;
    }

    /** Polaroid: moldura branca, foto quadrada (cena de 1080x1080 reduzida pra `lado`) e a legenda embaixo. */
    function polaroid(pai, x, y, lado, rot, legenda, desenha, z = 20, fitaW = 0) {
        const m = 0.05 * lado;
        const f = el(pai, 'div', '', `left:${x - lado / 2 - m}px;top:${y - lado / 2 - m}px;width:${lado}px;height:${lado}px;padding:${m}px ${m}px ${lado * 0.2}px;` +
            `background:#f7f3ea;transform:rotate(${rot}deg);z-index:${z};box-shadow:0 ${lado * 0.03}px 0 rgb(0 0 0 / 40%),0 0 0 4px #0e1430`);
        const foto = el(f, 'div', '', `position:absolute;left:${m}px;top:${m}px;width:${lado}px;height:${lado}px;overflow:hidden;background:#000`);
        const cena = el(foto, 'div', '', `position:absolute;left:0;top:0;width:1080px;height:1080px;overflow:hidden;transform-origin:0 0;transform:scale(${lado / 1080})`);
        desenha(cena);
        el(f, 'div', '', `position:absolute;left:0;width:100%;top:${lado + m * 1.6}px;text-align:center;color:#0e1430;font-size:${lado * 0.065}px;letter-spacing:1px`, legenda);
        // fita colando a foto na página (gira junto com a foto)
        if (fitaW) el(f, 'div', '', `left:${(lado + 2 * m - fitaW) / 2}px;top:-24px;width:${fitaW}px;height:48px;background:rgb(255 203 5 / 72%);transform:rotate(${rot > 0 ? -3 : 3}deg);box-shadow:0 2px 0 rgb(0 0 0 / 25%)`);
        return f;
    }
    function fita(pai, x, y, w, rot, z = 40) {
        return el(pai, 'div', '', `left:${x - w / 2}px;top:${y - 22}px;width:${w}px;height:44px;background:rgb(255 203 5 / 72%);transform:rotate(${rot}deg);z-index:${z};box-shadow:0 2px 0 rgb(0 0 0 / 25%)`);
    }
    /** Página do álbum: azul da marca com papel quadriculado bem leve e a lombada à esquerda. */
    function pagina(pai) {
        return el(pai, 'div', '', 'inset:0;background:linear-gradient(90deg,rgb(0 0 0 / 45%),transparent 70px),' +
            'repeating-linear-gradient(0deg,rgb(255 255 255 / 4%) 0 2px,transparent 2px 60px),repeating-linear-gradient(90deg,rgb(255 255 255 / 4%) 0 2px,transparent 2px 60px),' +
            'radial-gradient(circle at 50% 40%,#2a3a7a,#121a44 75%)');
    }

    window.Q = { polaroid, fita, pagina, el, sp, palco, ginasio, selo, retrato, bola, carta, texto, logo, taca };
})();
