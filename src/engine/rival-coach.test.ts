import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { pt } from '../i18n/pt';
import { AGENCY } from './agency';
import { FUTSAL_5, withConfig } from './config';
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
            // o golpe máximo é na hora certa: sai logo depois de chamado, sem aviso
            for (const c of calls.filter((c) => c.call === 'max'))
                expect(
                    r1.events.some(
                        (e) =>
                            e.type === 'max' &&
                            e.team === 1 &&
                            e.tick > c.tick &&
                            e.tick <= c.tick + AGENCY.maxArmTicks,
                    ),
                ).toBe(true);
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
            { tick: T, team: 0, kind: 'flyGk', on: true },
        ];
        const mine = runMatch(FUTSAL_5, A, away, 'rc-react', { snapshots: false, orders });
        const earlier = (evs: MatchEvent[]) => coachEvents(evs).filter((e) => e.tick < T);
        expect(earlier(mine.events)).toEqual(earlier(base.events));
    });
});

describe('técnico rival com o golpe máximo em 3 níveis (?maximo3=1)', () => {
    it('sorteia a nota (determinística) e solta no N2/N3, ou no N1 perdendo no fim', () => {
        const L = withConfig({ maxLevels: true });
        let calls = 0;
        for (const [k, leader] of COACH_LEADERS.entries()) {
            const away = { ...B, coach: leader };
            const r = runMatch(L, A, away, `rc-lv-${k}`, { snapshots: false });
            expect(matchHash(runMatch(L, A, away, `rc-lv-${k}`, { snapshots: false }))).toBe(matchHash(r));
            for (const c of coachEvents(r.events).filter((c) => c.call === 'max')) {
                calls++;
                expect([0, 1, 2]).toContain(c.call === 'max' && c.q);
                const hit = r.events.find((e) => e.type === 'max' && e.team === 1 && e.tick > c.tick);
                if (hit?.type !== 'max' || hit.level !== 1) continue;
                expect(c.minute).toBeGreaterThanOrEqual(RIVAL_COACH.maxN1From);
            }
        }
        expect(calls).toBeGreaterThan(0);
    });
});
