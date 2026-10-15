import { typeName } from '../../i18n';
import { useLang } from '../../i18n/react';

/**
 * Ícone oficial do tipo (símbolo de Pokémon Champions, via PokeAPI/sprites; `npm run assets:types`).
 * Com `label`, mostra o nome no idioma do jogo ao lado; sem, o nome fica no title.
 */
export function TypeIcon({ type, label, size }: { type: string; label?: boolean; size?: number }) {
    const name = typeName(type, useLang());
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
