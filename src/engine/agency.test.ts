import { describe, expect, it } from 'vitest';
import { AGENCY, inMaxZone, maxCallCue, maxCharge, maxCue, maxGraded } from './agency';
import { FUTSAL_5, withConfig } from './config';
import { AIController } from './controllers/ai-controller';
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

    /** Primeiro tick (com o 1º gomo cheio) em que `cue` vale, andando a partida sem ordem nenhuma. */
    function firstCue(home: TeamSetup, seed: string, cue: (live: LiveRunner) => boolean, from = 0, minLevel = 1) {
        const live = new LiveRunner(FUTSAL_5, home, B, seed);
        while (!live.finished) {
            const s = live.state;
            if (s.tick >= from && s.phase === 'play' && maxCharge(s.events, 0, s.tick).level >= minLevel && cue(live))
                return s.tick;
            live.step();
        }
        return null;
    }
    const capOf = (live: LiveRunner) => live.state.players.find((p) => p.team === 0 && p.captain)!;

    it('zona do golpe máximo pela posição do capitão: pivô e ala 18 m, fixo 22 m (o goleiro, 15 m do rival)', () => {
        const { pitch } = FUTSAL_5;
        const y = pitch.width / 2;
        // time 0 ataca o gol de x = 40: d metros do gol, de frente
        const at = (d: number, role: Parameters<typeof inMaxZone>[4]) => inMaxZone(pitch.length - d, y, 0, pitch, role);
        expect([at(14, 'PIVO'), at(14, 'ALA'), at(14, 'FIXO'), at(14, 'GK')]).toEqual([true, true, true, true]);
        expect([at(17, 'PIVO'), at(17, 'ALA'), at(17, 'FIXO'), at(17, 'GK')]).toEqual([true, true, true, false]);
        // pivô 15 ⇒ 18 m (motor 15): a IA dele chuta de ~16 m
        expect([at(16, 'PIVO'), at(18.5, 'PIVO')]).toEqual([true, false]);
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

    it('chamar o capitão: o botão do capitão de linha acende em todo ataque do time, não no do rival nem no goleiro', () => {
        const { pitch } = FUTSAL_5;
        const p: number[] = new Array(10 * SNAP_STRIDE).fill(0);
        const snap = (owner: number, x: number) => {
            p[owner * SNAP_STRIDE] = x;
            return { owner, p, phase: 'play' as const };
        };
        // time 0 ataca o gol de x = 40: um companheiro (não o capitão) com a bola no campo de ataque
        expect(maxCallCue(snap(2, 25), 0, 'FIXO', pitch)).toBe(true);
        expect(maxCallCue(snap(2, 15), 0, 'FIXO', pitch)).toBe(false);
        // bola do rival, capitão goleiro, bola parada
        expect(maxCallCue(snap(7, 25), 0, 'PIVO', pitch)).toBe(false);
        expect(maxCallCue(snap(2, 25), 0, 'GK', pitch)).toBe(false);
        expect(maxCallCue({ ...snap(2, 25), phase: 'restart' }, 0, 'ALA', pitch)).toBe(false);
        // o time 1 ataca o gol de x = 0
        expect(maxCallCue(snap(7, 15), 1, 'ALA', pitch)).toBe(true);
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
            // gastou a barra toda (o próprio chute já começa a encher de novo)
            expect(maxCharge(r.events, 0, hit.tick).level).toBe(0);

            // fora da hora certa (o capitão sem a bola): fica armada um instante; se não vier a hora, nada gasta
            const early = firstCue(P, seed, (live) => live.state.ball.owner !== capOf(live).idx);
            const r2 = runP([{ tick: early!, team: 0, kind: 'max' }], seed);
            const hit2 = of(r2.events, 'max')[0];
            if (hit2) expect(hit2.tick - early!).toBeLessThanOrEqual(AGENCY.maxArmTicks);
            else expect(maxCharge(r2.events, 0, early! + AGENCY.maxArmTicks + 1).level).toBeGreaterThanOrEqual(1);

            // o toque um pouco antes de acender (a tela acende MAX_CUE_EARLY = 6 ticks antes) não se perde: sai no
            // próximo chute da zona
            const r3 = runP([{ tick: at - 6, team: 0, kind: 'max' }], seed);
            const hit3 = of(r3.events, 'max')[0];
            expect(hit3?.phase).toBe('hit');
            expect(hit3.tick - (at - 6)).toBeLessThanOrEqual(AGENCY.maxArmTicks);
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('bicuda (capitão no gol): armada já no N1, devolve o chute do rival que ele alcança', () => {
        const gkUid = A.lineup[0].uid;
        const H = { ...A, captainUid: gkUid };
        // já no N1 (até o motor 16 o goleiro só armava a defesa máxima no N3)
        const live = new LiveRunner(FUTSAL_5, H, B, 'ag-gk-n1');
        while (!live.finished && !live.state.teams[0].agency.max) {
            const s = live.state;
            if (s.phase === 'play' && maxCharge(s.events, 0, s.tick).level === 1)
                applyAgencyOrder(s, { tick: s.tick, team: 0, kind: 'max' });
            live.step();
        }
        expect(live.state.teams[0].agency.max?.level).toBe(1);
        let hits = 0;
        for (let k = 0; k < 40 && hits < 2; k++) {
            const seed = `ag-gk-air-${k}`;
            // a hora certa da tela: o chute do rival no alvo, ainda antes do goleiro
            const at = firstCue(H, seed, (l) => {
                const shot = l.state.ball.owner === null ? l.state.ball.shot : null;
                return !!shot && shot.onTarget && !shot.gkChecked && shot.by >= 5;
            });
            if (at === null) continue;
            const r = runMatch(FUTSAL_5, H, B, seed, {
                snapshots: false,
                orders: [{ tick: at, team: 0, kind: 'max' }],
            });
            const hit = of(r.events, 'max')[0];
            if (!hit || hit.tick - at > 30) continue;
            hits++;
            expect(r.roster[hit.by].uid).toBe(gkUid);
            // vale como defesa, no mesmo tick, e gasta a barra
            expect(of(r.events, 'save').some((e) => e.tick === hit.tick && e.by === hit.by)).toBe(true);
            expect(maxCharge(r.events, 0, hit.tick).level).toBe(0);
        }
        expect(hits).toBeGreaterThan(0);
    });

    it('fixo capitão chamado com a bola fora da zona: conduz pro gol em vez de tocar', () => {
        const probe = new LiveRunner(FUTSAL_5, A, B, 'ag-fixo');
        const fixoUid = probe.state.players.find((p) => p.team === 0 && p.role === 'FIXO')!.inst.uid;
        const live = new LiveRunner(FUTSAL_5, { ...A, captainUid: fixoUid }, B, 'ag-fixo');
        let checked = 0;
        while (!live.finished && checked < 3) {
            const s = live.state;
            const cap = capOf(live);
            if (
                s.phase === 'play' &&
                s.ball.owner === cap.idx &&
                cap.role === 'FIXO' &&
                !inMaxZoneOf(s, cap) &&
                !s.teams[0].agency.max &&
                maxCharge(s.events, 0, s.tick).level >= 1
            ) {
                const last = (c: ReturnType<AIController['decide']>) => (Array.isArray(c) ? c.at(-1)?.type : c.type);
                // cópia do estado (o structuredClone perde a classe do Rng)
                const clone = () => {
                    const c = structuredClone(s);
                    Object.setPrototypeOf(c.rng, Object.getPrototypeOf(s.rng));
                    return c;
                };
                // só os momentos em que, sem a ordem, ele tocaria (a bola voltava pro fixo e o time perdia 6,8 pp)
                if (last(new AIController(clone()).decide(cap.idx)) === 'pass') {
                    const st = clone();
                    applyAgencyOrder(st, { tick: st.tick, team: 0, kind: 'max' });
                    expect(last(new AIController(st).decide(cap.idx))).toBe('move');
                    checked++;
                }
            }
            live.step();
        }
        expect(checked).toBe(3);
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

describe('golpe máximo em 3 níveis (golpe-maximo-niveis.md)', () => {
    const at = (tick: number, e: Record<string, unknown>) =>
        ({ ...e, tick, half: 1, minute: 0 }) as unknown as MatchEvent;
    const tackles = (n: number, from: number) =>
        Array.from({ length: n }, (_, i) => at(from + i, { type: 'tackle', by: 1, victim: 6, success: true }));

    it('barra: 3 gomos, o toque gasta tudo e ela volta a encher', () => {
        const per = AGENCY.maxLevelPts;
        // só lances do meu time; perdendo enche mais rápido
        expect(maxCharge(tackles(4, 10), 1).charge).toBe(0);
        const goal = at(1, { type: 'goal', by: 6, assist: null, team: 1, score: [0, 1], ownGoal: false });
        expect(maxCharge([goal, ...tackles(4, 10)], 0).charge / maxCharge(tackles(4, 10), 0).charge).toBeCloseTo(
            AGENCY.maxBehind[1],
            10,
        );
        expect(maxCharge(tackles(per - 1, 10), 0).level).toBe(0);
        expect(maxCharge(tackles(per, 10), 0).level).toBe(1);
        expect(maxCharge(tackles(3 * per + 5, 10), 0)).toMatchObject({ charge: 1, level: 3 });
        const hit = [...tackles(2 * per, 10), at(100, { type: 'max', team: 0, by: 1, phase: 'hit', level: 2, q: 2 })];
        expect(maxCharge(hit, 0)).toMatchObject({ charge: 0, level: 0 });
        expect(maxCharge([...hit, ...tackles(per, 200)], 0).level).toBe(1);
    });

    it('a nota escala só a parte extra (perfeito 100%, bom 70%, fora 40%) e o N3 é o mais forte', () => {
        const n2 = AGENCY.maxLevelShot[2].power;
        expect(maxGraded(n2, 2)).toBe(n2);
        expect(maxGraded(n2, 1)).toBeCloseTo(1 + (n2 - 1) * 0.7, 10);
        expect(maxGraded(n2, 0)).toBeGreaterThan(1);
        const [, n1, , n3] = AGENCY.maxLevelShot;
        expect(n3.power > n1.power && n3.accuracy > n1.accuracy && n3.rivalReach < 1).toBe(true);
    });

    it('no mesmo lance, perfeito sai mais forte que fora; ordem sem nota vale como bom; a barra volta a encher', () => {
        const P = { ...A, captainUid: A.lineup[4].uid };
        let checked = 0;
        for (let k = 0; k < 20 && checked < 2; k++) {
            const seed = `ag-lv-${k}`;
            const live = new LiveRunner(FUTSAL_5, P, B, seed);
            let cue: number | null = null;
            while (!live.finished && cue === null) {
                const s = live.state;
                const cap = s.players.find((p) => p.team === 0 && p.captain)!;
                if (
                    s.phase === 'play' &&
                    maxCharge(s.events, 0, s.tick).level >= 1 &&
                    s.ball.owner === cap.idx &&
                    inMaxZoneOf(s, cap)
                )
                    cue = s.tick;
                else live.step();
            }
            if (cue === null) continue;
            checked++;
            const level = maxCharge(live.state.events, 0, cue).level;
            /** Velocidade da bola logo depois do chute máximo. */
            const shotSpeed = (q?: 0 | 1 | 2) => {
                const r = new LiveRunner(FUTSAL_5, P, B, seed, [{ tick: cue!, team: 0, kind: 'max', q }]);
                while (!r.state.events.some((e) => e.type === 'max')) r.step();
                const hit = r.state.events.find((e) => e.type === 'max')!;
                expect(hit).toMatchObject({ phase: 'hit', level, q: q ?? 1 });
                return Math.hypot(r.state.ball.vel.x, r.state.ball.vel.y);
            };
            expect(shotSpeed(2)).toBeGreaterThan(shotSpeed(0));
            const run = (q?: 0 | 1 | 2) =>
                runMatch(FUTSAL_5, P, B, seed, { snapshots: false, orders: [{ tick: cue, team: 0, kind: 'max', q }] });
            const noQ = run();
            expect(matchHash(noQ)).toBe(matchHash(run(1)));
            // gastou e voltou a encher: nada de "1 por partida"
            expect(maxCharge(noQ.events, 0).charge).toBeGreaterThan(0);
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('nota inválida não entra (Liga e Duelo passam pelo mesmo validOrder)', () => {
        const base = runMatch(FUTSAL_5, A, B, 'ag-q');
        const bad = { tick: 30, team: 0, kind: 'max', q: 7 } as unknown as MatchOrder;
        expect(matchHash(runMatch(FUTSAL_5, A, B, 'ag-q', { orders: [bad] }))).toBe(matchHash(base));
        expect(validOrder(bad)).toBe(false);
        expect(validOrder({ tick: 30, team: 0, kind: 'max', q: 2 })).toBe(true);
    });
});
