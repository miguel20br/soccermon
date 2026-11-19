// Trailer do Time Ultimate, "Do zero ao time" (18/11/2026; o esboço de 15 s foi aprovado: "achei bem bem legal").
// Música própria da peça, que conta a história do roteiro-v2 (~/Vídeos/soccermon-postar/trailer-ut/roteiro-v2.md).
// Deriva do "Só o balanço" (menu-balanco, a música do UT hoje): o vamp Lá dórico (Am9–D9), o baixo slap, a guitarra no
// contratempo e a bola quicando, aqui a 136 BPM. Compasso = 1,765 s; 18 compassos = 31,8 s (o vídeo).
// Personagem com voz: o Dratini (bronze 48) tem um motivo de 4 notas num pícolo magrinho; o Dragonair responde uma terça
// acima no vibrafone (a química vira harmonia); no walkout do Dragonite (ouro 89) o mesmo motivo volta aumentado nos
// metais graves, 1 tom acima (Si dórico). Sons de assinatura: o rasgo do pacote (chocalho que cresce), as 3 cartas
// virando (bloco de madeira subindo) e as moedas da trilha das Metas (as do Mercado funk).
// Forma, compasso a compasso (o plano do roteiro entre parênteses):
//   0 (pacote): SOC-CER-MON, rasgo, as 3 cartas · 1 (Dratini de perto | Clube): o motivo no pícolo; tudo some e o
//   toque no Dratini dá um "ting" que o Dragonair responde · 2 (química): o motivo em terças no vibrafone; virada de caixa
//   · 3-4 (partida): o balanço inteiro; o Slam é um "bonk" grave, o drible é a melodia, cordas sobem pro gol ·
//   5 (GOL e pós-jogo): prato, SOC-CER-MON nos metais com a torcida batendo palma · 6-7 (Metas): as moedas sobem pela
//   trilha e o Pegar cai num "plim" · 8-9½ (Abrir todos): o groove leve e, no 2º pacote, sobe pelo cromático e corta pro
//   silêncio (o estádio apaga: a placa OURO e o walkout têm som próprio) · 12 (o Dragonite bate na carta): prato, Si
//   dórico, o motivo do Dratini nos metais graves · 13 (a carta 89; na metade, o 2º Dratini, Repetida): a banda para e o
//   pícolo diz o motivo baixinho · 14-15 (Início, o time andando): o balanço em Si · 16-17 (fecho): SOC-CER-MON com o
//   "hey hey" e o acorde final em Si maior (o bronze virou ouro).
import { bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';

export const meta = { titulo: 'Trailer UT: Do zero ao time', tela: 'Trailer do Time Ultimate' };

const semDC = (inst) => [...inst.slice(0, -1), 40];

export default function trailerUt() {
    const S = new Song({ bpm: 136, bars: 18, swing: 0.1, tail: 2.5 });
    const lead = S.part('synth', semDC(I.pulse), {
        pan: -0.1,
        gain: 1.3,
        echo: { rows: 3, fb: 0.25, mix: 0.2 },
        rev: 0.2,
        corte: 2800,
    });
    const pic = S.part('pícolo (Dratini)', I.piccolo, {
        pan: 0.1,
        gain: 1.6,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
        rev: 0.25,
    });
    const vib = S.part('vibrafone (Dragonair)', I.bell, {
        pan: 0.3,
        gain: 2.1,
        echo: { rows: 3, fb: 0.2, mix: 0.2 },
        rev: 0.35,
    });
    const metais = S.part('metais', I.brass, { gain: 0.75, rev: 0.2 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55, corte: 900 });
    const clav = S.part('clavinete', semDC(I.clav), { pan: 0.3, gain: 0.8, corte: 2200 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 0.9 });
    const org = S.part('órgão', semDC(I.organ), { gain: 0.4, corte: 1800, rev: 0.2 });
    const cordas = S.part('cordas', I.strings, { gain: 1.1, rev: 0.25 });
    const bs = S.part('baixo', I.slap, { gain: 0.4, corte: 1100 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.5 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.45 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 }), { drum: true, gain: 0.8 });
    const torcida = S.part('torcida', I.palmas, { drum: true, gain: 0.7, rev: 0.2 });
    const prato = S.part('prato', I.crash, { drum: true, gain: 0.5 });
    const bonk = S.part('bonk', I.timp, { drum: true, gain: 0.4 });
    const bola = S.part('bola', I.tom, { drum: true, pan: -0.2, gain: 0.45 });
    const rasgo = S.part('rasgo', I.shaker, { drum: true, pan: 0.15, gain: 2.4 });
    const carta = S.part('cartas', I.block, { drum: true, pan: 0.2, gain: 0.9 });
    const coin = S.part('moedas', I.coin, { drum: true, pan: -0.3, gain: 1.2, rev: 0.15 });
    const plim = S.part('plim', I.bell, { pan: 0.2, gain: 2.2, rev: 0.4 });

    const HATS = 'x.xx.x.xx.xx.x.x'.replace(/\./g, 'o');
    const SLAP = '0:2 8:1~ r:1 0:2 r:2 5:2 s:2 8:2 5:2';
    const groove = (b, c, { clap = false, leve = false } = {}) => {
        bass(bs, b, c, SLAP);
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        stabs(
            clav,
            b,
            c,
            [
                [3, 1],
                [7, 1],
                [11, 2],
            ],
            { low: 60, n: 3, vel: 0.7 },
        );
        drum(k, b, 1, 'X.....x...x.....');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o....X.o.');
        drum(hh, b, 1, HATS, { vel: leve ? 0.7 : 1 });
        if (clap) drum(cl, b, 1, '............x...');
    };
    // o motivo do Dratini: 4 notas, sobe em arpejo e cai um degrau (pequeno, de bronze)
    const MOTIVO = 'A5:2 C6:1 E6:1 D6:4';

    // 0 · pacote: SOC-CER-MON no 1º quadro, o rasgo cresce, as 3 cartas viram subindo
    mel(lead, 0, [GANCHO.em({ grau: -2 })]);
    drum(cl, 0, 1, GANCHO.palmas, { vel: 0.7 });
    bass(bs, 0, 'Am9', '0:2 8:1~ r:13', { vel: 0.8 });
    padChord(org, 0, 'Am9', 16, { low: 55, n: 4, vel: 0.5 });
    drum(hh, 0, 1, HATS, { vel: 0.5 });
    drum(rasgo, 0, 1, '...oooxxxX......');
    drum(carta, 0, 1, '.........x......', { pitch: 0 });
    drum(carta, 0, 1, '...........x....', { pitch: 4 });
    drum(carta, 0, 1, '.............x..', { pitch: 7 });

    // 1 · o Dratini de perto: o motivo no pícolo; no Clube tudo some e o toque dá o "ting" (o Dragonair responde)
    mel(pic, 1, [`${MOTIVO} r:8`]);
    bass(bs, 1, 'Am9', '0:2 8:1~ r:1 5:2 s:2 r:8', { vel: 0.8 });
    stabs(gt, 1, 'Am9', [2, 6], { low: 60, n: 3, vel: 0.8 });
    drum(k, 1, 1, 'X.....x.........');
    drum(hh, 1, 1, 'x.xx.x.x........', { vel: 0.7 });
    mel(vib, 1, ['r:12 A5:2 C6:2']);

    // 2 · química: o motivo em terças no vibrafone (os dois juntos); a caixa vira pra partida
    mel(vib, 2, ['A5+C6:2 C6+E6:1 E6+G6:1 D6+F#6:4 r:8'], { vel: 0.9 });
    padChord(org, 2, 'Am9', 8, { low: 55, n: 4, vel: 0.4 });
    padChord(org, 2, 'D9', 8, { low: 55, n: 4, vel: 0.5, at: 8 });
    drum(sn, 2, 1, '........x.x.xxxX', { vel: 0.8 });
    drum(bola, 2, 1, '......X....x..xo', { pitch: 9 });

    // 3-4 · partida: o balanço inteiro; Slam = bonk grave no 1; o drible é a melodia, o vibrafone responde
    groove(3, 'Am9');
    groove(4, 'D9', { clap: true });
    drum(bonk, 3, 1, 'X...............', { pitch: -5 });
    mel(lead, 3, ['A5:3 G5:2 E5:3 r:2 D5:2 E5:2 G5:2']);
    mel(vib, 3, ['r:12 C6:2 A5:2']);
    mel(lead, 4, ['C6:3 B5:2 A5:3 r:8']);
    // a defesa da Chansey (meio do 4) e o rebote: cordas sobem pelo cromático até o gol
    mel(cordas, 4, ['r:8 E5:1 F5:1 F#5:1 G5:1 G#5:1 A5:1 A#5:1 B5:1']);
    drum(sn, 4, 1, '............xxXX', { vel: 0.6 });

    // 5 · GOL: prato, SOC-CER-MON nos metais (uma oitava abaixo do lead) e a torcida batendo palma
    groove(5, 'Am9', { clap: false });
    drum(prato, 5, 1, 'X...............');
    mel(metais, 5, [GANCHO.em({ grau: -2, oitava: -1 })]);
    mel(lead, 5, [GANCHO.em({ grau: -2 })], { vel: 0.8 });
    drum(torcida, 5, 1, GANCHO.palmas);
    padChord(org, 5, 'Am9', 16, { low: 55, n: 4, vel: 0.7 });

    // 6-7 · Metas (v3: o pós-jogo encurtou 2 batidas): as moedas sobem pela trilha e o Pegar (6, linha 4) cai num "plim"
    groove(6, 'D9', { leve: true });
    groove(7, 'Am9', { leve: true, clap: true });
    padChord(org, 6, 'D9', 16, { low: 55, n: 4, vel: 0.5 });
    mel(lead, 6, ['E6:4 D6:2 C6:2 r:8'], { vel: 0.8 });
    for (const [j, p] of [0, 2, 3, 5].entries()) coin.note(6 * 16 + j, p, 0, 0.6 + j * 0.05);
    mel(plim, 6, ['r:4 A6+E7:4 r:8']);
    mel(lead, 7, ['A5:3 C6:2 E6:3 r:2 D6:2 C6:2 A5:2'], { vel: 0.7 });
    drum(coin, 7, 1, '..x.x...........', { pitch: 12, vel: 0.6 });

    // 7½-9 · Abrir todos: o groove leve com as cartas do 1º pacote (madeira, 8 linha 2); no 2º pacote sobe pelo cromático e corta pro silêncio
    // na metade do 9 (a placa OURO: daqui até o 12 só o som do walkout)
    groove(8, 'D9', { leve: true });
    drum(carta, 8, 1, '..x.x.x.........', { vel: 0.8 });
    mel(cordas, 9, ['A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1 r:8']);
    mel(pic, 9, ['A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1 r:8'], { vel: 0.7 });
    drum(sn, 9, 1, 'x.x.xxxxXXXX....', { vel: 0.7 });
    drum(k, 9, 1, 'X.......X.......');
    bass(bs, 9, 'E7', '0:1 0:1 0:1 0:1 3:1 3:1 5:1 5:1 r:8', { vel: 0.8 });

    // 12 · o Dragonite bate na carta (89): prato, 1 tom acima (Si dórico) e o motivo do Dratini aumentado nos metais
    // graves (o bronze virou ouro), com a tuba e o balanço inteiro
    drum(prato, 12, 1, 'X...............');
    drum(bonk, 12, 1, 'X...............', { pitch: 2 });
    groove(12, 'Bm9', { clap: true });
    mel(metais, 12, ['B4:4 D5:2 F#5:2 E5:8']);
    mel(tuba, 12, ['B2:4 D3:2 F#3:2 E3:8']);
    padChord(org, 12, 'Bm9', 16, { low: 57, n: 4, vel: 0.8 });
    padChord(cordas, 12, 'Bm9', 16, { low: 62, n: 3, vel: 0.6 });

    // 13 · a carta 89 na tela (meio compasso de banda); na metade, o 2º Dratini (Repetida): a banda para e o pícolo diz
    // o motivo baixinho, a bola quica e o balanço volta pro Início
    bass(bs, 13, 'E9', '0:2 8:1~ r:1 5:2 s:2 r:8');
    stabs(gt, 13, 'E9', [2, 6], { low: 60, n: 3 });
    drum(k, 13, 1, 'X.....x.........');
    drum(sn, 13, 1, '....X...........');
    drum(hh, 13, 1, 'x.xx.x.x........');
    padChord(org, 13, 'E9', 8, { low: 57, n: 4, vel: 0.6 });
    mel(pic, 13, ['r:8 B5:2 D6:1 F#6:1 E6:4'], { vel: 0.8 });
    drum(bola, 13, 1, '............X..x', { pitch: 11 });

    // 14-15 · Início: o time andando na quadra, o balanço em Si, a melodia do drible 1 tom acima e o vibrafone responde
    groove(14, 'Bm9', { clap: true });
    groove(15, 'E9', { clap: true });
    padChord(org, 14, 'Bm9', 16, { low: 57, n: 4, vel: 0.6 });
    padChord(org, 15, 'E9', 16, { low: 57, n: 4, vel: 0.6 });
    mel(lead, 14, ['B5:3 A5:2 F#5:3 r:2 E5:2 F#5:2 A5:2']);
    mel(vib, 15, ['r:4 G#5:2 B5:2 D6:4 B5:4']);
    drum(bola, 15, 1, '......X....x..xo', { pitch: 11 });

    // 16-17 · fecho: SOC-CER-MON em Si (lead e metais) com o "hey hey" da torcida; o acorde final em Si maior
    groove(16, 'E9');
    drum(prato, 16, 1, 'X...............');
    mel(lead, 16, [GANCHO.em({ grau: -2, tom: 2 })]);
    mel(metais, 16, [GANCHO.em({ grau: -2, tom: 2, oitava: -1 })]);
    drum(torcida, 16, 1, GANCHO.palmas);
    drum(cl, 16, 1, GANCHO.palmas, { vel: 0.8 });
    padChord(org, 16, 'E9', 16, { low: 57, n: 4, vel: 0.7 });
    drum(prato, 17, 1, 'X...............');
    drum(k, 17, 1, 'X...............');
    drum(bonk, 17, 1, 'X...............', { pitch: 2 });
    mel(metais, 17, ['B4+D#5+F#5:16']);
    mel(tuba, 17, ['B2:16']);
    mel(lead, 17, ['B5+D#6:16'], { vel: 0.8 });
    mel(vib, 17, ['F#6:2 D#6:2 B5:12']);
    padChord(org, 17, 'B', 16, { low: 59, n: 4, vel: 0.8 });
    padChord(cordas, 17, 'Badd9', 16, { low: 62, n: 4, vel: 0.7 });
    bass(bs, 17, 'B', '0:16');
    return S;
}
