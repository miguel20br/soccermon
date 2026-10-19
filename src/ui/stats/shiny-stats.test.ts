import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../../engine/config';
import { aiDraftTeam } from '../../engine/draft';
import { playerLines } from '../../engine/match-stats';
import { Rng } from '../../engine/rng';
import { runMatch } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import type { StageResult } from '../../store/game-store';
import { aggregate } from './CupStats';

const team = (side: string): TeamSetup => ({
    name: side,
    ...aiDraftTeam(new Rng('shiny-stats', side), 1, [], '1-2-1'),
    tactic: 'balanced',
    color: 0xe8423f,
});

describe('shiny nas estatísticas', () => {
    it('a linha da partida e o resumo da copa sabem quem é shiny (as telas usavam sempre o sprite normal)', () => {
        const home = team('casa');
        home.lineup = home.lineup.map((p, i) => (i === 0 ? { ...p, shiny: true } : { ...p, shiny: false }));
        const m = runMatch(FUTSAL_5, home, team('fora'), 'shiny-stats', { snapshots: true });
        const lines = playerLines(m).filter((l) => l.team === 0);
        expect(lines.find((l) => l.uid === home.lineup[0].uid)?.shiny).toBe(true);
        expect(lines.find((l) => l.uid === home.lineup[1].uid)?.shiny).toBe(false);
        const stage = {
            stats: {
                players: lines.map((l) => ({ uid: l.uid, speciesId: l.speciesId, shiny: l.shiny, name: l.name })),
            },
        } as unknown as StageResult;
        const old = { stats: { players: [{ uid: home.lineup[0].uid, speciesId: 1, name: 'x' }] } } as StageResult;
        const agg = aggregate([old, stage]);
        expect(agg.find((a) => a.uid === home.lineup[0].uid)?.shiny).toBe(true);
        expect(agg.find((a) => a.uid === home.lineup[1].uid)?.shiny).toBe(false);
    });
});
