import { species } from '../../engine/data';
import { FORMATIONS } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { linkText } from '../../i18n';
import { useT } from '../../i18n/react';
import { chemistry, chemTotal, diamondsOf } from '../../store/ultimate/chemistry';
import { STARTERS } from '../../store/ultimate/rules';
import type { UltimateSave } from '../../store/ultimate/ultimate';
import { LinkChips } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { TypeBadge } from '../components/PokeCard';

const pct = (f: number) => Math.round((f - 1) * 100);

/** Losangos de química 0–3 (como os do FC): na vaga da quadra, no painel e no "X/15" do time. */
export function Diamonds({ n }: { n: number }) {
    return (
        <span className="ut-dia" role="img" aria-label={`${n}/3`}>
            {[0, 1, 2].map((i) => (
                <i key={i} className={i < n ? 'on' : undefined} />
            ))}
        </span>
    );
}
/** Sinergias "falta pouco" na lista (as de menos famílias faltando primeiro). */
const NEAR_MAX = 4;

/**
 * Painel de química da aba Time: o bônus de cada titular (tipo × história, pela regra única de `modifiers.ts`), as
 * sinergias ligadas e o que falta pra ligar (com as cartas da coleção que servem).
 */
export function Chemistry({ u }: { u: UltimateSave }) {
    const { t, lang, d } = useT();
    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const lineup = u.team.order.slice(0, STARTERS).flatMap((uid) => byUid.get(uid) ?? []);
    const reserves = u.cards.filter((c) => !lineup.includes(c));
    const roles = FORMATIONS[u.team.formation].slots;
    const bench = u.team.order.slice(STARTERS).flatMap((uid) => byUid.get(uid) ?? []);
    const ch = chemistry(lineup, roles, reserves, bench);
    const on = ch.types.length + ch.links.length > 0;
    const name = (p: PokemonInstance) => viewInstance(p).displayName;
    return (
        <section className="panel ut-chem bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="max" />
                {t('ultimate.chem.title')}
                <b className="ut-chem-avg">
                    {chemTotal(ch)}/{STARTERS * 3}
                </b>
            </h2>
            <ul className="ut-chem-players">
                {lineup.map((p, i) => {
                    const row = ch.players[i];
                    return (
                        <li key={p.uid} className={row.chem > 1 ? 'on' : undefined}>
                            <small>{d.common.posShort[roles[i]]}</small>
                            <MonIcon id={p.speciesId} shiny={p.shiny} />
                            <span>{name(p)}</span>
                            <em className="ut-off" title={row.pos < 1 ? t('ultimate.chem.offPos') : undefined}>
                                {row.pos < 1 && `${pct(row.pos)}%`}
                            </em>
                            <Diamonds n={diamondsOf(row.chem)} />
                            <b>{row.chem > 1 ? `+${pct(row.chem)}%` : '0%'}</b>
                        </li>
                    );
                })}
            </ul>
            <span className="bc-lbl">{t('ultimate.chem.active')}</span>
            {on ? (
                <div className="row ut-chem-on">
                    {ch.types.map((s) => (
                        <span key={s.type} className="row ut-chem-type">
                            <TypeBadge type={s.type} />
                            <small>
                                ×{s.count} · +{pct(s.bonus)}%
                            </small>
                        </span>
                    ))}
                    <LinkChips links={ch.links} />
                </div>
            ) : (
                <small className="muted">{t('ultimate.chem.none')}</small>
            )}
            <span className="bc-lbl">{t('ultimate.chem.near')}</span>
            {ch.nearTypes.length + ch.nearLinks.length === 0 ? (
                <small className="muted">{t('ultimate.chem.nearNone')}</small>
            ) : (
                <ul className="ut-chem-near">
                    {ch.nearTypes.length > 0 && (
                        <li>
                            <span className="row">
                                {ch.nearTypes.map((type) => (
                                    <TypeBadge key={type} type={type} />
                                ))}
                            </span>
                            <small className="muted">{t('ultimate.chem.typeNear')}</small>
                        </li>
                    )}
                    {[...ch.nearLinks]
                        .sort((a, b) => a.missing.length - b.missing.length)
                        .slice(0, NEAR_MAX)
                        .map((l) => (
                            <li key={l.def.id}>
                                <b>
                                    {linkText(l.def.id, lang).name} +
                                    {pct(ch.links.some((x) => x.def.id === l.def.id) ? l.def.full! : l.def.bonus)}%
                                </b>
                                <small className="muted">
                                    {t('ultimate.chem.missing')}: {l.missing.map((id) => species(id).name).join(', ')}
                                </small>
                                {l.owned.length > 0 && (
                                    <span className="ut-chem-owned">
                                        <small>{t('ultimate.chem.owned')}:</small>
                                        {l.owned.map((c) => (
                                            <MonIcon key={c.uid} id={c.speciesId} shiny={c.shiny} label={name(c)} />
                                        ))}
                                    </span>
                                )}
                            </li>
                        ))}
                </ul>
            )}
        </section>
    );
}
