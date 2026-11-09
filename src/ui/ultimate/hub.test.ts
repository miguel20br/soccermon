import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('zzfx', () => ({ zzfx: () => undefined, ZZFX: {} }));
vi.mock('phaser', () => ({ default: {} }));
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { useGame } from '../../store/game-store';
import { newUltimate } from '../../store/ultimate/ultimate';
import { Play } from './Play';
import { Ultimate } from './Ultimate';

/** A aba que nasce acesa na barra de baixo. */
const selectedTab = () => {
    const html = renderToStaticMarkup(createElement(Ultimate));
    return /id="ut-tab-(\w+)" aria-selected="true"/.exec(html)?.[1];
};

/**
 * Retorno do Miguel (09/11, "por que o time ultimate tá abrindo na loja?"): sem cartas (save novo, o Pick do primeiro
 * craque guardado) o modo abria na Loja. Entra sempre no Início; o destaque e o número na aba avisam dos pacotes.
 */
describe('Time Ultimate abre no Início', () => {
    it('save novo, sem cartas e com o Pick guardado', () => {
        const u = newUltimate('teste', Date.UTC(2026, 10, 9, 15));
        expect(u.cards).toHaveLength(0);
        useGame.setState({ ultimate: u });
        expect(selectedTab()).toBe('home');
    });
});

describe('aba Jogar', () => {
    it('Batalhas de Treinador liberado; Rivais, Elite dos Quatro, Draft e Montagem trancados e sem botão', () => {
        useGame.setState({ ultimate: newUltimate('teste', Date.UTC(2026, 10, 9, 15)) });
        const html = renderToStaticMarkup(createElement(Play, { onPacks: () => undefined }));
        const cards = html.split('<section').slice(1);
        expect(cards).toHaveLength(5);
        expect(cards[0]).toContain('is-battles');
        expect(cards[0]).toContain('<button');
        for (const c of cards.slice(1)) {
            expect(c).toContain('is-locked');
            expect(c.split('</section>')[0]).not.toContain('<button');
        }
    });
});
