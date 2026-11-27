import { setBolsaLab } from '../store/bolsa';

/**
 * Bandeira da Bolsa do técnico (itens-ativos.md, A1; ADR 0005): `?lab=itens` (ou `?lab=itens-todos`) liga no dev e nas prévias (`__SMOKE__`)
 * até o Miguel jogar; fica guardada na aba (entrar na copa troca a URL). Em produção, sempre desligada.
 */
const KEY = 'soccermon-lab-itens';

/** '1' = ligada; '2' = ligada com os 4 itens no começo (`?lab=itens-todos`, pra testar cada um); '0' = desligada. */
export function bolsaLabOf(smoke: boolean, search: string, stored: string | null): '0' | '1' | '2' {
    if (!smoke) return '0';
    const q = new URLSearchParams(search).get('lab');
    if (q === 'itens-todos') return '2';
    if (q === 'itens') return '1';
    return stored === '1' || stored === '2' ? stored : '0';
}

export function readBolsa(): boolean {
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    const on = bolsaLabOf(__SMOKE__, window.location.search, stored);
    try {
        sessionStorage.setItem(KEY, on);
    } catch {
        // nada
    }
    setBolsaLab(on !== '0', on === '2');
    return on !== '0';
}
