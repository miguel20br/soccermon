import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));
// no render do servidor o zustand lê o estado inicial: aqui o seletor lê o estado de agora
vi.mock('../../store/game-store', async (orig) => {
    const real = await orig<typeof import('../../store/game-store')>();
    const store = real.useGame;
    const useGame = Object.assign(
        <T>(sel: (s: ReturnType<typeof store.getState>) => T) => sel(store.getState()),
        store,
    );
    return { ...real, useGame };
});

import { useGame } from '../../store/game-store';
import { rollEvent } from '../../store/long-events';
import { EventScreen, Training } from './CupMap';

function rota() {
    const g = useGame.getState();
    g.newRun('Teste FC', 'evento-tela', undefined, 'longa');
    useGame.getState().autoDraft();
    return useGame.getState().run!;
}

/** Rota em cena (cara-de-jogo.md): escolhas como opções do diálogo, e tocar no Pokémon marca em vez de aplicar. */
describe('tela do evento e do Treino', () => {
    it('evento: as escolhas são opções da caixa de diálogo, embaixo da cena', () => {
        const run = rota();
        const event = rollEvent(run, 'entrevista');
        useGame.setState({ run: { ...run, status: 'event', event } });
        const out = renderToStaticMarkup(createElement(EventScreen));
        expect(out).toMatch(/class="room-dialog has-opts".*class="ev-opt"/s);
        // a cena vem antes do diálogo
        expect(out.indexOf('ev-scene')).toBeLessThan(out.indexOf('room-dialog'));
    });

    it('Treino: tocar marca (aria-pressed) e o Treinar fica desligado até alguém ser marcado', () => {
        const run = rota();
        useGame.setState({ run: { ...run, status: 'treino' } });
        const out = renderToStaticMarkup(createElement(Training));
        expect(out).toContain('aria-pressed="false"');
        expect(out).toMatch(/<button[^>]*class="btn confirm wide"[^>]*disabled=""/);
        // o Descansar é o colchonete da cena, com a placa
        expect(out).toMatch(/class="tr-obj tr-bed"[^>]*aria-pressed="false"/);
        expect(out).toContain('Toque em quem treina');
    });
});
