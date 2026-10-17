import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5, MAX_TACTIC_CHANGES } from '../../engine/config';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { CORNER_PLANS } from '../../engine/runners/live-runner';
import {
    type CornerOrder,
    type CornerPlan,
    isCornerOrder,
    isTacticOrder,
    type MatchEvent,
    type Phase,
    SNAP_STRIDE,
    TACTIC_LABEL,
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
    SIDE,
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
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { snapAt } from '../match-view';
import { ratingAt } from '../rating';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';
import { EmoteBar, EmoteBubbles } from './Emotes';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

interface Clock {
    tick: number;
    minute: number;
    half: number;
    score: [number, number];
    phase: Phase;
}

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
    const { t, tn, d } = useT();
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
    const [feedOpen, setFeedOpen] = useState(false);
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const tickRef = useRef(0);

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

    const htLeft = useCountdown(halftime ? s.halftime?.until : undefined);
    const askLeft = useCountdown(s.speedAsk?.until);

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

    const clockLabel =
        clock.phase === 'halftime'
            ? t('match.halftime')
            : shootout
              ? t('match.penalties', { a: shootout[0], b: shootout[1] })
              : clock.phase === 'fulltime' || ended
                ? t('match.fulltime')
                : t('match.clock', {
                      min: Math.min(40, Math.floor(clock.minute)),
                      half: d.match.half[clock.half - 1] ?? '',
                  });
    const speedLabel = (sp: PlaybackSpeed) => (sp === 'highlights' ? t('match.highlights') : `${sp}x`);
    const htReady = s.halftime?.ready;
    const awayRival = !online[rivalRole];

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
                    awayLabel={rivalName}
                />
            )}
            <div className="scoreboard duel-board">
                <div className="sb-team">
                    <i style={{ background: hex(colors[0]) }} />
                    <span className="sb-name">{teamNames[0]}</span>
                </div>
                <div className="sb-score">
                    <b
                        key={`h${clock.score[0]}`}
                        className="sb-n"
                        style={{ '--tc': hex(colors[0]) } as React.CSSProperties}
                    >
                        {clock.score[0]}
                    </b>{' '}
                    x{' '}
                    <b
                        key={`a${clock.score[1]}`}
                        className="sb-n"
                        style={{ '--tc': hex(colors[1]), '--pop': 1.2 } as React.CSSProperties}
                    >
                        {clock.score[1]}
                    </b>
                    <span className="sb-clock" data-testid="duel-clock">
                        {clockLabel}
                    </span>
                </div>
                <div className="sb-team away">
                    <span>{teamNames[1]}</span>
                    <i style={{ background: hex(colors[1]) }} />
                </div>
                <EmoteBubbles mySide={side === 0 ? 'left' : 'right'} />
            </div>

            {s.speedAsk && (
                <div className="duel-banner" role="status">
                    {s.speedAsk.by === role ? (
                        t('duel.match.asked', { speed: speedLabel(s.speedAsk.speed) })
                    ) : (
                        <>
                            <span>
                                {t('duel.match.speedAsk', { name: rivalName, speed: speedLabel(s.speedAsk.speed) })} (
                                {askLeft})
                            </span>
                            <button
                                type="button"
                                className="btn small primary"
                                onClick={() => duel.dispatch({ k: 'speedAnswer', yes: true })}
                            >
                                {t('duel.match.accept')}
                            </button>
                            <button
                                type="button"
                                className="btn small ghost"
                                onClick={() => duel.dispatch({ k: 'speedAnswer', yes: false })}
                            >
                                {t('duel.match.decline')}
                            </button>
                        </>
                    )}
                </div>
            )}
            {suspect && <div className="duel-banner warn">{t('duel.match.suspect')}</div>}

            <div className="match-layout">
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
                    </div>
                    {halftime && (
                        <HalftimePanel
                            match={match}
                            names={teamNames}
                            side={side}
                            nameOf={(idx) => {
                                const ht = match.events.find((e) => e.type === 'halftime')?.tick ?? 0;
                                const ko = match.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? ht;
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
                        <div className="panel sub-panel">
                            <div className="sub-head">
                                <b>{subOut ? t('match.whoIn', { name: nameOf(subOut) }) : t('match.whoOut')}</b>
                                <button
                                    type="button"
                                    className="btn small ghost"
                                    onClick={() => (subOut ? setSubOut(null) : setSubOpen(false))}
                                >
                                    {subOut ? t('common.ui.back') : t('common.ui.close')}
                                </button>
                            </div>
                            <div className="sub-list">
                                {(subOut ? benchNow : onField).map((uid) => {
                                    const p = byUid.get(uid);
                                    if (!p) return null;
                                    const slot = onField.indexOf(subOut ?? uid);
                                    const role2 = slots[slot];
                                    const r = role2 ? ratingAt(p, role2) : null;
                                    const energy = subOut ? null : energyAt(slot);
                                    return (
                                        <button
                                            key={uid}
                                            type="button"
                                            className="sub-pick"
                                            onClick={() => {
                                                if (!subOut) return setSubOut(uid);
                                                setSubOpen(false);
                                                setSubOut(null);
                                                order({ kind: 'sub', outUid: subOut, inUid: uid });
                                            }}
                                        >
                                            <img className="pixel" src={cardSprite(p)} alt="" />
                                            <span>{nameOf(uid)}</span>
                                            <small className={`slot-rating ${r?.fit ?? ''}`}>
                                                {role2 && `${d.common.pos[role2]} `}
                                                {r?.display ?? viewInstance(p).overall}
                                            </small>
                                            {energy !== null && (
                                                <i
                                                    className="sub-energy"
                                                    style={{ '--e': energy } as React.CSSProperties}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="controls">
                        <div className="control-group">
                            {DUEL_SPEEDS.map((sp) => (
                                <button
                                    key={String(sp)}
                                    type="button"
                                    className={`btn small${s.speed === sp ? ' active' : ''}`}
                                    disabled={!sceneReady || ended || !!s.speedAsk}
                                    onClick={() => duel.dispatch({ k: 'speed', speed: sp })}
                                >
                                    {speedLabel(sp)}
                                </button>
                            ))}
                        </div>
                        <div className="control-group">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => (
                                <button
                                    key={tc}
                                    type="button"
                                    className={`btn small${currentTactic === tc ? ' active' : ''}`}
                                    disabled={
                                        !canChange ||
                                        (tacticOrders.length >= MAX_TACTIC_CHANGES && currentTactic !== tc)
                                    }
                                    onClick={() => tc !== currentTactic && order({ kind: 'tactic', tactic: tc })}
                                >
                                    {d.common.tactic[tc]}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`btn small yellow${subOpen ? ' active' : ''}`}
                                disabled={!canSub}
                                onClick={() => setSubOpen((v) => !v)}
                            >
                                {t('match.substitute')}
                            </button>
                            <span className="muted tactic-left">
                                {pendingOrder
                                    ? t('match.changing')
                                    : tn('match.tacticChanges', MAX_TACTIC_CHANGES - tacticOrders.length)}
                            </span>
                        </div>
                        <div className="control-group corner-group" title={t('match.cornerHint')}>
                            <span className="corner-label">{t('match.corner')}</span>
                            {CORNER_PLANS.map((pl) => (
                                <button
                                    key={pl}
                                    type="button"
                                    className={`btn small${currentCorner === pl ? ' active' : ''}`}
                                    disabled={
                                        !canChange ||
                                        (cornerOrders.length >= MAX_TACTIC_CHANGES && currentCorner !== pl)
                                    }
                                    onClick={() => pl !== currentCorner && order({ kind: 'corner', corner: pl })}
                                >
                                    {d.common.cornerPlan[pl]}
                                </button>
                            ))}
                        </div>
                        {ended && (
                            <div className="control-group">
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
                    />
                </div>
                <div className={`panel feed${feedOpen ? '' : ' collapsed'}`} aria-live="polite">
                    <button type="button" className="feed-toggle" onClick={() => setFeedOpen((v) => !v)}>
                        {t('match.feed')} {feedOpen ? '▲' : '▼'}
                    </button>
                    {lines.length === 0 && <span className="muted">{t('match.feedEmpty')}</span>}
                    {lines.map((l) => (
                        <div
                            key={l.id}
                            className={`feed-line ${l.tone}`}
                            style={{ ['--team-color' as string]: l.team !== null ? hex(colors[l.team]) : undefined }}
                        >
                            <span className="min">{Math.floor(l.minute)}'</span>
                            {l.text}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
