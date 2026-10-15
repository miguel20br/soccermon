import { useEffect, useState } from 'react';
import { setVolume } from './game/audio';
import { useGame } from './store/game-store';
import { CardModal } from './ui/components/CardModal';
import { Onboarding } from './ui/components/Onboarding';
import { runDevDemo } from './ui/dev-demo';
import { requestLeave } from './ui/leave-guard';
import { CardGallery } from './ui/screens/CardGallery';
import { Credits } from './ui/screens/Credits';
import { Draft } from './ui/screens/Draft';
import { Help } from './ui/screens/Help';
import { Home } from './ui/screens/Home';
import { Lineup } from './ui/screens/Lineup';
import { Match } from './ui/screens/Match';
import { MoveLab } from './ui/screens/MoveLab';
import { PositionLab } from './ui/screens/PositionLab';
import { Profile } from './ui/screens/Profile';
import { Result } from './ui/screens/Result';
import { Reward } from './ui/screens/Reward';
import { Settings } from './ui/screens/Settings';

export default function App() {
    const { screen, go, settings, onboarded } = useGame();
    // passo a passo de boas-vindas: só depois de o save carregar (senão aparece para quem já jogou)
    const [hydrated, setHydrated] = useState(() => useGame.persist.hasHydrated());
    useEffect(() => useGame.persist.onFinishHydration(() => setHydrated(true)), []);
    // ?demo=crash (só no dev): quebra a renderização para conferir a tela do ErrorBoundary
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === 'crash') {
        throw new Error('Teste do aviso de erro (?demo=crash)');
    }
    // laboratórios: ?lab=golpes (animação de todos os golpes, público); ?lab=posicoes e ?cards=1 só no dev
    const [lab, setLab] = useState(() => {
        const q = new URLSearchParams(window.location.search).get('lab');
        return q === 'golpes' || (import.meta.env.DEV && q === 'posicoes') ? q : null;
    });
    const [cards, setCards] = useState(
        () => import.meta.env.DEV && new URLSearchParams(window.location.search).get('cards') === '1',
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    useEffect(() => {
        // espera o save do IndexedDB carregar antes de montar a demo
        const unsub = useGame.persist.onFinishHydration(() => runDevDemo());
        if (useGame.persist.hasHydrated()) runDevDemo();
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

    if (lab === 'posicoes' || lab === 'golpes') {
        const exit = () => {
            window.history.replaceState(null, '', window.location.pathname);
            setLab(null);
        };
        return (
            <div className="app">{lab === 'golpes' ? <MoveLab onExit={exit} /> : <PositionLab onExit={exit} />}</div>
        );
    }

    return (
        <div className="app">
            {screen !== 'home' && (
                <header className="topbar">
                    <button
                        type="button"
                        className="brand"
                        onClick={() => requestLeave(() => go('home'))}
                        aria-label="Voltar ao início"
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
            <CardModal />
            {hydrated && !onboarded && screen === 'home' && <Onboarding />}
        </div>
    );
}
