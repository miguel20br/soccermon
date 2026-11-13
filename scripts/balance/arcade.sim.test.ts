// Robô dos modos arcade (Copa Relâmpago e Copa do Dia) pelo fluxo de verdade do store: título, Patrocínios, Mercado,
// ₽ e telas por copa (balanceamento-geral.md, "Modos arcade × Rota", 11/11/2026).
// Uso: SIM=300 [MODO=relampago|dia] SIM_OUT=saida.json scripts/pesado.sh npx vitest run scripts/balance/arcade.sim.test.ts --maxWorkers=1
// (sem SIM, pulado no CI)
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { FUTSAL_5 } from '../../src/engine/config';
import { formationOf } from '../../src/engine/formations';
import { type PokemonInstance, slotRating } from '../../src/engine/instance';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { SPONSOR_FAMILY } from '../../src/engine/sponsors';
import { playerTeam, type RunState, useGame } from '../../src/store/game-store';

const N = Number(process.env.SIM ?? 0);
const MODO = process.env.MODO ?? 'relampago';
const g = () => useGame.getState();

const ovrIn = (run: RunState, uid: string, k: number) =>
    slotRating(run.picks.find((x) => x.uid === uid)!, formationOf(run.formation).slots[k]);
function bestSlot(run: RunState, inst: PokemonInstance) {
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
            (a, b) =>
                slotRating(run.picks.find((p) => p.uid === a)!, 'ANY') -
                slotRating(run.picks.find((p) => p.uid === b)!, 'ANY'),
        )[0];
/** A carta nova vai pro banco no lugar do pior reserva; se melhora uma vaga, troca com o titular. */
function placeNew(uid: string) {
    const run = g().run!;
    const inst = run.picks.find((p) => p.uid === uid);
    const b = run.bench.indexOf(uid);
    if (!inst || b < 0) return;
    const { at, gain } = bestSlot(run, inst);
    if (at >= 0 && gain > 2) g().swapSlots({ zone: 'lineup', index: at }, { zone: 'bench', index: b });
}

/** Recompensa: Patrocínio (se vier), senão Pokémon que melhora uma vaga, senão item pra um titular sem item, senão pula. */
function takeReward() {
    const run = g().run!;
    const sp = run.rewards.findIndex((r) => (r.kind as string) === 'sponsor');
    if (sp >= 0) return g().claimReward(sp, '');
    const i = run.rewards.findIndex((r) => r.kind === 'pokemon');
    const mon = run.rewards[i];
    if (mon?.kind === 'pokemon' && bestSlot(run, mon.inst).gain > 2) {
        const w = weakestBench(run);
        if (w) {
            g().claimReward(i, w);
            return placeNew(mon.inst.uid);
        }
    }
    const it = run.rewards.findIndex((r) => r.kind === 'item');
    const holder = run.lineup.find((u) => !run.picks.find((p) => p.uid === u)?.item);
    if (it >= 0 && holder) g().claimReward(it, holder);
    else g().skipReward();
}

/** Mercado: Pokémon que melhora (+3), Patrocínio (campo primeiro), item; troca a vitrine se sobra ₽ pra mais uma compra. */
function shop(acc: { spent: number; buys: Record<string, number> }) {
    const m0 = g().run!.money ?? 0;
    for (let k = 0, rerolls = 0; k < 8; k++) {
        const run = g().run!;
        const s = run.shop!;
        const money = run.money ?? 0;
        const offers = s.offers.map((o, i) => ({ o, i })).filter(({ o, i }) => !s.sold.includes(i) && o.price <= money);
        const mon = offers
            .flatMap(({ o, i }) =>
                o.kind === 'pokemon' ? [{ i, inst: o.inst, gain: bestSlot(run, o.inst).gain }] : [],
            )
            .sort((a, b) => b.gain - a.gain)[0];
        const w = weakestBench(run);
        if (mon && mon.gain > 2 && w) {
            g().buyOffer(mon.i, w);
            if (g().run!.shop!.sold.includes(mon.i)) {
                acc.buys.pokemon = (acc.buys.pokemon ?? 0) + 1;
                placeNew(mon.inst.uid);
                continue;
            }
        }
        const sponsors = offers
            .filter(({ o }) => o.kind === 'sponsor')
            .sort(
                (a, b) =>
                    +(a.o.kind === 'sponsor' && SPONSOR_FAMILY[a.o.id] !== 'campo') -
                    +(b.o.kind === 'sponsor' && SPONSOR_FAMILY[b.o.id] !== 'campo'),
            );
        if (sponsors[0] && (run.sponsors?.length ?? 0) < 3) {
            g().buyOffer(sponsors[0].i);
            acc.buys.sponsor = (acc.buys.sponsor ?? 0) + 1;
            continue;
        }
        const item = offers.find(({ o }) => o.kind === 'item');
        const holder = run.lineup.find((u) => !run.picks.find((p) => p.uid === u)?.item);
        if (item && holder) {
            g().buyOffer(item.i, holder);
            acc.buys.item = (acc.buys.item ?? 0) + 1;
            continue;
        }
        const price = 2 + s.rerolls;
        if (rerolls++ < 2 && money - price >= 7) {
            g().rerollShop();
            continue;
        }
        break;
    }
    acc.spent += m0 - (g().run!.money ?? 0);
    g().leaveShop();
}

function play(i: number) {
    if (MODO === 'dia') {
        const day = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
        g().newRun('Robô FC', `dia-${day.replace(/-/g, '')}`, day);
    } else g().newRun('Robô FC', `arcade-${i}`);
    g().autoDraft();
    const acc = { spent: 0, buys: {} as Record<string, number> };
    let screens = 0;
    let earned = 0;
    let sponsorRewards = 0;
    let rewardScreens = 0;
    for (let guard = 0; guard < 60; guard++) {
        const run = g().run!;
        if (run.status === 'champion' || run.status === 'eliminated') break;
        screens++;
        if (run.status === 'lineup') {
            g().lockMatch(playerTeam(run, 0xe8423f));
            const cur = g().run!;
            const m0 = cur.money ?? 0;
            g().recordResult(
                runMatch(FUTSAL_5, cur.lockedTeam!, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`),
            );
            earned += Math.max(0, (g().run!.money ?? 0) - m0);
        } else if (run.status === 'reward') {
            rewardScreens++;
            if (run.rewards.some((r) => (r.kind as string) === 'sponsor')) sponsorRewards++;
            const m0 = run.money ?? 0;
            takeReward();
            // o ₽ da vitória entra ao sair da recompensa (antes: no Mercado)
            earned += Math.max(0, (g().run!.money ?? 0) - m0);
        } else if (run.status === 'shop') shop(acc);
        else break;
    }
    const run = g().run!;
    return {
        champion: run.status === 'champion',
        played: run.results.length,
        sponsors: run.sponsors ?? [],
        screens,
        rewardScreens,
        sponsorRewards,
        earned,
        spent: acc.spent,
        left: run.money ?? 0,
        buys: acc.buys,
    };
}

describe.skipIf(!N)('robô dos modos arcade', () => {
    it(`joga ${N} copas (${MODO})`, () => {
        const res = Array.from({ length: N }, (_, i) => play(i));
        if (process.env.SIM_OUT) writeFileSync(process.env.SIM_OUT, JSON.stringify(res));
        const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
        const pct = (xs: unknown[]) => `${((100 * xs.length) / res.length).toFixed(1)}%`;
        const withSp = res.filter((r) => r.sponsors.length);
        const noSp = res.filter((r) => !r.sponsors.length);
        const rate = (rs: typeof res) =>
            rs.length ? `${((100 * rs.filter((r) => r.champion).length) / rs.length).toFixed(0)}%` : '-';
        console.table({
            [MODO]: {
                n: res.length,
                titulo: pct(res.filter((r) => r.champion)),
                patrociniosPorCopa: avg(res.map((r) => r.sponsors.length)).toFixed(2),
                patrociniosCampeoes: avg(res.filter((r) => r.champion).map((r) => r.sponsors.length)).toFixed(2),
                tituloComPatrocinio: `${rate(withSp)} (${withSp.length})`,
                tituloSemPatrocinio: `${rate(noSp)} (${noSp.length})`,
                recompensasComPatrocinio: `${avg(res.map((r) => r.sponsorRewards)).toFixed(2)} de ${avg(res.map((r) => r.rewardScreens)).toFixed(2)}`,
                comprasNoMercado: avg(res.map((r) => Object.values(r.buys).reduce((a, b) => a + b, 0))).toFixed(2),
                compras: ['pokemon', 'sponsor', 'item']
                    .map((k) => `${k} ${avg(res.map((r) => r.buys[k] ?? 0)).toFixed(2)}`)
                    .join(', '),
                dinheiroGanho: avg(res.map((r) => r.earned)).toFixed(1),
                dinheiroGasto: avg(res.map((r) => r.spent)).toFixed(1),
                dinheiroSobrando: avg(res.map((r) => r.left)).toFixed(1),
                telasPorCopa: avg(res.map((r) => r.screens)).toFixed(1),
                partidas: avg(res.map((r) => r.played)).toFixed(2),
            },
        });
        expect(res.every((r) => r.played > 0)).toBe(true);
    }, 7_200_000);
});
