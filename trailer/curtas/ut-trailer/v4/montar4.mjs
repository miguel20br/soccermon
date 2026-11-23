// Monta o trailer v4 do Time Ultimate (roteiro-v4.md, o frenético) em 9:16, 1080x1920, 30 fps, -14 LUFS, com a música
// "Do zero ao time" a 150 BPM (scripts/musica/pecas/trailer-ut-v4.mjs: batida = 12 quadros, compasso = 48).
// Cada plano é renderizado à parte (quadros escolhidos um a um → composição → zoom de 3% → manchete com slam 1,6 → 1 em
// 0,1 s) e depois tudo é emendado e ganha o som: a música, os trechos do som do walkout nos quadros deles e os efeitos.
//   node trailer/curtas/ut-trailer/v4/montar4.mjs <midia-v2> <midia-v4> <musica.wav> <saida.mp4>
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [M2, M4, MUS, OUT] = process.argv.slice(2);
if (!OUT) throw new Error('uso: montar4.mjs <midia-v2> <midia-v4> <musica.wav> <saida.mp4>');
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
// a partida (2,4 s): o Slam em velocidade normal, o drible a ~2x e o GOL (o clarão do quadro 139) na batida 23 (9,2 s),
// com a rede lenta (a câmera lenta de verdade da gravação) até o corte
const P8 = [
    ...seq(null, 27, 12, (_, f) => partida(f)),
    ...Array.from({ length: 48 }, (_, i) => partida(39 + Math.round((i * (137 - 39)) / 47))),
    ...seq(null, 139, 12, (_, f) => partida(f)),
];
// o walkout (8 s, o respiro): estádio apagado e a placa OURO, o telão do tipo, a posição, o portão (o clarão), o Dragonite
// entra e chuta, a carta gira (sem o clarão branco do telão, 410 a 427); o quadro 598 (a carta revelando) cai em 20,8 s, a volta da música
const WK = [
    [334, 58],
    [396, 14],
    [428, 18],
    [496, 102],
    [598, 48],
];
const P = [
    // 1 · gancho: o clarão do walkout do Dragonite (0,4 s) e o dedo rasgando o 1º pacote
    ['p01', [...seq(v2('fluxo'), 498, 12), ...seq(v2('pacote'), 2, 36)], cheio(), []],
    // 2 · tela dividida (montada à parte, ver `divide`)
    ['p02', null, 'divide', [L('classico', 0, 0.8), L('ultimate', 0.8, 1.6)]],
    // 3 · o leque do 1º pacote, o Dratini 48 pousa (de perto, sem o título do pacote, que disputaria com a manchete)
    ['p03', seq(v2('pacote'), 40, 24), cheio(zoomFixo(1.6, 540, 1120)), [L('pacotes', 0, 0.8)]],
    // 4 · o arrastar de lado rasgando (o 1º pacote do Abrir todos)
    ['p04', seq(v2('fluxo'), 204, 24), cheio(zoomFixo(1.5, 540, 1150)), [L('rasgue', 0, 0.8)]],
    // 5 · o Pick: 5 cartas viradas, o dedo vira uma (Primeape 74)
    ['p05', seq(v4('pick'), 2, 24), sobre('crop=1080:1080:0:420', 560), [L('craque', 0, 0.8)]],
    // 6 · Clube: o toque no Dratini acende ele e o Dragonair (Dragão ×2)
    ['p06', seq(v2('clube5'), 6, 24), sobre('crop=1600:1500:100:0,scale=1080:-2:flags=lanczos', 560), [L('quimica', 0, 0.8)]],
    // 7 · o nível: Fácil, Normal, Difícil, Mestre (as Fichas sobem)
    ['p07', seq(v4('nivel'), 2, 24), sobre('scale=1000:-2:flags=lanczos', 626), [L('dificuldade', 0, 0.8)]],
    // 8 · a partida: Slam, drible, GOL
    ['p08', P8, cheio(), [L('batalhas', 0, 2.4)]],
    // 9 · as 8 insígnias de Kanto acendendo
    ['p09', seq(v4('insignias'), 2, 24), sobre('scale=1060:-2:flags=lanczos', 920), [L('ginasios', 0, 0.8)]],
    // 10 · Metas: o marco 2 acende e o dedo pega o pacote
    ['p10', seq(v2('fluxo'), 108, 24), sobre('crop=1080:560:0:1060', 700), [L('metas', 0, 0.8)]],
    // 11 · o passe da temporada rolando de lado
    ['p11', seq(v4('passe'), 3, 24), sobre('crop=1360:1600:0:0,scale=880:-2:flags=lanczos', 520), [L('passe', 0, 0.8)]],
    // 12 · a faixa da Temporada 1 (Kanto clássico, Evento: Natal) e o grupo do Evento
    ['p12a', seq(v4('temporada/faixa'), 0, 12), sobre('scale=1000:-2:flags=lanczos', 886), [L('eventos', 0, 0.4)]],
    ['p12b', seq(v4('temporada/evento'), 0, 12), sobre('scale=1000:-2:flags=lanczos', 905), [L('eventos', 0, 0.4, 330, false)]],
    // 13 · as edições no 3-3-2 do gancho: SHINY. ÍCONE. EVENTO.
    ['p13a', seq(v4('cartas/shiny'), 0, 9), sobre('scale=700:-2:flags=lanczos', 560), [L('shiny', 0, 0.3)]],
    ['p13b', seq(v4('cartas/icone'), 0, 9), sobre('scale=700:-2:flags=lanczos', 560), [L('icone', 0, 0.3)]],
    ['p13c', [...seq(v4('cartas/evento'), 0, 6)], sobre('scale=700:-2:flags=lanczos', 560), [L('evento', 0, 0.2)]],
    // 14 · "Abrir todos (2)" tocado
    ['p14', seq(v2('fluxo'), 178, 24), cheio(), []],
    // 15 · o walkout inteiro do Dragonite, sem texto
    ['p15', WK.flatMap(([de, n]) => seq(v2('fluxo'), de, n)), cheio(), []],
    // 16 · Início: o time andando, o Dratini e o Dragonite lado a lado; o dedo toca no Dratini e ele pula
    ['p16', seq(v2('inicio6'), 14, 96), sobre('crop=1080:938:0:562', 640), [L('time', 0, 3.2)]],
    // 17 · os modos "Em breve", um por batida (o selo pisca na entrada)
    ...['rivals', 'elite', 'draft', 'sbc'].map((m, j) => [
        `p17${'abcd'[j]}`,
        segura(join(M4, 'embreve', `${m}.png`), 12),
        sobre("crop=815:860:0:0,scale=900:-2:flags=lanczos,eq=brightness='0.35*max(0,1-n/4)':eval=frame", 520),
        [L('mais', 0, 0.4, 330, j === 0)],
    ]),
    // 18 · fecho: logo, TIME ULTIMATE · 27/11, soccermon.com (o slam é do fecho4.html)
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
        // 2 · à esquerda o fim de uma copa do Clássico (o título, o dedo em "Nova copa", a copa nova do zero), à direita o
        // Clube do UT com as cartas; um lado aceso por vez (0,8 s cada), o outro parado e apagado
        n = 48;
        const esq = [...seq(v4('classico'), 4, 24), ...segura(q4(v4('classico'), 27), 24)];
        const dir = [...segura(q4(v2('clube5'), 0), 24), ...seq(v2('clube5'), 0, 12), ...segura(q4(v2('clube5'), 11), 12)];
        args.push('-framerate', '30', '-i', pasta(`${nome}e`, esq), '-loop', '1', '-framerate', '30', '-t', '1.7', '-i', fundo);
        args.push('-framerate', '30', '-i', pasta(`${nome}d`, dir));
        fc.push("[0:v]scale=530:942:flags=lanczos,eq=brightness='if(gte(n,24),-0.32,0)':saturation='if(gte(n,24),0.4,1)':eval=frame[e]");
        fc.push("[2:v]scale=530:942:flags=lanczos,eq=brightness='if(lt(n,24),-0.32,0)':saturation='if(lt(n,24),0.4,1)':eval=frame[d]");
        fc.push('[1:v]trim=end_frame=48,setpts=PTS-STARTPTS[fb]');
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
if (total !== 900) console.warn(`atenção: ${total} quadros (o roteiro tem 900)`);
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
let at = (48 + 48 + 24 * 5 + 72 + 24 * 4 + 24 + 24) / 30;
const fatias = [[498, 12, 0], ...WK.map(([de, n]) => [de, n, ((at += n / 30) - n / 30)])];
// efeitos do jogo (v2/sons.mjs): [arquivo, segundo, volume]
const S = (f) => join(M2, 'sons', `${f}.wav`);
const CRY = join(R, 'public/assets/cries/latest/147.ogg');
const FX = [
    [S('rasgo'), 0.42, 0.5],
    [S('abrir-pacote'), 0.65, 0.35],
    [S('carta-1'), 1.43, 0.3],
    [S('toque'), 1.93, 0.35],
    [S('carta-vira'), 3.3, 0.3],
    [S('carta-2'), 3.87, 0.3],
    [CRY, 3.87, 0.3],
    [S('rasgo'), 4.07, 0.5],
    [S('abrir-pacote'), 4.35, 0.3],
    [S('toque'), 5.0, 0.35],
    [S('carta-vira'), 5.05, 0.35],
    [S('toque'), 5.8, 0.35],
    [S('toque'), 6.4, 0.2],
    [S('toque'), 6.6, 0.2],
    [S('toque'), 6.8, 0.2],
    [S('toque'), 7.0, 0.2],
    [join(R, 'public/assets/sfx/torcida-gol-1.mp3'), 9.2, 0.6],
    [S('confirmar'), 10.63, 0.35],
    [S('toque'), 13.83, 0.35],
    [S('confirmar'), 13.85, 0.3],
    [S('toque'), 23.77, 0.35],
    [CRY, 23.77, 0.35],
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
