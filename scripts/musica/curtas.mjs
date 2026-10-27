// Trilhas pra curtas (22/10/2026). O Miguel amou os curtas feitos com as peças livres, o do Snorlax mais que todos:
// cada som da música é uma piada que se vê. As peças curta-* nascem assim: 30 a 60 s, gancho no 1º segundo, e cada
// evento musical marcado com `ev()` junto da nota, com o que aparece na tela. O render.mjs põe o roteiro no .json
// (`cenas` e `eventos`, em segundos) pro time de vídeo animar em cima.
// Aqui também os sons de assinatura dos curtas (feitos à mão, amostra por amostra, como os da quadra em
// livre-ginasio.mjs). Bateria: `pitch` em semitons. Vozes (`voz`): recebem a nota e a duração, como um instrumento.
import { k12, som } from './pecas/livre-ginasio.mjs';
import { hz, SR } from './synth.mjs';

const TAU = Math.PI * 2;

/** Roteiro do curta: `cena(compasso, nome)` abre uma cena; `ev(compasso, linha, som, ve)` marca um evento. */
export function roteiro(S) {
    S.roteiro = { cenas: [], eventos: [] };
    return {
        cena: (de, nome) => S.roteiro.cenas.push({ de, nome }),
        ev: (compasso, linha, som, ve) => S.roteiro.eventos.push({ compasso, linha, som, ve }),
    };
}

const rng = (seed) => {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
};
/** Passa-faixa (biquad RBJ) por amostra, frequência fixa: formantes de voz. */
const bp = (f, q) => {
    const w = (TAU * f) / SR;
    const al = Math.sin(w) / (2 * q);
    const a0 = 1 + al;
    const [b0, a1, a2] = [al / a0, (-2 * Math.cos(w)) / a0, (1 - al) / a0];
    let [x1, x2, y1, y2] = [0, 0, 0, 0];
    return (x) => {
        const y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2;
        [x2, x1, y2, y1] = [x1, x, y1, y];
        return y;
    };
};
/** Filtro de estado variável (Chamberlin): passa-faixa com o centro mudando a cada amostra (ruído que sobe). */
const svf = (q = 0.5) => {
    let lo = 0;
    let ba = 0;
    return (x, fc) => {
        const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
        lo += f * ba;
        ba += f * (x - lo - q * ba);
        return ba;
    };
};
const envNota = (t, d, a, solta) => Math.min(1, t / a) * (t < d ? 1 : Math.max(0, 1 - (t - d) / solta));

/** Voz feita à mão: `faz(f, dur, r)` devolve `(t) => valor`; soa a duração da nota mais `solta` s. */
const voz = (faz, { solta = 0.12, pk = 0.5 } = {}) => {
    const cache = new Map();
    return (m, dur) => {
        const d = Math.max(0.06, dur || 0.3);
        const key = `${m}:${d.toFixed(4)}`;
        if (!cache.has(key)) {
            const f = faz(hz(m), d, rng(4247));
            const y = new Float32Array(Math.round((d + solta) * SR));
            let mx = 1e-9;
            for (let i = 0; i < y.length; i++) {
                y[i] = f(i / SR);
                mx = Math.max(mx, Math.abs(y[i]));
            }
            for (let i = 0; i < y.length; i++) y[i] *= pk / mx;
            cache.set(key, y);
        }
        return cache.get(key);
    };
};

// ---------- Magikarp ----------
/** O PLOF: o peixe batendo na água e no chão. Afinado (instrumento melódico): o "bloop" sobe até a nota, o tapa do
 * corpo e umas gotas. */
export const splash = som(
    0.5,
    (m, r) => {
        const f0 = hz(m);
        let ph = 0;
        let v = 0;
        const gotas = Array.from({ length: 4 }, () => [0.05 + r() * 0.25, 1500 + r() * 2500]);
        return (t) => {
            ph += (TAU * f0 * (1 - 0.35 * Math.exp(-t / 0.02))) / SR;
            const bloop = Math.sin(ph) * Math.min(1, t / 0.003) * Math.exp(-t / 0.09);
            v += 0.25 * (r() * 2 - 1 - v);
            let g = 0;
            for (const [t0, fg] of gotas)
                if (t > t0) {
                    const u = t - t0;
                    g += Math.sin(TAU * fg * u * (1 + u * 8)) * Math.exp(-u / 0.025) * 0.25;
                }
            return bloop + v * Math.exp(-t / 0.018) * 1.2 + g;
        };
    },
    { pk: 0.5, corte: 7000 },
);
/** A torcida rindo NO TEMPO: `gente` vozes "há-há-há" (`taxa` sílabas por segundo, use o andamento), vogal "a". */
export const risada = (dur = 1.6, taxa = 7, gente = 7) =>
    som(
        dur,
        (p, r) => {
            const vozes = Array.from({ length: gente }, () => ({
                f: (170 + r() * 150) * k12(p),
                atr: r() * 0.05,
                tx: taxa * (0.96 + r() * 0.08),
                ph: r(),
            }));
            const [f1, f2, f3] = [bp(800, 4), bp(1250, 5), bp(2600, 6)];
            return (t) => {
                let src = 0;
                for (const v of vozes) {
                    const u = t - v.atr;
                    if (u < 0) continue;
                    v.ph += (v.f * (1 - 0.25 * Math.min(1, u / dur))) / SR; // a risada desce
                    const s = (u * v.tx) % 1; // posição na sílaba
                    const gate = s < 0.55 ? Math.sin((Math.PI * s) / 0.55) ** 2 : 0;
                    const h = s < 0.12 ? (r() * 2 - 1) * 0.8 : 0; // o "h" do "há"
                    src += ((v.ph % 1) * 2 - 1 + h) * gate;
                }
                const env = Math.min(1, t / 0.03) * Math.min(1, (dur - t) / (dur * 0.45));
                return (f1(src) + 0.6 * f2(src) + 0.2 * f3(src)) * env;
            };
        },
        { pk: 0.45 },
    );
/** O rugido do Gyarados: serra grave com ruído e o ronco da garganta, sobe e cai. */
export const rugido = som(
    1.9,
    (p, r) => {
        let ph = 0;
        let v = 0;
        const [a, b] = [bp(380, 2), bp(950, 3)];
        return (t) => {
            const x = Math.min(1, t / 1.7);
            ph += (62 * k12(p) * (1 + 0.5 * Math.sin(Math.PI * x)) * (1 + 0.04 * Math.sin(TAU * 7 * t))) / SR;
            v += 0.3 * (r() * 2 - 1 - v);
            const src = ((ph % 1) * 2 - 1 + 0.7 * v) * (1 + 0.6 * Math.sin(TAU * 31 * t));
            const env = Math.min(1, t / 0.06) * Math.min(1, (1.9 - t) / 0.7);
            return (a(src) + 0.7 * b(src) + 0.25 * src) * env;
        };
    },
    { pk: 0.55, corte: 2600 },
);
/** Ruído que sobe em `dur` s (a luz da evolução, a força juntando). */
export const sobe = (dur) =>
    som(
        dur + 0.05,
        (p, r) => {
            const fl = svf(0.35);
            return (t) => {
                const x = Math.min(1, t / dur);
                const env = x ** 2 * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.05));
                return fl(r() * 2 - 1, 250 * 24 ** x * k12(p)) * env;
            };
        },
        { pk: 0.4 },
    );

// ---------- Gengar ----------
/** Sumir: "fwip" ao contrário (cresce e corta seco), o som sugado pra dentro. */
export const some = som(
    0.32,
    (p, r) => {
        let ph = 0;
        const fl = svf(0.3);
        return (t) => {
            const x = Math.min(1, t / 0.28);
            const env = t < 0.28 ? x ** 3 : Math.max(0, 1 - (t - 0.28) / 0.012);
            ph += (TAU * 1400 * k12(p) * (1 - 0.75 * x)) / SR;
            return (0.6 * Math.sin(ph) + fl(r() * 2 - 1, 3000 * (1 - 0.8 * x) + 300)) * env;
        };
    },
    { pk: 0.45 },
);
/** Aparecer: "bwoop" subindo, com um estalinho. */
export const aparece = som(
    0.45,
    (p, r) => {
        let ph = 0;
        return (t) => {
            ph += (TAU * 180 * k12(p) * (1 + 4 * (1 - Math.exp(-t / 0.06)))) / SR;
            const pop = t < 0.01 ? (r() * 2 - 1) * (1 - t / 0.01) : 0;
            return (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.min(1, t / 0.01) * Math.exp(-t / 0.12) + 0.5 * pop;
        };
    },
    { pk: 0.45 },
);
/** A risadinha "ke-ke-ke": três sílabas nasais, cada uma mais baixa. */
export const risadinha = som(
    0.55,
    (p, r) => {
        let ph = 0;
        const [a, b] = [bp(1700, 4), bp(2900, 5)];
        return (t) => {
            const k = Math.floor(t / 0.13);
            const u = t - k * 0.13;
            let src = 0;
            if (k <= 2) {
                ph += (520 * k12(p) * (1.15 - 0.1 * k) * (1 - (0.15 * u) / 0.09)) / SR;
                const gate = u < 0.085 ? Math.sin((Math.PI * u) / 0.085) : 0;
                src = ((ph % 1 < 0.3 ? 1 : -0.43) + (u < 0.008 ? r() * 2 - 1 : 0)) * gate;
            }
            return a(src) + 0.7 * b(src) + 0.15 * src;
        };
    },
    { pk: 0.45 },
);
/** A lambida: ruído molhado com o filtro subindo e gorgolejando. */
export const lambida = som(
    0.55,
    (_p, r) => {
        const fl = svf(0.15);
        return (t) => {
            const x = Math.min(1, t / 0.5);
            return fl(r() * 2 - 1, 350 * 9 ** x * (1 + 0.3 * Math.sin(TAU * 22 * t))) * Math.sin(Math.PI * x) ** 0.7;
        };
    },
    { pk: 0.45 },
);
/** Teremim: senoide que entra escorregando de baixo e ganha vibrato largo. */
export const teremim = voz(
    (f, d) => {
        let ph = 0;
        return (t) => {
            const vib = 1 + 0.018 * Math.min(1, t / 0.35) * Math.sin(TAU * 5.8 * t);
            ph += (TAU * f * (1 - 0.06 * Math.exp(-t / 0.05)) * vib) / SR;
            return (Math.sin(ph) + 0.12 * Math.sin(2 * ph) + 0.05 * Math.sin(3 * ph)) * envNota(t, d, 0.04, 0.15);
        };
    },
    { solta: 0.16 },
);

// ---------- Ditto ----------
/** A voz do Ditto: kazoo (serra nas formantes, zumbido), entra escorregando de baixo e balança. */
export const kazoo = voz(
    (f, d, r) => {
        let ph = 0;
        let v = 0;
        const [a, b] = [bp(950, 3), bp(2400, 4)];
        return (t) => {
            const vib = 1 + 0.02 * Math.min(1, t / 0.2) * Math.sin(TAU * 6.5 * t);
            ph += (f * (1 - 0.16 * Math.exp(-t / 0.04)) * vib) / SR;
            v += 0.4 * (r() * 2 - 1 - v);
            const src = ((ph % 1) * 2 - 1) * (1 + 0.25 * v);
            return (a(src) + 0.6 * b(src) + 0.2 * src) * envNota(t, d, 0.025, 0.08);
        };
    },
    { solta: 0.1 },
);
/** Transformar: "blooo-op" que desce, balança e sobe. */
export const transforma = som(
    0.5,
    (p) => {
        let ph = 0;
        return (t) => {
            const x = Math.min(1, t / 0.42);
            const f = 220 * k12(p) * (x < 0.45 ? 2.4 - 1.6 * (x / 0.45) : 0.8 + 2.2 * ((x - 0.45) / 0.55) ** 1.5);
            ph += (TAU * f * (1 + 0.08 * Math.sin(TAU * 17 * t))) / SR;
            const am = 0.75 + 0.25 * Math.sin(TAU * 23 * t);
            return (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * am * Math.min(1, t / 0.01) * Math.min(1, (0.5 - t) / 0.08);
        };
    },
    { pk: 0.45, corte: 4000 },
);

// ---------- Psyduck ----------
/** O "psy?" do Psyduck: grasnado nasal (pulso nas formantes, um pouco de rouco) que cai de altura. */
export const quack = voz(
    (f, d, r) => {
        let ph = 0;
        let v = 0;
        const [a, b] = [bp(1050, 3.5), bp(2500, 4.5)];
        return (t) => {
            ph += (f * (1 - 0.12 * Math.min(1, t / Math.max(d, 0.12)))) / SR;
            v += 0.35 * (r() * 2 - 1 - v);
            const src = (ph % 1 < 0.35 ? 1 : -0.5) + 0.35 * v;
            return (a(src) + 0.8 * b(src) + 0.1 * src) * envNota(t, d, 0.012, 0.05);
        };
    },
    { solta: 0.08 },
);
/** A cabeça latejando: "TUM" grave e abafado. */
export const lateja = som(
    0.45,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            ph += (TAU * 46 * k12(p) * (1 + 0.5 * Math.exp(-t / 0.03))) / SR;
            v += 0.02 * (r() * 2 - 1 - v);
            return (Math.sin(ph) + 3 * v) * Math.min(1, t / 0.012) * Math.exp(-t / 0.13);
        };
    },
    { pk: 0.55 },
);
/** Nota ao contrário: cresce durante a nota e corta (o poder juntando, tudo boiando). */
export const flutua = voz(
    (f, d) => {
        let ph = 0;
        return (t) => {
            const env = t < d ? Math.min(1, t / d) ** 2.5 : Math.max(0, 1 - (t - d) / 0.03);
            ph += (TAU * f) / SR;
            return (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3.01 * ph)) * env;
        };
    },
    { solta: 0.04 },
);

// ---------- Eevee ----------
/** Bolhas subindo (água). */
export const bolhas = som(
    0.7,
    (p, r) => {
        const bs = Array.from({ length: 6 }, (_, i) => [
            i * 0.09 + r() * 0.05,
            (350 + r() * 400) * k12(p),
            0.03 + r() * 0.04,
        ]);
        return (t) => {
            let y = 0;
            for (const [t0, f, d] of bs)
                if (t > t0 && t < t0 + d * 4) {
                    const u = t - t0;
                    y += Math.sin(TAU * f * u * (1 + u / d)) * Math.exp(-u / d);
                }
            return y;
        };
    },
    { pk: 0.4 },
);
/** Fogo: a labareda (ruído grave que tremula) e os estalos. */
export const fogo = (dur = 1.2) =>
    som(
        dur,
        (_p, r) => {
            let v = 0;
            let w = 0;
            let c = 0;
            return (t) => {
                const x = t / dur;
                v += 0.05 * (r() * 2 - 1 - v);
                w += 0.3 * (r() * 2 - 1 - w);
                if (r() < 0.0012 * (1 - 0.5 * x)) c = (0.2 + r() * 0.8) * (r() < 0.5 ? -1 : 1);
                c *= 0.9;
                const env = Math.min(1, t / 0.03) * Math.min(1, (dur - t) / (dur * 0.6));
                return (2.5 * v + 0.25 * w * (0.5 + 0.5 * Math.sin(TAU * 9 * t))) * env + c;
            };
        },
        { pk: 0.45, corte: 6000 },
    );
