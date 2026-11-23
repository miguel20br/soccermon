// Menu de Natal: Noite Feliz (23/11/2026, Natal 1 da 0.9.54). O pedido: "Noite Feliz" no menu no período do Natal
// (30/11 a 06/01), no lugar do `menu-balanco`; a nossa valsa fica pra Sala. Melodia de "Stille Nacht" (Franz Gruber,
// 1818, domínio público), a mesma transcrição da Natal na Sala v2; o arranjo é nosso.
// Clima: balada soul em 6/8 (a casa é o funk; aqui o groove é o "piano de tercina" das baladas, romântico e quente),
// Sol maior a 90 BPM (semínima; a pulsação é a semínima pontuada, 60). Timbres quentes (pulso com passa-baixa, piano
// elétrico, cordas), percussão baixinha, clap 808 (receita 7b) no contratempo do compasso.
// Som de assinatura: a caixinha de música. Ela abre tocando o SOC-CER-MON com a catraca de dar corda, responde a
// melodia nas notas longas (pergunta e resposta) e fecha a volta. Os guizos de trenó entram na 2ª estrofe.
// Forma: intro (2: a caixinha) | E1 (12): melodia no pulso, piano e baixo | E2 (12): flauta e cordas em terças, o pulso
// responde, guizos | ponte (4): Dó, gancho na caixinha com palmas, Si♭7 de passagem e Mi♭7 que leva a Lá♭ | E3 (12)
// meio tom acima, tudo junto | volta (1): Ré7(b9) pelo Lá♭7 (substituto do trítono), de volta ao Sol.
// Loop do compasso 2 ao fim: 41 compassos de 6/8, 82 s.
import { bass, chord, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu de Natal: Noite Feliz (balada em 6/8)', tela: 'Home (Natal, 30/11 a 06/01)' };

/** O gancho em 6/8: 3-3-2 e o resto do compasso pras palmas. */
const R6 = [3, 3, 2, 4];
/** Pulso tem média fora do zero: passa-alta do ZzFX em ~80 Hz (como no menu-balanco). */
const semDC = (inst) => [...inst.slice(0, -1), 40];

// "Noite Feliz" (domínio público), em Sol, um compasso de 6/8 por compasso de 3/4 do original
const NOITE = [
    'D5:3 E5:1 D5:2 B4:6',
    'D5:3 E5:1 D5:2 B4:6',
    'A5:4 A5:2 F#5:6',
    'G5:4 G5:2 D5:6',
    'E5:4 E5:2 G5:3 F#5:1 E5:2',
    'D5:3 E5:1 D5:2 B4:6',
    'E5:4 E5:2 G5:3 F#5:1 E5:2',
    'D5:3 E5:1 D5:2 B4:6',
    'A5:4 A5:2 C6:3 A5:1 F#5:2',
    'G5:6 B5:6',
    'G5:3 D5:1 B4:2 D5:3 C5:1 A4:2',
    'G4:12',
];
// harmonia com sétimas (um acorde por compasso, ou dois: meio compasso cada)
const CH = [
    'Gmaj7',
    ['G6', 'Em7'],
    ['Am7', 'D7'],
    ['Gmaj7', 'G7'],
    'Cmaj7',
    ['Gmaj7', 'Em7'],
    ['Cmaj7', 'A7'],
    ['Gmaj7', 'E7'],
    ['Am7', 'D7'],
    ['Gmaj7', 'Em7'],
    ['G', 'D7'],
    ['G', 'D7'],
];
// a resposta nas notas longas da melodia (2ª metade do compasso); null = a melodia anda
const RESP = [
    'r:6 F#5:2 G5:2 B5:2',
    'r:6 E5:2 G5:2 B5:2',
    'r:6 A5:2 C6:2 D6:2',
    'r:6 F5:2 G5:2 B5:2',
    null,
    'r:6 G5:2 B5:2 D6:2',
    null,
    'r:6 G#5:2 B5:2 D6:2',
    null,
    null,
    null,
    'r:4 B5:2 D6:2 G6:4',
];

export default function menuNatal() {
    const S = new Song({ bpm: 90, bars: 43, barLen: 12, tail: 4, loopFrom: 2 });
    const lead = S.part('pulso', semDC(I.pulse), {
        pan: -0.1,
        gain: 1.3,
        echo: { rows: 6, fb: 0.2, mix: 0.18 },
        rev: 0.3,
        corte: 2000,
    });
    const harm = S.part('terças', semDC(I.pulse), { pan: 0.3, gain: 0.5, rev: 0.3, corte: 2200 });
    const fl = S.part('flauta', I.counter, {
        pan: -0.05,
        gain: 1.2,
        echo: { rows: 6, fb: 0.2, mix: 0.15 },
        rev: 0.4,
        corte: 2600,
    });
    const cordas2 = S.part('cordas2', I.strings, { pan: 0.35, gain: 1.2, rev: 0.4 });
    const caixinha = S.part('caixinha', I.bell, { pan: 0.4, gain: 3, echo: { rows: 6, fb: 0.25, mix: 0.2 }, rev: 0.5 });
    const ep = S.part('piano', I.epiano, { pan: 0.2, gain: 0.8, rev: 0.25, corte: 2400 });
    const pad = S.part('cordas', I.strings, { gain: 0.8, rev: 0.45 });
    const bs = S.part('baixo', I.pizz, { gain: 1.5, corte: 1200 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.45 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.4 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 1.2 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 }), { drum: true, gain: 0.7 });
    const sl = S.part('guizos', I.sleigh, { drum: true, pan: 0.4, gain: 3.5 });
    const corda = S.part('catraca', I.block, { drum: true, pan: 0.45, gain: 1 });
    const prato = S.part('prato', I.crash, { drum: true, pan: -0.2, gain: 0.35 });

    /** Raiz do acorde na região do baixo (a mesma conta do `bass`). */
    const raiz = (sym) => 33 + ((chord(sym).root - 9 + 12) % 12);
    /** Um compasso da banda: baixo, o piano em tercinas (colcheias da balada) e, se `cordas`, o acorde longo. */
    const banda = (b, c, { cordas = false, vel = 1 } = {}) => {
        const [c1, c2] = Array.isArray(c) ? c : [c, c];
        if (c1 === c2) bass(bs, b, c1, '0:4 5:2 8:4 5:2', { vel });
        else
            for (const [i, x] of [c1, c2].entries()) {
                bs.note(b * 12 + i * 6, raiz(x), 4, vel);
                bs.note(b * 12 + i * 6 + 4, raiz(x) + 7, 2, vel * 0.8);
            }
        stabs(ep, b, c1, [0, 2, 4], { low: 59, n: 4, vel: 0.6 * vel });
        stabs(ep, b, c2, [6, 8, 10], { low: 59, n: 4, vel: 0.55 * vel });
        // (5 linhas e não 6: acordes de 6 em 6 enganam o mapa do gancho do `ganchos.mjs`, que piscaria o logo à toa)
        if (cordas && c1 === c2) padChord(pad, b, c1, 12, { low: 52, n: 3, vel: 0.7 });
        else if (cordas) {
            padChord(pad, b, c1, 5, { low: 52, n: 3, vel: 0.7 });
            padChord(pad, b, c2, 5, { low: 52, n: 3, vel: 0.7, at: 6 });
        }
    };
    /** Bateria de balada: bumbo no 1, clap e caixa no contratempo do compasso (linha 6), chimbal nas colcheias. */
    const bateria = (b, { cheia = false, guizos = false } = {}) => {
        drum(k, b, 1, b % 2 ? 'X.......x...' : 'X...........');
        drum(hh, b, 1, 'x.o.o.x.o.o.', { vel: cheia ? 1 : 0.7 });
        drum(cl, b, 1, '......x.....', { vel: cheia ? 1 : 0.8 });
        if (cheia) drum(sn, b, 1, '......x.....');
        if (guizos) drum(sl, b, 1, 'x.o.x.o.x.o.', { vel: 0.8 });
    };
    /** O SOC-CER-MON em 3-3-2 e as palmas respondendo "hey hey" nas linhas 8 e 10. */
    const gancho = (P, b, call) => {
        mel(P, b, [call]);
        drum(cl, b, 1, '........x.x.', { vel: 0.9 });
    };

    // intro (0-1): a catraca da caixinha dá corda, a caixinha toca o gancho em Sol; Ré7 leva à 1ª estrofe
    drum(corda, 0, 1, 'x.o.x.o.x.o.', { pitch: 14 });
    gancho(caixinha, 0, GANCHO.em({ tom: 7, ritmo: R6 }));
    padChord(pad, 0, 'G', 12, { low: 55, n: 3, vel: 0.5 });
    mel(caixinha, 1, ['C6:2 B5:2 A5:2 F#5:2 E5:2 D5:2']);
    padChord(pad, 1, 'D7', 12, { low: 54, n: 4, vel: 0.5 });
    bass(bs, 1, 'D7', '0:6 r:6', { vel: 0.8 });
    drum(sl, 1, 1, '......x.o.oo', { vel: 0.6 });

    // E1 (2-13): a melodia no pulso, a caixinha responde; a bateria entra no 5º compasso
    mel(lead, 2, NOITE);
    CH.forEach((c, i) => {
        banda(2 + i, c, { vel: 0.85 });
        if (i >= 4) bateria(2 + i);
        else drum(hh, 2 + i, 1, 'x.o.o.x.o.o.', { vel: 0.5 });
        if (RESP[i]) mel(caixinha, 2 + i, [RESP[i]], { vel: 0.8 });
    });

    // E2 (14-25): flauta com cordas em terças, o pulso responde; guizos, cordas por baixo
    mel(fl, 14, NOITE);
    mel(cordas2, 14, NOITE, { harm: thirdBelow(MAJOR(7)) });
    CH.forEach((c, i) => {
        banda(14 + i, c, { cordas: true });
        bateria(14 + i, { cheia: i >= 4, guizos: true });
        if (RESP[i]) mel(lead, 14 + i, [RESP[i]], { shift: -12, vel: 0.85 });
    });

    // ponte (26-29): Dó, o gancho na caixinha e as palmas respondem; o pulso sobe; Mi♭7 leva a Lá♭
    const PONTE = ['Cmaj7', ['Bm7', 'Bb7'], 'Am7', 'Eb7'];
    PONTE.forEach((c, i) => {
        banda(26 + i, c, { cordas: true, vel: 0.9 });
        drum(k, 26 + i, 1, 'X...........');
        drum(hh, 26 + i, 1, 'x.....x.....', { vel: 0.7 });
    });
    gancho(caixinha, 26, GANCHO.em({ ritmo: R6 }));
    mel(lead, 27, ['B4:2 D5:2 F#5:2 F5:3 Ab5:3']);
    gancho(caixinha, 28, GANCHO.em({ grau: -2, ritmo: R6 }));
    mel(lead, 29, ['G5:2 Bb5:2 Db6:2 Eb6:6']);
    drum(sn, 29, 1, '......x.xxXX');
    drum(corda, 29, 1, 'x.o.x.o.....', { pitch: 14 });

    // E3 (30-41): meio tom acima, a melodia no pulso com terças, a flauta dobra uma oitava acima no fim
    const up = (c) => (Array.isArray(c) ? c.map((x) => transpose(x, 1)) : transpose(c, 1));
    const tercas = thirdBelow(MAJOR(8));
    mel(lead, 30, NOITE, { shift: 1 });
    mel(harm, 30, NOITE, { shift: 1, harm: tercas });
    mel(fl, 38, NOITE.slice(8), { shift: 13, vel: 0.6 });
    drum(prato, 30, 1, 'x...........');
    CH.forEach((c, i) => {
        // o último: Lá♭ e Lá♭7, o substituto do trítono do Ré7 que volta pro Sol
        banda(30 + i, i === 11 ? ['Ab', 'Ab7'] : up(c), { cordas: true });
        bateria(30 + i, { cheia: true, guizos: true });
        if (RESP[i] && i < 8) mel(caixinha, 30 + i, [RESP[i]], { shift: 1, vel: 0.8 });
    });

    // volta (42): Ré7(b9) com a terça e a nona menor na caixinha, a catraca dá corda de novo
    banda(42, 'D7b9', { cordas: true, vel: 0.8 });
    mel(caixinha, 42, ['D6:2 C6:2 A5:2 F#5:2 Eb5:4']);
    drum(corda, 42, 1, '......x.o.x.', { pitch: 14 });
    drum(hh, 42, 1, 'x.o.o.x.o.o.', { vel: 0.6 });
    drum(sl, 42, 1, 'x.o.x.o.x.oo', { vel: 0.6 });
    return S;
}
