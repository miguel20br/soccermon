/**
 * Renderiza os sons do golpe máximo (`src/game/max-sfx.ts`) em .wav pra ouvir, com a mesma mistura do jogo: o toque
 * por nota (perfeito, bom, fora), o golpe por nível e um trecho da música da partida indo pro fundo no bullet time e
 * voltando com a virada no toque perfeito (`duckMusic`/`unduckMusic` em `src/game/music.ts`).
 * Uso: npx tsx scripts/golpe-sons.ts <pasta>
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// o ZzFX cria um AudioContext ao ser importado: no Node basta um dublê
(globalThis as { AudioContext?: unknown }).AudioContext ??= class {};
const { ZZFX } = await import('zzfx');
const { MAX_MOVE, MAX_PEAK, MAX_TAP, mixMax } = await import('../src/game/max-sfx');
const { mixVirada, wavMono } = await import('../src/game/virada');
const { GAIN } = await import('../src/game/audio');

const out = process.argv[2];
if (!out) throw new Error('uso: npx tsx scripts/golpe-sons.ts <pasta>');
mkdirSync(out, { recursive: true });
const SR = 44100;
const build = ZZFX.buildSamples.bind(ZZFX) as unknown as (...p: (number | undefined)[]) => number[];
const clap = wavMono(readFileSync('public/music/clap-808.wav').buffer as ArrayBuffer);

function wav(file: string, chans: Float32Array[]) {
    const n = chans[0].length;
    const b = Buffer.alloc(44 + n * chans.length * 2);
    b.write('RIFF', 0);
    b.writeUInt32LE(36 + n * chans.length * 2, 4);
    b.write('WAVEfmt ', 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(chans.length, 22);
    b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(SR * chans.length * 2, 28);
    b.writeUInt16LE(chans.length * 2, 32);
    b.writeUInt16LE(16, 34);
    b.write('data', 36);
    b.writeUInt32LE(n * chans.length * 2, 40);
    for (let i = 0; i < n; i++)
        chans.forEach((c, k) => {
            b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c[i])) * 32767), 44 + (i * chans.length + k) * 2);
        });
    writeFileSync(join(out, file), b);
    console.log(join(out, file));
}

// o volume do jogo no padrão das Configurações (geral 0,6; efeitos e música nos canais): efeito = GAIN.sfx × 0,6
const SFX_LVL = GAIN.sfx * 0.6;
const MUSIC_LVL = 0.6 * 0.4;
/** Sozinhos: no nível do jogo, levados juntos pra cima (o mesmo ganho em todos, a diferença entre eles fica). */
const solo = (s: Float32Array) => s.map((x) => x * SFX_LVL * 3);
const tail = (s: Float32Array) => Float32Array.from([...s, ...new Array(SR / 4).fill(0)]);
const tap = (q: 0 | 1 | 2) => mixMax(MAX_TAP[q], build, clap, MAX_PEAK.tap, SR);
const move = (lv: 1 | 2 | 3) => mixMax(MAX_MOVE[lv], build, clap, MAX_PEAK.move, SR);
wav('perfeito.wav', [tail(solo(tap(2)))]);
wav('bom.wav', [tail(solo(tap(1)))]);
wav('fora.wav', [tail(solo(tap(0)))]);
for (const lv of [1, 2, 3] as const) wav(`golpe-n${lv}.wav`, [tail(solo(move(lv)))]);

// a música no fundo e a volta: partida-1t, trecho nivel2 (128 BPM), a partir do 5º compasso
const meta = JSON.parse(readFileSync('public/music/partida-1t.json', 'utf8'));
const sec = meta.secoes.find((s: { nome: string }) => s.nome === 'nivel2');
const pulse = 60 / sec.bpm;
const bar = 4 * pulse;
const from = sec.inicio + 4 * bar;
const len = 5 * bar;
const raw = spawnSync(
    'ffmpeg',
    [
        '-v',
        'error',
        '-ss',
        String(from),
        '-t',
        String(len),
        '-i',
        'public/music/partida-1t.webm',
        '-f',
        'f32le',
        '-ac',
        '2',
        '-ar',
        String(SR),
        '-',
    ],
    { maxBuffer: 1 << 28 },
).stdout;
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
const n = Math.floor(pcm.length / 2);
const L = new Float32Array(n);
const R = new Float32Array(n);
for (let i = 0; i < n; i++) [L[i], R[i]] = [pcm[2 * i], pcm[2 * i + 1]];

// a linha do tempo: o botão acende no meio do 2º compasso; o anel fecha no 1 do 3º; o toque 30 ms antes (perfeito)
const DUCK = { hz: 650, gain: 0.5, tau: 0.08 };
const cueAt = 1.4 * bar;
const ringAt = 2 * bar;
const tapAt = ringAt - 0.03;
// a virada: da próxima batida (a pelo menos 0,1 s do toque) até o 1 seguinte
const fillAt = Math.ceil((tapAt + 0.1) / pulse) * pulse;
const openAt = 3 * bar;
const beats = Math.round((openAt - fillAt) / pulse);
const [fl, fr] = mixVirada({ beats, pulse, swing: (0.06 * pulse) / 4, crash: true, clap }, build, SR);
/** Corte e volume da faixa no tempo `t` (setTargetAtTime: desce no aceso, abre no 1 com tau curto). */
const env = (t: number): [number, number] => {
    if (t < cueAt) return [SR / 2, 1];
    const k = Math.exp(-(t - cueAt) / DUCK.tau);
    const hz = DUCK.hz + (SR / 2 - DUCK.hz) * k;
    const g = DUCK.gain + (1 - DUCK.gain) * k;
    if (t < openAt) return [hz, g];
    const j = Math.exp(-(t - openAt) / 0.01);
    return [SR / 2 + (hz - SR / 2) * j, 1 + (g - 1) * j];
};
// passa-baixa biquad (RBJ, Q 0,707 como o BiquadFilterNode com Q 0) refeito a cada 32 amostras
const lowpass = (x: Float32Array) => {
    const y = new Float32Array(x.length);
    let [x1, x2, y1, y2] = [0, 0, 0, 0];
    let c = [1, 0, 0, 0, 0];
    for (let i = 0; i < x.length; i++) {
        if (i % 32 === 0) {
            const hz = Math.min(env(i / SR)[0], SR * 0.49);
            const w = (2 * Math.PI * hz) / SR;
            const a = Math.sin(w) / (2 * Math.SQRT1_2);
            const a0 = 1 + a;
            const cw = Math.cos(w);
            c = [(1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0, (-2 * cw) / a0, (1 - a) / a0];
        }
        const v = c[0] * x[i] + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
        [x2, x1, y2, y1] = [x1, x[i], y1, v];
        y[i] = v * env(i / SR)[1];
    }
    return y;
};
const mix = [lowpass(L), lowpass(R)].map((c, k) => {
    const f = k ? fr : fl;
    const o = new Float32Array(c.length);
    const i0 = Math.round(fillAt * SR);
    for (let i = 0; i < c.length; i++) o[i] = (c[i] + (f[i - i0] ?? 0)) * MUSIC_LVL;
    return o;
});
const add = (s: Float32Array, at: number) => {
    const i0 = Math.round(at * SR);
    for (const c of mix) for (let i = 0; i < s.length && i0 + i < c.length; i++) c[i0 + i] += s[i] * SFX_LVL;
};
add(tap(2), ringAt);
add(move(2), tapAt + 0.25);
// pra ouvir: o trecho todo sobe junto até pico 0,9
const pk = Math.max(...mix.map((c) => c.reduce((m, x) => Math.max(m, Math.abs(x)), 0)));
wav(
    'musica-fundo-e-volta.wav',
    mix.map((c) => c.map((x) => (x * 0.9) / pk)),
);
console.log(
    `trecho: aceso ${cueAt.toFixed(2)} s, anel fecha ${ringAt.toFixed(2)} s, toque ${tapAt.toFixed(2)} s, virada ${fillAt.toFixed(2)}–${openAt.toFixed(2)} s (${beats} batidas)`,
);
