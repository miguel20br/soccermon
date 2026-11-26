import { describe, expect, it } from 'vitest';
import { goalsOf, refreshDesafio, reportGoals, useDesafio } from '../cloud/desafio';
import {
    DEGRAUS,
    DESAFIO_CLAIM_TO,
    DESAFIO_FROM,
    DESAFIO_TO,
    daysToOpen,
    degrausBatidos,
    desafioForced,
    desafioPhase,
    payDesafio,
    proximoDegrau,
} from './desafio-natal';
import { DEFAULT_PROFILE } from './profile';
import { mergeUltimate, newUltimate, openPack, ultimateOf } from './ultimate/ultimate';

const at = (iso: string) => Date.parse(iso);
const saves = () => ({ ultimate: newUltimate('dn', DESAFIO_FROM), profile: { ...DEFAULT_PROFILE } });

describe('Desafio de Natal: datas', () => {
    it('abre 07/12 00:00 e fecha 05/01 23:59 de Brasília', () => {
        expect(desafioPhase(at('2026-12-06T23:59:59-03:00'))).toBe('teaser');
        expect(desafioPhase(at('2026-12-07T00:00:00-03:00'))).toBe('open');
        expect(desafioPhase(at('2027-01-05T23:59:59-03:00'))).toBe('open');
        expect(desafioPhase(at('2027-01-06T00:00:00-03:00'))).toBe('closed');
        expect(DESAFIO_TO - DESAFIO_FROM).toBe(30 * 86_400_000);
    });

    it('teaser conta os dias até abrir (no último dia, 1)', () => {
        expect(daysToOpen(at('2026-11-25T12:00:00-03:00'))).toBe(12);
        expect(daysToOpen(at('2026-12-06T23:00:00-03:00'))).toBe(1);
        expect(daysToOpen(DESAFIO_FROM)).toBe(0);
    });

    it('?desafio=aberto só no dev e nas prévias', () => {
        expect(desafioForced('?desafio=aberto', true)).toBe(true);
        expect(desafioForced('?desafio=aberto', false)).toBe(false);
        expect(desafioPhase(at('2026-11-25T12:00:00-03:00'), true)).toBe('open');
    });
});

describe('Desafio de Natal: degraus', () => {
    it('8 degraus em ordem, o último em 10.000 gols', () => {
        expect(DEGRAUS).toHaveLength(8);
        expect(DEGRAUS.map((d) => d.gols)).toEqual([...DEGRAUS.map((d) => d.gols)].sort((a, b) => a - b));
        expect(DEGRAUS.at(-1)?.gols).toBe(10000);
    });

    it('conta os batidos e o que falta pro próximo', () => {
        expect(degrausBatidos(0)).toBe(0);
        expect(degrausBatidos(500)).toBe(1);
        expect(degrausBatidos(2999)).toBe(3);
        expect(proximoDegrau(2999)).toEqual({ i: 3, faltam: 1 });
        expect(proximoDegrau(10000)).toBeNull();
    });
});

describe('Desafio de Natal: quem ganha e o prêmio uma vez só', () => {
    const now = at('2026-12-20T12:00:00-03:00');

    it('quem não marcou gol não ganha nada', () => {
        expect(payDesafio(saves(), 10000, 0, now)).toBeNull();
    });

    it('antes de abrir e depois da Temporada 1 não abre', () => {
        expect(payDesafio(saves(), 10000, 5, DESAFIO_FROM - 1)).toBeNull();
        expect(payDesafio(saves(), 10000, 5, DESAFIO_CLAIM_TO)).toBeNull();
    });

    it('abre só os degraus batidos, cada prêmio na conta', () => {
        const r = payDesafio(saves(), 4500, 3, now);
        expect(r?.got.map((g) => g.degrau)).toEqual([1, 2, 3, 4, 5]);
        expect(r?.ultimate.legacy.ornaments).toContain('desafio-natal');
        expect(r?.ultimate.fichas).toBe(300);
        expect(r?.ultimate.evMini).toBe(1);
        expect(r?.profile.redeemedTitles).toContain('natal2026');
        const pick = r?.ultimate.picks.find((p) => p.uid === 'desafio-natal-5');
        expect(pick).toMatchObject({ min: 'prata', event: 'natal-2026', from: 'event' });
    });

    it('a mesma conta não recebe duas vezes; degrau novo abre só ele', () => {
        const first = payDesafio(saves(), 4500, 3, now);
        if (!first) throw new Error('devia pagar');
        expect(payDesafio(first, 4500, 3, now)).toBeNull();
        const more = payDesafio(first, 10000, 3, now);
        expect(more?.got.map((g) => g.degrau)).toEqual([6, 7, 8, 8]);
        expect(more?.ultimate.bigPacks).toBe(2);
        expect(more?.ultimate.evBig).toBe(1);
        expect(more?.ultimate.fichas).toBe(300);
        expect(more?.ultimate.legacy.ornaments).toEqual(['desafio-natal', 'estrela-natal']);
        expect(more?.ultimate.picks.find((p) => p.uid === 'desafio-natal-7')).toMatchObject({
            min: 'ouro',
            exact: true,
        });
    });

    it('recarregar o save (ou juntar com a nuvem) não paga de novo', () => {
        const paid = payDesafio(saves(), 10000, 3, now);
        if (!paid) throw new Error('devia pagar');
        // o carregamento do jogo passa o save por ultimateOf (JSON do IndexedDB ou da nuvem)
        const loaded = { ...paid, ultimate: ultimateOf(JSON.parse(JSON.stringify(paid.ultimate))) };
        expect(loaded.ultimate.gifts).toEqual(paid.ultimate.gifts);
        expect(payDesafio(loaded, 10000, 3, now)).toBeNull();
        // a nuvem com mais progresso, mas sem os presentes, vence a junção: os presentes continuam
        const cloud = { ...saves().ultimate, opened: 99 };
        const merged = { ...paid, ultimate: mergeUltimate(paid.ultimate, cloud) };
        expect(merged.ultimate.opened).toBe(99);
        expect(payDesafio(merged, 10000, 3, now)).toBeNull();
    });

    it('título que já era seu (Copa de Natal) não aparece de novo', () => {
        const s = saves();
        const r = payDesafio({ ...s, profile: { ...s.profile, redeemedTitles: ['natal2026'] } }, 3000, 1, now);
        expect(r?.got.map((g) => g.item.kind)).toEqual(['ornament', 'fichas', 'pack']);
        expect(r?.ultimate.gifts).toContain('desafio-natal-4');
    });
});

describe('Pacote de Evento do desafio', () => {
    it('toda carta sai Evento de Natal e gasta o pacote certo', () => {
        const u = { ...newUltimate('ev', DESAFIO_FROM), packs: 0, evMini: 1, evBig: 1 };
        const mini = openPack(u, DESAFIO_FROM, 'evmini');
        expect(mini?.pack.cards).toHaveLength(3);
        expect(mini?.u.evMini).toBe(0);
        expect(mini?.u.evBig).toBe(1);
        const big = mini && openPack(mini.u, DESAFIO_FROM, 'evbig');
        expect(big?.pack.cards).toHaveLength(5);
        // fora das datas do evento (05/01 em diante) o pacote continua todo Evento
        const late = openPack({ ...u, evMini: 1 }, DESAFIO_CLAIM_TO - 1, 'evmini');
        for (const c of [...(mini?.pack.cards ?? []), ...(big?.pack.cards ?? []), ...(late?.pack.cards ?? [])])
            if (c.special?.kind !== 'icone')
                expect(c.special).toEqual({ kind: 'evento', type: 'Ice', event: 'natal-2026' });
        expect(openPack({ ...u, evMini: 0 }, DESAFIO_FROM, 'evmini')).toBeNull();
    });
});

describe('Contagem dos gols de cada partida', () => {
    const base = { run: null, ultimate: newUltimate('g', DESAFIO_FROM), duels: [] };

    it('Copa, Time Ultimate, Draft e Duelo mandam os gols do jogador', () => {
        const run = { seed: 's', results: [] } as never;
        const ran = { seed: 's', results: [{ score: [4, 2] }] } as never;
        expect(goalsOf({ ...base, run: ran }, { ...base, run })).toEqual([4]);
        const ut = { ...base.ultimate, played: 1, last: { score: [6, 1] } as never };
        expect(goalsOf({ ...base, ultimate: ut }, base)).toEqual([6]);
        const draft = (n: number) =>
            ({
                ...base.ultimate,
                draft: { ...base.ultimate.draft, run: { games: Array.from({ length: n }, () => ({ score: [3, 0] })) } },
            }) as never;
        expect(goalsOf({ ...base, ultimate: draft(2) }, { ...base, ultimate: draft(1) })).toEqual([3]);
        const duel = { id: 'd1', date: 1000, score: [2, 5], result: 'loss' } as never;
        expect(goalsOf({ ...base, duels: [duel] }, base, 2000)).toEqual([2]);
        // melhor de 3 ganha por 2-1 com jogos de 4-2, 1-3 e 5-0: os gols de cada jogo, e não as vitórias
        const serie = {
            id: 'd2',
            date: 1000,
            score: [2, 1],
            result: 'win',
            bestOf: 3,
            games: [
                [4, 2],
                [1, 3],
                [5, 0],
            ],
        } as never;
        expect(goalsOf({ ...base, duels: [serie] }, base, 2000)).toEqual([4, 1, 5]);
    });

    it('copa trocada, duelo anulado ou antigo (save importado) não contam', () => {
        const old = { seed: 'a', results: [] } as never;
        const other = { seed: 'b', results: [{ score: [9, 0] }] } as never;
        expect(goalsOf({ ...base, run: other }, { ...base, run: old })).toEqual([]);
        const voided = { id: 'v', date: 1000, score: [3, 3], result: 'void' } as never;
        const stale = { id: 'o', date: 0, score: [3, 1], result: 'win' } as never;
        expect(goalsOf({ ...base, duels: [voided, stale] }, base, 60 * 60_000)).toEqual([]);
    });

    it('sem Supabase (offline): nada vai pra rede e o jogo segue', async () => {
        reportGoals(5);
        await refreshDesafio(true);
        expect(useDesafio.getState()).toMatchObject({ total: null, meus: null });
    });
});
