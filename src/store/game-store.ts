import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { buildCupOpponents, CUP_STAGES } from '../engine/cup';
import { DRAFT_ROUNDS, draftOptions } from '../engine/draft';
import type { PokemonInstance } from '../engine/instance';
import { viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { Tactic, TeamSetup } from '../engine/state';

export type Screen = 'home' | 'draft' | 'lineup' | 'match' | 'result' | 'settings' | 'credits';
export type CryStyle = 'legacy' | 'latest';
export type PlaybackSpeed = 1 | 2 | 4 | 'highlights';

export const PLAYER_COLOR = 0xe8423f;

export interface StageResult {
    stage: number;
    opponent: string;
    score: [number, number];
    shootout: [number, number] | null;
    won: boolean;
}

/** Run do modo copa (roguelike). Separada do futuro CareerSave. */
export interface RunState {
    schemaVersion: 2;
    seed: string;
    teamName: string;
    draftRound: number;
    options: PokemonInstance[];
    picks: PokemonInstance[];
    /** uids nos 5 slots (GK, Fixo, Ala, Ala, Pivô); '' = vaga ainda aberta durante o draft */
    lineup: string[];
    /** uids nos 2 lugares do banco; '' = vaga aberta */
    bench: string[];
    tactic: Tactic;
    opponents: TeamSetup[];
    stage: number;
    results: StageResult[];
    status: 'drafting' | 'lineup' | 'eliminated' | 'champion';
}

export interface Settings {
    cries: CryStyle;
    volume: number;
    speed: PlaybackSpeed;
}

interface GameStore {
    screen: Screen;
    run: RunState | null;
    settings: Settings;
    /** Partida atual (não persistida — snapshots são grandes). */
    match: MatchResult | null;
    go(screen: Screen): void;
    newRun(teamName?: string): void;
    abandonRun(): void;
    /** Draft estilo 7 a 0: escolhe uma das 3 opções e a vaga onde ela entra. */
    pick(uid: string, slot: SlotRef): void;
    swapSlots(a: SlotRef, b: SlotRef): void;
    setTactic(t: Tactic): void;
    setMatch(m: MatchResult | null): void;
    recordResult(m: MatchResult): void;
    advance(): void;
    updateSettings(patch: Partial<Settings>): void;
}

export type SlotRef = { zone: 'lineup' | 'bench'; index: number };

const idbStorage: StateStorage = {
    getItem: async (name) => (await get(name)) ?? null,
    setItem: (name, value) => set(name, value),
    removeItem: (name) => del(name),
};

/** 3 Pokémon sorteados de qualquer posição. Se o gol ainda estiver vago no fim, garante um goleiro. */
function rollOptions(run: RunState): PokemonInstance[] {
    if (run.draftRound >= DRAFT_ROUNDS.length) return [];
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const rng = new Rng(run.seed, `draft-${run.draftRound}`);
    const options = draftOptions(rng, run.draftRound, taken, 3, [], 'ANY');
    const roundsLeft = DRAFT_ROUNDS.length - run.draftRound;
    const gkOpen = run.lineup[0] === '';
    if (gkOpen && roundsLeft <= 2 && !options.some((o) => viewInstance(o).naturalPosition === 'GK')) {
        const ids = new Set([...taken, ...options.map((o) => o.speciesId)]);
        const [keeper] = draftOptions(rng, run.draftRound, ids, 1, [], 'GK');
        if (keeper) options[2] = keeper;
    }
    return options;
}

export const isDraftComplete = (run: RunState) => [...run.lineup, ...run.bench].every((u) => u !== '');

export function playerTeam(run: RunState): TeamSetup {
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    return {
        name: run.teamName,
        lineup: run.lineup.map((u) => byUid.get(u)!),
        bench: run.bench.map((u) => byUid.get(u)!),
        tactic: run.tactic,
        color: PLAYER_COLOR,
    };
}

export const stageLabel = (stage: number) => CUP_STAGES[stage] ?? 'Copa';

export const useGame = create<GameStore>()(
    persist(
        (setState, getState) => ({
            screen: 'home',
            run: null,
            settings: { cries: 'legacy', volume: 0.6, speed: 1 },
            match: null,

            go: (screen) => setState({ screen }),

            newRun: (teamName = 'Pallet FC') => {
                const seed = Math.floor(Math.random() * 1e9).toString(36);
                const run: RunState = {
                    schemaVersion: 2,
                    seed,
                    teamName,
                    draftRound: 0,
                    options: [],
                    picks: [],
                    lineup: ['', '', '', '', ''],
                    bench: ['', ''],
                    tactic: 'balanced',
                    opponents: buildCupOpponents(seed),
                    stage: 0,
                    results: [],
                    status: 'drafting',
                };
                run.options = rollOptions(run);
                setState({ run, match: null, screen: 'draft' });
            },

            abandonRun: () => setState({ run: null, match: null, screen: 'home' }),

            pick: (uid, slot) => {
                const run = getState().run;
                if (run?.status !== 'drafting') return;
                const choice = run.options.find((o) => o.uid === uid);
                const zone = slot.zone === 'lineup' ? run.lineup : run.bench;
                if (!choice || zone[slot.index] !== '') return;
                const lineup = [...run.lineup];
                const bench = [...run.bench];
                (slot.zone === 'lineup' ? lineup : bench)[slot.index] = choice.uid;
                const next: RunState = {
                    ...run,
                    picks: [...run.picks, choice],
                    lineup,
                    bench,
                    draftRound: run.draftRound + 1,
                };
                if (isDraftComplete(next)) {
                    next.options = [];
                    next.status = 'lineup';
                    setState({ run: next, screen: 'lineup' });
                } else {
                    next.options = rollOptions(next);
                    setState({ run: next });
                }
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
                setState({ run: { ...run, lineup, bench } });
            },

            setTactic: (tactic) => {
                const run = getState().run;
                if (run) setState({ run: { ...run, tactic } });
            },

            setMatch: (match) => setState({ match }),

            recordResult: (m) => {
                const run = getState().run;
                if (!run) return;
                const won = m.winner === 0;
                const result: StageResult = {
                    stage: run.stage,
                    opponent: run.opponents[run.stage].name,
                    score: m.score,
                    shootout: m.shootout,
                    won,
                };
                if (run.results.some((r) => r.stage === run.stage)) return;
                const status = !won ? 'eliminated' : run.stage === CUP_STAGES.length - 1 ? 'champion' : 'lineup';
                setState({ run: { ...run, results: [...run.results, result], status } });
            },

            advance: () => {
                const run = getState().run;
                if (!run) return;
                if (run.status === 'lineup' && run.results.some((r) => r.stage === run.stage)) {
                    setState({ run: { ...run, stage: run.stage + 1 }, match: null, screen: 'lineup' });
                } else {
                    setState({ match: null, screen: 'home' });
                }
            },

            updateSettings: (patch) => setState({ settings: { ...getState().settings, ...patch } }),
        }),
        {
            name: 'soccermon-save',
            version: 2,
            storage: createJSONStorage(() => idbStorage),
            // v1 tinha o draft por posição fixa: descarta a run antiga, mantém as configurações
            migrate: (persisted, version) => {
                const old = persisted as { run?: RunState | null; settings?: Settings };
                if (version < 2) return { run: null, settings: { ...old.settings, speed: 1 } as Settings };
                return old as { run: RunState | null; settings: Settings };
            },
            partialize: (s) => ({ run: s.run, settings: s.settings }),
        },
    ),
);
