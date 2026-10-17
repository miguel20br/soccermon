// Experimentos pareados. Uso: npx tsx exp.ts <shard> <nshards> <outfile>
import { writeFileSync } from 'node:fs';
import { ABILITY_EFFECTS } from '../../src/engine/abilities';
import { MOVES } from '../../src/engine/data';
import { ITEMS } from '../../src/engine/items';
// import { LINKS } from '../../src/engine/links';
import { ratePlayer } from '../../src/engine/match-stats';
import { everyoneIn } from '../../src/engine/mvp';
import {
    baseTeams,
    dumpAgg,
    insertSpecies,
    type PokemonInstance,
    play,
    SPECIES,
    slotAvg,
    species,
    type TeamSetup,
    teamMult,
} from './lib';

const [shard, nshards] = [Number(process.argv[2]), Number(process.argv[3])];
const out = process.argv[4];
const K_SP = Number(process.env.K_SP ?? 128);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',').map(Number)) : null;
const K_ITEM = 100;
const K_AB = 40;

type Job = () => object | null;
const jobs: Job[] = [];

function run(tag: string, A: TeamSetup, B: TeamSetup, i: number, extra: object, focusUid?: string) {
    const aHome = i % 2 === 0;
    const r = aHome ? play(A, B, `${tag}-${i}`) : play(B, A, `${tag}-${i}`);
    const aTeam = aHome ? 0 : 1;
    const win = r.winner === aTeam ? 1 : 0;
    const gd = aHome ? r.score[0] - r.score[1] : r.score[1] - r.score[0];
    const rec: Record<string, unknown> = {
        tag,
        i,
        ...extra,
        win,
        gd,
        so: !!r.shootout,
        rA: +slotAvg(A).toFixed(2),
        rB: +slotAvg(B).toFixed(2),
        mA: teamMult(A),
        mB: teamMult(B),
    };
    if (focusUid) {
        const l = everyoneIn(r).find((x) => x.uid === focusUid);
        if (l)
            rec.line = {
                rating: ratePlayer(l.stats, l.role, r.winner === l.team, r.score[1 - l.team]),
                g: l.stats.goals,
                a: l.stats.assists,
                sv: l.stats.saves,
                tk: l.stats.tacklesWon,
                mv: l.stats.movesUsed,
                role: l.role,
            };
        rec.cap = A.captainUid === focusUid;
    }
    return rec;
}

// 1) espécies (s=0 é o time base)
for (let i = 0; i < K_SP; i++) {
    for (let s = 0; s <= 151; s++) {
        if (ONLY && s !== 0 && !ONLY.has(s)) continue;
        jobs.push(() => {
            const { A, B } = baseTeams(i);
            if (s === 0) return run('sp', A, B, i, { s: 0 });
            const ins = insertSpecies(A, s, i);
            if (!ins) return null;
            return run('sp', ins.team, B, i, { s }, ins.inst.uid);
        });
    }
}

if (!process.env.SP_ONLY) {
    // 2) itens: quem segura depende do item
    const GEN1_TYPES = new Set(SPECIES.flatMap((s) => s.types));
    const itemList = Object.values(ITEMS).filter((it) => it.kind !== 'type' || GEN1_TYPES.has(it.type!));
    const HOLDER: Record<string, number> = { focussash: 0, quickclaw: 1, choiceband: 4, scopelens: 4 };
    for (let i = 0; i < K_ITEM; i++) {
        for (const it of itemList) {
            jobs.push(() => {
                const { A, B } = baseTeams(i);
                let k = HOLDER[it.id] ?? 2;
                if (it.kind === 'type') {
                    k = A.lineup.findIndex((p) =>
                        p.moves.some((m) => MOVES[m]?.type === it.type && MOVES[m].power > 0),
                    );
                    if (k < 0) return null;
                }
                const lineup = A.lineup.map((p, j) => (j === k ? { ...p, item: it.id } : p));
                return run('item', { ...A, lineup }, B, i, { item: it.id });
            });
        }
    }

    // 3) habilidades: portador natural com a habilidade vs com uma neutra (Illuminate)
    const abilities = Object.keys(ABILITY_EFFECTS).filter((a) => a !== 'imposter');
    const carriersOf = (a: string) => SPECIES.filter((s) => s.abilities.includes(a)).map((s) => s.id);
    for (let i = 0; i < K_AB; i++) {
        for (const a of abilities) {
            const cs = carriersOf(a);
            if (!cs.length) continue;
            for (const on of [true, false]) {
                jobs.push(() => {
                    const { A, B } = baseTeams(i);
                    let ins = null;
                    for (let t = 0; t < cs.length && !ins; t++)
                        ins = insertSpecies(A, cs[(i + t) % cs.length], i, on ? a : 'illuminate');
                    if (!ins) return null;
                    return run(on ? 'abOn' : 'abOff', ins.team, B, i, { ab: a, s: ins.inst.speciesId });
                });
            }
        }
    }
}
const recs: object[] = [];
const t0 = Date.now();
for (let j = shard; j < jobs.length; j += nshards) {
    const r = jobs[j]();
    if (r) recs.push(r);
    if (shard === 0 && j % (nshards * 500) === 0)
        console.error(`${j}/${jobs.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
writeFileSync(out, JSON.stringify({ recs, agg: dumpAgg() }));
void species;
void ({} as PokemonInstance);
