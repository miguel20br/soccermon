// Na ponta do pé: cena boba do Modo história (alguém se esgueirando, plano que vai dar errado). Pedido do Miguel:
// "Sneaky Snom" refeita mais boba. Melodia nossa (não ouvimos a deles pra copiar): Lá menor, 108 BPM, staccato,
// fagote, pizzicato, bloco de madeira e apito de êmbolo no fim das frases.
import { bass, drum, I, mel, Song, stabs } from '../synth.mjs';

export const meta = { titulo: 'Na ponta do pé', tela: 'Modo história (momentos bobos)' };

export default function cutsceneBoba() {
    const S = new Song({ bpm: 108, bars: 16, swing: 0.22, tail: 2, loopFrom: 0 });
    const pz = S.part('pizz', I.pizz, { pan: -0.15, gain: 2.2, rev: 0.1 });
    const fag = S.part('fagote', I.bassoon, { gain: 1 });
    const fag2 = S.part('fagote2', I.bassoon, { pan: 0.3, gain: 0.5 });
    const cl = S.part('clarinete', I.thin, { pan: 0.3, gain: 1.6 });
    const st = S.part('stab', I.stab, { pan: 0.2, gain: 0.5 });
    const blk = S.part('bloco', I.block, { drum: true, pan: 0.25 });
    const k = S.part('kick', I.kick, { drum: true, gain: 0.6 });
    const up = S.part('apito', I.whistle, { gain: 3, drum: true, pan: -0.3 });
    const down = S.part('apitoDesce', I.whistleDown, { gain: 3, drum: true, pan: 0.3 });

    const M = [
        'A4:1 r:1 B4:1 r:1 C5:1 r:1 E5:2 r:2 D#5:1 r:1 E5:1 r:3',
        'G#4:1 r:1 B4:1 r:1 D5:1 r:1 F5:2 r:2 E5:1 r:1 D5:1 r:3',
        'C5:1 r:1 B4:1 r:1 A4:1 r:1 G#4:1 r:1 A4:1 r:1 C5:1 r:1 E5:2 r:2',
        'F5:1 r:1 E5:1 r:1 D#5:1 r:1 E5:1 r:1 B4:4 r:4',
        'D5:1 r:1 F5:1 r:1 A5:2 r:2 G#5:1 r:1 A5:1 r:5',
        'E5:1 r:1 C5:1 r:1 A4:2 r:2 B4:1 r:1 C5:1 r:5',
        'D#5:1 r:1 F#5:1 r:1 A5:2 r:2 F#5:1 r:1 D#5:1 r:5',
        'E5:1 r:1 r:2 r:4 B4:1 r:1 E4:1 r:5',
    ];
    const CH = ['Am', 'E7', 'Am', 'E7', 'Dm', 'Am', 'B7', 'E7'];
    mel(pz, 0, [...M, ...M]);
    mel(cl, 8, M.slice(0, 4), { shift: 12, vel: 0.6 });
    mel(fag2, 12, M.slice(4), { shift: -12 });
    [...CH, ...CH].forEach((c, b) => {
        bass(fag, b, c, '0:1 r:3 5:1 r:3 0:1 r:3 5:1 r:3', { oct: 12 });
        stabs(
            st,
            b,
            c,
            [
                [6, 1],
                [14, 1],
            ],
            { low: 57, n: 3, vel: 0.6 },
        );
    });
    drum(blk, 0, 16, '..x...x...x...x.');
    drum(k, 0, 16, 'x.......x.......');
    drum(up, 7, 1, '..........x.....');
    drum(down, 15, 1, '..........x.....');
    return S;
}
