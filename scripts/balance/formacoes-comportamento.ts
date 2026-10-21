/**
 * Como cada formação JOGA (docs/planos/formacoes.md, etapa 2): o mesmo rival (Losango, Equilibrado) contra cada
 * formação, olhando só o time da formação. Mede onde cada um fica (mapa de calor, altura da linha, largura), os
 * passes (tamanho, pra frente/lado/trás, por posse, quem recebe), a velocidade da transição, as trocas de posição
 * e de onde saem os chutes. Grava os mapas e uma amostra de passes em JSON pra desenhar (formacoes-desenho.ts).
 *
 * Uso: npx tsx scripts/balance/formacoes-comportamento.ts [N=60] [saida.json]
 */
import { writeFileSync } from 'node:fs';
import { FUTSAL_5 } from '../../src/engine/config';
import { aiDraftTeam } from '../../src/engine/draft';
import { FORMATIONS, type FormationId } from '../../src/engine/formations';
import { toRel } from '../../src/engine/match';
import { Rng } from '../../src/engine/rng';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchState, PlayerState, TeamSetup } from '../../src/engine/state';
import type { Vec2 } from '../../src/engine/vec';

const N = Number(process.argv[2]) || 60;
const OUT = process.argv[3] ?? null;
const ids = Object.keys(FORMATIONS) as FormationId[];
const GX = 10; // mapa de calor: 10 × 5 casas na quadra de 40 × 20 (x = rumo ao ataque)
const GY = 5;

interface Acc {
    games: number;
    ticks: number;
    heatAtk: number[];
    heatDef: number[];
    atkX: number;
    atkWidth: number;
    atkN: number;
    defX: number;
    defN: number;
    roleX: Record<string, { sum: number; n: number }>;
    passes: number;
    passLen: number;
    fwd: number;
    back: number;
    recv: Record<string, number>;
    possessions: number;
    shotPoss: number;
    shotPossTicks: number;
    rotations: number;
    shots: number;
    shotDist: number;
    shotFar: number;
    shotBy: Record<string, number>;
    goals: number;
    against: number;
    lines: [number, number, number, number][];
}
const blank = (): Acc => ({
    games: 0,
    ticks: 0,
    heatAtk: Array(GX * GY).fill(0),
    heatDef: Array(GX * GY).fill(0),
    atkX: 0,
    atkWidth: 0,
    atkN: 0,
    defX: 0,
    defN: 0,
    roleX: {},
    passes: 0,
    passLen: 0,
    fwd: 0,
    back: 0,
    recv: {},
    possessions: 0,
    shotPoss: 0,
    shotPossTicks: 0,
    rotations: 0,
    shots: 0,
    shotDist: 0,
    shotFar: 0,
    shotBy: {},
    goals: 0,
    against: 0,
    lines: [],
});

const cell = (r: Vec2) => {
    const cx = Math.min(GX - 1, Math.max(0, Math.floor((r.x / 40) * GX)));
    const cy = Math.min(GY - 1, Math.max(0, Math.floor((r.y / 20) * GY)));
    return cy * GX + cx;
};

function play(acc: Acc, f: FormationId, i: number) {
    const home: TeamSetup = {
        name: 'A',
        ...aiDraftTeam(new Rng(`fc-${i}`, 'A'), 1, [], f),
        tactic: 'balanced',
        color: 0,
        formation: f,
    };
    const away: TeamSetup = {
        name: 'B',
        ...aiDraftTeam(new Rng(`fc-${i}`, 'B'), 1, [], '1-2-1'),
        tactic: 'balanced',
        color: 0,
        formation: '1-2-1',
    };
    const run = new LiveRunner(FUTSAL_5, home, away, `fc-${i}-${f}`);
    const s: MatchState = run.state;
    const T = 0 as const;
    const field = () => s.players.filter((p) => p.team === T && p.role !== 'GK');
    let lastOwner: number | null = null;
    let ownerTeam: 0 | 1 | null = null;
    let kickFrom: { by: number; at: Vec2 } | null = null;
    let lastKickTick = -1;
    let possStart: number | null = null; // posse nossa em andamento, sem chute ainda
    const off = new Map<number, number>(); // jogador → ticks seguidos fora da própria vaga (rodízio)
    const away2 = new Set<number>();
    let ev = 0;
    while (!run.finished) {
        run.step();
        if (s.phase !== 'play') continue;
        acc.ticks++;
        const own = s.ball.owner;
        const team = own !== null ? s.players[own].team : null;
        const attacking = team === T;
        // posição
        const fp = field();
        if (s.tick % 5 === 0) {
            let sx = 0;
            let sy = 0;
            let sy2 = 0;
            for (const p of fp) {
                const r = toRel(s, T, p.pos);
                (attacking ? acc.heatAtk : acc.heatDef)[cell(r)]++;
                sx += r.x;
                sy += r.y;
                sy2 += r.y * r.y;
                if (attacking) {
                    const k = p.role;
                    const o = acc.roleX[k] ?? { sum: 0, n: 0 };
                    o.sum += r.x;
                    o.n++;
                    acc.roleX[k] = o;
                }
            }
            const n = fp.length || 1;
            if (attacking) {
                acc.atkX += sx / n;
                acc.atkWidth += Math.sqrt(Math.max(0, sy2 / n - (sy / n) ** 2));
                acc.atkN++;
            } else if (team !== null) {
                acc.defX += sx / n;
                acc.defN++;
            }
        }
        // rodízio: atacando, quem passa 2 s mais perto da vaga de outro conta 1 troca
        if (attacking) {
            const base = s.teams[T].formation.attack;
            for (const p of fp) {
                const r = toRel(s, T, p.pos);
                let best = p.slot;
                let bd = Infinity;
                for (let k = 1; k < base.length; k++) {
                    const d = (r.x - base[k][0]) ** 2 + (r.y - base[k][1]) ** 2;
                    if (d < bd) {
                        bd = d;
                        best = k;
                    }
                }
                const t = best !== p.slot ? (off.get(p.idx) ?? 0) + 1 : 0;
                off.set(p.idx, t);
                if (t === 40 && !away2.has(p.idx)) {
                    acc.rotations++;
                    away2.add(p.idx);
                }
                if (t === 0) away2.delete(p.idx);
            }
        }
        // passe: guarda de onde saiu
        const lk = s.ball.lastKick;
        if (lk && lk.tick !== lastKickTick) {
            lastKickTick = lk.tick;
            kickFrom =
                lk.kind === 'pass' && s.players[lk.by].team === T
                    ? { by: lk.by, at: { ...s.players[lk.by].pos } }
                    : null;
        }
        if (own !== null && own !== lastOwner) {
            const p: PlayerState = s.players[own];
            if (team === T && kickFrom && kickFrom.by !== own && s.players[kickFrom.by].team === T) {
                const a = toRel(s, T, kickFrom.at);
                const b = toRel(s, T, p.pos);
                const dx = b.x - a.x;
                acc.passes++;
                acc.passLen += Math.hypot(dx, b.y - a.y);
                if (dx > 2) acc.fwd++;
                else if (dx < -2) acc.back++;
                acc.recv[p.role] = (acc.recv[p.role] ?? 0) + 1;
                if (acc.lines.length < 600 && i % 2 === 0) acc.lines.push([a.x, a.y, b.x, b.y]);
                kickFrom = null;
            }
            if (team !== ownerTeam) {
                if (team === T) {
                    acc.possessions++;
                    possStart = s.tick;
                } else possStart = null;
                ownerTeam = team;
            }
            lastOwner = own;
        }
        for (; ev < s.events.length; ev++) {
            const e = s.events[ev];
            if (e.type === 'shot' && s.players[e.by].team === T) {
                const r = toRel(s, T, s.players[e.by].pos);
                const d = Math.hypot(40 - r.x, 10 - r.y);
                acc.shots++;
                if (possStart !== null) {
                    acc.shotPoss++;
                    acc.shotPossTicks += s.tick - possStart;
                    possStart = null;
                }
                acc.shotDist += d;
                if (d > 14) acc.shotFar++;
                const role = s.players[e.by].role;
                acc.shotBy[role] = (acc.shotBy[role] ?? 0) + 1;
            }
        }
    }
    acc.games++;
    acc.goals += s.score[T];
    acc.against += s.score[1];
}

const accs = new Map(ids.map((f) => [f, blank()]));
const t0 = performance.now();
for (let i = 0; i < N; i++) for (const f of ids) play(accs.get(f)!, f, i);

const f1 = (n: number) => n.toFixed(1);
const pc = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;
console.log(
    `comportamento por formação: ${N} jogos cada contra o Losango, ${((performance.now() - t0) / 1000).toFixed(0)}s`,
);
console.log(
    '| Formação | Gols pró/contra | Linha atacando (m) | Linha defendendo (m) | Largura (m) | Passes/jogo | Passe médio (m) | Pra frente / trás | Passes por posse | Recebe Pivô/Ala/Fixo | Posse até o chute (s) · posses que viram chute | Trocas de posição/jogo | Chute: distância, de 14 m+ | Chutes Pivô/Ala/Fixo |',
);
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [f, a] of accs) {
    const g = a.games;
    const rv = a.recv;
    const rt = (rv.PIVO ?? 0) + (rv.ALA ?? 0) + (rv.FIXO ?? 0) + (rv.GK ?? 0);
    const sb = a.shotBy;
    console.log(
        `| ${f} | ${f1(a.goals / g)}/${f1(a.against / g)} | ${f1(a.atkX / a.atkN)} | ${f1(a.defX / a.defN)} | ${f1(a.atkWidth / a.atkN)} | ${Math.round(a.passes / g)} | ${f1(a.passLen / a.passes)} | ${pc(a.fwd, a.passes)} / ${pc(a.back, a.passes)} | ${f1(a.passes / a.possessions)} | ${pc(rv.PIVO ?? 0, rt)}/${pc(rv.ALA ?? 0, rt)}/${pc(rv.FIXO ?? 0, rt)} | ${f1(a.shotPossTicks / Math.max(1, a.shotPoss) / 20)} s · ${pc(a.shotPoss, a.possessions)} | ${f1(a.rotations / g)} | ${f1(a.shotDist / a.shots)} m, ${pc(a.shotFar, a.shots)} | ${pc(sb.PIVO ?? 0, a.shots)}/${pc(sb.ALA ?? 0, a.shots)}/${pc(sb.FIXO ?? 0, a.shots)} |`,
    );
}
if (OUT)
    writeFileSync(
        OUT,
        JSON.stringify(
            Object.fromEntries(
                [...accs].map(([f, a]) => [
                    f,
                    { heatAtk: a.heatAtk, heatDef: a.heatDef, lines: a.lines, gx: GX, gy: GY },
                ]),
            ),
        ),
    );
