// Sequenciador das músicas do Soccermon, em cima do ZZFX.buildSamples (o mesmo motor dos efeitos do jogo).
// Notas em qualquer tempo (swing), duração de verdade, eco e reverb por faixa, volume que muda no tempo (camadas),
// loop sem costura e WAV estéreo. Guia: .claude/skills/soccermon-musica/SKILL.md
import { readFileSync, writeFileSync } from 'node:fs';

// o ZZFX cria um AudioContext ao ser importado: no Node basta um dublê
globalThis.AudioContext ??= class {};
const { ZZFX } = await import('zzfx');
export const SR = ZZFX.sampleRate;

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

/** "C#5" → 73 */
export function midi(s) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) throw new Error(`nota inválida: ${s}`);
    return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
export const hz = (m) => 440 * 2 ** ((m - 69) / 12);
export const noteName = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const QUAL = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    7: [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    m9: [0, 3, 7, 10, 14],
    9: [0, 4, 7, 10, 14],
    '7b9': [0, 4, 7, 10, 13],
    sus4: [0, 5, 7],
    '7sus4': [0, 5, 7, 10],
    add9: [0, 4, 7, 14],
    dim: [0, 3, 6],
    m7b5: [0, 3, 6, 10],
    6: [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
};
/** "Am7" → { root: 9 (classe de nota), tones: [0, 3, 7, 10] } */
export function chord(sym) {
    const m = /^([A-G][#b]?)(.*)$/.exec(sym);
    const tones = m && QUAL[m[2]];
    if (!tones) throw new Error(`acorde: ${sym}`);
    return { root: midi(`${m[1]}3`) % 12, tones };
}
/** Sobe ou desce o acorde `n` semitons: "Dm7", 2 → "Em7". */
export function transpose(sym, n) {
    const m = /^([A-G][#b]?)(.*)$/.exec(sym);
    return NAMES[(chord(m[1]).root + n + 120) % 12] + m[2];
}

/** Parâmetros do ZzFX por nome (o resto fica no padrão do ZzFX). */
export function ins(o) {
    const k = ['vol', 'rand', 'freq', 'a', 's', 'r', 'shape', 'curve', 'slide', 'dslide', 'pj', 'pjt', 'rep', 'noise'];
    const k2 = ['mod', 'crush', 'delay', 'sv', 'd', 'trem', 'filter'];
    return [...k, ...k2].map((n) => o[n] ?? null);
}

/** Gerador fixo: a mesma peça sai igual toda vez. */
function rng(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

/** Filtro passa-faixa (biquad RBJ). */
function bandpass(x, f0, q) {
    const w = (2 * Math.PI * f0) / SR;
    const al = Math.sin(w) / (2 * q);
    const [b0, b2, a0, a1, a2] = [al, -al, 1 + al, -2 * Math.cos(w), 1 - al];
    const y = new Float32Array(x.length);
    let [x1, x2, y1, y2] = [0, 0, 0, 0];
    for (let i = 0; i < x.length; i++) {
        y[i] = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0;
        [x2, x1, y2, y1] = [x1, x[i], y1, y[i]];
    }
    return y;
}

/**
 * Palma de verdade (rodada 6): cada pessoa é ruído em duas faixas (corpo ~1,1 kHz e estalo ~2,5 kHz) com 3 batidas
 * rápidas (as palmas das mãos não se encontram de uma vez) e um rabo curto de sala. `gente` pessoas, cada uma um
 * pouco fora do tempo (`espalha` segundos) e com a mão de outro tamanho (faixa ±25%). Instrumento de bateria: `pitch`
 * sobe ou desce a faixa (palma pesada = grave).
 */
function palmas({ gente, espalha, rabo = 0.045 }) {
    const cache = new Map();
    return (pitch = 0) => {
        if (cache.has(pitch)) return cache.get(pitch);
        const r = rng(4242 + gente);
        const len = Math.round((espalha + 0.03 + rabo * 6) * SR);
        const out = new Float32Array(len);
        for (let g = 0; g < gente; g++) {
            const off = Math.round(r() * espalha * SR);
            const f = 2 ** (pitch / 12) * (0.8 + r() * 0.45);
            const n = new Float32Array(len - off);
            for (let i = 0; i < n.length; i++) n[i] = r() * 2 - 1;
            const body = bandpass(n, 1100 * f, 1.1);
            const snap = bandpass(n, 2500 * f, 1.6);
            const ga = 0.7 + r() * 0.3;
            const hits = [0, 0.008 + r() * 0.003, 0.017 + r() * 0.004];
            for (let i = 0; i < n.length; i++) {
                const t = i / SR;
                let env = Math.min(1, t / 0.0004);
                env *=
                    hits.reduce((a, h, k) => a + (t >= h ? (1 - 0.15 * k) * Math.exp(-(t - h) / 0.0028) : 0), 0) +
                    (t >= 0.026 ? Math.exp(-(t - 0.026) / rabo) * 0.85 : 0);
                out[off + i] += (body[i] + 0.55 * snap[i]) * env * ga;
            }
        }
        let pk = 1e-9;
        for (const v of out) pk = Math.max(pk, Math.abs(v));
        for (let i = 0; i < len; i++) out[i] *= 0.55 / pk;
        cache.set(pitch, out);
        return out;
    };
}

/**
 * Amostra gravada (WAV 16 bit mono, 44,1 kHz, em `scripts/musica/amostras/`), normalizada no pico 0,55 como as
 * palmas. Instrumento de bateria: `pitch` em semitons reamostra (grave = mais lento, como no sampler).
 */
function amostra(arquivo) {
    const b = readFileSync(new URL(`./amostras/${arquivo}`, import.meta.url));
    const d = b.indexOf('data') + 8;
    const x = Float32Array.from({ length: (b.length - d) >> 1 }, (_, i) => b.readInt16LE(d + 2 * i));
    const pk = x.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
    for (let i = 0; i < x.length; i++) x[i] *= 0.55 / pk;
    const cache = new Map();
    return (pitch = 0) => {
        if (!cache.has(pitch)) {
            const r = 2 ** (pitch / 12);
            const y = new Float32Array(Math.floor((x.length - 1) / r));
            for (let i = 0; i < y.length; i++) {
                const p = i * r;
                const j = Math.floor(p);
                y[i] = x[j] + (x[j + 1] - x[j]) * (p - j);
            }
            cache.set(pitch, y);
        }
        return cache.get(pitch);
    };
}

/** Paleta. Melódicos: a frequência vem da nota. Bateria: frequência fixa (`pitch` em semitons ajusta). */
export const I = {
    lead: ins({ vol: 0.42, a: 0.006, r: 0.08, shape: 5, curve: 0.5, sv: 0.65, d: 0.06 }), // quadrada
    pulse: ins({ vol: 0.34, a: 0.005, r: 0.08, shape: 5, curve: 0.25, sv: 0.6, d: 0.05 }), // pulso 25% (NES)
    thin: ins({ vol: 0.3, a: 0.004, r: 0.06, shape: 5, curve: 0.125, sv: 0.5, d: 0.04 }), // pulso 12,5%
    counter: ins({ vol: 0.5, a: 0.012, r: 0.15, shape: 1, sv: 0.8, d: 0.05 }), // triangular
    bass: ins({ vol: 0.6, a: 0.003, r: 0.05, shape: 2, sv: 0.7, d: 0.06, filter: -700 }),
    slap: ins({ vol: 0.65, a: 0.002, r: 0.04, shape: 2, sv: 0.35, d: 0.09, filter: -1500 }),
    stab: ins({ vol: 0.2, a: 0.003, r: 0.06, shape: 2, sv: 0.25, d: 0.07, filter: -2600 }),
    chank: ins({ vol: 0.16, a: 0.001, r: 0.03, shape: 5, curve: 0.3, sv: 0.15, d: 0.04, filter: 900 }), // guitarra abafada
    clav: ins({ vol: 0.22, a: 0.001, r: 0.04, shape: 5, curve: 0.15, sv: 0.3, d: 0.06, filter: -3000 }),
    arp: ins({ vol: 0.11, a: 0.002, r: 0.04, shape: 5, curve: 0.25, sv: 0.4, d: 0.03 }),
    pad: ins({ vol: 0.13, a: 0.25, r: 0.6, shape: 2, sv: 1, filter: -1300, rep: 0.22, trem: 0.15 }),
    strings: ins({ vol: 0.12, a: 0.06, r: 0.25, shape: 2, sv: 0.9, d: 0.1, filter: -2200, rep: 0.17, trem: 0.08 }),
    brass: ins({ vol: 0.38, a: 0.03, r: 0.12, shape: 2, curve: 0.8, sv: 0.8, d: 0.08, filter: -3200 }),
    tuba: ins({ vol: 0.7, a: 0.01, r: 0.08, shape: 1, sv: 0.7, d: 0.08 }),
    piccolo: ins({ vol: 0.3, a: 0.01, r: 0.06, shape: 1, sv: 0.8, d: 0.04 }),
    pizz: ins({ vol: 0.4, a: 0.002, r: 0.08, shape: 1, sv: 0.15, d: 0.08 }),
    bassoon: ins({ vol: 0.45, a: 0.01, r: 0.05, shape: 2, sv: 0.6, d: 0.05, filter: -900 }),
    bell: ins({ vol: 0.22, a: 0.001, r: 0.6, shape: 0, sv: 0.25, d: 0.08 }),
    epiano: ins({ vol: 0.3, a: 0.004, r: 0.3, shape: 1, sv: 0.45, d: 0.2, rep: 0.2, trem: 0.12 }),
    organ: ins({ vol: 0.16, a: 0.004, r: 0.04, shape: 5, curve: 0.5, sv: 0.9, d: 0.02, filter: -1800 }),
    anvil: ins({ vol: 0.2, freq: 1900, a: 0.001, r: 0.22, shape: 5, curve: 0.5, sv: 0.2, d: 0.02, filter: 900 }), // bigorna (tocar com pitch 0 e +6)
    coin: ins({ vol: 0.35, freq: 1675, s: 0.06, r: 0.24, shape: 1, curve: 1.82, pj: 837, pjt: 0.06 }), // moeda (ZzFX clássico)
    agogo: ins({ vol: 0.2, freq: 1040, a: 0.001, r: 0.14, shape: 5, curve: 0.5, sv: 0.25, d: 0.02, filter: 600 }),
    block: ins({ vol: 0.3, freq: 1500, a: 0.001, r: 0.05, shape: 0, sv: 0.1, d: 0.01 }), // bloco de madeira, tique
    whistle: ins({ vol: 0.25, freq: 700, a: 0.01, s: 0.12, r: 0.05, shape: 0, slide: 6 }), // apito de êmbolo subindo
    whistleDown: ins({ vol: 0.25, freq: 1400, a: 0.01, s: 0.12, r: 0.05, shape: 0, slide: -6 }),
    // bateria (bumbo, caixa e chimbal vêm do exemplo "depp" do ZzFXM, MIT)
    kick: [1.6, 0, 170, 0.003, null, 0.008, null, 0.97, -35, 53, null, null, null, null, null, 0.1],
    snare: [0.45, 0, 86, null, null, null, null, 0.7, null, null, null, 0.5, null, 6.7, 1, 0.05],
    clap: palmas({ gente: 3, espalha: 0.012 }), // palma de verdade (3 pessoas juntas)
    palmas: palmas({ gente: 9, espalha: 0.03, rabo: 0.07 }), // a torcida batendo palma (resposta do gancho)
    clap808: amostra('clap-808.wav'), // o clap clássico de bateria eletrônica (rodada 7): Roland TR-08 (o 808), CC0
    hat: [0.3, 0, 2200, null, null, 0.04, 3, 2, null, null, 800, 0.02, null, 4.8, null, 0.01, 0.1],
    ohat: [0.22, 0, 2200, null, null, 0.22, 3, 2, null, null, 800, 0.02, null, 4.8, null, 0.01, 0.1],
    shaker: [0.12, 0, 3000, 0.008, null, 0.03, 3, 2, null, null, 800, 0.02, null, 6, null, 0.01],
    sleigh: [0.1, 0, 5200, 0.002, null, 0.06, 3, 2, null, null, 1200, 0.01, null, 7, null, 0.01, 0.03],
    crash: [0.32, 0, 2600, null, 0.05, 1.3, 3, 2, null, null, 800, 0.02, null, 8, null, 0.01, 0.1],
    tom: [0.6, 0, 120, 0.002, 0.02, 0.25, 0, 1, -0.3],
    timp: [1, 0, 82, 0.004, 0.05, 0.6, 0, 1, -0.08],
};

const cache = new Map();
function samples(params, dur) {
    const p = [...params];
    const release = p[5] ?? 0.1;
    // segura a nota pela duração pedida (bateria tem duração própria)
    if (dur != null) p[4] = Math.max(0, dur - (p[3] || 0) - (p[18] || 0) - release * 0.3);
    p[1] = 0; // sem desafinar
    const key = p.join(',');
    let b = cache.get(key);
    if (!b) {
        b = ZZFX.buildSamples(...p.map((x) => (x === null ? undefined : x)));
        cache.set(key, b);
    }
    return b;
}

/** Reverb de Schroeder (4 pentes + 2 passa-tudo), mono → estéreo levemente diferente. */
function reverb(x, right) {
    const combs = [1557, 1617, 1491, 1422].map((d) => d + (right ? 23 : 0));
    const y = new Float32Array(x.length);
    for (const d of combs) {
        const buf = new Float32Array(d);
        let p = 0;
        for (let i = 0; i < x.length; i++) {
            const o = buf[p];
            buf[p] = x[i] + o * 0.8;
            p = (p + 1) % d;
            y[i] += o / 4;
        }
    }
    for (const d of [225, 556]) {
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
}

export class Song {
    /**
     * @param {object} o
     * @param {number} o.bpm semínimas por minuto
     * @param {number} o.bars compassos
     * @param {number} [o.barLen] linhas (16 avos) por compasso: 16 = 4/4, 12 = 3/4 ou 6/8, 8 = 2/4
     * @param {number} [o.swing] atraso das semicolcheias ímpares (0 a 0,33)
     * @param {number} [o.tail] segundos depois do fim (eco, reverb)
     * @param {number | null} [o.loopFrom] compasso onde o loop recomeça: o rabo dobra pra lá, sem costura
     * @param {((seg: number) => number) | null} [o.masterAt] volume geral no tempo (crescendo da peça inteira)
     * @param {((bar: number) => number) | null} [o.bpmAt] andamento por compasso (acelerar); sem ele, `bpm` fixo
     * @param {16 | 8} [o.swingUnit] 16 = balança as semicolcheias (funk, samba); 8 = as colcheias (jazz, shuffle)
     * @param {{ nome: string, de: number, loop: boolean, intensidade?: number }[] | null} [o.secoes] trechos do arquivo
     *   (compasso de início; vai até o próximo). Cada `loop` dobra o próprio rabo no seu começo (loop sem costura);
     *   o trecho sem loop no meio é cortado no fim (introdução, virada), o último guarda o rabo. Sem `secoes`, sai do
     *   `loopFrom`: nulo = um trecho só; 0 = um loop; n = introdução + loop. O mapa (segundos, BPM) fica em `mapa`.
     */
    constructor({
        bpm,
        bars,
        barLen = 16,
        swing = 0,
        tail = 3,
        loopFrom = null,
        seed = 7,
        masterAt = null,
        bpmAt = null,
        swingUnit = 16,
        secoes = null,
    }) {
        Object.assign(this, { bpm, bars, barLen, swing, loopFrom, masterAt, bpmAt, swingUnit });
        this.row = 60 / bpm / 4;
        if (bpmAt) {
            // início de cada compasso em segundos (o andamento muda na virada do compasso)
            this.starts = [0];
            for (let b = 0; b < bars + 1; b++) this.starts.push(this.starts[b] + (barLen * 60) / bpmAt(b) / 4);
        }
        this.parts = [];
        this.rnd = rng(seed);
        const auto =
            loopFrom == null
                ? [{ nome: 'tudo', de: 0, loop: false }]
                : loopFrom === 0
                  ? [{ nome: 'loop', de: 0, loop: true }]
                  : [
                        { nome: 'intro', de: 0, loop: false },
                        { nome: 'loop', de: loopFrom, loop: true },
                    ];
        this.secoes = (secoes ?? auto).map((x, i, a) => {
            const ate = a[i + 1]?.de ?? bars;
            const t0 = this.timeOfBar(x.de);
            const t1 = this.timeOfBar(ate);
            return { ...x, ate, t0, t1, len: Math.ceil((t1 - t0 + tail) * SR) };
        });
        this.secOfBar = (b) => {
            let k = 0;
            while (k + 1 < this.secoes.length && this.secoes[k + 1].de <= b) k++;
            return k;
        };
    }
    get barSec() {
        return this.barLen * this.row;
    }
    /** duração de uma linha no compasso `b` */
    rowAt(b) {
        return this.bpmAt ? 60 / this.bpmAt(b) / 4 : this.row;
    }
    timeOfBar(b) {
        return this.bpmAt ? this.starts[b] : b * this.barSec;
    }
    /** compasso (fracionário) tocando no segundo `sec` */
    barAt(sec) {
        if (!this.bpmAt) return sec / this.barSec;
        let b = 0;
        while (b < this.bars && this.starts[b + 1] <= sec) b++;
        return b + (sec - this.starts[b]) / (this.starts[b + 1] - this.starts[b]);
    }
    /** segundos até a linha `t` (com swing nas semicolcheias ímpares, ou nas colcheias do contratempo) */
    sec(t) {
        const late = Number.isInteger(t) && (this.swingUnit === 8 ? t % 4 === 2 : t % 2 === 1);
        const sw = late ? this.swing * (this.swingUnit === 8 ? 2 : 1) : 0;
        if (!this.bpmAt) return (t + sw) * this.row;
        const b = Math.floor(t / this.barLen);
        return this.starts[b] + (t - b * this.barLen + sw) * this.rowAt(b);
    }
    /**
     * Uma faixa. `gainAt(seg)` muda o volume no tempo (camadas); `echo` = { rows, fb, mix }; `rev` = envio do reverb.
     */
    part(name, inst, { pan = 0, gain = 1, echo = null, rev = 0, drum = false, gainAt = null } = {}) {
        const bufs = this.secoes.map((x) => new Float32Array(x.len));
        const p = { name, inst, pan, gain, echo, rev, drum, gainAt, bufs, song: this };
        p.note = (t, m, len = 1, vel = 1) => {
            let s;
            if (typeof inst === 'function')
                s = inst(m); // amostra pronta (palmas)
            else {
                const params = [...inst];
                if (!drum) params[2] = hz(m);
                else if (m) params[2] = inst[2] * 2 ** (m / 12); // na bateria, m = semitons de ajuste
                s = samples(params, drum ? null : len * this.rowAt(Math.floor(t / this.barLen)));
            }
            // a nota é do trecho em que começa (o rabo dela vai junto: dobra no loop ou é cortado)
            const k = this.secOfBar(Math.floor(t / this.barLen));
            const buf = bufs[k];
            const at = Math.round((this.sec(t) - this.secoes[k].t0) * SR);
            const v = vel * (0.95 + this.rnd() * 0.08);
            for (let i = 0; i < s.length && at + i < buf.length; i++) buf[at + i] += s[i] * v;
        };
        this.parts.push(p);
        return p;
    }
    render({ rms = false } = {}) {
        if (rms)
            for (const p of this.parts) {
                let e = 0;
                let n = 0;
                let pk = 0;
                for (const b of p.bufs)
                    for (let i = 0; i < b.length; i += 4) {
                        e += b[i] * b[i];
                        n++;
                        pk = Math.max(pk, Math.abs(b[i]));
                    }
                const r = (p.gain * Math.sqrt(e / n)).toFixed(3);
                console.log('  ', p.name.padEnd(12), 'rms', r, 'pico', (p.gain * pk).toFixed(2));
            }
        const outs = this.secoes.map((_, k) => this.renderSecao(k));
        const total = outs.reduce((a, o) => a + o[0].length, 0);
        const L = new Float32Array(total);
        const R = new Float32Array(total);
        let at = 0;
        this.mapa = this.secoes.map((x, k) => {
            L.set(outs[k][0], at);
            R.set(outs[k][1], at);
            const fim = at + Math.round((x.t1 - x.t0) * SR);
            const m = { nome: x.nome, de: x.de, ate: x.ate, loop: x.loop, inicio: at, fim };
            if (x.intensidade != null) m.intensidade = x.intensidade;
            m.bpm = Math.round((this.bpmAt ? this.bpmAt(x.de) : this.bpm) * 100) / 100;
            at += outs[k][0].length;
            return m;
        });
        return [L, R];
    }
    /** Mistura um trecho (eco, pan, camadas, reverb, volume geral) e fecha: loop dobra o rabo, meio corta, fim guarda. */
    renderSecao(k) {
        const x = this.secoes[k];
        const n = x.len;
        const L = new Float32Array(n);
        const R = new Float32Array(n);
        const send = new Float32Array(n);
        for (const p of this.parts) {
            let b = p.bufs[k];
            if (p.echo) {
                const d = Math.round(p.echo.rows * this.row * SR);
                const wet = new Float32Array(b.length);
                for (let i = d; i < b.length; i++) wet[i] = b[i - d] + p.echo.fb * wet[i - d];
                const out = new Float32Array(b.length);
                for (let i = 0; i < b.length; i++) out[i] = b[i] + p.echo.mix * wet[i];
                b = out;
            }
            const gl = p.gain * Math.cos(((p.pan + 1) * Math.PI) / 4) * Math.SQRT2;
            const gr = p.gain * Math.sin(((p.pan + 1) * Math.PI) / 4) * Math.SQRT2;
            for (let i = 0; i < b.length; i++) {
                const g = p.gainAt ? p.gainAt(x.t0 + i / SR) : 1;
                L[i] += b[i] * gl * g;
                R[i] += b[i] * gr * g;
                if (p.rev) send[i] += b[i] * p.gain * g * p.rev;
            }
        }
        if (this.parts.some((p) => p.rev)) {
            const rl = reverb(send, false);
            const rr = reverb(send, true);
            for (let i = 0; i < n; i++) {
                L[i] += rl[i];
                R[i] += rr[i];
            }
        }
        if (this.masterAt)
            for (let i = 0; i < n; i++) {
                const g = this.masterAt(x.t0 + i / SR);
                L[i] *= g;
                R[i] *= g;
            }
        const end = Math.round((x.t1 - x.t0) * SR);
        if (x.loop) return this.fold(L, R, end);
        if (k === this.secoes.length - 1) return [L, R];
        // trecho do meio sem loop (introdução, virada): corta no fim, com 5 ms de saída pra não estalar
        const out = [L.slice(0, end), R.slice(0, end)];
        const f = Math.round(0.005 * SR);
        for (let i = 0; i < f; i++) for (const c of out) c[end - 1 - i] *= i / f;
        return out;
    }
    /** Loop sem costura: corta no fim do trecho e soma o rabo (eco, reverb, notas soando) no começo dele. */
    fold(L, R, end) {
        const out = [L.slice(0, end), R.slice(0, end)];
        for (let i = end; i < L.length; i++) {
            const j = (i - end) % end;
            out[0][j] += L[i];
            out[1][j] += R[i];
        }
        return out;
    }
}

const ACC = { '!': 1.2, '~': 0.6 };
/**
 * Melodia: um texto por compasso, "E5:2 r:2 C5+E5:4"; `!` acentua, `~` mais baixo. Confere a soma do compasso.
 * `shift` transpõe (modulação); `harm` troca cada nota (segunda voz, ver `thirdBelow`).
 */
export function mel(part, bar0, bars, { vel = 1, shift = 0, harm = null } = {}) {
    const { barLen } = part.song;
    bars.forEach((str, k) => {
        let t = (bar0 + k) * barLen;
        let sum = 0;
        for (const tok of str.trim().split(/\s+/)) {
            const m = /^([^:]+):(\d+(?:\.\d+)?)([!~]?)$/.exec(tok);
            if (!m) throw new Error(`token: ${tok}`);
            const len = Number(m[2]);
            const v = vel * (ACC[m[3]] ?? 1);
            if (m[1] !== 'r')
                for (const n of m[1].split('+')) {
                    const mm = midi(n) + shift;
                    part.note(t, harm ? harm(mm) : mm, len, v);
                }
            t += len;
            sum += len;
        }
        if (sum !== barLen) throw new Error(`${part.name}, compasso ${bar0 + k}: ${sum} != ${barLen} em "${str}"`);
    });
}

const HIT = { X: 1.15, x: 0.85, o: 0.35 };
/** Bateria: "X" forte, "x" normal, "o" fantasma, "." nada. Um caractere por linha do compasso. */
export function drum(part, bar0, nbars, pat, { vel = 1, pitch = 0 } = {}) {
    const { barLen } = part.song;
    const p = pat.replace(/\s/g, '');
    if (p.length !== barLen) throw new Error(`${part.name}: padrão com ${p.length} linhas, o compasso tem ${barLen}`);
    for (let b = 0; b < nbars; b++)
        for (let i = 0; i < p.length; i++) {
            const v = HIT[p[i]];
            if (v) part.note((bar0 + b) * barLen + i, pitch, 0, v * vel);
        }
}

export const MAJOR = (tonic) => [0, 2, 4, 5, 7, 9, 11].map((x) => (x + tonic) % 12);
export const MINOR = (tonic) => [0, 2, 3, 5, 7, 8, 10].map((x) => (x + tonic) % 12);
/** Terça diatônica abaixo (segunda voz). `scale` = classes de nota da tonalidade. */
export const thirdBelow = (scale) => (m) => {
    const pc = ((m % 12) + 12) % 12;
    const i = scale.indexOf(pc);
    if (i < 0) return m - 3;
    let d = pc - scale[(i + 5) % 7];
    if (d <= 0) d += 12;
    return m - d;
};

/**
 * O gancho do Soccermon (leitmotiv, rodada 4): 3 notas em 3-3-2 como grito de torcida, desce uma terça e salta uma
 * sexta ("Soc-cer-MON!"), G5 E5 C6 em Dó; as palmas respondem "hey hey" nas linhas 12 e 14.
 * `em({ grau, tom, oitava, menor, ritmo })`: `grau` sobe pela escala (sequência), `tom` transpõe em semitons,
 * `menor` usa a escala menor. Devolve um compasso no formato do `mel`.
 */
export const GANCHO = {
    palmas: '............x.x.',
    bar: 'G5:3 E5:3 C6:6 r:4',
    em({ grau = 0, tom = 0, oitava = 0, menor = false, ritmo = [3, 3, 6, 4] } = {}) {
        const scale = MAJOR(0);
        const notes = [79, 76, 84].map((m) => {
            const i = scale.indexOf(m % 12) + grau;
            let n = Math.floor(m / 12) * 12 + scale[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
            if (menor && [4, 9, 11].includes(n % 12)) n -= 1;
            return n + tom + 12 * oitava;
        });
        const toks = notes.map((n, k) => `${noteName(n)}:${ritmo[k]}`);
        if (ritmo[3]) toks.push(`r:${ritmo[3]}`);
        return toks.join(' ');
    },
};

/** Notas do acorde a partir de `low` (midi), de baixo pra cima. */
export function voicing(sym, low = 57, n = 4) {
    const c = chord(sym);
    const pcs = c.tones.map((x) => (c.root + x) % 12);
    const out = [];
    for (let m = low; out.length < n; m++) if (pcs.includes(m % 12)) out.push(m);
    return out;
}

/** Baixo por compasso: "0:3 8:1 5:2 s:2" (0 tônica, 3 terça, 5 quinta, 8 oitava, s sétima ou sexta, l quinta abaixo). */
export function bass(P, bar, sym, pat, { vel = 1, oct = 0 } = {}) {
    const c = chord(sym);
    const root = 33 + ((c.root - 9 + 12) % 12) + oct;
    const sev = c.tones.includes(10) ? 10 : c.tones.includes(11) ? 11 : 9;
    const off = { 0: 0, 5: 7, 8: 12, 3: c.tones[1], s: sev, 4: 5, 2: 2, l: -5, 7: c.tones[1] + 12, c: -1 };
    let t = bar * P.song.barLen;
    let sum = 0;
    for (const tok of pat.trim().split(/\s+/)) {
        const m = /^([^:]+):(\d+)([!~]?)$/.exec(tok);
        if (!m || (m[1] !== 'r' && off[m[1]] == null)) throw new Error(`baixo: ${tok}`);
        const len = Number(m[2]);
        if (m[1] !== 'r') P.note(t, root + off[m[1]], len, vel * (ACC[m[3]] ?? 1));
        t += len;
        sum += len;
    }
    if (sum !== P.song.barLen) throw new Error(`baixo ${sym}: ${sum} != ${P.song.barLen}`);
}
/** Acordes curtos nas linhas dadas: [linha] ou [linha, duração]. */
export function stabs(P, bar, sym, rows, { low = 57, len = 1, vel = 1, n = 4 } = {}) {
    const v = voicing(sym, low, n);
    for (const x of rows) {
        const [r, l = len] = Array.isArray(x) ? x : [x];
        for (const m of v) P.note(bar * P.song.barLen + r, m, l, vel);
    }
}
/** Arpejo subindo pelas notas do acorde. */
export function arp(P, bar, sym, { low = 60, step = 1, vel = 1, rows = P.song.barLen, pattern = null } = {}) {
    const v = voicing(sym, low, 4);
    const up = pattern ? pattern.map((i) => v[i % 4] + 12 * Math.floor(i / 4)) : [...v, v[0] + 12];
    for (let i = 0; i < rows; i += step)
        P.note(bar * P.song.barLen + i, up[(i / step) % up.length], step, vel * (i % 4 ? 0.7 : 1));
}
export function padChord(P, bar, sym, len, { low = 52, vel = 1, at = 0, n = 3 } = {}) {
    for (const m of voicing(sym, low, n)) P.note(bar * P.song.barLen + at, m, len, vel);
}

/** Envelope de camada: volume 0 até o compasso `from`, sobe em meio compasso, some no `to`. */
export const layer =
    (song, from, to = Number.POSITIVE_INFINITY) =>
    (t) => {
        const x = song.barAt(t);
        if (x < from || x >= to) return 0;
        return Math.min(1, (x - from) * 2);
    };

/** WAV 16 bits estéreo, normalizado com saturação leve só nos picos. */
export function writeWav(path, [L, R]) {
    const n = L.length;
    let raw = 1e-9;
    for (let i = 0; i < n; i++) raw = Math.max(raw, Math.abs(L[i]), Math.abs(R[i]));
    const soft = (x) => Math.tanh((x / raw) * 1.2) / Math.tanh(1.2);
    const buf = Buffer.alloc(44 + n * 4);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + n * 4, 4);
    buf.write('WAVEfmt ', 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 4, 28);
    buf.writeUInt16LE(4, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(n * 4, 40);
    const s = (v) => Math.max(-32768, Math.min(32767, Math.round(soft(v) * 0.93 * 32767)));
    for (let i = 0; i < n; i++) {
        buf.writeInt16LE(s(L[i]), 44 + i * 4);
        buf.writeInt16LE(s(R[i]), 46 + i * 4);
    }
    writeFileSync(path, buf);
}
