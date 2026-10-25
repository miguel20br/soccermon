import { lazy, Suspense, useEffect, useState } from 'react';
import { setVolume } from './game/audio';
import { useT } from './i18n/react';
import { duel } from './net/session';
import { preloadGame } from './PhaserGame';
import { type Screen, useGame } from './store/game-store';
import { readAmbientes } from './ui/ambientes/nav';
import { backTarget, installBackNav } from './ui/back-nav';
import { AccountLink } from './ui/components/AccountLink';
import { CardModal } from './ui/components/CardModal';
import { LogoHits } from './ui/components/LogoHits';
import { Onboarding } from './ui/components/Onboarding';
import { TopActions } from './ui/components/TopActions';
import { UnlockNotice } from './ui/components/UnlockNotice';
import { runDevDemo } from './ui/dev-demo';
import { Duel, duelCodeFromUrl } from './ui/duel/Duel';
import { requestBack, requestLeave } from './ui/leave-guard';
import { FriendInvite, FriendVitrine } from './ui/profile/FriendsTab';
import { PlayerCardModal } from './ui/profile/PlayerCard';
import { CardGallery } from './ui/screens/CardGallery';
import { Collection } from './ui/screens/Collection';
import { Credits } from './ui/screens/Credits';
import { CupMap, EventScreen, GroupScreen, Training } from './ui/screens/CupMap';
import { Daily } from './ui/screens/Daily';
import { Draft } from './ui/screens/Draft';
import { Help } from './ui/screens/Help';
import { Home } from './ui/screens/Home';
import { Liga } from './ui/screens/Liga';
import { Lineup } from './ui/screens/Lineup';
import { Match } from './ui/screens/Match';
import { PositionLab } from './ui/screens/PositionLab';
import { Profile } from './ui/screens/Profile';
import { Result } from './ui/screens/Result';
import { Reward } from './ui/screens/Reward';
import { Settings } from './ui/screens/Settings';
import { Shop } from './ui/screens/Shop';
import { TrophyRoom } from './ui/screens/TrophyRoom';

// Movedex (?lab=golpes) usa o Phaser: vem num pedaço à parte, como a partida
/** Telas de menu: o topo tem o canto de Configurações e Perfil (partida, draft e Duelo não, pra ninguém sair sem querer). */
const MENU_SCREENS: Screen[] = ['settings', 'credits', 'help', 'profile', 'collection', 'trophies', 'daily', 'liga'];

const RoomLab = lazy(() => import('./ui/screens/RoomLab').then((m) => ({ default: m.RoomLab })));
const MoveLab = lazy(() => import('./ui/screens/MoveLab').then((m) => ({ default: m.MoveLab })));
const VersusLab = lazy(() => import('./ui/components/VersusLab').then((m) => ({ default: m.VersusLab })));
const CourtLab = lazy(() => import('./ui/screens/CourtLab').then((m) => ({ default: m.CourtLab })));
const EmoteLab = lazy(() => import('./ui/duel/EmoteLab').then((m) => ({ default: m.EmoteLab })));
const IconLab = lazy(() => import('./ui/screens/IconLab').then((m) => ({ default: m.IconLab })));
const StoryLab = lazy(() => import('./ui/screens/StoryLab').then((m) => ({ default: m.StoryLab })));
// a Home (navegação por ambientes, src/ui/ambientes): pedaço à parte, baixa junto com o save; `?lab=off` = Home de lista
const Ambientes = lazy(() => import('./ui/ambientes/Ambientes').then((m) => ({ default: m.Ambientes })));

/** Sai da tela atual (para a Home, ou `to`); sair do duelo guarda a sala (dá pra voltar pelo link). */
function leaveScreen(screen: Screen, to: Screen = 'home') {
    if (screen === 'duel') {
        duel.leave();
        window.history.replaceState(window.history.state, '', window.location.pathname);
        try {
            sessionStorage.removeItem('soccermon-duel-pending');
        } catch {
            // nada
        }
    }
    useGame.getState().go(to);
}

export default function App() {
    const { screen, settings, tour } = useGame();
    // idioma: o App redesenha na troca e leva junto as telas que usam t() fora de hook
    const { t } = useT();
    // passo a passo de boas-vindas: só depois de o save carregar (senão aparece para quem já jogou)
    const [hydrated, setHydrated] = useState(() => useGame.persist.hasHydrated());
    useEffect(() => {
        const off = useGame.persist.onFinishHydration(() => setHydrated(true));
        // o save pode ter terminado de carregar entre o primeiro render e este efeito
        if (useGame.persist.hasHydrated()) setHydrated(true);
        return off;
    }, []);
    // ?demo=crash (dev e prévias): quebra a renderização para conferir a tela do ErrorBoundary
    if (__SMOKE__ && new URLSearchParams(window.location.search).get('demo') === 'crash') {
        throw new Error('Teste do aviso de erro (?demo=crash)');
    }
    // laboratórios: ?lab=golpes (animação de todos os golpes, público), ?lab=emotes (emotes do Duelo sem sala, público),
    // ?lab=quadras (treinadores, falas e a quadra de cada ginásio, público); ?lab=posicoes, ?lab=icones, ?lab=cenas e ?cards=1 só no dev e nas prévias (__SMOKE__), menos
    // a revisão dos suspeitos de posição (?lab=posicoes&revisao=1), que o Miguel abre no celular
    const [lab, setLab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('lab');
        if (q === 'golpes' || q === 'emotes' || q === 'quadras') return q;
        if (__SMOKE__ && (q === 'versus' || q === 'sala' || q === 'icones' || q === 'cenas')) return q;
        return (__SMOKE__ || params.has('revisao')) && q === 'posicoes' ? q : null;
    });
    const [ambientes] = useState(readAmbientes);
    const [cards, setCards] = useState(
        () => __SMOKE__ && new URLSearchParams(window.location.search).get('cards') === '1',
    );

    // botão voltar do Android: uma entrada de guarda fora da Home; voltar = o `‹` da tela (partida pede confirmação)
    useEffect(
        () =>
            installBackNav(
                () => useGame.getState().screen,
                (cb) => useGame.subscribe((s, p) => s.screen !== p.screen && cb()),
                (screen) => requestBack(() => leaveScreen(screen, backTarget(screen) ?? 'home')),
            ),
        [],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    // com a primeira tela já carregada (imagens inclusive), baixa a partida (Phaser) em segundo plano: o "Jogar" não
    // espera a rede e o pedaço não disputa banda com a Home
    useEffect(() => {
        const idle = () =>
            (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(preloadGame);
        if (document.readyState === 'complete') idle();
        else window.addEventListener('load', idle, { once: true });
        return () => window.removeEventListener('load', idle);
    }, []);

    // tela nova abre no topo (sem isso a partida abria rolada lá embaixo, onde ficava o "Jogar")
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda a cada troca de tela
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [screen]);

    useEffect(() => {
        // espera o save do IndexedDB carregar antes de montar a demo
        const unsub = useGame.persist.onFinishHydration(() => runDevDemo());
        if (useGame.persist.hasHydrated()) runDevDemo();
        return unsub;
    }, []);

    // link de duelo (?duelo=K7M2QX): abre a sala depois que o save carrega
    useEffect(() => {
        const open = () => {
            if (duelCodeFromUrl()) useGame.getState().go('duel');
        };
        const unsub = useGame.persist.onFinishHydration(open);
        if (useGame.persist.hasHydrated()) open();
        return unsub;
    }, []);

    if (cards) {
        const exit = () => {
            window.history.replaceState(null, '', window.location.pathname);
            setCards(false);
        };
        return (
            <div className="app">
                <CardGallery onExit={exit} />
                <CardModal />
            </div>
        );
    }

    if (lab) {
        const exit = () => {
            window.history.replaceState(null, '', window.location.pathname);
            setLab(null);
        };
        return (
            <div className="app">
                {lab === 'golpes' ||
                lab === 'emotes' ||
                lab === 'versus' ||
                lab === 'quadras' ||
                lab === 'sala' ||
                lab === 'icones' ||
                lab === 'cenas' ? (
                    <Suspense fallback={<p className="muted">{t('common.ui.loading')}</p>}>
                        {lab === 'golpes' ? (
                            <MoveLab onExit={exit} />
                        ) : lab === 'emotes' ? (
                            <EmoteLab onExit={exit} />
                        ) : lab === 'quadras' ? (
                            <CourtLab onExit={exit} />
                        ) : lab === 'sala' ? (
                            <RoomLab onExit={exit} />
                        ) : lab === 'icones' ? (
                            <IconLab onExit={exit} />
                        ) : lab === 'cenas' ? (
                            <StoryLab onExit={exit} />
                        ) : (
                            <VersusLab onExit={exit} />
                        )}
                    </Suspense>
                ) : (
                    <PositionLab onExit={exit} />
                )}
                <PlayerCardModal />
                <CardModal />
            </div>
        );
    }

    return (
        <div className="app">
            {screen !== 'home' && (
                <header className={`topbar${MENU_SCREENS.includes(screen) ? ' topbar-menu' : ''}`}>
                    <button
                        type="button"
                        className="brand"
                        onClick={() => requestLeave(() => leaveScreen(screen))}
                        aria-label={t('common.ui.backHome')}
                    >
                        <span className="brand-logo logo-blink">
                            <img src="assets/ui/logo.svg" alt="" width="1441" height="300" />
                            <LogoHits />
                        </span>
                        {/* na partida o logo inteiro ficava ilegível (~40 px): lá vai o símbolo, no mínimo de 24 px do guia */}
                        <img className="brand-symbol" src="assets/ui/simbolo.svg" alt="" width="28" height="28" />
                    </button>
                    {/* telas de menu: Configurações e Perfil no canto, como na Home (na partida e no draft, não) */}
                    {MENU_SCREENS.includes(screen) && <TopActions />}
                </header>
            )}
            {screen === 'home' &&
                (ambientes ? (
                    <Suspense fallback={null}>
                        <Ambientes />
                    </Suspense>
                ) : (
                    <Home />
                ))}
            {screen === 'draft' && <Draft />}
            {screen === 'lineup' && <Lineup />}
            {screen === 'match' && <Match />}
            {screen === 'result' && <Result />}
            {screen === 'reward' && <Reward />}
            {screen === 'shop' && <Shop />}
            {screen === 'map' && <CupMap />}
            {screen === 'treino' && <Training />}
            {screen === 'event' && <EventScreen />}
            {screen === 'group' && <GroupScreen />}
            {screen === 'settings' && <Settings />}
            {screen === 'credits' && <Credits />}
            {screen === 'profile' && <Profile />}
            {screen === 'help' && <Help />}
            {screen === 'duel' && <Duel />}
            {screen === 'daily' && <Daily />}
            {screen === 'liga' && <Liga />}
            {screen === 'liga-match' && <Match liga />}
            {screen === 'trophies' && <TrophyRoom />}
            {screen === 'collection' && <Collection />}
            <PlayerCardModal />
            <CardModal />
            <FriendInvite />
            <FriendVitrine />
            <AccountLink />
            <UnlockNotice />
            {hydrated && tour && screen === 'home' && <Onboarding />}
        </div>
    );
}
