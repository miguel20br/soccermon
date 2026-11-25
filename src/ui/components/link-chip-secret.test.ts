import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { createInstance } from '../../engine/instance';
import { computeLinks } from '../../engine/links';
import { Rng } from '../../engine/rng';
import { helpSections } from '../help/content';
import { LinkChips } from './LinkChips';

// sinergia secreta do mesmo time (fase 2): o +N% aparece (carta = campo), o nome só depois de descoberta
describe('chip da sinergia secreta', () => {
    const rng = new Rng('chip-secreta');
    const links = computeLinks([113, 59, 19, 21, 98].map((id) => createInstance(id, rng)));
    const html = () => renderToStaticMarkup(createElement(LinkChips, { links }));

    it('"???" com o bônus até descobrir (perfil sem descobertas)', () => {
        expect(html()).toContain('???');
        expect(html()).toContain('+5%');
        expect(html()).not.toContain('Joy e Jenny');
        expect(html()).not.toContain('data-secret');
    });

    it('a ajuda não lista as secretas', () => {
        const text = JSON.stringify(helpSections('pt'));
        expect(text).toContain('Gênese');
        expect(text).not.toContain('Joy e Jenny');
        expect(text).not.toContain('Mestre e Aprendiz');
    });
});
