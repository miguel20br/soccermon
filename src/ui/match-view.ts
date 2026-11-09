import { bicudaCueNear, inMaxZone, maxCallCue, maxCue } from '../engine/agency';
import type { Position } from '../engine/attributes';
import { FUTSAL_5 } from '../engine/config';
import { evolveInstance } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent, MatchSnapshot, PlayerStats, TeamSetup } from '../engine/state';
import { Action, SNAP_STRIDE } from '../engine/state';

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
const keeperRows = (front: 1 | -1) => (front > 0 ? { field: 2, low: 1 } : { field: 6, low: 7 });

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

/**
 * Pose do mergulho vendido num tick: o bote de frente pro campo, na diagonal de baixo quando a bola passa abaixo dele
 * na tela (`side` > 0), do contato até o fim do mergulho (ou logo depois do gol). Ele não sai do lugar (desvio 0): o
 * goleiro saindo pela lateral parecia abrir o gol (Miguel, 09/11/2026). A bola pode passar por cima do sprite: vista de
 * cima, ela passa do lado.
 */
export function soldDivePose(
    d: SoldDive,
    tick: number,
    front: 1 | -1,
    side: number,
): { x: number; y: number; facing: number } | null {
    if (tick < d.tick || tick > Math.max(d.end, d.goal + 2)) return null;
    const { field, low } = keeperRows(front);
    return { x: 0, y: 0, facing: side >= 0 ? low : field };
}
