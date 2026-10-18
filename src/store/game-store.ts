import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Position } from '../engine/attributes';
import { buildCupOpponents, CUP_STAGES } from '../engine/cup';
import { BENCH_SIZE, captainOptions, DRAFT_PICKS, playerDraftOptions } from '../engine/draft';
import { evolutionTarget, evolveInstance, evoProgress } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import { viewInstance } from '../engine/instance';
import { type MatchDigest, matchDigest, type PlayerLine, playerLines, teamTotals } from '../engine/match-stats';
import { everyoneIn, mvpScore } from '../engine/mvp';
import { type Reward, rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import {
    DESTAQUE_LEVEL_UP_RATING,
    DESTAQUE_MAX_LEVEL,
    rollSpecial as roll,
    SPECIALS_LIVE,
    weeklyEventType,
} from '../engine/specials';
import { teachMove } from '../engine/tm';
import { detectLang, type Lang } from '../i18n/lang';
import { addDuel, type DuelRecord, MAX_DUELS } from './duels';
import { activeTitle, activeTrainer, matchView, newMissions, stageView } from './missions';
import {
    type Career,
    clubColorHex,
    DEFAULT_PROFILE,
    type Dex,
    EDITION_BIT,
    EMPTY_CAREER,
    editionBits,
    type HallEntry,
    MAX_HALL,
    type MoveDex,
    markOvr,
    markSeen,
    type Profile,
    recordEditions,
    recordMatchInCareer,
    recordMatchInDex,
    recordMovesSeen,
    recordTitleInDex,
    tagFromName,
} from './profile';

/** Edição especial só quando as cartas novas estão no jogo. */
const rollSpecial: typeof roll = (inst, ev) => (SPECIALS_LIVE ? roll(inst, ev) : inst);

import { ENGINE_VERSION } from '../engine/config';
import type { CornerPlan, MatchOrder, Tactic, TeamSetup } from '../engine/state';

export type Screen =
    | 'home'
    | 'draft'
    | 'lineup'
    | 'match'
    | 'result'
    | 'reward'
    | 'settings'
    | 'credits'
    | 'profile'
    | 'help'
    | 'duel';
export type CryStyle = 'legacy' | 'latest';
export type PlaybackSpeed = 1 | 2 | 4 | 8 | 'highlights';

/** Cor padrão do seu time (Vermelho). A cor de verdade vem do perfil: `clubColorHex(profile.clubColor)`. */
export const PLAYER_COLOR = 0xe8423f;
export const START_REROLLS = 2;

export interface StageResult {
    stage: number;
    opponent: string;
    score: [number, number];
    shootout: [number, number] | null;
    won: boolean;
    /** Craque do seu time que virou carta Destaque nesta partida. */
    destaqueUid?: string | null;
    /** Resumo da partida para as estatísticas da copa (partidas antigas não têm). */
    stats?: StageStats;
}

/** Resumo de uma partida guardado no run (o MatchResult inteiro é grande demais para salvar). */
export interface StageStats {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    players: {
        uid: string;
        speciesId: number;
        name: string;
        role: string;
        rating: number;
        minutes: number;
        distance: number;
        goals: number;
        assists: number;
        shots: number;
        passes: number;
        passesCompleted: number;
        tacklesWon: number;
        interceptions: number;
        saves: number;
        movesUsed: number;
    }[];
    /** Gols, golpes, evoluções e intervalo (partidas antes da 0.8.2 não têm). */
    digest?: MatchDigest;
}

/** O que o título trouxe de novo, calculado no apito final (antes de somar no perfil). */
export interface ChampMemo {
    titleNo: number;
    /** Nº da copa perfeita (null se não foi perfeita). */
    perfectNo: number | null;
    /** Espécies que bateram a melhor nota de partida delas nesta copa. */
    newBests: { speciesId: number; name: string; rating: number }[];
    /** Espécies que ganharam o primeiro título. */
    firstTitles: number[];
    /** O desfile do Hall da Fama já passou (só aparece uma vez). */
    paraded?: boolean;
}

export type RunStatus = 'formation' | 'captain' | 'drafting' | 'lineup' | 'reward' | 'eliminated' | 'champion';

/** Run do modo copa (roguelike). Separada do futuro CareerSave. */
export interface RunState {
    schemaVersion: 3;
    seed: string;
    teamName: string;
    status: RunStatus;
    formation: FormationId;
    /** Rodada do draft: 0 = capitão, 1..6 = vagas. */
    draftRound: number;
    /** Vaga escolhida na rodada atual (opções só aparecem depois dela). */
    draftSlot: SlotRef | null;
    options: PokemonInstance[];
    /** Rerolls restantes (servem no draft e nas recompensas) e quantos já foram gastos (entra na seed). */
    rerolls: number;
    rerollsUsed: number;
    picks: PokemonInstance[];
    /** uids nas vagas da formação; '' = vaga aberta durante o draft */
    lineup: string[];
    bench: string[];
    captainUid: string | null;
    tactic: Tactic;
    /** Instrução de escanteio (padrão: Variar) e quem cobra (padrão: automático). Saves antigos não têm. */
    cornerPlan?: CornerPlan;
    cornerTakerUid?: string | null;
    opponents: TeamSetup[];
    stage: number;
    results: StageResult[];
    rewards: Reward[];
    /**
     * Partida iniciada e ainda sem resultado: o time fica travado até o apito final
     * (sair no meio e voltar retoma a mesma partida, sem trocar escalação).
     */
    lockedTeam: TeamSetup | null;
    /** Tipo em evento quando a copa começou (cartas Evento desse tipo no draft). */
    eventType?: string | null;
    /**
     * Partida em andamento: ordens do técnico e até onde foi assistida. Sair e voltar retoma do mesmo ponto
     * com as mesmas ordens (antes dava para sair e tentar de novo até ganhar).
     */
    live?: LiveMatch | null;
    /** Começo e fim da copa (ms), para a duração na tela do título. */
    startedAt?: number;
    endedAt?: number;
    champ?: ChampMemo;
    /** Pokédex (vistos) e golpes descobertos quando a copa começou: o fim da copa mostra quanto cresceu. */
    startCounts?: { seen: number; moves: number };
}

export interface LiveMatch {
    stage: number;
    orders: MatchOrder[];
    tick: number;
    /** `ENGINE_VERSION` de quando a partida começou (sem = antes da 0.8.4). */
    engine?: number;
}

/** Partida em andamento desta fase, se ainda for do mesmo motor (senão recomeça do 0 a 0). */
export const liveOf = (run: { stage: number; live?: LiveMatch | null } | null | undefined): LiveMatch | null =>
    run?.live && run.live.stage === run.stage && run.live.engine === ENGINE_VERSION ? run.live : null;

export type NamesOnField = 'all' | 'mine' | 'none';
export type ArrowSize = 'small' | 'medium' | 'large';
export type ReduceMotion = 'system' | 'on' | 'off';
/** Velocidade a que a partida cai na chance de gol (0 = não cai). */
export type ChanceSpeed = 0 | 1 | 2 | 4;

export interface Settings {
    cries: CryStyle;
    /** Volume geral (0..1); gritos e efeitos têm o próprio volume por cima dele. */
    volume: number;
    criesVolume: number;
    sfxVolume: number;
    crowdVolume: number;
    /** Grito de gol: o cry do capitão toca junto com a torcida no seu gol. */
    goalCry: boolean;
    /** Velocidade com que a partida começa. */
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Velocidade nas chances de gol (gol, trave, defesa), mesmo no 8x. */
    chanceSpeed: ChanceSpeed;
    /** Nomes dos Pokémon na quadra. */
    namesOnField: NamesOnField;
    /** Setinha na cabeça dos Pokémon do seu time. */
    arrowSize: ArrowSize;
    /** Menos tremida, flash e zoom ('system' segue o "reduzir movimento" do aparelho). */
    reduceMotion: ReduceMotion;
    /** Dicas do "Como jogar" nas telas. */
    tips: boolean;
    /** Pedir confirmação antes de sair de uma partida em andamento. */
    confirmLeave: boolean;
    /** Enviar estatísticas anônimas do jogo (sem conta, sem cookie). */
    stats: boolean;
    /** Idioma (o padrão segue o navegador). */
    lang: Lang;
}

export const DEFAULT_SETTINGS: Settings = {
    cries: 'legacy',
    volume: 0.6,
    criesVolume: 1,
    sfxVolume: 1,
    crowdVolume: 1,
    goalCry: true,
    // quem nunca jogou começa em 1x pra ver a partida (decidido em 18/10/2026); a velocidade que a pessoa escolher na
    // partida ou em Configurações fica salva e vira a dela
    speed: 1,
    cinematic: true,
    chanceSpeed: 1,
    namesOnField: 'all',
    arrowSize: 'medium',
    reduceMotion: 'system',
    tips: true,
    confirmLeave: true,
    stats: true,
    lang: detectLang(),
};

export interface Records {
    cups: number;
    titles: number;
    perfect: number;
    /** Cartas Destaque conquistadas e Ícones escalados. */
    destaques?: number;
    icones?: number;
    /** Evoluções no meio da partida (do seu time). */
    evolucoes?: number;
    /** Títulos seguidos (copa perdida ou abandonada zera) e a melhor sequência. */
    streak?: number;
    bestStreak?: number;
}

export type SlotRef = { zone: 'lineup' | 'bench'; index: number };

/** Estado do jogo (save + tela atual). */
export type GameState = GameStore;
export interface GameStore {
    screen: Screen;
    run: RunState | null;
    settings: Settings;
    records: Records;
    profile: Profile;
    /** Pokédex: espécies vistas/jogadas e a carreira de cada uma. */
    dex: Dex;
    /** Golpes descobertos (vistos em campo nas suas partidas). */
    moves: MoveDex;
    career: Career;
    /** Já viu o passo a passo de boas-vindas. */
    onboarded: boolean;
    /**
     * Copas em andamento guardadas para depois (a mais recente primeiro). Nascem quando o save do aparelho e o
     * da conta têm copas diferentes: a escolhida continua e a outra fica aqui, nunca some sem aviso.
     */
    parkedRuns: RunState[];
    /** Hall da Fama: os títulos, do mais recente ao mais antigo. */
    hall: HallEntry[];
    /** Duelos amistosos (só no save), do mais recente ao mais antigo. */
    duels: DuelRecord[];
    recordDuel(rec: DuelRecord): void;
    /** Partida atual (não persistida — snapshots são grandes). */
    match: MatchResult | null;
    /** Missões cumpridas agora há pouco, na fila do aviso (não persistida: o aviso é só na hora). */
    unlockQueue: string[];
    /** O aviso do primeiro da fila já passou. */
    shiftUnlock(): void;
    go(screen: Screen): void;
    newRun(teamName?: string, seed?: string): void;
    abandonRun(): void;
    chooseFormation(id: FormationId): void;
    chooseSlot(slot: SlotRef): void;
    /** Capitão: precisa da vaga. Rodadas seguintes: usa a vaga escolhida. */
    pick(uid: string, slot?: SlotRef): void;
    reroll(): void;
    swapSlots(a: SlotRef, b: SlotRef): void;
    setFormation(id: FormationId): void;
    setTactic(t: Tactic): void;
    setCorner(patch: { cornerPlan?: CornerPlan; cornerTakerUid?: string | null }): void;
    moveItem(fromUid: string, toUid: string): void;
    setMatch(m: MatchResult | null): void;
    lockMatch(team: TeamSetup): void;
    /** Guarda as ordens e o ponto da partida em andamento. */
    saveLive(patch: Partial<Omit<LiveMatch, 'stage'>>): void;
    recordResult(m: MatchResult): void;
    /** O desfile do Hall da Fama já passou nesta copa. */
    markParaded(): void;
    /**
     * Pega a recompensa. MT: `forgetSlot` é a vaga do golpe esquecido (ou o tamanho do moveset, se há vaga).
     * Item: se quem recebe já segura um, `passTo` é quem fica com o antigo (sem `passTo`, o antigo é descartado).
     */
    claimReward(index: number, targetUid: string, forgetSlot?: number, passTo?: string): void;
    skipReward(): void;
    rerollReward(): void;
    advance(): void;
    updateSettings(patch: Partial<Settings>): void;
    updateProfile(patch: Partial<Profile>): void;
    setOnboarded(done: boolean): void;
    /** Retoma uma copa guardada; a atual, se estiver em andamento, vai para o lugar dela. */
    resumeParked(seed: string): void;
    /** Joga fora uma copa guardada (o jogador confirmou). */
    discardParked(seed: string): void;
}

/** Quantas copas guardadas cabem no save (passou disso, sai a mais antiga). */
export const MAX_PARKED = 3;

/** Copa ainda em jogo (não terminou em título nem em eliminação). */
export const isCupInProgress = (run: RunState | null | undefined): run is RunState =>
    !!run && run.status !== 'eliminated' && run.status !== 'champion';

const idbStorage: StateStorage = {
    getItem: async (name) => (await get(name)) ?? null,
    setItem: (name, value) => set(name, value),
    removeItem: (name) => del(name),
};

export const isDraftComplete = (run: RunState) => [...run.lineup, ...run.bench].every((u) => u !== '');
export const slotRole = (run: RunState, slot: SlotRef) =>
    slot.zone === 'bench' ? 'ANY' : formationOf(run.formation).slots[slot.index];

function rollCaptains(run: RunState): PokemonInstance[] {
    const rng = new Rng(run.seed, `captain-r${run.rerollsUsed}`);
    return captainOptions(rng, new Set()).map((o) => rollSpecial(o, run.eventType ?? null));
}

function rollOptions(run: RunState, slot: SlotRef): PokemonInstance[] {
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const role = slotRole(run, slot);
    const rng = new Rng(run.seed, `draft-${run.draftRound}-${role}-r${run.rerollsUsed}`);
    return playerDraftOptions(rng, run.draftRound, taken, role).map((o) => rollSpecial(o, run.eventType ?? null));
}

/** Recompensas da fase; o reforço sorteado (não o contratado do adversário) pode vir com edição especial. */
function rollRewards(run: RunState, reroll: number): Reward[] {
    return rewardOptions(run.seed, run.stage, reroll, run.picks, defeatedOf(run)).map((r) =>
        r.kind === 'pokemon' && !r.from ? { ...r, inst: rollSpecial(r.inst, run.eventType ?? null) } : r,
    );
}

export function playerTeam(run: RunState, color = clubColorHex(useGame.getState().profile.clubColor)): TeamSetup {
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    return {
        name: run.teamName,
        lineup: run.lineup.map((u) => byUid.get(u)!),
        bench: run.bench.map((u) => byUid.get(u)!),
        tactic: run.tactic,
        color,
        formation: run.formation,
        captainUid: run.captainUid,
        manualSubs: true,
        corner: run.cornerPlan ?? 'mixed',
        cornerTakerUid: run.cornerTakerUid ?? null,
    };
}

/** Time eliminado na fase atual (de onde dá para contratar um Pokémon). */
const defeatedOf = (run: RunState) => {
    const opp = run.opponents[run.stage];
    return opp ? { name: opp.name, players: [...opp.lineup, ...opp.bench] } : undefined;
};
/** Posição em que ele está escalado (titular), para a carta mostrar os números daquela vaga. */
export const lineupPosition = (run: RunState, uid: string): Position | undefined => {
    const i = run.lineup.indexOf(uid);
    return i >= 0 ? formationOf(run.formation).slots[i] : undefined;
};

/** Sequência de títulos depois de uma copa que acabou (ganha soma; perdida ou abandonada zera). */
export function streakAfter(r: Records, won: boolean): Pick<Records, 'streak' | 'bestStreak'> {
    const streak = won ? (r.streak ?? 0) + 1 : 0;
    return { streak, bestStreak: Math.max(r.bestStreak ?? 0, streak) };
}

export const isPerfectCup = (run: RunState) =>
    run.status === 'champion' && run.results.every((r) => r.won && r.score[1] === 0);

/** O que o título trouxe de novo, comparando com os recordes e a Pokédex de antes dele. */
export function champMemo(run: RunState, records: Records, dexBefore: Dex): ChampMemo {
    const best = new Map<number, { name: string; rating: number }>();
    for (const r of run.results)
        for (const p of r.stats?.players ?? []) {
            if (p.minutes < 1) continue;
            const cur = best.get(p.speciesId);
            if (!cur || p.rating > cur.rating) best.set(p.speciesId, { name: p.name, rating: p.rating });
        }
    const newBests = [...best]
        // recorde que vale festa: nota alta (7,5+) acima da melhor que ele já teve pelo seu time
        .filter(
            ([id, b]) =>
                b.rating >= 7.5 && (dexBefore[id]?.matches ?? 0) > 0 && b.rating > (dexBefore[id]?.bestRating ?? 0),
        )
        .map(([speciesId, b]) => ({ speciesId, ...b }))
        .sort((a, b) => b.rating - a.rating);
    return {
        titleNo: records.titles + 1,
        perfectNo: isPerfectCup(run) ? records.perfect + 1 : null,
        newBests,
        firstTitles: [...best.keys()].filter((id) => (dexBefore[id]?.titles ?? 0) === 0),
    };
}

/** Entrada do Hall da Fama: o elenco campeão com nota de carta e gols na copa. */
export function hallEntry(run: RunState, profile: Profile): HallEntry {
    const goals = new Map<string, number>();
    for (const r of run.results)
        for (const p of r.stats?.players ?? []) goals.set(p.uid, (goals.get(p.uid) ?? 0) + p.goals);
    const squad = [...run.lineup, ...run.bench]
        .map((uid) => run.picks.find((p) => p.uid === uid))
        .filter((p): p is PokemonInstance => !!p)
        .map((p) => {
            const v = viewInstance(p);
            return {
                speciesId: p.speciesId,
                shiny: p.shiny,
                name: v.displayName,
                ovr: v.overall,
                goals: goals.get(p.uid) ?? 0,
                captain: p.uid === run.captainUid,
            };
        });
    return {
        id: run.seed,
        date: run.endedAt ?? Date.now(),
        club: run.teamName,
        clubColor: profile.clubColor,
        formation: run.formation,
        titleNo: run.champ?.titleNo ?? 1,
        perfect: isPerfectCup(run),
        scores: run.results.map((r) => [r.score[0], r.score[1]]),
        squad,
        trainer: activeTrainer(profile),
        trainerTitle: activeTitle(profile),
    };
}

/** Lê `?seed=` da URL (desafio compartilhado). */
export function seedFromUrl(): string | null {
    try {
        const seed = new URLSearchParams(window.location.search).get('seed');
        return seed && /^[a-z0-9-]{1,32}$/i.test(seed) ? seed : null;
    } catch {
        return null;
    }
}

/** O que vai para o IndexedDB (e para a nuvem). */
export type PersistedSave = Pick<
    GameStore,
    | 'run'
    | 'settings'
    | 'records'
    | 'profile'
    | 'dex'
    | 'moves'
    | 'career'
    | 'onboarded'
    | 'parkedRuns'
    | 'hall'
    | 'duels'
>;

/** Copa salva com formato aceitável (save importado ou da nuvem): senão é descartada, não trava o jogo. */
const runShapeOk = (r: unknown): r is RunState => {
    const o = r as Partial<RunState> | null;
    return (
        !!o &&
        typeof o === 'object' &&
        typeof o.seed === 'string' &&
        [o.picks, o.lineup, o.bench, o.opponents, o.results].every(Array.isArray)
    );
};

/** Versão atual do save (a mesma do `persist`). */
export const SAVE_VERSION = 9;

/**
 * Álbum de edições pra quem já jogava (v9): o que dá pra saber do save. Quem jogou ganha a Normal (quase toda carta
 * é Normal); o Hall da Fama dá a Shiny; as copas guardadas dão a edição de cada carta que jogou (a Destaque só se
 * jogou depois de virar Destaque).
 */
export function backfillEditions(dex: Dex, hall: HallEntry[], runs: (RunState | null | undefined)[]): Dex {
    const got: [number, number][] = Object.keys(dex).map((id) => [Number(id), EDITION_BIT.normal]);
    for (const h of hall) for (const p of h.squad) if (p.shiny) got.push([p.speciesId, EDITION_BIT.shiny]);
    for (const r of runs) {
        if (!r) continue;
        for (const res of r.results)
            for (const line of res.stats?.players ?? []) {
                const card = r.picks.find((p) => p.uid === line.uid);
                if (!card || line.minutes < 1) continue;
                const starAt = r.results.find((x) => x.destaqueUid === card.uid)?.stage ?? Infinity;
                const asPlayed =
                    card.special?.kind === 'destaque' && res.stage <= starAt ? { ...card, special: null } : card;
                got.push([line.speciesId, editionBits(asPlayed)]);
            }
    }
    return recordEditions(dex, got);
}

/**
 * Missões que o save já garante (sem aviso: é retroativo). Feitos de partida contam pelas partidas guardadas nas
 * copas do save (o resumo de cada uma); o resto sai de recordes, Pokédex, golpes, carreira e Hall da Fama.
 */
export function withUnlocks(save: PersistedSave): PersistedSave {
    const runs = [save.run, ...save.parkedRuns];
    const fresh = newMissions(
        { ...save, runs, done: save.profile.missionsDone },
        runs.flatMap((r) => r?.results ?? []).map(stageView),
    );
    return fresh.length
        ? { ...save, profile: { ...save.profile, missionsDone: [...save.profile.missionsDone, ...fresh] } }
        : save;
}

/**
 * Atualiza um save antigo (ou importado de um arquivo) para o formato atual. Versões antigas tinham outro
 * formato de draft: descarta a run e mantém o resto. Na v5 a Pokédex nasce com o que dá para tirar da copa
 * em andamento, e quem já jogava não vê o passo a passo de boas-vindas de novo.
 */
export function migrateSave(old: Partial<PersistedSave>, version: number): PersistedSave {
    const settings: Settings = { ...DEFAULT_SETTINGS, ...old.settings };
    const records = old.records ?? { cups: 0, titles: 0, perfect: 0 };
    const run = version < 3 || !old.run ? null : { ...old.run, lockedTeam: old.run.lockedTeam ?? null };
    const profile: Profile = {
        ...DEFAULT_PROFILE,
        ...(version < 5 && run ? { clubName: run.teamName, clubTag: tagFromName(run.teamName) } : {}),
        ...old.profile,
    };
    // v7: treinador e títulos (saves e nuvem antigos não têm; listas estragadas viram vazias)
    if (!Array.isArray(profile.missionsDone)) profile.missionsDone = [];
    if (!Array.isArray(profile.redeemedTitles)) profile.redeemedTitles = [];
    let dex: Dex = old.dex ?? {};
    if (version < 5 && run) {
        dex = markSeen(
            dex,
            run.picks.map((p) => p.speciesId),
        );
        for (const r of run.results) {
            const lines = (r.stats?.players ?? []).map((p) => ({
                team: 0 as const,
                speciesId: p.speciesId,
                minutes: p.minutes,
                rating: p.rating,
                stats: { goals: p.goals, assists: p.assists },
            }));
            dex = recordMatchInDex(dex, lines as unknown as PlayerLine[], r.won);
        }
        dex = markOvr(
            dex,
            run.picks.map((p): [number, number] => [p.speciesId, viewInstance(p).overall]),
        );
    }
    // v9: álbum de edições (retroativo)
    const hall = Array.isArray(old.hall) ? old.hall.slice(0, MAX_HALL) : [];
    const parkedRuns =
        version < 3 || !Array.isArray(old.parkedRuns)
            ? []
            : old.parkedRuns
                  .filter(runShapeOk)
                  .map((r) => ({ ...r, lockedTeam: r.lockedTeam ?? null }))
                  .slice(0, MAX_PARKED);
    if (version < 9) dex = backfillEditions(dex, hall, [run, ...parkedRuns]);
    return withUnlocks({
        run,
        settings,
        records,
        profile,
        dex,
        moves: old.moves ?? {},
        career: { ...EMPTY_CAREER, ...old.career },
        onboarded: old.onboarded ?? (version < 5 && (records.cups > 0 || !!run)),
        // campo opcional (saves e versões anteriores não têm): copas guardadas válidas, no máximo MAX_PARKED
        parkedRuns,
        // v6: Hall da Fama
        hall,
        // v8: histórico dos duelos amistosos
        duels: Array.isArray(old.duels)
            ? old.duels.filter((x) => x && typeof x.id === 'string').slice(0, MAX_DUELS)
            : [],
    });
}

export const useGame = create<GameStore>()(
    persist(
        (setState, getState) => {
            const updateRun = (patch: Partial<RunState>) => {
                const run = getState().run;
                if (run) setState({ run: { ...run, ...patch } });
            };
            /** Pokédex com estas espécies marcadas como vistas. */
            const seenDex = (list: { speciesId: number }[]) =>
                markSeen(
                    getState().dex,
                    list.map((p) => p.speciesId),
                );
            const ovrOf = (p: PokemonInstance): [number, number] => [p.speciesId, viewInstance(p).overall];
            return {
                screen: 'home',
                run: null,
                settings: DEFAULT_SETTINGS,
                records: { cups: 0, titles: 0, perfect: 0 },
                profile: DEFAULT_PROFILE,
                dex: {},
                moves: {},
                career: EMPTY_CAREER,
                onboarded: false,
                parkedRuns: [],
                hall: [],
                duels: [],
                recordDuel: (rec) => setState({ duels: addDuel(getState().duels, rec) }),
                match: null,
                unlockQueue: [],

                go: (screen) => setState({ screen }),

                newRun: (teamName = getState().profile.clubName || 'Pallet FC', seed) => {
                    const runSeed = seed ?? Math.floor(Math.random() * 1e9).toString(36);
                    const run: RunState = {
                        schemaVersion: 3,
                        seed: runSeed,
                        teamName,
                        status: 'formation',
                        formation: DEFAULT_FORMATION,
                        draftRound: 0,
                        draftSlot: null,
                        options: [],
                        rerolls: START_REROLLS,
                        rerollsUsed: 0,
                        picks: [],
                        lineup: ['', '', '', '', ''],
                        bench: Array(BENCH_SIZE).fill(''),
                        captainUid: null,
                        tactic: 'balanced',
                        opponents: buildCupOpponents(runSeed),
                        stage: 0,
                        results: [],
                        rewards: [],
                        lockedTeam: null,
                        live: null,
                        eventType: weeklyEventType(new Date()),
                        startedAt: Date.now(),
                        startCounts: {
                            seen: Object.keys(getState().dex).length,
                            moves: Object.keys(getState().moves).length,
                        },
                    };
                    setState({ run, match: null, screen: 'draft' });
                },

                abandonRun: () =>
                    setState({
                        run: null,
                        match: null,
                        screen: 'home',
                        records: { ...getState().records, ...streakAfter(getState().records, false) },
                    }),

                chooseFormation: (formation) => {
                    const run = getState().run;
                    if (run?.status !== 'formation') return;
                    const next: RunState = { ...run, formation, status: 'captain' };
                    next.options = rollCaptains(next);
                    setState({ run: next, dex: seenDex(next.options) });
                },

                chooseSlot: (slot) => {
                    const run = getState().run;
                    if (run?.status !== 'drafting' || run.draftSlot) return; // vaga travada até escolher
                    const zone = slot.zone === 'lineup' ? run.lineup : run.bench;
                    if (zone[slot.index] !== '') return;
                    const options = rollOptions(run, slot);
                    setState({ run: { ...run, draftSlot: slot, options }, dex: seenDex(options) });
                },

                pick: (uid, slotArg) => {
                    const run = getState().run;
                    if (!run || (run.status !== 'captain' && run.status !== 'drafting')) return;
                    const slot = run.status === 'captain' ? slotArg : run.draftSlot;
                    const choice = run.options.find((o) => o.uid === uid);
                    if (!slot || !choice) return;
                    const lineup = [...run.lineup];
                    const bench = [...run.bench];
                    const zone = slot.zone === 'lineup' ? lineup : bench;
                    if (zone[slot.index] !== '') return;
                    zone[slot.index] = choice.uid;
                    if (choice.special?.kind === 'icone') {
                        const records = getState().records;
                        setState({ records: { ...records, icones: (records.icones ?? 0) + 1 } });
                    }
                    const next: RunState = {
                        ...run,
                        picks: [...run.picks, choice],
                        lineup,
                        bench,
                        draftRound: run.draftRound + 1,
                        draftSlot: null,
                        options: [],
                        captainUid: run.status === 'captain' ? choice.uid : run.captainUid,
                        status: 'drafting',
                    };
                    const dex = markOvr(getState().dex, [ovrOf(choice)]);
                    if (isDraftComplete(next) || next.picks.length >= DRAFT_PICKS) {
                        next.status = 'lineup';
                        setState({ run: next, screen: 'lineup', dex });
                    } else {
                        setState({ run: next, dex });
                    }
                },

                reroll: () => {
                    const run = getState().run;
                    if (!run || run.rerolls <= 0 || !run.options.length) return;
                    const next: RunState = { ...run, rerolls: run.rerolls - 1, rerollsUsed: run.rerollsUsed + 1 };
                    if (run.status === 'captain') next.options = rollCaptains(next);
                    else if (run.status === 'drafting' && run.draftSlot)
                        next.options = rollOptions(next, run.draftSlot);
                    else return;
                    setState({ run: next, dex: seenDex(next.options) });
                },

                swapSlots: (a, b) => {
                    const run = getState().run;
                    if (!run) return;
                    const lineup = [...run.lineup];
                    const bench = [...run.bench];
                    const zone = (r: SlotRef) => (r.zone === 'lineup' ? lineup : bench);
                    const tmp = zone(a)[a.index];
                    zone(a)[a.index] = zone(b)[b.index];
                    zone(b)[b.index] = tmp;
                    updateRun({ lineup, bench });
                },

                setFormation: (formation) => updateRun({ formation }),
                setTactic: (tactic) => updateRun({ tactic }),
                setCorner: (patch) => updateRun(patch),

                moveItem: (fromUid, toUid) => {
                    const run = getState().run;
                    if (!run || fromUid === toUid) return;
                    const from = run.picks.find((p) => p.uid === fromUid);
                    const to = run.picks.find((p) => p.uid === toUid);
                    if (!from?.item || !to) return;
                    const picks = run.picks.map((p) => {
                        if (p.uid === fromUid) return { ...p, item: to.item ?? null };
                        if (p.uid === toUid) return { ...p, item: from.item };
                        return p;
                    });
                    updateRun({ picks });
                },

                setMatch: (match) => setState({ match }),

                lockMatch: (team) => {
                    const run = getState().run;
                    if (run?.status === 'lineup' && !run.lockedTeam) {
                        const opp = run.opponents[run.stage];
                        setState({
                            run: {
                                ...run,
                                lockedTeam: team,
                                live: { stage: run.stage, orders: [], tick: 0, engine: ENGINE_VERSION },
                            },
                            dex: opp ? seenDex([...opp.lineup, ...opp.bench]) : getState().dex,
                        });
                    }
                },

                saveLive: (patch) => {
                    const run = getState().run;
                    if (run?.status !== 'lineup' || !run.lockedTeam) return;
                    const live = liveOf(run) ?? { stage: run.stage, orders: [], tick: 0, engine: ENGINE_VERSION };
                    updateRun({ live: { ...live, ...patch } });
                },

                recordResult: (m) => {
                    const { run, records, career, moves } = getState();
                    // só registra partidas da fase atual de uma run em escalação (evita resultado "fantasma")
                    if (run?.status !== 'lineup' || run.results.some((r) => r.stage === run.stage)) return;
                    const won = m.winner === 0;
                    // carta Destaque (só na vitória: na eliminação a copa acaba e a carta não teria onde jogar).
                    // O craque vira Destaque; se já é, sobe de nível jogando muito (nota 8+, até o 3); senão o
                    // prêmio vai pro melhor do time que ainda não tem edição.
                    const lines = playerLines(m);
                    const ranked = everyoneIn(m)
                        .filter((p) => p.team === 0 && mvpScore(p) > 0)
                        .sort((a, b) => mvpScore(b) - mvpScore(a))
                        .flatMap((p) => run.picks.filter((i) => i.uid === p.uid));
                    const star = ranked[0];
                    const starRating = lines.find((l) => l.team === 0 && l.uid === star?.uid)?.rating ?? 0;
                    const levelUp =
                        star?.special?.kind === 'destaque' &&
                        (star.special.level ?? 1) < DESTAQUE_MAX_LEVEL &&
                        starRating >= DESTAQUE_LEVEL_UP_RATING;
                    const winner = levelUp ? star : ranked.find((p) => !p.special);
                    const destaqueUid = won && SPECIALS_LIVE && winner ? winner.uid : null;
                    const destaqueLevel = levelUp ? (star.special?.level ?? 1) + 1 : 1;
                    // quem evoluiu no meio da partida continua evoluído pelo resto da copa
                    const evolved = new Map(
                        m.events.flatMap((e) => (e.type === 'evolve' && e.team === 0 ? [[e.uid, e] as const] : [])),
                    );
                    const picks = run.picks.map((p) => {
                        let out = p;
                        const evo = evolved.get(p.uid);
                        if (evo) out = { ...evolveInstance(out, evo.into, evo.role), evo: 0 };
                        else {
                            // barra de evolução da copa: soma o que ele fez nesta partida (quem ainda pode evoluir)
                            const line = lines.find((l) => l.team === 0 && l.uid === p.uid && l.minutes > 0);
                            if (line && evolutionTarget(p.speciesId, p.uid) !== null)
                                out = {
                                    ...out,
                                    evo: Math.round(evoProgress(p, line.stats, line.role as Position) * 10) / 10,
                                };
                        }
                        if (p.uid === destaqueUid)
                            out = {
                                ...out,
                                special: {
                                    kind: 'destaque' as const,
                                    ...(destaqueLevel > 1 && { level: destaqueLevel }),
                                },
                            };
                        return out;
                    });
                    const totals = [teamTotals(lines, 0), teamTotals(lines, 1)];
                    const result: StageResult = {
                        stage: run.stage,
                        opponent: run.opponents[run.stage].name,
                        score: m.score,
                        shootout: m.shootout,
                        won,
                        destaqueUid,
                        stats: {
                            possession: [m.possession[0], m.possession[1]],
                            shots: [totals[0].shots, totals[1].shots],
                            shotsOnTarget: [totals[0].shotsOnTarget, totals[1].shotsOnTarget],
                            players: lines
                                .filter((l) => l.team === 0)
                                .map((l) => ({
                                    uid: l.uid,
                                    speciesId: l.speciesId,
                                    name: l.name,
                                    role: l.role,
                                    rating: l.rating,
                                    minutes: l.minutes,
                                    distance: l.distance,
                                    goals: l.stats.goals,
                                    assists: l.stats.assists,
                                    shots: l.stats.shots,
                                    passes: l.stats.passes,
                                    passesCompleted: l.stats.passesCompleted,
                                    tacklesWon: l.stats.tacklesWon,
                                    interceptions: l.stats.interceptions,
                                    saves: l.stats.saves,
                                    movesUsed: l.stats.movesUsed,
                                })),
                            digest: matchDigest(m),
                        },
                    };
                    const last = run.stage === CUP_STAGES.length - 1;
                    const status: RunStatus = !won ? 'eliminated' : last ? 'champion' : 'reward';
                    const next: RunState = {
                        ...run,
                        picks,
                        results: [...run.results, result],
                        status,
                        lockedTeam: null,
                        live: null,
                    };
                    if (status === 'reward') next.rewards = rollRewards(next, 0);
                    // Pokédex: seu time (1+ minuto) "jogou", o rival e as recompensas ficam "vistos";
                    // quem evoluiu em campo também entra (a forma nova jogou o resto da partida)
                    let dex = recordMatchInDex(getState().dex, lines, won);
                    // álbum: a edição de cada carta que jogou (como ela entrou: o Destaque desta partida conta na próxima)
                    dex = recordEditions(
                        dex,
                        lines.flatMap((l) => {
                            const card = l.team === 0 && l.minutes >= 1 && run.picks.find((p) => p.uid === l.uid);
                            return card ? [[l.speciesId, editionBits(card)] as [number, number]] : [];
                        }),
                    );
                    dex = markSeen(
                        dex,
                        [...evolved.values()].map((e) => e.into),
                    );
                    dex = markSeen(
                        dex,
                        next.rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst.speciesId] : [])),
                    );
                    dex = markOvr(dex, picks.filter((p) => evolved.has(p.uid) || p.uid === destaqueUid).map(ovrOf));
                    if (status === 'champion') {
                        const played = next.results.flatMap((r) =>
                            (r.stats?.players ?? []).filter((p) => p.minutes >= 1).map((p) => p.speciesId),
                        );
                        dex = recordTitleInDex(dex, played);
                    }
                    const ended = status === 'eliminated' || status === 'champion';
                    if (ended) next.endedAt = Date.now();
                    let hall = getState().hall;
                    if (status === 'champion') {
                        next.champ = champMemo(next, records, getState().dex);
                        hall = [hallEntry(next, getState().profile), ...hall.filter((h) => h.id !== next.seed)].slice(
                            0,
                            MAX_HALL,
                        );
                    }
                    const withStar = {
                        ...records,
                        destaques: (records.destaques ?? 0) + (destaqueUid ? 1 : 0),
                        evolucoes: (records.evolucoes ?? 0) + evolved.size,
                    };
                    const saved = {
                        run: next,
                        hall,
                        dex,
                        moves: recordMovesSeen(moves, m),
                        career: recordMatchInCareer(career, m.score, won, !!m.shootout),
                        records: ended
                            ? {
                                  ...withStar,
                                  cups: records.cups + 1,
                                  titles: records.titles + (status === 'champion' ? 1 : 0),
                                  perfect: records.perfect + (isPerfectCup(next) ? 1 : 0),
                                  ...streakAfter(records, status === 'champion'),
                              }
                            : withStar,
                    };
                    // missões: esta partida (com os titulares do apito inicial) e o save depois dela
                    const profile = getState().profile;
                    const fresh = newMissions(
                        { ...saved, runs: [next, ...getState().parkedRuns], done: profile.missionsDone },
                        [matchView(m, result.stats?.digest ?? matchDigest(m), run.lockedTeam, last)],
                    );
                    setState({
                        ...saved,
                        ...(fresh.length && {
                            profile: { ...profile, missionsDone: [...profile.missionsDone, ...fresh] },
                        }),
                        unlockQueue: [...getState().unlockQueue, ...fresh],
                    });
                },

                markParaded: () => {
                    const run = getState().run;
                    if (run?.champ && !run.champ.paraded) updateRun({ champ: { ...run.champ, paraded: true } });
                },

                claimReward: (index, targetUid, forgetSlot, passTo) => {
                    const run = getState().run;
                    const reward = run?.rewards[index];
                    if (run?.status !== 'reward' || !reward) return;
                    let picks = run.picks;
                    let bench = run.bench;
                    if (reward.kind === 'pokemon') {
                        // reforço entra no banco no lugar do reserva escolhido (nunca o capitão);
                        // o item do reserva que sai passa para o reforço
                        const benchIdx = run.bench.indexOf(targetUid);
                        if (benchIdx < 0 || targetUid === run.captainUid) return;
                        const leaving = run.picks.find((p) => p.uid === targetUid);
                        const incoming = { ...reward.inst, item: reward.inst.item ?? leaving?.item ?? null };
                        bench = run.bench.map((u, i) => (i === benchIdx ? incoming.uid : u));
                        picks = [...run.picks.filter((p) => p.uid !== targetUid), incoming];
                    } else if (reward.kind === 'tm') {
                        // MT: o escolhido esquece um golpe (nunca a assinatura) e aprende o novo
                        const target = run.picks.find((p) => p.uid === targetUid);
                        const taught = target && forgetSlot !== undefined && teachMove(target, reward.move, forgetSlot);
                        if (!taught) return;
                        picks = run.picks.map((p) => (p.uid === targetUid ? taught : p));
                    } else {
                        // o item antigo de quem recebe vai pra quem o jogador escolheu (se escolheu)
                        const old = run.picks.find((p) => p.uid === targetUid)?.item ?? null;
                        picks = run.picks.map((p) =>
                            p.uid === targetUid
                                ? { ...p, item: reward.item }
                                : old && passTo && p.uid === passTo
                                  ? { ...p, item: old }
                                  : p,
                        );
                    }
                    setState({
                        run: { ...run, picks, bench, rewards: [], status: 'lineup', stage: run.stage + 1 },
                        dex: markOvr(getState().dex, picks.filter((p) => !run.picks.includes(p)).map(ovrOf)),
                        match: null,
                        screen: 'lineup',
                    });
                },

                skipReward: () => {
                    const run = getState().run;
                    if (run?.status !== 'reward') return;
                    setState({
                        run: { ...run, rewards: [], rerolls: run.rerolls + 1, status: 'lineup', stage: run.stage + 1 },
                        match: null,
                        screen: 'lineup',
                    });
                },

                rerollReward: () => {
                    const run = getState().run;
                    if (run?.status !== 'reward' || run.rerolls <= 0) return;
                    const used = run.rerollsUsed + 1;
                    const rewards = rollRewards({ ...run, rerollsUsed: used }, used);
                    setState({
                        run: { ...run, rerolls: run.rerolls - 1, rerollsUsed: used, rewards },
                        dex: seenDex(rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst] : []))),
                    });
                },

                advance: () => {
                    const run = getState().run;
                    if (run?.status === 'reward') setState({ screen: 'reward' });
                    else setState({ match: null, screen: 'home' });
                },

                updateSettings: (patch) => setState({ settings: { ...getState().settings, ...patch } }),
                updateProfile: (patch) => setState({ profile: { ...getState().profile, ...patch } }),
                setOnboarded: (onboarded) => setState({ onboarded }),
                shiftUnlock: () => setState({ unlockQueue: getState().unlockQueue.slice(1) }),

                resumeParked: (seed) => {
                    const { run, parkedRuns } = getState();
                    const target = parkedRuns.find((r) => r.seed === seed);
                    if (!target) return;
                    const rest = parkedRuns.filter((r) => r.seed !== seed);
                    // a copa atual não some: se ainda está em jogo, troca de lugar com a guardada
                    const next = isCupInProgress(run) ? [run, ...rest] : rest;
                    setState({ run: target, parkedRuns: next.slice(0, MAX_PARKED), match: null });
                },
                discardParked: (seed) => setState({ parkedRuns: getState().parkedRuns.filter((r) => r.seed !== seed) }),
            };
        },
        {
            name: 'soccermon-save',
            // v4: cartas especiais (campo opcional `special`, `eventType` na run, recordes novos)
            // v5: perfil, Pokédex, golpes descobertos, carreira e configurações novas
            // v6: Hall da Fama e resumo dos eventos de cada partida
            // v7: treinador, títulos e desbloqueios (retroativos: títulos, copa perfeita, Pokédex, líderes vencidos)
            // v8: histórico dos duelos amistosos
            // v9: álbum de edições na Pokédex (`DexEntry.editions`, retroativo pelo Hall e pelas copas guardadas)
            version: SAVE_VERSION,
            storage: createJSONStorage(() => idbStorage),
            partialize: (s): PersistedSave => ({
                run: s.run,
                settings: s.settings,
                records: s.records,
                profile: s.profile,
                dex: s.dex,
                moves: s.moves,
                career: s.career,
                onboarded: s.onboarded,
                parkedRuns: s.parkedRuns,
                hall: s.hall,
                duels: s.duels,
            }),
            // versões antigas tinham outro formato de draft: descarta a run, mantém configurações
            migrate: (persisted, version) => {
                return migrateSave((persisted ?? {}) as Partial<PersistedSave>, version);
            },
        },
    ),
);
