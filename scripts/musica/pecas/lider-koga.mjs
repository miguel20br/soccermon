// Tema do Koga (líderes de Kanto): o ninja do veneno, ginásio de Fuchsia. Lá frígio com a escala in-sen (Lá Si♭ Ré
// Mi Sol), 120 BPM, groove ninja: taiko em 3-3-2, bloco de madeira no 2 e no 4, baixo em 3-3-2 (família do
// SOC-CER-MON). O SHAKUHACHI (feito à mão: entra um semitom abaixo e sobe, sopro e vibrato que cresce) pergunta, o
// KOTO responde; BOLHAS de veneno (Koffing) no fim das respostas.
// B, a história do ginásio dele: as PAREDES INVISÍVEIS. A melodia anda passo a passo (pés no bloco)... TONK: bate
// numa parede que não se vê, tudo para, e o shakuhachi faz "hm?". Vira e anda pro outro lado: TONK de novo, mais cedo
// (as bolhas riem dele). Na terceira vai na ponta do pé, testando o ar, acha a passagem e a melodia escorrega por ela
// subindo. FUMAÇA: o Koga aparece, o shakuhachi grita no ritmo 3-3-2, e o A volta meio tom acima (Si♭ frígio) com
// terças e o SOC-CER-MON no shakuhachi com o clap 808 seco (ninja).
// Forma: intro (2): fumaça e a nota longa | A (8) | B: as paredes (8) | A' (8) meio tom acima | virada (1): Mi7.
// Loop do compasso 2 ao fim (~50 s). MOTIVO (2 compassos, Am | B♭: cadência frígia) pra uma futura Partida: Koga.
// Exporta `voz` (instrumento melódico feito à mão que respeita a duração), `shaku`, `tonk`, `bolha`, `fumaca`.
import { bass, drum, GANCHO, hz, I, MAJOR, mel, padChord, Song, SR, thirdBelow, transpose } from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tema do Koga', tela: 'Líder de ginásio: Koga (Fuchsia)' };

export const MOTIVO = {
    mel: ['E5:1 r:1 E5:1 r:1 A5:4 G5:2 E5:1 D5:1 E5:4', 'F5:3 D5:3 Bb4:2 A4:8'],
    acordes: ['Am', 'Bb'],
};

const TAU = Math.PI * 2;

/**
 * Instrumento melódico feito à mão que respeita a duração (o ZzFX não tem vibrato nem sopro). `faz(f, seg, r)`
 * devolve `(t) => valor` (com o ataque); a nota dura `seg` e solta em `solta` s. Uma faixa como as outras: `mel` toca.
 */
export function voz(S, nome, faz, opts = {}, { pk = 0.5, solta = 0.15 } = {}) {
    const cache = new Map();
    let seg = 0.2;
    const P = S.part(
        nome,
        (m) => {
            const key = `${m}:${seg.toFixed(4)}`;
            if (!cache.has(key)) {
                let s = 4243;
                const r = () => {
                    s = (s * 16807) % 2147483647;
                    return s / 2147483647;
                };
                const f = faz(hz(m), seg, r);
                const y = new Float32Array(Math.round((seg + solta) * SR));
                for (let i = 0; i < y.length; i++) {
                    const t = i / SR;
                    y[i] = f(t) * pk * (t < seg ? 1 : Math.max(0, 1 - (t - seg) / solta));
                }
                cache.set(key, y);
            }
            return cache.get(key);
        },
        opts,
    );
    const note = P.note;
    P.note = (t, m, len = 1, v = 1) => {
        seg = len * S.rowAt(Math.floor(t / S.barLen));
        note(t, m, len, v);
    };
    return P;
}

/** Shakuhachi: entra um semitom abaixo e sobe (meri), sopro no ataque, vibrato que cresce depois de 0,25 s. */
export const shaku = (f, _seg, r) => {
    let ph = 0;
    let a = 0;
    let b = 0;
    return (t) => {
        const scoop = 1 - 0.055 * Math.exp(-t / 0.05);
        const vib = 1 + 0.011 * Math.min(1, Math.max(0, (t - 0.25) / 0.35)) * Math.sin(TAU * 5.2 * t);
        ph += (TAU * f * scoop * vib) / SR;
        a += 0.3 * (r() * 2 - 1 - a);
        b += 0.04 * (a - b);
        const sopro = (a - b) * (0.1 + 0.55 * Math.exp(-t / 0.035));
        const tom = Math.sin(ph) + 0.22 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph);
        return tom * Math.min(1, t / 0.045) * (0.92 + 0.08 * Math.sin(TAU * 3.1 * t)) + sopro;
    };
};

/** A parede invisível: "TONK" oco de painel de madeira (assinatura do Koga). */
export const tonk = som(
    0.5,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            ph += (TAU * (130 + 120 * Math.exp(-t / 0.01)) * k12(p)) / SR;
            v += 0.3 * (r() * 2 - 1 - v);
            return (
                Math.sin(ph) * Math.exp(-t / 0.09) +
                0.45 * Math.sin(TAU * 415 * k12(p) * t) * Math.exp(-t / 0.05) +
                0.4 * v * Math.exp(-t / 0.006)
            );
        };
    },
    { pk: 0.55, corte: 3500 },
);
/** Bolha de veneno: "blup" que sobe. */
export const bolha = som(
    0.12,
    (p) => {
        let ph = 0;
        return (t) => {
            ph += (TAU * k12(p) * (260 + 700 * (1 - Math.exp(-t / 0.03)))) / SR;
            return Math.sin(ph) * Math.min(1, t / 0.003) * Math.exp(-t / 0.035);
        };
    },
    { pk: 0.45 },
);
/** Fumaça de ninja: "fffsh" que escurece. */
export const fumaca = som(
    0.8,
    (_p, r) => {
        let a = 0;
        return (t) => {
            const fc = 300 + 2500 * Math.exp(-t / 0.12);
            a += (1 - Math.exp((-TAU * fc) / SR)) * (r() * 2 - 1 - a);
            return a * Math.min(1, t / 0.01) * Math.exp(-t / 0.25);
        };
    },
    { pk: 0.4 },
);

export default function temaKoga() {
    const S = new Song({ bpm: 120, bars: 27, swing: 0.05, tail: 3, loopFrom: 2 });
    const sk = voz(S, 'shakuhachi', shaku, {
        pan: -0.1,
        gain: 1.25,
        rev: 0.3,
        corte: 3800,
        echo: { rows: 3, fb: 0.2, mix: 0.15 },
    });
    const harm = S.part('terças', I.counter, { pan: 0.3, gain: 0.45, rev: 0.2 });
    const koto = S.part('koto', I.pizz, { pan: 0.35, gain: 2.8, echo: { rows: 2, fb: 0.25, mix: 0.2 } });
    const str = S.part('cordas', I.strings, { gain: 0.6, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.6 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.25, gain: 0.8 });
    const pe = S.part('passos', I.block, { drum: true, pan: 0.1, gain: 0.55 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.6 });
    const taiko = S.part('taiko', I.timp, { drum: true, gain: 0.12, rev: 0.2 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 7000, sala: 0.15 }), { drum: true, gain: 1.0 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });
    const tk = S.part('tonk', tonk, { drum: true, gain: 0.95, rev: 0.15 });
    const bo = S.part('bolhas', bolha, { drum: true, pan: 0.4, gain: 0.55, rev: 0.3 });
    const fm = S.part('fumaca', fumaca, { drum: true, gain: 0.6, rev: 0.2 });

    const ninja = (b, c, cheio = true) => {
        bass(bs, b, c, '0:3 0:3 5:2 r:2 8:1~ 0:1 s:2 5:2');
        padChord(str, b, c, 16, { low: 57, n: 3, vel: 0.7 });
        drum(k, b, 1, 'X......x..X.....');
        drum(bl, b, 1, '....x.......x..o', { pitch: -5 });
        drum(hh, b, 1, cheio ? 'x.xxx.xxx.xxx.xx' : 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        drum(taiko, b, 1, cheio ? 'X..X..X...X.X...' : 'X..X..X.........', { pitch: -7 });
        if (cheio) drum(cl, b, 1, '....x.......x...', { vel: 0.7 });
    };
    const bolhas = (b, rows, p0 = 0) =>
        rows.forEach((r, i) => {
            bo.note(b * 16 + r, p0 + i * 3, 0, 0.8);
        });

    // intro: fumaça, o taiko em 3-3-2 e uma nota longa de shakuhachi (o vibrato crescendo)
    fm.note(0, 0, 0, 1);
    drum(taiko, 0, 1, 'X..X..X.........', { pitch: -7 });
    mel(sk, 0, ['r:4 A5:12']);
    mel(sk, 1, ['r:8 B5:3 G#5:3 E5:2']);
    bass(bs, 1, 'E7', '0:8 r:8');
    drum(taiko, 1, 1, 'X..X..X.X.X.XXXX', { pitch: -7, vel: 0.8 });

    const CH = ['Am', 'Bb', 'Am', 'Gm', 'F', 'Bb', 'Dm', 'E7'];
    const SK = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'A5:2 r:1 A5:1 C6:4 Bb5:2 A5:1 G5:1 A5:4',
        'D6:3 C6:3 Bb5:2 A5:4 r:4',
        'r:16',
        'F5:1 E5:3 G#5:2 B5:2 D6:6 B5:2',
    ];
    const KOTO = [
        'r:16',
        'r:16',
        'A4:1 Bb4:1 D5:1 E5:1 G5:2 A5:2 r:2 G5:1 E5:1 D5:4',
        'Bb4:3 G4:3 D4:2 r:8',
        'r:16',
        'r:16',
        'r:2 D5:1 E5:1 F5:2 A5:2 Bb5:3 A5:1 F5:2 D5:2',
        'r:16',
    ];
    const blocoA = (b0, s) => {
        mel(sk, b0, s ? SK.slice(0, 7) : SK, { shift: s });
        mel(koto, b0, KOTO, { shift: s });
        if (s) {
            mel(harm, b0, SK.slice(0, 7), { shift: s, harm: thirdBelow(MAJOR(5 + s)) });
            // fecha no SOC-CER-MON em Si♭ menor, o koto dobrando embaixo, e o clap seco responde
            mel(sk, b0 + 7, [GANCHO.em({ menor: true, tom: -2 })]);
            mel(koto, b0 + 7, [GANCHO.em({ menor: true, tom: -2, oitava: -1 })]);
            drum(cl, b0 + 7, 1, GANCHO.palmas, { vel: 1.2 });
        }
        CH.forEach((c0, i) => {
            ninja(b0 + i, s && i === 7 ? 'Bbm' : transpose(c0, s), s > 0 || i >= 4);
        });
        bolhas(b0 + 1, [12, 13, 14], s);
        bolhas(b0 + 3, [10, 12, 14], s);
        bolhas(b0 + 6, [13, 14, 15], s);
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: as paredes invisíveis
    const anda = (b, c, pat, passos) => {
        bass(bs, b, c, pat, { vel: 0.8 });
        padChord(str, b, c, 16, { low: 57, n: 3, vel: 0.5 });
        drum(pe, b, 1, passos, { pitch: -9 });
        drum(hh, b, 1, '..x...x...x...x.', { vel: 0.4 });
    };
    // 1ª tentativa: anda pra frente, sobe... TONK no 3º tempo. Tudo para. "hm?"
    anda(10, 'Dm', '0:4 3:4 5:4 8:4', 'x...x...x...x...');
    mel(sk, 10, ['D5:2 r:2 E5:2 r:2 F5:2 r:2 A5:2 r:2']);
    anda(11, 'Dm', '0:4 3:4 r:8', 'x...x...........');
    mel(sk, 11, ['Bb5:2 r:2 D6:2 r:2 r:4 E6:1~ r:3']);
    tk.note(11 * 16 + 8, 0, 0, 1);
    // 2ª: vira e desce pro outro lado... TONK mais cedo, e as bolhas riem dele
    anda(12, 'Gm', '0:4 s:4 5:4 3:4', 'x...x...x...x...');
    mel(sk, 12, ['G5:2 r:2 F5:2 r:2 D5:2 r:2 Bb4:2 r:2']);
    anda(13, 'Gm', '0:4 r:12', 'x...............');
    mel(sk, 13, ['A4:2 r:14']);
    tk.note(13 * 16 + 4, -3, 0, 1);
    bolhas(13, [9, 10, 11, 12], 9);
    // 3ª: na ponta do pé, testando o ar com o koto... achou a passagem: a melodia escorrega e sobe
    anda(14, 'Bb', '0:4 r:4 0:4 r:4', '..x...x...x...x.');
    mel(sk, 14, ['D5:1 r:3 F5:1 r:3 Bb5:1 r:3 D6:1 r:3'], { vel: 0.7 });
    mel(koto, 14, ['r:2 F5:1 r:3 Bb5:1 r:3 D6:1 r:3 F6:1 r:1']);
    ninja(15, 'C', false);
    mel(sk, 15, ['C6:1 D6:1 E6:2 G6:4 r:2 A6:2 G6:2 E6:2']);
    mel(koto, 15, ['C5:1 E5:1 G5:1 C6:1 r:12']);
    // fumaça: o Koga aparece, o shakuhachi grita em 3-3-2 e leva pro Si♭ menor
    fm.note(16 * 16, 0, 0, 1);
    drum(cr, 16, 1, 'X...............');
    ninja(16, 'Am');
    mel(sk, 16, ['E6:3 E6:3 A6:2 G6:8']);
    ninja(17, 'F7');
    mel(sk, 17, ['F6:3 Eb6:3 C6:2 A5:8']);
    drum(taiko, 17, 1, '........X.X.XXXX', { pitch: -7 });
    bolhas(17, [12, 13, 14, 15], 3);

    // A' meio tom acima (Si♭ frígio), com terças; fecha no SOC-CER-MON
    blocoA(18, 1);
    // virada: Mi7, de volta pro Lá
    mel(sk, 26, ['E6:2 D6:2 B5:2 G#5:2 F5:2 E5:2 D5:2 B4:2']);
    ninja(26, 'E7');
    drum(taiko, 26, 1, 'X..X..X.X.X.XXXX', { pitch: -7 });
    bolhas(26, [13, 14, 15]);
    return S;
}
