import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { FORMATIONS } from '../../engine/formations';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { chemistry } from '../../store/ultimate/chemistry';
import { utNow } from '../../store/ultimate/clock';
import { evoReady } from '../../store/ultimate/evolutions';
import { eventAhead, objectiveById } from '../../store/ultimate/objectives';
import { FICHAS, FIRST_STEPS, PASS_MARKS, STARTERS } from '../../store/ultimate/rules';
import { lastDayPrizes } from '../../store/ultimate/season';
import {
    lastPacks,
    momentGoal,
    nextPackIn,
    packsReady,
    stackCount,
    teamAverage,
    type UltimateLast,
} from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { PackArt } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { beatTimes } from '../kit/beats';
import { Beat, useCascade } from '../kit/Cascade';
import { reduceMotionOn } from '../reduce-motion';
import { hms, useNow } from './clock';
import { useReward } from './Goals';
import { usePickName } from './PickMoment';
import { SOON, SOON_ART, trainer, useBattle } from './Play';

export type UtTab = 'home' | 'play' | 'club' | 'shop' | 'goals';

/**
 * Início do Time Ultimate (retorno do Miguel, 09/11: "uns quadrados com JOGAR, CLUBE, LOJA, OBJETIVOS, de tamanhos e
 * pesos diferentes"): o hub do FC em blocos. JOGAR é o maior e o único dourado (o próximo jogo e a meta da vez) e leva
 * pra aba Jogar; em volta, Clube (o cartão do time), Loja (Meus pacotes) e Metas (a meta e o passe); o destaque largo
 * embaixo. Pendentes em cima, só quando tem. Voltando da partida, o pós-jogo vem antes dos blocos.
 */
export function Home({
    onTab,
    onPending,
    onSquad,
}: {
    onTab: (t: UtTab) => void;
    onPending: () => void;
    onSquad: () => void;
}) {
    const { t, tn, d, lang } = useT();
    const now = useNow();
    const name = usePickName();
    const { u, home, ready, rival, level, paid } = useBattle();

    const last = u.last && !u.last.seen ? u.last : null;
    if (last) return <PostGame last={last} onGoals={() => onTab('goals')} onPacks={() => onTab('shop')} />;

    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const lineup = u.team.order.slice(0, STARTERS).flatMap((x) => byUid.get(x) ?? []);
    const roles = FORMATIONS[u.team.formation].slots;
    const avg = ready ? teamAverage(home) : 0;
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
    const packs = stackCount(u, now);
    const next = nextPackIn(u, now);
    const goal = momentGoal(u, now);
    const goalText =
        goal?.kind === 'first'
            ? d.ultimate.first.steps[FIRST_STEPS[goal.n]?.id ?? 'pack']
            : goal
              ? tn(`ultimate.goals.text.${goal.o.kind}`, goal.o.goal)
              : null;
    const evos = u.evos.filter(evoReady).length;
    const repeats = u.pending.filter((p) => p.kind === 'card').length;
    const prizes = u.pending.length - repeats;
    const lastDay = lastDayPrizes(now, u.pending);
    const versus = u.live?.rival ?? rival;

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
            {/* Jogar · Modos de jogo: o primeiro bloco (painel, não botão); a arte é a da aba Jogar, o liberado e os em breve */}
            <button
                type="button"
                className="panel bc-surface bc-stripe ut-block ut-b-jogar"
                onClick={() => onTab('play')}
            >
                <BlockHead icon="play" title={`${d.ultimate.tabs.play} · ${t('ultimate.home.modes')}`} />
                <span className="ut-b-modes" aria-hidden>
                    <span className="ut-mode-art">
                        {versus ? (
                            <span className="ut-mode-team">
                                {versus.lineup.map((p) => (
                                    <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                                ))}
                            </span>
                        ) : (
                            <span className="ut-mode-vs">{[trainer('red'), trainer('acetrainer')]}</span>
                        )}
                    </span>
                    <span className="ut-b-soon">
                        {SOON.map((id) => (
                            <span key={id} className={`ut-mode-art is-${id}`}>
                                {SOON_ART[id]}
                            </span>
                        ))}
                    </span>
                </span>
                <b>{t('ultimate.modes.battles.name')}</b>
                <small>
                    {u.live
                        ? `${t('ultimate.play.resume')} · ${clubName(u.live.rival.name, lang)}`
                        : rival
                          ? t('ultimate.home.next', {
                                club: clubName(rival.name, lang),
                                level: d.ultimate.play.levels[level],
                                n: FICHAS[paid(level)].win,
                            })
                          : (goalText ?? tn('ultimate.home.squadNeed', STARTERS - lineup.length))}
                </small>
            </button>
            <button type="button" className="panel bc-surface ut-block ut-b-club" onClick={onSquad}>
                <BlockHead icon="team" title={d.ultimate.tabs.club} />
                {ready ? (
                    // o cartão do time: a nota grande e a química (como o FC)
                    <span className="ut-b-ovr">
                        <b className="cb-num">{avg}</b>
                        <small>{t('ultimate.home.chem', { c: chem })}</small>
                    </span>
                ) : (
                    <small>{tn('ultimate.home.squadNeed', STARTERS - lineup.length)}</small>
                )}
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
                <small>{tn('ultimate.home.cards', u.cards.length)}</small>
            </button>
            <button type="button" className="panel bc-surface ut-block ut-b-shop" onClick={() => onTab('shop')}>
                <BlockHead icon="bag" title={d.ultimate.tabs.shop} count={packs} />
                <b className={packs ? 'ut-b-hot' : undefined}>{t('ultimate.stack.mine', { n: packs })}</b>
                {u.picks.length > 0 && (
                    <small className="ut-b-pick">
                        <HudIcon kind="cards" />
                        {name(u.picks[0]).title}
                        {u.picks.length > 1 && ` +${u.picks.length - 1}`}
                    </small>
                )}
                {next !== null && (
                    <small className="ut-timer">
                        <HudIcon kind="stopwatch" />
                        {t('ultimate.packs.next', { time: hms(next) })}
                    </small>
                )}
            </button>
            <button type="button" className="panel bc-surface ut-block ut-b-goals" onClick={() => onTab('goals')}>
                <BlockHead icon="medal" title={d.ultimate.tabs.goals} count={evos} />
                {goal ? (
                    <>
                        <b>{goalText}</b>
                        <BlockBar n={goal.n} of={goal.kind === 'first' ? goal.of : goal.o.goal} />
                    </>
                ) : (
                    <small>{t('ultimate.home.goalsDone')}</small>
                )}
                <small>{t('ultimate.pass.mark', { a: u.pass.marks, b: PASS_MARKS })}</small>
                <BlockBar n={u.pass.marks} of={PASS_MARKS} />
                {evos > 0 && <small className="ut-b-hot">{tn('ultimate.home.evosReady', evos)}</small>}
            </button>
            <Highlights onTab={onTab} />
        </div>
    );
}

type Slide = { id: string; tab: UtTab; art: ReactNode; title: string; line: string; cta: string };

/** Troca o destaque sozinho a cada tanto (pausa quando a pessoa mexe; parado com Reduzir movimento). */
const SLIDE_MS = 6000;

/**
 * Destaque no topo do Início (ultimate-fc.md, opção C): o que tem de mais quente agora (a pilha, o Pick, o evento), um
 * por vez num carrossel de arrastar (scroll-snap) que troca sozinho, com os pontinhos embaixo. Um só fica parado.
 */
function Highlights({ onTab }: { onTab: (t: UtTab) => void }) {
    const { t, tn, d } = useT();
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const name = usePickName();
    const packs = packsReady(u, now) + u.bigPacks;
    const event = eventAhead(now);
    const live = event && now >= event.start;
    const slides: Slide[] = [
        ...(packs
            ? [
                  {
                      id: 'packs',
                      tab: 'shop' as const,
                      art: (
                          <span className="ut-hl-packs">
                              {Array.from({ length: Math.min(3, packs) }, (_, i) => (
                                  // biome-ignore lint/suspicious/noArrayIndexKey: só a pilha desenhada
                                  <PackArt key={i} look="" />
                              ))}
                          </span>
                      ),
                      title: tn('ultimate.hl.packs', packs),
                      line: event
                          ? t('ultimate.hl.packsEvent', { name: d.ultimate.events[event.id] ?? event.id })
                          : t('ultimate.hl.packsLine'),
                      cta: t('ultimate.stack.title'),
                  },
              ]
            : []),
        ...(u.picks.length
            ? [
                  {
                      id: 'pick',
                      tab: 'shop' as const,
                      art: (
                          <span className="ut-hl-packs">
                              <PackArt
                                  look={u.picks[0].min === 'ouro' ? 'gold' : ''}
                                  label={t('ultimate.pick.short')}
                                  type={u.picks[0].type}
                              />
                          </span>
                      ),
                      title: name(u.picks[0]).title,
                      line: name(u.picks[0]).hint,
                      cta: t('ultimate.pick.open'),
                  },
              ]
            : []),
        ...(event
            ? [
                  {
                      id: 'event',
                      tab: 'goals' as const,
                      art: <HudIcon kind="sparkle" className="ut-hl-ic" />,
                      title: t('ultimate.event.title', { name: d.ultimate.events[event.id] ?? event.id }),
                      line: live
                          ? t('ultimate.event.ends', { time: hms(event.end - now) })
                          : t('ultimate.hl.eventSoon', { time: hms(event.start - now) }),
                      cta: t('ultimate.home.goals'),
                  },
              ]
            : []),
    ];
    const box = useRef<HTMLDivElement>(null);
    const [at, setAt] = useState(0);
    const touched = useRef(false);
    const n = slides.length;
    useEffect(() => {
        if (n < 2 || reduceMotionOn()) return;
        const id = window.setInterval(() => {
            const el = box.current;
            if (!el || touched.current) return;
            const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % n;
            el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
        }, SLIDE_MS);
        return () => clearInterval(id);
    }, [n]);
    if (!n) return null;
    const go = (i: number) => {
        touched.current = true;
        const el = box.current;
        el?.scrollTo({ left: i * el.clientWidth, behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    };
    return (
        <section className="ut-hl" aria-roledescription="carousel" aria-label={t('ultimate.hl.title')}>
            <div
                ref={box}
                className="ut-hl-track"
                onPointerDown={() => {
                    touched.current = true;
                }}
                onScroll={(e) => {
                    const el = e.currentTarget;
                    setAt(Math.round(el.scrollLeft / el.clientWidth));
                }}
            >
                {slides.map((sl) => (
                    <button
                        type="button"
                        key={sl.id}
                        className={`panel bc-surface bc-stripe ut-block ut-hl-slide is-${sl.id}`}
                        onClick={() => onTab(sl.tab)}
                    >
                        {sl.art}
                        <span className="ut-hl-text">
                            <span className="bc-lbl">{t('ultimate.hl.title')}</span>
                            <b>{sl.title}</b>
                            <small>{sl.line}</small>
                        </span>
                        <span className="btn small confirm ut-b-cta">{sl.cta}</span>
                    </button>
                ))}
            </div>
            {n > 1 && (
                <span className="ut-hl-dots">
                    {slides.map((sl, i) => (
                        <button
                            type="button"
                            key={sl.id}
                            className={i === at ? 'on' : undefined}
                            aria-label={sl.title}
                            aria-current={i === at}
                            onClick={() => go(i)}
                        />
                    ))}
                </span>
            )}
        </section>
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
