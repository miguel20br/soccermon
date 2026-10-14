import { abilityEffect, isStatusImmune } from './abilities';
import {
    type AttrKey,
    computeAttributes,
    eligiblePositions,
    type Position,
    positionFactor,
    positionRating,
} from './attributes';
import type { Command } from './commands';
import type { MatchConfig } from './config';
import { MOVES, species } from './data';
import { eff, fatigueFactor, isIncapacitated, TACTIC_MODS } from './effective';
import { formationOf } from './formations';
import { type PokemonInstance, withBonus } from './instance';
import { ITEMS } from './items';
import { type ActiveLink, computeLinks, linkFactor } from './links';
import { moveProfile, type StatusKind } from './moves';
import { Rng } from './rng';
import { specialBonus } from './specials';
import {
    Action,
    FLAG_BUFF,
    FLAG_CHARGED,
    FLAG_DEBUFF,
    type MatchEvent,
    type MatchSnapshot,
    type MatchState,
    type PlayerState,
    STATUS_CODE,
    type TeamSetup,
} from './state';
import { computeSynergies, type Synergy, synergyFactor } from './synergy';
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
const TACKLE_RANGE = 1.35;
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

export function minuteOf(s: MatchState): number {
    const perHalf = s.cfg.displayHalfMinutes;
    return (s.half - 1) * perHalf + (s.time / s.cfg.halfSeconds) * perHalf;
}

// ---------------------------------------------------------------- criação
/** Bônus coletivos do time: sinergias de tipo e aura do capitão. */
interface TeamBonuses {
    synergies: Synergy[];
    links: ActiveLink[];
    captain: PokemonInstance | null;
}

function teamBonuses(setup: TeamSetup): TeamBonuses {
    const captain = setup.lineup.find((p) => p.uid === setup.captainUid) ?? null;
    return { synergies: computeSynergies(setup.lineup), links: computeLinks(setup.lineup), captain };
}

/** Aura do capitão: +3% para o time, +6% para quem divide tipo com ele. */
export function captainFactor(captain: PokemonInstance | null, types: readonly string[]): number {
    if (!captain) return 1;
    const capTypes = species(captain.speciesId).types;
    return types.some((t) => capTypes.includes(t)) ? 1.06 : 1.03;
}

function createPlayer(
    idx: number,
    team: 0 | 1,
    slot: number,
    inst: PokemonInstance,
    role: Position,
    bonuses: TeamBonuses,
): PlayerState {
    const sp = species(inst.speciesId);
    const synergy = synergyFactor(bonuses.synergies, sp.types) * linkFactor(bonuses.links, inst.uid);
    const isCaptain = bonuses.captain?.uid === inst.uid;
    const captainAura = isCaptain ? 1.03 : captainFactor(bonuses.captain, sp.types);
    const base = computeAttributes(sp, inst.level);
    const factor = positionFactor(eligiblePositions(base, sp.id), role);
    const raw = withBonus(base, specialBonus(inst));
    const ability = abilityEffect(inst.ability);
    const item = inst.item && ITEMS[inst.item] ? inst.item : null;
    const attr = { ...raw };
    for (const k of Object.keys(attr) as AttrKey[]) {
        // goleiro de linha / linha no gol: penalidade só no que importa para a posição
        const relevant = role === 'GK' ? k === 'goalkeeping' : k !== 'goalkeeping';
        attr[k] = attr[k] * (relevant ? factor : 1) * (ability.mods?.[k] ?? 1) * synergy * captainAura;
    }
    if (item === 'choiceband') attr.shooting *= 1.15;
    const moveUses = inst.moves.map((m, i) => (item === 'choiceband' && i > 0 ? 0 : moveProfile(m).uses));
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
        captain: isCaptain,
        item,
        itemUsed: false,
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

export function createMatch(cfg: MatchConfig, home: TeamSetup, away: TeamSetup, seed: number | string): MatchState {
    if (home.lineup.length !== cfg.teamSize || away.lineup.length !== cfg.teamSize) {
        throw new Error(`Cada time precisa de ${cfg.teamSize} titulares`);
    }
    const players: PlayerState[] = [];
    const formations = [formationOf(home.formation), formationOf(away.formation)];
    [home, away].forEach((setup, t) => {
        const team = t as 0 | 1;
        const bonuses = teamBonuses(setup);
        setup.lineup.forEach((inst, slot) => {
            players.push(createPlayer(players.length, team, slot, inst, formations[team].slots[slot], bonuses));
        });
    });
    const s: MatchState = {
        cfg,
        rng: new Rng(seed, 'match'),
        tick: 0,
        half: 1,
        time: 0,
        phase: 'kickoff',
        phaseTimer: 1,
        kickoffTeam: 0,
        teams: [
            {
                setup: home,
                formation: formations[0],
                tactic: home.tactic,
                bench: [...home.bench],
                possessionTicks: 0,
                combosUsed: [],
            },
            {
                setup: away,
                formation: formations[1],
                tactic: away.tactic,
                bench: [...away.bench],
                possessionTicks: 0,
                combosUsed: [],
            },
        ],
        players,
        auraHolders: [],
        subbedOut: [],
        pendingSubs: [],
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
        const fresh = createPlayer(p.idx, p.team, p.slot, copy, p.role, teamBonuses(s.teams[p.team].setup));
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
    if (!lk || lk.kind !== 'pass' || lk.receiverId !== shooter.idx || lk.by === shooter.idx) return null;
    if (s.tick - lk.tick > 4 * s.cfg.tickRate) return null;
    const partner = s.players[lk.by];
    if (!partner || partner.team !== shooter.team) return null;
    const rt = s.teams[shooter.team];
    const links = computeLinks(rt.setup.lineup);
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
    }
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

    if (s.phase !== 'play') {
        updatePhase(s, dt, commands);
        return;
    }

    for (const p of s.players) {
        tickTimers(s, p, dt);
        const cmds = commands[p.idx];
        const list = Array.isArray(cmds) ? cmds : cmds ? [cmds] : [];
        let moved = false;
        if (!isIncapacitated(p)) {
            for (const c of list) {
                if (c.type === 'move' || c.type === 'skill') moved = true;
                applyCommand(s, p, c, dt);
            }
        }
        if (!moved) applyMovement(s, p, v(0, 0), false, dt);
    }

    updateBall(s, dt);
    if (s.phase === 'play') checkPossession(s);
    if (s.ball.owner !== null) s.teams[s.players[s.ball.owner].team].possessionTicks++;

    s.time += dt;
    if (s.time >= s.cfg.halfSeconds && s.phase === 'play') endHalf(s);
}

function updatePhase(s: MatchState, dt: number, commands: (Command | Command[])[]) {
    s.phaseTimer -= dt;
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
    } else if (s.phase === 'halftime' && s.phaseTimer <= 0) {
        s.half = 2;
        s.time = 0;
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
        if (p.status.kind === 'psn' || p.status.kind === 'brn') p.energy -= 0.004 * dt;
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
                p.energy -= 0.01;
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

function kick(s: MatchState, p: PlayerState, kind: 'pass' | 'shot', target: Vec2, power: number, receiverId?: number) {
    const ball = s.ball;
    const toTarget = sub(target, p.pos);
    const distance = len(toTarget);
    let speed: number;
    let sigma: number;
    let moveId: string | null = null;
    let moveType = p.sp.types[0];

    if (kind === 'pass') {
        const passing = eff(s, p, 'passing');
        speed = clamp(Math.sqrt(2 * FRICTION * distance) * 1.05 + 2.2, 5, 17) * clamp(power, 0.6, 1.3);
        sigma = 0.1 * (1.3 - passing / 99);
        setAction(p, Action.Kick, 0.3);
        p.stats.passes++;
        ball.assistCandidate = p.idx;
        emit(s, { type: 'pass', by: p.idx, to: receiverId ?? null });
    } else {
        const shooting = eff(s, p, 'shooting');
        const bonus = p.shotBonus;
        // Scope Lens: chute crítico
        const crit = p.item === 'scopelens' && s.rng.chance(0.15);
        // combo de sinergia: chute mais forte e mais preciso
        const combo = comboLink(s, p);
        const comboMult = combo ? 1.2 : 1;
        if (combo) {
            s.teams[p.team].combosUsed.push(combo.link);
            emit(s, { type: 'combo', by: p.idx, partner: combo.partner, link: combo.link });
        }
        speed =
            (10 + (15 * shooting) / 99) * clamp(power, 0.5, 1.1) * (bonus?.power ?? 1) * (crit ? 1.25 : 1) * comboMult;
        sigma =
            (0.07 * (1.3 - shooting / 99) * (1 + distance / 15)) /
            (bonus?.accuracy ?? 1) /
            (crit ? 1.4 : 1) /
            (combo ? 1.5 : 1);
        if (crit) emit(s, { type: 'item', by: p.idx, item: 'scopelens', effect: 'crit' });
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

    const dir = rotate(norm(toTarget), s.rng.gauss() * sigma);
    ball.vel = scale(dir, speed);
    ball.z = 0;
    ball.vz = 0;
    if (kind === 'pass' && distance >= LOB_MIN) {
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
    p.energy -= kind === 'shot' ? 0.006 : 0.002;
}

function tryTackle(s: MatchState, p: PlayerState, targetId: number) {
    const ball = s.ball;
    const carrier = s.players[targetId];
    if (!carrier || carrier.team === p.team || ball.owner !== targetId) return;
    if (p.tackleCooldown > 0 || dist(p.pos, carrier.pos) > TACKLE_RANGE) return;

    p.tackleCooldown = 1.1;
    p.stats.tackles++;
    setAction(p, Action.Tackle, 0.35);
    p.heading = norm(sub(carrier.pos, p.pos));
    p.facing = dir8(p.heading, p.facing);

    const bonus = p.tackleBonus;
    const atkTypes = bonus ? [bonus.moveType] : p.sp.types;
    const tackleTypeMult = typeMultiplier(atkTypes, carrier.sp.types) ** (p.ability.typeBoost ?? 1);
    const keepTypeMult = typeMultiplier(carrier.sp.types, p.sp.types) ** (carrier.ability.typeBoost ?? 1);
    // desarme por trás é mais difícil
    const behind = carrier.heading.x * (p.pos.x - carrier.pos.x) + carrier.heading.y * (p.pos.y - carrier.pos.y) < 0;
    const attack =
        (0.75 * eff(s, p, 'tackling') + 0.25 * eff(s, p, 'strength')) *
        tackleTypeMult *
        (bonus?.power ?? 1) *
        (p.item === 'quickclaw' ? 1.1 : 1) *
        (behind ? 0.85 : 1) *
        s.rng.range(0.72, 1.28);
    const defend =
        (0.65 * eff(s, carrier, 'dribble') + 0.35 * eff(s, carrier, 'strength')) *
        keepTypeMult *
        (carrier.evade > 0 ? 1.3 : 1) *
        (carrier.item === 'quickclaw' ? 1.1 : 1) *
        s.rng.range(0.72, 1.28);
    if (bonus) p.tackleBonus = null;

    const success = attack > defend;
    emit(s, { type: 'tackle', by: p.idx, victim: carrier.idx, success });

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
        if (bonus) {
            // carrinho com golpe: derruba, empurra e pode aplicar o efeito secundário
            knockback(s, carrier, p, 1.4, bonus.moveId);
            applySecondary(s, p, carrier, bonus.moveId);
        }
        carrier.kickCooldown = 0.4;
        if (carrier.ability.onTackledBoost) {
            for (const [k, f] of Object.entries(carrier.ability.onTackledBoost)) {
                carrier.buffs.push({ attr: k as AttrKey, factor: f, timer: 10 });
            }
            emit(s, { type: 'ability', by: carrier.idx, ability: carrier.inst.ability, target: null });
        }
        if (s.rng.chance(0.55)) {
            ball.owner = p.idx;
            ball.lastTouch = p.idx;
            ball.assistCandidate = null;
            ball.vel = v(0, 0);
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
export function nearestOpponent(s: MatchState, p: PlayerState, maxDist = Infinity): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = maxDist;
    for (const o of s.players) {
        if (o.team === p.team) continue;
        const d = dist(o.pos, p.pos);
        if (d < bestD) {
            bestD = d;
            best = o;
        }
    }
    return best;
}

const BOOST_TO_ATTR: Record<string, AttrKey[]> = {
    atk: ['shooting', 'strength'],
    def: ['tackling', 'strength'],
    spa: ['passing', 'shooting'],
    spd: ['positioning'],
    spe: ['pace'],
    accuracy: ['passing'],
    evasion: ['dribble'],
};

const STATUS_DURATION: Record<string, number> = {
    par: 6,
    slp: 2.5,
    psn: 10,
    brn: 8,
    frz: 2.5,
    confusion: 4,
    infatuation: 1.5,
};

export function applyStatus(
    s: MatchState,
    target: PlayerState,
    status: StatusKind | 'infatuation',
    by: number | null,
    source: string,
): boolean {
    if (target.status || isStatusImmune(target.ability, status)) return false;
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
    if (user.item === 'kingsrock' && move?.category !== 'Status' && s.rng.chance(0.25)) {
        target.stun = Math.max(target.stun, 0.7);
        setAction(target, Action.Hurt, 0.7);
        emit(s, { type: 'status', target: target.idx, status: 'flinch', by: user.idx, source: 'kingsrock' });
        return true;
    }
    const sec = move?.secondary;
    if (!sec) return false;
    const chance = Math.min(0.65, (sec.chance / 100) * 3 + 0.05) * (user.ability.statusChanceBoost ?? 1);
    if (!s.rng.chance(chance)) return false;
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
                target.buffs.push({ attr, factor: 1 + 0.1 * (stages ?? -1), timer: 10 });
            }
        }
        return true;
    }
    return false;
}

function performMove(s: MatchState, p: PlayerState, slot: number) {
    const moveId = p.inst.moves[slot];
    if (!moveId || p.moveUses[slot] <= 0 || p.moveCooldown > 0 || s.tick < s.nextMoveTick) return;
    const prof = moveProfile(moveId);
    p.moveUses[slot]--;
    p.moveCooldown = MOVE_COOLDOWN;
    s.nextMoveTick = s.tick + Math.round(MOVE_GAP * s.cfg.tickRate);
    p.stats.movesUsed++;
    const technician =
        p.ability.weakMoveBoost && prof.data.power > 0 && prof.data.power <= 60 ? p.ability.weakMoveBoost : 1;
    const typeItem = p.item && ITEMS[p.item]?.type === prof.data.type ? 1.2 : 1;
    const k = Math.min(1.25, prof.strength * technician * typeItem);
    const hasBall = s.ball.owner === p.idx;
    let target: PlayerState | null = null;
    let effectiveness: number | null = null;
    let hit = true;

    switch (prof.kind) {
        case 'strike':
            if (hasBall) {
                p.shotBonus = {
                    power: 1 + 0.3 * k,
                    accuracy: 1 + 0.2 * k,
                    moveType: prof.data.type,
                    moveId,
                    timer: 1.5,
                };
                setAction(p, Action.Charge, 0.25);
            } else {
                p.tackleBonus = { power: 1 + 0.4 * k, accuracy: 1, moveType: prof.data.type, moveId, timer: 1.5 };
                setAction(p, Action.Tackle, 0.3);
            }
            break;
        case 'blast':
            if (hasBall) {
                p.shotBonus = {
                    power: 1 + 0.15 * k,
                    accuracy: 1 + 0.45 * k,
                    moveType: prof.data.type,
                    moveId,
                    timer: 1.5,
                };
            } else {
                // sem bola: rajada atrapalha o rival mais próximo (perde fôlego e atrasa)
                target = nearestOpponent(s, p, 7);
                if (target) {
                    const mult = typeMultiplier([prof.data.type], target.sp.types);
                    hit = s.rng.chance(prof.data.accuracy / 100);
                    if (hit) {
                        target.stun = Math.max(target.stun, 0.4 * k * mult);
                        target.energy -= 0.05 * k * mult;
                        knockback(s, target, p, 0.8 * mult, moveId);
                        applySecondary(s, p, target, moveId);
                    }
                }
            }
            setAction(p, Action.Shoot, 0.35);
            break;
        case 'burst':
            p.buffs.push(
                { attr: 'pace', factor: 1.18 + 0.1 * k, timer: 2.5 },
                { attr: 'dribble', factor: 1.1, timer: 2.5 },
            );
            setAction(p, Action.Charge, 0.2);
            break;
        case 'buff':
            for (const [stat, stages] of Object.entries(prof.data.selfBoosts ?? { atk: 1 })) {
                for (const attr of BOOST_TO_ATTR[stat] ?? []) {
                    p.buffs.push({ attr, factor: 1 + 0.07 * Math.max(1, stages ?? 1), timer: 12 });
                }
            }
            if (moveId === 'reflect' || moveId === 'lightscreen')
                p.buffs.push({ attr: 'positioning', factor: 1.12, timer: 12 });
            if (moveId === 'focusenergy') p.buffs.push({ attr: 'shooting', factor: 1.12, timer: 12 });
            setAction(p, Action.Charge, 0.5);
            break;
        case 'debuff':
            target = nearestOpponent(s, p, 6);
            setAction(p, Action.Charge, 0.4);
            if (target) {
                hit = s.rng.chance(prof.data.accuracy / 100) && !target.ability.immuneDebuff;
                if (hit) {
                    for (const [stat, stages] of Object.entries(prof.data.targetBoosts ?? {})) {
                        for (const attr of BOOST_TO_ATTR[stat] ?? []) {
                            target.buffs.push({ attr, factor: 1 + 0.08 * (stages ?? -1), timer: 10 });
                        }
                    }
                }
            }
            break;
        case 'status':
            target = nearestOpponent(s, p, 6.5);
            setAction(p, Action.Charge, 0.4);
            if (target && prof.status) {
                effectiveness = typeMultiplier([prof.data.type], target.sp.types);
                const chance = (prof.data.accuracy / 100) * (p.ability.statusChanceBoost ? 1.15 : 1);
                // Thunder Wave não afeta Ground; pós de planta não afetam Grass
                const immuneByType =
                    (prof.data.type === 'Electric' && target.sp.types.includes('Ground')) ||
                    (moveId.endsWith('powder') || moveId === 'spore' ? target.sp.types.includes('Grass') : false);
                hit = !immuneByType && s.rng.chance(chance);
                if (hit) {
                    const itemBefore = target.itemUsed;
                    hit = applyStatus(s, target, prof.status, p.idx, moveId) || target.itemUsed !== itemBefore;
                }
            }
            break;
        case 'heal':
            if (moveId === 'rest') {
                p.energy = Math.min(1, p.energy + 0.6);
                applyStatus(s, p, 'slp', p.idx, 'rest');
            } else {
                p.energy = Math.min(1, p.energy + 0.3 * k + 0.1);
            }
            setAction(p, Action.Charge, 0.5);
            break;
        case 'flavor':
            setAction(p, Action.Celebrate, 0.6);
            hit = false;
            break;
    }
    if (target && effectiveness === null && prof.data.category !== 'Status') {
        effectiveness = typeMultiplier([prof.data.type], target.sp.types);
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
    });
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
            goalClearance(s, scoringTeam === 0 ? 1 : 0);
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
    for (const p of s.players) {
        if (p.team === shooter.team || isIncapacitated(p)) continue;
        const seg = pointSegment(p.pos, prev, end);
        const d = seg.d;
        const contact = add(prev, scale(sub(end, prev), seg.t));
        if (p.role === 'GK') {
            // chute que ia para fora não vira "defesa" (era 1/3 das defesas e gerava "QUE DEFESA!" à toa)
            if (shot.gkChecked || !shot.onTarget) continue;
            const reach = 0.55 + (1.0 * eff(s, p, 'goalkeeping')) / 99;
            if (d > reach) continue;
            shot.gkChecked = true;
            const gkTypeMult = typeMultiplier(p.sp.types, [shot.moveType]);
            const shotTypeMult = typeMultiplier([shot.moveType], p.sp.types) ** (shooter.ability.typeBoost ?? 1);
            const gk = eff(s, p, 'goalkeeping') * gkTypeMult;
            // chute no corpo do goleiro (d pequeno) é mais fácil de pegar
            const placement = clamp(d / reach, 0, 1);
            const pSave = clamp(
                (0.4 + (0.65 * gk) / 99 - 0.028 * (speed - 14) - 0.3 * placement) / shotTypeMult,
                0.05,
                0.95,
            );
            setAction(p, Action.Dive, 0.5);
            const sash = p.item === 'focussash' && !p.itemUsed && shot.onTarget;
            if (sash) {
                p.itemUsed = true;
                emit(s, { type: 'item', by: p.idx, item: 'focussash', effect: 'save' });
            }
            if (sash || s.rng.chance(pSave)) {
                p.stats.saves++;
                const caught = speed < 17 && s.rng.chance(0.55 + (0.3 * gk) / 99);
                emit(s, { type: 'save', by: p.idx, shooter: shooter.idx, caught });
                ball.shot = null;
                ball.pos = contact;
                // defender um Thunderbolt tem preço
                if (shot.moveId) applySecondary(s, shooter, p, shot.moveId);
                if (caught) {
                    ball.owner = p.idx;
                    ball.vel = v(0, 0);
                    ball.lastTouch = p.idx;
                    ball.assistCandidate = null;
                    p.ai.holdUntil = s.tick + Math.round(0.8 * s.cfg.tickRate);
                } else {
                    // espalma para o lado
                    const outward = v(attackSign(p.team) * s.rng.range(0.3, 1), s.rng.chance(0.5) ? 1 : -1);
                    ball.vel = scale(norm(outward), speed * s.rng.range(0.25, 0.45));
                    ball.lastTouch = p.idx;
                    ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
                }
                return;
            }
        } else if (d < 0.5 && !shot.blockedBy.includes(p.idx)) {
            shot.blockedBy.push(p.idx);
            const pBlock = 0.12 + (0.25 * eff(s, p, 'positioning')) / 99;
            if (s.rng.chance(pBlock)) {
                emit(s, { type: 'block', by: p.idx, shooter: shooter.idx });
                ball.shot = null;
                ball.pos = contact;
                if (shot.moveId) {
                    knockback(s, p, shooter, 1, shot.moveId);
                    applySecondary(s, shooter, p, shot.moveId);
                }
                ball.lastTouch = p.idx;
                ball.lastKick = { by: p.idx, kind: 'clear', tick: s.tick };
                ball.vel = rotate(scale(ball.vel, -0.3), s.rng.range(-1, 1));
                return;
            }
        }
    }
}

function checkPossession(s: MatchState) {
    const ball = s.ball;
    if (ball.owner !== null) return;
    const speed = len(ball.vel);
    let best: PlayerState | null = null;
    let bestD = Infinity;
    for (const p of s.players) {
        if (p.kickCooldown > 0 || isIncapacitated(p)) continue;
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
            chance = 0.18 + (0.35 * eff(s, p, 'positioning')) / 99 + (p.ability.interceptBonus ?? 0);
        } else if (!intended && speed > 12) chance = 0.4;
        else if (intended && speed > 16) chance = 0.6;
        if (chance < 1 && !s.rng.chance(chance)) continue;
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    if (!best) return;
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
    }
    emit(s, { type: 'goal', by: scorer.idx, assist, team, score: [s.score[0], s.score[1]], ownGoal });
    ball.vel = v(0, 0);
    ball.owner = null;
    ball.shot = null;
    ball.pos = v(clamp(ball.pos.x, -0.5, s.cfg.pitch.length + 0.5), ball.pos.y);
    s.phase = 'goal';
    s.phaseTimer = 3;
    s.kickoffTeam = team === 0 ? 1 : 0;
}

function goalClearance(s: MatchState, team: 0 | 1) {
    const subbed = s.pendingSubs.length > 0;
    applyPendingSubs(s);
    const gk = s.players.find((p) => p.team === team && p.role === 'GK') ?? s.players.find((p) => p.team === team)!;
    gk.pos = toWorld(s, team, 1.5, s.cfg.pitch.width / 2 + s.rng.range(-2, 2));
    gk.vel = v(0, 0);
    gk.heading = v(attackSign(team), 0);
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
}

// ---------------------------------------------------------------- tempos, substituições e pênaltis
function endHalf(s: MatchState) {
    if (s.half === 1) {
        emit(s, { type: 'halftime', score: [s.score[0], s.score[1]] });
        for (const p of s.players) {
            p.energy = Math.min(1, p.energy + s.cfg.halftimeRecovery);
            p.status = null;
            p.buffs = [];
        }
        halftimeSubs(s);
        for (const t of s.teams) t.combosUsed = [];
        s.phase = 'halftime';
        s.phaseTimer = 2;
        return;
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

/** Troca `out` pelo reserva `inst` (mesma vaga e posição). */
function substitute(s: MatchState, out: PlayerState, inst: PokemonInstance) {
    const rt = s.teams[out.team];
    rt.bench = rt.bench.filter((b) => b.uid !== inst.uid);
    const fresh = createPlayer(out.idx, out.team, out.slot, inst, out.role, teamBonuses(rt.setup));
    s.subbedOut.push(out);
    fresh.pos = out.pos;
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
    });
    transformDittos(s, [fresh]);
}

/** Bola parada (saída de bola, tiro de meta, intervalo): entram as substituições pedidas pelo técnico. */
export function applyPendingSubs(s: MatchState) {
    if (!s.pendingSubs.length) return;
    for (const order of s.pendingSubs.splice(0)) {
        const out = s.players.find((p) => p.team === order.team && (p.origin ?? p.inst).uid === order.outUid);
        const inst = s.teams[order.team].bench.find((b) => b.uid === order.inUid);
        if (out && inst) substitute(s, out, inst);
    }
    refreshAuras(s);
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
    const takers = [0, 1].map((t) =>
        s.players.filter((p) => p.team === t && p.role !== 'GK').sort((a, b) => b.attr.shooting - a.attr.shooting),
    );
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

// ---------------------------------------------------------------- snapshot
export function snapshot(s: MatchState): MatchSnapshot {
    const p: number[] = [];
    for (const pl of s.players) {
        let flags = 0;
        for (const b of pl.buffs) flags |= b.factor > 1 ? FLAG_BUFF : FLAG_DEBUFF;
        if (pl.shotBonus || pl.tackleBonus) flags |= FLAG_CHARGED;
        p.push(
            Math.round(pl.pos.x * 100) / 100,
            Math.round(pl.pos.y * 100) / 100,
            pl.facing,
            pl.action,
            pl.status ? STATUS_CODE[pl.status.kind] : 0,
            flags,
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
