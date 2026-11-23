import { species } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { LINKS } from '../../engine/links';
import { type PickSpec, STARTERS } from './rules';
import type { UltimateSave, UtPick } from './ultimate';

/**
 * Desafios de Montagem (SBC do FC; ultimate-team.md, "Desafios de montagem"): junte cartas que cumprem uma regra,
 * entregue, e elas somem e pagam o prêmio. Sumidouro das repetidas: elas entram primeiro. A entrega parcial fica no
 * save (`UltimateSave.sbc.slots`); o que sai do Clube no meio do caminho só some do slot.
 *
 * ECONOMIA, PROPOSTA (FALTA O OK DO MIGUEL). Escala que já existe: Mini = 150 Fichas (FICHAS_PACK_PRICE), Pick Prata
 * 400 e Ouro 960 (PICK_FICHAS), venda rápida 5 · 15 · 40 (REPEAT_FICHAS). Todo desafio devolve pelo menos 1 Mini.
 *
 * | desafio   | regra                                           | prêmio                    | cartas · venda rápida |
 * | faxina    | 5 Bronze (repete)                               | 1 Mini                    | 5 · 25 Fichas         |
 * | agua      | 5 de Água, nota 70+                             | 1 Grande                  | 5 · ~75 Fichas        |
 * | eletrico  | 4 Elétricos, qualquer nota                      | 2 Mini                    | 4 · ~40 Fichas        |
 * | familia   | 3 da mesma linha evolutiva                      | 1 Grande + 100 Fichas     | 3 · ~30 Fichas        |
 * | iniciais  | Bulbasaur, Charmander e Squirtle (ou evoluções) | 1 Mini + 1 Pick Prata     | 3 · ~30 Fichas        |
 * | media     | 5 cartas, média 68 ou mais                      | 1 Grande + 100 Fichas     | 5 · ~75 Fichas        |
 * | ouro      | 3 Ouro (75+)                                    | 1 Mini + 1 Pick Ouro      | 3 · 120 Fichas        |
 *
 * Uma entrega por temporada, menos a faxina (que repete: o ralo das Bronze repetidas). "Grande" nunca foi
 * precificado em Fichas; aqui ele vale o que os objetivos da semana pagam (1 a 2 por semana).
 */
export interface SbcRule {
    /** Quantas cartas. */
    n: number;
    /** Tipo que cada carta tem. */
    type?: string;
    /** Nota mínima e máxima de cada carta (Bronze = até 64, Prata 65+, Ouro 75+). */
    min?: number;
    max?: number;
    /** Média mínima das notas (a pontuação-alvo). */
    avg?: number;
    /** 'family' = espécies diferentes da mesma linha evolutiva; 'starters' = uma de cada família dos iniciais. */
    kind?: 'family' | 'starters';
}
export interface SbcPrize {
    fichas: number;
    packs: number;
    big: number;
    pick?: PickSpec;
}
export interface Sbc {
    id: string;
    rule: SbcRule;
    prize: SbcPrize;
    /** Pode entregar de novo (ralo contínuo). */
    repeatable?: boolean;
}

export const SBCS: Sbc[] = [
    { id: 'faxina', rule: { n: 5, max: 64 }, prize: { fichas: 0, packs: 1, big: 0 }, repeatable: true },
    { id: 'agua', rule: { n: 5, type: 'Water', min: 70 }, prize: { fichas: 0, packs: 0, big: 1 } },
    { id: 'eletrico', rule: { n: 4, type: 'Electric' }, prize: { fichas: 0, packs: 2, big: 0 } },
    { id: 'familia', rule: { n: 3, kind: 'family' }, prize: { fichas: 100, packs: 0, big: 1 } },
    {
        id: 'iniciais',
        rule: { n: 3, kind: 'starters' },
        prize: { fichas: 0, packs: 1, big: 0, pick: { n: 3, min: 'prata', exact: true } },
    },
    { id: 'media', rule: { n: 5, avg: 68 }, prize: { fichas: 100, packs: 0, big: 1 } },
    {
        id: 'ouro',
        rule: { n: 3, min: 75 },
        prize: { fichas: 0, packs: 1, big: 0, pick: { n: 3, min: 'ouro', exact: true } },
    },
];
export const sbcById = (id: string) => SBCS.find((s) => s.id === id);

/** A fatia do save: o que já foi posto em cada desafio (uids), os entregues (os que não repetem) e a conta de entregas. */
export interface UtSbc {
    slots: Record<string, string[]>;
    done: string[];
    n: number;
}
export const newSbc = (): UtSbc => ({ slots: {}, done: [], n: 0 });

/** Do save: só desafio que existe, uid de carta que existe (Clube ou repetida pendente) e em um desafio só. */
export function sbcOf(raw: unknown, uids: ReadonlySet<string>): UtSbc {
    if (!raw || typeof raw !== 'object') return newSbc();
    const r = raw as Record<string, unknown>;
    const used = new Set<string>();
    const slots: Record<string, string[]> = {};
    if (r.slots && typeof r.slots === 'object' && !Array.isArray(r.slots)) {
        for (const s of SBCS) {
            const v = (r.slots as Record<string, unknown>)[s.id];
            if (!Array.isArray(v)) continue;
            const ok = [...new Set(v)].filter((x): x is string => typeof x === 'string' && uids.has(x) && !used.has(x));
            const keep = ok.slice(0, s.rule.n);
            for (const x of keep) used.add(x);
            if (keep.length) slots[s.id] = keep;
        }
    }
    const done = Array.isArray(r.done)
        ? SBCS.filter((s) => !s.repeatable && (r.done as unknown[]).includes(s.id)).map((s) => s.id)
        : [];
    const n = typeof r.n === 'number' && Number.isFinite(r.n) ? Math.max(0, Math.floor(r.n)) : 0;
    return { slots, done, n };
}

const rootOf = (id: number): number => {
    let x = id;
    for (let p = species(x).prevo; p; p = species(x).prevo) x = p;
    return x;
};
const STARTER_GROUPS = LINKS.find((l) => l.id === 'iniciais')?.groups ?? [];
const groupOf = (id: number) => STARTER_GROUPS.findIndex((g) => g.includes(id));

/** A carta cumpre a parte da regra que é dela (tipo e nota). */
export function sbcFits(rule: SbcRule, c: PokemonInstance): boolean {
    const o = viewInstance(c).overall;
    return (
        (!rule.type || species(c.speciesId).types.includes(rule.type)) &&
        (rule.min === undefined || o >= rule.min) &&
        (rule.max === undefined || o <= rule.max)
    );
}

/** Dá pra pôr a carta `c` ao lado das já postas (`placed`): cumpre a regra dela e combina com as outras. */
export function sbcAccepts(rule: SbcRule, placed: readonly PokemonInstance[], c: PokemonInstance): boolean {
    if (placed.length >= rule.n || placed.some((p) => p.uid === c.uid) || !sbcFits(rule, c)) return false;
    if (rule.kind === 'family')
        return placed.every((p) => p.speciesId !== c.speciesId && rootOf(p.speciesId) === rootOf(c.speciesId));
    if (rule.kind === 'starters') {
        const g = groupOf(c.speciesId);
        return g >= 0 && placed.every((p) => groupOf(p.speciesId) !== g);
    }
    return true;
}

export interface SbcStatus {
    have: number;
    need: number;
    /** Média das notas postas (só se a regra tem média). */
    avg: number | null;
    ok: boolean;
}
export function sbcStatus(rule: SbcRule, placed: readonly PokemonInstance[]): SbcStatus {
    const avg = placed.length ? placed.reduce((s, c) => s + viewInstance(c).overall, 0) / placed.length : 0;
    return {
        have: placed.length,
        need: rule.n,
        avg: rule.avg ? avg : null,
        ok: placed.length === rule.n && (!rule.avg || avg >= rule.avg),
    };
}

/** As cartas que o desafio pode receber: repetidas dos Pendentes (ficam na frente), depois o Clube. */
export const sbcPool = (u: Pick<UltimateSave, 'cards' | 'pending'>): PokemonInstance[] => [
    ...u.pending.flatMap((p) => (p.kind === 'card' ? [p.card] : [])),
    ...u.cards,
];

/** A carta pode entrar em algum desafio: destrancada e fora de Evolução. */
export const sbcFree = (u: Pick<UltimateSave, 'locked' | 'evos'>, c: PokemonInstance) =>
    !u.locked.includes(c.uid) && !u.evos.some((e) => e.uid === c.uid);

/** Cartas postas em algum desafio (a venda rápida respeita). */
export const sbcPlaced = (u: Pick<UltimateSave, 'sbc'>) => new Set(Object.values(u.sbc.slots).flat());

/** As cartas postas no desafio `id` (as que ainda existem, na ordem em que entraram). */
export function sbcCards(u: UltimateSave, id: string): PokemonInstance[] {
    const pool = sbcPool(u);
    return (u.sbc.slots[id] ?? []).flatMap((uid) => pool.find((c) => c.uid === uid) ?? []);
}

export const sbcOpen = (u: Pick<UltimateSave, 'sbc'>, s: Sbc) => s.repeatable || !u.sbc.done.includes(s.id);

/** Põe a carta no desafio. Trancada, em Evolução, já em outro desafio ou fora da regra: não entra. */
export function sbcPlace(u: UltimateSave, id: string, uid: string): UltimateSave {
    const s = sbcById(id);
    const c = sbcPool(u).find((x) => x.uid === uid);
    if (!s || !c || !sbcOpen(u, s) || !sbcFree(u, c) || sbcPlaced(u).has(uid)) return u;
    if (!sbcAccepts(s.rule, sbcCards(u, id), c)) return u;
    return { ...u, sbc: { ...u.sbc, slots: { ...u.sbc.slots, [id]: [...(u.sbc.slots[id] ?? []), uid] } } };
}

export function sbcRemove(u: UltimateSave, id: string, uid: string): UltimateSave {
    const cur = u.sbc.slots[id];
    if (!cur?.includes(uid)) return u;
    const { [id]: _, ...rest } = u.sbc.slots;
    const left = cur.filter((x) => x !== uid);
    return { ...u, sbc: { ...u.sbc, slots: left.length ? { ...rest, [id]: left } : rest } };
}

/** As cartas postas que são titulares (a entrega pede confirmação). */
export const sbcStarters = (u: UltimateSave, id: string) =>
    sbcCards(u, id).filter((c) => u.team.order.slice(0, STARTERS).includes(c.uid));

/** Dá pra entregar: regra cumprida, cartas livres, e com partida aberta o time não pode perder carta. */
export function sbcCanDeliver(u: UltimateSave, id: string): boolean {
    const s = sbcById(id);
    if (!s || !sbcOpen(u, s)) return false;
    const placed = sbcCards(u, id);
    if (!sbcStatus(s.rule, placed).ok || !placed.every((c) => sbcFree(u, c))) return false;
    return !(u.live && placed.some((c) => u.team.order.includes(c.uid)));
}

/** Entrega: as cartas somem (Clube, time e Pendentes) e o prêmio vai pra Fichas e Meus pacotes. */
export function sbcDeliver(u: UltimateSave, id: string): UltimateSave {
    const s = sbcById(id);
    if (!s || !sbcCanDeliver(u, id)) return u;
    const gone = new Set(sbcCards(u, id).map((c) => c.uid));
    const { [id]: _, ...slots } = u.sbc.slots;
    const pick: UtPick[] = s.prize.pick
        ? [{ ...s.prize.pick, uid: `sbc-${id}-${u.sbc.n}`, from: 'shop', ref: '' }]
        : [];
    const cut = (x: string | null) => (x && gone.has(x) ? null : x);
    return {
        ...u,
        cards: u.cards.filter((c) => !gone.has(c.uid)),
        pending: u.pending.filter((p) => p.kind !== 'card' || !gone.has(p.card.uid)),
        team: {
            ...u.team,
            order: u.team.order.filter((x) => !gone.has(x)),
            captainUid: cut(u.team.captainUid),
            cornerTakerUid: cut(u.team.cornerTakerUid),
        },
        fichas: u.fichas + s.prize.fichas,
        extraPacks: u.extraPacks + s.prize.packs,
        bigPacks: u.bigPacks + s.prize.big,
        picks: [...u.picks, ...pick],
        sbc: { slots, done: s.repeatable ? u.sbc.done : [...u.sbc.done, id], n: u.sbc.n + 1 },
    };
}
