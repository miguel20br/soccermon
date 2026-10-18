import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    type CornerOrder,
    type CornerPlan,
    isCornerOrder,
    isTacticOrder,
    type MatchEvent,
    SNAP_STRIDE,
    type Tactic,
    type TacticChange,
} from '../../engine/state';
import { skinOf } from '../../game/animation-manager';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { rich, useT } from '../../i18n/react';
import {
    DUEL_SPEEDS,
    isSubStamped,
    leadTicks,
    type OrderBody,
    onFieldAfter,
    ordersOf,
    other,
    type Role,
    SIDE,
    SPEED_ASK_MS,
} from '../../net/duel-state';
import { baseSeedOf, holdTick, openedSegments } from '../../net/seal';
import { duel, roomNow, useDuel } from '../../net/session';
import { PhaserGame } from '../../PhaserGame';
import type { ChanceSpeed, PlaybackSpeed } from '../../store/game-store';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { rivalColor } from '../../store/profile';
import { Commentator, type CommentLine } from '../commentary';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HalftimePanel } from '../components/HalftimePanel';
import { MatchHighlight } from '../components/MatchHighlight';
import {
    type Clock,
    hex,
    MatchFeed,
    Scoreboard,
    SubPanel,
    TacticControls,
    useClockLabel,
} from '../components/MatchHud';
import { PlayerInspect } from '../components/PlayerInspect';
import { Prancheta } from '../components/Prancheta';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { snapAt } from '../match-view';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';
import { EmoteBar, EmoteBubbles } from './Emotes';

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
    const { settings } = useGame();
    const { t } = useT();
    const side = SIDE[role];
    const rivalRole = other(role);
    const rivalPeer = s.peers[rivalRole];
    const rivalName = rivalPeer?.name ?? '';
    const home = s.teams.host!;
    const away = s.teams.guest!;
    const setups: [typeof home, typeof away] = [home, away];
    const myTeam = setups[side];

    const [match, setMatch] = useState<MatchResult | null>(null);
    const simLog = useRef(-1);
    const [simCount, setSimCount] = useState(-1);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    const [sceneReady, setSceneReady] = useState(false);
    const [fontsReady, setFontsReady] = useState(false);
    const [kicked, setKicked] = useState(() => roomNow() >= (s.kickoffAt ?? 0));
    const [halftime, setHalftime] = useState(false);
    const [ended, setEnded] = useState(false);
    const [subsDone, setSubsDone] = useState<string[]>([]);
    const [subOpen, setSubOpen] = useState(false);
    const [subOut, setSubOut] = useState<string | null>(null);
    const [lines, setLines] = useState<(CommentLine & { id: number })[]>([]);
    const lineId = useRef(0);
    const [feedOpen, setFeedOpen] = useState(true);
    const [fulltime, setFulltime] = useState(false);
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const tickRef = useRef(0);
    const scoreboardRef = useRef<HTMLDivElement>(null);
    const halftimeRef = useRef<HTMLDivElement>(null);
    const subPanelRef = useRef<HTMLDivElement>(null);
    // como na copa: celular deitado deixa o placar no topo (a quadra cabe inteira) e o intervalo vem pra tela
    useEffect(() => {
        if (!window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches) return;
        const id = requestAnimationFrame(() => scoreboardRef.current?.scrollIntoView({ block: 'start' }));
        return () => cancelAnimationFrame(id);
    }, []);

    // cores: o seu clube no seu lado, o rival no uniforme reserva se bater
    const mine = myTeam.color;
    const theirs = rivalColor(mine, setups[side === 0 ? 1 : 0].color);
    const colors: [number, number] = side === 0 ? [mine, theirs] : [theirs, mine];
    const teamNames: [string, string] = [home.name, away.name];

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
    const logLen = s.log.length;
    // biome-ignore lint/correctness/useExhaustiveDependencies: o log só cresce; o tamanho diz quando mudou
    useEffect(() => {
        if (!segSeeds?.length) return;
        let alive = true;
        const seeds = segSeeds;
        const last = s.log.at(-1);
        // ordem nova: não passa dela enquanto a partida nova não chega (trecho novo não precisa: a trava do trecho segura)
        if (last && match && logLen > simLog.current) EventBus.emit('match:hold', last.tick);
        // seed por trecho: cada trecho aberto pelos dois muda a sorte dali pra frente (o passado não muda)
        simulateMatch(home, away, baseSeedOf(s.room, s.game), ordersOf(s.log), seeds)
            .then((r) => {
                if (!alive) return;
                duel.result = r;
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
            if (e.type === 'fulltime') setFulltime(true);
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
        if (!duel.playing) EventBus.emit('match:rate', 1);
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
        if (halftime && s.secondHalf && simCount === s.log.length) {
            setHalftime(false);
            setSubOpen(false);
            EventBus.emit('match:resume');
        }
    }, [halftime, s.secondHalf, simCount, s.log.length]);

    useEffect(() => {
        if (halftime) halftimeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [halftime]);
    // painel de substituição (aberto pela prancheta ou pelo botão) pode abrir abaixo da dobra: traz pra tela
    useEffect(() => {
        if (subOpen) subPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [subOpen]);
    const htLeft = useCountdown(halftime ? s.halftime?.until : undefined);
    const kickLeft = useCountdown(kicked ? undefined : s.kickoffAt);
    const clockLabel = useClockLabel(clock, fulltime || ended, shootout);

    if (!match || !sceneData) {
        return (
            <div className="panel duel-wait">
                <span className="duel-spinner" aria-hidden />
                {t('duel.match.sealing')}
            </div>
        );
    }

    const pendingOrder = simCount < s.log.length;
    const mineLog = s.log.filter((o) => o.team === side);
    const tacticOrders = mineLog.filter((o) => isTacticOrder(o)) as TacticChange[];
    const cornerOrders = mineLog.filter((o) => isCornerOrder(o)) as CornerOrder[];
    const currentCorner: CornerPlan = cornerOrders.at(-1)?.corner ?? myTeam.corner ?? 'mixed';
    const subOrders = mineLog.filter(isSubStamped);
    const currentTactic: Tactic = tacticOrders.at(-1)?.tactic ?? myTeam.tactic ?? 'balanced';
    const rivalTactics = s.log.filter((o) => o.team !== side && isTacticOrder(o)) as TacticChange[];
    const rivalTactic: Tactic = rivalTactics.at(-1)?.tactic ?? setups[side === 0 ? 1 : 0].tactic;
    const lead = leadTicks(s.speed);
    const leadMinutes = (lead / (FUTSAL_5.tickRate * FUTSAL_5.halfSeconds)) * FUTSAL_5.displayHalfMinutes;
    const canChange =
        sceneReady &&
        kicked &&
        !pendingOrder &&
        !ended &&
        !fulltime &&
        clock.minute + leadMinutes < FUTSAL_5.displayHalfMinutes * 2 - 1;

    const order = (o: OrderBody) => duel.order(o, halftime);

    // quem está em quadra e no banco agora (escalação + trocas que já aconteceram)
    const byUid = new Map([...myTeam.lineup, ...myTeam.bench].map((p) => [p.uid, p]));
    const done = s.log.filter((o) => !isSubStamped(o) || subsDone.includes(o.inUid));
    const onField = onFieldAfter(myTeam, done, side);
    const usedIn = new Set(subOrders.map((o) => o.inUid));
    const benchNow = myTeam.bench.map((p) => p.uid).filter((u) => !usedIn.has(u));
    const pendingSub = subOrders.find((o) => !subsDone.includes(o.inUid)) ?? null;
    const canSub = canChange && !pendingSub && subOrders.length < myTeam.bench.length && benchNow.length > 0;
    const slots = formationOf(myTeam.formation).slots;
    const myIdx = match.roster.filter((r) => r.team === side).map((r) => r.idx);
    const energyAt = (i: number) => snapAt(match.snapshots, tickRef.current).p[(myIdx[i] ?? 0) * SNAP_STRIDE + 6] ?? 1;
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
    const coach = (p?: typeof myPeer) =>
        p && { name: p.name, title: p.title, avatar: p.avatar, avatarGoogle: p.avatarGoogle };
    const onMine = (uid: string, idx: number | null) => {
        if (canSub) {
            setSubOut(onField.includes(uid) ? uid : null);
            setSubOpen(true);
        } else if (idx !== null) EventBus.emit('match:inspect-request', idx);
    };

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
                    startsIn={kickLeft}
                />
            )}
            <Scoreboard
                boardRef={scoreboardRef}
                className=" duel-board"
                names={teamNames}
                colors={colors}
                score={clock.score}
                clockLabel={clockLabel}
                stage={t('duel.title')}
                homeTag={s.peers.host?.clubTag ?? ''}
            >
                <EmoteBubbles mySide={side === 0 ? 'left' : 'right'} />
            </Scoreboard>
            {suspect && <div className="duel-banner warn">{t('duel.match.suspect')}</div>}

            <div className="match-layout has-board">
                <div className="match-main">
                    <div className="pitch-wrap">
                        {fontsReady ? (
                            <PhaserGame key={String(match.seed)} data={sceneData} />
                        ) : (
                            <div className="phaser-container" />
                        )}
                        <MatchHighlight teamNames={teamNames} colors={[hex(colors[0]), hex(colors[1])]} />
                        <EvolutionOverlay />
                        <PlayerInspect
                            match={match}
                            setups={setups}
                            tactics={side === 0 ? [currentTactic, rivalTactic] : [rivalTactic, currentTactic]}
                        />
                        <SpeedAsk rivalName={rivalName} />
                    </div>
                    {halftime && (
                        <div ref={halftimeRef}>
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
                                onSub={() => setSubOpen(true)}
                                onContinue={() => duel.dispatch({ k: 'htReady' })}
                                footer={
                                    <p className="duel-ht" data-testid="duel-ht">
                                        <b>{t('duel.match.htTimer', { s: htLeft })}</b> ·{' '}
                                        {htReady?.[role] && (htReady?.[rivalRole] || awayRival)
                                            ? t('duel.match.htBoth')
                                            : htReady?.[role]
                                              ? t('duel.match.htWaiting', { name: rivalName })
                                              : ''}
                                    </p>
                                }
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
                            onPick={(outUid, inUid) => {
                                setSubOpen(false);
                                setSubOut(null);
                                order({ kind: 'sub', outUid, inUid });
                            }}
                        />
                    )}
                    <div className="controls">
                        <div className="control-group speed-group duel-speed">
                            <span className="corner-label">{t('duel.match.askSpeed')}</span>
                            {DUEL_SPEEDS.map((sp) => (
                                <button
                                    key={String(sp)}
                                    type="button"
                                    className={`btn small${s.speed === sp ? ' active' : ''}${s.speedAsk?.speed === sp ? ' asking' : ''}`}
                                    data-testid={`speed-ask-${sp}`}
                                    title={
                                        s.speed === sp
                                            ? t('duel.match.speedNow')
                                            : t('duel.match.askHint', { name: rivalName, speed: speedLabel(sp) })
                                    }
                                    disabled={!sceneReady || ended || !!s.speedAsk || s.speed === sp}
                                    onClick={() => duel.dispatch({ k: 'speed', speed: sp })}
                                >
                                    {speedLabel(sp)}
                                </button>
                            ))}
                        </div>
                        <TacticControls
                            tactic={currentTactic}
                            tacticsUsed={tacticOrders.length}
                            corner={currentCorner}
                            cornersUsed={cornerOrders.length}
                            canChange={canChange}
                            pending={pendingOrder}
                            onTactic={(tc) => tc !== currentTactic && order({ kind: 'tactic', tactic: tc })}
                            onCorner={(pl) => pl !== currentCorner && order({ kind: 'corner', corner: pl })}
                            subOpen={subOpen}
                            canSub={canSub}
                            onToggleSub={() => setSubOpen((v) => !v)}
                        />
                        {ended && (
                            <div className="control-group end-group">
                                <button type="button" className="btn primary" onClick={onSeeResult}>
                                    {t('duel.match.seeResult')}
                                </button>
                            </div>
                        )}
                    </div>
                    <EmoteBar />
                    <TeamPanel
                        match={match}
                        setups={setups}
                        tick={clock.tick}
                        teamNames={teamNames}
                        interactive={sceneReady && !ended}
                        side={side}
                    />
                </div>
                <Prancheta
                    match={match}
                    setups={setups}
                    side={side}
                    tick={clock.tick}
                    names={teamNames}
                    selectedUid={subOpen ? subOut : null}
                    onMine={onMine}
                />
                <MatchFeed lines={lines} colors={colors} open={feedOpen} onToggle={() => setFeedOpen((v) => !v)} />
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
