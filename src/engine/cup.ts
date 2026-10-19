import { species } from './data';
import { aiDraftTeam } from './draft';
import type { FormationId } from './formations';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import type { LeaderId } from './rival-coach';
import { Rng } from './rng';
import type { Tactic, TeamSetup } from './state';
import { equipRivalTms, RIVAL_GYM_TM_MAX } from './tm';

/** Adversários da copa: clubes temáticos de Kanto, cada um puxado para os tipos do ginásio. */
export interface ClubTemplate {
    name: string;
    city: string;
    types: string[];
    tactic: Tactic;
    color: number;
    formation: FormationId;
    /** Treinador do clube (sprite, falas, quadra e o técnico IA da beira da quadra). */
    leader: LeaderId;
}

export const CLUBS: ClubTemplate[] = [
    {
        name: 'Pewter Rochedo',
        city: 'Pewter',
        leader: 'brock',
        types: ['Rock', 'Ground'],
        tactic: 'defensive',
        color: 0x9c7b4a,
        formation: 'ferrolho',
    },
    {
        name: 'Cerulean Cascata',
        city: 'Cerulean',
        leader: 'misty',
        types: ['Water'],
        tactic: 'balanced',
        color: 0x3a8ee6,
        formation: '1-2-1',
    },
    {
        name: 'Vermilion Voltagem',
        city: 'Vermilion',
        leader: 'ltsurge',
        types: ['Electric'],
        tactic: 'counter',
        color: 0xf2c53d,
        formation: '1-1-2',
    },
    {
        name: 'Celadon Arco-Íris',
        city: 'Celadon',
        leader: 'erika',
        types: ['Grass'],
        tactic: 'balanced',
        color: 0x58b85c,
        formation: '1-2-1',
    },
    {
        name: 'Fuchsia Ninjas',
        city: 'Fuchsia',
        leader: 'koga',
        types: ['Poison'],
        tactic: 'counter',
        color: 0xb15fc4,
        formation: '2-2',
    },
    {
        name: 'Saffron Mentes',
        city: 'Saffron',
        leader: 'sabrina',
        types: ['Psychic'],
        tactic: 'offensive',
        color: 0xe85d9e,
        formation: '4-0',
    },
    {
        name: 'Cinnabar Vulcão',
        city: 'Cinnabar',
        leader: 'blaine',
        types: ['Fire'],
        tactic: 'offensive',
        color: 0xe8553a,
        formation: '1-1-2',
    },
    {
        name: 'Viridian Terra',
        city: 'Viridian',
        leader: 'giovanni',
        types: ['Ground'],
        tactic: 'balanced',
        color: 0x6b8f3a,
        formation: '3-1',
    },
    {
        name: 'Lavender Assombro',
        city: 'Lavender',
        leader: 'agatha',
        types: ['Ghost', 'Poison'],
        tactic: 'defensive',
        color: 0x7a5fb0,
        formation: '3-1',
    },
    {
        name: 'Liga Índigo',
        city: 'Indigo Plateau',
        leader: 'lance',
        types: ['Dragon', 'Ice', 'Fighting', 'Ghost'],
        tactic: 'balanced',
        color: 0x3d3f8f,
        formation: '1-2-1',
    },
];

export const CUP_STAGES = ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const STAGE_DIFFICULTY = [-1, 0, 2, 4];

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
        // das quartas em diante os adversários também chegam com itens (1 nas quartas e na semi, 3 na final)
        const itemCount = stage >= 3 ? 3 : stage >= 1 ? 1 : 0;
        const holders = rng.shuffle([...d.lineup]).slice(0, itemCount);
        // item que serve: um geral ou o do tipo dele (antes saía Metal Coat, de tipo que nem existe na Gen 1)
        for (const h of holders) {
            const own = species(h.speciesId).types.flatMap((t) => TYPE_ITEM_FOR[t] ?? []);
            h.item = rng.pick([...ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type'), ...own]);
        }
        const tmRng = new Rng(seed, `cup-tm-${stage}`);
        const gymTms = { left: RIVAL_GYM_TM_MAX };
        return {
            name: club.name,
            lineup: equipRivalTms(tmRng, club.name, d.lineup, gymTms),
            bench: equipRivalTms(tmRng, club.name, d.bench, gymTms),
            tactic: club.tactic,
            color: club.color,
            formation: club.formation,
            captainUid: d.captainUid,
        };
    });
}

/**
 * Rival da Copa como entra na partida: com a beira da quadra ligada, o treinador do clube vira o técnico IA que reage
 * (src/engine/rival-coach.ts). Desligada, o mesmo time de sempre (a partida não muda nada).
 */
export function cupRival(opponent: TeamSetup, agency: boolean): TeamSetup {
    const coach = agency ? clubLeader(opponent.name) : undefined;
    return coach ? { ...opponent, coach } : opponent;
}

/** Treinador do clube pelo nome (undefined fora da copa: Duelo, times de teste). */
export const clubLeader = (clubName: string): LeaderId | undefined => CLUBS.find((c) => c.name === clubName)?.leader;
