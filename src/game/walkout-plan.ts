import encounters from '../data/kanto-encounters.json';
import { species } from '../engine/data';

/**
 * Plano do walkout em 3 níveis (docs/planos/pesquisas/ut-walkout.md, decidido com o Miguel em 02/11/2026): quem ganha
 * qual nível, o jeito de entrar em campo e a pista "onde vive". Puro (sem Phaser): a cena do laboratório
 * `?lab=walkout&motor=phaser` e o teste leem daqui.
 */
export type WalkTier = 'raro' | 'muitoraro' | 'especial';

/** Raro = ouro 75–84; muito raro = ouro 85+, Shiny ou Evento; especial = Ícone ou Destaque. Abaixo de 75, nada. */
export function walkTier(edition: string | null, overall: number): WalkTier | null {
    if (edition === 'icone' || edition === 'destaque') return 'especial';
    if (edition === 'shiny' || edition === 'evento' || overall >= 85) return 'muitoraro';
    return overall >= 75 ? 'raro' : null;
}

/** Duração de cada nível (ms) até o Continuar. */
export const WALK_MS: Record<WalkTier, number> = { raro: 4000, muitoraro: 7000, especial: 10500 };
/** Pular aparece depois do 1º segundo (a prévia de cor ninguém perde). */
export const WALK_SKIP_AT = 1000;
/** Reduzir movimento: fade pra cor, carta parada, grito; Continuar em ~1,2 s. */
export const WALK_REDUCED_MS = 1200;

export type Entry = 'voa' | 'quica' | 'corre' | 'anda' | 'aparece';

/** O jeito de entrar em campo: Fantasma aparece, quem voa (asas ou Voador) voa, bola/gosma/peixe quica, rápido corre. */
export function entryOf(speciesId: number): Entry {
    const sp = species(speciesId);
    if (sp.types.includes('Ghost')) return 'aparece';
    if (sp.shape === 'wings' || sp.shape === 'bug-wings' || sp.types.includes('Flying')) return 'voa';
    if (sp.shape === 'ball' || sp.shape === 'blob' || sp.shape === 'fish') return 'quica';
    return sp.baseStats.spe >= 95 ? 'corre' : 'anda';
}

type Areas = Record<string, { name: string; mons: [number, string, ...unknown[]][] }>;
const AREAS = (encounters as unknown as { areas: Areas }).areas;

/** Onde a espécie (ou a forma de antes, pra quem só vem de evolução) aparece em Kanto; rota primeiro. */
export function homeOf(speciesId: number, pt = true): string {
    for (let id: number | null = speciesId; id; id = species(id).prevo) {
        const names = Object.values(AREAS)
            .filter((a) => a.mons.some((m) => m[0] === id))
            // a PokeAPI chama rota de "Road"; o andar e o lado ("(B1F)", "(north, …)") não cabem na placa
            .map((a) => a.name.replace(/\s*\(.*\)$/, '').replace(/^Road (\d+)$/, pt ? 'Rota $1' : 'Route $1'));
        if (!names.length) continue;
        return names.find((n) => /^(Rota|Route) \d+$/.test(n)) ?? names.find((n) => !/City|Town/.test(n)) ?? names[0];
    }
    return 'Kanto';
}
