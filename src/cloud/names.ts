import { cloudUserId, loadCloud } from './cloud';

/**
 * Nomes únicos (supabase/migrations/20261022120000_nomes_unicos.sql): o nome do treinador e do clube são de uma conta
 * só. A comparação ignora maiúsculas, acentos e espaços a mais, igual no servidor (`nome_chave`).
 */
export type NameKind = 'treinador' | 'clube';
export type NameResult = 'ok' | 'ocupado' | 'livre' | 'sem_conta' | 'erro';

export const nameKey = (s: string) =>
    s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

/** Reserva o nome pra sua conta (sem conta: não dá pra garantir, o jogo deixa usar). */
export async function reserveName(kind: NameKind, name: string): Promise<NameResult> {
    if (!cloudUserId()) return 'sem_conta';
    try {
        const sb = await loadCloud();
        if (!sb) return 'erro';
        const { data, error } = await sb.rpc('reservar_nome', { p_tipo: kind, p_nome: name });
        if (error) return 'erro';
        return (data as NameResult) ?? 'erro';
    } catch {
        return 'erro';
    }
}
