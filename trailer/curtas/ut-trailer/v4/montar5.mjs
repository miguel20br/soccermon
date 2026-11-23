// Monta o trailer v5 do Time Ultimate: a v4 (montar4.mjs) com as cartelas legíveis. O Miguel achou a v4 "frenético
// demais": cada cartela de feature fica 4 batidas (1,6 s, um compasso), ABRA PACOTES junta o rasgo e o Dratini pousando,
// METAS E PASSE juntam a trilha e o passe, o Evento vira EVENTO DE NATAL e as edições ficam 0,4 / 0,4 / 0,8 s. Walkout e
// fecho iguais. Música: scripts/musica/pecas/trailer-ut-v5.mjs (a mesma peça a 150 BPM, 23 compassos). 36,4 s.
//   node trailer/curtas/ut-trailer/v4/montar5.mjs <midia-v2> <midia-v4> <musica.wav> <saida.mp4>
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [M2, M4, MUS, OUT] = process.argv.slice(2);
if (!OUT) throw new Error('uso: montar5.mjs <midia-v2> <midia-v4> <musica.wav> <saida.mp4>');
const R = new URL('../../../../', import.meta.url).pathname;
const PESADO = '/home/bartolomeu/Projects/soccermon/scripts/pesado.sh';
const ff = (args) => execFileSync(PESADO, ['ffmpeg', '-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const TMP = `${OUT}.planos`;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// quadros: listas de arquivos, um por quadro do vídeo
const q4 = (dir, f) => join(dir, `${String(f).padStart(4, '0')}.png`);
const seq = (dir, de, n, pat = q4) => Array.from({ length: n }, (_, i) => pat(dir, de + i));
const segura = (arq, n) => Array(n).fill(arq);
const v2 = (d) => join(M2, d);
const v4 = (d) => join(M4, d);
const partida = (f) => join(M2, 'partida-n', `${String(f).padStart(5, '0')}.png`);

// [plano, quadros, composição, manchetes]; composição = filtro de [q] (os quadros) e [fb] (o fundo de marca) até [c]
// manchetes: [arquivo, do segundo, até o segundo, y do centro, slam?] (segundos dentro do plano)
const L = (f, a, b, y = 330, slam = true) => [join(M4, 'leg', `${f}.png`), a, b, y, slam];
const sobre = (filt, y) => `[q]${filt}[i];[fb][i]overlay=x='(W-w)/2':y=${y}[c]`;
const cheio = (filt = '') => `[q]${filt ? `${filt},` : ''}null[c];[fb]nullsink`;
const zoomFixo = (z, cx = 540, cy = 960) => {
    const w = Math.round(1080 * z / 2) * 2;
    const h = Math.round(1920 * z / 2) * 2;
    return `scale=${w}:${h}:flags=lanczos,crop=1080:1920:${Math.round(cx * z - 540)}:${Math.round(cy * z - 960)}`;
};
// a partida (3,2 s): o Slam em velocidade normal, o drible a ~1,4x e o GOL (o clarão do quadro 139) em 14,0 s (compasso
// 8, linha 12), com a rede lenta (a câmera lenta de verdade da gravação) até o corte
const P8 = [
    ...seq(null, 27, 12, (_, f) => partida(f)),
    ...Array.from({ length: 72 }, (_, i) => partida(39 + Math.round((i * (137 - 39)) / 71))),
    ...seq(null, 139, 12, (_, f) => partida(f)),
];
const WK = [
    [334, 58],
    [396, 14],
    [428, 18],
    [496, 102],
    [598, 48],
];
const DIV = (esq, dir, liga) => ({ esq, dir, liga });
// o 2º pacote do Abrir todos rasgando sozinho (quadros do fluxo, antes do walkout montar no 332)
const PAC2 = Number(process.env.PAC2 ?? 298);
const P = [
    // 0 · gancho: o clarão do walkout do Dragonite (0,4 s) e o dedo rasgando um pacote (o 1º do Abrir todos, sem o título)
    ['p01', [...seq(v2('fluxo'), 498, 12), ...seq(v2('fluxo'), 204, 36)], cheio(zoomFixo(1.5, 540, 1150)), []],
    // 1-2 · tela dividida, um compasso cada lado: o Clássico (o título, o dedo em "Nova copa", a copa nova do zero) e o
    // Clube do UT com as cartas
    ['p02a', DIV([...seq(v4('classico'), 2, 48)], segura(q4(v2('clube5'), 0), 48), 'e'), 'divide', [L('classico', 0, 1.6)]],
    ['p02b', DIV(segura(q4(v4('classico'), 49), 48), [...seq(v2('clube5'), 0, 12), ...segura(q4(v2('clube5'), 11), 36)], 'd'), 'divide', [L('ultimate', 0, 1.6)]],
    // 3 · ABRA PACOTES: o rasgo do 1º pacote e, na metade, o Dratini 48 pousando (de perto)
    ['p03a', seq(v2('pacote'), 2, 24), cheio(zoomFixo(1.5, 540, 1150)), [L('pacotes', 0, 0.8)]],
    ['p03b', seq(v2('pacote'), 40, 24), cheio(zoomFixo(1.6, 540, 1120)), [L('pacotes', 0, 0.8, 330, false)]],
    // 4 · o Pick: 5 cartas viradas, o dedo vira uma (Primeape 74)
    ['p05', [...seq(v4('pick'), 0, 45), ...segura(q4(v4('pick'), 44), 3)], sobre('crop=1080:1040:0:480', 580), [L('craque', 0, 1.6)]],
    // 5 · Clube: o toque no Dratini acende ele e o Dragonair (Dragão ×2)
    ['p06', seq(v2('clube5'), 0, 48), sobre('crop=1600:1500:100:0,scale=1080:-2:flags=lanczos', 560), [L('quimica', 0, 1.6)]],
    // 6 · o nível: Fácil, Normal, Difícil, Mestre (as Fichas sobem)
    ['p07', [...seq(v4('nivel'), 0, 36), ...segura(q4(v4('nivel'), 35), 12)], sobre('scale=1000:-2:flags=lanczos', 626), [L('dificuldade', 0, 1.6)]],
    // 7-8 · a partida: Slam, drible, GOL
    ['p08', P8, cheio(), [L('batalhas', 0, 3.2)]],
    // 9 · as 8 insígnias de Kanto acendendo
    ['p09', [...seq(v4('insignias'), 0, 36), ...segura(q4(v4('insignias'), 35), 12)], sobre('scale=1060:-2:flags=lanczos', 920), [L('ginasios', 0, 1.6)]],
    // 10 · METAS E PASSE: o marco 2 acende e o dedo pega o pacote; o passe da temporada rolando de lado
    ['p10a', seq(v2('fluxo'), 104, 24), sobre('crop=1080:560:0:1060', 700), [L('metaspasse', 0, 0.8)]],
    ['p10b', seq(v4('passe'), 3, 24), sobre('crop=1360:1600:0:0,scale=880:-2:flags=lanczos', 520), [L('metaspasse', 0, 0.8, 330, false)]],
    // 11 · EVENTO DE NATAL: a faixa da Temporada 1 (Kanto clássico, Evento: Natal) e o grupo do Evento nas Metas
    ['p12a', [...seq(v4('temporada/faixa'), 0, 15), ...segura(q4(v4('temporada/faixa'), 14), 9)], sobre('scale=1000:-2:flags=lanczos', 886), [L('natal', 0, 0.8)]],
    ['p12b', [...seq(v4('temporada/evento'), 0, 15), ...segura(q4(v4('temporada/evento'), 14), 9)], sobre('scale=1000:-2:flags=lanczos', 905), [L('natal', 0, 0.8, 330, false)]],
    // 12 · as edições, uma palavra por carta: SHINY. (0,4 s) ÍCONE. (0,4 s) EVENTO. (0,8 s)
    ['p13a', seq(v4('cartas/shiny'), 0, 12), sobre('scale=700:-2:flags=lanczos', 560), [L('shiny', 0, 0.4)]],
    ['p13b', seq(v4('cartas/icone'), 0, 12), sobre('scale=700:-2:flags=lanczos', 560), [L('icone', 0, 0.4)]],
    ['p13c', [...seq(v4('cartas/evento'), 0, 12), ...segura(q4(v4('cartas/evento'), 11), 12)], sobre('scale=700:-2:flags=lanczos', 560), [L('evento', 0, 0.8)]],
    // 13 · "Abrir todos (2)" tocado e o 2º pacote abrindo sozinho, dourado, até o estádio apagar
    ['p14', [...seq(v2('fluxo'), 178, 24), ...seq(v2('fluxo'), PAC2, 24)], cheio(), []],
    // 14-18 · o walkout inteiro do Dragonite, sem texto
    ['p15', WK.flatMap(([de, n]) => seq(v2('fluxo'), de, n)), cheio(), []],
    // 19 · Início: o time andando, o Dratini e o Dragonite lado a lado; o dedo toca no Dratini e ele pula
    ['p16', seq(v2('inicio6'), 14, 48), sobre('crop=1080:938:0:562', 640), [L('time', 0, 1.6)]],
    // 20 · os modos "Em breve", um por batida (o selo pisca na entrada)
    ...['rivals', 'elite', 'draft', 'sbc'].map((m, j) => [
        `p17${'abcd'[j]}`,
        segura(join(M4, 'embreve', `${m}.png`), 12),
        sobre("crop=815:860:0:0,scale=900:-2:flags=lanczos,eq=brightness='0.35*max(0,1-n/4)':eval=frame", 520),
        [L('mais', 0, 0.4, 330, j === 0)],
    ]),
    // 21-22 · fecho: logo, TIME ULTIMATE · 27/11, soccermon.com (o slam é do fecho4.html)
    ['p18', seq(v4('fecho'), 0, 84), cheio(), []],
];

const ZOOM = (n) =>
    `scale=w='trunc(1080*(1+0.03*n/${n})/2)*2':h='trunc(1920*(1+0.03*n/${n})/2)*2':eval=frame:flags=lanczos,crop=1080:1920:'(iw-1080)/2':'(ih-1920)/2'`;
const SLAM = "scale=w='trunc(iw*if(lt(n,3),1.6-0.2*n,1)/2)*2':h='trunc(ih*if(lt(n,3),1.6-0.2*n,1)/2)*2':eval=frame";
const ENC = ['-c:v', 'libx264', '-crf', '12', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30'];

/** Põe os quadros numa pasta numerada (links) e devolve o padrão. */
function pasta(nome, quadros) {
    const d = join(TMP, nome);
    mkdirSync(d, { recursive: true });
    quadros.forEach((f, i) => symlinkSync(f, join(d, `${String(i).padStart(4, '0')}.png`)));
    return join(d, '%04d.png');
}
const fundo = join(M2, 'fundo.png');
const partes = [];
let total = 0;
for (const [nome, quadros, comp, legs] of P) {
    let n;
    const args = [];
    const fc = [];
    if (comp === 'divide') {
        // tela dividida: o lado `liga` aceso, o outro parado e apagado
        const { esq, dir, liga } = quadros;
        n = esq.length;
        args.push('-framerate', '30', '-i', pasta(`${nome}e`, esq), '-loop', '1', '-framerate', '30', '-t', String(n / 30 + 0.1), '-i', fundo);
        args.push('-framerate', '30', '-i', pasta(`${nome}d`, dir));
        const apaga = 'eq=brightness=-0.32:saturation=0.4';
        fc.push(`[0:v]scale=530:942:flags=lanczos${liga === 'e' ? '' : `,${apaga}`}[e]`);
        fc.push(`[2:v]scale=530:942:flags=lanczos${liga === 'd' ? '' : `,${apaga}`}[d]`);
        fc.push(`[1:v]trim=end_frame=${n},setpts=PTS-STARTPTS[fb]`);
        fc.push('[fb][e]overlay=7:560[t];[t][d]overlay=543:560[c]');
    } else {
        n = quadros.length;
        args.push('-framerate', '30', '-i', pasta(nome, quadros), '-loop', '1', '-framerate', '30', '-t', String(n / 30 + 0.1), '-i', fundo);
        fc.push(`[0:v]setpts=PTS-STARTPTS[q];[1:v]trim=end_frame=${n},setpts=PTS-STARTPTS[fb]`);
        fc.push(comp);
    }
    fc.push(`[c]${ZOOM(n)},trim=end_frame=${n}[z0]`);
    legs.forEach(([arq, a, b, y, slam], j) => {
        const k = args.filter((x) => x === '-i').length;
        args.push('-loop', '1', '-framerate', '30', '-t', String(b - a), '-i', arq);
        fc.push(`[${k}:v]format=rgba,${slam ? `${SLAM},` : ''}setpts=PTS-STARTPTS+${a}/TB[l${j}]`);
        fc.push(`[z${j}][l${j}]overlay=x='(W-w)/2':y='${y}-h/2':eof_action=pass[z${j + 1}]`);
    });
    fc.push(`[z${legs.length}]format=yuv420p[v]`);
    const saida = join(TMP, `${nome}.mp4`);
    ff([...args, '-filter_complex', fc.join(';'), '-map', '[v]', '-frames:v', String(n), ...ENC, saida]);
    partes.push(saida);
    total += n;
    console.log(nome, n, 'quadros, até', (total / 30).toFixed(2), 's');
}
if (total !== 1092) console.warn(`atenção: ${total} quadros (a v5 tem 1092)`);
writeFileSync(join(TMP, 'lista.txt'), partes.map((p) => `file '${p}'`).join('\n'));
const VID = join(TMP, 'video.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', join(TMP, 'lista.txt'), '-c', 'copy', VID]);

// som: o walkout inteiro (cada som na hora do relógio da cena, como no v2/montar.mjs) e os trechos dele nos quadros
const wsons = JSON.parse(readFileSync(join(M2, 'walkout-sons/sons.json'), 'utf8'));
const win = [];
wsons.forEach((x, j) => {
    let file;
    let vol = 1;
    if (x.file) [file, vol] = [join(M2, 'walkout-sons', x.file), 0.45];
    else if (x.s.k === 'max') [file, vol] = [join(R, 'public/sfx', `max-${x.s.name}.mp3`), 0.6];
    else if (x.s.k === 'crowd')
        [file, vol] = [join(R, 'public/assets/sfx', `torcida-${x.s.call}-${1 + (j % 2)}.mp3`), 0.9 * x.s.gain];
    else if (x.s.k === 'cry') [file, vol] = [join(R, 'public/assets/cries/latest/149.ogg'), 0.7 * x.s.gain];
    if (file) win.push({ file, t: x.t, vol });
});
const WALK = join(TMP, 'walkout.wav');
ff([
    ...win.flatMap((w) => ['-i', w.file]),
    '-filter_complex',
    `${win.map((w, j) => `[${j}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${w.vol},adelay=${Math.round(w.t)}:all=1[w${j}]`).join(';')};${win.map((_, j) => `[w${j}]`).join('')}amix=inputs=${win.length}:normalize=0:duration=longest,atrim=0:12[o]`,
    '-map',
    '[o]',
    WALK,
]);
// [quadro do fluxo, quantos, segundo no vídeo]: a hora da cena é (quadro - 332) / 30 (+35 ms, o atraso medido na v3)
let at = P.slice(0, P.findIndex((p) => p[0] === 'p15')).reduce((x, p) => x + (p[2] === 'divide' ? p[1].esq : p[1]).length, 0) / 30;
const fatias = [[498, 12, 0], ...WK.map(([de, n]) => [de, n, ((at += n / 30) - n / 30)])];
// efeitos do jogo (v2/sons.mjs): [arquivo, segundo, volume]
const S = (f) => join(M2, 'sons', `${f}.wav`);
const CRY = join(R, 'public/assets/cries/latest/147.ogg');
const FX = [
    [S('rasgo'), 0.47, 0.5],
    [S('abrir-pacote'), 0.75, 0.35],
    [S('toque'), 2.0, 0.35],
    [S('rasgo'), 4.82, 0.5],
    [S('abrir-pacote'), 5.05, 0.35],
    [S('carta-vira'), 5.65, 0.3],
    [S('carta-2'), 6.27, 0.3],
    [CRY, 6.27, 0.3],
    [S('toque'), 6.67, 0.35],
    [S('carta-vira'), 6.72, 0.35],
    [S('toque'), 8.4, 0.35],
    [S('toque'), 9.67, 0.2],
    [S('toque'), 9.87, 0.2],
    [S('toque'), 10.07, 0.2],
    [S('toque'), 10.27, 0.2],
    [join(R, 'public/assets/sfx/torcida-gol-1.mp3'), 14.0, 0.6],
    [S('confirmar'), 16.37, 0.35],
    [S('toque'), 21.03, 0.35],
    [S('confirmar'), 21.05, 0.3],
    [S('toque'), 31.77, 0.35],
    [CRY, 31.77, 0.35],
];
const dur = (total / 30).toFixed(3);
const aargs = ['-i', MUS, '-i', WALK, ...FX.flatMap(([f]) => ['-i', f])];
const af = [`[0:a]atrim=0:${dur},afade=t=out:st=${(total / 30 - 0.5).toFixed(3)}:d=0.5,aresample=48000[mus]`];
af.push(`[1:a]asplit=${fatias.length}${fatias.map((_, j) => `[ws${j}]`).join('')}`);
fatias.forEach(([de, n, t], j) => {
    const a = (de - 332) / 30 + 0.035;
    af.push(
        `[ws${j}]atrim=${a.toFixed(3)}:${(a + n / 30).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(n / 30 - 0.02).toFixed(3)}:d=0.02,adelay=${Math.round(t * 1000)}:all=1[wk${j}]`,
    );
});
FX.forEach(([, t, vol], j) =>
    af.push(`[${2 + j}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},adelay=${Math.round(t * 1000)}:all=1[fx${j}]`),
);
af.push(
    `[mus]${fatias.map((_, j) => `[wk${j}]`).join('')}${FX.map((_, j) => `[fx${j}]`).join('')}amix=inputs=${1 + fatias.length + FX.length}:normalize=0:duration=first,atrim=0:${dur}[au]`,
);
const AUD = join(TMP, 'audio.wav');
ff([...aargs, '-filter_complex', af.join(';'), '-map', '[au]', '-c:a', 'pcm_s16le', AUD]);
// volume em duas passadas: mede e aplica o ganho fixo até -14 LUFS (o loudnorm de uma passada achata o crescendo)
const med = spawnSync('ffmpeg', ['-hide_banner', '-i', AUD, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
}).stderr;
const I = Number(/Integrated loudness:\s+I:\s+(-?[\d.]+)/.exec(med)?.[1] ?? '-14');
const g = (-14 - I).toFixed(2);
ff([
    '-i', VID, '-i', AUD,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30',
    '-af', `volume=${g}dB,alimiter=limit=0.84:level=false,aresample=48000`, '-c:a', 'aac', '-b:a', '192k',
    '-t', dur, '-movflags', '+faststart', OUT,
]);
if (!process.env.GUARDA) rmSync(TMP, { recursive: true, force: true });
console.log(`pronto: ${OUT} (${total} quadros, ${dur} s; volume ${I} LUFS + ${g} dB)`);
