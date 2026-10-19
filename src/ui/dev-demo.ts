import { type LinkAsk, useCloud } from '../cloud/cloud';
import type { SaveSummary } from '../cloud/reconcile-plan';
import { ENGINE_VERSION, FUTSAL_5 } from '../engine/config';
import { clubLeader, cupRival } from '../engine/cup';
import { species } from '../engine/data';
import { aiDraftTeam } from '../engine/draft';
import { createInstance, type PokemonInstance } from '../engine/instance';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { EVENT_TYPES, ICONS, type Special } from '../engine/specials';
import { EventBus } from '../game/EventBus';
import { type BinderCard, binderAdd } from '../store/binder';
import { playerTeam, useGame } from '../store/game-store';
import { EDITION_BIT, editionBits } from '../store/profile';
import { agencyOn } from './settings-sync';
import { isTrailerScene, trailerPicks } from './trailer-scenes';

/**
 * Atalhos de desenvolvimento (só em `npm run dev`): `?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação. `?demo=ditto` monta um time
 * com Ditto e Mew + Mewtwo (sinergia Gênese) cuja primeira partida tem combo. `?demo=evolucao` monta um time
 * de iniciais cuja primeira partida tem evolução do seu time logo no começo (`&rival=1`: do rival). `?demo=campeao` joga uma copa
 * inteira com um time forte e para na tela do título (`?demo=momentos` é a mesma: Melhores momentos e gol da copa). `?demo=mt` abre a recompensa depois das oitavas com
 * uma MT do ginásio entre as 3 cartas (Charmeleon, Caterpie e cia. para testar quem aprende). `?demo=conta&tipo=levar|juntar|juntar1|copa|outra|guardada`
 * mostra a pergunta depois do login (com resumos de mentira; os botões só fecham) ou a copa guardada na tela inicial. `?demo=trailer&cena=<cena>&seed=<seed>` abre na escalação a
 * partida que a caça de lances (scripts/trailer-hunt.ts) escolheu para o trailer. `?demo=escanteio` monta um time de
 * grandalhões cuja primeira partida tem escanteio seu com disputa no alto logo no começo. `?demo=colecao` põe no save uma
 * carreira de mentira (medalhas em vários degraus, coleções, selos, escudo e uniforme listrado, vitrine cheia) e abre o
 * Perfil (`&perfil=medalhas` abre na aba); `&novo=1` deixa o clube no padrão (pra ver o editor do zero). `?demo=fichario`
 * enche o fichário (edições, Shiny, campeãs, cartas comuns), escolhe 3 pra vitrine e abre o Perfil na aba Fichário.
 * `?demo=lider&clube=<id>` (brock,
 * misty, ltsurge, erika, koga, sabrina, blaine, giovanni, agatha, lance) põe o clube desse treinador na primeira
 * partida (VERSUS com a fala, a quadra do ginásio); com `&agencia=1`, uma partida em que o rival reage cedo.
 * `?demo=platina` libera a
 * platina da Gen 1 sem platinar (Prof. Carvalho holográfico e Diploma de Kanto, já escolhidos) e mostra o aviso na Home.
 * `?demo=vestiario` abre na
 * escalação uma partida que, ao começar, já está a 2 s do intervalo, com 2 no banco e troca do rival no intervalo (o
 * vestiário: várias trocas, desfazer e "O rival trocou").
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
        demo !== 'momentos' &&
        demo !== 'trailer' &&
        demo !== 'mt' &&
        demo !== 'escanteio' &&
        demo !== 'conta' &&
        demo !== 'lider' &&
        demo !== 'colecao' &&
        demo !== 'fichario' &&
        demo !== 'album' &&
        demo !== 'dia' &&
        demo !== 'liga' &&
        demo !== 'platina' &&
        demo !== 'vestiario'
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
        const agency = agencyOn();
        for (let k = 0; k < 300; k++) {
            store.newRun('Demo FC', `lider${k}`);
            const run = useGame.getState().run!;
            const idx = run.opponents.findIndex((o) => clubLeader(o.name) === want);
            if (idx < 0) continue;
            const team = aiDraftTeam(new Rng(`lider${k}`, 'demo'), 2);
            const ready = {
                ...run,
                opponents: [run.opponents[idx], ...run.opponents.filter((_, i) => i !== idx)],
                formation: '1-2-1' as const,
                picks: [...team.lineup, ...team.bench],
                lineup: team.lineup.map((p) => p.uid),
                bench: team.bench.map((p) => p.uid),
                captainUid: team.captainUid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            if (agency) {
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
            }
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
    // ?demo=momentos: a mesma copa do campeão (cada partida travada como no jogo, então o gol da copa tem replay)
    if (demo === 'campeao' || demo === 'momentos') {
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
                const team = playerTeam(cur);
                useGame.getState().lockMatch(team);
                m = runMatch(FUTSAL_5, team, cur.opponents[cur.stage], `${cur.seed}-stage-${cur.stage}`);
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
 * `?demo=album` (ou `fichario`): álbum de cartas cheio (Ícones, Shiny, Evento por tipo, Destaque, combos, ×N), a
 * Pokédex com as figurinhas dessas cartas (Lapras com Normal, Shiny e Evento; uma figurinha de antes do álbum, sem
 * carta) e a vitrine com 3 cartas.
 */
function demoBinder() {
    const rng = new Rng('demo-fichario');
    const ICON_IDS = [25, 6, 150, 94, 143, 149, 131, 65, 6, 6];
    let binder: BinderCard[] = [];
    const now = Date.now();
    const cards: PokemonInstance[] = [];
    for (let i = 0; i < 140; i++) {
        const id = i < ICON_IDS.length ? ICON_IDS[i] : 1 + Math.floor(rng.next() * 151);
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
    const pick = [...binder].sort((a, b) => b.n - a.n).slice(0, 3);
    useGame.setState({ binder, dex, profile: { ...g.profile, cardShowcase: pick.map((c) => c.id) } });
    const url = new URL(window.location.href);
    if (!url.searchParams.has('perfil')) {
        url.searchParams.set('perfil', 'album');
        window.history.replaceState(null, '', url);
    }
    g.go('profile');
}
