import { useState } from 'react';
import { abilityEffect } from '../../engine/abilities';
import { type AttrKey, POSITION_LABEL, type Position } from '../../engine/attributes';
import { ABILITIES, MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { moveProfile } from '../../engine/moves';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { TypeIcon } from './TypeIcon';

export const TIER_COLOR: Record<Tier, string> = {
    common: '#8f97b8',
    uncommon: '#58c26b',
    rare: '#3a9bff',
    epic: '#b46cff',
    legendary: '#ffcb05',
};
export const TIER_PT: Record<Tier, string> = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
};

const ATTR_PT: Record<AttrKey, string> = {
    pace: 'Velocidade',
    dribble: 'Drible',
    shooting: 'Chute',
    passing: 'Passe',
    tackling: 'Desarme',
    strength: 'Força',
    positioning: 'Leitura',
    stamina: 'Fôlego',
    goalkeeping: 'Goleiro',
};

const KIND_PT: Record<string, string> = {
    strike: 'chute forte / carrinho',
    blast: 'finalização especial',
    burst: 'arrancada',
    buff: 'fortalece',
    debuff: 'enfraquece rival',
    status: 'status no rival',
    heal: 'recupera fôlego',
    flavor: '...nada?',
};

export const cardSprite = (inst: Pick<PokemonInstance, 'speciesId' | 'shiny'>) =>
    `assets/cards/${inst.shiny ? 'shiny/' : ''}${inst.speciesId}.gif`;

/** Tipo com o ícone oficial + nome em português (src/ui/components/TypeIcon.tsx). */
export function TypeBadge({ type }: { type: string }) {
    return <TypeIcon type={type} label />;
}

function attrColor(v: number) {
    if (v >= 80) return '#58c26b';
    if (v >= 65) return '#b6d94c';
    if (v >= 50) return '#ffcb05';
    return '#ff8a4c';
}

export function AttrBars({ inst, keys }: { inst: PokemonInstance; keys?: AttrKey[] }) {
    const view = viewInstance(inst);
    const list =
        keys ??
        (view.naturalPosition === 'GK'
            ? (['goalkeeping', 'positioning', 'strength', 'pace', 'passing', 'stamina'] as AttrKey[])
            : ([
                  'pace',
                  'dribble',
                  'shooting',
                  'passing',
                  'tackling',
                  'strength',
                  'positioning',
                  'stamina',
              ] as AttrKey[]));
    return (
        <div className="attrs">
            {list.map((k) => {
                const v = Math.round(view.attributes[k]);
                return (
                    <div className="attr" key={k}>
                        <span>{ATTR_PT[k]}</span>
                        <span className="bar">
                            <i style={{ width: `${v}%`, background: attrColor(v) }} />
                        </span>
                        <b>{v}</b>
                    </div>
                );
            })}
        </div>
    );
}

export function MoveList({ inst }: { inst: PokemonInstance }) {
    return (
        <div className="moves">
            {inst.moves.map((m) => {
                const data = MOVES[m];
                const prof = moveProfile(m);
                return (
                    <span
                        key={m}
                        className="move"
                        style={{ ['--move-color' as string]: TYPE_COLOR[data.type] }}
                        title={`${KIND_PT[prof.kind]} · ${data.descPt ?? data.shortDesc}`}
                    >
                        {data.name}
                    </span>
                );
            })}
        </div>
    );
}

interface PokeCardProps {
    inst: PokemonInstance;
    onClick?: () => void;
    /** Posição para a nota exibida (padrão: a principal). */
    position?: Position;
    captain?: boolean;
    selected?: boolean;
}

export function PokeCard({ inst, onClick, position, captain, selected }: PokeCardProps) {
    const [showAttrs, setShowAttrs] = useState(false);
    const view = viewInstance(inst);
    const sp = view.species;
    const ability = ABILITIES[inst.ability];
    const hasEffect = Object.keys(abilityEffect(inst.ability)).length > 0;
    const pos = position ?? view.naturalPosition;
    const { rating, fit } = ratingAt(inst, pos);
    const item = inst.item ? ITEMS[inst.item] : null;
    const interactive = onClick
        ? {
              role: 'button',
              tabIndex: 0,
              onClick,
              onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onClick();
                  }
              },
          }
        : {};
    return (
        <div
            className={`card${onClick ? ' clickable' : ''}${selected ? ' selected' : ''}${showAttrs ? ' attrs-open' : ''}`}
            style={{ ['--tier' as string]: TIER_COLOR[sp.tier] }}
            {...interactive}
        >
            {inst.shiny && (
                <span className="shiny" title="Shiny!">
                    ★
                </span>
            )}
            <div className="card-head">
                <div>
                    <div className="card-name">
                        {captain && <span className="captain-badge inline">C</span>}
                        {view.displayName}
                    </div>
                    <div className="card-dex">
                        #{String(sp.id).padStart(3, '0')} · <span className="tier-label">{TIER_PT[sp.tier]}</span>
                    </div>
                    <div className="row" style={{ gap: 4, marginTop: 4 }}>
                        {sp.types.map((t) => (
                            <TypeBadge key={t} type={t} />
                        ))}
                    </div>
                </div>
                <div className="card-ovr">
                    <b>{rating}</b>
                    <span className={`pos-badge ${fit}`}>{POSITION_LABEL[pos]}</span>
                    {fit === 'off' && <div className="card-natural">fora de posição</div>}
                </div>
            </div>
            <div className="card-art">
                <img className="pixel" src={cardSprite(inst)} alt={sp.name} loading="lazy" />
            </div>
            <div className="card-positions" title="Posições em que joga bem">
                {view.positions.map((p, i) => (
                    <span key={p} className={`pos-chip${i === 0 ? ' main' : ''}`}>
                        {POSITION_LABEL[p]}
                    </span>
                ))}
            </div>
            <button
                type="button"
                className="attrs-toggle"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowAttrs((v) => !v);
                }}
            >
                {showAttrs ? 'esconder atributos' : 'ver atributos'}
            </button>
            <AttrBars inst={inst} />
            <MoveList inst={inst} />
            <div className="ability" title={ability?.descPt ?? ability?.shortDesc}>
                Habilidade: <b>{ability?.name ?? inst.ability}</b>
                {!hasEffect && <span> (sem efeito no futsal)</span>}
            </div>
            {item && (
                <div className="card-item" title={item.desc}>
                    <img className="pixel" src={itemSprite(item.id)} alt="" /> {item.name}
                </div>
            )}
        </div>
    );
}
