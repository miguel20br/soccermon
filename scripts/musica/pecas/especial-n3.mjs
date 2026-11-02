// Especial N3 (01/11/2026): o stinger do golpe máximo N3, pedido do Miguel ("não tem uma música épica, tá só uma câmera
// lenta"). Lá menor, 150 BPM (linha = 0,1 s), ~2,4 s: a cena do especial congela a quadra 0,8 s (`N3_SCENE_MS`) e é a
// subida (caixa em rufo crescendo, tímpano, metais subindo pelo cromático, como a Rocket); na linha 8 cai o chute
// (bumbo, prato, acorde cheio) e o SOC-CER-MON em Lá menor nos metais, com as palmas do 808 respondendo "hey hey".
// Vai pro jogo como efeito (`public/sfx/max-stinger.mp3`, ~-14 LUFS, um pouco abaixo do golpe-n3): render.mjs com
// `--out <pasta>` e `ffmpeg -i <pasta>/especial-n3.wav -af "volume=-3.5dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,alimiter=limit=0.89" -b:a 112k public/sfx/max-stinger.mp3`.
import { drum, I, Song, voicing } from '../synth.mjs';

export const meta = { titulo: 'Especial N3 (stinger)', tela: 'Partida: golpe máximo N3', lufs: -15 };

export default function especialN3() {
    const S = new Song({ bpm: 150, bars: 2, tail: 0.9 });
    const brass = S.part('metais', I.brass, { gain: 1.25, rev: 0.25 });
    const lead = S.part('lead', I.lead, { pan: -0.15, gain: 0.7, echo: { rows: 3, fb: 0.25, mix: 0.18 } });
    const stab = S.part('acorde', I.stab, { pan: 0.25, gain: 1.6, rev: 0.2 });
    const bass = S.part('baixo', I.bass, { gain: 0.9 });
    const arp = S.part('arp', I.arp, { pan: 0.35, gain: 1.3 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const kick = S.part('bumbo', I.kick, { drum: true, gain: 1.1 });
    const timp = S.part('timpano', I.timp, { drum: true, gain: 0.45, rev: 0.3 });
    const crash = S.part('prato', I.crash, { drum: true, gain: 0.7, rev: 0.3 });
    const clap = S.part('palmas', I.clap808.com({ ganho: 0.6, corte: 6800, sala: 0.12 }), { drum: true, gain: 1 });

    // a subida (linhas 0 a 7): rufo que cresce, tímpano no 0 e no 4, metais subindo do Mi ao Si pelo cromático
    drum(sn, 0, 1, 'oooxoxxX........');
    drum(sn, 0, 1, '..o.o.ox........', { pitch: 4 });
    drum(timp, 0, 1, 'x...X...........');
    [64, 65, 66, 67, 68, 69, 70, 71].forEach((m, i) => {
        brass.note(i, m, 1, 0.55 + i * 0.06);
    });
    [76, 79, 81, 84, 88, 91, 93, 96].forEach((m, i) => {
        arp.note(i, m, 1, 0.5 + i * 0.05);
    });
    // o chute (linha 8): bumbo, prato e o Lá menor com nona cheio
    drum(kick, 0, 1, '........X..x..x.');
    drum(crash, 0, 1, '........X.......');
    for (const m of voicing('Am9', 57, 5)) stab.note(8, m, 2, 1);
    bass.note(8, 33, 4, 1);
    bass.note(11, 33, 3, 0.85);
    bass.note(14, 40, 6, 0.95);
    // o SOC-CER-MON em Lá menor (Mi Dó Lá, 3-3-6), metais e lead em oitava, e o acorde de resposta
    for (const [row, m, len] of [
        [8, 76, 3],
        [11, 72, 3],
        [14, 81, 7],
    ]) {
        brass.note(row, m - 12, len, 1);
        lead.note(row, m, len, 0.9);
    }
    for (const m of voicing('Am9', 57, 5)) stab.note(14, m, 6, 0.9);
    // "hey hey" do 808 (linhas 12 e 14 do motivo que começou na 8) e o prato de fim
    drum(clap, 1, 1, '....x.x.........');
    drum(crash, 1, 1, '....x...........');
    drum(kick, 1, 1, '....X...........');
    return S;
}
