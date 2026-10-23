/**
 * Agência do técnico na partida (beira da quadra, no ar desde a 0.9.6; docs/planos/beira-da-quadra-2.md): pedido de
 * tempo, goleiro-linha, golpe máximo do capitão e ordem dos pênaltis. Tudo entra só por ordem do técnico
 * (`MatchOrder`): sem ordem nova, a partida é bit a bit a de antes (o interruptor fica na tela, não no motor).
 * Os gritos saíram em 21/10/2026 (Miguel: confundiam mais que ajudavam; a tática já faz esse papel).
 *
 * Mexer nos números só com o antes/depois do técnico robô (`scripts/balance/coach.ts`) e do
 * `scripts/balance/goleiro-linha.ts`.
 */
import type { Position } from './attributes';
import { type MatchEvent, type MatchSnapshot, SNAP_STRIDE } from './state';
import { expectedGoals } from './xg';

export const AGENCY = {
    /** Pedido de tempo: 1 por tempo, fôlego +5% pra quem pediu e +3% pro rival (Miguel, 18/10/2026), parada de 3 s. */
    timeoutEnergy: 0.05,
    timeoutRivalEnergy: 0.03,
    timeoutTicks: 60,
    /**
     * Golpe máximo (21/10/2026): o botão só acende na hora certa (capitão de linha com a bola na zona de chute; capitão
     * goleiro com um rival na zona) e o toque solta na hora. A ordem fica armada esse tanto (o Duelo e o rival mandam
     * a ordem um pouco à frente, e o toque um pouco antes de acender também vale); passou sem a hora certa, nada
     * acontece e a barra continua como estava.
     */
    maxArmTicks: 100,
    /** Defesa máxima sem chute: volta metade do nível que saiu. */
    maxRefund: 0.5,
    /** Perdendo por 1 enche 1,5x; por 2 ou mais, 2x. */
    maxBehind: [1, 1.5, 2],
    /**
     * Golpe máximo em 3 níveis (motor 11, docs/planos/golpe-maximo-niveis.md): a barra tem 3 gomos de `maxLevelPts`, o
     * toque gasta a barra toda e o golpe sai no nível dela; depois volta a encher. Índice = nível (o 0 não solta). N2 =
     * o máximo de 1 nível do motor 10. `rivalReach`: alcance do goleiro rival nesse chute. Goleiro: `ticks` de defesa
     * máxima e alcance (a do N1 ficou em 0,75 s: com 2 s, soltando a cada gomo, a defesa dava +7 pp; Miguel, 23/10/2026).
     */
    maxLevelPts: 12,
    maxLevelShot: [
        null,
        { power: 1.25, accuracy: 1.3, rivalReach: 1 },
        { power: 1.55, accuracy: 1.6, rivalReach: 1 },
        { power: 2.2, accuracy: 2, rivalReach: 0.7 },
    ],
    maxLevelGk: [null, { ticks: 15, reach: 1.1 }, { ticks: 80, reach: 1.25 }, { ticks: 120, reach: 1.4 }],
    /**
     * Nota do toque na batida (`q` da ordem: 0 fora, 1 bom, 2 perfeito): quanto da parte extra do nível vale. Fora nunca
     * zera (diversão antes de punição). Ordem sem `q` vale como bom.
     */
    maxGrade: [0.4, 0.7, 1],
    /**
     * Zona do golpe máximo pela posição do capitão (Miguel, 22/10/2026: com 15 m pra todos o fixo quase nunca tinha a
     * hora certa): até `range` metros do gol e com ângulo (xG mínimo, a mesma conta da IA pra chutar). O xG de 0,06 só
     * chega a ~19,8 m no meio, então o fixo tem o dele. O goleiro é a zona do rival na defesa máxima.
     */
    maxZone: {
        GK: { range: 15, xg: 0.06 },
        PIVO: { range: 15, xg: 0.06 },
        ALA: { range: 18, xg: 0.06 },
        FIXO: { range: 22, xg: 0.05 },
    },
    /**
     * Goleiro-linha (5 contra 4): com a bola, a linha passa e chuta melhor e sobe mais (metros a mais na posição de
     * ataque). O custo: o rival chuta no gol vazio de até `emptyNetRange`, se o goleiro estiver a mais de
     * `emptyNetGkAway` do gol. Ajustado com scripts/balance/goleiro-linha.ts (beira-da-quadra-2.md).
     */
    flyPass: 1.12,
    flyShot: 1.1,
    flyPush: 2,
    emptyNetRange: 26,
    emptyNetGkAway: 7,
} as const;

interface Pitch {
    length: number;
    width: number;
    goalWidth: number;
}

/**
 * Na zona do golpe máximo de quem ataca o gol do time `team` (o time 0 ataca o gol de x = length), pela posição do
 * capitão `role` (`AGENCY.maxZone`). Regra única: botão da tela, motor, IA, técnico rival e robô passam por aqui.
 */
export function inMaxZone(x: number, y: number, team: 0 | 1, pitch: Pitch, role: Position): boolean {
    const { range, xg } = AGENCY.maxZone[role];
    const gx = team === 0 ? pitch.length : 0;
    const gy = pitch.width / 2;
    const dx = x - gx;
    const dy = y - gy;
    if (dx * dx + dy * dy >= range * range) return false;
    return expectedGoals({ x, y }, gx, gy, pitch.goalWidth) >= xg;
}

/**
 * Hora do golpe máximo no quadro (a tela acende o botão por aqui; o motor usa a mesma zona): o capitão de linha com a
 * bola na zona, ou, com o capitão no gol, um rival com a bola na zona do gol dele.
 */
export function maxCue(
    snap: Pick<MatchSnapshot, 'owner' | 'p' | 'phase'>,
    team: 0 | 1,
    capIdx: number | null,
    capRole: Position,
    pitch: Pitch,
    teamSize = 5,
): boolean {
    if (capIdx === null || snap.phase !== 'play' || snap.owner < 0) return false;
    const ownerTeam = snap.owner < teamSize ? 0 : 1;
    if (capRole === 'GK' ? ownerTeam === team : snap.owner !== capIdx) return false;
    const x = snap.p[snap.owner * SNAP_STRIDE];
    const y = snap.p[snap.owner * SNAP_STRIDE + 1];
    return inMaxZone(x, y, ownerTeam, pitch, capRole);
}

/** Lances que enchem a barra do golpe máximo (pontos por lance do time). */
const MAX_POINTS = { tackle: 1, interception: 0.5, save: 1, shot: 0.5, move: 0.5, goal: 1 } as const;

export interface MaxCharge {
    /** 0..1 */
    charge: number;
    /** Gomos cheios (0–3). */
    level: number;
    /** Defesa máxima valendo (o goleiro espera o chute). */
    active: boolean;
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
    let behind = 0;
    const per = AGENCY.maxLevelPts;
    const full = 3 * per;
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
                // o toque gasta a barra toda e ela volta a encher
                active = false;
                pts = 0;
            } else {
                active = false;
                pts = (e.level ?? 1) * per * AGENCY.maxRefund;
            }
            continue;
        }
        if (e.type === 'goal') behind = e.team === team ? behind - 1 : behind + 1;
        if (active) continue;
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
    return { charge: pts / full, level: Math.floor(pts / per), active };
}

/** Força do efeito no nível e na nota do toque: a nota escala só a parte extra (perfeito 100%, bom 70%, fora 40%). */
export const maxGraded = (x: number, q: 0 | 1 | 2) => (q === 2 ? x : 1 + (x - 1) * AGENCY.maxGrade[q]);
