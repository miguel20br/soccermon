import { useEffect, useRef } from 'react';
import { POSITION_LABEL } from '../../engine/attributes';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { TACTIC_LABEL, type TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { cardSprite } from './PokeCard';

const AUTO_START_MS = 4500;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

function TeamSide({ team, side }: { team: TeamSetup; side: 'home' | 'away' }) {
    const formation = formationOf(team.formation);
    const avg = Math.round(team.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / team.lineup.length);
    return (
        <div className={`vs-side ${side}`} style={{ ['--team' as string]: hex(team.color) }}>
            <div className="vs-team-name">{team.name}</div>
            <div className="vs-meta">
                {formation.name} · {TACTIC_LABEL[team.tactic]} · média <b>{avg}</b>
            </div>
            <div className="vs-squad">
                {team.lineup.map((p, i) => {
                    const v = viewInstance(p);
                    return (
                        <div key={p.uid} className="vs-mon" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                            {p.uid === team.captainUid && <span className="vs-c">C</span>}
                            <img className="pixel" src={cardSprite(p)} alt="" />
                            <span className="vs-mon-name">{v.displayName}</span>
                            <span className="vs-mon-pos">{POSITION_LABEL[formation.slots[i]]}</span>
                        </div>
                    );
                })}
            </div>
            {team.bench.length > 0 && (
                <div className="vs-bench">
                    <span>Banco</span>
                    {team.bench.map((p) => (
                        <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Tela de VERSUS antes de cada partida: os dois times lado a lado. Começa sozinha ou ao tocar. */
export function VersusIntro({
    home,
    away,
    stage,
    ready,
    onDone,
}: {
    home: TeamSetup;
    away: TeamSetup;
    stage: string;
    /** A quadra terminou de carregar: só então começa a contagem para iniciar sozinho. */
    ready: boolean;
    onDone: () => void;
}) {
    // a função pode mudar a cada render da tela; o timer não pode reiniciar por isso
    const done = useRef(onDone);
    done.current = onDone;

    useEffect(() => {
        playSfx('select');
    }, []);

    useEffect(() => {
        if (!ready) return;
        const timer = window.setTimeout(() => done.current(), AUTO_START_MS);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done.current();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', onKey);
        };
    }, [ready]);

    return (
        <div className="vs-overlay" role="dialog" aria-modal="true" aria-label={`${home.name} contra ${away.name}`}>
            <div className="vs-stage">{stage}</div>
            <div className="vs-board">
                <TeamSide team={home} side="home" />
                <div className="vs-badge" aria-hidden>
                    VS
                </div>
                <TeamSide team={away} side="away" />
            </div>
            <button type="button" className="btn primary vs-start" onClick={onDone}>
                {ready ? 'Começar!' : 'Carregando a quadra…'}
            </button>
            {ready && <div className="vs-progress" style={{ animationDuration: `${AUTO_START_MS}ms` }} />}
        </div>
    );
}
