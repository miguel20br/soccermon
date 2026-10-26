import { useMemo, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { newsKey } from '../../store/news';
import { type AlbumEdition, albumSlots, type DexEntry, hasSticker, isPlayed, topSeal } from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { Tip } from '../components/Tip';
import { TypeIcon } from '../components/TypeIcon';
import { AlbumView } from './Album';
import { speciesGif } from './club';
import { BallMark, CareerSealIcon, ChampionRibbon } from './icons';
import { NewBadge } from './news';
import { dexNo, SpeciesSheet } from './SpeciesSheet';
import { sealTip } from './seal-tip';

type Status = 'played' | 'seen' | 'unseen';
type Filter = 'all' | Status | 'missing';

const FILTERS: Filter[] = ['all', 'played', 'seen', 'unseen', 'missing'];

const statusOf = (e: DexEntry | undefined): Status => (!e ? 'unseen' : isPlayed(e) ? 'played' : 'seen');

/** Tipos que existem nos 151, na ordem da tabela de tipos. */
const TYPES = [...new Set(SPECIES.flatMap((s) => s.types))];
const TOTAL = SPECIES.length;
/** Álbum: as edições que existem de cada espécie (Ícone só nos 20 da lista). */
const SLOTS = new Map(SPECIES.map((sp) => [sp.id, albumSlots(sp)]));
const stickersGot = (id: number, e: DexEntry | undefined) =>
    SLOTS.get(id)?.filter((ed) => hasSticker(e, ed)).length ?? 0;

export type DexView = 'dex' | 'album';

/** Pokédex: os 151 com o que você já viu e quem já jogou pelo seu time; e o Álbum de cartas especiais. */
/** Coleção → Pokédex ou Álbum (a aba escolhida vem da tela da Coleção; "Ver no álbum" da ficha troca pra lá). */
export function DexTab({ view, onView }: { view: DexView; onView: (v: DexView) => void }) {
    const dex = useGame((s) => s.dex);
    const setView = onView;
    const [filter, setFilter] = useState<Filter>('all');
    const [type, setType] = useState<string | null>(null);
    const [open, setOpen] = useState<{ id: number; order?: number[] } | null>(null);
    // "Ver no álbum" da ficha: abre o Álbum na página do Pokémon (n muda a cada pedido)
    const [at, setAt] = useState<{ id: number; n: number } | null>(null);
    const { t, tn, d, lang } = useT();

    const counts = useMemo(() => {
        const c = { all: TOTAL, played: 0, seen: 0, unseen: 0, missing: 0 };
        for (const sp of SPECIES) {
            c[statusOf(dex[sp.id])]++;
            const got = stickersGot(sp.id, dex[sp.id]);
            if (got < (SLOTS.get(sp.id)?.length ?? 0)) c.missing++;
        }
        return c;
    }, [dex]);
    const seenCount = counts.played + counts.seen;
    const edName = (ed: AlbumEdition) => (ed === 'normal' ? t('profile.sheet.normal') : d.common.edition[ed]);
    const kanto = counts.played === TOTAL;

    const list = useMemo(
        () =>
            SPECIES.filter((sp) => {
                const st = statusOf(dex[sp.id]);
                if (filter === 'missing') {
                    if (stickersGot(sp.id, dex[sp.id]) >= (SLOTS.get(sp.id)?.length ?? 0)) return false;
                } else if (filter !== 'all' && st !== filter) return false;
                // o tipo de quem você ainda não viu fica escondido (como nos jogos)
                if (type && (st === 'unseen' || !sp.types.includes(type))) return false;
                return true;
            }),
        [dex, filter, type],
    );
    const order = useMemo(() => list.map((s) => s.id), [list]);

    const sheet = open && (
        <SpeciesSheet
            id={open.id}
            order={open.order ?? order}
            onNav={(id) => setOpen({ ...open, id })}
            onClose={() => setOpen(null)}
            onAlbum={(id) => {
                setOpen(null);
                setView('album');
                setAt({ id, n: (at?.n ?? 0) + 1 });
            }}
        />
    );
    if (view === 'album')
        return (
            <div className="pf-dex" key={view}>
                <AlbumView at={at} paused={!!open} onSheet={(id, o) => setOpen({ id, order: o })} />
                {sheet}
            </div>
        );

    return (
        <div className="pf-dex" key={view}>
            <div className="pf-dex-progress">
                <div className="pf-dex-counts">
                    <span>
                        {t('profile.dex.seen')} <b>{seenCount}</b>/{TOTAL}
                    </span>
                    <span>
                        <BallMark /> {t('profile.dex.played')} <b>{counts.played}</b>/{TOTAL}
                    </span>
                </div>
                <div
                    className={`k-bar${counts.played >= TOTAL ? ' full' : ''}`}
                    role="img"
                    aria-label={t('profile.dex.barAria', { seen: seenCount, total: TOTAL, played: counts.played })}
                >
                    <i className="k-bar-ghost" style={{ width: `${(seenCount / TOTAL) * 100}%` }} />
                    <i style={{ width: `${(counts.played / TOTAL) * 100}%` }} />
                </div>
            </div>

            <fieldset className="pf-filters">
                <legend className="pf-sr">{t('profile.dex.filterStatus')}</legend>
                {FILTERS.map((f) => (
                    <button
                        type="button"
                        key={f}
                        className={`pf-chip${filter === f ? ' active' : ''}`}
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                    >
                        {d.profile.dex.filters[f]} <small>{counts[f]}</small>
                    </button>
                ))}
            </fieldset>
            <fieldset className="pf-types">
                <legend className="pf-sr">{t('profile.dex.filterType')}</legend>
                {TYPES.map((ty) => (
                    <button
                        type="button"
                        key={ty}
                        className={`pf-type${type === ty ? ' active' : ''}`}
                        aria-pressed={type === ty}
                        aria-label={t('profile.dex.typeAria', { type: typeName(ty, lang) })}
                        title={typeName(ty, lang)}
                        onClick={() => setType(type === ty ? null : ty)}
                    >
                        <TypeIcon type={ty} size={22} label={type === ty} />
                    </button>
                ))}
            </fieldset>

            {list.length ? (
                <ul className="pf-grid">
                    {list.map((sp) => {
                        const st = statusOf(dex[sp.id]);
                        const known = st !== 'unseen';
                        const titles = dex[sp.id]?.titles ?? 0;
                        const seal = topSeal(dex[sp.id], kanto);
                        const slots = SLOTS.get(sp.id) ?? [];
                        const stk = stickersGot(sp.id, dex[sp.id]);
                        const stkTip = t('profile.dex.stickersTip', {
                            got:
                                slots
                                    .filter((ed) => hasSticker(dex[sp.id], ed))
                                    .map(edName)
                                    .join(', ') || '—',
                            missing:
                                slots
                                    .filter((ed) => !hasSticker(dex[sp.id], ed))
                                    .map(edName)
                                    .join(', ') || '—',
                        });
                        return (
                            <li key={sp.id}>
                                <button
                                    type="button"
                                    className={`pf-cell ${st}`}
                                    onClick={() => setOpen({ id: sp.id })}
                                    aria-label={`${t('profile.dex.cellAria', { no: dexNo(sp.id), name: known ? sp.name : t('profile.dex.notSeenLower') })}${st === 'played' ? t('profile.dex.playedForYou') : ''}${titles ? tn('profile.dex.ribbonAria', titles) : ''}${seal ? t('profile.dex.sealAria', { name: d.profile.sheet.sealNames[seal] }) : ''}`}
                                >
                                    <span className="pf-cell-no">{dexNo(sp.id)}</span>
                                    <img
                                        className="pixel"
                                        src={speciesGif(sp.id)}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                    />
                                    <span className="pf-cell-name">{known ? sp.name : '???'}</span>
                                    {/* o selo (10+ partidas) já diz que jogou: fica no lugar da bolinha */}
                                    {seal ? (
                                        <Tip
                                            className="pf-cell-mark pf-cell-tip"
                                            focusable={false}
                                            text={sealTip(t, seal, sp.name, dex[sp.id], counts.played)}
                                        >
                                            <CareerSealIcon seal={seal} className={`pf-seal seal-${seal}`} />
                                        </Tip>
                                    ) : (
                                        st === 'played' && <BallMark className="pf-ball pf-cell-mark" />
                                    )}
                                    {seal && <NewBadge k={newsKey.seal(sp.id, seal)} className="corner" />}
                                    {titles > 0 && <ChampionRibbon n={titles} className="pf-ribbon pf-cell-ribbon" />}
                                    {/* figurinhas da espécie: "3/5" com o ícone de carta (a dica diz quais) */}
                                    {known && (
                                        <Tip className="pf-cell-stk-tip" focusable={false} text={stkTip}>
                                            <span className={`pf-cell-stk${stk === slots.length ? ' full' : ''}`}>
                                                <HudIcon kind="cards" />
                                                {stk}/{slots.length}
                                            </span>
                                        </Tip>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="pf-empty">
                    {filter === 'missing'
                        ? t('profile.dex.emptyMissing')
                        : filter === 'unseen' && type
                          ? t('profile.dex.emptyUnseenType')
                          : filter === 'played'
                            ? t('profile.dex.emptyPlayed')
                            : t('profile.dex.empty')}
                </p>
            )}

            {sheet}
        </div>
    );
}
