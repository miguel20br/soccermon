// Menu: Estádio de noite (30/10/2026). O pedido: uma variação calma da música do menu ("a do soccermon mesmo é
// meio... demais"). Clima de sonho no jeito do Komiku: Sol maior a 108 BPM, timbre quente (flauta triangular,
// piano elétrico e cordas com passa-baixa, caixinha de música), percussão de vassourinha. O SOC-CER-MON vem em
// câmera lenta (o mesmo 3-3-2 com as notas dobradas: 6-6-4) na caixinha de música, no fim de cada frase, como
// resposta da flauta. Dó menor emprestado (Cm6) no A; ponte que sobe por Fá e Mi7 até a volta final 1 tom acima
// (Lá), que cai de volta no Sol pelo Ré7sus4. Som de assinatura: o brilho das estrelas (arpejo rápido da caixinha)
// antes de cada seção e o clap 808 molhado, longe, como palma de arquibancada vazia.
// Forma: intro (2, o gancho uma vez) | A (8) | A2 (8): cordas e terças | B (8): ponte | A' (8) em Lá.
// Loop do compasso 2 ao fim: 32 compassos, 71 s.
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu: Estádio de noite (sonho)', tela: 'Home' };

/** O gancho em câmera lenta: o 3-3-2 com as notas dobradas (o logo pisca a cada 6 linhas). */
const LENTO = [6, 6, 4, 0];

export default function menuSonho() {
    const S = new Song({ bpm: 108, bars: 34, swing: 0.06, tail: 4, loopFrom: 2 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.2,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.3,
        corte: 3500,
    });
    const harm = S.part('terças', I.counter, { pan: 0.3, gain: 0.5, rev: 0.3, corte: 3000 });
    const box = S.part('caixinha', I.bell, { pan: 0.3, gain: 2.4, echo: { rows: 6, fb: 0.3, mix: 0.25 }, rev: 0.35 });
    const brilho = S.part('brilho', I.bell, { pan: 0.5, gain: 1.2, echo: { rows: 2, fb: 0.4, mix: 0.3 }, rev: 0.4 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.55, rev: 0.25, corte: 2500 });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.35, corte: 2200 });
    const pad = S.part('pad', I.pad, { gain: 0.8 });
    const bs = S.part('baixo', I.bass, { gain: 0.55, corte: 700 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.4 });
    const sh = S.part('vassourinha', I.shaker, { drum: true, pan: 0.3, gain: 1.1 });
    const rim = S.part('aro', I.block, { drum: true, pan: -0.2, gain: 1.2 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.5 }), {
        drum: true,
        gain: 0.8,
        rev: 0.25,
    });

    const brilha = (b) => mel(brilho, b, ['r:12 D6:1 G6:1 B6:1 D7:1']);
    const bar = (b, c, { cheio = false, caixinha = true } = {}) => {
        bass(bs, b, c, '0:6 5:2 8:6 5:2', { vel: 0.85 });
        stabs(
            ep,
            b,
            c,
            [
                [0, 8],
                [8, 4],
                [12, 4],
            ],
            { low: 55, n: 4, vel: 0.45 },
        ); // sem 6-6: o detector do gancho leria como SOC-CER-MON
        if (caixinha) arp(box, b, c, { low: 64, step: 2, vel: 0.3 });
        if (cheio) padChord(str, b, c, 16, { low: 55, vel: 0.6 });
        drum(sh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.8 });
        drum(k, b, 1, cheio ? 'x.......x.....x.' : 'x...............');
        drum(rim, b, 1, '....x.......x...', { pitch: -6, vel: 0.7 });
        if (cheio && b % 2) drum(cl, b, 1, '........x.......');
    };

    // intro: a caixinha de música sozinha, o gancho em câmera lenta (o logo pisca ao entrar na Home)
    padChord(pad, 0, 'Gmaj7', 32, { low: 55 });
    mel(box, 0, [GANCHO.em({ tom: 7, ritmo: LENTO })]);
    arp(box, 1, 'D7sus4', { low: 64, step: 2, vel: 0.35 });
    mel(lead, 1, ['r:8 A4:2 C5:2 D5:4']);

    const A_CH = ['Gmaj7', 'Bm7', 'Em7', 'Cmaj7', 'Am7', 'Cm6', 'Gmaj7', 'D7sus4'];
    // a flauta pergunta, a caixinha e o piano respondem; no 7º compasso o SOC-CER-MON lento é a resposta
    const A_FL = [
        'B4:4 D5:4 F#5:6 E5:2',
        'D5:8 r:8',
        'G5:4 F#5:2 E5:2 B4:8',
        'r:16',
        'C5:4 E5:4 A5:6 G5:2',
        'G5:8 Eb5:8',
        'r:16',
        'r:8 A4:2 C5:2 D5:4',
    ];
    const A_RESP = ['r:16', 'r:8 F#5:2 A5:2 B5:4', 'r:16', 'r:4 E5:2 G5:2 B5:4 G5:4', 'r:16', 'r:16'];
    for (const [b0, s, cheio] of [
        [2, 0, false],
        [10, 0, true],
        [26, 2, true],
    ]) {
        // o A' fecha no Ré7sus4: a volta do loop cai em Sol
        const ch = A_CH.map((c, i) => (s && i === 7 ? 'D7sus4' : transpose(c, s)));
        // no compasso do gancho a caixinha canta (sem arpejo)
        ch.forEach((c, i) => {
            bar(b0 + i, c, { cheio, caixinha: i !== 6 });
        });
        mel(lead, b0, A_FL.slice(0, 7), { shift: s });
        mel(lead, b0 + 7, A_FL.slice(7));
        mel(ep, b0, A_RESP, { shift: s, vel: 1.4 });
        mel(box, b0 + 6, [GANCHO.em({ tom: 7 + s, ritmo: LENTO })]);
        if (cheio) mel(harm, b0, A_FL.slice(0, 6), { shift: s, harm: thirdBelow(MAJOR(7 + s)) });
        brilha(b0 + 7);
    }

    // ponte (18-25): a flauta canta longo, a caixinha responde; Fá e Mi7 levam ao Lá
    const B_CH = ['Cmaj7', 'D', 'Bm7', 'Em7', 'Cmaj7', 'D', 'Fmaj7', 'E7'];
    B_CH.forEach((c, i) => {
        bar(18 + i, c, { cheio: true, caixinha: false });
        padChord(pad, 18 + i, c, 16, { low: 55, vel: 0.8 });
    });
    mel(lead, 18, [
        'E5:6 D5:2 C5:4 G5:4',
        'F#5:8 r:8',
        'D5:6 E5:2 F#5:4 B5:4',
        'B5:8 r:8',
        'E5:4 G5:4 B5:4 C6:4',
        'A5:8 F#5:8',
        'A5:6 G5:2 F5:4 C6:4',
        'B5:4 G#5:4 E5:2 F#5:2 G#5:2 B5:2',
    ]);
    mel(box, 19, ['r:8 A5:2 D6:2 F#6:4']);
    mel(box, 21, ['r:8 G5:2 B5:2 E6:4']);
    arp(box, 24, 'Fmaj7', { low: 64, step: 2, vel: 0.3 });
    drum(rim, 25, 1, '........x.x.xxxx', { pitch: -2 });
    mel(brilho, 25, ['r:12 E6:1 G#6:1 B6:1 E7:1']);
    return S;
}
