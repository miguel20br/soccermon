import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { CUP_STAGES } from '../../engine/cup';
import { species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    type CornerPlan,
    isCornerOrder,
    isLineupOrder,
    isSubOrder,
    isTacticOrder,
    type MatchEvent,
    type MatchOrder,
    SNAP_STRIDE,
    type Tactic,
} from '../../engine/state';
import { skinOf } from '../../game/animation-manager';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { clubName, formationText, stageName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { PhaserGame } from '../../PhaserGame';
import { liveOf, type PlaybackSpeed, playerTeam, useGame } from '../../store/game-store';
import { rivalColor, tagFromName } from '../../store/profile';
import { Commentator, type CommentLine } from '../commentary';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HalftimePanel } from '../components/HalftimePanel';
import { MatchHighlight } from '../components/MatchHighlight';
import {
    type Clock,
    type CoachTab,
    CoachTabs,
    HudIcon,
    hex,
    MatchFeed,
    PressureBar,
    Scoreboard,
    SubPanel,
    TacticControls,
    TIRED_HINT,
    Ticker,
    useClockParts,
    useCoachTab,
} from '../components/MatchHud';
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { type BoardPlan, Prancheta, useMedia, WIDE } from '../components/Prancheta';
import {
    agencyView,
    MaxBars,
    PenaltyOrderPanel,
    type PenaltyTaker,
    SidelineControls,
    SidelineOverlay,
    TimeoutPanel,
} from '../components/Sideline';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { LeaveConfirm } from '../leave-guard';
import { roleAt, snapAt } from '../match-view';
import { bannerText, useClubColor } from '../profile/club';
import { agencyOn, reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';

/** Velocidades (o rótulo de 'highlights' vem do dicionário: "Lances"). */
const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 'highlights', label: '' },
];

/** A mudança vale ~2 s de jogo à frente (dá tempo de resimular sem pular nada). */
const CHANGE_LEAD_TICKS = 40;
/** No modo "Lances" o ritmo varia (1x perto dos lances, 16x no resto): na média fica perto de 4x. */
const HIGHLIGHTS_MULT = 4;

/** De quanto em quanto tempo (real) o ponto da partida é salvo para poder retomar. */
const SAVE_EVERY_MS = 1500;

export function Match() {
    const { run, match, settings, updateSettings, recordResult, setMatch, go, saveLive } = useGame();
    const { t, d } = useT();
    // retomando uma partida que ficou no meio: mesmo ponto e mesmas ordens
    const resume = useRef(liveOf(run)).current;
    const [fontsReady, setFontsReady] = useState(false);
    const [lines, setLines] = useState<(CommentLine & { id: number })[]>([]);
    const lineId = useRef(0);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const [ended, setEnded] = useState(false);
    const [orders, setOrders] = useState<MatchOrder[]>(() => resume?.orders ?? []);
    /** Substituições que já aconteceram em campo (uid de quem entrou). */
    const [subsDone, setSubsDone] = useState<string[]>([]);
    const [subOpen, setSubOpen] = useState(false);
    /** A partida está parada no intervalo esperando o técnico. */
    const [halftime, setHalftime] = useState(false);
    const halftimeRef = useRef<HTMLDivElement>(null);
    const [subOut, setSubOut] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    /** Muda a cada "Mudar prancheta" do intervalo (a prancheta rola até a tela). */
    const [boardFocus, setBoardFocus] = useState(0);
    /** A cena Phaser só escuta comandos depois de carregar; até lá os controles ficam travados. */
    const [sceneReady, setSceneReady] = useState(false);
    /** Se a quadra demorar demais (celular fraco, aba em segundo plano), oferece recarregar. */
    const [sceneSlow, setSceneSlow] = useState(false);
    /** Tela de VERSUS antes do apito inicial; a cena espera parada até ela sair. */
    const [introDone, setIntroDone] = useState(!!resume?.tick);
    const introDoneRef = useRef(!!resume?.tick);
    const [sceneKey, setSceneKey] = useState(0);
    const [fulltime, setFulltime] = useState(false);
    const [tacticError, setTacticError] = useState<string | null>(null);
    /** Beira da quadra (experimento): ligado na entrada da partida, não muda no meio. */
    const agency = useRef(agencyOn(settings.agency)).current;
    /** Tick do pedido de tempo em que a quadra está parada (null = jogando). */
    const [timeoutAt, setTimeoutAt] = useState<number | null>(null);
    /** Tick do apito final, parado pra escolher a ordem dos pênaltis. */
    const [penPick, setPenPick] = useState<number | null>(null);
    const alive = useRef(true);
    // painel do técnico: no desktop a Tática fica embaixo da quadra e as abas abrem na Prancheta
    const wide = useMedia(WIDE);
    const tabs: CoachTab[] = wide ? ['board', 'team', 'feed'] : ['tactic', 'board', 'team', 'feed'];
    const [tab, setTab] = useCoachTab(tabs, wide ? 'board' : 'tactic');
    const latest = useRef<MatchResult | null>(match);
    const recorded = useRef(false);
    const tickRef = useRef(0);
    const scoreboardRef = useRef<HTMLDivElement>(null);
    const subPanelRef = useRef<HTMLDivElement>(null);
    // celular deitado: placar no topo da tela pra quadra caber inteira (depois do scrollTo(0) do App)
    useEffect(() => {
        if (!window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches) return;
        const id = requestAnimationFrame(() => scoreboardRef.current?.scrollIntoView({ block: 'start' }));
        return () => cancelAnimationFrame(id);
    }, []);
    useEffect(() => {
        if (halftime) halftimeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [halftime]);
    // painel de substituição pode abrir abaixo da dobra (deitado): traz pra tela
    useEffect(() => {
        if (subOpen) subPanelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, [subOpen]);

    const opponent = run?.opponents[run.stage];
    // cor do seu clube (Perfil); o rival troca para o uniforme reserva se a cor dele for parecida
    const clubColor = useClubColor();
    const colors: [number, number] = [clubColor, rivalColor(clubColor, opponent?.color ?? 0x3a7bd5)];
    const teamNames: [string, string] = [
        run?.teamName ?? t('match.home'),
        opponent ? clubName(opponent.name) : t('match.away'),
    ];
    // sigla no placar do celular: a do perfil se a copa tem o nome do clube, senão a tirada do nome
    const profileClub = useGame((s) => s.profile);
    const homeTag = teamNames[0] === profileClub.clubName ? profileClub.clubTag : tagFromName(teamNames[0]);
    const tacticOrders = orders.filter(isTacticOrder);
    const subOrders = orders.filter(isSubOrder);
    const currentTactic: Tactic = tacticOrders.at(-1)?.tactic ?? run?.tactic ?? 'balanced';

    latest.current = match;

    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena só lê os dados na montagem; trocas vêm por 'match:replace'
    const sceneData = useMemo<MatchSceneData | null>(
        () =>
            match
                ? {
                      result: match,
                      colors,
                      cries: settings.cries,
                      speed: settings.speed,
                      cinematic: settings.cinematic,
                      namesOnField: settings.namesOnField,
                      arrowSize: settings.arrowSize,
                      chanceSpeed: settings.chanceSpeed,
                      reduceMotion: reduceMotionOn(settings.reduceMotion),
                      extraSpecies: [...(run?.picks ?? []), ...(opponent?.bench ?? [])].map((p) =>
                          skinOf(p.speciesId, p.shiny),
                      ),
                      startPaused: true,
                      startTick: resume?.tick || undefined,
                      final: run?.stage === CUP_STAGES.length - 1,
                      agency,
                      // a faixa da torcida é só a sua (o rival da copa não tem torcida organizada)
                      banners: [bannerText(profileClub.banner, run?.teamName || profileClub.clubName), null],
                  }
                : null,
        [match?.seed],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: sceneKey reinicia a contagem ao recarregar a quadra
    useEffect(() => {
        if (sceneReady || !fontsReady) return;
        setSceneSlow(false);
        const timer = window.setTimeout(() => setSceneSlow(true), 8000);
        return () => clearTimeout(timer);
    }, [sceneReady, fontsReady, sceneKey]);

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    // o resultado só vale no apito final (pode mudar com a tática ao vivo). Sair antes não grava nada:
    // a fase continua aberta e, com a mesma seed, a partida se repete igual.
    useEffect(() => {
        const record = () => {
            if (!recorded.current && latest.current) {
                recorded.current = true;
                recordResult(latest.current);
            }
        };
        EventBus.on('match:ended', record);
        return () => {
            EventBus.off('match:ended', record);
        };
    }, [recordResult]);

    useEffect(() => {
        let alive = true;
        Promise.all([document.fonts.load('10px Galmuri11'), document.fonts.load('bold 10px Galmuri11')])
            .catch(() => {})
            .finally(() => alive && setFontsReady(true));
        return () => {
            alive = false;
        };
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: a narração é criada uma vez por partida
    useEffect(() => {
        if (!match) return;
        const commentator = new Commentator(match, teamNames);
        // depois do apito final (pênaltis) o ponto de retomada não anda: voltar no meio da disputa
        // faria todas as cobranças passarem de uma vez
        let afterFulltime = false;
        const onEvent = (e: MatchEvent) => {
            if (e.type === 'sub' && e.team === 0) setSubsDone((prev) => [...prev, e.inUid]);
            // gol: salva o ponto na hora (não dá para sair e voltar antes dele)
            if (e.type === 'goal') useGame.getState().saveLive({ tick: e.tick });
            const line = commentator.lineFor(e);
            if (line) setLines((prev) => [{ ...line, id: lineId.current++ }, ...prev].slice(0, 200));
            if (e.type === 'penalty') setShootout(e.shootout);
            if (e.type === 'fulltime') {
                afterFulltime = true;
                setFulltime(true);
            }
        };
        let lastSave = 0;
        const onTick = (t: Clock) => {
            tickRef.current = t.tick;
            setClock(t);
            const now = performance.now();
            if (!afterFulltime && now - lastSave > SAVE_EVERY_MS) {
                lastSave = now;
                useGame.getState().saveLive({ tick: Math.floor(t.tick) });
            }
        };
        const onEnded = () => {
            setEnded(true);
            setHalftime(false);
        };
        const onHalftime = () => setHalftime(true);
        const onTimeout = (tick: number) => setTimeoutAt(tick);
        const onPenaltyPick = (tick: number) => setPenPick(tick);
        EventBus.on('match:timeout', onTimeout);
        EventBus.on('match:penalty-pick', onPenaltyPick);
        const onReady = () => {
            setSceneReady(true);
            // VERSUS já foi embora antes de a quadra carregar: começa direto
            if (introDoneRef.current) EventBus.emit('match:resume');
            // velocidade escolhida antes da cena carregar
            EventBus.emit('match:set-speed', useGame.getState().settings.speed);
        };
        EventBus.on('current-scene-ready', onReady);
        EventBus.on('match:event', onEvent);
        EventBus.on('match:tick', onTick);
        EventBus.on('match:ended', onEnded);
        EventBus.on('match:halftime', onHalftime);
        return () => {
            EventBus.off('match:timeout', onTimeout);
            EventBus.off('match:penalty-pick', onPenaltyPick);
            EventBus.off('match:halftime', onHalftime);
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [match?.seed]);

    const clockParts = useClockParts(clock, fulltime || ended, shootout, halftime);
    if (!run || !match || !sceneData || !opponent) return null;

    const lockedSetup = run.lockedTeam ? { ...run.lockedTeam, manualSubs: true } : playerTeam(run);
    // instrução de escanteio: trocável como a tática, sem limite
    const cornerOrders = orders.filter(isCornerOrder);
    const currentCorner = cornerOrders.at(-1)?.corner ?? lockedSetup.corner ?? 'mixed';
    // a troca vale um pouco à frente do que está na tela (mais à frente em velocidades altas)
    const speedMult = typeof settings.speed === 'number' ? settings.speed : HIGHLIGHTS_MULT;
    const leadTicks = CHANGE_LEAD_TICKS * speedMult;
    // trocas só no tempo normal e com folga antes do apito: a troca tem que cair antes dele, senão
    // nunca entraria no motor (e gastaria uma troca à toa)
    const leadMinutes = (leadTicks / (FUTSAL_5.tickRate * FUTSAL_5.halfSeconds)) * FUTSAL_5.displayHalfMinutes;
    const canChangeTactic =
        sceneReady &&
        !pending &&
        !ended &&
        !fulltime &&
        clock.minute + leadMinutes < FUTSAL_5.displayHalfMinutes * 2 - 1;

    const setSpeed = (speed: PlaybackSpeed) => {
        updateSettings({ speed });
        EventBus.emit('match:set-speed', speed);
    };

    /**
     * Ordem do técnico ao vivo (tática ou substituição): agenda um pouco à frente do que está na tela e
     * resimula a partida com a agenda inteira. As ordens ficam salvas para retomar a partida igual.
     */
    const sendOrder = async (make: (tick: number) => MatchOrder, at?: number) => {
        // sempre depois da ordem anterior, para a ordem do motor bater com a da tela; no intervalo (e no pedido de
        // tempo) a partida está parada, então vale já no tick seguinte. `at`: tick fixo (ordem dos pênaltis, que
        // entra antes do apito final e não muda nada do jogo)
        const htTick = match.events.find((e) => e.type === 'halftime')?.tick;
        const base =
            halftime && htTick !== undefined
                ? htTick + 1
                : timeoutAt !== null
                  ? timeoutAt + 1
                  : Math.ceil(tickRef.current + leadTicks);
        const tick = at ?? Math.max(base, (orders.at(-1)?.tick ?? 0) + 1);
        const schedule = [...orders, make(tick)];
        const seed = match.seed;
        setPending(true);
        setTacticError(null);
        EventBus.emit('match:hold', tick);
        try {
            const result = await simulateMatch(lockedSetup, opponent, `${run.seed}-stage-${run.stage}`, schedule);
            if (!alive.current || useGame.getState().match?.seed !== seed) return;
            setOrders(schedule);
            saveLive({ orders: schedule });
            latest.current = result;
            setMatch(result);
            EventBus.emit('match:replace', result);
        } catch {
            // libera o playback com a partida que já estava valendo
            if (alive.current && latest.current) EventBus.emit('match:replace', latest.current);
            if (alive.current) setTacticError(t('match.orderFailed'));
        } finally {
            if (alive.current) setPending(false);
        }
    };

    const changeCorner = (corner: CornerPlan) => {
        if (!canChangeTactic || corner === currentCorner) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'corner', corner }));
    };

    // beira da quadra (experimento): gritos, tempo, goleiro-linha e golpe máximo, pelo mesmo caminho das ordens
    const sideline = agencyView(match.events, orders, 0, clock.tick);
    const canAgency = canChangeTactic && penPick === null;
    const sidelineControls = (
        <SidelineControls
            view={sideline}
            canAct={canAgency}
            onShout={(shout) => sendOrder((tick) => ({ tick, team: 0, kind: 'shout', shout }))}
            onTimeout={
                timeoutAt === null && !halftime
                    ? () => sendOrder((tick) => ({ tick, team: 0, kind: 'timeout' }))
                    : undefined
            }
            onFlyGk={(on) => sendOrder((tick) => ({ tick, team: 0, kind: 'flyGk', on }))}
            onMax={() => sendOrder((tick) => ({ tick, team: 0, kind: 'max' }))}
        />
    );

    const changeTactic = (tactic: Tactic) => {
        if (!canChangeTactic || tactic === currentTactic) return;
        sendOrder((tick) => ({ tick, team: 0, tactic }));
    };

    // quem está em campo e no banco agora (escalação + trocas que já aconteceram)
    const byUid = new Map([...lockedSetup.lineup, ...lockedSetup.bench].map((p) => [p.uid, p]));
    const onField = lockedSetup.lineup.map((p) => p.uid);
    const benchNow = lockedSetup.bench.map((p) => p.uid);
    for (const o of subOrders) {
        if (!subsDone.includes(o.inUid)) continue;
        const i = onField.indexOf(o.outUid);
        if (i >= 0) onField[i] = o.inUid;
        const j = benchNow.indexOf(o.inUid);
        if (j >= 0) benchNow.splice(j, 1);
    }
    // posição agora de quem está em cada vaga (a prancheta pode ter mudado)
    const slots = onField.map((_, i) => roleAt(match, [lockedSetup, opponent], i, tickRef.current));
    /** Fôlego (0..1) agora de quem está na vaga `i` do seu time. */
    const energyAt = (i: number) => snapAt(match.snapshots, tickRef.current).p[i * SNAP_STRIDE + 6] ?? 1;
    const pendingSub = subOrders.find((o) => !subsDone.includes(o.inUid)) ?? null;
    const canSub = canChangeTactic && !pendingSub && subOrders.length < lockedSetup.bench.length && benchNow.length > 0;
    const orderSub = (outUid: string, inUid: string) => {
        setSubOpen(false);
        setSubOut(null);
        if (!canSub) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'sub', outUid, inUid }));
    };
    // prancheta: sem limite, a última mandada vale na próxima bola parada (pendente até o evento passar na tela)
    const lastBoard = orders.filter(isLineupOrder).at(-1);
    const boardEv =
        lastBoard && match.events.find((e) => e.type === 'lineup' && e.team === 0 && e.tick >= lastBoard.tick);
    const pendingBoard: BoardPlan | null =
        lastBoard && boardEv && boardEv.tick > clock.tick
            ? { formation: lastBoard.formation, order: lastBoard.order }
            : null;
    const orderBoard = ({ formation, order }: BoardPlan) => {
        if (!canChangeTactic) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'lineup', formation, order }));
    };
    const nameOf = (uid: string) => {
        const p = byUid.get(uid);
        if (!p) return '?';
        const name = viewInstance(p).displayName;
        // quem já evoluiu nesta partida aparece com o nome novo (Graveler → Golem), como na quadra
        const evo = match.events.find((e) => e.type === 'evolve' && e.uid === uid && e.tick <= tickRef.current);
        return evo?.type === 'evolve' && name === species(evo.from).name ? species(evo.into).name : name;
    };

    const stage = stageName(run.stage) || t('match.cup');

    const finishIntro = () => {
        if (introDoneRef.current) return;
        introDoneRef.current = true;
        setIntroDone(true);
        EventBus.emit('match:resume');
    };
    // quem está mais cansado em quadra: o botão Substituir avisa (só avisa; a troca é sempre do técnico)
    const tiredSlot = onField.map((uid, i) => ({ uid, energy: energyAt(i) })).sort((a, b) => a.energy - b.energy)[0];
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
            canChange={canChangeTactic}
            pending={pending}
            error={tacticError}
            onTactic={changeTactic}
            onCorner={changeCorner}
            subOpen={subOpen}
            canSub={canSub}
            onToggleSub={() => setSubOpen((v) => !v)}
            tired={tired}
        />
    );
    const tactics = agency ? (
        <>
            {tacticControls}
            {sidelineControls}
        </>
    ) : (
        tacticControls
    );
    // ordem dos pênaltis: quem está em quadra no apito final, na ordem do motor (pelo chute); o goleiro no fim
    const penaltyTakers = (): PenaltyTaker[] => {
        const ft = penPick ?? 0;
        const field = onField.map((uid, i) => ({ uid, i, role: roleAt(match, [lockedSetup, opponent], i, ft) }));
        const shooting = (uid: string) => {
            const inst = byUid.get(uid);
            return inst ? viewInstance(inst).attributes.shooting : 0;
        };
        return field
            .sort((a, b) => Number(a.role === 'GK') - Number(b.role === 'GK') || shooting(b.uid) - shooting(a.uid))
            .map(({ uid, role }) => {
                const inst = byUid.get(uid);
                return { uid, name: nameOf(uid), sprite: inst ? cardSprite(inst) : '', gk: role === 'GK' };
            });
    };
    const resumeFromPens = () => {
        setPenPick(null);
        EventBus.emit('match:resume');
    };

    return (
        <>
            {!introDone && (
                <VersusIntro home={lockedSetup} away={opponent} stage={stage} ready={sceneReady} onDone={finishIntro} />
            )}
            <div className="bc">
                <div className="bc-head" ref={scoreboardRef}>
                    <Scoreboard
                        names={teamNames}
                        tags={[homeTag, tagFromName(teamNames[1])]}
                        colors={colors}
                        score={clock.score}
                        clock={clockParts}
                        stage={d.match.stageShort[run.stage] ?? stage}
                    />
                    <PressureBar match={match} tick={clock.tick} minute={clock.minute} colors={colors} over={over} />
                    {agency && <MaxBars events={match.events} tick={clock.tick} colors={colors} />}
                </div>

                <div className="bc-stage">
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
                        <LeaveConfirm />
                        <PlayerInspect
                            match={match}
                            setups={[lockedSetup, opponent]}
                            tactics={[currentTactic, opponent.tactic]}
                        />
                    </div>
                    {sceneSlow && !sceneReady && (
                        <button type="button" className="btn yellow" onClick={() => setSceneKey((k) => k + 1)}>
                            {t('match.reload')}
                        </button>
                    )}
                    {halftime && (
                        <div className="ht-wrap" ref={halftimeRef}>
                            <HalftimePanel
                                match={match}
                                names={teamNames}
                                nameOf={(idx) => {
                                    const ht = match.events.find((e) => e.type === 'halftime')?.tick ?? 0;
                                    // trocas até a saída de bola do 2º tempo (as feitas no intervalo entram)
                                    const ko =
                                        match.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? ht;
                                    const sub = match.events
                                        .filter((e) => e.type === 'sub' && e.outIdx === idx && e.tick <= ko)
                                        .at(-1);
                                    return sub && sub.type === 'sub' ? sub.in : match.roster[idx].name;
                                }}
                                canSub={canSub}
                                onSub={() => setSubOpen(true)}
                                onBoard={() => {
                                    setTab('board');
                                    setBoardFocus((k) => k + 1);
                                }}
                                onContinue={() => {
                                    setHalftime(false);
                                    EventBus.emit('match:resume');
                                }}
                            />
                        </div>
                    )}
                    {timeoutAt !== null && (
                        <div className="ht-wrap">
                            <TimeoutPanel
                                canSub={canSub}
                                onSub={() => setSubOpen(true)}
                                onBoard={() => {
                                    setTab('board');
                                    setBoardFocus((k) => k + 1);
                                }}
                                onBack={() => {
                                    setTimeoutAt(null);
                                    EventBus.emit('match:resume');
                                }}
                            >
                                <SidelineControls
                                    compact
                                    view={sideline}
                                    canAct={canAgency}
                                    onShout={(shout) => sendOrder((tick) => ({ tick, team: 0, kind: 'shout', shout }))}
                                    onFlyGk={() => {}}
                                    onMax={() => {}}
                                />
                            </TimeoutPanel>
                        </div>
                    )}
                    {penPick !== null && (
                        <div className="ht-wrap">
                            <PenaltyOrderPanel
                                takers={penaltyTakers()}
                                busy={pending}
                                onKeep={resumeFromPens}
                                onConfirm={async (order) => {
                                    // entra antes do apito final: o jogo é o mesmo, só a disputa muda
                                    await sendOrder(
                                        (tick) => ({ tick, team: 0, kind: 'penalties', order }),
                                        penPick - 1,
                                    );
                                    resumeFromPens();
                                }}
                            />
                        </div>
                    )}
                    {pendingSub && (
                        <div className="sub-pending">
                            {rich(t('match.subPending'), {
                                out: <b>{nameOf(pendingSub.outUid)}</b>,
                                in: <b>{nameOf(pendingSub.inUid)}</b>,
                            })}
                        </div>
                    )}
                    {pendingBoard && (
                        <div className="sub-pending">
                            {t('match.boardPending', { formation: formationText(pendingBoard.formation).name })}
                        </div>
                    )}
                    {subOpen && canSub && (
                        <SubPanel
                            panelRef={subPanelRef}
                            subOut={subOut}
                            setSubOut={setSubOut}
                            onClose={() => setSubOpen(false)}
                            onField={onField}
                            benchNow={benchNow}
                            byUid={byUid}
                            slots={slots}
                            energyAt={energyAt}
                            nameOf={nameOf}
                            onPick={orderSub}
                        />
                    )}
                    {wide && <div className="bc-deskbar">{tactics}</div>}
                </div>

                <div className="panel bc-coach">
                    <CoachTabs tabs={tabs} active={tab} onPick={setTab} />
                    <div className={`bc-pane pane-${tab}`} role="tabpanel">
                        {tab === 'tactic' && tactics}
                        {tab === 'board' && (
                            <Prancheta
                                match={match}
                                setups={[lockedSetup, opponent]}
                                side={0}
                                tick={clock.tick}
                                names={teamNames}
                                selectedUid={subOpen ? subOut : null}
                                onMine={(uid, idx, outUid) => {
                                    if (canSub) {
                                        setSubOut(outUid ?? (onField.includes(uid) ? uid : null));
                                        setSubOpen(true);
                                    } else if (idx !== null) EventBus.emit('match:inspect-request', idx);
                                }}
                                edit={{ enabled: canChangeTactic, pending: pendingBoard, onConfirm: orderBoard, over }}
                                focusKey={boardFocus}
                            />
                        )}
                        {tab === 'team' && (
                            <TeamPanel
                                match={match}
                                setups={[lockedSetup, opponent]}
                                tick={clock.tick}
                                teamNames={teamNames}
                                interactive={sceneReady && !ended}
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
                    {!ended ? (
                        <>
                            <fieldset className="bc-seg speed-seg" aria-label={t('match.coach.speed')}>
                                {SPEEDS.map((s) => (
                                    <button
                                        key={String(s.value)}
                                        type="button"
                                        className={settings.speed === s.value ? 'on' : undefined}
                                        aria-pressed={settings.speed === s.value}
                                        disabled={!sceneReady}
                                        onClick={() => setSpeed(s.value)}
                                        title={s.value === 'highlights' ? t('match.highlightsHint') : undefined}
                                    >
                                        {s.label || t('match.highlights')}
                                    </button>
                                ))}
                            </fieldset>
                            <button
                                type="button"
                                className="bc-skip"
                                disabled={pending || !sceneReady}
                                aria-label={t('match.skip')}
                                title={t('match.skip')}
                                onClick={() => EventBus.emit('match:skip')}
                            >
                                <HudIcon kind="skip" />
                                <span>{t('match.skip')}</span>
                            </button>
                        </>
                    ) : (
                        <button type="button" className="btn primary bc-result" onClick={() => go('result')}>
                            {t('match.seeResult')}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
