import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    isSubOrder,
    type MatchEvent,
    type MatchOrder,
    type Phase,
    TACTIC_LABEL,
    type Tactic,
} from '../../engine/state';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { PhaserGame } from '../../PhaserGame';
import { PLAYER_COLOR, type PlaybackSpeed, playerTeam, stageLabel, useGame } from '../../store/game-store';
import { Commentator, type CommentLine } from '../commentary';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { MatchHighlight } from '../components/MatchHighlight';
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { simulateMatch } from '../sim-client';
import { plural } from '../text';

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 'highlights', label: 'Lances' },
];

const MAX_TACTIC_CHANGES = 3;
/** A mudança vale ~2 s de jogo à frente (dá tempo de resimular sem pular nada). */
const CHANGE_LEAD_TICKS = 40;
/** No modo "Lances" o ritmo varia (1x perto dos lances, 10x no resto): usa uma média. */
const HIGHLIGHTS_MULT = 6;

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
    // retomando uma partida que ficou no meio: mesmo ponto e mesmas ordens
    const resume = useRef(run?.live?.stage === run?.stage ? (run?.live ?? null) : null).current;
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

    const opponent = run?.opponents[run.stage];
    const colors: [number, number] = [PLAYER_COLOR, opponent?.color ?? 0x3a7bd5];
    const teamNames: [string, string] = [run?.teamName ?? 'Casa', opponent?.name ?? 'Fora'];
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
                      extraSpecies: [...(run?.picks ?? []), ...(opponent?.bench ?? [])].map((p) => p.speciesId),
                      startPaused: true,
                      startTick: resume?.tick || undefined,
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
        const onEnded = () => setEnded(true);
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
        return () => {
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
        // sempre depois da ordem anterior, para a ordem do motor bater com a da tela
        const tick = Math.max(Math.ceil(tickRef.current + leadTicks), (orders.at(-1)?.tick ?? 0) + 1);
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
            if (alive.current) setTacticError('Não deu para mandar a ordem agora.');
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
        return p ? viewInstance(p).displayName : '?';
    };

    const clockLabel =
        clock.phase === 'halftime'
            ? 'Intervalo'
            : clock.phase === 'fulltime' || fulltime || ended
              ? shootout
                  ? `Pênaltis ${shootout[0]} x ${shootout[1]}`
                  : 'Fim de jogo'
              : `${Math.min(40, Math.floor(clock.minute))}' · ${clock.half}º tempo`;

    const finishIntro = () => {
        if (introDoneRef.current) return;
        introDoneRef.current = true;
        setIntroDone(true);
        EventBus.emit('match:resume');
    };

    return (
        <>
            {!introDone && (
                <VersusIntro
                    home={lockedSetup}
                    away={opponent}
                    stage={stageLabel(run.stage)}
                    ready={sceneReady}
                    onDone={finishIntro}
                />
            )}
            <div className="scoreboard">
                <div className="sb-team">
                    <i style={{ background: hex(colors[0]) }} />
                    <span>{teamNames[0]}</span>
                </div>
                <div className="sb-score">
                    {clock.score[0]} x {clock.score[1]}
                    <span className="sb-clock">
                        <span className="sb-stage">{stageLabel(run.stage)} · </span>
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
                        <PlayerInspect
                            match={match}
                            setups={[lockedSetup, opponent]}
                            tactics={[currentTactic, opponent.tactic]}
                        />
                    </div>
                    {pendingSub && (
                        <div className="sub-pending">
                            Substituição na próxima saída de bola: sai <b>{nameOf(pendingSub.outUid)}</b>, entra{' '}
                            <b>{nameOf(pendingSub.inUid)}</b>
                        </div>
                    )}
                    {subOpen && canSub && (
                        <div className="panel sub-panel">
                            <div className="sub-head">
                                <b>{subOut ? `Quem entra no lugar de ${nameOf(subOut)}?` : 'Quem sai?'}</b>
                                <button
                                    type="button"
                                    className="btn small ghost"
                                    onClick={() => (subOut ? setSubOut(null) : setSubOpen(false))}
                                >
                                    {subOut ? 'Voltar' : 'Fechar'}
                                </button>
                            </div>
                            <div className="sub-list">
                                {(subOut ? benchNow : onField).map((uid) => {
                                    const p = byUid.get(uid);
                                    if (!p) return null;
                                    return (
                                        <button
                                            key={uid}
                                            type="button"
                                            className="sub-pick"
                                            onClick={() => (subOut ? orderSub(subOut, uid) : setSubOut(uid))}
                                        >
                                            <img className="pixel" src={cardSprite(p)} alt="" />
                                            <span>{nameOf(uid)}</span>
                                            <small>{viewInstance(p).overall}</small>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {sceneSlow && !sceneReady && (
                        <button type="button" className="btn yellow" onClick={() => setSceneKey((k) => k + 1)}>
                            A quadra não carregou — recarregar
                        </button>
                    )}
                    <div className="controls">
                        <div className="control-group">
                            {SPEEDS.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    className={`btn small${settings.speed === s.value ? ' active' : ''}`}
                                    disabled={!sceneReady}
                                    onClick={() => setSpeed(s.value)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="control-group">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`btn small${currentTactic === t ? ' active' : ''}`}
                                    disabled={
                                        !canChangeTactic ||
                                        (changes.length >= MAX_TACTIC_CHANGES && currentTactic !== t)
                                    }
                                    onClick={() => changeTactic(t)}
                                >
                                    {TACTIC_LABEL[t]}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`btn small yellow${subOpen ? ' active' : ''}`}
                                disabled={!canSub}
                                onClick={() => setSubOpen((v) => !v)}
                            >
                                Substituir
                            </button>
                            {tacticError && <span className="error-text tactic-left">{tacticError}</span>}
                            <span className="muted tactic-left">
                                {pending
                                    ? 'mudando…'
                                    : plural(
                                          MAX_TACTIC_CHANGES - changes.length,
                                          'mudança de tática',
                                          'mudanças de tática',
                                      )}
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
                                    Pular para o fim
                                </button>
                            ) : (
                                <button type="button" className="btn primary" onClick={() => go('result')}>
                                    Ver resultado
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
                        Narração {feedOpen ? '▲' : '▼'}
                    </button>
                    {lines.length === 0 && <span className="muted">Os times entram em quadra…</span>}
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
