import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES, type Species, species } from '../../engine/data';
import { type DuelMonRecipe, monRecipe } from '../../engine/duel-validate';
import type { PokemonInstance } from '../../engine/instance';
import { EVENT_TYPES, ICONS, mvpLevel } from '../../engine/specials';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    type BinderCard,
    type BinderVersion,
    binderInst,
    CARD_SHOWCASE_MAX,
    CARD_SLOTS,
    type CardSlot,
    defaultCard,
    resolveCardShowcase,
    type ShowcaseCard,
    slotId,
    versionId,
    versionsOf,
} from '../../store/binder';
import { useGame } from '../../store/game-store';
import { toggleShowcase } from '../../store/medals';
import { albumCount, albumSlots, type Dex, hasSticker } from '../../store/profile';
import { useCardModal } from '../card-modal';
import { HudIcon } from '../components/MatchHud';
import { PokeCard2 } from '../components/PokeCard2';
import { TypeIcon } from '../components/TypeIcon';
import { TYPE_COLOR } from '../type-colors';
import { speciesGif } from './club';
import './album.css';

/** Sem importar a ficha (que puxa o som do grito): o Perfil público usa o Álbum. */
const dexNo = (id: number) => String(id).padStart(3, '0');

/** Figurinha colada no espaço "6:icone" (a Pokédex é quem diz: mesma conta da medalha e da platina). */
const stuck = (dex: Dex) => (slot: string) => {
    const [id, ed] = slot.split(':');
    return hasSticker(dex[Number(id)], ed as CardSlot);
};

/** Sua vitrine de cartas (qualquer versão que você tem no álbum) e o que vai pro Duelo. */
export function useCardShowcase(): { cards: ShowcaseCard[]; insts: PokemonInstance[]; encoded: DuelMonRecipe[] } {
    const binder = useGame((s) => s.binder);
    const dex = useGame((s) => s.dex);
    const choice = useGame((s) => s.profile.cardShowcase);
    return useMemo(() => {
        const cards = resolveCardShowcase(choice, binder, stuck(dex));
        const insts = cards.map((c) => c.inst);
        // a barra de evolução não vai pro rival (a vitrine é a carta, não a copa)
        return { cards, insts, encoded: insts.map((p) => ({ ...monRecipe(p), evo: undefined })) };
    }, [choice, binder, dex]);
}

/** Nome do combo da carta: "Shiny Ícone MVP 2", "Destaque III", "Evento Fogo". */
export function useComboName() {
    const { d, lang } = useT();
    return (p: Pick<PokemonInstance, 'shiny' | 'special'>) => {
        const s = p.special;
        const parts = p.shiny ? ['Shiny'] : [];
        if (s) {
            parts.push(d.common.edition[s.kind]);
            if (s.kind === 'evento' && s.type) parts.push(typeName(s.type, lang));
            if (s.kind === 'destaque') parts.push(['I', 'II', 'III'][(s.level ?? 1) - 1] ?? '');
            else if (s.level) parts.push(s.level > 1 ? `MVP ${s.level}` : 'MVP');
        }
        return parts.join(' ');
    };
}

// ------------------------------------------------------------------------------------------- páginas
const sortById = (ids: number[]) => ids.sort((a, b) => a - b).map((id) => species(id));
const ICON_SPECIES = sortById(Object.keys(ICONS).map(Number));
/** Evento por tipo: cada Pokémon no 1º tipo dele que entra em evento (um espaço por espécie, sem repetir). */
const EVENT_GROUPS = EVENT_TYPES.map((ty) => ({
    type: ty,
    list: SPECIES.filter((sp) => sp.types.find((x) => EVENT_TYPES.includes(x)) === ty),
})).filter((g) => g.list.length);
const SECTION_SPECIES: Record<CardSlot, Species[]> = {
    icone: ICON_SPECIES,
    shiny: SPECIES,
    evento: EVENT_GROUPS.flatMap((g) => g.list),
    destaque: SPECIES,
};

type Section = CardSlot | 'raras';
const SECTIONS: Section[] = [...CARD_SLOTS, 'raras'];
interface Page {
    ed: Section;
    /** Evento: o tipo da página (um tipo por página). */
    type?: string;
    list: Species[];
    /** Raridades: os combos da página. */
    rare?: BinderVersion[];
}

/** As páginas do álbum, `per` espaços cada: Ícones, Shiny, Evento (uma página por tipo), Destaque. */
export function buildPages(per: number): Page[] {
    const chunk = (ed: CardSlot, list: Species[], type?: string) => {
        const pages: Page[] = [];
        for (let i = 0; i < list.length; i += per) pages.push({ ed, type, list: list.slice(i, i + per) });
        return pages;
    };
    return [
        ...chunk('icone', ICON_SPECIES),
        ...chunk('shiny', SPECIES),
        ...EVENT_GROUPS.flatMap((g) => chunk('evento', g.list, g.type)),
        ...chunk('destaque', SPECIES),
    ];
}

/** Combo raro (página Raridades): Shiny com Ícone ou Evento, ou selo 3 (Ícone/Evento MVP 3, Destaque III). */
export const isRare = (card: Pick<PokemonInstance, 'shiny' | 'special'>) =>
    (card.shiny && (card.special?.kind === 'icone' || card.special?.kind === 'evento')) ||
    mvpLevel(card as PokemonInstance) >= 3;

/** Os combos raros que você já tirou (um por versão, mesmo o Shiny Ícone que fica em 2 espaços). */
export function rareVersions(binder: BinderCard[], ok: (slot: string) => boolean): BinderVersion[] {
    const out = new Map<string, BinderVersion>();
    for (const c of binder)
        if (ok(c.id)) for (const v of versionsOf(c)) if (isRare(v.card)) out.set(versionId(v.card.speciesId, v), v);
    return [...out.values()].sort((a, b) => a.card.speciesId - b.card.speciesId);
}

/** Inclinação da figurinha colada: sempre a mesma pra mesma espécie × edição (entre -2,5° e 2,5°). */
const tilt = (id: number, ed: string) => (((id * 37 + ed.length * 11) % 11) - 5) / 2;

function useMedia(q: string) {
    const get = () => (typeof window !== 'undefined' && window.matchMedia?.(q).matches) || false;
    const [m, setM] = useState(get);
    // biome-ignore lint/correctness/useExhaustiveDependencies: a consulta é fixa
    useEffect(() => {
        const mq = window.matchMedia?.(q);
        if (!mq) return;
        const on = () => setM(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);
    return m;
}

/** Figurinhas que você já viu coladas (por aparelho): as novas colam com animação na 1ª vez que aparecem. */
const SEEN_KEY = 'soccermon.album.colados';
function useFresh(dex: Dex) {
    const [fresh, setFresh] = useState<Set<string>>(() => {
        const got = SPECIES.flatMap((sp) =>
            CARD_SLOTS.filter((ed) => hasSticker(dex[sp.id], ed)).map((ed) => slotId(sp.id, ed)),
        );
        let prev: string[] | null = null;
        try {
            prev = JSON.parse(localStorage.getItem(SEEN_KEY) ?? 'null');
            localStorage.setItem(SEEN_KEY, JSON.stringify(got));
        } catch {
            return new Set();
        }
        // 1ª vez no álbum: a coleção inteira cola, página por página
        return new Set(Array.isArray(prev) ? got.filter((x) => !prev.includes(x)) : got);
    });
    const done = (ids: string[]) =>
        setFresh((f) => (ids.some((x) => f.has(x)) ? new Set([...f].filter((x) => !ids.includes(x))) : f));
    return { fresh, done };
}

/** Uma linha de "Suas versões" (a figurinha de antes do álbum vira a carta padrão). */
interface Row {
    id: string;
    inst: PokemonInstance;
    v: BinderVersion | null;
}

/**
 * Álbum de figurinhas (estilo Panini, aprovado pelo Miguel em 19/10): páginas de papel com a carta de verdade
 * colada levemente torta; espaço vazio com nome, silhueta e número. Ícones, Shiny, Evento (uma página por tipo),
 * Destaque e, no fim, Raridades (só os combos difíceis que você já fez). Uma página no celular, duas no desktop.
 * Tocar no vazio abre a ficha; na figurinha, a carta grande com "Suas versões" e a vitrine.
 */
export function AlbumView({
    at,
    paused,
    onSheet,
}: {
    /** Abre na página do Pokémon ("Ver no álbum" da ficha); `n` muda a cada pedido. */
    at?: { id: number; n: number } | null;
    /** A ficha está aberta por cima: as setas do teclado são dela. */
    paused?: boolean;
    onSheet: (id: number, order: number[]) => void;
}) {
    const { t, d, lang } = useT();
    const combo = useComboName();
    const binder = useGame((s) => s.binder);
    const dex = useGame((s) => s.dex);
    const choice = useGame((s) => s.profile.cardShowcase);
    const updateProfile = useGame((s) => s.updateProfile);
    const bySlot = useMemo(() => new Map(binder.map((c) => [c.id, c])), [binder]);
    const ok = useMemo(() => stuck(dex), [dex]);
    const shown = useMemo(() => resolveCardShowcase(choice, binder, ok), [choice, binder, ok]);
    const shownIds = shown.map((s) => s.id);
    const full = shown.length >= CARD_SHOWCASE_MAX;
    const toggle = (id: string) => updateProfile({ cardShowcase: toggleShowcase(shownIds, id) });

    // 6 por página no celular (a carta fica legível no 320), 12 no tablet e no desktop; duas páginas abertas no desktop
    const narrow = useMedia('(max-width: 599px), (max-height: 500px)');
    const wide = useMedia('(min-width: 1000px) and (min-height: 600px)');
    const per = narrow ? 6 : 12;
    const step = wide ? 2 : 1;
    const rare = useMemo(() => rareVersions(binder, ok), [binder, ok]);
    const pages = useMemo(() => {
        const out = buildPages(per);
        if (!rare.length) out.push({ ed: 'raras', list: [], rare: [] });
        for (let i = 0; i < rare.length; i += per) out.push({ ed: 'raras', list: [], rare: rare.slice(i, i + per) });
        return out;
    }, [per, rare]);

    const [page, setPage] = useState(0);
    const [dir, setDir] = useState<'next' | 'prev' | ''>('');
    const [found, setFound] = useState<string | null>(null);
    const { fresh, done } = useFresh(dex);
    const turn = (to: number) => {
        const p = Math.max(0, Math.min(pages.length - 1, to));
        if (p === page) return;
        setDir(p > page ? 'next' : 'prev');
        setPage(p);
        setFound(null);
    };
    // trocou o tamanho da página (girou o celular): fica onde estava o primeiro Pokémon
    const anchor = useRef<{ ed: Section; type?: string; id?: number }>({ ed: 'icone' });
    // biome-ignore lint/correctness/useExhaustiveDependencies: só quando muda o tamanho
    useEffect(() => {
        const a = anchor.current;
        const p = pages.findIndex(
            (pg) => pg.ed === a.ed && pg.type === a.type && (a.id === undefined || pg.list.some((s) => s.id === a.id)),
        );
        setDir('');
        setPage(Math.max(0, p));
    }, [per]);
    const cur = pages[Math.min(page, pages.length - 1)];
    anchor.current = { ed: cur.ed, type: cur.type, id: cur.list[0]?.id };
    const visible = pages.slice(page, page + step);

    // "Ver no álbum": a página da edição mais rara que você tem dele (senão, a Shiny)
    // biome-ignore lint/correctness/useExhaustiveDependencies: a cada pedido da ficha
    useEffect(() => {
        if (!at) return;
        const eds = albumSlots(species(at.id)).filter((e): e is CardSlot => e !== 'normal');
        const want = CARD_SLOTS.find((e) => eds.includes(e) && hasSticker(dex[at.id], e)) ?? 'shiny';
        const p = pages.findIndex((pg) => pg.ed === want && pg.list.some((s) => s.id === at.id));
        if (p < 0) return;
        setDir('');
        setPage(p);
        setFound(slotId(at.id, want));
    }, [at]);

    // as figurinhas novas desta página colam uma vez
    // biome-ignore lint/correctness/useExhaustiveDependencies: marca as da página que ficou à vista
    useEffect(() => {
        const ids = visible.flatMap((p) => p.list.map((sp) => slotId(sp.id, p.ed as CardSlot)));
        const tm = setTimeout(() => done(ids), 1400);
        return () => clearTimeout(tm);
    }, [page, per, step]);

    // teclado: setas viram a página (fora da ficha e da carta aberta)
    useEffect(() => {
        if (paused) return;
        const onKey = (e: KeyboardEvent) => {
            if (useCardModal.getState().inst) return;
            if (e.key === 'ArrowRight') turn(page + step);
            else if (e.key === 'ArrowLeft') turn(page - step);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    // arrastar pro lado vira a página; o toque que arrastou não abre a figurinha
    const drag = useRef<{ x: number; y: number } | null>(null);
    const swiped = useRef(false);
    const onDown = (e: PointerEvent) => {
        drag.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
    };
    const onUp = (e: PointerEvent) => {
        const s = drag.current;
        drag.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
            swiped.current = true;
            turn(page + (dx < 0 ? step : -step));
        }
    };

    /** Quando e como veio ("Draft · copa de 19/10 · campeã"). */
    const origin = (v: BinderVersion) =>
        [
            d.profile.binder.from[v.from],
            v.at > 0 ? t('profile.album.cup', { date: new Date(v.at).toLocaleDateString(lang) }) : '',
            v.champ ? t('profile.album.champ') : '',
        ]
            .filter(Boolean)
            .join(' · ');
    /** As versões do espaço; sem carta guardada (figurinha de antes do álbum), a carta padrão da edição. */
    const rowsOf = (sp: Species, ed: CardSlot): Row[] => {
        const vs = versionsOf(bySlot.get(slotId(sp.id, ed))).map((v) => ({
            id: versionId(sp.id, v),
            inst: binderInst(v),
            v,
        }));
        const oldId = versionId(sp.id, { ed });
        return !vs.length || shownIds.includes(oldId) ? [...vs, { id: oldId, inst: defaultCard(sp, ed), v: null }] : vs;
    };
    /** A carta grande de uma versão, com "Suas versões" (trocar de versão) e o botão da vitrine. */
    const openRow = (sp: Species, ed: CardSlot, id?: string) => {
        const rows = rowsOf(sp, ed);
        const r = rows.find((x) => x.id === id) ?? rows[0];
        const on = shownIds.includes(r.id);
        const n = bySlot.get(slotId(sp.id, ed))?.n ?? 1;
        useCardModal.getState().open(r.inst, {
            note: [
                combo(r.inst),
                r.v ? origin(r.v) : t('profile.album.old'),
                n > 1 ? t('profile.album.pulled', { n }) : '',
                !on && full ? t('profile.binder.full') : '',
            ]
                .filter(Boolean)
                .join(' · '),
            actions: [
                ...(on
                    ? [{ label: t('profile.binder.remove'), onClick: () => toggle(r.id) }]
                    : full
                      ? []
                      : [{ label: t('profile.binder.add'), primary: true, onClick: () => toggle(r.id) }]),
                { label: t('profile.album.sheet'), onClick: () => onSheet(sp.id, [sp.id]) },
            ],
            extra: <Versions rows={rows} current={r.id} shown={shownIds} onPick={(x) => openRow(sp, ed, x)} />,
        });
    };
    const edOfId = (id: string) => id.split('#')[0].split(':')[1] as CardSlot;
    const tap = (sp: Species, ed: CardSlot, order: number[]) => {
        if (swiped.current) return;
        if (hasSticker(dex[sp.id], ed)) openRow(sp, ed);
        else onSheet(sp.id, order);
    };

    const sectionOf = (p: Page) => pages.filter((x) => x.ed === p.ed);
    const label = (p: Page) =>
        `${d.profile.album.sections[p.ed]}${p.type ? ` · ${typeName(p.type, lang)}` : ''} · ${t('profile.album.page', {
            n: sectionOf(p).indexOf(p) + 1,
            total: sectionOf(p).length,
        })}`;
    const total = albumCount(dex);
    const commons = albumCount(dex, SPECIES, ['normal']);

    const sticker = (inst: PokemonInstance, key: string, ed: string, i: number, n = 1) => (
        <>
            <span
                className={`al-stk${fresh.has(key) ? ' pasting' : ''}`}
                style={{ '--rot': `${tilt(inst.speciesId, ed)}deg`, '--d': `${i * 70}ms` } as CSSProperties}
            >
                <PokeCard2 inst={inst} variant="metal" />
            </span>
            {n > 1 && <span className="al-n">×{n}</span>}
        </>
    );
    const slotEl = (p: Page, sp: Species, i: number) => {
        const ed = p.ed as CardSlot;
        const id = slotId(sp.id, ed);
        const got = hasSticker(dex[sp.id], ed);
        const known = !!dex[sp.id];
        const row = got ? rowsOf(sp, ed)[0] : null;
        const n = bySlot.get(id)?.n ?? 1;
        const edition = d.common.edition[ed];
        return (
            <li key={id}>
                <button
                    type="button"
                    className={`al-slot${got ? ' got' : ''}${found === id ? ' found' : ''}`}
                    onClick={() =>
                        tap(
                            sp,
                            ed,
                            p.list.map((s) => s.id),
                        )
                    }
                    aria-label={
                        got
                            ? t('profile.album.cellGot', { name: sp.name, edition, n })
                            : t('profile.album.cellMissing', { name: known ? sp.name : `Nº ${sp.id}`, edition })
                    }
                >
                    <span className="al-box">
                        {/* o que vem impresso na página: nome, silhueta e número */}
                        <span className="al-print" aria-hidden>
                            <small>{known ? sp.name : '???'}</small>
                            <img className="pixel" src={speciesGif(sp.id)} alt="" loading="lazy" draggable={false} />
                            <b>#{dexNo(sp.id)}</b>
                        </span>
                        {row && sticker(row.inst, id, ed, i, n)}
                    </span>
                </button>
            </li>
        );
    };
    const rareEl = (v: BinderVersion, i: number) => {
        const id = versionId(v.card.speciesId, v);
        const sp = species(v.card.speciesId);
        const inst = binderInst(v);
        return (
            <li key={id}>
                <button
                    type="button"
                    className="al-slot got"
                    onClick={() => !swiped.current && openRow(sp, edOfId(id), id)}
                    aria-label={`${sp.name}, ${combo(inst)}`}
                >
                    <span className="al-box">{sticker(inst, id, 'raras', i)}</span>
                    <small className="al-cap">{combo(inst)}</small>
                </button>
            </li>
        );
    };

    return (
        <div className="al">
            <section className="panel pf-card bd-showcase">
                <h2>
                    {t('profile.binder.showcase')}{' '}
                    <span className="pf-count">
                        {shown.length}/{CARD_SHOWCASE_MAX}
                    </span>
                </h2>
                <div className="bd-slots">
                    {Array.from({ length: CARD_SHOWCASE_MAX }, (_, i) => {
                        const c = shown[i];
                        return c ? (
                            <button
                                type="button"
                                key={c.id}
                                className="al-cell got"
                                onClick={() => openRow(species(c.inst.speciesId), edOfId(c.id), c.id)}
                            >
                                <PokeCard2 inst={c.inst} variant="metal" />
                            </button>
                        ) : (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 3 vagas fixas
                            <div key={i} className="bd-slot" aria-hidden />
                        );
                    })}
                </div>
                <small className="muted">{t('profile.binder.showcaseHelp')}</small>
            </section>

            <div className="pf-album">
                <span className="pf-album-label">{t('profile.album.title')}</span>
                <b className="pf-album-n">
                    <span aria-hidden>
                        {total.got}
                        <small>/{total.total}</small>
                    </span>
                    <span className="pf-sr">{t('profile.dex.stickersAria', { n: total.got, total: total.total })}</span>
                </b>
                <div className="pf-bar" aria-hidden>
                    <i className="played" style={{ width: `${(total.got / total.total) * 100}%` }} />
                </div>
                <small className="muted">{t('profile.album.help')}</small>
            </div>

            <nav className="al-index" aria-label={t('profile.album.sectionsAria')}>
                {SECTIONS.map((ed) => {
                    const n = ed === 'raras' ? null : albumCount(dex, SECTION_SPECIES[ed], [ed]);
                    const on = visible.some((p) => p.ed === ed);
                    return (
                        <button
                            type="button"
                            key={ed}
                            className={`al-tab al-ed-${ed}${on ? ' on' : ''}`}
                            aria-current={on ? 'page' : undefined}
                            onClick={() => turn(pages.findIndex((p) => p.ed === ed))}
                        >
                            <b>{d.profile.album.sections[ed]}</b>
                            <small>{n ? `${n.got}/${n.total}` : rare.length}</small>
                            {n && <i style={{ width: `${(n.got / n.total) * 100}%` }} />}
                        </button>
                    );
                })}
            </nav>

            <div className="al-nav">
                <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => turn(page - step)}
                    disabled={page === 0}
                    aria-label={t('profile.album.prev')}
                >
                    <HudIcon kind="prev" />
                </button>
                <span className="al-where" aria-live="polite">
                    {label(cur)}
                </span>
                <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => turn(page + step)}
                    disabled={page + step >= pages.length}
                    aria-label={t('profile.album.next')}
                >
                    <HudIcon kind="next" />
                </button>
            </div>
            <div
                className="al-book"
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerCancel={() => {
                    drag.current = null;
                }}
            >
                {visible.map((p, i) => (
                    <section
                        key={`${per}-${pages.indexOf(p)}`}
                        className={`al-page al-ed-${p.ed}${dir ? ` turn-${dir}` : ''}${i ? ' right' : ''}`}
                        style={p.type ? ({ '--ev': TYPE_COLOR[p.type] } as CSSProperties) : undefined}
                        aria-label={label(p)}
                    >
                        <header className="al-ph">
                            {p.type && <TypeIcon type={p.type} size={18} />}
                            <b>
                                {d.profile.album.sections[p.ed]}
                                {p.type ? ` · ${typeName(p.type, lang)}` : ''}
                            </b>
                            <span>
                                {sectionOf(p).indexOf(p) + 1}/{sectionOf(p).length}
                            </span>
                        </header>
                        {p.rare ? (
                            <>
                                <p className="al-rare-help">
                                    {p.rare.length ? t('profile.album.rareHelp') : t('profile.album.rareNone')}
                                </p>
                                <ul className="al-pgrid">{p.rare.map(rareEl)}</ul>
                            </>
                        ) : (
                            <ul className="al-pgrid">{p.list.map((sp, j) => slotEl(p, sp, j))}</ul>
                        )}
                        <footer className="al-folio" aria-hidden>
                            {pages.indexOf(p) + 1}
                        </footer>
                    </section>
                ))}
            </div>
            <small className="muted al-swipe">{t('profile.album.swipe')}</small>

            <p className="pf-note al-commons">{t('profile.album.commons', { n: commons.got, total: commons.total })}</p>
        </div>
    );
}

/** "Suas versões": todas as versões que você já teve dessa edição; tocar troca a carta grande. */
function Versions({
    rows,
    current,
    shown,
    onPick,
}: {
    rows: Row[];
    current: string;
    shown: string[];
    onPick: (id: string) => void;
}) {
    const { t } = useT();
    const combo = useComboName();
    return (
        <section className="al-versions">
            <h3>
                {t('profile.album.versions')} <span className="pf-count">{rows.length}</span>
            </h3>
            <ul>
                {rows.map((r) => (
                    <li key={r.id}>
                        <button
                            type="button"
                            className={r.id === current ? 'on' : undefined}
                            aria-pressed={r.id === current}
                            onClick={() => r.id !== current && onPick(r.id)}
                        >
                            <b>{combo(r.inst)}</b>
                            {!r.v && <em>{t('profile.album.oldTag')}</em>}
                            {shown.includes(r.id) && (
                                <small>
                                    <HudIcon kind="cards" /> {t('profile.album.onShowcase')}
                                </small>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
