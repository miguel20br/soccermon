/**
 * Textos com concordância: "1 gol", "2 gols"; fases da copa com a preposição certa (em português).
 * Telas novas usam o i18n (`tn`, `dict().common.stageIn` / `stageWon`), que tem as duas línguas.
 */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "nas oitavas de final", "na semifinal"... (índice = fase da copa). */
export const STAGE_IN = ['nas oitavas de final', 'nas quartas de final', 'na semifinal', 'na final'];

/** "Oitavas de final vencidas", "Semifinal vencida"... */
export const STAGE_WON = [
    'Oitavas de final vencidas',
    'Quartas de final vencidas',
    'Semifinal vencida',
    'Final vencida',
];
