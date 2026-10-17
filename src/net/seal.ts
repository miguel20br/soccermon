import type { MatchSnapshot } from '../engine/state';

/**
 * Lacres do duelo (docs/planos/multiplayer.md, "seed por trecho"): cada lado sorteia um segredo e faz uma corrente
 * de hashes, x[i] = SHA-256(x[i+1]). Antes da partida cada um manda só x[0] (o lacre). Na rodada/trecho os dois abrem
 * o seu x, quem recebe confere que ele leva ao lacre, e a seed junta as duas metades. Ninguém sabe o futuro além do
 * que já foi aberto, e ninguém troca a sua metade depois de ver a do outro.
 */

/**
 * Trechos da partida, os mesmos do motor (`segmentTicks`/`segmentOf` em src/engine): 2 minutos do relógio de jogo
 * cada, 0–19 no tempo normal e o 20 nos pênaltis.
 */
export const SEG_COUNT = 21;
/** Trecho do relógio exibido (o motor usa a mesma conta): minuto 0–1,99 = 0, …, 40 (apito final/pênaltis) = 20. */
export const segmentOfMinute = (minute: number) => Math.min(SEG_COUNT - 1, Math.max(0, Math.floor(minute / 2)));
/** Rodadas de draft na corrente (os 2 drafts do duelo têm 7 escolhas). */
export const DRAFT_ROUND_COUNT = 7;
/**
 * Uma corrente só por partida: x[1..7] abrem as rodadas do draft e x[8..28] os trechos 0–20 da partida (docs/planos/
 * multiplayer-revisao.md, §3.2). Assim ninguém vê os pacotes futuros nem o futuro da partida.
 */
export const CHAIN_LEN = DRAFT_ROUND_COUNT + SEG_COUNT;
/** Posição na corrente do segredo da rodada r (0..6) e do trecho k (0..20). */
export const roundIdx = (r: number) => r + 1;
export const segIdx = (k: number) => DRAFT_ROUND_COUNT + 1 + k;

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

/** Corrente inteira a partir do topo x[len]: chain[0] é o lacre. */
export async function makeChain(top: string, len = CHAIN_LEN): Promise<string[]> {
    const chain: string[] = new Array(len + 1);
    chain[len] = top;
    for (let i = len - 1; i >= 0; i--) chain[i] = await sha256Hex(chain[i + 1]);
    return chain;
}

/** `x` é o elemento `i` da corrente do lacre `commit` (hasheado i vezes dá o lacre). */
export async function checkReveal(commit: string, i: number, x: string): Promise<boolean> {
    if (!Number.isInteger(i) || i < 1 || i > CHAIN_LEN || !/^[0-9a-f]{64}$/.test(x)) return false;
    let h = x;
    for (let n = 0; n < i; n++) h = await sha256Hex(h);
    return h === commit;
}

/** Quantos trechos seguidos (a partir do 0) os dois já abriram. */
export function openedSegments(host: (string | null | undefined)[], guest: (string | null | undefined)[]): number {
    let k = 0;
    while (k < SEG_COUNT && host[k] && guest[k]) k++;
    return k;
}

/**
 * Até onde a partida pode ser assistida: o primeiro snapshot do trecho que ainda não abriu (sem limite depois do
 * último). O ponto do corte é igual em toda versão provisória da partida, porque o passado não muda.
 */
export function holdTick(snaps: readonly Pick<MatchSnapshot, 'tick' | 'minute'>[], opened: number): number {
    if (opened >= SEG_COUNT) return Number.POSITIVE_INFINITY;
    const snap = snaps.find((s) => segmentOfMinute(s.minute) >= opened);
    return snap ? snap.tick : Number.POSITIVE_INFINITY;
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

/** Seed de cada trecho aberto pelos dois (`seeds[k]`, k = 0…): vai direto pro `segmentSeeds` do motor. */
export async function segmentSeeds(room: string, host: (string | null)[], guest: (string | null)[]) {
    const n = openedSegments(host, guest);
    const out: string[] = [];
    for (let k = 0; k < n; k++) out.push(await segmentSeed(room, k, host[k]!, guest[k]!));
    return out;
}

/** Seed base da partida (pública): o motor só usa no trecho 0 se ele não tiver seed, o que no duelo não acontece. */
export const baseSeedOf = (room: string, game: number) => `${room}-${game}`;
