// Estrada da Vitória: subida difícil, tensão boa. No lugar de "La montagne" (Komiku). Mi menor, 132 BPM, metais,
// tambores; a estrada sobe: cada volta um tom acima (Mi → Fá# → Sol#), com virada antes de cada subida.
// Rodada 4: ganhou percussão que marca: tambor grande (taiko) em 3-3-2. Rodada 5: a bigorna saiu; no lugar, palma
// pesada (grave, com reverb) junto com um aro de caixa no contratempo do 2 e do 4. Rodada 7: a palma virou o clap
// clássico de bateria eletrônica (I.clap808, amostra do TR-08), no tom original. Rodada 7b: o clap −5 dB, sem o agudo
// áspero (passa-baixa em 7 kHz) e quase seco (sala curta pouca, sem o reverb grande): justo, embaixo dos metais.
import { bass, drum, I, MINOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Estrada da Vitória', tela: 'Rota: Estrada da Vitória' };

export default function estrada() {
    const S = new Song({ bpm: 132, bars: 24, tail: 3, loopFrom: 0 });
    const lead = S.part('metais', I.brass, { pan: -0.1, gain: 1.1, rev: 0.2 });
    const harm = S.part('metais2', I.brass, { pan: 0.3, gain: 0.6, rev: 0.2 });
    const pul = S.part('pulso', I.pulse, { pan: 0.4, gain: 0.3 });
    const str = S.part('cordas', I.strings, { gain: 1.1, rev: 0.25 });
    const bs = S.part('bass', I.bass, { gain: 0.6 });
    const k = S.part('kick', I.kick, { drum: true });
    const sn = S.part('snare', I.snare, { drum: true, gain: 0.9 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.8 });
    const ti = S.part('timp', I.timp, { gain: 0.6, drum: true });
    const cr = S.part('crash', I.crash, { drum: true });
    const taiko = S.part('taiko', I.timp, { drum: true, gain: 0.16, rev: 0.2 });
    const clapP = S.part('palmaPesada', I.clap808.com({ ganho: 0.56, corte: 7000, sala: 0.15 }), {
        drum: true,
        pan: 0.2,
        gain: 2,
        rev: 0.04,
    });
    const aro = S.part('aro', I.block, { drum: true, pan: 0.3, gain: 1.6 });

    const M = [
        'E5:4 B4:2 E5:2 G5:4 F#5:2 E5:2',
        'G5:6 A5:2 G5:4 E5:4',
        'F#5:4 D5:2 F#5:2 A5:4 G5:2 F#5:2',
        'D#5:8 F#5:4 B5:4',
        'B5:4 A5:2 G5:2 E5:4 G5:4',
        'C6:6 B5:2 A5:4 G5:4',
        'A5:4 C6:4 E6:4 D6:2 C6:2',
        'B5:8 A5:2 G5:2 F#5:2 D#5:2',
    ];
    const CH = ['Em', 'C', 'D', 'B7', 'Em', 'C', 'Am', 'B7'];
    for (let v = 0; v < 3; v++) {
        const sh = v * 2;
        const b0 = v * 8;
        mel(lead, b0, M, { shift: sh });
        if (v >= 1) mel(harm, b0, M, { shift: sh, harm: thirdBelow(MINOR((4 + sh) % 12)) });
        CH.forEach((c0, i) => {
            const c = transpose(c0, sh);
            bass(bs, b0 + i, c, '0:2 0:2 0:2 8:2 0:2 0:2 5:2 8:2');
            stabs(pul, b0 + i, c, [0, 3, 6, 10, 12], { low: 64, n: 3 });
            if (v >= 1) padChord(str, b0 + i, c, 16, { low: 55, n: 4 });
        });
        drum(sn, b0 + 7, 1, '........xxxxXXXX');
        drum(ti, b0 + 7, 1, '........X...X.X.');
        drum(cr, b0, 1, 'X...............');
    }
    drum(k, 0, 24, 'X...X...X...X...');
    drum(sn, 0, 7, '....X.......X...');
    drum(sn, 8, 7, '....X.......X..x');
    drum(sn, 16, 7, '....X..x....X.xx');
    drum(tm, 0, 24, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    // a marca: taiko em 3-3-2 (a partir da 2ª volta, mais forte) e palma pesada e aro no contratempo do 2 e do 4
    drum(taiko, 0, 24, 'X..X..X...X..X..', { pitch: -9 });
    drum(taiko, 8, 16, '......x.......xx', { pitch: -4 });
    drum(clapP, 0, 24, '......x.......x.');
    drum(aro, 0, 24, '......x.......x.', { pitch: -9 });
    return S;
}
