import { useEffect } from 'react';
import { setVolume } from './game/audio';
import { useGame } from './store/game-store';
import { runDevDemo } from './ui/dev-demo';
import { Credits } from './ui/screens/Credits';
import { Draft } from './ui/screens/Draft';
import { Home } from './ui/screens/Home';
import { Lineup } from './ui/screens/Lineup';
import { Match } from './ui/screens/Match';
import { Result } from './ui/screens/Result';
import { Reward } from './ui/screens/Reward';
import { Settings } from './ui/screens/Settings';

export default function App() {
    const { screen, go, settings } = useGame();

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    useEffect(() => {
        // espera o save do IndexedDB carregar antes de montar a demo
        const unsub = useGame.persist.onFinishHydration(() => runDevDemo());
        if (useGame.persist.hasHydrated()) runDevDemo();
        return unsub;
    }, []);

    return (
        <div className="app">
            {screen !== 'home' && (
                <header className="topbar">
                    <button type="button" className="brand" onClick={() => go('home')} aria-label="Voltar ao início">
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
        </div>
    );
}
