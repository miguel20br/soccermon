// Ginásio vazio (categoria livre, peça conceito): a música feita com os sons da quadra. Um moleque sozinho no ginásio
// à noite: a bola cai e quica até parar, ele pega e dribla, imagina a torcida, faz o gol do título e o zelador apaga
// a luz. Ré dórico, 104 BPM. Os instrumentos são a quadra: a BOLA quicando é o baixo (afinada nas notas), o CHUTE é o
// bumbo, o TÊNIS rangendo no piso é o chimbal, a REDE é a caixa, o APITO do juiz responde o ASSOVIO do moleque
// (pergunta e resposta), a TORCIDA imaginária é o pad e a SIRENE DO PLACAR são os metais.
// Forma: intro (4): a luz acende, a bola quica até parar, o tênis, o drible | jogo (25, loop): A (8) assovio × apito,
// SOC-CER-MON com palmas | B (8) a torcida imaginária e o placar | A' (8) meio tom acima, o gol | virada (1): Lá7 |
// fim (3): o SOC-CER-MON baixinho, a luz apaga banco por banco, a bola rola embora.
// Exporta os sons da quadra (as outras peças livres usam): bola, quique, tenis, rede, chute, apito, torcida, luz,
// desliga, trave, luva, barriga, ronco, zap, bzzt, deslize, ASSOVIO, PLACAR.
import { bass, drum, GANCHO, hz, I, ins, mel, midi, padChord, Song, SR, stabs, transpose } from '../synth.mjs';

export const meta = { titulo: 'Ginásio vazio', tela: 'Categoria livre (créditos, menu, trailer)' };

// ---------- sons da quadra, feitos à mão (amostra por amostra; cada um em cache por altura) ----------
const TAU = Math.PI * 2;
const rng = (seed) => {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
};
const lp = (x, f) => {
    const a = 1 - Math.exp((-TAU * f) / SR);
    const y = new Float32Array(x.length);
    let v = 0;
    for (let i = 0; i < x.length; i++) {
        v += a * (x[i] - v);
        y[i] = v;
    }
    return y;
};
/** `seg` segundos; `faz(p, r)` devolve a função por amostra `(t) => valor` (com estado: fase, filtro). */
const som = (seg, faz, { pk = 0.55, corte = 0 } = {}) => {
    const cache = new Map();
    return (p = 0) => {
        if (!cache.has(p)) {
            const f = faz(p, rng(4243));
            let y = new Float32Array(Math.round(seg * SR));
            for (let i = 0; i < y.length; i++) y[i] = f(i / SR);
            if (corte) y = lp(lp(y, corte), corte);
            let m = 1e-9;
            for (const v of y) m = Math.max(m, Math.abs(v));
            for (let i = 0; i < y.length; i++) y[i] *= pk / m;
            cache.set(p, y);
        }
        return cache.get(p);
    };
};
const k12 = (p) => 2 ** (p / 12);

/** A bola quicando no piso de madeira, afinada na nota (instrumento melódico: baixo). Baque que cai de altura,
 * "poc" do couro e o anel oco da bola. */
export const bola = som(
    0.4,
    (m, r) => {
        const f0 = hz(m);
        let ph = 0;
        let v = 0;
        let w = 0;
        return (t) => {
            ph += (TAU * f0 * (1 + 0.9 * Math.exp(-t / 0.012))) / SR;
            const n = r() * 2 - 1;
            v += 0.22 * (n - v);
            w += 0.05 * (v - w);
            const poc = (v - w) * Math.exp(-t / 0.008);
            const anel = Math.sin(TAU * f0 * 4 * t) * Math.exp(-t / 0.04);
            return Math.sin(ph) * Math.min(1, t / 0.0015) * Math.exp(-t / 0.11) + 0.5 * poc + 0.12 * anel;
        };
    },
    { corte: 6000 },
);
/** A mesma bola como bateria (Lá grave; `pitch` em semitons). */
export const quique = (p = 0) => bola(45 + p);
/** O tênis rangendo no piso: um "chirp" agudo com o tranco do solado (vira o chimbal). */
export const tenis = som(
    0.13,
    (p) => {
        let ph = 0;
        const b = 1800 * k12(p);
        return (t) => {
            ph += (TAU * b * (1 + (0.3 * t) / 0.13) * (1 + 0.04 * Math.sin(TAU * 70 * t))) / SR;
            const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.045);
            return (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * env * (0.55 + 0.45 * Math.sin(TAU * 95 * t));
        };
    },
    { pk: 0.4, corte: 5000 },
);
/** A rede balançando: ruído que entra macio e escurece (vira a caixa). */
export const rede = som(
    0.45,
    (p, r) => {
        let v = 0;
        let w = 0;
        return (t) => {
            const fc = (1200 + 4800 * Math.exp(-t / 0.08)) * k12(p);
            v += (1 - Math.exp((-TAU * fc) / SR)) * (r() * 2 - 1 - v);
            w += 0.058 * (v - w);
            return (v - w) * Math.min(1, t / 0.025) * Math.exp(-t / 0.11) * (0.8 + 0.2 * Math.sin(TAU * 31 * t));
        };
    },
    { pk: 0.5 },
);
/** O pé na bola: "toc" grave (vira o bumbo). */
export const chute = som(0.16, (p, r) => {
    let ph = 0;
    let v = 0;
    return (t) => {
        ph += (TAU * (60 + 90 * Math.exp(-t / 0.012)) * k12(p)) / SR;
        v += 0.3 * (r() * 2 - 1 - v);
        return Math.sin(ph) * Math.exp(-t / 0.05) + 0.6 * v * Math.exp(-t / 0.004);
    };
});
/** Apito de juiz (com a bolinha dentro: o trinado). `dur` em segundos; `pitch` 0 = Mi7 (midi 100). */
export const apito = (dur = 0.35) =>
    som(
        dur + 0.06,
        (p, r) => {
            let ph = 0;
            let v = 0;
            const b = hz(100) * k12(p);
            return (t) => {
                const bolinha = Math.sin(TAU * 31 * t);
                ph += (TAU * b * (1 + 0.025 * bolinha)) / SR;
                v += 0.2 * (r() * 2 - 1 - v);
                const env = Math.min(1, t / 0.015) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.05));
                return (Math.sin(ph) * (0.7 + 0.3 * bolinha) + 0.08 * v) * env;
            };
        },
        { pk: 0.45, corte: 7000 },
    );
/** A torcida: ruído de muita gente (faixa de voz), sobe em `sobe` s, dura `dur` s e some nos últimos `cai` s. */
export const torcida = (dur = 3, sobe = 0.8, cai = dur * 0.4) =>
    som(
        dur,
        (p, r) => {
            let a = 0;
            let b = 0;
            const c1 = 1 - Math.exp((-TAU * 1400 * k12(p)) / SR);
            const c2 = 1 - Math.exp((-TAU * 280 * k12(p)) / SR);
            return (t) => {
                a += c1 * (r() * 2 - 1 - a);
                b += c2 * (a - b);
                const env = Math.min(1, t / sobe) * Math.min(1, (dur - t) / cai);
                return (a - b) * env * (0.85 + 0.15 * Math.sin(TAU * 0.7 * t));
            };
        },
        { pk: 0.4 },
    );
/** Um banco de luz do ginásio acendendo: "TUNK" do relé e o zumbido que esquenta. O zumbido é afinado: `pitch` 0 =
 * Lá2 (com 3 = Dó, 7 = Mi, 10 = Sol: os bancos acendem um acorde). */
export const luz = som(
    2.2,
    (p, r) => {
        let ph = 0;
        const h = 110 * k12(p);
        return (t) => {
            ph += (TAU * (52 + 40 * Math.exp(-t / 0.02))) / SR;
            const tunk = Math.sin(ph) * Math.exp(-t / 0.07);
            const u = t - 0.08;
            const zum =
                u < 0
                    ? 0
                    : (Math.sin(TAU * h * u) + 0.45 * Math.sin(TAU * 2 * h * u) + 0.2 * Math.sin(TAU * 3 * h * u)) *
                      Math.min(1, u / 0.5) *
                      Math.exp(-u / 0.9) *
                      0.35;
            return tunk + zum + (r() * 2 - 1) * Math.exp(-t / 0.002) * 0.5;
        };
    },
    { pk: 0.5, corte: 4000 },
);
/** O banco de luz apagando: "TUNK" e o zumbido morrendo pra baixo. */
export const desliga = som(
    1.3,
    (p, r) => {
        let ph = 0;
        let ph2 = 0;
        const h = 110 * k12(p);
        return (t) => {
            ph += (TAU * (48 + 30 * Math.exp(-t / 0.02))) / SR;
            ph2 += (TAU * h * (1 - 0.35 * Math.min(1, t / 0.8))) / SR;
            const zum = (Math.sin(ph2) + 0.4 * Math.sin(2 * ph2)) * Math.exp(-t / 0.3) * 0.3;
            return Math.sin(ph) * Math.exp(-t / 0.06) + zum + (r() * 2 - 1) * Math.exp(-t / 0.002) * 0.5;
        };
    },
    { pk: 0.5, corte: 3500 },
);
/** A bola na trave: "dong" redondo (parciais de tubo), sem o áspero do metal. */
export const trave = som(
    2,
    (p) => {
        const b = 290 * k12(p);
        return (t) =>
            (Math.sin(TAU * b * t) * Math.exp(-t / 0.9) +
                0.5 * Math.sin(TAU * b * 2.76 * t) * Math.exp(-t / 0.35) +
                0.25 * Math.sin(TAU * b * 5.4 * t) * Math.exp(-t / 0.12)) *
            Math.min(1, t / 0.002);
    },
    { pk: 0.5, corte: 3500 },
);
/** A luva do goleiro espalmando: baque e o tapa do couro. */
export const luva = som(0.25, (p, r) => {
    let ph = 0;
    let v = 0;
    return (t) => {
        ph += (TAU * (55 + 70 * Math.exp(-t / 0.01)) * k12(p)) / SR;
        v += 0.25 * (r() * 2 - 1 - v);
        return Math.sin(ph) * Math.exp(-t / 0.06) + 0.9 * v * Math.exp(-t / 0.02);
    };
});
/** A barriga do Snorlax: "BOING" grave que sobe e balança. */
export const barriga = som(0.75, (p) => {
    let ph = 0;
    return (t) => {
        const f =
            k12(p) * (65 + 150 * (1 - Math.exp(-t / 0.12))) * (1 + 0.12 * Math.exp(-t / 0.25) * Math.sin(TAU * 11 * t));
        ph += (TAU * f) / SR;
        return (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.min(1, t / 0.004) * Math.exp(-t / 0.25);
    };
});
/** Ronco: puxa o ar com o chocalho grave e solta num "fuuu". */
export const ronco = som(
    2.3,
    (p, r) => {
        let ph = 0;
        let v = 0;
        let w = 0;
        return (t) => {
            const n = r() * 2 - 1;
            if (t < 1.1) {
                ph += (TAU * 42 * k12(p)) / SR;
                const serra = ((ph / TAU) % 1) * 2 - 1;
                v += 0.04 * (serra * (0.6 + 0.4 * n) - v);
                return v * Math.sin((Math.PI * t) / 1.1) * 3;
            }
            w += 0.08 * (n - w);
            return w * Math.sin(Math.PI * Math.min(1, (t - 1.1) / 1.15)) * 1.4;
        };
    },
    { pk: 0.5 },
);
/** Choque elétrico: "piu" que despenca com estalos (assinatura do Lt. Surge). */
export const zap = som(
    0.3,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            ph += (TAU * k12(p) * (140 + 1400 * Math.exp(-t / 0.04))) / SR;
            const tri = 1 - 4 * Math.abs(Math.round(ph / TAU) - ph / TAU);
            const estalo = r() < 0.05 * Math.exp(-t / 0.08) ? r() * 2 - 1 : 0;
            v += 0.35 * (estalo - v);
            return tri * Math.exp(-t / 0.09) + 3 * v;
        };
    },
    { pk: 0.5, corte: 6000 },
);
/** Zumbido de erro (interruptor errado). */
export const bzzt = som(
    0.45,
    (p) => {
        let ph = 0;
        return (t) => {
            ph += (TAU * 98 * k12(p)) / SR;
            const q = Math.sin(ph) > 0 ? 1 : -1;
            const env = Math.min(1, t / 0.005) * (t < 0.38 ? 1 : Math.max(0, 1 - (t - 0.38) / 0.07));
            return q * (0.6 + 0.4 * Math.sin(TAU * 50 * t)) * env;
        };
    },
    { pk: 0.35, corte: 1400 },
);
/** Deslize de `f0` a `f1` Hz em `dur` s (a força caindo ou voltando). */
export const deslize = (f0, f1, dur) =>
    som(
        dur + 0.05,
        () => {
            let ph = 0;
            return (t) => {
                ph += (TAU * f0 * (f1 / f0) ** Math.min(1, t / dur)) / SR;
                const env = Math.min(1, t / 0.01) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.05));
                return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph)) * env;
            };
        },
        { pk: 0.4, corte: 3000 },
    );
/** Assovio de gente: senoide com um balanço leve. */
export const ASSOVIO = ins({ vol: 0.3, a: 0.035, r: 0.09, shape: 0, sv: 0.85, d: 0.06, rep: 0.17, trem: 0.15 });
/** A sirene do placar: onda quadrada cheia, passa-baixa na faixa (vira naipe de metais). */
export const PLACAR = ins({ vol: 0.16, a: 0.012, r: 0.12, shape: 5, curve: 1, sv: 0.9, d: 0.05 });
/** Notas do apito (Mi7 = 0): `fi(parte, compasso, [[linha, 'D6', vel]])`. */
export const fi = (P, bar, hits) => {
    for (const [r, n, v = 1] of hits) P.note(bar * P.song.barLen + r, midi(n) - 100, 0, v);
};
/** Bola que cai e quica até parar: intervalos encolhem (×0,78) e a força também. */
export const quicaAteParar = (P, row0, { primeiro = 7, n = 11, vel = 1, encolhe = 0.78 } = {}) => {
    let r = row0;
    let d = primeiro;
    for (let i = 0; i < n; i++) {
        P.note(r, i * 0.25, 0, vel * 0.84 ** i);
        r += d;
        d *= encolhe;
    }
};

// ---------- a peça ----------
export default function ginasioVazio() {
    const S = new Song({
        bpm: 104,
        bars: 32,
        swing: 0.1,
        tail: 3,
        secoes: [
            { nome: 'intro', de: 0, loop: false },
            { nome: 'jogo', de: 4, loop: true, intensidade: 1 },
            { nome: 'fim', de: 29, loop: false },
        ],
    });
    const asv = S.part('assovio', ASSOVIO, { pan: -0.15, gain: 1.5, echo: { rows: 3, fb: 0.25, mix: 0.2 }, rev: 0.3 });
    const apC = S.part('apito', apito(0.08), { drum: true, pan: 0.3, gain: 1, rev: 0.25 });
    const apL = S.part('apitoLongo', apito(0.45), { drum: true, pan: 0.3, gain: 0.85, rev: 0.25 });
    const bs = S.part('bola', bola, { gain: 0.9, rev: 0.12 });
    const qq = S.part('quique', quique, { drum: true, pan: -0.2, gain: 0.8, rev: 0.3 });
    const dr = S.part('drible', quique, { drum: true, pan: 0.25, gain: 0.35, rev: 0.1 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.1, gain: 0.7, rev: 0.2 });
    const tn = S.part('tenis', tenis, { drum: true, pan: -0.35, gain: 0.6, rev: 0.25 });
    const pl = S.part('placar', PLACAR, { pan: 0.2, gain: 0.7, corte: 1600, rev: 0.25 });
    const tc = S.part('torcida', torcida(4.4, 1.4), { drum: true, gain: 0.45, rev: 0.3 });
    const tcG = S.part('torcidaGol', torcida(3, 0.15), { drum: true, gain: 0.6, rev: 0.3 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.45 }), {
        drum: true,
        gain: 1.1,
        rev: 0.3,
    });
    const lz = S.part('luz', luz, { drum: true, gain: 0.5, rev: 0.35 });
    const ds = S.part('desliga', desliga, { drum: true, gain: 0.5, rev: 0.35 });
    const pad = S.part('pad', I.pad, { gain: 0.5, rev: 0.4 });

    // intro: uma luz acende, a bola cai e quica até parar; alguém corre (tênis), pega a bola e começa a driblar
    lz.note(0, 5, 0, 1);
    quicaAteParar(qq, 4, { primeiro: 7 });
    drum(tn, 1, 1, '....x.....x..x..', { vel: 0.7 });
    drum(tn, 1, 1, '........x.x..x.x', { pitch: 3, vel: 0.8 });
    drum(qq, 2, 1, 'x...x...x...x...', { vel: 0.8 });
    drum(tn, 2, 1, '..x.......x.....', { vel: 0.6 });
    drum(qq, 3, 1, 'x...x...x.x.x.x.', { vel: 0.9 });
    drum(tn, 3, 1, '......x.......x.', { pitch: 4, vel: 0.6 });
    // o apito de começo de jogo (curto, curto, longo): termina antes do loop, que corta a intro
    fi(apC, 3, [
        [4, 'E7', 0.8],
        [6, 'E7', 0.8],
    ]);
    apL.note(3 * 16 + 8, 0, 0, 0.8);

    const ACH = ['Dm7', 'G7', 'Dm7', 'G7', 'Dm7', 'G7', 'Dm7', 'G7'];
    // o moleque assovia, o juiz responde no apito (afinado)
    const A = [
        'A5:2 C6:2 D6:3 F6:3 E6:2 D6:2 C6:2',
        'B5:6 r:10',
        'F6:2 E6:2 D6:2 C6:2 A5:4 r:2 C6:2',
        'D6:6 r:10',
        'A5:2 C6:2 D6:3 F6:3 A6:4 G6:2',
        'F6:2 E6:2 D6:4 r:8',
        'F6:3 E6:3 D6:2 C6:2 A5:2 C6:4',
        GANCHO.em({ tom: 2, menor: true }),
    ];
    const RESP = {
        1: [
            [6, 'D6'],
            [9, 'B5'],
            [12, 'G5', 'longo'],
        ],
        3: [
            [6, 'F6'],
            [9, 'D6'],
            [12, 'B5', 'longo'],
        ],
        5: [
            [8, 'G6'],
            [10, 'G6'],
            [12, 'D7', 'longo'],
        ],
    };
    const BASS_A = '0:2 r:1 0:1 8:2 r:2 5:2 r:1 s:1 8:2 0:2';
    const grooveA = (b, cheio) => {
        drum(ch, b, 1, cheio ? 'X..x..x...x..x..' : 'X.....x...x.....');
        drum(rd, b, 1, '............x...');
        drum(cl, b, 1, '....x...........', { vel: 0.55 });
        drum(tn, b, 1, '..x.......x.....', { vel: 0.7 });
        drum(tn, b, 1, '.......x......x.', { pitch: 4, vel: 0.55 });
        drum(dr, b, 1, cheio ? '..x...x...x...x.' : '......x.......x.', { pitch: 12 });
    };
    const blocoA = (b0, s, cheio) => {
        mel(asv, b0, A, { shift: s });
        for (const [i, r] of Object.entries(RESP))
            for (const [row, n, longo] of r)
                (longo ? apL : apC).note((b0 + Number(i)) * 16 + row, midi(n) + s - 100, 0, longo ? 0.9 : 1);
        ACH.forEach((c0, i) => {
            const c = transpose(c0, s);
            bass(bs, b0 + i, c, BASS_A);
            grooveA(b0 + i, cheio);
            if (cheio && i % 2 === 1)
                stabs(
                    pl,
                    b0 + i,
                    c,
                    [
                        [0, 3],
                        [6, 2],
                    ],
                    { low: 57, n: 4, vel: 0.8 },
                );
            if (cheio) padChord(pad, b0 + i, c, 16, { low: 57, n: 4, vel: 0.6 });
        });
        drum(cl, b0 + 7, 1, GANCHO.palmas); // "hey hey" das palmas no SOC-CER-MON
    };
    blocoA(4, 0, false);

    // B: a torcida imaginária (pad de gente) e a sirene do placar fazendo os metais
    const BCH = ['Bbmaj7', 'C', 'Am7', 'Dm7', 'Gm7', 'C', 'Bbmaj7', 'A7'];
    const B = [
        'D6:6 C6:2 A5:8',
        'r:2 G5:2 C6:2 E6:2 G6:6 F6:2',
        'E6:6 D6:2 C6:8',
        'r:2 A5:2 D6:2 F6:2 A6:8',
        'Bb6:6 A6:2 G6:4 F6:4',
        'E6:4 G6:4 C7:8',
        'D7:6 C7:2 A6:4 F6:4',
        'E6:4 C#6:4 A5:4 r:4',
    ];
    mel(asv, 12, B);
    BCH.forEach((c, i) => {
        const b = 12 + i;
        bass(bs, b, c, '0:3 0:1 r:2 5:2 0:3 8:1 r:2 s:2');
        drum(ch, b, 1, 'X..x..x...x..x..');
        drum(rd, b, 1, '............x...');
        drum(cl, b, 1, '....x.......x...', { vel: 0.55 });
        drum(tn, b, 1, '..x...x...x...x.', { vel: 0.6 });
        drum(dr, b, 1, 'x.x.x.x.x.x.x.x.', { pitch: 12, vel: 0.7 });
        stabs(
            pl,
            b,
            c,
            i % 2
                ? [
                      [10, 2],
                      [14, 2],
                  ]
                : [[0, 6]],
            { low: 57, n: 4, vel: 0.8 },
        );
        padChord(pad, b, c, 16, { low: 57, n: 4, vel: 0.7 });
        if (i % 2 === 0) tc.note(b * 16, 0, 0, 1);
    });
    // o juiz manda seguir: trinado no fim do B
    fi(apC, 19, [
        [12, 'A6'],
        [13, 'A6'],
        [14, 'A6'],
        [15, 'A6'],
    ]);

    // A' meio tom acima (Mi♭ dórico), tudo junto; o gol no SOC-CER-MON: rede, palmas dobradas e a torcida explode
    blocoA(20, 1, true);
    rd.note(27 * 16 + 11, 0, 0, 1.2);
    tcG.note(27 * 16 + 11, 0, 0, 1);
    drum(cl, 27, 1, '............x.x.', { pitch: -1, vel: 0.7 });

    // virada: Lá7, o drible acelera, apito longo, de volta pro Ré
    bass(bs, 28, 'A7', '0:2 r:2 0:2 r:2 5:2 5:2 8:2 c:2');
    drum(dr, 28, 1, 'x.x.x.x.xxxxXXXX', { pitch: 12 });
    drum(ch, 28, 1, 'X.......X.......');
    drum(tn, 28, 1, '..x...x...x.x.x.', { vel: 0.7 });
    stabs(pl, 28, 'A7', [[0, 6]], { low: 57, n: 4, vel: 0.9 });
    mel(asv, 28, ['E6:4 C#6:4 A5:2 G5:2 E5:4']);
    apL.note(28 * 16 + 12, 0, 0, 0.7);

    // fim: o SOC-CER-MON assoviado baixinho, a luz apaga banco por banco (Fá, Ré, Lá) e a bola rola embora
    mel(asv, 29, ['A5:4 F5:4 D6:8'], { vel: 0.6 });
    padChord(pad, 29, 'Dm7', 16, { low: 57, n: 4, vel: 0.5 });
    bass(bs, 29, 'Dm7', '0:16', { vel: 0.7 });
    ds.note(30 * 16, 8, 0, 1);
    ds.note(30 * 16 + 5, 5, 0, 0.9);
    ds.note(30 * 16 + 10, 0, 0, 0.8);
    quicaAteParar(qq, 31 * 16, { primeiro: 4, n: 9, vel: 0.55, encolhe: 0.8 });
    return S;
}
