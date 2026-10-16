import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { FORMATIONS, type FormationId, formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { computeLinks } from '../../engine/links';
import { editionOf } from '../../engine/specials';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { formationText } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { type SlotRef, slotRole, useGame } from '../../store/game-store';
import { CountUp } from '../components/CountUp';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { LinkChip, LinkChips, newLinks } from '../components/LinkChips';
import { TypeBadge } from '../components/PokeCard';
import { Tip } from '../help/Tip';
import { metalOf } from '../rarity';
import { ratingAt } from '../rating';
import { reduceMotionOn } from '../settings-sync';

/** Carta que segura a revelação um pouco mais: ouro (75+), Shiny ou edição especial. */
const isBigCard = (o: PokemonInstance) => metalOf(viewInstance(o).overall) === 'ouro' || !!editionOf(o);

/** Quando cada opção vira (ms): 120 entre elas, +250 depois de uma carta grande. */
function revealDelays(options: readonly PokemonInstance[]): number[] {
    let at = 0;
    return options.map((o) => {
        const d = at;
        at += 120 + (isBigCard(o) ? 250 : 0);
        return d;
    });
}

/** "Média dos titulares" que rola até o valor novo e mostra o quanto a escolha mudou (+4 / −2) por 1,5 s. */
function TeamAvg({ avg }: { avg: number }) {
    const { t } = useT();
    const prev = useRef(avg);
    const [delta, setDelta] = useState(0);
    useEffect(() => {
        const diff = avg - prev.current;
        prev.current = avg;
        if (!diff) return;
        setDelta(diff);
        const id = window.setTimeout(() => setDelta(0), 1500);
        return () => clearTimeout(id);
    }, [avg]);
    return (
        <span className="muted team-avg">
            {rich(t('team.draft.avg'), { n: <CountUp to={avg} className="team-avg-n" /> })}
            {delta !== 0 && (
                <b key={avg} className={`avg-delta ${delta > 0 ? 'up' : 'down'}`}>
                    {delta > 0 ? `+${delta}` : `−${-delta}`}
                </b>
            )}
        </span>
    );
}

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
    // celular em pé: a quadra ocupa a tela e as cartas ficam lá embaixo. Leva até as cartas quando elas saem e
    // volta pra quadra quando é hora de tocar numa vaga (só rola se o alvo não está à vista; no PC não mexe)
    const boardRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const focus = run?.status === 'captain' ? (selected ? 'board' : 'options') : run?.draftSlot ? 'options' : 'board';
    const firstFocus = useRef(true);
    // biome-ignore lint/correctness/useExhaustiveDependencies: rola a cada troca de foco ou rodada
    useEffect(() => {
        if (firstFocus.current) {
            firstFocus.current = false;
            return;
        }
        const el = (focus === 'options' ? optionsRef : boardRef).current;
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        if (top >= 0 && top < window.innerHeight * 0.5) return;
        el.scrollIntoView({ behavior: reduceMotionOn() ? 'auto' : 'smooth', block: 'start' });
    }, [focus, run?.draftRound]);
    // as 3 opções viram uma de cada vez (CSS, com o atraso de revealDelays) e cada uma faz um clique
    const optionsKey = run?.options.map((o) => o.uid).join() ?? '';
    // biome-ignore lint/correctness/useExhaustiveDependencies: toca de novo só quando saem opções novas
    useEffect(() => {
        if (!run?.options.length) return;
        // tom sobe carta a carta (dó, mi, sol), como a contagem do Balatro
        const ids = revealDelays(run.options).map((ms, i) =>
            window.setTimeout(() => playSfx('select', 2 ** ([0, 4, 7][i] / 12)), ms),
        );
        return () => {
            for (const id of ids) clearTimeout(id);
        };
    }, [optionsKey]);
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
    // média pela nota na vaga (quem está fora de posição puxa a média pra baixo, como em campo)
    const slots = formationOf(run.formation).slots;
    const slotRatings = run.lineup.flatMap((u, i) => (u ? [ratingAt(byUid.get(u)!, slots[i]).rating] : []));
    const avg = slotRatings.length ? Math.round(slotRatings.reduce((s, r) => s + r, 0) / slotRatings.length) : 0;
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
    const delays = revealDelays(run.options);

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
                <div className="panel board-panel" ref={boardRef}>
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
                                {filled.length > 0 && <TeamAvg avg={avg} />}
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
                    <div className="draft-options" ref={optionsRef}>
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
                            {run.options.map((o, i) => (
                                <div
                                    key={o.uid}
                                    className={`option reveal${isBigCard(o) ? ' reveal-big' : ''}`}
                                    style={{ '--rd': `${delays[i]}ms` } as CSSProperties}
                                >
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
