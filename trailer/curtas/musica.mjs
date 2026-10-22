// Curtas promocionais (22/10/2026): a música de cada curta é a peça da categoria livre editada na partitura, não no
// áudio. A peça roda inteira, mas cada nota cai no compasso novo do mapa (compasso dropado = nota descartada; compasso
// repetido = nota tocada de novo). Assim o eco, o reverb e as notas longas soam naturais nas emendas, sem corte seco.
//   node trailer/curtas/musica.mjs <pasta>   → <pasta>/snorlax.wav, penaltis.wav e <nome>.js (tempos dos compassos)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import penaltis from '../../scripts/musica/pecas/livre-penaltis.mjs';
import snorlax from '../../scripts/musica/pecas/livre-snorlax.mjs';
import { SR, Song, writeWav } from '../../scripts/musica/synth.mjs';

// compassos da peça original, na ordem do curta
export const MAPAS = {
    // chegada | tema | 1ª tentativa (corrida, BOING) | 2ª (corrida, BOING) | bocejo | dorme | ninar (1º e 4º) |
    // ponta do pé e o gol | cochicho | "HÃ?" | vira e ronca | o tema recomeça (tela final)
    snorlax: [0, 1, 5, 6, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 1],
    // as 5 rodadas inteiras (2 a 22) | a festa: SOC-CER-MON em Mi (23–24), sobe um tom (27–28) e fecha em Fá# (31)
    penaltis: [...Array.from({ length: 21 }, (_, i) => i + 2), 23, 24, 27, 28, 31],
};

/** Refaz o Song pro mapa (chamado no 1º `part`, depois do construtor e do `masterAt` da peça). */
function recortar(S, mapa) {
    const ult = S.secoes.at(-1);
    const tail = ult.len / SR - (ult.t1 - ult.t0);
    S.recorte = mapa;
    S.bars = mapa.length;
    const ob = (b) => mapa[Math.min(Math.max(b, 0), mapa.length - 1)];
    if (S.bpmAt) {
        const f = S.bpmAt;
        S.bpmAt = (b) => f(ob(b));
        S.starts = [0];
        for (let b = 0; b < S.bars + 1; b++) S.starts.push(S.starts[b] + (S.barLen * 60) / S.bpmAt(b) / 4);
    }
    if (S.masterAt) {
        // o volume geral da peça é pelo compasso original (a tensão que cresce rodada a rodada)
        const f = S.masterAt;
        const barAt = S.barAt.bind(S);
        S.masterAt = (t) => {
            const nb = barAt(t);
            const i = Math.min(Math.floor(nb), mapa.length - 1);
            S.barAt = () => ob(i) + (nb - i);
            const g = f(t);
            delete S.barAt;
            return g;
        };
    }
    const t1 = S.timeOfBar(S.bars);
    S.secoes = [{ nome: 'curta', de: 0, loop: false, ate: S.bars, t0: 0, t1, len: Math.ceil((t1 + tail) * SR) }];
    S.secOfBar = () => 0;
}

const partOrig = Song.prototype.part;
let MAPA = null;
Song.prototype.part = function (...args) {
    if (MAPA && !this.recorte) recortar(this, MAPA);
    const p = partOrig.apply(this, args);
    if (!this.recorte) return p;
    const note = p.note;
    const { barLen, recorte } = this;
    p.note = (t, m, len, vel) => {
        const b = Math.floor(t / barLen);
        recorte.forEach((o, i) => {
            if (o === b) note(t + (i - b) * barLen, m, len, vel);
        });
    };
    return p;
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const OUT = process.argv[2] ?? '/tmp/soccermon-curtas';
    mkdirSync(OUT, { recursive: true });
    for (const [nome, peca] of Object.entries({ snorlax, penaltis })) {
        MAPA = MAPAS[nome];
        const S = peca();
        MAPA = null;
        const audio = S.render();
        writeWav(join(OUT, `${nome}.wav`), audio);
        // início de cada compasso (s), andamento e swing: a cena calcula o tempo de cada linha com isso
        const inicios = Array.from({ length: S.bars + 1 }, (_, b) => Math.round(S.timeOfBar(b) * 1e6) / 1e6);
        const bpm = Array.from({ length: S.bars }, (_, b) => (S.bpmAt ? S.bpmAt(b) : S.bpm));
        const info = { mapa: MAPAS[nome], inicios, bpm, swing: S.swing, duracao: audio[0].length / SR };
        writeFileSync(join(OUT, `${nome}.js`), `window.MUSICA = ${JSON.stringify(info)};\n`);
        console.log(nome, `${S.bars} compassos`, `${inicios.at(-1).toFixed(2)} s + rabo = ${info.duracao.toFixed(2)} s`);
    }
}
