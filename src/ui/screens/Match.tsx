import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { type MatchEvent, type Phase, TACTIC_LABEL, type Tactic, type TacticChange } from '../../engine/state';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { PhaserGame } from '../../PhaserGame';
import { PLAYER_COLOR, type PlaybackSpeed, playerTeam, stageLabel, useGame } from '../../store/game-store';
import { Commentator, type CommentLine } from '../commentary';
import { simulateMatch } from '../sim-client';

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 'highlights', label: 'Lances' },
];

const MAX_TACTIC_CHANGES = 3;
/** A mudança vale ~2 s de jogo à frente (dá tempo de resimular sem pular nada). */
const CHANGE_LEAD_TICKS = 40;

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
                ? { result: match, colors, cries: settings.cries, speed: settings.speed, cinematic: settings.cinematic }
                : null,
        [match?.seed],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

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
        };
        const onTick = (t: Clock) => {
            tickRef.current = t.tick;
            setClock(t);
        };
        const onEnded = () => setEnded(true);
        EventBus.on('match:event', onEvent);
        EventBus.on('match:tick', onTick);
        EventBus.on('match:ended', onEnded);
        return () => {
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
        };
    }, [match?.seed]);

    if (!run || !match || !sceneData || !opponent) return null;

    const setSpeed = (speed: PlaybackSpeed) => {
        updateSettings({ speed });
        EventBus.emit('match:set-speed', speed);
    };

    /** Tática ao vivo: agenda a mudança um pouco à frente e resimula a partida com ela. */
    const changeTactic = async (tactic: Tactic) => {
        if (pending || ended || tactic === currentTactic || changes.length >= MAX_TACTIC_CHANGES) return;
        const speedMult = typeof settings.speed === 'number' ? settings.speed : 4;
        const tick = Math.ceil(tickRef.current + CHANGE_LEAD_TICKS * speedMult);
        const schedule = [...changes, { tick, team: 0 as const, tactic }];
        setPending(true);
        EventBus.emit('match:hold', tick);
        const result = await simulateMatch(playerTeam(run), opponent, `${run.seed}-stage-${run.stage}`, schedule);
        setChanges(schedule);
        latest.current = result;
        setMatch(result);
        EventBus.emit('match:replace', result);
        setPending(false);
    };

    const clockLabel =
        clock.phase === 'halftime'
            ? 'Intervalo'
            : clock.phase === 'fulltime' || ended
              ? shootout
                  ? `Pênaltis ${shootout[0]} x ${shootout[1]}`
                  : 'Fim de jogo'
              : `${Math.min(40, Math.floor(clock.minute))}' · ${clock.half}º tempo`;

    return (
        <>
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
                    {fontsReady ? (
                        <PhaserGame key={match.seed.toString()} data={sceneData} />
                    ) : (
                        <div className="phaser-container" />
                    )}
                    <div className="controls">
                        <div className="control-group">
                            {SPEEDS.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    className={`btn small${settings.speed === s.value ? ' active' : ''}`}
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
                                        pending ||
                                        ended ||
                                        (changes.length >= MAX_TACTIC_CHANGES && currentTactic !== t)
                                    }
                                    onClick={() => changeTactic(t)}
                                >
                                    {TACTIC_LABEL[t]}
                                </button>
                            ))}
                            <span className="muted tactic-left">
                                {pending ? 'mudando…' : `${MAX_TACTIC_CHANGES - changes.length} trocas`}
                            </span>
                        </div>
                        <div className="control-group">
                            {!ended ? (
                                <button
                                    type="button"
                                    className="btn small ghost"
                                    disabled={pending}
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
