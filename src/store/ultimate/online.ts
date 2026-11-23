import { loadCloud } from '../../cloud/cloud';

/**
 * Cliente da troca e do ranking do Time Ultimate (docs/planos/troca-e-ranking.md): fala com a Edge Function `ut` e com
 * `ut_ranking_lista`. Atrás de `?lab=troca` e `?lab=ranking-ut` (dev e prévias). Enquanto a migração e a função não
 * estão no ar (hoje), tudo devolve `{ ok: false, error: 'indisponivel' }` e a tela explica; nunca joga erro.
 * `loadCloud` é dinâmico: o Supabase não entra no pedaço da Home.
 */

export type UtResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** 404 da função, tabela ou RPC que não existem (PGRST202/42P01) = ainda não publicado. */
const MISSING = new Set(['PGRST202', 'PGRST205', '42P01', '42883']);

export const utErrorOf = (status: number, code?: string): string => {
    if (code) return code.split(':')[0];
    return status === 404 ? 'indisponivel' : status ? 'falhou' : 'offline';
};

export async function utCall<T>(action: string, body: Record<string, unknown> = {}): Promise<UtResult<T>> {
    const sb = await loadCloud().catch(() => null);
    if (!sb) return { ok: false, error: 'offline' };
    try {
        const { data, error } = await sb.functions.invoke('ut', { body: { action, ...body } });
        if (!error) return { ok: true, data: data as T };
        const res = (error as { context?: Response }).context;
        const status = res?.status ?? 0;
        const j = (await res?.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: utErrorOf(status, j?.error) };
    } catch {
        return { ok: false, error: 'offline' };
    }
}

export interface UtRankRow {
    pos: number;
    trainer: string;
    club: string;
    club_tag: string;
    club_color: string;
    points: number;
    games: number;
    wins: number;
    me: boolean;
    squad: number[] | null;
}

export async function utRanking(season: number): Promise<UtResult<UtRankRow[]>> {
    const sb = await loadCloud().catch(() => null);
    if (!sb) return { ok: false, error: 'offline' };
    const { data, error } = await sb.rpc('ut_ranking_lista', { p_season: season });
    if (error) return { ok: false, error: MISSING.has(error.code) ? 'indisponivel' : 'falhou' };
    return { ok: true, data: data as UtRankRow[] };
}

export interface UtTradeRow {
    id: string;
    dir: 'in' | 'out';
    status: string;
    friend: { trainer: string; club: string; code: string } | null;
    offer: { uid: string; speciesId: number; level: number; shiny: boolean };
    give: { uid: string; speciesId: number; level: number; shiny: boolean } | null;
    created_at: string;
    /** Troca fechada que o seu save ainda não aplicou. */
    toApply: { lose: string; gain: never } | null;
}
