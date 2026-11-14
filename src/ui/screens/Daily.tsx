import { type CSSProperties, useEffect, useState } from 'react';
import { noteDailyOrigin } from '../../analytics/track';
import { useCloud } from '../../cloud/cloud';
import { CUP_STAGES } from '../../engine/cup';
import { SPECIES_BY_ID, species } from '../../engine/data';
import { useFriends } from '../../friends/api';
import { clubName, dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { type DailyRow, isError, league, leagueOnline, publicInfo, squadOf } from '../../league/api';
import { dailyDay, dailyShareText, dailySticker, dailyStreak, daysInARow, putDaily, winsOf } from '../../store/daily';
import { isCupInProgress, useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { Coach } from '../coach/Coach';
import { AccountBar } from '../components/AccountBar';
import { MenuHead } from '../components/MenuHead';
import { MonIcon } from '../components/MonIcon';
import { EstadioBackdrop } from '../kit/backdrop';
import { InfoSheet, SheetRow } from '../kit/controls';
import { Stage } from '../kit/Stage';
import { TrainerName } from '../profile/TrainerName';
import { SITE_URL, shareText } from '../share';
import '../liga.css';
import { backTarget } from '../back-nav';

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
    const begin = async (from: 'jogar' | 'tela' = 'tela') => {
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
        noteDailyOrigin(from);
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
    tag,
    code,
    me,
    squad,
    children,
}: {
    pos: number;
    color: string;
    trainer: string;
    club: string;
    tag?: string;
    /** Código de amigo do treinador (o nome abre o perfil dele). */
    code?: string | null;
    me: boolean;
    /** Time em ícones (só a Copa do Dia manda). */
    squad?: ReturnType<typeof squadOf>;
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
                    <TrainerName who={{ trainer, club, club_tag: tag, club_color: color, code, me }} />
                    {me && <em className="lg-you">{t('liga.daily.you')}</em>}
                </b>
                <small>{club}</small>
            </span>
            <span className="lg-num">{children}</span>
            {squad && (
                <span className="lg-squad">
                    {squad.ids.map((id, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: 5 vagas fixas, a mesma espécie pode repetir
                        <span key={i} className={`lg-squad-mon${i === squad.captain ? ' cap' : ''}`}>
                            <MonIcon
                                id={id}
                                label={`${SPECIES_BY_ID.get(id)?.name ?? id}${i === squad.captain ? `, ${t('liga.daily.captain')}` : ''}`}
                            />
                        </span>
                    ))}
                </span>
            )}
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
    const inARow = daysInARow(daily, today);
    const nextGoal = [
        { days: 7, prize: t('profile.titles.fielCopa') },
        { days: 30, prize: t('profile.trainers.lassGold') },
    ].find((g) => g.days > inARow);
    const { begin, busy, note } = useDailyBegin();
    const [shared, setShared] = useState(false);
    const [rows, setRows] = useState<DailyRow[] | 'loading' | 'error' | null>(leagueOnline() ? 'loading' : null);
    // ranking só com os amigos (aparece quando tem amigo na lista)
    const hasFriends = useFriends((s) => !!s.rows?.some((r) => r.status === 'amigo'));
    const [onlyFriends, setOnlyFriends] = useState(false);
    const friendsView = onlyFriends && hasFriends && !!user;
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
            .dailyRanking(today, friendsView)
            .then((r) => alive && setRows(r ?? 'error'));
        return () => {
            alive = false;
        };
    }, [today, user, entry?.done, entry?.reported, friendsView]);

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
    // já jogou hoje (acabou, ou largou e a copa aberta é outra): o resultado no lugar do convite
    const done = !!entry && (entry.done || !playing);
    const date = dayLabel(today, lang);
    const sticker = dailySticker(today);
    const myRow = Array.isArray(rows) ? rows.find((r) => r.me) : undefined;
    // a regra inteira mora no "?" (na tela, no máximo ~12 palavras por texto)
    const rules = (
        <InfoSheet title={t('liga.daily.tag')}>
            <p>{t('liga.daily.line')}</p>
            {!user && <p>{t('liga.daily.guestHint')}</p>}
            <p>
                {tn('liga.daily.total', streak.total)}
                {nextGoal && ` ${t('liga.daily.nextGoal', { n: nextGoal.days - inARow, prize: nextGoal.prize })}`}
            </p>
        </InfoSheet>
    );

    return (
        <Stage
            className="k-stage-place lg-stage dy-stage lg"
            scene={<EstadioBackdrop mon={{ id: sticker }} led={`${t('liga.daily.tag')} · ${date}`.toUpperCase()} />}
            action={
                !done ? (
                    <button
                        type="button"
                        className="btn primary big"
                        data-testid="daily-play"
                        disabled={busy}
                        onClick={() => void begin()}
                    >
                        {playing ? t('liga.daily.continue') : t('liga.daily.play')}
                    </button>
                ) : entry.results.length > 0 ? (
                    <button type="button" className="btn big" onClick={share}>
                        {shared ? t('liga.daily.copied') : t('liga.daily.share')}
                    </button>
                ) : undefined
            }
        >
            <MenuHead title={t('liga.daily.tag')} icon="daily" onBack={() => go(backTarget('daily') ?? 'home')} />
            <Coach id="dia" targets={['.dy-panel .lg-date', '[data-testid="daily-play"]']} when={!entry} />
            {/* o vão: a torcida, o letreiro com o dia e o Pokémon da figurinha no meio da quadra */}
            <i className="k-stage-gap" aria-hidden />
            <section className="panel lg-hero dy-panel bc-surface bc-stripe">
                <div className="dy-top">
                    <span className="lg-date">{date}</span>
                    {rules}
                </div>
                {done ? (
                    <div className="lg-done dy-done">
                        <b className="lg-verdict">
                            {entry.champion
                                ? t('liga.daily.champion')
                                : entry.results.length
                                  ? tn('liga.daily.wins', wins)
                                  : t('liga.daily.abandoned')}
                        </b>
                        {!entry.ranked && <span className="lg-chip">{t('liga.daily.unranked')}</span>}
                        <ul className="lg-scores dy-scores">
                            {CUP_STAGES.map((st, i) => {
                                const r = entry.results[i];
                                return (
                                    <li
                                        key={st}
                                        className={r ? (r.won ? 'won' : 'lost') : ''}
                                        title={r ? clubName(r.opponent) : undefined}
                                    >
                                        <b>{r ? `${r.score[0]}x${r.score[1]}` : '·'}</b>
                                        {r?.shootout && (
                                            <small>
                                                {' '}
                                                ({r.shootout[0]}x{r.shootout[1]})
                                            </small>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : (
                    <p className="lg-line">{t('liga.home.dailyLine')}</p>
                )}
                <div className="dy-week">
                    <ol className="lg-days" aria-label={t('liga.daily.week', { n: streak.weekCount })}>
                        {streak.week.map((on, i) => (
                            <li key={streak.days[i]} className={on ? 'on' : ''}>
                                {dict(lang).liga.daily.weekDays[i]}
                            </li>
                        ))}
                    </ol>
                    <small>{tn('liga.daily.inARow', inARow)}</small>
                </div>
                {/* a figurinha de hoje: o mesmo Pokémon pra todo mundo que termina a Copa do Dia (ele está na quadra) */}
                <p className="dy-sticker">
                    <b>{t('liga.daily.stickerTitle', { name: species(sticker).name })}</b>
                    <small>{entry?.done ? t('liga.daily.stickerGot') : t('liga.daily.stickerHow')}</small>
                </p>
                {!done && !playing && isCupInProgress(run) && (
                    <small className="lg-hint">{t('liga.daily.parkHint', { team: run.teamName })}</small>
                )}
                {done && <span className="lg-next">{t('liga.daily.next', clock)}</span>}
                {note && <p className="lg-note">{note}</p>}
            </section>

            <SheetRow
                icon="chart"
                label={t('liga.ranking')}
                hint={myRow ? `${myRow.pos}º` : undefined}
                title={t('liga.daily.rankingTitle')}
                className="dy-rank-open"
            >
                {hasFriends && user && (
                    <div className="bc-seg segmented lg-scope">
                        {[false, true].map((f) => (
                            <button
                                key={String(f)}
                                type="button"
                                className={onlyFriends === f ? 'on' : undefined}
                                aria-pressed={onlyFriends === f}
                                onClick={() => setOnlyFriends(f)}
                            >
                                {f ? t('liga.daily.scopeFriends') : t('liga.daily.scopeAll')}
                            </button>
                        ))}
                    </div>
                )}
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
                                tag={r.club_tag}
                                code={r.code}
                                me={r.me}
                                squad={squadOf(r)}
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
            </SheetRow>
        </Stage>
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
