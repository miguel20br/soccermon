import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { cardTypeOf, ESPECIAL_EVENT } from '../../engine/specials';
import { TYPE_COLOR } from '../type-colors';
import { FormationBoard } from './FormationBoard';

describe('vaga da carta Evento na prancheta', () => {
    it('pinta com o tipo do evento, não com o 1º tipo do Pokémon (Kabutops de Água vinha cor de Pedra)', () => {
        const rng = new Rng('evento-vaga');
        // Kabutops é Pedra/Água: a carta Evento de Água tem que sair azul
        const k = { ...createInstance(141, rng), uid: 'k', special: { kind: 'evento' as const, type: 'Water' } };
        expect(cardTypeOf(k)).toBe('Water');
        expect(cardTypeOf({ ...k, special: null })).toBe('Rock');
        // a carta Evento de Pedra continua de Pedra
        expect(cardTypeOf({ ...k, special: { kind: 'evento', type: 'Rock' } })).toBe('Rock');
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

describe('vaga do Evento da Semana Fora da Lei', () => {
    // o Gyarados do evento saía com a vaga azul de Água: o evento de lista não tem tipo, a vaga é neon
    it('pinta com o neon do evento, não com a cor do tipo do Pokémon', () => {
        const g = {
            ...createInstance(130, new Rng('neon-vaga')),
            uid: 'g',
            special: { kind: 'evento' as const, event: ESPECIAL_EVENT },
        };
        const html = renderToStaticMarkup(
            createElement(FormationBoard, {
                formation: '1-2-1',
                lineup: ['g'],
                bench: [],
                byUid: new Map([['g', g]]),
                captainUid: null,
            } as never),
        );
        expect(html).toContain('sc-evento sc-neon');
    });
});

describe('nome das vagas do banco', () => {
    // no draft do Duelo a 1ª escolha (o capitão) cai na 1ª vaga do banco, que dizia "Banco"
    it('a vaga pode ter nome próprio (Capitão); sem nome, continua Banco', () => {
        const board = (benchLabels?: string[]) =>
            renderToStaticMarkup(
                createElement(FormationBoard, {
                    formation: '1-2-1',
                    lineup: [],
                    bench: ['', ''],
                    byUid: new Map(),
                    benchLabels,
                } as never),
            );
        expect(board(['Capitão', 'Banco'])).toContain('Capitão');
        expect(board()).not.toContain('Capitão');
    });
});
