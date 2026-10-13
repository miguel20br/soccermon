import type { Command, Controller } from '../commands';
import type { MatchConfig } from '../config';
import { AIController } from '../controllers/ai-controller';
import { createMatch, emit, snapshot, step } from '../match';
import type { MatchState, Tactic, TacticChange, TeamSetup } from '../state';

/**
 * Roda a partida tick a tick. Cada jogador tem um Controller — por padrão a IA; o modo jogável futuro
 * troca o controller de 1 jogador (ou do jogador ativo do time) por um HumanController.
 */
export class LiveRunner {
    readonly state: MatchState;
    private readonly ai: AIController;
    private readonly overrides = new Map<number, Controller>();

    private readonly schedule: TacticChange[];

    /** `tacticChanges`: mudanças de tática agendadas (tática ao vivo). Aplicadas no início do tick indicado. */
    constructor(
        cfg: MatchConfig,
        home: TeamSetup,
        away: TeamSetup,
        seed: number | string,
        tacticChanges: TacticChange[] = [],
    ) {
        this.state = createMatch(cfg, home, away, seed);
        this.ai = new AIController(this.state);
        this.schedule = [...tacticChanges].sort((a, b) => a.tick - b.tick);
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
            const change = this.schedule.shift()!;
            if (s.phase !== 'fulltime') this.changeTactic(change.team, change.tactic);
        }
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
