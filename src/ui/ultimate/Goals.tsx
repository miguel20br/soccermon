import { type CSSProperties, useState } from 'react';
import { species } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { EventBus } from '../../game/EventBus';
import type { MatchEvolution } from '../../game/scenes/MatchScene';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    evoGoalsNeed,
    evoPaths,
    evoPreview,
    evoReady,
    evoSteps,
    newEvo,
    type UtEvo,
} from '../../store/ultimate/evolutions';
import { eventAt, nextReset, objectivesAt } from '../../store/ultimate/objectives';
import {
    EVO_ACTIVE_MAX,
    EVO_STEP,
    FIRST_STEPS,
    OBJECTIVES,
    type Objective,
    TRAIN_STEPS,
} from '../../store/ultimate/rules';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { hms, useNow } from './clock';
import { Pass } from './Season';

/** Aba Metas: o passe da temporada, os objetivos do evento, do dia e da semana (pagam sozinhos) e as Evoluções. */
export function Goals() {
    return (
        <>
            <FirstSteps />
            <Pass />
            <Objectives period="event" />
            <Objectives period="day" />
            <Objectives period="week" />
            <Evolutions />
        </>
    );
}

/**
 * Primeiros passos (o 1º dia): os 5 que ensinam o modo, o próximo em destaque, cada um com as Fichas dele. Some quando
 * todos pagaram. `compact` (abas Pacotes e Jogar) mostra só o próximo.
 */
export function FirstSteps({ compact = false }: { compact?: boolean }) {
    const { t, d } = useT();
    const firsts = useGame((s) => s.ultimate.firsts);
    if (firsts.length >= FIRST_STEPS.length) return null;
    const next = FIRST_STEPS.find((f) => !firsts.includes(f.id))?.id;
    return (
        <section className="panel ut-goals ut-first bc-surface bc-stripe">
            <h2 className="bc-caption">
                <HudIcon kind="flag" />
                {t('ultimate.first.title')}
                <small className="ut-reset">
                    {firsts.length}/{FIRST_STEPS.length}
                </small>
            </h2>
            {!compact && <small className="muted">{t('ultimate.first.hint')}</small>}
            <ul className="ut-goal-list">
                {FIRST_STEPS.filter((f) => !compact || f.id === next).map((f) => {
                    const done = firsts.includes(f.id);
                    return (
                        <li key={f.id} className={done ? 'done' : f.id === next ? 'next' : undefined}>
                            <span>
                                <b>{d.ultimate.first.steps[f.id]}</b>
                                <small>
                                    {done ? t('ultimate.goals.done') : t('ultimate.goals.fichas', { n: f.fichas })}
                                </small>
                            </span>
                            {done && <HudIcon kind="check" />}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

/** O prêmio do objetivo ("+40 Fichas · +1 Pacote Mini"). */
export function useReward() {
    const { t, tn } = useT();
    return (o: Objective) =>
        [
            o.fichas ? t('ultimate.goals.fichas', { n: o.fichas }) : '',
            o.packs ? tn('ultimate.goals.packs', o.packs) : '',
            o.big ? tn('ultimate.goals.big', o.big) : '',
        ]
            .filter(Boolean)
            .join(' · ');
}

function Objectives({ period }: { period: Objective['period'] }) {
    const { t, tn, d } = useT();
    const now = useNow();
    const g = objectivesAt(
        useGame((s) => s.ultimate.objectives),
        now,
    );
    const ornament = useGame((s) => s.ultimate.legacy.ornaments);
    const reward = useReward();
    const event = eventAt(now);
    if (period === 'event' && !event) return null;
    const list = event && period === 'event' ? event.objectives : OBJECTIVES.filter((o) => o.period === period);
    return (
        <section className={`panel ut-goals bc-surface${period === 'event' ? ' ut-event bc-stripe' : ''}`}>
            <h2 className="bc-caption">
                <HudIcon kind={period === 'day' ? 'stopwatch' : period === 'week' ? 'medal' : 'sparkle'} />
                {event && period === 'event'
                    ? t('ultimate.event.title', { name: d.ultimate.events[event.id] ?? event.id })
                    : period === 'day'
                      ? t('ultimate.goals.daily')
                      : t('ultimate.goals.weekly')}
                <small className="ut-reset">
                    {event && period === 'event'
                        ? t('ultimate.event.ends', { time: hms(event.end - now) })
                        : t('ultimate.goals.reset', { time: hms(nextReset(now, period as 'day' | 'week') - now) })}
                </small>
            </h2>
            {event && period === 'event' && (
                <small className={ornament.includes(event.id) ? 'ut-pass-done' : 'muted'}>
                    {ornament.includes(event.id) ? t('ultimate.event.ornament') : t('ultimate.event.hint')}
                </small>
            )}
            <ul className="ut-goal-list">
                {list.map((o) => {
                    const done = g.done.includes(o.id);
                    const n = Math.min(o.goal, g.prog[o.id] ?? 0);
                    return (
                        <li key={o.id} className={done ? 'done' : undefined}>
                            <span>
                                <b>{tn(`ultimate.goals.text.${o.kind}`, o.goal)}</b>
                                <small>{done ? t('ultimate.goals.done') : reward(o)}</small>
                            </span>
                            <Bar n={n} of={o.goal} />
                            {done && <HudIcon kind="check" />}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

/** Barra de progresso (x/meta), que anda com transição. */
function Bar({ n: raw, of, label }: { n: number; of: number; label?: string }) {
    const n = Math.min(raw, of);
    return (
        <span className="ut-bar" style={{ '--p': n / of } as CSSProperties}>
            <i aria-hidden />
            <small>
                {label ? `${label} ` : ''}
                {n}/{of}
            </small>
        </span>
    );
}

function Evolutions() {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const [picking, setPicking] = useState(false);
    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const free = u.cards.filter((c) => !u.evoDone.includes(c.uid) && !u.evos.some((e) => e.uid === c.uid));
    const full = u.evos.length >= EVO_ACTIVE_MAX;
    return (
        <section className="panel ut-evos bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="sprout" />
                {t('ultimate.evo.title')}
            </h2>
            <small className="muted">{t('ultimate.evo.hint')}</small>
            {u.evos.length === 0 && !picking && <p className="muted ut-evo-none">{t('ultimate.evo.none')}</p>}
            {u.evos.map((e) => byUid.get(e.uid) && <EvoRow key={e.uid} e={e} card={byUid.get(e.uid)!} />)}
            {picking ? (
                <EvoStart cards={free} onClose={() => setPicking(false)} />
            ) : (
                <button
                    type="button"
                    className="btn confirm wide"
                    disabled={full || !free.length || !!u.live}
                    onClick={() => setPicking(true)}
                >
                    {full
                        ? t('ultimate.evo.full', { n: EVO_ACTIVE_MAX })
                        : free.length
                          ? t('ultimate.evo.new')
                          : t('ultimate.evo.noCards')}
                </button>
            )}
        </section>
    );
}

/** Uma Evolução em andamento: a carta agora, a prévia do fim e o objetivo do passo. */
function EvoRow({ e, card }: { e: UtEvo; card: PokemonInstance }) {
    const { t } = useT();
    const live = useGame((s) => !!s.ultimate.live);
    const evolve = useGame((s) => s.ultimateEvolve);
    const drop = useGame((s) => s.ultimateDropEvo);
    const [note, setNote] = useState<string | null>(null);
    const ready = evoReady(e);
    const into = e.path[e.step];
    const go = () => {
        setNote(null);
        if (!into) {
            // Treino: sem troca de forma, só a subida
            const r = evolve(e.uid);
            if (r) setNote(t('ultimate.evo.trained', { name: viewInstance(r.card).displayName }));
            return;
        }
        // a tela de evolução da partida; quando ela fecha, a carta muda
        const ev: MatchEvolution = {
            team: 0,
            from: card.speciesId,
            into,
            name: viewInstance(card).displayName,
            newName: species(into).name,
            shiny: !!card.shiny,
        };
        const done = () => {
            EventBus.off('match:evolution-done', done);
            evolve(e.uid);
        };
        EventBus.on('match:evolution-done', done);
        EventBus.emit('match:evolution', ev);
    };
    return (
        <div className={`ut-evo${ready ? ' ready' : ''}`}>
            <div className="ut-evo-cards">
                <FutCard inst={card} size="sm" />
                <HudIcon kind="next" />
                <FutCard inst={evoPreview(card, e)} size="sm" ribbon={t('ultimate.evo.preview')} />
            </div>
            <div className="ut-evo-info">
                <b>
                    {into ? species(into).name : t('ultimate.evo.treino')} ·{' '}
                    {t('ultimate.evo.step', { a: e.step + 1, b: evoSteps(e) })}
                </b>
                <Bar n={e.prog.played} of={EVO_STEP.played} label={t('ultimate.evo.played')} />
                <Bar
                    n={e.prog.goals}
                    of={evoGoalsNeed(e)}
                    label={e.role === 'GK' ? t('ultimate.evo.saves') : t('ultimate.evo.goals')}
                />
                <Bar n={e.prog.mvp} of={EVO_STEP.mvp} label={t('ultimate.evo.mvp')} />
                {note && <small className="ut-note">{note}</small>}
                <span className="row ut-evo-actions">
                    <button type="button" className="btn primary" disabled={!ready || live} onClick={go}>
                        <i className="cb-shine" aria-hidden />
                        {into ? t('ultimate.evo.evolve') : t('ultimate.evo.train')}
                    </button>
                    <button type="button" className="btn ghost small" disabled={live} onClick={() => drop(e.uid)}>
                        {t('ultimate.evo.drop')}
                    </button>
                </span>
            </div>
        </div>
    );
}

/** Começar: escolhe a carta, o caminho (Eevee) e vê a forma final antes de confirmar. */
function EvoStart({ cards, onClose }: { cards: PokemonInstance[]; onClose: () => void }) {
    const { t } = useT();
    const start = useGame((s) => s.ultimateStartEvo);
    const [uid, setUid] = useState<string | null>(null);
    const [path, setPath] = useState(0);
    const card = cards.find((c) => c.uid === uid);
    const paths = card ? evoPaths(card) : [];
    const chosen = paths[path] ?? paths[0];
    const preview = card && chosen ? evoPreview(card, newEvo(card, chosen)) : null;
    return (
        <div className="ut-evo-start">
            <span className="bc-lbl">{t('ultimate.evo.pickCard')}</span>
            <div className="ut-chips">
                {cards.map((c) => (
                    <button
                        type="button"
                        key={c.uid}
                        aria-pressed={uid === c.uid}
                        className={`btn k-chip ut-chip${uid === c.uid ? ' on' : ''}`}
                        onClick={() => {
                            setUid(c.uid);
                            setPath(0);
                        }}
                    >
                        <MonIcon id={c.speciesId} shiny={c.shiny} />
                        {viewInstance(c).displayName}
                    </button>
                ))}
            </div>
            {card && chosen && preview && (
                <>
                    {paths.length > 1 && (
                        <>
                            <span className="bc-lbl">{t('ultimate.evo.path')}</span>
                            <div className="bc-seg">
                                {paths.map((p, i) => (
                                    <button
                                        type="button"
                                        key={p.join()}
                                        aria-pressed={i === path}
                                        className={i === path ? 'on' : undefined}
                                        onClick={() => setPath(i)}
                                    >
                                        {species(p.at(-1)!).name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="ut-evo-cards" key={`${uid}-${path}`}>
                        <FutCard inst={card} size="sm" />
                        <HudIcon kind="next" />
                        <FutCard inst={preview} size="sm" ribbon={t('ultimate.evo.preview')} />
                    </div>
                    <small className="muted">
                        {chosen.length
                            ? chosen.map((id) => species(id).name).join(' → ')
                            : t('ultimate.evo.treinoHint', {
                                  name: viewInstance(card).displayName,
                                  n: TRAIN_STEPS,
                              })}
                    </small>
                </>
            )}
            <span className="row ut-evo-actions">
                <button
                    type="button"
                    className="btn primary"
                    disabled={!card || !chosen}
                    onClick={() => {
                        if (!card || !chosen) return;
                        start(card.uid, chosen);
                        onClose();
                    }}
                >
                    {t('ultimate.evo.start')}
                </button>
                <button type="button" className="btn ghost small" onClick={onClose}>
                    {t('ultimate.evo.cancel')}
                </button>
            </span>
        </div>
    );
}
