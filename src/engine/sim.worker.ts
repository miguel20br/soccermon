/// <reference lib="webworker" />
import { FUTSAL_5, type MatchConfig } from './config';
import { runMatch } from './runners/batch-runner';
import type { MatchOrder, TeamSetup } from './state';

export interface SimRequest {
    id: number;
    home: TeamSetup;
    away: TeamSetup;
    seed: number | string;
    orders?: MatchOrder[];
    /** Seed de cada trecho de 2 minutos (duelo ao vivo). */
    segmentSeeds?: string[];
    /** Outra duração (partida curta do duelo); sem, a de sempre. */
    cfg?: MatchConfig;
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
    const { id, home, away, seed, orders, segmentSeeds, cfg } = e.data;
    const result = runMatch(cfg ?? FUTSAL_5, home, away, seed, { orders, segmentSeeds });
    (self as unknown as Worker).postMessage({ id, result });
};
