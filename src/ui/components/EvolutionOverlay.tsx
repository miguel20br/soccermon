import { useCallback, useEffect, useRef, useState } from 'react';
import { type AttrKey, computeAttributes, eligiblePositions, positionRating } from '../../engine/attributes';
import { species } from '../../engine/data';
import { DEFAULT_LEVEL } from '../../engine/instance';
import { playCry, playSfx } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchEvolution } from '../../game/scenes/MatchScene';
import { useGame } from '../../store/game-store';
import { cardSprite } from './PokeCard';

/**
 * Evolução em tela cheia, como nos jogos: "O quê? X está evoluindo!", silhueta branca alternando entre a forma
 * antiga e a nova (devagar no começo, acelerando), clarão e a forma nova com os atributos que subiram.
 * A partida fica parada até aqui terminar ('match:evolution-done'). Um toque pula para o fim / fecha.
 */
type Phase = 'intro' | 'morph' | 'flash' | 'done';

const INTRO_MS = 1400;
/** Intervalos da alternância antiga/nova (ms): ~5 s, acelerando. */
const MORPH = [520, 470, 420, 380, 340, 300, 260, 230, 200, 175, 150, 130, 115, 100, 90, 80, 70, 65, 60, 60, 60, 60];
const FLASH_MS = 450;
const DONE_MS = 3600;

const STATS: [AttrKey, string][] = [
    ['pace', 'VEL'],
    ['shooting', 'CHU'],
    ['passing', 'PAS'],
    ['dribble', 'DRI'],
    ['tackling', 'DES'],
    ['strength', 'FOR'],
];

// uma tela de evolução por vez: os timers da animação ficam aqui
let timers: number[] = [];
const clear = () => {
    for (const t of timers) clearTimeout(t);
    timers = [];
};
const later = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
};

function cardOf(id: number) {
    const a = computeAttributes(species(id), DEFAULT_LEVEL);
    return { attrs: a, overall: positionRating(a, eligiblePositions(a, id)[0]) };
}

export function EvolutionOverlay() {
    const [evo, setEvo] = useState<MatchEvolution | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const [phase, setPhase] = useState<Phase>('intro');
    const [showNew, setShowNew] = useState(false);
    const finish = useCallback(() => {
        clear();
        setEvo(null);
        EventBus.emit('match:evolution-done');
    }, []);

    const reveal = useCallback(
        (e: MatchEvolution) => {
            clear();
            setPhase('flash');
            setShowNew(true);
            playSfx('goal');
            later(FLASH_MS, () => {
                setPhase('done');
                playCry(e.into, useGame.getState().settings.cries, 1.1);
                later(DONE_MS, finish);
            });
        },
        [finish],
    );

    useEffect(() => {
        const onEvolution = (e: MatchEvolution) => {
            clear();
            setEvo(e);
            setPhase('intro');
            setShowNew(false);
            playSfx('status');
            playCry(e.from, useGame.getState().settings.cries, 0.9);
            later(INTRO_MS, () => setPhase('morph'));
            let at = INTRO_MS;
            MORPH.forEach((dt, i) => {
                at += dt;
                later(at, () => setShowNew(i % 2 === 0));
            });
            later(at + 120, () => reveal(e));
        };
        EventBus.on('match:evolution', onEvolution);
        return () => {
            EventBus.off('match:evolution', onEvolution);
            clear();
        };
    }, [reveal]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: foca quando uma evolução nova aparece
    useEffect(() => {
        if (evo) boxRef.current?.focus();
    }, [evo?.from, evo?.into]);

    if (!evo) return null;
    const before = cardOf(evo.from);
    const after = cardOf(evo.into);
    const tap = () => (phase === 'done' ? finish() : phase !== 'flash' ? reveal(evo) : undefined);
    const silhouette = phase === 'morph' || phase === 'flash';

    return (
        <div
            ref={boxRef}
            className={`evo-overlay evo-phase-${phase}`}
            onClick={tap}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                    e.preventDefault();
                    tap();
                }
            }}
            role="dialog"
            aria-label="Evolução"
            tabIndex={-1}
        >
            <div className="evo-rays" aria-hidden />
            <div className="evo-stage">
                <img
                    className={`pixel evo-mon${silhouette ? ' white' : ''}${showNew ? ' hidden' : ''}`}
                    src={cardSprite({ speciesId: evo.from, shiny: evo.shiny })}
                    alt=""
                />
                <img
                    className={`pixel evo-mon new${silhouette ? ' white' : ''}${showNew ? '' : ' hidden'}`}
                    src={cardSprite({ speciesId: evo.into, shiny: evo.shiny })}
                    alt=""
                />
            </div>
            {phase === 'done' && (
                <div className="evo-stats">
                    <div className="evo-ovr">
                        <span>{before.overall}</span>
                        <b>→ {after.overall}</b>
                    </div>
                    {STATS.map(([k, label]) => {
                        const d = Math.round(after.attrs[k] - before.attrs[k]);
                        return (
                            <div key={k} className="evo-stat">
                                <span>{label}</span>
                                <b>{Math.round(after.attrs[k])}</b>
                                {d !== 0 && <em className={d > 0 ? 'up' : 'down'}>{d > 0 ? `▲ +${d}` : `▼ ${d}`}</em>}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="evo-text">
                <span>
                    {phase === 'done' ? (
                        <>
                            Parabéns! <b>{evo.name}</b> evoluiu para <b>{species(evo.into).name}</b>!
                        </>
                    ) : (
                        <>
                            O quê? <b>{evo.name}</b> está evoluindo!
                        </>
                    )}
                </span>
                <small>{phase === 'done' ? 'toque para continuar' : 'toque para pular'}</small>
            </div>
            <div className="evo-flash" aria-hidden />
        </div>
    );
}
