import { TYPE_PT } from '../type-colors';

/**
 * Ícone oficial do tipo (símbolo de Pokémon Champions, via PokeAPI/sprites; `npm run assets:types`).
 * Com `label`, mostra o nome em português ao lado; sem, o nome fica no title.
 */
export function TypeIcon({ type, label, size }: { type: string; label?: boolean; size?: number }) {
    const name = TYPE_PT[type] ?? type;
    const img = (
        <img
            className="type-icon"
            src={`assets/types/${type.toLowerCase()}.png`}
            alt={label ? '' : name}
            title={label ? undefined : name}
            width={size}
            height={size}
            draggable={false}
        />
    );
    if (!label) return img;
    return (
        <span className="type-chip">
            {img}
            <span>{name}</span>
        </span>
    );
}

export function TypeIcons({ types, label, size }: { types: readonly string[]; label?: boolean; size?: number }) {
    return (
        <>
            {types.map((t) => (
                <TypeIcon key={t} type={t} label={label} size={size} />
            ))}
        </>
    );
}
