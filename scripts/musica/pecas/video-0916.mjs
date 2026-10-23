// Vídeo da 0.9.16, "Charmander de capitão" (23/10/2026): a mistura dos três animatics da Rota de baby que o Miguel
// pediu. A espinha é o A (o Charmander do tamanho da bola que cresce a cada vitória até virar Charizard no Planalto),
// o deboche e a virada são do B (o Blue segura a placa e o trompete com surdina "fala" cada placa) e o fim é do C
// (a Polaroid da turma campeã, com o clique de verdade).
// A identidade é o piano de brinquedo do A: ele é o Charmander. Toca sozinho e tímido, os grandes riem nos metais, a
// bola mal anda e para no silêncio. Aí a quebra de ska do B entra num andamento mais rápido (a marcha troca: 124 → 150)
// e a placa vira o assunto: o trompete pergunta "CHAR-MAN-DER DE CA-PI-TÃO?" e o brinquedo responde cada vez mais
// alto (na Pewter a resposta dele é a própria evolução pro Charmeleon). Na final a banda para e bate junto com o
// trompete, a tela de evolução do jogo acelera no rufar, e o Charizard entra com a pergunta virada resposta em Ré
// menor → Ré maior. O hino em Sol traz a mesma frase da pergunta como "RES-PEI-TA O CA-PI-TÃO." (agora acaba na
// tônica), o clique da Polaroid fecha o curta e o brinquedo toca o passinho do começo. A explicação é o brinquedo
// cantando o tema por cima da banda (cada carta vira no FLIP do Draft), sobe meio tom pro SOC-CER-MON da tela final
// e a última nota é dele de novo.
// Tom e andamento: Dó (124) | Fá ska (150) | Lá7 → Ré menor → Ré maior | Sol hino | Lá♭ tela final. 18 compassos.
//   0 chegada · 1 os grandes riem · 2 o chute e o silêncio · 3 placa 1 · 4 KKKK · 5 Pewter (vira Charmeleon) ·
//   6 Cerulean · 7 final · 8 tela de evolução · 9 Charizard · 10 GOL · 11 RESPEITA O CAPITÃO · 12 Polaroid ·
//   13–15 explicação · 16 SOC-CER-MON · 17 hino e a última nota do brinquedo.
// Sons de fora (vídeo, não aqui): torcida gravada, gritos do jogo e o "status" da evolução (montar.mjs).
import { risada, rugido, sobe } from '../curtas.mjs';
import { amostra, bass, drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { FLIP } from './draft.mjs';
import { chute, quicaAteParar, quique, rede, torcida } from './livre-ginasio.mjs';
import { bumbo, desafina, estalo, impacto, SERRA, SUPER, subida } from './trailer-abertura.mjs';

export const meta = {
    titulo: 'Vídeo 0.9.16: Charmander de capitão',
    tela: 'Vídeo do modo novo (Rota de baby)',
    lufs: -14,
};

/** Andamento por compasso: o brinquedo sozinho a 124, a quebra de ska e o resto a 150. */
export const BPM = (b) => (b < 3 ? 124 : 150);

// o piano de brinquedo (triangular curta) e a lâmina de metal uma oitava acima, 12 cents desafinada (do A)
const TOY = ins({ vol: 0.34, a: 0.001, r: 0.22, shape: 1, sv: 0.1, d: 0.1 });
const LAMINA = ins({ vol: 0.12, a: 0.001, r: 0.35, shape: 0, sv: 0.05, d: 0.05 });
// o riso dos grandes: metal grave com surdina, a altura escorrega e balança ("ho-ho-ho-hôô", do A)
const RISO = ins({
    vol: 0.4,
    a: 0.02,
    r: 0.1,
    shape: 2,
    curve: 0.8,
    sv: 0.85,
    d: 0.05,
    slide: -0.2,
    rep: 0.1,
    trem: 0.3,
});
// trombone com surdina: a altura cai e volta (o "uá", do B)
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

export default function video0916() {
    const S = new Song({
        bpm: 150,
        bpmAt: BPM,
        bars: 18,
        swing: 0.04,
        tail: 2.5,
        // o brinquedo sozinho é baixinho: sobe o geral no começo; a explicação fica embaixo do texto
        masterAt: (t) => {
            const b = S.barAt(t);
            if (b < 3) return 1.3;
            if (b >= 13 && b < 16) return 0.95;
            return 1;
        },
    });

    // o Charmander
    const toy = S.part('brinquedo', TOY, { pan: 0.1, gain: 1.9, rev: 0.12 });
    const lam = S.part('lamina', LAMINA, { pan: 0.1, gain: 1.7, rev: 0.12 });
    const toyE = S.part('brinquedo-esq', TOY, { pan: -0.15, gain: 0.9, rev: 0.12 });
    const toyMel = (b, s, o = {}) => {
        mel(toy, b, s, o);
        mel(lam, b, s, { ...o, shift: (o.shift ?? 0) + 12.12 });
    };
    // os grandes, o Blue e a banda
    const riso = S.part('riso', RISO, { pan: -0.1, gain: 1.1, corte: 2200, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.5 });
    const tpt = S.part('trompete', I.brass, { pan: -0.15, gain: 1.5, corte: 1900, rev: 0.12 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.9, corte: 2200, rev: 0.2 });
    const metal = S.part('metais', I.brass, { pan: 0.1, gain: 0.8, corte: 5000, rev: 0.2 });
    const largo = [-1, 1].map((l) =>
        desafina(
            S.part(`largo ${l}`, SERRA, { pan: 0.8 * l, gain: 0.85, corte: 6500, rev: 0.15 }),
            0.07 * l,
            l > 0 ? 0.12 : 0,
        ),
    );
    const terc = S.part('terças', I.pulse, { pan: 0.3, gain: 0.35, corte: 6000 });
    const skank = S.part('guitarra', I.chank, { pan: 0.35, gain: 4 });
    const org = S.part('órgão', I.organ, { pan: -0.35, gain: 0.7 });
    const bs = S.part('baixo', I.bass, { gain: 0.42 });
    const pad = S.part('pad', SUPER, { gain: 0.9, rev: 0.3, corte: 5000 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    // bateria
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
    // sons da cena
    const ap = S.part('apito', I.whistle, { drum: true, gain: 1.2, rev: 0.15 });
    const pe = S.part('chute', chute, { drum: true, gain: 0.7 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.25, gain: 0.8, rev: 0.15 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.8, rev: 0.25 });
    const tor = S.part('torcida', torcida(3.5, 0.3, 1.6), { drum: true, gain: 0.7, rev: 0.3 });
    const riLonga = S.part('risada', risada(1.5, (150 / 60) * 2), { drum: true, pan: 0.15, gain: 1.2, rev: 0.25 });
    const riCurta = S.part('risadinha', risada(0.7, (150 / 60) * 2, 5), {
        drum: true,
        pan: -0.15,
        gain: 0.8,
        rev: 0.25,
    });
    const ru = S.part('rugido', rugido, { drum: true, gain: 0.9, rev: 0.25 });
    const im = S.part('impacto', impacto(), { drum: true, gain: 0.9 });
    const sb = S.part('subida', subida((8 * 60) / 150 / 4), { drum: true, gain: 0.45 });
    const brilho = S.part('brilho', sobe(1.5), { drum: true, gain: 0.35 });
    const vira = S.part('vira', FLIP, { drum: true, pan: 0.2, gain: 1.8 });
    const clique = S.part('clique', amostra('polaroid-clique.wav'), { drum: true, pan: -0.1, gain: 1.3, rev: 0.1 });
    const motor = S.part('motor', amostra('polaroid-saida.wav'), { drum: true, pan: -0.1, gain: 1.2 });

    // ska: bumbo no 1 e no 3, caixa no 2 e no 4, guitarra no contratempo, órgão "bubble" logo depois (do B)
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

    // 0 · a chegada: o brinquedo sozinho, um passinho por nota (124)
    toyMel(0, ['r:2 G4:1 A4:1 C5:2 C5:2 D5:2 E5:2 G5:4']);
    mel(toyE, 0, ['C4:2 r:6 G3:2 r:6']);

    // 1 · os grandes riem (ho-ho-ho-hôô) e o brinquedo pergunta baixinho
    mel(riso, 1, ['D3:1 r:1 D3:1 r:1 C#3:1 r:1 C3:4 r:6']);
    mel(tuba, 1, ['D2:1 r:1 D2:1 r:1 C#2:1 r:1 C2:4 r:6']);
    toyMel(1, ['r:12 G5:1 r:1 E5:2'], { vel: 0.8 });

    // 2 · o chute: a bola anda um palmo, quica 4 vezes e para; silêncio; o brinquedo desce triste; a caixa puxa o ska
    pe.note(2 * 16, 6, 0, 0.45);
    quicaAteParar(qq, 2 * 16 + 1, { primeiro: 2, n: 4, vel: 0.7, encolhe: 0.7 });
    toyMel(2, ['r:8 E5:2 Eb5:2 D5:2 r:2'], { vel: 0.85 });
    drum(sn, 2, 1, '..............xX', { vel: 0.8 });

    // 3 · a placa: o ska entra (150) e o trompete pergunta "CHAR-MAN-DER DE CA-PI-TÃO?"; o apito sobe no "TÃO?"
    drum(cr, 3, 1, 'X...............');
    ska(3, 'F');
    mel(tpt, 3, ['C5:1 r:1 C5:1 r:1 A4:2 r:2 A4:1 r:1 C5:1 D5:1 F5:4~']);
    ap.note(3 * 16 + 12, 0, 0, 0.9);
    riCurta.note(3 * 16 + 13, 0, 0, 0.8);

    // 4 · KKKKKKK: a torcida ri no tempo, o trompete gargalha, o trombone faz o "uá" e o brinquedo decide (sobe a 4ª)
    ska(4, 'F');
    riLonga.note(4 * 16, 0, 0, 1);
    mel(tpt, 4, ['C6:1 r:1 C6:1 r:1 C6:1 r:1 C6:1 r:1 r:8'], { vel: 0.8 });
    mel(ua, 4, ['r:8 C4:2 B3:2 Bb3:2 r:2']);
    toyMel(4, ['r:14 C5:1 F5:1']);

    // 5 · Pewter, "FOI SORTE.": o trompete desce; a resposta do brinquedo é a evolução (4 notas = 4 piscadas)
    ska(5, 'Bb', 'C7');
    mel(tpt, 5, ['F5:2 D5:2 C5:3 r:1 r:8']);
    toyMel(5, ['r:8 C5:1 D5:1 F5:1 r:1 A5:2 r:2']);
    brilho.note(5 * 16 + 5, 0, 0, 0.6);

    // 6 · Cerulean, "TÁ, ELE CORRE.": o trompete hesita; o brinquedo responde mais alto, com terças (cada nota um toque)
    ska(6, 'Dm', 'Bb', true);
    mel(tpt, 6, ['D5:2 r:1 D5:1 E5:1 F5:2 E5:1 r:8']);
    toyMel(6, ['r:8 C5:1 F5:1 A5:1 C6:1 D6:2 C6:2']);
    mel(terc, 6, ['r:8 A4:1 C5:1 F5:1 A5:1 Bb5:2 A5:2'], { vel: 0.7 });

    // 7 · a final, "MAR-CA O CHAR-ME-LE-ON!": a banda para e bate junto com o trompete em Lá7; rufar, o baixo sobe
    mel(tpt, 7, ['A4:1 C#5:1 D5:1 E5:1 F#5:1 G5:1 A5:2 r:8']);
    for (const r of [0, 1, 2, 3, 4, 5, 6]) stabs(skank, 7, 'A7', [r], { low: 62, n: 4 });
    stabs(org, 7, 'A7', [[6, 2]], { low: 55, n: 4 });
    drum(k, 7, 1, 'X.....X.........');
    drum(sn, 7, 1, '......X.xxxxXXXX', { vel: 0.8 });
    drum(cr, 7, 1, '......x.........');
    mel(bs, 7, ['A2:1 C#3:1 D3:1 E3:1 F#3:1 G3:1 A2:2 A2:2 Bb2:2 B2:2 C#3:2']);
    sb.note(7 * 16 + 8, 0, 0, 1);

    // 8 · a tela de evolução do jogo: Lá7 parado, tímpano acelerando (as silhuetas trocam em cada batida dele), a luz
    // sobe e meia batida de silêncio antes do clarão
    padChord(pad, 8, 'A7', 14, { low: 52, n: 4 });
    padChord(str, 8, 'A7', 14, { low: 61, n: 3, vel: 0.8 });
    mel(bs, 8, ['A1:14 r:2']);
    drum(tp, 8, 1, 'x...x...x.x.xxxx', { pitch: -5 });
    drum(sn, 8, 1, '........x.x.xxxx', { vel: 0.5 });
    brilho.note(8 * 16 + 4, 0, 0, 1);

    // 9 · CHARIZARD: impacto e rugido; a pergunta volta aumentada nos metais largos, em Ré menor
    im.note(9 * 16, 0, 0, 1);
    ru.note(9 * 16, 3, 0, 1);
    drum(cr, 9, 1, 'X...............');
    // 10 · GOL: a resposta chega em Ré maior; prato, rede e torcida
    const RESP = ['A4:2 A4:2 F4:4 r:2 F4:2 A4:2 Bb4:2', 'D5:8 F#5:4 A5:4'];
    for (const P of largo) mel(P, 9, RESP);
    mel(metal, 9, RESP, { vel: 0.9 });
    mel(metal, 9, ['r:16', 'r:8 A4:4 C5:4']);
    [
        [9, 'Dm', 'Bb'],
        [10, 'D', 'D7'],
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
    drum(tp, 9, 1, 'X.......X.......', { pitch: -7 });
    pe.note(10 * 16, 4, 0, 0.8);
    rd.note(10 * 16 + 2, 0, 0, 1);
    tor.note(10 * 16 + 2, 0, 0, 1);
    drum(cr, 10, 1, '..X.............');
    drum(tp, 10, 1, 'X.......X.xxXXXX', { pitch: -2 });

    // 11 · o hino em Sol: "RES-PEI-TA O CA-PI-TÃO." na mesma frase da pergunta, agora terminando na tônica
    drum(cr, 11, 1, 'X...............');
    ska(11, 'G', 'C', true);
    const RESPEITA = 'D5:1 r:1 D5:1 r:1 B4:2 r:2 B4:1 r:1 D5:1 E5:1 G5:4';
    mel(tpt, 11, [RESPEITA]);
    mel(metal, 11, [RESPEITA], { vel: 0.7 });
    drum(torc, 11, 1, '....x.......x...', { vel: 0.8 });

    // 12 · a Polaroid: o clique no acorde do hino (Dó → Sol, o "amém") e o brinquedo toca o passinho do começo
    clique.note(12 * 16, 0, 0, 1);
    motor.note(12 * 16 + 1, 0, 0, 1);
    drum(cr, 12, 1, 'X...............', { vel: 0.7 });
    stabs(metal, 12, 'C', [[0, 6]], { low: 55, n: 4, vel: 0.6 });
    padChord(pad, 12, 'C', 8, { low: 52, n: 4 });
    padChord(pad, 12, 'G', 8, { low: 50, n: 4, at: 8 });
    padChord(str, 12, 'C', 8, { low: 60, n: 3, vel: 0.7 });
    padChord(str, 12, 'G', 8, { low: 59, n: 3, vel: 0.7, at: 8 });
    mel(bs, 12, ['C2:8 G1:8']);
    toyMel(12, ['r:2 D5:1 E5:1 G5:2 G5:2 A5:2 B5:2 D6:4']);

    // 13–15 · a explicação: o brinquedo canta o tema por cima do ska leve; as cartas entram (13) e viram ouro (14) no
    // FLIP do Draft; o Mi♭7 do fim leva meio tom acima
    const EXP = [
        ['G', 'C', 'B5:2 D6:2 G6:3 F#6:1 E6:2 C6:2 E6:4'],
        ['Am7', 'D7', 'C6:2 E6:2 A6:3 G6:1 F#6:2 D6:2 C6:2 A5:2'],
        ['G', 'Eb7', 'B5:2 D6:2 G6:4 Bb5:2 C6:2 Db6:2 Eb6:2'],
    ];
    EXP.forEach(([c1, c2, m], i) => {
        const b = 13 + i;
        toyMel(b, [m]);
        ska(b, c1, c2);
        padChord(str, b, c1, 8, { low: 57, n: 4, vel: 0.6 });
        padChord(str, b, c2, 8, { low: 57, n: 4, vel: 0.6, at: 8 });
    });
    for (const r of [0, 4, 8]) vira.note(13 * 16 + r, 0, 0, 1);
    for (const r of [0, 4, 8]) vira.note(14 * 16 + r, 0, 0, 1);
    mel(metal, 14, ['G5:1 r:3 B5:1 r:3 D6:1 r:7'], { vel: 0.6 });
    drum(sn, 15, 1, '........xxXxXXXX', { vel: 0.8 });

    // 16 · tela final: SOC-CER-MON em Lá♭ com tudo, as palmas respondem (o logo pisca nas 3 sílabas)
    const gAb = GANCHO.em({ tom: 8 });
    toyMel(16, [gAb]);
    mel(metal, 16, [gAb]);
    mel(metal, 16, [gAb], { shift: -12, vel: 0.7 });
    for (const P of largo) mel(P, 16, [gAb], { shift: -12 });
    mel(bs, 16, ['Ab2:3 Ab2:3 Ab3:6 Eb2:2 G2:2']);
    padChord(pad, 16, 'Ab', 16, { low: 51, n: 4 });
    padChord(str, 16, 'Ab', 16, { low: 63, n: 4 });
    stabs(skank, 16, 'Ab', [0, 3, 6], { low: 60, n: 3 });
    drum(k, 16, 1, 'X..X..X.....X.X.');
    drum(sn, 16, 1, 'X..X..X.........');
    drum(cr, 16, 1, 'X...............');
    drum(cl, 16, 1, GANCHO.palmas);
    drum(torc, 16, 1, GANCHO.palmas, { vel: 0.8 });

    // 17 · hino: Ré♭ → Lá♭ (amém), e a última nota é do brinquedo: o passinho do começo, lá em cima
    stabs(metal, 17, 'Db', [[0, 8]], { low: 56, n: 4, vel: 0.8 });
    stabs(metal, 17, 'Ab', [[8, 8]], { low: 56, n: 4, vel: 0.8 });
    mel(metal, 17, ['F5:4 Db5:4 C5:8']);
    padChord(str, 17, 'Db', 8, { low: 60, n: 4 });
    padChord(str, 17, 'Ab', 8, { low: 60, n: 4, at: 8 });
    padChord(pad, 17, 'Db', 8, { low: 49, n: 4 });
    padChord(pad, 17, 'Ab', 8, { low: 51, n: 4, at: 8 });
    mel(bs, 17, ['Db2:8 Ab1:8']);
    mel(tuba, 17, ['Db2:8 Ab1:8'], { vel: 0.6 });
    drum(k, 17, 1, 'X.......X.......');
    drum(cr, 17, 1, '........X.......');
    toyMel(17, ['r:12 Eb6:1 F6:1 Ab6:2']);
    return S;
}
