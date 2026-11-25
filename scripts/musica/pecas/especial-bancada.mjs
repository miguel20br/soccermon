// Soccermon News: edição especial Time Ultimate (25/11/2026): a trilha do News #2 (news2-bancada.mjs) remontada na linha
// do tempo da edição especial (trailer/curtas/news-especial/linha.mjs). Gancho: o pacote rasgando e o clarão dourado do
// walkout; Loja no AO VIVO com a gag do Magikarp (a tuba); os líderes com uma nota por insígnia; VEM AÍ com sininhos de
// Natal; tela final curta (2,4 s) sem o telefone.
// Base: Soccermon News #1 v11 (16/11/2026; o gancho de 2,5 s, o plim de jornal em cada bloco e os papéis batendo na mesa no
// encerramento): a trilha inteira, sobre o esboço C aprovado (news-esboco-c.mjs, "bancada
// jazz-fusion" no jeito do Sonic Mania). O Miguel escolheu a música C e a vinheta C (a cartinha girando e virando o
// logo). Lê a linha do tempo de trailer/curtas/news-01/linha.mjs: cada bloco, fala e beat sem texto cai no mesmo
// instante da cena.
// Mi♭ maior, 120 BPM, compasso = 2 s (linha = 1/8 s), swing leve (0,06). O telefone da redação é a pergunta, a bancada
// responde com o tema. A história:
//   gancho (0–2,5): tensão no pedal de Si♭ com o pavio do Voltorb (plins subindo, chimbal chiando, tímpano);
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
import { LINHA } from '../../../trailer/curtas/news-especial/linha.mjs';
import { aparece, plim as plimSino, rasga, sobe, varrida } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { som } from './livre-ginasio.mjs';
import { telefone } from './news-esboco-c.mjs';

export const meta = {
    titulo: 'Soccermon News: edição especial',
    tela: 'Soccermon News edição especial Time Ultimate (vídeo)',
};

/** Fecha no acorde e o telefone toca uma última vez (a piada); false = só o acorde. */
export const TELEFONE_NO_FIM = false; // a tela final tem 2,4 s: o telefone ficaria cortado

const { M, FALAS, FIM, CARTELAS, VARRIDAS, CORTES } = LINHA;
const F = Object.fromEntries(FALAS.map((f) => [f.id, f]));

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

export default function especial() {
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
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.3 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.14 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.7,
        rev: 0.15,
    });
    const pr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const moeda = S.part('moedas', I.coin, { drum: true, pan: 0.25, gain: 0.8, rev: 0.15 });
    const pl = S.part('plim', plimSino, { drum: true, pan: 0.15, gain: 0.5, rev: 0.2 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.3, pan: -0.1, rev: 0.1 });
    const vr = S.part('varrida', varrida, { drum: true, gain: 0.5, rev: 0.2 });
    const rs = S.part('rasga', rasga, { drum: true, gain: 0.6, pan: 0.1, rev: 0.12 });
    const ch = S.part('chiado', chiado, { drum: true, gain: 0.45, pan: 0.05 });

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
        plimJornal(s);
    };
    /** v11: o plim do jornal, a assinatura da casa (~0,5 s) junto com a manchete de cada bloco: um "tan-tan" no sino
     *  (Si♭ → Mi♭, com a 5ª em cima) e o tímpano embaixo, na família do telefone da redação. */
    const plimJornal = (s) => {
        N(sino, s, 82, 1, 0.55);
        N(tp, s, 0, 0, 0.6);
        N(sino, s + 0.19, 87, 3, 0.7);
        N(sino, s + 0.19, 94, 3, 0.35);
        N(tp, s + 0.19, 0, 0, 0.85);
    };

    // ===================== 0–2 · GANCHO: o pacote rasga (0,2–0,5) e o clarão dourado do walkout (1,0) =====================
    {
        N(kk, 0, 0, 0, 0.9);
        stabs(met, 0, 'Bb7sus4', [[0, 3]], { low: 46, n: 4, vel: 0.6 });
        padChord(cor, 0, 'Bb7sus4', 7, { low: 58, n: 4, vel: 0.35 });
        for (let i = 0; i < 8; i += 2) bs.note(i, 34, 1, 0.5 + 0.05 * i);
        for (let i = 0; i < 8; i++) hh.note(i, 0, 0, 0.12 + 0.04 * i);
        N(rs, 0.22, 0, 0, 1);
        N(ap, 0.5, 5, 0, 0.8);
        N(ris1, 0.0, 0, 0, 0.5);
        // o walkout: prato, o acorde dourado e o arpejo de sino subindo com a nota da carta
        const w = 1.0;
        N(pr, w, 0, 0, 1);
        N(kk, w, 0, 0, 1);
        stabs(met, 0, 'Ebmaj7', [[R(w), 6]], { low: 58, n: 4, vel: 0.8 });
        padChord(cor, 0, 'Ebmaj7', 8, { low: 58, n: 4, vel: 0.5, at: R(w) });
        bs.note(R(w), 39, 6, 0.85);
        for (const [k, m] of [87, 91, 94, 99, 103].entries()) N(sino, w + 0.1 + 0.11 * k, m, 2, 0.4 + 0.05 * k);
        drum(tp, 0.5, 1, '............xxXX', { vel: 0.5 });
    }

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

    // ===================== ABERTURA (f1): o groove da bancada =====================
    cama(M.abertura, M.escalada, estudio, ['Ebmaj7', 'Cm9', 'Abmaj7', 'Bb7sus4']);
    manchete(M.abertura, 'Ebmaj7');
    // o adesivo TIME ULTIMATE carimba no telão e o "abriu" ganha um brilho
    N(tm, M.ut, 3, 0, 0.4);
    N(sino, M.ut, 94, 2, 0.4);
    N(sino, M.abriu, 99, 3, 0.35);
    N(tel, F.f1.paginas[0].fim + 0.35, 0, 0, 0.3);

    // ===================== ESCALADA: uma batida por cartela =====================
    {
        const e = M.escalada;
        N(pr, e, 0, 0, 0.8);
        N(kk, e, 0, 0, 1);
        stabs(met, 0, 'Ebmaj7', [[R(e), 2]], { low: 58, n: 4, vel: 0.7 });
        for (let i = 0; i < 4; i++) N(leadP, e + i * 0.0625, [63, 67, 70, 75][i], 0.5, 0.5);
        LIM = [CARTELAS[0], M.plantao];
        drum(hh, CARTELAS[0] / 2, 2, 'x.x.x.x.x.x.x.x.', { vel: 0.3 });
        drum(sk, CARTELAS[0] / 2, 2, 'xxXxxxXxxxXxxxXx', { vel: 0.25 });
        LIM = [0, Number.POSITIVE_INFINITY];
        const ACO = ['Ebmaj7', 'Cm9', 'Abmaj7', 'Bb7sus4'];
        CARTELAS.forEach((s, k) => {
            N(kk, s, 0, 0, 1);
            N(tp, s, 0, 0, 0.8);
            stabs(met, 0, ACO[k], [[R(s), 2]], { low: 58, n: 4, vel: 0.65 });
            stabs(ep, 0, ACO[k], [[R(s), 5]], { low: 55, n: 4, vel: 0.4 });
            N(bs, s, [39, 36, 32, 34][k], 5, 0.65);
            const sh = [0, 2, 4, 5][k];
            for (const [i, m] of [75, 79, 82].entries()) {
                N(lead, s + 0.125 * i, m + sh, 1, 0.7);
                N(leadP, s + 0.125 * i, m + sh, 1, 0.6);
            }
        });
        // a 4ª (o Natal): sininhos
        for (let k = 0; k < 4; k++) N(sino, CARTELAS[3] + 0.3 + 0.12 * k, [94, 99, 96, 103][k], 1, 0.3);
    }
    N(bs, M.plantao - 0.25, 34, 1, 0.6);

    // ===================== PLANTÃO (f4–f6) =====================
    cama(M.plantao, M.bChoro, estudio, ['Abmaj7', 'Bb7sus4', 'Gm7', 'Cm9']);
    manchete(M.plantao, 'Abmaj7');
    N(ap, M.clube, 3, 0, 0.8);
    N(sino, M.clube + 0.25, 94, 3, 0.4);
    // "mato": a pergunta do Machoke (dois plins subindo)
    N(pl, M.mato, 2, 0, 0.5);
    // "Não volta.": um "tan" dos metais
    stabs(met, 0, 'Abmaj7', [[R(M.naoVolta + 0.05), 2]], { low: 58, n: 4, vel: 0.5 });
    // BEAT bChoro: a bateria sai; as cordas abrem (o violino do choro), a lágrima (plim) e o abraço (o lead canta)
    padChord(cor, 0, 'Abmaj7', R(M.bRua - M.bChoro), { low: 60, n: 4, vel: 0.6, at: R(M.bChoro) });
    N(pl, M.lagrima, 7, 0, 0.45);
    mel(lead, M.abraco / 2, ['Eb6:3 D6:1 C6:2 Bb5:4 r:6'], { vel: 0.55 });
    N(bs, M.abraco, 32, 4, 0.55);

    // BEAT bRua: o telão chia e abre na Loja (estalo e plim), o slap escorrega pra rua
    N(ch, M.bRua + 0.05, 0, 0, 1);
    N(pl, M.bRua + 0.45, -5, 0, 0.6);
    for (const [k, m] of [36, 39, 41, 43].entries()) N(bs, M.bRua + 0.45 + 0.1 * k, m, 1, 0.65);
    stabs(clav, 0, 'Cm7', [[R(M.aovivo - 0.25), 1]], { low: 60, n: 3, vel: 0.6 });

    // ===================== AO VIVO da Loja (f8–f11): a cor de rua =====================
    cama(M.aovivo, M.bKarp1, rua, ['Cm7', 'F7'], { cordas: 0 });
    manchete(M.aovivo, 'Cm9');
    mel(clav, (F.f8.paginas[0].fim + 0.5) / 2, ['C5:1 Eb5:1 G5:1 Bb5:2 G5:1 r:10'], { vel: 0.7 });
    // BEAT bKarp1: a bateria sai; o pacote rasga, um clarão e a carta pousa... e é o Magikarp (a tuba)
    N(rs, M.bKarp1, 0, 0, 1);
    N(ap, M.karp1 - 0.1, 5, 0, 0.8);
    N(kk, M.karp1, 0, 0, 0.6);
    N(tuba, M.karp1 + 0.25, 40, 1.2, 0.45);
    N(tuba, M.karp1 + 0.5, 35, 3, 0.4);
    // f10 sem graça: só o tique e a tuba magra
    cama(F.f10.s, M.bKarp2, comico, ['Cm7', 'F7']);
    // BEAT bKarp2: o 2º pacote rasga, o 2º Magikarp pousa e o selo REPETIDA carimba (bumbo e a tuba descendo)
    N(rs, M.bKarp2, 0, 0, 0.9);
    N(kk, M.karp2, 0, 0, 0.6);
    N(kk, M.repetida, 0, 0, 1);
    N(sn, M.repetida, 0, 0, 0.7);
    N(pr, M.repetida, 0, 0, 0.4);
    for (const [k, m] of [41, 40, 39, 38].entries()) N(tuba, M.repetida + 0.15 + 0.14 * k, m, k === 3 ? 3 : 1.2, 0.45);
    // f11: o groove volta; "Fichas": a carta voa (whoosh) e as moedas
    cama(F.f11.s, M.materia, rua, ['Cm7', 'F7'], { cordas: 0 });
    N(vr, M.fichas - 0.1, 5, 0, 0.5);
    for (let k = 0; k < 3; k++) N(moeda, M.fichas + 0.15 + 0.12 * k, 0, 0, 0.7);

    // ===================== OS 8 LÍDERES (f12): uma nota por insígnia =====================
    cama(M.materia, M.vemai, estudio, ['Ebmaj7', 'Abmaj7', 'Fm9', 'Bb7sus4']);
    manchete(M.materia, 'Ebmaj7');
    for (const [k, s] of M.insig.entries()) N(sino, s, [87, 89, 91, 92, 94, 96, 98, 99][k], 1, 0.4);

    // ===================== VEM AÍ (f13): sininhos de Natal e a subida =====================
    cama(M.vemai, F.f14.s, estudio, ['Ebmaj7', 'Abmaj7', 'Fm9', 'Bb7sus4']);
    manchete(M.vemai, 'Ebmaj7');
    // sininhos de trenó (o shaker dobrado) e os sinos no "Natal" e no "gelo"
    LIM = [M.vemai, F.f14.s];
    drum(sk, Math.ceil(M.vemai * 2) / 4, 3, 'xxXxxxXxxxXxxxXx', { vel: 0.35 });
    LIM = [0, Number.POSITIVE_INFINITY];
    for (const [k, m] of [94, 99, 103].entries()) N(sino, M.natal + 0.11 * k, m, 2, 0.45);
    for (const [k, m] of [103, 99, 106].entries()) N(sino, M.gelo + 0.11 * k, m, 2, 0.45);
    // BEAT bNeve: a carta gira na neve (o arpejo de sino descendo)
    for (let k = 0; k < 5; k++) N(sino, M.bNeve + 0.1 * k, 106 - 3 * k, 1, 0.3);

    // ===================== BOA NOITE (f14) e a subida pra tela final =====================
    cama(F.f14.s, M.final, estudio, ['Fmaj7', 'Bb7sus4']);
    N(sino, M.boaNoite, 96, 4, 0.4);
    N(ris, M.final - 2, 0, 0, 0.6);
    drum(sn, (M.final - 2) / 2, 1, '............xxXX', { vel: 0.55 });

    // ===================== TELA FINAL (2,4 s): o SOC-CER-MON e o acorde =====================
    {
        const t0 = M.final;
        const gancho = GANCHO.em({ tom: 3 }); // em Mi♭
        N(pr, t0, 0, 0, 0.9);
        N(kk, t0, 0, 0, 1);
        mel(lead, t0 / 2, [gancho], { vel: 1 });
        mel(leadP, t0 / 2, [gancho], { vel: 0.85 });
        mel(met, t0 / 2, [gancho], { harm: thirdBelow(MAJOR(3)), vel: 0.65 });
        drum(cl, t0 / 2 - 0.125, 1, GANCHO.palmas, { vel: 0.9 });
        LIM = [t0, t0 + 1.5];
        drum(kk, t0 / 2, 1, 'X.....x.X.....x.', { vel: 0.7 });
        drum(hh, t0 / 2, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.3 });
        LIM = [0, Number.POSITIVE_INFINITY];
        const fim = t0 + 1.5;
        N(pr, fim, 0, 0, 1);
        N(kk, fim, 0, 0, 1);
        stabs(met, 0, 'Ebmaj7', [[R(fim), 3]], { low: 60, n: 4, vel: 0.85 });
        stabs(ep, 0, 'Ebmaj7', [[R(fim), 6]], { low: 55, n: 4, vel: 0.6 });
        padChord(cor, 0, 'Ebmaj7', 6, { low: 58, n: 4, vel: 0.5, at: R(fim) });
        N(bs, fim, 27, 4, 0.9);
        N(lead, fim, 87, 3, 0.8);
    }

    // as 2 varridas com a cartinha (o pico do "fuuuh" no corte) e o whoosh curto nos outros cortes
    for (const s of VARRIDAS) N(vr, s - 0.2, 0, 0, 0.9);
    for (const s of CORTES) if (!VARRIDAS.includes(s)) N(vr, s - 0.16, 5, 0, 0.3);

    // a banda abaixa 3 dB enquanto a caixa digita (os blips ficam audíveis por cima, baixinhos) e mais 2 dB debaixo das
    // falas inteiras (o groove é mais cheio que o da v9; assim os beats sem texto e os temas sobressaem), menos onde o
    // tema toca: o SOC-CER-MON no E MAIS e o tema inteiro na f19
    const janela = (t, a, z, sobe, desce) =>
        Math.min(1, Math.max(0, (t - a) / sobe)) * Math.min(1, Math.max(0, (z - t) / desce));
    const DIGITANDO = FALAS.flatMap((f) => f.paginas.map((p) => [p.ini - 0.05, p.fim + 0.1]));
    const TEMAS = [[M.final, FIM]];
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
