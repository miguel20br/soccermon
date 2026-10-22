// Gengar, o goleiro fantasma (trilha pra curta, 22/10/2026). Ele some do gol, reaparece, apronta com o atacante e,
// no fim, faz o gol de goleiro, do outro lado da quadra. Swing assombrado: teremim no lead (o motivo Ré-Fá-Lá-Sol#,
// uma pergunta torta), trompete com surdina respondendo "uá-uá" (as caretas dele), baixo andando, escovinha, estalo
// de dedo (o clap 808 mais agudo e seco) no 2 e no 4, órgão nos contratempos. Os sons do Gengar são instrumentos:
// SOME ("fwip" ao contrário), APARECE ("bwoop"), a RISADINHA "ke-ke-ke" e a LAMBIDA.
// Ré menor, 116 BPM com swing de tercina (swingUnit 8). Forma: o sorriso (1) | A: Q&A teremim × surdina (4) |
// 1º chute: some e reaparece (1) | stop-time (1) | as pegadinhas e a lambida (2) | ele sai driblando, atravessando os
// zagueiros (3) | Shadow Ball (1) | GOL e SOC-CER-MON (1) | SOC-CER-MON meio tom acima (1) | a luz apaga (1).
// 16 compassos, ~33 s, sem loop.
import { aparece, lambida, risadinha, roteiro, sobe, some, teremim } from '../curtas.mjs';
import { drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { chute, luva, rede, torcida } from './livre-ginasio.mjs';

export const meta = {
    titulo: 'Gengar, o goleiro fantasma',
    tela: 'Curta (vídeo): Gengar no gol',
    premissa:
        'Gengar é o goleiro: some do gol, reaparece, apronta com o atacante e faz o gol de goleiro, do outro lado da quadra.',
};

export default function gengar() {
    const S = new Song({ bpm: 116, bars: 16, swing: 0.3, swingUnit: 8, tail: 4 });
    const { cena, ev } = roteiro(S);
    const th = S.part('teremim', teremim, { pan: -0.1, gain: 0.8, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.35 });
    const tp = S.part('surdina', I.brass, { pan: 0.3, gain: 0.85, corte: 1500, rev: 0.25 });
    const org = S.part('orgao', I.organ, { pan: -0.25, gain: 0.6, corte: 2400, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.5, corte: 900 });
    const vib = S.part('vibrafone', I.bell, { pan: 0.25, gain: 1.4, echo: { rows: 3, fb: 0.3, mix: 0.25 }, rev: 0.35 });
    const str = S.part('cordas', I.strings, { pan: 0.1, gain: 1.4, rev: 0.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.3 });
    const ride = S.part('condução', I.hat, { drum: true, pan: 0.35, gain: 1.2 });
    const esc = S.part('escovinha', I.shaker, { drum: true, pan: -0.3, gain: 1.4 });
    const dedo = S.part('estalo', I.clap808.com({ ganho: 0.4, corte: 7000, sala: 0.2, tom: 5 }), {
        drum: true,
        gain: 0.75,
    });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });
    const ap = S.part('aparece', aparece, { drum: true, gain: 0.9, rev: 0.3 });
    const apE = S.part('apareceEsq', aparece, { drum: true, pan: -0.7, gain: 0.9, rev: 0.3 });
    const apD = S.part('apareceDir', aparece, { drum: true, pan: 0.7, gain: 0.9, rev: 0.3 });
    const sm = S.part('some', some, { drum: true, gain: 1, rev: 0.35 });
    const rk = S.part('risadinha', risadinha, { drum: true, pan: 0.15, gain: 1, rev: 0.3 });
    const lb = S.part('lambida', lambida, { drum: true, gain: 1, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const lv = S.part('luva', luva, { drum: true, gain: 0.8, rev: 0.25 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.8, rev: 0.45 });
    const sb = S.part('sombra', sobe(1.5), { drum: true, gain: 0.5, rev: 0.4 });
    const tc = S.part('torcida', torcida(4, 0.1, 1.5), { drum: true, gain: 0.4, rev: 0.4 });

    const swing = (b, cheio = true) => {
        drum(ride, b, 1, 'x...x.x.x...x.x.', { vel: 0.7 });
        drum(esc, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
        drum(dedo, b, 1, '....x.......x...', { vel: 0.8 });
        if (cheio) drum(k, b, 1, 'x.......x.......', { vel: 0.5 });
    };
    const anda = (b, linha) => mel(bs, b, [linha]);
    const comp = (b, c) => stabs(org, b, c, [6, 14], { low: 57, n: 4, len: 2, vel: 0.7 });

    // o sorriso aparece no gol escuro
    cena(0, 'o sorriso');
    ap.note(0, 0, 0, 1);
    mel(th, 0, ['D5:3 F5:3 A5:2 G#5:6 r:2']);
    mel(bs, 0, ['D2:16'], { vel: 0.6 });
    padChord(org, 0, 'Dm', 12, { low: 50, n: 3, vel: 0.35 });
    rk.note(13, 0, 0, 1);
    ev(0, 0, 'bwoop + o motivo no teremim (Ré-Fá-Lá-Sol♯)', 'gol escuro: o sorriso do Gengar acende');
    ev(0, 13, 'ke-ke-ke', 'ele ri');

    // A: teremim pergunta, a surdina responde (as caretas)
    cena(1, 'o atacante vem');
    mel(th, 1, [
        'D5:3 F5:3 A5:2 r:8',
        'Bb5:3 A5:3 G5:2 r:8',
        'D5:3 F5:3 A5:2 D6:3 C#6:3 r:2',
        'Bb5:2 A5:2 G5:2 E5:2 r:8',
    ]);
    mel(tp, 1, ['r:8 G#4:2 A4:4 r:2', 'r:8 C#5:2 D5:4 r:2', 'r:16', 'r:8 E4:2 F4:2 G4:2 A4:2']);
    anda(1, 'D2:4 F2:4 A2:4 B2:4');
    anda(2, 'G2:4 Bb2:4 D3:4 E3:4');
    anda(3, 'D3:4 A2:4 F2:4 D2:4');
    anda(4, 'A2:4 C#3:4 E3:4 G3:4');
    for (const [i, c] of ['Dm6', 'Gm6', 'Dm6', 'A7b9'].entries()) {
        comp(1 + i, c);
        swing(1 + i);
    }
    ev(1, 0, 'swing: teremim pergunta', 'o atacante vem driblando; Gengar balança no gol, de braços cruzados');
    ev(1, 8, 'surdina "uá-uá"', 'Gengar faz careta');
    ev(2, 8, 'surdina "uá-uá"', 'mostra a língua');
    ev(4, 8, 'surdina subindo', 'o atacante arma o chute');

    // 1º chute: some, o gol vazio, reaparece e agarra
    cena(5, 'o 1º chute');
    ch.note(5 * 16, 0, 0, 1.1);
    sm.note(5 * 16 + 1, 0, 0, 1);
    stabs(org, 5, 'Dm', [[0, 1]], { low: 57, n: 3, vel: 0.8 });
    ap.note(5 * 16 + 8, 2, 0, 1);
    lv.note(5 * 16 + 9, 0, 0, 1);
    stabs(org, 5, 'Dm6', [[9, 2]], { low: 57, n: 4, vel: 0.8 });
    rk.note(5 * 16 + 12, 0, 0, 1);
    anda(5, 'r:8 D2:4 A2:4');
    ev(5, 0, 'chute', 'o atacante chuta com tudo');
    ev(5, 1, 'fwip (some)', 'Gengar some: o gol fica vazio');
    ev(5, 4, 'silêncio', 'o atacante já comemora');
    ev(5, 8, 'bwoop + luva', 'Gengar reaparece na frente da bola e agarra');
    ev(5, 12, 'ke-ke-ke', 'ri da cara dele');

    // stop-time: o atacante congela
    cena(6, 'congelado');
    stabs(
        org,
        6,
        'Bb7',
        [
            [0, 2],
            [6, 2],
        ],
        { low: 56, n: 4, vel: 0.9 },
    );
    drum(cr, 6, 1, 'x.....x.........', { vel: 0.5 });
    mel(bs, 6, ['Bb1:2 r:4 Bb1:2 r:8']);
    mel(th, 6, ['r:8 A5:2 G#5:2 G5:2 F#5:2']);
    ev(6, 0, 'dois acordes de órgão (stop-time)', 'o atacante congela de boca aberta');
    ev(6, 8, 'teremim descendo cromático', 'Gengar devolve a bola rolando, debochando');

    // as pegadinhas: aparece de um lado, do outro, em cima... e a lambida
    cena(7, 'pegadinhas');
    apE.note(7 * 16, 0, 0, 1);
    apD.note(7 * 16 + 8, 3, 0, 1);
    mel(th, 7, ['r:2 D6:3 r:5 F6:3 r:3', 'r:2 A6:3 r:11']);
    ap.note(8 * 16, 7, 0, 1);
    lb.note(8 * 16 + 8, 0, 0, 1);
    mel(str, 8, ['r:10 D5+Eb5:1 D5+Eb5:1 D5+Eb5:1 D5+Eb5:1 D5+Eb5:1 D5+Eb5:1']);
    mel(vib, 8, ['r:10 A5:1 Bb5:1 A5:1 Bb5:1 A5:1 Bb5:1']);
    anda(7, 'D2:4 F2:4 A2:4 B2:4');
    anda(8, 'G2:4 Bb2:4 r:8');
    comp(7, 'Dm6');
    swing(7);
    swing(8, false);
    ev(7, 0, 'bwoop à esquerda', 'Gengar aparece do lado esquerdo do atacante');
    ev(7, 8, 'bwoop à direita', '...do lado direito');
    ev(8, 0, 'bwoop no alto', '...em cima da cabeça dele');
    ev(8, 8, 'LAMBIDA', 'e dá uma lambida na cara dele');
    ev(8, 10, 'cordas e vibrafone tremendo', 'o atacante fica paralisado, tremendo');

    // ele sai do gol driblando: cada fwip é um zagueiro atravessado
    cena(9, 'atravessa todo mundo');
    mel(th, 9, ['D5:2 F5:2 A5:2 D6:2 r:8', 'Bb5:2 D6:2 G6:2 F6:2 r:8', 'C#6:2 E6:2 G6:2 Bb6:2 A6:4 r:4']);
    mel(tp, 9, ['r:8 A4:2 G#4:2 A4:2 r:2', 'r:8 D5:2 C#5:2 D5:2 r:2', 'r:16']);
    for (const b of [9, 10, 11]) sm.note(b * 16 + 12, 3, 0, 0.9);
    anda(9, 'D2:4 F2:4 A2:4 B2:4');
    anda(10, 'G2:4 Bb2:4 D3:4 E3:4');
    anda(11, 'A2:4 C#3:4 E3:4 G3:4');
    for (const [i, c] of ['Dm6', 'Gm6', 'A7b9'].entries()) {
        comp(9 + i, c);
        swing(9 + i);
    }
    ev(9, 0, 'teremim acelera, surdina responde', 'Gengar sai do gol com a bola');
    ev(9, 12, 'fwip', 'atravessa o 1º zagueiro como fantasma');
    ev(10, 12, 'fwip', 'atravessa o 2º');
    ev(11, 12, 'fwip', 'atravessa o 3º, que gira no lugar');

    // Shadow Ball: a sombra junta, o chute de longe
    cena(12, 'Shadow Ball');
    sb.note(12 * 16, 0, 0, 1);
    padChord(org, 12, 'Dm', 12, { low: 38, n: 4, vel: 0.6 });
    mel(bs, 12, ['D2:12 r:4']);
    drum(k, 12, 1, 'x...x...x...x...', { vel: 0.6 });
    ch.note(12 * 16 + 12, 0, 0, 1.2);
    ap.note(12 * 16 + 12, -12, 0, 1);
    ev(12, 0, 'órgão grave e a sombra crescendo', 'uma bola roxa de sombra cresce na frente dele');
    ev(12, 12, 'chute + "bwoop" grave', 'ele chuta do meio da quadra');

    // GOL e SOC-CER-MON (Ré menor), depois meio tom acima (Mi♭ menor)
    cena(13, 'gol');
    rd.note(13 * 16, 0, 0, 1);
    cr.note(13 * 16, 0, 0, 1);
    tc.note(13 * 16 + 1, 0, 0, 1);
    mel(th, 13, [GANCHO.em({ tom: 2, menor: true }), GANCHO.em({ tom: 3, menor: true })]);
    mel(tp, 13, [GANCHO.em({ tom: 2, menor: true, oitava: -1 }), GANCHO.em({ tom: 3, menor: true, oitava: -1 })]);
    drum(dedo, 13, 2, GANCHO.palmas, { vel: 1 });
    padChord(org, 13, 'D', 16, { low: 50, n: 4, vel: 0.6 });
    padChord(org, 14, 'Ebm', 16, { low: 51, n: 4, vel: 0.6 });
    anda(13, 'D2:4 F#2:4 A2:4 Bb2:4');
    anda(14, 'Eb2:4 Gb2:4 Bb2:4 D3:4');
    swing(13);
    swing(14);
    cr.note(14 * 16, 0, 0, 0.8);
    ev(13, 0, 'REDE, prato, Ré maior; SOC-CER-MON no teremim', 'GOL de goleiro, do outro lado da quadra');
    ev(13, 12, 'estalos "hey hey"', 'fantasminhas aparecem na arquibancada estalando os dedos');
    ev(14, 0, 'SOC-CER-MON meio tom acima', 'Gengar comemora flutuando de cabeça pra baixo');

    // a luz apaga: só o sorriso
    cena(15, 'final');
    stabs(org, 15, 'Ebm', [[0, 4]], { low: 51, n: 4, vel: 0.8 });
    mel(bs, 15, ['Eb2:4 r:12']);
    mel(vib, 15, ['Eb6:2 Gb6:2 Bb6:2 D7:10']);
    sm.note(15 * 16 + 6, 0, 0, 1);
    rk.note(15 * 16 + 12, -2, 0, 0.8);
    ev(15, 0, 'acorde de órgão, vibrafone subindo', 'ele volta pro gol num piscar');
    ev(15, 6, 'fwip', 'a luz apaga');
    ev(15, 12, 'ke-ke-ke', 'só o sorriso fica no escuro');
    return S;
}
