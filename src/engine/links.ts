import type { PokemonInstance } from './instance';

/**
 * Sinergias de história (estilo Naruto Storm): duplas e grupos famosos da Gen 1 ganham bônus juntos
 * em quadra, e quem tem ligação pode fazer um "combo" (passe de um, chute do outro).
 *
 * Cada `group` é uma família evolutiva (qualquer estágio conta). `need` = quantas famílias diferentes
 * precisam estar entre os titulares.
 */
export interface LinkDef {
    id: string;
    name: string;
    desc: string;
    groups: number[][];
    need: number;
    bonus: number;
    /** Bônus com todas as famílias juntas (degrau de cima), quando passa do `need`. */
    full?: number;
    /** Sinergia especial: completa, as cartas ganham aura na formação. */
    special?: boolean;
    /** Nome do combo que aparece na tela. */
    combo: string;
}

export const LINKS: LinkDef[] = [
    {
        id: 'genese',
        name: 'Gênese',
        desc: 'Mew e Mewtwo, o original e o clone.',
        groups: [[150], [151]],
        need: 2,
        bonus: 1.08,
        special: true,
        combo: 'Psíquico Duplo',
    },
    {
        id: 'passaros',
        name: 'Pássaros Lendários',
        desc: 'Articuno, Zapdos e Moltres.',
        groups: [[144], [145], [146]],
        need: 2,
        bonus: 1.06,
        // os 3 juntos são raríssimos: degrau especial
        full: 1.1,
        special: true,
        combo: 'Tempestade Lendária',
    },
    {
        id: 'iniciais',
        name: 'Iniciais de Kanto',
        desc: 'Bulbasaur, Charmander e Squirtle (ou evoluções).',
        groups: [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ],
        need: 3,
        bonus: 1.08,
        special: true,
        combo: 'Triângulo Elemental',
    },
    {
        id: 'ash',
        name: 'Time do Ash',
        desc: 'Pikachu com velhos amigos: Charizard, Bulbasaur, Squirtle, Pidgeot, Butterfree, Kingler, Muk, Snorlax, Lapras.',
        groups: [
            [25, 26],
            [4, 5, 6],
            [1, 2, 3],
            [7, 8, 9],
            [16, 17, 18],
            [10, 11, 12],
            [98, 99],
            [88, 89],
            [143],
            [131],
        ],
        need: 3,
        bonus: 1.05,
        combo: 'Eu Escolho Você',
    },
    {
        id: 'rocket',
        name: 'Equipe Rocket',
        desc: 'Ekans, Koffing e Meowth (ou evoluções). Preparem-se para encrenca!',
        groups: [
            [23, 24],
            [109, 110],
            [52, 53],
        ],
        need: 2,
        bonus: 1.05,
        combo: 'Decolando de Novo',
    },
    {
        id: 'hitmon',
        name: 'Irmãos Hitmon',
        desc: 'Hitmonlee e Hitmonchan.',
        groups: [[106], [107]],
        need: 2,
        bonus: 1.06,
        combo: 'Chute e Soco',
    },
    {
        id: 'nido',
        name: 'Casal Nido',
        desc: 'Nidoking e Nidoqueen (ou pré-evoluções).',
        groups: [
            [29, 30, 31],
            [32, 33, 34],
        ],
        need: 2,
        bonus: 1.05,
        combo: 'Investida Real',
    },
    {
        id: 'eevee',
        name: 'Eeveelutions',
        desc: 'Vaporeon, Jolteon e Flareon.',
        groups: [[134], [135], [136]],
        need: 2,
        bonus: 1.05,
        combo: 'Evolução em Cadeia',
    },
    {
        id: 'fosseis',
        name: 'Fósseis',
        desc: 'Omanyte, Kabuto e Aerodactyl (ou evoluções).',
        groups: [[138, 139], [140, 141], [142]],
        need: 2,
        bonus: 1.05,
        combo: 'Era Pré-Histórica',
    },
    {
        id: 'mae',
        name: 'Instinto Materno',
        desc: 'Kangaskhan protege Cubone (ou Marowak).',
        groups: [[115], [104, 105]],
        need: 2,
        bonus: 1.06,
        combo: 'Proteção de Mãe',
    },
    {
        id: 'elementais',
        name: 'Trio Elemental',
        desc: 'Jynx, Electabuzz e Magmar: gelo, raio e fogo.',
        groups: [[124], [125], [126]],
        need: 2,
        bonus: 1.05,
        combo: 'Soco Triplo',
    },
    {
        id: 'brock',
        name: 'Time do Brock',
        desc: 'Onix, Geodude, Vulpix e Zubat (ou evoluções).',
        groups: [[95], [74, 75, 76], [37, 38], [41, 42]],
        need: 2,
        bonus: 1.04,
        combo: 'Muralha de Pedra',
    },
    {
        id: 'misty',
        name: 'Time da Misty',
        desc: 'Staryu, Psyduck, Goldeen e Horsea (ou evoluções).',
        groups: [
            [120, 121],
            [54, 55],
            [118, 119],
            [116, 117],
        ],
        need: 2,
        bonus: 1.04,
        combo: 'Onda Cerulean',
    },
    {
        id: 'fofos',
        name: 'Canção de Ninar',
        desc: 'Clefairy e Jigglypuff (ou evoluções).',
        groups: [
            [35, 36],
            [39, 40],
        ],
        need: 2,
        bonus: 1.04,
        combo: 'Dueto Lunar',
    },
];

export interface ActiveLink {
    def: LinkDef;
    /** uids dos titulares que fazem parte da sinergia. */
    members: string[];
    /** Bônus do degrau atingido. */
    bonus: number;
    /** Todas as famílias juntas (sinergia especial completa = aura). */
    full: boolean;
}

/** Sinergias de história ativas entre os titulares. */
export function computeLinks(lineup: readonly PokemonInstance[]): ActiveLink[] {
    const active: ActiveLink[] = [];
    for (const def of LINKS) {
        const members: string[] = [];
        let families = 0;
        for (const group of def.groups) {
            const inGroup = lineup.filter((p) => group.includes(p.speciesId));
            if (inGroup.length > 0) families++;
            members.push(...inGroup.map((p) => p.uid));
        }
        const full = families === def.groups.length;
        if (families >= def.need) active.push({ def, members, full, bonus: full && def.full ? def.full : def.bonus });
    }
    return active;
}

/** Sinergias em que um Pokémon (espécie) poderia entrar — pra mostrar na carta. */
export function linksOf(speciesId: number): LinkDef[] {
    return LINKS.filter((l) => l.groups.some((g) => g.includes(speciesId)));
}

/** Multiplicador de atributos de um titular: o maior bônus entre as sinergias de que participa. */
export function linkFactor(links: readonly ActiveLink[], uid: string): number {
    return links.filter((l) => l.members.includes(uid)).reduce((best, l) => Math.max(best, l.bonus), 1);
}
