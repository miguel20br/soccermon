import type { Prize } from './cup-map';
import { species } from './data';
import { draftOptions } from './draft';
import { createInstance, type PokemonInstance, viewInstance } from './instance';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import { Rng } from './rng';
import { rollTmOffer, rollTmOffers, TM_REWARD_CHANCE } from './tm';

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

/** Copa longa: a casa do mapa e o que ela promete. */
export interface LongReward {
    /** Chave própria do sorteio (a casa do mapa). */
    key: string;
    /** Raridade do reforço pelo andar. */
    round: number;
    /** Prêmio do Jogo à vista no mapa, ou o Ginásio (a carta do líder e a MT dele). Sem = a recompensa de sempre. */
    prize?: Exclude<Prize, 'money'> | 'gym';
    /** Tipos do ramo: reforço e item de tipo puxam eles. */
    types?: readonly string[];
    /** Espécie da carta do líder (Ginásio). */
    ace?: number;
    /** Espécie que vem garantida (o pássaro lendário vencido). */
    boss?: number;
    /** Item que vem garantido (o da Equipe Rocket vencida). */
    loot?: string | null;
}

/** As recompensas de um prêmio à vista: 3 do que ele promete (+ `extra` itens). */
function prizeOptions(
    rng: Rng,
    tmRng: Rng,
    stage: number,
    team: readonly PokemonInstance[],
    defeated: { name: string; players: readonly PokemonInstance[] } | undefined,
    extra: number,
    long: LongReward & { prize: NonNullable<LongReward['prize']> },
): Reward[] {
    const taken = new Set(team.map((p) => p.speciesId));
    const owned = new Set(team.map((p) => p.item).filter(Boolean));
    const fromRival = (n: number): Reward[] =>
        [...(defeated?.players ?? [])]
            .filter((p) => !taken.has(p.speciesId))
            .sort((a, b) => viewInstance(b).overall - viewInstance(a).overall)
            .slice(0, n)
            .map((p) => ({
                kind: 'pokemon',
                inst: { ...p, uid: `${p.uid}-c${stage}`, item: null },
                from: defeated!.name,
            }));
    const typed = [...new Set([...(long.types ?? []), ...team.flatMap((p) => species(p.speciesId).types)])]
        .map((t) => TYPE_ITEM_FOR[t])
        .filter((id): id is string => !!id && !owned.has(id));
    const general = ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type' && !owned.has(id));
    const items = (n: number, typedFirst: boolean): Reward[] => {
        const pool = typedFirst
            ? [...rng.shuffle([...typed]), ...rng.shuffle([...general])]
            : rng.shuffle([...general]);
        return pool.slice(0, n).map((item) => ({ kind: 'item', item }));
    };
    let out: Reward[];
    if (long.prize === 'pokemon') {
        out = fromRival(3);
        const more = draftOptions(
            rng,
            long.round,
            new Set([...taken, ...out.flatMap((r) => (r.kind === 'pokemon' ? [r.inst.speciesId] : []))]),
            3 - out.length,
            long.types ?? [],
            'ANY',
        );
        out.push(...more.map((inst) => ({ kind: 'pokemon' as const, inst, from: null })));
    } else if (long.prize === 'item') out = items(3, true);
    else if (long.prize === 'tm') {
        out = rollTmOffers(tmRng, team, 3, defeated?.name).map((o) => ({ kind: 'tm' as const, ...o }));
        out.push(...items(3 - out.length, true));
    } else {
        // Ginásio: a carta do líder (se você ainda não tem a espécie), a MT dele e um item de tipo
        const ace =
            long.ace !== undefined && !taken.has(long.ace)
                ? [
                      {
                          kind: 'pokemon' as const,
                          inst: { ...createInstance(long.ace, rng), uid: `ace-${long.ace}-${long.key}` },
                          from: defeated?.name ?? null,
                      },
                  ]
                : fromRival(1);
        const tm = rollTmOffers(tmRng, team, 1, defeated?.name).map((o) => ({ kind: 'tm' as const, ...o }));
        out = [...ace, ...tm, ...items(3 - ace.length - tm.length, true)];
    }
    return [...out, ...items(extra, false)];
}

export function rewardOptions(
    seed: string,
    stage: number,
    reroll: number,
    team: readonly PokemonInstance[],
    defeated?: { name: string; players: readonly PokemonInstance[] },
    /** Opções a mais (Patrocínio Laboratório de Cinnabar: 4 em vez de 3), sempre itens. */
    extra = 0,
    /** Copa longa: a casa do mapa (sorteio, raridade, prêmio). Sem = Copa rápida. */
    long?: LongReward,
): Reward[] {
    const rng = new Rng(seed, long ? `reward-${long.key}-r${reroll}` : `reward-${stage}-r${reroll}`);
    const options = baseOptions(rng, seed, stage, reroll, team, defeated, extra, long);
    // desafio de evento vencido: o pássaro lendário e o item da Equipe Rocket vêm garantidos, no lugar do último
    const boss = long?.boss !== undefined && defeated?.players.find((p) => p.speciesId === long.boss);
    const sure: Reward[] = [
        ...(boss && !team.some((p) => p.speciesId === long?.boss)
            ? [
                  {
                      kind: 'pokemon' as const,
                      inst: { ...boss, uid: `${boss.uid}-c${stage}`, item: null },
                      from: defeated!.name,
                  },
              ]
            : []),
        ...(long?.loot ? [{ kind: 'item' as const, item: long.loot }] : []),
    ];
    return sure.length ? [...sure, ...options.slice(0, Math.max(1, options.length - sure.length))] : options;
}

function baseOptions(
    rng: Rng,
    seed: string,
    stage: number,
    reroll: number,
    team: readonly PokemonInstance[],
    defeated: { name: string; players: readonly PokemonInstance[] } | undefined,
    extra: number,
    long: LongReward | undefined,
): Reward[] {
    const tmKey = long ? `reward-tm-${long.key}-r${reroll}` : `reward-tm-${stage}-r${reroll}`;
    if (long?.prize)
        return prizeOptions(rng, new Rng(seed, tmKey), stage, team, defeated, extra, { ...long, prize: long.prize });
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
        const [inst] = draftOptions(
            rng,
            long?.round ?? REINFORCEMENT_ROUND[Math.min(stage, 2)],
            taken,
            1,
            long?.types ?? [],
            'ANY',
        );
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
    const tmRng = new Rng(seed, tmKey);
    const offer = tmRng.chance(TM_REWARD_CHANCE) ? rollTmOffer(tmRng, team, defeated?.name) : null;
    const last = options.map((o) => o.kind).lastIndexOf('item');
    if (offer && last >= 0) options[last] = { kind: 'tm', ...offer };
    return options;
}
