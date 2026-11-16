/**
 * Noite Neon: decoração da semana do GTA 6 (homenagem de clima, sem marca de ninguém): céu de pôr do sol neon, o
 * letreiro e, na direção B, palmeiras, sol synthwave, neon na quadra e as estrelas da goleada. Liga sozinha de quinta
 * 19/11/2026 00:00 a domingo 22/11/2026 23:59 (Brasília) e some. `?tema=neon` liga na hora (`neon-a`/`neon-b` escolhe
 * a direção; `off` desliga). O CSS lê `data-tema` no `<html>`.
 */
export const NEON_FROM = Date.parse('2026-11-19T00:00:00-03:00');
export const NEON_TO = Date.parse('2026-11-23T00:00:00-03:00');
/** A direção que vai ao ar (A: só o céu e o letreiro; B: completa). O Miguel escolhe, a outra sai. */
export const NEON_DIR: 'a' | 'b' = 'b';

export type Tema = 'neon-a' | 'neon-b' | null;

export function temaOf(search: string, now: number): Tema {
    const q = new URLSearchParams(search).get('tema');
    if (q === 'off') return null;
    if (q === 'neon-a' || q === 'neon-b') return q;
    if (q === 'neon' || (now >= NEON_FROM && now < NEON_TO)) return `neon-${NEON_DIR}`;
    return null;
}

// ponytail: lido uma vez ao abrir; quem deixar a aba aberta na virada de domingo fica com o tema até recarregar
export const tema: Tema = typeof window === 'undefined' ? null : temaOf(window.location.search, Date.now());
/** Só a direção completa: o que vai além do céu e do letreiro. */
export const neonFull = tema === 'neon-b';

export function startTema() {
    if (tema) document.documentElement.dataset.tema = tema;
}
