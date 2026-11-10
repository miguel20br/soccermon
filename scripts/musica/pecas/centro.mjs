// Centro Pokémon (rota-indigo-2.md, R6; 10/11/2026): 2 s enquanto as bolas do time piscam na máquina de cura. Clima de
// "cuidaram de você", sem citar a melodia dos jogos: a pergunta sobe em arpejo no ritmo do SOC-CER-MON (3-3-2, Fá-Lá-Dó),
// a resposta desce devagar e pousa na tônica ("volte sempre"). Harmonia plagal (Fá → Si♭ → Fá, o "amém" que soa como
// cura), timbre quente (piano elétrico, sino, pad), sem bateria. Assinatura: o "plim" da máquina (a moeda do Mercado
// subindo em arpejo, baixinha) em cada bola que acende, no 1º tempo. Fá maior, 120 BPM, 1 compasso + rabo.
import { I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Centro Pokémon (jingle de 2 s)', tela: 'Centro Pokémon (cura)', lufs: -15 };

export default function centro() {
    const S = new Song({ bpm: 120, bars: 1, tail: 0.6 });
    const sino = S.part('sino', I.bell, {
        pan: 0.15,
        gain: 1.2,
        echo: { rows: 1, fb: 0.3, mix: 0.22 },
        rev: 0.35,
        corte: 4500,
    });
    const ep = S.part('piano', I.epiano, { pan: -0.1, gain: 0.9, rev: 0.3, corte: 3600 });
    const ep2 = S.part('piano2', I.epiano, { pan: 0.2, gain: 0.55, rev: 0.3, corte: 3000 });
    const pad = S.part('pad', I.pad, { gain: 1, rev: 0.4 });
    const pz = S.part('baixo', I.pizz, { gain: 0.85, corte: 1800 });
    const plim = S.part('plim', I.coin, { drum: true, gain: 0.4, rev: 0.3, corte: 6000 });

    // as bolas acendendo: 4 "plins" subindo, um por semicolcheia, no 1º tempo
    mel(sino, 0, ['F5:1 A5:1 C6:1 F6:1 r:12']);
    for (let i = 0; i < 4; i++) plim.note(i, [0, 4, 7, 12][i], 0, 0.6);
    // a pergunta (3-3-2, sobe) e a resposta (desce e pousa)
    const M = ['r:4 F5:2 A5:2 C6:2 Bb5:1 A5:1 G5:1 E5:1 F5:2!'];
    mel(ep, 0, M);
    mel(ep2, 0, M, { harm: thirdBelow(MAJOR(5)) });
    padChord(pad, 0, 'Fadd9', 8, { vel: 0.7 });
    padChord(pad, 0, 'Bbadd9', 4, { at: 8, vel: 0.65 });
    padChord(pad, 0, 'Fadd9', 4, { at: 12, vel: 0.75 });
    mel(pz, 0, ['F2:4 r:4 Bb2:4 F2:4']);
    return S;
}
