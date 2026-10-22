// Virada contra o Brock (pedido de 22/10/2026): a vinheta da virada no tom, no andamento e no timbre da Partida: Brock.
// 2º tempo em Fá# menor a 121 BPM (o nível 2); na Pressão final, Sol menor a 132 (`virada-brock-pressao.mjs`).
// A história: a pedra rola. O taiko bate o 3-3-2 e uma pedra desce a ladeira (tom grave caindo semitom a semitom)
// enquanto o trompete toca o motivo do Tema do Brock em MAIOR (o Sol vira Sol#: o placar virou); a pedra cai no
// SOC-CER-MON dos metais em maior, a torcida bate palma de volta, a tuba sobe pro acorde final: Mi e Si sem terça
// (no tom do 1º tempo), que senta no menor da partida. Meio-tempo pesado (caixa só no 3), baixo sujo, sem swing.
import { bass, drum, GANCHO, I, ins, MAJOR, mel, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Virada: Brock', tela: 'Partida (Brock): virada no placar', lufs: -15 };

export default () => viradaBrock(2, 121);

/** A vinheta `shift` semitons acima de Mi (2 = o 2º tempo, 3 = a pressão), no andamento `bpm`. */
export function viradaBrock(shift, bpm) {
    const S = new Song({ bpm, bars: 2, tail: 1.4 });
    const tp = S.part('trompete', I.brass, { pan: -0.1, gain: 1.15, rev: 0.2 });
    const tr = S.part('trompa', I.brass, { pan: 0.3, gain: 0.6, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55, rev: 0.1 });
    const bs = S.part(
        'baixo',
        ins({ vol: 0.7, a: 0.003, r: 0.06, shape: 2, sv: 0.8, d: 0.05, filter: -900, crush: 0.2 }),
        { gain: 0.35 },
    );
    const gt = S.part('guitarra', I.stab, { pan: -0.35, gain: 1 });
    const k = S.part('bumbo', I.kick, { drum: true });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 1.1, rev: 0.15 });
    const taiko = S.part('taiko', I.timp, { drum: true, gain: 0.18, rev: 0.2 });
    const pedra = S.part('pedra', I.tom, { drum: true, pan: -0.2, gain: 0.7 });
    const cr = S.part('crash', I.crash, { drum: true });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 2, rev: 0.15 });

    const sh = { shift };
    const HOOK = GANCHO.em({ tom: 4 }); // B5 G#5 E6: o SOC-CER-MON em Mi maior
    mel(tp, 0, ['E5:3 E5:3 B5:4 A5:2 G#5:2 A5:2', HOOK, 'E5+B5+E6:4 r:12'], sh);
    mel(tr, 0, ['E5:3 E5:3 B5:4 A5:2 G#5:2 A5:2', HOOK], { shift, harm: thirdBelow(MAJOR(4 + shift)) });
    mel(tuba, 0, ['E3:3 E3:3 B2:4 r:6', 'r:12 B2:2 D#3:2', 'E2+E3:4 r:12'], sh);
    bass(bs, 0, transpose('E', shift), '0:3 0:3 l:4 r:2 3:2 4:2');
    bass(bs, 1, transpose('E', shift), '0:3 0:3 8:6 r:2 l:1 c:1');
    bass(bs, 2, transpose('E', shift), '0:4 r:12');
    stabs(
        gt,
        0,
        transpose('E', shift),
        [
            [0, 2],
            [3, 2],
            [6, 2],
        ],
        { low: 52, n: 3 },
    );
    // a pedra rolando ladeira abaixo: oito batidas caindo um semitom cada, cada vez mais forte
    for (let i = 0; i < 8; i++) pedra.note(8 + i, -6 - i, 0, 0.55 + 0.06 * i);
    drum(taiko, 0, 1, 'X..X..X.X.X.XXXX', { pitch: -7 });
    drum(k, 0, 1, 'X.......X..x....');
    drum(sn, 0, 1, '........X.......');
    drum(cr, 0, 1, 'X...............');
    drum(taiko, 1, 1, 'X..X..X.........', { pitch: -7 });
    drum(k, 1, 1, 'X.....X.........');
    drum(sn, 1, 1, '........X.......');
    drum(gang, 1, 1, GANCHO.palmas);
    drum(k, 2, 1, 'X...............');
    drum(taiko, 2, 1, 'X...............', { pitch: -7 });
    drum(cr, 2, 1, 'X...............');
    return S;
}
