import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '../../engine/config';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { SEASONS } from './rules';
import {
    canSell,
    canUndoSell,
    finishMatch,
    homeTeam,
    newUltimate,
    openPack,
    pendingFull,
    quickSell,
    redeem,
    rollSeason,
    sellFichas,
    sellRepeats,
    swapBlock,
    swapPending,
    toggleLock,
    type UltimateSave,
    type UtPending,
    ultimateOf,
    ultimateRival,
    undoSell,
} from './ultimate';

const MON = Date.UTC(2026, 10, 2, 15);

const card = (id: number, uid: string, ability?: string): PokemonInstance => {
    const c = { ...createInstance(id, new Rng('t', uid)), uid, shiny: false };
    return ability ? { ...c, ability } : c;
};
const repeatOf = (c: PokemonInstance, uid: string): UtPending => ({
    kind: 'card',
    card: { ...card(c.speciesId, uid), ability: `${c.ability}-outra` },
});

/** Time pronto (2 pacotes) com uma repetida de um titular e uma de uma carta fora do time nos Pendentes. */
function ready(): UltimateSave {
    let u = newUltimate('pend', MON);
    u = openPack(u, MON)!.u;
    u = openPack(u, MON)!.u;
    const extra = card(150, 'x-mew');
    u = { ...u, cards: [...u.cards, extra] };
    const starter = u.cards.find((c) => c.uid === u.team.order[0])!;
    return { ...u, pending: [repeatOf(starter, 'r-1'), repeatOf(extra, 'r-2')] };
}

describe('Pendentes: venda rápida, desfazer e trancar', () => {
    it('vende a repetida pelas Fichas do metal e o Desfazer devolve carta e Fichas', () => {
        const u = ready();
        const rep = u.pending[1] as Extract<UtPending, { kind: 'card' }>;
        const sold = quickSell(u, [rep.card.uid]);
        expect(sold.pending).toHaveLength(1);
        expect(sold.fichas).toBe(u.fichas + sellFichas(rep.card));
        expect(sellFichas(rep.card)).toBeGreaterThan(0);
        expect(canUndoSell(sold)).toBe(true);
        const back = undoSell(sold);
        // o Clube já tem uma igual: volta pros Pendentes
        expect(back.pending.map((p) => p.kind === 'card' && p.card.uid)).toContain(rep.card.uid);
        expect(back.fichas).toBe(u.fichas);
        expect(back.sold).toEqual([]);
        // Fichas gastas: o Desfazer não deixa a carteira negativa
        const spent = { ...sold, fichas: 0 };
        expect(canUndoSell(spent)).toBe(false);
        expect(undoSell(spent)).toBe(spent);
    });

    it('carta do Clube: só fora do time, destrancada e sem Evolução', () => {
        const u = ready();
        const inTeam = u.team.order[0];
        expect(canSell(u, inTeam)).toBe(false);
        expect(quickSell(u, [inTeam])).toBe(u);
        expect(canSell(u, 'x-mew')).toBe(true);
        const locked = toggleLock(u, 'x-mew');
        expect(locked.locked).toEqual(['x-mew']);
        expect(canSell(locked, 'x-mew')).toBe(false);
        expect(toggleLock(locked, 'x-mew').locked).toEqual([]);
        const evo = { ...u, evos: [{ ...u.evos[0], uid: 'x-mew' } as UltimateSave['evos'][number]] };
        expect(canSell(evo, 'x-mew')).toBe(false);
        // vendida do Clube, o Desfazer devolve pro Clube (não tem outra igual lá)
        const sold = quickSell({ ...u, pending: [] }, ['x-mew']);
        expect(sold.cards.some((c) => c.uid === 'x-mew')).toBe(false);
        expect(undoSell(sold).cards.some((c) => c.uid === 'x-mew')).toBe(true);
    });

    it('"Vender as repetidas" vende todas de uma vez e deixa os prêmios', () => {
        const u = ready();
        const prize: UtPending = {
            kind: 'prize',
            uid: 'p1',
            from: 'objective',
            ref: 'd-win',
            fichas: 40,
            packs: 0,
            big: 0,
        };
        const all = sellRepeats({ ...u, pending: [...u.pending, prize] });
        expect(all.pending).toEqual([prize]);
        expect(all.sold).toHaveLength(2);
        expect(undoSell(all).pending).toHaveLength(3);
    });
});

describe('Pendentes: trocar a repetida pela do Clube', () => {
    it('a repetida entra na vaga da outra (capitão junto) e a do Clube vira a pendente', () => {
        const u = ready();
        const rep = u.pending[0] as Extract<UtPending, { kind: 'card' }>;
        const twin = u.team.order[0];
        const cap = { ...u, team: { ...u.team, captainUid: twin } };
        const out = swapPending(cap, rep.card.uid);
        expect(out.team.order[0]).toBe(rep.card.uid);
        expect(out.team.captainUid).toBe(rep.card.uid);
        expect(out.cards.some((c) => c.uid === twin)).toBe(false);
        expect(out.cards.find((c) => c.uid === rep.card.uid)?.ability).toBe(rep.card.ability);
        expect(out.pending[0]).toMatchObject({ kind: 'card', card: { uid: twin } });
        expect(out.cards).toHaveLength(u.cards.length);
    });

    it('trava com a do Clube trancada ou jogando a partida aberta', () => {
        const u = ready();
        const rep = (u.pending[0] as Extract<UtPending, { kind: 'card' }>).card;
        const locked = toggleLock(u, u.team.order[0]);
        expect(swapBlock(locked, rep)).toBe('locked');
        expect(swapPending(locked, rep.uid)).toBe(locked);
        const live = {
            ...u,
            live: {
                n: 0,
                level: 'normal' as const,
                home: homeTeam(u, 'Eu', 0),
                rival: ultimateRival(u.salt, 0, 'normal', 60),
                orders: [],
                tick: 0,
                engine: ENGINE_VERSION,
            },
        };
        expect(swapBlock(live, rep)).toBe('live');
    });
});

describe('Pendentes: prêmios, teto e temporada', () => {
    it('o objetivo cumprido espera o Resgatar; Resgatar paga uma vez só', () => {
        const u = ready();
        const live = {
            ...u,
            live: {
                n: 0,
                level: 'normal' as const,
                home: homeTeam(u, 'Eu', 0),
                rival: ultimateRival(u.salt, 0, 'normal', 60),
                orders: [],
                tick: 0,
                engine: ENGINE_VERSION,
            },
        };
        const out = finishMatch(live, { score: [3, 0], shootout: null }, MON);
        const prizes = out.pending.filter((p) => p.kind === 'prize');
        expect(prizes.map((p) => p.kind === 'prize' && p.ref)).toEqual(expect.arrayContaining(['d-win']));
        const one = prizes.find((p) => p.kind === 'prize' && p.ref === 'd-win')!;
        const got = redeem(out, (one as { uid: string }).uid);
        expect(got.fichas).toBe(out.fichas + 40);
        expect(redeem(got, (one as { uid: string }).uid)).toBe(got);
        expect(redeem(got).pending.filter((p) => p.kind === 'prize')).toEqual([]);
    });

    it('com 30 pendentes o pacote não abre (nada é vendido sozinho)', () => {
        const u = ready();
        const full = {
            ...u,
            extraPacks: 3,
            pending: Array.from({ length: 30 }, (_, i): UtPending => repeatOf(u.cards[0], `f${i}`)),
        };
        expect(pendingFull(full)).toBe(true);
        expect(openPack(full, MON)).toBeNull();
        expect(openPack({ ...full, pending: full.pending.slice(1) }, MON)).not.toBeNull();
    });

    it('a virada da temporada zera os Pendentes', () => {
        const u = { ...ready(), locked: ['x-mew'] };
        const r = rollSeason(u, SEASONS[0].start + 1).u;
        expect(r.pending).toEqual([]);
        expect(r.locked).toEqual([]);
        expect(r.sold).toEqual([]);
    });
});

describe('save dos Pendentes', () => {
    it('save da prévia sem os campos novos abre com Pendentes vazio; o que tem volta igual', () => {
        const u = ready();
        const { pending: _p, locked: _l, sold: _s, ...old } = u;
        const back = ultimateOf(JSON.parse(JSON.stringify(old)));
        expect(back).toMatchObject({ pending: [], locked: [], sold: [] });
        expect(back.cards).toEqual(u.cards);
        const sold = quickSell(toggleLock(u, u.cards[1].uid), [(u.pending[1] as { card: PokemonInstance }).card.uid]);
        expect(ultimateOf(JSON.parse(JSON.stringify(sold)))).toMatchObject({
            pending: sold.pending,
            locked: sold.locked,
            sold: sold.sold,
        });
    });

    it('pendente estragado ou repetido sai sem derrubar o resto', () => {
        const u = ready();
        const raw = {
            ...u,
            pending: [
                u.pending[0],
                u.pending[0],
                { kind: 'card', card: { uid: 'x' } },
                { kind: 'card', card: u.cards[0] },
                { kind: 'prize', uid: 'p', from: 'hacker', fichas: 1e9 },
                { kind: 'prize', uid: 'q', from: 'pass', ref: '3', fichas: -5, packs: 1 },
                'lixo',
            ],
            locked: ['nao-existe', u.cards[0].uid, u.cards[0].uid],
        };
        const back = ultimateOf(JSON.parse(JSON.stringify(raw)));
        expect(back.pending).toEqual([
            u.pending[0],
            { kind: 'prize', uid: 'q', from: 'pass', ref: '3', fichas: 0, packs: 1, big: 0 },
        ]);
        expect(back.locked).toEqual([u.cards[0].uid]);
        expect(viewInstance(back.cards[0]).overall).toBeGreaterThan(0);
    });
});
