// Menu de Natal 3: "Luzes da árvore" (23/11/2026, Natal da 0.9.54). O pedido: mais 2 músicas de menu pro Natal,
// diferentes entre si e da "Noite Feliz" (balada 6/8) e do "Trenó" (funk de metais). Esta é a de régua da "Sala do
// chefe": SOUL-JAZZ DE ÓRGÃO em shuffle, Mi♭ maior a 96 BPM, com "Deck the Halls" (canção galesa, domínio público)
// num arranjo nosso: o órgão canta "Deck the halls with boughs of holly" e o NAIPE GRAVE (trombones e tuba) responde
// o "fa-la-la-la-la" (pergunta e resposta), Rhodes no comping, clap 808 molhado no 2 e no 4, baixo andando.
// A história: as luzes da árvore. Som de assinatura: os BANCOS DE LUZ (o "TUNK" do relé e o zumbido afinado, os do
// "Ginásio vazio") acendem um por compasso, cada um numa nota do acorde, enquanto o órgão faz o clichê cromático
// (Mi♭, Mi♭maj7, Mi♭7, Mi♭6). As bolas de vidro (celesta) tilintam quando o naipe termina a frase. A CEIA (ponte): o
// clima vira lounge em Si maior7 (♭VI), trompete abafado, Lá♭m6 emprestado, Dó7(♭9), e cai de surpresa no Fá#m7 → Si7(♭9).
// As luzes APAGAM (breque): sobra o bumbo, o clap molhado e o clichê em Mi; os bancos religam um por tempo e tudo volta
// meio tom acima (Mi maior). No fim o naipe troca o último "fa-la-la" pelo SOC-CER-MON, a banda corta num Mi maior7
// (o ♭II de Mi♭, que leva de volta ao começo) e as luzes apagam pra acender de novo na volta.
// Forma: luzes (4) | A (16) | ceia (8) | apagão (4) | A' em Mi (16) | final (4). Loop inteiro (52 compassos, 130 s).
import {
    BATERIA,
    baixoDedo,
    bombeio,
    bumbo,
    caixa,
    celesta,
    clapMolhado,
    orgao,
    rhodes,
    trombone,
    trompete,
    tuba,
} from '../album/kit.mjs';
import {
    chord,
    drum,
    GANCHO,
    I,
    MAJOR,
    mel,
    midi,
    noteName,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';
import { desliga, luz } from './livre-ginasio.mjs';

export const meta = {
    titulo: 'Menu de Natal: Luzes da árvore (Deck the Halls em soul-jazz)',
    tela: 'Home (Natal, 30/11 a 06/01)',
};

// "Deck the Halls" (domínio público) em Mi♭: cada frase = 2 compassos do órgão ("Deck the halls…") + 2 do naipe ("fa-la-la")
const DECK = ['Bb4:6 Ab4:2 G4:4 F4:4', 'Eb4:4 F4:4 G4:4 Eb4:4'];
const FALA = ['F4:2 G4:2 Ab4:2 F4:2 G4:6 F4:2', 'Eb4:4 D4:4 Eb4:8'];
const DON = ['F4:6 G4:2 Ab4:4 F4:4', 'G4:6 Ab4:2 Bb4:4 F4:4'];
const FALA3 = ['G4:2 A4:2 Bb4:4 C5:2 D5:2 Eb5:4', 'D5:4 C5:4 Bb4:8'];
const FALA4 = ['C5:2 C5:2 C5:2 C5:2 Bb4:6 Ab4:2', 'G4:4 F4:4 Eb4:8'];
const MELODIA = [...DECK, ...FALA, ...DECK, ...FALA, ...DON, ...FALA3, ...DECK, ...FALA4];
// rearmonizada: Dó7(♭9) e Mi♭7 de passagem, Si♭7(♭9) na meia cadência, Lá♭m6 emprestado, Sol♭7 que leva à ceia
const CH = [
    'Ebmaj7',
    ['Abmaj7', 'Cm7'],
    ['Fm7', 'Bb7'],
    ['Ebmaj7', 'C7b9'],
    ['Fm7', 'Bb7'],
    ['Gm7', 'C7b9'],
    ['Fm7', 'Bb7'],
    ['Ebmaj7', 'Eb7'],
    'Abmaj7',
    ['Gm7', 'C7sus4'],
    'F9',
    ['Bb7', 'Bb7b9'],
    'Ebmaj7',
    ['Abmaj7', 'Abm6'],
    ['Fm7', 'Bb7'],
    ['Ebmaj7', 'Gb7'],
];
// a ceia: Si maior7 (♭VI), lounge; o trompete abafado brinca com o "Deck" em outros acordes
const CEIA_CH = ['Bmaj7', ['Bbm7', 'Eb7'], 'Abmaj7', 'Abm6', 'Gm7', ['Gm7', 'C7b9'], 'F#m7', 'B7b9'];
const CEIA_TP = [
    'F#5:6 E5:2 D#5:4 C#5:4',
    'F5:6 Eb5:2 Db5:4 C5:4',
    'Bb4:2 C5:2 Eb5:4 G5:8',
    'F5:6 Eb5:2 B4:8',
    'Bb4:6 A4:2 G4:4 F4:4',
    'D5:4 F5:4 E5:4 Db5:4',
    'C#5:6 B4:2 A4:4 E5:4',
    'D#5:4 F#5:4 A5:4 C6:4',
];

export default function menuNatalArvore() {
    const S = new Song({
        bpm: 96,
        bars: 52,
        swing: 0.3,
        swingUnit: 8,
        tail: 5,
        loopFrom: 0,
        barramentos: { bateria: BATERIA },
    });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.65 });
    const duck = bombeio(S, k, { prof: 0.2, solta: 0.18 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.4, rev: 0.12 });
    const cl = S.part('clap', clapMolhado, { drum: true, gain: 1.1, rev: 0.25, pan: 0.05 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.4 });
    const lz = S.part('luzes', luz, { drum: true, pan: -0.2, gain: 0.45, rev: 0.3 });
    const dl = S.part('apagão', desliga, { drum: true, pan: -0.2, gain: 0.5, rev: 0.3 });
    const og = orgao(S, 'orgao', { pan: -0.1, gain: 1.5, rev: 0.22, echo: { rows: 3, fb: 0.15, mix: 0.12 } });
    const ogC = orgao(S, 'orgaoCliche', { pan: 0.2, gain: 0.6, rev: 0.3, gainAt: duck });
    const rh = rhodes(S, 'rhodes', { pan: 0.25, gain: 0.4, rev: 0.25, gainAt: duck });
    const tp = trompete(S, 'trompete', { pan: -0.2, gain: 0.75, rev: 0.3, corte: 2400 });
    const tb = trombone(S, 'trombones', { pan: -0.1, gain: 0.85, rev: 0.2 });
    const tb2 = trombone(S, 'terças', { pan: 0.3, gain: 0.6, rev: 0.2 });
    const tu = tuba(S, 'tuba', { gain: 0.45, rev: 0.1 });
    const cel = celesta(S, 'bolas', { pan: 0.45, gain: 0.55, rev: 0.4, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const bs = baixoDedo(S, 'baixo', { gain: 0.32, gainAt: duck });

    const par = (c) => (Array.isArray(c) ? c : [c, c]);
    /** Raiz do acorde na região do baixo (Lá1 a Sol#2). */
    const raiz = (sym) => 33 + ((chord(sym).root - 9 + 12) % 12);
    /** Baixo andando em semínimas: raiz, terça ou quinta, e a nota cromática que chega na raiz do próximo. */
    const anda = (b, c, prox, vel = 1) => {
        const [c1, c2] = par(c);
        const r1 = raiz(c1);
        const alvo = raiz(prox);
        const t3 = r1 + chord(c1).tones[1];
        const chega = (de) =>
            [alvo - 1, alvo + 1, alvo + 11, alvo + 13].sort((x, y) => Math.abs(x - de) - Math.abs(y - de))[0];
        const notas = c1 === c2 ? [r1, t3, r1 + 7, chega(r1 + 7)] : [r1, r1 + 7, raiz(c2), chega(raiz(c2))];
        notas.forEach((m, i) => {
            bs.note(b * 16 + i * 4, m, 4, vel * (i ? 0.85 : 1));
        });
    };
    /** Comping do Rhodes no shuffle: o acorde no 1 (curto) e na antecipação do 3 (o "e" do 2). */
    const comping = (b, c, vel = 1) => {
        const [c1, c2] = par(c);
        stabs(rh, b, c1, [[0, 3]], { low: 55, n: 4, vel: 0.6 * vel });
        stabs(rh, b, c2, [[6, 6]], { low: 55, n: 4, vel: 0.7 * vel });
    };
    /** Shuffle: bumbo no 1 e no "e" do 2, clap molhado no 2 e no 4, chimbal em colcheias (balançadas pelo swing). */
    const groove = (b, { cheio = true } = {}) => {
        drum(k, b, 1, cheio ? 'X.....x...X.....' : 'X.........x.....');
        drum(cl, b, 1, '....X.......X...', { vel: cheio ? 0.9 : 0.75 });
        drum(hh, b, 1, 'x.x.X.x.x.x.X.x.', { vel: cheio ? 0.6 : 0.4 });
        if (cheio) drum(sn, b, 1, '..o.......o...o.', { vel: 0.8 });
    };
    /** O clichê cromático (as luzes): Mi♭, Mi♭maj7, Mi♭7, Mi♭6 no órgão, a voz de cima descendo; um banco de luz por compasso. */
    const cliche = (b0, s, { luzes = true, vel = 1 } = {}) => {
        ['Eb5', 'D5', 'Db5', 'C5'].forEach((v, i) => {
            const b = b0 + i;
            for (const n of ['Eb4', 'G4', 'Bb4', v]) ogC.note(b * 16, midi(n) + s, 16, vel * 0.8);
            bs.note(b * 16, midi('Eb2') + s, 6, vel);
            bs.note(b * 16 + 10, midi('Bb1') + s, 4, vel * 0.8);
            // o banco de luz (zumbido afinado a partir do Lá2): Mi♭, Sol, Si♭, Ré do acorde
            if (luzes) lz.note(b * 16, [6, 10, 13, 17][i] + s, 0, 0.9);
        });
    };

    // ---------- as luzes (0-3): acendem uma por compasso; o clap molhado lento chega no 2º ----------
    cliche(0, 0);
    drum(k, 0, 4, 'X...............', { vel: 0.7 });
    drum(cl, 1, 3, '........X.......', { vel: 0.8 });
    drum(hh, 2, 2, 'x...x...x...x...', { vel: 0.35 });
    mel(cel, 3, ['r:8 Bb5:2 D6:2 F6:2 Bb6:2']);
    drum(sn, 3, 1, '............xxXX', { vel: 0.6 });

    // ---------- A (4-19) e A' em Mi (36-51): o órgão pergunta, o naipe responde o fa-la-la ----------
    const bloco = (b0, s, final) => {
        const tercas = thirdBelow(MAJOR((3 + s) % 12));
        for (let f = 0; f < 4; f++) {
            const b = b0 + f * 4;
            // o órgão: "Deck the halls…" (no A' canta a frase inteira, com o trompete dobrando no fa-la-la)
            const canto = MELODIA.slice(f * 4, f * 4 + (final ? 4 : 2));
            if (final && f === 3) canto[2] = 'r:16'; // o órgão respira enquanto o naipe grita o gancho
            mel(og, b, canto, { shift: s + 12 });
            // o naipe: o fa-la-la (no fim do A' o último vira o SOC-CER-MON)
            const fala = MELODIA.slice(f * 4 + 2, f * 4 + 4);
            if (final && f === 3) fala[0] = GANCHO.em({ tom: 3, oitava: -1 });
            mel(tb, b + 2, fala, { shift: s - 12 });
            mel(tb2, b + 2, fala, { shift: s - 12, harm: tercas });
            mel(tu, b + 2, fala, { shift: s - 24, vel: 0.8 });
            if (final) mel(tp, b + 2, fala, { shift: s, vel: 0.6 });
            // as bolas de vidro tilintam no fim do fa-la-la
            const [c1] = par(CH[f * 4 + 3]);
            const ac = chord(transpose(c1, s));
            const [r, t, q] = [0, 1, 2].map((i) => noteName(ac.root + ac.tones[i] + 72));
            mel(cel, b + 3, [`r:8 ${r}:2 ${t}:2 ${q}:4`], { vel: 0.8 });
        }
        CH.forEach((c0, i) => {
            const b = b0 + i;
            const c = par(c0).map((x) => transpose(x, s));
            const prox = i < 15 ? transpose(par(CH[i + 1])[0], s) : final ? 'E6' : 'Bmaj7';
            anda(b, c, prox);
            comping(b, c, final ? 1.1 : 1);
            groove(b);
        });
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 8, 1, 'X...............', { vel: 0.7 });
        drum(sn, b0 + 7, 1, '..........x.xxXX', { vel: 0.6 });
    };
    bloco(4, 0, false);

    // ---------- a ceia (20-27): lounge em Si maior7, trompete abafado, Rhodes; o naipe só sustenta ----------
    mel(tp, 20, CEIA_TP);
    CEIA_CH.forEach((c, i) => {
        const b = 20 + i;
        const prox = par(CEIA_CH[i + 1] ?? 'E')[0];
        anda(b, c, prox, 0.85);
        comping(b, c, 0.9);
        drum(k, b, 1, 'X.........x.....', { vel: 0.7 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.55 });
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.35 });
    });
    // o naipe entra nas notas-guia (sétima → terça) e sobe pro Mi
    mel(tb, 24, ['F4:16', 'F4:8 E4:8', 'E4:16', 'A3:4 C4:4 D#4:4 F#4:4'], { vel: 0.55 });

    // ---------- o apagão (28-31): as luzes apagam; o clichê em Mi; os bancos religam um por tempo ----------
    for (const n of ['E3', 'G#3', 'B3', 'D#4']) tb.note(28 * 16, midi(n), 2, 0.9);
    drum(cr, 28, 1, 'X...............', { vel: 0.8 });
    dl.note(28 * 16 + 2, 7, 0, 1);
    cliche(28, 1, { luzes: false, vel: 0.9 });
    drum(k, 28, 4, 'X.........x.....', { vel: 0.8 });
    drum(cl, 29, 3, '........X.......', { vel: 1.1 });
    for (const [i, p] of [7, 11, 14, 18].entries()) lz.note(31 * 16 + i * 4, p, 0, 0.8);
    drum(sn, 31, 1, '............xxXX', { vel: 0.7 });

    // ---------- A' em Mi (32-47) ----------
    bloco(32, 1, true);

    // ---------- final (48-51): o SOC-CER-MON de novo com o clap; a banda corta no Mi maior7 (♭II de Mi♭); apaga ----------
    const g = GANCHO.em({ tom: 4, oitava: -1 }); // em Mi: Si Sol# Mi
    mel(tb, 48, [g], { shift: -12 });
    mel(tb2, 48, [g], { shift: -12, harm: thirdBelow(MAJOR(4)) });
    mel(tu, 48, [g], { shift: -24 });
    mel(og, 48, [GANCHO.em({ tom: 4 })], { vel: 0.8 });
    drum(cl, 48, 1, '............X.X.', { vel: 1.1 });
    drum(k, 48, 1, 'X..X..X.........');
    drum(cr, 48, 1, 'X...............');
    mel(bs, 48, ['E2:3 E2:3 E3:6 r:4']);
    padChord(rh, 48, 'E6', 16, { low: 56, n: 4, vel: 0.6 });
    // 49-50: o clichê em Mi no órgão, o naipe desce
    cliche(49, 1, { luzes: false, vel: 0.85 });
    groove(49, { cheio: false });
    groove(50, { cheio: false });
    mel(tb, 49, ['G#3:6 F#3:2 E3:4 D#3:4', 'C#3:4 B2:4 C#3:4 D#3:4'], { vel: 0.8 });
    mel(tu, 49, ['E2:16', 'A1:8 B1:8'], { vel: 0.6 });
    // 51: a banda corta no 1 (Mi maior7 com a nona), sobra o órgão, um clap molhado, e as luzes apagam
    for (const n of ['E3', 'G#3', 'D#4', 'F#4', 'B4']) og.note(51 * 16, midi(n), 6, 0.8);
    for (const [P, n] of [
        [tb, 'E3'],
        [tu, 'E2'],
        [bs, 'E2'],
    ])
        P.note(51 * 16, midi(n), 2, 1);
    drum(k, 51, 1, 'X...............');
    drum(cr, 51, 1, 'X...............', { vel: 0.8 });
    drum(cl, 51, 1, '........X.......', { vel: 1.2 });
    dl.note(51 * 16 + 12, 6, 0, 0.8);
    return S;
}
