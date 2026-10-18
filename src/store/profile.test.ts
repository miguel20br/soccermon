import { describe, expect, it } from 'vitest';
import { SPECIES } from '../engine/data';
import type { PlayerLine } from '../engine/match-stats';
import {
    albumSlots,
    CLUB_COLORS,
    colorDistance,
    EDITION_BIT,
    editionBits,
    hasSticker,
    isPlayed,
    markSeen,
    mergeDex,
    recordEditions,
    recordMatchInDex,
    recordMovesSeen,
    recordTitleInDex,
    rivalColor,
    tagFromName,
} from './profile';

const line = (p: Partial<PlayerLine> & { speciesId: number }): PlayerLine =>
    ({
        uid: `u${p.speciesId}`,
        idx: 0,
        team: 0,
        name: '',
        role: 'ALA',
        rating: 7,
        distance: 0,
        minutes: 40,
        energy: 1,
        goalsAgainst: 0,
        ...p,
        stats: { goals: 0, assists: 0, ...p.stats },
    }) as PlayerLine;

describe('Pokédex', () => {
    it('visto não vira jogou; jogou exige 1 minuto pelo seu time', () => {
        let dex = markSeen({}, [1, 4]);
        expect(isPlayed(dex[1])).toBe(false);
        dex = recordMatchInDex(
            dex,
            [
                line({ speciesId: 1, minutes: 12, stats: { goals: 2 } as PlayerLine['stats'] }),
                line({ speciesId: 4, minutes: 0 }),
                line({ speciesId: 7, team: 1 }),
            ],
            true,
        );
        expect(dex[1]).toMatchObject({ matches: 1, minutes: 12, goals: 2, wins: 1, bestRating: 7 });
        expect(isPlayed(dex[4])).toBe(false);
        expect(dex[7]).toBeDefined();
        expect(isPlayed(dex[7])).toBe(false);
    });

    it('duas passagens do mesmo Pokémon contam como uma partida', () => {
        const dex = recordMatchInDex(
            {},
            [line({ speciesId: 25, minutes: 10 }), line({ speciesId: 25, minutes: 5 })],
            false,
        );
        expect(dex[25]).toMatchObject({ matches: 1, minutes: 15, wins: 0 });
    });

    it('título só para quem jogou', () => {
        let dex = recordMatchInDex({}, [line({ speciesId: 150 })], true);
        dex = markSeen(dex, [151]);
        dex = recordTitleInDex(dex, [150, 150, 151]);
        expect(dex[150].titles).toBe(1);
        expect(dex[151].titles).toBe(0);
    });

    it('junção da nuvem fica com o maior de cada número', () => {
        const a = recordMatchInDex({}, [line({ speciesId: 1, minutes: 30 })], true);
        const b = markSeen(recordMatchInDex({}, [line({ speciesId: 1, minutes: 5, rating: 9 })], false), [2]);
        const m = mergeDex(a, b);
        expect(m[1]).toMatchObject({ minutes: 30, bestRating: 9, wins: 1 });
        expect(m[2]).toBeDefined();
    });

    it('golpes vistos contam golpes e chutes com golpe', () => {
        const moves = recordMovesSeen({ ember: 1 }, {
            events: [
                { type: 'move', moveId: 'ember' },
                { type: 'shot', moveId: 'thunderbolt' },
                { type: 'shot', moveId: null },
                { type: 'transform' },
            ],
        } as never);
        expect(moves).toEqual({ ember: 2, thunderbolt: 1, transform: 1 });
    });
});

describe('álbum de edições', () => {
    it('carta sem edição é Normal; shiny e edição especial somam as duas figurinhas', () => {
        expect(editionBits({ shiny: false })).toBe(EDITION_BIT.normal);
        expect(editionBits({ shiny: true })).toBe(EDITION_BIT.shiny);
        expect(editionBits({ shiny: true, special: { kind: 'evento' } })).toBe(EDITION_BIT.shiny | EDITION_BIT.evento);
        expect(editionBits({ shiny: false, special: { kind: 'destaque' } })).toBe(EDITION_BIT.destaque);
    });

    it('cola só em quem jogou e nunca descola', () => {
        let dex = markSeen(recordMatchInDex({}, [line({ speciesId: 25 })], true), [26]);
        dex = recordEditions(dex, [
            [25, EDITION_BIT.shiny],
            [26, EDITION_BIT.normal],
        ]);
        dex = recordEditions(dex, [[25, EDITION_BIT.normal]]);
        expect(dex[25].editions).toBe(EDITION_BIT.shiny | EDITION_BIT.normal);
        expect(hasSticker(dex[26], 'normal')).toBe(false);
        // nada novo: devolve o mesmo objeto
        expect(recordEditions(dex, [[25, EDITION_BIT.shiny]])).toBe(dex);
    });

    it('Ícone só nos 20 da lista e Evento só com tipo de evento: o álbum não tem figurinha impossível', () => {
        expect(albumSlots({ id: 25, types: ['Electric'] })).toEqual(['normal', 'shiny', 'evento', 'icone', 'destaque']);
        expect(albumSlots({ id: 147, types: ['Dragon'] })).toEqual(['normal', 'shiny', 'destaque']);
        const total = SPECIES.reduce((n, sp) => n + albumSlots(sp).length, 0);
        expect(total).toBeGreaterThan(151 * 3);
        expect(total).toBeLessThan(151 * 5);
    });

    it('nuvem junta as figurinhas com OU (o maior perderia a de um lado)', () => {
        const base = recordMatchInDex({}, [line({ speciesId: 1 })], true);
        const a = recordEditions(base, [[1, EDITION_BIT.shiny]]); // 2
        const b = recordEditions(base, [[1, EDITION_BIT.normal | EDITION_BIT.evento]]); // 5
        expect(mergeDex(a, b)[1].editions).toBe(EDITION_BIT.shiny | EDITION_BIT.normal | EDITION_BIT.evento);
        expect(mergeDex(base, b)[1].editions).toBe(b[1].editions);
        expect(mergeDex(base, base)[1].editions).toBeUndefined();
    });
});

describe('clube', () => {
    it('sigla vem do nome', () => {
        expect(tagFromName('Pallet FC')).toBe('PAL');
        expect(tagFromName('Ó')).toBe('OXX');
        expect(tagFromName('!!')).toBe('SOC');
    });

    it('rival com cor parecida usa uniforme reserva', () => {
        for (const c of CLUB_COLORS) {
            expect(colorDistance(c.hex, rivalColor(c.hex, c.hex))).toBeGreaterThanOrEqual(110);
        }
        expect(rivalColor(0xe8423f, 0x3a8ee6)).toBe(0x3a8ee6);
    });
});
