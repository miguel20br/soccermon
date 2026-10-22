import type { PersistedSave } from './game-store';

/**
 * Balões do tutorial (coach marks): cada um aparece uma vez por modo. O que já foi visto fica em `profile.coach`
 * (no save e na nuvem, então trocar de aparelho não repete). Save sem o campo (antes da 0.9.6) ganha o que dá pra
 * inferir do histórico: quem já jogou o modo não vê o balão dele.
 */
export const COACH_IDS = [
    'intro',
    'rota',
    'rotaGrupo',
    'relampago',
    'relampagoDraft',
    'relampagoJogo',
    'duelo',
    'dueloSala',
    'dia',
    'liga',
] as const;
export type CoachId = (typeof COACH_IDS)[number];

const RELAMPAGO: readonly CoachId[] = ['relampago', 'relampagoDraft', 'relampagoJogo'];

/** "Pular" vale pro grupo inteiro (os balões do mesmo modo em telas diferentes). */
export const COACH_GROUPS: Record<CoachId, readonly CoachId[]> = {
    intro: ['intro'],
    rota: ['rota'],
    rotaGrupo: ['rotaGrupo'],
    relampago: RELAMPAGO,
    relampagoDraft: RELAMPAGO,
    relampagoJogo: RELAMPAGO,
    duelo: ['duelo', 'dueloSala'],
    dueloSala: ['duelo', 'dueloSala'],
    dia: ['dia'],
    liga: ['liga'],
};

/** Botões da Ajuda ("Como funciona"): um por modo, na ordem. */
export const COACH_REPLAY: readonly CoachId[] = ['intro', 'rota', 'rotaGrupo', 'relampago', 'duelo', 'dia', 'liga'];

type History = Pick<PersistedSave, 'run' | 'parkedRuns' | 'records' | 'duels' | 'daily' | 'hall' | 'onboarded'>;

/** Os balões que quem tem este histórico não precisa ver. */
export function coachPlayed(s: History): CoachId[] {
    const r = s.records;
    const runs = [s.run, ...(s.parkedRuns ?? [])].filter((x): x is NonNullable<typeof x> => !!x);
    const long = (r.longCups ?? 0) > 0 || runs.some((x) => x.mode === 'longa');
    const quick = r.cups - (r.longCups ?? 0) > 0 || runs.some((x) => x.mode !== 'longa') || s.hall.length > 0;
    const out: CoachId[] = [];
    if (s.onboarded || r.cups > 0 || runs.length) out.push('intro');
    if (long) out.push('rota');
    if ((r.longCups ?? 0) > 0 || runs.some((x) => x.mode === 'longa' && !!x.group)) out.push('rotaGrupo');
    if (quick) out.push(...RELAMPAGO);
    if (s.duels.length > 0 || (r.duelWins ?? 0) > 0) out.push('duelo', 'dueloSala');
    if (s.daily.length > 0) out.push('dia');
    return out;
}

/** Save de antes dos balões: `coach` nasce com o que a pessoa já jogou. Quem já tem o campo fica como está. */
export function withCoachBaseline(s: PersistedSave): PersistedSave {
    if (Array.isArray(s.profile.coach)) return s;
    return { ...s, profile: { ...s.profile, coach: coachPlayed(s) } };
}

export const coachSeen = (coach: readonly string[] | undefined, id: CoachId) => !!coach?.includes(id);
