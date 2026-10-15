import { aiDraftTeam } from './draft';
import type { FormationId } from './formations';
import { ITEM_IDS } from './items';
import { Rng } from './rng';
import type { Tactic, TeamSetup } from './state';
import { equipRivalTms } from './tm';

/** Adversários da copa: clubes temáticos de Kanto, cada um puxado para os tipos do ginásio. */
export interface ClubTemplate {
    name: string;
    city: string;
    types: string[];
    tactic: Tactic;
    color: number;
    formation: FormationId;
}

export const CLUBS: ClubTemplate[] = [
    {
        name: 'Pewter Rochedo',
        city: 'Pewter',
        types: ['Rock', 'Ground'],
        tactic: 'defensive',
        color: 0x9c7b4a,
        formation: 'ferrolho',
    },
    {
        name: 'Cerulean Cascata',
        city: 'Cerulean',
        types: ['Water'],
        tactic: 'balanced',
        color: 0x3a8ee6,
        formation: '1-2-1',
    },
    {
        name: 'Vermilion Voltagem',
        city: 'Vermilion',
        types: ['Electric'],
        tactic: 'counter',
        color: 0xf2c53d,
        formation: '1-1-2',
    },
    {
        name: 'Celadon Arco-Íris',
        city: 'Celadon',
        types: ['Grass'],
        tactic: 'balanced',
        color: 0x58b85c,
        formation: '1-2-1',
    },
    {
        name: 'Fuchsia Ninjas',
        city: 'Fuchsia',
        types: ['Poison'],
        tactic: 'counter',
        color: 0xb15fc4,
        formation: '2-2',
    },
    {
        name: 'Saffron Mentes',
        city: 'Saffron',
        types: ['Psychic'],
        tactic: 'offensive',
        color: 0xe85d9e,
        formation: '4-0',
    },
    {
        name: 'Cinnabar Vulcão',
        city: 'Cinnabar',
        types: ['Fire'],
        tactic: 'offensive',
        color: 0xe8553a,
        formation: '1-1-2',
    },
    {
        name: 'Viridian Terra',
        city: 'Viridian',
        types: ['Ground'],
        tactic: 'balanced',
        color: 0x6b8f3a,
        formation: '3-1',
    },
    {
        name: 'Lavender Assombro',
        city: 'Lavender',
        types: ['Ghost', 'Poison'],
        tactic: 'defensive',
        color: 0x7a5fb0,
        formation: '3-1',
    },
    {
        name: 'Liga Índigo',
        city: 'Indigo Plateau',
        types: ['Dragon', 'Ice', 'Fighting', 'Ghost'],
        tactic: 'balanced',
        color: 0x3d3f8f,
        formation: '1-2-1',
    },
];

export const CUP_STAGES = ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const STAGE_DIFFICULTY = [0, 1, 2, 3];

/**
 * Sorteia os 4 adversários da copa (a final é sempre contra a Liga Índigo). Cada clube entra com a MT do
 * líder do ginásio em quem aprende (sorteio à parte, para não mudar os times da mesma seed).
 */
export function buildCupOpponents(seed: number | string): TeamSetup[] {
    const rng = new Rng(seed, 'cup');
    const gyms = rng.shuffle(CLUBS.filter((c) => c.city !== 'Indigo Plateau'));
    const clubs = [gyms[0], gyms[1], gyms[2], CLUBS[CLUBS.length - 1]];
    return clubs.map((club, stage) => {
        const d = aiDraftTeam(rng, STAGE_DIFFICULTY[stage], club.types, club.formation);
        // da semifinal em diante os adversários também chegam com itens
        const itemCount = stage >= 3 ? 2 : stage >= 2 ? 1 : 0;
        const holders = rng.shuffle([...d.lineup]).slice(0, itemCount);
        for (const h of holders) h.item = rng.pick(ITEM_IDS);
        const tmRng = new Rng(seed, `cup-tm-${stage}`);
        return {
            name: club.name,
            lineup: equipRivalTms(tmRng, club.name, d.lineup),
            bench: equipRivalTms(tmRng, club.name, d.bench),
            tactic: club.tactic,
            color: club.color,
            formation: club.formation,
            captainUid: d.captainUid,
        };
    });
}
