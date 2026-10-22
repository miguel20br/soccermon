// Trailer 2 com a Abertura (teste, 22/10/2026). Pedido do Miguel: trocar o Trainer Battle Remix por um tema nosso, a
// Abertura com gancho misturada com música de batalha, composta em cima do corte do trailer 2 v3 (sem mexer no corte).
// Grade do trailer: 178 BPM, compasso 1,3483 s. O compasso 1 começa na batida B0 do vídeo (6,408 s); o compasso 0 é a
// anacruse depois do apito (o arquivo entra em 5,060 s do vídeo). O vídeo acaba no começo do compasso 21 (B80).
// Compasso: plano do vídeo → música
//   0      apito (5,5 s) → silêncio, rufar e subida pro Dó (entra em 5,9 s, como a faixa antiga)
//   1–2    ESCOLHA 1 DE 3: o SOC-CER-MON aumentado, uma nota por carta (B0, B2, B4); clap "hey hey" no destaque (B6)
//   3–6    pacote, ÍCONES RAROS, edições: o A da Abertura a 178 BPM em Dó; sino e virada de carta a cada edição
//   7–9    partida: Lá menor de batalha (riff e tema da Partida v4, baixo em colcheias); FIRE BLAST com o gancho em menor
//          nos metais; na defesa (B34) a banda inteira para num E7b9 e a torcida faz "uuh" no silêncio
//   10–12  evolução: o baixo sobe pelo cromático (Fá, Fá#, Sol no Raichu, Sol#, Lá); no chute em câmera lenta a banda
//          respira e só o rufar sobe
//   13–16  GOL (B48): um tom acima (Ré maior), o refrão da Abertura com segunda voz, metais e o clap 808
//   17–18  o pacote cai (B66): a banda para; tremidas no tímpano; rasga (B69) com rufar e a subida em Lá7
//   19–20  logo (B72) e soccermon.com (B76): o gancho SOC-CER-MON duas vezes com a banda junto (as sílabas do logo
//          piscam nas 3 batidas: linhas 0, 3 e 6 desses compassos)
// Clap: o 808 na receita da rodada 7b (−6 dB, passa-baixa 6,5 kHz, sala curta); na resposta do gancho, dobrado como
// torcida (o segundo 11 ms depois, um pouco mais agudo), como no Campeão.
//
// v2 (22/10/2026). "Ficou incrível, mas falta algo": medido contra o remix (mesma grade, os dois a −14 LUFS), o que
// faltava era produção, não nota. O remix é largo (lado/meio −2 dB de 1 a 8 kHz; o v1 era quase mono, −18 dB), tem
// corpo em 60–150 Hz contínuo (+4 dB) e bumbo 5 dB mais forte, pouco chiado acima de 12 kHz (o v1 tinha 12 dB a mais:
// a quadrada aliasando) e sobe ~3 dB no gol. Então, com as mesmas melodias e os mesmos pontos da história:
// - bumbo sintetizado de verdade (seno caindo de 176 pra 46 Hz, estalo curto) e sub em seno segurando a tônica;
// - bateria inteira na batalha, na evolução e no gol: bumbo nos 4 tempos, caixa com o clap 808 no 2 e no 4, chimbal
//   aberto no contratempo, viradas de tom antes de cada parte; o sub e as camadas largas abaixam um pouco em cada
//   bumbo (bombeado leve, ~3 dB: o remix quase não bombeia, é só pra o bumbo passar);
// - camadas largas: serra dobrada (−/+ alguns cents, uma em cada lado) no pad e no lead dos ganchos e do refrão, mais
//   uma oitava de brilho no refrão;
// - subidas de ruído e impactos (grave caindo + estouro) nos cortes: B0, B24, Raichu (B40), gol (B48) e logo (B72);
// - passa-baixa nas quadradas (o chiado de cima some, o brilho fica nos 2–6 kHz);
// - meio tempo de silêncio antes do logo (B71,5): o vídeo põe o clarão e o logo ali, e o SOC cai limpo em B72.
// No vídeo entra com um acabamento no ffmpeg (presença +4 dB em 4 kHz e corte em 16 kHz, onde o v1 tinha o chiado da
// saturação do writeWav), a 48 kHz:
//   node scripts/musica/render.mjs trailer-abertura --so-wav --out <pasta>
//   ffmpeg -i <pasta>/trailer-abertura.wav -af "equalizer=f=4000:t=o:w=2:g=4,lowpass=f=16000:p=2" -ar 48000 \
//     trailer/v2-abertura/som/trailer-abertura-v2.wav
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    ins,
    MAJOR,
    mel,
    padChord,
    Song,
    SR,
    stabs,
    thirdBelow,
    voicing,
} from '../synth.mjs';
import { FLIP } from './draft.mjs';

export const meta = { titulo: 'Trailer 2 com a Abertura (teste v2)', tela: 'Trailer', lufs: -14 };

/** Ruído fixo (a peça sai igual toda vez). */
function ruido(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s / 2147483647) * 2 - 1;
    };
}
/** Pico em 0,55, como as amostras do synth.mjs; devolve um instrumento de bateria (o `pitch` não muda nada). */
function pronto(y) {
    let pk = 1e-9;
    for (const v of y) pk = Math.max(pk, Math.abs(v));
    for (let i = 0; i < y.length; i++) y[i] *= 0.55 / pk;
    return () => y;
}

/** Bumbo de verdade: seno que cai de 176 pra 46 Hz em ~30 ms, corpo de 0,2 s e um estalo de 2 ms por cima. */
function bumbo() {
    const r = ruido(91);
    const y = new Float32Array(Math.round(0.5 * SR));
    let ph = 0;
    for (let i = 0; i < y.length; i++) {
        const t = i / SR;
        ph += (2 * Math.PI * (46 + 130 * Math.exp(-t / 0.03))) / SR;
        const corpo = Math.sin(ph) * Math.exp(-t / 0.2) * Math.min(1, t / 0.0008);
        y[i] = Math.tanh(2 * corpo + 0.35 * r() * Math.exp(-t / 0.002)) / Math.tanh(2);
    }
    return pronto(y);
}

/** Subida: ruído num passa-faixa que abre de 300 Hz a 8 kHz e um seno subindo 2 oitavas, crescendo até o fim. */
function subida(seg) {
    const r = ruido(17);
    const n = Math.round(seg * SR);
    const y = new Float32Array(n);
    let [lp, bp, ph] = [0, 0, 0];
    for (let i = 0; i < n; i++) {
        const x = i / n;
        const F = 2 * Math.sin((Math.PI * 300 * (8000 / 300) ** x) / SR);
        const hp = r() - lp - 0.6 * bp;
        bp += F * hp;
        lp += F * bp;
        ph += (2 * Math.PI * 220 * 4 ** x) / SR;
        y[i] = (bp + 0.3 * Math.sin(ph)) * x ** 2.2 * Math.min(1, (n - i) / (0.004 * SR));
    }
    return pronto(y);
}

/** Impacto: grave caindo de 108 pra 38 Hz por 1,5 s e um estouro de ruído abafado que fecha rápido. */
function impacto() {
    const r = ruido(5);
    const y = new Float32Array(Math.round(1.6 * SR));
    let [ph, lp] = [0, 0];
    for (let i = 0; i < y.length; i++) {
        const t = i / SR;
        ph += (2 * Math.PI * (38 + 70 * Math.exp(-t / 0.08))) / SR;
        lp += (1 - Math.exp((-2 * Math.PI * (200 + 3800 * Math.exp(-t / 0.05))) / SR)) * (r() - lp);
        y[i] = Math.tanh(1.5 * (Math.sin(ph) * Math.exp(-t / 0.45) + 0.9 * lp * Math.exp(-t / 0.07)));
    }
    return pronto(y);
}

const SERRA = ins({ vol: 0.3, a: 0.006, r: 0.1, shape: 2, sv: 0.75, d: 0.06 }); // lead largo
const SUPER = ins({ vol: 0.12, a: 0.05, r: 0.35, shape: 2, sv: 1 }); // pad largo
const SUB = ins({ vol: 0.6, a: 0.008, r: 0.06, shape: 0, sv: 1 }); // seno

/**
 * A mesma faixa vista com as notas desafinadas `c` semitons (cents / 100) e atrasadas `dt` linhas (efeito Haas):
 * dobra larga sem mexer no synth.mjs.
 */
const desafina = (P, c, dt = 0) => ({ ...P, note: (t, m, len, v) => P.note(t + dt, m + c, len, v) });

export default function trailerAbertura() {
    const S = new Song({ bpm: 178, bars: 21, swing: 0.06, tail: 2.5 });
    const BATIDA = 60 / 178;
    // bombeado leve no que segura (sub e camadas largas) onde o bumbo vai nos 4 tempos
    const BOMBA = new Set([7, 8, 10, 11, 13, 14, 15, 16]);
    const bomba =
        (fundo = 0.3) =>
        (t) =>
            BOMBA.has(Math.floor(t / S.barSec))
                ? 1 - fundo * (1 - Math.exp(-(t % BATIDA) / 0.004)) * Math.exp(-(t % BATIDA) / 0.07)
                : 1;
    // o lado direito sai 0,12 linha (~10 ms) depois: com a desafinação, os dois lados não se somam no meio
    const par = (nome, inst, { abre = 1, cents = 0.08, ...o }) =>
        [-1, 1].map((l) =>
            desafina(
                S.part(`${nome} ${l < 0 ? 'E' : 'D'}`, inst, { ...o, pan: abre * l }),
                cents * l,
                l > 0 ? 0.12 : 0,
            ),
        );
    const nos = (pr, fn) => {
        for (const P of pr) fn(P);
    };

    const lead = S.part('lead', I.lead, {
        pan: -0.1,
        gain: 0.9,
        // nos ganchos e no refrão quem leva é a dupla larga; a quadrada do meio abaixa 3 dB
        gainAt: (t) => ([13, 14, 15, 16, 19, 20].includes(Math.floor(t / S.barSec)) ? 0.7 : 1),
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
        rev: 0.08,
        corte: 8000,
    });
    const largo = par('lead largo', SERRA, { gain: 1.4, cents: 0.07, rev: 0.12, corte: 9000 });
    const brilho = S.part('brilho', I.pulse, { gain: 0.5, rev: 0.15, corte: 9000 });
    const harm = S.part('terças', I.pulse, { pan: 0.25, gain: 0.5, corte: 7000 });
    const counter = S.part('contracanto', I.counter, { pan: -0.35, gain: 0.7 });
    const bs = S.part('baixo', I.slap, { gain: 0.75 });
    const sub = S.part('sub', SUB, { gain: 0.45, gainAt: bomba(0.35) });
    const st = S.part('acordes', I.stab, { pan: 0.3, gain: 0.85 });
    const clav = S.part('clavinete', I.clav, { pan: 0.4, gain: 0.9, corte: 6000 });
    const ar = S.part('arpejo', I.arp, { pan: 0.55, gain: 0.7, echo: { rows: 2, fb: 0.2, mix: 0.25 }, corte: 7000 });
    const pad = S.part('pad', I.pad, { gain: 0.6 });
    const sup = par('pad largo', SUPER, { gain: 0.6, cents: 0.12, rev: 0.2, corte: 8000, gainAt: bomba() });
    const horns = S.part('metais', I.brass, { pan: 0.2, gain: 0.8, rev: 0.15 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 2, rev: 0.25 });
    const flip = S.part('carta', FLIP, { drum: true, pan: -0.2, gain: 1.4 });
    const k = S.part('bumbo', bumbo(), { drum: true, gain: 1.4 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 1.3 });
    const oh = S.part('chimbal aberto', I.ohat, { drum: true, pan: -0.3, gain: 1 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.45, gain: 0.8 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2, gain: 0.8 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.8 });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const imp = S.part('impacto', impacto(), { drum: true, gain: 1.1, rev: 0.25 });
    const SOBE = { meio: subida(BATIDA * 2), um: subida(BATIDA * 4), rasgo: subida(BATIDA * 2.5) };
    const sobe = Object.fromEntries(
        Object.entries(SOBE).map(([n, f]) => [n, S.part(`subida ${n}`, f, { drum: true, gain: 0.6, rev: 0.2 })]),
    );
    const clap = I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 });
    const cl = S.part('clap', clap, { drum: true, gain: 1.2 });
    const cl2 = S.part('clap2', clap.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.4, gain: 0.9 });
    const hey = (bar, pat = GANCHO.palmas, vel = 1.2) => {
        drum(cl, bar, 1, pat, { vel });
        drum(cl2, bar, 1, pat, { vel });
    };
    // um hit numa linha do compasso (impacto, subida)
    const em = (P, bar, row, vel = 1) => P.note(bar * 16 + row, 0, 0, vel);

    const DOMAJ = thirdBelow(MAJOR(0));
    const REMAJ = thirdBelow(MAJOR(2));
    const FUNK = '0:2 8:1~ 0:1 r:1 5:1 8:2 0:1 r:1 8:1~ s:2 5:1 3:2'; // o baixo da Abertura
    const BATALHA = '0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 5:1 r:1 s:1 8:1'; // colcheias que empurram
    const STAB = [3, 6, [10, 2], 14];
    const groove = (bar, n, { kick = 'X.....x.X.....x.', backbeat = true } = {}) => {
        drum(k, bar, n, kick);
        drum(sn, bar, n, '....X..o.o..X..o');
        drum(hh, bar, n, 'xoxoxoxoxoxoxoxo');
        drum(sh, bar, n, 'x.o.x.o.x.o.x.o.');
        if (backbeat) drum(cl, bar, n, '....x.......x...', { vel: 0.7 });
    };
    // a bateria inteira (batalha, evolução, gol): bumbo nos 4, caixa e clap no 2 e no 4, chimbal aberto no contratempo
    const kit = (bar, n, kick = 'X...X...X...X...') => {
        drum(k, bar, n, kick);
        drum(sn, bar, n, '....X..o.o..X..o');
        drum(cl, bar, n, '....x.......x...', { vel: 0.85 });
        drum(hh, bar, n, 'x.xxx.xxx.xxx.xx', { vel: 0.9 });
        drum(oh, bar, n, '..x...x...x...x.');
        drum(sh, bar, n, 'x.o.x.o.x.o.x.o.');
    };
    // virada de tom descendo, uma por linha, do `de` até o fim do compasso
    const viradaTom = (bar, de = 12) => {
        for (let r = de; r < 16; r++) tm.note(bar * 16 + r, 6 - 3 * (r - de), 0, 0.9 + 0.05 * (r - de));
    };

    // 0: anacruse (a música entra depois do apito)
    drum(sn, 0, 1, '..........xxXXXX', { vel: 0.9 });
    drum(tm, 0, 1, '..........x.x.x.', { pitch: 4 });
    mel(lead, 0, ['r:10 G4:2 B4:2 D5:2']);
    em(sobe.meio, 0, 8, 0.7);

    // 1–2: escolha 1 de 3. Uma nota do gancho por carta (B0, B2, B4) e o "hey hey" no destaque (B6)
    em(imp, 1, 0, 0.7);
    mel(lead, 1, ['G5:8 E5:8', 'C6:8 r:8']);
    nos(largo, (P) => mel(P, 1, ['G5:8 E5:8', 'C6:8 r:8'], { vel: 0.8 }));
    mel(harm, 1, ['G5:8 E5:8', 'C6:8 r:8'], { harm: DOMAJ });
    mel(sino, 1, ['G6:8 E6:8', 'C7:8 r:8']);
    drum(flip, 1, 1, 'x.......x.......');
    drum(flip, 2, 1, 'x...............');
    drum(cr, 1, 1, 'X...............');
    bass(bs, 1, 'C', FUNK);
    bass(bs, 2, 'Fmaj7', '0:2 8:1~ 0:1 r:1 5:1 8:2 r:8');
    bass(bs, 2, 'G7', 'r:8 0:2 r:2 8:2 s:2');
    bass(sub, 1, 'C', '0:16');
    bass(sub, 2, 'Fmaj7', '0:8 r:8');
    bass(sub, 2, 'G7', 'r:8 0:8');
    stabs(st, 1, 'C', STAB);
    stabs(st, 2, 'Fmaj7', [3, 6]);
    stabs(
        st,
        2,
        'G7',
        [
            [8, 1],
            [10, 1],
        ],
        { vel: 1.2 },
    );
    padChord(pad, 1, 'C', 16);
    padChord(pad, 2, 'Fmaj7', 8);
    padChord(pad, 2, 'G7', 8, { at: 8 });
    nos(sup, (P) => {
        padChord(P, 1, 'C', 16, { low: 55, n: 4 });
        padChord(P, 2, 'Fmaj7', 8, { low: 53, n: 4 });
        padChord(P, 2, 'G7', 8, { at: 8, low: 55, n: 4 });
    });
    groove(1, 1);
    drum(k, 2, 1, 'X.....x.X.X.....');
    drum(sn, 2, 1, '....X..o....xxXX');
    drum(hh, 2, 1, 'xoxoxoxo........');
    hey(2, '........x.x.....');
    em(sobe.meio, 2, 8, 0.6);

    // 3–6: pacote (B8, abre em B10), ÍCONES RAROS (B12), edições (B16, B18, B20, B22): o A da Abertura
    const A_CH = ['C', 'Am7', 'Fmaj7', 'G7'];
    mel(lead, 3, [
        'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
        'E5:3 C5:3 A4:2 r:2 C5:2 E5:2 G5:2',
        'A5:3 G5:3 F5:2 E5:2 C5:2 A4:2 C5:2',
        'D5:6 r:2 B4:2 C5:2 D5:2 F5:2',
    ]);
    mel(counter, 3, ['G4:6 E4:2 G4:8', 'A4:6 G4:2 E4:8', 'F4:6 A4:2 C5:8', 'B4:8 G4:4 F4:4'], { vel: 0.8 });
    A_CH.forEach((c, i) => {
        bass(bs, 3 + i, c, FUNK);
        bass(sub, 3 + i, c, '0:6 r:2 0:8');
        stabs(st, 3 + i, c, STAB);
        nos(sup, (P) => padChord(P, 3 + i, c, 16, { low: 55, n: 4, vel: 0.8 }));
        if (i >= 2) arp(ar, 3 + i, c, { low: 64, step: 1 });
    });
    groove(3, 4);
    drum(oh, 3, 4, '......x.......x.', { vel: 0.8 });
    drum(cr, 4, 1, 'X...............'); // ÍCONES RAROS
    drum(flip, 3, 1, '........x.......'); // o pacote abre
    // as edições: carta virando + sino na nota do acorde
    drum(flip, 5, 2, 'x.......x.......');
    mel(sino, 5, ['C7:8 A6:8', 'B6:8 D7:8']);
    drum(sn, 6, 1, '............xxXX');
    viradaTom(6);
    em(sobe.meio, 6, 8);

    // 7–9: partida em Lá menor, energia de batalha
    em(imp, 7, 0, 0.9);
    const RIFF = 'A4:1 A4:1 r:1 C5:1 r:1 D5:2 E5:1 r:2 G5:1 E5:2 D5:1 C5:1 A4:1';
    mel(clav, 7, [RIFF]);
    mel(clav, 8, [RIFF], { shift: 5, vel: 0.7 });
    mel(lead, 7, ['E5:2 E5:1 E5:1 G5:2 A5:2 r:2 G5:1 E5:1 D5:2 C5:2']);
    nos(largo, (P) => mel(P, 7, ['E5:2 E5:1 E5:1 G5:2 A5:2 r:2 G5:1 E5:1 D5:2 C5:2'], { vel: 0.6 }));
    bass(bs, 7, 'Am7', BATALHA);
    bass(sub, 7, 'Am7', '0:16');
    stabs(st, 7, 'Am7', [[0, 2], 6, 10, 14]);
    nos(sup, (P) => {
        padChord(P, 7, 'Am7', 16, { low: 57, n: 4 });
        padChord(P, 8, 'D7', 16, { low: 57, n: 4 });
        padChord(P, 9, 'Fmaj7', 8, { low: 57, n: 4 });
    });
    drum(cr, 7, 1, 'X...............');
    // FIRE BLAST (B28): os metais e o lead gritam o gancho em menor (3-3-2)
    const hookMenor = GANCHO.em({ tom: -3, menor: true }); // E5 C5 A5
    mel(lead, 8, [hookMenor]);
    nos(largo, (P) => mel(P, 8, [hookMenor], { vel: 0.9 }));
    mel(horns, 8, [GANCHO.em({ tom: -3, menor: true, oitava: -1 })]);
    bass(bs, 8, 'D7', BATALHA);
    bass(sub, 8, 'D7', '0:16');
    stabs(
        st,
        8,
        'D7',
        [
            [0, 2],
            [3, 2],
            [6, 4],
        ],
        { vel: 1.1 },
    );
    drum(ti, 8, 1, 'X..x..x.........');
    // defesa: a banda para inteira em B34 (linha 8 do compasso 9) e a torcida faz "uuh" no silêncio
    mel(lead, 9, ['E5:3 D5:3 C5:2 G#5:4! r:4']);
    mel(horns, 9, ['r:8 B4+D5+F5+G#5:4 r:4']);
    bass(bs, 9, 'Fmaj7', '0:1 r:1 0:1 8:1 0:1 r:1 5:1 8:1 r:8');
    bass(bs, 9, 'E7b9', 'r:8 0:4 r:4');
    bass(sub, 9, 'Fmaj7', '0:8 r:8');
    bass(sub, 9, 'E7b9', 'r:8 0:4 r:4');
    stabs(st, 9, 'Fmaj7', [0, 3, 6]);
    kit(7, 1);
    kit(8, 1, 'X...X...X...X.x.');
    drum(sn, 8, 1, '..............xx', { vel: 0.9 });
    drum(k, 9, 1, 'X...X...X.......');
    drum(sn, 9, 1, '....X..o........');
    drum(hh, 9, 1, 'x.xxx.xx........');
    drum(oh, 9, 1, '..x...x.........');
    drum(sh, 9, 1, 'x.o.x.o.........');
    drum(cl, 9, 1, '....x...........', { vel: 0.85 });
    drum(cr, 9, 1, '........X.......');
    drum(ti, 9, 1, '........X.......');

    // 10–12: evolução. O baixo sobe pelo cromático; troca de acorde na silhueta (B38) e no Raichu (B40)
    const SUBIDA = [
        [10, 'F', 'F#dim'],
        [11, 'G', 'G#dim'],
    ];
    for (const [b, c1, c2] of SUBIDA) {
        bass(bs, b, c1, '0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 r:8');
        bass(bs, b, c2, 'r:8 0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1');
        bass(sub, b, c1, '0:8 r:8');
        bass(sub, b, c2, 'r:8 0:8');
        arp(ar, b, c1, { low: 65, step: 1, rows: 8 });
        padChord(pad, b, c1, 8, { vel: 0.8 });
        padChord(pad, b, c2, 8, { at: 8, vel: 0.9 });
        nos(sup, (P) => {
            padChord(P, b, c1, 8, { low: 57, n: 4, vel: 0.9 });
            padChord(P, b, c2, 8, { at: 8, low: 57, n: 3 });
        });
        stabs(st, b, c2, [[8, 2]], { vel: 1.1 });
    }
    // o arpejo do 2º acorde de cada compasso (o arp sempre começa na linha 0)
    for (const [b, , c2] of SUBIDA) {
        const v = voicing(c2, 65, 3);
        for (let i = 8; i < 16; i++) ar.note(b * 16 + i, v[i % 3] + (i >= 12 ? 12 : 0), 1, 0.8);
    }
    mel(lead, 10, ['C6:6 A5:2 C6:8', 'D6:6 B5:2 D6:4 D6:2 F6:2']);
    nos(largo, (P) => mel(P, 10, ['C6:6 A5:2 C6:8', 'D6:6 B5:2 D6:4 D6:2 F6:2'], { vel: 0.6 }));
    mel(counter, 10, ['A4:8 A4:8', 'B4:8 B4:8']);
    mel(horns, 11, ['G4+B4+D5:4 r:12']); // o Raichu aparece
    em(imp, 11, 0, 0.75);
    kit(10, 2);
    drum(cr, 11, 1, 'X...............');
    drum(sn, 11, 1, '........xxxxXXXX', { vel: 0.8 });
    // 12: o chute (B44) e a câmera lenta (B46): a banda respira, só o Lá no baixo e o rufar subindo pro gol
    bass(bs, 12, 'A7sus4', '0:8 r:8');
    bass(sub, 12, 'A7sus4', '0:8 r:8');
    padChord(pad, 12, 'A7sus4', 8);
    padChord(pad, 12, 'A7', 8, { at: 8, vel: 1.1 });
    mel(lead, 12, ['E6:8 r:5 A5:1 B5:1 C#6:1']);
    mel(counter, 12, ['D5:8 C#5:8']);
    drum(k, 12, 1, 'X.......X...X.X.');
    drum(sn, 12, 1, '........xoxoxxXX', { vel: 0.9 });
    drum(ti, 12, 1, 'X.......x...x...');
    em(sobe.um, 12, 0);

    // 13–16: GOL (B48), um tom acima: o refrão da Abertura em Ré, com terças, metais e o clap 808
    em(imp, 13, 0);
    const REFRAO = [
        'C6:2 C6:2 A5:2 C6:4 A5:2 G5:2 F5:2',
        'D6:2 D6:2 B5:2 D6:4 B5:2 A5:2 G5:2',
        'E6:3 D6:3 B5:2 G5:4 E5:4',
        'A5:3 G5:3 E5:2 C5:2 E5:2 G5:2 A5:2',
    ];
    const C_CH = ['G', 'A', 'F#m7', 'Bm7'];
    mel(lead, 13, REFRAO, { shift: 2 });
    nos(largo, (P) => mel(P, 13, REFRAO, { shift: 2 }));
    mel(brilho, 13, REFRAO, { shift: 14 });
    mel(harm, 13, REFRAO, { shift: 2, harm: REMAJ });
    mel(horns, 13, ['r:12 F#5:1 A5:1 D6:2', 'r:12 G5:1 B5:1 E6:2', 'r:16', 'r:12 F#5:1 A5:1 B5:2']);
    C_CH.forEach((c, i) => {
        bass(bs, 13 + i, c, FUNK);
        bass(sub, 13 + i, c, '0:16');
        stabs(st, 13 + i, c, STAB);
        arp(ar, 13 + i, c, { low: 67, step: 1 });
        padChord(pad, 13 + i, c, 16, { vel: 0.6 });
        nos(sup, (P) => padChord(P, 13 + i, c, 16, { low: 59, n: 4 }));
    });
    kit(13, 3);
    kit(16, 1, 'X...X...X...X.X.');
    drum(cr, 13, 1, 'X...............');
    drum(ti, 13, 1, 'X...............');
    drum(cr, 15, 1, '........X.......'); // campeão (B58)
    hey(14);
    hey(16);
    viradaTom(14, 14);
    viradaTom(16);

    // 17–18: o pacote cai (B66), treme (B67, B68) e rasga (B69); a banda para e volta subindo em Lá7
    mel(lead, 17, ['G5:2 G5:2 B5:2 D6:2 r:8']);
    mel(harm, 17, ['G5:2 G5:2 B5:2 D6:2 r:8'], { harm: REMAJ });
    bass(bs, 17, 'Em7', '0:2 8:1~ 0:1 r:1 5:1 8:2 r:8');
    bass(bs, 17, 'A7sus4', 'r:8 0:4 r:4');
    bass(sub, 17, 'Em7', '0:8 r:8');
    bass(sub, 17, 'A7sus4', 'r:8 0:4 r:4');
    stabs(st, 17, 'Em7', [3, 6]);
    stabs(st, 17, 'A7sus4', [[8, 3]], { vel: 1.2 });
    drum(k, 17, 1, 'X...X...X.......');
    drum(sn, 17, 1, '....X..o........');
    drum(hh, 17, 1, 'x.xxx.xx........');
    drum(oh, 17, 1, '..x...x.........');
    drum(cl, 17, 1, '....x...........', { vel: 0.85 });
    drum(ti, 17, 1, '........X...x...');
    drum(ti, 18, 1, 'X...............');
    // rasga (B69, linha 4) e sobe até B71,5; a última meia batida fica em silêncio (o logo entra no vídeo ali)
    drum(sn, 18, 1, 'xoxoxoxoxxxxXX..', { vel: 0.9 });
    drum(cr, 18, 1, '....X...........');
    drum(k, 18, 1, '....X...X...X...');
    mel(horns, 18, ['r:4 A4+C#5+E5+G5:10 r:2']);
    padChord(pad, 18, 'A7', 10, { at: 4 });
    bass(bs, 18, 'A7', 'r:4 0:4 0:2 8:2 0:1 8:1 r:2');
    bass(sub, 18, 'A7', 'r:4 0:10 r:2');
    mel(lead, 18, ['r:4 A4:2 B4:2 C#5:2 D5:2 E5:1 F#5:1 r:2']);
    em(sobe.rasgo, 18, 4);

    // 19–20: logo (B72) e soccermon.com (B76). O gancho em Ré com a banda junto, a torcida responde "hey hey"
    em(imp, 19, 0);
    em(imp, 20, 0, 0.6);
    const hookRe = GANCHO.em({ tom: 2 }); // A5 F#5 D6
    mel(lead, 19, [hookRe, 'A5:3 F#5:3 D6:10']);
    nos(largo, (P) => mel(P, 19, [hookRe, 'A5:3 F#5:3 D6:10']));
    mel(brilho, 19, [hookRe, 'A5:3 F#5:3 D6:10'], { shift: 12, vel: 0.8 });
    mel(harm, 19, [hookRe, 'A5:3 F#5:3 D6:10'], { harm: REMAJ });
    mel(horns, 19, [GANCHO.em({ tom: 2, oitava: -1 }), 'A4:3 F#4:3 D5:10']);
    mel(sino, 19, ['r:6 D7:6 r:4', 'r:6 D7:10']);
    for (const b of [19, 20]) {
        stabs(
            st,
            b,
            'D',
            [
                [0, 2],
                [3, 2],
                [6, 6],
            ],
            { vel: 1.1 },
        );
        drum(k, b, 1, 'X..X..X.........');
        drum(ti, b, 1, 'X..x..X.........');
        drum(cr, b, 1, 'X.....X.........');
        hey(b);
    }
    bass(bs, 19, 'D', '0:3 0:3 8:6 r:4');
    bass(bs, 20, 'D', '0:3 0:3 8:10');
    bass(sub, 19, 'D', '0:3 0:3 0:10');
    bass(sub, 20, 'D', '0:3 0:3 0:10');
    nos(sup, (P) => {
        padChord(P, 19, 'D', 16, { low: 57, n: 4 });
        padChord(P, 20, 'Dadd9', 16, { low: 57, n: 4 });
    });
    drum(hh, 19, 1, '........xoxoxoxo');
    drum(sn, 19, 1, '............o.oo');
    padChord(pad, 20, 'Dadd9', 16, { at: 6, n: 4 });
    arp(ar, 20, 'Dadd9', { low: 74, step: 1, vel: 0.6 });
    return S;
}
