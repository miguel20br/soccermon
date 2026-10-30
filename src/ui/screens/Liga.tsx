import { type CSSProperties, useEffect, useState } from 'react';
import { cloudEnabled, useCloud } from '../../cloud/cloud';
import { ENGINE_VERSION } from '../../engine/config';
import { teamFromRecipe, teamRecipe } from '../../engine/duel-validate';
import { viewInstance } from '../../engine/instance';
import { ligaMatchSeed, ligaTeams } from '../../engine/league';
import { clubName, type TKey } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import {
    isError,
    type LigaOpen,
    type LigaRow,
    type LigaStatus,
    league,
    leagueOnline,
    publicInfo,
} from '../../league/api';
import { useLiga } from '../../league/liga-store';
import { divisionOf, ELO_START, seasonDaysLeft, seasonOf } from '../../league/rules';
import { dailyDay } from '../../store/daily';
import { isDraftComplete, playerTeam, useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { Coach } from '../coach/Coach';
import { AccountBar } from '../components/AccountBar';
import { MenuHead } from '../components/MenuHead';
import { cardSprite } from '../components/PokeCard';
import { TrainerName } from '../profile/TrainerName';
import { simulateMatch } from '../sim-client';
import { RankLine } from './Daily';
import '../liga.css';

const hexOf = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Escudo da divisão nas cores das cartas. */
export function DivisionBadge({ elo }: { elo: number }) {
    const { t } = useT();
    const div = divisionOf(elo);
    return (
        <span className={`lg-div lg-div-${div.id}`}>
            <svg viewBox="0 0 32 32" aria-hidden>
                <path d="M16 2 L28 6.5 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V6.5 Z" />
                <path className="lg-div-mark" d="M10 13 L16 9 L22 13 M10 19 L16 15 L22 19" />
            </svg>
            <b>{t(`liga.league.division.${div.id}` as TKey)}</b>
        </span>
    );
}

export function Liga() {
    const { go, run, profile, setMatch } = useGame();
    const user = useCloud((s) => s.user);
    const { t, tn, lang } = useT();
    const { open, result, error: finishError } = useLiga();
    const today = dailyDay();
    const season = seasonOf(today);
    const [status, setStatus] = useState<LigaStatus | null | 'loading'>('loading');
    const [rows, setRows] = useState<LigaRow[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const errText = (code: string) => t(`liga.league.errors.${code}` as TKey) || t('liga.league.errors.falhou');

    const refresh = async () => {
        const [st, rk] = await Promise.all([league().ligaStatus(today), league().ligaRanking(season)]);
        setStatus(st);
        setRows(rk);
        // adversário sorteado (ou a partida que ficou aberta): o servidor devolve sempre o mesmo até jogar
        if (st?.team && !useLiga.getState().open) {
            const o = await league().liga<LigaOpen>('proxima', {});
            if (!isError(o)) useLiga.getState().setOpen(o);
            else setMsg(errText(o.error));
        }
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: recarrega quando a conta muda
    useEffect(() => {
        if (leagueOnline() && user) void refresh();
    }, [user]);
    // resultado chegou: Elo e ranking novos
    // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o resultado muda
    useEffect(() => {
        if (result && result !== 'sending') void refresh();
    }, [result]);

    const cupTeam = run && isDraftComplete(run) ? playerTeam(run) : null;
    const register = async () => {
        if (!cupTeam) return;
        setBusy(true);
        setMsg(null);
        const r = await league().liga<{ ovr: number }>('inscrever', {
            team: teamRecipe(cupTeam),
            info: publicInfo(profile),
        });
        setBusy(false);
        if (isError(r)) setMsg(errText(r.error));
        else {
            setMsg(t('liga.league.registered'));
            void refresh();
        }
    };

    const play = async () => {
        if (!open) return;
        setBusy(true);
        setMsg(null);
        let o = open;
        if (!o.started || !o.seed) {
            const r = await league().liga<LigaOpen>('jogar', { id: o.id, engine: ENGINE_VERSION });
            if (isError(r)) {
                setBusy(false);
                setMsg(errText(r.error));
                return;
            }
            o = r;
            useLiga.getState().setOpen(o);
        }
        const [home, away] = ligaTeams(o.myTeam, o.ghostTeam);
        try {
            const m = await simulateMatch(home, away, ligaMatchSeed(o.seed!), useLiga.getState().live?.orders ?? []);
            setMatch(m);
            go('liga-match');
        } catch {
            setMsg(t('liga.league.errors.falhou'));
        } finally {
            setBusy(false);
        }
    };

    const next = () => {
        useLiga.getState().setOpen(null);
        void refresh();
    };

    const head = <MenuHead title={t('liga.league.title')} hud="crown" onBack={() => go('home')} />;
    if (!leagueOnline() || !user)
        return (
            <div className="menu-screen lg">
                {head}
                <section className="panel lg-hero bc-surface bc-stripe">
                    <p className="lg-line">{t('liga.league.line')}</p>
                    <p className="lg-note">{cloudEnabled ? t('liga.league.needLogin') : t('liga.league.needCloud')}</p>
                    <AccountBar />
                </section>
            </div>
        );

    const st = status === 'loading' ? null : status;
    const elo = st?.elo ?? ELO_START;
    const div = divisionOf(elo);
    const month = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', { month: 'long', timeZone: 'UTC' }).format(
        new Date(`${season}-15T12:00:00Z`),
    );
    const ghost = open ? teamFromRecipe(open.ghostTeam, 'g') : null;
    const myTeam = st?.team ? teamFromRecipe(st.team.team, 'm') : null;
    const lastWon = result && result !== 'sending' ? result : null;

    return (
        <div className="menu-screen lg">
            {head}
            <Coach id="liga" targets={['.lg-elo-num', '.lg .btn.primary.big']} when={st !== null} />
            <section
                className="panel lg-hero lg-season bc-surface bc-stripe"
                style={{ '--tc': `var(--div-${div.id})` } as CSSProperties}
            >
                <div className="lg-season-top">
                    <span className="bc-tag">{t('liga.league.season', { month })}</span>
                    <small>{tn('liga.league.daysLeft', seasonDaysLeft(today) - 1)}</small>
                </div>
                <div className="lg-elo">
                    <DivisionBadge elo={elo} />
                    <span className="lg-elo-num">
                        <b>{elo}</b>
                        <small>Elo</small>
                    </span>
                </div>
                <div className="lg-bar" aria-hidden>
                    <i
                        style={{
                            width: `${div.next ? Math.min(100, ((elo - div.min) / (div.next - div.min)) * 100) : 100}%`,
                        }}
                    />
                </div>
                <small className="lg-hint">
                    {div.next
                        ? t('liga.league.toNext', {
                              n: div.next - elo,
                              div: t(`liga.league.division.${divisionOf(div.next).id}` as TKey),
                          })
                        : t('liga.league.top')}
                    {' · '}
                    {st?.games ? t('liga.league.record', { w: st.wins, l: st.losses }) : t('liga.league.noGames')}
                </small>
            </section>

            {(lastWon || result === 'sending' || finishError) && (
                <section
                    className={`panel lg-result bc-surface bc-stripe${lastWon ? (lastWon.won ? ' won' : ' lost') : ''}`}
                >
                    {result === 'sending' ? (
                        <p className="lg-line">{t('liga.league.sending')}</p>
                    ) : lastWon ? (
                        <>
                            <b className="lg-verdict">
                                {lastWon.won ? t('liga.league.win') : t('liga.league.loss')} {lastWon.score[0]}x
                                {lastWon.score[1]}
                                {lastWon.shootout && ` (${lastWon.shootout[0]}x${lastWon.shootout[1]})`}
                            </b>
                            <span className="lg-elo-change">
                                {t('liga.league.eloChange', { a: lastWon.eloBefore, b: lastWon.eloAfter })}{' '}
                                <em className={lastWon.eloAfter >= lastWon.eloBefore ? 'up' : 'down'}>
                                    {lastWon.eloAfter >= lastWon.eloBefore ? '+' : ''}
                                    {lastWon.eloAfter - lastWon.eloBefore}
                                </em>
                            </span>
                            <button type="button" className="btn primary" onClick={next}>
                                {t('liga.league.find')}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="lg-note">{errText(finishError!)}</p>
                            <button
                                type="button"
                                className="btn confirm"
                                onClick={() => void useLiga.getState().finish()}
                            >
                                {t('liga.retry')}
                            </button>
                        </>
                    )}
                </section>
            )}

            {open && ghost && !lastWon && result !== 'sending' && !finishError && (
                <section
                    className="panel lg-ghost bc-surface bc-stripe"
                    style={{ '--tc': hexOf(open.ghostTeam.color) } as CSSProperties}
                >
                    <span className="bc-lbl">{t('liga.league.nextTitle')}</span>
                    <div className="lg-ghost-head">
                        <b>{clubName(open.ghost.club)}</b>
                        <small>
                            {open.ghost.house
                                ? t('liga.league.house')
                                : rich(t('liga.league.ghostBy'), {
                                      trainer: (
                                          <TrainerName
                                              who={{
                                                  trainer: open.ghost.trainer ?? '',
                                                  club: open.ghost.club,
                                                  club_color: open.ghost.color ?? undefined,
                                              }}
                                          />
                                      ),
                                  })}
                        </small>
                    </div>
                    <span className="lg-squad">
                        {ghost.lineup.map((p) => (
                            <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                        ))}
                    </span>
                    <div className="lg-ghost-meta">
                        <DivisionBadge elo={open.ghostElo} />
                        <span>{t('liga.league.elo', { elo: open.ghostElo })}</span>
                        <span>
                            {t('liga.league.ovr', {
                                ovr:
                                    open.ghost.ovr ??
                                    Math.round(
                                        ghost.lineup.reduce((n, p) => n + viewInstance(p).overall, 0) /
                                            ghost.lineup.length,
                                    ),
                            })}
                        </span>
                    </div>
                    <button type="button" className="btn primary big" disabled={busy} onClick={() => void play()}>
                        {open.started ? t('liga.league.resume') : t('liga.league.play')}
                    </button>
                    <small className="lg-hint">{t('liga.league.openNote')}</small>
                </section>
            )}

            <section
                className="panel lg-team bc-surface"
                style={{ '--tc': hexOf(clubColorHex(profile.clubColor)) } as CSSProperties}
            >
                <span className="bc-lbl">{t('liga.league.teamTitle')}</span>
                {myTeam ? (
                    <div className="lg-team-row">
                        <b>{myTeam.name}</b>
                        <small>{t('liga.league.ovr', { ovr: st?.team?.ovr ?? '' })}</small>
                        <span className="lg-squad">
                            {myTeam.lineup.map((p) => (
                                <img
                                    key={p.uid}
                                    className="pixel"
                                    src={cardSprite(p)}
                                    alt={viewInstance(p).displayName}
                                />
                            ))}
                        </span>
                    </div>
                ) : (
                    status !== 'loading' && <p className="lg-hint">{t('liga.league.teamNone')}</p>
                )}
                {cupTeam ? (
                    <button type="button" className="btn" disabled={busy} onClick={() => void register()}>
                        {myTeam ? t('liga.league.update') : t('liga.league.register')}
                    </button>
                ) : (
                    <small className="lg-hint">{t('liga.league.registerNeedCup')}</small>
                )}
                <small className="lg-hint">{t('liga.league.registerHint')}</small>
                {msg && <p className="lg-note">{msg}</p>}
            </section>

            <section className="panel lg-rank bc-surface">
                <h2 className="bc-caption">{t('liga.league.rankingTitle')}</h2>
                {rows === null ? (
                    <p className="lg-hint">
                        {status === 'loading' ? t('common.ui.loading') : t('liga.daily.rankingError')}
                    </p>
                ) : rows.length === 0 ? (
                    <p className="lg-hint">{t('liga.league.rankingEmpty')}</p>
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
                            >
                                <b>{r.elo}</b>
                                <small>{t('liga.league.record', { w: r.wins, l: r.losses })}</small>
                            </RankLine>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
