import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from './config';
import { species } from './data';
import { createInstance, type PokemonInstance, viewInstance } from './instance';
import { Rng } from './rng';
import {
    cardTypeOf,
    ESPECIAL_EVENT,
    ESPECIAL_SPECIES,
    EVENT_CHANCE,
    rollSpecial,
    SPECIAL_BONUS,
    specialBonus,
    themeTypeOf,
} from './specials';

describe('Semana Fora da Lei: Evento por lista de espécies', () => {
    it('a lista aprovada (14 espécies, ids da Dex)', () => {
        expect(ESPECIAL_SPECIES.map((id) => species(id).name)).toEqual([
            'Hitmonchan',
            'Hitmonlee',
            'Machamp',
            'Blastoise',
            'Persian',
            'Meowth',
            'Arbok',
            'Weezing',
            'Electrode',
            'Rapidash',
            'Gyarados',
            'Scyther',
            'Kingler',
            'Primeape',
        ]);
    });

    it('só a lista ganha Evento, com a chance de sempre e a marca do evento (sem tipo)', () => {
        const rng = new Rng('fora-da-lei');
        let n = 0;
        let hits = 0;
        for (const id of ESPECIAL_SPECIES)
            for (let i = 0; i < 1500; i++) {
                const s = rollSpecial(createInstance(id, rng), ESPECIAL_EVENT).special;
                n++;
                if (s?.kind === 'evento') {
                    hits++;
                    expect(s).toEqual({ kind: 'evento', event: ESPECIAL_EVENT });
                }
            }
        expect(Math.abs(hits / n - EVENT_CHANCE)).toBeLessThan(0.015);
        // fora da lista (Machoke, Charizard, Pikachu, Bulbasaur), nunca Evento
        for (const id of [67, 6, 25, 1])
            for (let i = 0; i < 1500; i++)
                expect(rollSpecial(createInstance(id, rng), ESPECIAL_EVENT).special?.kind).not.toBe('evento');
    });

    it('na semana do tipo a lista não vale: Lutador sai Evento de tipo, Persian (Normal) não', () => {
        const rng = new Rng('tipo');
        let fighting = 0;
        for (let i = 0; i < 2000; i++) {
            const s = rollSpecial(createInstance(68, rng), 'Fighting').special;
            if (s?.kind === 'evento') {
                fighting++;
                expect(s).toEqual({ kind: 'evento', type: 'Fighting' });
            }
            expect(rollSpecial(createInstance(53, rng), 'Fighting').special?.kind).not.toBe('evento');
        }
        expect(fighting).toBeGreaterThan(150);
    });

    it('determinístico: a mesma carta (seed/uid) dá sempre o mesmo resultado', () => {
        const a = Array.from({ length: 400 }, (_, i) => createInstance(ESPECIAL_SPECIES[i % 14], new Rng(`s${i}`)));
        const b = Array.from({ length: 400 }, (_, i) => createInstance(ESPECIAL_SPECIES[i % 14], new Rng(`s${i}`)));
        expect(a.map((x) => rollSpecial(x, ESPECIAL_EVENT))).toEqual(b.map((x) => rollSpecial(x, ESPECIAL_EVENT)));
    });

    it('mesmo bônus da carta Evento de tipo; a carta antiga de `type` continua igual', () => {
        const base = createInstance(68, new Rng('m'));
        const plain = viewInstance({ ...base, special: null }).attributes;
        const novo: PokemonInstance = { ...base, special: { kind: 'evento', event: ESPECIAL_EVENT } };
        const antigo: PokemonInstance = { ...base, special: { kind: 'evento', type: 'Fire', level: 1 } };
        expect(specialBonus(novo)).toBe(SPECIAL_BONUS);
        expect(viewInstance(novo).attributes.pace - plain.pace).toBe(SPECIAL_BONUS);
        expect(specialBonus(antigo)).toBe(SPECIAL_BONUS + 1);
        // a antiga pinta com o tipo do evento; a nova usa o tipo da espécie (o fundo do tema vem por cima)
        expect([cardTypeOf(antigo), themeTypeOf(antigo)]).toEqual(['Fire', 'Fire']);
        expect([cardTypeOf(novo), themeTypeOf(novo)]).toEqual(['Fighting', 'Fighting']);
    });

    it('motor 31 (Duelo e Liga precisam da carta nova)', () => {
        expect(ENGINE_VERSION).toBe(31);
    });
});
