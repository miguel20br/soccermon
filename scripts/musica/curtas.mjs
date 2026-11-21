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
export const bp = (f, q) => {
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
export const svf = (q = 0.5) => {
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
/** O BOING do Ditto (a mola da transformação, assinatura do EP 3): berimbau de boca. O tom entra de baixo, balança num
 * vibrato que morre, e um passa-faixa abre e fecha no mesmo balanço (o "uóin-uóin" da gelatina). Afinado em Sol 3
 * (`pitch` em semitons). `desce` = semitons que escorrega até o fim (o Onix derretendo); `balanco` = Hz do balanço. */
export const mola = ({ seg = 0.75, desce = 0, balanco = 12 } = {}) =>
    som(
        seg,
        (p) => {
            let ph = 0;
            const fl = svf(0.22);
            return (t) => {
                const x = Math.min(1, t / seg);
                const bal = Math.exp(-t / (seg * 0.45)) * Math.sin(TAU * balanco * t);
                const f = hz(55 + p - desce * x ** 1.2) * (1 - 0.35 * Math.exp(-t / 0.018)) * (1 + 0.07 * bal);
                ph += f / SR;
                const fase = ph % 1;
                const env = Math.min(1, t / 0.003) * Math.exp(-t / (seg * 0.42)) * Math.min(1, (seg - t) / 0.06);
                return (0.7 * Math.sin(TAU * fase) + fl(fase * 2 - 1, f * (3.2 + 2.2 * bal))) * env;
            };
        },
        { pk: 0.5, corte: 5000 },
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

// ---------- Amigos (trailer da 0.9.25) ----------
/** O "plim" do aviso de desafio (assinatura do trailer Amigos): duas notas de sino subindo uma quarta (Dó6 → Fá6 com
 * `pitch` 0), cada uma com um parcial inarmônico de sino e um estalinho no ataque. `pitch` em semitons. */
export const plim = som(
    0.7,
    (p, r) => {
        const notas = [
            [0, hz(84 + p)],
            [0.075, hz(89 + p)],
        ];
        const ph = [0, 0, 0, 0];
        return (t) => {
            let y = 0;
            notas.forEach(([t0, f], k) => {
                if (t < t0) return;
                const u = t - t0;
                ph[2 * k] += (TAU * f) / SR;
                ph[2 * k + 1] += (TAU * f * 2.76) / SR;
                const env = Math.min(1, u / 0.002) * Math.exp(-u / (k ? 0.22 : 0.09));
                y += (Math.sin(ph[2 * k]) + 0.25 * Math.sin(ph[2 * k + 1]) * Math.exp(-u / 0.05)) * env;
            });
            const clic = t < 0.004 ? (r() * 2 - 1) * (1 - t / 0.004) * 0.4 : 0;
            return y + clic;
        };
    },
    { pk: 0.45, corte: 9000 },
);

// ---------- Lance da semana nº 2 (os 4 dribles) ----------
/** A cuíca (assinatura do Lance #2: a torcida rindo do Machop). Tambor de fricção: a nota escorrega no ataque ("uí", que
 * sobe `sobe` semitons até a nota) ou cai depois dela (`forma: 'cai'`, o "uóóó" do tombo), com o anasalado do couro
 * (formante em 1,1 kHz), o chiado da vareta e um balanço que entorta mais com `torto` (0 a 1: o Machop mais tonto). */
export const cuica = ({ forma = 'ui', sobe = 5, torto = 0 } = {}) =>
    voz(
        (f, d, r) => {
            let ph = 0;
            let ru = 0;
            const [a, b] = [bp(1100, 2.2), bp(2600, 3)];
            return (t) => {
                const u = Math.min(1, t / Math.max(0.05, d));
                // "uí": entra `sobe` abaixo e chega na nota em 40% da nota; "cai": sai da nota e escorrega `sobe` pra baixo
                const st = forma === 'cai' ? -sobe * u ** 1.6 : -sobe * Math.max(0, 1 - t / (0.4 * d)) ** 2;
                const vib = torto * 1.6 * Math.sin(TAU * (5 + 3 * torto) * t) * Math.min(1, t / 0.08);
                ph += (f * 2 ** ((st + vib) / 12)) / SR;
                ru += 0.3 * (r() * 2 - 1 - ru);
                const x = Math.sin(TAU * ph) + 0.55 * Math.sin(2 * TAU * ph) + 0.3 * Math.sin(3 * TAU * ph) + 0.25 * ru;
                const env = Math.min(1, t / 0.012) * (t < d ? 1 - 0.35 * u : Math.max(0, 1 - (t - d) / 0.06) * 0.65);
                return (0.55 * a(x) + 0.25 * b(x) + 0.35 * x) * env;
            };
        },
        { solta: 0.07, pk: 0.5 },
    );
/** O Machop se exibindo (assinatura da música B do Lance #2): metal grave de músculo, serrote com formantes de "ô" e um
 * rosnado (o braço tremendo de força). `torto` (0 a 1) desafina e balança (tonto); `cai` escorrega `cai` semitons pra
 * baixo ao longo da nota (o tombo). */
export const musculo = ({ torto = 0, cai = 0 } = {}) =>
    voz(
        (f, d) => {
            let ph = 0;
            const [a, b] = [bp(520, 2.5), bp(1150, 3)];
            return (t) => {
                const u = Math.min(1, t / Math.max(0.05, d));
                const st = -0.6 * torto - cai * u ** 1.4 + torto * 0.9 * Math.sin(TAU * 4.5 * t) * Math.min(1, t / 0.1);
                ph += (f * 2 ** (st / 12)) / SR;
                const x = ((ph % 1) * 2 - 1) * (1 + 0.18 * Math.sin(TAU * 31 * t));
                return (0.7 * a(x) + 0.35 * b(x) + 0.12 * x) * envNota(t, d, 0.02, 0.07);
            };
        },
        { solta: 0.08, pk: 0.55 },
    );

// ---------- Soccermon News #1 ----------
/** A voz do Meowth (assinatura do quadro Número da semana): um "mi-áu" cantado. Serra com um chiado de gato, as duas
 * formantes andando de "i" pra "a" e fechando em "u" ao longo da nota, e a nota que entra um pouco acima e assenta. */
export const miau = voz(
    (f, d, r) => {
        let ph = 0;
        let ru = 0;
        const [f1, f2] = [svf(0.35), svf(0.3)];
        const lerp = (a, b, x) => a + (b - a) * x;
        return (t) => {
            const u = Math.min(1, t / Math.max(0.08, d));
            // i (400/2300) → a (850/1350) na metade → u (420/900) no fim
            const F1 = u < 0.45 ? lerp(400, 850, u / 0.45) : lerp(850, 420, (u - 0.45) / 0.55);
            const F2 = u < 0.45 ? lerp(2300, 1350, u / 0.45) : lerp(1350, 900, (u - 0.45) / 0.55);
            const vib = 1 + 0.025 * Math.min(1, t / 0.15) * Math.sin(TAU * 6 * t);
            ph += (f * (1 + 0.06 * Math.exp(-t / 0.06)) * vib) / SR;
            ru += 0.5 * (r() * 2 - 1 - ru);
            const src = (ph % 1) * 2 - 1 + 0.12 * ru;
            return (f1(src, F1) + 0.8 * f2(src, F2) + 0.1 * src) * envNota(t, d, 0.02, 0.08);
        };
    },
    { solta: 0.1 },
);
/** A voz do Porygon (assinatura do Convidado da semana): bipe digital. Onda quadrada que entra com um arpejo de
 * computador (oitava e quinta em 1/40 s cada), segura a nota com a amplitude em 8 degraus e amostrada a 11 kHz: o
 * pixel no som (com `corte` baixo na faixa, ele fica "borrado"). */
export const bit = voz(
    (f, d) => {
        let ph = 0;
        let held = 0;
        let n = 0;
        return (t) => {
            const k = t < 0.05 ? [2, 1.5][Math.floor(t / 0.025)] : 1;
            ph += (f * k) / SR;
            if (n++ % 4 === 0) held = (ph % 1 < 0.5 ? 1 : -1) * envNota(t, d, 0.004, 0.03);
            return Math.round(held * 4) / 4;
        };
    },
    { solta: 0.04, pk: 0.4 },
);
/** A voz do Psyduck (convidado do News #1, 14/11): "psy?" grave e atrapalhado. O estalo do "p", o chiado do "s" e a
 * vogal "ai" numa serra grave que balança fora do tempo (a cabeça doendo) e sobe no fim, como pergunta. Soa bem de
 * Sol 2 a Dó 3. */
export const psy = voz(
    (f, d, r) => {
        let ph = 0;
        let ru = 0;
        const [f1, f2, chi] = [svf(0.3), svf(0.25), svf(0.2)];
        const lerp = (a, b, x) => a + (b - a) * x;
        const S0 = 0.075; // o "ps" antes da vogal
        return (t) => {
            const n = r() * 2 - 1;
            const p = t < 0.012 ? n * (1 - t / 0.012) * 0.7 : 0;
            const s = t > 0.01 && t < S0 ? chi(n, 5200) * Math.sin((Math.PI * (t - 0.01)) / (S0 - 0.01)) * 1.4 : 0;
            const tv = t - S0;
            if (tv < 0) return p + s;
            const dv = Math.max(0.1, d - S0);
            const u = Math.min(1, tv / dv);
            const wob = 1 + 0.04 * Math.sin(TAU * 4.3 * tv + 1.7 * Math.sin(TAU * 1.1 * tv));
            const sobe = 1 + 0.32 * Math.max(0, (u - 0.5) / 0.5) ** 2; // a pergunta: ~5 semitons no fim
            ph += (f * wob * sobe) / SR;
            ru += 0.4 * (n - ru);
            const src = (ph % 1) * 2 - 1 + 0.1 * ru;
            const F1 = lerp(720, 340, u);
            const F2 = lerp(1050, 1850, u);
            return p + s + (f1(src, F1) + 0.7 * f2(src, F2) + 0.12 * src) * envNota(tv, dv, 0.03, 0.1);
        };
    },
    { solta: 0.12 },
);
/** A voz do Pikachu (apresentador do News #1 v7, 15/11): blips agudos e curtos, um "pi" por nota. Pulso estreito (25%,
 * mais fino que a quadrada do `bit`) que entra uma quinta acima e cai na nota em 25 ms (o "pi" do choquinho), com um
 * tremolo rápido e o corte seco: cada nota é uma sílaba. Diferente do `miau` (formantes andando) e do `psy` (grave). */
export const pika = voz(
    (f, d) => {
        let ph = 0;
        return (t) => {
            ph += (f * (1 + 0.5 * Math.exp(-t / 0.025)) * (1 + 0.025 * Math.sin(TAU * 13 * t))) / SR;
            const x = ph % 1;
            return (x < 0.25 ? 1 : -0.33) * (0.8 + 0.2 * Math.cos(TAU * 22 * t)) * envNota(t, d, 0.003, 0.03);
        };
    },
    { solta: 0.04, pk: 0.42 },
);
/** A voz do Raichu (teste da dupla do News #1, 15/11): o "rai" curto. Pulso de 1/3 (mais cheio que o 25% do `pika`)
 * que entra uma quarta acima e cai em 30 ms, com um filtro que abre no ataque e fecha (o "ai") e um chiado de faísca
 * por baixo. Soa bem de Sol 4 a Ré 5: aguda e curta, uma quarta abaixo do Pikachu. */
export const raichu = voz(
    (f, d, r) => {
        let ph = 0;
        const fl = svf(0.45);
        return (t) => {
            const u = Math.min(1, t / Math.max(0.05, d));
            ph += (f * (1 + 0.33 * Math.exp(-t / 0.03) - 0.05 * u) * (1 + 0.02 * Math.sin(TAU * 9 * t))) / SR;
            const src = (ph % 1 < 0.33 ? 1 : -0.5) + 0.1 * (r() * 2 - 1);
            return (0.45 * src + 0.8 * fl(src, 700 + 1600 * Math.exp(-t / 0.05))) * envNota(t, d, 0.004, 0.04);
        };
    },
    { solta: 0.05, pk: 0.45 },
);
/** A voz do Machamp (teste da dupla do News #1, 15/11): o "HA!" grave e forte. Serra com a oitava de baixo em
 * quadrada, um "h" de sopro no ataque, as formantes abrindo de "o" pra "a" em 60 ms e saturação (tanh) pro peito.
 * Soa bem de Lá 2 a Ré 3. */
export const machamp = voz(
    (f, d, r) => {
        let ph = 0;
        let ru = 0;
        const [f1, f2] = [svf(0.3), svf(0.3)];
        return (t) => {
            const n = r() * 2 - 1;
            const u = Math.min(1, t / Math.max(0.08, d));
            const a = Math.min(1, t / 0.06);
            ph += (f * (1 + 0.1 * Math.exp(-t / 0.02) - 0.05 * u)) / SR;
            ru += 0.3 * (n - ru);
            const src = (ph % 1) * 2 - 1 + ((ph * 0.5) % 1 < 0.5 ? 0.5 : -0.5) + 0.15 * ru;
            const y = f1(src, 480 + 270 * a) + 0.6 * f2(src, 850 + 400 * a) + 0.15 * src;
            const h = t < 0.03 ? n * (1 - t / 0.03) * 0.5 : 0;
            return Math.tanh(1.8 * y) * envNota(t, d, 0.008, 0.08) + h;
        };
    },
    { solta: 0.1, pk: 0.55 },
);
/** O "blip" da caixa de diálogo (News #1 v5): uma letra digitando, como nos RPGs de 8 bits. Quadrada curtinha (40 ms)
 * com um degrau de oitava no ataque e queda rápida. Bateria: `pitch` em semitons a partir de Lá 5 (880 Hz). */
export const blip = som(
    0.045,
    (p) => {
        let ph = 0;
        const f = 880 * k12(p);
        return (t) => {
            ph += (f * (t < 0.006 ? 2 : 1)) / SR;
            return (ph % 1 < 0.5 ? 1 : -1) * Math.min(1, t / 0.002) * Math.exp(-t / 0.014);
        };
    },
    { pk: 0.45, corte: 5000 },
);
/** O "tic" do texto dos jogos de Pokémon (News #1, dupla Raichu e Golduck, 15/11): uma letra, baixinho, sem voz.
 * Triangular com um fio do seno da oitava, 2 ms de ataque e queda exponencial curta que zera no fim; nada de
 * saturação (o Miguel achou as vozes `raichu`/`machamp` agressivas). Bateria: `pitch` em semitons a partir de `f0`. */
const tic = (f0, cai) =>
    som(
        0.08,
        (p) => {
            let ph = 0;
            const f = f0 * k12(p);
            return (t) => {
                ph += f / SR;
                const tri = 4 * Math.abs((ph % 1) - 0.5) - 1;
                return (
                    (tri + 0.15 * Math.sin(TAU * 2 * ph)) * Math.min(1, t / 0.002) * Math.exp(-t / cai) * (1 - t / 0.08)
                );
            };
        },
        { pk: 0.3 },
    );
/** O blip do Raichu: agudo e curtinho (Dó 6). */
export const blipRaichu = tic(1046.5, 0.012);
/** O blip do Golduck: grave e calmo (Lá 4), um pouco mais longo. */
export const blipGolduck = tic(440, 0.022);
// News #1 v8 (15/11): um tic por personagem, todos no molde do blipRaichu (triangular, sem saturação)
/** O blip do Machoke: o mais grave e calmo da dupla (Dó 4), queda longa. */
export const blipMachoke = tic(261.6, 0.028);
/** O blip do Meowth: agudo e esperto (Sol 5), curtinho. */
export const blipMeowth = tic(784, 0.011);
/** O blip do Psyduck: médio-grave e mole (Mi 4), um pouco mais longo. */
export const blipPsyduck = tic(329.6, 0.03);
/** O blip do Charmeleon (News #2): médio e seco (Sol 4), curto. */
export const blipCharmeleon = tic(392, 0.018);
/** O blip do Magikarp: médio (Ré 5), curto, entre o Meowth e o Psyduck. */
export const blipMagikarp = tic(587.3, 0.016);
/** A varrida entre matérias (News #1 v5): ruído num passa-faixa que sobe e desce em 0,45 s, o "fuuuh" da faixa
 * cruzando a tela; o pico (o meio da varrida, o corte de cena) cai em 0,2 s. */
export const varrida = som(
    0.5,
    (p, r) => {
        const fl = svf(0.6);
        return (t) => {
            const x = t / 0.45;
            const env = x < 1 ? Math.sin(Math.PI * Math.min(1, x / 0.9)) ** 1.5 : 0;
            const fc = 300 + 2600 * k12(p) * Math.sin(Math.PI * Math.min(1, x)) ** 2;
            return fl(r() * 2 - 1, fc) * env;
        };
    },
    { pk: 0.4 },
);
/** O papel rasgando (News #1 v6, a tampa do pacote): ruído agudo num passa-faixa, picotado em fibras (estalos curtos e
 * irregulares) que vão rareando em 0,35 s; o centro desce um pouco no fim, quando a tampa sai. */
export const rasga = som(
    0.4,
    (p, r) => {
        const fl = svf(0.8);
        let fibra = 0;
        let prox = 0;
        return (t) => {
            if (t >= prox) {
                fibra = 0.35 + 0.65 * r();
                prox = t + 0.004 + 0.012 * r() * (1 + 3 * t);
            }
            const env = Math.min(1, t / 0.01) * Math.max(0, 1 - t / 0.35) ** 1.3;
            return fl(r() * 2 - 1, (3400 - 1400 * Math.min(1, t / 0.35)) * k12(p)) * fibra * env;
        };
    },
    { pk: 0.45 },
);
