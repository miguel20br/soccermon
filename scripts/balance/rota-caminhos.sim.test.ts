// Quanto o caminho importa na Rota Índigo (docs/planos/rota-indigo-revisao.md).
// 1) Mapa (rápido, sem partida): de cada casa, quais tipos de casa dá pra alcançar na próxima parada.
// 2) Robô por política de caminho, mesmas seeds pra todas (comparação pareada): time, Pokémon novos, itens, ₽, título.
// Uso: SIM=100 [POL=esquerda,direita,ouro,pokemon,ginasio,aleatorio] SIM_OUT=saida.json \
//      scripts/pesado.sh npx vitest run scripts/balance/rota-caminhos.sim.test.ts --maxWorkers=1   (sem SIM, pulado)
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { FUTSAL_5 } from '../../src/engine/config';
import { buildCupMap, type CupMap, type MapNode, nextNodes, nodeById } from '../../src/engine/cup-map';
import { evolutionTarget } from '../../src/engine/evolution';
import { formationOf } from '../../src/engine/formations';
import { type PokemonInstance, slotRating } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { playerTeam, type RunState, useGame } from '../../src/store/game-store';
import { choiceTargets, eventChoices } from '../../src/store/long-events';

const N = Number(process.env.SIM ?? 0);
/** A recompensa aberta é a de uma vitória (casa de partida, ou o grupo), não o Baú nem o Treino. */
const isMatchAt = (run: RunState) =>
    !!run.group || ['jogo', 'ginasio'].includes(nodeById(run.map!, run.at ?? '')?.kind ?? '');
const g = () => useGame.getState();

/** Todos os caminhos do mapa (da linha 0 ao Treino), como lista de casas. */
function allPaths(map: CupMap): MapNode[][] {
    const out: MapNode[][] = [];
    const walk = (n: MapNode, acc: MapNode[]) => {
        const next = n.next.map((id) => nodeById(map, id)!);
        if (!next.length) out.push([...acc, n]);
        for (const x of next) walk(x, [...acc, n]);
    };
    for (const n of map.nodes.filter((x) => x.row === 0)) walk(n, []);
    return out;
}

const kindsOf = (p: MapNode[]) => p.map((n) => n.kind);
const count = (p: MapNode[], k: string) => p.filter((n) => n.kind === k).length;

function mapStats(seeds: number) {
    let paths = 0;
    let gymsMin = 0;
    let gymsMax = 0;
    let anyGym = 0;
    let shopsMin = 0;
    let shopsMax = 0;
    let eventsMax = 0;
    let distinctSeq = 0;
    // de uma casa de partida: a próxima linha de parada alcançável tem Mercado e Evento?
    let fromMatch = 0;
    let bothReach = 0;
    // escolhas que fecham alguma porta: a casa escolhida numa linha tira algum tipo de casa da próxima linha
    let choices = 0;
    let closes = 0;
    // fração dos caminhos com pelo menos 1 de cada; e quanto da variedade sobra depois da 1ª casa
    let withShop = 0;
    let withEvent = 0;
    let withGym = 0;
    let gymMaps = 0;
    let freedom = 0;
    let starts = 0;
    for (let s = 0; s < seeds; s++) {
        const map = buildCupMap(`caminho-${s}`);
        const ps = allPaths(map);
        paths += ps.length;
        const gyms = ps.map((p) => count(p, 'ginasio'));
        const shops = ps.map((p) => count(p, 'mercado'));
        gymsMin += Math.min(...gyms);
        gymsMax += Math.max(...gyms);
        anyGym += map.nodes.some((n) => n.kind === 'ginasio') ? 1 : 0;
        shopsMin += Math.min(...shops);
        shopsMax += Math.max(...shops);
        eventsMax += Math.max(...ps.map((p) => count(p, 'evento')));
        distinctSeq += new Set(ps.map((p) => kindsOf(p).join(','))).size;
        withShop += ps.filter((p) => count(p, 'mercado') > 0).length / ps.length;
        withEvent += ps.filter((p) => count(p, 'evento') > 0).length / ps.length;
        if (map.nodes.some((n) => n.kind === 'ginasio')) {
            gymMaps++;
            withGym += ps.filter((p) => count(p, 'ginasio') > 0).length / ps.length;
        }
        const bag = (p: MapNode[]) => kindsOf(p).sort().join(',');
        const all = new Set(ps.map(bag)).size;
        for (const s0 of map.nodes.filter((n) => n.row === 0)) {
            starts++;
            freedom += new Set(ps.filter((p) => p[0] === s0).map(bag)).size / all;
        }
        for (const n of map.nodes) {
            const next = nextNodes(map, n.id);
            if (!next.length) continue;
            const rowKinds = new Set(map.nodes.filter((x) => x.row === n.row + 1).map((x) => x.kind));
            const reach = new Set(next.map((x) => x.kind));
            if (rowKinds.has('mercado') && (n.kind === 'jogo' || n.kind === 'ginasio')) {
                fromMatch++;
                if (reach.has('mercado') && reach.has('evento')) bothReach++;
            }
            if (rowKinds.size > 1) {
                choices++;
                if ([...rowKinds].some((k) => !reach.has(k))) closes++;
            }
        }
    }
    const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(0)}%`;
    return {
        mapas: seeds,
        caminhosPorMapa: (paths / seeds).toFixed(1),
        sequenciasDeTiposDiferentes: (distinctSeq / seeds).toFixed(1),
        mapasComGinasio: pct(anyGym, seeds),
        ginasiosMinMaxPorCaminho: `${(gymsMin / seeds).toFixed(2)}–${(gymsMax / seeds).toFixed(2)}`,
        mercadosMinMaxPorCaminho: `${(shopsMin / seeds).toFixed(2)}–${(shopsMax / seeds).toFixed(2)}`,
        eventosMaxPorCaminho: (eventsMax / seeds).toFixed(2),
        caminhosComMercado: pct(withShop, seeds),
        caminhosComEvento: pct(withEvent, seeds),
        caminhosComGinasio: pct(withGym, gymMaps),
        combinacoesQueSobramDepoisDa1aCasa: pct(freedom, starts),
        partidaAlcancaMercadoEEvento: pct(bothReach, fromMatch),
        escolhaFechaAlgumTipoNaLinhaSeguinte: pct(closes, choices),
    };
}

// ---------- robô ----------

/**
 * Réguas: `nada` = sempre à esquerda, pula toda recompensa, não compra, recusa todo evento e descansa no Treino (só a
 * evolução faz o time crescer); `partidas` = igual, mas pega a recompensa das vitórias (o que todo caminho dá igual).
 */
type Policy = 'esquerda' | 'direita' | 'ouro' | 'pokemon' | 'ginasio' | 'aleatorio' | 'nada' | 'partidas';
const idle = (p: Policy) => p === 'nada' || p === 'partidas';

const ovrIn = (run: RunState, uid: string, k: number) => {
    const p = run.picks.find((x) => x.uid === uid)!;
    return slotRating(p, formationOf(run.formation).slots[k]);
};
const lineupAvg = (run: RunState) => run.lineup.reduce((s, u, k) => s + ovrIn(run, u, k), 0) / run.lineup.length;
const anyRating = (p: PokemonInstance) => slotRating(p, 'ANY');

/** Melhor vaga (não capitão) que a carta melhora, com o ganho. */
function bestSlot(run: RunState, inst: PokemonInstance): { at: number; gain: number } {
    const slots = formationOf(run.formation).slots;
    let best = { at: -1, gain: 0 };
    run.lineup.forEach((u, k) => {
        if (u === run.captainUid) return;
        const gain = slotRating(inst, slots[k]) - ovrIn(run, u, k);
        if (gain > best.gain) best = { at: k, gain };
    });
    return best;
}
const weakestBench = (run: RunState) =>
    [...run.bench]
        .filter((u) => u && u !== run.captainUid)
        .sort(
            (a, b) => anyRating(run.picks.find((p) => p.uid === a)!) - anyRating(run.picks.find((p) => p.uid === b)!),
        )[0];

/** Carta entra no banco no lugar do pior reserva; se melhora uma vaga, troca com o titular. */
function placeNew(uid: string) {
    const run = g().run!;
    const inst = run.picks.find((p) => p.uid === uid);
    if (!inst) return;
    const { at, gain } = bestSlot(run, inst);
    const b = run.bench.indexOf(uid);
    if (at >= 0 && gain > 2 && b >= 0) g().swapSlots({ zone: 'lineup', index: at }, { zone: 'bench', index: b });
}

function takeReward(acq: Set<number>) {
    const run = g().run!;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const i = run.rewards.findIndex((r) => r.kind === 'pokemon');
    const mon = run.rewards[i];
    if (mon?.kind === 'pokemon' && bestSlot(run, mon.inst).gain > 2) {
        const w = weakestBench(run);
        if (w) {
            g().claimReward(i, w);
            if (g().run!.picks.some((p) => p.uid === mon.inst.uid)) {
                acq.add(mon.inst.speciesId);
                placeNew(mon.inst.uid);
            }
            return;
        }
    }
    const it = run.rewards.findIndex((r) => r.kind === 'item');
    const holder = run.lineup.find((u) => !byUid.get(u)?.item);
    if (it >= 0 && holder) g().claimReward(it, holder);
    else g().skipReward();
}

function shop(policy: Policy, acq: Set<number>) {
    if (policy === 'ouro' || idle(policy)) return g().leaveShop();
    for (let k = 0; k < 4; k++) {
        const run = g().run!;
        const s = run.shop!;
        const money = run.money ?? 0;
        const offers = s.offers.map((o, i) => ({ o, i })).filter(({ o, i }) => !s.sold.includes(i) && o.price <= money);
        const mon = offers
            .filter(({ o }) => o.kind === 'pokemon')
            .map((x) => ({ ...x, gain: x.o.kind === 'pokemon' ? bestSlot(run, x.o.inst).gain : 0 }))
            .sort((a, b) => b.gain - a.gain)[0];
        if (mon && mon.gain > 2 && mon.o.kind === 'pokemon') {
            const w = weakestBench(run);
            const sp = mon.o.inst.speciesId;
            if (w) g().buyOffer(mon.i, w);
            const after = g().run!;
            if (after.picks.some((p) => p.speciesId === sp && !run.picks.some((q) => q.speciesId === sp))) {
                acq.add(sp);
                placeNew(after.picks.find((p) => p.speciesId === sp)!.uid);
                continue;
            }
        }
        const sponsor = offers.find(({ o }) => o.kind === 'sponsor');
        if (sponsor && (run.sponsors?.length ?? 0) < 3) {
            g().buyOffer(sponsor.i);
            continue;
        }
        const item = offers.find(({ o }) => o.kind === 'item');
        const holder = run.lineup.find((u) => !run.picks.find((p) => p.uid === u)?.item);
        if (item && holder) {
            g().buyOffer(item.i, holder);
            continue;
        }
        break;
    }
    g().leaveShop();
}

/** Escolhas que não dão nem tiram nada (o robô `nada` sempre sai por elas). */
const EXITS = ['recusar', 'seguir', 'sair', 'deixar', 'nemvem', 'deixa'];

function event(policy: Policy, rng: Rng, acq: Set<number>) {
    const run = g().run!;
    const ev = run.event!;
    const ok = eventChoices(run, ev).filter((c) => c.ok);
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const before = new Set(run.picks.map((p) => p.speciesId));
    const go = (id: string, target?: string, captain?: string) => {
        g().chooseEvent(id, target, captain);
        for (const p of g().run!.picks)
            if (!before.has(p.speciesId)) {
                acq.add(p.speciesId);
                placeNew(p.uid);
            }
    };
    const has = (id: string) => ok.some((c) => c.id === id);
    const weakest = weakestBench(run);
    const holderOf = () =>
        choiceTargets(run, ev, 'holder').find((u) => run.bench.includes(u)) ?? choiceTargets(run, ev, 'holder')[0];
    // sem saída de graça (trombada, assalto): o mais barato
    const forced = () => {
        if (ev.id === 'carrinho') return has('fisio') ? go('fisio') : go('parar', ev.uids![0]);
        if (has('item')) return go('item', holderOf());
        if (has('reserva') && ev.id === 'rocket') return go('reserva', weakest);
        return go('encarar');
    };
    // o Centro também conta como escolha: quem recusa tudo segue viagem
    if (ev.id === 'centro' && !idle(policy))
        return go(has('amarelo') ? 'amarelo' : has('voltar') ? 'voltar' : 'seguir');
    if (idle(policy)) {
        const exit = ok.find((c) => EXITS.includes(c.id));
        return exit ? go(exit.id) : forced();
    }
    if (policy === 'aleatorio') {
        const c = rng.pick(ok);
        const t = choiceTargets(run, ev, c.need);
        if (c.need === 'captainSale') {
            const sub = rng.pick(t);
            const lineup = run.lineup.map((u) => (u === run.captainUid ? sub : u));
            return go(c.id, sub, rng.pick(lineup));
        }
        return go(c.id, c.need === 'none' ? undefined : rng.pick(t));
    }
    const better = (inst?: PokemonInstance) => {
        const w = weakestBench(run);
        return inst && w && anyRating(inst) > anyRating(byUid.get(w)!) ? w : undefined;
    };
    const bold = policy === 'ouro' || policy === 'ginasio';
    switch (ev.id) {
        case 'carrinho': {
            if (has('fisio') && policy !== 'ouro') return go('fisio');
            return go('parar', ev.uids![0]);
        }
        case 'patrocinador': {
            const leaving = run.bench.filter((u) => u && u !== run.captainUid).slice(0, 2);
            const best = Math.max(...leaving.map((u) => anyRating(byUid.get(u)!)));
            return has('aceitar') && anyRating(ev.cards![0]) > best ? go('aceitar') : go('recusar');
        }
        case 'capitao':
            if (policy === 'ouro' && has('vender')) {
                const sub = choiceTargets(run, ev, 'captainSale')[0];
                const lineup = run.lineup.map((u) => (u === run.captainUid ? sub : u));
                const cap = lineup
                    .filter((u) => u !== sub)
                    .sort((a, b) => anyRating(byUid.get(b)!) - anyRating(byUid.get(a)!))[0];
                return go('vender', sub, cap);
            }
            return go('recusar');
        case 'entrevista':
            return go(policy === 'ouro' ? 'provocar' : 'respeito');
        case 'fosseis': {
            const k = ev.cards!.map((c, i) => ({ i, r: anyRating(c) })).sort((a, b) => b.r - a.r)[0].i;
            const id = k === 0 ? 'helix' : 'domo';
            const w = better(ev.cards![k]);
            if (w && has(id)) return go(id, w);
            if (has('pedra')) return go('pedra', choiceTargets(run, ev, 'stone')[0]);
            return go('seguir');
        }
        case 'lendario':
            return go(policy === 'ouro' ? 'deixar' : 'desafiar');
        case 'rocket':
            return bold ? go('encarar') : forced();
        case 'aposta':
            return go(bold && has('topar') ? 'topar' : 'nemvem');
        case 'juiz':
            if (has('pagar') && policy !== 'ouro') return go('pagar');
            return go(has('reserva') ? 'reserva' : 'deixa');
        case 'ovo':
            return has('ficar') && weakest ? go('ficar', weakest) : go('deixar');
    }
}

function pickNode(policy: Policy, open: MapNode[], rng: Rng): MapNode {
    const byCol = [...open].sort((a, b) => a.col - b.col);
    if (policy === 'esquerda' || idle(policy)) return byCol[0];
    if (policy === 'direita') return byCol.at(-1)!;
    if (policy === 'aleatorio') return rng.pick(open);
    const rank: Record<Policy, Record<string, number>> = {
        // ₽: o Jogo de "₽ em dobro", vitória rende, Mercado paga juros (sem comprar), evento pode vender o capitão
        ouro: { jogo: 0, final: 0, evento: 1, mercado: 2, treino: 3, bau: 0, centro: 1, ginasio: 1 },
        // Pokémon novos: Ginásio (a carta do líder), o Jogo de "Pokémon do rival", Baú, Mercado, Evento
        pokemon: { ginasio: 0, final: 0, bau: 0, centro: 1, mercado: 1, evento: 2, jogo: 3, treino: 4 },
        ginasio: { ginasio: 0, final: 0, bau: 0, centro: 0, jogo: 1, treino: 2, mercado: 3, evento: 4 },
        esquerda: {},
        nada: {},
        partidas: {},
        direita: {},
        aleatorio: {},
    };
    // o prêmio à vista desempata entre Jogos (e pesa pro ouro e pro pokemon)
    const want: Partial<Record<Policy, string>> = { ouro: 'money', pokemon: 'pokemon', ginasio: 'item' };
    const score = (n: MapNode) => (rank[policy][n.kind] ?? 9) - (n.prize && n.prize === want[policy] ? 3.5 : 0);
    return [...open].sort((a, b) => score(a) - score(b) || a.col - b.col)[0];
}

function play(seed: string, policy: Policy) {
    const rng = new Rng(seed, `politica-${policy}`);
    g().newRun('Robô FC', seed, undefined, 'longa');
    g().autoDraft();
    const acq = new Set<number>();
    const visits: string[] = [];
    const strength: number[] = [];
    let moneyEarned = 0;
    let mapEnd: { avg: number; items: number; money: number } | null = null;
    for (let guard = 0; guard < 120; guard++) {
        const run = g().run!;
        if (run.status === 'champion' || run.status === 'eliminated') break;
        if (run.status === 'map') {
            const node = pickNode(policy, nextNodes(run.map!, run.at ?? null), rng);
            visits.push(node.kind);
            g().enterNode(node.id);
        } else if (run.status === 'lineup') {
            const team = playerTeam(run, 0xe8423f);
            g().lockMatch(team);
            if (!g().run!.lockedTeam) {
                const out = run.lineup.findIndex((u) => (run.out?.[u] ?? 0) > 0);
                const inn = run.bench.findIndex((u) => u && !(run.out?.[u] ?? 0));
                if (out < 0 || inn < 0) break;
                g().swapSlots({ zone: 'lineup', index: out }, { zone: 'bench', index: inn });
                continue;
            }
            const cur = g().run!;
            strength[cur.stage] = lineupAvg(cur);
            if (cur.stage === 4 && !mapEnd)
                mapEnd = {
                    avg: lineupAvg(cur),
                    items: cur.picks.filter((p) => p.item).length,
                    money: cur.money ?? 0,
                };
            const m0 = cur.money ?? 0;
            g().recordResult(
                runMatch(FUTSAL_5, cur.lockedTeam!, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`),
            );
            moneyEarned += Math.max(0, (g().run!.money ?? 0) - m0);
        } else if (run.status === 'reward') {
            if (policy === 'nada' || (policy === 'partidas' && !isMatchAt(run))) g().skipReward();
            else takeReward(acq);
        } else if (run.status === 'shop') {
            moneyEarned += run.shop?.earned?.interest ?? 0;
            shop(policy, acq);
        } else if (run.status === 'treino') {
            if (idle(policy)) {
                g().train('rest');
                continue;
            }
            const evo = run.lineup
                .map((u) => run.picks.find((p) => p.uid === u)!)
                .filter((p) => evolutionTarget(p.speciesId, p.uid) !== null)
                .sort((a, b) => (b.evo ?? 0) - (a.evo ?? 0))[0];
            if (evo && policy !== 'ouro') g().train('evo', evo.uid);
            else if (!run.picks.some((p) => evolutionTarget(p.speciesId, p.uid) !== null)) g().train('item');
            else g().train('rest');
        } else if (run.status === 'group') g().playNext();
        else if (run.status === 'event') event(policy, rng, acq);
        else break;
    }
    const run = g().run!;
    return {
        policy,
        seed,
        champion: run.status === 'champion',
        played: run.results.length,
        reachedGroup: run.results.length > 4 || (run.results.length === 4 && !!mapEnd),
        strength,
        mapEnd,
        acquired: acq.size,
        acquiredSpecies: [...acq],
        moneyEarned,
        sponsors: run.sponsors?.length ?? 0,
        visits,
    };
}

describe.skipIf(!N)('quanto o caminho importa na Rota', () => {
    it('mapa: o que cada escolha fecha', () => {
        console.log(JSON.stringify(mapStats(2000), null, 1));
    });

    it(`robô: ${N} Rotas por política`, () => {
        const pols = (process.env.POL ?? 'esquerda,direita,ouro,pokemon,ginasio,aleatorio').split(',') as Policy[];
        const res = pols.flatMap((p) => Array.from({ length: N }, (_, i) => play(`caminho-${i}`, p)));
        if (process.env.SIM_OUT) writeFileSync(process.env.SIM_OUT, JSON.stringify(res));
        const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Number.NaN);
        const table = pols.map((p) => {
            const rs = res.filter((r) => r.policy === p);
            const me = rs.flatMap((r) => (r.mapEnd ? [r.mapEnd] : []));
            const species = new Set(rs.flatMap((r) => r.acquiredSpecies));
            return {
                politica: p,
                n: rs.length,
                titulo: `${((100 * rs.filter((r) => r.champion).length) / rs.length).toFixed(1)}%`,
                chegouAoGrupo: `${((100 * me.length) / rs.length).toFixed(0)}%`,
                time1aPartida: avg(rs.map((r) => r.strength[0]).filter(Number.isFinite)).toFixed(1),
                timeNoGrupo: avg(me.map((m) => m.avg)).toFixed(1),
                itensNoGrupo: avg(me.map((m) => m.items)).toFixed(2),
                pokemonNovos: avg(rs.map((r) => r.acquired)).toFixed(2),
                especiesDistintasNoTotal: species.size,
                ganhoNoMapa: avg(rs.map((r) => r.moneyEarned)).toFixed(1),
                visitas: Object.entries(
                    rs
                        .flatMap((r) => r.visits)
                        .reduce<Record<string, number>>((acc, k) => {
                            acc[k] = (acc[k] ?? 0) + 1;
                            return acc;
                        }, {}),
                )
                    .map(([k, v]) => `${k} ${(v / rs.length).toFixed(2)}`)
                    .join(', '),
            };
        });
        console.table(table);
        expect(res.every((r) => r.played > 0)).toBe(true);
    }, 7_200_000);
});
