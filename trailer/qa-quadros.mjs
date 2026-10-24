// QA de quadros das cenas do HyperFrames feitas com sprites PMD (trailer/curtas/*, curtas-2): abre a cena headless,
// anda a linha do tempo quadro a quadro (30 fps, a duração inteira) e confere em cada quadro:
//   1. sprite: o recorte da folha (background-position + tamanho) é exatamente um quadro do AnimData, inteiro e dentro
//      da folha (senão aparece pedaço do quadro vizinho: o Pikachu em dobro do Snorlax v1);
//   2. pixel: o quadro recortado não tem fragmento solto encostado na borda (resto de quadro vizinho na folha);
//   3. personagem (ator com sombra) aparece no máximo uma vez na tela; torcida (ator sem sombra) pode repetir;
//   4. sombra: escondida se o sprite está escondido e embaixo dele (pulo descontado);
//   5. bola: exatamente uma visível enquanto a cena dela está no ar.
// Uso (da raiz do repo): node trailer/qa-quadros.mjs trailer/curtas/snorlax [--fps 30] [--de 0] [--ate <s>]
// Sai com código 1 se achar problema e lista os trechos (tempo do quadro + causa).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const pasta = resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const opt = (n, d) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? Number(args[i + 1]) : d;
};
const fps = opt('fps', 30);

const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
const srv = createServer((req, res) => {
    const f = join(pasta, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(pasta) || !existsSync(f) || statSync(f).isDirectory()) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TIPOS[extname(f)] ?? 'application/octet-stream' });
    createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((r) => srv.once('listening', r));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('erro na cena:', e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
await page.waitForFunction(() => window.__timelines?.root && window.SPR);

const dur = await page.evaluate(() => Number(document.querySelector('[data-composition-id]').dataset.duration));
const de = opt('de', 0);
const ate = opt('ate', dur);

// tudo que roda no navegador: prepara as folhas (pixels pra checagem 2) e define window.__qa(t)
await page.evaluate(async () => {
    const SPR = window.SPR;
    const folhas = {};
    for (const [k, S] of Object.entries(SPR)) {
        const img = new Image();
        img.src = S.folha;
        await img.decode();
        const cv = document.createElement('canvas');
        cv.width = S.tam[0];
        cv.height = S.tam[1];
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const rects = new Map(); // quadro → animação
        for (const [nome, A] of Object.entries(S.anims)) for (const dir of A.rects) for (const [x, y] of dir) rects.set(`${x},${y},${A.w},${A.h}`, nome);
        folhas[k] = { S, cx, rects, cache: new Map() };
    }
    const folhaDe = (url) => Object.keys(folhas).find((k) => url.includes(`/${SPR[k].folha}"`) || url.endsWith(`/${SPR[k].folha})`));

    /** Pixels do quadro: caixa opaca (em fração do quadro) e fragmentos soltos na borda. */
    function pixels(k, x, y, w, h) {
        const f = folhas[k];
        const chave = `${x},${y},${w},${h}`;
        if (f.cache.has(chave)) return f.cache.get(chave);
        const d = f.cx.getImageData(x, y, w, h).data;
        const lab = new Int32Array(w * h).fill(-1);
        const comps = [];
        for (let p = 0; p < w * h; p++) {
            if (d[p * 4 + 3] === 0 || lab[p] >= 0) continue;
            const c = { n: 0, borda: false, x0: w, y0: h, x1: 0, y1: 0 };
            const pilha = [p];
            lab[p] = comps.length;
            while (pilha.length) {
                const q = pilha.pop();
                const qx = q % w;
                const qy = (q - qx) / w;
                c.n++;
                c.x0 = Math.min(c.x0, qx);
                c.y0 = Math.min(c.y0, qy);
                c.x1 = Math.max(c.x1, qx + 1);
                c.y1 = Math.max(c.y1, qy + 1);
                if (qx === 0 || qy === 0 || qx === w - 1 || qy === h - 1) c.borda = true;
                for (let dy = -1; dy <= 1; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = qx + dx;
                        const ny = qy + dy;
                        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                        const r = ny * w + nx;
                        if (lab[r] < 0 && d[r * 4 + 3] > 0) {
                            lab[r] = comps.length;
                            pilha.push(r);
                        }
                    }
            }
            comps.push(c);
        }
        const maior = comps.reduce((a, c) => (c.n > (a?.n ?? 0) ? c : a), null);
        const res = {
            vazio: !maior,
            fragmentos: comps.filter((c) => c !== maior && c.borda && c.n < 0.15 * maior.n).length,
            caixa: maior && {
                x0: Math.min(...comps.map((c) => c.x0)) / w,
                x1: Math.max(...comps.map((c) => c.x1)) / w,
                y0: Math.min(...comps.map((c) => c.y0)) / h,
                y1: Math.max(...comps.map((c) => c.y1)) / h,
            },
        };
        f.cache.set(chave, res);
        return res;
    }

    const root = document.querySelector('[data-composition-id]');
    /** Opacidade efetiva no instante t (inclui o liga/desliga dos .clip do HyperFrames pelo data-start/duration). */
    function opac(el, t) {
        let o = 1;
        for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
            o *= Number(cs.opacity);
            if (e.classList.contains('clip') && e.dataset.start !== undefined) {
                const s = Number(e.dataset.start);
                if (t < s || t >= s + Number(e.dataset.duration)) return 0;
            }
        }
        return o;
    }
    const naTela = (r) => r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < 1080 && r.top < 1920;
    const ty = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform).m42;

    window.__qa = (t) => {
        // o quadro 0 forçado (o tl.set em 0 não renderiza se o relógio já está em 0; o render do HyperFrames desenha)
        if (t === 0) window.__timelines.root.render(0, true, true);
        else window.__timelines.root.totalTime(t, true);
        const prob = [];
        const vistos = {};
        for (const ator of document.querySelectorAll('.ator')) {
            const spr = ator.querySelector('.spr');
            const sh = ator.querySelector(':scope > .sombra');
            const cs = getComputedStyle(spr);
            const k = folhaDe(cs.backgroundImage);
            const s = k && parseFloat(cs.backgroundSize) / SPR[k].tam[0];
            const w = parseFloat(cs.width) / s;
            const h = parseFloat(cs.height) / s;
            const ov = opac(spr, t);
            const r = spr.getBoundingClientRect();
            if (!k || !(w > 0 && h > 0)) {
                if (sh && opac(sh, t) > 0.01 && naTela(sh.getBoundingClientRect())) prob.push(`sombra sem sprite (${k ?? '?'})`);
                continue;
            }
            const nome = k.replace(/x$/, '');
            const [bx, by] = cs.backgroundPosition.split(' ').map((v) => -parseFloat(v) / s);
            const visivel = ov > 0.01 && naTela(r);
            if (visivel) {
                const arred = (v) => Math.round(v * 1000) / 1000;
                const [x, y, ww, hh] = [bx, by, w, h].map(arred);
                if (![x, y, ww, hh].every(Number.isInteger)) prob.push(`${nome}: recorte fora da grade da folha (${x},${y} ${ww}x${hh})`);
                else if (x < 0 || y < 0 || x + ww > SPR[k].tam[0] || y + hh > SPR[k].tam[1]) prob.push(`${nome}: recorte sai da folha (${x},${y} ${ww}x${hh})`);
                else if (!folhas[k].rects.has(`${x},${y},${ww},${hh}`)) prob.push(`${nome}: recorte não é um quadro da folha ${k} (${x},${y} ${ww}x${hh}): pedaço dos vizinhos`);
                else {
                    const px = pixels(k, x, y, ww, hh);
                    if (px.fragmentos) prob.push(`${nome}: ${px.fragmentos} fragmento(s) solto(s) na borda do quadro ${x},${y}`);
                    // sombra embaixo do corpo (o pulo do corpo descontado)
                    if (sh && !px.vazio && opac(sh, t) > 0.01) {
                        const flip = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform).a < 0;
                        const c = px.caixa;
                        const ox0 = r.left + (flip ? 1 - c.x1 : c.x0) * r.width;
                        const ox1 = r.left + (flip ? 1 - c.x0 : c.x1) * r.width;
                        const sr = sh.getBoundingClientRect();
                        const zoom = sr.width / sh.offsetWidth; // câmera + escala do ator: px do ator → px da tela
                        const oy0 = r.top + c.y0 * r.height;
                        const oy1 = r.top + c.y1 * r.height - ty(ator.querySelector('.corpo')) * zoom; // pulo descontado
                        const alt = oy1 - oy0;
                        const sx = (sr.left + sr.right) / 2;
                        const sy = (sr.top + sr.bottom) / 2;
                        // na largura do corpo; na metade de baixo dele ou até meio corpo abaixo (no Hop do PMD o corpo sobe
                        // dentro do quadro e a sombra fica no chão: aí só a largura conta)
                        const hop = folhas[k].rects.get(`${x},${y},${ww},${hh}`) === 'Hop';
                        if (sx < ox0 || sx > ox1 || sy < oy0 + alt / 2 || (!hop && sy > oy1 + alt / 2))
                            prob.push(`${nome}: sombra solta (sombra em ${sx | 0},${sy | 0}; corpo ${ox0 | 0}–${ox1 | 0} x ${oy0 | 0}–${oy1 | 0})`);
                    }
                }
                if (sh) vistos[nome] = (vistos[nome] ?? 0) + 1;
            } else if (sh && ov <= 0.01 && opac(sh, t) > 0.01 && naTela(sh.getBoundingClientRect())) prob.push(`${nome}: sombra visível com o sprite escondido`);
        }
        for (const [n, c] of Object.entries(vistos)) if (c > 1) prob.push(`${n} aparece ${c} vezes`);
        // bola: uma visível por clipe no ar que tem bola
        const porClip = new Map();
        for (const b of document.querySelectorAll('.bola')) {
            const clip = b.closest('.clip');
            if (opac(clip, t) <= 0.01) continue;
            const corpoBola = b.querySelector('svg');
            const v = opac(corpoBola, t) > 0.01 ? 1 : 0;
            porClip.set(clip, (porClip.get(clip) ?? 0) + v);
            const sh = b.querySelector(':scope > .sombra');
            if (sh && !v && opac(sh, t) > 0.01 && naTela(sh.getBoundingClientRect())) prob.push('bola: sombra visível com a bola escondida');
        }
        for (const [clip, n] of porClip) if (n !== 1) prob.push(`bola visível ${n} vezes (#${clip.id})`);
        return prob;
    };
});

// anda quadro a quadro, juntando quadros seguidos com o mesmo problema num trecho
const trechos = new Map();
const n0 = Math.round(de * fps);
const n1 = Math.ceil(ate * fps);
for (let n = n0; n < n1; n++) {
    const t = n / fps;
    for (const p of await page.evaluate((t) => window.__qa(t), t)) {
        const tr = trechos.get(p);
        if (tr && tr.at(-1)[1] === n - 1) tr.at(-1)[1] = n;
        else trechos.set(p, [...(tr ?? []), [n, n]]);
    }
}
await browser.close();
srv.close();

const linhas = [];
for (const [p, tr] of trechos)
    for (const [a, z] of tr) linhas.push([a, `${(a / fps).toFixed(2)}${z > a ? `–${(z / fps).toFixed(2)}` : ''} s (quadro ${a}${z > a ? `–${z}` : ''}): ${p}`]);
linhas.sort((x, y) => x[0] - y[0]);
for (const [, l] of linhas) console.log(l);
console.log(`${pasta}: ${n1 - n0} quadros a ${fps} fps, ${linhas.length} problema(s)`);
process.exit(linhas.length ? 1 : 0);
