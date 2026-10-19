import { FUTSAL_5 } from './config';
import { type DuelTeamRecipe, teamFromRecipe } from './duel-validate';
import { runMatch } from './runners/batch-runner';
import { validOrder } from './runners/live-runner';
import type { MatchOrder, TeamSetup } from './state';

/**
 * Partida da Liga contra um time fantasma: o seu time (receita) contra o time salvo de outro jogador, comandado pela
 * IA. Sem DOM: o mesmo arquivo roda no navegador e na Edge Function `liga` (supabase/functions/liga), que refaz a
 * partida com a mesma seed e as mesmas ordens e grava o placar. Os dois lados montam o time pela receita, então os
 * uids (e tudo que depende deles, como a evolução do Eevee) batem.
 */

/** Seed da partida no motor (o banco guarda só a seed da partida da Liga). */
export const ligaMatchSeed = (seed: string) => `${seed}-stage-0`;

/** Mais ordens que isso numa partida não é técnico, é robô. */
export const MAX_LIGA_ORDERS = 80;

/** Seu time (substituição só sua) contra o fantasma (a IA troca por ele). */
export function ligaTeams(mine: DuelTeamRecipe, ghost: DuelTeamRecipe): [TeamSetup, TeamSetup] {
    return [
        { ...teamFromRecipe(mine, 'a'), manualSubs: true },
        { ...teamFromRecipe(ghost, 'b'), manualSubs: false },
    ];
}

/** Ordens que o servidor aceita: lista curta, só do seu time (0) e que o motor sabe aplicar. Senão null. */
export function ligaOrders(orders: unknown): MatchOrder[] | null {
    if (!Array.isArray(orders) || orders.length > MAX_LIGA_ORDERS) return null;
    const ok = orders.every(
        (o) => !!o && typeof o === 'object' && (o as MatchOrder).team === 0 && validOrder(o as MatchOrder),
    );
    return ok ? (orders as MatchOrder[]) : null;
}

export interface LigaScore {
    score: [number, number];
    shootout: [number, number] | null;
    /** 0 = você, 1 = fantasma. */
    winner: 0 | 1 | null;
}

/** A partida inteira, sem quadra (o que a Edge Function roda: ~0,5 s de CPU). */
export function simulateLiga(
    mine: DuelTeamRecipe,
    ghost: DuelTeamRecipe,
    seed: string,
    orders: MatchOrder[],
): LigaScore {
    const [home, away] = ligaTeams(mine, ghost);
    const r = runMatch(FUTSAL_5, home, away, ligaMatchSeed(seed), { orders, snapshots: false });
    return { score: [r.score[0], r.score[1]], shootout: r.shootout, winner: r.winner };
}
