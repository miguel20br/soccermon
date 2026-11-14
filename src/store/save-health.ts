import { create } from 'zustand';

/**
 * Disco cheio: a gravação do save no IndexedDB falha com `QuotaExceededError` e antes ninguém ficava sabendo (jogador
 * com 13 copas perdeu o save). `full` liga na falha por cota e desliga na gravação seguinte que der certo.
 */
export const useSaveHealth = create<{ full: boolean; blocked: boolean }>(() => ({ full: false, blocked: false }));

export const isQuotaError = (e: unknown) =>
    (e instanceof Error || (typeof DOMException !== 'undefined' && e instanceof DOMException)) &&
    e.name === 'QuotaExceededError';

/**
 * Navegador que bloqueia o armazenamento do site (Opera GX e cia. com os cookies do site bloqueados, 12/11/2026): o
 * `indexedDB.open` lança na hora, o `set` do idb-keyval estourava dentro do `set` do Zustand e o JOGAR não fazia nada.
 * Este armazenamento nunca lança: sem IndexedDB, o save fica na memória (o jogo roda, `blocked` avisa que some ao
 * fechar a aba).
 */
export function safeStorage(idb: {
    get: (k: string) => Promise<string | undefined>;
    set: (k: string, v: string) => Promise<void>;
    del: (k: string) => Promise<void>;
}) {
    const mem = new Map<string, string>();
    let ok = true;
    const off = () => {
        ok = false;
        useSaveHealth.setState({ blocked: true });
    };
    // o lançamento na hora (sem IndexedDB) desliga; a falha assíncrona (cota, transação) segue pra quem chamou, como antes
    const quiet = (run: () => Promise<void>) => {
        if (!ok) return;
        try {
            return run();
        } catch {
            off();
        }
    };
    return {
        getItem: async (name: string): Promise<string | null> => {
            if (ok)
                try {
                    return (await idb.get(name)) ?? mem.get(name) ?? null;
                } catch {
                    off();
                }
            return mem.get(name) ?? null;
        },
        setItem: (name: string, value: string) => {
            mem.set(name, value);
            return quiet(() => watchSave(idb.set(name, value)));
        },
        removeItem: (name: string) => {
            mem.delete(name);
            return quiet(() => idb.del(name));
        },
    };
}

/** Acompanha uma gravação: liga/desliga o aviso e devolve a mesma promessa (o erro segue pra quem chamou). */
export async function watchSave(write: Promise<void>): Promise<void> {
    try {
        await write;
        if (useSaveHealth.getState().full) useSaveHealth.setState({ full: false });
    } catch (e) {
        if (isQuotaError(e)) useSaveHealth.setState({ full: true });
        throw e;
    }
}
