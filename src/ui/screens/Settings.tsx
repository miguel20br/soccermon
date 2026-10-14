import { useState } from 'react';
import { cloudEnabled, deleteAccount, useCloud } from '../../cloud/cloud';
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
            <AccountSettings />
            <p className="muted center">
                <a href="privacidade.html" target="_blank" rel="noopener">
                    Privacidade e termos
                </a>
            </p>
        </div>
    );
}

/** Conta Google: apagar tudo da nuvem (LGPD). Só aparece logado. */
function AccountSettings() {
    const user = useCloud((s) => s.user);
    const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle');
    if (!cloudEnabled || (!user && step !== 'done')) return null;
    const remove = () => {
        setStep('busy');
        deleteAccount().then(
            () => setStep('done'),
            () => setStep('error'),
        );
    };
    return (
        <section className="panel setting-card">
            <h2>Conta</h2>
            {step === 'done' ? (
                <p>Conta apagada. Seu progresso continua só neste aparelho, como visitante.</p>
            ) : (
                <>
                    <p>
                        Conectado como <b>{user?.name}</b>. Apagar a conta remove o login, o perfil e o save da nuvem de
                        vez. O jogo neste aparelho continua, como visitante.
                    </p>
                    {step === 'confirm' || step === 'busy' ? (
                        <div className="row">
                            <button type="button" className="btn primary" disabled={step === 'busy'} onClick={remove}>
                                {step === 'busy' ? 'Apagando…' : 'Sim, apagar minha conta'}
                            </button>
                            <button
                                type="button"
                                className="btn ghost"
                                disabled={step === 'busy'}
                                onClick={() => setStep('idle')}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div className="row">
                            <button type="button" className="btn ghost small" onClick={() => setStep('confirm')}>
                                Apagar minha conta
                            </button>
                            {step === 'error' && (
                                <span className="error-text">Não deu para apagar agora. Tente de novo.</span>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
