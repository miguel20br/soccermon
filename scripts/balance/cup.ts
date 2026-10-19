// Copa inteira como um jogador razoável. Uso: npx tsx cup.ts <shard> <nshards> <out> [cupsPorFormação]
import { writeFileSync } from 'node:fs';
import type { Position } from '../../src/engine/attributes';
import { buildCupOpponents } from '../../src/engine/cup';
import { MOVES } from '../../src/engine/data';
import { captainOptions, playerDraftOptions } from '../../src/engine/draft';
import { evolutionTarget, evolveInstance, evoProgress } from '../../src/engine/evolution';
import { FORMATIONS, type FormationId } from '../../src/engine/formations';
import { ITEMS } from '../../src/engine/items';
import { ratePlayer } from '../../src/engine/match-stats';
import { everyoneIn, mvpScore } from '../../src/engine/mvp';
import { rewardOptions } from '../../src/engine/rewards';
import {
    DESTAQUE_LEVEL_UP_RATING,
    DESTAQUE_MAX_LEVEL,
    mvpOpen,
    rollSpecial,
    weeklyEventType,
} from '../../src/engine/specials';
import { FUTSAL_5, type PokemonInstance, Rng, ratingAt, runMatch, slotAvg, type TeamSetup, viewInstance } from './lib';

const [shard, nshards] = [Number(process.argv[2]), Number(process.argv[3])];
const out = process.argv[4];
const PER = Number(process.argv[5]) || 300;
const STRAT = process.argv[6] ?? 'nota';
const evoScore = (o: PokemonInstance, role: Position | 'ANY') => {
    const t = evolutionTarget(o.speciesId, o.uid);
    const r = ratingAt(o, role).rating;
    return t === null ? r : Math.max(r, ratingAt(evolveInstance(o, t), role).rating);
};
const REROLL_BELOW = 68;
const EVENT = weeklyEventType(new Date('2026-10-17T12:00:00Z'));
const metal = (r: number) => (r >= 75 ? 'gold' : r >= 65 ? 'silver' : 'bronze');

interface RoundRec {
    round: number;
    role: string;
    captain: boolean;
    cards: number[]; // nota da carta (posição principal)
    slot: number[]; // nota na vaga
    tiers: string[];
    best: number;
    rerollBest: number; // contrafactual: melhor opção se rerolasse
    rerolled: boolean;
    finalBest: number;
}

function cup(seed: string, formation: FormationId) {
    const slots = FORMATIONS[formation].slots;
    let rerolls = 2;
    let rerollsUsed = 0;
    const picks: PokemonInstance[] = [];
    const lineup: string[] = ['', '', '', '', ''];
    const bench: string[] = ['', ''];
    const rounds: RoundRec[] = [];
    const byUid = (u: string) => picks.find((p) => p.uid === u)!;

    // capitão
    const rollCap = () =>
        captainOptions(new Rng(seed, `captain-r${rerollsUsed}`), new Set()).map((o) => rollSpecial(o, EVENT));
    const capScore = (o: PokemonInstance) => Math.max(...slots.map((r) => ratingAt(o, r).rating));
    let opts = rollCap();
    const capRec = mkRound(0, 'CAP', true, opts, capScore, () =>
        captainOptions(new Rng(seed, `captain-r${rerollsUsed + 1}`), new Set()).map((o) => rollSpecial(o, EVENT)),
    );
    if (capRec.best < REROLL_BELOW && rerolls > 0) {
        rerolls--;
        rerollsUsed++;
        opts = rollCap();
        capRec.rerolled = true;
    }
    const cap = opts.reduce((b, o) => (capScore(o) > capScore(b) ? o : b));
    capRec.finalBest = capScore(cap);
    rounds.push(capRec);
    const capSlot = slots.findIndex((r) => ratingAt(cap, r).rating === capScore(cap));
    lineup[capSlot] = cap.uid;
    picks.push(cap);
    const captainUid = cap.uid;

    // demais vagas na ordem da formação, depois o banco
    const order: { zone: 'l' | 'b'; i: number }[] = [
        ...slots.map((_, i) => ({ zone: 'l' as const, i })).filter((s) => s.i !== capSlot),
        { zone: 'b', i: 0 },
        { zone: 'b', i: 1 },
    ];
    for (const slot of order) {
        const round = picks.length;
        const role: Position | 'ANY' = slot.zone === 'b' ? 'ANY' : slots[slot.i];
        const taken = new Set(picks.map((p) => p.speciesId));
        const roll = (ru: number) =>
            playerDraftOptions(new Rng(seed, `draft-${round}-${role}-r${ru}`), round, taken, role).map((o) =>
                rollSpecial(o, EVENT),
            );
        const score = (o: PokemonInstance) => (STRAT === 'evo' ? evoScore(o, role) : ratingAt(o, role).rating);
        let o = roll(rerollsUsed);
        const rec = mkRound(round, role, false, o, score, () => roll(rerollsUsed + 1));
        if (rec.best < REROLL_BELOW && rerolls > 0) {
            rerolls--;
            rerollsUsed++;
            o = roll(rerollsUsed);
            rec.rerolled = true;
        }
        const pick = o.reduce((b, x) => (score(x) > score(b) ? x : b));
        rec.finalBest = score(pick);
        rounds.push(rec);
        picks.push(pick);
        (slot.zone === 'l' ? lineup : bench)[slot.i] = pick.uid;
    }

    const opponents = buildCupOpponents(seed);
    const stages: object[] = [];
    let champion = false;
    let evolutions = 0;
    const evoTiers: string[] = [];
    let destaques = 0;
    for (let stage = 0; stage < 4; stage++) {
        const team: TeamSetup = {
            name: 'P',
            lineup: lineup.map(byUid),
            bench: bench.map(byUid),
            tactic: 'balanced',
            color: 0,
            formation,
            captainUid,
            manualSubs: true,
        };
        const opp = opponents[stage];
        const eligible = team.lineup.filter(
            (p) => p.ability !== 'imposter' && evolutionTarget(p.speciesId, p.uid) !== null,
        ).length;
        const m = runMatch(FUTSAL_5, team, opp, `${seed}-stage-${stage}`, { snapshots: false });
        const won = m.winner === 0;
        const evolved = new Map(
            m.events.flatMap((e) => (e.type === 'evolve' && e.team === 0 ? [[e.uid, e.into] as const] : [])),
        );
        const oppEvo = m.events.filter((e) => e.type === 'evolve' && e.team === 1).length;
        evolutions += evolved.size;
        for (const u of evolved.keys()) evoTiers.push(viewInstance(picks.find((p) => p.uid === u)!).species.tier);
        const mine = everyoneIn(m).filter((p) => p.team === 0);
        const ranked = mine
            .filter((p) => mvpScore(p) > 0)
            .sort((a, b) => mvpScore(b) - mvpScore(a))
            .flatMap((p) => picks.filter((i) => i.uid === p.uid));
        const star = ranked[0];
        const starLine = mine.find((p) => p.uid === star?.uid);
        const starRating = starLine ? ratePlayer(starLine.stats, starLine.role, won, m.score[1]) : 0;
        const levelUp =
            star?.special?.kind === 'destaque' &&
            (star.special.level ?? 1) < DESTAQUE_MAX_LEVEL &&
            starRating >= DESTAQUE_LEVEL_UP_RATING;
        // mesma regra do game-store (recordResult): Ícone e Evento levam o selo MVP
        const mvpTaker = (p: PokemonInstance) =>
            mvpOpen(p) && (!p.special?.level || (p === star && starRating >= DESTAQUE_LEVEL_UP_RATING));
        const winner = levelUp ? star : ranked.find((p) => !p.special || mvpTaker(p));
        const destaqueUid = won && winner ? winner.uid : null;
        const destaqueLevel = levelUp ? (star.special?.level ?? 1) + 1 : 1;
        if (destaqueUid) destaques++;
        for (let k = 0; k < picks.length; k++) {
            const p = picks[k];
            let o = p;
            const into = evolved.get(p.uid);
            if (into) o = { ...evolveInstance(o, into), evo: 0 };
            else {
                const line = mine.find((l) => l.uid === p.uid);
                if (line && lineup.includes(p.uid) && evolutionTarget(p.speciesId, p.uid) !== null)
                    o = { ...o, evo: Math.round(evoProgress(p, line.stats, line.role as Position) * 10) / 10 };
            }
            if (p.uid === destaqueUid)
                o = {
                    ...o,
                    special:
                        p.special && p.special.kind !== 'destaque'
                            ? { ...p.special, level: (p.special.level ?? 0) + 1 }
                            : { kind: 'destaque', ...(destaqueLevel > 1 && { level: destaqueLevel }) },
                };
            picks[k] = o;
        }
        const oppRating = slotAvg(opp);
        stages.push({
            stage,
            won,
            gf: m.score[0],
            ga: m.score[1],
            so: !!m.shootout,
            rTeam: +slotAvg(team).toFixed(2),
            rOpp: +oppRating.toFixed(2),
            evo: evolved.size,
            eligible,
            oppEvo,
            destaque: !!destaqueUid,
            items: opp.lineup.filter((p) => p.item).length,
        });
        if (!won) break;
        if (stage === 3) {
            champion = true;
            break;
        }
        // recompensa: reforço que melhora o time > item > pular
        const rw = rewardOptions(seed, stage, 0, picks, { name: opp.name, players: [...opp.lineup, ...opp.bench] }).map(
            (r) => (r.kind === 'pokemon' && !r.from ? { ...r, inst: rollSpecial(r.inst, EVENT) } : r),
        );
        let taken = 'skip';
        const pk = rw.find((r) => r.kind === 'pokemon');
        if (pk && pk.kind === 'pokemon') {
            let bestGain = 0;
            let bestK = -1;
            lineup.forEach((u, k) => {
                if (u === captainUid) return;
                const g = ratingAt(pk.inst, slots[k]).rating - ratingAt(byUid(u), slots[k]).rating;
                if (g > bestGain) {
                    bestGain = g;
                    bestK = k;
                }
            });
            if (bestK >= 0) {
                const b =
                    bench[0] && bench[1]
                        ? viewInstance(byUid(bench[0])).overall < viewInstance(byUid(bench[1])).overall
                            ? 0
                            : 1
                        : 0;
                const leaving = byUid(bench[b]);
                const incoming = { ...pk.inst, item: pk.inst.item ?? leaving?.item ?? null };
                picks.splice(picks.indexOf(leaving), 1, incoming);
                bench[b] = lineup[bestK];
                lineup[bestK] = incoming.uid;
                taken = `pokemon+${bestGain}`;
            }
        }
        if (taken === 'skip') {
            const it = rw.find((r) => r.kind === 'item');
            if (it && it.kind === 'item') {
                const data = ITEMS[it.item];
                const starters = lineup.map(byUid);
                let holder: PokemonInstance | undefined;
                if (data.kind === 'type')
                    holder = starters.find(
                        (p) => !p.item && p.moves.some((mv) => MOVES[mv]?.type === data.type && MOVES[mv].power > 0),
                    );
                else if (data.kind === 'focussash') holder = starters[0].item ? undefined : starters[0];
                else holder = [...starters].reverse().find((p) => !p.item);
                if (holder) {
                    const h = holder;
                    picks[picks.indexOf(h)] = { ...h, item: it.item };
                    taken = `item:${it.item}`;
                }
            }
        }
        if (taken === 'skip') rerolls++;
        (stages.at(-1) as Record<string, unknown>).reward = taken;
    }
    return {
        seed,
        formation,
        champion,
        stagesPlayed: stages.length,
        evolutions,
        evoTiers,
        evolvers: picks.filter((p) => evolutionTarget(p.speciesId, p.uid) !== null).length,
        destaques,
        // cartas no fim da copa (combos de edição)
        cards: picks.map((p) => ({ shiny: p.shiny, kind: p.special?.kind ?? null, level: p.special?.level ?? 0 })),
        captain: cap.speciesId,
        rounds,
        stages,
        rerollsLeft: rerolls,
    };
}

function mkRound(
    round: number,
    role: string,
    captain: boolean,
    o: PokemonInstance[],
    score: (p: PokemonInstance) => number,
    alt: () => PokemonInstance[],
): RoundRec {
    const best = Math.max(...o.map(score));
    return {
        round,
        role,
        captain,
        cards: o.map((p) => viewInstance(p).overall),
        slot: o.map(score),
        tiers: o.map((p) => viewInstance(p).species.tier),
        best,
        rerollBest: Math.max(...alt().map(score)),
        rerolled: false,
        finalBest: best,
    };
}

const forms = Object.keys(FORMATIONS) as FormationId[];
const res: object[] = [];
let j = 0;
for (const f of forms)
    for (let n = 0; n < PER; n++) {
        if (j++ % nshards !== shard) continue;
        res.push(cup(`audit-${f}-${n}`, f));
    }
writeFileSync(out, JSON.stringify(res));
void metal;
