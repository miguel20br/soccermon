import { afterEach, describe, expect, it, vi } from 'vitest';

// View Transition de mentira: guarda a troca e só aplica quando o teste manda (como o navegador, um quadro depois)
let pending: (() => void) | null = null;
vi.stubGlobal('document', {
    visibilityState: 'visible',
    documentElement: { classList: { add() {}, remove() {} } },
    startViewTransition(cb: () => void) {
        pending = cb;
        return { finished: new Promise(() => {}) };
    },
});
vi.mock('./settings-sync', () => ({ reduceMotionOn: () => false }));
vi.mock('react-dom', () => ({ flushSync: (f: () => void) => f() }));

const { run } = await import('./view-transition');

describe('troca de tela com View Transition', () => {
    afterEach(() => {
        pending = null;
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
