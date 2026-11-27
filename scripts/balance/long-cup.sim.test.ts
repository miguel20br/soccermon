// Robô da Copa longa (docs/planos/copa-longa.md): joga copas inteiras pelo fluxo de verdade do store.
// Uso: SIM=120 npx vitest run scripts/balance/long-cup.sim.test.ts   (sem SIM, o teste é pulado no CI)
// BOLSA=1: Bolsa do técnico ligada (itens-ativos.md, A1): o robô pega item da Bolsa no Baú, compra no Mercado (depois
// do Patrocínio) e usa na partida na hora sensata (bolsa-robo.ts). Mesmas seeds: compare com e sem.
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { bagLeft } from '../../src/engine/bag';
import { FUTSAL_5 } from '../../src/engine/config';
import { nextNodes } from '../../src/engine/cup-map';
import { formationOf } from '../../src/engine/formations';
import { slotRating } from '../../src/engine/instance';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchOrder, TeamSetup } from '../../src/engine/state';
import { bolsaSlots, setBolsaLab } from '../../src/store/bolsa';
import { playerTeam, useGame } from '../../src/store/game-store';
import { eventChoices } from '../../src/store/long-events';
import { bagPick } from './bolsa-robo';

const N = Number(process.env.SIM ?? 0);
const BOLSA = process.env.BOLSA === '1';
setBolsaLab(BOLSA);
let bagUses = 0;

/** A partida da Rota: sem Bolsa, a de sempre; com ela, ao vivo com o robô usando os itens (ordem 8 s à frente, como a tela a 4x). */
function playMatch(home: TeamSetup, away: TeamSetup, seed: string) {
    if (!home.bag?.length) return runMatch(FUTSAL_5, home, away, seed);
    const live = new LiveRunner(FUTSAL_5, home, away, seed);
    const s = live.state;
    const sent = [false, false];
    const orders: MatchOrder[] = [];
    while (!live.finished) {
        if (
            s.phase !== 'fulltime' &&
            s.tick % 20 === 0 &&
            !sent[s.half - 1] &&
            !s.teams[0].agency.bagUsed[s.half - 1]
        ) {
            const o = bagPick(s, 0, bagLeft(home.bag, s.teams[0].agency.bagUsed));
            if (o) {
                orders.push({ tick: s.tick + 160, team: 0, ...o });
                live.addOrder(orders.at(-1)!);
                sent[s.half - 1] = true;
            }
        }
        live.step();
    }
    bagUses += s.events.filter((e) => e.type === 'bag' && e.team === 0).length;
    return runMatch(FUTSAL_5, home, away, seed, { orders });
}
const g = () => useGame.getState();

/** Recompensa: Pokémon que melhora uma vaga entra no banco e troca com o titular; item vai pra um titular sem item. */
function takeReward() {
    const run = g().run!;
    const slots = formationOf(run.formation).slots;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const i = run.rewards.findIndex((r) => r.kind === 'pokemon');
    const mon = run.rewards[i];
    if (mon?.kind === 'pokemon') {
        let best = 2;
        let at = -1;
        run.lineup.forEach((u, k) => {
            if (u === run.captainUid) return;
            const gain = slotRating(mon.inst, slots[k]) - slotRating(byUid.get(u)!, slots[k]);
            if (gain > best) {
                best = gain;
                at = k;
            }
        });
        // vaga vazia do banco ('', a do Ovo da Creche) não conta
        const weakest = run.bench
            .filter((u) => byUid.has(u))
            .sort((a, b) => slotRating(byUid.get(a)!, 'ANY') - slotRating(byUid.get(b)!, 'ANY'))[0];
        if (at >= 0 && weakest) {
            g().claimReward(i, weakest);
            const benchAt = g().run!.bench.indexOf(mon.inst.uid);
            if (benchAt >= 0) g().swapSlots({ zone: 'lineup', index: at }, { zone: 'bench', index: benchAt });
            return;
        }
    }
    const bag = run.rewards.findIndex((r) => r.kind === 'bolsa');
    if (bag >= 0 && (run.bolsa?.length ?? 0) < bolsaSlots(true)) {
        g().claimReward(bag, '');
        return;
    }
    const it = run.rewards.findIndex((r) => r.kind === 'item');
    const holder = run.lineup.find((u) => !byUid.get(u)?.item);
    if (it >= 0 && holder) g().claimReward(it, holder);
    else g().skipReward();
}

/** Robô simples: prefere Jogo a Ginásio, Mercado com ₽ 10+ (compra o Patrocínio se der), sempre a escolha sem alvo. */
function play(seed: string) {
    g().newRun('Robô FC', seed, undefined, 'longa');
    g().autoDraft();
    const visits: string[] = [];
    for (let guard = 0; guard < 80; guard++) {
        const run = g().run!;
        if (run.status === 'champion' || run.status === 'eliminated') break;
        if (run.status === 'map') {
            const open = nextNodes(run.map!, run.at ?? null);
            const rank = (k: string) =>
                ({
                    jogo: 0,
                    final: 0,
                    bau: 1,
                    treino: 2,
                    evento: 3,
                    mercado: (run.money ?? 0) >= 10 ? 0 : 4,
                    ginasio: 5,
                })[k] ?? 9;
            const node = [...open].sort((a, b) => rank(a.kind) - rank(b.kind))[0];
            visits.push(node.kind);
            g().enterNode(node.id);
        } else if (run.status === 'lineup') {
            const team = playerTeam(run, 0xe8423f);
            g().lockMatch(team);
            if (!g().run!.lockedTeam) {
                // titular fora: troca com o reserva disponível
                const out = run.lineup.findIndex((u) => (run.out?.[u] ?? 0) > 0);
                const inn = run.bench.findIndex((u) => !(run.out?.[u] ?? 0));
                if (out < 0 || inn < 0) break;
                g().swapSlots({ zone: 'lineup', index: out }, { zone: 'bench', index: inn });
                continue;
            }
            const cur = g().run!;
            g().recordResult(playMatch(cur.lockedTeam!, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`));
        } else if (run.status === 'reward') takeReward();
        else if (run.status === 'shop') {
            const i = run.shop!.offers.findIndex((o) => o.kind === 'sponsor' && o.price <= (run.money ?? 0));
            if (i >= 0 && (run.sponsors?.length ?? 0) < 3) g().buyOffer(i);
            const b = g().run!.shop!.offers.findIndex((o) => o.kind === 'bolsa');
            const after = g().run!;
            if (
                b >= 0 &&
                (after.money ?? 0) >= after.shop!.offers[b].price &&
                (after.bolsa?.length ?? 0) < bolsaSlots(true)
            )
                g().buyOffer(b);
            g().leaveShop();
        } else if (run.status === 'treino') g().train('rest');
        else if (run.status === 'group') g().playNext();
        else if (run.status === 'event') {
            const c = eventChoices(run, run.event!).find((x) => x.ok && x.need === 'none');
            if (c) g().chooseEvent(c.id);
            else break;
        } else break;
    }
    const run = g().run!;
    return {
        champion: run.status === 'champion',
        played: run.results.length,
        lost: run.results.filter((r) => !r.won).length,
        cards: run.cards ?? 0,
        money: run.money ?? 0,
        visits,
    };
}

describe.skipIf(!N)('robô da Copa longa', () => {
    it(`joga ${N} copas`, () => {
        const res = Array.from({ length: N }, (_, i) => play(`robo-longa-${i}`));
        const titles = res.filter((r) => r.champion).length;
        const byPlayed = Array.from({ length: 9 }, (_, k) => res.filter((r) => r.played === k).length);
        const out = {
            copas: N,
            titulo: `${((100 * titles) / N).toFixed(1)}%`,
            usaramAmarelo: `${((100 * res.filter((r) => r.cards > 0).length) / N).toFixed(0)}%`,
            partidasJogadas: byPlayed,
            moneyFimMedia: (res.reduce((a, r) => a + r.money, 0) / N).toFixed(1),
            bolsa: BOLSA,
            itensUsadosPorCopa: (bagUses / N).toFixed(2),
            partidasMedia: (res.reduce((a, r) => a + r.played, 0) / N).toFixed(2),
        };
        console.log(JSON.stringify(out, null, 1));
        if (process.env.SIM_OUT) writeFileSync(process.env.SIM_OUT, JSON.stringify(res));
        expect(res.every((r) => r.played > 0)).toBe(true);
    }, 3_600_000);
});
