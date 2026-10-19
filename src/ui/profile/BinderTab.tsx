import { useMemo, useState } from 'react';
import { SPECIES, species } from '../../engine/data';
import { type DuelMonRecipe, monRecipe } from '../../engine/duel-validate';
import type { PokemonInstance } from '../../engine/instance';
import { type Edition, editionOf } from '../../engine/specials';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { type BinderCard, binderInst, binderOvr, CARD_SHOWCASE_MAX, resolveCardShowcase } from '../../store/binder';
import { useGame } from '../../store/game-store';
import { toggleShowcase } from '../../store/medals';
import { FutCard } from '../components/FutCard';
import { PokeCard2 } from '../components/PokeCard2';
import { TypeIcon } from '../components/TypeIcon';
import { editionLabel, type Metal, metalLabel, metalOf } from '../rarity';
import './binder.css';

const EDITIONS: Edition[] = ['shiny', 'icone', 'evento', 'destaque'];
const METALS: Metal[] = ['ouro', 'prata', 'bronze'];
const TYPES = [...new Set(SPECIES.flatMap((s) => s.types))];
type Sort = 'nota' | 'data';

/** Sua vitrine de cartas (resolvida pelo fichário) e o que vai pro Duelo. */
export function useCardShowcase(): { cards: BinderCard[]; insts: PokemonInstance[]; encoded: DuelMonRecipe[] } {
    const binder = useGame((s) => s.binder);
    const choice = useGame((s) => s.profile.cardShowcase);
    return useMemo(() => {
        const cards = resolveCardShowcase(choice, binder);
        const insts = cards.map(binderInst);
        // a barra de evolução não vai pro rival (a vitrine é a carta, não a copa)
        return { cards, insts, encoded: insts.map((p) => ({ ...monRecipe(p), evo: undefined })) };
    }, [choice, binder]);
}

/**
 * A fileira da vitrine de cartas (topo do Perfil, VERSUS). Sem cartas, não aparece. `open`: tocar abre a carta
 * completa (no VERSUS a tela começa sozinha: só a carta).
 */
export function CardShowcaseRow({
    insts,
    className = '',
    open = false,
}: {
    insts: PokemonInstance[];
    className?: string;
    open?: boolean;
}) {
    const { t } = useT();
    if (!insts.length) return null;
    return (
        <ul className={`cardshow ${className}`} aria-label={t('profile.binder.showcase')}>
            {insts.map((p) => (
                <li key={p.uid}>{open ? <FutCard inst={p} size="sm" /> : <PokeCard2 inst={p} variant="metal" />}</li>
            ))}
        </ul>
    );
}

const dateOf = (at: number, lang: string) => (at > 0 ? new Date(at).toLocaleDateString(lang) : '');

/** Aba Fichário: a vitrine de cartas (3 vagas) e a grade das cartas guardadas, com filtros e ordem. */
export function BinderTab() {
    const binder = useGame((s) => s.binder);
    const choice = useGame((s) => s.profile.cardShowcase);
    const updateProfile = useGame((s) => s.updateProfile);
    const { t, d, lang } = useT();
    const [edition, setEdition] = useState<Edition | null>(null);
    const [metal, setMetal] = useState<Metal | null>(null);
    const [champ, setChamp] = useState(false);
    const [type, setType] = useState<string | null>(null);
    const [sort, setSort] = useState<Sort>('nota');

    const all = useMemo(() => binder.map((c) => ({ c, inst: binderInst(c), ovr: binderOvr(c) })), [binder]);
    const shown = resolveCardShowcase(choice, binder);
    const shownIds = new Set(shown.map((c) => c.id));
    const full = shown.length >= CARD_SHOWCASE_MAX;
    const toggle = (id: string) =>
        // a escolha guarda só o que ainda está no fichário
        updateProfile({
            cardShowcase: toggleShowcase(
                shown.map((c) => c.id),
                id,
            ),
        });

    const counts = useMemo(() => {
        const n: Record<string, number> = { all: all.length, champ: 0 };
        for (const x of all) {
            const ed = editionOf(x.inst);
            if (ed) n[ed] = (n[ed] ?? 0) + 1;
            const m = metalOf(x.ovr);
            n[m] = (n[m] ?? 0) + 1;
            if (x.c.champ) n.champ++;
        }
        return n;
    }, [all]);

    const list = useMemo(
        () =>
            all
                .filter(
                    (x) =>
                        (!edition || editionOf(x.inst) === edition) &&
                        (!metal || metalOf(x.ovr) === metal) &&
                        (!champ || x.c.champ) &&
                        (!type || species(x.inst.speciesId).types.includes(type)),
                )
                .sort((a, b) => (sort === 'nota' ? b.ovr - a.ovr : 0) || b.c.at - a.c.at),
        [all, edition, metal, champ, type, sort],
    );

    const chip = (on: boolean, label: string, n: number | undefined, onClick: () => void, key: string) => (
        <button type="button" key={key} className={`pf-chip${on ? ' active' : ''}`} aria-pressed={on} onClick={onClick}>
            {label} <small>{n ?? 0}</small>
        </button>
    );

    return (
        <div className="pf-binder">
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
                            <FutCard
                                key={c.id}
                                inst={binderInst(c)}
                                size="sm"
                                modalActions={[{ label: t('profile.binder.remove'), onClick: () => toggle(c.id) }]}
                            />
                        ) : (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 3 vagas fixas
                            <div key={i} className="bd-slot" aria-hidden />
                        );
                    })}
                </div>
                <small className="muted">{t('profile.binder.showcaseHelp')}</small>
            </section>

            <section className="panel pf-card">
                <h2>
                    {d.profile.tabs.fichario}{' '}
                    <span className="pf-count">{t('profile.binder.count', { n: all.length })}</span>
                </h2>
                <small className="muted">{t('profile.binder.help')}</small>
                {all.length > 0 && (
                    <>
                        <fieldset className="pf-filters">
                            <legend className="pf-sr">{t('profile.binder.filterEdition')}</legend>
                            {chip(!edition, t('profile.binder.all'), counts.all, () => setEdition(null), 'all')}
                            {EDITIONS.map((e) =>
                                chip(
                                    edition === e,
                                    editionLabel(e),
                                    counts[e],
                                    () => setEdition(edition === e ? null : e),
                                    e,
                                ),
                            )}
                        </fieldset>
                        <fieldset className="pf-filters">
                            <legend className="pf-sr">{t('profile.binder.filterMetal')}</legend>
                            {METALS.map((m) =>
                                chip(metal === m, metalLabel(m), counts[m], () => setMetal(metal === m ? null : m), m),
                            )}
                            {chip(champ, t('profile.binder.champ'), counts.champ, () => setChamp(!champ), 'champ')}
                        </fieldset>
                        <fieldset className="pf-types">
                            <legend className="pf-sr">{t('profile.binder.filterType')}</legend>
                            {TYPES.map((ty) => (
                                <button
                                    type="button"
                                    key={ty}
                                    className={`pf-type${type === ty ? ' active' : ''}`}
                                    aria-pressed={type === ty}
                                    aria-label={typeName(ty, lang)}
                                    title={typeName(ty, lang)}
                                    onClick={() => setType(type === ty ? null : ty)}
                                >
                                    <TypeIcon type={ty} size={22} label={type === ty} />
                                </button>
                            ))}
                        </fieldset>
                        <fieldset className="bc-seg bd-sort">
                            <legend className="pf-sr">{t('profile.binder.sortBy')}</legend>
                            {(['nota', 'data'] as Sort[]).map((s) => (
                                <button type="button" key={s} aria-pressed={sort === s} onClick={() => setSort(s)}>
                                    {d.profile.binder.sort[s]}
                                </button>
                            ))}
                        </fieldset>
                    </>
                )}
                {list.length ? (
                    <ul className="bd-grid">
                        {list.map(({ c, inst }) => {
                            const on = shownIds.has(c.id);
                            const note = [
                                d.profile.binder.from[c.from],
                                dateOf(c.at, lang),
                                c.champ ? t('profile.binder.champOne') : '',
                                !on && full ? t('profile.binder.full') : '',
                            ]
                                .filter(Boolean)
                                .join(' · ');
                            return (
                                <li key={c.id} className={on ? 'on' : undefined}>
                                    <FutCard
                                        inst={inst}
                                        size="sm"
                                        selected={on}
                                        ribbon={c.champ ? t('profile.binder.champOne') : undefined}
                                        modalNote={note}
                                        modalActions={
                                            on
                                                ? [{ label: t('profile.binder.remove'), onClick: () => toggle(c.id) }]
                                                : full
                                                  ? []
                                                  : [
                                                        {
                                                            label: t('profile.binder.add'),
                                                            primary: true,
                                                            onClick: () => toggle(c.id),
                                                        },
                                                    ]
                                        }
                                    />
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="pf-empty">{all.length ? t('profile.binder.none') : t('profile.binder.empty')}</p>
                )}
            </section>
        </div>
    );
}
