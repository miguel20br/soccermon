import { type LinkAsk, useCloud } from '../cloud/cloud';
import type { SaveSummary } from '../cloud/reconcile-plan';
import { maxCharge } from '../engine/agency';
import { ENGINE_VERSION, FUTSAL_5 } from '../engine/config';
import { clubLeader, cupRival } from '../engine/cup';
import { isMatchKind, matchIndexOfRow } from '../engine/cup-map';
import { SPECIES, species } from '../engine/data';
import { aiDraftTeam } from '../engine/draft';
import type { Stone } from '../engine/evolution';
import { FORMATIONS, type FormationId } from '../engine/formations';
import { createInstance, type PokemonInstance } from '../engine/instance';
import { inMaxZoneOf } from '../engine/match';
import { rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { LiveRunner } from '../engine/runners/live-runner';
import { EVENT_TYPES, ICONS, type Special } from '../engine/specials';
import type { MatchOrder } from '../engine/state';
import { EventBus } from '../game/EventBus';
import { comemoracaoOf } from '../game/walkout-plan';
import { type BinderCard, binderAdd } from '../store/binder';
import { playerTeam, useGame } from '../store/game-store';
import { longRound } from '../store/long-cup';
import { type EventId, rollEvent } from '../store/long-events';
import { earnedKeys, medalViewOf } from '../store/news';
import { EDITION_BIT, editionBits } from '../store/profile';
import { type House, houseOf } from '../store/rota-map';
import { namedDribblesOf } from './match-view';
import { isTrailerScene, trailerPicks } from './trailer-scenes';

/**
 * Atalhos de desenvolvimento (no dev e nas prévias da Vercel, `__SMOKE__`; nunca em produção):`?demo=penaltis` monta uma copa cuja primeira
 * partida termina empatada e vai para os pênaltis, já na tela de escalação. `?demo=ditto` monta um time
 * com Ditto e Mew + Mewtwo (sinergia Gênese) cuja primeira partida tem combo. `?demo=evolucao` monta um time
 * de iniciais cuja primeira partida tem evolução do seu time logo no começo (`&rival=1`: do rival). `?demo=campeao` joga uma copa
 * inteira com um time forte e para na tela do título (`?demo=momentos` é a mesma: Melhores momentos e gol da copa). `?demo=mercado` abre o Mercado depois das quartas (₽, 2 Patrocínios; `&novos=1` com os 4 de 23/10, Charanga e Clube Formador à venda; `&novos=2` Olheiro e Preparador). `?demo=mt` abre a recompensa depois das oitavas com
 * uma MT do ginásio entre as 3 cartas (Charmeleon, Caterpie e cia. para testar quem aprende). `?demo=conta&tipo=levar|juntar|juntar1|copa|outra|guardada`
 * mostra a pergunta depois do login (com resumos de mentira; os botões só fecham) ou a copa guardada na tela inicial. `?demo=trailer&cena=<cena>&seed=<seed>[&gk=<id>]` abre na escalação a
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
 * (barra cheia, capitão Dragonite com a bola na zona); `&goleiro=1`: capitão Snorlax no gol (a bicuda, no chute do rival);
 * `&capitao=<id>`: outro pivô capitão (com `&nivel=3`: o efeito do tipo dele no N3, ex. 3 Grama, 68 Lutador; os 12 de
 * `MAX_SIGNATURE` têm a assinatura, ex. 149 Hyper Beam, 143 Pancada; com `&goleiro=1&nivel=3`, a bicuda N3).
 * `&k=N`: pula as N primeiras copas (outra jogada, se a primeira não acender). `&efeito=1`: só a jogada em que o golpe,
 * tocado assim que acende, pega quem bloqueia ou defende com o efeito do N1 (`&nivel=1&capitao=55`: a onda do Golduck).
 * `&gol=1`: só a jogada em que o golpe, perfeito e já na agenda, entra (sem tocar; as gravações do N3 por tipo); com
 * `&goleiro=1`, a bicuda perfeita na agenda num chute comum do rival (as gravações das bicudas N1, N2 e N3).
 * `?demo=dribles&tipo=lambreta|roleta|elastico` abre na escalação uma partida de um time de DRI alta (Pikachu,
 * Scyther, Persian, Jolteon, Mew) que, ao começar, está a 3 s desse drible com nome (`&n=1`: o segundo achado; `&k=N`:
 * procura a partir da copa N);
 * `&defesa=1`: a 3 s de uma defesa do goleiro rival (o mergulho com a poeirinha).
 * `?demo=monotipo&n=5|6|7` abre na escalação um time todo Água, com 0, 1 ou 2 reservas Água (selo e aura do monotipo).
 * `?demo=bicuda` abre na escalação uma partida que, ao começar, está a 3 s do duelo da bicuda (motor 21): o capitão
 * rival solta o N3 e o seu goleiro capitão segura (a cutscene com as falas e o gol). `&gk=` e `&atk=` escolhem o par
 * (nome ou número da Pokédex; padrão Charmander no gol e Charizard chutando), ex. `&gk=weedle&atk=wartortle`.
 * `?demo=charanga` abre na escalação uma partida com a Charanga de Pewter em que, ao começar, o rival está a 4 s de
 * abrir o placar (o aviso "A CHARANGA ENTROU" vem logo depois do gol).
 * `?demo=virada` abre na escalação uma partida que, ao começar, está a 4 s do gol que põe o seu time na frente no
 * 2º tempo. `&clube=<id>` (brock, misty, rocket…): contra o clube desse treinador (a música dele); `&pressao=1`: a
 * virada vem depois de o seu time entrar na Pressão final, e a partida abre 2 s antes dela (a música entra no trecho
 * `pressao` e fica nele até o apito, mesmo com o empate).
 */
let started = false;
const q0Of = () => new URLSearchParams(window.location.search);

export function runDevDemo() {
    if (!__SMOKE__ || started) return;
    // os testes (fumaça, revisão) ouvem os lances e pulam pro fim do tempo normal, com ou sem demo
    (window as unknown as { __soccermonBus?: typeof EventBus }).__soccermonBus = EventBus;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (
        demo !== 'penaltis' &&
        demo !== 'draft' &&
        demo !== 'ditto' &&
        demo !== 'monotipo' &&
        demo !== 'evolucao' &&
        demo !== 'campeao' &&
        demo !== 'eliminado' &&
        demo !== 'momentos' &&
        demo !== 'trailer' &&
        demo !== 'mt' &&
        demo !== 'mercado' &&
        demo !== 'mapa' &&
        demo !== 'as' &&
        demo !== 'planalto' &&
        demo !== 'treino' &&
        demo !== 'evento' &&
        demo !== 'pedra' &&
        demo !== 'grupo' &&
        demo !== 'rota-fim' &&
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
        demo !== 'dribles' &&
        demo !== 'acrescimos' &&
        demo !== 'maximo' &&
        demo !== 'bicuda' &&
        demo !== 'virada' &&
        demo !== 'charanga' &&
        demo !== 'sala' &&
        demo !== 'final' &&
        demo !== 'rota-titulo' &&
        demo !== 'insignia' &&
        demo !== 'estadio-campeao'
    )
        return;
    started = true;
    const store = useGame.getState();
    // ?demo=draft[&fase=capitao|vaga|opcoes]: o draft da Copa Relâmpago (formação em carrossel, 1 de 3)
    if (demo === 'draft') {
        const fase = new URLSearchParams(window.location.search).get('fase');
        store.newRun(store.profile.clubName || 'Pallet FC', 'demo-draft');
        const g = () => useGame.getState();
        if (fase) g().chooseFormation('1-2-1');
        if (fase === 'vaga' || fase === 'opcoes') g().pick(g().run!.options[0].uid, { zone: 'lineup', index: 1 });
        if (fase === 'opcoes') g().chooseSlot({ zone: 'lineup', index: 2 });
        g().go('draft');
        return;
    }
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
        // `&gk=95`: outro goleiro (a caça de lances do goleiro troca a vaga 0 igual)
        const gk = Number(params.get('gk'));
        if (gk >= 1 && gk <= 151) lineup[0] = createInstance(gk, new Rng(`gk-${seed}`, 'x'));
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
        let semAviso: number | null = null; // líder calmo (Erika) pode nunca avisar antes dos 12': usa a 1ª semente com ele
        for (let k = 0; k <= 300; k++) {
            if (k === 300 && semAviso === null) break;
            store.newRun('Demo FC', `lider${k === 300 ? semAviso : k}`);
            const run = useGame.getState().run!;
            const idx = run.opponents.findIndex((o) => clubLeader(o.name) === want);
            if (idx < 0) continue;
            const seedK = k === 300 ? semAviso : k;
            const team = aiDraftTeam(new Rng(`lider${seedK}`, 'demo'), 2);
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
            if (k < 300 && !r.events.some((e) => e.type === 'coach' && e.minute < 12)) {
                semAviso ??= k;
                continue;
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
    if (demo === 'monotipo') {
        const n = Number(new URLSearchParams(window.location.search).get('n') ?? 6);
        store.newRun('Demo FC', 'monotipo');
        const run = useGame.getState().run!;
        const rng = new Rng('monotipo', 'demo');
        // 1-2-1 todo Água: Lapras no gol, Blastoise fixo, Starmie e Golduck nas alas, Gyarados pivô
        const lineup = [131, 9, 121, 55, 130].map((id) => createInstance(id, rng));
        const bench = (n >= 7 ? [134, 87] : n === 6 ? [134, 25] : [25, 4]).map((id) => createInstance(id, rng));
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
            screen: 'lineup',
        });
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
        const event = rollEvent(run, id);
        useGame.setState({ run: { ...run, status: 'event', event }, screen: 'event' });
        return;
    }
    // ?demo=pedra&stone=trovao|agua|fogo|folha|lua: a pedra ganha num Jogo, com Eevee e Pikachu no banco
    // (`&mapa=1`: no começo do mapa, com a Pedra de Fogo à vista na Rota 1)
    if (demo === 'pedra') {
        const q = new URLSearchParams(window.location.search);
        demoLongMap(store, !q.has('mapa') && !q.has('rival'));
        const run = useGame.getState().run!;
        // `&rival=1`: o Jogo da Pedra de Fogo (Rota 1) vencido, no 1 de 3 do rival (com um que evolui com ela); dali
        // segue o caminho de verdade: o prêmio da casa, a tela da pedra e a evolução
        if (q.has('rival')) {
            const node = run.map!.nodes.find((n) => n.row === 0 && n.stone)!;
            useGame.getState().enterNode(node.id);
            const cur = useGame.getState().run!;
            const opp = cur.opponents[cur.stage];
            const rewards = rewardOptions(
                cur.seed,
                cur.stage,
                0,
                cur.picks,
                { name: opp.name, players: [...opp.lineup, ...opp.bench] },
                0,
                { key: `${node.id}-rival`, round: longRound(cur.stage), prize: 'pokemon', stone: node.stone },
            );
            const result = { stage: cur.stage, opponent: opp.name, score: [3, 1] as [number, number] };
            useGame.setState({
                run: {
                    ...cur,
                    status: 'reward',
                    rivalPick: true,
                    rewards,
                    results: [{ ...result, shootout: null, won: true, final: false }],
                },
                screen: 'reward',
            });
            return;
        }
        const add = [133, 25].map((sp) => ({
            ...createInstance(sp, new Rng('demo', `pedra-${sp}`)),
            uid: `demo-${sp}`,
        }));
        const leaving = run.bench.filter((u) => u && u !== run.captainUid).slice(0, 2);
        const team = {
            ...run,
            picks: [...run.picks.filter((p) => !leaving.includes(p.uid)), ...add],
            bench: run.bench.map((u) => (leaving.includes(u) ? add[leaving.indexOf(u)].uid : u)),
        };
        const stone = (q.get('stone') ?? 'trovao') as Stone;
        useGame.setState(
            q.has('mapa')
                ? { run: team }
                : { run: { ...team, status: 'event', event: { id: 'pedra', stone } }, screen: 'event' },
        );
        return;
    }
    // ?demo=grupo: Rota Índigo no Planalto, com a 1ª rodada do grupo jogada
    if (demo === 'grupo') {
        demoLongMap(store, false);
        const run = useGame.getState().run!;
        const last = run.map!.nodes.find((n) => n.row === run.map!.rows - 1 && n.kind === 'treino')!;
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
    // ?demo=rota-fim&venceu=1|0: a Rota Índigo na Final (8ª partida), jogada na hora: time forte (1) ou fraco (0).
    // Sai na tela de resultado de campeão ou de eliminado; dali dá pra testar Menu, Nova copa e Continuar.
    if (demo === 'rota-fim') {
        const venceu = new URLSearchParams(window.location.search).get('venceu') !== '0';
        demoLongMap(store, false);
        const run = useGame.getState().run!;
        const last = run.map!.nodes.find((n) => n.row === run.map!.rows - 1 && n.kind === 'treino')!;
        const results = [0, 1, 2, 3, 4, 5, 6].map((stage) => ({
            stage,
            opponent: 'Montanhistas',
            score: [3, 1] as [number, number],
            shootout: null,
            won: true,
            final: false,
        }));
        useGame.setState({ run: { ...run, at: last.id, status: 'treino', results, stage: 6, money: 22 } });
        useGame.getState().train('rest');
        useGame.getState().playNext();
        const rng = new Rng('rota-fim', 'demo');
        const lineup = (venceu ? [150, 149, 144, 145, 146] : [129, 10, 13, 16, 19]).map((id) =>
            createInstance(id, rng),
        );
        const cur = useGame.getState().run!;
        useGame.setState({
            run: {
                ...cur,
                picks: [...lineup, ...cur.picks.filter((p) => cur.bench.includes(p.uid))],
                lineup: lineup.map((p) => p.uid),
                captainUid: lineup[4].uid,
            },
        });
        // `&jogar=1`: para na escalação da Final, pra jogar a partida na tela
        if (new URLSearchParams(window.location.search).has('jogar')) return;
        const now = useGame.getState().run!;
        const team = playerTeam(now);
        useGame.getState().lockMatch(team);
        const m = runMatch(FUTSAL_5, team, now.opponents[now.stage], `${now.seed}-stage-${now.stage}`);
        useGame.getState().recordResult(m);
        useGame.setState({ match: m, screen: 'result' });
        console.info(`[demo] rota-fim: ${useGame.getState().run!.status}`);
        return;
    }
    // ?demo=treino: casa de Treino da Rota (encher a evolução de alguém ou descansar, com o time cochilando)
    // `&pronto=1`: ninguém evolui (Tauros, Lapras, Snorlax...): aparece o treino de técnica (1 de 2 itens)
    if (demo === 'treino') {
        demoLongMap(store, true);
        let run = useGame.getState().run!;
        if (new URLSearchParams(window.location.search).has('pronto')) {
            const ids = [128, 131, 143, 115, 123, 127, 142];
            const picks = run.picks.map((p, i) => ({ ...p, speciesId: ids[i % ids.length], item: null }));
            const last = run.map!.nodes.find((n) => n.row === run.map!.rows - 1 && n.kind === 'treino')!;
            run = { ...run, picks, at: last.id };
        }
        useGame.setState({ run: { ...run, status: 'treino' }, screen: 'treino' });
        return;
    }
    // `&fim=1`: na última linha de partida, com a última parada (Treino, Mercado do Planalto, Centro) aberta
    if (demo === 'mapa') {
        const q = new URLSearchParams(window.location.search);
        if (q.has('fim')) demoBefore(store, 'planalto');
        else demoLongMap(store, q.has('meio'));
        return;
    }
    // ?demo=as: o mapa largo com um Treinador Ás aberto (`&premio=1`: a recompensa dele, 1 de 3 cartas raras)
    // ?demo=planalto: o Mercado do Planalto (a última parada, antes do grupo)
    // A Zona Safari e o Cassino são eventos: `?demo=evento&id=safari` e `?demo=evento&id=cassino`.
    if (demo === 'as' || demo === 'planalto') {
        const target = demoBefore(store, demo);
        if (!target) return;
        if (demo === 'planalto') {
            useGame.getState().enterNode(target);
            return;
        }
        if (!new URLSearchParams(window.location.search).has('premio')) return;
        // venceu o Ás: o 1 de 3 do rival dispensado leva direto ao prêmio da casa
        useGame.getState().enterNode(target);
        const run = useGame.getState().run!;
        useGame.setState({
            run: {
                ...run,
                status: 'reward',
                rivalPick: true,
                rewards: [],
                results: [
                    ...run.results,
                    {
                        stage: run.stage,
                        opponent: 'Montanhistas',
                        score: [2, 1],
                        shootout: null,
                        won: true,
                        final: false,
                    },
                ],
            },
        });
        useGame.getState().skipReward();
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
    if (
        (demo === 'campeao' && !new URLSearchParams(window.location.search).has('taca')) ||
        demo === 'momentos' ||
        demo === 'eliminado'
    ) {
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
    // ?demo=final[&rota=1][&gol=pulo|giro|pose]: a Final (Relâmpago ou Rota) na escalação de um time forte; ao começar,
    // a 3 s do apito final (vencida: a taça curta, na Rota a invasão) ou, com `gol`, a 3 s de um gol seu de quem
    // comemora desse jeito (com a partícula do tipo, que só sai na Final)
    // ?demo=insignia[&lider=misty]: a insígnia batendo na volta pra Home (a 1ª vitória contra o líder), com o jingle
    if (demo === 'insignia') {
        const lider = q0Of().get('lider') ?? 'misty';
        const { profile } = useGame.getState();
        useGame.setState({
            profile: { ...profile, missionsDone: [...profile.missionsDone.filter((x) => x !== lider), lider] },
            unlockQueue: [lider],
            screen: 'home',
        });
        return;
    }
    // `?demo=campeao&taca=1` = a Final da Relâmpago; `?demo=rota-titulo` = a da Rota (a invasão)
    const q0 = new URLSearchParams(window.location.search);
    if (demo === 'final' || demo === 'rota-titulo' || (demo === 'campeao' && q0.has('taca'))) {
        const q = q0;
        const rota = q.get('rota') === '1' || demo === 'rota-titulo';
        const jeito = q.get('gol');
        for (let k = 0; k < 60; k++) {
            const seed = `fin${rota ? 'r' : ''}${k}`;
            const rng = new Rng(seed, 'demo');
            // Snorlax no gol, Machamp, Dragonite, Aerodactyl e Mewtwo capitão: um de cada jeito (pulo, pose, giro)
            const lineup = [143, 68, 149, 142, 150].map((id) => createInstance(id, rng));
            const bench = [25, 6].map((id) => createInstance(id, rng));
            if (rota) demoRotaFinal(store);
            else store.newRun('Demo FC', seed);
            const base = useGame.getState().run!;
            const last = rota ? base.stage : 3;
            const results = rota
                ? base.results
                : Array.from({ length: last }, (_, stage) => ({
                      stage,
                      opponent: base.opponents[stage]?.name ?? 'Montanhistas',
                      score: [3, 1] as [number, number],
                      shootout: null,
                      won: true,
                      final: false,
                  }));
            const run = {
                ...base,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                draftRound: 7,
                stage: last,
                results,
                status: 'lineup' as const,
            };
            if (!run.opponents[last]) continue;
            const team = { ...playerTeam(run), manualSubs: true };
            const r = runMatch(FUTSAL_5, team, cupRival(run.opponents[last], true), `${run.seed}-stage-${last}`, {
                snapshots: false,
            });
            if (r.winner !== 0 || r.shootout) continue;
            const end = r.events.find((e) => e.type === 'fulltime');
            const goal = jeito
                ? r.events.find(
                      (e) =>
                          e.type === 'goal' &&
                          e.team === 0 &&
                          !e.ownGoal &&
                          comemoracaoOf(r.roster[e.by]?.speciesId ?? 0) === jeito,
                  )
                : undefined;
            if (!end || (jeito && !goal)) continue;
            const at = (goal ?? end).tick - 60;
            const live = { stage: last, orders: [], tick: Math.max(1, at), engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] final ${seed}: ${goal ? `gol (${jeito})` : 'apito'} no tick ${at + 60}`);
            return;
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
    if (demo === 'dribles') {
        const q = new URLSearchParams(window.location.search);
        const tipo = q.get('tipo') ?? 'lambreta';
        const defesa = q.get('defesa') === '1';
        let skip = Number(q.get('n') ?? 0);
        const from = Number(q.get('k') ?? 0);
        for (let k = from; k < from + 200; k++) {
            store.newRun('Demo FC', `dri${k}`);
            const base = useGame.getState().run!;
            const rng = new Rng(`dri${k}`, 'demo');
            const lineup = [25, 123, 53, 135, 151].map((id) => createInstance(id, rng));
            const run = {
                ...base,
                formation: '1-2-1' as const,
                picks: lineup,
                lineup: lineup.map((p) => p.uid),
                bench: [],
                captainUid: lineup[4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const team = { ...playerTeam(run), manualSubs: true };
            const opp = run.opponents[0];
            const r = runMatch(FUTSAL_5, team, opp, `${run.seed}-stage-0`);
            // só no 1º tempo: no intervalo a copa refaz a partida com o que o técnico decidiu
            const ht = r.events.find((e) => e.type === 'halftime')?.tick ?? 0;
            const ok = (t: number) => t > 200 && t < ht;
            const tick = defesa
                ? r.events.find((e) => e.type === 'save' && ok(e.tick) && r.roster[e.by].team === 1)?.tick
                : namedDribblesOf(r, [team, opp]).find((d) => d.kind === tipo && ok(d.tick))?.tick;
            if (tick === undefined || skip-- > 0) continue;
            const live = { stage: 0, orders: [], tick: tick - 60, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: ${defesa ? 'defesa' : tipo} no tick ${tick}`);
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
        const q = new URLSearchParams(window.location.search);
        const gk = q.get('goleiro') === '1';
        // &nivel=N espera a barra chegar no gomo N (1 a 3)
        const nivel = Math.min(3, Math.max(1, Number(new URLSearchParams(window.location.search).get('nivel')) || 1));
        // &k=N pula as N primeiras copas (outra jogada pro mesmo capitão)
        const k0 = Number(new URLSearchParams(window.location.search).get('k')) || 0;
        // &defesa=1: o goleiro rival defende o golpe (espalma pra escanteio ou na trave); &counter=1 (com goleiro=1): o
        // rival solta o golpe máximo e o nosso goleiro capitão devolve com a bicuda. Os dois já vêm com o toque
        // perfeito na agenda (o lance é sempre o mesmo, sem depender do toque na tela)
        const defesa = q.get('defesa') === '1';
        const counter = gk && q.get('counter') === '1';
        // &gol=1: o golpe tocado na hora (perfeito, na agenda) entra (a gravação dos N3 por tipo); no gol, a bicuda
        // perfeita no chute comum do rival
        const gol = !defesa && !counter && q.get('gol') === '1';
        // a barra no nível pedido (com &gol=1, nele cravado: a gravação do N1 não pode sair N2)
        const lvOk = (lv: number) => (gol ? lv === nivel : lv >= nivel);
        for (let k = k0; k < k0 + (defesa || counter || gol ? 400 : 120); k++) {
            store.newRun('Demo FC', `max${k}`);
            const base = useGame.getState().run!;
            const rng = new Rng(`max${k}`, 'demo');
            // goleiro Snorlax, fixo Machamp, alas Gyarados e Pidgeot, pivô Dragonite; banco Onix e Pikachu
            const capId = Number(new URLSearchParams(window.location.search).get('capitao')) || 149;
            const lineup = [143, 68, 130, 18, capId].map((id) => createInstance(id, rng));
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
            let orders: MatchOrder[] = [];
            // o lance com o toque na agenda acaba como pedido (defesa do goleiro rival / bicuda do nosso)
            const check = (tick: number, from: number) => {
                const order: MatchOrder = { tick, team: 0, kind: 'max', q: 2 };
                const r = new LiveRunner(FUTSAL_5, team, cupRival(run.opponents[0], true), `${run.seed}-stage-0`, [
                    order,
                ]);
                while (!r.finished && r.state.tick < tick + 60) r.step();
                const ev = r.state.events.filter((e) => e.tick >= from);
                const capIdx = r.state.players.find((p) => p.team === 0 && p.captain)?.idx;
                const ok = counter
                    ? ev.some((e) => e.type === 'max' && e.phase === 'hit' && e.team === 0)
                    : gk && gol
                      ? ev.some((e) => e.type === 'max' && e.phase === 'hit' && e.team === 0) &&
                        !ev.some((e) => e.type === 'max' && e.phase === 'hit' && e.team === 1)
                      : gol
                        ? ev.some((e) => e.type === 'max' && e.phase === 'hit' && e.by === capIdx) &&
                          ev.some((e) => e.type === 'goal' && e.team === 0 && e.tick < tick + 60)
                        : ev.some((e) => e.type === 'save' && e.shooter === capIdx && !!e.parry);
                if (ok) orders = [order];
                return ok;
            };
            while (!live.finished && at === null && s.tick < 6000) {
                const seen = s.events.length;
                live.step();
                const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
                const cap = s.players.find((p) => p.team === 0 && p.captain);
                if (gk) {
                    // a bicuda: o chute do rival que o goleiro capitão alcança (a hora dela vai do chute até ele)
                    for (const e of s.events.slice(seen))
                        if (
                            e.type === 'gkReach' &&
                            e.by === cap?.idx &&
                            lvOk(maxCharge(s.events, 0, e.from, 5).level) &&
                            (gol
                                ? check(e.from + 1, e.from)
                                : !counter ||
                                  (s.events.some(
                                      (x) => x.type === 'max' && x.phase === 'hit' && x.team === 1 && x.tick === e.from,
                                  ) &&
                                      check(e.from + 1, e.from)))
                        )
                            at = e.from;
                    continue;
                }
                if (s.phase !== 'play' || !owner || !cap || !lvOk(maxCharge(s.events, 0, s.tick, 5).level)) continue;
                if (owner === cap && inMaxZoneOf(s, cap) && (!(defesa || gol) || check(s.tick, s.tick))) at = s.tick;
            }
            if (at === null || at < 200) continue;
            // &efeito=1: só a jogada em que o golpe tocado assim que o botão acende (nota fora) pega alguém com o efeito
            // do N1 (o teste toca na hora em que acende: o anel na câmera lenta deixaria o toque longe do `at`)
            if (q.get('efeito') === '1' && !gk) {
                const hits = (d: number) => {
                    const r = new LiveRunner(FUTSAL_5, team, cupRival(run.opponents[0], true), `${run.seed}-stage-0`);
                    while (r.state.tick < at + d && !r.finished) r.step();
                    const seen = r.state.events.length;
                    r.addOrder({ tick: r.state.tick, team: 0, kind: 'max', q: 0 });
                    for (let i = 0; i < 120 && !r.finished; i++) r.step();
                    return r.state.events
                        .slice(seen)
                        .some(
                            (e) =>
                                (e.type === 'status' && e.source === 'max') ||
                                (e.type === 'knockback' && e.moveId === 'surf'),
                        );
                };
                if (![0, 1, 2, 3].every(hits)) continue;
            }
            const saved = { stage: 0, orders, tick: at - 40, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live: saved }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: golpe máximo na hora no tick ${at}`);
            return;
        }
        return;
    }
    if (demo === 'bicuda') {
        const q = new URLSearchParams(window.location.search);
        const idOf = (v: string | null, fallback: number) =>
            Number(v) || SPECIES.find((sp) => sp.name.toLowerCase() === v?.toLowerCase())?.id || fallback;
        const gkId = idOf(q.get('gk'), 4);
        const atkId = idOf(q.get('atk'), 6);
        // o lance armado nem sempre acaba no duelo (Weedle x Wartortle virava gol na 0.9.39.1): tenta outras
        // sementes até o goleiro segurar sem gol antes (a 1ª é a de sempre)
        for (let k = 0; k < 20; k++) {
            const seed = `bicuda-${gkId}-${atkId}${k ? `-${k}` : ''}`;
            store.newRun('Demo FC', seed);
            const base = useGame.getState().run!;
            const rng = new Rng(seed, 'demo');
            // o seu goleiro capitão, fixo Machamp, alas Gyarados e Pidgeot, pivô Dragonite; banco Onix e Pikachu
            const lineup = [gkId, 68, 130, 18, 149].map((id) => createInstance(id, rng));
            const bench = [95, 25].map((id) => createInstance(id, rng));
            // o rival com o atacante escolhido de capitão, no lugar do pivô (a última vaga)
            const opp = base.opponents[0];
            const atk = createInstance(atkId, rng);
            const rival = {
                ...opp,
                lineup: opp.lineup.map((p, i) => (i === opp.lineup.length - 1 ? atk : p)),
                captainUid: atk.uid,
            };
            const run = {
                ...base,
                opponents: [rival, ...base.opponents.slice(1)],
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[0].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const at = 300;
            const team = { ...playerTeam(run), manualSubs: true, demoBicudaAt: at };
            const r = runMatch(FUTSAL_5, team, cupRival(run.opponents[0], true), `${run.seed}-stage-0`, {
                snapshots: false,
            });
            const duel = r.events.find((e) => e.type === 'showdown');
            const early = r.events.some((e) => e.type === 'goal' && e.tick < (duel?.tick ?? 0));
            if ((!duel || early) && k < 19) continue;
            const saved = { stage: 0, orders: [], tick: at - 60, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live: saved }, screen: 'lineup' });
            console.info(
                `[demo] bicuda: ${species(gkId).name} no gol x ${species(atkId).name}, duelo no tick ${duel?.tick ?? '-'}`,
            );
            return;
        }
        return;
    }
    if (demo === 'charanga') {
        for (let k = 0; k < 200; k++) {
            store.newRun('Demo FC', `cha${k}`);
            const base = useGame.getState().run!;
            const rng = new Rng(`cha${k}`, 'demo');
            // o time médio da virada, com a Charanga e mais 2 Patrocínios de campo novos
            const lineup = [95, 67, 77, 8, 33].map((id) => createInstance(id, rng));
            const bench = [17, 2].map((id) => createInstance(id, rng));
            const run = {
                ...base,
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                sponsors: ['charanga', 'preparador', 'formador'],
                draftRound: 7,
                status: 'lineup' as const,
            };
            const team = { ...playerTeam(run), manualSubs: true };
            const rival = cupRival(run.opponents[0], true);
            const r = runMatch(FUTSAL_5, team, rival, `${run.seed}-stage-0`, { snapshots: false });
            const goal = r.events.find((e) => e.type === 'goal');
            if (goal?.type !== 'goal' || goal.team !== 1 || goal.tick < 200) continue;
            const live = { stage: 0, orders: [], tick: goal.tick - 80, engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: o rival abre o placar no tick ${goal.tick}`);
            return;
        }
        return;
    }
    if (demo === 'virada') {
        const q = new URLSearchParams(window.location.search);
        const clube = q.get('clube');
        const pressao = q.get('pressao') === '1';
        for (let k = 0; k < 300; k++) {
            store.newRun('Demo FC', `vir${k}`);
            const base = useGame.getState().run!;
            const idx = clube ? base.opponents.findIndex((o) => clubLeader(o.name) === clube) : 0;
            if (idx < 0) continue;
            const rng = new Rng(`vir${k}`, 'demo');
            // time médio (Onix no gol, Machoke, Ponyta, Wartortle, Nidorino; banco Pidgeotto e Ivysaur)
            const lineup = [95, 67, 77, 8, 33].map((id) => createInstance(id, rng));
            const bench = [17, 2].map((id) => createInstance(id, rng));
            const run = {
                ...base,
                opponents: [base.opponents[idx], ...base.opponents.filter((_, i) => i !== idx)],
                formation: '1-2-1' as const,
                picks: [...lineup, ...bench],
                lineup: lineup.map((p) => p.uid),
                bench: bench.map((p) => p.uid),
                captainUid: lineup[4].uid,
                draftRound: 7,
                status: 'lineup' as const,
            };
            const team = { ...playerTeam(run), manualSubs: true };
            const rival = cupRival(run.opponents[0], true); // como a partida de verdade (o líder no banco)
            const r = runMatch(FUTSAL_5, team, rival, `${run.seed}-stage-0`, { snapshots: false });
            const ht = r.events.find((e) => e.type === 'halftime');
            const press = r.events.find((e) => e.type === 'pressure' && e.team === 0);
            const goal = r.events.find(
                (e) =>
                    e.type === 'goal' &&
                    e.team === 0 &&
                    e.tick > (ht?.tick ?? Infinity) &&
                    e.score[0] === e.score[1] + 1 &&
                    (!pressao || (press !== undefined && press.tick < e.tick)),
            );
            if (!ht || !goal) continue;
            const from = pressao && press ? press.tick - 40 : goal.tick - 80;
            const live = { stage: 0, orders: [], tick: Math.max(ht.tick + 1, from), engine: ENGINE_VERSION };
            useGame.setState({ run: { ...run, lockedTeam: team, live }, screen: 'lineup' });
            console.info(`[demo] copa ${run.seed}: gol da virada no tick ${goal.tick}`);
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
    // &novos=2: os outros 2 à venda (Charanga e Clube Formador nas vagas, Olheiro e Preparador na vitrine)
    const novosArg = new URLSearchParams(window.location.search).get('novos');
    const novos = novosArg !== null;
    const pairs = [
        ['olheiro', 'preparador'],
        ['charanga', 'formador'],
    ] as const;
    const [slots, onSale] = novosArg === '2' ? [pairs[1], pairs[0]] : pairs;
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
            sponsors: novos ? [...slots] : ['silph', 'creche'],
        },
    });
    useGame.getState().skipReward();
    // &novos=1: os Patrocínios de 23/10 (Olheiro e Preparador nas vagas, Charanga e Clube Formador na vitrine)
    const shop = novos ? useGame.getState().run?.shop : null;
    if (shop) {
        const ids = onSale;
        let k = 0;
        const offers = shop.offers.map((o) => (o.kind === 'sponsor' ? { ...o, id: ids[k++ % 2] } : o));
        useGame.setState({ run: { ...useGame.getState().run!, money: 24, shop: { ...shop, offers } } });
    }
}

/** ?demo=mapa: Copa longa com o time montado sozinho, parada no mapa. */
/**
 * Mapa largo: o time numa casa de onde dá pra entrar na primeira casa desse tipo (a de linha mais alta, pra ver o mapa
 * andado), com as partidas de antes vencidas. Devolve a casa.
 */
function demoBefore(store: ReturnType<typeof useGame.getState>, house: House): string | undefined {
    demoLongMap(store, false);
    const run = useGame.getState().run!;
    const nodes = run.map!.nodes;
    const target = nodes.filter((n) => houseOf(n) === house && n.row > 0).sort((a, b) => b.row - a.row)[0];
    if (!target) return undefined;
    // o caminho de volta até a 1ª linha (qualquer casa que liga na de cima)
    const path: string[] = [];
    let at = target;
    while (at.row > 0) {
        const prev = nodes.find((n) => n.next.includes(at.id))!;
        path.unshift(prev.id);
        at = prev;
    }
    const played = matchIndexOfRow(target.row);
    const results = Array.from({ length: played }, (_, stage) => ({
        stage,
        opponent: 'Montanhistas',
        score: [3, 1] as [number, number],
        shootout: null,
        won: true,
        final: false,
    }));
    useGame.setState({
        run: { ...run, at: path.at(-1)!, path, stage: Math.max(0, played - 1), results, money: 24, status: 'map' },
        screen: 'map',
    });
    return target.id;
}

/** A Rota parada na escalação da Final (o mapa de sempre, os 7 jogos vencidos e o descanso antes). */
function demoRotaFinal(store: ReturnType<typeof useGame.getState>) {
    demoLongMap(store, false);
    const run = useGame.getState().run!;
    const last = run.map!.nodes.find((n) => n.row === run.map!.rows - 1 && n.kind === 'treino')!;
    const results = [0, 1, 2, 3, 4, 5, 6].map((stage) => ({
        stage,
        opponent: 'Montanhistas',
        score: [3, 1] as [number, number],
        shootout: null,
        won: true,
        final: false,
    }));
    useGame.setState({ run: { ...run, at: last.id, status: 'treino', results, stage: 6, money: 22 } });
    useGame.getState().train('rest');
    useGame.getState().playNext();
}

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
    // as linhas 0 a 4 têm 2 partidas (a 2ª foi o amarelo): com 3 resultados a barra dizia "Partida 4" e a casa era a 3ª
    const results = [0, 1].map((stage) => ({
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
            stage: 1,
            results,
            cards: 1,
            money: 18,
            sponsors: ['silph', 'cassino'],
            status: 'map',
        },
        screen: 'map',
    });
}
