import { type RefObject, useMemo, useState } from 'react';
import { SPECIES, type Species, species } from '../../engine/data';
import { type DuelMonRecipe, monRecipe } from '../../engine/duel-validate';
import { DEFAULT_LEVEL, type PokemonInstance } from '../../engine/instance';
import { defaultMoveset } from '../../engine/moves';
import { EVENT_TYPES, ICONS } from '../../engine/specials';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import {
    type BinderCard,
    bestOfSpecies,
    binderInst,
    CARD_SHOWCASE_MAX,
    CARD_SLOTS,
    type CardSlot,
    resolveCardShowcase,
    slotId,
} from '../../store/binder';
import { useGame } from '../../store/game-store';
import { toggleShowcase } from '../../store/medals';
import { albumCount, albumSlots, type Dex, hasSticker } from '../../store/profile';
import { useCardModal } from '../card-modal';
import { PokeCard2 } from '../components/PokeCard2';
import { TypeIcon } from '../components/TypeIcon';
import { speciesGif } from './club';
import './album.css';

/** Figurinha colada (a Pokédex é quem diz: mesma conta da medalha e da platina). */
const stuck = (dex: Dex) => (c: BinderCard) => hasSticker(dex[c.card.speciesId], c.id.split(':')[1] as CardSlot);

/** Sua vitrine de cartas (só figurinhas do álbum) e o que vai pro Duelo. */
export function useCardShowcase(): { cards: BinderCard[]; insts: PokemonInstance[]; encoded: DuelMonRecipe[] } {
    const binder = useGame((s) => s.binder);
    const dex = useGame((s) => s.dex);
    const choice = useGame((s) => s.profile.cardShowcase);
    return useMemo(() => {
        const cards = resolveCardShowcase(choice, binder, stuck(dex));
        const insts = cards.map(binderInst);
        // a barra de evolução não vai pro rival (a vitrine é a carta, não a copa)
        return { cards, insts, encoded: insts.map((p) => ({ ...monRecipe(p), evo: undefined })) };
    }, [choice, binder, dex]);
}

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

/** O que o álbum sabe de você: as cartas por espaço, a Pokédex e a vitrine (com o botão de pôr e tirar). */
function useAlbum() {
    const binder = useGame((s) => s.binder);
    const dex = useGame((s) => s.dex);
    const choice = useGame((s) => s.profile.cardShowcase);
    const updateProfile = useGame((s) => s.updateProfile);
    const { t, d, lang } = useT();
    const bySlot = useMemo(() => new Map(binder.map((c) => [c.id, c])), [binder]);
    const shown = useMemo(() => resolveCardShowcase(choice, binder, stuck(dex)), [choice, binder, dex]);

    const full = shown.length >= CARD_SHOWCASE_MAX;
    const toggle = (id: string) =>
        updateProfile({
            cardShowcase: toggleShowcase(
                shown.map((x) => x.id),
                id,
            ),
        });
    /** Quando e como veio ("Draft · copa de 19/10 · campeã · tirou 3"). Figurinha de antes do álbum: a padrão. */
    const note = (c: BinderCard | null) =>
        c
            ? [
                  d.profile.binder.from[c.from],
                  c.at > 0 ? t('profile.album.cup', { date: new Date(c.at).toLocaleDateString(lang) }) : '',
                  c.champ ? t('profile.album.champ') : '',
                  c.n > 1 ? t('profile.album.pulled', { n: c.n }) : '',
              ]
                  .filter(Boolean)
                  .join(' · ')
            : t('profile.album.old');
    /** Carta completa, com o botão da vitrine. */
    const open = (c: BinderCard | null, inst: PokemonInstance) => {
        const on = !!c && shown.includes(c);
        useCardModal.getState().open(inst, {
            note: [note(c), c && !on && full ? t('profile.binder.full') : ''].filter(Boolean).join(' · '),
            actions: !c
                ? []
                : on
                  ? [{ label: t('profile.binder.remove'), onClick: () => toggle(c.id) }]
                  : full
                    ? []
                    : [{ label: t('profile.binder.add'), primary: true, onClick: () => toggle(c.id) }],
        });
    };
    /** A carta do espaço: a melhor que você tirou, ou a padrão da edição (figurinha de antes do álbum). */
    const slot = (sp: Species, ed: CardSlot) => {
        const c = bySlot.get(slotId(sp.id, ed)) ?? null;
        return { c, inst: c ? binderInst(c) : defaultCard(sp, ed), got: hasSticker(dex[sp.id], ed) };
    };
    return { dex, binder, shown, full, open, note, toggle, slot };
}

/** Uma figurinha: a carta (colada) ou a silhueta com "?" (falta), e o ×N de quantas você tirou. */
function Sticker({
    sp,
    ed,
    s,
    onClick,
    label,
}: {
    sp: Species;
    ed: CardSlot;
    s: { c: BinderCard | null; inst: PokemonInstance; got: boolean };
    onClick: () => void;
    label?: string;
}) {
    const { t, d } = useT();
    const seen = !!useGame((g) => g.dex[sp.id]);
    const edition = d.common.edition[ed];
    return (
        <button
            type="button"
            className={`al-cell${s.got ? ' got' : ''}`}
            onClick={onClick}
            aria-label={
                s.got
                    ? t('profile.album.cellGot', { name: sp.name, edition, n: s.c?.n ?? 1 })
                    : t('profile.album.cellMissing', { name: seen ? sp.name : `Nº ${sp.id}`, edition })
            }
        >
            {s.got ? (
                <PokeCard2 inst={s.inst} variant="metal" />
            ) : (
                <span className="al-empty" aria-hidden>
                    <img className="pixel pf-silhouette" src={speciesGif(sp.id)} alt="" loading="lazy" />
                    <b>?</b>
                </span>
            )}
            {s.got && (s.c?.n ?? 1) > 1 && <span className="al-n">×{s.c?.n}</span>}
            {label && <small>{label}</small>}
        </button>
    );
}

// ------------------------------------------------------------------------------------- Álbum na Pokédex
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

/**
 * Álbum de cartas (visão da Pokédex): a vitrine, a conta do álbum e as seções (Ícones, Shiny, Evento por tipo,
 * Destaque). Tocar numa figurinha abre a ficha da espécie já nas cartas.
 */
export function AlbumView({ onOpen }: { onOpen: (id: number, order: number[]) => void }) {
    const { t, d, lang } = useT();
    const { dex, shown, open, slot } = useAlbum();
    const [section, setSection] = useState<CardSlot>('icone');
    const total = albumCount(dex);
    const commons = albumCount(dex, SPECIES, ['normal']);
    const list = SECTION_SPECIES[section];
    const order = list.map((sp) => sp.id);
    const grid = (sps: Species[]) => (
        <ul className="al-grid">
            {sps.map((sp) => (
                <li key={sp.id}>
                    <Sticker sp={sp} ed={section} s={slot(sp, section)} onClick={() => onOpen(sp.id, order)} />
                </li>
            ))}
        </ul>
    );

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
                                onClick={() => open(c, binderInst(c))}
                            >
                                <PokeCard2 inst={binderInst(c)} variant="metal" />
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

            <div className="bc-seg al-tabs" role="tablist" aria-label={t('profile.album.sectionsAria')}>
                {CARD_SLOTS.map((ed) => {
                    const n = albumCount(dex, SECTION_SPECIES[ed], [ed]);
                    return (
                        <button
                            type="button"
                            role="tab"
                            key={ed}
                            aria-selected={section === ed}
                            className={section === ed ? 'on' : undefined}
                            onClick={() => setSection(ed)}
                        >
                            {d.profile.album.sections[ed]}{' '}
                            <small>
                                {n.got}/{n.total}
                            </small>
                        </button>
                    );
                })}
            </div>

            {section === 'evento'
                ? EVENT_GROUPS.map((g) => {
                      const n = albumCount(dex, g.list, ['evento']);
                      return (
                          <section key={g.type} className="al-group">
                              <h3>
                                  <TypeIcon type={g.type} size={18} /> {typeName(g.type, lang)}{' '}
                                  <span className="pf-count">
                                      {n.got}/{n.total}
                                  </span>
                              </h3>
                              {grid(g.list)}
                          </section>
                      );
                  })
                : grid(list)}

            <p className="pf-note al-commons">{t('profile.album.commons', { n: commons.got, total: commons.total })}</p>
        </div>
    );
}

// ------------------------------------------------------------------------------------- na ficha da espécie
/** Nome do combo da carta: "Shiny Ícone MVP 2", "Destaque III", "Evento Fogo". */
export function useComboName() {
    const { d, lang } = useT();
    return (p: PokemonInstance) => {
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

/**
 * Ficha da espécie: "Suas cartas" (uma figurinha por edição, a melhor de cada, ×N; a Normal fica como figurinha
 * pequena) e, embaixo, a "Melhor carta" grande com quando/como veio e o botão da vitrine.
 */
export function SheetCards({ sp, anchor }: { sp: Species; anchor: RefObject<HTMLElement | null> }) {
    const { t, d } = useT();
    const { dex, binder, shown, full, open, note, toggle, slot } = useAlbum();
    const combo = useComboName();
    const slots = albumSlots(sp);
    const special = slots.filter((ed): ed is CardSlot => ed !== 'normal');
    const got = albumCount(dex, [sp]).got;
    const normal = hasSticker(dex[sp.id], 'normal');
    // a melhor entre as coladas; figurinha de antes do álbum (sem carta guardada): a padrão da melhor edição
    const bestC = bestOfSpecies(binder, sp.id, stuck(dex));
    const oldEd = special.find((ed) => hasSticker(dex[sp.id], ed));
    const best = bestC
        ? { c: bestC, inst: binderInst(bestC) }
        : oldEd
          ? { c: null, inst: defaultCard(sp, oldEd) }
          : null;
    const on = !!bestC && shown.includes(bestC);

    return (
        <>
            <section className="pf-block al-yours" ref={anchor}>
                <h3>
                    {t('profile.album.yours')}{' '}
                    <span className="pf-bst">{t('profile.sheet.albumCount', { n: got, total: slots.length })}</span>
                </h3>
                <ul className="al-row">
                    {special.map((ed) => {
                        const s = slot(sp, ed);
                        return (
                            <li key={ed}>
                                <Sticker
                                    sp={sp}
                                    ed={ed}
                                    s={s}
                                    label={d.common.edition[ed]}
                                    onClick={() => s.got && open(s.c, s.inst)}
                                />
                            </li>
                        );
                    })}
                    <li>
                        <span
                            className={`pf-sticker al-normal${normal ? ' got sk-normal' : ''}`}
                            role="img"
                            aria-label={t(normal ? 'profile.sheet.stickerGot' : 'profile.sheet.stickerMissing', {
                                edition: t('profile.sheet.normal'),
                            })}
                        >
                            <img
                                className={`pixel${normal ? '' : ' pf-silhouette'}`}
                                src={speciesGif(sp.id)}
                                alt=""
                                loading="lazy"
                                draggable={false}
                            />
                            <small>{t('profile.sheet.normal')}</small>
                        </span>
                    </li>
                </ul>
                {got < slots.length && <p className="pf-note">{t('profile.sheet.albumHelp')}</p>}
            </section>

            <section className="pf-block al-best">
                <h3>{t('profile.album.best')}</h3>
                {best ? (
                    <div className="al-best-row">
                        <PokeCard2 inst={best.inst} variant="metal" onClick={() => open(best.c, best.inst)} />
                        <div className="al-best-info">
                            <b>{combo(best.inst)}</b>
                            <small className="muted">{note(best.c)}</small>
                            {best.c && !on && full && <small className="muted">{t('profile.binder.full')}</small>}
                            {best.c && (
                                <button
                                    type="button"
                                    className={`btn small${on ? ' ghost' : ' primary'}`}
                                    disabled={!on && full}
                                    onClick={() => best.c && toggle(best.c.id)}
                                >
                                    {on ? t('profile.binder.remove') : t('profile.binder.add')}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="pf-note">{t('profile.album.bestNone')}</p>
                )}
            </section>
        </>
    );
}
