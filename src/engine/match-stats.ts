import { FUTSAL_5 } from './config';
import type { MatchResult, PlayerSummary } from './runners/batch-runner';
import { type MatchSnapshot, type PlayerStats, SNAP_STRIDE } from './state';

/**
 * Estatísticas da partida a partir do que o motor já grava (eventos + snapshots a cada 2 ticks):
 * nota de cada jogador, distância percorrida, minutos, posse e perigo por período, mapa de chutes e destaques.
 * Tudo é derivado, então funciona para qualquer partida (inclusive as antigas).
 */
const PERIODS = 8; // 8 períodos de 5' (dois tempos de 20')
const HALF_MIN = FUTSAL_5.displayHalfMinutes;

export interface PlayerLine {
    uid: string;
    idx: number;
    team: 0 | 1;
    speciesId: number;
    name: string;
    role: string;
    stats: PlayerStats;
    rating: number;
    /** Metros percorridos. */
    distance: number;
    minutes: number;
    energy: number;
    goalsAgainst: number;
}

export type ShotOutcome = 'gol' | 'defesa' | 'trave' | 'fora' | 'bloqueado';
export interface ShotPoint {
    x: number;
    y: number;
    team: 0 | 1;
    outcome: ShotOutcome;
    name: string;
    minute: number;
    xg: number;
    move: boolean;
}

/** Minuto de jogo corrido (0..40) do snapshot. */
const clockMin = (s: MatchSnapshot) => Math.min(HALF_MIN * 2, s.minute);

function snapIndexAt(snaps: MatchSnapshot[], tick: number): number {
    let lo = 0;
    let hi = snaps.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (snaps[mid].tick <= tick) lo = mid;
        else hi = mid;
    }
    return lo;
}

/** Quem ocupou cada vaga e em que intervalo de ticks (trocas mudam o dono da vaga). */
function stints(m: MatchResult): { idx: number; uid: string; from: number; to: number }[] {
    const out: { idx: number; uid: string; from: number; to: number }[] = [];
    const end = m.snapshots.at(-1)?.tick ?? m.ticks;
    m.roster.forEach((p) => {
        let uid = p.uid;
        let from = 0;
        for (const e of m.events) {
            if (e.type === 'sub' && e.outIdx === p.idx) {
                out.push({ idx: p.idx, uid, from, to: e.tick });
                uid = e.inUid;
                from = e.tick;
            }
        }
        out.push({ idx: p.idx, uid, from, to: end });
    });
    return out;
}

/** Nota de 0 a 10 no estilo dos jogos de futebol (6 = partida normal). */
export function ratePlayer(s: PlayerStats, role: string, won: boolean | null, goalsAgainst: number): number {
    let r = 5.6;
    r += s.goals * 0.8 + s.assists * 0.5 + s.shotsOnTarget * 0.12;
    r += s.saves * 0.3 + s.tacklesWon * 0.12 + s.interceptions * 0.03 + s.movesUsed * 0.03;
    if (s.passes >= 5) r += (s.passesCompleted / s.passes - 0.8) * 2;
    if (role === 'GK') r -= goalsAgainst * 0.3;
    if (won === true) r += 0.3;
    if (won === false) r -= 0.3;
    return Math.round(Math.min(10, Math.max(3, r)) * 10) / 10;
}

export function playerLines(m: MatchResult): PlayerLine[] {
    const summaries: PlayerSummary[] = [...m.finalRoster, ...(m.subbedOut ?? [])];
    const byUid = new Map(summaries.map((p) => [p.uid, p]));
    const snaps = m.snapshots;
    const goals = m.events.filter((e) => e.type === 'goal');
    return stints(m)
        .map((st) => {
            const sum = byUid.get(st.uid);
            if (!sum) return null;
            // distância: soma dos deslocamentos entre snapshots enquanto ele esteve em campo
            let distance = 0;
            const o = st.idx * SNAP_STRIDE;
            for (let i = snapIndexAt(snaps, st.from) + 1; i < snaps.length && snaps[i].tick <= st.to; i++) {
                const a = snaps[i - 1].p;
                const b = snaps[i].p;
                const d = Math.hypot(b[o] - a[o], b[o + 1] - a[o + 1]);
                if (d < 3) distance += d; // ignora "teleportes" (saída de bola)
            }
            const first = snaps[snapIndexAt(snaps, st.from)];
            const last = snaps[snapIndexAt(snaps, st.to)];
            const minutes = Math.max(0, Math.round(clockMin(last) - clockMin(first)));
            const goalsAgainst = goals.filter(
                (g) => g.type === 'goal' && g.team !== sum.team && g.tick >= st.from && g.tick <= st.to,
            ).length;
            const won = m.winner === null ? null : m.winner === sum.team;
            return {
                uid: st.uid,
                idx: st.idx,
                team: sum.team,
                speciesId: sum.speciesId,
                name: sum.name,
                role: sum.role,
                stats: sum.stats,
                rating: ratePlayer(sum.stats, sum.role, won, goalsAgainst),
                distance: Math.round(distance),
                minutes,
                energy: sum.energy,
                goalsAgainst,
            } satisfies PlayerLine;
        })
        .filter((p): p is PlayerLine => p !== null);
}

/** Período (0..7) de um snapshot: 5' de jogo cada. */
const periodOf = (s: MatchSnapshot) => Math.min(PERIODS - 1, Math.floor(clockMin(s) / (HALF_MIN / 4)));

/** Posse por período (fração do seu time; o resto é do rival). */
export function possessionByPeriod(m: MatchResult): { home: number; away: number }[] {
    const count = Array.from({ length: PERIODS }, () => [0, 0]);
    for (const s of m.snapshots) {
        if (s.phase !== 'play' || s.owner < 0) continue;
        const team = m.roster[s.owner]?.team;
        if (team === undefined) continue;
        count[periodOf(s)][team]++;
    }
    return count.map(([h, a]) => ({ home: h + a ? h / (h + a) : 0.5, away: h + a ? a / (h + a) : 0.5 }));
}

/** Perigo por período: soma da chance de gol (xG) dos chutes de cada time. */
export function dangerByPeriod(m: MatchResult): { home: number; away: number; goals: [number, number] }[] {
    const out = Array.from({ length: PERIODS }, () => ({ home: 0, away: 0, goals: [0, 0] as [number, number] }));
    const snaps = m.snapshots;
    for (const e of m.events) {
        if (e.type !== 'shot' && e.type !== 'goal') continue;
        const s = snaps[snapIndexAt(snaps, e.tick)];
        const p = out[periodOf(s)];
        if (e.type === 'shot') {
            if (m.roster[e.by]?.team === 0) p.home += e.xg;
            else p.away += e.xg;
        } else p.goals[e.team]++;
    }
    return out;
}

/** Cada chute: de onde saiu e como terminou. */
export function shotMap(m: MatchResult, nameAt: (idx: number, tick: number) => string): ShotPoint[] {
    const snaps = m.snapshots;
    const shots: ShotPoint[] = [];
    m.events.forEach((e, i) => {
        if (e.type !== 'shot') return;
        const s = snaps[snapIndexAt(snaps, e.tick)];
        const o = e.by * SNAP_STRIDE;
        let outcome: ShotOutcome = 'fora';
        for (let j = i + 1; j < m.events.length; j++) {
            const n = m.events[j];
            if (n.tick - e.tick > 80 || n.type === 'shot') break;
            if (n.type === 'goal') {
                outcome = 'gol';
                break;
            }
            if (n.type === 'save' && n.shooter === e.by) {
                outcome = 'defesa';
                break;
            }
            if (n.type === 'post' && n.shooter === e.by) {
                outcome = 'trave';
                break;
            }
            if (n.type === 'block' && n.shooter === e.by) {
                outcome = 'bloqueado';
                break;
            }
            if (n.type === 'wide' && n.shooter === e.by) break;
        }
        shots.push({
            x: s.p[o],
            y: s.p[o + 1],
            team: m.roster[e.by]?.team ?? 0,
            outcome,
            name: nameAt(e.by, e.tick),
            minute: Math.floor(clockMin(s)),
            xg: e.xg,
            move: e.moveId !== null,
        });
    });
    return shots;
}

export type LeaderId = 'rating' | 'scorer' | 'runner' | 'passer' | 'tackler' | 'keeper';

export interface Leader {
    /** Id estável para a tela traduzir o título e o valor. */
    id: LeaderId;
    title: string;
    line: PlayerLine;
    value: string;
}

/** Quem mais fez cada coisa (dos dois times). */
export function leaders(lines: PlayerLine[]): Leader[] {
    const best = (score: (p: PlayerLine) => number, filter: (p: PlayerLine) => boolean = () => true) => {
        const list = lines.filter(filter);
        return list.length ? list.reduce((a, b) => (score(b) > score(a) ? b : a)) : null;
    };
    const out: Leader[] = [];
    const push = (
        id: LeaderId,
        title: string,
        p: PlayerLine | null,
        value: (p: PlayerLine) => string,
        min = 0,
        sc?: number,
    ) => {
        if (p && (sc ?? 1) > min) out.push({ id, title, line: p, value: value(p) });
    };
    const top = best((p) => p.rating);
    push('rating', 'Melhor nota', top, (p) => p.rating.toFixed(1));
    const scorer = best((p) => p.stats.goals * 10 + p.stats.assists);
    push(
        'scorer',
        'Artilheiro',
        scorer,
        (p) => `${p.stats.goals} gol${p.stats.goals === 1 ? '' : 's'}`,
        0,
        scorer?.stats.goals,
    );
    const runner = best((p) => p.distance);
    push('runner', 'Mais correu', runner, (p) => `${p.distance} m`);
    const passer = best((p) => p.stats.passesCompleted);
    push('passer', 'Mais passes certos', passer, (p) => `${p.stats.passesCompleted}`);
    const tackler = best((p) => p.stats.tacklesWon + p.stats.interceptions * 0.5);
    push(
        'tackler',
        'Mais roubadas',
        tackler,
        (p) =>
            `${p.stats.tacklesWon} desarme${p.stats.tacklesWon === 1 ? '' : 's'} · ${p.stats.interceptions} intercep.`,
    );
    const keeper = best(
        (p) => p.stats.saves,
        (p) => p.role === 'GK',
    );
    push(
        'keeper',
        'Paredão',
        keeper,
        (p) => `${p.stats.saves} defesa${p.stats.saves === 1 ? '' : 's'}`,
        0,
        keeper?.stats.saves,
    );
    return out;
}

export function teamTotals(lines: PlayerLine[], team: 0 | 1) {
    const t = lines.filter((p) => p.team === team);
    const sum = (k: keyof PlayerStats) => t.reduce((s, p) => s + p.stats[k], 0);
    return {
        shots: sum('shots'),
        shotsOnTarget: sum('shotsOnTarget'),
        passes: sum('passes'),
        passesCompleted: sum('passesCompleted'),
        tacklesWon: sum('tacklesWon'),
        tackles: sum('tackles'),
        interceptions: sum('interceptions'),
        saves: sum('saves'),
        movesUsed: sum('movesUsed'),
        distance: t.reduce((s, p) => s + p.distance, 0),
    };
}
