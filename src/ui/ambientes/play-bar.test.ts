import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { type Mode, PlayBar, playModes } from './PlayBar';

const noop = () => {};
const m = (id: Mode['id'], title: string, sub = ''): Mode => ({ id, title, sub, icon: 'next', go: noop });
const html = (main: Mode, sheet: Mode[], open: boolean) =>
    renderToStaticMarkup(createElement(PlayBar, { main, sheet, open, onOpen: noop }));

/**
 * Retorno do Miguel (25/10): as placas da Rota e do Duelo, a copa em andamento e o "Nova copa" tinham pesos diferentes
 * e uns não pareciam botão. Agora: um JOGAR que diz o que faz e um seletor "Modos" que desdobra os modos iguais.
 */
describe('JOGAR e seletor de modos do Estádio', () => {
    it('o JOGAR é a copa em andamento; senão o desafio do link; senão a Copa Relâmpago', () => {
        const base = { challenge: null, firstVisit: false };
        expect(playModes({ ...base, inProgress: false }).main).toBe('quick');
        expect(playModes({ ...base, inProgress: true }).main).toBe('continue');
        expect(playModes({ ...base, inProgress: false, challenge: 'ABC123' }).main).toBe('challenge');
        expect(playModes({ ...base, inProgress: true, challenge: 'ABC123' }).main).toBe('continue');
    });

    it('o seletor lista os modos (Continuar só com copa em andamento)', () => {
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

    it('1ª visita: sem seletor, o JOGAR vai direto pra Relâmpago', () => {
        const plan = playModes({ inProgress: false, challenge: null, firstVisit: true });
        expect(plan).toEqual({ main: 'quick', sheet: [] });
        const out = html(m('quick', 'Jogar', 'Copa Relâmpago · 4 jogos'), [], false);
        expect(out).not.toContain('es-modes');
        expect(out).not.toContain('aria-expanded');
        expect(out).toContain('Copa Relâmpago · 4 jogos');
    });

    it('o rótulo do JOGAR diz o modo', () => {
        const out = html(
            m('continue', 'Continuar', 'Pallet FC · Quartas de final'),
            [m('quick', 'Copa Relâmpago')],
            false,
        );
        expect(out).toMatch(/es-play[^>]*>.*Continuar.*Pallet FC · Quartas de final/);
    });

    it('fechado, o seletor fica inerte; aberto, desdobra com os modos como botões', () => {
        const sheet = [m('quick', 'Copa Relâmpago'), m('long', 'Rota Índigo'), m('duel', 'Duelo')];
        const closed = html(m('quick', 'Jogar'), sheet, false);
        expect(closed).toContain('aria-expanded="false"');
        expect(closed).toMatch(/class="es-modes"[^>]*inert=""/);
        const open = html(m('quick', 'Jogar'), sheet, true);
        expect(open).toContain('aria-expanded="true"');
        expect(open).toContain('class="es-modes open"');
        expect(open).not.toContain('inert');
        expect(open.match(/<button type="button" class="es-mode /g)).toHaveLength(3);
    });
});
