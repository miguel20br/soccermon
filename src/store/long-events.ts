import { draftOptions } from '../engine/draft';
import { EVO_THRESHOLD, evolutionTarget } from '../engine/evolution';
import { type PokemonInstance, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { rollSpecial } from '../engine/specials';
import type { RunState } from './game-store';
import { isOut, type OutWhy } from './long-cup';

/**
 * Eventos "?" da Copa longa (docs/planos/copa-longa-referencias.md, os 8 primeiros). Regras: uma tela, 2–3 escolhas,
 * sempre uma sem perda; nada acontece com o time sem você escolher quem; tudo pela seed (mesma copa, mesmo evento) e
 * sem repetir na mesma copa.
 */
export const EVENT_IDS = [
    'carrinho',
    'patrocinador',
    'capitao',
    'olheiro',
    'entrevista',
    'perdido',
    'treinoPuxado',
    'creche',
] as const;
export type EventId = (typeof EVENT_IDS)[number];

export interface LongEvent {
    id: EventId;
    /** Pokémon do seu time envolvidos (carrinho: os dois que se trombaram). */
    uids?: string[];
    /** Cartas oferecidas (patrocinador, olheiro, Pokémon perdido). */
    cards?: PokemonInstance[];
}

/** O que cada escolha pede: nada, alguém do time, alguém do banco, uma das cartas oferecidas. */
export type Need = 'none' | 'involved' | 'squad' | 'evolver' | 'bench' | 'card+bench' | 'captainSale';

export interface EventChoice {
    id: string;
    /** ₽ que custa (negativo = ganha). */
    cost: number;
    need: Need;
    /** Dá pra escolher agora (₽ suficiente, banco cheio…). */
    ok: boolean;
}

/** O capitão só recebe proposta de vez em quando. */
const WEIGHT: Record<EventId, number> = {
    carrinho: 3,
    patrocinador: 3,
    capitao: 1,
    olheiro: 3,
    entrevista: 3,
    perdido: 3,
    treinoPuxado: 3,
    creche: 3,
};

const squadOf = (run: RunState) => [...run.lineup, ...run.bench].filter(Boolean);
const evolvers = (run: RunState) =>
    run.picks.filter((p) => evolutionTarget(p.speciesId, p.uid) !== null && !isOut(run, p.uid));
const benchFree = (run: RunState) => run.bench.filter((u) => u && u !== run.captainUid);

/** Sorteia o evento da casa `run.at` (sem repetir os já vistos e só os que fazem sentido agora). */
export function rollEvent(run: RunState): LongEvent {
    const rng = new Rng(run.seed, `event-${run.at}`);
    const seen = new Set(run.eventsSeen ?? []);
    const can = (id: EventId) =>
        !seen.has(id) &&
        (id !== 'patrocinador' || benchFree(run).length >= 2) &&
        (id !== 'capitao' || benchFree(run).length >= 1) &&
        ((id !== 'treinoPuxado' && id !== 'creche') || evolvers(run).length > 0);
    const pool = EVENT_IDS.filter(can);
    const id = pool.length ? rng.weighted(pool, (e) => WEIGHT[e]) : 'entrevista';
    const taken = new Set(run.picks.map((p) => p.speciesId));
    // as melhores `n` de um sorteio maior (o patrocinador promete uma carta "muito boa": sai a melhor de 5)
    const offer = (round: number, n: number, of = n) =>
        draftOptions(rng, round, taken, of, [], 'ANY')
            .sort((x, y) => viewInstance(y).overall - viewInstance(x).overall)
            .slice(0, n)
            .map((m) => rollSpecial(m, run.eventType ?? null));
    if (id === 'carrinho') return { id, uids: rng.shuffle(squadOf(run).filter((u) => !isOut(run, u))).slice(0, 2) };
    if (id === 'patrocinador') return { id, cards: offer(6, 1, 5) };
    if (id === 'olheiro') return { id, cards: offer(4, 2, 4) };
    if (id === 'perdido') return { id, cards: offer(0, 1) };
    return { id };
}

export function eventChoices(run: RunState, ev: LongEvent): EventChoice[] {
    const money = run.money ?? 0;
    const c = (id: string, cost: number, need: Need, ok = true): EventChoice => ({
        id,
        cost,
        need,
        ok: ok && money >= cost,
    });
    switch (ev.id) {
        case 'carrinho':
            return [c('parar', 0, 'involved'), c('fisio', 4, 'none')];
        case 'patrocinador':
            return [c('aceitar', 0, 'none', benchFree(run).length >= 2), c('recusar', 0, 'none')];
        case 'capitao':
            return [c('vender', -15, 'captainSale', benchFree(run).length >= 1), c('recusar', 0, 'none')];
        case 'olheiro':
            return [c('contratar', 3, 'card+bench', benchFree(run).length >= 1), c('seguir', 0, 'none')];
        case 'entrevista':
            return [c('respeito', 0, 'none'), c('provocar', -4, 'none'), c('sair', 0, 'none')];
        case 'perdido':
            return [c('contratar', 0, 'bench', benchFree(run).length >= 1), c('soltar', -1, 'none')];
        case 'treinoPuxado':
            return [c('puxado', 0, 'evolver'), c('leve', 0, 'none'), c('folga', 0, 'none')];
        case 'creche':
            return [c('deixar', 0, 'evolver'), c('recusar', 0, 'none')];
    }
}

/** Quem pode ser escolhido pra essa escolha (uids). */
export function choiceTargets(run: RunState, ev: LongEvent, need: Need): string[] {
    if (need === 'involved') return ev.uids ?? [];
    if (need === 'evolver') return evolvers(run).map((p) => p.uid);
    if (need === 'bench' || need === 'card+bench' || need === 'captainSale') return benchFree(run);
    if (need === 'squad') return squadOf(run);
    return [];
}

/**
 * Aplica a escolha. `target` = quem (do time ou do banco), `card` = qual carta oferecida, `captain` = o novo capitão
 * (venda do capitão). null = escolha inválida (falta alvo, sem ₽).
 */
export function resolveEvent(
    run: RunState,
    ev: LongEvent,
    choiceId: string,
    target?: string,
    card = 0,
    captain?: string,
): RunState | null {
    const choice = eventChoices(run, ev).find((c) => c.id === choiceId);
    if (!choice?.ok) return null;
    if (choice.need !== 'none' && (!target || !choiceTargets(run, ev, choice.need).includes(target))) return null;
    const next: RunState = { ...run, money: (run.money ?? 0) - choice.cost };
    const out = (uid: string, n: number, why: OutWhy) => ({
        out: { ...(next.out ?? {}), [uid]: n },
        outWhy: { ...(next.outWhy ?? {}), [uid]: why },
    });
    const evoFill = (uid: string, amount: number) =>
        next.picks.map((p) => (p.uid === uid ? { ...p, evo: Math.min(EVO_THRESHOLD, (p.evo ?? 0) + amount) } : p));
    const swapIn = (inst: PokemonInstance, leaving: string): RunState => ({
        ...next,
        picks: [...next.picks.filter((p) => p.uid !== leaving), inst],
        bench: next.bench.map((u) => (u === leaving ? inst.uid : u)),
    });
    switch (`${ev.id}:${choiceId}`) {
        case 'carrinho:parar':
            return { ...next, ...out(target!, 2, 'lesao') };
        case 'patrocinador:aceitar': {
            // dois por um: os dois reservas vão embora e a carta lacrada entra no banco
            const leaving = benchFree(run).slice(0, 2);
            const inst = ev.cards![0];
            return {
                ...next,
                picks: [...next.picks.filter((p) => !leaving.includes(p.uid)), inst],
                bench: [inst.uid, ...next.bench.filter((u) => u && !leaving.includes(u))],
            };
        }
        case 'capitao:vender': {
            // o capitão vai embora; o reserva escolhido entra na vaga dele; você escolhe o novo capitão
            const old = run.captainUid;
            const lineup = next.lineup.map((u) => (u === old ? target! : u));
            if (!captain || !lineup.includes(captain)) return null;
            return {
                ...next,
                picks: next.picks.filter((p) => p.uid !== old),
                lineup,
                bench: next.bench.filter((u) => u !== target),
                captainUid: captain,
            };
        }
        case 'olheiro:contratar':
            return ev.cards?.[card] ? swapIn(ev.cards[card], target!) : null;
        case 'perdido:contratar':
            return swapIn(ev.cards![0], target!);
        case 'entrevista:respeito':
            return { ...next, rivalShift: -1 };
        case 'entrevista:provocar':
            return { ...next, rivalShift: 1 };
        case 'treinoPuxado:puxado':
            return { ...next, picks: evoFill(target!, EVO_THRESHOLD / 2), ...out(target!, 1, 'cansado') };
        case 'treinoPuxado:leve':
            return { ...next, rerolls: next.rerolls + 1 };
        case 'creche:deixar':
            return { ...next, picks: evoFill(target!, EVO_THRESHOLD), ...out(target!, 2, 'creche') };
        default:
            // recusar, seguir, sair, folga, soltar, fisioterapeuta: só o ₽ da escolha
            return next;
    }
}
