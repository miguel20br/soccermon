import { type CSSProperties, useEffect, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { CUP_STAGES } from '../../engine/cup';
import { clubName, dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { type DailyRow, isError, league, leagueOnline, publicInfo } from '../../league/api';
import { ligaCountdown } from '../../league/rules';
import { dailyDay, dailyShareText, dailyStreak, putDaily, winsOf } from '../../store/daily';
import { isCupInProgress, useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { AccountBar } from '../components/AccountBar';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { MenuIcon } from '../components/MenuIcon';
import { SITE_URL, shareText } from '../share';
import '../liga.css';

/** Copa do Dia de hoje: está jogando agora (a copa aberta é a do dia). */
export function dailyInPlay() {
    const run = useGame.getState().run;
    return run?.daily === dailyDay() && isCupInProgress(run);
}

/**
 * Começa a Copa do Dia: com conta Google, registra a tentativa no servidor primeiro (vale pro ranking); sem conta ou
 * sem rede, joga igual, fora do ranking. Já jogou hoje (aqui ou em outro aparelho): abre a tela do dia.
 */
export function useDailyBegin() {
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState<string | null>(null);
    const { t } = useT();
    const begin = async () => {
        const s = useGame.getState();
        const today = dailyDay();
        if (dailyInPlay()) {
            s.go(
                s.run?.status === 'reward'
                    ? 'reward'
                    : ['formation', 'captain', 'drafting'].includes(s.run!.status)
                      ? 'draft'
                      : 'lineup',
            );
            return;
        }
        if (s.daily.some((e) => e.day === today)) {
            s.go('daily');
            return;
        }
        setBusy(true);
        setNote(null);
        let ranked = false;
        if (useCloud.getState().user) {
            const r = await league().dailyBegin(publicInfo(s.profile));
            if (!isError(r)) {
                ranked = r.day === today;
                if (!ranked) setNote(t('liga.daily.clock'));
            } else if (r.error === 'ja_jogou') {
                useGame.setState({
                    daily: putDaily(useGame.getState().daily, {
                        day: today,
                        results: [],
                        done: true,
                        champion: false,
                        ranked: true,
                    }),
                });
                setBusy(false);
                setNote(t('liga.daily.already'));
                useGame.getState().go('daily');
                return;
            }
        }
        setBusy(false);
        useGame.getState().startDaily(ranked);
    };
    return { begin, busy, note };
}

/** "dd/mm" e o dia da semana, no idioma da tela (a data é a de Brasília, sem fuso no meio). */
const dayLabel = (day: string, lang: string) =>
    new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
    }).format(new Date(`${day}T12:00:00Z`));

/** Quanto falta pra virar o dia em Brasília (UTC−3 fixo desde 2019). */
function untilNext(now = Date.now()) {
    const [y, m, d] = dailyDay(new Date(now)).split('-').map(Number);
    const left = Math.max(0, Date.UTC(y, m - 1, d + 1, 3) - now);
    return { h: Math.floor(left / 3600000), m: String(Math.floor(left / 60000) % 60).padStart(2, '0') };
}

/** Linha do ranking (do dia ou da Liga): posição, faixa na cor do clube, treinador e clube, número à direita. */
export function RankLine({
    pos,
    color,
    trainer,
    club,
    me,
    children,
}: {
    pos: number;
    color: string;
    trainer: string;
    club: string;
    me: boolean;
    children: React.ReactNode;
}) {
    const { t } = useT();
    return (
        <li
            className={`lg-rank-row${me ? ' me' : ''}`}
            style={{ '--tc': `#${clubColorHex(color).toString(16).padStart(6, '0')}` } as CSSProperties}
        >
            <b className="lg-pos">{pos}</b>
            <span className="lg-who">
                <b>
                    {trainer}
                    {me && <em className="lg-you">{t('liga.daily.you')}</em>}
                </b>
                <small>{club}</small>
            </span>
            <span className="lg-num">{children}</span>
        </li>
    );
}

export function Daily() {
    const { go, daily, run } = useGame();
    const user = useCloud((s) => s.user);
    const { t, tn, lang } = useT();
    const today = dailyDay();
    const entry = daily.find((e) => e.day === today);
    const playing = run?.daily === today && isCupInProgress(run);
    const streak = dailyStreak(daily, today);
    const { begin, busy, note } = useDailyBegin();
    const [shared, setShared] = useState(false);
    const [rows, setRows] = useState<DailyRow[] | 'loading' | 'error' | null>(leagueOnline() ? 'loading' : null);
    const [clock, setClock] = useState(untilNext);
    useEffect(() => {
        const id = window.setInterval(() => setClock(untilNext()), 30000);
        return () => clearInterval(id);
    }, []);
    // biome-ignore lint/correctness/useExhaustiveDependencies: recarrega quando a conta muda ou o dia acaba
    useEffect(() => {
        if (!leagueOnline()) return;
        let alive = true;
        setRows('loading');
        league()
            .dailyRanking(today)
            .then((r) => alive && setRows(r ?? 'error'));
        return () => {
            alive = false;
        };
    }, [today, user, entry?.done, entry?.reported]);

    const share = async () => {
        if (!entry) return;
        const tx = dict(lang).liga.daily.shareText;
        const text = dailyShareText(entry, streak, tx, (n) => clubName(n, lang), `${SITE_URL}/?utm_source=share`);
        const res = await shareText(text);
        if (res !== 'failed') {
            setShared(true);
            window.setTimeout(() => setShared(false), 2000);
        }
    };
    const wins = entry ? winsOf(entry) : 0;

    return (
        <div className="menu-screen lg">
            <MenuHead title={t('liga.daily.tag')} tag={t('liga.daily.tag')} icon="daily" onBack={() => go('home')} />

            <section className="panel lg-hero bc-surface bc-stripe">
                <span className="lg-date">{dayLabel(today, lang)}</span>
                <p className="lg-line">{t('liga.daily.line')}</p>
                {entry?.done || (entry && !playing) ? (
                    <div className="lg-done">
                        <span className="lg-path" aria-hidden>
                            {CUP_STAGES.map((st, i) => {
                                const r = entry.results[i];
                                return <i key={st} className={r ? (r.won ? 'won' : 'lost') : ''} />;
                            })}
                        </span>
                        <b className="lg-verdict">
                            {entry.champion
                                ? t('liga.daily.champion')
                                : entry.results.length
                                  ? tn('liga.daily.wins', wins)
                                  : t('liga.daily.abandoned')}
                        </b>
                        {!entry.ranked && <span className="lg-chip">{t('liga.daily.unranked')}</span>}
                        <ul className="lg-scores">
                            {entry.results.map((r) => (
                                <li key={r.opponent} className={r.won ? 'won' : 'lost'}>
                                    <b>
                                        {r.score[0]}x{r.score[1]}
                                    </b>
                                    {r.shootout && (
                                        <small>
                                            {' '}
                                            ({r.shootout[0]}x{r.shootout[1]})
                                        </small>
                                    )}{' '}
                                    {clubName(r.opponent)}
                                </li>
                            ))}
                        </ul>
                        <div className="row lg-actions">
                            {entry.results.length > 0 && (
                                <button type="button" className="btn primary" onClick={share}>
                                    {shared ? t('liga.daily.copied') : t('liga.daily.share')}
                                </button>
                            )}
                            <span className="lg-next">{t('liga.daily.next', clock)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="lg-start">
                        <button type="button" className="btn primary big" disabled={busy} onClick={() => void begin()}>
                            {playing ? t('liga.daily.continue') : t('liga.daily.play')}
                        </button>
                        {!playing && isCupInProgress(run) && (
                            <small className="lg-hint">{t('liga.daily.parkHint', { team: run.teamName })}</small>
                        )}
                        {!playing && !user && <small className="lg-hint">{t('liga.daily.guestHint')}</small>}
                    </div>
                )}
                {note && <p className="lg-note">{note}</p>}
            </section>

            <section className="panel lg-week bc-surface">
                <span className="bc-lbl">{t('liga.daily.week', { n: streak.weekCount })}</span>
                <ol className="lg-days">
                    {streak.week.map((on, i) => (
                        <li key={streak.days[i]} className={on ? 'on' : ''}>
                            {dict(lang).liga.daily.weekDays[i]}
                        </li>
                    ))}
                </ol>
                <small>{tn('liga.daily.total', streak.total)}</small>
            </section>

            <section className="panel lg-rank bc-surface">
                <h2 className="bc-caption">{t('liga.daily.rankingTitle')}</h2>
                {!leagueOnline() ? (
                    <p className="lg-hint">{t('liga.daily.rankingOff')}</p>
                ) : rows === 'loading' ? (
                    <p className="lg-hint">{t('common.ui.loading')}</p>
                ) : rows === 'error' || rows === null ? (
                    <p className="lg-hint">{t('liga.daily.rankingError')}</p>
                ) : rows.length === 0 ? (
                    <p className="lg-hint">{t('liga.daily.rankingEmpty')}</p>
                ) : (
                    <ol className="lg-rank-list">
                        {rows.map((r) => (
                            <RankLine
                                key={`${r.pos}-${r.trainer}-${r.club}`}
                                pos={r.pos}
                                color={r.club_color}
                                trainer={r.trainer}
                                club={r.club}
                                me={r.me}
                            >
                                <b>{r.champion ? <TrophyMini /> : `${r.wins}/4`}</b>
                                <small>
                                    {r.done
                                        ? `${t('liga.daily.goalDiff')} ${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}`
                                        : t('liga.daily.playing')}
                                </small>
                            </RankLine>
                        ))}
                    </ol>
                )}
                {leagueOnline() && !user && (
                    <>
                        <p className="lg-hint">{t('liga.daily.rankingLogin')}</p>
                        <AccountBar />
                    </>
                )}
            </section>
        </div>
    );
}

/** Taça pequena (SVG) pro campeão do dia no ranking. */
function TrophyMini() {
    return (
        <svg className="lg-trophy" viewBox="0 0 24 24" aria-label="4/4">
            <path
                d="M7 3 H17 V9 C17 12 15 14 12 14 C9 14 7 12 7 9 Z"
                fill="#ffcb05"
                stroke="#1a1430"
                strokeWidth="1.6"
            />
            <path
                d="M7 5 H4 C4 8 5 10 7 10 M17 5 H20 C20 8 19 10 17 10"
                fill="none"
                stroke="#1a1430"
                strokeWidth="1.6"
            />
            <path d="M10 14 H14 V18 H10 Z M8 18 H16 V21 H8 Z" fill="#c98a52" stroke="#1a1430" strokeWidth="1.6" />
        </svg>
    );
}

/**
 * Entrada na Home (embaixo dos modos: o "Nova copa" continua na primeira tela do celular): Copa do Dia com os dias da
 * semana e a Liga (fechada até a data, ver `LigaHomeRow`).
 */
export function HomeDailyCard() {
    const { t, lang } = useT();
    const daily = useGame((s) => s.daily);
    const go = useGame((s) => s.go);
    // redesenha quando a copa muda de fase (o botão vira "Continuar")
    useGame((s) => s.run?.status);
    const today = dailyDay();
    const entry = daily.find((e) => e.day === today);
    const streak = dailyStreak(daily, today);
    const playing = dailyInPlay();
    const { begin, busy } = useDailyBegin();
    return (
        <div className="panel mode-card daily-card">
            <div className="dc-row">
                <span className="dc-icon" aria-hidden>
                    <MenuIcon kind="daily" />
                </span>
                <div className="mode-head">
                    <b>{t('liga.home.dailyTag')}</b>
                    <span>{t('liga.home.dailyLine')}</span>
                    <ol className="lg-days small" aria-label={t('liga.daily.week', { n: streak.weekCount })}>
                        {streak.week.map((on, i) => (
                            <li key={streak.days[i]} className={on ? 'on' : ''}>
                                {dict(lang).liga.daily.weekDays[i]}
                            </li>
                        ))}
                    </ol>
                </div>
                <button
                    type="button"
                    className="btn dc-go"
                    disabled={busy}
                    onClick={() => (entry && !playing ? go('daily') : void begin())}
                >
                    {playing
                        ? t('liga.home.dailyContinue')
                        : entry
                          ? t('liga.home.dailyDone')
                          : t('liga.home.dailyPlay')}
                </button>
            </div>
            <LigaHomeRow />
        </div>
    );
}

/**
 * Linha da Liga no cartão da Home. Fechada até `LIGA_OPENS_AT` (src/league/rules.ts): "Em breve", a contagem e, no
 * toque, o porquê. Na data ela abre sozinha (a contagem roda a cada 30 s).
 */
function LigaHomeRow() {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const [left, setLeft] = useState(() => ligaCountdown());
    const [why, setWhy] = useState(false);
    useEffect(() => {
        const id = window.setInterval(() => setLeft(ligaCountdown()), 30000);
        return () => clearInterval(id);
    }, []);
    if (left)
        return (
            <div className="dc-liga">
                <button
                    type="button"
                    className="dc-row dc-locked"
                    aria-expanded={why}
                    aria-controls="dc-liga-why"
                    onClick={() => setWhy(!why)}
                >
                    <span className="dc-icon" aria-hidden>
                        <MenuIcon kind="liga" />
                    </span>
                    <span className="mode-head">
                        <b>
                            {t('liga.home.ligaTag')} <span className="bc-tag">{t('liga.home.ligaSoon')}</span>
                        </b>
                        <span>{t('liga.home.ligaOpensIn', left)}</span>
                    </span>
                    <HudIcon kind="lock" className="dc-lock" />
                </button>
                {why && (
                    <p id="dc-liga-why" className="lg-note">
                        {t('liga.home.ligaClosed')}
                    </p>
                )}
            </div>
        );
    return (
        <div className="dc-row">
            <span className="dc-icon" aria-hidden>
                <MenuIcon kind="liga" />
            </span>
            <div className="mode-head">
                <b>{t('liga.home.ligaTag')}</b>
                <span>{t('liga.home.ligaLine')}</span>
            </div>
            <button type="button" className="btn ghost dc-go" onClick={() => go('liga')}>
                {t('liga.home.ligaGo')}
            </button>
        </div>
    );
}
