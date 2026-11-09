import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { cupRival } from '../../engine/cup';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { chemistry } from '../../store/ultimate/chemistry';
import { utNow } from '../../store/ultimate/clock';
import { evoReady } from '../../store/ultimate/evolutions';
import { objectiveById } from '../../store/ultimate/objectives';
import {
    EVO_ACTIVE_MAX,
    FICHAS,
    FIRST_STEPS,
    GYM_LEVEL,
    GYMS,
    LEVELS,
    type Level,
    PASS_MARKS,
    STARTERS,
} from '../../store/ultimate/rules';
import { lastDayPrizes, seasonAt } from '../../store/ultimate/season';
import {
    canPlay,
    gymReady,
    homeTeam,
    lastPacks,
    momentGoal,
    nextPackIn,
    packsReady,
    paidLevel,
    stackCount,
    teamAverage,
    teamStrength,
    type UltimateLast,
    ultimateRival,
    ultimateSeed,
} from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { PackArt } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { beatTimes } from '../kit/beats';
import { Beat, useCascade } from '../kit/Cascade';
import { Sheet } from '../kit/Sheet';
import { reduceMotionOn } from '../reduce-motion';
import { simulateMatch } from '../sim-client';
import { hms, useNow } from './clock';
import { useReward } from './Goals';
import { Gyms } from './Season';

export type UtTab = 'home' | 'squad' | 'club' | 'shop' | 'goals';

/** O nível escolhido fica na sessão (é conveniência, não save). */
let levelMem: Level | null = null;

/**
 * Início do Time Ultimate (ut-menus-e-pendentes.md, opção B): o hub do FC, um bloco por coisa com o estado dela
 * (Elenco, Loja, Metas, Evoluções, Temporada, Líderes; Pendentes só quando tem) e o JOGAR gordo embaixo. Voltando da
 * partida, o pós-jogo vem antes dos blocos.
 */
export function Home({ onTab, onPending }: { onTab: (t: UtTab) => void; onPending: () => void }) {
    const { t, tn, d, lang } = useT();
    const now = useNow();
    const u = useGame((s) => s.ultimate);
    const profile = useGame((s) => s.profile);
    const [level, setLevelState] = useState<Level>(() => levelMem ?? u.last?.level ?? 'normal');
    const setLevel = (lv: Level) => {
        levelMem = lv;
        setLevelState(lv);
    };
    const [sheet, setSheet] = useState<'level' | 'gyms' | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const home = useMemo(
        () => homeTeam(u, profile.clubName || 'Pallet FC', clubColorHex(profile.clubColor)),
        [u, profile.clubName, profile.clubColor],
    );
    const ready = canPlay(u);
    const avg = ready ? teamAverage(home) : 0;
    const strength = ready ? teamStrength(home) : 0;
    const rivalOf = (lv: Level) => ultimateRival(u.salt, u.played, lv, strength);
    const rival = ready ? rivalOf(level) : null;
    /** O nível que cada escolha vale de verdade: sem rival à altura, paga como o que ele alcança. */
    const paid = (lv: Level) => (ready ? paidLevel(lv, home, rivalOf(lv)) : lv);

    /** Simula (a mesma seed e as ordens guardadas dão a mesma partida) e abre a quadra. */
    const kick = async () => {
        const s = useGame.getState();
        const live = s.ultimate.live;
        if (!live) return;
        setBusy(true);
        setError(null);
        try {
            const m = await simulateMatch(
                live.home,
                cupRival(live.rival, true),
                `${ultimateSeed(s.ultimate.salt, live.n)}-stage-0`,
                live.orders,
            );
            if (useGame.getState().screen !== 'ultimate') return;
            s.setMatch(m);
            s.go('ultimate-match');
        } catch {
            setError(t('ultimate.play.simError'));
        } finally {
            setBusy(false);
        }
    };
    const start = () => {
        if (!rival) return;
        useGame.getState().ultimateStart({ n: u.played, level: paid(level), home, rival });
        void kick();
    };
    /** Desafio de líder: o clube dele, no Difícil, com a regra conferida na hora. */
    const challenge = (gym: string) => {
        if (!gymReady(u, gym)) return;
        setSheet(null);
        const r = ultimateRival(u.salt, u.played, GYM_LEVEL, strength, gym);
        useGame.getState().ultimateStart({ n: u.played, level: GYM_LEVEL, home, rival: r, gym });
        void kick();
    };

    const last = u.last && !u.last.seen ? u.last : null;
    if (last) return <PostGame last={last} onGoals={() => onTab('goals')} onPacks={() => onTab('shop')} />;

    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const lineup = u.team.order.slice(0, STARTERS).flatMap((x) => byUid.get(x) ?? []);
    const roles = FORMATIONS[u.team.formation].slots;
    const chem = ready
        ? Math.round(
              (chemistry(
                  lineup,
                  roles,
                  u.cards.filter((c) => !lineup.includes(c)),
                  u.team.order.slice(STARTERS).flatMap((x) => byUid.get(x) ?? []),
              ).avg -
                  1) *
                  100,
          )
        : 0;
    const mini = packsReady(u, now);
    const packs = stackCount(u, now);
    const next = nextPackIn(u, now);
    const goal = momentGoal(u, now);
    const evoOn = u.evos.find(evoReady);
    const season = seasonAt(now);
    const repeats = u.pending.filter((p) => p.kind === 'card').length;
    const prizes = u.pending.length - repeats;
    const lastDay = lastDayPrizes(now, u.pending);

    return (
        <div className="ut-home">
            {u.pending.length > 0 && (
                <button type="button" className="panel bc-surface bc-stripe ut-block ut-b-pending" onClick={onPending}>
                    <BlockHead icon="chest" title={`${t('ultimate.home.pending')} · ${u.pending.length}`} />
                    <small>{t('ultimate.home.pendingState', { c: repeats, p: prizes })}</small>
                    {lastDay > 0 && <strong className="ut-b-last">{t('ultimate.home.lastDay', { n: lastDay })}</strong>}
                    <span className="btn small confirm ut-b-cta">{t('ultimate.home.resolve')}</span>
                </button>
            )}
            <button type="button" className="panel bc-surface ut-block ut-b-squad" onClick={() => onTab('squad')}>
                <BlockHead
                    icon="team"
                    title={t('ultimate.home.squad')}
                    state={
                        ready
                            ? t('ultimate.home.squadState', { n: avg, c: chem })
                            : tn('ultimate.home.squadNeed', STARTERS - lineup.length)
                    }
                />
                <span className="ut-b-court">
                    {roles.map((role, i) => {
                        const p = lineup[i];
                        return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: as vagas da formação são fixas
                            <span key={i} className={p?.uid === u.team.captainUid ? 'cap' : undefined}>
                                {p ? <img className="pixel" src={cardSprite(p)} alt="" /> : <i aria-hidden />}
                                <small>{d.common.posShort[role]}</small>
                            </span>
                        );
                    })}
                </span>
            </button>
            <div className="ut-b-grid">
                <button type="button" className="panel bc-surface ut-block ut-b-stack" onClick={() => onTab('shop')}>
                    <BlockHead icon="bag" title={t('ultimate.stack.title')} count={packs} />
                    {packs ? (
                        <b className="ut-b-hot">
                            {[
                                mini && `${t('ultimate.stack.miniShort')} x${mini}`,
                                u.bigPacks && `${t('ultimate.stack.bigShort')} x${u.bigPacks}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </b>
                    ) : (
                        <b>{t('ultimate.home.packsNone')}</b>
                    )}
                    {next !== null && (
                        <small className="ut-timer">
                            <HudIcon kind="stopwatch" />
                            {hms(next)}
                        </small>
                    )}
                </button>
                <button type="button" className="panel bc-surface ut-block" onClick={() => onTab('goals')}>
                    <BlockHead icon="medal" title={t('ultimate.home.goals')} />
                    {goal?.kind === 'first' ? (
                        <>
                            <b>{d.ultimate.first.steps[FIRST_STEPS[goal.n]?.id ?? 'pack']}</b>
                            <BlockBar n={goal.n} of={goal.of} />
                        </>
                    ) : goal ? (
                        <>
                            <b>{tn(`ultimate.goals.text.${goal.o.kind}`, goal.o.goal)}</b>
                            <BlockBar n={goal.n} of={goal.o.goal} />
                        </>
                    ) : (
                        <small>{t('ultimate.home.goalsDone')}</small>
                    )}
                </button>
                <button type="button" className="panel bc-surface ut-block" onClick={() => onTab('goals')}>
                    <BlockHead icon="sprout" title={`${t('ultimate.home.evos')} ${u.evos.length}/${EVO_ACTIVE_MAX}`} />
                    {evoOn ? (
                        <b className="ut-b-hot">
                            {t('ultimate.home.evoReady', {
                                name: byUid.get(evoOn.uid) ? viewInstance(byUid.get(evoOn.uid)!).displayName : '',
                            })}
                        </b>
                    ) : u.evos.length ? (
                        <small>
                            {u.evos
                                .flatMap((e) => (byUid.get(e.uid) ? [viewInstance(byUid.get(e.uid)!).displayName] : []))
                                .join(' · ')}
                        </small>
                    ) : (
                        <small>{t('ultimate.home.evoNone')}</small>
                    )}
                </button>
                <button type="button" className="panel bc-surface ut-block" onClick={() => onTab('goals')}>
                    <BlockHead
                        icon="crown"
                        title={season ? t('ultimate.season.title', { n: season.n }) : t('ultimate.home.season')}
                    />
                    <b>{t('ultimate.pass.mark', { a: u.pass.marks, b: PASS_MARKS })}</b>
                    <BlockBar n={u.pass.marks} of={PASS_MARKS} />
                </button>
                <button type="button" className="panel bc-surface ut-block ut-b-gyms" onClick={() => setSheet('gyms')}>
                    <BlockHead icon="stadium" title={`${t('ultimate.home.gyms')} ${u.gyms.length}/${GYMS.length}`} />
                    <span className="ut-b-badges">
                        {GYMS.map((g) => (
                            <KantoBadge key={g.id} leader={g.id as TrainerId} earned={u.gyms.includes(g.id)} />
                        ))}
                    </span>
                </button>
            </div>
            <section className="ut-b-play">
                {u.live ? (
                    <button
                        type="button"
                        className="btn primary big wide ut-go"
                        disabled={busy}
                        onClick={() => void kick()}
                    >
                        <i className="cb-shine" aria-hidden />
                        <span>
                            {busy ? t('ultimate.play.warming') : t('ultimate.play.resume')}
                            <small className="ut-go-goal">
                                {clubName(u.live.rival.name, lang)} · {d.ultimate.play.levels[u.live.level]}
                            </small>
                        </span>
                    </button>
                ) : ready && rival ? (
                    <>
                        <button type="button" className="btn primary big wide ut-go" disabled={busy} onClick={start}>
                            <i className="cb-shine" aria-hidden />
                            <span>{busy ? t('ultimate.play.warming') : t('ultimate.play.go')}</span>
                        </button>
                        <button type="button" className="ut-level-chip" onClick={() => setSheet('level')}>
                            <HudIcon kind="coin" />
                            {t('ultimate.home.levelChip', {
                                level: d.ultimate.play.levels[level],
                                n: FICHAS[paid(level)].win,
                            })}
                            <b>{t('ultimate.home.change')}</b>
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn wide" onClick={() => onTab('shop')}>
                        {t('ultimate.play.toPacks')}
                    </button>
                )}
                {error && <p className="error-text">{error}</p>}
            </section>
            <Sheet open={sheet === 'level'} onClose={() => setSheet(null)} title={t('ultimate.play.level')}>
                {rival && <LevelPick level={level} onLevel={setLevel} rival={rival} strength={strength} paid={paid} />}
            </Sheet>
            <Sheet
                open={sheet === 'gyms'}
                onClose={() => setSheet(null)}
                title={t('ultimate.gyms.title')}
                className="ut-gyms-sheet"
            >
                <Gyms u={u} busy={busy} onGo={challenge} />
            </Sheet>
        </div>
    );
}

function BlockHead({
    icon,
    title,
    state,
    count,
}: {
    icon: HudIconKind;
    title: string;
    state?: ReactNode;
    /** O número do que espera você ali (como no FC). */
    count?: number;
}) {
    return (
        <span className="ut-b-head">
            <HudIcon kind={icon} />
            <b>{title}</b>
            {!!count && <i className="ut-count">{count}</i>}
            {state && <small>{state}</small>}
        </span>
    );
}

function BlockBar({ n, of }: { n: number; of: number }) {
    return (
        <span className="ut-bar" style={{ '--p': Math.min(n, of) / of } as CSSProperties}>
            <i aria-hidden />
            <small>
                {Math.min(n, of)}/{of}
            </small>
        </span>
    );
}

/** A sheet do nível: os 4 níveis, a tabela de Fichas e o rival que sai no nível escolhido. */
function LevelPick({
    level,
    onLevel,
    rival,
    strength,
    paid,
}: {
    level: Level;
    onLevel: (lv: Level) => void;
    rival: ReturnType<typeof ultimateRival>;
    strength: number;
    paid: (lv: Level) => Level;
}) {
    const { t, d, lang } = useT();
    const u = useGame((s) => s.ultimate);
    return (
        <div className="ut-level">
            <div className="bc-seg">
                {LEVELS.map((lv) => (
                    <button
                        type="button"
                        key={lv}
                        aria-pressed={level === lv}
                        className={level === lv ? 'on' : undefined}
                        onClick={() => onLevel(lv)}
                    >
                        {d.ultimate.play.levels[lv]}
                    </button>
                ))}
            </div>
            <span className="bc-lbl">{t('ultimate.play.prize')}</span>
            <table className="ut-prizes">
                <thead>
                    <tr>
                        <th />
                        <th>{t('ultimate.play.win')}</th>
                        <th>{t('ultimate.play.draw')}</th>
                        <th>{t('ultimate.play.loss')}</th>
                    </tr>
                </thead>
                <tbody>
                    {LEVELS.map((lv) => (
                        <tr key={lv} className={level === lv ? 'on' : undefined}>
                            <th>{d.ultimate.play.levels[lv]}</th>
                            <td>{FICHAS[paid(lv)].win}</td>
                            <td>{FICHAS[paid(lv)].draw}</td>
                            <td>{FICHAS[paid(lv)].loss}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <small className="muted">{t('ultimate.play.prizeNote')}</small>
            {paid(level) !== level && (
                <small>{t('ultimate.play.noRival', { level: d.ultimate.play.levels[paid(level)] })}</small>
            )}
            <section
                key={rival.name}
                className="panel ut-rival bc-surface bc-stripe"
                style={{ '--tc': `#${rival.color.toString(16).padStart(6, '0')}` } as CSSProperties}
            >
                <span className="bc-lbl">{t('ultimate.play.rival')}</span>
                <b>{clubName(rival.name, lang)}</b>
                <span className="lg-squad">
                    {rival.lineup.map((p) => (
                        <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                    ))}
                </span>
                <small>
                    {t('ultimate.play.rivalPower', { n: Math.round(teamStrength(rival)) })} ·{' '}
                    {t('ultimate.play.yourPower', { n: Math.round(strength) })}
                </small>
                {u.played > 0 && (
                    <small className="muted">{t('ultimate.play.record', { w: u.wins, d: u.draws, l: u.losses })}</small>
                )}
            </section>
        </div>
    );
}

/** Do pós-jogo: tempo entre as batidas (ms) e o teto da festa toda (menus-fc-e-aclamados.md, direção B). */
const POST_MS = { fichas: 400, pass: 450, line: 250, prize: 400, max: 3000 };

/**
 * Pós-jogo em cascata (≤ 3 s; tocar pula pro fim): o placar, as Fichas contando, o passe, os objetivos e os Primeiros
 * passos batendo um por um e, por último, o que a partida deu. Prêmio espera o Resgatar (aqui ou nos Pendentes);
 * resgatado, o pacote vai pra Meus pacotes ("+2 em Meus pacotes"): Continuar é o principal e nada empurra pra abrir
 * (ultimate-fc.md, decidido em 09/11).
 */
function PostGame({ last, onGoals, onPacks }: { last: UltimateLast; onGoals: () => void; onPacks: () => void }) {
    const { t, tn, d, lang } = useT();
    const reward = useReward();
    const evo = useGame((s) => s.ultimate.evos.some(evoReady));
    const prizes = useGame((s) => s.ultimate.pending.some((p) => p.kind === 'prize'));
    const stack = useGame((s) => stackCount(s.ultimate, utNow()));
    const seen = () => useGame.getState().ultimateSeen();
    const objectives = (last.objectives ?? []).flatMap((id) => objectiveById(id) ?? []);
    const firsts = (last.firsts ?? []).flatMap((id) => FIRST_STEPS.find((f) => f.id === id) ?? []);
    const packs = lastPacks(last);
    const got = packs.mini + packs.big + packs.picks;
    const hasPacks = got > 0;
    const extra = !!(last.badge && last.gym) || !!last.ornament;
    const raw = [
        POST_MS.fichas,
        ...(last.pass !== undefined ? [POST_MS.pass] : []),
        ...[...objectives, ...firsts].map(() => POST_MS.line),
        ...(extra ? [POST_MS.prize] : []),
        ...(hasPacks ? [POST_MS.prize] : []),
    ];
    // cabe nos 3 s: as batidas encolhem na mesma proporção
    const times = beatTimes(raw, POST_MS.max);
    const c = useCascade(times.map((x, i) => x - (times[i - 1] ?? 0)));
    // deitado (844x390) o prêmio nascia abaixo da dobra: rola até ele
    const box = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = box.current;
        if (el && el.getBoundingClientRect().top > window.innerHeight / 2)
            el.scrollIntoView({ block: 'start', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    }, []);
    let n = 0;
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a festa; o conteúdo já está no DOM e os botões no teclado
        <section ref={box} className={`panel ut-prize bc-surface bc-stripe is-${last.outcome}`} onClick={c.skip}>
            <span className="bc-tag">{t('ultimate.result.title')}</span>
            <b className="ut-verdict cb-num k-pop">
                {t(`ultimate.result.${last.outcome}`)} {last.score[0]}x{last.score[1]}
            </b>
            {last.shootout && <small>{t('ultimate.result.pens', { a: last.shootout[0], b: last.shootout[1] })}</small>}
            <small className="muted">
                {t('ultimate.result.vs', {
                    club: clubName(last.rival, lang),
                    level: last.gym
                        ? (d.profile.trainers[last.gym as TrainerId] ?? last.gym)
                        : d.ultimate.play.levels[last.level],
                })}
            </small>
            <Beat on={c.step > n++} className="ut-gain">
                <HudIcon kind="coin" />
                <CountUp
                    from={0}
                    to={c.step >= n ? last.fichas : 0}
                    skip={c.skipped}
                    ms={600}
                    format={(x) => t('ultimate.result.gain', { n: x })}
                />
            </Beat>
            {last.pass !== undefined && (
                <Beat on={c.step > n++}>
                    <small className="ut-extra">
                        <HudIcon kind="crown" />
                        {last.pass ? t('ultimate.result.pass', { n: last.pass }) : t('ultimate.result.passCap')}
                        {!!last.marks?.length &&
                            ` · ${tn('ultimate.result.marks', last.marks.length, { n: last.marks.join(', ') })}`}
                    </small>
                </Beat>
            )}
            {(objectives.length > 0 || firsts.length > 0) && (
                <div className="ut-prize-goals">
                    <span className="bc-lbl">{t('ultimate.result.objectives')}</span>
                    {objectives.map((o) => (
                        <Beat key={o.id} on={c.step > n++}>
                            <small>
                                <HudIcon kind="check" />
                                {tn(`ultimate.goals.text.${o.kind}`, o.goal)} · {reward(o)}
                            </small>
                        </Beat>
                    ))}
                    {firsts.map((f) => (
                        <Beat key={f.id} on={c.step > n++}>
                            <small>
                                <HudIcon kind="flag" />
                                {d.ultimate.first.steps[f.id]} · {t('ultimate.goals.fichas', { n: f.fichas })}
                            </small>
                        </Beat>
                    ))}
                </div>
            )}
            {extra && (
                <Beat on={c.step > n++} className="ut-prize-extra">
                    {last.badge && last.gym && (
                        <span className="ut-gain ut-badge">
                            <KantoBadge leader={last.gym as TrainerId} earned />
                            {t('ultimate.result.badge', { badge: d.profile.badges.names[last.gym] ?? last.gym })}
                        </span>
                    )}
                    {last.ornament && (
                        <small className="ut-extra">
                            <HudIcon kind="sparkle" />
                            {t('ultimate.result.ornament', { name: d.ultimate.events[last.ornament] ?? last.ornament })}
                        </small>
                    )}
                </Beat>
            )}
            {hasPacks && (
                <Beat on={c.step > n++} className="ut-prize-packs">
                    <PackArt
                        look={packs.picks ? 'gold' : ''}
                        label={
                            packs.picks
                                ? t('ultimate.pick.short')
                                : packs.big
                                  ? t('ultimate.packs.big')
                                  : t('ultimate.packs.mini')
                        }
                    />
                    <span>
                        {prizes ? (
                            <span className="bc-lbl">{t('ultimate.result.toOpen')}</span>
                        ) : (
                            // resgatado: o destino à vista (nada abre sozinho; a pilha espera em Meus pacotes)
                            <b key="got" className="ut-b-hot k-pop">
                                {t('ultimate.stack.gotN', { n: got })}
                            </b>
                        )}
                        {packs.mini > 0 && <small>{tn('ultimate.goals.packs', packs.mini)}</small>}
                        {packs.big > 0 && <small>{tn('ultimate.goals.big', packs.big)}</small>}
                        {packs.picks > 0 && <small>{tn('ultimate.result.picks', packs.picks)}</small>}
                    </span>
                </Beat>
            )}
            {evo && (
                <button type="button" className="btn ghost small" onClick={onGoals}>
                    <HudIcon kind="sprout" />
                    {t('ultimate.result.evoReady')}
                </button>
            )}
            <div className="ut-prize-actions">
                {prizes && (
                    <button
                        type="button"
                        className="btn confirm wide"
                        onClick={(e) => {
                            e.stopPropagation();
                            c.skip();
                            useGame.getState().ultimateRedeem();
                        }}
                    >
                        {t('ultimate.pending.redeemAll')}
                    </button>
                )}
                <button type="button" className={prizes ? 'btn' : 'btn confirm wide'} onClick={seen}>
                    {t('ultimate.result.next')}
                </button>
                {!prizes && stack > 0 && (
                    <button
                        type="button"
                        className="btn"
                        onClick={() => {
                            seen();
                            onPacks();
                        }}
                    >
                        {t('ultimate.stack.mine', { n: stack })}
                    </button>
                )}
            </div>
        </section>
    );
}
