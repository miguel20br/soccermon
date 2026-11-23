// Menu de Natal 2: "Trenó" (23/11/2026, Natal da 0.9.54). O pedido: mais 2 músicas de menu pro Natal, estilos
// diferentes entre si e da "Noite Feliz" (balada soul 6/8), com o SOC-CER-MON escondido. Esta é a animada, no molde da
// livre-ditto (funk animado é o padrão): FUNK DE METAIS em Si♭ maior a 112 BPM, com "Jingle Bells" (James Lord
// Pierpont, 1857, domínio público) num arranjo nosso.
// A história: o trenó do Papai Noel. Os CASCOS da rena trotam no telhado (som de assinatura, feito à mão: coco oco em
// duas alturas, "clip-clop"), o CHICOTE estala nas entradas e os guizos sacodem. O verso anda no trote; no refrão o
// naipe abre; no breque o trote vira galope, o chicote estala, o trenó DECOLA (ruído que sobe) e o refrão volta meio
// tom acima (Si maior), sem cascos: está voando. No fim os metais gritam o SOC-CER-MON, o Si maior vira o ♭II que cai
// no Fá7(♭9) e o trenó pousa: os cascos voltam a trotar e o verso recomeça.
// SOC-CER-MON escondido: o trote da intro e o ritmo da 1ª frase do verso ("Dash-ing through the snow") são 3-3-2, o
// baixo do verso abre cada compasso em 3-3-2, e o gancho inteiro aparece nos metais só no fim (com a torcida).
// Harmonia: o refrão rearmonizado (Sol7(♭9) secundário, Mi♭m6 emprestado do menor, Sol♭maj7 = ♭VI → Fá7 → Si♭).
// Forma: intro (2) | verso (16) | refrão (16) | breque, a decolagem (4) | refrão em Si (16) | pouso (2).
// Loop do compasso 2 ao fim: 54 compassos, ~116 s.
import { BATERIA, bombeio, bumbo, caixa, clapMacio, orgao, trombone, trompete, tuba } from '../album/kit.mjs';
import {
    bass,
    chord,
    drum,
    GANCHO,
    I,
    MAJOR,
    mel,
    padChord,
    Song,
    SR,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';
import { k12, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'Menu de Natal: Trenó (Jingle Bells em funk)', tela: 'Home (Natal, 30/11 a 06/01)' };

const TAU = Math.PI * 2;

/** Casco da rena: coco oco (dois tons curtos e o estalo). `pitch` 0 = "clip", −5 = "clop". */
export const casco = som(
    0.14,
    (p, r) => (t) =>
        Math.sin(TAU * 620 * k12(p) * t) * Math.exp(-t / 0.028) +
        0.55 * Math.sin(TAU * 1480 * k12(p) * t) * Math.exp(-t / 0.012) +
        0.6 * (r() * 2 - 1) * Math.exp(-t / 0.0025),
    { pk: 0.5, corte: 6000 },
);
/** Chicote: o estalo seco (dois estouros colados) e um rabo curto de ar. */
export const chicote = som(
    0.25,
    (_p, r) => {
        let a = 0;
        return (t) => {
            const n = r() * 2 - 1;
            const claro = n - a; // passa-alta: o estalo é agudo
            a += 0.3 * (n - a);
            const estalo = Math.exp(-t / 0.004) + (t > 0.011 ? 0.7 * Math.exp(-(t - 0.011) / 0.005) : 0);
            return claro * (estalo + 0.12 * Math.exp(-t / 0.06));
        };
    },
    { pk: 0.5, corte: 9000 },
);
/** A decolagem: ruído num passa-faixa que sobe de 250 Hz a 5 kHz em `seg` segundos e cresce (riser). */
export const decola = (seg) =>
    som(
        seg,
        (_p, r) => {
            let low = 0;
            let band = 0;
            return (t) => {
                const u = Math.min(1, t / seg);
                const f1 = 2 * Math.sin((Math.PI * 250 * (5000 / 250) ** u) / SR);
                const high = r() * 2 - 1 - low - 0.5 * band;
                band += f1 * high;
                low += f1 * band;
                return band * u * u * Math.min(1, (seg - t) / 0.01);
            };
        },
        { pk: 0.5 },
    );

// "Jingle Bells" (domínio público) em Si♭. Verso: a 1ª frase de cada quadra no ritmo 3-3-2 (o SOC-CER-MON escondido)
const VERSO = [
    'F4:3 D5:3 C5:2 Bb4:8',
    'F4:12 F4:2 F4:2',
    'F4:3 D5:3 C5:2 Bb4:8',
    'G4:16',
    'G4:4 Eb5:4 D5:4 C5:4',
    'A4:16',
    'F5:4 F5:4 Eb5:4 C5:4',
    'D5:16',
    'F4:3 D5:3 C5:2 Bb4:8',
    'F4:12 F4:4',
    'F4:3 D5:3 C5:2 Bb4:8',
    'G4:12 G4:4',
    'G4:4 Eb5:4 D5:4 C5:4',
    'F5:4 F5:4 F5:4 F5:4',
    'G5:4 F5:4 Eb5:4 C5:4',
    'Bb4:8 r:8',
];
const VERSO_CH = [
    'Bbmaj7',
    'Gm7',
    'Bb7',
    'Ebmaj7',
    'Cm7',
    ['Am7b5', 'D7b9'],
    ['Cm7', 'F7'],
    'Bbmaj7',
    'Bbmaj7',
    'Gm7',
    'Bb7',
    'Ebmaj7',
    'Cm7',
    'F7',
    ['Cm7', 'F7'],
    ['Bb6', 'F7'],
];
// o naipe grave responde nas notas longas do verso (pergunta e resposta)
const VERSO_RESP = {
    1: 'r:12 Bb3:2 D4:2',
    3: 'r:8 Bb3:2 C4:2 D4:2 F4:2',
    5: 'r:8 A3:2 C4:2 Eb4:2 F#4:2',
    7: 'r:8 F4:2 D4:2 Bb3:2 F3:2',
    9: 'r:12 Bb3:2 D4:2',
    11: 'r:8 Bb3:2 C4:2 D4:2 F4:2',
};
const REFRAO = [
    'D5:4 D5:4 D5:8',
    'D5:4 D5:4 D5:8',
    'D5:4 F5:4 Bb4:6 C5:2',
    'D5:16',
    'Eb5:4 Eb5:4 Eb5:6 Eb5:2',
    'Eb5:4 D5:4 D5:4 D5:2 D5:2',
    'D5:4 C5:4 C5:4 D5:4',
    'C5:8 F5:8',
    'D5:4 D5:4 D5:8',
    'D5:4 D5:4 D5:8',
    'D5:4 F5:4 Bb4:6 C5:2',
    'D5:16',
    'Eb5:4 Eb5:4 Eb5:6 Eb5:2',
    'Eb5:4 D5:4 D5:4 D5:2 D5:2',
    'F5:4 F5:4 Eb5:4 C5:4',
    'Bb4:16',
];
const REFRAO_CH = [
    'Bbmaj7',
    'Gm7',
    ['Cm7', 'F7'],
    ['Bbmaj7', 'Bb7'],
    'Ebmaj7',
    ['Ebm6', 'Bbmaj7'],
    'C9',
    ['Cm7', 'F7sus4'],
    'Bbmaj7',
    'G7b9',
    ['Cm7', 'F7'],
    ['Bbmaj7', 'Bb7'],
    'Ebmaj7',
    ['Ebm6', 'Bbmaj7'],
    ['Gbmaj7', 'F7'],
    'Bb6',
];
// o órgão responde nas notas longas do refrão
const REFRAO_RESP = {
    3: 'r:8 F5:2 G5:2 Ab5:2 Bb5:2',
    7: 'r:10 Bb5:2 C6:2 Eb6:2',
    11: 'r:8 F5:2 G5:2 Ab5:2 Bb5:2',
};

export default function menuNatalTreno() {
    const S = new Song({ bpm: 112, bars: 56, swing: 0.1, tail: 4, loopFrom: 2, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.5 });
    const duck = bombeio(S, k, { prof: 0.25, solta: 0.14 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.55, rev: 0.08 });
    const cl = S.part('clap', clapMacio, { drum: true, gain: 0.9, rev: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.9 });
    const oh = S.part('chimbalAberto', I.ohat, { drum: true, pan: 0.3, gain: 0.5 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.45 });
    const gz = S.part('guizos', I.sleigh, { drum: true, pan: 0.4, gain: 2.6 });
    const cs = S.part('cascos', casco, { drum: true, pan: -0.35, gain: 0.75, rev: 0.12 });
    const ch = S.part('chicote', chicote, { drum: true, pan: 0.25, gain: 0.7, rev: 0.2 });
    const up = S.part('decola', decola((4 * 60 * 2) / 112), { drum: true, gain: 0.5, rev: 0.2 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 1.6, rev: 0.15 });
    const tp = trompete(S, 'trompete', {
        pan: -0.1,
        gain: 0.85,
        rev: 0.15,
        corte: 3200,
        echo: { rows: 3, fb: 0.15, mix: 0.1 },
    });
    const tb = trombone(S, 'trombone', { pan: 0.25, gain: 0.55, rev: 0.15 });
    const tu = tuba(S, 'tuba', { gain: 0.5, rev: 0.08 });
    const og = orgao(S, 'orgao', { pan: 0.3, gain: 0.55, rev: 0.25, gainAt: duck });
    const ogS = orgao(S, 'orgaoSolo', { pan: -0.25, gain: 0.8, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const clav = S.part('clav', I.clav, { pan: -0.4, gain: 0.8, corte: 3500, gainAt: duck });
    const bs = S.part('baixo', I.slap, { gain: 0.75, gainAt: duck });

    /** Raiz do acorde na região do baixo (a mesma conta do `bass`). */
    const raiz = (sym) => 33 + ((chord(sym).root - 9 + 12) % 12);
    const par = (c) => (Array.isArray(c) ? c : [c, c]);
    const sobe = (c, s) => par(c).map((x) => transpose(x, s));

    /** Um compasso de banda: baixo (3-3-2 no 1 quando o acorde é um só), clav no contratempo, órgão se `cheio`. */
    const banda = (b, c, { cheio = false, vel = 1 } = {}) => {
        const [c1, c2] = par(c);
        if (c1 === c2) bass(bs, b, c1, '0:3 0:3 8:2 r:2 5:1 s:1 8:2 5:2', { vel });
        else
            for (const [i, x] of [c1, c2].entries()) {
                bs.note(b * 16 + i * 8, raiz(x), 3, vel);
                bs.note(b * 16 + i * 8 + 3, raiz(x) + 12, 1, vel * 0.7);
                bs.note(b * 16 + i * 8 + 6, raiz(x) + 7, 2, vel * 0.85);
            }
        stabs(clav, b, c1, [2, 6], { low: 60, n: 3, vel: 0.8 * vel });
        stabs(clav, b, c2, [10, 14], { low: 60, n: 3, vel: 0.8 * vel });
        if (cheio) {
            padChord(og, b, c1, c1 === c2 ? 16 : 8, { low: 55, n: 4, vel: 0.7 });
            if (c1 !== c2) padChord(og, b, c2, 8, { low: 55, n: 4, vel: 0.7, at: 8 });
        }
    };
    /** Bateria de funk: bumbo antecipado, caixa com fantasmas, clap no 2 e no 4, chimbal do partido-alto. */
    const bateria = (b, { quente = false, guizos = 1, cascos = false } = {}) => {
        drum(k, b, 1, quente ? 'X.....x.X.x...x.' : 'X.....x...X.....');
        drum(sn, b, 1, '....X..o.o..X..o', { vel: 0.8 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.8 });
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.7 });
        if (quente) drum(oh, b, 1, '......x.......x.');
        if (guizos) drum(gz, b, 1, 'xoxoXoxoxoxoXoxo', { vel: 0.7 * guizos });
        if (cascos) drum(cs, b, 1, 'x..o..x...x.o...', { pitch: 0, vel: 0.8 });
    };

    // ---------- intro (0-1): o trote no telhado em 3-3-2, o chicote, e o naipe chama no Fá7 ----------
    drum(cs, 0, 1, 'x..o..x.x..o..x.', { vel: 0.9 });
    drum(cs, 0, 1, '...x.......x....', { pitch: -5, vel: 0.6 });
    drum(gz, 0, 1, '......x.o.x.o.xo', { vel: 0.6 });
    drum(ch, 1, 1, 'x...............');
    drum(cs, 1, 1, 'x..o..x.x..o..x.', { vel: 0.9 });
    drum(gz, 1, 1, 'xoxoXoxoxoxoXoxo', { vel: 0.6 });
    stabs(tb, 1, 'F7', [[0, 6]], { low: 51, n: 3, vel: 0.8 });
    mel(tp, 1, ['r:8 F5:2 G5:2 A5:2 C6:2'], { vel: 0.7 });
    bass(bs, 1, 'F7', '0:6 r:2 l:2 2:2 3:2 5:2');
    drum(sn, 1, 1, '........x.xxXxXX', { vel: 0.7 });

    // ---------- verso (2-17): o trompete no trote, o naipe grave responde; os cascos marcam como agogô ----------
    mel(tp, 2, VERSO);
    VERSO_CH.forEach((c, i) => {
        const b = 2 + i;
        banda(b, c, { cheio: i >= 8, vel: 0.9 });
        bateria(b, { guizos: i >= 8 ? 1 : 0.5, cascos: true });
        const r = VERSO_RESP[i];
        if (r) {
            mel(tb, b, [r], { vel: 0.85 });
            mel(tu, b, [r], { shift: -12, vel: 0.6 });
        }
    });
    drum(cr, 2, 1, 'X...............');
    // fim do verso: o naipe sobe pro refrão e o chicote estala no 1
    mel(tb, 17, ['r:8 F3:2 A3:2 C4:2 Eb4:2']);
    mel(tu, 17, ['r:8 F2:2 A2:2 C3:2 Eb3:2'], { vel: 0.6 });
    drum(sn, 17, 1, '........x.xxXxXX', { vel: 0.8 });

    // ---------- refrão (18-33) e refrão em Si (38-53) ----------
    const refrao = (b0, s, voando) => {
        mel(tp, b0, REFRAO, { shift: s });
        mel(tb, b0, REFRAO, { shift: s - 12, harm: thirdBelow(MAJOR((10 + s) % 12)) });
        REFRAO_CH.forEach((c, i) => {
            const b = b0 + i;
            banda(b, sobe(c, s), { cheio: true });
            bateria(b, { quente: true, guizos: 1.3, cascos: !voando });
            if (REFRAO_RESP[i]) mel(ogS, b, [REFRAO_RESP[i]], { shift: s });
            // "jingle bells": a nota longa do 3 ganha a sacudida dos guizos
            if (i % 8 < 2) drum(gz, b, 1, '........XxXxXxXo', { vel: 0.9 });
        });
        drum(ch, b0, 1, 'x...............');
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 8, 1, 'X...............', { vel: 0.8 });
        drum(sn, b0 + 7, 1, '............xxXX', { vel: 0.7 });
        if (voando) {
            // voando: o órgão canta por cima em notas longas (as terças de cima do acorde)
            mel(
                og,
                b0,
                ['F5:16', 'F5:16', 'Eb5:8 Eb5:8', 'D5:8 Ab5:8', 'G5:16', 'Gb5:8 F5:8', 'E5:16', 'Eb5:8 Eb5:8'],
                { shift: s, vel: 0.8 },
            );
        }
    };
    refrao(18, 0, false);

    // ---------- breque (34-37): o trote vira galope, o chicote, o trenó decola; Fá#7(♭9) leva ao Si ----------
    for (const b of [34, 35]) {
        padChord(og, b, 'F7sus4', 16, { low: 53, n: 4, vel: 0.55 });
        bass(bs, b, 'F7sus4', '0:2 r:2 0:2 r:2 0:2 r:2 0:2 8:2', { vel: 0.85 });
    }
    drum(cs, 34, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.9 });
    drum(cs, 34, 1, '..x...x...x...x.', { pitch: -5, vel: 0.5 });
    drum(gz, 34, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.8 });
    drum(cs, 35, 1, 'xoxoxoxoxoxoxoxo', { vel: 1 });
    drum(gz, 35, 1, 'xoxoxoxoXoxoXoXo', { vel: 1 });
    drum(k, 35, 1, 'X.......X.......', { vel: 0.7 });
    drum(ch, 36, 1, 'x.......x.......');
    up.note(36 * 16, 0, 0, 1);
    stabs(tb, 36, 'F7', [[0, 6]], { low: 51, n: 3 });
    stabs(tb, 36, 'F#7sus4', [[8, 6]], { low: 51, n: 3 });
    mel(tp, 36, ['C5:4 C#5:4 D5:4 D#5:4']);
    bass(bs, 36, 'F7', '0:4 0:4 8:4 5:4');
    drum(gz, 36, 1, 'XxXxXxXxXxXxXxXx', { vel: 0.9 });
    stabs(tb, 37, 'F#7b9', [[0, 12]], { low: 52, n: 4 });
    stabs(og, 37, 'F#7b9', [[0, 12]], { low: 58, n: 4, vel: 0.8 });
    mel(tp, 37, ['E5:4 F#5:4 A#5:4 r:4']);
    bass(bs, 37, 'F#7b9', '0:4 5:4 8:4 r:4');
    drum(sn, 37, 1, 'xxxxxxxxXXXXXX..');
    drum(gz, 37, 1, 'XxXxXxXxXxXxXx..', { vel: 1 });

    // ---------- refrão em Si (38-53): voando, sem cascos, o órgão canta por cima ----------
    refrao(38, 1, true);

    // ---------- pouso (54-55): o SOC-CER-MON nos metais com a torcida; Si (♭II) cai no Fá7(♭9); os cascos voltam ----------
    const g = GANCHO.em({ tom: -1 }); // em Si: Fá# Ré# Si
    mel(tp, 54, [g]);
    mel(tb, 54, [g], { shift: -12, harm: thirdBelow(MAJOR(11)) });
    mel(tu, 54, [g], { shift: -24, vel: 0.7 });
    drum(gang, 54, 1, GANCHO.palmas);
    drum(ch, 54, 1, 'x...............');
    drum(cr, 54, 1, 'X...............');
    drum(k, 54, 1, 'X..X..X.........');
    bass(bs, 54, 'B6', '0:3 0:3 8:6 r:4');
    padChord(og, 54, 'B6', 12, { low: 54, n: 4 });
    drum(hh, 54, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.6 });
    stabs(tb, 55, 'F7b9', [[0, 10]], { low: 51, n: 4, vel: 0.8 });
    padChord(og, 55, 'F7b9', 12, { low: 57, n: 4, vel: 0.7 });
    bass(bs, 55, 'F7', '0:6 r:2 5:2 3:2 2:2 l:2');
    drum(cs, 55, 1, '....x..o..x.x..o', { vel: 0.9 });
    drum(cs, 55, 1, '.......x.......x', { pitch: -5, vel: 0.6 });
    drum(gz, 55, 1, '....x.o.x.o.xoxo', { vel: 0.7 });
    drum(k, 55, 1, 'X...............');
    return S;
}
