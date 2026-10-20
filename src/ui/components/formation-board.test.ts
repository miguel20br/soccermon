import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { cardTypeOf } from '../../engine/specials';
import { TYPE_COLOR } from '../type-colors';
import { FormationBoard } from './FormationBoard';

describe('vaga da carta Evento na prancheta', () => {
    it('pinta com o tipo do evento, não com o 1º tipo do Pokémon (Kabutops de Água vinha cor de Pedra)', () => {
        const rng = new Rng('evento-vaga');
        // Kabutops é Pedra/Água: a carta Evento de Água tem que sair azul
        const k = { ...createInstance(141, rng), uid: 'k', special: { kind: 'evento' as const, type: 'Water' } };
        expect(cardTypeOf(k)).toBe('Water');
        expect(cardTypeOf({ ...k, special: null })).toBe('Rock');
        const html = renderToStaticMarkup(
            createElement(FormationBoard, {
                formation: '1-2-1',
                lineup: ['k'],
                bench: [],
                byUid: new Map([['k', k]]),
                captainUid: null,
            } as never),
        );
        expect(html).toContain('sc-evento');
        expect(html).toContain(`--t1:${TYPE_COLOR.Water}`);
        expect(html).not.toContain(`--t1:${TYPE_COLOR.Rock}`);
    });
});
