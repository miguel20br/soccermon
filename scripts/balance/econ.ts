import { captainOptions, playerDraftOptions } from '../../src/engine/draft';
import { evolutionTarget, evolveInstance } from '../../src/engine/evolution';
import { FORMATIONS, type FormationId } from '../../src/engine/formations';
import { rollSpecial, weeklyEventType } from '../../src/engine/specials';
import { Rng, ratingAt, SPECIES, viewInstance } from './lib';

let promRounds = 0;
let evoRounds = 0,
    evoOpts = 0,
    draftRounds = 0;
const EVENT = weeklyEventType(new Date('2026-10-17T12:00:00Z'));
const metal = (r: number) => (r >= 75 ? 'O' : r >= 65 ? 'P' : 'B');
const N = 4000;
type S = {
    n: number;
    card: Record<string, number>;
    slot: Record<string, number>;
    all3bad: number;
    best: number;
    bestGold: number;
    rr: number;
    rrBetter: number;
    rrWorse: number;
};
const st = new Map<string, S>();
const capPick = new Map<number, number>();
const capOffer = new Map<number, number>();
const g = (k: string) => {
    let s = st.get(k);
    if (!s)
        st.set(
            k,
            (s = {
                n: 0,
                card: { B: 0, P: 0, O: 0 },
                slot: { B: 0, P: 0, O: 0 },
                all3bad: 0,
                best: 0,
                bestGold: 0,
                rr: 0,
                rrBetter: 0,
                rrWorse: 0,
            }),
        );
    return s;
};
let totalBad = 0,
    totalRounds = 0,
    draftsWithBad = 0,
    sumTeam = 0;
for (const f of ['1-2-1', '2-2'] as FormationId[])
    for (let n = 0; n < N; n++) {
        const seed = `econ-${f}-${n}`;
        const slots = FORMATIONS[f].slots;
        const picks: number[] = [];
        const caps = (r: number) =>
            captainOptions(new Rng(seed, `captain-r${r}`), new Set()).map((o) => rollSpecial(o, EVENT));
        const cs = (o: any) => Math.max(...slots.map((r) => ratingAt(o, r).rating));
        const rec = (key: string, o: any[], alt: any[], sc: (x: any) => number) => {
            const s = g(key);
            s.n++;
            const sl = o.map(sc);
            const best = Math.max(...sl);
            const rb = Math.max(...alt.map(sc));
            for (const x of o) s.card[metal(viewInstance(x).overall)]++;
            for (const x of sl) s.slot[metal(x)]++;
            if (sl.every((x) => x <= 64)) {
                s.all3bad++;
            }
            s.best += best;
            if (best >= 75) s.bestGold++;
            s.rr += rb - best;
            if (rb > best) s.rrBetter++;
            if (rb < best) s.rrWorse++;
            return { best, bad: sl.every((x) => x <= 64) };
        };
        const o = caps(0);
        for (const x of o) capOffer.set(x.speciesId, (capOffer.get(x.speciesId) ?? 0) + 1);
        rec('captain', o, caps(1), cs);
        const cap = o.reduce((b, x) => (cs(x) > cs(b) ? x : b));
        capPick.set(cap.speciesId, (capPick.get(cap.speciesId) ?? 0) + 1);
        const capSlot = slots.findIndex((r) => ratingAt(cap, r).rating === cs(cap));
        picks.push(cap.speciesId);
        const order = [
            ...slots
                .map((r, i) => ({ r, i }))
                .filter((x) => x.i !== capSlot)
                .map((x) => x.r),
            'ANY',
            'ANY',
        ] as any[];
        let anyBad = false;
        let team = cs(cap);
        order.forEach((role) => {
            const round = picks.length;
            const taken = new Set(picks);
            const roll = (ru: number) =>
                playerDraftOptions(new Rng(seed, `draft-${round}-${role}-r${ru}`), round, taken, role).map((x) =>
                    rollSpecial(x, EVENT),
                );
            const sc = (x: any) => ratingAt(x, role).rating;
            const oo = roll(0);
            draftRounds++;
            const ne = oo.filter((x) => evolutionTarget(x.speciesId, x.uid) !== null).length;
            evoOpts += ne;
            if (ne) evoRounds++;
            if (
                oo.some((x) => {
                    const t = evolutionTarget(x.speciesId, x.uid);
                    return t !== null && ratingAt(evolveInstance(x, t), role).rating >= 75;
                })
            )
                promRounds++;
            const r = rec(`r${round}-${role}`, oo, roll(1), sc);
            totalRounds++;
            if (r.bad) {
                totalBad++;
                anyBad = true;
            }
            if (role !== 'ANY') team += r.best;
            picks.push(oo.reduce((b, x) => (sc(x) > sc(b) ? x : b)).speciesId);
        });
        if (anyBad) draftsWithBad++;
        sumTeam += team / 5;
    }
const pc = (a: number, b: number) => `${Math.round((100 * a) / b)}%`;
console.log(
    'key | n | carta B/P/O | vaga B/P/O | 3 ruins | melhor méd | melhor ouro | reroll Δ | reroll melhora/piora',
);
for (const [k, s] of [...st].sort()) {
    const t = 3 * s.n;
    console.log(
        `${k} | ${s.n} | ${pc(s.card.B, t)}/${pc(s.card.P, t)}/${pc(s.card.O, t)} | ${pc(s.slot.B, t)}/${pc(s.slot.P, t)}/${pc(s.slot.O, t)} | ${pc(s.all3bad, s.n)} | ${(s.best / s.n).toFixed(1)} | ${pc(s.bestGold, s.n)} | ${(s.rr / s.n).toFixed(2)} | ${pc(s.rrBetter, s.n)}/${pc(s.rrWorse, s.n)}`,
    );
}
console.log(
    'rodadas com 3 ruins:',
    pc(totalBad, totalRounds),
    'drafts com >=1 rodada 3 ruins:',
    pc(draftsWithBad, 2 * N),
    'nota média titulares (sem reroll):',
    (sumTeam / (2 * N)).toFixed(1),
);
const nm = (id: number) => SPECIES[id - 1].name;
console.log(
    'capitão escolhido (melhor nota):',
    [...capPick]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, c]) => `${nm(id)} ${pc(c, 2 * N)}`)
        .join(', '),
);
console.log(
    'capitão oferecido (% dos drafts):',
    [...capOffer]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, c]) => `${nm(id)} ${pc(c, 2 * N)}`)
        .join(', '),
);
console.log(
    'Dragonite: oferecido',
    pc(capOffer.get(149) ?? 0, 2 * N),
    'escolhido quando oferecido',
    pc(capPick.get(149) ?? 0, capOffer.get(149) ?? 1),
);
// distribuição de raridade/metal das 151 cartas
const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
for (const t of tiers) {
    const ss = SPECIES.filter((s) => s.tier === t).map(
        (s) =>
            viewInstance({
                uid: 'x',
                speciesId: s.id,
                level: 50,
                xp: 0,
                moves: [],
                ability: '',
                shiny: false,
                nickname: null,
                condition: 1,
            }).overall,
    );
    console.log(
        t,
        'n',
        ss.length,
        'ovr min/med/max',
        Math.min(...ss),
        ss.sort((a, b) => a - b)[ss.length >> 1],
        Math.max(...ss),
        'B/P/O',
        ss.filter((x) => x <= 64).length,
        ss.filter((x) => x >= 65 && x < 75).length,
        ss.filter((x) => x >= 75).length,
    );
}

console.log(
    'rodadas (fora capitão) com 1+ opção que evolui:',
    pc(evoRounds, draftRounds),
    'opções que evoluem:',
    pc(evoOpts, 3 * draftRounds),
);
console.log('rodadas com promessa (evolui p/ ouro na vaga):', pc(promRounds, draftRounds));
