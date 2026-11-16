// A versão de álbum de uma peça do jogo sem mexer nela: roda a peça com o gravador de notas ligado e toca as notas de
// novo num Song mais comprido, na ordem de `trechos` (compassos [de, ate) da peça), com `fim` compassos vazios no fim
// pro final escrito. Um número no meio de `trechos` = compassos vazios ali (parte nova: o B2 da Rocket). Mesmos timbres, pan, eco, reverb e corte; camadas (`gainAt`), volume geral (`masterAt`) e
// andamento (`bpmAt`) seguem o compasso de origem.
import { Song } from '../synth.mjs';

/**
 * @param {() => Song} peca a função da peça do jogo
 * @param {([number, number] | number)[]} trechos compassos da peça, na ordem do álbum (número = compassos vazios)
 * @param {{ fim?: number, tail?: number, bpmFim?: number }} o
 * @returns {{ S: Song, P: (nome: string) => object, n: number, inicio: number[] }} `P` acha a faixa pelo nome; `n` =
 *   compassos antes do final (o final começa no compasso `n`); `inicio` = compasso novo onde começa cada trecho.
 */
export function estender(peca, trechos, { fim = 3, tail = 4, bpmFim = null } = {}) {
    const rec = Song.recording;
    Song.recording = true;
    const S = peca();
    Song.recording = rec;
    const inicio = [];
    const mapa = [];
    for (const x of trechos) {
        inicio.push(mapa.length);
        if (typeof x === 'number') for (let i = 0; i < x; i++) mapa.push(null);
        else for (let b = x[0]; b < x[1]; b++) mapa.push(b);
    }
    const n = mapa.length;
    // compasso vazio segue o último compasso tocado antes dele (andamento, camadas, volume)
    const orig = (j) => {
        for (let i = Math.min(j, n - 1); i >= 0; i--) if (mapa[i] != null) return mapa[i];
        return 0;
    };
    // segundos no Song novo → segundos na peça (o final segura o fim do último compasso)
    let S2;
    const tempoOrig = (t) => {
        const x = S2.barAt(t);
        const j = Math.floor(x);
        const ob = orig(j);
        const fr = j >= n || mapa[j] == null ? 0.999 : x - j;
        return S.timeOfBar(ob) + fr * (S.timeOfBar(ob + 1) - S.timeOfBar(ob));
    };
    const bpmAt = S.bpmAt || bpmFim ? (j) => (j >= n && bpmFim ? bpmFim : S.bpmAt ? S.bpmAt(orig(j)) : S.bpm) : null;
    S2 = new Song({
        bpm: S.bpm,
        bars: n + fim,
        barLen: S.barLen,
        swing: S.swing,
        swingUnit: S.swingUnit,
        tail,
        bpmAt,
        masterAt: S.masterAt ? (t) => S.masterAt(tempoOrig(t)) : null,
    });
    const L = S.barLen;
    const partes = new Map();
    for (const p of S.parts) {
        const { pan, gain, echo, rev, drum, corte } = p;
        const ga = p.gainAt;
        const p2 = S2.part(p.name, p.inst, {
            pan,
            gain,
            echo,
            rev,
            drum,
            corte,
            gainAt: ga ? (t) => ga(tempoOrig(t)) : null,
        });
        partes.set(p.name, p2);
        // a `voz` (Koga, Sabrina) guarda a duração da nota fora dela: tocar na faixa original antes acerta a duração
        const sinc = typeof p.inst === 'function' ? p.note : null;
        for (const [t, m, len, vel] of [...p.rec]) {
            const ob = Math.floor(t / L);
            mapa.forEach((b, j) => {
                if (b !== ob) return;
                sinc?.(t, m, len, vel);
                p2.note(t + (j - ob) * L, m, len, vel);
            });
        }
    }
    const P = (nome) => {
        const p = partes.get(nome);
        if (!p) throw new Error(`faixa ${nome} não existe (tem: ${[...partes.keys()].join(', ')})`);
        return p;
    };
    return { S: S2, P, n, inicio };
}
