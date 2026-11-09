import { useCallback, useEffect, useState } from 'react';
import { reloadForNewVersion } from '../../chunk-reload';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { openPage } from '../doors';
import { Sheet } from '../kit/Sheet';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { writeCount } from '../local-count';
import { activeNews, unseenNews, withSeen } from '../news';
import { NewDot } from '../profile/news';
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
 * Novidades no canto de cima (TopActions), em toda tela de menu: abre o feed (as Notícias em carrossel e as notas de
 * versão, `NewsFeed`). O pontinho acende enquanto a versão nova não foi aberta neste navegador (o Miguel, 30/10: nas
 * Configurações ficava estranho) ou há cartão das Notícias que o save ainda não viu (`Profile.newsSeen`).
 */
export function NewsButton() {
    const { t, d } = useT();
    // o feed e as notas (~50 KB gzip) só baixam ao abrir; o botão e o pontinho só precisam da versão (a 1ª das notas,
    // testado) e da lista leve das Notícias
    const [mod, setMod] = useState<typeof import('./NewsFeed') | null>(null);
    const latest = versionNum(__APP_VERSION__);
    // save novo (nada visto ainda) nasce com a versão atual lida: o jogador do primeiro minuto não tem novidade
    const fresh = useGame((s) => Object.keys(s.dex).length === 0);
    const [seen, setSeen] = useState(() => {
        const v = readSeen();
        if (v === 0 && fresh && useGame.persist.hasHydrated()) {
            writeCount(NEWS_SEEN, latest);
            return latest;
        }
        return v;
    });
    const newsSeen = useGame((s) => s.profile.newsSeen);
    const unseen = unseenNews(newsSeen);
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState('feed');
    // os cartões não vistos quando a folha abriu: o selo "Nova" fica neles até fechar
    const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
    const close = useCallback(() => setOpen(false), []);
    // cada cartão conta como visto quando aparece no carrossel
    const onSeen = useCallback((id: string) => {
        const g = useGame.getState();
        if (!g.profile.newsSeen?.includes(id)) g.updateProfile({ newsSeen: withSeen(g.profile.newsSeen, [id]) });
    }, []);
    // a versão conta como vista quando as notas abrem de verdade (falhou o download, o pontinho fica)
    useEffect(() => {
        if (!open || !mod) return;
        setSeen(latest);
        writeCount(NEWS_SEEN, latest);
    }, [open, mod, latest]);
    // sem rede ou com o pedaço de uma versão velha (404), recarrega pra versão nova como os outros pedaços preguiçosos
    const load = () => {
        if (!mod)
            void import('./NewsFeed').then(setMod, () => {
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
                    setPage('feed');
                    setNewIds(new Set(unseen.map((c) => c.id)));
                    setOpen(true);
                }}
            >
                <MenuIcon kind="news" />
                {/* sem onde guardar a versão (aba anônima): só os cartões acendem (esses ficam no save) */}
                <NewDot on={(seen !== null && seen < latest) || (!fresh && unseen.length > 0)} />
            </button>
            {/* abre quando o feed chega: a folha não nasce vazia */}
            <Sheet open={open && !!mod} onClose={close} title={t('home.news')} className="patch-notes">
                {mod && (
                    <mod.NewsFeed
                        page={page}
                        setPage={setPage}
                        cards={activeNews()}
                        fresh={newIds}
                        onSeen={onSeen}
                        close={close}
                    />
                )}
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
    );
}
