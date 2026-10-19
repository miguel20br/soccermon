import { create } from 'zustand';
import { ENGINE_VERSION } from '../engine/config';
import { ligaTeams } from '../engine/league';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchOrder } from '../engine/state';
import { type LiveMatch, type RunState, useGame } from '../store/game-store';
import { isError, type LigaOpen, type LigaResult, league } from './api';

/**
 * Partida da Liga em andamento (fora do save: quem guarda a partida é o servidor). As ordens e o ponto da partida
 * ficam no navegador pra recarregar a página e voltar no mesmo lugar, como na Copa.
 */
const LIVE_KEY = 'soccermon-liga-live';

interface LigaLive {
    id: string;
    orders: MatchOrder[];
    tick: number;
}

const readLive = (id: string): LigaLive | null => {
    try {
        const v = JSON.parse(localStorage.getItem(LIVE_KEY) ?? 'null') as LigaLive | null;
        return v?.id === id && Array.isArray(v.orders) ? v : null;
    } catch {
        return null;
    }
};
const writeLive = (v: LigaLive | null) => {
    try {
        if (v) localStorage.setItem(LIVE_KEY, JSON.stringify(v));
        else localStorage.removeItem(LIVE_KEY);
    } catch {
        // modo privado: recarregar volta pro 0 a 0 (mesma seed, mesmas ordens até ali não ficam)
    }
};

interface LigaState {
    open: LigaOpen | null;
    live: LigaLive | null;
    /** Resultado que o servidor gravou ('sending' = esperando a resposta). */
    result: LigaResult | 'sending' | null;
    error: string | null;
    setOpen(o: LigaOpen | null): void;
    saveLive(patch: Partial<Omit<LiveMatch, 'stage'>>): void;
    /**
     * Apito final: manda as ordens; o servidor refaz a partida e devolve o placar e o Elo. Com a partida (`m`), a
     * Pokédex marca como na Copa e no Duelo (seu lado jogou, o fantasma foi visto).
     */
    finish(m?: MatchResult): Promise<void>;
}

export const useLiga = create<LigaState>((set, get) => ({
    open: null,
    live: null,
    result: null,
    error: null,
    setOpen: (open) => set({ open, live: open ? readLive(open.id) : null, result: null, error: null }),
    saveLive: (patch) => {
        const { open, live, result } = get();
        if (!open || result) return;
        const next = { id: open.id, orders: patch.orders ?? live?.orders ?? [], tick: patch.tick ?? live?.tick ?? 0 };
        writeLive(next);
        set({ live: next });
    },
    finish: async (m) => {
        const { open, live, result } = get();
        // já mandou (ou está mandando): o apito final pode chegar duas vezes
        if (!open || result) return;
        if (m) useGame.getState().recordDuelDex(m, 0);
        set({ result: 'sending', error: null });
        const r = await league().liga<LigaResult>('resultado', {
            id: open.id,
            orders: live?.orders ?? [],
            engine: ENGINE_VERSION,
        });
        if (isError(r)) {
            set({ result: null, error: r.error });
            return;
        }
        writeLive(null);
        set({ result: r });
    },
}));

/** A partida da Liga no formato de copa de 1 fase: a tela da partida é a mesma da Copa. */
export function ligaRun(o: LigaOpen, live: LigaLive | null): RunState {
    const [home, away] = ligaTeams(o.myTeam, o.ghostTeam);
    return {
        schemaVersion: 3,
        seed: o.seed ?? '',
        teamName: home.name,
        status: 'lineup',
        formation: home.formation ?? '1-2-1',
        draftRound: 7,
        draftSlot: null,
        options: [],
        rerolls: 0,
        rerollsUsed: 0,
        picks: [...home.lineup, ...home.bench],
        lineup: home.lineup.map((p) => p.uid),
        bench: home.bench.map((p) => p.uid),
        captainUid: home.captainUid ?? null,
        tactic: home.tactic,
        cornerPlan: home.corner,
        cornerTakerUid: home.cornerTakerUid,
        opponents: [away],
        stage: 0,
        results: [],
        rewards: [],
        lockedTeam: home,
        live: { stage: 0, orders: live?.orders ?? [], tick: live?.tick ?? 0, engine: ENGINE_VERSION },
    };
}
