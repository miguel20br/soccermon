import type { MatchResult } from '../engine/runners/batch-runner';
import type { SimRequest } from '../engine/sim.worker';
import type { TacticChange, TeamSetup } from '../engine/state';

/** Roda a simulação num Web Worker para não travar a UI. */
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, (r: MatchResult) => void>();

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL('../engine/sim.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<{ id: number; result: MatchResult }>) => {
            pending.get(e.data.id)?.(e.data.result);
            pending.delete(e.data.id);
        };
    }
    return worker;
}

export function simulateMatch(
    home: TeamSetup,
    away: TeamSetup,
    seed: string,
    tacticChanges: TacticChange[] = [],
): Promise<MatchResult> {
    const id = nextId++;
    return new Promise((resolve) => {
        pending.set(id, resolve);
        const req: SimRequest = { id, home, away, seed, tacticChanges };
        getWorker().postMessage(req);
    });
}
