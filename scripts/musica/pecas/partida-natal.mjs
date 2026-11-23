// Partida de Natal (23/11/2026, Natal da 0.9.54): a Partida v4 (a base aprovada) com roupa de Natal, tocada no lugar
// da partida padrão de 30/11 a 06/01. A forma, os trechos, os andamentos e a sincronia com o jogo não mudam (mesmos
// níveis por minuto, virada, pressão e fim; mesmo `partidaBase`): só entram camadas por cima do groove.
// - GUIZOS de trenó em semicolcheias com o acento do partido-alto, mais fortes a cada nível.
// - SINOS de igreja no 1 de cada frase (a cada 4 compassos), na raiz e na quinta do acorde.
// - CAIXINHA DE MÚSICA (celesta) respondendo o tema nas pausas dele (pergunta e resposta), descendo o acorde.
// - A citação dos compassos 13 a 16 (`cita`, onde os líderes citam o motivo deles) é "Jingle Bells" (James Lord
//   Pierpont, 1857, domínio público): o lead canta "jingle bells, jingle bells, jingle all the way" e os metais
//   respondem uma oitava abaixo, em Fá maior7 e Mi7(♭9), que leva de volta ao Lá menor.
// - No fim de cada tempo, depois do SOC-CER-MON com a torcida, os sinos e os guizos tocam juntos no acorde final.
// Rodada 2 (Miguel, 23/11: "falta um pouco mais de Natal… queria muito aqueles sininhos de Natal"): os guizos eram só
// ruído (o `I.sleigh`). Agora são SININHOS afinados (seno com FM, o brilho metálico do guizo de trenó), três por batida
// sacudindo em cacho; um GLOCKENSPIEL dobra o tema uma oitava acima do 2º nível em diante; o arpejo da partida vira
// glockenspiel e a percussão (agogô) vira triângulo. O ruído fica baixinho, só como o chiado do sacudir.
import { celesta } from '../album/kit.mjs';
import { partidaBase, V4 } from '../partida-base.mjs';
import { drum, I, ins, mel, noteName, padChord, transpose, voicing } from '../synth.mjs';

export const meta = {
    titulo: 'Partida de Natal (v4 com guizos, sinos e caixinha)',
    tela: 'Partida (Natal, 30/11 a 06/01)',
};

/** "Jingle Bells" em Dó (no Lá menor do 1º tempo): o refrão em dobro da velocidade, um compasso por frase. */
export const JINGLE = {
    mel: ['E5:2 E5:2 E5:4 E5:2 E5:2 E5:4', 'E5:2 G5:2 C5:3 D5:1 E5:8'],
    acordes: ['Fmaj7', 'E7b9'],
};

/** Camadas de Natal por cima de uma partida feita pelo `partidaBase` (o `extra`). */
export function natal(S, { secs, chords }) {
    const gz = S.part('guizos', I.sleigh, { drum: true, pan: 0.4, gain: 1.6 });
    // sininho de trenó: seno com FM (parciais fora da série harmônica = metal), ataque seco, rabo curto
    const tl = S.part('sininhos', ins({ vol: 0.1, a: 0.001, r: 0.16, shape: 0, mod: 0.35, sv: 0.12, d: 0.03 }), {
        pan: 0.35,
        gain: 3.8,
        rev: 0.25,
    });
    const glk = S.part('glockenspiel', I.bell, { pan: -0.15, gain: 1.8, rev: 0.3 });
    // cachos que se alternam (o sacudir): Mi7, Sol7, Si7 e Ré8, Fá#7, Lá7
    const CACHOS = [
        [100, 103, 107],
        [98, 102, 105],
    ];
    const sacode = (b, pat, forca) => {
        [...pat].forEach((c, r) => {
            if (c === '.') return;
            const vel = (c === 'X' ? 1 : c === 'x' ? 0.7 : 0.45) * forca;
            CACHOS[r % 2].forEach((n, k) => tl.note(b * 16 + r, n, 1, vel * (1 - 0.15 * k)));
        });
    };
    const sino = S.part('sinos', I.bell, { pan: -0.3, gain: 1.6, rev: 0.35 });
    const cx = celesta(S, 'caixinha', { pan: 0.45, gain: 0.5, rev: 0.3, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const acordeDe = (j, sh) => {
        const i = j % 8;
        return j >= 8 && i >= 4 ? transpose(JINGLE.acordes[i % 2], sh) : transpose(chords[i], sh);
    };
    for (const x of secs) {
        if (x.nivel < 1) continue;
        const forca = [0, 0.55, 0.7, 0.85, 1][x.nivel];
        for (let j = 0; j < 16; j++) {
            const b = x.de + j;
            const i = j % 8;
            const ch = acordeDe(j, x.sh);
            drum(gz, b, 1, 'xoxoXoxoxoxoXoxo', { vel: forca });
            sacode(b, x.nivel >= 3 ? 'xoxoXoxoxoxoXoxo' : 'x.o.X.o.x.o.X.o.', forca);
            // o glockenspiel canta o tema junto do lead (fora da citação, que é dos metais e do lead)
            const cita = j >= 12;
            if (x.nivel >= 2 && !cita) mel(glk, b, [V4.theme[i]], { shift: x.sh, vel: 0.8 });
            if (j % 4 === 0) padChord(sino, b, ch, 8, { low: 64, n: 2, vel: 0.8 });
            // a caixinha responde nas pausas do tema (linhas 8 a 11 dos compassos 2 e 4 de cada frase)
            if (i === 1 || i === 3) {
                const [a, b2, c, d] = voicing(ch, 79, 4).map(noteName);
                mel(cx, b, [`r:8 ${d}:1 ${c}:1 ${b2}:1 ${a}:1 r:4`], { vel: 0.9 });
            }
        }
    }
    // a virada pra pressão: os guizos rufam
    const vir = secs.find((x) => x.nome === 'virada');
    if (vir) {
        drum(gz, vir.de, 1, 'xxxxXxxxXxXxXXXX');
        sacode(vir.de, 'xxxxXxxxXxXxXXXX', 1);
    }
    // o fim do tempo: guizos sacudindo no gancho e os sinos no acorde final
    const f = secs.at(-1);
    drum(gz, f.de, 2, 'XoxoXoxoXoxoXxXx');
    const ultimo = f.de + 2;
    // 1º tempo (4 trechos) termina no Mi7(♭9) do intervalo; o 2º, na tônica
    const acorde = transpose(secs.length === 4 ? chords[7] : chords[0], f.sh);
    padChord(sino, ultimo, acorde, 12, { low: 64, n: 3, vel: 1 });
    drum(gz, ultimo, 1, 'XxXxXxXo........');
    sacode(ultimo, 'XxXxXxXo........', 1);
}

export default function partidaNatal() {
    // o arpejo vira glockenspiel e o agogô vira triângulo (sino curto, agudo)
    return partidaBase({
        cita: JINGLE,
        extra: natal,
        inst: { arp: I.bell, perc: ins({ vol: 0.16, freq: 2100, a: 0.001, r: 0.3, shape: 0, mod: 0.12, sv: 0.2, d: 0.02 }) },
    });
}
