import { useEffect, useState } from 'react';

/**
 * Semana Fora da Lei (o tema "Noite Neon" do código): decoração da semana do GTA 6 (paródia de clima e de linguagem visual, sem logo, nome, cidade ou
 * personagem de lá): céu de pôr do sol neon, palmeiras, neon na quadra, capa em painéis, estrelas de procurado na
 * goleada e o fim de jogo "MISSÃO CUMPRIDA" / "PERDEU". Vale de 16/11/2026 00:00 (no ar assim que subir) a domingo
 * 22/11/2026 23:59 (Brasília) e some. Na tela, "SEMANA FORA DA LEI". Os "da rua" (Hitmonlee, Hitmonchan, Machamp e Blastoise)
 * andam pelo Estádio e estão na capa. Só enfeite: nada no motor. `?tema=neon` liga na hora e `?tema=off` desliga. O CSS lê `data-tema` no `<html>`.
 */
export const NEON_FROM = Date.parse('2026-11-16T00:00:00-03:00');
export const NEON_TO = Date.parse('2026-11-23T00:00:00-03:00');

export type Tema = 'neon' | null;

export function temaOf(search: string, now: number): Tema {
    const q = new URLSearchParams(search).get('tema');
    if (q === 'off') return null;
    if (q === 'neon' || (now >= NEON_FROM && now < NEON_TO)) return 'neon';
    return null;
}

// ponytail: lido uma vez ao abrir; quem deixar a aba aberta na virada de domingo fica com o tema até recarregar
// nos testes fica desligado (senão a semana do tema mudaria o resultado deles)
export const tema: Tema =
    typeof window === 'undefined' || import.meta.env.MODE === 'test'
        ? null
        : temaOf(window.location.search, Date.now());
/** Os "da rua" da Noite Neon (cosmético): andam pelo Estádio e estão na capa. */
export const NEON_STREET = [106, 107, 68, 9] as const;
/**
 * Na integração com a branch `semana-especial`, aponta pra mesma lista (`ESPECIAL_SPECIES`).
 * Espécies cuja carta ganha o fundo de pôr do sol neon enquanto o tema vale (só visual: nota e atributos iguais). A
 * lista sai com o ok do Miguel; vazia, nenhuma carta muda. Galeria: `?cards=1`, seção "Semana Fora da Lei".
 */
export const NEON_SPECIES: ReadonlySet<number> = new Set<number>([]);
export const neonOn = tema === 'neon';

export function startTema() {
    if (tema) document.documentElement.dataset.tema = tema;
}

/**
 * Quanto falta pro tema acabar, curto: "2d 14h", no último dia "5h 32min", na última hora "32min" (arredonda pra cima:
 * o último minuto ainda diz "1min"). Acabou: null.
 */
export function timeLeft(now: number, end = NEON_TO): string | null {
    const min = Math.ceil((end - now) / 60_000);
    if (min <= 0) return null;
    const d = Math.floor(min / 1440);
    const h = Math.floor((min % 1440) / 60);
    const m = min % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
}

/** O cronômetro do tema na tela: refaz a conta a cada minuto (um timer só por quem usa). */
export function useTimeLeft(): string | null {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!neonOn) return;
        const id = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(id);
    }, []);
    // o atalho `?tema=neon` fora da semana: conta até o fim de verdade, ou nada se já passou
    return neonOn ? timeLeft(now) : null;
}
