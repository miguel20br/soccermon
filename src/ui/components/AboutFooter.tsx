import { useCallback, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { openPage } from '../doors';
import { Sheet } from '../kit/Sheet';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { readCount, writeCount } from '../local-count';
import type { PatchNotes } from '../patch-notes';
import { NewDot } from '../profile/news';
import { HudIcon } from './MatchHud';
import { MenuIcon } from './MenuIcon';

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

/** "0.9.27" vira 9027: a última versão aberta nas Novidades fica guardada como número (`local-count`). */
const versionNum = (v: string) => v.split('.').reduce((a, x) => a * 1000 + (Number(x) || 0), 0);
const NEWS_SEEN = 'soccermon.newsSeen';

/**
 * Novidades no canto de cima (TopActions), em toda tela de menu: abre as notas de versão; o pontinho acende enquanto
 * a versão nova não foi aberta neste navegador (o Miguel, 30/10: nas Configurações ficava estranho).
 */
export function NewsButton() {
    const { t, d, lang } = useT();
    // as notas (~50 KB gzip) só baixam ao abrir; o botão e o pontinho só precisam da versão (a 1ª das notas, testado)
    const [mod, setMod] = useState<typeof import('../patch-notes') | null>(null);
    const notes = mod?.patchNotes(lang) ?? [];
    const latest = versionNum(__APP_VERSION__);
    const [seen, setSeen] = useState(() => readCount(NEWS_SEEN));
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const load = () => {
        if (!mod) void import('../patch-notes').then(setMod);
    };
    return (
        <>
            <button
                type="button"
                className="help-fab news-fab"
                aria-label={`${d.home.tiles.news} v${__APP_VERSION__}`}
                title={`${d.home.tiles.news} v${__APP_VERSION__}`}
                onPointerDown={load}
                onClick={() => {
                    load();
                    setOpen(true);
                    setSeen(latest);
                    writeCount(NEWS_SEEN, latest);
                }}
            >
                <MenuIcon kind="news" />
                {/* sem onde guardar (aba anônima): sem pontinho, ele não apagaria nunca */}
                <NewDot on={seen !== null && seen < latest} />
            </button>
            {/* abre quando as notas chegam: a folha não nasce vazia */}
            <Sheet open={open && !!mod} onClose={close} title={t('home.news')} className="patch-notes">
                {notes.map((n, i) => (
                    <PatchVersion key={n.version} n={n} latest={i === 0} lang={lang} />
                ))}
            </Sheet>
        </>
    );
}

/**
 * O rodapé do jogo: Ajuda, Créditos, Feedback, Privacidade, GitHub, o idioma e o aviso de direitos (as Novidades
 * moram no canto de cima, `NewsButton`). Na Home de lista fica no fim da tela; com os ambientes, no fim das
 * Configurações (`lang={false}`: lá o idioma já tem o seu grupo).
 */
export function AboutFooter({ lang: withLang = true }: { lang?: boolean }) {
    const { t, d } = useT();
    return (
        <>
            <footer className="home-footer">
                <nav className="footer-links" aria-label={t('home.footerAria')}>
                    <button type="button" className="link-btn" onClick={() => openPage('help')}>
                        {d.home.tiles.help}
                    </button>
                    <button type="button" className="link-btn" onClick={() => openPage('credits')}>
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
