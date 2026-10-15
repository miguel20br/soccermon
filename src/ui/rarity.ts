import type { Tier } from '../engine/data';
import type { Edition } from '../engine/specials';
import { dict } from '../i18n';

/**
 * Qualidade da carta = metal pela nota (padrão FIFA): bronze até 64, prata de 65 a 74, ouro 75+.
 * A raridade do Pokémon muda o acabamento: comum/incomum = fosco, raro/épico = brilhante,
 * lendário = carta própria (creme e dourado). Edições especiais têm visual próprio.
 */
export type Metal = 'bronze' | 'prata' | 'ouro';
export type Finish = 'fosco' | 'brilhante' | 'lendario';

export const METAL: Record<Metal, { label: string; color: string }> = {
    bronze: { label: 'Bronze', color: '#c98a52' },
    prata: { label: 'Prata', color: '#c9ced8' },
    ouro: { label: 'Ouro', color: '#e8c24a' },
};

export function metalOf(overall: number): Metal {
    return overall >= 75 ? 'ouro' : overall >= 65 ? 'prata' : 'bronze';
}

export function finishOf(tier: Tier): Finish {
    return tier === 'legendary' ? 'lendario' : tier === 'rare' || tier === 'epic' ? 'brilhante' : 'fosco';
}

export const FINISH_LABEL: Record<Finish, string> = {
    fosco: 'Comum',
    brilhante: 'Raro',
    lendario: 'Lendário',
};

/** Cor da raridade (usada na galeria antiga e no laboratório). */
export const RARITY: Record<Tier, { label: string; color: string; dark: string }> = {
    common: { label: 'Comum', color: '#f4f4f4', dark: '#9a9aa6' },
    uncommon: { label: 'Incomum', color: '#3ddc6a', dark: '#1d8a3c' },
    rare: { label: 'Raro', color: '#3a8dff', dark: '#1d4fa8' },
    epic: { label: 'Épico', color: '#a45cff', dark: '#5f2aa8' },
    legendary: { label: 'Lendário', color: '#ff8a1c', dark: '#a8520a' },
};

/** Edições especiais: nome e acabamento holográfico. */
export const EDITION: Record<Edition, { label: string; finish: 'gold' | 'rainbow' | 'cosmos' | 'radiant' }> = {
    shiny: { label: 'Shiny', finish: 'gold' },
    destaque: { label: 'Destaque', finish: 'rainbow' },
    icone: { label: 'Ícone', finish: 'cosmos' },
    evento: { label: 'Evento', finish: 'radiant' },
};

// Rótulos no idioma do jogo (os objetos acima guardam o texto em português, para quem ainda usa).
export const metalLabel = (m: Metal) => dict().common.metal[m];
export const finishLabel = (f: Finish) => dict().common.finish[f];
export const tierLabel = (tier: Tier) => dict().common.tier[tier];
export const editionLabel = (e: Edition) => dict().common.edition[e];
