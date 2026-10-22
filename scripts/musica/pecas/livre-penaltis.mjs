// Disputa de pênaltis (categoria livre, peça tensa): cinco cobranças pra cada lado, contadas pela música. Cada
// cobrança são dois compassos: o apito do juiz, as cordas subindo pelo cromático (a corrida pra bola) com o coração
// batendo dobrado, o chute e o resultado em som: REDE e torcida (gol nosso, metais em maior), rede e a torcida
// deles lá longe (gol deles, metais caindo), TRAVE ("dong", "óóó") e LUVA (o nosso goleiro pega). A cada rodada
// tudo sobe meio tom e acelera (96 → 112 BPM). Placar: gol, gol | gol, gol | trave, gol (2 a 3) | gol, defesa (3 a 3) |
// gol (4 a 3)... e a última: corrida, o coração para, um compasso de silêncio só com uma nota no alto, o chute, e o
// goleiro pega. Explode o SOC-CER-MON em Mi maior com palmas e torcida, sobe um tom (Fá# maior) e fecha.
// Trechos: "espera" (loop curto: coração, relógio e a nota grave, pra tela de pênaltis) e "disputa" (a história
// inteira, sem loop, ~1min15).
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { apito, chute, luva, rede, torcida, trave } from './livre-ginasio.mjs';

export const meta = { titulo: 'Disputa de pênaltis', tela: 'Pênaltis (demo) / faixa do álbum' };

const RODADAS = [
    // [compasso, semitons, andamento, nossa cobrança, a deles]
    [2, 0, 96, 'gol', 'gol'],
    [6, 1, 100, 'gol', 'gol'],
    [10, 2, 104, 'trave', 'gol'],
    [14, 3, 108, 'gol', 'defesa'],
];

export default function penaltis() {
    const BPM = { 0: 92, 1: 92 };
    for (const [b0, , bpm] of RODADAS) for (let i = 0; i < 4; i++) BPM[b0 + i] = bpm;
    const S = new Song({
        bpm: 92,
        bars: 32,
        tail: 4,
        bpmAt: (b) => BPM[b] ?? (b < 23 ? 112 : 126),
        secoes: [
            { nome: 'espera', de: 0, loop: true },
            { nome: 'disputa', de: 2, loop: false },
        ],
    });
    // a tensão cresce rodada a rodada: volume geral de 70% (1ª cobrança) a 100% (a última)
    S.masterAt = (t) => {
        const b = S.barAt(t);
        return b < 2 ? 0.8 : b >= 20 ? 1 : 0.7 + (0.3 * (b - 2)) / 18;
    };
    const strN = S.part('cordasNos', I.strings, { pan: -0.3, gain: 2.8, rev: 0.3 });
    const strE = S.part('cordasEles', I.strings, { pan: 0.3, gain: 2.8, rev: 0.3 });
    const alto = S.part('notaAlta', I.strings, { gain: 1.8, rev: 0.5 });
    const ped = S.part('pedal', I.bass, { gain: 0.35, corte: 700 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const cor = S.part('coracao', I.kick, { drum: true, gain: 0.5 });
    const tique = S.part('relogio', I.block, { drum: true, pan: -0.4, gain: 0.9 });
    const ap = S.part('apito', apito(0.14), { drum: true, gain: 0.55, rev: 0.4 });
    const ch = S.part('chute', chute, { drum: true, gain: 1 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.9, rev: 0.3 });
    const tv = S.part('trave', trave, { drum: true, gain: 0.8, rev: 0.4 });
    const lv = S.part('luva', luva, { drum: true, gain: 1, rev: 0.3 });
    const tcNos = S.part('torcidaNossa', torcida(2.4, 0.08, 1.6), { drum: true, gain: 0.7, rev: 0.3 });
    const tcEles = S.part('torcidaDeles', torcida(1.8, 0.1, 1.2), { drum: true, pan: 0.5, gain: 0.35, rev: 0.5 });
    const tcOh = S.part('torcidaOh', torcida(1.5, 0.1, 1), { drum: true, gain: 0.5, rev: 0.3 });
    const tcFim = S.part('torcidaFim', torcida(12, 0.1, 4), { drum: true, gain: 0.55, rev: 0.3 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.55, corte: 2800, rev: 0.3 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.3, corte: 3800, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.6 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.4 }), {
        drum: true,
        gain: 1.1,
        rev: 0.3,
    });
    const cl2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.5, atraso: 0.014, tom: -1 }), {
        drum: true,
        pan: 0.4,
        gain: 0.9,
        rev: 0.3,
    });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.6 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.25 });

    // espera: o coração, o relógio, o Mi grave e uma nota alta parada
    for (const b of [0, 1]) {
        drum(cor, b, 1, 'X..x............', { pitch: -4 });
        drum(tique, b, 1, 'x...x...x...x...', { vel: 0.7 });
        mel(ped, b, ['E2:16']);
        padChord(pad, b, 'Em', 16, { low: 52, n: 3, vel: 0.7 });
        mel(alto, b, ['B5:16'], { vel: 0.4 });
    }

    /** A corrida: apito, coração dobrado, cordas tremendo e subindo pelo cromático. */
    const corrida = (b, s, nos) => {
        ap.note(b * 16, 0, 0, 0.9);
        drum(cor, b, 1, 'X..x....X..x....', { pitch: -4 });
        mel(ped, b, ['E2:16'], { shift: s });
        const P = nos ? strN : strE;
        const base = (nos ? 64 : 52) + s;
        for (let r = 0; r < 16; r++) P.note(b * 16 + r, base + (r >> 1), 1, 0.4 + (0.6 * r) / 15);
    };
    /** O chute e o resultado. */
    const cobranca = (b, s, res) => {
        ch.note(b * 16, 0, 0, 1);
        drum(cor, b, 1, '........X..x....', { pitch: -4, vel: 0.7 });
        drum(tique, b, 1, '........x...x...', { vel: 0.6 });
        mel(ped, b, ['E2:16'], { shift: s, vel: 0.7 });
        const E = transpose('E', s);
        const Em = transpose('Em', s);
        if (res === 'gol' || res === 'golDeles') rd.note(b * 16 + 2, 0, 0, 1);
        if (res === 'gol') {
            tcNos.note(b * 16 + 2, 0, 0, 1);
            stabs(
                met,
                b,
                E,
                [
                    [4, 2],
                    [6, 6],
                ],
                { low: 56, n: 4 },
            );
        }
        if (res === 'golDeles') {
            tcEles.note(b * 16 + 2, 2, 0, 1);
            mel(met, b, ['r:4 B3:2 G3:2 E3:8'], { shift: s, vel: 0.7 });
            padChord(pad, b, Em, 16, { low: 52, n: 3, vel: 0.5 });
        }
        if (res === 'trave') {
            tv.note(b * 16 + 2, 0, 0, 1);
            tcOh.note(b * 16 + 3, -4, 0, 1);
            mel(met, b, ['r:6 B3:2 Bb3:2 A3:6'], { shift: s, vel: 0.8 });
        }
        if (res === 'defesa') {
            lv.note(b * 16 + 2, 0, 0, 1);
            tcNos.note(b * 16 + 3, 0, 0, 1.1);
            stabs(
                met,
                b,
                E,
                [
                    [4, 2],
                    [6, 6],
                ],
                { low: 56, n: 4 },
            );
        }
    };
    for (const [b0, s, , nos, eles] of RODADAS) {
        corrida(b0, s, true);
        cobranca(b0 + 1, s, nos);
        corrida(b0 + 2, s, false);
        cobranca(b0 + 3, s, eles === 'gol' ? 'golDeles' : eles);
    }
    // 5ª rodada: o nosso faz (4 a 3); a última deles
    corrida(18, 4, true);
    cobranca(19, 4, 'gol');
    corrida(20, 4, false);
    // o coração para: um compasso de silêncio com uma nota lá em cima
    mel(alto, 21, ['G#6:16'], { vel: 0.5 });
    // o chute... e o goleiro pega
    ch.note(22 * 16, 0, 0, 1.2);
    lv.note(22 * 16 + 2, 0, 0, 1.2);
    tcFim.note(22 * 16 + 3, 0, 0, 1);
    drum(cr, 22, 1, '...X............');
    drum(sn, 22, 1, '........xxxxXXXX', { vel: 0.9 });
    drum(tp, 22, 1, '........x.x.xxxx', { vel: 0.8 });

    // a festa: o SOC-CER-MON em Mi maior, depois Fá# maior
    const CH = ['E', 'C#m7', 'Amaj7', 'B7'];
    const LEAD = [
        GANCHO.em({ tom: 4 }),
        'E6:2 D#6:2 C#6:2 B5:2 G#5:4 B5:4',
        GANCHO.em({ tom: 4, grau: 1 }),
        'D#6:2 F#6:2 A6:2 B6:2 A6:4 F#6:4',
    ];
    const MET = ['r:16', 'r:8 G#4:2 B4:2 C#5:4', 'r:16', 'r:8 B4:2 D#5:2 F#5:4'];
    for (const [b0, s] of [
        [23, 0],
        [27, 2],
    ]) {
        mel(lead, b0, LEAD, { shift: s });
        mel(harm, b0, LEAD, { shift: s, harm: thirdBelow(MAJOR(4 + s)) });
        mel(met, b0, MET, { shift: s });
        CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            bass(bs, b, c, '0:2 8:1~ r:1 5:2 0:2 r:2 s:2 8:2 5:2');
            drum(k, b, 1, 'X.....x...x..x..');
            drum(sn, b, 1, '....X..o.o..X..o');
            drum(hh, b, 1, 'x.xx.x.xx.xx.x.x');
            padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.6 });
            if (i % 2 === 0) {
                drum(cl, b, 1, GANCHO.palmas);
                drum(cl2, b, 1, GANCHO.palmas);
            }
        });
        drum(cr, b0, 1, 'X...............');
    }
    drum(sn, 30, 1, '............xxXX');
    // fecha em Fá# maior
    mel(lead, 31, ['F#6:16']);
    mel(harm, 31, ['A#5:16']);
    mel(met, 31, ['A#4+C#5+F#5:16']);
    padChord(pad, 31, 'F#', 16, { low: 54, n: 4, vel: 0.8 });
    bass(bs, 31, 'F#', '0:16');
    drum(cr, 31, 1, 'X...............');
    drum(tp, 31, 1, 'X...............');
    tcNos.note(31 * 16, 0, 0, 1);
    return S;
}
