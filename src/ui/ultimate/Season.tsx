import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
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
    PASS_CARD,
    PASS_DAY_MAX,
    PASS_GROW_EVERY,
    PASS_MARKS,
    PASS_POINTS,
    PASS_STEP,
    type PassReward,
    passReward,
} from '../../store/ultimate/rules';
import { gymCount, nextSeason, passFocus, passPrizeUid, passTrail, seasonAt } from '../../store/ultimate/season';
import { gymReady, passCardUid, prizePacks, type UltimateSave, type UtPrize } from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { metalLabel } from '../rarity';
import { hms, useNow } from './clock';
import { PackImg } from './pack-art';

/**
 * Temporada do Time Ultimate (0.9.33): a faixa com a contagem até o fim (e o evento no ar), o passe grátis, os
 * desafios dos líderes e o legado que fica no Perfil. Os números vêm de rules.ts (proposta, falta o ok do Miguel).
 */

/** A faixa da temporada (em Metas), com a contagem até o fim. A virada mora no Time Ultimate (`Ultimate`). */
export function SeasonBar() {
    const { t, d } = useT();
    const now = useNow();
    const season = seasonAt(now);
    const next = nextSeason(now);
    const event = eventAt(now);
    const ended = !!season && now >= season.end && !next;
    // na prévia, a temporada que vem (o PRÉVIA já está no letreiro)
    const shown = season ?? next;
    return (
        <section className="panel ut-season bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="crown" />
                {shown && t('ultimate.season.title', { n: shown.n })}
            </h2>
            <span className="ut-season-sub">
                {shown && <small className="muted">{d.ultimate.season.theme[shown.theme]}</small>}
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
            </span>
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
            r.pick ? t('ultimate.pick.gold') : '',
        ]
            .filter(Boolean)
            .join(' · ');
}

/** Passe grátis da temporada: o marco, os pontos até o próximo, a carta de abertura e a trilha dos 40 marcos. */
export function Pass() {
    const { t, tn } = useT();
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const p = u.pass;
    const day = dailyDay(new Date(now));
    const today = p.day === day ? p.today : 0;
    const done = p.marks >= PASS_MARKS;
    const into = p.pts - p.marks * PASS_STEP;
    const card = u.cards.find((c) => c.uid === passCardUid(u.season));
    // resgatou na trilha: o destino à vista, como nos Pendentes
    const [got, setGot] = useState(0);
    const claim = (k: number) => {
        const uid = passPrizeUid(u.season, k);
        const prize = u.pending.find((x): x is UtPrize => x.kind === 'prize' && x.uid === uid);
        if (!prize) return;
        useGame.getState().ultimateRedeem(uid);
        const n = prizePacks(prize);
        if (n) setGot((g) => g + n);
    };
    return (
        <section className="panel ut-pass bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="crown" />
                {t('ultimate.pass.title')}
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
                    <span className="ut-pass-mark">
                        <small>{t('ultimate.pass.markLbl')}</small>
                        <b className="cb-num">{p.marks}</b>
                        <small>{t('ultimate.pass.of', { n: PASS_MARKS })}</small>
                    </span>
                    {done ? (
                        <small className="ut-pass-done">
                            <HudIcon kind="check" />
                            {t('ultimate.pass.done', { n: u.season || 1 })}
                        </small>
                    ) : (
                        <>
                            <span className="ut-bar" style={{ '--p': into / PASS_STEP } as CSSProperties}>
                                <i aria-hidden />
                                <small>
                                    {into}/{PASS_STEP}
                                </small>
                            </span>
                            <small className="muted">{t('ultimate.pass.next', { n: PASS_STEP - into })}</small>
                        </>
                    )}
                    {!done && (
                        <small className="ut-pass-today">
                            {t('ultimate.pass.today', { n: today, max: PASS_DAY_MAX })}
                        </small>
                    )}
                    <small className="muted">{t('ultimate.pass.cardHint', { n: PASS_GROW_EVERY })}</small>
                </div>
            </div>
            <PassTrail onClaim={claim} />
            {got > 0 && (
                <small key={got} className="ut-got-line">
                    <HudIcon kind="bag" />
                    {tn('ultimate.stack.gotN', got)}
                </small>
            )}
            <small className="muted">
                {t('ultimate.pass.perMatch', { w: PASS_POINTS.win, d: PASS_POINTS.draw, l: PASS_POINTS.loss })}
            </small>
        </section>
    );
}

/** O desenho do prêmio do marco (a arte do pacote, a Ficha ou a carta de abertura) e o rótulo curto. */
function MarkArt({ r }: { r: PassReward }) {
    const { d } = useT();
    const short = d.ultimate.pass.short;
    const [art, label] = r.pick
        ? [<PackImg key="a" art="ouro" />, short.pick]
        : r.big
          ? [<PackImg key="a" art="grande" />, short.big]
          : r.packs
            ? [<PackImg key="a" art="mini" />, short.mini]
            : r.fichas
              ? [<HudIcon key="a" kind="coin" />, String(r.fichas)]
              : [<MonIcon key="a" id={PASS_CARD} />, r.card === 'grow' ? short.grow : short.card];
    return (
        <>
            <span className={`ut-mk-art${r.fichas ? ' coin' : ''}`} aria-hidden>
                {art}
                {r.card === 'grow' && (r.pick || r.big) ? <HudIcon kind="up" /> : null}
            </span>
            <small className="ut-mk-lbl">{label}</small>
        </>
    );
}

/**
 * A trilha do passe (como o Season Pass do FC): os 40 marcos numa fileira que rola de lado, com o prêmio desenhado;
 * os pegos preenchidos, o da vez em destaque e o Pegar no próprio marco. Abre centrada no marco da vez.
 */
function PassTrail({ onClaim }: { onClaim: (k: number) => void }) {
    const { t } = useT();
    const text = useMarkText();
    const u = useGame((s) => s.ultimate);
    const p = u.pass;
    const states = passTrail(
        p.marks,
        u.season,
        u.pending.flatMap((x) => (x.kind === 'prize' ? [x.uid] : [])),
    );
    const focus = passFocus(p.marks);
    const into = Math.max(0, p.pts - p.marks * PASS_STEP);
    const ref = useRef<HTMLOListElement>(null);
    // abre já no marco da vez (sem rolar na frente do jogador)
    useLayoutEffect(() => {
        const ol = ref.current;
        const li = ol?.children[focus - 1] as HTMLElement | undefined;
        if (!ol || !li) return;
        // pelos retângulos da tela: no PC a tela tem `zoom` e o offsetLeft não bate com o scrollLeft
        const a = ol.getBoundingClientRect();
        const b = li.getBoundingClientRect();
        ol.scrollLeft += (b.left + b.width / 2 - (a.left + a.width / 2)) / (a.width / ol.offsetWidth || 1);
    }, [focus]);
    return (
        <ol className="ut-trail" ref={ref} aria-label={t('ultimate.pass.trail')}>
            {states.map((st, i) => {
                const k = i + 1;
                const r = passReward(k);
                return (
                    <li
                        key={k}
                        className={`ut-mk ${st}${k % PASS_GROW_EVERY === 0 ? ' big' : ''}`}
                        aria-current={st === 'now' ? 'step' : undefined}
                        title={`${t('ultimate.pass.markN', { n: k })}: ${text(r)}`}
                    >
                        <b className="ut-mk-n">{k}</b>
                        <MarkArt r={r} />
                        {st === 'ready' ? (
                            <button type="button" className="btn confirm ut-mk-get" onClick={() => onClaim(k)}>
                                {t('ultimate.pass.claim')}
                            </button>
                        ) : st === 'got' ? (
                            <HudIcon kind="check" />
                        ) : st === 'now' ? (
                            <span className="ut-mk-bar" style={{ '--p': into / PASS_STEP } as CSSProperties} />
                        ) : null}
                    </li>
                );
            })}
        </ol>
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
