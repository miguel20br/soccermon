/**
 * O que a Edge Function `liga` usa do jogo. `npm run edge:liga` empacota este arquivo (motor + regras, ~300 KB) em
 * supabase/functions/liga/engine.js, que não vai pro git: refazer antes de cada deploy da função e a cada
 * `ENGINE_VERSION` novo (o servidor recusa partida de outra versão do motor).
 */
export { ENGINE_VERSION } from '../engine/config';
export { buildCupOpponents } from '../engine/cup';
export { teamFromRecipe, teamRecipe, validarTimeDuelo } from '../engine/duel-validate';
export { viewInstance } from '../engine/instance';
export { ligaOrders, simulateLiga } from '../engine/league';
export { dailyDay } from '../store/daily';
export {
    ELO_START,
    eloAfter,
    GHOST_POOL,
    pickGhost,
    prevSeason,
    RECENT_GHOSTS,
    seasonOf,
    seasonStartElo,
} from './rules';
