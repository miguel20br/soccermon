import { useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { type PatchNotes, patchNotes } from '../patch-notes';
import { HudIcon } from './MatchHud';

/** Troca rápida de idioma no rodapé (as Configurações também têm). */
function LangToggle() {
    const { lang, t } = useT();
    const updateSettings = useGame((s) => s.updateSettings);
    return (
        <fieldset className="lang-toggle bc-seg" aria-label={t('home.langAria')}>
            {(['pt', 'en'] as const).map((l) => (
                <button
                    key={l}
                    type="button"
                    className={l === lang ? 'on' : ''}
                    aria-pressed={l === lang}
                    lang={l === 'pt' ? 'pt-BR' : 'en'}
                    title={l === 'pt' ? 'Português (Brasil)' : 'English'}
                    onClick={() => updateSettings({ lang: l })}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </fieldset>
    );
}

function PatchBody({ n }: { n: PatchNotes }) {
    return n.sections.map((sec) => (
        <div key={sec.title}>
            <h3>{sec.title}</h3>
            <ul>
                {sec.lines.map((l) => (
                    <li key={l}>{l}</li>
                ))}
            </ul>
        </div>
    ));
}

/** A mais nova vem aberta e em destaque; as antigas ficam recolhidas (versão, título, data). */
function PatchVersion({ n, latest, lang }: { n: PatchNotes; latest: boolean; lang: 'pt' | 'en' }) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const date = new Date(`${n.date}T12:00:00Z`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
    if (latest) {
        return (
            <section className="patch-version patch-latest">
                <p className="patch-meta">
                    <span className="bc-tag">{t('home.latest')}</span>
                    <time dateTime={n.date}>{date}</time>
                </p>
                <h2 className="bc-caption">{t('home.version', { v: n.version, title: n.title })}</h2>
                <PatchBody n={n} />
            </section>
        );
    }
    return (
        <section className={`patch-version patch-old${open ? ' open' : ''}`}>
            <button type="button" className="patch-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
                <span className="patch-old-title">{t('home.version', { v: n.version, title: n.title })}</span>
                <time dateTime={n.date}>{date}</time>
                <HudIcon kind="down" />
            </button>
            <div className="patch-fold" inert={!open}>
                <div>
                    <PatchBody n={n} />
                </div>
            </div>
        </section>
    );
}

/**
 * O rodapé do jogo: Novidades (abre as notas de versão), Ajuda, Créditos, Feedback, Privacidade, GitHub, o idioma e o
 * aviso de direitos. Na Home de lista fica no fim da tela; com os ambientes, no fim das Configurações (`lang={false}`:
 * lá o idioma já tem o seu grupo).
 */
export function AboutFooter({ lang: withLang = true }: { lang?: boolean }) {
    const { t, d, lang } = useT();
    const go = useGame((s) => s.go);
    const notes = patchNotes(lang);
    const [notesOpen, setNotesOpen] = useState(false);
    useEffect(() => {
        if (!notesOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNotesOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [notesOpen]);
    return (
        <>
            {notesOpen && (
                // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; o botão fecha pelo teclado
                <div className="modal-backdrop" onClick={() => setNotesOpen(false)} role="presentation">
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
                    <div
                        className="modal panel patch-notes"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('home.news')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setNotesOpen(false)}
                            aria-label={t('common.ui.close')}
                            // biome-ignore lint/a11y/noAutofocus: o foco vai para dentro da janela que acabou de abrir
                            autoFocus
                        >
                            <HudIcon kind="close" />
                        </button>
                        {notes.map((n, i) => (
                            <PatchVersion key={n.version} n={n} latest={i === 0} lang={lang} />
                        ))}
                    </div>
                </div>
            )}
            <footer className="home-footer">
                <nav className="footer-links" aria-label={t('home.footerAria')}>
                    <button type="button" className="link-btn" onClick={() => setNotesOpen(true)}>
                        {d.home.tiles.news} <em className="tile-badge">v{notes[0].version}</em>
                    </button>
                    <button type="button" className="link-btn" onClick={() => go('help')}>
                        {d.home.tiles.help}
                    </button>
                    <button type="button" className="link-btn" onClick={() => go('credits')}>
                        {d.home.tiles.credits}
                    </button>
                    <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                        {d.home.tiles.feedback}
                    </a>
                    <a href={privacyUrl()} target="_blank" rel="noopener">
                        {t('home.privacy')}
                    </a>
                    <a href="https://github.com/miguel20br/soccermon" target="_blank" rel="noopener">
                        {t('home.github')}
                    </a>
                    {import.meta.env.DEV && (
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => {
                                window.location.search = '?cards=1';
                            }}
                        >
                            {d.home.tiles.cards}
                        </button>
                    )}
                </nav>
                {/* fora da linha dos links: ao trocar o idioma os links mudam de largura e o botão ficava pulando */}
                {withLang && <LangToggle />}
                <p className="disclaimer">{t('home.disclaimer', { v: __APP_VERSION__.replace(/\.0$/, '') })}</p>
            </footer>
        </>
    );
}
