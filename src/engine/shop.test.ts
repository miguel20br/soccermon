import { describe, expect, it } from 'vitest';
import { computeAttributes } from './attributes';
import { species } from './data';
import { createInstance } from './instance';
import { applyModifiers, attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { interestOf, packCards, rerollPrice, shopOffers, winEarnings } from './shop';
import { SPONSOR_IDS } from './sponsors';

const rng = new Rng('t', 'shop-test');
const team = [6, 9, 3, 25, 143].map((id) => createInstance(id, rng));

describe('economia do Mercado', () => {
    it('vitória: 5 + gols (até 3) + sem sofrer gol + juros do guardado', () => {
        expect(winEarnings(5, 0, 12).total).toBe(5 + 3 + 2 + 2);
        expect(winEarnings(1, 2, 0).total).toBe(6);
        expect(winEarnings(5, 1, 0, ['fanclube']).goals).toBe(5);
        expect(winEarnings(1, 1, 0, ['ssanne']).total).toBe(9);
    });

    it('juros: 1 a cada 5, até 3 (Cassino: até 5)', () => {
        expect(interestOf(4)).toBe(0);
        expect(interestOf(14)).toBe(2);
        expect(interestOf(40)).toBe(3);
        expect(interestOf(40, ['cassino'])).toBe(5);
    });

    it('trocar a vitrine sobe 1 a cada vez; a Creche dá a 1ª', () => {
        expect([0, 1, 2].map((n) => rerollPrice(n))).toEqual([2, 3, 4]);
        expect(rerollPrice(0, ['creche'])).toBe(0);
        expect(rerollPrice(1, ['creche'])).toBe(3);
    });
});

describe('vitrine', () => {
    const base = { seed: 's1', stage: 0, reroll: 0, team, sponsors: [], eventType: null, captain: team[0] };

    it('mesma copa, mesma vitrine; trocar muda', () => {
        expect(shopOffers(base)).toEqual(shopOffers(base));
        expect(shopOffers({ ...base, reroll: 1 })).not.toEqual(shopOffers(base));
    });

    it('2 Pokémon, pacote, item ou MT e um Patrocínio que você não tem', () => {
        const kinds = shopOffers(base).map((o) => o.kind);
        expect(kinds.filter((k) => k === 'pokemon')).toHaveLength(2);
        expect(kinds).toContain('pack');
        expect(kinds.some((k) => k === 'item' || k === 'tm')).toBe(true);
        const all = SPONSOR_IDS.filter((id) => id !== 'silph');
        expect(shopOffers({ ...base, sponsors: all }).find((o) => o.kind === 'sponsor')).toMatchObject({ id: 'silph' });
        const loja = shopOffers({ ...base, sponsors: ['loja'] }).filter((o) => o.kind === 'pokemon');
        expect(loja).toHaveLength(3);
    });

    it('pacote de tipo: só do tipo, sem repetir o time; Safari Zone abre 4', () => {
        for (const type of ['Fire', 'Ice', 'Ghost', 'Dragon']) {
            const cards = packCards('s1', 1, type, team, [], null);
            expect(cards.length).toBeGreaterThan(0);
            expect(cards.every((c) => species(c.speciesId).types.includes(type))).toBe(true);
            expect(cards.some((c) => team.some((t) => t.speciesId === c.speciesId))).toBe(false);
        }
        expect(packCards('s1', 1, 'Water', team, ['safari'], null)).toHaveLength(4);
    });
});

describe('Patrocínios de campo (carta = campo)', () => {
    const [charizard, blastoise] = team;
    const field = (sponsors: string[], role: 'ALA' | 'FIXO' | 'PIVO' | 'GK', who = blastoise) =>
        applyModifiers(
            computeAttributes(species(who.speciesId), who.level),
            attributeModifiers(who, { lineup: team, captain: charizard, role, sponsors }),
            role,
        );

    it('sem Patrocínio, nada muda', () => {
        expect(field([], 'ALA')).toEqual(field(['fanclube', 'cassino'], 'ALA'));
    });

    it('Bicicletaria só nos Alas; Torcida nos Fixos e Goleiro; Academia em todos', () => {
        expect(field(['bicicletaria'], 'ALA').pace).toBeGreaterThan(field([], 'ALA').pace);
        expect(field(['bicicletaria'], 'PIVO').pace).toBe(field([], 'PIVO').pace);
        expect(field(['torcida'], 'FIXO').strength).toBeGreaterThan(field([], 'FIXO').strength);
        expect(field(['torcida'], 'ALA').strength).toBe(field([], 'ALA').strength);
        expect(field(['academia'], 'PIVO').passing).toBeGreaterThan(field([], 'PIVO').passing);
    });

    it('Silph Co. só pro tipo do capitão; Master cresce com os outros Patrocínios', () => {
        expect(field(['silph'], 'ALA')).toEqual(field([], 'ALA'));
        const mods = (sponsors: string[]) =>
            attributeModifiers(charizard, { lineup: team, captain: charizard, role: 'PIVO', sponsors }).find(
                (m) => m.source === 'patrocinio',
            )?.add;
        expect(mods(['silph'])).toBe(3);
        expect(mods(['master'])).toBe(2);
        expect(mods(['master', 'loja', 'creche'])).toBe(4);
    });
});
