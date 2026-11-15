// Soccermon News #1 (pauta 21, 20/11/2026; roteiro em trailer/curtas/news-01/ROTEIRO.md). v3 (14/11): telejornal com
// falas numa caixa de diálogo (21 falas, 86,5 s). A v1 foi "frenética", a v2 "vaga": a v3 fica leve e respira enquanto a
// caixa está na tela, e só reage nos lugares certos.
// Vinheta de plantão própria, no molde do livre-ditto. O motivo do jornal ("plan-tão, NO-tí-cia, já!"): Dó Dó Sol↑ Fá
// Mi♭ Fá, Si♭ Dó, Dó dórico. Cada um fala com a própria voz enquanto o texto aparece na caixa (os ~0,5 s da digitação):
// o Alakazam é o teremim (e a colher que entorta é o "ting" de sino), o Meowth é o "mi-áu" (`miau`) e o Psyduck é o
// "psy?" (`psy`: grave, confuso, sobe no fim).
// Reações: o gol em câmera lenta sobe até a vinheta; cada manchete nova ganha um toque curto (sino e metais); o "E mais"
// segura a banda e o Psyduck pergunta atrás da porta; o Patrocínio brilha; o AO VIVO da Rota tem o motivo nos metais;
// as moedas chovem descendo a escala e o Meowth junta no ka-ching; no "Que moedas?" a banda para e ele assobia (e cai
// uma moeda do bolso); o KABOOM do Voltorb (o mesmo do EP 2); o "dong" triste no "A gente tem doze."; o calendário com
// uma nota por semana; sobe pra Ré no Time Ultimate e pra Mi♭ maior na carta; os três cantam o SOC-CER-MON e acaba no
// "ting".
// 120 BPM, 4/4, compasso = 2 s (linha = 1/8 s): os tempos abaixo são os segundos do vídeo (index.html) em linhas.
import { miau, psy, sobe, teremim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { kaboom } from './livre-bolas.mjs';
import { chute, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Soccermon News: plantão', tela: 'Soccermon News #1 (vídeo)' };

/** O motivo do jornal (um compasso, Dó dórico). */
export const MOTIVO = 'C5:2 C5:1 G5:3 F5:1 Eb5:1 F5:2 r:2 Bb4:2 C5:2';
/** Segundo do vídeo → linha da peça. */
const R = (s) => Math.round(s * 8);
/** Quem fala e quando o texto começa a aparecer (s), igual ao index.html. */
export const FALAS = [
    ['ala', 4.5],
    ['ala', 8.0],
    ['ala', 12.0],
    ['ala', 16.0],
    ['ala', 20.0],
    ['ala', 24.0],
    ['ala', 28.0],
    ['ala', 31.5],
    ['ala', 35.0],
    ['ala', 39.0],
    ['meo', 42.5],
    ['ala', 46.0],
    ['meo', 49.5],
    ['ala', 53.5],
    ['ala', 57.5],
    ['psy', 61.0],
    ['psy', 64.5],
    ['ala', 68.5],
    ['ala', 72.5],
    ['ala', 76.0],
    ['ala', 79.5],
];
/** A banda (bateria, baixo, acordes) sai nestes trechos (s): o "E mais", o "Que moedas?", o vestiário e o "doze". */
export const BREQUES = [
    [23.5, 27.5],
    [49.5, 52.5],
    [53.0, 57.0],
    [65.0, 68.0],
];

export default function news() {
    const S = new Song({ bpm: 120, bars: 44, swing: 0.1, tail: 2.5 });
    const rampa = (t, a, z) => Math.min(1, Math.max(0, (t - a) / 0.04)) * Math.min(1, Math.max(0, (z - t) / 0.08));
    const banda = (t) => BREQUES.reduce((g, [a, z]) => g * (1 - rampa(t, a, z)), 1);
    const B = { gainAt: banda };

    const ter = S.part('teremim', teremim, { pan: -0.1, gain: 0.5, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const mia = S.part('miau', miau, { pan: 0.12, gain: 0.95, corte: 4200, rev: 0.18 });
    const ps = S.part('psy', psy, { pan: 0.08, gain: 1.0, corte: 5000, rev: 0.15 });
    const colher = S.part('colher', I.bell, { pan: -0.2, gain: 1.5, rev: 0.4, echo: { rows: 4, fb: 0.3, mix: 0.3 } });
    const sino = S.part('sino', I.bell, { pan: 0.2, gain: 1.2, rev: 0.3 });
    const dong = S.part('dong', I.bell, { gain: 2.2, rev: 0.55, corte: 2200 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2, ...B });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.36, corte: 2600, rev: 0.2, ...B });
    const toque = S.part('toque', I.brass, { pan: 0.1, gain: 0.4, corte: 3000, rev: 0.25 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.7, rev: 0.35 });
    const ep = S.part('epiano', I.epiano, { pan: -0.15, gain: 0.55, rev: 0.25, ...B });
    const pulso = S.part('pulso', I.pulse, { pan: 0.3, gain: 0.3, corte: 3600, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const bs = S.part('baixo', I.slap, { gain: 0.45, corte: 2400, ...B });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.2, ...B });
    const moeda = S.part('moedas', I.coin, { drum: true, pan: 0.25, gain: 1.0, rev: 0.15 });
    const assobio = S.part('assobio', I.whistle, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const assobio2 = S.part('assobio2', I.whistleDown, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.1, gain: 0.8, rev: 0.3 });
    const pe = S.part('chute', chute, { drum: true, gain: 0.9 });
    const boom = S.part('kaboom', kaboom, { drum: true, gain: 1.7, rev: 0.25 });
    const fundo = S.part('estadio', torcida(2.2, 0.9, 0.9), { drum: true, gain: 0.45, rev: 0.4 });
    const ris = S.part('riser', sobe(2), { drum: true, gain: 0.45 });
    const ris3 = S.part('riser3', sobe(3), { drum: true, gain: 0.35 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.55, ...B });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.28, ...B });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.36, ...B });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.22 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });

    const bb = MAJOR(10); // Dó dórico = as notas de Si♭ maior
    const eb = MAJOR(3);
    /** Respirando (enquanto a caixa está na tela): bumbo no 1, aro no 3, chimbal macio, baixo comprido e o piano. */
    const ar = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.........x.....', { vel: 0.75 });
        drum(sn, b, 1, '........x.......', { vel: 0.5 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
        bass(bs, b, c, '0:6 r:2 5:4 r:2 s:2', { vel: 0.7 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 6],
                [10, 5],
            ],
            { low: 60, n: 4, vel: 0.5 },
        );
    };
    /** O funk do jornal, leve (escalada, matérias). */
    const leve = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.........x.....', { vel: 0.85 });
        drum(sn, b, 1, '....x.......x...', { vel: 0.6 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        bass(bs, b, c, '0:3 r:3 5:2 0:2 r:2 s:2 5:2', { vel: 0.8 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.6 });
        stabs(ep, b, c, [[0, 4]], { low: 60, n: 4, vel: 0.35 });
    };
    /** Toque de manchete nova: um acorde curto dos metais e o sino (no instante da troca, antes do texto). */
    const manchete = (s, sym, nota = 91) => {
        stabs(toque, 0, sym, [[R(s), 2]], { low: 60, n: 4, vel: 0.7 });
        sino.note(R(s), nota, 2, 0.6);
    };

    // 0 · o gol em câmera lenta: cordas abrindo, riser, tímpano rufando; a rede (6) e a torcida no pulo (8)
    padChord(cor, 0, 'Cm9', 16, { low: 55, n: 4, vel: 0.55 });
    ris.note(0, 0, 0, 1);
    mel(tuba, 0, ['C2:16'], { vel: 0.6 });
    rd.note(6, 0, 0, 0.9);
    fundo.note(8, 0, 0, 0.9);
    drum(tp, 0, 1, '........x.x.xxXX', { vel: 0.7 });
    // 1 · VINHETA (2–4 s): prato, o motivo inteiro nos metais em terças, tímpano; o baixo puxa pra bancada
    drum(cr, 1, 1, 'X...............');
    drum(kk, 1, 1, 'X.....X.X.......');
    drum(tp, 1, 1, 'X.....X.........', { vel: 0.8 });
    mel(met, 1, [MOTIVO]);
    mel(met2, 1, [MOTIVO], { shift: -12, harm: thirdBelow(bb), vel: 0.8 });
    drum(hh, 1, 1, '........x.x.x.x.', { vel: 0.6 });
    bass(bs, 1, 'Cm7', 'r:8 0:3 r:3 5:2', { vel: 0.8 });

    // a cama: respirando no estúdio, leve nas matérias (a banda some nos BREQUES)
    const CAMA = [
        // [compasso, acorde, modo, semitons]
        ...[2, 3, 4, 5].map((b) => [b, b % 2 ? 'F7' : 'Cm7', ar]),
        ...Array.from({ length: 13 }, (_, k) => [6 + k, k % 2 ? 'F7' : 'Cm7', leve]), // 6–18: escalada e Copa
        ...Array.from({ length: 9 }, (_, k) => [19 + k, k % 2 ? 'Cm7' : 'F7', leve]), // 19–27: Rota e vestiário
        ...[28, 29, 30, 31, 32, 33].map((b) => [b, b % 2 ? 'Ab' : 'Cm7', ar]), // o Psyduck no estúdio
        [34, 'Cm7', leve],
        [35, 'F7', leve], // toda semana
        [36, 'Cm7', leve, 2],
        [37, 'F7', leve, 2], // Time Ultimate, em Ré
        [39, 'Ebmaj7', ar],
        [40, 'Ab', ar],
        [41, 'Bb7', ar], // "Boa noite"; o 2º tempo do 41 já é a tela final
    ];
    for (const [b, c, modo, s = 0] of CAMA) modo(b, c, s);

    // as vozes: cada fala começa com quem fala, por cima da digitação (~0,5 s)
    const FRASES = {
        ala: ['G5:2 C6:2', 'Eb5:1 G5:1 C6:2', 'C6:2 Bb5:1 G5:1', 'F5:1 G5:1 Bb5:2'],
        meo: ['G4:2 Eb5:3', 'C5:1 G5:4'],
        psy: ['A2:4', 'G2:5'],
    };
    const VOZ = { ala: [ter, 0.7], meo: [mia, 0.9], psy: [ps, 1] };
    FALAS.forEach(([quem, s], i) => {
        const frase = FRASES[quem][i % FRASES[quem].length];
        let r = R(s);
        const [P, v] = VOZ[quem];
        for (const tok of frase.split(' ')) {
            const [n, l] = tok.split(':');
            P.note(r, midi(n), Number(l), v);
            r += Number(l);
        }
    });
    // o "ting" da colher: o Alakazam se apresenta (4,5 s) e se despede (fim)
    colher.note(R(4.5), 98, 4, 0.75);

    // ESCALADA: um toque por manchete (11,5 · 15,5 · 19,5); a do Meowth tem um mi-áu curtinho
    manchete(11.5, 'Cm9', 87);
    manchete(15.5, 'F9', 91);
    mia.note(R(17.4), 79, 3, 0.55);
    manchete(19.5, 'Ebmaj7', 94);
    // "E MAIS" (23,5–27,5): a banda segura; tímpano grave, cordas suspensas e o "psy?" atrás da porta (26 s)
    tp.note(R(23.5), -5, 0, 0.9);
    padChord(cor, 0, 'Abmaj7', 30, { low: 55, n: 4, vel: 0.5, at: R(23.5) });
    for (const s of [24.5, 25.5]) pulso.note(R(s), 67, 2, 0.5);
    ps.note(R(26.0), 43, 4, 0.9);
    ris.note(R(25.5), 0, 0, 0.6);

    // COPA DO DIA (27,5): o motivo volta curto; o Patrocínio ganha a moldura dourada (32) e a carta amplia (35)
    cr.note(R(27.5), 0, 0, 0.6);
    mel(toque, 13.75, ['C5:2 C5:1 G5:3 r:10']);
    for (const [k, m] of [91, 96, 100].entries()) sino.note(R(32.0) + k, m, 2, 0.7);
    for (const [k, m] of [84, 87, 91, 94, 98].entries()) sino.note(R(35.2) + k * 2, m, 2, 0.55);

    // AO VIVO DA ROTA (38,5): prato e o motivo inteiro nos metais
    cr.note(R(38.5), 0, 0, 0.8);
    mel(toque, 19.25, [MOTIVO], { vel: 0.8 });
    // as moedas (46,4–47,6): nove, uma por linha, descendo a escala; o Meowth junta tudo no ka-ching (48,1)
    for (let k = 0; k < 9; k++) moeda.note(R(46.4) + k, 31 - Math.round(k * 2.5), 0, 0.8 - k * 0.03);
    for (const [k, p] of [24, 31].entries()) moeda.note(R(48.1) + k, p, 0, 0.9);
    // "Que moedas?" (49,5–52,5): a banda para; ele assobia de inocente (50,1) e cai uma moeda do bolso (51,5)
    padChord(cor, 0, 'Fm7', 24, { low: 55, n: 4, vel: 0.35, at: R(49.5) });
    assobio.note(R(50.1), 0, 0, 0.8);
    assobio2.note(R(50.5), 0, 0, 0.8);
    moeda.note(R(51.5), 12, 0, 0.9);
    moeda.note(R(51.7), 7, 0, 0.4);

    // VESTIÁRIO (53–57): o trecho do EP 2. Tuba e tímpano na espera, o chute (53,6) e o KABOOM (55); a fumaça é o rabo
    mel(tuba, 26.5, ['C2:4 Db2:4 C2:8'], { vel: 0.45 });
    drum(tp, 26.5, 1, '....x...x...xxxx', { vel: 0.35 });
    pe.note(R(53.6), 0, 0, 1);
    boom.note(R(55.0), 0, 0, 1);
    padChord(cor, 0, 'Cm', 16, { low: 48, n: 3, vel: 0.35, at: R(55.4) });

    // PSYDUCK NO ESTÚDIO (57): manchete; "Eu contei treze bolas." (61); "A gente tem doze." (64,5) e o DONG (65)
    manchete(57.0, 'Abmaj7', 84);
    dong.note(R(65.0), 48, 16, 1);
    dong.note(R(65.0), 36, 16, 0.6);
    mel(tuba, 32.5, ['Eb2:4 D2:4 r:8']);
    tuba.note(R(66.0), 37, 12, 0.6); // Db: desce mais um
    padChord(cor, 0, 'Fm', 22, { low: 53, n: 3, vel: 0.3, at: R(65.3) });

    // TODA SEMANA (68): prato, toque; uma nota de sino por sexta do calendário (69,5 · 70 · 70,5 · 71)
    cr.note(R(68.0), 0, 0, 0.6);
    manchete(68.0, 'Cm9', 91);
    for (const [s, m] of [
        [69.5, 86],
        [70.0, 89],
        [70.5, 93],
        [71.0, 98],
    ])
        sino.note(R(s), m, 2, 0.75);
    // TIME ULTIMATE · 27/11 (72): sobe pra Ré; o teremim canta "Ti-me Ul-ti-ma-te" depois da fala (73,2)
    cr.note(R(72.0), 0, 0, 0.7);
    manchete(72.0, 'Dm9', 93);
    mel(ter, 36.5, ['A4:2 A4:1 C5:2 D5:3 r:8'], { vel: 0.6 });
    // 38 (76–78): Si♭7, a carta sai do pacote girando (riser 74–77) e vira em 77 (prato e fanfarra em Mi♭)
    ris3.note(R(74.0), 0, 0, 1);
    drum(kk, 38, 1, 'X...X...X.......');
    drum(sn, 38, 1, 'x.x.xxxx........', { vel: 0.6 });
    drum(tp, 38, 1, 'x...xxXX........', { vel: 0.7 });
    bass(bs, 38, 'Bb7', '0:2 0:2 5:2 s:2 r:8');
    padChord(cor, 38, 'Bb7', 8, { low: 56, n: 4, vel: 0.6 });
    cr.note(R(77.0), 0, 0, 1);
    mel(met, 38.5, ['Eb5:2 G5:2 Bb5:4 r:8'], { harm: thirdBelow(eb) });
    stabs(toque, 38.5, 'Ebmaj7', [[0, 8]], { low: 58, n: 4, vel: 0.6 });

    // TELA FINAL (83): os três cantam o SOC-CER-MON em Mi♭ (teremim, mi-áu e o psy uma oitava abaixo) e as palmas
    cr.note(R(83.0), 0, 0, 0.9);
    // 42 (84–86): a última levada, em Lá♭, e o Mi♭ no 85
    drum(kk, 42, 1, 'X.....x.X.......');
    drum(sn, 42, 1, '....x...........', { vel: 0.6 });
    drum(hh, 42, 1, 'x.x.x.x.........', { vel: 0.6 });
    bass(bs, 42, 'Ab', '0:3 r:1 5:2 0:2 r:8', { vel: 0.8 });
    mel(ter, 41.5, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.8 });
    mel(mia, 41.5, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.7 });
    mel(ps, 41.5, [GANCHO.em({ tom: 3, oitava: -3 })], { vel: 0.8 });
    mel(met, 41.5, [GANCHO.em({ tom: 3, oitava: -1 })], { harm: thirdBelow(eb), vel: 0.5 });
    drum(cl, 41.5, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 41.5, 'Ab', 8, { low: 56, n: 4, vel: 0.55 });
    // 85: Mi♭ e o "ting" da colher, que fica soando até o fim
    cr.note(R(85.0), 0, 0, 0.8);
    stabs(toque, 42.5, 'Eb', [[0, 6]], { low: 58, n: 4 });
    mel(tuba, 42.5, ['Eb2:8 r:8']);
    colher.note(R(85.0), 99, 6, 1);
    return S;
}
