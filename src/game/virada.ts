/**
 * Virada de bateria da troca de tela (22/10/2026, a C da demo A/B/C): feita na hora, no andamento da faixa que sai,
 * com o ZzFX (bumbo, caixa, toms, prato) e a amostra do clap 808 (`public/music/clap-808.wav`, a receita 7b já
 * aplicada). Da próxima batida até o 1 do compasso seguinte (1 a 4 batidas); termina no SOC-CER-MON (3-3-2) de caixa
 * e clap. Módulo puro: quem chama passa o `buildSamples` do ZzFX e a amostra (os testes e os scripts usam o mesmo).
 * ponytail: sem o reverb curto que a demo punha nos toms e na caixa; pôr um ConvolverNode se o Miguel achar seca.
 */

/** Parâmetros do ZzFX (bateria do `scripts/musica/synth.mjs`, `I.kick` etc.); `undefined` = padrão do ZzFX. */
const u = undefined;
const KICK = [1.6, 0, 170, 0.003, u, 0.008, u, 0.97, -35, 53, u, u, u, u, u, 0.1];
const SNARE = [0.45, 0, 86, u, u, u, u, 0.7, u, u, u, 0.5, u, 6.7, 1, 0.05];
const TOM = [0.6, 0, 120, 0.002, 0.02, 0.25, 0, 1, -0.3];
const CRASH = [0.32, 0, 2600, u, 0.05, 1.3, 3, 2, u, u, 800, 0.02, u, 8, u, 0.01, 0.1];
/** Toms descendo (semitons sobre o `TOM`) e onde ficam no estéreo. */
const TOMS = [
    { pitch: 7, pan: 0.35 },
    { pitch: 3, pan: 0 },
    { pitch: -2, pan: -0.35 },
];

type Inst = 'kick' | 'snare' | 'tom0' | 'tom1' | 'tom2' | 'clap' | 'crash';
/** Uma batida da virada: `row` em semicolcheias desde o começo do compasso (16 = o 1 do compasso seguinte). */
export interface Hit {
    inst: Inst;
    row: number;
    vel: number;
}

/** As batidas da virada de `beats` batidas (1 a 4), as últimas do compasso; `crash`: prato e bumbo no 1 seguinte. */
export function viradaHits(beats: number, crash = false): Hit[] {
    const hits: Hit[] = [];
    const r0 = 16 - 4 * beats;
    if (beats <= 1) {
        // uma batida: rufo de caixa crescendo
        for (let i = 0; i < 4; i++) hits.push({ inst: 'snare', row: r0 + i, vel: 0.45 + 0.22 * i });
    } else {
        // antes das 2 últimas batidas: toms descendo, caixa fantasma nas linhas pares
        for (let r = r0; r < 8; r++) {
            const k = (r - r0) / Math.max(1, 8 - r0);
            const t = Math.min(2, Math.floor(k * 3));
            hits.push({ inst: `tom${t}` as Inst, row: r, vel: 0.5 + 0.35 * k });
            if (r % 2 === 0) hits.push({ inst: 'snare', row: r, vel: 0.3 });
        }
        // as 2 últimas: Soc-cer-MON na caixa e no clap, toms no meio
        for (const [row, vel] of [
            [8, 0.9],
            [11, 1],
            [14, 1.15],
        ])
            hits.push({ inst: 'snare', row, vel }, { inst: 'clap', row, vel });
        for (const [row, t] of [
            [9, 0],
            [10, 0],
            [12, 1],
            [13, 1],
            [15, 2],
        ])
            hits.push({ inst: `tom${t}` as Inst, row, vel: 0.55 });
    }
    if (crash) hits.push({ inst: 'crash', row: 16, vel: 1 }, { inst: 'kick', row: 16, vel: 1.1 });
    return hits;
}

/** Ganho e posição no estéreo de cada instrumento (os mesmos da demo). */
const MIX: Record<Inst, { gain: number; pan: number }> = {
    kick: { gain: 0.8, pan: 0 },
    snare: { gain: 0.85, pan: 0.05 },
    tom0: { gain: 0.9, pan: TOMS[0].pan },
    tom1: { gain: 0.9, pan: TOMS[1].pan },
    tom2: { gain: 0.9, pan: TOMS[2].pan },
    clap: { gain: 1, pan: 0 },
    crash: { gain: 0.6, pan: 0 },
};

/**
 * Nível da virada: RMS de 0,6 × o das nossas faixas (−16 LUFS dá RMS ~0,106, medido no `volumedetect`) e pico até
 * 0,4 (−8 dBFS): é percussão, fica abaixo do lead. A demo media a faixa que sai; aqui é fixo (todas no mesmo LUFS).
 */
export const FILL_RMS = 0.6 * 0.106;
export const FILL_PEAK = 0.4;

export type BuildSamples = (...p: (number | undefined)[]) => ArrayLike<number>;

/**
 * Mistura a virada (44,1 kHz, estéreo) começando na linha `16 − 4 × beats`. `pulse` = segundos por batida da faixa
 * que sai; `swing` = atraso (s) das semicolcheias ímpares. Devolve os canais já no nível (FILL_RMS, FILL_PEAK).
 */
export function mixVirada(
    o: { beats: number; pulse: number; swing?: number; crash?: boolean; clap?: Float32Array | null },
    build: BuildSamples,
    sr = 44100,
): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
    const hits = viradaHits(o.beats, o.crash);
    const r0 = 16 - 4 * o.beats;
    const span = o.beats * o.pulse;
    const at = (row: number) => ((row - r0) / 4) * o.pulse + (row % 2 ? (o.swing ?? 0) : 0);
    const cache = new Map<string, ArrayLike<number>>();
    const sample = (inst: Inst): ArrayLike<number> => {
        if (inst === 'clap') return o.clap ?? [];
        let s = cache.get(inst);
        if (!s) {
            const p =
                inst === 'kick'
                    ? KICK
                    : inst === 'snare'
                      ? SNARE
                      : inst === 'crash'
                        ? CRASH
                        : [...TOM.slice(0, 2), TOM[2] * 2 ** (TOMS[Number(inst[3])].pitch / 12), ...TOM.slice(3)];
            s = build(...p);
            cache.set(inst, s);
        }
        return s;
    };
    let n = Math.ceil(span * sr);
    for (const h of hits) n = Math.max(n, Math.round(at(h.row) * sr) + sample(h.inst).length);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (const h of hits) {
        const s = sample(h.inst);
        const { gain, pan } = MIX[h.inst];
        // a mesma lei de pan do synth.mjs
        const gl = gain * h.vel * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
        const gr = gain * h.vel * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
        const i0 = Math.round(at(h.row) * sr);
        for (let i = 0; i < s.length; i++) {
            L[i0 + i] += s[i] * gl;
            R[i0 + i] += s[i] * gr;
        }
    }
    let e = 0;
    let pk = 1e-9;
    const m = Math.min(n, Math.ceil(span * sr));
    for (let i = 0; i < n; i++) {
        if (i < m) e += (L[i] * L[i] + R[i] * R[i]) / 2;
        pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    }
    const k = Math.min(FILL_RMS / Math.max(1e-9, Math.sqrt(e / Math.max(1, m))), FILL_PEAK / pk);
    for (let i = 0; i < n; i++) {
        L[i] *= k;
        R[i] *= k;
    }
    return [L, R];
}

/** WAV PCM 16 bits mono (o `clap-808.wav`): as amostras em −1..1, sem passar pelo `decodeAudioData`. */
export function wavMono(buf: ArrayBuffer): Float32Array {
    const v = new DataView(buf);
    let p = 12;
    while (p + 8 <= v.byteLength) {
        const id = String.fromCharCode(v.getUint8(p), v.getUint8(p + 1), v.getUint8(p + 2), v.getUint8(p + 3));
        const len = v.getUint32(p + 4, true);
        if (id === 'data') {
            const x = new Float32Array(len >> 1);
            for (let i = 0; i < x.length; i++) x[i] = v.getInt16(p + 8 + 2 * i, true) / 32768;
            return x;
        }
        p += 8 + len + (len & 1);
    }
    return new Float32Array(0);
}
