import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES, type Species, species } from '../../engine/data';
import { type DuelMonRecipe, monRecipe } from '../../engine/duel-validate';
import type { PokemonInstance } from '../../engine/instance';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    type BinderCard,
    type BinderVersion,
    betterCard,
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
import { newsKey } from '../../store/news';
import { albumCount, albumSlots, type Dex, GENERATIONS, hasSticker } from '../../store/profile';
import { useCardModal } from '../card-modal';
import { HudIcon } from '../components/MatchHud';
import { PokeCard2 } from '../components/PokeCard2';
import { reduceMotionOn } from '../reduce-motion';
import { speciesGif } from './club';
import { NewBadge, NewDot, useNews } from './news';
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

// ------------------------------------------------------------------------------------------- o livro
/** Os álbuns da estante: um por geração (só Kanto por enquanto; o da Gen 2 aparece fechado, "Em breve"). */
const SHELF = [
    ...GENERATIONS.map((g) => ({ ...g, live: true })),
    { gen: 2, region: 'Johto', from: 152, to: 251, live: false },
];
const KANTO = SPECIES.filter((sp) => sp.id <= 151);

/** Uma versão da espécie no álbum (a figurinha de antes dele e a Normal viram a carta padrão). */
interface Row {
    id: string;
    inst: PokemonInstance;
    v: BinderVersion | null;
}
const normalId = (id: number) => `${id}:normal`;

/**
 * Todas as versões que você tem da espécie, de todas as edições: uma por combo (a Shiny Ícone, que ocupa 2 espaços,
 * aparece uma vez), da melhor pra pior; depois as figurinhas de antes do álbum e, no fim, a Normal.
 */
export function speciesRows(sp: Species, dex: Dex, bySlot: Map<string, BinderCard>): Row[] {
    const e = dex[sp.id];
    const vs: Row[] = [];
    const olds: Row[] = [];
    const ids = new Set<string>();
    for (const ed of CARD_SLOTS) {
        if (!hasSticker(e, ed)) continue;
        const list = versionsOf(bySlot.get(slotId(sp.id, ed)));
        for (const v of list) {
            const id = versionId(sp.id, v);
            if (ids.has(id)) continue;
            ids.add(id);
            vs.push({ id, inst: binderInst(v), v });
        }
        if (!list.length) olds.push({ id: versionId(sp.id, { ed }), inst: defaultCard(sp, ed), v: null });
    }
    vs.sort((a, b) => (betterCard(a.v!, b.v!) ? -1 : betterCard(b.v!, a.v!) ? 1 : 0));
    const normal = hasSticker(e, 'normal') ? [{ id: normalId(sp.id), inst: defaultCard(sp), v: null }] : [];
    return [...vs, ...olds, ...normal];
}

/** A da frente: a escolhida no álbum (se ainda é sua), senão a melhor. */
export const frontRow = (rows: Row[], choice: unknown) =>
    rows.find((r) => typeof choice === 'string' && r.id === choice) ?? rows[0];

/** Inclinação da figurinha colada: sempre a mesma pra mesma espécie (entre -2,5° e 2,5°). */
const tilt = (id: number) => (((id * 37) % 11) - 5) / 2;

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

/**
 * Figurinhas novas (selo NOVO, news.ts): colam com animação na 1ª vez que a página delas aparece. A lista é a da hora
 * em que o álbum abriu (por espécie); quem marca como visto é o selo NOVO de cada uma.
 */
function useFresh() {
    const news = useNews();
    const [fresh, setFresh] = useState<Set<number>>(
        () => new Set([...news].filter((k) => k.startsWith('fig:')).map((k) => Number(k.split(':')[1]))),
    );
    const done = (ids: number[]) =>
        setFresh((f) => (ids.some((x) => f.has(x)) ? new Set([...f].filter((x) => !ids.includes(x))) : f));
    const again = (id: number) => setFresh((f) => new Set([...f, id]));
    return { fresh, done, again };
}

/** Quanto dura abrir/fechar a capa e virar a folha (o CSS usa os mesmos números). */
const COVER_MS = 520;
const LEAF_MS = 650;

/**
 * Álbum de figurinhas (pedido do Miguel em 20/10): uma estante com um livro por geração; tocar na capa abre o livro,
 * as páginas viram (arrastar, setas ou teclado) e cada espaço é um Pokémon, na ordem da Pokédex, com a carta da
 * frente colada (a melhor, ou a que você escolher). Tocar na figurinha abre a carta grande com todas as versões que
 * você tem dele; no vazio, a ficha. Figurinha nova cola com animação quando a página dela aparece.
 */
export function AlbumView({
    at,
    paused,
    onSheet,
}: {
    /** Abre o livro na página do Pokémon ("Ver no álbum" da ficha); `n` muda a cada pedido. */
    at?: { id: number; n: number } | null;
    /** A ficha está aberta por cima: as setas do teclado são dela. */
    paused?: boolean;
    onSheet: (id: number, order: number[]) => void;
}) {
    const { t, tn, d, lang } = useT();
    const combo = useComboName();
    const binder = useGame((s) => s.binder);
    const dex = useGame((s) => s.dex);
    const choice = useGame((s) => s.profile.cardShowcase);
    const front = useGame((s) => s.profile.albumFront);
    const updateProfile = useGame((s) => s.updateProfile);
    const bySlot = useMemo(() => new Map(binder.map((c) => [c.id, c])), [binder]);
    const ok = useMemo(() => stuck(dex), [dex]);
    const shown = useMemo(() => resolveCardShowcase(choice, binder, ok), [choice, binder, ok]);
    const shownIds = shown.map((s) => s.id);
    const full = shown.length >= CARD_SHOWCASE_MAX;
    const toggle = (id: string) => updateProfile({ cardShowcase: toggleShowcase(shownIds, id) });
    const rows = useMemo(() => new Map(KANTO.map((sp) => [sp.id, speciesRows(sp, dex, bySlot)])), [dex, bySlot]);

    // 6 por página no celular (a carta fica legível no 320), 12 no tablet e no desktop; duas páginas abertas no desktop
    const narrow = useMedia('(max-width: 599px), (max-height: 500px)');
    const wide = useMedia('(min-width: 1000px) and (min-height: 600px)');
    const per = narrow ? 6 : 12;
    const step = wide ? 2 : 1;
    const pages = useMemo(() => {
        const out: Species[][] = [];
        for (let i = 0; i < KANTO.length; i += per) out.push(KANTO.slice(i, i + per));
        return out;
    }, [per]);

    // estante → capa abrindo → livro aberto (e o caminho de volta)
    const [book, setBook] = useState<'shelf' | 'opening' | 'open' | 'closing'>(at ? 'open' : 'shelf');
    const reduce = reduceMotionOn();
    const openBook = () => {
        if (reduce) return setBook('open');
        setBook('opening');
        window.setTimeout(() => setBook('open'), COVER_MS);
    };
    const closeBook = () => {
        if (reduce) return setBook('shelf');
        setBook('closing');
        window.setTimeout(() => setBook('shelf'), COVER_MS);
    };

    const [page, setPage] = useState(() => (at ? Math.floor((at.id - 1) / per) : 0));
    const [dir, setDir] = useState<'next' | 'prev' | ''>('');
    const [found, setFound] = useState<number | null>(null);
    const { fresh, done, again } = useFresh();
    /** A folha virando: as páginas de antes e as de depois (some sozinha quando a animação acaba). */
    const [leaf, setLeaf] = useState<{ from: Species[][]; to: Species[][]; n: number } | null>(null);
    const [fan, setFan] = useState<number | null>(null);
    const turn = (to: number) => {
        const p = Math.max(0, Math.min(pages.length - 1, to));
        if (p === page) return;
        setDir(p > page ? 'next' : 'prev');
        setPage(p);
        setFound(null);
        if (reduce) return;
        const n = Date.now();
        setLeaf({ from: pages.slice(cur, cur + step), to: pages.slice(p, p + step), n });
        // some quando a animação acaba (onAnimationEnd); o relógio é só a garantia se ela não rodar
        window.setTimeout(() => setLeaf((l) => (l?.n === n ? null : l)), LEAF_MS * 3);
    };
    // trocou o tamanho da página (girou o celular): fica onde estava o primeiro Pokémon
    const anchor = useRef(1);
    useEffect(() => {
        setDir('');
        setPage(Math.floor((anchor.current - 1) / per));
    }, [per]);
    const cur = Math.min(page, pages.length - 1);
    anchor.current = pages[cur][0].id;
    const visible = pages.slice(cur, cur + step);

    // "Ver no álbum": abre o livro direto na página dele
    // biome-ignore lint/correctness/useExhaustiveDependencies: a cada pedido da ficha
    useEffect(() => {
        if (!at) return;
        setBook('open');
        setDir('');
        const p = Math.floor((at.id - 1) / per);
        setPage(step === 2 ? p - (p % 2) : p);
        setFound(at.id);
    }, [at]);

    // as figurinhas novas da página colam uma vez
    // biome-ignore lint/correctness/useExhaustiveDependencies: marca as da página que ficou à vista
    useEffect(() => {
        if (book !== 'open') return;
        const ids = visible.flat().map((sp) => sp.id);
        const tm = setTimeout(() => done(ids), 1400);
        return () => clearTimeout(tm);
    }, [page, per, step, book]);

    // teclado: setas viram a página (fora da ficha e da carta aberta)
    useEffect(() => {
        if (paused || book !== 'open') return;
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
    const nameOf = (r: Row) => (r.id === normalId(r.inst.speciesId) ? t('profile.sheet.normal') : combo(r.inst));
    /** A carta grande de uma versão, com todas as versões dele, "Mostrar na frente", vitrine e ficha. */
    const openRow = (sp: Species, id?: string) => {
        const list = rows.get(sp.id) ?? [];
        const r = list.find((x) => x.id === id) ?? frontRow(list, front?.[sp.id]);
        if (!r) return;
        const frontId = frontRow(list, front?.[sp.id])?.id;
        const isNormal = r.id === normalId(sp.id);
        const on = shownIds.includes(r.id);
        const ed = isNormal ? null : (r.id.split('#')[0].split(':')[1] as CardSlot);
        const n = ed ? (bySlot.get(slotId(sp.id, ed))?.n ?? 1) : 0;
        useCardModal.getState().open(r.inst, {
            note: [
                nameOf(r),
                r.v ? origin(r.v) : isNormal ? '' : t('profile.album.old'),
                n > 1 ? t('profile.album.pulled', { n }) : '',
                r.id === frontId ? t('profile.album.onFront') : '',
                !isNormal && !on && full ? t('profile.binder.full') : '',
            ]
                .filter(Boolean)
                .join(' · '),
            actions: [
                ...(r.id !== frontId
                    ? [
                          {
                              label: t('profile.album.front'),
                              primary: true,
                              onClick: () => setFront(sp, r.id),
                          },
                      ]
                    : []),
                ...(isNormal
                    ? []
                    : on
                      ? [{ label: t('profile.binder.remove'), onClick: () => toggle(r.id) }]
                      : full
                        ? []
                        : [{ label: t('profile.binder.add'), onClick: () => toggle(r.id) }]),
                { label: t('profile.album.sheet'), onClick: () => onSheet(sp.id, [sp.id]) },
            ],
            extra: (
                <Versions
                    rows={list}
                    current={r.id}
                    front={frontId}
                    shown={shownIds}
                    name={nameOf}
                    onPick={(x) => openRow(sp, x)}
                />
            ),
        });
    };
    const tap = (sp: Species, order: number[]) => {
        if (swiped.current) return;
        const n = rows.get(sp.id)?.length ?? 0;
        if (n > 1) setFan(sp.id);
        else if (n) openRow(sp);
        else onSheet(sp.id, order);
    };
    const setFront = (sp: Species, id: string) => {
        updateProfile({ albumFront: { ...(front ?? {}), [sp.id]: id } });
        again(sp.id);
    };

    const total = albumCount(dex);
    const withSticker = KANTO.filter((sp) => rows.get(sp.id)?.length).length;
    const freshAny = KANTO.some((sp) => fresh.has(sp.id));

    /** Um espaço da página; `ghost`: a cópia que vai na folha virando (sem toque, sem animação de colar). */
    const slotEl = (list: Species[], sp: Species, i: number, ghost = false) => {
        const r = rows.get(sp.id) ?? [];
        const top = frontRow(r, front?.[sp.id]);
        // as outras versões aparecem atrás da da frente, como cartas empilhadas (até 2)
        const behind = r.filter((x) => x !== top).slice(0, 2);
        const known = !!dex[sp.id];
        const eds = albumSlots(sp);
        return (
            <li key={sp.id}>
                <button
                    type="button"
                    tabIndex={ghost ? -1 : undefined}
                    className={`al-slot${top ? ' got' : ''}${!ghost && found === sp.id ? ' found' : ''}`}
                    onClick={() =>
                        tap(
                            sp,
                            list.map((s) => s.id),
                        )
                    }
                    aria-label={
                        top
                            ? tn('profile.album.cellVersions', r.length, { name: sp.name })
                            : t('profile.album.cellEmpty', { name: known ? sp.name : `Nº ${sp.id}` })
                    }
                >
                    <span className="al-box">
                        {/* o que vem impresso na página: nome, silhueta e número */}
                        <span className="al-print" aria-hidden>
                            <small>{known ? sp.name : '???'}</small>
                            <img className="pixel" src={speciesGif(sp.id)} alt="" loading="lazy" draggable={false} />
                            <b>#{dexNo(sp.id)}</b>
                        </span>
                        {behind.map((x, k) => (
                            <span
                                key={x.id}
                                className="al-stk behind"
                                style={{ '--rot': `${tilt(sp.id)}deg`, '--k': behind.length - k } as CSSProperties}
                            >
                                <PokeCard2 inst={x.inst} variant="metal" />
                            </span>
                        ))}
                        {top && (
                            <span
                                key={top.id}
                                className={`al-stk${!ghost && fresh.has(sp.id) ? ' pasting' : ''}`}
                                style={{ '--rot': `${tilt(sp.id)}deg`, '--d': `${i * 70}ms` } as CSSProperties}
                            >
                                <PokeCard2 inst={top.inst} variant="metal" />
                            </span>
                        )}
                        {r.length > 1 && <span className="al-n">×{r.length}</span>}
                        {!ghost && (
                            <NewBadge
                                k={CARD_SLOTS.map((ed) => newsKey.sticker(slotId(sp.id, ed)))}
                                className="corner"
                            />
                        )}
                    </span>
                    {/* as edições do Pokémon, na ordem Normal, Shiny, Evento, Ícone, Destaque: acesa = tem */}
                    <span className="al-dots" aria-hidden>
                        {eds.map((ed) => (
                            <i key={ed} className={`al-dot al-dot-${ed}${hasSticker(dex[sp.id], ed) ? ' on' : ''}`} />
                        ))}
                    </span>
                </button>
            </li>
        );
    };
    const range = (list: Species[]) => `#${dexNo(list[0].id)}–#${dexNo(list[list.length - 1].id)}`;
    /** O miolo de uma página (faixa, espaços, número da folha). */
    const pageInner = (list: Species[] | undefined, ghost = false) =>
        list && (
            <>
                <header className="al-ph">
                    <b>{t('profile.album.coverGen', { gen: 1 })} · Kanto</b>
                    <span>{range(list)}</span>
                </header>
                <ul className="al-pgrid">{list.map((sp, j) => slotEl(list, sp, j, ghost))}</ul>
                <footer className="al-folio" aria-hidden>
                    {pages.indexOf(list) + 1}
                </footer>
            </>
        );
    /** A folha que vira por cima: frente = a página que sai, verso = a que chega do outro lado (no celular, papel). */
    const leafEl = (
        front: Species[] | undefined,
        back: Species[] | undefined,
        side: 'next' | 'prev',
        solo: boolean,
    ) => (
        <div
            className={`al-leaf ${side}${solo ? ' solo' : ''}`}
            aria-hidden
            onAnimationEnd={(e) => e.target === e.currentTarget && setLeaf(null)}
        >
            <div className="al-page al-leaf-face front">{pageInner(front, true)}</div>
            <div className="al-page al-leaf-face back">{pageInner(back, true)}</div>
        </div>
    );
    // o que fica embaixo da folha: no celular a página nova; aberto, o lado que a folha ainda não cobriu
    const base: { list?: Species[]; leaf?: ReactNode }[] = !leaf
        ? visible.map((list) => ({ list }))
        : step === 1
          ? [{ list: leaf.to[0], leaf: leafEl(leaf.from[0], undefined, dir as 'next' | 'prev', true) }]
          : dir === 'next'
            ? [{ list: leaf.from[0] }, { list: leaf.to[1], leaf: leafEl(leaf.from[1], leaf.to[0], 'next', false) }]
            : [{ list: leaf.to[0], leaf: leafEl(leaf.from[0], leaf.to[1], 'prev', false) }, { list: leaf.from[1] }];
    const fanSp = fan ? species(fan) : null;
    const fanRows = fan ? (rows.get(fan) ?? []) : [];
    const fanFront = fan ? frontRow(fanRows, front?.[fan])?.id : undefined;

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
                                onClick={() => openRow(species(c.inst.speciesId), c.id)}
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

            {book !== 'open' ? (
                <div className="al-shelf">
                    {SHELF.map((g) => (
                        <button
                            type="button"
                            key={g.gen}
                            className={`al-cover al-gen-${g.gen}${g.live ? '' : ' soon'}${g.live && book !== 'shelf' ? ` ${book}` : ''}`}
                            disabled={!g.live || book !== 'shelf'}
                            onClick={openBook}
                            aria-label={t('profile.album.coverAria', { gen: g.gen, region: g.region })}
                        >
                            <span className="al-cover-face">
                                <img className="al-cover-logo" src="assets/ui/logo.svg" alt="" draggable={false} />
                                <b className="al-cover-title">{t('profile.album.coverTitle')}</b>
                                <span className="al-cover-gen">{t('profile.album.coverGen', { gen: g.gen })}</span>
                                <span className="al-cover-region">{g.region}</span>
                                {g.live ? (
                                    <>
                                        <img
                                            className="al-cover-mon pixel"
                                            src={speciesGif(25)}
                                            alt=""
                                            draggable={false}
                                        />
                                        <small className="al-cover-n">
                                            {withSticker}/{KANTO.length}
                                        </small>
                                        <span className="al-cover-cta">{t('profile.album.openBook')}</span>
                                    </>
                                ) : (
                                    <small className="al-cover-n">{t('home.soonRibbon')}</small>
                                )}
                                {g.live && <NewDot on={freshAny} className="al-cover-dot" />}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="al-nav">
                        <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => turn(page - step)}
                            disabled={cur === 0}
                            aria-label={t('profile.album.prev')}
                        >
                            <HudIcon kind="prev" />
                        </button>
                        <span className="al-where" aria-live="polite">
                            {t('profile.album.page', {
                                n: visible.length > 1 ? `${cur + 1}–${cur + 2}` : cur + 1,
                                total: pages.length,
                            })}{' '}
                            · {range(visible.flat())}
                        </span>
                        <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => turn(page + step)}
                            disabled={cur + step >= pages.length}
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
                        {base.map((b, i) => (
                            <section
                                // biome-ignore lint/suspicious/noArrayIndexKey: lado esquerdo/direito do livro aberto
                                key={i}
                                className={`al-page${!dir ? ' enter' : ''}${i ? ' right' : ''}`}
                                aria-label={b.list ? range(b.list) : undefined}
                            >
                                {pageInner(b.list)}
                                {b.leaf}
                            </section>
                        ))}
                    </div>
                    <div className="al-foot">
                        <small className="muted">{t('profile.album.swipe')}</small>
                        <button type="button" className="btn ghost small" onClick={closeBook}>
                            {t('profile.album.closeBook')}
                        </button>
                    </div>
                </>
            )}

            {fanSp && (
                <VersionsFan
                    title={fanSp.name}
                    rows={fanRows}
                    front={fanFront}
                    name={nameOf}
                    onOpen={(id) => {
                        setFan(null);
                        openRow(fanSp, id);
                    }}
                    onFront={(id) => setFront(fanSp, id)}
                    onClose={() => setFan(null)}
                />
            )}

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
        </div>
    );
}

/** Tocar num Pokémon com mais de uma versão: elas se espalham por cima da página, do tamanho de ler. */
function VersionsFan({
    title,
    rows,
    front,
    name,
    onOpen,
    onFront,
    onClose,
}: {
    title: string;
    rows: Row[];
    front?: string;
    name: (r: Row) => string;
    onOpen: (id: string) => void;
    onFront: (id: string) => void;
    onClose: () => void;
}) {
    const { t, tn } = useT();
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="al-fan" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" className="al-fan-bg" aria-label={t('profile.album.fanClose')} onClick={onClose} />
            <div className="al-fan-box">
                <header>
                    <b>{title}</b>
                    <span>{tn('profile.album.versionsN', rows.length)}</span>
                    <button type="button" className="btn ghost small" onClick={onClose}>
                        {t('profile.album.fanClose')}
                    </button>
                </header>
                <ul>
                    {rows.map((r, i) => (
                        <li key={r.id} style={{ '--i': i } as CSSProperties}>
                            <button type="button" className="al-fan-card" onClick={() => onOpen(r.id)}>
                                <PokeCard2 inst={r.inst} variant="metal" />
                            </button>
                            <b>{name(r)}</b>
                            {r.id === front ? (
                                <small className="al-fan-on">{t('profile.album.onFront')}</small>
                            ) : (
                                <button type="button" className="btn small" onClick={() => onFront(r.id)}>
                                    {t('profile.album.front')}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** "Suas versões": todas as versões que você tem dele, em carta pequena; tocar troca a carta grande. */
function Versions({
    rows,
    current,
    front,
    shown,
    name,
    onPick,
}: {
    rows: Row[];
    current: string;
    front?: string;
    shown: string[];
    name: (r: Row) => string;
    onPick: (id: string) => void;
}) {
    const { t } = useT();
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
                            <span className="al-vcard">
                                <PokeCard2 inst={r.inst} variant="metal" />
                            </span>
                            <b>{name(r)}</b>
                            {!r.v && r.id.includes('#') && <em>{t('profile.album.oldTag')}</em>}
                            {r.id === front && <small>{t('profile.album.onFront')}</small>}
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
