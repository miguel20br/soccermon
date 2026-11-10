/**
 * Quem recebe passe na armação (bug report 10/11/2026: "nunca tocam no fixo na armação"). Time A em cada formação
 * contra B em formação sorteada; conta passes CERTOS do time A por posição de quem recebe, na armação (quem passa
 * está no nosso campo, x < 20 m, e sem marcador colado, pressão < 0,5) e no total. Também: % das armações (posse que
 * passa pelo nosso campo) em que o fixo toca na bola, e gols/jogo.
 *
 * Uso: npx tsx scripts/balance/fixo-armacao.ts [N=60] [--cap-fixo]
 *   --cap-fixo: o capitão do time A é o fixo (o primeiro da formação, se houver mais de um).
 *   --chamado: o capitão do time A fica chamado o jogo todo (pior caso do jogador que chama e esquece).
 *   --agencia: os dois times com o técnico IA da beira da quadra (chama o capitão, como no jogo).
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { aiDraftTeam } from '../../src/engine/draft';
import { FORMATIONS, type FormationId, formationOf } from '../../src/engine/formations';
import { toRel } from '../../src/engine/match';
import { COACH_LEADERS } from '../../src/engine/rival-coach';
import { Rng } from '../../src/engine/rng';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchState, TeamSetup } from '../../src/engine/state';
import type { Vec2 } from '../../src/engine/vec';

const N = Number(process.argv[2]) || 60;
const CAP_FIXO = process.argv.includes('--cap-fixo');
const AGENCIA = process.argv.includes('--agencia');
const CHAMADO = process.argv.includes('--chamado');
const ids = Object.keys(FORMATIONS) as FormationId[];
const ROLES = ['GK', 'FIXO', 'ALA', 'PIVO'] as const;
type Role = (typeof ROLES)[number];

const blank = () => ({
    games: 0,
    goals: 0,
    against: 0,
    wins: 0,
    shots: 0,
    passes: 0,
    build: { GK: 0, FIXO: 0, ALA: 0, PIVO: 0 } as Record<Role, number>,
    all: { GK: 0, FIXO: 0, ALA: 0, PIVO: 0 } as Record<Role, number>,
    buildPoss: 0,
    buildPossFixo: 0,
    capTicks: 0,
    ticks: 0,
});
type Acc = ReturnType<typeof blank>;

function pressure(s: MatchState, at: Vec2, team: 0 | 1) {
    let c = Infinity;
    for (const o of s.players) if (o.team !== team) c = Math.min(c, Math.hypot(o.pos.x - at.x, o.pos.y - at.y));
    return Math.min(1, Math.max(0, 1 - (c - 0.8) / 3));
}

function play(acc: Acc, f: FormationId, i: number) {
    const fb = ids[i % ids.length];
    const draftA = aiDraftTeam(new Rng(`fx-${i}`, 'A'), 1, [], f);
    if (CAP_FIXO) {
        const k = formationOf(f).slots.indexOf('FIXO');
        if (k >= 0) draftA.captainUid = draftA.lineup[k].uid;
    }
    const home: TeamSetup = { name: 'A', ...draftA, tactic: 'balanced', color: 0, formation: f };
    const away: TeamSetup = {
        name: 'B',
        ...aiDraftTeam(new Rng(`fx-${i}`, 'B'), 1, [], fb),
        tactic: 'balanced',
        color: 0,
        formation: fb,
    };
    if (AGENCIA) {
        home.coach = COACH_LEADERS[i % COACH_LEADERS.length];
        away.coach = COACH_LEADERS[(i + 3) % COACH_LEADERS.length];
    }
    const run = new LiveRunner(FUTSAL_5, home, away, `fx-${i}-${f}`);
    const s: MatchState = run.state;
    const T = 0 as const;
    let lastOwner: number | null = null;
    let ownerTeam: 0 | 1 | null = null;
    let kick: { by: number; build: boolean } | null = null;
    let lastKickTick = -1;
    let inBuild = false; // posse atual nossa já passou pelo nosso campo
    let fixoTouched = false;
    const closePoss = () => {
        if (ownerTeam === T && inBuild) {
            acc.buildPoss++;
            if (fixoTouched) acc.buildPossFixo++;
        }
        inBuild = false;
        fixoTouched = false;
    };
    while (!run.finished) {
        if (CHAMADO && s.phase === 'play' && !s.teams[T].agency.max) {
            const cap = s.players.find((p) => p.team === T && p.captain);
            if (cap) s.teams[T].agency.max = { idx: cap.idx, level: 1, q: 2 };
        }
        run.step();
        if (s.phase !== 'play') continue;
        acc.ticks++;
        if (s.teams[T].agency.max) acc.capTicks++;
        const lk = s.ball.lastKick;
        if (lk && lk.tick !== lastKickTick) {
            lastKickTick = lk.tick;
            const by = s.players[lk.by];
            kick =
                lk.kind === 'pass' && by.team === T
                    ? { by: lk.by, build: toRel(s, T, by.pos).x < 20 && pressure(s, by.pos, T) < 0.5 }
                    : null;
        }
        const own = s.ball.owner;
        if (own === null || own === lastOwner) continue;
        const p = s.players[own];
        if (p.team !== ownerTeam) {
            closePoss();
            ownerTeam = p.team;
        }
        if (p.team === T) {
            if (toRel(s, T, p.pos).x < 20) inBuild = true;
            if (p.role === 'FIXO' && inBuild) fixoTouched = true;
            if (kick && kick.by !== own) {
                acc.all[p.role as Role]++;
                if (kick.build) acc.build[p.role as Role]++;
            }
        }
        kick = null;
        lastOwner = own;
    }
    closePoss();
    for (const e of s.events) {
        if (e.type === 'shot' && s.players[e.by].team === T) acc.shots++;
        if (e.type === 'pass' && s.players[e.by].team === T) acc.passes++;
    }
    acc.games++;
    acc.goals += s.score[T];
    acc.against += s.score[1];
    if (s.score[T] > s.score[1]) acc.wins++;
}

const accs = new Map(ids.map((f) => [f, blank()]));
const t0 = performance.now();
for (let i = 0; i < N; i++) for (const f of ids) play(accs.get(f)!, f, i);

const pc = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;
const f1 = (n: number) => n.toFixed(1).replace('.', ',');
const sum = (r: Record<Role, number>) => ROLES.reduce((a, k) => a + r[k], 0);
console.log(
    `fixo na armação: ${N} jogos por formação${CAP_FIXO ? ' (capitão = fixo)' : ''}${AGENCIA ? ' (com técnico)' : ''}${CHAMADO ? ' (capitão chamado sempre)' : ''}, ${((performance.now() - t0) / 1000).toFixed(0)}s`,
);
console.log(
    '| Formação | Vagas de fixo | Armação: GK/Fixo/Ala/Pivô (passes) | Armação: fixo por vaga | Total: Fixo/Ala/Pivô | Armações em que o fixo toca | Gols pró/contra | Vitória | Chutes/jogo | Passes/jogo | Capitão chamado (% do tempo) |',
);
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [f, a] of accs) {
    const nb = sum(a.build);
    const na = sum(a.all);
    const slots = formationOf(f).slots;
    const nFixo = slots.filter((r) => r === 'FIXO').length;
    const per = nFixo ? pc(a.build.FIXO / nFixo, nb) : '—';
    console.log(
        `| ${f} | ${nFixo} | ${pc(a.build.GK, nb)}/${pc(a.build.FIXO, nb)}/${pc(a.build.ALA, nb)}/${pc(a.build.PIVO, nb)} (${f1(nb / a.games)}/jogo) | ${per} | ${pc(a.all.FIXO, na)}/${pc(a.all.ALA, na)}/${pc(a.all.PIVO, na)} | ${pc(a.buildPossFixo, a.buildPoss)} | ${f1(a.goals / a.games)}/${f1(a.against / a.games)} | ${pc(a.wins, a.games)} | ${f1(a.shots / a.games)} | ${Math.round(a.passes / a.games)} | ${((100 * a.capTicks) / Math.max(1, a.ticks)).toFixed(1)}% |`,
    );
}
