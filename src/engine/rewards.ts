import { species } from './data';
import { draftOptions } from './draft';
import { type PokemonInstance, viewInstance } from './instance';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import { Rng } from './rng';
import { rollTmOffer, TM_REWARD_CHANCE } from './tm';

/**
 * Recompensa depois de cada vitória da copa (estilo Slay the Spire: 1 de 3 ou pular).
 * - "Contratar do adversário": um dos melhores Pokémon do time que você acabou de eliminar;
 * - 2 itens (itens de tipo puxam os tipos do seu time, como o portal do Pokémon Auto Chess);
 * - em ~metade das vezes, um dos itens vira uma MT (src/engine/tm.ts): a do ginásio vencido ou uma do baú raro.
 * Se não houver ninguém contratável, entra um reforço sorteado no lugar.
 */
export type Reward =
    | { kind: 'pokemon'; inst: PokemonInstance; from: string | null }
    | { kind: 'item'; item: string }
    | { kind: 'tm'; move: string; leader: string | null };

/** Raridade do reforço sorteado sobe a cada fase. */
const REINFORCEMENT_ROUND = [3, 5, 6];

export function rewardOptions(
    seed: string,
    stage: number,
    reroll: number,
    team: readonly PokemonInstance[],
    defeated?: { name: string; players: readonly PokemonInstance[] },
    /** Opções a mais (Patrocínio Laboratório de Cinnabar: 4 em vez de 3), sempre itens. */
    extra = 0,
    /** Copa longa: chave própria do sorteio (casa do mapa) e raridade do reforço pelo andar. Sem = Copa rápida. */
    long?: { key: string; round: number },
): Reward[] {
    const rng = new Rng(seed, long ? `reward-${long.key}-r${reroll}` : `reward-${stage}-r${reroll}`);
    const taken = new Set(team.map((p) => p.speciesId));

    let pokemon: Reward | null = null;
    const signable = (defeated?.players ?? []).filter((p) => !taken.has(p.speciesId));
    if (defeated && signable.length) {
        // um dos 3 melhores do adversário (sem o item dele)
        const top = [...signable].sort((a, b) => viewInstance(b).overall - viewInstance(a).overall).slice(0, 3);
        const star = rng.pick(top);
        const inst: PokemonInstance = { ...star, uid: `${star.uid}-c${stage}`, item: null };
        pokemon = { kind: 'pokemon', inst, from: defeated.name };
    } else {
        const [inst] = draftOptions(rng, long?.round ?? REINFORCEMENT_ROUND[Math.min(stage, 2)], taken, 1, [], 'ANY');
        if (inst) pokemon = { kind: 'pokemon', inst, from: null };
    }

    const teamTypes = [...new Set(team.flatMap((p) => species(p.speciesId).types))];
    const owned = new Set(team.map((p) => p.item).filter(Boolean));
    const typed = teamTypes.map((t) => TYPE_ITEM_FOR[t]).filter((id) => id && !owned.has(id));
    const general = ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type' && !owned.has(id));
    const items = new Set<string>();
    if (typed.length && rng.chance(0.6)) items.add(rng.pick(typed));
    let guard = 0;
    while (items.size < 2 + extra && guard++ < 50) items.add(rng.pick(general.length ? general : ITEM_IDS));

    const options: Reward[] = [...items].map((item) => ({ kind: 'item' as const, item }));
    if (pokemon) options.splice(rng.int(0, options.length), 0, pokemon);

    // MT no lugar do último item; sorteio à parte para não mudar o reforço e os itens da mesma seed
    const tmRng = new Rng(seed, long ? `reward-tm-${long.key}-r${reroll}` : `reward-tm-${stage}-r${reroll}`);
    const offer = tmRng.chance(TM_REWARD_CHANCE) ? rollTmOffer(tmRng, team, defeated?.name) : null;
    const last = options.map((o) => o.kind).lastIndexOf('item');
    if (offer && last >= 0) options[last] = { kind: 'tm', ...offer };
    return options;
}
