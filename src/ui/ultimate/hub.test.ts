import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('zzfx', () => ({ zzfx: () => undefined, ZZFX: {} }));
vi.mock('phaser', () => ({ default: {} }));
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
// o momento do pacote abre num portal (precisa do document): aqui ele desenha no lugar
vi.mock('react-dom', async (orig) => ({ ...(await orig<typeof import('react-dom')>()), createPortal: (n: unknown) => n }));

import { useGame } from '../../store/game-store';
import { newUltimate } from '../../store/ultimate/ultimate';
import { packActs, UtPackMoment } from './PackMoment';
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

/**
 * Retorno do Miguel (17/11): abrir 2 pacotes juntava tudo num resumão no fim. Cada pacote tem a sua abertura e o seu
 * resumo; Continuar abre o próximo (antes, os outros rasgavam sozinhos e o "Pular pro resumo" juntava tudo).
 */
describe('Abrir todos: um pacote de cada vez', () => {
    it('depois do leque: Continuar até o último, Guardar no último, nada enquanto o walkout toca', () => {
        expect(packActs(0, 2, false, false)).toBe('hint');
        expect(packActs(0, 2, true, false)).toBe('next');
        expect(packActs(1, 2, false, false)).toBe('wait');
        expect(packActs(1, 2, true, true)).toBe('wait');
        expect(packActs(1, 2, true, false)).toBe('keep');
        expect(packActs(0, 1, true, false)).toBe('keep');
    });

    it('a tela de 2 pacotes começa no 1º, sem o resumo de todos', () => {
        useGame.setState({ ultimate: { ...newUltimate('teste', Date.UTC(2026, 10, 9, 15)), bigPacks: 2 } });
        const r = useGame.getState().ultimateOpenMany('big');
        expect(r?.packs).toHaveLength(2);
        // o portal pede o document.body (o vi.mock do react-dom desenha no lugar)
        vi.stubGlobal('document', { body: null });
        const html = renderToStaticMarkup(
            createElement(UtPackMoment, {
                open: { ...r!, kind: 'big' },
                onClose: () => undefined,
                onPending: () => undefined,
            }),
        );
        vi.unstubAllGlobals();
        expect(html).toContain('1/2');
        // sem o botão de pular pro resumo de todos: antes de rasgar, só a dica
        expect(html).not.toContain('btn ghost small');
        expect(html).toContain('ut-tear-hint');
    });
});

