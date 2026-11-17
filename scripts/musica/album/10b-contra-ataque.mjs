// Faixa nova do álbum (rodada 3, 17/11/2026), "Contra-ataque" (EN "Counterattack"). Pedido do Miguel: mais faixas
// como "O plano infalível", eletrônicas no jeito Sonic Mania, animadas e divertidas. Do Sonic Mania vem a receita, não
// a melodia: FM de 16 bits (lead, metal e baixo de slap que é melodia), acordes de jazz-fusion (maj7, m9, ♭VII e ♭VI
// maiores), quebra de bateria, golpe de orquestra e o "Ato 2" (a mesma melodia em outro arranjo e meio tom acima).
// Lá maior → Si♭ maior, 140 BPM.
// A história: um contra-ataque, de uma área à outra. A DEFESA (4): o rival ataca (o baixo pedalando em Mi), a luva do
// nosso goleiro espalma, um respiro, e a BICUDA: o chute do goleiro e a bola voando (o deslize que sobe), e o golpe de
// orquestra no 3-3-2. A (8): a arrancada; o lead FM pergunta, os metais respondem (a TABELA: um passa, o outro
// devolve). A2 (8): o arpejo de cristal e a segunda voz; o tênis range nos dribles. B (8): O DRIBLE: o lead finta
// (sobe, para seco com o tênis rangendo, e sai pro outro lado) e o baixo responde com a melodia; o Fá maior7 (♭VI) é o
// "uau" do drible. SOLO (8): lead e metais trocando de 2 em 2 (a tabela de novo). O CHUTE (4): só a quebra de bateria
// e o baixo, o chute, a bola voando... e TRAVE (o "dong"). O REPLAY (8): a fita volta (o deslize descendo) e a
// jogada passa em câmera lenta: meio-tempo, a melodia do A em aumentação no sino FM, e a trave de novo, mais grave
// (o replay em câmera lenta). Subida (2): Sol menor e Fá9 com o 3-3-2. A' e B' em Si♭ (o "Ato 2"): tudo junto, e o
// SOC-CER-MON nos metais e no lead com as palmas no fim do A'. Final (4): o último chute, a REDE e a torcida, o
// gancho, o 3-3-2 da banda inteira, a escala lídia subindo e o Si♭maj7 com prato e rabo de sala.
// Assinatura: os sons do lance (luva, bicuda, tênis, trave, rede) tocados no tempo, e a trave em câmera lenta.
// Forma: defesa 4 | A 8 | A2 8 | B 8 | solo 8 | chute 4 | replay 8 | subida 2 | A' 8 | B' 8 | final 4 = 70 (~2:03).
import { chute, deslize, luva, rede, tenis, torcida, trave } from '../pecas/livre-ginasio.mjs';
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { BATERIA, bombeio, bumbo, caixa, clapMacio, rhodes } from './kit.mjs';
import { fmBaixo, fmLead, fmMetal, fmSino, frase, orquestra } from './kit-novas.mjs';

export const meta = { titulo: 'Contra-ataque', faixa: '10b' };

const A_CH = ['Amaj7', 'Gmaj7', 'F#m9', 'Bm7', 'Dmaj7', 'C#m7', 'Bm7', 'E9'];
const A_LEAD = [
    'E5:2 A5:2 C#6:3 B5:1 r:2 A5:2 G#5:2 E5:2',
    'F#5:3 G5:1 B5:4 D6:3 C#6:1 B5:2 A5:2',
    'r:16',
    'r:16',
    'A5:2 F#5:2 A5:3 C#6:1 r:2 E6:4 C#6:2',
    'B5:3 G#5:1 E5:4 r:2 C#5:2 E5:2 G#5:2',
    'r:16',
    'E5:1 F#5:1 G#5:1 A5:1 B5:1 C#6:1 D6:1 E6:1 r:2 D6:2 B5:2 G#5:2',
];
// a tabela: os metais devolvem a bola
const A_MET = [
    'r:16',
    'r:16',
    'r:4 C#5:1 E5:1 r:1 F#5:1 r:2 A5:2 G#5:2 E5:2',
    'F#5:2 D5:2 B4:2 r:2 A4:1 B4:1 D5:1 E5:1 F#5:2 A5:2',
    'r:16',
    'r:16',
    'D5:1 r:1 D5:1 r:1 F#5:2 A5:2 r:2 B5:2 A5:2 F#5:2',
    'r:16',
];
const B_CH = ['Dmaj7', 'C#m7', 'Bm7', 'Amaj7', 'Fmaj7', 'Gmaj7', 'F#m7', 'E7'];
// o drible: sobe, para seco (o tênis range na linha 5), e sai pro outro lado
const B_LEAD = [
    'F#5:1 A5:1 C#6:1 E6:2 r:3 E6:1 C#6:1 A5:1 F#5:1 E5:4',
    'G#5:12 r:4',
    'D6:1 B5:1 F#5:1 D5:2 r:3 D5:1 F#5:1 B5:1 D6:1 C#6:4',
    'C#6:12 r:4',
    'C6:3 A5:1 F5:4 E5:2 F5:2 A5:2 C6:2',
    'D6:3 B5:1 G5:4 F#5:2 G5:2 B5:2 D6:2',
    'E6:4 C#6:2 A5:2 F#5:4 A5:2 C#6:2',
    'B5:2 G#5:2 E5:2 D5:2 B4:2 G#4:2 E4:4',
];
// o baixo responde com a melodia nos compassos 2 e 4 do B
const B_BAIXO = {
    1: 'C#2:2 E2:1 G#2:1 B2:2 C#3:2 r:2 B2:1 G#2:1 E2:2 C#2:2',
    3: 'A1:2 C#2:1 E2:1 G#2:2 A2:2 r:2 G#2:1 E2:1 C#2:2 B1:2',
};
// solo: o lead e os metais trocando de 2 em 2; no 7º compasso descem juntos
const SOLO_LEAD = [
    'C#6:1 E6:1 C#6:1 A5:1 B5:1 C#6:1 E6:2 F#6:2 E6:1 C#6:1 B5:2 A5:2',
    'B5:1 D6:1 F#6:1 A6:1 G6:2 F#6:2 D6:1 B5:1 A5:1 G5:1 F#5:4',
    'r:16',
    'r:16',
    'r:1 A5:1 B5:1 C#6:1 D6:1 E6:1 F#6:1 A6:1 G#6:2 E6:2 C#6:2 A5:2',
    'B5:1 C#6:1 B5:1 G#5:1 E5:2 G#5:2 B5:2 C#6:1 E6:1 G#6:4',
    'F#6:2 E6:2 D6:2 B5:2 A5:2 F#5:2 D5:2 B4:2',
    'E5:1 G#5:1 B5:1 D6:1 F#6:4 E6:2 D6:2 B5:2 G#5:2',
];
const SOLO_MET = [
    'r:16',
    'r:16',
    'r:2 A4:1 C#5:1 E5:2 G#5:2 A5:3 G#5:1 E5:2 C#5:2',
    'D5:2 F#5:1 A5:1 C#6:4 B5:2 A5:2 F#5:2 D5:2',
    'r:16',
    'r:16',
    'F#5:2 E5:2 D5:2 B4:2 A4:2 F#4:2 D4:2 B3:2',
    'r:16',
];
const BAIXO = '0:2 8:1 r:1 5:1 8:1 r:1 0:1 r:1 0:1 s:2 5:2 3:2';
const COMP = [
    [2, 1],
    [6, 2],
    [10, 1],
    [13, 2],
];

export default function contraAtaque() {
    const S = new Song({ bpm: 140, bars: 70, swing: 0.04, tail: 4, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.9 });
    const duck = bombeio(S, k, { prof: 0.25, solta: 0.1 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.6, rev: 0.08 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.85 });
    const oh = S.part('aberto', I.ohat, { drum: true, pan: 0.3, gain: 0.45 });
    const cr = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.55 });
    const cl = S.part('palmas', clapMacio, { drum: true, gain: 1, rev: 0.15 });
    const ti = S.part('timpano', I.timp, { drum: true, gain: 0.25, rev: 0.2 });
    const lead = fmLead(S, 'lead', {
        pan: 0.1,
        gain: 0.85,
        corte: 5500,
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
        rev: 0.1,
    });
    const lead2 = fmLead(S, 'terças', { pan: -0.35, gain: 0.4, corte: 4500 });
    const met = fmMetal(S, 'metais', { pan: -0.2, gain: 0.85, rev: 0.15, corte: 4500 });
    const bs = fmBaixo(S, 'baixo', { gain: 0.3, gainAt: duck, corte: 3500 });
    const ar = S.part('arpejo', I.arp, { pan: 0.45, gain: 0.8, echo: { rows: 3, fb: 0.3, mix: 0.3 }, corte: 5000 });
    const sino = fmSino(S, 'sino', { pan: 0.2, gain: 0.8, rev: 0.3, echo: { rows: 6, fb: 0.3, mix: 0.25 } });
    const str = S.part('cordas', I.strings, { gain: 0.65, rev: 0.3, gainAt: duck });
    const rh = rhodes(S, 'rhodes', { pan: 0.25, gain: 0.35, gainAt: duck });
    const oq = S.part('orquestra', orquestra, { drum: true, gain: 0.7, rev: 0.2 });
    // o lance
    const lv = S.part('luva', luva, { drum: true, gain: 0.9, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 1, rev: 0.1 });
    const voa = S.part('voa', deslize(220, 1800, 1.1), { drum: true, gain: 0.35, pan: 0.3, rev: 0.25 });
    const volta = S.part('volta', deslize(1800, 200, 0.45), { drum: true, gain: 0.3, pan: -0.3, rev: 0.2 });
    const tn = S.part('tenis', tenis, { drum: true, pan: 0.4, gain: 0.6, rev: 0.1 });
    const tv = S.part('trave', trave, { drum: true, gain: 1.1, rev: 0.35 });
    const rd = S.part('rede', rede, { drum: true, gain: 1.1, pan: -0.1, rev: 0.2 });
    const tc = S.part('torcida', torcida(5, 0.3, 2.5), { drum: true, gain: 0.35, rev: 0.3 });

    const groove = (b, tipo = 'A') => {
        if (tipo === 'meio') {
            drum(k, b, 1, 'X.........x.....');
            drum(sn, b, 1, '........X.......');
            drum(cl, b, 1, '........x.......', { vel: 0.7 });
            drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
            return;
        }
        drum(k, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.55 });
        if (tipo === 'cheio') drum(oh, b, 1, '..x...x...x...x.', { vel: 0.6 });
    };
    const harmonia = (b, c, { cordas = false, arpejo = false, baixo = BAIXO } = {}) => {
        if (baixo) bass(bs, b, c, baixo);
        stabs(rh, b, c, COMP, { low: 57, n: 4, vel: 0.6 });
        if (cordas) padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.6 });
        if (arpejo) arp(ar, b, c, { low: 69, vel: 0.7 });
    };
    /** O A (ou A2, ou A' com `s` semitons): o lead pergunta, os metais respondem. */
    const blocoA = (b0, s, { dois = false, gancho = false } = {}) => {
        const leadA = gancho ? [...A_LEAD.slice(0, 7), GANCHO.em({ tom: 9 + s, oitava: -1 })] : A_LEAD;
        mel(lead, b0, leadA, { shift: s });
        mel(met, b0, A_MET, { shift: s });
        if (dois) mel(lead2, b0, leadA, { shift: s, harm: thirdBelow(MAJOR((9 + s) % 12)) });
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            harmonia(b0 + i, c, { cordas: dois, arpejo: dois });
            groove(b0 + i, dois ? 'cheio' : 'A');
            if (i === 3 || i === 7) drum(oq, b0 + i, 1, '............X.X.', { pitch: (7 + s + 12) % 12 });
        });
        drum(cr, b0, 1, 'X...............');
        if (dois) for (const i of [2, 6]) drum(tn, b0 + i, 1, '..x...x.........', { pitch: i === 6 ? 2 : 0 });
        if (gancho) {
            drum(cl, b0 + 7, 1, '............X.X.', { vel: 1.1 });
            mel(met, b0 + 7, [GANCHO.em({ tom: 9 + s, oitava: -2 })]);
        }
    };
    const blocoB = (b0, s) => {
        mel(lead, b0, B_LEAD, { shift: s });
        B_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            if (B_BAIXO[i]) {
                mel(bs, b, [B_BAIXO[i]], { shift: s });
                harmonia(b, c, { cordas: true, baixo: null });
            } else harmonia(b, c, { cordas: i >= 4, arpejo: i >= 4 });
            groove(b, i >= 4 ? 'cheio' : 'A');
            if (i >= 4)
                stabs(
                    met,
                    b,
                    c,
                    [
                        [12, 1],
                        [14, 2],
                    ],
                    { low: 62, n: 3, vel: 0.8 },
                );
        });
        // as fintas: o tênis range quando o lead para seco
        drum(tn, b0, 1, '.....x..........');
        drum(tn, b0 + 2, 1, '.....x..........', { pitch: 3 });
        drum(cr, b0 + 4, 1, 'X...............');
        drum(sn, b0 + 7, 1, '........xxXxXXXX', { vel: 0.8 });
    };

    // ---------- a defesa (0-3): o rival ataca, a luva espalma, a bicuda ----------
    bass(bs, 0, 'E7sus4', '0:2 0:2 0:2 0:2 0:2 0:2 0:2 8:2', { vel: 0.8 });
    padChord(str, 0, 'E7sus4', 16, { low: 52, n: 4, vel: 0.6 });
    drum(hh, 0, 1, 'xxxxxxxxxxxxxxxx', { vel: 0.4 });
    drum(k, 0, 1, 'X...X...X...X...', { vel: 0.7 });
    lv.note(16, 0, 0, 1);
    drum(oq, 1, 1, 'X...............', { pitch: 7 });
    drum(cr, 1, 1, 'X...............');
    drum(tn, 1, 1, '........x...x...');
    ch.note(32, 0, 0, 1);
    voa.note(32, 0, 0, 1);
    arp(ar, 2, 'E7sus4', { low: 64, vel: 0.6 });
    drum(sn, 2, 1, 'x...x...x.x.xxxx', { vel: 0.6 });
    // o 3-3-2 da orquestra e dos metais, e a virada pro A
    drum(oq, 3, 1, 'X..X..X.........', { pitch: 7 });
    stabs(met, 3, 'E7sus4', [0, 3, [6, 2]], { low: 59, n: 4 });
    bass(bs, 3, 'E7sus4', '0:3 0:3 0:2 r:8');
    drum(k, 3, 1, 'X..X..X.........');
    drum(sn, 3, 1, '........xxXxXXXX');

    // ---------- A (4-11), A2 (12-19), B (20-27) ----------
    blocoA(4, 0);
    blocoA(12, 0, { dois: true });
    blocoB(20, 0);

    // ---------- solo (28-35): lead e metais trocando de 2 em 2 ----------
    mel(lead, 28, SOLO_LEAD);
    mel(met, 28, SOLO_MET);
    A_CH.forEach((c, i) => {
        harmonia(28 + i, c, { cordas: i >= 4 });
        groove(28 + i, 'cheio');
    });
    drum(cr, 28, 1, 'X...............');
    drum(cr, 32, 1, 'X...............');
    drum(sn, 35, 1, '........xxXxXXXX', { vel: 0.8 });

    // ---------- o chute (36-39): a quebra, o chute, a bola voando... TRAVE ----------
    for (const b of [36, 37]) {
        bass(bs, b, 'Amaj7', BAIXO);
        drum(k, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.oX.X.oX');
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.6 });
    }
    drum(oq, 37, 1, '............X.X.', { pitch: 7 });
    ch.note(38 * 16, 0, 0, 1);
    voa.note(38 * 16, 0, 0, 1);
    drum(sn, 38, 1, 'x...x...x.x.xxxx', { vel: 0.55 });
    drum(ti, 38, 1, '........x.x.xxxx', { pitch: -5, vel: 0.6 });
    tv.note(39 * 16, 0, 0, 1);
    // a fita volta pro replay
    volta.note(39 * 16 + 12, 0, 0, 1);

    // ---------- o replay (40-47): câmera lenta, meio-tempo, a melodia do A em aumentação ----------
    frase(sino, 40 * 16, A_LEAD.slice(0, 2), { escala: 2 });
    frase(met, 44 * 16, A_MET.slice(2, 4), { escala: 2, vel: 0.7 });
    A_CH.slice(0, 4).forEach((c, i) => {
        for (const j of [0, 1]) {
            const b = 40 + 2 * i + j;
            bass(bs, b, c, j ? '0:6 5:2 8:4 5:4' : '0:12 8:4', { vel: 0.8 });
            padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.55 });
            stabs(
                rh,
                b,
                c,
                [
                    [0, 6],
                    [8, 6],
                ],
                { low: 57, n: 4, vel: 0.45 },
            );
            groove(b, 'meio');
        }
    });
    drum(cr, 40, 1, 'X...............');
    ch.note(46 * 16, 0, 0, 0.6);
    voa.note(46 * 16 + 2, 0, 0, 0.6);
    tv.note(47 * 16, -5, 0, 0.9);

    // ---------- subida (48-49): Sol menor e Fá9, o 3-3-2, pro Si♭ ----------
    bass(bs, 48, 'Gm7', BAIXO);
    stabs(rh, 48, 'Gm7', COMP, { low: 57, n: 4, vel: 0.6 });
    groove(48);
    drum(sn, 48, 1, '........x.x.x.x.', { vel: 0.7 });
    drum(oq, 49, 1, 'X..X..X.........', { pitch: 8 });
    stabs(met, 49, 'F9', [0, 3, [6, 2]], { low: 60, n: 4 });
    bass(bs, 49, 'F9', '0:3 0:3 0:2 r:2 5:2 s:2 8:2');
    drum(k, 49, 1, 'X..X..X.........');
    drum(sn, 49, 1, '........xxXxXXXX');
    arp(ar, 49, 'F9', { low: 65, vel: 0.6 });
    voa.note(49 * 16 + 4, 0, 0, 0.7);

    // ---------- A' (50-57) e B' (58-65) em Si♭: o Ato 2 ----------
    blocoA(50, 1, { dois: true, gancho: true });
    blocoB(58, 1);

    // ---------- final (66-69): o último chute, a REDE, o gancho, o 3-3-2 e o Si♭maj7 ----------
    mel(lead, 66, [A_LEAD[0]], { shift: 1 });
    harmonia(66, 'Bbmaj7', { cordas: true });
    groove(66, 'cheio');
    ch.note(66 * 16 + 12, 0, 0, 1);
    voa.note(66 * 16 + 12, 0, 0, 0.8);
    rd.note(67 * 16, 0, 0, 1);
    tc.note(67 * 16, 0, 0, 1);
    drum(cr, 67, 1, 'X...............');
    drum(oq, 67, 1, 'X...............', { pitch: 1 });
    mel(lead, 67, [GANCHO.em({ tom: 10, oitava: -1 })]);
    mel(met, 67, [GANCHO.em({ tom: 10, oitava: -2 })]);
    mel(lead2, 67, [GANCHO.em({ tom: 10, oitava: -1 })], { harm: thirdBelow(MAJOR(10)) });
    drum(cl, 67, 1, '............X.X.', { vel: 1.1 });
    bass(bs, 67, 'Ebmaj7', '0:3 0:3 8:6 r:4');
    padChord(str, 67, 'Ebmaj7', 16, { low: 55, n: 4, vel: 0.7 });
    drum(k, 67, 1, 'X..X..X.........');
    // o 3-3-2 da banda inteira, e a escala lídia subindo
    for (const [P, o] of [
        [met, { low: 60, n: 4 }],
        [rh, { low: 57, n: 4, vel: 0.7 }],
    ])
        stabs(P, 68, 'Bbmaj7', [0, 3, [6, 2]], o);
    drum(oq, 68, 1, 'X..X..X.........', { pitch: 1 });
    drum(k, 68, 1, 'X..X..X.........');
    drum(cr, 68, 1, 'X..X..X.........', { vel: 0.7 });
    bass(bs, 68, 'Bbmaj7', '0:3 0:3 0:2 r:8');
    mel(lead, 68, ['r:8 F5:1 G5:1 A5:1 Bb5:1 C6:1 D6:1 E6:1 F6:1']);
    drum(sn, 68, 1, '........xxXxXXXX');
    // o acorde final, com prato, tímpano e rabo de sala
    mel(lead, 69, ['Bb5+D6:16']);
    padChord(met, 69, 'Bbmaj7', 12, { low: 58, n: 4 });
    padChord(str, 69, 'Bbmaj7', 16, { low: 50, n: 5, vel: 0.8 });
    padChord(rh, 69, 'Bbmaj7', 16, { low: 57, n: 4, vel: 0.7 });
    bs.note(69 * 16, 34, 12, 1);
    drum(k, 69, 1, 'X...............');
    drum(cr, 69, 1, 'X...............');
    drum(oq, 69, 1, 'X...............', { pitch: 1 });
    drum(ti, 69, 1, 'X...............', { pitch: -3 });
    drum(cl, 69, 1, 'X...............', { vel: 0.9 });
    return S;
}
