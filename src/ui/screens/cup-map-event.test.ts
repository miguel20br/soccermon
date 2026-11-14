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
import { EventScreen, enteredRegion, reachable, Training } from './CupMap';

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

    it('Centro: a Enfermeira Joy atrás do balcão com a máquina de cura (antes era a Lass num fundo liso)', () => {
        const run = rota();
        useGame.setState({ run: { ...run, status: 'event', event: { id: 'centro' }, cards: 1 } });
        const out = renderToStaticMarkup(createElement(EventScreen));
        expect(out).toContain('assets/trainers/nurse.png');
        expect(out).not.toContain('assets/trainers/lass.png');
        expect(out).toContain('evs-machine');
    });

    it('Safari: a chance aparece uma vez só, no botão (a carta não diz mais "Foge 15%")', () => {
        const run = rota();
        const event = rollEvent(run, 'safari');
        useGame.setState({ run: { ...run, status: 'event', event } });
        const out = renderToStaticMarkup(createElement(EventScreen));
        expect(out).not.toMatch(/Foge \d+%/);
        expect(out.match(/class="ev-chance"/g)).toHaveLength(event.cards!.length);
    });
});

describe('mapa vivo', () => {
    it('placa da região: no começo (Rota 1) e ao cruzar pra outra região; andando dentro da mesma, nada', () => {
        const run = rota();
        const map = run.map!;
        expect(enteredRegion({ ...run, at: null })).toBe('rota1');
        const r1 = map.nodes.find((n) => n.row === 1)!;
        expect(enteredRegion({ ...run, at: r1.id })).toBe('floresta');
        const r0 = map.nodes.find((n) => n.row === 0)!;
        expect(enteredRegion({ ...run, at: r0.id })).toBeNull();
    });

    it('o alcançável sai das casas da frente e nunca volta pra trás', () => {
        const run = rota();
        const map = run.map!;
        const at = map.nodes.find((n) => n.row === 4)!;
        const reach = reachable(map, at.id);
        expect([...reach].every((id) => map.nodes.find((n) => n.id === id)!.row > 4)).toBe(true);
        for (const id of at.next) expect(reach.has(id)).toBe(true);
        expect(reachable(map, null).size).toBe(map.nodes.length);
    });
});
