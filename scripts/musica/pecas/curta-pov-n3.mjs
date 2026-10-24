// Curta "POV: você segurou o golpe até o nível 3" (~18 s). A música conta a história com o gancho: cada gomo da
// barra que acende canta uma nota do SOC-CER-MON, e o "Esperar" deixa a frase sem terminar até o N3.
//   c.0  N1 acende: "SOC" (Sol5) no sino com o GOMO (o som de assinatura: a barra enchendo, um "plin" que escorrega
//        até a nota). Coração no Sol grave, o relógio (bloco de madeira) marcando a espera. Na linha 12 o dedo vai pro
//        Esperar: "toc".
//   c.1  o jogo segue e a barra enche de novo: moedinhas subindo (uma por lance), o baixo anda até o Láb.
//   c.2  N2: "SOC-CER" (Sol, Mi), meio tom acima no baixo, caixa no 2 e no 4, relógio nervoso. "toc-toc".
//   c.3  a barra enche mais rápido (moedas em colcheia), caixa em colcheias, o baixo sobe pro Lá.
//   c.4  N3: "SOC-CER..." e a frase fica pendurada. Lá e Si (sensível) no baixo, riser, caixa em semicolcheias. Na
//        linha 14 o toque: TUM (o impacto, curto).
//   c.5  "MON!" (Dó6): a banda inteira enquanto a faixa da assinatura fica na tela.
//   c.6  o voo em câmera lenta: só semínimas (meio tempo), metais subindo Fá → Sol, tímpanos e riser até o gol.
//   c.7  a bola rolando pra rede (tímpano) e o GOL na linha 8: prato, rede, Dó maior nos metais e as palmas 808.
//   c.8  tela final: o gancho um tom acima (Ré), o logo pisca e o capitão pula nas 3 notas.
//   c.9  acorde final de Ré (o vídeo corta ~1 s depois, com fade curto).
// Dó maior → Ré maior no fim. 110 (N1) → 122 (N2) → 134 BPM (N3 em diante).
import { bass, drum, GANCHO, hz, I, mel, padChord, Song, SR, stabs } from '../synth.mjs';
import { rede, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'POV: segurou até o nível 3', tela: 'Curta das redes', lufs: -15 };
export const BPM = [110, 110, 122, 122, 134, 134, 134, 134, 134, 134];

const TAU = Math.PI * 2;
/** O gomo da barra acendendo: um "plin" que escorrega de uma oitava abaixo até a nota (`m`, midi) e soa como vidro. */
const gomo = som(
    0.9,
    (m) => {
        let ph = 0;
        let ph2 = 0;
        const f = hz(m);
        return (t) => {
            const sobe = f * 2 ** -Math.max(0, 1 - t / 0.07);
            ph += (TAU * sobe) / SR;
            ph2 += (TAU * sobe * 2.76) / SR;
            const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.28);
            return (Math.sin(ph + 0.6 * Math.sin(ph2)) + 0.3 * Math.sin(2 * ph)) * env;
        };
    },
    { pk: 0.5, corte: 7000 },
);
/** Riser: ruído que abre e sobe (a tensão antes do toque), 1,1 s. */
const riser = som(
    1.1,
    (_p, r) => {
        let v = 0;
        let ph = 0;
        return (t) => {
            const u = Math.min(1, t / 1.0);
            const a = 1 - Math.exp((-TAU * (300 + 6000 * u * u)) / SR);
            v += a * (r() * 2 - 1 - v);
            ph += (TAU * (180 + 700 * u * u)) / SR;
            return (v * 0.8 + 0.25 * Math.sin(ph)) * u * u * (t < 1.04 ? 1 : 0);
        };
    },
    { pk: 0.45 },
);

export default function curtaPov() {
    // o volume geral cresce até o toque; o "MON!" explode por cima (c.5)
    const S = new Song({
        bpm: 110,
        bars: 10,
        bpmAt: (b) => BPM[Math.min(b, BPM.length - 1)],
        tail: 2.5,
        masterAt: (s) => (s < 10 ? 0.58 + 0.24 * (s / 10) : 1),
    });
    const sino = S.part('gancho', I.bell, { gain: 2.2, rev: 0.35, echo: { rows: 3, fb: 0.2, mix: 0.18 } });
    const lead = S.part('lead', I.lead, { gain: 0.55, corte: 5000, rev: 0.2 });
    const gm = S.part('gomo', gomo, { drum: true, gain: 0.9, rev: 0.3 });
    const moeda = S.part('moedas', I.coin, { gain: 0.8, pan: 0.3, rev: 0.2 });
    const arpejo = S.part('arpejo', I.pulse, {
        gain: 0.5,
        pan: -0.2,
        corte: 4200,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
    });
    const metais = S.part('metais', I.brass, { gain: 0.45, rev: 0.2 });
    const cordas = S.part('cordas', I.strings, { gain: 0.9, rev: 0.3 });
    const bx = S.part('baixo', I.bass, { gain: 0.38 });
    const stb = S.part('stabs', I.stab, { gain: 1.2, pan: 0.2 });
    const kick = S.part('bumbo', I.kick, { drum: true, gain: 0.45 });
    const cx = S.part('caixa', I.snare, { drum: true, gain: 0.6, rev: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, gain: 0.9, pan: 0.3 });
    const rel = S.part('relogio', I.block, { drum: true, gain: 1.4, pan: -0.25, rev: 0.15 });
    const toc = S.part('esperar', I.block, { drum: true, gain: 2.4, rev: 0.2 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.4 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });
    const rs = S.part('riser', riser, { drum: true, gain: 1 });
    const rd = S.part('rede', rede, { drum: true, gain: 0.7, rev: 0.3 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 0.8 });

    // c.0 N1: "SOC"
    gm.note(0, 79, 0, 1);
    mel(sino, 0, ['G5:6 r:10']);
    mel(lead, 0, ['G5:6 r:10'], { vel: 0.5 });
    padChord(cordas, 0, 'Gsus4', 16, { low: 50, n: 3, vel: 0.5 });
    bass(bx, 0, 'G', '0:2 r:1 0:1 r:4 0:2 r:1 0:1 r:4', { oct: -1 });
    drum(kick, 0, 1, 'x..x....x..x....', { vel: 0.8 });
    drum(rel, 0, 1, 'x.o.x.o.x.o.....', { pitch: 5 });
    toc.note(12, -10, 0, 1);
    // c.1 a barra enche: uma moeda por lance, subindo
    padChord(cordas, 1, 'G', 16, { low: 50, n: 3, vel: 0.55 });
    bass(bx, 1, 'G', '0:2 r:1 0:1 r:4 0:2 r:1 0:1 r:2 0:2', { oct: -1 });
    drum(kick, 1, 1, 'x..x....x..x....', { vel: 0.8 });
    drum(rel, 1, 1, 'x.o.x.o.x.o.x.o.', { pitch: 5 });
    drum(hh, 1, 1, '..x...x...x...xx', { vel: 0.6 });
    [2, 6, 10, 14].forEach((r, i) => {
        moeda.note(16 + r, 72 + i * 2, 1, 0.8);
    });
    // a tensão em semicolcheias (Sol sus) crescendo até o N2
    for (let r = 0; r < 16; r++) arpejo.note(16 + r, [67, 72, 74, 79][r % 4], 1, 0.35 + 0.5 * (r / 15));

    // c.2 N2: "SOC-CER"
    gm.note(32, 79, 0, 1);
    gm.note(35, 76, 0, 1);
    mel(sino, 2, ['G5:3 E5:5 r:8']);
    mel(lead, 2, ['G5:3 E5:5 r:8'], { vel: 0.55 });
    padChord(cordas, 2, 'Ab', 16, { low: 51, n: 3, vel: 0.6 });
    bass(bx, 2, 'Ab', '0:2 r:1 0:1 r:2 0:2 0:2 r:1 0:1 r:2 0:2', { oct: -1 });
    drum(kick, 2, 1, 'x..x..x.x..x..x.', { vel: 0.85 });
    drum(cx, 2, 1, '....x.......x...', { vel: 0.7 });
    drum(rel, 2, 1, 'x.oxx.oxx.ox....', { pitch: 7 });
    toc.note(32 + 12, -10, 0, 1);
    toc.note(32 + 13, -8, 0, 0.8);
    // c.3 enche mais rápido
    padChord(cordas, 3, 'Ab', 16, { low: 51, n: 3, vel: 0.7 });
    bass(bx, 3, 'Ab', '0:2 r:1 0:1 r:2 0:2 0:2 r:1 0:1 r:2 0:2', { oct: -1 });
    drum(kick, 3, 1, 'x..x..x.x..x..x.', { vel: 0.85 });
    drum(cx, 3, 1, '....x.......x.xx', { vel: 0.75 });
    drum(hh, 3, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    drum(rel, 3, 1, 'x.oxx.oxx.oxx.ox', { pitch: 7 });
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((r, i) => {
        moeda.note(48 + r, 76 + i, 1, 0.75);
    });
    for (let r = 0; r < 16; r++)
        arpejo.note(48 + r, [68, 72, 75, 80][r % 4] + (r >= 8 ? 1 : 0), 1, 0.5 + 0.5 * (r / 15));
    mel(lead, 3, ['r:8 E5:2 F5:2 F#5:2 G5:2'], { vel: 0.45 });

    // c.4 N3: "SOC-CER..." pendurado; o dedo desce na linha 14: TUM (o impacto curto) e já vem o MON
    gm.note(64, 79, 0, 1);
    gm.note(67, 76, 0, 1);
    gm.note(70, 84, 0, 0.7);
    mel(sino, 4, ['G5:3 E5:3 r:10']);
    mel(lead, 4, ['G5:3 E5:11 r:2'], { vel: 0.6 });
    mel(cordas, 4, ['A3+C4+E4:8 B3+D4+F4:6 r:2'], { vel: 0.7 });
    mel(bx, 4, ['A1:2 A1:2 A1:2 A1:2 B1:2 B1:2 B1:2 r:2']);
    drum(kick, 4, 1, 'x.x.x.x.x.x.x...', { vel: 0.9 });
    drum(cx, 4, 1, '....xoxoxxxxXXX.', { vel: 0.8 });
    drum(rel, 4, 1, 'xxxxxxxxxx......', { pitch: 9, vel: 0.8 });
    rs.note(4 * 16 + 4, 0, 0, 1);
    drum(tp, 4, 1, '..............X.', { pitch: -2 });
    drum(kick, 4, 1, '..............X.');

    // c.5 "MON!": a banda inteira enquanto a faixa da assinatura fica na tela
    mel(sino, 5, ['C6:6 r:10']);
    mel(lead, 5, ['C6:6 r:2 G5:2 C6:2 E6:4']);
    mel(metais, 5, ['C5+E5+G5:6 r:2 C5+E5+G5:2 r:2 D5+F5+A5:4']);
    padChord(cordas, 5, 'C', 16, { low: 55, n: 4, vel: 0.7 });
    bass(bx, 5, 'C', '0:2 8:1~ r:1 5:2 0:1 r:1 0:2 8:1~ r:1 s:2 5:2', { oct: -1 });
    stabs(stb, 5, 'C', [2, 6, 10, 14], { low: 60, n: 3 });
    drum(kick, 5, 1, 'X..x..x...x..x..');
    drum(cx, 5, 1, '....x.......x...');
    drum(hh, 5, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.7 });
    drum(cr, 5, 1, 'X...............');

    // c.6 o voo em câmera lenta: metade do tempo (só semínimas), os metais subindo em Fá e Sol, riser até o gol
    mel(metais, 6, ['F4+A4+C5:4 F4+A4+C5:4 G4+B4+D5:4 G4+B4+D5:4']);
    mel(lead, 6, ['A5:4 C6:4 B5:4 D6:4'], { vel: 0.8 });
    padChord(cordas, 6, 'F', 8, { low: 53, n: 4, vel: 0.75 });
    padChord(cordas, 6, 'G', 8, { low: 55, n: 4, vel: 0.8, at: 8 });
    mel(bx, 6, ['F1:4 F1:4 G1:4 G1:4']);
    drum(kick, 6, 1, 'X.......X.......');
    drum(tp, 6, 1, 'x...x...x.x.xxxx', { pitch: 3 });
    drum(cx, 6, 1, '............xxxx', { vel: 0.9 });
    rs.note(6 * 16 + 4, 2, 0, 1);

    // c.7 a bola rolando pra rede (tímpano rufando, o Sol pendurado) e o GOL na linha 8: prato, rede, Dó maior inteiro
    // nos metais e as palmas 808
    mel(cordas, 7, ['G3+B3+D4+F4:8 C4+E4+G4+C5:8'], { vel: 0.8 });
    mel(bx, 7, ['G1:2 G1:2 G1:2 G1:2 C2:8']);
    drum(tp, 7, 1, 'xxxxxxxx........', { pitch: 5, vel: 0.7 });
    drum(cx, 7, 1, 'oooooxxX........', { vel: 0.8 });
    drum(cr, 7, 1, '........X.......');
    drum(kick, 7, 1, '........X..x..x.');
    drum(hh, 7, 1, '........x.xx.x.x', { vel: 0.7 });
    rd.note(7 * 16 + 8, 0, 0, 1);
    mel(metais, 7, ['r:8 C5+E5+G5+C6:6 r:2']);
    mel(lead, 7, ['r:8 C6:3 G5:1 C6:4'], { vel: 0.9 });
    drum(cl, 7, 1, '..........x.x.x.');

    // c.8 tela final: o gancho um tom acima (Ré); o logo pisca e o capitão pula nas 3 notas
    mel(sino, 8, [GANCHO.em({ tom: 2 })]);
    mel(lead, 8, [GANCHO.em({ tom: 2 })], { vel: 0.8 });
    mel(metais, 8, [GANCHO.em({ tom: 2, oitava: -1 })]);
    padChord(cordas, 8, 'D', 16, { low: 57, n: 4, vel: 0.7 });
    bass(bx, 8, 'D', '0:2 8:1~ r:1 5:2 0:1 r:1 0:2 8:1~ r:1 s:2 5:2', { oct: -1 });
    stabs(stb, 8, 'D', [2, 6, 10, 14], { low: 62, n: 3 });
    drum(kick, 8, 1, 'X..x..x...x..x..');
    drum(cx, 8, 1, '....x.......x...');
    drum(hh, 8, 1, 'x.xx.x.xx.xx.x.x', { vel: 0.7 });
    drum(cr, 8, 1, 'X...............');
    drum(cl, 8, 1, GANCHO.palmas);
    // c.9 o acorde final (o vídeo acaba ~1 s depois do ataque)
    mel(metais, 9, ['D5+F#5+A5+D6:12 r:4']);
    mel(sino, 9, ['D6:16']);
    padChord(cordas, 9, 'D', 16, { low: 57, n: 4, vel: 0.7 });
    mel(bx, 9, ['D2:12 r:4']);
    drum(kick, 9, 1, 'X...............');
    drum(cr, 9, 1, 'X...............');
    drum(tp, 9, 1, 'X...............');
    return S;
}
