// Progressão da Rota Índigo (docs/planos/rota-progressao.md): o robô da Copa longa com o time e o rival medidos por
// partida, e as opções de draft mais fraco no começo simuladas sem mexer no jogo (vi.mock no draft).
// Uso: SIM=200 OPCAO=hoje|teto|vagas|raridade [CAP=80] [RIVAL=-1,0,0,0] SIM_OUT=saida.json \
//      npx vitest run scripts/balance/rota-progressao.sim.test.ts   (sem SIM, pulado no CI)
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

/** Só o draft inicial passa por aqui (o Mercado e as recompensas usam `draftOptions` puro). */
const phase = globalThis as { __draft?: boolean };

vi.mock('../../src/engine/draft', async (orig) => {
    const m = await orig<typeof import('../../src/engine/draft')>();
    const { SPECIES } = await import('../../src/engine/data');
    const { createInstance, slotRating } = await import('../../src/engine/instance');
    const { Rng } = await import('../../src/engine/rng');
    const op = process.env.OPCAO ?? 'hoje';
    const cap = Number(process.env.CAP || 0);
    const probe = new Rng('probe', 'x');
    const rate = new Map<string, number>();
    const ratingOf = (id: number, need: string) => {
        const k = `${id}-${need}`;
        if (!rate.has(k)) rate.set(k, slotRating(createInstance(id, probe), need as 'ANY'));
        return rate.get(k)!;
    };
    /** Troca as opções fora da faixa por uma espécie da faixa que joga na vaga. */
    const clamp = (
        rng: InstanceType<typeof Rng>,
        out: ReturnType<typeof m.draftOptions>,
        need: Parameters<typeof m.canPlay>[1],
        taken: ReadonlySet<number>,
        ok: (sp: (typeof SPECIES)[number]) => boolean,
        /** De onde sai a troca (sem: qualquer uma que passa em `ok`). */
        near: (sp: (typeof SPECIES)[number]) => boolean = ok,
    ) =>
        out.map((o) => {
            if (ok(SPECIES[o.speciesId - 1])) return o;
            const pool = SPECIES.filter(
                (sp) =>
                    ok(sp) &&
                    near(sp) &&
                    m.canPlay(sp, need) &&
                    !taken.has(sp.id) &&
                    !out.some((x) => x.speciesId === sp.id),
            );
            return pool.length ? createInstance(rng.pick(pool).id, rng) : o;
        });
    return {
        ...m,
        playerDraftOptions: (...a: Parameters<typeof m.playerDraftOptions>) => {
            const out = m.playerDraftOptions(...a);
            const [rng, , taken, need] = a;
            if (!phase.__draft) return out;
            // teto: o que passa do teto vira uma carta logo abaixo dele (até 6 pontos)
            const teto = Number(process.env.TETO ?? 70);
            if (op === 'teto')
                return clamp(
                    rng,
                    out,
                    need,
                    taken,
                    (sp) => ratingOf(sp.id, need) <= teto,
                    (sp) => ratingOf(sp.id, need) >= teto - 6,
                );
            if (op === 'raridade')
                return clamp(rng, out, need, taken, (sp) => sp.tier !== 'epic' && sp.tier !== 'legendary');
            return out;
        },
        captainOptions: (...a: Parameters<typeof m.captainOptions>) => {
            const [rng, taken] = a;
            let out = m.captainOptions(...a);
            if (!phase.__draft) return out;
            if (op === 'raridade') out = clamp(rng, out, 'ANY', taken, (sp) => sp.tier === 'rare');
            if (cap)
                out = clamp(
                    rng,
                    out,
                    'ANY',
                    taken,
                    (sp) => ratingOf(sp.id, 'ANY') <= cap,
                    (sp) => sp.tier !== 'common' && ratingOf(sp.id, 'ANY') >= cap - 6,
                );
            return out;
        },
    };
});

// capitão com teto: sem Ícone no draft (a edição soma nota por cima do teto)
vi.mock('../../src/engine/specials', async (orig) => {
    const m = await orig<typeof import('../../src/engine/specials')>();
    const strip = process.env.CAP || process.env.OPCAO === 'teto' || process.env.OPCAO === 'raridade';
    return {
        ...m,
        rollSpecial: (...a: Parameters<typeof m.rollSpecial>) => {
            const r = m.rollSpecial(...a);
            return strip && phase.__draft && r.special?.kind === 'icone' ? a[0] : r;
        },
    };
});

// curva do rival: deslocamento por partida da Rota (o grupo e a Final não mudam)
vi.mock('../../src/engine/cup-map', async (orig) => {
    const m = await orig<typeof import('../../src/engine/cup-map')>();
    const shift = (process.env.RIVAL ?? '').split(',').filter(Boolean).map(Number);
    return {
        ...m,
        longOpponent: (...a: Parameters<typeof m.longOpponent>) => {
            const [seed, match, kind, faced, s = 0] = a;
            return m.longOpponent(seed, match, kind, faced, s + (shift[match] ?? 0));
        },
    };
});

import { FUTSAL_5 } from '../../src/engine/config';
import { nextNodes } from '../../src/engine/cup-map';
import { SPECIES } from '../../src/engine/data';
import { bestFit, canPlay, captainOptions, playerDraftOptions } from '../../src/engine/draft';
import { formationOf } from '../../src/engine/formations';
import { createInstance, type PokemonInstance, slotRating } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { playerTeam, useGame } from '../../src/store/game-store';
import { longRound } from '../../src/store/long-cup';
import { eventChoices } from '../../src/store/long-events';

const N = Number(process.env.SIM ?? 0);
const OP = process.env.OPCAO ?? 'hoje';
const g = () => useGame.getState();

const avg = (t: TeamSetup) => {
    const slots = formationOf(t.formation).slots;
    return t.lineup.reduce((a, p, i) => a + slotRating(p, slots[i]), 0) / t.lineup.length;
};

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
        const weakest = [...run.bench].sort(
            (a, b) => slotRating(byUid.get(a)!, 'ANY') - slotRating(byUid.get(b)!, 'ANY'),
        )[0];
        if (at >= 0 && weakest) {
            g().claimReward(i, weakest);
            const benchAt = g().run!.bench.indexOf(mon.inst.uid);
            if (benchAt >= 0) g().swapSlots({ zone: 'lineup', index: at }, { zone: 'bench', index: benchAt });
            return;
        }
    }
    const it = run.rewards.findIndex((r) => r.kind === 'item');
    const holder = run.lineup.find((u) => !byUid.get(u)?.item);
    if (it >= 0 && holder) g().claimReward(it, holder);
    else g().skipReward();
}

/** Opção "vagas": 3 vagas (1 titular + 2 reservas) começam com um bronze da Rota; cada vitória das 3 primeiras abre uma. */
const LOCAL_MAX = 58;
function rookies(seed: string) {
    const run = g().run!;
    const rng = new Rng(seed, 'estagiario');
    const slots = formationOf(run.formation).slots;
    // a vaga de titular que começa aberta: a última que não é a do capitão
    const open = run.lineup.findLastIndex((u) => u !== run.captainUid);
    const refs = [
        { zone: 'lineup' as const, index: open, need: slots[open] },
        { zone: 'bench' as const, index: 0, need: 'ANY' as const },
        { zone: 'bench' as const, index: 1, need: 'ANY' as const },
    ];
    let picks = [...run.picks];
    const lineup = [...run.lineup];
    const bench = [...run.bench];
    const rookie: string[] = [];
    for (const r of refs) {
        const zone = r.zone === 'lineup' ? lineup : bench;
        const taken = new Set(picks.map((p) => p.speciesId));
        const pool = SPECIES.filter(
            (sp) =>
                sp.tier === 'common' &&
                !taken.has(sp.id) &&
                canPlay(sp, r.need) &&
                slotRating(createInstance(sp.id, rng), r.need) <= LOCAL_MAX,
        );
        const inst = createInstance(rng.pick(pool).id, rng);
        picks = [...picks.filter((p) => p.uid !== zone[r.index]), inst];
        zone[r.index] = inst.uid;
        rookie.push(inst.uid);
    }
    useGame.setState({ run: { ...run, picks, lineup, bench } });
    return rookie;
}
function openSlot(seed: string, rookie: string[], stage: number) {
    const run = g().run!;
    const uid = rookie.shift();
    if (!uid) return;
    const slots = formationOf(run.formation).slots;
    const li = run.lineup.indexOf(uid);
    const need = li >= 0 ? slots[li] : 'ANY';
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const opts = playerDraftOptions(new Rng(seed, `vaga-${stage}`), longRound(stage), taken, need);
    const pick = opts[bestFit(opts, [need]).option];
    const swap = (u: string) => (u === uid ? pick.uid : u);
    useGame.setState({
        run: {
            ...run,
            picks: [...run.picks.filter((p) => p.uid !== uid), pick],
            lineup: run.lineup.map(swap),
            bench: run.bench.map(swap),
        },
    });
}

/** PLANALTO=1: no Treino final, a raridade de capitão abre (1 de 3, sem teto) e o melhor entra no lugar do pior titular. */
function star(seed: string) {
    const run = g().run!;
    const slots = formationOf(run.formation).slots;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const opts = captainOptions(new Rng(seed, 'planalto'), taken);
    let best = { gain: 0, k: -1, o: opts[0] };
    run.lineup.forEach((u, k) => {
        if (u === run.captainUid) return;
        for (const o of opts) {
            const gain = slotRating(o, slots[k]) - slotRating(byUid.get(u)!, slots[k]);
            if (gain > best.gain) best = { gain, k, o };
        }
    });
    if (best.k < 0) return;
    const out = run.lineup[best.k];
    useGame.setState({
        run: {
            ...run,
            picks: [...run.picks.filter((p) => p.uid !== out), best.o],
            lineup: run.lineup.map((u, k) => (k === best.k ? best.o.uid : u)),
        },
    });
}

interface Stage {
    stage: number;
    me: number;
    rival: number;
    won: boolean;
}

function play(seed: string) {
    phase.__draft = true;
    g().newRun('Robô FC', seed, undefined, 'longa');
    g().autoDraft();
    phase.__draft = false;
    const rookie = OP === 'vagas' ? rookies(seed) : [];
    const captain = g().run!.picks.find((p) => p.uid === g().run!.captainUid)!;
    const draft = avg(playerTeam(g().run!, 0));
    const draftTeam = g().run!.lineup.map((u) => g().run!.picks.find((p) => p.uid === u)!);
    const stages: Stage[] = [];
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
            g().enterNode(node.id);
        } else if (run.status === 'lineup') {
            const team = playerTeam(run, 0xe8423f);
            g().lockMatch(team);
            if (!g().run!.lockedTeam) {
                const out = run.lineup.findIndex((u) => (run.out?.[u] ?? 0) > 0);
                const inn = run.bench.findIndex((u) => !(run.out?.[u] ?? 0));
                if (out < 0 || inn < 0) break;
                g().swapSlots({ zone: 'lineup', index: out }, { zone: 'bench', index: inn });
                continue;
            }
            const cur = g().run!;
            const opp = cur.opponents[cur.stage];
            g().recordResult(runMatch(FUTSAL_5, cur.lockedTeam!, opp, `${cur.seed}-stage-${cur.stage}`));
            const won = g().run!.results.at(-1)!.won;
            stages.push({ stage: cur.stage, me: avg(cur.lockedTeam!), rival: avg(opp), won });
            if (OP === 'vagas' && won && cur.stage < 3) openSlot(seed, rookie, cur.stage);
        } else if (run.status === 'reward') takeReward();
        else if (run.status === 'shop') {
            const i = run.shop!.offers.findIndex((o) => o.kind === 'sponsor' && o.price <= (run.money ?? 0));
            if (i >= 0 && (run.sponsors?.length ?? 0) < 3) g().buyOffer(i);
            g().leaveShop();
        } else if (run.status === 'treino') {
            if (process.env.PLANALTO && nextNodes(run.map!, run.at ?? null).length === 0) star(seed);
            g().train('rest');
        } else if (run.status === 'group') g().playNext();
        else if (run.status === 'event') {
            const c = eventChoices(run, run.event!).find((x) => x.ok && x.need === 'none');
            if (c) g().chooseEvent(c.id);
            else break;
        } else break;
    }
    const run = g().run!;
    return {
        seed,
        champion: run.status === 'champion',
        played: run.results.length,
        captain: { id: captain.speciesId, ovr: slotRating(captain, 'ANY'), icone: captain.special?.kind === 'icone' },
        draft,
        draftTeam: draftTeam.map((p: PokemonInstance) => p.speciesId),
        stages,
    };
}

describe.skipIf(!N)('progressão da Rota', () => {
    it(`joga ${N} Rotas (${OP})`, () => {
        const res = Array.from({ length: N }, (_, i) => play(`rota-prog-${i}`));
        if (process.env.SIM_OUT) writeFileSync(process.env.SIM_OUT, JSON.stringify(res));
        expect(res.every((r) => r.played > 0)).toBe(true);
    }, 3_600_000);
});
