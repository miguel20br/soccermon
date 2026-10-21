// Tema do Brock (rodada 6): o tema próprio do líder de Pewter, pra tela dele (desafio, VERSUS, Modo história); a
// Partida: Brock cita o motivo. Pedra e "irmão mais velho": firme e caloroso, não sombrio. Mi menor, 100 BPM,
// meio-tempo de rock (caixa no 3), baixo sujo, taiko em 3-3-2, metais.
// MOTIVO (2 compassos, Em | C): mesmo ritmo de 3-3 do SOC-CER-MON (família), sobe uma quinta e volta pelo vizinho.
// Forma: intro (2) | A (8): o trompete pergunta com o motivo, tuba e fagote respondem embaixo | B (8): Sol maior, o
// lado gentil, e SOC-CER-MON nos metais graves respondendo | A' (8) um tom acima (Fá# menor), terças, taiko cheio, e
// a resposta da tuba vira SOC-CER-MON com palmas |
// virada (1) em Si7 de volta pro Mi menor. Loop do compasso 2 ao fim.
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    ins,
    MINOR,
    mel,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';

export const meta = { titulo: 'Tema do Brock', tela: 'Brock (ginásio de Pewter)' };

export const MOTIVO = {
    mel: ['E5:3 E5:3 B5:4 A5:2 G5:2 A5:2', 'G5:3 E5:3 C5:2 D5:8'],
    acordes: ['Em', 'C'],
};

export default function temaBrock() {
    const S = new Song({ bpm: 100, bars: 27, tail: 3, loopFrom: 2 });
    const lead = S.part('trompete', I.brass, { pan: -0.1, gain: 1.15, rev: 0.2 });
    const harm = S.part('trompa', I.brass, { pan: 0.3, gain: 0.6, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55, rev: 0.1 });
    const fag = S.part('fagote', I.bassoon, { pan: 0.25, gain: 0.8 });
    const bs = S.part(
        'baixo',
        ins({ vol: 0.7, a: 0.003, r: 0.06, shape: 2, sv: 0.8, d: 0.05, filter: -900, crush: 0.2 }),
        {
            gain: 0.32,
        },
    );
    const gt = S.part('guitarra', I.stab, { pan: -0.35, gain: 1.1 });
    const str = S.part('cordas', I.strings, { gain: 1, rev: 0.3 });
    const ar = S.part('arpejo', I.pizz, { pan: 0.45, gain: 0.5, echo: { rows: 3, fb: 0.2, mix: 0.2 } });
    const k = S.part('bumbo', I.kick, { drum: true });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 1.1, rev: 0.15 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.2 });
    const taiko = S.part('taiko', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const pedra = S.part('pedra', I.tom, { drum: true, pan: -0.2, gain: 0.7 });
    const cr = S.part('crash', I.crash, { drum: true });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 2.2, rev: 0.15 });

    const groove = (b, cheio) => {
        drum(k, b, 1, cheio ? 'X..x....X..x..x.' : 'X.......X..x....');
        drum(sn, b, 1, '........X.......');
        drum(hh, b, 1, cheio ? 'x.xxx.xxx.xxx.xx' : 'x.x.x.x.x.x.x.x.');
        drum(taiko, b, 1, cheio ? 'X..X..X...X.X...' : 'X..X..X.........', { pitch: -7 });
        drum(pedra, b, 1, '..............x.', { pitch: -8 });
    };
    // intro: SOC-CER-MON no ritmo, só taiko, pedra e o Mi grave
    drum(taiko, 0, 2, 'X..X..X.........', { pitch: -7 });
    drum(pedra, 0, 1, 'X..X..X.........', { pitch: -8 });
    bass(tuba, 0, 'Em', '0:3 0:3 0:10');
    bass(tuba, 1, 'B7', '0:3 0:3 0:6 5:4');
    drum(sn, 1, 1, '........xxxxXXXX');

    const A_CH = ['Em', 'C', 'Em', 'D', 'Em', 'C', 'Am', 'B7'];
    const A_MEL = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'E5:3 G5:3 B5:4 C6:2 B5:2 A5:2',
        'G5:3 E5:3 C5:2 E5:8',
        'A5:4 C6:4 B5:4 A5:4',
        'B5:6 A5:2 F#5:4 D#5:4',
    ];
    // a resposta, embaixo: o motivo de volta, uma oitava abaixo, terminando no Ré
    const A_RESP = [
        'r:16',
        'r:16',
        'E4:3 E4:3 B4:4 A4:2 G4:2 F#4:2',
        'E4:3 D4:3 A3:2 D4:8',
        'r:16',
        'r:16',
        'r:16',
        'r:16',
    ];
    const B_CH = ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'C#7'];
    const B_MEL = [
        'B5:6 A5:2 G5:8',
        'r:16',
        'E5:4 G5:4 B5:4 E6:4',
        'D6:8 C6:4 B5:4',
        'B5:6 A5:2 G5:4 B5:4',
        'D6:6 C6:2 A5:8',
        'G5:4 E5:4 C5:4 E5:4',
        'E#5:4 G#5:4 B5:4 C#6:4',
    ];
    const parts = [
        [2, A_CH, A_MEL, 0],
        [10, B_CH, B_MEL, 0],
        [18, A_CH, A_MEL, 2],
    ];
    for (const [b0, CH, M, sh] of parts) {
        const isB = b0 === 10;
        mel(lead, b0, M, { shift: sh });
        // no A' a resposta vira SOC-CER-MON (Mi menor, Ré maior) e a torcida bate palma junto
        const resp = sh
            ? [
                  'r:16',
                  'r:16',
                  GANCHO.em({ tom: 4, menor: true, oitava: -1 }),
                  GANCHO.em({ tom: 2, oitava: -1 }),
                  ...A_RESP.slice(4),
              ]
            : A_RESP;
        if (!isB) mel(fag, b0, resp, { shift: sh });
        if (!isB) mel(tuba, b0, resp, { shift: sh - 12, vel: 0.8 });
        if (sh) drum(gang, b0 + 2, 2, GANCHO.palmas);
        if (sh) mel(harm, b0, M, { shift: sh, harm: thirdBelow(MINOR(4 + sh)) });
        CH.forEach((c0, i) => {
            const c = transpose(c0, sh);
            const b = b0 + i;
            groove(b, sh > 0 || (isB && i >= 4));
            bass(bs, b, c, isB ? '0:4 0:2 5:2 8:4 5:4' : '0:2 0:1 0:1 r:2 0:2 5:2 8:2 r:1 0:1 3:2');
            stabs(
                gt,
                b,
                c,
                isB
                    ? [
                          [0, 4],
                          [8, 4],
                      ]
                    : [
                          [0, 2],
                          [3, 2],
                          [6, 2],
                          [10, 1],
                          [12, 2],
                      ],
                { low: 52, n: 3 },
            );
            if (isB || sh) padChord(str, b, c, 16, { low: 60, n: 4, vel: isB ? 1 : 0.7 });
            if (isB || sh) arp(ar, b, c, { low: 64, step: 2 });
        });
        drum(cr, b0, 1, 'X...............');
        drum(sn, b0 + 7, 1, '........xxXxXxXX');
    }
    // no B, a resposta à 1ª frase é SOC-CER-MON nos metais graves (Ré maior), a torcida bate palma de volta
    mel(tuba, 11, [GANCHO.em({ grau: 4, tom: 7, oitava: -2 })], { vel: 1.2 });
    mel(harm, 11, [GANCHO.em({ grau: 4, tom: 7, oitava: -1 })], { vel: 1.1 });
    drum(gang, 11, 1, GANCHO.palmas);
    // virada: Si7, rufo de taiko, de volta pro Mi menor do começo do loop
    mel(lead, 26, ['B5:3 A5:3 F#5:2 D#5:8']);
    bass(bs, 26, 'B7', '0:3 0:3 0:2 5:2 8:2 s:2 5:2');
    stabs(
        gt,
        26,
        'B7',
        [
            [0, 2],
            [3, 2],
            [6, 2],
        ],
        { low: 52, n: 3 },
    );
    drum(taiko, 26, 1, 'X..X..X.X.X.XXXX', { pitch: -7 });
    drum(k, 26, 1, 'X..X..X.........');
    drum(sn, 26, 1, '........xxXxXXXX');
    return S;
}
