/// <reference lib="webworker" />
import { FUTSAL_5 } from './config';
import { runMatch } from './runners/batch-runner';
import type { TacticChange, TeamSetup } from './state';

export interface SimRequest {
    id: number;
    home: TeamSetup;
    away: TeamSetup;
    seed: number | string;
    tacticChanges?: TacticChange[];
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
    const { id, home, away, seed, tacticChanges } = e.data;
    const result = runMatch(FUTSAL_5, home, away, seed, { tacticChanges });
    (self as unknown as Worker).postMessage({ id, result });
};
