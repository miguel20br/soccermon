import { bicudaCueNear, inMaxZone, maxCallCue, maxCharge, maxCue } from '../engine/agency';
import type { Position } from '../engine/attributes';
import { FUTSAL_5 } from '../engine/config';
import { species } from '../engine/data';
import { evolveInstance } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import { cardAttributes } from '../engine/modifiers';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent, MatchSnapshot, PlayerStats, TeamSetup } from '../engine/state';
import { Action, SNAP_STRIDE } from '../engine/state';
import { dir8 } from '../engine/vec';

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
 * O botão do golpe máximo fica aceso esse tanto depois da hora certa passar (0,3 s de jogo, ~1,2 s na câmera lenta): o
 * capitão entra e sai da zona driblando e o botão piscava. Tocou nesse resto, a ordem fica armada (até o próximo chute da
 * zona, motor 19) e a bola procura o capitão.
 */
export const MAX_CUE_LATCH = 6;
/**
 * E acende esse tanto antes da hora certa (0,3 s de jogo): o toque um pouco cedo, já na câmera lenta, não se perde. O
 * motor deixa a ordem armada (até o chute, motor 19) e o golpe sai no próximo chute ou defesa da zona; a ordem leva o
 * tick do toque, então a partida continua a mesma em todo lugar.
 */
export const MAX_CUE_EARLY = 6;

/**
 * Hora do golpe máximo em algum quadro de `from` a `to` (pelos snapshots; a bicuda, pelos eventos). O botão usa só o quadro da tela; a quadra
 * olha um pouco à frente pra entrar em câmera lenta antes (a hora certa dura ~0,4 s de jogo: o capitão chuta logo).
 */
export function maxCueNear(
    snaps: MatchSnapshot[],
    events: readonly MatchEvent[],
    from: number,
    to: number,
    team: 0 | 1,
    capIdx: number,
    capRole: Position,
): boolean {
    if (capRole === 'GK') {
        // a bicuda não tem o resto (`MAX_CUE_LATCH`, os dois chamadores passam `tick - MAX_CUE_LATCH`): apaga no toque
        // do goleiro na bola, que é quando o toque na tela deixa de valer
        const at = from + MAX_CUE_LATCH;
        if (!bicudaCueNear(events, at, to, capIdx)) return false;
        if (bicudaCueNear(events, at, at, capIdx)) return true;
        // antes do chute, o motor só arma a bicuda com o rival com a bola na zona do goleiro (`startMax`): fora dela o
        // botão aceso engolia o toque (o anel fechava antes do chute de longe e nada saía)
        if (!snaps.length) return false;
        const snap = snapAt(snaps, at);
        const rival = (1 - team) as 0 | 1;
        const o = snap.owner;
        if (snap.phase !== 'play' || o < 0 || (o < FUTSAL_5.teamSize ? 0 : 1) !== rival) return false;
        return inMaxZone(snap.p[o * SNAP_STRIDE], snap.p[o * SNAP_STRIDE + 1], rival, FUTSAL_5.pitch, 'GK');
    }
    if (!snaps.length) return false;
    const { pitch, snapshotEvery } = FUTSAL_5;
    for (let t = from; t <= to; t += snapshotEvery)
        if (maxCue(snapAt(snaps, t), team, capIdx, capRole, pitch)) return true;
    return false;
}

/**
 * Tick em que vale a ordem do golpe máximo da Copa: o snapshot seguinte ao quadro da tela (`snapshotEvery`). A ordem do
 * tick T vale no começo dele, com o estado do snapshot T: com o capitão de linha com a bola na zona nesse snapshot, a
 * IA chuta no mesmo tick (`AIController.carrier`) e o golpe sai em T+1. Olhar o quadro exato é o que deixa o botão
 * aceso só com o chute certo (Miguel, 02/11/2026: "a bola já não tava mais no pé do meu capitão").
 */
/**
 * Golpe máximo de qualquer time saindo de `tick` a `tick + lead` (os ticks dos eventos `max` com `phase: 'hit'`): a
 * câmera lenta chegando. Era só do seu (vinha do botão aceso); o do rival chegava em 8x e só desacelerava depois do
 * chute (Miguel, 08/11/2026: "o golpe especial do inimigo também tem que ficar em câmera lenta").
 */
export const maxHitAhead = (events: readonly MatchEvent[], tick: number, lead: number) =>
    events.some((e) => e.type === 'max' && e.phase === 'hit' && e.tick >= tick && e.tick - tick <= lead);

export const maxOrderTick = (tick: number) => Math.ceil(tick / FUTSAL_5.snapshotEvery) * FUTSAL_5.snapshotEvery;

/** Chute certo do capitão de linha `capIdx` com a ordem no `maxOrderTick(tick)`: a bola no pé dele na zona nesse snapshot. */
export function maxCertain(snaps: MatchSnapshot[], tick: number, team: 0 | 1, capIdx: number, capRole: Position) {
    const at = maxOrderTick(tick);
    const snap = snaps.length ? snapAt(snaps, at) : null;
    return !!snap && snap.tick === at && maxCue(snap, team, capIdx, capRole, FUTSAL_5.pitch);
}

/** O passe no ar não apaga o "chamar o capitão": vale o último dono da bola nesse tanto de ticks (2 s). */
export const MAX_CALL_LATCH = 40;

/** `maxCallCue` no tick, com a bola no ar valendo o último dono (senão o botão piscava e a música bombeava a cada passe). */
export function maxCallCueNear(snaps: MatchSnapshot[], tick: number, team: 0 | 1, capRole: Position): boolean {
    const { pitch, teamSize, snapshotEvery } = FUTSAL_5;
    for (let t = tick; t >= tick - MAX_CALL_LATCH; t -= snapshotEvery) {
        const snap = snapAt(snaps, t);
        if (snap.phase !== 'play') return false;
        if (snap.owner >= 0) return maxCallCue(snap, team, capRole, pitch, teamSize);
    }
    return false;
}

/**
 * "Esperar" no golpe máximo (só tela): o nível da barra em que o jogador mandou esperar. Vale enquanto devolver o mesmo
 * objeto: no N1 e no N2 até a barra mudar de nível; no N3 só nesta hora certa (`cue` apagou, a próxima jogada acende).
 */
export interface MaxWait {
    level: number;
}
export function maxWaitNext(w: MaxWait | null, level: number, cue: boolean): MaxWait | null {
    if (!w || level !== w.level || (w.level >= 3 && !cue)) return null;
    return w;
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

/**
 * Direções em que o goleiro pode aparecer (sheets PMD: 1 baixo-direita, 2 direita, 6 esquerda, 7 baixo-esquerda): de
 * frente pro campo ou na diagonal de baixo. Virado pro próprio gol ele ficava de costas pro chute, e nas diagonais de
 * cima (e de cima) a câmera vê as costas dele. `front`: +1 quando o gol dele é o da esquerda (o campo à direita).
 */
export const keeperRows = (front: 1 | -1) => (front > 0 ? { field: 2, low: 1 } : { field: 6, low: 7 });

/**
 * O goleiro na área nunca aparece de costas. O motor vira o sprite pra onde ele anda e, no recuo pra linha quando o
 * rival chuta, ele corria de costas pro chute. Na tela ele olha pro campo, na diagonal de baixo quando a bola está mais
 * pra baixo, e anda de ré. `toBall`: da posição dele até a bola.
 */
export function keeperFacing(facing: number, front: 1 | -1, toBall: { x: number; y: number }): number {
    const { field, low } = keeperRows(front);
    if (facing === field || facing === low) return facing;
    // tan(22,5°): a partir daí a bola está na diagonal de baixo
    return toBall.y > Math.abs(toBall.x) * 0.41 ? low : field;
}

/** Gol com o goleiro mergulhando (o sorteio da defesa falhou): o mergulho vai de `tick` a `end`, o gol é em `goal`. */
export interface SoldDive {
    gk: number;
    tick: number;
    end: number;
    goal: number;
}

/**
 * Gols que a tela mostra como "mergulho vendido". No motor o goleiro mergulha no chute que alcança (`Action.Dive`) e,
 * se o sorteio falha, a bola segue pelo ponto onde ele está: o gol saía pela barriga dele. Lê só os snapshots.
 */
export function soldDives(snaps: MatchSnapshot[], events: readonly MatchEvent[], teamSize: number): SoldDive[] {
    const out: SoldDive[] = [];
    for (const e of events) {
        if (e.type !== 'goal' || e.ownGoal) continue;
        const from = (1 - e.team) * teamSize;
        let gk = -1;
        let tick = -1;
        let end = -1;
        // de trás pra frente a partir do gol: o mergulho de até 0,8 s antes, e onde ele começou
        for (let n = snaps.length - 1; n >= 0; n--) {
            const s = snaps[n];
            if (s.tick > e.tick) continue;
            if (s.tick < e.tick - 16) break;
            const diving = (i: number) => s.p[i * SNAP_STRIDE + 3] === Action.Dive;
            if (gk < 0) {
                for (let i = from; i < from + teamSize; i++) if (diving(i)) gk = i;
                if (gk >= 0) tick = end = s.tick;
            } else if (diving(gk)) tick = s.tick;
            else break;
        }
        if (gk < 0) continue;
        // e até onde ele vai (o motor segura o Dive por 0,5 s, às vezes além do gol)
        for (const s of snaps) {
            if (s.tick <= tick) continue;
            if (s.p[gk * SNAP_STRIDE + 3] !== Action.Dive) break;
            end = s.tick;
        }
        out.push({ gk, tick, end, goal: e.tick });
    }
    return out;
}

/** O corpo no mergulho vendido: sobe em `rise` ticks, volta em `fall`; desloca até `px` pra bola, inclina `tilt` rad. */
export const SOLD_LEAN = { rise: 3, fall: 5, px: 6, tilt: 0.35, stretch: 0.13 } as const;

/** Último tick da pose do mergulho vendido (o fim do mergulho do motor ou logo depois do gol). */
export const soldDiveEnd = (d: SoldDive) => Math.max(d.end, d.goal + 2);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Pose do mergulho vendido num tick: o bote de frente pro campo, na diagonal de baixo quando a bola passa abaixo dele
 * na tela, do contato até o fim do mergulho (ou logo depois do gol). `toBall` (px): do pé dele no começo do mergulho
 * até a bola no gol. O corpo se estica e inclina pro lado da bola (squash & stretch) e anda no máximo 6 px: o goleiro
 * saindo pela lateral parecia abrir o gol (Miguel, 09/11/2026), e parado parecia que nem tentou. `reduce` (Reduzir
 * movimento): só a pose, sem esticar.
 */
export function soldDivePose(
    d: SoldDive,
    tick: number,
    front: 1 | -1,
    toBall: { x: number; y: number },
    reduce = false,
): { x: number; y: number; facing: number; tilt: number; sx: number; sy: number; k: number } | null {
    const end = soldDiveEnd(d);
    if (tick < d.tick || tick > end) return null;
    const { field, low } = keeperRows(front);
    const L = SOLD_LEAN;
    // bote rápido (sai forte e freia) e volta suave
    const up = clamp01((tick - d.tick) / L.rise);
    const back = clamp01((end - tick) / L.fall);
    const k = reduce ? 0 : Math.min(1 - (1 - up) ** 2, back * back * (3 - 2 * back));
    const l = Math.hypot(toBall.x, toBall.y) || 1;
    // a cabeça vai pro lado da bola (pra trás dele, ela já passou): rotação positiva = horária = cabeça pra direita
    const sign = toBall.x !== 0 ? Math.sign(toBall.x) : -front;
    return {
        x: (toBall.x / l) * L.px * k,
        y: (toBall.y / l) * L.px * k,
        facing: toBall.y >= 0 ? low : field,
        tilt: sign * L.tilt * k,
        sx: 1 + L.stretch * k,
        sy: 1 - L.stretch * 0.6 * k,
        k,
    };
}

/**
 * Poeirinha do mergulho (vendido ou da defesa): sai uma vez quando o tick passa de `at`; voltando o replay pra antes,
 * arma de novo. Reduzir movimento: nada.
 */
export function diveDust(
    dusted: boolean,
    tick: number,
    at: number,
    reduce: boolean,
): { fire: boolean; dusted: boolean } {
    if (tick < at) return { fire: false, dusted: false };
    return { fire: !dusted && !reduce, dusted: true };
}

/** Mergulho da defesa: começa `lead` ticks antes do contato, volta em `tail`, alcança a bola até `max` px. */
export const SAVE_DIVE = { lead: 6, tail: 10, max: 1.8 * 22 } as const;

/**
 * Pose do mergulho da defesa `dt` ticks depois do contato: o corpo vai até a bola (`to`, px, do pé até o ponto do
 * contato; a bola tem que bater nele) e, como no mergulho vendido, inclina até ~20° pro lado da bola e estica. `reduce`
 * (Reduzir movimento): só vai até a bola, sem esticar nem inclinar.
 */
export function saveDivePose(
    dt: number,
    to: { x: number; y: number },
    front: 1 | -1,
    reduce = false,
): { x: number; y: number; tilt: number; sx: number; sy: number; k: number } | null {
    const { lead, tail, max } = SAVE_DIVE;
    if (dt < -lead || dt > tail) return null;
    const k = dt < 0 ? 1 - (-dt / lead) ** 2 : 1 - (dt / tail) ** 2;
    const l = Math.hypot(to.x, to.y);
    const m = l > max ? max / l : 1;
    const lean = reduce ? 0 : k;
    const sign = Math.abs(to.x) > 1e-6 ? Math.sign(to.x) : front;
    return {
        x: to.x * m * k,
        y: to.y * m * k,
        tilt: lean ? sign * SOLD_LEAN.tilt * lean : 0,
        sx: 1 + SOLD_LEAN.stretch * lean,
        sy: 1 - SOLD_LEAN.stretch * 0.6 * lean,
        k: lean,
    };
}

/** Reação do goleiro ao gol sofrido: `gk` fica cabisbaixo de `from` a `from + GOAL_REACTION_TICKS`. */
export interface GoalReaction {
    gk: number;
    from: number;
}
export const GOAL_REACTION_TICKS = 12;

/**
 * Depois do gol sofrido, ~0,6 s de reação (o Hurt do PMD, cabeça baixa) antes de voltar ao normal: começa quando o
 * mergulho vendido acaba ou logo depois do gol. `keeperOf(time, tick)`: o goleiro do time naquele tick.
 */
export function goalReactions(
    events: readonly MatchEvent[],
    sold: readonly SoldDive[],
    keeperOf: (team: 0 | 1, tick: number) => number,
): GoalReaction[] {
    const out: GoalReaction[] = [];
    for (const e of events) {
        if (e.type !== 'goal') continue;
        const d = sold.find((x) => x.goal === e.tick);
        const gk = d?.gk ?? keeperOf(e.team === 0 ? 1 : 0, e.tick);
        if (gk >= 0) out.push({ gk, from: d ? soldDiveEnd(d) : e.tick + 2 });
    }
    return out;
}

/** Quanto da reação já passou (0 a 1) naquele tick, ou null fora dela. */
export function goalReactionAt(r: GoalReaction, tick: number): number | null {
    if (tick <= r.from || tick > r.from + GOAL_REACTION_TICKS) return null;
    return (tick - r.from) / GOAL_REACTION_TICKS;
}

/** Uma troca de direção a cada 150 ms no máximo (tempo de tela): o goleiro tremia entre duas direções. */
export const FACE_HOLD_MS = 150;
export interface FacingHold {
    facing: number;
    at: number;
}

/** Direção mostrada com histerese: troca só se a última troca foi há `FACE_HOLD_MS` ou mais. */
export function holdFacing(h: FacingHold | null, want: number, now: number): FacingHold {
    if (!h || (want !== h.facing && now - h.at >= FACE_HOLD_MS)) return { facing: want, at: now };
    return h;
}

/**
 * Dribles com nome (só tela; Miguel, 09/11/2026). O motor já decide o 1x1: o carrinho que não leva a bola (`tackle`
 * com `success: false`) é o portador passando pelo marcador. A tela dá nome e animação a poucos deles: portador com
 * DRI alta na carta, no ataque, ficando com a bola. A animação só enfeita: ela sai e volta pro snapshot.
 */
// a caneta ficou de fora (09/11): no carrinho os dois sprites ficam um em cima do outro e a bola entre as pernas não
// aparecia no celular
export type DribbleKind = 'lambreta' | 'roleta' | 'elastico' | 'chapeu';
export const DRIBBLE_KINDS: readonly DribbleKind[] = ['lambreta', 'roleta', 'elastico', 'chapeu'];

export interface NamedDribble {
    tick: number;
    /** Quem driblou (o portador) e quem ficou pra trás. */
    by: number;
    marker: number;
    team: 0 | 1;
    kind: DribbleKind;
    /** Pra onde o portador ia (unitário) e de que lado ficou o marcador (+1 à esquerda dessa direção, na tela). */
    dir: { x: number; y: number };
    side: 1 | -1;
}

export const NAMED_DRIBBLE = {
    /** DRI de campo da carta (`cardAttributes().field.dribble`) a partir da qual o drible ganha nome (10/11: 75 → 78). */
    dri: 78,
    /** No máximo por time numa partida. */
    perTeam: 2,
    /** O 1x1 que conta: o portador a até 18 m do gol (de 40; 10/11: era a metade, 20 m). */
    zone: 18 / 40,
    /** Ticks entre dois dribles com nome (3 s) e de folga pro golpe máximo (que tem a câmera lenta dele). */
    gap: 60,
    clearMax: 30,
    clearMove: 20,
    /**
     * Variação pelo lance (11/11: 4 tipos; a vaca saiu, o Miguel não curtiu): marcador vindo da frente ou do lado (ângulo
     * com a corrida abaixo de `behind`) toma o elástico ou, o alto, a roleta e, o baixo, a lambreta; vindo de trás, o alto
     * toma a roleta ou o chapéu (a bola por cima da cabeça grande) e o baixo, a lambreta. Entre os dois, a paridade do
     * lance (tick e vagas), sem sorteio.
     */
    behind: (2 * Math.PI) / 3,
    tall: 1,
    /** Janela da animação: ticks antes e depois do carrinho (6 antes: o marcador fecha e o driblador arma sem tranco). */
    lead: 6,
    tail: 8,
    /** Câmera lenta (só na 1x): fator e ticks em volta do carrinho, com rampa de `ramp` ticks de cada lado. */
    slow: 0.3,
    slowFrom: 2,
    slowTo: 3,
    ramp: 2,
    /** Hit-stop no ápice (ms de quadro parado), zoom da câmera no driblador e quanto a faixa do nome fica (ms). */
    stopMs: 150,
    zoom: 1.2,
    bannerMs: 1100,
    /**
     * Entrada e saída da faixa (ms): calmas, um movimento só com fade (11/11: a do golpe, 200 ms e o texto correndo
     * atrás, parecia piscar no drible).
     */
    bannerInMs: 360,
    bannerOutMs: 320,
} as const;

/**
 * Os dribles com nome da partida. `info(idx, tick)`: DRI da carta e altura (m) de quem está na vaga naquele tick.
 * Variação pelo lance, sem sorteio (`NAMED_DRIBBLE.behind` e `tall`).
 */
export function namedDribbles(
    m: Pick<MatchResult, 'events' | 'snapshots' | 'roster'>,
    info: (idx: number, tick: number) => { dri: number; height: number },
    /** Lance já com outra câmera lenta (o botão do golpe máximo aceso): sem drible com nome. */
    busy: (tick: number) => boolean = () => false,
): NamedDribble[] {
    const N = NAMED_DRIBBLE;
    const { length } = FUTSAL_5.pitch;
    const snaps = m.snapshots;
    if (!snaps.length) return [];
    // golpe perto do lance (holofote, faixa e câmera lenta dele): o drible com nome fica de fora
    const moveTicks = m.events.flatMap((e) => (e.type === 'move' ? [e.tick] : []));
    const maxTicks = m.events.flatMap((e) =>
        (e.type === 'max' && e.phase === 'hit') || e.type === 'showdown' ? [e.tick] : [],
    );
    const out: NamedDribble[] = [];
    const count = [0, 0];
    for (const e of m.events) {
        if (e.type !== 'tackle' || e.success) continue;
        const by = e.victim;
        const team = m.roster[by]?.team;
        if (team === undefined || count[team] >= N.perTeam) continue;
        if (out.length && e.tick - out[out.length - 1].tick < N.gap) continue;
        if (maxTicks.some((t) => Math.abs(t - e.tick) <= N.clearMax)) continue;
        if (moveTicks.some((t) => Math.abs(t - e.tick) <= N.clearMove)) continue;
        const now = snapAt(snaps, e.tick);
        // ficou com a bola (o drible que deu certo), com a bola rolando
        if (now.phase !== 'play' || now.owner !== by || snapAt(snaps, e.tick + 2).owner !== by) continue;
        const o = by * SNAP_STRIDE;
        const toGoal = team === 0 ? length - now.p[o] : now.p[o];
        if (toGoal > length * N.zone) continue;
        if (info(by, e.tick).dri < N.dri || busy(e.tick)) continue;
        // pra onde ele ia (do tick -2 ao +2; parado, pro gol)
        const a = snapAt(snaps, e.tick - 2);
        const b = snapAt(snaps, e.tick + 2);
        let dx = b.p[o] - a.p[o];
        let dy = b.p[o + 1] - a.p[o + 1];
        let l = Math.hypot(dx, dy);
        if (l < 0.05) [dx, dy, l] = [team === 0 ? 1 : -1, 0, 1];
        const dir = { x: dx / l, y: dy / l };
        const mo = e.by * SNAP_STRIDE;
        const rx = now.p[mo] - now.p[o];
        const ry = now.p[mo + 1] - now.p[o + 1];
        const along = rx * dir.x + ry * dir.y;
        const cross = dir.x * ry - dir.y * rx;
        const ang = Math.atan2(Math.abs(cross), along);
        const tall = info(e.by, e.tick).height >= N.tall;
        const h = e.tick + by * 7 + e.by * 3;
        let kind: DribbleKind;
        if (Math.hypot(rx, ry) < 1e-3) kind = DRIBBLE_KINDS[h % DRIBBLE_KINDS.length];
        else if (ang < N.behind) kind = h % 2 ? (tall ? 'roleta' : 'lambreta') : 'elastico';
        else if (tall) kind = h % 2 ? 'chapeu' : 'roleta';
        else kind = 'lambreta';
        out.push({ tick: e.tick, by, marker: e.by, team, kind, dir, side: cross >= 0 ? 1 : -1 });
        count[team]++;
    }
    return out;
}

/** `namedDribbles` com a carta de quem está em quadra (trocas, evoluções e Transformar até ali). */
export function namedDribblesOf(m: MatchResult, setups: [TeamSetup, TeamSetup]): NamedDribble[] {
    const cue = (team: 0 | 1, tick: number) => {
        const cap = captainAt(m, setups, team, tick).idx;
        const from = tick - NAMED_DRIBBLE.clearMax;
        const to = tick + NAMED_DRIBBLE.clearMax;
        if (cap === null || maxCharge(m.events, team, tick, 5).level < 1) return false;
        return maxCueNear(m.snapshots, m.events, from, to, team, cap, roleAt(m, setups, cap, tick));
    };
    return namedDribbles(
        m,
        (idx, tick) => {
            const inst = whoAt(m, setups, idx, tick).inst;
            return inst
                ? { dri: cardAttributes(inst).field.dribble, height: species(inst.speciesId).heightm }
                : { dri: 0, height: 0 };
        },
        (tick) => cue(0, tick) || cue(1, tick),
    );
}

/** Câmera lenta do drible com nome no tick: só na 1x (em 2x pra cima, nunca); 1 = sem. */
export function dribbleSlowAt(list: readonly NamedDribble[], tick: number, speed: number | string): number {
    if (speed !== 1) return 1;
    const N = NAMED_DRIBBLE;
    let f = 1;
    for (const d of list) {
        const t = tick - d.tick;
        if (t < -N.slowFrom - N.ramp || t > N.slowTo + N.ramp) continue;
        const out = t < -N.slowFrom ? (-N.slowFrom - t) / N.ramp : t > N.slowTo ? (t - N.slowTo) / N.ramp : 0;
        f = Math.min(f, N.slow + (1 - N.slow) * out);
    }
    return f;
}

/** Enfeite do drible na tela (px): corpo e bola saem do snapshot e voltam pra ele no fim da janela. */
export interface DribblePose {
    /** Quem dribla: deslocamento, direção mostrada (linha da sheet; null = a do snapshot), inclinação e squash. */
    body: { x: number; y: number };
    face: number | null;
    tilt: number;
    sx: number;
    sy: number;
    /** A bola: deslocamento e altura (px; a sombra fica no chão). */
    ball: { x: number; y: number };
    lift: number;
    /** Quem ficou: deslocamento, direção, inclinação, squash e o "?" em cima da cabeça (0 a 1). */
    markerBody: { x: number; y: number };
    markerFace: number | null;
    markerTilt: number;
    markerSx: number;
    markerSy: number;
    huh: number;
    /** Rastro na cor do time ligado (giro da roleta, puxada do elástico). */
    ghost: boolean;
}

/**
 * Poeirinha no pé (ticks em relação ao carrinho): o toque de calcanhar da lambreta, a pisada e a saída da roleta, a
 * pisada da puxada do elástico. A da bola caindo na lambreta sai do quique (`kickPop`).
 */
export const DRIBBLE_PUFFS: Record<DribbleKind, readonly number[]> = {
    lambreta: [-2.4],
    roleta: [-1.6, 1.4],
    elastico: [-1.2],
    chapeu: [-2],
};

const bump = (v: number) => (v <= 0 || v >= 1 ? 0 : Math.sin(Math.PI * v));
/** 0 antes de `a`, 1 depois de `b`, suave (smoothstep) no meio. */
const ramp = (a: number, b: number, t: number) => {
    const v = clamp01((t - a) / (b - a));
    return v * v * (3 - 2 * v);
};
const inOut = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));
const outCubic = (v: number) => 1 - (1 - clamp01(v)) ** 3;
const outBack = (v: number) => {
    const x = clamp01(v) - 1;
    return 1 + 2.7 * x ** 3 + 1.7 * x ** 2;
};
/** Cambaleio: balança e amortece a partir de `t0`. */
const wobble = (t: number, t0: number, period: number, decay: number) =>
    t < t0 ? 0 : Math.sin((2 * Math.PI * (t - t0)) / period) * Math.exp(-(t - t0) / decay);

/**
 * Pose do drible no tick (fracionário). Coreografia em ticks em relação ao carrinho (`t`; na 1x a câmera lenta deixa
 * de -2 a +3 bem devagar e o hit-stop congela o t = 0, o ápice de cada um). `toBall`: px do pé do portador até a bola
 * no carrinho; `toMarker`: px do portador até o marcador no snapshot de agora (o marcador é posto onde a cena pede e
 * volta pro lugar dele). Corpo e bola de quem dribla voltam pro snapshot até t = 3,5 (logo depois ele pode passar ou
 * chutar); o marcador fica no lance até o fim da janela. Fora dela, ou com Reduzir movimento, null (só o nome).
 */
export function dribblePose(
    d: NamedDribble,
    tick: number,
    toBall: { x: number; y: number },
    toMarker: { x: number; y: number },
    reduce = false,
    /** Altura da cabeça do marcador (px acima do pé): a bola da lambreta passa bem acima dela. */
    markerHead = 60,
): DribblePose | null {
    const N = NAMED_DRIBBLE;
    const t = tick - d.tick;
    if (reduce || t <= -N.lead || t >= N.tail) return null;
    // eixos na tela: F pra onde ele corre, S pro lado do marcador
    const F = d.dir;
    const S = { x: -d.dir.y * d.side, y: d.dir.x * d.side };
    const v = (f: number, s: number) => ({ x: F.x * f + S.x * s, y: F.y * f + S.y * s });
    const rot = (p: { x: number; y: number }, a: number) => {
        const c = Math.cos(a);
        const s = Math.sin(a);
        return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
    };
    const lean = (side: { x: number; y: number }, k: number) =>
        k * (side.x >= 0 ? 1 : -1) * Math.max(0.35, Math.abs(side.x));
    // o marcador entra no lance (de onde estiver) e volta pro lugar dele no fim
    const wM = ramp(-N.lead, -3, t) * (1 - ramp(3.5, N.tail, t));
    const pose: DribblePose = {
        body: { x: 0, y: 0 },
        face: null,
        tilt: 0,
        sx: 1,
        sy: 1,
        ball: { x: 0, y: 0 },
        lift: 0,
        markerBody: { x: 0, y: 0 },
        markerFace: null,
        markerTilt: 0,
        markerSx: 1,
        markerSy: 1,
        huh: 0,
        ghost: false,
    };
    let mf = 0;
    let ms = 0;
    let mFace: { x: number; y: number } | null = null;
    // o "?" do vendido: pula (Back) e some no fim
    const huhAt = (t0: number) => outBack((t - t0) / 1.2) * (1 - ramp(5.5, N.tail, t));
    if (d.kind === 'lambreta') {
        // pisa, puxa a bola pra trás e agacha; toque de calcanhar (estica): a bola sobe alta por cima da cabeça do
        // marcador (o ápice no hit-stop), ele recua olhando a bola e vira; quem driblou dá a volta por fora e pega na frente
        const crouch = t < -2.4 ? ramp(-4.5, -2.5, t) : 0;
        const kick = t >= -2.4 ? Math.exp(-(t + 2.4) / 0.9) : 0;
        const run = bump((t + 2.4) / 5.6);
        const bodyAt = (u: number) => {
            const r = bump((u + 2.4) / 5.6);
            return v(12 * r, -40 * r);
        };
        pose.body = bodyAt(t);
        pose.sx = 1 + 0.1 * crouch - 0.08 * kick;
        pose.sy = 1 - 0.12 * crouch + 0.14 * kick;
        pose.tilt = lean(F, -0.14 * crouch + 0.12 * kick + 0.1 * run);
        const heel = v(-10, 0);
        let ball: { x: number; y: number };
        if (t < -2.4) {
            const k = inOut(ramp(-4.5, -2.6, t));
            ball = { x: toBall.x + (heel.x - toBall.x) * k, y: toBall.y + (heel.y - toBall.y) * k };
        } else if (t < 2) {
            // parábola de verdade: anda reto no chão (a sombra) e sobe e desce no ar
            const u = (t + 2.4) / 4.4;
            const end = bodyAt(2);
            const land = { x: end.x + toBall.x + F.x * 6, y: end.y + toBall.y + F.y * 6 };
            ball = { x: heel.x + (land.x - heel.x) * u, y: heel.y + (land.y - heel.y) * u };
            // bem acima da cabeça do marcador
            pose.lift = Math.max(96, markerHead + 40) * 4 * u * (1 - u);
        } else {
            // quica na frente e ele domina (a bola encosta no pé)
            const k = outCubic((t - 2) / 1);
            const at = { x: pose.body.x + toBall.x, y: pose.body.y + toBall.y };
            const end = bodyAt(2);
            const land = { x: end.x + toBall.x + F.x * 6, y: end.y + toBall.y + F.y * 6 };
            ball = { x: land.x + (at.x - land.x) * k, y: land.y + (at.y - land.y) * k };
        }
        pose.ball = { x: ball.x - toBall.x, y: ball.y - toBall.y };
        // marcador: fecha na frente, recua de frente pra bola que passa por cima e gira pra ver ela cair atrás dele
        mf = 38 - 76 * inOut((t + 2.5) / 5.5);
        ms = 22;
        const turn = inOut((t + 0.4) / 1.8);
        mFace = rot({ x: -F.x, y: -F.y }, Math.PI * turn * d.side);
        pose.markerTilt = lean(F, 0.12 * bump((t + 1.2) / 2.4)) + lean(S, 0.32 * wobble(t, 1.3, 2.4, 2.2));
        pose.markerSy = 1 + 0.06 * bump((t + 1.2) / 2.4) - 0.07 * bump((t - 1.3) / 1.2);
        pose.markerSx = 1 / pose.markerSy;
        pose.huh = huhAt(0.6);
    } else if (d.kind === 'roleta') {
        // pisa na bola (agacha) e gira 360° por cima dela, de costas pro marcador na metade (ápice no hit-stop); sai de
        // lado, longe dele, empurrando o chão (estica). O marcador dá o bote onde a bola estava e passa reto
        const plant = ramp(-3, -1.6, t) * (1 - ramp(-1.6, -0.6, t));
        const push = bump((t - 1) / 1.6);
        const spin = inOut((t + 1.6) / 3.2);
        const a = -2 * Math.PI * spin * d.side;
        const back = 1 - ramp(1.2, 2.4, t);
        const slide = v(0, -24 * ramp(-1.6, 1.4, t) * back);
        // gira em volta da bola (raio de meio corpo)
        const l = Math.hypot(toBall.x, toBall.y);
        const r = l > 1 ? { x: (toBall.x / l) * 20, y: (toBall.y / l) * 20 } : v(20, 0);
        const orbit = rot(r, a);
        pose.body = { x: slide.x + r.x - orbit.x, y: slide.y + r.y - orbit.y };
        // a bola fica colada e troca de pé no meio do giro
        const foot = v(0, 6 * Math.sin(2 * Math.PI * spin));
        pose.ball = { x: slide.x + foot.x, y: slide.y + foot.y };
        pose.face = spin > 0 && spin < 1 ? dir8(rot(F, a)) : null;
        // de lado no giro: mais fino; inclina pra dentro da curva
        pose.sx = 1 + 0.1 * plant - 0.1 * Math.abs(Math.sin(a)) - 0.06 * push;
        pose.sy = 1 - 0.1 * plant + 0.1 * push;
        pose.tilt = lean(S, -0.16 * Math.sin(Math.PI * spin)) + lean(F, 0.1 * push);
        pose.ghost = spin > 0.05 && spin < 0.95;
        // marcador: ombro a ombro, bote pra dentro (onde a bola estava), passa reto e tropeça
        const lunge = inOut((t + 1) / 2);
        const past = outCubic((t - 0.6) / 2.4);
        mf = -6 + 36 * lunge + 30 * past;
        ms = 34 - 28 * lunge - 6 * past;
        mFace = t < -1 ? { x: -toMarker.x, y: -toMarker.y } : F;
        pose.markerTilt = lean(F, 0.3 * bump((t + 1) / 3.2)) + lean(F, 0.28 * wobble(t, 1.8, 2, 2));
        pose.markerSy = 1 - 0.08 * bump((t + 0.8) / 2.2);
        pose.markerSx = 1 + 0.06 * bump((t + 0.8) / 2.2);
        pose.huh = huhAt(1.2);
    } else if (d.kind === 'chapeu') {
        // chapéu: de frente, agacha e põe o bico do pé por baixo da bola (sem calcanhar): ela sobe por cima da cabeça do
        // marcador (o ápice no hit-stop), ele passa pelo lado e domina na frente; o marcador olha pra cima e fica
        const crouch = t < -2 ? ramp(-4.4, -2.2, t) : 0;
        const scoop = t >= -2 ? Math.exp(-(t + 2) / 0.9) : 0;
        // corrida de lado na tela: ele passa por baixo (na frente do marcador); por cima a bola no alto ficava em cima
        // da cabeça dele, não da do marcador
        const bs = S.y > 0.3 ? 1 : -1;
        const wide = 1 + 0.7 * Math.abs(S.y);
        const bodyAt = (u: number) => {
            const r = bump((u + 1.8) / 4.2);
            return v(4 * r, 34 * wide * bs * r);
        };
        pose.body = bodyAt(t);
        pose.sx = 1 + 0.1 * crouch - 0.08 * scoop;
        pose.sy = 1 - 0.12 * crouch + 0.16 * scoop;
        pose.tilt = lean(F, -0.1 * crouch - 0.1 * scoop + 0.1 * bump((t + 1) / 3.4));
        const land = (() => {
            const b = bodyAt(2);
            return { x: b.x + F.x * 6, y: b.y + F.y * 6 };
        })();
        if (t < -2) {
            // o pé entra por baixo: a bola só encosta (um tico pra frente)
            pose.ball = v(3 * crouch, 0);
        } else if (t < 2) {
            const u = (t + 2) / 4;
            const from = v(3, 0);
            pose.ball = { x: from.x + (land.x - from.x) * u, y: from.y + (land.y - from.y) * u };
            pose.lift = Math.max(90, markerHead + 34) * 4 * u * (1 - u);
        } else {
            const k = outCubic((t - 2) / 1);
            pose.ball = { x: land.x + (pose.body.x - land.x) * k, y: land.y + (pose.body.y - land.y) * k };
        }
        // marcador: plantado de frente, estica olhando a bola subir, vira devagar quando ela cai atrás e fica
        mf = 40 - 70 * inOut((t + 3) / 6.5);
        ms = 6;
        const turn = inOut((t - 0.8) / 2.2);
        mFace = rot({ x: -F.x, y: -F.y }, Math.PI * turn * d.side);
        pose.markerTilt = lean(F, -0.14 * bump((t + 1.4) / 3)) + lean(S, 0.2 * wobble(t, 2, 2.6, 2.4));
        pose.markerSy = 1 + 0.09 * bump((t + 1.4) / 3);
        pose.markerSx = 1 / pose.markerSy;
        pose.huh = huhAt(0.3);
    } else {
        // elástico: mostra a bola pro lado de fora (o corpo inclina junto), o marcador morde e vai; a bola volta rasgando
        // pro outro lado (ápice no hit-stop: a bola já do outro lado, o marcador ainda indo pro errado)
        const fake = outCubic((t + 4) / 2.8) * (1 - ramp(-1.2, 0.2, t));
        const cut = inOut((t + 1.2) / 1.6);
        const back = 1 - ramp(1, 3, t);
        pose.body = v((14 * cut + 4 * fake) * back, (-14 * fake + 26 * cut) * back);
        const ballOut = v(4 * fake, -30 * fake);
        const ballCut = v(16 * cut, 34 * cut);
        pose.ball = { x: (ballOut.x + ballCut.x) * back, y: (ballOut.y + ballCut.y) * back };
        pose.tilt = lean(S, -0.22 * fake + 0.2 * bump(cut ** 0.7));
        // pisa pra puxar (agacha) e arranca (estica)
        pose.sx = 1 + 0.1 * bump((t + 1.6) / 1.2) - 0.06 * bump((t + 0.4) / 1.8);
        pose.sy = 1 - 0.12 * bump((t + 1.6) / 1.2) + 0.1 * bump((t + 0.4) / 1.8);
        pose.ghost = t > -1 && t < 1;
        // marcador: de frente, morde a finta (meio tick atrasado), segue indo pro lado errado e fica pra trás, desequilibrado
        const bite = outCubic((t + 3.4) / 3);
        const drift = outCubic((t + 0.2) / 3);
        mf = 40 - 46 * drift;
        ms = -26 * bite - 12 * drift;
        mFace =
            t < 0.6
                ? { x: -F.x, y: -F.y }
                : { x: pose.body.x - (mf * F.x + ms * S.x), y: pose.body.y - (mf * F.y + ms * S.y) };
        pose.markerTilt =
            lean(S, -0.36 * bite * (1 - ramp(0.6, 3, t)) - 0.1 * drift) + lean(S, 0.3 * wobble(t, 1.4, 2.2, 2));
        pose.markerSy = 1 - 0.1 * bite * (1 - ramp(0.5, 3, t));
        pose.markerSx = 1 + 0.07 * bite * (1 - ramp(0.5, 3, t));
        pose.huh = huhAt(0.8);
    }
    // quem dribla olha pra onde vai (no snapshot às vezes ele está de lado ou de costas); a roleta tem a dela
    if (d.kind !== 'roleta' && t > -4.5 && t < 3) pose.face = dir8(F);
    const want = v(mf, ms);
    pose.markerBody = { x: (want.x - toMarker.x) * wM, y: (want.y - toMarker.y) * wM };
    pose.markerFace = mFace && wM > 0.5 ? dir8(mFace) : null;
    // inclinação e squash do marcador entram e saem com ele
    pose.markerTilt *= wM;
    pose.markerSx = 1 + (pose.markerSx - 1) * wM;
    pose.markerSy = 1 + (pose.markerSy - 1) * wM;
    return pose;
}

/**
 * Toque na bola na tela (11/11, Miguel: "a bola sai do pé e logo depois ele faz a animação"). O motor marca o chute, o
 * passe e o carrinho no snapshot seguinte ao toque (`Action.Kick`/`Shoot`/`Tackle`), e a bola já sai do pé no snapshot
 * de antes; a animação começava ali do quadro 0 e o quadro de impacto do PMD vinha 100 a 600 ms depois da bola. Agora a
 * tela olha os snapshots à frente: o contato é o último snapshot antes da ação (de onde a bola sai), a antecipação
 * (os quadros antes do impacto) roda antes dele e o impacto cai no quadro em que a bola sai.
 */
const STRIKES: ReadonlySet<number> = new Set([Action.Kick, Action.Shoot, Action.Tackle]);
/** Quantos snapshots olhar pra trás e pra frente (2 ticks cada): a antecipação mais longa do PMD cabe em 8 ticks. */
const STRIKE_BACK = 10;
const STRIKE_AHEAD = 5;

export interface StrikeCue {
    /** Tick do contato (a bola sai do pé) e o tick em que o motor larga a ação. */
    contact: number;
    end: number;
    action: number;
    facing: number;
}

/**
 * Tick em que a bola sai do pé em cada passe e chute, por jogador: o do evento menos 1 (o motor chuta no começo do tick
 * do evento). Com o evento num tick par (o do snapshot), a bola vinha "se arrastando" a meia velocidade do snapshot de
 * antes até ele; a tela segura ela no pé até aqui (`kickHold`) e o impacto cai aqui.
 */
export function kickDepartures(events: readonly MatchEvent[]): Map<number, number[]> {
    const out = new Map<number, number[]>();
    for (const e of events) {
        if (e.type !== 'pass' && e.type !== 'shot') continue;
        const list = out.get(e.by) ?? [];
        const dep = e.tick - 1;
        if (list.at(-1) !== dep) list.push(dep);
        out.set(e.by, list);
    }
    return out;
}

/**
 * Fração da bola entre os snapshots `a` e `b` (`k`, de 0 a 1) com a saída do pé no tick `dep` (entre os dois): parada
 * no pé até ele e daí até `b` (sem a bola andando a meia velocidade antes do chute).
 */
export function kickHold(aTick: number, bTick: number, dep: number, tick: number): number {
    if (dep <= aTick || dep >= bTick) return Math.min(1, Math.max(0, (tick - aTick) / (bTick - aTick || 1)));
    return tick <= dep ? 0 : Math.min(1, (tick - dep) / (bTick - dep));
}

/**
 * Os toques na bola do jogador (`o`: deslocamento dele no snapshot) em volta do snapshot `index`, do mais novo pro mais
 * velho. `deps`: os ticks de saída do pé dele (`kickDepartures`), quando o motor contou.
 */
export function strikesNear(
    snaps: readonly MatchSnapshot[],
    index: number,
    o: number,
    deps: readonly number[] = [],
): StrikeCue[] {
    const out: StrikeCue[] = [];
    const last = snaps.length - 1;
    for (let n = Math.min(last, index + STRIKE_AHEAD); n >= Math.max(1, index - STRIKE_BACK); n--) {
        const act = snaps[n].p[o + 3];
        // um toque logo depois do outro (o carrinho e o passe) também conta
        if (!STRIKES.has(act) || snaps[n - 1].p[o + 3] === act) continue;
        let m = n;
        while (m < last && snaps[m + 1].p[o + 3] === act) m++;
        out.push({
            // o chute e o passe: a bola sai do pé no snapshot de antes; o carrinho: ela chega nele no meio dos dois
            contact:
                act === Action.Tackle
                    ? (snaps[n - 1].tick + snaps[n].tick) / 2
                    : (deps.find((t) => t >= snaps[n - 1].tick && t < snaps[n].tick) ?? snaps[n - 1].tick),
            end: snaps[Math.min(m + 1, last)].tick,
            action: act,
            facing: snaps[n].p[o + 2],
        });
    }
    return out;
}

/**
 * Quadro da animação de toque `ms` depois do começo dela (durações em quadros de 1/60 s, as do PMD), ou -1 antes de
 * começar. O impacto (`hit`) começa em `strikeLead(durations, hit)` ms: é aí que o contato cai.
 */
export function strikeFrame(durations: readonly number[], ms: number): number {
    if (ms < 0) return -1;
    let acc = 0;
    for (let i = 0; i < durations.length; i++) {
        acc += (durations[i] * 1000) / 60;
        if (ms < acc) return i;
    }
    return durations.length - 1;
}

/** Ms da antecipação: do começo da animação ao quadro de impacto. */
export function strikeLead(durations: readonly number[], hit: number): number {
    let acc = 0;
    for (let i = 0; i < hit; i++) acc += durations[i];
    return (acc * 1000) / 60;
}
