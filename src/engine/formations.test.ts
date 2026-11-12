import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from './config';
import { AIController } from './controllers/ai-controller';
import { aiDraftTeam } from './draft';
import { FORMATION_STYLES, FORMATIONS, type FormationId, hasEdge } from './formations';
import { toRel } from './match';
import { Rng } from './rng';
import { LiveRunner } from './runners/live-runner';
import type { TeamSetup } from './state';

const ids = Object.keys(FORMATIONS) as FormationId[];

describe('vantagem tática das formações', () => {
    it('é um ciclo: cada uma (menos o Losango) ganha de uma e perde de uma, nunca de mão dupla', () => {
        for (const f of ids) {
            const beats = ids.filter((o) => hasEdge(f, o));
            const beatenBy = ids.filter((o) => hasEdge(o, f));
            expect(beats.length).toBe(f === '1-2-1' ? 0 : 1);
            expect(beatenBy.length).toBe(f === '1-2-1' ? 0 : 1);
            for (const o of beats) expect(hasEdge(o, f)).toBe(false);
        }
    });
});

describe('armação pelo fixo: Linha de 3 (motor 29) e Losango (motor 30)', () => {
    it.each([
        ['3-1', '1-2-1', 0.25],
        ['1-2-1', '3-1', 0.12], // mais fraco: 4 ⇒ 6 de 42 passes
    ] as const)('%s: o ala no nosso campo passa nas mesmas horas, mas a bola procura o fixo', (f, rival, share) => {
        const mk = (name: string, form: FormationId): TeamSetup => ({
            name,
            ...aiDraftTeam(new Rng(`fixo-${name}`, 'team'), 1, [], form),
            tactic: 'balanced',
            color: 0,
            formation: form,
        });
        const live = new LiveRunner(FUTSAL_5, mk('A', f), mk('B', rival), `fixo-${f.replaceAll('-', '')}`);
        const style = FORMATION_STYLES[f];
        const bonus = style.fixoPass;
        expect(bonus).toBeGreaterThan(0);
        // cópia do estado (o structuredClone perde a classe do Rng)
        const clone = () => {
            const c = structuredClone(live.state);
            Object.setPrototypeOf(c.rng, Object.getPrototypeOf(live.state.rng));
            return c;
        };
        const pick = (fixoPass: number | undefined, idx: number) => {
            style.fixoPass = fixoPass;
            const cmd = new AIController(clone()).decide(idx);
            const last = Array.isArray(cmd) ? cmd.at(-1) : cmd;
            return last?.type === 'pass' ? (last.receiverId ?? -1) : null;
        };
        let passes = 0;
        let toFixo = 0;
        let toFixoBefore = 0;
        try {
            while (!live.finished && passes < 120) {
                const s = live.state;
                const o = s.ball.owner;
                const p = o === null ? null : s.players[o];
                if (s.phase === 'play' && p?.team === 0 && p.role === 'ALA' && toRel(s, 0, p.pos).x < 20) {
                    const before = pick(0, p.idx);
                    const after = pick(bonus, p.idx);
                    // só reordena: passa ou conduz exatamente nas mesmas horas
                    expect(after === null).toBe(before === null);
                    if (after !== null && before !== null) {
                        passes++;
                        if (s.players[after].role === 'FIXO') toFixo++;
                        if (s.players[before].role === 'FIXO') toFixoBefore++;
                    }
                }
                live.step();
            }
        } finally {
            style.fixoPass = bonus;
        }
        expect(passes).toBeGreaterThanOrEqual(20);
        expect(toFixo).toBeGreaterThan(toFixoBefore);
        expect(toFixo / passes).toBeGreaterThan(share);
    });
});
