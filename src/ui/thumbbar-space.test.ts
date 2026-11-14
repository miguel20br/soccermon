import { afterEach, expect, it, vi } from 'vitest';
import { startThumbbarSpace } from './thumbbar-space';

afterEach(() => vi.unstubAllGlobals());

// a barra mudou de altura (o "Estou pronto" do Duelo virou "Não estou pronto"): escrever a variável dentro da entrega do
// ResizeObserver redimensionava o palco no mesmo quadro e o navegador acusava "ResizeObserver loop"
it('a altura nova da barra do polegar entra no quadro seguinte, fora da entrega do observador', () => {
    const props = new Map<string, string>();
    const bar = { isConnected: true, offsetHeight: 64 };
    let resized = () => {};
    const frames: (() => void)[] = [];
    vi.stubGlobal('document', {
        documentElement: {
            style: {
                setProperty: (k: string, v: string) => props.set(k, v),
                removeProperty: (k: string) => props.delete(k),
            },
        },
        querySelector: () => bar,
        body: {},
    });
    vi.stubGlobal(
        'ResizeObserver',
        class {
            constructor(cb: () => void) {
                resized = cb;
            }
            observe() {}
            unobserve() {}
        },
    );
    vi.stubGlobal(
        'MutationObserver',
        class {
            observe() {}
        },
    );
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => frames.push(f));
    vi.stubGlobal('cancelAnimationFrame', () => {});

    startThumbbarSpace();
    expect(props.get('--bc-thumb-h')).toBe('64px');
    bar.offsetHeight = 80;
    resized();
    expect(props.get('--bc-thumb-h')).toBe('64px');
    for (const f of frames) f();
    expect(props.get('--bc-thumb-h')).toBe('80px');
});
