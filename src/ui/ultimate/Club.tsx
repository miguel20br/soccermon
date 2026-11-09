import { type ReactNode, useMemo, useState } from 'react';
import type { Position } from '../../engine/attributes';
import { species, TYPES } from '../../engine/data';
import { FORMATIONS } from '../../engine/formations';
import { type PokemonInstance, slotRating, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';
import { abilityName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { objectiveById } from '../../store/ultimate/objectives';
import { STARTERS, TEAM_SIZE } from '../../store/ultimate/rules';
import {
    canSell,
    canUndoSell,
    prizePacks,
    sellPoints,
    swapBlock,
    twinOf,
    type UltimateSave,
    type UtPrize,
} from '../../store/ultimate/ultimate';
import type { CardAction } from '../card-modal';
import { Coach } from '../coach/Coach';
import { PackArt } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { TypeIcon } from '../components/TypeIcon';
import { ConfirmSheet, Sheet } from '../kit/Sheet';
import { type Metal, metalLabel, metalOf } from '../rarity';
import { type ClubStatus, STATUSES, statusesOf } from './club-status';
import { useMarkText } from './Season';

export type ClubSeg = 'cards' | 'pending';
type Sort = 'rating' | 'name' | 'dex' | 'recent';
type EditionKey = 'normal' | 'shiny' | 'icone' | 'evento' | 'destaque';
const POSITIONS: Position[] = ['GK', 'FIXO', 'ALA', 'PIVO'];
const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const EDITIONS: EditionKey[] = ['normal', 'shiny', 'icone', 'evento', 'destaque'];
const SORTS: Sort[] = ['rating', 'name', 'dex', 'recent'];

interface Filters {
    q: string;
    pos: Position | null;
    metal: Metal | null;
    edition: EditionKey | null;
    type: string | null;
    status: ClubStatus | null;
    sort: Sort;
}
/** Os filtros do Clube ficam lembrados enquanto o jogo está aberto (conveniência, não save). */
let mem: Filters = { q: '', pos: null, metal: null, edition: null, type: null, status: null, sort: 'rating' };
/** Abre o Clube filtrado pela posição (o "Ver no Clube" do Elenco). */
export const clubPos = (pos: Position | null) => {
    mem = { ...mem, pos };
};

/** Onde a carta joga na vaga `role`: posição principal, alternativa (até 98%) ou fora de posição. */
export function fitOf(c: PokemonInstance, role: Position): 'main' | 'alt' | 'off' {
    const p = viewInstance(c).positions;
    return p[0] === role ? 'main' : p.includes(role) ? 'alt' : 'off';
}
/** Nota da carta na vaga `i` do time (titular pela posição da vaga; banco pela nota da carta). */
export const ratingAtSlot = (c: PokemonInstance, i: number, u: Pick<UltimateSave, 'team'>) =>
    i < STARTERS ? slotRating(c, FORMATIONS[u.team.formation].slots[i]) : viewInstance(c).overall;

/**
 * Clube (o My Club do FC): as cartas com busca, posição, filtros e ordem, e as ações de cada uma; e os Pendentes
 * (repetidas e prêmios). Os dois num segmentado em cima.
 */
export function Club({ seg, onSeg, onSquad }: { seg: ClubSeg; onSeg: (s: ClubSeg) => void; onSquad: () => void }) {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    return (
        <>
            <div className="bc-seg ut-club-seg">
                {(['cards', 'pending'] as const).map((s) => (
                    <button
                        type="button"
                        key={s}
                        aria-pressed={seg === s}
                        className={seg === s ? 'on' : undefined}
                        onClick={() => onSeg(s)}
                    >
                        {t(`ultimate.club.${s}`)} · {s === 'cards' ? u.cards.length : u.pending.length}
                        {s === 'pending' && u.pending.length > 0 && <i className="ut-dot" aria-hidden />}
                    </button>
                ))}
            </div>
            <UndoBar />
            <div key={seg} className="ut-panel">
                {seg === 'cards' ? <Cards onSquad={onSquad} /> : <Pending />}
            </div>
        </>
    );
}

/** A última venda rápida, com o Desfazer (some quando os pontos dela já foram gastos). */
function UndoBar() {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const undo = useGame((s) => s.ultimateUndoSell);
    if (!canUndoSell(u)) return null;
    const pts = u.sold.reduce((s, x) => s + x.points, 0);
    return (
        <p className="panel bc-surface ut-undo" role="status">
            <HudIcon kind="check" />
            <span>
                {u.sold.length === 1
                    ? t('ultimate.club.sold', { name: viewInstance(u.sold[0].card).displayName, n: pts })
                    : t('ultimate.club.soldMany', { n: u.sold.length, p: pts })}
            </span>
            <button type="button" className="btn small" onClick={undo}>
                <HudIcon kind="prev" />
                {t('ultimate.club.undo')}
            </button>
        </p>
    );
}

// ---------------------------------------------------------------------------------------------------- cartas

function Cards({ onSquad }: { onSquad: () => void }) {
    const { t, d, lang } = useT();
    const u = useGame((s) => s.ultimate);
    const [f, setF] = useState<Filters>(mem);
    const set = (patch: Partial<Filters>) => {
        mem = { ...f, ...patch };
        setF(mem);
    };
    const [sheet, setSheet] = useState<'filters' | null>(null);
    const [place, setPlace] = useState<PokemonInstance | null>(null);
    const [compare, setCompare] = useState<PokemonInstance | null>(null);
    const [sell, setSell] = useState<PokemonInstance | null>(null);
    const lock = useGame((s) => s.ultimateLock);
    const quickSell = useGame((s) => s.ultimateQuickSell);
    const views = useMemo(() => new Map(u.cards.map((c) => [c.uid, viewInstance(c)])), [u.cards]);
    const q = f.q.trim().toLocaleLowerCase(lang);
    const stat = useMemo(() => new Map(u.cards.map((c) => [c.uid, statusesOf(u, c.uid)])), [u]);
    const list = u.cards
        .map((c, i) => ({ c, i, v: views.get(c.uid)! }))
        .filter(({ c, v }) => {
            const ed = editionOf(c) ?? 'normal';
            return (
                (!q || v.displayName.toLocaleLowerCase(lang).includes(q)) &&
                (!f.pos || v.positions.includes(f.pos)) &&
                (!f.metal || metalOf(v.overall) === f.metal) &&
                (!f.edition || ed === f.edition) &&
                (!f.type || species(c.speciesId).types.includes(f.type)) &&
                (!f.status || stat.get(c.uid)!.includes(f.status))
            );
        })
        .sort((a, b) =>
            f.sort === 'name'
                ? a.v.displayName.localeCompare(b.v.displayName, lang)
                : f.sort === 'dex'
                  ? a.c.speciesId - b.c.speciesId
                  : f.sort === 'recent'
                    ? b.i - a.i
                    : (f.pos ? slotRating(b.c, f.pos) - slotRating(a.c, f.pos) : b.v.overall - a.v.overall) ||
                      a.c.speciesId - b.c.speciesId,
        );
    const on = [f.metal, f.edition, f.type, f.status].filter(Boolean).length;
    if (!u.cards.length) return <p className="panel ut-empty">{t('ultimate.collection.empty')}</p>;
    const actions = (c: PokemonInstance): CardAction[] => [
        { label: t('ultimate.club.place'), primary: true, onClick: () => setPlace(c) },
        { label: t('ultimate.club.compare'), onClick: () => setCompare(c) },
        {
            label: u.locked.includes(c.uid) ? t('ultimate.club.unlock') : t('ultimate.club.lock'),
            onClick: () => lock(c.uid),
        },
        ...(canSell(u, c.uid)
            ? [{ label: t('ultimate.club.sell', { n: sellPoints(c) }), onClick: () => setSell(c) }]
            : []),
    ];
    return (
        <>
            <label className="k-field ut-search">
                <HudIcon kind="search" />
                <input
                    type="search"
                    value={f.q}
                    placeholder={t('ultimate.club.search')}
                    aria-label={t('ultimate.club.search')}
                    onChange={(e) => set({ q: e.target.value })}
                />
            </label>
            <div className="bc-seg ut-pos-seg">
                {[null, ...POSITIONS].map((p) => (
                    <button
                        type="button"
                        key={p ?? 'all'}
                        aria-pressed={f.pos === p}
                        className={f.pos === p ? 'on' : undefined}
                        onClick={() => set({ pos: p })}
                    >
                        {p ? d.common.posShort[p] : t('ultimate.club.all')}
                    </button>
                ))}
            </div>
            <div className="ut-club-tools">
                <button type="button" className={`btn small${on ? ' on' : ''}`} onClick={() => setSheet('filters')}>
                    <HudIcon kind="more" />
                    {on ? t('ultimate.club.filtersOn', { n: on }) : t('ultimate.club.filters')}
                </button>
                <button type="button" className="btn small" onClick={() => setSheet('filters')}>
                    <HudIcon kind="reroll" />
                    {t('ultimate.club.sort', { s: d.ultimate.club.sorts[f.sort] })}
                </button>
                <small className="muted">{t('ultimate.club.count', { n: list.length, of: u.cards.length })}</small>
            </div>
            {list.length ? (
                <div className="ut-cards" key={`${f.pos}-${f.metal}-${f.edition}-${f.type}-${f.status}-${f.sort}`}>
                    {list.map(({ c }) => {
                        const i = u.team.order.indexOf(c.uid);
                        return (
                            <FutCard
                                key={c.uid}
                                inst={c}
                                size="sm"
                                position={f.pos ?? undefined}
                                captain={c.uid === u.team.captainUid}
                                modalActions={actions(c)}
                                ribbon={
                                    i >= 0
                                        ? i < STARTERS
                                            ? t('ultimate.collection.starter')
                                            : t('ultimate.collection.bench')
                                        : u.locked.includes(c.uid)
                                          ? t('ultimate.club.locked')
                                          : undefined
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="panel ut-empty">{t('ultimate.club.none')}</p>
            )}
            <Sheet open={sheet === 'filters'} onClose={() => setSheet(null)} title={t('ultimate.club.filters')}>
                <div className="ut-filters">
                    <span className="bc-lbl">{t('ultimate.club.sortTitle')}</span>
                    <div className="bc-seg">
                        {SORTS.map((s) => (
                            <button
                                type="button"
                                key={s}
                                aria-pressed={f.sort === s}
                                className={f.sort === s ? 'on' : undefined}
                                onClick={() => set({ sort: s })}
                            >
                                {d.ultimate.club.sorts[s]}
                            </button>
                        ))}
                    </div>
                    <span className="bc-lbl">{t('ultimate.club.metal')}</span>
                    <div className="ut-chips">
                        {METALS.map((m) => (
                            <Chip key={m} on={f.metal === m} onClick={() => set({ metal: f.metal === m ? null : m })}>
                                {metalLabel(m)}
                            </Chip>
                        ))}
                    </div>
                    <span className="bc-lbl">{t('ultimate.club.edition')}</span>
                    <div className="ut-chips">
                        {EDITIONS.map((e) => (
                            <Chip
                                key={e}
                                on={f.edition === e}
                                onClick={() => set({ edition: f.edition === e ? null : e })}
                            >
                                {e === 'normal' ? t('ultimate.club.normal') : d.common.edition[e]}
                            </Chip>
                        ))}
                    </div>
                    <span className="bc-lbl">{t('ultimate.club.status')}</span>
                    <div className="ut-chips">
                        {STATUSES.map((st) => (
                            <Chip
                                key={st}
                                on={f.status === st}
                                onClick={() => set({ status: f.status === st ? null : st })}
                            >
                                {t(`ultimate.club.st.${st}`)} ·{' '}
                                {u.cards.filter((c) => stat.get(c.uid)!.includes(st)).length}
                            </Chip>
                        ))}
                    </div>
                    <span className="bc-lbl">{t('ultimate.club.type')}</span>
                    <div className="ut-types">
                        {TYPES.map((ty) => (
                            <button
                                type="button"
                                key={ty}
                                className={f.type === ty ? 'on' : undefined}
                                aria-pressed={f.type === ty}
                                aria-label={typeName(ty, lang)}
                                title={typeName(ty, lang)}
                                onClick={() => set({ type: f.type === ty ? null : ty })}
                            >
                                <TypeIcon type={ty} size={22} />
                            </button>
                        ))}
                    </div>
                    <div className="k-confirm-actions">
                        <button
                            type="button"
                            className="btn ghost"
                            disabled={!on}
                            onClick={() => set({ metal: null, edition: null, type: null, status: null })}
                        >
                            {t('ultimate.club.clear')}
                        </button>
                        <button type="button" className="btn confirm" onClick={() => setSheet(null)}>
                            {t('ultimate.club.done')}
                        </button>
                    </div>
                </div>
            </Sheet>
            <PlaceSheet
                card={place}
                onClose={() => setPlace(null)}
                onDone={() => {
                    setPlace(null);
                    onSquad();
                }}
            />
            <CompareSheet card={compare} onClose={() => setCompare(null)} />
            <ConfirmSheet
                open={!!sell}
                onClose={() => setSell(null)}
                title={sell ? t('ultimate.club.sellTitle', { name: viewInstance(sell).displayName }) : ''}
                text={sell ? t('ultimate.club.sellText', { n: sellPoints(sell) }) : ''}
                confirm={sell ? t('ultimate.club.sell', { n: sellPoints(sell) }) : ''}
                onConfirm={() => sell && quickSell([sell.uid])}
            />
        </>
    );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" className={`btn k-chip ut-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
            {children}
        </button>
    );
}

/** "Escalar": as 7 vagas do time com a nota que a carta teria em cada uma e a diferença pra quem está lá. */
function PlaceSheet({
    card,
    onClose,
    onDone,
}: {
    card: PokemonInstance | null;
    onClose: () => void;
    onDone: () => void;
}) {
    const { t, d } = useT();
    const u = useGame((s) => s.ultimate);
    const setMember = useGame((s) => s.ultimateSetMember);
    const by = new Map(u.cards.map((c) => [c.uid, c]));
    const slots = FORMATIONS[u.team.formation].slots;
    return (
        <Sheet
            open={!!card}
            onClose={onClose}
            title={card ? t('ultimate.club.placeTitle', { name: viewInstance(card).displayName }) : ''}
        >
            {card && (
                <ul className="ut-slot-list">
                    {Array.from({ length: TEAM_SIZE }, (_, i) => {
                        const cur = by.get(u.team.order[i] ?? '');
                        const mine = ratingAtSlot(card, i, u);
                        const diff = cur ? mine - ratingAtSlot(cur, i, u) : null;
                        const fit = i < STARTERS ? fitOf(card, slots[i]) : 'main';
                        return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: as vagas do time são fixas
                            <li key={i}>
                                <button
                                    type="button"
                                    className={`ut-slot-row fit-${fit}`}
                                    disabled={!!u.live || cur?.uid === card.uid}
                                    onClick={() => {
                                        setMember(i, card.uid);
                                        onDone();
                                    }}
                                >
                                    <small className="ut-slot-pos">
                                        {i < STARTERS ? d.common.posShort[slots[i]] : t('ultimate.club.bench')}
                                    </small>
                                    {cur ? <MonIcon id={cur.speciesId} shiny={cur.shiny} /> : <i aria-hidden />}
                                    <span>{cur ? viewInstance(cur).displayName : t('ultimate.club.benchEmpty')}</span>
                                    <b className="cb-num">{mine}</b>
                                    <Diff n={diff} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Sheet>
    );
}

export function Diff({ n }: { n: number | null }) {
    if (n === null) return <small className="ut-diff" />;
    return <small className={`ut-diff ${n > 0 ? 'up' : n < 0 ? 'down' : ''}`}>{n > 0 ? `+${n}` : n || '='}</small>;
}

/** "Comparar": lado a lado com o titular da posição principal dela, com a nota de cada uma naquela vaga. */
function CompareSheet({ card, onClose }: { card: PokemonInstance | null; onClose: () => void }) {
    const { t, d } = useT();
    const u = useGame((s) => s.ultimate);
    const slots = FORMATIONS[u.team.formation].slots;
    const role = card ? viewInstance(card).naturalPosition : null;
    const i = role ? slots.findIndex((r, k) => r === role && u.team.order[k] !== card?.uid) : -1;
    const other = i >= 0 ? u.cards.find((c) => c.uid === u.team.order[i]) : undefined;
    return (
        <Sheet
            open={!!card}
            onClose={onClose}
            title={
                card && other
                    ? t('ultimate.club.compareTitle', {
                          a: viewInstance(card).displayName,
                          b: viewInstance(other).displayName,
                      })
                    : t('ultimate.club.compare')
            }
            className="ut-compare-sheet"
        >
            {card && role && (
                <>
                    <div className="ut-compare">
                        <FutCard inst={card} size="sm" position={role} />
                        {other ? (
                            <FutCard inst={other} size="sm" position={role} />
                        ) : (
                            <p className="muted">{t('ultimate.club.compareNone')}</p>
                        )}
                    </div>
                    {other && (
                        <p className="ut-compare-line">
                            {t('ultimate.club.compareSlot', {
                                pos: d.common.pos[role],
                                a: slotRating(card, role),
                                b: slotRating(other, role),
                            })}{' '}
                            <Diff n={slotRating(card, role) - slotRating(other, role)} />
                        </p>
                    )}
                </>
            )}
        </Sheet>
    );
}

// ------------------------------------------------------------------------------------------------- pendentes

function Pending() {
    const { t, tn, d } = useT();
    const u = useGame((s) => s.ultimate);
    const quickSell = useGame((s) => s.ultimateQuickSell);
    const swap = useGame((s) => s.ultimateSwap);
    const mark = useMarkText();
    const [askAll, setAskAll] = useState(false);
    // resgatou: o destino à vista (o pacote espera em Meus pacotes, nada abre sozinho)
    const [got, setGot] = useState(0);
    const repeats = u.pending.flatMap((p) => (p.kind === 'card' ? [p.card] : []));
    const prizes = u.pending.filter((p): p is UtPrize => p.kind === 'prize');
    const total = repeats.reduce((s, c) => s + sellPoints(c), 0);
    const redeem = (uid?: string) => {
        const n = prizes.filter((p) => uid === undefined || p.uid === uid).reduce((s, p) => s + prizePacks(p), 0);
        useGame.getState().ultimateRedeem(uid);
        if (n) setGot((g) => g + n);
    };
    const gotLine = got > 0 && (
        <p key={got} className="panel bc-surface ut-undo ut-got-line">
            <HudIcon kind="bag" />
            <span>{t('ultimate.stack.gotN', { n: got })}</span>
        </p>
    );
    if (!u.pending.length)
        return (
            <>
                {gotLine}
                <p className="panel ut-empty">{t('ultimate.pending.empty')}</p>
            </>
        );
    const prizeTitle = (p: UtPrize) => {
        if (p.from === 'pass') return t('ultimate.pending.prize.pass', { n: p.ref });
        if (p.from === 'gym') return t('ultimate.pending.prize.gym', { name: d.profile.badges.names[p.ref] ?? p.ref });
        if (p.from === 'event') return t('ultimate.event.title', { name: d.ultimate.events[p.ref] ?? p.ref });
        const o = objectiveById(p.ref);
        return o ? tn(`ultimate.goals.text.${o.kind}`, o.goal) : t('ultimate.pending.prize.objective');
    };
    return (
        <>
            <Coach id="utRepetida" targets={['.ut-pend-list .ut-pend:not(.ut-pend-prize)']} when={repeats.length > 0} />
            {gotLine}
            <section className="panel bc-surface ut-pend-head">
                <small className="muted">{t('ultimate.pending.hint')}</small>
                <div className="ut-pend-all">
                    {repeats.length > 0 && (
                        <button type="button" className="btn" onClick={() => setAskAll(true)}>
                            {t('ultimate.pending.sellAll', { n: total })}
                        </button>
                    )}
                    {prizes.length > 0 && (
                        <button type="button" className="btn confirm" onClick={() => redeem()}>
                            {t('ultimate.pending.redeemAll')}
                        </button>
                    )}
                </div>
            </section>
            <ul className="ut-pend-list">
                {prizes.map((p) => (
                    <li key={p.uid} className="panel bc-surface ut-pend ut-pend-prize">
                        {p.pick ? (
                            <PackArt
                                look={p.pick.min === 'ouro' ? 'gold' : p.pick.event ? 'special' : ''}
                                label={t('ultimate.pick.short')}
                                type={p.pick.type}
                            />
                        ) : p.packs + p.big > 0 ? (
                            <PackArt look="" label={p.big ? t('ultimate.packs.big') : t('ultimate.packs.mini')} />
                        ) : (
                            <span className="ut-pend-coin">
                                <HudIcon kind="coin" />
                            </span>
                        )}
                        <span className="ut-pend-info">
                            <b>{prizeTitle(p)}</b>
                            <small>{mark({ fichas: p.fichas, packs: p.packs, big: p.big, pick: p.pick })}</small>
                        </span>
                        <span className="ut-pend-acts">
                            <button type="button" className="btn confirm k-chip" onClick={() => redeem(p.uid)}>
                                {t('ultimate.pending.redeem')}
                            </button>
                        </span>
                    </li>
                ))}
                {repeats.map((c) => {
                    const twin = twinOf(u, c);
                    const block = swapBlock(u, c);
                    const v = viewInstance(c);
                    return (
                        <li key={c.uid} className="panel bc-surface ut-pend">
                            <FutCard inst={c} size="sm" />
                            <span className="ut-pend-info">
                                <b>
                                    {v.displayName} {v.overall} · {metalLabel(metalOf(v.overall))}
                                </b>
                                <small>
                                    {!twin
                                        ? t('ultimate.pending.noTwin')
                                        : twin.ability === c.ability
                                          ? t('ultimate.pending.same', { a: abilityName(c.ability) })
                                          : t('ultimate.pending.diff', {
                                                a: abilityName(twin.ability),
                                                b: abilityName(c.ability),
                                            })}
                                </small>
                                {block && <small className="ut-off">{t(`ultimate.pending.blocked.${block}`)}</small>}
                            </span>
                            <span className="ut-pend-acts">
                                <button type="button" className="btn k-chip" onClick={() => quickSell([c.uid])}>
                                    {t('ultimate.club.sell', { n: sellPoints(c) })}
                                </button>
                                <button
                                    type="button"
                                    className="btn k-chip"
                                    disabled={!!block}
                                    onClick={() => swap(c.uid)}
                                >
                                    {twin ? t('ultimate.pending.swap') : t('ultimate.pending.send')}
                                </button>
                            </span>
                        </li>
                    );
                })}
            </ul>
            <ConfirmSheet
                open={askAll}
                onClose={() => setAskAll(false)}
                title={t('ultimate.pending.sellAllTitle', { n: repeats.length })}
                text={t('ultimate.pending.sellAllText', { p: total })}
                confirm={t('ultimate.pending.sellAll', { n: total })}
                onConfirm={() => quickSell(repeats.map((c) => c.uid))}
            />
        </>
    );
}
