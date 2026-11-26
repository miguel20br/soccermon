import type { CSSProperties } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { duelWins } from '../../store/duels';
import { useGame } from '../../store/game-store';
import type { Mission } from '../../store/missions';
import { titleClass } from '../../store/title-codes';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { openCardEditor } from '../doors';
import { Sheet } from '../kit/Sheet';
import { missionText, titleName, trainerName } from '../profile/club';
import { MedalsTab } from '../profile/Medals';
import { MissionHow, MissionSummary, TrainerSprite, useSaveView } from '../profile/TrainerTab';
import { closestMissions, type PathStep, trainerPath } from './metas';
import '../profile/profile.css';
import '../profile/armario.css';

/** O prêmio de uma missão: o treinador (sprite) ou, sem treinador, o título (coroa). */
function MissionPrize({ m }: { m: Mission }) {
    return m.trainer ? <TrainerSprite id={m.trainer} /> : <HudIcon kind="crown" />;
}

/** Nome curto do prêmio do passo (o treinador, o título, o cinturão ou a sala). */
function usePrizeName() {
    const { t, d } = useT();
    return (s: PathStep) =>
        s.prize.kind === 'mission'
            ? s.prize.m.trainer
                ? trainerName(s.prize.m.trainer)
                : titleName(s.prize.m.title ?? '')
            : s.prize.kind === 'belt'
              ? t('trophies.belt', { n: s.goal })
              : d.trophies.level[s.prize.level];
}

/**
 * Caminho do treinador (revamp-ui.md, decisão 7): a estrada de prêmios de lado (os últimos ganhos, você, os próximos),
 * com o prêmio de cada passo à vista e o próximo em destaque. Tocar num passo mostra embaixo como chegar nele.
 */
function TrainerPath() {
    const { t, d } = useT();
    const view = useSaveView();
    const order = useGame((s) => s.profile.missionsDone);
    const wins = useGame((s) => duelWins(s.records, s.duels));
    const titles = useGame((s) => Math.max(s.records.titles, s.hall.length));
    const { steps, next } = useMemo(() => trainerPath(view, order, wins, titles), [view, order, wins, titles]);
    const [sel, setSel] = useState(next >= 0 ? next : steps.length - 1);
    const road = useRef<HTMLOListElement>(null);
    const prizeName = usePrizeName();
    // abre com o próximo no meio da estrada (posição inicial, sem rolar animado)
    // biome-ignore lint/correctness/useExhaustiveDependencies: só na abertura
    useLayoutEffect(() => {
        const el = road.current?.children[next] as HTMLElement | undefined;
        if (road.current && el)
            road.current.scrollLeft = el.offsetLeft - (road.current.clientWidth - el.offsetWidth) / 2;
    }, []);
    const s = steps[sel];
    if (!s) return <p className="muted">{t('profile.path.allDone')}</p>;
    const kind =
        s.prize.kind === 'belt'
            ? t('profile.path.belt')
            : s.prize.kind === 'room'
              ? t('profile.path.room')
              : s.prize.m.trainer
                ? t('profile.path.trainer')
                : t('profile.path.titleKind');
    return (
        <section className="tp" aria-label={t('profile.path.title')}>
            <h3 className="bc-lbl">{t('profile.path.title')}</h3>
            <ol className="tp-road" ref={road}>
                {steps.map((x, i) => (
                    <li key={x.id} className={`tp-step${x.done ? ' done' : ''}${i === next ? ' next' : ''}`}>
                        <button
                            type="button"
                            aria-pressed={i === sel}
                            className={i === sel ? 'picked' : undefined}
                            onClick={() => setSel(i)}
                        >
                            {i === next && <em className="tp-tag">{t('profile.path.next')}</em>}
                            <span className="tp-ic">
                                {x.prize.kind === 'mission' ? (
                                    <MissionPrize m={x.prize.m} />
                                ) : x.prize.kind === 'belt' ? (
                                    <PixelTrophy kind="cinturao" metal={x.prize.metal} />
                                ) : (
                                    <HudIcon kind="building" />
                                )}
                            </span>
                            {/* na estrada o cinturão vai só com o metal (o desenho já diz o que é) */}
                            <b>{x.prize.kind === 'belt' ? d.common.metal[x.prize.metal] : prizeName(x)}</b>
                            <small className="k-num">{x.done ? <HudIcon kind="check" /> : `${x.n}/${x.goal}`}</small>
                        </button>
                    </li>
                ))}
            </ol>
            <div className={`tp-detail${s.done ? ' done' : ''}`} key={s.id} aria-live="polite">
                <span className="pf-trarity">
                    {s.done ? t('profile.path.done') : sel === next ? t('profile.path.next') : t('profile.path.prize')}
                    {` · ${kind}`}
                </span>
                <b>{prizeName(s)}</b>
                {s.prize.kind === 'mission' && s.prize.m.trainer && s.prize.m.title && (
                    <small className="tp-plus">
                        {t('profile.path.plusTitle')}{' '}
                        <span className={titleClass(s.prize.m.title).trim() || undefined}>
                            {titleName(s.prize.m.title)}
                        </span>
                    </small>
                )}
                {s.prize.kind === 'mission' ? (
                    <MissionHow m={s.prize.m} view={view} />
                ) : (
                    <>
                        <span className="pf-mission-text">
                            {s.prize.kind === 'belt'
                                ? t('trophies.beltHow', { n: s.goal, have: wins })
                                : t('profile.path.roomHow', { n: s.goal, have: titles })}
                        </span>
                        {!s.done && (
                            <span className="pf-mission-progress">
                                <span className="k-bar">
                                    <i style={{ width: `${(s.n / s.goal) * 100}%` }} />
                                </span>
                                <b className="k-num">
                                    {s.n}/{s.goal}
                                </b>
                            </span>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

/**
 * Metas (menos-e-mais.md, B2): o Caminho do treinador em cima, as missões mais perto de sair (cada uma com o prêmio) e
 * as medalhas embaixo, numa folha só por cima da Sede. Vem num pedaço à parte (o CSS do Perfil só baixa quando abre).
 */
export default function MetasSheet({ onClose, style }: { onClose: () => void; style?: CSSProperties }) {
    const { t } = useT();
    const view = useSaveView();
    const near = useMemo(() => closestMissions(view, 6), [view]);
    const updateProfile = useGame((s) => s.updateProfile);
    return (
        <Sheet open onClose={onClose} title={t('home.amb.sedeMetas')} className="pf pf-sheet sd-metas" style={style}>
            <TrainerPath />
            <MissionSummary />
            <ul className="pf-near">
                {near.map((g) => (
                    <li key={g.m.id}>
                        <span>{missionText(g.m)}</span>
                        {(g.m.trainer || g.m.title) && (
                            <span className="pf-near-prize">
                                <MissionPrize m={g.m} />
                                <span
                                    className={(!g.m.trainer && g.m.title && titleClass(g.m.title).trim()) || undefined}
                                >
                                    {g.m.trainer ? trainerName(g.m.trainer) : titleName(g.m.title ?? '')}
                                </span>
                                {g.m.trainer && g.m.title && (
                                    <small className="muted">
                                        {t('profile.path.plusTitle')} {titleName(g.m.title)}
                                    </small>
                                )}
                            </span>
                        )}
                        <span className="pf-near-bar">
                            <span className="k-bar">
                                <i style={{ width: `${(g.n / g.goal) * 100}%` }} />
                            </span>
                            <b className="k-num">
                                {g.n}/{g.goal}
                            </b>
                        </span>
                    </li>
                ))}
            </ul>
            <MedalsTab save={updateProfile} onEdit={() => openCardEditor('vitrine')} />
        </Sheet>
    );
}
