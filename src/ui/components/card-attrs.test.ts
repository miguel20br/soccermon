import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCry: () => {} }));
// a dica abre num portal (precisa do document)
vi.mock('./Tip', async () => {
    const { createElement: h } = await import('react');
    return { Tip: ({ children }: { children: unknown }) => h('span', null, children as never) };
});

import type { AttrKey } from '../../engine/attributes';
import { evolveInstance } from '../../engine/evolution';
import { createInstance, instanceBase, type PokemonInstance } from '../../engine/instance';
import { applyModifiers, attributeModifiers, CARD_MAX } from '../../engine/modifiers';
import { Rng } from '../../engine/rng';
import { ICONS } from '../../engine/specials';
import { dict } from '../../i18n';
import { PokeCard2 } from './PokeCard2';

const sample = (id: number, extra: Partial<PokemonInstance> = {}): PokemonInstance => ({
    ...createInstance(id, new Rng(`carta-campo-${id}`)),
    shiny: false,
    item: null,
    ...extra,
});
const karp = sample(129, { ability: 'swiftswim' });
const CASES: [string, PokemonInstance][] = [
    ['Magikarp com Swift Swim (habilidade)', karp],
    ['Gyarados que evoluiu (evolução + habilidade)', evolveInstance(karp, 130)],
    ['Gyarados do pacote (sem bônus)', sample(130)],
    ['Mewtwo Shiny Ícone (edição)', sample(150, { shiny: true, special: { kind: 'icone', title: ICONS[150] } })],
    ['Clefairy com Choice Band (Fada + item)', sample(35, { item: 'choiceband' })],
    ['Rapidash com Run Away (passa de 99 em campo)', sample(78, { ability: 'runaway' })],
];

const ATTR_OF = Object.fromEntries(
    Object.entries(dict('pt').common.attrShort).map(([k, label]) => [label, k as AttrKey]),
) as Record<string, AttrKey>;

/** Os atributos da carta Metal: rótulo → número e ▲/▼. */
function shown(inst: PokemonInstance) {
    const html = renderToStaticMarkup(createElement(PokeCard2, { inst, variant: 'metal' })).replace(/<!-- -->/g, '');
    const stats = html.slice(html.indexOf('m-stats'));
    const out: Partial<Record<AttrKey, { v: number; mod: number }>> = {};
    for (const m of stats.matchAll(/<b>(\d+)<\/b><i>([^<]+)<\/i>(?:<em[^>]*>([▲▼])(\d+)<\/em>)?/g)) {
        out[ATTR_OF[m[2]]] = { v: Number(m[1]), mod: m[3] ? (m[3] === '▲' ? 1 : -1) * Number(m[4]) : 0 };
    }
    return out;
}

describe('carta = campo: o número do atributo é o que vale em campo e o ▲ quanto disso é bônus', () => {
    it.each(CASES)('%s', (_, inst) => {
        // a mesma conta do motor (createPlayer em match.ts), sem o que vem do time
        const base = instanceBase(inst);
        const field = applyModifiers(base, attributeModifiers(inst));
        const stats = Object.entries(shown(inst)) as [AttrKey, { v: number; mod: number }][];
        expect(stats.length).toBeGreaterThanOrEqual(6);
        for (const [k, s] of stats) {
            expect(s.v, k).toBe(Math.min(CARD_MAX, Math.round(field[k])));
            expect(s.mod, k).toBe(Math.round(field[k]) - Math.round(base[k]));
        }
    });

    it('a galeria: Magikarp "79 ▲6" em VEL, Gyarados que evoluiu com ▲ e o do pacote sem', () => {
        expect(shown(karp).pace).toEqual({ v: 79, mod: 6 });
        expect(Object.values(shown(evolveInstance(karp, 130))).some((s) => s.mod > 0)).toBe(true);
        expect(Object.values(shown(sample(130))).every((s) => s.mod === 0)).toBe(true);
    });
});

describe('a carta para em 99', () => {
    it('Rapidash com Run Away: 101 em campo, 99 na carta, ▲ com o bônus inteiro', () => {
        const rapidash = sample(78, { ability: 'runaway' });
        const field = applyModifiers(instanceBase(rapidash), attributeModifiers(rapidash));
        expect(Math.round(field.pace)).toBeGreaterThan(CARD_MAX);
        expect(shown(rapidash).pace?.v).toBe(CARD_MAX);
    });
});
