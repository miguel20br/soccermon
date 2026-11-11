import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { fmt } from '../../i18n';
import { useT } from '../../i18n/react';
import { COACH_GROUPS, COACH_REPLAY, type CoachId } from '../../store/coach';
import { type Screen, useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';
import { blockText, faqEntries, type HelpBlock, helpSections, normalize } from '../help/content';
import { resetTips } from '../help/Tip';
import { FEEDBACK_URL } from '../links';
import '../help/help.css';
import { backTarget } from '../back-nav';
import { HudIcon } from '../components/MatchHud';
import { SheetRow } from '../kit/controls';

/** `**negrito**` → <b>. */
function rich(text: string): ReactNode {
    const parts = text.split('**');
    return parts.map((part, i) =>
        // biome-ignore lint/suspicious/noArrayIndexKey: pedaços fixos de um texto estático
        i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>,
    );
}

function Block({ block }: { block: HelpBlock }) {
    if ('p' in block) return <p>{rich(block.p)}</p>;
    if ('link' in block) {
        return (
            <a className="btn small help-link" href={block.link.href} target="_blank" rel="noopener">
                {block.link.label}
            </a>
        );
    }
    return (
        <ul>
            {block.list.map((item) =>
                typeof item === 'string' ? (
                    <li key={item}>{rich(item)}</li>
                ) : (
                    <li key={item[0]}>
                        <b>{item[0]}</b>
                        {item[1] && <>: {rich(item[1])}</>}
                    </li>
                ),
            )}
        </ul>
    );
}

/** Índice de busca (texto normalizado) das seções e perguntas no idioma do jogo. */
function searchIndex(lang: Parameters<typeof helpSections>[0]) {
    return {
        sections: helpSections(lang).map((s) => ({
            section: s,
            text: normalize([s.title, ...s.blocks.map(blockText)].join(' ')),
        })),
        faq: faqEntries(lang).map((f) => ({ faq: f, text: normalize([f.q, ...f.a.map(blockText)].join(' ')) })),
    };
}

/** Os 2 blocos das regras (ids de `help/content.ts`). */
const HELP_GROUPS: { key: 'team' | 'match'; ids: string[] }[] = [
    { key: 'team', ids: ['posicoes', 'cartas', 'tipos', 'sinergias'] },
    { key: 'match', ids: ['partida', 'golpes', 'status', 'golpeMax', 'evolucao'] },
];

/**
 * Ajuda enxuta (menos-e-mais.md, A3): em cima o "Como funciona" de cada modo (os balões voltam); depois só as regras
 * que não aparecem na tela (com busca) e as perguntas frequentes.
 */
export function Help() {
    const go = useGame((s) => s.go);
    const tipsOn = useGame((s) => s.settings.tips);
    const { d, lang } = useT();
    const tx = d.help.screen;
    const index = useMemo(() => searchIndex(lang), [lang]);
    const [query, setQuery] = useState('');
    const [tipsReset, setTipsReset] = useState(false);
    const c = d.help.coach.replay;
    const updateProfile = useGame((s) => s.updateProfile);
    const [redone, setRedone] = useState<CoachId[]>([]);
    // "Como funciona": o balão do modo volta; nos modos com tela própria já abre a tela
    const replayCoach = (id: CoachId) => {
        const drop = COACH_GROUPS[id];
        updateProfile({ coach: (useGame.getState().profile.coach ?? []).filter((x) => !drop.includes(x as CoachId)) });
        const screen: Partial<Record<CoachId, Screen>> = { intro: 'home', duelo: 'duel', dia: 'daily', liga: 'liga' };
        if (screen[id]) go(screen[id]);
        else setRedone([...redone, id]);
    };
    const q = normalize(query.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    const match = (text: string) => terms.every((t) => text.includes(t));

    const sections = index.sections.filter((s) => !terms.length || match(s.text));
    const faq = index.faq.filter((f) => !terms.length || match(f.text));
    const nothing = terms.length > 0 && !sections.length && !faq.length;

    return (
        <div className="menu-screen help-screen">
            <MenuHead title={tx.title} icon="help" onBack={() => go(backTarget('help') ?? 'home')} />

            {/* o principal: rever o balão de cada modo (e as dicas das telas) */}
            <section className="help-coach" aria-labelledby="help-coach-title">
                <h2 id="help-coach-title" className="bc-caption">
                    {c.title}
                </h2>
                <div className="help-actions">
                    {COACH_REPLAY.map((id) => (
                        <button
                            key={id}
                            type="button"
                            className="btn ghost small"
                            disabled={redone.includes(id)}
                            onClick={() => replayCoach(id)}
                        >
                            {redone.includes(id) ? c.done : (c as Record<string, string>)[id]}
                        </button>
                    ))}
                    {tipsOn && (
                        <button
                            type="button"
                            className="btn ghost small"
                            disabled={tipsReset}
                            onClick={() => {
                                resetTips();
                                setTipsReset(true);
                            }}
                        >
                            {tipsReset ? tx.tipsBack : tx.tipsShow}
                        </button>
                    )}
                </div>
                <small className="muted">{c.hint}</small>
            </section>

            <label className="help-search k-field">
                <HudIcon kind="search" className="help-search-icon" />
                <span className="help-sr-only">{tx.searchLabel}</span>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tx.searchPlaceholder}
                    enterKeyHint="search"
                    autoComplete="off"
                />
            </label>

            {nothing && (
                <div className="panel help-empty">
                    <p>{fmt(tx.nothing, { query: query.trim() })}</p>
                    <p className="muted">
                        {tx.notFound}{' '}
                        <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                            {tx.askUs}
                        </a>
                        .
                    </p>
                </div>
            )}

            {/* cada regra é uma linha que abre a sheet (cara-de-jogo.md: acordeão só dentro de sheet), em 2 blocos */}
            {HELP_GROUPS.map((g) => {
                const rows = sections.filter(({ section }) => g.ids.includes(section.id));
                if (!rows.length) return null;
                return (
                    <section key={g.key} className="help-group" aria-labelledby={`help-g-${g.key}`}>
                        <h2 id={`help-g-${g.key}`} className="bc-caption">
                            {tx.groups[g.key]}
                        </h2>
                        <div className="help-list">
                            {rows.map(({ section }) => (
                                <SheetRow
                                    key={section.id}
                                    className="help-row"
                                    icon={
                                        <img
                                            className="pixel help-sprite"
                                            src={`assets/cards/${section.sprite}.gif`}
                                            alt=""
                                            loading="lazy"
                                        />
                                    }
                                    label={section.title}
                                    title={section.title}
                                >
                                    <div className="help-body">
                                        {section.blocks.map((b, i) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: blocos fixos da seção
                                            <Block key={i} block={b} />
                                        ))}
                                    </div>
                                </SheetRow>
                            ))}
                        </div>
                    </section>
                );
            })}

            {faq.length > 0 && (
                <section className="help-faq" aria-labelledby="help-faq-title">
                    <h2 id="help-faq-title" className="bc-caption">
                        {tx.faq}
                    </h2>
                    <div className="help-list">
                        {faq.map(({ faq: f }) => (
                            <SheetRow key={f.q} className="help-row faq" label={f.q} title={f.q}>
                                <div className="help-body">
                                    {f.a.map((b, i) => (
                                        // biome-ignore lint/suspicious/noArrayIndexKey: blocos fixos da resposta
                                        <Block key={i} block={b} />
                                    ))}
                                </div>
                            </SheetRow>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
