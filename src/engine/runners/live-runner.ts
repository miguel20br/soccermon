import type { Command, Controller } from '../commands';
import type { MatchConfig } from '../config';
import { AIController } from '../controllers/ai-controller';
import { TACTIC_MODS } from '../effective';
import { FORMATIONS } from '../formations';
import { applyPendingSubs, createMatch, emit, snapshot, step } from '../match';
import {
    type CornerPlan,
    isCornerOrder,
    isLineupOrder,
    isSubOrder,
    type MatchOrder,
    type MatchState,
    type Tactic,
    type TeamSetup,
} from '../state';

/**
 * Ordem das ordens: (tick, time, seq), estável. Assim o resultado não depende da ordem do array nem de quem
 * repassou a ordem (duelo). Ordens sem `seq` (copa) mantêm a ordem em que vieram dentro do mesmo tick e time.
 */
const byTickTeamSeq = (a: MatchOrder, b: MatchOrder) =>
    a.tick - b.tick || a.team - b.team || (a.seq ?? 0) - (b.seq ?? 0);

/** Prancheta que dá pra aplicar: formação que existe e 5 uids diferentes (quem está em quadra confere o motor). */
const validLineup = (o: MatchOrder) =>
    isLineupOrder(o) &&
    Object.hasOwn(FORMATIONS, o.formation) &&
    Array.isArray(o.order) &&
    o.order.length === FORMATIONS[o.formation].slots.length &&
    o.order.every((u) => typeof u === 'string') &&
    new Set(o.order).size === o.order.length;

/**
 * Ordem que nem dá pra aplicar (time, tick, tática ou prancheta inválidos) é ignorada antes de entrar na agenda. O
 * duelo usa a mesma regra antes de carimbar (src/net/duel-state.ts).
 */
export const validOrder = (o: MatchOrder) =>
    (o.team === 0 || o.team === 1) &&
    Number.isFinite(o.tick) &&
    o.tick >= 0 &&
    (isSubOrder(o) ||
        (isLineupOrder(o)
            ? validLineup(o)
            : isCornerOrder(o)
              ? CORNER_PLANS.includes(o.corner)
              : Object.hasOwn(TACTIC_MODS, o.tactic)));
export const CORNER_PLANS: readonly CornerPlan[] = ['area', 'short', 'mixed'];

/**
 * Roda a partida tick a tick. Cada jogador tem um Controller — por padrão a IA; o modo jogável futuro
 * troca o controller de 1 jogador (ou do jogador ativo do time) por um HumanController.
 */
export class LiveRunner {
    readonly state: MatchState;
    private readonly ai: AIController;
    private readonly overrides = new Map<number, Controller>();

    private readonly schedule: MatchOrder[];

    /**
     * `orders`: ordens do técnico agendadas (tática ao vivo e substituições). A tática vale no início do tick
     * indicado; a substituição espera a próxima saída de bola depois dele. `segmentSeeds`: seed de cada trecho de
     * 2 minutos (duelo ao vivo; ver `MatchState.segmentSeeds`).
     *
     * Regras das ordens, todas determinísticas (dependem só da agenda, nunca de quando a mensagem chegou):
     * - aplicadas por (tick, time, seq);
     * - a ordem do tick T vale no começo do tick T (quando `state.tick` chega a T); ordem que chega com o tick já
     *   passado (`addOrder` com T < `state.tick`) é ignorada;
     * - tática e instrução de escanteio sem limite de trocas (decidido em 18/10/2026); repetir a atual é ignorada;
     * - substituição só com quem está no banco agora e em quadra agora (quem entrou não entra de novo; a que não
     *   der certo na hora da bola parada é ignorada em `applyPendingSubs`);
     * - prancheta (formação + vagas) sem limite, na próxima bola parada como a substituição; uma nova do mesmo time
     *   substitui a que ainda está esperando.
     */
    constructor(
        cfg: MatchConfig,
        home: TeamSetup,
        away: TeamSetup,
        seed: number | string,
        orders: MatchOrder[] = [],
        segmentSeeds: readonly string[] | null = null,
    ) {
        this.state = createMatch(cfg, home, away, seed, segmentSeeds);
        this.ai = new AIController(this.state);
        this.schedule = orders.filter(validOrder).sort(byTickTeamSeq);
    }

    /**
     * Ordem que chega com a partida já rodando (duelo). Devolve false (e ignora) se o tick dela já passou ou se ela
     * é inválida.
     */
    addOrder(order: MatchOrder): boolean {
        if (!validOrder(order) || order.tick < this.state.tick) return false;
        this.schedule.push(order);
        this.schedule.sort(byTickTeamSeq);
        return true;
    }

    /** Muda a tática agora (modo jogável/tempo real). */
    changeTactic(team: 0 | 1, tactic: Tactic) {
        if (this.state.teams[team].tactic === tactic) return;
        this.state.teams[team].tactic = tactic;
        emit(this.state, { type: 'tactic', team, tactic });
    }

    setController(playerIdx: number, controller: Controller | null) {
        if (controller) this.overrides.set(playerIdx, controller);
        else this.overrides.delete(playerIdx);
    }

    /** Muda a instrução de escanteio agora (Na área / Curta / Variar). */
    changeCorner(team: 0 | 1, plan: CornerPlan) {
        if (this.state.teams[team].corner === plan) return;
        this.state.teams[team].corner = plan;
        emit(this.state, { type: 'cornerPlan', team, plan });
    }

    /** Um tick de simulação (1/tickRate s). */
    step() {
        const s = this.state;
        while (this.schedule.length && this.schedule[0].tick <= s.tick) {
            const order = this.schedule.shift()!;
            if (s.phase === 'fulltime') continue;
            if (isSubOrder(order)) s.pendingSubs.push(order);
            else if (isLineupOrder(order)) {
                s.pendingSubs = s.pendingSubs.filter((o) => !(isLineupOrder(o) && o.team === order.team));
                s.pendingSubs.push(order);
            } else if (isCornerOrder(order)) this.changeCorner(order.team, order.corner);
            else this.changeTactic(order.team, order.tactic);
        }
        // troca (e prancheta) pedida no intervalo entra no vestiário, não na 1ª bola parada do 2º tempo
        if (s.phase === 'halftime') applyPendingSubs(s);
        const commands: (Command | Command[])[] = s.players.map((p) =>
            (this.overrides.get(p.idx) ?? this.ai).decide(p.idx),
        );
        step(s, commands);
    }

    snapshot() {
        return snapshot(this.state);
    }

    get finished() {
        return this.state.finished;
    }
}
