import { type CSSProperties, useEffect } from 'react';
import { clubName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { dailyDay } from '../../store/daily';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { eventAt } from '../../store/ultimate/objectives';
import {
    FICHAS,
    GYM_FICHAS_MULT,
    GYM_LEVEL,
    GYMS,
    type Gym,
    PASS_DAY_MAX,
    PASS_GROW_EVERY,
    PASS_MARKS,
    PASS_POINTS,
    PASS_STEP,
    type PassReward,
    passReward,
} from '../../store/ultimate/rules';
import { gymCount, nextSeason, seasonAt, seasonN } from '../../store/ultimate/season';
import { gymReady, passCardUid, type UltimateSave } from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { metalLabel } from '../rarity';
import { hms, useNow } from './clock';

/**
 * Temporada do Time Ultimate (0.9.33): a faixa com a contagem até o fim (e o evento no ar), o passe grátis, os
 * desafios dos líderes e o legado que fica no Perfil. Os números vêm de rules.ts (proposta, falta o ok do Miguel).
 */

/** A faixa da temporada embaixo da carteira; também faz a virada quando o relógio passa do fim. */
export function SeasonBar() {
    const { t, d } = useT();
    const now = useNow();
    const n = seasonN(now);
    const roll = useGame((s) => s.ultimateSeason);
    // virou a temporada (ou a partida aberta acabou): zera o modo e guarda o legado
    const live = useGame((s) => !!s.ultimate.live);
    // biome-ignore lint/correctness/useExhaustiveDependencies: `n` e `live` são o gatilho da virada
    useEffect(() => roll(), [n, live, roll]);
    const season = seasonAt(now);
    const next = nextSeason(now);
    const event = eventAt(now);
    const ended = !!season && now >= season.end && !next;
    return (
        <section className="panel ut-season bc-surface bc-stripe">
            <span className="ut-season-main">
                <HudIcon kind="crown" />
                <b>{season ? t('ultimate.season.title', { n: season.n }) : t('ultimate.season.previewTag')}</b>
                {season && <small>{d.ultimate.season.theme[season.theme]}</small>}
            </span>
            <small className="ut-timer">
                <HudIcon kind="stopwatch" />
                {season
                    ? ended
                        ? t('ultimate.season.ended')
                        : t('ultimate.season.ends', {
                              time: hms(Math.min(season.end, next?.start ?? season.end) - now),
                          })
                    : next && t('ultimate.season.preview', { time: hms(next.start - now) })}
            </small>
            {event && (
                <small className="ut-season-event">
                    <HudIcon kind="sparkle" />
                    {t('ultimate.event.title', { name: d.ultimate.events[event.id] ?? event.id })} ·{' '}
                    {t('ultimate.event.ends', { time: hms(event.end - now) })}
                </small>
            )}
        </section>
    );
}

/** O prêmio de um marco, em texto ("+100 Fichas", "Carta de abertura"). */
export function useMarkText() {
    const { t, tn } = useT();
    return (r: PassReward) =>
        [
            r.card === 'card' ? t('ultimate.pass.reward.card') : '',
            r.card === 'grow' ? t('ultimate.pass.reward.grow') : '',
            r.fichas ? t('ultimate.pass.reward.fichas', { n: r.fichas }) : '',
            r.packs ? tn('ultimate.pass.reward.packs', r.packs) : '',
            r.big ? tn('ultimate.pass.reward.big', r.big) : '',
        ]
            .filter(Boolean)
            .join(' · ');
}

/** Passe grátis da temporada: pontos, marco, teto do dia, a carta de abertura e os próximos marcos. */
export function Pass() {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const text = useMarkText();
    const p = u.pass;
    const day = dailyDay(new Date(now));
    const today = p.day === day ? p.today : 0;
    const done = p.marks >= PASS_MARKS;
    const into = p.pts - p.marks * PASS_STEP;
    const card = u.cards.find((c) => c.uid === passCardUid(u.season));
    const upcoming = Array.from({ length: 3 }, (_, i) => p.marks + 1 + i).filter((k) => k <= PASS_MARKS);
    return (
        <section className="panel ut-pass bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="crown" />
                {t('ultimate.pass.title')}
                <small className="ut-reset">{t('ultimate.pass.today', { n: today, max: PASS_DAY_MAX })}</small>
            </h2>
            <div className="ut-pass-head">
                <div className="ut-pass-card">
                    {card ? (
                        <FutCard inst={card} size="sm" ribbon={t('ultimate.pass.card')} />
                    ) : (
                        <span className="ut-pass-lock">
                            <HudIcon kind="lock" />
                            <small>{t('ultimate.pass.cardLocked')}</small>
                        </span>
                    )}
                </div>
                <div className="ut-pass-info">
                    <b className="cb-num">{t('ultimate.pass.mark', { a: p.marks, b: PASS_MARKS })}</b>
                    <small className="muted">{t('ultimate.pass.pts', { n: p.pts })}</small>
                    {done ? (
                        <small className="ut-pass-done">
                            <HudIcon kind="check" />
                            {t('ultimate.pass.done', { n: u.season || 1 })}
                        </small>
                    ) : (
                        <>
                            <span className="ut-bar" style={{ '--p': `${(100 * into) / PASS_STEP}%` } as CSSProperties}>
                                <i aria-hidden />
                                <small>
                                    {into}/{PASS_STEP}
                                </small>
                            </span>
                            <small className="muted">{t('ultimate.pass.next', { n: PASS_STEP - into })}</small>
                        </>
                    )}
                    <small className="muted">{t('ultimate.pass.cardHint', { n: PASS_GROW_EVERY })}</small>
                </div>
            </div>
            {!!upcoming.length && (
                <>
                    <span className="bc-lbl">{t('ultimate.pass.upcoming')}</span>
                    <ul className="ut-marks">
                        {upcoming.map((k) => (
                            <li key={k}>
                                <b className="cb-num">{k}</b>
                                <span>{text(passReward(k))}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <small className="muted">
                {t('ultimate.pass.perMatch', { w: PASS_POINTS.win, d: PASS_POINTS.draw, l: PASS_POINTS.loss })}
            </small>
        </section>
    );
}

/** A regra do líder em texto ("3 titulares do tipo Planta", "Só Água", "Time todo Prata"). */
export function useGymRule() {
    const { t, tn } = useT();
    return (g: Gym) =>
        g.rule.kind === 'metal'
            ? t('ultimate.gyms.rule.metal', { metal: metalLabel(g.rule.metal) })
            : g.rule.min >= 5
              ? t('ultimate.gyms.rule.only', { type: typeName(g.rule.type) })
              : tn('ultimate.gyms.rule.type', g.rule.min, { type: typeName(g.rule.type) });
}

/** Desafios dos líderes: a regra, quantos titulares já cumprem, a insígnia e o botão. */
export function Gyms({ u, busy, onGo }: { u: UltimateSave; busy: boolean; onGo: (id: string) => void }) {
    const { t, d, lang } = useT();
    const rule = useGymRule();
    const by = new Map(u.cards.map((c) => [c.uid, c]));
    const starters = u.team.order.slice(0, 5).flatMap((x) => by.get(x) ?? []);
    const f = FICHAS[GYM_LEVEL];
    return (
        <section className="panel ut-gyms bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="stadium" />
                {t('ultimate.gyms.title')}
            </h2>
            <small className="muted">{t('ultimate.gyms.hint')}</small>
            <small className="ut-extra">
                <HudIcon kind="coin" />
                {t('ultimate.gyms.prize', {
                    w: f.win * GYM_FICHAS_MULT,
                    d: f.draw * GYM_FICHAS_MULT,
                    l: f.loss * GYM_FICHAS_MULT,
                })}
            </small>
            <ul className="ut-gym-list">
                {GYMS.map((g) => {
                    const won = u.gyms.includes(g.id);
                    const ok = gymReady(u, g.id);
                    const have = Math.min(g.rule.min, gymCount(g.rule, starters));
                    return (
                        <li key={g.id} className={won ? 'won' : undefined}>
                            <KantoBadge leader={g.id as TrainerId} earned={won} />
                            <span>
                                <b>
                                    {d.profile.trainers[g.id as TrainerId]} · {clubName(g.club, lang)}
                                </b>
                                <small className={ok ? 'ok' : undefined}>
                                    {rule(g)} · {have}/{g.rule.min}
                                </small>
                            </span>
                            <button
                                type="button"
                                className="btn confirm small"
                                disabled={!ok || busy || !!u.live}
                                title={ok ? undefined : t('ultimate.gyms.need')}
                                onClick={() => onGo(g.id)}
                            >
                                {t('ultimate.gyms.go')}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
