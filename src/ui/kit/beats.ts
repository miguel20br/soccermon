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

/** Próximo índice do seletor ‹ › (`dir` -1 ou 1): dá a volta com `wrap`, senão para nas pontas. */
export function stepIndex(i: number, dir: -1 | 1, n: number, wrap: boolean): number {
    const j = i + dir;
    return wrap ? (j + n) % n : Math.min(n - 1, Math.max(0, j));
}
