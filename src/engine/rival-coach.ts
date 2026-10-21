/**
 * Técnico rival que reage (M10 de docs/planos/pesquisas/agencia.md): na Copa, com o experimento "beira da quadra"
 * ligado, o líder do clube rival usa as mesmas armas que você (pedido de tempo, goleiro-linha, golpe máximo e tática)
 * por uma regra simples com a personalidade dele. Só lê o estado da partida e gera ordens normais
 * (`AgencyOrder`/`TacticChange`) um pouco à frente, pelo mesmo caminho das ordens do técnico: o motor aplica os
 * mesmos limites (1 tempo por tempo, barra cheia...). Determinístico: o único sorteio (o "humor" do dia, que mexe uns
 * minutos nos gatilhos) sai de um Rng próprio da seed da partida, então o resto da partida não muda de sorteio.
 *
 * Sem `TeamSetup.coach` nada disso existe: a partida é bit a bit a de antes.
 * Números daqui são a 1ª proposta (nada aprovado): mexer só com o antes/depois do técnico robô
 * (`scripts/balance/coach.ts`).
 */
import { inMaxZone, maxCharge } from './agency';
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
    /** Perdendo: tática a partir do minuto (sem tática, segue a de sempre). */
    behind: { at: number; tactic?: Tactic };
    /** Ganhando por 1 ou 2: tática a partir do minuto; null = segue igual. */
    lead: { at: number; tactic?: Tactic } | null;
    /** Pedido de tempo: quando o time cansa e/ou quando você passa na frente. */
    timeout: { tired: boolean; turned: boolean };
    /** Goleiro-linha perdendo por 1 ou 2 a partir do minuto; null = nunca. */
    fly: number | null;
    /** Golpe máximo: na 1ª hora certa com a barra cheia, ou só com o jogo apertado (diferença de até 1). */
    max: 'asap' | 'close';
}

/** Brock firme, Misty provocadora, Surge barulhento, Erika calma, Koga fecha a casinha, Giovanni frio... */
export const COACH_STYLES: Record<LeaderId, CoachStyle> = {
    // fecha a casinha no 2º tempo ganhando; só ataca no fim
    brock: {
        behind: { at: 30 },
        lead: { at: 22 },
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // perdendo aos 30' vai pra cima com tudo; pede tempo pra te esfriar quando você passa na frente
    misty: {
        behind: { at: 28, tactic: 'offensive' },
        lead: null,
        timeout: { tired: false, turned: true },
        fly: 36,
        max: 'asap',
    },
    // golpe máximo na 1ª chance
    ltsurge: {
        behind: { at: 20 },
        lead: null,
        timeout: { tired: true, turned: false },
        fly: 35,
        max: 'asap',
    },
    // segura o resultado sem desespero
    erika: {
        behind: { at: 26 },
        lead: { at: 30 },
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // ganhando, fecha a casinha cedo e vira retranca
    koga: {
        behind: { at: 30 },
        lead: { at: 10, tactic: 'defensive' },
        timeout: { tired: false, turned: true },
        fly: null,
        max: 'close',
    },
    // lê o jogo: pede tempo quando você passa na frente e responde cedo
    sabrina: {
        behind: { at: 24 },
        lead: { at: 32 },
        timeout: { tired: false, turned: true },
        fly: 37,
        max: 'close',
    },
    // esquentado: perdendo, abafa cedo e liga o goleiro-linha
    blaine: {
        behind: { at: 15, tactic: 'offensive' },
        lead: null,
        timeout: { tired: true, turned: false },
        fly: 33,
        max: 'asap',
    },
    // frio: pede tempo quando você vira, segura ganhando, goleiro-linha no fim
    giovanni: {
        behind: { at: 30 },
        lead: { at: 30, tactic: 'defensive' },
        timeout: { tired: false, turned: true },
        fly: 34,
        max: 'close',
    },
    // veterana: cozinha o jogo ganhando, cansa você
    agatha: {
        behind: { at: 32 },
        lead: { at: 25 },
        timeout: { tired: true, turned: false },
        fly: null,
        max: 'close',
    },
    // a final: usa tudo, golpe máximo assim que enche
    lance: {
        behind: { at: 26 },
        lead: { at: 34 },
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
    | { call: 'timeout' }
    | { call: 'flyGk'; on: boolean }
    | { call: 'max' }
    | { call: 'tactic'; tactic: Tactic };

/** Técnico IA de um time (o rival da Copa). Uma instância por partida; `decide` roda dentro do LiveRunner. */
export class RivalCoach {
    private readonly style: CoachStyle;
    private readonly shift: number;
    private wantFly = false;
    private wantTactic: Tactic;
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
        // tempo não sai no último minuto e meio de cada tempo: a ordem só vale `leadTicks` depois (10 s, ~1 minuto do
        // relógio) e o apito engoliria o que a narração já avisou
        const h = s.half - 1;
        const halfEnd = s.cfg.displayHalfMinutes * s.half - 1.5;

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

        // golpe máximo: com a barra cheia, na hora certa (o capitão com a bola na zona, ou o rival na zona do goleiro
        // capitão). Vale no tick seguinte, sem aviso: é um lance, não um plano
        if (s.phase === 'play' && !ag.max && (st.max === 'asap' || Math.abs(diff) <= 1) && this.maxCue(s)) {
            const c = maxCharge(s.events, team, s.tick, s.cfg.teamSize);
            if (c.charge >= 1 && !c.used && !c.active) calls.push({ call: 'max' });
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
            return toOrder(c, team, c.call === 'max' ? s.tick + 1 : tick);
        });
    }

    /** A hora do golpe máximo (a mesma zona do botão do técnico). */
    private maxCue(s: MatchState): boolean {
        const cap = s.players.find((p) => p.team === this.team && p.captain);
        if (!cap || s.ball.owner === null) return false;
        const carrier = s.players[s.ball.owner];
        if (cap.role === 'GK' ? carrier.team === this.team : carrier !== cap) return false;
        return inMaxZone(carrier.pos.x, carrier.pos.y, carrier.team, s.cfg.pitch);
    }
}

function toOrder(c: CoachCall, team: 0 | 1, tick: number): MatchOrder {
    switch (c.call) {
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
