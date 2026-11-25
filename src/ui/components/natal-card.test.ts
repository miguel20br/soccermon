import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCry: () => {} }));
vi.mock('./Tip', async () => {
    const { createElement: h } = await import('react');
    return { Tip: ({ children }: { children: unknown }) => h('span', null, children as never) };
});

import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { NATAL_EVENT } from '../../engine/specials';
import { PokeCard2 } from './PokeCard2';

const card = (special: PokemonInstance['special']) =>
    renderToStaticMarkup(
        createElement(PokeCard2, {
            inst: { ...createInstance(144, new Rng('natal-144')), shiny: false, special },
            variant: 'metal',
        }),
    );

describe('carta do Evento de Natal', () => {
    it('desenha a edição de Natal no metal da nota, com a etiqueta Natal', () => {
        const html = card({ kind: 'evento', type: 'Ice', event: NATAL_EVENT });
        expect(html).toContain('pc2-natal');
        expect(html).toContain('nt-ouro');
        expect(html).toContain('nt-laco');
        expect(html).toContain('--nt-laco:url(');
        expect(html).toMatch(/>(Natal|Christmas)</);
        expect(html).not.toMatch(/Evento · Gelo|Event · Ice/);
    });

    it('a carta Evento de Gelo comum continua a de sempre', () => {
        const html = card({ kind: 'evento', type: 'Ice' });
        expect(html).not.toContain('pc2-natal');
        expect(html).not.toContain('--nt-');
        expect(html).toMatch(/Evento · Gelo|Event · Ice/);
    });
});
