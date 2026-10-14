/// <reference lib="webworker" />
import { FUTSAL_5 } from './config';
import { runMatch } from './runners/batch-runner';
import type { MatchOrder, TeamSetup } from './state';

export interface SimRequest {
    id: number;
    home: TeamSetup;
    away: TeamSetup;
    seed: number | string;
    orders?: MatchOrder[];
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
    const { id, home, away, seed, orders } = e.data;
    const result = runMatch(FUTSAL_5, home, away, seed, { orders });
    (self as unknown as Worker).postMessage({ id, result });
};
