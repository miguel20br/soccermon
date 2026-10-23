// Animatic A, "Primeiro dia" (vídeo do modo novo Rota de baby, 23/10/2026). Esboço de ~20 s, cortado na batida.
// A história: um Charmander do tamanho da bola chega num ginásio enorme; os rivais grandes riem; ele chuta e a bola
// mal anda. A cada vitória ele cresce e a banda cresce junto: o piano de brinquedo é ele, e ele nunca sai da música.
// Dó maior → Ré maior (Planalto) → Mi♭ maior (tela final), 124 BPM, 4/4. 1 compasso = 1,935 s.
// c.0 piano de brinquedo sozinho (a chegada) | c.1 o riso dos rivais (metais graves "ho-ho-ho") e o chute fraco: a
// bola quica 4 vezes e para no silêncio | c.2 Rota 2: entra a banda (funk leve, baixo slap, clap 808) e a torcida |
// c.3 Planalto: sobe 1 tom, metais e cordas tocam o tema com o brinquedo | c.4 GOL: prato, rede, torcida e o
// SOC-CER-MON nos metais com palmas | c.5–7 explicação: o brinquedo canta o tema por cima da banda, mais baixa |
// c.8 tela final: sobe meio tom, SOC-CER-MON com tudo | c.9 hino (Lá♭ → Mi♭) e a última nota é do brinquedo.
// Assinatura: o piano de brinquedo (triangular curta + lâmina de metal desafinada 12 cents) e a bola que mal anda.
import { drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { chute, quicaAteParar, quique, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Animatic A: Primeiro dia', tela: 'Vídeo da Rota de baby (conceito A)', lufs: -14 };

const TOY = ins({ vol: 0.34, a: 0.001, r: 0.22, shape: 1, sv: 0.1, d: 0.1 });
const LAMINA = ins({ vol: 0.12, a: 0.001, r: 0.35, shape: 0, sv: 0.05, d: 0.05 });
// o riso dos grandes: metal grave com surdina, a altura escorrega e balança ("ho-ho-ho-hôô")
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

export default function primeiroDia() {
    const S = new Song({
        bpm: 124,
        bars: 10,
        swing: 0.06,
        tail: 2.5,
        // o começo é só o brinquedo: sobe o geral pra ele não sumir no celular; a explicação fica embaixo do texto
        masterAt: (t) => {
            const b = t / ((16 * 60) / 124 / 4);
            if (b < 2) return 1.3;
            if (b >= 5 && b < 8) return 0.95;
            return 1;
        },
    });
    const toy = S.part('brinquedo', TOY, { pan: 0.1, gain: 1.5, rev: 0.12 });
    const lam = S.part('lamina', LAMINA, { pan: 0.1, gain: 1.4, rev: 0.12 });
    const toyE = S.part('brinquedo-esq', TOY, { pan: -0.15, gain: 0.9, rev: 0.12 });
    const riso = S.part('riso', RISO, { pan: -0.1, gain: 1.1, corte: 2200, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.5 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.2 });
    const metais = S.part('metais', I.brass, { pan: 0.2, gain: 0.65, rev: 0.2 });
    const acordes = S.part('acordes', I.brass, { pan: -0.2, gain: 0.35, rev: 0.25, corte: 2600 });
    const str = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const bs = S.part('baixo', I.slap, { gain: 0.55 });
    const ch = S.part('guitarra', I.chank, { pan: -0.35, gain: 2.2 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.9 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.9,
        rev: 0.1,
    });
    const pal = S.part('palmas', I.palmas, { drum: true, gain: 0.9, rev: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.7 });
    const pe = S.part('chute', chute, { drum: true, gain: 0.7 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.25, gain: 0.8, rev: 0.15 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.8, rev: 0.25 });
    const tor = S.part('torcida', torcida(3.5, 0.6, 1.4), { drum: true, gain: 0.8, rev: 0.3 });
    const toyMel = (b, s, o = {}) => {
        mel(toy, b, s, o);
        mel(lam, b, s, { ...o, shift: (o.shift ?? 0) + 12.12 });
    };

    // c.0 a chegada: o brinquedo sozinho, passinho pequeno subindo
    toyMel(0, ['r:2 G4:1 A4:1 C5:2 C5:2 D5:2 E5:2 G5:4']);
    mel(toyE, 0, ['C4:2 r:6 G3:2 r:6']);
    // c.1 os grandes riem (ho-ho-ho-hôô, metais e tuba) e ele chuta: a bola quica 4 vezes e para
    mel(riso, 1, ['D3:1 r:1 D3:1 r:1 C#3:1 r:1 C3:2 r:8']);
    mel(tuba, 1, ['D2:1 r:1 D2:1 r:1 C#2:1 r:1 C2:2 r:8']);
    pe.note(16 + 8, 6, 0, 0.45);
    quicaAteParar(qq, 16 + 9, { primeiro: 2, n: 4, vel: 0.7, encolhe: 0.7 });

    // c.2 Rota 2: a banda entra com ele (ele cresceu)
    toyMel(2, ['E5:2 G5:2 C6:3 B5:1 A5:2 F5:2 E5:2 C#5:2']);
    mel(ep, 2, ['E4:2 G4:2 C5:3 B4:1 A4:2 F4:2 E4:2 C#4:2'], { vel: 0.8 });
    mel(bs, 2, ['C2:2 C3:1 r:1 G2:2 r:2 F2:2 F3:1 r:1 A2:2 C#3:2']);
    stabs(ch, 2, 'C', [2, 6], { low: 60, n: 3 });
    stabs(ch, 2, 'F', [10], { low: 60, n: 3 });
    stabs(ch, 2, 'A7', [14], { low: 61, n: 3 });
    drum(k, 2, 1, 'X.....x.X.......');
    drum(sn, 2, 1, '....X.......xxXX');
    drum(hh, 2, 1, 'x.x.x.x.x.x.....');
    drum(cl, 2, 1, '....x...........');
    tor.note(2 * 16, 0, 0, 0.35);

    // c.3 Planalto: sobe 1 tom, os metais tocam o tema com o brinquedo, rufar pro gol
    const TEMA_D = 'F#5:2 A5:2 D6:3 C#6:1 B5:2 G5:2 A5:4';
    toyMel(3, [TEMA_D]);
    mel(metais, 3, [TEMA_D]);
    mel(metais, 3, [TEMA_D], { shift: -12, vel: 0.6 });
    mel(bs, 3, ['D2:2 D3:1 r:1 A2:2 r:2 G2:2 G3:1 r:1 A2:2 A3:2']);
    padChord(str, 3, 'D', 8, { low: 62, n: 3 });
    padChord(str, 3, 'G', 4, { low: 62, n: 3, at: 8 });
    padChord(str, 3, 'A', 4, { low: 61, n: 3, at: 12 });
    stabs(acordes, 3, 'D', [0, 6], { low: 57, n: 3, len: 2 });
    stabs(acordes, 3, 'G', [8], { low: 55, n: 3, len: 2 });
    stabs(acordes, 3, 'A', [12], { low: 57, n: 3, len: 2 });
    drum(k, 3, 1, 'X..x..x.X..x....');
    drum(sn, 3, 1, '....X...x.xxXXXX');
    drum(hh, 3, 1, 'xxXxxxXxxxXx....');
    drum(cr, 3, 1, 'X...............', { vel: 0.6 });
    tor.note(3 * 16, 0, 0, 0.6);

    // c.4 GOL: prato, rede, torcida e o SOC-CER-MON nos metais; a torcida responde com palmas
    const gD = GANCHO.em({ tom: 2 });
    toyMel(4, [gD]);
    mel(metais, 4, [gD]);
    mel(metais, 4, [gD], { shift: -12, vel: 0.7 });
    mel(bs, 4, ['D2:3 D2:3 D3:6 A2:2 C#3:2']);
    padChord(str, 4, 'D', 16, { low: 62, n: 4 });
    stabs(acordes, 4, 'D', [0, 3, 6], { low: 57, n: 4, len: 2 });
    drum(k, 4, 1, 'X..X..X.....X.X.');
    drum(cr, 4, 1, 'X...............');
    drum(pal, 4, 1, GANCHO.palmas);
    rd.note(4 * 16, 0, 0, 1);
    tor.note(4 * 16, 0, 0, 1);

    // c.5–7 a explicação: o brinquedo canta o tema por cima da banda (ele lidera agora); Si♭7 leva pro Mi♭
    const EXP = [
        ['D', 'Bm', 'r:2 A4:1 B4:1 D5:2 D5:2 E5:2 F#5:2 A5:4'],
        ['G', 'A', 'F#5:2 A5:2 D6:3 C#6:1 B5:2 G5:2 A5:4'],
        ['D', 'Bb7', 'D6:4 A5:2 F#5:2 F5:2 Ab5:2 Bb5:2 D6:2'],
    ];
    EXP.forEach(([c1, c2, m], i) => {
        const b = 5 + i;
        toyMel(b, [m]);
        padChord(str, b, c1, 8, { low: 57, n: 4, vel: 0.8 });
        padChord(str, b, c2, 8, { low: 57, n: 4, vel: 0.8, at: 8 });
        stabs(ch, b, c1, [2, 6], { low: 60, n: 3 });
        stabs(ch, b, c2, [10, 14], { low: 60, n: 3 });
        drum(k, b, 1, 'X.....x.X.......');
        drum(sn, b, 1, i === 2 ? '....X.......xxXX' : '....X.......X...');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.');
        drum(cl, b, 1, '....x.......x...', { vel: 0.7 });
    });
    mel(bs, 5, [
        'D2:2 D3:1 r:1 A2:2 r:2 B1:2 B2:1 r:1 F#2:2 A2:2',
        'G2:2 G3:1 r:1 D3:2 r:2 A2:2 A3:1 r:1 E3:2 C#3:2',
        'D2:2 D3:1 r:1 A2:2 r:2 Bb1:2 Bb2:1 r:1 F2:2 Ab2:2',
    ]);
    mel(metais, 7, ['r:8 F5:2 Ab5:2 Bb5:2 D6:2'], { vel: 0.7 });

    // c.8 tela final: sobe meio tom, SOC-CER-MON com tudo e palmas
    const gEb = GANCHO.em({ tom: 3 });
    toyMel(8, [gEb]);
    mel(metais, 8, [gEb]);
    mel(metais, 8, [gEb], { shift: -12, vel: 0.7 });
    mel(bs, 8, ['Eb2:3 Eb2:3 Eb3:6 Bb2:2 D3:2']);
    padChord(str, 8, 'Eb', 16, { low: 63, n: 4 });
    stabs(acordes, 8, 'Eb', [0, 3, 6], { low: 58, n: 4, len: 2 });
    drum(k, 8, 1, 'X..X..X.....X.X.');
    drum(cr, 8, 1, 'X...............');
    drum(pal, 8, 1, GANCHO.palmas);
    tor.note(8 * 16, 0, 0, 0.8);

    // c.9 hino: Lá♭ → Mi♭ (amém), e a última nota é dele: o passinho do começo, lá em cima
    stabs(acordes, 9, 'Ab', [0], { low: 56, n: 4, len: 8 });
    stabs(acordes, 9, 'Eb', [8], { low: 55, n: 4, len: 8 });
    mel(metais, 9, ['C6:4 Ab5:4 G5:8']);
    padChord(str, 9, 'Ab', 8, { low: 60, n: 4 });
    padChord(str, 9, 'Eb', 8, { low: 58, n: 4, at: 8 });
    mel(bs, 9, ['Ab2:8 Eb2:8']);
    mel(tuba, 9, ['Ab1:8 Eb1:8'], { vel: 0.6 });
    drum(k, 9, 1, 'X.......X.......');
    drum(cr, 9, 1, '........X.......');
    toyMel(9, ['r:12 Bb5:1 C6:1 Eb6:2']);
    return S;
}
