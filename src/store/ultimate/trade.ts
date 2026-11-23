import type { DuelMonRecipe, DuelTeamRecipe } from '../../engine/duel-validate';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import type { Level, Outcome } from './rules';
import type { UltimateSave } from './ultimate';

/**
 * Regras puras da troca de cartas entre amigos e do ranking do Time Ultimate (docs/planos/troca-e-ranking.md).
 * Sem rede e sem DOM: o mesmo arquivo roda no jogo (tela de propor e de aceitar) e na Edge Function `ut` (empacotada
 * por esbuild), então as duas pontas concordam sobre o que vale. Nada aqui está ligado em produção (`?lab=troca`).
 */

export const TRADE = {
    /** Diferença máxima de nota entre as duas cartas (impede entregar o craque em troca de uma bronze). */
    ovrGap: 6,
    /** Trocas fechadas por dia por conta, e por par de amigos. */
    perDay: 5,
    perPairDay: 3,
    /** Ofertas esperando resposta por conta. */
    openMax: 5,
    /** A oferta some depois disso. */
    expireH: 48,
    /** Carta recebida numa troca só pode ser trocada de novo depois disso (corta corrente de contas amigas). */
    regiftH: 24,
    /** Amizade precisa ter pelo menos isso (conta nova + amiga nova = farm). */
    friendH: 24,
} as const;

export type TradeBlock = 'sem_carta' | 'no_time' | 'trancada' | 'evolucao' | 'partida';

/** Por que a carta não pode entrar numa troca (null = pode). A carta no time sai do time antes: o jogo não escolhe por você. */
export function tradeBlock(
    u: Pick<UltimateSave, 'cards' | 'team' | 'locked' | 'evos' | 'live'>,
    uid: string,
): TradeBlock | null {
    if (!u.cards.some((c) => c.uid === uid)) return 'sem_carta';
    if (u.team.order.includes(uid)) return 'no_time';
    if (u.locked.includes(uid)) return 'trancada';
    if (u.evos.some((e) => e.uid === uid)) return 'evolucao';
    if (u.live) return 'partida';
    return null;
}

/** Problemas de equilíbrio entre as duas cartas (vazio = justo). */
export function tradeProblems(give: PokemonInstance, get: PokemonInstance): string[] {
    const out: string[] = [];
    const gap = Math.abs(viewInstance(give).overall - viewInstance(get).overall);
    if (gap > TRADE.ovrGap) out.push(`nota: diferença ${gap} (máximo ${TRADE.ovrGap})`);
    if (give.uid === get.uid) out.push('mesma carta');
    return out;
}

/** O uid da carta que chega: derivado da troca, então aplicar duas vezes não duplica (não precisa mexer no formato do save). */
export const tradedUid = (tradeId: string) => `tr-${tradeId}`;

/**
 * Aplica uma troca já fechada pelo servidor: tira `giveUid`, põe `got` com o uid da troca. Idempotente: sem a carta
 * dada e com a recebida já na coleção, devolve o mesmo save.
 */
export function applyTrade(u: UltimateSave, giveUid: string, got: PokemonInstance, tradeId: string): UltimateSave {
    const uid = tradedUid(tradeId);
    const has = u.cards.some((c) => c.uid === uid);
    if (has && !u.cards.some((c) => c.uid === giveUid)) return u;
    const cards = u.cards.filter((c) => c.uid !== giveUid);
    if (!has) cards.push({ ...got, uid });
    const { [giveUid]: _gone, ...plays } = u.plays;
    return {
        ...u,
        cards,
        plays,
        locked: u.locked.filter((x) => x !== giveUid),
        team: { ...u.team, order: u.team.order.filter((x) => x !== giveUid) },
    };
}

/** Quantas vezes por dia cada um pode, dado o que já fez (servidor e tela usam a mesma conta). */
export const canPropose = (open: number, doneToday: number, pairToday: number) =>
    open < TRADE.openMax && doneToday < TRADE.perDay && pairToday < TRADE.perPairDay;

// ---------------------------------------------------------------------------------------------------- ranking

/** O time inscrito no ranking tem que sair de cartas que existem no save da nuvem (mesma espécie, brilho, edição). */
export function recipeMatchesSave(
    recipe: Pick<DuelTeamRecipe, 'lineup' | 'bench'>,
    cards: readonly unknown[],
): string[] {
    const pool = cards.filter((c): c is PokemonInstance => !!c && typeof c === 'object');
    const used = new Set<number>();
    const out: string[] = [];
    [...recipe.lineup, ...recipe.bench].forEach((m: DuelMonRecipe, i) => {
        const at = pool.findIndex(
            (c, j) =>
                !used.has(j) &&
                c.speciesId === m.speciesId &&
                !!c.shiny === !!m.shiny &&
                (c.special?.kind ?? null) === (m.special?.kind ?? null) &&
                (c.evolved ?? 0) === (m.evolved ?? 0),
        );
        if (at < 0) out.push(`#${i + 1}: carta ${m.speciesId} não está no save da nuvem`);
        else used.add(at);
    });
    return out;
}

/** Pontos de uma partida do ranking: vitória e nível mandam; derrota em nível alto ainda dá 1. */
export const RANK_POINTS: Record<Level, Record<Outcome, number>> = {
    facil: { win: 2, draw: 1, loss: 0 },
    normal: { win: 3, draw: 1, loss: 0 },
    dificil: { win: 4, draw: 2, loss: 1 },
    mestre: { win: 6, draw: 3, loss: 1 },
};
/** Teto de partidas do ranking por dia (ninguém precisa de mais para chegar ao topo; segura robô e farm). */
export const RANK_DAILY_MAX = 20;
export const rankPoints = (level: Level, outcome: Outcome) => RANK_POINTS[level][outcome];
