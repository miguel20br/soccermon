import { describe, expect, it } from 'vitest';
import { computeAttributes } from './attributes';
import { FUTSAL_5 } from './config';
import { aiDraftTeam } from './draft';
import { EVO_THRESHOLD, evoNeeded, FORMADOR_EVO_THRESHOLD, RIVAL_EVO_THRESHOLD } from './evolution';
import { createInstance, viewInstance } from './instance';
import { applyModifiers, attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import { shopOffers } from './shop';
import { CHARANGA_ADD, PREPARADOR_ADD } from './sponsors';
import type { MatchState, TeamSetup } from './state';

/** Patrocínios de 23/10/2026 (docs/planos/patrocinios-novos.md). */
const team = (seed: string, sponsors?: string[]): TeamSetup => ({
    name: seed,
    ...aiDraftTeam(new Rng(seed, 'team'), 0),
    tactic: 'balanced',
    color: 0,
    ...(sponsors && { sponsors }),
});

describe('Preparador de Lavender', () => {
    it('+6 de fôlego pra todo mundo, e só fôlego', () => {
        const inst = createInstance(68, new Rng('prep'));
        const base = computeAttributes(viewInstance(inst).species, inst.level);
        const com = applyModifiers(base, attributeModifiers(inst, { sponsors: ['preparador'] }));
        const sem = applyModifiers(base, attributeModifiers(inst, { sponsors: [] }));
        expect(com.stamina - sem.stamina).toBe(PREPARADOR_ADD);
        expect(com.pace).toBe(sem.pace);
    });
});

describe('Charanga de Pewter', () => {
    it('fora da partida (carta) e ganhando não dá nada; perdendo, +4 em tudo', () => {
        const inst = createInstance(25, new Rng('charanga'));
        const add = (losing?: boolean) =>
            attributeModifiers(inst, { sponsors: ['charanga'], losing })
                .filter((m) => m.ref === 'charanga')
                .map((m) => [m.attrs, m.add]);
        expect(add()).toEqual([]);
        expect(add(false)).toEqual([]);
        expect(add(true)).toEqual([['all', CHARANGA_ADD]]);
    });

    it('na partida liga a cada gol do rival que deixa o time atrás e desliga no empate', () => {
        // o que a carta mostraria pra cada um com o placar de agora: tem que ser o que vale em campo
        const expected = (s: MatchState, losing: boolean) =>
            s.players
                .filter((p) => p.team === 0 && !p.origin)
                .map((p) => {
                    const rt = s.teams[0];
                    const captain = rt.lineup.find((i) => i.uid === rt.setup.captainUid) ?? null;
                    const mods = attributeModifiers(p.inst, {
                        lineup: rt.lineup,
                        captain,
                        role: p.role,
                        sponsors: rt.setup.sponsors,
                        losing,
                    });
                    return [
                        p.attr.shooting,
                        applyModifiers(computeAttributes(p.sp, p.inst.level), mods, p.role).shooting,
                    ];
                });
        let behind = 0;
        let level = 0;
        for (let i = 0; i < 6 && (behind === 0 || level === 0); i++) {
            const r = new LiveRunner(FUTSAL_5, team(`ch-a${i}`, ['charanga']), team(`ch-b${i}`), `charanga-${i}`);
            const s = r.state;
            let wasBehind = false;
            while (!r.finished && !s.shootout) {
                r.step();
                const losing = s.score[0] < s.score[1];
                for (const [got, want] of expected(s, losing)) expect(got).toBeCloseTo(want, 6);
                if (losing) behind++;
                else if (wasBehind) level++;
                wasBehind = losing;
            }
        }
        // a partida passou pelos dois estados (senão o teste não provou nada)
        expect(behind).toBeGreaterThan(0);
        expect(level).toBeGreaterThan(0);
    }, 120_000);
});

describe('Clube Formador de Pallet', () => {
    it('o seu time evolui com 10 em vez de 14; o rival não muda', () => {
        expect(evoNeeded(0, false, ['formador'])).toBe(FORMADOR_EVO_THRESHOLD);
        expect(evoNeeded(0, false, [])).toBe(EVO_THRESHOLD);
        expect(evoNeeded(1, false, ['formador'])).toBe(RIVAL_EVO_THRESHOLD);
    });

    it('barra em 10 evolui na partida só com o Formador', () => {
        const rng = new Rng('formador');
        const mk = (sponsors: string[]) => {
            const ps = [74, 16, 4, 7, 1].map((id) => ({ ...createInstance(id, new Rng(`f${id}`)), evo: 10 }));
            return {
                name: 'Time',
                lineup: ps,
                bench: [],
                tactic: 'balanced' as const,
                color: 0,
                formation: '1-2-1' as const,
                captainUid: ps[0].uid,
                manualSubs: true,
                sponsors,
            };
        };
        const rival = { ...team('formador-rival'), lineup: [95, 111, 27, 50, 66].map((id) => createInstance(id, rng)) };
        const evos = (sponsors: string[]) => {
            const m = runMatch(FUTSAL_5, mk(sponsors), rival, 'formador');
            const first = new Map<string, number>();
            for (const e of m.events)
                if (e.type === 'evolve' && e.team === 0 && !first.has(e.uid)) first.set(e.uid, e.tick);
            return first;
        };
        const com = evos(['formador']);
        const sem = evos([]);
        expect(com.size).toBeGreaterThan(0);
        // com o Formador quem evolui chega lá antes (ou só ele chega)
        const earlier = [...com].filter(([uid, tick]) => !sem.has(uid) || tick < sem.get(uid)!);
        expect(earlier.length).toBeGreaterThan(0);
    });
});

describe('Olheiro de Viridian', () => {
    it('os Pokémon do Mercado vêm mais raros (nota média maior nas mesmas copas)', () => {
        const mine = [6, 9, 3, 25, 143].map((id) => createInstance(id, new Rng(`o${id}`)));
        const mean = (sponsors: string[]) => {
            const notes: number[] = [];
            for (let i = 0; i < 60; i++)
                for (const o of shopOffers({
                    seed: `olheiro-${i}`,
                    stage: 0,
                    reroll: 0,
                    team: mine,
                    sponsors,
                    eventType: null,
                    captain: mine[0],
                }))
                    if (o.kind === 'pokemon') notes.push(viewInstance(o.inst).overall);
            return notes.reduce((a, b) => a + b, 0) / notes.length;
        };
        expect(mean(['olheiro'])).toBeGreaterThan(mean([]) + 1);
    });
});
