// Visualizer do álbum "Soccermon (Original Soundtrack)": um vídeo 1920×1080 por faixa pra playlist do canal.
// Monta um projeto HyperFrames por faixa a partir do molde (este arquivo + cenas.mjs) e do .wav masterizado:
//   node trailer/visualizer/montar.mjs <nn> --wav <faixa.wav> --out <pasta>
//   scripts/pesado.sh npx hyperframes render <pasta>/<nn> -o <saida.mp4>
// O projeto sai fora do repo (o .wav é grande). O molde: o fundo de marca (azul-noite com raios), a capa à esquerda,
// o letreiro de LED do estádio passando o nome da faixa, o número e o nome, a vinheta da cena (pixel art que conta a
// faixa, em cenas.mjs), os 16 refletores que pulsam com a música (8 faixas de frequência, espelhadas) e a barra de
// progresso discreta. Nada de Pokémon em destaque nem marca de terceiros: só objetos e cenários do próprio jogo.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CENAS } from './cenas.mjs';

export const FAIXAS = {
    1: 'Acendam as luzes',
    2: 'Tema de abertura',
    3: 'Três cartas',
    4: 'Pé na estrada',
    5: 'Gotas na caverna',
    6: 'Barco e gaivota',
    7: 'Funk das moedinhas',
    8: 'O plano infalível',
    9: 'Na ponta do pé',
    10: 'Ladeira acima',
    11: 'Curto-circuito',
    12: 'Sete rivais',
    13: 'Primeiro tempo',
    14: 'A prancheta (intervalo)',
    15: 'Segundo tempo',
    16: 'Soc-cer-MON!',
    17: 'Sala dos troféus',
    18: 'A última partida',
    19: 'Quadra vazia',
    20: 'Só o balanço',
};
const ALBUM = 'Soccermon (Original Soundtrack)';
const FPS = 30;
const BANDAS = [60, 120, 250, 500, 1000, 2000, 4000, 8000];
const AQUI = new URL('./', import.meta.url).pathname;
const RAIZ = new URL('../../', import.meta.url).pathname;

/** Energia por quadro (30 por segundo) em 8 faixas de frequência, de 0 a 1 (cada faixa no próprio p98), suavizada. */
function espectro(wav) {
    const SR = 22050;
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', wav, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
        maxBuffer: 1 << 30,
    });
    const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const porQuadro = SR / FPS;
    const nq = Math.floor(x.length / porQuadro);
    return BANDAS.map((f0) => {
        const w = (2 * Math.PI * f0) / SR;
        const al = Math.sin(w) / (2 * 1.2);
        const [b0, b2, a0, a1, a2] = [al, -al, 1 + al, -2 * Math.cos(w), 1 - al];
        let [x1, x2, y1, y2] = [0, 0, 0, 0];
        const e = new Float32Array(nq);
        for (let q = 0; q < nq; q++) {
            let s = 0;
            for (let i = Math.round(q * porQuadro); i < Math.round((q + 1) * porQuadro); i++) {
                const y = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0;
                [x2, x1, y2, y1] = [x1, x[i], y1, y];
                s += y * y;
            }
            e[q] = Math.sqrt(s / porQuadro);
        }
        const p98 = [...e].sort((a, b) => a - b)[Math.floor(nq * 0.98)] || 1;
        let v = 0;
        return Array.from(e, (val) => {
            const alvo = Math.min(1, val / p98);
            v = alvo > v ? alvo : v * 0.82 + alvo * 0.18; // sobe na hora, desce macio
            return Math.round(v * 20); // 0 a 20 (pixels de luz de cada refletor)
        });
    });
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function montar(nn, wav, out) {
    const nome = FAIXAS[nn];
    const dur =
        Math.floor(
            Number(
                execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], {
                    encoding: 'utf8',
                }),
            ) * FPS,
        ) / FPS;
    const dir = join(out, String(nn).padStart(2, '0'));
    mkdirSync(join(dir, 'compositions'), { recursive: true });
    mkdirSync(join(dir, 'assets/fonts'), { recursive: true });
    copyFileSync(wav, join(dir, 'assets/faixa.wav'));
    for (const f of ['Galmuri11.woff2', 'Galmuri11-Bold.woff2'])
        copyFileSync(join(RAIZ, 'public/fonts', f), join(dir, 'assets/fonts', f));
    copyFileSync(join(RAIZ, 'trailer/arte/logo/final/logo-horizontal.svg'), join(dir, 'assets/logo.svg'));
    copyFileSync(join(AQUI, 'capa-provisoria.svg'), join(dir, 'assets/capa.svg'));
    for (const f of ['hyperframes.json', 'package.json']) copyFileSync(join(AQUI, f), join(dir, f));
    const cena = (CENAS[nn] ?? CENAS.padrao)({ dur, nn });
    const eq = espectro(wav);
    const letreiro = `FAIXA ${String(nn).padStart(2, '0')} · ${nome.toUpperCase()} · ${ALBUM.toUpperCase()} · `;
    writeFileSync(join(dir, 'index.html'), raiz({ dur }));
    writeFileSync(join(dir, 'compositions/visual.html'), visual({ nn, nome, dur, cena, eq, letreiro }));
    return { dir, dur };
}

const raiz = ({ dur }) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1920px; height: 1080px; overflow: hidden; background: #070a18; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1920" data-height="1080">
  <div id="visual" data-composition-id="visual" data-composition-src="compositions/visual.html" data-start="0"
    data-duration="${dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
  <audio id="faixa" class="clip" src="assets/faixa.wav" data-start="0" data-duration="${dur}" data-track-index="2" data-volume="1"></audio>
</div>
<script>
window.__timelines["main"] = gsap.timeline({ paused: true });
</script>
</body>
</html>
`;

function visual({ nn, nome, dur, cena, eq, letreiro }) {
    const raios = Array.from({ length: 9 }, (_, i) => {
        const a = -70 + i * 17.5;
        return `<polygon points="960,1240 ${960 + 2400 * Math.sin((a - 3) * (Math.PI / 180))},${1240 - 2400 * Math.cos((a - 3) * (Math.PI / 180))} ${960 + 2400 * Math.sin((a + 3) * (Math.PI / 180))},${1240 - 2400 * Math.cos((a + 3) * (Math.PI / 180))}" fill="#fff" opacity="${i % 2 ? 0.07 : 0.09}"/>`;
    }).join('');
    const refletores = Array.from(
        { length: 16 },
        (_, i) => `<div class="vz-ref"><div class="vz-luz" id="vz-luz${i}"></div><div class="vz-poste"></div></div>`,
    ).join('');
    return `<template>
<style>
@font-face { font-family: 'Galmuri11'; src: url('assets/fonts/Galmuri11.woff2'); }
@font-face { font-family: 'Galmuri11B'; src: url('assets/fonts/Galmuri11-Bold.woff2'); }
#root { position: absolute; inset: 0; overflow: hidden; font-family: 'Galmuri11', monospace; color: #f4f1e6;
  background: radial-gradient(ellipse at 50% 30%, #2a3a7a 0%, #10173a 55%, #070a18 100%); }
#vz-raios { position: absolute; inset: 0; }
#vz-capa { position: absolute; left: 150px; top: 200px; width: 600px; height: 600px; image-rendering: pixelated;
  box-shadow: 0 0 0 6px #0e1430, 12px 12px 0 6px #2a4ea0; }
#vz-letreiro { position: absolute; left: 860px; top: 200px; width: 910px; height: 64px; background: #0e1430;
  border: 4px solid #4b5a9a; overflow: hidden; }
#vz-letreiro-txt { position: absolute; left: 0; top: 10px; white-space: nowrap; font-family: 'Galmuri11B', monospace;
  font-size: 34px; color: #ffcb05; letter-spacing: 4px; text-shadow: 0 0 10px rgba(255, 203, 5, .55); }
#vz-letreiro-pontos { position: absolute; inset: 0; background-image: radial-gradient(circle, transparent 1.4px, #0e1430 2.2px);
  background-size: 5px 5px; opacity: .55; }
#vz-num { position: absolute; left: 860px; top: 300px; font-size: 30px; color: #a6aed6; letter-spacing: 6px; }
#vz-nome { position: absolute; left: 860px; top: 345px; width: 910px; font-family: 'Galmuri11B', monospace; font-size: 68px;
  line-height: 1.1; color: #ffcb05; text-shadow: 6px 6px 0 #2a4ea0; }
#vz-album { position: absolute; left: 860px; top: 440px; font-size: 26px; color: #a6aed6; }
#vz-cena { position: absolute; left: 860px; top: 500px; width: 910px; height: 300px; border: 4px solid #4b5a9a;
  background: #0e1430; overflow: hidden; }
#vz-cena svg { position: absolute; inset: 0; width: 100%; height: 100%; shape-rendering: crispEdges; }
#vz-refletores { position: absolute; left: 150px; top: 850px; width: 1620px; height: 100px; display: flex; gap: 12px;
  align-items: flex-end; }
.vz-ref { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.vz-luz { width: 100%; height: 0; background: repeating-linear-gradient(0deg, #fff3a0 0 6px, transparent 6px 10px); opacity: .9; }
.vz-poste { width: 8px; height: 10px; background: #4b5a9a; }
#vz-barra { position: absolute; left: 150px; top: 990px; width: 1620px; height: 6px; background: #1c2447; }
#vz-barra-fill { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: #ffcb05; transform-origin: 0 50%; transform: scaleX(0); }
#vz-dur { position: absolute; left: 1670px; top: 1005px; width: 100px; text-align: right; font-size: 22px; color: #a6aed6; }
#vz-logo { position: absolute; left: 150px; top: 1002px; height: 40px; }
${cena.css ?? ''}
</style>
<div id="root" data-composition-id="visual" data-width="1920" data-height="1080">
  <svg id="vz-raios" viewBox="0 0 1920 1080" data-layout-ignore>${raios}</svg>
  <img id="vz-capa" src="assets/capa.svg" alt="" />
  <div id="vz-letreiro" data-layout-allow-overflow><div id="vz-letreiro-txt">${esc(letreiro.repeat(Math.ceil(dur / 12) + 3))}</div><div id="vz-letreiro-pontos"></div></div>
  <div id="vz-num">FAIXA ${String(nn).padStart(2, '0')}</div>
  <div id="vz-nome">${esc(nome)}</div>
  <div id="vz-album">${ALBUM}</div>
  <div id="vz-cena" data-layout-allow-overflow>${cena.svg}</div>
  <div id="vz-refletores">${refletores}</div>
  <div id="vz-barra"><div id="vz-barra-fill"></div></div>
  <img id="vz-logo" src="assets/logo.svg" alt="" />
  <div id="vz-dur">${fmt(dur)}</div>
</div>
<script>
const EQ = ${JSON.stringify(eq)};
const DUR = ${dur};
const tl = gsap.timeline({ paused: true });
const luzes = Array.from({ length: 16 }, (_, i) => document.getElementById('vz-luz' + i));
const relogio = { t: 0 };
tl.to(relogio, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => {
  const q = Math.min(EQ[0].length - 1, Math.floor(relogio.t * ${FPS}));
  for (let i = 0; i < 16; i++) { const b = i < 8 ? 7 - i : i - 8; luzes[i].style.height = (EQ[b][q] * 5) + 'px'; }
} }, 0);
tl.fromTo('#vz-barra-fill', { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' }, 0);
const COPIAS = ${Math.ceil(dur / 12)};
const largura = document.getElementById('vz-letreiro-txt').scrollWidth / (COPIAS + 3);
tl.fromTo('#vz-letreiro-txt', { x: 0 }, { x: -largura * COPIAS, duration: DUR, ease: 'none' }, 0);
${cena.js}
window.__timelines["visual"] = tl;
</script>
</template>
`;
}

const main = import.meta.url === `file://${process.argv[1]}`;
if (main) {
    const a = process.argv.slice(2);
    const val = (f) => a[a.indexOf(f) + 1];
    const r = montar(Number(a[0]), val('--wav'), val('--out'));
    console.log(`${r.dir}: ${r.dur.toFixed(2)} s`);
}
