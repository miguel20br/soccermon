/**
 * Meta da química do Time Ultimate (docs/planos/ultimate-team.md): "um time prata com química cheia empata com um ouro
 * sem química". Só mede, não muda nada.
 *
 * Prata com química: busca completa nas combinações de 5 titulares Prata (nota 65–74 no nível 50, com goleiro) pela
 * maior química (tipo × história, a regra única de `attributeModifiers`, a mesma do painel do modo), com a nota média
 * na vaga também Prata. Ouro sem química: 5 titulares Ouro (75+, a média na vaga também) sem tipo repetido e sem
 * sinergia de história (química 1,00). Os dois times como o Time Ultimate monta: vagas
 * por `fillTeam`, capitão = a melhor nota, tática equilibrada, formação padrão, sem banco. Resultado pelo placar do
 * tempo normal (o empate do modo), lados alternados.
 *
 * Uso: scripts/pesado.sh npx tsx scripts/balance/quimica-ut.ts --n 200 [--pares 12] [--top 6]
 * (n = partidas de cada exemplo e de cada prata no geral; pares = ouros por prata no geral; top = pratas no geral)
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { DEFAULT_FORMATION, FORMATIONS } from '../../src/engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { chemistry } from '../../src/store/ultimate/chemistry';
import { fillTeam, isKeeperSpecies, metalPools, newUltimate, teamAverage } from '../../src/store/ultimate/ultimate';

const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || 200;
const PAIRS = Number(args[args.indexOf('--pares') + 1]) || 12;
const TOP = Number(args[args.indexOf('--top') + 1]) || 6;
const pools = metalPools();
const roles = FORMATIONS[DEFAULT_FORMATION].slots;

const card = (id: number, tag: string): PokemonInstance => ({
    ...createInstance(id, new Rng('quimica-ut', `${tag}-${id}`)),
    uid: `${tag}-${id}`,
    shiny: false,
});

/** Os 5 nas vagas como o modo arruma (fillTeam), com a química e a nota média na vaga. */
function arrange(ids: number[], tag: string) {
    const cards = ids.map((id) => card(id, tag));
    const order = fillTeam(newUltimate('q', 0).team, cards).order;
    const lineup = order.map((uid) => cards.find((c) => c.uid === uid)!);
    const chem = chemistry(lineup, roles);
    return {
        lineup,
        chem: chem.avg,
        links: chem.links.map((l) => l.def.id),
        avg: teamAverage({ lineup, formation: DEFAULT_FORMATION }),
    };
}
type Team = ReturnType<typeof arrange>;

const setup = (t: Team, name: string, color: number): TeamSetup => ({
    name,
    lineup: t.lineup,
    bench: [],
    tactic: 'balanced',
    color,
    formation: DEFAULT_FORMATION,
    captainUid: t.lineup.reduce((b, p) => (viewInstance(p).overall > viewInstance(b).overall ? p : b)).uid,
});

const rng = new Rng('quimica-ut', 'busca');
const sample = (pool: number[], k: number) => {
    const p = [...pool];
    for (let i = p.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [p[i], p[j]] = [p[j], p[i]];
    }
    return p.slice(0, k);
};

// --------------------------------------------- prata com química: busca completa nas combinações de 5 Pratas
// (só ~26 espécies Prata e só a Água tem 5 do tipo com goleiro: a química "cheia" é a maior que a Prata alcança)
const P = pools.prata.map((id) => card(id, 'P'));
const prataAll: { ids: number[]; chem: number }[] = [];
const combo = (from: number, pick: PokemonInstance[]) => {
    if (pick.length === 5) {
        if (!pick.some((c) => isKeeperSpecies(c.speciesId))) return;
        // a química não depende da vaga (tipo × história): calcula antes de arrumar
        prataAll.push({ ids: pick.map((c) => c.speciesId), chem: chemistry(pick, roles).avg });
        return;
    }
    for (let i = from; i < P.length; i++) combo(i + 1, [...pick, P[i]]);
};
combo(0, []);
prataAll.sort((a, b) => b.chem - a.chem);
const prata: Team[] = [];
const used = new Set<number>();
for (const c of prataAll) {
    if (prata.length >= TOP) break;
    // times diferentes: cada um com pelo menos 2 espécies que os de cima não usaram
    if (c.ids.filter((id) => !used.has(id)).length < 2 && prata.length) continue;
    const t = arrange(c.ids, 'P');
    // time Prata de verdade: a nota média na vaga também é Prata (65–74)
    if (t.avg < 65 || t.avg > 74) continue;
    prata.push(t);
    for (const id of c.ids) used.add(id);
}

// ----------------------------------------------------------------------- ouro sem química: química 1,00 exata
const gk = pools.ouro.filter(isKeeperSpecies);
const ouro: Team[] = [];
const seen = new Set<string>();
for (let k = 0; k < 20000 && ouro.length < 60; k++) {
    const g = gk[rng.int(0, gk.length - 1)];
    const ids = [
        g,
        ...sample(
            pools.ouro.filter((id) => id !== g),
            4,
        ),
    ];
    const key = [...ids].sort((a, b) => a - b).join();
    if (seen.has(key)) continue;
    seen.add(key);
    const t = arrange(ids, 'O');
    // time Ouro de verdade: a nota média na vaga também é Ouro (75+)
    if (t.chem === 1 && t.avg >= 75) ouro.push(t);
}
// do mais fraco ao mais forte: os exemplos pegam o do meio
ouro.sort((a, b) => a.avg - b.avg);

const names = (t: Team) => t.lineup.map((p) => `${viewInstance(p).displayName} ${viewInstance(p).overall}`).join(', ');

function duel(p: Team, o: Team, n: number, tag: string) {
    const r = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    for (let i = 0; i < n; i++) {
        const home = i % 2 === 0;
        const [a, b] = home ? [setup(p, 'Prata', 0), setup(o, 'Ouro', 1)] : [setup(o, 'Ouro', 1), setup(p, 'Prata', 0)];
        const m = runMatch(FUTSAL_5, a, b, `quimica-${tag}-${i}`, { snapshots: false });
        const [gf, ga] = home ? m.score : [m.score[1], m.score[0]];
        r.gf += gf;
        r.ga += ga;
        if (gf > ga) r.w++;
        else if (gf < ga) r.l++;
        else r.d++;
    }
    return r;
}
const pct = (x: number, n: number) => `${((x / n) * 100).toFixed(1)}%`;
const row = (label: string, r: ReturnType<typeof duel>, n: number) =>
    `| ${label} | ${n} | ${pct(r.w, n)} | ${pct(r.d, n)} | ${pct(r.l, n)} | ${(r.gf - r.ga) / n >= 0 ? '+' : ''}${((r.gf - r.ga) / n).toFixed(2)} | ${(r.gf / n).toFixed(2)} x ${(r.ga / n).toFixed(2)} |`;

console.log(
    `Pratas (química, nota na vaga): ${prata.map((t) => `${t.chem.toFixed(3)}/${t.avg}`).join(' · ')} (de ${prataAll.length} combinações)`,
);
console.log(`Ouro sem química: ${ouro.length} times, notas ${ouro[0]?.avg}–${ouro.at(-1)?.avg}`);
console.log('');
console.log('| Par | Partidas | V | E | D | Saldo/jogo | Gols (prata x ouro) |');
console.log('|---|---|---|---|---|---|---|');

// os exemplos: as 3 pratas de química mais alta contra os ouros do meio
const mid = Math.floor(ouro.length / 2);
const examples: string[] = [];
for (let k = 0; k < 3 && k < prata.length; k++) {
    const p = prata[k];
    const o = ouro[mid + k - 1];
    const r = duel(p, o, N, `ex${k}`);
    console.log(row(`Exemplo ${k + 1}: prata ${p.avg} (química ${p.chem.toFixed(2)}) x ouro ${o.avg}`, r, N));
    examples.push(
        `Exemplo ${k + 1}: Prata [${names(p)}]${p.links.length ? ` história: ${p.links.join(', ')}` : ''} x Ouro [${names(o)}]`,
    );
}

// o geral: cada prata contra PAIRS ouros espalhados (do mais fraco ao mais forte), N partidas por prata
const all = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
let total = 0;
for (const [pi, p] of prata.entries()) {
    const per = Math.max(2, Math.round(N / PAIRS));
    for (let j = 0; j < PAIRS; j++) {
        const o = ouro[Math.floor(((j + 0.5) * ouro.length) / PAIRS)];
        const r = duel(p, o, per, `g${pi}-${j}`);
        for (const k of Object.keys(all) as (keyof typeof all)[]) all[k] += r[k];
        total += per;
    }
}
console.log(row(`Geral: ${prata.length} pratas de química mais alta x ${PAIRS} ouros`, all, total));
const avgOf = (ts: Team[]) => (ts.reduce((s, t) => s + t.avg, 0) / ts.length).toFixed(1);
const chemOf = (ts: Team[]) => (ts.reduce((s, t) => s + t.chem, 0) / ts.length).toFixed(3);
console.log('');
console.log(
    `Nota média na vaga: prata ${avgOf(prata)} (química média ${chemOf(prata)}) · ouro ${avgOf(ouro)} (química 1.000)`,
);
for (const e of examples) console.log(e);
