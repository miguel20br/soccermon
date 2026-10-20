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
import { binderAdd, binderInst } from '../../store/binder';
import { DEFAULT_PROFILE, EDITION_BIT } from '../../store/profile';
import { AlbumView, rareVersions } from './Album';
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

    it('ficha sem cartas: só "Figurinhas 3/5 · Ver no álbum"', () => {
        Object.assign(state, { dex, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(
            createElement(SpeciesSheet, { id: 131, order: [131], onNav() {}, onClose() {}, onAlbum() {} }),
        );
        expect(html).toContain('pf-album-line');
        expect(html).toMatch(/Figurinhas <b>3\/5<\/b>/);
        expect(html).toContain('Ver no álbum');
        expect(html).not.toContain('class="pc2');
    });
});

describe('álbum (Panini com a carta de verdade)', () => {
    it('vazio: nome, silhueta e número ("???" só pra quem nunca viu); colada: a carta, inclusive a figurinha antiga', () => {
        // Blastoise com a Ícone de antes do álbum (sem carta guardada); Charizard visto sem a Ícone; Pikachu nunca visto
        const d2 = { ...dex, 9: { ...entry, editions: EDITION_BIT.icone }, 6: entry };
        Object.assign(state, { dex: d2, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(AlbumView, { onSheet() {} }));
        const slot = (no: string) => {
            const i = html.indexOf(`#${no}<`);
            return html.slice(html.lastIndexOf('<li', i), html.indexOf('</li>', i));
        };
        expect(slot('006')).toMatch(/<small>Charizard<\/small><img[^>]*src="[^"]*\/6\.gif/);
        expect(slot('006')).not.toContain('pc2');
        expect(slot('025')).toContain('<small>???</small>');
        expect(slot('009')).toContain('al-slot got');
        expect(slot('009')).toContain('class="pc2');
    });

    it('Raridades: só Shiny Ícone/Evento e selo 3', () => {
        const b = (...cards: Parameters<typeof binderAdd>[1]) => binderAdd([], cards, { from: 'draft', at: 1 });
        const ic = (extra: object) => ({
            ...createInstance(6, rng),
            uid: JSON.stringify(extra),
            shiny: false,
            special: { kind: 'icone' as const, title: 'Charizard Rebelde' },
            ...extra,
        });
        const all = b(
            ic({}),
            ic({ shiny: true }),
            ic({ special: { kind: 'icone', level: 3 } }),
            ic({ special: { kind: 'destaque', level: 2 } }),
            ic({ special: { kind: 'destaque', level: 3 } }),
            { ...createInstance(25, rng), uid: 'pk', shiny: true },
        );
        const got = rareVersions(all, () => true).map((v) => {
            const p = binderInst(v);
            return `${p.shiny ? 'Shiny ' : ''}${p.special?.kind} ${p.special?.level ?? ''}`.trim();
        });
        expect(got.sort()).toEqual(['Shiny icone', 'destaque 3', 'icone 3']);
    });
});
