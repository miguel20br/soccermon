import { readFileSync } from 'node:fs';
import { SPECIES } from './lib';

// biome-ignore lint: script
const cups: any[] = [];
for (const f of process.argv.slice(2)) cups.push(...JSON.parse(readFileSync(f, 'utf8')));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const pc = (x: number) => `${(100 * x).toFixed(0)}%`;
console.log(`copas: ${cups.length}, títulos ${pc(mean(cups.map((c) => +c.champion)))}`);
console.log(
    'fase | jogos | vitória | nota time | nota rival | Δ | gols pró/contra | pênaltis | evol. sua/rival | itens rival',
);
for (let s = 0; s < 4; s++) {
    const st = cups.flatMap((c) => c.stages.filter((x: any) => x.stage === s));
    console.log(
        `${s} | ${st.length} | ${pc(mean(st.map((x) => +x.won)))} | ${mean(st.map((x) => x.rTeam)).toFixed(1)} | ${mean(st.map((x) => x.rOpp)).toFixed(1)} | ${mean(st.map((x) => x.rTeam - x.rOpp)).toFixed(1)} | ${mean(st.map((x) => x.gf)).toFixed(2)}/${mean(st.map((x) => x.ga)).toFixed(2)} | ${pc(mean(st.map((x) => +x.so)))} | ${mean(st.map((x) => x.evo)).toFixed(2)}/${mean(st.map((x) => x.oppEvo)).toFixed(2)} | ${mean(st.map((x) => x.items)).toFixed(1)}`,
    );
}
console.log(
    'alcance (eliminado na fase / campeão):',
    [0, 1, 2, 3]
        .map((s) => `out@${s} ${pc(mean(cups.map((c) => +(!c.champion && c.stagesPlayed === s + 1))))}`)
        .join(' '),
    `campeão ${pc(mean(cups.map((c) => +c.champion)))}`,
);
console.log(
    `evoluções/copa ${mean(cups.map((c) => c.evolutions)).toFixed(2)} (campeões ${mean(cups.filter((c) => c.champion).map((c) => c.evolutions)).toFixed(2)}); Destaques/copa ${mean(cups.map((c) => c.destaques)).toFixed(2)}`,
);
const forms = [...new Set(cups.map((c) => c.formation))];
for (const f of forms) {
    const cs = cups.filter((c) => c.formation === f);
    const ms = cs.flatMap((c) => c.stages);
    console.log(
        `formação ${f}: títulos ${pc(mean(cs.map((c) => +c.champion)))} vitória/jogo ${pc(mean(ms.map((x: any) => +x.won)))} n=${cs.length}`,
    );
}
// rivais por clube na fase
const rw = cups.flatMap((c) => c.stages.filter((x: any) => x.reward).map((x: any) => x.reward.split(/[+:]/)[0]));
console.log(
    'recompensa tomada:',
    ['pokemon', 'item', 'skip'].map((k) => `${k} ${pc(mean(rw.map((r: string) => +(r === k))))}`).join(' '),
);
// reroll
const rounds = cups.flatMap((c) => c.rounds);
const bad = rounds.filter((r: any) => r.best < 68);
console.log(
    `rodadas com melhor < 68: ${pc(bad.length / rounds.length)}; reroll nessas: ganho médio ${mean(bad.map((r: any) => r.rerollBest - r.best)).toFixed(1)}, melhora em ${pc(mean(bad.map((r: any) => +(r.rerollBest > r.best))))}`,
);
console.log(
    `rerolls usados/copa ${mean(cups.map((c) => c.rounds.filter((r: any) => r.rerolled).length)).toFixed(2)}; sobram ${mean(cups.map((c) => c.rerollsLeft)).toFixed(2)}`,
);
// capitão
const cap = new Map<number, number[]>();
for (const c of cups) cap.set(c.captain, [...(cap.get(c.captain) ?? []), +c.champion]);
console.log(
    'capitão (n≥15): títulos',
    [...cap]
        .filter(([, x]) => x.length >= 15)
        .sort((a, b) => mean(b[1]) - mean(a[1]))
        .map(([id, x]) => `${SPECIES[id - 1].name} ${pc(mean(x))}(${x.length})`)
        .join(' '),
);
// nota do time vs vitória
const all = cups.flatMap((c) => c.stages);
const bk = new Map<number, number[]>();
for (const x of all) {
    const b = Math.max(-5, Math.min(20, Math.round((x.rTeam - x.rOpp) / 5) * 5));
    bk.set(b, [...(bk.get(b) ?? []), +x.won]);
}
console.log(
    'vitória por Δnota (copa):',
    [...bk]
        .sort((a, b) => a[0] - b[0])
        .map(([b, xs]) => `${b}:${pc(mean(xs))}(${xs.length})`)
        .join(' '),
);

console.log(
    `copas com 1+ evolução ${pc(mean(cups.map((c) => +(c.evolutions > 0))))}; evolutivos no elenco final ${mean(cups.map((c) => c.evolvers)).toFixed(2)}`,
);
const et = new Map<string, number>();
for (const c of cups) for (const t of c.evoTiers) et.set(t, (et.get(t) ?? 0) + 1);
console.log(
    'evoluções por raridade (por copa):',
    ['common', 'uncommon', 'rare', 'epic', 'legendary']
        .map((t) => `${t} ${((et.get(t) ?? 0) / cups.length).toFixed(2)}`)
        .join(' '),
);
const sm = cups.flatMap((c) => c.stages).filter((x: any) => x.eligible !== undefined);
if (sm.length)
    console.log(
        `gatilho: evoluções por titular-que-pode-evoluir por partida ${(
            sm.reduce((a: number, x: any) => a + x.evo, 0) /
                Math.max(
                    1,
                    sm.reduce((a: number, x: any) => a + x.eligible, 0),
                )
        ).toFixed(2)}; titulares que podem evoluir por partida ${mean(sm.map((x: any) => x.eligible)).toFixed(2)}`,
    );
