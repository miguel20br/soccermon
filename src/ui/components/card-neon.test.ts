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
// com a Semana Fora da Lei ligada (nos testes o tema fica desligado)
vi.mock('../tema', async (orig) => ({ ...(await orig<typeof import('../tema')>()), tema: 'neon', neonOn: true }));

import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { ESPECIAL_SPECIES } from '../../engine/specials';
import { PokeCard2 } from './PokeCard2';

const card = (special: PokemonInstance['special']) =>
    renderToStaticMarkup(
        createElement(PokeCard2, {
            inst: { ...createInstance(ESPECIAL_SPECIES[0], new Rng('neon')), special },
            variant: 'metal',
        }),
    );

describe('fundo neon da Semana Fora da Lei', () => {
    it('só a carta Evento Fora da Lei; a comum da lista e a Evento de tipo ficam normais', () => {
        expect(card(null)).not.toContain('pc2-neon');
        expect(card({ kind: 'evento', type: 'Fighting' })).not.toContain('pc2-neon');
        expect(card({ kind: 'evento', event: 'especial' })).toContain('pc2-neon');
    });
});
