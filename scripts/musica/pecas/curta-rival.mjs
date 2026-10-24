// Curta "O rival evoluiu" (pauta item 7, 24/10/2026), 9:16, ~18 s, composta em cima do corte (trailer/rival).
// A história é de quem assovia: o seu time está ganhando e assovia de boa (Fá maior, shuffle preguiçoso, estalo de
// dedo); o Dragonair do rival (Vermilion Voltagem, o clube do Lt. Surge) começa a piscar e o assovio murcha; cada
// piscada da evolução é um choque (o zap do Lt. Surge, subindo de tom); o Dragonite aparece e o MESMO assovio volta
// em Fá menor, pesado, nos metais e na serra larga, com o choque virando a caixa da banda. No gol dele a música bate
// em cada virada do placar grande (choque, choque, choque) e o assovio murcha de vez. Tela final: o SOC-CER-MON
// em Fá menor com a banda inteira, e o último acorde vira Fá maior.
// 128 BPM, compasso 1,875 s. O vídeo começa na linha 0 do compasso 0.
// Compasso: plano do vídeo → música
//   0–1  TAVA GANHANDO (perto do Dragonair, placar grande): o assovio (Fmaj7 | Gm7 C7), baixo de pé, estalo no 2 e no 4
//   2    a evolução (quadros 142–197 da captura): a banda some, o assovio despenca, pedal em Dó com 9ª menor, um choque
//        em cada piscada (segundos medidos na captura), subida até a linha 14 e silêncio
//   3    DRAGONITE (o quadro 198 cai no 1): impacto, o assovio em Fá menor nos metais, meio tempo pesado (Fm → Db)
//   4–5  o Dragonite joga e chuta (quadros 572–684): o tema uma oitava acima | Eb → C7, o chute no segundo exato
//   6–7  GOL e o placar grande vira na batida por cima do jogo: 4x4 4x5 4x6 5x8 | "...TAVA."
//   8–9  tela final: o SOC-CER-MON (as sílabas do logo piscam nas linhas 0, 3 e 6 do 8) e o Fá maior no fim
import { drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { ASSOVIO, chute, deslize, rede, zap } from './livre-ginasio.mjs';
import { bumbo, desafina, estalo, impacto, MEIO, SERRA, SUB, SUPER, subida } from './trailer-abertura.mjs';

export const meta = { titulo: 'Curta: O rival evoluiu', tela: 'Curta', lufs: -14 };

export const BPM = 128;
/** Segundos (no vídeo) das piscadas brancas da evolução, medidas na captura (trailer1820, quadros 154 a 195). */
export const PISCADAS = [4.1667, 4.5, 4.7333, 4.9, 5.0333, 5.1333, 5.2333, 5.3333, 5.4333, 5.5333];
/** O chute do Dragonite (quadro 648), em segundos de vídeo. */
export const CHUTE = 10.033;

export default function curtaRival() {
    const S = new Song({ bpm: BPM, bars: 10, swing: 0.15, tail: 2 });
    const linha = (seg) => seg / S.row + 1e-6; // segundo → linha (fracionária: sem swing)
    const em = (P, bar, row, p = 0, vel = 1) => P.note(bar * 16 + row, p, 0, vel);
    const par = (nome, inst, o) =>
        [-1, 1].map((l) =>
            desafina(S.part(`${nome} ${l < 0 ? 'E' : 'D'}`, inst, { ...o, pan: l }), 0.08 * l, l > 0 ? 0.12 : 0),
        );
    // meio compasso de baixo pesado a partir da linha absoluta r0: tônica longa, repetida, oitava, tônica
    const meia = (P, r0, m) => {
        for (const [dr, dm, len] of [
            [0, 0, 3],
            [3, 0, 1],
            [6, 12, 1],
            [7, 0, 1],
        ])
            P.note(r0 + dr, m + dm, len, 1);
    };

    const asv = S.part('assovio', ASSOVIO, { pan: 0.1, gain: 1.6, echo: { rows: 3, fb: 0.2, mix: 0.18 }, rev: 0.3 });
    const murcha = S.part('assovio murcha', deslize(1397, 520, 0.42), { drum: true, pan: 0.1, gain: 0.9, rev: 0.3 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.15 });
    const bx = S.part('baixo', I.bass, { gain: 0.35 });
    const sub = S.part('sub', SUB, { gain: 0.32 });
    const metais = S.part('metais', I.brass, { pan: 0.15, gain: 0.9, rev: 0.15 });
    const largo = par('serra larga', SERRA, { gain: 1.2, rev: 0.12, corte: 7000 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.45 });
    const st = S.part('stab', I.stab, { pan: 0.3, gain: 0.8 });
    const meio = par('meio', MEIO, { gain: 1.1, rev: 0.1, corte: 6500 });
    const sup = par('pad largo', SUPER, { gain: 0.55, rev: 0.2, corte: 7000 });
    const cordas = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const k = S.part('bumbo', bumbo(), { drum: true, gain: 0.75 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.6 });
    const est = S.part('estalo', estalo(), { drum: true, gain: 2.2, rev: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 1 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2, gain: 0.8 });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.35, rev: 0.25 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.7 });
    const imp = S.part('impacto', impacto(), { drum: true, gain: 1.1, rev: 0.25 });
    const sobeEvo = S.part('subida evolução', subida(1.55), { drum: true, gain: 1, rev: 0.2 });
    const sobeGol = S.part('subida gol', subida(0.9), { drum: true, gain: 1, rev: 0.2 });
    const choque = S.part('choque', zap, { drum: true, pan: -0.15, gain: 1.3, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 1.8 });
    const rd = S.part('rede', rede, { drum: true, gain: 1.8, rev: 0.2 });
    // o clap 808 da casa (receita 7b): seco no shuffle (estalo de dedo), dobrado e pesado na banda do rival
    const clap = I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 });
    const dedo = S.part('estalo de dedo', clap.com({ tom: 0.5 }), { drum: true, pan: 0.3, gain: 1 });
    const cl = S.part('clap', clap, { drum: true, gain: 1.1 });
    const cl2 = S.part('clap2', clap.com({ atraso: 0.011, tom: -0.6 }), { drum: true, pan: 0.4, gain: 0.8 });
    const palmas = (bar, pat, vel = 1) => {
        drum(cl, bar, 1, pat, { vel });
        drum(cl2, bar, 1, pat, { vel });
    };

    // 0–1: TAVA GANHANDO. O assovio convencido em Fá, shuffle preguiçoso
    mel(asv, 0, ['A5:2 C6:1 r:1 F6:3 E6:1 D6:2 C6:2 A5:2 C6:2', 'Bb5:2 D6:1 r:1 G6:3 F6:1 E6:2 C6:2 F6:4']);
    stabs(ep, 0, 'Fmaj7', [2, 6, 10, 14], { low: 60, vel: 0.7 });
    stabs(ep, 1, 'Gm7', [2, 6], { low: 60, vel: 0.7 });
    stabs(ep, 1, 'C7', [10, 14], { low: 60, vel: 0.7 });
    for (const [r, m, len] of [
        [0, 41, 3],
        [4, 48, 3],
        [8, 53, 3],
        [12, 48, 2],
        [14, 45, 2],
        [16, 43, 3],
        [20, 50, 3],
        [24, 48, 3],
        [28, 46, 2],
        [30, 40, 2],
    ])
        bx.note(r, m, len, 1);
    drum(k, 0, 2, 'x.........x.....', { vel: 0.7 });
    drum(dedo, 0, 2, '....x.......x...', { vel: 0.9 });
    drum(hh, 0, 2, 'x.ox.ox.ox.ox.o.', { vel: 0.6 });

    // 2: a evolução. A banda some; o assovio tenta mais uma nota e murcha. Pedal em Dó com Ré bemol por cima (C7b9),
    // um choque em cada piscada, subindo de tom; a subida acaba na linha 14 e as 2 últimas linhas são silêncio
    mel(asv, 2, ['A5:1 r:15'], { vel: 0.9 });
    em(murcha, 2, 1, 0, 0.9);
    em(ti, 2, 0, 0, 0.8);
    sub.note(32, 36, 13, 0.9);
    padChord(cordas, 2, 'C7b9', 13, { low: 55, n: 4, vel: 0.8 });
    drum(k, 2, 1, 'X..x....X..x....', { vel: 0.6 }); // coração
    em(sobeEvo, 2, 0.75, 0, 0.9);
    PISCADAS.forEach((s, i) => {
        choque.note(linha(s), i, 0, 0.55 + 0.04 * i);
    });

    // 3: DRAGONITE. O mesmo assovio, agora em Fá menor e uma oitava abaixo, nos metais e na serra; meio tempo
    const TEMA_M = 'Ab4:2 C5:1 r:1 F5:3 Eb5:1 Db5:2 C5:2 Ab4:2 C5:2';
    const banda = (bar, [c1, c2], [r1, r2]) => {
        for (const P of meio) {
            stabs(P, bar, c1, [0, 3, 6], { low: 65 });
            stabs(P, bar, c2, [8, 11, 14], { low: 64 });
        }
        for (const P of sup) {
            padChord(P, bar, c1, 8, { low: 55, n: 4 });
            padChord(P, bar, c2, 8, { at: 8, low: 55, n: 4 });
        }
        meia(bx, bar * 16, r1);
        meia(bx, bar * 16 + 8, r2);
        sub.note(bar * 16, r1 - 12, 7, 0.9);
        sub.note(bar * 16 + 8, r2 - 12, 7, 0.9);
    };
    em(imp, 3, 0);
    drum(cr, 3, 1, 'X...............');
    choque.note(48, -7, 0, 1);
    mel(metais, 3, [TEMA_M]);
    for (const P of largo) mel(P, 3, [TEMA_M], { vel: 0.8 });
    mel(tuba, 3, ['F2:6 r:2 Db2:6 r:2']);
    stabs(
        st,
        3,
        'Fm',
        [
            [0, 3],
            [6, 2],
        ],
        { low: 53 },
    );
    banda(3, ['Fm', 'Db'], [41, 37]);
    drum(k, 3, 1, 'X.....X...X.....');
    for (const P of [sn, est, cl, cl2]) drum(P, 3, 1, '........X.......');
    drum(choque, 3, 1, '........x.......', { vel: 0.7 }); // o choque virou a caixa da banda
    drum(hh, 3, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
    drum(ti, 3, 1, 'X.....x.........');

    // 4: o Dragonite joga. O tema uma oitava acima com a resposta no grave; a banda inteira
    mel(metais, 4, ['Ab5:2 C6:1 r:1 F6:3 Eb6:1 Db6:2 C6:2 Bb5:2 C6:2']);
    for (const P of largo) mel(P, 4, ['Ab4:2 C5:1 r:1 F5:3 Eb5:1 Db5:2 C5:2 Bb4:2 C5:2'], { vel: 0.8 });
    mel(tuba, 4, ['F2:6 r:2 Db2:6 r:2']);
    banda(4, ['Fm', 'Db'], [41, 37]);
    drum(k, 4, 1, 'X.....X...X...x.');
    for (const P of [sn, est, cl, cl2]) drum(P, 4, 1, '....X.......X...');
    drum(choque, 4, 1, '............x...', { vel: 0.6 });
    drum(hh, 4, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.6 });

    // 5: Eb → C7 (a dominante de Fá menor), bumbo nos 4, o chute no segundo exato e a subida com a bola
    const RESP = 'G4:2 Bb4:1 r:1 Eb5:3 D5:1 C5:2 E5:2 G5:2 Bb5:2';
    mel(metais, 5, [RESP]);
    for (const P of largo) mel(P, 5, [RESP], { vel: 0.8 });
    mel(tuba, 5, ['Eb2:6 r:2 C2:6 r:2']);
    banda(5, ['Eb', 'C7'], [39, 36]);
    drum(k, 5, 1, 'X...X...X...X...');
    drum(sn, 5, 1, '....X.......X.XX', { vel: 0.9 });
    for (const P of [est, cl, cl2]) drum(P, 5, 1, '....X.......X...');
    drum(hh, 5, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.6 });
    drum(tm, 5, 1, '............x.xx', { pitch: -4 });
    ch.note(linha(CHUTE), 0, 0, 1);
    em(sobeGol, 5, 8.5, 0, 0.9);

    // 6: GOL (linha 0) e o placar grande virando na batida: 4x5 (linha 4), 4x6 (8) e o 5x8 final (12), no C
    em(imp, 6, 0);
    drum(cr, 6, 1, 'X...........X...');
    em(rd, 6, 0, 0, 1);
    choque.note(96, -12, 0, 1);
    em(ti, 6, 0);
    em(k, 6, 0);
    palmas(6, 'X...x...x...X...');
    mel(tuba, 6, ['F1:4 F1:4 F1:4 C2:4']);
    sub.note(96, 29, 12, 1);
    sub.note(108, 24, 4, 1);
    stabs(st, 6, 'Fm', [[0, 3], 4, 8], { low: 53 });
    stabs(st, 6, 'C', [[12, 4]], { low: 52, vel: 1.2 });
    for (const P of meio) {
        stabs(P, 6, 'Fm', [0, 4, 8], { low: 65, len: 2 });
        stabs(P, 6, 'C', [[12, 3]], { low: 64 });
    }
    for (const [r, p] of [
        [4, 0],
        [8, 3],
        [12, 7],
    ]) {
        choque.note(96 + r, p, 0, 0.9 + r / 60);
        em(k, 6, r, 0, 0.9);
        em(ti, 6, r, 0, 0.6);
    }
    // 7: "...TAVA.": o assovio murcha de vez e fica quase em silêncio; a caixa puxa pro logo
    em(murcha, 7, 0, 0, 1);
    em(ti, 7, 0, 0, 0.5);
    cordas.note(112, 48, 8, 0.5);
    drum(sn, 7, 1, '............o.xX', { vel: 0.8 });

    // 8: tela final. O SOC-CER-MON em Fá menor com a banda (as sílabas do logo piscam nas linhas 0, 3 e 6);
    // a torcida responde no 808 e a banda segue no Fm
    const GM = GANCHO.em({ tom: 5, menor: true }); // C6 Ab5 F6
    em(imp, 8, 0);
    drum(cr, 8, 1, 'X.....x.........');
    mel(metais, 8, [GANCHO.em({ tom: 5, menor: true, oitava: -1 })]);
    for (const P of largo) mel(P, 8, [GM], { vel: 0.85 });
    mel(asv, 8, [GM], { vel: 0.8 });
    stabs(
        st,
        8,
        'Fm',
        [
            [0, 2],
            [3, 2],
            [6, 6],
        ],
        { low: 53, vel: 1.1 },
    );
    banda(8, ['Fm', 'Db'], [41, 37]);
    drum(k, 8, 1, 'X..X..X...X.X.X.');
    drum(ti, 8, 1, 'X..x..X.........');
    palmas(8, GANCHO.palmas.replace(/x/g, 'X'));
    drum(hh, 8, 1, '........x.xxx.xx', { vel: 0.6 });
    // 9: o gancho de novo e o último acorde em Fá MAIOR
    mel(metais, 9, [GANCHO.em({ tom: 5, oitava: -1, ritmo: [3, 3, 10, 0] })]);
    for (const P of largo) mel(P, 9, [GANCHO.em({ tom: 5, ritmo: [3, 3, 10, 0] })], { vel: 0.85 });
    stabs(
        st,
        9,
        'F',
        [
            [0, 2],
            [3, 2],
            [6, 10],
        ],
        { low: 53, vel: 1.1 },
    );
    for (const P of sup) padChord(P, 9, 'Fmaj7', 16, { low: 55, n: 4 });
    for (const P of meio) stabs(P, 9, 'F', [0, 3, [6, 8]], { low: 65 });
    mel(tuba, 9, ['F2:3 F2:3 F1:10']);
    sub.note(144, 29, 16, 1);
    drum(k, 9, 1, 'X..X..X.........');
    drum(cr, 9, 1, '......X.........');
    drum(ti, 9, 1, 'X..x..X.........');
    palmas(9, 'X..X..X.........');
    return S;
}
