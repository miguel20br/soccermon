import { cloudEnabled, cloudUserId, loadCloud } from '../cloud/cloud';
import { ENGINE_VERSION } from '../engine/config';
import type { DuelTeamRecipe } from '../engine/duel-validate';
import type { MatchOrder, TeamSetup } from '../engine/state';
import type { Profile } from '../store/profile';
import { seasonOf } from './rules';

/**
 * Conversa com o servidor da Copa do Dia (funções SQL) e da Liga (Edge Function `liga`). Sem Supabase (jogo 100%
 * local) ou sem conta Google, tudo aqui devolve null / 'offline' e a tela explica. `?demo=dia` e `?demo=liga` (dev)
 * trocam o servidor por um de mentira (src/league/demo.ts).
 */

/** Como você aparece no ranking: o nome do treinador no jogo (nunca o da conta Google) e o clube. */
export interface PublicInfo {
    trainer: string;
    club: string;
    tag: string;
    color: string;
}
export const publicInfo = (p: Profile): PublicInfo => ({
    trainer: p.trainerName.trim().slice(0, 40) || 'Treinador',
    club: p.clubName.trim().slice(0, 22) || 'Pallet FC',
    tag: p.clubTag.slice(0, 3) || 'PAL',
    color: p.clubColor,
});

export interface DailyRow {
    pos: number;
    trainer: string;
    club: string;
    club_tag: string;
    club_color: string;
    wins: number;
    champion: boolean;
    gf: number;
    ga: number;
    done: boolean;
    me: boolean;
    /** Os 5 titulares (ids de espécie) e a vaga do capitão (0 a 4). Nulos em linha sem time (e em servidor sem a migração). */
    squad?: number[] | null;
    captain?: number | null;
}

/** Os ícones do ranking: só aceita 5 ids inteiros válidos; qualquer outra coisa vira "sem time". */
export function squadOf(r: Pick<DailyRow, 'squad' | 'captain'>): { ids: number[]; captain: number } | null {
    const ids = r.squad;
    if (!Array.isArray(ids) || ids.length !== 5 || !ids.every((n) => Number.isInteger(n) && n >= 1)) return null;
    const c = r.captain;
    return { ids, captain: typeof c === 'number' && Number.isInteger(c) && c >= 0 && c < 5 ? c : -1 };
}

export interface LigaRow {
    pos: number;
    trainer: string;
    club: string;
    club_tag: string;
    club_color: string;
    elo: number;
    games: number;
    wins: number;
    losses: number;
    me: boolean;
}

export interface GhostInfo {
    trainer: string | null;
    club: string;
    tag: string | null;
    color: string | null;
    ovr: number | null;
    /** Clube da Copa no papel de fantasma (começo da Liga, ninguém inscrito ainda). */
    house?: boolean;
}

/** Partida aberta contra um fantasma (o servidor sorteou; recarregar devolve a mesma). */
export interface LigaOpen {
    id: string;
    /** Só depois do "Jogar" (antes, ninguém simula a partida em casa pra fugir dela). */
    seed: string | null;
    started: boolean;
    season: string;
    myTeam: DuelTeamRecipe;
    ghostTeam: DuelTeamRecipe;
    ghost: GhostInfo;
    ghostElo: number;
    eloBefore: number;
    engine: number;
}

export interface LigaResult {
    score: [number, number];
    shootout: [number, number] | null;
    won: boolean;
    eloBefore: number;
    eloAfter: number;
    games: number;
}

export interface LigaStatus {
    season: string;
    elo: number | null;
    games: number;
    wins: number;
    losses: number;
    peak: number | null;
    team: { team: DuelTeamRecipe; ovr: number; updated_at: string } | null;
}

/** Servidor (o de verdade ou o de mentira do `?demo=`). */
export interface LeagueServer {
    dailyBegin(info: PublicInfo): Promise<{ day: string } | { error: string }>;
    dailyReport(a: DailyReport): Promise<boolean>;
    /** `friends`: só você e os seus amigos (precisa de conta Google). */
    dailyRanking(day: string, friends?: boolean): Promise<DailyRow[] | null>;
    ligaStatus(day: string): Promise<LigaStatus | null>;
    ligaRanking(season: string): Promise<LigaRow[] | null>;
    liga<T>(
        action: 'inscrever' | 'proxima' | 'jogar' | 'resultado',
        body: Record<string, unknown>,
    ): Promise<T | { error: string }>;
}

export interface DailyReport {
    day: string;
    stage: number;
    score: [number, number];
    shootout: [number, number] | null;
    team: TeamSetup | Record<string, never>;
    orders: MatchOrder[];
}

const sbOrNull = async () => (cloudUserId() ? await loadCloud().catch(() => null) : null);

/** Código curto do erro do Postgres/Edge (o texto fica no i18n). */
const codeOf = (msg: string | undefined) => (msg && /^[a-z_]+/.exec(msg)?.[0]) || 'falhou';

const real: LeagueServer = {
    async dailyBegin(info) {
        const sb = await sbOrNull();
        if (!sb) return { error: 'offline' };
        const { data, error } = await sb.rpc('copa_dia_comecar', {
            p_trainer: info.trainer,
            p_club: info.club,
            p_tag: info.tag,
            p_color: info.color,
            p_engine: ENGINE_VERSION,
        });
        if (error) return { error: codeOf(error.message) };
        const row = (data as { day: string }[] | null)?.[0];
        return row ? { day: row.day } : { error: 'falhou' };
    },
    async dailyReport(a) {
        const sb = await sbOrNull();
        if (!sb) return false;
        const { error } = await sb.rpc('copa_dia_partida', {
            p_day: a.day,
            p_stage: a.stage,
            p_gf: a.score[0],
            p_ga: a.score[1],
            p_pen_gf: a.shootout?.[0] ?? null,
            p_pen_ga: a.shootout?.[1] ?? null,
            p_team: a.team,
            p_orders: a.orders,
        });
        // fora de ordem / já acabou: o servidor já sabe dessa partida, não adianta mandar de novo
        return !error || ['fora_de_ordem', 'ja_acabou', 'expirou', 'sem_tentativa'].includes(codeOf(error.message));
    },
    async dailyRanking(day, friends) {
        const sb = friends ? await sbOrNull() : await loadCloud().catch(() => null);
        if (!sb) return null;
        const { data, error } = await sb.rpc(friends ? 'copa_dia_ranking_amigos' : 'copa_dia_ranking', { p_day: day });
        return error ? null : (data as DailyRow[]);
    },
    async ligaStatus(day) {
        const sb = await sbOrNull();
        const uid = cloudUserId();
        if (!sb || !uid) return null;
        const season = seasonOf(day);
        const [r, t] = await Promise.all([
            sb
                .from('league_ratings')
                .select('elo, peak, games, wins, losses')
                .eq('user_id', uid)
                .eq('season', season)
                .maybeSingle(),
            sb.from('league_teams').select('team, ovr, updated_at').eq('user_id', uid).maybeSingle(),
        ]);
        if (r.error || t.error) return null;
        return {
            season,
            elo: r.data?.elo ?? null,
            peak: r.data?.peak ?? null,
            games: r.data?.games ?? 0,
            wins: r.data?.wins ?? 0,
            losses: r.data?.losses ?? 0,
            team: t.data,
        };
    },
    async ligaRanking(season) {
        const sb = await loadCloud().catch(() => null);
        if (!sb) return null;
        const { data, error } = await sb.rpc('liga_ranking', { p_season: season });
        return error ? null : (data as LigaRow[]);
    },
    async liga(action, body) {
        const sb = await sbOrNull();
        if (!sb) return { error: 'offline' };
        // a 1ª partida numa instância fria pode passar do limite de CPU (546): tenta de novo, a partida continua aberta
        for (let attempt = 0; ; attempt++) {
            const { data, error } = await sb.functions.invoke('liga', { body: { action, ...body } });
            if (!error) return data;
            const res = (error as { context?: Response }).context;
            const status = res?.status ?? 0;
            if ((status === 546 || status >= 500) && attempt < 2) continue;
            try {
                const j = (await res?.json()) as { error?: string };
                return { error: codeOf(j?.error) };
            } catch {
                return { error: status ? 'falhou' : 'offline' };
            }
        }
    },
};

let server: LeagueServer = real;
/** Só o `?demo=` do dev troca o servidor. */
export const setLeagueServer = (s: LeagueServer) => {
    server = s;
};
export const league = (): LeagueServer => server;
/** Tem servidor (Supabase configurado, ou o de mentira do `?demo=`). */
export const leagueOnline = () => cloudEnabled || server !== real;
export const isError = (x: unknown): x is { error: string } =>
    !!x && typeof x === 'object' && typeof (x as { error?: unknown }).error === 'string';
