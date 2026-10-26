import { useMemo } from 'react';
import { species } from '../../engine/data';
import { fmt } from '../../i18n';
import { useT } from '../../i18n/react';
import { type CrestSymbol, UNLOCK } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import {
    encodeShowcase,
    frameTier,
    type MedalView,
    medalProgress,
    resolveShowcase,
    SHOWCASE_MAX,
    type ShowItem,
    showKey,
    TIER_NAMES,
    type Tier,
    toggleShowcase,
} from '../../store/medals';
import { MISSIONS } from '../../store/missions';
import { newsKey } from '../../store/news';
import type { Profile } from '../../store/profile';
import { Tip } from '../components/Tip';
import { symbolArt } from './Crest';
import { speciesGif, titleName } from './club';
import { CareerSealIcon, CheckIcon } from './icons';
import { NewBadge } from './news';
import { sealTip } from './seal-tip';
import { useSaveView } from './TrainerTab';
import './medals.css';

/** Desenho no meio de cada medalha (os mesmos símbolos do escudo). */
export const MEDAL_GLYPH: Record<string, CrestSymbol> = {
    pokedex: 'pokebola',
    elenco: 'punho',
    partidas: 'bola',
    vitorias: 'estrela',
    artilheiro: 'chama',
    copas: 'taca',
    campeao: 'coroa',
    sequencia: 'raio',
    penaltis: 'gota',
    evolucoes: 'lua',
    movedex: 'asa',
    figurinhas: 'folha',
    shiny: 'joia',
    icones: 'chifre',
    destaques: 'estrela',
    selos: 'espiral',
    tipos: 'rocha',
    colecoes: 'folha',
    missoes: 'coroa',
    duelista: 'espadas',
};
/** Coleção na vitrine: o símbolo de escudo que ela libera. */
const COLLECTION_GLYPH = Object.fromEntries(
    Object.entries(UNLOCK).flatMap(([piece, u]) => (u && 'collection' in u ? [[u.collection, piece]] : [])),
) as Record<string, CrestSymbol>;

/** O save do jeito que as medalhas leem. */
export function useMedalView(): MedalView {
    const base = useSaveView();
    const career = useGame((s) => s.career);
    const records = useGame((s) => s.records);
    const duels = useGame((s) => s.duels);
    return useMemo(() => ({ ...base, career, records, duels }), [base, career, records, duels]);
}

/** Sua vitrine (resolvida pelo save) e o degrau da moldura do avatar. */
export function useShowcase(): { items: ShowItem[]; frame: Tier; encoded: string[] } {
    const view = useMedalView();
    const choice = useGame((s) => s.profile.showcase);
    return useMemo(() => {
        const items = resolveShowcase(choice, view);
        return { items, frame: frameTier(items), encoded: encodeShowcase(items) };
    }, [choice, view]);
}

/** Classe da moldura do avatar pelo degrau ('' = sem moldura). */
export const frameClass = (tier: Tier) => (tier ? ` av-frame t-${TIER_NAMES[tier]}` : '');

/** Medalha redonda no metal do degrau (bronze/prata/ouro das cartas, platina holográfica). */
export function MedalDisc({ glyph, tier, className = '' }: { glyph: CrestSymbol; tier: Tier; className?: string }) {
    return (
        <span className={`medal t-${TIER_NAMES[tier]} ${className}`} aria-hidden>
            <svg viewBox="0 0 24 24" aria-hidden>
                {symbolArt(glyph, 'var(--md-ink)', 'var(--md-hole)')}
            </svg>
        </span>
    );
}

/** Nome legível de um destaque (rótulo e leitor de tela). */
export function showLabel(it: ShowItem, d: ReturnType<typeof useT>['d']): string {
    if (it.kind === 'm')
        return `${d.profile.medals.names[it.id] ?? it.id} · ${d.profile.medals.tiers[TIER_NAMES[it.tier]]}`;
    if (it.kind === 'c') return titleName(it.id);
    return `${species(it.speciesId).name} · ${d.profile.sheet.sealNames[it.seal]}`;
}

/** Dica de um destaque: o nome e o que ele pede (medalha), ou o que o selo de carreira pede. */
export function showTip(it: ShowItem, tr: ReturnType<typeof useT>): string {
    if (it.kind === 'm') return `${showLabel(it, tr.d)}: ${tr.d.profile.medals.text[it.id] ?? ''}`;
    if (it.kind === 's') return sealTip(tr.t, it.seal, species(it.speciesId).name);
    return showLabel(it, tr.d);
}

/** Um destaque: medalha, coleção (medalha de prata com o símbolo dela) ou selo de carreira na espécie. */
export function ShowBadge({ it }: { it: ShowItem }) {
    if (it.kind === 'm') return <MedalDisc glyph={MEDAL_GLYPH[it.id] ?? 'pokebola'} tier={it.tier} />;
    if (it.kind === 'c') return <MedalDisc glyph={COLLECTION_GLYPH[it.id] ?? 'pokebola'} tier={2} className="is-col" />;
    return (
        <span className="show-seal" aria-hidden>
            <img className="pixel" src={speciesGif(it.speciesId)} alt="" loading="lazy" draggable={false} />
            <CareerSealIcon seal={it.seal} className="show-seal-ico" />
        </span>
    );
}

/** A fileira da vitrine (cartão de treinador, VERSUS). Sem destaques, não aparece. */
export function ShowcaseRow({ items, className = '' }: { items: ShowItem[]; className?: string }) {
    const tr = useT();
    if (!items.length) return null;
    return (
        <ul className={`showcase ${className}`} aria-label={tr.d.profile.medals.showcase}>
            {items.map((it) => (
                <li key={showKey(it)}>
                    <Tip text={showTip(it, tr)}>
                        <ShowBadge it={it} />
                        <span className="pf-sr">{showLabel(it, tr.d)}</span>
                    </Tip>
                </li>
            ))}
        </ul>
    );
}

/** Aba Medalhas: a vitrine (escolher 3) e as 20 medalhas com o degrau, a barra até o próximo e os 4 números. */
export function MedalsTab({ save }: { save: (patch: Partial<Profile>) => void }) {
    const view = useMedalView();
    const choice = useGame((s) => s.profile.showcase);
    const { t, d } = useT();
    const progress = useMemo(() => medalProgress(view), [view]);
    const shown = resolveShowcase(choice, view);
    const shownKeys = new Set(shown.map(showKey));
    const full = shown.length >= SHOWCASE_MAX;
    const toggle = (key: string) =>
        // a escolha guarda só o que ainda vale (destaque perdido num save de outro aparelho sai)
        save({ showcase: toggleShowcase(shown.map(showKey), key) });
    const earned = progress.filter((p) => p.tier > 0).length;

    const collections = MISSIONS.filter((m) => m.group === 'colecoes' && view.done.has(m.id));
    const pickBtn = (key: string, label: string, children: React.ReactNode, fresh?: string) => {
        const on = shownKeys.has(key);
        return (
            <button
                type="button"
                key={key}
                className={`show-pick${on ? ' active' : ''}`}
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(key)}
                title={label}
            >
                {children}
                <span className="pf-sr">{label}</span>
                {on && <CheckIcon />}
                {fresh && <NewBadge k={fresh} className="corner" />}
            </button>
        );
    };

    return (
        <div className="pf-medals">
            <section className="panel pf-card md-showcase">
                <h2>
                    {d.profile.medals.showcase}{' '}
                    <span className="pf-count">
                        {shown.length}/{SHOWCASE_MAX}
                    </span>
                </h2>
                <div className="md-slots">
                    {Array.from({ length: SHOWCASE_MAX }, (_, i) => {
                        const it = shown[i];
                        return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 3 vagas fixas
                            <div key={i} className={`md-slot${it ? '' : ' empty'}`}>
                                {it ? (
                                    <>
                                        <ShowBadge it={it} />
                                        <small>{showLabel(it, d)}</small>
                                    </>
                                ) : (
                                    <small>{t('profile.medals.slotEmpty')}</small>
                                )}
                            </div>
                        );
                    })}
                </div>
                <small className="muted">{t('profile.medals.showcaseHelp')}</small>
                {collections.length > 0 && (
                    <div className="md-extra">
                        {collections.length > 0 && (
                            <div>
                                <b>{t('profile.medals.collections')}</b>
                                <div className="md-picks">
                                    {collections.map((m) =>
                                        pickBtn(
                                            `c:${m.id}`,
                                            titleName(m.id),
                                            <ShowBadge it={{ kind: 'c', id: m.id }} />,
                                            newsKey.collection(m.id),
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="panel pf-card">
                <h2>
                    {t('profile.tabs.medalhas')}{' '}
                    <span className="pf-count">
                        {t('profile.medals.summary', { n: earned, total: progress.length })}
                    </span>
                </h2>
                <ul className="md-grid">
                    {progress.map(({ medal, value, tier, next }) => {
                        const key = `m:${medal.id}`;
                        const on = shownKeys.has(key);
                        // a barra conta igual ao texto (n/meta do próximo degrau)
                        const pct = next === null ? 100 : (value / next) * 100;
                        const name = d.profile.medals.names[medal.id] ?? medal.id;
                        return (
                            <li key={medal.id} className={`md-card t-${TIER_NAMES[tier]}${on ? ' shown' : ''}`}>
                                <Tip
                                    focusable={false}
                                    text={`${name} · ${tier ? d.profile.medals.tiers[TIER_NAMES[tier]] : t('profile.medals.none')}: ${d.profile.medals.text[medal.id] ?? ''}`}
                                >
                                    <MedalDisc glyph={MEDAL_GLYPH[medal.id] ?? 'pokebola'} tier={tier} />
                                </Tip>
                                <div className="md-body">
                                    <b>
                                        {name} {tier > 0 && <NewBadge k={newsKey.medal(medal.id, tier)} />}
                                    </b>
                                    <span className="md-text">{d.profile.medals.text[medal.id]}</span>
                                    <span className="md-tier">
                                        {tier ? d.profile.medals.tiers[TIER_NAMES[tier]] : t('profile.medals.none')}
                                        {' · '}
                                        {next === null
                                            ? t('profile.medals.max')
                                            : fmt(d.profile.medals.next, {
                                                  tier: d.profile.medals.tiers[TIER_NAMES[(tier + 1) as Tier]],
                                                  n: Math.min(value, next).toLocaleString(),
                                                  goal: next.toLocaleString(),
                                              })}
                                    </span>
                                    <span
                                        className={`k-bar${next === null ? ' full' : ''}`}
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={next ?? value}
                                        aria-valuenow={Math.min(value, next ?? value)}
                                        aria-label={name}
                                    >
                                        <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                                    </span>
                                    <span className="md-steps" aria-hidden>
                                        {medal.steps.map((s, i) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: os 4 degraus são fixos
                                            <i key={i} className={`t-${TIER_NAMES[i + 1]}${tier > i ? ' got' : ''}`}>
                                                {s.toLocaleString()}
                                            </i>
                                        ))}
                                    </span>
                                </div>
                                {tier > 0 && (
                                    <button
                                        type="button"
                                        className={`md-show${on ? ' active' : ''}`}
                                        aria-pressed={on}
                                        disabled={!on && full}
                                        onClick={() => toggle(key)}
                                    >
                                        {on ? t('profile.medals.unpick') : t('profile.medals.pick')}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
