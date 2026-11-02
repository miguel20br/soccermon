import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';

/** Teto da cascata (cara-de-jogo.md, peça 3): passou disso, as batidas encolhem na mesma proporção. */
export const CASCADE_MAX_MS = 3500;

/** Horário (ms) de cada batida a partir dos intervalos entre elas, com o total cabendo em `max`. */
export function beatTimes(gaps: readonly number[], max = CASCADE_MAX_MS): number[] {
    let at = 0;
    const times = gaps.map((g) => {
        at += Math.max(0, g);
        return at;
    });
    const end = times.at(-1) ?? 0;
    return end > max ? times.map((t) => Math.round((t * max) / end)) : times;
}

/** Quantas batidas já bateram aos `elapsed` ms. */
export const beatsAt = (times: readonly number[], elapsed: number) => times.filter((t) => t <= elapsed).length;

/**
 * A carta do pacote que ganha o walkout (menus-fc-e-aclamados.md): só ouro (75+) ou edição especial, e só uma por
 * pacote, a melhor (edição antes, depois a nota). -1 = nenhuma: o pacote abre como sempre.
 */
export function walkoutIndex(cards: readonly PokemonInstance[]): number {
    let best = -1;
    let score = -1;
    cards.forEach((c, i) => {
        const ovr = viewInstance(c).overall;
        const s = editionOf(c) ? 1000 + ovr : ovr >= 75 ? ovr : -1;
        if (s > score) {
            best = i;
            score = s;
        }
    });
    return best;
}

/** Próximo índice do seletor ‹ › (`dir` -1 ou 1): dá a volta com `wrap`, senão para nas pontas. */
export function stepIndex(i: number, dir: -1 | 1, n: number, wrap: boolean): number {
    const j = i + dir;
    return wrap ? (j + n) % n : Math.min(n - 1, Math.max(0, j));
}
