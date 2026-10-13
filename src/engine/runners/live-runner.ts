import type { Command, Controller } from '../commands';
import type { MatchConfig } from '../config';
import { AIController } from '../controllers/ai-controller';
import { createMatch, snapshot, step } from '../match';
import type { MatchState, TeamSetup } from '../state';

/**
 * Roda a partida tick a tick. Cada jogador tem um Controller — por padrão a IA; o modo jogável futuro
 * troca o controller de 1 jogador (ou do jogador ativo do time) por um HumanController.
 */
export class LiveRunner {
    readonly state: MatchState;
    private readonly ai: AIController;
    private readonly overrides = new Map<number, Controller>();

    constructor(cfg: MatchConfig, home: TeamSetup, away: TeamSetup, seed: number | string) {
        this.state = createMatch(cfg, home, away, seed);
        this.ai = new AIController(this.state);
    }

    setController(playerIdx: number, controller: Controller | null) {
        if (controller) this.overrides.set(playerIdx, controller);
        else this.overrides.delete(playerIdx);
    }

    /** Um tick de simulação (1/tickRate s). */
    step() {
        const s = this.state;
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
