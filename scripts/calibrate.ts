/**
 * Calibração headless: roda N partidas entre times sorteados pelo draft da IA e imprime métricas.
 * Metas: 5–7 gols/jogo · time mais forte vence ~60–65% · nenhum tipo > 55% de vitórias.
 *
 * Uso: npm run calibrate -- --n 2000 [--csv out.csv] [--agencia]
 * --agencia: os dois times com o técnico IA da beira da quadra (src/engine/rival-coach.ts), líderes em rodízio.
 */
import { writeFileSync } from 'node:fs';
import { FUTSAL_5, withConfig } from '../src/engine/config';
import { species } from '../src/engine/data';
import { aiDraftTeam } from '../src/engine/draft';
import { FORMATIONS, type FormationId } from '../src/engine/formations';
import { viewInstance } from '../src/engine/instance';
import { COACH_LEADERS } from '../src/engine/rival-coach';
import { Rng } from '../src/engine/rng';
import { runMatch } from '../src/engine/runners/batch-runner';
import type { MatchEventType, Tactic, TeamSetup } from '../src/engine/state';

const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || 500;
const csvPath = args.includes('--csv') ? args[args.indexOf('--csv') + 1] : null;
const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];
const AGENCIA = args.includes('--agencia');
// --tipo: golpe máximo com o efeito do tipo do capitão no N3 (`maxType`, ?tipo=1; golpe-maximo-por-tipo.md)
const CFG = args.includes('--tipo') ? withConfig({ maxType: true }) : FUTSAL_5;

const rng = new Rng('calibrate');

// --formations: cada time é draftado para a própria formação; mede vitórias e estilo por formação
// (gols pró/contra, posse, chutes, xG por chute, passes, desarmes certos, de quem são os gols) contra todas as outras
if (args.includes('--formations')) {
    const ids = Object.keys(FORMATIONS) as FormationId[];
    const keys = ['w', 'g', 'gf', 'ga', 'pos', 'sh', 'shA', 'xg', 'pa', 'tk', 'gPivo', 'gAla', 'gFixo', 'gGk'] as const;
    type Rec = Record<(typeof keys)[number], number>;
    const blank = (): Rec => Object.fromEntries(keys.map((k) => [k, 0])) as Rec;
    const rec = new Map<FormationId, Rec>(ids.map((f) => [f, blank()]));
    const vs = new Map<string, { w: number; l: number; g: number }>();
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
        for (const fa of ids) {
            for (const fb of ids) {
                if (fa === fb) continue;
                const home: TeamSetup = {
                    name: 'A',
                    ...aiDraftTeam(new Rng(`f-${i}`, 'A'), 1, [], fa),
                    tactic: 'balanced',
                    color: 0,
                    formation: fa,
                };
                const away: TeamSetup = {
                    name: 'B',
                    ...aiDraftTeam(new Rng(`f-${i}`, 'B'), 1, [], fb),
                    tactic: 'balanced',
                    color: 0,
                    formation: fb,
                };
                const r = runMatch(FUTSAL_5, home, away, `${i}-${fa}-${fb}`, { snapshots: false });
                const side = [blank(), blank()];
                for (const e of r.events) {
                    if (e.type === 'shot') {
                        const x = side[r.roster[e.by].team];
                        x.sh++;
                        x.xg += e.xg;
                    } else if (e.type === 'pass') side[r.roster[e.by].team].pa++;
                    else if (e.type === 'tackle' && e.success) side[r.roster[e.by].team].tk++;
                    else if (e.type === 'goal' && !e.ownGoal) {
                        const role = r.roster[e.by].role;
                        const x = side[e.team];
                        if (role === 'PIVO') x.gPivo++;
                        else if (role === 'ALA') x.gAla++;
                        else if (role === 'FIXO') x.gFixo++;
                        else x.gGk++;
                    }
                }
                for (const t of [0, 1] as const) {
                    const x = rec.get(t === 0 ? fa : fb)!;
                    const won = r.winner === t;
                    x.g++;
                    if (won) x.w++;
                    x.gf += r.score[t];
                    x.ga += r.score[1 - t];
                    x.pos += r.possession[t];
                    x.sh += side[t].sh;
                    x.shA += side[1 - t].sh;
                    x.xg += side[t].xg;
                    x.pa += side[t].pa;
                    x.tk += side[t].tk;
                    x.gPivo += side[t].gPivo;
                    x.gAla += side[t].gAla;
                    x.gFixo += side[t].gFixo;
                    x.gGk += side[t].gGk;
                }
                const k = `${fa}|${fb}`;
                const m = vs.get(k) ?? { w: 0, l: 0, g: 0 };
                m.g++;
                if (r.winner === 0) m.w++;
                if (r.winner === 1) m.l++;
                vs.set(k, m);
            }
        }
    }
    const f1 = (n: number) => n.toFixed(1);
    console.log(
        `formações: ${N} rodadas, ${((performance.now() - t0) / 1000).toFixed(0)}s (por jogo, contra as outras)`,
    );
    console.log(
        '| Formação | Vitória | Gols pró | Gols contra | Posse | Chutes | Chutes contra | xG/chute | Passes | Desarmes | Gols Pivô/Ala/Fixo |',
    );
    console.log('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const [f, x] of rec) {
        const goals = Math.max(1, x.gPivo + x.gAla + x.gFixo + x.gGk);
        const share = (n: number) => `${Math.round((n / goals) * 100)}`;
        console.log(
            `| ${f} | ${Math.round((x.w / x.g) * 100)}% | ${f1(x.gf / x.g)} | ${f1(x.ga / x.g)} | ${Math.round((x.pos / x.g) * 100)}% | ${f1(x.sh / x.g)} | ${f1(x.shA / x.g)} | ${(x.xg / Math.max(1, x.sh)).toFixed(3)} | ${Math.round(x.pa / x.g)} | ${f1(x.tk / x.g)} | ${share(x.gPivo)}/${share(x.gAla)}/${share(x.gFixo)}% |`,
        );
    }
    console.log('\nconfronto (% de vitória da linha, mando somado):');
    console.log(['', ...ids].map((t) => t.padEnd(9)).join(''));
    for (const fa of ids) {
        const cells = ids.map((fb) => {
            if (fa === fb) return '—'.padEnd(9);
            const a = vs.get(`${fa}|${fb}`)!;
            const b = vs.get(`${fb}|${fa}`)!;
            return `${Math.round(((a.w + b.l) / (a.g + b.g)) * 100)}%`.padEnd(9);
        });
        console.log(`${fa.padEnd(9)}${cells.join('')}`);
    }
    process.exit(0);
}

// --tactics: mesmos times, só a tática muda (e os lados se invertem) → matriz de confrontos
if (args.includes('--tactics')) {
    const wins = new Map<string, { w: number; g: number }>();
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
        const a = aiDraftTeam(rng, 1);
        const b = aiDraftTeam(rng, 1);
        for (const ta of TACTICS) {
            for (const tb of TACTICS) {
                if (ta === tb) continue;
                for (const swap of [false, true]) {
                    const home: TeamSetup = { name: 'A', ...(swap ? b : a), tactic: ta, color: 0 };
                    const away: TeamSetup = { name: 'B', ...(swap ? a : b), tactic: tb, color: 0 };
                    const r = runMatch(FUTSAL_5, home, away, `${i}-${ta}-${tb}-${swap}`, { snapshots: false });
                    const key = `${ta} x ${tb}`;
                    const rec = wins.get(key) ?? { w: 0, g: 0 };
                    rec.g++;
                    if (r.winner === 0) rec.w++;
                    wins.set(key, rec);
                }
            }
        }
    }
    console.log(
        `matriz de táticas (${((performance.now() - t0) / 1000).toFixed(0)}s) — % de vitórias da tática da linha`,
    );
    console.log(['', ...TACTICS].map((t) => t.padEnd(11)).join(''));
    for (const ta of TACTICS) {
        const cells = TACTICS.map((tb) => {
            const r = wins.get(`${ta} x ${tb}`);
            return (r ? `${Math.round((r.w / r.g) * 100)}%` : '—').padEnd(11);
        });
        const total = TACTICS.filter((tb) => tb !== ta).reduce(
            (acc, tb) => {
                const r = wins.get(`${ta} x ${tb}`)!;
                return { w: acc.w + r.w, g: acc.g + r.g };
            },
            { w: 0, g: 0 },
        );
        console.log(`${ta.padEnd(11)}${cells.join('')} geral ${Math.round((total.w / total.g) * 100)}%`);
    }
    process.exit(0);
}
const strength = (t: TeamSetup) => t.lineup.reduce((sum, i) => sum + viewInstance(i).overall, 0) / t.lineup.length;

let goals = 0;
let draws = 0;
let blowouts = 0;
let strongerWins = 0;
let decisive = 0;
const scoreDist = new Map<number, number>();
const eventCounts = new Map<MatchEventType, number>();
const typeRecord = new Map<string, { w: number; g: number }>();
const tacticRecord = new Map<Tactic, { w: number; g: number }>();
const moveKinds = new Map<string, number>();
const traitFx = new Map<string, number>();
// drama do fim (docs/planos/pressao-final.md): gol nos acréscimos, virada/empate de quem perdia no minuto 37
const LATE_MIN = FUTSAL_5.displayHalfMinutes * 2 - 3;
let stoppageGoalMatches = 0;
let lateGoals = 0;
let behindAtLate = 0;
let comebacks = 0;
// --agencia: golpe máximo que saiu e virou gol (do mesmo jogador, em até 4 s), goleiro-linha ligado
let maxHits = 0;
let maxGoals = 0;
let gkMax = 0;
/** Golpes máximos por nível (N1, N2, N3; o de 1 nível conta como N2) e notas (fora, bom, perfeito). */
const maxByLevel = [0, 0, 0];
const maxByGrade = [0, 0, 0];
const rows: string[] = ['seed,home,away,strHome,strAway,tactHome,tactAway,shootout'];
const t0 = performance.now();

for (let i = 0; i < N; i++) {
    const mk = (name: string): TeamSetup => {
        const d = aiDraftTeam(rng, rng.int(0, 1));
        return { name, ...d, tactic: rng.pick(TACTICS), color: 0 };
    };
    const home = mk('A');
    const away = mk('B');
    if (AGENCIA) {
        home.coach = COACH_LEADERS[i % COACH_LEADERS.length];
        away.coach = COACH_LEADERS[(i + 3) % COACH_LEADERS.length];
    }
    const r = runMatch(CFG, home, away, i, { snapshots: false });
    const total = r.score[0] + r.score[1];
    goals += total;
    scoreDist.set(total, (scoreDist.get(total) ?? 0) + 1);
    if (r.score[0] === r.score[1]) draws++;
    if (Math.abs(r.score[0] - r.score[1]) >= 6) blowouts++;
    for (const e of r.events) {
        eventCounts.set(e.type, (eventCounts.get(e.type) ?? 0) + 1);
        if (e.type === 'move') moveKinds.set(e.kind, (moveKinds.get(e.kind) ?? 0) + 1);
        if (e.type === 'trait') traitFx.set(e.fx, (traitFx.get(e.fx) ?? 0) + 1);
    }

    let hit: { tick: number; by: number } | null = null;
    for (const e of r.events) {
        if (e.type === 'max' && e.phase === 'hit') {
            maxHits++;
            maxByLevel[(e.level ?? 2) - 1]++;
            if (e.q !== undefined) maxByGrade[e.q]++;
            if (r.roster[e.by]?.role === 'GK') gkMax++;
            hit = { tick: e.tick, by: e.by };
        } else if (e.type === 'goal' && hit) {
            if (e.by === hit.by && e.tick - hit.tick < 80) maxGoals++;
            hit = null;
        }
    }
    const goalEvs = r.events.filter((e) => e.type === 'goal');
    // nos acréscimos o relógio para no fim do tempo (minuto 20 ou 40 cravado)
    if (goalEvs.some((e) => e.minute >= e.half * FUTSAL_5.displayHalfMinutes)) stoppageGoalMatches++;
    lateGoals += goalEvs.filter((e) => e.half === 2 && e.minute >= LATE_MIN).length;
    const at = [0, 0];
    for (const e of goalEvs) if (e.type === 'goal' && (e.half === 1 || e.minute < LATE_MIN)) at[e.team]++;
    if (at[0] !== at[1]) {
        behindAtLate++;
        const loser = at[0] < at[1] ? 0 : 1;
        if (r.score[loser] >= r.score[1 - loser]) comebacks++;
    }

    const sh = strength(home);
    const sa = strength(away);
    if (Math.abs(sh - sa) >= 3 && r.winner !== null) {
        decisive++;
        if ((sh > sa ? 0 : 1) === r.winner) strongerWins++;
    }
    [home, away].forEach((team, ti) => {
        const won = r.winner === ti;
        const types = new Set(team.lineup.flatMap((inst) => species(inst.speciesId).types));
        for (const t of types) {
            const rec = typeRecord.get(t) ?? { w: 0, g: 0 };
            rec.g++;
            if (won) rec.w++;
            typeRecord.set(t, rec);
        }
        const tr = tacticRecord.get(team.tactic) ?? { w: 0, g: 0 };
        tr.g++;
        if (won) tr.w++;
        tacticRecord.set(team.tactic, tr);
    });
    rows.push(
        [
            i,
            r.score[0],
            r.score[1],
            sh.toFixed(1),
            sa.toFixed(1),
            home.tactic,
            away.tactic,
            r.shootout?.join('-') ?? '',
        ].join(','),
    );
}

const ms = performance.now() - t0;
const per = (n: number) => (n / N).toFixed(2);
console.log(`\n=== ${N} partidas em ${(ms / 1000).toFixed(1)}s (${(ms / N).toFixed(1)} ms/partida) ===`);
console.log(`gols/jogo: ${(goals / N).toFixed(2)}   (meta 5–7)`);
console.log(`empates no tempo normal: ${((draws / N) * 100).toFixed(1)}%`);
console.log(`goleadas (6+ de diferença): ${((blowouts / N) * 100).toFixed(1)}%`);
console.log(
    `mais forte (Δ≥3) vence: ${((strongerWins / Math.max(1, decisive)) * 100).toFixed(1)}% de ${decisive}   (meta 60–65%)`,
);
console.log(
    `jogos com gol nos acréscimos: ${((stoppageGoalMatches / N) * 100).toFixed(1)}% · gols do minuto ${LATE_MIN} em diante: ${per(lateGoals)}/jogo`,
);
console.log(
    `quem perdia no minuto ${LATE_MIN} empatou ou virou: ${((comebacks / Math.max(1, behindAtLate)) * 100).toFixed(1)}% de ${behindAtLate}`,
);
console.log(
    'distribuição de gols:',
    [...scoreDist.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([g, c]) => `${g}:${c}`)
        .join(' '),
);
console.log(
    'eventos/jogo:',
    [...eventCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t, c]) => `${t}=${per(c)}`)
        .join(' '),
);
console.log('golpes/jogo por tipo:', [...moveKinds.entries()].map(([k, c]) => `${k}=${per(c)}`).join(' '));
console.log(
    'traços de golpe/jogo:',
    [...traitFx.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, c]) => `${k}=${per(c)}`)
        .join(' '),
);
console.log(
    'vitórias por tática:',
    [...tacticRecord.entries()].map(([t, r]) => `${t}=${((r.w / r.g) * 100).toFixed(0)}%`).join(' '),
);
console.log(
    'vitórias por tipo (time com o tipo):',
    [...typeRecord.entries()]
        .sort((a, b) => b[1].w / b[1].g - a[1].w / a[1].g)
        .map(([t, r]) => `${t}=${((r.w / r.g) * 100).toFixed(0)}%(${r.g})`)
        .join(' '),
);
if (AGENCIA)
    console.log(
        `golpe máximo: ${per(maxHits)} saíram/jogo (${per(gkMax)} de goleiro), ${per(maxGoals)} viraram gol/jogo; N1/N2/N3 ${maxByLevel.map(per).join('/')}; fora/bom/perfeito ${maxByGrade.map(per).join('/')}`,
    );
if (csvPath) writeFileSync(csvPath, rows.join('\n'));
