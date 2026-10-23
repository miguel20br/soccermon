// Montagem SOC-CER-MON (amostra de eletrofunk, 23/10/2026, "só pra ver": não está no jogo).
// Montagem de 130 BPM do jeito do funk de agora: um sample picotado vira o refrão. Aqui o sample é uma voz
// sintetizada (formantes) cantando "SÓ-CÊ-MÔN" no 3-3-2 do gancho (Dó#-Lá-Fá#), e a colagem é com os sons do jogo:
// o chute vira bumbo, a bola quicando vira chimbal, a rede vira caixa. Começa gaguejando ("só, só, só-cê, só-cê"),
// o synth automotivo (quadrada suja, dobrada e desafinada) entra no meio, o breque desce a voz uma oitava (câmera
// lenta) e no fim a voz sobe uma oitava (aceleradinha) antes do último SOC-CER-MON.
// Fá# menor, 130 BPM. Forma: gagueira (2) | A (8) | breque lento (2) | queda (10) | aceleradinha (2) | fim (2).
import { abre, boom, curva, oito, ruido, satura, voz } from '../eletro.mjs';
import { bass, drum, I, ins, mel, Song } from '../synth.mjs';
import { chute, quique, rede, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Montagem SOC-CER-MON', tela: 'Amostra (eletrofunk), fora do jogo' };

const QUADRADA = ins({ vol: 0.26, a: 0.002, r: 0.05, shape: 5, curve: 0.5, sv: 0.5, d: 0.07 });
const RIFF = {
    'F#m': 'F#4:2 F#4:1 r:1 A4:2 F#4:1 r:1 C#5:2 B4:1 r:1 A4:2 G#4:2',
    D: 'F#4:2 F#4:1 r:1 A4:2 F#4:1 r:1 D5:2 C#5:1 r:1 A4:2 F#4:2',
    E: 'E4:2 E4:1 r:1 G#4:2 E4:1 r:1 B4:2 A4:1 r:1 G#4:2 E4:2',
    'C#7': 'F4:2 F4:1 r:1 G#4:2 F4:1 r:1 C#5:2 B4:1 r:1 G#4:2 F4:2',
};
const CIFRA = ['F#m', 'D', 'E', 'C#7'];

export default function montagem() {
    const S = new Song({ bpm: 130, bars: 26, swing: 0.04, tail: 2.5 });
    const so = S.part('voz-so', voz({ vogal: 'o', cons: 's', dur: 0.2 }), { pan: 0, gain: 1, rev: 0.12 });
    const ce = S.part('voz-ce', voz({ vogal: 'e', cons: 's', dur: 0.2 }), { pan: 0, gain: 1, rev: 0.12 });
    const mon = S.part('voz-mon', voz({ vogal: 'O', cons: 'm', dur: 0.5 }), {
        gain: 1,
        rev: 0.2,
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
    });
    const bum = S.part('bumbo', boom({ f0: 170, f1: 46, dec: 0.3, drive: 2.6 }), { drum: true, gain: 0.4 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.45 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.35, gain: 0.3 });
    const rd = S.part('rede', rede, { drum: true, pan: -0.15, gain: 0.45, rev: 0.15 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.2 }), { drum: true, gain: 0.5 });
    const gr = S.part('808', oito({ dec: 0.4, drive: 2 }), { gain: 0.3 });
    const sq1 = S.part('auto-1', QUADRADA, { pan: -0.4, gain: 0.4, corte: 3200 });
    const sq2 = S.part('auto-2', QUADRADA, { pan: 0.4, gain: 0.4, corte: 3200 });
    const tc = S.part('torcida', torcida(3.6, 1, 1.2), { drum: true, gain: 0.35, rev: 0.25 });
    const rs = S.part('subida', ruido(3.6), { drum: true, gain: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });

    const ROW = (b, r) => b * 16 + r;
    // o gancho cantado: SÓ (Dó#) no 0, CÊ (Lá) no 3, MÔN (Fá#) no 6; `oit` em oitavas
    const gancho = (b, oit = 0, vel = 1) => {
        so.note(ROW(b, 0), 61 + 12 * oit, 0, vel);
        ce.note(ROW(b, 3), 57 + 12 * oit, 0, vel);
        mon.note(ROW(b, 6), 66 + 12 * oit, 0, vel * 1.1);
    };
    // a resposta gaguejada: "só-só-só-só" em semicolcheias subindo
    const gagueja = (b, de = 8) => {
        [61, 61, 64, 66, 68, 69, 68, 66].slice(0, 16 - de).forEach((m, i) => {
            (i % 2 ? ce : so).note(ROW(b, de + i), m, 0, 0.75);
        });
    };
    const batida = (b, c, cheio = true) => {
        drum(bum, b, 1, 'X.....x...x.X...');
        bass(gr, b, c, '0:6 0:4 8:2 0:4');
        drum(cl, b, 1, '....x.......x...');
        if (cheio) {
            drum(qq, b, 1, '..x...x...x...xx', { pitch: 19, vel: 0.6 });
            drum(ch, b, 1, '.......x.....x..', { vel: 0.7 });
        }
    };
    const auto = (b, c, shift = 0) => {
        mel(sq1, b, [RIFF[c]], { shift: shift - 0.12 });
        mel(sq2, b, [RIFF[c]], { shift: shift + 0.12 });
    };

    // gagueira: "só, só, só, só" e depois "só-cê, só-cê, só-cê-MÔN"; o chute marca o tempo
    for (const r of [0, 4, 8, 12]) so.note(ROW(0, r), 61, 0, 0.8);
    for (const r of [0, 4, 8]) {
        so.note(ROW(1, r), 61, 0, 0.9);
        ce.note(ROW(1, r + 2), 57, 0, 0.9);
    }
    mon.note(ROW(1, 12), 66, 0, 1);
    drum(ch, 0, 2, 'x...x...x...x...', { vel: 0.8 });

    // A: a batida, o gancho no compasso par e a colagem de bola e rede no ímpar; o automotivo entra no 6
    for (let i = 0; i < 8; i++) {
        const b = 2 + i;
        const c = CIFRA[i % 4];
        batida(b, c, i > 1);
        if (i % 2 === 0) gancho(b);
        else {
            drum(qq, b, 1, '........x.xx....', { pitch: 7 });
            rd.note(ROW(b, 12), 0, 0, 0.9);
        }
        if (i >= 4) auto(b, c);
    }
    cr.note(ROW(2, 0), 0, 0, 0.8);

    // breque: a voz em câmera lenta (uma oitava abaixo), a torcida e a subida
    gancho(10, -1, 1.1);
    mon.note(ROW(11, 0), 54, 0, 0.9);
    bum.note(ROW(10, 0), 0, 0, 1);
    tc.note(ROW(10, 0), 0, 0, 1);
    rs.note(ROW(10, 0), 0, 0, 1);
    gagueja(11, 8);
    abre(
        rs,
        curva(S, [
            [10, 300],
            [12, 10000],
        ]),
    );

    // queda: tudo; gancho no par, gagueira no ímpar (pergunta e resposta)
    for (let i = 0; i < 10; i++) {
        const b = 12 + i;
        const c = CIFRA[i % 4];
        batida(b, c);
        auto(b, c, i >= 8 ? 12 : 0);
        if (i % 2 === 0) gancho(b);
        else {
            gagueja(b, 8);
            rd.note(ROW(b, 12), 0, 0, 0.7);
        }
    }
    cr.note(ROW(12, 0), 0, 0, 1);

    // aceleradinha: a voz uma oitava acima, a batida dobra o bumbo
    for (const b of [22, 23]) {
        batida(b, CIFRA[b - 22]);
        drum(bum, b, 1, '..x.......x...x.', { vel: 0.7 });
        auto(b, CIFRA[b - 22], 12);
        gancho(b, 1, 0.9);
        gagueja(b, 10);
    }
    tc.note(ROW(22, 0), 2, 0, 0.8);

    // fim: SÓ-CÊ-MÔN inteiro, o chute, a rede e o prato
    gancho(24, 0, 1.15);
    drum(bum, 24, 1, 'X..x..x.........');
    mel(sq1, 24, ['C#5:3 A4:3 F#5:10']);
    mel(sq2, 24, ['C#5:3 A4:3 F#5:10'], { shift: 0.12 });
    bass(gr, 24, 'F#m', '0:3 0:3 0:10');
    ch.note(ROW(25, 0), 0, 0, 1);
    rd.note(ROW(25, 1), 0, 0, 1);
    cr.note(ROW(25, 0), 0, 0, 1);
    bum.note(ROW(25, 0), 0, 0, 1);

    satura(sq1, 2.2);
    satura(sq2, 2.2);
    return S;
}
