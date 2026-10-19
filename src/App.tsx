import { lazy, Suspense, useEffect, useState } from 'react';
import { setVolume } from './game/audio';
import { useT } from './i18n/react';
import { duel } from './net/session';
import { preloadGame } from './PhaserGame';
import { useGame } from './store/game-store';
import { AccountLink } from './ui/components/AccountLink';
import { CardModal } from './ui/components/CardModal';
import { Onboarding } from './ui/components/Onboarding';
import { UnlockNotice } from './ui/components/UnlockNotice';
import { runDevDemo } from './ui/dev-demo';
import { Duel, duelCodeFromUrl } from './ui/duel/Duel';
import { requestLeave } from './ui/leave-guard';
import { CardGallery } from './ui/screens/CardGallery';
import { Credits } from './ui/screens/Credits';
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

// Movedex (?lab=golpes) usa o Phaser: vem num pedaço à parte, como a partida
const MoveLab = lazy(() => import('./ui/screens/MoveLab').then((m) => ({ default: m.MoveLab })));
const EmoteLab = lazy(() => import('./ui/duel/EmoteLab').then((m) => ({ default: m.EmoteLab })));

export default function App() {
    const { screen, go, settings, onboarded } = useGame();
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
    // ?demo=crash (só no dev): quebra a renderização para conferir a tela do ErrorBoundary
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === 'crash') {
        throw new Error('Teste do aviso de erro (?demo=crash)');
    }
    // laboratórios: ?lab=golpes (animação de todos os golpes, público), ?lab=emotes (emotes do Duelo sem sala, público); ?lab=posicoes e ?cards=1 só no dev, menos
    // a revisão dos suspeitos de posição (?lab=posicoes&revisao=1), que o Miguel abre no celular
    const [lab, setLab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('lab');
        if (q === 'golpes' || q === 'emotes') return q;
        return (import.meta.env.DEV || params.has('revisao')) && q === 'posicoes' ? q : null;
    });
    const [cards, setCards] = useState(
        () => import.meta.env.DEV && new URLSearchParams(window.location.search).get('cards') === '1',
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
                {lab === 'golpes' || lab === 'emotes' ? (
                    <Suspense fallback={<p className="muted">{t('common.ui.loading')}</p>}>
                        {lab === 'golpes' ? <MoveLab onExit={exit} /> : <EmoteLab onExit={exit} />}
                    </Suspense>
                ) : (
                    <PositionLab onExit={exit} />
                )}
            </div>
        );
    }

    return (
        <div className="app">
            {screen !== 'home' && (
                <header className="topbar">
                    <button
                        type="button"
                        className="brand"
                        onClick={() =>
                            requestLeave(() => {
                                // sair do duelo pelo logo: a sala fica guardada (dá pra voltar pelo link)
                                if (screen === 'duel') {
                                    duel.leave();
                                    window.history.replaceState(null, '', window.location.pathname);
                                    try {
                                        sessionStorage.removeItem('soccermon-duel-pending');
                                    } catch {
                                        // nada
                                    }
                                }
                                go('home');
                            })
                        }
                        aria-label={t('common.ui.backHome')}
                    >
                        <img className="pixel" src="assets/ui/poke-ball.png" alt="" />
                        <span>SOCCERMON</span>
                    </button>
                </header>
            )}
            {screen === 'home' && <Home />}
            {screen === 'draft' && <Draft />}
            {screen === 'lineup' && <Lineup />}
            {screen === 'match' && <Match />}
            {screen === 'result' && <Result />}
            {screen === 'reward' && <Reward />}
            {screen === 'settings' && <Settings />}
            {screen === 'credits' && <Credits />}
            {screen === 'profile' && <Profile />}
            {screen === 'help' && <Help />}
            {screen === 'duel' && <Duel />}
            {screen === 'daily' && <Daily />}
            {screen === 'liga' && <Liga />}
            {screen === 'liga-match' && <Match liga />}
            <CardModal />
            <AccountLink />
            <UnlockNotice />
            {hydrated && !onboarded && screen === 'home' && <Onboarding />}
        </div>
    );
}
