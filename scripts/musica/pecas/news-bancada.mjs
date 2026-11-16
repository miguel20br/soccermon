// Soccermon News #1 v10 (16/11/2026): a trilha inteira, sobre o esboço C aprovado (news-esboco-c.mjs, "bancada
// jazz-fusion" no jeito do Sonic Mania). O Miguel escolheu a música C e a vinheta C (a cartinha girando e virando o
// logo). Lê a linha do tempo de trailer/curtas/news-01/linha.mjs: cada bloco, fala e beat sem texto cai no mesmo
// instante da cena.
// Mi♭ maior, 120 BPM, compasso = 2 s (linha = 1/8 s), swing leve (0,06). O telefone da redação é a pergunta, a bancada
// responde com o tema. A história:
//   gancho (0–2): tensão no pedal de Si♭ com o pavio do Voltorb (plins subindo, chimbal chiando, tímpano);
//   vinheta C (2–4,5): o telefone toca, toms acompanham os giros da cartinha, o logo monta no impacto (3,28) e o tema
//     sobe até o Mi♭ agudo no #1 (3,85);
//   abertura: o groove de bancada (I–vi–IV–V com extensões, slap andando, piano elétrico), telefone num vão, o lead
//     atende no outro; escalada: uma batida por cartela, a cabeça do tema subindo pelo campo harmônico;
//   AO VIVO: a cor de rua (clavinete, partido-alto, Dó menor dórico), as moedas do Pay Day respondem no 3-3-2;
//   VESTIÁRIO: cômico e magro (tuba, pizzicato e o tique de relógio), a banda para na reação do Raichu;
//   VEM AÍ: o baixo sobe pelo cromático, o telefone toca e tudo sobe um tom (Fá maior) com bumbo reto; o SOC-CER-MON com
//     palmas prepara o Mewtwo, que entra com o tema inteiro;
//   PRA FECHAR: o tema volta inteiro depois do "boa noite", os metais no grito, o SOC-CER-MON na tela final, o acorde e
//     o telefone tocando uma última vez (a piada; TELEFONE_NO_FIM = false fecha só no acorde).
// Cada beat sem texto (BEATS) é um respiro: a bateria sai e entra um acento próprio (cartas caindo, chiado do telão,
// moedas, a gag do Voltorb, o Voltorb rolando, a risada). A banda abaixa 3 dB enquanto a caixa digita (os blips ficam em
// news-voz.wav, por cima).
import { LINHA } from '../../../trailer/curtas/news-01/linha.mjs';
import { aparece, plim as plimSino, rasga, sobe, varrida } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { kaboom } from './livre-bolas.mjs';
import { chute, deslize, som, zap } from './livre-ginasio.mjs';
import { TEMA, telefone } from './news-esboco-c.mjs';

export const meta = { titulo: 'Soccermon News #1: bancada', tela: 'Soccermon News #1 (vídeo)' };

/** Fecha no acorde e o telefone toca uma última vez (a piada); false = só o acorde. */
export const TELEFONE_NO_FIM = true;

const { M, FALAS, FIM, CARTELAS, VARRIDAS, CORTES, BEATS } = LINHA;
const F = Object.fromEntries(FALAS.map((f) => [f.id, f]));
const B = Object.fromEntries(BEATS.map((b) => [b.nome, b]));

/** O chiado do telão (0,45 s): ruído em 6 degraus (o steps(6) da cena) e um estalo quando a imagem abre. */
const chiado = som(
    0.5,
    (_p, r) => {
        let lp = 0;
        return (t) => {
            const k = Math.floor(t / 0.067);
            const amp = t < 0.4 ? 0.55 + 0.45 * (((k * 37) % 5) / 4) : Math.max(0, 1 - (t - 0.4) / 0.04);
            const x = r() * 2 - 1;
            lp += 0.45 * (x - lp);
            return (x - 0.7 * lp) * amp;
        };
    },
    { pk: 0.4, corte: 7000 },
);
/** O Voltorb se encolhendo: um "fiuu" que desce. */
const encolhe = deslize(900, 380, 0.28);

export default function bancada() {
    const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2) + 1, swing: 0.06, tail: 2.5 });
    const R = (s) => s * 8;
    /** Uma nota em segundos exatos (fora da grade: os instantes da cena). */
    const N = (p, s, m = 0, d = 1, v = 1) => p.note(R(s), m, d, v);

    const lead = S.part('lead', I.brass, {
        pan: 0.1,
        gain: 0.75,
        corte: 3600,
        echo: { rows: 3, fb: 0.22, mix: 0.18 },
        rev: 0.12,
    });
    const leadP = S.part('lead-pulso', I.pulse, { pan: -0.1, gain: 0.3, corte: 3000 });
    const met = S.part('metais', I.brass, { pan: -0.25, gain: 0.45, corte: 3000, rev: 0.15 });
    const ep = S.part('piano', I.epiano, { pan: -0.2, gain: 0.7, rev: 0.3 });
    const clav = S.part('clavinete', I.clav, { pan: 0.3, gain: 0.5, corte: 3200 });
    const bs = S.part('baixo', I.slap, { gain: 0.58, corte: 2600 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.42, corte: 1800 });
    const pz = S.part('pizz', I.pizz, { pan: -0.2, gain: 0.45, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: 0.15, gain: 0.5, rev: 0.35 });
    const sino = S.part('sino', I.bell, { pan: 0.2, gain: 1.0, rev: 0.3 });
    const tel = S.part('telefone', telefone, { drum: true, pan: 0.3, gain: 0.55, rev: 0.15 });
    const ris = S.part('riser', sobe(2), { drum: true, gain: 0.35 });
    const ris1 = S.part('riser1', sobe(1), { drum: true, gain: 0.3 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.42 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.45 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.9 });
    const oh = S.part('chimbal-aberto', I.ohat, { drum: true, pan: 0.3, gain: 0.9 });
    const sk = S.part('shaker', I.shaker, { drum: true, pan: -0.2, gain: 1.2 });
    const ag = S.part('agogo', I.agogo, { pan: -0.3, gain: 0.5 });
    const tq = S.part('tique', I.block, { pan: 0.15, gain: 1.2 });
    const tokE = S.part('tok-esq', I.block, { pan: -0.6, gain: 0.55 });
    const tokD = S.part('tok-dir', I.block, { pan: 0.6, gain: 0.55 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.3 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.14 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.7,
        rev: 0.15,
    });
    const torc = S.part('torcida', I.palmas, { drum: true, gain: 0.35, pan: 0.1, rev: 0.2 });
    const pr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const moeda = S.part('moedas', I.coin, { drum: true, pan: 0.25, gain: 0.8, rev: 0.15 });
    const pl = S.part('plim', plimSino, { drum: true, pan: 0.15, gain: 0.5, rev: 0.2 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.3, pan: -0.1, rev: 0.1 });
    const vr = S.part('varrida', varrida, { drum: true, gain: 0.5, rev: 0.2 });
    const rs = S.part('rasga', rasga, { drum: true, gain: 0.6, pan: 0.1, rev: 0.12 });
    const ch = S.part('chiado', chiado, { drum: true, gain: 0.45, pan: 0.05 });
    const enc = S.part('encolhe', encolhe, { drum: true, gain: 0.35 });
    const zp = S.part('faisca', zap, { drum: true, gain: 0.3, pan: 0.2, rev: 0.1 });
    const pe = S.part('chute', chute, { drum: true, gain: 0.8 });
    const boom = S.part('kaboom', kaboom, { drum: true, gain: 1.5, rev: 0.25 });

    const fa = thirdBelow(MAJOR(5));

    // a cama de cada bloco começa no corte e para no próximo: as faixas do groove cortam as notas fora de [t0, t1)
    let LIM = [0, Number.POSITIVE_INFINITY];
    for (const p of [kk, sn, hh, oh, sk, bs, ep, clav, ag, tuba, pz, tq, cl]) {
        const n0 = p.note;
        p.note = (t, ...a) => {
            if (t / 8 < LIM[0] - 1e-6 || t / 8 >= LIM[1] - 1e-6) return;
            n0(t, ...a);
        };
    }
    /** O groove da bancada (o fundo de fala do esboço C): contido, o slap andando, o piano em contratempo. */
    const estudio = (b, c) => {
        drum(kk, b, 1, 'X.....x...X.....', { vel: 0.55 });
        drum(sn, b, 1, '....x.......x..o', { vel: 0.45 });
        drum(hh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.28 });
        bass(bs, b, c, '0:1 r:1 8:1 0:1 r:1 5:1 s:1 8:1 r:1 0:1 3:1 5:1 r:1 s:1 8:1 5:1', { vel: 0.6 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [11, 3],
            ],
            { low: 55, n: 4, vel: 0.35 },
        );
    };
    /** A cor de rua (AO VIVO): partido-alto no chimbal, clavinete no contratempo, agogô, o slap mais solto. */
    const rua = (b, c) => {
        drum(kk, b, 1, 'X.....x...X..x..', { vel: 0.6 });
        drum(sn, b, 1, '....x..o....x...', { vel: 0.45 });
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.28 });
        bass(bs, b, c, '0:2 r:1 0:1 8:1 r:1 5:2 0:1 r:1 s:2 8:1 5:1 3:2', { vel: 0.62 });
        stabs(clav, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: 0.5 });
        mel(ag, b, ['G5:2 r:1 D5:1 r:2 D5:2 G5:2 r:1 D5:1 r:2 D5:2'], { vel: 0.5 });
    };
    /** O vestiário: magro e cômico, a tuba no tempo, pizzicato no 2 e no 4 e o tique de relógio. */
    const comico = (b, c) => {
        bass(tuba, b, c, '0:3 r:1 l:3 r:1 0:3 r:1 l:2 c:2', { vel: 0.6 });
        stabs(pz, b, c, [4, 12], { low: 60, n: 3, vel: 0.55 });
        mel(tq, b, ['F#6:4 C#6:4 F#6:4 C#6:4'], { vel: 0.4 });
    };
    /** VEM AÍ depois da subida: bumbo reto, chimbal aberto, shaker, o clap do 808 no 2 e no 4. */
    const reto = (b, c) => {
        drum(kk, b, 1, 'X...X...X...X...', { vel: 0.62 });
        drum(oh, b, 1, '..x...x...x...x.', { vel: 0.36 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.42 });
        drum(sk, b, 1, 'xxXxxxXxxxXxxxXx', { vel: 0.36 });
        bass(bs, b, c, '0:2 8:1 0:1 r:2 5:2 0:2 8:1 0:1 r:2 s:2', { vel: 0.66 });
        stabs(
            ep,
            b,
            c,
            [
                [2, 2],
                [6, 2],
                [10, 2],
                [14, 2],
            ],
            { low: 55, n: 4, vel: 0.33 },
        );
    };
    /** A cama de t0 a t1 (s): um compasso por acorde, em roda; cordas baixinhas por baixo. */
    const cama = (t, t1, modo, acordes, { cordas = 0.2 } = {}) => {
        const t0 = Math.ceil(t * 2 - 1e-6) / 2; // o groove entra na batida
        LIM = [t0, t1];
        for (let k = 0; t0 + 2 * k < t1 - 0.01; k++) {
            const c = acordes[k % acordes.length];
            modo(t0 / 2 + k, c);
            if (cordas)
                padChord(cor, 0, c, Math.min(16, R(t1 - t0 - 2 * k)), {
                    low: 60,
                    n: 3,
                    vel: cordas,
                    at: R(t0 + 2 * k),
                });
        }
        LIM = [0, Number.POSITIVE_INFINITY];
    };
    /** Manchete nova: prato, bumbo e um acorde curto dos metais com o piano. */
    const manchete = (s, sym) => {
        N(pr, s, 0, 0, 0.55);
        N(kk, s, 0, 0, 0.9);
        stabs(met, 0, sym, [[R(s), 2]], { low: 60, n: 4, vel: 0.6 });
    };
    /** O pavio do Voltorb: 4 plins subindo e acelerando, a gota caindo. */
    const pavio = (t) => {
        for (const [k, d] of [0, 0.3, 0.52, 0.68].entries()) N(sino, t + d, 96 + 3 * k, 1, 0.35 + 0.08 * k);
        N(tm, t + 0.68, 7, 0, 0.3);
        N(sino, t + 0.95, 84, 2, 0.3);
        N(sino, t + 1.05, 79, 2, 0.25);
    };

    // ===================== 0–2 · GANCHO: tensão no pedal de Si♭ =====================
    // o Voltorb de colete no banco; um golpe grave no 0, o baixo pulsando, o chimbal chiando como pavio e o tímpano
    // crescendo até cortar seco no 2 (o telefone)
    N(pr, 0, 0, 0, 0.7);
    N(kk, 0, 0, 0, 1);
    stabs(met, 0, 'Bb7sus4', [[0, 3]], { low: 46, n: 4, vel: 0.7 });
    for (let i = 0; i < 16; i += 2) bs.note(i, 34, 1, 0.45 + 0.02 * i);
    padChord(cor, 0, 'Bb7sus4', 15, { low: 58, n: 4, vel: 0.35 });
    for (let i = 4; i < 16; i++) hh.note(i, 0, 0, 0.12 + 0.025 * i);
    pavio(M.voltorbReage[0]);
    drum(tp, 0, 1, '..........x.xxXX', { vel: 0.55 });

    // ===================== 2–4,5 · VINHETA C: o telefone toca, a cartinha gira, o logo monta =====================
    {
        const v = M.vinheta;
        N(tel, v, 0, 0, 1);
        // a cartinha gira cada vez mais rápido (720° em power2.in a partir de +0,2): um tom em cada meia volta
        ris1.note(R(v + 0.25), 0, 0, 0.7);
        for (const [k, u] of [1, 2, 3, 4].map((h) => Math.sqrt(h / 4)).entries())
            N(tm, v + 0.2 + u, [0, 3, 5, 8][k], 0, 0.45 + 0.1 * k);
        for (let i = 0; i < 6; i++) N(sn, v + 0.95 + i * 0.05, 0, 0, 0.2 + 0.07 * i);
        // de lado ela vira a placa do logo (+1,28): impacto, o acorde e a cabeça do tema subindo até o #1 (+1,85)
        const logo = v + 1.28;
        N(pr, logo, 0, 0, 1);
        N(kk, logo, 0, 0, 1);
        N(tp, logo, 0, 0, 0.9);
        stabs(met, 0, 'Ebmaj7', [[R(logo), 3]], { low: 58, n: 4, vel: 0.8 });
        stabs(ep, 0, 'Ebmaj7', [[R(logo), 4]], { low: 55, n: 4, vel: 0.6 });
        padChord(cor, 0, 'Ebmaj7', 10, { low: 58, n: 4, vel: 0.5, at: R(logo) });
        bs.note(R(logo), 39, 2, 0.85);
        for (const [k, m] of [75, 79, 82, 84].entries()) {
            N(lead, logo + 0.02 + 0.13 * k, m, 1, 0.85);
            N(leadP, logo + 0.02 + 0.13 * k, m, 1, 0.8);
        }
        const n1 = v + 1.85;
        N(lead, n1, 87, 4, 1.1);
        N(leadP, n1, 87, 4, 0.9);
        N(met, n1, 82, 4, 0.6);
        N(kk, n1, 0, 0, 0.9);
        N(cl, n1, 0, 0, 0.5);
        N(pr, n1, 0, 0, 0.5);
        // o baixo puxa pra bancada (Si♭ Dó Ré → Mi♭ no 4,5)
        for (const [k, m] of [34, 36, 38].entries()) N(bs, v + 2.125 + 0.125 * k, m, 1, 0.75);
    }

    // ===================== ABERTURA (falas 1–3): o groove da bancada =====================
    cama(M.abertura, M.bDupla, estudio, ['Ebmaj7', 'Cm9', 'Abmaj7', 'Bb7sus4']);
    manchete(M.abertura, 'Ebmaj7');
    // pergunta e resposta nos vãos da caixa: o telefone toca depois da f1, o lead atende depois da f2
    N(tel, F.f1.paginas[0].fim + 0.4, 0, 0, 0.35);
    mel(lead, (F.f2.paginas[0].fim + 0.375) / 2, ['F5:1 G5:1 Bb5:2 r:12'], { vel: 0.6 });
    // "Hoje": o selo da versão carimba duas vezes (0.9.51 e + 0.9.52)
    for (const [k, t] of [M.ver51, M.ver52].entries()) {
        N(tm, t, k * 3, 0, 0.35);
        N(sino, t, 94 + k * 3, 2, 0.35);
    }

    // BEAT bDupla: a bateria sai; a dupla se olha e acena duas vezes (dois "tum" do piano e dos metais)
    for (const [k, d] of [0.42, 0.72].entries()) {
        const c = ['Abmaj7', 'Bb7sus4'][k];
        stabs(met, 0, c, [[R(M.bDupla + d), 1.5]], { low: 58, n: 4, vel: 0.45 });
        stabs(ep, 0, c, [[R(M.bDupla + d), 2]], { low: 55, n: 4, vel: 0.4 });
        N(bs, M.bDupla + d, [44, 46][k], 1.5, 0.6);
    }

    // ===================== ESCALADA: uma batida por cartela =====================
    {
        const e = M.escalada;
        N(pr, e, 0, 0, 0.8);
        N(kk, e, 0, 0, 1);
        stabs(met, 0, 'Ebmaj7', [[R(e), 2]], { low: 58, n: 4, vel: 0.7 });
        for (let i = 0; i < 4; i++) N(leadP, e + i * 0.0625, [63, 67, 70, 75][i], 0.5, 0.5);
        LIM = [CARTELAS[0], M.bCartas];
        drum(hh, CARTELAS[0] / 2, 3, 'x.x.x.x.x.x.x.x.', { vel: 0.3 });
        drum(sk, CARTELAS[0] / 2, 3, 'xxXxxxXxxxXxxxXx', { vel: 0.25 });
        LIM = [0, Number.POSITIVE_INFINITY];
        const ACO = ['Ebmaj7', 'Cm9', 'Abmaj7', 'Bb7sus4'];
        CARTELAS.forEach((s, k) => {
            N(kk, s, 0, 0, 1);
            N(tp, s, 0, 0, 0.8);
            stabs(met, 0, ACO[k], [[R(s), 2]], { low: 58, n: 4, vel: 0.65 });
            stabs(ep, 0, ACO[k], [[R(s), 6]], { low: 55, n: 4, vel: 0.4 });
            N(bs, s, [39, 36, 32, 34][k], 6, 0.65);
            // a cabeça do tema (arpejo subindo), um degrau acima a cada cartela
            const sh = [0, 2, 4, 5][k];
            for (const [i, m] of [75, 79, 82].entries()) {
                N(lead, s + 0.125 * i, m + sh, 1, 0.7);
                N(leadP, s + 0.125 * i, m + sh, 1, 0.6);
            }
        });
        // a 4ª ("E mais"): as cordas abrem e o lead pergunta
        padChord(cor, 0, 'Bb7sus4', 9, { low: 58, n: 4, vel: 0.45, at: R(CARTELAS[3]) });
        mel(lead, (CARTELAS[3] + 0.5) / 2, ['r:2 C6:1 Bb5:1 Eb6:4 r:8'], { vel: 0.55 });
    }

    // BEAT bCartas: 3 cartas viradas caem no telão (um baque e uma nota do piano cada, subindo pelo Mi♭)
    for (const [k, d] of [0.42, 0.54, 0.66].entries()) {
        N(tm, M.bCartas + d, 2 + 3 * k, 0, 0.35);
        N(ep, M.bCartas + d, [70, 75, 79][k], 3, 0.6);
        N(sino, M.bCartas + d, [82, 87, 91][k], 2, 0.3);
    }
    N(bs, M.plantao - 0.25, 34, 1, 0.6);

    // ===================== PLANTÃO (falas 4–6) =====================
    cama(M.plantao, M.bRua, estudio, ['Abmaj7', 'Bb7sus4', 'Gm7', 'Cm9']);
    manchete(M.plantao, 'Abmaj7');
    // as 3 opções da recompensa ("bwoop" subindo) e o holofote na Charanga
    for (const [k, s] of M.deal.entries()) N(ap, s, k * 3, 0, 0.8);
    N(sino, M.holofote, 94, 3, 0.45);
    N(sino, M.holofote + 0.125, 99, 3, 0.4);
    // os 4 troféus que acendem e a carta do Patrocínio
    for (const [k, m] of [87, 91, 94, 99].entries()) N(sino, M.trofeus[k], m, 3, 0.6);
    N(ap, M.patro, 5, 0, 0.9);
    // o lead responde no vão da f5
    mel(lead, (F.f5.paginas[0].fim + 0.55) / 2, ['Bb5:1 C6:1 Eb6:2 D6:1 Bb5:1 r:10'], { vel: 0.55 });
    // as 6 barras +4 do bônus
    for (const [k, s] of M.mais4.entries()) N(sino, s, [75, 77, 79, 80, 82, 84][k] + 12, 1, 0.35);

    // BEAT bRua: a bateria sai; o telão chia (6 degraus) e abre na Rota (estalo e o plim), o Meowth acena (o agogô
    // e o slap escorregando pra rua)
    N(ch, M.bRua + 0.05, 0, 0, 1);
    N(pl, M.bRua + 0.45, -5, 0, 0.6);
    N(ag, M.bRua + 0.55, 79, 1, 0.6);
    N(ag, M.bRua + 0.68, 74, 1, 0.5);
    for (const [k, m] of [36, 39, 41, 43].entries()) N(bs, M.bRua + 0.75 + 0.125 * k, m, 1, 0.65);
    stabs(clav, 0, 'Cm7', [[R(M.aovivo - 0.25), 1]], { low: 60, n: 3, vel: 0.6 });

    // ===================== AO VIVO com o Meowth (falas 8–11): a cor de rua =====================
    cama(M.aovivo, M.payFim, rua, ['Cm7', 'F7'], { cordas: 0 });
    manchete(M.aovivo, 'Cm9');
    // o lick de rua (o arpejo do tema em Dó menor) no vão da f8
    mel(clav, (F.f8.paginas[0].fim + 0.575) / 2, ['C5:1 Eb5:1 G5:1 Bb5:2 G5:1 r:10'], { vel: 0.7 });
    mel(lead, (F.f8.paginas[0].fim + 0.575) / 2, ['C5:1 Eb5:1 G5:1 Bb5:2 G5:1 r:10'], { vel: 0.5 });
    // o corte pra Rota em tela cheia: a torcida bate palma
    drum(torc, M.cheia / 2, 1, '....x.......x.x.', { vel: 0.6 });
    // cada vitória é um ka-ching e o contador sobe 3 → 6 → 9
    for (const [k, s] of M.vitorias.entries()) {
        N(moeda, s, 24 + k * 2, 0, 0.55);
        N(moeda, s + 0.125, 31 + k * 2, 0, 0.55);
    }
    // PAY DAY: os metais no pulo; as 14 moedas descem a escala
    stabs(met, 0, 'F7', [[R(M.payday), 2]], { low: 58, n: 4, vel: 0.7 });
    N(sino, M.payday + 0.15, 99, 2, 0.5);
    for (const [k, s] of M.moedas.entries()) N(moeda, s, 31 - Math.round(k * 1.6), 0, 0.55 - k * 0.015);
    // BEAT payFim: as moedas assentam e respondem no 3-3-2 (com as palmas), e o ka-ching na pose
    for (const [k, d] of [0, 0.375, 0.75].entries()) {
        N(moeda, M.payFim + d, [24, 27, 31][k], 0, 0.75);
        N(cl, M.payFim + d, 0, 0, 0.45);
        N(bs, M.payFim + d, [36, 39, 43][k], 1, 0.55);
    }
    stabs(clav, 0, 'Cm7', [[R(M.payFim + 0.75), 2]], { low: 60, n: 3, vel: 0.6 });

    // ===================== VESTIÁRIO: cômico, menos instrumentos =====================
    cama(M.vestiario, M.reacao, comico, ['Cm', 'G7'], { cordas: 0 });
    manchete(M.vestiario, 'Cm7');
    N(pe, M.kaboom - 1.4, 0, 0, 1);
    N(boom, M.kaboom, 0, 0, 1);
    padChord(cor, 0, 'Cm', 12, { low: 48, n: 3, vel: 0.3, at: R(M.kaboom + 0.4) });
    // a reação sem graça do Raichu: tudo para; a gota (o plim) e a tuba "uá-uá" descendo
    N(pl, M.reacao + 0.15, -2, 0, 0.5);
    for (const [k, m] of [43, 42, 41, 40].entries()) N(tuba, M.reacao + 0.3 + 0.16 * k, m, k === 3 ? 3 : 1.2, 0.45);
    // de volta à bancada com o Psyduck: o vestiário continua magro
    cama(M.vestCena, M.bVoltorb, comico, ['Ab', 'G7', 'Cm', 'G7'], { cordas: 0 });
    // "Agora ele é reserva.": a tuba murcha
    const res = F.f14.paginas[0].chars[F.f14.paginas[0].texto.indexOf('reserva')];
    N(tuba, res + 0.6, 36, 2, 0.5);
    N(tuba, res + 0.85, 31, 3, 0.45);

    // BEAT bVoltorb: o Voltorb sozinho no banco; cada gesto um som pequeno
    {
        const G = M.gag;
        N(sino, G.pisca, 103, 0.5, 0.35); // pisca
        N(sino, G.pisca + 0.1, 103, 0.5, 0.25);
        N(enc, G.encolhe, 0, 0, 0.8); // se encolhe
        N(zp, G.faisca, 4, 0, 0.7); // a faísca
        N(sino, G.faisca + 0.05, 106, 1, 0.25);
        N(tokE, G.olha[0], 72, 1, 0.6); // olha pra um lado...
        N(tokD, G.olha[1], 77, 1, 0.6); // ...e pro outro
        N(ap, G.volta, -3, 0, 0.45); // volta
        N(pz, G.volta + 0.25, 63, 1, 0.4);
    }

    // ===================== VEM AÍ (falas 15–17): a subida de tom =====================
    const SOBE = F.f16.paginas[0].fim + 0.075; // a caixa terminou de digitar a f16: a subida começa
    const UP = Math.ceil(F.f17.s * 2) / 2; // o tom novo, na batida da f17
    cama(M.vemai, SOBE, estudio, ['Ebmaj7', 'Abmaj7', 'Fm9', 'Bb7sus4']);
    manchete(M.vemai, 'Ebmaj7');
    // uma nota de sino por sexta do calendário
    for (const [k, s] of M.sextas.entries()) N(sino, s, [87, 91, 94, 99][k], 2, 0.5);
    // o 27/11 vira Time Ultimate
    N(kk, M.ultimate, 0, 0, 0.8);
    N(pr, M.ultimate, 0, 0, 0.5);
    N(sino, M.ultimate, 94, 3, 0.5);
    stabs(met, 0, 'Bb7sus4', [[R(M.ultimate), 3]], { low: 58, n: 4, vel: 0.5 });
    // o baixo sobe pelo cromático (Si♭ → Mi) até o Fá, o telefone toca, a caixa rufa e o riser leva tudo um tom acima
    {
        const t = SOBE;
        const passo = (UP - t) / 7;
        for (let k = 0; k < 7; k++) N(bs, t + k * passo, 34 + k, 1, 0.7 + 0.03 * k);
        N(tel, t + 0.05, 2, 0, 0.6);
        padChord(cor, 0, 'C7sus4', R(UP - t), { low: 58, n: 4, vel: 0.4, at: R(t) });
        stabs(
            ep,
            0,
            'C7sus4',
            [
                [R(t), 2],
                [R(t + 0.5), 2],
                [R(t + 1.0), 2],
            ],
            { low: 55, n: 4, vel: 0.4 },
        );
        N(ris, UP - 2, 0, 0, 0.8);
        for (let s = t + 0.5; s < UP - 0.01; s += 0.0625) N(sn, s, 0, 0, 0.15 + 0.5 * ((s - t) / (UP - t)) ** 2);
        for (const [k, p] of [7, 4, 2, 0].entries()) N(tm, UP - 0.25 + 0.0625 * k, p, 0, 0.55);
    }
    // f17 em Fá maior, bumbo reto
    cama(UP, B.bRola.s, reto, ['Bbmaj7', 'C7sus4', 'Dm7', 'C7sus4'], { cordas: 0.28 });
    N(pr, UP, 0, 0, 1);
    // o pacote: cai, treme, rasga e as cartas saem
    const P = M.pacote;
    N(tm, P.cai + 0.125, 0, 0, 0.45);
    for (let k = 0; k < 4; k++) N(sk, P.treme + k * 0.06, 0, 0, 0.5);
    N(rs, P.rasga, 0, 0, 0.7);
    for (const [k, s] of P.sai.entries()) N(ap, s, 2 + k, 0, 0.35);
    // o SOC-CER-MON com as palmas no vão entre as páginas: as palmas respondem no 68,5 e no Mewtwo (68,75)
    const gancho = GANCHO.em({ tom: 5 });
    const gb = F.f17.paginas[0].fim / 2;
    mel(lead, gb, [gancho], { vel: 0.95 });
    mel(leadP, gb, [gancho], { vel: 0.8 });
    mel(met, gb, [gancho], { harm: fa, vel: 0.6 });
    drum(cl, gb, 1, GANCHO.palmas, { vel: 0.9 });
    // as cartas viram (Fá Lá Dó Fá) e o Mewtwo: prato e o tema inteiro em Fá, com segunda voz
    for (const [k, s] of P.vira.entries()) N(sino, s, [77, 81, 84, 89][k], 1, 0.5);
    N(pr, P.mewtwo, 0, 0, 1);
    N(kk, P.mewtwo, 0, 0, 1);
    mel(lead, P.mewtwo / 2, [TEMA], { shift: 2, vel: 0.95 });
    mel(leadP, P.mewtwo / 2, [TEMA], { shift: 2, vel: 0.85 });
    mel(met, P.mewtwo / 2, [TEMA], { shift: 2, harm: fa, vel: 0.55 });

    // BEAT bRola: a bateria sai; o Voltorb entra rolando (toms em giro que freiam), o "tum" quando para e a piscada
    {
        const t0 = B.bRola.s + 0.2;
        for (let k = 0; k < 8; k++) N(tm, t0 + 0.6 * (1 - (1 - k / 8) ** 0.5), [12, 9, 12, 7, 10, 5, 8, 3][k], 0, 0.3);
        N(kk, B.bRola.s + 0.8, 0, 0, 0.7);
        N(tm, B.bRola.s + 0.8, -3, 0, 0.5);
        N(sino, B.bRola.s + 1.0, 101, 0.5, 0.35);
        padChord(cor, 0, 'C7sus4', R(M.fecha - B.bRola.s), { low: 58, n: 4, vel: 0.35, at: R(B.bRola.s) });
        N(bs, M.fecha - 0.25, 36, 1, 0.6);
    }

    // ===================== PRA FECHAR (falas 18–20), em Fá =====================
    cama(M.fecha, B.bRisada.s, estudio, ['Fmaj7', 'Dm9', 'Bbmaj7', 'C7sus4']);
    manchete(M.fecha, 'Fmaj7');
    pavio(M.voltorbReage[2]);
    N(pl, M.bem + 0.1, 5, 0, 0.45);
    // BEAT bRisada: a dupla ri (três "ha" dos metais descendo, no balanço dos dois) e o Voltorb pisca
    for (const [k, d] of [0.31, 0.545, 0.785].entries()) {
        stabs(met, 0, ['F', 'Dm', 'Bb'][k], [[R(B.bRisada.s + d), 1]], { low: 62 - 2 * k, n: 3, vel: 0.55 - 0.08 * k });
        N(pz, B.bRisada.s + d, [72, 69, 65][k], 1, 0.4);
    }
    N(sino, B.bRisada.s + 0.55, 101, 0.5, 0.3);
    cama(F.f19.s, M.final, estudio, ['Fmaj7', 'Dm9', 'Bbmaj7', 'C7sus4', 'Fmaj7']);
    // o "boa noite" do Raichu: um brilho
    N(sino, M.boaNoite, 96, 4, 0.4);
    // o tema volta inteiro depois que a caixa termina de digitar, com os metais respondendo
    const TEMA_FIM = Math.ceil((F.f19.paginas[0].fim - 0.1) * 2) / 2;
    {
        const t = TEMA_FIM;
        mel(lead, t / 2, [TEMA], { shift: 2, vel: 0.9 });
        mel(leadP, t / 2, [TEMA], { shift: 2, vel: 0.8 });
        mel(met, t / 2, [TEMA], { shift: 2, harm: fa, vel: 0.5 });
    }
    // "TEMOS QUE CHUTAR!": um golpe no pulo (Dó) e o "TAR" no Fá com prato
    N(kk, M.grito[0], 0, 0, 0.9);
    stabs(met, 0, 'C7sus4', [[R(M.grito[0]), 1]], { low: 60, n: 4, vel: 0.7 });
    N(lead, M.grito[0], 84, 1, 0.8);
    N(kk, M.grito[1], 0, 0, 1);
    N(pr, M.grito[1], 0, 0, 0.9);
    stabs(met, 0, 'F', [[R(M.grito[1]), 4]], { low: 60, n: 4, vel: 0.8 });
    N(lead, M.grito[1], 89, 4, 0.9);
    N(ris, M.final - 2, 0, 0, 0.6);
    drum(sn, (M.final - 2) / 2, 1, '............xxXX', { vel: 0.55 });

    // ===================== TELA FINAL: o SOC-CER-MON, o acorde e o telefone =====================
    {
        const t0 = M.final;
        N(pr, t0, 0, 0, 0.9);
        N(kk, t0, 0, 0, 1);
        mel(lead, t0 / 2, [gancho], { vel: 1 });
        mel(leadP, t0 / 2, [gancho], { vel: 0.85 });
        mel(met, t0 / 2, [gancho], { harm: fa, vel: 0.65 });
        drum(cl, t0 / 2 - 0.125, 1, GANCHO.palmas, { vel: 0.9 }); // as palmas em +1,25 e +1,5
        drum(torc, t0 / 2 - 0.125, 1, GANCHO.palmas, { vel: 0.6 });
        LIM = [t0, t0 + 1.5];
        drum(kk, t0 / 2, 1, 'X.....x.X.....x.', { vel: 0.7 });
        drum(hh, t0 / 2, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.3 });
        bass(bs, t0 / 2, 'Bbmaj7', '0:3 r:1 5:2 0:2 r:1 0:1 5:2 s:2 8:2', { vel: 0.7 });
        LIM = [0, Number.POSITIVE_INFINITY];
        padChord(cor, 0, 'Bbmaj7', 12, { low: 58, n: 4, vel: 0.4, at: R(t0) });
        // o acorde final na faísca (+1,5), curto e com a sala soando
        const fim = t0 + 1.5;
        N(pr, fim, 0, 0, 1);
        N(kk, fim, 0, 0, 1);
        stabs(met, 0, 'Fmaj7', [[R(fim), 3]], { low: 60, n: 4, vel: 0.85 });
        stabs(ep, 0, 'Fmaj7', [[R(fim), 6]], { low: 55, n: 4, vel: 0.6 });
        padChord(cor, 0, 'Fmaj7', 6, { low: 58, n: 4, vel: 0.5, at: R(fim) });
        N(bs, fim, 29, 4, 0.9);
        N(lead, fim, 89, 3, 0.8);
        if (TELEFONE_NO_FIM) N(tel, fim + 0.6, 0, 0, 0.75);
    }

    // as 2 varridas com a cartinha (o pico do "fuuuh" no corte) e o whoosh curto nos outros cortes
    for (const s of VARRIDAS) N(vr, s - 0.2, 0, 0, 0.9);
    for (const s of CORTES) if (!VARRIDAS.includes(s)) N(vr, s - 0.16, 5, 0, 0.3);

    // a banda abaixa 3 dB enquanto a caixa digita (os blips ficam audíveis por cima, baixinhos) e mais 2 dB debaixo das
    // falas inteiras (o groove é mais cheio que o da v9; assim os beats sem texto e os temas sobressaem), menos onde o
    // tema toca: o SOC-CER-MON e o Mewtwo na f17 e o tema inteiro na f19
    const janela = (t, a, z, sobe, desce) =>
        Math.min(1, Math.max(0, (t - a) / sobe)) * Math.min(1, Math.max(0, (z - t) / desce));
    const DIGITANDO = FALAS.flatMap((f) => f.paginas.map((p) => [p.ini - 0.05, p.fim + 0.1]));
    const TEMAS = [
        [gb * 2, P.mewtwo + 2],
        [TEMA_FIM, TEMA_FIM + 2],
    ];
    const DK = Float32Array.from({ length: Math.ceil(FIM * 1000) + 3000 }, (_, i) => {
        const t = i / 1000;
        const fala = FALAS.reduce((g, f) => Math.max(g, janela(t, f.s + 0.1, f.z, 0.15, 0.15)), 0);
        const tema = TEMAS.reduce((g, [a, z]) => Math.max(g, janela(t, a - 0.1, z, 0.1, 0.2)), 0);
        const g0 = 1 - 0.21 * fala * (1 - tema);
        return DIGITANDO.reduce((g, [a, z]) => g * (1 - 0.3 * janela(t, a, z, 0.08, 0.25)), g0);
    });
    const duck = (t) => DK[Math.min(DK.length - 1, Math.max(0, Math.round(t * 1000)))];
    for (const p of S.parts) {
        const g0 = p.gainAt;
        p.gainAt = g0 ? (t) => g0(t) * duck(t) : duck;
    }
    return S;
}
