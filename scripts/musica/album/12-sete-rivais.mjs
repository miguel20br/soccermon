// Faixa 12, "Sete rivais": o medley dos líderes na ordem da Rota (Pedra firme, Moleca das ondas, Atchim no jardim,
// Paredes invisíveis, A colher entortou, Quiz do vulcão) e a sombra do chefe, que emenda na "Sala do chefe".
// Rodada 4 (23/11/2026), refeita do zero. Retorno do Miguel: "mal executada". A ideia fica (cada rival com o motivo, o
// som de assinatura e a história do ginásio, costurados pela virada da casa no 3-3-2). A execução antiga colava seis
// peças do jogo renderizadas à parte, cada uma no timbre de chip dela, normalizadas uma a uma e emendadas pelas
// pontes do jogo: soava como uma playlist (o brilho acima de 4 kHz pulava de −27 pra −18 dB de um tema pro outro).
// Agora é UMA peça, UMA banda (a da "Sala do chefe": bumbo e caixa com corpo no barramento, baixo de dedo, Rhodes,
// cordas, trombones e tuba) que recebe um convidado por ginásio (trombone de herói, flauta e celesta, flauta e
// marimba, shakuhachi e koto, teremim, trompete) e muda de levada (rock meio-tempo, 12/8, bossa, ninja em 3-3-2,
// meio-tempo psíquico, mambo). O andamento segue o mapa (`bpmAt`): 100, 84, 112, 120, 104, 116 → 120, e cai pra 96
// na sombra.
// A COSTURA agora é harmônica: o último acorde do motivo de cada um é a porta pro próximo.
//   Brock (Mi menor) termina em Dó, o ♭II napolitano de Si menor → Fá#7 → Misty (Si menor).
//   Misty → Lá7 → Erika (Ré mixolídio, o relativo maior).
//   Erika termina no Dó (o ♭VII) → Mi7 → Koga (Lá frígio).
//   Koga termina no Si♭ (a cadência frígia), e o Si♭ VIRA a casa da Sabrina (Si♭ lídio), sem dominante.
//   Sabrina termina em Dó maior → Sol7(♭9) → Blaine (Dó menor): o lídio apaga, o fogo acende.
//   Blaine termina no Sol7, que devia voltar pro Dó menor, mas o Sol7 é o substituto de trítono do Dó#7: o chão some
//   e cai meio tom, em Fá# menor, a casa do chefe.
// Cada rival: o motivo (2) | a história do ginásio (4) | o motivo com a banda inteira (2) | a virada da casa (1).
//   PEDRA FIRME: a melodia sobe a escada e a pedra (surdo e tímpano) barra duas vezes; na 3ª ela empurra e a pedra
//     rola escada abaixo pelo cromático.
//   MOLECA DAS ONDAS (12/8): a onda cresce no arpejo da celesta, quebra (o mergulho) e as bolhas sobem.
//   ATCHIM NO JARDIM: ela boceja, o andamento afrouxa (112 → 100 → 88 → 80), a celesta canta o motivo na metade da
//     velocidade, uma pétala desce... a... a... ATCHIM. A marimba ri e a bossa volta.
//   PAREDES INVISÍVEIS: passos no bloco, TONK, "hm?"; do outro lado, TONK mais cedo (as bolhas riem); na ponta do pé
//     ele acha a passagem e a escala in-sen escorrega pra cima; fumaça e o grito em 3-3-2.
//   A COLHER ENTORTOU: a frase reaparece em terças maiores (Si♭, Ré, Fá#), o teletransporte errado, a colher dobra e
//     três teletransportes em tons inteiros (tontura).
//   QUIZ DO VULCÃO: pergunta, relógio, DING; pergunta, BZZT (fogo, os metais caem); pergunta, DING DING e a plateia;
//     o vulcão ronca e "HAH!".
//   A SOMBRA: a tuba toca o motivo do chefe em cima do chão roncando e para no Dó#7(♭9), sem resolver.
// ~2:25. Emenda na "Sala do chefe".
import { MOTIVO as BLAINE, fogo, vulcao } from '../pecas/lider-blaine.mjs';
import { atchim, borrifo, MOTIVO as ERIKA } from '../pecas/lider-erika.mjs';
import { MOTIVO as GIOVANNI, tremor } from '../pecas/lider-giovanni.mjs';
import { bolha, fumaca, MOTIVO as KOGA, shaku, tonk, voz } from '../pecas/lider-koga.mjs';
import { colher, MOTIVO as SABRINA, teremim, warp, warpErrado } from '../pecas/lider-sabrina.mjs';
import { bzzt } from '../pecas/livre-ginasio.mjs';
import { MOTIVO as BROCK } from '../pecas/tema-brock.mjs';
import { MOTIVO as MISTY } from '../pecas/tema-misty.mjs';
import { bass, drum, I, mel, midi, padChord, Song, stabs } from '../synth.mjs';
import {
    aro,
    BATERIA,
    baixoDedo,
    bombeio,
    bumbo,
    caixa,
    celesta,
    clapMacio,
    clapMolhado,
    guitarra,
    orgao,
    rhodes,
    surdo,
    trombone,
    trompete,
    tuba,
} from './kit.mjs';
import { frase, mergulho, notas, onda } from './kit-novas.mjs';

export const meta = { titulo: 'Sete rivais', faixa: 12, apara: false, emenda: true };

// compasso de início → andamento
const TEMPOS = [
    [0, 100],
    [11, 84],
    [19, 112],
    [22, 100],
    [23, 88],
    [24, 80],
    [25, 112],
    [29, 120],
    [38, 104],
    [47, 116],
    [53, 120],
    [56, 96],
];
const bpmAt = (b) => TEMPOS.filter(([de]) => de <= b).at(-1)[1];
const HIT = { X: 1.15, x: 0.85, o: 0.35 };
// as 2ª vozes escritas à mão (o terça-abaixo automático põe a 6ª menor embaixo da tônica): o Brock em terças por
// cima, o Blaine nas notas do acorde por baixo
const BROCK_TERCAS = ['G5:3 G5:3 D6:4 C6:2 B5:2 C6:2', 'B5:3 G5:3 E5:2 F#5:8'];
const BLAINE_2 = ['Eb5:2 r:1 Eb5:1 r:2 G5:2 G5:1 G5:1 r:2 Eb5:2 C5:2', 'D5:3 B4:3 G4:2 r:2 B4:1 D5:1 F5:4'];

export default function seteRivais() {
    const S = new Song({ bpm: 100, bpmAt, bars: 60, swing: 0.05, tail: 6, barramentos: { bateria: BATERIA } });
    // a banda
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 1 });
    const duck = bombeio(S, k, { prof: 0.25, solta: 0.16 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.55, rev: 0.1 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', gain: 0.45, pan: -0.15 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.5, corte: 7000 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: 0.35, gain: 1.5, corte: 7000 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.45, corte: 5500 });
    const tm = S.part('toms', I.tom, { drum: true, gain: 0.55, rev: 0.1 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const su = S.part('surdo', surdo, { drum: true, gain: 0.7, rev: 0.12 });
    const cl = S.part('palmas', clapMacio, { drum: true, pan: -0.3, gain: 0.9, rev: 0.15 });
    const cl2 = S.part('palmas2', clapMacio.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.3, rev: 0.15 });
    const clM = S.part('clapMolhado', clapMolhado, { drum: true, gain: 1.2, rev: 0.3, pan: 0.05 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.42, gainAt: duck });
    const rh = rhodes(S, 'rhodes', { pan: 0.25, gain: 0.55, rev: 0.2, gainAt: duck });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.3, corte: 3200 });
    const og = orgao(S, 'orgao', { pan: 0.15, gain: 0.6, rev: 0.35 });
    const tb = trombone(S, 'trombones', { pan: -0.15, gain: 0.95, rev: 0.2 });
    const tb2 = trombone(S, 'terças', { pan: 0.25, gain: 0.6, rev: 0.2 });
    const tu = tuba(S, 'tuba', { gain: 0.65, rev: 0.1 });
    // os convidados
    const gtR = guitarra(S, 'guitarraRock', { pan: -0.35, gain: 0.55, corte: 2600 }, { sujo: 0.7 });
    const fl = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.1,
        rev: 0.3,
        corte: 3000,
        echo: { rows: 3, fb: 0.2, mix: 0.15 },
    });
    const ce = celesta(S, 'celesta', { pan: 0.35, gain: 0.7, rev: 0.35 });
    const mb = S.part('marimba', I.pizz, { pan: 0.3, gain: 1.3, corte: 3500, echo: { rows: 2, fb: 0.2, mix: 0.15 } });
    const gtB = guitarra(S, 'violao', { pan: 0.35, gain: 0.9, rev: 0.15, corte: 3500 }, { sujo: 0.05 });
    const sh = voz(S, 'shakuhachi', shaku, {
        pan: -0.1,
        gain: 0.9,
        rev: 0.3,
        corte: 3800,
        echo: { rows: 3, fb: 0.2, mix: 0.15 },
    });
    const ko = guitarra(S, 'koto', { pan: 0.4, gain: 1.4, rev: 0.25, corte: 4000 }, { sujo: 0 });
    const blk = S.part('bloco', I.block, { drum: true, pan: -0.25, gain: 0.8, corte: 4000, rev: 0.15 });
    const te = voz(
        S,
        'teremim',
        teremim,
        { pan: 0.1, gain: 0.75, rev: 0.4, echo: { rows: 6, fb: 0.3, mix: 0.25 } },
        { solta: 0.25 },
    );
    const tp = trompete(S, 'trompete', { pan: -0.1, gain: 1.25, rev: 0.2, corte: 3000 });
    const cb = S.part('cowbell', I.agogo, { drum: true, pan: 0.3, gain: 0.9, corte: 3500 });
    const cg = S.part('conga', I.tom, { drum: true, pan: -0.3, gain: 0.35 });
    // os sons de assinatura
    const fx = (nome, som, o = {}) => S.part(nome, som, { drum: true, rev: 0.2, ...o });
    const fxMergulho = fx('mergulho', mergulho, { gain: 1, pan: 0.2 });
    const fxOnda = fx('onda', onda, { gain: 1, pan: -0.2 });
    const fxBolhas = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 1, rev: 0.4 });
    const fxAtchim = fx('atchim', atchim, { gain: 1 });
    const fxBorrifo = fx('borrifo', borrifo, { gain: 0.8, pan: 0.4 });
    const fxTonk = fx('tonk', tonk, { gain: 0.8 });
    const fxBolha = fx('bolhaVeneno', bolha, { gain: 0.8, pan: 0.3 });
    const fxFumaca = fx('fumaca', fumaca, { gain: 0.6 });
    const fxWarp = fx('teleporte', warp, { gain: 0.55, pan: 0.2, rev: 0.35 });
    const fxWarpE = fx('teleporteErrado', warpErrado, { gain: 0.55, pan: -0.2, rev: 0.35 });
    const fxColher = fx('colher', colher, { gain: 0.6, rev: 0.35 });
    const fxFogo = fx('fogo', fogo, { gain: 0.55, pan: 0.3 });
    const fxVulcao = fx('vulcao', vulcao, { gain: 0.7 });
    const fxBzzt = fx('bzzt', bzzt, { gain: 0.5 });
    const fxTremor = fx('tremor', tremor, { gain: 0.8, rev: 0 });

    /** Uma linha do 12/8 (12 colcheias no compasso de 16 linhas: cada colcheia vale 4/3). */
    const tres = (P, b, strs, o = {}) => frase(P, b * 16, strs, { ...o, escala: 4 / 3 });
    const drum12 = (P, b, pat, { vel = 1, pitch = 0 } = {}) => {
        for (let i = 0; i < 12; i++) if (HIT[pat[i]]) P.note(b * 16 + (i * 4) / 3, pitch, 0, HIT[pat[i]] * vel);
    };
    /** Power chord (tônica, quinta, oitava) na guitarra de rock. */
    const power = (b, raiz, rows, len = 2, vel = 1) => {
        for (const r of rows) for (const d of [0, 7, 12]) gtR.note(b * 16 + r, midi(raiz) + d, len, vel);
    };
    /** A virada da casa: toms descendo e o SOC-CER-MON (3-3-2) de caixa, palma e metais no acorde-porta. */
    const virada = (b, acorde, raiz) => {
        drum(tm, b, 1, 'x.x.x.x.........', { pitch: 3 });
        drum(k, b, 1, 'X.......X.......');
        for (const r of [8, 11, 14]) {
            sn.note(b * 16 + r, 0, 0, 1);
            cl.note(b * 16 + r, 0, 0, 1);
            cl2.note(b * 16 + r, 0, 0, 1);
            notas(tb, b * 16 + r, acorde, r === 14 ? 2 : 1.5, 0.9);
            notas(bs, b * 16 + r, [raiz], 1.5);
            notas(tu, b * 16 + r, [raiz], 1.5, 0.8);
        }
    };

    // ---------- abertura (0-1): a porta do primeiro ginásio ----------
    mel(tb, 0, ['B2:3 G2:3 E3:2 r:8']);
    mel(tu, 0, ['B1:3 G1:3 E2:2 r:8']);
    drum(su, 0, 1, 'X..X..X.........');
    drum(cl, 0, 1, '............x.x.');
    drum(cl2, 0, 1, '............x.x.');
    padChord(og, 0, 'Em', 16, { low: 40, n: 3, vel: 0.6 });
    virada(1, ['B2', 'D#3', 'A3'], 'B1');

    // ---------- PEDRA FIRME (2-10): Mi menor, rock meio-tempo, o trombone é o herói ----------
    const rock = (b, { cheio = true } = {}) => {
        drum(k, b, 1, 'X......x..X.....');
        drum(sn, b, 1, '........X.......');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        if (cheio) drum(su, b, 1, 'X..X..X.........', { vel: 0.8 });
    };
    const motivoBrock = (b0, tutti) => {
        mel(tb, b0, BROCK.mel, { shift: -12 });
        mel(tu, b0, BROCK.mel, { shift: -36, vel: 0.8 });
        if (tutti) mel(tb2, b0, BROCK_TERCAS, { shift: -12, vel: 0.7 });
        else mel(tb2, b0 + 1, ['r:8 G3:3 E3:3 C4:2']); // o time responde com o gancho no Dó
        power(b0, 'E2', [0, 6, 10]);
        power(b0 + 1, 'C2', [0, 6, 10]);
        bass(bs, b0, 'Em', '0:6 0:2 5:4 8:4');
        bass(bs, b0 + 1, 'C', '0:6 0:2 5:4 8:4');
        rock(b0);
        rock(b0 + 1);
        if (tutti) {
            drum(cr, b0, 1, 'X...............');
            padChord(str, b0, 'Em', 16, { low: 52, n: 3, vel: 0.5 });
            padChord(str, b0 + 1, 'C', 16, { low: 52, n: 3, vel: 0.5 });
        }
    };
    motivoBrock(2, false);
    // a escada e a pedra que barra
    const PEDRA = (b) => {
        su.note(b * 16 + 12, -5, 0, 1.2);
        ti.note(b * 16 + 12, -7, 0, 1);
        power(b, 'E2', [12], 1, 0.9);
    };
    mel(tb, 4, ['E3:2 F#3:2 G3:2 A3:2 B3:4 r:4']);
    mel(bs, 4, ['E2:2 F#2:2 G2:2 A2:2 B2:4 r:4']);
    PEDRA(4);
    mel(tb, 5, ['F#3:2 G3:2 A3:2 B3:2 C4:4 r:4']);
    mel(bs, 5, ['F#2:2 G2:2 A2:2 B2:2 C3:4 r:4']);
    PEDRA(5);
    for (const b of [4, 5]) {
        drum(k, b, 1, 'X...............');
        drum(hh, b, 1, 'x.x.x.x.x.x.....', { vel: 0.5 });
    }
    // na 3ª ela empurra...
    mel(tb, 6, ['G3:2 A3:2 B3:2 C4:2 D4:2 E4:2 F#4:2 G4:2']);
    mel(tb2, 6, ['E3:2 F#3:2 G3:2 A3:2 B3:2 C4:2 D4:2 E4:2'], { vel: 0.8 });
    mel(bs, 6, ['C2:8 D2:8']);
    power(6, 'C2', [0, 4]);
    power(6, 'D2', [8, 12]);
    drum(k, 6, 1, 'X...X...X...X...');
    drum(sn, 6, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    // ...e a pedra rola escada abaixo
    mel(tb, 7, ['G4:1 F#4:1 F4:1 E4:1 Eb4:1 D4:1 C#4:1 C4:1 B3:8']);
    mel(tu, 7, ['r:8 B1:8']);
    mel(bs, 7, ['B1:8 B1:3 B1:3 B1:2']);
    drum(tm, 7, 1, 'xxxxxxxx........', { pitch: 4 });
    power(7, 'B1', [8], 6);
    drum(k, 7, 1, '........X.......');
    drum(cr, 7, 1, '........X.......');
    motivoBrock(8, true);
    virada(10, ['F#2', 'A#2', 'E3'], 'F#1');

    // ---------- MOLECA DAS ONDAS (11-19): Si menor em 12/8, flauta e celesta ----------
    const onda12 = (b, c, baixo, { cheio = true } = {}) => {
        tres(bs, b, [baixo]);
        drum12(k, b, 'x.....x.....', { vel: 0.7 });
        drum12(ar, b, '...x.....x..', { vel: cheio ? 0.8 : 0.5 });
        drum12(sk, b, 'xooxooxooxoo', { vel: 0.6 });
        padChord(rh, b, c, 16, { low: 57, n: 4, vel: 0.35 });
    };
    const motivoMisty = (b0, tutti) => {
        tres(fl, b0, MISTY.mel);
        if (tutti) {
            tres(tb, b0, MISTY.mel, { shift: -12, vel: 0.7 });
            tres(ce, b0, MISTY.mel, { shift: 12, vel: 0.35 });
            drum(cr, b0, 1, 'X...............', { vel: 0.7 });
        } else tres(ce, b0 + 1, ['r:9 F#6:1 A#6:1 C#7:1'], { vel: 0.5 });
        onda12(b0, 'Bm', 'B1:5 B1:1 F#2:3 A2:3');
        onda12(b0 + 1, 'F#7', 'F#1:5 F#1:1 C#2:3 E2:3');
    };
    motivoMisty(11, false);
    // a onda cresce no arpejo, quebra, e as bolhas sobem
    tres(
        ce,
        13,
        ['B3:2 D4:2 F#4:2 B4:2 D5:2 F#5:2', 'G4:2 B4:2 D5:2 G5:2 B5:2 D6:2', 'E5:2 G5:2 B5:2 C#6:2 E6:2 F#6:2'],
        { vel: 0.6 },
    );
    tres(fl, 13, ['F#5:12', 'G5:6 A5:3 B5:3', 'D6:6 C#6:3 A#5:3']);
    onda12(13, 'Bm', 'B1:6 F#2:6', { cheio: false });
    onda12(14, 'G', 'G1:6 D2:6', { cheio: false });
    onda12(15, 'Em7', 'E1:6 F#1:6');
    padChord(str, 13, 'Bm', 16, { low: 54, vel: 0.4 });
    padChord(str, 14, 'G', 16, { low: 55, vel: 0.5 });
    padChord(str, 15, 'Em7', 16, { low: 55, vel: 0.6 });
    drum12(sn, 15, '......oxoxXX', { vel: 0.7 });
    fxOnda.note(14 * 16, 0, 0, 1);
    fxMergulho.note(16 * 16, 0, 0, 1);
    drum(cr, 16, 1, 'X...............', { vel: 0.8 });
    tres(tb, 16, ['F#3:6 A#3:3 C#4:3']);
    tres(tu, 16, ['F#1:12']);
    for (const [u, p] of [
        [6, 12],
        [8, 15],
        [10, 19],
    ])
        fxBolhas.note(16 * 16 + (u * 4) / 3, p, 0, 0.8);
    padChord(rh, 16, 'F#7', 16, { low: 57, n: 4, vel: 0.4 });
    motivoMisty(17, true);
    virada(19, ['A2', 'C#3', 'G3'], 'A1');

    // ---------- ATCHIM NO JARDIM (20-28): Ré mixolídio, bossa, flauta e marimba ----------
    const bossa = (b, c, vel = 1) => {
        stabs(
            gtB,
            b,
            c,
            [
                [0, 2],
                [3, 2],
                [6, 2],
                [10, 2],
                [13, 2],
            ],
            { low: 55, n: 4, vel: 0.6 * vel },
        );
        bass(bs, b, c, '0:3 5:5 0:3 5:5', { vel });
        drum(ar, b, 1, 'x..x..x...x..x..', { vel: 0.6 * vel });
        drum(k, b, 1, 'X.......X.......', { vel: 0.55 * vel });
        drum(sk, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.4 * vel });
    };
    const motivoErika = (b0, tutti) => {
        mel(fl, b0, ERIKA.mel);
        if (tutti) {
            mel(mb, b0, ERIKA.mel, { shift: -12, vel: 0.6 });
            mel(tb, b0, ERIKA.mel, { shift: -24, vel: 0.6 });
            drum(cr, b0, 1, 'X...............', { vel: 0.6 });
        } else mel(mb, b0 + 1, ['r:12 G5:1 A5:1 C6:2']);
        fxBorrifo.note((b0 + 1) * 16 + 15, 0, 0, 1);
        bossa(b0, 'D6');
        bossa(b0 + 1, 'C');
    };
    motivoErika(20, false);
    // o bocejo, a celesta no meio da velocidade, a pétala, a... a... ATCHIM
    mel(fl, 22, ['A5:8 F#5:4 D5:4']);
    bossa(22, 'Bm7', 0.7);
    mel(ce, 23, ['D5:2 F#5:2 A5:4 B5:8']);
    mel(mb, 23, ['r:8 B6:2 G6:2 E6:2 D6:2'], { vel: 0.4 });
    padChord(rh, 23, 'Gmaj7', 16, { low: 55, n: 4, vel: 0.4 });
    drum(ar, 23, 1, 'x.....x.........', { vel: 0.4 });
    mel(fl, 24, ['E5:2 r:2 F#5:2 r:2 G5:3 r:5']);
    padChord(rh, 24, 'A7sus4', 8, { low: 55, n: 4, vel: 0.3 });
    fxAtchim.note(24 * 16 + 11, 0, 0, 1);
    // acorda: a marimba ri e a bossa volta
    mel(mb, 25, ['A5:1 F#5:1 D5:1 r:1 A5:1 F#5:1 D5:1 r:1 B5:1 G5:1 E5:1 r:1 C6:2 r:2']);
    fxBorrifo.note(25 * 16 + 14, 0, 0, 1);
    bossa(25, 'D');
    motivoErika(26, true);
    virada(28, ['E2', 'G#2', 'D3'], 'E1');

    // ---------- PAREDES INVISÍVEIS (29-37): Lá frígio, ninja em 3-3-2, shakuhachi e koto ----------
    const ninja = (b, c, vel = 1) => {
        drum(su, b, 1, 'X..X..X.........', { vel: 0.8 * vel });
        drum(blk, b, 1, '....x.......x...', { vel });
        drum(k, b, 1, 'X.......X.x.....', { vel: 0.8 * vel });
        drum(hh, b, 1, '..x...x...x...x.', { vel: 0.5 * vel });
        bass(bs, b, c, '0:3 0:3 8:2 r:2 5:2 0:4', { vel });
    };
    const motivoKoga = (b0, tutti) => {
        mel(sh, b0, KOGA.mel);
        if (tutti) {
            mel(tb, b0, KOGA.mel, { shift: -12, vel: 0.75 });
            mel(ko, b0, KOGA.mel, { shift: 12, vel: 0.4 });
            drum(clM, b0, 2, '....x.......x...', { vel: 0.5 });
            drum(cr, b0, 1, 'X...............', { vel: 0.6 });
        } else mel(ko, b0 + 1, ['r:8 E5:1 D5:1 Bb4:1 A4:1 E4:4']);
        ninja(b0, 'Am');
        ninja(b0 + 1, 'Bb');
        padChord(str, b0, 'Am', 16, { low: 52, n: 3, vel: 0.4 });
        padChord(str, b0 + 1, 'Bb', 16, { low: 52, n: 3, vel: 0.4 });
    };
    motivoKoga(29, false);
    // passos, TONK, "hm?"
    drum(blk, 31, 1, 'x.x.x.x.........', { vel: 0.7 });
    mel(sh, 31, ['A4:2 Bb4:2 D5:2 E5:2 r:4 E5:1 D5:3']);
    mel(bs, 31, ['A1:8 r:8']);
    fxTonk.note(31 * 16 + 8, 0, 0, 1);
    // do outro lado: TONK mais cedo, e as bolhas riem
    drum(blk, 32, 1, 'x.x.............', { vel: 0.7 });
    mel(sh, 32, ['E5:2 D5:2 r:12']);
    fxTonk.note(32 * 16 + 4, 2, 0, 1);
    for (const [r, p] of [
        [8, 0],
        [10, 3],
        [12, 7],
    ])
        fxBolha.note(32 * 16 + r, p, 0, 0.9);
    // na ponta do pé, e acha a passagem: a escala escorrega pra cima
    drum(blk, 33, 1, 'o.o.o...........', { vel: 0.8 });
    mel(sh, 33, ['A4:1 r:1 A4:1 r:1 Bb4:1 r:3 A4:1 Bb4:1 D5:1 E5:1 G5:1 A5:1 Bb5:1 D6:1']);
    mel(ko, 33, ['r:8 A3:1 Bb3:1 D4:1 E4:1 G4:1 A4:1 Bb4:1 D5:1'], { vel: 0.6 });
    // fumaça: ele aparece, o grito em 3-3-2
    fxFumaca.note(34 * 16, 0, 0, 1);
    mel(sh, 34, ['E6:3 C6:3 A5:2 r:8']);
    for (const r of [0, 3, 6]) {
        notas(tb, 34 * 16 + r, ['A2', 'E3', 'A3'], 2);
        su.note(34 * 16 + r, 0, 0, 1);
    }
    ninja(34, 'Am', 0.6);
    motivoKoga(35, true);
    virada(37, ['Bb2', 'D3', 'F3'], 'Bb1');

    // ---------- A COLHER ENTORTOU (38-46): Si♭ lídio, meio-tempo, o clap molhado no 3, teremim ----------
    const psi = (b, c, vel = 1) => {
        drum(k, b, 1, 'X.........x.....', { vel: 0.8 * vel });
        drum(clM, b, 1, '........X.......', { vel });
        drum(hh, b, 1, 'x...x...x...x...', { vel: 0.4 * vel });
        bass(bs, b, c, '0:6 r:2 5:4 8:4', { vel: 0.9 * vel });
        padChord(rh, b, c, 16, { low: 57, n: 4, vel: 0.4 * vel });
    };
    const motivoSabrina = (b0, tutti) => {
        mel(te, b0, SABRINA.mel);
        if (tutti) {
            mel(tb, b0, SABRINA.mel, { shift: -24, vel: 0.7 });
            mel(ce, b0, SABRINA.mel, { shift: 12, vel: 0.3 });
            padChord(str, b0, 'Bbmaj7', 16, { low: 53, n: 4, vel: 0.5 });
            padChord(str, b0 + 1, 'C', 16, { low: 55, n: 3, vel: 0.5 });
            drum(cr, b0, 1, 'X...............', { vel: 0.6 });
        } else mel(ce, b0 + 1, ['r:10 A5:2 C6:2 D6:2'], { vel: 0.6 });
        psi(b0, 'Bbmaj7');
        psi(b0 + 1, 'C');
    };
    motivoSabrina(38, false);
    // a frase reaparece em terças maiores: Si♭, Ré, Fá#
    const FRASE = 'D5:2 F5:2 A5:4 E6:8';
    for (const [i, s, c] of [
        [0, 0, 'Bbmaj7'],
        [1, 4, 'Dmaj7'],
        [2, -4, 'F#maj7'],
    ]) {
        const b = 40 + i;
        mel(te, b, [FRASE], { shift: s });
        psi(b, c, 0.8);
        (i < 2 ? fxWarp : fxWarpE).note(b * 16 + (i < 2 ? 14 : 12), 0, 0, 1);
    }
    // de volta ao começo, a colher dobra, e três teletransportes em tons inteiros
    mel(te, 43, ['D5:2 F5:2 r:12']);
    fxColher.note(43 * 16 + 4, 0, 0, 1);
    for (const [r, ns] of [
        [10, ['C5', 'E5', 'G5']],
        [12, ['D5', 'F#5', 'A5']],
        [14, ['E5', 'G#5', 'B5']],
    ]) {
        fxWarp.note(43 * 16 + r - 1, 0, 0, 0.7);
        notas(ce, 43 * 16 + r, ns, 2, 0.6);
    }
    mel(bs, 43, ['Bb1:8 C2:2 D2:2 E2:2 F#2:2']);
    motivoSabrina(44, true);
    virada(46, ['G2', 'B2', 'F3', 'Ab3'], 'G1');

    // ---------- QUIZ DO VULCÃO (47-55): Dó menor, mambo, trompete e metais ----------
    const mambo = (b, c, i, vel = 1) => {
        drum(cb, b, 1, 'x...x...x...x...', { vel: 0.8 * vel, pitch: -5 });
        drum(blk, b, 1, i % 2 ? '....x...x.......' : 'x.....x.....x...', { vel: 0.7 * vel });
        drum(k, b, 1, 'X.....x.....x...', { vel: 0.8 * vel });
        drum(cg, b, 1, 'o..x.ox.o..x.ox.', { vel: 0.8 * vel, pitch: 10 });
        bass(bs, b, c, 'r:6 5:6 0:4', { vel });
        stabs(rh, b, c, [0, 3, 6, 10, 13], { low: 60, n: 3, vel: 0.5 * vel });
    };
    const motivoBlaine = (b0, tutti) => {
        mel(tp, b0, BLAINE.mel, { shift: -12 });
        if (tutti) {
            mel(tb, b0, BLAINE_2, { shift: -12, vel: 0.8 });
            mel(tu, b0, BLAINE.mel, { shift: -36, vel: 0.7 });
            drum(cr, b0, 1, 'X...............');
            drum(cl, b0 + 1, 1, '............x.x.');
            drum(cl2, b0 + 1, 1, '............x.x.');
        } else {
            stabs(
                tb,
                b0,
                'Cm',
                [
                    [12, 1],
                    [14, 2],
                ],
                { low: 48, n: 3, vel: 0.8 },
            );
            stabs(tb, b0 + 1, 'G7', [8, [10, 2]], { low: 47, n: 3, vel: 0.8 });
        }
        fxFogo.note((b0 + 1) * 16 + 12, 0, 0, 0.8);
        mambo(b0, 'Cm', 0);
        mambo(b0 + 1, 'G7', 1);
    };
    motivoBlaine(47, false);
    // as três perguntas
    const TADA = (b) => {
        notas(tb, b * 16 + 13, ['C3', 'E3', 'G3'], 1, 0.9);
        notas(tb, b * 16 + 14, ['C3', 'E3', 'G3'], 2, 1);
        notas(tp, b * 16 + 14, ['C5'], 2, 0.8);
    };
    mel(ce, 49, ['C5:2 Eb5:2 G5:2 Bb5:2 r:4 C6+G6:4']);
    drum(blk, 49, 1, '........x.x.....', { vel: 0.7 });
    TADA(49);
    mambo(49, 'Cm', 0, 0.6);
    mel(ce, 50, ['F5:2 Ab5:2 C6:2 Eb6:2 r:8']);
    drum(blk, 50, 1, '........xxxx....', { vel: 0.7 });
    fxBzzt.note(50 * 16 + 12, 0, 0, 1);
    fxFogo.note(50 * 16 + 12, 0, 0, 1);
    mel(tb, 50, ['r:12 Ab3:1 G3:1 Gb3:1 F3:1']);
    drum(cg, 50, 1, '............xxxx', { pitch: 4 });
    mambo(50, 'Fm', 1, 0.6);
    mel(ce, 51, ['Ab5:2 C6:2 Eb6:2 G6:2 r:4 C6+G6:2 C6+G6:2']);
    drum(blk, 51, 1, '........x.x.....', { vel: 0.7 });
    drum(cl, 51, 1, '....X..X..X.....');
    drum(cl2, 51, 1, '....X..X..X.....');
    TADA(51);
    mambo(51, 'Ab', 0, 0.6);
    // o vulcão ronca e "HAH!"
    fxVulcao.note(52 * 16, 0, 0, 1);
    drum(ti, 52, 1, 'xxxxxxxxXXXX....', { pitch: 0, vel: 0.6 });
    notas(tb, 52 * 16 + 12, ['G2', 'B2', 'F3', 'Ab3'], 3, 1.1);
    notas(tp, 52 * 16 + 12, ['G4'], 3);
    notas(tu, 52 * 16 + 12, ['G1'], 3);
    notas(bs, 52 * 16 + 12, ['G1'], 3);
    fxFogo.note(52 * 16 + 12, 2, 0, 1);
    drum(cr, 52, 1, '............X...');
    drum(k, 52, 1, '............X...');
    motivoBlaine(53, true);
    // o Sol7 que devia voltar pro Dó menor... e o chão some
    for (const r of [0, 3, 6]) {
        notas(tb, 55 * 16 + r, ['G2', 'B2', 'F3'], 2);
        notas(tp, 55 * 16 + r, ['D5'], 2, 0.8);
        notas(tu, 55 * 16 + r, ['G1'], 2);
        notas(bs, 55 * 16 + r, ['G1'], 2);
        sn.note(55 * 16 + r, 0, 0, 1);
    }
    drum(k, 55, 1, 'X..X..X.........');
    fxTremor.note(55 * 16 + 8, 0, 0, 1);
    mel(tu, 55, ['r:10 G1:2 F#1:4']);

    // ---------- A SOMBRA (56-59): Fá# menor, a tuba toca o motivo do chefe ----------
    mel(tu, 56, GIOVANNI.mel, { shift: -24 });
    mel(tb, 56, GIOVANNI.mel, { shift: -12, vel: 0.7 });
    padChord(og, 56, 'F#m', 16, { low: 42, n: 3, vel: 0.6 });
    padChord(og, 57, 'C#7', 16, { low: 41, n: 4, vel: 0.6 });
    notas(og, 58 * 16, ['C#2', 'G#2', 'D3', 'E#3', 'B3'], 32, 0.6);
    notas(str, 58 * 16, ['G#3', 'D4', 'E#4'], 28, 0.5);
    mel(tu, 58, ['C#2:16', 'C#1:12 r:4'], { vel: 0.8 });
    for (const b of [56, 57, 58]) {
        drum(k, b, 1, b < 58 ? 'X.........x.....' : 'X...............');
        drum(clM, b, 1, '........X.......');
    }
    fxTremor.note(58 * 16, 0, 0, 0.7);
    return S;
}
