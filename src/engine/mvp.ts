import type { MatchResult, PlayerSummary } from './runners/batch-runner';

/** Nota de "craque da partida": gols e assistências pesam mais, defesa também conta. */
export function mvpScore(p: PlayerSummary): number {
    const s = p.stats;
    return (
        s.goals * 3 + s.assists * 2 + s.saves * 0.8 + s.tacklesWon * 0.5 + s.interceptions * 0.4 + s.shotsOnTarget * 0.4
    );
}

/** Todos que jogaram (titulares ao fim + quem saiu no intervalo, com as estatísticas do 1º tempo). */
export const everyoneIn = (m: MatchResult): PlayerSummary[] => [...m.finalRoster, ...(m.subbedOut ?? [])];

/** Craque da partida (dos dois times) ou de um time só. */
export function matchMvp(m: MatchResult, team?: 0 | 1): PlayerSummary | null {
    const list = everyoneIn(m).filter((p) => team === undefined || p.team === team);
    if (!list.length) return null;
    return list.reduce((best, p) => (mvpScore(p) > mvpScore(best) ? p : best));
}
