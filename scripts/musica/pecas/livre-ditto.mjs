// Escalaram um Ditto no gol (série "Escalaram um ___ no gol", EP 3; roteiro v2 em trailer/curtas/ditto/ROTEIRO.md).
// A história está no motivo do Ditto: "Dit-TOOO", um salto de oitava que estica e volta escorregando (G4 G5 F5 E5 D5
// B4 D5, Sol mixolídio), na voz de kazoo dele. O motivo muda de forma junto com ele: sobe e encolhe no Snorlax
// pequenininho, desafina e escorre na poça, toca sozinho e lento à noite. A assinatura é o BOING da transformação
// (`mola`, berimbau de boca), um por tentativa: pequeno, grave, escorregando pra baixo, e o normal no encaixe da defesa.
// Vestiário em groove leve; breque e silêncio na placa "PRECISAMOS DE GOLEIRO", e o motivo. O teste é um funk em Sol:
// o BOING abre cada transformação, o chute erra o gol, e o júri responde (o plof do Magikarp, o pícolo do Pikachu
// imitando, o ronco do Snorlax). Breque no 1 · 1 · 1; ele vira poça, o motivo lento no sino. A 3ª sobe meio tom (Lá♭)
// e cresce; ele defende, a cara volta, um instante de silêncio, o motivo rindo, 10-10-10 explode. Estádio, apito, a
// torcida rival ri. Pênalti: a música para; o chute lento é só o coração grave. A defesa: silêncio, e tudo volta meio
// tom acima (Lá) com a torcida gritando "DIT-TO!" no salto de oitava; SOC-CER-MON com palmas; "EP 4?"; fim no BOING.
// 100 BPM, 4/4, compasso = 2,4 s, 28 compassos (67,2 s). Sol → Lá♭ (C14) → Lá (C23).
import { kazoo, lateja, mola, risada, splash } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, deslize, rede, ronco, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Escalaram um Ditto no gol', tela: 'Curta da série (EP 3)' };

const BAR = 2.4;
const ROW = BAR / 16;
/** Os silêncios do roteiro (s): C3 depois do breque (até o motivo), C16 depois da cara voltar, C20 inteiro (o
 * pênalti), o começo do C23 (a defesa). */
export const SILENCIOS = [
    [3 * BAR + 3 * ROW, 3 * BAR + 8 * ROW - 0.03],
    [16 * BAR + 2 * ROW, 16 * BAR + 8 * ROW],
    [20 * BAR, 21 * BAR],
    [23 * BAR, 23 * BAR + 4 * ROW],
];
/** O motivo do Ditto (um compasso, Sol): pergunta que termina na quinta. */
export const MOTIVO = 'G4:1 r:1 G5:3 F5:1 E5:2 D5:2 B4:2 r:1 D5:3';

export default function ditto() {
    const base = (b) => (b < 4 ? 0.85 : b < 13 ? 0.92 : b < 14 ? 0.92 + 0.08 * (b - 13) : 1);
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
    // 2 · vestiário, véspera da final: groove leve; o Magikarp sacode o Snorlax, que só ronca (o "oi" sem resposta)
    groove(2, 'G7', { leve: true });
    zz.note(2 * 16, -3, 0, 0.5);
    mel(kz, 2, ['r:12 D5:1 G5:3'], { vel: 0.8 });
    // 3 · "PRECISAMOS DE GOLEIRO": breque no 1 (a banda corta, a placa sobe), silêncio, e o Ditto levanta a gelatina
    // com o motivo ("Dit-TOOO?")
    stabs(met, 3, 'G7', [0], { low: 55, n: 4, len: 1 });
    stabs(gt, 3, 'G7', [0], { low: 60, n: 3 });
    mel(bs, 3, ['G2:1 r:15']);
    drum(kk, 3, 1, 'X...............');
    drum(cr, 3, 1, 'x...............', { vel: 0.6 });
    mel(kz, 3, ['r:8 G4:1 r:1 G5:3 F5:1 E5:2']);
    drum(hh, 3, 1, '............x.xx', { vel: 0.6 });
    // 4 · a quadra de treino (TESTE NO GOL): o groove entra; os metais respondem
    groove(4, 'G7');
    mel(met2, 4, ['r:8 D4+F#4:1 r:1 D4+A4:2 r:4']);
    // 5 · TENTATIVA 1: o motivo SOBE esticando (ele olha o Snorlax)... e ENCOLHE: o BOING pequeno e o motivo no pícolo
    groove(5, 'C9');
    mel(kz, 5, ['G4:1 C5:1 E5:1 G5:1 Bb5:2 C6:3 r:7']);
    boP.note(5 * 16 + 9, 12, 0, 1);
    mel(pc, 5, ['r:10 G6:1 r:1 G6:1 F6:1 E6:2'], { vel: 0.7 });
    // 6 · o Pikachu chuta e a bola passa por cima: gol (os metais fazem "uón-uón-uóóón")
    groove(6, 'G7');
    ch.note(6 * 16 + 2, 0, 0, 1);
    rd.note(6 * 16 + 5, 0, 0, 0.9);
    mel(met2, 6, ['r:8 D4:2 Db4:2 C4:4'], { vel: 0.7 });
    // 7 · o júri responde: Magikarp 2 (plof-plof), Pikachu 3 rindo (o pícolo imita), Snorlax 1 roncando
    groove(7, 'C9');
    mel(spl, 7, ['C6:1 r:1 C6:1 r:13'], { vel: 0.7 });
    mel(pc, 7, ['r:4 G5:1 r:1 G6:2 F6:1 E6:1 r:6'], { vel: 0.8 });
    zz.note(7 * 16 + 10, 0, 0, 0.6);
    // 8 · TENTATIVA 2, "maior é melhor": a pergunta insistente (ele mira o maior)... ONIX (BOING grave, o TUM do peso)
    groove(8, 'G7');
    mel(kz, 8, ['G4:1 G5:1 G4:1 G5:3 r:10']);
    drum(cr, 8, 1, '........X.......');
    boG.note(8 * 16 + 8, -7, 0, 1.3);
    tum.note(8 * 16 + 13, -3, 0, 1.1);
    mel(tuba, 8, ['r:8 G1:8'], { vel: 0.8 });
    // 9 · o Onix amolece e escorre (BOING escorregando uma oitava pra baixo, os metais descem junto); o chute passa
    // pelo buraco
    groove(9, 'G7');
    boE.note(9 * 16, 5, 0, 1.2);
    mel(met2, 9, ['r:4 F4:2 E4:2 Eb4:2 D4:2 r:4'], { vel: 0.8 });
    ch.note(9 * 16 + 11, 0, 0, 1);
    rd.note(9 * 16 + 13, 0, 0, 0.9);
    // 10 · breque: a banda corta no 1; o júri dá 1 · 1 · 1 (plof, pícolo, tuba, a mesma nota) e o PLOF do Magikarp
    // caindo da cadeira (o motivo dele do EP 2)
    stabs(met, 10, 'G7', [0], { low: 55, n: 4, len: 1 });
    stabs(gt, 10, 'G7', [0], { low: 60, n: 3 });
    mel(bs, 10, ['G2:1 r:15']);
    drum(kk, 10, 1, 'X...............');
    drum(cr, 10, 1, 'x...............', { vel: 0.6 });
    mel(spl, 10, ['r:2 D5:2 r:12'], { vel: 0.8 });
    mel(pc, 10, ['r:4 D6:1 r:11'], { vel: 0.8 });
    mel(tuba, 10, ['r:6 D2:2 r:8']);
    mel(spl, 10, ['r:8 G5:3 E5:3 C5:2'], { vel: 1 });
    // 11 · ele vira poça: o motivo desafina e cai, nota a nota; pinga
    torto(kz, 11, [
        ['G5', 3, 0],
        ['F5', 1, -0.2],
        ['E5', 2, -0.4],
        ['D5', 2, -0.7],
        ['B4', 2, -1.1],
        ['G4', 6, -1.7],
    ]);
    padChord(ep, 11, 'Em7', 8, { low: 52, n: 4, vel: 0.4 });
    padChord(ep, 11, 'Ebmaj7', 8, { low: 51, n: 4, vel: 0.35, at: 8 });
    pinga.note(11 * 16 + 11, 0, 0, 1);
    // 12 · o Magikarp senta do lado e mostra a medalha: o motivo lento e sozinho, no sino
    mel(sino, 12, ['G4:2 G5:6 E5:4 D5:4'], { vel: 0.6 });
    // 13 · TENTATIVA 3: ele fecha os olhos; virada longa, Mi♭7 leva a Lá♭ (sobe meio tom) e a música cresce
    drum(sn, 13, 1, 'x...x...x.x.xxxx', { vel: 0.7 });
    drum(sn, 13, 1, '.............xXX', { vel: 0.5 });
    drum(tp, 13, 1, 'x.......x...xxXX', { vel: 0.7 });
    drum(kk, 13, 1, 'X...X...X...X...');
    drum(hh, 13, 1, 'x.x.x.x.xxxxxxxx', { vel: 0.8 });
    bass(bs, 13, 'Eb7', '0:2 0:2 r:2 0:2 5:2 r:2 s:2 8:2');
    mel(met, 13, ['Bb3:4 C4:4 D4:4 Eb4:2 G4:2']);
    mel(met2, 13, ['G3:4 Ab3:4 Bb3:4 C4:2 Db4:2']);
    padChord(cor, 13, 'Eb7', 16, { low: 55, n: 4, vel: 0.6 });

    // 14 · o Snorlax PERFEITO: o motivo inteiro, cheio (kazoo + metais em terças, cordas)
    const ab = MAJOR(8);
    drum(cr, 14, 1, 'X...............');
    groove(14, 'G7', { s: 1 });
    mel(kz, 14, [MOTIVO], { shift: 1 });
    mel(met, 14, [MOTIVO], { shift: 1 - 12, harm: thirdBelow(ab), vel: 0.7 });
    padChord(cor, 14, 'Ab7', 16, { low: 56, n: 4, vel: 0.6 });
    // 15 · o Pikachu chuta forte... ELE DEFENDE: o BOING normal no encaixe da bola na barriga
    groove(15, 'C9', { s: 1 });
    ch.note(15 * 16 + 2, 0, 0, 1.1);
    bo.note(15 * 16 + 6, 1, 0, 1.2);
    drum(cr, 15, 1, '......X.........');
    drum(tp, 15, 1, '......X.........', { vel: 0.8 });
    stabs(met, 15, 'Db', [6], { low: 56, n: 4, len: 2 });
    mel(kz, 15, ['r:10 Ab4:1 r:1 Ab5:4'], { vel: 0.8 });
    // 16 · a cara volta sozinha (o BOING pequeno), um instante de silêncio, e o motivo rindo
    boP.note(16 * 16, 13, 0, 0.9);
    mel(kz, 16, ['r:8 G4:1 r:1 G5:2 E5:1 G5:1 E5:1 G5:1'], { shift: 1 });
    mel(bs, 16, ['r:8 G2:1 r:7'], { shift: 1 });
    stabs(gt, 16, 'Ab7', [10, 14], { low: 60, n: 3 });
    drum(hh, 16, 1, '........x.x.x.x.', { vel: 0.8 });
    drum(sn, 16, 1, '............x.xX', { vel: 0.8 });
    // 17 · EXPLODE: o Snorlax acorda, 10 · 10 · 10 (metais e palmas a cada placa), o motivo lá em cima
    drum(cr, 17, 1, 'X.......x.......');
    groove(17, 'C9', { s: 1 });
    stabs(met, 17, 'Ab', [0, 4, 8], { low: 56, n: 4, len: 2 });
    drum(cl, 17, 1, 'X...X...X...x.x.', { vel: 0.8 });
    festa.note(17 * 16, 0, 0, 1);
    mel(kz, 17, ['r:8 G5:1 r:1 G6:3 F6:1 E6:2'], { shift: 1 });
    padChord(cor, 17, 'Db9', 16, { low: 56, n: 4, vel: 0.6 });

    // 18 · FINAL · 1 × 1 · ÚLTIMO MINUTO: o estádio cheio, groove de partida e a fanfarra curta
    groove(18, 'C9', { s: 1, partida: true });
    fundo.note(18 * 16, 0, 0, 1);
    mel(met, 18, ['r:8 Db5:2 F5:2 Ab5:4'], { vel: 0.85 });
    mel(met2, 18, ['r:8 Ab4:2 Db5:2 F5:4'], { vel: 0.6 });
    // 19 · o apito (som da cena, linha 0), BOING: ele vira o Snorlax com a cara dele; a torcida rival ri. Groove de
    // partida até a linha 14 e corta.
    groove(19, 'G7', { s: 1, partida: true });
    fundo.note(19 * 16, 0, 0, 0.7);
    bo.note(19 * 16 + 2, 1, 0, 1.1);
    ri.note(19 * 16 + 8, 0, 0, 0.8);
    stabs(met, 19, 'Eb7', [14], { low: 55, n: 4, len: 2 });
    // 20 · o pênalti, o Charizard pega a bola: a música para (SILENCIOS)
    // 21–22 · o chute de fogo em câmera lenta: só o coração grave, em Lá, crescendo
    for (const [b, v] of [
        [21, 0.6],
        [22, 0.8],
    ]) {
        mel(tuba, b, ['A1:2 r:1 A1:2 r:3 A1:2 r:1 A1:2 r:3'], { vel: v });
        drum(kk, b, 1, 'x..x....x..x....', { vel: 0.55 * v });
    }

    // 23 · a defesa. Silêncio (linhas 0–3) e a torcida: "DIT-TO!" no salto de oitava; tudo volta meio tom acima (Lá)
    drum(cr, 23, 1, '....X...........');
    drum(tp, 23, 1, '....X...........');
    festa.note(23 * 16 + 4, 0, 0, 1.1);
    groove(23, 'G7', { s: 2 });
    mel(met, 23, ['r:4 A4:1 r:1 A5:4 r:2 A4:1 r:1 A5:2']);
    mel(kz, 23, ['r:4 A4:1 r:1 A5:4 r:2 A4:1 r:1 A5:2'], { vel: 0.9 });
    drum(cl, 23, 1, '......X.....x.X.', { vel: 0.8 });
    padChord(cor, 23, 'A7', 12, { low: 57, n: 4, vel: 0.6, at: 4 });
    // 24 · no banco, todos juntos: SOC-CER-MON (o gancho em Lá) com as palmas respondendo
    groove(24, 'G', { s: 2 });
    mel(kz, 24, [GANCHO.em({ tom: -3 })]);
    mel(met, 24, [GANCHO.em({ tom: -3, oitava: -1 })], { harm: thirdBelow(MAJOR(9)), vel: 0.7 });
    mel(met2, 24, [GANCHO.em({ tom: -3, oitava: -1 })], { vel: 0.6 });
    drum(cl, 24, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 24, 'A', 16, { low: 57, n: 4, vel: 0.6 });
    // 25 · o Ditto sorri com a cara dele: o motivo dele em Lá, e as palmas seguem no SOC-CER-MON
    groove(25, 'G', { s: 2 });
    mel(kz, 25, [MOTIVO], { shift: 2 });
    drum(cl, 25, 1, GANCHO.palmas, { vel: 0.8 });
    padChord(cor, 25, 'A', 16, { low: 57, n: 4, vel: 0.6 });
    // 26 · "EP 4?": o Ditto pergunta (o salto de oitava) sobre o groove leve, no Mi (a dominante)
    groove(26, 'D', { s: 2, leve: true });
    mel(kz, 26, ['r:4 A4:1 r:1 A5:4 r:6']);
    padChord(ep, 26, 'E7', 16, { low: 52, n: 4, vel: 0.4 });
    // 27 · tela final: o acorde de Lá e o fim no BOING (linha 12)
    stabs(met, 27, 'A', [0], { low: 57, n: 4, len: 2 });
    mel(bs, 27, ['A2:2 r:10 A1:4']);
    drum(kk, 27, 1, 'X...........X...');
    bo.note(27 * 16 + 12, 2, 0, 1.3);
    stabs(met, 27, 'A', [12], { low: 57, n: 4, len: 4 });
    drum(tp, 27, 1, '............X...', { vel: 0.8 });
    drum(cr, 27, 1, '............x...', { vel: 0.6 });
    return S;
}
