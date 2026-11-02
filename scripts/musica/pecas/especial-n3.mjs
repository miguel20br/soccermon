// Especial N3 v2 (01/11/2026): o stinger do golpe máximo N3. A v1 (pedido do Miguel: "não tem uma música épica, tá só
// uma câmera lenta") era chapada: a subida em -15/-16 dB e o chute em -12, sem contraste ("no N3 é pra ela explodir").
// Lá menor, 150 BPM (linha = 0,1 s), ~3 s: a cena do especial congela a quadra 1 s (`N3_SCENE_MS`) e é a subida, que
// começa quase sumindo (~-28 dB) e cresce (rufo acelerando de colcheia a fusa, prato ao contrário, tímpano, metais e
// arpejo subindo pelo cromático, como a Rocket); a linha 9 é o respiro (silêncio de 0,1 s) e na linha 10 (1 s, o chute
// na tela, `N3_STINGER_KICK_MS`) cai o impacto: 808 grave descendo, bumbo, prato, Lá menor com nona cheio, ~6 dB acima
// do fim da subida; daí o SOC-CER-MON em Lá menor nos metais (3-3-6), com as palmas do 808 respondendo "hey hey".
// Vai pro jogo como efeito (`public/sfx/max-stinger.mp3`): render.mjs com `--out <pasta>` e
// `ffmpeg -i <pasta>/especial-n3.wav -af "volume=-4.8dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,alimiter=limit=0.89" -b:a 112k public/sfx/max-stinger.mp3`.
import { drum, I, ins, Song, voicing } from '../synth.mjs';

export const meta = { titulo: 'Especial N3 (stinger v2)', tela: 'Partida: golpe máximo N3', lufs: -15 };

/** Linha do chute (0,1 s cada): casa com `N3_SCENE_MS` no MatchScene. */
const HIT = 10;

export default function especialN3() {
    const S = new Song({ bpm: 150, bars: 2, tail: 0.9 });
    const brass = S.part('metais', I.brass, { gain: 1.25, rev: 0.25 });
    const lead = S.part('lead', I.lead, { pan: -0.15, gain: 0.7, echo: { rows: 3, fb: 0.25, mix: 0.18 } });
    const stab = S.part('acorde', I.stab, { pan: 0.25, gain: 1.6, rev: 0.2 });
    const bass = S.part('baixo', I.bass, { gain: 0.9 });
    const arp = S.part('arp', I.arp, { pan: 0.35, gain: 1.3 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const kick = S.part('bumbo', I.kick, { drum: true, gain: 1.25 });
    const timp = S.part('timpano', I.timp, { drum: true, gain: 0.5, rev: 0.3 });
    const crash = S.part('prato', I.crash, { drum: true, gain: 0.8, rev: 0.3 });
    // prato ao contrário: ruído que cresce 0,8 s e corta seco no respiro
    const rcym = S.part(
        'prato-contrario',
        [0.3, 0, 2600, 0.78, 0, 0.015, 3, 2, null, null, 800, 0.02, null, 8, null, 0.01],
        {
            drum: true,
            gain: 0.55,
        },
    );
    // 808 grave descendo (seno de Mi1 caindo) por baixo do impacto
    const sub = S.part('808', ins({ vol: 0.95, a: 0.002, s: 0.35, r: 0.45, shape: 0, slide: -0.35, sv: 1 }), {
        gain: 1.1,
    });
    const clap = S.part('palmas', I.clap808.com({ ganho: 0.6, corte: 6800, sala: 0.12 }), { drum: true, gain: 1 });

    // a subida (linhas 0 a 8,6): tudo cresce de 0,18 a 0,85 de força (o fim fica ~6 dB abaixo do impacto)
    const up = (t) => 0.18 + (0.67 * t) / 8.6;
    // rufo acelerando: colcheia, semicolcheia, tercina, fusa
    const roll = [0, 2, 4, 5, 6, 6.5, 7, 7.33, 7.66, 8, 8.2, 8.4, 8.6];
    for (const t of [...roll, 1, 3, 5.5]) sn.note(t, 0, 0, up(t));
    timp.note(0, 0, 0, 0.2);
    timp.note(4, 0, 0, 0.45);
    rcym.note(0.8, 0, 0, 0.9);
    // os metais da subida sem reverb: o rabo dele enchia o respiro
    const rise = S.part('metais-subida', I.brass, { gain: 1.25 });
    [64, 65, 66, 67, 68, 69, 70, 71, 72].forEach((m, i) => {
        rise.note(i, m, 1, up(i));
    });
    [76, 79, 81, 84, 88, 91, 93, 96, 100].forEach((m, i) => {
        arp.note(i, m, 1, up(i) * 1.1);
    });
    // o impacto (linha 10): 808, bumbo, prato e o Lá menor com nona cheio
    sub.note(HIT, 40, 6, 1);
    kick.note(HIT, 0, 0, 1.2);
    drum(kick, 0, 1, '.............x..', { vel: 0.85 });
    crash.note(HIT, 0, 0, 1.2);
    for (const m of voicing('Am9', 57, 5)) stab.note(HIT, m, 2, 1);
    bass.note(HIT, 33, 4, 1);
    bass.note(HIT + 3, 33, 3, 0.85);
    bass.note(HIT + 6, 40, 6, 0.95);
    // o SOC-CER-MON em Lá menor (Mi Dó Lá, 3-3-6), metais e lead em oitava, e o acorde de resposta
    for (const [row, m, len] of [
        [HIT, 76, 3],
        [HIT + 3, 72, 3],
        [HIT + 6, 81, 7],
    ]) {
        brass.note(row, m - 12, len, 1);
        lead.note(row, m, len, 0.9);
    }
    for (const m of voicing('Am9', 57, 5)) stab.note(HIT + 6, m, 6, 0.9);
    // "hey hey" do 808 (12 e 14 linhas depois do chute) e o prato de fim
    clap.note(HIT + 12, 0, 0, 0.85);
    clap.note(HIT + 14, 0, 0, 0.85);
    crash.note(HIT + 12, 0, 0, 0.85);
    kick.note(HIT + 12, 0, 0, 1.15);
    return S;
}
