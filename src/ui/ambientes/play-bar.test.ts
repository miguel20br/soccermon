import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { chosenMode, type Mode, PlayBar, playModes } from './PlayBar';

const noop = () => {};
const m = (id: Mode['id'], title: string, sub = ''): Mode => ({ id, title, sub, icon: 'next', go: noop });
const html = (main: Mode, sheet: Mode[]) => renderToStaticMarkup(createElement(PlayBar, { main, sheet, onPick: noop }));

/**
 * Retorno do Miguel (30/10, "o seletor de modos tá muito burocrático, dar um espacinho pra cada modo"): uma placa por
 * modo em cima do JOGAR (no lugar da pílula com setas e lista); o JOGAR dourado joga a placa acesa.
 */
describe('JOGAR e placas de modos do Estádio', () => {
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

    it('1ª visita: sem placas, o JOGAR diz o modo embaixo', () => {
        const plan = playModes({ inProgress: false, challenge: null, firstVisit: true });
        expect(plan).toEqual({ main: 'quick', sheet: [] });
        const out = html(m('quick', 'Copa Relâmpago', 'Copa Relâmpago · 4 jogos'), []);
        expect(out).not.toContain('es-rail');
        expect(out).toMatch(/es-play[^>]*>.*Jogar.*es-play-sub[^>]*>Copa Relâmpago · 4 jogos/);
    });

    it('uma placa por modo, a escolhida acesa; o JOGAR diz o verbo e o modo embaixo', () => {
        const cont = { ...m('continue', 'Continuar', 'Pallet FC · Quartas de final'), verb: 'Continuar' };
        const sheet = [cont, m('quick', 'Copa Relâmpago'), m('long', 'Rota Índigo'), m('duel', 'Duelo')];
        const out = html(cont, sheet);
        expect(out.match(/class="es-tile /g)).toHaveLength(4);
        expect(out).toMatch(/aria-pressed="true" class="es-tile m-continue on"/);
        expect(out.match(/aria-pressed="true"/g)).toHaveLength(1);
        expect(out).toMatch(/es-play-verb">Continuar<.*es-play-sub">Continuar · Pallet FC · Quartas de final/);
    });
});
