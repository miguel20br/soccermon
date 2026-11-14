// Lance da semana nº 2: os 4 dribles (v3, 19,5 s; funk curto, começa no lance). Uma jogada só atravessando a quadra:
// Mew → Gengar → Pikachu → Charizard, e o MESMO Machop driblado nas 4, cada vez mais tonto, sentado no fim enquanto a
// bola entra. Cada drible vem em câmera lenta: o groove cai pra meio tempo (o acorde, o tímpano e o som do drible na
// batida) e volta quando a câmera lenta acaba; cada passe é um "fiu" (o deslize que desce) que leva a bola pro plano
// seguinte, onde ela chega com um toque leve. Os sons tirados da tela: a lambreta (Mew) é a bola subindo por trás e
// caindo na frente (BOING); a roleta (Gengar), o giro (o apito subindo e descendo, "fiu-fiu"); o elástico (Pikachu), a
// mola esticando e voltando, com o choque da Estática; o chapéu (Charizard), a subida longa com a bola no alto, o
// "hã?" do Machop e o tombo dele (BOING grave). O "hã?" do kazoo sobe um degrau a cada drible (a tontura crescendo).
// Do chute ao gol a caixa e o tímpano rolam, e o GOL vem meio tom acima (Sol → Lá♭), com a torcida; a festa dos 4 em
// volta do Machop sentado; na tela final (a dos curtas do Vestiário) o SOC-CER-MON e o fim no BOING pequeno.
// Tomadas (scripts/trailer-capture.mjs --vertical 460 --faixa --foco --so-lento --palco; ?demo=dribles&nosso=1&
// rival=74,66,56,57,106&k=&em=, --drible tick:tipo --tonto n): lambreta k=1181 tick 3121 (time 143,6,25,94,151),
// roleta k=303 tick 1609 (143,6,151,25,94), elástico k=346 tick 789 (143,6,151,94,25, --faixa-y 0.2), chapéu k=702
// tick 3164 (143,151,94,25,6, --gol --faixa-y 0.8 --sem-poeira).
// Tempos do vídeo (s): lambreta (lento 0,43–2,03; drible 1,03) · passe 2,45 · roleta (bola chega 2,95; lento
// 3,83–5,33; drible 4,23) · passe 5,13 · elástico (lento 6,7–8,3; drible 7,3) · passe 8,2 · chapéu (lento 8,67–11,5;
// drible 9,43; o Machop cai 10,2) · chute 12,0 · GOL 12,67 · corte pra festa 13,8 · tela final 16,3 (SOC 17,0,
// CER 17,375, MON 17,75) · fim 19,5.
// 120 BPM, 4/4, compasso = 2 s (linha = 0,125 s), 10 compassos.
import { flutua, kazoo, mola, sobe } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, deslize, quique, rede, torcida, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Os 4 dribles', tela: 'Lance da semana nº 2 (clipe)' };

export default function dribles() {
    const S = new Song({ bpm: 120, bars: 10, swing: 0.1, tail: 1.5 });
    const fl = S.part('flutua', flutua, { pan: -0.05, gain: 1, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const kz = S.part('kazoo', kazoo, { pan: 0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const sb = S.part('sobe', sobe(0.35), { drum: true, pan: -0.1, gain: 1.3, rev: 0.2 });
    const sbL = S.part('sobeLongo', sobe(0.6), { drum: true, pan: -0.1, gain: 1.4, rev: 0.2 });
    const ap = S.part('apito', I.whistle, { pan: 0.15, gain: 1.1, rev: 0.2 });
    const apD = S.part('apitoDesce', I.whistleDown, { pan: -0.15, gain: 1.1, rev: 0.2 });
    const fiu = S.part('fiu', deslize(1900, 650, 0.16), { drum: true, pan: 0.25, gain: 0.55, rev: 0.25 });
    const toque = S.part('toque', quique, { drum: true, pan: -0.1, gain: 0.7, rev: 0.15 });
    const bo = S.part('boing', mola(), { pan: 0.1, gain: 1.2, rev: 0.2 });
    const tombo = S.part('tombo', mola({ seg: 0.9, desce: 14, balanco: 9 }), { pan: -0.1, gain: 1.3, rev: 0.25 });
    const estica = S.part('estica', mola({ seg: 0.5, balanco: 20 }), { pan: -0.1, gain: 1.2, rev: 0.2 });
    const choque = S.part('choque', zap, { drum: true, pan: 0.2, gain: 0.6, rev: 0.15 });
    const boP = S.part('boingPequeno', mola({ seg: 0.35, balanco: 18 }), { pan: 0.2, gain: 1.5, rev: 0.2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.8, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.32, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.6 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.8, rev: 0.3 });
    const festa = S.part('festa', torcida(3.5, 0.08, 2), { drum: true, gain: 0.6, rev: 0.3 });
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
    const L = 16;
    /** Linha absoluta do segundo `s` do vídeo (linha = 0,125 s). */
    const R = (s) => Math.round(s * 8);
    /** Melodia a partir de uma linha qualquer, atravessando a barra do compasso. */
    const frase = (P, t0, str, { shift = 0, harm = null, vel = 1 } = {}) => {
        let t = t0;
        for (const tok of str.trim().split(/\s+/)) {
            const [n, len] = tok.split(':');
            if (n !== 'r') {
                const m = midi(n) + shift;
                P.note(t, harm ? harm(m) : m, Number(len), vel);
            }
            t += Number(len);
        }
    };
    /** A parte só com as notas entre as linhas r0 e r1 (o groove recortado pra caber entre as câmeras lentas). */
    const corta = (P, r0, r1) => ({
        song: P.song,
        name: P.name,
        note: (t, ...a) => t >= r0 && t < r1 && P.note(t, ...a),
    });

    /** O funk da casa entre os segundos a e b do vídeo (no compasso de verdade), `s` = semitons acima. */
    const groove = (a, b, c0, s = 0) => {
        const [r0, r1] = [R(a), R(b)];
        const c = transpose(c0, s);
        for (let bar = Math.floor(r0 / L); bar * L < r1; bar++) {
            drum(corta(kk, r0, r1), bar, 1, 'X.....x...x..x..');
            drum(corta(sn, r0, r1), bar, 1, '....X..o.o..X..o');
            drum(corta(hh, r0, r1), bar, 1, 'x.xx.x.xx.xx.x.x');
            bass(corta(bs, r0, r1), bar, c, '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2');
            stabs(corta(gt, r0, r1), bar, c, [2, 6, 10, 14], { low: 60, n: 3 });
            stabs(corta(cv, r0, r1), bar, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
        }
    };
    /** Câmera lenta: meio tempo (bumbo na 1 e na 3 do meio tempo, o acorde segurando e o tímpano). */
    const lento = (a, b, sym) => {
        const [r0, r1] = [R(a), R(b)];
        for (let r = r0; r < r1; r += 8) kk.note(r, 0, 0, r === r0 ? 1 : 0.6);
        bs.note(r0, midi(sym === 'C9' ? 'C2' : sym === 'D7' ? 'D2' : 'G1'), r1 - r0, 0.8);
        for (const m of [
            ...(sym === 'C9'
                ? ['E4', 'G4', 'Bb4', 'D5']
                : sym === 'D7'
                  ? ['F#4', 'A4', 'C5', 'D5']
                  : ['F4', 'G4', 'B4', 'D5']),
        ])
            cor.note(r0, midi(m), r1 - r0, 0.55);
        for (let r = r0 + 4; r < r1; r += 8) tp.note(r, 0, 0, 0.45);
    };
    /** A pergunta que sobe um degrau a cada drible, e os metais respondendo. */
    const g = MAJOR(7);
    const motivo = ['D5:1 G5:1 B5:1 D6:3', 'E5:1 A5:1 C6:1 E6:3', 'F#5:1 B5:1 D6:1 F#6:3'];
    const pergunta = (s, d) => {
        frase(fl, R(s), motivo[d]);
        frase(met2, R(s) + 6, motivo[d].replace(/:3$/, ':2'), { harm: thirdBelow(g), vel: 0.6 });
    };
    /** O "hã?" do Machop, um degrau mais alto (e mais torto) a cada drible. */
    const ha = ['D5:1 F5:3', 'E5:1 G5:1 F#5:2', 'F#5:1 A5:1 G#5:1 A5:2', 'G5:1 Bb5:1 A5:1 Bb5:1 A5:3'];

    // LAMBRETA (Mew): o groove no 1º quadro e a câmera lenta em 0,43; a bola sobe por trás (0,75), o drible (1,03), a
    // bola cai na frente (BOING, 1,4) e o "hã?"; o groove volta (2,03) e o passe sai (fiu, 2,45)
    cr.note(0, 0, 0, 0.6);
    groove(0, 0.43, 'G7');
    lento(0.43, 2.0, 'G7');
    pergunta(0.5, 0);
    sb.note(R(0.65), 0, 0, 1);
    bo.note(R(1.38), 4, 0, 1);
    frase(kz, R(1.5), ha[0], { vel: 0.8 });
    groove(2.0, 2.5, 'G7');
    fiu.note(R(2.42), 0, 0, 1);
    // ROLETA (Gengar): a bola chega (toque, 2,95), groove em Dó; câmera lenta 3,83: o giro na batida do drible (4,23),
    // o apito sobe e desce; o "hã?" mais alto (a tontura do giro); o passe (5,13)
    groove(2.5, 3.83, 'C9');
    toque.note(R(2.95), 4, 0, 1);
    pergunta(3.0, 1);
    lento(3.83, 5.33, 'C9');
    ap.note(R(4.13), 79, 1.5, 0.9);
    apD.note(R(4.38), 79, 1.5, 0.9);
    frase(kz, R(4.6), ha[1], { vel: 0.85 });
    fiu.note(R(5.1), 2, 0, 1);
    // ELÁSTICO (Pikachu): groove em Sol (5,37), Pikachu acha a bola (toque, 5,85); câmera lenta 6,7: a mola estica
    // (7,15) e volta (7,45), o choque da Estática e o "hã?" ainda mais alto; o passe (8,2)
    groove(5.33, 6.7, 'G7');
    toque.note(R(5.85), 6, 0, 0.9);
    pergunta(5.75, 2);
    lento(6.7, 8.3, 'G7');
    estica.note(R(7.13), -3, 0, 1);
    estica.note(R(7.45), 4, 0, 0.9);
    choque.note(R(7.6), 0, 0, 1);
    frase(kz, R(7.75), ha[2], { vel: 0.9 });
    fiu.note(R(8.17), 4, 0, 1);
    // CHAPÉU (Charizard): um compasso curto de groove; câmera lenta 8,67: a subida longa com a bola no alto, o drible
    // (9,43), o "hã?" e o tombo do Machop (10,2); o groove volta (11,5) com a caixa e o tímpano rolando até o chute (12,0)
    groove(8.33, 8.67, 'D7');
    lento(8.67, 11.5, 'D7');
    sbL.note(R(8.8), 0, 0, 1);
    frase(fl, R(8.75), 'D5:1 G5:1 B5:1 D6:5', { vel: 0.9 });
    frase(kz, R(9.6), ha[3], { vel: 0.9 });
    tombo.note(R(10.15), 0, 0, 1.1);
    drum(tp, R(11.5) / L, 1, 'x.x.xxxx........', { vel: 0.7 });
    drum(sn, R(11.5) / L, 1, 'x.xxxxxx........', { vel: 0.6 });
    kk.note(R(11.5), 0, 0, 1);
    stabs(gt, R(11.5) / L, 'D7', [0, 2], { low: 60, n: 3 });
    ch.note(R(12.0), 0, 0, 1.1);
    drum(sn, R(12.0) / L, 1, 'xxxxx...........', { vel: 0.7 });
    drum(tp, R(12.0) / L, 1, 'x.xxX...........', { vel: 0.8 });
    // GOL (12,67): prato, rede, torcida e tudo meio tom acima (Lá♭), o motivo inteiro nos metais
    const ab = MAJOR(8);
    const gol = R(12.67);
    cr.note(gol, 0, 0, 1.15);
    rd.note(gol, 0, 0, 1);
    festa.note(gol, 0, 0, 1);
    kk.note(gol, 0, 0, 1.15);
    stabs(met, gol / L, 'Ab', [0], { low: 56, n: 4, len: 3 });
    bs.note(gol, midi('Ab1'), 6, 1);
    padChord(cor, gol / L, 'Ab', 9, { low: 56, n: 4, vel: 0.55 });
    frase(fl, gol + 3, 'D5:1 G5:1 B5:1 D6:3', { shift: 1 });
    // a festa dos 4 em volta do Machop sentado (13,8: o BOING pequeno no corte), o groove em Lá♭ com palmas
    boP.note(R(13.75), 13, 0, 0.9);
    groove(13.75, 16.25, 'G7', 1);
    drum(cl, 7, 1, '....X.......X...', { vel: 0.8 });
    frase(fl, R(14.0), 'D5:1 G5:1 B5:1 D6:3 B5:1 D6:5', { shift: 1 });
    frase(met, R(14.0), 'D5:1 G5:1 B5:1 D6:3 B5:1 D6:5', { shift: 1 - 12, harm: thirdBelow(ab), vel: 0.6 });
    padChord(cor, R(14.0) / L, 'Ab', 16, { low: 56, n: 4, vel: 0.5 });
    drum(cl, 7.5, 1, '....X.......X...', { vel: 0.8 });
    // tela final (16,3): o SOC-CER-MON (17,0 / 17,375 / 17,75) com as palmas, o acorde final (18,0) e o BOING pequeno
    cr.note(R(16.25), 0, 0, 0.7);
    kk.note(R(16.25), 0, 0, 0.8);
    padChord(cor, R(16.25) / L, 'Db', 6, { low: 56, n: 4, vel: 0.45 });
    const hino = R(17.0);
    frase(fl, hino, GANCHO.em({ tom: 1, ritmo: [3, 3, 6, 0] }));
    frase(met, hino, GANCHO.em({ tom: 1, oitava: -1, ritmo: [3, 3, 6, 0] }), { harm: thirdBelow(ab), vel: 0.7 });
    drum(cl, hino / L, 1, 'X..X..X.........', { vel: 0.9 });
    drum(kk, hino / L, 1, 'X.......X.......');
    drum(hh, hino / L, 1, 'x.xx.x.x........');
    padChord(cor, hino / L, 'Db', 8, { low: 56, n: 4, vel: 0.5 });
    stabs(met, hino / L, 'Ab', [8], { low: 56, n: 4, len: 6 });
    mel(bs, hino / L, ['Db2:2 r:2 Db2:2 r:2 Ab1:6 r:2']);
    cr.note(hino + 8, 0, 0, 0.6);
    boP.note(R(19.0), 13, 0, 1);
    return S;
}
