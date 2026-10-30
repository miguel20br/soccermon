// Menu: Abertura de chinelo (30/10/2026). O pedido: "uma variação de música pro menu principal, a música do soccermon
// mesmo é meio... demais". A Abertura com gancho virou bossa-funk lo-fi, em Fá, a 96 BPM: o mesmo motivo do A
// ("mi mi sol mi, ré dó ré" da Abertura) com a flauta perguntando e o vibrafone respondendo; o piano elétrico na
// batida da bossa; o aro faz a clave da bossa, que começa no 3-3-2 do SOC-CER-MON. O gancho inteiro só no 7º
// compasso de cada frase (vibrafone, sobre o ii), sem palmas da torcida. Ponte com acordes emprestados (Si♭m6) e
// Ré♭7 levando à volta final meio tom acima (Sol♭), que cai de volta em Fá pelo Dó7 do último compasso.
// Forma: intro (2, o gancho uma vez) | A (8) | A2 (8): contracanto e clap | B (8): ponte | A' (8) em Sol♭.
// Loop do compasso 2 ao fim: 32 compassos, 80 s.
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Menu: Abertura de chinelo (bossa lo-fi)', tela: 'Home' };

export default function menuBossa() {
    const S = new Song({ bpm: 96, bars: 34, swing: 0.12, tail: 3, loopFrom: 2 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.2,
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
        rev: 0.25,
        corte: 3500,
    });
    const harm = S.part('contracanto', I.counter, { pan: 0.3, gain: 0.5, rev: 0.25, corte: 3000 });
    const vib = S.part('vibrafone', I.bell, { pan: 0.3, gain: 2.6, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.3 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.55, rev: 0.2, corte: 2500 });
    const str = S.part('cordas', I.strings, { gain: 0.7, rev: 0.35, corte: 2200 });
    const bs = S.part('baixo', I.bass, { gain: 0.55, corte: 900 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.45 });
    const rim = S.part('aro', I.block, { drum: true, pan: -0.2, gain: 0.8 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.35, gain: 1.1 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 }), {
        drum: true,
        gain: 0.7,
        rev: 0.1,
    });

    // clave da bossa: a primeira metade é o 3-3-2 do gancho
    const CLAVE = 'x..x..x...x..x..';
    const COMP = [
        [0, 2],
        [3, 2],
        [6, 4],
        [10, 2],
        [12, 4],
    ];
    const bar = (b, c, { clap = false } = {}) => {
        bass(bs, b, c, '0:6 5:2 5:6 0:2', { vel: 0.9 });
        stabs(ep, b, c, COMP, { low: 53, n: 4, vel: 0.5 });
        drum(k, b, 1, 'x.....x.x.....x.');
        drum(rim, b, 1, CLAVE, { pitch: -5 });
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.7 });
        if (clap) drum(cl, b, 1, '............x...');
    };

    // intro: o gancho uma vez, no vibrafone, sobre o Fá (o logo pisca ao entrar na Home)
    stabs(ep, 0, 'Fmaj7', COMP, { low: 53, n: 4, vel: 0.45 });
    stabs(ep, 1, 'C7sus4', COMP, { low: 53, n: 4, vel: 0.45 });
    drum(rim, 0, 2, CLAVE, { pitch: -5 });
    mel(vib, 0, [GANCHO.em({ tom: 5, oitava: -1 })]);
    mel(lead, 1, ['r:4 G4:2 A4:2 Bb4:2 C5:2 D5:2 E5:2']);

    const A_CH = ['Fmaj7', 'Dm7', 'Gm7', 'C7', 'Am7', 'D7', 'Gm7', 'C7'];
    // pergunta (flauta) e resposta (vibrafone); no 7º compasso o vibrafone canta o SOC-CER-MON sobre o ii
    const A_FL = [
        'A4:2 A4:2 C5:3 A4:1 r:2 G4:2 F4:2 G4:2',
        'A4:6 F4:2 r:8',
        'Bb4:2 Bb4:2 D5:3 Bb4:1 r:2 A4:2 G4:2 A4:2',
        'G4:8 r:8',
        'C5:2 C5:2 E5:3 C5:1 r:2 Bb4:2 A4:2 G4:2',
        'A4:4 F#4:4 r:8',
        'r:16',
        'r:4 G4:2 A4:2 Bb4:2 C5:2 D5:2 E5:2',
    ];
    const A_VIB = [
        'r:16',
        'r:8 D5:2 F5:2 A5:4',
        'r:16',
        'r:8 E5:2 G5:2 Bb5:2 G5:2',
        'r:16',
        'r:8 A5:2 F#5:2 D5:4',
        GANCHO.em({ tom: 5, grau: 1, oitava: -1 }),
        'r:16',
    ];
    const A_GUIA = ['E4:16', 'F4:16', 'F4:16', 'E4:16', 'G4:16', 'F#4:16', 'F4:16', 'E4:16'];
    for (const [b0, s, cheio] of [
        [2, 0, false],
        [10, 0, true],
        [26, 1, true],
    ]) {
        // o A' fecha no Dó7 com a subida da intro: a volta do loop cai em Fá
        const ch = A_CH.map((c, i) => (s && i === 7 ? 'C7' : transpose(c, s)));
        ch.forEach((c, i) => {
            bar(b0 + i, c, { clap: cheio && i % 2 === 1 });
            if (cheio) padChord(str, b0 + i, c, 16, { low: 53, vel: 0.6 });
        });
        mel(lead, b0, A_FL.slice(0, 7), { shift: s });
        mel(lead, b0 + 7, A_FL.slice(7));
        mel(vib, b0, A_VIB, { shift: s });
        if (s) mel(harm, b0, A_FL.slice(0, 6), { shift: s, harm: thirdBelow(MAJOR(5 + s)) });
        else if (cheio) mel(harm, b0, A_GUIA);
    }
    // ponte (18-25): o vibrafone canta, a flauta responde; Si♭m6 emprestado e Ré♭7 levando a Sol♭
    const B_CH = ['Bbmaj7', 'Am7', 'Gm7', 'C7', 'Bbmaj7', 'Bbm6', 'Am7', 'Db7'];
    B_CH.forEach((c, i) => {
        const b = 18 + i;
        bass(bs, b, c, i === 7 ? '0:4 0:4 5:4 8:4' : '0:8 5:6 0:2', { vel: 0.9 });
        stabs(
            ep,
            b,
            c,
            i === 7
                ? [
                      [0, 2],
                      [4, 2],
                      [8, 2],
                      [12, 2],
                  ]
                : [
                      [0, 6],
                      [8, 6],
                  ],
            { low: 53, n: 4, vel: 0.5 },
        );
        padChord(str, b, c, 16, { low: 53, vel: 0.7 });
        drum(k, b, 1, 'x.......x.......');
        drum(rim, b, 1, 'x..x..x.x..x..x.', { pitch: -5, vel: 0.8 }); // o 3-3-2 duas vezes
        drum(sh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.7 });
    });
    mel(vib, 18, [
        'F5:6 D5:2 A5:8',
        'r:16',
        'D5:6 Bb4:2 F5:8',
        'r:16',
        'D5:6 F5:2 A5:8',
        'Db5:6 F5:2 G5:8',
        'r:16',
        'r:16',
    ]);
    mel(lead, 18, [
        'r:16',
        'r:8 E5:2 C5:2 A4:4',
        'r:16',
        'r:8 Bb4:2 G4:2 E4:4',
        'r:16',
        'r:16',
        'E5:4 C5:4 A4:4 G4:4',
        'F4:2 Ab4:2 B4:2 Db5:2 F5:8',
    ]);
    drum(rim, 25, 1, '........x.x.xxxx', { pitch: 2 });
    drum(cl, 25, 1, '............x.x.');
    return S;
}
