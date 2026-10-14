import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { type MatchEvent, type Phase, TACTIC_LABEL, type Tactic, type TacticChange } from '../../engine/state';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { PhaserGame } from '../../PhaserGame';
import { PLAYER_COLOR, type PlaybackSpeed, playerTeam, stageLabel, useGame } from '../../store/game-store';
import { Commentator, type CommentLine } from '../commentary';
import { MatchHighlight } from '../components/MatchHighlight';
import { VersusIntro } from '../components/VersusIntro';
import { simulateMatch } from '../sim-client';

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

interface Clock {
    tick: number;
    minute: number;
    half: number;
    score: [number, number];
    phase: Phase;
}

export function Match() {
    const { run, match, settings, updateSettings, recordResult, setMatch, go } = useGame();
    const [fontsReady, setFontsReady] = useState(false);
    const [lines, setLines] = useState<(CommentLine & { id: number })[]>([]);
    const lineId = useRef(0);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const [ended, setEnded] = useState(false);
    const [changes, setChanges] = useState<TacticChange[]>([]);
    const [pending, setPending] = useState(false);
    /** A cena Phaser só escuta comandos depois de carregar; até lá os controles ficam travados. */
    const [sceneReady, setSceneReady] = useState(false);
    /** Se a quadra demorar demais (celular fraco, aba em segundo plano), oferece recarregar. */
    const [sceneSlow, setSceneSlow] = useState(false);
    /** Tela de VERSUS antes do apito inicial; a cena espera parada até ela sair. */
    const [introDone, setIntroDone] = useState(false);
    const introDoneRef = useRef(false);
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
    const currentTactic: Tactic = changes.at(-1)?.tactic ?? run?.tactic ?? 'balanced';

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
        const onEvent = (e: MatchEvent) => {
            const line = commentator.lineFor(e);
            if (line) setLines((prev) => [{ ...line, id: lineId.current++ }, ...prev].slice(0, 200));
            if (e.type === 'penalty') setShootout(e.shootout);
            if (e.type === 'fulltime') setFulltime(true);
        };
        const onTick = (t: Clock) => {
            tickRef.current = t.tick;
            setClock(t);
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

    const lockedSetup = run.lockedTeam ?? playerTeam(run);
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

    /** Tática ao vivo: agenda a mudança um pouco à frente e resimula a partida com ela. */
    const changeTactic = async (tactic: Tactic) => {
        if (!canChangeTactic || tactic === currentTactic || changes.length >= MAX_TACTIC_CHANGES) return;
        // sempre depois da troca anterior, para a ordem do motor bater com a da tela
        const tick = Math.max(Math.ceil(tickRef.current + leadTicks), (changes.at(-1)?.tick ?? 0) + 1);
        const schedule = [...changes, { tick, team: 0 as const, tactic }];
        const seed = match.seed;
        setPending(true);
        setTacticError(null);
        EventBus.emit('match:hold', tick);
        try {
            const result = await simulateMatch(lockedSetup, opponent, `${run.seed}-stage-${run.stage}`, schedule);
            if (!alive.current || useGame.getState().match?.seed !== seed) return;
            setChanges(schedule);
            latest.current = result;
            setMatch(result);
            EventBus.emit('match:replace', result);
        } catch {
            // libera o playback com a partida que já estava valendo
            if (alive.current && latest.current) EventBus.emit('match:replace', latest.current);
            if (alive.current) setTacticError('Não deu para trocar a tática agora.');
        } finally {
            if (alive.current) setPending(false);
        }
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
                    </div>
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
                            {tacticError && <span className="error-text tactic-left">{tacticError}</span>}
                            <span className="muted tactic-left">
                                {pending ? 'mudando…' : `${MAX_TACTIC_CHANGES - changes.length} trocas`}
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
