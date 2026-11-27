// Sem dependências: a Home (flag.ts) importa isto, e o pedaço do Time Ultimate fica fora do bundle dela.

let skew = 0;
/** O maior relógio já visto (desta sessão ou do save, `utSeen`): o relógio do Time Ultimate nunca volta. */
let floor = 0;
/**
 * Relógio do Time Ultimate: o de verdade, ou o da prévia (`?utnow=2026-12-20` no dev e nas prévias, pra jogar a
 * Temporada 1 e o Natal antes da data; flag.ts). Em produção é sempre o do aparelho, mas nunca anda pra trás: adiantar o
 * relógio, pegar os pacotes/objetivos/teto do dia e voltar ele repetia tudo (auditoria de 27/11/2026). Quem voltou o
 * relógio espera o tempo de verdade alcançar o que já viu.
 */
export const utNow = () => {
    floor = Math.max(floor, Date.now() + skew);
    return floor;
};
export const setUtNow = (at: number | null) => {
    skew = at === null ? 0 : at - Date.now();
    floor = 0;
};
/** O relógio do save (`UltimateSave.seen`, ao carregar, juntar com a nuvem ou restaurar) puxa o piso. */
export const utSeen = (t: number) => {
    if (Number.isFinite(t) && t > floor) floor = t;
};
/** O que vai pro save: o piso, só com o relógio de verdade (o da prévia não fica preso no save). */
export const utFloor = () => (skew === 0 ? floor : 0);
