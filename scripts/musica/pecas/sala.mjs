// Sala de troféus v2 (rodada 4): mais jazzada (a tranquila fica com a "Village 4"). Swing de colcheias de verdade,
// 120 BPM, Fá maior com ii-V (Gm9-C9), dominantes com nona menor e meio-diminuto. Prato de condução, chimbal no 2 e
// no 4, vassourinha, baixo andando, piano elétrico no ritmo Charleston, flauta com eco.
// Rodada 5: depois do tema, um chorus de improviso trocando de 4 em 4 (vibrafone pergunta, flauta responde), com
// uma citação do SOC-CER-MON no vibrafone, como músico de jazz cita tema no solo.
import { bass, drum, GANCHO, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Sala de troféus v2 (jazz)', tela: 'Sala de troféus' };

export default function sala() {
    const S = new Song({ bpm: 120, bars: 32, swing: 0.33, swingUnit: 8, tail: 4, loopFrom: 0 });
    const lead = S.part('flauta', I.counter, {
        pan: -0.1,
        gain: 1.2,
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
        rev: 0.3,
    });
    const harm = S.part('vibra', I.bell, { pan: 0.4, gain: 1.4, rev: 0.4 });
    const ep = S.part('epiano', I.epiano, { pan: 0.25, gain: 1.1, rev: 0.25 });
    const vib = S.part('vibraSolo', I.bell, { pan: 0.3, gain: 5, rev: 0.3 });
    const bs = S.part('baixo', I.pizz, { gain: 1.3 });
    const ride = S.part('conducao', I.ohat, { drum: true, pan: 0.35, gain: 1.2 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35 });
    const br = S.part('vassoura', I.shaker, { drum: true, pan: -0.3, gain: 1.3 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.35 });

    const M = [
        'r:2 D5:2 F5:2 A5:2 Bb5:2 A5:2 F5:2 D5:2',
        'E5:4 G5:2 Bb5:2 D6:4 C6:2 Bb5:2',
        'A5:6 G5:2 E5:4 C5:4',
        'F#5:2 A5:2 C6:2 Eb6:2 D6:4 r:4',
        'Bb5:3 A5:1 G5:2 F5:2 D5:4 r:2 A4:2',
        'Bb4:2 C5:2 D5:2 E5:2 G5:4 Bb5:4',
        'C6:4 A5:2 G5:2 E5:4 C5:4',
        'Eb5:2 F#5:2 A5:2 C6:2 Bb5:4 A5:4',
        'G5:2 A5:2 Bb5:2 D6:2 F6:4 D6:4',
        'E6:3 D6:1 C6:2 Bb5:2 G5:4 E5:4',
        'F5:2 A5:2 C6:2 E6:2 D6:4 C6:4',
        'D6:6 C6:2 A5:4 F5:4',
        'G5:2 Bb5:2 D6:2 E6:2 D6:4 Bb5:4',
        'C#6:2 Bb5:2 G5:2 E5:2 C#5:4 A4:4',
        'Bb4:2 D5:2 F5:2 A5:2 G5:4 F5:4',
        'E5:4 G5:4 C5:8',
    ];
    const CH = [
        'Gm9',
        'C9',
        'Fmaj7',
        'D7b9',
        'Gm9',
        'C9',
        'Am7',
        'D7b9',
        'Gm9',
        'C9',
        'Fmaj7',
        'Bbmaj7',
        'Em7b5',
        'A7b9',
        'Gm9',
        'C9',
    ];
    mel(lead, 0, M);
    mel(harm, 8, M.slice(8), { harm: thirdBelow(MAJOR(5)), vel: 0.8 });
    // improviso: troca de 4 compassos (vibrafone, flauta, vibrafone com a citação, flauta)
    mel(vib, 16, [
        'D5:2 F5:2 A5:2 Bb5:2 C6:2 Bb5:2 A5:2 G5:2',
        'E5:2 G5:2 Bb5:2 D6:2 C6:2 Bb5:2 G5:2 E5:2',
        'F5:2 E5:2 F5:2 A5:2 C6:2 E6:2 D6:2 C6:2',
        'Eb6:2 C6:2 A5:2 F#5:2 G5:4 r:4',
    ]);
    mel(lead, 20, [
        'r:4 Bb5:2 A5:2 G5:2 F5:2 D5:4',
        'r:4 G5:2 A5:2 Bb5:2 C6:2 D6:4',
        'C6:2 A5:2 G5:2 E5:2 G5:4 r:4',
        'r:2 F#5:2 A5:2 C6:2 Eb6:4 D6:4',
    ]);
    mel(vib, 24, [
        GANCHO.em({ tom: -2 }),
        'E5:2 G5:2 Bb5:2 D6:2 E6:4 D6:4',
        'C6:2 A5:2 F5:2 E5:2 F5:2 A5:2 C6:2 E6:2',
        'D6:6 C6:2 A5:4 F5:4',
    ]);
    mel(lead, 28, [
        'r:2 G5:2 Bb5:2 D6:2 E6:2 D6:2 Bb5:2 G5:2',
        'C#6:2 E6:2 G6:2 Bb6:2 A6:4 r:4',
        'F6:2 D6:2 Bb5:2 A5:2 G5:4 F5:4',
        'E5:2 G5:2 Bb5:2 D6:2 C6:8',
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
        ); // Charleston
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
    drum(hh, 0, 32, '....x.......x...');
    drum(br, 0, 32, 'o.o.o.o.o.o.o.o.');
    drum(k, 0, 32, 'x.......x.......');
    return S;
}
