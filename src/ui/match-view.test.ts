import { describe, expect, it } from 'vitest';
import { inMaxZone, maxCallCue, maxCharge } from '../engine/agency';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { createInstance } from '../engine/instance';
import { cardAttributes } from '../engine/modifiers';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { Action, type MatchEvent, type MatchSnapshot, SNAP_STRIDE, type TeamSetup } from '../engine/state';
import { maxCueAt } from './components/Sideline';
import {
    captainAt,
    DRIBBLE_KINDS,
    diveDust,
    dribblePose,
    dribbleSlowAt,
    FACE_HOLD_MS,
    GOAL_REACTION_TICKS,
    goalReactionAt,
    goalReactions,
    halftimeEnd,
    holdFacing,
    keeperFacing,
    MAX_CUE_EARLY,
    type MaxWait,
    maxCallCueNear,
    maxHitAhead,
    maxOrderTick,
    maxWaitNext,
    NAMED_DRIBBLE,
    type NamedDribble,
    namedDribbles,
    namedDribblesOf,
    SAVE_DIVE,
    SOLD_LEAN,
    saveDivePose,
    snapAt,
    soldDiveEnd,
    soldDivePose,
    soldDives,
    whoAt,
} from './match-view';

const team = (seed: string, name: string): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 0),
    tactic: 'balanced',
    color: 0,
});

describe('saída do intervalo', () => {
    // a prancheta recalcula de 10 em 10 ticks: no começo do 2º tempo ela já mostra quem entrou (antes da 0.8.6 a
    // reprodução passava ~2 s do intervalo parado com quem saiu na prancheta). O tick do intervalo varia por partida.
    it.each([5, 2, 7])('o 2º tempo começa já armado, com a troca do vestiário em quadra (seed %i)', (seed) => {
        const home = { ...team(`sub-a${seed}`, 'A'), manualSubs: true };
        const away = team(`sub-b${seed}`, 'B');
        const base = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
        const ht = base.events.find((e) => e.type === 'halftime')?.tick ?? 0;
        const [out, inn] = [home.lineup[2], home.bench[0]];
        const r = runMatch(FUTSAL_5, home, away, seed, {
            orders: [{ tick: ht + 1, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const end = halftimeEnd(r.snapshots, ht);
        expect(end).toBeGreaterThan(ht);
        expect(r.snapshots.find((s) => s.tick === end)?.phase).not.toBe('halftime');
        const idx = r.roster.findIndex((p) => p.uid === out.uid);
        expect(whoAt(r, [home, away], idx, Math.floor(end / 10) * 10).inst?.uid).toBe(inn.uid);
    });
});

describe('capitão na partida (cara dos emotes e pose do "Vamooo!")', () => {
    const home = { ...team('cap-a', 'A'), manualSubs: true };
    const away = team('cap-b', 'B');
    const cap = home.lineup.find((p) => p.uid === home.captainUid) ?? home.lineup[0];
    const capIdx = home.lineup.indexOf(cap);
    const fake = (events: unknown[]) =>
        ({
            roster: [
                ...home.lineup.map((p, i) => ({ idx: i, team: 0, uid: p.uid })),
                ...away.lineup.map((p, i) => ({ idx: 5 + i, team: 1, uid: p.uid })),
            ],
            events,
        }) as unknown as Parameters<typeof captainAt>[0];

    it('o capitão que evolui no meio da partida passa a ter a cara da forma nova', () => {
        const m = fake([{ type: 'evolve', tick: 100, team: 0, uid: cap.uid, from: cap.speciesId, into: 999 }]);
        expect(captainAt(m, [home, away], 0, 99).speciesId).toBe(cap.speciesId);
        expect(captainAt(m, [home, away], 0, 100).speciesId).toBe(999);
    });

    it('a pose só vale com ele em quadra: saiu numa troca, sem vaga', () => {
        const m = fake([{ type: 'sub', tick: 50, team: 0, outUid: cap.uid, inUid: home.bench[0].uid, outIdx: capIdx }]);
        expect(captainAt(m, [home, away], 0, 49).idx).toBe(capIdx);
        expect(captainAt(m, [home, away], 0, 50).idx).toBeNull();
    });
});

describe('"Esperar" no golpe máximo (maxWaitNext)', () => {
    /** Passa a barra e a hora certa quadro a quadro; devolve se o aviso estava apagado em cada um. */
    const run = (from: number, frames: [level: number, cue: boolean][]) => {
        let w: MaxWait | null = { level: from };
        return frames.map(([level, cue]) => {
            w = maxWaitNext(w, level, cue);
            return w !== null;
        });
    };

    it('N1 e N2: apaga até a barra subir de nível, mesmo passando por outras horas certas', () => {
        for (const lv of [1, 2])
            expect(
                run(lv, [
                    [lv, true],
                    [lv, false],
                    [lv, true],
                    [lv + 1, true],
                    [lv + 1, true],
                ]),
            ).toEqual([true, true, true, false, false]);
    });

    it('N3: pula só esta hora certa; a próxima janela acende de novo', () => {
        expect(
            run(3, [
                [3, true],
                [3, true],
                [3, false],
                [3, true],
            ]),
        ).toEqual([true, true, false, false]);
    });

    it('golpe usado (a barra zera): o "Esperar" acaba', () => {
        expect(maxWaitNext({ level: 2 }, 0, false)).toBeNull();
        expect(maxWaitNext(null, 1, true)).toBeNull();
    });
});

describe('botão do golpe máximo (chamar o capitão e a hora certa)', () => {
    const home = team('cue-a', 'A');
    const away = team('cue-b', 'B');
    const { pitch } = FUTSAL_5;

    it('o passe no ar não apaga o "chamar": vale o último dono da bola (o botão piscava a cada passe)', () => {
        const r = runMatch(FUTSAL_5, { ...home, captainUid: home.lineup[1].uid }, away, 'cue-call');
        let checked = 0;
        for (let i = 1; i < r.snapshots.length && checked < 5; i++) {
            const [prev, s] = [r.snapshots[i - 1], r.snapshots[i]];
            if (s.phase !== 'play' || s.owner >= 0 || !maxCallCue(prev, 0, 'FIXO', pitch)) continue;
            expect(maxCallCue(s, 0, 'FIXO', pitch)).toBe(false);
            expect(maxCallCueNear(r.snapshots, s.tick, 0, 'FIXO')).toBe(true);
            checked++;
        }
        expect(checked).toBe(5);
        // bola do rival: apaga na hora
        const rival = r.snapshots.find((s) => s.phase === 'play' && s.owner >= 5);
        expect(rival && maxCallCueNear(r.snapshots, rival.tick, 0, 'FIXO')).toBe(false);
    });

    it('goleiro capitão: a bicuda acende do N1 só no chute que ele alcança; o de linha diz se é "chamando" ou a hora certa', () => {
        const gk = { ...home, captainUid: home.lineup[0].uid };
        const r = runMatch(FUTSAL_5, gk, away, 'cue-gk');
        const setups: [TeamSetup, TeamSetup] = [gk, away];
        const ready = r.snapshots.filter((s) => maxCharge(r.events, 0, s.tick, 5).level >= 1);
        const reach = r.events.filter(
            (e): e is Extract<MatchEvent, { type: 'gkReach' }> => e.type === 'gkReach' && e.by === 0,
        );
        const lit = reach.filter((e) => maxCharge(r.events, 0, e.from, 5).level >= 1);
        expect(lit.length).toBeGreaterThan(0);
        for (const e of lit) expect(maxCueAt(r, setups, 0, e.from)).toBe('hora');
        // aceso só em volta de um chute que ele alcança (a tela acende um pouco antes e apaga no toque dele na bola)
        const near = (t: number) => reach.some((e) => t >= e.from - MAX_CUE_EARLY && t < e.tick);
        for (const e of lit) expect(maxCueAt(r, setups, 0, e.tick)).toBe(near(e.tick) && 'hora');
        for (const s of ready) if (maxCueAt(r, setups, 0, s.tick) === 'hora') expect(near(s.tick)).toBe(true);
        // antes do chute, só com o rival com a bola na zona do goleiro (fora dela o motor não arma: o toque se perdia)
        const early = ready.filter(
            (s) => maxCueAt(r, setups, 0, s.tick) === 'hora' && !reach.some((e) => s.tick >= e.from && s.tick < e.tick),
        );
        for (const s of early) {
            expect(s.owner).toBeGreaterThanOrEqual(5);
            expect(inMaxZone(s.p[s.owner * SNAP_STRIDE], s.p[s.owner * SNAP_STRIDE + 1], 1, FUTSAL_5.pitch, 'GK')).toBe(
                true,
            );
        }
        // e o chute de longe (o rival fora da zona antes de chutar) acende só no chute
        const far = lit.filter((e) => {
            const s = snapAt(r.snapshots, e.from - 1);
            return (
                s.phase === 'play' &&
                s.owner >= 5 &&
                !reach.some((x) => e.from - 1 >= x.from && e.from - 1 < x.tick) &&
                !inMaxZone(s.p[s.owner * SNAP_STRIDE], s.p[s.owner * SNAP_STRIDE + 1], 1, FUTSAL_5.pitch, 'GK')
            );
        });
        expect(far.length).toBeGreaterThan(0);
        for (const e of far) expect(maxCueAt(r, setups, 0, e.from - 1)).toBe(false);
        // e o chute bloqueado não acende
        const blocked = r.events.filter((e) => e.type === 'block' && e.shooter >= 5 && !near(e.tick));
        expect(blocked.length).toBeGreaterThan(0);
        for (const e of blocked) expect(maxCueAt(r, setups, 0, e.tick)).toBe(false);
        // o goleiro não "chama": fora do chute vindo, apagado
        expect(new Set(ready.map((s) => maxCueAt(r, setups, 0, s.tick)))).toEqual(new Set([false, 'hora']));

        const line = { ...home, captainUid: home.lineup[3].uid };
        const r2 = runMatch(FUTSAL_5, line, away, 'cue-line');
        const kinds = new Set(r2.snapshots.map((s) => maxCueAt(r2, [line, away], 0, s.tick)));
        expect(kinds).toEqual(new Set([false, 'call', 'hora']));
    });

    it('na Copa só acende com o chute certo: bola no pé do capitão na zona, e o toque sempre solta (Miguel, 02/11)', () => {
        const line = { ...home, captainUid: home.lineup[3].uid };
        const setups: [TeamSetup, TeamSetup] = [line, away];
        const r = runMatch(FUTSAL_5, line, away, 'cue-line');
        // o botão do Duelo ("chamar", o antes e o resto da hora certa) acende sem a bola no pé dele
        expect(r.snapshots.some((s) => maxCueAt(r, setups, 0, s.tick) && s.owner !== 3)).toBe(true);
        const lit = r.snapshots.filter((s) => maxCueAt(r, setups, 0, s.tick, true) === 'hora');
        expect(lit.length).toBeGreaterThan(3);
        for (const s of lit) expect(s.owner).toBe(3);
        // o quadro da tela é fracionário: aceso nele, a ordem no `maxOrderTick` solta o golpe no tick seguinte
        for (const s of lit.filter((_, i) => i % Math.ceil(lit.length / 4) === 0)) {
            const t = s.tick - 0.5;
            expect(maxCueAt(r, setups, 0, t, true)).toBe('hora');
            const at = maxOrderTick(t);
            const o = runMatch(FUTSAL_5, line, away, 'cue-line', { orders: [{ tick: at, team: 0, kind: 'max' }] });
            const hit = o.events.find((e) => e.type === 'max' && e.team === 0 && e.tick > at);
            expect(hit).toMatchObject({ phase: 'hit', by: 3, tick: at + 1 });
        }
    });
});

describe('câmera lenta chegando no golpe máximo (maxHitAhead)', () => {
    // o do rival não tem botão: antes chegava em 8x e só desacelerava depois do chute (Miguel, 08/11/2026)
    it('vale pro golpe do rival, nos ticks antes do chute, e não depois nem na carga (maxArm)', () => {
        const ev: MatchEvent[] = [
            { tick: 60, half: 1, minute: 3, type: 'maxArm', team: 1, on: true },
            { tick: 100, half: 1, minute: 5, type: 'max', team: 1, by: 9, phase: 'hit', moveId: null, level: 2, q: 1 },
        ];
        expect(maxHitAhead(ev, 88, 12)).toBe(true);
        expect(maxHitAhead(ev, 100, 12)).toBe(true);
        expect(maxHitAhead(ev, 87, 12)).toBe(false);
        expect(maxHitAhead(ev, 101, 12)).toBe(false);
        expect(maxHitAhead(ev.slice(0, 1), 55, 12)).toBe(false);
    });
});

describe('goleiro na tela (o motor fica igual)', () => {
    const FACING_X = [0, 1, 1, 1, 0, -1, -1, -1];
    // de frente pro campo ou na diagonal de baixo: nunca virado pro gol, nem pra cima (a câmera vê as costas)
    const ofKeeper = (front: 1 | -1) => (front > 0 ? [1, 2] : [6, 7]);
    const matches = [1, 2, 3].map((seed) =>
        runMatch(FUTSAL_5, team(`gk-a${seed}`, 'A'), team(`gk-b${seed}`, 'B'), seed),
    );

    it('nunca aparece de costas na área, nem no recuo pra linha', () => {
        const L = FUTSAL_5.pitch.length;
        let recuos = 0;
        for (const r of matches)
            for (const s of r.snapshots)
                for (const [gk, front] of [
                    [0, 1],
                    [FUTSAL_5.teamSize, -1],
                ] as const) {
                    const o = gk * SNAP_STRIDE;
                    const [x, y, facing] = [s.p[o], s.p[o + 1], s.p[o + 2]];
                    if ((front > 0 ? x : L - x) >= 6) continue;
                    if (FACING_X[facing] * front < 0) recuos++;
                    const f = keeperFacing(facing, front, { x: s.bx - x, y: s.by - y });
                    expect(ofKeeper(front)).toContain(f);
                }
        // o motor vira o goleiro de costas quando ele corre pra linha: é isso que a tela desfaz
        expect(recuos).toBeGreaterThan(0);
        // em toda direção do motor, com a bola em qualquer lugar (até atrás dele)
        for (let facing = 0; facing < 8; facing++)
            for (const toBall of [
                { x: -1, y: 0.3 },
                { x: 0, y: -2 },
                { x: 0, y: 2 },
                { x: 0, y: 0 },
            ]) {
                expect(ofKeeper(1)).toContain(keeperFacing(facing, 1, toBall));
                expect(ofKeeper(-1)).toContain(keeperFacing(facing, -1, toBall));
            }
    });

    it('gol com o goleiro mergulhando vira mergulho vendido no lugar, de frente pro campo, sem abrir o gol', () => {
        let gols = 0;
        for (const r of matches) {
            const sold = soldDives(r.snapshots, r.events, FUTSAL_5.teamSize);
            for (const e of r.events) {
                if (e.type !== 'goal' || e.ownGoal) continue;
                const gk = (1 - e.team) * FUTSAL_5.teamSize;
                const diving = (s: MatchSnapshot) => s.p[gk * SNAP_STRIDE + 3] === Action.Dive;
                const dove = r.snapshots.some((s) => s.tick <= e.tick && s.tick >= e.tick - 16 && diving(s));
                const d = sold.find((x) => x.goal === e.tick);
                expect(!!d).toBe(dove);
                if (!d) continue;
                gols++;
                expect(d.gk).toBe(gk);
                const front = e.team === 1 ? 1 : -1;
                for (const toBall of [
                    { x: -12, y: 9 },
                    { x: 3, y: -40 },
                    { x: 0, y: 0 },
                ]) {
                    let peak = 0;
                    for (let t = d.tick - 10; t <= d.end + 10; t += 0.25) {
                        const pose = soldDivePose(d, t, front, toBall);
                        const s = r.snapshots.find((x) => x.tick >= t);
                        // o mergulho inteiro do motor (o Attack, que dava o bote pra fora) é dele
                        if (s && diving(s) && t >= d.tick && t <= d.end) expect(pose).not.toBeNull();
                        if (!pose) continue;
                        // estica pro lado da bola, mas no máximo 6 px: saindo pela lateral parecia abrir o gol
                        const off = Math.hypot(pose.x, pose.y);
                        expect(off).toBeLessThanOrEqual(SOLD_LEAN.px + 1e-9);
                        peak = Math.max(peak, off, Math.abs(pose.tilt));
                        expect(Math.abs(pose.tilt)).toBeLessThanOrEqual(SOLD_LEAN.tilt);
                        // de frente pro campo, na diagonal de baixo se a bola passa abaixo dele
                        expect(ofKeeper(front)).toContain(pose.facing);
                        expect([0, 1, 7].includes(pose.facing)).toBe(toBall.y >= 0);
                        // Reduzir movimento: só a pose, sem esticar nem inclinar
                        const calm = soldDivePose(d, t, front, toBall, true);
                        expect([calm?.x, calm?.y, calm?.tilt, calm?.sx].map((v) => Math.abs(v ?? 9))).toEqual([
                            0, 0, 0, 1,
                        ]);
                    }
                    // e o corpo mexe de verdade (parado parecia que ele nem tentou)
                    expect(peak).toBeGreaterThan(0.3);
                    // volta suave: no último tick da pose ele já está no lugar
                    expect(soldDivePose(d, soldDiveEnd(d), front, toBall)?.k).toBe(0);
                }
            }
        }
        expect(gols).toBeGreaterThan(0);
    });

    it('depois do gol sofrido o goleiro reage (~0,6 s), sem pisar no mergulho', () => {
        let n = 0;
        for (const r of matches) {
            const sold = soldDives(r.snapshots, r.events, FUTSAL_5.teamSize);
            const reacts = goalReactions(r.events, sold, (team) => team * FUTSAL_5.teamSize);
            for (const e of r.events) {
                if (e.type !== 'goal') continue;
                n++;
                const gk = (e.team === 0 ? 1 : 0) * FUTSAL_5.teamSize;
                const re = reacts.find((x) => x.gk === gk && x.from >= e.tick && x.from <= e.tick + 20);
                expect(re).toBeDefined();
                if (!re) continue;
                // nada antes do gol nem durante o mergulho vendido; depois, 0,6 s
                expect(goalReactionAt(re, e.tick)).toBeNull();
                const d = sold.find((x) => x.goal === e.tick);
                if (d) expect(goalReactionAt(re, soldDiveEnd(d))).toBeNull();
                expect(goalReactionAt(re, re.from + 1)).not.toBeNull();
                expect(goalReactionAt(re, re.from + GOAL_REACTION_TICKS + 1)).toBeNull();
                expect(GOAL_REACTION_TICKS / FUTSAL_5.tickRate).toBeCloseTo(0.6);
            }
        }
        expect(n).toBeGreaterThan(0);
    });

    it('vira no máximo uma vez a cada 150 ms (não treme entre duas direções)', () => {
        let h = null as ReturnType<typeof holdFacing> | null;
        const trocas: number[] = [];
        // o pedido alterna entre 1 e 2 a cada quadro de 16 ms por 2 s
        for (let now = 0; now < 2000; now += 16) {
            const prev = h?.facing;
            h = holdFacing(h, Math.floor(now / 16) % 2 ? 1 : 2, now);
            if (prev !== undefined && h.facing !== prev) trocas.push(now);
        }
        expect(trocas.length).toBeGreaterThan(0);
        for (let k = 1; k < trocas.length; k++) expect(trocas[k] - trocas[k - 1]).toBeGreaterThanOrEqual(FACE_HOLD_MS);
        // direção parada há tempo: a troca é na hora
        expect(holdFacing({ facing: 1, at: 0 }, 2, 1000).facing).toBe(2);
        expect(holdFacing({ facing: 1, at: 900 }, 2, 1000).facing).toBe(1);
    });
});

describe('mergulho da defesa (o mesmo do vendido, indo até a bola)', () => {
    it('inclina pro lado da bola, estica e chega nela no contato; Reduzir movimento só vai até a bola', () => {
        for (const to of [
            { x: 10, y: -20 },
            { x: -6, y: 30 },
            { x: 80, y: 0 },
        ]) {
            const hit = saveDivePose(0, to, 1);
            expect(hit).not.toBeNull();
            if (!hit) continue;
            const reach = Math.min(1, SAVE_DIVE.max / Math.hypot(to.x, to.y));
            expect(hit.x).toBeCloseTo(to.x * reach);
            expect(hit.y).toBeCloseTo(to.y * reach);
            expect(hit.tilt).toBeCloseTo(Math.sign(to.x) * SOLD_LEAN.tilt);
            expect(hit.sx).toBeGreaterThan(1);
            const calm = saveDivePose(0, to, 1, true);
            expect([calm?.tilt, calm?.sx, calm?.sy]).toEqual([0, 1, 1]);
            expect(calm?.x).toBeCloseTo(hit.x);
            // fora da janela do mergulho, nada
            expect(saveDivePose(-SAVE_DIVE.lead - 0.1, to, 1)).toBeNull();
            expect(saveDivePose(SAVE_DIVE.tail + 0.1, to, 1)).toBeNull();
        }
    });

    it('a poeirinha sai uma vez no contato, de novo voltando o replay, e nunca com Reduzir movimento', () => {
        let dusted = false;
        const fired: number[] = [];
        for (const tick of [8, 9, 10, 10.5, 11, 14, 7, 10, 12]) {
            const r = diveDust(dusted, tick, 10, false);
            dusted = r.dusted;
            if (r.fire) fired.push(tick);
        }
        expect(fired).toEqual([10, 10]);
        let calm = false;
        for (const tick of [9, 10, 11]) {
            const r = diveDust(calm, tick, 10, true);
            calm = r.dusted;
            expect(r.fire).toBe(false);
        }
    });

    it('toda defesa das partidas tem o mergulho com pó no contato', () => {
        let n = 0;
        for (const seed of [1, 2]) {
            const r = runMatch(FUTSAL_5, team(`sv-a${seed}`, 'A'), team(`sv-b${seed}`, 'B'), seed, {
                snapshots: false,
            });
            for (const e of r.events) {
                if (e.type !== 'save') continue;
                n++;
                expect(saveDivePose(0, { x: 5, y: 12 }, 1)).not.toBeNull();
                expect(diveDust(false, e.tick, e.tick, false).fire).toBe(true);
            }
        }
        expect(n).toBeGreaterThan(0);
    });
});

describe('dribles com nome (só tela)', () => {
    const dri = (seed: number) => {
        const home: TeamSetup = { ...team(`dr-a${seed}`, 'A') };
        const rng = new Rng(`dr-${seed}`, 'x');
        home.lineup = [25, 123, 53, 135, 151].map((id) => createInstance(id, rng));
        const away = team(`dr-b${seed}`, 'B');
        return { r: runMatch(FUTSAL_5, home, away, seed), setups: [home, away] as [TeamSetup, TeamSetup] };
    };
    const games = [1, 2, 3, 4, 5, 6].map(dri);
    const all =
        (dri: number, height = 1.5) =>
        () => ({ dri, height });

    it('só com DRI da carta a partir do corte, no máximo 2 por time, só em carrinho errado no ataque', () => {
        let total = 0;
        for (const { r, setups } of games) {
            expect(namedDribbles(r, all(NAMED_DRIBBLE.dri - 1))).toEqual([]);
            const list = namedDribbles(r, all(99));
            total += list.length;
            for (const t of [0, 1]) expect(list.filter((d) => d.team === t).length).toBeLessThanOrEqual(2);
            for (const d of list) {
                const e = r.events.find((x) => x.type === 'tackle' && x.tick === d.tick && x.victim === d.by);
                expect(e?.type === 'tackle' && !e.success).toBe(true);
                expect(d.marker).toBe(e?.type === 'tackle' ? e.by : -1);
                const s = r.snapshots.find((x) => x.tick >= d.tick);
                const x = s?.p[d.by * SNAP_STRIDE] ?? 0;
                const toGoal = d.team === 0 ? FUTSAL_5.pitch.length - x : x;
                expect(toGoal).toBeLessThanOrEqual(FUTSAL_5.pitch.length * NAMED_DRIBBLE.zone + 0.5);
            }
            // a carta de verdade: quem driblou com nome tem DRI de 80 pra cima
            for (const d of namedDribblesOf(r, setups)) {
                const inst = whoAt(r, setups, d.by, d.tick).inst;
                expect(inst && cardAttributes(inst).field.dribble).toBeGreaterThanOrEqual(NAMED_DRIBBLE.dri);
            }
        }
        expect(total).toBeGreaterThan(0);
    });

    it('a variação sai do lance (mesma partida, mesmo drible) e o tamanho do marcador decide roleta ou lambreta', () => {
        for (const { r } of games) {
            const tall = namedDribbles(r, all(99, 2));
            expect(namedDribbles(r, all(99, 2))).toEqual(tall);
            const short = namedDribbles(r, all(99, 0.4));
            expect(short.map((d) => d.tick)).toEqual(tall.map((d) => d.tick));
            for (const [i, d] of tall.entries()) {
                expect(['elastico', 'roleta']).toContain(d.kind);
                expect(short[i].kind).toBe(d.kind === 'roleta' ? 'lambreta' : 'elastico');
            }
        }
    });

    it('câmera lenta de 1 a 1,25 s de tela só na 1x; em 2x pra cima nunca', () => {
        const d = { tick: 400 } as NamedDribble;
        // tempo de tela da janela lenta: 1 tick = 50 ms na 1x
        let ms = 0;
        for (let t = 380; t < 420; t += 0.01) {
            const f = dribbleSlowAt([d], t, 1);
            expect(f).toBeGreaterThanOrEqual(NAMED_DRIBBLE.slow);
            if (f < 1) ms += (0.01 * 50) / f;
        }
        expect(ms).toBeGreaterThan(1000);
        expect(ms).toBeLessThan(1250);
        expect(dribbleSlowAt([d], 400, 1)).toBe(NAMED_DRIBBLE.slow);
        expect(dribbleSlowAt([d], 300, 1)).toBe(1);
        for (const speed of [2, 4, 8, 16, 64, 'highlights'])
            for (let t = 390; t < 410; t += 0.5) expect(dribbleSlowAt([d], t, speed)).toBe(1);
    });

    it('a animação só enfeita: sai e volta pro snapshot, e com Reduzir movimento é só o nome', () => {
        const toBall = { x: 9, y: 2 };
        const N = NAMED_DRIBBLE;
        for (const kind of DRIBBLE_KINDS) {
            const d: NamedDribble = { tick: 100, by: 1, marker: 6, team: 0, kind, dir: { x: 1, y: 0 }, side: 1 };
            expect(dribblePose(d, 100, toBall, true)).toBeNull();
            expect(dribblePose(d, 100 - N.lead, toBall)).toBeNull();
            expect(dribblePose(d, 100 + N.tail, toBall)).toBeNull();
            let peak = 0;
            let spin = 0;
            for (let t = 100 - N.lead; t <= 100 + N.tail; t += 0.05) {
                const p = dribblePose(d, t, toBall);
                if (!p) continue;
                peak = Math.max(peak, Math.hypot(p.ball.x, p.ball.y), p.lift);
                spin = Math.max(spin, Math.abs(p.spin));
                // perto das pontas, quase no snapshot (sem pulo quando a pose some)
                const edge = Math.min(t - (100 - N.lead), 100 + N.tail - t);
                if (edge < 0.1)
                    for (const v of [p.ball.x, p.ball.y, p.body.x, p.body.y, p.lift, p.markerBody.x, p.markerBody.y])
                        expect(Math.abs(v)).toBeLessThan(1.5);
            }
            expect(peak).toBeGreaterThan(5);
            if (kind === 'roleta') expect(spin).toBe(8);
        }
    });
});
