// Mercado funk (rodada 4): o Mercado na base funk que o Miguel prefere, em Si bemol menor dórico (o tom que a
// análise deu pra "Mt Fox Shop", que ele ama), 104 BPM. Clavinete, órgão, slap, metais curtos, cowbell e o "plim" de
// caixa registradora no fim das frases. Melodia nossa. Rodada 5: "plim" na frente, moedas caindo, SOC-CER-MON.
// Rodada 6: o groove da v2 é o modelo (o Miguel aprovou): os 16 compassos dela ficam iguais, e entra uma parte B de 8
// (Sol♭maj7, mesmo groove) com pergunta e resposta entre o lead e os metais, pra o loop de ~55 s não cansar.
import { bass, drum, GANCHO, I, MINOR, mel, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Mercado funk', tela: 'Mercado' };

export default function mercadoFunk() {
    const S = new Song({ bpm: 104, bars: 24, swing: 0.14, tail: 3, loopFrom: 0 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('harm', I.counter, { pan: 0.3, gain: 0.6 });
    const clav = S.part('clav', I.clav, { pan: 0.35, gain: 0.9 });
    const org = S.part('organ', I.organ, { pan: -0.35, gain: 0.6 });
    const bs = S.part('slap', I.slap, { gain: 0.9 });
    const horns = S.part('metais', I.brass, { pan: 0.2, gain: 0.6 });
    const plim = S.part('plim', I.bell, { pan: 0.4, gain: 5, rev: 0.2 });
    const coin = S.part('moedas', I.coin, { drum: true, pan: -0.3, gain: 1.4, rev: 0.15 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 3 });
    const k = S.part('kick', I.kick, { drum: true });
    const sn = S.part('snare', I.snare, { drum: true });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.3, gain: 1.3 });
    const cow = S.part('cowbell', I.agogo, { drum: true, pan: -0.25, gain: 1.2 });
    const tm = S.part('tom', I.tom, { drum: true });

    const M = [
        'r:2 F5:1 F5:1 Ab5:2 Bb5:2 r:2 Ab5:1 F5:1 Eb5:2 Db5:2',
        'Eb5:3 Db5:3 Bb4:2 r:4 Db5:2 Eb5:2',
        'r:2 F5:1 F5:1 Ab5:2 Bb5:2 r:2 Db6:2 C6:2 Ab5:2',
        'G5:4 F5:2 Eb5:2 Db5:4 r:4',
        'Bb5:3 Ab5:3 F5:2 Db5:2 F5:2 Ab5:2 Bb5:2',
        'C6:3 Bb5:3 Gb5:2 Eb5:2 Gb5:2 Ab5:2 C6:2',
        'Ab5:4 F5:4 C5:4 Eb5:4',
        'A5:4 Gb5:4 Eb5:4 C5:4',
    ];
    const CH = ['Bbm7', 'Eb7', 'Bbm7', 'Eb7', 'Gbmaj7', 'Ab7', 'Fm7', 'F7b9'];
    const M2 = M.map((x, i) => (i === 3 ? 'r:16' : x)); // a pergunta fica com os metais (SOC-CER-MON)
    mel(lead, 0, [...M, ...M2]);
    mel(harm, 8, M2, { harm: thirdBelow(MINOR(10)) });
    // B (16-23): o lead pergunta em 2 compassos, os metais respondem nos 2 seguintes; volta pelo Fá7b9
    const CH_B = ['Gbmaj7', 'Fm7', 'Ebm7', 'Ab7', 'Gbmaj7', 'Fm7', 'Ebm7', 'F7b9'];
    mel(lead, 16, [
        'Bb5:3 Db6:3 F6:2 r:2 Eb6:2 Db6:2 Bb5:2',
        'C6:6 Ab5:2 r:8',
        'r:16',
        'r:16',
        'Db6:3 F6:3 Ab6:2 r:2 Gb6:2 F6:2 Db6:2',
        'Eb6:6 C6:2 r:8',
        'Gb5:2 Bb5:2 Db6:2 Eb6:2 Gb6:4 F6:4',
        'Eb6:4 C6:4 A5:4 Gb5:4',
    ]);
    mel(harm, 22, ['Gb5:2 Bb5:2 Db6:2 Eb6:2 Gb6:4 F6:4', 'Eb6:4 C6:4 A5:4 Gb5:4'], { harm: thirdBelow(MINOR(10)) });
    mel(horns, 18, ['Gb5:3 Bb5:3 Db6:2 r:2 C6:2 Bb5:2 Gb5:2', 'Ab5:6 Eb5:2 r:8'], { vel: 1.4 });
    [...CH, ...CH, ...CH_B].forEach((c, b) => {
        bass(bs, b, c, '0:2 8:1~ 0:1 r:2 5:1 8:1 r:2 0:1 8:1 s:2 5:2');
        stabs(clav, b, c, [0, 3, 6, 8, 11, 14], { low: 63, n: 3, vel: 0.8 });
        stabs(
            org,
            b,
            c,
            [
                [2, 2],
                [10, 2],
            ],
            { low: 56, n: 4 },
        );
        if (b % 4 === 3)
            stabs(
                horns,
                b,
                c,
                [
                    [12, 1],
                    [14, 2],
                ],
                { low: 62, n: 3 },
            );
        if (b % 2 === 1) {
            plim.note(b * 16 + 12, 96, 2, 1); // "plim!" de caixa registradora
            plim.note(b * 16 + 12, 103, 2, 0.6);
        }
    });
    drum(k, 0, 24, 'X.....x...X..x..');
    drum(sn, 0, 24, '....X..o.o..X..o');
    drum(hh, 0, 24, 'xoxoxoxoxoxoxoxo');
    drum(cow, 0, 24, 'x...x.x...x.x...', { pitch: -7 });
    drum(tm, 7, 1, '..........x.x.x.', { pitch: 4 });
    // moedas caindo no fim de cada frase (sobem de tom uma a uma) e uma de vez em quando
    for (const b of [3, 7, 11, 15, 19, 23]) {
        for (const [j, p] of [0, 2, 4, 7].entries()) coin.note(b * 16 + 8 + j, p, 0, 0.9);
    }
    drum(coin, 0, 24, '......x.........', { vel: 0.5 });
    // SOC-CER-MON nos metais em Si bemol menor, as palmas respondem (e a melodia descansa nesse compasso)
    mel(horns, 11, [GANCHO.em({ tom: -2, menor: true })]);
    drum(gang, 11, 1, GANCHO.palmas);
    drum(tm, 15, 1, '..........x.x.x.', { pitch: 4 });
    drum(tm, 23, 1, '..........x.x.x.', { pitch: 4 });
    return S;
}
