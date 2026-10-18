import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { fmt } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';
import { blockText, faqEntries, type HelpBlock, helpSections, normalize } from '../help/content';
import { resetTips } from '../help/Tip';
import { FEEDBACK_URL } from '../links';
import '../help/help.css';

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

function SearchIcon() {
    return (
        <svg viewBox="0 0 16 16" className="help-search-icon" aria-hidden="true">
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.3 10.3L14 14" />
        </svg>
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

/** Ajuda: como jogar, todas as mecânicas (com busca) e perguntas frequentes. */
export function Help() {
    const go = useGame((s) => s.go);
    const setOnboarded = useGame((s) => s.setOnboarded);
    const tipsOn = useGame((s) => s.settings.tips);
    const { d, lang } = useT();
    const tx = d.help.screen;
    const index = useMemo(() => searchIndex(lang), [lang]);
    const [query, setQuery] = useState('');
    const [tipsReset, setTipsReset] = useState(false);
    const q = normalize(query.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    const match = (text: string) => terms.every((t) => text.includes(t));

    const sections = index.sections.filter((s) => !terms.length || match(s.text));
    const faq = index.faq.filter((f) => !terms.length || match(f.text));
    const searching = terms.length > 0;
    const nothing = searching && !sections.length && !faq.length;

    return (
        <div className="menu-screen help-screen">
            <MenuHead title={tx.title} icon="help" onBack={() => go('home')} />

            <div className="help-actions">
                <button
                    type="button"
                    className="btn yellow"
                    onClick={() => {
                        setOnboarded(false);
                        go('home');
                    }}
                >
                    {tx.replay}
                </button>
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

            <label className="help-search">
                <SearchIcon />
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

            {sections.length > 0 && (
                <div className="help-list">
                    {sections.map(({ section }) => (
                        <details
                            key={`${section.id}${searching ? '-q' : ''}`}
                            className="panel help-section"
                            open={searching || undefined}
                        >
                            <summary>
                                <img
                                    className="pixel help-sprite"
                                    src={`assets/cards/${section.sprite}.gif`}
                                    alt=""
                                    loading="lazy"
                                />
                                <span>{section.title}</span>
                                <svg viewBox="0 0 16 16" className="help-caret" aria-hidden="true">
                                    <path d="M4 6l4 4 4-4" />
                                </svg>
                            </summary>
                            <div className="help-body">
                                {section.blocks.map((b, i) => (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: blocos fixos da seção
                                    <Block key={i} block={b} />
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
            )}

            {faq.length > 0 && (
                <section className="help-faq" aria-labelledby="help-faq-title">
                    <h2 id="help-faq-title" className="bc-caption">
                        {tx.faq}
                    </h2>
                    <div className="help-list">
                        {faq.map(({ faq: f }) => (
                            <details
                                key={`${f.q}${searching ? '-q' : ''}`}
                                className="panel help-section faq"
                                open={searching || undefined}
                            >
                                <summary>
                                    <span>{f.q}</span>
                                    <svg viewBox="0 0 16 16" className="help-caret" aria-hidden="true">
                                        <path d="M4 6l4 4 4-4" />
                                    </svg>
                                </summary>
                                <div className="help-body">
                                    {f.a.map((b, i) => (
                                        // biome-ignore lint/suspicious/noArrayIndexKey: blocos fixos da resposta
                                        <Block key={i} block={b} />
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
