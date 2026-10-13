/// <reference lib="webworker" />
import { FUTSAL_5 } from './config';
import { runMatch } from './runners/batch-runner';
import type { TeamSetup } from './state';

export interface SimRequest {
    id: number;
    home: TeamSetup;
    away: TeamSetup;
    seed: number | string;
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
    const { id, home, away, seed } = e.data;
    const result = runMatch(FUTSAL_5, home, away, seed);
    (self as unknown as Worker).postMessage({ id, result });
};
