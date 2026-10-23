import { useEffect, useRef } from 'react';
import { abilityEffect } from '../../engine/abilities';
import {
    type AttrKey,
    aerialLevel,
    aerialScore,
    computeAttributes,
    POSITIONS,
    physiqueOf,
    positionRating,
    sizePercentile,
} from '../../engine/attributes';
import { MOVES, species } from '../../engine/data';
import { evolutionTarget, evoThreshold } from '../../engine/evolution';
import { viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { linksOf } from '../../engine/links';
import { applyModifiers, attributeModifiers, moveModifiers, moveUses } from '../../engine/modifiers';
import { DRAIN, moveProfile } from '../../engine/moves';
import {
    abilityDesc,
    abilityName,
    type Dict,
    fmt,
    itemDesc,
    itemName,
    linkText,
    modLabel,
    moveExplain,
    moveModLabel,
    moveName,
} from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { FutCard } from './FutCard';
import { LinkChip } from './LinkChips';
import { HudIcon } from './MatchHud';
import { TypeBadge } from './PokeCard';
import { TaughtMark } from './TaughtMark';

const ALL_ATTRS: AttrKey[] = [
    'pace',
    'dribble',
    'shooting',
    'passing',
    'tackling',
    'strength',
    'positioning',
    'stamina',
    'goalkeeping',
];

function secondaryText(moveId: string, d: Dict): string | null {
    const sec = MOVES[moveId]?.secondary;
    if (!sec) return null;
    const tx = d.team.modal;
    const what = (sec.status && tx.secondary[sec.status]) || (sec.volatile && tx.secondary[sec.volatile]);
    if (!what) return sec.boosts ? tx.mayWeaken : null;
    const chance = Math.round(Math.min(65, sec.chance * 3 + 5));
    return fmt(tx.secondaryChance, { chance, what });
}

/** Carta completa: tudo sobre o Pokémon, com ações (escolher, pegar…). */
export function CardModal() {
    const { inst, position, captain, note, section, actions, extra, close } = useCardModal();
    const run = useGame((s) => s.run);
    const { t, tn, d, lang } = useT();
    const movesRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (!inst) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [inst, close]);

    // foco entra na carta ao abrir (leitor de tela e teclado começam nela) e volta pra quem abriu ao fechar
    const dialogRef = useRef<HTMLDivElement>(null);
    const open = !!inst;
    useEffect(() => {
        if (!open) return;
        const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialogRef.current?.focus({ preventScroll: true });
        return () => back?.focus({ preventScroll: true });
    }, [open]);

    // aberta a partir de um golpe: já mostra a parte dos golpes
    useEffect(() => {
        if (inst && section === 'moves') movesRef.current?.scrollIntoView({ block: 'start' });
    }, [inst, section]);

    if (!inst) return null;
    const view = viewInstance(inst);
    const sp = view.species;
    const evoTarget = evolutionTarget(inst.speciesId, inst.uid);
    const evoPct = Math.min(100, Math.round(((inst.evo ?? 0) / evoThreshold(run?.sponsors)) * 100));
    const abilityWorks = Object.keys(abilityEffect(inst.ability)).length > 0;
    const item = inst.item ?? null;
    // bônus/penalidades: os da carta + os do time (se ela está no seu elenco), a mesma regra do motor
    const picks = run?.picks ?? [];
    const lineup = (run?.lineup ?? []).map((u) => picks.find((p) => p.uid === u)).filter((p) => !!p);
    const onTeam = picks.some((p) => p.uid === inst.uid);
    const mods = attributeModifiers(
        inst,
        onTeam
            ? {
                  lineup,
                  captain: picks.find((p) => p.uid === run?.captainUid) ?? null,
                  role: position ?? null,
                  sponsors: run?.sponsors,
              }
            : { role: position ?? null },
    );
    const inField = applyModifiers(computeAttributes(sp, inst.level), mods, position ?? null);
    const ovrRole = position ?? view.naturalPosition;
    const cardOvr = positionRating(view.attributes, ovrRole);
    const fieldOvr = positionRating(inField, ovrRole);
    const moveMods = moveModifiers(inst);
    const physique = physiqueOf(sp);
    const body = d.common.body[sp.shape] ?? { label: physique.body, note: physique.note };

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e o botão × cobrem o teclado
        <div className="modal-backdrop" onClick={close} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche o modal */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="modal panel card-modal"
                role="dialog"
                aria-modal="true"
                aria-label={t('team.modal.aria', { name: view.displayName })}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="modal-close" onClick={close} aria-label={t('common.ui.close')}>
                    <HudIcon kind="close" />
                </button>
                <div className="card-modal-grid">
                    <div className="card-modal-left">
                        <FutCard inst={inst} position={position} captain={captain} inModal />
                        <div className="row" style={{ gap: 4, justifyContent: 'center' }}>
                            {sp.types.map((t) => (
                                <TypeBadge key={t} type={t} />
                            ))}
                        </div>
                        <div className="muted center" style={{ fontSize: 11 }}>
                            {t('team.modal.dexLine', {
                                id: String(sp.id).padStart(3, '0'),
                                tier: d.common.tier[sp.tier],
                                level: inst.level,
                            })}
                        </div>
                        {evoTarget && (
                            <>
                                {/* a mesma barra da partida, com nome: a do quadro da escalação parecia fôlego */}
                                <div className="inspect-energy evo">
                                    <span>{t('team.inspect.evolution')}</span>
                                    <span className="bar">
                                        <i style={{ width: `${evoPct}%` }} />
                                    </span>
                                    <b>{evoPct}%</b>
                                </div>
                                <div className="muted inspect-note">
                                    {t('team.modal.evoNote', { name: species(evoTarget).name })}
                                </div>
                            </>
                        )}
                        {note && <div className="card-note">{note}</div>}
                        {actions.length > 0 && (
                            <div className="modal-actions">
                                {actions.map((a) => (
                                    <button
                                        key={a.label}
                                        type="button"
                                        className={`btn${a.primary ? ' primary' : ''}`}
                                        onClick={() => {
                                            close();
                                            a.onClick();
                                        }}
                                    >
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {extra}
                    </div>

                    <div className="card-modal-right">
                        <h2>{view.displayName}</h2>

                        <h3>{t('team.modal.positions')}</h3>
                        <div className="pos-table">
                            {POSITIONS.map((p) => {
                                const r = ratingAt(inst, p);
                                return (
                                    <div key={p} className={`pos-row ${r.fit}`}>
                                        <span>{d.common.pos[p]}</span>
                                        <b>{r.rating}</b>
                                        <span className="muted">{d.team.modal.fit[r.fit]}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <h3>{t('team.modal.physique')}</h3>
                        <p className="tactic-desc physique-line">
                            <b>{d.common.size[physique.size] ?? physique.size}</b> · {body.label}
                            {body.note && ` · ${body.note}`}
                            {' · '}
                            {t('team.modal.aerial', {
                                level: d.common.aerial[
                                    aerialLevel(aerialScore(inField.strength, inField.positioning, sizePercentile(sp)))
                                ],
                            })}
                        </p>

                        {linksOf(sp.id).length > 0 && (
                            <>
                                <h3>{t('team.modal.storySynergies')}</h3>
                                <div className="modal-links">
                                    {linksOf(sp.id).map((l) => (
                                        <div key={l.id} className="tactic-desc">
                                            {rich(d.team.modal.linkWith, {
                                                chip: <LinkChip def={l} />,
                                                names: l.groups
                                                    .filter((g) => !g.includes(sp.id))
                                                    .map((g) => species(g[0]).name)
                                                    .join(', '),
                                                n: l.need,
                                                combo: linkText(l.id, lang).combo,
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {mods.length > 0 && (
                            <>
                                <h3>{t('team.modal.mods')}</h3>
                                <div className="mod-list">
                                    {mods.map((m) => {
                                        const up = (m.add ?? 0) > 0 || (m.factor ?? 1) > 1;
                                        return (
                                            <div key={m.label} className={`mod-row ${up ? 'up' : 'down'}`}>
                                                <HudIcon kind={up ? 'up' : 'down'} />
                                                {modLabel(m, lang)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <h3>
                            {t('team.modal.attrs')}
                            {onTeam ? t('team.modal.attrsOnTeam') : ''}
                        </h3>
                        {/* a nota com o time (capitão, sinergias, Patrocínios): o número grande da carta é ela sozinha */}
                        {onTeam && fieldOvr !== cardOvr && (
                            <p className="modal-field-ovr">
                                {t('team.modal.fieldOvr', { n: fieldOvr })}{' '}
                                <b className={fieldOvr > cardOvr ? 'up' : 'down'}>
                                    {fieldOvr > cardOvr ? '+' : ''}
                                    {fieldOvr - cardOvr}
                                </b>
                            </p>
                        )}
                        <div className="attrs modal-attrs">
                            {ALL_ATTRS.map((k) => {
                                const v = Math.round(view.attributes[k]);
                                const delta = Math.round(inField[k] - view.attributes[k]);
                                return (
                                    <div className="attr" key={k}>
                                        <span>{d.common.attr[k]}</span>
                                        <span className="bar">
                                            <i
                                                style={{
                                                    width: `${v}%`,
                                                    background:
                                                        v >= 80
                                                            ? '#58c26b'
                                                            : v >= 65
                                                              ? '#b6d94c'
                                                              : v >= 50
                                                                ? '#ffcb05'
                                                                : '#ff8a4c',
                                                }}
                                            />
                                        </span>
                                        <b>{v}</b>
                                        {delta !== 0 && (
                                            <em className={`attr-mod ${delta > 0 ? 'up' : 'down'}`}>
                                                {delta > 0 ? `▲${delta}` : `▼${-delta}`}
                                            </em>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <h3 ref={movesRef}>{t('team.modal.moves')}</h3>
                        <div className="move-details">
                            {inst.moves.map((m) => {
                                const data = MOVES[m];
                                const prof = moveProfile(m);
                                const sec = secondaryText(m, d);
                                const kindExplain = d.team.modal.kindExplain[prof.kind];
                                return (
                                    <div key={m} className="move-detail" style={{ borderColor: TYPE_COLOR[data.type] }}>
                                        <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
                                            <b>
                                                {moveName(m)}
                                                <TaughtMark inst={inst} move={m} />
                                            </b>
                                            <span className="row" style={{ gap: 4 }}>
                                                <TypeBadge type={data.type} />
                                                <span className="pos-chip">{d.team.modal.kindName[prof.kind]}</span>
                                            </span>
                                        </div>
                                        <div className="tactic-desc">
                                            {moveExplain(m, lang) ??
                                                (DRAIN[m] ? `${kindExplain}${t('team.modal.drain')}` : kindExplain)}
                                        </div>
                                        {moveMods
                                            .filter((mm) => mm.moveId === m)
                                            .map((mm) => (
                                                <div
                                                    key={mm.label}
                                                    className={`mod-row ${mm.factor > 1 ? 'up' : 'down'}`}
                                                >
                                                    <HudIcon kind={mm.factor > 1 ? 'up' : 'down'} />
                                                    {moveModLabel(mm, lang)}
                                                </div>
                                            ))}
                                        <div className="tactic-desc">
                                            {tn('team.modal.uses', moveUses(inst, m))}
                                            {t('team.modal.perMatch')}
                                            {data.power > 0 && t('team.modal.power', { n: data.power })}
                                            {sec && ` · ${sec}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <h3>{t('team.modal.ability')}</h3>
                        <p className="tactic-desc" style={{ margin: 0 }}>
                            <b style={{ color: 'var(--text)' }}>{abilityName(inst.ability)}</b>
                            {abilityWorks ? t('team.modal.abilityOn') : t('team.modal.abilityOff')} —{' '}
                            {abilityDesc(inst.ability, lang)}
                        </p>

                        {item && (
                            <>
                                <h3>{t('team.modal.item')}</h3>
                                <p className="tactic-desc card-item-row" style={{ margin: 0 }}>
                                    <img className="pixel" src={itemSprite(item)} alt="" />
                                    <span>
                                        <b style={{ color: 'var(--text)' }}>{itemName(item)}</b> —{' '}
                                        {itemDesc(item, lang)}
                                    </span>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
