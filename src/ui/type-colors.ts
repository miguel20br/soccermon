export const TYPE_COLOR: Record<string, string> = {
    Normal: '#A8A77A',
    Fire: '#EE8130',
    Water: '#6390F0',
    Electric: '#F7D02C',
    Grass: '#7AC74C',
    Ice: '#96D9D6',
    Fighting: '#C22E28',
    Poison: '#A33EA1',
    Ground: '#E2BF65',
    Flying: '#A98FF3',
    Psychic: '#F95587',
    Bug: '#A6B91A',
    Rock: '#B6A136',
    Ghost: '#735797',
    Dragon: '#6F35FC',
    Dark: '#705746',
    Steel: '#B7B7CE',
    Fairy: '#D685AD',
};

export const TYPE_PT: Record<string, string> = {
    Normal: 'Normal',
    Fire: 'Fogo',
    Water: 'Água',
    Electric: 'Elétrico',
    Grass: 'Planta',
    Ice: 'Gelo',
    Fighting: 'Lutador',
    Poison: 'Venenoso',
    Ground: 'Terrestre',
    Flying: 'Voador',
    Psychic: 'Psíquico',
    Bug: 'Inseto',
    Rock: 'Pedra',
    Ghost: 'Fantasma',
    Dragon: 'Dragão',
    Dark: 'Sombrio',
    Steel: 'Aço',
    Fairy: 'Fada',
};

/** Tipos com fundo claro pedem texto escuro no badge. */
export const TYPE_DARK_TEXT = new Set(['Electric', 'Ice', 'Ground', 'Steel', 'Normal', 'Bug', 'Rock']);

export const hexToNumber = (hex: string) => Number.parseInt(hex.slice(1), 16);
