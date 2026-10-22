// Curtas 2 (22/10/2026): a partitura de cada peça vira uma lista de eventos com o segundo exato de cada nota, pra cena
// desenhar cada som no instante dele. A música não muda: é o mesmo .ogg da categoria livre (render determinístico).
//   node trailer/curtas-2/eventos.mjs <pasta>   → <pasta>/<peça>.js com window.EV = { notas, compassos }
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import abertura from '../../scripts/musica/pecas/livre-abertura-album.mjs';
import ginasio from '../../scripts/musica/pecas/livre-ginasio.mjs';
import { Song } from '../../scripts/musica/synth.mjs';

let notas = null;
const partOrig = Song.prototype.part;
Song.prototype.part = function (name, ...rest) {
    const p = partOrig.call(this, name, ...rest);
    const note = p.note;
    // ponytail: o tempo do arquivo é o tempo da partitura (os trechos são emendados sem sobra; o loop só dobra o rabo)
    p.note = (t, m, len = 1, vel = 1) => {
        notas.push([name, Math.round(this.sec(t) * 1e4) / 1e4, m, len, Math.round(vel * 100) / 100]);
        note(t, m, len, vel);
    };
    return p;
};

const OUT = process.argv[2] ?? '/tmp/soccermon-curtas-2';
mkdirSync(OUT, { recursive: true });
for (const [nome, peca] of Object.entries({ ginasio, abertura })) {
    notas = [];
    const S = peca();
    notas.sort((a, b) => a[1] - b[1]);
    const compassos = Array.from({ length: S.bars + 1 }, (_, b) => Math.round(S.timeOfBar(b) * 1e4) / 1e4);
    writeFileSync(join(OUT, `${nome}.js`), `window.EV = ${JSON.stringify({ swing: S.swing, compassos, notas })};\n`);
    const n = {};
    for (const [p] of notas) n[p] = (n[p] ?? 0) + 1;
    console.log(nome, compassos.at(-1), JSON.stringify(n));
}
