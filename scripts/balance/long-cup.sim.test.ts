// Robô da Copa longa (docs/planos/copa-longa.md): joga copas inteiras pelo fluxo de verdade do store.
// Uso: SIM=120 npx vitest run scripts/balance/long-cup.sim.test.ts   (sem SIM, o teste é pulado no CI)
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { FUTSAL_5 } from '../../src/engine/config';
import { nextNodes } from '../../src/engine/cup-map';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { playerTeam, useGame } from '../../src/store/game-store';
import { eventChoices } from '../../src/store/long-events';

const N = Number(process.env.SIM ?? 0);
const g = () => useGame.getState();

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
            g().recordResult(
                runMatch(FUTSAL_5, cur.lockedTeam!, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`),
            );
        } else if (run.status === 'reward') g().skipReward();
        else if (run.status === 'shop') {
            const i = run.shop!.offers.findIndex((o) => o.kind === 'sponsor' && o.price <= (run.money ?? 0));
            if (i >= 0 && (run.sponsors?.length ?? 0) < 3) g().buyOffer(i);
            g().leaveShop();
        } else if (run.status === 'treino') g().train('rest');
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
        };
        console.log(JSON.stringify(out, null, 1));
        if (process.env.SIM_OUT) writeFileSync(process.env.SIM_OUT, JSON.stringify(res));
        expect(res.every((r) => r.played > 0)).toBe(true);
    }, 3_600_000);
});
