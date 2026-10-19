/**
 * Caça de lances pro trailer (docs/planos/trailer-plano.md): simula a 1ª partida da copa de várias seeds com o time
 * de cada cena e pontua o que interessa (evolução cedo, gol de golpe, jogada trabalhada, Ditto + combo, pênaltis
 * na última cobrança). As melhores seeds abrem no navegador com `?demo=trailer&cena=<cena>&seed=<seed>`.
 *
 *   npx tsx scripts/trailer-hunt.ts --cena golpe --n 300
 */
import { FUTSAL_5 } from '../src/engine/config';
import { buildCupOpponents } from '../src/engine/cup';
import { species } from '../src/engine/data';
import { runMatch } from '../src/engine/runners/batch-runner';
import type { MatchEvent, TeamSetup } from '../src/engine/state';
import { isTrailerScene, TRAILER_SCENES, type TrailerScene, trailerTeam } from '../src/ui/trailer-scenes';

const args = process.argv.slice(2);
const arg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const N = Number(arg('--n')) || 200;
const TOP = Number(arg('--top')) || 5;
const only = arg('--cena');
const scenes = (only ? [only] : Object.keys(TRAILER_SCENES)).filter(isTrailerScene);
if (!scenes.length) throw new Error(`cena inválida: ${only}`);

/** Golpes que ficam bonitos na tela (nomes do jogo). */
const SHOWY = new Set([
    'flamethrower',
    'fireblast',
    'thunderbolt',
    'thunder',
    'hydropump',
    'psychic',
    'hyperbeam',
    'icebeam',
    'blizzard',
    'solarbeam',
    'earthquake',
    'dragonrage',
]);
const PLAYER_COLOR = 0xe8423f; // mesmo do game-store (não importamos o store aqui: ele usa IndexedDB)
const sec = (tick: number) => `${(tick / FUTSAL_5.tickRate).toFixed(1)}s`;

interface Hit {
    seed: string;
    score: number;
    resumo: string;
    lances: string[];
}

function nameOf(home: TeamSetup, away: TeamSetup, uid: string) {
    const p = [...home.lineup, ...home.bench, ...away.lineup, ...away.bench].find((x) => x.uid === uid);
    return p ? species(p.speciesId).name : '?';
}

function rate(scene: TrailerScene, seed: string): Hit | null {
    const home = trailerTeam(scene, seed, 'Pallet FC', PLAYER_COLOR);
    const away = buildCupOpponents(seed)[0];
    const m = runMatch(FUTSAL_5, home, away, `${seed}-stage-0`, { snapshots: false });
    const ev = m.events;
    const who = (idx: number) => nameOf(home, away, m.roster[idx].uid);
    const mine = (e: { by: number }) => m.roster[e.by].team === 0;
    const goals = ev.filter(
        (e): e is Extract<MatchEvent, { type: 'goal' }> => e.type === 'goal' && e.team === 0 && !e.ownGoal,
    );
    const shotBefore = (g: { by: number; tick: number }) =>
        [...ev]
            .reverse()
            .find(
                (e): e is Extract<MatchEvent, { type: 'shot' }> =>
                    e.type === 'shot' && e.by === g.by && e.tick <= g.tick && e.tick >= g.tick - 60,
            );
    const won = m.score[0] > m.score[1] || (m.shootout != null && m.shootout[0] > m.shootout[1]);
    const placar = `${m.score[0]}x${m.score[1]}${m.shootout ? ` (pên. ${m.shootout[0]}x${m.shootout[1]})` : ''}`;
    let score = won ? 50 : 0;
    const lances: string[] = [];

    if (scene === 'evolucao') {
        const evo = ev.find((e) => e.type === 'evolve' && e.team === 0);
        if (!evo || evo.type !== 'evolve') return null;
        score += 1000 - evo.tick / 10;
        // os mais icônicos no gancho: Charmander e Pikachu
        if (evo.from === 4 || evo.from === 25) score += 400;
        lances.push(`${sec(evo.tick)} ${species(evo.from).name} evolui pra ${species(evo.into).name}`);
        const g = goals.find((x) => x.tick > evo.tick && x.tick < evo.tick + 400 && m.roster[x.by].uid === evo.uid);
        if (g) {
            score += 600;
            lances.push(`${sec(g.tick)} gol do evoluído`);
        }
    }
    if (scene === 'raio') {
        // só gol do Pikachu com golpe elétrico
        for (const g of goals) {
            if (m.roster[g.by].speciesId !== 25) continue;
            const s = shotBefore(g);
            const mv = [...ev]
                .reverse()
                .find(
                    (e) =>
                        e.type === 'move' && e.by === g.by && e.withBall && e.tick <= g.tick && e.tick >= g.tick - 60,
                );
            const id = s?.moveId ?? (mv?.type === 'move' ? mv.moveId : null);
            if (id !== 'thunder' && id !== 'thunderbolt') continue;
            score += 600 - g.tick / 100;
            lances.push(`${sec(g.tick)} gol do Pikachu com ${id}`);
        }
        if (!lances.length) return null;
    }
    if (scene === 'golpe') {
        // chute com golpe (shot.moveId) ou golpe usado com a bola logo antes do gol; golpes vistosos valem mais
        for (const g of goals) {
            const s = shotBefore(g);
            const mv = [...ev]
                .reverse()
                .find(
                    (e) =>
                        e.type === 'move' && e.by === g.by && e.withBall && e.tick <= g.tick && e.tick >= g.tick - 60,
                );
            const id = s?.moveId ?? (mv?.type === 'move' ? mv.moveId : null);
            if (!id) continue;
            score += (SHOWY.has(id) ? 400 : 150) - g.tick / 100;
            lances.push(`${sec(g.tick)} gol de ${who(g.by)} com ${id}`);
        }
        if (!lances.length) return null;
    }
    if (scene === 'defesa') {
        // chute com golpe do Charizard que acaba em defesa (espalmada vale mais que agarrada) ou na trave
        for (const sh of ev) {
            if (sh.type !== 'shot' || !mine(sh) || m.roster[sh.by].speciesId !== 6 || !sh.moveId) continue;
            const fim = ev.find(
                (e) =>
                    e.tick >= sh.tick &&
                    e.tick <= sh.tick + 40 &&
                    ((e.type === 'save' && e.shooter === sh.by) || (e.type === 'post' && e.shooter === sh.by)),
            );
            if (!fim) continue;
            const pts = fim.type === 'post' ? 500 : fim.type === 'save' && !fim.caught ? 450 : 300;
            score += pts + (SHOWY.has(sh.moveId) ? 300 : 0) - sh.tick / 100;
            lances.push(
                `${sec(sh.tick)} Charizard chuta com ${sh.moveId} → ${fim.type === 'post' ? 'trave' : fim.type === 'save' && fim.caught ? 'goleiro agarra' : 'goleiro espalma'}`,
            );
        }
        if (!lances.length) return null;
    }
    if (scene === 'jogada') {
        for (const g of goals) {
            if (g.assist === null) continue;
            const passes = ev.filter(
                (e) => e.type === 'pass' && e.tick > g.tick - 160 && e.tick <= g.tick && mine(e),
            ).length;
            if (passes >= 3) {
                score += passes * 80;
                lances.push(`${sec(g.tick)} gol de ${who(g.by)} (assist. ${who(g.assist)}) depois de ${passes} passes`);
            }
        }
        if (!lances.length) return null;
    }
    if (scene === 'ditto') {
        const tr = ev.find((e) => e.type === 'transform' && mine(e));
        const combo = ev.find((e) => e.type === 'combo' && mine(e));
        if (!tr || !combo || tr.type !== 'transform') return null;
        score += 800 - combo.tick / 10;
        lances.push(`${sec(tr.tick)} Ditto vira ${species(tr.into).name}`, `${sec(combo.tick)} combo Gênese`);
        const dittoGoal = goals.find((g) => g.by === tr.by);
        if (dittoGoal) {
            score += 300;
            lances.push(`${sec(dittoGoal.tick)} gol do Ditto`);
        }
    }
    if (scene === 'penaltis') {
        if (!m.shootout || m.shootout[0] <= m.shootout[1]) return null;
        const pens = ev.filter((e): e is Extract<MatchEvent, { type: 'penalty' }> => e.type === 'penalty');
        const last = pens.at(-1);
        if (!last) return null;
        // decidido na última: a diferença final é 1 e a última cobrança mudou o resultado
        if (m.shootout[0] - m.shootout[1] === 1) score += 700;
        score += pens.length * 20;
        lances.push(
            `${pens.length} cobranças, última de ${who(last.by)} (${last.scored ? 'gol' : 'perdeu'}) aos ${sec(last.tick)}`,
        );
    }
    return { seed, score: Math.round(score), resumo: `${placar} contra ${away.name}`, lances };
}

for (const scene of scenes) {
    const hits: Hit[] = [];
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
        const h = rate(scene, `trailer${i}`);
        if (h) hits.push(h);
    }
    hits.sort((a, b) => b.score - a.score);
    console.log(
        `\n=== ${scene}: ${hits.length}/${N} partidas servem (${((performance.now() - t0) / 1000).toFixed(0)} s) ===`,
    );
    for (const h of hits.slice(0, TOP)) {
        console.log(`${h.seed}  [${h.score}]  ${h.resumo}`);
        for (const l of h.lances.slice(0, 4)) console.log(`    ${l}`);
        console.log(`    abrir: ?demo=trailer&cena=${scene}&seed=${h.seed}`);
    }
}
