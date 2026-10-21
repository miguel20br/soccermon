// Partida contra o Brock (rodada 5, variação da Partida v4): pedra, peso. Mi menor, mais lento (108 → 122 e
// 112 → 130 BPM), meio-tempo pesado (caixa só no 3), baixo sujo (bitcrush), metais no lugar da flauta, taiko na
// percussão. Mesma forma: acelera em cada tempo, sobe de tom, SOC-CER-MON em Mi menor no fim de cada tempo.
// Rodada 6: 1º e 2º tempo em arquivos separados, com trechos em loop por intensidade (ver partida-base.mjs), e o
// motivo do Tema do Brock (tema-brock.mjs) citado em cada nível.
import { partidaBase } from '../partida-base.mjs';
import { I, ins } from '../synth.mjs';
import { MOTIVO } from './tema-brock.mjs';

export const meta = { titulo: 'Partida: Brock', tela: 'Partida (ginásio de Pewter)' };

export default function partidaBrock() {
    return partidaBase({
        swing: 0,
        bpm: { start1: 108, end1: 122, start2: 112, end2: 130 },
        chords: ['Em', 'Em', 'C', 'D', 'Em', 'G', 'C', 'B7'],
        riff: 'E4:2 E4:1 G4:1 r:2 A4:2 r:1 A4:1 G4:2 E4:2 D4:2',
        riffShift: [0, 0, null, null, 0, null, null, null],
        theme: [
            'E5:4 E5:2 G5:2 F#5:4 E5:4',
            'B4:4 D5:2 E5:2 G5:4 F#5:4',
            'E5:4 C5:2 E5:2 G5:4 E5:4',
            'F#5:4 D5:2 F#5:2 A5:4 F#5:4',
            'G5:2 G5:2 G5:2 A5:2 B5:4 G5:4',
            'D6:4 B5:2 G5:2 D5:4 G5:4',
            'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4',
            'F#5:4 D#5:4 B4:8',
        ],
        cita: MOTIVO, // rodada 6: o motivo do tema próprio nos compassos 13 a 16 de cada nível
        tonic: 4,
        hook: { tom: 4, menor: true },
        inst: {
            lead: I.brass,
            riff: I.brass,
            bass: ins({ vol: 0.7, a: 0.003, r: 0.06, shape: 2, sv: 0.8, d: 0.05, filter: -900, crush: 0.2 }),
            chank: I.stab,
            perc: I.timp,
        },
        gain: { lead: 1.2, riff: 0.8, bass: 0.5, chank: 1.2, perc: 0.18 },
        pat: {
            kick: 'X.......X..x....',
            kickHot: 'X..x....X..x..x.',
            snare: '........X.......',
            hat: 'x.x.x.x.x.x.x.x.',
            hatHot: 'xxxxxxxxxxxxxxxx',
            bass: '0:2 0:1 0:1 r:2 0:2 5:2 8:2 r:1 0:1 3:2',
            perc: [['X.......X..X....', -7]],
        },
    });
}
