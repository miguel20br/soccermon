import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { buildCupOpponents, CUP_STAGES } from '../engine/cup';
import { BENCH_SIZE, captainOptions, DRAFT_PICKS, draftOptions } from '../engine/draft';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import { type Reward, rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { Tactic, TeamSetup } from '../engine/state';

export type Screen = 'home' | 'draft' | 'lineup' | 'match' | 'result' | 'reward' | 'settings' | 'credits';
export type CryStyle = 'legacy' | 'latest';
export type PlaybackSpeed = 1 | 2 | 4 | 'highlights';

export const PLAYER_COLOR = 0xe8423f;
export const START_REROLLS = 2;

export interface StageResult {
    stage: number;
    opponent: string;
    score: [number, number];
    shootout: [number, number] | null;
    won: boolean;
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
}

export interface Settings {
    cries: CryStyle;
    volume: number;
    speed: PlaybackSpeed;
    cinematic: boolean;
}

export interface Records {
    cups: number;
    titles: number;
    perfect: number;
}

export type SlotRef = { zone: 'lineup' | 'bench'; index: number };

interface GameStore {
    screen: Screen;
    run: RunState | null;
    settings: Settings;
    records: Records;
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
    recordResult(m: MatchResult): void;
    claimReward(index: number, targetUid: string): void;
    skipReward(): void;
    rerollReward(): void;
    advance(): void;
    updateSettings(patch: Partial<Settings>): void;
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
    return captainOptions(rng, new Set());
}

function rollOptions(run: RunState, slot: SlotRef): PokemonInstance[] {
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const role = slotRole(run, slot);
    const rng = new Rng(run.seed, `draft-${run.draftRound}-${role}-r${run.rerollsUsed}`);
    return draftOptions(rng, run.draftRound, taken, 3, [], role);
}

export function playerTeam(run: RunState): TeamSetup {
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    return {
        name: run.teamName,
        lineup: run.lineup.map((u) => byUid.get(u)!),
        bench: run.bench.map((u) => byUid.get(u)!),
        tactic: run.tactic,
        color: PLAYER_COLOR,
        formation: run.formation,
        captainUid: run.captainUid,
    };
}

export const stageLabel = (stage: number) => CUP_STAGES[stage] ?? 'Copa';
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

export const useGame = create<GameStore>()(
    persist(
        (setState, getState) => {
            const updateRun = (patch: Partial<RunState>) => {
                const run = getState().run;
                if (run) setState({ run: { ...run, ...patch } });
            };
            return {
                screen: 'home',
                run: null,
                settings: { cries: 'legacy', volume: 0.6, speed: 1, cinematic: true },
                records: { cups: 0, titles: 0, perfect: 0 },
                match: null,

                go: (screen) => setState({ screen }),

                newRun: (teamName = 'Pallet FC', seed) => {
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
                    };
                    setState({ run, match: null, screen: 'draft' });
                },

                abandonRun: () => setState({ run: null, match: null, screen: 'home' }),

                chooseFormation: (formation) => {
                    const run = getState().run;
                    if (run?.status !== 'formation') return;
                    const next: RunState = { ...run, formation, status: 'captain' };
                    next.options = rollCaptains(next);
                    setState({ run: next });
                },

                chooseSlot: (slot) => {
                    const run = getState().run;
                    if (run?.status !== 'drafting' || run.draftSlot) return; // vaga travada até escolher
                    const zone = slot.zone === 'lineup' ? run.lineup : run.bench;
                    if (zone[slot.index] !== '') return;
                    updateRun({ draftSlot: slot, options: rollOptions(run, slot) });
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
                    if (isDraftComplete(next) || next.picks.length >= DRAFT_PICKS) {
                        next.status = 'lineup';
                        setState({ run: next, screen: 'lineup' });
                    } else {
                        setState({ run: next });
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
                    setState({ run: next });
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

                recordResult: (m) => {
                    const { run, records } = getState();
                    if (!run || run.results.some((r) => r.stage === run.stage)) return;
                    const won = m.winner === 0;
                    const result: StageResult = {
                        stage: run.stage,
                        opponent: run.opponents[run.stage].name,
                        score: m.score,
                        shootout: m.shootout,
                        won,
                    };
                    const last = run.stage === CUP_STAGES.length - 1;
                    const status: RunStatus = !won ? 'eliminated' : last ? 'champion' : 'reward';
                    const next: RunState = { ...run, results: [...run.results, result], status };
                    if (status === 'reward') {
                        next.rewards = rewardOptions(run.seed, run.stage, 0, run.picks);
                    }
                    const ended = status === 'eliminated' || status === 'champion';
                    setState({
                        run: next,
                        records: ended
                            ? {
                                  cups: records.cups + 1,
                                  titles: records.titles + (status === 'champion' ? 1 : 0),
                                  perfect: records.perfect + (isPerfectCup(next) ? 1 : 0),
                              }
                            : records,
                    });
                },

                claimReward: (index, targetUid) => {
                    const run = getState().run;
                    const reward = run?.rewards[index];
                    if (run?.status !== 'reward' || !reward) return;
                    let picks = run.picks;
                    let bench = run.bench;
                    if (reward.kind === 'pokemon') {
                        // reforço entra no banco no lugar do reserva escolhido
                        const benchIdx = run.bench.indexOf(targetUid);
                        if (benchIdx < 0) return;
                        bench = run.bench.map((u, i) => (i === benchIdx ? reward.inst.uid : u));
                        picks = [...run.picks.filter((p) => p.uid !== targetUid), reward.inst];
                    } else {
                        picks = run.picks.map((p) => (p.uid === targetUid ? { ...p, item: reward.item } : p));
                    }
                    setState({
                        run: { ...run, picks, bench, rewards: [], status: 'lineup', stage: run.stage + 1 },
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
                    updateRun({
                        rerolls: run.rerolls - 1,
                        rerollsUsed: used,
                        rewards: rewardOptions(run.seed, run.stage, used, run.picks),
                    });
                },

                advance: () => {
                    const run = getState().run;
                    if (run?.status === 'reward') setState({ screen: 'reward' });
                    else setState({ match: null, screen: 'home' });
                },

                updateSettings: (patch) => setState({ settings: { ...getState().settings, ...patch } }),
            };
        },
        {
            name: 'soccermon-save',
            version: 3,
            storage: createJSONStorage(() => idbStorage),
            partialize: (s) => ({ run: s.run, settings: s.settings, records: s.records }),
            // versões antigas tinham outro formato de draft: descarta a run, mantém configurações
            migrate: (persisted, version) => {
                const old = (persisted ?? {}) as {
                    run?: RunState | null;
                    settings?: Partial<Settings>;
                    records?: Records;
                };
                const settings = {
                    cries: 'legacy',
                    volume: 0.6,
                    speed: 1,
                    cinematic: true,
                    ...old.settings,
                } as Settings;
                const records = old.records ?? { cups: 0, titles: 0, perfect: 0 };
                if (version < 3) return { run: null, settings, records };
                return { run: old.run ?? null, settings, records };
            },
        },
    ),
);
