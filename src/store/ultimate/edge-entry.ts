/**
 * O que a Edge Function `ut` (troca e ranking do Time Ultimate) usa do jogo. Empacotar (NÃO está no package.json, que
 * esta frente não mexe; o Miguel decide na hora de ligar):
 *   npx esbuild src/store/ultimate/edge-entry.ts --bundle --minify --format=esm --platform=neutral \
 *     --outfile=supabase/functions/ut/engine.js
 * O engine.js não vai pro git (mesmo molde da `liga`, ADR 0002): refazer a cada `ENGINE_VERSION` novo.
 */
export { ENGINE_VERSION } from '../../engine/config';
export { teamFromRecipe, teamRecipe, validarTimeDuelo } from '../../engine/duel-validate';
export { viewInstance } from '../../engine/instance';
export { ligaOrders, simulateLiga } from '../../engine/league';
export { dailyDay } from '../daily';
export { LEVELS } from './rules';
export { seasonN } from './season';
export {
    canPropose,
    RANK_DAILY_MAX,
    rankPoints,
    recipeMatchesSave,
    TRADE,
    tradedUid,
    tradeProblems,
} from './trade';
export { outcomeOf, teamStrength, ultimateRival } from './ultimate';
