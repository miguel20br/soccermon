import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { chosenMode, type Mode, PlayBar, playModes, stepMode } from './PlayBar';

const noop = () => {};
const m = (id: Mode['id'], title: string, sub = ''): Mode => ({ id, title, sub, icon: 'next', go: noop });
const html = (main: Mode, sheet: Mode[], open: boolean) =>
    renderToStaticMarkup(createElement(PlayBar, { main, sheet, open, onOpen: noop, onPick: noop }));

/**
 * Retorno do Miguel (25/10, "mais parecido com Clash Royale"): a pílula do modo escolhido em cima do JOGAR, com setas
 * dos lados, que abre a lista de modos; o JOGAR dourado joga o que a pílula mostra.
 */
describe('JOGAR e pílula de modos do Estádio', () => {
    it('o padrão é a copa em andamento; senão o desafio do link; senão a Copa Relâmpago', () => {
        const base = { challenge: null, firstVisit: false };
        expect(playModes({ ...base, inProgress: false }).main).toBe('quick');
        expect(playModes({ ...base, inProgress: true }).main).toBe('continue');
        expect(playModes({ ...base, inProgress: false, challenge: 'ABC123' }).main).toBe('challenge');
        expect(playModes({ ...base, inProgress: true, challenge: 'ABC123' }).main).toBe('continue');
    });

    it('a lista tem os modos (Continuar só com copa em andamento)', () => {
        expect(playModes({ inProgress: false, challenge: null, firstVisit: false }).sheet).toEqual([
            'quick',
            'long',
            'daily',
            'duel',
        ]);
        expect(playModes({ inProgress: true, challenge: null, firstVisit: false }).sheet).toEqual([
            'continue',
            'quick',
            'long',
            'daily',
            'duel',
        ]);
    });

    it('o escolhido vale enquanto estiver na lista; senão volta pro padrão', () => {
        const plan = playModes({ inProgress: true, challenge: null, firstVisit: false });
        expect(chosenMode(plan, null)).toBe('continue');
        expect(chosenMode(plan, 'long')).toBe('long');
        // a copa acabou: o "Continuar" escolhido sai da lista e o JOGAR volta pra Relâmpago
        expect(chosenMode(playModes({ inProgress: false, challenge: null, firstVisit: false }), 'continue')).toBe(
            'quick',
        );
    });

    it('as setas andam pela lista e dão a volta nas pontas', () => {
        const sheet = ['quick', 'long', 'daily', 'duel'] as const;
        expect(stepMode(sheet, 'quick', 1)).toBe('long');
        expect(stepMode(sheet, 'duel', 1)).toBe('quick');
        expect(stepMode(sheet, 'quick', -1)).toBe('duel');
        expect(stepMode(sheet, 'continue', 1)).toBe('quick');
    });

    it('1ª visita: sem pílula, o JOGAR diz o modo embaixo', () => {
        const plan = playModes({ inProgress: false, challenge: null, firstVisit: true });
        expect(plan).toEqual({ main: 'quick', sheet: [] });
        const out = html(m('quick', 'Copa Relâmpago', 'Copa Relâmpago · 4 jogos'), [], false);
        expect(out).not.toContain('es-modes');
        expect(out).not.toContain('es-pill');
        expect(out).toMatch(/es-play[^>]*>.*Jogar.*es-play-sub[^>]*>Copa Relâmpago · 4 jogos/);
    });

    it('com a pílula, ela mostra o modo e o JOGAR diz o verbo (o modo fica pro leitor de tela)', () => {
        const cont = { ...m('continue', 'Continuar', 'Pallet FC · Quartas de final'), verb: 'Continuar' };
        const out = html(cont, [cont, m('quick', 'Copa Relâmpago')], false);
        expect(out).toMatch(/es-pill m-continue[^>]*>.*Continuar.*Pallet FC · Quartas de final/);
        expect(out).toMatch(/es-play-verb">Continuar<.*sr-only">Continuar · Pallet FC · Quartas de final/);
        expect(out.match(/class="es-arrow /g)).toHaveLength(2);
    });

    it('fechada, a lista fica inerte; aberta, desdobra com o escolhido marcado', () => {
        const sheet = [m('quick', 'Copa Relâmpago'), m('long', 'Rota Índigo'), m('duel', 'Duelo')];
        const closed = html(sheet[1], sheet, false);
        expect(closed).toContain('aria-expanded="false"');
        expect(closed).toMatch(/class="es-modes"[^>]*inert=""/);
        const open = html(sheet[1], sheet, true);
        expect(open).toContain('aria-expanded="true"');
        expect(open).toContain('class="es-modes open"');
        expect(open).not.toContain('inert');
        expect(open.match(/<button type="button" class="es-mode /g)).toHaveLength(3);
        expect(open).toMatch(/class="es-mode m-long on" aria-current="true"/);
    });
});
