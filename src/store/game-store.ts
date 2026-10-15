import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { buildCupOpponents, CUP_STAGES } from '../engine/cup';
import { BENCH_SIZE, captainOptions, DRAFT_PICKS, draftOptions } from '../engine/draft';
import { evolveInstance } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import { viewInstance } from '../engine/instance';
import { type PlayerLine, playerLines, teamTotals } from '../engine/match-stats';
import { matchMvp, mvpScore } from '../engine/mvp';
import { type Reward, rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import { rollSpecial as roll, SPECIALS_LIVE, weeklyEventType } from '../engine/specials';
import { teachMove } from '../engine/tm';
import { detectLang, type Lang } from '../i18n/lang';
import {
    type Career,
    clubColorHex,
    DEFAULT_PROFILE,
    type Dex,
    EMPTY_CAREER,
    type MoveDex,
    markOvr,
    markSeen,
    type Profile,
    recordMatchInCareer,
    recordMatchInDex,
    recordMovesSeen,
    recordTitleInDex,
    tagFromName,
} from './profile';

/** Edição especial só quando as cartas novas estão no jogo. */
const rollSpecial: typeof roll = (inst, ev) => (SPECIALS_LIVE ? roll(inst, ev) : inst);

import type { MatchOrder, Tactic, TeamSetup } from '../engine/state';

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
    | 'help';
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
}

export interface LiveMatch {
    stage: number;
    orders: MatchOrder[];
    tick: number;
}

export type NamesOnField = 'all' | 'mine' | 'none';
export type ReduceMotion = 'system' | 'on' | 'off';

export interface Settings {
    cries: CryStyle;
    /** Volume geral (0..1); gritos e efeitos têm o próprio volume por cima dele. */
    volume: number;
    criesVolume: number;
    sfxVolume: number;
    /** Velocidade com que a partida começa. */
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Nomes dos Pokémon na quadra. */
    namesOnField: NamesOnField;
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
    speed: 1,
    cinematic: true,
    namesOnField: 'all',
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
    /** Partida atual (não persistida — snapshots são grandes). */
    match: MatchResult | null;
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
    moveItem(fromUid: string, toUid: string): void;
    setMatch(m: MatchResult | null): void;
    lockMatch(team: TeamSetup): void;
    /** Guarda as ordens e o ponto da partida em andamento. */
    saveLive(patch: Partial<Omit<LiveMatch, 'stage'>>): void;
    recordResult(m: MatchResult): void;
    /** Pega a recompensa. MT: `forgetSlot` é a vaga do golpe esquecido (ou o tamanho do moveset, se há vaga). */
    claimReward(index: number, targetUid: string, forgetSlot?: number): void;
    skipReward(): void;
    rerollReward(): void;
    advance(): void;
    updateSettings(patch: Partial<Settings>): void;
    updateProfile(patch: Partial<Profile>): void;
    setOnboarded(done: boolean): void;
}

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
    return draftOptions(rng, run.draftRound, taken, 3, [], role).map((o) => rollSpecial(o, run.eventType ?? null));
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
    };
}

/** Time eliminado na fase atual (de onde dá para contratar um Pokémon). */
const defeatedOf = (run: RunState) => {
    const opp = run.opponents[run.stage];
    return opp ? { name: opp.name, players: [...opp.lineup, ...opp.bench] } : undefined;
};
export const isPerfectCup = (run: RunState) =>
    run.status === 'champion' && run.results.every((r) => r.won && r.score[1] === 0);

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
    'run' | 'settings' | 'records' | 'profile' | 'dex' | 'moves' | 'career' | 'onboarded'
>;

/** Versão atual do save (a mesma do `persist`). */
export const SAVE_VERSION = 5;

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
    return {
        run,
        settings,
        records,
        profile,
        dex,
        moves: old.moves ?? {},
        career: { ...EMPTY_CAREER, ...old.career },
        onboarded: old.onboarded ?? (version < 5 && (records.cups > 0 || !!run)),
    };
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
                match: null,

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
                    };
                    setState({ run, match: null, screen: 'draft' });
                },

                abandonRun: () => setState({ run: null, match: null, screen: 'home' }),

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
                            run: { ...run, lockedTeam: team, live: { stage: run.stage, orders: [], tick: 0 } },
                            dex: opp ? seenDex([...opp.lineup, ...opp.bench]) : getState().dex,
                        });
                    }
                },

                saveLive: (patch) => {
                    const run = getState().run;
                    if (run?.status !== 'lineup' || !run.lockedTeam) return;
                    const live = run.live?.stage === run.stage ? run.live : { stage: run.stage, orders: [], tick: 0 };
                    updateRun({ live: { ...live, ...patch } });
                },

                recordResult: (m) => {
                    const { run, records, career, moves } = getState();
                    // só registra partidas da fase atual de uma run em escalação (evita resultado "fantasma")
                    if (run?.status !== 'lineup' || run.results.some((r) => r.stage === run.stage)) return;
                    const won = m.winner === 0;
                    // carta Destaque: o craque do seu time vira edição especial (se ainda não tiver uma)
                    const star = matchMvp(m, 0);
                    const starInst = star && mvpScore(star) > 0 ? run.picks.find((p) => p.uid === star.uid) : null;
                    const destaqueUid = SPECIALS_LIVE && starInst && !starInst.special ? starInst.uid : null;
                    // quem evoluiu no meio da partida continua evoluído pelo resto da copa
                    const evolved = new Map(
                        m.events.flatMap((e) =>
                            e.type === 'evolve' && e.team === 0 ? [[e.uid, e.into] as const] : [],
                        ),
                    );
                    const picks = run.picks.map((p) => {
                        let out = p;
                        const into = evolved.get(p.uid);
                        if (into) out = evolveInstance(out, into);
                        if (p.uid === destaqueUid) out = { ...out, special: { kind: 'destaque' as const } };
                        return out;
                    });
                    const lines = playerLines(m);
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
                    dex = markSeen(dex, [...evolved.values()]);
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
                    const withStar = {
                        ...records,
                        destaques: (records.destaques ?? 0) + (destaqueUid ? 1 : 0),
                        evolucoes: (records.evolucoes ?? 0) + evolved.size,
                    };
                    setState({
                        run: next,
                        dex,
                        moves: recordMovesSeen(moves, m),
                        career: recordMatchInCareer(career, m.score, won, !!m.shootout),
                        records: ended
                            ? {
                                  ...withStar,
                                  cups: records.cups + 1,
                                  titles: records.titles + (status === 'champion' ? 1 : 0),
                                  perfect: records.perfect + (isPerfectCup(next) ? 1 : 0),
                              }
                            : withStar,
                    });
                },

                claimReward: (index, targetUid, forgetSlot) => {
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
                        picks = run.picks.map((p) => (p.uid === targetUid ? { ...p, item: reward.item } : p));
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
            };
        },
        {
            name: 'soccermon-save',
            // v4: cartas especiais (campo opcional `special`, `eventType` na run, recordes novos)
            // v5: perfil, Pokédex, golpes descobertos, carreira e configurações novas
            version: 5,
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
            }),
            // versões antigas tinham outro formato de draft: descarta a run, mantém configurações
            migrate: (persisted, version) => {
                return migrateSave((persisted ?? {}) as Partial<PersistedSave>, version);
            },
        },
    ),
);
