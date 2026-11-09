import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { SPECIES, species } from '../../engine/data';
import { createInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { editionOf } from '../../engine/specials';
import { metalOf } from '../../ui/rarity';
import { migrateSave } from '../game-store';
import { EVENTS, FIRST_PICK, GYMS, gymPick, PICK_POINTS, passReward } from './rules';
import {
    buyPick,
    choosePick,
    lastPacks,
    mergeUltimate,
    newUltimate,
    pickOptions,
    redeem,
    rollSeason,
    stackCount,
    type UtPick,
    ultimateOf,
} from './ultimate';

const T0 = 1_800_000_000_000;
const metal = (c: { speciesId: number } & object) => metalOf(viewInstance(c as never).overall);
const pick = (p: Partial<UtPick>): UtPick => ({ n: 3, min: 'prata', uid: 'x', from: 'shop', ref: '', ...p });

describe('Pokémon Pick (ultimate-fc.md, decidido em 09/11)', () => {
    it('save novo e temporada nova: 2 Mini + "Seu primeiro craque" 1 de 5 Prata ou melhor', () => {
        const u = newUltimate('p', T0);
        expect(u.picks).toEqual([{ ...FIRST_PICK, uid: 'start', from: 'start', ref: '' }]);
        expect(stackCount(u, T0)).toBe(3);
        const opts = pickOptions(u, u.picks[0]);
        expect(opts).toHaveLength(5);
        expect(new Set(opts.map((c) => c.speciesId)).size).toBe(5);
        expect(opts.every((c) => metal(c) !== 'bronze')).toBe(true);
        const v = rollSeason({ ...u, season: 1, picks: [] }, Date.UTC(2027, 5, 2)).u;
        expect(v.picks.map((p) => p.uid)).toEqual(['start']);
    });

    it('mesmas opções ao voltar (sem rerrolar recarregando), e nunca uma espécie que você já tem', () => {
        const u = newUltimate('det', T0);
        const p = u.picks[0];
        expect(pickOptions(ultimateOf(JSON.parse(JSON.stringify(u))), p)).toEqual(pickOptions(u, p));
        for (let k = 0; k < 40; k++) {
            const cards = SPECIES.filter((_, i) => (i + k) % 3 === 0).map((sp, i) => ({
                ...createInstance(sp.id, new Rng('own', `${k}-${i}`)),
                uid: `o${i}`,
            }));
            const opts = pickOptions({ ...u, cards }, pick({ uid: `k${k}`, n: 5 }));
            const owned = new Set(cards.map((c) => c.speciesId));
            expect(opts.some((c) => owned.has(c.speciesId))).toBe(false);
        }
    });

    it('Pick do líder: só do tipo dele; Ouro do passe: só Ouro; comprado: só o metal', () => {
        const u = newUltimate('t', T0);
        for (const g of GYMS) {
            const spec = gymPick(g);
            const opts = pickOptions(u, pick({ ...spec, uid: g.id, from: 'gym' }));
            if (spec.type)
                expect(opts.every((c) => species(c.speciesId).types.includes(spec.type as never))).toBe(true);
            expect(opts.every((c) => metal(c) !== 'bronze')).toBe(true);
        }
        const gold = passReward(20).pick!;
        expect(passReward(40).pick).toEqual(gold);
        expect([passReward(10).big, passReward(30).big, passReward(20).big]).toEqual([1, 1, 0]);
        expect(pickOptions(u, pick({ ...gold })).every((c) => metal(c) === 'ouro')).toBe(true);
        expect(pickOptions(u, pick({ min: 'bronze', exact: true })).every((c) => metal(c) === 'bronze')).toBe(true);
    });

    it('Pick de Evento: toda opção sai Evento, do tipo do evento', () => {
        const ev = EVENTS[0];
        const opts = pickOptions(newUltimate('e', T0), pick({ ...ev.pick!, uid: 'event-x', from: 'event' }));
        expect(opts.every((c) => editionOf(c) === 'evento' || editionOf(c) === 'icone')).toBe(true);
    });

    it('escolher: a carta entra no Clube e no time, as outras somem, conta o 1º passo; uid errado não faz nada', () => {
        const u = newUltimate('c', T0);
        const opts = pickOptions(u, u.picks[0]);
        expect(choosePick(u, 'start', 'nada')).toBeNull();
        expect(choosePick(u, 'outro', opts[0].uid)).toBeNull();
        const r = choosePick(u, 'start', opts[2].uid)!;
        expect(r.repeat).toBe(false);
        expect(r.u.cards).toEqual([opts[2]]);
        expect(r.u.team.order).toEqual([opts[2].uid]);
        expect(r.u.picks).toEqual([]);
        expect(r.u.picked).toBe(1);
        expect(r.u.firsts).toContain('pack');
    });

    it('Pick com pontos: cobra o preço do metal e guarda em Meus pacotes', () => {
        const u = { ...newUltimate('b', T0), packPoints: PICK_POINTS.prata };
        expect(buyPick({ ...u, packPoints: PICK_POINTS.prata - 1 }, 'prata')).toBeNull();
        const v = buyPick(u, 'prata')!;
        expect(v.packPoints).toBe(0);
        expect(v.picks.at(-1)).toMatchObject({ from: 'shop', min: 'prata', exact: true, n: 3 });
        expect(v.picks.at(-1)?.uid).not.toBe(buyPick({ ...v, packPoints: 99 }, 'prata')!.picks.at(-1)?.uid);
    });

    it('prêmio com Pick espera o Resgatar e vai pra Meus pacotes; o pós-jogo conta o Pick', () => {
        const u = newUltimate('r', T0);
        const prize = {
            kind: 'prize' as const,
            uid: 'pass-1-20',
            from: 'pass' as const,
            ref: '20',
            fichas: 0,
            packs: 0,
            big: 0,
            pick: passReward(20).pick,
        };
        const v = redeem({ ...u, pending: [prize] });
        expect(v.pending).toEqual([]);
        expect(v.picks.map((p) => p.uid)).toEqual(['start', 'pass-1-20']);
        // resgatar de novo o mesmo uid (nuvem) não duplica
        expect(redeem({ ...v, pending: [prize] }).picks).toHaveLength(2);
        expect(
            lastPacks({
                score: [1, 0],
                shootout: null,
                outcome: 'win',
                level: 'normal',
                fichas: 0,
                rival: '',
                seen: false,
                marks: [20],
                badge: true,
            }),
        ).toMatchObject({ picks: 2 });
    });

    it('save: fatia da 0.9.43 (sem picks) ganha o primeiro craque; pick estragado sai; nuvem conta o escolhido', () => {
        // a fatia vazia que está na produção (todo save tem, ninguém jogou)
        const prod = JSON.parse(JSON.stringify(newUltimate('prod', T0)));
        delete prod.picks;
        delete prod.picked;
        expect(ultimateOf(prod).picks.map((p) => p.uid)).toEqual(['start']);
        expect(ultimateOf(prod).picked).toBe(0);
        const bad = ultimateOf({
            ...prod,
            picks: [
                null,
                { uid: 'a', from: 'x', n: 3, min: 'prata' },
                pick({ uid: 'ok' }),
                pick({ uid: 'ok' }),
                pick({ uid: 'm', min: 'diamante' as never }),
            ],
        });
        expect(bad.picks.map((p) => p.uid)).toEqual(['ok']);
        // save v6 de verdade (sem a fatia): nasce com o primeiro craque
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            expect(migrateSave(backup.save, backup.version).ultimate.picks.map((p) => p.uid)).toEqual(['start']);
        }
        // nuvem x aparelho: escolher o Pick é progresso
        const a = newUltimate('m', T0);
        const b = choosePick(a, 'start', pickOptions(a, a.picks[0])[0].uid)!.u;
        expect(mergeUltimate(a, b).picked).toBe(1);
    });
});
