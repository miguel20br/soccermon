import { create } from 'zustand';
import { DESAFIO_TO, desafioForced, desafioPhase, payDesafio } from '../store/desafio-natal';
import { type GameState, useGame } from '../store/game-store';
import { pushReveals } from '../store/reveal';
import { utNow } from '../store/ultimate/clock';
import { cloudApi, cloudUserId, isApplyingCloud, loadCloud, useCloud } from './cloud';

/**
 * Desafio de Natal na nuvem (a regra está em src/store/desafio-natal.ts; o banco em
 * supabase/migrations/20261125120000_desafio_natal.sql):
 *   * a soma de todo mundo (`natal_gols`, leitura pública) vem por um GET direto na API, sem o supabase-js (a Home
 *     não carrega os ~200 KB dele só pra barra);
 *   * os seus gols (`natal_marcou`) e o envio ao fim de cada partida (`natal_gols_somar`) só com conta Google, pelo
 *     cliente que a sessão já carregou;
 *   * leitura com cache de 1 min. Sem Supabase, sem conta ou sem rede: "só online", o jogo segue igual.
 */
export interface DesafioNet {
    /** Soma de todo mundo (null = ainda não leu, ou sem rede/Supabase). */
    total: number | null;
    /** Os seus gols no desafio (null = sem conta ou não leu). */
    meus: number | null;
    /** Quando leu pela última vez (ms). */
    at: number;
}
export const useDesafio = create<DesafioNet>(() => ({ total: null, meus: null, at: 0 }));

export const CACHE_MS = 60_000;
/** O desafio está aberto agora (relógio da prévia `?utnow=` e o `?desafio=aberto` do dev valem). */
export const desafioNow = () =>
    desafioPhase(utNow(), typeof window !== 'undefined' && desafioForced(window.location.search, __SMOKE__));

const sum = (rows: unknown) =>
    Array.isArray(rows) ? rows.reduce((s: number, r) => s + (Number((r as { gols?: unknown }).gols) || 0), 0) : null;

async function readTotal(): Promise<number | null> {
    if (!cloudApi) return null;
    try {
        const r = await fetch(`${cloudApi.url}/rest/v1/natal_gols?select=gols`, {
            headers: { apikey: cloudApi.key, Authorization: `Bearer ${cloudApi.key}` },
        });
        return r.ok ? sum(await r.json()) : null;
    } catch {
        return null;
    }
}

async function readMine(): Promise<number | null> {
    const uid = cloudUserId();
    if (!uid) return null;
    const sb = await loadCloud().catch(() => null);
    if (!sb) return null;
    const { data, error } = await sb.from('natal_marcou').select('gols').eq('user_id', uid);
    return error ? null : sum(data);
}

/** Relê a soma e os seus gols (no máximo uma vez por minuto, a não ser `force`). */
export async function refreshDesafio(force = false) {
    if (!cloudApi || desafioNow() === 'teaser') return;
    const at = Date.now();
    if (!force && at - useDesafio.getState().at < CACHE_MS) return;
    useDesafio.setState({ at });
    const [total, meus] = await Promise.all([readTotal(), readMine()]);
    useDesafio.setState((s) => ({ total: total ?? s.total, meus: cloudUserId() ? (meus ?? s.meus) : null }));
    claim();
}

/**
 * Abre os prêmios dos degraus batidos (uma vez por save, `payDesafio`) e põe na fila da tela de prêmio. Só com o save
 * já carregado e acertado com a nuvem (senão o save da conta que chega por cima levaria o prêmio embora).
 */
export function claim() {
    const { total, meus } = useDesafio.getState();
    const c = useCloud.getState();
    if (total === null || meus === null || c.status !== 'saved' || c.ask || !useGame.persist.hasHydrated()) return;
    const s = useGame.getState();
    const r = payDesafio(s, total, meus, utNow());
    if (!r) return;
    useGame.setState({ ultimate: r.ultimate, profile: r.profile });
    pushReveals(r.got.map((g) => ({ item: g.item, source: { kind: 'desafio', degrau: g.degrau, total, meus } })));
}

// ------------------------------------------------------------------------------------------- envio dos gols

const queue: number[] = [];
let sending = false;
const RETRY_MS = 15_000;
/** Tentativas da partida da vez (sem rede, ou a migração ainda não aplicada): depois disso ela não soma. */
const TRIES = 4;
let tries = 0;

async function flush() {
    if (sending) return;
    sending = true;
    try {
        while (queue.length) {
            const sb = cloudUserId() ? await loadCloud().catch(() => null) : null;
            if (!sb) {
                queue.length = 0;
                return;
            }
            const { data, error } = await sb.rpc('natal_gols_somar', { p_gols: queue[0] });
            // sem rede: tenta de novo daqui a pouco. ponytail: a fila é da aba (fechou sem rede, a partida não soma)
            if (error && !/sem_conta|fora_do_prazo/.test(error.message) && ++tries < TRIES) {
                window.setTimeout(() => void flush(), RETRY_MS);
                return;
            }
            tries = 0;
            queue.shift();
            if (!error && typeof data === 'number') useDesafio.setState({ meus: data });
        }
    } finally {
        sending = false;
    }
    void refreshDesafio(true);
}

/** Gols de uma partida terminada: soma no desafio (só aberto, só conta Google, 0 gol não manda nada). */
export function reportGoals(gols: number) {
    if (gols <= 0 || !cloudUserId() || desafioNow() !== 'open') return;
    queue.push(gols);
    void flush();
}

/** Os gols do jogador em cada partida terminada que o save acabou de gravar (Copa, Copa do Dia, Rota, Ultimate, Duelo). */
type Saved = Pick<GameState, 'run' | 'ultimate' | 'duels'>;
export function goalsOf(s: Saved, prev: Saved, now = Date.now()): number[] {
    const out: number[] = [];
    // Copa, Copa do Dia e Rota: a mesma copa ganhou um resultado
    if (s.run && prev.run && s.run.seed === prev.run.seed && s.run.results.length > prev.run.results.length)
        out.push(s.run.results[s.run.results.length - 1].score[0]);
    // Time Ultimate (Batalhas e líderes): mais uma partida jogada
    const u = s.ultimate;
    if (u.played > prev.ultimate.played && u.last) out.push(u.last.score[0]);
    // Draft do Time Ultimate: a mesma campanha ganhou um jogo
    const g = u.draft.run?.games;
    const pg = prev.ultimate.draft.run?.games;
    if (g && pg && g !== pg && g.length > pg.length) out.push(g[g.length - 1].score[0]);
    // Duelo: partida nova e de agora (a mesma pode ser gravada de novo; anulada e save importado não contam)
    if (s.duels !== prev.duels) {
        const seen = new Set(prev.duels.map((d) => d.id));
        for (const d of s.duels)
            if (!seen.has(d.id) && d.result !== 'void' && d.date > now - 10 * 60_000) out.push(d.score[0]);
    }
    return out;
}

export function startDesafio() {
    if (!cloudApi || utNow() >= DESAFIO_TO + 30 * 86_400_000) return;
    useGame.subscribe((s, prev) => {
        // save carregando ou vindo da nuvem não é partida nova
        if (isApplyingCloud() || !useGame.persist.hasHydrated() || !prev.ultimate) return;
        for (const g of goalsOf(s, prev)) reportGoals(g);
    });
    // logou (ou a sessão voltou) e o save acertou com a nuvem: relê os seus gols e abre os prêmios
    useCloud.subscribe((c, prev) => {
        if (c.user && !prev.user) void refreshDesafio(true);
        else if (c.status === 'saved' && prev.status !== 'saved') claim();
    });
    void refreshDesafio();
}
