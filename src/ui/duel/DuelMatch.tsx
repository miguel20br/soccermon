import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    type CornerOrder,
    type CornerPlan,
    isCornerOrder,
    isLineupOrder,
    isTacticOrder,
    type LineupOrder,
    type MatchEvent,
    SNAP_STRIDE,
    type Tactic,
    type TacticChange,
} from '../../engine/state';
import { skinOf } from '../../game/animation-manager';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { formationText } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import {
    canUnorder,
    DUEL_SPEEDS,
    duelNames,
    duelPace,
    duelTags,
    isSubStamped,
    leadTicks,
    logVersion,
    type OrderBody,
    onFieldAfter,
    ordersOf,
    other,
    type Role,
    SIDE,
    SPEED_ASK_MS,
    trainerNames,
} from '../../net/duel-state';
import { baseSeedOf, holdTick, openedSegments } from '../../net/seal';
import { duel, roomNow, useDuel } from '../../net/session';
import { PhaserGame } from '../../PhaserGame';
import { fieldKit, lookOfPeer, matchLooks } from '../../store/club-kit';
import type { ChanceSpeed, PlaybackSpeed } from '../../store/game-store';
import { useGame } from '../../store/game-store';
import { frameTier, parseShowcase } from '../../store/medals';
import type { TrainerId } from '../../store/missions';
import { rivalColor } from '../../store/profile';
import { Commentator, type CommentLine } from '../commentary';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HalftimePanel, rivalHtSubs } from '../components/HalftimePanel';
import { MatchHighlight } from '../components/MatchHighlight';
import {
    type Clock,
    type CoachTab,
    CoachTabs,
    FinalBanner,
    HudIcon,
    hex,
    MatchFeed,
    PressureBar,
    ResultButton,
    Scoreboard,
    subSuggestion,
    TacticControls,
    TIRED_HINT,
    Ticker,
    useAutoResult,
    useClockParts,
    useCoachTab,
} from '../components/MatchHud';
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { type BoardPlan, Prancheta, useMedia, WIDE } from '../components/Prancheta';
import { agencyView, MaxBars, PenaltyOrderPanel, SidelineControls, SidelineOverlay } from '../components/Sideline';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { captainAt, clockExtrasAt, roleAt, snapAt } from '../match-view';
import { bannerText, peerAvatar, peerTitle } from '../profile/club';
import { peerInfo, usePlayerCard } from '../profile/PlayerCard';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';
import { EmoteBar, EmoteBubbles } from './Emotes';
import { ReadyBar } from './ReadyBar';

/** Segundos que faltam até `at` (relógio da sala), atualizando sozinho. */
export function useCountdown(at: number | undefined): number {
    const [, force] = useState(0);
    useEffect(() => {
        if (at === undefined) return;
        const id = window.setInterval(() => force((n) => n + 1), 250);
        return () => clearInterval(id);
    }, [at]);
    return at === undefined ? 0 : Math.max(0, Math.ceil((at - roomNow()) / 1000));
}

/**
 * Partida do duelo: a mesma partida nas duas telas. A seed sai dos lacres, as ordens dos dois vêm do log carimbado
 * (cada mudança resimula, igual à tática ao vivo da copa), o host é o relógio e não existe pausa nem "pular pro fim".
 */
export function DuelMatch({ onSeeResult }: { onSeeResult: () => void }) {
    const s = useDuel((st) => st.shared)!;
    const role = useDuel((st) => st.role)!;
    const segSeeds = useDuel((st) => st.segSeeds);
    /** Quantas seeds de trecho a partida na tela já usa (a tela não passa do fim do último). */
    const [simSeeds, setSimSeeds] = useState(0);
    const online = useDuel((st) => st.online);
    const suspect = useDuel((st) => st.suspect);
    const stall = useDuel((st) => st.stall);
    const { settings } = useGame();
    const { t } = useT();
    const side = SIDE[role];
    const rivalRole = other(role);
    const rivalPeer = s.peers[rivalRole];
    const rivalName = trainerNames(s)[SIDE[rivalRole]];
    const home = s.teams.host!;
    const away = s.teams.guest!;
    const setups: [typeof home, typeof away] = [home, away];
    const myTeam = setups[side];

    const [match, setMatch] = useState<MatchResult | null>(null);
    /** Versão do log (`logVersion`) que a partida na tela já tem. */
    const simLog = useRef(-1);
    const [simCount, setSimCount] = useState(-1);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    const [sceneReady, setSceneReady] = useState(false);
    /** "Tentar de novo" do VERSUS: remonta a quadra que não carregou. */
    const [sceneKey, setSceneKey] = useState(0);
    const [fontsReady, setFontsReady] = useState(false);
    const [kicked, setKicked] = useState(() => roomNow() >= (s.kickoffAt ?? 0));
    const [halftime, setHalftime] = useState(false);
    const [ended, setEnded] = useState(false);
    const [subsDone, setSubsDone] = useState<string[]>([]);
    const [subOut, setSubOut] = useState<{ uid: string } | null>(null);
    const [lines, setLines] = useState<(CommentLine & { id: number })[]>([]);
    const lineId = useRef(0);
    // painel do técnico: no desktop a Tática fica embaixo da quadra e as abas abrem na Prancheta
    const wide = useMedia(WIDE);
    const tabs: CoachTab[] = wide ? ['board', 'team', 'feed'] : ['tactic', 'board', 'team', 'feed'];
    const [tab, setTab] = useCoachTab(tabs, wide ? 'board' : 'tactic');
    /** Celular: os emotes abrem por cima da barra de baixo. */
    const [emotesOpen, setEmotesOpen] = useState(false);
    const [fulltime, setFulltime] = useState(false);
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    /** Beira da quadra: painel da ordem dos pênaltis aberto. */
    const [pensOpen, setPensOpen] = useState(false);
    const tickRef = useRef(0);
    const scoreboardRef = useRef<HTMLDivElement>(null);
    const halftimeRef = useRef<HTMLDivElement>(null);
    const coachRef = useRef<HTMLDivElement>(null);
    // como na copa: celular deitado deixa o placar no topo (a quadra cabe inteira) e o intervalo vem pra tela;
    // o placar só existe depois que a partida chega (antes é o "preparando")
    const hasMatch = !!match;
    useEffect(() => {
        if (!hasMatch || !window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches) return;
        const id = requestAnimationFrame(() => scoreboardRef.current?.scrollIntoView({ block: 'start' }));
        return () => cancelAnimationFrame(id);
    }, [hasMatch]);

    // cores: o seu clube no seu lado, o rival no uniforme reserva se bater
    const mine = myTeam.color;
    const theirs = rivalColor(mine, setups[side === 0 ? 1 : 0].color);
    const colors: [number, number] = side === 0 ? [mine, theirs] : [theirs, mine];
    // escudo e uniforme de cada um (vêm no perfil da sala); o rival no reserva se as cores baterem, como na copa
    const myLook = { ...lookOfPeer(s.peers[role] ?? { clubColor: mine }), color: mine };
    const looks = matchLooks(myLook, lookOfPeer(rivalPeer ?? { clubColor: theirs }), side);
    // clubes com o mesmo nome: o placar e a narração usam o nome do treinador
    const teamNames = duelNames(s);

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    useEffect(() => {
        let alive = true;
        Promise.all([document.fonts.load('10px Galmuri11'), document.fonts.load('bold 10px Galmuri11')])
            .catch(() => {})
            .finally(() => alive && setFontsReady(true));
        return () => {
            alive = false;
        };
    }, []);

    // resimula a cada ordem nova no log (as duas telas com o mesmo log = a mesma partida)
    const logLen = logVersion(s);
    // biome-ignore lint/correctness/useExhaustiveDependencies: a versão do log só sobe; ela diz quando mudou
    useEffect(() => {
        if (!segSeeds?.length) return;
        let alive = true;
        const seeds = segSeeds;
        const log = s.log;
        const last = log.at(-1);
        // ordem nova: não passa dela enquanto a partida nova não chega (trecho novo não precisa: a trava do trecho
        // segura). Troca desfeita no intervalo: a tela está parada nele
        if (last && match && logLen > simLog.current) EventBus.emit('match:hold', last.tick);
        // seed por trecho: cada trecho aberto pelos dois muda a sorte dali pra frente (o passado não muda)
        simulateMatch(home, away, baseSeedOf(s.room, s.game), ordersOf(log), seeds)
            .then((r) => {
                if (!alive) return;
                duel.result = r;
                duel.resultOrders = log;
                duel.resultSeeds = seeds.length;
                simLog.current = logLen;
                setSimCount(logLen);
                setSimSeeds(seeds.length);
                setMatch((prev) => {
                    if (prev) EventBus.emit('match:replace', r);
                    return r;
                });
            })
            .catch(() => {
                if (alive) EventBus.emit('match:hold', Number.POSITIVE_INFINITY);
            });
        return () => {
            alive = false;
        };
    }, [segSeeds, logLen]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena só lê os dados na montagem; o resto vem por eventos
    const sceneData = useMemo<MatchSceneData | null>(
        () =>
            match
                ? {
                      result: match,
                      colors,
                      cries: settings.cries,
                      speed: s.speed,
                      pace: duelPace(s),
                      // cada um com a sua faixa (vem no perfil de quem entrou na sala)
                      banners: [s.peers.host, s.peers.guest].map((p) =>
                          p ? bannerText(p.banner, p.clubName) : null,
                      ) as [string | null, string | null],
                      kits: [fieldKit(looks[0]), fieldKit(looks[1])],
                      // efeitos e a queda nas chances iguais pros dois: a chance de gol fica na velocidade da sala
                      cinematic: true,
                      namesOnField: settings.namesOnField,
                      arrowSize: settings.arrowSize,
                      chanceSpeed: (typeof s.speed === 'number' ? s.speed : 1) as ChanceSpeed,
                      reduceMotion: reduceMotionOn(settings.reduceMotion),
                      extraSpecies: [...home.bench, ...away.bench].map((p) => skinOf(p.speciesId, p.shiny)),
                      startPaused: true,
                      mine: side,
                      duel: true,
                  }
                : null,
        [match?.seed],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: a narração é criada uma vez por partida
    useEffect(() => {
        if (!match) return;
        const commentator = new Commentator(match, teamNames);
        const onEvent = (e: MatchEvent) => {
            if (e.type === 'sub' && e.team === side) setSubsDone((prev) => [...prev, e.inUid]);
            if (e.type === 'penalty') setShootout(e.shootout);
            if (e.type === 'fulltime') {
                // apito final: nada de velocidade nem troca (o painel aberto fecha)
                setFulltime(true);
                setSubOut(null);
            }
            const line = commentator.lineFor(e);
            if (line) setLines((prev) => [{ ...line, id: lineId.current++ }, ...prev].slice(0, 200));
        };
        const onTick = (c: Clock) => {
            tickRef.current = c.tick;
            duel.tick = c.tick;
            duel.minute = c.minute;
            setClock(c);
        };
        const onEnded = () => {
            setEnded(true);
            setHalftime(false);
            duel.playing = false;
            if (duel.result) duel.ended(duel.result);
        };
        const onHalftime = () => {
            setHalftime(true);
            duel.dispatch({ k: 'atHalftime' });
        };
        const onReady = () => setSceneReady(true);
        EventBus.on('current-scene-ready', onReady);
        EventBus.on('match:event', onEvent);
        EventBus.on('match:tick', onTick);
        EventBus.on('match:ended', onEnded);
        EventBus.on('match:halftime', onHalftime);
        return () => {
            EventBus.off('match:halftime', onHalftime);
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [match?.seed]);

    // apito: na hora marcada pela sala, igual pros dois (quem volta depois começa direto e o relógio acerta)
    useEffect(() => {
        if (!sceneReady || kicked) return;
        const id = window.setInterval(() => {
            if (roomNow() >= (s.kickoffAt ?? 0)) setKicked(true);
        }, 100);
        return () => clearInterval(id);
    }, [sceneReady, kicked, s.kickoffAt]);
    useEffect(() => {
        if (sceneReady && kicked) EventBus.emit('match:resume');
    }, [sceneReady, kicked]);

    // o relógio do host só corrige com a bola rolando
    useEffect(() => {
        duel.playing = sceneReady && kicked && !halftime && !ended;
        if (!duel.playing) duel.setRate(1, true);
    }, [sceneReady, kicked, halftime, ended]);
    useEffect(
        () => () => {
            duel.playing = false;
        },
        [],
    );

    // trava no fim do último trecho que a partida na tela já simulou com a seed dos dois (aberto e resimulado)
    const opened = Math.min(simSeeds, openedSegments(s.reveals.host, s.reveals.guest));
    useEffect(() => {
        if (sceneReady && match) EventBus.emit('match:seg-hold', holdTick(match.snapshots, opened));
    }, [sceneReady, opened, match]);

    // velocidade da sala
    useEffect(() => {
        if (sceneReady) EventBus.emit('match:set-speed', s.speed);
    }, [sceneReady, s.speed]);

    // 2º tempo: os dois prontos (ou o tempo acabou) e a partida já com todas as ordens do intervalo
    useEffect(() => {
        if (halftime && s.secondHalf && simCount === logLen) {
            setHalftime(false);
            setSubOut(null);
            EventBus.emit('match:resume');
        }
    }, [halftime, s.secondHalf, simCount, logLen]);

    useEffect(() => {
        if (halftime) halftimeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [halftime]);
    const htLeft = useCountdown(halftime ? s.halftime?.until : undefined);
    const kickLeft = useCountdown(kicked ? undefined : s.kickoffAt);
    // acréscimos ("+2'") e Pressão final do tick da tela (eventos do motor)
    const extras = clockExtrasAt(match?.events ?? [], clock.tick, clock.half);
    const clockParts = useClockParts({ ...clock, added: extras.added }, fulltime || ended, shootout, halftime);
    const pressureNow = halftime || fulltime || ended ? null : extras.pressure;
    // fim de jogo: vai sozinho pro resultado; um toque na quadra ou no painel segura
    const auto = useAutoResult(ended, onSeeResult);
    // fim de jogo: a quadra volta pra tela (no celular a página pode ter ficado rolada desde o intervalo)
    useEffect(() => {
        if (ended)
            scoreboardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    }, [ended]);

    if (!match || !sceneData) {
        return (
            <div className="panel duel-wait">
                <span className="duel-spinner" aria-hidden />
                {t('duel.match.preparing')}
            </div>
        );
    }

    // o capitão de cada lado é a cara dos emotes (quem evoluiu na partida aparece evoluído)
    const capNow = ([0, 1] as const).map((tm) => captainAt(match, setups, tm, clock.tick));
    const captains: [number, number] = [capNow[0].speciesId, capNow[1].speciesId];
    // "Vamooo!": o capitão daquele lado faz pose em quadra (se estiver lá; a cena confere o lance)
    const captainPose = (tm: 0 | 1) => {
        const idx = captainAt(match, setups, tm, tickRef.current).idx;
        if (idx !== null) EventBus.emit('match:captain-pose', idx);
    };

    const pendingOrder = simCount < logLen;
    // intervalo: com o meu pronto dado a tela trava (o "Mudar algo" destrava)
    const htMine = !!s.halftime?.ready[role];
    const htTick = match.events.find((e) => e.type === 'halftime')?.tick;
    const mineLog = s.log.filter((o) => o.team === side);
    const tacticOrders = mineLog.filter((o) => isTacticOrder(o)) as TacticChange[];
    const cornerOrders = mineLog.filter((o) => isCornerOrder(o)) as CornerOrder[];
    const currentCorner: CornerPlan = cornerOrders.at(-1)?.corner ?? myTeam.corner ?? 'mixed';
    const subOrders = mineLog.filter(isSubStamped);
    const currentTactic: Tactic = tacticOrders.at(-1)?.tactic ?? myTeam.tactic ?? 'balanced';
    const rivalTactics = s.log.filter((o) => o.team !== side && isTacticOrder(o)) as TacticChange[];
    const rivalTactic: Tactic = rivalTactics.at(-1)?.tactic ?? setups[side === 0 ? 1 : 0].tactic;
    const lead = leadTicks(s.speed, duelPace(s));
    const cfg = FUTSAL_5;
    const leadMinutes = (lead / (cfg.tickRate * cfg.halfSeconds)) * cfg.displayHalfMinutes;
    const canChange =
        sceneReady &&
        kicked &&
        !pendingOrder &&
        !ended &&
        !fulltime &&
        !(halftime && (htMine || s.secondHalf)) &&
        clock.minute + leadMinutes < cfg.displayHalfMinutes * 2 - 1;

    const order = (o: OrderBody) => duel.order(o, halftime);

    // quem está em quadra e no banco agora (escalação + trocas que já aconteceram)
    const byUid = new Map([...myTeam.lineup, ...myTeam.bench].map((p) => [p.uid, p]));
    const done = s.log.filter((o) => !isSubStamped(o) || subsDone.includes(o.inUid));
    const onField = onFieldAfter(myTeam, done, side);
    const usedIn = new Set(subOrders.map((o) => o.inUid));
    const benchNow = myTeam.bench.map((p) => p.uid).filter((u) => !usedIn.has(u));
    const pendingSub = subOrders.find((o) => !subsDone.includes(o.inUid)) ?? null;
    // vestiário: várias trocas no mesmo intervalo, cada uma com desfazer até o 2º tempo (no jogo, uma por bola parada)
    const htSubs = halftime && htTick !== undefined ? subOrders.filter((o) => o.tick > htTick) : [];
    const leaving = new Set(htSubs.map((o) => o.outUid));
    const canSub =
        canChange &&
        (halftime ? onField.some((u) => !leaving.has(u)) : !pendingSub) &&
        subOrders.length < myTeam.bench.length &&
        benchNow.length > 0;
    const myIdx = match.roster.filter((r) => r.team === side).map((r) => r.idx);
    // posição agora de quem está em cada vaga (a prancheta pode ter mudado)
    const slots = myIdx.map((idx) => roleAt(match, setups, idx, tickRef.current));
    // prancheta: sem limite, a última mandada vale na próxima bola parada (pendente até o evento passar na tela)
    const lastBoard = (mineLog.filter((o) => isLineupOrder(o)) as LineupOrder[]).at(-1);
    const boardEv =
        lastBoard && match.events.find((e) => e.type === 'lineup' && e.team === side && e.tick >= lastBoard.tick);
    const pendingBoard: BoardPlan | null =
        lastBoard && boardEv && boardEv.tick > clock.tick
            ? { formation: lastBoard.formation, order: lastBoard.order }
            : null;
    const energyAt = (i: number, tick = tickRef.current) =>
        snapAt(match.snapshots, tick).p[(myIdx[i] ?? 0) * SNAP_STRIDE + 6] ?? 1;
    const nameOf = (uid: string) => {
        const p = byUid.get(uid);
        if (!p) return '?';
        const name = viewInstance(p).displayName;
        const evo = match.events.find((e) => e.type === 'evolve' && e.uid === uid && e.tick <= tickRef.current);
        return evo?.type === 'evolve' && name === species(evo.from).name ? species(evo.into).name : name;
    };

    const speedLabel = (sp: PlaybackSpeed) => (sp === 'highlights' ? t('match.highlights') : `${sp}x`);
    const htReady = s.halftime?.ready;
    const awayRival = !online[rivalRole];

    const myPeer = s.peers[role];
    const openCard = usePlayerCard.getState().open;
    const coach = (p?: typeof myPeer) =>
        p && {
            name: p.name,
            title: peerTitle(p).name,
            titleLook: peerTitle(p).look,
            avatar: peerAvatar(p).src,
            avatarGoogle: peerAvatar(p).google,
            showcase: parseShowcase(p.showcase),
            frame: frameTier(parseShowcase(p.showcase)),
            onOpen: () => openCard(peerInfo(p, p !== myPeer)),
        };
    const badge = (p?: typeof myPeer) => {
        const tt = p && peerTitle(p);
        return p && tt?.name ? (
            <button
                type="button"
                className="sb-title is-btn"
                onClick={() => openCard(peerInfo(p, p !== myPeer))}
                aria-label={t('profile.card.openAria', { name: p.name })}
            >
                <span className={tt.look || undefined}>{tt.name}</span>
            </button>
        ) : null;
    };
    // Substituir (botão, intervalo, pedido de tempo, sugestão): abre a prancheta, já com quem sai marcado se tiver
    const openBoard = (uid?: string) => {
        setTab('board');
        setSubOut(uid ? { uid } : null);
        requestAnimationFrame(() => coachRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };

    // fôlego que vale na tela: no intervalo, o com que cada um começaria o 2º tempo (o mesmo número no "Mais
    // cansado" do painel, na sugestão de troca e no aviso e na lista do Substituir)
    const ko2 = match.events.find((e) => e.type === 'kickoff' && e.half === 2)?.tick;
    const energyNow = (i: number) => energyAt(i, halftime ? ko2 : undefined);
    // quem está mais cansado em quadra: o botão Substituir avisa (só avisa; a troca é sempre do técnico)
    const tiredSlot = onField.map((uid, i) => ({ uid, energy: energyNow(i) })).sort((a, b) => a.energy - b.energy)[0];
    // intervalo: sugere trocar o mais cansado (só abre o Substituir com ele marcado)
    const htSuggest = halftime
        ? subSuggestion(
              onField.map((uid, i) => ({ uid, energy: energyNow(i) })),
              canSub,
          )
        : null;
    const pendingSubText = pendingSub
        ? rich(t(halftime ? 'match.subPendingHt' : 'match.subPending'), {
              out: <b>{nameOf(pendingSub.outUid)}</b>,
              in: <b>{nameOf(pendingSub.inUid)}</b>,
          })
        : null;
    const tiredInst = tiredSlot && byUid.get(tiredSlot.uid);
    const tired =
        canSub && tiredSlot && tiredInst && tiredSlot.energy < TIRED_HINT
            ? { name: nameOf(tiredSlot.uid), energy: tiredSlot.energy, sprite: cardSprite(tiredInst) }
            : null;
    const over = fulltime || ended;
    const tacticControls = (
        <TacticControls
            tactic={currentTactic}
            corner={currentCorner}
            canChange={canChange}
            pending={pendingOrder}
            onTactic={(tc) => tc !== currentTactic && order({ kind: 'tactic', tactic: tc })}
            onCorner={(pl) => pl !== currentCorner && order({ kind: 'corner', corner: pl })}
            canSub={canSub}
            onSub={() => openBoard(tired ? tiredSlot.uid : undefined)}
            tired={tired}
        />
    );
    // beira da quadra (experimento): só com a sala do host ligada; as ordens passam pelo carimbo do host
    const agency = !!s.agency;
    const sideline = agencyView(match.events, s.log, side, clock.tick);
    const tactics = agency ? (
        <>
            {tacticControls}
            <SidelineControls
                view={sideline}
                canAct={canChange}
                onShout={(shout) => order({ kind: 'shout', shout })}
                onTimeout={halftime ? undefined : () => order({ kind: 'timeout' })}
                onFlyGk={(on) => order({ kind: 'flyGk', on })}
                onMax={() => order({ kind: 'max' })}
                onPens={() => setPensOpen(true)}
            />
        </>
    ) : (
        tacticControls
    );

    return (
        <>
            {!kicked && (
                <VersusIntro
                    home={myTeam}
                    away={setups[side === 0 ? 1 : 0]}
                    stage={t('duel.title')}
                    ready={sceneReady}
                    onDone={() => {}}
                    awayTrainer={rivalPeer?.trainer as TrainerId | undefined}
                    awayTag={rivalPeer?.clubTag}
                    awayLabel={t('duel.match.vsRival')}
                    homeCoach={coach(myPeer)}
                    awayCoach={coach(rivalPeer)}
                    homeLook={looks[side]}
                    awayLook={looks[side === 0 ? 1 : 0]}
                    startsIn={kickLeft}
                    onRetry={() => setSceneKey((k) => k + 1)}
                />
            )}
            <div className="bc duel">
                <div className="bc-head" ref={scoreboardRef}>
                    <Scoreboard
                        className=" duel-board"
                        names={teamNames}
                        tags={duelTags(s)}
                        colors={colors}
                        looks={looks}
                        score={clock.score}
                        clock={clockParts}
                        pressure={pressureNow}
                        stage={t('duel.title')}
                        coaches={[badge(s.peers.host), badge(s.peers.guest)]}
                    >
                        <EmoteBubbles
                            mySide={side === 0 ? 'left' : 'right'}
                            captains={captains}
                            colors={[hex(colors[0]), hex(colors[1])]}
                            onPose={captainPose}
                        />
                    </Scoreboard>
                    <PressureBar match={match} tick={clock.tick} minute={clock.minute} colors={colors} over={over} />
                    {agency && <MaxBars events={match.events} tick={clock.tick} colors={colors} />}
                </div>

                <div className="bc-stage" onPointerDownCapture={auto.hold}>
                    {suspect && <div className="duel-banner warn">{t('duel.match.suspect')}</div>}
                    {/* tela parada esperando o rival (a faixa da espera do W.O., quando vale, já diz isso) */}
                    {stall && stall !== role && s.waitFor !== stall && !ended && (
                        <div className="duel-banner warn" role="status" data-testid="duel-stall">
                            {t('duel.match.waitingFor', { name: trainerNames(s)[SIDE[stall]] })}
                        </div>
                    )}
                    <div className="pitch-wrap">
                        {fontsReady ? (
                            <PhaserGame key={`${match.seed}-${sceneKey}`} data={sceneData} />
                        ) : (
                            <div className="phaser-container" />
                        )}
                        <Ticker lines={lines} colors={colors} />
                        {agency && (
                            <SidelineOverlay
                                events={match.events}
                                tick={clock.tick}
                                colors={colors}
                                names={teamNames}
                            />
                        )}
                        <MatchHighlight teamNames={teamNames} colors={[hex(colors[0]), hex(colors[1])]} />
                        <EvolutionOverlay />
                        {ended && !auto.held && (
                            <FinalBanner score={clock.score} shootout={shootout} side={side} names={teamNames} />
                        )}
                        <PlayerInspect
                            match={match}
                            setups={setups}
                            tactics={side === 0 ? [currentTactic, rivalTactic] : [rivalTactic, currentTactic]}
                        />
                        <SpeedAsk rivalName={rivalName} />
                    </div>
                    {halftime && (
                        <div className="ht-wrap" ref={halftimeRef}>
                            <HalftimePanel
                                match={match}
                                names={teamNames}
                                side={side}
                                nameOf={(idx) => {
                                    const ht = match.events.find((e) => e.type === 'halftime')?.tick ?? 0;
                                    const ko =
                                        match.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? ht;
                                    const sub = match.events
                                        .filter((e) => e.type === 'sub' && e.outIdx === idx && e.tick <= ko)
                                        .at(-1);
                                    return sub && sub.type === 'sub' ? sub.in : match.roster[idx].name;
                                }}
                                canSub={canSub}
                                onSub={() => openBoard()}
                                suggest={
                                    htSuggest && {
                                        text: t('match.ht.suggest', {
                                            name: nameOf(htSuggest.uid),
                                            p: Math.round(htSuggest.energy * 100),
                                        }),
                                        onPick: () => openBoard(htSuggest.uid),
                                    }
                                }
                                onContinue={() => duel.dispatch({ k: 'htReady' })}
                                mySubs={htSubs.map((o) => {
                                    const inst = byUid.get(o.inUid);
                                    return {
                                        key: o.inUid,
                                        inName: nameOf(o.inUid),
                                        outName: nameOf(o.outUid),
                                        sprite: inst ? cardSprite(inst) : '',
                                        onUndo:
                                            !pendingOrder && canUnorder(s, role, o.seq, htTick)
                                                ? () => duel.dispatch({ k: 'unorder', seq: o.seq })
                                                : undefined,
                                    };
                                })}
                                rivalSubs={rivalHtSubs(match, side === 0 ? 1 : 0)}
                                ready={
                                    <ReadyBar
                                        compact
                                        mine={htMine}
                                        rival={!!htReady?.[rivalRole]}
                                        rivalName={rivalName}
                                        starting={s.secondHalf || (htMine && (!!htReady?.[rivalRole] || awayRival))}
                                        label={t('match.ht.continue')}
                                        onReady={() => {
                                            setSubOut(null);
                                            duel.dispatch({ k: 'htReady' });
                                        }}
                                        onUndo={() => duel.dispatch({ k: 'htReady', ready: false })}
                                    />
                                }
                                footer={
                                    <p className="duel-ht" data-testid="duel-ht">
                                        <b>{t('duel.match.htTimer', { s: htLeft })}</b>
                                        <small className="muted"> · {t('duel.ready.timeNote')}</small>
                                    </p>
                                }
                            />
                        </div>
                    )}
                    {pensOpen && agency && (
                        <div className="ht-wrap">
                            <PenaltyOrderPanel
                                takers={onField.map((uid, i) => {
                                    const inst = byUid.get(uid);
                                    return {
                                        uid,
                                        name: nameOf(uid),
                                        sprite: inst ? cardSprite(inst) : '',
                                        gk: slots[i] === 'GK',
                                    };
                                })}
                                onKeep={() => setPensOpen(false)}
                                onConfirm={(o) => {
                                    setPensOpen(false);
                                    if (canChange) order({ kind: 'penalties', order: o });
                                }}
                            />
                        </div>
                    )}
                    {pendingSub && !halftime && <div className="sub-pending">{pendingSubText}</div>}
                    {pendingBoard && (
                        <div className="sub-pending">
                            {t('match.boardPending', { formation: formationText(pendingBoard.formation).name })}
                        </div>
                    )}
                    {wide && <div className="bc-deskbar">{tactics}</div>}
                </div>

                <div className="panel bc-coach" ref={coachRef} onPointerDownCapture={auto.hold}>
                    <CoachTabs tabs={tabs} active={tab} onPick={setTab} />
                    <div className={`bc-pane pane-${tab}`} role="tabpanel">
                        {tab === 'tactic' && tactics}
                        {tab === 'board' && (
                            <Prancheta
                                match={match}
                                setups={setups}
                                side={side}
                                tick={clock.tick}
                                names={teamNames}
                                selectedUid={subOut}
                                onMine={(_, idx) => idx !== null && EventBus.emit('match:inspect-request', idx)}
                                onSub={
                                    canSub
                                        ? (outUid, inUid) => {
                                              setSubOut(null);
                                              order({ kind: 'sub', outUid, inUid });
                                          }
                                        : undefined
                                }
                                subs={subOrders.filter((o) => !subsDone.includes(o.inUid))}
                                edit={{
                                    enabled: canChange,
                                    pending: pendingBoard,
                                    over,
                                    onConfirm: ({ formation, order: o }) =>
                                        canChange && order({ kind: 'lineup', formation, order: o }),
                                }}
                            />
                        )}
                        {tab === 'team' && (
                            <TeamPanel
                                match={match}
                                setups={setups}
                                tick={clock.tick}
                                teamNames={teamNames}
                                interactive={sceneReady && !ended}
                                side={side}
                            />
                        )}
                        {tab === 'feed' && <MatchFeed lines={lines} colors={colors} />}
                    </div>
                    {wide && tab !== 'feed' && lines.length > 0 && (
                        <div className="bc-recent">
                            <MatchFeed lines={lines.slice(0, 3)} colors={colors} />
                        </div>
                    )}
                </div>

                <div className="bc-thumb">
                    {!wide && emotesOpen && (
                        <div className="bc-emotes">
                            <EmoteBar captain={captains[side]} onSent={() => setEmotesOpen(false)} />
                        </div>
                    )}
                    {!ended ? (
                        <fieldset className="bc-speed-ask">
                            <legend className="bc-lbl">{t('duel.match.askSpeed')}</legend>
                            <div className="bc-seg speed-seg duel-speed">
                                {DUEL_SPEEDS.map((sp) => (
                                    <button
                                        key={String(sp)}
                                        type="button"
                                        className={`${s.speed === sp ? 'on' : ''}${s.speedAsk?.speed === sp ? ' asking' : ''}`}
                                        aria-pressed={s.speed === sp}
                                        data-testid={`speed-ask-${sp}`}
                                        title={
                                            s.speed === sp
                                                ? t('duel.match.speedNow')
                                                : t('duel.match.askHint', {
                                                      name: rivalName,
                                                      speed: speedLabel(sp),
                                                  })
                                        }
                                        disabled={!sceneReady || ended || fulltime || !!s.speedAsk || s.speed === sp}
                                        onClick={() => duel.dispatch({ k: 'speed', speed: sp })}
                                    >
                                        {speedLabel(sp)}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    ) : (
                        <ResultButton label={t('duel.match.seeResult')} onGo={onSeeResult} auto={auto} />
                    )}
                    {wide ? (
                        <EmoteBar captain={captains[side]} />
                    ) : (
                        <button
                            type="button"
                            className={`bc-skip${emotesOpen ? ' on' : ''}`}
                            aria-expanded={emotesOpen}
                            aria-label={t('match.coach.emotes')}
                            title={t('match.coach.emotes')}
                            onClick={() => setEmotesOpen((v) => !v)}
                        >
                            <HudIcon kind="smile" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

type AskOutcome = { by: Role; speed: PlaybackSpeed; how: 'yes' | 'no' | 'timeout' };

/**
 * Pedido de velocidade explícito: quem pede vê "Pedido enviado: 4x · esperando Fulano (5 s)"; quem recebe vê o
 * nome, a velocidade, o tempo correndo e Aceitar/Recusar; no fim os dois veem o que aconteceu.
 */
function SpeedAsk({ rivalName }: { rivalName: string }) {
    const { t } = useT();
    const ask = useDuel((st) => st.shared?.speedAsk);
    const speed = useDuel((st) => st.shared?.speed);
    const role = useDuel((st) => st.role);
    const left = useCountdown(ask?.until);
    const prev = useRef(ask);
    const [outcome, setOutcome] = useState<AskOutcome | null>(null);
    useEffect(() => {
        const was = prev.current;
        prev.current = ask;
        if (!was || ask) return;
        const how = speed === was.speed ? 'yes' : roomNow() >= was.until - 250 ? 'timeout' : 'no';
        setOutcome({ by: was.by, speed: was.speed, how });
        const id = window.setTimeout(() => setOutcome(null), 3500);
        return () => clearTimeout(id);
    }, [ask, speed]);
    const label = (sp: PlaybackSpeed) => (sp === 'highlights' ? t('match.highlights') : `${sp}x`);
    if (ask) {
        const total = SPEED_ASK_MS / 1000;
        const bar = <i className="sa-bar" style={{ '--p': Math.min(1, left / total) } as React.CSSProperties} />;
        if (ask.by === role)
            return (
                <div className="speed-ask mine" role="status" data-testid="speed-asked">
                    <span>{t('duel.match.asked', { speed: label(ask.speed), name: rivalName, s: left })}</span>
                    {bar}
                </div>
            );
        return (
            <div className="speed-ask theirs" role="alertdialog" aria-live="assertive" data-testid="speed-asked">
                <span>
                    <b>{t('duel.match.speedAsk', { name: rivalName, speed: label(ask.speed) })}</b>{' '}
                    <small>({left} s)</small>
                </span>
                <span className="row sa-actions">
                    <button
                        type="button"
                        className="btn small primary"
                        data-testid="speed-yes"
                        onClick={() => duel.dispatch({ k: 'speedAnswer', yes: true })}
                    >
                        {t('duel.match.accept')}
                    </button>
                    <button
                        type="button"
                        className="btn small ghost"
                        data-testid="speed-no"
                        onClick={() => duel.dispatch({ k: 'speedAnswer', yes: false })}
                    >
                        {t('duel.match.decline')}
                    </button>
                </span>
                {bar}
            </div>
        );
    }
    if (!outcome) return null;
    // quem respondeu é o outro de quem pediu
    const answerer = outcome.by === role ? rivalName : t('duel.match.you');
    const text =
        outcome.how === 'yes'
            ? t('duel.match.askYes', { name: answerer, speed: label(outcome.speed) })
            : outcome.how === 'no'
              ? t('duel.match.askNo', { name: answerer, speed: label(speed ?? 2) })
              : t('duel.match.askTimeout', { speed: label(speed ?? 2) });
    return (
        <div className={`speed-ask done ${outcome.how}`} role="status" data-testid="speed-outcome">
            {text}
        </div>
    );
}
