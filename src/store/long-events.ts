import { isMatchKind, LEGENDARY_BIRD, type MapNode, nodeById } from '../engine/cup-map';
import { draftOptions } from '../engine/draft';
import { evolutionTarget, evolveInstance, evoThreshold, type Stone, stoneInto } from '../engine/evolution';
import { formationOf } from '../engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../engine/instance';
import { ITEM_IDS, ITEMS } from '../engine/items';
import { Rng } from '../engine/rng';
import { metalOf } from '../engine/shop';
import { rollSpecial } from '../engine/specials';
import type { RunState } from './game-store';
import { currentNode, isLong, isOut, longRound, type OutWhy } from './long-cup';

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
/**
 * `centro` = o Centro Pokémon do mapa, `pc` = o PC do Bill (o Centro sem nada pra tratar) e `pedra` = a pedra ganha num
 * Jogo ou tirada da Mochila (a mesma tela, fora do sorteio). `safari` e `cassino` = as casas novas do mapa largo.
 */
export type EventId = (typeof EVENT_IDS)[number] | 'centro' | 'pc' | 'pedra' | 'safari' | 'cassino';

export interface LongEvent {
    id: EventId;
    /** Pokémon do seu time envolvidos (carrinho: os dois que se trombaram; juiz: o reserva que vai embora). */
    uids?: string[];
    /** Cartas oferecidas (patrocinador; fósseis: Omanyte e Kabuto). */
    cards?: PokemonInstance[];
    /** Ovo: a espécie que vai nascer (segredo até chocar). */
    egg?: number;
    /** A pedra ganha (prêmio `pedra` do Jogo). */
    stone?: Stone;
    /** A pedra saiu da Mochila (guardar = continua lá; usar e vender tiram de lá). */
    bag?: boolean;
}

/**
 * O que cada escolha pede: nada, alguém do time, alguém do banco, quem segura item, quem evolui com a pedra, quem está
 * sem item.
 */
export type Need = 'none' | 'involved' | 'bench' | 'holder' | 'stone' | 'captainSale' | 'noItem';

export interface EventChoice {
    id: string;
    /** ₽ que custa (negativo = ganha). */
    cost: number;
    need: Need;
    /** Dá pra escolher agora (₽ suficiente, banco cheio…). */
    ok: boolean;
    /** Aposta (Safari, Cassino): a chance de dar certo, à vista no botão. */
    chance?: number;
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
/** O Ovo choca um destes (o que você ainda não tem). */
const EGG_POOL = [147, 133, 131, 137, 113];
/** Partidas até o Ovo chocar. */
export const EGG_MATCHES = 2;
/** Aposta do Blue (ganha ou perde) e o preço do Juiz. */
export const BET = 6;
export const JUDGE_PRICE = 10;

/**
 * O que não fica mais sem valor na Rota (docs/planos/rota-indigo.md, decidido com o Miguel em 09/11): Dispensar o
 * rival, as etiquetas do Pular, vender a pedra e a Folga do Treino.
 */
export const ROTA_VALUES = {
    /** "Dispensar" o 1 de 3 do rival. */
    dismiss: 2,
    /** Etiquetas do Pular: ₽ e sorteios. */
    skipMoney: 4,
    skipRerolls: 2,
    /** Vender a pedra (ou tirar da Mochila e vender). */
    stoneSale: 4,
    /** Folga no Treino (no lugar do Descanso de +1 sorteio). */
    folga: 5,
};

/** Zona Safari (Gen 1): os selvagens dela. Quanto melhor a carta, mais fácil ela fugir da Safari Ball. */
export const SAFARI_POOL = [29, 30, 32, 33, 46, 47, 48, 49, 54, 79, 84, 102, 111, 113, 115, 118, 123, 127, 128, 147];
export const SAFARI_FLEE = { bronze: 0.15, prata: 0.35, ouro: 0.55 } as const;
/** Balcão de prêmios do Cassino de Celadon (Gen 1). */
export const CASSINO_POOL = [63, 35, 30, 147, 123, 127, 137];
/** Cassino: o caça-níquel (item pra quem está sem) e o balcão (a carta à vista), com o preço e a chance. */
export const CASSINO = { spin: 3, spinWin: 0.5, prize: 8, prizeWin: 0.6 } as const;
/** Chance de a carta fugir da Safari Ball. */
export const fleeOf = (inst: PokemonInstance) => SAFARI_FLEE[metalOf(viewInstance(inst).overall)];

const squadOf = (run: RunState) => [...run.lineup, ...run.bench].filter(Boolean);
const benchFree = (run: RunState) => run.bench.filter((u) => u && u !== run.captainUid);
/** Quem evolui com a pedra (a Pedra da Lua: Nidorina, Nidorino, Clefairy, Jigglypuff). */
export const stoners = (run: Pick<RunState, 'picks' | 'out'>, stone: Stone) =>
    run.picks.filter((p) => p.ability !== 'imposter' && stoneInto(p.speciesId, stone) !== null && !isOut(run, p.uid));
/** A pedra do evento: a ganha no Jogo ou a Pedra da Lua dos Fósseis. */
const stoneOf = (ev: LongEvent): Stone => ev.stone ?? 'lua';
const holders = (run: RunState) => squadOf(run).filter((u) => run.picks.find((p) => p.uid === u)?.item);
const noItem = (run: RunState) => squadOf(run).filter((u) => !run.picks.find((p) => p.uid === u)?.item);
const rating = (run: RunState, uid: string) => {
    const p = run.picks.find((x) => x.uid === uid);
    return p ? viewInstance(p).overall : 0;
};
/** Sai do time (do banco): a vaga fica vazia pra um reforço, nunca some. */
const leave = (run: RunState, uid: string): RunState => ({
    ...run,
    picks: run.picks.filter((p) => p.uid !== uid),
    bench: run.bench.map((u) => (u === uid ? '' : u)),
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
    // PC do Bill: um reserva por uma carta da raridade do Baú (a melhor de 3 sorteadas, à vista)
    if (id === 'pc') return { id, cards: offer(Math.min(6, longRound(run.stage) + 1), 1, 3) };
    if (id === 'ovo') {
        const free = EGG_POOL.filter((sp) => !taken.has(sp));
        return { id, egg: rng.pick(free.length ? free : EGG_POOL) };
    }
    // Zona Safari: 3 selvagens que você ainda não tem; Cassino: a carta do balcão de prêmios
    const wild = (pool: readonly number[], n: number) =>
        rng
            .shuffle(pool.filter((sp) => !taken.has(sp)))
            .slice(0, n)
            .map((sp) => ({ ...createInstance(sp, rng), uid: `${id}-${sp}-${run.at}` }));
    if (id === 'safari') return { id, cards: wild(SAFARI_POOL, 3) };
    if (id === 'cassino') return { id, cards: wild(CASSINO_POOL, 1) };
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
            // fugir dos repórteres vale +1 sorteio (antes "Sem comentários" não dava nada)
            return [c('respeito', 0, 'none'), c('provocar', -4, 'none'), c('sair', 0, 'none')];
        case 'fosseis':
            return [
                c('helix', 0, 'bench', bench >= 1 && !taken.has(138)),
                c('domo', 0, 'bench', bench >= 1 && !taken.has(140)),
                c('pedra', 0, 'stone', stoners(run, 'lua').length > 0),
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
        case 'pedra':
            // ninguém usa: guarda na Mochila (pra quem entrar depois) ou vende; não há mais o "Deixar" que não dava nada
            return [
                c('usar', 0, 'stone', stoners(run, stoneOf(ev)).length > 0),
                c('guardar', 0, 'none'),
                c('vender', -ROTA_VALUES.stoneSale, 'none'),
            ];
        case 'pc':
            return [c('trocar', 0, 'bench', bench >= 1 && !!ev.cards?.length), c('seguir', 0, 'none')];
        case 'safari':
            // uma Safari Ball só: se pegar, entra no lugar do reserva que você escolheu; se fugir, ninguém sai
            return [
                ...(ev.cards ?? []).map((card, i) => ({
                    ...c(`bola${i}`, 0, 'bench', bench >= 1),
                    chance: 1 - fleeOf(card),
                })),
                c('seguir', 0, 'none'),
            ];
        case 'cassino':
            return [
                { ...c('girar', CASSINO.spin, 'noItem', noItem(run).length > 0), chance: CASSINO.spinWin },
                {
                    ...c('premio', CASSINO.prize, 'bench', bench >= 1 && !!ev.cards?.length),
                    chance: CASSINO.prizeWin,
                },
                c('sair', 0, 'none'),
            ];
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
    if (need === 'stone') return stoners(run, stoneOf(ev)).map((p) => p.uid);
    if (need === 'holder') return holders(run);
    if (need === 'noItem') return noItem(run);
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
    // a pedra evolui na hora (fora da partida); a forma nova herda a vaga em que ele joga, como na evolução em partida
    const stoneEvolve = (uid: string) =>
        next.picks.map((p) => {
            const into = p.uid === uid ? stoneInto(p.speciesId, stoneOf(ev)) : null;
            if (into === null) return p;
            const at = run.lineup.indexOf(uid);
            return { ...evolveInstance(p, into, at >= 0 ? formationOf(run.formation).slots[at] : undefined), evo: 0 };
        });
    const swapIn = (inst: PokemonInstance, leaving: string): RunState => ({
        ...next,
        picks: [...next.picks.filter((p) => p.uid !== leaving), inst],
        bench: next.bench.map((u) => (u === leaving ? inst.uid : u)),
    });
    const won = gambleWon(run, ev, choiceId);
    if (won === false) return next;
    if (ev.id === 'safari' && choiceId.startsWith('bola')) return swapIn(ev.cards![Number(choiceId.slice(4))], target!);
    switch (`${ev.id}:${choiceId}`) {
        case 'cassino:girar':
            return {
                ...next,
                picks: next.picks.map((p) => (p.uid === target ? { ...p, item: cassinoItem(run) } : p)),
            };
        case 'cassino:premio':
            return swapIn(ev.cards![0], target!);
        case 'carrinho:parar':
            return { ...next, ...out(target!, 2, 'lesao') };
        case 'patrocinador:aceitar': {
            // dois por um: os dois reservas vão embora, a carta lacrada entra na vaga do primeiro e a outra fica vazia
            const leaving = benchFree(run).slice(0, 2);
            const inst = ev.cards![0];
            return {
                ...next,
                picks: [...next.picks.filter((p) => !leaving.includes(p.uid)), inst],
                bench: next.bench.map((u) => (u === leaving[0] ? inst.uid : leaving.includes(u) ? '' : u)),
            };
        }
        case 'capitao:vender': {
            // o capitão vai embora; o reserva escolhido entra na vaga dele (na quadra ou no banco, onde ele estiver) e a
            // vaga do reserva fica vazia; você escolhe o novo capitão
            const old = run.captainUid;
            if (!old) return null;
            const swap = (u: string) => (u === old ? target! : u === target ? old : u);
            const lineup = next.lineup.map(swap);
            if (!captain || !lineup.includes(captain) || captain === old) return null;
            return {
                ...next,
                picks: next.picks.filter((p) => p.uid !== old),
                lineup,
                bench: next.bench.map(swap).map((u) => (u === old ? '' : u)),
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
            return { ...next, picks: stoneEvolve(target!) };
        case 'pedra:usar':
            return { ...next, picks: stoneEvolve(target!), ...(ev.bag && { bag: bagWithout(run, stoneOf(ev)) }) };
        case 'pedra:guardar':
            return ev.bag ? next : { ...next, bag: [...(run.bag ?? []), stoneOf(ev)] };
        case 'pedra:vender':
            return ev.bag ? { ...next, bag: bagWithout(run, stoneOf(ev)) } : next;
        case 'pc:trocar':
            return swapIn(ev.cards![0], target!);
        case 'entrevista:sair':
            return { ...next, rerolls: next.rerolls + 1 };
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
    const known = (id: string) =>
        ['centro', 'pc', 'pedra', 'safari', 'cassino'].includes(id) || (EVENT_IDS as readonly string[]).includes(id);
    let out: RunState = run;
    if (run.event && !known(run.event.id))
        out = { ...out, event: rollEvent({ ...run, eventsSeen: [...(run.eventsSeen ?? []), run.event.id] }) };
    if (run.eventNote && !known(run.eventNote.id)) out = { ...out, eventNote: null };
    return out as T;
}

/**
 * Aposta da Safari (a bola pega?) e do Cassino (o caça-níquel e o balcão pagam?): pela seed e pela casa, então a tela
 * pode mostrar o resultado antes de valer e voltar na mesma copa dá o mesmo. null = não é aposta.
 */
export function gambleWon(run: RunState, ev: LongEvent, choiceId: string): boolean | null {
    const c = eventChoices(run, ev).find((x) => x.id === choiceId);
    if (c?.chance === undefined) return null;
    return new Rng(run.seed, `${ev.id}-${run.at}-${choiceId}`).chance(c.chance);
}
/** O item do caça-níquel: um que o time ainda não tem. */
export function cassinoItem(run: RunState): string {
    const owned = new Set(run.picks.map((p) => p.item).filter(Boolean));
    const pool = ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type' && !owned.has(id));
    return new Rng(run.seed, `cassino-${run.at}-item`).pick(pool.length ? pool : ITEM_IDS);
}
/**
 * A nota no mapa depois da escolha: na aposta, o resultado (`pegou`/`fugiu` na Safari, `ganhou`/`perdeu` no Cassino) e
 * o nome de quem entra ou de quem leva o item.
 */
export function gambleNote(
    run: RunState,
    ev: LongEvent,
    choiceId: string,
    target?: string,
): { choice: string; names: string[] } | null {
    const won = gambleWon(run, ev, choiceId);
    if (won === null) return null;
    const card = ev.id === 'safari' ? ev.cards?.[Number(choiceId.slice(4))] : ev.cards?.[0];
    const who = choiceId === 'girar' ? run.picks.find((p) => p.uid === target) : card;
    const names = who ? [viewInstance(who).displayName] : [];
    if (ev.id === 'safari') return { choice: won ? 'pegou' : 'fugiu', names };
    return { choice: won ? (choiceId === 'girar' ? 'ganhouItem' : 'ganhou') : 'perdeu', names };
}

/** Tira uma pedra dessas da Mochila. */
const bagWithout = (run: RunState, stone: Stone) => {
    const bag = [...(run.bag ?? [])];
    bag.splice(bag.indexOf(stone), 1);
    return bag.length ? bag : undefined;
};

/** Centro Pokémon sem amarelo pra tirar nem ninguém fora: vira o PC do Bill (antes só sobrava "Seguir viagem"). */
export const centroEvent = (run: RunState): EventId =>
    (run.cards ?? 0) > 0 || squadOf(run).some((u) => isOut(run, u)) ? 'centro' : 'pc';

/** O que o Pular dá na Rota (estilo Balatro: a etiqueta aparece no botão antes de você decidir). */
export type SkipTag = 'dispensar' | 'money' | 'shop' | 'rival' | 'evo' | 'rerolls';

/** Casas que ainda dá pra alcançar no mapa a partir de onde você está. */
function ahead(run: RunState): MapNode[] {
    const map = run.map;
    if (!map || run.group) return [];
    const seen = new Set<string>();
    const todo = [...(currentNode(run)?.next ?? map.nodes.filter((n) => n.row === 0).map((n) => n.id))];
    while (todo.length) {
        const id = todo.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        todo.push(...(nodeById(map, id)?.next ?? []));
    }
    return map.nodes.filter((n) => seen.has(n.id));
}

/** Quem leva a meia barra do Pular: o titular (depois o reserva) mais perto de evoluir. */
export function skipEvoTarget(run: RunState): PokemonInstance | undefined {
    const max = evoThreshold(run.sponsors);
    return [...run.lineup, ...run.bench]
        .map((u) => run.picks.find((p) => p.uid === u))
        .filter(
            (p): p is PokemonInstance =>
                !!p && evolutionTarget(p.speciesId, p.uid) !== null && (p.evo ?? 0) < max && !isOut(run, p.uid),
        )
        .sort((a, b) => +run.bench.includes(a.uid) - +run.bench.includes(b.uid) || (b.evo ?? 0) - (a.evo ?? 0))[0];
}

/**
 * A etiqueta do Pular desta tela de recompensa, pela seed (a mesma até você sair dela). O rival tem a dele (Dispensar:
 * +₽2). Só entra no sorteio o que serve agora: troca grátis com um Mercado pela frente, rival −1 com partida no mapa e
 * sem outro −1 guardado (a Entrevista), meia barra com alguém que evolui. null = Relâmpago (+1 sorteio de sempre).
 */
export function skipTagOf(run: RunState): SkipTag | null {
    if (!isLong(run)) return null;
    if (run.rivalPick) return 'dispensar';
    const next = ahead(run);
    const pool: SkipTag[] = ['money', 'rerolls'];
    if (next.some((n) => n.kind === 'mercado')) pool.push('shop');
    if ((run.rivalShift ?? 0) >= 0 && next.some((n) => isMatchKind(n.kind))) pool.push('rival');
    if (skipEvoTarget(run)) pool.push('evo');
    return new Rng(run.seed, `skip-${run.at}-${run.stage}${run.group ? '-g' : ''}`).pick(pool);
}

/** Aplica o Pular (a etiqueta da tela). */
export function applySkip(run: RunState): RunState {
    const money = run.money ?? 0;
    switch (skipTagOf(run)) {
        case null:
            return { ...run, rerolls: run.rerolls + 1 };
        case 'dispensar':
            return { ...run, money: money + ROTA_VALUES.dismiss };
        case 'money':
            return { ...run, money: money + ROTA_VALUES.skipMoney };
        case 'rerolls':
            return { ...run, rerolls: run.rerolls + ROTA_VALUES.skipRerolls };
        case 'shop':
            return { ...run, shopFree: (run.shopFree ?? 0) + 1 };
        case 'rival':
            return { ...run, rivalShift: -1 };
        case 'evo': {
            const uid = skipEvoTarget(run)!.uid;
            const max = evoThreshold(run.sponsors);
            return {
                ...run,
                picks: run.picks.map((p) => (p.uid === uid ? { ...p, evo: Math.min(max, (p.evo ?? 0) + max / 2) } : p)),
            };
        }
    }
}

/**
 * "Sortear de novo" no 1 de 3 do rival: só se o elenco dele tem alguém que não está na mesa (ou se há um reforço
 * sorteado). Fora do rival, sempre.
 */
export function rewardRerollable(run: RunState): boolean {
    if (!run.rivalPick) return true;
    const opp = run.opponents[run.stage];
    const shown = new Set(run.rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst.speciesId] : [])));
    const taken = new Set(run.picks.map((p) => p.speciesId));
    return (
        run.rewards.some((r) => r.kind === 'pokemon' && !r.from) ||
        [...(opp?.lineup ?? []), ...(opp?.bench ?? [])].some((p) => !taken.has(p.speciesId) && !shown.has(p.speciesId))
    );
}
