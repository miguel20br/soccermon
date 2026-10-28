// Escalaram um Ditto no gol (série "Escalaram um ___ no gol", EP 3; roteiro em trailer/curtas/ditto/ROTEIRO.md).
// A história está no motivo do Ditto: "Dit-TOOO", um salto de oitava que estica e volta escorregando (G4 G5 F5 E5 D5
// B4 D5, Sol mixolídio), na voz de kazoo dele. O motivo muda de forma junto com ele: sobe e encolhe no Snorlax
// pequenininho, desafina e escorre na poça, toca sozinho e lento à noite. A assinatura é o BOING da transformação
// (`mola`, berimbau de boca), um diferente por tentativa: normal, mais grave, escorregando pra baixo, e o perfeito.
// As 4 tentativas são um funk em Sol: a cortina é a pergunta (o Ditto chama "Dit-TO?", os metais respondem, virada),
// o BOING abre a transformação, e o júri é a resposta (o plof do Magikarp, o ronco do Snorlax, o pícolo do Pikachu
// imitando). Breque na 3ª. A 4ª sobe meio tom (Lá♭) e cresce; a cara volta, um instante de silêncio, o motivo rindo,
// 10-10-10 explode. Estádio, apito, a torcida rival ri. Pênalti: a música para; o chute lento é só o coração grave.
// A defesa: silêncio, e tudo volta meio tom acima (Lá) com a torcida gritando "DIT-TO!" no salto de oitava;
// SOC-CER-MON com palmas; "EP 4?" termina no BOING.
// 100 BPM, 4/4, compasso = 2,4 s, 28 compassos (67,2 s). Sol → Lá♭ (C16) → Lá (C25).
import { kazoo, lateja, mola, risada, splash } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, deslize, rede, ronco, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Escalaram um Ditto no gol', tela: 'Curta da série (EP 3)' };

const BAR = 2.4;
const ROW = BAR / 16;
/** Os silêncios do roteiro (s): C18 depois da cara voltar, C22 inteiro (o pênalti), o começo do C25 (a defesa). */
export const SILENCIOS = [
    [18 * BAR + 2 * ROW, 18 * BAR + 8 * ROW],
    [22 * BAR, 23 * BAR],
    [25 * BAR, 25 * BAR + 4 * ROW],
];
/** O motivo do Ditto (um compasso, Sol): pergunta que termina na quinta. */
export const MOTIVO = 'G4:1 r:1 G5:3 F5:1 E5:2 D5:2 B4:2 r:1 D5:3';

export default function ditto() {
    const base = (b) => (b < 7 ? 0.85 : b < 16 ? 0.92 : b < 17 ? 0.92 + 0.08 * (b - 16) : 1);
    const masterAt = (t) => {
        let g = base(t / BAR);
        const f = 0.025;
        for (const [a, z] of SILENCIOS)
            if (t > a - f && t < z + f) g *= Math.min(1, Math.max(0, (a - t) / f, (t - z) / f));
        return g;
    };
    const S = new Song({ bpm: 100, bars: 28, swing: 0.12, tail: 3, masterAt });
    const kz = S.part('kazoo', kazoo, {
        pan: -0.05,
        gain: 1,
        corte: 3200,
        rev: 0.18,
        echo: { rows: 3, fb: 0.2, mix: 0.12 },
    });
    const bo = S.part('boing', mola(), { pan: 0.1, gain: 1.2, rev: 0.2 });
    const boG = S.part('boingGrave', mola({ seg: 1.1, balanco: 9 }), { pan: 0.1, gain: 1.3, rev: 0.2 });
    const boE = S.part('boingEscorre', mola({ seg: 1.6, desce: 14, balanco: 10 }), { pan: 0.1, gain: 1.2, rev: 0.25 });
    const boP = S.part('boingPequeno', mola({ seg: 0.35, balanco: 18 }), { pan: 0.2, gain: 1.6, rev: 0.2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1.2, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const sino = S.part('sino', I.bell, { pan: 0.15, gain: 1.8, echo: { rows: 4, fb: 0.35, mix: 0.35 }, rev: 0.45 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.9, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.5, corte: 2500 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const spl = S.part('plof', splash, { pan: 0.25, gain: 1.1, rev: 0.2 });
    const zz = S.part('ronco', ronco, { drum: true, pan: 0.05, gain: 0.55, rev: 0.15 });
    const tum = S.part('tum', lateja, { drum: true, gain: 0.9, rev: 0.15 });
    const pinga = S.part('pinga', deslize(520, 110, 0.45), { drum: true, pan: 0.1, gain: 0.7, rev: 0.3 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.8 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const ri = S.part('risada', risada(1.6, (100 / 60) * 2), { drum: true, gain: 0.8, rev: 0.3 });
    const festa = S.part('festa', torcida(3.5, 0.08, 2), { drum: true, gain: 0.6, rev: 0.3 });
    const fundo = S.part('estadio', torcida(4.8, 0.8, 1.2), { drum: true, gain: 0.3, rev: 0.4 });
    const bl = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.9 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.32 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });

    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    /** O funk da casa em Sol (`s` = semitons acima). Leve: só o esqueleto (vestiário, o gol). */
    const groove = (b, c0, { s = 0, leve = false, partida = false } = {}) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, partida ? 'X...x...X...x...' : leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, partida ? 'xxXxxxXxxxXxxxXx' : leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', {
            vel: leve ? 0.7 : 1,
        });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    /** Virada de caixa nas últimas `n` linhas do compasso. */
    const virada = (b, n, vel = 0.9) => drum(sn, b, 1, `${'.'.repeat(16 - n)}${'x'.repeat(n - 2)}XX`, { vel });
    /** Notas com afinação livre: [nota | null, linhas, desvio em semitons] (o motivo desafinando). */
    const torto = (P, b, notas, vel = 1) => {
        let r = 0;
        for (const [n, len, d = 0] of notas) {
            if (n) P.note(b * 16 + r, midi(n) + d, len, vel);
            r += len;
        }
    };

    // 0 · a roleta gira e freia no BOING (linha 10)
    drum(bl, 0, 1, 'xxxxxxxxxx......', { pitch: 12, vel: 0.8 });
    bo.note(10, 0, 0, 1);
    mel(tuba, 0, ['r:10 G2:6'], { vel: 0.8 });
    // 1 · selo EP 3: o motivo do Ditto inteiro, no kazoo
    drum(cr, 1, 1, 'X...............', { vel: 0.8 });
    stabs(met, 1, 'G7', [0], { low: 55, n: 4, len: 2 });
    mel(kz, 1, [MOTIVO]);
    padChord(ep, 1, 'G7', 16, { low: 55, n: 4, vel: 0.4 });
    bass(bs, 1, 'G7', '0:4 r:4 5:4 r:2 8:2', { vel: 0.8 });
    // 2 · vestiário: groove leve, o Snorlax ronca no banco; o Ditto diz "oi" no fim e ninguém responde
    groove(2, 'G7', { leve: true });
    zz.note(2 * 16, -3, 0, 0.5);
    mel(kz, 2, ['r:12 D5:1 G5:3'], { vel: 0.8 });
    // 3 · o apito (som da cena, linha 0); o motivo SOBE esticando... e ENCOLHE: o BOING pequeno e o motivo no pícolo
    groove(3, 'C9', { leve: true });
    mel(kz, 3, ['G4:1 C5:1 E5:1 G5:1 Bb5:2 C6:3 r:7']);
    boP.note(3 * 16 + 9, 12, 0, 1);
    mel(pc, 3, ['r:10 G6:1 r:1 G6:1 F6:1 E6:2'], { vel: 0.7 });
    // 4 · o Pikachu chuta no meio das pernas: gol; a torcida ri no tempo
    groove(4, 'G7', { leve: true });
    ch.note(4 * 16 + 2, 0, 0, 1);
    rd.note(4 * 16 + 4, 0, 0, 0.9);
    ri.note(4 * 16 + 6, 0, 0, 1);
    // 5 · ele derrete: o motivo desafina e cai, nota a nota; pinga na poça
    torto(kz, 5, [
        ['G5', 3, 0],
        ['F5', 1, -0.2],
        ['E5', 2, -0.4],
        ['D5', 2, -0.7],
        ['B4', 2, -1.1],
        ['G4', 6, -1.7],
    ]);
    padChord(ep, 5, 'Em7', 8, { low: 52, n: 4, vel: 0.4 });
    padChord(ep, 5, 'Ebmaj7', 8, { low: 51, n: 4, vel: 0.35, at: 8 });
    pinga.note(5 * 16 + 11, 0, 0, 1);
    // 6 · noite: o motivo lento e sozinho, no sino (o Magikarp pendura a placa)
    mel(sino, 6, ['G4:2 G5:6 E5:4 D5:4'], { vel: 0.6 });

    // 7–19 · AS 4 TENTATIVAS (funk em Sol). Cortina = pergunta ("Dit-TO?" e os metais respondem) + virada;
    // a cortina abre no prato do compasso seguinte; o BOING da transformação na linha 4; o júri é a resposta.
    const cortina = (b, pergunta, n) => {
        groove(b, 'D7');
        stabs(met, b, 'D7', [0, 2], { low: 54, n: 4, len: 1 });
        mel(kz, b, [pergunta]);
        mel(met2, b, ['r:8 D4+F#4:1 r:1 D4+A4:2 r:4']);
        virada(b, n);
    };
    // 7 · TENTATIVA 1
    cortina(7, 'r:4 G4:1 r:1 G5:2 r:8', 8);
    drum(tp, 7, 1, '............xxXX', { vel: 0.6 });
    // 8 · Snorlax roxo com a cara do Ditto (BOING normal)... cai sentado e afunda
    drum(cr, 8, 1, 'X...............');
    groove(8, 'G7');
    bo.note(8 * 16 + 4, 0, 0, 1.2);
    tum.note(8 * 16 + 10, 0, 0, 1);
    mel(tuba, 8, ['r:10 D2:2 B1:2 G1:2'], { vel: 0.8 });
    // 9 · o júri responde: o Magikarp chora de rir (plof-plof), o Snorlax ronca (a placa sobe), o Pikachu imita
    groove(9, 'C9');
    mel(spl, 9, ['C6:1 r:1 C6:1 r:13'], { vel: 0.7 });
    zz.note(9 * 16 + 4, 0, 0, 0.6);
    mel(pc, 9, ['r:10 G5:1 r:1 G6:2 F6:1 E6:1'], { vel: 0.8 });
    // 10 · TENTATIVA 2: a pergunta mais insistente, virada curta
    cortina(10, 'r:4 G4:1 G5:1 G4:1 G5:3 r:6', 4);
    // 11 · estica e se esmaga, panqueca (BOING mais grave e mais lento; o TUM do esmagão)
    drum(cr, 11, 1, 'X...............');
    groove(11, 'C9');
    boG.note(11 * 16 + 4, -7, 0, 1.3);
    tum.note(11 * 16 + 11, -3, 0, 1.1);
    mel(spl, 11, ['r:11 C4:5'], { vel: 0.7 });
    // 12 · júri: 1 · 1 · 1, cada um de um jeito (plof, tuba, pícolo, a mesma nota), e o "ô" do Ditto
    groove(12, 'G7');
    mel(spl, 12, ['D5:4 r:12'], { vel: 0.8 });
    mel(tuba, 12, ['r:4 D2:3 r:9']);
    mel(pc, 12, ['r:8 D6:1 r:7'], { vel: 0.8 });
    mel(kz, 12, ['r:12 B4:2 Bb4:2'], { vel: 0.8 });
    // 13 · TENTATIVA 3: a pergunta já não chega na oitava
    cortina(13, 'r:4 G4:1 r:1 F5:2 r:8', 8);
    // 14 · Onix roxo... amolece e escorre (BOING escorregando uma oitava pra baixo); os metais descem junto
    drum(cr, 14, 1, 'X...............');
    groove(14, 'G7');
    boE.note(14 * 16 + 4, 5, 0, 1.2);
    mel(met2, 14, ['r:8 F4:2 E4:2 Eb4:2 D4:2'], { vel: 0.8 });
    pinga.note(14 * 16 + 14, -5, 0, 0.8);
    // 15 · breque: a banda corta no 1; o PLOF do Magikarp caindo da cadeira (o motivo dele do EP 2), o ronco
    stabs(met, 15, 'G7', [0], { low: 55, n: 4, len: 1 });
    stabs(gt, 15, 'G7', [0], { low: 60, n: 3 });
    mel(bs, 15, ['G2:1 r:15']);
    drum(kk, 15, 1, 'X...............');
    drum(cr, 15, 1, 'x...............', { vel: 0.6 });
    mel(spl, 15, ['r:2 G5:3 E5:3 C5:4 r:4'], { vel: 1 });
    zz.note(15 * 16 + 9, -2, 0, 0.45);
    // 16 · TENTATIVA 4: virada longa; Mi♭7 leva a Lá♭ (sobe meio tom) e a música cresce
    drum(sn, 16, 1, 'x...x...x.x.xxxx', { vel: 0.7 });
    drum(sn, 16, 1, '.............xXX', { vel: 0.5 });
    drum(tp, 16, 1, 'x.......x...xxXX', { vel: 0.7 });
    drum(kk, 16, 1, 'X...X...X...X...');
    drum(hh, 16, 1, 'x.x.x.x.xxxxxxxx', { vel: 0.8 });
    bass(bs, 16, 'Eb7', '0:2 0:2 r:2 0:2 5:2 r:2 s:2 8:2');
    mel(met, 16, ['Bb3:4 C4:4 D4:4 Eb4:2 G4:2']);
    mel(met2, 16, ['G3:4 Ab3:4 Bb3:4 C4:2 Db4:2']);
    padChord(cor, 16, 'Eb7', 16, { low: 55, n: 4, vel: 0.6 });

    // 17 · o Snorlax perfeito: BOING limpo e o motivo inteiro, cheio (kazoo + metais em terças, cordas)
    const ab = MAJOR(8);
    drum(cr, 17, 1, 'X...............');
    bo.note(17 * 16, 1, 0, 1.2);
    groove(17, 'G7', { s: 1 });
    mel(kz, 17, [MOTIVO], { shift: 1 });
    mel(met, 17, [MOTIVO], { shift: 1 - 12, harm: thirdBelow(ab), vel: 0.7 });
    padChord(cor, 17, 'Ab7', 16, { low: 56, n: 4, vel: 0.6 });
    // 18 · a cara volta sozinha (o BOING pequeno), um instante de silêncio, e o motivo rindo
    boP.note(18 * 16, 13, 0, 0.9);
    mel(kz, 18, ['r:8 G4:1 r:1 G5:2 E5:1 G5:1 E5:1 G5:1'], { shift: 1 });
    mel(bs, 18, ['r:8 G2:1 r:7'], { shift: 1 });
    stabs(gt, 18, 'Ab7', [10, 14], { low: 60, n: 3 });
    drum(hh, 18, 1, '........x.x.x.x.', { vel: 0.8 });
    drum(sn, 18, 1, '............x.xX', { vel: 0.8 });
    // 19 · EXPLODE: 10 · 10 · 10 (metais e palmas a cada placa), a torcida, o motivo lá em cima
    drum(cr, 19, 1, 'X.......x.......');
    groove(19, 'C9', { s: 1 });
    stabs(met, 19, 'Ab', [0, 4, 8], { low: 56, n: 4, len: 2 });
    drum(cl, 19, 1, 'X...X...X...x.x.', { vel: 0.8 });
    festa.note(19 * 16, 0, 0, 1);
    mel(kz, 19, ['r:8 G5:1 r:1 G6:3 F6:1 E6:2'], { shift: 1 });
    padChord(cor, 19, 'Db9', 16, { low: 56, n: 4, vel: 0.6 });

    // 20 · pro estádio (ÚLTIMO MINUTO): a torcida ao fundo, a fanfarra curta
    groove(20, 'C9', { s: 1 });
    fundo.note(20 * 16, 0, 0, 1);
    mel(met, 20, ['r:8 Db5:2 F5:2 Ab5:4'], { vel: 0.85 });
    mel(met2, 20, ['r:8 Ab4:2 Db5:2 F5:4'], { vel: 0.6 });
    // 21 · o apito (som da cena, linha 0), BOING: ele vira o Snorlax com a cara dele; a torcida rival ri. Groove de
    // partida até a linha 14 e corta.
    groove(21, 'G7', { s: 1, partida: true });
    fundo.note(21 * 16, 0, 0, 0.7);
    bo.note(21 * 16 + 2, 1, 0, 1.1);
    ri.note(21 * 16 + 8, 0, 0, 0.8);
    stabs(met, 21, 'Eb7', [14], { low: 55, n: 4, len: 2 });
    // 22 · o pênalti, o Mewtwo pega a bola: a música para (SILENCIOS)
    // 23–24 · o chute em câmera lenta: só o coração grave, em Lá, crescendo
    for (const [b, v] of [
        [23, 0.6],
        [24, 0.8],
    ]) {
        mel(tuba, b, ['A1:2 r:1 A1:2 r:3 A1:2 r:1 A1:2 r:3'], { vel: v });
        drum(kk, b, 1, 'x..x....x..x....', { vel: 0.55 * v });
    }

    // 25 · a defesa. Silêncio (linhas 0–3) e a torcida: "DIT-TO!" no salto de oitava; tudo volta meio tom acima (Lá)
    drum(cr, 25, 1, '....X...........');
    drum(tp, 25, 1, '....X...........');
    festa.note(25 * 16 + 4, 0, 0, 1.1);
    groove(25, 'G7', { s: 2 });
    mel(met, 25, ['r:4 A4:1 r:1 A5:4 r:2 A4:1 r:1 A5:2']);
    mel(kz, 25, ['r:4 A4:1 r:1 A5:4 r:2 A4:1 r:1 A5:2'], { vel: 0.9 });
    drum(cl, 25, 1, '......X.....x.X.', { vel: 0.8 });
    padChord(cor, 25, 'A7', 12, { low: 57, n: 4, vel: 0.6, at: 4 });
    // 26 · no banco, todos juntos: SOC-CER-MON (o gancho em Lá) com as palmas respondendo
    groove(26, 'G', { s: 2 });
    mel(kz, 26, [GANCHO.em({ tom: -3 })]);
    mel(met, 26, [GANCHO.em({ tom: -3, oitava: -1 })], { harm: thirdBelow(MAJOR(9)), vel: 0.7 });
    mel(met2, 26, [GANCHO.em({ tom: -3, oitava: -1 })], { vel: 0.6 });
    drum(cl, 26, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 26, 'A', 16, { low: 57, n: 4, vel: 0.6 });
    // 27 · "EP 4?": o Ditto pergunta (o salto de oitava) e termina no BOING (linha 12), com o acorde de Lá
    stabs(met, 27, 'A', [0], { low: 57, n: 4, len: 2 });
    mel(bs, 27, ['A2:2 r:10 A1:4']);
    drum(kk, 27, 1, 'X...........X...');
    mel(kz, 27, ['r:2 A4:1 r:1 A5:4 r:8']);
    bo.note(27 * 16 + 12, 2, 0, 1.3);
    stabs(met, 27, 'A', [12], { low: 57, n: 4, len: 4 });
    drum(tp, 27, 1, '............X...', { vel: 0.8 });
    drum(cr, 27, 1, '............x...', { vel: 0.6 });
    return S;
}
