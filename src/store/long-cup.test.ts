import { describe, expect, it } from 'vitest';
import { LONG_MATCHES, longOpponent } from '../engine/cup-map';
import { createInstance } from '../engine/instance';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import {
    creditsOn,
    longMatchBonus,
    longWinEarnings,
    nodeOpponent,
    paradeOn,
    ROCKET_BOUNTY,
    titleCeremony,
} from './long-cup';

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

describe('paradeOn e creditsOn (título: desfile só no raro, créditos uma vez)', () => {
    it('Rota sempre desfila; Relâmpago e Copa do Dia só no 1º título de cada', () => {
        expect(paradeOn({ mode: 'longa' }, { titles: 9, longTitles: 3 }, 2)).toBe(true);
        expect(paradeOn({}, { titles: 1 }, 0)).toBe(true);
        expect(paradeOn({}, { titles: 2 }, 0)).toBe(false);
        // o 1º da Relâmpago depois de títulos na Rota e no Dia ainda é o 1º dela
        expect(paradeOn({}, { titles: 4, longTitles: 2 }, 1)).toBe(true);
        expect(paradeOn({ daily: '2026-11-10' }, { titles: 5 }, 1)).toBe(true);
        expect(paradeOn({ daily: '2026-11-10' }, { titles: 5 }, 2)).toBe(false);
    });
    it('créditos só no 1º título da Rota', () => {
        // os créditos ficaram pro fim do Modo História: o 1º título da Rota não chama mais
        expect(creditsOn({ mode: 'longa' })).toBe(false);
        expect(creditsOn({})).toBe(false);
        expect(creditsOn({ mode: 'historia' })).toBe(true);
    });
});

describe('titleCeremony (a taça só no título)', () => {
    it('vitória fora da Final não tem cerimônia; a Final tem taça (Relâmpago) ou invasão (Rota)', () => {
        for (const stage of [0, 1, 2]) expect(titleCeremony({ stage })).toBeUndefined();
        expect(titleCeremony({ stage: 3 })).toBe('taca');
        for (let stage = 0; stage < LONG_MATCHES - 1; stage++)
            expect(titleCeremony({ mode: 'longa', stage })).toBeUndefined();
        expect(titleCeremony({ mode: 'longa', stage: LONG_MATCHES - 1 })).toBe('invasao');
        expect(titleCeremony(null)).toBeUndefined();
    });
});
