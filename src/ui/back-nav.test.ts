import { afterEach, describe, expect, it, vi } from 'vitest';
import { backTarget, guardAction, installBackNav, setDoorOrigin, setPageOrigin } from './back-nav';

describe('voltar do sistema', () => {
    it('mapeia a tela para o destino do voltar', () => {
        expect(backTarget('home')).toBeNull();
        for (const s of ['draft', 'lineup', 'match', 'result', 'map', 'settings', 'duel', 'liga-match'] as const)
            expect(backTarget(s)).toBe('home');
        expect(backTarget('collection')).toBe('profile');
        expect(backTarget('trophies')).toBe('profile');
    });
    it('a Sala e a Coleção voltam pra onde a porta abriu (a Sede levava pro Perfil)', () => {
        setDoorOrigin('home');
        expect(backTarget('trophies')).toBe('home');
        setDoorOrigin('collection');
        expect(backTarget('trophies')).toBe('profile');
    });
    it('Ajuda e Créditos abertos das Configurações voltam pras Configurações (iam pro Estádio)', () => {
        setPageOrigin('settings');
        expect(backTarget('credits')).toBe('settings');
        expect(backTarget('help')).toBe('settings');
        setPageOrigin('home');
        expect(backTarget('help')).toBe('home');
        // o "?" mora na barra de cima de toda tela de menu: volta pra ela; de fora dos menus (copa), a Home
        setPageOrigin('profile');
        expect(backTarget('help')).toBe('profile');
        setPageOrigin('draft');
        expect(backTarget('credits')).toBe('home');
    });
    it('uma só entrada de guarda: empurra fora da Home, tira na Home', () => {
        expect(guardAction('draft', false)).toBe('push');
        expect(guardAction('lineup', true)).toBe('none');
        expect(guardAction('home', true)).toBe('pop');
        expect(guardAction('home', false)).toBe('none');
    });
    afterEach(() => vi.unstubAllGlobals());
    it('recarregou com a guarda no histórico e abriu na Home: limpa a marca sem voltar (não sai do jogo)', () => {
        const history = {
            state: { soccermonBack: 1 } as unknown,
            back: vi.fn(),
            pushState: vi.fn(),
            replaceState: vi.fn((s: unknown) => {
                history.state = s;
            }),
        };
        vi.stubGlobal('window', { history, addEventListener: vi.fn(), removeEventListener: vi.fn() });
        // StrictMode no dev: monta, desmonta e monta de novo
        installBackNav(
            () => 'home',
            () => () => {},
            vi.fn(),
        )();
        installBackNav(
            () => 'home',
            () => () => {},
            vi.fn(),
        );
        expect(history.back).not.toHaveBeenCalled();
        expect(history.state).toBeNull();
    });
});
