import type { Tier } from '../engine/data';
import type { Edition } from '../engine/specials';

/**
 * Cor da raridade: a mesma em todo o jogo (moldura da carta, vaga na formação, VERSUS…),
 * pra bater o olho e saber. Branco, verde, azul, roxo, laranja.
 */
export const RARITY: Record<Tier, { label: string; color: string; dark: string }> = {
    common: { label: 'Comum', color: '#f4f4f4', dark: '#9a9aa6' },
    uncommon: { label: 'Incomum', color: '#3ddc6a', dark: '#1d8a3c' },
    rare: { label: 'Raro', color: '#3a8dff', dark: '#1d4fa8' },
    epic: { label: 'Épico', color: '#a45cff', dark: '#5f2aa8' },
    legendary: { label: 'Lendário', color: '#ff8a1c', dark: '#a8520a' },
};

/** Edições especiais: nome da faixa e acabamento holográfico. */
export const EDITION: Record<Edition, { label: string; finish: 'gold' | 'rainbow' | 'cosmos' | 'radiant' }> = {
    shiny: { label: 'Shiny', finish: 'gold' },
    destaque: { label: 'Destaque', finish: 'rainbow' },
    icone: { label: 'Ícone', finish: 'cosmos' },
    evento: { label: 'Evento', finish: 'radiant' },
};
