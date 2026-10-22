// Na ponta do pé v2 (rodada 8, extra): a cena boba do Modo história (Lá menor, 108 BPM, staccato, fagote,
// pizzicato), que repetia os mesmos 8 compassos, ganha desenvolvimento. Pergunta e resposta (o pizzicato pergunta,
// o fagote responde grave), um B em que o plano dá errado (sobe na ponta do pé pelo cromático, tropeça: apito
// descendo, "bonk" no tom e um tempo de silêncio), o SOC-CER-MON cochichado no clarinete com o bloco respondendo
// "hey hey" baixinho, e a volta final meio tom acima (Si♭ menor), mais atrevida.
// Forma: A (8) | A2 (8): clarinete e fagote | B (8): o plano dá errado | A' (8) meio tom acima | virada (1): Mi7.
// Loop inteiro (~73 s). Proposta de tela: cenas engraçadas do Modo história.
import { bass, drum, I, mel, Song, stabs, transpose } from '../synth.mjs';

export const meta = { titulo: 'Na ponta do pé v2', tela: 'Modo história (momentos bobos)' };

export default function cutsceneBobaV2() {
    const S = new Song({ bpm: 108, bars: 33, swing: 0.22, tail: 2, loopFrom: 0 });
    const pz = S.part('pizz', I.pizz, { pan: -0.15, gain: 2.2, rev: 0.1 });
    const fag = S.part('fagote', I.bassoon, { gain: 1 });
    const fag2 = S.part('fagote2', I.bassoon, { pan: 0.3, gain: 0.6 });
    const cl = S.part('clarinete', I.thin, { pan: 0.3, gain: 1.4 });
    const st = S.part('stab', I.stab, { pan: 0.2, gain: 0.5 });
    const blk = S.part('bloco', I.block, { drum: true, pan: 0.25, gain: 0.8 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const tm = S.part('bonk', I.tom, { drum: true, gain: 0.9 });
    const up = S.part('apito', I.whistle, { gain: 3, drum: true, pan: -0.3 });
    const down = S.part('apitoDesce', I.whistleDown, { gain: 3, drum: true, pan: 0.3 });

    const M = [
        'A4:1 r:1 B4:1 r:1 C5:1 r:1 E5:2 r:2 D#5:1 r:1 E5:1 r:3',
        'G#4:1 r:1 B4:1 r:1 D5:1 r:1 F5:2 r:2 E5:1 r:1 D5:1 r:3',
        'C5:1 r:1 B4:1 r:1 A4:1 r:1 G#4:1 r:1 A4:1 r:1 C5:1 r:1 E5:2 r:2',
        'F5:1 r:1 E5:1 r:1 D#5:1 r:1 E5:1 r:1 B4:4 r:4',
        'D5:1 r:1 F5:1 r:1 A5:2 r:2 G#5:1 r:1 A5:1 r:5',
        'E5:1 r:1 C5:1 r:1 A4:2 r:2 B4:1 r:1 C5:1 r:5',
        'D#5:1 r:1 F#5:1 r:1 A5:2 r:2 F#5:1 r:1 D#5:1 r:5',
        'E5:1 r:1 r:2 r:4 B4:1 r:1 E4:1 r:5',
    ];
    // o fagote responde nos buracos do pizzicato
    const RESP = [
        'r:12 E3:1 r:1 E3:1 r:1',
        'r:12 G#3:1 r:1 B3:1 r:1',
        'r:16',
        'r:8 E3:1 r:1 F3:1 r:1 F#3:1 r:1 G#3:1 r:1',
        'r:12 D3:1 r:1 D3:1 r:1',
        'r:12 C3:1 r:1 B2:1 r:1',
        'r:12 B2:1 r:1 B2:1 r:1',
        'r:2 E3:1 r:5 r:8',
    ];
    const CH = ['Am', 'E7', 'Am', 'E7', 'Dm', 'Am', 'B7', 'E7'];
    // B: o plano. Sobe na ponta do pé (cromático), cochicha o SOC-CER-MON, tropeça
    const B = [
        'D4:1 r:1 D#4:1 r:1 E4:1 r:1 F4:1 r:1 F#4:1 r:1 G4:1 r:1 G#4:1 r:1 A4:1 r:1',
        'r:16',
        'A4:1 r:1 A#4:1 r:1 B4:1 r:1 C5:1 r:1 C#5:1 r:1 D5:1 r:1 D#5:1 r:1 E5:1 r:1',
        'r:16',
        'E5:1 r:2 C5:1 r:2 A5:1 r:9',
        'F5:1 r:2 D5:1 r:2 B5:1 r:9',
        'C6:1 r:1 B5:1 r:1 A5:1 r:1 G#5:1 r:1 F5:1 r:1 E5:1 r:1 D5:1 r:1 C5:1 r:1',
        'r:16',
    ];
    const B_CH = ['Dm', 'Dm', 'F', 'F', 'Am', 'Dm', 'E7', 'E7'];
    const base = (b, c) => {
        bass(fag, b, c, '0:1 r:3 5:1 r:3 0:1 r:3 5:1 r:3', { oct: 12 });
        stabs(
            st,
            b,
            c,
            [
                [6, 1],
                [14, 1],
            ],
            { low: 57, n: 3, vel: 0.6 },
        );
        drum(blk, b, 1, '..x...x...x...x.');
        drum(k, b, 1, 'x.......x.......');
    };
    for (const [b0, s] of [
        [0, 0],
        [8, 0],
        [24, 1],
    ]) {
        mel(pz, b0, M, { shift: s });
        mel(fag2, b0, RESP, { shift: s });
        if (b0) mel(cl, b0, M.slice(0, 4), { shift: s + 12, vel: 0.6 });
        for (const [i, c] of CH.entries()) base(b0 + i, transpose(c, s));
        drum(up, b0 + 7, 1, '..........x.....');
    }
    // B
    mel(pz, 16, B.slice(0, 4));
    mel(fag2, 17, ['D3:1 r:1 E3:1 r:1 F3:2 r:10']);
    mel(fag2, 19, ['F3:1 r:1 G3:1 r:1 A3:2 r:10']);
    mel(cl, 20, B.slice(4, 6), { vel: 0.7 });
    drum(blk, 20, 2, '............x.x.', { pitch: 7, vel: 0.6 });
    mel(pz, 22, B.slice(6));
    B_CH.forEach((c, i) => {
        if (i < 7) base(16 + i, c); // no 8º, o tropeço: só o apito, o bonk e o silêncio
    });
    drum(down, 23, 1, 'x...............');
    drum(tm, 23, 1, '......x.........', { pitch: -4 });
    bass(fag, 23, 'E7', 'r:12 0:1 r:1 5:1 r:1', { oct: 12 });
    // virada: Mi7, de volta pro Lá menor
    base(32, 'E7');
    mel(pz, 32, ['E5:1 r:1 r:2 r:4 B4:1 r:1 E4:1 r:5']);
    drum(down, 32, 1, '..........x.....');
    return S;
}
