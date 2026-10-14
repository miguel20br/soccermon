import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { EventBus } from '../game/EventBus';
import { playerTeam, useGame } from '../store/game-store';

/**
 * Atalhos de desenvolvimento (só em `npm run dev`): `?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação. `?demo=ditto` monta um time
 * com Ditto e Mew + Mewtwo (sinergia Gênese) cuja primeira partida tem combo. `?demo=evolucao` monta um time
 * de iniciais cuja primeira partida tem evolução do seu time logo no começo. `?demo=campeao` joga uma copa
 * inteira com um time forte e para na tela do título.
 */
let started = false;

export function runDevDemo() {
    if (!import.meta.env.DEV || started) return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (demo !== 'penaltis' && demo !== 'ditto' && demo !== 'evolucao' && demo !== 'campeao') return;
    started = true;
    // permite aos testes pular direto para o fim do tempo normal
    (window as unknown as { __soccermonBus?: typeof EventBus }).__soccermonBus = EventBus;
    const store = useGame.getState();
    if (demo === 'ditto') {
        for (let k = 0; k < 80; k++) {
            store.newRun('Demo FC', `ditto${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`ditto${k}`, 'demo');
            // 1-2-1: goleiro, fixo, alas, pivô
            const lineup = [143, 68, 151, 132, 150].map((id) => createInstance(id, rng));
            // banco com quem evolui (Charmander, Pikachu): testa substituição e evolução
            const bench = [4, 25].map((id) => createInstance(id, rng));
            const ready = {
                ...run,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const r = runMatch(FUTSAL_5, playerTeam(ready), ready.opponents[0], `${ready.seed}-stage-0`, {
                snapshots: false,
            });
            if (r.events.some((e) => e.type === 'combo' && r.roster[e.by].team === 0)) {
                useGame.setState({ run: ready, screen: 'lineup' });
                console.info(`[demo] copa ${ready.seed}: tem combo Gênese`);
                return;
            }
        }
        return;
    }
    if (demo === 'campeao') {
        for (let k = 0; k < 40; k++) {
            store.newRun('Demo FC', `camp${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`camp${k}`, 'demo');
            // goleiro Snorlax, fixo Machamp, alas Mew e Aerodactyl, pivô Mewtwo; banco Dragonite e Pikachu
            const lineup = [143, 68, 151, 142, 150].map((id) => createInstance(id, rng));
            const bench = [149, 25].map((id) => createInstance(id, rng));
            useGame.setState({
                run: {
                    ...run,
                    formation: '1-2-1',
                    picks: [...lineup, ...bench],
                    lineup: lineup.map((p) => p.uid),
                    bench: bench.map((p) => p.uid),
                    captainUid: lineup[4].uid,
                    draftRound: 7,
                    status: 'lineup',
                },
            });
            let m = null;
            for (let stage = 0; stage < 4; stage++) {
                const cur = useGame.getState().run!;
                // com snapshots: as estatísticas da partida (distância, notas) saem deles
                m = runMatch(FUTSAL_5, playerTeam(cur), cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`);
                useGame.getState().recordResult(m);
                if (useGame.getState().run!.status === 'reward') useGame.getState().skipReward();
                else break;
            }
            if (useGame.getState().run!.status === 'champion') {
                useGame.setState({ match: m, screen: 'result' });
                console.info(`[demo] copa camp${k}: campeão`);
                return;
            }
        }
        return;
    }
    if (demo === 'evolucao') {
        for (let k = 0; k < 120; k++) {
            store.newRun('Demo FC', `evo${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`evo${k}`, 'demo');
            // goleiro Geodude, fixo Squirtle, alas Charmander e Bulbasaur, pivô Pikachu
            const lineup = [74, 7, 4, 1, 25].map((id) => createInstance(id, rng));
            const ready = {
                ...run,
                formation: '1-2-1' as const,
                picks: lineup,
                lineup: lineup.map((p) => p.uid),
                bench: [],
                captainUid: lineup[4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const r = runMatch(FUTSAL_5, playerTeam(ready), ready.opponents[0], `${ready.seed}-stage-0`, {
                snapshots: false,
            });
            const evo = r.events.find((e) => e.type === 'evolve' && e.team === 0);
            if (evo && evo.tick < 2400) {
                useGame.setState({ run: ready, screen: 'lineup' });
                console.info(`[demo] copa ${ready.seed}: evolução no tick ${evo.tick}`);
                return;
            }
        }
        return;
    }
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
