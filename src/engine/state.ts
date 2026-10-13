import type { AbilityEffect } from './abilities';
import type { Attributes, AttrKey, Position } from './attributes';
import type { MatchConfig } from './config';
import type { Species } from './data';
import type { PokemonInstance } from './instance';
import type { MoveKind, StatusKind } from './moves';
import type { Rng } from './rng';
import type { Vec2 } from './vec';

export type Tactic = 'balanced' | 'offensive' | 'defensive' | 'counter';
export const TACTIC_LABEL: Record<Tactic, string> = {
    balanced: 'Equilibrado',
    offensive: 'Ofensivo',
    defensive: 'Retranca',
    counter: 'Contra-ataque',
};

/** Papéis do losango 1-2-1 do futsal, na ordem dos slots da escalação. */
export const FUTSAL_SLOTS: Position[] = ['GK', 'FIXO', 'ALA', 'ALA', 'PIVO'];

export interface TeamSetup {
    name: string;
    /** Exatamente `teamSize` jogadores, na ordem de FUTSAL_SLOTS. */
    lineup: PokemonInstance[];
    bench: PokemonInstance[];
    tactic: Tactic;
    color: number;
}

/** Códigos de ação para o render escolher a animação. */
export const Action = {
    Idle: 0,
    Run: 1,
    Kick: 2,
    Shoot: 3,
    Tackle: 4,
    Hurt: 5,
    Celebrate: 6,
    Charge: 7,
    Dive: 8,
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export interface Buff {
    attr: AttrKey;
    factor: number;
    timer: number;
}

export interface PendingBonus {
    power: number;
    accuracy: number;
    moveType: string;
    moveId: string;
    timer: number;
}

export interface PlayerStats {
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passesCompleted: number;
    tackles: number;
    tacklesWon: number;
    interceptions: number;
    saves: number;
    movesUsed: number;
}

export interface PlayerState {
    idx: number;
    team: 0 | 1;
    slot: number;
    role: Position;
    inst: PokemonInstance;
    sp: Species;
    name: string;
    /** Atributos já com nível, posição e habilidade (sem fadiga/buffs). */
    attr: Attributes;
    ability: AbilityEffect;
    pos: Vec2;
    vel: Vec2;
    heading: Vec2;
    facing: number;
    energy: number;
    action: Action;
    actionTimer: number;
    kickCooldown: number;
    tackleCooldown: number;
    moveCooldown: number;
    stun: number;
    evade: number;
    status: { kind: StatusKind | 'infatuation'; timer: number } | null;
    buffs: Buff[];
    moveUses: number[];
    shotBonus: PendingBonus | null;
    tackleBonus: PendingBonus | null;
    clutchAnnounced: boolean;
    /** Memória da IA. */
    ai: { nextDecision: number; holdUntil: number };
    stats: PlayerStats;
}

export interface ShotInfo {
    by: number;
    xg: number;
    moveId: string | null;
    moveType: string;
    gkChecked: boolean;
    blockedBy: number[];
    onTarget: boolean;
}

export interface BallState {
    pos: Vec2;
    vel: Vec2;
    owner: number | null;
    lastTouch: number | null;
    lastKick: { by: number; kind: 'pass' | 'shot' | 'clear'; tick: number; receiverId?: number } | null;
    shot: ShotInfo | null;
    /** Último passador do time que tem a bola (para assistências). */
    assistCandidate: number | null;
}

export type Phase = 'kickoff' | 'play' | 'goal' | 'restart' | 'halftime' | 'fulltime';

export interface TeamRuntime {
    setup: TeamSetup;
    tactic: Tactic;
    bench: PokemonInstance[];
    possessionTicks: number;
}

export interface MatchEventBase {
    tick: number;
    half: 1 | 2;
    /** Minuto exibido no relógio (0..40). */
    minute: number;
}

export type MatchEvent = MatchEventBase &
    (
        | { type: 'kickoff'; team: 0 | 1 }
        | { type: 'pass'; by: number; to: number | null }
        | { type: 'interception'; by: number; from: number }
        | { type: 'tackle'; by: number; victim: number; success: boolean }
        | { type: 'skill'; by: number }
        | { type: 'shot'; by: number; xg: number; moveId: string | null }
        | { type: 'save'; by: number; shooter: number; caught: boolean }
        | { type: 'block'; by: number; shooter: number }
        | { type: 'post'; shooter: number }
        | { type: 'wide'; shooter: number }
        | { type: 'goal'; by: number; assist: number | null; team: 0 | 1; score: [number, number]; ownGoal: boolean }
        | {
              type: 'move';
              by: number;
              moveId: string;
              kind: MoveKind;
              target: number | null;
              effectiveness: number | null;
              hit: boolean;
          }
        | {
              type: 'status';
              target: number;
              status: StatusKind | 'infatuation' | 'flinch';
              by: number | null;
              source: string;
          }
        | { type: 'knockback'; target: number; by: number; moveId: string }
        | { type: 'ability'; by: number; ability: string; target: number | null }
        | { type: 'halftime'; score: [number, number] }
        | { type: 'sub'; team: 0 | 1; out: string; in: string; outIdx: number }
        | { type: 'fulltime'; score: [number, number] }
        | { type: 'penalty'; by: number; gk: number; scored: boolean; round: number; shootout: [number, number] }
        | { type: 'end'; winner: 0 | 1 | null; score: [number, number]; shootout: [number, number] | null }
    );

export type MatchEventType = MatchEvent['type'];

/** Valores por jogador em `MatchSnapshot.p`: x, y, facing, action, status, flags. */
export const SNAP_STRIDE = 6;
export const STATUS_CODE: Record<string, number> = {
    par: 1,
    slp: 2,
    psn: 3,
    brn: 4,
    frz: 5,
    confusion: 6,
    infatuation: 7,
};
/** Bits de `flags`: buff ativo, debuff ativo, golpe carregado para o próximo chute/desarme. */
export const FLAG_BUFF = 1;
export const FLAG_DEBUFF = 2;
export const FLAG_CHARGED = 4;

/** Snapshot compacto para o render. `p` = SNAP_STRIDE valores por jogador. */
export interface MatchSnapshot {
    tick: number;
    half: 1 | 2;
    minute: number;
    phase: Phase;
    bx: number;
    by: number;
    owner: number;
    /** Tipo do golpe do chute em andamento (rastro colorido na bola), ou ''. */
    bfx: string;
    score: [number, number];
    p: number[];
}

export interface MatchState {
    cfg: MatchConfig;
    rng: Rng;
    tick: number;
    half: 1 | 2;
    /** Segundos de simulação dentro do tempo atual. */
    time: number;
    phase: Phase;
    phaseTimer: number;
    kickoffTeam: 0 | 1;
    teams: [TeamRuntime, TeamRuntime];
    players: PlayerState[];
    /** Índices dos jogadores com habilidade de aura (Intimidate…) — evita varrer todos a cada cálculo. */
    auraHolders: number[];
    ball: BallState;
    score: [number, number];
    shootout: [number, number] | null;
    events: MatchEvent[];
    finished: boolean;
    winner: 0 | 1 | null;
}
