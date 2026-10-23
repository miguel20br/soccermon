import type { MatchResult } from '../engine/runners/batch-runner';
import type { SimRequest } from '../engine/sim.worker';
import type { MatchOrder, TeamSetup } from '../engine/state';
import { MAXIMO3 } from './max-beat';

/** Roda a simulação num Web Worker para não travar a UI. Falhas e demora excessiva viram erro (nunca trava). */
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (r: MatchResult) => void; reject: (e: Error) => void; timer: number }>();
const TIMEOUT_MS = 20_000;

function failAll(message: string) {
    for (const [id, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new Error(message));
        pending.delete(id);
    }
    // descarta o worker quebrado; o próximo pedido cria outro
    worker?.terminate();
    worker = null;
}

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL('../engine/sim.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<{ id: number; result: MatchResult }>) => {
            const p = pending.get(e.data.id);
            if (!p) return;
            clearTimeout(p.timer);
            pending.delete(e.data.id);
            p.resolve(e.data.result);
        };
        worker.onerror = (e) => failAll(e.message || 'Falha no simulador');
        worker.onmessageerror = () => failAll('Resposta inválida do simulador');
    }
    return worker;
}

export function simulateMatch(
    home: TeamSetup,
    away: TeamSetup,
    seed: string,
    orders: MatchOrder[] = [],
    segmentSeeds?: string[],
): Promise<MatchResult> {
    const id = nextId++;
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
            pending.delete(id);
            reject(new Error('A simulação demorou demais'));
        }, TIMEOUT_MS);
        pending.set(id, { resolve, reject, timer });
        const req: SimRequest = { id, home, away, seed, orders, segmentSeeds, maxLevels: MAXIMO3 };
        try {
            getWorker().postMessage(req);
        } catch (err) {
            clearTimeout(timer);
            pending.delete(id);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}
