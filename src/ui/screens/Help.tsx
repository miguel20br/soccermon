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
import { HudIcon } from '../components/MatchHud';

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

/** Ajuda: como jogar, todas as mecânicas (com busca) e perguntas frequentes. */
export function Help() {
    const go = useGame((s) => s.go);
    const setTour = useGame((s) => s.setTour);
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
    const searching = terms.length > 0;
    const nothing = searching && !sections.length && !faq.length;

    return (
        <div className="menu-screen help-screen">
            <MenuHead title={tx.title} icon="help" onBack={() => go('home')} />

            <div className="help-actions">
                <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                        setTour(true);
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

            <section className="help-coach" aria-labelledby="help-coach-title">
                <h2 id="help-coach-title" className="bc-lbl">
                    {c.title}
                </h2>
                <div className="help-actions">
                    {COACH_REPLAY.map((id) => (
                        <button
                            key={id}
                            type="button"
                            className="btn outline small"
                            disabled={redone.includes(id)}
                            onClick={() => replayCoach(id)}
                        >
                            {redone.includes(id) ? c.done : (c as Record<string, string>)[id]}
                        </button>
                    ))}
                </div>
                <small className="muted">{c.hint}</small>
            </section>

            <label className="help-search">
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
                                <HudIcon kind="down" className="help-caret" />
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
                                    <HudIcon kind="down" className="help-caret" />
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
