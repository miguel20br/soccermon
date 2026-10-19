/**
 * Regras da Liga ranqueada (Elo, divisões, temporada, escolha do fantasma). Funções puras: a Edge Function `liga`
 * (supabase/functions/liga) usa as mesmas pra gravar, e a tela usa pra mostrar.
 */

export const ELO_START = 1000;

/**
 * Liga fechada até juntar mais gente (pedido do Miguel, 19/10/2026): a Home mostra o cartão com "Em breve" e a
 * contagem. **Pra mudar a data, troque só esta linha** (hora de Brasília, UTC−3). Passou dela, a Liga abre sozinha,
 * sem deploy. O `?demo=liga` (dev) entra mesmo fechada.
 */
export const LIGA_OPENS_AT = Date.parse('2026-12-01T00:00:00-03:00');

/** Quanto falta pra Liga abrir, em dias, horas e minutos; `null` = aberta. */
export function ligaCountdown(now = Date.now(), opensAt = LIGA_OPENS_AT) {
    const left = opensAt - now;
    if (left <= 0) return null;
    const min = Math.ceil(left / 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return { d: Math.floor(min / 1440), h: pad(Math.floor(min / 60) % 24), m: pad(min % 60) };
}

/** Chance de vitória esperada (Elo clássico). */
export const eloExpected = (me: number, opp: number) => 1 / (1 + 10 ** ((opp - me) / 400));

/** As 10 primeiras partidas da temporada mexem mais (acha o lugar de cada um mais rápido). */
export const eloK = (games: number) => (games < 10 ? 48 : 32);

/**
 * Elo depois da partida. Só o seu muda: o fantasma é a IA, o dono nem estava lá (e assim ninguém sobe o amigo
 * perdendo de propósito pro fantasma dele). Vitória nos pênaltis vale vitória.
 */
export const eloAfter = (me: number, opp: number, won: boolean, games: number) =>
    Math.max(0, Math.round(me + eloK(games) * ((won ? 1 : 0) - eloExpected(me, opp))));

/** Divisões nas cores das cartas (bronze, prata, ouro e a lendária, creme e dourado). */
export const DIVISIONS = [
    { id: 'bronze', min: 0 },
    { id: 'prata', min: 1100 },
    { id: 'ouro', min: 1250 },
    { id: 'lenda', min: 1400 },
] as const;
export type DivisionId = (typeof DIVISIONS)[number]['id'];

export function divisionOf(elo: number): { id: DivisionId; min: number; next: number | null } {
    let i = 0;
    while (i + 1 < DIVISIONS.length && elo >= DIVISIONS[i + 1].min) i++;
    return { id: DIVISIONS[i].id, min: DIVISIONS[i].min, next: DIVISIONS[i + 1]?.min ?? null };
}

/** Temporada = mês de Brasília ('2026-10'), a partir do dia da Copa do Dia (`dailyDay`). */
export const seasonOf = (day: string) => day.slice(0, 7);

export function prevSeason(season: string): string {
    const [y, m] = season.split('-').map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Dias que faltam pra temporada acabar (o último dia do mês conta). */
export function seasonDaysLeft(day: string): number {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate() - d + 1;
}

/** Temporada nova: o Elo volta metade do caminho até o começo (quem era bom continua na frente, sem disparar). */
export const seasonStartElo = (prev?: number | null) =>
    prev == null ? ELO_START : Math.round(ELO_START + (prev - ELO_START) / 2);

/** Fantasmas recentes que não se repetem. */
export const RECENT_GHOSTS = 5;
/** Sorteia entre os mais próximos de Elo. */
export const GHOST_POOL = 5;

/**
 * Próximo fantasma: nunca você mesmo, evita os últimos adversários (se sobrar alguém) e sorteia entre os `GHOST_POOL`
 * de Elo mais perto do seu. `roll` em [0, 1) vem do servidor.
 */
export function pickGhost<T extends { id: string; elo: number }>(
    cands: T[],
    me: { id: string; elo: number },
    recent: string[],
    roll: number,
): T | null {
    const others = cands.filter((c) => c.id !== me.id);
    const fresh = others.filter((c) => !recent.includes(c.id));
    const pool = (fresh.length ? fresh : others)
        .slice()
        .sort((a, b) => Math.abs(a.elo - me.elo) - Math.abs(b.elo - me.elo) || (a.id < b.id ? -1 : 1))
        .slice(0, GHOST_POOL);
    if (!pool.length) return null;
    return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))];
}
