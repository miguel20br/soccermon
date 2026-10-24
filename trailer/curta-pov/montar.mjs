// Monta o curta POV: os 3 momentos gravados (gravar.mjs) no tempo da música (curta-pov-n3.mjs), um quadro por vez no
// quadro.html (headless), e junta com a música a −14 LUFS.
//   node trailer/curta-pov/montar.mjs <pasta da gravação> <saída sem extensão>
// A pasta tem n1/, n2/, n3/ (quadros + meta.json + botao.png/json). O n3 é gravado com SEM_FAIXA=1 (a faixa do
// especial vem daqui, grande) e passo fino depois do toque (FINO, câmera lenta lisa). As âncoras do n3 (QUADROS_N3,
// números dos arquivos da gravação) saem da folha de contato: tinta do hitstop, início do voo, impacto no goleiro,
// a bola rolando até onde, a bola chegando na linha, o gol e o 1º quadro do GOOOOL sem o clarão branco.
// Roteiro (compassos da música):
//   c.0 N1 acende, o dedo hesita e vai pro Esperar (l.12)   c.1 o jogo segue, a barra enche (moedas)
//   c.2 N2 acende, Esperar de novo (l.12)                   c.3 a corrida até o N3
//   c.4 N3 acende, o dedo recua e bate no GOLPE (l.14) e o impacto curto
//   c.5 "MON!": a faixa VOO EM CHAMAS grande por cima      c.6 o voo em câmera lenta
//   c.7 a bola rolando, cruzando a linha em close, GOL (l.8) e GOOOOL na mesma câmera
//   c.8 tela final (logo, o Charizard pulando no gancho, site)   c.9 acorde final
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import peca from '../../scripts/musica/pecas/curta-pov-n3.mjs';

const [dir, saida] = process.argv.slice(2);
const FPS = 30;
const S = peca();
const B = Array.from({ length: 11 }, (_, b) => S.timeOfBar(b));
const row = (b) => (B[b + 1] - B[b]) / 16;
const T = (b, r = 0) => B[b] + r * row(b);
const FIM = Number(process.env.FIM ?? (B[9] + 1).toFixed(2));
const CAP = Number(process.env.CAPITAO ?? 149);
const TMP = `${process.env.HOME}/.cache/soccermon-tmp/curta-pov/montar`;
// PULA_QUADROS=1: reaproveita os quadros da última montagem (só refaz áudio e vídeo)
const PULA = !!process.env.PULA_QUADROS;
if (!PULA) rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const seg = (nome) => {
    const m = JSON.parse(readFileSync(`${dir}/${nome}/meta.json`, 'utf8'));
    return { nome, ...m, botao: JSON.parse(readFileSync(`${dir}/${nome}/botao.json`, 'utf8')) };
};
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - (1 - x) ** 3);
const s1 = seg('n1');
const s2 = seg('n2');
const s3 = seg('n3');
// acende no 1 do compasso; o dedo encosta na linha 12 (N1, N2) e na 14 (N3)
const L = [T(0), T(2), T(4)];
const P = [T(0, 12), T(2, 12), T(4, 14)];
const GOL = T(7, 8);
// âncoras do n3 (arquivo da gravação − 1 = índice do meta)
const [TINTA, VOO, IMPACTO, ROLA, LINHA, NA_REDE, GOOOL] = (process.env.QUADROS_N3 ?? '156,170,231,242,242,251,257')
    .split(',')
    .map((x) => Number(x) - 1);

/** Quadro da gravação pro tempo t (linear entre âncoras [quadro, segundo]; 1:1 fora delas). */
function mapa(anc, t) {
    if (t <= anc[0][1]) return anc[0][0] + (t - anc[0][1]) * FPS;
    for (let i = 1; i < anc.length; i++) {
        const [f0, t0] = anc[i - 1];
        const [f1, t1] = anc[i];
        if (t <= t1) return f0 + ((t - t0) / (t1 - t0)) * (f1 - f0);
    }
    const [f, t0] = anc.at(-1);
    return f + (t - t0) * FPS;
}
const lin = (t, t0, t1, f0, f1) => f0 + ((t - t0) / (t1 - t0)) * (f1 - f0);
function plano(t) {
    if (t < B[2]) return { s: s1, f: mapa([[s1.aceso, L[0]], [s1.tocou, P[0]]], t), i: t < B[1] ? 0 : -1 };
    if (t < B[3]) return { s: s2, f: mapa([[s2.aceso, L[1]], [s2.tocou, P[1]]], t), i: 1 };
    if (t < B[4]) return { s: s3, f: s3.aceso + (t - B[4]) * FPS, i: -1 };
    if (t < P[2]) return { s: s3, f: lin(t, B[4], P[2], s3.aceso, s3.tocou), i: 2 };
    if (t < B[5]) return { s: s3, f: lin(t, P[2], B[5], s3.tocou, TINTA), i: 2 };
    if (t < B[6]) return { s: s3, f: lin(t, B[5], B[6], TINTA, VOO), i: 2 };
    if (t < B[7]) return { s: s3, f: lin(t, B[6], B[7], VOO, IMPACTO), i: 2 };
    if (t < T(7, 4)) return { s: s3, f: lin(t, B[7], T(7, 4), IMPACTO + 1, ROLA), i: 2 };
    if (t < GOL) return { s: s3, f: lin(t, T(7, 4), GOL, LINHA, NA_REDE), i: 2 };
    return { s: s3, f: GOOOL + (t - GOL) * FPS, i: 2 };
}

// câmera: centro e largura do recorte (px do canvas 968x528) por quadro de cada trecho, suavizado dentro do bloco. O
// recorte tem a forma do painel (ASP = alto/largo)
const CW = 968;
const CH = 528;
const ASP = 1120 / 1020;
const bloco = (f) => (f < TINTA ? 0 : f < VOO ? 1 : f <= IMPACTO ? 2 : f < GOOOL ? 3 : 4);
function camera(s, n3) {
    let rede = null;
    const alvo = s.meta.map((q, f) => {
        const px = (p) => [((p.x - q.cam.x) / q.cam.w) * CW, ((p.y - q.cam.y) / q.cam.h) * CH];
        const cap = q.cap ? px(q.cap) : px(q.ball);
        const bola = px(q.ball);
        let c = [cap[0] * 0.75 + bola[0] * 0.25, cap[1] * 0.75 + bola[1] * 0.25];
        let lado = 360;
        const b = n3 ? bloco(f) : 0;
        if (b === 1) {
            c = cap;
            lado = 320;
        } else if (b === 2) {
            c = [(cap[0] + bola[0]) / 2, (cap[1] + bola[1]) / 2];
            lado = 400;
        } else if (b === 3) {
            // o golpe saindo e a bola entrando: do capitão até a bola (o raio cabe inteiro), sem passar da quadra
            c = [(cap[0] + bola[0]) / 2, (cap[1] + bola[1]) / 2];
            lado = Math.min(528, Math.max(380, Math.abs(cap[0] - bola[0]) * 1.2 + 140));
            if (f <= NA_REDE) rede = [c, lado];
        } else if (b === 4) {
            // o GOOOOL na mesma câmera do gol, abrindo um pouco
            // o gol em close: a bola na rede e o goleiro; o letreiro do jogo (no alto) fica fora
            c = [bola[0] - 120, bola[1]];
            lado = 360;
        }
        return [c[0], c[1] - 14, lado, b];
    });
    const R = n3 ? 3 : 6;
    return alvo.map((a0, f) => {
        let sx = 0;
        let sy = 0;
        let sl = 0;
        let n = 0;
        for (let k = -R; k <= R; k++) {
            const a = alvo[Math.min(alvo.length - 1, Math.max(0, f + k))];
            if (a[3] !== a0[3]) continue; // não suaviza por cima de um corte
            if (a0[3] === 3 && (f <= ROLA) !== (f + k <= ROLA)) continue;
            sx += a[0];
            sy += a[1];
            sl += a[2];
            n++;
        }
        const sw = sl / n;
        const sh = sw * ASP;
        const x = Math.min(CW - sw, Math.max(0, sx / n - sw / 2));
        // no GOOOOL o letreiro do jogo (no alto do canvas) fica fora: o da montagem é o que aparece
        const y0 = a0[3] === 4 ? 125 : 0;
        const y = Math.min(CH - sh, Math.max(y0, sy / n - sh / 2));
        return { sx: x, sy: y, sw, sh };
    });
}
const cams = new Map([s1, s2, s3].map((s) => [s, camera(s, s === s3)]));
const zoom = (c, z) => ({ sx: c.sx + (c.sw * (1 - z)) / 2, sy: c.sy + (c.sh * (1 - z)) / 2, sw: c.sw * z, sh: c.sh * z });

// a faixa de cada capitão: o nome da assinatura e a cor do tipo (src/i18n/pt/match.ts, src/ui/type-colors.ts)
const FAIXA = {
    6: { nome: 'VOO EM CHAMAS', tipo: 'ASSINATURA · FOGO', cor: '#EE8130', fundoRetrato: '#c85a1e' },
    25: { nome: 'RAIO EM CADEIA', tipo: 'ASSINATURA · ELÉTRICO', cor: '#F7D02C', corTipo: '#F7D02C', fundoRetrato: '#d9a400', tam: 76 },
    149: { nome: 'HIPER RAIO', tipo: 'ASSINATURA · NORMAL', cor: '#A8A77A', fundoRetrato: '#8a8960' },
}[CAP];
const decai = (t, t0, d) => (t < t0 ? 0 : Math.max(0, 1 - (t - t0) / d));
const BOTAO_Y = 1532;

// o Charizard da tela final: folha do jogo (public/assets/field/<id>.png), Idle parado e Hop em cada nota do gancho
const folha = JSON.parse(readFileSync(`public/assets/field/${CAP}.json`, 'utf8')).frames;
const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'))[CAP].anims;
const pes = JSON.parse(readFileSync('src/data/sprite-feet.json', 'utf8'))[CAP] ?? {};
function sprite(t) {
    const hops = [T(8, 0), T(8, 3), T(8, 6), T(9, 0)];
    const h = hops.findLast((x) => t >= x);
    const durHop = pmd.Hop.durations.reduce((a, b) => a + b, 0) / 60;
    let nome = 'Idle';
    let k = Math.floor((t / (pmd.Idle.durations[0] / 60)) % pmd.Idle.durations.length);
    if (h !== undefined && t - h < durHop) {
        nome = 'Hop';
        let u = (t - h) * 60;
        k = 0;
        while (k < pmd.Hop.durations.length - 1 && u >= pmd.Hop.durations[k]) u -= pmd.Hop.durations[k++];
    }
    const fr = folha[`${nome}/0/${k}`].frame;
    const pulo = h !== undefined && t - h < 0.32 ? Math.sin((Math.PI * (t - h)) / 0.32) * 70 : 0;
    return { rect: [fr.x, fr.y, fr.w, fr.h], pe: pes[nome] ?? 0.75, pulo };
}

function estado(t) {
    const e = { titulo: t < B[8] ? 1 : 0 };
    // a barra: acende no 1 do compasso; enche nas moedas (c.1: 4 semínimas; c.3: 8 colcheias); o N3 esvazia no MON
    const moedas = (b, rows) => rows.filter((r) => t >= T(b, r)).length / rows.length;
    e.gomos = t < L[0] ? 0 : t < L[1] ? 1 : t < L[2] ? 2 : t < B[5] ? 3 : 0;
    e.enche = t >= B[1] && t < B[2] ? 0.92 * moedas(1, [2, 6, 10, 14]) : t >= B[3] && t < B[4] ? 0.92 * moedas(3, [0, 2, 4, 6, 8, 10, 12, 14]) : 0;
    e.gomoBrilho = [0, 1, 2].map((k) => Math.max(0.9 * decai(t, L[k], 0.45), t >= B[5] && t < B[8] ? decai(t, B[5], 0.5) : 0));
    if (t >= B[8]) {
        // tela final
        const u = t - B[8];
        const pisca = [T(8, 0), T(8, 3), T(8, 6), T(9, 0)].map((x) => decai(t, x, 0.22));
        e.fim = {
            entra: ease(u / 0.35),
            logo: 1 + 0.07 * Math.max(...pisca),
            elastico: u < 0 ? 0 : 1 - Math.exp(-u / 0.09) * Math.cos(u * 26),
            sprite: sprite(t),
            site: ease((t - T(8, 8)) / 0.2),
            giro: u * 0.35,
        };
        e.gomos = 3;
        e.gomoBrilho = pisca;
        e.flashTela = 0.8 * decai(t, B[8], 0.2);
        return e;
    }
    const { s, f, i } = plano(t);
    const fq = Math.max(1, Math.min(s.meta.length, Math.round(f) + 1));
    let crop = cams.get(s)[fq - 1];
    // o toque: soco de zoom curto; a faixa: a câmera chegando perto do capitão; o gol: soco de novo
    // a corrida até o N3 e a hesitação no N3: a câmera vai chegando perto (a quadra em câmera lenta quase não mexe)
    if (t >= B[3] && t < B[4]) crop = zoom(crop, 1 - 0.1 * ((t - B[3]) / (B[4] - B[3])));
    if (t >= B[4] && t < P[2]) crop = zoom(crop, 1 - 0.18 * ease((t - B[4]) / (P[2] - B[4])));
    if (t >= P[2] && t < B[5]) crop = zoom(crop, 1 - 0.18 * Math.sin((Math.PI * (t - P[2])) / (B[5] - P[2])));
    if (t >= B[5] && t < B[6]) crop = zoom(crop, 1 - 0.16 * ease((t - B[5]) / (B[6] - B[5])));
    if (t >= GOL && t < B[8]) crop = zoom(crop, 1 - 0.12 * decai(t, GOL, 0.4));
    e.quadra = { src: `file://${dir}/${s.nome}/${String(fq).padStart(5, '0')}.png`, ...crop };
    // a faixa da assinatura, grande, por cima da quadra no "MON!"
    if (t >= B[5] && t < B[6]) {
        const u = t - B[5];
        const sai = t - (B[6] - 0.24);
        const back = (x) => (x >= 1 ? 1 : 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2);
        e.faixa = {
            dx: sai > 0 ? 1500 * ease(sai / 0.24) : -1500 * (1 - back(Math.min(1, u / 0.26))) + 14 * u,
            dxTexto: u < 0.4 ? -120 * (1 - ease((u - 0.06) / 0.3)) : 0,
            pop: 0.5 + 0.5 * back(Math.min(1, Math.max(0, (u - 0.08) / 0.25))),
            brilho: (u * 0.7) % 1.2,
            alfa: 1,
            retrato: `file://${process.cwd()}/public/assets/portraits/${CAP}-determined.png`,
            ...FAIXA,
            nota: 'PERFEITO!',
        };
        e.escurece = 0.3;
    }
    if (t >= GOL && t < B[8]) {
        const u = t - GOL;
        e.golTexto = { u, escala: u < 0.3 ? 0.4 + 0.6 * (1 - Math.exp(-u / 0.05) * Math.cos(u * 30)) : 1 + 0.03 * Math.sin(u * 12) };
        e.flash = 0.45 * decai(t, GOL, 0.18);
    }
    const r = s.botao;
    const k = (920 / (r.linha[0] * 3)) * 3; // px da tela por px css
    const x0 = 540 - (r.linha[0] * k) / 2;
    if (i >= 0) {
        // botão: entra no 1 do compasso (pop), some depois do toque
        const l = L[i];
        const p = P[i];
        const fimBotao = i < 2 ? p + 0.3 : B[5] + 0.12;
        if (t >= l && t < fimBotao) {
            const entra = ease((t - l) / 0.14);
            const sai = i < 2 ? 1 - ease((t - p - 0.12) / 0.18) : 1 - ease((t - B[5]) / 0.12);
            const nome = i < 2 ? 'esperar' : 'max';
            const aperta = t >= p ? Math.max(0, 1 - (t - p) / 0.16) : 0;
            e.botao = {
                src: `file://${dir}/${s.nome}/botao.png`,
                escala: (k / 3) * (0.85 + 0.15 * entra),
                y: BOTAO_Y + (1 - entra) * 30,
                alfa: entra * sai,
                rects: { max: r.max, esperar: r.esperar },
                aperta: { [nome]: i < 2 ? aperta : t >= p ? 0.6 : 0 },
                clarao: { [nome]: i < 2 ? 0.5 * aperta : 0.9 * decai(t, p, 0.4) },
            };
        }
    }
    // polegar: descansa embaixo; quando acende, sobe até o GOLPE MÁXIMO e treme (mais a cada nível); no toque vai pro
    // Esperar (N1, N2) ou recua e bate no GOLPE (N3)
    {
        const meio = (rr) => [x0 + (rr[0] + rr[2] / 2) * k, BOTAO_Y + (rr[1] + rr[3]) * k];
        const [mx, my] = meio(r.max);
        const [wx, wy] = meio(r.esperar);
        const repouso = [700, 1860];
        let x = repouso[0];
        let y = repouso[1] + Math.sin(t * 9) * 4;
        if (i >= 0) {
            const l = L[i];
            const p = P[i];
            const treme = [3, 6, 10][i];
            const sobe = ease((t - l) / 0.22);
            x = repouso[0] + (mx - repouso[0]) * sobe;
            y = repouso[1] + (my - 14 - repouso[1]) * sobe;
            if (t >= l) {
                x += Math.sin(t * 47) * treme * 0.6;
                y += Math.sin(t * 61 + 1) * treme;
            }
            if (i < 2) {
                const vai = ease((t - (p - 0.18)) / 0.15);
                x += (wx - mx) * vai;
                y += (wy - my) * vai;
                if (t >= p - 0.03) y -= 30 * Math.max(0, 1 - Math.abs(t - p - 0.03) / 0.09);
                const volta = ease((t - (p + 0.22)) / 0.3);
                x += (repouso[0] - wx) * volta;
                y += (repouso[1] - (wy - 14)) * volta;
            } else {
                if (t >= p - 0.26 && t < p) y += 90 * ease((t - (p - 0.26)) / 0.18);
                if (t >= p) y = my - 40;
                if (t >= B[5]) y = my - 40 + 600 * ease((t - B[5] - 0.2) / 0.4);
            }
        }
        if (y < 1920) e.dedo = { x, y };
    }
    // MON: clarão curto e a quadra treme; no gol, outra tremida
    const tr = Math.max(decai(t, P[2], 0.3) * 16, decai(t, B[5], 0.3) * 10, decai(t, GOL, 0.4) * 14);
    if (tr > 0) e.treme = [Math.sin(t * 90) * tr, Math.cos(t * 77) * tr];
    return e;
}

const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
await page.goto(`file://${new URL('.', import.meta.url).pathname}quadro.html?cap=${CAP}`);
// o recorte do retrato é o do jogo (src/game/portrait-cut.ts), empacotado pra página
const PC = `${TMP}/../portrait-cut.js`;
execFileSync('npx', ['esbuild', 'src/game/portrait-cut.ts', '--format=iife', '--global-name=PC', `--outfile=${PC}`, '--log-level=warning']);
await page.addScriptTag({ path: PC });
await page.evaluate(() => window.pronto);
const N = Math.round(FIM * FPS);
const so = process.env.QUADROS ? process.env.QUADROS.split(',').map(Number) : null;
for (let n = 0; n < N; n++) {
    if (PULA || (so && !so.includes(n))) continue;
    const url = await page.evaluate((e) => window.quadro(e), estado(n / FPS));
    writeFileSync(`${TMP}/${String(n).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
console.log(`${N} quadros (${FIM} s); compassos ${B.map((b) => b.toFixed(2)).join(' ')}`);
if (so) process.exit(0);

// áudio: a música a −14 LUFS (mede, ganho, limitador; 3 passadas), rabo com fade
const MUS = `${process.env.HOME}/.cache/soccermon-tmp/curta-pov/musica`;
execFileSync('node', ['scripts/musica/render.mjs', 'curta-pov-n3', '--so-wav', '--out', MUS], { stdio: 'inherit' });
const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...a]);
const lufs = (f) => {
    const o = spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr.toString();
    return Number(/I:\s+(-?[\d.]+) LUFS/.exec(o.slice(o.lastIndexOf('Summary')))?.[1]);
};
ff('-i', `${MUS}/curta-pov-n3.wav`, '-af', `atrim=0:${FIM},afade=t=out:st=${FIM - 0.45}:d=0.45`, '-ar', '48000', `${TMP}/a.wav`);
for (let k = 0; k < 3; k++) {
    const g = -14 - lufs(`${TMP}/a.wav`);
    ff('-i', `${TMP}/a.wav`, '-af', `volume=${g}dB,alimiter=limit=0.76:level=false:attack=1:release=80`, `${TMP}/b.wav`);
    execFileSync('mv', [`${TMP}/b.wav`, `${TMP}/a.wav`]);
}
console.log('áudio:', lufs(`${TMP}/a.wav`), 'LUFS');
const V = ['-framerate', String(FPS), '-i', `${TMP}/%05d.png`];
// alta (pra guardar) e a de ≤10 MB (2 passes, ~1,45 Mbps, pra extensão do Chrome)
ff(...V, '-i', `${TMP}/a.wav`, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-t', String(FIM), '-movflags', '+faststart', `${saida}.mp4`);
ff(...V, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '1450k', '-pix_fmt', 'yuv420p', '-pass', '1', '-passlogfile', `${TMP}/x`, '-an', '-f', 'mp4', '/dev/null');
ff(...V, '-i', `${TMP}/a.wav`, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '1450k', '-pix_fmt', 'yuv420p',
    '-pass', '2', '-passlogfile', `${TMP}/x`, '-c:a', 'aac', '-b:a', '192k', '-t', String(FIM), '-movflags', '+faststart', `${saida}-10mb.mp4`);
console.log('pronto:', `${saida}.mp4`, `${saida}-10mb.mp4`);
