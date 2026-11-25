import type { Profile } from './profile';
import { type PickSpec, SEASONS } from './ultimate/rules';
import type { PackKind, UltimateSave } from './ultimate/ultimate';

/**
 * Desafio de Natal comunitário (docs/planos/natal.md, §2.2): de 07/12/2026 00:00 a 05/01/2027 23:59 (Brasília), os gols
 * de todo mundo (só conta Google, pela função `natal_gols_somar` do banco) somam numa barra com 8 degraus. Quem marcou
 * pelo menos 1 gol no período leva o prêmio de cada degrau batido, que abre sozinho na próxima entrada, uma vez por
 * conta. Só a regra fica aqui (sem rede): a conversa com o Supabase está em src/cloud/desafio.ts.
 */
export const DESAFIO_FROM = Date.parse('2026-12-07T00:00:00-03:00');
export const DESAFIO_TO = Date.parse('2027-01-06T00:00:00-03:00');
/** O prêmio abre até o fim da Temporada 1 do Time Ultimate (os pacotes e o Pick vivem nela; a 2 zera o modo). */
export const DESAFIO_CLAIM_TO = SEASONS[0].end;
/** O evento do Time Ultimate cujas cartas Evento os pacotes e os Picks do desafio trazem. */
export const DESAFIO_EVENT = 'natal-2026';

export type DesafioItem =
    | { kind: 'ornament'; id: string }
    | { kind: 'fichas'; n: number }
    | { kind: 'pack'; pack: PackKind; n: number }
    | { kind: 'title'; id: string }
    | { kind: 'pick'; pick: PickSpec };

/**
 * Os 8 degraus (meta somada de gols e prêmio). A conta dos números está no natal.md ("Números da meta"): base de 30
 * dias do `npm run stats` (42.313 gols do jogador) x ~40% vindos de conta Google ≈ 16.900; o último degrau em ~60%
 * disso e o primeiro em pouco mais de 1 dia do ritmo devagar.
 */
export const DEGRAUS: readonly { gols: number; items: readonly DesafioItem[] }[] = [
    { gols: 500, items: [{ kind: 'ornament', id: 'desafio-natal' }] },
    { gols: 1000, items: [{ kind: 'fichas', n: 300 }] },
    { gols: 2000, items: [{ kind: 'pack', pack: 'evmini', n: 1 }] },
    { gols: 3000, items: [{ kind: 'title', id: 'natal2026' }] },
    { gols: 4500, items: [{ kind: 'pick', pick: { n: 3, min: 'prata', event: DESAFIO_EVENT } }] },
    { gols: 6000, items: [{ kind: 'pack', pack: 'big', n: 2 }] },
    { gols: 8000, items: [{ kind: 'pick', pick: { n: 3, min: 'ouro', exact: true, event: DESAFIO_EVENT } }] },
    {
        gols: 10000,
        items: [
            { kind: 'ornament', id: 'estrela-natal' },
            { kind: 'pack', pack: 'evbig', n: 1 },
        ],
    },
];

export type DesafioPhase = 'teaser' | 'open' | 'closed';

/** Antes de abrir (a contagem), aberto, ou fechado. `force` (`?desafio=aberto` no dev e nas prévias) abre na hora. */
export function desafioPhase(now: number, force = false): DesafioPhase {
    if (force) return 'open';
    return now < DESAFIO_FROM ? 'teaser' : now < DESAFIO_TO ? 'open' : 'closed';
}

/** `?desafio=aberto` só vale no dev e nas prévias (`__SMOKE__`); em produção, só a data. */
export const desafioForced = (search: string, smoke: boolean) =>
    smoke && new URLSearchParams(search).get('desafio') === 'aberto';

/** Dias inteiros até abrir ("abre em 12 dias"; no último dia, 1). */
export const daysToOpen = (now: number) => Math.max(0, Math.ceil((DESAFIO_FROM - now) / 86_400_000));

/** Quantos degraus a soma já bateu. */
export const degrausBatidos = (total: number) => DEGRAUS.filter((d) => total >= d.gols).length;

/** O próximo degrau (índice) e quantos gols faltam; null = todos batidos. */
export function proximoDegrau(total: number): { i: number; faltam: number } | null {
    const i = degrausBatidos(total);
    return i < DEGRAUS.length ? { i, faltam: DEGRAUS[i].gols - total } : null;
}

/** O id do presente de cada degrau em `ultimate.gifts` (um por save: o prêmio não abre duas vezes). */
export const degrauGift = (i: number) => `desafio-natal-${i + 1}`;

/** Um prêmio aberto agora (vai pra tela de prêmio). */
export interface DesafioGot {
    item: DesafioItem;
    /** Degrau (1 a 8). */
    degrau: number;
}

type Saves = { ultimate: UltimateSave; profile: Profile };

/** Põe um item na conta. false = não muda nada (o título que você já tem). */
function give(s: Saves, item: DesafioItem, uid: string): Saves | null {
    const u = s.ultimate;
    switch (item.kind) {
        case 'ornament':
            return u.legacy.ornaments.includes(item.id)
                ? null
                : { ...s, ultimate: { ...u, legacy: { ...u.legacy, ornaments: [...u.legacy.ornaments, item.id] } } };
        case 'fichas':
            return { ...s, ultimate: { ...u, fichas: u.fichas + item.n } };
        case 'pack': {
            const k = { mini: 'extraPacks', big: 'bigPacks', evmini: 'evMini', evbig: 'evBig' } as const;
            const key = k[item.pack];
            return { ...s, ultimate: { ...u, [key]: u[key] + item.n } };
        }
        case 'title':
            return s.profile.redeemedTitles.includes(item.id)
                ? null
                : { ...s, profile: { ...s.profile, redeemedTitles: [...s.profile.redeemedTitles, item.id] } };
        case 'pick':
            return {
                ...s,
                ultimate: { ...u, picks: [...u.picks, { ...item.pick, uid, from: 'event', ref: DESAFIO_EVENT }] },
            };
    }
}

/**
 * Abre os prêmios dos degraus batidos que este save ainda não ganhou. Só pra quem marcou pelo menos 1 gol (`meus`), a
 * partir da abertura e até DESAFIO_CLAIM_TO. null = nada a abrir.
 */
export function payDesafio(s: Saves, total: number, meus: number, now: number): (Saves & { got: DesafioGot[] }) | null {
    if (meus < 1 || now < DESAFIO_FROM || now >= DESAFIO_CLAIM_TO) return null;
    let cur = s;
    const got: DesafioGot[] = [];
    for (let i = 0; i < degrausBatidos(total); i++) {
        const gift = degrauGift(i);
        if (cur.ultimate.gifts.includes(gift)) continue;
        cur = { ...cur, ultimate: { ...cur.ultimate, gifts: [...cur.ultimate.gifts, gift] } };
        for (const item of DEGRAUS[i].items) {
            const next = give(cur, item, gift);
            if (!next) continue;
            cur = next;
            got.push({ item, degrau: i + 1 });
        }
    }
    return cur === s ? null : { ...cur, got };
}
