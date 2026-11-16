// Soccermon News #1 (pauta 21, 20/11/2026; roteiro em trailer/curtas/news-01/ROTEIRO.md).
// v8 (15/11): a dupla Raichu e Machoke apresenta e a linha do tempo inteira sai de trailer/curtas/news-01/linha.mjs (a
// cena e os blips usam a mesma). Saíram as vozes cantadas (`pika`, `miau`, `psy`, o PLOF e as de "HA": o Miguel achou
// agressivas); a fala agora é só o blip suave de cada personagem, num arquivo à parte (news-voz.wav, gerado pelo
// linha.mjs), e a banda abaixa 3 dB enquanto a caixa digita. Só 2 varridas com a cartinha (escalada e VEM AÍ); as
// outras trocas de cena têm um whoosh curto.
// Vinheta de plantão própria, no molde do livre-ditto. O motivo do jornal ("plan-tão, NO-tí-cia, já!"): Dó Dó Sol↑ Fá
// Mi♭ Fá, Si♭ Dó, Dó dórico. 120 BPM, 4/4, compasso = 2 s (linha = 1/8 s); os blocos começam na batida (linha.mjs) e a
// cama de cada bloco começa no corte dele.
import { LINHA } from '../../../trailer/curtas/news-01/linha.mjs';
import { aparece, rasga, sobe, varrida } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { kaboom } from './livre-bolas.mjs';
import { chute } from './livre-ginasio.mjs';

export const meta = { titulo: 'Soccermon News: plantão', tela: 'Soccermon News #1 (vídeo)' };

const { M, FALAS, FIM, CARTELAS, VARRIDAS, CORTES } = LINHA;
const F = Object.fromEntries(FALAS.map((f) => [f.id, f]));
/** O motivo do jornal (um compasso, Dó dórico). */
export const MOTIVO = 'C5:2 C5:1 G5:3 F5:1 Eb5:1 F5:2 r:2 Bb4:2 C5:2';
/** Segundo do vídeo → linha da peça. */
const R = (s) => Math.round(s * 8);
/** A banda (bateria, baixo, acordes) sai nestes trechos (s): o atraso do satélite, a reação sem graça do Raichu e o
 * Voltorb no banco (o fim do Vestiário). */
export const BREQUES = [M.atraso, [M.reacao, F.f13.s], [M.voltorb, M.vemai]];

export default function news() {
    const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2) + 1, swing: 0.1, tail: 2.5 });
    const rampa = (t, a, z) => Math.min(1, Math.max(0, (t - a) / 0.04)) * Math.min(1, Math.max(0, (z - t) / 0.08));
    const banda = (t) => BREQUES.reduce((g, [a, z]) => g * (1 - rampa(t, a, z)), 1);
    const B = { gainAt: banda };

    const colher = S.part('colher', I.bell, { pan: -0.2, gain: 1.4, rev: 0.4, echo: { rows: 4, fb: 0.3, mix: 0.3 } });
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
    const pe = S.part('chute', chute, { drum: true, gain: 0.9 });
    const boom = S.part('kaboom', kaboom, { drum: true, gain: 1.7, rev: 0.25 });
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
    const vr = S.part('varrida', varrida, { drum: true, gain: 0.55, rev: 0.2 });
    const rs = S.part('rasga', rasga, { drum: true, gain: 0.7, pan: 0.1, rev: 0.12 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.32, pan: -0.1, rev: 0.1 });
    const tq = S.part('tique', I.block, { pan: 0.15, gain: 0.5 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.45 });
    const sk = S.part('shaker', I.shaker, { drum: true, gain: 0.5, pan: 0.2 });

    // a cama de cada bloco começa no corte e para no próximo: a banda corta as notas fora de [LIM0, LIM1)
    let LIM = [0, Number.POSITIVE_INFINITY];
    for (const p of [kk, sn, hh, bs, ep, gt]) {
        const n0 = p.note;
        p.note = (t, ...a) => {
            if (t / 8 < LIM[0] - 1e-6 || t / 8 >= LIM[1] - 1e-6) return;
            n0(t, ...a);
        };
    }
    const bb = MAJOR(10); // Dó dórico = as notas de Si♭ maior
    const eb = MAJOR(3);
    /** O groove do estúdio: bumbo e caixa no tempo, chimbal em colcheia, o baixo andando e o piano em contratempo. */
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
    /** O funk do jornal, leve (as matérias). */
    const leve = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.........x.....', { vel: 0.85 });
        drum(sn, b, 1, '....x.......x...', { vel: 0.6 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        bass(bs, b, c, '0:3 r:3 5:2 0:2 r:2 s:2 5:2', { vel: 0.8 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.6 });
        stabs(ep, b, c, [[0, 4]], { low: 60, n: 4, vel: 0.35 });
    };
    /** A cama de t0 a t1 (s): um compasso por acorde, em roda. */
    const cama = (t0, t1, modo, acordes, s = 0) => {
        LIM = [t0, t1];
        for (let k = 0; t0 + 2 * k < t1 - 0.01; k++) modo(t0 / 2 + k, acordes[k % acordes.length], s);
        LIM = [0, Number.POSITIVE_INFINITY];
    };
    /** Toque de manchete nova: um acorde curto dos metais e o sino. */
    const manchete = (s, sym, nota = 91) => {
        stabs(toque, 0, sym, [[R(s), 2]], { low: 60, n: 4, vel: 0.7 });
        sino.note(R(s), nota, 2, 0.6);
        cr.note(R(s), 0, 0, 0.55);
    };

    // 0–2 · o gancho: o Voltorb no banco, de colete. A batida da vinheta (prato, bumbo, tímpano e a cabeça do motivo)
    // e o "plim-plim" em cada piscada; a tuba ri baixinho e o riser puxa a vinheta
    cr.note(0, 0, 0, 0.8);
    kk.note(0, 0, 0, 1);
    tp.note(0, 0, 0, 0.9);
    mel(met, 0, ['C5:1 C5:1 G5:2 r:12'], { vel: 0.85 });
    mel(met2, 0, ['C5:1 C5:1 G5:2 r:12'], { shift: -12, harm: thirdBelow(bb), vel: 0.7 });
    padChord(cor, 0, 'Fm9', 16, { low: 55, n: 4, vel: 0.35 });
    plim.note(R(0.75), 100, 1, 0.8);
    plim.note(R(1.1), 105, 2, 0.8);
    tuba.note(R(0.5), 36, 2, 0.45);
    tuba.note(R(0.75), 31, 3, 0.4);
    ris.note(0, 0, 0, 0.7);
    drum(tp, 0, 1, '..........x.xxXX', { vel: 0.6 });
    // 2–4 · VINHETA: prato, o motivo inteiro nos metais em terças, tímpano; o baixo puxa pra bancada
    drum(cr, 1, 1, 'X...............');
    drum(kk, 1, 1, 'X.....X.X.......');
    drum(tp, 1, 1, 'X.....X.........', { vel: 0.8 });
    mel(met, 1, [MOTIVO]);
    mel(met2, 1, [MOTIVO], { shift: -12, harm: thirdBelow(bb), vel: 0.8 });
    drum(hh, 1, 1, '........x.x.x.x.', { vel: 0.6 });
    bass(bs, 1, 'Cm7', 'r:8 0:3 r:3 5:2', { vel: 0.8 });

    // ===================== a cama por bloco =====================
    cama(M.abertura, M.escalada, ar, ['Cm7', 'F7']);
    cama(CARTELAS[0], CARTELAS[3], leve, ['Cm7', 'F7']);
    cama(M.plantao, M.aovivo, leve, ['Cm7', 'F7']);
    cama(M.aovivo, M.vestiario, leve, ['F7', 'Cm7']);
    cama(F.f13.s, M.voltorb, ar, ['Ab', 'Cm7']);
    cama(M.vemai, F.f16.s, leve, ['Cm7', 'F7']);
    cama(F.f16.s, F.f17.s, leve, ['Cm7', 'F7'], 2); // o Time Ultimate sobe pra Ré
    cama(F.f17.s, M.pacote.mewtwo, leve, ['Bb7']);
    cama(M.pacote.mewtwo, M.notape, ar, ['Ebmaj7', 'Ab']);
    cama(M.notape, F.f20.s, ar, ['Ebmaj7', 'Ab', 'Bb7']);

    // as 2 varridas com a cartinha (o pico do "fuuuh" no corte) e o whoosh curto nos outros cortes
    for (const s of VARRIDAS) vr.note((s - 0.2) * 8, 0, 0, 1);
    for (const s of CORTES) vr.note((s - 0.16) * 8, 5, 0, 0.32);
    // a manchete nova de cada bloco
    manchete(M.abertura, 'Cm9', 91);
    manchete(M.plantao, 'Cm9', 91);
    manchete(M.aovivo, 'F9', 93);
    manchete(M.vestiario, 'Abmaj7', 91);
    manchete(M.vemai, 'Cm9', 94);
    manchete(M.notape, 'Ebmaj7', 91);

    // ABERTURA: as faíscas do Raichu (o sino da colher) no "Boa noite"
    colher.note(R(F.f1.a + 0.1), 98, 4, 0.7);
    // "Hoje": o selo VERSÃO NOVA carimba duas vezes (0.9.51 e 0.9.52): bumbo, tom e sinos baixinhos
    for (const [k, t] of [M.ver51, M.ver52].entries()) {
        kk.note(R(t), 0, 0, 0.6);
        tm.note(R(t), k * 3, 0, 0.45);
        sino.note(R(t), 96 + k * 3, 2, 0.4);
    }

    // ESCALADA: uma batida da vinheta em cada cartela (bumbo, tímpano e a cabeça do motivo, uma terça acima a cada uma);
    // na 4ª ("E mais") a banda segura, as cordas abrem e o pulso pergunta
    CARTELAS.forEach((s, k) => {
        kk.note(R(s), 0, 0, 1);
        tp.note(R(s), 0, 0, 0.9);
        mel(met, s / 2, ['C5:1 C5:1 G5:2 r:12'], { shift: [0, 3, 5, 0][k], vel: 0.85 });
        mel(met2, s / 2, ['C5:1 C5:1 G5:2 r:12'], { shift: [0, 3, 5, 0][k] - 12, harm: thirdBelow(bb), vel: 0.7 });
    });
    cr.note(R(CARTELAS[0]), 0, 0, 0.7);
    padChord(cor, 0, 'Abmaj7', 12, { low: 55, n: 4, vel: 0.5, at: R(CARTELAS[3]) });
    for (const d of [0.4, 0.8]) pulso.note(R(CARTELAS[3] + d), 67, 2, 0.5);
    ris.note(R(M.plantao - 2), 0, 0, 0.5);

    // PLANTÃO: o motivo curto; as 3 opções da recompensa (um "bwoop" cada, subindo) e o holofote na Charanga
    mel(toque, M.plantao / 2, ['C5:2 C5:1 G5:3 r:10']);
    for (const [k, s] of M.deal.entries()) ap.note(s * 8, k * 3, 0, 0.9);
    tm.note(M.holofote * 8, 5, 0, 0.7);
    sino.note(M.holofote * 8, 98, 3, 0.6);
    sino.note(M.holofote * 8 + 1, 103, 3, 0.5);
    // os 4 troféus que acendem (um ding cada, subindo) e a carta do Patrocínio
    for (const [k, m] of [91, 94, 98, 103].entries()) sino.note(M.trofeus[k] * 8, m, 3, 0.8);
    ap.note(M.patro * 8, 5, 0, 1);
    // PERDENDO: a tuba cai; cada barra +4: o bumbo da Charanga e dois bips subindo
    tuba.note(M.perdendo * 8, 43, 1, 0.55);
    tuba.note(M.perdendo * 8 + 1, 38, 1.4, 0.5);
    M.mais4.forEach((s, k) => {
        const m = [72, 74, 76, 77, 79, 81][k];
        tm.note(s * 8, 4, 0, 0.8);
        pulso.note(s * 8, m, 0.9, 0.6);
        pulso.note(s * 8 + 0.9, m + 12, 0.9, 0.55);
    });
    // a sonora do Magikarp: o tom no corte; um brilho no "charanga"
    tm.note(R(F.f7.s), 2, 0, 0.5);
    sino.note(M.charanga * 8, 103, 2, 0.5);

    // AO VIVO: o motivo inteiro; a tela divide (o "bwoop" das tarjas)
    mel(toque, M.aovivo / 2, [MOTIVO], { vel: 0.8 });
    ap.note((M.split + 0.35) * 8, 6, 0, 0.45);
    // o atraso do satélite: a banda para; as cordas e dois bips de satélite; o Meowth acorda no prato
    padChord(cor, 0, 'Fm9', 12, { low: 55, n: 4, vel: 0.3, at: R(M.atraso[0]) });
    pulso.note(R(M.atraso[0] + 0.25), 96, 1, 0.35);
    pulso.note(R(M.atraso[0] + 0.75), 96, 1, 0.35);
    cr.note(R(F.f9.a), 0, 0, 0.5);
    // o ₽ da Rota: cada vitória é um "ka-ching" e o contador sobe 3 → 6 → 9
    for (const [k, s] of M.vitorias.entries()) {
        moeda.note(s * 8, 24 + k * 2, 0, 0.6);
        moeda.note(s * 8 + 1, 31 + k * 2, 0, 0.6);
        sino.note(s * 8, [86, 89, 93][k], 2, 0.3);
    }
    // PAY DAY: o amuleto brilha no pulo; as 14 moedas descem a escala; o ka-ching na pose
    sino.note((M.payday + 0.15) * 8, 103, 2, 0.7);
    for (const [k, s] of M.moedas.entries()) moeda.note(s * 8, 31 - Math.round(k * 1.6), 0, 0.8 - k * 0.02);
    for (const [k, p] of [24, 31].entries()) moeda.note((M.payday + 1.9) * 8 + k, p, 0, 0.9);

    // VESTIÁRIO: a tuba e o tímpano esperam; o chute e o KABOOM do EP 2 (no "explodiu")
    mel(tuba, M.vestiario / 2, ['C2:4 Db2:4 C2:8'], { vel: 0.45 });
    drum(tp, M.vestiario / 2, 1, '....x...x...xxxx', { vel: 0.35 });
    pe.note(R(M.kaboom - 1.4), 0, 0, 1);
    boom.note(R(M.kaboom), 0, 0, 1);
    padChord(cor, 0, 'Cm', 16, { low: 48, n: 3, vel: 0.35, at: R(M.kaboom + 0.4) });
    // a reação sem graça do Raichu: o "plim" e a tuba descendo
    plim.note(R(M.reacao + 0.15), 96, 1, 0.55);
    tuba.note(R(M.reacao + 0.3), 38, 1, 0.35);
    tuba.note(R(M.reacao + 0.5), 36, 2, 0.3);
    // o banco: a banda para; o Voltorb pisca no "plim-plim" e a tuba ri baixinho
    padChord(cor, 0, 'Fm9', 24, { low: 55, n: 4, vel: 0.3, at: R(M.voltorb) });
    tuba.note(R(M.voltorb), 36, 2, 0.5);
    tuba.note(R(M.voltorb + 0.25), 31, 3, 0.45);
    for (const [d, m] of [
        [0.6, 100],
        [0.95, 105],
        [2.4, 100],
    ])
        plim.note(R(M.voltorb + d), m, 1, 0.75);
    ap.note((M.voltorb + 0.25) * 8, 3, 0, 0.4);

    // VEM AÍ: uma nota de sino por sexta do calendário; o 27/11 vira Time Ultimate (bumbo, prato e sino, em Ré)
    for (const [k, s] of M.sextas.entries()) sino.note(s * 8, [86, 89, 93, 98][k], 2, 0.75);
    kk.note(M.ultimate * 8, 0, 0, 0.9);
    cr.note(M.ultimate * 8, 0, 0, 0.6);
    sino.note(M.ultimate * 8, 98, 3, 0.6);
    stabs(toque, 0, 'Dmaj7', [[R(M.ultimate), 3]], { low: 60, n: 4, vel: 0.6 });
    // o pacote: cai, treme (o chocalho), rasga, as cartas saem (um "bwoop" cada) e viram (dó-mi-sol-dó de Si♭); o Mewtwo
    // vira por último (prato e fanfarra em Mi♭; o riser até ele)
    const P = M.pacote;
    ris3.note(R(P.mewtwo - 3), 0, 0, 1);
    tm.note(P.cai * 8 + 1, 0, 0, 0.45);
    for (let k = 0; k < 4; k++) sk.note((P.treme + k * 0.06) * 8, 0, 0, 0.5);
    rs.note(P.rasga * 8, 0, 0, 0.75);
    for (const [k, s] of P.sai.entries()) ap.note(s * 8, 2 + k, 0, 0.4);
    for (const [k, s] of P.vira.entries()) sino.note(s * 8, [82, 86, 89, 94][k], 1, 0.7);
    cr.note(R(P.mewtwo), 0, 0, 1);
    mel(met, P.mewtwo / 2, ['Eb5:2 G5:2 Bb5:4 r:8'], { harm: thirdBelow(eb) });
    stabs(toque, 0, 'Ebmaj7', [[R(P.mewtwo), 8]], { low: 58, n: 4, vel: 0.6 });

    // NOTA PÉ: o Voltorb pula no telão ("ele tá bem"); o "ting" no "boa noite" do Raichu
    const bem = F.f18.paginas[0].chars[F.f18.paginas[0].texto.indexOf('bem')];
    plim.note(R(bem), 100, 1, 0.6);
    plim.note(R(bem + 0.35), 105, 2, 0.6);
    colher.note(R(M.boaNoite), 98, 4, 0.75);
    // "TEMOS QUE CHUTAR!": os metais no ritmo do grito (Te-mos-que-chu-TAR), bumbo no grito e prato no "TAR"
    const GRITO = 'G5:1 G5:1 G5:1 Bb5:1 C6:5 r:7';
    mel(met, M.grito[0] / 2, [GRITO], { vel: 0.8 });
    mel(met2, M.grito[0] / 2, [GRITO], { shift: -12, harm: thirdBelow(bb), vel: 0.6 });
    kk.note(R(M.grito[0]), 0, 0, 0.9);
    cr.note(R(M.grito[1]), 0, 0, 0.9);
    stabs(toque, 0, 'Bb7', [[R(M.grito[1]), 3]], { low: 58, n: 4, vel: 0.7 });
    padChord(cor, 0, 'Bb7', 20, { low: 56, n: 4, vel: 0.45, at: R(F.f20.s) });
    ris.note(R(M.final - 2), 0, 0, 0.7);
    drum(sn, (M.final - 2) / 2, 1, '............xxXX', { vel: 0.6 });

    // TELA FINAL: o SOC-CER-MON nos metais em Mi♭, as palmas; Mi♭ e o "ting" em +1,5; fecha com tudo em +2,5
    const t0 = M.final;
    const b0 = t0 / 2;
    cr.note(R(t0), 0, 0, 0.9);
    drum(kk, b0, 1, 'X.....x.X.....x.');
    drum(sn, b0, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, b0, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.55 });
    bass(bs, b0, 'Ab', '0:3 r:1 5:2 0:2 r:8', { vel: 0.8 });
    mel(met, b0, [GANCHO.em({ tom: 3, oitava: -1 })], { harm: thirdBelow(eb), vel: 0.7 });
    mel(pulso, b0, [GANCHO.em({ tom: 3, oitava: 0 })], { vel: 0.55 });
    drum(cl, b0, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, b0, 'Ab', 8, { low: 56, n: 4, vel: 0.55 });
    cr.note(R(t0 + 1.5), 0, 0, 0.8);
    stabs(toque, 0, 'Eb', [[R(t0 + 1.5), 6]], { low: 58, n: 4 });
    tuba.note(R(t0 + 1.5), 39, 8, 1);
    colher.note(R(t0 + 1.5), 99, 6, 1);
    drum(kk, b0 + 0.75, 1, 'X.....x.X.......');
    drum(sn, b0 + 0.75, 1, '....x.xxX.......', { vel: 0.6 });
    bass(bs, b0 + 0.75, 'Eb', '0:2 5:2 8:2 s:2 0:4 r:4', { vel: 0.8 });
    mel(met, b0 + 0.75, ['Eb5:1 G5:1 Bb5:2 r:4 Eb6:4 r:4'], { harm: thirdBelow(eb), vel: 0.6 });
    cr.note(R(t0 + 2.5), 0, 0, 1);
    tuba.note(R(t0 + 2.5), 39, 8, 0.9);
    padChord(cor, 0, 'Eb', 8, { low: 55, n: 4, vel: 0.6, at: R(t0 + 2.5) });

    // a banda abaixa 3 dB enquanto a caixa digita (os blips ficam audíveis por cima, baixinhos)
    const DIGITANDO = FALAS.flatMap((f) => f.paginas.map((p) => [p.ini - 0.05, p.fim + 0.1]));
    const DK = Float32Array.from({ length: Math.ceil(FIM * 1000) + 3000 }, (_, i) => {
        const t = i / 1000;
        return DIGITANDO.reduce((g, [a, z]) => {
            const u = Math.min(1, Math.max(0, (t - a) / 0.08)) * Math.min(1, Math.max(0, (z - t) / 0.25));
            return g * (1 - 0.3 * u);
        }, 1);
    });
    const duck = (t) => DK[Math.min(DK.length - 1, Math.max(0, Math.round(t * 1000)))];
    for (const p of S.parts) {
        const g0 = p.gainAt;
        p.gainAt = g0 ? (t) => g0(t) * duck(t) : duck;
    }
    return S;
}
