// "Ouvir" uma faixa de referência pelos números: andamento, tonalidade provável, brilho e densidade.
//   node scripts/musica/analisar.mjs <arquivo> [...]
// Andamento: autocorrelação do envelope de ataques (pode dar o dobro ou a metade). Tonalidade: croma por Goertzel
// comparado com os perfis de Krumhansl-Kessler (maior e menor). Serve pra descrever a referência, não pra copiar.
import { execFileSync } from 'node:child_process';

const SR = 8000;
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function decode(f) {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
        maxBuffer: 1 << 30,
    });
    return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

function tempo(x) {
    const H = 80; // 10 ms
    const env = [];
    let prev = 0;
    for (let i = 0; i + H < x.length; i += H) {
        let e = 0;
        for (let j = i; j < i + H; j++) e += x[j] * x[j];
        e = Math.sqrt(e / H);
        env.push(Math.max(0, e - prev));
        prev = e;
    }
    const fps = SR / H;
    let best = [0, 0];
    for (let bpm = 70; bpm <= 190; bpm += 0.5) {
        const lag = Math.round((fps * 60) / bpm);
        let c = 0;
        for (let i = 0; i + lag < env.length; i++) c += env[i] * env[i + lag];
        c /= env.length - lag;
        if (c > best[0]) best = [c, bpm];
    }
    return best[1];
}

function chroma(x) {
    const N = 2048;
    const c = new Array(12).fill(0);
    for (let start = 0; start + N < x.length; start += N * 2) {
        for (let m = 45; m < 84; m++) {
            const w = 2 * Math.cos((2 * Math.PI * 440 * 2 ** ((m - 69) / 12)) / SR);
            let s1 = 0;
            let s2 = 0;
            for (let i = 0; i < N; i++) {
                const s0 = x[start + i] + w * s1 - s2;
                s2 = s1;
                s1 = s0;
            }
            c[m % 12] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - w * s1 * s2));
        }
    }
    return c;
}

function corr(a, b) {
    const ma = a.reduce((s, v) => s + v, 0) / 12;
    const mb = b.reduce((s, v) => s + v, 0) / 12;
    let n = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i < 12; i++) {
        n += (a[i] - ma) * (b[i] - mb);
        da += (a[i] - ma) ** 2;
        db += (b[i] - mb) ** 2;
    }
    return n / Math.sqrt(da * db);
}

function key(c) {
    const out = [];
    for (let t = 0; t < 12; t++) {
        const rot = (p) => p.map((_, i) => p[(i - t + 12) % 12]);
        out.push([corr(c, rot(MAJ)), `${NAMES[t]} maior`]);
        out.push([corr(c, rot(MIN)), `${NAMES[t]} menor`]);
    }
    return out.sort((a, b) => b[0] - a[0]).slice(0, 2);
}

for (const f of process.argv.slice(2)) {
    const x = decode(f);
    let z = 0;
    let e = 0;
    for (let i = 1; i < x.length; i++) {
        if (x[i - 1] < 0 !== x[i] < 0) z++;
        e += x[i] * x[i];
    }
    const [k1, k2] = key(chroma(x));
    console.log(
        `${f.split('/').at(-1)}: ${(x.length / SR).toFixed(0)} s, ~${tempo(x)} BPM, tom ${k1[1]} (${k1[0].toFixed(2)}) ou ${k2[1]} (${k2[0].toFixed(2)}), brilho ${Math.round((z / x.length) * SR)} cruz./s, rms ${Math.sqrt(e / x.length).toFixed(3)}`,
    );
}
