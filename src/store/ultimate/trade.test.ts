import { describe, expect, it } from 'vitest';
import { type DuelTeamRecipe, teamRecipe } from '../../engine/duel-validate';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import {
    applyTrade,
    canPropose,
    RANK_POINTS,
    rankPoints,
    recipeMatchesSave,
    tradeBlock,
    tradedUid,
    tradeProblems,
} from './trade';
import { newUltimate } from './ultimate';

const card = (speciesId: number, uid: string, level = 50) => ({
    ...createInstance(speciesId, new Rng('t', 'c'), level),
    uid,
});

const save = () => ({ ...newUltimate('s', 0), cards: [card(25, 'a'), card(1, 'b'), card(4, 'c')] });

describe('troca', () => {
    it('bloqueia carta no time, trancada ou que não existe', () => {
        const u = save();
        expect(tradeBlock(u, 'a')).toBeNull();
        expect(tradeBlock(u, 'zz')).toBe('sem_carta');
        expect(tradeBlock({ ...u, team: { ...u.team, order: ['a'] } }, 'a')).toBe('no_time');
        expect(tradeBlock({ ...u, locked: ['a'] }, 'a')).toBe('trancada');
    });

    it('recusa troca com nota muito diferente e a mesma carta', () => {
        const hi = card(150, 'x', 80);
        const lo = card(10, 'y', 5);
        expect(tradeProblems(hi, lo).join()).toMatch(/nota|mesma/);
        expect(tradeProblems(hi, hi).join()).toContain('mesma carta');
        expect(tradeProblems(card(25, 'p'), card(25, 'q'))).toEqual([]);
    });

    it('aplica a troca sem duplicar quando repete', () => {
        const once = applyTrade(save(), 'a', card(7, 'zz'), 't1');
        expect(once.cards.map((c) => c.uid)).toEqual(['b', 'c', tradedUid('t1')]);
        expect(applyTrade(once, 'a', card(7, 'zz'), 't1')).toBe(once);
    });

    it('respeita os limites por dia', () => {
        expect(canPropose(0, 0, 0)).toBe(true);
        expect(canPropose(5, 0, 0)).toBe(false);
        expect(canPropose(0, 5, 0)).toBe(false);
        expect(canPropose(0, 0, 3)).toBe(false);
    });
});

describe('ranking', () => {
    const recipe = (cs: ReturnType<typeof card>[]): DuelTeamRecipe =>
        teamRecipe({
            name: 'T',
            color: 1,
            formation: '1-2-1',
            tactic: 'balanced',
            lineup: cs.slice(0, 5),
            bench: cs.slice(5),
            captainUid: null,
        });
    const cards = [1, 4, 7, 25, 39].map((id, i) => card(id, `k${i}`));

    it('aceita o time que sai do save e recusa carta que não está lá', () => {
        expect(recipeMatchesSave(recipe(cards), cards)).toEqual([]);
        expect(recipeMatchesSave(recipe([...cards.slice(0, 4), card(150, 'f')]), cards)).toHaveLength(1);
    });

    it('não conta a mesma carta duas vezes', () => {
        expect(recipeMatchesSave(recipe([...cards.slice(0, 4), card(25, 'dup')]), cards)).toHaveLength(1);
    });

    it('pontua vitória acima de empate acima de derrota em todo nível', () => {
        for (const l of Object.keys(RANK_POINTS) as (keyof typeof RANK_POINTS)[]) {
            expect(rankPoints(l, 'win')).toBeGreaterThan(rankPoints(l, 'draw'));
            expect(rankPoints(l, 'draw')).toBeGreaterThanOrEqual(rankPoints(l, 'loss'));
        }
    });
});
