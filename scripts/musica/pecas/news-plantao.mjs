// Soccermon News #1 (pauta 21, 20/11/2026; roteiro em trailer/curtas/news-01/ROTEIRO.md). v5 (14/11): telejornal com
// falas numa caixa de diálogo (16 falas, 68,6 s). Na v5 ("meio desanimada"): a banda anda por baixo das falas (bumbo e
// caixa no tempo, baixo andando, chimbal em colcheia), um blip por letra enquanto a caixa digita (o tom de cada um),
// uma varrida em cada troca de matéria e a despedida nova: o "boa noite" do Alakazam e o "Temos que chutar!" dos três
// juntos (teremim, mi-áu e psy no mesmo grito). A v4 tinha 15 falas e 65,5 s.
// v6 ("texto demais": os números viram gráfico): um som pequeno em cada animação nova (o carimbo do 0.9.51, as cartas
// da recompensa, o ding de cada troféu, a subida de cada barra +4, a moeda do ₽ 3 → 6 → 9, o tique dos dias até o 27/11,
// o papel rasgando no pacote e as cartas virando em dó-mi-sol-dó); o Pay Day anda 0,35 s e a carta ouro vira em 56,5.
// A v1 foi "frenética", a v2 "vaga", a v3 boa mas longa (86,5 s): a v4
// corta a escalada num sumário de cartelas, troca o "Que moedas?" pelo Pay Day e o "doze" pelo Voltorb no banco.
// Vinheta de plantão própria, no molde do livre-ditto. O motivo do jornal ("plan-tão, NO-tí-cia, já!"): Dó Dó Sol↑ Fá
// Mi♭ Fá, Si♭ Dó, Dó dórico. Cada um fala com a própria voz enquanto o texto aparece na caixa (os ~0,3 s da digitação):
// o Alakazam é o teremim (e a colher que entorta é o "ting" de sino), o Meowth é o "mi-áu" (`miau`) e o Psyduck é o
// "psy?" (`psy`: grave, confuso, sobe no fim).
// Reações: o gol em câmera lenta sobe até a vinheta; a escalada (sumário) tem uma batida da vinheta em cada cartela
// (bumbo, tímpano e a cabeça do motivo nos metais) e o "psy?" atrás da porta na última; cada manchete nova ganha um
// toque curto (sino e metais); o Patrocínio brilha; o AO VIVO da Rota tem o motivo nos metais; no Pay Day as moedas
// chovem descendo a escala e fecham no ka-ching; o KABOOM do Voltorb (o mesmo do EP 2); no corte pro banco a banda para
// e o Voltorb pisca no "plim-plim"; o calendário com uma nota por semana; sobe pra Ré no Time Ultimate e pra Mi♭ maior
// na carta; os três cantam o SOC-CER-MON e acaba no "ting".
// 120 BPM, 4/4, compasso = 2 s (linha = 1/8 s). Os tempos abaixo são os segundos do vídeo (index.html); da escalada em
// diante a cama anda meio tempo deslocada (compassos x,25 = 10,5 s + 2k), pra batida cair na troca de cartela.
import { aparece, blip, miau, psy, rasga, sobe, teremim, varrida } from '../curtas.mjs';
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
    ['ala', 4.3],
    ['ala', 7.3],
    ['ala', 18.8],
    ['ala', 21.8],
    ['ala', 24.8],
    ['ala', 28.3],
    ['meo', 31.3],
    ['meo', 34.3],
    ['ala', 37.8],
    ['ala', 41.8],
    ['psy', 44.8, 0.3], // a voz entra 0,3 s depois (depois do corte pro banco); os blips, com o texto
    ['ala', 48.3],
    ['ala', 51.8],
    ['ala', 55.0],
    ['ala', 58.8], // v5c: a despedida tem manchete (SOCCERMON NEWS #1), o texto entra 0,3 s depois
    ['todos', 62.0],
];
/** As varridas entre matérias (s): o meio da varrida, quando a cena troca (igual ao index.html). */
export const VARRIDAS = [10.5, 18.5, 28.0, 37.5, 48.0, 51.5, 58.5];
/** A caixa digita em 0,3 s: um blip a cada 0,05 s (7 por fala). */
const DIGITA = 0.3;
const PASSO = 0.05;
/** A escalada: uma cartela a cada 2 s a partir de 10,5 s. */
export const CARTELAS = [10.5, 12.5, 14.5, 16.5];
/** As moedas do Pay Day caindo no chão (s), iguais a window.__moedas do index.html. */
export const MOEDAS = Array.from({ length: 14 }, (_, k) => 35.58 + k * 0.1);
/** A banda (bateria, baixo, acordes) sai nestes trechos (s): o "E mais", o vestiário e o Voltorb no banco. */
export const BREQUES = [
    [16.5, 18.5],
    [37.5, 41.5],
    [44.8, 46.6], // o Voltorb pisca; a banda volta no corte pro Psyduck balançando
];

export default function news() {
    const S = new Song({ bpm: 120, bars: 35, swing: 0.1, tail: 2.5 });
    const rampa = (t, a, z) => Math.min(1, Math.max(0, (t - a) / 0.04)) * Math.min(1, Math.max(0, (z - t) / 0.08));
    const banda = (t) => BREQUES.reduce((g, [a, z]) => g * (1 - rampa(t, a, z)), 1);
    const B = { gainAt: banda };

    const ter = S.part('teremim', teremim, { pan: -0.1, gain: 0.5, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const mia = S.part('miau', miau, { pan: 0.12, gain: 0.95, corte: 4200, rev: 0.18 });
    const ps = S.part('psy', psy, { pan: 0.08, gain: 1.0, corte: 5000, rev: 0.15 });
    const colher = S.part('colher', I.bell, { pan: -0.2, gain: 1.5, rev: 0.4, echo: { rows: 4, fb: 0.3, mix: 0.3 } });
    const sino = S.part('sino', I.bell, { pan: 0.2, gain: 1.2, rev: 0.3 });
    const plim = S.part('plim', I.bell, { pan: 0.15, gain: 1.4, rev: 0.2, echo: { rows: 1, fb: 0.2, mix: 0.2 } });
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
    const bl = S.part('blip', blip, { drum: true, gain: 0.32, pan: 0.05, rev: 0.05 });
    const vr = S.part('varrida', varrida, { drum: true, gain: 0.55, rev: 0.2 });
    // v6
    const rs = S.part('rasga', rasga, { drum: true, gain: 0.7, pan: 0.1, rev: 0.12 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.32, pan: -0.1, rev: 0.1 });
    const tq = S.part('tique', I.block, { pan: 0.15, gain: 0.5 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.45 });
    const sk = S.part('shaker', I.shaker, { drum: true, gain: 0.5, pan: 0.2 });

    const bb = MAJOR(10); // Dó dórico = as notas de Si♭ maior
    const eb = MAJOR(3);
    /** O groove do estúdio (enquanto a caixa está na tela): bumbo e caixa no tempo, chimbal em colcheia, o baixo
     * andando e o piano em contratempo. Na v4 ele "respirava" (bumbo no 1, aro no 3, baixo comprido) e ficou parado. */
    const ar = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.....x.X.....x.', { vel: 0.7 });
        drum(sn, b, 1, '....x..o....x...', { vel: 0.5 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
        bass(bs, b, c, '0:2 r:1 0:1 5:2 8:2 r:1 s:1 5:2 3:2 2:2', { vel: 0.65 });
        stabs(
            ep,
            b,
            c,
            [
                [2, 2],
                [6, 2],
                [10, 2],
                [14, 1],
            ],
            { low: 60, n: 4, vel: 0.38 },
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

    // 0 · o gol em câmera lenta: cordas abrindo, riser, tímpano rufando; a rede (0,9 s) e a torcida no pulo (1 s)
    padChord(cor, 0, 'Cm9', 16, { low: 55, n: 4, vel: 0.55 });
    ris.note(0, 0, 0, 1);
    mel(tuba, 0, ['C2:16'], { vel: 0.6 });
    rd.note(7, 0, 0, 0.9);
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

    // a cama: respirando no estúdio, leve nas matérias (a banda some nos BREQUES); da escalada em diante, em x,25
    const CAMA = [
        // [compasso, acorde, modo, semitons]
        [2, 'Cm7', ar],
        [3, 'F7', ar],
        [4, 'Cm7', ar], // 4–10: o Alakazam se apresenta e chama o sumário
        [5.25, 'Cm7', leve],
        [6.25, 'F7', leve],
        [7.25, 'Cm7', leve], // 10,5–16,5: as cartelas 1, 2 e 3 (a 4, "E mais", segura a banda)
        ...[9.25, 10.25, 11.25, 12.25, 13.25].map((b, k) => [b, k % 2 ? 'F7' : 'Cm7', leve]), // 18,5–28,5: Copa do Dia
        ...[14.25, 15.25, 16.25, 17.25, 18.25].map((b, k) => [b, k % 2 ? 'Cm7' : 'F7', leve]), // 28,5–38,5: Rota
        [20.25, 'Ab', ar],
        [21.25, 'Cm7', ar],
        [22.25, 'Ab', ar],
        [23.25, 'Cm7', ar], // 40,5–48,5: o Psyduck no estúdio, o banco (breque 44,8–48)
        [24.25, 'Cm7', leve],
        [25.25, 'F7', leve, 2], // toda semana; o fim dela já sobe pra Ré
        [26.25, 'Cm7', leve, 2], // Time Ultimate, em Ré
        [28.25, 'Ebmaj7', ar],
        [29.25, 'Ab', ar], // "Muito obrigado pela companhia, e boa noite!"
        [30.25, 'Bb7', ar], // a despedida até 62
        [31.25, 'Bb7', leve], // "Temos que chutar!" (o grito em 62,3); a tela final em 65
    ];
    for (const [b, c, modo, s = 0] of CAMA) modo(b, c, s);
    // 10–10,5: a caixa puxa a escalada
    drum(sn, 5, 1, 'x.xx............', { vel: 0.7 });

    // as vozes: cada fala começa com quem fala, por cima da digitação
    const FRASES = {
        ala: ['G5:2 C6:2', 'Eb5:1 G5:1 C6:2', 'C6:2 Bb5:1 G5:1', 'F5:1 G5:1 Bb5:2'],
        meo: ['G4:2 Eb5:3', 'C5:1 G5:4'],
        psy: ['A2:4', 'G2:5'],
    };
    const VOZ = { ala: [ter, 0.7], meo: [mia, 0.9], psy: [ps, 1] };
    // o blip de cada letra: o tom de cada um (Alakazam médio, Meowth agudo, Psyduck grave) e um desenho de fala que muda
    // a cada fala (sobe, desce, pergunta)
    const TOM = { ala: -2, meo: 7, psy: -14 };
    const DESENHO = [0, 2, 4, 2, 5, 3, 0, 1, 3, 5, 2, 0];
    FALAS.forEach(([quem, s], i) => {
        const quems = quem === 'todos' ? ['ala', 'meo', 'psy'] : [quem];
        const n = Math.round(DIGITA / PASSO) + 1;
        for (let k = 0; k < n; k++)
            for (const q of quems)
                bl.note(
                    (s + k * PASSO) * 8,
                    TOM[q] + DESENHO[(k + i) % DESENHO.length],
                    0,
                    (0.75 - 0.05 * (k % 2)) * (quems.length > 1 ? 0.55 : 1),
                );
    });
    FALAS.forEach(([quem, s, atraso = 0], i) => {
        if (quem === 'todos') return; // o grito dos três vem depois
        const frase = FRASES[quem][i % FRASES[quem].length];
        let r = R(s + atraso);
        const [P, v] = VOZ[quem];
        for (const tok of frase.split(' ')) {
            const [n, l] = tok.split(':');
            P.note(r, midi(n), Number(l), v);
            r += Number(l);
        }
    });
    // v6 · o 0.9.51 carimba no telão (7,5): bumbo, tom e dois sinos (baixinhos: a fala está no ar)
    kk.note(R(7.5), 0, 0, 0.6);
    tm.note(R(7.5), 0, 0, 0.45);
    sino.note(R(7.5), 96, 2, 0.4);
    sino.note(R(7.5) + 1, 103, 3, 0.4);
    // o "ting" da colher: o Alakazam se apresenta (4,3 s) e se despede (fim)
    colher.note(R(4.3), 98, 4, 0.75);
    // v5: o "ting" também no aviso (48,3) e no "boa noite" da despedida (59,6)
    colher.note(R(48.3), 98, 4, 0.6);
    colher.note(R(59.6), 98, 4, 0.75);
    manchete(58.5, 'Ebmaj7', 91); // v5c: a manchete SOCCERMON NEWS #1 na despedida
    // as varridas entre matérias: o pico do "fuuuh" (0,2 s depois do início) cai no corte
    for (const s of VARRIDAS) vr.note((s - 0.2) * 8, 0, 0, 1);
    // v5: o Psyduck balançando (46,6): a tuba balança junto
    tuba.note(R(46.6), 36, 1, 0.4);
    tuba.note(R(46.85), 35, 1, 0.35);
    tuba.note(R(47.1), 36, 2, 0.4);

    // ESCALADA (10,5–18,5): uma batida da vinheta em cada cartela (bumbo, tímpano e a cabeça do motivo nos metais, uma
    // terça acima a cada uma); a do Meowth tem um mi-áu curtinho; na 4ª ("E mais") a banda segura e o "psy?" sai da porta
    CARTELAS.forEach((s, k) => {
        kk.note(R(s), 0, 0, 1);
        tp.note(R(s), 0, 0, 0.9);
        mel(met, s / 2, ['C5:1 C5:1 G5:2 r:12'], { shift: [0, 3, 5, 0][k], vel: 0.85 });
        mel(met2, s / 2, ['C5:1 C5:1 G5:2 r:12'], { shift: [0, 3, 5, 0][k] - 12, harm: thirdBelow(bb), vel: 0.7 });
    });
    cr.note(R(10.5), 0, 0, 0.7);
    mia.note(R(13.1), 79, 3, 0.55);
    padChord(cor, 0, 'Abmaj7', 16, { low: 55, n: 4, vel: 0.5, at: R(16.5) });
    for (const s of [17.0, 17.5]) pulso.note(R(s), 67, 2, 0.5);
    ps.note(R(17.3), 43, 4, 0.9);
    ris.note(R(16.5), 0, 0, 0.6);

    // COPA DO DIA (18,5): prato, o motivo curto; o Patrocínio ganha a moldura dourada (22,3) e a carta amplia (25)
    cr.note(R(18.5), 0, 0, 0.6);
    mel(toque, 18.5 / 2, ['C5:2 C5:1 G5:3 r:10']);
    // v6 · as 3 opções da recompensa entram (19 · 19,35 · 19,7): um "bwoop" cada, subindo
    for (const [k, s] of [19.0, 19.35, 19.7].entries()) ap.note(s * 8, k * 3, 0, 0.9);
    // v6 · os 4 troféus que acendem (22,3 · 22,8 · 23,3 · 23,8): um ding cada, subindo; a carta do Patrocínio em 24,1
    for (const [k, m] of [91, 94, 98, 103].entries()) sino.note(R(22.3 + k * 0.5), m, 3, 0.8);
    ap.note(24.1 * 8, 5, 0, 1);
    // v6 · o placar PERDENDO (25,3): a tuba cai "uon-uon"; cada barra ganha +4 (25,6 a 26,85, uma por colcheia): o bumbo
    // da Charanga e uma subida curta de dois bips, cada barra um degrau acima
    tuba.note(25.3 * 8, 43, 1, 0.55);
    tuba.note(25.3 * 8 + 1, 38, 1.4, 0.5);
    [25.6, 25.85, 26.1, 26.35, 26.6, 26.85].forEach((s, k) => {
        const m = [72, 74, 76, 77, 79, 81][k];
        tm.note(s * 8, 4, 0, 0.8);
        pulso.note(s * 8, m, 0.9, 0.6);
        pulso.note(s * 8 + 0.9, m + 12, 0.9, 0.55);
    });

    // AO VIVO DA ROTA (28): prato e o motivo inteiro nos metais
    cr.note(R(28.0), 0, 0, 0.8);
    mel(toque, 14, [MOTIVO], { vel: 0.8 });
    // v6 · o ₽ da Rota: cada vitória (32,5 · 33,5 · 34,5) é uma moeda "ka-ching" e o contador sobe 3 → 6 → 9
    for (const [k, s] of [32.5, 33.5, 34.5].entries()) {
        moeda.note(R(s), 24 + k * 2, 0, 0.6);
        moeda.note(R(s) + 1, 31 + k * 2, 0, 0.6);
        sino.note(R(s), [86, 89, 93][k], 2, 0.3);
    }
    // PAY DAY (v6: o pulo em 35): o amuleto brilha no pulo (35,15); as 14 moedas caem descendo a escala; o ka-ching na pose (36,9)
    sino.note(35.15 * 8, 103, 2, 0.7);
    MOEDAS.forEach((s, k) => {
        moeda.note(R(s), 31 - Math.round(k * 1.6), 0, 0.8 - k * 0.02);
    });
    for (const [k, p] of [24, 31].entries()) moeda.note(36.9 * 8 + k, p, 0, 0.9);

    // VESTIÁRIO (37,5–41,5): o trecho do EP 2. Tuba e tímpano na espera, o chute (38,1) e o KABOOM (39,5)
    mel(tuba, 37.5 / 2, ['C2:4 Db2:4 C2:8'], { vel: 0.45 });
    drum(tp, 37.5 / 2, 1, '....x...x...xxxx', { vel: 0.35 });
    pe.note(R(38.1), 0, 0, 1);
    boom.note(R(39.5), 0, 0, 1);
    padChord(cor, 0, 'Cm', 16, { low: 48, n: 3, vel: 0.35, at: R(39.9) });

    // PSYDUCK NO ESTÚDIO (41,5): manchete; "o que vocês fizeram com o Voltorb?"
    manchete(41.5, 'Abmaj7', 84);
    // O BANCO (44,8): a banda para; o Voltorb pisca duas vezes (45,8 e 46,15) no "plim-plim", e a tuba ri baixinho
    padChord(cor, 0, 'Fm9', 24, { low: 55, n: 4, vel: 0.3, at: R(44.8) });
    tuba.note(R(44.8), 36, 2, 0.5);
    tuba.note(R(45.05), 31, 3, 0.45);
    plim.note(R(45.8), 100, 1, 0.8);
    plim.note(R(46.15), 105, 2, 0.8);

    // TODA SEMANA (48): prato, toque; uma nota de sino por sexta do calendário (49 · 49,5 · 50 · 50,5)
    cr.note(R(48.0), 0, 0, 0.6);
    manchete(48.0, 'Cm9', 91);
    for (const [s, m] of [
        [49.0, 86],
        [49.5, 89],
        [50.0, 93],
        [50.5, 98],
    ])
        sino.note(R(s), m, 2, 0.75);
    // TIME ULTIMATE · 27/11 (51,5): sobe pra Ré; o teremim canta "Ti-me Ul-ti-ma-te" na moldura dourada (52,3)
    cr.note(R(51.5), 0, 0, 0.7);
    manchete(51.5, 'Dm9', 93);
    mel(ter, R(52.3) / 16, ['A4:2 A4:1 C5:2 D5:3 r:8'], { vel: 0.6 });
    // v6 · a folhinha: um tique por dia (20 a 27/11, de 51,85 a 52,5) e o carimbo do 27 (bumbo, prato e sino)
    for (let k = 0; k < 8; k++) tq.note((51.85 + k * 0.093) * 8, 84 + k, 1, 0.55 + 0.04 * k);
    kk.note(52.5 * 8, 0, 0, 0.9);
    cr.note(52.5 * 8, 0, 0, 0.5);
    sino.note(52.5 * 8, 98, 3, 0.6);
    // 55–56,5: Si♭7, o pacote cai (55), treme (55,2: o chocalho), rasga (55,45) e as cartas saem (55,55 a 56,03: um
    // "bwoop" cada); viram em dó-mi-sol-dó de Si♭ (56 · 56,12 · 56,24 · 56,36) e a carta ouro vira em 56,5 (prato e
    // fanfarra em Mi♭; o riser vai de 53,5 a 56,5)
    ris3.note(R(53.5), 0, 0, 1);
    tm.note(55.0 * 8 + 1, 0, 0, 0.45);
    for (let k = 0; k < 4; k++) sk.note((55.2 + k * 0.06) * 8, 0, 0, 0.5);
    rs.note(55.45 * 8, 0, 0, 0.75);
    for (const [k, s] of [55.55, 55.67, 55.79, 55.91, 56.03].entries()) ap.note(s * 8, 2 + k, 0, 0.4);
    for (const [k, s] of [56.0, 56.12, 56.24, 56.36].entries()) sino.note(s * 8, [82, 86, 89, 94][k], 1, 0.7);
    drum(kk, 27.75, 1, 'X...X...X.......', { vel: 0.7 }); // v5: abaixo da fala (55 s); v6: 0,5 s depois, cai na carta ouro
    drum(sn, 27.75, 1, 'x.x.xxxx........', { vel: 0.45 });
    drum(tp, 27.75, 1, 'x...xxXX........', { vel: 0.5 });
    bass(bs, 27.5, 'Bb7', '0:2 0:2 5:2 s:2 r:8', { vel: 0.7 });
    padChord(cor, 27.5, 'Bb7', 12, { low: 56, n: 4, vel: 0.6 });
    cr.note(R(56.5), 0, 0, 1);
    mel(met, 28.25, ['Eb5:2 G5:2 Bb5:4 r:8'], { harm: thirdBelow(eb) });
    stabs(toque, 28.25, 'Ebmaj7', [[0, 8]], { low: 58, n: 4, vel: 0.6 });

    // "TEMOS QUE CHUTAR!" (62): a caixa digita com os três blips juntos e em 62,3 os três gritam no mesmo ritmo
    // (Te-mos-que-chu-TAR: o teremim em cima, o mi-áu uma oitava abaixo e o psy no grave); prato e metais no "TAR"
    // (62,8), quando eles pulam de novo; riser e virada até a tela final (65)
    const GRITO = 'G5:1 G5:1 G5:1 Bb5:1 C6:5 r:7';
    mel(ter, 62.3 / 2, [GRITO], { vel: 0.85 });
    mel(mia, 62.3 / 2, [GRITO], { shift: -12, vel: 0.85 });
    mel(ps, 62.3 / 2, [GRITO], { shift: -36, vel: 0.9 });
    mel(met, 62.3 / 2, [GRITO], { shift: -12, harm: thirdBelow(bb), vel: 0.45 });
    kk.note(R(62.3), 0, 0, 0.9);
    cr.note(R(62.8), 0, 0, 0.9);
    stabs(toque, 0, 'Bb7', [[R(62.8), 3]], { low: 58, n: 4, vel: 0.7 });
    ris.note(R(63.0), 0, 0, 0.7);
    drum(sn, 31.5, 1, '............xxXX', { vel: 0.6 });

    // TELA FINAL (65): os três cantam o SOC-CER-MON em Mi♭ (teremim, mi-áu e o psy uma oitava abaixo) e as palmas
    cr.note(R(65.0), 0, 0, 0.9);
    drum(kk, 32.5, 1, 'X.....x.X.....x.');
    drum(sn, 32.5, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 32.5, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.55 });
    bass(bs, 32.5, 'Ab', '0:3 r:1 5:2 0:2 r:8', { vel: 0.8 });
    mel(ter, 32.5, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.8 });
    mel(mia, 32.5, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.7 });
    mel(ps, 32.5, [GANCHO.em({ tom: 3, oitava: -3 })], { vel: 0.8 });
    mel(met, 32.5, [GANCHO.em({ tom: 3, oitava: -1 })], { harm: thirdBelow(eb), vel: 0.5 });
    drum(cl, 32.5, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 32.5, 'Ab', 8, { low: 56, n: 4, vel: 0.55 });
    // 66,5: Mi♭ e o "ting" da colher
    cr.note(R(66.5), 0, 0, 0.8);
    stabs(toque, 0, 'Eb', [[R(66.5), 6]], { low: 58, n: 4 });
    tuba.note(R(66.5), 39, 8, 1);
    colher.note(R(66.5), 99, 6, 1);
    // v5c · o compasso de fecho (66,5–68,5): a banda puxa em Mi♭ e fecha com tudo em 67,5 (prato, bumbo, tuba e metais);
    // o vídeo acaba em 68,6 com o acorde ainda soando
    drum(kk, 33.25, 1, 'X.....x.X.......');
    drum(sn, 33.25, 1, '....x.xxX.......', { vel: 0.6 });
    drum(hh, 33.25, 1, 'x.x.x.x.........', { vel: 0.5 });
    bass(bs, 33.25, 'Eb', '0:2 5:2 8:2 s:2 0:4 r:4', { vel: 0.8 });
    mel(met, 33.25, ['Eb5:1 G5:1 Bb5:2 r:4 Eb6:4 r:4'], { harm: thirdBelow(eb), vel: 0.6 });
    cr.note(R(67.5), 0, 0, 1);
    tuba.note(R(67.5), 39, 8, 0.9);
    padChord(cor, 0, 'Eb', 8, { low: 55, n: 4, vel: 0.6, at: R(67.5) });
    return S;
}
