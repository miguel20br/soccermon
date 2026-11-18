import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { FORMATIONS } from '../../engine/formations';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { clubColorHex, rivalColor } from '../../store/profile';
import { chemistry, chemTotal } from '../../store/ultimate/chemistry';
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
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { CourtFloor, clubVars, Stands } from '../ambientes/Estadio';
import { FieldSprite } from '../ambientes/FieldSprite';
import { PlayBar } from '../ambientes/PlayBar';
import { floorZone } from '../ambientes/Room';
import { BIG, SMALL, sceneScale, useMq } from '../ambientes/sprite-scale';
import { useWild, WildZone } from '../ambientes/WildZone';
import type { Wild } from '../ambientes/wild';
import '../ambientes/ambientes.css';
import { KantoBadge } from '../components/BadgeCase';
import { PackArt } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { Confetti } from '../components/ResultHero';
import { beatTimes } from '../kit/beats';
import { Beat, useCascade } from '../kit/Cascade';
import '../kit/stage.css';
import { useClubColor } from '../profile/club';
import { reduceMotionOn } from '../reduce-motion';
import { hms, useNow } from './clock';
import { useReward } from './Goals';
import { usePickName } from './PickMoment';
import { useBattle } from './Play';

/** Celular baixo em pé (SE): a quadra do prêmio encolhe (ultimate.css). */
const SHORT = '(max-height: 640px) and (orientation: portrait)';
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export type UtTab = 'home' | 'play' | 'club' | 'shop' | 'goals';

/**
 * Início do Time Ultimate: a quadra do Estádio com os seus 5 titulares andando nela (decisão do Miguel, 17/11: o modo
 * mora no mesmo estádio do Clássico) e o JOGAR dourado fixo embaixo, que leva pra aba Jogar (retorno de 17/11: a
 * partida começa lá, onde se escolhe nível e líder). Clube, Loja e Metas ficam em blocos menores embaixo da quadra; Pendentes e o destaque depois. Sem time ainda, a quadra fica vazia e
 * o lugar do JOGAR convida a abrir o pacote. Voltando da partida, o prêmio vem antes de tudo.
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
    const scale = sceneScale(useMq(SMALL), useMq(BIG));

    const last = u.last && !u.last.seen ? u.last : null;
    if (last) return <PostGame last={last} onGoals={() => onTab('goals')} onPacks={() => onTab('shop')} />;

    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const lineup = u.team.order.slice(0, STARTERS).flatMap((x) => byUid.get(x) ?? []);
    const roles = FORMATIONS[u.team.formation].slots;
    const avg = ready ? teamAverage(home) : 0;
    const chem = ready
        ? chemTotal(
              chemistry(
                  lineup,
                  roles,
                  [],
                  u.team.order.slice(STARTERS).flatMap((x) => byUid.get(x) ?? []),
              ),
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
    const need = tn('ultimate.home.squadNeed', STARTERS - lineup.length);
    // o letreiro da quadra: o próximo jogo (ou o que falta pro time)
    const led = (
        versus
            ? t('ultimate.home.next', {
                  club: clubName(versus.name, lang),
                  level: d.ultimate.play.levels[u.live?.level ?? level],
                  n: FICHAS[u.live?.level ?? paid(level)].win,
              })
            : (goalText ?? need)
    ).toUpperCase();
    // os titulares andam na quadra como os Pokémon ambiente (tocar faz pular e gritar)
    const team: Wild[] = lineup.map((c) => ({
        key: `ut-${c.uid}`,
        id: c.speciesId,
        zone: 'floor',
        mood: 'busy',
        ...(c.shiny && { shiny: true }),
    }));
    return (
        <div className="ut-home">
            <UtCourt team={team} led={led} scale={scale} />
            <button type="button" className="panel bc-surface ut-block ut-b-club" onClick={onSquad}>
                <BlockHead icon="team" title={d.ultimate.tabs.club} />
                {ready ? (
                    // o cartão do time: a nota grande e a química (como o FC)
                    <span className="ut-b-ovr">
                        <b className="cb-num">{avg}</b>
                        <small>{t('ultimate.home.chem', { n: chem, max: STARTERS * 3 })}</small>
                    </span>
                ) : (
                    <small>{need}</small>
                )}
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
                <small>{t('ultimate.pass.title')}</small>
                <BlockBar n={u.pass.marks} of={PASS_MARKS} />
                {evos > 0 && <small className="ut-b-hot">{tn('ultimate.home.evosReady', evos)}</small>}
            </button>
            {u.pending.length > 0 && (
                <button type="button" className="panel bc-surface bc-stripe ut-block ut-b-pending" onClick={onPending}>
                    <BlockHead icon="chest" title={`${t('ultimate.home.pending')} · ${u.pending.length}`} />
                    <small>{t('ultimate.home.pendingState', { c: repeats, p: prizes })}</small>
                    {lastDay > 0 && <strong className="ut-b-last">{t('ultimate.home.lastDay', { n: lastDay })}</strong>}
                    <span className="btn small confirm ut-b-cta">{t('ultimate.home.resolve')}</span>
                </button>
            )}
            <Highlights onTab={onTab} />
            {/* o JOGAR do Estádio (PlayBar), fixo embaixo; sem time, o convite pro pacote no lugar dele */}
            <div className="ut-home-go">
                {versus ? (
                    <PlayBar
                        main={{
                            id: 'quick',
                            title: '',
                            icon: 'play',
                            verb: u.live ? t('home.resume') : t('ultimate.play.go'),
                            sub: t('ultimate.home.modes'),
                            go: () => onTab('play'),
                        }}
                        sheet={[]}
                        onPick={() => undefined}
                    />
                ) : (
                    <div className="es-go">
                        <button type="button" className="btn cb cb-green es-play" onClick={() => onTab('shop')}>
                            <i className="cb-shine" aria-hidden />
                            <b className="es-play-verb">
                                {u.cards.length ? t('ultimate.play.toPacks') : d.ultimate.first.steps.pack}
                            </b>
                            <small className="es-play-sub">{need}</small>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * A quadra do Estádio no Time Ultimate (decisão do Miguel, 17/11: o modo mora no mesmo estádio do Clássico): a torcida
 * na cor do clube com a faixa, o letreiro e o piso em perspectiva. `team` anda nela como os Pokémon ambiente;
 * `children` fica no meio da quadra (o craque do prêmio).
 */
function UtCourt({
    team = [],
    led,
    scale,
    children,
}: {
    team?: Wild[];
    led: string;
    scale: number;
    children?: ReactNode;
}) {
    const clock = useSceneClock(true);
    // o pé na metade de baixo do piso: a cabeça não entra no letreiro
    const w = useWild(
        clock,
        team,
        floorZone(scale, (_x, y) => y > 0.3),
    );
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    const name = useGame((s) => s.profile.clubName || 'Pallet FC');
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-bd ut-court" data-wild-panel>
                <div className="amb-scene es-scene" style={clubVars(club)}>
                    <Stands clubName={name} led={led} />
                    <div className="es-court">
                        <CourtFloor />
                        <i className="es-spot" />
                        <WildZone wild={w} zone="floor" />
                        {children}
                    </div>
                </div>
            </div>
        </ClockCtx.Provider>
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
 * Pós-jogo (decisão do Miguel, 17/11: tela cheia com o craque e o placar): o craque da partida grande no meio da quadra
 * do Estádio, VITÓRIA/DERROTA e o placar no formato do jogo (o mesmo do fim de jogo e do Resultado do Clássico); depois,
 * em cascata (≤ 3 s; tocar pula pro fim), as Fichas contando, o passe, os objetivos e os Primeiros passos batendo um por
 * um e, por último, o que a partida deu. Prêmio espera o Resgatar (aqui ou nos Pendentes); resgatado, o pacote vai pra
 * Meus pacotes ("+2 em Meus pacotes"): Continuar é o principal e nada empurra pra abrir (ultimate-fc.md, 09/11).
 */
function PostGame({ last, onGoals, onPacks }: { last: UltimateLast; onGoals: () => void; onPacks: () => void }) {
    const { t, tn, d, lang } = useT();
    const reward = useReward();
    const evo = useGame((s) => s.ultimate.evos.some(evoReady));
    const prizes = useGame((s) => s.ultimate.pending.some((p) => p.kind === 'prize'));
    const stack = useGame((s) => stackCount(s.ultimate, utNow()));
    // save de antes do craque guardado: o capitão no lugar
    const cap = useGame((s) => s.ultimate.cards.find((c) => c.uid === s.ultimate.team.captainUid));
    const star = last.star ?? (cap && { speciesId: cap.speciesId, shiny: !!cap.shiny, name: '' });
    const homeName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const homeColor = useClubColor();
    // o craque um degrau acima da escala da cena (está sozinho na quadra); no celular baixo em pé a quadra tem 130 px e
    // o degrau a mais subia a cabeça pro letreiro
    const scale = sceneScale(useMq(SMALL), useMq(BIG)) + (useMq(SHORT) ? 0 : 1);
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
    const rival = clubName(last.rival, lang);
    const title = t(`match.final.${last.outcome}`);
    const level = last.gym
        ? (d.profile.trainers[last.gym as TrainerId] ?? last.gym)
        : d.ultimate.play.levels[last.level];
    const colors = {
        '--home': hex(homeColor),
        '--away': last.rivalColor === undefined ? 'var(--line)' : hex(rivalColor(homeColor, last.rivalColor)),
    } as CSSProperties;
    let n = 0;
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: tocar pula a festa; o conteúdo já está no DOM e os botões no teclado
        <section
            className={`ut-prize is-${last.outcome}`}
            style={colors}
            aria-label={t('ultimate.result.title')}
            onClick={c.skip}
        >
            <UtCourt led={`${title} ${homeName} ${last.score[0]} x ${last.score[1]} ${rival} · ${level}`} scale={scale}>
                {last.outcome === 'win' && <Confetti count={36} />}
                {star && (
                    <div className="es-captain ut-star">
                        <i className="es-shadow" />
                        <FieldSprite
                            id={star.speciesId}
                            shiny={star.shiny}
                            anim={last.outcome === 'loss' ? 'Idle' : 'Pose'}
                            dir={0}
                            scale={scale}
                            className="es-mon"
                        />
                        {star.name && (
                            <span className="k-seal ut-star-seal">
                                <HudIcon kind="max" />
                                {t('match.finalCard.star')}: {star.name}
                            </span>
                        )}
                    </div>
                )}
            </UtCourt>
            <div className="ut-prize-body">
                <h1 className={`k-moment-title k-pop ${last.outcome}`}>{title}</h1>
                <div className="rh-score ut-score">
                    <div className="rh-team home">
                        <span>{homeName}</span>
                    </div>
                    <b className={last.score[0] > last.score[1] ? 'lead' : ''}>{last.score[0]}</b>
                    <span className="rh-x">x</span>
                    <b className={last.score[1] > last.score[0] ? 'lead' : ''}>{last.score[1]}</b>
                    <div className="rh-team away">
                        <span>{rival}</span>
                    </div>
                </div>
                {last.shootout && (
                    <small className="rh-pens">
                        {t('ultimate.result.pens', { a: last.shootout[0], b: last.shootout[1] })}
                    </small>
                )}
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
                                {t('ultimate.result.ornament', {
                                    name: d.ultimate.events[last.ornament] ?? last.ornament,
                                })}
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
            </div>
        </section>
    );
}
