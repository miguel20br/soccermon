// Faixa 5, "Gotas na caverna" (Mt. Moon v2, `extra-mt-moon`: chiptune de caverna, Ré menor, 132 BPM, baixo
// insistente, arpejo de pulso fino, flauta e os sininhos de Clefairy). Rodada 2 (16/11/2026): "interessante, mas
// meio simples". Mais complexidade sem perder o clima, e a complexidade vem da própria caverna: o eco.
// Forma: intro, A e B do jogo | O ECO (8, novo): um CÂNONE. A flauta canta o A e a própria caverna devolve a frase um
// compasso depois, uma oitava abaixo e com eco longo (imitação a uma voz de distância), em cima de um pedal de Ré no
// baixo, com o Mi♭ (o ♭II frígio) no lugar do Si♭ | A CÂMARA DE CRISTAL (8, nova): meio-tempo, os sininhos levam a
// melodia lá em cima, o arpejo anda em grupos de 3 por cima do compasso de 4 (hemíola: os cristais fora do tempo),
// a flauta desce embaixo, e o Si♭ menor (emprestado, o mais escuro) antes do Lá7 | o A' meio tom acima (Mi♭ menor) |
// o B também em Mi♭ menor | o fim como a introdução ao contrário: a banda pousa, só as gotas e o eco sumindo, e o
// sininho responde uma última vez. Faixa calma: −16 LUFS.
import mtMoon from '../pecas/extra-mt-moon.mjs';
import { arp, bass, drum, I, mel, padChord } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, bumbo } from './kit.mjs';

export const meta = { titulo: 'Gotas na caverna', faixa: 5, lufs: -16 };

const A = [
    'D5:4 F5:4 A5:6 G5:2',
    'F5:4 D5:4 Bb4:8',
    'C5:2 E5:2 G5:4 F5:2 E5:2 C5:4',
    'C#5:8 E5:4 A4:4',
    'D5:4 F5:4 A5:4 D6:4',
    'C6:2 Bb5:2 A5:4 F5:4 D5:4',
    'E5:2 F5:2 G5:4 A5:2 Bb5:2 G5:4',
    'A5:8 G5:2 F5:2 E5:2 C#5:2',
];
const ECO_CH = ['Dm', 'Eb', 'Dm', 'A7', 'Dm', 'Eb', 'C', 'A7'];
const CAMARA = [
    ['Gm', 'D6:4 Bb5:4 G5:8', 'Bb4:16'],
    ['Ebmaj7', 'G5:4 Bb5:4 D6:8', 'Bb4:16'],
    ['Bb', 'F6:6 D6:2 Bb5:8', 'D5:16'],
    ['A7', 'E6:8 C#6:8', 'C#5:16'],
    ['Gm', 'G6:4 F6:4 D6:8', 'Bb4:16'],
    ['Ebmaj7', 'Eb6:4 D6:4 Bb5:8', 'G4:16'],
    ['Bbm', 'Db6:6 C6:2 Bb5:8', 'F4:16'],
    ['A7', 'C#6:4 E6:4 A6:8', 'E4:16'],
];

export default function gotasNaCaverna() {
    const { S, P, n, inicio } = estender(mtMoon, [[0, 18], 16, [18, 26], [10, 18, 1]], {
        fim: 4,
        tail: 5,
        barramentos: { bateria: BATERIA },
        bus: { bumbo: 'bateria', caixa: 'bateria', tom: 'bateria' },
        troca: { bumbo: { inst: bumbo, gain: 0.75 } },
    });
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.4 });
    const eco = S.part('eco', I.counter, { pan: 0.4, gain: 0.7, echo: { rows: 6, fb: 0.45, mix: 0.45 }, rev: 0.45 });
    const insistente = '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2';

    // ---------- o eco: cânone a um compasso, em cima do pedal de Ré ----------
    const e0 = inicio[1];
    mel(P('flauta'), e0, A);
    mel(eco, e0 + 1, A.slice(0, 7), { shift: -12 });
    ECO_CH.forEach((c, i) => {
        const b = e0 + i;
        bass(P('baixo'), b, 'Dm', insistente, { vel: 0.85 });
        arp(P('arpejo'), b, c, { low: 62, step: 1, pattern: [0, 1, 2, 4, 2, 1] });
        drum(P('bumbo'), b, 1, 'X.....x.X.......');
        drum(P('caixa'), b, 1, '....x.......x...', { vel: 0.8 });
        drum(P('chimbal'), b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.8 });
        if (i % 2 === 1) drum(P('gotas'), b, 1, '..........x.....', { pitch: 14 + i });
    });
    padChord(pad, e0 + 1, 'Eb', 16, { low: 51, n: 3, vel: 0.5 });
    padChord(pad, e0 + 5, 'Eb', 16, { low: 51, n: 3, vel: 0.5 });
    drum(P('tom'), e0 + 7, 1, '........x.x.x.xx', { pitch: 2 });

    // ---------- a câmara de cristal: meio-tempo, hemíola no arpejo, os sininhos em cima ----------
    const c0 = e0 + 8;
    CAMARA.forEach(([c, sino, flauta], i) => {
        const b = c0 + i;
        mel(P('clefairy'), b, [sino], { vel: 0.9 });
        mel(P('flauta'), b, [flauta], { vel: 0.7 });
        arp(P('arpejo'), b, c, { low: 64, step: 1, pattern: [0, 2, 1] });
        padChord(pad, b, c, 16, { low: 51, n: 3, vel: 0.7 });
        bass(P('baixo'), b, c, '0:6 0:2 r:4 5:4', { vel: 0.8 });
        drum(P('bumbo'), b, 1, 'X.........x.....', { vel: 0.8 });
        drum(P('caixa'), b, 1, '........x.......', { vel: 0.7 });
        drum(P('gotas'), b, 1, i % 2 ? '......x.......x.' : 'x.........x.....', { pitch: 12 + ((i * 5) % 9) });
    });
    drum(P('tom'), c0 + 7, 1, '........x.x.x.xx', { pitch: 3 });

    // ---------- fim: a banda pousa no Mi♭ menor, depois só as gotas e o eco ----------
    bass(P('baixo'), n, 'Ebm', '0:2 0:2 8:2 0:2 0:2 5:2 r:4', { vel: 0.8 });
    mel(P('flauta'), n, ['Eb5:12 r:4']);
    mel(P('terças'), n, ['Bb4:12 r:4']);
    drum(P('bumbo'), n, 1, 'X...............');
    drum(P('tom'), n, 1, '........x.x.....', { pitch: 3 });
    padChord(pad, n, 'Ebm', 32, { low: 51 });
    drum(P('gotas'), n + 1, 1, 'x.........x.....', { pitch: 15, vel: 0.9 });
    drum(P('gotas'), n + 2, 1, '......x.........', { pitch: 18, vel: 0.7 });
    mel(P('clefairy'), n + 2, ['r:10 Eb6:2 Gb6:2 Bb6:2'], { vel: 0.5 });
    drum(P('gotas'), n + 3, 1, 'x...............', { pitch: 15, vel: 0.5 });
    bass(P('baixo'), n + 3, 'Ebm', '0:16', { vel: 0.5 });
    return S;
}
