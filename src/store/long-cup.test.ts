import { describe, expect, it } from 'vitest';
import { longOpponent } from '../engine/cup-map';
import { createInstance } from '../engine/instance';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import { longMatchBonus, longWinEarnings, lossColor, nodeOpponent, ROCKET_BOUNTY } from './long-cup';

describe('lossColor (barrinha da copa na Home)', () => {
    const rota = (status: string, stages: number[]) => ({
        mode: 'longa' as const,
        status,
        results: stages.map((stage) => ({ stage })),
    });
    it('derrota perdoada no mapa é amarela, não vermelha', () => {
        expect(lossColor(rota('map', [0]), 0)).toBe('yellow');
    });
    it('só a última derrota de quem foi eliminado é vermelha', () => {
        const run = rota('eliminated', [0, 1, 2]);
        expect(lossColor(run, 0)).toBe('yellow');
        expect(lossColor(run, 2)).toBe('red');
    });
    it('derrota no grupo não dá cartão: neutra', () => {
        expect(lossColor(rota('group', [5]), 5)).toBe('plain');
    });
    it('Copa rápida: derrota é sempre vermelha', () => {
        expect(lossColor({ status: 'eliminated', results: [{ stage: 1 }] }, 1)).toBe('red');
    });
});

describe('prêmio à vista e desafios (revisão da Rota)', () => {
    const team = [4, 7, 1, 25, 16, 19, 41].map((sp, i) => ({
        ...createInstance(sp, new Rng('t', `${i}`)),
        uid: `u${i}`,
    }));
    const rival = longOpponent('premio', 2, 'jogo', []);
    const defeated = { name: rival.name, players: [...rival.lineup, ...rival.bench] };
    const opts = (prize: 'pokemon' | 'tm' | 'item' | 'gym', ace?: number) =>
        rewardOptions('premio', 2, 0, team, defeated, 0, {
            key: 'r2c0',
            round: 3,
            prize,
            types: ['Water', 'Grass'],
            ace,
        });

    it('cada prêmio dá 3 do que promete; o Ginásio dá a carta do líder', () => {
        expect(opts('pokemon').map((r) => r.kind)).toEqual(['pokemon', 'pokemon', 'pokemon']);
        expect(opts('item').map((r) => r.kind)).toEqual(['item', 'item', 'item']);
        expect(opts('tm').filter((r) => r.kind === 'tm').length).toBeGreaterThan(0);
        const gym = opts('gym', 121);
        expect(gym[0]).toMatchObject({ kind: 'pokemon', inst: { speciesId: 121 } });
        expect(gym).toHaveLength(3);
        // sem prêmio (mapa de antes da revisão): a recompensa de sempre, com 1 Pokémon
        const old = rewardOptions('premio', 2, 0, team, defeated, 0, { key: 'r2c0', round: 3 });
        expect(old.filter((r) => r.kind === 'pokemon')).toHaveLength(1);
    });

    it('₽ em dobro, Equipe Rocket e aposta do Blue entram no ₽ da partida', () => {
        const map = {
            rows: 1,
            nodes: [{ id: 'a', row: 0, col: 0, kind: 'jogo' as const, next: [], prize: 'money' as const }],
        };
        expect(longMatchBonus({ map, at: 'a' }, [3, 1], true)).toEqual({ prize: longWinEarnings([3, 1]).total });
        expect(longMatchBonus({ map, at: 'a' }, [1, 3], false)).toEqual({});
        expect(longMatchBonus({ map, at: 'a', fight: 'rocket' }, [2, 1], true)).toEqual({ rocket: ROCKET_BOUNTY });
        expect(longMatchBonus({ bet: 6 }, [2, 0], true)).toEqual({ bet: 6 });
        expect(longMatchBonus({ bet: 6 }, [2, 1], true)).toEqual({ bet: -6 });
    });

    it('o desafio aparece na prévia do mapa: Equipe Rocket no lugar do rival, o Zapdos de titular', () => {
        const node = { id: 'r2c0', row: 2, col: 0, kind: 'jogo' as const, next: [] };
        const run = { seed: 'desafio', opponents: [] };
        expect(nodeOpponent({ ...run, challenge: 'rocket' }, node).name).toBe('Equipe Rocket');
        expect(nodeOpponent({ ...run, challenge: 'lendario' }, node).lineup.some((p) => p.speciesId === 145)).toBe(
            true,
        );
        expect(nodeOpponent(run, node).lineup.some((p) => p.speciesId === 145)).toBe(false);
    });
});
