import { describe, expect, it } from 'vitest';
import { AGENCY, maxCharge, SHOUTS, shoutAt } from './agency';
import { FUTSAL_5, withConfig } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { eff } from './effective';
import { applyAgencyOrder, createMatch, maxMoveOf, toRel } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import type { MatchEvent, MatchOrder, TeamSetup } from './state';

function team(seed: string, name: string): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}
const A = team('ag-a', 'A');
const B = team('ag-b', 'B');
const run = (orders: MatchOrder[], seed = 'ag') => runMatch(FUTSAL_5, A, B, seed, { snapshots: false, orders });
const of = <T extends MatchEvent['type']>(evs: MatchEvent[], type: T) =>
    evs.filter((e): e is Extract<MatchEvent, { type: T }> => e.type === type);

describe('agência do técnico (experimento)', () => {
    it('ordem que não vale agora não muda nada (barra vazia, tempo no intervalo)', () => {
        const base = runMatch(FUTSAL_5, A, B, 'ag');
        const same = runMatch(FUTSAL_5, A, B, 'ag', { orders: [{ tick: 30, team: 0, kind: 'max' }] });
        expect(matchHash(same)).toBe(matchHash(base));
    });

    it('grito: atributo do time na hora, 3 por jogo e com recarga', () => {
        const s = createMatch(FUTSAL_5, A, B, 'ag-eff');
        const p = s.players[3];
        const before = eff(s, p, 'shooting');
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'shout', shout: 'attack' });
        expect(eff(s, p, 'shooting') / before).toBeCloseTo(SHOUTS.attack.attrs.shooting ?? 1, 10);
        // o rival não ganha nada
        const rival = s.players[8];
        expect(shoutAt(s.events, 1, 0)).toBeNull();
        expect(eff(s, rival, 'shooting')).toBe(eff(createMatch(FUTSAL_5, A, B, 'ag-eff'), rival, 'shooting'));

        const gap = AGENCY.shoutCooldownTicks;
        const r = run([
            { tick: 100, team: 0, kind: 'shout', shout: 'lock' },
            { tick: 150, team: 0, kind: 'shout', shout: 'attack' }, // na recarga: não vale
            { tick: 100 + gap, team: 0, kind: 'shout', shout: 'calm' },
            { tick: 100 + 2 * gap, team: 0, kind: 'shout', shout: 'press' },
            { tick: 100 + 3 * gap, team: 0, kind: 'shout', shout: 'attack' }, // o 4º: não vale
        ]);
        expect(of(r.events, 'shout').map((e) => e.shout)).toEqual(['lock', 'calm', 'press']);
        expect(shoutAt(r.events, 0, 100 + AGENCY.shoutTicks - 1)).toBe('lock');
        expect(shoutAt(r.events, 0, 100 + AGENCY.shoutTicks)).toBeNull();
    });

    it('pedido de tempo: na bola parada seguinte, +5% de fôlego pra quem pediu, +3% pro rival e a bola espera', () => {
        const T = 900;
        const base = new LiveRunner(FUTSAL_5, A, B, 'ag');
        const live = new LiveRunner(FUTSAL_5, A, B, 'ag', [{ tick: T, team: 0, kind: 'timeout' }]);
        let ev: MatchEvent | undefined;
        while (!ev && !live.finished) {
            base.step();
            live.step();
            ev = live.state.events.find((e) => e.type === 'timeout');
        }
        expect(ev).toBeDefined();
        for (let i = 0; i < 10; i++) {
            const gain = live.state.players[i].energy - base.state.players[i].energy;
            if (i < 5) expect(gain).toBeCloseTo(Math.min(AGENCY.timeoutEnergy, 1 - base.state.players[i].energy), 6);
            else expect(gain).toBeCloseTo(Math.min(AGENCY.timeoutRivalEnergy, 1 - base.state.players[i].energy), 6);
        }
        // a bola parada fica parada durante a conversa
        const phase = live.state.phase;
        expect(phase).not.toBe('play');
        for (let i = 0; i < AGENCY.timeoutTicks - 1; i++) live.step();
        expect(live.state.phase).toBe(phase);

        // 1 por tempo: o 2º do mesmo tempo não vale, o do 2º tempo vale
        const r = run([
            { tick: T, team: 0, kind: 'timeout' },
            { tick: T + 400, team: 0, kind: 'timeout' },
            { tick: 6000, team: 0, kind: 'timeout' },
        ]);
        expect(of(r.events, 'timeout').map((e) => e.half)).toEqual([1, 2]);
    });

    it('goleiro-linha: liga na bola parada e o goleiro sobe como 5º no ataque', () => {
        const T = 400;
        const maxUp = (orders: MatchOrder[]) => {
            const live = new LiveRunner(FUTSAL_5, A, B, 'ag', orders);
            let best = 0;
            while (!live.finished && live.state.tick < 3000) {
                live.step();
                const gk = live.state.players.find((p) => p.team === 0 && p.role === 'GK')!;
                best = Math.max(best, toRel(live.state, 0, gk.pos).x);
            }
            return { best, events: live.state.events };
        };
        const off = maxUp([]);
        const on = maxUp([{ tick: T, team: 0, kind: 'flyGk', on: true }]);
        expect(off.best).toBeLessThan(8);
        expect(on.best).toBeGreaterThan(12);
        const ev = of(on.events, 'flyGk');
        expect(ev[0]?.on).toBe(true);
        expect(ev[0].tick).toBeGreaterThanOrEqual(T);
    });

    it('barra do golpe máximo: lances do time, mais rápido perdendo, metade de volta se não sair', () => {
        const at = (tick: number, e: Record<string, unknown>) =>
            ({ ...e, tick, half: 1, minute: 0 }) as unknown as MatchEvent;
        const tackles = (n: number, from: number) =>
            Array.from({ length: n }, (_, i) => at(from + i, { type: 'tackle', by: 1, victim: 6, success: true }));
        const even = maxCharge(tackles(4, 10), 0).charge;
        const behind = maxCharge(
            [at(1, { type: 'goal', by: 6, assist: null, team: 1, score: [0, 1], ownGoal: false }), ...tackles(4, 10)],
            0,
        ).charge;
        expect(even).toBeCloseTo(4 / AGENCY.maxFull, 10);
        expect(behind / even).toBeCloseTo(AGENCY.maxBehind[1], 10);
        // o lance do rival não enche a minha
        expect(maxCharge(tackles(4, 10), 1).charge).toBe(0);
        const full = tackles(AGENCY.maxFull, 10);
        expect(maxCharge(full, 0).charge).toBe(1);
        const miss = [...full, at(100, { type: 'max', team: 0, by: 1, phase: 'start' })];
        expect(maxCharge(miss, 0)).toEqual({ charge: 0, active: true, used: false });
        miss.push(at(300, { type: 'max', team: 0, by: 1, phase: 'miss' }));
        expect(maxCharge(miss, 0).charge).toBe(AGENCY.maxRefund);
        miss.push(
            at(400, { type: 'max', team: 0, by: 1, phase: 'start' }),
            at(410, { type: 'max', team: 0, by: 1, phase: 'hit' }),
        );
        expect(maxCharge([...miss, ...tackles(30, 500)], 0)).toEqual({ charge: 0, active: false, used: true });
    });

    it('golpe máximo: só com a barra cheia, o capitão brilha e o chute sai com o golpe dele', () => {
        let hits = 0;
        // o capitão chuta dentro da janela em ~6% das partidas: seeds em que sai (ENGINE_VERSION 8; achadas varrendo 0–89).
        // Mudou o motor e o teste falhou? Varra de novo e troque a lista (varrer tudo aqui estourava o tempo no CI).
        for (const k of [50, 58]) {
            const seed = `ag-max-${k}`;
            const plain = runMatch(FUTSAL_5, A, B, seed, { snapshots: false });
            const full = plain.events.find((e) => maxCharge(plain.events, 0, e.tick).charge >= 1);
            if (!full) continue;
            const live = new LiveRunner(FUTSAL_5, A, B, seed, [{ tick: full.tick + 1, team: 0, kind: 'max' }]);
            let start: MatchEvent | undefined;
            while (!live.finished && !start) {
                live.step();
                start = live.state.events.find((e) => e.type === 'max');
            }
            if (start?.type !== 'max') throw new Error('o golpe máximo não abriu com a barra cheia');
            const cap = live.state.players[start.by];
            expect(cap.captain).toBe(true);
            expect(cap.buffs.some((b) => b.src === 'max')).toBe(true);
            while (!live.finished) live.step();
            const evs = live.state.events;
            const end = evs.find((e) => e.type === 'max' && e.phase !== 'start');
            expect(end).toBeDefined();
            if (end?.type === 'max' && end.phase === 'hit' && cap.role !== 'GK') {
                hits++;
                const shot = evs.find((e) => e.type === 'shot' && e.tick === end.tick);
                expect(shot?.type === 'shot' && shot.by).toBe(start.by);
                expect(shot?.type === 'shot' && shot.moveId).toBe(maxMoveOf(cap.inst.moves, cap.inst.speciesId));
            }
            // 1 por partida: depois de sair, outra ordem não abre de novo
            const used = maxCharge(evs, 0);
            if (used.used) expect(evs.filter((e) => e.type === 'max' && e.phase === 'start')).toHaveLength(1);
        }
        expect(hits).toBeGreaterThan(0);
    });

    it('ordem dos pênaltis: o técnico escolhe quem bate primeiro', () => {
        const SHORT = withConfig({ halfSeconds: 4 });
        for (let i = 0; i < 40; i++) {
            const h = team(`pk-a${i}`, 'A');
            const a = team(`pk-b${i}`, 'B');
            const plain = runMatch(SHORT, h, a, `pk-${i}`, { snapshots: false });
            const pens = of(plain.events, 'penalty');
            if (!pens.length) continue;
            const fieldUids = plain.roster.filter((p) => p.team === 0 && p.role !== 'GK').map((p) => p.uid);
            const first = plain.roster[pens[0].by].uid;
            // o padrão é o melhor chute; o técnico manda o último da lista bater primeiro
            const choice = fieldUids.find((u) => u !== first)!;
            const r = runMatch(SHORT, h, a, `pk-${i}`, {
                snapshots: false,
                orders: [{ tick: 1, team: 0, kind: 'penalties', order: [choice] }],
            });
            const p2 = of(r.events, 'penalty');
            expect(r.roster[p2[0].by].uid).toBe(choice);
            // até o apito, a mesma partida
            expect(r.score).toEqual(plain.score);
            return;
        }
        throw new Error('nenhuma partida foi pros pênaltis');
    });
});
