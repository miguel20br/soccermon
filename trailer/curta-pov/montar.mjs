// Monta o curta POV: os 3 momentos gravados (gravar.mjs) no tempo da música (curta-pov-n3.mjs), um quadro por vez no
// quadro.html (headless), e junta com a música a −14 LUFS.
//   node trailer/curta-pov/montar.mjs <pasta da gravação> <saída sem extensão> <quadro da faixa do N3>
// A pasta tem n1/, n2/, n3/ (quadros + meta.json + botao.png/json). "Quadro da faixa do N3" é o quadro da gravação em
// que a faixa do especial entra (o hitstop): olhe a folha de contato do n3.
// Roteiro (compassos da música):
//   c.0 N1 acende, o dedo hesita e vai pro Esperar (l.12)   c.1 a corrida até o N2 (a barra enche, moedas)
//   c.2 N2 acende, Esperar de novo (l.12)                   c.3 a corrida até o N3
//   c.4 N3 acende, o dedo recua e bate no GOLPE (l.12)      c.5 "MON!": a faixa do especial, o chute e o GOL (l.12)
//   c.6 a festa                                             c.7–8 tela final (logo, o Charizard pulando no gancho, site)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import peca from '../../scripts/musica/pecas/curta-pov-n3.mjs';

const [dir, saida, smArg] = process.argv.slice(2);
const FPS = 30;
const S = peca();
const B = Array.from({ length: 10 }, (_, b) => S.timeOfBar(b));
const row = (b) => (B[b + 1] - B[b]) / 16;
const T = (b, r = 0) => B[b] + r * row(b);
const FIM = Number(process.env.FIM ?? (B[9] + 0.6).toFixed(2));
const CAP = Number(process.env.CAPITAO ?? 6);
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
const sm = Number(smArg);
// acende no 1 do compasso; o dedo encosta na linha 12
const L = [T(0), T(2), T(4)];
const P = [T(0, 12), T(2, 12), T(4, 12)];
const GOL = T(5, 12);

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
// o trecho de cada compasso: N1 (e o jogo seguindo depois do Esperar), N2, a corrida até o N3, N3. No N3: a faixa no
// "MON!", a bola de fogo até o goleiro (CORTE_DE, o impacto) e corte seco pra bola cruzando a linha (CORTE_PARA),
// o gol na l.12 (as palmas), o GOOOOL do jogo um pouco mais lento e congela (CONGELA) até a tela final.
const CORTE_DE = Number(process.env.CORTE_DE ?? 164);
const CORTE_PARA = Number(process.env.CORTE_PARA ?? 184);
const CONGELA = Number(process.env.CONGELA ?? 212);
const T_CORTE = T(5, 8);
const T_CONGELA = GOL + (CONGELA - s3.gol) / FPS / 0.8;
function plano(t) {
    if (t < B[2]) return { s: s1, f: mapa([[s1.aceso, L[0]], [s1.tocou, P[0]]], t), i: t < B[1] ? 0 : -1 };
    if (t < B[3]) return { s: s2, f: mapa([[s2.aceso, L[1]], [s2.tocou, P[1]]], t), i: 1 };
    if (t < B[4]) return { s: s3, f: s3.aceso + (t - B[4]) * FPS, i: -1 };
    if (t < T_CORTE) return { s: s3, f: mapa([[s3.aceso, L[2]], [s3.tocou, P[2]], [sm, B[5]], [CORTE_DE, T_CORTE]], t), i: 2 };
    if (t < GOL) return { s: s3, f: CORTE_PARA + ((t - T_CORTE) / (GOL - T_CORTE)) * (s3.gol - CORTE_PARA), i: 2 };
    if (t < T_CONGELA) return { s: s3, f: s3.gol + (t - GOL) * FPS * 0.8, i: 2 };
    // congelado no GOOOOL, a câmera chegando perto do letreiro
    const u = ease((t - T_CONGELA) / (B[7] - T_CONGELA));
    const sw = 470 - 110 * u;
    const sh = sw * ASP;
    return { s: s3, f: CONGELA, i: 2, crop: { sx: 484 - sw / 2, sy: Math.max(0, 250 - 50 * u - sh / 2), sw, sh } };
}

// câmera: centro e largura do recorte (px do canvas 968x528) por quadro de cada trecho, suavizado. O recorte tem a
// forma do painel (ASP = alto/largo); se passar do alto da quadra, sobra faixa escura (a faixa do especial)
const CW = 968;
const CH = 528;
const ASP = 1120 / 1020;
function camera(s, n3) {
    const alvo = s.meta.map((q, f) => {
        const px = (p) => [((p.x - q.cam.x) / q.cam.w) * CW, ((p.y - q.cam.y) / q.cam.h) * CH];
        const cap = q.cap ? px(q.cap) : px(q.ball);
        const bola = px(q.ball);
        let c = [cap[0] * 0.75 + bola[0] * 0.25, cap[1] * 0.75 + bola[1] * 0.25];
        let lado = 360;
        if (n3 && f >= sm && f < sm + 18) {
            // a faixa do especial atravessa a quadra: do retrato ao PERFEITO! cabe em ~560 px
            lado = 590;
            c = [492, 270];
        } else if (n3 && f >= sm + 16 && f <= s.gol) {
            c = f >= CORTE_PARA ? bola : [(cap[0] + bola[0]) / 2, (cap[1] + bola[1]) / 2];
            lado = 420;
        } else if (n3 && f > s.gol) {
            // o GOOOOL do jogo fica no alto, no meio
            lado = 470;
            c = [484, 250];
        }
        return [c[0], c[1] - 14, lado];
    });
    const R = n3 ? 3 : 6;
    return alvo.map((_, f) => {
        let sx = 0;
        let sy = 0;
        let sl = 0;
        let n = 0;
        for (let k = -R; k <= R; k++) {
            // não suaviza por cima do corte seco (os quadros pulados não entram)
            const j = Math.min(alvo.length - 1, Math.max(0, f + k));
            if (n3 && (f < CORTE_PARA) !== (j < CORTE_PARA) && j > CORTE_DE) continue;
            // nem por cima da entrada da faixa (o clarão do hitstop esconde o salto do recorte)
            if (n3 && (f < sm) !== (j < sm)) continue;
            const a = alvo[j];
            sx += a[0];
            sy += a[1];
            sl += a[2];
            n++;
        }
        const sw = sl / n;
        const sh = sw * ASP;
        const x = sw >= CW ? sx / n - sw / 2 : Math.min(CW - sw, Math.max(0, sx / n - sw / 2));
        const y = sh >= CH ? CH / 2 - sh / 2 : Math.min(CH - sh, Math.max(0, sy / n - sh / 2));
        return { sx: x, sy: y, sw, sh };
    });
}
const cams = new Map([s1, s2, s3].map((s) => [s, camera(s, s === s3)]));

const decai = (t, t0, d) => (t < t0 ? 0 : Math.max(0, 1 - (t - t0) / d));
const BOTAO_Y = 1532;

// o Charizard da tela final: folha do jogo (public/assets/field/<id>.png), Idle parado e Hop em cada nota do gancho
const folha = JSON.parse(readFileSync(`public/assets/field/${CAP}.json`, 'utf8')).frames;
const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'))[CAP].anims;
const pes = JSON.parse(readFileSync('src/data/sprite-feet.json', 'utf8'))[CAP] ?? {};
function sprite(t) {
    const hops = [T(7, 0), T(7, 3), T(7, 6), T(8, 0)];
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
    return { rect: [fr.x, fr.y, fr.w, fr.h], pe: pes[nome] ?? 0.75 };
}

function estado(t) {
    const e = { titulo: t < B[7] ? 1 : 0 };
    // a barra: acende no 1 do compasso; enche nas moedas (c.1: 4 semínimas; c.3: 8 colcheias); o N3 esvazia no MON
    const moedas = (b, rows) => rows.filter((r) => t >= T(b, r)).length / rows.length;
    e.gomos = t < L[0] ? 0 : t < L[1] ? 1 : t < L[2] ? 2 : t < B[5] ? 3 : 0;
    e.enche = t >= B[1] && t < B[2] ? 0.92 * moedas(1, [2, 6, 10, 14]) : t >= B[3] && t < B[4] ? 0.92 * moedas(3, [0, 2, 4, 6, 8, 10, 12, 14]) : 0;
    e.gomoBrilho = [0, 1, 2].map((k) => Math.max(0.9 * decai(t, L[k], 0.45), t >= B[5] && t < B[7] ? decai(t, B[5], 0.5) : 0));
    if (t >= B[7]) {
        // tela final
        const u = t - B[7];
        const pisca = [T(7, 0), T(7, 3), T(7, 6)].map((x) => decai(t, x, 0.22));
        e.fim = {
            entra: ease(u / 0.35),
            logo: 1 + 0.07 * Math.max(...pisca),
            elastico: u < 0 ? 0 : 1 - Math.exp(-u / 0.09) * Math.cos(u * 26),
            sprite: sprite(t),
            site: ease((t - T(7, 8)) / 0.3),
        };
        e.gomos = 3;
        e.gomoBrilho = pisca;
        e.flashTela = 0.8 * decai(t, B[7], 0.2);
        return e;
    }
    const { s, f, i, crop } = plano(t);
    const fq = Math.max(1, Math.min(s.meta.length, Math.round(f) + 1));
    e.quadra = { src: `file://${dir}/${s.nome}/${String(fq).padStart(5, '0')}.png`, ...(crop ?? cams.get(s)[fq - 1]) };
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
    e.flashTela = 0.3 * decai(t, B[5], 0.16);
    const tr = Math.max(decai(t, B[5], 0.35) * 14, decai(t, GOL, 0.35) * 10);
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
await page.evaluate(() => window.pronto);
const N = Math.round(FIM * FPS);
const so = process.env.QUADROS ? process.env.QUADROS.split(',').map(Number) : null;
for (let n = 0; n < N; n++) {
    if (PULA || (so && !so.includes(n))) continue;
    const url = await page.evaluate((e) => window.quadro(e), estado(n / FPS));
    writeFileSync(`${TMP}/${String(n).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
console.log(`${N} quadros (${FIM} s); faixa do N3 no quadro ${sm}; compassos ${B.map((b) => b.toFixed(2)).join(' ')}`);
if (so) process.exit(0);

// áudio: a música a −14 LUFS (mede, ganho, limitador; 3 passadas), rabo com fade
const MUS = `${process.env.HOME}/.cache/soccermon-tmp/curta-pov/musica`;
execFileSync('node', ['scripts/musica/render.mjs', 'curta-pov-n3', '--so-wav', '--out', MUS], { stdio: 'inherit' });
const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...a]);
const lufs = (f) => {
    const o = spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr.toString();
    return Number(/I:\s+(-?[\d.]+) LUFS/.exec(o.slice(o.lastIndexOf('Summary')))?.[1]);
};
ff('-i', `${MUS}/curta-pov-n3.wav`, '-af', `atrim=0:${FIM},afade=t=out:st=${FIM - 0.6}:d=0.6`, '-ar', '48000', `${TMP}/a.wav`);
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
