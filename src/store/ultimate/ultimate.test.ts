import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '../../engine/config';
import { viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../../ui/rarity';
import {
    FICHAS,
    LEVEL_GAP,
    OBJECTIVES,
    OPEN_POINTS,
    PACK_INTERVAL_MS,
    PACK_MAX,
    PACK_SIZE,
    REPEAT_POINTS,
    STARTERS,
    TEAM_SIZE,
} from './rules';
import {
    canPlay,
    finishMatch,
    homeTeam,
    isRepeat,
    mergeUltimate,
    newUltimate,
    nextPackIn,
    openPack,
    packMetals,
    refill,
    rollPack,
    setMember,
    teamAverage,
    ultimateOf,
    ultimateRival,
} from './ultimate';

const H = PACK_INTERVAL_MS;
const T0 = 1_800_000_000_000;

describe('relógio dos pacotes (12 h, acumula 2)', () => {
    it('cheio, o relógio fica parado; abriu, conta 12 h do momento da abertura', () => {
        let u = newUltimate('a', T0);
        expect(refill(u, T0 + 100 * H)).toEqual({ packs: PACK_MAX, packAt: T0 + 100 * H });
        u = openPack(u, T0)!.u;
        u = openPack(u, T0)!.u;
        expect(u.packs).toBe(0);
        expect(openPack(u, T0 + H - 1)).toBeNull();
        expect(refill(u, T0 + H - 1).packs).toBe(0);
        expect(refill(u, T0 + H).packs).toBe(1);
        expect(nextPackIn(u, T0 + H / 2)).toBe(H / 2);
        // 36 h depois: só 2 (o terceiro não acumula) e o relógio para
        expect(refill(u, T0 + 3 * H)).toEqual({ packs: 2, packAt: T0 + 3 * H });
        expect(nextPackIn(u, T0 + 3 * H)).toBeNull();
    });

    it('o resto do tempo não se perde: 1 pacote em 18 h e o próximo 6 h depois', () => {
        const u = { packs: 0, packAt: T0 };
        const r = refill(u, T0 + 1.5 * H);
        expect(r).toEqual({ packs: 1, packAt: T0 + H });
        expect(nextPackIn(r, T0 + 1.5 * H)).toBe(H / 2);
    });

    it('relógio que voltou no tempo não dá nem tira pacote', () => {
        expect(refill({ packs: 1, packAt: T0 }, T0 - 5 * H)).toEqual({ packs: 1, packAt: T0 - 5 * H });
    });
});

describe('pacote Mini', () => {
    it(`piso: em ${PACK_SIZE} cartas sempre tem prata ou melhor`, () => {
        for (let i = 0; i < 400; i++) {
            const metals = packMetals(new Rng('piso', String(i)));
            expect(metals).toHaveLength(PACK_SIZE);
            expect(metals.some((m) => m !== 'bronze')).toBe(true);
        }
        // e a carta de verdade bate com o metal sorteado
        for (let i = 0; i < 60; i++) {
            const cards = rollPack({ salt: 'piso', opened: i, cards: [] });
            expect(cards.some((c) => metalOf(viewInstance(c).overall) !== 'bronze')).toBe(true);
        }
    });

    it('sem espécie repetida no pacote; os 2 pacotes iniciais montam um time sem repetir', () => {
        for (const salt of ['a', 'b', 'c', 'd', 'e', 'f']) {
            let u = newUltimate(salt, T0);
            u = openPack(u, T0)!.u;
            u = openPack(u, T0)!.u;
            expect(u.cards).toHaveLength(2 * PACK_SIZE);
            expect(new Set(u.cards.map((c) => c.speciesId)).size).toBe(2 * PACK_SIZE);
            expect(canPlay(u)).toBe(true);
            expect(u.team.order).toHaveLength(Math.min(TEAM_SIZE, 2 * PACK_SIZE));
            // capitão: o de melhor nota do 1º pacote (quem chegou primeiro); depois só muda se você trocar
            const best = Math.max(...u.cards.slice(0, PACK_SIZE).map((c) => viewInstance(c).overall));
            expect(viewInstance(u.cards.find((c) => c.uid === u.team.captainUid)!).overall).toBe(best);
        }
    });

    it('repetida não entra: vira pontos de pacote pelo metal', () => {
        let u = newUltimate('rep', T0);
        const first = rollPack(u);
        // a coleção já tem as mesmas cartas (mesma espécie e edição) e o time está cheio
        u = { ...u, cards: [...first, ...rollPack({ ...u, opened: 99 })], team: { ...u.team, order: [] } };
        u.cards.push(...rollPack({ ...u, opened: 98 }));
        const res = openPack({ ...u, opened: 0 }, T0)!;
        const want = res.pack.cards.map((c) =>
            isRepeat(u.cards, c) ? REPEAT_POINTS[metalOf(viewInstance(c).overall)] : 0,
        );
        expect(res.pack.points).toEqual(want);
        expect(want.some((p) => p > 0)).toBe(true);
        expect(res.u.packPoints).toBe(OPEN_POINTS + want.reduce((s, p) => s + p, 0));
        expect(res.u.cards.length).toBe(u.cards.length + want.filter((p) => p === 0).length);
    });

    it('mesma semente, mesmo pacote', () => {
        const u = newUltimate('det', T0);
        expect(rollPack(u)).toEqual(rollPack(u));
        expect(rollPack(u)).not.toEqual(rollPack({ ...u, opened: 1 }));
    });
});

describe('time e partida', () => {
    const ready = () => {
        let u = newUltimate('time', T0);
        u = openPack(u, T0)!.u;
        return openPack(u, T0)!.u;
    };

    it('trocar com a coleção tira o capitão que saiu; trocar dentro do time só muda o lugar', () => {
        const u = ready();
        const outsider = { ...u.cards[0], uid: 'fora' };
        const t = setMember(u.team, 0, outsider.uid);
        expect(t.order[0]).toBe('fora');
        expect(t.captainUid).toBeNull();
        const swapped = setMember(u.team, 0, u.team.order[3]);
        expect(swapped.order.slice(0, 4)).toEqual([u.team.order[3], u.team.order[1], u.team.order[2], u.team.order[0]]);
        expect(swapped.captainUid).toBe(u.team.captainUid);
    });

    it('o rival acompanha a média do seu time: mais difícil = rival mais forte', () => {
        const u = ready();
        const avg = teamAverage(homeTeam(u, 'Eu', 0));
        const avgs = (['facil', 'normal', 'dificil', 'mestre'] as const).map((lv) =>
            teamAverage(ultimateRival(u.salt, 0, lv, avg)),
        );
        expect(avgs[0]).toBeLessThanOrEqual(avgs[1]);
        expect(avgs[1]).toBeLessThanOrEqual(avgs[3]);
        expect(Math.abs(avgs[1] - avg)).toBeLessThan(Math.abs(avgs[0] - avg) + 1 + Math.abs(LEVEL_GAP.facil));
        // o clube é o mesmo em todo nível (só a força muda)
        expect(new Set((['facil', 'mestre'] as const).map((lv) => ultimateRival(u.salt, 0, lv, avg).name)).size).toBe(
            1,
        );
        expect(homeTeam(u, 'Eu', 0).lineup).toHaveLength(STARTERS);
    });

    it('Fichas por nível e resultado; o mais difícil paga mais e nenhum paga zero', () => {
        for (const lv of ['facil', 'normal', 'dificil', 'mestre'] as const)
            for (const [score, outcome] of [
                [[3, 1], 'win'],
                [[2, 2], 'draw'],
                [[0, 1], 'loss'],
            ] as const) {
                const u = ready();
                const live = {
                    n: 0,
                    level: lv,
                    home: homeTeam(u, 'Eu', 0),
                    rival: ultimateRival(u.salt, 0, lv, 60),
                    orders: [],
                    tick: 0,
                    engine: ENGINE_VERSION,
                };
                const out = finishMatch({ ...u, live, fichas: 7 }, { score, shootout: null }, T0);
                // + o que os objetivos do dia pagaram (vencer 1 paga Fichas na hora)
                const bonus = (out.last?.objectives ?? []).reduce(
                    (s, id) => s + OBJECTIVES.find((o) => o.id === id)!.fichas,
                    0,
                );
                expect(out.fichas).toBe(7 + FICHAS[lv][outcome] + bonus);
                expect(out.last).toMatchObject({ outcome, level: lv, fichas: FICHAS[lv][outcome], seen: false });
                expect(out.live).toBeNull();
                expect(out.played).toBe(1);
                expect(FICHAS[lv][outcome]).toBeGreaterThan(0);
            }
        expect(FICHAS.facil.win).toBeLessThan(FICHAS.normal.win);
        expect(FICHAS.normal.win).toBeLessThan(FICHAS.dificil.win);
        expect(FICHAS.dificil.win).toBeLessThan(FICHAS.mestre.win);
        // sem partida aberta (apito final repetido), nada muda
        const u = ready();
        expect(finishMatch(u, { score: [5, 0], shootout: null }, T0)).toBe(u);
    });
});

describe('save', () => {
    it('fatia estragada ou ausente vira uma nova, sem derrubar o resto', () => {
        expect(ultimateOf(undefined).cards).toEqual([]);
        expect(ultimateOf('x').packs).toBe(PACK_MAX);
        const u = ultimateOf({ salt: 's', cards: [null, { uid: 1 }], fichas: -5, packs: 9, team: { order: ['nada'] } });
        expect(u).toMatchObject({ salt: 's', cards: [], fichas: 0, packs: PACK_MAX });
        expect(u.team.order).toEqual([]);
    });

    it('volta igual do JSON', () => {
        const u = openPack(newUltimate('json', T0), T0)!.u;
        expect(ultimateOf(JSON.parse(JSON.stringify(u)))).toEqual(u);
    });

    it('nuvem x aparelho: fica o que andou mais', () => {
        const a = newUltimate('a', T0);
        const b = openPack(newUltimate('b', T0), T0)!.u;
        expect(mergeUltimate(a, b).salt).toBe('b');
        expect(mergeUltimate(b, a).salt).toBe('b');
        expect(mergeUltimate(a, newUltimate('c', T0)).salt).toBe('a');
    });
});
