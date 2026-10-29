import type { PersistedSave } from './game-store';

/**
 * Balões do tutorial (coach marks): cada um aparece uma vez por modo. O que já foi visto fica em `profile.coach`
 * (no save e na nuvem, então trocar de aparelho não repete). Save sem o campo (antes da 0.9.7) ganha o que dá pra
 * inferir do histórico: quem já jogou o modo não vê o balão dele.
 */
export const COACH_IDS = [
    'intro',
    'rota',
    'rotaGrupo',
    'rotaNova',
    'relampago',
    'relampagoDraft',
    'relampagoJogo',
    'relampagoVestiario',
    'duelo',
    'dueloSala',
    'dia',
    'liga',
] as const;
export type CoachId = (typeof COACH_IDS)[number];

const RELAMPAGO: readonly CoachId[] = ['relampago', 'relampagoDraft', 'relampagoVestiario', 'relampagoJogo'];

/** "Pular" vale pro grupo inteiro (os balões do mesmo modo em telas diferentes). */
export const COACH_GROUPS: Record<CoachId, readonly CoachId[]> = {
    intro: ['intro'],
    rota: ['rota'],
    rotaGrupo: ['rotaGrupo'],
    rotaNova: ['rotaNova'],
    relampago: RELAMPAGO,
    relampagoDraft: RELAMPAGO,
    relampagoJogo: RELAMPAGO,
    relampagoVestiario: RELAMPAGO,
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

/**
 * Chama `cb` quando o save terminar de carregar, inclusive se já terminou entre o 1º desenho e o efeito (só assinar
 * o aviso perdia esse caso: a Home de quem voltou ficava sem os modos).
 */
export function whenHydrated(
    persist: { hasHydrated(): boolean; onFinishHydration(fn: () => void): () => void },
    cb: () => void,
): () => void {
    const off = persist.onFinishHydration(cb);
    if (persist.hasHydrated()) cb();
    return off;
}

/** 1ª visita: nada jogado em modo nenhum (nem copa começada). A Home mostra só o "Jogar". */
export const isFirstVisit = (s: History) => coachPlayed(s).length === 0;

/**
 * Menu de modos na abertura (antes da Home): só pra quem já terminou uma partida (copa, Rota ou Duelo) antes de abrir o
 * jogo agora. O App decide uma vez, quando o save carrega: quem termina a 1ª partida nesta visita não ganha o menu no
 * meio da sessão. Link de duelo e demo abrem a tela deles direto.
 */
export function modeMenuDue(s: Pick<PersistedSave, 'career' | 'records' | 'duels'>, search = ''): boolean {
    const q = new URLSearchParams(search);
    if (q.has('duelo') || q.has('demo')) return false;
    return s.career.matches > 0 || s.records.cups > 0 || s.duels.length > 0;
}

/** "Agora tem a Rota Índigo": só na Home completa logo depois da 1ª copa, pra quem ainda não jogou a Rota. */
export const rotaNovaDue = (records: { cups: number; longCups?: number }, coach: readonly string[] | undefined) =>
    records.cups === 1 && !records.longCups && coachSeen(coach, 'intro') && !coachSeen(coach, 'rotaNova');

/** Balão `relampagoJogo` na 1ª partida: só depois do 1º gol ou no intervalo (não por cima do campo no apito inicial). */
export const relampagoJogoDue = (score: readonly [number, number], halftime: boolean) =>
    halftime || score[0] + score[1] > 0;

/** Save de antes dos balões: `coach` nasce com o que a pessoa já jogou. Quem já tem o campo fica como está. */
export function withCoachBaseline(s: PersistedSave): PersistedSave {
    if (Array.isArray(s.profile.coach)) return s;
    return { ...s, profile: { ...s.profile, coach: coachPlayed(s) } };
}

export const coachSeen = (coach: readonly string[] | undefined, id: CoachId) => !!coach?.includes(id);
