import { useState } from 'react';
import { useGame } from '../../store/game-store';

const PARADE = [1, 4, 7, 25, 133, 143, 150];

export function Home() {
    const { run, newRun, go } = useGame();
    const [teamName, setTeamName] = useState('Pallet FC');
    const canContinue = run && (run.status === 'drafting' || run.status === 'lineup');

    return (
        <div className="home">
            <div>
                <h1 className="logo">SOCCERMON</h1>
                <p className="tagline">
                    Monte seu time com os 151 de Kanto num draft “escolha 1 de 3” e dispute a Copa de Futsal contra os
                    ginásios.
                </p>
            </div>
            <div className="home-parade" aria-hidden>
                {PARADE.map((id) => (
                    <img key={id} className="pixel" src={`assets/cards/${id}.gif`} alt="" />
                ))}
            </div>
            <div className="menu panel">
                <label className="muted" htmlFor="team-name">
                    Nome do seu time
                </label>
                <input
                    id="team-name"
                    className="team-name-input"
                    value={teamName}
                    maxLength={22}
                    onChange={(e) => setTeamName(e.target.value)}
                />
                <button type="button" className="btn primary" onClick={() => newRun(teamName.trim() || 'Pallet FC')}>
                    Nova copa
                </button>
                {canContinue && (
                    <button
                        type="button"
                        className="btn yellow"
                        onClick={() => go(run.status === 'drafting' ? 'draft' : 'lineup')}
                    >
                        Continuar ({run.teamName})
                    </button>
                )}
                <div className="row" style={{ justifyContent: 'center' }}>
                    <button type="button" className="btn ghost small" onClick={() => go('settings')}>
                        Configurações
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => go('credits')}>
                        Créditos
                    </button>
                </div>
            </div>
            <p className="disclaimer">
                Fan game sem fins lucrativos, feito por fãs. Pokémon e todos os nomes, sprites e sons relacionados são ©
                Nintendo, Game Freak, Creatures Inc. e The Pokémon Company. Este projeto não é afiliado nem endossado
                por eles.
            </p>
        </div>
    );
}
