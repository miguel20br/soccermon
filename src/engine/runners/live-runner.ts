import type { Command, Controller } from '../commands';
import { MAX_TACTIC_CHANGES, type MatchConfig } from '../config';
import { AIController } from '../controllers/ai-controller';
import { TACTIC_MODS } from '../effective';
import { applyPendingSubs, createMatch, emit, snapshot, step } from '../match';
import { isSubOrder, type MatchOrder, type MatchState, type Tactic, type TeamSetup } from '../state';

/**
 * Ordem das ordens: (tick, time, seq), estável. Assim o resultado não depende da ordem do array nem de quem
 * repassou a ordem (duelo). Ordens sem `seq` (copa) mantêm a ordem em que vieram dentro do mesmo tick e time.
 */
const byTickTeamSeq = (a: MatchOrder, b: MatchOrder) =>
    a.tick - b.tick || a.team - b.team || (a.seq ?? 0) - (b.seq ?? 0);

/** Ordem que nem dá pra aplicar (time, tick ou tática inválidos) é ignorada antes de entrar na agenda. */
const validOrder = (o: MatchOrder) =>
    (o.team === 0 || o.team === 1) &&
    Number.isFinite(o.tick) &&
    o.tick >= 0 &&
    (isSubOrder(o) || Object.hasOwn(TACTIC_MODS, o.tactic));

/**
 * Roda a partida tick a tick. Cada jogador tem um Controller — por padrão a IA; o modo jogável futuro
 * troca o controller de 1 jogador (ou do jogador ativo do time) por um HumanController.
 */
export class LiveRunner {
    readonly state: MatchState;
    private readonly ai: AIController;
    private readonly overrides = new Map<number, Controller>();

    private readonly schedule: MatchOrder[];
    /** Trocas de tática que já valeram, por time (limite `MAX_TACTIC_CHANGES`). */
    private readonly tacticChanges: [number, number] = [0, 0];

    /**
     * `orders`: ordens do técnico agendadas (tática ao vivo e substituições). A tática vale no início do tick
     * indicado; a substituição espera a próxima saída de bola depois dele. `segmentSeeds`: seed de cada trecho de
     * 2 minutos (duelo ao vivo; ver `MatchState.segmentSeeds`).
     *
     * Regras das ordens, todas determinísticas (dependem só da agenda, nunca de quando a mensagem chegou):
     * - aplicadas por (tick, time, seq);
     * - a ordem do tick T vale no começo do tick T (quando `state.tick` chega a T); ordem que chega com o tick já
     *   passado (`addOrder` com T < `state.tick`) é ignorada;
     * - a 4ª troca de tática de um time é ignorada (`MAX_TACTIC_CHANGES`); repetir a tática atual não conta;
     * - substituição só com quem está no banco agora e em quadra agora (quem entrou não entra de novo; a que não
     *   der certo na hora da bola parada é ignorada em `applyPendingSubs`).
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

    /** Muda a tática agora (modo jogável/tempo real). Respeita o limite de trocas por partida. */
    changeTactic(team: 0 | 1, tactic: Tactic) {
        if (this.state.teams[team].tactic === tactic || this.tacticChanges[team] >= MAX_TACTIC_CHANGES) return;
        this.tacticChanges[team]++;
        this.state.teams[team].tactic = tactic;
        emit(this.state, { type: 'tactic', team, tactic });
    }

    setController(playerIdx: number, controller: Controller | null) {
        if (controller) this.overrides.set(playerIdx, controller);
        else this.overrides.delete(playerIdx);
    }

    /** Um tick de simulação (1/tickRate s). */
    step() {
        const s = this.state;
        while (this.schedule.length && this.schedule[0].tick <= s.tick) {
            const order = this.schedule.shift()!;
            if (s.phase === 'fulltime') continue;
            if (isSubOrder(order)) s.pendingSubs.push(order);
            else this.changeTactic(order.team, order.tactic);
        }
        // troca pedida no intervalo entra no vestiário, não na 1ª bola parada do 2º tempo
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
