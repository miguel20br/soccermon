// O grande dia do Magikarp (trilha pra curta, 22/10/2026). Ele entra em campo, pula à toa, a torcida ri; no fundo do
// poço evolui pra Gyarados no meio da partida e faz o gol. Cada som é uma coisa na tela (roteiro no .json).
// A história está no motivo: o PLOF é o 3-3-2 do SOC-CER-MON tocado no espirro d'água, mas caindo (Sol-Mi-Dó grave:
// o gancho que não decola). Depois da evolução o mesmo 3-3-2 vira três pancadas de tímpano e metais (os zagueiros
// voando) e, no gol, o SOC-CER-MON de verdade, subindo. A marchinha boba do começo volta como hino em Ré menor.
// Dó maior, marchinha (112 BPM, swing) → Lá♭maj7, Si♭, Lá7 (a evolução) → Ré menor heroico → Ré MAIOR no gol →
// Mi maior (sobe um tom). 22 compassos, ~49 s, sem loop.
import { risada, roteiro, rugido, sobe, splash } from '../curtas.mjs';
import { bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';
import { apito, chute, quique, rede, torcida, trave } from './livre-ginasio.mjs';
import { UA } from './livre-snorlax.mjs';

export const meta = {
    titulo: 'O grande dia do Magikarp',
    tela: 'Curta (vídeo): Magikarp evolui no meio do jogo',
    premissa:
        'Magikarp entra em campo, pula à toa e a torcida ri; no fundo do poço evolui pra Gyarados no meio do jogo e faz o gol.',
};

export default function magikarp() {
    const S = new Song({ bpm: 112, bars: 22, swing: 0.1, tail: 4 });
    const { cena, ev } = roteiro(S);
    // o herói é maior que o peixe: tudo até a evolução a 78%, o rugido abre o volume inteiro
    S.masterAt = (t) => (S.barAt(t) < 13 ? 0.78 : 1);
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, corte: 2800, rev: 0.15 });
    const spl = S.part('plof', splash, { pan: 0.15, gain: 1.1, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.48 });
    const pah = S.part('pah', I.stab, { pan: 0.25, gain: 1, corte: 2500 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 0.85, rev: 0.2 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.8, corte: 2200, rev: 0.25 });
    const caiu = S.part('caiu', I.whistleDown, { drum: true, pan: 0.2, gain: 1.1, rev: 0.2 });
    const sino = S.part('sino', I.bell, { pan: 0.25, gain: 1.6, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.4 });
    const str = S.part('cordas', I.strings, { pan: -0.2, gain: 1.4, rev: 0.35 });
    const met = S.part('metais', I.brass, { pan: 0.15, gain: 0.85, corte: 3000, rev: 0.2 });
    const met2 = S.part('metaisGolpe', I.brass, { pan: -0.15, gain: 0.8, corte: 2600, rev: 0.2 });
    const bs = S.part('baixo', I.bass, { gain: 0.6, corte: 900 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), { drum: true, gain: 0.85 });
    const tmp = S.part('timpano', I.timp, { drum: true, gain: 0.25, rev: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45 });
    const ap = S.part('apito', apito(0.4), { drum: true, pan: 0.3, gain: 0.5, rev: 0.3 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.3, gain: 0.5, rev: 0.15 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.8, rev: 0.3 });
    const tv = S.part('trave', trave, { drum: true, gain: 0.8, rev: 0.4 });
    const ri = S.part('risada', risada(1.7, (112 / 60) * 2), { drum: true, gain: 0.9, rev: 0.3 });
    const ri2 = S.part('risadaCurta', risada(1, (112 / 60) * 2, 9), { drum: true, pan: 0.2, gain: 0.85, rev: 0.3 });
    const oh = S.part('torcidaOh', torcida(1.6, 0.15, 1), { drum: true, gain: 0.45, rev: 0.3 });
    const tc = S.part('torcida', torcida(9, 0.08, 3), { drum: true, gain: 0.5, rev: 0.3 });
    const luz = S.part('luz', sobe(4.1), { drum: true, gain: 0.45, rev: 0.3 });
    const rg = S.part('rugido', rugido, { drum: true, gain: 1.3, rev: 0.35 });

    const oompah = (b, c, cheio = true) => {
        bass(tuba, b, c, '0:4 r:4 5:4 r:4');
        stabs(pah, b, c, [4, 12], { low: 57, n: 3, len: 2 });
        if (cheio) {
            drum(sn, b, 1, '....x.......x...', { vel: 0.6 });
            drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
        }
    };
    const PLOF = 'r:8 G5:3 E5:3 C5:2';

    // entrada: plof, plof, PLOF (de cara no chão), e o apito
    cena(0, 'entrada');
    mel(spl, 0, ['G5:3 E5:3 C5:10'], { vel: 1.4 });
    ev(0, 0, 'PLOF (Sol)', 'Magikarp entra em campo pulando: 1º pulo');
    ev(0, 3, 'plof (Mi)', '2º pulo, mais baixo');
    ev(0, 6, 'PLOF grave (Dó): o SOC-CER-MON que cai em vez de subir', '3º pulo: cai de cara no chão');
    ap.note(12, 0, 0, 0.9);
    mel(tuba, 0, ['r:12 G2:4']);
    ev(0, 12, 'apito longo', 'o juiz apita o começo; ele levanta tonto');

    // a marchinha boba; os plofs respondem (pergunta e resposta: lead × plof)
    cena(1, 'o jogo');
    const TEMA = [
        'E5:2 G5:2 C6:3 B5:1 A5:2 G5:2 E5:4',
        'F5:2 D5:2 B4:4 r:8',
        'E5:2 G5:2 C6:3 D6:1 E6:2 C6:2 A5:4',
        'G5:2 F5:2 E5:2 D5:2 r:8',
    ];
    mel(lead, 1, TEMA);
    for (const [i, c] of ['C', 'G7', 'Am', 'G7'].entries()) oompah(1 + i, c);
    mel(spl, 2, [PLOF]);
    mel(spl, 4, [PLOF], { vel: 0.9 });
    ev(1, 0, 'a marchinha (tuba, pícolo)', 'ele vai pulando pela quadra atrás da bola');
    ev(2, 8, 'resposta: plof plof PLOF', 'três pulos no mesmo lugar: não sai do lugar');
    ev(4, 8, 'plof plof PLOF de novo', 'os rivais passam por ele trocando passes');

    // 1ª tentativa: a bola chega, ele toma impulso, pula... e ela passa por baixo
    cena(5, 'a bola passa');
    ch.note(5 * 16, 4, 0, 0.5);
    drum(qq, 5, 1, '..x...x.......x.', { pitch: 12, vel: 0.6 });
    mel(pc, 5, ['r:4 C5:1 D5:1 E5:1 F5:1 G5:1 A5:1 B5:1 C6:1 r:4']);
    mel(spl, 5, ['r:12 C6:4'], { vel: 1.2 });
    caiu.note(5 * 16 + 14, 0, 0, 1);
    oompah(5, 'C', false);
    ev(5, 0, 'passe (quique)', 'um rival erra o passe: a bola vem pra ele');
    ev(5, 4, 'pícolo subindo', 'ele toma impulso, olhos fechados');
    ev(5, 12, 'PLOF agudo', 'pula com tudo...');
    ev(5, 14, 'quique + apito de êmbolo descendo', '...a bola passa por baixo dele e ele cai');

    // a torcida ri no tempo; o trombone triste
    cena(6, 'a torcida ri');
    ri.note(6 * 16, 0, 0, 1);
    mel(ua, 6, ['r:6 E4:3 Eb4:3 D4:4']);
    bass(tuba, 6, 'G7', '0:4 r:4 5:4 r:4', { vel: 0.7 });
    ev(6, 0, 'risada da torcida, em colcheias', 'a arquibancada inteira aponta e ri');
    ev(6, 6, 'trombone "uá-uá-uáá"', 'Magikarp, caído, olha pra câmera');

    // o tema de novo, agora a resposta é a risada (lead × torcida)
    mel(lead, 7, [TEMA[0], TEMA[1]]);
    oompah(7, 'C');
    oompah(8, 'G7');
    ri2.note(8 * 16 + 8, 2, 0, 1);
    ev(7, 0, 'a marchinha de novo', 'os rivais driblam em volta dele, de brincadeira');
    ev(8, 8, 'a risada responde', 'cada vez que ele tenta, a torcida ri mais');

    // 2ª tentativa: sobe duas oitavas, PLOF altíssimo, DONG no travessão
    cena(9, 'tenta de novo');
    mel(pc, 9, ['C5:1 D5:1 E5:1 F5:1 G5:1 A5:1 B5:1 C6:1 D6:1 E6:1 F6:1 G6:1 r:4']);
    drum(sn, 9, 1, '....oooxxxxXXX..', { vel: 0.8 });
    bass(tuba, 9, 'G7', '0:4 r:4 5:4 r:4');
    mel(spl, 9, ['r:12 G6:4'], { vel: 1.3 });
    tv.note(9 * 16 + 14, 0, 0, 1);
    ev(9, 0, 'pícolo sobe duas oitavas, rufo de caixa', 'a bola vem de novo: ele pega MUITO impulso');
    ev(9, 12, 'PLOF lá em cima', 'salta altíssimo...');
    ev(9, 14, 'TRAVE: "dong"', '...e bate de cara no travessão');

    // caído; silêncio; um plof sem força
    cena(10, 'caído');
    mel(spl, 10, ['r:8 C4:8'], { vel: 0.35 });
    mel(tuba, 10, ['r:12 C2:4'], { vel: 0.5 });
    ev(10, 0, 'silêncio (o "dong" sumindo)', 'ele cai e fica parado, de barriga pra cima');
    ev(10, 8, 'plof fraquinho', 'um último pulinho, sem força. A torcida se cala');

    // a evolução: sinos subindo, cordas, a luz (ruído) crescendo, tímpano rufando, Lá7 e meia batida de silêncio
    cena(11, 'evolução');
    mel(sino, 11, ['Ab4:2 C5:2 Eb5:2 G5:2 Ab5:2 C6:2 Eb6:2 G6:2']);
    mel(sino, 12, ['Bb5:1 D6:1 F6:1 Bb6:1 D6:1 F6:1 Bb6:1 D7:1 A6:1 C#7:1 E7:1 G7:1 A7:2 r:2']);
    padChord(str, 11, 'Abmaj7', 16, { low: 56, n: 4, vel: 0.6 });
    padChord(str, 12, 'Bb', 8, { low: 58, n: 4, vel: 0.8 });
    padChord(str, 12, 'A7', 6, { low: 57, n: 4, vel: 0.9, at: 8 });
    mel(tuba, 11, ['Ab1:16', 'Bb1:8 A1:6 r:2'], { vel: 0.6 });
    luz.note(11 * 16, 0, 0, 1);
    drum(tmp, 12, 1, 'ooooxxxxXXXXXX..', { pitch: 5 });
    ev(11, 0, 'sinos subindo, cordas, ruído crescendo', 'ele começa a brilhar (luz branca)');
    ev(12, 0, 'tímpano rufando', 'a luz cresce, a câmera treme');
    ev(12, 8, 'Lá7 (vai mudar de tom)', 'a silhueta estica e cresce: vira uma serpente');
    ev(12, 14, 'meia batida de silêncio', 'branco total');

    // GYARADOS
    cena(13, 'Gyarados');
    rg.note(13 * 16, 0, 0, 1);
    cr.note(13 * 16, 0, 0, 1);
    tmp.note(13 * 16, -2, 0, 1.2);
    padChord(met, 13, 'Dm', 12, { low: 50, n: 4, vel: 0.8 });
    padChord(str, 13, 'Dm', 16, { low: 50, n: 4, vel: 0.8 });
    mel(tuba, 13, ['D1:12 r:2 A1:2']);
    oh.note(13 * 16 + 9, -3, 0, 1);
    ev(13, 0, 'RUGIDO, prato, tímpano, metais em Ré menor', 'GYARADOS!');
    ev(13, 9, 'torcida: "óóó"', 'a torcida para de rir, boca aberta');

    // o ataque: a marchinha virou hino (Ré menor) e o 3-3-2 do plof virou três pancadas
    cena(14, 'o ataque');
    mel(met, 14, [
        'F5:2 A5:2 D6:3 C#6:1 Bb5:2 A5:2 F5:4',
        'G5:2 E5:2 C#5:4 r:8',
        'F5:2 A5:2 D6:3 E6:1 F6:2 D6:2 Bb5:4',
        'A5:2 G5:2 F5:2 E5:2 r:8',
    ]);
    mel(lead, 14, ['D5:16', 'C#5:8 r:8', 'D5:16', 'C#5:8 r:8'], { vel: 0.55 });
    ['Dm', 'A7', 'Bb', 'A7'].forEach((c, i) => {
        const b = 14 + i;
        bass(bs, b, c, '0:3 0:1 r:2 0:2 8:2 r:2 5:2 0:2');
        bass(tuba, b, c, '0:8 5:8', { vel: 0.6 });
        padChord(str, b, c, 16, { low: 50, n: 4, vel: 0.55 });
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(cl, b, 1, '....x.......x...', { vel: 0.7 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
    });
    stabs(
        met2,
        15,
        'A7',
        [
            [8, 2],
            [11, 2],
            [14, 2],
        ],
        { low: 52, n: 4, vel: 1.1 },
    );
    drum(tmp, 15, 1, '........X..X..X.', { pitch: 5 });
    drum(sn, 17, 1, '........xxxxXXXX', { vel: 0.9 });
    mel(pc, 17, ['r:8 A5:1 B5:1 C#6:1 D6:1 E6:1 F6:1 G6:1 A6:1']);
    ev(14, 0, 'a marchinha vira hino, em Ré menor, nos metais', 'Gyarados avança pela quadra com a bola');
    ev(15, 8, 'BUM (1º)', 'um zagueiro voa');
    ev(15, 11, 'BUM (2º)', 'o segundo voa');
    ev(15, 14, 'BUUM (3º): é o 3-3-2 do plof, agora no tímpano', 'o terceiro voa');
    ev(16, 0, 'o hino sobe', 'o goleiro rival treme');
    ev(17, 8, 'rufo de caixa e pícolo subindo', 'a cauda arma o chute');

    // GOL: Ré MAIOR (a terça sobe: Fá → Fá#)
    cena(18, 'gol');
    ch.note(18 * 16, 0, 0, 1.3);
    rd.note(18 * 16 + 1, 0, 0, 1);
    cr.note(18 * 16, 0, 0, 1.2);
    tc.note(18 * 16 + 2, 0, 0, 1);
    mel(met, 18, ['D5+F#5+A5:8 r:4 A5:2 B5:2']);
    padChord(str, 18, 'D', 16, { low: 50, n: 4, vel: 0.8 });
    bass(tuba, 18, 'D', '0:8 r:4 5:2 5:2');
    drum(k, 18, 1, 'X.......x.x.....');
    ev(18, 0, 'CHUTE, REDE, prato: Ré MAIOR', 'GOL! a rede estufa');
    ev(18, 2, 'a torcida explode', 'a torcida que ria agora pula');

    // SOC-CER-MON: o plof que finalmente decola. Depois sobe um tom
    cena(19, 'SOC-CER-MON');
    mel(met, 19, [GANCHO.em({ tom: 2 }), GANCHO.em({ tom: 4 })]);
    mel(lead, 19, [GANCHO.em({ tom: 2, oitava: -1 }), GANCHO.em({ tom: 4, oitava: -1 })], { vel: 0.8 });
    drum(cl, 19, 2, GANCHO.palmas, { vel: 1 });
    rg.note(19 * 16 + 6, 5, 0, 0.45);
    for (const [i, c] of ['D', 'E'].entries()) {
        const b = 19 + i;
        bass(bs, b, c, '0:3 0:1 r:2 0:2 8:2 r:2 5:2 0:2');
        padChord(str, b, c, 16, { low: 52, n: 4, vel: 0.7 });
        drum(k, b, 1, 'X.....x.X.....x.');
        drum(cl, b, 1, '....x...........', { vel: 0.7 });
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
    }
    drum(sn, 19, 1, '..............xx', { vel: 0.8 });
    cr.note(20 * 16, 0, 0, 1);
    ev(19, 0, 'SOC-CER-MON nos metais, subindo (o plof que decolou)', 'a torcida canta junto');
    ev(19, 6, 'rugido no "MON"', 'Gyarados ruge pro céu');
    ev(19, 12, 'palmas "hey hey"', 'a torcida bate palma');
    ev(20, 0, 'SOC-CER-MON um tom acima (Mi maior), prato', 'placar: 1 x 0; a câmera sobe');

    // final: o acorde segura... e um plof
    cena(21, 'final');
    padChord(met, 21, 'E', 8, { low: 56, n: 4, vel: 0.9 });
    padChord(str, 21, 'E', 10, { low: 52, n: 4, vel: 0.7 });
    mel(tuba, 21, ['E2:8 r:8']);
    cr.note(21 * 16, 0, 0, 0.6);
    mel(spl, 21, ['r:10 E6:6'], { vel: 0.5 });
    ev(21, 0, 'acorde final', 'Gyarados posa de herói');
    ev(21, 10, 'plof!', '...e dá um pulinho de Magikarp, sem querer');
    return S;
}
