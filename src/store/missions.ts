import { clubLeader } from '../engine/cup';
import { species } from '../engine/data';
import { type PokemonInstance, viewInstance } from '../engine/instance';
import { type ActiveLink, computeLinks } from '../engine/links';
import type { GoalNote, MatchDigest } from '../engine/match-stats';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { TeamSetup } from '../engine/state';
import { GYM_TM } from '../engine/tm';
import type { Records, RunState, StageResult } from './game-store';
import type { Career, Dex, HallEntry, MoveDex, Profile } from './profile';
import { CODE_TITLES } from './title-codes';

/**
 * Missões, treinadores e títulos. Tudo cosmético: 4 treinadores livres desde o começo; os outros e quase todos
 * os títulos saem de missões cumpridas jogando. Missão nova = uma linha em MISSIONS (+ o texto em
 * profile.missions.text, pt e en). Funções puras: dá para testar e para conceder de forma retroativa a partir
 * de um save antigo (o que o save guarda: recordes, Pokédex, Hall da Fama, resultados da copa).
 */
export const TRAINERS = [
    'red',
    'leaf',
    'youngster',
    'lass',
    'brock',
    'misty',
    'ltsurge',
    'erika',
    'koga',
    'sabrina',
    'blaine',
    'giovanni',
    'lorelei',
    'bruno',
    'agatha',
    'lance',
    'blue',
    'acetrainer',
    'ash',
    'bugcatcher',
    'swimmer',
    'hiker',
    'birdkeeper',
    'fisherman',
    'channeler',
    'juggler',
    'biker',
    'blackbelt',
    'pokemaniac',
    'rocker',
    'rival',
    'bill',
    'rocket',
    'gentleman',
    'beauty',
    'oak',
    'supernerd',
    'scientist',
    // lendários: versões douradas, por feitos absurdos (18/10/2026)
    'ashGold',
    'lanceGold',
    'youngsterGold',
    'redGold',
    'blueGold',
    'oakGold',
] as const;
export type TrainerId = (typeof TRAINERS)[number];

export const FREE_TRAINERS: readonly TrainerId[] = ['red', 'leaf', 'youngster', 'lass'];
export const DEFAULT_TRAINER: TrainerId = 'red';
export const trainerSrc = (id: TrainerId) => `assets/trainers/${id}.png`;

/** Treinador de origem → versão dourada (sprite gerado por scripts/build-gold-trainers.ts). */
export const GOLD_TRAINERS = {
    ash: 'ashGold',
    lance: 'lanceGold',
    youngster: 'youngsterGold',
    red: 'redGold',
    blue: 'blueGold',
    oak: 'oakGold',
} as const satisfies Partial<Record<TrainerId, TrainerId>>;
const GOLD_SET = new Set<string>(Object.values(GOLD_TRAINERS));
/** Treinador dourado: sprite com brilho e moldura dourada no perfil, VERSUS, duelo e card do título. */
export const isGoldTrainer = (id: string | null | undefined) => !!id && GOLD_SET.has(id);

/** Missão do Ash: ser campeão sofrendo no máximo isso de gols na copa inteira. */
export const ASH_MAX_CONCEDED = 5;

/** Títulos das missões (o de Pallet todo mundo tem; os de código ficam em title-codes.ts). */
export const TITLE_IDS = [
    'pallet',
    'campeao',
    'mestre',
    'perfeita',
    'kanto',
    'gelo',
    'punhos',
    'sombra',
    'dragao',
    'tempestade',
    'pescador',
    'imitador',
    'penalti',
    'virada',
    'decolando',
    'destaque',
    'shiny',
    'hatTrick',
    'goleada',
    'triangulo',
    'genese',
    'colecionador',
    'mestrePokemon',
    'golpes',
    'evoluidor',
    'artilheiro',
    'copaPerfeita',
    'senhorCeus',
    'originalClone',
    'topPercentage',
    'lendaKanto',
    'artilheiroLendario',
    'viradaHistorica',
    'todosJogaram',
    'zeNinguem',
    // coleções temáticas (0.8.6)
    'colIniciais',
    'colPassaros',
    'colFosseis',
    'colEevee',
    'colLendarios',
    'colHitmons',
    'colNidos',
    'colBrock',
    'colMisty',
] as const;
export type TitleId = (typeof TITLE_IDS)[number];
export const DEFAULT_TITLE: TitleId = 'pallet';

/** O que o save guarda e que vale para as missões. */
export interface SaveView {
    records: Pick<Records, 'titles' | 'perfect' | 'evolucoes' | 'bestStreak'>;
    dex: Dex;
    moves: MoveDex;
    career: Pick<Career, 'goalsFor'>;
    hall: HallEntry[];
    /** Copas com resultados guardados (a atual e as guardadas). */
    runs: (RunState | null | undefined)[];
    /** Missões já cumpridas (para as que dependem de outras, como Kanto Completo). */
    done: ReadonlySet<string>;
}

/** Uma partida do seu time, do jeito que as missões leem. Titulares vazios = partida antiga (só o resumo). */
export interface MatchView {
    won: boolean;
    score: [number, number];
    shootout: boolean;
    /** Titulares no apito inicial, o elenco todo (titulares + banco) e o capitão. */
    lineup: PokemonInstance[];
    squad: PokemonInstance[];
    captain: PokemonInstance | null;
    /** Gols do seu time (sem gol contra) e o placar depois de cada gol, na ordem. */
    goals: GoalNote[];
    timeline: [number, number][];
    evolutions: { from: number; into: number }[];
    links: ActiveLink[];
    /** A final da copa. */
    final: boolean;
}

export type MissionGroup = 'ginasios' | 'elite' | 'classes' | 'feitos' | 'colecao' | 'colecoes' | 'lendas';
export const MISSION_GROUPS: MissionGroup[] = [
    'ginasios',
    'elite',
    'classes',
    'feitos',
    'colecao',
    'colecoes',
    'lendas',
];

export interface Mission {
    id: string;
    group: MissionGroup;
    trainer?: TrainerId;
    title?: TitleId;
    /** Contador com barra (x/meta). */
    goal?: number;
    count?: (s: SaveView) => number;
    /** Feito que o save já mostra. */
    has?: (s: SaveView) => boolean;
    /** Feito numa partida. */
    match?: (m: MatchView) => boolean;
    /** Texto com valores (missões de ginásio). */
    vars?: Record<string, string>;
    /** Coleção temática: as espécies da lista (a barra conta quem já jogou pelo seu time). */
    species?: number[];
}

// ------------------------------------------------------------------------------------------- ajudantes
const hasType = (p: PokemonInstance, type: string) => species(p.speciesId).types.includes(type as never);
const ofType = (list: PokemonInstance[], type: string) => list.filter((p) => hasType(p, type)).length;
const hasSpecies = (list: { speciesId: number }[], ids: number[]) => list.some((p) => ids.includes(p.speciesId));
const fullLink = (m: MatchView, id: string) => m.links.some((l) => l.def.id === id && l.full);
const titles = (s: SaveView) => Math.max(s.records.titles, s.hall.length);
const seen = (s: SaveView) => Object.keys(s.dex).length;
const results = (s: SaveView) => s.runs.flatMap((r) => r?.results ?? []);
const allPicks = (s: SaveView) => s.runs.flatMap((r) => r?.picks ?? []);
/** Mais gols do seu time numa copa só (copas guardadas e Hall da Fama). */
const bestCupGoals = (s: SaveView) =>
    Math.max(
        0,
        ...s.runs.map((r) => (r?.results ?? []).reduce((n, x) => n + x.score[0], 0)),
        ...s.hall.map((h) => h.scores.reduce((n, x) => n + x[0], 0)),
    );

/** Mais gols de um Pokémon só numa copa (resumos das copas guardadas e Hall da Fama). */
const bestScorerCup = (s: SaveView) =>
    Math.max(
        0,
        ...s.runs.flatMap((r) => {
            const by = new Map<string, number>();
            for (const x of r?.results ?? [])
                for (const p of x.stats?.players ?? []) by.set(p.uid, (by.get(p.uid) ?? 0) + p.goals);
            return [...by.values()];
        }),
        ...s.hall.flatMap((h) => h.squad.map((p) => p.goals)),
    );
/** Campeão: a final vencida, com os titulares do apito inicial. */
const champion = (m: MatchView) => m.final && m.won;

/** Os 8 ginásios da copa (clube → treinador). */
const GYMS: [TrainerId, string][] = [
    ['brock', 'Pewter Rochedo'],
    ['misty', 'Cerulean Cascata'],
    ['ltsurge', 'Vermilion Voltagem'],
    ['erika', 'Celadon Arco-Íris'],
    ['koga', 'Fuchsia Ninjas'],
    ['sabrina', 'Saffron Mentes'],
    ['blaine', 'Cinnabar Vulcão'],
    ['giovanni', 'Viridian Terra'],
];

/** Sprite do treinador do clube rival (os 8 líderes, Agatha em Lavender e Lance na Liga Índigo), ou nada fora da copa. */
export const leaderTrainerOf = (clubName: string): TrainerId | undefined => clubLeader(clubName);

/** As 8 insígnias de Kanto, na ordem dos ginásios: cada uma é do líder (e sai da missão dele, então é retroativa). */
export const KANTO_BADGES = GYMS.map(([leader]) => leader);

/** Coleções temáticas: jogar (1+ minuto pelo seu time) com todos da lista dá o título. */
const COLLECTIONS: [string, number[]][] = [
    ['colIniciais', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['colPassaros', [144, 145, 146]],
    ['colFosseis', [138, 139, 140, 141, 142]],
    ['colEevee', [133, 134, 135, 136]],
    ['colLendarios', [144, 145, 146, 150, 151]],
    ['colHitmons', [106, 107]],
    ['colNidos', [29, 30, 31, 32, 33, 34]],
    // os times do anime (as mesmas famílias das sinergias em links.ts)
    ['colBrock', [95, 74, 75, 76, 37, 38, 41, 42]],
    ['colMisty', [120, 121, 54, 55, 118, 119, 116, 117]],
];
const playedIn = (s: SaveView, ids: number[]) => ids.filter((id) => (s.dex[id]?.matches ?? 0) > 0).length;

export const MISSIONS: Mission[] = [
    // Ginásios: vencer o clube do líder numa copa
    ...GYMS.map(
        ([trainer, club]): Mission => ({
            id: trainer,
            group: 'ginasios',
            trainer,
            has: (s) => results(s).some((r) => r.won && r.opponent === club),
            vars: { leader: GYM_TM[club]?.leader ?? '', city: club.split(' ')[0] },
        }),
    ),
    {
        id: 'kanto',
        group: 'ginasios',
        title: 'kanto',
        goal: GYMS.length,
        count: (s) => GYMS.filter(([id]) => s.done.has(id)).length,
    },
    // Elite 4 e campeões
    {
        id: 'lorelei',
        group: 'elite',
        trainer: 'lorelei',
        title: 'gelo',
        match: (m) => m.won && ofType(m.lineup, 'Ice') >= 2,
    },
    { id: 'bruno', group: 'elite', trainer: 'bruno', title: 'punhos', match: (m) => m.won && fullLink(m, 'hitmon') },
    {
        id: 'agatha',
        group: 'elite',
        trainer: 'agatha',
        title: 'sombra',
        match: (m) => m.won && ofType(m.lineup, 'Ghost') >= 2,
    },
    {
        id: 'lance',
        group: 'elite',
        trainer: 'lance',
        title: 'dragao',
        has: (s) => s.hall.some((h) => h.squad.some((p) => species(p.speciesId).types.includes('Dragon'))),
    },
    { id: 'blue', group: 'elite', trainer: 'blue', title: 'campeao', has: (s) => titles(s) >= 1 },
    { id: 'acetrainer', group: 'elite', trainer: 'acetrainer', title: 'mestre', goal: 5, count: titles },
    {
        id: 'ash',
        group: 'elite',
        trainer: 'ash',
        title: 'perfeita',
        // copa perfeita (zero gol) não saía nunca: 700 copas simuladas, nenhuma; ≤ 5 gols ≈ 1 em 120 copas (18/10/2026)
        has: (s) =>
            s.records.perfect > 0 || s.hall.some((h) => h.scores.reduce((n, x) => n + x[1], 0) <= ASH_MAX_CONCEDED),
    },
    // Treinadores de Kanto
    { id: 'bugcatcher', group: 'classes', trainer: 'bugcatcher', match: (m) => m.won && ofType(m.lineup, 'Bug') >= 3 },
    { id: 'swimmer', group: 'classes', trainer: 'swimmer', match: (m) => m.won && ofType(m.lineup, 'Water') >= 3 },
    {
        id: 'hiker',
        group: 'classes',
        trainer: 'hiker',
        match: (m) =>
            m.won &&
            m.score[1] === 0 &&
            !!m.lineup[0] &&
            (hasType(m.lineup[0], 'Rock') || hasType(m.lineup[0], 'Ground')),
    },
    {
        id: 'birdkeeper',
        group: 'classes',
        trainer: 'birdkeeper',
        title: 'tempestade',
        match: (m) => m.won && fullLink(m, 'passaros'),
    },
    {
        id: 'fisherman',
        group: 'classes',
        trainer: 'fisherman',
        title: 'pescador',
        match: (m) => m.evolutions.some((e) => e.from === 129 && e.into === 130),
    },
    { id: 'channeler', group: 'classes', trainer: 'channeler', match: (m) => hasSpecies(m.goals, [93, 94]) },
    {
        id: 'juggler',
        group: 'classes',
        trainer: 'juggler',
        title: 'imitador',
        match: (m) => hasSpecies(m.goals, [132]),
    },
    { id: 'biker', group: 'classes', trainer: 'biker', goal: 10, count: bestCupGoals },
    {
        id: 'blackbelt',
        group: 'classes',
        trainer: 'blackbelt',
        match: (m) => m.won && !!m.captain && hasType(m.captain, 'Fighting'),
    },
    { id: 'pokemaniac', group: 'classes', trainer: 'pokemaniac', match: (m) => m.won && m.captain?.speciesId === 25 },
    { id: 'rocker', group: 'classes', trainer: 'rocker', title: 'penalti', match: (m) => m.won && m.shootout },
    {
        id: 'rival',
        group: 'classes',
        trainer: 'rival',
        title: 'virada',
        match: (m) => m.won && m.timeline.some(([a, b]) => b - a >= 2),
    },
    {
        id: 'bill',
        group: 'classes',
        trainer: 'bill',
        match: (m) => hasSpecies(m.squad, [133]) && hasSpecies(m.squad, [134, 135, 136]),
    },
    {
        id: 'rocket',
        group: 'classes',
        trainer: 'rocket',
        title: 'decolando',
        match: (m) => m.won && m.links.some((l) => l.def.id === 'rocket'),
    },
    {
        id: 'gentleman',
        group: 'classes',
        trainer: 'gentleman',
        title: 'destaque',
        has: (s) => allPicks(s).some((p) => p.special?.kind === 'destaque' && (p.special.level ?? 1) >= 3),
    },
    {
        id: 'beauty',
        group: 'classes',
        trainer: 'beauty',
        title: 'shiny',
        has: (s) => allPicks(s).some((p) => p.shiny) || s.hall.some((h) => h.squad.some((p) => p.shiny)),
    },
    // Feitos em campo
    {
        id: 'hatTrick',
        group: 'feitos',
        title: 'hatTrick',
        match: (m) => m.goals.some((g) => m.goals.filter((x) => x.uid === g.uid).length >= 3),
    },
    { id: 'goleada', group: 'feitos', title: 'goleada', match: (m) => m.won && m.score[0] - m.score[1] >= 5 },
    { id: 'triangulo', group: 'feitos', title: 'triangulo', match: (m) => m.won && fullLink(m, 'iniciais') },
    { id: 'genese', group: 'feitos', title: 'genese', match: (m) => m.won && fullLink(m, 'genese') },
    // Coleção
    { id: 'oak', group: 'colecao', trainer: 'oak', title: 'colecionador', goal: 100, count: seen },
    { id: 'mestrePokemon', group: 'colecao', title: 'mestrePokemon', goal: 151, count: seen },
    { id: 'supernerd', group: 'colecao', trainer: 'supernerd', goal: 50, count: (s) => Object.keys(s.moves).length },
    { id: 'golpes', group: 'colecao', title: 'golpes', goal: 100, count: (s) => Object.keys(s.moves).length },
    {
        id: 'scientist',
        group: 'colecao',
        trainer: 'scientist',
        title: 'evoluidor',
        goal: 10,
        count: (s) => s.records.evolucoes ?? 0,
    },
    { id: 'artilheiro', group: 'colecao', title: 'artilheiro', goal: 100, count: (s) => s.career.goalsFor },
    // Coleções temáticas
    ...COLLECTIONS.map(
        ([id, ids]): Mission => ({
            id,
            group: 'colecoes',
            title: id as TitleId,
            species: ids,
            goal: ids.length,
            count: (s) => playedIn(s, ids),
        }),
    ),
    // Lendárias: feitos absurdos, treinadores dourados e títulos brilhando
    {
        id: 'ashGold',
        group: 'lendas',
        trainer: 'ashGold',
        title: 'copaPerfeita',
        has: (s) => s.records.perfect > 0 || s.hall.some((h) => h.perfect),
    },
    {
        id: 'lanceGold',
        group: 'lendas',
        trainer: 'lanceGold',
        title: 'senhorCeus',
        match: (m) => champion(m) && fullLink(m, 'passaros'),
    },
    {
        id: 'originalClone',
        group: 'lendas',
        title: 'originalClone',
        match: (m) => champion(m) && fullLink(m, 'genese'),
    },
    {
        id: 'youngsterGold',
        group: 'lendas',
        trainer: 'youngsterGold',
        title: 'topPercentage',
        match: (m) => champion(m) && hasSpecies(m.lineup, [19]),
    },
    {
        id: 'redGold',
        group: 'lendas',
        trainer: 'redGold',
        title: 'lendaKanto',
        goal: 5,
        count: (s) => s.records.bestStreak ?? 0,
    },
    { id: 'artilheiroLendario', group: 'lendas', title: 'artilheiroLendario', goal: 12, count: bestScorerCup },
    {
        id: 'blueGold',
        group: 'lendas',
        trainer: 'blueGold',
        title: 'viradaHistorica',
        match: (m) => champion(m) && m.timeline.some(([a, b]) => b - a >= 3),
    },
    {
        id: 'oakGold',
        group: 'lendas',
        trainer: 'oakGold',
        title: 'todosJogaram',
        goal: 151,
        count: (s) => Object.values(s.dex).filter((d) => (d?.minutes ?? 0) > 0).length,
    },
    {
        id: 'zeNinguem',
        group: 'lendas',
        title: 'zeNinguem',
        match: (m) => champion(m) && m.lineup.length > 0 && m.lineup.every((p) => viewInstance(p).overall <= 64),
    },
];

const BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));
export const missionById = (id: string) => BY_ID.get(id);
/** Missão que dá este treinador (os livres não têm). */
export const missionOfTrainer = (id: TrainerId) => MISSIONS.find((m) => m.trainer === id);

// ------------------------------------------------------------------------------------------- partidas
/** Placar depois de cada gol, na ordem (dos gols do resumo). */
function timelineOf(goals: GoalNote[]): [number, number][] {
    const s: [number, number] = [0, 0];
    return goals.map((g) => {
        s[g.team]++;
        return [s[0], s[1]];
    });
}

/** A partida que acabou de terminar. */
export function matchView(
    m: Pick<MatchResult, 'score' | 'shootout' | 'winner'>,
    digest: MatchDigest,
    team: TeamSetup | null,
    final = false,
): MatchView {
    const lineup = team?.lineup ?? [];
    const squad = [...lineup, ...(team?.bench ?? [])];
    return {
        won: m.winner === 0,
        score: m.score,
        shootout: !!m.shootout,
        lineup,
        squad,
        captain: squad.find((p) => p.uid === team?.captainUid) ?? null,
        goals: digest.goals.filter((g) => g.team === 0 && !g.ownGoal),
        timeline: timelineOf(digest.goals),
        evolutions: digest.evolutions,
        links: computeLinks(lineup),
        final,
    };
}

/** Partida guardada no save (sem os titulares: vale só para os feitos de gol, placar, pênaltis e evolução). */
export function stageView(r: StageResult): MatchView {
    const digest = r.stats?.digest ?? { goals: [], half: null, moves: {}, evolutions: [] };
    return matchView({ score: r.score, shootout: r.shootout, winner: r.won ? 0 : 1 }, digest, null, r.stage === 3);
}

// ------------------------------------------------------------------------------------------- progresso
/** Progresso de uma missão de contador (para a barra). */
export const missionCount = (m: Mission, s: SaveView) => Math.min(m.goal ?? 1, m.count?.(s) ?? 0);

/**
 * Missões que acabaram de ser cumpridas (na ordem da tabela). `matches` = partidas para conferir os feitos
 * de partida (a que acabou de terminar, ou as guardadas num save antigo).
 */
export function newMissions(
    s: Omit<SaveView, 'done'> & { done: readonly string[] },
    matches: MatchView[] = [],
): string[] {
    const done = new Set(s.done);
    const view: SaveView = { ...s, done };
    const fresh: string[] = [];
    for (const m of MISSIONS) {
        if (done.has(m.id)) continue;
        const ok =
            (m.count && m.goal !== undefined && m.count(view) >= m.goal) ||
            m.has?.(view) ||
            (m.match && matches.some(m.match));
        if (ok) {
            done.add(m.id);
            fresh.push(m.id);
        }
    }
    return fresh;
}

// ------------------------------------------------------------------------------------------- perfil
export const unlockedTrainers = (p: Pick<Profile, 'missionsDone'>): TrainerId[] => [
    ...FREE_TRAINERS,
    ...p.missionsDone.flatMap((id) => missionById(id)?.trainer ?? []),
];

/** Títulos ganhos: o de Pallet, os das missões e os de código. */
export const earnedTitles = (p: Pick<Profile, 'missionsDone' | 'redeemedTitles'>): string[] => [
    DEFAULT_TITLE,
    ...p.missionsDone.flatMap((id) => missionById(id)?.title ?? []),
    ...p.redeemedTitles.filter((id) => Object.values(CODE_TITLES).includes(id)),
];

/** Treinador que aparece: o escolhido, se está liberado neste save (senão o Red). */
export const activeTrainer = (p: Pick<Profile, 'trainer' | 'missionsDone'>): TrainerId =>
    unlockedTrainers(p).includes(p.trainer) ? p.trainer : DEFAULT_TRAINER;

/** Título que aparece: o escolhido, se foi ganho neste save (senão o de Pallet). */
export const activeTitle = (p: Pick<Profile, 'title' | 'missionsDone' | 'redeemedTitles'>): string =>
    earnedTitles(p).includes(p.title) ? p.title : DEFAULT_TITLE;

const union = (a: readonly string[], b: readonly string[] = []) => [...new Set([...a, ...b])];

/** Junta o perfil da nuvem com o do aparelho: vale o de `keep`, mas missão cumprida e título resgatado não se perdem. */
export function mergeProfileUnlocks(keep: Profile, other: Partial<Profile> | undefined): Profile {
    return {
        ...keep,
        missionsDone: union(keep.missionsDone, other?.missionsDone),
        redeemedTitles: union(keep.redeemedTitles, other?.redeemedTitles),
    };
}
