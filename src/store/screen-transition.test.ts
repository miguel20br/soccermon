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
});
