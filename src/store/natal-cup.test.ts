import { describe, expect, it } from 'vitest';
import { buildCupOpponents } from '../engine/cup';
import { dailyDay, dailyEventType } from './daily';
import { isNatalCup, natalCupWon, natalOpponents } from './natal-cup';

describe('Copa de Natal', () => {
    it('vale só em 24 e 25/12 pelo dia de Brasília (relógio injetado)', () => {
        const day = (iso: string) => dailyDay(new Date(iso));
        expect(isNatalCup(day('2026-12-24T00:00:00-03:00'), false)).toBe(true);
        expect(isNatalCup(day('2026-12-25T23:59:00-03:00'), false)).toBe(true);
        expect(isNatalCup(day('2026-12-23T23:59:00-03:00'), false)).toBe(false);
        expect(isNatalCup(day('2026-12-26T00:00:00-03:00'), false)).toBe(false);
        expect(dailyEventType('2026-12-24')).toBe('Ice');
    });
    it('rivais de Gelo e Snorlax capitão na final, igual pra todo mundo', () => {
        const seed = 'dia-20261224';
        const opps = natalOpponents(buildCupOpponents(seed), seed);
        expect(opps).toHaveLength(4);
        expect(opps[3].lineup.map((p) => p.speciesId).sort((a, b) => a - b)).toEqual([87, 91, 131, 143, 144]);
        const cap = opps[3].lineup.find((p) => p.uid === opps[3].captainUid);
        expect(cap?.speciesId).toBe(143);
        expect(opps.every((o) => o.lineup.length === 5 && o.bench.length === 2)).toBe(true);
        expect(natalOpponents(buildCupOpponents(seed), seed)).toEqual(opps);
    });
    it('título só ganhando os dois dias', () => {
        expect(natalCupWon([{ day: '2026-12-24', champion: true }])).toBe(false);
        expect(
            natalCupWon([
                { day: '2026-12-24', champion: true },
                { day: '2026-12-25', champion: true },
            ]),
        ).toBe(true);
    });
});
