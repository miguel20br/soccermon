// Sem dependências: a Home (flag.ts) importa isto, e o pedaço do Time Ultimate fica fora do bundle dela.

let skew = 0;
/**
 * Relógio do Time Ultimate: o de verdade, ou o da prévia (`?utnow=2026-12-20` no dev e nas prévias, pra jogar a
 * Temporada 1 e o Natal antes da data; flag.ts). Em produção é sempre o de verdade.
 */
export const utNow = () => Date.now() + skew;
export const setUtNow = (at: number | null) => {
    skew = at === null ? 0 : at - Date.now();
};
