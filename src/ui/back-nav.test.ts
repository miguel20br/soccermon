import { describe, expect, it } from 'vitest';
import { backTarget, guardAction } from './back-nav';

describe('voltar do sistema', () => {
    it('mapeia a tela para o destino do voltar', () => {
        expect(backTarget('home')).toBeNull();
        for (const s of ['draft', 'lineup', 'match', 'result', 'map', 'settings', 'duel', 'liga-match'] as const)
            expect(backTarget(s)).toBe('home');
        expect(backTarget('collection')).toBe('profile');
        expect(backTarget('trophies')).toBe('profile');
    });
    it('uma só entrada de guarda: empurra fora da Home, tira na Home', () => {
        expect(guardAction('draft', false)).toBe('push');
        expect(guardAction('lineup', true)).toBe('none');
        expect(guardAction('home', true)).toBe('pop');
        expect(guardAction('home', false)).toBe('none');
    });
});
