/**
 * Contadores da festa guardados só neste navegador (pacotes abertos, Pokédex vista na Home). Sem localStorage
 * (aba anônima, bloqueado), `readCount` dá null e a gravação é ignorada: a tela segue sem a festa extra.
 */
export function readCount(key: string): number | null {
    try {
        const v = localStorage.getItem(key);
        return v === null ? null : Number(v) || 0;
    } catch {
        return null;
    }
}

export function writeCount(key: string, n: number) {
    try {
        localStorage.setItem(key, String(n));
    } catch {
        // sem onde guardar: na próxima vez a festa volta inteira
    }
}
