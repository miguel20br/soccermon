// Virada contra a Misty (pedido de 22/10/2026): a vinheta da virada no tom, no andamento e no balanço da Partida:
// Misty. 2º tempo em Dó# menor, 12/8 a 82 (o nível 2); na Pressão final, Ré menor a 90 (`virada-misty-pressao.mjs`).
// Cada linha é uma colcheia; o compasso aqui é de 6/8 (meio compasso da partida) pra vinheta caber em ~3,3 s.
// A história: a onda sobe. A flauta faz a onda do Tema da Misty em MAIOR (o Ré vira Ré#: o placar virou), os sinos
// respondem SOC-CER-MON em maior, a torcida bate palma de volta, as bolhas sobem e estouram no acorde final: Si, Fá# e
// Dó# sem terça (no tom do 1º tempo), que senta no menor da partida. Sino bembé e shaker por baixo, harpa em onda.
import { arp, bass, drum, I, MAJOR, mel, Song, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Virada: Misty', tela: 'Partida (Misty): virada no placar', lufs: -15 };

export default () => viradaMisty(2, 82);

/** A vinheta `shift` semitons acima de Si (2 = o 2º tempo, 3 = a pressão), no andamento `bpm` (4 colcheias por batida). */
export function viradaMisty(shift, bpm) {
    const S = new Song({ bpm, bars: 3, barLen: 6, tail: 1.6 });
    const fl = S.part('flauta', I.counter, { pan: -0.15, gain: 1.2, rev: 0.25, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const sino = S.part('sinos', I.bell, { pan: 0.3, gain: 2.4, rev: 0.35 });
    const harm = S.part('terças', I.pulse, { pan: 0.35, gain: 0.45 });
    const harpa = S.part('harpa', I.pizz, { pan: 0.45, gain: 0.6, echo: { rows: 2, fb: 0.25, mix: 0.25 } });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.35 });
    const bs = S.part('baixo', I.bass, { gain: 0.45 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const aro = S.part('aro', I.block, { drum: true, pan: 0.2, gain: 2 });
    const bembe = S.part('bembe', I.agogo, { drum: true, pan: -0.3, gain: 0.9 });
    const shk = S.part('shaker', I.shaker, { drum: true, pan: 0.4 });
    const bolhas = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.6, rev: 0.4 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 1.8, rev: 0.2 });
    const cr = S.part('crash', I.crash, { drum: true, gain: 0.7 });

    const sh = { shift };
    // a onda (o começo do motivo da Misty, em maior) e os sinos respondendo SOC-CER-MON (3-3-4, Si maior)
    mel(fl, 0, ['F#5:1 A#5:1 B5:1 D#6:3', 'r:6', 'r:6', 'F#6:6'], sh);
    mel(sino, 0, ['r:6', 'F#5:3 D#5:3', 'B5:4 r:2', 'B4+F#5+C#6:6'], sh);
    mel(harm, 1, ['F#5:3 D#5:3', 'B5:4 r:2'], { shift, harm: thirdBelow(MAJOR(11 + shift)) });
    mel(str, 3, ['B3+F#4+C#5+F#5:6'], sh);
    const CH = ['B', 'Emaj7', 'B'];
    CH.forEach((c0, b) => {
        const c = transpose(c0, shift);
        arp(harpa, b, c, { low: 62, step: 1, rows: 6 });
        bass(bs, b, c, b === 2 ? '0:3 5:2 c:1' : '0:3 5:2 8:1');
        drum(k, b, 1, 'X..x..');
        drum(aro, b, 1, '...x..', { pitch: -5 });
        drum(shk, b, 1, 'xxxxxx');
    });
    bass(bs, 3, transpose('B', shift), '0:6');
    // o sino bembé (x.x.xx.x.x.x) dividido em meios compassos
    for (const [b, p] of ['x.x.xx', '.x.x.x', 'x.x.xx'].entries()) drum(bembe, b, 1, p);
    drum(gang, 2, 1, '....xx', { vel: 1.2 });
    // as bolhas sobem (cada uma mais aguda) e estouram junto do acorde final
    for (let i = 0; i < 6; i++) bolhas.note(12 + i, 12 + 2 * i, 0, 0.6 + 0.05 * i);
    bolhas.note(18, 26, 0, 1);
    drum(cr, 0, 1, 'X.....');
    drum(cr, 3, 1, 'X.....');
    drum(k, 3, 1, 'X.....');
    return S;
}
