import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { metasLink } from './doors';

describe('Metas na Sede (menos-e-mais.md, B2)', () => {
    it('links antigos de missões e medalhas vão pras Metas; o resto continua na porta dele', () => {
        expect(metasLink('?aba=missoes')).toBe(true);
        expect(metasLink('?aba=medalhas')).toBe(true);
        expect(metasLink('?perfil=missoes')).toBe(true);
        expect(metasLink('?perfil=medalhas')).toBe(true);
        expect(metasLink('?aba=metas')).toBe(true);
        expect(metasLink('?aba=clube')).toBe(false);
        expect(metasLink('?aba=numeros')).toBe(false);
        expect(metasLink('')).toBe(false);
    });
});

describe('Clube e Amigos: folha por cima da tela de agora (11/11)', () => {
    it('Sede → Clube → X fica na Sede (abria o Perfil por baixo e o X caía nele)', async () => {
        const { useGame } = await import('../store/game-store');
        const { openDoor, openSheet, useDoorSheet } = await import('./doors');
        useGame.setState({ screen: 'home' });
        openDoor('profile', 'clube');
        expect(useGame.getState().screen).toBe('home');
        expect(useDoorSheet.getState().open).toBe('clube');
        openSheet(null); // o X
        expect(useGame.getState().screen).toBe('home');
        // Amigos pela barra de cima, de dentro de outra tela: a tela fica
        useGame.setState({ screen: 'trophies' });
        openDoor('profile', 'amigos');
        expect(useGame.getState().screen).toBe('trophies');
        expect(useDoorSheet.getState().open).toBe('amigos');
    });
});
