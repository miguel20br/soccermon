import type { Command, Controller } from '../commands';
import { eff } from '../effective';
import { FRICTION, goalXFor, isInOwnArea, maxSpeed, ownGoalX, TACKLE_RANGE, toRel, toWorld } from '../match';
import { hasTrait, MOVE_TUNING, moveProfile, type Trait } from '../moves';
import type { MatchState, PlayerState, Tactic } from '../state';
import { add, clamp, dist, len, norm, pointSegment, scale, sub, type Vec2, v } from '../vec';
import { expectedGoals } from '../xg';

/**
 * IA no estilo "Simple Soccer" (Buckland): estado do time (ataque/defesa) + papel de cada jogador
 * (portador, apoio, pressão, cobertura, posição). Emite os mesmos Commands de um controle humano.
 */

const TACTIC_SHIFT: Record<
    Tactic,
    { attack: number; defend: number; pivotHold: number; shootBias: number; pressBias: number }
> = {
    balanced: { attack: 0, defend: 0, pivotHold: 0, shootBias: 0, pressBias: 0 },
    offensive: { attack: 2, defend: 1.5, pivotHold: 1, shootBias: 0, pressBias: 0.03 },
    defensive: { attack: -1, defend: -2.5, pivotHold: -1, shootBias: -0.005, pressBias: 0 },
    counter: { attack: 1, defend: -2, pivotHold: 3.5, shootBias: -0.01, pressBias: 0 },
};

interface TeamContext {
    tick: number;
    attacking: [boolean, boolean];
    chaser: [number | null, number | null];
    supporter: [number | null, number | null];
    supportSpot: [Vec2 | null, Vec2 | null];
    presser: [number | null, number | null];
    cover: [number | null, number | null];
}

export class AIController implements Controller {
    private ctx: TeamContext | null = null;

    constructor(private readonly s: MatchState) {}

    decide(idx: number): Command | Command[] {
        const s = this.s;
        if (s.phase !== 'play') return { type: 'idle' };
        const ctx = this.context();
        const p = s.players[idx];
        if (s.ball.owner === idx) return p.role === 'GK' ? this.goalkeeperWithBall(p) : this.carrier(p);
        if (p.role === 'GK') return this.goalkeeper(p, ctx);
        return this.offBall(p, ctx);
    }

    // ------------------------------------------------------------ contexto compartilhado por tick
    private context(): TeamContext {
        const s = this.s;
        if (this.ctx && this.ctx.tick === s.tick) return this.ctx;
        const ownerTeam = s.ball.owner !== null ? s.players[s.ball.owner].team : null;
        const attacking: [boolean, boolean] = [ownerTeam === 0, ownerTeam === 1];
        const ctx: TeamContext = {
            tick: s.tick,
            attacking,
            chaser: [null, null],
            supporter: [null, null],
            supportSpot: [null, null],
            presser: [null, null],
            cover: [null, null],
        };
        for (const team of [0, 1] as const) {
            const field = s.players.filter((p) => p.team === team && p.role !== 'GK');
            if (s.ball.owner === null) {
                ctx.chaser[team] = this.fastestToBall(field.concat(this.gkIfBallInArea(team)));
            } else if (attacking[team]) {
                const spot = this.bestSupportSpot(team);
                ctx.supportSpot[team] = spot;
                const candidates = field.filter((p) => p.idx !== s.ball.owner);
                ctx.supporter[team] = closestTo(candidates, spot)?.idx ?? null;
            } else {
                const carrier = s.players[s.ball.owner];
                const sorted = [...field].sort((a, b) => dist(a.pos, carrier.pos) - dist(b.pos, carrier.pos));
                // o Fixo é o xerife: rival chegando no nosso terço, ele sai para o combate (se estiver por perto)
                const fixo = sorted.find((p) => p.role === 'FIXO');
                const danger = toRel(s, team, carrier.pos).x < 20;
                if (fixo && danger && dist(fixo.pos, carrier.pos) < 8) {
                    ctx.presser[team] = fixo.idx;
                    // com mais de um fixo (Ferrolho, Quadrado), o segundo fixo é quem faz a cobertura
                    const fixo2 = sorted.find((p) => p.role === 'FIXO' && p.idx !== fixo.idx);
                    ctx.cover[team] = (fixo2 ?? sorted.find((p) => p.idx !== fixo.idx))?.idx ?? null;
                } else {
                    ctx.presser[team] = sorted[0]?.idx ?? null;
                    ctx.cover[team] = sorted[1]?.idx ?? null;
                }
            }
        }
        this.ctx = ctx;
        return ctx;
    }

    private gkIfBallInArea(team: 0 | 1): PlayerState[] {
        const gk = this.s.players.find((p) => p.team === team && p.role === 'GK');
        return gk && isInOwnArea(this.s, gk, this.s.ball.pos) ? [gk] : [];
    }

    /** Quem chega primeiro na bola, considerando a desaceleração dela. */
    private fastestToBall(candidates: PlayerState[]): number | null {
        let best: number | null = null;
        let bestT = Infinity;
        for (const p of candidates) {
            const t = this.timeToBall(p);
            if (t < bestT) {
                bestT = t;
                best = p.idx;
            }
        }
        return best;
    }

    private timeToBall(p: PlayerState): number {
        const target = this.ballInterceptPoint(p);
        return dist(p.pos, target) / maxSpeed(this.s, p);
    }

    private ballPositionAt(t: number): Vec2 {
        const { pos, vel } = this.s.ball;
        const speed = len(vel);
        if (speed < 0.01) return pos;
        const tStop = speed / FRICTION;
        const tt = Math.min(t, tStop);
        const travelled = speed * tt - 0.5 * FRICTION * tt * tt;
        return add(pos, scale(norm(vel), travelled));
    }

    private ballInterceptPoint(p: PlayerState): Vec2 {
        // itera: onde a bola estará quando eu chegar
        let target = this.s.ball.pos;
        const sp = maxSpeed(this.s, p);
        for (let i = 0; i < 4; i++) target = this.ballPositionAt(dist(p.pos, target) / sp);
        return this.clampToPitch(target);
    }

    private bestSupportSpot(team: 0 | 1): Vec2 {
        const s = this.s;
        const { width } = s.cfg.pitch;
        const ballRel = toRel(s, team, s.ball.pos);
        let best = toWorld(s, team, Math.min(34, ballRel.x + 8), width / 2);
        let bestScore = -Infinity;
        for (let xr = 16; xr <= 36; xr += 4) {
            for (let y = 3; y <= width - 3; y += 3.5) {
                const spot = toWorld(s, team, xr, y);
                const d = dist(spot, s.ball.pos);
                if (d < 4 || d > 16) continue;
                let score = expectedGoals(spot, goalXFor(s, team), width / 2, s.cfg.pitch.goalWidth) * 4;
                score += this.passIsSafe(team, s.ball.pos, spot) ? 1 : -1;
                score -= Math.abs(d - 9) * 0.04;
                if (score > bestScore) {
                    bestScore = score;
                    best = spot;
                }
            }
        }
        return best;
    }

    // ------------------------------------------------------------ portador da bola
    private carrier(p: PlayerState): Command | Command[] {
        const s = this.s;
        const tactic = TACTIC_SHIFT[s.teams[p.team].tactic];
        const gx = goalXFor(s, p.team);
        const gy = s.cfg.pitch.width / 2;
        const goal = v(gx, gy);
        const pressure = this.pressureOn(p);

        // segura a bola um instante depois de dominar (e na saída de bola)
        if (s.tick < p.ai.holdUntil) return this.dribbleCommand(p, goal, false);
        // decisões a cada ~0.3s, ou já se estiver sob pressão
        if (s.tick < p.ai.nextDecision && pressure < 0.6) return this.dribbleCommand(p, goal, pressure > 0.3);
        p.ai.nextDecision = s.tick + Math.round(s.rng.range(0.5, 1.0) * s.cfg.tickRate);

        const distGoal = dist(p.pos, goal);
        const xg = expectedGoals(p.pos, gx, gy, s.cfg.pitch.goalWidth);
        const shootingSkill = eff(s, p, 'shooting') / 99;

        // 1) chute
        const shootThreshold = (pressure > 0.5 ? 0.04 : 0.075) + tactic.shootBias - shootingSkill * 0.03;
        if (distGoal < 17 && xg > shootThreshold && s.rng.chance(0.9)) {
            const cmds: Command[] = [];
            // golpe no chute só em chance clara: é o grande momento do lance
            // golpe de carga (Solar Beam, Sky Attack) só com espaço: marcado, perderia o golpe
            const slot = this.pickMoveSlot(
                p,
                ['strike', 'blast'],
                xg > 0.22 ? 0.55 : xg > 0.14 ? 0.2 : 0,
                (m) => pressure < 0.35 || !hasTrait(m, 'charge'),
            );
            if (slot !== null) cmds.push({ type: 'useMove', slot });
            cmds.push({ type: 'shoot', target: this.shotTarget(p), power: 1 });
            return cmds;
        }

        // 1b) bomba de longe do Fixo: com espaço na intermediária, ele arrisca
        if (this.leadFixo(p) && distGoal >= 10 && distGoal < 22 && pressure < 0.45) {
            if (s.rng.chance(0.3 + shootingSkill * 0.25)) {
                const cmds: Command[] = [];
                const slot = this.pickMoveSlot(
                    p,
                    ['blast', 'strike'],
                    0.3,
                    (m) => pressure < 0.35 || !hasTrait(m, 'charge'),
                );
                if (slot !== null) cmds.push({ type: 'useMove', slot });
                cmds.push({ type: 'shoot', target: this.shotTarget(p), power: 1.1 });
                return cmds;
            }
        }

        // 1c) Teleport: cercado, some e aparece mais à frente
        if (pressure > 0.7) {
            const tp = this.pickSpecial(p, ['teleport'], 0.3);
            if (tp !== null) return { type: 'useMove', slot: tp };
        }

        // 1d) Fly/Dig: marcado perto do gol, passa por cima/por baixo da marcação e finaliza
        if (pressure > 0.45 && distGoal < 22) {
            const air = this.pickTraitSlot(p, ['fly', 'dig'], 0.3);
            if (air !== null) return { type: 'useMove', slot: air };
        }

        // 2) passe
        const pass = this.bestPass(p, pressure);
        const dribbleScore = this.dribbleScore(p, pressure);
        if (pass && pass.score > dribbleScore) {
            return { type: 'pass', target: pass.target, power: 1, receiverId: pass.receiver };
        }

        // 3) drible (com finta ou arrancada quando há marcador perto)
        const cmds: Command[] = [];
        if (pressure > 0.55) {
            const burst = this.pickMoveSlot(p, ['burst'], 0.2);
            // casco, clones, Minimize, Acid Armor, Defense Curl: protege a bola
            const guard =
                burst === null ? this.pickTraitSlot(p, ['shell', 'clones', 'minimize', 'melt', 'curl'], 0.15) : null;
            if (burst !== null) cmds.push({ type: 'useMove', slot: burst });
            else if (guard !== null) cmds.push({ type: 'useMove', slot: guard });
            else if (s.rng.chance(0.12 + (0.2 * eff(s, p, 'dribble')) / 99)) {
                cmds.push({ type: 'skill', dir: this.evadeDir(p, goal) });
                return cmds;
            }
        }
        const d = this.dribbleCommand(p, goal, true);
        return cmds.length ? [...cmds, d] : d;
    }

    private goalkeeperWithBall(p: PlayerState): Command | Command[] {
        const s = this.s;
        if (s.tick < p.ai.holdUntil) return { type: 'move', dir: v(0, 0), sprint: false };
        const pass = this.bestPass(p, 1, true);
        if (pass) return { type: 'pass', target: pass.target, power: 1, receiverId: pass.receiver };
        // chutão para frente
        const target = toWorld(s, p.team, 26, s.cfg.pitch.width / 2 + s.rng.range(-6, 6));
        return { type: 'pass', target, power: 1.2 };
    }

    /** 0 (livre) … 1 (marcador colado). */
    private pressureOn(p: PlayerState): number {
        let closest = Infinity;
        for (const o of this.s.players) if (o.team !== p.team) closest = Math.min(closest, dist(o.pos, p.pos));
        return clamp(1 - (closest - 0.8) / 3, 0, 1);
    }

    private shotTarget(p: PlayerState): Vec2 {
        const s = this.s;
        const gx = goalXFor(s, p.team);
        const gy = s.cfg.pitch.width / 2;
        const half = s.cfg.pitch.goalWidth / 2;
        const gk = s.players.find((o) => o.team !== p.team && o.role === 'GK');
        // mira o canto mais longe do goleiro, com um pouco de margem da trave
        const candidates = [-0.8, -0.45, 0, 0.45, 0.8].map((k) => v(gx, gy + k * half));
        let best = candidates[0];
        let bestScore = -Infinity;
        for (const c of candidates) {
            const gkDist = gk ? pointSegment(gk.pos, p.pos, c).d : 3;
            const score = gkDist + s.rng.range(0, 0.4) - Math.abs(c.y - gy) * 0.15;
            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }
        return best;
    }

    private bestPass(
        p: PlayerState,
        pressure: number,
        isKeeper = false,
    ): { target: Vec2; receiver: number; score: number } | null {
        const s = this.s;
        const tactic = TACTIC_SHIFT[s.teams[p.team].tactic];
        const gx = goalXFor(s, p.team);
        const gy = s.cfg.pitch.width / 2;
        const myRel = toRel(s, p.team, p.pos);
        let best: { target: Vec2; receiver: number; score: number } | null = null;
        for (const mate of s.players) {
            if (mate.team !== p.team || mate.idx === p.idx) continue;
            if (mate.role === 'GK' && pressure < 0.7) continue;
            const target = this.clampToPitch(add(mate.pos, scale(mate.vel, 0.45)));
            const d = dist(p.pos, target);
            if (d < 2.5 || d > 22) continue;
            const safe = this.passIsSafe(p.team, p.pos, target);
            const rel = toRel(s, p.team, target);
            let score = (rel.x - myRel.x) * 0.045;
            score += expectedGoals(target, gx, gy, s.cfg.pitch.goalWidth) * 2.2;
            score += Math.min(4, this.openness(mate)) * 0.07;
            score -= d * 0.012;
            if (!safe) score -= 1.2;
            if (mate.role === 'GK') score -= 0.4;
            if (tactic.pivotHold > 2 && mate.role === 'PIVO') score += 0.1; // contra-ataque: busca o pivô
            score += s.rng.range(-0.08, 0.08);
            if (isKeeper && !safe) continue;
            if (!best || score > best.score) best = { target, receiver: mate.idx, score };
        }
        return best;
    }

    private dribbleScore(p: PlayerState, pressure: number): number {
        const s = this.s;
        const dribble = eff(s, p, 'dribble') / 99;
        const rel = toRel(s, p.team, p.pos);
        const nearGoal = rel.x > 26 ? 0.1 : 0;
        return 0.26 + dribble * 0.25 - pressure * 0.45 + nearGoal;
    }

    private passIsSafe(team: 0 | 1, from: Vec2, to: Vec2): boolean {
        const s = this.s;
        const d = dist(from, to);
        const speed = clamp(Math.sqrt(2 * FRICTION * d) * 1.05 + 2.2, 5, 17);
        for (const o of s.players) {
            if (o.team === team) continue;
            const { d: perp, t } = pointSegment(o.pos, from, to);
            if (perp > 3.5) continue;
            const ballTime = (t * d) / speed;
            const oppTime = Math.max(0, perp - 0.6) / maxSpeed(s, o) + 0.15;
            if (oppTime < ballTime) return false;
        }
        return true;
    }

    private openness(p: PlayerState): number {
        let closest = Infinity;
        for (const o of this.s.players) if (o.team !== p.team) closest = Math.min(closest, dist(o.pos, p.pos));
        return closest;
    }

    private evadeDir(p: PlayerState, goal: Vec2): Vec2 {
        const toGoal = norm(sub(goal, p.pos));
        let away = v(0, 0);
        for (const o of this.s.players) {
            if (o.team === p.team) continue;
            const d = dist(o.pos, p.pos);
            if (d < 3) away = add(away, scale(norm(sub(p.pos, o.pos)), (3 - d) / 3));
        }
        return norm(add(toGoal, scale(away, 1.4)));
    }

    private dribbleCommand(p: PlayerState, goal: Vec2, sprint: boolean): Command {
        const dir = this.evadeDir(p, goal);
        return { type: 'move', dir: this.avoidWalls(p.pos, dir), sprint };
    }

    // ------------------------------------------------------------ sem bola
    private offBall(p: PlayerState, ctx: TeamContext): Command | Command[] {
        const utility = this.utilityMove(p);
        const cmd = this.offBallMovement(p, ctx);
        if (utility === null) return cmd;
        return [{ type: 'useMove', slot: utility }, ...(Array.isArray(cmd) ? cmd : [cmd])];
    }

    /** Golpes de suporte fora do lance: status/debuff no rival perto, buff, cura quando cansado. */
    private utilityMove(p: PlayerState): number | null {
        const s = this.s;
        // avaliado a cada 5 ticks por jogador (economia de CPU); chances já compensadas
        // nada de golpes na confusão da saída de bola (primeiros segundos do tempo)
        if (p.moveCooldown > 0 || (s.tick + p.idx) % 5 !== 0 || s.time < 6) return null;
        let near = Infinity;
        for (const o of s.players) if (o.team !== p.team) near = Math.min(near, dist(o.pos, p.pos));
        if (p.energy < 0.4) {
            // Rest dorme: nunca no goleiro com a bola perto
            const restOk = p.role !== 'GK' || dist(s.ball.pos, p.pos) > 14;
            const heal = this.pickMoveSlot(p, ['heal'], 0.04, (m) => restOk || m !== 'rest');
            if (heal !== null) return heal;
        }
        // golpes de área (Growl, Leer, Poison Gas...) quando tem 2+ rivais em volta
        let crowd = 0;
        for (const o of s.players) if (o.team !== p.team && dist(o.pos, p.pos) < MOVE_TUNING.areaRadius) crowd++;
        if (crowd >= 2) {
            const area = this.pickMoveSlot(p, ['debuff', 'status'], 0.05, (m) => hasTrait(m, 'area'));
            if (area !== null) return area;
        }
        // rival com a bola chegando no nosso gol: areia no olho, fumaça, muro, rugido
        const carrier = s.ball.owner !== null ? s.players[s.ball.owner] : null;
        if (carrier && carrier.team !== p.team && toRel(s, p.team, carrier.pos).x < 16) {
            const d = dist(carrier.pos, p.pos);
            if (d < 7) {
                const hex = this.pickTraitSlot(p, ['blind', 'smoke', 'wall'], 0.05);
                if (hex !== null) return hex;
            }
            if (d < MOVE_TUNING.fleeRange) {
                const roar = this.pickSpecial(p, ['roar'], 0.04);
                if (roar !== null) return roar;
            }
        }
        if (near < 6) {
            const hex = this.pickMoveSlot(p, ['status', 'debuff'], 0.006);
            if (hex !== null) return hex;
            const seed = this.pickSpecial(p, ['leechseed', 'substitute'], 0.005);
            if (seed !== null) return seed;
        }
        // Haze quando tem gente em volta com status ou reforço
        const messy = s.players.some((o) => dist(o.pos, p.pos) < 6 && (o.status || o.buffs.length > 0));
        if (messy) {
            const haze = this.pickSpecial(p, ['haze'], 0.03);
            if (haze !== null) return haze;
        }
        if (s.lastMove[p.team === 0 ? 1 : 0]) {
            const copy = this.pickSpecial(p, ['mirrormove', 'mimic'], 0.005);
            if (copy !== null) return copy;
        }
        if (near < 4) {
            const push = this.pickSpecial(p, ['roar', 'whirlwind', 'disable'], 0.008);
            if (push !== null) return push;
        }
        const wild = this.pickSpecial(
            p,
            ['metronome', 'mist', 'bide', 'rage', 'conversion', 'transform', 'splash'],
            0.004,
        );
        if (wild !== null) return wild;
        return this.pickMoveSlot(p, ['buff', 'flavor'], 0.003);
    }

    private offBallMovement(p: PlayerState, ctx: TeamContext): Command | Command[] {
        const s = this.s;
        const team = p.team;
        const tactic = TACTIC_SHIFT[s.teams[team].tactic];

        if (s.ball.owner === null) {
            const kick = s.ball.lastKick;
            if (kick?.kind === 'pass' && kick.receiverId === p.idx && s.players[kick.by].team === team) {
                return this.moveTo(p, this.ballInterceptPoint(p), true);
            }
            if (ctx.chaser[team] === p.idx) return this.moveTo(p, this.ballInterceptPoint(p), true);
            return this.moveTo(p, this.homePosition(p, ctx), false);
        }

        if (ctx.attacking[team]) {
            if (ctx.supporter[team] === p.idx && ctx.supportSpot[team])
                return this.moveTo(p, ctx.supportSpot[team], true);
            return this.moveTo(p, this.homePosition(p, ctx), false);
        }

        // defendendo
        const carrier = s.players[s.ball.owner];
        if (ctx.presser[team] === p.idx) {
            const d = dist(p.pos, carrier.pos);
            const cmds: Command[] = [];
            if (d < TACKLE_RANGE && p.tackleCooldown <= 0) {
                const danger = toRel(s, team, carrier.pos).x < 14 ? 0.12 : 0;
                if (s.rng.chance(0.14 + danger + tactic.pressBias)) {
                    const strike = this.pickMoveSlot(p, ['strike'], 0.3);
                    if (strike !== null) cmds.push({ type: 'useMove', slot: strike });
                    cmds.push({ type: 'tackle', targetId: carrier.idx });
                }
            } else if (d < MOVE_TUNING.quickRange && p.tackleCooldown <= 0 && this.hasTraitMove(p, 'priority')) {
                // Quick Attack: bote de longe, sem esperar
                const quick = this.pickTraitSlot(p, ['priority'], 0.08);
                if (quick !== null) cmds.push({ type: 'useMove', slot: quick });
            } else if (d < MOVE_TUNING.reachRange && p.tackleCooldown <= 0 && this.hasTraitMove(p, 'reach')) {
                // chicote, pedra, osso, Wrap: desarme de longe
                const reach = this.pickTraitSlot(p, ['reach'], 0.08);
                if (reach !== null)
                    cmds.push({ type: 'useMove', slot: reach }, { type: 'tackle', targetId: carrier.idx });
            } else if (d < 6.5) {
                const slot = this.pickMoveSlot(p, ['blast', 'status', 'debuff'], 0.005);
                if (slot !== null) cmds.push({ type: 'useMove', slot });
            }
            // chega rápido e, perto, freia e acompanha de lado (jockey) a ~1,5 m pelo lado do gol, esperando a hora
            // do bote (antes colava a 0,5 m em velocidade máxima e os dois andavam grudados)
            const ownGoal = v(ownGoalX(s, team), s.cfg.pitch.width / 2);
            const gap = d > 3 ? 0.5 : 1.5;
            const target = add(add(carrier.pos, scale(carrier.vel, 0.3)), scale(norm(sub(ownGoal, carrier.pos)), gap));
            cmds.push(this.moveTo(p, target, d > 2.5));
            return cmds;
        }
        if (ctx.cover[team] === p.idx) {
            // fica entre o portador e o gol, a ~4 m
            const ownGoal = v(ownGoalX(s, team), s.cfg.pitch.width / 2);
            const target = add(carrier.pos, scale(norm(sub(ownGoal, carrier.pos)), 4));
            return this.moveTo(p, target, true);
        }
        // marca o adversário mais perto da posição-base, pelo lado do gol
        const home = this.homePosition(p, ctx);
        const mark = closestTo(
            s.players.filter((o) => o.team !== team && o.role !== 'GK' && o.idx !== carrier.idx),
            home,
        );
        if (mark && dist(mark.pos, home) < 7) {
            const ownGoal = v(ownGoalX(s, team), s.cfg.pitch.width / 2);
            const goalSide = add(mark.pos, scale(norm(sub(ownGoal, mark.pos)), 1.5));
            const target = v((goalSide.x + home.x) / 2, (goalSide.y + home.y) / 2);
            return this.moveTo(p, target, false);
        }
        return this.moveTo(p, home, false);
    }

    private goalkeeper(p: PlayerState, ctx: TeamContext): Command {
        const s = this.s;
        const team = p.team;
        const { width, goalWidth } = s.cfg.pitch;
        const gx = ownGoalX(s, team);
        const gy = width / 2;
        const ball = s.ball;

        // chute vindo: corre para o ponto onde a bola cruza a linha
        if (ball.shot && s.players[ball.shot.by].team !== team && Math.abs(ball.vel.x) > 0.5) {
            const t = (gx - ball.pos.x) / ball.vel.x;
            if (t > 0) {
                const yCross = clamp(ball.pos.y + ball.vel.y * t, gy - goalWidth / 2 - 0.3, gy + goalWidth / 2 + 0.3);
                const lineDepth = toWorld(s, team, 0.5, yCross);
                return this.moveTo(p, lineDepth, true);
            }
        }
        if (ball.owner === null && ctx.chaser[team] === p.idx) return this.moveTo(p, this.ballInterceptPoint(p), true);

        // posição: na linha entre a bola e o centro do gol, ~1.2 m à frente
        const goal = v(gx, gy);
        const toBall = norm(sub(ball.pos, goal));
        const depth = 0.9 + Math.min(1.2, dist(ball.pos, goal) / 15);
        let target = add(goal, scale(toBall, depth));
        target = v(target.x, clamp(target.y, gy - goalWidth / 2 - 0.4, gy + goalWidth / 2 + 0.4));
        const rel = toRel(s, team, target);
        if (rel.x < 0.4) target = toWorld(s, team, 0.4, target.y);
        return this.moveTo(p, target, dist(p.pos, target) > 1.5);
    }

    private homePosition(p: PlayerState, ctx: TeamContext): Vec2 {
        const s = this.s;
        const team = p.team;
        const tactic = TACTIC_SHIFT[s.teams[team].tactic];
        const attacking = ctx.attacking[team];
        // posições-base vêm da formação do time (losango, quadrado, linha de 3)
        const formation = s.teams[team].formation;
        const base = (attacking ? formation.attack : formation.defend)[p.slot] ?? [20, 10];
        const ballRel = toRel(s, team, s.ball.pos);
        const { length, width } = s.cfg.pitch;
        let xr = base[0] * (length / 40) + (attacking ? tactic.attack : tactic.defend);
        // com dois pivôs, só o da vaga 4 fica plantado lá na frente
        if (p.role === 'PIVO' && p.slot === 4) xr += tactic.pivotHold;
        // Fixo sobe até a intermediária quando o time ataca no campo rival (opção de passe e de chute de longe)
        if (this.leadFixo(p) && attacking && ballRel.x > length / 2) xr += 6;
        xr += (ballRel.x - length / 2) * 0.35;
        const y = (base[1] / 20) * width + (s.ball.pos.y - width / 2) * 0.25;
        return toWorld(s, team, clamp(xr, 2, length - 2), clamp(y, 1, width - 1));
    }

    // ------------------------------------------------------------ utilitários
    /** O fixo que sobe (com mais de um fixo, como no Ferrolho, só o primeiro da formação; os outros guardam). */
    private leadFixo(p: PlayerState) {
        return p.role === 'FIXO' && this.s.teams[p.team].formation.slots.indexOf('FIXO') === p.slot;
    }

    private moveTo(p: PlayerState, target: Vec2, urgent: boolean): Command {
        const delta = sub(target, p.pos);
        const d = len(delta);
        if (d < 0.25) return { type: 'move', dir: v(0, 0), sprint: false };
        // "arrive": desacelera perto do alvo
        const mag = clamp(d / 2.5, 0.15, 1);
        return { type: 'move', dir: scale(norm(delta), mag), sprint: urgent || d > 5 };
    }

    private avoidWalls(pos: Vec2, dir: Vec2): Vec2 {
        const { width } = this.s.cfg.pitch;
        let y = dir.y;
        if (pos.y < 1.2 && y < 0) y *= 0.2;
        if (pos.y > width - 1.2 && y > 0) y *= 0.2;
        return norm(v(dir.x, y));
    }

    private clampToPitch(p: Vec2): Vec2 {
        const { length, width } = this.s.cfg.pitch;
        return v(clamp(p.x, 0.3, length - 0.3), clamp(p.y, 0.3, width - 0.3));
    }

    /** Golpe especial específico (Teleport, Haze…), se o jogador tiver e puder usar agora. */
    private pickSpecial(p: PlayerState, ids: string[], chance: number): number | null {
        if (p.moveCooldown > 0 || this.s.tick < this.s.nextMoveTick || !this.s.rng.chance(chance)) return null;
        const slot = p.inst.moves.findIndex((m, i) => ids.includes(m) && p.moveUses[i] > 0);
        return slot >= 0 ? slot : null;
    }

    /** Tem um golpe com o traço e ainda pode usar (sem gastar sorteio). */
    private hasTraitMove(p: PlayerState, trait: Trait): boolean {
        if (p.moveCooldown > 0 || this.s.tick < this.s.nextMoveTick) return false;
        return p.inst.moves.some((m, i) => p.moveUses[i] > 0 && hasTrait(m, trait));
    }

    /** Golpe com algum dos traços (Fly, Quick Attack, Withdraw...), se tiver e puder usar agora. */
    private pickTraitSlot(p: PlayerState, traits: Trait[], chance: number): number | null {
        if (p.moveCooldown > 0 || this.s.tick < this.s.nextMoveTick) return null;
        const slot = p.inst.moves.findIndex((m, i) => p.moveUses[i] > 0 && traits.some((t) => hasTrait(m, t)));
        if (slot < 0 || !this.s.rng.chance(chance)) return null;
        return slot;
    }

    /** Escolhe um golpe disponível dos tipos pedidos, com probabilidade `chance`. */
    private pickMoveSlot(
        p: PlayerState,
        kinds: string[],
        chance: number,
        ok: (moveId: string) => boolean = () => true,
    ): number | null {
        if (chance <= 0 || p.moveCooldown > 0 || this.s.tick < this.s.nextMoveTick || !this.s.rng.chance(chance)) {
            return null;
        }
        // Dream Eater só vale com um rival dormindo por perto
        const sleeper = this.s.players.some(
            (o) => o.team !== p.team && o.status?.kind === 'slp' && dist(o.pos, p.pos) < 7,
        );
        const slots = p.inst.moves
            .map((m, i) => ({ i, m, prof: moveProfile(m) }))
            .filter(
                ({ i, m, prof }) =>
                    p.moveUses[i] > 0 && kinds.includes(prof.kind) && (m !== 'dreameater' || sleeper) && ok(m),
            );
        if (!slots.length) return null;
        return this.s.rng.pick(slots).i;
    }
}

function closestTo(players: PlayerState[], target: Vec2): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = Infinity;
    for (const p of players) {
        const d = dist(p.pos, target);
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    return best;
}
