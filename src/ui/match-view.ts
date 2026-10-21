import { maxCue } from '../engine/agency';
import type { Position } from '../engine/attributes';
import { FUTSAL_5 } from '../engine/config';
import { evolveInstance } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent, MatchSnapshot, PlayerStats, TeamSetup } from '../engine/state';

/**
 * Leitura da partida num tick a partir do resultado já simulado (eventos + snapshots): quem está em cada vaga,
 * o que fez até ali, fôlego e status. Usado pelo painel do Pokémon e pelo painel do time na partida.
 */

/** Status no snapshot (STATUS_CODE em state.ts) em uma palavra. */
export const STATUS_SHORT: Record<number, string> = {
    1: 'Paralisado',
    2: 'Dormindo',
    3: 'Envenenado',
    4: 'Queimado',
    5: 'Congelado',
    6: 'Confuso',
    7: 'Apaixonado',
};

/**
 * Hora do golpe máximo em algum quadro de `from` a `to` (pelos snapshots). O botão usa só o quadro da tela; a quadra
 * olha um pouco à frente pra entrar em câmera lenta antes (a hora certa dura ~0,4 s de jogo: o capitão chuta logo).
 */
export function maxCueNear(
    snaps: MatchSnapshot[],
    from: number,
    to: number,
    team: 0 | 1,
    capIdx: number,
    capGk: boolean,
): boolean {
    if (!snaps.length) return false;
    const { pitch, teamSize, snapshotEvery } = FUTSAL_5;
    for (let t = from; t <= to; t += snapshotEvery)
        if (maxCue(snapAt(snaps, t), team, capIdx, capGk, pitch, teamSize)) return true;
    return false;
}

export function snapAt(snaps: MatchSnapshot[], tick: number): MatchSnapshot {
    let lo = 0;
    let hi = snaps.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (snaps[mid].tick <= tick) lo = mid;
        else hi = mid;
    }
    return snaps[lo];
}

/**
 * O que o placar mostra no `tick` além do minuto: os acréscimos do tempo `half` (minutos, 0 = tempo normal) e o time
 * na Pressão final (o último aviso `pressure` do motor; acaba no apito final).
 */
export function clockExtrasAt(
    events: readonly MatchEvent[],
    tick: number,
    half: number,
): { added: number; pressure: 0 | 1 | null } {
    let added = 0;
    let pressure: 0 | 1 | null = null;
    for (const e of events) {
        if (e.tick > tick) break;
        if (e.type === 'stoppage' && e.half === half) added = e.minutes;
        else if (e.type === 'pressure') pressure = e.team;
        else if (e.type === 'fulltime') pressure = null;
    }
    return { added, pressure };
}

/**
 * Fim do intervalo (o 2º tempo já está armado pra saída de bola): o "Começar o 2º tempo" pula pra cá, senão a
 * reprodução ainda passava ~2 s de jogo parado com "Intervalo" no placar e quem saiu na prancheta.
 */
export function halftimeEnd(snaps: MatchSnapshot[], htTick: number): number {
    return snaps.find((s) => s.tick > htTick && s.phase !== 'halftime')?.tick ?? htTick;
}

/**
 * Prancheta do time no tick: a formação e o jogador (`idx` da partida) em cada vaga, na ordem das vagas. Muda com a
 * mudança de prancheta (evento `lineup`); antes dela, a escalação inicial.
 */
export function boardAt(
    m: MatchResult,
    setups: [TeamSetup, TeamSetup],
    team: 0 | 1,
    tick: number,
): { formation: FormationId; idx: number[] } {
    let formation = setups[team].formation ?? DEFAULT_FORMATION;
    let idx = m.roster.filter((r) => r.team === team).map((r) => r.idx);
    for (const e of m.events) {
        if (e.tick > tick) continue;
        if (e.type === 'lineup' && e.team === team) {
            formation = e.formation;
            idx = e.idx;
        }
    }
    return { formation, idx };
}

/** Posição de quem está na vaga `idx` no tick (pela prancheta de agora). */
export function roleAt(m: MatchResult, setups: [TeamSetup, TeamSetup], idx: number, tick: number): Position {
    const b = boardAt(m, setups, m.roster[idx].team, tick);
    return formationOf(b.formation).slots[b.idx.indexOf(idx)] ?? (m.roster[idx].role as Position);
}

/** Quem está na vaga `idx` no tick, com a forma atual (trocas, evoluções e Transformar do Ditto até ali). */
export function whoAt(m: MatchResult, setups: [TeamSetup, TeamSetup], idx: number, tick: number) {
    const team = m.roster[idx].team;
    let uid = m.roster[idx].uid;
    let since = 0;
    for (const e of m.events) {
        if (e.tick > tick) continue;
        if (e.type === 'sub' && e.outIdx === idx) {
            uid = e.inUid;
            since = e.tick;
        }
    }
    const setup = setups[team];
    let inst: PokemonInstance | undefined = [...setup.lineup, ...setup.bench].find((p) => p.uid === uid);
    let evolved = false;
    let transformed = false;
    for (const e of m.events) {
        if (e.tick > tick) continue;
        if (e.type === 'evolve' && e.uid === uid && inst) {
            inst = evolveInstance(inst, e.into, e.role);
            evolved = true;
        }
        // Ditto (Transformar): mesma espécie, nível, golpes e habilidade de quem ele copiou naquele momento
        // (match.ts: transformDittos já manda esse evento, só faltava a carta ouvir)
        if (e.type === 'transform' && e.by === idx && e.tick >= since && inst) {
            const copied = whoAt(m, setups, e.target, e.tick).inst;
            if (copied) {
                inst = {
                    ...inst,
                    speciesId: copied.speciesId,
                    level: copied.level,
                    moves: [...copied.moves],
                    ability: copied.ability,
                };
                transformed = true;
            }
        }
    }
    return { team, inst, since, evolved, transformed, role: roleAt(m, setups, idx, tick) };
}

/**
 * Capitão do time no tick: a espécie de agora (evoluiu na partida = a forma nova, a cara dos emotes) e a vaga dele
 * em quadra (`idx` da partida; null = saiu numa troca ou ainda está no banco).
 */
export function captainAt(m: MatchResult, setups: [TeamSetup, TeamSetup], team: 0 | 1, tick: number) {
    const setup = setups[team];
    const uid = setup.captainUid ?? setup.lineup[0]?.uid;
    const inst = [...setup.lineup, ...setup.bench].find((p) => p.uid === uid);
    let idx: number | null = m.roster.findIndex((r) => r.team === team && r.uid === uid);
    if (idx < 0) idx = null;
    let speciesId = inst?.speciesId ?? 0;
    for (const e of m.events) {
        if (e.tick > tick) continue;
        if (e.type === 'sub' && e.team === team && e.outUid === uid) idx = null;
        if (e.type === 'sub' && e.team === team && e.inUid === uid) idx = e.outIdx;
        if (e.type === 'evolve' && e.uid === uid) speciesId = e.into;
    }
    return { uid, idx, speciesId };
}

/** Escalação do time no tick (trocas e evoluções até ali): é por ela que o motor conta sinergias e capitão. */
export function lineupAt(m: MatchResult, setups: [TeamSetup, TeamSetup], team: 0 | 1, tick: number) {
    return m.roster.flatMap((r, idx) => (r.team === team ? (whoAt(m, setups, idx, tick).inst ?? []) : []));
}

/** O que ele fez desde que entrou em campo até o tick (pelos eventos da partida). */
export function statsUntil(m: MatchResult, idx: number, from: number, tick: number) {
    const s: PlayerStats = {
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passesCompleted: 0,
        tackles: 0,
        tacklesWon: 0,
        interceptions: 0,
        saves: 0,
        movesUsed: 0,
    };
    const used = new Map<string, number>();
    let wide = 0;
    for (const e of m.events) {
        if (e.tick > tick) continue;
        if (e.tick < from) continue;
        if (e.type === 'goal' && e.by === idx && !e.ownGoal) s.goals++;
        if (e.type === 'goal' && e.assist === idx) s.assists++;
        if (e.type === 'shot' && e.by === idx) s.shots++;
        if (e.type === 'wide' && e.shooter === idx) wide++;
        if (e.type === 'pass' && e.by === idx) s.passes++;
        if (e.type === 'tackle' && e.by === idx) {
            s.tackles++;
            if (e.success) s.tacklesWon++;
        }
        if (e.type === 'interception' && e.by === idx) s.interceptions++;
        if (e.type === 'save' && e.by === idx) s.saves++;
        if (e.type === 'move' && e.by === idx) {
            s.movesUsed++;
            used.set(e.moveId, (used.get(e.moveId) ?? 0) + 1);
        }
    }
    // os eventos não dizem se o passe chegou: estimativa pela média do jogo
    s.passesCompleted = Math.round(s.passes * 0.85);
    s.shotsOnTarget = Math.max(0, s.shots - wide);
    return { stats: s, used };
}

/** Colunas da barra de pressão: uma a cada 2' (dois tempos de 20'). */
export const PRESSURE_BINS = 20;

export interface PressureBin {
    /** Chance de gol (xG) somada dos chutes de cada time na coluna. */
    xg: [number, number];
    goals: [number, number];
}

/**
 * Barra de pressão do placar: o perigo (xG dos chutes) de cada time a cada 2'. Só conta o que já passou na tela
 * (`tick`): a partida da copa vem calculada inteira e a barra não pode contar o futuro.
 */
export function pressureUntil(m: MatchResult, tick: number, bins = PRESSURE_BINS): PressureBin[] {
    const out = Array.from({ length: bins }, () => ({ xg: [0, 0], goals: [0, 0] }) as PressureBin);
    const total = FUTSAL_5.displayHalfMinutes * 2;
    const binOf = (minute: number) => Math.min(bins - 1, Math.max(0, Math.floor((minute / total) * bins)));
    for (const e of m.events) {
        if (e.tick > tick) continue;
        // pênaltis depois do apito final não são pressão de jogo
        if (e.type === 'fulltime') break;
        if (e.type === 'shot') {
            const team = m.roster[e.by]?.team;
            if (team !== undefined) out[binOf(e.minute)].xg[team] += e.xg;
        } else if (e.type === 'goal') out[binOf(e.minute)].goals[e.team]++;
    }
    return out;
}
