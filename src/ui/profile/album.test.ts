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

import { species } from '../../engine/data';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { binderAdd } from '../../store/binder';
import { DEFAULT_PROFILE, EDITION_BIT, EMPTY_CAREER } from '../../store/profile';
import { AlbumView, frontRow, speciesRows } from './Album';
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
        Object.assign(state, {
            dex,
            binder,
            moves: {},
            settings: { cries: 0 },
            profile: DEFAULT_PROFILE,
            records: { cups: 0, titles: 0, perfect: 0 },
            career: EMPTY_CAREER,
            hall: [],
            run: null,
            parkedRuns: [],
            duels: [],
        });
        const html = render(
            createElement(SpeciesSheet, { id: 131, order: [131], onNav() {}, onClose() {}, onAlbum() {} }),
        );
        expect(html).toContain('pf-album-line');
        expect(html).toMatch(/Figurinhas <b>3\/5<\/b>/);
        expect(html).toContain('Ver no álbum');
        expect(html).not.toContain('class="pc2');
    });
});

describe('álbum (livro por geração, um espaço por Pokémon)', () => {
    it('vazio: nome, silhueta e número ("???" só pra quem nunca viu); colado: a carta da frente, inclusive a figurinha antiga', () => {
        // Blastoise com a Ícone de antes do álbum (sem carta guardada); Charizard visto sem figurinha; Caterpie nunca visto
        const d2 = { ...dex, 9: { ...entry, editions: EDITION_BIT.icone }, 6: { ...entry, editions: 0 } };
        Object.assign(state, { dex: d2, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(AlbumView, { at: { id: 1, n: 1 }, onSheet() {} }));
        const slot = (no: string) => {
            const i = html.indexOf(`#${no}<`);
            return html.slice(html.lastIndexOf('<li', i), html.indexOf('</li>', i));
        };
        expect(slot('006')).toMatch(/<small>Charizard<\/small><img[^>]*src="[^"]*\/6\.gif/);
        expect(slot('006')).not.toContain('pc2');
        expect(slot('010')).toContain('<small>???</small>');
        expect(slot('009')).toContain('al-slot got');
        expect(slot('009')).toContain('class="pc2');
        // Bulbasaur só com a Normal: a carta Normal colada, bolinha da Normal acesa
        expect(slot('001')).toContain('class="pc2');
        expect(slot('001')).toContain('al-dot al-dot-normal on');
    });

    it('fechado: a estante com a capa da Geração 1 (e a da 2 em breve)', () => {
        Object.assign(state, { dex, binder, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(AlbumView, { onSheet() {} }));
        expect(html).toContain('al-cover al-gen-1');
        expect(html).toContain('al-cover al-gen-2 soon');
        expect(html).not.toContain('al-pgrid');
    });

    it('versões da espécie: a Shiny Ícone uma vez só, da melhor pra pior, a Normal por último; a frente é a escolhida', () => {
        const ic = (uid: string, extra: object) => ({
            ...createInstance(6, rng),
            uid,
            shiny: false,
            special: { kind: 'icone' as const, title: 'Charizard Rebelde' },
            ...extra,
        });
        const b = binderAdd(
            [],
            [ic('a', {}), ic('b', { shiny: true }), { ...createInstance(6, rng), uid: 'c', shiny: true }],
            {
                from: 'draft',
                at: 1,
            },
        );
        const d6 = { 6: { ...entry, editions: EDITION_BIT.normal | EDITION_BIT.shiny | EDITION_BIT.icone } };
        const rows = speciesRows(species(6), d6, new Map(b.map((c) => [c.id, c])));
        const label = (r: (typeof rows)[number]) =>
            `${r.inst.shiny ? 'S' : ''}${r.inst.special?.kind ?? (r.id.endsWith(':normal') ? 'normal' : 'comum')}`;
        expect(rows.map(label)).toEqual(['Sicone', 'icone', 'Scomum', 'normal']);
        expect(frontRow(rows, undefined)).toBe(rows[0]);
        expect(frontRow(rows, rows[2].id)).toBe(rows[2]);
        expect(frontRow(rows, 'lixo')).toBe(rows[0]);
    });

    it('álbum cheio leve: abre só com a página à vista e uma carta inteira por espaço (as de trás são só a moldura)', () => {
        // as 151 espécies com Normal, Shiny e Evento (3 versões cada): antes abria 2 páginas com 3 cartas inteiras por espaço
        const r = new Rng('album-cheio');
        const all = Array.from({ length: 151 }, (_, i) => i + 1);
        const b = binderAdd(
            [],
            all.flatMap((id) => [
                { ...createInstance(id, r), uid: `s${id}`, shiny: true },
                { ...createInstance(id, r), uid: `e${id}`, shiny: false, special: { kind: 'evento' as const } },
            ]),
            { from: 'draft', at: 1 },
        );
        const full = Object.fromEntries(
            all.map((id) => [id, { ...entry, editions: EDITION_BIT.normal | EDITION_BIT.shiny | EDITION_BIT.evento }]),
        );
        Object.assign(state, { dex: full, binder: b, moves: {}, settings: { cries: 0 }, profile: DEFAULT_PROFILE });
        const html = render(createElement(AlbumView, { at: { id: 1, n: 1 }, onSheet() {} }));
        const slots = html.match(/class="al-slot/g)?.length ?? 0;
        const cards = html.match(/class="pc2 [^"]*"/g) ?? [];
        const whole = cards.filter((c) => !c.includes('pc2-bare')).length;
        expect(slots).toBe(12);
        expect(whole).toBe(12);
        expect(cards.length - whole).toBe(24);
    });
});
