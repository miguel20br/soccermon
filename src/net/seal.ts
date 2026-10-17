import { FUTSAL_5 } from '../engine/config';

/**
 * Lacres do duelo (docs/planos/multiplayer.md, "seed por trecho"): cada lado sorteia um segredo e faz uma corrente
 * de hashes, x[i] = SHA-256(x[i+1]). Antes da partida cada um manda só x[0] (o lacre). No trecho k os dois abrem
 * x[k], quem recebe confere que ele leva ao lacre, e a seed do trecho junta as duas metades. Ninguém sabe o futuro
 * além do trecho aberto, e ninguém troca a sua metade depois de ver a do outro.
 */

/** Trecho de 2 minutos de jogo (FUTSAL_5: 20 min por tempo = 3600 ticks → 360 ticks). */
export const SEG_TICKS = ((FUTSAL_5.tickRate * FUTSAL_5.halfSeconds) / FUTSAL_5.displayHalfMinutes) * 2;
/** Trechos da partida na corrente: 20 + pênaltis e acréscimos com folga. */
export const SEG_COUNT = 40;
/** Rodadas de draft na corrente (os 2 drafts do duelo têm 7 escolhas). */
export const DRAFT_ROUND_COUNT = 7;
/**
 * Uma corrente só por partida: x[1..7] abrem as rodadas do draft e x[8..47] os trechos da partida (docs/planos/
 * multiplayer-revisao.md, §3.2). Assim ninguém vê os pacotes futuros nem o futuro da partida.
 */
export const CHAIN_LEN = DRAFT_ROUND_COUNT + SEG_COUNT;
/** Posição na corrente do segredo da rodada r (0..6) e do trecho k (1..40). */
export const roundIdx = (r: number) => r + 1;
export const segIdx = (k: number) => DRAFT_ROUND_COUNT + k;

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
export const segmentOf = (tick: number) => Math.min(SEG_COUNT, Math.floor(Math.max(0, tick) / SEG_TICKS) + 1);

/** Quantos trechos seguidos (a partir do 1) os dois já abriram. */
export function openedSegments(host: (string | null | undefined)[], guest: (string | null | undefined)[]): number {
    let k = 0;
    while (k < SEG_COUNT && host[k + 1] && guest[k + 1]) k++;
    return k;
}

/** Até onde a partida pode ser assistida: o fim do último trecho aberto pelos dois (sem limite depois do último). */
export function playableUntil(opened: number): number {
    return opened >= SEG_COUNT ? Number.POSITIVE_INFINITY : opened * SEG_TICKS;
}

/** Seed de um trecho: sala, trecho e as duas metades. */
export const segmentSeed = (room: string, k: number, xHost: string, xGuest: string) =>
    sha256Hex(`${room}|${k}|${xHost}|${xGuest}`);

/** Seed de uma rodada do draft (os pacotes saem só dela: ninguém calcula as rodadas seguintes). */
export const roundSeed = (room: string, r: number, xHost: string, xGuest: string) =>
    sha256Hex(`${room}|draft|${r}|${xHost}|${xGuest}`);

/** Lacre de uma escolha escondida (pacote, time pronto, prévia): só abre junto com o sal. */
export async function lacrar(value: unknown, salt = randomSecret()): Promise<{ seal: string; salt: string }> {
    return { seal: await sha256Hex(`${salt}|${JSON.stringify(value)}`), salt };
}

/** Confere que `value` + `salt` dão o lacre mandado antes. */
export async function abrir(value: unknown, salt: string, seal: string): Promise<boolean> {
    return typeof salt === 'string' && (await sha256Hex(`${salt}|${JSON.stringify(value)}`)) === seal;
}

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
