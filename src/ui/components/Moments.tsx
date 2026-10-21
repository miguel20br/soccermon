import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ENGINE_VERSION } from '../../engine/config';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { clubName, cupStageName, fmt, moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { PhaserGame } from '../../PhaserGame';
import { type RunState, useGame } from '../../store/game-store';
import { rivalColor } from '../../store/profile';
import { ClipRecorder, clipExt, clipMime } from '../clip-recorder';
import { cupGoal, goalMoment, type Moment, pickMoments } from '../moments';
import { bannerText, useClubColor } from '../profile/club';
import { reduceMotionOn } from '../settings-sync';
import { downloadBlob } from '../share-card';
import { simulateMatch } from '../sim-client';
import { cardSprite } from './PokeCard';
import './moments.css';
import { HudIcon } from './MatchHud';

type Mode = 'watch' | 'record' | 'clip';

/** Legenda do lance: "GOL! Pikachu 38' · Thunderbolt" (tela e clipe). */
export function momentCaption(m: Moment, kind: Record<Moment['kind'], string>) {
    const move = m.moveId && m.kind !== 'evolve' ? ` · ${moveName(m.moveId)}` : '';
    return `${kind[m.kind]}${m.kind === 'goal' ? '!' : ' ·'} ${m.name} ${m.minute}'${move}`;
}

/**
 * Melhores momentos: toca os lances da partida (gols, defesaças, trave, golpes fortes, evolução) com câmera lenta no
 * clímax, usando os snapshots da própria partida. "Exportar clipe" toca o lance da tela de novo gravando o 9:16.
 */
export function Moments({
    result,
    clips,
    names,
    colors,
    cup = false,
    banners,
    onClose,
}: {
    result: MatchResult;
    clips: Moment[];
    names: [string, string];
    colors: [number, number];
    /** Gol da copa (etiqueta própria no clipe). */
    cup?: boolean;
    banners?: [string | null, string | null];
    onClose: () => void;
}) {
    const { t, d } = useT();
    const settings = useGame((s) => s.settings);
    const [mode, setMode] = useState<Mode>('watch');
    /** Remonta a cena (voltar no replay = tocar de novo do começo). */
    const [run, setRun] = useState(0);
    const [index, setIndex] = useState(0);
    const [done, setDone] = useState(false);
    const [progress, setProgress] = useState(0);
    const [clip, setClip] = useState<{ blob: Blob; url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const recorder = useRef<ClipRecorder | null>(null);
    const mime = useMemo(clipMime, []);
    /** Lance gravado (o que estava na tela quando tocou em Exportar). */
    const [recIndex, setRecIndex] = useState(0);
    const current = clips[mode === 'watch' ? index : recIndex];

    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena lê os dados na montagem; `run` remonta
    const sceneData = useMemo<MatchSceneData>(() => {
        const reduce = reduceMotionOn(settings.reduceMotion);
        return {
            result,
            colors,
            cries: settings.cries,
            speed: 1,
            cinematic: !reduce,
            // no clipe, nada de nome em cima dos Pokémon (o nome vem na legenda)
            namesOnField: mode === 'record' ? 'none' : settings.namesOnField,
            arrowSize: settings.arrowSize,
            chanceSpeed: 1,
            reduceMotion: reduce,
            banners,
            replay: { clips: mode === 'record' ? [clips[recIndex]] : clips.slice(index) },
        };
    }, [run]);

    useEffect(() => {
        const onClip = (i: number) => {
            if (mode === 'watch') setIndex((at) => at + (i > 0 ? 1 : 0));
        };
        const onDone = () => {
            if (mode === 'record') recorder.current?.finish();
            else setDone(true);
        };
        const onTick = (tk: { tick: number }) => {
            if (mode !== 'record') return;
            const c = clips[recIndex];
            setProgress(Math.max(0, Math.min(0.95, (tk.tick - c.from) / Math.max(1, c.to - c.from))));
        };
        const onReady = (scene: ConstructorParameters<typeof ClipRecorder>[0]) => {
            if (mode !== 'record' || !mime) return;
            const c = clips[recIndex];
            const rec = new ClipRecorder(
                scene,
                {
                    names,
                    colors,
                    tag: cup ? t('moments.tagCup') : t('moments.tag'),
                    caption: momentCaption(c, d.moments.kind),
                    site: 'soccermon.com',
                },
                mime,
            );
            recorder.current = rec;
            rec.start().then(
                (blob) => {
                    setClip({ blob, url: URL.createObjectURL(blob) });
                    setProgress(1);
                    setMode('clip');
                },
                () => {
                    setError(t('moments.failed'));
                    setMode('watch');
                },
            );
        };
        EventBus.on('replay:clip', onClip);
        EventBus.on('replay:done', onDone);
        EventBus.on('match:tick', onTick);
        EventBus.on('current-scene-ready', onReady);
        return () => {
            EventBus.off('replay:clip', onClip);
            EventBus.off('replay:done', onDone);
            EventBus.off('match:tick', onTick);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [mode, recIndex, clips, mime, names, colors, cup, t, d]);

    // saindo no meio da gravação: para sem gerar arquivo; o clipe pronto libera a memória
    useEffect(() => () => recorder.current?.cancel(), []);
    useEffect(
        () => () => {
            if (clip) URL.revokeObjectURL(clip.url);
        },
        [clip],
    );
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const restart = (from = 0) => {
        setIndex(from);
        setDone(false);
        setMode('watch');
        setRun((r) => r + 1);
    };
    const record = () => {
        setError(null);
        setProgress(0);
        setRecIndex(index);
        setMode('record');
        setRun((r) => r + 1);
    };
    const next = () => EventBus.emit('replay:next');
    const file =
        clip && mime ? new File([clip.blob], `soccermon-lance.${clipExt(mime)}`, { type: clip.blob.type }) : null;
    const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    const share = async () => {
        if (!file) return;
        try {
            await navigator.share({ files: [file], text: t('moments.shareText') });
        } catch {
            // cancelou o menu nativo
        }
    };

    // no body: dentro da tela de resultado o painel animado vira o "fixed" dele e o modal sai do lugar
    return createPortal(
        <div className="modal-backdrop moments-backdrop" role="presentation">
            <div
                className="modal panel moments-modal"
                role="dialog"
                aria-modal="true"
                aria-label={cup ? t('moments.cup.h') : t('moments.title')}
            >
                <button type="button" className="modal-close" onClick={onClose} aria-label={t('moments.close')}>
                    <HudIcon kind="close" />
                </button>
                <div className="bc-screenhead moments-head">
                    <span className="bc-tag">
                        {cup ? t('moments.cup.h') : t('moments.of', { n: index + 1, total: clips.length })}
                    </span>
                    <h2>{current ? momentCaption(current, d.moments.kind) : ''}</h2>
                </div>

                {mode === 'clip' && clip ? (
                    <div className="moments-clip">
                        <video src={clip.url} controls autoPlay muted loop playsInline />
                        <p className="muted">
                            {t('moments.ready')} · {(clip.blob.size / 1e6).toFixed(1)} MB
                        </p>
                        <div className="row moments-actions">
                            <button
                                type="button"
                                className="btn outline"
                                onClick={() => file && downloadBlob(file, file.name)}
                            >
                                {t('moments.download')}
                            </button>
                            {canShare && (
                                <button type="button" className="btn primary" onClick={share}>
                                    {t('moments.share')}
                                </button>
                            )}
                            <button type="button" className="btn ghost" onClick={() => restart(recIndex)}>
                                {t('moments.back')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="moments-court">
                            <PhaserGame key={run} data={sceneData} />
                        </div>
                        {mode === 'record' ? (
                            <div className="moments-rec" role="status">
                                <div className="moments-bar">
                                    <i style={{ width: `${Math.round(progress * 100)}%` }} />
                                </div>
                                <b>{t('moments.recording', { p: Math.round(progress * 100) })}</b>
                                <small className="muted">{t('moments.recordingNote')}</small>
                            </div>
                        ) : (
                            <div className="row moments-actions">
                                {done ? (
                                    <button type="button" className="btn primary" onClick={() => restart(0)}>
                                        {t('moments.again')}
                                    </button>
                                ) : (
                                    index < clips.length - 1 && (
                                        <button type="button" className="btn primary" onClick={next}>
                                            {t('moments.next')}
                                        </button>
                                    )
                                )}
                                {mime && (
                                    <button type="button" className="btn outline" onClick={record}>
                                        {t('moments.export')}
                                    </button>
                                )}
                                <button type="button" className="btn ghost" onClick={onClose}>
                                    {t('moments.close')}
                                </button>
                            </div>
                        )}
                        {error && <p className="muted moments-error">{error}</p>}
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}

/** Gol da copa (campeão e eliminado): quem, contra quem, por que ele, e o replay em câmera lenta quando dá. */
export function CupGoalCard({ run, match }: { run: RunState; match: MatchResult | null }) {
    const { t, d } = useT();
    const clubColor = useClubColor();
    const profile = useGame((s) => s.profile);
    const pick = useMemo(() => cupGoal(run.results), [run.results]);
    const [open, setOpen] = useState<{ result: MatchResult; clip: Moment } | null>(null);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    if (!pick) return null;
    const stage = run.results.find((r) => r.stage === pick.stage);
    const opponent = run.opponents[pick.stage];
    if (!stage || !opponent) return null;
    // a partida da tela já está na memória; as outras rodam de novo (mesma seed, time e ordens = mesma partida)
    const live = pick.stage === run.stage && !!match?.snapshots.length;
    const replay = stage.replay?.engine === ENGINE_VERSION ? stage.replay : null;
    const colors: [number, number] = [clubColor, rivalColor(clubColor, opponent.color ?? 0x3a7bd5)];
    const names: [string, string] = [run.teamName, clubName(opponent.name)];
    const tx = d.moments.cup.reason;
    const reasons = pick.reasons.map((r) => {
        switch (r.kind) {
            case 'move':
                return fmt(tx.move, { move: moveName(r.moveId) });
            case 'distance':
                return fmt(tx.distance, { m: r.meters });
            case 'late':
            case 'final':
                return tx[r.kind];
            default:
                return fmt(tx[r.kind], { min: r.minute });
        }
    });
    const watch = async () => {
        setFailed(false);
        setBusy(true);
        try {
            const result =
                live && match
                    ? match
                    : replay
                      ? await simulateMatch(replay.team, opponent, `${run.seed}-stage-${pick.stage}`, replay.orders)
                      : null;
            // conferência: se a partida não saiu igual (motor mudou sem subir a versão), não mostra lance errado
            const clip = result && result.score.join() === stage.score.join() ? goalMoment(result, pick.goalNo) : null;
            if (result && clip) setOpen({ result, clip });
            else setFailed(true);
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };
    return (
        <section className="bc-surface bc-stripe cupgoal" aria-label={t('moments.cup.h')}>
            <img
                className="pixel"
                src={cardSprite({
                    speciesId: pick.goal.speciesId,
                    shiny: !!run.picks.find((p) => p.uid === pick.goal.uid)?.shiny,
                })}
                alt=""
            />
            <span className="bc-lbl">{t('moments.cup.h')}</span>
            <span className="cupgoal-line">
                {t('moments.cup.line', {
                    name: pick.goal.name,
                    team: clubName(stage.opponent),
                    stage: cupStageName(run, pick.stage),
                    min: pick.goal.minute,
                })}
            </span>
            <span className="muted cupgoal-why">
                {t('moments.cup.why', { reasons: reasons.join(', ') || tx.plain })}
            </span>
            <small className="muted cupgoal-rule">{t('moments.cup.rule')}</small>
            {live || replay ? (
                <button type="button" className="btn outline" onClick={watch} disabled={busy}>
                    <HudIcon kind="play" /> {busy ? t('moments.loading') : t('moments.cup.watch')}
                </button>
            ) : (
                <small className="muted cupgoal-rule">{t('moments.cup.old')}</small>
            )}
            {failed && <small className="muted cupgoal-rule">{t('moments.loadFailed')}</small>}
            {open && (
                <Moments
                    result={open.result}
                    clips={[open.clip]}
                    names={names}
                    colors={colors}
                    cup
                    banners={[bannerText(profile.banner, run.teamName || profile.clubName), null]}
                    onClose={() => setOpen(null)}
                />
            )}
        </section>
    );
}

/** Botão "Melhores momentos" da tela de resultado: só aparece se a partida tem snapshots e algum lance. */
export function MomentsButton({ run, match }: { run: RunState; match: MatchResult }) {
    const { t } = useT();
    const clubColor = useClubColor();
    const profile = useGame((s) => s.profile);
    const clips = useMemo(() => pickMoments(match), [match]);
    const [open, setOpen] = useState(false);
    if (!clips.length) return null;
    const opponent = run.opponents[run.stage];
    const colors: [number, number] = [clubColor, rivalColor(clubColor, opponent?.color ?? 0x3a7bd5)];
    const names: [string, string] = [run.teamName, opponent ? clubName(opponent.name) : t('match.away')];
    return (
        <>
            {/* 2ª ação da tela de fim: contorno (o vermelho é o Nova copa / Escolher recompensa da barra) */}
            <button type="button" className="btn outline" onClick={() => setOpen(true)}>
                <HudIcon kind="play" /> {t('moments.open')}
            </button>
            {open && (
                <Moments
                    result={match}
                    clips={clips}
                    names={names}
                    colors={colors}
                    banners={[bannerText(profile.banner, run.teamName || profile.clubName), null]}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
