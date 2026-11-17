import { describe, expect, it } from 'vitest';
import { FORMATIONS } from '../../engine/formations';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { chemistry, chemTotal, diamondsOf } from './chemistry';

const card = (id: number, uid = `c${id}`): PokemonInstance => ({ ...createInstance(id, new Rng('q', uid)), uid });
const roles = FORMATIONS['1-2-1'].slots;

describe('losangos de química', () => {
    it('0% = 0; até +3% = 1; até +6% = 2; acima = 3', () => {
        expect([1, 0.93, 1.03, 1.04, 1.06, 1.07, 1.2].map(diamondsOf)).toEqual([0, 0, 1, 2, 2, 3, 3]);
    });

    it('o X/15 é a soma dos losangos dos titulares', () => {
        // Time do Ash (+5%): Pikachu, Charizard, Lapras e Snorlax com 2 cada; o Gengar fica sem
        const ch = chemistry([card(25), card(6), card(131), card(143), card(94)], roles);
        expect(ch.players.map((p) => diamondsOf(p.chem))).toEqual([2, 2, 2, 2, 0]);
        expect(chemTotal(ch)).toBe(8);
    });
});
