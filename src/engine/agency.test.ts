import { describe, expect, it } from 'vitest';
import { AGENCY, maxCharge } from './agency';
import { FUTSAL_5, withConfig } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { eff } from './effective';
import { applyAgencyOrder, benchSpot, createMatch, inMaxZoneOf, maxMoveOf, toRel } from './match';
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

    it('o grito saiu: ordem antiga de grito (tela velha do Duelo, save da Copa) não muda nada', () => {
        const base = runMatch(FUTSAL_5, A, B, 'ag');
        const shout = { tick: 100, team: 0, kind: 'shout', shout: 'attack' } as unknown as MatchOrder;
        const same = runMatch(FUTSAL_5, A, B, 'ag', { orders: [shout] });
        expect(matchHash(same)).toBe(matchHash(base));
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

    it('goleiro-linha: liga na hora, o goleiro sobe como 5º no ataque e a linha joga 5 contra 4', () => {
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
        expect(ev[0].tick).toBe(T);
        // 5 contra 4: com a bola, a linha passa e chuta melhor; sem a bola, nada muda
        const s = createMatch(FUTSAL_5, A, B, 'ag-fly');
        const p = s.players[3];
        s.ball.owner = 2;
        const pass = eff(s, p, 'passing');
        const shot = eff(s, p, 'shooting');
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'flyGk', on: true });
        expect(eff(s, p, 'passing') / pass).toBeCloseTo(AGENCY.flyPass, 10);
        expect(eff(s, p, 'shooting') / shot).toBeCloseTo(AGENCY.flyShot, 10);
        s.ball.owner = 7;
        expect(eff(s, p, 'passing')).toBe(pass);
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

    /** Primeiro tick (depois da barra cheia) em que `cue` vale, andando a partida sem ordem nenhuma. */
    function firstCue(home: TeamSetup, seed: string, cue: (live: LiveRunner) => boolean, from = 0) {
        const live = new LiveRunner(FUTSAL_5, home, B, seed);
        while (!live.finished) {
            const s = live.state;
            if (s.tick >= from && s.phase === 'play' && maxCharge(s.events, 0, s.tick).charge >= 1 && cue(live))
                return s.tick;
            live.step();
        }
        return null;
    }
    const capOf = (live: LiveRunner) => live.state.players.find((p) => p.team === 0 && p.captain)!;

    it('golpe máximo de linha: na hora certa sai na hora, com o golpe do capitão; fora dela não sai sozinho', () => {
        let checked = 0;
        for (let k = 0; k < 20 && checked < 2; k++) {
            const seed = `ag-max-${k}`;
            if (A.lineup.find((p) => p.uid === A.captainUid) === A.lineup[0]) throw new Error('capitão no gol');
            const at = firstCue(A, seed, (live) => {
                const cap = capOf(live);
                return live.state.ball.owner === cap.idx && cap.role !== 'GK' && inMaxZoneOf(live.state, cap);
            });
            if (at === null) continue;
            checked++;
            const r = run([{ tick: at, team: 0, kind: 'max' }], seed);
            const hit = of(r.events, 'max')[0];
            expect(hit?.phase).toBe('hit');
            // na hora: o chute sai no tick seguinte ao da ordem, com a versão máxima do golpe dele
            expect(hit.tick - at).toBeLessThanOrEqual(2);
            const cap = r.roster[hit.by];
            expect(cap.captain).toBe(true);
            const shot = of(r.events, 'shot').find((e) => e.tick === hit.tick);
            expect(shot?.by).toBe(hit.by);
            const inst = A.lineup.find((p) => p.uid === cap.uid)!;
            expect(shot?.moveId).toBe(maxMoveOf(inst.moves, inst.speciesId));
            // 1 por partida
            expect(maxCharge(r.events, 0)).toEqual({ charge: 0, active: false, used: true });

            // fora da hora certa (o capitão sem a bola): fica armada um instante; se não vier a hora, nada gasta
            const early = firstCue(A, seed, (live) => live.state.ball.owner !== capOf(live).idx);
            const r2 = run([{ tick: early!, team: 0, kind: 'max' }], seed);
            const hit2 = of(r2.events, 'max')[0];
            if (hit2) expect(hit2.tick - early!).toBeLessThanOrEqual(AGENCY.maxArmTicks);
            else expect(maxCharge(r2.events, 0, early! + AGENCY.maxArmTicks + 1).charge).toBe(1);
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('defesa máxima (capitão no gol): o próximo chute no gol é defendido e o time sai rápido', () => {
        const gkUid = A.lineup[0].uid;
        const H = { ...A, captainUid: gkUid };
        let saves = 0;
        for (let k = 0; k < 30 && saves < 2; k++) {
            const seed = `ag-gk-${k}`;
            const at = firstCue(H, seed, (live) => {
                const s = live.state;
                const owner = s.ball.owner === null ? null : s.players[s.ball.owner];
                return !!owner && owner.team === 1 && inMaxZoneOf(s, owner);
            });
            if (at === null) continue;
            const r = runMatch(FUTSAL_5, H, B, seed, {
                snapshots: false,
                orders: [{ tick: at, team: 0, kind: 'max' }],
            });
            const evs = of(r.events, 'max');
            expect(evs[0]?.phase).toBe('start');
            expect(r.roster[evs[0].by].uid).toBe(gkUid);
            const end = evs[1];
            expect(end && end.tick - evs[0].tick).toBeLessThanOrEqual(AGENCY.maxGkTicks);
            // nada de gol do rival enquanto ela vale
            expect(
                r.events.some((e) => e.type === 'goal' && e.team === 1 && e.tick > evs[0].tick && e.tick < end.tick),
            ).toBe(false);
            if (end.phase === 'hit') {
                saves++;
                const save = r.events.find((e) => e.type === 'save' && e.tick === end.tick);
                expect(save?.type === 'save' && save.caught).toBe(true);
                expect(maxCharge(r.events, 0).used).toBe(true);
            } else {
                expect(end.phase).toBe('miss');
                expect(maxCharge(r.events, 0, end.tick).charge).toBe(AGENCY.maxRefund);
            }
        }
        expect(saves).toBeGreaterThan(0);
    });

    it('troca volante: com a bola rolando entra na hora, vindo da lateral perto do banco', () => {
        const S = A;
        const out = S.lineup[2];
        const inn = S.bench[0];
        if (!inn) throw new Error('time sem reserva');
        const seed = 'ag-sub';
        // um tick com a bola rolando e quem sai sem a bola
        const live = new LiveRunner(FUTSAL_5, S, B, seed);
        while (!(live.state.tick > 600 && live.state.phase === 'play' && live.state.ball.owner !== 2)) live.step();
        const T = live.state.tick;
        const runner = new LiveRunner(FUTSAL_5, S, B, seed, [
            { tick: T, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid },
        ]);
        while (runner.state.tick <= T) runner.step();
        const sub = of(runner.state.events, 'sub')[0];
        expect(sub).toMatchObject({ outUid: out.uid, inUid: inn.uid, fly: true });
        expect(sub.tick).toBe(T);
        // quem entrou saiu da lateral, do lado do banco, e já está correndo pra vaga
        const fresh = runner.state.players[sub.outIdx];
        expect(fresh.inst.uid).toBe(inn.uid);
        const bench = benchSpot(runner.state, 0);
        expect(Math.hypot(fresh.pos.x - bench.x, fresh.pos.y - bench.y)).toBeLessThan(1);
        expect(toRel(runner.state, 0, fresh.pos).x).toBeLessThan(FUTSAL_5.pitch.length / 2);

        // quem está com a bola só sai quando soltar
        const own = new LiveRunner(FUTSAL_5, S, B, seed);
        while (!(own.state.tick > 600 && own.state.phase === 'play' && own.state.ball.owner === 2)) own.step();
        const T2 = own.state.tick;
        const r = run([{ tick: T2, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }], seed);
        const sub2 = of(r.events, 'sub')[0];
        expect(sub2.tick).toBeGreaterThan(T2);
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
