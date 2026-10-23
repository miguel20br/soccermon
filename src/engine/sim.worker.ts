/// <reference lib="webworker" />
import { FUTSAL_5, withConfig } from './config';
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
    /** Assinaturas do golpe máximo (`?assinatura=1`; o Worker não vê a URL da página). */
    maxSig?: boolean;
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
    const { id, home, away, seed, orders, segmentSeeds, maxSig } = e.data;
    const cfg = maxSig ? withConfig({ maxSig }) : FUTSAL_5;
    const result = runMatch(cfg, home, away, seed, { orders, segmentSeeds });
    (self as unknown as Worker).postMessage({ id, result });
};
