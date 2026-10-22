import { abilityEffect, isStatusImmune } from './abilities';
import { AGENCY, inMaxZone, maxCharge } from './agency';
import {
    type AttrKey,
    aerialScore,
    computeAttributes,
    type Position,
    positionRating,
    sizePercentile,
} from './attributes';
import type { Command } from './commands';
import { type MatchConfig, segmentTicks } from './config';
import { MOVES, species, type TypeName } from './data';
import { dpow } from './dmath';
import { compressed, eff, fatigueFactor, finalPressureTeam, isIncapacitated, TACTIC_MODS } from './effective';
import { evolutionTarget, evolveInstance, evoNeeded, evoProgress, evoScore } from './evolution';
import { FORMATIONS, formationOf } from './formations';
import type { PokemonInstance } from './instance';
import { ITEMS } from './items';
import { type ActiveLink, computeLinks } from './links';
import {
    applyModifiers,
    attributeModifiers,
    captainFactor,
    isTaught,
    TAUGHT_MOVE,
    moveUses as usesOf,
} from './modifiers';
import {
    BOOST_TO_ATTR,
    DRAIN,
    DRAWBACK,
    hasTrait,
    moveProfile,
    OHKO,
    SECONDARY_PICK,
    STATUS_DURATION,
    type StatusKind,
    selfBoostsOf,
    MOVE_TUNING as T,
    TRAP,
} from './moves';
import { Rng } from './rng';
import { SIGNATURE } from './signature-moves';
import {
    Action,
    type AgencyOrder,
    type AgencyRuntime,
    type CornerPlan,
    type CornerPlay,
    FLAG_BUFF,
    FLAG_CHARGED,
    FLAG_CHARGING,
    FLAG_CLONES,
    FLAG_DEBUFF,
    FLAG_DIG,
    FLAG_FLY,
    FLAG_GUARD,
    FLAG_MINI,
    FLAG_RAGE,
    type LineupOrder,
    type MatchEvent,
    type MatchSnapshot,
    type MatchState,
    type PlayerState,
    type SetPiece,
    STATUS_CODE,
    type SubOrder,
    type TeamSetup,
    type TraitFx,
    type TraitState,
} from './state';
import { typeMultiplier } from './types';
import { add, clamp, dir8, dist, len, norm, pointSegment, rotate, scale, sub, truncate, type Vec2, v } from './vec';
import { expectedGoals } from './xg';

// ---------------------------------------------------------------- constantes físicas
export const FRICTION = 2.8; // desaceleração da bola rolando (m/s²)
const GRAVITY = 9.8;
/** Passe a partir desta distância (m) vai pelo alto: passa por cima de quem está no caminho. */
const LOB_MIN = 12;
/** Altura (m) até onde um jogador de linha domina a bola; o goleiro na área alcança mais alto. */
const REACH_Z = 1.1;
const GK_REACH_Z = 2.3;
const CONTROL_RADIUS = 0.6;
const GK_CONTROL_RADIUS = 0.95;
export const TACKLE_RANGE = 1.35;
const DRIBBLE_OFFSET = 0.45;
const WALL_DAMPING = 0.6;
const POST_TOLERANCE = 0.12;
/** Segundos até o mesmo Pokémon usar outro golpe, e intervalo mínimo entre golpes de qualquer time. */
const MOVE_COOLDOWN = 25;
const MOVE_GAP = 5;

// ---------------------------------------------------------------- geometria
export const attackSign = (team: 0 | 1) => (team === 0 ? 1 : -1);
export const goalXFor = (s: MatchState, team: 0 | 1) => (team === 0 ? s.cfg.pitch.length : 0); // gol que o time ataca
export const ownGoalX = (s: MatchState, team: 0 | 1) => (team === 0 ? 0 : s.cfg.pitch.length);
/** Converte coordenada relativa ao time (x = profundidade rumo ao ataque) para o mundo. */
export const toWorld = (s: MatchState, team: 0 | 1, xr: number, y: number): Vec2 =>
    team === 0 ? v(xr, y) : v(s.cfg.pitch.length - xr, y);
export const toRel = (s: MatchState, team: 0 | 1, p: Vec2): Vec2 => (team === 0 ? p : v(s.cfg.pitch.length - p.x, p.y));

/** Estado inicial dos traços de golpe de um jogador. */
export function freshTraits(): TraitState {
    return {
        focus: false,
        charging: null,
        air: null,
        aim: null,
        toxic: 0,
        rage: null,
        bide: null,
        decoys: 0,
        decoyT: 0,
        mini: 0,
        guard: 0,
        guardMove: '',
        curl: 0,
        typeCopy: null,
        flee: null,
    };
}

/** Tipos com que o jogador joga agora (Conversion copia o do rival por um tempo). */
const typesOf = (p: PlayerState): readonly TypeName[] => p.fx.typeCopy?.types ?? p.sp.types;

/** Fora do alcance de todo mundo (voando com Fly ou cavando com Dig). */
const hidden = (p: PlayerState) => p.fx.air !== null;

/** Minuto do relógio exibido (0–40 no futsal): nos acréscimos ele fica parado no fim do tempo (20' ou 40'). */
export function minuteOf(s: MatchState): number {
    const perHalf = s.cfg.displayHalfMinutes;
    return (s.half - 1) * perHalf + (Math.min(s.time, s.cfg.halfSeconds) / s.cfg.halfSeconds) * perHalf;
}

// ---------------------------------------------------------------- criação
/** Bônus coletivos do time: sinergias de tipo e aura do capitão. */
interface TeamBonuses {
    lineup: readonly PokemonInstance[];
    links: ActiveLink[];
    captain: PokemonInstance | null;
    sponsors?: readonly string[];
}

/** Bônus pela escalação de agora (`lineup`): capitão substituído leva a aura junto. */
function teamBonuses(lineup: readonly PokemonInstance[], setup: TeamSetup): TeamBonuses {
    const captain = lineup.find((p) => p.uid === setup.captainUid) ?? null;
    return { lineup, links: computeLinks(lineup), captain, sponsors: setup.sponsors };
}

const bonusesOf = (s: MatchState, team: 0 | 1) => teamBonuses(s.teams[team].lineup, s.teams[team].setup);

/**
 * A escalação mudou (troca ou evolução): recalcula para o time inteiro o que depende dela — sinergia de tipo,
 * duplas de história e aura do capitão. Buffs e debuffs da partida ficam à parte e continuam valendo.
 */
function refreshTeamBonuses(s: MatchState, team: 0 | 1) {
    const bonuses = bonusesOf(s, team);
    for (const p of s.players) {
        if (p.team !== team) continue;
        const mods = attributeModifiers(p.inst, { ...bonuses, role: p.role });
        p.attr = applyModifiers(computeAttributes(p.sp, p.inst.level), mods, p.role);
        p.captain = bonuses.captain?.uid === p.inst.uid;
    }
}

export { captainFactor };

function createPlayer(
    idx: number,
    team: 0 | 1,
    slot: number,
    inst: PokemonInstance,
    role: Position,
    bonuses: TeamBonuses,
): PlayerState {
    const sp = species(inst.speciesId);
    // edição, habilidade, item, tipo, capitão, sinergias e posição: a mesma regra que a carta mostra
    const mods = attributeModifiers(inst, { ...bonuses, role });
    const attr = applyModifiers(computeAttributes(sp, inst.level), mods, role);
    const ability = abilityEffect(inst.ability);
    const item = inst.item && ITEMS[inst.item] ? inst.item : null;
    const moveUses = inst.moves.map((m, i) => (item === 'choiceband' && i > 0 ? 0 : usesOf(inst, m)));
    return {
        idx,
        team,
        slot,
        role,
        inst,
        sp,
        name: inst.nickname ?? sp.name,
        attr,
        ability,
        pos: v(0, 0),
        vel: v(0, 0),
        heading: v(attackSign(team), 0),
        facing: team === 0 ? 2 : 6,
        energy: clamp(inst.condition, 0.3, 1),
        action: Action.Idle,
        actionTimer: 0,
        kickCooldown: 0,
        tackleCooldown: 0,
        moveCooldown: 0,
        stun: 0,
        evade: 0,
        status: null,
        buffs: [],
        moveUses,
        shotBonus: null,
        tackleBonus: null,
        clutchAnnounced: false,
        captain: bonuses.captain?.uid === inst.uid,
        item,
        itemUsed: false,
        evolved: false,
        seeded: null,
        substitute: 0,
        fx: freshTraits(),
        ai: { nextDecision: 0, holdUntil: 0 },
        stats: {
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
        },
    };
}

export function createMatch(
    cfg: MatchConfig,
    home: TeamSetup,
    away: TeamSetup,
    seed: number | string,
    segmentSeeds: readonly string[] | null = null,
): MatchState {
    if (home.lineup.length !== cfg.teamSize || away.lineup.length !== cfg.teamSize) {
        throw new Error(`Cada time precisa de ${cfg.teamSize} titulares`);
    }
    const players: PlayerState[] = [];
    const formations = [formationOf(home.formation), formationOf(away.formation)];
    [home, away].forEach((setup, t) => {
        const team = t as 0 | 1;
        const bonuses = teamBonuses(setup.lineup, setup);
        setup.lineup.forEach((inst, slot) => {
            players.push(createPlayer(players.length, team, slot, inst, formations[team].slots[slot], bonuses));
        });
    });
    const s: MatchState = {
        cfg,
        rng: new Rng(segmentSeeds?.[0] ?? seed, 'match'),
        segmentSeeds,
        segment: 0,
        tick: 0,
        half: 1,
        time: 0,
        added: null,
        pressure: null,
        phase: 'kickoff',
        phaseTimer: 1,
        kickoffTeam: 0,
        teams: [
            {
                setup: home,
                formation: formations[0],
                tactic: home.tactic,
                corner: home.corner ?? 'mixed',
                lineup: [...home.lineup],
                bench: [...home.bench],
                possessionTicks: 0,
                combosUsed: [],
                screens: { light: 0, reflect: 0, mist: 0 },
                agency: freshAgency(),
            },
            {
                setup: away,
                formation: formations[1],
                tactic: away.tactic,
                corner: away.corner ?? 'mixed',
                lineup: [...away.lineup],
                bench: [...away.bench],
                possessionTicks: 0,
                combosUsed: [],
                screens: { light: 0, reflect: 0, mist: 0 },
                agency: freshAgency(),
            },
        ],
        players,
        auraHolders: [],
        subbedOut: [],
        pauseUntil: 0,
        pendingSubs: [],
        lastMove: [null, null],
        zones: [],
        setPiece: null,
        nextMoveTick: 0,
        ball: {
            pos: v(cfg.pitch.length / 2, cfg.pitch.width / 2),
            vel: v(0, 0),
            z: 0,
            vz: 0,
            owner: null,
            lastTouch: null,
            lastKick: null,
            shot: null,
            assistCandidate: null,
        },
        score: [0, 0],
        shootout: null,
        events: [],
        finished: false,
        winner: null,
    };
    transformDittos(s, s.players);
    refreshAuras(s);
    setupKickoff(s, 0);
    return s;
}

const DITTO = 132;

/**
 * Ditto (Transformar): vira uma cópia do melhor Pokémon da posição dele em campo, do próprio time ou do
 * rival — mesma espécie, nível, golpes e habilidade. Mantém o nome, o item e os bônus do time dele.
 */
function transformDittos(s: MatchState, candidates: PlayerState[]) {
    for (const p of candidates) {
        if (p.inst.speciesId !== DITTO || p.origin) continue;
        let best: PlayerState | null = null;
        let bestRating = -1;
        for (const o of s.players) {
            if (o === p || (o.origin ?? o.inst).speciesId === DITTO) continue;
            const r = positionRating(computeAttributes(o.sp, o.inst.level), p.role);
            if (r > bestRating) {
                best = o;
                bestRating = r;
            }
        }
        if (!best) continue;
        const copy: PokemonInstance = {
            ...p.inst,
            speciesId: best.inst.speciesId,
            level: best.inst.level,
            moves: [...best.inst.moves],
            ability: best.inst.ability,
        };
        const fresh = createPlayer(p.idx, p.team, p.slot, copy, p.role, bonusesOf(s, p.team));
        fresh.origin = p.inst;
        fresh.name = p.name;
        fresh.pos = p.pos;
        fresh.energy = p.energy;
        s.players[p.idx] = fresh;
        emit(s, { type: 'transform', by: p.idx, into: best.inst.speciesId, target: best.idx });
    }
}

/** Duas peças da mesma sinergia de história: passe de um, chute do outro = combo (1 por tempo). */
function comboLink(s: MatchState, shooter: PlayerState): { link: string; partner: number } | null {
    const lk = s.ball.lastKick;
    if (lk?.kind !== 'pass' || lk.receiverId !== shooter.idx || lk.by === shooter.idx) return null;
    if (s.tick - lk.tick > 4 * s.cfg.tickRate) return null;
    const partner = s.players[lk.by];
    if (!partner || partner.team !== shooter.team) return null;
    const rt = s.teams[shooter.team];
    const links = computeLinks(rt.lineup);
    const uidOf = (p: PlayerState) => (p.origin ?? p.inst).uid;
    const hit = links.find(
        (l) =>
            !rt.combosUsed.includes(l.def.id) &&
            l.members.includes(uidOf(shooter)) &&
            l.members.includes(uidOf(partner)),
    );
    return hit ? { link: hit.def.id, partner: partner.idx } : null;
}

function refreshAuras(s: MatchState) {
    s.auraHolders = s.players.filter((p) => p.ability.aura).map((p) => p.idx);
}

function setupKickoff(s: MatchState, team: 0 | 1) {
    applyPendingSubs(s);
    const { length, width } = s.cfg.pitch;
    for (const p of s.players) {
        const [xr, y] = s.teams[p.team].formation.kickoff[p.slot] ?? [10, 10];
        const yScaled = (y / 20) * width;
        p.pos = toWorld(s, p.team, xr * (length / 40), yScaled);
        p.vel = v(0, 0);
        p.heading = v(attackSign(p.team), 0);
        p.facing = p.team === 0 ? 2 : 6;
        p.action = Action.Idle;
        p.stun = 0;
        p.kickCooldown = 0;
        p.ai.nextDecision = 0;
        // bola parada: carga, voo e fuga não atravessam a saída de bola
        p.fx.charging = null;
        p.fx.air = null;
        p.fx.flee = null;
    }
    s.zones = [];
    s.setPiece = null;
    // quem dá a saída: o pivô vai para o círculo central
    const kicker =
        s.players.find((p) => p.team === team && p.role === 'PIVO') ??
        s.players.find((p) => p.team === team && p.slot === 4)!;
    kicker.pos = v(length / 2 - attackSign(team) * 0.3, width / 2);
    s.ball = {
        pos: v(length / 2, width / 2),
        vel: v(0, 0),
        z: 0,
        vz: 0,
        owner: kicker.idx,
        lastTouch: kicker.idx,
        lastKick: null,
        shot: null,
        assistCandidate: null,
    };
    kicker.ai.holdUntil = s.tick + Math.round(0.4 * s.cfg.tickRate);
    s.kickoffTeam = team;
    s.phase = 'kickoff';
    s.phaseTimer = 1;
    checkEvolutions(s);
}

/** Tempo de bola parada para a animação de evolução aparecer na tela. */
const EVOLVE_PAUSE = 3.5;

/**
 * Bola parada: quem jogou muito acima do normal para a posição evolui (uma vez por partida).
 * Ditto transformado não evolui; o Pokémon segue na mesma vaga, com fôlego e estatísticas.
 */
export function checkEvolutions(s: MatchState) {
    let any = false;
    const changed = new Set<0 | 1>();
    for (const p of s.players) {
        if (p.evolved || p.origin || p.inst.ability === 'imposter') continue;
        // a barra cheia de partidas anteriores espera ele fazer algo nesta: evoluir no apito inicial (ou na bola
        // parada em que entra) escondia a forma de antes (a quadra já abria com a nova, sem a tela de evolução)
        if (evoScore(p.stats, p.role) <= 0) continue;
        const into = evolutionTarget(p.inst.speciesId, p.inst.uid);
        if (into === null || evoProgress(p.inst, p.stats, p.role) < evoNeeded(p.team, s.teams[p.team].setup.manualSubs))
            continue;
        const inst = { ...evolveInstance(p.inst, into, p.role), evo: 0 };
        // a forma nova entra na escalação (tipo novo pode ligar ou desligar sinergias)
        s.teams[p.team].lineup[p.slot] = inst;
        changed.add(p.team);
        const fresh = createPlayer(p.idx, p.team, p.slot, inst, p.role, bonusesOf(s, p.team));
        Object.assign(fresh, {
            pos: p.pos,
            vel: p.vel,
            heading: p.heading,
            facing: p.facing,
            energy: p.energy,
            item: p.item,
            itemUsed: p.itemUsed,
            stats: p.stats,
            ai: p.ai,
            status: p.status,
            buffs: p.buffs,
            seeded: p.seeded,
            substitute: p.substitute,
            fx: p.fx,
            stun: p.stun,
            evade: p.evade,
            moveCooldown: p.moveCooldown,
            shotBonus: p.shotBonus,
            tackleBonus: p.tackleBonus,
            clutchAnnounced: p.clutchAnnounced,
            // golpe que continua (mesmo mudando de vaga) mantém os usos gastos; golpe novo chega cheio.
            // Vaga travada pela Choice Band (0 usos) não é uso gasto.
            moveUses: fresh.moveUses.map((u, i) => {
                const old = p.inst.moves.indexOf(inst.moves[i]);
                if (old < 0 || (p.item === 'choiceband' && old > 0)) return u;
                return Math.min(u, p.moveUses[old] ?? u);
            }),
            evolved: true,
        });
        s.players[p.idx] = fresh;
        emit(s, { type: 'evolve', by: p.idx, team: p.team, uid: inst.uid, from: p.inst.speciesId, into, role: p.role });
        any = true;
    }
    for (const team of changed) refreshTeamBonuses(s, team);
    if (any) {
        refreshAuras(s);
        s.phaseTimer = Math.max(s.phaseTimer, EVOLVE_PAUSE);
    }
}

// ---------------------------------------------------------------- eventos
type EventInput = MatchEvent extends infer E
    ? E extends MatchEvent
        ? Omit<E, 'tick' | 'half' | 'minute'>
        : never
    : never;

export function emit(s: MatchState, e: EventInput) {
    s.events.push({ ...e, tick: s.tick, half: s.half, minute: minuteOf(s) } as MatchEvent);
}

// ---------------------------------------------------------------- passo principal
/**
 * Avança a partida um tick (dt = 1/tickRate). `commands[i]` são os comandos do jogador i neste tick.
 * Determinístico: mesmo estado + mesmos comandos = mesmo resultado.
 */
export function step(s: MatchState, commands: (Command | Command[])[]) {
    if (s.finished) return;
    const dt = 1 / s.cfg.tickRate;
    s.tick++;
    if (s.teams[0].agency.max || s.teams[1].agency.max) updateMax(s);
    for (const t of s.teams) {
        t.screens.light = Math.max(0, t.screens.light - dt);
        t.screens.reflect = Math.max(0, t.screens.reflect - dt);
        t.screens.mist = Math.max(0, t.screens.mist - dt);
    }

    if (s.phase !== 'play') {
        updatePhase(s, dt, commands);
        return;
    }

    for (const p of s.players) {
        tickTimers(s, p, dt);
        // voando/cavando (Fly/Dig) e fugindo (Roar): o golpe manda no movimento
        if (p.fx.air) {
            updateAir(s, p, dt);
            continue;
        }
        if (p.fx.flee) {
            applyMovement(s, p, p.fx.flee.dir, true, dt);
            continue;
        }
        const cmds = commands[p.idx];
        const list = Array.isArray(cmds) ? cmds : cmds ? [cmds] : [];
        let moved = false;
        // carregando um golpe (Solar Beam, Skull Bash...): parado até soltar
        if (!isIncapacitated(p) && !p.fx.charging) {
            for (const c of list) {
                if (c.type === 'move' || c.type === 'skill') moved = true;
                applyCommand(s, p, c, dt);
                // o golpe começou a carga ou decolou (Fly/Dig): o resto das ordens do tick não vale
                if (p.fx.charging || p.fx.air) {
                    moved = true;
                    break;
                }
            }
        }
        if (!moved) applyMovement(s, p, v(0, 0), false, dt);
    }

    tickZones(s, dt);
    updateBall(s, dt);
    if (s.setPiece && s.phase === 'play') updateSetPiece(s);
    if (s.phase === 'play') checkPossession(s);
    if (s.ball.owner !== null) s.teams[s.players[s.ball.owner].team].possessionTicks++;

    s.time += dt;
    if (s.phase === 'play') updateClock(s);
    enterSegment(s);
}

/**
 * Fim do tempo normal: sorteia os acréscimos (`cfg.stoppage`, no `rng` da partida) e apita quando eles acabam. No
 * fim do 2º tempo, quem perde entra na Pressão final (`finalPressureTeam`).
 */
function updateClock(s: MatchState) {
    const cfg = s.cfg;
    if (s.added === null && s.time >= cfg.halfSeconds) {
        s.added = cfg.stoppage ? s.rng.int(cfg.stoppage.min, cfg.stoppage.max) : 0;
        if (s.added > 0) emit(s, { type: 'stoppage', minutes: s.added });
    }
    if (s.added !== null && s.time >= cfg.halfSeconds + (s.added * cfg.halfSeconds) / cfg.displayHalfMinutes) {
        endHalf(s);
        return;
    }
    const press = finalPressureTeam(s);
    if (press !== s.pressure) {
        s.pressure = press;
        emit(s, { type: 'pressure', team: press });
    }
}

/** Trecho do relógio de jogo em que a partida está (0–19 no tempo normal; 20 = pênaltis). */
export function segmentOf(s: MatchState): number {
    const halfTicks = Math.round(s.cfg.halfSeconds * s.cfg.tickRate);
    // acréscimos: o relógio parou no fim do tempo, o trecho também (o mesmo `floor(minute / 2)` da tela)
    const played = (s.half - 1) * halfTicks + Math.min(halfTicks, Math.round(s.time * s.cfg.tickRate));
    return Math.floor(played / segmentTicks(s.cfg));
}

/** Entrou num trecho novo: o `rng` recomeça da seed dele (duelo ao vivo). Sem seeds por trecho, nada muda. */
function enterSegment(s: MatchState) {
    if (!s.segmentSeeds) return;
    const k = segmentOf(s);
    if (k === s.segment) return;
    s.segment = k;
    const seed = s.segmentSeeds[k];
    if (seed !== undefined) s.rng = new Rng(seed, 'match');
}

function updatePhase(s: MatchState, dt: number, commands: (Command | Command[])[]) {
    // pedido de tempo: a bola parada espera a conversa do técnico
    if (s.tick >= s.pauseUntil) s.phaseTimer -= dt;
    for (const p of s.players) {
        tickTimers(s, p, dt);
        if (s.phase === 'goal') {
            // jogadores desaceleram; quem marcou comemora
            applyMovement(s, p, v(0, 0), false, dt);
        } else {
            p.vel = v(0, 0);
        }
    }
    if (s.phase === 'kickoff' && s.phaseTimer <= 0) {
        s.phase = 'play';
        emit(s, { type: 'kickoff', team: s.kickoffTeam });
    } else if (s.phase === 'goal' && s.phaseTimer <= 0) {
        setupKickoff(s, s.kickoffTeam);
    } else if (s.phase === 'restart' && s.phaseTimer <= 0) {
        s.phase = 'play';
    } else if (s.phase === 'corner' && s.phaseTimer <= 0) {
        takeCorner(s);
    } else if (s.phase === 'halftime' && s.phaseTimer <= 0) {
        s.half = 2;
        s.time = 0;
        s.added = null;
        setupKickoff(s, 1);
    }
    void commands;
}

function tickTimers(s: MatchState, p: PlayerState, dt: number) {
    p.kickCooldown = Math.max(0, p.kickCooldown - dt);
    p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
    p.moveCooldown = Math.max(0, p.moveCooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.evade = Math.max(0, p.evade - dt);
    if (p.actionTimer > 0) {
        p.actionTimer -= dt;
        if (p.actionTimer <= 0) p.action = Action.Idle;
    }
    for (const b of p.buffs) b.timer -= dt;
    p.substitute = Math.max(0, p.substitute - dt);
    // Leech Seed: o fôlego escorre para quem plantou
    if (p.seeded) {
        p.seeded.timer -= dt;
        const drain = Math.min(p.energy, 0.012 * dt);
        p.energy = Math.max(0, p.energy - drain);
        const by = s.players[p.seeded.by];
        if (by && by.team !== p.team) by.energy = Math.min(1, by.energy + drain);
        if (p.seeded.timer <= 0) p.seeded = null;
    }
    p.buffs = p.buffs.filter((b) => b.timer > 0);
    if (p.shotBonus) {
        p.shotBonus.timer -= dt;
        if (p.shotBonus.timer <= 0) p.shotBonus = null;
    }
    if (p.tackleBonus) {
        p.tackleBonus.timer -= dt;
        if (p.tackleBonus.timer <= 0) p.tackleBonus = null;
    }
    if (p.status) {
        p.status.timer -= dt;
        // Toxic: o veneno piora com o tempo (×1 → ×toxicMax)
        const toxic = p.fx.toxic > 0 ? 1 + (T.toxicMax - 1) * Math.min(1, p.fx.toxic / T.toxicTime) : 1;
        if (p.status.kind === 'psn' || p.status.kind === 'brn') p.energy = Math.max(0, p.energy - 0.004 * toxic * dt);
        if (p.status.timer <= 0) p.status = null;
    }
    // fôlego: gasto proporcional ao esforço, menor para quem tem muito HP
    const speedFrac = len(p.vel) / maxSpeed(s, p);
    let drain =
        (0.0008 + 0.0035 * speedFrac * speedFrac) *
        (1.3 - (0.6 * p.attr.stamina) / 99) *
        TACTIC_MODS[s.teams[p.team].tactic].drain;
    for (const o of s.players) {
        if (o.team !== p.team && o.ability.drainAura && dist(o.pos, p.pos) < 4) drain *= o.ability.drainAura;
    }
    const regen = (p.ability.regen ?? 0) + (p.item === 'leftovers' ? 0.0015 : 0);
    p.energy = clamp(p.energy - drain * dt + regen * dt, 0, 1);
    if (p.ability.clutch && !p.clutchAnnounced && p.energy < 0.45 && s.phase === 'play') {
        p.clutchAnnounced = true;
        emit(s, { type: 'ability', by: p.idx, ability: p.inst.ability, target: null });
    }
    tickTraits(s, p, dt);
}

// ---------------------------------------------------------------- traços de golpe (moves.ts → MOVE_TRAITS)
function traitFx(
    s: MatchState,
    by: number,
    fx: TraitFx,
    moveId: string,
    target: number | null = null,
    extra: { n?: number; x?: number; y?: number; r?: number; dur?: number } = {},
) {
    emit(s, { type: 'trait', by, fx, moveId, target, ...extra });
}

function tickTraits(s: MatchState, p: PlayerState, dt: number) {
    const fx = p.fx;
    fx.mini = Math.max(0, fx.mini - dt);
    fx.guard = Math.max(0, fx.guard - dt);
    fx.curl = Math.max(0, fx.curl - dt);
    if (fx.aim) {
        fx.aim.t -= dt;
        if (fx.aim.t <= 0) fx.aim = null;
    }
    if (fx.typeCopy) {
        fx.typeCopy.t -= dt;
        if (fx.typeCopy.t <= 0) fx.typeCopy = null;
    }
    if (fx.flee) {
        fx.flee.t -= dt;
        if (fx.flee.t <= 0) fx.flee = null;
    }
    if (fx.rage) {
        fx.rage.t -= dt;
        if (fx.rage.t <= 0) fx.rage = null;
    }
    if (fx.decoys > 0) {
        fx.decoyT -= dt;
        if (fx.decoyT <= 0) fx.decoys = 0;
    }
    if (p.status?.kind === 'psn' && fx.toxic > 0) fx.toxic += dt;
    else fx.toxic = 0;
    // bola parada (gol, tiro de meta, intervalo): a carga e o Bide se perdem
    if (s.phase !== 'play') loseCharge(s, p);
    if (fx.charging) {
        const c = fx.charging;
        c.t -= dt;
        if (p.stun > 0 && !c.armor) {
            // levou um tranco carregando: perdeu o golpe
            fx.charging = null;
            traitFx(s, p.idx, 'chargeLost', c.moveId);
        } else if (c.t <= 0) {
            fx.charging = null;
            releaseCharge(s, p, c.moveId);
        }
    }
    if (fx.bide) {
        fx.bide.t -= dt;
        if (fx.bide.t <= 0) {
            const hits = fx.bide.hits;
            fx.bide = null;
            releaseBide(s, p, hits);
        }
    }
}

/** A carga (Solar Beam, Skull Bash...) e o Bide acabam sem sair: avisa na tela e na narração. */
function loseCharge(s: MatchState, p: PlayerState) {
    const fx = p.fx;
    if (fx.charging) {
        const moveId = fx.charging.moveId;
        fx.charging = null;
        traitFx(s, p.idx, 'chargeLost', moveId);
    }
    if (fx.bide) {
        fx.bide = null;
        // o reforço de aguentar firme acaba junto
        p.buffs = p.buffs.filter((b) => b.src !== 'bide');
        traitFx(s, p.idx, 'chargeLost', 'bide');
    }
}

/** Zonas no chão: o anel de fogo queima e deixa lento quem passa; fumaça e muro só contam o tempo. */
function tickZones(s: MatchState, dt: number) {
    if (!s.zones.length) return;
    const pulse = s.tick % 10 === 0;
    for (const z of s.zones) {
        z.t -= dt;
        if (z.kind !== 'fire' || !pulse || z.t <= 0) continue;
        for (const o of s.players) {
            if (o.team === z.team || hidden(o) || dist(o.pos, z.pos) > z.r) continue;
            o.buffs.push({ attr: 'pace', factor: 0.75, timer: 0.6 });
            if (s.rng.chance(0.12)) applyStatus(s, o, 'brn', z.by, 'firespin');
        }
    }
    s.zones = s.zones.filter((z) => z.t > 0);
}

/** Alvo de chute automático (fim da carga, pouso do Fly/Dig): o canto longe do goleiro. */
function autoShotTarget(s: MatchState, p: PlayerState): Vec2 {
    const { width, goalWidth } = s.cfg.pitch;
    const gy = width / 2;
    const gk = s.players.find((o) => o.team !== p.team && o.role === 'GK');
    const side = gk ? (gk.pos.y > gy ? -1 : 1) : 1;
    return v(goalXFor(s, p.team), gy + side * 0.6 * (goalWidth / 2));
}

/** F3: a carga terminou, o golpe sai (com a bola: chute na hora). */
function releaseCharge(s: MatchState, p: PlayerState, moveId: string) {
    moveEffect(s, p, moveId, 0, true);
    if (s.ball.owner === p.idx && p.shotBonus?.moveId === moveId) {
        p.kickCooldown = 0;
        kick(s, p, 'shot', autoShotTarget(s, p), 1);
    }
}

/** F4: decola (Fly) ou entra no chão (Dig). Com a bola leva para a frente; sem a bola cai em cima de quem conduz. */
function takeOff(s: MatchState, p: PlayerState, moveId: string, hasBall: boolean): PlayerState | null {
    const kind = hasTrait(moveId, 'fly') ? 'fly' : 'dig';
    const { length, width } = s.cfg.pitch;
    const rel = toRel(s, p.team, p.pos);
    let to: Vec2;
    let prey: PlayerState | null = null;
    if (hasBall) {
        // por cima/por baixo da marcação, rumo ao gol e puxando para o meio
        to = toWorld(s, p.team, clamp(rel.x + T.airCarry, 2, length - 2.5), p.pos.y + (width / 2 - p.pos.y) * 0.4);
    } else {
        const c = s.ball.owner !== null ? s.players[s.ball.owner] : null;
        if (c && c.team !== p.team && !hidden(c) && dist(c.pos, p.pos) < T.airPounceRange) prey = c;
        to = prey ? prey.pos : toWorld(s, p.team, clamp(rel.x + T.airCarry, 2, length - 2), p.pos.y);
    }
    p.fx.air = { kind, moveId, t: T.airTime, from: p.pos, to, prey: prey?.idx ?? null };
    p.fx.charging = null;
    setAction(p, Action.Charge, T.airTime);
    traitFx(s, p.idx, kind, moveId, prey?.idx ?? null, { dur: T.airTime });
    return prey;
}

function updateAir(s: MatchState, p: PlayerState, dt: number) {
    const air = p.fx.air!;
    air.t -= dt;
    // a presa continua andando: o voo acompanha (chega colado nela)
    if (air.prey !== null) {
        const prey = s.players[air.prey];
        if (prey && dist(prey.pos, air.from) > 0.8) air.to = sub(prey.pos, scale(norm(sub(prey.pos, air.from)), 0.7));
    }
    const k = clamp(1 - air.t / T.airTime, 0, 1);
    const pos = add(air.from, scale(sub(air.to, air.from), k));
    p.vel = scale(sub(pos, p.pos), 1 / dt);
    p.pos = pos;
    if (len(p.vel) > 0.3) {
        p.heading = norm(p.vel);
        p.facing = dir8(p.heading, p.facing);
    }
    if (air.t > 0) return;
    p.fx.air = null;
    p.vel = v(0, 0);
    traitFx(s, p.idx, 'land', air.moveId, air.prey);
    if (s.phase !== 'play') return;
    const prof = moveProfile(air.moveId);
    const k2 = Math.min(1.25, prof.strength);
    if (s.ball.owner === p.idx) {
        p.shotBonus = {
            power: 1 + 0.3 * k2,
            accuracy: 1 + 0.2 * k2,
            moveType: prof.data.type,
            moveId: air.moveId,
            timer: 1.5,
        };
        p.kickCooldown = 0;
        kick(s, p, 'shot', autoShotTarget(s, p), 1);
        return;
    }
    p.tackleBonus = { power: 1 + 0.4 * k2, accuracy: 1, moveType: prof.data.type, moveId: air.moveId, timer: 1.5 };
    const prey = air.prey ?? s.ball.owner;
    if (prey !== null && s.players[prey].team !== p.team) {
        p.tackleCooldown = 0;
        tryTackle(s, p, prey);
    }
}

/** F10: Bide solta a onda guardada (mais forte quanto mais apanhou). */
function releaseBide(s: MatchState, p: PlayerState, hits: number) {
    const power = Math.min(1 + hits, 4);
    const near = s.players.filter((o) => o.team !== p.team && !hidden(o) && dist(o.pos, p.pos) < T.bideRadius);
    for (const o of near) {
        if (protect(s, o, p, 'physical')) continue;
        knockback(s, o, p, 0.8 + 0.4 * power, 'bide');
        o.stun = Math.max(o.stun, 0.3 + 0.25 * power);
        if (s.ball.owner === o.idx) popBall(s, o, p);
    }
    setAction(p, Action.Tackle, 0.4);
    traitFx(s, p.idx, 'bide', 'bide', near[0]?.idx ?? null, { n: hits, r: T.bideRadius });
}

/** Quem conduz levou um golpe em cheio: a bola escapa do pé. */
function popBall(s: MatchState, victim: PlayerState, from: PlayerState) {
    const ball = s.ball;
    if (ball.owner !== victim.idx) return;
    ball.owner = null;
    ball.lastTouch = from.idx;
    ball.assistCandidate = null;
    ball.vel = scale(norm(sub(victim.pos, from.pos)), 3);
    ball.lastKick = { by: from.idx, kind: 'clear', tick: s.tick };
    victim.kickCooldown = Math.max(victim.kickCooldown, 0.4);
}

/** Whirlwind/Gust: a ventania sopra a bola solta para longe. */
function blowBall(s: MatchState, p: PlayerState, moveId: string) {
    const ball = s.ball;
    if (ball.owner !== null || ball.shot || dist(ball.pos, p.pos) > 7) return;
    ball.vel = scale(norm(sub(ball.pos, p.pos)), T.blowSpeed);
    ball.z = 0;
    ball.vz = 0;
    ball.lastTouch = p.idx;
    ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
    traitFx(s, p.idx, 'blowBall', moveId);
}

/** Rage e Bide contam cada pancada sofrida. */
function onHurt(s: MatchState, target: PlayerState) {
    const fx = target.fx;
    if (fx.bide) fx.bide.hits++;
    if (fx.rage && fx.rage.stacks < T.rageMax) {
        fx.rage.stacks++;
        const f = 1 + T.rageStep;
        target.buffs.push(
            { attr: 'shooting', factor: f, timer: fx.rage.t },
            { attr: 'strength', factor: f, timer: fx.rage.t },
        );
        traitFx(s, target.idx, 'rageUp', 'rage', null, { n: fx.rage.stacks });
    }
}

/** F2: chance de crítico (cresce com o pace, como a Speed da Gen 1). */
const critChance = (s: MatchState, p: PlayerState) => T.critChance + (T.critPace * eff(s, p, 'pace')) / 99;

/** F8: quantas tentativas o golpe dá (2–5 com a distribuição da Gen 1: 2 e 3 são o mais comum). */
function multiHits(s: MatchState, moveId: string): number {
    if (hasTrait(moveId, 'multi2')) return 2;
    if (hasTrait(moveId, 'multi25')) return s.rng.pick([2, 2, 2, 3, 3, 3, 4, 5]);
    return 1;
}

/** Erro do chute/passe: areia no olho, Kinesis, Flash e fumaça no chão. */
function aimFactor(s: MatchState, p: PlayerState, kind: 'pass' | 'shot'): number {
    let f = 1;
    const aim = p.fx.aim;
    if (aim && (kind === 'shot' || !aim.once)) {
        f *= aim.factor;
        if (aim.once) p.fx.aim = null;
    }
    for (const z of s.zones) if (z.kind === 'smoke' && dist(z.pos, p.pos) < z.r) f *= T.smokeAim;
    return f;
}

function addZone(
    s: MatchState,
    p: PlayerState,
    kind: 'smoke' | 'fire' | 'wall',
    pos: Vec2,
    r: number,
    t: number,
    moveId: string,
) {
    s.zones.push({ kind, pos, r, t, team: p.team, by: p.idx });
    traitFx(s, p.idx, kind === 'wall' ? 'wall' : 'zone', moveId, null, {
        x: Math.round(pos.x * 100) / 100,
        y: Math.round(pos.y * 100) / 100,
        r,
        dur: t,
    });
}

export function maxSpeed(s: MatchState, p: PlayerState): number {
    const pace = eff(s, p, 'pace');
    const base = 2.6 + (4.2 * pace) / 99;
    return s.ball.owner === p.idx ? base * (0.8 + (0.12 * eff(s, p, 'dribble')) / 99) : base;
}

function setAction(p: PlayerState, action: Action, duration: number) {
    p.action = action;
    p.actionTimer = duration;
}

// ---------------------------------------------------------------- comandos
function applyCommand(s: MatchState, p: PlayerState, c: Command, dt: number) {
    switch (c.type) {
        case 'move':
            applyMovement(s, p, c.dir, c.sprint, dt);
            break;
        case 'pass':
            if (s.ball.owner === p.idx && p.kickCooldown <= 0) kick(s, p, 'pass', c.target, c.power, c.receiverId);
            break;
        case 'shoot':
            if (s.ball.owner === p.idx && p.kickCooldown <= 0) kick(s, p, 'shot', c.target, c.power);
            break;
        case 'tackle':
            tryTackle(s, p, c.targetId);
            break;
        case 'skill':
            if (s.ball.owner === p.idx && p.evade <= 0) {
                p.evade = 0.6;
                p.energy = Math.max(0, p.energy - 0.01);
                applyMovement(s, p, c.dir, true, dt);
                emit(s, { type: 'skill', by: p.idx });
            }
            break;
        case 'useMove':
            performMove(s, p, c.slot);
            break;
        default:
            break;
    }
}

function applyMovement(s: MatchState, p: PlayerState, dir: Vec2, sprint: boolean, dt: number) {
    let desiredDir = truncate(dir, 1);
    if (isIncapacitated(p)) desiredDir = v(0, 0);
    if (p.status?.kind === 'confusion' && len(desiredDir) > 0.1)
        desiredDir = rotate(desiredDir, s.rng.range(-0.9, 0.9));
    const top = maxSpeed(s, p) * (sprint ? 1 : 0.72);
    const desired = scale(desiredDir, top);
    const accel = (5 + (9 * eff(s, p, 'pace')) / 99) * dt;
    const dv = truncate(sub(desired, p.vel), accel);
    p.vel = add(p.vel, dv);
    p.pos = add(p.pos, scale(p.vel, dt));
    const { length, width } = s.cfg.pitch;
    // goleiro pode pisar na linha; quem conduz a bola fica dentro da quadra
    const margin = s.ball.owner === p.idx ? -0.4 : 0.3;
    p.pos = v(clamp(p.pos.x, -margin, length + margin), clamp(p.pos.y, 0.2, width - 0.2));
    if (len(p.vel) > 0.3) {
        p.heading = norm(p.vel);
        p.facing = dir8(p.heading, p.facing);
        if (p.actionTimer <= 0) p.action = Action.Run;
    } else if (p.actionTimer <= 0) {
        p.action = Action.Idle;
    }
}

function kick(
    s: MatchState,
    p: PlayerState,
    kind: 'pass' | 'shot',
    target: Vec2,
    power: number,
    receiverId?: number,
    /** Erro extra do chute (cabeçada e voleio do escanteio). */
    aim = 1,
) {
    const ball = s.ball;
    // a curta do escanteio acaba no chute de primeira (que sai menos preciso)
    if (kind === 'shot' && s.setPiece?.play === 'short' && s.setPiece.roles.outside === p.idx) {
        s.setPiece = null;
        aim *= CORNER_TUNING.firstTimeAim;
    }
    const toTarget = sub(target, p.pos);
    const distance = len(toTarget);
    let speed: number;
    let sigma: number;
    let moveId: string | null = null;
    let moveType = typesOf(p)[0];
    let lob = false;

    if (kind === 'pass') {
        const passing = eff(s, p, 'passing');
        speed = clamp(Math.sqrt(2 * FRICTION * distance) * 1.05 + 2.2, 5, 17) * clamp(power, 0.6, 1.3);
        sigma = 0.1 * (1.3 - passing / 99);
        setAction(p, Action.Kick, 0.3);
        p.stats.passes++;
        ball.assistCandidate = p.idx;
        emit(s, { type: 'pass', by: p.idx, to: receiverId ?? null });
    } else {
        // golpe máximo do capitão: armado, o chute da zona sai com a versão máxima do golpe dele
        const max = s.teams[p.team].agency.max;
        if (max && !max.live && max.idx === p.idx && p.captain && p.role !== 'GK' && inMaxZoneOf(s, p)) maxShot(s, p);
        const shooting = eff(s, p, 'shooting');
        const bonus = p.shotBonus;
        // Scope Lens: chute crítico
        const scope = p.item === 'scopelens' && s.rng.chance(0.2);
        // golpe de crítico fácil (Slash, Karate Chop...) e Focus Energy (crítico garantido no próximo)
        const moveCrit = !scope && !!bonus && hasTrait(bonus.moveId, 'crit') && s.rng.chance(critChance(s, p));
        const focusCrit = p.fx.focus;
        p.fx.focus = false;
        const crit = scope || moveCrit || focusCrit;
        const fixed = bonus?.fixedSpeed;
        lob = !!bonus && hasTrait(bonus.moveId, 'lob');
        // combo de sinergia: chute mais forte e mais preciso
        const combo = comboLink(s, p);
        const comboMult = combo ? 1.2 : 1;
        if (combo) {
            s.teams[p.team].combosUsed.push(combo.link);
            emit(s, { type: 'combo', by: p.idx, partner: combo.partner, link: combo.link });
        }
        // dano fixo (Sonic Boom, Dragon Rage...): velocidade fixa, não depende do atributo
        speed = fixed
            ? fixed
            : (10 + (15 * shooting) / 99) *
              clamp(power, 0.5, 1.1) *
              (bonus?.power ?? 1) *
              (crit ? T.critSpeed : 1) *
              comboMult;
        sigma =
            (0.07 * (1.3 - shooting / 99) * (1 + distance / 15)) /
            (bonus?.accuracy ?? 1) /
            (crit ? T.critAim : 1) /
            (combo ? 1.5 : 1);
        // Swift nunca erra: chute bem mais certeiro
        if (bonus && hasTrait(bonus.moveId, 'sureHit')) sigma *= T.sureHitAim;
        if (scope) emit(s, { type: 'item', by: p.idx, item: 'scopelens', effect: 'crit' });
        else if (crit) traitFx(s, p.idx, 'crit', bonus?.moveId ?? 'focusenergy');
        if (bonus && fixed) traitFx(s, p.idx, 'fixed', bonus.moveId, null, { n: Math.round(fixed) });
        if (bonus) {
            moveId = bonus.moveId;
            moveType = bonus.moveType;
            p.shotBonus = null;
        }
        setAction(p, bonus ? Action.Shoot : Action.Kick, 0.4);
        p.stats.shots++;
        const xg = expectedGoals(p.pos, goalXFor(s, p.team), s.cfg.pitch.width / 2, s.cfg.pitch.goalWidth);
        ball.shot = { by: p.idx, xg, moveId, moveType, gkChecked: false, blockedBy: [], onTarget: false };
        emit(s, { type: 'shot', by: p.idx, xg, moveId });
    }

    sigma *= aimFactor(s, p, kind) * aim;
    const dir = rotate(norm(toTarget), s.rng.gauss() * sigma);
    ball.vel = scale(dir, speed);
    ball.z = 0;
    ball.vz = 0;
    if (lob) {
        // Egg Bomb: cobertura, a bola sobe por cima dos bloqueios e cai perto do gol
        const flight = clamp(distance / 10, 1.1, 1.6);
        ball.vel = scale(dir, (0.95 * distance) / flight);
        ball.vz = (GRAVITY * flight) / 2;
        ball.z = 0.05;
        traitFx(s, p.idx, 'lob', moveId ?? 'eggbomb');
    } else if (kind === 'pass' && distance >= LOB_MIN) {
        // bola cruzada: voa por ~85% do caminho e quica perto do alvo
        const flight = clamp(distance / 13, 0.85, 1.45);
        ball.vel = scale(dir, (0.85 * distance) / flight);
        ball.vz = (GRAVITY * flight) / 2;
        ball.z = 0.05;
    }
    ball.owner = null;
    ball.lastTouch = p.idx;
    ball.lastKick = { by: p.idx, kind, tick: s.tick, receiverId };
    ball.pos = add(p.pos, scale(dir, DRIBBLE_OFFSET + 0.1));
    if (kind === 'shot') {
        // marca se a trajetória (sem considerar goleiro) vai na direção do gol
        const gx = goalXFor(s, p.team);
        const t = (gx - ball.pos.x) / (ball.vel.x || 1e-9);
        const yAtGoal = ball.pos.y + ball.vel.y * t;
        const onTarget = t > 0 && Math.abs(yAtGoal - s.cfg.pitch.width / 2) < s.cfg.pitch.goalWidth / 2;
        if (ball.shot) ball.shot.onTarget = onTarget;
        if (onTarget) p.stats.shotsOnTarget++;
    }
    p.kickCooldown = 0.35;
    p.heading = dir;
    p.facing = dir8(dir, p.facing);
    p.energy = Math.max(0, p.energy - (kind === 'shot' ? 0.006 : 0.002));
}

function tryTackle(s: MatchState, p: PlayerState, targetId: number) {
    const ball = s.ball;
    const carrier = s.players[targetId];
    // voando/cavando ninguém alcança
    if (!carrier || carrier.team === p.team || ball.owner !== targetId || hidden(carrier)) return;
    const bonus = p.tackleBonus;
    // chicote, pedra, osso, Wrap/Bind: desarme de longe
    const range = hasTrait(bonus?.moveId, 'reach') ? T.reachRange : TACKLE_RANGE;
    const gap = dist(p.pos, carrier.pos);
    if (p.tackleCooldown > 0 || gap > range) return;

    p.tackleCooldown = 1.1;
    p.stats.tackles++;
    setAction(p, Action.Tackle, 0.35);
    p.heading = norm(sub(carrier.pos, p.pos));
    p.facing = dir8(p.heading, p.facing);
    if (bonus && gap > TACKLE_RANGE) traitFx(s, p.idx, 'reach', bonus.moveId, carrier.idx);
    // Counter devolve / um clone do Double Team ou o boneco do Substitute aguenta o carrinho
    if (protect(s, carrier, p, 'physical')) {
        p.tackleBonus = null;
        emit(s, { type: 'tackle', by: p.idx, victim: carrier.idx, success: false });
        return;
    }
    // ninguém tira a bola dele (Skull Bash carregando, Clamp, Withdraw, Acid Armor); Defense Curl segura um carrinho
    const curl = carrier.fx.curl > 0;
    if (carrier.fx.guard > 0 || curl) {
        if (curl) carrier.fx.curl = 0;
        p.tackleBonus = null;
        emit(s, { type: 'tackle', by: p.idx, victim: carrier.idx, success: false });
        traitFx(
            s,
            carrier.idx,
            curl ? 'curl' : 'guard',
            curl ? 'defensecurl' : carrier.fx.guardMove || 'withdraw',
            p.idx,
        );
        p.stun = 0.55;
        setAction(p, Action.Hurt, 0.55);
        return;
    }

    const atkTypes = bonus ? [bonus.moveType] : typesOf(p);
    const tackleTypeMult = dpow(typeMultiplier(atkTypes, typesOf(carrier)), p.ability.typeBoost ?? 1);
    const keepTypeMult = dpow(typeMultiplier(typesOf(carrier), typesOf(p)), carrier.ability.typeBoost ?? 1);
    // desarme por trás é mais difícil (o Cut corta de qualquer lado)
    const behind =
        carrier.heading.x * (p.pos.x - carrier.pos.x) + carrier.heading.y * (p.pos.y - carrier.pos.y) < 0 &&
        !hasTrait(bonus?.moveId, 'pierce');
    // Minimize: pequenininho, difícil de pegar (Stomp ignora)
    const dodge = carrier.fx.mini > 0 && !hasTrait(bonus?.moveId, 'stompMini') ? T.minimizeDodge : 1;
    // crítico: golpe de crítico fácil ou Focus Energy ganham a dividida direto
    const focusCrit = p.fx.focus;
    p.fx.focus = false;
    const crit = focusCrit || (!!bonus && hasTrait(bonus.moveId, 'crit') && s.rng.chance(critChance(s, p)));
    // multi-acerto: várias tentativas seguidas, cada uma mais fraca
    const hits = bonus ? multiHits(s, bonus.moveId) : 1;
    let success = false;
    let tries = 0;
    for (let i = 0; i < hits && !success; i++) {
        tries++;
        const attack =
            (0.75 * eff(s, p, 'tackling') + 0.25 * eff(s, p, 'strength')) *
            tackleTypeMult *
            (bonus?.power ?? 1) *
            dpow(T.multiFalloff, i) *
            (p.item === 'quickclaw' ? 1.15 : 1) *
            (behind ? 0.85 : 1) *
            dodge *
            // Reflect do time de quem tem a bola: carrinho mais fraco
            (s.teams[carrier.team].screens.reflect > 0 ? 0.7 : 1) *
            s.rng.range(0.72, 1.28);
        const defend =
            (0.65 * eff(s, carrier, 'dribble') + 0.35 * eff(s, carrier, 'strength')) *
            keepTypeMult *
            (carrier.evade > 0 ? 1.3 : 1) *
            (carrier.item === 'quickclaw' ? 1.15 : 1) *
            s.rng.range(0.72, 1.28);
        success = crit || attack > defend;
        // cada tentativa que não levou a bola ainda pode deixar o secundário (Twineedle envenena)
        if (!success && hits > 1 && bonus) applySecondary(s, p, carrier, bonus.moveId);
    }
    if (bonus) p.tackleBonus = null;

    emit(s, { type: 'tackle', by: p.idx, victim: carrier.idx, success });
    if (crit && bonus) traitFx(s, p.idx, 'crit', bonus.moveId, carrier.idx);
    else if (crit) traitFx(s, p.idx, 'crit', 'focusenergy', carrier.idx);
    if (bonus && hits > 1) traitFx(s, p.idx, 'multi', bonus.moveId, carrier.idx, { n: tries });

    // habilidades de contato do portador (Static, Poison Point, Cute Charm…)
    const contact = carrier.ability.onTackled;
    if (contact && s.rng.chance(contact.chance)) {
        if (applyStatus(s, p, contact.status, carrier.idx, carrier.inst.ability)) {
            emit(s, { type: 'ability', by: carrier.idx, ability: carrier.inst.ability, target: p.idx });
        }
    }

    if (success) {
        p.stats.tacklesWon++;
        setAction(carrier, Action.Hurt, 0.45);
        carrier.stun = 0.35;
        // carregando um golpe e levou o carrinho: perdeu o golpe
        if (carrier.fx.charging && !carrier.fx.charging.armor) {
            traitFx(s, carrier.idx, 'chargeLost', carrier.fx.charging.moveId, p.idx);
            carrier.fx.charging = null;
        }
        if (bonus) {
            const id = bonus.moveId;
            // carrinho com golpe: derruba, empurra e pode aplicar o efeito secundário
            const push = OHKO.has(id)
                ? 2.6
                : hasTrait(id, 'throw')
                  ? T.throwMeters
                  : hasTrait(id, 'bulldoze')
                    ? T.bulldoze
                    : 1.4;
            knockback(s, carrier, p, push, id);
            applySecondary(s, p, carrier, id);
            if (TRAP.has(id)) trap(carrier, id);
            // nocaute (Fissure, Guillotine, Horn Drill): fica um bom tempo no chão
            if (OHKO.has(id)) {
                carrier.stun = Math.max(carrier.stun, T.ohkoStun);
                setAction(carrier, Action.Hurt, T.ohkoStun);
            }
            // Seismic Toss: arremesso de tempo fixo, sem depender da força
            if (hasTrait(id, 'throw')) {
                const t = T.fixedStun[id] ?? 1;
                carrier.stun = Math.max(carrier.stun, t);
                setAction(carrier, Action.Hurt, t);
                traitFx(s, p.idx, 'throw', id, carrier.idx);
            }
            // Low Kick: quanto mais pesado, mais tempo no chão
            if (hasTrait(id, 'heavyTrip')) {
                const t = clamp(0.4 + carrier.sp.weightkg * T.tripPerKg, 0.5, T.tripMax);
                carrier.stun = Math.max(carrier.stun, t);
                setAction(carrier, Action.Hurt, t);
                traitFx(s, p.idx, 'trip', id, carrier.idx, { n: Math.round(carrier.sp.weightkg) });
            }
            // Super Fang: metade do fôlego
            if (hasTrait(id, 'halfEnergy')) {
                carrier.energy *= 1 - T.superFang;
                traitFx(s, p.idx, 'halfEnergy', id, carrier.idx);
            }
            if (hasTrait(id, 'bulldoze')) traitFx(s, p.idx, 'bulldoze', id, carrier.idx);
        } else onHurt(s, carrier);
        carrier.kickCooldown = 0.4;
        if (carrier.ability.onTackledBoost) {
            for (const [k, f] of Object.entries(carrier.ability.onTackledBoost)) {
                carrier.buffs.push({ attr: k as AttrKey, factor: f, timer: 10 });
            }
            emit(s, { type: 'ability', by: carrier.idx, ability: carrier.inst.ability, target: null });
        }
        if (bonus && hasTrait(bonus.moveId, 'wrap')) {
            // Wrap/Bind: os dois ficam presos e a bola sobra para quem chegar
            carrier.stun = Math.max(carrier.stun, T.wrapTime);
            p.stun = Math.max(p.stun, T.wrapTime);
            setAction(carrier, Action.Hurt, T.wrapTime);
            setAction(p, Action.Hurt, T.wrapTime);
            ball.owner = null;
            ball.lastTouch = p.idx;
            ball.assistCandidate = null;
            ball.vel = scale(norm(sub(carrier.pos, p.pos)), 2);
            ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
            traitFx(s, p.idx, 'wrap', bonus.moveId, carrier.idx, { dur: T.wrapTime });
        } else if ((bonus && hasTrait(bonus.moveId, 'clamp')) || s.rng.chance(0.55)) {
            ball.owner = p.idx;
            ball.lastTouch = p.idx;
            ball.assistCandidate = null;
            ball.vel = v(0, 0);
            // Clamp: fecha a concha com a bola dentro
            if (bonus && hasTrait(bonus.moveId, 'clamp')) {
                p.fx.guard = Math.max(p.fx.guard, T.clampHold);
                p.fx.guardMove = bonus.moveId;
                traitFx(s, p.idx, 'clampHold', bonus.moveId, carrier.idx, { dur: T.clampHold });
            }
        } else {
            const away = rotate(norm(sub(carrier.pos, p.pos)), s.rng.range(-1.2, 1.2));
            ball.owner = null;
            ball.lastTouch = p.idx;
            ball.vel = scale(away, s.rng.range(3, 6));
            ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
        }
    } else {
        p.stun = 0.55;
        setAction(p, Action.Hurt, 0.55);
    }
}

// ---------------------------------------------------------------- golpes
export function nearestOpponent(
    s: MatchState,
    p: PlayerState,
    maxDist = Infinity,
    filter: (o: PlayerState) => boolean = () => true,
): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = maxDist;
    for (const o of s.players) {
        if (o.team === p.team || hidden(o) || !filter(o)) continue;
        const d = dist(o.pos, p.pos);
        if (d < bestD) {
            bestD = d;
            best = o;
        }
    }
    return best;
}

export function applyStatus(
    s: MatchState,
    target: PlayerState,
    status: StatusKind | 'infatuation',
    by: number | null,
    source: string,
): boolean {
    if (target.status) return false;
    if (isStatusImmune(target.ability, status)) {
        // a habilidade segura o status: aparece na tela (só golpe ou contato de rival; o anel de fogo pega toda hora)
        if (by !== null && by !== target.idx && source !== 'firespin')
            emit(s, { type: 'ability', by: target.idx, ability: target.inst.ability, target: by, blocked: true });
        return false;
    }
    const selfInflicted = by === target.idx;
    if (
        !selfInflicted &&
        !target.itemUsed &&
        (target.item === 'lumberry' || (target.item === 'focussash' && target.role !== 'GK'))
    ) {
        target.itemUsed = true;
        emit(s, {
            type: 'item',
            by: target.idx,
            item: target.item,
            effect: target.item === 'lumberry' ? 'cure' : 'endure',
        });
        return false;
    }
    const duration = STATUS_DURATION[status] * (target.ability.statusDuration ?? 1);
    target.status = { kind: status, timer: duration };
    if (status === 'slp' || status === 'frz') setAction(target, Action.Hurt, duration);
    emit(s, { type: 'status', target: target.idx, status, by, source });
    return true;
}

/** Empurra `target` para longe de `from` (golpes que acertam em cheio). */
function knockback(s: MatchState, target: PlayerState, from: PlayerState, meters: number, moveId: string) {
    const dir = norm(sub(target.pos, from.pos));
    const { length, width } = s.cfg.pitch;
    const to = add(target.pos, scale(dir, meters));
    target.pos = v(clamp(to.x, 0, length), clamp(to.y, 0.2, width - 0.2));
    target.vel = v(0, 0);
    target.stun = Math.max(target.stun, 0.35);
    setAction(target, Action.Hurt, 0.45);
    emit(s, { type: 'knockback', target: target.idx, by: from.idx, moveId });
    if (from.team !== target.team) onHurt(s, target);
}

const SECONDARY_STATUS: Record<string, StatusKind> = {
    par: 'par',
    brn: 'brn',
    frz: 'frz',
    psn: 'psn',
    tox: 'psn',
    slp: 'slp',
};

/**
 * Efeito secundário do golpe (Thunderbolt paralisa, Flamethrower queima, Bite faz hesitar…).
 * Turbinado em relação aos jogos — é futsal Pokémon, os efeitos precisam aparecer.
 */
function applySecondary(s: MatchState, user: PlayerState, target: PlayerState, moveId: string): boolean {
    const move = MOVES[moveId];
    if (user.item === 'kingsrock' && move?.category !== 'Status' && s.rng.chance(0.3)) {
        target.stun = Math.max(target.stun, 0.7);
        setAction(target, Action.Hurt, 0.7);
        emit(s, { type: 'status', target: target.idx, status: 'flinch', by: user.idx, source: 'kingsrock' });
        return true;
    }
    const sec = move?.secondary;
    if (!sec) return false;
    const chance = Math.min(0.65, (sec.chance / 100) * 3 + 0.05) * (user.ability.statusChanceBoost ?? 1);
    if (!s.rng.chance(chance)) return false;
    // Tri Attack: sorteia queimar, congelar ou paralisar
    const pick = SECONDARY_PICK[moveId];
    if (pick) return applyStatus(s, target, s.rng.pick(pick), user.idx, moveId);
    if (sec.status && SECONDARY_STATUS[sec.status]) {
        return applyStatus(s, target, SECONDARY_STATUS[sec.status], user.idx, moveId);
    }
    if (sec.volatile === 'confusion') return applyStatus(s, target, 'confusion', user.idx, moveId);
    if (sec.volatile === 'flinch') {
        target.stun = Math.max(target.stun, 0.7);
        setAction(target, Action.Hurt, 0.7);
        emit(s, { type: 'status', target: target.idx, status: 'flinch', by: user.idx, source: moveId });
        return true;
    }
    if (sec.boosts && !target.ability.immuneDebuff) {
        for (const [stat, stages] of Object.entries(sec.boosts)) {
            for (const attr of BOOST_TO_ATTR[stat] ?? []) {
                target.buffs.push({ attr, factor: 1 + 0.1 * (stages ?? -1), timer: T.debuffTime });
            }
        }
        return true;
    }
    return false;
}

/** Counter/Substitute do alvo: o golpe ou carrinho de `attacker` não pega. Devolve true se foi bloqueado. */
function protect(s: MatchState, target: PlayerState, attacker: PlayerState, kind: 'physical' | 'special'): boolean {
    if (isIncapacitated(target)) return false;
    // Counter: reação automática, 1 vez por partida, devolve o golpe em quem atacou
    const slot = target.inst.moves.indexOf('counter');
    if (slot >= 0 && target.moveUses[slot] > 0) {
        target.moveUses[slot]--;
        target.stats.movesUsed++;
        setAction(target, Action.Tackle, 0.35);
        attacker.stun = Math.max(attacker.stun, 0.9);
        attacker.energy = Math.max(0, attacker.energy - 0.05);
        knockback(s, attacker, target, 1.6, 'counter');
        emit(s, {
            type: 'move',
            by: target.idx,
            moveId: 'counter',
            kind: 'special',
            target: attacker.idx,
            effectiveness: null,
            hit: true,
            withBall: s.ball.owner === target.idx,
        });
        return true;
    }
    // Double Team: o golpe acerta um clone
    if (target.fx.decoys > 0) {
        target.fx.decoys--;
        traitFx(s, target.idx, 'clone', 'doubleteam', attacker.idx, { n: target.fx.decoys });
        return true;
    }
    if (target.substitute > 0) {
        target.substitute = 0;
        emit(s, { type: 'decoy', by: target.idx, attacker: attacker.idx });
        return true;
    }
    void kind;
    return false;
}

/** Fator das paredes do time do alvo (Light Screen corta golpes especiais/status pela metade). */
const screenFactor = (s: MatchState, target: PlayerState, special: boolean) =>
    special && s.teams[target.team].screens.light > 0 ? 0.5 : 1;

function performMove(s: MatchState, p: PlayerState, slot: number) {
    const moveId = p.inst.moves[slot];
    if (!moveId || p.moveUses[slot] <= 0 || p.moveCooldown > 0 || s.tick < s.nextMoveTick) return;
    // Counter é reação (dispara sozinho ao receber um golpe), não se usa
    if (moveId === 'counter') return;
    p.moveUses[slot]--;
    p.moveCooldown = MOVE_COOLDOWN;
    s.nextMoveTick = s.tick + Math.round(MOVE_GAP * s.cfg.tickRate);
    p.stats.movesUsed++;
    moveEffect(s, p, moveId);
}

/** Efeito de um golpe (também usado por Metronome e Mirror Move/Mimic, que disparam outro golpe). */
function moveEffect(s: MatchState, p: PlayerState, moveId: string, depth = 0, charged = false) {
    const prof = moveProfile(moveId);
    const hasBall = s.ball.owner === p.idx;
    // F3 carga: fica parado brilhando e o golpe só sai quando a carga termina (tickTraits → releaseCharge)
    if (hasTrait(moveId, 'charge') && !charged) {
        const armor = hasTrait(moveId, 'chargeArmor');
        p.fx.charging = { moveId, t: T.chargeTime, armor };
        if (armor) {
            p.fx.guard = Math.max(p.fx.guard, T.chargeTime);
            p.fx.guardMove = moveId;
        }
        p.vel = v(0, 0);
        setAction(p, Action.Charge, T.chargeTime);
        traitFx(s, p.idx, 'charge', moveId, null, { dur: T.chargeTime });
        return;
    }
    const technician =
        p.ability.weakMoveBoost && prof.data.power > 0 && prof.data.power <= 60 ? p.ability.weakMoveBoost : 1;
    const typeItem = p.item && ITEMS[p.item]?.type === prof.data.type ? 1.2 : 1;
    // golpe treinado (MT): o que o próprio jogador usa, não o que o Metronome/Mimic sorteia
    const taught = depth === 0 && isTaught(p.inst, moveId) ? TAUGHT_MOVE.power : 1;
    const k = charged
        ? Math.min(1.6, prof.strength * technician * typeItem * taught * T.chargePower)
        : Math.min(1.25, prof.strength * technician * typeItem * taught);
    let target: PlayerState | null = null;
    let effectiveness: number | null = null;
    let hit = true;
    let after: (() => void) | null = null;
    const area = hasTrait(moveId, 'area') || hasTrait(moveId, 'areaAll');

    // golpe físico e chute com golpe também podem errar (precisão do golpe; nocaute só 30%). Swift nunca erra.
    const landed =
        hasTrait(moveId, 'sureHit') ||
        (prof.kind !== 'strike' && prof.kind !== 'blast') ||
        s.rng.chance(prof.data.accuracy / 100);

    // goleiro: o golpe de ataque vira defesa (Body Slam, Submission, Petal Dance...) no chute que vem
    const incoming = s.ball.shot;
    const gkSave =
        p.role === 'GK' &&
        !hasBall &&
        (prof.kind === 'strike' || prof.kind === 'blast') &&
        incoming !== null &&
        s.players[incoming.by].team !== p.team;

    switch (gkSave ? 'gkSave' : prof.kind) {
        case 'gkSave':
            hit = landed;
            if (landed) p.buffs.push({ attr: 'goalkeeping', factor: 1 + T.gkSaveBoost * k, timer: T.gkSaveTime });
            break;
        case 'strike':
            if (!landed) {
                hit = false;
                // Jump Kick/High Jump Kick: errou, se machucou
                if (DRAWBACK[moveId] === 'crash') {
                    p.energy = Math.max(0, p.energy - T.crashEnergy);
                    p.stun = Math.max(p.stun, T.crashStun);
                    setAction(p, Action.Hurt, T.crashStun);
                }
                break;
            }
            if (hasTrait(moveId, 'fly') || hasTrait(moveId, 'dig')) {
                // F4: some do mapa e reaparece à frente (com a bola) ou em cima de quem conduz
                target = takeOff(s, p, moveId, hasBall);
                break;
            }
            if (hasBall) {
                p.shotBonus = {
                    power: 1 + 0.3 * k,
                    accuracy: 1 + 0.2 * k,
                    moveType: prof.data.type,
                    moveId,
                    timer: 1.5,
                    fixedSpeed: T.fixedShot[moveId],
                };
                setAction(p, Action.Charge, 0.25);
            } else if (area) {
                // F1: tremor, pedras, giro: pega todo mundo em volta na hora
                const victims = areaHit(s, p, moveId, k, false);
                target = victims[0] ?? null;
                hit = victims.length > 0;
                setAction(p, Action.Tackle, 0.3);
            } else {
                p.tackleBonus = { power: 1 + 0.4 * k, accuracy: 1, moveType: prof.data.type, moveId, timer: 1.5 };
                setAction(p, Action.Tackle, 0.3);
                // Leech Life: morde e suga o fôlego de quem está colado
                if (DRAIN[moveId]) {
                    target = nearestOpponent(s, p, 2.5);
                    if (target) drainEnergy(p, target, DRAIN[moveId]);
                }
            }
            break;
        case 'blast':
            if (hasBall && !landed) {
                hit = false;
            } else if (hasBall) {
                p.shotBonus = {
                    // Psywave: força sorteada (bomba ou bola murcha)
                    power: hasTrait(moveId, 'randomPower') ? s.rng.range(T.psywaveMin, T.psywaveMax) : 1 + 0.15 * k,
                    accuracy: 1 + 0.45 * k,
                    moveType: prof.data.type,
                    moveId,
                    timer: 1.5,
                    fixedSpeed: T.fixedShot[moveId],
                };
            } else if (hasTrait(moveId, 'coins')) {
                // Pay Day: chuva de moedas, os rivais perto param para olhar
                const near = s.players.filter(
                    (o) => o.team !== p.team && !hidden(o) && dist(o.pos, p.pos) < T.coinRadius,
                );
                for (const o of near) {
                    o.stun = Math.max(o.stun, T.coinStun);
                    setAction(o, Action.Hurt, T.coinStun);
                }
                target = near[0] ?? null;
                hit = near.length > 0;
                traitFx(s, p.idx, 'coins', moveId, target?.idx ?? null, { n: near.length });
            } else if (area) {
                const victims = areaHit(s, p, moveId, k, true);
                target = victims[0] ?? null;
                hit = victims.length > 0;
            } else {
                // sem bola: rajada atrapalha o rival mais próximo (perde fôlego e atrasa).
                // Dream Eater prefere quem está dormindo (suga o dobro); se ninguém dorme, pega o mais perto
                target =
                    (moveId === 'dreameater' ? nearestOpponent(s, p, 7, (o) => o.status?.kind === 'slp') : null) ??
                    nearestOpponent(s, p, 7);
                if (!target) hit = false;
                else if (protect(s, target, p, 'special')) {
                    hit = false;
                } else {
                    // dano fixo ignora atributo e tipo (Night Shade pega até Normal; Sonic Boom não pega Fantasma)
                    const fixed = hasTrait(moveId, 'fixed');
                    let mult = fixed
                        ? 1
                        : typeMultiplier([prof.data.type], typesOf(target)) * screenFactor(s, target, true);
                    if (hasTrait(moveId, 'randomPower')) mult *= s.rng.range(T.psywaveMin, T.psywaveMax);
                    const immune = moveId === 'sonicboom' && target.sp.types.includes('Ghost');
                    hit = !immune && s.rng.chance(prof.data.accuracy / 100);
                    if (hit) {
                        target.stun = Math.max(target.stun, fixed ? (T.fixedStun[moveId] ?? 0.7) : 0.4 * k * mult);
                        target.energy = Math.max(0, target.energy - (fixed ? 0.04 : 0.05 * k * mult));
                        knockback(s, target, p, 0.8 * mult, moveId);
                        applySecondary(s, p, target, moveId);
                        const dream = moveId === 'dreameater' && target.status?.kind === 'slp' ? 2 : 1;
                        if (DRAIN[moveId]) drainEnergy(p, target, DRAIN[moveId] * mult * dream);
                        if (TRAP.has(moveId)) trap(target, moveId);
                        if (fixed) traitFx(s, p.idx, 'fixed', moveId, target.idx);
                        // Fire Spin: deixa um anel de fogo no chão
                        if (hasTrait(moveId, 'fireRing'))
                            addZone(s, p, 'fire', target.pos, T.fireRadius, T.fireTime, moveId);
                    }
                }
                // Gust: a rajada também sopra a bola solta
                if (hasTrait(moveId, 'blowBall')) blowBall(s, p, moveId);
            }
            setAction(p, Action.Shoot, 0.35);
            break;
        case 'burst':
            if (hasTrait(moveId, 'priority')) {
                target = quickAttack(s, p, moveId, k, hasBall);
                break;
            }
            {
                // Agility: arrancada longa; o resto, curta
                const time = hasTrait(moveId, 'longBurst') ? T.agilityTime : T.burstTime;
                p.buffs.push(
                    { attr: 'pace', factor: 1.18 + 0.1 * k, timer: time },
                    { attr: 'dribble', factor: 1.1, timer: time },
                );
                setAction(p, Action.Charge, 0.2);
            }
            break;
        case 'buff':
            for (const [stat, stages] of Object.entries(selfBoostsOf(moveId))) {
                for (const attr of BOOST_TO_ATTR[stat] ?? []) {
                    p.buffs.push({ attr, factor: 1 + T.buffStep * Math.max(1, stages ?? 1), timer: T.buffTime });
                }
            }
            // paredes valem para o time inteiro
            if (moveId === 'lightscreen') s.teams[p.team].screens.light = 15;
            if (moveId === 'reflect') s.teams[p.team].screens.reflect = 15;
            buffTraits(s, p, moveId);
            setAction(p, Action.Charge, 0.5);
            break;
        case 'debuff': {
            if (hasTrait(moveId, 'smoke')) {
                // Smokescreen: nuvem no chão onde está o rival mais perto (ou na frente dele)
                target = nearestOpponent(s, p, 8);
                const at = target ? target.pos : add(p.pos, scale(p.heading, 2));
                addZone(s, p, 'smoke', at, T.smokeRadius, T.smokeTime, moveId);
                setAction(p, Action.Charge, 0.4);
                break;
            }
            // área (Growl, Leer, Flash...): todos os rivais em volta; o resto, o mais perto
            const victims = area
                ? s.players.filter(
                      (o) =>
                          o.team !== p.team &&
                          !hidden(o) &&
                          dist(o.pos, p.pos) < (moveId === 'flash' ? T.flashRadius : T.areaRadius),
                  )
                : [nearestOpponent(s, p, 6)].filter((o): o is PlayerState => o !== null);
            target = victims[0] ?? null;
            setAction(p, Action.Charge, 0.4);
            hit = false;
            let landedOn = 0;
            const blind = T.blind[moveId];
            for (const v of victims) {
                if (protect(s, v, p, 'special') || s.teams[v.team].screens.mist > 0) continue;
                if (!s.rng.chance(prof.data.accuracy / 100) || v.ability.immuneDebuff) continue;
                hit = true;
                landedOn++;
                for (const [stat, stages] of Object.entries(prof.data.targetBoosts ?? {})) {
                    for (const attr of BOOST_TO_ATTR[stat] ?? []) {
                        v.buffs.push({ attr, factor: 1 + T.debuffStep * (stages ?? -1), timer: T.debuffTime });
                    }
                }
                // Leer: a encarada trava um instante
                if (moveId === 'leer') v.stun = Math.max(v.stun, T.leerFreeze);
                // areia no olho, colher torta, clarão: chute e passe saem tortos
                if (blind) v.fx.aim = { ...blind };
            }
            if (landedOn && blind) traitFx(s, p.idx, 'blind', moveId, target?.idx ?? null, { n: landedOn });
            else if (landedOn && area) traitFx(s, p.idx, 'area', moveId, target?.idx ?? null, { n: landedOn });
            break;
        }
        case 'status': {
            setAction(p, Action.Charge, 0.4);
            if (!prof.status) break;
            // Poison Gas: nuvem que pega todos os rivais perto
            const victims = area
                ? s.players.filter((o) => o.team !== p.team && !hidden(o) && dist(o.pos, p.pos) < T.gasRadius)
                : [nearestOpponent(s, p, 6.5)].filter((o): o is PlayerState => o !== null);
            target = victims[0] ?? null;
            if (!target) break;
            let landedOn = 0;
            for (const v of victims) {
                if (protect(s, v, p, 'special')) {
                    if (v === target) hit = false;
                    continue;
                }
                const eff = typeMultiplier([prof.data.type], v.sp.types);
                if (v === target) effectiveness = eff;
                const chance =
                    (prof.data.accuracy / 100) * (p.ability.statusChanceBoost ? 1.15 : 1) * screenFactor(s, v, true);
                // Thunder Wave não afeta Ground; pós de planta não afetam Grass
                const immuneByType =
                    (prof.data.type === 'Electric' && v.sp.types.includes('Ground')) ||
                    (moveId.endsWith('powder') || moveId === 'spore' ? v.sp.types.includes('Grass') : false);
                let ok = !immuneByType && s.rng.chance(chance);
                if (ok) {
                    const itemBefore = v.itemUsed;
                    const applied = applyStatus(s, v, prof.status, p.idx, moveId);
                    ok = applied || v.itemUsed !== itemBefore;
                    // Toxic: veneno que piora com o tempo
                    if (applied && hasTrait(moveId, 'toxic') && v.status) {
                        v.status.timer = T.toxicTime;
                        v.fx.toxic = 1e-3;
                        traitFx(s, p.idx, 'toxic', moveId, v.idx);
                    }
                }
                if (ok) landedOn++;
                if (v === target) hit = ok;
            }
            if (area) {
                hit = landedOn > 0;
                traitFx(s, p.idx, 'area', moveId, target.idx, { n: landedOn });
            }
            break;
        }
        case 'heal': {
            const gain = moveId === 'rest' ? 1 : T.healBase + T.healPower * k;
            if (moveId === 'rest') {
                p.energy = 1;
                applyStatus(s, p, 'slp', p.idx, 'rest');
            } else {
                p.energy = Math.min(1, p.energy + gain);
            }
            // Soft-Boiled: cura também o companheiro mais cansado por perto
            if (hasTrait(moveId, 'teamHeal')) {
                let mate: PlayerState | null = null;
                for (const o of s.players) {
                    if (o.team !== p.team || o === p || dist(o.pos, p.pos) > T.teamHealRadius) continue;
                    if (!mate || o.energy < mate.energy) mate = o;
                }
                if (mate) {
                    mate.energy = Math.min(1, mate.energy + gain);
                    traitFx(s, p.idx, 'teamHeal', moveId, mate.idx);
                }
            }
            setAction(p, Action.Charge, 0.5);
            break;
        }
        case 'special': {
            const res = specialMove(s, p, moveId, depth);
            target = res.target;
            hit = res.hit;
            after = res.after;
            break;
        }
        case 'flavor':
            setAction(p, Action.Celebrate, 0.6);
            hit = false;
            break;
    }
    if (target && effectiveness === null && prof.data.category !== 'Status') {
        effectiveness = typeMultiplier([prof.data.type], typesOf(target));
    }
    emit(s, {
        type: 'move',
        by: p.idx,
        moveId,
        kind: prof.kind,
        target: target?.idx ?? null,
        effectiveness,
        hit,
        withBall: hasBall,
        ...(gkSave ? { save: true } : {}),
    });
    if (moveId !== 'metronome' && moveId !== 'mirrormove' && moveId !== 'mimic') s.lastMove[p.team] = moveId;
    if (landed) drawback(s, p, moveId);
    after?.();
}

/** F1: golpe em área sem bola (Earthquake, Surf, Rock Slide, Blizzard, Swift...): pega todo mundo no raio. */
function areaHit(s: MatchState, p: PlayerState, moveId: string, k: number, special: boolean): PlayerState[] {
    const prof = moveProfile(moveId);
    // Earthquake e Surf pegam os companheiros também
    const all = hasTrait(moveId, 'areaAll');
    const r = moveId === 'rollingkick' ? T.spinRadius : T.areaRadius;
    const sure = hasTrait(moveId, 'sureHit');
    const near = s.players
        .filter((o) => o !== p && (all || o.team !== p.team) && !hidden(o) && dist(o.pos, p.pos) < r)
        .sort((a, b) => dist(a.pos, p.pos) - dist(b.pos, p.pos) || a.idx - b.idx);
    const hits: PlayerState[] = [];
    for (const o of near) {
        const foe = o.team !== p.team;
        if (foe && protect(s, o, p, special ? 'special' : 'physical')) continue;
        if (!sure && !s.rng.chance(prof.data.accuracy / 100)) continue;
        const mult =
            typeMultiplier([prof.data.type], typesOf(o)) * (foe ? screenFactor(s, o, special) : 1) * T.areaShare;
        o.stun = Math.max(o.stun, 0.5 * k * mult);
        o.energy = Math.max(0, o.energy - 0.05 * k * mult);
        knockback(s, o, p, 0.9 * mult, moveId);
        if (foe) applySecondary(s, p, o, moveId);
        if (s.ball.owner === o.idx) popBall(s, o, p);
        hits.push(o);
    }
    traitFx(s, p.idx, 'area', moveId, hits[0]?.idx ?? null, {
        n: hits.length,
        x: Math.round(p.pos.x * 100) / 100,
        y: Math.round(p.pos.y * 100) / 100,
        r,
    });
    return hits;
}

/** F5: Quick Attack. Sem a bola: avança e desarma na hora, sem esperar; com a bola: arrancada e chute de primeira. */
function quickAttack(s: MatchState, p: PlayerState, moveId: string, k: number, hasBall: boolean): PlayerState | null {
    const prof = moveProfile(moveId);
    const carrier = s.ball.owner !== null ? s.players[s.ball.owner] : null;
    if (!hasBall && carrier && carrier.team !== p.team && !hidden(carrier)) {
        const gap = dist(carrier.pos, p.pos);
        if (gap < T.quickRange) {
            const step = Math.min(T.quickDash, Math.max(0, gap - 0.9));
            p.pos = add(p.pos, scale(norm(sub(carrier.pos, p.pos)), step));
            p.tackleBonus = { power: 1 + 0.4 * k, accuracy: 1, moveType: prof.data.type, moveId, timer: 1.5 };
            p.tackleCooldown = 0;
            traitFx(s, p.idx, 'priority', moveId, carrier.idx);
            tryTackle(s, p, carrier.idx);
            return carrier;
        }
    }
    p.buffs.push(
        { attr: 'pace', factor: 1.18 + 0.1 * k, timer: T.burstTime },
        { attr: 'dribble', factor: 1.1, timer: T.burstTime },
    );
    if (hasBall) {
        p.kickCooldown = 0;
        p.ai.nextDecision = 0;
        traitFx(s, p.idx, 'priority', moveId);
    }
    setAction(p, Action.Charge, 0.2);
    return null;
}

/** F2/F11: o que os golpes de reforço fazem além do atributo (Focus Energy, clones, casco, muro...). */
function buffTraits(s: MatchState, p: PlayerState, moveId: string) {
    if (hasTrait(moveId, 'focus')) {
        // Focus Energy "bugado" da Gen 1: às vezes não funciona
        if (s.rng.chance(T.focusBugChance)) traitFx(s, p.idx, 'focusBug', moveId);
        else p.fx.focus = true;
    }
    if (hasTrait(moveId, 'clones')) {
        p.fx.decoys = T.decoys;
        p.fx.decoyT = T.decoyTime;
        traitFx(s, p.idx, 'clones', moveId, null, { n: T.decoys });
    }
    if (hasTrait(moveId, 'minimize')) {
        p.fx.mini = T.minimizeTime;
        traitFx(s, p.idx, 'mini', moveId, null, { dur: T.minimizeTime });
    }
    if (hasTrait(moveId, 'melt') || hasTrait(moveId, 'shell')) {
        const t = hasTrait(moveId, 'melt') ? T.meltTime : T.shellTime;
        p.fx.guard = Math.max(p.fx.guard, t);
        p.fx.guardMove = moveId;
        // Withdraw: dentro do casco anda devagar
        if (hasTrait(moveId, 'shell')) p.buffs.push({ attr: 'pace', factor: T.shellSlow, timer: t });
        traitFx(s, p.idx, 'guard', moveId, null, { dur: t });
    }
    if (hasTrait(moveId, 'curl')) {
        p.fx.curl = T.curlTime;
        traitFx(s, p.idx, 'curl', moveId, null, { dur: T.curlTime });
    }
    if (hasTrait(moveId, 'wall')) {
        // Barrier: muro invisível entre ele e o próprio gol
        const ownGoal = v(ownGoalX(s, p.team), s.cfg.pitch.width / 2);
        const at = add(p.pos, scale(norm(sub(ownGoal, p.pos)), 1.5));
        addZone(s, p, 'wall', at, T.wallRadius, T.wallTime, moveId);
    }
}

/** Preso (Bind, Wrap, Clamp, Fire Spin, Constrict): lento e atordoado um instante. Constrict só aperta (lento). */
function trap(target: PlayerState, moveId: string) {
    if (hasTrait(moveId, 'squeeze')) {
        target.buffs.push({ attr: 'pace', factor: T.squeezeSlow, timer: T.squeezeTime });
        return;
    }
    target.stun = Math.max(target.stun, 0.6);
    target.buffs.push({ attr: 'pace', factor: 0.6, timer: 3 }, { attr: 'dribble', factor: 0.8, timer: 3 });
}

/** O preço dos golpes fortíssimos (src/engine/moves.ts → DRAWBACK). */
function drawback(s: MatchState, p: PlayerState, moveId: string) {
    switch (DRAWBACK[moveId]) {
        case 'faint':
            // explode em área: empurra quem estiver perto e fica no chão sem fôlego
            // Explosion pega mais longe que Self-Destruct (Gen 1: 170 × 130)
            for (const o of s.players) {
                if (o.idx !== p.idx && !hidden(o) && dist(o.pos, p.pos) < (T.blastRadius[moveId] ?? 3)) {
                    o.stun = Math.max(o.stun, 0.8);
                    knockback(s, o, p, 1.8, moveId);
                }
            }
            p.energy = Math.min(p.energy, T.faintEnergy);
            p.stun = Math.max(p.stun, T.faintStun);
            setAction(p, Action.Hurt, T.faintStun);
            break;
        case 'recharge':
            p.stun = Math.max(p.stun, T.rechargeStun);
            break;
        case 'recoil':
            p.energy = Math.max(0, p.energy - T.recoilEnergy);
            break;
        case 'rampage':
            if (s.rng.chance(T.rampageChance)) applyStatus(s, p, 'confusion', p.idx, moveId);
            break;
    }
}

function drainEnergy(user: PlayerState, target: PlayerState, amount: number) {
    const taken = Math.min(Math.max(0, target.energy), amount);
    target.energy = Math.max(0, target.energy - taken);
    user.energy = Math.min(1, user.energy + taken);
}

/** Golpes com efeito próprio (Counter é reação, ver protect). */
function specialMove(
    s: MatchState,
    p: PlayerState,
    moveId: string,
    depth: number,
): { target: PlayerState | null; hit: boolean; after: (() => void) | null } {
    setAction(p, Action.Charge, 0.4);
    switch (moveId) {
        case 'haze': {
            // névoa: todo mundo em volta (dos dois times) perde status e reforços/enfraquecimentos
            const cleared = s.players.filter((o) => dist(o.pos, p.pos) < 6 && (o.status || o.buffs.length || o.seeded));
            for (const o of cleared) {
                o.status = null;
                o.buffs = [];
                o.seeded = null;
                if (o.action === Action.Hurt) o.action = Action.Idle;
            }
            return {
                target: null,
                hit: cleared.length > 0,
                after: () => emit(s, { type: 'haze', by: p.idx, cleared: cleared.map((o) => o.idx) }),
            };
        }
        case 'mist':
            s.teams[p.team].screens.mist = 12;
            return { target: null, hit: true, after: null };
        case 'bide':
            // F10: aguenta firme e conta as pancadas; depois solta a onda (tickTraits → releaseBide)
            p.fx.bide = { t: T.bideTime, hits: 0 };
            p.buffs.push(
                { attr: 'strength', factor: 1.3, timer: T.bideTime, src: 'bide' },
                { attr: 'dribble', factor: 1.15, timer: T.bideTime, src: 'bide' },
            );
            return {
                target: null,
                hit: true,
                after: () => traitFx(s, p.idx, 'charge', moveId, null, { dur: T.bideTime }),
            };
        case 'rage':
            // F10: fúria que cresce a cada pancada sofrida (onHurt)
            p.fx.rage = { t: T.rageTime, stacks: 0 };
            p.buffs.push(
                { attr: 'shooting', factor: 1.1, timer: T.rageTime },
                { attr: 'strength', factor: 1.1, timer: T.rageTime },
            );
            return { target: null, hit: true, after: null };
        case 'conversion': {
            // F12 (Gen 1): vira o tipo do rival mais perto
            p.buffs = p.buffs.filter((b) => b.factor >= 1);
            for (const attr of ['pace', 'dribble', 'shooting', 'passing', 'tackling'] as AttrKey[]) {
                p.buffs.push({ attr, factor: 1.08, timer: 10 });
            }
            const target = nearestOpponent(s, p, 12);
            if (target) p.fx.typeCopy = { types: [...target.sp.types], t: T.typeCopyTime };
            return {
                target,
                hit: true,
                after: target ? () => traitFx(s, p.idx, 'typeCopy', moveId, target.idx) : null,
            };
        }

        case 'disable': {
            const target = nearestOpponent(s, p, 6);
            if (!target) return { target, hit: false, after: null };
            if (protect(s, target, p, 'special')) return { target, hit: false, after: null };
            // trava o golpe mais forte que ele ainda tem
            const slots = target.inst.moves
                .map((m, i) => ({ i, str: moveProfile(m).strength }))
                .filter(({ i }) => target.moveUses[i] > 0)
                .sort((a, b) => b.str - a.str);
            if (!slots.length) return { target, hit: false, after: null };
            target.moveUses[slots[0].i] = 0;
            return { target, hit: true, after: null };
        }
        case 'roar': {
            // F12: o rival mais perto foge de volta para o campo dele (Gen 1: força a troca) e larga a bola
            const target = nearestOpponent(s, p, T.fleeRange);
            if (!target || protect(s, target, p, 'special')) return { target, hit: false, after: null };
            target.fx.flee = { dir: v(-attackSign(target.team), 0), t: T.fleeTime };
            target.fx.charging = null;
            if (s.ball.owner === target.idx) popBall(s, target, p);
            return { target, hit: true, after: () => traitFx(s, p.idx, 'flee', moveId, target.idx) };
        }
        case 'whirlwind': {
            const near = s.players.filter((o) => o.team !== p.team && !hidden(o) && dist(o.pos, p.pos) < 4.5);
            for (const o of near) {
                if (protect(s, o, p, 'special')) continue;
                knockback(s, o, p, 2.8, moveId);
            }
            // a ventania também sopra a bola solta para longe
            blowBall(s, p, moveId);
            return { target: near[0] ?? null, hit: near.length > 0, after: null };
        }

        case 'splash':
            // só um pulinho... mas difícil de desarmar por um instante
            p.evade = Math.max(p.evade, 1.5);
            return { target: null, hit: true, after: null };
        case 'transform': {
            const target = nearestOpponent(s, p, 8);
            if (!target) return { target, hit: false, after: null };
            for (const attr of Object.keys(p.attr) as AttrKey[]) {
                const ratio = target.attr[attr] / Math.max(1, p.attr[attr]);
                if (ratio > 1.02) p.buffs.push({ attr, factor: Math.min(1.6, ratio), timer: 12 });
            }
            return { target, hit: true, after: null };
        }
        case 'teleport': {
            // some e reaparece: para a frente se o time ataca, para trás se defende
            const attacking = s.ball.owner !== null && s.players[s.ball.owner].team === p.team;
            const rel = toRel(s, p.team, p.pos);
            const { length, width } = s.cfg.pitch;
            const x = clamp(rel.x + (attacking ? 8 : -8), 3, length - 6);
            const y = clamp(s.rng.range(3, width - 3), 1, width - 1);
            p.pos = toWorld(s, p.team, x, y);
            p.vel = v(0, 0);
            return { target: null, hit: true, after: () => emit(s, { type: 'teleport', by: p.idx }) };
        }
        case 'substitute':
            p.energy = Math.max(0, p.energy - 0.08);
            p.substitute = 15;
            return { target: null, hit: true, after: null };
        case 'leechseed': {
            const target = nearestOpponent(s, p, 6);
            if (!target || target.sp.types.includes('Grass') || target.seeded)
                return { target, hit: false, after: null };
            if (protect(s, target, p, 'special')) return { target, hit: false, after: null };
            const hit = s.rng.chance(0.9);
            if (hit) {
                target.seeded = { by: p.idx, timer: 12 };
                return {
                    target,
                    hit,
                    after: () =>
                        emit(s, { type: 'status', target: target.idx, status: 'seed', by: p.idx, source: moveId }),
                };
            }
            return { target, hit, after: null };
        }
        case 'metronome':
        case 'mirrormove':
        case 'mimic': {
            if (depth > 0) return { target: null, hit: false, after: null };
            // Metronome: qualquer golpe; Mirror Move/Mimic: o último que o rival usou
            const pool = Object.keys(MOVES).filter((m) => m !== 'counter' && moveProfile(m).kind !== 'flavor');
            const copied = moveId === 'metronome' ? s.rng.pick(pool) : s.lastMove[p.team === 0 ? 1 : 0];
            if (!copied || copied === moveId) return { target: null, hit: false, after: null };
            // Mimic (Gen 1): o golpe copiado fica no lugar dele até o fim da partida, com os usos do golpe
            const slot = moveId === 'mimic' ? p.inst.moves.indexOf('mimic') : -1;
            if (slot >= 0) {
                p.inst = { ...p.inst, moves: p.inst.moves.map((m, i) => (i === slot ? copied : m)) };
                p.moveUses[slot] = moveProfile(copied).uses;
            }
            return { target: null, hit: true, after: () => moveEffect(s, p, copied, depth + 1) };
        }
        default:
            return { target: null, hit: false, after: null };
    }
}

// ---------------------------------------------------------------- bola
function updateBall(s: MatchState, dt: number) {
    const ball = s.ball;
    const { length, width, goalWidth } = s.cfg.pitch;
    if (ball.owner !== null) {
        const o = s.players[ball.owner];
        ball.pos = add(o.pos, scale(o.heading, DRIBBLE_OFFSET));
        ball.vel = o.vel;
        ball.z = 0;
        ball.vz = 0;
        return;
    }

    const prev = ball.pos;
    ball.pos = add(ball.pos, scale(ball.vel, dt));
    const speed = len(ball.vel);
    let newSpeed = speed;
    if (ball.z > 0) {
        // no ar não há atrito do chão; ao cair, quica e perde força
        ball.vz -= GRAVITY * dt;
        ball.z += ball.vz * dt;
        if (ball.z <= 0) {
            ball.z = 0;
            ball.vz = 0;
            newSpeed = speed * 0.65;
        }
    } else newSpeed = Math.max(0, speed - FRICTION * dt);
    ball.vel = speed > 0 ? scale(ball.vel, newSpeed / speed) : ball.vel;

    // laterais: tabela na parede (futsal "arena" — sem lateral cobrado no MVP)
    if (ball.pos.y < 0.1 || ball.pos.y > width - 0.1) {
        ball.pos = v(ball.pos.x, clamp(ball.pos.y, 0.1, width - 0.1));
        ball.vel = v(ball.vel.x * 0.85, -ball.vel.y * WALL_DAMPING);
    }

    // goleiro e bloqueios durante um chute (pelo trecho percorrido no tick, cortado na linha do gol)
    if (ball.shot) checkShotInteractions(s, prev);
    if (s.ball.owner !== null) return;

    // linha de fundo
    if (ball.pos.x < 0 || ball.pos.x > length) {
        const scoringTeam: 0 | 1 = ball.pos.x > length ? 0 : 1;
        const lineX = scoringTeam === 0 ? length : 0;
        const t = (lineX - prev.x) / (ball.pos.x - prev.x || 1e-9);
        const yCross = prev.y + (ball.pos.y - prev.y) * t;
        const off = Math.abs(yCross - width / 2) - goalWidth / 2;
        if (Math.abs(off) < POST_TOLERANCE && ball.shot) {
            emit(s, { type: 'post', shooter: ball.shot.by });
            ball.pos = v(lineX - attackSign(scoringTeam) * 0.15, yCross);
            ball.vel = v(-ball.vel.x * 0.55, ball.vel.y + s.rng.range(-2, 2));
            ball.shot = null;
            return;
        }
        if (off < 0) {
            scoreGoal(s, scoringTeam);
        } else {
            if (ball.shot) emit(s, { type: 'wide', shooter: ball.shot.by });
            const defending: 0 | 1 = scoringTeam === 0 ? 1 : 0;
            // último toque da defesa (espalmada, desvio, bola recuada): escanteio; do ataque: tiro de meta
            const toucher = ball.lastTouch !== null ? s.players[ball.lastTouch] : null;
            if (toucher?.team === defending) setupCorner(s, scoringTeam, yCross);
            else goalClearance(s, defending);
        }
        return;
    }

    if (newSpeed < 0.05) ball.vel = v(0, 0);
    if (ball.shot && newSpeed < 4) ball.shot = null;
}

/**
 * Goleiro e bloqueios durante um chute. Usa o trecho que a bola percorreu no tick (chute forte anda >1 m por tick
 * e "atravessava" o goleiro) e corta esse trecho na linha do gol: defesa nunca acontece com a bola já dentro da rede.
 * Na defesa, a bola fica no ponto do contato.
 */
function checkShotInteractions(s: MatchState, prev: Vec2) {
    const ball = s.ball;
    const shot = ball.shot!;
    const shooter = s.players[shot.by];
    const speed = len(ball.vel);
    const { length } = s.cfg.pitch;
    let end = ball.pos;
    if (end.x < 0 || end.x > length) {
        const lineX = end.x < 0 ? 0 : length;
        const t = (lineX - prev.x) / (end.x - prev.x || 1e-9);
        end = v(lineX, prev.y + (end.y - prev.y) * clamp(t, 0, 1));
    }
    const moveId = shot.moveId;
    // Swift nunca erra (jogador de linha não bloqueia); Egg Bomb vai por cima dos bloqueios
    const sure = hasTrait(moveId, 'sureHit');
    const lob = hasTrait(moveId, 'lob');
    // dano fixo: sem vantagem de tipo para nenhum lado
    const fixed = hasTrait(moveId, 'fixed');
    // Barrier: o muro invisível segura o próximo chute que passar perto
    for (const z of s.zones) {
        if (z.kind !== 'wall' || z.team === shooter.team || z.t <= 0) continue;
        const seg = pointSegment(z.pos, prev, end);
        if (seg.d > z.r) continue;
        z.t = 0;
        emit(s, { type: 'block', by: z.by, shooter: shooter.idx });
        // x/y do muro (como no evento 'wall'): a tela apaga só ele
        traitFx(s, z.by, 'wallBlock', 'barrier', shooter.idx, {
            x: Math.round(z.pos.x * 100) / 100,
            y: Math.round(z.pos.y * 100) / 100,
        });
        ball.shot = null;
        ball.pos = add(prev, scale(sub(end, prev), seg.t));
        ball.lastTouch = z.by;
        ball.lastKick = { by: z.by, kind: 'clear', tick: s.tick };
        ball.vel = rotate(scale(ball.vel, -0.3), s.rng.range(-1, 1));
        ball.z = 0;
        ball.vz = 0;
        return;
    }
    for (const p of s.players) {
        if (p.team === shooter.team || isIncapacitated(p) || hidden(p)) continue;
        const seg = pointSegment(p.pos, prev, end);
        const d = seg.d;
        const contact = add(prev, scale(sub(end, prev), seg.t));
        if (p.role === 'GK') {
            // chute que ia para fora não vira "defesa" (era 1/3 das defesas e gerava "QUE DEFESA!" à toa)
            if (shot.gkChecked || !shot.onTarget) continue;
            // defesa máxima (beira da quadra): alcança bem mais longe e não deixa passar
            const maxSave = gkMaxLive(s, p);
            const reach =
                (0.55 + (1.0 * eff(s, p, 'goalkeeping')) / 99) *
                (lob ? T.lobGkReach : 1) *
                (maxSave ? AGENCY.maxGkReach : 1);
            if (d > reach) continue;
            shot.gkChecked = true;
            const gkTypeMult = fixed ? 1 : typeMultiplier(typesOf(p), [shot.moveType]);
            const shotTypeMult = fixed
                ? 1
                : dpow(typeMultiplier([shot.moveType], typesOf(p)), shooter.ability.typeBoost ?? 1);
            const gk = eff(s, p, 'goalkeeping') * gkTypeMult;
            // chute no corpo do goleiro (d pequeno) é mais fácil de pegar
            const placement = clamp(d / reach, 0, 1);
            // cobertura vem devagar, mas caindo: o goleiro "sente" um chute normal
            const felt = lob ? Math.max(speed, T.lobFeel) : speed;
            const pSave = clamp(
                (0.34 + (0.65 * gk) / 99 - 0.028 * (felt - 14) - 0.3 * placement) / shotTypeMult,
                0.05,
                0.95,
            );
            setAction(p, Action.Dive, 0.5);
            const sash = p.item === 'focussash' && !p.itemUsed && shot.onTarget;
            if (sash) {
                p.itemUsed = true;
                emit(s, { type: 'item', by: p.idx, item: 'focussash', effect: 'save' });
            }
            if (maxSave || sash || s.rng.chance(pSave)) {
                p.stats.saves++;
                const caught = maxSave || (felt < 17 && s.rng.chance(0.55 + (0.3 * gk) / 99));
                emit(s, { type: 'save', by: p.idx, shooter: shooter.idx, caught });
                ball.shot = null;
                // o contato nunca fica atrás do goleiro (entre ele e o gol): a bola parecia ter passado e virava
                // "QUE DEFESA" com a bola na linha. Fica na frente das mãos dele.
                const front = attackSign(p.team);
                ball.pos = (contact.x - p.pos.x) * front < 0.2 ? v(p.pos.x + front * 0.2, contact.y) : contact;
                ball.z = 0;
                ball.vz = 0;
                // defender um Thunderbolt tem preço
                if (moveId) applySecondary(s, shooter, p, moveId);
                if (caught) {
                    ball.owner = p.idx;
                    ball.vel = v(0, 0);
                    ball.lastTouch = p.idx;
                    ball.assistCandidate = null;
                    p.ai.holdUntil = s.tick + Math.round(0.8 * s.cfg.tickRate);
                    if (maxSave) gkMaxSave(s, p);
                } else if (!tryRebound(s, shooter, moveId, ball.pos)) {
                    ball.lastTouch = p.idx;
                    ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
                    // chute no canto às vezes vai pra fora (escanteio); senão espalma para o lado, pra frente
                    const out = s.rng.chance(CORNER_TUNING.parryOut + CORNER_TUNING.parryOutPlacement * placement);
                    if (!out || !deflectOut(s, p, ball.pos)) {
                        const outward = v(attackSign(p.team) * s.rng.range(0.3, 1), s.rng.chance(0.5) ? 1 : -1);
                        ball.vel = scale(norm(outward), speed * s.rng.range(0.25, 0.45));
                    }
                }
                return;
            }
        } else if (!sure && !lob && d < 0.5 && !shot.blockedBy.includes(p.idx)) {
            shot.blockedBy.push(p.idx);
            // leitura de jogo: quem se posiciona bem fecha o chute bem mais vezes
            const pBlock = clamp(0.3 + (eff(s, p, 'positioning') - 62) * 0.012, 0.08, 0.6);
            if (s.rng.chance(pBlock)) {
                // Drill Peck/Cut: fura o primeiro bloqueio
                if (hasTrait(moveId, 'pierce') && !shot.pierced) {
                    shot.pierced = true;
                    traitFx(s, shooter.idx, 'pierce', moveId!, p.idx);
                    continue;
                }
                emit(s, { type: 'block', by: p.idx, shooter: shooter.idx });
                ball.shot = null;
                ball.pos = contact;
                if (moveId) {
                    knockback(s, p, shooter, 1, moveId);
                    applySecondary(s, shooter, p, moveId);
                }
                if (tryRebound(s, shooter, moveId, contact)) return;
                ball.lastTouch = p.idx;
                ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
                // o desvio às vezes vai pela linha de fundo (escanteio); senão a bola volta
                if (!s.rng.chance(CORNER_TUNING.blockOut) || !deflectOut(s, p, contact))
                    ball.vel = rotate(scale(ball.vel, -0.3), s.rng.range(-1, 1));
                return;
            }
        }
    }
}

/** F8: chute de rebote (Bonemerang, Pin Missile...): defendido ou bloqueado, a bola volta para o pé de quem chutou. */
function tryRebound(s: MatchState, shooter: PlayerState, moveId: string | null, contact: Vec2): boolean {
    if (!moveId || !hasTrait(moveId, 'rebound')) return false;
    if (!T.reboundAlways.includes(moveId) && !s.rng.chance(T.reboundChance)) return false;
    const ball = s.ball;
    const to = sub(shooter.pos, contact);
    const d = len(to);
    ball.shot = null;
    ball.pos = contact;
    ball.z = 0;
    ball.vz = 0;
    ball.vel = scale(norm(to), clamp(Math.sqrt(2 * FRICTION * d) * 1.1 + 1.5, 4, 14));
    ball.lastTouch = shooter.idx;
    ball.lastKick = { by: shooter.idx, kind: 'pass', tick: s.tick, receiverId: shooter.idx };
    traitFx(s, shooter.idx, 'rebound', moveId);
    return true;
}

function checkPossession(s: MatchState) {
    const ball = s.ball;
    if (ball.owner !== null) return;
    // bola do escanteio a caminho: quem fica com ela é a disputa (updateSetPiece), não o mais perto
    if (s.setPiece && s.setPiece.contestTick > s.tick) return;
    const speed = len(ball.vel);
    let best: PlayerState | null = null;
    let bestD = Infinity;
    for (const p of s.players) {
        // quem foge do Roar não para para dominar a bola
        if (p.kickCooldown > 0 || isIncapacitated(p) || hidden(p) || p.fx.flee) continue;
        const inOwnArea = p.role === 'GK' && isInOwnArea(s, p, ball.pos);
        // bola cruzada passa por cima de quem não alcança
        if (ball.z > (inOwnArea ? GK_REACH_Z : REACH_Z)) continue;
        const radius = inOwnArea ? GK_CONTROL_RADIUS : CONTROL_RADIUS;
        const d = dist(p.pos, ball.pos);
        if (d > radius) continue;
        const intended = ball.lastKick?.kind === 'pass' && ball.lastKick.receiverId === p.idx;
        const lastTeam = ball.lastTouch !== null ? s.players[ball.lastTouch].team : null;
        const isOpponent = lastTeam !== null && lastTeam !== p.team;
        let chance = 1;
        // chute em andamento: ninguém domina — goleiro e bloqueios resolvem em checkShotInteractions
        if (ball.shot) chance = 0;
        else if (isOpponent && ball.lastKick?.kind === 'pass' && speed > 4) {
            chance = clamp(0.4 + (eff(s, p, 'positioning') - 62) * 0.012, 0.15, 0.7) + (p.ability.interceptBonus ?? 0);
        } else if (!intended && speed > 12) chance = 0.4;
        else if (intended && speed > 16) chance = 0.6;
        if (chance < 1 && !s.rng.chance(chance)) continue;
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    if (!best) return;
    // a curta do escanteio só continua se quem dominou foi o chutador de fora
    if (s.setPiece && !(s.setPiece.play === 'short' && s.setPiece.roles.outside === best.idx)) s.setPiece = null;
    const prevTouch = ball.lastTouch !== null ? s.players[ball.lastTouch] : null;
    if (prevTouch && prevTouch.team !== best.team && ball.lastKick?.kind === 'pass') {
        best.stats.interceptions++;
        emit(s, { type: 'interception', by: best.idx, from: prevTouch.idx });
        ball.assistCandidate = null;
    } else if (
        prevTouch &&
        prevTouch.team === best.team &&
        ball.lastKick?.kind === 'pass' &&
        prevTouch.idx !== best.idx
    ) {
        prevTouch.stats.passesCompleted++;
    } else if (prevTouch && prevTouch.team !== best.team) {
        ball.assistCandidate = null;
    }
    ball.owner = best.idx;
    ball.lastTouch = best.idx;
    ball.vel = v(0, 0);
    ball.shot = null;
    best.ai.holdUntil = s.tick + Math.round((best.role === 'GK' ? 0.8 : 0.35) * s.cfg.tickRate);
    best.ai.nextDecision = 0;
}

export function isInOwnArea(s: MatchState, p: PlayerState, pos: Vec2): boolean {
    const { penaltyAreaDepth, penaltyAreaWidth, width } = s.cfg.pitch;
    const rel = toRel(s, p.team, pos);
    return rel.x <= penaltyAreaDepth && Math.abs(rel.y - width / 2) <= penaltyAreaWidth / 2;
}

function scoreGoal(s: MatchState, team: 0 | 1) {
    const ball = s.ball;
    const shot = ball.shot;
    const toucher = ball.lastTouch !== null ? s.players[ball.lastTouch] : null;
    const ownGoal = !!toucher && toucher.team !== team;
    const scorer = ownGoal ? toucher : (toucher ?? s.players.find((p) => p.team === team)!);
    s.score[team]++;
    let assist: number | null = null;
    if (!ownGoal && scorer) {
        scorer.stats.goals++;
        if (
            ball.assistCandidate !== null &&
            ball.assistCandidate !== scorer.idx &&
            s.players[ball.assistCandidate].team === team
        ) {
            assist = ball.assistCandidate;
            s.players[assist].stats.assists++;
        }
        setAction(scorer, Action.Celebrate, 2.5);
        // Hyper Beam que vira gol não recarrega (como na Gen 1 quando nocauteava)
        if (shot?.moveId && hasTrait(shot.moveId, 'noRechargeOnGoal') && shot.by === scorer.idx) {
            scorer.stun = 0;
            traitFx(s, scorer.idx, 'noRecharge', shot.moveId);
        }
    }
    emit(s, { type: 'goal', by: scorer.idx, assist, team, score: [s.score[0], s.score[1]], ownGoal });
    ball.vel = v(0, 0);
    ball.owner = null;
    ball.shot = null;
    ball.pos = v(clamp(ball.pos.x, -0.5, s.cfg.pitch.length + 0.5), ball.pos.y);
    s.phase = 'goal';
    s.phaseTimer = 3;
    s.setPiece = null;
    s.kickoffTeam = team === 0 ? 1 : 0;
}

function goalClearance(s: MatchState, team: 0 | 1) {
    s.setPiece = null;
    const subbed = applyPendingSubs(s);
    const gk = s.players.find((p) => p.team === team && p.role === 'GK') ?? s.players.find((p) => p.team === team)!;
    gk.pos = toWorld(s, team, 1.5, s.cfg.pitch.width / 2 + s.rng.range(-2, 2));
    gk.vel = v(0, 0);
    gk.heading = v(attackSign(team), 0);
    emit(s, { type: 'goalkick', team, by: gk.idx });
    s.ball.owner = gk.idx;
    s.ball.lastTouch = gk.idx;
    // a bola já vai para o pé do goleiro (antes ficava atrás da linha durante o reinício)
    s.ball.pos = add(gk.pos, scale(gk.heading, DRIBBLE_OFFSET));
    s.ball.vel = v(0, 0);
    s.ball.shot = null;
    s.ball.assistCandidate = null;
    gk.ai.holdUntil = s.tick + Math.round(0.6 * s.cfg.tickRate);
    s.phase = 'restart';
    // tempo extra para a substituição aparecer na tela
    s.phaseTimer = subbed ? 2 : 0.8;
    checkEvolutions(s);
}

// ---------------------------------------------------------------- escanteio (docs/planos/escanteio.md, opção B)
/** Números do escanteio num lugar só (ajustar olhando a calibragem: meta 3–4 por jogo e ~10% de gol). */
export const CORNER_TUNING = {
    /** Espalmada que vai pela linha de fundo: base + quanto mais no canto foi o chute (placement 0..1). */
    parryOut: 0.2,
    parryOutPlacement: 0.3,
    /** Bloqueio que desvia pela linha de fundo. */
    blockOut: 0.3,
    /** Segundos parado montando a cobrança (o relógio não corre). */
    setTime: 1.2,
    /** Peso de cada jogada no "Variar" e quanto a instrução do técnico multiplica a escolhida. */
    playWeight: { area: 1, short: 0.35, near: 0.5 } as Record<CornerPlay, number>,
    planBoost: 3,
    /** Distância da linha de fundo (m) do ponto da disputa no alto. */
    crossDepth: 5.5,
    /** Voo do cruzamento (s); Egg Bomb sobe mais. */
    crossFlight: 1.15,
    eggFlight: 1.5,
    /** Erro do cruzamento (m) com passe 0 (cai com o passe); Swift não erra; a curva no vento erra menos. */
    crossError: 1.3,
    windAim: 0.7,
    /** Rasteira forte na 1ª trave: segundos até chegar. */
    nearTime: 0.55,
    /** Raio da disputa (m), no alto e na rasteira; o goleiro na área alcança mais. */
    aerialRadius: 1.8,
    nearRadius: 1.4,
    gkExtra: 1.6,
    /** Chance de usar o golpe de bola parada quando tem: cobrador e quem disputa no alto. */
    takerMove: 0.6,
    headerMove: 0.6,
    /** Fly e Sky Attack sobem mais; os outros golpes dão 1 + headerBoost × força do golpe na disputa. */
    flyBoost: 1.6,
    headerBoost: 0.4,
    /** Erro extra da finalização: cabeçada, voleio e desvio de primeira na rasteira (× o erro de um chute). */
    headerAim: 2.6,
    /** Chute de primeira da curta. */
    firstTimeAim: 1.6,
    volleyAim: 2.8,
    flickAim: 2.6,
    /** Gol olímpico: chance de a curva no vento (Gust/Whirlwind) ir direto pro gol (0,3 → 0,6: Miguel, 17/10/2026). */
    olympic: 0.6,
    /** Rasteira: o defensor ganha a dividida, mas desvia pro próprio gol. */
    ownDeflect: 0.06,
    /** Velocidade vertical (m/s) da bola afastada: sobe por cima da área. */
    clearLift: 4,
    /** Quem defende está do lado do gol, marcando: peso extra na disputa. */
    defenseEdge: 1.3,
    /** Goleiro segura o cruzamento (+ até 0,3 pelo goalkeeping); senão soca. */
    gkCatch: 0.45,
};

/** Golpes de bola parada (gastam o uso normal). Cobrador: Swift não erra, Egg Bomb sobe, vento faz curva. */
const TAKER_MOVES: Record<CornerPlay, readonly string[]> = {
    area: ['swift', 'eggbomb', 'gust', 'whirlwind'],
    near: ['swift', 'gust', 'whirlwind'],
    short: [],
};
const WIND = new Set(['gust', 'whirlwind']);
/** Na disputa no alto: cabeçada (Headbutt, Skull Bash sem a carga), voleio (Jump Kick), sobe mais (Fly...). */
const AERIAL_MOVES = ['headbutt', 'skullbash', 'jumpkick', 'highjumpkick', 'fly', 'skyattack', 'drillpeck', 'bodyslam'];
const VOLLEY_MOVES = new Set(['jumpkick', 'highjumpkick']);
const HIGH_FLYERS = new Set(['fly', 'skyattack']);

/** Jogo aéreo em campo: a conta do selo (attributes.ts) com os atributos de agora e o tamanho comprimido igual. */
export function aerialEff(s: MatchState, p: PlayerState): number {
    return aerialScore(eff(s, p, 'strength'), eff(s, p, 'positioning'), compressed(sizePercentile(p.sp) * 99) / 99);
}

/** Cobrador padrão: o melhor passe entre os jogadores de linha, fora o pivô (ele fica na área). */
export function pickCornerTaker<T extends { role: Position; passing: number }>(field: readonly T[]): T | undefined {
    const pool = field.filter((p) => p.role !== 'GK' && p.role !== 'PIVO');
    const from = pool.length ? pool : field.filter((p) => p.role !== 'GK');
    return from.reduce<T | undefined>((b, p) => (!b || p.passing > b.passing ? p : b), undefined);
}

/** Quem cobra: o escolhido na escalação, se estiver em quadra (e não for o goleiro); senão o padrão. */
function cornerTaker(s: MatchState, team: 0 | 1, field: PlayerState[]): PlayerState {
    const uid = s.teams[team].setup.cornerTakerUid;
    const chosen = uid ? field.find((p) => (p.origin ?? p.inst).uid === uid) : undefined;
    if (chosen) return chosen;
    const pick = pickCornerTaker(field.map((p) => ({ p, role: p.role, passing: p.attr.passing })));
    return pick?.p ?? field[0];
}

/** Sorteio da jogada: o "Variar" pesa pelo time que tem; a instrução multiplica a jogada pedida (não trava). */
function pickCornerPlay(s: MatchState, team: 0 | 1, others: PlayerState[]): CornerPlay {
    const C = CORNER_TUNING;
    const top = (f: (p: PlayerState) => number) => others.reduce((m, p) => Math.max(m, f(p)), 0) / 60;
    const air = top((p) => aerialEff(s, p));
    const shot = top((p) => eff(s, p, 'shooting'));
    const w: Record<CornerPlay, number> = {
        area: C.playWeight.area * air * air,
        short: C.playWeight.short * shot * shot,
        near: C.playWeight.near,
    };
    const plan: CornerPlan = s.teams[team].corner;
    if (plan !== 'mixed') w[plan] *= C.planBoost;
    return s.rng.weighted(['area', 'short', 'near'] as const, (k) => w[k]);
}

/**
 * Desvio pela linha de fundo (espalmada, bloqueio): a bola rola até um ponto da linha fora das traves, do lado em
 * que estava (goleiro: do lado da mão). Bola colada na linha não desvia (cruzaria dentro do gol): devolve false e a
 * jogada segue como antes. Exportada só pro teste.
 */
export function deflectOut(s: MatchState, p: PlayerState, from: Vec2): boolean {
    const { width, goalWidth } = s.cfg.pitch;
    const gy = width / 2;
    const lineX = ownGoalX(s, p.team);
    const back = Math.abs(from.x - lineX);
    if (back < 0.3) return false;
    const gk = p.role === 'GK';
    const dy = from.y - p.pos.y;
    // goleiro espalma para o lado da mão, sem cruzar o próprio corpo
    const side =
        gk && Math.abs(dy) > 0.05 ? Math.sign(dy) : from.y > gy ? 1 : from.y < gy ? -1 : s.rng.chance(0.5) ? 1 : -1;
    let y = gy + side * (goalWidth / 2 + s.rng.range(0.6, 3));
    if (gk) {
        // a bola sai de lado e só depois vai para a linha: passa do corpo dele (0,7 m) antes de ficar entre ele e o
        // gol, e já está fora da trave quando chega perto da linha (0,6 m), em vez de rolar por trás dele rente ao gol
        const ahead = Math.max(0, (from.x - p.pos.x) * attackSign(p.team));
        const body = (Math.max(0, 0.7 - dy * side) / (ahead + 0.1)) * back;
        const post = ((gy + side * (goalWidth / 2 + 0.4) - from.y) * side * back) / Math.max(back - 0.6, 0.1);
        const minLat = Math.max(body, post);
        if ((y - from.y) * side < minLat) y = from.y + side * minLat;
        y = clamp(y, 0.5, width - 0.5);
    }
    const cross = v(lineX, y);
    const d = dist(from, cross);
    s.ball.vel = scale(norm(sub(cross, from)), Math.sqrt(2 * FRICTION * d) + 2.5);
    s.ball.z = 0;
    s.ball.vz = 0;
    // quem desviou não domina a própria sobra
    p.kickCooldown = Math.max(p.kickCooldown, 0.4);
    return true;
}

/**
 * Escanteio: monta o molde (triângulo do ataque, marcação da defesa a 5 m da bola), sorteia a jogada e para a
 * partida um instante. A cobrança sai no fim da fase `corner` (takeCorner).
 */
function setupCorner(s: MatchState, team: 0 | 1, yCross: number) {
    const subbed = applyPendingSubs(s);
    const { length, width } = s.cfg.pitch;
    const gy = width / 2;
    const side = yCross < gy ? -1 : 1;
    // molde: profundidade rumo ao gol atacado (length = linha de fundo) e lado (+ = lado do canto)
    const at = (xr: number, u: number) => toWorld(s, team, xr, gy + side * u);
    const def: 0 | 1 = team === 0 ? 1 : 0;
    const field = (t: 0 | 1) => s.players.filter((p) => p.team === t && p.role !== 'GK');
    const taker = cornerTaker(s, team, field(team));
    const others = field(team).filter((p) => p !== taker);
    const play = pickCornerPlay(s, team, others);
    const byAir = (a: PlayerState, b: PlayerState) => aerialEff(s, b) - aerialEff(s, a) || a.idx - b.idx;
    const byShot = (a: PlayerState, b: PlayerState) => eff(s, b, 'shooting') - eff(s, a, 'shooting') || a.idx - b.idx;
    // papéis: na curta o melhor chute fica na marca dos 10 m; nas outras, o melhor no alto vai na 2ª trave
    let far: PlayerState | undefined;
    let near: PlayerState | undefined;
    let outside: PlayerState | undefined;
    if (play === 'short') {
        outside = [...others].sort(byShot)[0];
        [far, near] = others.filter((p) => p !== outside).sort(byAir);
    } else {
        const air = [...others].sort(byAir);
        far = air[0];
        [outside, near] = air.slice(1).sort(byShot);
    }
    const [markFar, markNear, post, closer] = field(def).sort(byAir);
    const gk = s.players.find((p) => p.team === def && p.role === 'GK');
    const ownGk = s.players.find((p) => p.team === team && p.role === 'GK');
    const ballPos = at(length - 0.35, gy - 0.35);
    const spots: [PlayerState | undefined, Vec2][] = [
        [far, at(length - 7, -1)],
        [near, at(length - 6.5, 1.6)],
        [outside, at(length - 11.5, 0.3)],
        [ownGk, at(5, 0)],
        [markFar, at(length - 5.8, -0.8)],
        [markNear, at(length - 5.4, 1.3)],
        [post, at(length - 0.6, 2.2)],
        [closer, at(length - 9.8, 0.4)],
        [gk, at(length - 0.5, 0.4)],
    ];
    const toBall = norm(sub(at(length - 3, -1), ballPos));
    spots.push([taker, sub(ballPos, scale(toBall, DRIBBLE_OFFSET))]);
    for (const [p, pos] of spots) {
        if (!p) continue;
        p.pos = pos;
        p.vel = v(0, 0);
        p.heading = p === taker ? toBall : norm(sub(ballPos, pos));
        p.facing = dir8(p.heading, p.facing);
        p.action = Action.Idle;
        p.kickCooldown = 0;
        p.ai.nextDecision = 0;
        p.fx.charging = null;
        p.fx.air = null;
        p.fx.flee = null;
    }
    s.ball = {
        pos: ballPos,
        vel: v(0, 0),
        z: 0,
        vz: 0,
        owner: taker.idx,
        lastTouch: taker.idx,
        lastKick: null,
        shot: null,
        assistCandidate: null,
    };
    s.setPiece = {
        team,
        play,
        taker: taker.idx,
        at: ballPos,
        contestTick: 0,
        runners: [],
        roles: {
            far: far?.idx ?? null,
            near: near?.idx ?? null,
            outside: outside?.idx ?? null,
            markFar: markFar?.idx ?? null,
            markNear: markNear?.idx ?? null,
            post: post?.idx ?? null,
            closer: closer?.idx ?? null,
            gk: gk?.idx ?? null,
        },
        moveId: null,
        until: 0,
    };
    emit(s, { type: 'corner', team, by: taker.idx, play });
    s.phase = 'corner';
    // tempo extra para a substituição aparecer na tela
    s.phaseTimer = subbed ? 2 : CORNER_TUNING.setTime;
    checkEvolutions(s);
}

/**
 * Golpe na bola parada (cobrador ou quem disputa no alto): gasta o uso como sempre. Jump Kick/Hi Jump Kick podem
 * errar (e quem erra se machuca, como no `crash`).
 */
function setPieceMove(
    s: MatchState,
    p: PlayerState,
    ids: readonly string[],
    chance: number,
): { moveId: string; hit: boolean } | null {
    if (!ids.length || p.moveCooldown > 0) return null;
    const slot = p.inst.moves.findIndex((m, i) => ids.includes(m) && p.moveUses[i] > 0);
    if (slot < 0 || !s.rng.chance(chance)) return null;
    const moveId = p.inst.moves[slot];
    const prof = moveProfile(moveId);
    p.moveUses[slot]--;
    p.moveCooldown = MOVE_COOLDOWN;
    s.nextMoveTick = s.tick + Math.round(MOVE_GAP * s.cfg.tickRate);
    p.stats.movesUsed++;
    const hit = DRAWBACK[moveId] !== 'crash' || s.rng.chance(prof.data.accuracy / 100);
    if (!hit) {
        p.energy = Math.max(0, p.energy - 0.08);
        p.stun = Math.max(p.stun, 0.6);
        setAction(p, Action.Hurt, 0.6);
    }
    emit(s, {
        type: 'move',
        by: p.idx,
        moveId,
        kind: prof.kind,
        target: null,
        effectiveness: null,
        hit,
        withBall: true,
    });
    s.lastMove[p.team] = moveId;
    return { moveId, hit };
}

/** A cobrança: golpe do cobrador, gol olímpico (raro, só no vento) e a bola indo pro ponto da jogada. */
function takeCorner(s: MatchState) {
    s.phase = 'play';
    const sp = s.setPiece;
    if (!sp) return;
    const C = CORNER_TUNING;
    const p = s.players[sp.taker];
    const ball = s.ball;
    const { length, width, goalWidth } = s.cfg.pitch;
    const gy = width / 2;
    const side = ball.pos.y > gy ? 1 : -1;
    const at = (xr: number, u: number) => toWorld(s, sp.team, xr, gy + side * u);
    const used = setPieceMove(s, p, TAKER_MOVES[sp.play], C.takerMove);
    const moveId = used?.moveId ?? null;
    sp.moveId = moveId;
    // gol olímpico: a curva no vento vai direto no canto de lá
    if (moveId && WIND.has(moveId) && s.rng.chance(C.olympic)) {
        const prof = moveProfile(moveId);
        const k = Math.min(1.25, prof.strength);
        p.shotBonus = { power: 1 + 0.15 * k, accuracy: 1 + 0.45 * k, moveType: prof.data.type, moveId, timer: 1.5 };
        traitFx(s, p.idx, 'blowBall', moveId);
        s.setPiece = null;
        kick(s, p, 'shot', at(length, (-0.7 * goalWidth) / 2), 1);
        return;
    }
    if (sp.play === 'short') {
        const r = sp.roles.outside !== null ? s.players[sp.roles.outside] : null;
        if (!r) {
            s.setPiece = null;
            return;
        }
        kick(s, p, 'pass', r.pos, 1, r.idx);
        sp.until = s.tick + 3 * s.cfg.tickRate;
        return;
    }
    // na área (bola alta entre a marca do pênalti e a 2ª trave) ou rasteira forte na 1ª trave. O alvo é o ponto
    // da disputa: no alto a bola passa por ele a ~1,2 m (altura de cabeça) um pouco antes de cair
    const high = sp.play === 'area';
    const aimAt = high ? at(length - C.crossDepth, -0.3) : at(length - 1.3, 1.8);
    const err =
        moveId === 'swift'
            ? 0
            : C.crossError *
              (1.3 - eff(s, p, 'passing') / 99) *
              (moveId && WIND.has(moveId) ? C.windAim : 1) *
              aimFactor(s, p, 'pass');
    const target = v(
        clamp(aimAt.x + s.rng.gauss() * err, 0.6, length - 0.6),
        clamp(aimAt.y + s.rng.gauss() * err, 0.6, width - 0.6),
    );
    const flight = high ? (moveId === 'eggbomb' ? C.eggFlight : C.crossFlight) : C.nearTime;
    const ticks = Math.max(1, Math.round((flight - (high ? 0.25 : 0.05)) * s.cfg.tickRate));
    const t = ticks / s.cfg.tickRate;
    if (high) {
        ball.vel = scale(sub(target, ball.pos), 1 / t);
        ball.vz = (GRAVITY * flight) / 2;
        ball.z = 0.05;
        if (moveId === 'eggbomb') traitFx(s, p.idx, 'lob', moveId);
    } else {
        const d = dist(target, ball.pos);
        ball.vel = scale(norm(sub(target, ball.pos)), d / t + (FRICTION * t) / 2);
    }
    const receiverId = (high ? sp.roles.far : sp.roles.near) ?? undefined;
    ball.owner = null;
    ball.lastTouch = p.idx;
    ball.assistCandidate = p.idx;
    ball.lastKick = { by: p.idx, kind: 'pass', tick: s.tick, receiverId };
    p.stats.passes++;
    emit(s, { type: 'pass', by: p.idx, to: receiverId ?? null });
    setAction(p, Action.Kick, 0.3);
    p.kickCooldown = 0.35;
    p.heading = norm(sub(target, p.pos));
    p.facing = dir8(p.heading, p.facing);
    p.energy = Math.max(0, p.energy - 0.002);
    sp.at = target;
    sp.contestTick = s.tick + ticks;
    sp.until = sp.contestTick;
    const r = sp.roles;
    const runners = high ? [r.far, r.near, r.markFar, r.markNear] : [r.near, r.markNear, r.post];
    // o goleiro sai do gol no cruzamento que cai na área dele; na rasteira ele já está na 1ª trave
    const keeper = r.gk !== null ? s.players[r.gk] : null;
    if (keeper && (high ? isInOwnArea(s, keeper, target) : dist(keeper.pos, target) < 2)) runners.push(keeper.idx);
    sp.runners = runners.filter((i): i is number => i !== null);
}

/** Escanteio em andamento: na hora, a disputa; a curta expira se ninguém chutou. */
function updateSetPiece(s: MatchState) {
    const sp = s.setPiece!;
    if (sp.contestTick > 0 && s.tick >= sp.contestTick) {
        s.setPiece = null;
        contest(s, sp);
    } else if (s.tick > sp.until) s.setPiece = null;
}

/**
 * Bola afastada (defensor ganhou a disputa, goleiro socou): pelo alto, pra frente e pro lado do canto, por cima de
 * quem está na área (senão a sobra caía no pé de quem cobrou e virava gol toda hora).
 */
function clearBall(s: MatchState, p: PlayerState, speed: number) {
    const ball = s.ball;
    const toSide = ball.pos.y > s.cfg.pitch.width / 2 ? 1 : -1;
    const dir = norm(v(attackSign(p.team), toSide * s.rng.range(0.3, 1.2)));
    ball.owner = null;
    ball.shot = null;
    ball.vel = scale(dir, speed);
    // sai já acima do alcance de quem está em volta (REACH_Z)
    ball.z = REACH_Z + 0.1;
    ball.vz = CORNER_TUNING.clearLift;
    ball.lastTouch = p.idx;
    ball.assistCandidate = null;
    ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
    p.kickCooldown = 0.35;
    p.heading = dir;
    p.facing = dir8(dir, p.facing);
    setAction(p, Action.Kick, 0.3);
}

/**
 * Disputa da bola do escanteio. No alto: força 45%, tamanho 35%, posicionamento 20% (`aerialEff`), golpe de quem
 * sobe e o goleiro saindo; na rasteira da 1ª trave, posicionamento e velocidade. Sorteio com peso entre quem está
 * perto (o peso é a nota ao quadrado, e quem está mais perto do ponto leva vantagem).
 */
function contest(s: MatchState, sp: SetPiece) {
    const C = CORNER_TUNING;
    const ball = s.ball;
    if (ball.owner !== null || ball.shot) return;
    const high = sp.play === 'area';
    const R = high ? C.aerialRadius : C.nearRadius;
    const egg = sp.moveId === 'eggbomb';
    const inReach = (o: PlayerState) => {
        if (o.idx === sp.taker || hidden(o) || isIncapacitated(o)) return false;
        const keeper = o.role === 'GK' && o.team !== sp.team && isInOwnArea(s, o, ball.pos);
        if (o.role === 'GK' && !keeper) return false;
        return dist(o.pos, ball.pos) < R + (keeper ? C.gkExtra : 0);
    };
    const cands = s.players.filter(inReach);
    if (!cands.length) return;
    // golpe na disputa no alto: o atacante mais forte no alto que tiver um (no máximo um por escanteio)
    let mover: PlayerState | null = null;
    let moveId: string | null = null;
    if (high) {
        const attackers = cands.filter((o) => o.team === sp.team).sort((a, b) => aerialEff(s, b) - aerialEff(s, a));
        for (const o of attackers) {
            const used = setPieceMove(s, o, AERIAL_MOVES, C.headerMove);
            if (!used) continue;
            if (used.hit) {
                mover = o;
                moveId = used.moveId;
            }
            break;
        }
    }
    // quem errou o Jump Kick caiu e sai da disputa
    const live = cands.filter((o) => !isIncapacitated(o));
    if (!live.length) return;
    const weight = (o: PlayerState) => {
        let sc: number;
        if (o.role === 'GK') sc = eff(s, o, 'goalkeeping') * (egg ? 1.15 : 1);
        else if (high) sc = aerialEff(s, o) * (egg ? 0.5 + sizePercentile(o.sp) : 1);
        else sc = 0.6 * eff(s, o, 'positioning') + 0.4 * eff(s, o, 'pace');
        if (o === mover && moveId) {
            sc *= HIGH_FLYERS.has(moveId)
                ? C.flyBoost
                : 1 + C.headerBoost * Math.min(1.25, moveProfile(moveId).strength);
        }
        const close = clamp(1.3 - (0.6 * dist(o.pos, ball.pos)) / R, 0.5, 1.3);
        return sc * sc * close * (o.team === sp.team ? 1 : C.defenseEdge);
    };
    const w = s.rng.weighted(live, weight);
    const usedMove = w === mover ? moveId : null;
    if (w.team === sp.team) {
        // ataque: cabeçada ou voleio (no alto), desvio de primeira (rasteira)
        const kind: 'header' | 'volley' | 'flick' = !high
            ? 'flick'
            : usedMove
              ? VOLLEY_MOVES.has(usedMove)
                  ? 'volley'
                  : 'header'
              : s.rng.chance(0.35 + 0.5 * sizePercentile(w.sp))
                ? 'header'
                : 'volley';
        emit(s, { type: 'aerial', by: w.idx, team: w.team, high, kind, moveId: usedMove });
        if (usedMove) {
            const prof = moveProfile(usedMove);
            const k = Math.min(1.25, prof.strength);
            w.shotBonus = {
                power: 1 + 0.3 * k,
                accuracy: 1 + 0.2 * k,
                moveType: prof.data.type,
                moveId: usedMove,
                timer: 1.5,
            };
        }
        const power = kind === 'header' ? 0.65 + (0.35 * eff(s, w, 'strength')) / 99 : kind === 'volley' ? 0.95 : 0.8;
        const aim = kind === 'header' ? C.headerAim : kind === 'volley' ? C.volleyAim : C.flickAim;
        w.kickCooldown = 0;
        kick(s, w, 'shot', autoShotTarget(s, w), power, undefined, aim);
        return;
    }
    if (w.role === 'GK') {
        // a rasteira forte não dá pra segurar: espalma/soca
        const caught = high && s.rng.chance(C.gkCatch + (0.3 * eff(s, w, 'goalkeeping')) / 99);
        emit(s, { type: 'aerial', by: w.idx, team: w.team, high, kind: caught ? 'catch' : 'punch', moveId: null });
        setAction(w, Action.Dive, 0.5);
        if (caught) {
            ball.owner = w.idx;
            ball.vel = v(0, 0);
            ball.z = 0;
            ball.vz = 0;
            ball.lastTouch = w.idx;
            ball.assistCandidate = null;
            w.ai.holdUntil = s.tick + Math.round(1.5 * s.cfg.tickRate);
            w.ai.nextDecision = 0;
        } else clearBall(s, w, s.rng.range(8, 11));
        return;
    }
    emit(s, { type: 'aerial', by: w.idx, team: w.team, high, kind: 'clear', moveId: null });
    if (!high && s.rng.chance(C.ownDeflect)) {
        // desvio contra: a dividida na 1ª trave escapa pro próprio gol
        const { width, goalWidth } = s.cfg.pitch;
        const into = v(ownGoalX(s, w.team), width / 2 + s.rng.range(-0.6, 0.6) * goalWidth * 0.5);
        ball.vel = scale(norm(sub(into, ball.pos)), s.rng.range(8, 10));
        ball.z = 0;
        ball.vz = 0;
        ball.lastTouch = w.idx;
        ball.assistCandidate = null;
        ball.lastKick = { by: w.idx, kind: 'clear', tick: s.tick };
        w.kickCooldown = 0.35;
        return;
    }
    clearBall(s, w, s.rng.range(10, 14));
}

// ---------------------------------------------------------------- tempos, substituições e pênaltis
function endHalf(s: MatchState) {
    s.setPiece = null;
    if (s.half === 1) {
        emit(s, { type: 'halftime', score: [s.score[0], s.score[1]] });
        for (const p of s.players) {
            p.energy = Math.min(1, p.energy + s.cfg.halftimeRecovery);
            p.status = null;
            loseCharge(s, p);
            p.buffs = [];
            // os traços do 1º tempo (fúria, clones, casco, mira, tipo copiado...) não voltam do vestiário;
            // o Focus Energy fica, como o bônus de golpe guardado para o próximo chute (shotBonus)
            p.fx = { ...freshTraits(), focus: p.fx.focus };
        }
        halftimeSubs(s);
        for (const t of s.teams) {
            t.combosUsed = [];
            // tempo pedido no fim do 1º tempo não passa pro 2º (o intervalo já é a pausa)
            t.agency.timeoutPending = false;
        }
        s.phase = 'halftime';
        s.phaseTimer = 2;
        return;
    }
    // apito final: ninguém termina no ar, carregando ou fugindo (o último quadro fica limpo)
    for (const p of s.players) {
        p.fx.air = null;
        p.fx.charging = null;
        p.fx.bide = null;
        p.fx.flee = null;
    }
    emit(s, { type: 'fulltime', score: [s.score[0], s.score[1]] });
    s.phase = 'fulltime';
    if (s.score[0] === s.score[1] && s.cfg.knockout) penaltyShootout(s);
    s.winner =
        s.score[0] > s.score[1]
            ? 0
            : s.score[1] > s.score[0]
              ? 1
              : s.shootout
                ? s.shootout[0] > s.shootout[1]
                    ? 0
                    : 1
                : null;
    emit(s, { type: 'end', winner: s.winner, score: [s.score[0], s.score[1]], shootout: s.shootout });
    s.finished = true;
}

/**
 * Troca `out` pelo reserva `inst` (mesma vaga e posição). `fly`: troca volante, com a bola rolando: quem entra vem da
 * lateral perto do banco (o goleiro troca no lugar, pra não deixar o gol vazio).
 */
function substitute(s: MatchState, out: PlayerState, inst: PokemonInstance, fly = false) {
    const rt = s.teams[out.team];
    rt.bench = rt.bench.filter((b) => b.uid !== inst.uid);
    // quem entra assume a vaga na escalação: sinergias, duplas e capitão passam a contar com ele
    rt.lineup[out.slot] = inst;
    const fresh = createPlayer(out.idx, out.team, out.slot, inst, out.role, bonusesOf(s, out.team));
    s.subbedOut.push(out);
    fresh.pos = out.pos;
    // entra pela lateral, de frente pra quadra
    if (fly && out.role !== 'GK') {
        fresh.pos = benchSpot(s, out.team);
        fresh.heading = v(0, 1);
    }
    s.players[out.idx] = fresh;
    emit(s, {
        type: 'sub',
        team: out.team,
        out: out.name,
        in: fresh.name,
        outIdx: out.idx,
        outUid: (out.origin ?? out.inst).uid,
        inUid: inst.uid,
        outSpeciesId: out.inst.speciesId,
        inSpeciesId: inst.speciesId,
        inShiny: inst.shiny,
        ...(fly ? { fly } : {}),
    });
    transformDittos(s, [fresh]);
    refreshTeamBonuses(s, out.team);
}

/**
 * Mudança de prancheta: cada um vai pra vaga nova (posição, alvo da IA e saída de bola mudam juntos) e os atributos
 * são recalculados pela posição; fôlego, status, reforços e estatísticas continuam. Quem saiu numa troca vale como
 * quem entrou no lugar dele. Lista que não for exatamente quem está em quadra é ignorada.
 */
function applyLineup(s: MatchState, o: LineupOrder): boolean {
    const f = FORMATIONS[o.formation];
    const rt = s.teams[o.team];
    const resolve = (uid: string) => {
        for (const e of s.events) if (e.type === 'sub' && e.team === o.team && e.outUid === uid) uid = e.inUid;
        return uid;
    };
    const moved = o.order.map((u) => {
        const uid = resolve(u);
        return s.players.find((p) => p.team === o.team && (p.origin ?? p.inst).uid === uid);
    });
    if (!f || moved.length !== s.cfg.teamSize || new Set(moved).size !== moved.length || !moved.every((p) => p))
        return false;
    const players = moved as PlayerState[];
    const lineup = players.map((p) => rt.lineup[p.slot]);
    players.forEach((p, slot) => {
        p.slot = slot;
        p.role = f.slots[slot];
    });
    rt.formation = f;
    rt.lineup = lineup;
    emit(s, { type: 'lineup', team: o.team, formation: f.id, idx: players.map((p) => p.idx) });
    refreshTeamBonuses(s, o.team);
    return true;
}

/**
 * Bola parada (saída de bola, tiro de meta, escanteio, intervalo): entram as trocas e a prancheta do técnico.
 * Devolve se teve troca pedida ou prancheta que valeu (a bola parada espera um pouco mais pra tela mostrar).
 */
export function applyPendingSubs(s: MatchState): boolean {
    const agency = applyDeadBallAgency(s);
    if (!s.pendingSubs.length) return agency;
    let changed = agency;
    for (const order of s.pendingSubs.splice(0)) {
        if (order.kind === 'lineup') {
            changed = applyLineup(s, order) || changed;
            continue;
        }
        changed = true;
        const out = s.players.find((p) => p.team === order.team && (p.origin ?? p.inst).uid === order.outUid);
        const inst = s.teams[order.team].bench.find((b) => b.uid === order.inUid);
        if (out && inst) substitute(s, out, inst);
    }
    refreshAuras(s);
    return changed;
}

/** Zona de substituição do time: na lateral de cima, perto do meio, do lado do campo dele (onde a tela põe o banco). */
export const benchSpot = (s: MatchState, team: 0 | 1): Vec2 =>
    v(s.cfg.pitch.length / 2 - attackSign(team) * BENCH_OFFSET, 0.4);
const BENCH_OFFSET = 3.2;

/**
 * Troca volante e prancheta com a bola rolando (21/10/2026): entram na hora, cada um corre pro lugar novo. A troca de
 * quem está com a bola espera ele soltar.
 */
export function applyFlyingSubs(s: MatchState) {
    const wait: (SubOrder | LineupOrder)[] = [];
    let changed = false;
    for (const order of s.pendingSubs) {
        if (order.kind === 'lineup') {
            changed = applyLineup(s, order) || changed;
            continue;
        }
        const out = s.players.find((p) => p.team === order.team && (p.origin ?? p.inst).uid === order.outUid);
        const inst = s.teams[order.team].bench.find((b) => b.uid === order.inUid);
        if (!out || !inst) continue;
        if (s.ball.owner === out.idx) {
            wait.push(order);
            continue;
        }
        substitute(s, out, inst, true);
        changed = true;
    }
    s.pendingSubs = wait;
    if (changed) refreshAuras(s);
}

/** No intervalo, o time da IA tira o mais cansado se ele estiver bem abaixo do resto. */
function halftimeSubs(s: MatchState) {
    for (const team of [0, 1] as const) {
        const rt = s.teams[team];
        if (rt.setup.manualSubs) continue;
        const tired = s.players
            .filter((p) => p.team === team && p.role !== 'GK' && p.energy < 0.8)
            .sort((a, b) => a.energy - b.energy)
            .slice(0, 1);
        for (const out of tired) {
            const inst = rt.bench[0];
            if (!inst) break;
            substitute(s, out, inst);
        }
    }
    applyPendingSubs(s);
    refreshAuras(s);
}

function penaltyShootout(s: MatchState) {
    // os pênaltis são o trecho seguinte ao último do tempo normal
    enterSegment(s);
    const takers = ([0, 1] as const).map((t) => penaltyTakers(s, t));
    const gks = [0, 1].map(
        (t) => s.players.find((p) => p.team === t && p.role === 'GK') ?? s.players.find((p) => p.team === t)!,
    );
    const score: [number, number] = [0, 0];
    const kicks = s.cfg.penaltyKicks;
    let round = 0;
    const take = (team: 0 | 1) => {
        const shooter = takers[team][round % takers[team].length];
        const gk = gks[team === 0 ? 1 : 0];
        const typeEdge = typeMultiplier(shooter.sp.types, gk.sp.types) / typeMultiplier(gk.sp.types, shooter.sp.types);
        const pGoal = clamp(
            (0.72 + (0.22 * shooter.attr.shooting) / 99 - (0.25 * gk.attr.goalkeeping) / 99) * typeEdge,
            0.35,
            0.92,
        );
        const scored = s.rng.chance(pGoal);
        if (scored) score[team]++;
        s.tick += s.cfg.tickRate * 3;
        emit(s, {
            type: 'penalty',
            by: shooter.idx,
            gk: gk.idx,
            scored,
            round: round + 1,
            shootout: [score[0], score[1]],
        });
    };
    for (round = 0; round < kicks; round++) {
        take(0);
        if (score[0] > score[1] + (kicks - round)) break;
        // o time 1 pode já ter vencido antes de cobrar (o time 0 não alcança mais)
        if (score[1] > score[0] + (kicks - round - 1)) break;
        take(1);
        if (Math.abs(score[0] - score[1]) > kicks - round - 1) break;
    }
    // morte súbita
    while (score[0] === score[1]) {
        take(0);
        take(1);
        round++;
    }
    s.shootout = score;
}

// ---------------------------------------------------------------- agência do técnico (experimento, agency.ts)
export function freshAgency(): AgencyRuntime {
    return {
        timeouts: [false, false],
        timeoutPending: false,
        flyGk: false,
        max: null,
        penaltyOrder: null,
    };
}

/** uid de quem está agora no lugar de `uid` (quem saiu numa troca vale como quem entrou). */
function resolveUid(s: MatchState, team: 0 | 1, uid: string): string {
    for (const e of s.events) if (e.type === 'sub' && e.team === team && e.outUid === uid) uid = e.inUid;
    return uid;
}

/**
 * Ordem da agência no tick dela (LiveRunner). A que não vale agora (sem grito sobrando, tempo já pedido, barra
 * vazia...) é ignorada sem efeito nenhum: a mesma regra nos dois lados do duelo.
 */
export function applyAgencyOrder(s: MatchState, o: AgencyOrder) {
    if (s.phase === 'fulltime') return;
    const ag = s.teams[o.team].agency;
    switch (o.kind) {
        case 'timeout':
            if (s.phase === 'halftime' || ag.timeoutPending || ag.timeouts[s.half - 1]) return;
            ag.timeoutPending = true;
            return;
        case 'flyGk': {
            // na hora, como a troca volante (21/10/2026): no fim do jogo, esperar a bola parar gastava o tempo todo
            if (o.on === ag.flyGk) return;
            ag.flyGk = o.on;
            const gk = s.players.find((p) => p.team === o.team && p.role === 'GK');
            emit(s, { type: 'flyGk', team: o.team, on: o.on, by: gk?.idx ?? -1 });
            return;
        }
        case 'max':
            startMax(s, o.team);
            return;
        case 'penalties':
            ag.penaltyOrder = [...o.order];
            return;
    }
}

/** Bola parada: entra o pedido de tempo (fôlego e parada). */
function applyDeadBallAgency(s: MatchState): boolean {
    let changed = false;
    for (const team of [0, 1] as const) {
        const ag = s.teams[team].agency;
        if (ag.timeoutPending) {
            ag.timeoutPending = false;
            ag.timeouts[s.half - 1] = true;
            for (const p of s.players) {
                const gain = p.team === team ? AGENCY.timeoutEnergy : AGENCY.timeoutRivalEnergy;
                p.energy = Math.min(1, p.energy + gain);
            }
            s.pauseUntil = Math.max(s.pauseUntil, s.tick + AGENCY.timeoutTicks);
            emit(s, { type: 'timeout', team });
            changed = true;
        }
    }
    return changed;
}

/** Golpe que o capitão solta no máximo: a assinatura dele (se for de ataque), senão o 1º golpe de ataque. */
export function maxMoveOf(moves: readonly string[], speciesId: number): string | null {
    const attack = (m: string) => {
        const k = moveProfile(m).kind;
        return k === 'strike' || k === 'blast';
    };
    const sig = SIGNATURE[speciesId];
    if (sig && moves.includes(sig) && attack(sig)) return sig;
    return moves.find(attack) ?? (sig && moves.includes(sig) ? sig : (moves[0] ?? null));
}

/** O capitão de linha está na zona do golpe máximo (perto do gol atacado e com ângulo). */
export const inMaxZoneOf = (s: MatchState, p: PlayerState) => inMaxZone(p.pos.x, p.pos.y, p.team, s.cfg.pitch);

/**
 * Pede o golpe máximo: com a barra cheia, fica armado `maxArmTicks`. O de linha sai no chute da zona (a IA chuta na
 * hora, `AIController.carrier`); o do goleiro vira a defesa máxima quando um rival com a bola entra na zona.
 */
function startMax(s: MatchState, team: 0 | 1) {
    const ag = s.teams[team].agency;
    const cap = s.players.find((p) => p.team === team && p.captain);
    if (!cap || ag.max) return;
    const c = maxCharge(s.events, team, s.tick, s.cfg.teamSize);
    if (c.used || c.active || c.charge < 1) return;
    ag.max = { idx: cap.idx, until: s.tick + AGENCY.maxArmTicks, live: false };
}

/**
 * A cada tick com golpe máximo pedido: o goleiro arma a defesa máxima quando o rival com a bola entra na zona; o pedido
 * que passou sem a hora certa some sem gastar nada; a defesa máxima sem chute volta pela metade.
 */
function updateMax(s: MatchState) {
    for (const team of [0, 1] as const) {
        const ag = s.teams[team].agency;
        const max = ag.max;
        if (!max) continue;
        const cap = s.players[max.idx];
        if (!cap.captain || s.tick >= max.until) {
            ag.max = null;
            if (max.live) emit(s, { type: 'max', team, by: max.idx, phase: 'miss' });
            continue;
        }
        if (max.live || cap.role !== 'GK' || s.phase !== 'play' || s.ball.owner === null) continue;
        const carrier = s.players[s.ball.owner];
        if (carrier.team === team || !inMaxZoneOf(s, carrier)) continue;
        max.live = true;
        max.until = s.tick + AGENCY.maxGkTicks;
        emit(s, { type: 'max', team, by: cap.idx, phase: 'start', moveId: null });
    }
}

/** O chute do capitão armado na zona: a versão máxima do golpe dele (bem mais forte e mais certeiro). */
function maxShot(s: MatchState, p: PlayerState) {
    const moveId = maxMoveOf(p.inst.moves, p.inst.speciesId);
    s.teams[p.team].agency.max = null;
    p.shotBonus = {
        power: AGENCY.maxShot.power,
        accuracy: AGENCY.maxShot.accuracy,
        moveType: moveId ? (MOVES[moveId]?.type ?? typesOf(p)[0]) : typesOf(p)[0],
        moveId: moveId ?? '',
        timer: 1,
    };
    emit(s, { type: 'max', team: p.team, by: p.idx, phase: 'hit', moveId });
}

/** Defesa máxima do goleiro valendo agora (o próximo chute no gol é dele). */
const gkMaxLive = (s: MatchState, gk: PlayerState) => {
    const max = s.teams[gk.team].agency.max;
    return !!max?.live && max.idx === gk.idx;
};

/** A defesa máxima saiu: segura a bola e sai jogando na hora (0,15 s em vez de 0,8 s), puxando o contra-ataque. */
function gkMaxSave(s: MatchState, gk: PlayerState) {
    s.teams[gk.team].agency.max = null;
    emit(s, { type: 'max', team: gk.team, by: gk.idx, phase: 'hit', moveId: null });
    gk.ai.holdUntil = s.tick + 3;
}

/** Cobradores na ordem: a do técnico (quem saiu vale como quem entrou), senão pelo chute, como sempre. */
function penaltyTakers(s: MatchState, team: 0 | 1): PlayerState[] {
    const field = s.players
        .filter((p) => p.team === team && p.role !== 'GK')
        .sort((a, b) => b.attr.shooting - a.attr.shooting);
    const order = s.teams[team].agency.penaltyOrder;
    if (!order) return field;
    const uids = order.map((u) => resolveUid(s, team, u));
    const rank = (p: PlayerState) => {
        const i = uids.indexOf((p.origin ?? p.inst).uid);
        return i < 0 ? uids.length : i;
    };
    // o goleiro só bate se o técnico pôs ele na lista
    const gk = s.players.filter((p) => p.team === team && p.role === 'GK' && rank(p) < uids.length);
    return [...field, ...gk].sort((a, b) => rank(a) - rank(b));
}

// ---------------------------------------------------------------- snapshot
export function snapshot(s: MatchState): MatchSnapshot {
    const p: number[] = [];
    for (const pl of s.players) {
        let flags = 0;
        for (const b of pl.buffs) flags |= b.factor > 1 ? FLAG_BUFF : FLAG_DEBUFF;
        if (pl.shotBonus || pl.tackleBonus) flags |= FLAG_CHARGED;
        const fx = pl.fx;
        if (fx.air) flags |= fx.air.kind === 'fly' ? FLAG_FLY : FLAG_DIG;
        if (fx.charging || fx.bide) flags |= FLAG_CHARGING;
        if (fx.decoys > 0) flags |= FLAG_CLONES;
        if (fx.mini > 0) flags |= FLAG_MINI;
        if (fx.guard > 0) flags |= FLAG_GUARD;
        if (fx.rage) flags |= FLAG_RAGE;
        p.push(
            Math.round(pl.pos.x * 100) / 100,
            Math.round(pl.pos.y * 100) / 100,
            pl.facing,
            pl.action,
            pl.status ? STATUS_CODE[pl.status.kind] : 0,
            flags,
            Math.round(pl.energy * 100) / 100,
        );
    }
    return {
        tick: s.tick,
        half: s.half,
        minute: minuteOf(s),
        phase: s.phase,
        bfx: s.ball.shot?.moveId ? s.ball.shot.moveType : '',
        bx: Math.round(s.ball.pos.x * 100) / 100,
        by: Math.round(s.ball.pos.y * 100) / 100,
        bz: Math.round(s.ball.z * 100) / 100,
        owner: s.ball.owner ?? -1,
        score: [s.score[0], s.score[1]],
        p,
    };
}

export { fatigueFactor };
