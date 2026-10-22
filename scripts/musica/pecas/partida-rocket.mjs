// Partida contra a Equipe Rocket (rodada 5, variação da Partida v4): funk de espionagem, sujo e cromático. Dó menor,
// riff de órgão com cromatismo (Fá → Fá# → Sol), melodia com a nota "blue" e trítono, bloco de madeira, guitarra
// abafada. 118 → 134 e 122 → 140 BPM. O SOC-CER-MON em Dó menor vira o "grito" dos vilões no fim de cada tempo.
// Rodada 6: 1º e 2º tempo em arquivos separados, com trechos em loop por intensidade (ver partida-base.mjs), e o
// motivo do Tema da Equipe Rocket (tema-rocket.mjs) citado em cada nível.
import { partidaBase } from '../partida-base.mjs';
import { I } from '../synth.mjs';
import { MOTIVO } from './tema-rocket.mjs';

export const meta = { titulo: 'Partida: Equipe Rocket', tela: 'Partida (Equipe Rocket)' };

export default function partidaRocket() {
    return partidaBase({
        swing: 0.1,
        bpm: { start1: 118, end1: 134, start2: 122, end2: 140 },
        chords: ['Cm7', 'Cm7', 'Ab7', 'G7b9', 'Cm7', 'Fm7', 'Db7', 'G7b9'],
        riff: 'C4:1 r:1 C4:1 Eb4:1 r:1 F4:1 F#4:1 G4:2 r:1 Bb4:1 G4:1 F#4:1 F4:1 Eb4:1 r:1',
        riffShift: [0, 0, null, null, 0, 5, null, null],
        theme: [
            'G5:2 G5:1 G5:1 Bb5:2 C6:2 r:2 Bb5:1 G5:1 F#5:2 G5:2',
            'Eb5:3 D5:3 C5:2 r:4 B4:2 C5:2',
            'C6:2 C6:1 C6:1 Eb6:2 Gb6:2 r:2 Eb6:1 C6:1 Bb5:2 Ab5:2',
            'B5:3 Ab5:3 F5:2 r:4 D5:2 B4:2',
            'C5:2 Eb5:2 F#5:2 G5:2 r:2 Bb5:2 G5:2 F#5:2',
            'Ab5:3 F5:3 C5:2 Eb5:2 F5:2 Ab5:2 C6:2',
            'F5:4 Ab5:4 B5:4 Ab5:4',
            'G5:4 Ab5:4 B5:4 D6:4',
        ],
        cita: MOTIVO, // rodada 6: o motivo do tema próprio nos compassos 13 a 16 de cada nível
        tonic: 0,
        hook: { tom: 0, menor: true },
        inst: { lead: I.thin, riff: I.organ, perc: I.block },
        gain: { lead: 1.4, riff: 1, perc: 1.4 },
        pat: {
            perc: [
                ['x..x..x...x..x..', 0],
                ['....x.......x...', -6],
            ],
        },
    });
}
