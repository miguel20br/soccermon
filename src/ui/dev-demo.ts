import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { EventBus } from '../game/EventBus';
import { playerTeam, useGame } from '../store/game-store';

/**
 * Atalhos de desenvolvimento (só em `npm run dev`): `?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação.
 */
let started = false;

export function runDevDemo() {
    if (!import.meta.env.DEV || started) return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (demo !== 'penaltis') return;
    started = true;
    // permite aos testes pular direto para o fim do tempo normal
    (window as unknown as { __soccermonBus?: typeof EventBus }).__soccermonBus = EventBus;
    const store = useGame.getState();
    for (let k = 0; k < 80; k++) {
        store.newRun('Demo FC', `pen${k}`);
        const run = useGame.getState().run!;
        const team = aiDraftTeam(new Rng(`pen${k}`, 'demo'), 2, [], run.formation);
        const picks = [...team.lineup, ...team.bench];
        const ready = {
            ...run,
            picks,
            lineup: team.lineup.map((p) => p.uid),
            bench: team.bench.map((p) => p.uid),
            captainUid: team.captainUid,
            draftRound: 7,
            status: 'lineup' as const,
        };
        const r = runMatch(FUTSAL_5, playerTeam(ready), ready.opponents[0], `${ready.seed}-stage-0`, {
            snapshots: false,
        });
        if (r.shootout) {
            useGame.setState({ run: ready, screen: 'lineup' });
            console.info(`[demo] copa ${ready.seed}: oitavas vão para os pênaltis`);
            return;
        }
    }
}
