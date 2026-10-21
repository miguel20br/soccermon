import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { screenTransition, setScreenWrap } from './screen-transition';

describe('troca de tela adiada pela transição', () => {
    it('o estado muda na hora; só a tela espera (e nada no meio é apagado)', () => {
        let pending: (() => void) | null = null;
        setScreenWrap((apply) => {
            pending = apply;
        });
        const store = create<{ screen: string; n: number; m: number }>()(
            screenTransition(() => ({ screen: 'home', n: 0, m: 0 })),
        );
        store.setState({ screen: 'draft', n: 1 });
        expect(store.getState()).toMatchObject({ screen: 'home', n: 1 });
        store.setState({ m: 2 });
        pending!();
        expect(store.getState()).toMatchObject({ screen: 'draft', n: 1, m: 2 });
        setScreenWrap((apply) => apply());
    });

    it('tela com canvas (partida, sala de troféus) troca direto, sem esperar a transição (piscava)', () => {
        let wrapped = 0;
        setScreenWrap((apply) => {
            wrapped++;
            apply();
        });
        const store = create<{ screen: string; n: number }>()(screenTransition(() => ({ screen: 'lineup', n: 0 })));
        store.setState({ screen: 'match', n: 1 });
        expect(store.getState()).toMatchObject({ screen: 'match', n: 1 });
        store.setState({ screen: 'result' });
        expect(wrapped).toBe(0);
        store.setState({ screen: 'reward' });
        expect(wrapped).toBe(1);
        setScreenWrap((apply) => apply());
    });
});
