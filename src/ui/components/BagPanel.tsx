import { useState } from 'react';
import { type BagItem, bagLeft, bagNeedsTarget } from '../../engine/bag';
import type { MatchEvent, MatchOrder } from '../../engine/state';
import { useT } from '../../i18n/react';
import { HudIcon } from './MatchHud';

/**
 * Bolsa do técnico na beira da quadra (itens-ativos.md, A1; atrás de `?lab=itens`): escolher o item e, na Poção, em
 * quem. 1 por tempo; o estado sai dos eventos `bag` (o que já passou na tela) e das ordens que ainda não entraram.
 */

/** Ícone desenhado de cada item (sem emoji): frasco da Poção, espada do X Attack, escudo do X Defense, cruz da Cura. */
export function BagIcon({ item, className }: { item: BagItem; className?: string }) {
    const cls = className ? `bag-icon ${className}` : 'bag-icon';
    return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden data-item={item}>
            {item === 'potion' && (
                <>
                    <rect x="9" y="2.5" width="6" height="3" rx="1" fill="#8a8f98" />
                    <path d="M8 7h8l1.5 3v9.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V10z" fill="#a259d9" />
                    <path d="M8.5 13h7v6h-7z" fill="#d7a6ff" />
                </>
            )}
            {item === 'xattack' && (
                <>
                    <circle cx="12" cy="12" r="10" fill="#e8423f" />
                    <path d="M15.5 5.5l3 3-7.5 7.5-3-3z" fill="#fff" />
                    <path d="M7 14.5l2.5 2.5-2 2-2.5-2.5z" fill="#ffd447" />
                </>
            )}
            {item === 'xdefense' && (
                <>
                    <circle cx="12" cy="12" r="10" fill="#3f7be8" />
                    <path d="M12 5l5.5 2v4.5c0 3.5-2.4 6-5.5 7.5-3.1-1.5-5.5-4-5.5-7.5V7z" fill="#fff" />
                </>
            )}
            {item === 'fullheal' && (
                <>
                    <rect x="9" y="2.5" width="6" height="3" rx="1" fill="#8a8f98" />
                    <path d="M7 7h10v12.5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#f2c230" />
                    <path d="M10.75 10h2.5v2.25h2.25v2.5h-2.25V17h-2.5v-2.25H8.5v-2.5h2.25z" fill="#fff" />
                </>
            )}
        </svg>
    );
}

export interface BagView {
    /** O que ainda dá pra usar (sem o que está entrando). */
    left: BagItem[];
    /** Já usou (ou mandou) o item deste tempo. */
    usedHalf: boolean;
    /** Item mandado que ainda não entrou na tela. */
    pending: BagItem | null;
}

/** Estado da Bolsa do seu time no tick da tela (a partida já foi simulada inteira: o evento futuro é a ordem que vale). */
export function bagView(
    events: readonly MatchEvent[],
    orders: readonly MatchOrder[],
    tick: number,
    bag: readonly BagItem[],
): BagView {
    const ht = events.find((e) => e.type === 'halftime')?.tick;
    const halfOf = (t: number) => (ht !== undefined && t > ht ? 2 : 1);
    const used = events.flatMap((e) => (e.type === 'bag' && e.team === 0 ? [e] : []));
    const shown = used.filter((e) => e.tick <= tick);
    const next = used.find(
        (e) => e.tick > tick && orders.some((o) => o.kind === 'bag' && o.team === 0 && o.tick <= e.tick),
    );
    const pending = next && halfOf(next.tick) === halfOf(tick) ? next.item : null;
    return {
        left: bagLeft(bag, [...shown.map((e) => e.item), pending]),
        usedHalf: !!pending || shown.some((e) => halfOf(e.tick) === halfOf(tick)),
        pending,
    };
}

export interface BagTarget {
    uid: string;
    name: string;
    sprite: string;
    /** Fôlego agora (0..1). */
    energy: number;
}

/** Os itens da Bolsa (uma linha) e, na Poção, a fila de rostos do seu time. */
export function BagControls({
    view,
    canAct,
    targets,
    onUse,
}: {
    view: BagView;
    canAct: boolean;
    targets: BagTarget[];
    onUse: (item: BagItem, target?: string) => void;
}) {
    const { d } = useT();
    const b = d.match.agency.bag;
    const [aim, setAim] = useState<BagItem | null>(null);
    const blocked = !canAct || view.usedHalf;
    const status = view.pending ? b.pending : view.usedHalf ? b.used : view.left.length ? b.perHalf : b.empty;
    return (
        <div className="sl bag">
            <div className="bc-row">
                <span className="bc-lbl">
                    <HudIcon kind="bag" />
                    {b.title}
                </span>
                <small className="bag-status">{status}</small>
            </div>
            {aim ? (
                <fieldset className="bag-aim" aria-label={b.target}>
                    <p className="bag-ask">
                        <BagIcon item={aim} />
                        {b.target}
                    </p>
                    <div className="bag-faces">
                        {targets.map((t) => (
                            <button
                                key={t.uid}
                                type="button"
                                className="bag-face"
                                disabled={blocked}
                                onClick={() => {
                                    onUse(aim, t.uid);
                                    setAim(null);
                                }}
                            >
                                <img className="pixel" src={t.sprite} alt="" />
                                <span>{t.name}</span>
                                <i className="bag-energy" style={{ width: `${Math.round(t.energy * 100)}%` }} />
                            </button>
                        ))}
                    </div>
                    <button type="button" className="btn small outline" onClick={() => setAim(null)}>
                        {b.back}
                    </button>
                </fieldset>
            ) : (
                <div className="bag-items">
                    {[...new Set(view.left)].map((item) => {
                        const n = view.left.filter((x) => x === item).length;
                        return (
                            <button
                                key={item}
                                type="button"
                                className="sl-btn bag-btn"
                                title={b.items[item].desc}
                                disabled={blocked}
                                onClick={() => (bagNeedsTarget(item) ? setAim(item) : onUse(item))}
                            >
                                <BagIcon item={item} />
                                <span>
                                    <b>
                                        {b.items[item].name}
                                        {n > 1 ? ` x${n}` : ''}
                                    </b>
                                    <small>{b.items[item].desc}</small>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** Carta do item da Bolsa (recompensa e Mercado), do tamanho da carta de item. */
export function BagCard({ item, selected }: { item: BagItem; selected?: boolean }) {
    const { d } = useT();
    const b = d.match.agency.bag;
    return (
        <div className={`card item-card bag-card${selected ? ' selected' : ''}`}>
            <span className="tier-label">{b.title}</span>
            <BagIcon item={item} className="item-art" />
            <b className="card-name">{b.items[item].name}</b>
            <span className="tactic-desc">{b.items[item].desc}</span>
        </div>
    );
}
