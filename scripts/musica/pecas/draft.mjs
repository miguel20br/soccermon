// Draft, "escolha 1 de 3" (rodada 8): o jogador lê cartas, então calmo, mas com expectativa, e tem que aguentar um
// loop longo sem cansar. Fá maior, 108 BPM, funk leve com swing (referências que ele marcou: Funk Game Loop, Skate,
// Rhythm). Lead macio (flauta triangular) com muita pausa; acordes sus4 que pedem a próxima carta.
// Assinatura: as TRÊS CARTAS. No fim de cada frase, três sinos em 3-3-2 (o ritmo do SOC-CER-MON), um de cada lado
// (esquerda, meio, direita), cada um com o "flip" de carta virando (ruído com slide). Na virada do loop, o baralho
// embaralha (flips em semicolcheia).
// Pergunta e resposta: a flauta pergunta, o pizzicato responde; no B, o vibrafone canta e a flauta acompanha embaixo
// e fecha com o SOC-CER-MON em Fá (o clap 808 responde "hey hey").
// Forma: intro (2) | A (8) | B (8): Ré menor, vibrafone, Si♭ lídio | C (8): respiro em Ré♭ e Mi♭ (emprestados), só
// pizzicato, cordas e cartas | A' (8) meio tom acima (Fá#), flauta em terças | virada (1): Dó7, o baralho embaralha.
// Loop do compasso 2 ao fim (~73 s).
import {
    arp,
    bass,
    drum,
    GANCHO,
    I,
    ins,
    MAJOR,
    mel,
    padChord,
    Song,
    stabs,
    thirdBelow,
    transpose,
} from '../synth.mjs';

export const meta = { titulo: 'Draft (três cartas)', tela: 'Draft' };

// carta virando: ruído curto que sobe (o "flip" do papel)
export const FLIP = ins({
    vol: 0.16,
    freq: 700,
    a: 0.001,
    r: 0.045,
    shape: 4,
    slide: 30,
    sv: 0.4,
    d: 0.015,
    filter: 1400,
});

export default function draft() {
    const S = new Song({ bpm: 108, bars: 35, swing: 0.1, tail: 3, loopFrom: 2 });
    const fl = S.part('flauta', I.counter, { pan: -0.1, gain: 1.4, echo: { rows: 3, fb: 0.25, mix: 0.2 }, rev: 0.2 });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.6, rev: 0.2 });
    const vib = S.part('vibrafone', I.bell, { pan: 0.15, gain: 2.4, echo: { rows: 6, fb: 0.2, mix: 0.2 }, rev: 0.3 });
    const pz = S.part('pizzicato', I.pizz, { pan: 0.3, gain: 1.3, rev: 0.15 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.15 });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.3 });
    const bs = S.part('baixo', I.bass, { gain: 0.6 });
    const cartas = [-0.6, 0, 0.6].map((pan, i) => [
        S.part(`carta${i + 1}`, I.bell, { pan, gain: 2, rev: 0.3 }),
        S.part(`flip${i + 1}`, FLIP, { drum: true, pan, gain: 1.6 }),
    ]);
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.7 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6000, sala: 0.35 }), {
        drum: true,
        gain: 1,
        rev: 0.1,
    });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.9 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.3 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.4, gain: 0.8 });

    /** As três cartas (linhas 8, 11 e 14, em 3-3-2): esquerda, meio, direita. */
    const virar = (b, notas) => {
        notas.forEach((n, i) => {
            const r = [8, 11, 14][i];
            mel(cartas[i][0], b, [`r:${r} ${n}:2 r:${14 - r}`]);
            drum(cartas[i][1], b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    };
    const groove = (b, n) => {
        drum(sh, b, 1, 'xoxoxoxoxoxoxoxo');
        drum(bl, b, 1, 'x..x..x.........');
        if (n === 0) return drum(k, b, 1, 'X.........x.....');
        drum(k, b, 1, 'X.......X.x.....');
        drum(cl, b, 1, '....x.......x...');
        drum(hh, b, 1, n === 2 ? 'x.xxx.x.x.xxx.x.' : 'x.x.x.x.x.x.x.x.');
    };
    const BASS = '0:3 0:1 r:2 5:2 r:2 8:1 r:1 s:2 5:2';
    const comp = (b, c) =>
        stabs(
            ep,
            b,
            c,
            [
                [0, 3],
                [6, 2],
                [10, 4],
            ],
            { low: 57, n: 4, vel: 0.8 },
        );

    const A_CH = ['Fmaj7', 'Am7', 'Bbmaj7', 'C7sus4', 'Fmaj7', 'Am7', 'Gm7', 'C7sus4'];
    const A_FL = [
        'A5:3 G5:3 E5:2 r:8',
        'r:16',
        'D6:3 C6:3 A5:2 r:4 F5:2 G5:2',
        'A5:6 G5:2 r:8',
        'A5:3 G5:3 E5:2 r:4 C5:2 E5:2',
        'G5:8 r:8',
        'Bb5:3 A5:3 F5:2 D5:2 F5:2 G5:2 A5:2',
        'G5:12 r:4',
    ];
    const A_PZ = [
        'r:16',
        'r:2 E5:2 G5:2 C6:4 B5:2 A5:4',
        'r:16',
        'r:8 Bb4:2 C5:2 F5:4',
        'r:16',
        'r:8 E5:2 G5:2 C6:4',
        'r:16',
        'r:16',
    ];
    const B_CH = ['Dm7', 'Bbmaj7', 'Gm7', 'A7sus4', 'Dm7', 'Bbmaj7', 'Gm7', 'C7sus4'];
    const B_VIB = [
        'F5:4 A5:4 C6:6 r:2',
        'D6:4 C6:4 A5:8',
        'Bb5:4 D6:4 F6:6 r:2',
        'E6:8 D6:8',
        'F5:4 A5:4 C6:6 r:2',
        'D6:4 F6:4 E6:8',
        'D6:4 Bb5:4 G5:8',
        'r:16',
    ];
    const B_FL = [
        'r:8 A4:8',
        'Bb4:8 A4:8',
        'r:8 Bb4:8',
        'A4:8 G4:8',
        'r:8 A4:8',
        'Bb4:8 A4:8',
        'G4:8 F4:8',
        GANCHO.em({ tom: 5, oitava: -1 }),
    ];
    const C_CH = ['Dbmaj7', 'Ebmaj7', 'Fmaj7', 'Fmaj7', 'Dbmaj7', 'Ebmaj7', 'Gm7', 'C#7'];

    // intro: o piano e as cartas
    comp(0, 'Fmaj7');
    comp(1, 'C7sus4');
    bass(bs, 0, 'Fmaj7', '0:6 r:2 5:4 8:4', { vel: 0.8 });
    bass(bs, 1, 'C7sus4', '0:6 r:2 5:4 8:4', { vel: 0.8 });
    drum(sh, 0, 2, 'x.x.x.x.x.x.x.x.');
    virar(1, ['C6', 'D6', 'F6']);

    // A e A' (meio tom acima, flauta em terças)
    for (const [b0, s] of [
        [2, 0],
        [26, 1],
    ]) {
        mel(fl, b0, A_FL, { shift: s });
        mel(pz, b0, A_PZ, { shift: s });
        if (s) mel(harm, b0, A_FL, { shift: s, harm: thirdBelow(MAJOR(5 + s)) });
        A_CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            groove(b0 + i, s ? 2 : 1);
            bass(bs, b0 + i, c, BASS);
            comp(b0 + i, c);
            if (s) padChord(str, b0 + i, c, 16, { low: 55, n: 4, vel: 0.7 });
        });
        virar(b0 + 7, s ? ['C#6', 'D#6', 'F#6'] : ['C6', 'D6', 'F6']);
    }
    // B: o vibrafone canta, a flauta acompanha e fecha com o SOC-CER-MON
    mel(vib, 10, B_VIB);
    mel(fl, 10, B_FL);
    drum(cl, 17, 1, GANCHO.palmas, { vel: 1.3 });
    B_CH.forEach((c, i) => {
        groove(10 + i, 1);
        bass(bs, 10 + i, c, BASS);
        comp(10 + i, c);
    });
    // C: respiro (Ré♭, Mi♭ emprestados), pizzicato em arpejo, cordas, sem clap
    mel(vib, 18, ['F5:16', 'G5:16', 'r:16', 'r:16', 'F5:16', 'G5:16', 'r:16', 'r:16']);
    mel(fl, 20, ['C6:3 A5:3 F5:2 r:8', 'G5:3 A5:3 C6:2 r:8']);
    mel(fl, 24, ['Bb5:3 A5:3 G5:2 r:8']);
    C_CH.forEach((c, i) => {
        const b = 18 + i;
        groove(b, 0);
        bass(bs, b, c, '0:6 r:2 5:4 8:4');
        arp(pz, b, c, { low: 60, step: 2, vel: 0.8 });
        padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.8 });
    });
    virar(25, ['C#6', 'F6', 'G#6']);
    // virada: Dó7 (volta pro Fá), o baralho embaralha
    bass(bs, 34, 'C7', '0:4 5:4 s:4 8:4');
    comp(34, 'C7');
    drum(cartas[1][1], 34, 1, 'x.x.x.x.xxxxXXXX');
    drum(sh, 34, 1, 'xoxoxoxoxoxoxoxo');
    drum(k, 34, 1, 'X.......X.......');
    mel(fl, 34, ['r:8 E5:2 G5:2 Bb5:2 C6:2']);
    return S;
}
