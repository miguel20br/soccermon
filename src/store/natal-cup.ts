import { species } from '../engine/data';
import { aiPick, BENCH_SIZE } from '../engine/draft';
import { formationOf } from '../engine/formations';
import { createInstance, type PokemonInstance } from '../engine/instance';
import { ITEMS, RIVAL_ITEM_IDS, TYPE_ITEM_FOR } from '../engine/items';
import { Rng } from '../engine/rng';
import type { TeamSetup } from '../engine/state';

/**
 * Copa de Natal (docs/planos/natal.md §2.1): nos dias 24 e 25/12 (Brasília) a Copa do Dia troca os Pokémon dos rivais
 * por Gelo (Seel, Dewgong, Cloyster, Lapras e, na final, Articuno) e a final tem o Snorlax de capitão. Clubes, técnicos,
 * formações e itens continuam os da Copa. Só dado de time: nada no motor. `?natal=copa` força nos dias de dev e prévia.
 */
export const NATAL_CUP_DAYS: readonly string[] = ['2026-12-24', '2026-12-25'];
export const NATAL_TITLE = 'natal2026';

const forced =
    typeof window !== 'undefined' &&
    import.meta.env.MODE !== 'test' &&
    __SMOKE__ &&
    new URLSearchParams(window.location.search).get('natal') === 'copa';

export const isNatalCup = (day: string, force = forced): boolean => force || NATAL_CUP_DAYS.includes(day);

const [SEEL, DEWGONG, SHELLDER, CLOYSTER, LAPRAS, SNORLAX, ARTICUNO] = [86, 87, 90, 91, 131, 143, 144];
/** Titulares e reservas de cada fase (sobram poucos de Gelo na Gen 1: o resto é Água de frio). */
const SQUADS: { start: number[]; bench: number[] }[] = [
    { start: [SEEL, SHELLDER, 79, 120, 116], bench: [DEWGONG, 61] },
    { start: [SEEL, DEWGONG, SHELLDER, 120, 79], bench: [CLOYSTER, 116] },
    { start: [DEWGONG, CLOYSTER, LAPRAS, SEEL, 120], bench: [SHELLDER, 79] },
    { start: [SNORLAX, ARTICUNO, LAPRAS, DEWGONG, CLOYSTER], bench: [SEEL, SHELLDER] },
];

/** Troca só os Pokémon dos 4 rivais da Copa (mesma ordem de buildCupOpponents) pelo time de Gelo da fase. */
export function natalOpponents(base: TeamSetup[], seed: string): TeamSetup[] {
    return base.map((opp, stage) => {
        const rng = new Rng(seed, `natal-${stage}`);
        const squad = SQUADS[stage];
        const mk = (id: number) => createInstance(id, rng);
        const left = squad.start.map(mk);
        const lineup: PokemonInstance[] = [];
        for (const need of formationOf(opp.formation).slots) {
            const p = aiPick(rng, left, need);
            left.splice(left.indexOf(p), 1);
            lineup.push(p);
        }
        const bench = squad.bench.slice(0, BENCH_SIZE).map(mk);
        const snorlax = lineup.find((p) => p.speciesId === SNORLAX);
        // um item por Pokémon de ponta (1 nas fases iniciais, 3 na final), como a Copa
        for (const h of rng.shuffle([...lineup]).slice(0, stage >= 3 ? 3 : 1)) {
            const own = species(h.speciesId).types.flatMap((t) => TYPE_ITEM_FOR[t] ?? []);
            h.item = rng.pick([...RIVAL_ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type'), ...own]);
        }
        return { ...opp, lineup, bench, captainUid: snorlax?.uid ?? lineup[0].uid };
    });
}

/** Ganhou a Copa de Natal em qualquer um dos dois dias: o título "Natal 2026". */
export const natalCupWon = (daily: { day: string; champion: boolean }[]): boolean =>
    NATAL_CUP_DAYS.some((d) => daily.some((e) => e.day === d && e.champion));
