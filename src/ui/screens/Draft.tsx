import { useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { computeLinks } from '../../engine/links';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { type SlotRef, slotRole, useGame } from '../../store/game-store';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { LinkChip, LinkChips, newLinks } from '../components/LinkChips';
import { TypeBadge } from '../components/PokeCard';
import { Tip } from '../help/Tip';
import { ratingAt } from '../rating';

/** Desenho mini da formação (bolinhas nas posições da UI). */
function FormationDiagram({ id }: { id: FormationId }) {
    const f = FORMATIONS[id];
    return (
        <svg viewBox="0 0 60 80" className="formation-diagram" aria-hidden>
            <rect x="1" y="1" width="58" height="78" rx="3" />
            <line x1="1" y1="40" x2="59" y2="40" />
            {f.ui.map(([x, y], i) => (
                <circle key={`${x}-${y}`} cx={(x / 100) * 60} cy={(y / 100) * 80} r={i === 0 ? 4 : 5} />
            ))}
        </svg>
    );
}

/**
 * Draft estilo "7 a 0": formação → capitão (1 de 3 raros, qualquer vaga) → a cada rodada você escolhe a
 * vaga e saem 3 Pokémon que jogam naquela posição.
 */
export function Draft() {
    const { run, chooseFormation, chooseSlot, pick, reroll } = useGame();
    const [selected, setSelected] = useState<string | null>(null);
    const { t, d, lang } = useT();
    if (!run) return null;

    if (run.status === 'formation') {
        return (
            <>
                <div className="draft-head">
                    <div>
                        <div className="muted">{t('team.draft.beforeDraft')}</div>
                        <h1>{t('team.draft.chooseFormation')}</h1>
                    </div>
                </div>
                <div className="formation-picker">
                    {Object.values(FORMATIONS).map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className="panel formation-option"
                            onClick={() => {
                                playSfx('select');
                                chooseFormation(f.id);
                            }}
                        >
                            <FormationDiagram id={f.id} />
                            <b>{formationText(f.id, lang).name}</b>
                            <span className="muted">{f.slots.map((s) => d.common.pos[s]).join(' · ')}</span>
                            <span className="tactic-desc">{formationText(f.id, lang).description}</span>
                        </button>
                    ))}
                </div>
            </>
        );
    }

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const isCaptain = run.status === 'captain';
    const chosen = isCaptain ? (run.options.find((o) => o.uid === selected) ?? null) : null;
    const filled = run.lineup.filter(Boolean).map((u) => byUid.get(u)!);
    const synergies = computeSynergies(filled);
    const links = computeLinks(filled);
    const avg = filled.length ? Math.round(filled.reduce((s, p) => s + viewInstance(p).overall, 0) / filled.length) : 0;
    const role = run.draftSlot ? slotRole(run, run.draftSlot) : null;
    const roleLabel = role === 'ANY' ? t('team.draft.theBench') : role ? d.common.pos[role] : '';

    const title = isCaptain
        ? chosen
            ? t('team.draft.whereCaptain', { name: viewInstance(chosen).displayName })
            : t('team.draft.chooseCaptain')
        : run.draftSlot
          ? role === 'ANY'
              ? t('team.draft.chooseForBench')
              : t('team.draft.chooseForSlot', { pos: roleLabel })
          : t('team.draft.chooseSlot');

    const hint = isCaptain
        ? chosen
            ? t('team.draft.hintCaptainSlot')
            : t('team.draft.hintCaptain')
        : run.draftSlot
          ? t('team.draft.hintOptions')
          : t('team.draft.hintSlot');

    const onSlot = (slot: SlotRef, uid: string) => {
        if (uid) return;
        playSfx('select');
        if (isCaptain) {
            if (!chosen) return;
            pick(chosen.uid, slot);
            setSelected(null);
        } else {
            chooseSlot(slot);
        }
    };

    const slotState = (slot: SlotRef, uid: string) => {
        if (uid) return 'locked' as const;
        if (isCaptain) return chosen ? ('target' as const) : ('locked' as const);
        if (run.draftSlot) {
            return run.draftSlot.zone === slot.zone && run.draftSlot.index === slot.index ? 'selected' : 'locked';
        }
        return 'target' as const;
    };

    const showOptions = isCaptain || !!run.draftSlot;

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">
                        {isCaptain
                            ? t('common.ui.captain')
                            : t('team.draft.pickOf', { n: run.draftRound + 1, total: DRAFT_PICKS })}{' '}
                        · {formationText(run.formation, lang).name}
                    </div>
                    <h1>{title}</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        {hint}
                    </p>
                </div>
                <div className="steps" role="img" aria-label={t('team.draft.progress')}>
                    {Array.from({ length: DRAFT_PICKS }, (_, i) => (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                            key={i}
                            className={i < run.draftRound ? 'done' : i === run.draftRound ? 'now' : ''}
                        />
                    ))}
                </div>
            </div>

            {run.status === 'drafting' && <Tip id="draft-slot">{t('team.draft.tip')}</Tip>}

            <div className="draft-grid">
                <div className="panel board-panel">
                    <h2>{run.teamName}</h2>
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        preview={chosen}
                        projection={chosen}
                        stateOf={slotState}
                        onSlot={onSlot}
                        footer={
                            <div className="row" style={{ marginTop: 12, gap: 8 }}>
                                {filled.length > 0 && <span className="muted">{t('team.draft.avg', { n: avg })}</span>}
                                {synergies.map((s) => (
                                    <span key={s.type} className="row" style={{ gap: 4 }}>
                                        <TypeBadge type={s.type} />
                                        <span className="tactic-desc">
                                            ×{s.count} +{Math.round((s.bonus - 1) * 100)}%
                                        </span>
                                    </span>
                                ))}
                                <LinkChips links={links} />
                            </div>
                        }
                    />
                </div>

                {showOptions && (
                    <div className="draft-options">
                        <div className="row options-bar">
                            <span className="muted">
                                {isCaptain
                                    ? t('team.draft.captainCandidates')
                                    : t('team.draft.optionsFor', { pos: roleLabel })}
                            </span>
                            <button
                                type="button"
                                className="btn small"
                                disabled={run.rerolls <= 0}
                                onClick={() => {
                                    playSfx('select');
                                    reroll();
                                    setSelected(null);
                                }}
                            >
                                {t('team.draft.reroll', { n: run.rerolls })}
                            </button>
                        </div>
                        <div className="options">
                            {run.options.map((o) => (
                                <div key={o.uid} className="option">
                                    {!isCaptain && role !== 'ANY' && newLinks(filled, o).length > 0 && (
                                        <div className="option-links">
                                            {t('team.draft.activates')}{' '}
                                            {newLinks(filled, o).map((l) => (
                                                <LinkChip key={l.id} def={l} fresh />
                                            ))}
                                        </div>
                                    )}
                                    {!isCaptain &&
                                        role &&
                                        role !== 'ANY' &&
                                        (() => {
                                            // a carta mostra a posição principal; aqui o aviso de que ele também joga na vaga
                                            const r = ratingAt(o, role);
                                            return (
                                                <div className={`option-fit ${r.fit}`}>
                                                    {r.fit === 'main'
                                                        ? t('team.draft.fitMain', { pos: d.common.pos[role] })
                                                        : t(
                                                              r.fit === 'alt'
                                                                  ? 'team.draft.fitAlt'
                                                                  : 'team.draft.fitOff',
                                                              {
                                                                  pos: d.common.pos[role],
                                                                  r: r.display,
                                                              },
                                                          )}
                                                </div>
                                            );
                                        })()}
                                    <FutCard
                                        inst={o}
                                        captain={isCaptain}
                                        selected={selected === o.uid}
                                        action={{
                                            label: isCaptain
                                                ? selected === o.uid
                                                    ? t('team.draft.chosen')
                                                    : t('team.draft.pickCaptain')
                                                : roleLabel
                                                  ? t('team.draft.signAs', { pos: roleLabel })
                                                  : t('team.draft.sign'),
                                            primary: true,
                                            onClick: () => {
                                                playSfx('select');
                                                if (isCaptain) setSelected(selected === o.uid ? null : o.uid);
                                                else pick(o.uid);
                                            },
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
