import { useEffect, useRef, useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { countSpecials, type SpecialLimit, teamRecipe, validarTimeDuelo } from '../../engine/duel-validate';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    bothSealed,
    DUEL_ROUNDS,
    other,
    type PreviewCfg,
    packOptions,
    type Role,
    type Shared,
    specialLimitOf,
} from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { isDraftComplete, playerTeam, type SlotRef, useGame } from '../../store/game-store';
import { clubColorHex, type HallEntry } from '../../store/profile';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { lineupAverage } from '../rating';
import { LineupEditor } from '../screens/Lineup';
import { reduceMotionOn } from '../settings-sync';
import { useCountdown } from './DuelMatch';
import { ReadyBar } from './ReadyBar';

const avgOf = (t: TeamSetup) => lineupAverage(t.lineup, t.formation);

/** Time do Hall da Fama de volta pro campo: as espécies e a escalação do título (o Hall guarda só isso). */
export function hallTeam(h: HallEntry): TeamSetup {
    const rng = new Rng(h.id, 'duelo-hall');
    const insts = h.squad.map((p) => ({ ...createInstance(p.speciesId, rng), shiny: p.shiny }));
    const cap = h.squad.findIndex((p) => p.captain);
    return {
        name: h.club,
        lineup: insts.slice(0, 5),
        bench: insts.slice(5),
        tactic: 'balanced',
        color: clubColorHex(h.clubColor),
        formation: (FORMATIONS[h.formation as FormationId] ? h.formation : '1-2-1') as FormationId,
        captainUid: insts[cap]?.uid ?? null,
        manualSubs: true,
    };
}

/** A regra de cartas especiais da sala, numa linha. */
export function specialRuleText(limit: SpecialLimit, t: ReturnType<typeof useT>['t']): string {
    return t('duel.specials.rule', {
        rule:
            limit === 0 ? t('duel.specials.none') : limit === null ? t('duel.specials.free') : t('duel.specials.upTo3'),
    });
}

/** Fileira de sprites do time (draft e lobby). */
export function SquadStrip({ picks, label }: { picks: PokemonInstance[]; label?: string }) {
    return (
        <div className="duel-strip">
            {label && <span className="muted">{label}</span>}
            <div className="duel-strip-row">
                {Array.from({ length: DRAFT_PICKS }, (_, i) => {
                    const p = picks[i];
                    return p ? (
                        <span key={p.uid} className="duel-strip-mon" title={viewInstance(p).displayName}>
                            <img className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                            <b>{viewInstance(p).overall}</b>
                        </span>
                    ) : (
                        // biome-ignore lint/suspicious/noArrayIndexKey: vagas fixas
                        <span key={i} className="duel-strip-mon empty" />
                    );
                })}
            </div>
        </div>
    );
}

/** Time pronto: a copa atual (com o draft completo) ou um campeão do Hall da Fama. Vai lacrado: os dois abrem juntos. */
export function TeamPick({ s, role }: { s: Shared; role: Role }) {
    const { t, tn } = useT();
    const run = useGame((g) => g.run);
    const hall = useGame((g) => g.hall);
    const color = useGame((g) => clubColorHex(g.profile.clubColor));
    const sealed = useDuel((v) => v.choiceSealed);
    const rival = s.peers[other(role)]?.name ?? '';
    const [chosen, setChosen] = useState<TeamSetup | null>(null);
    const options: { key: string; label: string; team: TeamSetup }[] = [];
    if (run && isDraftComplete(run) && run.lineup.length)
        options.push({ key: 'run', label: t('duel.team.current'), team: playerTeam(run, color) });
    for (const h of hall) options.push({ key: h.id, label: t('duel.team.hall', { n: h.titleNo }), team: hallTeam(h) });
    // escolhido: o time fica à vista com o pronto (e o "Mudar algo" volta pra lista enquanto o rival não escolheu)
    if (sealed || bothSealed(s)) {
        return (
            <div className="panel duel-center">
                <h2>{t('duel.team.chosen')}</h2>
                {chosen && <SquadStrip picks={[...chosen.lineup, ...chosen.bench]} />}
                <ReadyBar
                    mine={sealed}
                    rival={!!s.choice?.seal[other(role)]}
                    rivalName={rival}
                    starting={bothSealed(s)}
                    label=""
                    onReady={() => {}}
                    onUndo={() => duel.unsealChoice()}
                />
            </div>
        );
    }
    return (
        <div className="duel-teams">
            <header className="bc-screenhead">
                <span className="bc-tag">{t('duel.title')}</span>
                <h1>{t('duel.team.title')}</h1>
            </header>
            <p className="muted">{specialRuleText(specialLimitOf(s), t)}</p>
            {s.choice?.seal[other(role)] && (
                <p className="ready-chip on" data-testid="ready-rival">
                    <b>{rival}</b>
                    <span>
                        <i aria-hidden />
                        {t('duel.ready.on')}
                    </span>
                </p>
            )}
            {options.length === 0 && <p className="panel muted">{t('duel.team.none')}</p>}
            <div className="duel-team-list">
                {options.map((o) => {
                    // só a receita vai pela rede, e só se for um time que uma copa poderia dar
                    const recipe = teamRecipe(o.team);
                    const limit = specialLimitOf(s);
                    const problems = validarTimeDuelo(recipe);
                    const specials = countSpecials(recipe);
                    const tooMany = limit !== null && specials > limit;
                    return (
                        <button
                            key={o.key}
                            type="button"
                            className="panel duel-team-opt"
                            disabled={problems.length > 0 || tooMany}
                            onClick={() => {
                                playSfx('select');
                                setChosen(o.team);
                                void duel.chooseTeam(recipe);
                            }}
                        >
                            <span className="dto-head">
                                <b>{o.team.name}</b>
                                <span className="muted">
                                    {o.label} · {t('duel.team.avg', { n: avgOf(o.team) })}
                                </span>
                            </span>
                            <span className="dto-squad">
                                {[...o.team.lineup, ...o.team.bench].map((p) => (
                                    <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                                ))}
                            </span>
                            {tooMany && (
                                <span className="error-text small">
                                    {limit === 0
                                        ? tn('duel.team.noSpecials', specials)
                                        : tn('duel.team.tooManySpecials', specials, { max: limit })}
                                </span>
                            )}
                            {problems.length > 0 && (
                                <span className="error-text small">
                                    {t('duel.team.invalid', { why: problems.slice(0, 3).join(', ') })}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {hall.length > 0 && <p className="muted small">{t('duel.team.hallNote')}</p>}
        </div>
    );
}

/** Vaga da quadra (losango 1-2-1) de cada rodada: Goleiro, Fixo, Ala, Ala e Pivô; capitão e reserva no banco. */
function boardOf(picks: PokemonInstance[]) {
    const lineup = [1, 2, 3, 4, 5].map((r) => picks[r]?.uid ?? '');
    const bench = [0, 6].map((r) => picks[r]?.uid ?? '');
    return { lineup, bench };
}
const slotOfRound = (round: number): SlotRef =>
    round >= 1 && round <= 5 ? { zone: 'lineup', index: round - 1 } : { zone: 'bench', index: round === 0 ? 0 : 1 };

/**
 * Draft do duelo, no visual do draft da copa (quadra com as vagas + pacote com as cartas): os dois andam rodada a
 * rodada. A rodada abre quando os dois abrem o segredo dela (a seed dos pacotes sai daí). Disputa: 4 cartas abertas,
 * um tira e o outro tira (as 2 que sobram queimam). Cada um com seus pacotes: 3 cartas pra cada, a escolha vai
 * lacrada e só abre no fim.
 */
export function DuelDraft({ s, role }: { s: Shared; role: Role }) {
    const { t, d } = useT();
    const draft = s.draft!;
    const rivalRole = other(role);
    const rival = s.peers[rivalRole]?.name ?? '';
    const packPicks = useDuel((v) => v.packPicks);
    const [view, setView] = useState<Role>(role);
    const disputa = s.mode === 'disputa';
    const round = Math.min(draft.round, DRAFT_PICKS - 1);
    const seed = draft.seeds[draft.round];
    const open = draft.round < DRAFT_PICKS && !!seed;
    const mine = disputa ? draft.picks[role] : packPicks;
    const sealedNow = !disputa && !!draft.seals[role][draft.round];
    const myTurn = open && (disputa ? draft.turn === role : !sealedNow && packPicks.length === draft.round);
    const options = !open
        ? []
        : disputa
          ? draft.options
          : myTurn
            ? packOptions(seed, draft.round, packPicks, role)
            : [];
    const left = useCountdown(open ? draft.deadline[disputa ? (draft.turn ?? role) : role] : undefined);
    const need = DUEL_ROUNDS[round];
    const slotLabel =
        round === 0 ? t('duel.draft.captain') : need === 'ANY' ? t('duel.draft.bench') : d.common.pos[need];
    const rivalPicks = draft.picks[rivalRole];
    const rivalCount = disputa ? rivalPicks.length : draft.seals[rivalRole].filter(Boolean).length;
    // Disputa: o que o rival tirou nesta rodada e o que queimou na anterior
    const rivalTook = disputa && rivalPicks.length > round ? rivalPicks[round] : null;
    const burned = disputa && round > 0 ? draft.burned.slice(-2) : [];
    const shown = view === role || !disputa ? mine : rivalPicks;
    const board = boardOf(shown);
    const byUid = new Map(shown.map((p) => [p.uid, p]));
    const target = slotOfRound(round);
    // celular em pé: as cartas ficam embaixo da quadra; na sua vez a tela desce até elas (como no draft da copa)
    const optionsRef = useRef<HTMLDivElement>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: desce a cada rodada nova em que é a sua vez
    useEffect(() => {
        const el = optionsRef.current;
        if (!myTurn || !el) return;
        const top = el.getBoundingClientRect().top;
        if (top >= 0 && top < window.innerHeight * 0.5) return;
        el.scrollIntoView({ behavior: reduceMotionOn() ? 'auto' : 'smooth', block: 'start' });
    }, [myTurn, draft.round]);

    const title = !open
        ? draft.round >= DRAFT_PICKS
            ? t('duel.draft.opening')
            : t('duel.draft.openingRound')
        : disputa
          ? myTurn
              ? t('duel.draft.yourTurn', { pos: slotLabel })
              : t('duel.draft.rivalTurn', { name: rival })
          : sealedNow
            ? t('duel.draft.sealedWait', { name: rival })
            : t('duel.draft.choose', { pos: slotLabel });

    return (
        <div className="duel-draft">
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">
                    {t('duel.draft.round', { n: round + 1 })} · {slotLabel}
                </span>
                <div className="draft-title">
                    <h1>{title}</h1>
                    <p className="muted">{disputa ? t('duel.draft.burn') : t('duel.draft.hidden')}</p>
                </div>
                <div className="duel-draft-clock">
                    <div className="steps" role="img" aria-label={t('team.draft.progress')}>
                        {Array.from({ length: DRAFT_PICKS }, (_, i) => (
                            <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                                key={i}
                                className={i < draft.round ? 'done' : i === draft.round ? 'now' : ''}
                            />
                        ))}
                    </div>
                    <div
                        className={`duel-timer${open && left <= 5 ? ' low' : ''}`}
                        data-testid="duel-timer"
                        title={t('duel.draft.timeout')}
                    >
                        {open ? left : '…'}
                    </div>
                </div>
            </div>

            <div className="draft-grid">
                <div className="panel board-panel">
                    {disputa ? (
                        <div className="tp-tabs duel-board-tabs" role="tablist">
                            {([role, rivalRole] as Role[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    role="tab"
                                    aria-selected={view === r}
                                    className={`tp-tab${view === r ? ' active' : ''}`}
                                    onClick={() => setView(r)}
                                >
                                    {r === role ? t('duel.draft.yourTeam') : t('duel.draft.rivalTeam', { name: rival })}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <h2>{s.peers[role]?.clubName ?? t('duel.draft.yourTeam')}</h2>
                    )}
                    <FormationBoard
                        formation="1-2-1"
                        lineup={board.lineup}
                        bench={board.bench}
                        byUid={byUid}
                        captainUid={shown[0]?.uid ?? null}
                        emptyLabel={t('duel.draft.empty')}
                        stateOf={(ref, uid) =>
                            !uid && open && ref.zone === target.zone && ref.index === target.index
                                ? 'selected'
                                : 'locked'
                        }
                        footer={
                            <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                                {disputa && view !== role
                                    ? t('duel.draft.rivalCount', { name: rival, n: rivalCount })
                                    : t('duel.draft.boardHint')}
                            </p>
                        }
                    />
                    {!disputa && (
                        <p className="muted duel-progress" data-testid="duel-rival-progress">
                            {t('duel.draft.progress', { name: rival, n: rivalCount })}
                        </p>
                    )}
                </div>

                <div className="draft-options" ref={optionsRef}>
                    <div className="row options-bar">
                        <span className="muted">
                            {round === 0
                                ? t('team.draft.captainCandidates')
                                : t('team.draft.optionsFor', { pos: slotLabel })}
                        </span>
                        {open && disputa && !myTurn && (
                            <span className="duel-turn" role="status">
                                <span className="duel-spinner" aria-hidden />{' '}
                                {t('duel.draft.rivalPicking', { name: rival, s: left })}
                            </span>
                        )}
                        {open && myTurn && (
                            <span className="duel-turn mine" role="status">
                                {t('duel.draft.yourClock', { s: left })}
                            </span>
                        )}
                    </div>
                    {(rivalTook || burned.length > 0) && (
                        <div className="duel-draft-news">
                            {rivalTook && (
                                <span>
                                    <img className="pixel" src={cardSprite(rivalTook)} alt="" />
                                    {t('duel.draft.rivalTook', {
                                        name: rival,
                                        mon: viewInstance(rivalTook).displayName,
                                    })}
                                </span>
                            )}
                            {!rivalTook && burned.length > 0 && (
                                <span>
                                    {burned.map((id) => (
                                        <img
                                            key={id}
                                            className="pixel burned"
                                            src={cardSprite({ speciesId: id, shiny: false })}
                                            alt=""
                                        />
                                    ))}
                                    {t('duel.draft.burnedLast')}
                                </span>
                            )}
                        </div>
                    )}
                    {options.length > 0 ? (
                        <CardPack
                            compact
                            look={packLookOf(options)}
                            label={slotLabel}
                            revealKey={`${s.game}-${draft.round}-${disputa ? 'd' : role}`}
                        >
                            <div className={`options duel-options${disputa ? ' four' : ''}`}>
                                {options.map((o) => (
                                    <div
                                        key={o.uid}
                                        className={`option cpack-card${isBigCard(o) ? ' big' : ''}${myTurn ? '' : ' duel-locked'}`}
                                    >
                                        <FutCard
                                            inst={o}
                                            captain={round === 0}
                                            position={need === 'ANY' ? undefined : need}
                                            action={
                                                myTurn
                                                    ? {
                                                          label: disputa
                                                              ? t('duel.draft.take')
                                                              : round === 0
                                                                ? t('team.draft.pickCaptain')
                                                                : t('team.draft.signAs', { pos: slotLabel }),
                                                          primary: true,
                                                          onClick: () => {
                                                              playSfx('select');
                                                              if (disputa) duel.dispatch({ k: 'pick', uid: o.uid });
                                                              else void duel.packPick(o.uid);
                                                          },
                                                      }
                                                    : undefined
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardPack>
                    ) : (
                        <div className="panel duel-center">
                            <span className="duel-spinner" aria-hidden />
                            <p className="muted">
                                {sealedNow ? t('duel.draft.sealedWait', { name: rival }) : t('duel.draft.openingRound')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Escalação do duelo (30 s, depois do draft ou do time pronto): a mesma tela de escalação da copa, com o time do
 * rival à vista. O que vale vai lacrado: os dois abrem juntos (quem confirma por último não ajusta contra o outro).
 */
export function DuelPreview({ s, role }: { s: Shared; role: Role }) {
    const { t, d, lang } = useT();
    const openCard = useCardModal((v) => v.open);
    const team = s.teams[role]!;
    const rivalRole = other(role);
    const rivalTeam = s.teams[rivalRole]!;
    const rival = s.peers[rivalRole]?.name ?? '';
    const left = useCountdown(s.choice?.until);
    const sealed = useDuel((v) => v.choiceSealed);
    const all = [...team.lineup, ...team.bench];
    const [cfg, setCfg] = useState<PreviewCfg>(() => ({
        formation: team.formation ?? '1-2-1',
        tactic: team.tactic,
        order: all.map((p) => p.uid),
        corner: team.corner ?? 'mixed',
        cornerTaker: team.cornerTakerUid ?? null,
    }));
    const [captainNote, setCaptainNote] = useState(false);
    useEffect(() => {
        duel.previewDraft = cfg;
    }, [cfg]);
    const byUid = new Map(all.map((p) => [p.uid, p]));
    const idxOf = (r: SlotRef) => (r.zone === 'lineup' ? r.index : 5 + r.index);
    const swap = (a: SlotRef, b: SlotRef) => {
        const order = [...cfg.order];
        const [i, j] = [idxOf(a), idxOf(b)];
        [order[i], order[j]] = [order[j], order[i]];
        // o capitão começa jogando (a regra do lacre: sem isso a escalação não abre)
        const benched = !!team.captainUid && !order.slice(0, 5).includes(team.captainUid);
        setCaptainNote(benched);
        if (!benched) setCfg({ ...cfg, order });
    };
    const rivalAvg = avgOf(rivalTeam);
    return (
        <div className="duel-preview">
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">{t('duel.preview.kicker')}</span>
                <div className="draft-title">
                    <h1>{t('duel.preview.title')}</h1>
                    <p className="muted">{t('duel.preview.hint')}</p>
                </div>
                <div className={`duel-timer${left <= 5 ? ' low' : ''}`} data-testid="duel-timer">
                    {left}
                </div>
            </div>
            <LineupEditor
                title={t('team.lineup.title', { team: team.name })}
                formation={cfg.formation}
                lineup={cfg.order.slice(0, 5)}
                bench={cfg.order.slice(5)}
                byUid={byUid}
                captainUid={team.captainUid ?? null}
                tactic={cfg.tactic}
                cornerPlan={cfg.corner ?? 'mixed'}
                cornerTakerUid={cfg.cornerTaker ?? null}
                locked={sealed || bothSealed(s)}
                onFormation={(formation) => setCfg({ ...cfg, formation })}
                onSwap={swap}
                onTactic={(tactic) => setCfg({ ...cfg, tactic })}
                onCorner={(p) =>
                    setCfg({
                        ...cfg,
                        corner: p.cornerPlan ?? cfg.corner,
                        cornerTaker: p.cornerTakerUid !== undefined ? p.cornerTakerUid : cfg.cornerTaker,
                    })
                }
                side={
                    <div className="panel">
                        <h2>{t('duel.preview.rival', { name: rival })}</h2>
                        <div className="opponent-strip">
                            {[...rivalTeam.lineup, ...rivalTeam.bench].map((p) => (
                                <button
                                    key={p.uid}
                                    type="button"
                                    className="scout-btn"
                                    onClick={() => openCard(p, { note: t('duel.draft.rivalTeam', { name: rival }) })}
                                    aria-label={t('team.lineup.seeCard', { name: viewInstance(p).displayName })}
                                >
                                    <img className="pixel" src={cardSprite(p)} alt="" />
                                </button>
                            ))}
                        </div>
                        <p className="muted" style={{ fontSize: 11 }}>
                            {t('team.lineup.oppLine', {
                                formation: formationText(rivalTeam.formation ?? '1-2-1', lang).name,
                                tactic: d.common.tactic[rivalTeam.tactic],
                                n: rivalAvg,
                            })}
                        </p>
                        <ReadyBar
                            mine={sealed}
                            rival={!!s.choice?.seal[rivalRole]}
                            rivalName={rival}
                            starting={bothSealed(s)}
                            label={t('duel.preview.ready')}
                            note={t('duel.ready.timeNote')}
                            onReady={() => {
                                playSfx('select');
                                void duel.sealChoice(cfg);
                            }}
                            onUndo={() => duel.unsealChoice()}
                        />
                        {captainNote && <p className="error-text">{t('duel.preview.captainStays')}</p>}
                    </div>
                }
            />
        </div>
    );
}
