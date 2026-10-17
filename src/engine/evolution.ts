import type { Position } from './attributes';
import { SPECIES, species } from './data';
import { type PokemonInstance, slotRating } from './instance';
import type { PlayerStats } from './state';
import { movesAfterEvolution } from './tm';

/**
 * Evolução no meio da partida: o Pokémon que joga muito acima do normal para a posição dele evolui na
 * próxima bola parada ("X está evoluindo!"), e a evolução vale para o resto da copa.
 *
 * Um gol ou uma defesa sozinhos não bastam: a "barra" junta tudo o que ele fez na partida, com peso por
 * posição (o Fixo desarma e distribui, o goleiro defende, o Pivô finaliza), para que todas as posições
 * evoluam com frequência parecida.
 */
const POINTS: Partial<Record<keyof PlayerStats, number>> = {
    goals: 4,
    assists: 3,
    shotsOnTarget: 1,
    saves: 1.5,
    tacklesWon: 1.2,
    interceptions: 0.6,
    passesCompleted: 0.1,
    movesUsed: 0.5,
};

/** Normaliza pelo que cada posição costuma produzir numa partida (scripts/evo-report.ts). */
const ROLE_SCALE: Record<Position, number> = { GK: 1.5, FIXO: 3.5, ALA: 0.7, PIVO: 0.5 };

/**
 * Pontos para evoluir. O seu time acumula a barra entre as partidas da copa (`PokemonInstance.evo`), então o
 * limiar é mais alto (decidido com o Miguel em 16/10/2026: ~1,24 evolução por copa, era ~1; 15 → 14 no Bloco 2 do
 * balanceamento, 17/10, com a promessa no draft: ~1,2 por copa para quem escolhe pela nota evoluída). O rival não acumula
 * e continua com o limiar de uma partida só (~1 em cada 4 que podem evoluir chega lá).
 */
export const EVO_THRESHOLD = 14;
export const RIVAL_EVO_THRESHOLD = 10;

/** Barra de evolução agora: o que ele trouxe das partidas anteriores + o que fez nesta. */
export const evoProgress = (inst: PokemonInstance, stats: PlayerStats, role: Position) =>
    (inst.evo ?? 0) + evoScore(stats, role);
export const evoNeeded = (team: 0 | 1) => (team === 0 ? EVO_THRESHOLD : RIVAL_EVO_THRESHOLD);

export function evoScore(stats: PlayerStats, role: Position): number {
    let total = 0;
    for (const [k, w] of Object.entries(POINTS) as [keyof PlayerStats, number][]) total += stats[k] * w;
    return total * ROLE_SCALE[role];
}

const MAX_ID = SPECIES.length;

/** Para quem o Pokémon evolui (só para espécies do jogo); várias opções (Eevee) → fixo pelo uid. */
export function evolutionTarget(speciesId: number, uid: string): number | null {
    const options = species(speciesId).evolvesTo.filter((e) => e.id <= MAX_ID);
    if (!options.length) return null;
    let h = 0;
    for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return options[h % options.length].id;
}

/**
 * Nota na vaga depois de evoluir: o que o selo da carta mostra ("vira 85"). Carta = campo: a forma nova
 * continua na mesma vaga, com a mesma edição especial. null se não evolui (ou é o Ditto).
 */
export function evolvedRating(inst: PokemonInstance, role: Position | 'ANY'): { into: number; rating: number } | null {
    if (inst.ability === 'imposter') return null;
    const into = evolutionTarget(inst.speciesId, inst.uid);
    if (into === null) return null;
    return { into, rating: slotRating(evolveInstance(inst, into, role === 'ANY' ? undefined : role), role) };
}

/**
 * A instância depois de evoluir: golpes da nova forma (mantendo os ensinados por MT, se a forma nova aprende),
 * habilidade mantida se a nova forma tiver. `role`: a vaga em que ele jogava, que a forma nova herda como
 * secundária (auditoria de posições, 17/10/2026).
 */
export function evolveInstance(inst: PokemonInstance, into: number, role?: Position): PokemonInstance {
    const sp = species(into);
    const ability = inst.ability === 'imposter' || sp.abilities.includes(inst.ability) ? inst.ability : sp.abilities[0];
    const { moves, taught } = movesAfterEvolution(inst, sp);
    const out: PokemonInstance = { ...inst, speciesId: into, moves, ability };
    if (taught.length) out.taught = taught;
    else delete out.taught;
    if (role && !inst.inherited?.includes(role)) out.inherited = [...(inst.inherited ?? []), role];
    return out;
}
