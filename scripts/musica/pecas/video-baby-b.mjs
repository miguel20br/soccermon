// Vídeo da Rota de baby, conceito B "Ninguém botava fé" (animatic, 23/10/2026). Comédia: o técnico rival levanta uma
// placa a cada fase, e o comentário fica menos debochado até a final, quando o Magikarp capitão vira Gyarados.
// A história está no trompete com surdina: ele "fala" cada placa (o ritmo e o contorno das sílabas), e o Magikarp
// responde com uma frasinha no pulso fino que cresce a cada fase. Na evolução, a pergunta do começo
// ("MA-GI-KARP DE CA-PI-TÃO?", que sobe no fim como pergunta) volta nos metais, aumentada e em Ré menor, e termina
// firme na tônica: virou resposta. Depois o ska volta como hino, um tom acima (Sol), e fecha no SOC-CER-MON.
// A torcida (gravada, CC0) entra na montagem do vídeo, não aqui: "óóó" no compasso 3 e o grito no 5.
// Som de assinatura: o PLOF do Magikarp (splash), no Splash do começo e no último tempo, depois do acorde final.
// 156 BPM, compasso 1,5385 s, 13 compassos = 20,0 s. Cada compasso é um corte do vídeo:
//   0     placa "MAGIKARP DE CAPITÃO?": ska em Fá, o trompete pergunta e o apito de êmbolo sobe no "TÃO?"
//   1     Splash: quatro PLOFs subindo, o baque no chão, o trombone "uá-uá" e a torcida rindo no tempo
//   2     Pewter, "FOI SORTE.": o trompete desce, o Magikarp responde baixinho
//   3     Cerulean, "TÁ, ELE CORRE.": o trompete hesita, a resposta sobe mais, a torcida faz "óóó"
//   4     final, ele brilha, "MARCA O MAGIKARP!": a banda para e bate junto com o trompete em Lá7; rufar, o baixo
//         sobe pelo cromático e meia batida de silêncio
//   5–6   GYARADOS: impacto, Ré menor em meio tempo, a pergunta vira resposta nos metais largos; Ré maior e Ré7
//   7–10  explicação: o ska em Sol com a banda inteira, a frase agora termina na tônica; metais respondem
//   11–12 tela final: SOC-CER-MON duas vezes com as palmas, acorde final e o PLOF
import { risada, rugido, sobe, splash } from '../curtas.mjs';
import { bass, drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { bumbo, desafina, estalo, impacto, SERRA, SUPER, subida } from './trailer-abertura.mjs';

export const meta = { titulo: 'Rota de baby: Ninguém botava fé (animatic)', tela: 'Vídeo', lufs: -14 };

// trombone com surdina: a altura cai e volta (o "uá")
const UA = ins({
    vol: 0.38,
    a: 0.03,
    r: 0.12,
    shape: 2,
    curve: 0.8,
    sv: 0.85,
    d: 0.06,
    slide: -0.3,
    rep: 0.12,
    trem: 0.35,
});

export default function videoBabyB() {
    const BAR5 = (16 * 5 * 60) / 156 / 4;
    const S = new Song({ bpm: 156, bars: 13, swing: 0.04, tail: 2.5, masterAt: (t) => (t < BAR5 ? 0.9 : 1) });

    // vozes
    const tpt = S.part('trompete', I.brass, { pan: -0.15, gain: 1.5, corte: 1900, rev: 0.12 });
    const kp = S.part('magikarp', I.thin, {
        pan: 0.25,
        gain: 1.0,
        echo: { rows: 3, fb: 0.25, mix: 0.25 },
        corte: 7000,
    });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.9, corte: 2200, rev: 0.2 });
    const metal = S.part('metais', I.brass, { pan: 0.1, gain: 1.2, corte: 5000, rev: 0.2 });
    const largo = [-1, 1].map((l) =>
        desafina(
            S.part(`largo ${l}`, SERRA, { pan: 0.8 * l, gain: 0.9, corte: 6500, rev: 0.15 }),
            0.07 * l,
            l > 0 ? 0.12 : 0,
        ),
    );
    const terc = S.part('terças', I.pulse, { pan: 0.3, gain: 0.4, corte: 6000 });
    // banda
    const skank = S.part('guitarra', I.chank, { pan: 0.35, gain: 4 });
    const org = S.part('órgão', I.organ, { pan: -0.35, gain: 0.7 });
    const bs = S.part('baixo', I.bass, { gain: 0.55 });
    const pad = S.part('pad', SUPER, { gain: 0.9, rev: 0.3, corte: 5000 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    // bateria e sons
    const k = S.part('bumbo', bumbo(), { drum: true, gain: 0.8 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.55 });
    const es = S.part('estalo', estalo(), { drum: true, gain: 0.3 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.25 }), {
        drum: true,
        gain: 1.0,
        rev: 0.15,
    });
    const torc = S.part('palmas torcida', I.palmas, { drum: true, gain: 0.6, rev: 0.2 });
    const tp = S.part('tímpano', I.timp, { drum: true, gain: 0.22, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.5 });
    const ap = S.part('apito', I.whistle, { drum: true, gain: 1.3, rev: 0.15 });
    const pl = S.part('plof', splash, { pan: -0.1, gain: 0.9, rev: 0.15 });
    const ri = S.part('risada', risada(1.3, (156 / 60) * 2), { drum: true, pan: 0.15, gain: 1.3, rev: 0.25 });
    const ru = S.part('rugido', rugido, { drum: true, gain: 0.9, rev: 0.25 });
    const im = S.part('impacto', impacto(), { drum: true, gain: 0.9 });
    const sb = S.part('subida', subida((6 * 60) / 156 / 4), { drum: true, gain: 0.45 });
    const brilho = S.part('brilho', sobe(1.5), { drum: true, gain: 0.35 });

    // ska: bumbo no 1 e no 3, caixa no 2 e no 4, guitarra no contratempo, órgão "bubble" logo depois
    const ska = (b, c1, c2 = c1, cheio = false) => {
        drum(k, b, 1, cheio ? 'X...X...X...X...' : 'X.......X.......');
        drum(sn, b, 1, '....X.......X...');
        drum(es, b, 1, '....x.......x...');
        drum(hh, b, 1, cheio ? 'x.xxx.xxx.xxx.xx' : 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        if (cheio) drum(cl, b, 1, '....x.......x...', { vel: 0.8 });
        stabs(skank, b, c1, [2, 6], { low: 62, n: 3 });
        stabs(skank, b, c2, [10, 14], { low: 62, n: 3 });
        stabs(org, b, c1, [3, 7], { low: 55, n: 3, vel: 0.6 });
        stabs(org, b, c2, [11, 15], { low: 55, n: 3, vel: 0.6 });
        if (c1 === c2) bass(bs, b, c1, '0:4 3:4 5:4 3:4');
        else {
            bass(bs, b, c1, '0:4 5:4 r:8');
            bass(bs, b, c2, 'r:8 0:4 5:4');
        }
    };

    // 0: a placa. O trompete pergunta "MA-GI-KARP DE CA-PI-TÃO?" e o apito sobe junto no "TÃO?"
    ska(0, 'F');
    mel(tpt, 0, ['C5:1 r:1 C5:1 r:1 A4:2 r:2 A4:1 r:1 C5:1 D5:1 F5:4~']);
    ap.note(12, 0, 0, 0.9);

    // 1: o Splash. Quatro PLOFs subindo, o baque, o trombone triste e a torcida rindo no tempo
    ska(1, 'F');
    [0, 2, 4].forEach((r, i) => {
        pl.note(16 + r, 60 + i * 4, 1, 0.9);
    });
    pl.note(16 + 5, 48, 1, 1.1);
    mel(ua, 1, ['r:6 C4:2 B3:2 Bb3:2 A3:4']);
    ri.note(16 + 7, 0, 0, 1);

    // 2: Pewter, "FOI SORTE." O trompete desce; o Magikarp responde baixinho
    ska(2, 'Bb', 'C7');
    mel(tpt, 2, ['F5:2 D5:2 C5:3 r:1 r:8']);
    mel(kp, 2, ['r:8 C5:1 D5:1 F5:1 r:1 A5:2 r:2'], { vel: 0.8 });

    // 3: Cerulean, "TÁ, ELE CORRE." O trompete hesita; a resposta sobe mais; a torcida "óóó"
    ska(3, 'Dm', 'Bb', true);
    mel(tpt, 3, ['D5:2 r:1 D5:1 E5:1 F5:2 E5:1 r:8']);
    mel(kp, 3, ['r:8 C5:1 F5:1 A5:1 C6:1 D6:2 C6:2']);
    mel(terc, 3, ['r:8 A4:1 C5:1 F5:1 A5:1 Bb5:2 A5:2'], { vel: 0.7 });

    // 4: a final. Ele brilha. "MAR-CA O MA-GI-KARP!": a banda para e bate junto com o trompete, em Lá7
    mel(tpt, 4, ['A4:1 C#5:1 D5:1 E5:1 G5:1 A5:3 r:8']);
    for (const r of [0, 1, 2, 3, 4, 5]) stabs(skank, 4, 'A7', [r], { low: 62, n: 4 });
    stabs(org, 4, 'A7', [[5, 3]], { low: 55, n: 4 });
    drum(k, 4, 1, 'X....X..........');
    drum(sn, 4, 1, '.....X..xxxxXX..', { vel: 0.8 });
    drum(cr, 4, 1, '.....x..........');
    mel(bs, 4, ['A2:1 C#3:1 D3:1 E3:1 G3:1 A2:3 A2:2 Bb2:2 B2:2 r:2']);
    sb.note(4 * 16 + 8, 0, 0, 1);
    brilho.note(4 * 16 + 1, 0, 0, 1);

    // 5–6: GYARADOS. A pergunta vira resposta: aumentada, Ré menor, metais largos, meio tempo
    im.note(5 * 16, 0, 0, 1);
    ru.note(5 * 16, -2, 0, 1);
    drum(cr, 5, 1, 'X...............');
    const RESP = ['A4:2 A4:2 F4:4 r:2 F4:2 A4:2 Bb4:2', 'D5:8 F#5:4 A5:4'];
    for (const P of largo) mel(P, 5, RESP);
    mel(metal, 5, RESP, { vel: 0.9 });
    mel(metal, 5, ['r:16', 'r:8 A4:4 C5:4']);
    [
        [5, 'Dm', 'Bb'],
        [6, 'D', 'D7'],
    ].forEach(([b, c1, c2]) => {
        padChord(pad, b, c1, 8, { low: 50, n: 4 });
        padChord(pad, b, c2, 8, { low: 50, n: 4, at: 8 });
        padChord(str, b, c1, 8, { low: 62, n: 3 });
        padChord(str, b, c2, 8, { low: 62, n: 3, at: 8 });
        bass(bs, b, c1, '0:6 0:2 r:8');
        bass(bs, b, c2, 'r:8 0:6 0:2');
        drum(k, b, 1, 'X.....x...X.....');
        drum(sn, b, 1, '........X.......');
        drum(es, b, 1, '........X.......');
        drum(cl, b, 1, '........x.......');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.5 });
    });
    drum(tp, 5, 1, 'X.......X.......', { pitch: -7 });
    drum(tp, 6, 1, 'X.......X.xxXXXX', { pitch: -2 });

    // 7–10: o ska de volta, um tom acima, com a banda inteira; a frase agora termina na tônica
    drum(cr, 7, 1, 'X...............');
    ska(7, 'G', 'G', true);
    ska(8, 'C', 'D7', true);
    ska(9, 'Em', 'C', true);
    ska(10, 'Am7', 'D7', true);
    const HINO = [
        'D5:1 r:1 D5:1 r:1 B4:2 r:2 B4:1 r:1 D5:1 E5:1 G5:4',
        'r:16',
        'E5:1 r:1 E5:1 r:1 C5:2 r:2 C5:1 r:1 E5:1 F#5:1 A5:4',
        'B5:2 A5:2 F#5:2 D5:2 r:8',
    ];
    const RESP_HINO = ['r:16', 'A5:2 G5:2 E5:2 C5:2 F#5:4 D5:4', 'r:16', 'r:16'];
    mel(tpt, 7, HINO);
    mel(metal, 7, HINO, { vel: 0.7 });
    mel(kp, 7, RESP_HINO);
    mel(terc, 7, RESP_HINO, { vel: 0.8 });
    drum(sn, 10, 1, '........xxXxXXXX', { vel: 0.8 });

    // 11–12: tela final. SOC-CER-MON duas vezes com a banda e as palmas; o acorde final e o PLOF
    const G1 = GANCHO.em({ tom: 7, oitava: -1 });
    mel(tpt, 11, [G1]);
    for (const P of largo) mel(P, 11, [G1, 'D6:3 B5:3 G6:10']);
    mel(metal, 11, [G1, 'D5:3 B4:3 G5:10']);
    drum(cl, 11, 1, GANCHO.palmas);
    drum(torc, 11, 1, GANCHO.palmas, { vel: 0.8 });
    drum(cr, 11, 1, 'X...............');
    ska(11, 'G', 'C', true);
    stabs(skank, 12, 'G', [0, 3, 6], { low: 62, n: 3 });
    stabs(org, 12, 'G', [[6, 10]], { low: 55, n: 4 });
    padChord(pad, 12, 'G', 16, { low: 50, n: 4 });
    mel(bs, 12, ['G2:3 G2:3 G2:10']);
    drum(k, 12, 1, 'X..X..X.........');
    drum(sn, 12, 1, 'X..X..X.........');
    drum(cr, 12, 1, '......X.........');
    drum(tp, 12, 1, '......X.........', { pitch: -2 });
    pl.note(12 * 16 + 14, 72, 1, 0.8);
    return S;
}
