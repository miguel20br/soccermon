import { describe, expect, it } from 'vitest';
import { FORMATIONS } from '../../engine/formations';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { chemistry, chemTotal, chemWhy, diamondsOf } from './chemistry';

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

describe('por que da química (só lê o cálculo)', () => {
    it('história: a sinergia ativa, os parceiros e o que falta pouco', () => {
        const lineup = [card(25), card(6), card(131), card(143), card(94)];
        const ch = chemistry(lineup, roles);
        const pika = chemWhy(ch, lineup, 0);
        expect(pika.link.active.map((l) => l.def.id)).toEqual(['ash']);
        expect(pika.link.factor).toBeCloseTo(1.05);
        expect(pika.partners).toEqual(['c6', 'c131', 'c143']);
        // Charizard: a família dele está nas Iniciais, que falta pouco
        expect(chemWhy(ch, lineup, 1).link.near.map((n) => n.def.id)).toContain('iniciais');
        const gengar = chemWhy(ch, lineup, 4);
        expect(gengar.partners).toEqual([]);
        expect(gengar.diamonds).toBe(0);
        // sem tipo ligado: o próximo degrau é mais um do tipo (+3%)
        expect(gengar.type.syn).toBeNull();
        expect(gengar.type.next).toEqual({ count: 2, bonus: 1.03 });
    });

    it('tipo: a sinergia que vale, o degrau seguinte, e o produto bate com a química', () => {
        // Squirtle, Psyduck e Poliwag (Água x3) + Gengar e Haunter (Fantasma/Venenoso x2)
        const lineup = [card(7), card(54), card(60), card(94), card(93)];
        const ch = chemistry(lineup, roles);
        const sq = chemWhy(ch, lineup, 0);
        expect(sq.type.syn?.type).toBe('Water');
        expect(sq.type.factor).toBeCloseTo(1.06);
        expect(sq.type.next).toEqual({ count: 4, bonus: 1.08 });
        expect(sq.partners).toEqual(['c54', 'c60']);
        for (let i = 0; i < 5; i++) {
            const w = chemWhy(ch, lineup, i);
            expect(w.type.factor * w.link.factor).toBeCloseTo(ch.players[i].chem);
        }
    });
});
