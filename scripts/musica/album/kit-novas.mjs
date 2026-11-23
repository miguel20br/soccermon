// Kit das faixas NOVAS da rodada 3 do álbum (17/11/2026): os timbres que o `kit.mjs` não tem (ele fica intocado).
// FM de 2 operadores no jeito do Mega Drive (lead, metal e baixo de slap: o "Sonic Mania"), o golpe de orquestra, o
// steel pan e o sub de 808 do dancehall, e os sons de assinatura das faixas novas (a bola caindo no mar, as ondas, o
// flash dos fotógrafos, as travas da chuteira no concreto do túnel).
import { voz } from '../pecas/lider-koga.mjs';
import { k12, som } from '../pecas/livre-ginasio.mjs';
import { midi, SR } from '../synth.mjs';

const TAU = Math.PI * 2;

/** FM de 2 operadores: o índice vai de `i0` a `i1` em `cai` s (cai = brilho no ataque; sobe = metal que abre). */
const fm =
    ({ razao = 1, i0 = 2.5, i1 = 0.8, cai = 0.12, vib = 0.005, abre = 0.004, decai = 0 }) =>
    (f) => {
        let pc = 0;
        let pm = 0;
        return (t) => {
            const v = 1 + vib * Math.sin(TAU * 5.5 * t) * Math.min(1, Math.max(0, (t - 0.25) / 0.3));
            pm += (TAU * f * razao * v) / SR;
            pc += (TAU * f * v) / SR;
            const idx = i1 + (i0 - i1) * Math.exp(-t / cai);
            return Math.sin(pc + idx * Math.sin(pm)) * Math.min(1, t / abre) * (decai ? Math.exp(-t / decai) : 1);
        };
    };

/** Lead FM: o "tine" brilhante no ataque que assenta num timbre de palheta. */
export const fmLead = (S, nome, o = {}) =>
    voz(S, nome, fm({ razao: 1, i0: 3, i1: 1.1, cai: 0.15 }), o, { pk: 0.4, solta: 0.08 });
/** Metal FM: o índice SOBE no ataque (o sopro abrindo), como o naipe sintetizado dos 16 bits. */
export const fmMetal = (S, nome, o = {}) =>
    voz(S, nome, fm({ razao: 1, i0: 0.2, i1: 1.9, cai: 0.05, abre: 0.02 }), o, { pk: 0.4, solta: 0.09 });
/** Sino FM (razão 3,5, inarmônico): o arpejo de cristal. */
export const fmSino = (S, nome, o = {}) =>
    voz(S, nome, fm({ razao: 3.5, i0: 2.2, i1: 0.2, cai: 0.25, decai: 0.7, vib: 0 }), o, { pk: 0.35, solta: 0.2 });

/** Baixo de slap em FM: o estalo (índice alto que despenca) em cima de uma fundamental redonda. */
export const fmBaixo = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            const g = fm({ razao: 1, i0: 4, i1: 0.6, cai: 0.035, decai: 0.6, vib: 0 })(f);
            return (t) => Math.tanh(1.4 * (g(t) + 0.6 * Math.sin(TAU * f * t) * Math.exp(-t / 0.8)));
        },
        o,
        { pk: 0.55, solta: 0.04 },
    );

/** Sub de 808 do dancehall: senoide com o "tum" no ataque e um tico de drive, segura a nota. */
export const sub808 = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            let ph = 0;
            return (t) => {
                ph += (TAU * f * (1 + 0.5 * Math.exp(-t / 0.015))) / SR;
                return Math.tanh(1.8 * Math.sin(ph)) * Math.min(1, t / 0.003) * Math.exp(-t / 1.4);
            };
        },
        o,
        { pk: 0.6, solta: 0.06 },
    );

/** Steel pan: a fundamental, a oitava forte que some, a 3ª parcial um tico desafinada (o tambor de lata). */
export const steelPan = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => (t) =>
            (Math.sin(TAU * f * t) +
                0.55 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.35) +
                0.22 * Math.sin(TAU * 3.02 * f * t) * Math.exp(-t / 0.12) +
                0.1 * Math.sin(TAU * 4.2 * f * t) * Math.exp(-t / 0.04)) *
            Math.exp(-t / 0.9) *
            Math.min(1, t / 0.003),
        o,
        { pk: 0.4, solta: 0.12 },
    );

/** Golpe de orquestra (power chord: tônica, quinta, oitava e duas oitavas, mais o ruído do arco); `p` = semitons de Lá2. */
export const orquestra = som(
    0.7,
    (p, r) => {
        const f = 110 * k12(p);
        const fs = [1, 1.5, 2, 3, 4];
        const ph = fs.map(() => 0);
        let v = 0;
        return (t) => {
            let y = 0;
            fs.forEach((m, i) => {
                ph[i] += (TAU * f * m) / SR;
                y += (((ph[i] / TAU) % 1) * 2 - 1) / (1 + 0.4 * i);
            });
            v += 0.3 * (r() * 2 - 1 - v);
            return (0.5 * y + 0.4 * v * Math.exp(-t / 0.03)) * Math.min(1, t / 0.003) * Math.exp(-t / 0.16);
        };
    },
    { pk: 0.5, corte: 5000 },
);

/** A bola caindo no mar: o "ploc" que despenca e o borrifo da água. */
export const mergulho = som(
    1.3,
    (p, r) => {
        let ph = 0;
        let v = 0;
        let w = 0;
        return (t) => {
            ph += (TAU * k12(p) * (140 + 650 * Math.exp(-t / 0.05))) / SR;
            const ploc = Math.sin(ph) * Math.exp(-t / 0.12);
            const n = r() * 2 - 1;
            v += 0.25 * (n - v);
            w += 0.02 * (v - w);
            const borrifo = (v - w) * Math.min(1, t / 0.02) * Math.exp(-t / 0.35);
            return ploc + 1.2 * borrifo;
        };
    },
    { pk: 0.5, corte: 6000 },
);

/** Onda do mar: ruído grave que cresce, quebra e espuma (3,5 s). */
export const onda = som(
    3.5,
    (_p, r) => {
        let a = 0;
        let b = 0;
        return (t) => {
            const x = t / 3.5;
            const c = 0.02 + 0.06 * Math.sin(Math.PI * Math.min(1, x * 1.6));
            a += c * (r() * 2 - 1 - a);
            b += 0.004 * (a - b);
            return (a - b) * Math.sin(Math.PI * x) ** 1.5;
        };
    },
    { pk: 0.4 },
);

/** O flash do fotógrafo: o estalo e o "fiiii" do flash recarregando, subindo. */
export const flash = som(
    1,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            v += 0.5 * (r() * 2 - 1 - v);
            const estalo = v * Math.exp(-t / 0.006) + Math.sin(TAU * 2400 * t) * Math.exp(-t / 0.01) * 0.5;
            const u = Math.max(0, t - 0.08);
            ph += (TAU * k12(p) * (1500 + 3200 * Math.min(1, u / 0.8))) / SR;
            const fiii = u > 0 ? 0.12 * Math.sin(ph) * Math.min(1, u / 0.1) * Math.min(1, (1 - t) / 0.15) : 0;
            return estalo + fiii;
        };
    },
    { pk: 0.4, corte: 7000 },
);

/** As travas da chuteira no concreto: dois estalos (a frente e o calcanhar) com o "tic" do alumínio. */
export const trava = som(
    0.09,
    (p, r) => {
        let v = 0;
        return (t) => {
            v += 0.6 * (r() * 2 - 1 - v);
            const a = Math.exp(-t / 0.0025);
            const t2 = t - 0.028;
            const b = t2 > 0 ? 0.6 * Math.exp(-t2 / 0.0025) : 0;
            const tic = Math.sin(TAU * 3100 * k12(p) * t) * (a + b);
            return v * (a + b) + 0.5 * tic;
        };
    },
    { pk: 0.4, corte: 8000 },
);

/**
 * Frase solta a partir da linha `row0`, sem conferir o compasso, com as durações × `escala` (2 = aumentação: a
 * melodia em câmera lenta). Mesmo formato do `mel` ("E5:2 r:2 C5+E5:4").
 */
export function frase(P, row0, strs, { shift = 0, vel = 1, escala = 1 } = {}) {
    let t = row0;
    for (const tok of strs.join(' ').trim().split(/\s+/)) {
        const [n, l] = tok.split(':');
        const len = Number(l) * escala;
        if (n !== 'r') for (const x of n.split('+')) P.note(t, midi(x) + shift, len, vel);
        t += len;
    }
    return t;
}

// ---------- rodada 4 (23/11/2026): o viajante da "A Rota" e o estádio do "Soc-cer-MON!" ----------

/** Ocarina (a voz do viajante na "A Rota"): seno redondo, a nota entra um tico abaixo e assenta, o sopro no ataque. */
export const ocarina = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f, _s, r) => {
            let ph = 0;
            let n = 0;
            return (t) => {
                const vib = 1 + 0.006 * Math.sin(TAU * 5.2 * t) * Math.min(1, Math.max(0, (t - 0.25) / 0.3));
                ph += (TAU * f * vib * (1 - 0.012 * Math.exp(-t / 0.03))) / SR;
                n += 0.08 * (r() * 2 - 1 - n);
                const sopro = n * (0.6 * Math.exp(-t / 0.05) + 0.1);
                return (
                    (Math.sin(ph) + 0.2 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph) + sopro) * Math.min(1, t / 0.025)
                );
            };
        },
        o,
        { pk: 0.45, solta: 0.08 },
    );

/** Gota caindo na poça: o "plic" cuja nota sobe e assenta; afinada (`p` = semitons a partir do Ré6). */
export const gota = som(
    0.35,
    (p) => {
        let ph = 0;
        return (t) => {
            const f = 1174.66 * k12(p) * (0.55 + 0.45 * (1 - Math.exp(-t / 0.008)));
            ph += (TAU * f) / SR;
            return (
                Math.sin(ph) * Math.exp(-t / 0.05) * Math.min(1, t / 0.0008) +
                0.15 * Math.sin(2.01 * ph) * Math.exp(-t / 0.015)
            );
        };
    },
    { pk: 0.45, corte: 5000 },
);

/** O grito da gaivota ("kiá"): sobe, raspa e cai. */
export const gaivota = som(
    0.5,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            const x = Math.min(1, t / 0.45);
            ph += (TAU * 1250 * k12(p) * (1 + 0.35 * Math.sin(Math.PI * Math.min(1, x * 2.2)) - 0.25 * x)) / SR;
            v += 0.3 * (r() * 2 - 1 - v);
            const y = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph) + 0.35 * v;
            return y * Math.min(1, t / 0.03) * (1 - x) ** 1.5;
        };
    },
    { pk: 0.4, corte: 5000 },
);

/**
 * Coro da arquibancada: a vogal "ó" (formantes em 550, 950 e 2450 Hz) cantada por três vozes um tico desafinadas, cada
 * uma com o seu vibrato. É o estádio cantando, quente, sem o agudo do chip.
 */
export const coro = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            const FORM = [
                [550, 170, 1],
                [950, 210, 0.6],
                [2450, 320, 0.12],
            ];
            const nh = Math.max(1, Math.min(30, Math.floor(4500 / f)));
            const amp = [0];
            for (let k = 1; k <= nh; k++)
                amp.push(FORM.reduce((a, [F, bw, g]) => a + g * Math.exp(-(((k * f - F) / bw) ** 2)), 0.05 / k));
            const norma = amp.reduce((a, b) => a + b, 0) * 0.6;
            const DET = [-0.0058, 0, 0.0049];
            const ph = [0, 0, 0];
            return (t) => {
                let y = 0;
                for (let v = 0; v < 3; v++) {
                    const vib = 1 + 0.005 * Math.sin(TAU * (4.6 + 0.4 * v) * t + 2.1 * v) * Math.min(1, t / 0.3);
                    ph[v] += (TAU * f * (1 + DET[v]) * vib) / SR;
                    for (let k = 1; k <= nh; k++) y += amp[k] * Math.sin(k * ph[v]);
                }
                return (y / 3 / norma) * Math.min(1, t / 0.07);
            };
        },
        o,
        { pk: 0.5, solta: 0.16 },
    );

/** Acorde por notas (pros acordes que o `chord` não conhece: maj7♯11, maj7♯5, 7♯9…): `['D3', 'A3', 'C#4']`. */
export function notas(P, row, ns, len, vel = 1) {
    for (const n of ns) P.note(row, midi(n), len, vel);
}

// ---------- rodada 5 (23/11/2026): o pandeiro e a cuíca do Tema de abertura, o rosnado do Túnel ----------

/** Pandeiro: a platinela (as soalhas chacoalhando), o tapa (a mão aberta no couro) e o grave (o polegar). */
export const pandeiro = {
    platinela: som(
        0.12,
        (_p, r) => {
            let a = 0;
            const ph = [0, 0, 0];
            const F = [5300, 6900, 8400];
            return (t) => {
                const n = r() * 2 - 1;
                const claro = n - a; // passa-alta: o chiado das soalhas
                a += 0.3 * (n - a);
                let anel = 0;
                F.forEach((f, i) => {
                    ph[i] += (TAU * f) / SR;
                    anel += Math.sin(ph[i]) / (i + 1);
                });
                return (0.7 * claro + 0.25 * anel * (r() * 0.5 + 0.5)) * Math.exp(-t / 0.035) * Math.min(1, t / 0.002);
            };
        },
        { pk: 0.4, corte: 9500 },
    ),
    tapa: som(
        0.15,
        (_p, r) => {
            let a = 0;
            let b = 0;
            return (t) => {
                const n = r() * 2 - 1;
                a += 0.35 * (n - a);
                b += 0.06 * (a - b);
                const estalo = (a - b) * Math.exp(-t / 0.018);
                const couro = Math.sin(TAU * 235 * t) * Math.exp(-t / 0.05);
                return 1.3 * estalo + 0.6 * couro;
            };
        },
        { pk: 0.45, corte: 7000 },
    ),
};

/** Cuíca: o "uí-óm" da vara esfregada (a nota sobe, raspa e cai); `p` = semitons a partir do Lá5. */
export const cuica = som(
    0.32,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            const x = t / 0.32;
            const f = 880 * k12(p) * (0.72 + 0.4 * Math.sin(Math.PI * Math.min(1, x * 1.4)) - 0.12 * x);
            ph += (TAU * f) / SR;
            v += 0.2 * (r() * 2 - 1 - v);
            const y = Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph);
            return y * (1 + 0.5 * v) * Math.min(1, t / 0.015) * (1 - x) ** 1.2;
        };
    },
    { pk: 0.4, corte: 5000 },
);

/** Baixo sujo (o rosnado): dente de serra com a sub-oitava, saturado; use com `corte` (~1,2 kHz) na faixa. */
export const rosnado = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            let ph = 0;
            let ps = 0;
            return (t) => {
                ph += f / SR;
                ps += (0.5 * f) / SR;
                const serra = 2 * (ph % 1) - 1;
                return Math.tanh(2.6 * (0.7 * serra + 0.5 * Math.sin(TAU * ps))) * Math.min(1, t / 0.004);
            };
        },
        o,
        { pk: 0.5, solta: 0.05 },
    );

/** Trombone que rosna (growl): o naipe grave com a garganta vibrando a ~28 Hz e um tico de saturação. */
export const tromboneRosna = (S, nome, o = {}) =>
    voz(
        S,
        nome,
        (f) => {
            let ph = 0;
            const nh = Math.max(1, Math.min(12, Math.floor(9000 / f)));
            return (t) => {
                ph += (TAU * f) / SR;
                let y = 0;
                for (let k = 1; k <= nh; k++) y += (Math.sin(k * ph) / k) * Math.exp(-(k - 1) * 0.28);
                const garganta = 1 + 0.45 * Math.sin(TAU * 28 * t) * Math.min(1, t / 0.08);
                return Math.tanh(1.8 * y * garganta) * Math.min(1, t / 0.035);
            };
        },
        o,
        { pk: 0.45, solta: 0.08 },
    );
