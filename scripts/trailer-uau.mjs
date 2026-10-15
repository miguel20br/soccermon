/**
 * Versão "uau" de um clipe do trailer: emenda a gravação normal com a gravação em câmera lenta do pico (pelos ticks
 * que o trailer-capture anota), dá zoom de impacto na bola durante a câmera lenta e põe flash branco + tremida no
 * instante do pico. Picos em trailer/picos.json (scripts/trailer-peaks.ts).
 *
 *   node scripts/trailer-uau.mjs --normal <pasta> --lento <pasta> --nome 2-golpe-charizard-fire-blast --out clipe.mp4
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const normalDir = arg('--normal');
const lentoDir = arg('--lento');
const nome = arg('--nome');
const out = arg('--out', `${nome}-uau.mp4`);
const ZOOM_MAX = Number(arg('--zoom', 1.2));
const pico = JSON.parse(readFileSync(arg('--picos', 'trailer/picos.json'), 'utf8')).find((c) => c.nome === nome);
if (!normalDir || !lentoDir || !pico) throw new Error('use --normal, --lento e --nome (um nome de trailer/picos.json)');

const load = (dir) => JSON.parse(readFileSync(`${dir}/quadros.json`, 'utf8'));
const normal = load(normalDir);
const lento = load(lentoDir);
const file = (dir, i) => `${dir}/${String(i + 1).padStart(5, '0')}.png`;

// sequência: normal até o pico, câmera lenta no pico, normal depois
const seq = [];
normal.meta.forEach((m, i) => {
    if (m.tick < pico.lentoDe) seq.push({ f: file(normalDir, i), ...m });
});
const s0 = seq.length;
lento.meta.forEach((m, i) => {
    if (m.tick >= pico.lentoDe && m.tick <= pico.lentoAte) seq.push({ f: file(lentoDir, i), ...m });
});
const s1 = seq.length;
normal.meta.forEach((m, i) => {
    if (m.tick > pico.lentoAte) seq.push({ f: file(normalDir, i), ...m });
});
const flash = seq.findIndex((m, i) => i >= s0 && m.tick >= pico.flash);
// mira do zoom: o meio do caminho da bola durante a câmera lenta (pega quem chuta e o gol)
const lentos = seq.slice(s0, s1);
const media = (k) => lentos.reduce((t, m) => t + m[k], 0) / Math.max(1, lentos.length);
const bx = Math.min(0.65, Math.max(0.35, media('bx')));
const by = Math.min(0.65, Math.max(0.35, media('by')));
// a câmera do jogo já dá zoom nos gols e golpes: aí o nosso não entra (zoom duplo mostrava a área fora da quadra)
const zoomJogo = media('zoom') || 1;
const ZOOM = zoomJogo > 1.05 ? 1 : ZOOM_MAX;
console.log(`${nome}: zoom do jogo ${zoomJogo.toFixed(2)} → nosso ${ZOOM}`);
console.log(`${nome}: ${s0} normais + ${s1 - s0} lentos + ${seq.length - s1} normais; flash no quadro ${flash}`);

// lista de quadros fica junto da gravação lenta (fora da pasta de saída, que pode ser a galeria)
const list = `${lentoDir}/sequencia.txt`;
writeFileSync(list, seq.map((m) => `file '${m.f}'\nduration ${(1 / normal.fps).toFixed(6)}`).join('\n'));

// zoom: sobe em 10 quadros no começo da câmera lenta, desce em 12 no fim (suave)
const R = 10;
const ease = (a, b) => `if(lt(on,${a}),0,if(lt(on,${b}),(1-cos(PI*(on-${a})/${b - a}))/2,1))`;
const z = `1+${(ZOOM - 1).toFixed(3)}*${ease(s0, s0 + R)}*(1-${ease(s1 - 2, s1 + 12)})`;
const shake = flash >= 0 ? `if(between(on,${flash},${flash + 9}),7*sin(on*2.9)*(${flash + 9}-on)/9,0)` : '0';
const x = `max(0,min(iw-iw/zoom,${bx}*iw-iw/zoom/2+${shake}))`;
const y = `max(0,min(ih-ih/zoom,${by}*ih-ih/zoom/2+${shake.replace('sin', 'cos')}))`;
const flashes =
    flash >= 0
        ? [0.85, 0.6, 0.4, 0.25, 0.12]
              .map((a, k) => `drawbox=x=0:y=0:w=iw:h=ih:color=white@${a}:t=fill:enable='eq(n,${flash + k})'`)
              .join(',')
        : 'null';
const vf = [
    // normaliza (canvas nativo 2x em pixel nítido; modo página já vem grande) e prepara folga pro zoom
    "scale='if(lt(iw,1200),iw*2,1936)':'if(lt(iw,1200),ih*2,1056)':flags=neighbor",
    'scale=1936:1056:flags=neighbor',
    `zoompan=z='${z}':x='${x}':y='${y}':d=1:s=1936x1056:fps=${normal.fps}`,
    flashes,
].join(',');
execFileSync(
    'ffmpeg',
    [
        '-v',
        'error',
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        list,
        '-vf',
        vf,
        '-r',
        String(normal.fps),
        '-c:v',
        'libx264',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        out,
    ],
    {
        stdio: 'inherit',
    },
);
console.log(`→ ${out}`);
