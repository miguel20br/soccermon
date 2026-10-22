// Mt. Moon v2 (rodada 8, extra): a caverna (Ré menor, 132 BPM, baixo insistente, arpejo, eco), levada pra régua da
// rodada 6. Pergunta e resposta: a flauta pergunta e os sininhos de Clefairy respondem nas notas longas. Gotas
// pingando (bloco agudo com eco) na intro e nas viradas. No B, o SOC-CER-MON em Ré menor e o clap 808 com eco longo,
// como palma batida dentro da caverna. Volta final meio tom acima (Mi♭ menor), com terças.
// Forma: intro (2): gotas e baixo | A (8) | B (8) | A' (8) meio tom acima | virada (1): Lá7.
// Loop do compasso 2 ao fim (~49 s). Proposta de tela: região Mt. Moon no mapa.
import { arp, bass, drum, GANCHO, I, MINOR, mel, midi, Song, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Mt. Moon v2', tela: 'Mapa: Mt. Moon' };

export default function mtMoonV2() {
    const S = new Song({ bpm: 132, bars: 27, tail: 3, loopFrom: 2 });
    const lead = S.part('flauta', I.counter, { pan: -0.1, gain: 1.1, echo: { rows: 3, fb: 0.4, mix: 0.3 }, rev: 0.2 });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.5, rev: 0.2 });
    const ar = S.part('arpejo', I.thin, { pan: 0.4, gain: 0.45 });
    const bs = S.part('baixo', I.bass, { gain: 0.6 });
    const bell = S.part('clefairy', I.bell, { pan: 0.5, gain: 1.8, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const gota = S.part('gotas', I.block, { drum: true, pan: -0.45, gain: 0.7, echo: { rows: 6, fb: 0.45, mix: 0.5 } });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.8 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.6 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.8 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6000, sala: 0.5 }), {
        drum: true,
        gain: 1.2,
        echo: { rows: 4, fb: 0.4, mix: 0.45 },
        rev: 0.3,
    });

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
    // Clefairy responde nas notas longas
    const RESP = ['r:16', 'r:8 D6:2 F6:2 Bb6:4', 'r:16', 'r:8 E6:2 G6:2 A6:4', 'r:16', 'r:16', 'r:16', 'r:16'];
    const B = [
        'G5:6 A5:2 Bb5:4 A5:4',
        'F5:6 E5:2 D5:8',
        'D5:4 F5:4 Bb5:4 A5:4',
        'G5:4 E5:4 C#5:8',
        'Bb5:6 C6:2 D6:4 C6:4',
        'A5:6 G5:2 F5:8',
        GANCHO.em({ menor: true, tom: 2 }),
        'C#5:4 E5:4 A5:8',
    ];
    const ACH = ['Dm', 'Bb', 'C', 'A7', 'Dm', 'Bb', 'C', 'A7'];
    const BCH = ['Gm', 'Dm', 'Bb', 'A7', 'Gm', 'Dm', 'Bb', 'A7'];
    const SPARK = ['A6', 'D7', 'F6', 'C7', 'G6', 'A6', 'D7', 'E6'];
    const bar = (b, c, s) => {
        bass(bs, b, c, '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2');
        arp(ar, b, c, { low: 62, step: 1, pattern: [0, 1, 2, 4, 2, 1] });
        if (b % 2 === 1) bell.note(b * 16 + ((b * 5) % 12) + 2, midi(SPARK[b % 8]) + s, 2, 0.6);
        drum(k, b, 1, 'X.....x.X.......');
        drum(sn, b, 1, '....x.......x...');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.');
    };
    // intro: gotas e o baixo
    bass(bs, 0, 'Dm', '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2', { vel: 0.7 });
    bass(bs, 1, 'A7', '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2', { vel: 0.7 });
    drum(gota, 0, 1, 'x.........x.....', { pitch: 14 });
    drum(gota, 1, 1, '......x.......x.', { pitch: 17 });
    drum(hh, 1, 1, 'x.x.x.x.x.x.x.x.');

    for (const [b0, s] of [
        [2, 0],
        [18, 1],
    ]) {
        mel(lead, b0, A, { shift: s });
        mel(bell, b0, RESP, { shift: s });
        if (s) mel(harm, b0, A, { shift: s, harm: thirdBelow(MINOR(2 + s)) });
        ACH.forEach((c, i) => {
            bar(b0 + i, transpose(c, s), s);
        });
        drum(tm, b0 + 7, 1, '........x.x.x.xx', { pitch: 2 + s });
        drum(gota, b0 + 3, 1, '..........x.....', { pitch: 14 + s });
    }
    mel(lead, 10, B);
    mel(harm, 14, B.slice(4, 6), { harm: thirdBelow(MINOR(2)) });
    BCH.forEach((c, i) => {
        bar(10 + i, c, 0);
    });
    drum(cl, 16, 1, GANCHO.palmas);
    drum(tm, 17, 1, '........x.x.x.xx', { pitch: 2 });
    // virada: Lá7, gotas, de volta pro Ré menor
    bar(26, 'A7', 0);
    mel(lead, 26, ['A5:8 G5:2 F5:2 E5:2 C#5:2']);
    drum(gota, 26, 1, '......x.......x.', { pitch: 17 });
    return S;
}
