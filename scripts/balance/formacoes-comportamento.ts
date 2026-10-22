/**
 * Como cada formação JOGA (docs/planos/formacoes.md, etapa 2): o mesmo rival (Losango, Equilibrado) contra cada
 * formação, olhando só o time da formação. Uma métrica por identidade:
 *   Losango   → tabelas e triângulos (a bola volta pra quem passou 2 ou 3 toques antes), passe curto
 *   Quadrado  → bola recebida pelos lados (5 m da lateral), largura
 *   Linha de 3→ posses que passam pelo pivô e paredes (pivô recebe e devolve pra trás)
 *   Rodízio   → troca de quem é o último homem (o mais recuado da linha fica 1 s), por minuto com a bola
 *   Dois pivôs→ passe longo pra frente (10 m+) e tempo da recuperação ao chute
 *   Ferrolho  → altura e largura do bloco sem a bola, chutes sofridos
 * Grava os mapas e uma amostra de passes em JSON pra desenhar (formacoes-desenho.ts).
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
import type { MatchState, TeamSetup } from '../../src/engine/state';
import type { Vec2 } from '../../src/engine/vec';

const N = Number(process.argv[2]) || 60;
const OUT = process.argv[3] ?? null;
const ids = Object.keys(FORMATIONS) as FormationId[];
const GX = 10; // mapa de calor: 10 × 5 casas na quadra de 40 × 20 (x = rumo ao ataque)
const GY = 5;

const blank = () => ({
    games: 0,
    goals: 0,
    against: 0,
    shotsAgainst: 0,
    heatAtk: Array(GX * GY).fill(0) as number[],
    heatDef: Array(GX * GY).fill(0) as number[],
    atkWidth: 0,
    atkN: 0,
    defX: 0,
    defWidth: 0,
    defN: 0,
    passes: 0,
    passLen: 0,
    short: 0,
    longFwd: 0,
    wide: 0,
    combos: 0,
    possessions: 0,
    pivotPoss: 0,
    walls: 0,
    shotsAfterPivot: 0,
    shots: 0,
    swaps: 0,
    atkTicks: 0,
    shotPoss: 0,
    shotPossTicks: 0,
    lines: [] as [number, number, number, number][],
});
type Acc = ReturnType<typeof blank>;

const cell = (r: Vec2) => {
    const cx = Math.min(GX - 1, Math.max(0, Math.floor((r.x / 40) * GX)));
    const cy = Math.min(GY - 1, Math.max(0, Math.floor((r.y / 20) * GY)));
    return cy * GX + cx;
};
const spread = (ys: number[]) => {
    const m = ys.reduce((a, b) => a + b, 0) / ys.length;
    return Math.sqrt(ys.reduce((a, b) => a + (b - m) ** 2, 0) / ys.length);
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
    let lastOwner: number | null = null;
    let ownerTeam: 0 | 1 | null = null;
    let kickFrom: { by: number; at: Vec2; tick: number } | null = null;
    let lastKickTick = -1;
    let possStart: number | null = null; // posse nossa em andamento, sem chute ainda
    let chain: number[] = []; // quem teve a bola nesta posse, em ordem
    let pivotTouched = false;
    let pivotGot = -1; // tick em que o pivô recebeu um passe
    let lastPass: { by: number; tick: number } | null = null; // último passe certo nosso
    let lastMan: number | null = null;
    let manTry: { idx: number; t: number } | null = null;
    let ev = 0;
    while (!run.finished) {
        run.step();
        if (s.phase !== 'play') continue;
        const own = s.ball.owner;
        const team = own !== null ? s.players[own].team : null;
        const attacking = team === T;
        const fp = s.players.filter((p) => p.team === T && p.role !== 'GK');
        if (s.tick % 5 === 0 && team !== null) {
            const rs = fp.map((p) => toRel(s, T, p.pos));
            for (const r of rs) (attacking ? acc.heatAtk : acc.heatDef)[cell(r)]++;
            const w = spread(rs.map((r) => r.y));
            if (attacking) {
                acc.atkWidth += w;
                acc.atkN++;
            } else {
                acc.defX += rs.reduce((a, r) => a + r.x, 0) / rs.length;
                acc.defWidth += w;
                acc.defN++;
            }
        }
        // rodízio: atacando, quem é o último homem (o mais recuado da linha) muda; conta quando o novo fica 1 s
        if (attacking) {
            acc.atkTicks++;
            let deep = fp[0];
            for (const p of fp) if (toRel(s, T, p.pos).x < toRel(s, T, deep.pos).x) deep = p;
            if (lastMan === null) lastMan = deep.idx;
            else if (deep.idx === lastMan) manTry = null;
            else if (manTry?.idx === deep.idx) {
                if (++manTry.t >= 20) {
                    lastMan = deep.idx;
                    manTry = null;
                    acc.swaps++;
                }
            } else manTry = { idx: deep.idx, t: 1 };
        }
        const lk = s.ball.lastKick;
        if (lk && lk.tick !== lastKickTick) {
            lastKickTick = lk.tick;
            kickFrom =
                lk.kind === 'pass' && s.players[lk.by].team === T
                    ? { by: lk.by, at: { ...s.players[lk.by].pos }, tick: s.tick }
                    : null;
        }
        if (own !== null && own !== lastOwner) {
            if (team !== ownerTeam) {
                if (ownerTeam === T && pivotTouched) acc.pivotPoss++;
                chain = [];
                pivotTouched = false;
                if (team === T) {
                    acc.possessions++;
                    possStart = s.tick;
                } else possStart = null;
                ownerTeam = team;
            }
            const p = s.players[own];
            if (team === T && kickFrom && kickFrom.by !== own && s.players[kickFrom.by].team === T) {
                const a = toRel(s, T, kickFrom.at);
                const b = toRel(s, T, p.pos);
                const dx = b.x - a.x;
                const len = Math.hypot(dx, b.y - a.y);
                acc.passes++;
                acc.passLen += len;
                if (len < 7) acc.short++;
                if (dx >= 10) acc.longFwd++;
                if (b.y < 5 || b.y > 15) acc.wide++;
                // tabela (a bola volta pra quem passou) ou triângulo (volta depois de um terceiro)
                const n = chain.length;
                if ((n >= 2 && chain[n - 2] === own) || (n >= 3 && chain[n - 3] === own)) acc.combos++;
                const passer = s.players[kickFrom.by];
                if (passer.role === 'PIVO' && dx < -1 && kickFrom.tick - pivotGot < 60) acc.walls++;
                if (p.role === 'PIVO') {
                    pivotTouched = true;
                    pivotGot = s.tick;
                }
                if (acc.lines.length < 600 && i % 2 === 0) acc.lines.push([a.x, a.y, b.x, b.y]);
                lastPass = { by: kickFrom.by, tick: s.tick };
                kickFrom = null;
            }
            if (team === T && chain[chain.length - 1] !== own) chain.push(own);
            lastOwner = own;
        }
        for (; ev < s.events.length; ev++) {
            const e = s.events[ev];
            if (e.type !== 'shot') continue;
            if (s.players[e.by].team !== T) {
                acc.shotsAgainst++;
                continue;
            }
            acc.shots++;
            const lp = lastPass;
            if (lp && s.players[lp.by].role === 'PIVO' && lp.by !== e.by && s.tick - lp.tick < 60)
                acc.shotsAfterPivot++;
            if (possStart !== null) {
                acc.shotPoss++;
                acc.shotPossTicks += s.tick - possStart;
                possStart = null;
            }
        }
    }
    if (ownerTeam === T && pivotTouched) acc.pivotPoss++;
    acc.games++;
    acc.goals += s.score[T];
    acc.against += s.score[1];
}

const accs = new Map(ids.map((f) => [f, blank()]));
const t0 = performance.now();
for (let i = 0; i < N; i++) for (const f of ids) play(accs.get(f)!, f, i);

const f1 = (n: number) => n.toFixed(1).replace('.', ',');
const pc = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;
console.log(
    `comportamento por formação: ${N} jogos cada contra o Losango, ${((performance.now() - t0) / 1000).toFixed(0)}s`,
);
console.log(
    '| Formação | Gols pró/contra | Passes/jogo | Passe médio | Curtos (<7 m) | Tabelas e triângulos/jogo | Recebe pelos lados | Largura c/ bola | Posses pelo pivô | Paredes/jogo · chutes de passe do pivô | Troca do último homem (por min c/ bola) | Longos pra frente | Recuperação→chute | Bloco sem a bola (altura, largura) | Chutes sofridos |',
);
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [f, a] of accs) {
    const g = a.games;
    console.log(
        `| ${f} | ${f1(a.goals / g)}/${f1(a.against / g)} | ${Math.round(a.passes / g)} | ${f1(a.passLen / a.passes)} m | ${pc(a.short, a.passes)} | ${f1(a.combos / g)} | ${pc(a.wide, a.passes)} | ${f1(a.atkWidth / a.atkN)} m | ${pc(a.pivotPoss, a.possessions)} | ${f1(a.walls / g)} · ${pc(a.shotsAfterPivot, a.shots)} | ${f1(a.swaps / (a.atkTicks / 1200))} | ${pc(a.longFwd, a.passes)} | ${f1(a.shotPossTicks / Math.max(1, a.shotPoss) / 20)} s | ${f1(a.defX / a.defN)} m, ${f1(a.defWidth / a.defN)} m | ${f1(a.shotsAgainst / g)} |`,
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
