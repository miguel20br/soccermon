import { type LinkAsk, useCloud } from '../cloud/cloud';
import type { SaveSummary } from '../cloud/reconcile-plan';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { createInstance } from '../engine/instance';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { EventBus } from '../game/EventBus';
import { playerTeam, useGame } from '../store/game-store';
import { isTrailerScene, trailerPicks } from './trailer-scenes';

/**
 * Atalhos de desenvolvimento (só em `npm run dev`): `?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação. `?demo=ditto` monta um time
 * com Ditto e Mew + Mewtwo (sinergia Gênese) cuja primeira partida tem combo. `?demo=evolucao` monta um time
 * de iniciais cuja primeira partida tem evolução do seu time logo no começo. `?demo=campeao` joga uma copa
 * inteira com um time forte e para na tela do título. `?demo=mt` abre a recompensa depois das oitavas com
 * uma MT do ginásio entre as 3 cartas (Charmeleon, Caterpie e cia. para testar quem aprende). `?demo=conta&tipo=levar|juntar|juntar1|copa|outra|guardada`
 * mostra a pergunta depois do login (com resumos de mentira; os botões só fecham) ou a copa guardada na tela inicial. `?demo=trailer&cena=<cena>&seed=<seed>` abre na escalação a
 * partida que a caça de lances (scripts/trailer-hunt.ts) escolheu para o trailer. `?demo=escanteio` monta um time de
 * grandalhões cuja primeira partida tem escanteio seu com disputa no alto logo no começo.
 */
let started = false;

export function runDevDemo() {
    if (!import.meta.env.DEV || started) return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (
        demo !== 'penaltis' &&
        demo !== 'ditto' &&
        demo !== 'evolucao' &&
        demo !== 'campeao' &&
        demo !== 'trailer' &&
        demo !== 'mt' &&
        demo !== 'escanteio' &&
        demo !== 'conta'
    )
        return;
    started = true;
    // permite aos testes pular direto para o fim do tempo normal
    (window as unknown as { __soccermonBus?: typeof EventBus }).__soccermonBus = EventBus;
    const store = useGame.getState();
    if (demo === 'conta') {
        demoAccount(new URLSearchParams(window.location.search).get('tipo') ?? 'juntar');
        return;
    }
    if (demo === 'trailer') {
        const params = new URLSearchParams(window.location.search);
        const cena = params.get('cena');
        const seed = params.get('seed');
        if (!isTrailerScene(cena) || !seed || !/^[a-z0-9-]{1,32}$/i.test(seed)) return;
        // mesma montagem do trailer-hunt: mesma seed da copa, mesmo time, então a mesma partida
        store.newRun('Pallet FC', seed);
        const run = useGame.getState().run!;
        const { lineup, bench, captainUid } = trailerPicks(cena, seed);
        useGame.setState({
            run: {
                ...run,
                formation: '1-2-1',
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid,
                draftRound: 7,
                status: 'lineup',
            },
            screen: 'lineup',
        });
        console.info(`[demo] trailer: cena ${cena}, copa ${seed}`);
        return;
    }
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
    if (demo === 'mt') {
        for (let k = 0; k < 200; k++) {
            store.newRun('Demo FC', `mt${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`mt${k}`, 'demo');
            // goleiro Onix, fixo Squirtle, alas Charmeleon e Pikachu, pivô Geodude; banco Caterpie e Gastly
            const lineup = [95, 7, 5, 25, 74].map((id) => createInstance(id, rng));
            const bench = [10, 92].map((id) => createInstance(id, rng));
            const picks = [...lineup, ...bench];
            const opp = run.opponents[0];
            const rewards = rewardOptions(run.seed, 0, 0, picks, {
                name: opp.name,
                players: [...opp.lineup, ...opp.bench],
            });
            if (!rewards.some((r) => r.kind === 'tm' && r.leader)) continue;
            useGame.setState({
                run: {
                    ...run,
                    formation: '1-2-1',
                    picks,
                    lineup: lineup.map((p) => p.uid),
                    bench: bench.map((p) => p.uid),
                    captainUid: lineup[2].uid,
                    draftRound: 7,
                    status: 'reward',
                    results: [
                        { stage: 0, opponent: opp.name, score: [3, 1], shootout: null, won: true, destaqueUid: null },
                    ],
                    rewards,
                },
                screen: 'reward',
            });
            console.info(`[demo] copa mt${k}: MT do ${opp.name}`);
            return;
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
    if (demo === 'escanteio') {
        for (let k = 0; k < 200; k++) {
            store.newRun('Demo FC', `esc${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`esc${k}`, 'demo');
            // goleiro Snorlax, fixo Machamp, alas Gyarados e Pidgeot, pivô Dragonite; banco Onix e Pikachu
            const lineup = [143, 68, 130, 18, 149].map((id) => createInstance(id, rng));
            const bench = [95, 25].map((id) => createInstance(id, rng));
            const ready = {
                ...run,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                cornerPlan: 'area' as const,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const r = runMatch(FUTSAL_5, playerTeam(ready), ready.opponents[0], `${ready.seed}-stage-0`, {
                snapshots: false,
            });
            const aerial = r.events.find((e) => e.type === 'aerial' && e.high && e.team === 0);
            if (aerial && aerial.tick < 1500) {
                useGame.setState({ run: ready, screen: 'lineup' });
                console.info(`[demo] copa ${ready.seed}: escanteio com disputa no alto no tick ${aerial.tick}`);
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

/** `?demo=conta`: a pergunta do login sem login de verdade (os botões só fecham, nada sobe nem muda). */
function demoAccount(tipo: string) {
    const store = useGame.getState();
    if (tipo === 'guardada') {
        // uma copa guardada e outra em andamento: confere a linha "Copa guardada" e a troca
        store.newRun('Cerulean Stars', 'demo-guardada');
        const parked = useGame.getState().run!;
        store.newRun('Pallet FC', 'demo-atual');
        useGame.setState({ parkedRuns: [parked], onboarded: true, screen: 'home' });
        return;
    }
    useGame.setState({ onboarded: true, screen: 'home' });
    if (tipo === 'outra') {
        useCloud.setState({ notice: 'other-account' });
        return;
    }
    const device: SaveSummary = {
        club: 'Pallet FC',
        cup: { team: 'Pallet FC', status: 'lineup', stage: 2, draftRound: 7 },
        cups: 3,
        titles: 1,
        seen: 42,
        parked: 0,
    };
    const cloud: SaveSummary = {
        club: 'Viridian United',
        cup: { team: 'Viridian United', status: 'drafting', stage: 0, draftRound: 3 },
        cups: 12,
        titles: 4,
        seen: 118,
        parked: 1,
    };
    const ask: LinkAsk =
        tipo === 'levar'
            ? { kind: 'bring', device, cloud: null, cupChoice: false, keep: 'device' }
            : tipo === 'copa'
              ? { kind: 'cup', device, cloud, cupChoice: true, keep: 'device' }
              : tipo === 'juntar1'
                ? { kind: 'merge', device, cloud: { ...cloud, cup: null }, cupChoice: false, keep: 'device' }
                : { kind: 'merge', device, cloud, cupChoice: true, keep: 'device' };
    useCloud.setState({ ask });
}
