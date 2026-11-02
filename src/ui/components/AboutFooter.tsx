import { useCallback, useEffect, useState } from 'react';
import { reloadForNewVersion } from '../../chunk-reload';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { openPage } from '../doors';
import { Sheet } from '../kit/Sheet';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { writeCount } from '../local-count';
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

const patchDate = (n: PatchNotes, lang: 'pt' | 'en') =>
    new Date(`${n.date}T12:00:00Z`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });

/**
 * O cartaz da versão nova (cara-de-jogo.md, decisão 15): o nome grande e 4 destaques (o 1º item de cada seção);
 * "Ver tudo" e "Versões antigas" trocam a página dentro da mesma folha.
 */
function PatchPoster({ n, lang, go }: { n: PatchNotes; lang: 'pt' | 'en'; go: (page: string) => void }) {
    const { t } = useT();
    return (
        <section className="patch-poster">
            <div className="patch-poster-art" aria-hidden>
                <img src="assets/ui/simbolo.svg" alt="" width="64" height="64" />
            </div>
            <p className="patch-meta">
                <span className="bc-tag">{t('home.latest')}</span>
                <span>v{n.version}</span>
                <time dateTime={n.date}>{patchDate(n, lang)}</time>
            </p>
            <h2 className="patch-poster-title">{n.title}</h2>
            <ol className="patch-hl">
                {n.sections.slice(0, 4).map((sec) => (
                    <li key={sec.title}>
                        <HudIcon kind="max" />
                        <span>
                            <b>{sec.title}</b>
                            <small>{sec.lines[0]}</small>
                        </span>
                    </li>
                ))}
            </ol>
            <div className="patch-poster-actions">
                {/* o que a pessoa quer (ver a versão inteira) é o azul; as antigas, o fantasma */}
                <button type="button" className="btn ghost" onClick={() => go('old')}>
                    {t('home.newsOld')}
                </button>
                <button type="button" className="btn" onClick={() => go(n.version)}>
                    {t('home.newsAll')}
                </button>
            </div>
        </section>
    );
}

/** Uma versão inteira (do cartaz ou da lista das antigas). */
function PatchVersion({ n, lang }: { n: PatchNotes; lang: 'pt' | 'en' }) {
    const { t } = useT();
    return (
        <section className="patch-version">
            <p className="patch-meta">
                <time dateTime={n.date}>{patchDate(n, lang)}</time>
            </p>
            <h2 className="bc-caption">{t('home.version', { v: n.version, title: n.title })}</h2>
            <PatchBody n={n} />
        </section>
    );
}

/** "0.9.27" vira 9027: a última versão aberta nas Novidades fica guardada como número (`local-count`). */
const versionNum = (v: string) => v.split('.').reduce((a, x) => a * 1000 + (Number(x) || 0), 0);
const NEWS_SEEN = 'soccermon.newsSeen';
/** Última versão aberta; sem a chave (quem nunca abriu) é 0 e o pontinho acende; null só sem onde guardar. */
export function readSeen(): number | null {
    try {
        return Number(localStorage.getItem(NEWS_SEEN) ?? 0) || 0;
    } catch {
        return null;
    }
}

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
    const [seen, setSeen] = useState(readSeen);
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState('poster');
    const close = useCallback(() => setOpen(false), []);
    // a versão conta como vista quando as notas abrem de verdade (falhou o download, o pontinho fica)
    useEffect(() => {
        if (!open || !mod) return;
        setSeen(latest);
        writeCount(NEWS_SEEN, latest);
    }, [open, mod, latest]);
    // sem rede ou com o pedaço de uma versão velha (404), recarrega pra versão nova como os outros pedaços preguiçosos
    const load = () => {
        if (!mod)
            void import('../patch-notes').then(setMod, () => {
                setOpen(false);
                void reloadForNewVersion();
            });
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
                    setPage('poster');
                    setOpen(true);
                }}
            >
                <MenuIcon kind="news" />
                {/* sem onde guardar (aba anônima): sem pontinho, ele não apagaria nunca */}
                <NewDot on={seen !== null && seen < latest} />
            </button>
            {/* abre quando as notas chegam: a folha não nasce vazia */}
            <Sheet open={open && !!mod} onClose={close} title={t('home.news')} className="patch-notes">
                {/* uma página por vez, entrando com fade (nada teleporta) */}
                <div key={page} className="patch-page">
                    {page !== 'poster' && (
                        <button
                            type="button"
                            className="btn small ghost patch-back"
                            onClick={() => setPage(page === 'old' || page === notes[0]?.version ? 'poster' : 'old')}
                        >
                            <HudIcon kind="prev" />
                            {t('common.ui.back')}
                        </button>
                    )}
                    {page === 'poster' && notes[0] && <PatchPoster n={notes[0]} lang={lang} go={setPage} />}
                    {page === 'old' && (
                        <ul className="patch-old-list">
                            {notes.slice(1).map((n) => (
                                <li key={n.version}>
                                    <button type="button" className="patch-toggle" onClick={() => setPage(n.version)}>
                                        <span className="patch-old-title">
                                            {t('home.version', { v: n.version, title: n.title })}
                                        </span>
                                        <time dateTime={n.date}>{patchDate(n, lang)}</time>
                                        <HudIcon kind="next" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {notes
                        .filter((n) => n.version === page)
                        .map((n) => (
                            <PatchVersion key={n.version} n={n} lang={lang} />
                        ))}
                </div>
            </Sheet>
        </>
    );
}

/**
 * O rodapé do jogo: Ajuda, Créditos, Feedback, Privacidade, GitHub, o idioma e o aviso de direitos (as Novidades
 * moram no canto de cima, `NewsButton`). Na Home de lista fica no fim da tela; com os ambientes, no fim dos Créditos
 * (`lang={false}`: o idioma mora nas Configurações).
 */
export function AboutFooter({ lang: withLang = true }: { lang?: boolean }) {
    const { t, d } = useT();
    const inCredits = useGame((s) => s.screen === 'credits');
    return (
        <>
            <footer className="home-footer">
                <nav className="footer-links" aria-label={t('home.footerAria')}>
                    <button type="button" className="link-btn" onClick={() => openPage('help')}>
                        {d.home.tiles.help}
                    </button>
                    {!inCredits && (
                        <button type="button" className="link-btn" onClick={() => openPage('credits')}>
                            {d.home.tiles.credits}
                        </button>
                    )}
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
