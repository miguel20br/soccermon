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
    /** Começar outra copa apaga a atual: com uma em andamento, pede confirmação antes. */
    const [confirm, setConfirm] = useState<string | null | undefined>(undefined);
    const start = (seed?: string) => {
        if (inProgress && confirm === undefined) setConfirm(seed ?? null);
        else newRun(name(), seed);
    };
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
                    <b>Semana do tipo {TYPE_PT[eventType] ?? eventType}</b>
                    <span>Cartas Evento do tipo {TYPE_PT[eventType] ?? eventType} podem aparecer no draft.</span>
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
                {confirm !== undefined ? (
                    <div className="confirm-new">
                        <p>
                            Começar outra copa apaga a do <b>{run?.teamName}</b>. Tem certeza?
                        </p>
                        <div className="row" style={{ justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() => newRun(name(), confirm ?? undefined)}
                            >
                                Sim, começar outra
                            </button>
                            <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {inProgress && (
                            <button type="button" className="btn primary" onClick={() => go(resumeScreen)}>
                                Continuar ({run.teamName})
                            </button>
                        )}
                        {challengeSeed && (
                            <button type="button" className="btn yellow" onClick={() => start(challengeSeed)}>
                                Aceitar desafio ({challengeSeed})
                            </button>
                        )}
                        <button
                            type="button"
                            className={`btn ${inProgress ? 'ghost' : 'primary'}`}
                            onClick={() => start()}
                        >
                            Nova copa
                        </button>
                    </>
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
                    {import.meta.env.DEV && (
                        <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => {
                                window.location.search = '?cards=1';
                            }}
                        >
                            Cartas (teste)
                        </button>
                    )}
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
