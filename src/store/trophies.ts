import type { Metal } from '../ui/rarity';
import { type DailyEntry, winsOf } from './daily';
import type { Records } from './game-store';
import type { HallEntry } from './profile';

/**
 * Sala de troféus (docs/planos/sala-de-trofeus.md): o que vira objeto na sala, tudo tirado do save (é retroativo).
 * Cada modo tem o seu formato: taça (Copa), medalhão (Copa do Dia), cinturão (Duelo).
 */

export const METALS: Metal[] = ['bronze', 'prata', 'ouro'];

/**
 * Metal da taça pela campanha (decisão 3): sem sofrer gol = ouro, sem ir pros pênaltis (ganhou as 4 no tempo
 * normal) = prata, campeão = bronze.
 */
export function cupMetal(h: Pick<HallEntry, 'perfect' | 'scores'>): Metal {
    if (h.perfect) return 'ouro';
    return h.scores.every(([a, b]) => a > b) ? 'prata' : 'bronze';
}

/**
 * Medalhão da Copa do Dia pelo resultado do dia: campeão = ouro, 3 vitórias = prata, 2 = bronze. (O plano falava da
 * posição no ranking; o save não guarda a posição, então vale o resultado, que é o mesmo pra todo mundo.)
 */
export function dailyMetal(e: Pick<DailyEntry, 'results' | 'champion'>): Metal | null {
    if (e.champion) return 'ouro';
    const w = winsOf(e);
    return w >= 3 ? 'prata' : w >= 2 ? 'bronze' : null;
}

export type MetalCount = Record<Metal, number>;
const zero = (): MetalCount => ({ bronze: 0, prata: 0, ouro: 0 });

/** Taças da Copa por metal (o mesmo troféu repetido vira uma taça com o número gravado). */
export function cupCounts(hall: Pick<HallEntry, 'perfect' | 'scores'>[]): MetalCount {
    const n = zero();
    for (const h of hall) n[cupMetal(h)]++;
    return n;
}

/** Medalhões da Copa do Dia por metal. */
export function dailyCounts(daily: Pick<DailyEntry, 'results' | 'champion'>[]): MetalCount {
    const n = zero();
    for (const e of daily) {
        const m = dailyMetal(e);
        if (m) n[m]++;
    }
    return n;
}

/** Semanas (segunda a domingo) com a Copa do Dia jogada nos 7 dias: cada uma vira um troféu pequeno. */
export function fullWeeks(daily: Pick<DailyEntry, 'day'>[]): number {
    const byWeek = new Map<number, Set<string>>();
    for (const e of daily) {
        const t = Date.parse(`${e.day}T12:00:00Z`);
        if (Number.isNaN(t)) continue;
        // segunda-feira da semana (dia 0 do Date é domingo)
        const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * 864e5;
        const days = byWeek.get(monday) ?? new Set<string>();
        days.add(e.day);
        byWeek.set(monday, days);
    }
    return [...byWeek.values()].filter((s) => s.size === 7).length;
}

/** Cinturões do Duelo (por vitórias). */
export const BELTS = [
    { wins: 10, metal: 'bronze' },
    { wins: 50, metal: 'prata' },
    { wins: 100, metal: 'ouro' },
] as const satisfies readonly { wins: number; metal: Metal }[];

/** A sala sobe de nível com os títulos: quarto em Pallet → sala do clube → sala do estádio. */
export const ROOM_LEVELS = [
    { id: 'quarto', titles: 0 },
    { id: 'clube', titles: 5 },
    { id: 'estadio', titles: 25 },
] as const;
export type RoomLevel = (typeof ROOM_LEVELS)[number]['id'];

export function roomLevel(titles: number): { level: RoomLevel; n: number; next: number | null } {
    const i = ROOM_LEVELS.filter((l) => titles >= l.titles).length - 1;
    return { level: ROOM_LEVELS[i].id, n: i + 1, next: ROOM_LEVELS[i + 1]?.titles ?? null };
}

/** Taças por metal em lista, como vão na vitrine do cartão (o pedaço da sala que os outros veem). */
export const cupList = (n: MetalCount): [number, number, number] => [n.bronze, n.prata, n.ouro];

/**
 * Copas do Dia ganhas: o contador (desde a 0.9.50) ou os dias guardados no save (os 60 últimos), o que for maior. Os
 * dois andam juntos daqui pra frente; o contador só existe pra não perder título quando o dia sai da lista.
 */
export const dailyTitlesOf = (r: Pick<Records, 'dailyTitles'>, daily: Pick<DailyEntry, 'champion'>[]) =>
    Math.max(r.dailyTitles ?? 0, daily.filter((e) => e.champion).length);

/** Títulos por modo (o seu Perfil): `titles` conta os três, a Rota e o Dia têm contador próprio. */
export function titlesByMode(r: Pick<Records, 'titles' | 'longTitles' | 'dailyTitles'>, daily: DailyEntry[]) {
    const dia = dailyTitlesOf(r, daily);
    const rota = r.longTitles ?? 0;
    return { relampago: Math.max(0, r.titles - rota - dia), dia, rota };
}

/** Metal pelo número, nos degraus da sala (5 e 25 títulos) ou dos cinturões (10, 50, 100 vitórias). null = nenhum. */
export function tierMetal(n: number, steps: readonly number[]): Metal | null {
    const i = steps.filter((s) => n >= s).length;
    return i ? METALS[i - 1] : null;
}
export const TITLE_STEPS = [1, ROOM_LEVELS[1].titles, ROOM_LEVELS[2].titles] as const;
export const BELT_STEPS = [BELTS[0].wins, BELTS[1].wins, BELTS[2].wins] as const;

/** A melhor campanha do Hall: o metal da taça primeiro (perfeita > sem pênaltis > campeão), depois o saldo. */
export function bestTitle(hall: HallEntry[]): HallEntry | null {
    const score = (h: HallEntry) => METALS.indexOf(cupMetal(h)) * 1e4 + h.scores.reduce((s, [a, b]) => s + a - b, 0);
    return hall.reduce<HallEntry | null>((best, h) => (!best || score(h) > score(best) ? h : best), null);
}
