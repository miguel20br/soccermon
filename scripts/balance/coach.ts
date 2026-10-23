// Técnico robô da agência (docs/planos/pesquisas/agencia.md, seção 4): mede quanto cada mecânica vale.
// Uso: npx tsx scripts/balance/coach.ts <partidas> <out.json> [velocidade=4] [mecânicas=timeout,flyGk,max,pens,all]
// O time 0 é o robô; o time 1, a IA de sempre (sem mecânica). Mesmas seeds em todas as políticas (comparação pareada).
// Políticas: never (nunca usa = a partida de hoje), random (usa em horas sorteadas), good (regra simples e sensata);
// A ordem vale `40 × velocidade` ticks à frente, como na copa; o golpe máximo, no próprio tick (o botão só acende na
// hora certa: `maxCue`). CAP=gk: o capitão do robô é o goleiro (defesa máxima).
// RIVAL=1: o time 1 ganha o técnico IA que reage (src/engine/rival-coach.ts), um líder por partida (em rodízio).
// Golpe máximo em 3 níveis (motor 11, golpe-maximo-niveis.md): a nota do toque é sorteada aqui fora (40% perfeito, 40%
// bom, 20% fora) e há mais duas políticas: n1 (solta no 1º gomo) e n3 (segura pro 3º). Golpes e gols por nível.
// Golpe máximo por tipo (motor 12, golpe-maximo-por-tipo.md): MAXTIPO=1 liga o efeito do tipo (`MatchConfig.maxType`);
// CAPTYPE=<tipo> (Fire, Water…) põe no time do robô, no rodízio, um capitão de linha com esse efeito; POLS=n3,n1 limita
// as políticas do golpe máximo.
import { writeFileSync } from 'node:fs';
import { AGENCY, maxCharge } from '../../src/engine/agency';
import { withConfig } from '../../src/engine/config';
import { inMaxZoneOf, maxFxType, minuteOf } from '../../src/engine/match';
import { COACH_LEADERS, RIVAL_COACH } from '../../src/engine/rival-coach';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchState } from '../../src/engine/state';
import { baseTeams, createInstance, FUTSAL_5, insertSpecies, Rng, SPECIES, species, type TeamSetup } from './lib';

const N = Number(process.argv[2]) || 100;
const OUT = process.argv[3] ?? 'coach.json';
const SPEED = Number(process.argv[4]) || 4;
const MECHS = (process.argv[5] ?? 'timeout,flyGk,max,pens,all').split(',');
const CAP_GK = process.env.CAP === 'gk';
const LEAD = 40 * SPEED;
const RIVAL = process.env.RIVAL === '1';
const CFG = process.env.MAXTIPO === '1' ? withConfig({ maxType: true }) : FUTSAL_5;
const CAPTYPE = process.env.CAPTYPE;
const POLS = process.env.POLS?.split(',');
/** Espécies (forma de linha) cujo efeito N3 é o tipo pedido, com o golpe que a carta traz. */
const capPool = CAPTYPE
    ? SPECIES.filter((sp) => {
          if (!sp || sp.id > 151) return false;
          return (sp.types as string[]).includes(CAPTYPE);
      }).map((sp) => sp.id)
    : [];
/** O time do robô com um capitão de linha do tipo `CAPTYPE` (rodízio pelas espécies desse tipo). */
function withCapType(t: TeamSetup, i: number): TeamSetup {
    for (let k = 0; k < capPool.length; k++) {
        const id = capPool[(i + k) % capPool.length];
        const r = insertSpecies(t, id, i);
        if (!r) continue;
        const { team, inst } = r;
        const pos = team.lineup.indexOf(inst);
        if (pos === 0 || maxFxType(inst.moves, id, species(id).types) !== CAPTYPE) continue;
        return { ...team, captainUid: inst.uid };
    }
    // sem vaga natural de linha (Clefairy e Clefable são goleiros): entra de pivô
    for (const id of capPool) {
        const inst = createInstance(id, new Rng(`ins-${i}-${id}`));
        if (maxFxType(inst.moves, id, species(id).types) !== CAPTYPE) continue;
        const lineup = t.lineup.map((p, k) => (k === t.lineup.length - 1 ? inst : p));
        return { ...t, lineup, captainUid: inst.uid };
    }
    throw new Error(`sem capitão ${CAPTYPE} na partida ${i}`);
}
// variantes pra comparar (ex.: AG_maxGkReach=1.4): mexe só nesta rodada do robô, nunca no jogo
for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('AG_') && v) (AGENCY as unknown as Record<string, number>)[k.slice(3)] = Number(v);
    // técnico IA rival (ex.: RC_leadTicks=200: avisa 10 s antes)
    if (k.startsWith('RC_') && v) (RIVAL_COACH as unknown as Record<string, number>)[k.slice(3)] = Number(v);
}
type Policy = 'never' | 'random' | 'good' | 'n1' | 'n3';

interface Plan {
    timeouts: number[];
    fly: [number, number];
    maxDelay: number;
    pens: number[];
}

/** Sorteio da política aleatória (Rng próprio: não mexe no da partida). */
function randomPlan(i: number): Plan {
    const r = new Rng(`coach-${i}`, 'plan');
    const on = r.range(5, 38);
    return {
        timeouts: [r.range(2, 18), r.range(22, 38)],
        fly: [on, on + r.range(2, 8)],
        maxDelay: r.range(0, 10),
        pens: [0, 1, 2, 3]
            .map((k) => ({ k, w: r.next() }))
            .sort((a, b) => a.w - b.w)
            .map((x) => x.k),
    };
}

interface Out {
    win: boolean;
    gf: number;
    ga: number;
    maxStarts: number;
    maxHits: number;
    maxGoals: number;
    /** Golpes que saíram e gols deles, por nível (N1, N2, N3). */
    hitsBy: number[];
    goalsBy: number[];
    /** Defesas máximas que saíram (capitão goleiro). */
    maxSaves: number;
    flyGf: number;
    flyGa: number;
    timeouts: number;
    shootout: boolean;
    /** Ordens do técnico IA rival (avisos 'coach'). */
    rivalCalls: number;
}

function play(i: number, mech: string, policy: Policy): Out {
    const { A: A1, B } = baseTeams(i);
    const A0 = CAPTYPE ? withCapType(A1, i) : A1;
    const A = CAP_GK ? { ...A0, captainUid: A0.lineup[0].uid } : A0;
    const away = RIVAL ? { ...B, coach: COACH_LEADERS[i % COACH_LEADERS.length] } : B;
    const runner = new LiveRunner(CFG, A, away, `coach-${i}`);
    const gradeRng = new Rng(`coach-${i}`, 'grade');
    const grade = () => {
        const r = gradeRng.next();
        return r < 0.4 ? 2 : r < 0.8 ? 1 : 0;
    };
    const s = runner.state;
    const plan = randomPlan(i);
    const use = (m: string) => policy !== 'never' && (mech === m || mech === 'all');
    let fullAt: number | null = null;
    let flyOn = false;
    let pensSent = false;
    let tos = 0;
    const order = (o: Record<string, unknown>, lead = LEAD) =>
        runner.addOrder({ tick: s.tick + lead, team: 0, ...o } as Parameters<LiveRunner['addOrder']>[0]);
    while (!runner.finished && s.tick < 200_000) {
        if (s.phase !== 'fulltime') {
            if (s.tick % 20 === 0) decide();
            if (use('max')) maxTap();
        }
        runner.step();
    }
    /** O botão do golpe máximo acende (a mesma hora certa da tela) e o robô toca. */
    function maxTap() {
        if (s.phase !== 'play' || s.teams[0].agency.max) return;
        const cap = s.players.find((p) => p.team === 0 && p.captain);
        const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
        if (!cap || !owner) return;
        const cue =
            cap.role === 'GK' ? owner.team === 1 && inMaxZoneOf(s, owner, 'GK') : owner === cap && inMaxZoneOf(s, cap);
        if (!cue) return;
        const c = maxCharge(s.events, 0, s.tick, FUTSAL_5.teamSize);
        if (c.level < 1 || c.active) return;
        const min = minuteOf(s);
        fullAt ??= min;
        // aleatório: deixa passar umas chances antes de tocar; bom: toca na 1ª com o jogo apertado (ou perdendo);
        // n1: toca sempre que acende; n3: só com os 3 gomos
        const go =
            policy === 'n1'
                ? true
                : policy === 'n3'
                  ? c.level >= 3
                  : policy === 'random'
                    ? min >= fullAt + plan.maxDelay
                    : s.score[0] - s.score[1] <= 1;
        if (go) order({ kind: 'max', q: grade() }, 0);
    }
    function decide() {
        const min = minuteOf(s);
        const diff = s.score[0] - s.score[1];
        const ag = s.teams[0].agency;
        const field = s.players.filter((p) => p.team === 0 && p.role !== 'GK');
        const energy = field.reduce((a, p) => a + p.energy, 0) / field.length;
        if (use('timeout') && !ag.timeoutPending && !ag.timeouts[s.half - 1] && tos < 2) {
            const go =
                policy === 'random'
                    ? min >= plan.timeouts[s.half - 1]
                    : s.half === 1
                      ? min >= 12 && energy < 0.62
                      : min >= 28 && energy < 0.52;
            if (go) {
                order({ kind: 'timeout' });
                tos++;
            }
        }
        if (use('flyGk')) {
            const want =
                policy === 'random' ? min >= plan.fly[0] && min < plan.fly[1] : diff < 0 && diff >= -2 && min >= 34;
            if (want !== flyOn) {
                order({ kind: 'flyGk', on: want });
                flyOn = want;
            }
        }
        if (use('pens') && !pensSent && min >= 38 && policy === 'random') {
            pensSent = true;
            const uids = s.players.filter((p) => p.team === 0 && p.role !== 'GK').map((p) => (p.origin ?? p.inst).uid);
            order({ kind: 'penalties', order: plan.pens.filter((k) => k < uids.length).map((k) => uids[k]) });
        }
    }
    return summarize(s);
}

function summarize(s: MatchState): Out {
    const ev = s.events;
    const o: Out = {
        win: s.winner === 0,
        gf: s.score[0],
        ga: s.score[1],
        maxStarts: 0,
        maxHits: 0,
        maxGoals: 0,
        hitsBy: [0, 0, 0],
        goalsBy: [0, 0, 0],
        maxSaves: 0,
        flyGf: 0,
        flyGa: 0,
        timeouts: 0,
        shootout: !!s.shootout,
        rivalCalls: ev.filter((e) => e.type === 'coach' && e.team === 1).length,
    };
    let fly = false;
    let lastMaxHit: { tick: number; by: number; lv: number } | null = null;
    for (const e of ev) {
        if (e.type === 'max' && e.team === 0) {
            if (e.phase === 'start') o.maxStarts++;
            if (e.phase === 'hit') {
                if (
                    s.players[e.by]?.role === 'GK' ||
                    ev.some((x) => x.type === 'max' && x.team === 0 && x.phase === 'start')
                )
                    o.maxSaves++;
                o.maxHits++;
                const lv = (e.level ?? 2) - 1;
                o.hitsBy[lv]++;
                lastMaxHit = { tick: e.tick, by: e.by, lv };
            }
        }
        if (e.type === 'flyGk' && e.team === 0) fly = e.on;
        if (e.type === 'timeout' && e.team === 0) o.timeouts++;
        if (e.type === 'goal') {
            if (fly && e.team === 0) o.flyGf++;
            if (fly && e.team === 1) o.flyGa++;
            if (lastMaxHit && e.team === 0 && e.by === lastMaxHit.by && e.tick - lastMaxHit.tick < 80) {
                o.maxGoals++;
                o.goalsBy[lastMaxHit.lv]++;
            }
            lastMaxHit = null;
        }
    }
    return o;
}

const configs: [string, Policy][] = [['none', 'never']];
for (const m of MECHS) {
    configs.push([m, 'random'], [m, 'good']);
    if (m === 'max') configs.push([m, 'n1'], [m, 'n3']);
}
if (POLS) {
    const keep = configs.filter(([m, p]) => p === 'never' || (m === 'max' && POLS.includes(p)));
    configs.length = 0;
    configs.push(...keep);
}
const res: Record<string, Out[]> = {};
const t0 = Date.now();
console.log(RIVAL ? 'rival reagindo (técnico IA, líderes em rodízio)' : 'rival parado (como hoje)');
for (const [m, p] of configs) {
    const key = `${m}:${p}`;
    res[key] = [];
    for (let i = 0; i < N; i++) res[key].push(play(i, m, p));
    const w = res[key].filter((x) => x.win).length / N;
    console.log(`${key.padEnd(16)} vitória ${(w * 100).toFixed(1)}%  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
writeFileSync(OUT, JSON.stringify({ N, SPEED, RIVAL, res }));

// tabela: diferença pareada contra "nunca usa", com o erro (1 desvio) da diferença
const base = res['none:never'];
const pct = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}`;
console.log('\n| Mecânica | Política | Vitória | Δ vs nunca (pp) | ± | Gols pró/contra | Extra |');
console.log('|---|---|---:|---:|---:|---|---|');
for (const [key, rows] of Object.entries(res)) {
    const d = rows.map((r, i) => Number(r.win) - Number(base[i].win));
    const mean = d.reduce((a, b) => a + b, 0) / N;
    const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / (N - 1) / N);
    const avg = (f: (r: Out) => number) => rows.reduce((a, r) => a + f(r), 0) / N;
    const [m, p] = key.split(':');
    const extra = [
        avg((r) => r.maxHits + r.maxStarts)
            ? `máx sai ${avg((r) => r.maxHits).toFixed(2)}/jogo (N1/N2/N3 ${[0, 1, 2].map((k) => avg((r) => r.hitsBy[k]).toFixed(2)).join('/')}), gol ${avg((r) => r.maxGoals).toFixed(2)} (${[0, 1, 2].map((k) => avg((r) => r.goalsBy[k]).toFixed(2)).join('/')}), defesa ${avg((r) => r.maxSaves).toFixed(2)}`
            : '',
        avg((r) => r.flyGf + r.flyGa)
            ? `goleiro-linha: ${avg((r) => r.flyGf).toFixed(2)} pró, ${avg((r) => r.flyGa).toFixed(2)} contra`
            : '',
        avg((r) => r.timeouts) ? `tempos ${avg((r) => r.timeouts).toFixed(1)}` : '',
        m === 'pens' || m === 'none' ? `pênaltis ${(avg((r) => Number(r.shootout)) * 100).toFixed(0)}%` : '',
        RIVAL && m === 'none' ? `rival: ${avg((r) => r.rivalCalls).toFixed(1)} ordens/jogo` : '',
    ]
        .filter(Boolean)
        .join('; ');
    console.log(
        `| ${m} | ${p} | ${(avg((r) => Number(r.win)) * 100).toFixed(1)}% | ${pct(mean)} | ${(sd * 100).toFixed(1)} | ${avg((r) => r.gf).toFixed(2)} / ${avg((r) => r.ga).toFixed(2)} | ${extra} |`,
    );
}
