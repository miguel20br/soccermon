// Ditto copia todo mundo (trilha pra curta, 22/10/2026). A música inteira é pergunta e resposta: alguém toca uma
// frase no seu instrumento e o Ditto repete na voz dele (um KAZOO mole, que entra escorregando), depois do "bloop" de
// transformar. Copia o apito do juiz, o tema do jogo, o Machamp (metais e 4 socos de tímpano: os dele são de
// borracha), o Pikachu (arpejo e choque: o choque sai pela culatra), a Jigglypuff (a canção de ninar: na voz dele,
// todo mundo dorme, a banda junto). Sozinho, vira a bola e rola pro gol. Cochicha o SOC-CER-MON... e todo mundo
// acorda e COPIA O DITTO (a virada da piada). No fim ele vira o juiz e apita o fim, no kazoo.
// Fá maior (funk da casa, 100 BPM, swing leve) → Sol maior (sobe um tom). 15 compassos, ~36 s, sem loop.
import { kazoo, roteiro, transforma } from '../curtas.mjs';
import { bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { apito, bola, bzzt, chute, deslize, fi, quique, rede, ronco, torcida, zap } from './livre-ginasio.mjs';

export const meta = {
    titulo: 'Ditto copia todo mundo',
    tela: 'Curta (vídeo): Ditto imita cada rival',
    premissa:
        'Ditto copia cada rival (Machamp, Pikachu, Jigglypuff) do jeito mole dele, faz o gol virando bola e, no fim, o estádio inteiro copia o Ditto.',
};

export default function ditto() {
    const S = new Song({ bpm: 100, bars: 15, swing: 0.1, tail: 4 });
    const { cena, ev } = roteiro(S);
    const kz = S.part('kazoo', kazoo, { pan: 0.15, gain: 1.15, rev: 0.2 });
    const lead = S.part('lead', I.pulse, { pan: -0.15, gain: 1.1, corte: 3000, rev: 0.15 });
    const met = S.part('metais', I.brass, { pan: -0.2, gain: 0.9, corte: 2800, rev: 0.2 });
    const pul = S.part('pikachu', I.thin, { pan: -0.25, gain: 0.8, corte: 3200, rev: 0.15 });
    const cx = S.part('caixinha', I.bell, { pan: -0.2, gain: 2.2, echo: { rows: 3, fb: 0.25, mix: 0.25 }, rev: 0.4 });
    const ap = S.part('apito', apito(0.12), { drum: true, pan: -0.3, gain: 0.8, rev: 0.25 });
    const tf = S.part('transforma', transforma, { drum: true, pan: 0.15, gain: 0.7, rev: 0.25 });
    const tmp = S.part('soco', I.timp, { drum: true, pan: -0.2, gain: 0.3, rev: 0.15 });
    const poc = S.part('socoBorracha', quique, { drum: true, pan: 0.2, gain: 0.9, rev: 0.15 });
    const zp = S.part('choque', zap, { drum: true, pan: -0.25, gain: 0.7, echo: { rows: 3, fb: 0.3, mix: 0.3 } });
    const bz = S.part('erro', bzzt, { drum: true, pan: 0.2, gain: 0.6 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.6, rev: 0.15 });
    const cai = S.part('bandaDorme', deslize(420, 40, 1.4), { drum: true, gain: 0.55, rev: 0.2 });
    const bo = S.part('bolaDitto', bola, { pan: 0.15, gain: 0.9, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.7 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.6, rev: 0.3 });
    const tc = S.part('torcida', torcida(7, 0.1, 2.5), { drum: true, gain: 0.5, rev: 0.3 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const chk = S.part('guitarra', I.chank, { pan: 0.35, gain: 2 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.85 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.1 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });

    const funk = (b, c, { pouco = false } = {}) => {
        bass(bs, b, c, '0:2 r:1 0:1 8:1~ r:1 5:2 r:2 s:2 8:1~ r:1 5:2');
        if (!pouco) {
            drum(k, b, 1, 'X.....x...x.....');
            drum(cl, b, 1, '....x.......x...', { vel: 0.7 });
            drum(chk, b, 1, '..x...x...x...x.', { vel: 0.8 });
        }
        drum(hh, b, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.55 });
    };
    // a frase do tema (8 linhas): o lead pergunta, o Ditto repete
    const FRASE = 'F5:2 A5:2 C6:2 Eb6:1 C6:1';

    // o juiz apita três notas; o Ditto repete no kazoo
    cena(0, 'o apito');
    fi(ap, 0, [
        [0, 'F6'],
        [2, 'A6'],
        [4, 'C7'],
    ]);
    mel(kz, 0, ['r:8 F5:2 A5:2 C6:4']);
    ev(0, 0, 'apito: três notas (Fá-Lá-Dó)', 'o juiz apita o começo, olhando pro Ditto');
    ev(0, 8, 'o kazoo repete (mole)', 'Ditto apita igual, com a boca mole :3');

    // o tema: o lead pergunta, o kazoo copia
    cena(1, 'o tema');
    mel(lead, 1, [`${FRASE} r:8`]);
    mel(kz, 1, [`r:8 ${FRASE}`]);
    funk(1, 'F7');
    ev(1, 0, 'o tema (pergunta)', 'o camisa 10 rival faz embaixadinha');
    ev(1, 8, 'o kazoo copia', 'Ditto faz igual... com a bola grudada na cara');

    // Machamp: metais e 4 socos; o Ditto copia com bracinhos de borracha
    cena(2, 'Machamp');
    mel(met, 2, ['F4:3 F4:3 A4:2 C5:4 r:4']);
    drum(tmp, 2, 1, 'X..X..X.X.......', { pitch: 3 });
    tf.note(2 * 16 + 13, 0, 0, 1);
    mel(kz, 3, ['F4:3 F4:3 A4:2 C5:4 r:4']);
    drum(poc, 3, 1, 'x..x..x.x.......', { pitch: 16, vel: 0.8 });
    funk(2, 'F7');
    funk(3, 'F7');
    ev(2, 0, 'metais + 4 pancadas de tímpano', 'Machamp faz pose: quatro socos no ar');
    ev(2, 13, 'bloop (transforma)', 'Ditto vira Machamp... meio derretido');
    ev(3, 0, 'o kazoo copia; socos de borracha ("poc")', 'quatro bracinhos moles, socos que não machucam');

    // Pikachu: arpejo rápido e choque; na cópia o choque sai pela culatra
    cena(4, 'Pikachu');
    zp.note(4 * 16, 0, 0, 1);
    mel(pul, 4, ['Bb5:1 D6:1 F6:1 Ab6:1 F6:1 D6:1 Bb5:1 F5:1 r:8']);
    zp.note(4 * 16 + 8, -3, 0, 1);
    stabs(met, 4, 'Bb7', [[8, 2]], { low: 56, n: 4, vel: 0.7 });
    tf.note(4 * 16 + 13, 2, 0, 1);
    mel(kz, 5, ['Bb5:1 D6:1 F6:1 Ab6:1 F6:1 D6:1 Bb5:1 F5:1 r:2 Bb6:2 r:4']);
    zp.note(5 * 16 + 8, -3, 0, 0.6);
    bz.note(5 * 16 + 8, 0, 0, 1);
    funk(4, 'Bb7');
    funk(5, 'Bb7', { pouco: true });
    ev(4, 0, 'choque + arpejo de 16 avos', 'Pikachu dispara num raio');
    ev(4, 8, 'choque com eco + metais', 'raio no chão, pose');
    ev(4, 13, 'bloop', 'Ditto vira Pikachu (do amarelo errado)');
    ev(5, 0, 'o kazoo corre o arpejo', 'Ditto corre igual, tropeçando');
    ev(5, 8, 'choque + zumbido de erro', 'o raio sai pela culatra: ele leva o choque');
    ev(5, 10, 'kazoo: "ai!"', 'cabelo em pé, chamuscado');

    // Jigglypuff: a canção de ninar; ninguém dorme. Na voz do Ditto, todo mundo dorme, até a banda
    cena(6, 'Jigglypuff');
    const NINAR = 'C6:4 A5:2 F5:2 G5:6 r:2';
    mel(cx, 6, [NINAR]);
    padChord(pad, 6, 'Fmaj7', 16, { low: 53, n: 4, vel: 0.6 });
    funk(6, 'Fmaj7', { pouco: true });
    tf.note(6 * 16 + 14, 4, 0, 1);
    mel(kz, 7, [NINAR]);
    padChord(pad, 7, 'Dm7', 12, { low: 53, n: 4, vel: 0.6 });
    bass(bs, 7, 'Dm7', '0:2 r:2 5:2 r:2 0:2 r:6', { vel: 0.7 });
    drum(hh, 7, 1, 'x.x.x.x.........', { vel: 0.4 });
    cai.note(7 * 16 + 9, 0, 0, 1);
    zz.note(7 * 16 + 12, 0, 0, 1);
    ev(6, 0, 'caixinha de música: a canção de ninar', 'Jigglypuff canta... e ninguém dorme');
    ev(6, 14, 'bloop', 'Ditto vira Jigglypuff');
    ev(7, 0, 'o kazoo canta a mesma canção', 'na voz dele, os rivais bocejam um por um');
    ev(7, 9, 'a banda escorrega pro grave e para', 'o time rival inteiro cai no sono; o juiz também');
    ev(7, 12, 'ronco', 'até a Jigglypuff dorme (e ele fica sozinho com a bola)');

    // sozinho: vira a bola e quica até o gol (cada quique é uma nota)
    cena(8, 'vira bola');
    zz.note(8 * 16 + 8, 0, 0, 0.8);
    zz.note(9 * 16 + 10, 0, 0, 0.8);
    tf.note(8 * 16, -2, 0, 1);
    mel(bo, 8, ['r:4 F3:2 A3:2 C4:2 F4:2 A4:2 C5:2', 'F5:2 r:2 F5:1 r:1 F5:1 r:9']);
    rd.note(9 * 16 + 8, 0, 0, 0.8);
    ev(8, 0, 'bloop', 'Ditto olha a bola... e vira bola');
    ev(8, 4, 'quiques subindo (Fá-Lá-Dó)', 'quica sozinho pela quadra, rumo ao gol');
    ev(9, 0, 'quiques miudinhos', 'passa rolando pelo goleiro, que ronca');
    ev(9, 8, 'rede (fraquinha)', 'gol. Ninguém viu');

    // cochicha o SOC-CER-MON; todo mundo acorda e copia o Ditto
    cena(10, 'o cochicho');
    zz.note(10 * 16, 0, 0, 0.6);
    mel(kz, 10, [GANCHO.em({ tom: 5, oitava: -1 })], { vel: 0.5 });
    ev(10, 0, 'SOC-CER-MON no kazoo, baixinho', 'Ditto (de volta ao normal) comemora cochichando');
    cena(11, 'todo mundo copia');
    mel(lead, 11, [GANCHO.em({ tom: 5 }), GANCHO.em({ tom: 7 })]);
    mel(met, 11, [GANCHO.em({ tom: 5, oitava: -1 }), GANCHO.em({ tom: 7, oitava: -1 })]);
    drum(cl, 11, 2, GANCHO.palmas, { vel: 1 });
    cr.note(11 * 16, 0, 0, 1);
    tc.note(11 * 16, 0, 0, 1);
    drum(k, 10, 1, '............x.x.', { vel: 0.8 });
    funk(11, 'F');
    funk(12, 'G');
    padChord(pad, 11, 'F', 16, { low: 53, n: 3, vel: 0.5 });
    padChord(pad, 12, 'G', 16, { low: 55, n: 3, vel: 0.5 });
    cr.note(12 * 16, 0, 0, 0.8);
    ev(11, 0, 'TUTTI: SOC-CER-MON (a banda copia o Ditto), prato', 'todo mundo acorda num pulo e canta igual a ele');
    ev(11, 12, 'palmas "hey hey"', 'o estádio inteiro bate palma');
    ev(12, 0, 'SOC-CER-MON um tom acima (Sol)', 'agora são os rivais que imitam o Ditto');

    // a festa: o lead pergunta, o Ditto responde, em Sol
    cena(13, 'a festa');
    mel(lead, 13, [`${FRASE} r:8`], { shift: 2 });
    mel(kz, 13, [`r:8 ${FRASE}`], { shift: 2 });
    funk(13, 'G7');
    ev(13, 0, 'o tema em Sol', 'festa: o time comemora');
    ev(13, 8, 'o kazoo copia', 'Ditto imita a dancinha do camisa 10');

    // final: vira o juiz e apita o fim, no kazoo
    cena(14, 'final');
    tf.note(14 * 16, 0, 0, 1);
    mel(kz, 14, ['r:2 G5:2 B5:2 D6:8 r:2']);
    stabs(met, 14, 'G', [[12, 4]], { low: 55, n: 4, vel: 0.8 });
    mel(bs, 14, ['r:12 G1:4']);
    cr.note(14 * 16 + 12, 0, 0, 0.6);
    ch.note(14 * 16 + 12, 0, 0, 0.6);
    ev(14, 0, 'bloop', 'Ditto vira o juiz');
    ev(14, 2, 'o kazoo apita o fim: Sol-Si-Rééé', 'e apita o fim do jogo... com a boca mole');
    ev(14, 12, 'acorde final', 'tela final');
    return S;
}
