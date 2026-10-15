import { useEffect } from 'react';
import { abilityEffect } from '../../engine/abilities';
import { type AttrKey, computeAttributes, POSITION_LABEL, POSITIONS, physiqueOf } from '../../engine/attributes';
import { ABILITIES, MOVES, species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { linksOf } from '../../engine/links';
import { applyModifiers, attributeModifiers, moveModifiers } from '../../engine/modifiers';
import { DRAIN, moveProfile, SPECIAL_EXPLAIN } from '../../engine/moves';
import { useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { ATTR_SHORT, FutCard } from './FutCard';
import { LinkChip } from './LinkChips';
import { TIER_PT, TypeBadge } from './PokeCard';
import { TaughtMark } from './TmTeach';

/** O que cada tipo de golpe faz no futsal (explicação para o jogador). */
const KIND_EXPLAIN: Record<string, string> = {
    strike: 'Com a bola: chute mais forte. Sem a bola: desarme mais forte que derruba e empurra o rival.',
    blast: 'Com a bola: chute mais preciso. Sem a bola: disparo no rival mais perto, que atordoa e empurra.',
    burst: 'Arrancada: fica bem mais veloz por alguns segundos.',
    buff: 'Melhora os próprios atributos por 12 segundos.',
    debuff: 'Piora os atributos do rival mais perto por 10 segundos.',
    status: 'Aplica um status no rival mais perto (paralisia, sono, veneno, confusão…).',
    heal: 'Recupera o fôlego.',
    flavor: 'Não faz nada… mas a torcida adora.',
    special: 'Efeito especial (veja abaixo).',
};
const KIND_NAME: Record<string, string> = {
    strike: 'Golpe físico',
    blast: 'Golpe especial',
    burst: 'Arrancada',
    buff: 'Fortalecimento',
    debuff: 'Enfraquecimento',
    status: 'Status',
    heal: 'Cura',
    flavor: 'Enfeite',
    special: 'Especial',
};
const SECONDARY_PT: Record<string, string> = {
    par: 'paralisar',
    brn: 'queimar',
    frz: 'congelar',
    psn: 'envenenar',
    tox: 'envenenar',
    slp: 'fazer dormir',
    confusion: 'confundir',
    flinch: 'fazer hesitar',
};
const FIT_PT = { main: 'principal', alt: 'joga bem', off: 'fora de posição' } as const;
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

function secondaryText(moveId: string): string | null {
    const sec = MOVES[moveId]?.secondary;
    if (!sec) return null;
    const what = (sec.status && SECONDARY_PT[sec.status]) || (sec.volatile && SECONDARY_PT[sec.volatile]);
    if (!what) return sec.boosts ? 'pode enfraquecer o alvo' : null;
    const chance = Math.round(Math.min(65, sec.chance * 3 + 5));
    return `${chance}% de chance de ${what}`;
}

/** Carta completa: tudo sobre o Pokémon, com ações (escolher, pegar…). */
export function CardModal() {
    const { inst, position, captain, note, actions, close } = useCardModal();
    const run = useGame((s) => s.run);

    useEffect(() => {
        if (!inst) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [inst, close]);

    if (!inst) return null;
    const view = viewInstance(inst);
    const sp = view.species;
    const ability = ABILITIES[inst.ability];
    const abilityWorks = Object.keys(abilityEffect(inst.ability)).length > 0;
    const item = inst.item ? ITEMS[inst.item] : null;
    // bônus/penalidades: os da carta + os do time (se ela está no seu elenco), a mesma regra do motor
    const picks = run?.picks ?? [];
    const lineup = (run?.lineup ?? []).map((u) => picks.find((p) => p.uid === u)).filter((p) => !!p);
    const onTeam = picks.some((p) => p.uid === inst.uid);
    const mods = attributeModifiers(
        inst,
        onTeam
            ? { lineup, captain: picks.find((p) => p.uid === run?.captainUid) ?? null, role: position ?? null }
            : { role: position ?? null },
    );
    const inField = applyModifiers(computeAttributes(sp, inst.level), mods, position ?? null);
    const moveMods = moveModifiers(inst);

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e o botão × cobrem o teclado
        <div className="modal-backdrop" onClick={close} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche o modal */}
            <div
                className="modal panel card-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Carta de ${view.displayName}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="modal-close" onClick={close} aria-label="Fechar">
                    ×
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
                            #{String(sp.id).padStart(3, '0')} · {TIER_PT[sp.tier]} · nível {inst.level}
                        </div>
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
                    </div>

                    <div className="card-modal-right">
                        <h2>{view.displayName}</h2>

                        <h3>Posições</h3>
                        <div className="pos-table">
                            {POSITIONS.map((p) => {
                                const r = ratingAt(inst, p);
                                return (
                                    <div key={p} className={`pos-row ${r.fit}`}>
                                        <span>{POSITION_LABEL[p]}</span>
                                        <b>{r.rating}</b>
                                        <span className="muted">{FIT_PT[r.fit]}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <h3>Físico</h3>
                        <p className="tactic-desc physique-line">
                            <b>{physiqueOf(sp).size}</b> · {physiqueOf(sp).body}
                            {physiqueOf(sp).note && ` · ${physiqueOf(sp).note}`}
                        </p>

                        {linksOf(sp.id).length > 0 && (
                            <>
                                <h3>Sinergias de história</h3>
                                <div className="modal-links">
                                    {linksOf(sp.id).map((l) => (
                                        <div key={l.id} className="tactic-desc">
                                            <LinkChip def={l} /> com{' '}
                                            {l.groups
                                                .filter((g) => !g.includes(sp.id))
                                                .map((g) => species(g[0]).name)
                                                .join(', ')}{' '}
                                            ({l.need} juntos) · combo {l.combo}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {mods.length > 0 && (
                            <>
                                <h3>Bônus e penalidades</h3>
                                <div className="mod-list">
                                    {mods.map((m) => {
                                        const up = (m.add ?? 0) > 0 || (m.factor ?? 1) > 1;
                                        return (
                                            <div key={m.label} className={`mod-row ${up ? 'up' : 'down'}`}>
                                                <span>{up ? '▲' : '▼'}</span>
                                                {m.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <h3>Atributos{onTeam ? ' (em campo, com o seu time)' : ''}</h3>
                        <div className="attrs modal-attrs">
                            {ALL_ATTRS.map((k) => {
                                const v = Math.round(view.attributes[k]);
                                const d = Math.round(inField[k] - view.attributes[k]);
                                return (
                                    <div className="attr" key={k}>
                                        <span>{ATTR_SHORT[k]}</span>
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
                                        {d !== 0 && (
                                            <em className={`attr-mod ${d > 0 ? 'up' : 'down'}`}>
                                                {d > 0 ? `▲${d}` : `▼${-d}`}
                                            </em>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <h3>Golpes</h3>
                        <div className="move-details">
                            {inst.moves.map((m) => {
                                const data = MOVES[m];
                                const prof = moveProfile(m);
                                const sec = secondaryText(m);
                                return (
                                    <div key={m} className="move-detail" style={{ borderColor: TYPE_COLOR[data.type] }}>
                                        <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
                                            <b>
                                                {data.name}
                                                <TaughtMark inst={inst} move={m} />
                                            </b>
                                            <span className="row" style={{ gap: 4 }}>
                                                <TypeBadge type={data.type} />
                                                <span className="pos-chip">{KIND_NAME[prof.kind]}</span>
                                            </span>
                                        </div>
                                        <div className="tactic-desc">
                                            {SPECIAL_EXPLAIN[m] ??
                                                (DRAIN[m]
                                                    ? `${KIND_EXPLAIN[prof.kind]} Suga o fôlego do alvo.`
                                                    : KIND_EXPLAIN[prof.kind])}
                                        </div>
                                        {moveMods
                                            .filter((mm) => mm.moveId === m)
                                            .map((mm) => (
                                                <div
                                                    key={mm.label}
                                                    className={`mod-row ${mm.factor > 1 ? 'up' : 'down'}`}
                                                >
                                                    <span>{mm.factor > 1 ? '▲' : '▼'}</span>
                                                    {mm.label}
                                                </div>
                                            ))}
                                        <div className="tactic-desc">
                                            {prof.uses} {prof.uses === 1 ? 'uso' : 'usos'} por partida
                                            {data.power > 0 && ` · poder ${data.power}`}
                                            {sec && ` · ${sec}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <h3>Habilidade</h3>
                        <p className="tactic-desc" style={{ margin: 0 }}>
                            <b style={{ color: 'var(--text)' }}>{ability?.name ?? inst.ability}</b>
                            {abilityWorks ? ' (ativa no futsal)' : ' (sem efeito no futsal)'} —{' '}
                            {ability?.descPt ?? ability?.shortDesc}
                        </p>

                        {item && (
                            <>
                                <h3>Item</h3>
                                <p className="tactic-desc card-item-row" style={{ margin: 0 }}>
                                    <img className="pixel" src={itemSprite(item.id)} alt="" />
                                    <span>
                                        <b style={{ color: 'var(--text)' }}>{item.name}</b> — {item.desc}
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
