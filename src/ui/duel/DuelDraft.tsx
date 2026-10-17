import { useEffect, useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { countSpecials, type SpecialLimit, teamRecipe, validarTimeDuelo } from '../../engine/duel-validate';
import { FORMATIONS, type FormationId, formationOf } from '../../engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { CORNER_PLANS } from '../../engine/runners/live-runner';
import { TACTIC_LABEL, type Tactic, type TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    autoLineup,
    DUEL_ROUNDS,
    other,
    type PreviewCfg,
    packOptions,
    type Role,
    type Shared,
    specialLimitOf,
} from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { isDraftComplete, playerTeam, useGame } from '../../store/game-store';
import { clubColorHex, type HallEntry } from '../../store/profile';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { useCountdown } from './DuelMatch';

const avgOf = (t: TeamSetup) => Math.round(t.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / t.lineup.length);

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
    if (sealed) {
        return (
            <div className="panel duel-center">
                <h2>{t('duel.team.chosen')}</h2>
                {chosen && <SquadStrip picks={[...chosen.lineup, ...chosen.bench]} />}
                <p className="muted">{t('duel.team.sealed')}</p>
                <p className="muted">
                    <span className="duel-spinner" aria-hidden /> {t('duel.team.waiting', { name: rival })}
                </p>
            </div>
        );
    }
    return (
        <div className="duel-teams">
            <h1>{t('duel.team.title')}</h1>
            <p className="muted">{specialRuleText(specialLimitOf(s), t)}</p>
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

/**
 * Draft do duelo: os dois andam rodada a rodada. A rodada abre quando os dois abrem o segredo dela (a seed dos
 * pacotes sai daí). Disputa: 4 cartas abertas, um tira e o outro tira. Cada um com seus pacotes: 3 cartas pra cada,
 * a escolha vai lacrada e só abre no fim.
 */
export function DuelDraft({ s, role }: { s: Shared; role: Role }) {
    const { t, d } = useT();
    const draft = s.draft!;
    const rivalRole = other(role);
    const rival = s.peers[rivalRole]?.name ?? '';
    const packPicks = useDuel((v) => v.packPicks);
    const disputa = s.mode === 'disputa';
    const round = Math.min(draft.round, DRAFT_PICKS - 1);
    const seed = draft.seeds[draft.round];
    const mine = disputa ? draft.picks[role] : packPicks;
    const sealedNow = !disputa && !!draft.seals[role][draft.round];
    const myTurn = disputa ? draft.turn === role : !!seed && !sealedNow && packPicks.length === draft.round;
    const options = disputa ? draft.options : myTurn && seed ? packOptions(seed, draft.round, packPicks) : [];
    const left = useCountdown(seed ? draft.deadline[disputa ? (draft.turn ?? role) : role] : undefined);
    const need = DUEL_ROUNDS[round];
    const slotLabel =
        round === 0 ? t('duel.draft.captain') : need === 'ANY' ? t('duel.draft.bench') : d.common.pos[need];
    const rivalCount = disputa ? draft.picks[rivalRole].length : draft.seals[rivalRole].filter(Boolean).length;

    if (draft.round >= DRAFT_PICKS || !seed) {
        return (
            <div className="panel duel-center">
                <SquadStrip picks={mine} label={t('duel.draft.yourTeam')} />
                <p className="muted">
                    <span className="duel-spinner" aria-hidden />{' '}
                    {draft.round >= DRAFT_PICKS ? t('duel.draft.opening') : t('duel.draft.openingRound')}
                </p>
            </div>
        );
    }

    return (
        <div className="duel-draft">
            <div className="draft-head">
                <div>
                    <div className="muted">
                        {t('duel.draft.round', { n: round + 1 })} · {slotLabel}
                    </div>
                    <h1>
                        {disputa
                            ? myTurn
                                ? t('duel.draft.yourTurn')
                                : t('duel.draft.rivalTurn', { name: rival })
                            : sealedNow
                              ? t('duel.draft.sealedWait', { name: rival })
                              : slotLabel}
                    </h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        {disputa ? t('duel.draft.burn') : t('duel.draft.hidden')}
                    </p>
                </div>
                <div
                    className={`duel-timer${left <= 5 ? ' low' : ''}`}
                    data-testid="duel-timer"
                    title={t('duel.draft.timeout')}
                >
                    {left}
                </div>
            </div>
            <div className="duel-draft-teams">
                <SquadStrip picks={mine} label={t('duel.draft.yourTeam')} />
                {disputa ? (
                    <SquadStrip picks={draft.picks[rivalRole]} label={t('duel.draft.rivalTeam', { name: rival })} />
                ) : (
                    <p className="muted duel-progress">{t('duel.draft.progress', { name: rival, n: rivalCount })}</p>
                )}
            </div>
            {options.length > 0 && (
                <CardPack
                    compact
                    look={packLookOf(options)}
                    label={slotLabel}
                    revealKey={`${s.game}-${draft.round}-${disputa ? options.length : role}`}
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
                                                  label: disputa ? t('duel.draft.take') : t('duel.draft.pick'),
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
            )}
        </div>
    );
}

/**
 * Prévia de 30 s: os dois times à vista. Cada um ajusta formação, tática e escalação aqui na tela, e o que vale vai
 * lacrado: os dois abrem juntos (quem confirma por último não ajusta contra o outro).
 */
export function DuelPreview({ s, role }: { s: Shared; role: Role }) {
    const { t, d, lang } = useT();
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
    useEffect(() => {
        duel.previewDraft = cfg;
    }, [cfg]);
    const [sel, setSel] = useState<number | null>(null);
    const byUid = new Map(all.map((p) => [p.uid, p]));
    const rivalBy = new Map([...rivalTeam.lineup, ...rivalTeam.bench].map((p) => [p.uid, p]));
    const idxOf = (zone: 'lineup' | 'bench', index: number) => (zone === 'lineup' ? index : 5 + index);
    const setFormation = (formation: FormationId) => {
        const picks = cfg.order.map((u) => byUid.get(u)!);
        const { lineup, bench } = autoLineup(picks, formation, team.captainUid ?? null);
        setCfg({ ...cfg, formation, order: [...lineup, ...bench].map((p) => p.uid) });
    };
    const swap = (a: number, b: number) => {
        const order = [...cfg.order];
        [order[a], order[b]] = [order[b], order[a]];
        // o capitão não vai pro banco
        if (team.captainUid && !order.slice(0, 5).includes(team.captainUid)) return;
        setCfg({ ...cfg, order });
    };
    return (
        <div className="duel-preview">
            <div className="draft-head">
                <div>
                    <div className="muted">{t('duel.preview.title')}</div>
                    <h1>{team.name}</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        {t('duel.preview.hint')}
                    </p>
                </div>
                <div className={`duel-timer${left <= 5 ? ' low' : ''}`} data-testid="duel-timer">
                    {left}
                </div>
            </div>
            <div className="duel-preview-grid">
                <div className="panel board-panel">
                    <div className="row duel-chips">
                        <span className="muted">{t('duel.preview.formation')}</span>
                        {(Object.keys(FORMATIONS) as FormationId[]).map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`btn small${cfg.formation === f ? ' active' : ''}`}
                                disabled={sealed}
                                onClick={() => setFormation(f)}
                            >
                                {formationText(f, lang).name}
                            </button>
                        ))}
                    </div>
                    <div className="row duel-chips">
                        <span className="muted">{t('duel.preview.tactic')}</span>
                        {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => (
                            <button
                                key={tc}
                                type="button"
                                className={`btn small${cfg.tactic === tc ? ' active' : ''}`}
                                disabled={sealed}
                                onClick={() => setCfg({ ...cfg, tactic: tc })}
                            >
                                {d.common.tactic[tc]}
                            </button>
                        ))}
                    </div>
                    <div className="row duel-chips">
                        <span className="muted">{t('team.lineup.corner')}</span>
                        {CORNER_PLANS.map((pl) => (
                            <button
                                key={pl}
                                type="button"
                                className={`btn small${cfg.corner === pl ? ' active' : ''}`}
                                disabled={sealed}
                                onClick={() => setCfg({ ...cfg, corner: pl })}
                            >
                                {d.common.cornerPlan[pl]}
                            </button>
                        ))}
                        <label className="duel-taker">
                            <span className="muted">{t('team.lineup.cornerTaker')}</span>
                            <select
                                value={cfg.cornerTaker ?? ''}
                                disabled={sealed}
                                onChange={(e) => setCfg({ ...cfg, cornerTaker: e.target.value || null })}
                            >
                                <option value="">{t('duel.preview.autoTaker')}</option>
                                {cfg.order.slice(0, 5).map((u, i) =>
                                    formationOf(cfg.formation).slots[i] === 'GK' ? null : (
                                        <option key={u} value={u}>
                                            {viewInstance(byUid.get(u)!).displayName}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    </div>
                    <FormationBoard
                        formation={cfg.formation}
                        lineup={cfg.order.slice(0, 5)}
                        bench={cfg.order.slice(5)}
                        byUid={byUid}
                        captainUid={team.captainUid}
                        stateOf={(ref) =>
                            sel === idxOf(ref.zone, ref.index) ? 'selected' : sealed ? 'locked' : 'idle'
                        }
                        onSlot={(ref) => {
                            if (sealed) return;
                            const i = idxOf(ref.zone, ref.index);
                            if (sel === null) setSel(i);
                            else {
                                if (sel !== i) swap(sel, i);
                                setSel(null);
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="btn primary big"
                        disabled={sealed}
                        onClick={() => void duel.sealChoice(cfg)}
                    >
                        {sealed ? t('duel.preview.waiting', { name: rival }) : t('duel.preview.ready')}
                    </button>
                    {sealed && <p className="muted small">{t('duel.preview.sealed')}</p>}
                </div>
                <div className="panel board-panel">
                    <h2>{t('duel.draft.rivalTeam', { name: rival })}</h2>
                    <FormationBoard
                        formation={rivalTeam.formation ?? '1-2-1'}
                        lineup={rivalTeam.lineup.map((p) => p.uid)}
                        bench={rivalTeam.bench.map((p) => p.uid)}
                        byUid={rivalBy}
                        captainUid={rivalTeam.captainUid}
                        stateOf={() => 'locked'}
                    />
                </div>
            </div>
        </div>
    );
}
