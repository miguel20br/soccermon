// Marchinha do Mercado v2 (rodada 3): mais lenta (100 BPM) e menos alegre. A parte A foi pra Ré menor (a mesma
// melodia da v2 virada pro menor), a B continua em Fá maior. Caixinha de música, pizzicato, tuba e clarinete.
import { bass, drum, I, MAJOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Marchinha do Mercado v2', tela: 'Mercado' };

export default function marchinha() {
    const S = new Song({ bpm: 100, bars: 32, barLen: 8, swing: 0.06, tail: 2, loopFrom: 0 });
    const lead = S.part('clarinete', I.pulse, { pan: -0.15, gain: 1.1, rev: 0.12 });
    const box = S.part('caixinha', I.bell, { pan: 0.35, gain: 2.2, rev: 0.2 });
    const pz = S.part('pizz', I.pizz, { pan: 0.2, gain: 0.9 });
    const tu = S.part('tuba', I.tuba, { gain: 0.6 });
    const pah = S.part('pah', I.organ, { pan: -0.25, gain: 0.9 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const tick = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.6 });

    const A = [
        'A4:1 D5:1 F5:2 A5:2 F5:2',
        'G5:1 F5:1 E5:2 F5:4',
        'E4:1 G4:1 C#5:2 E5:2 C#5:2',
        'D5:2 F5:2 D5:4',
        'A4:1 D5:1 F5:2 A5:2 D6:2',
        'Bb5:2 A5:1 G5:1 F5:2 D5:2',
        'G5:2 E5:2 C#5:2 A4:2',
        'D5:4 r:2 A4:2',
    ];
    const B = [
        'A4:1 C5:1 F5:2 A5:2 F5:2',
        'G5:1 F5:1 E5:2 F5:4',
        'G4:1 Bb4:1 E5:2 G5:2 E5:2',
        'F5:2 A5:2 F5:4',
        'A4:1 C5:1 F5:2 A5:2 C6:2',
        'D6:2 C6:1 Bb5:1 A5:2 G5:2',
        'Bb5:2 G5:2 E5:2 C5:2',
        'F5:4 r:2 A4:2',
    ];
    const ACH = ['Dm', 'Dm', 'A7', 'Dm', 'Dm', 'Gm', 'A7', 'Dm'];
    const BCH = ['F', 'F', 'C7', 'F', 'F', 'Bb', 'C7', 'F'];
    mel(lead, 0, [...A, ...B]);
    mel(box, 16, A, { shift: 12, vel: 0.8 });
    mel(lead, 16, A, { vel: 0.8 });
    mel(lead, 24, B);
    mel(box, 24, B, { harm: (m) => thirdBelow(MAJOR(5))(m) + 12, vel: 0.8 });
    [...ACH, ...BCH, ...ACH, ...BCH].forEach((c, b) => {
        bass(tu, b, c, '0:4 5:4');
        stabs(
            pah,
            b,
            c,
            [
                [2, 1],
                [6, 1],
            ],
            { low: 60, n: 3 },
        );
        if (b >= 8) stabs(pz, b, c, [1, 5], { low: 64, n: 2, vel: 0.6 });
    });
    drum(k, 0, 32, 'X...x...');
    drum(sn, 0, 32, '..x.o.x.');
    drum(tick, 8, 24, 'x.x.x.x.');
    drum(sn, 15, 1, 'oxxxXXXX');
    return S;
}
