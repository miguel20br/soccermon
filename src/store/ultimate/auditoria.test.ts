import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { setUtNow, utFloor, utNow, utSeen } from './clock';
import { UT_EPOCH } from './rules';
import { mergeUltimate, metalPools, newUltimate, pickOptions, refill, type UtPick, ultimateOf } from './ultimate';

// auditoria de exploits do Time Ultimate (27/11/2026): os consertos que não mudam número nenhum
const T = Date.UTC(2026, 11, 1, 15);
const DAY = 86_400_000;

afterEach(() => {
    vi.restoreAllMocks();
    setUtNow(null);
});

describe('relógio do Time Ultimate nunca volta', () => {
    it('adiantar o relógio, pegar os pacotes e voltar: o relógio do modo fica no mais adiantado', () => {
        const clock = vi.spyOn(Date, 'now').mockReturnValue(T + 3 * DAY);
        expect(utNow()).toBe(T + 3 * DAY);
        clock.mockReturnValue(T);
        expect(utNow()).toBe(T + 3 * DAY);
        // os 6 pacotes do relógio saíram em T+3d; com o relógio do aparelho de volta em T, nenhum pacote novo
        expect(refill({ packs: 0, packAt: T + 3 * DAY }, utNow()).packs).toBe(0);
        // (era assim: o relógio que voltou reiniciava a contagem, e adiantar de novo dava mais 6)
        const back = refill({ packs: 0, packAt: T + 3 * DAY }, T);
        expect(refill(back, T + 3 * DAY).packs).toBe(6);
    });

    it('o save puxa o piso ao carregar (recarregar a página com o relógio voltado não ajuda)', () => {
        vi.spyOn(Date, 'now').mockReturnValue(T);
        setUtNow(null);
        utSeen(T + 2 * DAY);
        expect(utNow()).toBe(T + 2 * DAY);
        expect(utFloor()).toBe(T + 2 * DAY);
    });

    it('a prévia (?utnow=) não prende o relógio no save', () => {
        vi.spyOn(Date, 'now').mockReturnValue(T);
        setUtNow(T + 20 * DAY);
        expect(utNow()).toBe(T + 20 * DAY);
        expect(utFloor()).toBe(0);
    });

    it('o save guarda o relógio; juntar com a nuvem fica com o mais adiantado; o recomeço não zera nem ele nem os presentes', () => {
        const a = { ...newUltimate('a', T), seen: T + DAY, played: 5 };
        const b = { ...newUltimate('a', T), seen: T + 9 * DAY, played: 1 };
        expect(ultimateOf(JSON.parse(JSON.stringify(a))).seen).toBe(T + DAY);
        expect(mergeUltimate(a, b).seen).toBe(T + 9 * DAY);
        expect(mergeUltimate(a, b).played).toBe(5);
        const old = { ...a, epoch: UT_EPOCH - 1, gifts: ['natal-2026', 'desafio-natal-1'] };
        expect(ultimateOf(old)).toMatchObject({ played: 0, seen: T + DAY, gifts: ['natal-2026', 'desafio-natal-1'] });
    });
});

describe('Pick: vender e desfazer não sorteia de novo', () => {
    it('tirar uma carta do Clube só deixa a espécie dela entrar; as outras opções não mudam', () => {
        const golds = metalPools().ouro.slice(0, 20);
        const cards = golds.map((id, i) => ({ ...createInstance(id, new Rng('aud', `${i}`)), uid: `c${i}` }));
        const u = { ...newUltimate('aud', T), cards };
        const p: UtPick = { n: 3, min: 'ouro', exact: true, uid: 'shop-7', from: 'shop', ref: '' };
        const before = new Set(pickOptions(u, p).map((c) => c.speciesId));
        for (const x of cards) {
            const after = pickOptions({ ...u, cards: cards.filter((c) => c !== x) }, p).map((c) => c.speciesId);
            for (const id of after) expect(before.has(id) || id === x.speciesId).toBe(true);
        }
    });
});
