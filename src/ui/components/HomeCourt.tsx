import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n/react';

/**
 * Quadra animada da Home: alterna cenas curtas (corrida atrás da bola, tabelinha, gol, embaixadinhas), cada
 * uma com Pokémon sorteados. Só CSS (styles.css, `hc-*`); com "reduzir movimento" fica a corrida parada.
 */
type Scene = 'parade' | 'passes' | 'goal' | 'juggle';

const SCENES: { id: Scene; ms: number }[] = [
    { id: 'parade', ms: 9000 },
    { id: 'passes', ms: 8000 },
    { id: 'goal', ms: 6000 },
    { id: 'juggle', ms: 7000 },
];

const PARADE = [25, 4, 7, 1, 133, 143, 150];
const FANS = [25, 4, 7, 1, 133, 39, 52, 54, 35, 58, 77, 104, 79, 120, 129, 132, 151];
const PASSERS = [25, 6, 9, 3, 26, 59, 65, 68, 94, 106, 107, 123, 125, 126, 135, 136, 134, 149, 150, 151];
const STRIKERS = [25, 6, 26, 59, 68, 106, 125, 135, 136, 149, 150];
const KEEPERS = [143, 76, 95, 112, 131, 9, 3, 130];

const pick = (pool: number[], n: number) => [...pool].sort(() => Math.random() - 0.5).slice(0, n);
const sprite = (id: number) => `assets/cards/${id}.gif`;
/** Elenco da cena: na primeira, a corrida clássica dos iniciais; depois, sorteio novo a cada cena. */
function castFor(scene: Scene, step: number): number[] {
    if (scene === 'parade') return step === 0 ? PARADE : pick([...new Set([...PARADE, ...PASSERS, ...FANS])], 7);
    if (scene === 'passes') return pick(PASSERS, 3);
    if (scene === 'goal') return [...pick(STRIKERS, 1), ...pick(KEEPERS, 1)];
    return [...pick(PASSERS, 1), ...pick(FANS, 2)];
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function HomeCourt() {
    const { t } = useT();
    const [step, setStep] = useState(0);
    const scene = SCENES[step % SCENES.length];
    const ids = useMemo(() => castFor(scene.id, step), [scene.id, step]);

    useEffect(() => {
        if (reduced()) return;
        const t = window.setTimeout(() => setStep(step + 1), SCENES[step % SCENES.length].ms);
        return () => window.clearTimeout(t);
    }, [step]);

    return (
        <div className="home-court" aria-hidden>
            <i className="hc-mid" />
            <i className="hc-circle" />
            <i className="hc-area left" />
            <i className="hc-area right" />
            <div key={step} className={`hc-scene hc-${scene.id}`}>
                {scene.id === 'parade' && (
                    <div className="home-parade">
                        <span className="hp-ball" />
                        {ids.map((id, i) => (
                            <img
                                key={id}
                                className="pixel"
                                src={sprite(id)}
                                alt=""
                                style={{ '--i': i } as CSSProperties}
                            />
                        ))}
                    </div>
                )}
                {scene.id === 'passes' && (
                    <>
                        {ids.map((id, i) => (
                            <img key={id} className={`pixel hc-mon p${i}`} src={sprite(id)} alt="" />
                        ))}
                        <span className="hc-ball" />
                    </>
                )}
                {scene.id === 'goal' && (
                    <>
                        <i className="hc-net" />
                        <img className="pixel hc-mon striker" src={sprite(ids[0])} alt="" />
                        <img className="pixel hc-mon keeper" src={sprite(ids[1])} alt="" />
                        <span className="hc-ball" />
                        <b className="hc-gol">{t('match.highlight.goal')}</b>
                    </>
                )}
                {scene.id === 'juggle' && (
                    <>
                        <img className="pixel hc-mon star" src={sprite(ids[0])} alt="" />
                        <img className="pixel hc-mon fan f1" src={sprite(ids[1])} alt="" />
                        <img className="pixel hc-mon fan f2" src={sprite(ids[2])} alt="" />
                        <span className="hc-ball" />
                    </>
                )}
            </div>
        </div>
    );
}
