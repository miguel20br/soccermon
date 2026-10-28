/**
 * Partida "Beira da quadra" (revamp-ui §3.5, variante A escolhida em 26/10): quadra grande seguindo a bola e os
 * controles em 4 botões com sheet. Padrão desde a 0.9.24 (aprovada pelo Miguel em 28/10); `?lab=hud-off` volta pra
 * partida antiga na aba até fechar, `?lab=hud` religa.
 */
const KEY = 'soccermon-lab-hud';

export function hudOn(search: string, stored: string | null): boolean {
    const q = new URLSearchParams(search).get('lab');
    if (q === 'hud') return true;
    if (q === 'hud-off') return false;
    return stored !== '0';
}

/** Lê e guarda a escolha (entrar na copa troca a URL; a partida tem que lembrar). */
export function readHud(): boolean {
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    const on = hudOn(window.location.search, stored);
    try {
        sessionStorage.setItem(KEY, on ? '1' : '0');
    } catch {
        // nada
    }
    return on;
}
