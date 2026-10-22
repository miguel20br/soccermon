// Virada contra a Equipe Rocket (pedido de 22/10/2026): a vinheta da virada no tom, no andamento e no balanço da
// Partida: Equipe Rocket. 2º tempo em Ré menor a 131 BPM (o nível 2), swing 0,1; na Pressão final, Mi♭ menor a 142
// (`virada-rocket-pressao.mjs`).
// A história: o plano deu errado. O órgão começa o motivo do Tema da Rocket na ponta do pé, mas os metais tomam a
// frase em MAIOR (o Mi♭ vira Mi: o placar virou) e o trio (os três vilões) leva três acordes no contratempo; no
// SOC-CER-MON em maior, com o clap 808 molhado e um semitom abaixo (o da Rocket), o apito de êmbolo sobe em escada:
// lá vão eles voando, e um sino agudo pisca lá no alto. Fim em Dó, Sol e Ré sem terça (no tom do 1º tempo), que senta
// no menor da partida.
import { bass, drum, GANCHO, I, MAJOR, mel, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Virada: Equipe Rocket', tela: 'Partida (Equipe Rocket): virada no placar', lufs: -15 };

export default () => viradaRocket(2, 131);

/** A vinheta `shift` semitons acima de Dó (2 = o 2º tempo, 3 = a pressão), no andamento `bpm`. */
export function viradaRocket(shift, bpm) {
    const S = new Song({ bpm, bars: 2, swing: 0.1, tail: 1.4 });
    const org = S.part('orgao', I.organ, { pan: -0.2, gain: 1.6, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const met = S.part('metais', I.brass, { pan: 0.25, gain: 1, rev: 0.15 });
    const met2 = S.part('metais2', I.brass, { pan: -0.1, gain: 0.6, rev: 0.15 });
    const trio = S.part('trio', I.stab, { pan: 0.1, gain: 1.4, rev: 0.15 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const ch = S.part('guitarra', I.chank, { pan: -0.35, gain: 3 });
    const k = S.part('bumbo', I.kick, { drum: true });
    const sn = S.part('caixa', I.snare, { drum: true });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.4 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.3, gain: 1.2 });
    const gang = S.part('palmas', I.clap808.com({ ganho: 0.56, corte: 6500, sala: 0.5, tom: -1 }), {
        drum: true,
        gain: 1.6,
        rev: 0.25,
    });
    const voo = S.part('voo', I.whistle, { drum: true, pan: 0.35, gain: 0.7, rev: 0.3 });
    const brilho = S.part('brilho', I.bell, { pan: 0.5, gain: 1.6, rev: 0.5 });
    const cr = S.part('crash', I.crash, { drum: true });

    const sh = { shift };
    const HOOK = GANCHO.em({}); // G5 E5 C6: o SOC-CER-MON em Dó maior
    // o órgão começa o motivo (Sol, Dó) e os metais tomam a frase em maior: Mi, não Mi♭
    mel(org, 0, ['G4:1 r:1 C5:1 r:13', 'r:16', 'C5+G5+D6:4 r:12'], sh);
    mel(met, 0, ['r:4 E5:2 F#5:1 G5:3 r:6', HOOK, 'C5+G5+D6:4 r:12'], sh);
    mel(met2, 0, ['r:16', HOOK], { shift, harm: thirdBelow(MAJOR(shift)) });
    const TRIO = [
        [10, 1],
        [12, 1],
        [14, 2],
    ];
    stabs(trio, 0, transpose('C', shift), TRIO, { low: 59, n: 4 });
    bass(bs, 0, transpose('C7', shift), '0:1 r:1 8:1 r:1 3:1 r:1 4:1 5:2 r:1 s:1 5:1 4:1 3:1 r:2');
    bass(bs, 1, transpose('C', shift), '0:3 8:3 0:6 r:2 5:1 8:1');
    bass(bs, 2, transpose('C', shift), '0:2 r:14');
    stabs(ch, 0, transpose('C7', shift), [2, 6], { low: 60, n: 3 });
    drum(k, 0, 1, 'X..x....X.x.....');
    drum(sn, 0, 1, '....X..o....xxXX');
    drum(hh, 0, 1, 'x.x.x.x.x.x.x.x.');
    drum(bl, 0, 1, 'x..x..x.........');
    drum(k, 1, 1, 'X.....X.........');
    drum(sn, 1, 1, '......X.........');
    drum(gang, 1, 1, GANCHO.palmas);
    drum(cr, 1, 1, 'X...............');
    // lá vão eles: o apito sobe em escada por baixo do gancho, e o sino pisca lá no alto
    for (let i = 0; i < 6; i++) voo.note(16 + 2 * i, 2 * i, 0, 0.5 + 0.08 * i);
    mel(brilho, 1, ['r:14 G7:2'], sh);
    drum(k, 2, 1, 'X...............');
    drum(cr, 2, 1, 'X...............');
    return S;
}
