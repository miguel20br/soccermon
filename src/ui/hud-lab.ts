/**
 * Partida "Beira da quadra" (revamp-ui §3.5, variante A escolhida em 26/10): quadra grande seguindo a bola e os
 * controles em 4 botões com sheet. Atrás de bandeira até ser jogada numa copa inteira (ADR 0005): `?lab=hud` liga e
 * fica na aba do navegador até fechar, `?lab=hud-off` desliga.
 */
const KEY = 'soccermon-lab-hud';

export function hudOn(search: string, stored: string | null): boolean {
    const q = new URLSearchParams(search).get('lab');
    if (q === 'hud') return true;
    if (q === 'hud-off') return false;
    return stored === '1';
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
        if (on) sessionStorage.setItem(KEY, '1');
        else sessionStorage.removeItem(KEY);
    } catch {
        // nada
    }
    return on;
}
