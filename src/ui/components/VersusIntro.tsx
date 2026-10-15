import { type CSSProperties, useEffect, useRef } from 'react';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { TACTIC_LABEL, type TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { rivalColor } from '../../store/profile';
import { useClubColor } from '../profile/club';
import { cardSprite } from './PokeCard';
import './versus.css';

const AUTO_START_MS = 4500;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** Tamanho natural moderado: o Pikachu fica um pouco menor que o Dragonite, sem sumir. */
const sizeOf = (heightm: number) => Math.min(1.1, Math.max(0.86, 0.94 + 0.1 * Math.log2(Math.max(0.1, heightm))));

/**
 * Onde cada Pokémon fica, do da frente (0, o capitão) ao do fundo: x/y = centro do pé em % da tela, h = altura.
 * Cada fila sobe rumo à linha sem cruzá-la (a linha é inclinada, então os lados não são espelho um do outro).
 * Paisagem: h em vh. Retrato (celular): h em vw; os da frente ficam cortados pela borda, como num pôster.
 */
type Spot = { x: number; y: number; h: number };
const LAND: Record<'home' | 'away', Spot[]> = {
    home: [
        { x: 19, y: 110, h: 58 },
        { x: 28, y: 85, h: 40 },
        { x: 35, y: 67, h: 30 },
        { x: 41, y: 55, h: 23 },
        { x: 45, y: 44, h: 18 },
    ],
    away: [
        { x: 81, y: 110, h: 58 },
        { x: 70, y: 85, h: 40 },
        { x: 64, y: 67, h: 30 },
        { x: 60, y: 55, h: 23 },
        { x: 58, y: 44, h: 18 },
    ],
};
const PORT: Record<'home' | 'away', Spot[]> = {
    home: [
        { x: 10, y: 104, h: 62 },
        { x: 16, y: 84, h: 44 },
        { x: 24, y: 70, h: 34 },
        { x: 30, y: 58, h: 27 },
        { x: 36, y: 48, h: 21 },
    ],
    away: [
        { x: 90, y: 104, h: 62 },
        { x: 82, y: 84, h: 44 },
        { x: 74, y: 70, h: 34 },
        { x: 68, y: 58, h: 27 },
        { x: 63, y: 48, h: 21 },
    ],
};

/**
 * Um time em fila diagonal com profundidade, como num pôster de filme: o capitão grande na frente
 * (cortado pela borda de baixo), os outros subindo rumo à linha e diminuindo. Todos encaram o rival.
 */
function Crowd({ team, side }: { team: TeamSetup; side: 'home' | 'away' }) {
    const order = team.lineup
        .map((p) => ({ p, ovr: viewInstance(p).overall }))
        .sort((a, b) => Number(b.p.uid === team.captainUid) - Number(a.p.uid === team.captainUid) || b.ovr - a.ovr)
        .map(({ p }) => p);
    return (
        <div className={`vsp-crowd ${side}`}>
            {order.map((p, i) => {
                const land = LAND[side][Math.min(i, 4)];
                const port = PORT[side][Math.min(i, 4)];
                const sz = sizeOf(species(p.speciesId).heightm);
                const style = {
                    '--lx': `${land.x}%`,
                    '--ly': `${land.y}%`,
                    '--lh': `${land.h * sz}vh`,
                    '--px': `${port.x}%`,
                    '--py': `${port.y}%`,
                    '--ph': `${port.h * sz}vw`,
                    '--d': `${0.12 + (order.length - 1 - i) * 0.07}s`,
                    zIndex: 30 - i,
                } as CSSProperties;
                return (
                    <img
                        key={p.uid}
                        className={`vsp-mon pixel depth-${i}`}
                        style={style}
                        src={cardSprite(p)}
                        alt={viewInstance(p).displayName}
                        draggable={false}
                    />
                );
            })}
        </div>
    );
}

function Band({ team, side }: { team: TeamSetup; side: 'home' | 'away' }) {
    const formation = formationOf(team.formation);
    const avg = Math.round(team.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / team.lineup.length);
    return (
        <div className={`vsp-band ${side}`}>
            <div className="vsp-who">{side === 'home' ? 'Seu time' : 'Rival'}</div>
            <div className="vsp-name">{team.name}</div>
            <div className="vsp-meta">
                <span className="vsp-form">
                    {formation.name} · {TACTIC_LABEL[team.tactic]} ·{' '}
                </span>
                média <b>{avg}</b>
            </div>
        </div>
    );
}

/**
 * Tela de VERSUS antes de cada partida, estilo pôster de confronto: a tela partida por uma linha diagonal
 * de luz, cada time numa fila diagonal com profundidade encarando o outro, e o VS no alto da linha.
 * Tudo anima uma vez só (sem brilho infinito nem filtros pesados). Começa sozinha ou ao tocar.
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

    // seu time sempre na cor do clube (Perfil); o rival no uniforme reserva se as cores baterem
    const homeColor = useClubColor();
    const style = {
        '--home': hex(homeColor),
        '--away': hex(rivalColor(homeColor, away.color)),
    } as CSSProperties;

    return (
        <div
            className="vs-overlay vsp"
            style={style}
            role="dialog"
            aria-modal="true"
            aria-label={`${home.name} contra ${away.name}`}
        >
            <div className="vsp-half home" />
            <div className="vsp-half away" />
            {/* a linha de luz: traços sobrepostos do largo/transparente ao fino/branco (brilho sem filtro) */}
            <svg className="vsp-beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                {(
                    [
                        ['land', 60, 40],
                        ['port', 64, 36],
                    ] as const
                ).map(([cls, x0, x1]) => (
                    <g key={cls} className={cls}>
                        {['glow-3', 'glow-2', 'glow-1', 'core'].map((c) => (
                            <line key={c} className={c} x1={x0} y1={-2} x2={x1} y2={102} />
                        ))}
                    </g>
                ))}
            </svg>
            <div className="vsp-light" />
            <Crowd team={away} side="away" />
            <Crowd team={home} side="home" />
            <div className="vsp-shade" />
            <Band team={home} side="home" />
            <Band team={away} side="away" />
            <div className="vs-stage vsp-stage">{stage}</div>
            <div className="vsp-vs" aria-hidden>
                VS
            </div>
            <div className="vsp-flash" />
            <button type="button" className="btn primary vs-start" onClick={onDone}>
                {ready ? 'Começar!' : 'Carregando a quadra…'}
            </button>
            {ready && <div className="vs-progress" style={{ animationDuration: `${AUTO_START_MS}ms` }} />}
        </div>
    );
}
