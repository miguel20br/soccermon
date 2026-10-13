import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchEvent, Phase } from '../../engine/state';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { PhaserGame } from '../../PhaserGame';
import { PLAYER_COLOR, type PlaybackSpeed, stageLabel, useGame } from '../../store/game-store';
import { Commentator, type CommentLine } from '../commentary';

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 'highlights', label: 'Só os lances' },
];

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export function Match() {
    const { run, match, settings, updateSettings, recordResult, go } = useGame();
    const [fontsReady, setFontsReady] = useState(false);
    const [lines, setLines] = useState<CommentLine[]>([]);
    const [clock, setClock] = useState<{ minute: number; half: number; score: [number, number]; phase: Phase }>({
        minute: 0,
        half: 1,
        score: [0, 0],
        phase: 'kickoff',
    });
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const [ended, setEnded] = useState(false);
    const recorded = useRef(false);

    const opponent = run?.opponents[run.stage];
    const colors: [number, number] = [PLAYER_COLOR, opponent?.color ?? 0x3a7bd5];
    const teamNames: [string, string] = [run?.teamName ?? 'Casa', opponent?.name ?? 'Fora'];

    // biome-ignore lint/correctness/useExhaustiveDependencies: os dados da cena só importam na montagem da partida
    const sceneData = useMemo<MatchSceneData | null>(
        () => (match ? { result: match, colors, cries: settings.cries, speed: settings.speed } : null),
        [match],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    useEffect(() => {
        if (match && !recorded.current) {
            recorded.current = true;
            recordResult(match);
        }
    }, [match, recordResult]);

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
            if (line) setLines((prev) => [line, ...prev].slice(0, 200));
            if (e.type === 'penalty') setShootout(e.shootout);
        };
        const onTick = (t: typeof clock) => setClock(t);
        const onEnded = () => setEnded(true);
        EventBus.on('match:event', onEvent);
        EventBus.on('match:tick', onTick);
        EventBus.on('match:ended', onEnded);
        return () => {
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
        };
    }, [match]);

    if (!run || !match || !sceneData) return null;

    const setSpeed = (speed: PlaybackSpeed) => {
        updateSettings({ speed });
        EventBus.emit('match:set-speed', speed);
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
                        {stageLabel(run.stage)} · {clockLabel}
                    </span>
                </div>
                <div className="sb-team away">
                    <span>{teamNames[1]}</span>
                    <i style={{ background: hex(colors[1]) }} />
                </div>
            </div>

            <div className="match-layout">
                <div style={{ display: 'grid', gap: 12 }}>
                    {fontsReady ? (
                        <PhaserGame key={match.seed.toString()} data={sceneData} />
                    ) : (
                        <div className="phaser-container" />
                    )}
                    <div className="controls">
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
                        {!ended && (
                            <button
                                type="button"
                                className="btn small ghost"
                                onClick={() => EventBus.emit('match:skip')}
                            >
                                Pular para o fim
                            </button>
                        )}
                        {ended && (
                            <button type="button" className="btn primary" onClick={() => go('result')}>
                                Ver resultado
                            </button>
                        )}
                    </div>
                </div>
                <div className="panel feed" aria-live="polite">
                    {lines.length === 0 && <span className="muted">Os times entram em quadra…</span>}
                    {lines.map((l) => (
                        <div
                            key={`${l.tick}-${l.text}`}
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
