import { useEffect } from 'react';
import { setVolume } from './game/audio';
import { useGame } from './store/game-store';
import { Credits } from './ui/screens/Credits';
import { Draft } from './ui/screens/Draft';
import { Home } from './ui/screens/Home';
import { Lineup } from './ui/screens/Lineup';
import { Match } from './ui/screens/Match';
import { Result } from './ui/screens/Result';
import { Settings } from './ui/screens/Settings';

export default function App() {
    const { screen, go, settings } = useGame();

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

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
            {screen === 'settings' && <Settings />}
            {screen === 'credits' && <Credits />}
        </div>
    );
}
