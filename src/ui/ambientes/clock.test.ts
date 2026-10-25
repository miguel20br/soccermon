import { afterEach, describe, expect, it, vi } from 'vitest';
import { clockOn, createClock, MAX_DT } from './clock';
import { installTabBack } from './tab-back';

/** rAF de mentira: `frame(ms)` roda o quadro pendente naquela hora. */
function fakeRaf() {
    let pending: ((now: number) => void) | null = null;
    let ids = 0;
    return {
        raf: (cb: (now: number) => void) => {
            pending = cb;
            return ++ids;
        },
        caf: () => {
            pending = null;
        },
        frame(now: number) {
            const cb = pending;
            pending = null;
            cb?.(now);
        },
        get pending() {
            return !!pending;
        },
    };
}

describe('relógio da cena', () => {
    it('só anda ligado; parado, não pede quadro nem conta tempo', () => {
        const r = fakeRaf();
        const clock = createClock(r.raf, r.caf);
        const ticks: number[] = [];
        clock.sub((t) => ticks.push(t));
        expect(r.pending).toBe(false);
        clock.run(true);
        r.frame(1000);
        r.frame(1016);
        r.frame(1032);
        expect(clock.t).toBe(32);
        clock.run(false);
        expect(r.pending).toBe(false);
        r.frame(5000);
        expect(clock.t).toBe(32);
        // voltou depois de 10 s escondido: continua de onde parou, sem salto
        clock.run(true);
        r.frame(11000);
        r.frame(11016);
        expect(clock.t).toBe(48);
        expect(ticks).toEqual([0, 16, 32, 32, 48]);
    });

    it('quadro engasgado não teleporta (passo máximo)', () => {
        const r = fakeRaf();
        const clock = createClock(r.raf, r.caf);
        clock.run(true);
        r.frame(0);
        r.frame(2000);
        expect(clock.t).toBe(MAX_DT);
    });

    it('pausa fora da tela: aba escondida, página escondida ou reduzir movimento', () => {
        expect(clockOn(true, false, false)).toBe(true);
        expect(clockOn(false, false, false)).toBe(false);
        expect(clockOn(true, true, false)).toBe(false);
        expect(clockOn(true, false, true)).toBe(false);
    });
});

describe('voltar do Android nos ambientes', () => {
    afterEach(() => vi.unstubAllGlobals());
    function stub(state: unknown = null) {
        const listeners: (() => void)[] = [];
        const stack: unknown[] = [state];
        const history = {
            get state() {
                return stack[stack.length - 1];
            },
            pushState: vi.fn((s: unknown) => stack.push(s)),
            replaceState: vi.fn((s: unknown) => {
                stack[stack.length - 1] = s;
            }),
            // o voltar do sistema: tira uma entrada e avisa (popstate)
            back: vi.fn(() => {
                stack.pop();
                for (const l of listeners) l();
            }),
        };
        vi.stubGlobal('window', {
            history,
            addEventListener: (_: string, l: () => void) => listeners.push(l),
            removeEventListener: vi.fn(),
        });
        return { history, stack };
    }

    it('fora do Estádio, voltar leva pro Estádio (e não sai do jogo)', () => {
        const { history, stack } = stub();
        let tab = 'rota';
        const tb = installTabBack(
            () => tab !== 'estadio',
            () => {
                tab = 'estadio';
                tb.sync();
            },
        );
        expect(stack).toHaveLength(2);
        history.back(); // botão do Android
        expect(tab).toBe('estadio');
        expect(stack).toHaveLength(1);
        // no Estádio não há marca: o próximo voltar é o do sistema (sai do app)
        expect(history.pushState).toHaveBeenCalledTimes(1);
    });

    it('trocar de aba não enche o histórico; voltar pro Estádio pela barra tira a marca', () => {
        const { stack } = stub();
        let tab = 'estadio';
        const tb = installTabBack(
            () => tab !== 'estadio',
            () => {
                tab = 'estadio';
            },
        );
        expect(stack).toHaveLength(1);
        for (const t of ['rota', 'lab', 'arena', 'sede']) {
            tab = t;
            tb.sync();
        }
        expect(stack).toHaveLength(2);
        tab = 'estadio';
        tb.sync();
        expect(stack).toHaveLength(1);
        expect(tab).toBe('estadio'); // o voltar feito pelo próprio sync não conta como "voltar do usuário"
    });

    it('recarregou com a marca e abriu no Estádio: limpa sem voltar', () => {
        const { history, stack } = stub({ soccermonTab: 1 });
        installTabBack(
            () => false,
            () => {},
        );
        expect(history.back).not.toHaveBeenCalled();
        expect(stack).toEqual([null]);
    });

    it('montou de novo (StrictMode, voltou de outra tela) com a marca já lá: não empurra outra', () => {
        const { stack } = stub();
        installTabBack(
            () => true,
            () => {},
        ).off();
        installTabBack(
            () => true,
            () => {},
        );
        expect(stack).toHaveLength(2);
    });
});
