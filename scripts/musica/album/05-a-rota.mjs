// Faixa 5, "A Rota" (suíte), rodada 4 (23/11/2026). Junta "Gotas na caverna" ("ideias boas, genérica") e "Barco e
// gaivota" ("mais criativa, tem seu apelo, falta algo") numa viagem só; "Pé na estrada" ("super genérica a
// progressão") saiu do álbum. Não é mais o loop do jogo esticado: é uma peça escrita pro álbum, com um protagonista,
// a OCARINA do viajante, que atravessa a suíte inteira (na caverna e no barco), e a mesma tônica, Ré, do começo ao fim:
// o que muda é a LUZ, de Ré frígio (o modo mais escuro) a Ré lídio (o mais claro).
//
// I. A CAVERNA (4/4, 132 BPM)
//   A entrada (0-3): só as gotas, afinadas (elas tocam o acorde, com eco), e o baixo insistente que chega de longe.
//   A caverna (4-11): o tema da caverna na ocarina, os cristais (celesta) respondendo nas notas longas. A harmonia
//     saiu do lugar comum (era Rém, Si♭, Dó, Lá7): Rém9, Mi♭maj7 (o ♭II frígio), Lám7, Lá7(♭9), Rém9, Solm9,
//     Mim7(♭5), Lá7(♭9).
//   O eco (12-19): a caverna devolve a frase um compasso depois e uma oitava abaixo (cânone a duas vozes) em cima
//     do pedal de Ré, com o Mi♭ frígio; a bateria quase some pra deixar o eco aparecer.
//   A câmara de cristal (20-27): meio-tempo, os cristais cantam lá em cima, o arpejo anda de 3 em 3 por cima do
//     compasso de 4 (hemíola: a 1ª pista do mar que vem) e o Si♭ menor emprestado antes do Lá7.
//   A luz (28-33): a saída. A mesma frase seis vezes em cima do Ré, e a cada compasso a escala clareia UMA nota:
//     frígio (Mi♭), eólio (Mi), dórico (Si), mixolídio (Fá#: o menor vira maior), jônio (Dó#), lídio (Sol#). A
//     celesta acende a nota que mudou. No último, a 1ª onda, a gaivota, e o shaker já toca em 3.
// II. O MAR (6/8, 99 BPM: o compasso dura o mesmo 1,82 s, só o pulso passa de 4 pra 3; modulação métrica)
//   O cais (0-1) | A (2-9): o tema do barco na ocarina, a gaivota de verdade nas pausas | A2 (10-17): os trombones
//     nas notas-guia, a tuba no um-pá, a gaivota responde | a ponte (18-25): Si menor, os metais em terças e o
//     SOC-CER-MON em 6/8 com as bolhas.
//   A tempestade (26-33): Ré menor; os trombones e a tuba tocam o TEMA DA CAVERNA (o perigo volta, agora no mar), o
//     compasso balança entre 6/8 e 3/4 (o barco adernando), as ondas quebram, o Mi♭ (o ♭II) volta no 7º compasso.
//   A calmaria (34-49): o sol volta no Ré lídio e o trombone sola dois coros; a ocarina comenta.
//   A chegada (50-58): o Si♭7 leva meio tom acima (Mi♭ lídio) com tudo, e na 2ª metade os trombones tocam o tema
//     da caverna em MAIOR por baixo do tema do barco: os dois lugares juntos. As gotas voltam como brilho.
//   O fim (59-62): terra à vista, Mi♭maj7, Fá sobre Mi♭ (o lídio), Mi♭maj7 e as bolhas subindo; e a última gota da
//     caverna, sozinha, com eco.
// ~3:00. Faixa calma: −16 LUFS.
import { arp, bass, drum, GANCHO, I, mel, padChord, Song, SR, thirdBelow, transpose } from '../synth.mjs';
import { aro, BATERIA, baixoDedo, bumbo, celesta, trombone, tuba } from './kit.mjs';
import { gaivota, gota, notas, ocarina, onda } from './kit-novas.mjs';

export const meta = { titulo: 'A Rota', faixa: 5, lufs: -16 };

// ---------- I. a caverna ----------
const A = [
    'D5:4 F5:4 A5:6 G5:2',
    'F5:4 D5:4 Bb4:8',
    'C5:2 E5:2 G5:4 F5:2 E5:2 C5:4',
    'C#5:8 E5:4 A4:4',
    'D5:4 F5:4 A5:4 D6:4',
    'C6:2 Bb5:2 A5:4 F5:4 D5:4',
    'E5:2 F5:2 G5:4 A5:2 Bb5:2 G5:4',
    'A5:8 G5:2 F5:2 E5:2 C#5:2',
];
const A_CH = ['Dm9', 'Ebmaj7', 'Am7', 'A7b9', 'Dm9', 'Gm9', 'Em7b5', 'A7b9'];
const CRISTAIS = ['r:16', 'r:8 D6:2 F6:2 Bb6:4', 'r:16', 'r:8 E6:2 G6:2 A6:4', 'r:16', 'r:16', 'r:16', 'r:16'];
// a gota de cada compasso: [linha, semitons a partir do Ré6] (notas do acorde)
const GOTAS_A = [
    [[10, -5]],
    [
        [6, -2],
        [14, 1],
    ],
    [[10, -5]],
    [
        [6, -1],
        [14, -5],
    ],
    [[10, 3]],
    [
        [6, -7],
        [14, 0],
    ],
    [[10, -4]],
    [
        [6, -1],
        [14, -5],
    ],
];
const ECO_CH = ['Dm', 'Eb', 'Dm', 'A7', 'Dm', 'Eb', 'C', 'A7'];
const CAMARA = [
    ['Gm', 'D6:4 Bb5:4 G5:8', 'Bb4:16'],
    ['Ebmaj7', 'G5:4 Bb5:4 D6:8', 'Bb4:16'],
    ['Bb', 'F6:6 D6:2 Bb5:8', 'D5:16'],
    ['A7', 'E6:8 C#6:8', 'C#5:16'],
    ['Gm', 'G6:4 F6:4 D6:8', 'Bb4:16'],
    ['Ebmaj7', 'Eb6:4 D6:4 Bb5:8', 'G4:16'],
    ['Bbm', 'Db6:6 C6:2 Bb5:8', 'F4:16'],
    ['A7', 'C#6:4 E6:4 A6:8', 'E4:16'],
];
// a luz: os seis modos de Ré, do mais escuro ao mais claro, e a nota que clareou em cada um (grau da escala)
const MODOS = [
    ['frígio', [0, 1, 3, 5, 7, 8, 10], null, ['D3', 'A3', 'Eb4', 'F4']],
    ['eólio', [0, 2, 3, 5, 7, 8, 10], 2, ['D3', 'A3', 'E4', 'F4']],
    ['dórico', [0, 2, 3, 5, 7, 9, 10], 6, ['D3', 'A3', 'B3', 'F4']],
    ['mixolídio', [0, 2, 4, 5, 7, 9, 10], 3, ['D3', 'A3', 'C4', 'F#4']],
    ['jônio', [0, 2, 4, 5, 7, 9, 11], 7, ['D3', 'A3', 'C#4', 'F#4']],
    ['lídio', [0, 2, 4, 6, 7, 9, 11], 4, ['D3', 'A3', 'C#4', 'G#4']],
];
// a frase da luz em graus (8 = oitava) e durações
const LUZ = [
    [1, 2],
    [2, 2],
    [3, 3],
    [5, 1],
    [4, 2],
    [6, 2],
    [7, 2],
    [8, 2],
];

export function caverna() {
    const S = new Song({ bpm: 132, bars: 34, tail: 6, barramentos: { bateria: BATERIA } });
    const oc = ocarina(S, 'ocarina', { pan: -0.1, gain: 1, rev: 0.35, echo: { rows: 6, fb: 0.3, mix: 0.25 } });
    const eco = ocarina(S, 'eco', {
        pan: 0.4,
        gain: 0.7,
        rev: 0.5,
        corte: 2200,
        echo: { rows: 6, fb: 0.45, mix: 0.45 },
    });
    const ce = celesta(S, 'cristais', { pan: 0.45, gain: 0.55, rev: 0.45, echo: { rows: 3, fb: 0.3, mix: 0.3 } });
    const ar3 = celesta(S, 'arpejo', { pan: -0.35, gain: 0.35, rev: 0.3, corte: 4000 });
    const go = S.part('gotas', gota, {
        drum: true,
        pan: -0.4,
        gain: 0.8,
        rev: 0.4,
        echo: { rows: 6, fb: 0.45, mix: 0.5 },
    });
    const bs = baixoDedo(S, 'baixo', { gain: 0.42, corte: 1500 });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.4, corte: 2500 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.75 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', gain: 0.45, pan: -0.15, rev: 0.3 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 2.4, corte: 9000 });
    const tm = S.part('toms', I.tom, { drum: true, gain: 0.5, rev: 0.35 });
    const fxOnda = S.part('onda', onda, { drum: true, gain: 0.8, pan: 0.2, rev: 0.3 });
    const fxGav = S.part('gaivota', gaivota, { drum: true, gain: 0.8, pan: 0.6, rev: 0.5 });

    const INSISTE = '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2';
    const pinga = (b, lista, vel = 1) => {
        for (const [r, p] of lista) go.note(b * 16 + r, p, 0, vel);
    };

    // ---------- a entrada (0-3) ----------
    pinga(0, [
        [0, 0],
        [10, -5],
    ]);
    pinga(1, [
        [6, 3],
        [14, 0],
    ]);
    pinga(
        2,
        [
            [4, -5],
            [12, 3],
        ],
        0.9,
    );
    pinga(
        3,
        [
            [2, 0],
            [8, -2],
        ],
        0.8,
    );
    bass(bs, 2, 'Dm', INSISTE, { vel: 0.55 });
    bass(bs, 3, 'Dm', INSISTE, { vel: 0.7 });
    drum(tm, 3, 1, 'x.....x.x.......', { pitch: -2, vel: 0.7 });
    mel(oc, 3, ['r:8 A4:8'], { vel: 0.8 });
    padChord(pad, 2, 'Dm', 32, { low: 50, n: 3, vel: 0.5 });

    // ---------- a caverna (4-11) ----------
    const groove = (b, { cheio = true } = {}) => {
        drum(k, b, 1, cheio ? 'X.....x.X.......' : 'X...............', { vel: 0.8 });
        if (cheio) drum(ar, b, 1, '....x.......x...', { vel: 0.8 });
        drum(sk, b, 1, 'x.x.x.x.x.x.x.x.', { vel: cheio ? 0.6 : 0.35 });
    };
    mel(oc, 4, A);
    mel(ce, 4, CRISTAIS);
    A_CH.forEach((c, i) => {
        const b = 4 + i;
        bass(bs, b, c, INSISTE, { vel: 0.85 });
        padChord(str, b, c, 16, { low: 50, n: 4, vel: 0.45 });
        groove(b);
        pinga(b, GOTAS_A[i], 0.8);
    });
    drum(tm, 11, 1, '........x.x.x.xx', { pitch: 2 });

    // ---------- o eco (12-19): cânone a um compasso, em cima do pedal de Ré ----------
    mel(oc, 12, A);
    mel(eco, 13, A.slice(0, 7), { shift: -12 });
    ECO_CH.forEach((c, i) => {
        const b = 12 + i;
        bass(bs, b, 'Dm', INSISTE, { vel: 0.75 });
        padChord(pad, b, c, 16, { low: 51, n: 3, vel: 0.55 });
        groove(b, { cheio: false });
        if (i % 2 === 1) pinga(b, [[10, 2 + i]], 0.7);
    });
    drum(tm, 19, 1, '........x.x.x.xx', { pitch: 3 });

    // ---------- a câmara de cristal (20-27): meio-tempo, hemíola no arpejo ----------
    CAMARA.forEach(([c, sino, flauta], i) => {
        const b = 20 + i;
        mel(ce, b, [sino], { vel: 0.95 });
        mel(oc, b, [flauta], { vel: 0.7 });
        arp(ar3, b, c, { low: 64, step: 1, pattern: [0, 2, 1] });
        padChord(str, b, c, 16, { low: 51, n: 3, vel: 0.55 });
        bass(bs, b, c, '0:6 0:2 r:4 5:4', { vel: 0.8 });
        drum(k, b, 1, 'X.........x.....', { vel: 0.7 });
        drum(ar, b, 1, '........x.......', { vel: 0.7 });
        pinga(
            b,
            i % 2
                ? [
                      [6, 5],
                      [14, 0],
                  ]
                : [
                      [0, -5],
                      [10, 3],
                  ],
            0.7,
        );
    });
    drum(tm, 27, 1, '........x.x.x.xx', { pitch: 3 });

    // ---------- a luz (28-33): a escala clareia uma nota por compasso ----------
    MODOS.forEach(([, escala, mudou, acorde], i) => {
        const b = 28 + i;
        let t = b * 16;
        for (const [g, len] of LUZ) {
            const m = 74 + (g === 8 ? 12 : escala[g - 1]);
            oc.note(t, m, len, 0.9 + 0.02 * i);
            if (mudou && g === mudou) ce.note(t, m + 12, 4, 0.9);
            t += len;
        }
        notas(str, b * 16, acorde, 16, 0.45 + 0.05 * i);
        notas(pad, b * 16, acorde.slice(1), 16, 0.5);
        mel(bs, b, ['D2:2 D2:2 D3:2 D2:2 D2:2 A2:2 D3:2 A2:2'], { vel: 0.7 + 0.04 * i });
        drum(k, b, 1, i < 3 ? 'X.......X.......' : 'X...X...X...X...', { vel: 0.6 + 0.05 * i });
        if (i < 5) drum(sk, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.4 + 0.06 * i });
    });
    // o último compasso já pulsa em 3 (as colcheias do 6/8 que vem: 6 por compasso)
    for (let u = 0; u < 6; u++) sk.note(33 * 16 + (u * 8) / 3, 0, 0, u % 3 ? 0.5 : 0.9);
    fxOnda.note(32 * 16 + 4, 0, 0, 0.8);
    fxGav.note(33 * 16 + 6, 0, 0, 0.8);
    return S;
}

// ---------- II. o mar ----------
const LIDIO = (t) => [2, 4, 6, 8, 9, 11, 1].map((x) => (x + t) % 12);
const M = [
    'F#5:6 A5:2 G#5:2 F#5:2',
    'E5:6 B4:6',
    'F#5:2 A5:2 C#6:2 B5:4 A5:2',
    'G#5:6 E5:6',
    'D5:2 F#5:2 A5:2 F#5:6',
    'B5:6 A5:2 F#5:2 D5:2',
    'E5:2 G5:2 B5:2 D6:4 C#6:2',
    'A5:12',
];
const GAV = [
    'r:12',
    'r:6 G#5:2 F#5:2 E5:2',
    'r:12',
    'r:6 B5:2 G#5:2 E5:2',
    'r:12',
    'r:12',
    'r:12',
    'r:6 C#6:2 E6:2 A6:2',
];
const CH = ['Dmaj7', 'E', 'Dmaj7', 'E', 'Bm7', 'Gmaj7', 'Em7', 'A'];
const B = [
    'D5:2 F#5:2 A5:2 B5:6',
    'A5:3 F#5:3 C#6:6',
    'B5:2 G5:2 E5:2 D5:6',
    'C#5:6 A#4:6',
    'D5:2 F#5:2 A5:2 D6:6',
    'C#6:3 B5:3 F#5:6',
    'G5:2 B5:2 E6:2 D6:6',
    GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0] }),
];
const B_CH = ['Bm7', 'Gmaj7', 'Em7', 'F#7', 'Bm7', 'Gmaj7', 'Em7', 'A7'];
const GUIA = ['C#4:12', 'B3:12', 'C#4:12', 'B3:6 G#3:6', 'D4:12', 'F#3:12', 'G3:6 B3:6', 'C#4:6 E4:6'];
// a tempestade: o tema da caverna nos metais graves, em 6/8
const TEMPESTADE = [
    ['Dm', 'D3:3 F3:3 A3:4 G3:2'],
    ['Bb', 'F3:3 D3:3 Bb2:6'],
    ['Gm', 'G3:2 Bb3:1 D4:3 C4:2 Bb3:1 G3:3'],
    ['A7', 'C#3:6 E3:3 A3:3'],
    ['Dm', 'D3:3 F3:3 A3:3 D4:3'],
    ['Bb', 'C4:2 Bb3:1 A3:3 F3:3 D3:3'],
    ['Eb', 'Eb3:3 G3:3 Bb3:4 G3:2'],
    ['A7b9', 'A3:6 G3:2 F3:2 E3:1 C#3:1'],
];
const GRITO = ['A5:12', 'A5:6 Bb5:6', 'D6:12', 'C#6:12', 'A5:6 D6:6', 'F6:6 D6:6', 'Eb6:6 D6:6', 'C#6:12'];
const SOLO = [
    'A3:2 D4:2 F#4:2 A4:4 G#4:2',
    'B4:6 G#4:3 E4:3',
    'F#4:1 G#4:1 A4:2 C#5:2 E5:4 C#5:2',
    'D5:3 B4:3 G#4:2 E4:2 F#4:2',
    'D4:2 F#4:2 A4:2 B4:3 A4:3',
    'F#4:6 D4:2 B3:2 G3:2',
    'E4:2 G4:2 B4:2 D5:4 C#5:2',
    'C#5:9 r:3',
    'F#4:2 A4:2 D5:2 F#5:4 E5:2',
    'D5:3 B4:3 A4:2 F#4:4',
    'G4:2 B4:2 E5:2 G5:4 F#5:2',
    'E5:2 C#5:2 A#4:2 F#4:3 E4:3',
    'D4:1 E4:1 F#4:2 B4:2 D5:4 C#5:2',
    'B4:3 A4:3 F#4:3 D4:3',
    'E4:2 F#4:2 G4:2 B4:3 D5:3',
    'C#5:3 E5:3 G5:6',
];
// o tema da caverna em MAIOR (Mi♭), por baixo do tema do barco, na 2ª metade da chegada
const CAVERNA_MAIOR = [
    'Eb3:3 G3:3 Bb3:4 Ab3:2',
    'G3:3 Eb3:3 C3:6',
    'F3:2 Ab3:1 C4:3 Bb3:2 Ab3:1 F3:3',
    'D3:6 F3:3 Bb3:3',
];

export function mar() {
    const S = new Song({ bpm: 99, bars: 63, barLen: 12, tail: 7, barramentos: { bateria: BATERIA } });
    const oc = ocarina(S, 'ocarina', { pan: -0.1, gain: 1, rev: 0.35, echo: { rows: 4, fb: 0.3, mix: 0.2 } });
    const gav = S.part('gaivotaCanta', I.piccolo, {
        pan: 0.5,
        gain: 0.7,
        corte: 4500,
        echo: { rows: 3, fb: 0.3, mix: 0.3 },
        rev: 0.4,
    });
    const fxGav = S.part('gaivota', gaivota, { drum: true, gain: 0.8, pan: 0.6, rev: 0.45 });
    const ondas = celesta(S, 'ondas', { pan: 0.35, gain: 0.55, rev: 0.35 });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.35, corte: 2800 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.4, corte: 1500 });
    const tb = trombone(S, 'trombone', { pan: -0.25, gain: 1, rev: 0.28 });
    const tb2 = trombone(S, 'trombone2', { pan: 0.25, gain: 0.75, rev: 0.28 });
    const tbS = trombone(S, 'solo', { pan: 0.05, gain: 1.15, rev: 0.32, echo: { rows: 6, fb: 0.2, mix: 0.12 } });
    const tu = tuba(S, 'tuba', { gain: 0.55, rev: 0.12 });
    const bub = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 1, rev: 0.4 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 2.4, corte: 9000 });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.65 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', gain: 0.45, pan: -0.15 });
    const blk = S.part('bloco', I.block, { drum: true, gain: 0.5, pan: -0.2, corte: 4000 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.35, pan: 0.2, corte: 5000 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.22, rev: 0.25 });
    const fxOnda = S.part('onda', onda, { drum: true, gain: 0.9, pan: -0.2, rev: 0.3 });
    const go = S.part('gotas', gota, {
        drum: true,
        pan: 0.4,
        gain: 0.45,
        rev: 0.4,
        echo: { rows: 4, fb: 0.45, mix: 0.5 },
    });

    /** Um compasso da barcarola; `tubaBaixo` = a tuba faz o "um-pá" no lugar do baixo. */
    const barco = (b, c, { cheio = true, tubaBaixo = false, ondasVel = 1 } = {}) => {
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel: 0.8 * ondasVel });
        padChord(str, b, c, 12, { low: 54, n: 3, vel: 0.5 });
        if (tubaBaixo) bass(tu, b, c, '0:5 r:1 5:5 r:1');
        else bass(bs, b, c, '0:6 5:6');
        drum(sh, b, 1, 'x.o.o.x.o.o.', { vel: 0.7 });
        drum(k, b, 1, 'x.....x.....', { vel: 0.8 });
        if (cheio) drum(blk, b, 1, '......x.....', { vel: 0.8 });
    };
    const bolha = (b, p = 12, v = 0.8, r = 9) => bub.note(b * 12 + r, p, 0, v);

    // ---------- o cais (0-1) ----------
    fxOnda.note(0, 0, 0, 0.7);
    for (const [b, c] of [
        [0, 'Dmaj7'],
        [1, 'A'],
    ]) {
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel: 0.7 });
        padChord(str, b, c, 12, { low: 54, n: 3, vel: 0.4 });
        bolha(b);
    }
    fxGav.note(6, 2, 0, 0.7);
    mel(tu, 1, ['r:6 A1:3 C#2:3']);

    // ---------- A (2-9) e A2 (10-17) ----------
    mel(oc, 2, M);
    mel(oc, 10, M);
    mel(gav, 10, GAV);
    mel(tb, 10, GUIA, { vel: 0.6 });
    for (const [b, p] of [
        [3, 0],
        [7, 3],
    ])
        fxGav.note(b * 12 + 7, p, 0, 0.8);
    CH.forEach((c, i) => {
        barco(2 + i, c, { cheio: false });
        barco(10 + i, c, { tubaBaixo: true });
        if (i % 2 === 0) {
            bolha(2 + i);
            bolha(10 + i);
        }
    });

    // ---------- a ponte (18-25): Si menor, os trombones em terças, o SOC-CER-MON com as bolhas ----------
    mel(oc, 18, B);
    mel(gav, 22, B.slice(4, 7), { shift: -12, vel: 0.6 });
    B_CH.forEach((c, i) => {
        barco(18 + i, c, { tubaBaixo: true });
    });
    for (const [i, m] of [
        [0, 'r:6 F#4:3 D4:3'],
        [1, 'r:6 D4:6'],
        [2, 'r:6 G4:3 B4:3'],
        [3, 'r:6 A#3:6'],
        [4, 'r:6 F#4:3 A4:3'],
        [5, 'r:6 D4:6'],
        [6, 'r:6 B4:3 G4:3'],
    ]) {
        mel(tb, 18 + i, [m], { shift: -12 });
        mel(tb2, 18 + i, [m], { shift: -12, harm: thirdBelow(LIDIO(0)) });
    }
    mel(tb, 25, [GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0], oitava: -2 })]);
    mel(tu, 25, [GANCHO.em({ tom: 2, ritmo: [3, 3, 6, 0], oitava: -3 })]);
    bub.note(25 * 12 + 9, 14, 0, 1);
    bub.note(25 * 12 + 11, 17, 0, 1);

    // ---------- a tempestade (26-33): Ré menor, o tema da caverna nos metais, 6/8 contra 3/4 ----------
    TEMPESTADE.forEach(([c, m], i) => {
        const b = 26 + i;
        mel(tb, b, [m]);
        mel(tu, b, [m], { shift: -12, vel: 0.9 });
        mel(tb2, b, [m], { shift: 12, vel: 0.5 });
        if (i >= 4) mel(oc, b, [GRITO[i]], { vel: 0.85 });
        else mel(oc, b, [GRITO[i]], { vel: 0.6 });
        // as cordas em trêmolo
        for (let r = 0; r < 12; r++) notas(str, b * 12 + r, acorde(c), 1, r % 3 ? 0.35 : 0.5);
        bass(bs, b, c, i % 2 ? '0:4 5:4 8:4' : '0:6 5:6', { vel: 0.9 });
        // o barco aderna: 6/8 (duas batidas) e 3/4 (três) alternando
        drum(k, b, 1, i % 2 ? 'X...X...X...' : 'X.....X.....');
        drum(ti, b, 1, i % 2 ? 'x...x...x...' : 'x.....x.....', { vel: 0.6, pitch: -2 });
        drum(sh, b, 1, 'xxxxxxxxxxxx', { vel: 0.5 });
        drum(ar, b, 1, i % 2 ? '....x...x...' : '......x.....', { vel: 0.9 });
        if (i % 2 === 0) fxOnda.note(b * 12, 0, 0, 1);
    });
    drum(cr, 26, 1, 'x...........');
    drum(cr, 30, 1, 'x...........');
    drum(ti, 29, 1, '......xxxxxx', { vel: 0.6 });
    drum(ti, 33, 1, 'xxxxxxXXXXXX', { vel: 0.7 });

    // ---------- a calmaria (34-49): o sol volta no lídio, o trombone sola ----------
    mel(tbS, 34, SOLO);
    [...CH, ...B_CH].forEach((c, i) => {
        const b = 34 + i;
        arp(ondas, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 2, 1, 3, 2, 1], vel: 0.5 });
        padChord(str, b, c, 12, { low: 54, n: 3, vel: 0.4 });
        bass(tu, b, c, i < 8 ? '0:5 r:1 5:5 r:1' : '0:3 5:3 8:3 5:3', { vel: 0.8 });
        drum(sh, b, 1, 'x.o.o.x.o.o.', { vel: 0.6 });
        drum(k, b, 1, 'x.....x.....', { vel: 0.7 });
        if (i >= 8) drum(ar, b, 1, '......x.....', { vel: 0.7 });
        if (i % 4 === 3) bolha(b, 12, 0.6);
    });
    fxGav.note(34 * 12 + 2, 0, 0, 0.6);
    for (const b of [37, 41, 45]) mel(oc, b, ['r:9 E6:1 F#6:1 A6:1'], { vel: 0.6 });

    // ---------- a chegada: virada (50), Si♭7, e o Mi♭ lídio (51-58) ----------
    barco(50, 'Bb7', { tubaBaixo: true });
    mel(oc, 50, ['r:6 D5:3 F5:3']);
    mel(tb, 50, ['Bb3:3 D4:3 F4:3 Ab4:3']);
    drum(blk, 50, 1, '......x.x.x.');
    bolha(50, 13, 1);
    mel(oc, 51, M, { shift: 1 });
    mel(gav, 51, GAV, { shift: 1 });
    mel(tb, 51, GUIA.slice(0, 4), { shift: 1, vel: 0.6 });
    mel(tb, 55, CAVERNA_MAIOR, { vel: 0.75 });
    mel(tb2, 55, CAVERNA_MAIOR, { shift: -12, vel: 0.6 });
    // as gotas da caverna voltam como brilho, no acorde
    const GOTAS_EB = [1, 3, 1, 3, -2, -6, 3, -4];
    CH.forEach((c, i) => {
        const b = 51 + i;
        barco(b, transpose(c, 1), { tubaBaixo: true });
        go.note(b * 12 + 10, GOTAS_EB[i], 0, 0.7);
        if (i % 2 === 0) bolha(b, 13);
    });
    drum(cr, 51, 1, 'x...........');
    fxGav.note(52 * 12 + 7, 1, 0, 0.7);

    // ---------- o fim (59-62): terra à vista ----------
    const n = 59;
    arp(ondas, n, 'Ebmaj7', { low: 63, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
    padChord(str, n, 'Ebmaj7', 12, { low: 55, n: 3, vel: 0.6 });
    bass(tu, n, 'Ebmaj7', '0:6 5:6');
    mel(oc, n, ['Eb5:2 G5:2 Bb5:2 D6:6']);
    mel(gav, n, ['r:6 D6:2 F6:2 Bb6:2'], { vel: 0.8 });
    drum(sh, n, 1, 'x.o.o.x.o.o.', { vel: 0.6 });
    drum(k, n, 1, 'x.....x.....', { vel: 0.7 });
    bolha(n, 13);
    // Fá sobre Mi♭ (o lídio): a ocarina pousa no Lá natural
    arp(ondas, n + 1, 'F', { low: 63, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1], vel: 0.7 });
    padChord(str, n + 1, 'F', 12, { low: 55, n: 3, vel: 0.5 });
    mel(tu, n + 1, ['Eb2:12']);
    mel(oc, n + 1, ['C6:2 A5:4 G5:6']);
    mel(tb, n + 1, ['r:6 A3:6']);
    mel(tb2, n + 1, ['r:6 F3:6']);
    bolha(n + 1, 15, 0.7, 6);
    bolha(n + 1, 18, 0.6);
    // o barco atraca: Mi♭maj7, os metais graves, as bolhas subindo
    padChord(str, n + 2, 'Ebmaj7', 12, { low: 51, n: 4, vel: 0.7 });
    mel(tu, n + 2, ['Eb2:12']);
    mel(tb, n + 2, ['G3:12']);
    mel(tb2, n + 2, ['D3:12']);
    mel(oc, n + 2, ['Bb5:12']);
    arp(ondas, n + 2, 'Ebmaj7', { low: 63, step: 2, rows: 6, pattern: [0, 1, 2, 3], vel: 0.5 });
    drum(cr, n + 2, 1, 'x...........', { vel: 0.7 });
    drum(k, n + 2, 1, 'x...........');
    for (const [r, p] of [
        [4, 13],
        [6, 16],
        [8, 20],
    ])
        bub.note((n + 2) * 12 + r, p, 0, 0.5);
    fxGav.note((n + 2) * 12 + 9, 3, 0, 0.5);
    // a última gota da caverna, sozinha
    go.note((n + 3) * 12 + 4, 1, 0, 0.9);
    return S;
}

/** As notas de um acorde pro trêmolo das cordas (região do meio). */
function acorde(c) {
    const ns = {
        Dm: ['D4', 'F4', 'A4'],
        Bb: ['D4', 'F4', 'Bb4'],
        Gm: ['D4', 'G4', 'Bb4'],
        A7: ['C#4', 'G4', 'A4'],
        Eb: ['Eb4', 'G4', 'Bb4'],
        A7b9: ['C#4', 'G4', 'Bb4'],
    };
    return ns[c];
}

export default function aRota() {
    const C = caverna();
    const Mr = mar();
    const [L1, R1] = C.render();
    const [L2, R2] = Mr.render();
    // o mar entra na linha do compasso 34 da caverna; o rabo da caverna soa por cima da entrada do mar
    const o = Math.round(C.timeOfBar(34) * SR);
    const L = new Float32Array(Math.max(L1.length, o + L2.length));
    const R = new Float32Array(L.length);
    L.set(L1);
    R.set(R1);
    for (let i = 0; i < L2.length; i++) {
        L[o + i] += L2[i];
        R[o + i] += R2[i];
    }
    return [L, R];
}
