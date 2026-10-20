import { SPECIES_BY_ID, type Species } from '../engine/data';
import { type DuelMonRecipe, monFromRecipe, monProblems, monRecipe } from '../engine/duel-validate';
import { DEFAULT_LEVEL, type PokemonInstance, viewInstance } from '../engine/instance';
import { defaultMoveset } from '../engine/moves';
import { EVENT_TYPES, ICONS, mvpLevel } from '../engine/specials';
import type { RunState } from './game-store';
import type { AlbumEdition, HallEntry } from './profile';

/**
 * Álbum de cartas (as figurinhas da Pokédex): só as cartas especiais (Shiny, Evento, Ícone, Destaque), uma por
 * espécie × edição, nunca repetida. Cada espaço guarda a melhor versão que você já tirou (combo, nível de MVP/
 * Destaque, campeã, nota) e quantas cartas diferentes daquela edição já passaram pelo seu time. A carta vai como
 * receita (a mesma do Duelo), que o motor desenha de novo. Carta Shiny com edição (Shiny Ícone) ocupa os dois espaços.
 *
 * Se a figurinha está colada ou não é a Pokédex que diz (`DexEntry.editions`, a mesma conta da medalha e da platina):
 * aqui fica só a carta que aparece nela.
 */
export type BinderFrom = 'draft' | 'recompensa' | 'evolucao' | 'hall';
const FROMS: BinderFrom[] = ['draft', 'recompensa', 'evolucao', 'hall'];

/** Edições que viram figurinha no álbum de cartas (a Normal não entra). */
export type CardSlot = Exclude<AlbumEdition, 'normal'>;
export const CARD_SLOTS: CardSlot[] = ['icone', 'shiny', 'evento', 'destaque'];

export interface BinderCard {
    /** Espaço do álbum: `espécie:edição` ("6:icone"). */
    id: string;
    /** A melhor carta desse espaço: uid (a forma evoluída ganha `>espécie`). */
    uid: string;
    card: DuelMonRecipe;
    /** Quando a melhor chegou (ms). */
    at: number;
    from: BinderFrom;
    /** Seed da copa de onde veio. */
    cup?: string;
    /** Estava no elenco campeão. */
    champ?: boolean;
    /** Quantas cartas diferentes dessa espécie × edição você já tirou. */
    n: number;
    /** As últimas cartas contadas: a mesma carta de novo (virou Destaque, foi campeã) não conta 2 vezes. */
    seen: string[];
    /**
     * As versões que você já teve nesse espaço (Ícone, Shiny Ícone, Shiny Ícone MVP 2…), a melhor de cada combo.
     * Álbum de antes delas não tem: a versão é a própria melhor carta (`versionsOf`).
     */
    versions?: BinderVersion[];
}

/** Uma versão de um espaço do álbum: a melhor carta daquele combo (`versionKey`). */
export interface BinderVersion {
    uid: string;
    card: DuelMonRecipe;
    at: number;
    from: BinderFrom;
    champ?: boolean;
}

/** ponytail: guarda só as últimas 30 contadas; a mesma carta só volta dentro da própria copa. */
const SEEN_MAX = 30;
/** Versões por espaço que um save de fora pode trazer (Shiny × Evento × 2 tipos × MVP 0–3 = 16 no máximo). */
const VERSIONS_MAX = 24;
/** Vitrine de cartas no perfil público (o cartão do treinador; o rival vê no Duelo). */
export const CARD_SHOWCASE_MAX = 3;

export const binderKey = (p: PokemonInstance) => (p.evolved ? `${p.uid}>${p.speciesId}` : p.uid);
export const slotId = (speciesId: number, ed: CardSlot) => `${speciesId}:${ed}`;

/** Os espaços que a carta ocupa: o Shiny e a edição especial (nenhum = carta comum). */
export function cardSlots(card: { shiny: boolean; special?: { kind: CardSlot } | null }): CardSlot[] {
    return [...(card.shiny ? (['shiny'] as const) : []), ...(card.special ? [card.special.kind] : [])];
}

/** A carta pra desenhar (o uid de origem fica: a evolução do Eevee sai dele). */
export const binderInst = (c: Pick<BinderCard, 'card' | 'uid'>): PokemonInstance =>
    monFromRecipe(c.card, c.uid.split('>')[0]);

/** Edição mais rara primeiro (na "melhor" da espécie): Ícone, Destaque, Evento. */
const RARITY = { icone: 3, destaque: 2, evento: 1 } as const;

/** Ordem da "melhor": mais edições juntas (Shiny Ícone), edição mais rara, maior nível (MVP/Destaque), campeã, nota. */
const rank = (c: Pick<BinderCard, 'card' | 'champ' | 'uid'>) => [
    cardSlots(c.card).length,
    c.card.special ? RARITY[c.card.special.kind] : 0,
    c.card.special?.level ?? (c.card.special?.kind === 'destaque' ? 1 : 0),
    c.champ ? 1 : 0,
    viewInstance(monFromRecipe(c.card, c.uid.split('>')[0])).overall,
];
export function betterCard(
    a: Pick<BinderCard, 'card' | 'champ' | 'uid'>,
    b: Pick<BinderCard, 'card' | 'champ' | 'uid'>,
): boolean {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] > rb[i];
    return false;
}

/** O combo da carta: Shiny, edição base, tipo do Evento e nível do selo MVP ("s.icone..2"). */
export const versionKey = (card: Pick<PokemonInstance, 'shiny' | 'special'>) =>
    [card.shiny ? 's' : '', card.special?.kind ?? '', card.special?.type ?? '', mvpLevel(card as PokemonInstance)].join(
        '.',
    );

const toVersion = (c: BinderVersion): BinderVersion => ({
    uid: c.uid,
    card: c.card,
    at: c.at,
    from: c.from,
    ...(c.champ && { champ: true }),
});

/** As versões do espaço, da melhor pra pior (álbum de antes das versões: só a melhor carta). */
export const versionsOf = (c: BinderCard | undefined): BinderVersion[] =>
    c ? [...(c.versions ?? [toVersion(c)])].sort((a, b) => (betterCard(a, b) ? -1 : betterCard(b, a) ? 1 : 0)) : [];

/** Junta versões: uma por combo, a melhor; a mesma carta de novo fica com a data de quando chegou. */
function mergeVersions(a: BinderVersion[], b: BinderVersion[]): BinderVersion[] {
    const byKey = new Map<string, BinderVersion>();
    for (const v of [...a, ...b]) {
        const k = versionKey(v.card);
        const prev = byKey.get(k);
        if (!prev) byKey.set(k, v);
        else if (prev.uid === v.uid)
            byKey.set(k, { ...prev, card: v.card, ...((prev.champ || v.champ) && { champ: true }) });
        else if (betterCard(v, prev)) byKey.set(k, v);
    }
    return [...byKey.values()];
}

/** A melhor carta que você já teve da espécie (a "Melhor carta" da ficha), entre os espaços `got`. */
export function bestOfSpecies(binder: BinderCard[], speciesId: number, got: (c: BinderCard) => boolean = () => true) {
    let best: BinderCard | null = null;
    for (const c of binder) if (c.card.speciesId === speciesId && got(c) && (!best || betterCard(c, best))) best = c;
    return best;
}

/** A barra de evolução da copa não é da carta: fica de fora. */
const recipeOf = (p: PokemonInstance): DuelMonRecipe => {
    const { evo: _, ...r } = monRecipe(p);
    return r;
};

type Meta = { from: BinderFrom; at: number; cup?: string; champ?: boolean };

function put(bySlot: Map<string, BinderCard>, p: PokemonInstance, uid: string, meta: Meta) {
    const card = recipeOf(p);
    for (const ed of cardSlots(card)) {
        const id = slotId(p.speciesId, ed);
        const prev = bySlot.get(id);
        const seen = [...(prev?.seen.filter((x) => x !== uid) ?? []), uid].slice(-SEEN_MAX);
        const n = (prev?.n ?? 0) + (prev?.seen.includes(uid) ? 0 : 1);
        // a mesma carta de novo (virou Destaque, ganhou MVP, foi campeã): fica a data e a origem de quando chegou
        const same = prev?.uid === uid ? prev : undefined;
        const champ = !!meta.champ || !!same?.champ;
        const cup = same?.cup ?? meta.cup;
        const versions = mergeVersions(versionsOf(prev), [
            { uid, card, at: meta.at, from: meta.from, ...(meta.champ && { champ: true }) },
        ]);
        const cand: BinderCard = {
            id,
            uid,
            card,
            at: same?.at ?? meta.at,
            from: same?.from ?? meta.from,
            ...(cup && { cup }),
            ...(champ && { champ }),
            n,
            seen,
            versions,
        };
        bySlot.set(id, !prev || same || betterCard(cand, prev) ? cand : { ...prev, n, seen, versions });
    }
}

/** Põe cartas no álbum (as comuns não entram). */
export function binderAdd(list: BinderCard[], cards: PokemonInstance[], meta: Meta): BinderCard[] {
    if (!cards.some((p) => cardSlots(p).length)) return list;
    const bySlot = new Map(list.map((c) => [c.id, c]));
    for (const p of cards) put(bySlot, p, binderKey(p), meta);
    return [...bySlot.values()];
}

/** Junta o álbum da nuvem com o do aparelho: por espaço fica a melhor carta, e a contagem não duplica. */
export function mergeBinder(a: unknown = [], b: unknown = []): BinderCard[] {
    const bySlot = new Map<string, BinderCard>();
    for (const c of [...cleanBinder(a), ...cleanBinder(b)]) {
        const prev = bySlot.get(c.id);
        if (!prev) {
            bySlot.set(c.id, c);
            continue;
        }
        const seen = [...new Set([...prev.seen, ...c.seen])];
        // o mesmo save dos dois lados: fica a contagem maior; dois aparelhos com cartas diferentes: soma
        const n = Math.max(prev.n, c.n, seen.length);
        const best = betterCard(c, prev) ? c : prev;
        const versions = mergeVersions(versionsOf(prev), versionsOf(c));
        bySlot.set(c.id, { ...best, n, seen: seen.slice(-SEEN_MAX), versions });
    }
    return [...bySlot.values()];
}

const okRecipe = (card: unknown): card is DuelMonRecipe =>
    !!card && typeof card === 'object' && !monProblems(card as DuelMonRecipe, '').length;

/**
 * Álbum vindo de fora do aparelho (backup, nuvem) ou do save: só entradas que são cartas de verdade. O fichário da
 * 0.8.8 (uma entrada por carta, comuns inclusive) vira álbum: cada carta especial conta no espaço dela.
 */
export function cleanBinder(raw: unknown): BinderCard[] {
    if (!Array.isArray(raw)) return [];
    const bySlot = new Map<string, BinderCard>();
    const legacy: { uid: string; card: DuelMonRecipe; meta: Meta }[] = [];
    for (const c of raw as Partial<BinderCard>[]) {
        if (!c || typeof c !== 'object' || typeof c.id !== 'string' || c.id.length > 80) continue;
        if (typeof c.at !== 'number' || !Number.isFinite(c.at) || !FROMS.includes(c.from as BinderFrom)) continue;
        const card = c.card;
        if (!okRecipe(card)) continue;
        const meta: Meta = {
            from: c.from as BinderFrom,
            at: c.at,
            ...(typeof c.cup === 'string' && { cup: c.cup }),
            ...(c.champ === true && { champ: true }),
        };
        if (c.n === undefined && c.seen === undefined) {
            legacy.push({ uid: c.id, card, meta });
            continue;
        }
        const slots = cardSlots(card).map((ed) => slotId(card.speciesId, ed));
        if (!slots.includes(c.id) || bySlot.has(c.id) || typeof c.uid !== 'string' || c.uid.length > 80) continue;
        if (typeof c.n !== 'number' || !Number.isInteger(c.n) || c.n < 1 || !Array.isArray(c.seen)) continue;
        const seen = c.seen.filter((x): x is string => typeof x === 'string' && x.length <= 80).slice(-SEEN_MAX);
        const best: BinderCard = { id: c.id, uid: c.uid, card, ...meta, n: c.n, seen };
        const ok = (v: Partial<BinderVersion>): v is BinderVersion =>
            !!v &&
            typeof v.uid === 'string' &&
            v.uid.length <= 80 &&
            typeof v.at === 'number' &&
            Number.isFinite(v.at) &&
            FROMS.includes(v.from as BinderFrom) &&
            okRecipe(v.card) &&
            cardSlots(v.card).some((ed) => slotId((v.card as DuelMonRecipe).speciesId, ed) === c.id);
        const raw = Array.isArray(c.versions) ? c.versions.slice(0, VERSIONS_MAX).filter(ok).map(toVersion) : [];
        bySlot.set(c.id, { ...best, versions: mergeVersions(raw, [toVersion(best)]) });
    }
    // fichário antigo: na ordem de chegada, como se cada carta entrasse agora
    for (const l of legacy.sort((x, y) => x.meta.at - y.meta.at))
        put(bySlot, monFromRecipe(l.card, l.uid.split('>')[0]), l.uid, l.meta);
    return [...bySlot.values()];
}

const fromOf = (p: PokemonInstance): BinderFrom =>
    p.evolved ? 'evolucao' : /-c\d+$/.test(p.uid) ? 'recompensa' : 'draft';

/** Carta do Hall da Fama (que só guarda espécie e Shiny): o golpe e a habilidade padrão da espécie. */
function hallCard(h: HallEntry, i: number): PokemonInstance | null {
    const p = h.squad[i];
    const sp = SPECIES_BY_ID.get(p?.speciesId);
    if (!sp || sp.id > 151) return null;
    return {
        uid: `hall-${h.id}-${i}`,
        speciesId: sp.id,
        level: 50,
        xp: 0,
        moves: defaultMoveset(sp),
        ability: sp.id === 132 ? 'imposter' : sp.abilities[0],
        shiny: !!p.shiny,
        nickname: null,
        condition: 1,
    };
}

/**
 * Save de antes do álbum: as cartas das copas guardadas (a atual e as paradas) e os elencos do Hall da Fama (o que
 * dá pra refazer: espécie e Shiny). Copa que já veio das copas guardadas não entra de novo pelo Hall.
 */
export function binderBackfill(runs: (RunState | null | undefined)[], hall: HallEntry[]): BinderCard[] {
    const b = new Map<string, BinderCard>();
    const cups = new Set<string>();
    for (const r of runs) {
        if (!r || !Array.isArray(r.picks)) continue;
        const at = r.startedAt ?? r.endedAt ?? 0;
        cups.add(r.seed);
        const squad = new Set(r.status === 'champion' ? [...r.lineup, ...r.bench] : []);
        for (const p of r.picks) put(b, p, binderKey(p), { from: fromOf(p), at, cup: r.seed, champ: squad.has(p.uid) });
    }
    for (const h of hall) {
        if (cups.has(h.id) || !Array.isArray(h.squad)) continue;
        h.squad.forEach((_, i) => {
            const p = hallCard(h, i);
            if (p) put(b, p, p.uid, { from: 'hall', at: h.date, cup: h.id, champ: true });
        });
    }
    return [...b.values()];
}

/** O álbum do save: o que já tem (o fichário antigo convertido), ou (save de antes dele) as copas e o Hall. */
export const binderOf = (s: {
    binder?: unknown;
    run?: RunState | null;
    parkedRuns?: RunState[];
    hall?: HallEntry[];
}): BinderCard[] =>
    Array.isArray(s.binder) ? cleanBinder(s.binder) : binderBackfill([s.run, ...(s.parkedRuns ?? [])], s.hall ?? []);

// ------------------------------------------------------------------------------------------- vitrine
/** A carta padrão da espécie (nível 50, golpes padrão), com a edição do espaço quando há. */
export function defaultCard(sp: Species, ed?: CardSlot): PokemonInstance {
    const evType = sp.types.find((ty) => EVENT_TYPES.includes(ty)) ?? sp.types[0];
    return {
        uid: `dex-${sp.id}${ed ? `-${ed}` : ''}`,
        speciesId: sp.id,
        level: DEFAULT_LEVEL,
        xp: 0,
        moves: defaultMoveset(sp),
        ability: sp.abilities[0] ?? '',
        shiny: ed === 'shiny',
        nickname: null,
        condition: 1,
        special:
            ed === 'icone'
                ? { kind: 'icone', title: ICONS[sp.id] }
                : ed === 'evento'
                  ? { kind: 'evento', type: evType }
                  : ed === 'destaque'
                    ? { kind: 'destaque', level: 1 }
                    : null,
    };
}

/** Figurinha de antes do álbum (colada, sem carta guardada): a vitrine e "Suas versões" usam a carta padrão. */
export const OLD_VERSION = 'padrao';

/**
 * Id de uma versão na vitrine: o espaço da edição base (o Shiny Ícone fica no Ícone) + o combo. "6:icone#s.icone..2";
 * a figurinha de antes do álbum: "150:icone#padrao".
 */
export const versionId = (speciesId: number, v: BinderVersion | { ed: CardSlot }) =>
    'ed' in v
        ? `${slotId(speciesId, v.ed)}#${OLD_VERSION}`
        : `${slotId(speciesId, v.card.special?.kind ?? 'shiny')}#${versionKey(v.card)}`;

export interface ShowcaseCard {
    /** Id da versão (`versionId`): o que a vitrine guarda. */
    id: string;
    inst: PokemonInstance;
    /** A versão guardada (null: a carta padrão da figurinha de antes do álbum). */
    v: BinderVersion | null;
}

/**
 * A vitrine do seu save: só versões que você tem (`ok`: a figurinha do espaço está colada), no máximo 3. A escolha
 * guarda a versão (`versionId`); a de antes guardava o espaço ("6:icone": a melhor carta dele) ou a carta (uid).
 */
export function resolveCardShowcase(
    choice: unknown,
    binder: BinderCard[],
    ok: (slot: string) => boolean = () => true,
): ShowcaseCard[] {
    if (!Array.isArray(choice)) return [];
    const out: ShowcaseCard[] = [];
    const push = (x: ShowcaseCard) => !out.some((o) => o.id === x.id) && out.push(x);
    for (const raw of choice) {
        if (typeof raw !== 'string') continue;
        const [slot, key] = raw.split('#');
        const [spId, ed] = slot.split(':');
        const sp = SPECIES_BY_ID.get(Number(spId));
        if (key === OLD_VERSION) {
            if (sp && CARD_SLOTS.includes(ed as CardSlot) && ok(slot))
                push({ id: raw, inst: defaultCard(sp, ed as CardSlot), v: null });
            continue;
        }
        const c =
            binder.find((x) => x.id === slot) ??
            (key ? undefined : binder.find((x) => x.uid === raw || x.seen.includes(raw)));
        if (!c || !ok(c.id)) continue;
        const vs = versionsOf(c);
        const v = (key && vs.find((x) => versionKey(x.card) === key)) || vs[0];
        // o Shiny Ícone fica nos 2 espaços: na vitrine aparece uma vez (o id é o da edição base)
        if (v) push({ id: versionId(c.card.speciesId, v), inst: binderInst(v), v });
    }
    return out.slice(0, CARD_SHOWCASE_MAX);
}

/**
 * Vitrine de cartas que veio do rival no Duelo: só cartas que uma copa poderia dar (a mesma conferência do Time
 * pronto), no máximo 3; lixo na frente não ocupa vaga (olha até 10).
 */
export function parseCardShowcase(raw: unknown): PokemonInstance[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .slice(0, 10)
        .filter((m) => !monProblems(m, '').length)
        .slice(0, CARD_SHOWCASE_MAX)
        .map((m, i) => monFromRecipe(m, `vitrine-${i}`));
}
