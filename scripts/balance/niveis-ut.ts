/**
 * Time Ultimate por nível: vitória, gols e Fichas por partida, com o rival do modo (`ultimateRival`). Só mede, não muda
 * nada. Fases do time: saves de verdade (`openPack`), com os 7 melhores pela nota. Monotipo: 7 de Água, Prata se tiver,
 * pra ver o bônus do elenco (+22%) contra um rival escolhido só pela nota. `--torcida` compara com o rival a −4%.
 *
 * Uso: scripts/pesado.sh npx tsx scripts/balance/niveis-ut.ts --n 200 [--torcida]
 * Ressalva: os dois lados jogam com o técnico IA, sem o toque do jogador no golpe máximo.
 */

import { FUTSAL_5 } from '../../src/engine/config';
import { species } from '../../src/engine/data';
import { DEFAULT_FORMATION, FORMATIONS } from '../../src/engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { chemistry } from '../../src/store/ultimate/chemistry';
import { LEVELS, type Level } from '../../src/store/ultimate/rules';
import {
    fichasFor,
    fillTeam,
    homeTeam,
    isKeeperSpecies,
    metalPools,
    newUltimate,
    openPack,
    outcomeOf,
    teamAverage,
    type UltimateSave,
    ultimateRival,
} from '../../src/store/ultimate/ultimate';

const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || 200;
const CROWDS = args.includes('--torcida') ? [undefined, 0.96] : [undefined];
const SAVES = 20;
const NOW = Date.UTC(2026, 11, 1);

/** Abre `packs` Mini num save novo e escala os 7 melhores: as repetidas somem, como quem resolve os Pendentes. */
function saveAfter(salt: string, packs: number): UltimateSave {
    let u = { ...newUltimate(salt, NOW), extraPacks: packs };
    for (let i = 0; i < packs; i++) {
        const r = openPack(u, NOW);
        if (!r) throw new Error(`pacote ${i} não abriu`);
        u = { ...r.u, pending: [] };
    }
    const byNote = [...u.cards].sort((a, b) => viewInstance(b).overall - viewInstance(a).overall);
    const keeper = byNote.find((c) => isKeeperSpecies(c.speciesId));
    const best = (keeper ? [keeper, ...byNote.filter((c) => c !== keeper)] : byNote).slice(0, 7);
    const team = { ...u.team, order: [] as string[] };
    return { ...u, team: fillTeam(team, best) };
}

/** 7 de Água: as Pratas primeiro, o goleiro garantido, o resto das outras faixas. */
function monoWater(salt: string): UltimateSave {
    const pools = metalPools();
    const water = (ids: number[]) => ids.filter((id) => species(id).types.includes('Water'));
    const ids = [...water(pools.prata), ...water(pools.bronze), ...water(pools.ouro)];
    const keeper = ids.find(isKeeperSpecies);
    const seven = (keeper ? [keeper, ...ids.filter((id) => id !== keeper)] : ids).slice(0, 7);
    const cards: PokemonInstance[] = seven.map((id) => ({
        ...createInstance(id, new Rng(salt, `mono-${id}`)),
        uid: `m-${id}`,
        shiny: false,
    }));
    const u = newUltimate(salt, NOW);
    return { ...u, cards, team: fillTeam({ ...u.team, order: [] }, cards) };
}

const STAGES: { label: string; make: (salt: string) => UltimateSave }[] = [
    { label: 'Início (2 pacotes)', make: (s) => saveAfter(s, 2) },
    { label: '1ª semana (15 pacotes)', make: (s) => saveAfter(s, 15) },
    { label: '1º mês (60 pacotes)', make: (s) => saveAfter(s, 60) },
    { label: '7 de Água (monotipo)', make: monoWater },
];

function play(u: UltimateSave, level: Level, n: number, salt: string, crowd?: number) {
    const home: TeamSetup = homeTeam(u, 'Eu', 0);
    const avg = teamAverage(home);
    const base = ultimateRival(u.salt, n, level, avg);
    const rival = crowd ? { ...base, crowd } : base;
    const flip = n % 2 === 1;
    const m = runMatch(FUTSAL_5, flip ? rival : home, flip ? home : rival, `${salt}-${n}`, { snapshots: false });
    const score: [number, number] = flip ? [m.score[1], m.score[0]] : [m.score[0], m.score[1]];
    return { score, gap: teamAverage(rival) - avg };
}

console.log(`Time Ultimate por nível, ${N} partidas por linha (erro ±${((196 * 0.5) / Math.sqrt(N)).toFixed(1)} pp)`);
for (const stage of STAGES) {
    const saves = Array.from({ length: SAVES }, (_, i) => stage.make(`ut-niveis-${i}`));
    const homes = saves.map((u) => homeTeam(u, 'Eu', 0));
    const avg = homes.reduce((s, t) => s + teamAverage(t), 0) / SAVES;
    const chem = saves.reduce((s, u, i) => s + chemistry(homes[i].lineup, FORMATION_SLOTS(u)).avg, 0) / SAVES;
    const ex = homes[0].lineup.map((p) => `${viewInstance(p).displayName} ${viewInstance(p).overall}`).join(', ');
    console.log(`\n${stage.label}: média ${avg.toFixed(1)}, química do painel ${chem.toFixed(3)} (ex.: ${ex})`);
    console.log('| Nível | Torcida | V | E | D | Gols | Fichas/jogo | Diferença do rival |');
    console.log('|---|---|---|---|---|---|---|---|');
    for (const level of LEVELS)
        for (const crowd of CROWDS) {
            const r = { win: 0, draw: 0, loss: 0, gf: 0, ga: 0, fichas: 0, gap: 0 };
            for (let i = 0; i < N; i++) {
                const { score, gap } = play(saves[i % SAVES], level, i, `${stage.label}-${level}-${crowd}`, crowd);
                const out = outcomeOf(score);
                r[out]++;
                r.gf += score[0];
                r.ga += score[1];
                r.fichas += fichasFor(level, out);
                r.gap += gap;
            }
            const pct = (x: number) => `${((x / N) * 100).toFixed(0)}%`;
            console.log(
                `| ${level} | ${crowd ? '−4%' : 'não'} | ${pct(r.win)} | ${pct(r.draw)} | ${pct(r.loss)} | ${(r.gf / N).toFixed(2)} x ${(r.ga / N).toFixed(2)} | ${(r.fichas / N).toFixed(0)} | ${(r.gap / N).toFixed(1)} |`,
            );
        }
}

function FORMATION_SLOTS(u: UltimateSave) {
    return FORMATIONS[u.team.formation ?? DEFAULT_FORMATION].slots;
}
