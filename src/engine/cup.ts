import { aiDraftTeam } from './draft';
import { Rng } from './rng';
import type { Tactic, TeamSetup } from './state';

/** Adversários da copa: clubes temáticos de Kanto, cada um puxado para os tipos do ginásio. */
export interface ClubTemplate {
    name: string;
    city: string;
    types: string[];
    tactic: Tactic;
    color: number;
}

export const CLUBS: ClubTemplate[] = [
    { name: 'Pewter Rochedo', city: 'Pewter', types: ['Rock', 'Ground'], tactic: 'defensive', color: 0x9c7b4a },
    { name: 'Cerulean Cascata', city: 'Cerulean', types: ['Water'], tactic: 'balanced', color: 0x3a8ee6 },
    { name: 'Vermilion Voltagem', city: 'Vermilion', types: ['Electric'], tactic: 'counter', color: 0xf2c53d },
    { name: 'Celadon Arco-Íris', city: 'Celadon', types: ['Grass'], tactic: 'balanced', color: 0x58b85c },
    { name: 'Fuchsia Ninjas', city: 'Fuchsia', types: ['Poison'], tactic: 'counter', color: 0xb15fc4 },
    { name: 'Saffron Mentes', city: 'Saffron', types: ['Psychic'], tactic: 'offensive', color: 0xe85d9e },
    { name: 'Cinnabar Vulcão', city: 'Cinnabar', types: ['Fire'], tactic: 'offensive', color: 0xe8553a },
    { name: 'Viridian Terra', city: 'Viridian', types: ['Ground'], tactic: 'balanced', color: 0x6b8f3a },
    { name: 'Lavender Assombro', city: 'Lavender', types: ['Ghost', 'Poison'], tactic: 'defensive', color: 0x7a5fb0 },
    {
        name: 'Liga Índigo',
        city: 'Indigo Plateau',
        types: ['Dragon', 'Ice', 'Fighting', 'Ghost'],
        tactic: 'balanced',
        color: 0x3d3f8f,
    },
];

export const CUP_STAGES = ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const STAGE_DIFFICULTY = [0, 1, 2, 3];

/** Sorteia os 4 adversários da copa (a final é sempre contra a Liga Índigo). */
export function buildCupOpponents(seed: number | string): TeamSetup[] {
    const rng = new Rng(seed, 'cup');
    const gyms = rng.shuffle(CLUBS.filter((c) => c.city !== 'Indigo Plateau'));
    const clubs = [gyms[0], gyms[1], gyms[2], CLUBS[CLUBS.length - 1]];
    return clubs.map((club, stage) => {
        const d = aiDraftTeam(rng, STAGE_DIFFICULTY[stage], club.types);
        return { name: club.name, lineup: d.lineup, bench: d.bench, tactic: club.tactic, color: club.color };
    });
}
