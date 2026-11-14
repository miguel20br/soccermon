import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReloadEnv } from './chunk-reload';

const ENTRY = '/bundle/index-velho.js';
const NEW_HTML = '<script type="module" src="/bundle/index-novo.js"></script>';

function env(over: Partial<ReloadEnv> = {}, store = new Map<string, string>()) {
    const reload = vi.fn();
    const e: ReloadEnv = {
        storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) },
        now: 1_000_000,
        online: true,
        entry: ENTRY,
        serverHtml: async () => NEW_HTML,
        reload,
        ...over,
    };
    return { e, reload, store };
}

// cada teste com o módulo zerado (ele lembra que já mandou recarregar)
let reloadForNewVersion: typeof import('./chunk-reload').reloadForNewVersion;
beforeEach(async () => {
    vi.resetModules();
    ({ reloadForNewVersion } = await import('./chunk-reload'));
});

describe('pedaço com hash que sumiu (aba de versão velha)', () => {
    it('servidor com versão nova: recarrega uma vez, e quem pergunta de novo espera o recarregamento', async () => {
        const { e, reload } = env();
        expect(await reloadForNewVersion(e)).toBe(true);
        expect(await reloadForNewVersion(e)).toBe(true);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('já recarregou há menos de 1 min (HTML velho em cache): não entra em loop', async () => {
        const { e, reload } = env({}, new Map([['soccermon-chunk-reload', String(1_000_000 - 30_000)]]));
        expect(await reloadForNewVersion(e)).toBe(false);
        expect(reload).not.toHaveBeenCalled();
    });

    it('mesma versão no servidor, sem rede ou servidor fora: não tira ninguém da tela', async () => {
        for (const over of [
            { serverHtml: async () => `<script src="${ENTRY}"></script>` },
            { online: false },
            { serverHtml: () => Promise.reject(new Error('offline')) },
        ]) {
            const { e, reload } = env(over);
            expect(await reloadForNewVersion(e)).toBe(false);
            expect(reload).not.toHaveBeenCalled();
        }
    });
});
