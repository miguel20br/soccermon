import { useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { TACTIC_LABEL, type Tactic, type TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { DUEL_ROUNDS, optionsFor, other, type Role, type Shared } from '../../net/duel-state';
import { duel } from '../../net/session';
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

/** Time pronto: a copa atual (com o draft completo) ou um campeão do Hall da Fama. */
export function TeamPick({ s, role }: { s: Shared; role: Role }) {
    const { t } = useT();
    const run = useGame((g) => g.run);
    const hall = useGame((g) => g.hall);
    const color = useGame((g) => clubColorHex(g.profile.clubColor));
    const chosen = !!s.teams[role];
    const rival = s.peers[other(role)]?.name ?? '';
    const options: { key: string; label: string; team: TeamSetup }[] = [];
    if (run && isDraftComplete(run) && run.lineup.length)
        options.push({ key: 'run', label: t('duel.team.current'), team: playerTeam(run, color) });
    for (const h of hall) options.push({ key: h.id, label: t('duel.team.hall', { n: h.titleNo }), team: hallTeam(h) });
    if (chosen) {
        return (
            <div className="panel duel-center">
                <h2>{t('duel.team.chosen')}</h2>
                <SquadStrip picks={[...s.teams[role]!.lineup, ...s.teams[role]!.bench]} />
                <p className="muted">
                    <span className="duel-spinner" aria-hidden /> {t('duel.team.waiting', { name: rival })}
                </p>
            </div>
        );
    }
    return (
        <div className="duel-teams">
            <h1>{t('duel.team.title')}</h1>
            {options.length === 0 && <p className="panel muted">{t('duel.team.none')}</p>}
            <div className="duel-team-list">
                {options.map((o) => (
                    <button
                        key={o.key}
                        type="button"
                        className="panel duel-team-opt"
                        onClick={() => {
                            playSfx('select');
                            duel.dispatch({ k: 'team', team: o.team });
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
                    </button>
                ))}
            </div>
            {hall.length > 0 && <p className="muted small">{t('duel.team.hallNote')}</p>}
        </div>
    );
}

/** Draft do duelo (Disputa ou cada um com seus pacotes). */
export function DuelDraft({ s, role }: { s: Shared; role: Role }) {
    const { t, d } = useT();
    const draft = s.draft!;
    const rivalRole = other(role);
    const rival = s.peers[rivalRole]?.name ?? '';
    const mine = draft.picks[role];
    const disputa = s.mode === 'disputa';
    const round = disputa ? draft.round : mine.length;
    const myTurn = disputa ? draft.turn === role : mine.length < DRAFT_PICKS;
    const options = disputa ? draft.options : optionsFor(s, role);
    const left = useCountdown(myTurn || disputa ? draft.deadline[disputa ? (draft.turn ?? role) : role] : undefined);
    const need = DUEL_ROUNDS[round];
    const slotLabel =
        round === 0 ? t('duel.draft.captain') : need === 'ANY' ? t('duel.draft.bench') : d.common.pos[need];

    if (!disputa && mine.length >= DRAFT_PICKS) {
        return (
            <div className="panel duel-center">
                <SquadStrip picks={mine} label={t('duel.draft.yourTeam')} />
                <p className="muted">
                    <span className="duel-spinner" aria-hidden /> {t('duel.draft.doneWait', { name: rival })}
                </p>
                <p>{t('duel.draft.progress', { name: rival, n: draft.picks[rivalRole].length })}</p>
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
                    <p className="muted duel-progress">
                        {t('duel.draft.progress', { name: rival, n: draft.picks[rivalRole].length })}
                    </p>
                )}
            </div>
            <CardPack
                compact
                look={packLookOf(options)}
                label={slotLabel}
                revealKey={`${s.game}-${round}-${options.length === 4 ? 'a' : 'b'}-${disputa ? '' : role}`}
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
                                                  duel.dispatch({ k: 'pick', uid: o.uid });
                                              },
                                          }
                                        : undefined
                                }
                            />
                        </div>
                    ))}
                </div>
            </CardPack>
        </div>
    );
}

/** Prévia de 30 s: os dois times à vista, e cada um ajusta formação, tática e escalação. */
export function DuelPreview({ s, role }: { s: Shared; role: Role }) {
    const { t, d, lang } = useT();
    const team = s.teams[role]!;
    const rivalRole = other(role);
    const rivalTeam = s.teams[rivalRole]!;
    const rival = s.peers[rivalRole]?.name ?? '';
    const left = useCountdown(s.previewUntil);
    const [sel, setSel] = useState<number | null>(null);
    const byUid = new Map([...team.lineup, ...team.bench].map((p) => [p.uid, p]));
    const rivalBy = new Map([...rivalTeam.lineup, ...rivalTeam.bench].map((p) => [p.uid, p]));
    const ready = s.previewReady[role];
    const idxOf = (zone: 'lineup' | 'bench', index: number) => (zone === 'lineup' ? index : 5 + index);
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
                                className={`btn small${team.formation === f ? ' active' : ''}`}
                                disabled={ready}
                                onClick={() => duel.dispatch({ k: 'formation', formation: f })}
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
                                className={`btn small${team.tactic === tc ? ' active' : ''}`}
                                disabled={ready}
                                onClick={() => duel.dispatch({ k: 'tactic', tactic: tc })}
                            >
                                {d.common.tactic[tc]}
                            </button>
                        ))}
                    </div>
                    <FormationBoard
                        formation={team.formation ?? '1-2-1'}
                        lineup={team.lineup.map((p) => p.uid)}
                        bench={team.bench.map((p) => p.uid)}
                        byUid={byUid}
                        captainUid={team.captainUid}
                        stateOf={(ref) => (sel === idxOf(ref.zone, ref.index) ? 'selected' : ready ? 'locked' : 'idle')}
                        onSlot={(ref) => {
                            if (ready) return;
                            const i = idxOf(ref.zone, ref.index);
                            if (sel === null) setSel(i);
                            else {
                                if (sel !== i) duel.dispatch({ k: 'swap', a: sel, b: i });
                                setSel(null);
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="btn primary big"
                        disabled={ready}
                        onClick={() => duel.dispatch({ k: 'previewReady' })}
                    >
                        {ready ? t('duel.preview.waiting', { name: rival }) : t('duel.preview.ready')}
                    </button>
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
