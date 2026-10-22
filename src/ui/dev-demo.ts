import { type LinkAsk, useCloud } from '../cloud/cloud';
import type { SaveSummary } from '../cloud/reconcile-plan';
import { maxCharge } from '../engine/agency';
import { ENGINE_VERSION, FUTSAL_5 } from '../engine/config';
import { clubLeader, cupRival } from '../engine/cup';
import { isMatchKind } from '../engine/cup-map';
import { species } from '../engine/data';
import { aiDraftTeam } from '../engine/draft';
import { FORMATIONS, type FormationId } from '../engine/formations';
import { createInstance, type PokemonInstance } from '../engine/instance';
import { inMaxZoneOf } from '../engine/match';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { LiveRunner } from '../engine/runners/live-runner';
import { EVENT_TYPES, ICONS, type Special } from '../engine/specials';
import { EventBus } from '../game/EventBus';
import { type BinderCard, binderAdd } from '../store/binder';
import { playerTeam, useGame } from '../store/game-store';
import { EVENT_IDS, type EventId, rollEvent } from '../store/long-events';
import { earnedKeys, medalViewOf } from '../store/news';
import { EDITION_BIT, editionBits } from '../store/profile';
import { isTrailerScene, trailerPicks } from './trailer-scenes';

/**
 * Atalhos de desenvolvimento (no dev e nas prévias da Vercel, `__SMOKE__`; nunca em produção):`?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação. `?demo=ditto` monta um time
 * com Ditto e Mew + Mewtwo (sinergia Gênese) cuja primeira partida tem combo. `?demo=evolucao` monta um time
 * de iniciais cuja primeira partida tem evolução do seu time logo no começo (`&rival=1`: do rival). `?demo=campeao` joga uma copa
 * inteira com um time forte e para na tela do título (`?demo=momentos` é a mesma: Melhores momentos e gol da copa). `?demo=mercado` abre o Mercado depois das quartas (₽, 2 Patrocínios). `?demo=mt` abre a recompensa depois das oitavas com
 * uma MT do ginásio entre as 3 cartas (Charmeleon, Caterpie e cia. para testar quem aprende). `?demo=conta&tipo=levar|juntar|juntar1|copa|outra|guardada`
 * mostra a pergunta depois do login (com resumos de mentira; os botões só fecham) ou a copa guardada na tela inicial. `?demo=trailer&cena=<cena>&seed=<seed>` abre na escalação a
 * partida que a caça de lances (scripts/trailer-hunt.ts) escolheu para o trailer. `?demo=escanteio` monta um time de
 * grandalhões cuja primeira partida tem escanteio seu com disputa no alto logo no começo. `?demo=colecao` põe no save uma
 * carreira de mentira (medalhas em vários degraus, coleções, selos, escudo e uniforme listrado, vitrine cheia) e abre o
 * Perfil (`&perfil=medalhas` abre na aba); `&novo=1` deixa o clube no padrão (pra ver o editor do zero). `?demo=album`
 * enche o álbum de cartas (edições, combos, ×N) e a Pokédex, escolhe 3 pra vitrine e abre a Pokédex no Álbum.
 * `?demo=lider&clube=<id>` (brock,
 * misty, ltsurge, erika, koga, sabrina, blaine, giovanni, agatha, lance) põe o clube desse treinador na primeira
 * partida (VERSUS com a fala, a quadra do ginásio), uma em que o rival reage cedo.
 * `?demo=amigos` abre Perfil → Amigos com um servidor de mentira (`&tela=home`: o convite na Home; `&cartao=1|anon`: o
 * botão "Adicionar amigo" num cartão do treinador de mentira).
 * `?demo=platina` libera a
 * platina da Gen 1 sem platinar (Prof. Carvalho holográfico e Diploma de Kanto, já escolhidos) e mostra o aviso na Home.
 * `?demo=vestiario` abre na
 * escalação uma partida que, ao começar, já está a 2 s do intervalo, com 2 no banco e troca do rival no intervalo (o
 * vestiário: várias trocas, desfazer e "O rival trocou"). `?demo=acrescimos` abre na escalação uma partida que você está
 * perdendo no fim: ao começar, já está na Pressão final, a 3 s dos acréscimos do 2º tempo ("+N'" no placar).
 * `?demo=maximo` abre na escalação uma partida que, ao começar, está a 2 s do botão do golpe máximo aceso
 * (barra cheia, capitão Dragonite com a bola na zona); `&goleiro=1`: capitão Snorlax no gol (defesa máxima).
 */
let started = false;

export function runDevDemo() {
    if (!__SMOKE__ || started) return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (
        demo !== 'penaltis' &&
        demo !== 'ditto' &&
        demo !== 'evolucao' &&
        demo !== 'campeao' &&
        demo !== 'eliminado' &&
        demo !== 'momentos' &&
        demo !== 'trailer' &&
        demo !== 'mt' &&
        demo !== 'mercado' &&
        demo !== 'mapa' &&
        demo !== 'treino' &&
        demo !== 'evento' &&
        demo !== 'grupo' &&
        demo !== 'fora' &&
        demo !== 'escanteio' &&
        demo !== 'conta' &&
        demo !== 'lider' &&
        demo !== 'colecao' &&
        demo !== 'novidades' &&
        demo !== 'fichario' &&
        demo !== 'album' &&
        demo !== 'dia' &&
        demo !== 'liga' &&
        demo !== 'amigos' &&
        demo !== 'platina' &&
        demo !== 'vestiario' &&
        demo !== 'acrescimos' &&
        demo !== 'maximo' &&
        demo !== 'sala'
    )
        return;
    started = true;
    // permite aos testes pular direto para o fim do tempo normal
    (window as unknown as { __soccermonBus?: typeof EventBus }).__soccermonBus = EventBus;
    const store = useGame.getState();
    if (demo === 'colecao') {
        demoCollection();
        return;
    }
    if (demo === 'novidades') {
        demoNews();
        return;
    }
    if (demo === 'sala') {
        demoTrophyRoom();
        return;
    }
    if (demo === 'fichario' || demo === 'album') {
        demoBinder();
        return;
    }
    // Copa do Dia e Liga com um servidor de mentira (src/league/demo.ts): `?demo=dia[&estado=feito]`, `?demo=liga`
    if (demo === 'dia' || demo === 'liga') {
        const estado = new URLSearchParams(window.location.search).get('estado');
        void import('../league/demo').then((m) => m.startLeagueDemo(demo, estado));
        return;
    }
    // Amigos com um servidor de mentira (src/friends/demo.tsx): `?demo=amigos[&tela=home][&cartao=1|anon]`
    if (demo === 'amigos') {
        const params = new URLSearchParams(window.location.search);
        void import('../friends/demo').then((m) => m.startFriendsDemo(params));
        return;
    }
    if (demo === 'platina') {
        const p = store.profile;
        useGame.setState({
            profile: {
                ...p,
                missionsDone: [...new Set([...p.missionsDone, 'platina1'])],
                trainer: 'oakHolo',
                title: 'diplomaKanto',
            },
            unlockQueue: ['platina1'],
            screen: 'home',
        });
        return;
    }
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
    if (demo === 'lider') {
        const want = new URLSearchParams(window.location.search).get('clube') ?? 'ltsurge';
        for (let k = 0; k < 300; k++) {
            store.newRun('Demo FC', `lider${k}`);
            const run = useGame.getState().run!;
            const idx = run.opponents.findIndex((o) => clubLeader(o.name) === want);
            if (idx < 0) continue;
            const team = aiDraftTeam(new Rng(`lider${k}`, 'demo'), 2);
            // &formacao=4-0: o mesmo time em outra formação (clipes de comparação, docs/planos/formacoes.md)
            const f = new URLSearchParams(window.location.search).get('formacao');
            const ready = {
                ...run,
                opponents: [run.opponents[idx], ...run.opponents.filter((_, i) => i !== idx)],
                formation: f && f in FORMATIONS ? (f as FormationId) : ('1-2-1' as const),
                picks: [...team.lineup, ...team.bench],
                lineup: team.lineup.map((p) => p.uid),
                bench: team.bench.map((p) => p.uid),
                captainUid: team.captainUid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            // o rival tem que reagir logo (aviso do técnico antes dos 12')
            const r = runMatch(
                FUTSAL_5,
                playerTeam(ready),
                cupRival(ready.opponents[0], true),
                `${ready.seed}-stage-0`,
                {
                    snapshots: false,
                },
            );
            if (!r.events.some((e) => e.type === 'coach' && e.minute < 12)) continue;
            useGame.setState({ run: ready, screen: 'lineup' });
            console.info(`[demo] copa ${ready.seed}: contra ${ready.opponents[0].name}`);
            return;
        }
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
    // ?demo=mapa: Copa longa no mapa (`&meio=1`: já andou 5 linhas, com ₽, um cartão amarelo e 2 Patrocínios)
    // ?demo=evento&id=carrinho|patrocinador|capitao|olheiro|entrevista|perdido|treinoPuxado|creche
    if (demo === 'evento') {
        demoLongMap(store, true);
        const id = (new URLSearchParams(window.location.search).get('id') ?? 'carrinho') as EventId;
        const run = useGame.getState().run!;
        const event = rollEvent({ ...run, eventsSeen: EVENT_IDS.filter((x) => x !== id) });
        useGame.setState({ run: { ...run, status: 'event', event }, screen: 'event' });
        return;
    }
    // ?demo=grupo: Rota Índigo no Planalto, com a 1ª rodada do grupo jogada
    if (demo === 'grupo') {
        demoLongMap(store, false);
        const run = useGame.getState().run!;
        const last = run.map!.nodes.find((n) => n.row === run.map!.rows - 1)!;
        const results = [0, 1, 2, 3, 4].map((stage) => ({
            stage,
            opponent: 'Montanhistas',
            score: (stage === 4 ? [2, 2] : [3, 1]) as [number, number],
            shootout: stage === 4 ? ([4, 3] as [number, number]) : null,
            won: true,
            final: false,
        }));
        useGame.setState({ run: { ...run, at: last.id, status: 'treino', results, stage: 4, money: 22 } });
        useGame.getState().train('rest');
        return;
    }
    // ?demo=treino: casa de Treino da Rota (encher a evolução de alguém ou descansar, com o time cochilando)
    if (demo === 'treino') {
        demoLongMap(store, true);
        const run = useGame.getState().run!;
        useGame.setState({ run: { ...run, status: 'treino' }, screen: 'treino' });
        return;
    }
    if (demo === 'mapa') {
        demoLongMap(store, new URLSearchParams(window.location.search).has('meio'));
        return;
    }
    // ?demo=mercado: Mercado depois das quartas (demoShop)
    if (demo === 'mercado') {
        demoShop(store);
        return;
    }
    // ?demo=momentos: a mesma copa do campeão (cada partida travada como no jogo, então o gol da copa tem replay)
    // ?demo=fora: Rota na escalação com um reserva na Creche (2 partidas) e um titular machucado (1)
    if (demo === 'fora') {
        demoLongMap(store, true);
        const at = useGame.getState().run!;
        const next = at.map!.nodes.find(
            (n) => at.map!.nodes.find((x) => x.id === at.at)!.next.includes(n.id) && isMatchKind(n.kind),
        );
        if (!next) return;
        useGame.getState().enterNode(next.id);
        const run = useGame.getState().run!;
        const [creche] = run.bench;
        const hurt = run.lineup[3];
        useGame.setState({
            run: { ...run, out: { [creche]: 2, [hurt]: 1 }, outWhy: { [creche]: 'creche', [hurt]: 'lesao' } },
        });
        return;
    }
    // ?demo=eliminado&rota=1: a Rota no meio do mapa, já com um amarelo; o time fraco perde a próxima e cai
    // (`&amarelo=1`: sem cartão ainda, a derrota vira o 1º amarelo e volta pro mapa)
    if (demo === 'eliminado' && new URLSearchParams(window.location.search).get('rota') === '1') {
        demoLongMap(store, true);
        if (new URLSearchParams(window.location.search).has('amarelo'))
            useGame.setState({ run: { ...useGame.getState().run!, cards: 0 } });
        const at = useGame.getState().run!;
        const next = at.map!.nodes.find(
            (n) => at.map!.nodes.find((x) => x.id === at.at)!.next.includes(n.id) && n.kind === 'jogo',
        );
        if (!next) return;
        useGame.getState().enterNode(next.id);
        const rng = new Rng('rota-demo', 'demo');
        const lineup = [129, 10, 13, 16, 19].map((id) => createInstance(id, rng));
        const cur = useGame.getState().run!;
        useGame.setState({
            run: {
                ...cur,
                picks: [...lineup, ...cur.picks.filter((p) => cur.bench.includes(p.uid))],
                // o mapa do demo já traz um resultado nesta partida: sai, pra ela contar
                results: cur.results.filter((r) => r.stage < cur.stage),
                lineup: lineup.map((p) => p.uid),
                captainUid: lineup[4].uid,
            },
        });
        const run = useGame.getState().run!;
        const team = playerTeam(run);
        useGame.getState().lockMatch(team);
        const m = runMatch(FUTSAL_5, team, run.opponents[run.stage], `${run.seed}-stage-${run.stage}`);
        useGame.getState().recordResult(m);
        useGame.setState({ match: m, screen: 'result' });
        console.info(`[demo] rota: ${useGame.getState().run!.status}`);
        return;
    }
    // ?demo=eliminado: um time fraco que cai (tela de eliminado: "faltou pouco" e "Nova copa" na barra)
    if (demo === 'campeao' || demo === 'momentos' || demo === 'eliminado') {
        const lose = demo === 'eliminado';
        for (let k = 0; k < 40; k++) {
            store.newRun('Demo FC', `camp${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`camp${k}`, 'demo');
            // goleiro Snorlax, fixo Machamp, alas Mew e Aerodactyl, pivô Mewtwo; banco Dragonite e Pikachu
            const lineup = (lose ? [129, 10, 13, 16, 19] : [143, 68, 151, 142, 150]).map((id) =>
                createInstance(id, rng),
            );
            const bench = (lose ? [11, 14] : [149, 25]).map((id) => createInstance(id, rng));
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
                const team = playerTeam(cur);
                useGame.getState().lockMatch(team);
                m = runMatch(FUTSAL_5, team, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`);
                useGame.getState().recordResult(m);
                if (useGame.getState().run!.status !== 'reward') break;
                useGame.getState().skipReward();
                if (useGame.getState().run!.status === 'shop') useGame.getState().leaveShop();
            }
            if (useGame.getState().run!.status === (lose ? 'eliminated' : 'champion')) {
                useGame.setState({ match: m, screen: 'result' });
                console.info(`[demo] copa camp${k}: campeão`);
                return;
            }
        }
        return;
    }
    if (demo === 'vestiario') {
        for (let k = 0; k < 120; k++) {
            store.newRun('Demo FC', `vest${k}`);
            const run = useGame.getState().run!;
            const rng = new Rng(`vest${k}`, 'demo');
            // goleiro Onix, fixo Machamp, alas Arcanine e Wartortle, pivô Kabutops; banco Dragonair e Blastoise
            const lineup = [95, 68, 59, 8, 141].map((id) => createInstance(id, rng));
            const bench = [148, 9].map((id) => createInstance(id, rng));
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
            const team = { ...playerTeam(ready), manualSubs: true };
            const r = runMatch(FUTSAL_5, team, ready.opponents[0], `${ready.seed}-stage-0`, { snapshots: false });
            const ht = r.events.find((e) => e.type === 'halftime');
            if (!ht || !r.events.some((e) => e.type === 'sub' && e.team === 1 && e.tick === ht.tick)) continue;
            // partida já travada e salva perto do apito do intervalo: "Começar" retoma dali
            const live = { stage: 0, orders: [], tick: Math.max(0, ht.tick - 40), engine: ENGINE_VERSION };
            useGame.setState({ run: { ...ready, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] copa ${ready.seed}: intervalo no tick ${ht.tick} com troca do rival`);
            return;
        }
        return;
    }
    if (demo === 'acrescimos') {
        for (let k = 0; k < 120; k++) {
            store.newRun('Demo FC', `acr${k}`);
            const base = useGame.getState().run!;
            const rng = new Rng(`acr${k}`, 'demo');
            // time fraco (Geodude no gol, Rattata, Pidgey, Spearow, Ekans; banco Weedle e Caterpie): perde no fim
            const lineup = [74, 19, 16, 21, 23].map((id) => createInstance(id, rng));
            const bench = [13, 10].map((id) => createInstance(id, rng));
            const run = {
                ...base,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const team = { ...playerTeam(run), manualSubs: true };
            const r = runMatch(FUTSAL_5, team, run.opponents[0], `${run.seed}-stage-0`, { snapshots: false });
            const stop = r.events.find((e) => e.type === 'stoppage' && e.half === 2);
            const press = r.events.find((e) => e.type === 'pressure' && e.team === 0);
            if (!stop || !press || press.tick > stop.tick - 60) continue;
            const live = { stage: 0, orders: [], tick: stop.tick - 60, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: acréscimos do 2º tempo no tick ${stop.tick}`);
            return;
        }
        return;
    }
    if (demo === 'maximo') {
        const gk = new URLSearchParams(window.location.search).get('goleiro') === '1';
        for (let k = 0; k < 120; k++) {
            store.newRun('Demo FC', `max${k}`);
            const base = useGame.getState().run!;
            const rng = new Rng(`max${k}`, 'demo');
            // goleiro Snorlax, fixo Machamp, alas Gyarados e Pidgeot, pivô Dragonite; banco Onix e Pikachu
            const lineup = [143, 68, 130, 18, 149].map((id) => createInstance(id, rng));
            const bench = [95, 25].map((id) => createInstance(id, rng));
            const run = {
                ...base,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[gk ? 0 : 4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const team = { ...playerTeam(run), manualSubs: true };
            // a hora certa: barra cheia e o capitão com a bola na zona (ou o rival na zona do goleiro capitão)
            const live = new LiveRunner(FUTSAL_5, team, cupRival(run.opponents[0], true), `${run.seed}-stage-0`);
            const s = live.state;
            let at: number | null = null;
            while (!live.finished && at === null && s.tick < 6000) {
                live.step();
                const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
                const cap = s.players.find((p) => p.team === 0 && p.captain);
                if (s.phase !== 'play' || !owner || !cap || maxCharge(s.events, 0, s.tick).charge < 1) continue;
                if (gk ? owner.team === 1 && inMaxZoneOf(s, owner, 'GK') : owner === cap && inMaxZoneOf(s, cap))
                    at = s.tick;
            }
            if (at === null || at < 200) continue;
            const saved = { stage: 0, orders: [], tick: at - 40, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live: saved }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: golpe máximo na hora no tick ${at}`);
            return;
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
            // &defesa=1: em vez da disputa no alto, uma espalmada do goleiro que vira escanteio
            const parry = new URLSearchParams(window.location.search).get('defesa') === '1';
            const aerial = parry
                ? r.events.find(
                      (e, i) =>
                          e.type === 'save' &&
                          !e.caught &&
                          r.events.slice(i + 1).some((c) => c.type === 'corner' && c.tick - e.tick <= 80),
                  )
                : r.events.find((e) => e.type === 'aerial' && e.high && e.team === 0);
            if (aerial && aerial.tick < 1500) {
                useGame.setState({ run: ready, screen: 'lineup' });
                console.info(`[demo] copa ${ready.seed}: escanteio com disputa no alto no tick ${aerial.tick}`);
                return;
            }
        }
        return;
    }
    if (demo === 'evolucao') {
        const team = new URLSearchParams(window.location.search).get('rival') === '1' ? 1 : 0;
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
            const evo = r.events.find((e) => e.type === 'evolve' && e.team === team);
            if (evo && evo.tick < 2400) {
                useGame.setState({ run: ready, screen: 'lineup' });
                console.info(`[demo] copa ${ready.seed}: evolução do time ${team} no tick ${evo.tick}`);
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

/** Carreira de mentira pra ver medalhas, vitrine, escudo e uniforme (só no dev: sobrescreve o save do navegador). */
function demoCollection() {
    const g = useGame.getState();
    const dex: Record<number, import('../store/profile').DexEntry> = {};
    for (let id = 1; id <= 151; id++) {
        if (id % 5 === 4) continue; // ~120 vistos
        const played = id % 3 !== 0 || id <= 9 || [144, 145, 146, 133, 134, 135, 136].includes(id);
        dex[id] = {
            matches: played ? 4 + (id % 17) : 0,
            minutes: played ? 40 : 0,
            goals: played ? (id * 7) % 31 : 0,
            assists: 0,
            wins: played ? 3 : 0,
            titles: played && id % 4 === 1 ? 1 + (id % 6) : 0,
            bestRating: played ? 7 : 0,
            bestOvr: 70,
            editions: played ? 1 | (id % 9 === 0 ? 2 : 0) | (id % 4 === 0 ? 4 : 0) : undefined,
        };
    }
    const novo = new URLSearchParams(window.location.search).get('novo') === '1';
    useGame.setState({
        dex,
        records: {
            ...g.records,
            cups: 40,
            titles: 7,
            perfect: 0,
            evolucoes: 31,
            bestStreak: 3,
            icones: 2,
            destaques: 6,
            duelWins: 12,
        },
        career: { matches: 160, wins: 104, losses: 56, shootoutWins: 6, goalsFor: 640, goalsAgainst: 300 },
        profile: {
            ...g.profile,
            missionsDone: [
                ...new Set([
                    ...g.profile.missionsDone,
                    ...['colIniciais', 'colPassaros', 'colEevee', 'blue', 'acetrainer'],
                    // tarefas compridas: conferir no celular que o texto aparece inteiro
                    ...['erika', 'sabrina', 'lorelei', 'bugcatcher', 'channeler'],
                ]),
            ],
            ...(novo
                ? {
                      clubColor2: undefined,
                      kitPattern: undefined,
                      crestShape: undefined,
                      crestSymbol: undefined,
                      showcase: [],
                  }
                : {
                      clubColor: 'azul',
                      clubColor2: 'branco',
                      kitPattern: 'listras',
                      crestShape: 'escudo',
                      crestSymbol: 'coroa',
                      showcase: ['m:campeao', 'c:colPassaros', 's:6'],
                  }),
        },
    });
    g.go('profile');
}

/**
 * `?demo=sala`: a carreira do `?demo=colecao` com 9 títulos (taças de bronze, prata e ouro), 12 dias de Copa do Dia
 * (uma semana inteira) e 12 vitórias no Duelo, e abre a Sala de troféus (sala do clube, nível 2). `&titulos=0` deixa
 * a sala vazia (só silhuetas); `&titulos=30` vira a sala do estádio.
 */
function demoTrophyRoom() {
    demoCollection();
    const g = useGame.getState();
    const n = Number(new URLSearchParams(window.location.search).get('titulos') ?? 9);
    const day = 864e5;
    const hall = Array.from({ length: n }, (_, i) => ({
        id: `demo-${i}`,
        date: Date.now() - i * 3 * day,
        club: g.profile.clubName || 'Pallet FC',
        clubColor: g.profile.clubColor,
        formation: '2-2',
        titleNo: n - i,
        perfect: i % 4 === 0,
        ...(i % 4 === 2 && { mode: 'longa' as const }),
        scores: (i % 3 === 1
            ? [
                  [3, 1],
                  [2, 0],
                  [1, 0],
                  [4, 2],
              ]
            : [
                  [3, 1],
                  [2, 2],
                  [1, 0],
                  [4, 2],
              ]) as [number, number][],
        squad: [6, 9, 25, 143, 149].map((speciesId, k) => ({
            speciesId,
            shiny: k === 0 && i === 0,
            name: '',
            ovr: 80,
            goals: k,
            captain: k === i % 5,
        })),
    }));
    const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
    // segunda 12/10/2026 a domingo 18/10 inteira, e mais uns dias soltos
    const daily = [...Array.from({ length: 7 }, (_, i) => Date.UTC(2026, 9, 12 + i)), Date.UTC(2026, 9, 20)]
        .slice(0, n ? 8 : 0)
        .map((t, i) => ({
            day: iso(t),
            done: true,
            champion: i % 3 === 0,
            results: Array.from({ length: 4 }, (_, k) => ({
                score: [k < 2 + (i % 3) ? 2 : 0, 1] as [number, number],
                shootout: null,
                won: k < 2 + (i % 3),
                opponent: 'x',
            })),
        }));
    useGame.setState({
        hall,
        daily,
        records: { ...g.records, titles: n, perfect: hall.filter((h) => h.perfect).length, duelWins: n ? 12 : 0 },
    });
    g.go('trophies');
}

/**
 * `?demo=novidades`: a carreira do `?demo=colecao` com algumas coisas ainda não vistas (selo NOVO): treinadores e
 * títulos das missões, 3 medalhas, as coleções, 3 selos, 6 avatares, as peças do escudo e 4 figurinhas. Abre na
 * Home (o pontinho no botão do Perfil); `&perfil=<aba>` abre direto no Perfil.
 */
function demoNews() {
    demoCollection();
    const g = useGame.getState();
    const earned = earnedKeys(medalViewOf(g), g.profile);
    const left = new Set<string>();
    const take = (prefix: string, n = Infinity) =>
        earned
            .filter((k) => k.startsWith(prefix))
            .slice(0, n)
            .forEach((k) => {
                left.add(k);
            });
    take('tr:');
    take('ti:');
    take('md:', 3);
    take('col:');
    take('sl:', 3);
    take('av:', 6);
    take('kit:');
    take('fig:', 4);
    g.updateProfile({ seen: earned.filter((k) => !left.has(k)) });
    if (!new URLSearchParams(window.location.search).get('perfil')) g.go('home');
}

/**
 * `?demo=album` (ou `fichario`): álbum de cartas cheio (Ícones, Shiny, Evento por tipo, Destaque, combos, ×N), a
 * Pokédex com as figurinhas dessas cartas (Lapras com Normal, Shiny e Evento; uma figurinha de antes do álbum, sem
 * carta) e a vitrine com 3 cartas. `&cheio=1`: as 151 espécies com várias versões (pior caso do álbum).
 */
function demoBinder() {
    const rng = new Rng('demo-fichario');
    const ICON_IDS = [25, 6, 150, 94, 143, 149, 131, 65, 6, 6];
    let binder: BinderCard[] = [];
    const now = Date.now();
    const cards: PokemonInstance[] = [];
    // &cheio=1: as 151 espécies com 4 cartas cada (pra medir o álbum no pior caso)
    const full = new URLSearchParams(window.location.search).has('cheio');
    for (let i = 0; i < (full ? 604 : 140); i++) {
        const id = i < ICON_IDS.length ? ICON_IDS[i] : full ? 1 + (i % 151) : 1 + Math.floor(rng.next() * 151);
        let p: PokemonInstance = { ...createInstance(id, rng), uid: `demo-${i}`, shiny: false };
        const type = species(id).types.find((t) => EVENT_TYPES.includes(t));
        const special: Special | null =
            i < ICON_IDS.length
                ? { kind: 'icone', title: ICONS[id], ...(i % 3 === 0 && { level: 1 + (i % 3) + (i === 9 ? 1 : 0) }) }
                : i % 4 === 0 && type
                  ? { kind: 'evento', type }
                  : i % 5 === 0
                    ? { kind: 'destaque', level: 1 + (i % 3) }
                    : null;
        if (special) p = { ...p, special };
        if (i % 6 === 1 || i === 9) p = { ...p, shiny: true };
        cards.push(p);
    }
    // Lapras (Água/Gelo): Shiny e Evento de Gelo
    cards.push({ ...createInstance(131, rng), uid: 'demo-lapras-s', shiny: true });
    cards.push({
        ...createInstance(131, rng),
        uid: 'demo-lapras-e',
        shiny: false,
        special: { kind: 'evento', type: 'Ice' },
    });
    // Raridades: Lapras Shiny Evento; o caso do Triple M: Mew Destaque I guardado + a Ícone de antes do álbum (sem carta)
    cards.push({
        ...createInstance(131, rng),
        uid: 'demo-lapras-se',
        shiny: true,
        special: { kind: 'evento', type: 'Ice' },
    });
    cards.push({
        ...createInstance(151, rng),
        uid: 'demo-mew-d',
        shiny: false,
        special: { kind: 'destaque', level: 1 },
    });
    cards.forEach((p, i) => {
        binder = binderAdd(binder, [p], {
            from: (['draft', 'recompensa', 'evolucao', 'hall'] as const)[i % 4],
            at: now - i * 3_600_000,
            cup: `demo-${Math.floor(i / 7)}`,
            champ: i % 5 === 0,
        });
    });
    // Pokédex: as cartas jogaram (figurinha colada) + a Normal de quem jogou; Snorlax Destaque de antes do álbum
    const g = useGame.getState();
    const dex = { ...g.dex };
    const stick = (id: number, bits: number) => {
        const e = dex[id] ?? {
            matches: 3,
            minutes: 30,
            goals: 1,
            assists: 0,
            wins: 2,
            titles: 0,
            bestRating: 7,
            bestOvr: 70,
        };
        dex[id] = { ...e, matches: Math.max(1, e.matches), editions: (e.editions ?? 0) | bits };
    };
    for (const p of cards) stick(p.speciesId, editionBits(p) | EDITION_BIT.normal);
    stick(143, EDITION_BIT.destaque);
    stick(151, EDITION_BIT.icone);
    const pick = [...binder].sort((a, b) => b.n - a.n).slice(0, 3);
    useGame.setState({ binder, dex, profile: { ...g.profile, cardShowcase: pick.map((c) => c.id) } });
    const url = new URL(window.location.href);
    if (!url.searchParams.has('perfil')) {
        url.searchParams.set('perfil', 'album');
        window.history.replaceState(null, '', url);
    }
    g.go('profile');
}

/** ?demo=mercado: Mercado depois das quartas, com ₽12 guardados, 2 Patrocínios e a vitória por 3 a 0. */
function demoShop(store: ReturnType<typeof useGame.getState>) {
    store.newRun('Demo FC', 'mercado-demo');
    const run = useGame.getState().run!;
    const rng = new Rng('mercado-demo', 'demo');
    const lineup = [95, 7, 5, 25, 74].map((id) => createInstance(id, rng));
    const bench = [10, 92].map((id) => createInstance(id, rng));
    const result = (stage: number) => ({
        stage,
        opponent: run.opponents[stage].name,
        score: [3, 0] as [number, number],
        shootout: null,
        won: true,
        destaqueUid: null,
    });
    useGame.setState({
        run: {
            ...run,
            formation: '1-2-1',
            picks: [...lineup, ...bench],
            lineup: lineup.map((p) => p.uid),
            bench: bench.map((p) => p.uid),
            captainUid: lineup[2].uid,
            draftRound: 7,
            status: 'reward',
            stage: 1,
            results: [result(0), result(1)],
            rewards: [],
            money: 12,
            sponsors: ['silph', 'creche'],
        },
    });
    useGame.getState().skipReward();
    return;
}

/** ?demo=mapa: Copa longa com o time montado sozinho, parada no mapa. */
function demoLongMap(store: ReturnType<typeof useGame.getState>, middle: boolean) {
    store.newRun('Demo FC', 'mapa-demo', undefined, 'longa');
    useGame.getState().autoDraft();
    if (!middle) return;
    const run = useGame.getState().run!;
    const map = run.map!;
    // anda pelo primeiro caminho de cada casa até a linha 5 (sem jogar: só pra ver o mapa no meio)
    const path: string[] = [];
    let node = map.nodes.find((n) => n.row === 0)!;
    while (node.row < 5) {
        path.push(node.id);
        node = map.nodes.find((n) => n.id === node.next[node.next.length - 1])!;
    }
    const results = [0, 1, 2].map((stage) => ({
        stage,
        opponent: 'Montanhistas',
        score: (stage === 1 ? [1, 2] : [3, 1]) as [number, number],
        shootout: null,
        won: stage !== 1,
        final: false,
    }));
    useGame.setState({
        run: {
            ...run,
            at: path.at(-1)!,
            path,
            stage: 2,
            results,
            cards: 1,
            money: 18,
            sponsors: ['silph', 'cassino'],
            status: 'map',
        },
        screen: 'map',
    });
}
