import { afterEach, describe, expect, it } from 'vitest';
import { installTabBack } from './tab-back';

/** Histórico de mentira: pilha de estados e `popstate` assíncrono, como no navegador. */
function fakeWindow(stack: unknown[]) {
    let i = stack.length - 1;
    const pops = new Set<() => void>();
    const history = {
        get state() {
            return stack[i];
        },
        pushState(s: unknown) {
            stack.splice(i + 1, stack.length, s);
            i++;
        },
        replaceState(s: unknown) {
            stack[i] = s;
        },
        back() {
            i--;
            queueMicrotask(() => {
                for (const f of [...pops]) f();
            });
        },
    };
    const win = {
        history,
        addEventListener: (_: string, f: () => void) => pops.add(f),
        removeEventListener: (_: string, f: () => void) => pops.delete(f),
    };
    (globalThis as { window?: unknown }).window = win;
    return history;
}

afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
});

describe('voltar do Android nos ambientes', () => {
    it('voltando de uma tela pra Sede (Perfil aberto do Estádio): a guarda saindo não leva pro Estádio', async () => {
        // o Perfil abriu do Estádio (sem marca de aba embaixo) e o voltar dele pede a Sede
        const h = fakeWindow([null, { soccermonBack: 1 }]);
        let tab = 'sede';
        installTabBack(
            () => tab !== 'estadio',
            () => {
                tab = 'estadio';
            },
        );
        h.back(); // a guarda da tela sai do histórico
        await new Promise((r) => setTimeout(r, 0));
        expect(tab).toBe('sede');
        expect(h.state).toEqual({ soccermonTab: 1 });
    });
});
