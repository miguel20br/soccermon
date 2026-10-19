import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../engine/config';
import { buildCupOpponents } from '../engine/cup';
import { teamRecipe } from '../engine/duel-validate';
import { ligaMatchSeed, ligaOrders, ligaTeams, simulateLiga } from '../engine/league';
import { runMatch } from '../engine/runners/batch-runner';
import {
    divisionOf,
    ELO_START,
    eloAfter,
    eloExpected,
    LIGA_OPENS_AT,
    ligaCountdown,
    pickGhost,
    prevSeason,
    seasonDaysLeft,
    seasonOf,
    seasonStartElo,
} from './rules';

describe('Liga fechada até a data', () => {
    it('abre à meia-noite de Brasília do dia marcado', () => {
        expect(new Date(LIGA_OPENS_AT).toISOString()).toBe('2026-12-01T03:00:00.000Z');
    });
    it('antes da data: contagem em dias, horas e minutos; na hora e depois: aberta', () => {
        const at = Date.parse('2026-12-01T03:00:00Z');
        const left = (12 * 1440 + 4 * 60 + 31) * 60000;
        expect(ligaCountdown(at - left, at)).toEqual({ d: 12, h: '04', m: '31' });
        // 30 s antes ainda está fechada (arredonda pra cima: nunca mostra "0d 00h 00m" fechada)
        expect(ligaCountdown(at - 30000, at)).toEqual({ d: 0, h: '00', m: '01' });
        expect(ligaCountdown(at, at)).toBeNull();
        expect(ligaCountdown(at + 1, at)).toBeNull();
        expect(ligaCountdown(Date.parse('2026-10-19T12:00:00Z'))).not.toBeNull();
    });
});

describe('Elo', () => {
    it('igual contra igual: ganha 24 nas primeiras partidas, 16 depois; perder tira o mesmo', () => {
        expect(eloExpected(1000, 1000)).toBe(0.5);
        expect(eloAfter(1000, 1000, true, 0)).toBe(1024);
        expect(eloAfter(1000, 1000, false, 0)).toBe(976);
        expect(eloAfter(1000, 1000, true, 10)).toBe(1016);
    });

    it('ganhar de quem tem mais Elo vale mais; perder pra quem tem menos tira mais', () => {
        expect(eloAfter(1000, 1200, true, 20) - 1000).toBeGreaterThan(eloAfter(1000, 800, true, 20) - 1000);
        expect(1000 - eloAfter(1000, 800, false, 20)).toBeGreaterThan(1000 - eloAfter(1000, 1200, false, 20));
        expect(eloAfter(5, 5, false, 20)).toBe(0);
    });

    it('divisões nas cores das cartas', () => {
        expect(divisionOf(ELO_START).id).toBe('bronze');
        expect(divisionOf(1100)).toMatchObject({ id: 'prata', next: 1250 });
        expect(divisionOf(1300).id).toBe('ouro');
        expect(divisionOf(1600)).toMatchObject({ id: 'lenda', next: null });
    });

    it('temporada mensal (Brasília) e volta metade do caminho na temporada nova', () => {
        expect(seasonOf('2026-10-19')).toBe('2026-10');
        expect(prevSeason('2027-01')).toBe('2026-12');
        expect(seasonDaysLeft('2026-10-31')).toBe(1);
        expect(seasonDaysLeft('2026-02-01')).toBe(28);
        expect(seasonStartElo(undefined)).toBe(1000);
        expect(seasonStartElo(1400)).toBe(1200);
        expect(seasonStartElo(800)).toBe(900);
    });
});

describe('escolha do fantasma', () => {
    const c = (id: string, elo: number) => ({ id, elo });
    const cands = [c('eu', 1000), c('a', 1010), c('b', 990), c('c', 1500), c('d', 1030), c('e', 960), c('f', 1100)];

    it('nunca você; entre os 5 mais perto de Elo', () => {
        const seen = new Set<string>();
        for (let i = 0; i < 50; i++) seen.add(pickGhost(cands, c('eu', 1000), [], i / 50)!.id);
        expect([...seen].sort()).toEqual(['a', 'b', 'd', 'e', 'f']);
    });

    it('evita os recentes, mas se só sobrou recente joga contra ele', () => {
        expect(pickGhost(cands, c('eu', 1000), ['a', 'b', 'd', 'e', 'f'], 0)?.id).toBe('c');
        expect(pickGhost([c('eu', 1000), c('a', 1)], c('eu', 1000), ['a'], 0.9)?.id).toBe('a');
        expect(pickGhost([c('eu', 1000)], c('eu', 1000), [], 0)).toBeNull();
    });
});

describe('partida da Liga (mesma no navegador e no servidor)', () => {
    const [x, y] = buildCupOpponents('liga-teste').slice(2);
    const mine = teamRecipe(x);
    const ghost = teamRecipe(y);

    it('o servidor refaz e chega no mesmo placar que a tela (com snapshots, pelo worker)', () => {
        const orders = [{ tick: 600, team: 0 as const, tactic: 'offensive' as const }];
        const [home, away] = ligaTeams(mine, ghost);
        const screen = runMatch(FUTSAL_5, home, away, ligaMatchSeed('s1'), { orders });
        const server = simulateLiga(mine, ghost, 's1', orders);
        expect(server.score).toEqual(screen.score);
        expect(server.shootout).toEqual(screen.shootout);
        expect(server.winner).toBe(screen.winner);
        expect(home.manualSubs).toBe(true);
        expect(away.manualSubs).toBe(false);
    });

    it('ordens: só do seu time, válidas e poucas', () => {
        expect(ligaOrders([{ tick: 10, team: 0, tactic: 'offensive' }])).toHaveLength(1);
        expect(ligaOrders([{ tick: 10, team: 1, tactic: 'offensive' }])).toBeNull();
        expect(ligaOrders([{ tick: -1, team: 0, tactic: 'offensive' }])).toBeNull();
        expect(ligaOrders('x')).toBeNull();
        expect(ligaOrders(Array.from({ length: 81 }, (_, i) => ({ tick: i, team: 0, tactic: 'balanced' })))).toBeNull();
    });
});
