import type { Position } from './attributes';
import { species } from './data';
import type { PokemonInstance } from './instance';

/**
 * Patrocínios (docs/planos/copa-roguelike-plano.md): os "Jokers" da copa. Comprados no Mercado, valem a copa inteira,
 * até 3 por copa. Nomes de lugares e empresas de Kanto (nunca marca de verdade). Três famílias:
 * - economia: mexem no ₽ (src/engine/shop.ts);
 * - recompensa: mexem no Mercado e na recompensa grátis;
 * - campo: bônus de atributo em campo, pela regra única de bônus (src/engine/modifiers.ts, origem 'patrocinio').
 */
export const SPONSOR_IDS = [
    'fanclube',
    'cassino',
    'ssanne',
    'loja',
    'cinnabar',
    'creche',
    'safari',
    'silph',
    'bicicletaria',
    'academia',
    'torcida',
    'master',
] as const;
export type SponsorId = (typeof SPONSOR_IDS)[number];
export type SponsorFamily = 'economia' | 'recompensa' | 'campo';

export const SPONSOR_FAMILY: Record<SponsorId, SponsorFamily> = {
    fanclube: 'economia',
    cassino: 'economia',
    ssanne: 'economia',
    loja: 'economia',
    cinnabar: 'recompensa',
    creche: 'recompensa',
    safari: 'recompensa',
    silph: 'campo',
    bicicletaria: 'campo',
    academia: 'campo',
    torcida: 'campo',
    master: 'campo',
};

/** Vagas de Patrocínio por copa (como os Jokers do Balatro). */
export const MAX_SPONSORS = 3;

export const isSponsorId = (v: unknown): v is SponsorId => SPONSOR_IDS.includes(v as SponsorId);
export const has = (sponsors: readonly string[] | undefined, id: SponsorId) => !!sponsors?.includes(id);

/** Bônus de campo de um Patrocínio pra este Pokémon (soma em pontos, como edição e evolução). */
export interface SponsorBonus {
    id: SponsorId;
    attrs: 'all' | ('pace' | 'passing' | 'strength')[];
    add: number;
}

/**
 * Os bônus de campo que este Pokémon recebe dos Patrocínios do time. `captain` = o capitão em campo (Silph Co. olha
 * o tipo dele; o Patrocínio Master dá o bônus a ele).
 */
export function sponsorBonuses(
    inst: PokemonInstance,
    sponsors: readonly string[] | undefined,
    captain: PokemonInstance | null | undefined,
    role: Position | null | undefined,
): SponsorBonus[] {
    if (!sponsors?.length) return [];
    const out: SponsorBonus[] = [];
    const types = species(inst.speciesId).types;
    if (has(sponsors, 'silph') && captain) {
        const cap = species(captain.speciesId).types;
        if (types.some((t) => cap.includes(t))) out.push({ id: 'silph', attrs: 'all', add: 3 });
    }
    if (has(sponsors, 'bicicletaria') && role === 'ALA') out.push({ id: 'bicicletaria', attrs: ['pace'], add: 4 });
    if (has(sponsors, 'academia')) out.push({ id: 'academia', attrs: ['passing'], add: 4 });
    if (has(sponsors, 'torcida') && (role === 'FIXO' || role === 'GK'))
        out.push({ id: 'torcida', attrs: ['strength'], add: 3 });
    // +2, e mais +1 por cada outro Patrocínio do time
    if (has(sponsors, 'master') && captain?.uid === inst.uid)
        out.push({
            id: 'master',
            attrs: 'all',
            add: 2 + sponsors.filter((s) => s !== 'master' && isSponsorId(s)).length,
        });
    return out;
}
