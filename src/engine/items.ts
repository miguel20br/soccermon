/**
 * Itens Pokémon (1 por Pokémon). Ganhos como recompensa entre as partidas da copa.
 * Os efeitos são aplicados por ganchos em match.ts.
 */
export type ItemKind =
    | 'leftovers'
    | 'choiceband'
    | 'quickclaw'
    | 'focussash'
    | 'scopelens'
    | 'lumberry'
    | 'kingsrock'
    | 'eviolite'
    | 'type';

export interface ItemData {
    id: string;
    name: string;
    kind: ItemKind;
    desc: string;
    /** Nome do arquivo em PokeAPI/sprites/sprites/items. */
    sprite: string;
    /** Para itens de tipo: o tipo que eles fortalecem. */
    type?: string;
}

const TYPE_ITEMS: [string, string, string][] = [
    ['charcoal', 'Charcoal', 'Fire'],
    ['mysticwater', 'Mystic Water', 'Water'],
    ['magnet', 'Magnet', 'Electric'],
    ['miracleseed', 'Miracle Seed', 'Grass'],
    ['nevermeltice', 'Never-Melt Ice', 'Ice'],
    ['blackbelt', 'Black Belt', 'Fighting'],
    ['poisonbarb', 'Poison Barb', 'Poison'],
    ['softsand', 'Soft Sand', 'Ground'],
    ['sharpbeak', 'Sharp Beak', 'Flying'],
    ['twistedspoon', 'Twisted Spoon', 'Psychic'],
    ['silverpowder', 'Silver Powder', 'Bug'],
    ['hardstone', 'Hard Stone', 'Rock'],
    ['spelltag', 'Spell Tag', 'Ghost'],
    ['dragonfang', 'Dragon Fang', 'Dragon'],
    ['silkscarf', 'Silk Scarf', 'Normal'],
    ['metalcoat', 'Metal Coat', 'Steel'],
    ['blackglasses', 'Black Glasses', 'Dark'],
];

const spriteName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const ITEMS: Record<string, ItemData> = {
    leftovers: {
        id: 'leftovers',
        name: 'Leftovers',
        kind: 'leftovers',
        sprite: 'leftovers',
        desc: 'Recupera 0,15% de fôlego por segundo.',
    },
    choiceband: {
        id: 'choiceband',
        name: 'Choice Band',
        kind: 'choiceband',
        sprite: 'choice-band',
        desc: 'Chute +15%, mas só o primeiro golpe pode ser usado.',
    },
    quickclaw: {
        id: 'quickclaw',
        name: 'Quick Claw',
        kind: 'quickclaw',
        sprite: 'quick-claw',
        desc: '+15% nas divididas (desarmes e proteção de bola).',
    },
    focussash: {
        id: 'focussash',
        name: 'Focus Sash',
        kind: 'focussash',
        sprite: 'focus-sash',
        desc: 'Goleiro: segura o 1º chute no gol. Linha: ignora o 1º status.',
    },
    scopelens: {
        id: 'scopelens',
        name: 'Scope Lens',
        kind: 'scopelens',
        sprite: 'scope-lens',
        desc: '20% de chance de chute crítico (mais forte e preciso).',
    },
    lumberry: {
        id: 'lumberry',
        name: 'Lum Berry',
        kind: 'lumberry',
        sprite: 'lum-berry',
        desc: 'Bloqueia o 1º status vindo do rival na partida.',
    },
    kingsrock: {
        id: 'kingsrock',
        name: "King's Rock",
        kind: 'kingsrock',
        sprite: 'kings-rock',
        desc: 'Golpes de dano que acertam têm 30% de chance de atordoar o rival por 0,7 s.',
    },
    eviolite: {
        id: 'eviolite',
        name: 'Eviolite',
        kind: 'eviolite',
        sprite: 'eviolite',
        desc: 'Quem ainda pode evoluir ganha +30% em todos os atributos.',
    },
    ...Object.fromEntries(
        TYPE_ITEMS.map(([id, name, type]) => [
            id,
            {
                id,
                name,
                kind: 'type' as const,
                type,
                sprite: spriteName(name),
                desc: `Golpes do tipo ${type} ficam 20% mais fortes.`,
            },
        ]),
    ),
};

/**
 * Eviolite (pedido do Repositor Supremo, 16/11; +30% aprovado pelo Miguel em 21/11): fator em todos os atributos de quem
 * ainda pode evoluir. Objeto mutável só pra varredura em scripts/balance/eviolite.ts.
 */
export const EVIOLITE = { factor: 1.3 };

/** Itens que o jogador sorteia (recompensa, Mercado, Cassino). */
export const ITEM_IDS = Object.keys(ITEMS);
/** Itens dos rivais da copa e da Rota: sem a Eviolite, pra mesma seed dar os mesmos times de antes. */
export const RIVAL_ITEM_IDS = ITEM_IDS.filter((id) => id !== 'eviolite');
export const TYPE_ITEM_FOR: Record<string, string> = Object.fromEntries(TYPE_ITEMS.map(([id, , type]) => [type, id]));
export const itemSprite = (id: string) => `assets/items/${ITEMS[id]?.sprite ?? id}.png`;
