import { SPECIES, species, TYPES } from './data';
import type { PokemonInstance } from './instance';
import { Rng } from './rng';

/**
 * Cartas especiais (edições). Uma carta tem no máximo uma edição; shiny continua sendo só o sprite
 * e conta como edição "Shiny" quando não há outra. Toda edição dá +2 em todos os atributos (não acumula).
 * - Ícone: Pokémon da lista curada, 1 em 80 quando aparece no draft ou na recompensa.
 * - Evento: tipo da semana, 1 em 8 para cartas desse tipo.
 * - Destaque: o craque do seu time na partida (dado pelo resultado, não sorteado).
 */
export type SpecialKind = 'icone' | 'evento' | 'destaque';

export interface Special {
    kind: SpecialKind;
    /** Evento: o tipo da semana. */
    type?: string;
    /** Ícone: título temático ("Pikachu do Ash"). */
    title?: string;
    /**
     * Destaque: nível 1–3 (o craque que segue jogando muito sobe de nível: +2, +3, +4).
     * Ícone: quantos MVPs a carta já levou (0–3, selo "MVP n"): +1 por MVP em cima dos +2 da edição.
     */
    level?: number;
}

/** Edições no jogo (draft, recompensa, Destaque). Desligar aqui some com elas do jogo (a galeria continua). */
export const SPECIALS_LIVE = true;

export const SPECIAL_BONUS = 2;
/** Ícone tem que ser raro de verdade: os 20 da lista já são os mais famosos, então saem muito no draft. */
export const ICON_CHANCE = 1 / 80;
export const EVENT_CHANCE = 1 / 8;

/** Ícones: espécie → título da carta. */
export const ICONS: Record<number, string> = {
    25: 'Pikachu do Ash',
    6: 'Charizard Rebelde',
    9: 'Blastoise da Equipe Squirtle',
    3: 'Venusaur Guardião',
    150: 'Mewtwo Contra-Ataca',
    151: 'Mew Ancestral',
    94: 'Gengar Sombrio',
    143: 'Snorlax Bloqueador',
    149: 'Dragonite Mensageiro',
    130: 'Gyarados Vermelho',
    131: 'Lapras Amigo',
    39: 'Jigglypuff Cantora',
    54: 'Psyduck da Misty',
    95: 'Onix do Brock',
    52: 'Meowth Falante',
    65: 'Alakazam Prodígio',
    68: 'Machamp Campeão',
    59: 'Arcanine Lendário',
    133: 'Eevee Coringa',
    132: 'Ditto Imitador',
};

/** Edição efetiva pra exibir: a especial, ou "shiny" quando é só shiny. */
export type Edition = SpecialKind | 'shiny';
export function editionOf(inst: PokemonInstance): Edition | null {
    return inst.special?.kind ?? (inst.shiny ? 'shiny' : null);
}

export const DESTAQUE_MAX_LEVEL = 3;
/** Nota mínima na partida pra um Destaque subir de nível (senão o prêmio vai pro próximo craque). */
export const DESTAQUE_LEVEL_UP_RATING = 8;

/** +2 em tudo pra qualquer edição (inclusive shiny); Destaque nível 2 e 3 dão +3 e +4; Ícone +1 por MVP (até +5). */
export function specialBonus(inst: PokemonInstance): number {
    if (!editionOf(inst)) return 0;
    const s = inst.special;
    if (s?.kind === 'destaque') return SPECIAL_BONUS + (s.level ?? 1) - 1;
    if (s?.kind === 'icone') return SPECIAL_BONUS + (s.level ?? 0);
    return SPECIAL_BONUS;
}

/** Ícone que ainda pode ganhar selo de MVP (até 3, como o Destaque). */
export const iconMvpOpen = (inst: PokemonInstance) =>
    inst.special?.kind === 'icone' && (inst.special.level ?? 0) < DESTAQUE_MAX_LEVEL;

/** Número da semana ISO (1..53) e o ano dela. */
function isoWeek(date: Date): { year: number; week: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7) };
}

/** Tipos que dão evento: só os que têm pelo menos 4 Pokémon entre os disponíveis (na Gen 1 não há Sombrio). */
export const EVENT_TYPES = TYPES.filter((t) => SPECIES.filter((sp) => sp.types.includes(t)).length >= 4);

/** Tipo em evento na semana: gira pelos tipos de EVENT_TYPES, uma semana cada. */
export function weeklyEventType(date: Date): string {
    const { year, week } = isoWeek(date);
    return EVENT_TYPES[(year * 53 + week) % EVENT_TYPES.length];
}

/**
 * Sorteia a edição de uma carta recém-criada (draft/recompensa). Usa um sorteio próprio derivado do uid,
 * então não mexe na sequência do draft e continua determinístico pela seed.
 */
export function rollSpecial(inst: PokemonInstance, eventType: string | null): PokemonInstance {
    if (inst.special) return inst;
    const rng = new Rng(inst.uid, 'special');
    const icon = ICONS[inst.speciesId];
    if (icon && rng.chance(ICON_CHANCE)) return { ...inst, special: { kind: 'icone', title: icon } };
    if (eventType && species(inst.speciesId).types.includes(eventType) && rng.chance(EVENT_CHANCE)) {
        return { ...inst, special: { kind: 'evento', type: eventType } };
    }
    return inst;
}
