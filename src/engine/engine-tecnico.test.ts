import { describe, expect, it } from 'vitest';
import { computeAttributes } from './attributes';
import { FUTSAL_5, segmentTicks } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { applyModifiers, attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner, validOrder } from './runners/live-runner';
import type { MatchOrder, Tactic, TeamSetup } from './state';

function team(seed: string, name: string): TeamSetup {
    const rng = new Rng(seed, 'team');
    return { name, ...aiDraftTeam(rng, 0), tactic: 'balanced', color: 0 };
}

describe('substituição pedida pelo técnico', () => {
    const home = { ...team('sub-a', 'A'), manualSubs: true };
    const away = team('sub-b', 'B');

    it('time do jogador não troca sozinho; a ordem entra na próxima bola parada', () => {
        const base = runMatch(FUTSAL_5, home, away, 5, { snapshots: false });
        expect(base.events.some((e) => e.type === 'sub' && e.team === 0)).toBe(false);

        const T = 1500;
        const out = home.lineup[2];
        const inn = home.bench[0];
        const r = runMatch(FUTSAL_5, home, away, 5, {
            snapshots: false,
            orders: [{ tick: T, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const sub = r.events.find((e) => e.type === 'sub' && e.team === 0);
        expect(sub && sub.type === 'sub' && sub.tick >= T).toBe(true);
        if (sub?.type !== 'sub') return;
        expect(sub.outUid).toBe(out.uid);
        expect(sub.inSpeciesId).toBe(inn.speciesId);
        // só em bola parada: logo depois dela vem reinício, saída de bola ou intervalo
        const before = r.events.filter((e) => e.tick < T);
        expect(before).toEqual(base.events.filter((e) => e.tick < T));
        expect(r.finalRoster.some((p) => p.uid === inn.uid)).toBe(true);
    });

    it('troca pedida no intervalo entra no vestiário, antes da saída de bola do 2º tempo', () => {
        const base = runMatch(FUTSAL_5, home, away, 5, { snapshots: false });
        const ht = base.events.find((e) => e.type === 'halftime')?.tick ?? 0;
        const out = home.lineup[2];
        const inn = home.bench[0];
        const r = runMatch(FUTSAL_5, home, away, 5, {
            snapshots: false,
            orders: [{ tick: ht + 1, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const sub = r.events.find((e) => e.type === 'sub' && e.team === 0);
        const ko = r.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? 0;
        expect(sub?.tick).toBe(ht + 1);
        expect(sub && sub.tick < ko).toBe(true);
    });
});

describe('prancheta no meio da partida', () => {
    const home = { ...team('line-a', 'A'), manualSubs: true, formation: '1-2-1' as const };
    const away = team('line-b', 'B');
    const u = home.lineup.map((p) => p.uid);
    // goleiro vira pivô e o pivô vai pro gol, em 2-2
    const swap = [u[4], u[1], u[2], u[3], u[0]];

    /** Fase da partida sem ordem nenhuma no começo do tick `t`. */
    const phaseAt = (t: number) => {
        const r = new LiveRunner(FUTSAL_5, home, away, 7);
        while (r.state.tick < t) r.step();
        return r.state.phase;
    };

    it('entra na hora (volante): formação, vaga, posição e nota pela posição nova', () => {
        const base = runMatch(FUTSAL_5, home, away, 7, { snapshots: false });
        // primeiro tick com a bola rolando depois do minuto 1:00 de partida
        const probe = new LiveRunner(FUTSAL_5, home, away, 7);
        while (probe.state.tick < 1200 || probe.state.phase !== 'play') probe.step();
        const T = probe.state.tick;
        expect(phaseAt(T)).toBe('play');
        const orders: MatchOrder[] = [{ tick: T, team: 0, kind: 'lineup', formation: '2-2', order: swap }];
        const runner = new LiveRunner(FUTSAL_5, home, away, 7, orders);
        const s = runner.state;
        while (!runner.finished && !s.events.some((e) => e.type === 'lineup')) runner.step();
        const ev = s.events.find((e) => e.type === 'lineup');
        expect(ev?.tick).toBe(T);
        if (ev?.type !== 'lineup') return;
        // até a ordem, a partida é igual à sem ela
        expect(s.events.filter((e) => e.tick < T)).toEqual(base.events.filter((e) => e.tick < T));
        expect(s.phase).toBe('play');
        expect(ev).toMatchObject({ formation: '2-2', idx: [4, 1, 2, 3, 0] });
        expect(s.teams[0].formation.id).toBe('2-2');
        expect(s.teams[0].lineup.map((p) => p.uid)).toEqual(swap);
        const gk = s.players[4];
        expect([gk.slot, gk.role]).toEqual([0, 'GK']);
        expect([s.players[0].slot, s.players[0].role]).toEqual([4, 'PIVO']);
        expect(s.players[2].role).toBe('FIXO');
        // nota (atributos) recalculada pela posição nova, com a mesma regra da carta
        const mods = attributeModifiers(gk.inst, {
            lineup: s.teams[0].lineup,
            captain: s.teams[0].lineup.find((p) => p.uid === home.captainUid) ?? null,
            role: 'GK',
        });
        expect(gk.attr).toEqual(applyModifiers(computeAttributes(gk.sp, gk.inst.level), mods, 'GK'));
    });

    it('ordem inválida é recusada e não muda a partida', () => {
        const base = matchHash(runMatch(FUTSAL_5, home, away, 7, { snapshots: false }));
        const bad: MatchOrder[][] = [
            [{ tick: 900, team: 0, kind: 'lineup', formation: '2-2', order: [u[0], u[0], u[2], u[3], u[4]] }],
            [{ tick: 900, team: 0, kind: 'lineup', formation: '2-2', order: u.slice(0, 4) }],
            [{ tick: 900, team: 0, kind: 'lineup', formation: '9-9' as never, order: swap }],
            // quem não está em quadra (o reserva) não entra pela prancheta
            [{ tick: 900, team: 0, kind: 'lineup', formation: '2-2', order: [home.bench[0].uid, ...u.slice(1)] }],
        ];
        for (const orders of bad) {
            const r = runMatch(FUTSAL_5, home, away, 7, { snapshots: false, orders });
            expect(r.events.some((e) => e.type === 'lineup')).toBe(false);
            expect(matchHash(r)).toBe(base);
        }
        expect(validOrder(bad[0][0])).toBe(false);
        expect(validOrder(bad[2][0])).toBe(false);
        expect(validOrder({ tick: 900, team: 0, kind: 'lineup', formation: '2-2', order: swap })).toBe(true);
    });

    it('na bola parada a nova substitui a pendente; troca pendente com quem saiu vale pra quem entrou', () => {
        // logo depois de um gol (a comemoração para a bola): tudo espera a saída de bola
        const goal = runMatch(FUTSAL_5, home, away, 7, { snapshots: false }).events.find((e) => e.type === 'goal')!;
        const T = goal.tick + 5;
        expect(phaseAt(T + 2)).toBe('goal');
        const inn = home.bench[0].uid;
        const r = runMatch(FUTSAL_5, home, away, 7, {
            snapshots: false,
            orders: [
                { tick: T, team: 0, kind: 'lineup', formation: '2-2', order: swap },
                { tick: T + 1, team: 0, kind: 'sub', outUid: u[2], inUid: inn },
                { tick: T + 2, team: 0, kind: 'lineup', formation: '3-1', order: [u[0], u[2], u[1], u[3], u[4]] },
            ],
        });
        const lineups = r.events.filter((e) => e.type === 'lineup');
        expect(lineups).toHaveLength(1);
        const sub = r.events.find((e) => e.type === 'sub' && e.team === 0);
        expect(sub?.tick).toBe(lineups[0].tick);
        // quem entrou no lugar do u[2] foi pra vaga 1 (Ala do 3-1)
        expect(lineups[0]).toMatchObject({ formation: '3-1', idx: [0, 2, 1, 3, 4] });
        expect(r.finalRoster[2]).toMatchObject({ uid: inn, role: 'ALA' });
    });

    it('determinismo: mesma seed + mesmas ordens = mesma partida', () => {
        const orders: MatchOrder[] = [{ tick: 700, team: 0, kind: 'lineup', formation: 'ferrolho', order: swap }];
        const a = runMatch(FUTSAL_5, home, away, 'line-det', { orders });
        const b = runMatch(FUTSAL_5, home, away, 'line-det', { orders: [...orders] });
        expect(a.events.some((e) => e.type === 'lineup')).toBe(true);
        expect(matchHash(a)).toBe(matchHash(b));
        expect(matchHash(a)).not.toBe(matchHash(runMatch(FUTSAL_5, home, away, 'line-det')));
    });
});

describe('seed por trecho (duelo ao vivo)', () => {
    const home = team('seg-a', 'A');
    const away = team('seg-b', 'B');
    const seeds = Array.from({ length: 21 }, (_, k) => `trecho-${k}`);
    const play = (segmentSeeds?: string[]) => runMatch(FUTSAL_5, home, away, 'seg', { segmentSeeds });

    it('mesmas seeds dão a mesma partida, e o trecho dura 2 minutos (360 ticks de jogo)', () => {
        expect(segmentTicks(FUTSAL_5)).toBe(360);
        const a = play(seeds);
        expect(matchHash(play([...seeds]))).toBe(matchHash(a));
        // sem seeds por trecho é a partida de sempre (um stream só)
        expect(matchHash(play())).not.toBe(matchHash(a));
    });

    it('mudar só a seed do trecho 3 não muda nada antes dele', () => {
        const a = play(seeds);
        const b = play(seeds.map((x, k) => (k === 3 ? 'outra' : x)));
        // o trecho 3 começa no minuto 6 do relógio (ele para nas bolas paradas)
        const start = a.snapshots.find((sn) => sn.minute >= 6)!.tick;
        expect(b.snapshots.find((sn) => sn.minute >= 6)!.tick).toBe(start);
        const earlier = (r: typeof a) => ({
            events: r.events.filter((e) => e.tick < start),
            snaps: r.snapshots.filter((sn) => sn.tick < start),
        });
        expect(earlier(b)).toEqual(earlier(a));
        expect(matchHash(b)).not.toBe(matchHash(a));
    });
});

describe('ordens do técnico validadas no motor (duelo)', () => {
    const home = { ...team('ord-a', 'A'), manualSubs: true };
    const away = team('ord-b', 'B');
    const tactics = (r: ReturnType<typeof runMatch>) => r.events.filter((e) => e.type === 'tactic');

    it('a ordem do array não importa: vale (tick, time, seq)', () => {
        const orders: MatchOrder[] = [
            { tick: 600, team: 1, tactic: 'counter', seq: 0 },
            { tick: 600, team: 0, tactic: 'offensive', seq: 0 },
            { tick: 600, team: 0, tactic: 'defensive', seq: 1 },
            { tick: 900, team: 0, kind: 'sub', outUid: home.lineup[2].uid, inUid: home.bench[0].uid, seq: 2 },
        ];
        const a = runMatch(FUTSAL_5, home, away, 'ord', { orders });
        const b = runMatch(FUTSAL_5, home, away, 'ord', { orders: [...orders].reverse() });
        expect(matchHash(b)).toBe(matchHash(a));
        // no mesmo tick: time 0 antes do 1, e seq 0 antes do 1 (a última do time 0 é Retranca)
        expect(tactics(a).map((e) => (e.type === 'tactic' ? `${e.team}:${e.tactic}` : ''))).toEqual([
            '0:offensive',
            '0:defensive',
            '1:counter',
        ]);
    });

    it('ordem com o tick já passado é ignorada', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 'ord');
        for (let i = 0; i < 500; i++) live.step();
        expect(live.addOrder({ tick: 450, team: 0, tactic: 'offensive' })).toBe(false);
        expect(live.addOrder({ tick: live.state.tick, team: 0, tactic: 'offensive' })).toBe(true);
        live.step();
        expect(live.state.teams[0].tactic).toBe('offensive');
        // ordem inválida também não entra (time ou tática que não existem)
        expect(live.addOrder({ tick: 900, team: 2 as 0, tactic: 'offensive' })).toBe(false);
        expect(live.addOrder({ tick: 900, team: 0, tactic: 'parking' as 'offensive' })).toBe(false);
    });

    it('tática sem limite de trocas (a 4ª vale), e quem já entrou não entra de novo', () => {
        const seq: Tactic[] = ['offensive', 'defensive', 'counter', 'balanced'];
        const orders: MatchOrder[] = seq.map((tactic, i) => ({ tick: 300 + 300 * i, team: 0, tactic }));
        const [outA, outB] = [home.lineup[1].uid, home.lineup[2].uid];
        orders.push(
            { tick: 400, team: 0, kind: 'sub', outUid: outA, inUid: home.bench[0].uid },
            { tick: 2000, team: 0, kind: 'sub', outUid: outB, inUid: home.bench[0].uid },
        );
        const r = runMatch(FUTSAL_5, home, away, 'ord4', { orders });
        expect(tactics(r).map((e) => (e.type === 'tactic' ? e.tactic : ''))).toEqual(seq);
        expect(r.events.filter((e) => e.type === 'sub' && e.team === 0)).toHaveLength(1);
    });
});
