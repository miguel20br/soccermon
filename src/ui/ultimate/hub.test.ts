import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('zzfx', () => ({ zzfx: () => undefined, ZZFX: {} }));
vi.mock('phaser', () => ({ default: {} }));
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
// o momento do pacote abre num portal (precisa do document): aqui ele desenha no lugar
vi.mock('react-dom', async (orig) => ({
    ...(await orig<typeof import('react-dom')>()),
    createPortal: (n: unknown) => n,
}));

import { existsSync } from 'node:fs';
import { useGame } from '../../store/game-store';
import { EVENTS, FIRST_PICK, GOLD_PICK, GYMS } from '../../store/ultimate/rules';
import { newUltimate, type UtPick } from '../../store/ultimate/ultimate';
import { packActs, UtPackMoment } from './PackMoment';
import { Play } from './Play';
import { packArt } from './pack-art';
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
    it('Batalhas de Treinador liberado; Montagem liberada; Rivais, Elite dos Quatro e Draft trancados e sem botão', () => {
        // produção: o Draft fica atrás da bandeira (ADR 0005)
        vi.stubGlobal('__SMOKE__', false);
        useGame.setState({ ultimate: newUltimate('teste', Date.UTC(2026, 10, 9, 15)) });
        const html = renderToStaticMarkup(createElement(Play, { onPacks: () => undefined }));
        const cards = html.split('<section').slice(1);
        expect(cards).toHaveLength(5);
        expect(cards[0]).toContain('is-battles');
        expect(cards[0]).toContain('<button');
        expect(cards[1]).toContain('is-sbc');
        expect(cards[1]).toContain('<button');
        for (const c of cards.slice(2)) {
            expect(c).toContain('is-locked');
            expect(c.split('</section>')[0]).not.toContain('<button');
        }
    });

    it('no dev e nas prévias o Draft abre (com botão); Rivais e Elite seguem trancados', () => {
        vi.stubGlobal('__SMOKE__', true);
        useGame.setState({ ultimate: newUltimate('teste', Date.UTC(2026, 10, 9, 15)) });
        const html = renderToStaticMarkup(createElement(Play, { onPacks: () => undefined }));
        const cards = html.split('<section').slice(1);
        const draft = cards.find((c) => c.includes('is-draft'))!;
        expect(draft).not.toContain('is-locked');
        expect(draft.split('</section>')[0]).toContain('<button');
        expect(cards.filter((c) => c.includes('is-locked'))).toHaveLength(2);
        vi.unstubAllGlobals();
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

describe('Loja: a arte de cada pacote', () => {
    it('todo pacote e todo Pick que pode aparecer tem o PNG em PT e EN', () => {
        const pick = (p: Partial<UtPick>): UtPick => ({ n: 3, min: 'prata', uid: 'x', from: 'shop', ref: '', ...p });
        const all = [
            packArt('mini'),
            packArt('big'),
            ...(['bronze', 'prata', 'ouro'] as const).map((m) => packArt(pick({ min: m, exact: true }))),
            packArt(pick({ ...FIRST_PICK, from: 'start' })),
            packArt(pick({ ...GOLD_PICK, from: 'pass' })),
            ...GYMS.map((g) =>
                packArt(pick({ from: 'gym', ref: g.id, type: g.rule.kind === 'type' ? g.rule.type : undefined })),
            ),
            ...EVENTS.flatMap((e) => (e.pick ? [packArt(pick({ ...e.pick, from: 'event', ref: e.id }))] : [])),
        ];
        const missing = ['pt', 'en'].flatMap((l) =>
            all.filter((a) => !existsSync(`public/assets/ui/pacotes/${l}/${a}.png`)).map((a) => `${l}/${a}`),
        );
        expect(missing).toEqual([]);
    });

    it('Abrir todos com Grande e Mini: cada pacote com o nome dele, não "N × Mini"', () => {
        useGame.setState({ ultimate: { ...newUltimate('teste', Date.UTC(2026, 10, 9, 15)), bigPacks: 1 } });
        const big = useGame
            .getState()
            .ultimateOpenMany('big')!
            .packs.map((p) => ({ ...p, kind: 'big' as const }));
        const mini = useGame
            .getState()
            .ultimateOpenMany('mini', 2)!
            .packs.map((p) => ({ ...p, kind: 'mini' as const }));
        vi.stubGlobal('document', { body: null });
        const html = renderToStaticMarkup(
            createElement(UtPackMoment, {
                open: { packs: [...big, ...mini], kind: 'mini', full: false },
                onClose: () => undefined,
                onPending: () => undefined,
            }),
        );
        vi.unstubAllGlobals();
        expect(html).toContain('1/3');
        expect(html).not.toContain('3 ×');
    });
});
