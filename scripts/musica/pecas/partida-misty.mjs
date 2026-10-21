// Partida contra a Misty (rodada 5, variação da Partida v4): água em 12/8, o balanço de Cerulean com energia de
// jogo. Si menor, sino bembé (x.x.xx.x.x.x), baixo em tercinas, arpejo de sinos como ondas, bolhas subindo. Cada
// linha é uma colcheia (o pulso é a semínima pontuada: ~96 → 110 e ~101 → 117). Mesma forma da Partida v4.
import { partidaBase } from '../partida-base.mjs';
import { I } from '../synth.mjs';

export const meta = { titulo: 'Partida: Misty', tela: 'Partida (ginásio de Cerulean)' };

export default function partidaMisty() {
    return partidaBase({
        barLen: 12,
        swing: 0,
        bpm: { start1: 72, end1: 82, intervalo: 72, start2: 76, end2: 88 },
        chords: ['Bm7', 'Bm7', 'Gmaj7', 'A', 'Bm7', 'Em7', 'Gmaj7', 'F#7'],
        riff: 'B4:1 B4:1 r:1 D5:1 r:1 E5:1 F#5:2 r:1 A5:1 F#5:1 E5:1',
        riffShift: [0, 0, null, null, 0, null, null, null],
        theme: [
            'F#5:3 F#5:2 A5:1 B5:3 A5:3',
            'F#5:2 D5:1 B4:3 r:3 D5:1 E5:1 F#5:1',
            'G5:3 G5:2 B5:1 D6:3 B5:3',
            'C#6:3 A5:3 E5:3 r:3',
            'B5:3 A5:2 F#5:1 D5:3 F#5:3',
            'G5:3 E5:2 B4:1 D5:3 E5:3',
            'F#5:2 G5:1 A5:2 B5:1 D6:3 C#6:3',
            'A#5:6 F#5:3 C#5:3',
        ],
        tonic: 11,
        hook: { tom: -1, menor: true },
        inst: { lead: I.pulse, arp: I.bell },
        gain: { lead: 1.2 },
        pat: {
            kick: 'X.....X.....',
            kickHot: 'X..x..X..x..',
            snare: '...X.....X..',
            hat: 'xoxxoxxoxxox',
            hatHot: 'xxxxxxxxxxxx',
            bass: '0:3 5:2 8:1 0:3 5:2 3:1',
            chankRows: [1, 4, 7, 10],
            riffStabRows: [0, 2, 5, 6, 8, 11],
            perc: [['x.x.xx.x.x.x', 0]],
            ohat: '.....x.....x',
            tom: '......x.x.x.',
            hornRows: [
                [2, 1],
                [5, 1],
                [11, 1],
            ],
            crash: 'X...........',
            fill1: '......xxxXXX',
            fill2: 'xxxxxxXXXXXX',
            whistle: 'x...........',
            intervaloBass: '0:6 r:6',
            intervaloWhistle: '......x.....',
            endBass: '0:12',
            hookRitmo: [3, 3, 4, 2],
            palmas: '..........xx',
        },
        extra: (S, { END }) => {
            const bolhas = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.6, rev: 0.4 });
            for (let b = 1; b < END; b += 2) bolhas.note(b * 12 + 9, 12 + (b % 3) * 2, 0, 0.8);
        },
    });
}
