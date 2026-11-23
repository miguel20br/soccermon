import type { Command } from '../commands';
import { goalXFor, TACKLE_RANGE } from '../match';
import type { LiveRunner } from '../runners/live-runner';
import type { MatchState, PlayerState } from '../state';
import { add, dist, dot, len, norm, scale, type Vec2, v } from '../vec';
import { HumanController } from './human-controller';

/**
 * Modo jogável (prévia, `?lab=jogavel`): o que o controle (teclado ou toque) pede num tick vira os mesmos Commands da IA.
 * `dir` é o analógico (|dir| ≤ 1); os botões apertados valem uma vez, no tick seguinte.
 */
export type PlayButton = 'pass' | 'shoot' | 'action' | 'move' | 'switch';
export interface PlayInput {
    dir: Vec2;
    /** Andar em vez de correr (Shift no teclado; analógico pouco empurrado no toque). */
    walk: boolean;
    pressed: PlayButton[];
}

export const emptyInput = (): PlayInput => ({ dir: v(0, 0), walk: false, pressed: [] });

/** Pra onde o controlado "olha": o analógico, ou o rumo em que corre. */
const aimOf = (p: PlayerState, dir: Vec2) => (len(dir) > 0.2 ? norm(dir) : p.heading);

/** Companheiro de linha (sem o goleiro) mais perto da bola, fora `except`: a troca do controlado. */
export function nearestMate(s: MatchState, team: 0 | 1, except: number): number | null {
    let best: PlayerState | null = null;
    for (const p of s.players)
        if (p.team === team && p.role !== 'GK' && p.idx !== except)
            if (!best || dist(p.pos, s.ball.pos) < dist(best.pos, s.ball.pos)) best = p;
    return best?.idx ?? null;
}

/** Passe: o companheiro mais na direção do analógico (perto conta um pouco), um tico à frente de onde ele corre. */
function passCommand(s: MatchState, p: PlayerState, aim: Vec2): Command {
    let best: PlayerState | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const m of s.players) {
        if (m.team !== p.team || m.idx === p.idx) continue;
        const to = { x: m.pos.x - p.pos.x, y: m.pos.y - p.pos.y };
        const d = len(to);
        const score = dot(norm(to), aim) * 2 - d / 15 - (m.role === 'GK' ? 1 : 0);
        if (score > bestScore) {
            bestScore = score;
            best = m;
        }
    }
    if (!best) return { type: 'pass', target: add(p.pos, scale(aim, 8)), power: 1 };
    return { type: 'pass', target: add(best.pos, scale(best.vel, 0.3)), power: 1, receiverId: best.idx };
}

/** Golpe: o primeiro dos 4 que ainda tem uso (o motor confere a recarga). */
function moveSlot(p: PlayerState): number {
    return p.inst.moves.findIndex((m, i) => m && m !== 'counter' && (p.moveUses[i] ?? 0) > 0);
}

/**
 * Comandos do controlado `idx` neste tick. Com a bola: passe, chute (o analógico pra cima ou pra baixo mira o canto) e
 * drible. Sem a bola, o botão de ação desarma quem conduz se der, senão usa um golpe.
 */
export function inputCommands(s: MatchState, idx: number, input: PlayInput): Command[] {
    const p = s.players[idx];
    const out: Command[] = [{ type: 'move', dir: input.dir, sprint: !input.walk }];
    const aim = aimOf(p, input.dir);
    const hasBall = s.ball.owner === idx;
    for (const b of input.pressed) {
        if (b === 'pass' && hasBall) out.push(passCommand(s, p, aim));
        else if (b === 'shoot' && hasBall) {
            const { width, goalWidth } = s.cfg.pitch;
            out.push({
                type: 'shoot',
                target: v(goalXFor(s, p.team), width / 2 + input.dir.y * goalWidth * 0.4),
                power: 1,
            });
        } else if (b === 'move') {
            const slot = moveSlot(p);
            if (slot >= 0) out.push({ type: 'useMove', slot, dir: aim });
        } else if (b === 'action') {
            const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
            if (hasBall) out.push({ type: 'skill', dir: aim });
            else if (owner && owner.team !== p.team && dist(owner.pos, p.pos) <= TACKLE_RANGE + 0.5)
                out.push({ type: 'tackle', targetId: owner.idx });
            else {
                const slot = moveSlot(p);
                if (slot >= 0) out.push({ type: 'useMove', slot, dir: aim });
            }
        }
    }
    return out;
}

/**
 * Liga o controle a um jogador do time `team` na partida: troca de controlado no botão e, quando um companheiro de
 * linha recebe a bola, o controle vai com ela (estilo FC). O resto do time segue na IA.
 */
export class HumanDriver {
    readonly human = new HumanController();
    controlled: number;

    constructor(
        private readonly runner: LiveRunner,
        readonly team: 0 | 1 = 0,
    ) {
        const s = runner.state;
        const mine = s.players.filter((p) => p.team === team && p.role !== 'GK');
        this.controlled = (mine.find((p) => p.captain) ?? mine[0]).idx;
        runner.setController(this.controlled, this.human);
    }

    private control(idx: number | null) {
        if (idx === null || idx === this.controlled) return;
        this.runner.setController(this.controlled, null);
        this.controlled = idx;
        this.runner.setController(idx, this.human);
    }

    /** Um tick: os botões apertados valem agora e saem da fila. */
    step(input: PlayInput) {
        const s = this.runner.state;
        if (input.pressed.includes('switch')) this.control(nearestMate(s, this.team, this.controlled));
        const [held, ...once] = inputCommands(s, this.controlled, input);
        this.human.hold(held);
        for (const c of once) this.human.press(c);
        input.pressed = [];
        this.runner.step();
        const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
        if (owner && owner.team === this.team && owner.role !== 'GK') this.control(owner.idx);
    }
}
