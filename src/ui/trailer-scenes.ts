import { createInstance, type PokemonInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import type { TeamSetup } from '../engine/state';

/**
 * Cenas do trailer (docs/planos/trailer-plano.md): o time de cada cena é fixo e a seed da copa escolhe a partida.
 * Módulo puro: usado pela caça de lances em Node (scripts/trailer-hunt.ts) e pelo atalho de dev
 * `?demo=trailer&cena=...&seed=...` (dev-demo.ts), então as duas pontas simulam exatamente a mesma partida.
 */
export const TRAILER_SCENES = {
    // iniciais: alguém evolui cedo (gancho)
    evolucao: { lineup: [74, 7, 4, 1, 25], bench: [] },
    // golpes especiais virando gol: Snorlax no gol, Charizard, Jolteon, Gyarados, Mewtwo
    golpe: { lineup: [143, 6, 135, 130, 150], bench: [] },
    // golpe do Charizard que para numa defesaça ou na trave (o time da cena golpe)
    defesa: { lineup: [143, 6, 135, 130, 150], bench: [] },
    // trailer 2: tudo na mesma partida: golpe do Charizard que para na defesa, Pikachu (capitão) evolui e o Raichu marca
    partida: { lineup: [143, 6, 135, 7, 25], bench: [] },
    // jogada trabalhada (troca de passes até o gol)
    jogada: { lineup: [143, 68, 25, 136, 150], bench: [] },
    // Ditto copia o melhor em campo + combo Gênese (Mew + Mewtwo)
    ditto: { lineup: [143, 68, 151, 132, 150], bench: [4, 25] },
    // Pikachu (capitão) marcando com Thunder/Thunderbolt
    raio: { lineup: [143, 68, 135, 6, 25], bench: [] },
    // pênaltis decididos na última cobrança
    penaltis: { lineup: [143, 68, 151, 142, 150], bench: [149, 25] },
} as const satisfies Record<string, { lineup: readonly number[]; bench: readonly number[] }>;

export type TrailerScene = keyof typeof TRAILER_SCENES;

export const isTrailerScene = (s: string | null): s is TrailerScene => !!s && s in TRAILER_SCENES;

/** Pokémon da cena (mesmos uids nas duas pontas: vêm da mesma Rng). O capitão é o último titular. */
export function trailerPicks(scene: TrailerScene, seed: string) {
    const rng = new Rng(`trailer-${scene}-${seed}`, 'time');
    const def = TRAILER_SCENES[scene];
    const lineup: PokemonInstance[] = def.lineup.map((id) => createInstance(id, rng));
    const bench: PokemonInstance[] = def.bench.map((id) => createInstance(id, rng));
    return { lineup, bench, captainUid: lineup[lineup.length - 1].uid };
}

/** O TeamSetup que `playerTeam(run)` monta para essa cena (formação Losango, tática equilibrada). */
export function trailerTeam(scene: TrailerScene, seed: string, name: string, color: number): TeamSetup {
    const { lineup, bench, captainUid } = trailerPicks(scene, seed);
    return { name, lineup, bench, tactic: 'balanced', color, formation: '1-2-1', captainUid, manualSubs: true };
}
