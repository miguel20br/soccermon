import type { Command, Controller } from '../commands';
import type { MatchConfig } from '../config';
import { AIController } from '../controllers/ai-controller';
import { applyPendingSubs, createMatch, emit, snapshot, step } from '../match';
import { isSubOrder, type MatchOrder, type MatchState, type Tactic, type TeamSetup } from '../state';

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
     * indicado; a substituição espera a próxima saída de bola depois dele.
     */
    constructor(cfg: MatchConfig, home: TeamSetup, away: TeamSetup, seed: number | string, orders: MatchOrder[] = []) {
        this.state = createMatch(cfg, home, away, seed);
        this.ai = new AIController(this.state);
        this.schedule = [...orders].sort((a, b) => a.tick - b.tick);
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
