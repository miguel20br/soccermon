/**
 * Navegação por ambientes (docs/planos/clash-2x2-menus-arcade.md, parte 2): 5 abas lado a lado, o Estádio no centro
 * é a entrada. Atrás de bandeira (ADR 0005): `?lab=ambientes` liga e fica ligado na aba do navegador até fechar;
 * `?lab=off` desliga. Sem a bandeira a Home é a de sempre.
 */
export const TABS = ['lab', 'rota', 'estadio', 'arena', 'sede'] as const;
export type Tab = (typeof TABS)[number];
export const START = TABS.indexOf('estadio');
const LAST = TABS.length - 1;

const KEY = 'soccermon-lab-ambientes';

/** A bandeira a partir da URL e do que ficou guardado na aba. */
export function ambientesOn(search: string, stored: string | null): boolean {
    const q = new URLSearchParams(search).get('lab');
    if (q === 'ambientes') return true;
    if (q === 'off') return false;
    return stored === '1';
}

/** Lê (e guarda) a bandeira: entrar numa copa troca a URL, e voltar pra Home tem que continuar nos ambientes. */
export function readAmbientes(): boolean {
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    const on = ambientesOn(window.location.search, stored);
    try {
        if (on) sessionStorage.setItem(KEY, '1');
        else sessionStorage.removeItem(KEY);
    } catch {
        // nada
    }
    return on;
}

/** Posição durante o arrasto (em abas): passou da primeira ou da última, anda um terço (elástico). */
export function dragPos(from: number, dx: number, width: number): number {
    const p = from - dx / Math.max(1, width);
    if (p < 0) return p / 3;
    if (p > LAST) return LAST + (p - LAST) / 3;
    return p;
}

/**
 * Aba ao soltar o dedo: a mais perto de onde a tela parou, ou a vizinha se o gesto foi um peteleco (rápido e com
 * pelo menos 16 px). Nunca pula mais de uma aba por gesto. `vx` em px/ms (negativo = dedo indo pra esquerda).
 */
export function snapTab(from: number, dx: number, vx: number, width: number): number {
    let to = Math.round(dragPos(from, dx, width));
    if (Math.abs(vx) > 0.35 && Math.abs(dx) > 16) to = from + (vx < 0 ? 1 : -1);
    to = Math.max(from - 1, Math.min(from + 1, to));
    return Math.max(0, Math.min(LAST, to));
}
