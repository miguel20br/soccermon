import { FUTSAL_5 } from '../engine/config';

/**
 * Lacres do duelo (docs/planos/multiplayer.md, "seed por trecho"): cada lado sorteia um segredo e faz uma corrente
 * de hashes, x[i] = SHA-256(x[i+1]). Antes da partida cada um manda só x[0] (o lacre). No trecho k os dois abrem
 * x[k], quem recebe confere que ele leva ao lacre, e a seed do trecho junta as duas metades. Ninguém sabe o futuro
 * além do trecho aberto, e ninguém troca a sua metade depois de ver a do outro.
 */

/** Trecho de 2 minutos de jogo (FUTSAL_5: 20 min por tempo = 3600 ticks → 360 ticks). */
export const SEG_TICKS = ((FUTSAL_5.tickRate * FUTSAL_5.halfSeconds) / FUTSAL_5.displayHalfMinutes) * 2;
/** Trechos na corrente: 20 da partida + pênaltis e acréscimos com folga. */
export const CHAIN_LEN = 40;

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(text: string): Promise<string> {
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

/** Segredo novo (32 bytes) em hex. */
export function randomSecret(): string {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    return toHex(b.buffer);
}

/** Corrente inteira a partir do topo x[len]: chain[0] é o lacre, chain[k] abre o trecho k. */
export async function makeChain(top: string, len = CHAIN_LEN): Promise<string[]> {
    const chain: string[] = new Array(len + 1);
    chain[len] = top;
    for (let i = len - 1; i >= 0; i--) chain[i] = await sha256Hex(chain[i + 1]);
    return chain;
}

/** `x` abre o trecho k do lacre `commit` (hasheado k vezes dá o lacre). */
export async function checkReveal(commit: string, k: number, x: string): Promise<boolean> {
    if (k < 1 || k > CHAIN_LEN || !/^[0-9a-f]{64}$/.test(x)) return false;
    let h = x;
    for (let i = 0; i < k; i++) h = await sha256Hex(h);
    return h === commit;
}

/** Trecho (1, 2, …) em que cai um tick da partida. */
export const segmentOf = (tick: number) => Math.min(CHAIN_LEN, Math.floor(Math.max(0, tick) / SEG_TICKS) + 1);

/** Quantos trechos seguidos (a partir do 1) os dois já abriram. */
export function openedSegments(host: (string | null | undefined)[], guest: (string | null | undefined)[]): number {
    let k = 0;
    while (k < CHAIN_LEN && host[k + 1] && guest[k + 1]) k++;
    return k;
}

/** Até onde a partida pode ser assistida: o fim do último trecho aberto pelos dois (sem limite depois do último). */
export function playableUntil(opened: number): number {
    return opened >= CHAIN_LEN ? Number.POSITIVE_INFINITY : opened * SEG_TICKS;
}

/** Seed de um trecho: sala, trecho e as duas metades. */
export const segmentSeed = (room: string, k: number, xHost: string, xGuest: string) =>
    sha256Hex(`${room}|${k}|${xHost}|${xGuest}`);

/**
 * Ponto de encaixe com a trilha do motor: `seeds[k]` é a seed do trecho k (índice 0 vazio). Quando o motor aceitar
 * seed por trecho (renovar `s.rng` a cada SEG_TICKS), a tela passa este array no lugar da seed única.
 */
export type SegmentSeeds = string[];

export async function segmentSeeds(room: string, host: string[], guest: string[]): Promise<SegmentSeeds> {
    const n = openedSegments(host, guest);
    const out: SegmentSeeds = [''];
    for (let k = 1; k <= n; k++) out.push(await segmentSeed(room, k, host[k], guest[k]));
    return out;
}

/**
 * TODO(motor): seed única só pra rodar enquanto o motor não renova a seed por trecho. Usa a do trecho 1 (aberto no
 * pontapé), então hoje quem tiver o jogo modificado ainda consegue prever a partida inteira. Os trechos seguintes
 * já abrem, são conferidos e seguram a tela (W.O.) do mesmo jeito; só não mudam a sorte ainda.
 */
export const matchSeedOf = (seeds: SegmentSeeds): string | null => seeds[1] ?? null;
