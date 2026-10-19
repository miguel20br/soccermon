import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { pt } from '../i18n/pt';
import { FUTSAL_5 } from './config';
import { CLUBS, clubLeader, cupRival } from './cup';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { COACH_LEADERS, RIVAL_COACH } from './rival-coach';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import type { MatchEvent, MatchOrder, TeamSetup } from './state';

function team(seed: string, name: string): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}
const A = team('rc-a', 'A');
const B = team('rc-b', 'B');
const coachEvents = (evs: MatchEvent[]) =>
    evs.filter((e): e is Extract<MatchEvent, { type: 'coach' }> => e.type === 'coach');

describe('técnico rival que reage (beira da quadra)', () => {
    it('todo clube da copa tem treinador com sprite, as 3 falas em PT e EN e um estilo de técnico', () => {
        for (const club of CLUBS) {
            const id = club.leader;
            expect(COACH_LEADERS).toContain(id);
            expect(existsSync(`public/assets/trainers/${id}.png`)).toBe(true);
            for (const d of [pt, en]) {
                const l = d.match.leaders[id];
                expect(l.name.length).toBeGreaterThan(0);
                for (const line of [l.pre, l.win, l.lose]) {
                    expect(line.length).toBeGreaterThan(5);
                    // sem emoji na interface
                    expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
                }
            }
        }
        expect(new Set(CLUBS.map((c) => c.leader)).size).toBe(CLUBS.length);
    });

    it('experimento desligado: o rival da copa é o mesmo time e a partida não muda', () => {
        const opp = { ...B, name: CLUBS[0].name };
        expect(cupRival(opp, false)).toBe(opp);
        expect(cupRival(opp, true).coach).toBe(clubLeader(opp.name));
        // fora da copa (nome que não é clube) também não ganha técnico
        expect(cupRival(B, true)).toBe(B);
        const plain = runMatch(FUTSAL_5, A, opp, 'rc-off');
        expect(coachEvents(plain.events)).toHaveLength(0);
        expect(matchHash(runMatch(FUTSAL_5, A, cupRival(opp, false), 'rc-off'))).toBe(matchHash(plain));
    });

    it('reage de forma determinística, avisa antes e a ordem entra pelo mesmo caminho (com os mesmos limites)', () => {
        let reactions = 0;
        for (const [k, leader] of COACH_LEADERS.entries()) {
            const away = { ...B, coach: leader };
            const r1 = runMatch(FUTSAL_5, A, away, `rc-${k}`, { snapshots: false });
            const r2 = runMatch(FUTSAL_5, A, away, `rc-${k}`, { snapshots: false });
            expect(matchHash(r2)).toBe(matchHash(r1));
            const calls = coachEvents(r1.events);
            reactions += calls.length;
            for (const c of calls) {
                expect(c.team).toBe(1);
                expect(c.leader).toBe(leader);
            }
            // cada grito avisado sai `leadTicks` depois, e nunca mais de 3 por jogo
            const shouts = r1.events.filter((e) => e.type === 'shout' && e.team === 1);
            expect(shouts.length).toBeLessThanOrEqual(3);
            for (const c of calls.filter((c) => c.call === 'shout'))
                expect(shouts.some((s) => s.tick === c.tick + RIVAL_COACH.leadTicks)).toBe(true);
            // 1 pedido de tempo por tempo
            const tos = r1.events.filter((e) => e.type === 'timeout' && e.team === 1);
            expect(new Set(tos.map((e) => e.half)).size).toBe(tos.length);
        }
        expect(reactions).toBeGreaterThan(COACH_LEADERS.length);
    });

    it('reage ao seu técnico: a sua ordem não muda o que o rival fez antes dela, só depois', () => {
        const away = { ...B, coach: 'ltsurge' as const };
        const base = runMatch(FUTSAL_5, A, away, 'rc-react', { snapshots: false });
        const T = 2400;
        const orders: MatchOrder[] = [
            { tick: T, team: 0, tactic: 'offensive' },
            { tick: T, team: 0, kind: 'shout', shout: 'attack' },
        ];
        const mine = runMatch(FUTSAL_5, A, away, 'rc-react', { snapshots: false, orders });
        const earlier = (evs: MatchEvent[]) => coachEvents(evs).filter((e) => e.tick < T);
        expect(earlier(mine.events)).toEqual(earlier(base.events));
    });
});
