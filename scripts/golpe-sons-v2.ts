/**
 * Golpe máximo, rodada 2 dos sons (30/10/2026): o Miguel achou os sons do `max-sfx.ts` finos ("nem de longe daquele
 * jeito gostoso de ouvir, bem dopamina"). Aqui saem 3 pacotes candidatos, sintetizados à mão (sem amostra fora o clap
 * 808 CC0), pra ouvir lado a lado com o atual: toque perfeito/bom/fora, golpe N1/N2/N3 e uma sequência com a música da
 * partida (no fundo no anel, perfeito no 1 do compasso, virada e o N3). Nada disso entra no jogo ainda.
 * Receita de todos: transiente seco (bumbo com clique + grave), camada brilhante que sobe (arpejo), sala curta em
 * estéreo e escada fora < bom < perfeito, N1 < N2 < N3. Notas em Lá com quinta e nona (casam com o dórico da partida).
 * Uso: scripts/pesado.sh npx tsx scripts/golpe-sons-v2.ts <pasta> [--jogo]   (os .wav, numeros.json e index.html; com
 * --jogo, o pacote D, o que está no jogo, sai em public/sfx/max-<som>.mp3)
 */
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// o ZzFX cria um AudioContext ao ser importado: no Node basta um dublê
(globalThis as { AudioContext?: unknown }).AudioContext ??= class {};
const { ZZFX } = await import('zzfx');
const { mixVirada, wavMono } = await import('../src/game/virada');
const { GAIN } = await import('../src/game/audio');

const out = process.argv[2];
if (!out) throw new Error('uso: npx tsx scripts/golpe-sons-v2.ts <pasta>');
mkdirSync(out, { recursive: true });
/** Pico de cada som (o mesmo do pacote antigo): toque 0,8, golpe 1. */
const MAX_PEAK = { tap: 0.8, move: 1 };
// o pacote antigo (ZzFX, até a 0.9.27) saiu do jogo: vem do histórico do git, só pra comparar na página
writeFileSync(join(out, 'antigo-max-sfx.ts'), execSync('git show a2225600:src/game/max-sfx.ts'));
const old = await import(pathToFileURL(resolve(out, 'antigo-max-sfx.ts')).href);
const SR = 44100;
type Mono = Float32Array;
type Stereo = [Mono, Mono];
const N = (s: number) => Math.round(s * SR);
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const build = ZZFX.buildSamples.bind(ZZFX) as unknown as (...p: (number | undefined)[]) => number[];
const clapFile = readFileSync('public/music/clap-808.wav');
const clapRaw = wavMono(clapFile.buffer.slice(clapFile.byteOffset, clapFile.byteOffset + clapFile.length));

// ---------- síntese ----------
/** Gerador fixo (mulberry32): o mesmo som sempre. */
function rng(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
type Shape = 'sin' | 'tri' | 'saw' | 'sq';
/** Oscilador sem serrilhado (soma de harmônicos até ~20 kHz ou `maxH`): `f` em Hz ou função do tempo. */
function osc(dur: number, f: number | ((t: number) => number), shape: Shape = 'sin', maxH = 30, ph0 = 0): Mono {
    const y = new Float32Array(N(dur));
    let ph = ph0;
    for (let i = 0; i < y.length; i++) {
        const fr = typeof f === 'number' ? f : f(i / SR);
        ph = (ph + fr / SR) % 1;
        const w = 2 * Math.PI * ph;
        if (shape === 'sin') {
            y[i] = Math.sin(w);
            continue;
        }
        const K = Math.max(1, Math.min(maxH, Math.floor((0.45 * SR) / fr)));
        let v = 0;
        for (let k = 1; k <= K; k++) {
            if (shape === 'saw') v += Math.sin(k * w) / k;
            else if (k % 2)
                v += shape === 'sq' ? Math.sin(k * w) / k : ((k % 4 === 1 ? 1 : -1) * Math.sin(k * w)) / (k * k);
        }
        y[i] = shape === 'saw' ? v * 0.55 : shape === 'sq' ? v * 0.8 : v * 0.81;
    }
    return y;
}
/** Envelope: ataque linear `a`, segura `hold`, cai exponencial com constante `tau`; 3 ms de saída no fim. */
function env(y: Mono, a: number, tau: number, hold = 0): Mono {
    const fade = N(0.003);
    for (let i = 0; i < y.length; i++) {
        const t = i / SR;
        let g = t < a ? t / a : t < a + hold ? 1 : Math.exp(-(t - a - hold) / tau);
        if (i > y.length - fade) g *= (y.length - i) / fade;
        y[i] *= g;
    }
    return y;
}
function noise(dur: number, seed: number): Mono {
    const r = rng(seed);
    return Float32Array.from({ length: N(dur) }, () => r() * 2 - 1);
}
/** Filtro de variável de estado (TPT, estável com corte variando): passa-baixa, faixa ou alta. */
function svf(x: Mono, fc: number | ((t: number) => number), q = Math.SQRT1_2, mode: 'lp' | 'bp' | 'hp' = 'lp'): Mono {
    const y = new Float32Array(x.length);
    const k = 1 / q;
    let [ic1, ic2] = [0, 0];
    for (let i = 0; i < x.length; i++) {
        const f = Math.min(typeof fc === 'number' ? fc : fc(i / SR), SR * 0.45);
        const g = Math.tan((Math.PI * f) / SR);
        const a1 = 1 / (1 + g * (g + k));
        const v3 = x[i] - ic2;
        const v1 = a1 * ic1 + g * a1 * v3;
        const v2 = ic2 + g * a1 * ic1 + g * g * a1 * v3;
        ic1 = 2 * v1 - ic1;
        ic2 = 2 * v2 - ic2;
        y[i] = mode === 'lp' ? v2 : mode === 'bp' ? v1 : x[i] - k * v1 - v2;
    }
    return y;
}
const gain = (y: Mono, g: number) => y.map((v) => v * g);
const sat = (y: Mono, d: number) => y.map((v) => Math.tanh(v * d) / Math.tanh(d));
/** Peso do bumbo e do grave contra a camada de prêmio (o celular não toca o grave: o prêmio tem que aparecer). */
const [KICK, SUB] = [0.75, 0.6];
/** Bumbo: seno que despenca de `f0` a `f1` (constante `pt`), saturado (harmônicos que o celular toca) + clique. */
function kick(o: { f0: number; f1: number; pt: number; tau: number; dur?: number; click?: number; drive?: number }) {
    const dur = o.dur ?? o.tau * 5;
    const y = env(
        osc(dur, (t) => o.f1 + (o.f0 - o.f1) * Math.exp(-t / o.pt), 'sin', 1, 0.25),
        0.0005,
        o.tau,
        0.01,
    );
    const s = sat(y, o.drive ?? 1.8);
    const c = env(svf(noise(0.012, 7), 2500, 0.7, 'hp'), 0.0002, 0.0018);
    for (let i = 0; i < c.length; i++) s[i] += c[i] * (o.click ?? 0.5);
    return gain(s, KICK);
}
/** Grave puro (o "tum" do peito), com queda de tom opcional. */
const sub = (f0: number, f1: number, tau: number, dur = tau * 5) =>
    gain(
        env(
            osc(dur, (t) => f1 + (f0 - f1) * Math.exp(-t / 0.08), 'sin'),
            0.002,
            tau,
            0.02,
        ),
        SUB,
    );
/** O clap 808 na receita 7b: passa-baixa ~6,8 kHz (duas passadas). */
const clap = (corte = 6800) => svf(svf(Float32Array.from(clapRaw), corte), corte);
/** Sino quente: seno com FM 1:1 só no ataque (o "ping" de vidro) e a oitava baixinho. */
function bell(m: number, tau: number, idx = 1.6) {
    const f = hz(m);
    const y = new Float32Array(N(tau * 5));
    for (let i = 0; i < y.length; i++) {
        const t = i / SR;
        const mod = idx * Math.exp(-t / 0.025) * Math.sin(2 * Math.PI * f * t);
        y[i] = Math.sin(2 * Math.PI * f * t + mod) + 0.18 * Math.exp(-t / (tau * 0.4)) * Math.sin(4 * Math.PI * f * t);
    }
    return env(y, 0.001, tau);
}
/** Moeda: quadrada macia (passa-baixa) que pula de `m1` pra `m2` em 50 ms, com a oitava de baixo dando corpo. */
function coin(m1: number, m2: number, tau: number) {
    const y = osc(0.06 + tau * 5, (t) => (t < 0.05 ? hz(m1) : hz(m2)), 'sq', 9);
    const body = osc(0.06 + tau * 5, (t) => (t < 0.05 ? hz(m1) : hz(m2)) / 2, 'sin');
    for (let i = 0; i < y.length; i++) y[i] = y[i] * 0.7 + body[i] * 0.35;
    return env(svf(y, 5200), 0.001, tau, 0.05);
}
/** Metal de funk (stab): 3 serras desafinadas ±7 cents, entra meio tom abaixo e sobe (o "bwah"), filtro abre e fecha. */
function brass(ms: number[], hold: number, tau = 0.12, open = 3400) {
    const dur = hold + tau * 5;
    const y = new Float32Array(N(dur));
    for (const m of ms)
        for (const c of [-7, 0, 7]) {
            const s = osc(
                dur,
                (t) => hz(m) * 2 ** ((c / 100 - Math.exp(-t / 0.025)) / 12),
                'saw',
                40,
                (m * 0.37 + c) % 1,
            );
            for (let i = 0; i < y.length; i++) y[i] += (1.6 * s[i]) / (3 * ms.length); // 1,6: o metal na frente do grave
        }
    return env(
        svf(y, (t) => 500 + open * Math.exp(-t / 0.12) + (t < 0.01 ? (open * t) / 0.01 - open : 0), 1.1),
        0.004,
        tau,
        hold,
    );
}
/** Brilho: ruído agudo e curtinho (o "tss" do pó de estrela). */
const sparkle = (tau: number, seed: number, f = 7500) => env(svf(noise(tau * 5, seed), f, 0.8, 'hp'), 0.001, tau);
/** Poeira de estrela: senos agudos espalhados no tempo e no estéreo. */
function shimmer(b: Bus, at: number, len: number, notes: number[], n: number, g: number, seed: number) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
        const t = at + (len * i) / n + r() * 0.02;
        b.add(
            env(osc(0.25, hz(notes[Math.floor(r() * notes.length)]), 'sin'), 0.001, 0.05),
            t,
            g * (0.6 + 0.4 * r()),
            r() * 1.6 - 0.8,
        );
    }
}

/** Mesa estéreo: põe camadas mono com ganho e pan (potência constante) e uma sala curta no fim. */
class Bus {
    L = new Float32Array(N(2.5));
    R = new Float32Array(N(2.5));
    add(y: Mono, at: number, g: number, pan = 0) {
        const i0 = N(at);
        const [gl, gr] = [
            Math.cos(((pan + 1) * Math.PI) / 4) * g * Math.SQRT2,
            Math.sin(((pan + 1) * Math.PI) / 4) * g * Math.SQRT2,
        ];
        for (let i = 0; i < y.length && i0 + i < this.L.length; i++) {
            this.L[i0 + i] += y[i] * gl;
            this.R[i0 + i] += y[i] * gr;
        }
        return this;
    }
    /** Sala de Schroeder com amortecimento (4 pentes + 2 passa-tudo), lados com tempos diferentes = estéreo. */
    room(mix: number, size = 1, fb = 0.78) {
        const x = this.L.map((v, i) => (v + this.R[i]) / 2);
        const side = (off: number) => {
            const y = new Float32Array(x.length);
            for (const d0 of [1116, 1188, 1277, 1356]) {
                const d = Math.round(d0 * size * 0.6) + off;
                const buf = new Float32Array(d);
                let [p, lp] = [0, 0];
                for (let i = 0; i < x.length; i++) {
                    const o = buf[p];
                    lp = o * 0.6 + lp * 0.4; // amortece o agudo da cauda (quente, sem chiado metálico)
                    buf[p] = x[i] + lp * fb;
                    p = (p + 1) % d;
                    y[i] += o / 4;
                }
            }
            for (const d of [556 + off, 225 + off]) {
                const buf = new Float32Array(d);
                let p = 0;
                for (let i = 0; i < y.length; i++) {
                    const o = buf[p];
                    const v = y[i] + o * 0.5;
                    buf[p] = v;
                    y[i] = o - v * 0.5;
                    p = (p + 1) % d;
                }
            }
            return y;
        };
        const [wl, wr] = [side(0), side(23)];
        for (let i = 0; i < x.length; i++) {
            this.L[i] += wl[i] * mix;
            this.R[i] += wr[i] * mix;
        }
        return this;
    }
    /** Corta em `max` s (ou antes, a −60 dB), com 15 ms de saída. */
    done(max: number): Stereo {
        let pk = 1e-9;
        for (let i = 0; i < this.L.length; i++) pk = Math.max(pk, Math.abs(this.L[i]), Math.abs(this.R[i]));
        let end = this.L.length;
        while (end > 0 && Math.max(Math.abs(this.L[end - 1]), Math.abs(this.R[end - 1])) < pk * 1e-3) end--;
        end = Math.min(end, N(max));
        const f = N(0.015);
        return [this.L, this.R].map((c) => {
            const y = c.slice(0, end);
            for (let i = 0; i < f && i < end; i++) y[end - 1 - i] *= i / f;
            return y;
        }) as Stereo;
    }
}

// ---------- os pacotes ----------
// notas (MIDI): A3 57, A4 69, B4 71, D5 74, E5 76, F#5 78, A5 81, B5 83, D6 86, E6 88, A6 93, B6 95, D7 98, E7 100, A7 105
const PENTA = [69, 71, 74, 76, 81, 83, 86, 88, 93, 95, 98, 100, 105];
type Sound = 'tap-perfeito' | 'tap-bom' | 'tap-fora' | 'golpe-n1' | 'golpe-n2' | 'golpe-n3';
type Pack = { id: string; nome: string; ideia: string; sons: Record<Sound, () => Stereo> };

const moedas: Pack = {
    id: 'a-moedas',
    nome: 'A · Chuva de moedas',
    ideia: 'A moeda do Mercado (a assinatura que você curtiu) virando prêmio: o perfeito é bumbo + clap 808 + 4 moedas subindo L/R; o N3 é um caça-níquel estourando (12 moedas e o acorde do jackpot).',
    sons: {
        'tap-fora': () =>
            new Bus()
                .add(
                    env(
                        osc(0.2, (t) => 150 + 60 * Math.exp(-t / 0.03), 'tri', 9),
                        0.001,
                        0.035,
                    ),
                    0,
                    0.8,
                )
                .add(env(svf(noise(0.05, 3), 1200), 0.001, 0.008), 0, 0.25)
                .room(0.12, 0.7)
                .done(0.3),
        'tap-bom': () =>
            new Bus()
                .add(kick({ f0: 180, f1: 70, pt: 0.02, tau: 0.05, click: 0.3 }), 0, 0.6)
                .add(coin(88, 93, 0.09), 0, 0.5, 0.2)
                .room(0.18, 0.8)
                .done(0.55),
        'tap-perfeito': () => {
            const b = new Bus()
                .add(kick({ f0: 230, f1: 55, pt: 0.022, tau: 0.08, click: 0.8 }), 0, 0.95)
                .add(sub(60, 52, 0.12), 0, 0.55)
                .add(clap(), 0, 0.75)
                .add(sparkle(0.05, 11), 0, 0.22, -0.5)
                .add(sparkle(0.05, 12), 0.004, 0.22, 0.5);
            [
                [83, 88],
                [88, 93],
                [93, 95],
                [95, 100],
            ].forEach(([a, z], i) => void b.add(coin(a, z, 0.1 + i * 0.03), i * 0.045, 0.42, i % 2 ? 0.35 : -0.35));
            return b.room(0.25, 1).done(0.85);
        },
        'golpe-n1': () =>
            new Bus()
                .add(kick({ f0: 200, f1: 50, pt: 0.025, tau: 0.09, click: 0.6 }), 0, 0.95)
                .add(sub(55, 48, 0.12), 0, 0.5)
                .add(coin(88, 93, 0.08), 0, 0.4, -0.25)
                .add(coin(93, 100, 0.1), 0.06, 0.38, 0.25)
                .room(0.2, 0.9)
                .done(0.55),
        'golpe-n2': () => {
            const b = new Bus()
                .add(kick({ f0: 220, f1: 46, pt: 0.03, tau: 0.13, click: 0.7 }), 0, 1)
                .add(sub(62, 46, 0.22), 0, 0.6)
                .add(clap(), 0, 0.7)
                .add(sparkle(0.08, 21), 0.05, 0.2, -0.6)
                .add(sparkle(0.08, 22), 0.07, 0.2, 0.6);
            [81, 83, 86, 88, 93, 95].forEach(
                (m, i) => void b.add(coin(m, m + 5, 0.08 + i * 0.015), 0.02 + i * 0.038, 0.36, i % 2 ? 0.45 : -0.45),
            );
            return b.room(0.3, 1.1).done(1.05);
        },
        'golpe-n3': () => {
            const b = new Bus()
                .add(kick({ f0: 240, f1: 40, pt: 0.035, tau: 0.2, click: 0.9, drive: 2.2 }), 0, 1)
                .add(sub(75, 38, 0.4), 0, 0.7)
                .add(clap(), 0, 0.7, -0.3)
                .add(clap(6200), 0.018, 0.6, 0.3);
            PENTA.slice(0, 12).forEach(
                (m, i) => void b.add(coin(m, m + 5, 0.07 + i * 0.008), 0.03 + i * 0.042, 0.32, Math.sin(i * 1.3) * 0.7),
            );
            // o jackpot: 3 moedas juntas + acorde quadrado macio (Lá com nona) + pó de estrela
            const t = 0.56;
            for (const [m, p] of [
                [93, -0.4],
                [100, 0.4],
                [105, 0],
            ])
                b.add(coin(m - 5, m, 0.35), t, 0.3, p);
            for (const m of [57, 64, 69, 71])
                b.add(env(svf(osc(1.3, hz(m), 'sq', 15), 1800), 0.01, 0.35, 0.1), t, 0.13);
            b.add(kick({ f0: 160, f1: 60, pt: 0.02, tau: 0.06, click: 0.3 }), t, 0.5);
            shimmer(b, t, 0.7, [100, 105, 107], 14, 0.07, 31);
            return b.room(0.35, 1.3).done(1.8);
        },
    },
};

const cristal: Pack = {
    id: 'b-cristal',
    nome: 'B · Sino de cristal',
    ideia: 'Toque de ritmo estilo osu! com sino de vidro quente: o perfeito é um "tchak" seco + clap 808 + 5 sinos arpejados num piscar (22 ms cada) e poeira de estrela; o N3 é uma harpa subindo 3 oitavas até um acorde que brilha.',
    sons: {
        'tap-fora': () =>
            new Bus()
                .add(env(svf(osc(0.2, hz(57), 'tri', 9), 900), 0.001, 0.045), 0, 0.9)
                .room(0.12, 0.7)
                .done(0.3),
        'tap-bom': () =>
            new Bus()
                .add(kick({ f0: 170, f1: 70, pt: 0.02, tau: 0.045, click: 0.5 }), 0, 0.55)
                .add(bell(88, 0.18), 0, 0.38, -0.15)
                .add(bell(93, 0.16), 0.03, 0.26, 0.2)
                .room(0.25, 0.9)
                .done(0.6),
        'tap-perfeito': () => {
            const b = new Bus()
                .add(kick({ f0: 240, f1: 58, pt: 0.02, tau: 0.075, click: 1 }), 0, 0.9)
                .add(sub(62, 55, 0.1), 0, 0.5)
                .add(clap(), 0, 0.65)
                .add(env(svf(noise(0.04, 5), 3200, 1.5, 'bp'), 0.0003, 0.006), 0, 0.9); // o "tchak" do osu!
            [81, 88, 93, 95, 100].forEach(
                (m, i) => void b.add(bell(m, 0.22 + i * 0.03), i * 0.022, 0.3, -0.6 + i * 0.3),
            );
            shimmer(b, 0.1, 0.35, [105, 107, 112], 9, 0.08, 41);
            return b.room(0.35, 1.2).done(0.9);
        },
        'golpe-n1': () =>
            new Bus()
                .add(kick({ f0: 210, f1: 50, pt: 0.025, tau: 0.09, click: 0.8 }), 0, 0.95)
                .add(sub(56, 48, 0.12), 0, 0.5)
                .add(env(svf(noise(0.04, 6), 3000, 1.5, 'bp'), 0.0003, 0.006), 0, 0.7)
                .add(bell(81, 0.2), 0, 0.3, -0.3)
                .add(bell(88, 0.2), 0.02, 0.28, 0.3)
                .room(0.28, 1)
                .done(0.58),
        'golpe-n2': () => {
            const b = new Bus()
                .add(kick({ f0: 225, f1: 46, pt: 0.03, tau: 0.13, click: 0.9 }), 0, 1)
                .add(sub(64, 46, 0.22), 0, 0.6)
                .add(clap(), 0, 0.6)
                .add(env(svf(noise(0.04, 8), 3000, 1.5, 'bp'), 0.0003, 0.006), 0, 0.7);
            [81, 83, 88, 93, 95, 100].forEach(
                (m, i) => void b.add(bell(m, 0.25 + i * 0.03), 0.01 + i * 0.04, 0.27, -0.7 + i * 0.28),
            );
            shimmer(b, 0.2, 0.5, [105, 107, 112], 10, 0.07, 42);
            return b.room(0.38, 1.3).done(1.1);
        },
        'golpe-n3': () => {
            const b = new Bus()
                .add(kick({ f0: 245, f1: 40, pt: 0.035, tau: 0.2, click: 1, drive: 2.2 }), 0, 1)
                .add(sub(76, 38, 0.4), 0, 0.7)
                .add(clap(), 0, 0.6, -0.25)
                .add(clap(6200), 0.016, 0.5, 0.25)
                .add(env(svf(noise(0.04, 9), 2800, 1.5, 'bp'), 0.0003, 0.006), 0, 0.7);
            // a harpa: 13 sinos em Lá pentatônico subindo de A4 a A7 em meio segundo
            PENTA.forEach(
                (m, i) => void b.add(bell(m, 0.16 + i * 0.01, 1.2), 0.02 + i * 0.036, 0.22, Math.sin(i * 0.9) * 0.75),
            );
            // e o acorde que brilha no topo, com um colchão quente de serra (Lá com nona) inchando por baixo
            const t = 0.5;
            for (const [m, p] of [
                [93, -0.5],
                [100, 0.5],
                [105, 0],
            ])
                b.add(bell(m, 0.45, 2), t, 0.24, p);
            for (const m of [57, 64, 69, 71])
                b.add(env(svf(osc(1.4, hz(m), 'saw', 25), 1300), 0.12, 0.4, 0.15), 0.25, 0.1, m === 64 ? -0.4 : 0.3);
            shimmer(b, t, 0.9, [105, 107, 112], 18, 0.06, 43);
            return b.room(0.45, 1.5, 0.8).done(1.8);
        },
    },
};

/** Apito de juiz curtinho (trinado de 28 Hz): a assinatura de futebol do pacote C. */
function whistle(dur: number) {
    const y = osc(dur, (t) => 2650 + 40 * Math.sin(2 * Math.PI * 28 * t), 'sin');
    const n = svf(noise(dur, 17), 2650, 4, 'bp');
    for (let i = 0; i < y.length; i++) y[i] = (y[i] + n[i] * 2) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 28 * (i / SR)));
    return env(y, 0.008, 0.04, dur - 0.06);
}
const estadio: Pack = {
    id: 'c-estadio',
    nome: 'C · Estádio funk',
    ideia: 'O golpe como gol de Rocket League com o funk da partida: o perfeito é bumbo + clap 808 + o metal da trilha dando um "bwah!" que sobe; o N3 é a explosão grave do 808 com os metais tocando o SOC-CER-MON (3-3-2) subindo e o apito.',
    sons: {
        'tap-fora': () =>
            new Bus()
                .add(
                    sat(
                        env(
                            osc(0.2, (t) => 105 + 70 * Math.exp(-t / 0.02), 'sin'),
                            0.001,
                            0.04,
                        ),
                        2,
                    ),
                    0,
                    0.85,
                )
                .room(0.12, 0.7)
                .done(0.3),
        'tap-bom': () =>
            new Bus()
                .add(kick({ f0: 180, f1: 65, pt: 0.02, tau: 0.05, click: 0.4 }), 0, 0.6)
                .add(brass([69, 76], 0.05, 0.08, 2400), 0, 0.5)
                .room(0.2, 0.9)
                .done(0.55),
        'tap-perfeito': () =>
            new Bus()
                .add(kick({ f0: 235, f1: 52, pt: 0.022, tau: 0.09, click: 0.8 }), 0, 0.95)
                .add(sub(60, 50, 0.14), 0, 0.6)
                .add(clap(), 0, 0.8)
                .add(env(svf(noise(0.15, 4), 1800, 0.9, 'bp'), 0.0005, 0.04), 0, 0.35) // corpo de caixa
                .add(brass([69, 76, 81, 83], 0.09, 0.14, 4200), 0.004, 0.75)
                .add(sparkle(0.06, 13, 8000), 0.01, 0.2, -0.5)
                .add(sparkle(0.06, 14, 8000), 0.015, 0.2, 0.5)
                .room(0.3, 1.1)
                .done(0.85),
        'golpe-n1': () =>
            new Bus()
                .add(kick({ f0: 210, f1: 48, pt: 0.025, tau: 0.1, click: 0.6 }), 0, 0.95)
                .add(sat(sub(90, 45, 0.15, 0.6), 1.6), 0, 0.6)
                .add(clap(), 0, 0.55)
                .add(brass([69, 76], 0.06, 0.1, 3000), 0.004, 0.45)
                .room(0.22, 1)
                .done(0.58),
        'golpe-n2': () =>
            new Bus()
                .add(kick({ f0: 225, f1: 44, pt: 0.03, tau: 0.14, click: 0.7 }), 0, 1)
                .add(sat(sub(85, 40, 0.3, 1), 1.8), 0, 0.65)
                .add(clap(), 0, 0.6)
                .add(env(svf(noise(1, 25), 6000), 0.002, 0.25), 0, 0.12, 0.3) // prato macio (sem chiado)
                .add(brass([69, 76, 81], 0.08, 0.1, 3600), 0.004, 0.55)
                .add(brass([71, 78, 83], 0.14, 0.16, 4200), 0.3, 0.6)
                .add(clap(), 0.3, 0.4, 0.2)
                .room(0.3, 1.1)
                .done(1.05),
        'golpe-n3': () => {
            const b = new Bus()
                .add(kick({ f0: 250, f1: 38, pt: 0.04, tau: 0.22, click: 0.9, drive: 2.4 }), 0, 1)
                .add(sat(sub(100, 35, 0.55, 1.8), 2), 0, 0.7)
                .add(
                    env(
                        svf(noise(1.4, 26), (t) => 300 + 2600 * Math.exp(-t / 0.15)),
                        0.001,
                        0.3,
                    ),
                    0,
                    0.5,
                ) // explosão
                .add(env(svf(noise(1.4, 27), 6000), 0.002, 0.4), 0, 0.12, -0.3);
            // a torcida batendo o clap junto (4 palmas espalhadas) e o SOC-CER-MON (3-3-2 a 128 BPM) nos metais subindo
            [
                [0, -0.5],
                [0.011, 0.4],
                [0.019, -0.2],
                [0.027, 0.6],
            ].forEach(([t, p], i) => void b.add(clap(6000 + i * 300), t, 0.4, p));
            const s16 = 60 / 128 / 4;
            b.add(brass([69, 76, 81], 0.12, 0.08, 3600), 0.004, 0.55)
                .add(brass([71, 78, 83], 0.12, 0.08, 4000), 3 * s16, 0.6)
                .add(clap(), 3 * s16, 0.35, 0.2)
                .add(brass([76, 83, 88, 91], 0.45, 0.28, 4600), 6 * s16, 0.7)
                .add(kick({ f0: 180, f1: 55, pt: 0.02, tau: 0.08, click: 0.5 }), 6 * s16, 0.6)
                .add(clap(), 6 * s16, 0.45, -0.2)
                .add(whistle(0.32), 6 * s16 + 0.25, 0.1, 0.2);
            shimmer(b, 6 * s16, 0.6, [100, 105], 10, 0.05, 51);
            return b.room(0.35, 1.3).done(1.8);
        },
    },
};

/** O pacote antigo (0.9.27), com a mesma mistura que o jogo fazia, em estéreo pra ouvir junto. */
const mono2 = (y: Mono): Stereo => [y, Float32Array.from(y)];
const oldMix = (layers: unknown, peak: number) => mono2(old.mixMax(layers, build, clapRaw, peak, SR));
const atual: Pack = {
    id: 'atual',
    nome: 'Antigo (0.9.27)',
    ideia: 'O que estava no jogo: sinos e moeda do ZzFX com o clap 808, sem grave nem sala (a referência do "fino").',
    sons: {
        'tap-perfeito': () => oldMix(old.MAX_TAP[2], MAX_PEAK.tap),
        'tap-bom': () => oldMix(old.MAX_TAP[1], MAX_PEAK.tap),
        'tap-fora': () => oldMix(old.MAX_TAP[0], MAX_PEAK.tap),
        'golpe-n1': () => oldMix(old.MAX_MOVE[1], MAX_PEAK.move),
        'golpe-n2': () => oldMix(old.MAX_MOVE[2], MAX_PEAK.move),
        'golpe-n3': () => oldMix(old.MAX_MOVE[3], MAX_PEAK.move),
    },
};

/** Soco de corpo (150 a 400 Hz): o "pá" que o alto-falante do celular toca, onde o grave do 808 some. */
const punch = (f: number, tau: number) =>
    sat(
        env(
            osc(tau * 5, (t) => f * (0.7 + 0.3 * Math.exp(-t / 0.015)), 'tri', 7),
            0.0005,
            tau,
        ),
        2.2,
    );
/** O "tchak" do osu! (ruído em faixa, 6 ms). */
const tchak = (seed: number, f = 3200) => env(svf(noise(0.04, seed), f, 1.5, 'bp'), 0.0003, 0.006);
const mistura: Pack = {
    id: 'd-mistura',
    nome: 'D · Mistura (vai pro jogo)',
    ideia: 'Os três juntos, cada um na sua faixa: o soco do C (808, clap e um "pá" de 150 a 400 Hz pro celular) no corpo, os sinos do B no meio e as moedas do A brilhando em cima. N3: explosão do C + harpa do B + jackpot de moedas do A.',
    sons: {
        'tap-fora': () =>
            new Bus()
                .add(punch(170, 0.035), 0, 0.5)
                .add(env(svf(noise(0.05, 61), 900), 0.001, 0.01), 0, 0.2)
                .room(0.1, 0.7)
                .done(0.3),
        'tap-bom': () =>
            new Bus()
                .add(kick({ f0: 180, f1: 65, pt: 0.02, tau: 0.05, click: 0.4 }), 0, 0.55)
                .add(punch(220, 0.04), 0, 0.3)
                .add(bell(88, 0.2), 0, 0.36, -0.2)
                .add(coin(93, 98, 0.08), 0.03, 0.3, 0.3)
                .room(0.22, 0.9)
                .done(0.6),
        'tap-perfeito': () => {
            // corpo (C): bumbo, 808, clap e o "pá"; meio (B): 5 sinos em 22 ms; cima (A): moedas e brilho
            const b = new Bus()
                .add(kick({ f0: 235, f1: 52, pt: 0.022, tau: 0.09, click: 0.8 }), 0, 0.9)
                .add(sat(sub(70, 50, 0.13, 0.6), 1.6), 0, 0.5)
                .add(punch(260, 0.05), 0, 0.45)
                .add(clap(), 0, 0.75)
                .add(tchak(62), 0, 0.6)
                .add(sparkle(0.05, 63, 8000), 0, 0.2, -0.5)
                .add(sparkle(0.05, 64, 8000), 0.004, 0.2, 0.5);
            [81, 88, 93, 95, 100].forEach(
                (m, i) => void b.add(bell(m, 0.2 + i * 0.03), i * 0.022, 0.33, -0.6 + i * 0.3),
            );
            [
                [100, 105, 0.03, -0.45],
                [105, 107, 0.075, 0.45],
            ].forEach(([a, z, t, p]) => void b.add(coin(a, z, 0.09), t, 0.27, p));
            shimmer(b, 0.12, 0.3, [105, 107, 112], 7, 0.06, 65);
            return b.room(0.3, 1.1).done(0.9);
        },
        'golpe-n1': () =>
            new Bus()
                .add(kick({ f0: 210, f1: 48, pt: 0.025, tau: 0.1, click: 0.6 }), 0, 0.9)
                .add(sat(sub(90, 45, 0.15, 0.6), 1.6), 0, 0.5)
                .add(punch(230, 0.05), 0, 0.4)
                .add(clap(), 0, 0.55)
                .add(brass([69, 76, 81], 0.06, 0.1, 3400), 0.004, 0.5)
                .room(0.22, 1)
                .done(0.58),
        'golpe-n2': () => {
            const b = new Bus()
                .add(kick({ f0: 225, f1: 44, pt: 0.03, tau: 0.14, click: 0.7 }), 0, 1)
                .add(sat(sub(85, 40, 0.3, 1), 1.8), 0, 0.6)
                .add(punch(240, 0.06), 0, 0.45)
                .add(clap(), 0, 0.6)
                .add(env(svf(noise(1, 66), 6000), 0.002, 0.22), 0, 0.1, 0.3)
                .add(brass([69, 76, 81], 0.07, 0.1, 3400), 0.004, 0.4);
            [81, 83, 86, 88, 93, 95, 100].forEach(
                (m, i) => void b.add(coin(m, m + 5, 0.07 + i * 0.012), 0.03 + i * 0.034, 0.3, i % 2 ? 0.5 : -0.5),
            );
            b.add(sparkle(0.08, 67), 0.06, 0.18, -0.6).add(sparkle(0.08, 68), 0.08, 0.18, 0.6);
            return b.room(0.3, 1.1).done(1.05);
        },
        'golpe-n3': () => {
            const b = new Bus()
                .add(kick({ f0: 250, f1: 38, pt: 0.04, tau: 0.22, click: 0.9, drive: 2.4 }), 0, 1)
                .add(sat(sub(100, 35, 0.5, 1.6), 2), 0, 0.6)
                .add(punch(250, 0.08), 0, 0.5)
                .add(
                    env(
                        svf(noise(1.4, 69), (t) => 300 + 2600 * Math.exp(-t / 0.15)),
                        0.001,
                        0.3,
                    ),
                    0,
                    0.45,
                ); // explosão (C)
            [
                [0, -0.5],
                [0.011, 0.4],
                [0.019, -0.2],
                [0.027, 0.6],
            ].forEach(([t, p], i) => void b.add(clap(6000 + i * 300), t, 0.35, p));
            // a harpa do B subindo (A4 a A7) e, no topo, o jackpot do A: 3 moedas, acorde macio e pó de estrela
            PENTA.forEach(
                (m, i) => void b.add(bell(m, 0.16 + i * 0.01, 1.2), 0.03 + i * 0.036, 0.2, Math.sin(i * 0.9) * 0.75),
            );
            const t = 0.52;
            for (const [m, p] of [
                [93, -0.4],
                [100, 0.4],
                [105, 0],
            ])
                b.add(coin(m - 5, m, 0.35), t, 0.26, p);
            for (const m of [57, 64, 69, 71])
                b.add(env(svf(osc(1.3, hz(m), 'sq', 15), 1500), 0.01, 0.35, 0.1), t, 0.1, m === 64 ? -0.4 : 0.3);
            b.add(kick({ f0: 160, f1: 60, pt: 0.02, tau: 0.06, click: 0.3 }), t, 0.45).add(punch(300, 0.04), t, 0.3);
            shimmer(b, t, 0.8, [100, 105, 107], 14, 0.06, 70);
            return b.room(0.38, 1.35).done(1.8);
        },
    },
};

/**
 * Sons a mais do pacote D (golpe universal, 30/10/2026; só vão pro jogo, sem comparar com os outros pacotes): a bicuda
 * do goleiro capitão (o couro estalando no bumbo, o "fuuu" da bola indo embora e moedas subindo) e a entrada da cena do
 * especial N3 (o "tchiiing" de sinos com o vento subindo; o golpe N3 cai no fim da cena, ~0,8 s depois).
 */
type Extra = 'bicuda' | 'especial';
const EXTRAS: Record<Extra, { som: () => Stereo; alvo: number; max: number }> = {
    bicuda: {
        alvo: -9,
        max: 0.95,
        som: () => {
            const b = new Bus()
                .add(kick({ f0: 200, f1: 42, pt: 0.03, tau: 0.12, click: 1, drive: 2.2 }), 0, 1)
                .add(sat(sub(80, 42, 0.22, 0.8), 1.8), 0, 0.55)
                .add(punch(200, 0.06), 0, 0.5)
                .add(clap(), 0, 0.5)
                .add(tchak(71, 2200), 0, 0.8)
                .add(brass([64, 71, 76], 0.05, 0.09, 3000), 0.004, 0.35);
            // a bola indo embora: ruído em faixa subindo, da esquerda pra direita
            const whoosh = (seed: number) =>
                env(
                    svf(noise(0.45, seed), (t) => 500 + 5000 * (t / 0.45) ** 1.5, 2.2, 'bp'),
                    0.12,
                    0.08,
                    0.15,
                );
            b.add(whoosh(72), 0.02, 0.32, -0.5).add(whoosh(73), 0.07, 0.28, 0.5);
            [
                [88, 93, 0.06, -0.4],
                [93, 98, 0.1, 0.1],
                [98, 105, 0.14, 0.5],
            ].forEach(([a, z, t, p]) => void b.add(coin(a, z, 0.08), t, 0.24, p));
            return b.room(0.24, 1).done(0.95);
        },
    },
    especial: {
        alvo: -11,
        max: 0.85,
        som: () => {
            // o clarão: sinos agudos juntos e o brilho; depois o vento subindo até o chute (sem bumbo: o N3 traz o dele)
            const b = new Bus();
            [93, 100, 105, 112].forEach((m, i) => void b.add(bell(m, 0.3, 2.2), i * 0.008, 0.3, -0.45 + i * 0.3));
            b.add(sparkle(0.12, 74, 7000), 0, 0.35, -0.4).add(sparkle(0.12, 75, 7000), 0.01, 0.35, 0.4);
            const riser = (seed: number) =>
                env(
                    svf(noise(0.8, seed), (t) => 300 + 6500 * (t / 0.8) ** 2, 3, 'bp'),
                    0.62,
                    0.05,
                    0.08,
                );
            b.add(riser(76), 0.05, 0.55, -0.35).add(riser(77), 0.05, 0.55, 0.35);
            // grave subindo junto (o "uuuum" de carga), saturado pro celular ouvir
            b.add(
                sat(
                    env(
                        osc(0.8, (t) => 45 + 70 * (t / 0.8) ** 2, 'tri', 9),
                        0.5,
                        0.05,
                        0.2,
                    ),
                    1.6,
                ),
                0.05,
                0.35,
            );
            shimmer(b, 0.1, 0.6, [100, 105, 107, 112], 10, 0.05, 78);
            return b.room(0.3, 1.2).done(0.9);
        },
    },
};

// ---------- volume e números ----------
/** Volume momentâneo: o RMS (mono) da janela de 100 ms mais alta, em dBFS. */
function momentary([L, R]: Stereo) {
    const w = N(0.1);
    const hop = N(0.01);
    let best = 0;
    for (let s = 0; s < L.length; s += hop) {
        let e = 0;
        for (let i = s; i < Math.min(s + w, L.length); i++) e += ((L[i] + R[i]) / 2) ** 2;
        best = Math.max(best, e / w);
    }
    return 10 * Math.log10(best + 1e-12);
}
const peakOf = ([L, R]: Stereo) => L.reduce((m, v, i) => Math.max(m, Math.abs(v), Math.abs(R[i])), 0);
/** Escada de volume (dBFS momentâneo), igual pros 3 pacotes; o pico fica no `MAX_PEAK` com limitador macio (tanh). */
const TARGET: Record<Sound, number> = {
    'tap-fora': -21,
    'tap-bom': -13.5,
    'tap-perfeito': -8.5,
    'golpe-n1': -10.5,
    'golpe-n2': -8,
    'golpe-n3': -6,
};
function level(s: Stereo, snd: Sound): Stereo {
    const cap = snd.startsWith('tap') ? MAX_PEAK.tap : MAX_PEAK.move;
    const g = 10 ** ((TARGET[snd] - momentary(s)) / 20);
    return s.map((c) => c.map((v) => cap * Math.tanh((v * g) / cap))) as Stereo;
}
function fft(re: Float64Array, im: Float64Array) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const a = (-2 * Math.PI) / len;
        for (let i = 0; i < n; i += len)
            for (let k = 0; k < len / 2; k++) {
                const [c, s] = [Math.cos(a * k), Math.sin(a * k)];
                const [xr, xi] = [re[i + k + len / 2], im[i + k + len / 2]];
                const [tr, ti] = [xr * c - xi * s, xr * s + xi * c];
                re[i + k + len / 2] = re[i + k] - tr;
                im[i + k + len / 2] = im[i + k] - ti;
                re[i + k] += tr;
                im[i + k] += ti;
            }
    }
}
/** Centroide espectral (Hz) da energia somada em janelas de 2048 (Hann), de `t0` a `t1` s. */
function centroid([L, R]: Stereo, t0 = 0, t1 = 99) {
    const W = 2048;
    let [num, den] = [0, 0];
    for (let s = N(t0); s < Math.min(L.length, N(t1)); s += W / 2) {
        const re = new Float64Array(W);
        const im = new Float64Array(W);
        for (let i = 0; i < W; i++)
            re[i] = (((L[s + i] ?? 0) + (R[s + i] ?? 0)) / 2) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / W));
        fft(re, im);
        for (let k = 1; k < W / 2; k++) {
            const p = re[k] ** 2 + im[k] ** 2;
            num += ((k * SR) / W) * p;
            den += p;
        }
    }
    return num / (den || 1);
}
function stats(s: Stereo) {
    const pk = peakOf(s);
    const m = s[0].map((v, i) => Math.max(Math.abs(v), Math.abs(s[1][i])));
    const on = m.findIndex((v) => v > pk * 0.01);
    const half = m.findIndex((v) => v >= pk * 0.5);
    let e = 0;
    for (let i = 0; i < s[0].length; i++) e += ((s[0][i] + s[1][i]) / 2) ** 2;
    return {
        dur: +(s[0].length / SR).toFixed(2),
        pico: +pk.toFixed(3),
        rms: +(10 * Math.log10(e / s[0].length + 1e-12)).toFixed(1),
        mom: +momentary(s).toFixed(1),
        ataqueMs: +(((half - on) / SR) * 1000).toFixed(1),
        centroHz: Math.round(centroid(s)),
        centro50Hz: Math.round(centroid(s, 0, 0.05)),
        // a camada de prêmio (o que o alto-falante do celular toca): volume momentâneo acima de 1 kHz
        agudoDb: +momentary(
            s.map((c) => svf(svf(c, 1000, Math.SQRT1_2, 'hp'), 1000, Math.SQRT1_2, 'hp')) as Stereo,
        ).toFixed(1),
    };
}

function wav(file: string, [L, R]: Stereo) {
    const n = L.length;
    const b = Buffer.alloc(44 + n * 4);
    b.write('RIFF', 0);
    b.writeUInt32LE(36 + n * 4, 4);
    b.write('WAVEfmt ', 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(2, 22);
    b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(SR * 4, 28);
    b.writeUInt16LE(4, 32);
    b.writeUInt16LE(16, 34);
    b.write('data', 36);
    b.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) {
        b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
        b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
    }
    writeFileSync(join(out, file), b);
}

// ---------- a sequência com a música da partida ----------
// partida-1t, trecho nivel2 (128 BPM, Lá dórico), do 5º compasso: no fundo no meio do 2º compasso, o perfeito no 1 do
// 3º (o jogo agenda o perfeito na batida), a virada da troca de tela até o 1 seguinte e o N3 300 ms depois do toque
const meta = JSON.parse(readFileSync('public/music/partida-1t.json', 'utf8'));
const sec = meta.secoes.find((s: { nome: string }) => s.nome === 'nivel2');
const pulse = 60 / sec.bpm;
const bar = 4 * pulse;
const SEQ = 6;
const raw = spawnSync(
    'ffmpeg',
    [
        '-v',
        'error',
        '-ss',
        String(sec.inicio + 4 * bar - bar),
        '-t',
        String(SEQ),
        '-i',
        'public/music/partida-1t.webm',
    ].concat(['-f', 'f32le', '-ac', '2', '-ar', String(SR), '-']),
    { maxBuffer: 1 << 28 },
).stdout;
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
const music: Stereo = [0, 1].map((k) =>
    Float32Array.from({ length: pcm.length >> 1 }, (_, i) => pcm[2 * i + k]),
) as Stereo;
const cueAt = 1.4 * bar;
const ringAt = 2 * bar;
const fillAt = Math.ceil((ringAt - 0.03 + 0.1) / pulse) * pulse;
const openAt = 3 * bar;
const DUCK = { hz: 650, gain: 0.5, tau: 0.08 };
const [fl, fr] = mixVirada(
    { beats: Math.round((openAt - fillAt) / pulse), pulse, swing: (0.06 * pulse) / 4, crash: true, clap: clapRaw },
    build,
    SR,
);
/** A música no fundo como no `duckMusic` (passa-baixa a 650 Hz e metade do volume) e abrindo no 1 depois da virada. */
const ducked = music.map((c, k) => {
    const cut = (t: number) => {
        if (t < cueAt) return SR / 2;
        const d = DUCK.hz + (SR / 2 - DUCK.hz) * Math.exp(-(t - cueAt) / DUCK.tau);
        return t < openAt ? d : SR / 2 + (d - SR / 2) * Math.exp(-(t - openAt) / 0.01);
    };
    const g = (t: number) => {
        if (t < cueAt) return 1;
        const d = DUCK.gain + (1 - DUCK.gain) * Math.exp(-(t - cueAt) / DUCK.tau);
        return t < openAt ? d : 1 + (d - 1) * Math.exp(-(t - openAt) / 0.01);
    };
    const y = svf(c, cut);
    const f = k ? fr : fl;
    const i0 = N(fillAt);
    return y.map((v, i) => (v * g(i / SR) + (f[i - i0] ?? 0)) * 0.6 * 0.4);
}) as Stereo;
const SFX_LVL = GAIN.sfx * 0.6;
function sequence(tap: Stereo, n3: Stereo): Stereo {
    const o = ducked.map((c) => Float32Array.from(c)) as Stereo;
    for (const [s, at] of [
        [tap, ringAt],
        [n3, ringAt + 0.3],
    ] as const)
        for (let k = 0; k < 2; k++)
            for (let i = 0; i < s[k].length && N(at) + i < o[k].length; i++) o[k][N(at) + i] += s[k][i] * SFX_LVL;
    return o;
}

// ---------- render ----------
const SOUNDS: Sound[] = ['tap-perfeito', 'tap-bom', 'tap-fora', 'golpe-n1', 'golpe-n2', 'golpe-n3'];
const MAX_LEN: Record<Sound, number> = {
    'tap-perfeito': 0.9,
    'tap-bom': 0.9,
    'tap-fora': 0.9,
    'golpe-n1': 0.6,
    'golpe-n2': 1.2,
    'golpe-n3': 1.8,
};
const numbers: Record<string, Record<string, ReturnType<typeof stats>>> = {};
const seqs: [string, Stereo][] = [];
for (const p of [atual, moedas, cristal, estadio, mistura]) {
    mkdirSync(join(out, p.id), { recursive: true });
    numbers[p.id] = {};
    const got = {} as Record<Sound, Stereo>;
    for (const snd of SOUNDS) {
        let s = p.sons[snd]();
        if (p !== atual) s = level(s, snd);
        if (s[0].length > N(MAX_LEN[snd]) && p !== atual) console.warn(`${p.id}/${snd}: passou de ${MAX_LEN[snd]} s`);
        got[snd] = s;
        numbers[p.id][snd] = stats(s);
        // pra ouvir: no nível do jogo (efeitos × 0,6 do geral), todos levados juntos pra cima (× 3, como o antigo golpe-sons.ts)
        wav(join(p.id, `${snd}.wav`), s.map((c) => c.map((v) => v * SFX_LVL * 3)) as Stereo);
        if (p === mistura && process.argv.includes('--jogo')) {
            // pro jogo: no nível do jogo (o `playMax` multiplica pelo volume de efeitos), mp3 de 112 kbps
            wav(`${snd}-jogo.wav`, s);
            mkdirSync('public/sfx', { recursive: true });
            spawnSync('ffmpeg', [
                '-v',
                'error',
                '-y',
                '-i',
                join(out, `${snd}-jogo.wav`),
                '-b:a',
                '112k',
                `public/sfx/max-${snd}.mp3`,
            ]);
        }
    }
    seqs.push([p.id, sequence(got['tap-perfeito'], got['golpe-n3'])]);
}
if (process.argv.includes('--jogo'))
    for (const [snd, x] of Object.entries(EXTRAS)) {
        const raw = x.som();
        const g = 10 ** ((x.alvo - momentary(raw)) / 20);
        const s = raw.map((c) => c.map((v) => MAX_PEAK.move * Math.tanh((v * g) / MAX_PEAK.move))) as Stereo;
        if (s[0].length > N(x.max)) console.warn(`${snd}: passou de ${x.max} s`);
        console.log(snd, stats(s));
        wav(`${snd}-jogo.wav`, s);
        spawnSync('ffmpeg', [
            '-v',
            'error',
            '-y',
            '-i',
            join(out, `${snd}-jogo.wav`),
            '-b:a',
            '112k',
            `public/sfx/max-${snd}.mp3`,
        ]);
    }
// as sequências com o mesmo ganho (a mais alta no pico 0,9): a diferença de volume entre pacotes fica
const seqPk = Math.max(...seqs.map(([, s]) => peakOf(s)));
for (const [id, s] of seqs) wav(join(id, 'sequencia.wav'), s.map((c) => c.map((v) => (v * 0.9) / seqPk)) as Stereo);
writeFileSync(join(out, 'numeros.json'), JSON.stringify(numbers, null, 1));
console.table(
    Object.entries(numbers).flatMap(([id, r]) => Object.entries(r).map(([snd, v]) => ({ pacote: id, som: snd, ...v }))),
);

// ---------- página de escuta ----------
const LABEL: Record<Sound | 'sequencia', string> = {
    'tap-perfeito': 'Toque perfeito',
    'tap-bom': 'Toque bom',
    'tap-fora': 'Toque fora',
    'golpe-n1': 'Golpe N1',
    'golpe-n2': 'Golpe N2',
    'golpe-n3': 'Golpe N3',
    sequencia: 'Sequência na partida',
};
const row = (p: Pack) => `<section>
<h2>${p.nome}</h2><p>${p.ideia}</p>
<div class="btns">${[...SOUNDS, 'sequencia']
    .map(
        (s) =>
            `<button data-src="${p.id}/${s}.wav"${s === 'sequencia' ? ' class="seq"' : ''}>${LABEL[s as Sound]}</button>`,
    )
    .join('')}</div>
<details><summary>números</summary><table><tr><th>som</th><th>duração</th><th>pico</th><th>volume (100 ms)</th><th>ataque</th><th>brilho</th></tr>${SOUNDS.map(
    (s) => {
        const v = numbers[p.id][s];
        return `<tr><td>${LABEL[s]}</td><td>${v.dur} s</td><td>${v.pico}</td><td>${v.mom} dB</td><td>${v.ataqueMs} ms</td><td>${v.centroHz} Hz</td></tr>`;
    },
).join('')}</table></details></section>`;
writeFileSync(
    join(out, 'index.html'),
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Golpe máximo: sons</title>
<style>
body{font:16px/1.45 system-ui,sans-serif;background:#14162b;color:#e8eaf6;margin:0 auto;max-width:900px;padding:16px}
h1{font-size:1.4rem}h2{font-size:1.1rem;margin:0 0 4px}p{margin:0 0 10px;color:#b9bedf}
section{background:#1d2040;border-radius:10px;padding:14px;margin:14px 0}
.btns{display:flex;flex-wrap:wrap;gap:8px}
button{font:inherit;background:#2c3170;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;transition:background .2s}
button:hover{background:#3d44a0}button.on{background:#ffd447;color:#14162b}button.seq{background:#5a2c70}
table{border-collapse:collapse;margin-top:8px;font-size:.85rem}td,th{padding:3px 8px;text-align:left;border-bottom:1px solid #2c3170}
</style>
<h1>Golpe máximo: 3 pacotes de som</h1>
<p>Ouça de fone. Cada linha é um pacote; a de cima é o que está no ar. A sequência põe o toque perfeito no 1 do compasso da música da partida e o golpe N3 logo depois. Volume: o mesmo ganho em todos.</p>
${[atual, moedas, cristal, estadio, mistura].map(row).join('\n')}
<script>
let cur=null;
document.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  if(cur){cur.a.pause();cur.b.classList.remove('on')}
  const a=new Audio(b.dataset.src);a.play();b.classList.add('on');a.onended=()=>b.classList.remove('on');cur={a,b};
});
</script></html>`,
);
console.log(`ok: ${out}`);
