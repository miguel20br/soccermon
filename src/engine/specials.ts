import { SPECIES, species, TYPES } from './data';
import type { PokemonInstance } from './instance';
import { Rng } from './rng';

/**
 * Cartas especiais (edições), em camadas (0.8.8, aprovado pelo Miguel em 19/10/2026): a carta tem no máximo uma
 * edição base (Ícone, Evento ou Destaque) e o shiny vai por cima de qualquer uma. Bônus: edição base +2, shiny
 * +1 junto de outra edição (sozinho é +2), MVP +1 por nível (o 1º MVP de uma carta comum é o próprio Destaque).
 * Sem teto: o único limite é o atributo não passar de 99 (`withBonus`). O máximo hoje é +6 (shiny Ícone MVP 3).
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
     * Destaque: nível 1–3 (o craque que segue jogando muito sobe de nível: +2, +3, +4; é o selo MVP 1–3).
     * Ícone e Evento: quantos MVPs a carta já levou (0–3, selo "MVP n"): +1 por MVP em cima dos +2 da edição.
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

/** O tipo que pinta a carta: o do evento na carta Evento, senão o 1º tipo do Pokémon. */
export function cardTypeOf(inst: Pick<PokemonInstance, 'speciesId' | 'special'>): string {
    return inst.special?.kind === 'evento' && inst.special.type ? inst.special.type : species(inst.speciesId).types[0];
}

export const DESTAQUE_MAX_LEVEL = 3;
/** Nota mínima na partida pra um Destaque subir de nível (senão o prêmio vai pro próximo craque). */
export const DESTAQUE_LEVEL_UP_RATING = 8;

/** Nível do selo MVP (0–3): o Destaque já nasce MVP 1; Ícone e Evento contam os MVPs que levaram. */
export function mvpLevel(inst: PokemonInstance): number {
    const s = inst.special;
    if (!s) return 0;
    return s.kind === 'destaque' ? (s.level ?? 1) : (s.level ?? 0);
}

/** Edição base +2, shiny +1 junto de outra edição (sozinho +2), MVP +1 por nível. */
export function specialBonus(inst: PokemonInstance): number {
    const s = inst.special;
    if (!s) return inst.shiny ? SPECIAL_BONUS : 0;
    const mvp = s.kind === 'destaque' ? mvpLevel(inst) - 1 : mvpLevel(inst);
    return SPECIAL_BONUS + mvp + (inst.shiny ? 1 : 0);
}

/** Ícone ou Evento que ainda pode ganhar selo de MVP (até 3, como o Destaque). */
export const mvpOpen = (inst: PokemonInstance) =>
    (inst.special?.kind === 'icone' || inst.special?.kind === 'evento') &&
    (inst.special.level ?? 0) < DESTAQUE_MAX_LEVEL;

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
