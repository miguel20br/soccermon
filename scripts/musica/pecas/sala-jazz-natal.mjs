// Sala de troféus em dezembro, versão jazz (rodada 5): o jazz da Sala com o refrão de "Jingle Bells" (James Lord
// Pierpont, 1857, domínio público) no tema e acordes de jazz por baixo (Fmaj7, Dm7, Gm7, C9...). Depois, um chorus
// de improviso trocando de 4 em 4 (vibrafone e flauta) com duas citações do SOC-CER-MON. Guizos no 2 e no 4,
// celesta dobrando o tema, swing de colcheia, 132 BPM.
import { bass, drum, GANCHO, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Sala de troféus, jazz de Natal', tela: 'Sala de troféus em dezembro' };

export default function salaJazzNatal() {
    const S = new Song({ bpm: 132, bars: 32, swing: 0.33, swingUnit: 8, tail: 4, loopFrom: 0 });
    const fl = S.part('flauta', I.counter, { pan: -0.1, gain: 1.2, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.3 });
    const cel = S.part('celesta', I.bell, { pan: 0.4, gain: 1.6, rev: 0.4 });
    const vib = S.part('vibraSolo', I.bell, { pan: 0.3, gain: 5, rev: 0.3 });
    const ep = S.part('epiano', I.epiano, { pan: 0.25, gain: 1.1, rev: 0.25 });
    const bs = S.part('baixo', I.pizz, { gain: 1.3 });
    const ride = S.part('conducao', I.ohat, { drum: true, pan: 0.35, gain: 1.2 });
    const guizo = S.part('guizos', I.sleigh, { drum: true, pan: 0.4, gain: 5 });
    const br = S.part('vassoura', I.shaker, { drum: true, pan: -0.3, gain: 1.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.35 });

    // refrão de "Jingle Bells" (domínio público), em Fá
    const J = [
        'A5:4 A5:4 A5:8',
        'A5:4 A5:4 A5:8',
        'A5:4 C6:4 F5:6 G5:2',
        'A5:16',
        'Bb5:4 Bb5:4 Bb5:6 Bb5:2',
        'Bb5:4 A5:4 A5:4 A5:2 A5:2',
        'A5:4 G5:4 G5:4 A5:4',
        'G5:8 C6:8',
        'A5:4 A5:4 A5:8',
        'A5:4 A5:4 A5:8',
        'A5:4 C6:4 F5:6 G5:2',
        'A5:16',
        'Bb5:4 Bb5:4 Bb5:6 Bb5:2',
        'Bb5:4 A5:4 A5:4 A5:2 A5:2',
        'C6:4 C6:4 Bb5:4 G5:4',
        'F5:16',
    ];
    const CH = [
        'Fmaj7',
        'Dm7',
        'Gm7',
        'C9',
        'Bbmaj7',
        'Fmaj7',
        'G7',
        'C7',
        'Fmaj7',
        'D7b9',
        'Gm7',
        'C9',
        'Bbmaj7',
        'Fmaj7',
        'C9',
        'F6',
    ];
    mel(fl, 0, J);
    mel(cel, 0, J, { shift: 12, vel: 0.6 });
    mel(cel, 8, J.slice(8), { harm: (m) => thirdBelow(MAJOR(5))(m) + 12, vel: 0.5 });
    // improviso: vibrafone, flauta, vibrafone (com SOC-CER-MON), flauta
    mel(vib, 16, [
        GANCHO.em({ tom: -7 }),
        'F5:2 A5:2 C6:2 D6:2 C6:4 A5:4',
        'Bb5:2 A5:2 G5:2 F5:2 D5:2 F5:2 A5:4',
        'G5:2 Bb5:2 D6:2 E6:2 C6:8',
    ]);
    mel(fl, 20, [
        GANCHO.em({ tom: -2 }),
        'r:4 A5:2 C6:2 E6:4 C6:4',
        'B5:2 D6:2 F6:2 D6:2 B5:2 G5:2 F5:2 D5:2',
        'E5:2 G5:2 Bb5:2 C6:2 E6:4 r:4',
    ]);
    mel(vib, 24, [
        GANCHO.em({ tom: 5, oitava: -1 }),
        'F#5:2 A5:2 C6:2 Eb6:2 D6:4 A5:4',
        'Bb5:2 D6:2 F6:2 D6:2 Bb5:4 G5:4',
        'E6:2 D6:2 C6:2 Bb5:2 G5:4 E5:4',
    ]);
    mel(fl, 28, [
        'D6:6 C6:2 A5:4 F5:4',
        'A5:2 C6:2 E6:2 C6:2 A5:4 G5:4',
        'E5:2 G5:2 Bb5:2 D6:2 C6:4 Bb5:4',
        'F5:8 r:8',
    ]);
    [...CH, ...CH].forEach((c, b) => {
        bass(bs, b, c, '0:4 2:4 3:4 5:4');
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
            ],
            { low: 57, n: 4, vel: 0.8 },
        );
        if (b % 4 === 3)
            stabs(
                ep,
                b,
                c,
                [
                    [10, 2],
                    [14, 2],
                ],
                { low: 60, n: 4, vel: 0.6 },
            );
    });
    drum(ride, 0, 32, 'x...x.x.x...x.x.');
    drum(guizo, 0, 32, '....x.......x...');
    drum(br, 0, 32, 'o.o.o.o.o.o.o.o.');
    drum(k, 0, 32, 'x.......x.......');
    return S;
}
