import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5, MAX_TACTIC_CHANGES } from '../../engine/config';
import { CUP_STAGES } from '../../engine/cup';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    isSubOrder,
    type MatchEvent,
    type MatchOrder,
    type Phase,
    SNAP_STRIDE,
    TACTIC_LABEL,
    type Tactic,
} from '../../engine/state';
import { skinOf } from '../../game/animation-manager';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { clubName, stageName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { PhaserGame } from '../../PhaserGame';
import { liveOf, type PlaybackSpeed, playerTeam, useGame } from '../../store/game-store';
import { rivalColor, tagFromName } from '../../store/profile';
import { Commentator, type CommentLine } from '../commentary';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HalftimePanel } from '../components/HalftimePanel';
import { MatchHighlight } from '../components/MatchHighlight';
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { LeaveConfirm } from '../leave-guard';
import { snapAt } from '../match-view';
import { useClubColor } from '../profile/club';
import { ratingAt } from '../rating';
import { reduceMotionOn } from '../settings-sync';
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

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** De quanto em quanto tempo (real) o ponto da partida é salvo para poder retomar. */
const SAVE_EVERY_MS = 1500;

interface Clock {
    tick: number;
    minute: number;
    half: number;
    score: [number, number];
    phase: Phase;
}

export function Match() {
    const { run, match, settings, updateSettings, recordResult, setMatch, go, saveLive } = useGame();
    const { t, tn, d } = useT();
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
    const alive = useRef(true);
    const [feedOpen, setFeedOpen] = useState(true);
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
        if (subOpen) subPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
    const tacticOrders = orders.filter((o) => !isSubOrder(o));
    const subOrders = orders.filter(isSubOrder);
    const changes = tacticOrders;
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
            EventBus.off('match:halftime', onHalftime);
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [match?.seed]);

    if (!run || !match || !sceneData || !opponent) return null;

    const lockedSetup = run.lockedTeam ? { ...run.lockedTeam, manualSubs: true } : playerTeam(run);
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
    const sendOrder = async (make: (tick: number) => MatchOrder) => {
        // sempre depois da ordem anterior, para a ordem do motor bater com a da tela; no intervalo a partida
        // está parada, então vale já no tick seguinte (a troca acontece no vestiário)
        const htTick = match.events.find((e) => e.type === 'halftime')?.tick;
        const base = halftime && htTick !== undefined ? htTick + 1 : Math.ceil(tickRef.current + leadTicks);
        const tick = Math.max(base, (orders.at(-1)?.tick ?? 0) + 1);
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

    const changeTactic = (tactic: Tactic) => {
        if (!canChangeTactic || tactic === currentTactic || changes.length >= MAX_TACTIC_CHANGES) return;
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
    const slots = formationOf(lockedSetup.formation).slots;
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
    const nameOf = (uid: string) => {
        const p = byUid.get(uid);
        if (!p) return '?';
        const name = viewInstance(p).displayName;
        // quem já evoluiu nesta partida aparece com o nome novo (Graveler → Golem), como na quadra
        const evo = match.events.find((e) => e.type === 'evolve' && e.uid === uid && e.tick <= tickRef.current);
        return evo?.type === 'evolve' && name === species(evo.from).name ? species(evo.into).name : name;
    };

    const clockLabel =
        clock.phase === 'halftime'
            ? t('match.halftime')
            : clock.phase === 'fulltime' || fulltime || ended
              ? shootout
                  ? t('match.penalties', { a: shootout[0], b: shootout[1] })
                  : t('match.fulltime')
              : t('match.clock', {
                    min: Math.min(40, Math.floor(clock.minute)),
                    half: d.match.half[clock.half - 1] ?? '',
                });
    const stage = stageName(run.stage) || t('match.cup');

    const finishIntro = () => {
        if (introDoneRef.current) return;
        introDoneRef.current = true;
        setIntroDone(true);
        EventBus.emit('match:resume');
    };

    return (
        <>
            {!introDone && (
                <VersusIntro home={lockedSetup} away={opponent} stage={stage} ready={sceneReady} onDone={finishIntro} />
            )}
            <div className="scoreboard" ref={scoreboardRef}>
                <div className="sb-team">
                    <i style={{ background: hex(colors[0]) }} />
                    <span className={`sb-name${teamNames[0].length > 10 ? ' has-tag' : ''}`}>{teamNames[0]}</span>
                    {teamNames[0].length > 10 && (
                        <span className="sb-tag" title={teamNames[0]}>
                            {homeTag}
                        </span>
                    )}
                </div>
                <div className="sb-score">
                    {/* key muda no gol: o número remonta e dá o pulo com o brilho da cor do time (sb-pop) */}
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
                    <span className="sb-clock">
                        <span className="sb-stage">{stage} · </span>
                        {clockLabel}
                    </span>
                </div>
                <div className="sb-team away">
                    <span>{teamNames[1]}</span>
                    <i style={{ background: hex(colors[1]) }} />
                </div>
            </div>

            <div className="match-layout">
                <div className="match-main">
                    <div className="pitch-wrap">
                        {fontsReady ? (
                            <PhaserGame key={`${match.seed}-${sceneKey}`} data={sceneData} />
                        ) : (
                            <div className="phaser-container" />
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
                    {halftime && (
                        <div ref={halftimeRef}>
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
                                onContinue={() => {
                                    setHalftime(false);
                                    EventBus.emit('match:resume');
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
                    {subOpen && canSub && (
                        <div className="panel sub-panel" ref={subPanelRef}>
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
                                    // quem sai: posição e fôlego agora; quem entra: a nota na vaga de quem sai
                                    const slot = onField.indexOf(subOut ?? uid);
                                    const role = slots[slot];
                                    const r = role ? ratingAt(p, role) : null;
                                    const energy = subOut ? null : energyAt(slot);
                                    return (
                                        <button
                                            key={uid}
                                            type="button"
                                            className="sub-pick"
                                            onClick={() => (subOut ? orderSub(subOut, uid) : setSubOut(uid))}
                                        >
                                            <img className="pixel" src={cardSprite(p)} alt="" />
                                            <span>{nameOf(uid)}</span>
                                            <small className={`slot-rating ${r?.fit ?? ''}`}>
                                                {role && `${d.common.pos[role]} `}
                                                {r?.display ?? viewInstance(p).overall}
                                            </small>
                                            {energy !== null && (
                                                <i
                                                    className="sub-energy"
                                                    title={t('team.panel.staminaPct', { n: Math.round(energy * 100) })}
                                                    style={{ '--e': energy } as React.CSSProperties}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {sceneSlow && !sceneReady && (
                        <button type="button" className="btn yellow" onClick={() => setSceneKey((k) => k + 1)}>
                            {t('match.reload')}
                        </button>
                    )}
                    <div className="controls">
                        <div className="control-group">
                            {SPEEDS.map((s) => (
                                <button
                                    key={String(s.value)}
                                    type="button"
                                    className={`btn small${settings.speed === s.value ? ' active' : ''}`}
                                    disabled={!sceneReady}
                                    onClick={() => setSpeed(s.value)}
                                    title={s.value === 'highlights' ? t('match.highlightsHint') : undefined}
                                >
                                    {s.label || t('match.highlights')}
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
                                        !canChangeTactic ||
                                        (changes.length >= MAX_TACTIC_CHANGES && currentTactic !== tc)
                                    }
                                    onClick={() => changeTactic(tc)}
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
                            {tacticError && <span className="error-text tactic-left">{tacticError}</span>}
                            <span className="muted tactic-left">
                                {pending
                                    ? t('match.changing')
                                    : tn('match.tacticChanges', MAX_TACTIC_CHANGES - changes.length)}
                            </span>
                        </div>
                        <div className="control-group">
                            {!ended ? (
                                <button
                                    type="button"
                                    className="btn small ghost"
                                    disabled={pending || !sceneReady}
                                    onClick={() => EventBus.emit('match:skip')}
                                >
                                    {t('match.skip')}
                                </button>
                            ) : (
                                <button type="button" className="btn primary" onClick={() => go('result')}>
                                    {t('match.seeResult')}
                                </button>
                            )}
                        </div>
                    </div>
                    <TeamPanel
                        match={match}
                        setups={[lockedSetup, opponent]}
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
