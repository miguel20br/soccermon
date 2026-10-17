import type { MatchConfig } from '../config';
import type { MatchEvent, MatchOrder, MatchSnapshot, MatchState, PlayerStats, TeamSetup } from '../state';
import { LiveRunner } from './live-runner';

export interface PlayerSummary {
    idx: number;
    team: 0 | 1;
    uid: string;
    speciesId: number;
    name: string;
    role: string;
    shiny: boolean;
    captain: boolean;
    item: string | null;
    stats: PlayerStats;
    energy: number;
}

export interface MatchResult {
    seed: number | string;
    score: [number, number];
    shootout: [number, number] | null;
    winner: 0 | 1 | null;
    events: MatchEvent[];
    snapshots: MatchSnapshot[];
    /** Elenco no início (índice → jogador); substituições aparecem nos eventos `sub`. */
    roster: PlayerSummary[];
    /** Elenco ao final (após substituições). */
    finalRoster: PlayerSummary[];
    /** Quem saiu no intervalo, com as estatísticas do 1º tempo. */
    subbedOut: PlayerSummary[];
    possession: [number, number];
    ticks: number;
}

const MAX_TICKS = 200_000;

function summarize(s: MatchState, players = s.players): PlayerSummary[] {
    return players.map((p) => ({
        idx: p.idx,
        team: p.team,
        uid: p.inst.uid,
        speciesId: (p.origin ?? p.inst).speciesId,
        name: p.name,
        role: p.role,
        shiny: p.inst.shiny,
        captain: p.captain,
        item: p.item,
        stats: { ...p.stats },
        energy: p.energy,
    }));
}

/** Simula a partida inteira de uma vez (Worker da UI e calibração headless). */
export function runMatch(
    cfg: MatchConfig,
    home: TeamSetup,
    away: TeamSetup,
    seed: number | string,
    opts: { snapshots?: boolean; orders?: MatchOrder[]; segmentSeeds?: readonly string[] } = {},
): MatchResult {
    const runner = new LiveRunner(cfg, home, away, seed, opts.orders, opts.segmentSeeds ?? null);
    const s = runner.state;
    const roster = summarize(s);
    const snapshots: MatchSnapshot[] = [];
    const wantSnapshots = opts.snapshots ?? true;
    if (wantSnapshots) snapshots.push(runner.snapshot());
    while (!runner.finished && s.tick < MAX_TICKS) {
        runner.step();
        if (wantSnapshots && s.tick % cfg.snapshotEvery === 0) snapshots.push(runner.snapshot());
    }
    if (wantSnapshots) snapshots.push(runner.snapshot());
    const total = s.teams[0].possessionTicks + s.teams[1].possessionTicks || 1;
    return {
        seed,
        score: [s.score[0], s.score[1]],
        shootout: s.shootout,
        winner: s.winner,
        events: s.events,
        snapshots,
        roster,
        finalRoster: summarize(s),
        subbedOut: summarize(s, s.subbedOut),
        possession: [s.teams[0].possessionTicks / total, s.teams[1].possessionTicks / total],
        ticks: s.tick,
    };
}
