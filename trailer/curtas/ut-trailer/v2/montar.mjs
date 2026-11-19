// Monta o trailer v2 do Time Ultimate (roteiro-v2.md) em 9:16, 1080x1920, 30 fps, -14 LUFS, a partir da mídia dos
// capturar*.mjs, do fecho.mjs, das cartelas.mjs, dos sons.mjs e da música "Do zero ao time" (scripts/musica/pecas/
// trailer-ut.mjs, 136 BPM: batida = 13,235 quadros). Cada plano começa e termina numa batida (QUADRO(k)).
//   node trailer/curtas/ut-trailer/v2/montar.mjs <pasta-da-midia-v2> <musica.wav> <saida.mp4>
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [M, MUS, OUT] = process.argv.slice(2);
if (!OUT) throw new Error('uso: montar.mjs <midia-v2> <musica.wav> <saida.mp4>');
const R = new URL('../../../../', import.meta.url).pathname;
const PESADO = '/home/bartolomeu/Projects/soccermon/scripts/pesado.sh';
const ff = (args) => execFileSync(PESADO, ['ffmpeg', '-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const QUADRO = (k) => Math.round((k * 60 * 30) / 136);
const V = 'fps=30,setsar=1,format=yuv420p';
/** Empurra devagar (z de 1 até `ate` em `n` quadros), centrado: nada fica parado. */
const empurra = (ate, n) =>
    `scale=w='trunc(1080*(1+${ate - 1}*n/${n})/2)*2':h='trunc(1920*(1+${ate - 1}*n/${n})/2)*2':eval=frame:flags=lanczos,crop=1080:1920:'(iw-1080)/2':'(ih-1920)/2'`;

// [pasta, padrão, 1º quadro, quantos, filtro] na ordem do vídeo; o comentário é a batida em que o plano começa
const P = [
    // 1 · pacote (0): rasgo, o leque com o Dratini girando em câmera lenta, perto da carta na batida 4
    ['pacote', '%04d.png', 2, 31, ''],
    ['pacote', '%04d.png', 34, 22, ''],
    [
        'pacote',
        '%04d.png',
        90,
        26,
        "scale=w='trunc(1080*(1.95+0.15*n/25)/2)*2':h='trunc(1920*(1.95+0.15*n/25)/2)*2':eval=frame:flags=lanczos,crop=1080:1920:x='541*(1.95+0.15*n/25)-540':y='873*(1.95+0.15*n/25)-960'",
    ],
    // 2 · Clube (6): de perto, o toque no Dratini acende ele e o Dragonair; (9) a tela com "Química dela"
    ['clube5', '%04d.png', 6, 40, `crop=1100:1955:150:0,scale=1080:1920:flags=lanczos,${empurra(1.06, 39)}`],
    ['clube5', '%04d.png', 45, 40, 'inset'],
    // 3 · partida (12): o Slam, o drible, a defesa e o GOL na batida 20; (22) o pós-jogo, VITÓRIA 4 x 1
    ['partida-n', '%05d.png', 33, 132, ''],
    // (v3: 2 batidas, o tempo foi pras cartas do 1º pacote)
    ['fluxo', '%04d.png', 20, 26, empurra(1.04, 25)],
    // 4 · Metas (26): o Pegar no marco 2 e o "+1 em Meus pacotes"
    ['fluxo', '%04d.png', 100, 80, `trim=end_frame=75,tpad=stop_mode=clone:stop=5,crop=864:1536:108:300,scale=1080:1920:flags=lanczos,${empurra(1.05, 79)}`],
    // 5 · Abrir todos (32): o toque, o 1º pacote rasgado, o 2º abrindo sozinho; (38) a placa OURO; (40) o walkout do
    // Dragonite de uma vez: entra, chuta, a carta bate na batida 48 e fica até a 89 assentar
    ['fluxo', '%04d.png', 180, 13, ''],
    ['fluxo', '%04d.png', 205, 20, ''],
    // as cartas do 1º pacote 1,5 s (o leque já assentado, aproximando devagar)
    ['fluxo', '%04d.png', 255, 46, `trim=end_frame=34,tpad=stop_mode=clone:stop=12,${empurra(1.12, 45)}`],
    ['fluxo', '%04d.png', 290, 27, ''],
    ['fluxo', '%04d.png', 355, 26, ''],
    // (o Continuar do walkout aparece nos últimos 6 quadros: fica o quadro de antes)
    ['fluxo', '%04d.png', 471, 186, 'trim=end_frame=180,tpad=stop_mode=clone:stop=6'],
    // (54) o 2º Dratini, Repetida (o respiro)
    ['fluxo', '%04d.png', 705, 26, `crop=540:960:607:292,scale=1080:1920:flags=lanczos,${empurra(1.06, 25)}`],
    // 6 · Início (56): o time andando na quadra e o toque no Dratini
    // (v3: a 6x, só o piso, seguindo o Dratini e o Dragonite; a manchete fica no fundo de marca, acima)
    ['inicio6', '%04d.png', 14, 106, 'inicio'],
    // 7 · fecho (64): logo, TIME ULTIMATE · 27/11, soccermon.com, o Dratini e o Dragonite
    ['fecho', '%04d.png', 0, 126, ''],
];
const total = P.reduce((s, p) => s + p[3], 0);
// manchetes: [arquivo, do quadro, até o quadro] (uma por vez, com respiro entre elas)
const LEG = [
    ['leg-pacote.png', 3, 45],
    ['leg-quimica.png', QUADRO(9) + 4, QUADRO(12) - 1],
    ['leg-metas.png', QUADRO(24) + 8, QUADRO(29)],
    ['leg-time2.png', QUADRO(56) + 9, QUADRO(63)],
];
const s = (q) => (q / 30).toFixed(3);
// efeitos: [arquivo, segundo, volume]
const SONS = join(M, 'sons');
const CRY = join(R, 'public/assets/cries/latest/147.ogg');
const FX = [
    [join(SONS, 'rasgo.wav'), 0.03, 0.5],
    [join(SONS, 'abrir-pacote.wav'), 0.27, 0.35],
    [join(SONS, 'carta-vira.wav'), 0.95, 0.35],
    [join(SONS, 'carta-1.wav'), 1.0, 0.3],
    [join(SONS, 'carta-vira.wav'), 1.3, 0.35],
    [join(SONS, 'carta-2.wav'), 1.6, 0.3],
    [CRY, 1.6, 0.35],
    [join(SONS, 'toque.wav'), s(QUADRO(6) + 6), 0.35],
    [join(R, 'public/assets/sfx/torcida-gol-1.mp3'), s(QUADRO(20)), 0.6],
    [join(SONS, 'confirmar.wav'), s(QUADRO(24) + 15), 0.35],
    [join(SONS, 'confirmar.wav'), s(QUADRO(30) + 5), 0.35],
    [join(SONS, 'rasgo.wav'), s(QUADRO(31) + 1), 0.5],
    [join(SONS, 'abrir-pacote.wav'), s(QUADRO(31) + 9), 0.35],
    [join(SONS, 'carta-vira.wav'), s(QUADRO(32.5)), 0.3],
    [join(SONS, 'carta-1.wav'), s(QUADRO(32.5) + 1), 0.3],
    [join(SONS, 'carta-2.wav'), s(QUADRO(32.5) + 3), 0.3],
    [join(SONS, 'carta-3.wav'), s(QUADRO(32.5) + 5), 0.3],
    [join(SONS, 'rasgo.wav'), s(QUADRO(36)), 0.4],
    [join(SONS, 'abrir-pacote.wav'), s(QUADRO(36) + 6), 0.35],
    [join(SONS, 'toque.wav'), s(QUADRO(56) + 41), 0.35],
    [CRY, s(QUADRO(56) + 41), 0.35],
];

// 1) o som do walkout inteiro (cada som na hora do relógio da cena; o mesmo jeito do scripts/walkout-capture.mjs)
const wsons = JSON.parse(readFileSync(join(M, 'walkout-sons/sons.json'), 'utf8'));
const win = [];
wsons.forEach((x, j) => {
    let file;
    let vol = 1;
    if (x.file) [file, vol] = [join(M, 'walkout-sons', x.file), 0.45];
    else if (x.s.k === 'max') [file, vol] = [join(R, 'public/sfx', `max-${x.s.name}.mp3`), 0.6];
    else if (x.s.k === 'crowd')
        [file, vol] = [join(R, 'public/assets/sfx', `torcida-${x.s.call}-${1 + (j % 2)}.mp3`), 0.9 * x.s.gain];
    else if (x.s.k === 'cry') [file, vol] = [join(R, 'public/assets/cries/latest/149.ogg'), 0.7 * x.s.gain];
    if (file) win.push({ file, t: x.t, vol });
});
const WALK = `${OUT}.walkout.wav`;
ff([
    ...win.flatMap((w) => ['-i', w.file]),
    '-filter_complex',
    `${win.map((w, j) => `[${j}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${w.vol},adelay=${Math.round(w.t)}:all=1[w${j}]`).join(';')};${win.map((_, j) => `[w${j}]`).join('')}amix=inputs=${win.length}:normalize=0:duration=longest,atrim=0:12[o]`,
    '-map',
    '[o]',
    WALK,
]);

// 2) vídeo e áudio
const args = [];
P.forEach(([dir, pat, from]) => args.push('-framerate', '30', '-start_number', String(from), '-i', join(M, dir, pat)));
const iFundo = P.length;
// imagem em loop com -t: sem ele o ffmpeg termina o vídeo e fica esperando a entrada sem fim
const durIn = String(total / 30 + 1);
args.push('-loop', '1', '-framerate', '30', '-t', durIn, '-i', join(M, 'fundo.png'));
const iLeg = iFundo + 1;
for (const [f] of LEG) args.push('-loop', '1', '-framerate', '30', '-t', durIn, '-i', join(M, f));
const iMus = iLeg + LEG.length;
args.push('-i', MUS, '-i', WALK);
const iFx = iMus + 2;
for (const [f] of FX) args.push('-i', f);

const fc = [];
let at = 0;
P.forEach(([, , , n, filt], i) => {
    const base = `[${i}:v]trim=end_frame=${n},setpts=PTS-STARTPTS`;
    if (filt === 'inicio') {
        fc.push(`${base},crop=1080:938:0:562[ins${i}]`);
        fc.push(`[${iFundo}:v]trim=end_frame=${n},setpts=PTS-STARTPTS[fb${i}]`);
        fc.push(`[fb${i}][ins${i}]overlay=0:640,${V}[p${i}]`);
    } else if (filt === 'inset') {
        fc.push(
            `${base},scale=w='trunc(994*(1+0.05*n/${n - 1})/2)*2':h='trunc(1767*(1+0.05*n/${n - 1})/2)*2':eval=frame:flags=lanczos[ins${i}]`,
        );
        fc.push(`[${iFundo}:v]trim=end_frame=${n},setpts=PTS-STARTPTS[fb${i}]`);
        fc.push(`[fb${i}][ins${i}]overlay=x='(W-w)/2':y=300,${V}[p${i}]`);
    } else fc.push(`${base}${filt ? `,${filt}` : ''},${V}[p${i}]`);
    at += n;
});
fc.push(`${P.map((_, i) => `[p${i}]`).join('')}concat=n=${P.length}:v=1:a=0[v0]`);
LEG.forEach(([, a, b], j) => fc.push(`[v${j}][${iLeg + j}:v]overlay=enable='between(n,${a},${b})'[v${j + 1}]`));
fc.push(`[v${LEG.length}]trim=end_frame=${total},format=yuv420p[v]`);
// a música inteira (cala sozinha na placa OURO e no walkout) e os dois trechos do som do walkout nos quadros deles
const dur = (total / 30).toFixed(3);
fc.push(`[${iMus}:a]atrim=0:${dur},afade=t=out:st=${(total / 30 - 0.6).toFixed(3)}:d=0.6,aresample=48000[mus]`);
const ouro = P.slice(0, 12).reduce((x, p) => x + p[3], 0);
const rev = ouro + P[12][3];
fc.push(`[${iMus + 1}:a]asplit=2[wa][wb]`);
fc.push(`[wa]atrim=0.800:1.667,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=0.84:d=0.03,adelay=${Math.round((ouro / 30) * 1000)}:all=1[w1]`);
fc.push(`[wb]atrim=4.670:10.833,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=5.9:d=0.26,adelay=${Math.round((rev / 30) * 1000)}:all=1[w2]`);
FX.forEach(([, t, vol], j) =>
    fc.push(`[${iFx + j}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},adelay=${Math.round(t * 1000)}:all=1[fx${j}]`),
);
fc.push(
    `[mus][w1][w2]${FX.map((_, j) => `[fx${j}]`).join('')}amix=inputs=${3 + FX.length}:normalize=0:duration=first,atrim=0:${dur}[au]`,
);
const TMP = `${OUT}.tmp.mp4`;
ff([
    ...args,
    '-filter_complex',
    fc.join(';'),
    '-map',
    '[v]',
    '-map',
    '[au]',
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'medium',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    '-c:a',
    'pcm_s16le',
    '-t',
    dur,
    TMP.replace(/\.mp4$/, '.mkv'),
]);
// 3) volume em duas passadas: mede e aplica o ganho fixo até -14 LUFS (o loudnorm de uma passada achata o crescendo)
const MKV = TMP.replace(/\.mp4$/, '.mkv');
const med = spawnSync('ffmpeg', ['-hide_banner', '-i', MKV, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {
    encoding: 'utf8',
    // o ebur128 escreve uma linha por quadro de áudio no stderr: passa do 1 MB padrão
    maxBuffer: 256 * 1024 * 1024,
}).stderr;
const I = Number(/Integrated loudness:\s+I:\s+(-?[\d.]+)/.exec(med)?.[1] ?? '-14');
const g = (-14 - I).toFixed(2);
ff(['-i', MKV, '-c:v', 'copy', '-af', `volume=${g}dB,alimiter=limit=0.84:level=false,aresample=48000`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT]);
rmSync(MKV, { force: true });
rmSync(WALK, { force: true });
console.log(`pronto: ${OUT} (${total} quadros, ${dur} s; volume ${I} LUFS + ${g} dB)`);
