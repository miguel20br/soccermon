import { useState } from 'react';
import { weeklyEventType } from '../../engine/specials';
import { seedFromUrl, useGame } from '../../store/game-store';
import { TypeIcon } from '../components/TypeIcon';
import { TYPE_PT } from '../type-colors';

const PARADE = [1, 4, 7, 25, 133, 143, 150];

export function Home() {
    const { run, newRun, go, records } = useGame();
    const [teamName, setTeamName] = useState('Pallet FC');
    const challengeSeed = seedFromUrl();
    const inProgress = run && !['eliminated', 'champion'].includes(run.status);
    const resumeScreen =
        run && ['formation', 'captain', 'drafting'].includes(run.status)
            ? 'draft'
            : run?.status === 'reward'
              ? 'reward'
              : 'lineup';
    const name = () => teamName.trim() || 'Pallet FC';
    const eventType = weeklyEventType(new Date());

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
            <div className="event-banner">
                <TypeIcon type={eventType} size={28} />
                <div>
                    <b>Semana do {TYPE_PT[eventType] ?? eventType}</b>
                    <span>Cartas Evento de {TYPE_PT[eventType] ?? eventType} podem aparecer no draft.</span>
                </div>
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
                {challengeSeed && (
                    <button type="button" className="btn yellow" onClick={() => newRun(name(), challengeSeed)}>
                        Aceitar desafio ({challengeSeed})
                    </button>
                )}
                <button type="button" className="btn primary" onClick={() => newRun(name())}>
                    Nova copa
                </button>
                {inProgress && (
                    <button type="button" className="btn yellow" onClick={() => go(resumeScreen)}>
                        Continuar ({run.teamName})
                    </button>
                )}
                {records.cups > 0 && (
                    <div className="records">
                        <span>
                            <b>{records.cups}</b> copas
                        </span>
                        <span>
                            <b>{records.titles}</b> 🏆
                        </span>
                        <span>
                            <b>{records.perfect}</b> perfeitas
                        </span>
                        {(records.destaques ?? 0) > 0 && (
                            <span>
                                <b>{records.destaques}</b> destaques
                            </span>
                        )}
                        {(records.icones ?? 0) > 0 && (
                            <span>
                                <b>{records.icones}</b> ícones
                            </span>
                        )}
                    </div>
                )}
                <div className="row" style={{ justifyContent: 'center' }}>
                    <button type="button" className="btn ghost small" onClick={() => go('settings')}>
                        Configurações
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => go('credits')}>
                        Créditos
                    </button>
                    <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                            window.location.search = '?cards=1';
                        }}
                    >
                        Cartas novas (teste)
                    </button>
                </div>
            </div>
            <p className="disclaimer">
                Soccermon v{__APP_VERSION__.replace(/\.0$/, '')} · Fan game sem fins lucrativos, feito por fãs. Pokémon
                e todos os nomes, sprites e sons relacionados são © Nintendo, Game Freak, Creatures Inc. e The Pokémon
                Company. Este projeto não é afiliado nem endossado por eles.
            </p>
        </div>
    );
}
