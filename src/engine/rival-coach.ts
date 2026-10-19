/**
 * Técnico rival que reage (M10 de docs/planos/pesquisas/agencia.md): na Copa, com o experimento "beira da quadra"
 * ligado, o líder do clube rival usa as mesmas armas que você (gritos, pedido de tempo, goleiro-linha, golpe máximo e
 * tática) por uma regra simples com a personalidade dele. Só lê o estado da partida e gera ordens normais
 * (`AgencyOrder`/`TacticChange`) um pouco à frente, pelo mesmo caminho das ordens do técnico: o motor aplica os
 * mesmos limites (3 gritos, 1 tempo por tempo...). Determinístico: o único sorteio (o "humor" do dia, que mexe uns
 * minutos nos gatilhos) sai de um Rng próprio da seed da partida, então o resto da partida não muda de sorteio.
 *
 * Sem `TeamSetup.coach` nada disso existe: a partida é bit a bit a de antes.
 * Números daqui são a 1ª proposta (nada aprovado): mexer só com o antes/depois do técnico robô
 * (`scripts/balance/coach.ts`).
 */
import { AGENCY, maxCharge, type Shout } from './agency';
import { emit, minuteOf } from './match';
import { Rng } from './rng';
import type { MatchOrder, MatchState, Tactic } from './state';

/** Os treinadores da copa: os 8 líderes de Kanto, a Agatha (Lavender) e o Lance (Liga Índigo). Mesmo id do sprite. */
export type LeaderId =
    | 'brock'
    | 'misty'
    | 'ltsurge'
    | 'erika'
    | 'koga'
    | 'sabrina'
    | 'blaine'
    | 'giovanni'
    | 'agatha'
    | 'lance';

/** Personalidade do técnico: quando cada arma sai. Minutos do relógio (0..40). */
export interface CoachStyle {
    /** Grito logo no começo, qualquer que seja o placar (Surge). */
    open?: { shout: Shout; at: number };
    /** Perdendo: grito (e tática, se tiver) a partir do minuto. */
    behind: { shout: Shout; at: number; tactic?: Tactic };
    /** Perdendo no fim: o grito do desespero. */
    late: { shout: Shout; at: number };
    /** Ganhando por 1 ou 2: grito (e tática) a partir do minuto; null = segue igual. */
    lead: { shout: Shout; at: number; tactic?: Tactic } | null;
    /** Fôlego médio da linha abaixo disso: "Calma!". */
    calmBelow: number;
    /** Pedido de tempo: quando o time cansa e/ou quando você passa na frente. */
    timeout: { tired: boolean; turned: boolean };
    /** Goleiro-linha perdendo por 1 ou 2 a partir do minuto; null = nunca. */
    fly: number | null;
    /** Golpe máximo: assim que a barra enche, ou só com o jogo apertado (diferença de até 1). */
    max: 'asap' | 'close';
}

/** Brock firme, Misty provocadora, Surge barulhento, Erika calma, Koga fecha a casinha, Giovanni frio... */
export const COACH_STYLES: Record<LeaderId, CoachStyle> = {
    // fecha a casinha no 2º tempo ganhando; só ataca no fim
    brock: {
        behind: { shout: 'attack', at: 30 },
        late: { shout: 'press', at: 36 },
        lead: { shout: 'lock', at: 22 },
        calmBelow: 0.45,
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // perdendo aos 30' vai pra cima com tudo; pede tempo pra te esfriar quando você passa na frente
    misty: {
        behind: { shout: 'attack', at: 28, tactic: 'offensive' },
        late: { shout: 'press', at: 35 },
        lead: null,
        calmBelow: 0.4,
        timeout: { tired: false, turned: true },
        fly: 36,
        max: 'asap',
    },
    // "Pra cima!" cedo, barulho o jogo todo, golpe máximo na hora
    ltsurge: {
        open: { shout: 'attack', at: 3 },
        behind: { shout: 'press', at: 20 },
        late: { shout: 'attack', at: 34 },
        lead: null,
        calmBelow: 0.35,
        timeout: { tired: true, turned: false },
        fly: 35,
        max: 'asap',
    },
    // calma e passe; segura o resultado sem desespero
    erika: {
        behind: { shout: 'calm', at: 26 },
        late: { shout: 'attack', at: 35 },
        lead: { shout: 'lock', at: 30 },
        calmBelow: 0.6,
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // ganhando, fecha a casinha cedo e vira retranca
    koga: {
        behind: { shout: 'press', at: 30 },
        late: { shout: 'attack', at: 36 },
        lead: { shout: 'lock', at: 10, tactic: 'defensive' },
        calmBelow: 0.45,
        timeout: { tired: false, turned: true },
        fly: null,
        max: 'close',
    },
    // lê o jogo: pede tempo quando você passa na frente e responde cedo
    sabrina: {
        behind: { shout: 'attack', at: 24 },
        late: { shout: 'press', at: 34 },
        lead: { shout: 'calm', at: 32 },
        calmBelow: 0.5,
        timeout: { tired: false, turned: true },
        fly: 37,
        max: 'close',
    },
    // esquentado: perdendo, abafa cedo e liga o goleiro-linha
    blaine: {
        behind: { shout: 'attack', at: 15, tactic: 'offensive' },
        late: { shout: 'press', at: 30 },
        lead: null,
        calmBelow: 0.35,
        timeout: { tired: true, turned: false },
        fly: 33,
        max: 'asap',
    },
    // frio: pede tempo quando você vira, segura ganhando, goleiro-linha no fim
    giovanni: {
        behind: { shout: 'attack', at: 30 },
        late: { shout: 'press', at: 36 },
        lead: { shout: 'lock', at: 30, tactic: 'defensive' },
        calmBelow: 0.45,
        timeout: { tired: false, turned: true },
        fly: 34,
        max: 'close',
    },
    // veterana: cozinha o jogo ganhando, cansa você
    agatha: {
        behind: { shout: 'press', at: 32 },
        late: { shout: 'attack', at: 36 },
        lead: { shout: 'lock', at: 25 },
        calmBelow: 0.5,
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // a final: usa tudo, golpe máximo assim que enche
    lance: {
        behind: { shout: 'attack', at: 26 },
        late: { shout: 'press', at: 34 },
        lead: { shout: 'lock', at: 34 },
        calmBelow: 0.45,
        timeout: { tired: true, turned: true },
        fly: 36,
        max: 'asap',
    },
};

export const COACH_LEADERS = Object.keys(COACH_STYLES) as LeaderId[];

export const RIVAL_COACH = {
    /** Decide a cada segundo de jogo. */
    everyTicks: 20,
    /**
     * A ordem vale 10 s de jogo depois de avisada (a narração avisa antes, como no Into the Breach; Miguel, 19/10).
     * Técnico robô com 200 (RIVAL=1, 400 partidas, x4): nunca usa 50,7%, aleatório 50,0%, usa bem 52,3%, lê o aviso 54,0%.
     */
    leadTicks: 200,
    /** Humor do dia: até tantos minutos mais cedo ou mais tarde em cada gatilho. */
    jitter: 2,
    /** Pedido de tempo "cansado": minuto e fôlego médio em cada tempo (como o "usa bem" do robô). */
    tiredAt: [12, 28],
    tiredBelow: [0.62, 0.52],
} as const;

export type CoachCall =
    | { call: 'shout'; shout: Shout }
    | { call: 'timeout' }
    | { call: 'flyGk'; on: boolean }
    | { call: 'max' }
    | { call: 'tactic'; tactic: Tactic };

/** Técnico IA de um time (o rival da Copa). Uma instância por partida; `decide` roda dentro do LiveRunner. */
export class RivalCoach {
    private readonly style: CoachStyle;
    private readonly shift: number;
    private lastShout = Number.NEGATIVE_INFINITY;
    private opened = false;
    private wantFly = false;
    private wantTactic: Tactic;
    private maxSent = false;
    private prevDiff = 0;
    private turned = false;
    /** Já pediu tempo neste tempo (a ordem só vira `timeoutPending` quando entra, `leadTicks` depois). */
    private timeoutSent = [false, false];

    constructor(
        readonly leader: LeaderId,
        private readonly team: 0 | 1,
        seed: number | string,
        baseTactic: Tactic,
    ) {
        this.style = COACH_STYLES[leader];
        this.shift = new Rng(seed, `coach-${team}`).range(-RIVAL_COACH.jitter, RIVAL_COACH.jitter);
        this.wantTactic = baseTactic;
    }

    /** Ordens novas deste tick (já com o aviso na narração). Só chamar a cada `everyTicks`. */
    decide(s: MatchState): MatchOrder[] {
        if (s.phase === 'halftime' || s.phase === 'fulltime') return [];
        const st = this.style;
        const team = this.team;
        const ag = s.teams[team].agency;
        const min = minuteOf(s);
        const at = (m: number) => min >= m + this.shift;
        const diff = s.score[team] - s.score[1 - team];
        // "você virou": o rival já tinha marcado, estava empatando ou ganhando e passou a perder (1 x 1 → 1 x 2)
        if (diff < 0 && this.prevDiff >= 0 && s.score[team] > 0) this.turned = true;
        this.prevDiff = diff;
        const tick = s.tick + RIVAL_COACH.leadTicks;
        const field = s.players.filter((p) => p.team === team && p.role !== 'GK');
        const energy = field.reduce((a, p) => a + p.energy, 0) / (field.length || 1);
        const calls: CoachCall[] = [];
        // grito, tempo e golpe máximo não saem no último minuto e meio de cada tempo: a ordem só vale `leadTicks`
        // depois (10 s, ~1 minuto do relógio) e o apito engoliria o que a narração já avisou
        const h = s.half - 1;
        const halfEnd = s.cfg.displayHalfMinutes * s.half - 1.5;

        // grito: um por vez, com sobra e fora da recarga
        const free =
            min < halfEnd &&
            ag.shoutsUsed < AGENCY.shoutLimit &&
            tick >= ag.shoutReadyAt &&
            s.tick > this.lastShout + RIVAL_COACH.leadTicks;
        if (free) {
            let shout: Shout | null = null;
            if (st.open && !this.opened && at(st.open.at)) {
                this.opened = true;
                shout = st.open.shout;
            } else if (diff < 0 && at(st.late.at)) shout = st.late.shout;
            else if (diff < 0 && at(st.behind.at)) shout = st.behind.shout;
            else if (st.lead && diff > 0 && diff <= 2 && at(st.lead.at)) shout = st.lead.shout;
            else if (energy < st.calmBelow) shout = 'calm';
            // não repete o grito que ainda vale
            if (shout && ag.shout?.kind !== shout) {
                calls.push({ call: 'shout', shout });
                this.lastShout = s.tick;
            }
        }

        // pedido de tempo: 1 por tempo (o motor confere)
        if (!this.timeoutSent[h] && !ag.timeouts[h] && min < halfEnd) {
            const tired = st.timeout.tired && at(RIVAL_COACH.tiredAt[h]) && energy < RIVAL_COACH.tiredBelow[h];
            if ((st.timeout.turned && this.turned) || tired) {
                calls.push({ call: 'timeout' });
                this.timeoutSent[h] = true;
                this.turned = false;
            }
        }

        // goleiro-linha: perdendo por 1 ou 2 no fim
        if (st.fly !== null) {
            const want = diff < 0 && diff >= -2 && at(st.fly);
            if (want !== this.wantFly) {
                this.wantFly = want;
                calls.push({ call: 'flyGk', on: want });
            }
        }

        // golpe máximo: 1 por partida, com a barra cheia
        if (!this.maxSent && !ag.max && min < halfEnd && (st.max === 'asap' || Math.abs(diff) <= 1)) {
            const c = maxCharge(s.events, team, s.tick, s.cfg.teamSize);
            if (c.charge >= 1 && !c.used && !c.active) {
                this.maxSent = true;
                calls.push({ call: 'max' });
            }
        }

        // tática: muda com o placar e volta pra de sempre
        const base = s.teams[team].setup.tactic;
        const tactic =
            diff < 0 && st.behind.tactic && at(st.behind.at)
                ? st.behind.tactic
                : diff > 0 && st.lead?.tactic && at(st.lead.at)
                  ? st.lead.tactic
                  : base;
        if (tactic !== this.wantTactic) {
            this.wantTactic = tactic;
            calls.push({ call: 'tactic', tactic });
        }

        return calls.map((c) => {
            emit(s, { type: 'coach', team, leader: this.leader, ...c });
            return toOrder(c, team, tick);
        });
    }
}

function toOrder(c: CoachCall, team: 0 | 1, tick: number): MatchOrder {
    switch (c.call) {
        case 'shout':
            return { tick, team, kind: 'shout', shout: c.shout };
        case 'timeout':
            return { tick, team, kind: 'timeout' };
        case 'flyGk':
            return { tick, team, kind: 'flyGk', on: c.on };
        case 'max':
            return { tick, team, kind: 'max' };
        case 'tactic':
            return { tick, team, tactic: c.tactic };
    }
}
