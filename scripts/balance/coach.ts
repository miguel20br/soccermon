// Técnico robô da agência (docs/planos/pesquisas/agencia.md, seção 4): mede quanto cada mecânica vale.
// Uso: npx tsx scripts/balance/coach.ts <partidas> <out.json> [velocidade=4] [mecânicas=shout,timeout,flyGk,max,pens,all]
// O time 0 é o robô; o time 1, a IA de sempre (sem mecânica). Mesmas seeds em todas as políticas (comparação pareada).
// Políticas: never (nunca usa = a partida de hoje), random (usa em horas sorteadas), good (regra simples e sensata);
// com RIVAL=1 também read (a good + responde ao aviso do rival: ele chama o time pra frente, você fecha; ele fecha,
// você vai pra cima).
// A ordem vale `40 × velocidade` ticks à frente, como na copa.
// RIVAL=1: o time 1 ganha o técnico IA que reage (src/engine/rival-coach.ts), um líder por partida (em rodízio).
import { writeFileSync } from 'node:fs';
import { AGENCY, maxCharge, SHOUT_KINDS, type Shout } from '../../src/engine/agency';
import { minuteOf } from '../../src/engine/match';
import { COACH_LEADERS, RIVAL_COACH } from '../../src/engine/rival-coach';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchState } from '../../src/engine/state';
import { baseTeams, FUTSAL_5, Rng } from './lib';

const N = Number(process.argv[2]) || 100;
const OUT = process.argv[3] ?? 'coach.json';
const SPEED = Number(process.argv[4]) || 4;
const MECHS = (process.argv[5] ?? 'shout,timeout,flyGk,max,pens,all').split(',');
const LEAD = 40 * SPEED;
const RIVAL = process.env.RIVAL === '1';
// variantes pra comparar (ex.: AG_maxRange=14): mexe só nesta rodada do robô, nunca no jogo
for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('AG_') && v) (AGENCY as unknown as Record<string, number>)[k.slice(3)] = Number(v);
    // técnico IA rival (ex.: RC_leadTicks=200: avisa 10 s antes)
    if (k.startsWith('RC_') && v) (RIVAL_COACH as unknown as Record<string, number>)[k.slice(3)] = Number(v);
}
type Policy = 'never' | 'random' | 'good' | 'read';

interface Plan {
    shouts: { minute: number; shout: Shout }[];
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
        shouts: [0, 1, 2]
            .map(() => ({ minute: r.range(2, 38), shout: r.pick(SHOUT_KINDS) }))
            .sort((a, b) => a.minute - b.minute),
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
    flyGf: number;
    flyGa: number;
    shouts: number;
    timeouts: number;
    shootout: boolean;
    /** Ordens do técnico IA rival (avisos 'coach'). */
    rivalCalls: number;
}

function play(i: number, mech: string, policy: Policy): Out {
    const { A, B } = baseTeams(i);
    const away = RIVAL ? { ...B, coach: COACH_LEADERS[i % COACH_LEADERS.length] } : B;
    const runner = new LiveRunner(FUTSAL_5, A, away, `coach-${i}`);
    const s = runner.state;
    const plan = randomPlan(i);
    const use = (m: string) => policy !== 'never' && (mech === m || mech === 'all');
    let fullAt: number | null = null;
    let flyOn = false;
    let pensSent = false;
    let tos = 0;
    let lastShout = -1e9;
    let shoutIdx = 0;
    const order = (o: Record<string, unknown>) =>
        runner.addOrder({ tick: s.tick + LEAD, team: 0, ...o } as Parameters<LiveRunner['addOrder']>[0]);
    while (!runner.finished && s.tick < 200_000) {
        if (s.tick % 20 === 0 && s.phase !== 'fulltime') decide();
        runner.step();
    }
    function rivalShout(): Shout | null {
        for (let k = s.events.length - 1; k >= 0; k--) {
            const e = s.events[k];
            if (s.tick - e.tick > AGENCY.shoutTicks) return null;
            if (e.type === 'coach' && e.team === 1 && e.call === 'shout') return e.shout;
        }
        return null;
    }
    function decide() {
        const min = minuteOf(s);
        const diff = s.score[0] - s.score[1];
        const ag = s.teams[0].agency;
        const field = s.players.filter((p) => p.team === 0 && p.role !== 'GK');
        const energy = field.reduce((a, p) => a + p.energy, 0) / field.length;
        if (use('shout')) {
            // um grito por vez: espera o anterior entrar (a ordem vale LEAD ticks à frente)
            const free =
                ag.shoutsUsed < AGENCY.shoutLimit && s.tick + LEAD >= ag.shoutReadyAt && s.tick > lastShout + LEAD;
            let pick: Shout | null = null;
            if (policy === 'random') {
                const due = plan.shouts[shoutIdx];
                if (due && min >= due.minute) pick = due.shout;
            } else {
                pick =
                    diff < 0 && min >= 36
                        ? 'press'
                        : diff < 0 && min >= 28
                          ? 'attack'
                          : diff > 0 && diff <= 2 && min >= 32
                            ? 'lock'
                            : energy < 0.45
                              ? 'calm'
                              : null;
                // lê o rival: responde ao último grito avisado dele (vale enquanto o grito dele dura)
                const call = policy === 'read' ? rivalShout() : null;
                if (call && (call === 'attack' || call === 'press') && diff >= 0) pick = 'lock';
                else if (call === 'lock' && diff <= 0) pick = 'attack';
            }
            if (pick && free) {
                order({ kind: 'shout', shout: pick });
                lastShout = s.tick;
                shoutIdx++;
            }
        }
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
        if (use('max') && !ag.max) {
            const c = maxCharge(s.events, 0, s.tick, FUTSAL_5.teamSize);
            if (c.charge >= 1 && !c.used) {
                fullAt ??= min;
                const go = policy === 'random' ? min >= fullAt + plan.maxDelay : diff <= 1;
                if (go) order({ kind: 'max' });
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
        flyGf: 0,
        flyGa: 0,
        shouts: 0,
        timeouts: 0,
        shootout: !!s.shootout,
        rivalCalls: ev.filter((e) => e.type === 'coach' && e.team === 1).length,
    };
    let fly = false;
    let lastMaxHit: { tick: number; by: number } | null = null;
    for (const e of ev) {
        if (e.type === 'max' && e.team === 0) {
            if (e.phase === 'start') o.maxStarts++;
            if (e.phase === 'hit') {
                o.maxHits++;
                lastMaxHit = { tick: e.tick, by: e.by };
            }
        }
        if (e.type === 'flyGk' && e.team === 0) fly = e.on;
        if (e.type === 'shout' && e.team === 0) o.shouts++;
        if (e.type === 'timeout' && e.team === 0) o.timeouts++;
        if (e.type === 'goal') {
            if (fly && e.team === 0) o.flyGf++;
            if (fly && e.team === 1) o.flyGa++;
            if (lastMaxHit && e.team === 0 && e.by === lastMaxHit.by && e.tick - lastMaxHit.tick < 80) o.maxGoals++;
            lastMaxHit = null;
        }
    }
    return o;
}

const configs: [string, Policy][] = [['none', 'never']];
for (const m of MECHS) {
    configs.push([m, 'random'], [m, 'good']);
    if (RIVAL && (m === 'shout' || m === 'all')) configs.push([m, 'read']);
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
        avg((r) => r.maxStarts)
            ? `máx ${avg((r) => r.maxStarts).toFixed(2)}/jogo, sai ${avg((r) => r.maxHits).toFixed(2)}, gol ${avg((r) => r.maxGoals).toFixed(2)}`
            : '',
        avg((r) => r.flyGf + r.flyGa)
            ? `goleiro-linha: ${avg((r) => r.flyGf).toFixed(2)} pró, ${avg((r) => r.flyGa).toFixed(2)} contra`
            : '',
        avg((r) => r.shouts) ? `gritos ${avg((r) => r.shouts).toFixed(1)}` : '',
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
