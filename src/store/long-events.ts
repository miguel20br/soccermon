import { LEGENDARY_BIRD } from '../engine/cup-map';
import { draftOptions } from '../engine/draft';
import { evolutionTarget, evoThreshold } from '../engine/evolution';
import { createInstance, type PokemonInstance, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { rollSpecial } from '../engine/specials';
import type { RunState } from './game-store';
import { isOut, type OutWhy } from './long-cup';

/**
 * Eventos "?" da Copa longa (revisão da Rota, docs/planos/rota-indigo-revisao.md). Regras: uma tela, 2–3 escolhas, o
 * custo no botão; ninguém do time sofre sem você escolher quem; tudo pela seed (mesma copa, mesmo evento) e sem repetir
 * na mesma copa. Fósseis e Pássaro lendário só aparecem na região deles; o Juiz, só com cartão amarelo.
 */
export const EVENT_IDS = [
    'carrinho',
    'patrocinador',
    'capitao',
    'entrevista',
    'fosseis',
    'lendario',
    'rocket',
    'aposta',
    'juiz',
    'ovo',
] as const;
/** `centro` = o Centro Pokémon do mapa (a mesma tela, fora do sorteio). */
export type EventId = (typeof EVENT_IDS)[number] | 'centro';

export interface LongEvent {
    id: EventId;
    /** Pokémon do seu time envolvidos (carrinho: os dois que se trombaram; juiz: o reserva que vai embora). */
    uids?: string[];
    /** Cartas oferecidas (patrocinador; fósseis: Omanyte e Kabuto). */
    cards?: PokemonInstance[];
    /** Ovo: a espécie que vai nascer (segredo até chocar). */
    egg?: number;
}

/** O que cada escolha pede: nada, alguém do time, alguém do banco, quem segura item, quem evolui com a Pedra da Lua. */
export type Need = 'none' | 'involved' | 'bench' | 'holder' | 'stone' | 'captainSale';

export interface EventChoice {
    id: string;
    /** ₽ que custa (negativo = ganha). */
    cost: number;
    need: Need;
    /** Dá pra escolher agora (₽ suficiente, banco cheio…). */
    ok: boolean;
}

/** O capitão só recebe proposta de vez em quando; os de região e o Juiz, quando aparecem, aparecem mais. */
const WEIGHT: Record<(typeof EVENT_IDS)[number], number> = {
    carrinho: 3,
    patrocinador: 2,
    capitao: 1,
    entrevista: 2,
    fosseis: 5,
    lendario: 5,
    rocket: 3,
    aposta: 3,
    juiz: 4,
    ovo: 3,
};

/** Linha do mapa de cada evento de região: os Fósseis na entrada do Mt. Moon, o Zapdos perto da Usina (Cerulean). */
const REGION_ROW: Partial<Record<EventId, number>> = { fosseis: 3, lendario: 6 };
/** Quem evolui com a Pedra da Lua: Nidorina, Nidorino, Clefairy, Jigglypuff. */
const MOON_STONE = new Set([30, 33, 35, 39]);
/** O Ovo choca um destes (o que você ainda não tem). */
const EGG_POOL = [147, 133, 131, 137, 113];
/** Partidas até o Ovo chocar. */
export const EGG_MATCHES = 2;
/** Aposta do Blue (ganha ou perde) e o preço do Juiz. */
export const BET = 6;
export const JUDGE_PRICE = 10;

const squadOf = (run: RunState) => [...run.lineup, ...run.bench].filter(Boolean);
const benchFree = (run: RunState) => run.bench.filter((u) => u && u !== run.captainUid);
const stoners = (run: RunState) =>
    run.picks.filter(
        (p) => MOON_STONE.has(p.speciesId) && evolutionTarget(p.speciesId, p.uid) !== null && !isOut(run, p.uid),
    );
const holders = (run: RunState) => squadOf(run).filter((u) => run.picks.find((p) => p.uid === u)?.item);
const rating = (run: RunState, uid: string) => {
    const p = run.picks.find((x) => x.uid === uid);
    return p ? viewInstance(p).overall : 0;
};
/** Sai do time (do banco). */
const leave = (run: RunState, uid: string): RunState => ({
    ...run,
    picks: run.picks.filter((p) => p.uid !== uid),
    bench: run.bench.filter((u) => u !== uid),
});

/**
 * Sorteia o evento da casa `run.at` (sem repetir os já vistos e só os que fazem sentido agora). `only` = esse evento,
 * sem sorteio (demos e testes).
 */
export function rollEvent(run: RunState, only?: EventId): LongEvent {
    const rng = new Rng(run.seed, `event-${run.at}`);
    const seen = new Set(run.eventsSeen ?? []);
    const row = run.map?.nodes.find((n) => n.id === run.at)?.row;
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const can = (id: (typeof EVENT_IDS)[number]) =>
        !seen.has(id) &&
        (REGION_ROW[id] === undefined || REGION_ROW[id] === row) &&
        (id !== 'patrocinador' || benchFree(run).length >= 2) &&
        (id !== 'capitao' || benchFree(run).length >= 1) &&
        (id !== 'ovo' || (benchFree(run).length >= 1 && !run.egg)) &&
        (id !== 'juiz' || (run.cards ?? 0) > 0) &&
        (id !== 'aposta' || ((run.money ?? 0) >= BET && !run.bet)) &&
        ((id !== 'rocket' && id !== 'lendario') || !run.challenge) &&
        (id !== 'lendario' || !taken.has(LEGENDARY_BIRD));
    const pool = EVENT_IDS.filter(can);
    const id = only ?? (pool.length ? rng.weighted(pool, (e) => WEIGHT[e]) : 'entrevista');
    // as melhores `n` de um sorteio maior (o patrocinador promete uma carta "muito boa": sai a melhor de 5)
    const offer = (round: number, n: number, of = n) =>
        draftOptions(rng, round, taken, of, [], 'ANY')
            .sort((x, y) => viewInstance(y).overall - viewInstance(x).overall)
            .slice(0, n)
            .map((m) => rollSpecial(m, run.eventType ?? null));
    // a trombada é entre dois titulares (com reserva, parar saía de graça)
    if (id === 'carrinho') return { id, uids: rng.shuffle(run.lineup.filter((u) => u && !isOut(run, u))).slice(0, 2) };
    if (id === 'patrocinador') return { id, cards: offer(6, 1, 5) };
    if (id === 'fosseis')
        return {
            id,
            cards: [138, 140].map((sp) => ({ ...createInstance(sp, rng), uid: `fossil-${sp}-${run.at}` })),
        };
    if (id === 'juiz') {
        const best = [...benchFree(run)].sort((a, b) => rating(run, b) - rating(run, a))[0];
        return { id, uids: best ? [best] : [] };
    }
    if (id === 'ovo') {
        const free = EGG_POOL.filter((sp) => !taken.has(sp));
        return { id, egg: rng.pick(free.length ? free : EGG_POOL) };
    }
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
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const bench = benchFree(run).length;
    switch (ev.id) {
        case 'carrinho':
            return [c('parar', 0, 'involved'), c('fisio', 4, 'none')];
        case 'patrocinador':
            return [c('aceitar', 0, 'none', bench >= 2), c('recusar', 0, 'none')];
        case 'capitao':
            return [c('vender', -15, 'captainSale', bench >= 1), c('recusar', 0, 'none')];
        case 'entrevista':
            return [c('respeito', 0, 'none'), c('provocar', -4, 'none'), c('sair', 0, 'none')];
        case 'fosseis':
            return [
                c('helix', 0, 'bench', bench >= 1 && !taken.has(138)),
                c('domo', 0, 'bench', bench >= 1 && !taken.has(140)),
                c('pedra', 0, 'stone', stoners(run).length > 0),
                c('seguir', 0, 'none'),
            ];
        case 'lendario':
            return [c('desafiar', 0, 'none'), c('deixar', 0, 'none')];
        case 'rocket':
            // sem saída de graça: entrega algo ou encara (o reserva só se sobrar outro no banco)
            return [
                c('item', 0, 'holder', holders(run).length > 0),
                c('reserva', 0, 'bench', bench >= 2),
                c('encarar', 0, 'none'),
            ];
        case 'aposta':
            return [c('topar', 0, 'none', (run.money ?? 0) >= BET), c('nemvem', 0, 'none')];
        case 'juiz':
            return [
                c('pagar', JUDGE_PRICE, 'none', (run.cards ?? 0) > 0),
                c('reserva', 0, 'none', (run.cards ?? 0) > 0 && bench >= 2 && !!ev.uids?.[0]),
                c('deixa', 0, 'none'),
            ];
        case 'ovo':
            return [c('ficar', 0, 'bench', bench >= 1), c('deixar', 0, 'none')];
        case 'centro':
            return [
                c('amarelo', 0, 'none', (run.cards ?? 0) > 0),
                c(
                    'voltar',
                    0,
                    'none',
                    squadOf(run).some((u) => isOut(run, u)),
                ),
                c('seguir', 0, 'none'),
            ];
    }
}

/** Quem pode ser escolhido pra essa escolha (uids). */
export function choiceTargets(run: RunState, ev: LongEvent, need: Need): string[] {
    if (need === 'involved') return ev.uids ?? [];
    if (need === 'stone') return stoners(run).map((p) => p.uid);
    if (need === 'holder') return holders(run);
    if (need === 'bench' || need === 'captainSale') return benchFree(run);
    return [];
}

/**
 * Aplica a escolha. `target` = quem (do time ou do banco), `captain` = o novo capitão (venda do capitão). null =
 * escolha inválida (falta alvo, sem ₽).
 */
export function resolveEvent(
    run: RunState,
    ev: LongEvent,
    choiceId: string,
    target?: string,
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
    // barra cheia = o limiar do seu time (Clube Formador baixa pra 10)
    const evoMax = evoThreshold(run.sponsors);
    const evoFill = (uid: string, amount: number) =>
        next.picks.map((p) => (p.uid === uid ? { ...p, evo: Math.min(evoMax, (p.evo ?? 0) + amount) } : p));
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
            // o capitão vai embora; o reserva escolhido entra na vaga dele (na quadra ou no banco, onde ele estiver) e a
            // vaga do reserva some; você escolhe o novo capitão
            const old = run.captainUid;
            if (!old) return null;
            const swap = (u: string) => (u === old ? target! : u === target ? old : u);
            const lineup = next.lineup.map(swap);
            if (!captain || !lineup.includes(captain) || captain === old) return null;
            return {
                ...next,
                picks: next.picks.filter((p) => p.uid !== old),
                lineup,
                bench: next.bench.map(swap).filter((u) => u !== old),
                captainUid: captain,
            };
        }
        case 'entrevista:respeito':
            return { ...next, rivalShift: -1 };
        case 'entrevista:provocar':
            return { ...next, rivalShift: 1 };
        case 'fosseis:helix':
            return swapIn(ev.cards![0], target!);
        case 'fosseis:domo':
            return swapIn(ev.cards![1], target!);
        case 'fosseis:pedra':
            // a Pedra da Lua: barra cheia, evolui na próxima partida
            return { ...next, picks: evoFill(target!, evoMax) };
        case 'lendario:desafiar':
            return { ...next, challenge: 'lendario' };
        case 'rocket:item':
            return { ...next, picks: next.picks.map((p) => (p.uid === target ? { ...p, item: null } : p)) };
        case 'rocket:reserva':
            return leave(next, target!);
        case 'rocket:encarar':
            return { ...next, challenge: 'rocket' };
        case 'aposta:topar':
            return { ...next, bet: BET };
        case 'juiz:pagar':
            return { ...next, cards: (next.cards ?? 1) - 1 };
        case 'juiz:reserva':
            return { ...leave(next, ev.uids![0]), cards: (next.cards ?? 1) - 1 };
        case 'ovo:ficar':
            return { ...leave(next, target!), egg: { left: EGG_MATCHES, speciesId: ev.egg! } };
        case 'centro:amarelo':
            return { ...next, cards: (next.cards ?? 1) - 1 };
        case 'centro:voltar':
            return { ...next, out: undefined, outWhy: undefined };
        default:
            // recusar, seguir, sair, deixar, nem vem, deixa quieto, fisioterapeuta: só o ₽ da escolha
            return next;
    }
}

/**
 * Save de antes da revisão da Rota (30/10/2026): um evento cortado (Olheiro, Pokémon perdido, Treino puxado, Creche)
 * aberto vira um sorteio novo da mesma casa, e a nota dele no mapa some. Sem isso a tela do evento quebrava.
 */
export function withKnownEvents<T extends RunState | null | undefined>(run: T): T {
    if (!run) return run;
    const known = (id: string) => id === 'centro' || (EVENT_IDS as readonly string[]).includes(id);
    let out: RunState = run;
    if (run.event && !known(run.event.id))
        out = { ...out, event: rollEvent({ ...run, eventsSeen: [...(run.eventsSeen ?? []), run.event.id] }) };
    if (run.eventNote && !known(run.eventNote.id)) out = { ...out, eventNote: null };
    return out as T;
}
