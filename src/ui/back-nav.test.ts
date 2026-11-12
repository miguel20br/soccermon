import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Screen } from '../store/game-store';
import { backTarget, guardAction, holdLayer, installBackNav, noteScreen } from './back-nav';

/** Anda pelas telas como a pessoa (cada troca passa pelo `noteScreen`, como no installBackNav). */
const walk = (...screens: Screen[]) => {
    noteScreen('draft', 'home');
    for (let i = 1; i < screens.length; i++) noteScreen(screens[i - 1], screens[i]);
};

describe('voltar: pra tela de onde abriu, nunca pra uma que a pessoa não abriu', () => {
    it('na Home não há voltar; tela da copa volta pra Home', () => {
        expect(backTarget('home')).toBeNull();
        walk('home', 'draft');
        for (const s of ['draft', 'lineup', 'match', 'result', 'map', 'liga-match'] as const)
            expect(backTarget(s)).toBe('home');
    });
    it('Perfil aberto da barra de cima volta pra Home (no Estádio), não pra Sede (11/11)', () => {
        walk('home', 'profile');
        expect(backTarget('profile')).toBe('home');
    });
    it('Configurações abertas do Perfil voltam pro Perfil (iam pra Home)', () => {
        walk('home', 'profile', 'settings');
        expect(backTarget('settings')).toBe('profile');
        noteScreen('settings', 'profile');
        expect(backTarget('profile')).toBe('home');
    });
    it('Coleção aberta da Sala volta pra Sala (ia pro Perfil, que a pessoa não abriu)', () => {
        walk('home', 'trophies', 'collection');
        expect(backTarget('collection')).toBe('trophies');
        noteScreen('collection', 'trophies');
        expect(backTarget('trophies')).toBe('home');
    });
    it('Ajuda e Créditos abertos das Configurações voltam pras Configurações', () => {
        walk('home', 'settings', 'credits');
        expect(backTarget('credits')).toBe('settings');
        walk('home', 'liga', 'help');
        expect(backTarget('help')).toBe('liga');
    });
    it('voltar por um botão pra uma tela do caminho corta o caminho (sem laço)', () => {
        walk('home', 'daily', 'liga', 'daily');
        expect(backTarget('daily')).toBe('home');
    });
    it('tela de menu aberta de dentro da copa (Copa do Dia no Resultado) volta pra Home', () => {
        walk('home', 'draft', 'result', 'daily');
        expect(backTarget('daily')).toBe('home');
    });
    it('uma só entrada de guarda: fora da Home ou com folha aberta', () => {
        expect(guardAction('draft', false)).toBe('push');
        expect(guardAction('lineup', true)).toBe('none');
        expect(guardAction('home', true)).toBe('pop');
        expect(guardAction('home', false)).toBe('none');
        // folha aberta na Home (Amigos pela barra de cima): voltar fecha a folha, não sai do jogo
        expect(guardAction('home', false, true)).toBe('push');
        expect(guardAction('home', true, true)).toBe('none');
    });
});

describe('guarda do histórico', () => {
    afterEach(() => vi.unstubAllGlobals());
    const stub = (state: unknown = null) => {
        const on: Record<string, () => void> = {};
        const history = {
            state,
            back: vi.fn(),
            pushState: vi.fn((s: unknown) => {
                history.state = s;
            }),
            replaceState: vi.fn((s: unknown) => {
                history.state = s;
            }),
        };
        vi.stubGlobal('window', {
            history,
            addEventListener: vi.fn((k: string, f: () => void) => {
                on[k] = f;
            }),
            removeEventListener: vi.fn(),
        });
        const pop = (s: unknown) => {
            history.state = s;
            on.popstate();
        };
        return { history, pop };
    };
    it('recarregou com a guarda no histórico e abriu na Home: limpa a marca sem voltar (não sai do jogo)', () => {
        const { history } = stub({ soccermonBack: 1 });
        // StrictMode no dev: monta, desmonta e monta de novo
        installBackNav(
            () => 'home',
            () => () => {},
            vi.fn(),
        )();
        const off = installBackNav(
            () => 'home',
            () => () => {},
            vi.fn(),
        );
        off();
        expect(history.back).not.toHaveBeenCalled();
        expect(history.state).toBeNull();
    });
    it('o voltar do Android com folha aberta fecha a folha e fica na tela', async () => {
        const { history, pop } = stub();
        const onBack = vi.fn();
        const off = installBackNav(
            () => 'profile',
            () => () => {},
            onBack,
        );
        expect(history.pushState).toHaveBeenCalledTimes(1);
        const close = vi.fn();
        const release = holdLayer(close);
        await Promise.resolve();
        pop(null);
        expect(close).toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();
        // a folha saiu: a guarda volta (o próximo voltar é o da tela)
        release();
        await Promise.resolve();
        expect(history.pushState).toHaveBeenCalledTimes(2);
        pop(null);
        expect(onBack).toHaveBeenCalledWith('profile');
        off();
    });
    it('a troca de tela anota o caminho (o voltar do Android e o ‹ vão pro mesmo lugar)', () => {
        stub();
        let screen: Screen = 'home';
        let cb = () => {};
        const off = installBackNav(
            () => screen,
            (f) => {
                cb = f;
                return () => {};
            },
            vi.fn(),
        );
        screen = 'trophies';
        cb();
        screen = 'collection';
        cb();
        expect(backTarget('collection')).toBe('trophies');
        off();
    });
    it('folha nova na Home (Metas): entra, sai e entra no mesmo instante (StrictMode) = uma guarda, sem back()', async () => {
        const { history, pop } = stub();
        const off = installBackNav(
            () => 'home',
            () => () => {},
            vi.fn(),
        );
        const close = vi.fn();
        holdLayer(close)();
        const release = holdLayer(close);
        await Promise.resolve();
        expect(history.pushState).toHaveBeenCalledTimes(1);
        expect(history.back).not.toHaveBeenCalled();
        // voltar do Android: fecha a folha e fica na Home (não sai do jogo)
        pop(null);
        expect(close).toHaveBeenCalledTimes(1);
        release();
        await Promise.resolve();
        expect(history.back).not.toHaveBeenCalled();
        off();
    });
});
