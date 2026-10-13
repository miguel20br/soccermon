import { species } from './data';
import { draftOptions } from './draft';
import type { PokemonInstance } from './instance';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import { Rng } from './rng';

/**
 * Recompensa depois de cada vitória da copa (estilo Slay the Spire: 1 de 3 ou pular).
 * Sempre 1 reforço + 2 itens; itens de tipo puxam os tipos do seu time (como o portal do Pokémon Auto Chess).
 */
export type Reward = { kind: 'pokemon'; inst: PokemonInstance } | { kind: 'item'; item: string };

/** Raridade do reforço sobe a cada fase. */
const REINFORCEMENT_ROUND = [3, 5, 6];

export function rewardOptions(seed: string, stage: number, reroll: number, team: readonly PokemonInstance[]): Reward[] {
    const rng = new Rng(seed, `reward-${stage}-r${reroll}`);
    const taken = new Set(team.map((p) => p.speciesId));
    const [inst] = draftOptions(rng, REINFORCEMENT_ROUND[Math.min(stage, 2)], taken, 1, [], 'ANY');

    const teamTypes = [...new Set(team.flatMap((p) => species(p.speciesId).types))];
    const owned = new Set(team.map((p) => p.item).filter(Boolean));
    const typed = teamTypes.map((t) => TYPE_ITEM_FOR[t]).filter((id) => id && !owned.has(id));
    const general = ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type' && !owned.has(id));
    const items = new Set<string>();
    if (typed.length && rng.chance(0.6)) items.add(rng.pick(typed));
    let guard = 0;
    while (items.size < 2 && guard++ < 50) items.add(rng.pick(general.length ? general : ITEM_IDS));

    const options: Reward[] = [...items].map((item) => ({ kind: 'item' as const, item }));
    if (inst) options.splice(rng.int(0, options.length), 0, { kind: 'pokemon', inst });
    return options;
}
