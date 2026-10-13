import { abilityEffect } from '../../engine/abilities';
import {
    type AttrKey,
    outOfPositionFactor,
    POSITION_LABEL,
    type Position,
    positionRating,
} from '../../engine/attributes';
import { ABILITIES, MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { moveProfile } from '../../engine/moves';
import { TYPE_COLOR, TYPE_DARK_TEXT, TYPE_PT } from '../type-colors';

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

export function TypeBadge({ type }: { type: string }) {
    return (
        <span
            className={`type-badge${TYPE_DARK_TEXT.has(type) ? ' dark' : ''}`}
            style={{ background: TYPE_COLOR[type] }}
        >
            {TYPE_PT[type] ?? type}
        </span>
    );
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
    position?: Position;
    compact?: boolean;
}

export function PokeCard({ inst, onClick, position, compact }: PokeCardProps) {
    const view = viewInstance(inst);
    const sp = view.species;
    const ability = ABILITIES[inst.ability];
    const hasEffect = Object.keys(abilityEffect(inst.ability)).length > 0;
    const pos = position ?? view.naturalPosition;
    // nota na posição pedida (com penalidade se não for a posição natural)
    const rating = Math.round(positionRating(view.attributes, pos) * outOfPositionFactor(view.naturalPosition, pos));
    const offPosition = pos !== view.naturalPosition;
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            className="card"
            style={{ ['--tier' as string]: TIER_COLOR[sp.tier] }}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {inst.shiny && (
                <span className="shiny" title="Shiny!">
                    ★
                </span>
            )}
            <div className="card-head">
                <div>
                    <div className="card-name">{view.displayName}</div>
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
                    <span className="pos-badge">{POSITION_LABEL[pos]}</span>
                    {offPosition && <div className="card-natural">é {POSITION_LABEL[view.naturalPosition]}</div>}
                </div>
            </div>
            <div className="card-art">
                <img className="pixel" src={cardSprite(inst)} alt={sp.name} loading="lazy" />
            </div>
            {!compact && <AttrBars inst={inst} />}
            <MoveList inst={inst} />
            <div className="ability" title={ability?.descPt ?? ability?.shortDesc}>
                Habilidade: <b>{ability?.name ?? inst.ability}</b>
                {!hasEffect && <span> (sem efeito no futsal)</span>}
            </div>
        </Tag>
    );
}
