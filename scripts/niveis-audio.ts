/**
 * Volume de cada canal como sai no jogo (Configurações no padrão), em LUFS: música, gritos, efeitos e torcida. Mede os
 * arquivos (e os efeitos do ZzFX gerados aqui) com o ebur128 do ffmpeg e soma o ganho que o jogo aplica
 * (`GAIN` em src/game/audio.ts, volume da música em src/game/music.ts). Alvos na skill soccermon-musica (§6).
 * Uso: npx tsx scripts/niveis-audio.ts
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

// o ZzFX cria um AudioContext ao ser importado: no Node basta um dublê
(globalThis as { AudioContext?: unknown }).AudioContext ??= class {};
const { ZZFX } = await import('zzfx');
const { GAIN, SFX } = await import('../src/game/audio');
const levels = JSON.parse(readFileSync('src/data/cry-levels.json', 'utf8')) as Record<string, [number, number][]>;

/** Padrão das Configurações (DEFAULT_SETTINGS): geral 0,6, música 0,4, canais 1. */
const MASTER = 0.6;
const MUSIC = 0.4;
const db = (g: number) => 20 * Math.log10(g);

/** Integrado e o maior momentâneo (janela de 400 ms: o volume de um som curto). */
function loud(args: string[], input?: Buffer): { i: number; m: number } {
    const out = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args, '-af', 'ebur128', '-f', 'null', '-'], {
        input,
        encoding: 'utf8',
        maxBuffer: 1 << 28,
    }).stderr;
    const ms = [...out.matchAll(/ M:\s*(-?[\d.]+)/g)].map((x) => Number(x[1]));
    const i = Number(/I:\s*(-?[\d.]+) LUFS\s*\n\s*Threshold/.exec(out)?.[1]);
    return { i, m: Math.max(...ms) };
}
const file = (f: string) => loud(['-i', f]);
/** Som curto: 1 s de silêncio depois (a janela de 400 ms precisa caber). */
const pcm = (x: number[]) => {
    const y = Float32Array.from([...x, ...new Array(ZZFX.sampleRate).fill(0)]);
    return loud(['-f', 'f32le', '-ar', String(ZZFX.sampleRate), '-ac', '1', '-i', 'pipe:0'], Buffer.from(y.buffer));
};
const median = (x: number[]) => [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)];
const pct = (x: number[], p: number) => [...x].sort((a, b) => a - b)[Math.floor((x.length - 1) * p)];
const f1 = (x: number) => x.toFixed(1).padStart(6);

const rows: [string, string, number, number, number][] = [];
const add = (canal: string, o: string, g: number, x: { i: number; m: number }) =>
    rows.push([canal, o, db(g), x.i + db(g), x.m + db(g)]);

// música: as faixas longas (loops) e os jingles
const music = readdirSync('public/music').filter((f) => f.endsWith('.webm'));
const gm = MASTER * MUSIC;
const mus = music.map((f) => ({ f, ...file(`public/music/${f}`) }));
const loops = mus.filter((x) => !/^(virada|vitoria|derrota|eliminado|campeao)/.test(x.f));
add('música', `loops (mediana de ${loops.length})`, gm, {
    i: median(loops.map((x) => x.i)),
    m: median(loops.map((x) => x.m)),
});
for (const x of mus.filter((x) => !loops.includes(x))) add('música', x.f.replace('.webm', ''), gm, x);

// gritos: todos, no ganho de normalização de cada um (cry-levels.json), chamada com ganho 1
for (const style of ['latest', 'legacy']) {
    const m: number[] = [];
    for (let id = 1; id <= 151; id++) {
        const g = 10 ** ((levels[style]?.[id - 1]?.[0] ?? 0) / 20);
        m.push(file(`public/assets/cries/${style}/${id}.ogg`).m + db(g));
    }
    const g = GAIN.cry * MASTER;
    rows.push(['gritos', `${style} (mediana; p90 ${f1(pct(m, 0.9) + db(g))})`, db(g), Number.NaN, median(m) + db(g)]);
}

// efeitos (ZzFX, sem a variação aleatória de tom)
for (const [name, p] of Object.entries(SFX)) {
    const q = [...p] as number[];
    q[1] = 0;
    add('efeitos', name, GAIN.sfx * MASTER, pcm(ZZFX.buildSamples(...q)));
}
for (const f of ['apito', 'apito-curto']) add('efeitos', f, GAIN.sample * MASTER, file(`public/assets/sfx/${f}.mp3`));

// torcida
for (const f of readdirSync('public/assets/sfx').filter((f) => f.startsWith('torcida')))
    add('torcida', f.replace('.mp3', ''), GAIN.sample * MASTER, file(`public/assets/sfx/${f}`));

console.log('canal     | o quê                                 | ganho dB | LUFS int | LUFS M máx');
for (const [c, o, g, i, m] of rows)
    console.log(`${c.padEnd(9)} | ${o.padEnd(37)} | ${f1(g)}   | ${Number.isNaN(i) ? '     -' : f1(i)}   | ${f1(m)}`);
