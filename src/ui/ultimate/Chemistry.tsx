import type { ReactNode } from 'react';
import { species } from '../../engine/data';
import { FORMATIONS } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { linkText } from '../../i18n';
import { useT } from '../../i18n/react';
import { chemistry, chemTotal, chemWhy, diamondsOf, nextType } from '../../store/ultimate/chemistry';
import { STARTERS } from '../../store/ultimate/rules';
import type { UltimateSave } from '../../store/ultimate/ultimate';
import { LinkChip, SynergyChip } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { TypeBadge } from '../components/PokeCard';

const pct = (f: number) => Math.round((f - 1) * 100);
const signed = (f: number) => (f > 1 ? `+${pct(f)}%` : f < 1 ? `${pct(f)}%` : '0%');

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
/** Tipos "falta pouco" à vista; o resto vira "+N" (no celular a fileira quebrava em 3 linhas). */
const TYPES_MAX = 3;

/** A química do time salvo: titulares na ordem das vagas, banco e o resto da coleção (pro "falta pouco"). */
export function chemOf(u: UltimateSave) {
    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const lineup = u.team.order.slice(0, STARTERS).flatMap((uid) => byUid.get(uid) ?? []);
    const roles = FORMATIONS[u.team.formation].slots;
    const bench = u.team.order.slice(STARTERS).flatMap((uid) => byUid.get(uid) ?? []);
    const ch = chemistry(
        lineup,
        roles,
        u.cards.filter((c) => !lineup.includes(c)),
        bench,
    );
    return { lineup, roles, ch };
}

const name = (p: PokemonInstance) => viewInstance(p).displayName;

/**
 * Painel de química do Elenco: o bônus de cada titular (tipo × história, pela regra única de `modifiers.ts`) com os
 * losangos, as sinergias ligadas com o próximo degrau e o que falta pra ligar (com as cartas da coleção que servem).
 */
export function Chemistry({ u }: { u: UltimateSave }) {
    const { t, lang } = useT();
    const { lineup, ch } = chemOf(u);
    const on = ch.types.length + ch.links.length > 0;
    const near = [...ch.nearLinks].sort((a, b) => a.missing.length - b.missing.length).slice(0, NEAR_MAX);
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
                    // a vaga e o "fora da posição" ficam na quadra e no painel do titular: aqui só a química
                    return (
                        <li key={p.uid} className={row.chem > 1 ? 'on' : undefined}>
                            <MonIcon id={p.speciesId} shiny={p.shiny} />
                            <span>{name(p)}</span>
                            <Diamonds n={diamondsOf(row.chem)} />
                            <b>{row.chem > 1 ? `+${pct(row.chem)}%` : '0%'}</b>
                        </li>
                    );
                })}
            </ul>
            <span className="bc-lbl">{t('ultimate.chem.active')}</span>
            {on ? (
                <ul className="ut-chem-near">
                    {ch.types.map((s) => {
                        const next = s.mono ? null : nextType(s.count);
                        return (
                            <li key={s.type}>
                                <SynergyChip s={s} />
                                {next && (
                                    <small className="muted">
                                        {t('ultimate.chem.nextType', { n: next.count, p: pct(next.bonus) })}
                                    </small>
                                )}
                            </li>
                        );
                    })}
                    {ch.links.map((l) => (
                        <li key={l.def.id}>
                            <LinkChip def={l.def} bonus={l.bonus} special={l.full && l.def.special} />
                            {!l.full && l.def.full && (
                                <small className="muted">
                                    {t('ultimate.chem.nextLink', { n: l.def.groups.length, p: pct(l.def.full) })}
                                </small>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <small className="muted">{t('ultimate.chem.none')}</small>
            )}
            <span className="bc-lbl">{t('ultimate.chem.near')}</span>
            {ch.nearTypes.length + near.length === 0 ? (
                <small className="muted">{t('ultimate.chem.nearNone')}</small>
            ) : (
                <ul className="ut-chem-near">
                    {ch.nearTypes.length > 0 && (
                        <li>
                            <span className="row ut-chem-types">
                                {ch.nearTypes.slice(0, TYPES_MAX).map((type) => (
                                    <TypeBadge key={type} type={type} />
                                ))}
                                {ch.nearTypes.length > TYPES_MAX && (
                                    <small className="ut-chem-more">+{ch.nearTypes.length - TYPES_MAX}</small>
                                )}
                            </span>
                            <small className="muted">{t('ultimate.chem.typeNear')}</small>
                        </li>
                    )}
                    {near.map((l) => (
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

/**
 * O "por que" de um titular (tocar na carta da quadra): de onde vem cada losango em 3 linhas (Tipo, História e
 * Posição), lidos do mesmo cálculo da química (`chemWhy`). As ações (Trocar, Banco, Ver carta) vêm de quem chama.
 */
export function ChemWhyPanel({
    u,
    i,
    head,
    actions,
}: {
    u: UltimateSave;
    i: number;
    head?: ReactNode;
    actions: ReactNode;
}) {
    const { t, d, lang } = useT();
    const { lineup, roles, ch } = chemOf(u);
    const p = lineup[i];
    if (!p) return null;
    const w = chemWhy(ch, lineup, i);
    const positions = viewInstance(p).positions;
    const fit = positions[0] === roles[i] ? 'main' : positions.includes(roles[i]) ? 'alt' : 'off';
    const near = w.link.near[0];
    return (
        <div className="ut-why" key={p.uid}>
            {head}
            <p className="ut-why-total">
                <Diamonds n={w.diamonds} />
                <b className={ch.players[i].chem > 1 ? 'up' : undefined}>{signed(ch.players[i].chem)}</b>
                <small className="muted">{t('ultimate.why.total')}</small>
            </p>
            <ul className="ut-why-list">
                <li>
                    <span className="bc-lbl">{t('ultimate.why.type')}</span>
                    <span className="ut-why-what">
                        {w.type.syn ? (
                            <SynergyChip s={w.type.syn} />
                        ) : (
                            <span className="row ut-chem-types">
                                {w.type.types.map((ty) => (
                                    <TypeBadge key={ty} type={ty} />
                                ))}
                            </span>
                        )}
                        {w.type.next && (
                            <small className="muted">
                                {t('ultimate.chem.nextType', { n: w.type.next.count, p: pct(w.type.next.bonus) })}
                            </small>
                        )}
                    </span>
                    <b className={w.type.factor > 1 ? 'up' : undefined}>{signed(w.type.factor)}</b>
                </li>
                <li>
                    <span className="bc-lbl">{t('ultimate.why.link')}</span>
                    <span className="ut-why-what">
                        {w.link.active.length ? (
                            <span className="row ut-chem-types">
                                {w.link.active.map((l) => (
                                    <LinkChip
                                        key={l.def.id}
                                        def={l.def}
                                        bonus={l.bonus}
                                        special={l.full && l.def.special}
                                    />
                                ))}
                            </span>
                        ) : (
                            <small>{t('ultimate.why.linkNone')}</small>
                        )}
                        {near && (
                            <small className="muted">
                                {t('ultimate.why.linkNear', {
                                    name: linkText(near.def.id, lang).name,
                                    who: near.missing.map((id) => species(id).name).join(', '),
                                })}
                            </small>
                        )}
                    </span>
                    <b className={w.link.factor > 1 ? 'up' : undefined}>{signed(w.link.factor)}</b>
                </li>
                <li>
                    <span className="bc-lbl">{t('ultimate.why.pos')}</span>
                    <span className="ut-why-what">
                        <small>
                            {t(`ultimate.why.${fit}`, { pos: d.common.pos[roles[i]], nat: d.common.pos[positions[0]] })}
                        </small>
                        {fit !== 'main' && <small className="muted">{t('ultimate.why.posNote')}</small>}
                    </span>
                    <b className={w.pos < 1 ? 'down' : undefined}>{signed(w.pos)}</b>
                </li>
            </ul>
            <div className="ut-why-acts">{actions}</div>
        </div>
    );
}
