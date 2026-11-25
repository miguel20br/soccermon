import { SPECIES, species } from './data';
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
    /**
     * Sinergia secreta (fase 2, docs/planos/sinergias-secretas-fase2.md): o id dela no Registro (as geradas por família
     * repetem o mesmo). O bônus aparece na carta e no painel; o nome fica "???" até a descoberta.
     */
    secret?: string;
    /** Sem combo de passe e chute: as de "2 de N" só têm o bônus (Miguel, 25/11). */
    noCombo?: true;
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

/** Secreta escrita à mão: o id é o do Registro. */
const secret = (id: string, groups: number[][], need: number, bonus: number, noCombo?: true): LinkDef => ({
    id,
    name: id,
    desc: '',
    groups,
    need,
    bonus,
    combo: id,
    secret: id,
    ...(noCombo && { noCombo }),
});

// famílias da Gen 1 (base → final, a 1ª evolução de cada estágio) pra Mestre e Aprendiz e Família Completa; o Eevee
// fica de fora (já tem Eeveelutions e Irmãos Eevee)
const evo = (id: number) => species(id).evolvesTo.find((e) => e.id <= 151)?.id;
const evolved = new Set(SPECIES.flatMap((sp) => sp.evolvesTo.map((e) => e.id)));
const CHAINS = SPECIES.filter((sp) => sp.id <= 151 && sp.id !== 133 && !evolved.has(sp.id) && evo(sp.id)).map((sp) => {
    const chain = [sp.id];
    for (let next = evo(sp.id); next; next = evo(next)) chain.push(next);
    return chain;
});
const MISTY = [120, 121, 54, 55, 118, 119, 116, 117];
const BROCK = [95, 74, 75, 76, 37, 38, 41, 42];

/**
 * As 21 secretas com bônus em campo (fase 2; Miguel pediu a opinião do Claude em 25/11): +3/+4 nas que ligam muito, +5
 * nas de 2 famílias, +6 nas de 3 membros certos, +8 nas raras. Combo só nas de membros certos.
 */
const SECRETS: LinkDef[] = [
    secret('turma', [[25, 26], MISTY, BROCK], 3, 1.06),
    secret('montePrateado', [[25], [143], [3, 6, 9]], 3, 1.08),
    // o time do Blue: 3 das 6 famílias (com 2 ligava demais)
    secret(
        'rivalAzul',
        [
            [16, 17, 18],
            [63, 64, 65],
            [111, 112],
            [58, 59],
            [129, 130],
            [102, 103],
        ],
        3,
        1.04,
        true,
    ),
    secret('joyJenny', [[113], [58, 59]], 2, 1.05),
    secret('flauta', [[143], [39, 40, 35, 36]], 2, 1.05),
    secret('slowbro', [[79], [90]], 2, 1.05),
    ...CHAINS.map((c) => ({
        ...secret(`mestre${c[0]}`, [[c[0]], [c[c.length - 1]]], 2, 1.03, true),
        secret: 'mestreAprendiz',
    })),
    ...CHAINS.filter((c) => c.length === 3).map((c) => ({
        ...secret(`familia${c[0]}`, [[c[0]], [c[1]], [c[2]]], 3, 1.04, true),
        secret: 'familiaCompleta',
    })),
    secret('quatroPokebolas', [[1], [4], [7], [25]], 4, 1.08),
    secret('irmaosEevee', [[133], [134], [135], [136]], 4, 1.08),
    secret('museuPewter', [[138, 139], [140, 141], [142]], 3, 1.08),
    secret('jardimCeladon', [[69, 70, 71], [114], [43, 44, 45]], 2, 1.05, true),
    secret(
        'ninjasFuchsia',
        [
            [109, 110],
            [88, 89],
            [48, 49],
        ],
        2,
        1.05,
        true,
    ),
    secret('menteSaffron', [[63, 64, 65], [122], [48, 49]], 2, 1.05, true),
    secret('quizCinnabar', [[58, 59], [77, 78], [126]], 2, 1.05, true),
    secret('giovanni', [[53], [31, 34], [51, 112]], 3, 1.06),
    secret('lorelei', [[86, 87], [90, 91], [80], [124], [131]], 2, 1.05, true),
    secret('bruno', [[66, 67, 68], [106, 107], [95]], 3, 1.06),
    secret(
        'torre',
        [
            [92, 93, 94],
            [41, 42],
            [23, 24],
            [104, 105],
        ],
        2,
        1.05,
        true,
    ),
    secret(
        'lance',
        [
            [147, 148, 149],
            [130, 142],
        ],
        2,
        1.05,
    ),
    // exclusivos de versão (Red x Blue) no mesmo time
    ...[
        [[123], [127]],
        [
            [23, 24],
            [27, 28],
        ],
        [
            [43, 44, 45],
            [69, 70, 71],
        ],
        [
            [58, 59],
            [37, 38],
        ],
        [
            [56, 57],
            [52, 53],
        ],
    ].map((g, i) => ({ ...secret(`cabo${i}`, g, 2, 1.04, true), secret: 'caboLink' })),
];
LINKS.push(...SECRETS);

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
export function computeLinks(lineup: readonly Pick<PokemonInstance, 'uid' | 'speciesId'>[]): ActiveLink[] {
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

/** Sinergias de história em que um Pokémon (espécie) poderia entrar — pra mostrar na carta (as secretas não). */
export function linksOf(speciesId: number): LinkDef[] {
    return LINKS.filter((l) => !l.secret && l.groups.some((g) => g.includes(speciesId)));
}

/** Multiplicador de atributos de um titular: o maior bônus entre as sinergias de que participa. */
export function linkFactor(links: readonly ActiveLink[], uid: string): number {
    return links.filter((l) => l.members.includes(uid)).reduce((best, l) => Math.max(best, l.bonus), 1);
}
