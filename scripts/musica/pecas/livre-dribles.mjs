// Lance da semana nº 2: os 4 dribles (v2, 16,5 s; funk curto, começa no lance). Um drible por compasso, cada um com o
// seu Pokémon e o seu som tirado da tela: a lambreta (Mew) é a bola subindo por trás (o ruído que sobe) e caindo na
// frente (BOING); a roleta (Gengar), o giro (o apito que sobe e desce, "fiu-fiu"); o elástico (Pikachu), a mola
// esticando pra um lado e voltando pro outro. O chapéu (Charizard) vem em câmera lenta: o groove cai pra meio tempo
// (só o acorde, a subida longa e o tímpano) com a bola no alto, o "hã?" de quem ficou, o BOING quando ela cai do outro
// lado e o groove volta; do chute ao gol a caixa e o tímpano rolam, e o GOL vem meio tom acima (Sol → Lá♭), com a
// torcida. A comemoração, e na tela final (a dos curtas do Vestiário) o SOC-CER-MON e o fim no BOING pequeno.
// Tomadas (scripts/trailer-capture.mjs --vertical 528 --faixa; ?demo=dribles&nosso=1&time=143,25,6,94,151): lambreta
// `quem=151&k=75` (--faixa-y 0.72) quadros 40–99, roleta `quem=94&k=332` 72–131, elástico `quem=25&k=539` 100–159,
// chapéu `quem=6&gol=1&k=315` (--faixa-y 0.72 --lento 105.4:106.0:0.55:0.35 --faixa-atraso 300) 71–295.
// Tempos do vídeo (s): lambreta 0 (bola sobe 0,5, cai 1,3) · roleta 2 (giro 2,8) · elástico 4 (4,8) · chapéu 6 (lento
// de 6,5; bola sobe 7,0, no alto 7,5, cai 8,4) · chute 9,1 · GOL 10,5 · corte pro Charizard 11,6 · tela final 13,5
// (SOC 14,0, CER 14,4, MON 14,75) · fim 16,5.
// 120 BPM, 4/4, compasso = 2 s (linha = 0,125 s), 8 compassos.
import { flutua, kazoo, mola, sobe } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, midi, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Os 4 dribles', tela: 'Lance da semana nº 2 (clipe)' };

export default function dribles() {
    const S = new Song({ bpm: 120, bars: 8, swing: 0.1, tail: 1.5 });
    const fl = S.part('flutua', flutua, { pan: -0.05, gain: 1, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const kz = S.part('kazoo', kazoo, { pan: 0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const sb = S.part('sobe', sobe(0.35), { drum: true, pan: -0.1, gain: 1.3, rev: 0.2 });
    const sbL = S.part('sobeLongo', sobe(0.5), { drum: true, pan: -0.1, gain: 1.4, rev: 0.2 });
    const ap = S.part('apito', I.whistle, { pan: 0.15, gain: 1.1, rev: 0.2 });
    const apD = S.part('apitoDesce', I.whistleDown, { pan: -0.15, gain: 1.1, rev: 0.2 });
    const bo = S.part('boing', mola(), { pan: 0.1, gain: 1.2, rev: 0.2 });
    const estica = S.part('estica', mola({ seg: 0.5, balanco: 20 }), { pan: -0.1, gain: 1.2, rev: 0.2 });
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
    /** Linha absoluta (compasso, linha). */
    const at = (b, r) => b * L + r;
    /** Melodia a partir de uma linha qualquer, atravessando a barra do compasso (o `mel` confere compasso a compasso). */
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

    /** O funk da casa (`s` = semitons acima). */
    const groove = (b, c0, s = 0) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, 'X.....x...x..x..');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x');
        bass(bs, b, c, '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2');
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    /** A pergunta que sobe, um degrau mais alto a cada drible, e os metais respondendo no fim do compasso. */
    const g = MAJOR(7);
    const motivo = ['D5:1 G5:1 B5:1 D6:3', 'E5:1 A5:1 C6:1 E6:3', 'F#5:1 B5:1 D6:1 F#6:3'];
    const pergunta = (b, d, linha) => {
        frase(fl, at(b, linha), motivo[d]);
        frase(met2, at(b, 10), motivo[d].replace(/:3$/, ':2'), { harm: thirdBelow(g), vel: 0.6 });
    };

    // 0 · LAMBRETA (Mew): o groove no 1º quadro; a bola sobe por trás (0,5 s) e cai na frente do Flareon (BOING, 1,3)
    drum(cr, 0, 1, 'x...............', { vel: 0.6 });
    groove(0, 'G7');
    pergunta(0, 0, 1);
    sb.note(at(0, 3), 0, 0, 1);
    bo.note(at(0, 10), 4, 0, 1);
    // 1 · ROLETA (Gengar): o giro de 360 (2,8 s) é o apito subindo e descendo ("fiu-fiu")
    groove(1, 'C9');
    pergunta(1, 1, 0);
    ap.note(at(1, 5), 79, 1.5, 0.9);
    apD.note(at(1, 7), 79, 1.5, 0.9);
    // 2 · ELÁSTICO (Pikachu): a mola esticando pra um lado e voltando pro outro (4,8 s)
    groove(2, 'G7');
    pergunta(2, 2, 0);
    estica.note(at(2, 4), -3, 0, 1);
    estica.note(at(2, 7), 4, 0, 0.9);
    // 3 · CHAPÉU (Charizard): o groove até a câmera lenta (6,5 s); aí meio tempo: o acorde, a subida longa com a bola no
    // alto (7,0 → 7,5) e o "hã?" do Weepinbell
    drum(kk, 3, 1, 'X.....x.X.......');
    drum(sn, 3, 1, '....X...........');
    drum(hh, 3, 1, 'x.xx.x..........');
    bass(bs, 3, 'D7', '0:2 8:1~ r:1 5:4 r:8');
    stabs(gt, 3, 'D7', [2, 6], { low: 60, n: 3 });
    padChord(cor, 3, 'D7', 8, { low: 55, n: 4, vel: 0.6, at: 8 });
    sbL.note(at(3, 7), 0, 0, 1);
    frase(fl, at(3, 6), 'D5:1 G5:1 B5:1 D6:5', { vel: 0.9 });
    drum(tp, 3, 1, '........x...x.x.', { vel: 0.5 });
    frase(kz, at(3, 13), 'D5:1 F5:3', { vel: 0.8 });
    // 4 · a bola cai do outro lado (BOING, 8,4 s) e o groove volta; o chute (9,1); caixa e tímpano rolando no Ré
    // (dominante) até o gol
    bo.note(at(4, 3), 7, 0, 1.1);
    drum(cr, 4, 1, '....x...........', { vel: 0.5 });
    drum(kk, 4, 1, '....X.....x.....');
    drum(hh, 4, 1, '....x.xx.x......');
    bass(bs, 4, 'D7', 'r:4 0:2 5:2 r:1 0:1 r:6');
    stabs(gt, 4, 'D7', [6, 8], { low: 60, n: 3 });
    ch.note(at(4, 9), 0, 0, 1.1);
    drum(sn, 4, 1, '.........x.xxxxx', { vel: 0.6 });
    drum(tp, 4, 1, '.........x.x.xxx', { vel: 0.7 });
    drum(sn, 5, 1, 'xxxx............', { vel: 0.7 });
    drum(tp, 5, 1, 'x.xX............', { vel: 0.8 });
    padChord(cor, 4, 'D7', 16, { low: 55, n: 4, vel: 0.6 });
    // 5 · GOL na linha 4 (10,5 s): prato, rede, torcida e tudo meio tom acima (Lá♭), o motivo inteiro nos metais
    const ab = MAJOR(8);
    cr.note(at(5, 4), 0, 0, 1.15);
    rd.note(at(5, 4), 0, 0, 1);
    festa.note(at(5, 4), 0, 0, 1);
    kk.note(at(5, 4), 0, 0, 1.15);
    stabs(met, 5, 'Ab', [4], { low: 56, n: 4, len: 3 });
    mel(bs, 5, ['r:4 Ab2:2 r:1 Ab2:1 r:2 Eb2:2 r:4']);
    padChord(cor, 5, 'Ab', 12, { low: 56, n: 4, vel: 0.55, at: 4 });
    frase(fl, at(5, 7), 'D5:1 G5:1 B5:1 D6:3 B5:1 D6:5', { shift: 1 });
    frase(met, at(5, 7), 'D5:1 G5:1 B5:1 D6:3 B5:1 D6:5', { shift: 1 - 12, harm: thirdBelow(ab), vel: 0.6 });
    drum(cl, 5, 1, '............X..X', { vel: 0.7 });
    // 6 · a comemoração (corte pro Charizard em 11,6 s: o BOING pequeno); a tela final chega em 13,5 (linha 12)
    groove(6, 'G7', 1);
    boP.note(at(5, 13), 13, 0, 0.9);
    drum(cl, 6, 1, '....X.......X...', { vel: 0.8 });
    padChord(cor, 6, 'Ab', 12, { low: 56, n: 4, vel: 0.5 });
    cr.note(at(6, 12), 0, 0, 0.7);
    // 7 · o SOC-CER-MON (14,0 / 14,4 / 14,75) com as palmas, o acorde final (15,0) e o fim no BOING pequeno
    const hino = GANCHO.em({ tom: 1, ritmo: [3, 3, 6, 0] });
    frase(fl, at(7, 0), hino);
    frase(met, at(7, 0), GANCHO.em({ tom: 1, oitava: -1, ritmo: [3, 3, 6, 0] }), { harm: thirdBelow(ab), vel: 0.7 });
    drum(cl, 7, 1, 'X..X..X.........', { vel: 0.9 });
    drum(kk, 7, 1, 'X.......X.......');
    drum(hh, 7, 1, 'x.xx.x.x........');
    padChord(cor, 7, 'Db', 8, { low: 56, n: 4, vel: 0.5 });
    stabs(met, 7, 'Ab', [8], { low: 56, n: 4, len: 6 });
    mel(bs, 7, ['Db2:2 r:2 Db2:2 r:2 Ab1:6 r:2']);
    cr.note(at(7, 8), 0, 0, 0.6);
    boP.note(at(7, 13), 13, 0, 1);
    return S;
}
