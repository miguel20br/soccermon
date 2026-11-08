import { create } from 'zustand';

/**
 * Disco cheio: a gravação do save no IndexedDB falha com `QuotaExceededError` e antes ninguém ficava sabendo (jogador
 * com 13 copas perdeu o save). `full` liga na falha por cota e desliga na gravação seguinte que der certo.
 */
export const useSaveHealth = create<{ full: boolean }>(() => ({ full: false }));

export const isQuotaError = (e: unknown) =>
    (e instanceof Error || (typeof DOMException !== 'undefined' && e instanceof DOMException)) &&
    e.name === 'QuotaExceededError';

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
