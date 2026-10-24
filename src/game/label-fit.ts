/** Nome na quadra em pé: nome curto antes de esconder (docs/planos/nomes-na-quadra.md, A+C, 23/10/2026). */
export const SHORT_NAME_MAX = 5;

export type Rect = { x0: number; x1: number; y0: number; y1: number };

export const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** Texto do nome: capitão leva "C·"; curto corta em SHORT_NAME_MAX letras. */
export const labelText = (name: string, captain: boolean, short: boolean) => {
    const n = short ? name.slice(0, SHORT_NAME_MAX) : name;
    return captain ? `C·${n}` : n;
};

/** Primeiro candidato (inteiro, depois curto) que não cruza nenhum já colocado; -1 se nenhum (o nome some). */
export const firstFit = (placed: Rect[], candidates: Rect[]) =>
    candidates.findIndex((c) => !placed.some((p) => overlaps(c, p)));
