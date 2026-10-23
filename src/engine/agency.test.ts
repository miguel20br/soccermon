import { describe, expect, it } from 'vitest';
import { AGENCY, inMaxZone, maxCharge, maxCue, maxGraded } from './agency';
import { FUTSAL_5, withConfig } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { eff } from './effective';
import { applyAgencyOrder, benchSpot, createMatch, inMaxZoneOf, maxMoveOf, toRel } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner, validOrder } from './runners/live-runner';
import { type MatchEvent, type MatchOrder, SNAP_STRIDE, type TeamSetup } from './state';

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
        expect(maxCharge(miss, 0)).toEqual({ charge: 0, level: 0, active: true, used: false });
        miss.push(at(300, { type: 'max', team: 0, by: 1, phase: 'miss' }));
        expect(maxCharge(miss, 0).charge).toBe(AGENCY.maxRefund);
        miss.push(
            at(400, { type: 'max', team: 0, by: 1, phase: 'start' }),
            at(410, { type: 'max', team: 0, by: 1, phase: 'hit' }),
        );
        expect(maxCharge([...miss, ...tackles(30, 500)], 0)).toEqual({
            charge: 0,
            level: 0,
            active: false,
            used: true,
        });
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

    it('zona do golpe máximo pela posição do capitão: pivô 15 m, ala 18 m, fixo 22 m (o goleiro, 15 m do rival)', () => {
        const { pitch } = FUTSAL_5;
        const y = pitch.width / 2;
        // time 0 ataca o gol de x = 40: d metros do gol, de frente
        const at = (d: number, role: Parameters<typeof inMaxZone>[4]) => inMaxZone(pitch.length - d, y, 0, pitch, role);
        expect([at(14, 'PIVO'), at(14, 'ALA'), at(14, 'FIXO'), at(14, 'GK')]).toEqual([true, true, true, true]);
        expect([at(17, 'PIVO'), at(17, 'ALA'), at(17, 'FIXO'), at(17, 'GK')]).toEqual([false, true, true, false]);
        expect([at(21, 'PIVO'), at(21, 'ALA'), at(21, 'FIXO')]).toEqual([false, false, true]);
        expect(at(22.5, 'FIXO')).toBe(false);
        // o ângulo continua valendo: da linha de fundo, colado na lateral, nada acende
        expect(inMaxZone(pitch.length - 1, 0.5, 0, pitch, 'FIXO')).toBe(false);
        // a tela usa a mesma regra (snapshot com o capitão fixo de bola a 20 m)
        const p: number[] = new Array(10 * SNAP_STRIDE).fill(0);
        p[3 * SNAP_STRIDE] = pitch.length - 20;
        p[3 * SNAP_STRIDE + 1] = y;
        const snap = { owner: 3, p, phase: 'play' as const };
        expect(maxCue(snap, 0, 3, 'FIXO', pitch)).toBe(true);
        expect(maxCue(snap, 0, 3, 'PIVO', pitch)).toBe(false);
    });

    it('golpe máximo de linha: na hora certa sai na hora, com o golpe do capitão; fora dela não sai sozinho', () => {
        // capitão no pivô: o fixo quase nunca chega na zona com a bola (formações da 0.9.5)
        const P = { ...A, captainUid: A.lineup[4].uid };
        const runP = (orders: MatchOrder[], seed: string) =>
            runMatch(FUTSAL_5, P, B, seed, { snapshots: false, orders });
        let checked = 0;
        for (let k = 0; k < 20 && checked < 2; k++) {
            const seed = `ag-max-${k}`;

            const at = firstCue(P, seed, (live) => {
                const cap = capOf(live);
                return live.state.ball.owner === cap.idx && cap.role !== 'GK' && inMaxZoneOf(live.state, cap);
            });
            if (at === null) continue;
            checked++;
            const r = runP([{ tick: at, team: 0, kind: 'max' }], seed);
            const hit = of(r.events, 'max')[0];
            expect(hit?.phase).toBe('hit');
            // na hora: o chute sai no tick seguinte ao da ordem, com a versão máxima do golpe dele
            expect(hit.tick - at).toBeLessThanOrEqual(2);
            const cap = r.roster[hit.by];
            expect(cap.captain).toBe(true);
            const shot = of(r.events, 'shot').find((e) => e.tick === hit.tick);
            expect(shot?.by).toBe(hit.by);
            const inst = P.lineup.find((p) => p.uid === cap.uid)!;
            expect(shot?.moveId).toBe(maxMoveOf(inst.moves, inst.speciesId));
            // 1 por partida
            expect(maxCharge(r.events, 0)).toEqual({ charge: 0, level: 0, active: false, used: true });

            // fora da hora certa (o capitão sem a bola): fica armada um instante; se não vier a hora, nada gasta
            const early = firstCue(P, seed, (live) => live.state.ball.owner !== capOf(live).idx);
            const r2 = runP([{ tick: early!, team: 0, kind: 'max' }], seed);
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
                return !!owner && owner.team === 1 && inMaxZoneOf(s, owner, 'GK');
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

    it('defesa máxima tocada na folga do botão, com o chute do rival já no ar: pega esse chute', () => {
        const H = { ...A, captainUid: A.lineup[0].uid };
        let checked = 0;
        for (let k = 0; k < 40 && checked < 2; k++) {
            const seed = `ag-gk-air-${k}`;
            // o rival chutou da zona e a bola ainda não passou pelo goleiro
            const at = firstCue(H, seed, (live) => {
                const s = live.state;
                const shot = s.ball.owner === null ? s.ball.shot : null;
                if (!shot || shot.gkChecked) return false;
                const by = s.players[shot.by];
                return by.team === 1 && inMaxZoneOf(s, by, 'GK');
            });
            if (at === null) continue;
            checked++;
            const r = runMatch(FUTSAL_5, H, B, seed, {
                snapshots: false,
                orders: [{ tick: at, team: 0, kind: 'max' }],
            });
            const start = of(r.events, 'max')[0];
            expect(start?.phase).toBe('start');
            expect(start.tick - at).toBeLessThanOrEqual(2);
        }
        expect(checked).toBeGreaterThan(0);
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

describe('golpe máximo em 3 níveis (?maximo3=1, golpe-maximo-niveis.md)', () => {
    const L = withConfig({ maxLevels: true });
    const at = (tick: number, e: Record<string, unknown>) =>
        ({ ...e, tick, half: 1, minute: 0 }) as unknown as MatchEvent;
    const tackles = (n: number, from: number) =>
        Array.from({ length: n }, (_, i) => at(from + i, { type: 'tackle', by: 1, victim: 6, success: true }));

    it('barra: 3 gomos de 12, o toque gasta tudo e ela volta a encher; sem chute, metade do nível de volta', () => {
        const per = AGENCY.maxLevelPts;
        expect(maxCharge(tackles(per - 1, 10), 0, Infinity, 5, true).level).toBe(0);
        expect(maxCharge(tackles(per, 10), 0, Infinity, 5, true).level).toBe(1);
        expect(maxCharge(tackles(3 * per + 5, 10), 0, Infinity, 5, true)).toMatchObject({ charge: 1, level: 3 });
        const hit = [...tackles(2 * per, 10), at(100, { type: 'max', team: 0, by: 1, phase: 'hit', level: 2, q: 2 })];
        expect(maxCharge(hit, 0, Infinity, 5, true)).toMatchObject({ charge: 0, level: 0, used: false });
        expect(maxCharge([...hit, ...tackles(per, 200)], 0, Infinity, 5, true).level).toBe(1);
        const miss = [
            ...tackles(3 * per, 10),
            at(100, { type: 'max', team: 0, by: 0, phase: 'start', level: 3, q: 1 }),
            at(200, { type: 'max', team: 0, by: 0, phase: 'miss', level: 3, q: 1 }),
        ];
        expect(maxCharge(miss, 0, Infinity, 5, true).charge).toBeCloseTo(AGENCY.maxRefund, 10);
    });

    it('a nota escala só a parte extra (perfeito 100%, bom 70%, fora 40%) e o N3 é o mais forte', () => {
        const n2 = AGENCY.maxLevelShot[2].power;
        expect(maxGraded(n2, 2)).toBe(n2);
        expect(maxGraded(n2, 1)).toBeCloseTo(1 + (n2 - 1) * 0.7, 10);
        expect(maxGraded(n2, 0)).toBeGreaterThan(1);
        // N2 perfeito = o máximo de 1 nível do motor 10
        expect(AGENCY.maxLevelShot[2]).toMatchObject(AGENCY.maxShot);
        const [, n1, , n3] = AGENCY.maxLevelShot;
        expect(n3.power > n1.power && n3.accuracy > n1.accuracy && n3.rivalReach < 1).toBe(true);
        expect(AGENCY.maxLevelGk[3].reach).toBeGreaterThan(AGENCY.maxLevelGk[1].reach);
    });

    it('no mesmo lance, perfeito sai mais forte que fora; ordem sem nota vale como bom; a barra volta a encher', () => {
        const P = { ...A, captainUid: A.lineup[4].uid };
        let checked = 0;
        for (let k = 0; k < 20 && checked < 2; k++) {
            const seed = `ag-lv-${k}`;
            const live = new LiveRunner(L, P, B, seed);
            let cue: number | null = null;
            while (!live.finished && cue === null) {
                const s = live.state;
                const cap = s.players.find((p) => p.team === 0 && p.captain)!;
                if (
                    s.phase === 'play' &&
                    maxCharge(s.events, 0, s.tick, 5, true).level >= 1 &&
                    s.ball.owner === cap.idx &&
                    inMaxZoneOf(s, cap)
                )
                    cue = s.tick;
                else live.step();
            }
            if (cue === null) continue;
            checked++;
            const level = maxCharge(live.state.events, 0, cue, 5, true).level;
            /** Velocidade da bola logo depois do chute máximo. */
            const shotSpeed = (q?: 0 | 1 | 2) => {
                const r = new LiveRunner(L, P, B, seed, [{ tick: cue!, team: 0, kind: 'max', q }]);
                while (!r.state.events.some((e) => e.type === 'max')) r.step();
                const hit = r.state.events.find((e) => e.type === 'max')!;
                expect(hit).toMatchObject({ phase: 'hit', level, q: q ?? 1 });
                return Math.hypot(r.state.ball.vel.x, r.state.ball.vel.y);
            };
            expect(shotSpeed(2)).toBeGreaterThan(shotSpeed(0));
            const run = (q?: 0 | 1 | 2) =>
                runMatch(L, P, B, seed, { snapshots: false, orders: [{ tick: cue, team: 0, kind: 'max', q }] });
            const noQ = run();
            expect(matchHash(noQ)).toBe(matchHash(run(1)));
            // gastou e voltou a encher: nada de "1 por partida"
            const c = maxCharge(noQ.events, 0, Infinity, 5, true);
            expect(c.used).toBe(false);
            expect(c.charge).toBeGreaterThan(0);
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('nota inválida não entra (Liga e Duelo passam pelo mesmo validOrder)', () => {
        const base = runMatch(L, A, B, 'ag-q');
        const bad = { tick: 30, team: 0, kind: 'max', q: 7 } as unknown as MatchOrder;
        expect(matchHash(runMatch(L, A, B, 'ag-q', { orders: [bad] }))).toBe(matchHash(base));
        expect(validOrder(bad)).toBe(false);
        expect(validOrder({ tick: 30, team: 0, kind: 'max', q: 2 })).toBe(true);
    });

    it('sem a bandeira, a ordem com nota é o golpe máximo de sempre (motor 10)', () => {
        const orders = (q?: 0 | 1 | 2): MatchOrder[] =>
            [3000, 3400, 3800].map((tick) => ({ tick, team: 0 as const, kind: 'max' as const, q }));
        const plain = runMatch(FUTSAL_5, A, B, 'ag-flag', { snapshots: false, orders: orders() });
        expect(matchHash(runMatch(FUTSAL_5, A, B, 'ag-flag', { snapshots: false, orders: orders(0) }))).toBe(
            matchHash(plain),
        );
    });
});
