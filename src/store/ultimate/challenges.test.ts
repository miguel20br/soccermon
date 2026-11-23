import { describe, expect, it } from 'vitest';
import { SPECIES } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../../ui/rarity';
import {
    SBCS,
    sbcAccepts,
    sbcById,
    sbcCanDeliver,
    sbcDeliver,
    sbcOf,
    sbcPlace,
    sbcRemove,
    sbcStarters,
    sbcStatus,
} from './challenges';
import { canSell, newUltimate, toggleLock, type UltimateSave, ultimateOf } from './ultimate';

const T0 = 1_800_000_000_000;
const mk = (id: number, uid = `c${id}`): PokemonInstance => ({
    ...createInstance(id, new Rng('sbc', uid)),
    uid,
    shiny: false,
});
const metalIds = (m: string) => SPECIES.filter((s) => metalOf(viewInstance(mk(s.id)).overall) === m).map((s) => s.id);
const withCards = (cards: PokemonInstance[]): UltimateSave => ({ ...newUltimate('sbc', T0), cards });
const place = (u: UltimateSave, id: string, uids: string[]) => uids.reduce((x, uid) => sbcPlace(x, id, uid), u);

describe('Desafios de Montagem (0.9.54)', () => {
    it('todo desafio paga pelo menos um pacote, ids únicos', () => {
        expect(new Set(SBCS.map((s) => s.id)).size).toBe(SBCS.length);
        for (const s of SBCS) expect(s.prize.packs + s.prize.big).toBeGreaterThanOrEqual(1);
    });

    it('família: mesma linha evolutiva, espécies diferentes; iniciais: uma de cada família', () => {
        const fam = sbcById('familia')!.rule;
        expect(sbcAccepts(fam, [mk(4)], mk(5))).toBe(true);
        expect(sbcAccepts(fam, [mk(4)], mk(7))).toBe(false);
        expect(sbcAccepts(fam, [mk(4)], mk(4, 'outra'))).toBe(false);
        const ini = sbcById('iniciais')!.rule;
        expect(sbcAccepts(ini, [mk(1)], mk(2))).toBe(false);
        expect(sbcAccepts(ini, [mk(1)], mk(6))).toBe(true);
        expect(sbcAccepts(ini, [], mk(25))).toBe(false);
    });

    it('média: a pontuação-alvo conta a nota das postas', () => {
        const rule = sbcById('media')!.rule;
        const top = metalIds('ouro')
            .slice(0, 5)
            .map((id) => mk(id));
        const low = metalIds('bronze')
            .slice(0, 5)
            .map((id) => mk(id));
        expect(sbcStatus(rule, top).ok).toBe(true);
        expect(sbcStatus(rule, low).ok).toBe(false);
        expect(sbcStatus(rule, top.slice(0, 4)).ok).toBe(false);
    });

    it('entrega parcial salva; tirar devolve; carta trancada não entra e a posta não vende', () => {
        const bronze = metalIds('bronze')
            .slice(0, 6)
            .map((id) => mk(id));
        let u = place(
            withCards(bronze),
            'faxina',
            bronze.slice(0, 3).map((c) => c.uid),
        );
        expect(u.sbc.slots.faxina).toHaveLength(3);
        expect(canSell(u, bronze[0].uid)).toBe(false);
        expect(canSell(u, bronze[5].uid)).toBe(true);
        expect(sbcCanDeliver(u, 'faxina')).toBe(false);
        // sobrevive ao save
        expect(ultimateOf(JSON.parse(JSON.stringify(u))).sbc).toEqual(u.sbc);
        // uma carta só num desafio
        u = sbcPlace(u, 'eletrico', bronze[0].uid);
        expect(u.sbc.slots.eletrico).toBeUndefined();
        u = sbcRemove(u, 'faxina', bronze[0].uid);
        expect(u.sbc.slots.faxina).toHaveLength(2);
        expect(canSell(u, bronze[0].uid)).toBe(true);
        u = toggleLock(u, bronze[4].uid);
        expect(sbcPlace(u, 'faxina', bronze[4].uid)).toBe(u);
    });

    it('entrega: cartas somem do Clube, dos Pendentes e do time; a faxina repete', () => {
        const bronze = metalIds('bronze')
            .slice(0, 10)
            .map((id) => mk(id));
        const pend = bronze.slice(8).map((card) => ({ kind: 'card' as const, card }));
        let u: UltimateSave = { ...withCards(bronze.slice(0, 8)), pending: pend };
        u.team = { ...u.team, order: bronze.slice(0, 5).map((c) => c.uid), captainUid: bronze[0].uid };
        // 3 do Clube fora do time + as 2 repetidas
        u = place(
            u,
            'faxina',
            [bronze[5], bronze[6], bronze[7], bronze[8], bronze[9]].map((c) => c.uid),
        );
        expect(u.sbc.slots.faxina).toHaveLength(5);
        const d = sbcDeliver(u, 'faxina');
        expect(d.extraPacks).toBe(u.extraPacks + 1);
        expect(d.cards).toHaveLength(5);
        expect(d.pending).toHaveLength(0);
        expect(d.sbc.slots.faxina).toBeUndefined();
        expect(d.sbc.done).toEqual([]);
        // titular posto: a entrega o acusa e tira do time (capitão junto)
        const s2 = place(sbcRemove(u, 'faxina', bronze[5].uid), 'faxina', [bronze[0].uid]);
        expect(sbcStarters(s2, 'faxina').map((c) => c.uid)).toEqual([bronze[0].uid]);
        const d2 = sbcDeliver(s2, 'faxina');
        expect(d2.team.order).not.toContain(bronze[0].uid);
        expect(d2.team.captainUid).toBeNull();
        // com partida aberta, titular não sai
        expect(sbcCanDeliver({ ...s2, live: {} as never }, 'faxina')).toBe(false);
    });

    it('desafio que não repete fica entregue e paga o Pick', () => {
        const gold = metalIds('ouro')
            .slice(0, 4)
            .map((id) => mk(id));
        let u = place(
            withCards(gold),
            'ouro',
            gold.slice(0, 3).map((c) => c.uid),
        );
        const before = u.extraPacks;
        u = sbcDeliver(u, 'ouro');
        expect(u.sbc.done).toEqual(['ouro']);
        expect(u.picks.at(-1)).toMatchObject({ min: 'ouro', exact: true, n: 3 });
        expect(u.extraPacks).toBe(before + 1);
        expect(sbcPlace(u, 'ouro', gold[3].uid)).toBe(u);
        expect(sbcDeliver(u, 'ouro')).toBe(u);
    });

    it('save tolerante: sem o campo, lixo, carta que sumiu, uid em dois desafios', () => {
        expect(ultimateOf({ salt: 'a' }).sbc).toEqual({ slots: {}, done: [], n: 0 });
        const raw = {
            slots: { faxina: ['c1', 'zz', 'c1', 3], eletrico: ['c1', 'c2'], nada: ['c2'] },
            done: ['agua', 'x', 'faxina'],
            n: -4,
        };
        expect(sbcOf(raw, new Set(['c1', 'c2']))).toEqual({
            slots: { faxina: ['c1'], eletrico: ['c2'] },
            done: ['agua'],
            n: 0,
        });
        expect(sbcOf('lixo', new Set())).toEqual({ slots: {}, done: [], n: 0 });
    });
});
