import { useMemo, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    type AlbumEdition,
    albumCount,
    albumSlots,
    type DexEntry,
    hasSticker,
    isPlayed,
    topSeal,
} from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { TypeIcon } from '../components/TypeIcon';
import { AlbumView } from './Album';
import { speciesGif } from './club';
import { BallMark, CareerSealIcon, ChampionRibbon } from './icons';
import { dexNo, SpeciesSheet } from './SpeciesSheet';

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
export function DexTab({ initial = 'dex' }: { initial?: DexView }) {
    const dex = useGame((s) => s.dex);
    const [view, setView] = useState<DexView>(initial);
    const [filter, setFilter] = useState<Filter>('all');
    const [type, setType] = useState<string | null>(null);
    const [open, setOpen] = useState<{ id: number; order?: number[]; focus?: 'cards' } | null>(null);
    const { t, tn, d, lang } = useT();
    const album = albumCount(dex);

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
            focus={open.focus}
            onNav={(id) => setOpen({ ...open, id })}
            onClose={() => setOpen(null)}
        />
    );
    const tabs = (
        <div className="bc-seg pf-dexview" role="tablist" aria-label={d.profile.tabs.dex}>
            {(['dex', 'album'] as DexView[]).map((v) => (
                <button
                    type="button"
                    role="tab"
                    key={v}
                    aria-selected={view === v}
                    className={view === v ? 'on' : undefined}
                    onClick={() => setView(v)}
                >
                    <HudIcon kind={v === 'dex' ? 'dex' : 'cards'} /> {d.profile.album.views[v]}
                </button>
            ))}
        </div>
    );
    if (view === 'album')
        return (
            <div className="pf-dex">
                {tabs}
                <AlbumView onOpen={(id, o) => setOpen({ id, order: o, focus: 'cards' })} />
                {sheet}
            </div>
        );

    return (
        <div className="pf-dex">
            {tabs}
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
                    className="pf-bar"
                    role="img"
                    aria-label={t('profile.dex.barAria', { seen: seenCount, total: TOTAL, played: counts.played })}
                >
                    <i className="seen" style={{ width: `${(seenCount / TOTAL) * 100}%` }} />
                    <i className="played" style={{ width: `${(counts.played / TOTAL) * 100}%` }} />
                </div>
            </div>

            <button type="button" className="pf-album pf-album-link" onClick={() => setView('album')}>
                <span className="pf-album-label">{t('profile.dex.stickers')}</span>
                <b className="pf-album-n">
                    <span aria-hidden>
                        {album.got}
                        <small>/{album.total}</small>
                    </span>
                    <span className="pf-sr">{t('profile.dex.stickersAria', { n: album.got, total: album.total })}</span>
                </b>
                <div className="pf-bar" aria-hidden>
                    <i className="played" style={{ width: `${(album.got / album.total) * 100}%` }} />
                </div>
                <small className="muted">
                    {t('profile.dex.stickersHelp')} <b className="pf-album-go">{t('profile.album.see')}</b>
                </small>
            </button>

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
                        // TODO(combos-edicao): trocar o title pela dica de passar o mouse/segurar quando ela chegar
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
                                        <CareerSealIcon seal={seal} className={`pf-seal pf-cell-mark seal-${seal}`} />
                                    ) : (
                                        st === 'played' && <BallMark className="pf-ball pf-cell-mark" />
                                    )}
                                    {titles > 0 && <ChampionRibbon n={titles} className="pf-ribbon pf-cell-ribbon" />}
                                    {/* figurinhas da espécie: "3/5" com o ícone de carta (a dica diz quais) */}
                                    {known && (
                                        <span
                                            className={`pf-cell-stk${stk === slots.length ? ' full' : ''}`}
                                            title={stkTip}
                                        >
                                            <HudIcon kind="cards" />
                                            {stk}/{slots.length}
                                        </span>
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
