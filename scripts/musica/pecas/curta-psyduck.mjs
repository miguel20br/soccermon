// Psyduck e a dor de cabeça (trilha pra curta, 22/10/2026). O jogo passa em volta dele, que só segura a cabeça: o
// LATEJO ("TUM-tum", grave e abafado) marca o tempo e o "PSY?" (um grasnado afinado) responde cada frase do piano
// elétrico. Cada bolada na cabeça (BONK) faz o latejo crescer; ele acelera (colcheia, semicolcheia), tudo sobe meio
// tom, para... e o "PSYYY" vira a explosão psíquica: acorde de tons inteiros, sinos, tudo flutua em câmera lenta
// (notas ao contrário) e a bola entra boiando. Tudo despenca, gol, SOC-CER-MON. E ele não lembra de nada: "Psy?".
// Mi menor (funk leve, 100 BPM) → Fá menor (a dor sobe) → tons inteiros → Mi MAIOR no gol → Fá# maior.
// 15 compassos, ~36 s, sem loop.
import { flutua, lateja, quack, roteiro, sobe } from '../curtas.mjs';
import { bass, drum, GANCHO, I, mel, noteName, padChord, Song } from '../synth.mjs';
import { deslize, quique, rede, torcida } from './livre-ginasio.mjs';

export const meta = {
    titulo: 'Psyduck e a dor de cabeça',
    tela: 'Curta (vídeo): Psyduck e a explosão psíquica',
    premissa:
        'Psyduck só segura a cabeça enquanto leva boladas; a dor vira explosão psíquica, tudo flutua e a bola entra boiando. Ele não lembra de nada.',
};

export default function psyduck() {
    const S = new Song({ bpm: 100, bars: 15, swing: 0.08, tail: 4.5 });
    const { cena, ev } = roteiro(S);
    const ep = S.part('piano', I.epiano, { pan: -0.15, gain: 1.8, rev: 0.25 });
    const qk = S.part('psy', quack, { pan: 0.15, gain: 0.9, rev: 0.2 });
    const qkL = S.part('psyLento', quack, { pan: 0.15, gain: 0.8, echo: { rows: 4, fb: 0.4, mix: 0.4 }, rev: 0.5 });
    const lt = S.part('latejo', lateja, { drum: true, gain: 0.8 });
    const bk = S.part('bonk', quique, { drum: true, pan: 0.2, gain: 0.8, rev: 0.15 });
    const bkB = S.part('bonkBloco', I.block, { drum: true, pan: 0.2, gain: 0.6 });
    const bs = S.part('baixo', I.bass, { gain: 0.4, corte: 900 });
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.4 });
    const str = S.part('cordas', I.strings, { pan: 0.2, gain: 1.3, rev: 0.4 });
    const sino = S.part('sinos', I.bell, { pan: 0.25, gain: 1.6, echo: { rows: 3, fb: 0.35, mix: 0.3 }, rev: 0.5 });
    const fl = S.part('aoContrario', flutua, { pan: -0.2, gain: 0.6, rev: 0.5 });
    const zum = S.part('zumbido', I.counter, { gain: 0.25 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.9, corte: 3000, rev: 0.2 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1, corte: 3000, rev: 0.15 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.45 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.85 });
    const sh = S.part('chocalho', I.shaker, { drum: true, pan: 0.3, gain: 1.3 });
    const tom = S.part('tombos', I.tom, { drum: true, gain: 0.45, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });
    const psi = S.part('psiquico', sobe(1.2), { drum: true, gain: 0.5, rev: 0.4 });
    const cai = S.part('despenca', deslize(700, 40, 1.1), { drum: true, gain: 0.55, rev: 0.2 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.8, echo: { rows: 4, fb: 0.4, mix: 0.4 }, rev: 0.5 });
    const tc = S.part('torcida', torcida(6, 0.08, 2.5), { drum: true, gain: 0.5, rev: 0.3 });

    const groove = (b, c, dor) => {
        bass(bs, b, c, '0:3 0:1 r:2 0:2 r:2 5:2 s:2 8:2');
        drum(k, b, 1, 'x.....x...x.....', { vel: 0.7 });
        drum(cl, b, 1, '....x.......x...', { vel: 0.65 });
        drum(sh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.5 });
        drum(lt, b, 1, 'X..x............', { vel: dor });
    };
    const bonk = (b, r, v = 1) => {
        bk.note(b * 16 + r, 14, 0, v);
        bkB.note(b * 16 + r, -5, 0, v);
    };

    // TUM-tum... "Psy?"
    cena(0, 'a dor de cabeça');
    drum(lt, 0, 1, 'X..x............', { vel: 0.9 });
    mel(qk, 0, ['r:6 E5:2 r:1 A5:3 r:4'], { vel: 1.2 });
    padChord(pad, 0, 'Em7', 16, { low: 52, n: 4, vel: 0.4 });
    ev(0, 0, 'latejo "TUM-tum"', 'Psyduck parado no meio da quadra, mãos na cabeça');
    ev(0, 6, '"Psy?" (duas notas subindo)', 'ele inclina a cabeça, perdido');

    // o jogo em volta: o piano pergunta, o "psy" responde; cada bolada faz o latejo crescer
    cena(1, 'o jogo em volta');
    mel(ep, 1, [
        'E5:2 G5:2 B5:3 A5:1 G5:2 r:6',
        'A5:2 C6:2 E6:3 D6:1 C6:2 r:6',
        'G5:2 B5:2 E6:3 F#6:1 G6:2 r:6',
        'F#6:2 D#6:2 B5:2 A5:2 r:8',
    ]);
    mel(qk, 1, ['r:10 B4:2 E5:2 r:2', 'r:10 C5:2 r:4', 'r:10 E5:2 r:4', 'r:6 F#5:2 r:8']);
    for (const [i, c] of ['Em7', 'Am7', 'Em7', 'B7'].entries()) groove(1 + i, c, 0.6 + 0.12 * i);
    bonk(2, 12, 0.8);
    bonk(3, 12, 0.9);
    bonk(4, 10, 1);
    bonk(4, 13, 1.1);
    ev(1, 0, 'funk leve; o piano faz a pergunta', 'o jogo passa em volta dele; ninguém liga');
    ev(1, 10, '"psy-psy"', 'ele responde pro nada');
    ev(2, 12, 'BONK', '1ª bolada na cabeça; o latejo cresce');
    ev(3, 12, 'BONK', '2ª bolada; uma veia pulsa no TUM-tum');
    ev(4, 10, 'BONK BONK', 'duas boladas seguidas');

    // a dor aperta: o latejo acelera, o piano trava numa nota, tudo sobe meio tom
    cena(5, 'a dor aperta');
    mel(ep, 5, ['E5:2 E5:2 E5:2 E5:2 E5:2 E5:2 E5:2 E5:2']);
    drum(lt, 5, 1, 'X.x.X.x.X.x.X.x.', { vel: 0.9 });
    mel(qk, 5, ['r:12 E5:1 r:1 F5:1 r:1']);
    mel(bs, 5, ['E2:2 E2:2 E2:2 E2:2 E2:2 E2:2 E2:2 E2:2']);
    mel(ep, 6, ['F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 F5:1 r:4']);
    drum(lt, 6, 1, 'XxXxXxXxXxXxX...', { pitch: 1, vel: 1 });
    mel(qk, 6, ['r:8 F5:1 r:1 F#5:1 r:1 G5:1 r:1 G#5:1 r:1']);
    mel(bs, 6, ['F2:2 F2:2 F2:2 F2:2 F2:2 F2:2 r:4']);
    padChord(str, 5, 'Em', 16, { low: 52, n: 3, vel: 0.5 });
    padChord(str, 6, 'Fm', 12, { low: 53, n: 3, vel: 0.7 });
    drum(sh, 5, 2, 'xxxxxxxxxxxxxxxx', { vel: 0.4 });
    ev(5, 0, 'latejo em colcheias, o piano preso numa nota', 'a dor aperta: ele espreme a cabeça');
    ev(5, 12, '"psy, psy"', 'ele treme');
    ev(6, 0, 'tudo meio tom acima, latejo em semicolcheias', 'os olhos dele começam a brilhar azul');
    ev(6, 8, '"psy-psy-psy-psy" subindo', 'a cabeça vibra; a câmera chega perto');

    // silêncio... "PSYYY"
    cena(7, 'silêncio');
    mel(zum, 7, ['B6:16'], { vel: 0.6 });
    mel(qk, 7, ['r:8 E5:8']);
    mel(fl, 7, ['r:8 B5+E6:8']);
    psi.note(7 * 16 + 8, 0, 0, 1);
    ev(7, 0, 'silêncio, só um zumbido agudo', 'tudo para; o mundo congela');
    ev(7, 8, '"PSYYY..." e a força subindo', 'ele abre os olhos: brilho azul');

    // PSICO: tons inteiros, tudo flutua em câmera lenta, a bola entra boiando
    cena(8, 'explosão psíquica');
    cr.note(8 * 16, 0, 0, 1.2);
    mel(met, 8, ['E4+G#4+C5+D5:12 r:4']);
    mel(str, 8, ['E5+G#5+C6+D6:16', 'F#5+Bb5+D6:16', 'G#5+C6+E6:16']);
    mel(pad, 8, ['E3+Bb3+D4:16', 'C3+F#3+Bb3:16', 'D3+G#3+C4:16']);
    mel(bs, 8, ['E2:16', 'C2:16', 'D2:16']);
    const subida = Array.from({ length: 16 }, (_, i) => `${noteName(64 + 2 * i)}:1`).join(' '); // tons inteiros de Mi4
    mel(sino, 8, [subida]);
    ev(8, 0, 'PSICO! prato, acorde de tons inteiros, sinos subindo', 'onda azul: jogadores, juiz e bola sobem no ar');
    cena(9, 'câmera lenta');
    mel(sino, 9, ['E6:4 D6:4 C6:4 Bb5:4', 'C6:4 D6:4 E6:4 F#6:2 G#6:2']);
    mel(fl, 9, ['F#5:8 C6:8', 'D5+G#5:8 E5+Bb5:8']);
    mel(qkL, 9, ['r:4 E4:8 r:4']);
    rd.note(10 * 16 + 12, 0, 0, 0.9);
    ev(9, 0, 'sinos lentos em tons inteiros, notas ao contrário', 'tudo flutua em câmera lenta');
    ev(9, 4, '"psyyy" grave e lento, com eco', 'até o grito dele sai em câmera lenta');
    ev(10, 0, 'sinos subindo, um por vez', 'a bola boia sozinha rumo ao gol, um palmo por sino');
    ev(10, 12, 'rede, com eco', 'ela entra devagarinho');

    // tudo despenca
    cena(11, 'todo mundo cai');
    cai.note(11 * 16, 0, 0, 1);
    drum(tom, 11, 1, '........x.xx.x.X', { pitch: -3 });
    drum(k, 11, 1, '........x..x...X', { vel: 0.8 });
    ev(11, 0, 'tudo escorrega pro grave', 'a onda acaba');
    ev(11, 8, 'tum, tum-tum, tum... TUM (tons)', 'todo mundo cai no chão, um de cada vez; o juiz por último');

    // GOL: Mi maior, SOC-CER-MON, sobe um tom
    cena(12, 'gol');
    cr.note(12 * 16, 0, 0, 1);
    tc.note(12 * 16, 0, 0, 1);
    mel(met, 12, [GANCHO.em({ tom: 4 }), GANCHO.em({ tom: 6 })], { vel: 0.9 });
    mel(lead, 12, [GANCHO.em({ tom: 4, oitava: -1 }), GANCHO.em({ tom: 6, oitava: -1 })], { vel: 0.8 });
    drum(cl, 12, 2, GANCHO.palmas, { vel: 1 });
    for (const [i, c] of ['E', 'F#'].entries()) {
        const b = 12 + i;
        bass(bs, b, c, '0:3 0:1 r:2 0:2 r:2 5:2 s:2 8:2');
        padChord(pad, b, c, 16, { low: 52, n: 4, vel: 0.6 });
        drum(k, b, 1, 'X.....x...x.....');
        drum(cl, b, 1, '....x...........', { vel: 0.7 });
        drum(sh, b, 1, 'x.xxx.xxx.xxx.xx', { vel: 0.6 });
    }
    cr.note(13 * 16, 0, 0, 0.8);
    ev(12, 0, 'SOC-CER-MON em Mi MAIOR, torcida', 'o placar acende: GOL do Psyduck');
    ev(12, 12, 'palmas "hey hey"', 'a torcida bate palma');
    ev(13, 0, 'SOC-CER-MON um tom acima', 'o time levanta o Psyduck nos braços');

    // e ele não lembra de nada
    cena(14, 'final');
    padChord(met, 14, 'F#', 3, { low: 54, n: 4, vel: 0.8 });
    mel(bs, 14, ['F#2:3 r:13']);
    drum(lt, 14, 1, '....X..x........', { vel: 0.8 });
    mel(qk, 14, ['r:10 F#5:2 r:1 B5:3']);
    ev(14, 0, 'acorde curto', 'ele no colo do time');
    ev(14, 4, 'TUM-tum', 'a dor de cabeça volta');
    ev(14, 10, '"Psy?"', 'ele não lembra de nada');
    return S;
}
