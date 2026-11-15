// Soccermon News #1 (pauta 21, 20/11/2026; roteiro em trailer/curtas/news-01/ROTEIRO.md). v5 (14/11): telejornal com
// falas numa caixa de diálogo. Na v5 ("meio desanimada"): a banda anda por baixo das falas (bumbo e caixa no tempo,
// baixo andando, chimbal em colcheia), um blip por letra enquanto a caixa digita (o tom de cada um), uma varrida em
// cada troca de matéria e a despedida nova: o "boa noite" do apresentador e o "Temos que chutar!" dos três juntos.
// v6 ("texto demais": os números viram gráfico): um som pequeno em cada animação nova (o carimbo do 0.9.51, as cartas
// da recompensa, o ding de cada troféu, a subida de cada barra +4, a moeda do ₽ 3 → 6 → 9, o tique dos dias até o 27/11,
// o papel rasgando no pacote e as cartas virando em dó-mi-sol-dó).
// v7 (15/11, 75,6 s): o Pikachu apresenta no lugar do Alakazam (voz nova `pika`: blips agudos e curtos; o teremim saiu);
// entram a sonora do Magikarp (28–31, o PLOF como voz) e o link ao vivo com atraso de satélite (31–38,3: a tela
// dividida; a banda para 1 s enquanto o Meowth não ouve e volta no "Boa noite, Pikachu!"); o holofote na Charanga
// (20,6); a piscadinha sem graça do Pikachu depois do KABOOM (48,6); e o ducking: a banda abaixa nos 0,7 s em que cada
// voz entra (a fala do pacote ficava só 1,8 dB acima da banda). Depois de 31,3 da v6 tudo anda +7 s.
// Vinheta de plantão própria, no molde do livre-ditto. O motivo do jornal ("plan-tão, NO-tí-cia, já!"): Dó Dó Sol↑ Fá
// Mi♭ Fá, Si♭ Dó, Dó dórico. Cada um fala com a própria voz enquanto o texto aparece na caixa (os ~0,3 s da digitação):
// o Pikachu é o `pika` (e o choquinho é o "ting" de sino), o Meowth é o "mi-áu" (`miau`), o Psyduck é o "psy?" (`psy`)
// e o Magikarp é o PLOF (`splash`).
// 120 BPM, 4/4, compasso = 2 s (linha = 1/8 s). Os tempos abaixo são os segundos do vídeo (index.html); da escalada em
// diante a cama anda meio tempo deslocada (compassos x,25 = 10,5 s + 2k), pra batida cair na troca de cartela.
import { aparece, blip, miau, pika, psy, rasga, sobe, splash, varrida } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { kaboom } from './livre-bolas.mjs';
import { chute, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Soccermon News: plantão', tela: 'Soccermon News #1 (vídeo)' };

/** O motivo do jornal (um compasso, Dó dórico). */
export const MOTIVO = 'C5:2 C5:1 G5:3 F5:1 Eb5:1 F5:2 r:2 Bb4:2 C5:2';
/** Segundo do vídeo → linha da peça. */
const R = (s) => Math.round(s * 8);
/** Quem fala e quando o texto começa a aparecer (s), igual ao index.html (window.__falas). */
export const FALAS = [
    ['pik', 4.3],
    ['pik', 7.3],
    ['pik', 18.8],
    ['pik', 21.8],
    ['pik', 24.8],
    ['mag', 28.0], // v7: a sonora do Magikarp
    ['pik', 31.3], // v7: "…Boa noite, Meowth."
    ['meo', 35.3], // v7: "Boa noite, Pikachu!" (depois do atraso do satélite)
    ['meo', 38.3],
    ['meo', 41.3],
    ['pik', 44.8],
    ['pik', 49.0], // v7: a pergunta ao Psyduck começa depois da piscadinha
    ['psy', 52.0, 0.3], // a voz entra 0,3 s depois (depois do corte pro banco); os blips, com o texto
    ['pik', 55.3],
    ['pik', 58.8],
    ['pik', 62.0],
    ['pik', 65.8],
    ['todos', 69.0],
];
/** As varridas entre matérias (s): o meio da varrida, quando a cena troca (igual ao index.html). */
export const VARRIDAS = [10.5, 18.5, 31.0, 44.5, 55.0, 58.5, 65.5];
/** A caixa digita em 0,3 s: um blip a cada 0,05 s (7 por fala). */
const DIGITA = 0.3;
const PASSO = 0.05;
/** A escalada: uma cartela a cada 2 s a partir de 10,5 s. */
export const CARTELAS = [10.5, 12.5, 14.5, 16.5];
/** As moedas do Pay Day chegando no chão (s), iguais a window.__moedas do index.html (v7: caem de cima). */
export const MOEDAS = Array.from({ length: 14 }, (_, k) => +(42.6 + k * 0.09).toFixed(3));
/** A banda (bateria, baixo, acordes) sai nestes trechos (s): o "E mais", o atraso do satélite, o vestiário e o
 * Voltorb no banco. */
export const BREQUES = [
    [16.5, 18.5],
    [34.3, 35.3], // v7: o Meowth não ouviu (o atraso do link)
    [44.5, 48.5],
    [52.0, 53.6], // o Voltorb pisca; a banda volta no corte pro Psyduck balançando
];
/** As vozes (não abaixam no ducking). */
export const VOZES = ['pika', 'miau', 'psy', 'plof', 'blip'];

export default function news() {
    const S = new Song({ bpm: 120, bars: 38, swing: 0.1, tail: 2.5 });
    const rampa = (t, a, z) => Math.min(1, Math.max(0, (t - a) / 0.04)) * Math.min(1, Math.max(0, (z - t) / 0.08));
    const banda = (t) => BREQUES.reduce((g, [a, z]) => g * (1 - rampa(t, a, z)), 1);
    const B = { gainAt: banda };

    const pk = S.part('pika', pika, { pan: -0.1, gain: 0.78, rev: 0.15, echo: { rows: 3, fb: 0.2, mix: 0.1 } });
    const mia = S.part('miau', miau, { pan: 0.12, gain: 0.95, corte: 4200, rev: 0.18 });
    const ps = S.part('psy', psy, { pan: 0.08, gain: 1.0, corte: 5000, rev: 0.15 });
    const plof = S.part('plof', splash, { pan: 0.1, gain: 1.0, rev: 0.15 });
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
    const rs = S.part('rasga', rasga, { drum: true, gain: 0.7, pan: 0.1, rev: 0.12 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.32, pan: -0.1, rev: 0.1 });
    const tq = S.part('tique', I.block, { pan: 0.15, gain: 0.5 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.45 });
    const sk = S.part('shaker', I.shaker, { drum: true, gain: 0.5, pan: 0.2 });

    const bb = MAJOR(10); // Dó dórico = as notas de Si♭ maior
    const eb = MAJOR(3);
    /** O groove do estúdio (enquanto a caixa está na tela): bumbo e caixa no tempo, chimbal em colcheia, o baixo
     * andando e o piano em contratempo. */
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

    // a cama: respirando no estúdio, leve nas matérias (a banda some nos BREQUES); da escalada em diante, em x,25; depois
    // da sonora (v7, +3 s) em x,5 e depois do link (+7 s) em x,75
    const CAMA = [
        // [compasso, acorde, modo, semitons]
        [2, 'Cm7', ar],
        [3, 'F7', ar],
        [4, 'Cm7', ar], // 4–10: o Pikachu se apresenta e chama o sumário
        [5.25, 'Cm7', leve],
        [6.25, 'F7', leve],
        [7.25, 'Cm7', leve], // 10,5–16,5: as cartelas 1, 2 e 3 (a 4, "E mais", segura a banda)
        ...[9.25, 10.25, 11.25, 12.25, 13.25, 14.25].map((b, k) => [b, k % 2 ? 'F7' : 'Cm7', leve]), // 18,5–30,5: Copa do Dia e a sonora
        ...[15.5, 16.5, 17.5, 18.5, 19.5, 20.5, 21.5].map((b, k) => [b, k % 2 ? 'Cm7' : 'F7', leve]), // 31–45: o link e a Rota
        [23.75, 'Ab', ar],
        [24.75, 'Cm7', ar],
        [25.75, 'Ab', ar],
        [26.75, 'Cm7', ar], // 47,5–55,5: o Psyduck no estúdio, o banco (breque 52–53,6)
        [27.75, 'Cm7', leve],
        [28.75, 'F7', leve, 2], // toda semana; o fim dela já sobe pra Ré
        [29.75, 'Cm7', leve, 2], // Time Ultimate, em Ré
        [31.75, 'Ebmaj7', ar],
        [32.75, 'Ab', ar], // "Muito obrigado pela companhia, e boa noite!"
        [33.75, 'Bb7', ar], // a despedida até 69
        [34.75, 'Bb7', leve], // "Temos que chutar!" (o grito em 69,3); a tela final em 72
    ];
    for (const [b, c, modo, s = 0] of CAMA) modo(b, c, s);
    // 10–10,5: a caixa puxa a escalada
    drum(sn, 5, 1, 'x.xx............', { vel: 0.7 });

    // as vozes: cada fala começa com quem fala, por cima da digitação
    const FRASES = {
        pik: ['C6:1 Bb5:1 r:1 F6:1', 'G5:1 C6:1 D6:2', 'Eb6:1 C6:1 r:1 G5:1 C6:1', 'F5:1 G5:1 Bb5:1 C6:1'],
        meo: ['G4:2 Eb5:3', 'C5:1 G5:4'],
        psy: ['A2:4', 'G2:5'],
        mag: ['G4:1 r:1 G4:1 C5:1 r:1 Bb4:2'],
    };
    const VOZ = { pik: [pk, 0.8], meo: [mia, 0.9], psy: [ps, 1], mag: [plof, 0.9] };
    // o blip de cada letra: o tom de cada um (Pikachu agudo, Meowth mais agudo, Magikarp médio, Psyduck grave) e um
    // desenho de fala que muda a cada fala (sobe, desce, pergunta)
    const TOM = { pik: 3, meo: 7, psy: -14, mag: -5 };
    const DESENHO = [0, 2, 4, 2, 5, 3, 0, 1, 3, 5, 2, 0];
    FALAS.forEach(([quem, s], i) => {
        const quems = quem === 'todos' ? ['pik', 'meo', 'psy'] : [quem];
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
            if (n !== 'r') P.note(r, midi(n), Number(l), v);
            r += Number(l);
        }
    });
    // v7 · o ducking: nos 0,7 s em que cada voz entra, tudo menos as vozes abaixa (o carimbo, os bips e a banda ficam
    // por baixo da fala)
    const DUCK = 0.5; // −6 dB
    const duckAt = (t) =>
        FALAS.reduce((g, [, s, atraso = 0]) => {
            const a = s + atraso - 0.03;
            const z = a + 0.75;
            const u = Math.min(1, Math.max(0, (t - a) / 0.05)) * Math.min(1, Math.max(0, (z - t) / 0.2));
            return g * (1 - DUCK * u);
        }, 1);
    // tabelado de 1 em 1 ms (o gainAt roda por amostra em todas as faixas)
    const DK = Float32Array.from({ length: 80000 }, (_, i) => duckAt(i / 1000));
    const duck = (t) => DK[Math.min(DK.length - 1, Math.max(0, Math.round(t * 1000)))];

    // v6 · o 0.9.51 carimba no telão (7,5): bumbo, tom e dois sinos (baixinhos: a fala está no ar)
    kk.note(R(7.5), 0, 0, 0.6);
    tm.note(R(7.5), 0, 0, 0.45);
    sino.note(R(7.5), 96, 2, 0.4);
    sino.note(R(7.5) + 1, 103, 3, 0.4);
    // o "ting" do choquinho: o Pikachu se apresenta (4,3 s), no aviso (55,3) e no "boa noite" da despedida (66,6)
    colher.note(R(4.3), 98, 4, 0.75);
    colher.note(R(55.3), 98, 4, 0.6);
    colher.note(R(66.6), 98, 4, 0.75);
    manchete(65.5, 'Ebmaj7', 91); // a manchete SOCCERMON NEWS #1 na despedida
    // as varridas entre matérias: o pico do "fuuuh" (0,2 s depois do início) cai no corte
    for (const s of VARRIDAS) vr.note((s - 0.2) * 8, 0, 0, 1);
    // o Psyduck balançando (53,6): a tuba balança junto
    tuba.note(R(53.6), 36, 1, 0.4);
    tuba.note(R(53.85), 35, 1, 0.35);
    tuba.note(R(54.1), 36, 2, 0.4);

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

    // COPA DO DIA (18,5): prato, o motivo curto; a cabeça no telão e o corte pro VT (19,5)
    cr.note(R(18.5), 0, 0, 0.6);
    mel(toque, 18.5 / 2, ['C5:2 C5:1 G5:3 r:10']);
    // as 3 opções da recompensa entram (v7: 19,65 · 19,9 · 20,15): um "bwoop" cada, subindo; o holofote na Charanga
    // (20,6): o tom e um sino em cima
    for (const [k, s] of [19.65, 19.9, 20.15].entries()) ap.note(s * 8, k * 3, 0, 0.9);
    tm.note(20.6 * 8, 5, 0, 0.7);
    sino.note(20.6 * 8, 98, 3, 0.6);
    sino.note(20.6 * 8 + 1, 103, 3, 0.5);
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
    // v7 · a SONORA (28): o corte pra quadra (o tom) e a tarja do Magikarp entrando (28,6)
    tm.note(R(28.0), 2, 0, 0.5);
    ap.note(28.6 * 8, 4, 0, 0.5);

    // AO VIVO DA ROTA (31): prato e o motivo inteiro nos metais
    cr.note(R(31.0), 0, 0, 0.8);
    mel(toque, 15.5, [MOTIVO], { vel: 0.8 });
    // v7 · a tela dividida (32): um "fuuuh" baixinho e as duas tarjas entrando (32,2)
    vr.note((32.0 - 0.2) * 8, 3, 0, 0.45);
    ap.note(32.2 * 8, 6, 0, 0.45);
    // v7 · o atraso do satélite (34,3–35,3): a banda para; só as cordas e dois bips de satélite; o "Boa noite, Pikachu!"
    // (35,3) volta com o prato
    padChord(cor, 0, 'Fm9', 8, { low: 55, n: 4, vel: 0.3, at: R(34.3) });
    pulso.note(R(34.55), 96, 1, 0.35);
    pulso.note(R(34.95), 96, 1, 0.35);
    cr.note(R(35.3), 0, 0, 0.5);
    // v7 · o corte pra Rota em tela cheia (38,3)
    cr.note(R(38.3), 0, 0, 0.4);
    // o ₽ da Rota: cada vitória (39,5 · 40,5 · 41,5) é uma moeda "ka-ching" e o contador sobe 3 → 6 → 9
    for (const [k, s] of [39.5, 40.5, 41.5].entries()) {
        moeda.note(R(s), 24 + k * 2, 0, 0.6);
        moeda.note(R(s) + 1, 31 + k * 2, 0, 0.6);
        sino.note(R(s), [86, 89, 93][k], 2, 0.3);
    }
    // PAY DAY (o pulo em 42): o amuleto brilha no pulo (42,15); as 14 moedas caem de cima descendo a escala; o ka-ching na pose (43,9)
    sino.note(42.15 * 8, 103, 2, 0.7);
    MOEDAS.forEach((s, k) => {
        moeda.note(R(s), 31 - Math.round(k * 1.6), 0, 0.8 - k * 0.02);
    });
    for (const [k, p] of [24, 31].entries()) moeda.note(43.9 * 8 + k, p, 0, 0.9);

    // VESTIÁRIO (44,5–48,5): o trecho do EP 2. Tuba e tímpano na espera, o chute (45,1) e o KABOOM (46,5)
    mel(tuba, 44.5 / 2, ['C2:4 Db2:4 C2:8'], { vel: 0.45 });
    drum(tp, 44.5 / 2, 1, '....x...x...xxxx', { vel: 0.35 });
    pe.note(R(45.1), 0, 0, 1);
    boom.note(R(46.5), 0, 0, 1);
    padChord(cor, 0, 'Cm', 16, { low: 48, n: 3, vel: 0.35, at: R(46.9) });

    // PSYDUCK NO ESTÚDIO (48,5): v7: a piscadinha sem graça do Pikachu (48,6: o "plim" e a tuba descendo); a pergunta
    plim.note(R(48.6), 96, 1, 0.55);
    tuba.note(R(48.7), 38, 1, 0.35);
    tuba.note(R(48.85), 36, 1, 0.3);
    // O BANCO (52): a banda para; o Voltorb pisca duas vezes (53 e 53,35) no "plim-plim", e a tuba ri baixinho
    padChord(cor, 0, 'Fm9', 24, { low: 55, n: 4, vel: 0.3, at: R(52.0) });
    tuba.note(R(52.0), 36, 2, 0.5);
    tuba.note(R(52.25), 31, 3, 0.45);
    plim.note(R(53.0), 100, 1, 0.8);
    plim.note(R(53.35), 105, 2, 0.8);

    // TODA SEMANA (55): prato, toque; uma nota de sino por sexta do calendário (56 · 56,5 · 57 · 57,5)
    cr.note(R(55.0), 0, 0, 0.6);
    manchete(55.0, 'Cm9', 91);
    for (const [s, m] of [
        [56.0, 86],
        [56.5, 89],
        [57.0, 93],
        [57.5, 98],
    ])
        sino.note(R(s), m, 2, 0.75);
    // TIME ULTIMATE (58,5): sobe pra Ré; o Pikachu canta "Ti-me Ul-ti-ma-te" na moldura dourada (59,3)
    cr.note(R(58.5), 0, 0, 0.7);
    manchete(58.5, 'Dm9', 93);
    mel(pk, R(59.3) / 16, ['A5:2 A5:1 C6:2 D6:3 r:8'], { vel: 0.5 });
    // a folhinha: um tique por dia (20 a 27/11, de 58,85 a 59,5) e o carimbo do 27 (bumbo, prato e sino)
    for (let k = 0; k < 8; k++) tq.note((58.85 + k * 0.093) * 8, 84 + k, 1, 0.55 + 0.04 * k);
    kk.note(59.5 * 8, 0, 0, 0.9);
    cr.note(59.5 * 8, 0, 0, 0.5);
    sino.note(59.5 * 8, 98, 3, 0.6);
    // 62–63,5: Si♭7, o pacote cai (62), treme (62,2: o chocalho), rasga (62,45) e as cartas saem (62,55 a 63,03: um
    // "bwoop" cada); viram em dó-mi-sol-dó de Si♭ (63 · 63,12 · 63,24 · 63,36) e a carta ouro vira em 63,5 (prato e
    // fanfarra em Mi♭; o riser vai de 60,5 a 63,5) e vem pro meio da tela (63,65)
    ris3.note(R(60.5), 0, 0, 1);
    tm.note(62.0 * 8 + 1, 0, 0, 0.45);
    for (let k = 0; k < 4; k++) sk.note((62.2 + k * 0.06) * 8, 0, 0, 0.5);
    rs.note(62.45 * 8, 0, 0, 0.75);
    for (const [k, s] of [62.55, 62.67, 62.79, 62.91, 63.03].entries()) ap.note(s * 8, 2 + k, 0, 0.4);
    for (const [k, s] of [63.0, 63.12, 63.24, 63.36].entries()) sino.note(s * 8, [82, 86, 89, 94][k], 1, 0.7);
    drum(kk, 31.25, 1, 'X...X...X.......', { vel: 0.7 });
    drum(sn, 31.25, 1, 'x.x.xxxx........', { vel: 0.45 });
    drum(tp, 31.25, 1, 'x...xxXX........', { vel: 0.5 });
    bass(bs, 31, 'Bb7', '0:2 0:2 5:2 s:2 r:8', { vel: 0.7 });
    padChord(cor, 31, 'Bb7', 12, { low: 56, n: 4, vel: 0.6 });
    cr.note(R(63.5), 0, 0, 1);
    mel(met, 31.75, ['Eb5:2 G5:2 Bb5:4 r:8'], { harm: thirdBelow(eb) });
    stabs(toque, 31.75, 'Ebmaj7', [[0, 8]], { low: 58, n: 4, vel: 0.6 });

    // "TEMOS QUE CHUTAR!" (69): a caixa digita com os três blips juntos e em 69,3 os três gritam no mesmo ritmo
    // (Te-mos-que-chu-TAR: o pika em cima, o mi-áu uma oitava abaixo e o psy no grave); prato e metais no "TAR"
    // (69,8), quando eles pulam de novo; riser e virada até a tela final (72)
    const GRITO = 'G5:1 G5:1 G5:1 Bb5:1 C6:5 r:7';
    mel(pk, 69.3 / 2, [GRITO], { vel: 0.8 });
    mel(mia, 69.3 / 2, [GRITO], { shift: -12, vel: 0.85 });
    mel(ps, 69.3 / 2, [GRITO], { shift: -36, vel: 0.9 });
    mel(met, 69.3 / 2, [GRITO], { shift: -12, harm: thirdBelow(bb), vel: 0.45 });
    kk.note(R(69.3), 0, 0, 0.9);
    cr.note(R(69.8), 0, 0, 0.9);
    stabs(toque, 0, 'Bb7', [[R(69.8), 3]], { low: 58, n: 4, vel: 0.7 });
    ris.note(R(70.0), 0, 0, 0.7);
    drum(sn, 35, 1, '............xxXX', { vel: 0.6 });

    // TELA FINAL (72): os três cantam o SOC-CER-MON em Mi♭ (pika, mi-áu e o psy) e as palmas
    cr.note(R(72.0), 0, 0, 0.9);
    drum(kk, 36, 1, 'X.....x.X.....x.');
    drum(sn, 36, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 36, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.55 });
    bass(bs, 36, 'Ab', '0:3 r:1 5:2 0:2 r:8', { vel: 0.8 });
    mel(pk, 36, [GANCHO.em({ tom: 3, oitava: 0 })], { vel: 0.7 });
    mel(mia, 36, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.7 });
    mel(ps, 36, [GANCHO.em({ tom: 3, oitava: -3 })], { vel: 0.8 });
    mel(met, 36, [GANCHO.em({ tom: 3, oitava: -1 })], { harm: thirdBelow(eb), vel: 0.5 });
    drum(cl, 36, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 36, 'Ab', 8, { low: 56, n: 4, vel: 0.55 });
    // 73,5: Mi♭ e o "ting"
    cr.note(R(73.5), 0, 0, 0.8);
    stabs(toque, 0, 'Eb', [[R(73.5), 6]], { low: 58, n: 4 });
    tuba.note(R(73.5), 39, 8, 1);
    colher.note(R(73.5), 99, 6, 1);
    // o compasso de fecho (73,5–75,5): a banda puxa em Mi♭ e fecha com tudo em 74,5 (prato, bumbo, tuba e metais);
    // o vídeo acaba em 75,6 com o acorde ainda soando
    drum(kk, 36.75, 1, 'X.....x.X.......');
    drum(sn, 36.75, 1, '....x.xxX.......', { vel: 0.6 });
    drum(hh, 36.75, 1, 'x.x.x.x.........', { vel: 0.5 });
    bass(bs, 36.75, 'Eb', '0:2 5:2 8:2 s:2 0:4 r:4', { vel: 0.8 });
    mel(met, 36.75, ['Eb5:1 G5:1 Bb5:2 r:4 Eb6:4 r:4'], { harm: thirdBelow(eb), vel: 0.6 });
    cr.note(R(74.5), 0, 0, 1);
    tuba.note(R(74.5), 39, 8, 0.9);
    padChord(cor, 0, 'Eb', 8, { low: 55, n: 4, vel: 0.6, at: R(74.5) });

    // o ducking vale pra tudo que não é voz (multiplica o breque de quem tem)
    for (const p of S.parts) {
        if (VOZES.includes(p.name)) continue;
        const g0 = p.gainAt;
        p.gainAt = g0 ? (t) => g0(t) * duck(t) : duck;
    }
    return S;
}
