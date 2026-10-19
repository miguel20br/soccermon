import { mergeBinder } from '../store/binder';
import { mergeDaily } from '../store/daily';
import { mergeDuels } from '../store/duels';
import {
    isCupInProgress,
    MAX_PARKED,
    type PersistedSave,
    type Records,
    type RunState,
    withUnlocks,
} from '../store/game-store';
import { mergeProfileUnlocks } from '../store/missions';
import { DEFAULT_PROFILE, mergeCareer, mergeDex, mergeHall, mergeMoves } from '../store/profile';

/**
 * O que fazer com o save do aparelho e o da conta quando alguém entra com Google. Funções puras (sem
 * Supabase, sem localStorage) para dar para testar todas as situações: cloud.ts só lê os dados, chama
 * `planReconcile` e, quando o plano pede, mostra a pergunta e depois aplica `mergeSaves`.
 *
 * Regras: o progresso de visitante só vai para a conta se o jogador confirmar; recordes, Pokédex, golpes e
 * carreira sempre juntam o melhor dos dois; uma copa em andamento nunca some sem aviso (a que não continua
 * vai para `parkedRuns`).
 */

export type Side = 'device' | 'cloud';

export type Plan =
    /** Nada a perguntar: o save do aparelho sobe (conta sem save, ou mesma conta com o aparelho na frente). */
    | { kind: 'upload' }
    /** A conta vale (aparelho sem progresso, ou mesma conta com a nuvem na frente); juntando recordes e Pokédex. */
    | { kind: 'cloud-wins' }
    /** Mesma conta, aparelho mais novo: vale o aparelho, juntando o que a nuvem tiver. */
    | { kind: 'local-wins' }
    /** O save do aparelho é de outra conta: esta começa com o que tem na nuvem (ou do zero). */
    | { kind: 'other-account' }
    /** Primeiro login, conta sem save e aparelho com progresso de visitante: perguntar se leva. */
    | { kind: 'ask-bring' }
    /**
     * Conta com save e aparelho com progresso de visitante: perguntar se junta. `cupChoice` = os dois têm copa
     * em andamento (diferentes) e o jogador escolhe qual continua; senão continua a de `keep`.
     */
    | { kind: 'ask-merge'; cupChoice: boolean; keep: Side }
    /** Mesma conta, mas aparelho e nuvem mudaram cada um com uma copa diferente: perguntar qual continua. */
    | { kind: 'ask-cup' };

export interface PlanInput {
    local: PersistedSave;
    /** Save da conta já migrado (undefined = conta sem save). */
    cloud: Partial<PersistedSave> | undefined;
    /** Dono do save do aparelho ('' = visitante). */
    owner: string;
    uid: string;
    /** Quando o save do aparelho mudou pela última vez, quando a nuvem mudou e quando os dois estavam iguais. */
    localTs: number;
    cloudTs: number;
    syncedTs: number;
}

const dexCount = (s: Partial<PersistedSave>) => Object.keys(s.dex ?? {}).length;

/** Tem algo que valha perguntar (copa, recordes, Pokédex, carreira, copas guardadas)? Só ter visto o tutorial não conta. */
export function hasProgress(s: Partial<PersistedSave> | undefined): boolean {
    if (!s) return false;
    return (
        !!s.run ||
        (s.parkedRuns?.length ?? 0) > 0 ||
        (s.records?.cups ?? 0) > 0 ||
        dexCount(s) > 0 ||
        Object.keys(s.moves ?? {}).length > 0 ||
        (s.career?.matches ?? 0) > 0
    );
}

/** As duas copas em andamento são diferentes (seeds diferentes)? */
const cupsConflict = (a: RunState | null | undefined, b: RunState | null | undefined) =>
    isCupInProgress(a) && isCupInProgress(b) && a.seed !== b.seed;

export function planReconcile({ local, cloud, owner, uid, localTs, cloudTs, syncedTs }: PlanInput): Plan {
    if (owner && owner !== uid) return { kind: 'other-account' };

    if (!owner) {
        // visitante: nada a levar → segue sem perguntar
        if (!hasProgress(local)) return cloud ? { kind: 'cloud-wins' } : { kind: 'upload' };
        // conta nova (ou com save vazio, de um login num aparelho sem nada): só perguntar se leva
        if (!cloud || !hasProgress(cloud)) return { kind: 'ask-bring' };
        // continua a copa de quem tem uma; sem copa nenhuma, vale o perfil da conta
        const cupChoice = cupsConflict(local.run, cloud.run);
        return { kind: 'ask-merge', cupChoice, keep: isCupInProgress(local.run) ? 'device' : 'cloud' };
    }

    // mesma conta voltando
    if (!cloud) return { kind: 'upload' };
    const localChanged = localTs > syncedTs;
    const cloudChanged = cloudTs > syncedTs;
    // os dois lados mudaram desde a última vez que estavam iguais, cada um com uma copa: não escolher sozinho
    if (localChanged && cloudChanged && cupsConflict(local.run, cloud.run)) return { kind: 'ask-cup' };
    return cloudTs > localTs ? { kind: 'cloud-wins' } : { kind: 'local-wins' };
}

// ---------------------------------------------------------------------------------------------- junção

/** Configurações: as do lado que vale por cima, mas recusar as estatísticas em qualquer lugar vence. */
export function mergeSettings(
    local: PersistedSave['settings'],
    cloud: Partial<PersistedSave['settings']> | undefined,
    keep: Side,
) {
    const merged = keep === 'cloud' ? { ...local, ...cloud } : { ...cloud, ...local };
    return { ...merged, stats: local.stats !== false && cloud?.stats !== false };
}

/** Recordes nunca diminuem: junta pelo maior de cada contador. */
export function mergeRecords(a: Records, b: Partial<Records> | undefined): Records {
    const out: Records = { ...a };
    for (const [k, v] of Object.entries(b ?? {}) as [keyof Records, number | undefined][]) {
        if (typeof v === 'number') out[k] = Math.max(out[k] ?? 0, v);
    }
    return out;
}

/** Quanto a copa andou (a mesma copa nos dois lados: fica a versão mais adiantada). */
const progressOf = (r: RunState) => [r.results.length, r.picks.length, r.rewards.length, r.live?.tick ?? 0];
function ahead(a: RunState, b: RunState): boolean {
    const pa = progressOf(a);
    const pb = progressOf(b);
    for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i];
    return false;
}

/**
 * Junta o save do aparelho com o da conta. `keep` é o lado cuja copa continua (e cujo perfil vale). Toda copa em
 * andamento que não continua vai para `parkedRuns`. `stale` = lado que não mudou desde a última sincronização:
 * as copas dele já são conhecidas do outro (se o outro abandonou ou terminou uma copa, ela não volta).
 */
export function mergeSaves(
    local: PersistedSave,
    cloud: Partial<PersistedSave> | undefined,
    keep: Side,
    stale: Side | null = null,
): PersistedSave {
    const side = (s: Side): Partial<PersistedSave> => (s === 'device' ? local : (cloud ?? {}));
    const other: Side = keep === 'device' ? 'cloud' : 'device';
    const k = side(keep);
    const o = stale === other ? {} : side(other);

    // a versão mais adiantada de cada copa (pela seed), olhando os dois lados
    const best = new Map<string, RunState>();
    const all = [k.run, ...(k.parkedRuns ?? []), o.run, ...(o.parkedRuns ?? [])];
    for (const r of all) {
        if (!r) continue;
        const cur = best.get(r.seed);
        if (!cur || ahead(r, cur)) best.set(r.seed, r);
    }
    const latest = (r: RunState | null | undefined) => (r ? (best.get(r.seed) ?? r) : null);

    // continua a copa de `keep`; se ela não está em jogo e a do outro lado está, continua a do outro
    let run = latest(k.run);
    const otherRun = latest(o.run);
    if (!isCupInProgress(run) && isCupInProgress(otherRun)) run = otherRun;
    else run ??= otherRun;

    // guardadas: a copa que acabou de ficar de fora primeiro, depois as que já estavam guardadas
    const parked: RunState[] = [];
    for (const r of [o.run, k.run, ...(k.parkedRuns ?? []), ...(o.parkedRuns ?? [])]) {
        const v = latest(r);
        if (!isCupInProgress(v) || v.seed === run?.seed || parked.some((p) => p.seed === v.seed)) continue;
        parked.push(v);
    }

    const records = mergeRecords(local.records, cloud?.records);
    // a sequência de títulos em curso é a do lado que vale: perder num aparelho zera, e o maior dos dois a ressuscitava
    if (k.records) records.streak = k.records.streak;
    const profileSrc = k.profile ?? o.profile;
    // o perfil é o de `keep`, mas treinadores e títulos liberados nos dois lados continuam liberados
    return withUnlocks({
        run: run ?? null,
        settings: mergeSettings(local.settings, cloud?.settings, keep),
        records,
        profile: mergeProfileUnlocks(
            { ...DEFAULT_PROFILE, ...(profileSrc ?? local.profile) },
            profileSrc === local.profile ? cloud?.profile : local.profile,
        ),
        dex: mergeDex(local.dex, cloud?.dex),
        moves: mergeMoves(local.moves, cloud?.moves),
        career: mergeCareer(local.career, cloud?.career),
        onboarded: local.onboarded || !!cloud?.onboarded,
        parkedRuns: parked.slice(0, MAX_PARKED),
        hall: mergeHall(local.hall, cloud?.hall),
        duels: mergeDuels(local.duels, cloud?.duels),
        daily: mergeDaily(local.daily, cloud?.daily),
        binder: mergeBinder(local.binder, cloud?.binder),
    });
}

// ------------------------------------------------------------------------------------- resumo na tela

export interface CupSummary {
    team: string;
    status: RunState['status'];
    stage: number;
    draftRound: number;
}

export interface SaveSummary {
    club: string;
    cup: CupSummary | null;
    cups: number;
    titles: number;
    seen: number;
    parked: number;
}

export const cupSummary = (r: RunState | null | undefined): CupSummary | null =>
    isCupInProgress(r) ? { team: r.teamName, status: r.status, stage: r.stage, draftRound: r.draftRound } : null;

/** O que mostrar de cada lado na pergunta (time do clube, copa em andamento e fase, copas, Pokédex). */
export function summarize(s: Partial<PersistedSave> | undefined): SaveSummary {
    return {
        club: s?.profile?.clubName ?? '',
        cup: cupSummary(s?.run),
        cups: s?.records?.cups ?? 0,
        titles: s?.records?.titles ?? 0,
        seen: dexCount(s ?? {}),
        parked: (s?.parkedRuns ?? []).filter(isCupInProgress).length,
    };
}
