import { afterEach, describe, expect, it, vi } from 'vitest';

// View Transition de mentira: guarda a troca e só aplica quando o teste manda (como o navegador, um quadro depois)
let pending: (() => void) | null = null;
/** `aborted`: o navegador pula a animação (ex.: "Viewport size changed"), e ready/finished rejeitam. */
let aborted = false;
let endAnimation = () => {};
vi.stubGlobal('document', {
    visibilityState: 'visible',
    documentElement: { classList: { add() {}, remove() {} } },
    startViewTransition(cb: () => void) {
        pending = cb;
        if (!aborted) return { ready: Promise.resolve(), finished: new Promise<void>((r) => (endAnimation = r)) };
        const err = new Error('Transition was aborted because of invalid state. Viewport size changed');
        return { ready: Promise.reject(err), finished: Promise.reject(err) };
    },
});
vi.mock('./settings-sync', () => ({ reduceMotionOn: () => false }));
vi.mock('react-dom', () => ({ flushSync: (f: () => void) => f() }));

const { run } = await import('./view-transition');

describe('troca de tela com View Transition', () => {
    afterEach(async () => {
        endAnimation();
        await new Promise((r) => setTimeout(r, 0));
        pending = null;
        aborted = false;
    });
    it('transição pulada pelo navegador não vira promessa rejeitada sem tratamento, e a próxima troca segue', async () => {
        aborted = true;
        const log: string[] = [];
        run(() => log.push('a'));
        pending?.();
        await new Promise((r) => setTimeout(r, 0));
        aborted = false;
        run(() => log.push('b'));
        // nova transição de verdade (a pulada não deixou o "animando" preso): só aplica no quadro seguinte
        expect(log).toEqual(['a']);
        pending?.();
        expect(log).toEqual(['a', 'b']);
    });
    it('duas trocas seguidas (Perfil → Sala) terminam na última, na ordem em que chegaram', () => {
        const log: string[] = [];
        run(() => log.push('perfil'));
        run(() => log.push('sala'));
        expect(log).toEqual([]);
        pending?.();
        expect(log).toEqual(['perfil', 'sala']);
    });
});
