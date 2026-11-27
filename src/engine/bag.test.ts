import { describe, expect, it } from 'vitest';
import { BAG, bagLeft } from './bag';
import { FUTSAL_5 } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { eff } from './effective';
import { applyAgencyOrder, applyStatus, createMatch } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner, validOrder } from './runners/live-runner';
import type { MatchEvent, MatchOrder, TeamSetup } from './state';

function team(seed: string, name: string, extra: Partial<TeamSetup> = {}): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true, ...extra };
}
const A = team('bag-a', 'A', { bag: ['potion', 'xattack', 'xdefense', 'fullheal'] });
const B = team('bag-b', 'B');
const bagEvents = (evs: MatchEvent[]) => evs.filter((e) => e.type === 'bag');
/** Partida parada no começo (fase de jogo), pra aplicar a ordem na mão. */
function fresh(setup = A) {
    const s = createMatch(FUTSAL_5, setup, B, 'bag');
    s.phase = 'play';
    return s;
}

describe('Bolsa do técnico (itens-ativos.md, A1)', () => {
    it('Poção forte: o alvo volta a 100% e os outros ganham +15%', () => {
        const s = fresh();
        for (const p of s.players) p.energy = 0.4;
        const target = s.players[2];
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'potion', target: target.inst.uid });
        expect(target.energy).toBe(1);
        expect(
            s.players.filter((p) => p !== target && p.team === 0).every((p) => p.energy === 0.4 + BAG.potionTeam),
        ).toBe(true);
        expect(s.players.filter((p) => p.team === 1).every((p) => p.energy === 0.4)).toBe(true);
        expect(bagEvents(s.events)).toMatchObject([{ team: 0, item: 'potion', target: target.idx }]);
    });

    it('Poção sem alvo do time não vale (nem gasta o tempo)', () => {
        const s = fresh();
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'potion', target: s.players[7].inst.uid });
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'potion' });
        expect(bagEvents(s.events)).toHaveLength(0);
        expect(s.teams[0].agency.bagUsed).toEqual([null, null]);
    });

    it('X Attack: chute e drible x1,3 no time por 45 s; X Defense: desarme e posição x1,25, goleiro x1,1', () => {
        const s = fresh();
        const p = s.players[3];
        const before = { shot: eff(s, p, 'shooting'), drb: eff(s, p, 'dribble'), tck: eff(s, p, 'tackling') };
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'xattack' });
        expect(eff(s, p, 'shooting') / before.shot).toBeCloseTo(BAG.xAttack, 6);
        expect(eff(s, p, 'dribble') / before.drb).toBeCloseTo(BAG.xAttack, 6);
        expect(eff(s, p, 'tackling')).toBeCloseTo(before.tck, 6);
        expect(p.buffs.every((b) => b.timer === BAG.xTime)).toBe(true);
        // o rival não ganha nada
        expect(s.players[8].buffs).toHaveLength(0);

        const d = fresh();
        const gk = d.players.find((x) => x.team === 0 && x.role === 'GK')!;
        const q = d.players[3];
        const was = { tck: eff(d, q, 'tackling'), pos: eff(d, q, 'positioning'), gk: eff(d, gk, 'goalkeeping') };
        applyAgencyOrder(d, { tick: 0, team: 0, kind: 'bag', item: 'xdefense' });
        expect(eff(d, q, 'tackling') / was.tck).toBeCloseTo(BAG.xDefense, 6);
        expect(eff(d, q, 'positioning') / was.pos).toBeCloseTo(BAG.xDefense, 6);
        expect(eff(d, gk, 'goalkeeping') / was.gk).toBeCloseTo(BAG.xDefenseGk, 6);
    });

    it('Cura Total: tira status, enfraquecimento e Leech Seed do time e segura status de rival por um tempo', () => {
        const s = fresh();
        const p = s.players[1];
        const rival = s.players[6];
        applyStatus(s, p, 'par', rival.idx, 'thunderbolt');
        p.buffs.push({ attr: 'pace', factor: 0.8, timer: 5 }, { attr: 'shooting', factor: 1.2, timer: 5 });
        p.seeded = { by: rival.idx, timer: 5 };
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'fullheal' });
        expect(p.status).toBeNull();
        expect(p.seeded).toBeNull();
        expect(p.buffs.map((b) => b.factor)).toEqual([1.2]);
        expect(s.teams[0].screens.safeguard).toBe(BAG.safeguardTime);
        expect(applyStatus(s, p, 'brn', rival.idx, 'ember')).toBe(false);
        // o próprio (Rest) passa
        expect(applyStatus(s, p, 'slp', p.idx, 'rest')).toBe(true);
        // o rival não fica imune
        expect(applyStatus(s, rival, 'par', p.idx, 'thunderbolt')).toBe(true);
    });

    it('1 item por tempo: o 2º do mesmo tempo não vale, o do 2º tempo vale; item fora da Bolsa não vale', () => {
        const s = fresh();
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'xattack' });
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'xdefense' });
        expect(bagEvents(s.events)).toHaveLength(1);
        s.half = 2;
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'xattack' }); // só tinha 1 X Attack
        applyAgencyOrder(s, { tick: 0, team: 0, kind: 'bag', item: 'xdefense' });
        expect(bagEvents(s.events).map((e) => e.type === 'bag' && e.item)).toEqual(['xattack', 'xdefense']);
        expect(bagLeft(A.bag, s.teams[0].agency.bagUsed)).toEqual(['potion', 'fullheal']);
        // o rival não leva Bolsa: nada vale
        applyAgencyOrder(s, { tick: 0, team: 1, kind: 'bag', item: 'xattack' });
        // no intervalo também não
        const h = fresh();
        h.phase = 'halftime';
        applyAgencyOrder(h, { tick: 0, team: 0, kind: 'bag', item: 'xattack' });
        expect(bagEvents(s.events)).toHaveLength(2);
        expect(bagEvents(h.events)).toHaveLength(0);
    });

    it('sem ordem a partida é a de sempre, com ou sem Bolsa; a ordem fora da Bolsa também não muda nada', () => {
        const noBag = { ...A, bag: undefined };
        const base = runMatch(FUTSAL_5, noBag, B, 'bag-same');
        expect(matchHash(runMatch(FUTSAL_5, A, B, 'bag-same'))).toBe(matchHash(base));
        const ignored = runMatch(FUTSAL_5, noBag, B, 'bag-same', {
            orders: [{ tick: 900, team: 0, kind: 'bag', item: 'xattack' }],
        });
        expect(matchHash(ignored)).toBe(matchHash(base));
    });

    it('determinismo e replay: mesma seed e mesmas ordens dão o mesmo jogo, ao vivo ou de uma vez', () => {
        const orders: MatchOrder[] = [
            { tick: 1200, team: 0, kind: 'bag', item: 'xattack' },
            // no 2º tempo (o tempo tem 180 s × 20 ticks; o 2º item do mesmo tempo não valeria)
            { tick: 5200, team: 0, kind: 'bag', item: 'potion', target: A.lineup[3].uid },
        ];
        expect(orders.every(validOrder)).toBe(true);
        const a = runMatch(FUTSAL_5, A, B, 'bag-det', { orders });
        const b = runMatch(FUTSAL_5, A, B, 'bag-det', { orders });
        expect(matchHash(a)).toBe(matchHash(b));
        expect(bagEvents(a.events)).toHaveLength(2);
        expect(matchHash(a)).not.toBe(matchHash(runMatch(FUTSAL_5, A, B, 'bag-det')));
        // ao vivo, com as ordens chegando na hora (a tela da Copa), dá o mesmo jogo do replay
        const live = new LiveRunner(FUTSAL_5, A, B, 'bag-det');
        while (!live.finished) {
            for (const o of orders) if (o.tick === live.state.tick + 1) live.addOrder(o);
            live.step();
        }
        expect(live.state.score).toEqual(a.score);
        expect(live.state.events).toEqual(a.events);
    });

    it('ordem de item malformada não entra na agenda', () => {
        const bad = [
            { tick: 10, team: 0, kind: 'bag', item: 'masterball' },
            { tick: 10, team: 0, kind: 'bag', item: 'potion', target: 3 },
        ] as unknown as MatchOrder[];
        expect(bad.some(validOrder)).toBe(false);
    });
});
