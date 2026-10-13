import { playCry, playSfx, setVolume } from '../../game/audio';
import { useGame } from '../../store/game-store';

export function Settings() {
    const { settings, updateSettings, go } = useGame();
    return (
        <div className="panel prose">
            <h2>Configurações</h2>
            <div className="setting">
                <h3>Gritos dos Pokémon</h3>
                <div className="row">
                    <button
                        type="button"
                        className={`btn small${settings.cries === 'legacy' ? ' active' : ''}`}
                        onClick={() => {
                            updateSettings({ cries: 'legacy' });
                            playCry(25, 'legacy');
                        }}
                    >
                        Clássicos 8-bit (Gen 1)
                    </button>
                    <button
                        type="button"
                        className={`btn small${settings.cries === 'latest' ? ' active' : ''}`}
                        onClick={() => {
                            updateSettings({ cries: 'latest' });
                            playCry(25, 'latest');
                        }}
                    >
                        Modernos
                    </button>
                </div>
            </div>
            <div className="setting">
                <h3>Volume: {Math.round(settings.volume * 100)}%</h3>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.volume}
                    onChange={(e) => {
                        const volume = Number(e.target.value);
                        updateSettings({ volume });
                        setVolume(volume);
                    }}
                    onMouseUp={() => playSfx('kick')}
                />
            </div>
            <button type="button" className="btn" onClick={() => go('home')}>
                Voltar
            </button>
        </div>
    );
}
