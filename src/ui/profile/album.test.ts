import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCry: () => {} }));
// a dica abre num portal (precisa do document): aqui ela vira um atributo pra conferir o texto
vi.mock('../components/Tip', async () => {
    const { createElement: h } = await import('react');
    return {
        Tip: ({ text, children }: { text: string; children: unknown }) =>
            h('span', { 'data-tip': text }, children as never),
    };
});
// o render do servidor lê o estado inicial da store (zustand): aqui as telas leem o estado do teste
const state: Record<string, unknown> = {};
vi.mock('../../store/game-store', async (orig) => ({
    ...(await orig<object>()),
    useGame: Object.assign((sel: (s: unknown) => unknown) => sel(state), { getState: () => state }),
}));

import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { binderAdd } from '../../store/binder';
import { DEFAULT_PROFILE, EDITION_BIT } from '../../store/profile';
import { DexTab } from './DexTab';
import { SpeciesSheet } from './SpeciesSheet';

const entry = { matches: 3, minutes: 30, goals: 0, assists: 0, wins: 1, titles: 0, bestRating: 7, bestOvr: 70 };
// Lapras (5 espaços: Normal, Shiny, Evento, Ícone, Destaque) com Normal, Shiny e Evento; Bulbasaur só com a Normal
const dex = {
    131: { ...entry, editions: EDITION_BIT.normal | EDITION_BIT.shiny | EDITION_BIT.evento },
    1: { ...entry, editions: EDITION_BIT.normal },
};
const rng = new Rng('album-ui');
/** Sem os separadores <!-- --> que o render do servidor põe entre textos. */
const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<!-- -->/g, '');
const binder = binderAdd([], [{ ...createInstance(131, rng), uid: 'lap', shiny: true }], { from: 'draft', at: 1 });

describe('figurinhas na Pokédex e na ficha (a mesma conta: hasSticker)', () => {
    it('grade: "3/5" com a dica dizendo quais tem e quais faltam (as bolinhas só acendiam a Normal)', () => {
        Object.assign(state, { dex, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(DexTab));
        const cell = (no: string) =>
            html.slice(html.indexOf(`>${no}<`), html.indexOf('</button>', html.indexOf(`>${no}<`)));
        const lapras = cell('131');
        expect(lapras).toMatch(/3\/5/);
        expect(lapras).toContain('tem Normal, Shiny, Evento; faltam Ícone, Destaque');
        expect(cell('001')).toMatch(/1\/4/);
    });

    it('ficha: a figurinha Shiny é a carta shiny; a Evento colada sem carta guardada vira a carta padrão', () => {
        Object.assign(state, { dex, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(SpeciesSheet, { id: 131, order: [131], onNav() {}, onClose() {} }));
        const yours = html.slice(html.indexOf('al-yours'), html.indexOf('al-best'));
        const cells = yours.split('class="al-cell').slice(1);
        // ordem: Shiny, Evento, Ícone, Destaque (a Normal fica no fim, como figurinha pequena)
        expect(cells.map((c) => c.startsWith(' got'))).toEqual([true, true, false, false]);
        expect(cells[0]).toContain('is-shiny');
        expect(cells[0]).toContain('shiny/131');
        expect(cells[1]).toContain('ed-evento');
    });
});
