import { playCry, playSfx, setVolume } from '../../game/audio';
import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';

export function Settings() {
    const { settings, updateSettings, go } = useGame();
    return (
        <div className="menu-screen">
            <MenuHead title="Configurações" icon="settings" onBack={() => go('home')} />
            <section className="panel setting-card">
                <h2>Gritos dos Pokémon</h2>
                <p>Os gritos tocam quando um Pokémon entra em campo, marca ou evolui.</p>
                <div className="segmented">
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
            </section>
            <section className="panel setting-card">
                <h2>Volume</h2>
                <div className="volume-row">
                    <input
                        aria-label="Volume"
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
                        onTouchEnd={() => playSfx('kick')}
                    />
                    <b>{Math.round(settings.volume * 100)}%</b>
                </div>
            </section>
            <section className="panel setting-card">
                <h2>Efeitos cinematográficos</h2>
                <p>Holofote e câmera lenta nos golpes, gols, defesas e bolas na trave.</p>
                <div className="segmented">
                    <button
                        type="button"
                        className={`btn small${settings.cinematic ? ' active' : ''}`}
                        onClick={() => updateSettings({ cinematic: true })}
                    >
                        Ligados
                    </button>
                    <button
                        type="button"
                        className={`btn small${!settings.cinematic ? ' active' : ''}`}
                        onClick={() => updateSettings({ cinematic: false })}
                    >
                        Desligados (jogo corrido)
                    </button>
                </div>
            </section>
        </div>
    );
}
