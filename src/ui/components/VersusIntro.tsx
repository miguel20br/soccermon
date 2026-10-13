import { type CSSProperties, useEffect, useRef } from 'react';
import { POSITION_LABEL } from '../../engine/attributes';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { TACTIC_LABEL, type TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { RARITY } from '../rarity';
import { cardSprite } from './PokeCard';
import './versus.css';

const AUTO_START_MS = 4500;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Os titulares de um time em fila diagonal, do canto rumo ao centro: o capitão na frente (perto do VS),
 * os outros diminuindo pra dar profundidade. Pousam um a um, do fundo pra frente.
 */
function Squad({ team, side }: { team: TeamSetup; side: 'home' | 'away' }) {
    const formation = formationOf(team.formation);
    // capitão primeiro (frente); o resto na ordem da formação
    const order = team.lineup
        .map((p, slot) => ({ p, slot }))
        .sort((a, b) => Number(b.p.uid === team.captainUid) - Number(a.p.uid === team.captainUid));
    const last = order.length - 1;
    return (
        <>
            {order.map(({ p, slot }, i) => {
                const v = viewInstance(p);
                const tier = species(p.speciesId).tier;
                const style = {
                    '--i': i,
                    '--d': `${0.3 + (last - i) * 0.1}s`,
                    '--rar': RARITY[tier].color,
                    zIndex: 20 - i,
                } as CSSProperties;
                return (
                    <div key={p.uid} className={`vsd-mon ${side}`} style={style}>
                        <div className="vsd-fig">
                            <span className="vsd-ring" />
                            <img className="pixel" src={cardSprite(p)} alt="" draggable={false} />
                        </div>
                        <span className="vsd-dust" />
                        <div className="vsd-label">
                            {p.uid === team.captainUid && <span className="vsd-c">C</span>}
                            <b>{v.displayName}</b>
                            <span>{POSITION_LABEL[formation.slots[slot]]}</span>
                        </div>
                    </div>
                );
            })}
        </>
    );
}

function Band({ team, side }: { team: TeamSetup; side: 'home' | 'away' }) {
    const formation = formationOf(team.formation);
    const avg = Math.round(team.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / team.lineup.length);
    return (
        <div className={`vsd-band ${side}`}>
            <div className="vsd-band-name">{team.name}</div>
            <div className="vsd-band-meta">
                {formation.name} · {TACTIC_LABEL[team.tactic]} · média <b>{avg}</b>
            </div>
            {team.bench.length > 0 && (
                <div className="vsd-bench">
                    <span>Banco</span>
                    {team.bench.map((p) => (
                        <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Tela de VERSUS antes de cada partida: a tela partida na diagonal nas cores dos times, cada time em fila
 * diagonal encarando o outro, e o VS no meio da linha. Começa sozinha (com a quadra pronta) ou ao tocar.
 */
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

    const style = { '--home': hex(home.color), '--away': hex(away.color) } as CSSProperties;

    return (
        <div
            className="vs-overlay vsd"
            style={style}
            role="dialog"
            aria-modal="true"
            aria-label={`${home.name} contra ${away.name}`}
        >
            <div className="vsd-scene">
                <div className="vsd-half away" />
                <div className="vsd-half home" />
                <svg className="vsd-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <line className="vsd-divider wide" x1="0" y1="0" x2="100" y2="100" />
                    <line className="vsd-divider tall" x1="0" y1="40" x2="100" y2="60" />
                    <polyline
                        className="vsd-bolt wide"
                        points="30,27 41,43 38,44 50,55 47,56 62,72 52,56 55,55 44,44 47,43"
                    />
                    <polyline
                        className="vsd-bolt tall"
                        points="20,45 36,49 34,51 52,53 50,55 80,56 54,51 56,50 38,47 40,46"
                    />
                </svg>
                <Band team={away} side="away" />
                <Band team={home} side="home" />
                <Squad team={away} side="away" />
                <Squad team={home} side="home" />
                <div className="vsd-vs" aria-hidden>
                    VS
                </div>
                <div className="vs-stage vsd-stage">{stage}</div>
            </div>
            <div className="vsd-flash" />
            <button type="button" className="btn primary vs-start" onClick={onDone}>
                {ready ? 'Começar!' : 'Carregando a quadra…'}
            </button>
            {ready && <div className="vs-progress" style={{ animationDuration: `${AUTO_START_MS}ms` }} />}
        </div>
    );
}
