import { SPECIES, species } from '../engine/data';
import { createInstance, type PokemonInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { weeklyEventType } from '../engine/specials';

/**
 * Copa do Dia: a mesma copa (draft e rivais) pra todo mundo no dia, 1 tentativa, estilo Wordle. O dia vira à meia-noite
 * de Brasília (America/Sao_Paulo, UTC−3 sem horário de verão desde 2019): é o fuso de quase todo mundo que joga, e o
 * banco usa o mesmo (`supabase/migrations/…_copa_do_dia_e_liga.sql`). Funções puras, pra dar pra testar.
 */
export const DAILY_TZ = 'America/Sao_Paulo';

const dayFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/** Dia da Copa do Dia ('2026-10-19') no relógio de Brasília. */
export const dailyDay = (now: Date = new Date()): string => dayFmt.format(now);

/** Seed do dia: igual pra todo mundo ('dia-20261019'). */
export const dailySeed = (day: string): string => `dia-${day.replace(/-/g, '')}`;
export const isDailySeed = (seed: string): boolean => /^dia-\d{8}$/.test(seed);

/** Tipo em evento da Copa do Dia: o da semana do dia (meio-dia local, pra data não escorregar de fuso). */
export const dailyEventType = (day: string): string => weeklyEventType(new Date(`${day}T12:00:00`));

/** Uma Copa do Dia jogada (só no save; o ranking do dia fica no banco). */
export interface DailyEntry {
    day: string;
    /** Placar de cada partida, seu lado primeiro, e os pênaltis (se teve). */
    results: { score: [number, number]; shootout: [number, number] | null; won: boolean; opponent: string }[];
    /** Acabou (título, eliminação ou copa abandonada). */
    done: boolean;
    champion: boolean;
    /** O servidor registrou a tentativa no começo (vale pro ranking). */
    ranked?: boolean;
    /** Quantas partidas o servidor já recebeu. */
    reported?: number;
}

/** Dias guardados no save (dá pra sequência e pro histórico curto). */
export const MAX_DAILY = 60;

export const winsOf = (e: Pick<DailyEntry, 'results'>) => e.results.filter((r) => r.won).length;

/** Entrada nova (ou trocada) no topo, do dia mais recente ao mais antigo. */
export const putDaily = (list: DailyEntry[], e: DailyEntry): DailyEntry[] =>
    [e, ...list.filter((x) => x.day !== e.day)].sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, MAX_DAILY);

/** Junta o histórico da nuvem com o do aparelho: por dia, fica o que andou mais (acabou > mais partidas). */
export function mergeDaily(a: DailyEntry[] = [], b: DailyEntry[] = []): DailyEntry[] {
    const byDay = new Map<string, DailyEntry>();
    const score = (e: DailyEntry) => (e.done ? 100 : 0) + e.results.length;
    for (const e of [...a, ...b]) {
        if (!e || typeof e.day !== 'string' || !Array.isArray(e.results)) continue;
        const cur = byDay.get(e.day);
        if (!cur || score(e) > score(cur)) byDay.set(e.day, e);
    }
    return [...byDay.values()].sort((x, y) => (x.day < y.day ? 1 : -1)).slice(0, MAX_DAILY);
}

const utc = (day: string) => {
    const [y, m, d] = day.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
};
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Os 7 dias (segunda a domingo) da semana de `today`. */
export function weekOf(today: string): string[] {
    const t = utc(today);
    const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * 86400000;
    return Array.from({ length: 7 }, (_, i) => isoDay(monday + i * 86400000));
}

/**
 * Sequência gentil: quantos dias desta semana você jogou (a semana nova começa do zero, mas o total de dias nunca
 * zera). Faltar um dia não apaga nada.
 */
export function dailyStreak(
    list: DailyEntry[],
    today: string,
): { days: string[]; week: boolean[]; weekCount: number; total: number } {
    const played = new Set(list.map((e) => e.day));
    const days = weekOf(today);
    const week = days.map((d) => played.has(d));
    return { days, week, weekCount: week.filter(Boolean).length, total: played.size };
}

/** Textos do compartilhar da Copa do Dia (o dicionário passa no idioma do jogo). */
export interface DailyShareText {
    title: string;
    champion: string;
    out: string;
    week: string;
    pens: string;
}

/** Texto estilo Wordle: quadradinhos (emoji só aqui, no Compartilhar), placares e a semana. */
export function dailyShareText(
    e: DailyEntry,
    week: { weekCount: number },
    tx: DailyShareText,
    clubName: (n: string) => string,
    url: string,
): string {
    const fill = (s: string, v: Record<string, string | number>) =>
        s.replace(/\{(\w+)\}/g, (m, k) => String(v[k] ?? m));
    const [, mm, dd] = e.day.split('-');
    // só as partidas jogadas, como as linhas do Wordle (quadrado preto ficaria fora do subset das fontes)
    const squares = e.results.map((r) => (r.won ? '🟩' : '🟥')).join('');
    const wins = winsOf(e);
    return [
        fill(tx.title, { d: dd, m: mm }),
        `${squares} ${e.champion ? tx.champion : fill(tx.out, { n: wins })}`,
        ...e.results.map(
            (r) =>
                `${r.score[0]}x${r.score[1]}${r.shootout ? fill(tx.pens, { a: r.shootout[0], b: r.shootout[1] }) : ''} ${clubName(r.opponent)}`,
        ),
        fill(tx.week, { n: week.weekCount }),
        url,
    ].join('\n');
}

/** O dia anterior ('2026-10-21' → '2026-10-20'). */
const prevDay = (day: string): string => {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
};
/** Dias em que a Copa do Dia foi jogada até o fim (pelo menos uma partida). */
const playedDays = (list: DailyEntry[]) =>
    new Set(list.filter((e) => e.done && e.results.length > 0).map((e) => e.day));

/**
 * Dias seguidos jogando a Copa do Dia até o fim (os marcos de 7 e 30 dias), contando até hoje (ou até ontem, se hoje
 * ainda não jogou: só cai quando passa um dia inteiro sem jogar). A "sequência gentil" da semana (`dailyStreak`) continua.
 */
export function daysInARow(list: DailyEntry[], today: string = dailyDay()): number {
    const days = playedDays(list);
    let d = days.has(today) ? today : prevDay(today);
    let n = 0;
    while (days.has(d)) {
        n++;
        d = prevDay(d);
    }
    return n;
}

/** A maior sequência que o save guarda (os últimos `MAX_DAILY` dias). */
export function bestDailyStreak(list: DailyEntry[]): number {
    const days = [...playedDays(list)].sort();
    let best = 0;
    let run = 0;
    for (let i = 0; i < days.length; i++) {
        run = i > 0 && prevDay(days[i]) === days[i - 1] ? run + 1 : 1;
        best = Math.max(best, run);
    }
    return best;
}

/** Figurinha do dia: o mesmo Pokémon pra todo mundo que termina a Copa do Dia daquele dia (vai pro Álbum). */
export const dailySticker = (day: string): number => new Rng(`sticker-${day}`, 'sticker').pick(SPECIES).id;

/** A carta da figurinha do dia: o Pokémon do dia na edição Evento do tipo dele (o Álbum guarda as edições especiais). */
export function dailyStickerCard(day: string): PokemonInstance {
    const id = dailySticker(day);
    const inst = createInstance(id, new Rng(`sticker-${day}`, 'card'));
    return { ...inst, uid: `dia-${day}`, special: { kind: 'evento', type: species(id).types[0] } };
}
