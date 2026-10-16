import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import type { RunState, StageStats } from '../store/game-store';
import { shareCardData } from './share-card';

const line = (uid: string, speciesId: number, name: string, goals: number): StageStats['players'][number] => ({
    uid,
    speciesId,
    name,
    role: 'pivo',
    rating: 7,
    minutes: 20,
    distance: 1000,
    goals,
    assists: 0,
    shots: goals,
    passes: 0,
    passesCompleted: 0,
    tacklesWon: 0,
    interceptions: 0,
    saves: 0,
    movesUsed: 0,
});

describe('card do título', () => {
    it('monta jogos, titulares, capitão, artilheiro e o selo da copa perfeita', () => {
        const rng = new Rng('card', 'test');
        const picks = [143, 68, 151, 142, 150, 25].map((id) => createInstance(id, rng));
        const [, , , , mewtwo] = picks;
        const stats = (goals: number): StageStats => ({
            possession: [0.5, 0.5],
            shots: [5, 5],
            shotsOnTarget: [3, 3],
            players: [line(mewtwo.uid, 150, 'Mewtwo', goals), line(picks[0].uid, 143, 'Snorlax', 0)],
        });
        const run = {
            teamName: 'Pallet FC',
            status: 'champion',
            picks,
            lineup: picks.slice(0, 5).map((p) => p.uid),
            bench: [picks[5].uid],
            captainUid: mewtwo.uid,
            results: [0, 1, 2, 3].map((stage) => ({
                stage,
                opponent: 'Liga Índigo',
                score: stage === 1 ? [0, 0] : [2, 0],
                shootout: stage === 1 ? [5, 4] : null,
                won: true,
                stats: stats(stage === 1 ? 0 : 2),
            })),
        } as unknown as RunState;

        const d = shareCardData(run, 0xf2c230, 'pt');
        expect(d.title).toBe('CAMPEÕES!');
        expect(d.color).toBe('#f2c230');
        expect(d.perfect).not.toBeNull();
        expect(d.games.map((g) => g.score)).toEqual(['2 x 0', '0 x 0', '2 x 0', '2 x 0']);
        expect(d.games[1].pens).toBe('pên. 5x4');
        expect(d.games[0].pens).toBeNull();
        expect(d.games[3].opponent).toBe('Liga Índigo');
        // só os titulares, sem o banco; o capitão marcado
        expect(d.squad).toHaveLength(5);
        expect(d.squad.filter((p) => p.captain).map((p) => p.name)).toEqual(['Mewtwo']);
        expect(d.scorer?.text).toBe('Mewtwo · 6 gols');
        expect(d.site).toBe('soccermon.com');

        // um gol sofrido: sem selo; em inglês
        run.results[2].score = [2, 1];
        const en = shareCardData(run, 0xe8423f, 'en');
        expect(en.perfect).toBeNull();
        expect(en.title).toBe('CHAMPIONS!');
        expect(en.games[3].opponent).toBe('Indigo League');
    });
});
