/**
 * Agência do técnico na partida (EXPERIMENTO, docs/planos/pesquisas/agencia.md): gritos, pedido de tempo,
 * goleiro-linha, golpe máximo do capitão e ordem dos pênaltis. Tudo entra só por ordem do técnico (`MatchOrder`):
 * sem ordem nova, a partida é bit a bit a de antes (o interruptor fica na tela, não no motor).
 *
 * Números daqui são a 1ª proposta pro Miguel testar (nada aprovado): mexer só com o antes/depois do técnico robô
 * (`scripts/balance/coach.ts`).
 */
import type { AttrKey } from './attributes';
import type { MatchEvent } from './state';

export type Shout = 'attack' | 'lock' | 'calm' | 'press';
export const SHOUT_KINDS: readonly Shout[] = ['attack', 'lock', 'calm', 'press'];

/** Efeito de cada grito: atributos do time, fôlego (gasto × e recuperação por segundo) e viés da IA. */
export interface ShoutFx {
    attrs: Partial<Record<AttrKey, number>>;
    drain: number;
    regen: number;
    /** Somados ao TACTIC_SHIFT da tática atual (ai-controller.ts). */
    attack: number;
    defend: number;
    shootBias: number;
    pressBias: number;
}

export const SHOUTS: Record<Shout, ShoutFx> = {
    // Pra cima!: chuta mais e pressiona, gasta fôlego 1,5x
    attack: {
        attrs: { shooting: 1.06 },
        drain: 1.5,
        regen: 0,
        attack: 1,
        defend: 1,
        shootBias: -0.01,
        pressBias: 0.03,
    },
    // Fecha a casinha!: +desarme e +posicionamento, recua; chute pior
    lock: {
        attrs: { tackling: 1.06, positioning: 1.06, shooting: 0.95 },
        drain: 1,
        regen: 0,
        attack: -1,
        defend: -1.5,
        shootBias: 0.005,
        pressBias: 0,
    },
    // Calma!: +passe, gasta menos e recupera um pouco o fôlego; chuta menos
    calm: {
        attrs: { passing: 1.06 },
        drain: 0.7,
        regen: 0.003,
        attack: 0,
        defend: 0,
        shootBias: 0.005,
        pressBias: 0,
    },
    // Abafa!: marcação lá em cima, o marcador dá bote mais vezes; fôlego 2x
    press: {
        attrs: { tackling: 1.03 },
        drain: 2,
        regen: 0,
        attack: 0.5,
        defend: 2.5,
        shootBias: 0,
        pressBias: 0.08,
    },
};

export const AGENCY = {
    /** Gritos por partida, duração e recarga (ticks a 20 Hz: 2,5 e 3 minutos do relógio no futsal 5). */
    shoutLimit: 3,
    shoutTicks: 450,
    shoutCooldownTicks: 540,
    /** Pedido de tempo: 1 por tempo, fôlego +5% pra quem pediu e +3% pro rival (Miguel, 18/10/2026), parada de 3 s. */
    timeoutEnergy: 0.05,
    timeoutRivalEnergy: 0.03,
    timeoutTicks: 60,
    /** Golpe máximo: janela de 10 s pra sair; se passar, a barra volta pela metade. */
    maxTicks: 200,
    maxRefund: 0.5,
    /** Pontos pra encher a barra (lances do time; ver `MAX_POINTS`). */
    maxFull: 22,
    /** Perdendo por 1 enche 1,5x; por 2 ou mais, 2x. */
    maxBehind: [1, 1.5, 2],
    /** Reforço do capitão durante a janela (a aura) e o chute máximo. */
    maxBuff: { shooting: 1.15, pace: 1.08, dribble: 1.1 } as Partial<Record<AttrKey, number>>,
    maxGkBuff: 1.3,
    maxShot: { power: 1.55, accuracy: 1.6 },
    /** Distância do gol em que o capitão solta o golpe máximo. */
    maxRange: 20,
    /** Goleiro-linha: o rival chuta no gol vazio de até aqui, se o goleiro estiver longe do gol. */
    emptyNetRange: 26,
    emptyNetGkAway: 7,
} as const;

/** Lances que enchem a barra do golpe máximo (pontos por lance do time). */
const MAX_POINTS = { tackle: 1, interception: 0.5, save: 1, shot: 0.5, move: 0.5, goal: 1 } as const;

export interface MaxCharge {
    /** 0..1 */
    charge: number;
    /** Janela aberta (soltou e o golpe ainda não saiu). */
    active: boolean;
    /** Já saiu (1 por partida). */
    used: boolean;
}

/**
 * Barra do golpe máximo do time até o tick `upTo` (inclusive), só a partir dos eventos: o motor (pra aceitar a
 * ordem) e a tela (pra desenhar a barra) usam a mesma conta.
 */
export function maxCharge(
    events: readonly MatchEvent[],
    team: 0 | 1,
    upTo = Number.POSITIVE_INFINITY,
    teamSize = 5,
): MaxCharge {
    let pts = 0;
    let active = false;
    let used = false;
    let behind = 0;
    const full = AGENCY.maxFull;
    // o time 0 tem os índices 0..teamSize-1 (createMatch)
    const teamOf = (idx: number) => (idx < teamSize ? 0 : 1);
    for (const e of events) {
        if (e.tick > upTo) break;
        if (e.type === 'max') {
            if (e.team !== team) continue;
            if (e.phase === 'start') {
                active = true;
                pts = 0;
            } else if (e.phase === 'hit') {
                active = false;
                used = true;
            } else {
                active = false;
                pts = full * AGENCY.maxRefund;
            }
            continue;
        }
        if (e.type === 'goal') behind = e.team === team ? behind - 1 : behind + 1;
        if (active || used) continue;
        let p = 0;
        if (e.type === 'tackle' && e.success && teamOf(e.by) === team) p = MAX_POINTS.tackle;
        else if (e.type === 'interception' && teamOf(e.by) === team) p = MAX_POINTS.interception;
        else if (e.type === 'save' && teamOf(e.by) === team) p = MAX_POINTS.save;
        else if (e.type === 'shot' && teamOf(e.by) === team) p = MAX_POINTS.shot;
        else if (e.type === 'move' && e.hit && teamOf(e.by) === team) p = MAX_POINTS.move;
        else if (e.type === 'goal' && e.team === team && !e.ownGoal) p = MAX_POINTS.goal;
        if (!p) continue;
        const k = AGENCY.maxBehind[Math.min(2, Math.max(0, behind))];
        pts = Math.min(full, pts + p * k);
    }
    return { charge: used ? 0 : pts / full, active, used };
}

/** Grito ativo de um time no tick (pelos eventos; a tela usa pra mostrar o balão). */
export function shoutAt(events: readonly MatchEvent[], team: 0 | 1, tick: number): Shout | null {
    for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        if (e.tick > tick || e.type !== 'shout' || e.team !== team) continue;
        return tick < e.tick + AGENCY.shoutTicks ? e.shout : null;
    }
    return null;
}

/** Quantos gritos o time já deu até o tick. */
export const shoutsUsed = (events: readonly MatchEvent[], team: 0 | 1, tick = Number.POSITIVE_INFINITY) =>
    events.filter((e) => e.type === 'shout' && e.team === team && e.tick <= tick).length;
