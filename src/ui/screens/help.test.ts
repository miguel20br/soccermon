import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { pt } from '../../i18n/pt';
import { faqEntries, helpSections } from '../help/content';
import { Help } from './Help';

const RULES = ['posicoes', 'cartas', 'tipos', 'sinergias', 'partida', 'golpes', 'status', 'golpeMax', 'evolucao'];

describe('Ajuda enxuta (menos-e-mais.md, A2 e A3)', () => {
    it('só as regras que não estão na tela nem nos balões, iguais em PT e EN', () => {
        for (const lang of ['pt', 'en'] as const) {
            expect(new Set(helpSections(lang).map((s) => s.id))).toEqual(new Set(RULES));
            expect(faqEntries(lang)).toHaveLength(6);
        }
    });

    it('"Como funciona" vem primeiro; o passo a passo de 4 slides saiu', () => {
        const out = renderToStaticMarkup(createElement(Help));
        expect(out.indexOf(pt.help.coach.replay.title)).toBeGreaterThan(-1);
        expect(out.indexOf(pt.help.coach.replay.title)).toBeLessThan(out.indexOf('help-search'));
        expect(out).not.toContain('passo a passo');
        expect(pt.help).not.toHaveProperty('onboarding');
    });
});
